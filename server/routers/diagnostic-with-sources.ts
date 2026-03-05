/**
 * Enhanced Diagnostic Router with Source Tracing
 * Tracks all sources used in diagnostic analysis
 */

import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { analyzeSymptoms } from "../kimi";
import {
  trackKimiResponse,
  trackOEMSource,
  trackPartsAPISource,
  trackUserInput,
  createSourcedResult,
  formatSourcesForDisplay,
  validateDiagnosticSources,
  exportSourcesAsJSON,
  logDiagnosticSources,
} from "../services/diagnostic-sources";
import {
  getCachedPartsPricing,
  formatPricingResult,
} from "../services/parts-pricing";

export const diagnosticWithSourcesRouter = router({
  /**
   * Analyze symptoms with full source tracing
   */
  analyzeWithSources: protectedProcedure
    .input(
      z.object({
        brand: z.string(),
        model: z.string(),
        year: z.number(),
        engine: z.string().optional(),
        symptomsText: z.string(),
        symptomsSelected: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      const sources = [];

      // Track user input
      sources.push(trackUserInput("Vehicle", `${input.brand} ${input.model} (${input.year})`));
      sources.push(trackUserInput("Symptoms", input.symptomsText));
      sources.push(trackUserInput("Selected Symptoms", input.symptomsSelected.join(", ")));

      // Track OEM source
      sources.push(
        trackOEMSource(input.brand, input.model, input.year, "Vehicle specifications")
      );

      try {
        // Get Kimi analysis
        const kimiResponse = await analyzeSymptoms(
          input.brand,
          input.model,
          input.year,
          input.engine,
          input.symptomsText,
          input.symptomsSelected
        );

        // Track Kimi response
        const kimiSource = await trackKimiResponse(
          `Diagnose ${input.brand} ${input.model} symptoms`,
          JSON.stringify(kimiResponse),
          "kimi-latest"
        );
        sources.push(kimiSource);

        // Create sourced result
        const diagnosis = kimiResponse.recommendation || "Diagnostic analysis completed";
        const result = createSourcedResult(diagnosis, sources);

        // Validate sources
        const validation = validateDiagnosticSources(result);

        // Log for audit trail
        logDiagnosticSources("diagnostic-analyze", result);

        return {
          diagnosis: kimiResponse,
          sources: exportSourcesAsJSON(result),
          trustScore: result.trustScore,
          validation,
          formattedSources: formatSourcesForDisplay(result),
        };
      } catch (error) {
        console.error("Diagnostic analysis error:", error);

        const result = createSourcedResult(
          "Diagnostic analysis failed",
          sources
        );

        return {
          diagnosis: null,
          sources: exportSourcesAsJSON(result),
          trustScore: result.trustScore,
          error: error instanceof Error ? error.message : "Unknown error",
          formattedSources: formatSourcesForDisplay(result),
        };
      }
    }),

  /**
   * Get parts pricing with source tracing
   */
  getPartsPricingWithSources: protectedProcedure
    .input(
      z.object({
        brand: z.string(),
        model: z.string(),
        year: z.number(),
        partName: z.string(),
        oemCode: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const sources = [];

      // Track user input
      sources.push(trackUserInput("Vehicle", `${input.brand} ${input.model} (${input.year})`));
      sources.push(trackUserInput("Part", input.partName));

      try {
        // Get pricing from all sources
        const pricingResult = await getCachedPartsPricing(
          input.brand,
          input.model,
          input.year,
          input.partName,
          input.oemCode
        );

        // Track each pricing source
        pricingResult.sources.forEach((source) => {
          sources.push(
            trackPartsAPISource(
              source.name,
              input.partName,
              source.price,
              source.availability
            )
          );
        });

        // Create sourced result
        const result = createSourcedResult(
          `${input.partName} pricing from verified sources`,
          sources
        );

        // Log for audit trail
        logDiagnosticSources("parts-pricing", result);

        return {
          pricing: pricingResult,
          sources: exportSourcesAsJSON(result),
          trustScore: result.trustScore,
          formattedSources: formatSourcesForDisplay(result),
          formattedPricing: formatPricingResult(pricingResult),
        };
      } catch (error) {
        console.error("Parts pricing error:", error);

        const result = createSourcedResult(
          "Parts pricing lookup failed",
          sources
        );

        return {
          pricing: null,
          sources: exportSourcesAsJSON(result),
          trustScore: result.trustScore,
          error: error instanceof Error ? error.message : "Unknown error",
          formattedSources: formatSourcesForDisplay(result),
        };
      }
    }),

  /**
   * Get comprehensive diagnostic with parts and sources
   */
  getComprehensiveDiagnostic: protectedProcedure
    .input(
      z.object({
        brand: z.string(),
        model: z.string(),
        year: z.number(),
        engine: z.string().optional(),
        symptomsText: z.string(),
        symptomsSelected: z.array(z.string()),
        parts: z.array(z.object({ name: z.string(), oemCode: z.string().optional() })).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const sources = [];

      // Track user input
      sources.push(trackUserInput("Vehicle", `${input.brand} ${input.model} (${input.year})`));
      sources.push(trackUserInput("Symptoms", input.symptomsText));

      // Track OEM source
      sources.push(
        trackOEMSource(input.brand, input.model, input.year, "Vehicle specifications")
      );

      try {
        // Get Kimi analysis
        const kimiResponse = await analyzeSymptoms(
          input.brand,
          input.model,
          input.year,
          input.engine,
          input.symptomsText,
          input.symptomsSelected
        );

        // Track Kimi response
        const kimiSource = await trackKimiResponse(
          `Comprehensive diagnostic for ${input.brand} ${input.model}`,
          JSON.stringify(kimiResponse),
          "kimi-latest"
        );
        sources.push(kimiSource);

        // Get parts pricing if requested
        let partsPricing = [];
        if (input.parts && input.parts.length > 0) {
          for (const part of input.parts) {
            const pricing = await getCachedPartsPricing(
              input.brand,
              input.model,
              input.year,
              part.name,
              part.oemCode
            );
            partsPricing.push(pricing);

            // Track pricing sources
            pricing.sources.forEach((source) => {
              sources.push(
                trackPartsAPISource(source.name, part.name, source.price, source.availability)
              );
            });
          }
        }

        // Create sourced result
        const diagnosis = kimiResponse.recommendation || "Diagnostic analysis completed";
        const result = createSourcedResult(diagnosis, sources);

        // Validate sources
        const validation = validateDiagnosticSources(result);

        // Log for audit trail
        logDiagnosticSources("comprehensive-diagnostic", result);

        return {
          diagnosis: kimiResponse,
          partsPricing,
          sources: exportSourcesAsJSON(result),
          trustScore: result.trustScore,
          validation,
          formattedSources: formatSourcesForDisplay(result),
          summary: {
            totalSources: result.sourcesSummary.totalSources,
            verifiedSources: result.sourcesSummary.verifiedSources,
            averageConfidence: result.sourcesSummary.averageConfidence,
          },
        };
      } catch (error) {
        console.error("Comprehensive diagnostic error:", error);

        const result = createSourcedResult(
          "Comprehensive diagnostic failed",
          sources
        );

        return {
          diagnosis: null,
          partsPricing: [],
          sources: exportSourcesAsJSON(result),
          trustScore: result.trustScore,
          error: error instanceof Error ? error.message : "Unknown error",
          formattedSources: formatSourcesForDisplay(result),
        };
      }
    }),

  /**
   * Get diagnostic sources audit trail
   */
  getDiagnosticAuditTrail: protectedProcedure
    .input(z.object({ diagnosticId: z.string() }))
    .query(async ({ input }) => {
      // This would typically fetch from database
      // For now, return a template
      return {
        diagnosticId: input.diagnosticId,
        timestamp: new Date(),
        message: "Audit trail for diagnostic sources",
        sources: [],
      };
    }),
});
