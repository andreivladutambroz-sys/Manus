import { protectedProcedure, publicProcedure, router } from './_core/trpc';
import { z } from 'zod';
import { generateDiagnosticSuggestions, getCachedSuggestions } from './ai/diagnosticSuggestions';
import { generateMaintenanceSchedule, getCachedMaintenanceSchedule, getMaintenanceByMileage } from './ai/predictiveMaintenance';
import { generateDiagnosticReport, generateAndUploadReport, REPORT_TEMPLATES } from './ai/automatedReports';
import { generateChatbotResponse, createChatSession, getChatSession, addMessageToSession, DEFAULT_FAQS } from './ai/clientChatbot';

export const aiRouter = router({
  // Diagnostic Suggestions
  suggestions: protectedProcedure
    .input(z.object({
      symptoms: z.array(z.string()),
      brand: z.string(),
      model: z.string(),
      year: z.number(),
      mileage: z.number(),
      category: z.string(),
      errorCodes: z.array(z.string()),
      useCache: z.boolean().optional(),
    }))
    .query(async ({ input }) => {
      if (input.useCache) {
        return await getCachedSuggestions(input);
      }
      return await generateDiagnosticSuggestions(input);
    }),

  // Predictive Maintenance
  maintenance: protectedProcedure
    .input(z.object({
      brand: z.string(),
      model: z.string(),
      year: z.number(),
      mileage: z.number(),
      fuelType: z.string(),
      transmissionType: z.string(),
      driveType: z.string(),
      useCache: z.boolean().optional(),
    }))
    .query(async ({ input }: any) => {
      if (input.useCache) {
        return await getCachedMaintenanceSchedule(input);
      }
      return await generateMaintenanceSchedule(input);
    }),

  // Get overdue maintenance
  overdueServices: protectedProcedure
    .input(z.object({
      brand: z.string(),
      model: z.string(),
      year: z.number(),
      mileage: z.number(),
      fuelType: z.string(),
      transmissionType: z.string(),
      driveType: z.string(),
    }))
    .query(async ({ input }: any) => {
      const schedule = await generateMaintenanceSchedule(input);
      return getMaintenanceByMileage(input.mileage, schedule);
    }),

  // Automated Report Generation
  generateReport: protectedProcedure
    .input(z.object({
      diagnosticId: z.number(),
      vehicleInfo: z.object({
        brand: z.string(),
        model: z.string(),
        year: z.number(),
        mileage: z.number(),
        vin: z.string().optional(),
        licensePlate: z.string().optional(),
      }),
      symptoms: z.array(z.string()),
      errorCodes: z.array(z.string()),
      findings: z.array(z.object({
        cause: z.string(),
        confidence: z.number(),
        description: z.string(),
      })),
      recommendations: z.array(z.string()),
      estimatedCost: z.object({
        min: z.number(),
        max: z.number(),
        currency: z.string(),
      }),
      repairProcedure: z.array(z.string()),
      partsNeeded: z.array(z.object({
        name: z.string(),
        oemCode: z.string(),
        price: z.number(),
      })),
      mechanicName: z.string(),
      workshopName: z.string(),
      templateId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }: any) => {
      const template = REPORT_TEMPLATES[input.templateId || 'default_en'];
      const report = {
        diagnosticId: input.diagnosticId.toString(),
        vehicleInfo: input.vehicleInfo,
        symptoms: input.symptoms,
        errorCodes: input.errorCodes,
        findings: input.findings,
        recommendations: input.recommendations,
        estimatedCost: input.estimatedCost,
        repairProcedure: input.repairProcedure,
        partsNeeded: input.partsNeeded,
        generatedAt: new Date(),
        mechanicName: input.mechanicName,
        workshopName: input.workshopName,
      };
      return await generateAndUploadReport(report, template);
    }),

  // Client Chatbot
  chat: publicProcedure
    .input(z.object({
      sessionId: z.string().optional(),
      message: z.string(),
      diagnosticContext: z.object({
        brand: z.string(),
        model: z.string(),
        issue: z.string(),
      }).optional(),
    }))
    .mutation(async ({ input }: any) => {
      let session = input.sessionId ? getChatSession(input.sessionId) : null;
      if (!session) {
        session = createChatSession('public', undefined);
      }

      const response = await generateChatbotResponse(
        input.message,
        session.messages,
        DEFAULT_FAQS,
        input.diagnosticContext
      );

      addMessageToSession(session.id, {
        id: `msg_${Date.now()}`,
        role: 'user',
        content: input.message,
        timestamp: new Date(),
      });

      addMessageToSession(session.id, {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        metadata: { confidence: response.confidence },
      });

      return {
        sessionId: session.id,
        response: response.response,
        shouldEscalate: response.shouldEscalate,
        confidence: response.confidence,
      };
    }),
});
