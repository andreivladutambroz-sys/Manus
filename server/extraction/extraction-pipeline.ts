/**
 * EXTRACTION PIPELINE - Phase 4
 * Main orchestrator integrating all layers
 * 
 * Flow:
 * 1. Collect from sources (Collectors)
 * 2. Parse content (Enhanced Parser)
 * 3. Validate records (Validation Layer)
 * 4. Extract evidence (Evidence Extractor)
 * 5. Deduplicate (Deduplication)
 * 6. Optimize (Caching + Compression)
 * 7. Report (Quality Reporter)
 */

import { ExtractionCache, optimizeBatchSize, compressPrompt } from './optimization';
import { calculateQualityMetrics, generateQualityReport } from './quality-reporter';
import { fullDeduplicationPipeline } from './deduplication';
import { validateBatch } from './validation-layer';

export interface PipelineConfig {
  batchSize: number;
  maxRecords: number;
  enableCaching: boolean;
  enableCompression: boolean;
  enableDeduplication: boolean;
  validationThreshold: number; // 0.70-0.95
}

export interface PipelineResult {
  phase: string;
  status: 'success' | 'error' | 'warning';
  recordsProcessed: number;
  recordsAccepted: number;
  recordsRejected: number;
  metrics: any;
  timestamp: string;
}

export class ExtractionPipeline {
  private config: PipelineConfig;
  private cache: ExtractionCache;
  private results: PipelineResult[] = [];

  constructor(config: Partial<PipelineConfig> = {}) {
    this.config = {
      batchSize: 50,
      maxRecords: 40000,
      enableCaching: true,
      enableCompression: true,
      enableDeduplication: true,
      validationThreshold: 0.70,
      ...config
    };

    this.cache = new ExtractionCache();
  }

  /**
   * PHASE 1: COLLECTION
   */

  async phase1Collection(sources: any[]): Promise<any[]> {
    console.log(`[PHASE 1] Collecting from ${sources.length} sources...`);

    const records: any[] = [];

    for (const source of sources) {
      try {
        // TODO: Implement actual collection from sources
        // For now, simulate collection
        console.log(`  Collecting from ${source.domain}...`);
      } catch (error) {
        console.error(`  Error collecting from ${source.domain}:`, error);
      }
    }

    this.recordResult({
      phase: 'Collection',
      status: 'success',
      recordsProcessed: records.length,
      recordsAccepted: records.length,
      recordsRejected: 0,
      metrics: { sources: sources.length }
    });

    return records;
  }

  /**
   * PHASE 2: PARSING
   */

  async phase2Parsing(records: any[]): Promise<any[]> {
    console.log(`[PHASE 2] Parsing ${records.length} records...`);

    const parsed: any[] = [];

    for (const record of records) {
      try {
        // TODO: Implement enhanced parsing
        parsed.push(record);
      } catch (error) {
        console.error(`  Error parsing record:`, error);
      }
    }

    this.recordResult({
      phase: 'Parsing',
      status: 'success',
      recordsProcessed: records.length,
      recordsAccepted: parsed.length,
      recordsRejected: records.length - parsed.length,
      metrics: {}
    });

    return parsed;
  }

  /**
   * PHASE 3: VALIDATION
   */

  async phase3Validation(records: any[]): Promise<any[]> {
    console.log(`[PHASE 3] Validating ${records.length} records...`);

    const validationResult = validateBatch(records);

    this.recordResult({
      phase: 'Validation',
      status: validationResult.validationPassRate >= 90 ? 'success' : 'warning',
      recordsProcessed: records.length,
      recordsAccepted: validationResult.valid,
      recordsRejected: validationResult.invalid,
      metrics: {
        passRate: validationResult.validationPassRate,
        avgConfidence: validationResult.avgConfidence,
        avgScore: validationResult.avgScore
      }
    });

    return validationResult.validRecords;
  }

  /**
   * PHASE 4: EVIDENCE EXTRACTION
   */

  async phase4EvidenceExtraction(records: any[]): Promise<any[]> {
    console.log(`[PHASE 4] Extracting evidence from ${records.length} records...`);

    // TODO: Implement evidence extraction
    const withEvidence = records.map(r => ({
      ...r,
      evidence_snippets: []
    }));

    this.recordResult({
      phase: 'Evidence Extraction',
      status: 'success',
      recordsProcessed: records.length,
      recordsAccepted: records.length,
      recordsRejected: 0,
      metrics: {}
    });

    return withEvidence;
  }

  /**
   * PHASE 5: DEDUPLICATION
   */

  async phase5Deduplication(records: any[]): Promise<any[]> {
    console.log(`[PHASE 5] Deduplicating ${records.length} records...`);

    if (!this.config.enableDeduplication) {
      return records;
    }

    const result = fullDeduplicationPipeline(records);

    this.recordResult({
      phase: 'Deduplication',
      status: 'success',
      recordsProcessed: records.length,
      recordsAccepted: result.deduplicated.length,
      recordsRejected: records.length - result.deduplicated.length,
      metrics: {
        deduplicationRate: result.stats.deduplicationRate,
        aggregatedRecords: result.aggregated.length
      }
    });

    return result.deduplicated;
  }

  /**
   * PHASE 6: OPTIMIZATION
   */

  async phase6Optimization(records: any[]): Promise<any[]> {
    console.log(`[PHASE 6] Optimizing ${records.length} records...`);

    if (this.config.enableCaching) {
      // Populate cache
      for (const record of records) {
        const key = `${record.vehicle?.make}-${record.vehicle?.model}:${record.error_code?.code}`;
        this.cache.set(
          `${record.vehicle?.make}-${record.vehicle?.model}`,
          record.error_code?.code,
          record,
          24 * 60 * 60 * 1000
        );
      }
    }

    const cacheStats = this.cache.getStats();

    this.recordResult({
      phase: 'Optimization',
      status: 'success',
      recordsProcessed: records.length,
      recordsAccepted: records.length,
      recordsRejected: 0,
      metrics: {
        cacheHitRate: cacheStats.hitRate,
        costSavings: cacheStats.costSavings
      }
    });

    return records;
  }

  /**
   * PHASE 7: REPORTING
   */

  async phase7Reporting(records: any[]): Promise<string> {
    console.log(`[PHASE 7] Generating quality report for ${records.length} records...`);

    const validationResult = validateBatch(records);
    const metrics = calculateQualityMetrics(records, validationResult);
    const report = generateQualityReport(metrics, new Date().toISOString());

    this.recordResult({
      phase: 'Reporting',
      status: 'success',
      recordsProcessed: records.length,
      recordsAccepted: records.length,
      recordsRejected: 0,
      metrics: {
        acceptanceRate: metrics.acceptanceRate,
        avgConfidence: metrics.avgConfidence
      }
    });

    return report;
  }

  /**
   * FULL PIPELINE EXECUTION
   */

  async execute(sources: any[]): Promise<{
    records: any[];
    report: string;
    results: PipelineResult[];
  }> {
    console.log('🚀 Starting Extraction Pipeline...\n');

    try {
      // Phase 1: Collection
      let records = await this.phase1Collection(sources);
      console.log(`✅ Phase 1 complete: ${records.length} records collected\n`);

      // Phase 2: Parsing
      records = await this.phase2Parsing(records);
      console.log(`✅ Phase 2 complete: ${records.length} records parsed\n`);

      // Phase 3: Validation
      records = await this.phase3Validation(records);
      console.log(`✅ Phase 3 complete: ${records.length} records validated\n`);

      // Phase 4: Evidence Extraction
      records = await this.phase4EvidenceExtraction(records);
      console.log(`✅ Phase 4 complete: ${records.length} records with evidence\n`);

      // Phase 5: Deduplication
      records = await this.phase5Deduplication(records);
      console.log(`✅ Phase 5 complete: ${records.length} records deduplicated\n`);

      // Phase 6: Optimization
      records = await this.phase6Optimization(records);
      console.log(`✅ Phase 6 complete: ${records.length} records optimized\n`);

      // Phase 7: Reporting
      const report = await this.phase7Reporting(records);
      console.log(`✅ Phase 7 complete: Report generated\n`);

      console.log('🎉 Extraction Pipeline Complete!\n');

      return {
        records,
        report,
        results: this.results
      };
    } catch (error) {
      console.error('❌ Pipeline execution failed:', error);
      throw error;
    }
  }

  /**
   * RECORD RESULT
   */

  private recordResult(result: Omit<PipelineResult, 'timestamp'>): void {
    this.results.push({
      ...result,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * GET RESULTS
   */

  getResults(): PipelineResult[] {
    return this.results;
  }

  /**
   * GET CACHE STATS
   */

  getCacheStats() {
    return this.cache.getStats();
  }
}

/**
 * MAIN ENTRY POINT
 */

export async function runExtractionPipeline(
  sources: any[],
  config?: Partial<PipelineConfig>
): Promise<{
  records: any[];
  report: string;
  results: PipelineResult[];
}> {
  const pipeline = new ExtractionPipeline(config);
  return pipeline.execute(sources);
}
