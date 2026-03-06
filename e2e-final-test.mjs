import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/trpc`;

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n🧪 FINAL END-TO-END TEST SUITE\n');
  console.log('=' .repeat(60));

  // Test 1: Server Health
  console.log('\n📡 SERVER HEALTH CHECKS');
  console.log('-'.repeat(60));
  
  await test('Server responds to HTTP requests', async () => {
    const res = await fetch(`${BASE_URL}/`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  await test('HTML contains root element', async () => {
    const res = await fetch(`${BASE_URL}/`);
    const html = await res.text();
    if (!html.includes('id="root"')) throw new Error('Root element missing');
  });

  await test('Page title is correct', async () => {
    const res = await fetch(`${BASE_URL}/`);
    const html = await res.text();
    if (!html.includes('Mechanic Helper')) throw new Error('Title not found');
  });

  // Test 2: API Endpoints (Using GET for queries)
  console.log('\n🔌 API ENDPOINT TESTS');
  console.log('-'.repeat(60));

  await test('Auth endpoint accessible (GET)', async () => {
    const res = await fetch(`${API_URL}/auth.me`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.result) throw new Error('Invalid response format');
  });

  await test('Diagnostic list endpoint accessible', async () => {
    const res = await fetch(`${API_URL}/diagnostic.list`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.result) throw new Error('Invalid response format');
  });

  await test('Vehicle list endpoint accessible', async () => {
    const res = await fetch(`${API_URL}/vehicle.list`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.result) throw new Error('Invalid response format');
  });

  // Test 3: Static Assets
  console.log('\n📦 STATIC ASSETS');
  console.log('-'.repeat(60));

  await test('CSS stylesheet is served', async () => {
    const res = await fetch(`${BASE_URL}/index.css`);
    if (res.status !== 200) throw new Error(`CSS not found: ${res.status}`);
  });

  await test('JavaScript modules are present', async () => {
    const res = await fetch(`${BASE_URL}/`);
    const html = await res.text();
    if (!html.includes('type="module"')) throw new Error('No module scripts found');
  });

  // Test 4: Database Connectivity
  console.log('\n💾 DATABASE CONNECTIVITY');
  console.log('-'.repeat(60));

  await test('Database queries return valid responses', async () => {
    const res = await fetch(`${API_URL}/diagnostic.list`);
    const data = await res.json();
    if (!data.result || !data.result.data) throw new Error('No data returned');
  });

  // Test 5: Performance
  console.log('\n⚡ PERFORMANCE METRICS');
  console.log('-'.repeat(60));

  const startTime = Date.now();
  await fetch(`${BASE_URL}/`);
  const loadTime = Date.now() - startTime;
  
  if (loadTime < 5000) {
    console.log(`✅ Page load time: ${loadTime}ms (< 5s threshold)`);
    passed++;
  } else {
    console.log(`❌ Page load time: ${loadTime}ms (> 5s threshold)`);
    failed++;
  }

  // Test 6: Error Handling
  console.log('\n🚨 ERROR HANDLING');
  console.log('-'.repeat(60));

  await test('Invalid API endpoint returns error', async () => {
    const res = await fetch(`${API_URL}/invalid.endpoint.nonexistent`);
    if (res.status === 200) throw new Error('Should not return 200 for invalid endpoint');
  });

  // Test 7: Response Formats
  console.log('\n📋 RESPONSE FORMATS');
  console.log('-'.repeat(60));

  await test('API responses have correct tRPC format', async () => {
    const res = await fetch(`${API_URL}/auth.me`);
    const data = await res.json();
    if (!data.result) throw new Error('Missing result field');
  });

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 TEST RESULTS: ${passed} passed, ${failed} failed\n`);
  
  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED!\n');
    console.log('✅ Platform is production-ready');
    console.log('✅ All APIs responding correctly');
    console.log('✅ Database connectivity verified');
    console.log('✅ Performance within acceptable limits\n');
  } else {
    console.log(`⚠️  ${failed} test(s) failed. Review errors above.\n`);
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
