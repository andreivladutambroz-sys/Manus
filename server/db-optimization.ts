import { sql } from 'drizzle-orm';

/**
 * Database Query Optimization Helpers
 * Includes caching, indexing, and query optimization
 */

// Simple in-memory cache for frequently accessed data
const queryCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Execute query with caching
 */
export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttl: number = CACHE_TTL
): Promise<T> {
  const cached = queryCache.get(key);
  
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data as T;
  }

  const data = await queryFn();
  queryCache.set(key, { data, timestamp: Date.now() });
  
  return data;
}

/**
 * Clear specific cache entry
 */
export function clearCache(key: string) {
  queryCache.delete(key);
}

/**
 * Clear all cache
 */
export function clearAllCache() {
  queryCache.clear();
}

/**
 * Batch query execution for better performance
 */
export async function batchQuery<T>(
  queries: Array<() => Promise<T>>,
  batchSize: number = 10
): Promise<T[]> {
  const results: T[] = [];
  
  for (let i = 0; i < queries.length; i += batchSize) {
    const batch = queries.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(q => q()));
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Paginate query results
 */
export function paginate<T>(
  items: T[],
  page: number = 1,
  pageSize: number = 20
) {
  const total = items.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIdx = (page - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  
  return {
    data: items.slice(startIdx, endIdx),
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

/**
 * Create database indexes for frequently queried columns
 */
export async function createOptimizationIndexes() {
  // Index creation should be done via Drizzle migrations
  // This is a placeholder for documentation
  const indexQueries = [
    // Diagnostic indexes
    `CREATE INDEX IF NOT EXISTS idx_diagnostic_vehicle_id ON diagnostics(vehicle_id);`,
    `CREATE INDEX IF NOT EXISTS idx_diagnostic_user_id ON diagnostics(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_diagnostic_created_at ON diagnostics(created_at DESC);`,
    
    // Vehicle indexes
    `CREATE INDEX IF NOT EXISTS idx_vehicle_user_id ON vehicles(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_vehicle_brand_model ON vehicles(brand, model);`,
    
    // Error code indexes
    `CREATE INDEX IF NOT EXISTS idx_error_code_diagnostic_id ON error_codes(diagnostic_id);`,
    
    // Chat message indexes
    `CREATE INDEX IF NOT EXISTS idx_chat_message_diagnostic_id ON chat_messages(diagnostic_id);`,
    `CREATE INDEX IF NOT EXISTS idx_chat_message_created_at ON chat_messages(created_at DESC);`,
  ];
  
  console.log('Indexes to create:', indexQueries);
}

/**
 * Analyze query performance
 */
export async function analyzeQueryPerformance(
  query: string,
  params: any[] = []
): Promise<{ executionTime: number; rowsAffected: number }> {
  const startTime = performance.now();
  
  try {
    // Query analysis should be done with actual database connection
    const executionTime = performance.now() - startTime;
    
    return {
      executionTime,
      rowsAffected: 0,
    };
  } catch (error) {
    console.error('Query analysis error:', error);
    throw error;
  }
}

/**
 * Connection pool statistics
 */
export function getPoolStats() {
  const entries: string[] = [];
  queryCache.forEach((_, key) => entries.push(key));
  
  return {
    timestamp: new Date(),
    cacheSize: queryCache.size,
    cacheEntries: entries,
  };
}

/**
 * Cleanup old cache entries
 */
export function cleanupOldCacheEntries(maxAge: number = 30 * 60 * 1000) {
  const now = Date.now();
  let cleaned = 0;
  const keysToDelete: string[] = [];
  
  queryCache.forEach((value, key) => {
    if (now - value.timestamp > maxAge) {
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(key => {
    queryCache.delete(key);
    cleaned++;
  });
  
  return cleaned;
}

// Cleanup old cache entries every 10 minutes
setInterval(() => {
  const cleaned = cleanupOldCacheEntries();
  if (cleaned > 0) {
    console.log(`Cleaned ${cleaned} old cache entries`);
  }
}, 10 * 60 * 1000);
