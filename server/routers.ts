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
import { swarmMonitorRouter } from "./routers/swarm-monitor.router";

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
  swarmMonitor: swarmMonitorRouter,
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
    getMotorizations: publicProcedure
      .input(z.object({
        brand: z.string(),
        model: z.string(),
        year: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        
        const year = input.year || new Date().getFullYear();
        const motorizations = await db
          .select()
          .from(vehicleMotorizations)
          .where(
            and(
              eq(vehicleMotorizations.brand, input.brand),
              eq(vehicleMotorizations.model, input.model),
              sql`${vehicleMotorizations.yearFrom} <= ${year} AND ${vehicleMotorizations.yearTo} >= ${year}`
            )
          );
        
        return motorizations;
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

  // Knowledge Base Admin procedures
  knowledge: router({
    listDocuments: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(knowledgeDocuments).orderBy(desc(knowledgeDocuments.createdAt));
    }),
    uploadDocument: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        category: z.enum(["elsa", "etka", "autodata", "workshop_manual", "wiring_diagram", "tsi_bulletin", "other"]),
        brand: z.string().optional(),
        model: z.string().optional(),
        yearFrom: z.number().optional(),
        yearTo: z.number().optional(),
        engineCode: z.string().optional(),
        fileUrl: z.string(),
        fileKey: z.string(),
        fileName: z.string(),
        fileSize: z.number().optional(),
        mimeType: z.string().optional(),
        extractedText: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const result = await db.insert(knowledgeDocuments).values({
          uploadedBy: ctx.user.id,
          ...input,
        });
        return { success: true, id: (result as any)[0]?.insertId || 0 };
      }),
    deleteDocument: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (ctx.user.role !== "admin") throw new Error("Admin only");
        await db.delete(knowledgeDocuments).where(eq(knowledgeDocuments.id, input.id));
        return { success: true };
      }),
    searchDocuments: protectedProcedure
      .input(z.object({
        query: z.string().optional(),
        brand: z.string().optional(),
        category: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const conditions = [];
        if (input.query) {
          conditions.push(
            or(
              like(knowledgeDocuments.title, `%${input.query}%`),
              like(knowledgeDocuments.extractedText, `%${input.query}%`)
            )
          );
        }
        if (input.brand) conditions.push(eq(knowledgeDocuments.brand, input.brand));
        if (conditions.length > 0) {
          return await db.select().from(knowledgeDocuments).where(and(...conditions)).orderBy(desc(knowledgeDocuments.createdAt));
        }
        return await db.select().from(knowledgeDocuments).orderBy(desc(knowledgeDocuments.createdAt));
      }),
  }),

  // Chat Messages procedures
  chat: router({
    loadMessages: protectedProcedure
      .input(z.object({ chatId: z.string() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return [];
        const messages = await db.select().from(chatMessages)
          .where(and(eq(chatMessages.chatId, input.chatId), eq(chatMessages.userId, ctx.user.id)))
          .orderBy(chatMessages.ordering);
        return messages.map(m => m.content);
      }),
    saveMessage: protectedProcedure
      .input(z.object({
        chatId: z.string(),
        messageId: z.string(),
        diagnosticId: z.number().optional(),
        content: z.any(),
        ordering: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.insert(chatMessages).values({
          id: input.messageId,
          chatId: input.chatId,
          diagnosticId: input.diagnosticId,
          userId: ctx.user.id,
          content: input.content,
          ordering: input.ordering,
        }).onDuplicateKeyUpdate({ set: { content: input.content } });
        return { success: true };
      }),
  }),

  // Learning Engine procedures
  learning: router({
    // Submit feedback for a diagnostic
    submitFeedback: protectedProcedure
      .input(z.object({
        diagnosticId: z.number(),
        overallRating: z.number().min(1).max(5),
        accuracyRating: z.number().min(1).max(5),
        usefulnessRating: z.number().min(1).max(5),
        causesFeedback: z.array(z.object({
          causeId: z.string(),
          cause: z.string(),
          rating: z.enum(["correct", "partially_correct", "incorrect"]),
          mechanicComment: z.string().optional(),
        })).optional(),
        actualCause: z.string().optional(),
        actualParts: z.array(z.string()).optional(),
        actualCost: z.number().optional(),
        actualTime: z.string().optional(),
        mechanicNotes: z.string().optional(),
        wasResolved: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await submitFeedback({
          ...input,
          userId: ctx.user.id,
        });
      }),

    // Get feedback for a specific diagnostic
    getFeedback: protectedProcedure
      .input(z.object({ diagnosticId: z.number() }))
      .query(async ({ input }) => {
        return await getFeedbackForDiagnostic(input.diagnosticId);
      }),

    // Get accuracy dashboard
    accuracyDashboard: protectedProcedure
      .query(async () => {
        return await getAccuracyDashboard();
      }),

    // Find similar patterns for a new diagnostic
    findPatterns: protectedProcedure
      .input(z.object({
        brand: z.string(),
        symptoms: z.string(),
        errorCodes: z.array(z.string()).optional(),
      }))
      .query(async ({ input }) => {
        return await findSimilarPatterns(input.brand, input.symptoms, input.errorCodes);
      }),

    // Optimize prompt for an agent (admin only)
    optimizePrompt: protectedProcedure
      .input(z.object({ agentName: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Admin only");
        return await optimizePromptForAgent(input.agentName);
      }),

    // Get active prompt for an agent
    getActivePrompt: protectedProcedure
      .input(z.object({
        agentName: z.string(),
        vehicleBrand: z.string().optional(),
        symptoms: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return await getActivePromptForAgent(input.agentName, input.vehicleBrand, input.symptoms);
      }),
  }),
});

export type AppRouter = typeof appRouter;
