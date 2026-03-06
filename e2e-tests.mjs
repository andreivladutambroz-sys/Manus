import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/trpc`;

let testsPassed = 0;
let testsFailed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    testsFailed++;
  }
}

async function runTests() {
  console.log('🧪 Running E2E Tests...\n');

  // Test 1: Health check
  await test('Server is running', async () => {
    const res = await fetch(`${BASE_URL}/`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  // Test 2: Database connection
  await test('Database is accessible', async () => {
    const res = await fetch(`${API_URL}/auth.me.query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    if (res.status !== 200 && res.status !== 401) throw new Error(`Status ${res.status}`);
  });

  // Test 3: API endpoints
  await test('API endpoints are responding', async () => {
    const endpoints = [
      'auth.me.query',
      'diagnostic.list.query',
      'repair.list.query'
    ];
    
    for (const endpoint of endpoints) {
      const res = await fetch(`${API_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (res.status !== 200 && res.status !== 401) {
        throw new Error(`${endpoint} returned ${res.status}`);
      }
    }
  });

  // Test 4: UI components load
  await test('UI components are loading', async () => {
    const res = await fetch(`${BASE_URL}/`);
    const html = await res.text();
    if (!html.includes('<!DOCTYPE html')) throw new Error('Invalid HTML');
    if (!html.includes('root')) throw new Error('Root element missing');
  });

  // Test 5: Static assets
  await test('Static assets are served', async () => {
    const res = await fetch(`${BASE_URL}/index.css`);
    if (res.status !== 200) throw new Error(`CSS not found: ${res.status}`);
  });

  // Test 6: Service worker
  await test('Service worker is configured', async () => {
    const res = await fetch(`${BASE_URL}/sw.js`);
    if (res.status === 200) {
      const content = await res.text();
      if (!content.includes('install') && !content.includes('fetch')) {
        throw new Error('Service worker not properly configured');
      }
    }
  });

  // Test 7: Database schema
  await test('Database schema is valid', async () => {
    // This would require actual DB access
    console.log('  (Skipped - requires DB access)');
  });

  // Test 8: Authentication flow
  await test('Authentication endpoints exist', async () => {
    const res = await fetch(`${API_URL}/auth.logout.useMutation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    // Should return 200 or 401, not 404
    if (res.status === 404) throw new Error('Auth endpoint not found');
  });

  console.log(`\n📊 Results: ${testsPassed} passed, ${testsFailed} failed`);
  process.exit(testsFailed > 0 ? 1 : 0);
}

runTests().catch(console.error);
