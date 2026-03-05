#!/usr/bin/env node

/**
 * Import Knowledge Base JSONL to knowledgeBase MySQL table
 * Handles 102k+ diagnostic records
 */

import fs from "fs";
import readline from "readline";
import mysql from "mysql2/promise";

const JSONL_FILE = "./knowledge-base/knowledge-base-structured.jsonl";
const BATCH_SIZE = 100;

let connection;
let stats = {
  total: 0,
  imported: 0,
  failed: 0,
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

async function importJsonlToKb() {
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
      
      batch.push({
        vehicleMake: record.vehicle?.make || "Unknown",
        vehicleModel: record.vehicle?.model || "Unknown",
        vehicleYear: record.vehicle?.year || 2000,
        engineCode: record.vehicle?.engine_code || null,
        engine: record.vehicle?.engine || null,
        errorCode: record.error_code?.code || "UNKNOWN",
        codeSystem: record.error_code?.system || "Engine",
        codeDescription: record.error_code?.description || "",
        symptoms: JSON.stringify(record.symptoms || []),
        repairProcedures: JSON.stringify(record.repair_procedures || []),
        partsNeeded: JSON.stringify(record.parts_needed || []),
        toolsRequired: JSON.stringify(record.tools_required || []),
        torqueSpecs: JSON.stringify(record.torque_specs || []),
        confidence: record.confidence || 0.8,
        sourceUrl: record.source_url || "",
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

  const placeholders = batch.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(",");
  const values = batch.flatMap(v => [
    v.vehicleMake,
    v.vehicleModel,
    v.vehicleYear,
    v.engineCode,
    v.engine,
    v.errorCode,
    v.codeSystem,
    v.codeDescription,
    v.symptoms,
    v.repairProcedures,
    v.partsNeeded,
    v.toolsRequired,
    v.torqueSpecs,
    v.confidence,
    v.sourceUrl,
  ]);

  const sql = `
    INSERT INTO knowledgeBase (
      vehicleMake, vehicleModel, vehicleYear, engineCode, engine,
      errorCode, codeSystem, codeDescription, symptoms, repairProcedures,
      partsNeeded, toolsRequired, torqueSpecs, confidence, sourceUrl
    ) VALUES ${placeholders}
  `;

  try {
    await connection.execute(sql, values);
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
  console.log(`❌ Failed:         ${stats.failed}`);
  console.log(`📈 Success rate:   ${((stats.imported / stats.total) * 100).toFixed(2)}%`);
  console.log(`⏱️  Duration:       ${elapsed.toFixed(1)}s`);
  console.log(`🚀 Throughput:     ${rate} records/sec`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

async function main() {
  try {
    await connectDb();
    await importJsonlToKb();
    await connection.end();
    console.log("\n✅ Done!");
    process.exit(0);
  } catch (e) {
    console.error("❌ Error:", e.message);
    process.exit(1);
  }
}

main();
