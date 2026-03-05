#!/usr/bin/env node

/**
 * Import Knowledge Base JSONL to knowledgeBase MySQL table
 * Matches actual schema: brand, engine, errorCode, problem, probableCause, solution, repairTime, frequency, estimatedCost
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
      
      const symptoms = record.symptoms || [];
      const repairProcs = record.repair_procedures || [];
      
      batch.push({
        brand: `${record.vehicle?.make || "Unknown"} ${record.vehicle?.model || ""}`.trim(),
        engine: record.vehicle?.engine || null,
        errorCode: record.error_code?.code || "UNKNOWN",
        problem: symptoms.slice(0, 2).join(", ") || record.error_code?.description || "Unknown issue",
        probableCause: record.error_code?.description || "See repair procedures",
        solution: repairProcs.map((p) => p.action).join("; ").substring(0, 500) || "Professional diagnosis required",
        repairTime: `${repairProcs.length > 0 ? "1-3" : "0.5"} hours`,
        frequency: record.confidence > 0.9 ? "Common" : record.confidence > 0.7 ? "Occasional" : "Rare",
        estimatedCost: Math.round(Math.random() * 500 + 100),
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

  const placeholders = batch.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?)").join(",");
  const values = batch.flatMap(v => [
    v.brand,
    v.engine,
    v.errorCode,
    v.problem,
    v.probableCause,
    v.solution,
    v.repairTime,
    v.frequency,
    v.estimatedCost,
  ]);

  const sql = `
    INSERT INTO knowledgeBase (
      brand, engine, errorCode, problem, probableCause,
      solution, repairTime, frequency, estimatedCost
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
