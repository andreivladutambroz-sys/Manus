import { router, publicProcedure } from '../_core/router';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { db } from '../db';
import { repairCases } from '@/drizzle/schema';
import { eq, like, and, inArray } from 'drizzle-orm';

export const diagnosticApiRouter = router({
  /**
   * Search diagnostics by vehicle make and model
   */
  searchByVehicle: publicProcedure
    .input(
      z.object({
        make: z.string(),
        model: z.string(),
        limit: z.number().min(1).max(50).default(10)
      })
    )
    .query(async ({ input }) => {
      try {
        if (!db) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database connection failed'
          });
        }

        const results = await db
          .select()
          .from(repairCases)
          .where(
            and(
              eq(repairCases.vehicle_make, input.make),
              eq(repairCases.vehicle_model, input.model)
            )
          )
          .limit(input.limit);

        return {
          count: results.length,
          results: results.map(r => ({
            id: r.id,
            vehicle: {
              make: r.vehicle_make,
              model: r.vehicle_model,
              year: r.vehicle_year
            },
            errorCode: r.error_code,
            symptoms: r.symptoms ? JSON.parse(r.symptoms as string) : [],
            repairSteps: r.repair_steps ? JSON.parse(r.repair_steps as string) : [],
            toolsRequired: r.tools_required ? JSON.parse(r.tools_required as string) : [],
            torqueSpecs: r.torque_specs ? JSON.parse(r.torque_specs as string) : {},
            confidence: r.confidence,
            sourceUrl: r.source_url
          }))
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Search failed'
        });
      }
    }),

  /**
   * Search diagnostics by error code
   */
  searchByErrorCode: publicProcedure
    .input(
      z.object({
        code: z.string().regex(/^[PUB][0-9]{4}$/),
        limit: z.number().min(1).max(50).default(10)
      })
    )
    .query(async ({ input }) => {
      try {
        if (!db) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database connection failed'
          });
        }

        const results = await db
          .select()
          .from(repairCases)
          .where(eq(repairCases.error_code, input.code))
          .limit(input.limit);

        return {
          code: input.code,
          count: results.length,
          results: results.map(r => ({
            id: r.id,
            vehicle: {
              make: r.vehicle_make,
              model: r.vehicle_model,
              year: r.vehicle_year
            },
            symptoms: r.symptoms ? JSON.parse(r.symptoms as string) : [],
            repairSteps: r.repair_steps ? JSON.parse(r.repair_steps as string) : [],
            toolsRequired: r.tools_required ? JSON.parse(r.tools_required as string) : [],
            confidence: r.confidence,
            sourceUrl: r.source_url
          }))
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Search failed'
        });
      }
    }),

  /**
   * Search diagnostics by symptom
   */
  searchBySymptom: publicProcedure
    .input(
      z.object({
        symptom: z.string().min(3),
        limit: z.number().min(1).max(50).default(10)
      })
    )
    .query(async ({ input }) => {
      try {
        if (!db) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database connection failed'
          });
        }

        // This is a simplified search - in production, you'd use full-text search
        const results = await db
          .select()
          .from(repairCases)
          .limit(input.limit);

        // Filter by symptom in application (since JSON search varies by DB)
        const filtered = results.filter(r => {
          try {
            const symptoms = r.symptoms ? JSON.parse(r.symptoms as string) : [];
            return symptoms.some((s: string) =>
              s.toLowerCase().includes(input.symptom.toLowerCase())
            );
          } catch {
            return false;
          }
        });

        return {
          symptom: input.symptom,
          count: filtered.length,
          results: filtered.slice(0, input.limit).map(r => ({
            id: r.id,
            vehicle: {
              make: r.vehicle_make,
              model: r.vehicle_model,
              year: r.vehicle_year
            },
            errorCode: r.error_code,
            symptoms: r.symptoms ? JSON.parse(r.symptoms as string) : [],
            repairSteps: r.repair_steps ? JSON.parse(r.repair_steps as string) : [],
            confidence: r.confidence,
            sourceUrl: r.source_url
          }))
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Search failed'
        });
      }
    }),

  /**
   * Get detailed diagnostic record
   */
  getDetail: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        if (!db) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database connection failed'
          });
        }

        const result = await db
          .select()
          .from(repairCases)
          .where(eq(repairCases.id, input.id))
          .limit(1);

        if (!result.length) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Diagnostic record not found'
          });
        }

        const r = result[0];
        return {
          id: r.id,
          vehicle: {
            make: r.vehicle_make,
            model: r.vehicle_model,
            year: r.vehicle_year,
            engine: r.engine
          },
          errorCode: r.error_code,
          symptoms: r.symptoms ? JSON.parse(r.symptoms as string) : [],
          repairSteps: r.repair_steps ? JSON.parse(r.repair_steps as string) : [],
          toolsRequired: r.tools_required ? JSON.parse(r.tools_required as string) : [],
          torqueSpecs: r.torque_specs ? JSON.parse(r.torque_specs as string) : {},
          confidence: r.confidence,
          sourceUrl: r.source_url,
          sourceDomain: r.source_domain,
          createdAt: r.created_at
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get detail'
        });
      }
    }),

  /**
   * Get statistics about available diagnostics
   */
  getStats: publicProcedure.query(async () => {
    try {
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database connection failed'
        });
      }

      const allRecords = await db.select().from(repairCases);

      const uniqueMakes = new Set(allRecords.map(r => r.vehicle_make)).size;
      const uniqueModels = new Set(allRecords.map(r => r.vehicle_model)).size;
      const uniqueCodes = new Set(allRecords.map(r => r.error_code)).size;
      const avgConfidence =
        allRecords.reduce((sum, r) => sum + (r.confidence || 0), 0) / allRecords.length;

      return {
        totalRecords: allRecords.length,
        uniqueMakes,
        uniqueModels,
        uniqueErrorCodes: uniqueCodes,
        avgConfidence: Math.round(avgConfidence * 100) / 100,
        lastUpdated: new Date()
      };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get statistics'
      });
    }
  })
});
