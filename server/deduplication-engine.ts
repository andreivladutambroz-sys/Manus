/**
 * 3-Level Deduplication Engine
 * Level 1: Hash-based (exact matches)
 * Level 2: Semantic (similarity matching with embeddings)
 * Level 3: Source confirmation (multiple sources confirm same procedure)
 */

import crypto from "crypto";

export interface DeduplicationResult {
  isDuplicate: boolean;
  level: number; // 1, 2, or 3
  matchedRecordId?: string;
  confidence: number; // 0-1
  mergeAction?: "skip" | "merge" | "update_confidence";
}

export interface DeduplicationRecord {
  id: string;
  hash: string;
  canonical_key: string;
  data: any;
  confidence: number;
  sources: string[];
  embedding?: number[]; // For semantic matching
}

/**
 * Level 1: Hash-based deduplication
 * Creates deterministic hash from record data
 */
export class HashDeduplicator {
  private hashMap: Map<string, DeduplicationRecord> = new Map();

  /**
   * Generate hash from record
   * Format: make|model|year|engine|dtc|procedure_title
   */
  generateHash(record: any): string {
    const key = `${record.vehicle?.make || ""}|${record.vehicle?.model || ""}|${record.vehicle?.year || ""}|${record.vehicle?.engine_code || ""}|${record.error_code?.code || ""}|${record.repair_procedures?.[0]?.action || ""}`;

    return crypto.createHash("sha256").update(key).digest("hex");
  }

  /**
   * Check for hash-based duplicate
   */
  checkDuplicate(record: any): DeduplicationResult {
    const hash = this.generateHash(record);

    if (this.hashMap.has(hash)) {
      const existing = this.hashMap.get(hash)!;
      return {
        isDuplicate: true,
        level: 1,
        matchedRecordId: existing.id,
        confidence: 0.99, // Hash match = very high confidence
        mergeAction: "skip",
      };
    }

    return {
      isDuplicate: false,
      level: 0,
      confidence: 0,
    };
  }

  /**
   * Register record
   */
  register(record: any, id: string): void {
    const hash = this.generateHash(record);
    this.hashMap.set(hash, {
      id,
      hash,
      canonical_key: `${record.vehicle?.make}|${record.vehicle?.model}|${record.vehicle?.year}`,
      data: record,
      confidence: record.confidence || 0.5,
      sources: record.sources || [],
    });
  }

  /**
   * Get all registered hashes
   */
  getStats() {
    return {
      totalRecords: this.hashMap.size,
      hashes: Array.from(this.hashMap.keys()),
    };
  }
}

/**
 * Level 2: Semantic deduplication
 * Uses string similarity to detect similar procedures
 */
export class SemanticDeduplicator {
  private recordMap: Map<string, DeduplicationRecord> = new Map();
  private SIMILARITY_THRESHOLD = 0.8; // 80% similarity = duplicate

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];

    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // Substitution
            matrix[i][j - 1] + 1, // Insertion
            matrix[i - 1][j] + 1 // Deletion
          );
        }
      }
    }

    return matrix[len2][len1];
  }

  /**
   * Calculate similarity score (0-1)
   */
  calculateSimilarity(str1: string, str2: string): number {
    const distance = this.levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
    const maxLength = Math.max(str1.length, str2.length);
    return 1 - distance / maxLength;
  }

  /**
   * Extract procedure signature for comparison
   */
  private getProcedureSignature(record: any): string {
    const parts = [
      record.vehicle?.make,
      record.vehicle?.model,
      record.error_code?.code,
      record.repair_procedures?.[0]?.action?.substring(0, 50), // First 50 chars
    ];
    return parts.filter(Boolean).join("|").toLowerCase();
  }

  /**
   * Check for semantic duplicate
   */
  checkDuplicate(record: any, existingRecords: DeduplicationRecord[]): DeduplicationResult {
    const signature = this.getProcedureSignature(record);

    for (const existing of existingRecords) {
      const existingSignature = this.getProcedureSignature(existing.data);
      const similarity = this.calculateSimilarity(signature, existingSignature);

      if (similarity >= this.SIMILARITY_THRESHOLD) {
        return {
          isDuplicate: true,
          level: 2,
          matchedRecordId: existing.id,
          confidence: similarity,
          mergeAction: "merge", // Merge sources and update confidence
        };
      }
    }

    return {
      isDuplicate: false,
      level: 0,
      confidence: 0,
    };
  }

  /**
   * Register record
   */
  register(record: any, id: string): void {
    const signature = this.getProcedureSignature(record);
    this.recordMap.set(id, {
      id,
      hash: signature,
      canonical_key: `${record.vehicle?.make}|${record.vehicle?.model}|${record.vehicle?.year}`,
      data: record,
      confidence: record.confidence || 0.5,
      sources: record.sources || [],
    });
  }

  /**
   * Get all registered records
   */
  getRecords(): DeduplicationRecord[] {
    return Array.from(this.recordMap.values());
  }
}

/**
 * Level 3: Source confirmation deduplication
 * Merges records when multiple sources confirm the same procedure
 */
export class SourceConfirmationDeduplicator {
  private sourceMap: Map<string, Set<string>> = new Map(); // key -> set of source URLs
  private MIN_SOURCES_FOR_MERGE = 2; // Minimum sources to confirm

  /**
   * Create canonical key from record
   */
  private getCanonicalKey(record: any): string {
    return `${record.vehicle?.make}|${record.vehicle?.model}|${record.vehicle?.year}|${record.error_code?.code}|${record.repair_procedures?.[0]?.action?.substring(0, 30)}`;
  }

  /**
   * Check for source confirmation duplicate
   */
  checkDuplicate(record: any): DeduplicationResult {
    const key = this.getCanonicalKey(record);
    const sources = record.sources || [];

    if (this.sourceMap.has(key)) {
      const existingSources = this.sourceMap.get(key)!;

      // Check if there are overlapping or multiple sources
      const allSources = new Set<string>([...Array.from(existingSources), ...sources]);

      if (allSources.size >= this.MIN_SOURCES_FOR_MERGE) {
        const confidence = Math.min(0.99, 0.5 + allSources.size * 0.15); // Increase confidence with more sources

        return {
          isDuplicate: true,
          level: 3,
          confidence,
          mergeAction: "update_confidence", // Update confidence score
        };
      }
    }

    return {
      isDuplicate: false,
      level: 0,
      confidence: 0,
    };
  }

  /**
   * Register record sources
   */
  register(record: any): void {
    const key = this.getCanonicalKey(record);
    const sources = new Set<string>(record.sources || []);

    if (this.sourceMap.has(key)) {
      const existing = this.sourceMap.get(key)!;
      sources.forEach((s: string) => existing.add(s));
    } else {
      this.sourceMap.set(key, sources);
    }
  }

  /**
   * Get source count for key
   */
  getSourceCount(record: any): number {
    const key = this.getCanonicalKey(record);
    return this.sourceMap.get(key)?.size || 0;
  }

  /**
   * Get all sources for key
   */
  getSources(record: any): string[] {
    const key = this.getCanonicalKey(record);
    const sources = this.sourceMap.get(key);
    return sources ? Array.from(sources) : [];
  }
}

/**
 * Combined Deduplication Engine
 * Orchestrates all 3 levels
 */
export class DeduplicationEngine {
  private hashDedup: HashDeduplicator;
  private semanticDedup: SemanticDeduplicator;
  private sourceDedup: SourceConfirmationDeduplicator;
  private processedRecords: Map<string, DeduplicationRecord> = new Map();

  constructor() {
    this.hashDedup = new HashDeduplicator();
    this.semanticDedup = new SemanticDeduplicator();
    this.sourceDedup = new SourceConfirmationDeduplicator();
  }

  /**
   * Process record through all 3 deduplication levels
   */
  processRecord(record: any, recordId: string): DeduplicationResult {
    // Level 1: Hash-based
    const hashResult = this.hashDedup.checkDuplicate(record);
    if (hashResult.isDuplicate) {
      return hashResult;
    }

    // Level 2: Semantic
    const semanticResult = this.semanticDedup.checkDuplicate(
      record,
      this.semanticDedup.getRecords()
    );
    if (semanticResult.isDuplicate) {
      return semanticResult;
    }

    // Level 3: Source confirmation
    const sourceResult = this.sourceDedup.checkDuplicate(record);
    if (sourceResult.isDuplicate) {
      return sourceResult;
    }

    // No duplicate found - register record
    this.hashDedup.register(record, recordId);
    this.semanticDedup.register(record, recordId);
    this.sourceDedup.register(record);

    this.processedRecords.set(recordId, {
      id: recordId,
      hash: this.hashDedup.generateHash(record),
      canonical_key: `${record.vehicle?.make}|${record.vehicle?.model}|${record.vehicle?.year}`,
      data: record,
      confidence: record.confidence || 0.5,
      sources: record.sources || [],
    });

    return {
      isDuplicate: false,
      level: 0,
      confidence: 0,
      mergeAction: "skip",
    };
  }

  /**
   * Batch process records
   */
  batchProcess(records: any[]): Map<string, DeduplicationResult> {
    const results = new Map<string, DeduplicationResult>();

    records.forEach((record, index) => {
      const recordId = record.id || `record_${index}`;
      const result = this.processRecord(record, recordId);
      results.set(recordId, result);
    });

    return results;
  }

  /**
   * Get deduplication statistics
   */
  getStats() {
    const results = Array.from(this.processedRecords.values());
    const duplicates = Array.from(this.processedRecords.values()).filter(
      (r) => r.confidence > 0.8
    );

    return {
      totalProcessed: this.processedRecords.size,
      uniqueRecords: results.length,
      duplicatesFound: duplicates.length,
      deduplicationRate: (duplicates.length / (this.processedRecords.size || 1)) * 100,
      averageConfidence:
        results.reduce((sum, r) => sum + r.confidence, 0) / (results.length || 1),
    };
  }

  /**
   * Get processed records
   */
  getRecords(): DeduplicationRecord[] {
    return Array.from(this.processedRecords.values());
  }

  /**
   * Clear all data
   */
  reset(): void {
    this.hashDedup = new HashDeduplicator();
    this.semanticDedup = new SemanticDeduplicator();
    this.sourceDedup = new SourceConfirmationDeduplicator();
    this.processedRecords.clear();
  }
}

/**
 * Export for use
 */
export default DeduplicationEngine;
