/**
 * Vehicle Data tRPC Router
 * Bridges FastAPI vehicle database with Node.js backend
 */

import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
// Using native fetch (available in Node.js 18+)

const FASTAPI_BASE_URL = process.env.FASTAPI_URL || "http://localhost:8000";

// Schemas
const ManufacturerSchema = z.object({
  id: z.number(),
  name: z.string(),
  country: z.string().optional(),
  logo_url: z.string().optional(),
});

const ModelSchema = z.object({
  id: z.number(),
  manufacturer_id: z.number(),
  name: z.string(),
  body_type: z.string().optional(),
  class_: z.string().optional(),
});

const EngineSchema = z.object({
  id: z.number(),
  engine_code: z.string().optional(),
  engine_name: z.string(),
  displacement_cc: z.number().optional(),
  power_kw: z.number().optional(),
  power_hp: z.number().optional(),
  torque_nm: z.number().optional(),
  fuel_type: z.string().optional(),
  cylinders: z.number().optional(),
  co2_emissions: z.number().optional(),
});

const VINDecodeResultSchema = z.object({
  vin: z.string(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  year: z.number().optional(),
  engine: z.string().optional(),
  fuel_type: z.string().optional(),
  trim: z.string().optional(),
  source: z.string(),
});

/**
 * Helper function to call FastAPI endpoints
 */
async function callFastAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(`${FASTAPI_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`FastAPI error: ${response.statusText}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error(`FastAPI call failed: ${endpoint}`, error);
    throw error;
  }
}

export const vehicleDataRouter = router({
  /**
   * Get all manufacturers
   */
  getManufacturers: publicProcedure
    .input(z.object({ limit: z.number().default(100).pipe(z.number().max(1000)) }))
    .query(async ({ input }) => {
      const manufacturers = await callFastAPI<z.infer<typeof ManufacturerSchema>[]>(
        `/manufacturers?limit=${input.limit}`
      );
      return manufacturers;
    }),

  /**
   * Get models for a manufacturer
   */
  getModels: publicProcedure
    .input(
      z.object({
        manufacturer_id: z.number(),
        limit: z.number().default(100).pipe(z.number().max(1000)),
      })
    )
    .query(async ({ input }) => {
      const models = await callFastAPI<z.infer<typeof ModelSchema>[]>(
        `/models?manufacturer_id=${input.manufacturer_id}&limit=${input.limit}`
      );
      return models;
    }),

  /**
   * Get engines
   */
  getEngines: publicProcedure
    .input(
      z.object({
        fuel_type: z.string().optional(),
        limit: z.number().default(100).pipe(z.number().max(1000)),
      })
    )
    .query(async ({ input }) => {
      const params = new URLSearchParams();
      if (input.fuel_type) params.append("fuel_type", input.fuel_type);
      params.append("limit", input.limit.toString());

      const engines = await callFastAPI<z.infer<typeof EngineSchema>[]>(
        `/engines?${params.toString()}`
      );
      return engines;
    }),

  /**
   * Decode VIN
   */
  decodeVIN: publicProcedure
    .input(z.object({ vin: z.string().min(17).max(17) }))
    .query(async ({ input }) => {
      const result = await callFastAPI<z.infer<typeof VINDecodeResultSchema>>(
        `/vin-decode/${input.vin.toUpperCase()}`
      );
      return result;
    }),

  /**
   * Search vehicles by make/model/year
   */
  searchVehicles: publicProcedure
    .input(
      z.object({
        make: z.string().optional(),
        model: z.string().optional(),
        year: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const params = new URLSearchParams();
      if (input.make) params.append("make", input.make);
      if (input.model) params.append("model", input.model);
      if (input.year) params.append("year", input.year.toString());

      try {
        const results = await callFastAPI<any[]>(
          `/search?${params.toString()}`
        );
        return results;
      } catch (error) {
        console.warn("Vehicle search failed, returning empty results", error);
        return [];
      }
    }),

  /**
   * Get cache statistics
   */
  getCacheStats: publicProcedure.query(async () => {
    try {
      const stats = await callFastAPI<any>("/cache/stats");
      return stats;
    } catch (error) {
      console.warn("Failed to get cache stats", error);
      return null;
    }
  }),

  /**
   * Clear cache
   */
  clearCache: publicProcedure
    .input(z.object({ pattern: z.string().default("*") }))
    .mutation(async ({ input }) => {
      try {
        const result = await callFastAPI<{ cleared: number }>(
          `/cache/clear?pattern=${input.pattern}`,
          { method: "POST" }
        );
        return result;
      } catch (error) {
        console.error("Failed to clear cache", error);
        throw error;
      }
    }),
});

export type VehicleDataRouter = typeof vehicleDataRouter;
