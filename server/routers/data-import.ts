/**
 * Data Import Router - Batch vehicle data population
 * Provides tRPC endpoints for importing vehicle variants
 */

import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { manufacturers, models, engines, vehicleVariants } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const dataImportRouter = router({
  /**
   * Import a batch of vehicles
   * Admin only
   */
  importBatch: protectedProcedure
    .input(z.object({
      vehicles: z.array(z.object({
        manufacturer: z.string(),
        model: z.string(),
        year: z.number(),
        engine_code: z.string(),
        engine_name: z.string(),
        power_kw: z.number(),
        fuel_type: z.string(),
        transmission: z.string(),
      })),
      batchId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Only admins can import data
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }

      const db = await getDb();
      if (!db) throw new Error('Database not available');

      let inserted = 0;
      const errors: string[] = [];

      try {
        for (const vehicle of input.vehicles) {
          try {
            // Insert manufacturer
            const mfrResult = await db
              .insert(manufacturers)
              .values({ name: vehicle.manufacturer, country: '' })
              .onDuplicateKeyUpdate({ set: { name: vehicle.manufacturer } });

            // Get manufacturer ID
            const mfrs = await db
              .select()
              .from(manufacturers)
              .where(eq(manufacturers.name, vehicle.manufacturer));

            if (!mfrs.length) throw new Error('Failed to get manufacturer');
            const mfr_id = mfrs[0].id;

            // Insert model
            const modelResult = await db
              .insert(models)
              .values({
                manufacturer_id: mfr_id,
                name: vehicle.model,
                body_type: '',
              })
              .onDuplicateKeyUpdate({ set: { name: vehicle.model } });

            // Get model ID
            const mdls = await db
              .select()
              .from(models)
              .where(and(
                eq(models.manufacturer_id, mfr_id),
                eq(models.name, vehicle.model)
              ));

            if (!mdls.length) throw new Error('Failed to get model');
            const model_id = mdls[0].id;

            // Insert engine
            const engResult = await db
              .insert(engines)
              .values({
                engine_code: vehicle.engine_code,
                engine_name: vehicle.engine_name,
                power_kw: vehicle.power_kw,
                fuel_type: vehicle.fuel_type,
              })
              .onDuplicateKeyUpdate({
                set: {
                  engine_name: vehicle.engine_name,
                  power_kw: vehicle.power_kw,
                }
              });

            // Get engine ID
            const engs = await db
              .select()
              .from(engines)
              .where(eq(engines.engine_code, vehicle.engine_code));

            if (!engs.length) throw new Error('Failed to get engine');
            const engine_id = engs[0].id;

            // Insert vehicle variant (requires generation_id, but we'll use a default)
            // For now, skip variant insertion as it requires generation data
            // await db
            //   .insert(vehicleVariants)
            //   .values({
            //     generation_id: 1, // Placeholder
            //     engine_id,
            //     transmission: vehicle.transmission,
            //   });

            inserted++;
          } catch (error) {
            errors.push(`${vehicle.manufacturer} ${vehicle.model}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        return {
          success: true,
          batchId: input.batchId,
          inserted,
          errors,
          totalProcessed: input.vehicles.length,
        };
      } catch (error) {
        throw new Error(`Batch import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  /**
   * Get import progress
   */
  getProgress: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }

      // Return placeholder progress
      return {
        totalBatches: 6000,
        completedBatches: 0,
        totalInserted: 0,
        progress: 0,
      };
    }),
});
