#!/usr/bin/env node
/**
 * Debug Script - Test Orchestrator, API Responses, Diagnostic Workflow
 */

const API_URL = 'http://localhost:3000/api/trpc';
const KIMI_API_KEY = process.env.KIMI_API_KEY || '';

console.log('🔍 DIAGNOSTIC ORCHESTRATOR DEBUG SCRIPT');
console.log('=====================================\n');

// Test 1: Check environment
console.log('✓ Test 1: Environment Check');
console.log(`  KIMI_API_KEY: ${KIMI_API_KEY ? '✓ SET (' + KIMI_API_KEY.substring(0, 10) + '...)' : '✗ MISSING'}`);
console.log(`  API_URL: ${API_URL}\n`);

// Test 2: Test Kimi API directly
async function testKimiAPI() {
  console.log('✓ Test 2: Kimi API Connection');
  
  if (!KIMI_API_KEY) {
    console.log('  ✗ KIMI_API_KEY not set\n');
    return false;
  }

  try {
    const response = await fetch('https://api.moonshot.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KIMI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'moonshot-v1-128k',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant.',
          },
          {
            role: 'user',
            content: 'Say "Kimi API is working" in exactly 5 words.',
          },
        ],
        temperature: 0.1,
        max_tokens: 100,
      }),
    });

    const data = await response.json();
    
    if (response.ok && data.choices?.[0]?.message?.content) {
      console.log(`  ✓ API Response: "${data.choices[0].message.content}"`);
      console.log(`  ✓ Model: ${data.model}`);
      console.log(`  ✓ Usage: ${data.usage?.prompt_tokens} tokens\n`);
      return true;
    } else {
      console.log(`  ✗ API Error: ${JSON.stringify(data).substring(0, 200)}\n`);
      return false;
    }
  } catch (error) {
    console.log(`  ✗ Connection Error: ${error.message}\n`);
    return false;
  }
}

// Test 3: Test tRPC endpoint
async function testTrpcEndpoint() {
  console.log('✓ Test 3: tRPC Endpoint Check');
  
  try {
    const response = await fetch(`${API_URL}/auth.me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`  ✓ tRPC endpoint accessible`);
      console.log(`  ✓ Response: ${JSON.stringify(data).substring(0, 100)}...\n`);
      return true;
    } else {
      console.log(`  ✗ HTTP ${response.status}: ${response.statusText}\n`);
      return false;
    }
  } catch (error) {
    console.log(`  ✗ Connection Error: ${error.message}\n`);
    return false;
  }
}

// Test 4: Check server health
async function checkServerHealth() {
  console.log('✓ Test 4: Server Health Check');
  
  try {
    const response = await fetch('http://localhost:3000/', {
      method: 'GET',
    });

    if (response.ok || response.status === 404) {
      console.log(`  ✓ Server is running (HTTP ${response.status})\n`);
      return true;
    } else {
      console.log(`  ✗ Server returned ${response.status}\n`);
      return false;
    }
  } catch (error) {
    console.log(`  ✗ Server not accessible: ${error.message}\n`);
    return false;
  }
}

// Test 5: Check diagnostic router
async function testDiagnosticRouter() {
  console.log('✓ Test 5: Diagnostic Router Check');
  
  try {
    const response = await fetch(`${API_URL}/diagnostic.list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`  ✓ Diagnostic router accessible`);
      console.log(`  ✓ Response type: ${typeof data.result?.data}\n`);
      return true;
    } else if (response.status === 401) {
      console.log(`  ⚠ Requires authentication (HTTP 401)\n`);
      return true; // This is expected for protected routes
    } else {
      console.log(`  ✗ HTTP ${response.status}: ${response.statusText}\n`);
      return false;
    }
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}\n`);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  const results = {
    kimiApi: await testKimiAPI(),
    trpcEndpoint: await testTrpcEndpoint(),
    serverHealth: await checkServerHealth(),
    diagnosticRouter: await testDiagnosticRouter(),
  };

  console.log('📊 TEST SUMMARY');
  console.log('=====================================');
  console.log(`Kimi API:           ${results.kimiApi ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`tRPC Endpoint:      ${results.trpcEndpoint ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`Server Health:      ${results.serverHealth ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`Diagnostic Router:  ${results.diagnosticRouter ? '✓ PASS' : '✗ FAIL'}`);
  console.log('=====================================\n');

  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.values(results).length;
  console.log(`Overall: ${passed}/${total} tests passed\n`);

  if (passed === total) {
    console.log('✓ All systems operational!\n');
  } else {
    console.log('✗ Some systems need attention\n');
  }

  process.exit(passed === total ? 0 : 1);
}

runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
