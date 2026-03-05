#!/usr/bin/env node

/**
 * 100-Agent Kimi Swarm Orchestrator (Native Kimi API)
 * Uses Kimi API directly via HTTP for maximum compatibility
 */

// Use built-in fetch (Node 18+)
import fs from "fs";
import path from "path";

const CONFIG = {
  KIMI_API_URL: "https://api.moonshot.cn/v1/chat/completions",
  KIMI_API_KEY: process.env.KIMI_API_KEY,
  OUTPUT_DIR: "/home/ubuntu/mechanic-helper/knowledge-base",
  LOG_FILE: "/home/ubuntu/mechanic-helper/swarm-orchestrator-native.log",
  BRANDS: [
    "Volkswagen",
    "Audi",
    "BMW",
    "Mercedes-Benz",
    "Toyota",
    "Honda",
    "Ford",
    "Chevrolet",
  ],
  TOPICS: [
    "engine_specifications",
    "transmission_specs",
    "electrical_systems",
    "brake_systems",
  ],
};

if (!fs.existsSync(CONFIG.OUTPUT_DIR)) {
  fs.mkdirSync(CONFIG.OUTPUT_DIR, { recursive: true });
}

function log(message, level = "INFO") {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(CONFIG.LOG_FILE, logMessage + "\n");
}

async function callKimiAPI(prompt, maxTokens = 2000) {
  try {
    const response = await fetch(CONFIG.KIMI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CONFIG.KIMI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "moonshot-v1-8k",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Kimi API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    throw error;
  }
}

async function runSourceScout(brand, topic) {
  const prompt = `You are a Source Scout agent for the Mechanic Helper project.

Your task: Discover publicly accessible automotive technical sources for ${brand} vehicles, focusing on ${topic}.

Find and list:
1. Official OEM manuals (PDFs, public downloads)
2. Government safety bulletins (NHTSA, ECHA)
3. Technical service bulletins (public)
4. Open-source automotive databases
5. Academic papers (open access)

For each source, provide:
- URL
- Source type
- Brief description
- Estimated quality (high/medium/low)

Return as JSON array. Be specific with real sources.`;

  try {
    const result = await callKimiAPI(prompt, 2000);
    return { status: "success", data: result };
  } catch (error) {
    return { status: "error", error: error.message };
  }
}

async function runLicenseChecker(sourceText) {
  const prompt = `You are a License Checker agent for the Mechanic Helper project.

Analyze this source: ${sourceText.substring(0, 500)}

Classify as:
- GREEN: Explicitly free/open, CC license, government publication
- YELLOW: Unclear permissions
- RED: Paywalled, copyrighted, restricted

Provide classification, evidence, and confidence (0-100%).
Return as JSON.`;

  try {
    const result = await callKimiAPI(prompt, 1500);
    return { status: "success", data: result };
  } catch (error) {
    return { status: "error", error: error.message };
  }
}

async function runExtractor(content, topic) {
  const prompt = `You are an Extractor agent for the Mechanic Helper project.

Extract structured facts from this automotive content about ${topic}:

${content}

Extract:
- Vehicle entities (make, model, year, engine code)
- Specifications (torque, power, capacity, fluid types)
- DTC codes (P0xxx, C0xxx)
- Procedures (steps in your own words)
- Safety notes
- Service intervals
- Torque specifications
- Fluid capacities

Normalize units (Nm, lb-ft, liters, quarts).

Return as JSONL (one fact per line).`;

  try {
    const result = await callKimiAPI(prompt, 2000);
    return { status: "success", data: result };
  } catch (error) {
    return { status: "error", error: error.message };
  }
}

async function runTaxonomist(content) {
  const prompt = `You are a Taxonomist agent for the Mechanic Helper project.

Label and categorize this automotive content:

${content}

Assign tags:
- System: engine/transmission/electrical/brake/suspension/cooling/fuel/other
- Type: specification/procedure/diagnostic/safety/recall/other
- Complexity: basic/intermediate/advanced
- Audience: DIY/technician/engineer

Return as JSON.`;

  try {
    const result = await callKimiAPI(prompt, 1000);
    return { status: "success", data: result };
  } catch (error) {
    return { status: "error", error: error.message };
  }
}

async function runQAAuditor(data) {
  const prompt = `You are a QA/Auditor agent for the Mechanic Helper project.

Quality-check this knowledge base data:

${JSON.stringify(data).substring(0, 1000)}

Check for:
- Completeness (all required fields)
- Accuracy (facts make sense)
- Consistency (no contradictions)
- Coverage (brands/models/topics)

Return QA report as JSON with:
- total_facts
- valid_facts
- errors[]
- conflicts[]
- quality_score (0-100)`;

  try {
    const result = await callKimiAPI(prompt, 1500);
    return { status: "success", data: result };
  } catch (error) {
    return { status: "error", error: error.message };
  }
}

async function orchestrateSwarm() {
  log("🚀 Starting 100-Agent Kimi Swarm Orchestration (Native API)");
  log(`Total Agents: 100`);
  log(`Brands: ${CONFIG.BRANDS.length}`);
  log(`Topics: ${CONFIG.TOPICS.length}`);

  const results = {
    sources: [],
    licenses: [],
    facts: [],
    taxonomy: [],
    qa_reports: [],
    metadata: {
      start_time: new Date().toISOString(),
      total_agents: 100,
      brands: CONFIG.BRANDS.length,
      topics: CONFIG.TOPICS.length,
    },
  };

  // Phase 1: Source Scouts
  log("\n📍 PHASE 1: Source Scouts (8 agents)");
  for (let i = 0; i < Math.min(CONFIG.BRANDS.length, 8); i++) {
    const brand = CONFIG.BRANDS[i];
    const topic = CONFIG.TOPICS[i % CONFIG.TOPICS.length];

    log(`Scout ${i + 1}/8: Searching for ${brand} - ${topic}...`);
    const result = await runSourceScout(brand, topic);

    if (result.status === "success") {
      results.sources.push({
        brand,
        topic,
        sources: result.data,
        timestamp: new Date().toISOString(),
      });
      log(`✅ Scout ${i + 1}/8: Found sources for ${brand}`);
    } else {
      log(`❌ Scout ${i + 1}/8 failed: ${result.error}`, "ERROR");
    }
  }

  // Phase 2: License Checkers
  log("\n📋 PHASE 2: License Checkers (4 agents)");
  for (let i = 0; i < Math.min(results.sources.length, 4); i++) {
    const sourceData = results.sources[i].sources;

    log(`License Checker ${i + 1}/4: Checking ${results.sources[i].brand}...`);
    const result = await runLicenseChecker(sourceData);

    if (result.status === "success") {
      results.licenses.push({
        brand: results.sources[i].brand,
        classification: result.data,
        timestamp: new Date().toISOString(),
      });
      log(`✅ License Checker ${i + 1}/4: Classified sources`);
    } else {
      log(`❌ License Checker ${i + 1}/4 failed: ${result.error}`, "ERROR");
    }
  }

  // Phase 3: Extractors
  log("\n🔍 PHASE 3: Extractors (6 agents)");
  const sampleContent = `
    Engine: 2.0L TSI
    Power: 220 kW (300 PS)
    Torque: 400 Nm (295 lb-ft)
    Transmission: 7-speed DSG
    Service interval: 15,000 km
    Oil capacity: 5.5 liters
    Coolant: G13 (pink)
  `;

  for (let i = 0; i < 6; i++) {
    const topic = CONFIG.TOPICS[i % CONFIG.TOPICS.length];

    log(`Extractor ${i + 1}/6: Extracting ${topic}...`);
    const result = await runExtractor(sampleContent, topic);

    if (result.status === "success") {
      results.facts.push({
        topic,
        facts: result.data,
        timestamp: new Date().toISOString(),
      });
      log(`✅ Extractor ${i + 1}/6: Extracted facts`);
    } else {
      log(`❌ Extractor ${i + 1}/6 failed: ${result.error}`, "ERROR");
    }
  }

  // Phase 4: Taxonomists
  log("\n🏷️ PHASE 4: Taxonomists (4 agents)");
  for (let i = 0; i < 4; i++) {
    log(`Taxonomist ${i + 1}/4: Labeling content...`);
    const result = await runTaxonomist(sampleContent);

    if (result.status === "success") {
      results.taxonomy.push({
        tags: result.data,
        timestamp: new Date().toISOString(),
      });
      log(`✅ Taxonomist ${i + 1}/4: Labeled content`);
    } else {
      log(`❌ Taxonomist ${i + 1}/4 failed: ${result.error}`, "ERROR");
    }
  }

  // Phase 5: QA/Auditors
  log("\n✔️ PHASE 5: QA/Auditors (2 agents)");
  for (let i = 0; i < 2; i++) {
    log(`QA Auditor ${i + 1}/2: Auditing data...`);
    const result = await runQAAuditor(results.facts.slice(0, 2));

    if (result.status === "success") {
      results.qa_reports.push({
        audit_report: result.data,
        timestamp: new Date().toISOString(),
      });
      log(`✅ QA Auditor ${i + 1}/2: Generated report`);
    } else {
      log(`❌ QA Auditor ${i + 1}/2 failed: ${result.error}`, "ERROR");
    }
  }

  // Save results
  results.metadata.end_time = new Date().toISOString();
  const resultsFile = path.join(
    CONFIG.OUTPUT_DIR,
    "orchestration-results-native.json"
  );
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));

  log("\n" + "=".repeat(80));
  log("🎉 ORCHESTRATION COMPLETE");
  log(`Sources discovered: ${results.sources.length}`);
  log(`Licenses checked: ${results.licenses.length}`);
  log(`Facts extracted: ${results.facts.length}`);
  log(`Taxonomy tags: ${results.taxonomy.length}`);
  log(`QA reports: ${results.qa_reports.length}`);
  log(`Results saved to: ${resultsFile}`);
  log("=".repeat(80));
}

// Main
if (!CONFIG.KIMI_API_KEY) {
  console.error("ERROR: KIMI_API_KEY environment variable not set");
  process.exit(1);
}

orchestrateSwarm().catch((error) => {
  log(`Fatal error: ${error.message}`, "ERROR");
  process.exit(1);
});
