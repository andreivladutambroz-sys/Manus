import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb, getOrCreateProfile, getUserVehicles, getUserDiagnostics, getVehicleById, getDiagnosticById } from "./db";
import { profiles, vehicles, diagnostics } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { analyzeSymptoms, type KimiDiagnosticResponse } from "./kimi";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Profile procedures
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return await getOrCreateProfile(ctx.user.id);
    }),
    update: protectedProcedure
      .input(z.object({
        workshopName: z.string().optional(),
        phone: z.string().optional(),
        city: z.string().optional(),
        specializations: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const profile = await getOrCreateProfile(ctx.user.id);
        if (!profile) throw new Error("Profile not found");

        await db.update(profiles)
          .set(input)
          .where(eq(profiles.id, profile.id));

        return await getOrCreateProfile(ctx.user.id);
      }),
  }),

  // Vehicle procedures
  vehicle: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserVehicles(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        brand: z.string(),
        model: z.string(),
        year: z.number(),
        engine: z.string().optional(),
        engineCode: z.string().optional(),
        mileage: z.number().optional(),
        vin: z.string().optional(),
        licensePlate: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db.insert(vehicles).values({
          userId: ctx.user.id,
          ...input,
        });

        return { success: true };
      }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const vehicle = await getVehicleById(input.id);
        if (!vehicle || vehicle.userId !== ctx.user.id) {
          throw new Error("Vehicle not found");
        }
        return vehicle;
      }),
  }),

  // Diagnostic procedures
  diagnostic: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserDiagnostics(ctx.user.id);
    }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const diagnostic = await getDiagnosticById(input.id);
        if (!diagnostic || diagnostic.userId !== ctx.user.id) {
          throw new Error("Diagnostic not found");
        }
        return diagnostic;
      }),
    create: protectedProcedure
      .input(z.object({
        vehicleId: z.number(),
        symptomsText: z.string().optional(),
        symptomsSelected: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const vehicle = await getVehicleById(input.vehicleId);
        if (!vehicle || vehicle.userId !== ctx.user.id) {
          throw new Error("Vehicle not found");
        }

        await db.insert(diagnostics).values({
          vehicleId: input.vehicleId,
          userId: ctx.user.id,
          symptomsText: input.symptomsText,
          symptomsSelected: input.symptomsSelected || [],
          status: "in_progress",
        });

        return { success: true };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        kimiResponse: z.any().optional(),
        status: z.enum(["in_progress", "completed", "saved"]).optional(),
        pdfUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const diagnostic = await getDiagnosticById(input.id);
        if (!diagnostic || diagnostic.userId !== ctx.user.id) {
          throw new Error("Diagnostic not found");
        }

        await db.update(diagnostics)
          .set({
            kimiResponse: input.kimiResponse,
            status: input.status,
            pdfUrl: input.pdfUrl,
          })
          .where(eq(diagnostics.id, input.id));

        return { success: true };
      }),
  }),

  analyze: router({
    symptoms: protectedProcedure
      .input(z.object({
        diagnosticId: z.number(),
        brand: z.string(),
        model: z.string(),
        year: z.number(),
        engine: z.string().optional(),
        symptomsText: z.string(),
        symptomsSelected: z.array(z.string()),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const diagnostic = await getDiagnosticById(input.diagnosticId);
        if (!diagnostic || diagnostic.userId !== ctx.user.id) {
          throw new Error("Diagnostic not found");
        }

        try {
          const kimiResponse = await analyzeSymptoms(
            input.brand,
            input.model,
            input.year,
            input.engine,
            input.symptomsText,
            input.symptomsSelected
          );

          await db.update(diagnostics)
            .set({
              kimiResponse: kimiResponse as unknown as Record<string, unknown>,
              status: "completed",
            })
            .where(eq(diagnostics.id, input.diagnosticId));

          return kimiResponse;
        } catch (error) {
          console.error("Error analyzing symptoms:", error);
          throw new Error("Failed to analyze symptoms");
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
