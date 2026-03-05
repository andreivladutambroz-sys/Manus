#!/usr/bin/env node

/**
 * E2E Test: Diagnostic Generation Flow
 * Tests: Vehicle selection → Symptoms → Diagnostic generation → Kimi API response
 */

// Use native fetch (Node 18+)

const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/trpc`;

console.log('🧪 E2E DIAGNOSTIC GENERATION TEST');
console.log('==================================\n');

// Test data
const testDiagnostic = {
  brand: 'Volkswagen',
  model: 'Golf',
  year: 2015,
  engine: '1.6 TDI',
  engineCode: 'CAYC',
  mileage: 145000,
  symptoms: ['Check Engine aprins', 'Pierdere putere'],
  errorCodes: ['P0101', 'P0128'],
  conditions: ['La accelerare', 'La ralanti'],
  category: 'motor',
  notes: 'Test diagnostic - Check Engine light on, loss of power at acceleration'
};

async function testDiagnosticCreation() {
  try {
    console.log('1. Testing Diagnostic Creation...');
    console.log(`   Vehicle: ${testDiagnostic.brand} ${testDiagnostic.model} (${testDiagnostic.year})`);
    console.log(`   Symptoms: ${testDiagnostic.symptoms.join(', ')}`);
    console.log(`   Error Codes: ${testDiagnostic.errorCodes.join(', ')}\n`);

    // Call tRPC diagnostic.create procedure
    const response = await fetch(`${API_URL}/diagnostic.create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: testDiagnostic
      })
    });

    if (!response.ok) {
      console.log(`   ✗ HTTP Error: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.log(`   Response: ${text.substring(0, 200)}`);
      return false;
    }

    const data = await response.json();
    console.log('   ✓ HTTP 200 OK');
    console.log(`   Response keys: ${Object.keys(data).join(', ')}\n`);

    if (data.error) {
      console.log(`   ✗ tRPC Error: ${data.error.message}`);
      return false;
    }

    if (data.result?.data) {
      const diagnostic = data.result.data;
      console.log('2. Diagnostic Created Successfully!');
      console.log(`   ID: ${diagnostic.id}`);
      console.log(`   Status: ${diagnostic.status}`);
      console.log(`   Created: ${diagnostic.createdAt}\n`);

      // Check if analysis was performed
      if (diagnostic.analysis) {
        console.log('3. Analysis Results Received!');
        console.log(`   Analysis type: ${typeof diagnostic.analysis}`);
        console.log(`   Analysis length: ${JSON.stringify(diagnostic.analysis).length} bytes\n`);

        // Parse analysis if it's a string
        let analysis = diagnostic.analysis;
        if (typeof analysis === 'string') {
          try {
            analysis = JSON.parse(analysis);
            console.log('   ✓ Analysis is valid JSON');
            console.log(`   Keys: ${Object.keys(analysis).join(', ')}\n`);
          } catch (e) {
            console.log('   ✓ Analysis is text format');
            console.log(`   Content preview: ${analysis.substring(0, 200)}...\n`);
          }
        }

        return true;
      } else {
        console.log('3. ⚠ No analysis in response (may be processing asynchronously)');
        console.log(`   Status: ${diagnostic.status}\n`);
        return true;
      }
    } else {
      console.log(`   ✗ Unexpected response structure`);
      console.log(`   Full response: ${JSON.stringify(data, null, 2)}`);
      return false;
    }
  } catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
    console.log(`   Stack: ${error.stack}`);
    return false;
  }
}

async function testKimiAPIDirectly() {
  try {
    console.log('4. Testing Kimi API Directly...');
    const kimiKey = process.env.KIMI_API_KEY;
    
    if (!kimiKey) {
      console.log('   ⚠ KIMI_API_KEY not set, skipping direct API test\n');
      return false;
    }

    console.log(`   Key: ${kimiKey.substring(0, 10)}...${kimiKey.substring(-5)}`);
    console.log(`   Endpoint: https://api.moonshot.ai/v1/chat/completions\n`);

    const response = await fetch('https://api.moonshot.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${kimiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'moonshot-v1-128k',
        messages: [
          {
            role: 'system',
            content: 'You are a car diagnostic expert. Analyze the following symptoms and provide a diagnosis.'
          },
          {
            role: 'user',
            content: `Diagnose this vehicle issue:\nBrand: ${testDiagnostic.brand}\nModel: ${testDiagnostic.model}\nYear: ${testDiagnostic.year}\nSymptoms: ${testDiagnostic.symptoms.join(', ')}\nError codes: ${testDiagnostic.errorCodes.join(', ')}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      console.log(`   ✗ HTTP Error: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.log(`   Response: ${text.substring(0, 200)}`);
      return false;
    }

    const data = await response.json();
    console.log('   ✓ HTTP 200 OK');
    console.log(`   Model: ${data.model}`);
    console.log(`   Tokens used: ${data.usage.total_tokens}`);
    
    if (data.choices?.[0]?.message?.content) {
      const content = data.choices[0].message.content;
      console.log(`   Response: ${content.substring(0, 150)}...\n`);
      return true;
    }

    return false;
  } catch (error) {
    console.log(`   ✗ Error: ${error.message}\n`);
    return false;
  }
}

async function runTests() {
  console.log(`Testing against: ${BASE_URL}\n`);

  const test1 = await testDiagnosticCreation();
  const test2 = await testKimiAPIDirectly();

  console.log('📊 TEST SUMMARY');
  console.log('================');
  console.log(`Diagnostic Creation: ${test1 ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`Kimi API Direct: ${test2 ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`\nOverall: ${test1 && test2 ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'}`);

  process.exit(test1 && test2 ? 0 : 1);
}

runTests();
