/**
 * Import JSONL Knowledge Base to MySQL
 * 
 * Reads knowledge-base-structured.jsonl and imports into vehicles table
 */

import fs from "fs";
import readline from "readline";
import mysql from "mysql2/promise";

const DB_CONFIG = {
  host: process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] || "localhost",
  user: process.env.DATABASE_URL?.split("://")[1]?.split(":")[0] || "root",
  password: process.env.DATABASE_URL?.split(":")[2]?.split("@")[0] || "",
  database: process.env.DATABASE_URL?.split("/").pop() || "mechanic_helper",
};

const JSONL_FILE = "./knowledge-base/knowledge-base-structured.jsonl";
const BATCH_SIZE = 100;

let connection;

/**
 * Parse database URL
 */
function parseDbUrl(url) {
  if (!url) return DB_CONFIG;
  
  try {
    // Format: mysql://user:password@host:port/database?ssl=...
    const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+)(?::(\d+))?\/([^?]+)/);
    if (match) {
      return {
        user: match[1],
        password: match[2],
        host: match[3],
        port: match[4] || 3306,
        database: match[5],
      };
    }
  } catch (e) {
    console.warn("Could not parse DATABASE_URL, using defaults");
  }
  
  return DB_CONFIG;
}

/**
 * Connect to database
 */
async function connectDb() {
  const config = parseDbUrl(process.env.DATABASE_URL);
  console.log(`📊 Connecting to ${config.host}/${config.database}...`);
  
  // TiDB requires SSL
  const dbConfig = {
    ...config,
    ssl: { rejectUnauthorized: false },
    waitForConnections: true,
    connectionLimit: 1,
    queueLimit: 0,
  };
  
  connection = await mysql.createConnection(dbConfig);
  console.log("✅ Connected to MySQL");
}

/**
 * Import JSONL to MySQL
 */
async function importJsonlToMysql() {
  console.log(`📁 Reading ${JSONL_FILE}...`);
  
  if (!fs.existsSync(JSONL_FILE)) {
    console.error(`❌ File not found: ${JSONL_FILE}`);
    process.exit(1);
  }

  const fileStream = fs.createReadStream(JSONL_FILE);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let lineCount = 0;
  let importedCount = 0;
  let batch = [];

  for await (const line of rl) {
    lineCount++;

    if (!line.trim()) continue;

    try {
      const record = JSON.parse(line);
      const vehicle = record.vehicle;

      batch.push({
        brand: vehicle.make || "Unknown",
        model: vehicle.model || "Unknown",
        year: vehicle.year || 2000,
        engine: vehicle.engine || null,
        engineCode: vehicle.engine_code || null,
      });

      if (batch.length >= BATCH_SIZE) {
        await insertBatch(batch);
        importedCount += batch.length;
        console.log(`✅ Imported ${importedCount} vehicles (${lineCount} lines processed)`);
        batch = [];
      }
    } catch (e) {
      console.error(`⚠️ Line ${lineCount}: ${e.message}`);
    }
  }

  // Insert remaining batch
  if (batch.length > 0) {
    await insertBatch(batch);
    importedCount += batch.length;
    console.log(`✅ Imported ${importedCount} vehicles (final batch)`);
  }

  console.log(`\n✅ IMPORT COMPLETE`);
  console.log(`📊 Total lines: ${lineCount}`);
  console.log(`✅ Imported: ${importedCount}`);
  console.log(`📈 Success rate: ${((importedCount / lineCount) * 100).toFixed(2)}%`);
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
    INSERT INTO vehicles (brand, model, year, engine, engineCode, userId, createdAt, updatedAt)
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
 * Main
 */
async function main() {
  try {
    await connectDb();
    await importJsonlToMysql();
    await connection.end();
    console.log("\n✅ Done!");
  } catch (e) {
    console.error("❌ Error:", e.message);
    process.exit(1);
  }
}

main();
