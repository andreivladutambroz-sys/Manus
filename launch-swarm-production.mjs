#!/usr/bin/env node

/**
 * 200-AGENT SWARM PRODUCTION LAUNCH
 * 
 * Real FlareSolverr + 30 suppliers + 200 agents
 * Full data collection from automotive suppliers
 */

import { Orchestrator } from './swarm-free-data-collection/Orchestrator.mjs';
import { AGENTS_CONFIG } from './swarm-free-data-collection/config/agents.config.mjs';
import fs from 'fs';

async function launchSwarm() {
  try {
    console.log(`\n${'='.repeat(80)}`);
    console.log('🚀 200-AGENT SWARM PRODUCTION LAUNCH');
    console.log('🌍 Real FlareSolverr + 30 Suppliers');
    console.log(`${'='.repeat(80)}\n`);

    // Initialize orchestrator
    const orchestrator = new Orchestrator({
      batchSize: 5,
      flaresolverrApi: process.env.FLARESOLVERR_API || 'http://localhost:8191/v1',
      maxTimeout: 60000,
      workerTimeout: 300000
    });

    // Get agents - 30 suppliers
    const agents = AGENTS_CONFIG.suppliers.slice(0, 30);

    console.log(`📋 AGENTS CONFIGURATION:`);
    console.log(`   Total Agents: ${agents.length}`);
    console.log(`   Batch Size: ${orchestrator.config.batchSize}`);
    console.log(`   Total Batches: ${Math.ceil(agents.length / orchestrator.config.batchSize)}`);
    console.log(`   FlareSolverr API: ${orchestrator.config.flaresolverrApi}\n`);

    console.log(`🎯 SUPPLIERS TO SCRAPE:`);
    agents.forEach((agent, i) => {
      console.log(`   ${i + 1}. ${agent.name} (${agent.country}) - Priority ${agent.priority}`);
    });
    console.log();

    // Run swarm
    console.log(`⚡ STARTING SWARM EXECUTION...\n`);
    const startTime = Date.now();
    const result = await orchestrator.run(agents);
    const endTime = Date.now();

    // Print summary
    orchestrator.printSummary();

    // Save results
    const resultsFile = `swarm-results-${Date.now()}.json`;
    fs.writeFileSync(resultsFile, JSON.stringify(result, null, 2), 'utf-8');
    console.log(`💾 Results saved to: ${resultsFile}\n`);

    // Collect all data
    const allData = [];
    result.allResults.forEach(workerResult => {
      if (workerResult.success && workerResult.data) {
        allData.push(...workerResult.data);
      }
    });

    const dataFile = `collected-data-${Date.now()}.json`;
    fs.writeFileSync(dataFile, JSON.stringify(allData, null, 2), 'utf-8');
    console.log(`📊 Collected ${allData.length} records saved to: ${dataFile}\n`);

    console.log(`${'='.repeat(80)}`);
    console.log('✅ SWARM EXECUTION COMPLETED');
    console.log(`${'='.repeat(80)}\n`);

    process.exit(0);

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

launchSwarm();
