/**
 * Orchestrator - 200-Agent Swarm Manager
 * 
 * Manages parallel execution of supplier scraping agents
 * Batches agents to avoid resource exhaustion
 * Collects and aggregates results from all workers
 * 
 * Architecture:
 * - Batch size: 5 agents at a time (to avoid memory issues)
 * - Total agents: 30 (can be scaled to 200)
 * - Each agent scrapes one supplier website
 * - Results are aggregated and saved to database
 */

import { Worker } from 'worker_threads';
import mysql from 'mysql2/promise';

export class Orchestrator {
  constructor(config = {}) {
    this.config = {
      batchSize: config.batchSize || 5,
      workerTimeout: config.workerTimeout || 300000, // 5 minutes
      flaresolverrApi: config.flaresolverrApi || 'http://localhost:8191/v1',
      maxTimeout: config.maxTimeout || 60000,
      ...config
    };

    this.stats = {
      totalAgents: 0,
      completedAgents: 0,
      failedAgents: 0,
      totalRecords: 0,
      totalDuration: 0,
      startTime: null,
      endTime: null
    };

    this.results = [];
  }

  /**
   * Run a single worker thread
   */
  async runWorker(agent) {
    return new Promise((resolve, reject) => {
      const worker = new Worker('./swarm-free-data-collection/workers/SupplierWorker.mjs', {
        workerData: {
          agent,
          config: this.config
        }
      });

      const timeout = setTimeout(() => {
        worker.terminate();
        reject(new Error(`Worker timeout for ${agent.id}`));
      }, this.config.workerTimeout);

      worker.on('message', (result) => {
        clearTimeout(timeout);
        worker.terminate();
        resolve(result);
      });

      worker.on('error', (error) => {
        clearTimeout(timeout);
        worker.terminate();
        reject(error);
      });

      worker.on('exit', (code) => {
        if (code !== 0) {
          clearTimeout(timeout);
          reject(new Error(`Worker exited with code ${code}`));
        }
      });
    });
  }

  /**
   * Execute batch of agents
   */
  async executeBatch(agents, batchNumber) {
    console.log(`\n[Orchestrator] Batch ${batchNumber}: ${agents.map(a => a.name).join(', ')}`);

    const batchResults = await Promise.allSettled(
      agents.map(agent => this.runWorker(agent))
    );

    const batchStats = {
      batchNumber,
      agents: agents.length,
      completed: 0,
      failed: 0,
      totalRecords: 0,
      results: []
    };

    batchResults.forEach((result, index) => {
      const agent = agents[index];

      if (result.status === 'fulfilled') {
        const workerResult = result.value;
        
        if (workerResult.success) {
          batchStats.completed++;
          this.stats.completedAgents++;
          batchStats.totalRecords += (workerResult.data || []).length;
          this.stats.totalRecords += (workerResult.data || []).length;

          console.log(`  ✓ ${agent.name}: ${(workerResult.data || []).length} records (${workerResult.duration}ms)`);
          batchStats.results.push(workerResult);
          this.results.push(workerResult);
        } else {
          batchStats.failed++;
          this.stats.failedAgents++;
          console.log(`  ✗ ${agent.name}: ${workerResult.error}`);
        }
      } else {
        batchStats.failed++;
        this.stats.failedAgents++;
        console.log(`  ✗ ${agent.name}: ${result.reason.message}`);
      }
    });

    return batchStats;
  }

  /**
   * Run complete swarm
   */
  async run(agents) {
    this.stats.startTime = Date.now();
    this.stats.totalAgents = agents.length;

    console.log(`\n${'='.repeat(60)}`);
    console.log('🚀 STARTING 200-AGENT SWARM WITH FLARESOLVERR');
    console.log(`${'='.repeat(60)}`);
    console.log(`Total agents: ${agents.length}`);
    console.log(`Batch size: ${this.config.batchSize}`);
    console.log(`FlareSolverr API: ${this.config.flaresolverrApi}`);
    console.log(`${'='.repeat(60)}\n`);

    const batchResults = [];

    // Execute agents in batches
    for (let i = 0; i < agents.length; i += this.config.batchSize) {
      const batch = agents.slice(i, i + this.config.batchSize);
      const batchNumber = Math.floor(i / this.config.batchSize) + 1;

      try {
        const batchResult = await this.executeBatch(batch, batchNumber);
        batchResults.push(batchResult);

        // Delay between batches
        if (i + this.config.batchSize < agents.length) {
          console.log(`[Orchestrator] Waiting 10 seconds before next batch...`);
          await new Promise(r => setTimeout(r, 10000));
        }
      } catch (error) {
        console.error(`[Orchestrator] Batch ${batchNumber} failed:`, error.message);
      }
    }

    this.stats.endTime = Date.now();
    this.stats.totalDuration = this.stats.endTime - this.stats.startTime;

    return {
      success: this.stats.failedAgents === 0,
      stats: this.stats,
      batchResults,
      allResults: this.results
    };
  }

  /**
   * Save scraped data to database
   */
  async saveToDatabase(dbConfig) {
    try {
      const pool = mysql.createPool({
        host: dbConfig.host || process.env.DB_HOST,
        user: dbConfig.user || process.env.DB_USER,
        password: dbConfig.password || process.env.DB_PASSWORD,
        database: dbConfig.database || process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });

      console.log(`\n[Orchestrator] Saving ${this.stats.totalRecords} records to database...`);

      let savedCount = 0;

      for (const workerResult of this.results) {
        if (workerResult.success && workerResult.data) {
          for (const record of workerResult.data) {
            try {
              await pool.execute(
                `INSERT INTO scraped_parts 
                 (source, part_number, name, brand, model, category, price, currency, source_url, scraped_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  record.source,
                  record.partNumber,
                  record.name,
                  record.brand,
                  record.model,
                  record.category,
                  record.price,
                  record.currency,
                  record.sourceUrl,
                  record.scrapedAt
                ]
              );
              savedCount++;
            } catch (error) {
              console.warn(`[Orchestrator] Failed to save record: ${error.message}`);
            }
          }
        }
      }

      console.log(`[Orchestrator] Successfully saved ${savedCount} records`);
      await pool.end();

      return {
        success: true,
        savedCount
      };
    } catch (error) {
      console.error('[Orchestrator] Database save failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get final statistics
   */
  getStats() {
    return {
      ...this.stats,
      successRate: `${((this.stats.completedAgents / this.stats.totalAgents) * 100).toFixed(1)}%`,
      averageRecordsPerAgent: (this.stats.totalRecords / this.stats.completedAgents).toFixed(0),
      averageDurationPerAgent: (this.stats.totalDuration / this.stats.totalAgents).toFixed(0) + 'ms',
      totalDurationFormatted: `${(this.stats.totalDuration / 1000).toFixed(1)}s`
    };
  }

  /**
   * Print summary report
   */
  printSummary() {
    const stats = this.getStats();

    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 SWARM EXECUTION SUMMARY');
    console.log(`${'='.repeat(60)}`);
    console.log(`Total Agents: ${stats.totalAgents}`);
    console.log(`Completed: ${stats.completedAgents} ✓`);
    console.log(`Failed: ${stats.failedAgents} ✗`);
    console.log(`Success Rate: ${stats.successRate}`);
    console.log(`\nData Collected:`);
    console.log(`Total Records: ${stats.totalRecords}`);
    console.log(`Avg Records/Agent: ${stats.averageRecordsPerAgent}`);
    console.log(`\nPerformance:`);
    console.log(`Total Duration: ${stats.totalDurationFormatted}`);
    console.log(`Avg Duration/Agent: ${stats.averageDurationPerAgent}`);
    console.log(`${'='.repeat(60)}\n`);
  }
}

export default Orchestrator;
