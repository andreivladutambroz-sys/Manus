#!/usr/bin/env node

import { FlareSolverrManager } from './swarm-free-data-collection/managers/FlareSolverrManager.mjs';
import { EpiesaScraper } from './swarm-free-data-collection/scrapers/EpiesaScraper.mjs';
import { AutodocScraper } from './swarm-free-data-collection/scrapers/AutodocScraper.mjs';

console.log('\n🧪 TESTING SWARM COMPONENTS\n');

// Test 1: FlareSolverr Manager
console.log('1️⃣ Testing FlareSolverrManager...');
const manager = new FlareSolverrManager({
  apiUrl: 'http://localhost:8191/v1'
});

try {
  const health = await manager.healthCheck();
  console.log(`   ✓ FlareSolverr health: ${health.healthy ? '✅' : '❌'}`);
  console.log(`   Message: ${health.message}\n`);
} catch (err) {
  console.log(`   ✗ Error: ${err.message}\n`);
}

// Test 2: Create Session
console.log('2️⃣ Testing Session Management...');
try {
  const sessionId = await manager.createSession('test-session');
  console.log(`   ✓ Session created: ${sessionId}`);
  console.log(`   Active sessions: ${manager.sessions.size}\n`);
  
  // Destroy session
  await manager.destroySession(sessionId);
  console.log(`   ✓ Session destroyed`);
  console.log(`   Active sessions: ${manager.sessions.size}\n`);
} catch (err) {
  console.log(`   ✗ Error: ${err.message}\n`);
}

// Test 3: Scrape URL
console.log('3️⃣ Testing URL Scraping...');
try {
  const result = await manager.scrapeUrl('https://www.epiesa.ro/catalog');
  console.log(`   ✓ Scrape successful`);
  console.log(`   HTML length: ${result.html.length} bytes`);
  console.log(`   Cookies: ${result.cookies.length}`);
  console.log(`   Status: ${result.status}\n`);
} catch (err) {
  console.log(`   ✗ Error: ${err.message}\n`);
}

// Test 4: EpiesaScraper
console.log('4️⃣ Testing EpiesaScraper...');
try {
  const scraper = new EpiesaScraper(manager);
  const sessionId = await manager.createSession('epiesa-test');
  
  const brands = await scraper.scrapeBrands(sessionId);
  console.log(`   ✓ Brands found: ${brands.length}`);
  brands.forEach(b => console.log(`     - ${b.name}`));
  
  const models = await scraper.scrapeModels('BMW', 'BMW', sessionId);
  console.log(`   ✓ Models found: ${models.length}`);
  
  await manager.destroySession(sessionId);
  console.log(`\n   Stats: ${JSON.stringify(scraper.getStats(), null, 2)}\n`);
} catch (err) {
  console.log(`   ✗ Error: ${err.message}\n`);
}

// Test 5: AutodocScraper
console.log('5️⃣ Testing AutodocScraper...');
try {
  const scraper = new AutodocScraper(manager);
  const sessionId = await manager.createSession('autodoc-test');
  
  const brands = await scraper.scrapeBrands(sessionId);
  console.log(`   ✓ Brands found: ${brands.length}`);
  
  await manager.destroySession(sessionId);
  console.log(`   ✓ AutodocScraper working\n`);
} catch (err) {
  console.log(`   ✗ Error: ${err.message}\n`);
}

// Test 6: Manager Stats
console.log('6️⃣ FlareSolverr Manager Statistics:');
const stats = manager.getStats();
console.log(`   Total Requests: ${stats.totalRequests}`);
console.log(`   Successful: ${stats.successfulRequests}`);
console.log(`   Failed: ${stats.failedRequests}`);
console.log(`   Success Rate: ${stats.successRate}`);
console.log(`   Total Downloaded: ${(stats.totalBytesDownloaded / 1024).toFixed(2)} KB\n`);

console.log('✅ ALL TESTS COMPLETED\n');
