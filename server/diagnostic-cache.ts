import crypto from "crypto";

/**
 * Diagnostic Caching Layer
 * Cache rezultate diagnostic pentru simptome similare
 */

export interface CacheEntry {
  key: string;
  symptoms: string;
  errorCodes?: string[];
  result: string;
  timestamp: number;
  hitCount: number;
  coherenceScore: number;
}

// In-memory cache (în producție, folosiți Redis)
const diagnosticCache: Map<string, CacheEntry> = new Map();

/**
 * Generează cache key din simptome
 */
export function generateCacheKey(
  symptoms: string,
  errorCodes?: string[]
): string {
  const normalized = `${symptoms.toLowerCase().trim()}|${(errorCodes || []).sort().join(",")}`;
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

/**
 * Calculează similarity score între simptome (0-1)
 */
export function calculateSimilarity(
  symptoms1: string,
  symptoms2: string
): number {
  const words1 = new Set(symptoms1.toLowerCase().split(/\s+/));
  const words2 = new Set(symptoms2.toLowerCase().split(/\s+/));

  const intersection = new Set(Array.from(words1).filter((w) => words2.has(w)));
  const union = new Set([...Array.from(words1), ...Array.from(words2)]);

  return intersection.size / union.size;
}

/**
 * Caută în cache cu fuzzy matching
 */
export function searchCache(
  symptoms: string,
  errorCodes?: string[],
  similarityThreshold: number = 0.7
): CacheEntry | null {
  const exactKey = generateCacheKey(symptoms, errorCodes);

  // Căutare exactă
  if (diagnosticCache.has(exactKey)) {
    const entry = diagnosticCache.get(exactKey)!;
    entry.hitCount++;
    entry.timestamp = Date.now();
    return entry;
  }

  // Căutare fuzzy
  let bestMatch: CacheEntry | null = null;
  let bestSimilarity = similarityThreshold;

  diagnosticCache.forEach((entry: CacheEntry) => {
    const similarity = calculateSimilarity(symptoms, entry.symptoms);
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestMatch = entry;
    }
  });

  if (bestMatch) {
    (bestMatch as CacheEntry).hitCount++;
    (bestMatch as CacheEntry).timestamp = Date.now();
  }

  return bestMatch;
}

/**
 * Adaugă intrare în cache
 */
export function setCacheEntry(
  symptoms: string,
  errorCodes: string[] | undefined,
  result: string,
  coherenceScore: number
): CacheEntry {
  const key = generateCacheKey(symptoms, errorCodes);

  const entry: CacheEntry = {
    key,
    symptoms,
    errorCodes,
    result,
    timestamp: Date.now(),
    hitCount: 0,
    coherenceScore,
  };

  diagnosticCache.set(key, entry);
  return entry;
}

/**
 * Obține statistici cache
 */
export function getCacheStats(): {
  totalEntries: number;
  totalHits: number;
  averageCoherence: number;
  cacheSize: number;
  hitRate: number;
} {
  const entries = Array.from(diagnosticCache.values());

  if (entries.length === 0) {
    return {
      totalEntries: 0,
      totalHits: 0,
      averageCoherence: 0,
      cacheSize: 0,
      hitRate: 0,
    };
  }

  const totalHits = entries.reduce((sum, e) => sum + e.hitCount, 0);
  const totalCoherence = entries.reduce((sum, e) => sum + e.coherenceScore, 0);
  const cacheSize = JSON.stringify(Array.from(diagnosticCache.values())).length;

  return {
    totalEntries: entries.length,
    totalHits,
    averageCoherence: totalCoherence / entries.length,
    cacheSize,
    hitRate: totalHits / (totalHits + entries.length),
  };
}

/**
 * Șterge intrări vechi din cache
 */
export function cleanupOldCacheEntries(maxAgeMs: number = 86400000): number {
  const now = Date.now();
  let deletedCount = 0;

  diagnosticCache.forEach((entry: CacheEntry, key: string) => {
    if (now - entry.timestamp > maxAgeMs) {
      diagnosticCache.delete(key);
      deletedCount++;
    }
  });;

  return deletedCount;
}

/**
 * Șterge cache
 */
export function clearCache(): void {
  diagnosticCache.clear();
}

/**
 * Obține toate intrările cache
 */
export function getAllCacheEntries(): CacheEntry[] {
  return Array.from(diagnosticCache.values());
}

/**
 * Formatează statistici cache
 */
export function formatCacheStats(): string {
  const stats = getCacheStats();
  const lines: string[] = [
    "=== DIAGNOSTIC CACHE STATISTICS ===",
    `Total Entries: ${stats.totalEntries}`,
    `Total Hits: ${stats.totalHits}`,
    `Hit Rate: ${(stats.hitRate * 100).toFixed(1)}%`,
    `Average Coherence: ${(stats.averageCoherence * 100).toFixed(1)}%`,
    `Cache Size: ${(stats.cacheSize / 1024).toFixed(2)} KB`,
  ];

  return lines.join("\n");
}

/**
 * Estimează latency reduction din cache
 */
export function estimateLatencyReduction(): {
  withoutCache: number;
  withCache: number;
  reduction: number;
  percentReduction: number;
} {
  const stats = getCacheStats();

  // Estimare: 1200ms per diagnostic
  const withoutCache = 1200;
  // Cu cache hit: 50-100ms
  const cacheHitTime = 75;
  // Timp mediu cu cache: (hits * 75 + misses * 1200) / total
  const totalRequests = stats.totalHits + stats.totalEntries;
  const withCache =
    totalRequests > 0
      ? (stats.totalHits * cacheHitTime + stats.totalEntries * withoutCache) /
        totalRequests
      : withoutCache;

  const reduction = withoutCache - withCache;
  const percentReduction = (reduction / withoutCache) * 100;

  return {
    withoutCache,
    withCache: Math.round(withCache),
    reduction: Math.round(reduction),
    percentReduction: Math.round(percentReduction),
  };
}
