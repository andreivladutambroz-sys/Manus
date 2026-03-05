/**
 * Automotive Data Router
 * tRPC procedures for vehicle data, specs, and recalls
 */

import { router, publicProcedure } from '../_core/trpc';
import { z } from 'zod';
import { apiAggregator } from '../automotive-data/api-aggregator';
import { cacheService } from '../automotive-data/cache-service';

export const automotiveDataRouter = router({
  /**
   * Decode VIN to get vehicle information
   */
  decodeVin: publicProcedure
    .input(z.object({ vin: z.string().min(17).max(17) }))
    .query(async ({ input }) => {
      const { vin } = input;

      // Check cache first
      const cached = cacheService.getVinDecode(vin);
      if (cached) {
        return { ...cached, fromCache: true };
      }

      try {
        const result = await apiAggregator.decodeVin(vin);

        // Cache the result
        cacheService.cacheVinDecode(vin, result);

        return { ...result, fromCache: false };
      } catch (error) {
        return {
          success: false,
          error: `VIN decode failed: ${error instanceof Error ? error.message : String(error)}`,
          sources: [],
          overallConfidence: 0,
          fromCache: false,
        };
      }
    }),

  /**
   * Search vehicle by make, model, year
   */
  searchVehicle: publicProcedure
    .input(
      z.object({
        make: z.string().min(1),
        model: z.string().min(1),
        year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
      })
    )
    .query(async ({ input }) => {
      const { make, model, year } = input;

      // Check cache first
      const cached = cacheService.getVehicleSpecs(make, model, year);
      if (cached) {
        return { ...cached, fromCache: true };
      }

      try {
        const result = await apiAggregator.searchVehicle(make, model, year);

        // Cache the result
        cacheService.cacheVehicleSpecs(make, model, year, result);

        return { ...result, fromCache: false };
      } catch (error) {
        return {
          success: false,
          error: `Vehicle search failed: ${error instanceof Error ? error.message : String(error)}`,
          sources: [],
          overallConfidence: 0,
          fromCache: false,
        };
      }
    }),

  /**
   * Get vehicle specifications
   */
  getSpecifications: publicProcedure
    .input(
      z.object({
        make: z.string().min(1),
        model: z.string().min(1),
        year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
      })
    )
    .query(async ({ input }) => {
      const { make, model, year } = input;

      // Check cache first
      const cached = cacheService.getVehicleSpecs(make, model, year);
      if (cached) {
        return { ...cached, fromCache: true };
      }

      try {
        const result = await apiAggregator.getSpecifications(make, model, year);

        // Cache the result
        cacheService.cacheVehicleSpecs(make, model, year, result);

        return { ...result, fromCache: false };
      } catch (error) {
        return {
          success: false,
          error: `Specifications fetch failed: ${error instanceof Error ? error.message : String(error)}`,
          sources: [],
          overallConfidence: 0,
          fromCache: false,
        };
      }
    }),

  /**
   * Get vehicle recalls
   */
  getRecalls: publicProcedure
    .input(
      z.object({
        make: z.string().min(1),
        model: z.string().min(1),
        year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
        vin: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { make, model, year, vin } = input;

      // Check cache first
      const cached = cacheService.getRecalls(make, model, year);
      if (cached) {
        return { ...cached, fromCache: true };
      }

      try {
        const result = await apiAggregator.getRecalls(make, model, year, vin);

        // Cache the result
        cacheService.cacheRecalls(make, model, year, result);

        return { ...result, fromCache: false };
      } catch (error) {
        return {
          success: false,
          error: `Recalls fetch failed: ${error instanceof Error ? error.message : String(error)}`,
          recalls: [],
          sources: [],
          overallConfidence: 0,
          fromCache: false,
        };
      }
    }),

  /**
   * Get available providers
   */
  getProviders: publicProcedure.query(() => {
    return {
      providers: apiAggregator.getProviders(),
      count: apiAggregator.getProviders().length,
    };
  }),

  /**
   * Get cache statistics
   */
  getCacheStats: publicProcedure.query(() => {
    return cacheService.getStats();
  }),

  /**
   * Clear cache (admin only)
   */
  clearCache: publicProcedure.mutation(() => {
    cacheService.clear();
    return { success: true, message: 'Cache cleared' };
  }),
});
