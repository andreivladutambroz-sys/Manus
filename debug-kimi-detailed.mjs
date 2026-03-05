#!/usr/bin/env node
/**
 * Detailed Kimi API Debug Script
 */

const KIMI_API_KEY = process.env.KIMI_API_KEY || '';

console.log('🔍 DETAILED KIMI API DEBUG');
console.log('==========================\n');

console.log('1. Environment Check:');
console.log(`   KIMI_API_KEY: ${KIMI_API_KEY ? '✓ SET' : '✗ MISSING'}`);
console.log(`   Key length: ${KIMI_API_KEY.length}`);
console.log(`   Key starts with: ${KIMI_API_KEY.substring(0, 10)}`);
console.log(`   Key ends with: ${KIMI_API_KEY.substring(KIMI_API_KEY.length - 10)}\n`);

async function testKimiAPI() {
  console.log('2. Testing Kimi API Endpoint:');
  console.log(`   URL: https://api.moonshot.ai/v1/chat/completions`);
  console.log(`   Method: POST`);
  console.log(`   Headers:`);
  console.log(`     Authorization: Bearer ${KIMI_API_KEY.substring(0, 10)}...`);
  console.log(`     Content-Type: application/json\n`);

  const requestBody = {
    model: 'moonshot-v1-128k',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant.',
      },
      {
        role: 'user',
        content: 'Say "OK".',
      },
    ],
    temperature: 0.1,
    max_tokens: 10,
  };

  console.log('3. Request Body:');
  console.log(`   ${JSON.stringify(requestBody, null, 2)}\n`);

  try {
    console.log('4. Sending Request...\n');
    
    const response = await fetch('https://api.moonshot.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KIMI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('5. Response Status:');
    console.log(`   Status Code: ${response.status}`);
    console.log(`   Status Text: ${response.statusText}`);
    console.log(`   Headers:`);
    for (const [key, value] of response.headers) {
      console.log(`     ${key}: ${value}`);
    }
    console.log('');

    const data = await response.json();

    console.log('6. Response Body:');
    console.log(`   ${JSON.stringify(data, null, 2)}`);
    console.log('');

    if (response.ok) {
      console.log('✅ SUCCESS!');
      console.log(`   Message: ${data.choices?.[0]?.message?.content}`);
    } else {
      console.log('❌ ERROR!');
      console.log(`   Error: ${data.error?.message}`);
      console.log(`   Type: ${data.error?.type}`);
      
      // Additional debugging
      if (data.error?.message === 'Invalid Authentication') {
        console.log('');
        console.log('   Debugging Invalid Authentication:');
        console.log(`   - Key format: ${KIMI_API_KEY.startsWith('sk-') ? '✓ Correct' : '✗ Wrong'}`);
        console.log(`   - Key length: ${KIMI_API_KEY.length} chars`);
        console.log(`   - Authorization header: Bearer ${KIMI_API_KEY.substring(0, 20)}...`);
        console.log(`   - Possible causes:`);
        console.log(`     1. Key is expired or revoked`);
        console.log(`     2. Key has been deleted from account`);
        console.log(`     3. Account has no credit`);
        console.log(`     4. Key is for different API version`);
        console.log(`     5. Network/firewall blocking`);
        console.log(`     6. Endpoint URL changed`);
      }
      console.log('');
    }
  } catch (error) {
    console.log('❌ NETWORK ERROR!');
    console.log(`   Error: ${error.message}`);
    console.log(`   Stack: ${error.stack}`);
  }
}

testKimiAPI().catch(console.error);
