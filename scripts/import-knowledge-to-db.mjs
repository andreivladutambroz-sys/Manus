#!/usr/bin/env node

/**
 * Import Collected Knowledge Base into Supabase Database
 * Reads checkpoint.json and inserts into knowledgeBase table
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Supabase config
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
 * Insert record into knowledgeBase table
 */
async function insertKnowledgeRecord(record, index) {
  try {
    const { data, error } = await supabase.from("knowledgeBase").insert([
      {
        vehicle_make: record.make,
        vehicle_model: record.model,
        vehicle_generation: record.generation,
        vehicle_year: record.year,
        engine_code: record.engine,
        error_code: record.error_code,
        code_description: record.code_description,
        symptoms: record.symptoms,
        repair_steps: record.repair_steps,
        torque_specs: record.torque_specs,
        tools_required: record.tools_required,
        estimated_time_hours: record.estimated_time_hours,
        parts_needed: record.parts_needed,
        source_url: record.source_url,
        confidence_score: record.confidence,
        sources: record.sources,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error(`[${index}] ❌ Insert error:`, error.message);
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
async function importToDatabase() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  IMPORTING KNOWLEDGE BASE TO SUPABASE                      ║
╚════════════════════════════════════════════════════════════╝
`);

  const dedupMap = loadCheckpoint();
  const records = Array.from(Object.values(dedupMap));

  console.log(`📊 Records to import: ${records.length}`);
  console.log(`🚀 Starting batch insert...\n`);

  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < records.length; i++) {
    const success = await insertKnowledgeRecord(records[i], i + 1);
    if (success) {
      successCount++;
    } else {
      failureCount++;
    }

    // Rate limiting
    if ((i + 1) % 10 === 0) {
      console.log(`\n[Progress] ${i + 1}/${records.length} (${((i + 1) / records.length * 100).toFixed(1)}%)`);
      await new Promise((r) => setTimeout(r, 500));
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

🎯 NEXT: Verify data in database and build search indexes
`);
}

// Run import
importToDatabase().catch((error) => {
  console.error("❌ Import failed:", error);
  process.exit(1);
});
