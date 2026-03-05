/**
 * Continuous Worker Process
 * Monitors knowledge base directory and continuously ingests JSONL files
 * Builds and updates knowledge graph in real-time
 * Processes 10k+ records per hour
 */

import fs from "fs";
import path from "path";
import { ContinuousIngestionWorker, JSONLIngestionPipeline } from "./jsonl-ingestion-pipeline";
import KnowledgeGraph, { KnowledgeNode, KnowledgeEdge } from "./knowledge-graph";
import { createCanonicalEngineKey, parseEngine } from "./engine-normalizer";

export interface WorkerConfig {
  watchDir: string;
  knowledgeBaseDir: string;
  pollIntervalMs: number;
  batchSize: number;
  maxConcurrentProcesses: number;
}

export interface WorkerStats {
  uptime: number;
  recordsProcessed: number;
  recordsPerSecond: number;
  graphNodes: number;
  graphEdges: number;
  lastUpdateTime: number;
  errors: number;
}

/**
 * Continuous Worker
 */
export class ContinuousWorker {
  private config: WorkerConfig;
  private ingestionWorker: ContinuousIngestionWorker;
  private knowledgeGraph: KnowledgeGraph;
  private stats: WorkerStats;
  private isRunning = false;
  private startTime = 0;
  private nodeIdCounter = 0;
  private edgeIdCounter = 0;

  constructor(config: Partial<WorkerConfig> = {}) {
    this.config = {
      watchDir: config.watchDir || "./knowledge-base",
      knowledgeBaseDir: config.knowledgeBaseDir || "./knowledge-base",
      pollIntervalMs: config.pollIntervalMs || 5000,
      batchSize: config.batchSize || 100,
      maxConcurrentProcesses: config.maxConcurrentProcesses || 5,
    };

    this.ingestionWorker = new ContinuousIngestionWorker(this.config.watchDir);
    this.knowledgeGraph = new KnowledgeGraph();

    this.stats = {
      uptime: 0,
      recordsProcessed: 0,
      recordsPerSecond: 0,
      graphNodes: 0,
      graphEdges: 0,
      lastUpdateTime: Date.now(),
      errors: 0,
    };
  }

  /**
   * Start continuous worker
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log("Worker already running");
      return;
    }

    this.isRunning = true;
    this.startTime = Date.now();

    console.log(`[${new Date().toISOString()}] Starting Continuous Worker`);
    console.log(`  Watch directory: ${this.config.watchDir}`);
    console.log(`  Poll interval: ${this.config.pollIntervalMs}ms`);
    console.log(`  Batch size: ${this.config.batchSize}`);

    // Start ingestion worker in background
    this.ingestionWorker.start().catch((error) => {
      console.error("Ingestion worker error:", error);
      this.stats.errors++;
    });

    // Monitor and process ingested records
    while (this.isRunning) {
      try {
        await this.processNewRecords();
        await new Promise((resolve) => setTimeout(resolve, this.config.pollIntervalMs));
      } catch (error) {
        console.error("Worker error:", error);
        this.stats.errors++;
      }
    }
  }

  /**
   * Process newly ingested records and update knowledge graph
   */
  private async processNewRecords(): Promise<void> {
    const processedRecords = this.ingestionWorker.getStats().pipeline;

    if (processedRecords.successfulInserts === 0) {
      return; // No new records
    }

    console.log(
      `[${new Date().toISOString()}] Processing ${processedRecords.successfulInserts} new records`
    );

    // Read latest JSONL files
    const files = fs
      .readdirSync(this.config.knowledgeBaseDir)
      .filter((f) => f.endsWith(".jsonl"))
      .sort()
      .reverse()
      .slice(0, 5); // Process last 5 files

    for (const file of files) {
      const filePath = path.join(this.config.knowledgeBaseDir, file);

      try {
        await this.ingestFileToGraph(filePath);
      } catch (error) {
        console.error(`Error processing ${file}:`, error);
        this.stats.errors++;
      }
    }

    // Update stats
    this.stats.recordsProcessed += processedRecords.successfulInserts;
    this.stats.graphNodes = this.knowledgeGraph.export().nodes.length;
    this.stats.graphEdges = this.knowledgeGraph.export().edges.length;
    this.stats.lastUpdateTime = Date.now();

    const elapsedSeconds = (Date.now() - this.startTime) / 1000;
    this.stats.recordsPerSecond = this.stats.recordsProcessed / elapsedSeconds;
    this.stats.uptime = elapsedSeconds;

    console.log(`  ✅ Graph updated: ${this.stats.graphNodes} nodes, ${this.stats.graphEdges} edges`);
  }

  /**
   * Ingest JSONL file into knowledge graph
   */
  private async ingestFileToGraph(filePath: string): Promise<void> {
    const fileStream = fs.createReadStream(filePath);
    const readline = require("readline");

    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      if (!line.trim()) continue;

      try {
        const record = JSON.parse(line);
        this.addRecordToGraph(record);
      } catch (error) {
        console.error("Error parsing record:", error);
      }
    }
  }

  /**
   * Add record to knowledge graph
   */
  private addRecordToGraph(record: any): void {
    // Create vehicle node
    const vehicleId = `vehicle_${this.nodeIdCounter++}`;
    const vehicleNode: KnowledgeNode = {
      id: vehicleId,
      type: "vehicle",
      data: {
        make: record.vehicle?.make,
        model: record.vehicle?.model,
        year: record.vehicle?.year,
        generation: record.vehicle?.generation,
        engine_code: record.vehicle?.engine_code,
      },
      confidence: record.confidence || 0.5,
      sources: record.sources || [record.source_url],
    };
    this.knowledgeGraph.addNode(vehicleNode);

    // Create DTC node
    const dtcId = `dtc_${this.nodeIdCounter++}`;
    const dtcNode: KnowledgeNode = {
      id: dtcId,
      type: "dtc",
      data: {
        code: record.error_code?.code,
        system: record.error_code?.system,
        description: record.error_code?.description,
      },
      confidence: record.confidence || 0.5,
      sources: record.sources || [record.source_url],
    };
    this.knowledgeGraph.addNode(dtcNode);

    // Create edge: vehicle -> DTC
    const vehicleDtcEdge: KnowledgeEdge = {
      id: `edge_${this.edgeIdCounter++}`,
      source: vehicleId,
      target: dtcId,
      relationship: "produces_error",
      confidence: record.confidence || 0.5,
    };
    this.knowledgeGraph.addEdge(vehicleDtcEdge);

    // Create symptom nodes and edges
    if (record.symptoms && Array.isArray(record.symptoms)) {
      for (const symptom of record.symptoms) {
        const symptomId = `symptom_${this.nodeIdCounter++}`;
        const symptomNode: KnowledgeNode = {
          id: symptomId,
          type: "symptom",
          data: { name: symptom },
          confidence: record.confidence || 0.5,
          sources: record.sources || [record.source_url],
        };
        this.knowledgeGraph.addNode(symptomNode);

        const symptomEdge: KnowledgeEdge = {
          id: `edge_${this.edgeIdCounter++}`,
          source: dtcId,
          target: symptomId,
          relationship: "has_symptom",
          confidence: record.confidence || 0.5,
        };
        this.knowledgeGraph.addEdge(symptomEdge);
      }
    }

    // Create procedure nodes and edges
    if (record.repair_procedures && Array.isArray(record.repair_procedures)) {
      for (const procedure of record.repair_procedures) {
        const procedureId = `procedure_${this.nodeIdCounter++}`;
        const procedureNode: KnowledgeNode = {
          id: procedureId,
          type: "procedure",
          data: {
            step: procedure.step,
            action: procedure.action,
          },
          confidence: record.confidence || 0.5,
          sources: record.sources || [record.source_url],
        };
        this.knowledgeGraph.addNode(procedureNode);

        const procedureEdge: KnowledgeEdge = {
          id: `edge_${this.edgeIdCounter++}`,
          source: dtcId,
          target: procedureId,
          relationship: "fixed_by",
          confidence: record.confidence || 0.5,
        };
        this.knowledgeGraph.addEdge(procedureEdge);
      }
    }

    // Create component nodes and edges
    if (record.tools_required && Array.isArray(record.tools_required)) {
      for (const tool of record.tools_required) {
        const componentId = `component_${this.nodeIdCounter++}`;
        const componentNode: KnowledgeNode = {
          id: componentId,
          type: "component",
          data: { name: tool },
          confidence: record.confidence || 0.5,
          sources: record.sources || [record.source_url],
        };
        this.knowledgeGraph.addNode(componentNode);

        const componentEdge: KnowledgeEdge = {
          id: `edge_${this.edgeIdCounter++}`,
          source: vehicleId,
          target: componentId,
          relationship: "requires_component",
          confidence: record.confidence || 0.5,
        };
        this.knowledgeGraph.addEdge(componentEdge);
      }
    }

    // Create torque spec nodes and edges
    if (record.torque_specs && Array.isArray(record.torque_specs)) {
      for (const spec of record.torque_specs) {
        const torqueId = `torque_${this.nodeIdCounter++}`;
        const torqueNode: KnowledgeNode = {
          id: torqueId,
          type: "torque_spec",
          data: {
            component: spec.component,
            value_nm: spec.value_nm,
          },
          confidence: record.confidence || 0.5,
          sources: record.sources || [record.source_url],
        };
        this.knowledgeGraph.addNode(torqueNode);

        const torqueEdge: KnowledgeEdge = {
          id: `edge_${this.edgeIdCounter++}`,
          source: vehicleId,
          target: torqueId,
          relationship: "requires_torque",
          confidence: record.confidence || 0.5,
        };
        this.knowledgeGraph.addEdge(torqueEdge);
      }
    }
  }

  /**
   * Stop worker
   */
  stop(): void {
    this.isRunning = false;
    this.ingestionWorker.stop();
    console.log(`[${new Date().toISOString()}] Worker stopped`);
  }

  /**
   * Get worker statistics
   */
  getStats(): WorkerStats {
    return { ...this.stats };
  }

  /**
   * Get knowledge graph
   */
  getKnowledgeGraph(): KnowledgeGraph {
    return this.knowledgeGraph;
  }

  /**
   * Export knowledge graph
   */
  exportGraph() {
    return this.knowledgeGraph.export();
  }

  /**
   * Query knowledge graph
   */
  queryGraph(query: string, type: "vehicle" | "dtc" | "symptom" | "procedure" | "component") {
    const nodes = this.knowledgeGraph.findNodesByType(type);
    return nodes.filter((n) => JSON.stringify(n.data).toLowerCase().includes(query.toLowerCase()));
  }
}

export default ContinuousWorker;
