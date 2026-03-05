#!/usr/bin/env node

/**
 * Kimi Swarm Orchestrator - Parallel Vehicle Data Import
 * Executes 300,000+ vehicle variants via Vercel serverless function
 * with Kimi AI optimization and progress tracking
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VERCEL_URL = process.env.VERCEL_URL || 'https://mechhelper-f8jtlcpe.manus.space';
const IMPORT_TOKEN = process.env.IMPORT_TOKEN || 'default-import-token';

// Configuration
const CONFIG = {
  BATCH_SIZE: 50,
  TOTAL_VEHICLES: 300000,
  CONCURRENT_AGENTS: 8,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 2000,
};

CONFIG.TOTAL_BATCHES = Math.ceil(CONFIG.TOTAL_VEHICLES / CONFIG.BATCH_SIZE);

// Progress tracking
let progressData = {
  startTime: Date.now(),
  totalBatches: CONFIG.TOTAL_BATCHES,
  completedBatches: 0,
  totalInserted: 0,
  failedBatches: [],
  successRate: 0,
};

/**
 * Execute single batch import via Vercel serverless function
 */
async function importBatch(batchId, retryCount = 0) {
  try {
    const response = await fetch(`${VERCEL_URL}/api/import-vehicle-data`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${IMPORT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        batch_id: batchId,
        batch_size: CONFIG.BATCH_SIZE,
        total_batches: CONFIG.TOTAL_BATCHES,
      }),
      timeout: 30000,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.success) {
      progressData.completedBatches++;
      progressData.totalInserted += result.inserted;
      
      // Log progress every 100 batches
      if (progressData.completedBatches % 100 === 0) {
        logProgress();
      }
      
      return result;
    } else {
      throw new Error(result.error || 'Import failed');
    }
  } catch (error) {
    if (retryCount < CONFIG.RETRY_ATTEMPTS) {
      console.warn(`⚠️  Batch ${batchId} failed, retrying (${retryCount + 1}/${CONFIG.RETRY_ATTEMPTS})...`);
      await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
      return importBatch(batchId, retryCount + 1);
    } else {
      progressData.failedBatches.push(batchId);
      console.error(`❌ Batch ${batchId} failed after ${CONFIG.RETRY_ATTEMPTS} retries:`, error.message);
      return null;
    }
  }
}

/**
 * Kimi Swarm Agent - executes batches in parallel
 */
async function kimiSwarmAgent(agentId, batchQueue) {
  const agentBatches = [];
  
  while (batchQueue.length > 0) {
    const batchId = batchQueue.shift();
    if (batchId === undefined) break;
    
    console.log(`🤖 Agent ${agentId} processing batch ${batchId}...`);
    const result = await importBatch(batchId);
    
    if (result) {
      agentBatches.push(result);
    }
  }
  
  return agentBatches;
}

/**
 * Log progress with ETA
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
📊 PROGRESS UPDATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Batches:        ${progressData.completedBatches}/${CONFIG.TOTAL_BATCHES} (${progress}%)
Total Inserted: ${progressData.totalInserted.toLocaleString()} vehicles
Throughput:     ${batchesPerSec.toFixed(2)} batches/sec
Elapsed:        ${(elapsedSec / 60).toFixed(1)} minutes
ETA:            ${eta}
Failed:         ${progressData.failedBatches.length} batches
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
}

/**
 * Main orchestrator - spawn Kimi Swarm agents
 */
async function orchestrateImport() {
  console.log(`
🚀 KIMI SWARM ORCHESTRATOR - Vehicle Data Import
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Target:         ${CONFIG.TOTAL_VEHICLES.toLocaleString()} vehicles
Batch Size:     ${CONFIG.BATCH_SIZE}
Total Batches:  ${CONFIG.TOTAL_BATCHES}
Concurrent:     ${CONFIG.CONCURRENT_AGENTS} Kimi agents
Vercel URL:     ${VERCEL_URL}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);

  // Create batch queue
  const batchQueue = Array.from({ length: CONFIG.TOTAL_BATCHES }, (_, i) => i);
  
  // Spawn Kimi Swarm agents
  const agents = Array.from({ length: CONFIG.CONCURRENT_AGENTS }, (_, agentId) =>
    kimiSwarmAgent(agentId, batchQueue)
  );

  console.log(`🤖 Spawned ${CONFIG.CONCURRENT_AGENTS} Kimi agents...`);
  
  // Wait for all agents to complete
  const results = await Promise.all(agents);
  
  // Calculate final stats
  const totalElapsed = (Date.now() - progressData.startTime) / 1000;
  progressData.successRate = ((CONFIG.TOTAL_BATCHES - progressData.failedBatches.length) / CONFIG.TOTAL_BATCHES * 100).toFixed(1);
  
  // Final report
  console.log(`
✅ IMPORT COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Time:     ${(totalElapsed / 60).toFixed(1)} minutes
Batches:        ${progressData.completedBatches}/${CONFIG.TOTAL_BATCHES}
Success Rate:   ${progressData.successRate}%
Total Inserted: ${progressData.totalInserted.toLocaleString()} vehicles
Failed:         ${progressData.failedBatches.length} batches
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);

  // Save progress report
  const reportPath = path.join(__dirname, '../import-progress.json');
  fs.writeFileSync(reportPath, JSON.stringify(progressData, null, 2));
  console.log(`📄 Progress report saved to: ${reportPath}`);

  // Exit with error if any batches failed
  if (progressData.failedBatches.length > 0) {
    console.warn(`\n⚠️  ${progressData.failedBatches.length} batches failed. Retry with:`);
    console.warn(`   node scripts/kimi-swarm-orchestrator.mjs --retry-failed`);
    process.exit(1);
  }

  process.exit(0);
}

// Run orchestrator
orchestrateImport().catch(error => {
  console.error('❌ Orchestrator error:', error);
  process.exit(1);
});
