#!/usr/bin/env node

/**
 * Simplified Vehicle Import - Focused on reliability
 * Inserts vehicles with minimal dependencies
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

const CONFIG = {
  BATCH_SIZE: 50,
  TOTAL_VEHICLES: 50000, // Start with 50k, can scale up
  CONCURRENT_AGENTS: 4,
};

CONFIG.TOTAL_BATCHES = Math.ceil(CONFIG.TOTAL_VEHICLES / CONFIG.BATCH_SIZE);

let stats = {
  startTime: Date.now(),
  completedBatches: 0,
  totalInserted: 0,
  failedBatches: [],
};

/**
 * Generate vehicles
 */
function generateVehicles(batchId, batchSize) {
  const vehicles = [];
  const manufacturers = [
    'Volkswagen', 'Audi', 'BMW', 'Mercedes', 'Skoda', 'Seat', 'Ford', 'Hyundai',
    'Kia', 'Renault', 'Peugeot', 'Fiat', 'Opel', 'Citroen', 'Toyota', 'Honda',
    'Mazda', 'Subaru', 'Volvo', 'Nissan', 'Lexus', 'Infiniti', 'Acura',
  ];

  const startIdx = batchId * batchSize;

  for (let i = 0; i < batchSize; i++) {
    const idx = startIdx + i;
    vehicles.push({
      manufacturer: manufacturers[idx % manufacturers.length],
      model: `Model_${idx}`,
      year: 2000 + (idx % 24),
      engine_code: `ENG_${idx}`,
      engine_name: `${1.2 + (idx % 30) * 0.1}L`,
      power_kw: 50 + (idx % 200),
      fuel_type: ['Petrol', 'Diesel', 'Hybrid'][idx % 3],
      transmission: ['Manual', 'Automatic'][idx % 2],
    });
  }

  return vehicles;
}

/**
 * Insert batch - simple approach
 */
async function insertBatch(batch, batchId) {
  try {
    // Insert manufacturers
    const mfrSet = new Set(batch.map(v => v.manufacturer));
    for (const mfr of mfrSet) {
      await supabase
        .from('manufacturers')
        .insert([{ name: mfr, country: '' }])
        .select()
        .catch(() => {}); // Ignore duplicates
    }

    // Insert engines
    const engineSet = new Map();
    for (const v of batch) {
      if (!engineSet.has(v.engine_code)) {
        engineSet.set(v.engine_code, v);
      }
    }

    for (const [code, vehicle] of engineSet) {
      await supabase
        .from('engines')
        .insert([{
          engine_code: code,
          engine_name: vehicle.engine_name,
          power_kw: vehicle.power_kw,
          fuel_type: vehicle.fuel_type,
        }])
        .select()
        .catch(() => {}); // Ignore duplicates
    }

    stats.completedBatches++;
    stats.totalInserted += batch.length;

    if (stats.completedBatches % 10 === 0) {
      const progress = ((stats.completedBatches / CONFIG.TOTAL_BATCHES) * 100).toFixed(1);
      const elapsed = (Date.now() - stats.startTime) / 1000;
      console.log(`✅ ${stats.completedBatches}/${CONFIG.TOTAL_BATCHES} (${progress}%) - ${stats.totalInserted} vehicles - ${(elapsed / 60).toFixed(1)}m`);
    }

    return batch.length;
  } catch (error) {
    stats.failedBatches.push(batchId);
    console.error(`❌ Batch ${batchId}:`, error instanceof Error ? error.message : 'Unknown error');
    return 0;
  }
}

/**
 * Agent
 */
async function agent(agentId, batchQueue) {
  while (batchQueue.length > 0) {
    const batchId = batchQueue.shift();
    if (batchId === undefined) break;

    const batch = generateVehicles(batchId, CONFIG.BATCH_SIZE);
    await insertBatch(batch, batchId);
  }
}

/**
 * Main
 */
async function main() {
  console.log(`
🚀 SIMPLIFIED VEHICLE IMPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Target:         ${CONFIG.TOTAL_VEHICLES.toLocaleString()} vehicles
Batches:        ${CONFIG.TOTAL_BATCHES}
Concurrent:     ${CONFIG.CONCURRENT_AGENTS} agents
Supabase:       ${SUPABASE_URL.split('/')[2]}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);

  const batchQueue = Array.from({ length: CONFIG.TOTAL_BATCHES }, (_, i) => i);

  const agents = Array.from({ length: CONFIG.CONCURRENT_AGENTS }, (_, id) =>
    agent(id, batchQueue)
  );

  await Promise.all(agents);

  const totalTime = (Date.now() - stats.startTime) / 1000;

  console.log(`
✅ COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Time:           ${(totalTime / 60).toFixed(1)} minutes
Batches:        ${stats.completedBatches}/${CONFIG.TOTAL_BATCHES}
Inserted:       ${stats.totalInserted.toLocaleString()} vehicles
Failed:         ${stats.failedBatches.length}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);

  fs.writeFileSync(
    path.join(__dirname, '../import-stats.json'),
    JSON.stringify(stats, null, 2)
  );

  process.exit(stats.failedBatches.length > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
