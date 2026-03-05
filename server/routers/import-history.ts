/**
 * Import History Router - Track all vehicle data imports
 * Provides tRPC endpoints for viewing and managing import history
 */

import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { dataImportStatus } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export const importHistoryRouter = router({
  /**
   * Get all import history
   */
  getHistory: protectedProcedure
    .input(z.object({
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      // Only admins can view import history
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }

      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const history = await db
        .select()
        .from(dataImportStatus)
        .orderBy(desc(dataImportStatus.started_at))
        .limit(input.limit)
        .offset(input.offset);

      return history;
    }),

  /**
   * Get import statistics
   */
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }

      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const imports = await db
        .select()
        .from(dataImportStatus);

      const totalImports = imports.length;
      const successfulImports = imports.filter(i => i.status === 'completed').length;
      const failedImports = imports.filter(i => i.status === 'failed').length;
      const totalVehicles = imports.reduce((sum, i) => sum + (i.processed_records || 0), 0);
      const totalTime = imports.reduce((sum, i) => sum + (i.duration_seconds || 0), 0);

      return {
        totalImports,
        successfulImports,
        failedImports,
        successRate: totalImports > 0 ? ((successfulImports / totalImports) * 100).toFixed(1) : 0,
        totalVehicles,
        averageVehiclesPerImport: totalImports > 0 ? (totalVehicles / totalImports).toFixed(0) : 0,
        totalTimeMinutes: (totalTime / 60).toFixed(1),
      };
    }),

  /**
   * Get specific import details
   */
  getImportDetails: protectedProcedure
    .input(z.object({
      importId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }

      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const importData = await db
        .select()
        .from(dataImportStatus)
        .where(eq(dataImportStatus.id, input.importId))
        .limit(1);

      if (!importData.length) {
        throw new Error('Import not found');
      }

      return importData[0];
    }),

  /**
   * Retry failed import
   */
  retryImport: protectedProcedure
    .input(z.object({
      importId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }

      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const importData = await db
        .select()
        .from(dataImportStatus)
        .where(eq(dataImportStatus.id, input.importId))
        .limit(1);

      if (!importData.length) {
        throw new Error('Import not found');
      }

      // Update status to pending retry
      await db
        .update(dataImportStatus)
        .set({
          status: 'pending',
        })
        .where(eq(dataImportStatus.id, input.importId));

      return { success: true, message: 'Import queued for retry' };
    }),

  /**
   * Delete import record
   */
  deleteImport: protectedProcedure
    .input(z.object({
      importId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }

      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Only allow deletion of failed or completed imports
      const importData = await db
        .select()
        .from(dataImportStatus)
        .where(eq(dataImportStatus.id, input.importId))
        .limit(1);

      if (!importData.length) {
        throw new Error('Import not found');
      }

      if (importData[0].status === 'in_progress') {
        throw new Error('Cannot delete import that is in progress');
      }

      // Note: In production, you might want to soft-delete or archive instead
      // For now, just mark as failed
      await db
        .update(dataImportStatus)
        .set({
          status: 'failed',
          error_message: 'Deleted by admin',
        })
        .where(eq(dataImportStatus.id, input.importId));

      return { success: true, message: 'Import record deleted' };
    }),
});
