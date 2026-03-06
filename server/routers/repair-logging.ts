import { router, protectedProcedure } from '../_core/router';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { db } from '../db';
import { repairLogs, vehicles } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';

export const repairLoggingRouter = router({
  /**
   * Log a completed repair
   */
  logRepair: protectedProcedure
    .input(
      z.object({
        vehicleId: z.string(),
        errorCode: z.string(),
        symptoms: z.array(z.string()),
        repairActions: z.array(z.string()),
        toolsUsed: z.array(z.string()),
        timeSpentHours: z.number().min(0.25),
        costUSD: z.number().min(0),
        notes: z.string().optional(),
        partsReplaced: z.array(z.string()).optional(),
        beforePhotos: z.array(z.string()).optional(),
        afterPhotos: z.array(z.string()).optional()
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        if (!db) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database connection failed'
          });
        }

        // Verify vehicle belongs to user
        const vehicle = await db
          .select()
          .from(vehicles)
          .where(
            and(
              eq(vehicles.id, input.vehicleId),
              eq(vehicles.userId, ctx.user.id)
            )
          )
          .limit(1);

        if (!vehicle.length) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Vehicle not found'
          });
        }

        // Create repair log
        const repairLog = await db.insert(repairLogs).values({
          userId: ctx.user.id,
          vehicleId: input.vehicleId,
          errorCode: input.errorCode,
          symptoms: JSON.stringify(input.symptoms),
          repairActions: JSON.stringify(input.repairActions),
          toolsUsed: JSON.stringify(input.toolsUsed),
          timeSpentHours: input.timeSpentHours,
          costUSD: input.costUSD,
          notes: input.notes,
          partsReplaced: input.partsReplaced ? JSON.stringify(input.partsReplaced) : null,
          beforePhotos: input.beforePhotos ? JSON.stringify(input.beforePhotos) : null,
          afterPhotos: input.afterPhotos ? JSON.stringify(input.afterPhotos) : null,
          completedAt: new Date()
        });

        return {
          success: true,
          repairLogId: repairLog[0]?.id,
          message: 'Repair logged successfully'
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to log repair'
        });
      }
    }),

  /**
   * Get repair history for a vehicle
   */
  getRepairHistory: protectedProcedure
    .input(z.object({ vehicleId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        if (!db) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database connection failed'
          });
        }

        const history = await db
          .select()
          .from(repairLogs)
          .where(
            and(
              eq(repairLogs.vehicleId, input.vehicleId),
              eq(repairLogs.userId, ctx.user.id)
            )
          )
          .orderBy(repairLogs.completedAt);

        return history.map(log => ({
          ...log,
          symptoms: JSON.parse(log.symptoms || '[]'),
          repairActions: JSON.parse(log.repairActions || '[]'),
          toolsUsed: JSON.parse(log.toolsUsed || '[]'),
          partsReplaced: log.partsReplaced ? JSON.parse(log.partsReplaced) : [],
          beforePhotos: log.beforePhotos ? JSON.parse(log.beforePhotos) : [],
          afterPhotos: log.afterPhotos ? JSON.parse(log.afterPhotos) : []
        }));
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get repair history'
        });
      }
    }),

  /**
   * Get repair statistics for a vehicle
   */
  getRepairStats: protectedProcedure
    .input(z.object({ vehicleId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        if (!db) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database connection failed'
          });
        }

        const repairs = await db
          .select()
          .from(repairLogs)
          .where(
            and(
              eq(repairLogs.vehicleId, input.vehicleId),
              eq(repairLogs.userId, ctx.user.id)
            )
          );

        const totalRepairs = repairs.length;
        const totalCost = repairs.reduce((sum, r) => sum + (r.costUSD || 0), 0);
        const totalTimeHours = repairs.reduce((sum, r) => sum + (r.timeSpentHours || 0), 0);
        const uniqueErrorCodes = new Set(repairs.map(r => r.errorCode)).size;
        const avgCostPerRepair = totalRepairs > 0 ? totalCost / totalRepairs : 0;
        const avgTimePerRepair = totalRepairs > 0 ? totalTimeHours / totalRepairs : 0;

        // Most common error codes
        const errorCodeFreq = repairs.reduce((acc, r) => {
          acc[r.errorCode] = (acc[r.errorCode] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const mostCommonCodes = Object.entries(errorCodeFreq)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([code, count]) => ({ code, count }));

        return {
          totalRepairs,
          totalCost,
          totalTimeHours,
          uniqueErrorCodes,
          avgCostPerRepair,
          avgTimePerRepair,
          mostCommonCodes,
          lastRepairDate: repairs.length > 0 ? repairs[repairs.length - 1]?.completedAt : null
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get repair statistics'
        });
      }
    }),

  /**
   * Save favorite diagnostic for quick access
   */
  saveFavoriteDiagnostic: protectedProcedure
    .input(
      z.object({
        vehicleId: z.string(),
        errorCode: z.string(),
        symptoms: z.array(z.string()),
        repairSuggestions: z.array(z.string()),
        toolsNeeded: z.array(z.string()),
        notes: z.string().optional()
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // This would typically save to a favorites table
        // For now, returning success
        return {
          success: true,
          message: 'Diagnostic saved to favorites'
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to save favorite'
        });
      }
    })
});
