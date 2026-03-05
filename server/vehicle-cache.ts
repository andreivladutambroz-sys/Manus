/**
 * Vehicle Data Caching Layer
 * Optimizes repeated queries for manufacturers, models, and engines
 */

import { getDb } from './db';
import { manufacturers, models, engines } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // milliseconds
}

class VehicleCache {
  private manufacturerCache = new Map<string, CacheEntry<any>>();
  private modelCache = new Map<string, CacheEntry<any>>();
  private engineCache = new Map<string, CacheEntry<any>>();
  private manufacturerListCache: CacheEntry<any> | null = null;
  private modelListCache: CacheEntry<any> | null = null;

  private DEFAULT_TTL = 3600000; // 1 hour

  /**
   * Check if cache entry is still valid
   */
  private isValid<T>(entry: CacheEntry<T> | null): boolean {
    if (!entry) return false;
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Get manufacturer by name with caching
   */
  async getManufacturerByName(name: string) {
    const cacheKey = name.toLowerCase();

    const cached = this.manufacturerCache.get(cacheKey);
    if (cached && this.isValid(cached)) {
      return cached.data;
    }

    const db = await getDb();
    if (!db) return null;

    const result = await db
      .select()
      .from(manufacturers)
      .where(eq(manufacturers.name, name))
      .limit(1);

    if (result.length > 0) {
      this.manufacturerCache.set(cacheKey, {
        data: result[0],
        timestamp: Date.now(),
        ttl: this.DEFAULT_TTL,
      });
      return result[0];
    }

    return null;
  }

  /**
   * Get all manufacturers with caching
   */
  async getAllManufacturers() {
    if (this.manufacturerListCache && this.isValid(this.manufacturerListCache)) {
      return this.manufacturerListCache.data;
    }

    const db = await getDb();
    if (!db) return [];

    const result = await db.select().from(manufacturers);

    this.manufacturerListCache = {
      data: result,
      timestamp: Date.now(),
      ttl: this.DEFAULT_TTL,
    };

    return result;
  }

  /**
   * Get models by manufacturer with caching
   */
  async getModelsByManufacturer(manufacturerId: number) {
    const cacheKey = `mfr_${manufacturerId}`;

    const cached = this.modelCache.get(cacheKey);
    if (cached && this.isValid(cached)) {
      return cached.data;
    }

    const db = await getDb();
    if (!db) return [];

    const result = await db
      .select()
      .from(models)
      .where(eq(models.manufacturer_id, manufacturerId));

    this.modelCache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
      ttl: this.DEFAULT_TTL,
    });

    return result;
  }

  /**
   * Get engine by code with caching
   */
  async getEngineByCode(code: string) {
    const cacheKey = code.toLowerCase();

    const cached = this.engineCache.get(cacheKey);
    if (cached && this.isValid(cached)) {
      return cached.data;
    }

    const db = await getDb();
    if (!db) return null;

    const result = await db
      .select()
      .from(engines)
      .where(eq(engines.engine_code, code))
      .limit(1);

    if (result.length > 0) {
      this.engineCache.set(cacheKey, {
        data: result[0],
        timestamp: Date.now(),
        ttl: this.DEFAULT_TTL,
      });
      return result[0];
    }

    return null;
  }

  /**
   * Clear all caches
   */
  clearAll() {
    this.manufacturerCache.clear();
    this.modelCache.clear();
    this.engineCache.clear();
    this.manufacturerListCache = null;
    this.modelListCache = null;
  }

  /**
   * Clear specific cache by type
   */
  clearByType(type: 'manufacturer' | 'model' | 'engine') {
    switch (type) {
      case 'manufacturer':
        this.manufacturerCache.clear();
        this.manufacturerListCache = null;
        break;
      case 'model':
        this.modelCache.clear();
        this.modelListCache = null;
        break;
      case 'engine':
        this.engineCache.clear();
        break;
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      manufacturerCacheSize: this.manufacturerCache.size,
      modelCacheSize: this.modelCache.size,
      engineCacheSize: this.engineCache.size,
      manufacturerListCached: this.isValid(this.manufacturerListCache),
      modelListCached: this.isValid(this.modelListCache),
    };
  }
}

// Singleton instance
export const vehicleCache = new VehicleCache();
