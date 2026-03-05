#!/usr/bin/env node

/**
 * Import Knowledge Base JSONL to MySQL
 * Optimized for 78k+ records with batch processing
 */

import fs from "fs";
import readline from "readline";
import mysql from "mysql2/promise";

const JSONL_FILE = "./knowledge-base/knowledge-base-structured.jsonl";
const BATCH_SIZE = 500;

let connection;
let stats = {
  total: 0,
  imported: 0,
  failed: 0,
  startTime: Date.now(),
};

/**
 * Parse database URL
 */
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

/**
 * Connect to database
 */
async function connectDb() {
  const config = parseDbUrl(process.env.DATABASE_URL);
  console.log(`📊 Connecting to ${config.host}/${config.database}...`);
  
  connection = await mysql.createConnection(config);
  console.log("✅ Connected to MySQL");
}

/**
 * Import JSONL to MySQL
 */
async function importJsonlToMysql() {
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

      batch.push({
        brand: vehicle.make || "Unknown",
        model: vehicle.model || "Unknown",
        year: vehicle.year || 2000,
        engine: vehicle.engine || null,
        engineCode: vehicle.engine_code || null,
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

/**
 * Insert batch of vehicles
 */
async function insertBatch(batch) {
  if (batch.length === 0) return;

  const values = batch
    .map(
      (v) =>
        `(1, '${v.brand.replace(/'/g, "\\'")}', '${v.model.replace(/'/g, "\\'")}', ${v.year}, ${
          v.engine ? `'${v.engine.replace(/'/g, "\\'")}'` : "NULL"
        }, ${v.engineCode ? `'${v.engineCode.replace(/'/g, "\\'")}'` : "NULL"})`
    )
    .join(",");

  const sql = `
    INSERT INTO vehicles (userId, brand, model, year, engine, engineCode)
    VALUES ${values}
  `;

  try {
    await connection.execute(sql);
  } catch (e) {
    console.error(`❌ Batch insert error: ${e.message}`);
    throw e;
  }
}

/**
 * Print final statistics
 */
function printStats() {
  const elapsed = (Date.now() - stats.startTime) / 1000;
  const rate = (stats.imported / elapsed).toFixed(2);
  
  console.log(`\n✅ IMPORT COMPLETE`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 Total lines:    ${stats.total}`);
  console.log(`✅ Imported:       ${stats.imported}`);
  console.log(`❌ Failed:         ${stats.failed}`);
  console.log(`📈 Success rate:   ${((stats.imported / stats.total) * 100).toFixed(2)}%`);
  console.log(`⏱️  Duration:       ${elapsed.toFixed(1)}s`);
  console.log(`🚀 Throughput:     ${rate} records/sec`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

/**
 * Main
 */
async function main() {
  try {
    await connectDb();
    await importJsonlToMysql();
    await connection.end();
    console.log("\n✅ Done!");
    process.exit(0);
  } catch (e) {
    console.error("❌ Error:", e.message);
    process.exit(1);
  }
}

main();
