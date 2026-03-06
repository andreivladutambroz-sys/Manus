import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb, getOrCreateProfile, getUserVehicles, getUserDiagnostics, getVehicleById, getDiagnosticById, getUserNotifications, createNotification, markNotificationAsRead, getDiagnosticImages, addDiagnosticImage } from "./db";
import { profiles, vehicles, diagnostics, vehicleMotorizations } from "../drizzle/schema";
import { eq, and, sql, desc, like, or } from "drizzle-orm";
import { z } from "zod";
import { generateDiagnosticPDF } from "./pdf-generator";
import { runDiagnostic, runFallbackDiagnostic, ocrCertificateAgent } from "./diagnostic-orchestrator";
import type { DiagnosticInput, DiagnosticReport } from "./diagnostic-orchestrator";
import { storagePut } from "./storage";
import { submitFeedback, getAccuracyDashboard, getFeedbackForDiagnostic, findSimilarPatterns, optimizePromptForAgent, getActivePromptForAgent } from "./learning-engine";
import { knowledgeDocuments, chatMessages } from "../drizzle/schema";

import { aiRouter } from "./ai-router";
import { collaborationRouter } from "./collaboration-router";
import { automotiveDataRouter } from "./routers/automotive-data";
import { servicesRouter } from "./routers/services";
import { predictiveMaintenanceRouter } from "./routers/predictive-maintenance";
import { vehicleDataRouter } from "./routers/vehicle-data";
import { dataImportRouter } from "./routers/data-import";
import { importHistoryRouter } from "./routers/import-history";
import { knowledgeBaseRouter } from "./routers/knowledge-base";
import { importProgressRouter } from "./routers/import-progress";
import { diagnosticRouter } from "./routers/diagnostic.router";
import { imageUploadRouter } from "./routers/image-upload.router";
import mysql from "mysql2/promise";

export const appRouter = router({
  system: systemRouter,
  ai: aiRouter,
  collaboration: collaborationRouter,
  automotiveData: automotiveDataRouter,
  services: servicesRouter,
  predictiveMaintenance: predictiveMaintenanceRouter,
  vehicleData: vehicleDataRouter,
  dataImport: dataImportRouter,
  importHistory: importHistoryRouter,
  knowledgeBase: knowledgeBaseRouter,
  importProgress: importProgressRouter,
  diagnosticEngine: diagnosticRouter,
  imageUpload: imageUploadRouter,
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
        console.log('[Vehicle.create] Insert result:', JSON.stringify(result));
        console.log('[Vehicle.create] Result type:', typeof result, 'isArray:', Array.isArray(result));
        if (Array.isArray(result)) {
          console.log('[Vehicle.create] Result[0]:', result[0]);
        }
        const vehicleId = Array.isArray(result) && result[0]?.insertId 
          ? result[0].insertId 
          : (result as any)?.insertId || 0;
        console.log('[Vehicle.create] Extracted vehicleId:', vehicleId);
        if (!vehicleId) throw new Error("Failed to create vehicle");
        return { success: true, vehicleId };
      }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const vehicle = await getVehicleById(input.id);
        if (!vehicle || vehicle.userId !== ctx.user.id) throw new Error("Vehicle not found");
        return vehicle;
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        brand: z.string().optional(),
        model: z.string().optional(),
        year: z.number().optional(),
        engine: z.string().optional(),
        engineCode: z.string().optional(),
        mileage: z.number().optional(),
        vin: z.string().optional(),
        licensePlate: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const vehicle = await getVehicleById(input.id);
        if (!vehicle || vehicle.userId !== ctx.user.id) throw new Error("Vehicle not found");
        const { id, ...updateData } = input;
        await db.update(vehicles).set(updateData).where(eq(vehicles.id, id));
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const vehicle = await getVehicleById(input.id);
        if (!vehicle || vehicle.userId !== ctx.user.id) throw new Error("Vehicle not found");
        await db.delete(vehicles).where(eq(vehicles.id, input.id));
        return { success: true };
      }),
  }),

  diagnostic: router({
    search: publicProcedure
      .input(
        z.object({
          query: z.string().min(1).max(100),
          limit: z.number().min(1).max(20).default(10),
          minYear: z.number().optional(),
          maxYear: z.number().optional(),
          engineFilter: z.string().max(50).optional(),
          minConfidence: z.number().min(0).max(1).optional(),
        })
      )
      .query(async ({ input }) => {
        try {
          const connection = await mysql.createConnection(process.env.DATABASE_URL!);
          const trimmedQuery = input.query.trim();
          const searchParam = `%${trimmedQuery}%`;
          
          const query = `
            SELECT 
              id,
              vehicleMake,
              vehicleModel,
              vehicleYear as year,
              engine,
              errorCode,
              symptoms,
              repairAction,
              repairTimeHours,
              repairCostEstimate,
              toolsUsed,
              confidence,
              sourceUrl
            FROM repairCases
            WHERE 
              (errorCode = ? OR vehicleMake LIKE ? OR vehicleModel LIKE ?)
              AND (? IS NULL OR vehicleYear >= ?)
              AND (? IS NULL OR vehicleYear <= ?)
              AND (? IS NULL OR engine LIKE ?)
              AND (? IS NULL OR confidence >= ?)
            LIMIT 20
          `;
          
          const [results] = await connection.query(query, [
            trimmedQuery,
            searchParam,
            searchParam,
            input.minYear || null,
            input.minYear || 0,
            input.maxYear || null,
            input.maxYear || 9999,
            input.engineFilter ? `%${input.engineFilter}%` : null,
            input.engineFilter ? `%${input.engineFilter}%` : null,
            input.minConfidence || null,
            input.minConfidence || 0,
          ]);
          
          await connection.end();
          
          return {
            results: (results as any[]).map(row => ({
              id: row.id,
              vehicleMake: row.vehicleMake,
              vehicleModel: row.vehicleModel,
              year: row.year,
              engine: row.engine,
              errorCode: row.errorCode,
              symptoms: Array.isArray(row.symptoms) ? row.symptoms : (typeof row.symptoms === 'string' ? JSON.parse(row.symptoms) : []),
              repairAction: row.repairAction || '',
              repairTimeHours: row.repairTimeHours ? parseFloat(row.repairTimeHours) : null,
              repairCostEstimate: row.repairCostEstimate ? parseFloat(row.repairCostEstimate) : null,
              toolsUsed: Array.isArray(row.toolsUsed) ? row.toolsUsed : (typeof row.toolsUsed === 'string' ? JSON.parse(row.toolsUsed) : []),
              confidence: row.confidence,
              sourceUrl: row.sourceUrl,
            })),
            count: (results as any[]).length,
          };
        } catch (error: any) {
          console.error('[Search Error]', error.message);
          throw new Error(`Search failed: ${error.message}`);
        }
      }),
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
        return await createNotification(ctx.user.id, input.type, input.title || "",
        input.message || "", input.diagnosticId);
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
