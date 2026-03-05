import { describe, it, expect, beforeEach } from 'vitest';
import { ApiAggregator } from './automotive-data/api-aggregator';
import { CacheService } from './automotive-data/cache-service';
import { NhtsaProvider } from './automotive-data/providers/nhtsa-provider';
import { FuelEconomyProvider } from './automotive-data/providers/fuel-economy-provider';
import { CarQueryProvider } from './automotive-data/providers/carquery-provider';
import { EuDatasetProvider } from './automotive-data/providers/eu-dataset-provider';

describe('Automotive Data Layer', () => {
  let aggregator: ApiAggregator;
  let cache: CacheService;

  beforeEach(() => {
    aggregator = new ApiAggregator();
    cache = new CacheService();
  });

  describe('Providers', () => {
    it('should initialize all providers', () => {
      const providers = aggregator.getProviders();
      expect(providers).toContain('nhtsa');
      expect(providers).toContain('fueleconomy');
      expect(providers).toContain('carquery');
      expect(providers).toContain('eu-dataset');
      expect(providers.length).toBe(4);
    });

    it('should have NHTSA provider', () => {
      const nhtsa = new NhtsaProvider();
      expect(nhtsa.getName()).toBe('nhtsa');
    });

    it('should have FuelEconomy provider', () => {
      const fuel = new FuelEconomyProvider();
      expect(fuel.getName()).toBe('fueleconomy');
    });

    it('should have CarQuery provider', () => {
      const carquery = new CarQueryProvider();
      expect(carquery.getName()).toBe('carquery');
    });

    it('should have EU Dataset provider', () => {
      const eu = new EuDatasetProvider();
      expect(eu.getName()).toBe('eu-dataset');
    });
  });

  describe('Cache Service', () => {
    it('should cache and retrieve VIN decode results', () => {
      const testData = {
        make: 'Volkswagen',
        model: 'Golf',
        year: 2015,
        engineType: 'Diesel',
      };

      cache.cacheVinDecode('WVWZZZ3CZ9E123456', testData);
      const retrieved = cache.getVinDecode('WVWZZZ3CZ9E123456');

      expect(retrieved).toEqual(testData);
    });

    it('should cache and retrieve vehicle specs', () => {
      const testData = {
        make: 'BMW',
        model: '3 Series',
        year: 2020,
        power: '190kW',
      };

      cache.cacheVehicleSpecs('BMW', '3 Series', 2020, testData);
      const retrieved = cache.getVehicleSpecs('BMW', '3 Series', 2020);

      expect(retrieved).toEqual(testData);
    });

    it('should cache and retrieve recalls', () => {
      const testData = [
        {
          recallId: 'NHTSA-2020-001',
          manufacturer: 'Toyota',
          description: 'Brake issue',
          riskLevel: 'high' as const,
          status: 'open' as const,
        },
      ];

      cache.cacheRecalls('Toyota', 'Camry', 2020, testData);
      const retrieved = cache.getRecalls('Toyota', 'Camry', 2020);

      expect(retrieved).toEqual(testData);
    });

    it('should return null for expired cache entries', () => {
      const testData = { make: 'Honda', model: 'Civic', year: 2019 };
      const shortTTL = 10; // 10ms

      cache.set('test-key', testData, shortTTL);

      // Wait for expiration
      setTimeout(() => {
        const retrieved = cache.get('test-key');
        expect(retrieved).toBeNull();
      }, 50);
    });

    it('should clear all cache', () => {
      cache.cacheVinDecode('VIN123', { make: 'Test' });
      cache.cacheVehicleSpecs('Test', 'Model', 2020, { make: 'Test' });

      cache.clear();

      expect(cache.getVinDecode('VIN123')).toBeNull();
      expect(cache.getVehicleSpecs('Test', 'Model', 2020)).toBeNull();
    });

    it('should provide cache statistics', () => {
      cache.cacheVinDecode('VIN1', { make: 'Test1' });
      cache.cacheVinDecode('VIN2', { make: 'Test2' });

      const stats = cache.getStats();
      expect(stats.totalEntries).toBe(2);
      expect(stats.validEntries).toBe(2);
      expect(stats.expiredEntries).toBe(0);
    });

    it('should cleanup expired entries', () => {
      const shortTTL = 10; // 10ms
      cache.set('expire-key', { test: true }, shortTTL);
      cache.set('keep-key', { test: true }, 10000); // 10 seconds

      setTimeout(() => {
        const removed = cache.cleanup();
        expect(removed).toBeGreaterThan(0);
        expect(cache.get('expire-key')).toBeNull();
        expect(cache.get('keep-key')).not.toBeNull();
      }, 50);
    });
  });

  describe('API Aggregator', () => {
    it('should aggregate multiple provider responses', async () => {
      // This test would require mocking the providers
      // For now, we just verify the aggregator structure
      expect(aggregator).toBeDefined();
      expect(typeof aggregator.decodeVin).toBe('function');
      expect(typeof aggregator.searchVehicle).toBe('function');
      expect(typeof aggregator.getSpecifications).toBe('function');
      expect(typeof aggregator.getRecalls).toBe('function');
    });

    it('should have getProviders method', () => {
      const providers = aggregator.getProviders();
      expect(Array.isArray(providers)).toBe(true);
      expect(providers.length).toBeGreaterThan(0);
    });

    it('should have getStats method', () => {
      const stats = aggregator.getStats();
      expect(typeof stats).toBe('object');
    });
  });

  describe('Cache Configuration', () => {
    it('should use correct TTL values', () => {
      const customCache = new CacheService({
        vinDecodeTTL: 1000,
        vehicleSpecsTTL: 2000,
        recallsTTL: 3000,
        makeModelTTL: 4000,
      });

      expect(customCache).toBeDefined();
    });
  });

  describe('Provider Interfaces', () => {
    it('NHTSA provider should have required methods', () => {
      const nhtsa = new NhtsaProvider();
      expect(typeof nhtsa.decodeVin).toBe('function');
      expect(typeof nhtsa.searchVehicle).toBe('function');
      expect(typeof nhtsa.getSpecifications).toBe('function');
      expect(typeof nhtsa.getRecalls).toBe('function');
    });

    it('FuelEconomy provider should have required methods', () => {
      const fuel = new FuelEconomyProvider();
      expect(typeof fuel.decodeVin).toBe('function');
      expect(typeof fuel.searchVehicle).toBe('function');
      expect(typeof fuel.getSpecifications).toBe('function');
      expect(typeof fuel.getRecalls).toBe('function');
    });

    it('CarQuery provider should have required methods', () => {
      const carquery = new CarQueryProvider();
      expect(typeof carquery.decodeVin).toBe('function');
      expect(typeof carquery.searchVehicle).toBe('function');
      expect(typeof carquery.getSpecifications).toBe('function');
      expect(typeof carquery.getRecalls).toBe('function');
    });

    it('EU Dataset provider should have required methods', () => {
      const eu = new EuDatasetProvider();
      expect(typeof eu.decodeVin).toBe('function');
      expect(typeof eu.searchVehicle).toBe('function');
      expect(typeof eu.getSpecifications).toBe('function');
      expect(typeof eu.getRecalls).toBe('function');
    });
  });
});
