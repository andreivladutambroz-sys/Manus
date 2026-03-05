/**
 * Redis Caching Service for Automotive Data
 * Manages cache TTLs and fallback strategies
 */

export interface CacheConfig {
  vinDecodeTTL: number; // 24 hours
  vehicleSpecsTTL: number; // 7 days
  recallsTTL: number; // 30 days
  makeModelTTL: number; // 90 days
}

export class CacheService {
  private config: CacheConfig;
  private cache: Map<string, { value: any; expiresAt: number }> = new Map();

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      vinDecodeTTL: 24 * 60 * 60 * 1000, // 24 hours
      vehicleSpecsTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
      recallsTTL: 30 * 24 * 60 * 60 * 1000, // 30 days
      makeModelTTL: 90 * 24 * 60 * 60 * 1000, // 90 days
      ...config,
    };
  }

  /**
   * Generate cache key
   */
  private generateKey(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}:${parts.join(':')}`;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: any, ttlMs: number): void {
    const expiresAt = Date.now() + ttlMs;
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Get value from cache
   */
  get(key: string): any | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Cache VIN decode result
   */
  cacheVinDecode(vin: string, data: any): void {
    const key = this.generateKey('vin', vin);
    this.set(key, data, this.config.vinDecodeTTL);
  }

  /**
   * Get cached VIN decode
   */
  getVinDecode(vin: string): any | null {
    const key = this.generateKey('vin', vin);
    return this.get(key);
  }

  /**
   * Cache vehicle specs
   */
  cacheVehicleSpecs(make: string, model: string, year: number, data: any): void {
    const key = this.generateKey('specs', make, model, year);
    this.set(key, data, this.config.vehicleSpecsTTL);
  }

  /**
   * Get cached vehicle specs
   */
  getVehicleSpecs(make: string, model: string, year: number): any | null {
    const key = this.generateKey('specs', make, model, year);
    return this.get(key);
  }

  /**
   * Cache recalls
   */
  cacheRecalls(make: string, model: string, year: number, data: any): void {
    const key = this.generateKey('recalls', make, model, year);
    this.set(key, data, this.config.recallsTTL);
  }

  /**
   * Get cached recalls
   */
  getRecalls(make: string, model: string, year: number): any | null {
    const key = this.generateKey('recalls', make, model, year);
    return this.get(key);
  }

  /**
   * Cache make/model list
   */
  cacheMakeModelList(make: string, data: any): void {
    const key = this.generateKey('models', make);
    this.set(key, data, this.config.makeModelTTL);
  }

  /**
   * Get cached make/model list
   */
  getMakeModelList(make: string): any | null {
    const key = this.generateKey('models', make);
    return this.get(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    totalEntries: number;
    expiredEntries: number;
    validEntries: number;
  } {
    let expiredCount = 0;
    let validCount = 0;

    this.cache.forEach((entry) => {
      if (Date.now() > entry.expiresAt) {
        expiredCount++;
      } else {
        validCount++;
      }
    });

    return {
      totalEntries: this.cache.size,
      expiredEntries: expiredCount,
      validEntries: validCount,
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    let removed = 0;
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => {
      this.cache.delete(key);
      removed++;
    });

    return removed;
  }
}

// Export singleton instance
export const cacheService = new CacheService();
