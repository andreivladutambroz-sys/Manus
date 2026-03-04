import { router, publicProcedure, protectedProcedure } from './_core/trpc';
import { z } from 'zod';
import { wsManager } from './websocket';

export const collaborationRouter = router({
  /**
   * Get active collaboration sessions
   */
  getActiveSessions: protectedProcedure.query(async () => {
    const sessions = wsManager.getAllSessions();
    return {
      sessions,
      totalSessions: sessions.length,
      totalUsers: sessions.reduce((sum, s) => sum + s.userCount, 0),
    };
  }),

  /**
   * Get session info for a diagnostic
   */
  getSessionInfo: protectedProcedure
    .input(z.object({ diagnosticId: z.string() }))
    .query(async ({ input }: any) => {
      const sessionInfo = wsManager.getSessionInfo(input.diagnosticId);
      if (!sessionInfo) {
        return {
          sessionId: null,
          users: [],
          userCount: 0,
        };
      }
      return sessionInfo;
    }),

  /**
   * Get collaboration statistics
   */
  getStats: protectedProcedure.query(async () => {
    const sessions = wsManager.getAllSessions();
    const totalUsers = sessions.reduce((sum, s) => sum + s.userCount, 0);
    const avgUsersPerSession =
      sessions.length > 0 ? Math.round((totalUsers / sessions.length) * 10) / 10 : 0;

    return {
      totalSessions: sessions.length,
      totalUsers,
      avgUsersPerSession,
      activeSessions: sessions.map((s) => ({
        diagnosticId: s.diagnosticId,
        userCount: s.userCount,
        duration: Math.round((Date.now() - s.createdAt.getTime()) / 1000),
      })),
    };
  }),

  /**
   * Record collaboration event (for analytics)
   */
  recordEvent: protectedProcedure
    .input(
      z.object({
        diagnosticId: z.string(),
        eventType: z.enum([
          'user-joined',
          'user-left',
          'field-edited',
          'comment-added',
          'sync-request',
        ]),
        fieldName: z.string().optional(),
        duration: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }: any) => {
      // Log collaboration event for analytics
      console.log(`[Collaboration] ${input.eventType} on ${input.diagnosticId}`, {
        userId: ctx.user.id,
        fieldName: input.fieldName,
        duration: input.duration,
      });

      return {
        success: true,
        timestamp: new Date(),
      };
    }),

  /**
   * Get collaboration history for a diagnostic
   */
  getHistory: protectedProcedure
    .input(z.object({ diagnosticId: z.string(), limit: z.number().default(50) }))
    .query(async ({ input }: any) => {
      // This would query from database in production
      // For now, return empty history
      return {
        diagnosticId: input.diagnosticId,
        events: [],
        total: 0,
      };
    }),
});
