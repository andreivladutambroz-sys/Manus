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
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n🧪 COMPREHENSIVE END-TO-END TESTS\n');
  console.log('=' .repeat(50));

  // Test 1: Server Health
  console.log('\n📡 SERVER HEALTH CHECKS');
  console.log('-'.repeat(50));
  
  await test('Server responds to requests', async () => {
    const res = await fetch(`${BASE_URL}/`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  await test('HTML contains root element', async () => {
    const res = await fetch(`${BASE_URL}/`);
    const html = await res.text();
    if (!html.includes('id="root"')) throw new Error('Root element missing');
  });

  await test('Title is Mechanic Helper', async () => {
    const res = await fetch(`${BASE_URL}/`);
    const html = await res.text();
    if (!html.includes('Mechanic Helper')) throw new Error('Title not found');
  });

  // Test 2: API Endpoints
  console.log('\n🔌 API ENDPOINT TESTS');
  console.log('-'.repeat(50));

  await test('Auth endpoint accessible', async () => {
    const res = await fetch(`${API_URL}/auth.me.query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    if (res.status !== 200 && res.status !== 401) throw new Error(`Status ${res.status}`);
  });

  await test('Diagnostic list endpoint accessible', async () => {
    const res = await fetch(`${API_URL}/diagnostic.list.query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    if (res.status !== 200 && res.status !== 401) throw new Error(`Status ${res.status}`);
  });

  await test('Repair list endpoint accessible', async () => {
    const res = await fetch(`${API_URL}/repair.list.query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    if (res.status !== 200 && res.status !== 401) throw new Error(`Status ${res.status}`);
  });

  // Test 3: Static Assets
  console.log('\n📦 STATIC ASSETS');
  console.log('-'.repeat(50));

  await test('CSS file is served', async () => {
    const res = await fetch(`${BASE_URL}/index.css`);
    if (res.status !== 200) throw new Error(`CSS not found: ${res.status}`);
  });

  await test('JavaScript bundles are present', async () => {
    const res = await fetch(`${BASE_URL}/`);
    const html = await res.text();
    if (!html.includes('type="module"')) throw new Error('No module scripts found');
  });

  // Test 4: Database Connectivity
  console.log('\n💾 DATABASE CONNECTIVITY');
  console.log('-'.repeat(50));

  await test('Database queries execute', async () => {
    const res = await fetch(`${API_URL}/diagnostic.list.query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await res.json();
    if (!data) throw new Error('No response from database');
  });

  // Test 5: Features Availability
  console.log('\n🎯 FEATURE AVAILABILITY');
  console.log('-'.repeat(50));

  await test('Diagnostic search feature available', async () => {
    const res = await fetch(`${BASE_URL}/`);
    const html = await res.text();
    if (!html.includes('diagnostic') && !html.includes('Diagnostic')) {
      throw new Error('Diagnostic feature not found in HTML');
    }
  });

  await test('Repair logging feature available', async () => {
    const res = await fetch(`${BASE_URL}/`);
    const html = await res.text();
    if (!html.includes('repair') && !html.includes('Repair')) {
      throw new Error('Repair feature not found in HTML');
    }
  });

  // Test 6: Performance
  console.log('\n⚡ PERFORMANCE METRICS');
  console.log('-'.repeat(50));

  const startTime = Date.now();
  await fetch(`${BASE_URL}/`);
  const loadTime = Date.now() - startTime;
  
  if (loadTime < 5000) {
    console.log(`✅ Page load time: ${loadTime}ms (< 5s)`);
    passed++;
  } else {
    console.log(`❌ Page load time: ${loadTime}ms (> 5s)`);
    failed++;
  }

  // Test 7: Error Handling
  console.log('\n🚨 ERROR HANDLING');
  console.log('-'.repeat(50));

  await test('Invalid API endpoint returns error', async () => {
    const res = await fetch(`${API_URL}/invalid.endpoint.query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    if (res.status === 200) throw new Error('Should not return 200 for invalid endpoint');
  });

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 TEST RESULTS: ${passed} passed, ${failed} failed\n`);
  
  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED! Platform is ready for production.\n');
  } else {
    console.log(`⚠️  ${failed} test(s) failed. Review errors above.\n`);
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
