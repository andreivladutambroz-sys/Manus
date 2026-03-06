#!/usr/bin/env node

/**
 * Test Data Collection v2 - Using improved scrapers
 */

import { FlareSolverrManager } from './swarm-free-data-collection/managers/FlareSolverrManager.mjs';
import { EpiesaScraper } from './swarm-free-data-collection/scrapers/EpiesaScraper-v2.mjs';
import { AutodocScraper } from './swarm-free-data-collection/scrapers/AutodocScraper-v2.mjs';
import fs from 'fs';

async function collectTestData() {
  console.log('\n🚀 COLLECTING TEST DATA WITH IMPROVED SCRAPERS v2\n');

  const manager = new FlareSolverrManager({
    apiUrl: 'http://localhost:8191/v1'
  });

  const allData = [];

  try {
    // Test 1: epiesa.ro v2
    console.log('1️⃣ Collecting from epiesa.ro (v2)...');
    const epiesaScraper = new EpiesaScraper(manager);
    const session1 = await manager.createSession('epiesa-collect-v2');
    
    const brands1 = await epiesaScraper.scrapeBrands(session1);
    console.log(`   Brands: ${brands1.map(b => b.name).join(', ')}\n`);
    
    for (const brand of brands1.slice(0, 2)) {
      const models = await epiesaScraper.scrapeModels(brand.name, brand.value, session1);
      console.log(`   Models for ${brand.name}: ${models.map(m => m.name).join(', ')}`);
      
      for (const model of models.slice(0, 1)) {
        const parts = await epiesaScraper.searchParts({
          brand: brand.name,
          model: model.name,
          category: 'engine'
        }, session1);
        allData.push(...parts);
        console.log(`   Parts found: ${parts.length}`);
      }
      await new Promise(r => setTimeout(r, 500));
    }
    
    await manager.destroySession(session1);
    const epiesa_stats = epiesaScraper.getStats();
    console.log(`\n   📊 epiesa.ro Stats:`, epiesa_stats);
    console.log(`   ✓ Total from epiesa.ro: ${allData.length} records\n`);

    // Test 2: autodoc.ro v2
    console.log('2️⃣ Collecting from autodoc.ro (v2)...');
    const autodocScraper = new AutodocScraper(manager);
    const session2 = await manager.createSession('autodoc-collect-v2');
    
    const brands2 = await autodocScraper.scrapeBrands(session2);
    console.log(`   Brands: ${brands2.map(b => b.name).join(', ')}\n`);
    
    for (const brand of brands2.slice(0, 2)) {
      const models = await autodocScraper.scrapeModels(brand.name, brand.value, session2);
      console.log(`   Models for ${brand.name}: ${models.map(m => m.name).join(', ')}`);
      
      for (const model of models.slice(0, 1)) {
        const parts = await autodocScraper.searchParts({
          brand: brand.name,
          model: model.name,
          category: 'engine'
        }, session2);
        allData.push(...parts);
        console.log(`   Parts found: ${parts.length}`);
      }
      await new Promise(r => setTimeout(r, 500));
    }
    
    await manager.destroySession(session2);
    const autodoc_stats = autodocScraper.getStats();
    console.log(`\n   📊 autodoc.ro Stats:`, autodoc_stats);
    console.log(`   ✓ Total from autodoc.ro: ${allData.length} records\n`);

  } catch (error) {
    console.error('Collection error:', error.message);
  }

  // Save collected data
  const outputFile = 'collected-data-v2.json';
  fs.writeFileSync(outputFile, JSON.stringify(allData, null, 2), 'utf-8');
  
  console.log(`✅ Data saved to: ${outputFile}`);
  console.log(`📊 Total records collected: ${allData.length}\n`);

  return allData;
}

collectTestData().catch(console.error);
