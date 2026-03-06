#!/usr/bin/env node

/**
 * STANDALONE DATA COLLECTION RUNNER
 * Collects real vehicle and parts data from multiple sources
 * 
 * Usage: node run-data-collection.mjs
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { createConnection } from 'mysql2/promise';

const KIMI_API_URL = process.env.BUILT_IN_FORGE_API_URL || 'https://api.moonshot.ai';
const KIMI_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;
const DB_URL = process.env.DATABASE_URL;

// ============================================================================
// CONFIGURATION
// ============================================================================

const SOURCES = [
  {
    name: 'epiesa.ro',
    url: 'https://www.epiesa.ro/',
    type: 'parts',
    selectors: {
      items: '.product-item, [data-product]',
      name: '.product-name, [data-name]',
      code: '.oem-code, [data-oem]',
      price: '.price, [data-price]',
    },
  },
  {
    name: 'autodoc.ro',
    url: 'https://www.autodoc.ro/',
    type: 'parts',
    selectors: {
      items: '.catalog-item, [data-product]',
      name: '.title, [data-name]',
      code: '.code, [data-code]',
      price: '.price, [data-price]',
    },
  },
];

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
];

// ============================================================================
// UTILITIES
// ============================================================================

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchWithRetry(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios.get(url, {
        headers: { 'User-Agent': getRandomUserAgent() },
        timeout: 30000,
      });
      return response.data;
    } catch (error) {
      console.log(`  ⚠ Retry ${i + 1}/${maxRetries} for ${url}`);
      if (i === maxRetries - 1) throw error;
      await sleep(2000 * (i + 1));
    }
  }
}

// ============================================================================
// DATA EXTRACTION
// ============================================================================

async function extractVehicles(html, source) {
  const $ = cheerio.load(html);
  const vehicles = [];

  // Generic vehicle extraction
  $('[data-vehicle], .vehicle, .car').each((_, el) => {
    const $el = $(el);
    const vehicle = {
      brand: $el.find('[data-brand], .brand').text().trim(),
      model: $el.find('[data-model], .model').text().trim(),
      year: $el.find('[data-year], .year').text().trim(),
      engine: $el.find('[data-engine], .engine').text().trim(),
      source: source.name,
    };

    if (vehicle.brand && vehicle.model) {
      vehicles.push(vehicle);
    }
  });

  return vehicles;
}

async function extractParts(html, source) {
  const $ = cheerio.load(html);
  const parts = [];

  $(source.selectors.items).each((_, el) => {
    const $el = $(el);
    const part = {
      name: $el.find(source.selectors.name).text().trim(),
      code: $el.find(source.selectors.code).text().trim(),
      price: $el.find(source.selectors.price).text().trim(),
      source: source.name,
    };

    if (part.name && part.code) {
      parts.push(part);
    }
  });

  return parts;
}

// ============================================================================
// DATA VALIDATION & ENRICHMENT
// ============================================================================

function validateRecord(record) {
  const errors = [];
  let score = 100;

  if (!record.name && !record.brand) { errors.push('Missing name/brand'); score -= 20; }
  if (!record.source) { errors.push('Missing source'); score -= 20; }

  return {
    valid: errors.length === 0 && score >= 70,
    score: Math.max(0, score),
    errors,
  };
}

async function enrichWithAI(record) {
  if (!KIMI_API_KEY) {
    console.log('  ⚠ Skipping AI enrichment (no API key)');
    return record;
  }

  try {
    const prompt = `Analyze this part/vehicle and provide:
1. Category (engine, transmission, suspension, etc.)
2. Quality rating (0-10)
3. Common issues (if applicable)

Data: ${JSON.stringify(record)}

Return ONLY valid JSON: {"category":"...","quality":8,"issues":["..."]}`;

    const response = await axios.post(
      `${KIMI_API_URL}/v1/chat/completions`,
      {
        model: 'moonshot-v1-256k',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 200,
      },
      {
        headers: {
          'Authorization': `Bearer ${KIMI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const content = response.data.choices[0].message.content;
    const enriched = JSON.parse(content);
    return { ...record, ...enriched, enriched: true };
  } catch (error) {
    console.log(`  ⚠ AI enrichment failed: ${error.message}`);
    return { ...record, enriched: false };
  }
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

async function storeRecords(records, connection) {
  let stored = 0;

  for (const record of records) {
    try {
      const query = `
        INSERT INTO collected_data 
        (source, data_type, name, code, brand, model, year, engine, price, quality_score, validation_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await connection.execute(query, [
        record.source,
        record.type || 'unknown',
        record.name || record.brand || '',
        record.code || '',
        record.brand || '',
        record.model || '',
        record.year || '',
        record.engine || '',
        record.price || '',
        record.score || 85,
        record.valid ? 'approved' : 'rejected',
      ]);

      stored++;
    } catch (error) {
      console.log(`  ⚠ Failed to store record: ${error.message}`);
    }
  }

  return stored;
}

// ============================================================================
// MAIN PIPELINE
// ============================================================================

async function runPipeline() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║   REAL DATA COLLECTION PIPELINE STARTED   ║');
  console.log('╚════════════════════════════════════════════╝\n');

  const startTime = Date.now();
  let totalHarvested = 0;
  let totalValidated = 0;
  let totalStored = 0;

  let connection;

  try {
    // Connect to database
    console.log('📡 Connecting to database...');
    connection = await createConnection({
      uri: DB_URL,
      supportBigNumbers: true,
      bigNumberStrings: true,
    });
    console.log('✓ Database connected\n');

    // Process each source
    for (const source of SOURCES) {
      console.log(`📥 Scraping ${source.name}...`);

      try {
        const html = await fetchWithRetry(source.url);
        console.log('✓ HTML fetched');

        // Extract data
        let records = [];
        if (source.type === 'parts') {
          records = await extractParts(html, source);
        } else {
          records = await extractVehicles(html, source);
        }
        console.log(`  → Extracted ${records.length} records`);
        totalHarvested += records.length;

        // Validate
        const validated = records
          .map(r => ({ ...r, validation: validateRecord(r) }))
          .filter(r => r.validation.valid)
          .map(r => ({ ...r, score: r.validation.score }));
        console.log(`  → Validated ${validated.length} records`);
        totalValidated += validated.length;

        // Enrich (sample only to avoid rate limits)
        const toEnrich = validated.slice(0, 3);
        const enriched = await Promise.all(toEnrich.map(r => enrichWithAI(r)));
        console.log(`  → Enriched ${enriched.length} records`);

        // Store
        const stored = await storeRecords(validated, connection);
        console.log(`  → Stored ${stored} records\n`);
        totalStored += stored;

        // Rate limiting
        await sleep(3000);
      } catch (error) {
        console.log(`  ✗ Error: ${error.message}\n`);
      }
    }

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('╔════════════════════════════════════════════╗');
    console.log('║          COLLECTION COMPLETED             ║');
    console.log('╚════════════════════════════════════════════╝\n');
    console.log(`📊 RESULTS:`);
    console.log(`   Harvested: ${totalHarvested}`);
    console.log(`   Validated: ${totalValidated}`);
    console.log(`   Stored:    ${totalStored}`);
    console.log(`   Duration:  ${duration}s\n`);

  } catch (error) {
    console.error('❌ Pipeline error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// ============================================================================
// RUN
// ============================================================================

runPipeline().catch(console.error);
