#!/usr/bin/env node

/**
 * Import Knowledge Base JSONL to knowledgeBase_raw MySQL table
 * Preserves complete structure with JSON fields
 */

import fs from "fs";
import readline from "readline";
import mysql from "mysql2/promise";
import crypto from "crypto";

const JSONL_FILE = "./knowledge-base/knowledge-base-structured.jsonl";
const BATCH_SIZE = 100;

let connection;
let stats = {
  total: 0,
  imported: 0,
  failed: 0,
  duplicates: 0,
  startTime: Date.now(),
};

function parseDbUrl(url) {
  if (!url) throw new Error("DATABASE_URL not set");
  
  try {
    const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+)(?::(\d+))?\/([^?]+)/);
    if (match) {
      return {
        user: match[1],
        password: match[2],
        host: match[3],
        port: parseInt(match[4]) || 3306,
        database: match[5],
        ssl: { rejectUnauthorized: false },
      };
    }
  } catch (e) {
    console.error("Failed to parse DATABASE_URL");
  }
  
  throw new Error("Invalid DATABASE_URL format");
}

async function connectDb() {
  const config = parseDbUrl(process.env.DATABASE_URL);
  console.log(`📊 Connecting to ${config.host}/${config.database}...`);
  
  connection = await mysql.createConnection(config);
  console.log("✅ Connected to MySQL");
}

function generateRecordKey(record) {
  const vehicle = record.vehicle || {};
  const errorCode = record.error_code || {};
  const key = `${vehicle.make || 'unknown'}_${vehicle.model || 'unknown'}_${vehicle.year || 'unknown'}_${errorCode.code || 'unknown'}`;
  const hash = crypto.createHash('md5').update(key).digest('hex').substring(0, 16);
  return `${key.replace(/\s+/g, '_').substring(0, 50)}_${hash}`;
}

async function importJsonlToRaw() {
  console.log(`📁 Reading ${JSONL_FILE}...`);
  
  if (!fs.existsSync(JSONL_FILE)) {
    throw new Error(`File not found: ${JSONL_FILE}`);
  }

  const fileStream = fs.createReadStream(JSONL_FILE);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let batch = [];

  for await (const line of rl) {
    stats.total++;

    if (!line.trim()) continue;

    try {
      const record = JSON.parse(line);
      const vehicle = record.vehicle || {};
      const errorCode = record.error_code || {};
      
      const recordKey = generateRecordKey(record);
      
      batch.push({
        recordKey,
        make: vehicle.make || null,
        model: vehicle.model || null,
        year: vehicle.year || null,
        engine: vehicle.engine || null,
        engineCode: vehicle.engine_code || null,
        errorCode: errorCode.code || null,
        system: errorCode.system || null,
        description: errorCode.description || null,
        symptomsJson: JSON.stringify(record.symptoms || []),
        repairProceduresJson: JSON.stringify(record.repair_procedures || []),
        toolsJson: JSON.stringify(record.tools_required || []),
        torqueJson: JSON.stringify(record.torque_specs || []),
        confidence: record.confidence || 0.8,
        sourceUrl: record.source_url || null,
        rawJson: JSON.stringify(record),
      });

      if (batch.length >= BATCH_SIZE) {
        await insertBatch(batch);
        stats.imported += batch.length;
        
        const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(1);
        const rate = (stats.imported / elapsed).toFixed(0);
        console.log(`✅ ${stats.imported}/${stats.total} (${rate} rec/sec) - Elapsed: ${elapsed}s`);
        
        batch = [];
      }
    } catch (e) {
      stats.failed++;
      if (stats.failed <= 5) {
        console.warn(`⚠️ Line ${stats.total}: ${e.message}`);
      }
    }
  }

  // Insert remaining batch
  if (batch.length > 0) {
    await insertBatch(batch);
    stats.imported += batch.length;
  }

  printStats();
}

async function insertBatch(batch) {
  if (batch.length === 0) return;

  const placeholders = batch.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(",");
  const values = batch.flatMap(v => [
    v.recordKey,
    v.make,
    v.model,
    v.year,
    v.engine,
    v.engineCode,
    v.errorCode,
    v.system,
    v.description,
    v.symptomsJson,
    v.repairProceduresJson,
    v.toolsJson,
    v.torqueJson,
    v.confidence,
    v.sourceUrl,
    v.rawJson,
  ]);

  const sql = `
    INSERT INTO knowledgeBase_raw (
      record_key, make, model, year, engine, engine_code,
      error_code, system, description, symptoms_json,
      repair_procedures_json, tools_json, torque_json,
      confidence, source_url, raw_json
    ) VALUES ${placeholders}
    ON DUPLICATE KEY UPDATE
      id = LAST_INSERT_ID(id)
  `;

  try {
    const [result] = await connection.execute(sql, values);
    if (result.affectedRows < batch.length) {
      stats.duplicates += batch.length - result.affectedRows;
    }
  } catch (e) {
    console.error(`❌ Batch insert error: ${e.message}`);
    throw e;
  }
}

function printStats() {
  const elapsed = (Date.now() - stats.startTime) / 1000;
  const rate = (stats.imported / elapsed).toFixed(2);
  
  console.log(`\n✅ IMPORT COMPLETE`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 Total lines:    ${stats.total}`);
  console.log(`✅ Imported:       ${stats.imported}`);
  console.log(`⚠️  Duplicates:     ${stats.duplicates}`);
  console.log(`❌ Failed:         ${stats.failed}`);
  console.log(`📈 Success rate:   ${((stats.imported / stats.total) * 100).toFixed(2)}%`);
  console.log(`⏱️  Duration:       ${elapsed.toFixed(1)}s`);
  console.log(`🚀 Throughput:     ${rate} records/sec`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

async function main() {
  try {
    await connectDb();
    await importJsonlToRaw();
    await connection.end();
    console.log("\n✅ Done!");
    process.exit(0);
  } catch (e) {
    console.error("❌ Error:", e.message);
    process.exit(1);
  }
}

main();
