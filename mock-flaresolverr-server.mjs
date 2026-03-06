#!/usr/bin/env node

/**
 * Mock FlareSolverr Server
 * 
 * Simulates FlareSolverr API for testing without Docker
 * Returns realistic HTML responses from epiesa.ro and autodoc.ro
 * 
 * Usage: node mock-flaresolverr-server.mjs
 * Then run: node run-swarm-flaresolverr.mjs --test
 */

import http from 'http';

const PORT = 8191;

// Mock HTML responses from suppliers
const mockResponses = {
  'epiesa.ro': `
    <!DOCTYPE html>
    <html>
    <head><title>ePiesa - Piese Auto</title></head>
    <body>
      <select name="marca">
        <option value="">Select brand</option>
        <option value="BMW">BMW</option>
        <option value="Mercedes">Mercedes-Benz</option>
        <option value="Audi">Audi</option>
      </select>
      
      <select name="model">
        <option value="">Select model</option>
        <option value="3-series">3 Series</option>
        <option value="5-series">5 Series</option>
      </select>
      
      <div class="product-item">
        <h3 class="product-title">Filtru Ulei BMW 3 Series</h3>
        <span class="price">45.99 RON</span>
        <code class="part-code">BOSCH-0451104100</code>
        <a href="/piesa/filtru-ulei-bmw">View</a>
      </div>
      
      <div class="product-item">
        <h3 class="product-title">Filtru Aer BMW 3 Series</h3>
        <span class="price">32.50 RON</span>
        <code class="part-code">MANN-C2532</code>
        <a href="/piesa/filtru-aer-bmw">View</a>
      </div>
      
      <div class="product-item">
        <h3 class="product-title">Bujii Incandescente BMW 3 Series</h3>
        <span class="price">89.99 RON</span>
        <code class="part-code">NGK-BPR6EY</code>
        <a href="/piesa/bujii-bmw">View</a>
      </div>
    </body>
    </html>
  `,
  
  'autodoc.ro': `
    <!DOCTYPE html>
    <html>
    <head><title>Autodoc - Piese Auto Online</title></head>
    <body>
      <select name="brand">
        <option value="">Select brand</option>
        <option value="BMW">BMW</option>
        <option value="Mercedes">Mercedes-Benz</option>
        <option value="Audi">Audi</option>
      </select>
      
      <select name="model">
        <option value="">Select model</option>
        <option value="C-Class">C-Class</option>
        <option value="E-Class">E-Class</option>
      </select>
      
      <div class="product-item">
        <h3 class="product-name">Filtru Ulei Mercedes C-Class</h3>
        <span class="price">52.99 RON</span>
        <span class="oem-code">BOSCH-0451103316</span>
        <a href="/part/filtru-ulei-mercedes">View</a>
      </div>
      
      <div class="product-item">
        <h3 class="product-name">Filtru Aer Mercedes C-Class</h3>
        <span class="price">38.50 RON</span>
        <span class="oem-code">MANN-C3532</span>
        <a href="/part/filtru-aer-mercedes">View</a>
      </div>
      
      <div class="product-item">
        <h3 class="product-name">Pernă Motor Mercedes C-Class</h3>
        <span class="price">125.00 RON</span>
        <span class="oem-code">LEMFÖRDER-37236</span>
        <a href="/part/perna-motor-mercedes">View</a>
      </div>
    </body>
    </html>
  `,
  
  'emag.ro': `
    <!DOCTYPE html>
    <html>
    <head><title>eMAG - Piese Auto</title></head>
    <body>
      <div class="product-item">
        <h3>Filtru Ulei Audi A4</h3>
        <span class="price">41.99 RON</span>
        <span class="part-code">BOSCH-0451103316</span>
      </div>
      <div class="product-item">
        <h3>Filtru Aer Audi A4</h3>
        <span class="price">35.00 RON</span>
        <span class="part-code">MANN-C2532</span>
      </div>
      <div class="product-item">
        <h3>Lichid Parbriz Audi A4</h3>
        <span class="price">15.99 RON</span>
        <span class="part-code">SONAX-272141</span>
      </div>
    </body>
    </html>
  `,
  
  'dedeman.ro': `
    <!DOCTYPE html>
    <html>
    <head><title>Dedeman - Piese Auto</title></head>
    <body>
      <div class="product-item">
        <h3>Filtru Ulei VW Golf</h3>
        <span class="price">38.50 RON</span>
        <span class="part-code">BOSCH-0451103316</span>
      </div>
      <div class="product-item">
        <h3>Filtru Aer VW Golf</h3>
        <span class="price">32.00 RON</span>
        <span class="part-code">MANN-C2532</span>
      </div>
      <div class="product-item">
        <h3>Ulei Motor VW Golf 5W30</h3>
        <span class="price">65.99 RON</span>
        <span class="part-code">SHELL-550040759</span>
      </div>
    </body>
    </html>
  `,
  
  'altex.ro': `
    <!DOCTYPE html>
    <html>
    <head><title>Altex - Accesorii Auto</title></head>
    <body>
      <div class="product-item">
        <h3>Filtru Ulei Ford Focus</h3>
        <span class="price">39.99 RON</span>
        <span class="part-code">BOSCH-0451103316</span>
      </div>
      <div class="product-item">
        <h3>Filtru Aer Ford Focus</h3>
        <span class="price">33.50 RON</span>
        <span class="part-code">MANN-C2532</span>
      </div>
      <div class="product-item">
        <h3>Bujii Ford Focus</h3>
        <span class="price">85.00 RON</span>
        <span class="part-code">NGK-BPR6EY</span>
      </div>
    </body>
    </html>
  `
};

// Mock cookies
const mockCookies = [
  { name: 'cf_clearance', value: 'mock_clearance_token_123' },
  { name: 'session', value: 'mock_session_token_456' }
];

const server = http.createServer((req, res) => {
  // Only handle POST requests to /v1
  if (req.method !== 'POST' || req.url !== '/v1') {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }

  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      const request = JSON.parse(body);
      
      // Extract domain from URL
      const url = request.url || '';
      let domain = 'epiesa.ro';
      
      if (url.includes('autodoc')) domain = 'autodoc.ro';
      else if (url.includes('emag')) domain = 'emag.ro';
      else if (url.includes('dedeman')) domain = 'dedeman.ro';
      else if (url.includes('altex')) domain = 'altex.ro';

      // Get mock response
      const mockHtml = mockResponses[domain] || mockResponses['epiesa.ro'];

      // Build response
      const response = {
        success: true,
        startTimestamp: Date.now(),
        endTimestamp: Date.now() + Math.random() * 5000,
        message: 'Challenge solved',
        solution: {
          url: url,
          status: 200,
          headers: {
            'content-type': 'text/html; charset=utf-8',
            'server': 'cloudflare'
          },
          response: mockHtml,
          cookies: mockCookies,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        cloudflareVersion: 2,
        resolveCount: 1,
        challengeInstructions: 'Cloudflare challenge solved',
        challengeForm: null,
        challengeScript: null,
        challengeNonce: null,
        challengeData: null
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));

      console.log(`[Mock FlareSolverr] ${request.cmd} - ${domain} - ${new Date().toISOString()}`);

    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: error.message }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log('🎭 MOCK FLARESOLVERR SERVER STARTED');
  console.log(`${'='.repeat(60)}`);
  console.log(`Listening on: http://localhost:${PORT}/v1`);
  console.log(`\nMock responses for:`);
  console.log('  - epiesa.ro');
  console.log('  - autodoc.ro');
  console.log('  - emag.ro');
  console.log('  - dedeman.ro');
  console.log('  - altex.ro');
  console.log(`\nRun in another terminal:`);
  console.log(`  node run-swarm-flaresolverr.mjs --test --agents 6`);
  console.log(`${'='.repeat(60)}\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Mock FlareSolverr] Shutting down...');
  server.close();
  process.exit(0);
});
