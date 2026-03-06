/**
 * Supplier Worker Thread
 * 
 * Executes in worker thread pool to scrape supplier websites in parallel
 * Each worker handles one supplier (epiesa.ro, autodoc.ro, etc.)
 * 
 * Communication: worker receives job via workerData, sends results via parentPort
 */

import { parentPort, workerData } from 'worker_threads';
import { FlareSolverrManager } from '../managers/FlareSolverrManager.mjs';
import { EpiesaScraper } from '../scrapers/EpiesaScraper.mjs';
import { AutodocScraper } from '../scrapers/AutodocScraper.mjs';

const { agent, config } = workerData;

async function runWorker() {
  const startTime = Date.now();
  const results = {
    agentId: agent.id,
    agentName: agent.name,
    success: false,
    startTime,
    endTime: null,
    duration: null,
    data: null,
    stats: null,
    error: null
  };

  try {
    console.log(`[Worker ${agent.id}] Starting: ${agent.name}`);

    // Initialize FlareSolverr manager
    const manager = new FlareSolverrManager({
      apiUrl: config.flaresolverrApi || 'http://localhost:8191/v1',
      maxTimeout: config.maxTimeout || 60000
    });

    // Verify FlareSolverr is running
    const healthCheck = await manager.healthCheck();
    if (!healthCheck.healthy) {
      throw new Error(`FlareSolverr not available: ${healthCheck.message}`);
    }

    // Create session for this worker
    const sessionId = await manager.createSession(`${agent.id}-session`);

    let scraper;
    let scrapedData = [];

    // Initialize appropriate scraper
    if (agent.name === 'epiesa.ro') {
      scraper = new EpiesaScraper(manager);
      
      // Scrape brands and models
      const brands = await scraper.scrapeBrands(sessionId);
      
      // For first 3 brands, scrape parts
      for (const brand of brands.slice(0, 3)) {
        try {
          const models = await scraper.scrapeModels(brand.name, brand.value, sessionId);
          
          // For first 2 models, search for parts
          for (const model of models.slice(0, 2)) {
            try {
              const parts = await scraper.searchParts(
                {
                  brand: brand.name,
                  model: model.name,
                  category: 'engine'
                },
                sessionId
              );
              scrapedData.push(...parts);
              
              // Delay between searches
              await new Promise(r => setTimeout(r, 2000));
            } catch (err) {
              console.warn(`[Worker ${agent.id}] Failed to scrape parts for ${brand.name} ${model.name}`);
            }
          }
        } catch (err) {
          console.warn(`[Worker ${agent.id}] Failed to scrape models for ${brand.name}`);
        }
      }

    } else if (agent.name === 'autodoc.ro') {
      scraper = new AutodocScraper(manager);
      
      // Scrape brands and models
      const brands = await scraper.scrapeBrands(sessionId);
      
      // For first 3 brands, scrape parts
      for (const brand of brands.slice(0, 3)) {
        try {
          const models = await scraper.scrapeModels(brand.name, brand.value, sessionId);
          
          // For first 2 models, search for parts
          for (const model of models.slice(0, 2)) {
            try {
              const parts = await scraper.searchParts(
                {
                  brand: brand.name,
                  model: model.name,
                  category: 'engine'
                },
                sessionId
              );
              scrapedData.push(...parts);
              
              // Delay between searches
              await new Promise(r => setTimeout(r, 2000));
            } catch (err) {
              console.warn(`[Worker ${agent.id}] Failed to scrape parts for ${brand.name} ${model.name}`);
            }
          }
        } catch (err) {
          console.warn(`[Worker ${agent.id}] Failed to scrape models for ${brand.name}`);
        }
      }
    }

    // Destroy session to free resources
    await manager.destroySession(sessionId);

    results.success = true;
    results.data = scrapedData;
    results.stats = scraper ? scraper.getStats() : null;

    console.log(`[Worker ${agent.id}] Completed: ${scrapedData.length} records scraped`);

  } catch (error) {
    results.success = false;
    results.error = error.message;
    console.error(`[Worker ${agent.id}] Failed:`, error.message);
  } finally {
    results.endTime = Date.now();
    results.duration = results.endTime - results.startTime;

    // Send results back to main thread
    parentPort.postMessage(results);
  }
}

// Run worker
runWorker().catch(error => {
  console.error('[Worker] Fatal error:', error);
  parentPort.postMessage({
    agentId: workerData.agent.id,
    success: false,
    error: error.message
  });
});
