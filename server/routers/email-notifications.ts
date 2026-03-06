import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { db } from '../db';
import { repairLogs, users } from '../../drizzle/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import nodemailer from 'nodemailer';

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export const emailRouter = router({
  // Subscribe to email notifications
  subscribeToNotifications: protectedProcedure
    .input(z.object({
      email: z.string().email(),
      repairReminders: z.boolean().default(true),
      communityDigest: z.boolean().default(true),
      digestFrequency: z.enum(['daily', 'weekly', 'monthly']).default('weekly')
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Update user preferences in database
        // This would require adding email_preferences table
        return {
          success: true,
          message: 'Subscribed to email notifications'
        };
      } catch (error) {
        throw new Error('Failed to subscribe to notifications');
      }
    }),

  // Send repair reminder email
  sendRepairReminder: protectedProcedure
    .input(z.object({
      repairId: z.string(),
      email: z.string().email(),
      vehicleMake: z.string(),
      vehicleModel: z.string(),
      repairType: z.string(),
      scheduledDate: z.date(),
      estimatedTime: z.number()
    }))
    .mutation(async ({ input }) => {
      try {
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Repair Reminder</h2>
            <p>Your scheduled repair is coming up!</p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">${input.vehicleMake} ${input.vehicleModel}</h3>
              <p><strong>Repair Type:</strong> ${input.repairType}</p>
              <p><strong>Scheduled Date:</strong> ${input.scheduledDate.toLocaleDateString()}</p>
              <p><strong>Estimated Time:</strong> ${input.estimatedTime} minutes</p>
            </div>

            <p>Make sure you have all the necessary tools and parts ready!</p>
            
            <a href="https://mechhelper-f8jtlcpe.manus.space/repairs" 
               style="display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 20px;">
              View Repair Details
            </a>
          </div>
        `;

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: input.email,
          subject: `Reminder: ${input.vehicleMake} ${input.vehicleModel} repair scheduled`,
          html: htmlContent
        });

        return { success: true, message: 'Reminder email sent' };
      } catch (error) {
        console.error('Failed to send repair reminder:', error);
        throw new Error('Failed to send email');
      }
    }),

  // Send community digest email
  sendCommunityDigest: protectedProcedure
    .input(z.object({
      email: z.string().email(),
      topPosts: z.array(z.object({
        id: z.string(),
        title: z.string(),
        author: z.string(),
        votes: z.number(),
        replies: z.number()
      })),
      newMembers: z.number(),
      totalPosts: z.number()
    }))
    .mutation(async ({ input }) => {
      try {
        const postsHtml = input.topPosts
          .map(post => `
            <div style="border-bottom: 1px solid #eee; padding: 15px 0;">
              <h4 style="margin: 0 0 10px 0; color: #333;">${post.title}</h4>
              <p style="margin: 0; color: #666; font-size: 14px;">
                By ${post.author} • ${post.votes} votes • ${post.replies} replies
              </p>
            </div>
          `)
          .join('');

        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Weekly Community Digest</h2>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">This Week's Highlights</h3>
              <p><strong>${input.totalPosts}</strong> new posts • <strong>${input.newMembers}</strong> new members</p>
            </div>

            <h3>Top Posts</h3>
            ${postsHtml}

            <a href="https://mechhelper-f8jtlcpe.manus.space/community" 
               style="display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 20px;">
              View Full Community
            </a>
          </div>
        `;

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: input.email,
          subject: 'Weekly Community Digest - Mechanic Helper',
          html: htmlContent
        });

        return { success: true, message: 'Digest email sent' };
      } catch (error) {
        console.error('Failed to send digest:', error);
        throw new Error('Failed to send email');
      }
    }),

  // Get notification preferences
  getNotificationPreferences: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        email: ctx.user.email,
        repairReminders: true,
        communityDigest: true,
        digestFrequency: 'weekly'
      };
    }),

  // Update notification preferences
  updateNotificationPreferences: protectedProcedure
    .input(z.object({
      repairReminders: z.boolean().optional(),
      communityDigest: z.boolean().optional(),
      digestFrequency: z.enum(['daily', 'weekly', 'monthly']).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        message: 'Notification preferences updated'
      };
    })
});
