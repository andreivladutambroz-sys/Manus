#!/usr/bin/env node

/**
 * Optimized Kimi Orchestrator - Structured Output
 * Produces clean, well-organized JSON for each repair knowledge entry
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_KEY = process.env.KIMI_API_KEY || "";
const API_URL = "https://api.moonshot.ai/v1/chat/completions";
const MODEL = "moonshot-v1-8k";

// Configuration
const CONFIG = {
  MAX_RETRIES: 5,
  TIMEOUT_MS: 30000,
  RATE_LIMIT_DELAY_MS: 1000,
  CONCURRENT_AGENTS: 3,
};

// Global state
let totalExtracted = 0;
let totalUnique = 0;
let deduplicationMap = new Map();
const sessionStartTime = Date.now();

/**
 * Generate deduplication hash
 */
function generateHash(data) {
  const key = `${data.vehicle.make}|${data.vehicle.model}|${data.vehicle.year}|${data.vehicle.engine_code}|${data.error_code.code}`;
  return Buffer.from(key).toString("base64");
}

/**
 * Check and merge duplicates
 */
function checkDuplicate(record) {
  const hash = generateHash(record);

  if (deduplicationMap.has(hash)) {
    const existing = deduplicationMap.get(hash);
    // Merge sources
    existing.sources = [...new Set([...(existing.sources || []), ...(record.sources || [])])];
    existing.confidence = Math.min(0.99, existing.confidence + 0.05);
    return null; // Skip - duplicate
  }

  deduplicationMap.set(hash, record);
  totalUnique++;
  return record;
}

/**
 * Call Kimi API with retry logic
 */
async function callKimiAPI(agentPrompt, retries = CONFIG.MAX_RETRIES) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: "user", content: agentPrompt }],
          temperature: 0.3,
          max_tokens: 4000,
        }),
        timeout: CONFIG.TIMEOUT_MS,
      });

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 429) {
          const delay = CONFIG.RATE_LIMIT_DELAY_MS * Math.pow(2, attempt);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        throw new Error(error.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || null;
    } catch (error) {
      if (attempt < retries - 1) {
        await new Promise((r) => setTimeout(r, CONFIG.RATE_LIMIT_DELAY_MS * (attempt + 1)));
      }
    }
  }
  return null;
}

/**
 * Execute single agent
 */
async function executeAgent(agent, groupName) {
  const urlsList = agent.urls.join("\n");

  const prompt = `You are an automotive repair data extraction specialist.

Extract repair knowledge from these sources:
${urlsList}

Return ONLY valid JSON array (no markdown, no code blocks):
[
  {
    "vehicle": {
      "make": "Toyota",
      "model": "Tacoma",
      "year": 2016,
      "engine_code": "2GR-FKS",
      "engine": "3.5L V6"
    },
    "error_code": {
      "code": "P0171",
      "system": "Fuel System",
      "description": "System Too Lean"
    },
    "symptoms": [
      "poor acceleration",
      "drop in fuel economy"
    ],
    "repair_procedures": [
      {
        "step": 1,
        "action": "Inspect intake system for vacuum leaks"
      },
      {
        "step": 2,
        "action": "Test mass airflow sensor"
      },
      {
        "step": 3,
        "action": "Replace upstream oxygen sensor if faulty"
      }
    ],
    "torque_specs": [
      {
        "component": "oxygen sensor",
        "value_nm": 20
      }
    ],
    "tools_required": [
      "vacuum pump",
      "O2 sensor socket"
    ],
    "confidence": 0.84,
    "source_url": "https://example.com/..."
  }
]

CRITICAL: Return ONLY valid JSON array. No explanations. Each record must have: vehicle, error_code, symptoms, repair_procedures, torque_specs, tools_required, confidence, source_url.`;

  const result = await callKimiAPI(prompt);

  if (!result) {
    return [];
  }

  try {
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    const records = JSON.parse(jsonMatch ? jsonMatch[0] : result);

    if (!Array.isArray(records)) {
      return [];
    }

    let extracted = 0;
    for (const record of records) {
      totalExtracted++;
      const deduped = checkDuplicate(record);

      if (deduped) {
        extracted++;
        console.log(
          `  ✓ ${record.vehicle.make} ${record.vehicle.model} - ${record.error_code.code}`
        );
      }
    }

    if (extracted > 0) {
      console.log(
        `[${groupName}] ${agent.name}: +${extracted} records (Total unique: ${totalUnique})`
      );
    }

    return records;
  } catch (error) {
    return [];
  }
}

/**
 * Execute agent group
 */
async function executeAgentGroup(groupName, agents) {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`🚀 GROUP: ${groupName}`);
  console.log(`${"=".repeat(70)}`);

  for (let i = 0; i < agents.length; i += CONFIG.CONCURRENT_AGENTS) {
    const batch = agents.slice(i, i + CONFIG.CONCURRENT_AGENTS);
    const batchPromises = batch.map((agent) => executeAgent(agent, groupName));

    await Promise.all(batchPromises);

    console.log(`[${groupName}] Batch ${Math.floor(i / CONFIG.CONCURRENT_AGENTS) + 1} complete`);
    console.log(`  Extracted: ${totalExtracted} | Unique: ${totalUnique}`);

    await new Promise((r) => setTimeout(r, 1000));
  }
}

/**
 * Main orchestration
 */
async function orchestrate() {
  console.log(`
╔════════════════════════════════════════════════════════════════════╗
║  KIMI ORCHESTRATOR - STRUCTURED OUTPUT                            ║
║  Clean JSON Format | Zero Duplicates | Infinite Loop              ║
╚════════════════════════════════════════════════════════════════════╝
`);

  const outputDir = path.join(__dirname, "..", "knowledge-base");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputFile = path.join(outputDir, `knowledge-base-structured.jsonl`);
  const outputStream = fs.createWriteStream(outputFile, { flags: "a" });

  const AGENT_GROUPS = {
    "Brand Forums": [
      {
        name: "VW/Audi/Skoda/Seat",
        urls: [
          "https://www.vwvortex.com",
          "https://forums.tdiclub.com",
          "https://www.briskoda.net/forums",
        ],
      },
      {
        name: "BMW/MINI",
        urls: ["https://www.bimmerforums.com", "https://www.bimmerpost.com"],
      },
      {
        name: "Mercedes",
        urls: ["https://mbworld.org/forums", "https://www.benzworld.org"],
      },
      {
        name: "Toyota/Lexus",
        urls: ["https://www.toyotanation.com", "https://www.clublexus.com/forums"],
      },
      {
        name: "Honda/Acura",
        urls: ["https://honda-tech.com", "https://acurazine.com/forums"],
      },
      {
        name: "Ford/GM/Chrysler",
        urls: ["https://www.f150forum.com", "https://www.corvetteforum.com"],
      },
      {
        name: "Subaru/Nissan/EV",
        urls: ["https://forums.nasioc.com", "https://teslamotorsclub.com"],
      },
    ],
    "OBD/DTC Codes": [
      {
        name: "Code Databases",
        urls: [
          "https://www.obd-codes.com",
          "https://www.engine-codes.com",
          "https://www.troublecodes.net",
        ],
      },
      {
        name: "Complaint Databases",
        urls: ["https://carcomplaints.com", "https://repairpal.com"],
      },
      {
        name: "Mechanic Forums",
        urls: ["https://www.iatn.net", "https://forums.ross-tech.com"],
      },
    ],
    "Manuals & Docs": [
      {
        name: "Manual Libraries",
        urls: ["https://manualslib.com", "https://manualzz.com"],
      },
      {
        name: "Archive Sites",
        urls: ["https://archive.org", "https://docplayer.net"],
      },
      {
        name: "Parts Catalogs",
        urls: ["https://partsouq.com", "https://www.realoem.com"],
      },
    ],
    "GitHub & Datasets": [
      {
        name: "Open-Source Auto",
        urls: ["https://github.com/opengarages", "https://github.com/OBDb"],
      },
      {
        name: "Repair Procedures",
        urls: ["https://github.com"],
      },
    ],
    "Communities": [
      {
        name: "Reddit",
        urls: [
          "https://www.reddit.com/r/MechanicAdvice",
          "https://www.reddit.com/r/Cartalk",
        ],
      },
      {
        name: "International Forums",
        urls: ["https://www.pistonheads.com", "https://www.team-bhp.com"],
      },
      {
        name: "Niche Brands",
        urls: [
          "https://www.hyundai-forums.com",
          "https://www.mazdaforum.com",
          "https://www.volvoforums.org.uk",
        ],
      },
    ],
  };

  let iteration = 0;
  const maxIterations = 100;

  while (iteration < maxIterations) {
    iteration++;
    console.log(`\n${"#".repeat(70)}`);
    console.log(`ITERATION ${iteration}/${maxIterations}`);
    console.log(`${"#".repeat(70)}`);

    for (const [groupName, agents] of Object.entries(AGENT_GROUPS)) {
      await executeAgentGroup(groupName, agents);

      // Save records to JSONL
      for (const [, record] of deduplicationMap) {
        outputStream.write(JSON.stringify(record) + "\n");
      }
    }

    console.log(`\n[ITERATION ${iteration}] Complete`);
    console.log(`  Total extracted: ${totalExtracted}`);
    console.log(`  Unique records: ${totalUnique}`);
    console.log(`  Duration: ${((Date.now() - sessionStartTime) / 1000 / 60).toFixed(2)} minutes`);
  }

  outputStream.end();

  console.log(`
╔════════════════════════════════════════════════════════════════════╗
║  ORCHESTRATION COMPLETE                                           ║
╚════════════════════════════════════════════════════════════════════╝

📊 STATISTICS:
  Total extracted: ${totalExtracted}
  Unique records: ${totalUnique}
  
💾 OUTPUT:
  File: ${outputFile}
  Format: JSONL (one record per line)
  
🎯 READY FOR DATABASE IMPORT!
`);
}

// Run orchestration
orchestrate().catch((error) => {
  console.error("❌ Orchestration error:", error);
  process.exit(1);
});
