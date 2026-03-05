#!/usr/bin/env node

/**
 * Build Bayesian Probability Model for Diagnostics
 * Uses 116k+ knowledge base records to create probability matrices
 * 
 * Model: P(error_code | vehicle + symptoms) = P(symptoms | error_code) * P(error_code | vehicle) / P(symptoms)
 */

import fs from "fs";
import readline from "readline";
import mysql from "mysql2/promise";

const JSONL_FILE = "./knowledge-base/knowledge-base-structured.jsonl";

let connection;
let stats = {
  total: 0,
  processed: 0,
  failed: 0,
  startTime: Date.now(),
};

// Data structures for Bayesian model
const model = {
  // P(error_code) - Prior probability of each error code
  errorCodePriors: {},
  
  // P(error_code | vehicle_make) - Likelihood of error code given vehicle
  errorCodeByVehicle: {},
  
  // P(symptom | error_code) - Likelihood of symptom given error code
  symptomsByErrorCode: {},
  
  // P(error_code | symptom) - Posterior probability (calculated)
  errorCodeBySymptom: {},
  
  // Repair procedures by error code
  repairsByErrorCode: {},
  
  // Confidence scores
  confidenceScores: {},
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

async function buildBayesianModel() {
  console.log(`📁 Reading ${JSONL_FILE}...`);
  
  if (!fs.existsSync(JSONL_FILE)) {
    throw new Error(`File not found: ${JSONL_FILE}`);
  }

  const fileStream = fs.createReadStream(JSONL_FILE);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    stats.total++;

    if (!line.trim()) continue;

    try {
      const record = JSON.parse(line);
      
      const vehicle = record.vehicle || {};
      const errorCode = record.error_code?.code || "UNKNOWN";
      const symptoms = record.symptoms || [];
      const confidence = record.confidence || 0.8;
      const repairProcs = record.repair_procedures || [];
      
      // Count error codes (prior probability)
      model.errorCodePriors[errorCode] = (model.errorCodePriors[errorCode] || 0) + 1;
      
      // Count error codes by vehicle make
      const vehicleMake = vehicle.make || "Unknown";
      if (!model.errorCodeByVehicle[vehicleMake]) {
        model.errorCodeByVehicle[vehicleMake] = {};
      }
      model.errorCodeByVehicle[vehicleMake][errorCode] = 
        (model.errorCodeByVehicle[vehicleMake][errorCode] || 0) + 1;
      
      // Count symptoms by error code
      if (!model.symptomsByErrorCode[errorCode]) {
        model.symptomsByErrorCode[errorCode] = {};
      }
      symptoms.forEach(symptom => {
        model.symptomsByErrorCode[errorCode][symptom] = 
          (model.symptomsByErrorCode[errorCode][symptom] || 0) + 1;
      });
      
      // Store repair procedures
      if (!model.repairsByErrorCode[errorCode]) {
        model.repairsByErrorCode[errorCode] = [];
      }
      model.repairsByErrorCode[errorCode].push({
        vehicle: vehicleMake,
        procedures: repairProcs,
        confidence: confidence,
      });
      
      // Track confidence
      if (!model.confidenceScores[errorCode]) {
        model.confidenceScores[errorCode] = [];
      }
      model.confidenceScores[errorCode].push(confidence);
      
      stats.processed++;
      
      if (stats.processed % 10000 === 0) {
        const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(1);
        const rate = (stats.processed / elapsed).toFixed(0);
        console.log(`✅ ${stats.processed}/${stats.total} (${rate} rec/sec) - Elapsed: ${elapsed}s`);
      }
    } catch (e) {
      stats.failed++;
      if (stats.failed <= 5) {
        console.warn(`⚠️ Line ${stats.total}: ${e.message}`);
      }
    }
  }

  // Calculate posterior probabilities
  calculatePosteriors();
  
  // Save model
  await saveModel();
  
  printStats();
}

function calculatePosteriors() {
  console.log("\n📊 Calculating posterior probabilities...");
  
  const totalRecords = stats.processed;
  
  // Calculate P(error_code | symptom)
  Object.entries(model.symptomsByErrorCode).forEach(([errorCode, symptoms]) => {
    Object.entries(symptoms).forEach(([symptom, count]) => {
      if (!model.errorCodeBySymptom[symptom]) {
        model.errorCodeBySymptom[symptom] = {};
      }
      
      // Bayesian: P(error_code | symptom) = P(symptom | error_code) * P(error_code) / P(symptom)
      const pSymptomGivenCode = count / (model.errorCodePriors[errorCode] || 1);
      const pErrorCode = model.errorCodePriors[errorCode] / totalRecords;
      
      model.errorCodeBySymptom[symptom][errorCode] = pSymptomGivenCode * pErrorCode;
    });
  });
  
  // Calculate average confidence per error code
  Object.entries(model.confidenceScores).forEach(([errorCode, scores]) => {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    model.confidenceScores[errorCode] = {
      average: avg,
      count: scores.length,
      min: Math.min(...scores),
      max: Math.max(...scores),
    };
  });
}

async function saveModel() {
  console.log("\n💾 Saving model...");
  
  const modelPath = "./bayesian-model.json";
  
  // Prepare summary
  const summary = {
    timestamp: new Date().toISOString(),
    totalRecords: stats.processed,
    errorCodes: Object.keys(model.errorCodePriors).length,
    vehicles: Object.keys(model.errorCodeByVehicle).length,
    symptoms: Object.keys(model.errorCodeBySymptom).length,
    priors: model.errorCodePriors,
    confidenceScores: model.confidenceScores,
  };
  
  // Save full model
  fs.writeFileSync(modelPath, JSON.stringify({
    summary,
    errorCodePriors: model.errorCodePriors,
    errorCodeByVehicle: model.errorCodeByVehicle,
    symptomsByErrorCode: model.symptomsByErrorCode,
    errorCodeBySymptom: model.errorCodeBySymptom,
    confidenceScores: model.confidenceScores,
  }, null, 2));
  
  console.log(`✅ Model saved to ${modelPath}`);
  
  // Save summary
  const summaryPath = "./bayesian-model-summary.json";
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`✅ Summary saved to ${summaryPath}`);
  
  // Save to database
  await saveToDB(summary);
}

async function saveToDB(summary) {
  try {
    const sql = `
      INSERT INTO learnedPatterns (
        patternType, vehicleCount, errorCodeCount, symptomCount, 
        averageConfidence, modelData, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;
    
    const avgConfidence = Object.values(model.confidenceScores)
      .reduce((sum, cs) => sum + cs.average, 0) / Object.keys(model.confidenceScores).length;
    
    await connection.execute(sql, [
      'bayesian_diagnostic',
      Object.keys(model.errorCodeByVehicle).length,
      Object.keys(model.errorCodePriors).length,
      Object.keys(model.errorCodeBySymptom).length,
      avgConfidence,
      JSON.stringify(summary),
    ]);
    
    console.log("✅ Model saved to database");
  } catch (e) {
    console.warn(`⚠️ Could not save to database: ${e.message}`);
  }
}

function printStats() {
  const elapsed = (Date.now() - stats.startTime) / 1000;
  const rate = (stats.processed / elapsed).toFixed(2);
  
  console.log(`\n✅ MODEL BUILD COMPLETE`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 Total records:     ${stats.total}`);
  console.log(`✅ Processed:         ${stats.processed}`);
  console.log(`❌ Failed:            ${stats.failed}`);
  console.log(`📈 Success rate:      ${((stats.processed / stats.total) * 100).toFixed(2)}%`);
  console.log(`⏱️  Duration:          ${elapsed.toFixed(1)}s`);
  console.log(`🚀 Throughput:        ${rate} records/sec`);
  console.log(`\n📈 MODEL STATISTICS`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🔧 Error codes:       ${Object.keys(model.errorCodePriors).length}`);
  console.log(`🚗 Vehicles:          ${Object.keys(model.errorCodeByVehicle).length}`);
  console.log(`🔍 Symptoms:          ${Object.keys(model.errorCodeBySymptom).length}`);
  
  const avgConfidence = Object.values(model.confidenceScores)
    .reduce((sum, cs) => sum + cs.average, 0) / Object.keys(model.confidenceScores).length;
  console.log(`💯 Avg confidence:    ${(avgConfidence * 100).toFixed(1)}%`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

async function main() {
  try {
    await connectDb();
    await buildBayesianModel();
    await connection.end();
    console.log("\n✅ Done!");
    process.exit(0);
  } catch (e) {
    console.error("❌ Error:", e.message);
    process.exit(1);
  }
}

main();
