import { router, publicProcedure, protectedProcedure } from "../_core/trpc.js";
import { z } from "zod";
import { getWebSocketServer } from "../websocket-server";
import { dataImportStatus } from "../../drizzle/schema";
import { getDb } from "../db";
import { desc } from "drizzle-orm";

/**
 * Import Progress Router
 * Handles real-time progress tracking via WebSocket
 */

export const importProgressRouter = router({
  /**
   * Subscribe to import progress updates
   * Client should connect to WebSocket and send: { type: "subscribe", channel: "import-progress" }
   */
  subscribe: publicProcedure
    .input(
      z.object({
        channel: z.string().default("import-progress"),
      })
    )
    .query(async ({ input }) => {
      const wss = getWebSocketServer();
      if (!wss) {
        return {
          success: false,
          message: "WebSocket server not initialized",
        };
      }

      const state = wss.getState(input.channel);
      return {
        success: true,
        channel: input.channel,
        currentState: state,
        message: "Subscribe to this channel via WebSocket for real-time updates",
      };
    }),

  /**
   * Get current import progress
   */
  getProgress: publicProcedure
    .input(
      z.object({
        channel: z.string().default("import-progress"),
      })
    )
    .query(async ({ input }) => {
      const wss = getWebSocketServer();
      if (!wss) {
        return {
          success: false,
          message: "WebSocket server not initialized",
          progress: null,
        };
      }

      const state = wss.getState(input.channel);
      return {
        success: true,
        channel: input.channel,
        progress: state || {
          type: "idle",
          message: "No import in progress",
          timestamp: Date.now(),
        },
      };
    }),

  /**
   * Get import history from database
   */
  getHistory: publicProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          return {
            success: false,
            message: "Database not available",
            imports: [],
          };
        }
        const imports = await db
          .select()
          .from(dataImportStatus)
          .orderBy(desc(dataImportStatus.started_at))
          .limit(input.limit)
          .offset(input.offset);

        return {
          success: true,
          imports: imports.map((imp: any) => ({
            id: imp.id,
            importType: imp.importType,
            status: imp.status,
            totalBatches: imp.totalBatches,
            completedBatches: imp.completedBatches,
            totalRecords: imp.totalRecords,
            importedRecords: imp.importedRecords,
            failedRecords: imp.failedRecords,
            startedAt: imp.startedAt,
            completedAt: imp.completedAt,
            errorMessage: imp.errorMessage,
          })),
          total: imports.length,
        };
      } catch (error) {
        console.error("Error fetching import history:", error);
        return {
          success: false,
          message: "Failed to fetch import history",
          imports: [],
        };
      }
    }),

  /**
   * Get statistics about imports
   */
  getStats: publicProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) {
        return {
          success: false,
          message: "Database not available",
          stats: null,
        };
      }
      const imports = await db
        .select()
        .from(dataImportStatus)
        .orderBy(desc(dataImportStatus.started_at));

      const stats = {
        totalImports: imports.length,
        successfulImports: imports.filter((i: any) => i.status === "completed" || i.status === "success")
          .length,
        failedImports: imports.filter((i: any) => i.status === "failed").length,
        inProgressImports: imports.filter((i: any) => i.status === "in_progress")
          .length,
        totalRecordsImported: imports.reduce(
          (sum: number, i: any) => sum + (i.importedRecords || 0),
          0
        ),
        totalRecordsFailed: imports.reduce(
          (sum: number, i: any) => sum + (i.failedRecords || 0),
          0
        ),
        successRate:
          imports.length > 0
            ? (
                (imports.filter((i: any) => i.status === "completed").length /
                  imports.length) *
                100
              ).toFixed(2)
            : 0,
      };

      return {
        success: true,
        stats,
      };
    } catch (error) {
      console.error("Error fetching import stats:", error);
      return {
        success: false,
        message: "Failed to fetch import statistics",
        stats: null,
      };
    }
  }),

  /**
   * Admin: Broadcast progress update (for testing)
   */
  broadcastUpdate: protectedProcedure
    .input(
      z.object({
        channel: z.string().default("import-progress"),
        type: z.enum(["progress", "complete", "error", "started"]),
        batchNumber: z.number().optional(),
        totalBatches: z.number().optional(),
        vehiclesImported: z.number().optional(),
        totalVehicles: z.number().optional(),
        percentage: z.number().optional(),
        eta: z.string().optional(),
        message: z.string().optional(),
        error: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Only allow admins
      if (ctx.user?.role !== "admin") {
        return {
          success: false,
          message: "Unauthorized",
        };
      }

      const wss = getWebSocketServer();
      if (!wss) {
        return {
          success: false,
          message: "WebSocket server not initialized",
        };
      }

      const update = {
        type: input.type,
        batchNumber: input.batchNumber,
        totalBatches: input.totalBatches,
        vehiclesImported: input.vehiclesImported,
        totalVehicles: input.totalVehicles,
        percentage: input.percentage,
        eta: input.eta,
        message: input.message,
        error: input.error,
        timestamp: Date.now(),
      };

      wss.broadcastProgress(input.channel, update as any);

      return {
        success: true,
        message: "Update broadcasted",
        subscribedClients: wss.getSubscribedClients(input.channel).length,
      };
    }),

  /**
   * Get WebSocket server status
   */
  getServerStatus: publicProcedure.query(async () => {
    const wss = getWebSocketServer();
    if (!wss) {
      return {
        success: false,
        message: "WebSocket server not initialized",
        status: null,
      };
    }

    return {
      success: true,
      status: {
        connectedClients: wss.getClientCount(),
        subscribedToProgress: wss.getSubscribedClients("import-progress").length,
        serverRunning: true,
      },
    };
  }),
});
