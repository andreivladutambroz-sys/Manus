import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { db } from '../db';
import { users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

export const mechanicRatesRouter = router({
  // Set hourly rate for current mechanic
  setHourlyRate: protectedProcedure
    .input(z.object({
      hourlyRate: z.number().min(15).max(500),
      currency: z.string().default('USD'),
      description: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        if (!ctx.user?.id) {
          throw new Error('User not authenticated');
        }

        // Update user's hourly rate
        const updated = await db
          .update(users)
          .set({
            hourly_rate: input.hourlyRate,
            currency: input.currency,
            rate_updated_at: new Date()
          })
          .where(eq(users.id, ctx.user.id))
          .returning();

        return {
          success: true,
          hourlyRate: input.hourlyRate,
          currency: input.currency,
          message: `Hourly rate updated to ${input.currency} ${input.hourlyRate}/hour`
        };
      } catch (error) {
        throw new Error(`Failed to set hourly rate: ${error}`);
      }
    }),

  // Get current mechanic's hourly rate
  getMyRate: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        if (!ctx.user?.id) {
          throw new Error('User not authenticated');
        }

        const user = await db.query.users.findFirst({
          where: eq(users.id, ctx.user.id)
        });

        return {
          hourlyRate: user?.hourly_rate || 50,
          currency: user?.currency || 'USD',
          lastUpdated: user?.rate_updated_at || new Date()
        };
      } catch (error) {
        throw new Error(`Failed to get hourly rate: ${error}`);
      }
    }),

  // Calculate repair cost based on mechanic's rate
  calculateRepairCost: protectedProcedure
    .input(z.object({
      estimatedHours: z.number().min(0.25),
      partsPrice: z.number().min(0).default(0),
      markupPercentage: z.number().min(0).max(100).default(20)
    }))
    .query(async ({ input, ctx }) => {
      try {
        if (!ctx.user?.id) {
          throw new Error('User not authenticated');
        }

        const user = await db.query.users.findFirst({
          where: eq(users.id, ctx.user.id)
        });

        const hourlyRate = user?.hourly_rate || 50;
        const currency = user?.currency || 'USD';

        const laborCost = hourlyRate * input.estimatedHours;
        const partsMarkup = input.partsPrice * (input.markupPercentage / 100);
        const totalCost = laborCost + input.partsPrice + partsMarkup;

        return {
          hourlyRate,
          currency,
          estimatedHours: input.estimatedHours,
          laborCost: Math.round(laborCost * 100) / 100,
          partsPrice: input.partsPrice,
          partsMarkup: Math.round(partsMarkup * 100) / 100,
          totalCost: Math.round(totalCost * 100) / 100,
          breakdown: {
            labor: `${currency} ${Math.round(laborCost * 100) / 100}`,
            parts: `${currency} ${input.partsPrice}`,
            markup: `${currency} ${Math.round(partsMarkup * 100) / 100}`,
            total: `${currency} ${Math.round(totalCost * 100) / 100}`
          }
        };
      } catch (error) {
        throw new Error(`Failed to calculate repair cost: ${error}`);
      }
    }),

  // Get all mechanics' rates (for admin/shop manager)
  getAllMechanicsRates: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        // Only allow shop managers/admins to view all rates
        if (ctx.user?.role !== 'admin') {
          throw new Error('Unauthorized: Only admins can view all mechanics rates');
        }

        const mechanics = await db.query.users.findMany({
          where: eq(users.role, 'user')
        });

        return mechanics.map(m => ({
          id: m.id,
          name: m.name,
          hourlyRate: m.hourly_rate || 50,
          currency: m.currency || 'USD',
          lastUpdated: m.rate_updated_at
        }));
      } catch (error) {
        throw new Error(`Failed to get mechanics rates: ${error}`);
      }
    }),

  // Update mechanic's rate (admin only)
  updateMechanicRate: protectedProcedure
    .input(z.object({
      mechanicId: z.string(),
      hourlyRate: z.number().min(15).max(500),
      currency: z.string().default('USD')
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        if (ctx.user?.role !== 'admin') {
          throw new Error('Unauthorized: Only admins can update mechanic rates');
        }

        const updated = await db
          .update(users)
          .set({
            hourly_rate: input.hourlyRate,
            currency: input.currency,
            rate_updated_at: new Date()
          })
          .where(eq(users.id, input.mechanicId))
          .returning();

        return {
          success: true,
          message: `Mechanic rate updated to ${input.currency} ${input.hourlyRate}/hour`
        };
      } catch (error) {
        throw new Error(`Failed to update mechanic rate: ${error}`);
      }
    })
});
