/**
 * 5-Layer Pipeline
 * Collectors → Normalizers → Deduplicators → Validators → Writers
 */

import { kimiBatchProcessor } from "./kimi-batch-processor";

interface RawRecord {
  id: string;
  source: string;
  content: string;
  timestamp: number;
}

interface NormalizedRecord {
  id: string;
  source: string;
  vehicle: {
    make?: string;
    model?: string;
    year?: number;
    engine?: string;
  };
  errorCode?: string;
  symptoms: string[];
  repairSteps: string[];
  tools: string[];
  torqueSpecs: Record<string, string>;
  confidence: number;
  timestamp: number;
}

interface DeduplicatedRecord extends NormalizedRecord {
  hash: string;
  isDuplicate: boolean;
  similarRecordIds: string[];
}

interface ValidatedRecord extends DeduplicatedRecord {
  isValid: boolean;
  validationErrors: string[];
}

class Pipeline {
  private layer1Results: RawRecord[] = [];
  private layer2Results: NormalizedRecord[] = [];
  private layer3Results: DeduplicatedRecord[] = [];
  private layer4Results: ValidatedRecord[] = [];
  private layer5Count: number = 0;

  /**
   * Layer 1: Collectors (already done - raw data)
   */
  addRawRecords(records: RawRecord[]): void {
    this.layer1Results.push(...records);
  }

  /**
   * Layer 2: Normalizers (convert to unified schema)
   */
  async normalizeRecords(): Promise<NormalizedRecord[]> {
    console.log(`[Layer 2] Normalizing ${this.layer1Results.length} records...`);

    const items = this.layer1Results.map((record) => ({
      id: record.id,
      data: record as unknown as Record<string, unknown>,
      type: "normalize" as const,
    }));

    const results = await kimiBatchProcessor.processBatch(items);

    this.layer2Results = results
      .filter((r) => r.success)
      .map((r) => ({
        id: r.id,
        source: this.layer1Results.find((rec) => rec.id === r.id)?.source || "",
        vehicle: (r.result as any)?.vehicle || {},
        errorCode: (r.result as any)?.errorCode,
        symptoms: (r.result as any)?.symptoms || [],
        repairSteps: (r.result as any)?.repairSteps || [],
        tools: (r.result as any)?.tools || [],
        torqueSpecs: (r.result as any)?.torqueSpecs || {},
        confidence: (r.result as any)?.confidence || 0.8,
        timestamp: Date.now(),
      }));

    console.log(`[Layer 2] Normalized ${this.layer2Results.length} records`);
    return this.layer2Results;
  }

  /**
   * Layer 3: Deduplicators (2-pass: hash + semantic)
   */
  async deduplicateRecords(): Promise<DeduplicatedRecord[]> {
    console.log(`[Layer 3] Deduplicating ${this.layer2Results.length} records...`);

    // Pass 1: Hash-based dedup
    const hashMap = new Map<string, NormalizedRecord>();
    const pass1Results: DeduplicatedRecord[] = [];

    for (const record of this.layer2Results) {
      const hash = this.generateHash(record);
      if (!hashMap.has(hash)) {
        hashMap.set(hash, record);
        pass1Results.push({
          ...record,
          hash,
          isDuplicate: false,
          similarRecordIds: [],
        });
      }
    }

    console.log(`[Layer 3] Pass 1 (hash): ${pass1Results.length} unique records`);

    // Pass 2: Semantic dedup (batch LLM)
    const items = pass1Results.map((record) => ({
      id: record.id,
      data: record as unknown as Record<string, unknown>,
      type: "dedup" as const,
    }));

    const results = await kimiBatchProcessor.processBatch(items);

    this.layer3Results = pass1Results.map((record) => {
      const result = results.find((r) => r.id === record.id);
      return {
        ...record,
        isDuplicate: (result?.result as any)?.isDuplicate || false,
        similarRecordIds: (result?.result as any)?.similarRecordIds || [],
      };
    });

    const uniqueRecords = this.layer3Results.filter((r) => !r.isDuplicate);
    console.log(`[Layer 3] Pass 2 (semantic): ${uniqueRecords.length} unique records`);

    return uniqueRecords;
  }

  /**
   * Layer 4: Validators (quality checks)
   */
  async validateRecords(): Promise<ValidatedRecord[]> {
    console.log(`[Layer 4] Validating ${this.layer3Results.length} records...`);

    const items = this.layer3Results.map((record) => ({
      id: record.id,
      data: record as unknown as Record<string, unknown>,
      type: "validate" as const,
    }));

    const results = await kimiBatchProcessor.processBatch(items);

    this.layer4Results = this.layer3Results.map((record) => {
      const result = results.find((r) => r.id === record.id);
      const validationErrors = (result?.result as any)?.validationErrors || [];

      return {
        ...record,
        isValid: validationErrors.length === 0,
        validationErrors,
      };
    });

    const validRecords = this.layer4Results.filter((r) => r.isValid);
    console.log(`[Layer 4] Valid records: ${validRecords.length}`);

    return validRecords;
  }

  /**
   * Layer 5: Writers (database upserts)
   */
  async writeRecords(records: ValidatedRecord[]): Promise<number> {
    console.log(`[Layer 5] Writing ${records.length} records to database...`);

    // In real implementation, this would insert into database
    // For now, just count
    this.layer5Count = records.length;

    console.log(`[Layer 5] Wrote ${this.layer5Count} records`);
    return this.layer5Count;
  }

  /**
   * Execute full pipeline
   */
  async executePipeline(): Promise<{
    layer1: number;
    layer2: number;
    layer3: number;
    layer4: number;
    layer5: number;
  }> {
    console.log("\n=== STARTING 5-LAYER PIPELINE ===\n");

    await this.normalizeRecords();
    await this.deduplicateRecords();
    const validRecords = await this.validateRecords();
    await this.writeRecords(validRecords);

    console.log("\n=== PIPELINE COMPLETE ===\n");

    return {
      layer1: this.layer1Results.length,
      layer2: this.layer2Results.length,
      layer3: this.layer3Results.length,
      layer4: this.layer4Results.length,
      layer5: this.layer5Count,
    };
  }

  /**
   * Generate hash for record
   */
  private generateHash(record: NormalizedRecord): string {
    const key = `${record.vehicle.make}-${record.vehicle.model}-${record.errorCode}-${record.symptoms.join(",")}`;
    return Buffer.from(key).toString("base64");
  }

  /**
   * Get pipeline stats
   */
  getStats(): {
    totalInput: number;
    totalOutput: number;
    deduplicationRate: number;
    validationRate: number;
  } {
    const totalInput = this.layer1Results.length;
    const totalOutput = this.layer5Count;
    const deduplicationRate =
      this.layer2Results.length > 0
        ? ((this.layer2Results.length - this.layer3Results.length) /
            this.layer2Results.length) *
          100
        : 0;
    const validationRate =
      this.layer3Results.length > 0
        ? ((this.layer3Results.length - this.layer4Results.length) /
            this.layer3Results.length) *
          100
        : 0;

    return {
      totalInput,
      totalOutput,
      deduplicationRate,
      validationRate,
    };
  }

  /**
   * Reset pipeline
   */
  reset(): void {
    this.layer1Results = [];
    this.layer2Results = [];
    this.layer3Results = [];
    this.layer4Results = [];
    this.layer5Count = 0;
  }
}

export { Pipeline };
export const pipeline = new Pipeline();
export type { RawRecord, NormalizedRecord, DeduplicatedRecord, ValidatedRecord };
