/**
 * DEDUPLICATION & MULTI-SOURCE AGGREGATION - Phase 1
 * 
 * Solution 1C: Source-Aware Deduplication
 * Solution 5B: Multi-Source Aggregation
 * 
 * Allow same data from different sources (more valuable)
 * Merge only true duplicates from same source
 * Target dedup rate: 20-30%
 */

export interface DeduplicationResult {
  totalRecords: number;
  uniqueRecords: number;
  deduplicatedRecords: number;
  deduplicationRate: number;
  mergedRecords: Array<{
    canonical: any;
    merged: any[];
  }>;
}

/**
 * CREATE COMPOSITE KEY FOR DEDUPLICATION
 */

export function createCompositeKey(record: any): string {
  return JSON.stringify({
    vehicle: `${record.vehicle?.make}-${record.vehicle?.model}-${record.vehicle?.year}`,
    error: record.error_code?.code,
    symptom: record.symptoms?.[0], // Primary symptom
    source: record.source_domain
  });
}

/**
 * CREATE SEMANTIC KEY (ignoring source)
 */

export function createSemanticKey(record: any): string {
  return JSON.stringify({
    vehicle: `${record.vehicle?.make}-${record.vehicle?.model}-${record.vehicle?.year}`,
    error: record.error_code?.code,
    symptom: record.symptoms?.[0]
  });
}

/**
 * CALCULATE SIMILARITY SCORE
 */

export function calculateSimilarity(record1: any, record2: any): number {
  let score = 0;
  const weights = {
    vehicle: 0.3,
    errorCode: 0.3,
    symptoms: 0.2,
    repairSteps: 0.1,
    tools: 0.1
  };

  // Vehicle similarity
  if (
    record1.vehicle?.make === record2.vehicle?.make &&
    record1.vehicle?.model === record2.vehicle?.model
  ) {
    score += weights.vehicle;
  }

  // Error code similarity
  if (record1.error_code?.code === record2.error_code?.code) {
    score += weights.errorCode;
  }

  // Symptoms similarity (check if primary symptoms match)
  if (
    record1.symptoms?.[0]?.toLowerCase() ===
    record2.symptoms?.[0]?.toLowerCase()
  ) {
    score += weights.symptoms;
  }

  // Repair steps similarity
  if (
    record1.repair_procedures?.length > 0 &&
    record2.repair_procedures?.length > 0
  ) {
    const commonSteps = record1.repair_procedures.filter((step: any) =>
      record2.repair_procedures.some(
        (s: any) =>
          s.action.toLowerCase() === step.action.toLowerCase()
      )
    ).length;

    const similarity =
      commonSteps / Math.max(record1.repair_procedures.length, record2.repair_procedures.length);
    score += similarity * weights.repairSteps;
  }

  // Tools similarity
  if (record1.tools_required?.length > 0 && record2.tools_required?.length > 0) {
    const commonTools = record1.tools_required.filter((tool: string) =>
      record2.tools_required.includes(tool)
    ).length;

    const similarity =
      commonTools / Math.max(record1.tools_required.length, record2.tools_required.length);
    score += similarity * weights.tools;
  }

  return score;
}

/**
 * SOURCE-AWARE DEDUPLICATION
 * Allow duplicates from different sources (more valuable)
 * Only deduplicate if from same source
 */

export function deduplicateSourceAware(records: any[]): any[] {
  const deduplicated: any[] = [];
  const seen = new Map<string, any>();

  for (const record of records) {
    const compositeKey = createCompositeKey(record);

    if (!seen.has(compositeKey)) {
      deduplicated.push(record);
      seen.set(compositeKey, record);
    } else {
      // Same source = skip (true duplicate)
      // Different source = keep (valuable for cross-validation)
      const existing = seen.get(compositeKey);
      if (existing.source_domain !== record.source_domain) {
        deduplicated.push(record);
      }
    }
  }

  return deduplicated;
}

/**
 * MULTI-SOURCE AGGREGATION
 * Combine data from multiple sources for same case
 */

export interface AggregatedRecord {
  vehicle: {
    make: string;
    model: string;
    year?: number;
    engine?: string;
  };
  error_code: {
    code: string;
    system?: string;
    description?: string;
  };
  symptoms: string[];
  repair_procedures: Array<{
    step: number;
    action: string;
  }>;
  tools_required: string[];
  torque_specs: Array<{
    component: string;
    value_nm?: number;
  }>;
  sources: Array<{
    url: string;
    domain: string;
    confidence: number;
  }>;
  avgConfidence: number;
  totalSources: number;
}

export function aggregateMultipleSources(records: any[]): AggregatedRecord[] {
  const aggregated = new Map<string, AggregatedRecord>();

  for (const record of records) {
    const semanticKey = createSemanticKey(record);

    if (!aggregated.has(semanticKey)) {
      // Create new aggregated record
      aggregated.set(semanticKey, {
        vehicle: record.vehicle,
        error_code: record.error_code,
        symptoms: [...new Set([...record.symptoms])],
        repair_procedures: record.repair_procedures || [],
        tools_required: [...new Set([...record.tools_required])],
        torque_specs: record.torque_specs || [],
        sources: [
          {
            url: record.source_url,
            domain: record.source_domain,
            confidence: record.confidence
          }
        ],
        avgConfidence: record.confidence,
        totalSources: 1
      });
    } else {
      // Merge with existing aggregated record
      const agg = aggregated.get(semanticKey)!;

      // Merge symptoms (avoid duplicates)
      agg.symptoms = [...new Set([...agg.symptoms, ...record.symptoms])];

      // Merge repair procedures (avoid duplicates)
      const existingActions = new Set(agg.repair_procedures.map(p => p.action.toLowerCase()));
      const newProcedures = record.repair_procedures?.filter(
        (p: any) => !existingActions.has(p.action.toLowerCase())
      ) || [];
      agg.repair_procedures = [
        ...agg.repair_procedures,
        ...newProcedures
      ];

      // Merge tools (avoid duplicates)
      agg.tools_required = [...new Set([...agg.tools_required, ...record.tools_required])];

      // Merge torque specs (avoid duplicates)
      const existingSpecs = new Set(agg.torque_specs.map(s => s.component.toLowerCase()));
      const newSpecs = record.torque_specs?.filter(
        (s: any) => !existingSpecs.has(s.component.toLowerCase())
      ) || [];
      agg.torque_specs = [...agg.torque_specs, ...newSpecs];

      // Add source
      agg.sources.push({
        url: record.source_url,
        domain: record.source_domain,
        confidence: record.confidence
      });

      // Update average confidence
      agg.avgConfidence =
        (agg.avgConfidence * (agg.totalSources - 1) + record.confidence) /
        agg.totalSources;
      agg.totalSources++;
    }
  }

  return Array.from(aggregated.values());
}

/**
 * MERGE DUPLICATE RECORDS
 * Combine data from duplicate records into canonical record
 */

export function mergeDuplicates(records: any[]): any[] {
  const merged: any[] = [];
  const processed = new Set<number>();

  for (let i = 0; i < records.length; i++) {
    if (processed.has(i)) continue;

    const canonical = { ...records[i] };
    const duplicates: any[] = [];

    // Find all duplicates of this record
    for (let j = i + 1; j < records.length; j++) {
      if (processed.has(j)) continue;

      const similarity = calculateSimilarity(records[i], records[j]);
      if (similarity > 0.85) {
        // 85% similarity threshold
        duplicates.push(records[j]);
        processed.add(j);
      }
    }

    // Merge duplicates into canonical
    if (duplicates.length > 0) {
      // Merge symptoms
      const allSymptoms = [
        ...canonical.symptoms,
        ...duplicates.flatMap(d => d.symptoms)
      ];
      canonical.symptoms = [...new Set(allSymptoms)].slice(0, 10);

      // Merge repair procedures
      const allSteps = [
        ...canonical.repair_procedures,
        ...duplicates.flatMap(d => d.repair_procedures)
      ];
      canonical.repair_procedures = allSteps.slice(0, 15);

      // Merge tools
      const allTools = [
        ...canonical.tools_required,
        ...duplicates.flatMap(d => d.tools_required)
      ];
      canonical.tools_required = [...new Set(allTools)];

      // Merge torque specs
      const allSpecs = [
        ...canonical.torque_specs,
        ...duplicates.flatMap(d => d.torque_specs)
      ];
      canonical.torque_specs = allSpecs;

      // Update confidence (average of all)
      const allConfidences = [
        canonical.confidence,
        ...duplicates.map(d => d.confidence)
      ];
      canonical.confidence =
        allConfidences.reduce((a, b) => a + b, 0) / allConfidences.length;

      // Track merged records
      canonical.merged_from = duplicates.length;
    }

    merged.push(canonical);
    processed.add(i);
  }

  return merged;
}

/**
 * CALCULATE DEDUPLICATION STATISTICS
 */

export function calculateDeduplicationStats(
  originalRecords: any[],
  deduplicatedRecords: any[]
): DeduplicationResult {
  const totalRecords = originalRecords.length;
  const uniqueRecords = deduplicatedRecords.length;
  const deduplicatedRecords_count = totalRecords - uniqueRecords;
  const deduplicationRate = (deduplicatedRecords_count / totalRecords) * 100;

  return {
    totalRecords,
    uniqueRecords,
    deduplicatedRecords: deduplicatedRecords_count,
    deduplicationRate: Math.round(deduplicationRate * 100) / 100,
    mergedRecords: []
  };
}

/**
 * FULL DEDUPLICATION PIPELINE
 */

export function fullDeduplicationPipeline(records: any[]): {
  deduplicated: any[];
  aggregated: AggregatedRecord[];
  stats: DeduplicationResult;
} {
  // Step 1: Source-aware deduplication
  const deduplicated = deduplicateSourceAware(records);

  // Step 2: Multi-source aggregation
  const aggregated = aggregateMultipleSources(deduplicated);

  // Step 3: Calculate statistics
  const stats = calculateDeduplicationStats(records, deduplicated);

  return {
    deduplicated,
    aggregated,
    stats
  };
}
