import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb, getOrCreateProfile, getUserVehicles, getUserDiagnostics, getVehicleById, getDiagnosticById, getUserNotifications, createNotification, markNotificationAsRead, getDiagnosticImages, addDiagnosticImage } from "./db";
import { profiles, vehicles, diagnostics } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { analyzeSymptoms, type KimiDiagnosticResponse } from "./kimi";
import { generateDiagnosticPDF } from "./pdf-generator";
import { executeDiagnosticSwarm, formatSwarmResults } from "./kimi-swarm";

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
    swarm: protectedProcedure
      .input(z.object({
        vehicleId: z.number(),
        symptoms: z.string(),
        errorCodes: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const vehicle = await getVehicleById(input.vehicleId);
        if (!vehicle || vehicle.userId !== ctx.user.id) {
          throw new Error("Vehicle not found");
        }

        // Creează diagnostic în baza de date
        const result = await db.insert(diagnostics).values({
          vehicleId: input.vehicleId,
          userId: ctx.user.id,
          symptomsText: input.symptoms,
          symptomsSelected: input.errorCodes || [],
          status: "in_progress",
        });

        const diagnosticId = (result as any).insertId || 0;

        // Execută swarm-ul de agenți
        const swarmResult = await executeDiagnosticSwarm(
          {
            vehicleMarque: vehicle.brand,
            vehicleModel: vehicle.model,
            vehicleYear: vehicle.year,
            vehicleMileage: vehicle.mileage || 0,
            symptoms: input.symptoms,
            errorCodes: input.errorCodes,
          },
          diagnosticId.toString()
        );

        // Salvează rezultatele în baza de date
        const updateData: Record<string, unknown> = {
          kimiResponse: JSON.stringify(swarmResult),
          status: "completed",
        };
        await db.update(diagnostics)
          .set(updateData)
          .where(eq(diagnostics.id, diagnosticId));

        return swarmResult;
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

  export: router({
    pdf: protectedProcedure
      .input(z.object({
        diagnosticId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const diagnostic = await getDiagnosticById(input.diagnosticId);
        if (!diagnostic || diagnostic.userId !== ctx.user.id) {
          throw new Error("Diagnostic not found");
        }

        const vehicle = await getVehicleById(diagnostic.vehicleId);
        if (!vehicle) throw new Error("Vehicle not found");

        try {
          const pdfUrl = await generateDiagnosticPDF({
            diagnosticId: diagnostic.id,
            vehicleBrand: vehicle.brand,
            vehicleModel: vehicle.model,
            vehicleYear: vehicle.year,
            vehicleEngine: vehicle.engine || undefined,
            vehicleMileage: vehicle.mileage || undefined,
            symptomsText: diagnostic.symptomsText || "",
            symptomsSelected: (diagnostic.symptomsSelected as string[]) || [],
            kimiResponse: diagnostic.kimiResponse as any,
            createdAt: diagnostic.createdAt,
            mechanicName: ctx.user.name || undefined,
          });

          await db.update(diagnostics)
            .set({ pdfUrl })
            .where(eq(diagnostics.id, input.diagnosticId));

          return { url: pdfUrl };
        } catch (error) {
          console.error("Error generating PDF:", error);
          throw new Error("Failed to generate PDF");
        }
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

  // Notifications procedures
  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserNotifications(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        type: z.enum(["analysis_complete", "diagnostic_saved", "system_alert"]),
        title: z.string(),
        message: z.string().optional(),
        diagnosticId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await createNotification(
          ctx.user.id,
          input.type,
          input.title,
          input.message,
          input.diagnosticId
        );
      }),
    markAsRead: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ input }) => {
        return await markNotificationAsRead(input.notificationId);
      }),
  }),

  // Image procedures
  images: router({
    list: protectedProcedure
      .input(z.object({ diagnosticId: z.number() }))
      .query(async ({ input }) => {
        return await getDiagnosticImages(input.diagnosticId);
      }),
    add: protectedProcedure
      .input(z.object({
        diagnosticId: z.number(),
        imageUrl: z.string(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await addDiagnosticImage(input.diagnosticId, input.imageUrl, input.description);
      }),
  }),
});

export type AppRouter = typeof appRouter;
