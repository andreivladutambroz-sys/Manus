#!/usr/bin/env node

import mysql from 'mysql2/promise';
import fs from 'fs';
import readline from 'readline';
import crypto from 'crypto';

const DB_CONFIG = {
  host: 'gateway02.us-east-1.prod.aws.tidbcloud.com',
  user: 'czn98hR1NJRAJqS.d1053c28687a',
  password: '5IO6tq8fM48yrSwOFf4x',
  database: 'f8JTLCpe9ZcHoBRdfShqpj',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: { rejectUnauthorized: false },
  port: 4000,
};

const BATCH_SIZE = 100;
const JSONL_FILE = './knowledge-base/knowledge-base-structured.jsonl';

async function generateRecordKey(record) {
  const vehicle = record.vehicle || {};
  const errorCode = record.error_code || {};
  const key = `${vehicle.make}-${vehicle.model}-${vehicle.year}-${errorCode.code}`;
  return crypto.createHash('md5').update(key).digest('hex');
}

async function importJSONL() {
  const pool = await mysql.createPool(DB_CONFIG);
  const conn = await pool.getConnection();

  console.log('📊 Starting JSONL import (parameterized queries)...');
  console.log(`📁 File: ${JSONL_FILE}`);
  console.log(`⚙️  Batch size: ${BATCH_SIZE}`);
  console.log('');

  let totalRecords = 0;
  let successRecords = 0;
  let skippedRecords = 0;
  let errorRecords = 0;
  let batch = [];
  const startTime = Date.now();

  try {
    const fileStream = fs.createReadStream(JSONL_FILE);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      if (!line.trim()) continue;

      try {
        totalRecords++;
        const record = JSON.parse(line);

        // Extract fields
        const vehicle = record.vehicle || {};
        const errorCode = record.error_code || {};
        const symptoms = record.symptoms || [];
        const procedures = record.repair_procedures || [];
        const tools = record.tools_required || [];
        const torque = record.torque_specs || [];

        const recordKey = await generateRecordKey(record);
        const make = vehicle.make || null;
        const model = vehicle.model || null;
        const year = vehicle.year || null;
        const engine = vehicle.engine || null;
        const engineCode = vehicle.engine_code || null;
        const code = errorCode.code || null;
        const system = errorCode.system || null;
        const description = errorCode.description || null;
        const confidence = record.confidence || 0.85;
        const sourceUrl = record.source_url || null;

        // Skip if missing critical fields
        if (!make || !code) {
          skippedRecords++;
          continue;
        }

        batch.push({
          recordKey,
          make,
          model,
          year,
          engine,
          engineCode,
          code,
          system,
          description,
          symptoms: JSON.stringify(symptoms),
          procedures: JSON.stringify(procedures),
          tools: JSON.stringify(tools),
          torque: JSON.stringify(torque),
          confidence,
          sourceUrl,
          rawJson: JSON.stringify(record),
        });

        // Insert batch when full
        if (batch.length >= BATCH_SIZE) {
          const inserted = await insertBatch(conn, batch);
          successRecords += inserted;
          batch = [];

          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          const rate = (successRecords / elapsed).toFixed(0);
          console.log(
            `✅ ${successRecords}/${totalRecords} (${rate} rec/sec) - Elapsed: ${elapsed}s`
          );
        }
      } catch (err) {
        errorRecords++;
        if (errorRecords <= 5) {
          console.error(`❌ Error parsing record ${totalRecords}: ${err.message}`);
        }
      }
    }

    // Insert remaining batch
    if (batch.length > 0) {
      const inserted = await insertBatch(conn, batch);
      successRecords += inserted;
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const rate = (successRecords / elapsed).toFixed(0);

    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('✅ IMPORT COMPLETE');
    console.log('═══════════════════════════════════════════');
    console.log(`Total records read: ${totalRecords}`);
    console.log(`Successfully imported: ${successRecords}`);
    console.log(`Skipped (missing fields): ${skippedRecords}`);
    console.log(`Errors: ${errorRecords}`);
    console.log(`Duration: ${elapsed}s`);
    console.log(`Throughput: ${rate} records/sec`);
    console.log('═══════════════════════════════════════════');

    // Verify import
    const [result] = await conn.query(
      'SELECT COUNT(*) as total, COUNT(DISTINCT error_code) as codes FROM knowledgeBase_raw'
    );
    console.log(`\n📊 Database verification:`);
    console.log(`   Total records: ${result[0].total}`);
    console.log(`   Unique error codes: ${result[0].codes}`);

  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  } finally {
    await conn.end();
    await pool.end();
  }
}

async function insertBatch(conn, batch) {
  if (batch.length === 0) return 0;

  const sql = `
    INSERT INTO knowledgeBase_raw 
    (record_key, make, model, year, engine, engine_code, error_code, system, description, 
     symptoms_json, repair_procedures_json, tools_json, torque_json, confidence, source_url, raw_json)
    VALUES ?
    ON DUPLICATE KEY UPDATE
    confidence = VALUES(confidence)
  `;

  const values = batch.map((r) => [
    r.recordKey,
    r.make,
    r.model,
    r.year,
    r.engine,
    r.engineCode,
    r.code,
    r.system,
    r.description,
    r.symptoms,
    r.procedures,
    r.tools,
    r.torque,
    r.confidence,
    r.sourceUrl,
    r.rawJson,
  ]);

  try {
    const [result] = await conn.query(sql, [values]);
    return result.affectedRows;
  } catch (err) {
    console.error(`Batch insert error: ${err.message}`);
    return 0;
  }
}

importJSONL().catch(console.error);
