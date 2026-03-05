#!/usr/bin/env node

/**
 * Optimized Batch Vehicle Import - Direct Supabase Integration
 * Uses batch inserts with proper conflict handling
 * 300,000+ vehicle variants with parallel processing
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const CONFIG = {
  BATCH_SIZE: 50,
  TOTAL_VEHICLES: 10000, // Start with 10k for testing
  CONCURRENT_AGENTS: 4,
};

CONFIG.TOTAL_BATCHES = Math.ceil(CONFIG.TOTAL_VEHICLES / CONFIG.BATCH_SIZE);

let progressData = {
  startTime: Date.now(),
  totalBatches: CONFIG.TOTAL_BATCHES,
  completedBatches: 0,
  totalInserted: 0,
  failedBatches: [],
};

/**
 * Generate vehicle batch
 */
function generateVehicleBatch(batchId, batchSize) {
  const vehicles = [];
  const manufacturers = [
    'Volkswagen', 'Audi', 'BMW', 'Mercedes-Benz', 'Skoda',
    'Seat', 'Ford', 'Hyundai', 'Kia', 'Renault', 'Peugeot',
    'Fiat', 'Opel', 'Citroen', 'Toyota', 'Honda', 'Mazda',
    'Subaru', 'Volvo', 'Jaguar', 'Land Rover', 'Nissan',
    'Lexus', 'Infiniti', 'Acura',
  ];

  const startIdx = batchId * batchSize;

  for (let i = 0; i < batchSize; i++) {
    const idx = startIdx + i;
    const mfrIdx = idx % manufacturers.length;

    vehicles.push({
      manufacturer: manufacturers[mfrIdx],
      model: `Model_${idx.toString().padStart(6, '0')}`,
      year: 2000 + (idx % 24),
      engine_code: `ENG_${idx.toString().padStart(6, '0')}`,
      engine_name: `${(1.2 + (idx % 30) * 0.1).toFixed(1)}L Engine`,
      power_kw: 50 + (idx % 200),
      fuel_type: ['Petrol', 'Diesel', 'Hybrid', 'Electric'][idx % 4],
      transmission: ['Manual', 'Automatic'][idx % 2],
    });
  }

  return vehicles;
}

/**
 * Insert batch with optimized logic
 */
async function insertBatch(batch, batchId) {
  try {
    let inserted = 0;

    // Step 1: Insert manufacturers (batch)
    const mfrNames = [...new Set(batch.map(v => v.manufacturer))];
    const { data: mfrs, error: mfrError } = await supabase
      .from('manufacturers')
      .upsert(
        mfrNames.map(name => ({ name, country: '' })),
        { onConflict: 'name' }
      )
      .select('id, name');

    if (mfrError) {
      console.error(`Batch ${batchId} manufacturer error:`, mfrError.message);
      return 0;
    }

    const mfrMap = new Map(mfrs.map(m => [m.name, m.id]));

    // Step 2: Insert models (batch)
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

    const { data: models, error: modelError } = await supabase
      .from('models')
      .upsert(modelsToInsert, { onConflict: 'manufacturer_id,name' })
      .select('id, manufacturer_id, name');

    if (modelError) {
      console.error(`Batch ${batchId} model error:`, modelError.message);
      return 0;
    }

    const modelMap = new Map(
      models.map(m => [`${m.manufacturer_id}_${m.name}`, m.id])
    );

    // Step 3: Insert engines (batch)
    const engineCodes = [...new Set(batch.map(v => v.engine_code))];
    const engineData = batch.reduce((acc, v) => {
      if (!acc.find(e => e.engine_code === v.engine_code)) {
        acc.push({
          engine_code: v.engine_code,
          engine_name: v.engine_name,
          power_kw: v.power_kw,
          fuel_type: v.fuel_type,
          transmission: v.transmission,
        });
      }
      return acc;
    }, []);

    const { data: engines, error: engineError } = await supabase
      .from('engines')
      .upsert(engineData, { onConflict: 'engine_code' })
      .select('id, engine_code');

    if (engineError) {
      console.error(`Batch ${batchId} engine error:`, engineError.message);
      return 0;
    }

    const engineMap = new Map(engines.map(e => [e.engine_code, e.id]));

    // Step 4: Insert vehicle variants (batch)
    const variantsToInsert = batch.map(v => ({
      engine_id: engineMap.get(v.engine_code),
      year: v.year,
      power_kw: v.power_kw,
      fuel_type: v.fuel_type,
      transmission: v.transmission,
    })).filter(v => v.engine_id);

    if (variantsToInsert.length > 0) {
      const { error: variantError } = await supabase
        .from('vehicleVariants')
        .upsert(variantsToInsert, { onConflict: 'engine_id,year' });

      if (variantError) {
        console.warn(`Batch ${batchId} variant warning:`, variantError.message);
      }

      inserted = variantsToInsert.length;
    }

    return inserted;
  } catch (error) {
    console.error(`Batch ${batchId} error:`, error.message);
    return 0;
  }
}

/**
 * Agent - processes batches in parallel
 */
async function agent(agentId, batchQueue) {
  while (batchQueue.length > 0) {
    const batchId = batchQueue.shift();
    if (batchId === undefined) break;

    try {
      console.log(`🤖 Agent ${agentId} processing batch ${batchId}/${CONFIG.TOTAL_BATCHES - 1}...`);

      const batch = generateVehicleBatch(batchId, CONFIG.BATCH_SIZE);
      const inserted = await insertBatch(batch, batchId);

      progressData.completedBatches++;
      progressData.totalInserted += inserted;

      if (progressData.completedBatches % 10 === 0) {
        const progress = ((progressData.completedBatches / CONFIG.TOTAL_BATCHES) * 100).toFixed(1);
        console.log(`✅ Progress: ${progressData.completedBatches}/${CONFIG.TOTAL_BATCHES} (${progress}%) - ${progressData.totalInserted} vehicles`);
      }
    } catch (error) {
      progressData.failedBatches.push(batchId);
      console.error(`❌ Agent ${agentId} batch ${batchId} failed:`, error.message);
    }
  }
}

/**
 * Main orchestrator
 */
async function orchestrateImport() {
  console.log(`
🚀 BATCH VEHICLE IMPORT - Optimized Supabase Integration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Target:         ${CONFIG.TOTAL_VEHICLES.toLocaleString()} vehicles
Batch Size:     ${CONFIG.BATCH_SIZE}
Total Batches:  ${CONFIG.TOTAL_BATCHES}
Concurrent:     ${CONFIG.CONCURRENT_AGENTS} agents
Supabase:       ${SUPABASE_URL.split('/')[2]}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);

  const batchQueue = Array.from({ length: CONFIG.TOTAL_BATCHES }, (_, i) => i);

  const agents = Array.from({ length: CONFIG.CONCURRENT_AGENTS }, (_, agentId) =>
    agent(agentId, batchQueue)
  );

  console.log(`🤖 Spawned ${CONFIG.CONCURRENT_AGENTS} agents...`);

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

  const reportPath = path.join(__dirname, '../import-progress.json');
  fs.writeFileSync(reportPath, JSON.stringify(progressData, null, 2));
  console.log(`📄 Progress report: ${reportPath}`);

  process.exit(progressData.failedBatches.length > 0 ? 1 : 0);
}

orchestrateImport().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
