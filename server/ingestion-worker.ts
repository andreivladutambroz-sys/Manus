/**
 * JSONL Ingestion Worker
 * Tails knowledge-base JSONL files and ingests into PostgreSQL
 * Implements idempotent upserts with deduplication
 */

import fs from "fs";
import path from "path";
import readline from "readline";
import { Pool, PoolClient } from "pg";
import { v4 as uuidv4 } from "uuid";
import { EventEmitter } from "events";

interface IngestionConfig {
  postgresUrl: string;
  jsonlDirectory: string;
  pollIntervalMs: number;
  batchSize: number;
  maxConcurrentBatches: number;
}

interface KnowledgeRecord {
  vehicle: {
    make: string;
    model: string;
    year: number;
    engine_code?: string;
    engine?: string;
  };
  error_code: {
    code: string;
    system?: string;
    description?: string;
  };
  symptoms?: string[];
  repair_procedures?: Array<{
    step: number;
    action: string;
    notes?: string;
  }>;
  torque_specs?: Array<{
    component: string;
    value_nm: number;
  }>;
  tools_required?: string[];
  confidence?: number;
  source_url?: string;
}

interface IngestionStats {
  batchId: string;
  recordsProcessed: number;
  recordsInserted: number;
  recordsUpdated: number;
  recordsSkipped: number;
  errors: number;
  startTime: Date;
  endTime?: Date;
  durationMs?: number;
}

export class JSONLIngestionWorker extends EventEmitter {
  private config: IngestionConfig;
  private pool: Pool;
  private isRunning = false;
  private processedFiles = new Set<string>();
  private stats: IngestionStats = {
    batchId: uuidv4(),
    recordsProcessed: 0,
    recordsInserted: 0,
    recordsUpdated: 0,
    recordsSkipped: 0,
    errors: 0,
    startTime: new Date(),
  };

  constructor(config: IngestionConfig) {
    super();
    this.config = config;
    this.pool = new Pool({
      connectionString: config.postgresUrl,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  /**
   * Start the ingestion worker
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log("[Ingestion] Worker already running");
      return;
    }

    this.isRunning = true;
    console.log(`[Ingestion] Starting worker`);
    console.log(`  PostgreSQL: ${this.config.postgresUrl.split("@")[1]}`);
    console.log(`  JSONL Directory: ${this.config.jsonlDirectory}`);
    console.log(`  Poll Interval: ${this.config.pollIntervalMs}ms`);

    // Test connection
    try {
      const client = await this.pool.connect();
      await client.query("SELECT 1");
      client.release();
      console.log("[Ingestion] ✅ PostgreSQL connection successful");
    } catch (error) {
      console.error("[Ingestion] ❌ PostgreSQL connection failed:", error);
      this.isRunning = false;
      throw error;
    }

    // Start polling loop
    this.pollLoop();
  }

  /**
   * Main polling loop
   */
  private async pollLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        await this.processNewFiles();
        await new Promise((resolve) =>
          setTimeout(resolve, this.config.pollIntervalMs)
        );
      } catch (error) {
        console.error("[Ingestion] Error in poll loop:", error);
        this.stats.errors++;
      }
    }
  }

  /**
   * Find and process new JSONL files
   */
  private async processNewFiles(): Promise<void> {
    try {
      const files = fs
        .readdirSync(this.config.jsonlDirectory)
        .filter((f) => f.endsWith(".jsonl"))
        .sort();

      for (const file of files) {
        const filePath = path.join(this.config.jsonlDirectory, file);

        if (!this.processedFiles.has(filePath)) {
          console.log(`[Ingestion] Processing: ${file}`);
          await this.ingestFile(filePath);
          this.processedFiles.add(filePath);
        }
      }
    } catch (error) {
      console.error("[Ingestion] Error processing files:", error);
    }
  }

  /**
   * Ingest a single JSONL file
   */
  private async ingestFile(filePath: string): Promise<void> {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    const batchId = uuidv4();
    const batchStats: IngestionStats = {
      batchId,
      recordsProcessed: 0,
      recordsInserted: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
      errors: 0,
      startTime: new Date(),
    };

    // Log batch start
    const client = await this.pool.connect();
    try {
      await client.query(
        `INSERT INTO ingestion_log (batch_id, source_file, status)
         VALUES ($1, $2, $3)`,
        [batchId, path.basename(filePath), "processing"]
      );
    } catch (error) {
      console.error("[Ingestion] Error logging batch:", error);
    }

    try {
      let lineCount = 0;

      for await (const line of rl) {
        if (!line.trim()) continue;

        try {
          const record = JSON.parse(line) as KnowledgeRecord;
          await this.ingestRecord(client, record);
          batchStats.recordsProcessed++;
          lineCount++;

          // Log progress every 100 records
          if (lineCount % 100 === 0) {
            console.log(
              `[Ingestion] Processed ${lineCount} records from ${path.basename(filePath)}`
            );
          }
        } catch (error) {
          console.error("[Ingestion] Error parsing record:", error);
          batchStats.errors++;
        }
      }

      batchStats.endTime = new Date();
      batchStats.durationMs =
        batchStats.endTime.getTime() - batchStats.startTime.getTime();

      // Update batch log
      await client.query(
        `UPDATE ingestion_log
         SET status = $1,
             records_processed = $2,
             records_inserted = $3,
             records_updated = $4,
             records_skipped = $5,
             errors = $6,
             completed_at = NOW()
         WHERE batch_id = $7`,
        [
          "completed",
          batchStats.recordsProcessed,
          batchStats.recordsInserted,
          batchStats.recordsUpdated,
          batchStats.recordsSkipped,
          batchStats.errors,
          batchId,
        ]
      );

      console.log(
        `[Ingestion] ✅ Batch ${batchId} completed: ${batchStats.recordsProcessed} records in ${batchStats.durationMs}ms`
      );
      this.emit("batch_completed", batchStats);
    } catch (error) {
      console.error("[Ingestion] Error ingesting file:", error);
      await client.query(
        `UPDATE ingestion_log
         SET status = $1, error_message = $2, completed_at = NOW()
         WHERE batch_id = $3`,
        ["failed", String(error), batchId]
      );
    } finally {
      client.release();
    }
  }

  /**
   * Ingest a single knowledge record
   */
  private async ingestRecord(
    client: PoolClient,
    record: KnowledgeRecord
  ): Promise<void> {
    try {
      // 1. Upsert vehicle
      const vehicleResult = await client.query(
        `INSERT INTO vehicles (make, model, year, generation)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (make, model, year) DO UPDATE SET updated_at = NOW()
         RETURNING id`,
        [
          record.vehicle.make,
          record.vehicle.model,
          record.vehicle.year,
          record.vehicle.engine_code,
        ]
      );
      const vehicleId = vehicleResult.rows[0].id;

      // 2. Upsert engine
      if (record.vehicle.engine_code) {
        await client.query(
          `INSERT INTO engines (vehicle_id, engine_code, engine_name)
           VALUES ($1, $2, $3)
           ON CONFLICT (vehicle_id, engine_code) DO UPDATE SET updated_at = NOW()`,
          [vehicleId, record.vehicle.engine_code, record.vehicle.engine]
        );
      }

      // 3. Upsert DTC code
      const dtcResult = await client.query(
        `INSERT INTO dtc_codes (code, system, description)
         VALUES ($1, $2, $3)
         ON CONFLICT (code) DO UPDATE SET updated_at = NOW()
         RETURNING id`,
        [record.error_code.code, record.error_code.system, record.error_code.description]
      );
      const dtcId = dtcResult.rows[0].id;

      // 4. Create knowledge graph edge: vehicle -> dtc
      await client.query(
        `INSERT INTO knowledge_graph (from_type, from_id, relationship, to_type, to_id, confidence_score)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (from_type, from_id, relationship, to_type, to_id) DO UPDATE SET confidence_score = GREATEST(knowledge_graph.confidence_score, $6)`,
        [
          "vehicle",
          vehicleId,
          "produces_error",
          "dtc",
          dtcId,
          record.confidence || 0.5,
        ]
      );

      // 5. Upsert symptoms and create edges
      if (record.symptoms && Array.isArray(record.symptoms)) {
        for (const symptom of record.symptoms) {
          const symptomResult = await client.query(
            `INSERT INTO symptoms (name)
             VALUES ($1)
             ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
             RETURNING id`,
            [symptom]
          );
          const symptomId = symptomResult.rows[0].id;

          // Link symptom to DTC
          await client.query(
            `INSERT INTO knowledge_graph (from_type, from_id, relationship, to_type, to_id, confidence_score)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (from_type, from_id, relationship, to_type, to_id) DO UPDATE SET confidence_score = GREATEST(knowledge_graph.confidence_score, $6)`,
            [
              "symptom",
              symptomId,
              "indicates",
              "dtc",
              dtcId,
              record.confidence || 0.5,
            ]
          );
        }
      }

      // 6. Upsert procedures and steps
      if (record.repair_procedures && Array.isArray(record.repair_procedures)) {
        const procedureTitle = `${record.vehicle.make} ${record.vehicle.model} - ${record.error_code.code}`;

        const procedureResult = await client.query(
          `INSERT INTO procedures (title, category, difficulty_level)
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING
           RETURNING id`,
          [procedureTitle, "repair", "intermediate"]
        );

        if (procedureResult.rows.length > 0) {
          const procedureId = procedureResult.rows[0].id;

          // Insert procedure steps
          for (const step of record.repair_procedures) {
            await client.query(
              `INSERT INTO procedure_steps (procedure_id, step_number, action, notes)
               VALUES ($1, $2, $3, $4)
               ON CONFLICT (procedure_id, step_number) DO UPDATE SET action = $3`,
              [procedureId, step.step, step.action, step.notes]
            );
          }

          // Link procedure to DTC
          await client.query(
            `INSERT INTO knowledge_graph (from_type, from_id, relationship, to_type, to_id, confidence_score)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (from_type, from_id, relationship, to_type, to_id) DO UPDATE SET confidence_score = GREATEST(knowledge_graph.confidence_score, $6)`,
            [
              "dtc",
              dtcId,
              "fixed_by",
              "procedure",
              procedureId,
              record.confidence || 0.5,
            ]
          );
        }
      }

      // 7. Upsert torque specs
      if (record.torque_specs && Array.isArray(record.torque_specs)) {
        for (const spec of record.torque_specs) {
          const componentResult = await client.query(
            `INSERT INTO components (name, category)
             VALUES ($1, $2)
             ON CONFLICT (name, category) DO UPDATE SET updated_at = NOW()
             RETURNING id`,
            [spec.component, "fastener"]
          );
          const componentId = componentResult.rows[0].id;

          await client.query(
            `INSERT INTO torque_specs (vehicle_id, component_id, component_name, value_nm)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT DO NOTHING`,
            [vehicleId, componentId, spec.component, spec.value_nm]
          );
        }
      }

      // 8. Record source
      if (record.source_url) {
        const sourceResult = await client.query(
          `INSERT INTO sources (url, title, source_type)
           VALUES ($1, $2, $3)
           ON CONFLICT (url) DO UPDATE SET updated_at = NOW()
           RETURNING id`,
          [record.source_url, "Knowledge Base", "swarm"]
        );
        const sourceId = sourceResult.rows[0].id;

        // Create evidence for DTC
        await client.query(
          `INSERT INTO evidence (entity_type, entity_id, source_id, confidence_score)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (entity_type, entity_id, source_id) DO UPDATE SET confidence_score = $4`,
          ["dtc_code", dtcId, sourceId, record.confidence || 0.5]
        );
      }

      this.stats.recordsInserted++;
    } catch (error) {
      console.error("[Ingestion] Error ingesting record:", error);
      this.stats.errors++;
      throw error;
    }
  }

  /**
   * Stop the worker
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    await this.pool.end();
    console.log("[Ingestion] Worker stopped");
  }

  /**
   * Get current statistics
   */
  getStats(): IngestionStats {
    return { ...this.stats };
  }
}

export default JSONLIngestionWorker;
