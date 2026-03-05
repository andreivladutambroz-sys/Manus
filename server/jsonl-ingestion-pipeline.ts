/**
 * JSONL Ingestion Pipeline
 * Reads JSONL files from knowledge base and ingests into normalized database
 * Idempotent: Safe to run multiple times without duplicates
 */

import fs from "fs";
import path from "path";
import readline from "readline";
import crypto from "crypto";
import DeduplicationEngine from "./deduplication-engine";
import { createCanonicalEngineKey, parseEngine } from "./engine-normalizer";

export interface IngestionStats {
  totalRecords: number;
  successfulInserts: number;
  duplicatesSkipped: number;
  errorsEncountered: number;
  processingTimeMs: number;
  recordsPerSecond: number;
  deduplicationRate: number;
}

export interface IngestionRecord {
  recordHash: string;
  vehicle: {
    id?: string;
    make: string;
    model: string;
    generation?: string;
    year: number;
    engine_code: string;
    engine: string;
  };
  error_code: {
    id?: string;
    code: string;
    system: string;
    description: string;
  };
  symptoms: string[];
  repair_procedures: Array<{
    step: number;
    action: string;
  }>;
  torque_specs: Array<{
    component: string;
    value_nm: number;
  }>;
  tools_required: string[];
  confidence: number;
  source_url: string;
  sources?: string[];
}

/**
 * JSONL Ingestion Pipeline
 */
export class JSONLIngestionPipeline {
  private deduplicationEngine: DeduplicationEngine;
  private ingestionTrackingMap: Map<string, boolean> = new Map(); // recordHash -> processed
  private batchSize = 100;
  private stats: IngestionStats = {
    totalRecords: 0,
    successfulInserts: 0,
    duplicatesSkipped: 0,
    errorsEncountered: 0,
    processingTimeMs: 0,
    recordsPerSecond: 0,
    deduplicationRate: 0,
  };

  constructor() {
    this.deduplicationEngine = new DeduplicationEngine();
  }

  /**
   * Generate record hash for idempotent tracking
   */
  private generateRecordHash(record: any): string {
    const key = JSON.stringify({
      make: record.vehicle?.make,
      model: record.vehicle?.model,
      year: record.vehicle?.year,
      engine: record.vehicle?.engine_code,
      dtc: record.error_code?.code,
      procedure: record.repair_procedures?.[0]?.action,
    });

    return crypto.createHash("sha256").update(key).digest("hex");
  }

  /**
   * Normalize JSONL record to ingestion format
   */
  private normalizeRecord(rawRecord: any): IngestionRecord {
    const recordHash = this.generateRecordHash(rawRecord);

    return {
      recordHash,
      vehicle: {
        make: rawRecord.vehicle?.make || "Unknown",
        model: rawRecord.vehicle?.model || "Unknown",
        generation: rawRecord.vehicle?.generation,
        year: rawRecord.vehicle?.year || new Date().getFullYear(),
        engine_code: rawRecord.vehicle?.engine_code || "UNKNOWN",
        engine: rawRecord.vehicle?.engine || rawRecord.engine || "",
      },
      error_code: {
        code: rawRecord.error_code?.code || "UNKNOWN",
        system: rawRecord.error_code?.system || "General",
        description: rawRecord.error_code?.description || "",
      },
      symptoms: Array.isArray(rawRecord.symptoms) ? rawRecord.symptoms : [],
      repair_procedures: Array.isArray(rawRecord.repair_procedures)
        ? rawRecord.repair_procedures
        : [],
      torque_specs: Array.isArray(rawRecord.torque_specs) ? rawRecord.torque_specs : [],
      tools_required: Array.isArray(rawRecord.tools_required)
        ? rawRecord.tools_required
        : [],
      confidence: rawRecord.confidence || 0.5,
      source_url: rawRecord.source_url || "",
      sources: Array.isArray(rawRecord.sources) ? rawRecord.sources : [],
    };
  }

  /**
   * Process single record
   */
  private async processRecord(record: IngestionRecord): Promise<boolean> {
    try {
      // Check if already processed (idempotent)
      if (this.ingestionTrackingMap.has(record.recordHash)) {
        this.stats.duplicatesSkipped++;
        return false;
      }

      // Run through deduplication engine
      const dedupResult = this.deduplicationEngine.processRecord(record, record.recordHash);

      if (dedupResult.isDuplicate) {
        this.stats.duplicatesSkipped++;
        return false;
      }

      // Mark as processed
      this.ingestionTrackingMap.set(record.recordHash, true);
      this.stats.successfulInserts++;

      return true;
    } catch (error) {
      console.error("Error processing record:", error);
      this.stats.errorsEncountered++;
      return false;
    }
  }

  /**
   * Process batch of records
   */
  private async processBatch(batch: IngestionRecord[]): Promise<number> {
    let successCount = 0;

    for (const record of batch) {
      const success = await this.processRecord(record);
      if (success) {
        successCount++;
      }
    }

    return successCount;
  }

  /**
   * Read and process JSONL file
   */
  async ingestFile(filePath: string): Promise<IngestionStats> {
    const startTime = Date.now();
    this.stats = {
      totalRecords: 0,
      successfulInserts: 0,
      duplicatesSkipped: 0,
      errorsEncountered: 0,
      processingTimeMs: 0,
      recordsPerSecond: 0,
      deduplicationRate: 0,
    };

    return new Promise((resolve, reject) => {
      const fileStream = fs.createReadStream(filePath);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      let batch: IngestionRecord[] = [];

      rl.on("line", async (line) => {
        try {
          if (!line.trim()) return;

          const rawRecord = JSON.parse(line);
          const normalized = this.normalizeRecord(rawRecord);

          batch.push(normalized);
          this.stats.totalRecords++;

          // Process batch when size reached
          if (batch.length >= this.batchSize) {
            rl.pause();
            await this.processBatch(batch);
            batch = [];
            rl.resume();
          }
        } catch (error) {
          console.error("Error parsing line:", error);
          this.stats.errorsEncountered++;
        }
      });

      rl.on("close", async () => {
        // Process remaining records
        if (batch.length > 0) {
          await this.processBatch(batch);
        }

        // Calculate statistics
        const processingTimeMs = Date.now() - startTime;
        this.stats.processingTimeMs = processingTimeMs;
        this.stats.recordsPerSecond = (this.stats.totalRecords / processingTimeMs) * 1000;
        this.stats.deduplicationRate =
          (this.stats.duplicatesSkipped / (this.stats.totalRecords || 1)) * 100;

        resolve(this.stats);
      });

      rl.on("error", reject);
    });
  }

  /**
   * Batch ingest multiple JSONL files
   */
  async ingestDirectory(dirPath: string): Promise<IngestionStats> {
    const startTime = Date.now();
    const files = fs
      .readdirSync(dirPath)
      .filter((f) => f.endsWith(".jsonl"))
      .sort();

    console.log(`Found ${files.length} JSONL files to ingest`);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      console.log(`Ingesting: ${file}`);

      const fileStats = await this.ingestFile(filePath);
      console.log(`  Records: ${fileStats.totalRecords}`);
      console.log(`  Inserted: ${fileStats.successfulInserts}`);
      console.log(`  Skipped: ${fileStats.duplicatesSkipped}`);
      console.log(`  Errors: ${fileStats.errorsEncountered}`);
    }

    // Aggregate statistics
    const totalTime = Date.now() - startTime;
    this.stats.processingTimeMs = totalTime;
    this.stats.recordsPerSecond = (this.stats.totalRecords / totalTime) * 1000;

    return this.stats;
  }

  /**
   * Get current statistics
   */
  getStats(): IngestionStats {
    return { ...this.stats };
  }

  /**
   * Get deduplication engine stats
   */
  getDeduplicationStats() {
    return this.deduplicationEngine.getStats();
  }

  /**
   * Reset pipeline
   */
  reset(): void {
    this.deduplicationEngine.reset();
    this.ingestionTrackingMap.clear();
    this.stats = {
      totalRecords: 0,
      successfulInserts: 0,
      duplicatesSkipped: 0,
      errorsEncountered: 0,
      processingTimeMs: 0,
      recordsPerSecond: 0,
      deduplicationRate: 0,
    };
  }

  /**
   * Get processed records
   */
  getProcessedRecords() {
    return this.deduplicationEngine.getRecords();
  }
}

/**
 * Continuous ingestion worker
 * Monitors directory for new JSONL files and processes them continuously
 */
export class ContinuousIngestionWorker {
  private pipeline: JSONLIngestionPipeline;
  private watchDir: string;
  private processedFiles: Set<string> = new Set();
  private isRunning = false;
  private pollIntervalMs = 5000; // Check every 5 seconds

  constructor(watchDir: string) {
    this.pipeline = new JSONLIngestionPipeline();
    this.watchDir = watchDir;
  }

  /**
   * Start continuous ingestion
   */
  async start(): Promise<void> {
    this.isRunning = true;
    console.log(`Starting continuous ingestion worker for: ${this.watchDir}`);

    while (this.isRunning) {
      try {
        const files = fs
          .readdirSync(this.watchDir)
          .filter((f) => f.endsWith(".jsonl") && !this.processedFiles.has(f));

        for (const file of files) {
          const filePath = path.join(this.watchDir, file);
          console.log(`[${new Date().toISOString()}] Processing: ${file}`);

          const stats = await this.pipeline.ingestFile(filePath);

          console.log(`  ✅ Ingestion complete:`);
          console.log(`     Records: ${stats.totalRecords}`);
          console.log(`     Inserted: ${stats.successfulInserts}`);
          console.log(`     Duplicates: ${stats.duplicatesSkipped}`);
          console.log(`     Rate: ${stats.recordsPerSecond.toFixed(0)} rec/sec`);

          this.processedFiles.add(file);
        }

        // Wait before next poll
        await new Promise((resolve) => setTimeout(resolve, this.pollIntervalMs));
      } catch (error) {
        console.error("Error in continuous ingestion worker:", error);
        await new Promise((resolve) => setTimeout(resolve, this.pollIntervalMs));
      }
    }
  }

  /**
   * Stop continuous ingestion
   */
  stop(): void {
    this.isRunning = false;
    console.log("Continuous ingestion worker stopped");
  }

  /**
   * Get current stats
   */
  getStats() {
    return {
      pipeline: this.pipeline.getStats(),
      deduplication: this.pipeline.getDeduplicationStats(),
      processedFiles: this.processedFiles.size,
    };
  }
}

export default JSONLIngestionPipeline;
