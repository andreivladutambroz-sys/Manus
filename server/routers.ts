import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb, getOrCreateProfile, getUserVehicles, getUserDiagnostics, getVehicleById, getDiagnosticById, getUserNotifications, createNotification, markNotificationAsRead, getDiagnosticImages, addDiagnosticImage } from "./db";
import { profiles, vehicles, diagnostics } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { generateDiagnosticPDF } from "./pdf-generator";
import { runDiagnostic, runFallbackDiagnostic, ocrCertificateAgent } from "./diagnostic-orchestrator";
import type { DiagnosticInput, DiagnosticReport } from "./diagnostic-orchestrator";
import { storagePut } from "./storage";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
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
        await db.update(profiles).set(input).where(eq(profiles.id, profile.id));
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
        const result = await db.insert(vehicles).values({ userId: ctx.user.id, ...input });
        const vehicleId = (result as any)[0]?.insertId || (result as any).insertId || 0;
        return { success: true, vehicleId };
      }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const vehicle = await getVehicleById(input.id);
        if (!vehicle || vehicle.userId !== ctx.user.id) throw new Error("Vehicle not found");
        return vehicle;
      }),
  }),

  // OCR - Extragere date din certificat auto
  ocr: router({
    certificate: protectedProcedure
      .input(z.object({ imageUrl: z.string() }))
      .mutation(async ({ input }) => {
        try {
          const vehicleData = await ocrCertificateAgent(input.imageUrl);
          return { success: true, data: vehicleData };
        } catch (error) {
          console.error("OCR error:", error);
          return { success: false, data: {}, error: "Failed to extract data from certificate" };
        }
      }),
  }),

  // Upload images
  upload: router({
    image: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileBase64: z.string(),
        contentType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const suffix = Math.random().toString(36).substring(2, 10);
        const key = `${ctx.user.id}-uploads/${Date.now()}-${suffix}-${input.fileName}`;
        const buffer = Buffer.from(input.fileBase64, "base64");
        const { url } = await storagePut(key, buffer, input.contentType);
        return { url };
      }),
  }),

  // Diagnostic procedures - ENHANCED v2
  diagnostic: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserDiagnostics(ctx.user.id);
    }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const diagnostic = await getDiagnosticById(input.id);
        if (!diagnostic || diagnostic.userId !== ctx.user.id) throw new Error("Diagnostic not found");
        return diagnostic;
      }),

    // V2: Full orchestrated diagnostic with multi-agent swarm
    runOrchestrated: protectedProcedure
      .input(z.object({
        vehicleId: z.number(),
        symptoms: z.string(),
        errorCodes: z.array(z.string()).optional(),
        conditions: z.array(z.string()).optional(),
        category: z.string().optional(),
        additionalNotes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const vehicle = await getVehicleById(input.vehicleId);
        if (!vehicle || vehicle.userId !== ctx.user.id) throw new Error("Vehicle not found");

        // Create diagnostic record
        const result = await db.insert(diagnostics).values({
          vehicleId: input.vehicleId,
          userId: ctx.user.id,
          symptomsText: input.symptoms,
          symptomsSelected: input.errorCodes || [],
          status: "in_progress",
        });
        const diagnosticId = (result as any)[0]?.insertId || (result as any).insertId || 0;

        // Build orchestrator input
        const diagnosticInput: DiagnosticInput = {
          vehicle: {
            vin: vehicle.vin || undefined,
            brand: vehicle.brand,
            model: vehicle.model,
            year: vehicle.year,
            engine: vehicle.engine || undefined,
            engineCode: vehicle.engineCode || undefined,
            mileage: vehicle.mileage || undefined,
          },
          symptoms: input.symptoms,
          errorCodes: input.errorCodes,
          conditions: input.conditions,
          category: input.category,
          additionalNotes: input.additionalNotes,
        };

        let report: DiagnosticReport;
        try {
          // Try full orchestrated diagnostic
          report = await runDiagnostic(diagnosticInput);
        } catch (error) {
          console.error("Swarm failed, falling back:", error);
          try {
            // Fallback to single-agent
            report = await runFallbackDiagnostic(diagnosticInput);
          } catch (fallbackError) {
            console.error("Fallback also failed:", fallbackError);
            throw new Error("Diagnostic analysis failed");
          }
        }

        // Save results to database
        await db.update(diagnostics)
          .set({
            kimiResponse: report as unknown as Record<string, unknown>,
            status: "completed",
          })
          .where(eq(diagnostics.id, diagnosticId));

        // Create notification
        await createNotification(
          ctx.user.id,
          "analysis_complete",
          `Diagnostic finalizat: ${vehicle.brand} ${vehicle.model}`,
          `Acuratețe: ${report.validation.overallAccuracy}% | ${report.probableCauses.length} cauze identificate`,
          diagnosticId
        );

        return { diagnosticId, report };
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
        if (!vehicle || vehicle.userId !== ctx.user.id) throw new Error("Vehicle not found");
        const result = await db.insert(diagnostics).values({
          vehicleId: input.vehicleId,
          userId: ctx.user.id,
          symptomsText: input.symptomsText,
          symptomsSelected: input.symptomsSelected || [],
          status: "in_progress",
        });
        const diagnosticId = (result as any)[0]?.insertId || (result as any).insertId || 0;
        return { success: true, diagnosticId };
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
        if (!diagnostic || diagnostic.userId !== ctx.user.id) throw new Error("Diagnostic not found");
        await db.update(diagnostics)
          .set({ kimiResponse: input.kimiResponse, status: input.status, pdfUrl: input.pdfUrl })
          .where(eq(diagnostics.id, input.id));
        return { success: true };
      }),
  }),

  export: router({
    pdf: protectedProcedure
      .input(z.object({ diagnosticId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const diagnostic = await getDiagnosticById(input.diagnosticId);
        if (!diagnostic || diagnostic.userId !== ctx.user.id) throw new Error("Diagnostic not found");
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
          await db.update(diagnostics).set({ pdfUrl }).where(eq(diagnostics.id, input.diagnosticId));
          return { url: pdfUrl };
        } catch (error) {
          console.error("Error generating PDF:", error);
          throw new Error("Failed to generate PDF");
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
        return await createNotification(ctx.user.id, input.type, input.title, input.message, input.diagnosticId);
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
