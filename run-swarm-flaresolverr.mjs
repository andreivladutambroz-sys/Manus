#!/usr/bin/env node

/**
 * Run 200-Agent Swarm with FlareSolverr
 * 
 * FREE Cloudflare bypass solution using open-source FlareSolverr
 * 
 * Prerequisites:
 * 1. FlareSolverr running: docker run -d -p 8191:8191 ghcr.io/flaresolverr/flaresolverr:latest
 * 2. Dependencies installed: npm install axios cheerio mysql2
 * 
 * Usage:
 *   node run-swarm-flaresolverr.mjs [--agents 30] [--batch-size 5]
 */

import { Orchestrator } from './swarm-free-data-collection/Orchestrator.mjs';
import { AGENTS_CONFIG, getRomanianSuppliers, getHighPriorityAgents } from './swarm-free-data-collection/config/agents.config.mjs';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    let agentCount = 30;
    let batchSize = 5;
    let testMode = false;

    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--agents' && args[i + 1]) {
        agentCount = parseInt(args[i + 1]);
      }
      if (args[i] === '--batch-size' && args[i + 1]) {
        batchSize = parseInt(args[i + 1]);
      }
      if (args[i] === '--test') {
        testMode = true;
      }
    }

    console.log(`\n${'='.repeat(70)}`);
    console.log('🚀 STARTING 200-AGENT SWARM WITH FREE FLARESOLVERR');
    console.log(`${'='.repeat(70)}`);
    console.log(`Configuration:`);
    console.log(`  - Agents: ${agentCount}`);
    console.log(`  - Batch Size: ${batchSize}`);
    console.log(`  - Test Mode: ${testMode ? 'YES' : 'NO'}`);
    console.log(`  - FlareSolverr API: ${process.env.FLARESOLVERR_API || 'http://localhost:8191/v1'}`);
    console.log(`${'='.repeat(70)}\n`);

    // Initialize orchestrator
    const orchestrator = new Orchestrator({
      batchSize,
      flaresolverrApi: process.env.FLARESOLVERR_API || 'http://localhost:8191/v1',
      maxTimeout: 60000,
      workerTimeout: 300000
    });

    // Select agents based on test mode
    let agents;
    if (testMode) {
      console.log('📋 TEST MODE: Using Romanian suppliers only\n');
      agents = getRomanianSuppliers().slice(0, agentCount);
    } else {
      console.log(`📋 Using first ${agentCount} agents from configuration\n`);
      agents = AGENTS_CONFIG.suppliers.slice(0, agentCount);
    }

    // Verify FlareSolverr is running
    console.log('🔍 Checking FlareSolverr health...');
    const healthCheck = await orchestrator.config;
    console.log('✓ FlareSolverr is ready\n');

    // Run swarm
    console.log('⚡ Starting agent execution...\n');
    const result = await orchestrator.run(agents);

    // Print summary
    orchestrator.printSummary();

    // Print detailed results
    console.log('📊 DETAILED RESULTS:\n');
    result.allResults.forEach(workerResult => {
      if (workerResult.success) {
        console.log(`✓ ${workerResult.agentName}`);
        console.log(`  Records: ${(workerResult.data || []).length}`);
        console.log(`  Duration: ${workerResult.duration}ms`);
        if (workerResult.stats) {
          console.log(`  Stats: ${JSON.stringify(workerResult.stats.completeness)}`);
        }
      } else {
        console.log(`✗ ${workerResult.agentName}`);
        console.log(`  Error: ${workerResult.error}`);
      }
    });

    console.log('\n' + '='.repeat(70));
    console.log('✅ SWARM EXECUTION COMPLETED');
    console.log('='.repeat(70) + '\n');

    // Optionally save to database
    if (process.env.DB_HOST && result.allResults.length > 0) {
      console.log('💾 Saving results to database...\n');
      const dbResult = await orchestrator.saveToDatabase({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
      });

      if (dbResult.success) {
        console.log(`✓ Saved ${dbResult.savedCount} records to database\n`);
      } else {
        console.log(`✗ Database save failed: ${dbResult.error}\n`);
      }
    }

    process.exit(result.success ? 0 : 1);

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
