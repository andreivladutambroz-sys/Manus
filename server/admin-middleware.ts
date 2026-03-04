import { TRPCError } from '@trpc/server';
import { protectedProcedure } from './_core/trpc';

/**
 * Admin-only procedure wrapper
 * Ensures only users with admin role can access certain endpoints
 */
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  // Check if user exists and has admin role
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }

  if (ctx.user.role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have permission to access this resource. Admin access required.',
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

/**
 * Middleware to check admin status
 */
export async function checkAdminAccess(userId: string, userRole?: string) {
  if (userRole !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required',
    });
  }
  return true;
}
