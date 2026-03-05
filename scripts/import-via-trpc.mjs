#!/usr/bin/env node

/**
 * Import Knowledge Base via tRPC Backend Endpoint
 * Uses authenticated backend calls to insert data into Supabase
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";
const JWT_TOKEN = process.env.JWT_TOKEN || ""; // Admin token if needed

/**
 * Load checkpoint data
 */
function loadCheckpoint() {
  const checkpointPath = path.join(__dirname, "..", "knowledge-base", "checkpoint.json");

  if (!fs.existsSync(checkpointPath)) {
    console.error("❌ Checkpoint file not found");
    process.exit(1);
  }

  try {
    const data = JSON.parse(fs.readFileSync(checkpointPath, "utf-8"));
    return data.deduplicationMap || {};
  } catch (error) {
    console.error("❌ Failed to parse checkpoint:", error.message);
    process.exit(1);
  }
}

/**
 * Call tRPC endpoint to insert knowledge record
 */
async function insertViaTripc(record, index) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/trpc/dataImport.importBatch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(JWT_TOKEN && { Authorization: `Bearer ${JWT_TOKEN}` }),
      },
      body: JSON.stringify({
        input: {
          vehicles: [
            {
              make: record.make,
              model: record.model,
              generation: record.generation,
              year: record.year,
              engine_code: record.engine,
              engine_type: record.engine,
              power_kw: 150, // Default
              torque_nm: 250, // Default
            },
          ],
          error_codes: [
            {
              code: record.error_code,
              system: "Engine",
              description: record.code_description,
              severity: "warning",
            },
          ],
          procedures: [
            {
              title: `Fix ${record.error_code}`,
              difficulty: "intermediate",
              time_hours: record.estimated_time_hours,
              tools_required: record.tools_required,
              steps: record.repair_steps,
              torque_specs: record.torque_specs,
              parts_needed: record.parts_needed,
            },
          ],
        },
      }),
    });

    if (!response.ok) {
      console.error(`[${index}] ❌ HTTP ${response.status}`);
      return false;
    }

    const result = await response.json();

    if (result.error) {
      console.error(`[${index}] ❌ tRPC error:`, result.error.message);
      return false;
    }

    console.log(`[${index}] ✅ Inserted: ${record.make} ${record.model} - ${record.error_code}`);
    return true;
  } catch (error) {
    console.error(`[${index}] ❌ Exception:`, error.message);
    return false;
  }
}

/**
 * Main import process
 */
async function importViaTripc() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  IMPORTING KNOWLEDGE BASE VIA tRPC                         ║
║  Backend: ${BACKEND_URL}
╚════════════════════════════════════════════════════════════╝
`);

  const dedupMap = loadCheckpoint();
  const records = Array.from(Object.values(dedupMap));

  console.log(`📊 Records to import: ${records.length}`);
  console.log(`🚀 Starting batch insert via tRPC...\n`);

  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < records.length; i++) {
    const success = await insertViaTripc(records[i], i + 1);
    if (success) {
      successCount++;
    } else {
      failureCount++;
    }

    // Rate limiting
    if ((i + 1) % 10 === 0) {
      console.log(`\n[Progress] ${i + 1}/${records.length} (${((i + 1) / records.length * 100).toFixed(1)}%)`);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  console.log(`
╔════════════════════════════════════════════════════════════╗
║  IMPORT COMPLETE                                           ║
╚════════════════════════════════════════════════════════════╝

📊 STATISTICS:
  Total records: ${records.length}
  ✅ Successful: ${successCount}
  ❌ Failed: ${failureCount}
  Success rate: ${((successCount / records.length) * 100).toFixed(1)}%

✅ Data now available in Supabase database!
`);
}

// Run import
importViaTripc().catch((error) => {
  console.error("❌ Import failed:", error);
  process.exit(1);
});
