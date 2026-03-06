#!/usr/bin/env node

/**
 * Test Data Collection
 * Collects sample data using mock FlareSolverr to demonstrate audit process
 */

import { FlareSolverrManager } from './swarm-free-data-collection/managers/FlareSolverrManager.mjs';
import { EpiesaScraper } from './swarm-free-data-collection/scrapers/EpiesaScraper.mjs';
import { AutodocScraper } from './swarm-free-data-collection/scrapers/AutodocScraper.mjs';
import fs from 'fs';

async function collectTestData() {
  console.log('\n🚀 COLLECTING TEST DATA FOR AUDIT\n');

  const manager = new FlareSolverrManager({
    apiUrl: 'http://localhost:8191/v1'
  });

  const allData = [];

  try {
    // Test 1: epiesa.ro
    console.log('1️⃣ Collecting from epiesa.ro...');
    const epiesaScraper = new EpiesaScraper(manager);
    const session1 = await manager.createSession('epiesa-collect');
    
    const brands1 = await epiesaScraper.scrapeBrands(session1);
    for (const brand of brands1.slice(0, 2)) {
      const models = await epiesaScraper.scrapeModels(brand.name, brand.value, session1);
      for (const model of models.slice(0, 1)) {
        const parts = await epiesaScraper.searchParts({
          brand: brand.name,
          model: model.name,
          category: 'engine'
        }, session1);
        allData.push(...parts);
      }
      await new Promise(r => setTimeout(r, 1000));
    }
    
    await manager.destroySession(session1);
    console.log(`   ✓ Collected ${allData.length} records from epiesa.ro\n`);

    // Test 2: autodoc.ro
    console.log('2️⃣ Collecting from autodoc.ro...');
    const autodocScraper = new AutodocScraper(manager);
    const session2 = await manager.createSession('autodoc-collect');
    
    const brands2 = await autodocScraper.scrapeBrands(session2);
    for (const brand of brands2.slice(0, 2)) {
      const models = await autodocScraper.scrapeModels(brand.name, brand.value, session2);
      for (const model of models.slice(0, 1)) {
        const parts = await autodocScraper.searchParts({
          brand: brand.name,
          model: model.name,
          category: 'engine'
        }, session2);
        allData.push(...parts);
      }
      await new Promise(r => setTimeout(r, 1000));
    }
    
    await manager.destroySession(session2);
    console.log(`   ✓ Collected ${allData.length} total records\n`);

  } catch (error) {
    console.error('Collection error:', error.message);
  }

  // Save collected data
  const outputFile = 'collected-data.json';
  fs.writeFileSync(outputFile, JSON.stringify(allData, null, 2), 'utf-8');
  
  console.log(`✅ Data saved to: ${outputFile}`);
  console.log(`📊 Total records: ${allData.length}\n`);

  return allData;
}

collectTestData().catch(console.error);
