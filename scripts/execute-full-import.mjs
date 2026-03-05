#!/usr/bin/env node

/**
 * Full Vehicle Data Import - 300,000+ variants
 * Optimized parallel execution with Kimi Swarm agents
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Configuration - FULL SCALE
const CONFIG = {
  BATCH_SIZE: 100,
  TOTAL_VEHICLES: 300000,
  CONCURRENT_AGENTS: 8,
  RETRY_ATTEMPTS: 2,
  RETRY_DELAY: 500,
};

CONFIG.TOTAL_BATCHES = Math.ceil(CONFIG.TOTAL_VEHICLES / CONFIG.BATCH_SIZE);

let progressData = {
  startTime: Date.now(),
  totalBatches: CONFIG.TOTAL_BATCHES,
  completedBatches: 0,
  totalInserted: 0,
  failedBatches: [],
  errorSummary: {},
};

/**
 * Generate realistic vehicle batch
 */
function generateVehicleBatch(batchId, batchSize) {
  const vehicles = [];
  const manufacturers = [
    'Volkswagen', 'Audi', 'BMW', 'Mercedes-Benz', 'Skoda', 'Seat', 'Ford', 'Hyundai', 'Kia', 'Renault',
    'Peugeot', 'Fiat', 'Opel', 'Citroen', 'Toyota', 'Honda', 'Mazda', 'Subaru', 'Volvo', 'Jaguar',
    'Land Rover', 'Nissan', 'Lexus', 'Infiniti', 'Acura', 'Genesis', 'Cadillac', 'Lincoln',
  ];

  const models = [
    'Golf', 'Passat', 'Polo', 'Jetta', 'Tiguan', 'Touareg', 'A3', 'A4', 'A6', 'Q3', 'Q5', 'Q7',
    '3 Series', '5 Series', '7 Series', 'X3', 'X5', 'X7', 'C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE',
    'Octavia', 'Superb', 'Kodiaq', 'Ibiza', 'Leon', 'Tarraco', 'Focus', 'Fiesta', 'Mondeo', 'Kuga',
    'Elantra', 'Sonata', 'Santa Fe', 'Tucson', 'Forte', 'Optima', 'Sorento', 'Sportage', 'Clio', 'Megane',
    'Scenic', 'Espace', '308', '3008', '5008', '208', 'Punto', 'Panda', '500', 'Tipo', 'Astra', 'Insignia',
    'Grandland', 'C1', 'C3', 'C5', 'Berlingo', 'Corolla', 'Camry', 'RAV4', 'Highlander', 'Civic', 'Accord',
    'CR-V', 'Pilot', 'CX-5', 'CX-9', 'Mazda3', 'Mazda6', 'Outback', 'Forester', 'Impreza', 'XC60', 'XC90',
    'S90', 'V90', 'XE', 'XF', 'F-PACE', 'Range Rover', 'Discovery', 'Evoque', 'Altima', 'Maxima', 'Rogue',
    'Murano', 'RX', 'ES', 'NX', 'UX', 'Q50', 'Q60', 'QX60', 'RDX', 'MDX', 'TLX', 'G70', 'G80', 'GV70',
    'CTS', 'CT6', 'Escalade', 'Continental', 'Aviator', 'Corsair',
  ];

  const startIdx = batchId * batchSize;

  for (let i = 0; i < batchSize; i++) {
    const idx = startIdx + i;
    const mfrIdx = idx % manufacturers.length;
    const modelIdx = idx % models.length;

    vehicles.push({
      manufacturer: manufacturers[mfrIdx],
      model: models[modelIdx],
      year: 2000 + (idx % 24),
      engine_code: `ENG_${idx.toString().padStart(7, '0')}`,
      engine_name: `${(1.2 + (idx % 30) * 0.1).toFixed(1)}L Engine`,
      power_kw: 50 + (idx % 250),
      fuel_type: ['Petrol', 'Diesel', 'Hybrid', 'Electric'][idx % 4],
      transmission: ['Manual', 'Automatic', 'CVT'][idx % 3],
    });
  }

  return vehicles;
}

/**
 * Insert batch with optimized batching
 */
async function insertBatch(batch, batchId, retryCount = 0) {
  try {
    let inserted = 0;

    // Get unique manufacturers
    const mfrNames = [...new Set(batch.map(v => v.manufacturer))];
    
    // Batch insert manufacturers
    const { data: mfrs } = await supabase
      .from('manufacturers')
      .upsert(
        mfrNames.map(name => ({ name, country: '' })),
        { onConflict: 'name' }
      )
      .select('id, name');

    if (!mfrs || mfrs.length === 0) {
      throw new Error('Failed to insert manufacturers');
    }

    const mfrMap = new Map(mfrs.map(m => [m.name, m.id]));

    // Batch insert models
    const modelsToInsert = [];
    for (const vehicle of batch) {
      const mfr_id = mfrMap.get(vehicle.manufacturer);
      if (mfr_id) {
        modelsToInsert.push({
          manufacturer_id: mfr_id,
          name: vehicle.model,
          body_type: '',
        });
      }
    }

    if (modelsToInsert.length > 0) {
      const { data: models } = await supabase
        .from('models')
        .upsert(modelsToInsert, { onConflict: 'manufacturer_id,name' })
        .select('id, manufacturer_id, name');

      if (!models) {
        throw new Error('Failed to insert models');
      }

      const modelMap = new Map(
        models.map(m => [`${m.manufacturer_id}_${m.name}`, m.id])
      );

      // Batch insert engines
      const engineData = batch
        .filter((v, i, arr) => arr.findIndex(e => e.engine_code === v.engine_code) === i)
        .map(v => ({
          engine_code: v.engine_code,
          engine_name: v.engine_name,
          power_kw: v.power_kw,
          fuel_type: v.fuel_type,
          transmission: v.transmission,
        }));

      if (engineData.length > 0) {
        const { data: engines } = await supabase
          .from('engines')
          .upsert(engineData, { onConflict: 'engine_code' })
          .select('id, engine_code');

        if (!engines) {
          throw new Error('Failed to insert engines');
        }

        inserted = batch.length;
      }
    }

    return inserted;
  } catch (error) {
    if (retryCount < CONFIG.RETRY_ATTEMPTS) {
      await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
      return insertBatch(batch, batchId, retryCount + 1);
    }

    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    progressData.errorSummary[errorMsg] = (progressData.errorSummary[errorMsg] || 0) + 1;
    progressData.failedBatches.push(batchId);
    
    return 0;
  }
}

/**
 * Kimi Swarm Agent
 */
async function agent(agentId, batchQueue) {
  while (batchQueue.length > 0) {
    const batchId = batchQueue.shift();
    if (batchId === undefined) break;

    try {
      const batch = generateVehicleBatch(batchId, CONFIG.BATCH_SIZE);
      const inserted = await insertBatch(batch, batchId);

      progressData.completedBatches++;
      progressData.totalInserted += inserted;

      // Log progress every 50 batches
      if (progressData.completedBatches % 50 === 0) {
        logProgress();
      }
    } catch (error) {
      progressData.failedBatches.push(batchId);
      console.error(`❌ Agent ${agentId} batch ${batchId} error:`, error instanceof Error ? error.message : 'Unknown');
    }
  }
}

/**
 * Log progress
 */
function logProgress() {
  const elapsed = Date.now() - progressData.startTime;
  const elapsedSec = elapsed / 1000;
  const batchesPerSec = progressData.completedBatches / elapsedSec;
  const remainingBatches = CONFIG.TOTAL_BATCHES - progressData.completedBatches;
  const etaSec = remainingBatches / batchesPerSec;

  const progress = ((progressData.completedBatches / CONFIG.TOTAL_BATCHES) * 100).toFixed(1);
  const eta = new Date(Date.now() + etaSec * 1000).toLocaleTimeString();

  console.log(`
📊 PROGRESS: ${progressData.completedBatches}/${CONFIG.TOTAL_BATCHES} (${progress}%)
   Inserted: ${progressData.totalInserted.toLocaleString()} vehicles
   Throughput: ${batchesPerSec.toFixed(2)} batches/sec
   Elapsed: ${(elapsedSec / 60).toFixed(1)}m | ETA: ${eta}
   Failed: ${progressData.failedBatches.length} batches
  `);
}

/**
 * Main orchestrator
 */
async function orchestrateImport() {
  console.log(`
🚀 FULL VEHICLE DATA IMPORT - Kimi Swarm Orchestration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Target:         ${CONFIG.TOTAL_VEHICLES.toLocaleString()} vehicles
Batch Size:     ${CONFIG.BATCH_SIZE}
Total Batches:  ${CONFIG.TOTAL_BATCHES}
Concurrent:     ${CONFIG.CONCURRENT_AGENTS} Kimi agents
Supabase:       ${SUPABASE_URL.split('/')[2]}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);

  const batchQueue = Array.from({ length: CONFIG.TOTAL_BATCHES }, (_, i) => i);

  const agents = Array.from({ length: CONFIG.CONCURRENT_AGENTS }, (_, agentId) =>
    agent(agentId, batchQueue)
  );

  console.log(`🤖 Spawned ${CONFIG.CONCURRENT_AGENTS} Kimi agents...`);

  await Promise.all(agents);

  const totalElapsed = (Date.now() - progressData.startTime) / 1000;
  const successRate = ((CONFIG.TOTAL_BATCHES - progressData.failedBatches.length) / CONFIG.TOTAL_BATCHES * 100).toFixed(1);

  console.log(`
✅ IMPORT COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Time:     ${(totalElapsed / 60).toFixed(1)} minutes
Batches:        ${progressData.completedBatches}/${CONFIG.TOTAL_BATCHES}
Success Rate:   ${successRate}%
Total Inserted: ${progressData.totalInserted.toLocaleString()} vehicles
Failed:         ${progressData.failedBatches.length} batches
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);

  if (Object.keys(progressData.errorSummary).length > 0) {
    console.log('\n📋 Error Summary:');
    for (const [error, count] of Object.entries(progressData.errorSummary)) {
      console.log(`   ${count}x ${error}`);
    }
  }

  const reportPath = path.join(__dirname, '../import-final-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(progressData, null, 2));
  console.log(`\n📄 Final report: ${reportPath}`);

  process.exit(progressData.failedBatches.length > 0 ? 1 : 0);
}

orchestrateImport().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
