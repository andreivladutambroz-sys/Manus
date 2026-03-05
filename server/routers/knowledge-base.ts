import { router, publicProcedure, protectedProcedure } from "../_core/trpc.js";
import { z } from "zod";
import fs from "fs";
import path from "path";

/**
 * Knowledge Base Integration Router
 * Integrates Kimi Swarm results with vehicle database
 */

// Load knowledge base results
function loadKnowledgeBase() {
  try {
    const kbPath = path.join(
      process.cwd(),
      "knowledge-base/swarm-100-agents-results.json"
    );
    if (fs.existsSync(kbPath)) {
      const content = fs.readFileSync(kbPath, "utf-8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("Failed to load knowledge base:", error);
  }
  return null;
}

export const knowledgeBaseRouter = router({
  /**
   * Get vehicle specifications from knowledge base
   */
  getVehicleSpecs: publicProcedure
    .input(
      z.object({
        make: z.string(),
        model: z.string(),
        year: z.number().optional(),
      })
    )
    .query(async ({ input: { make, model, year } }: any) => {
      const kb = loadKnowledgeBase();
      if (!kb) {
        return {
          success: false,
          message: "Knowledge base not available",
          specs: [],
        };
      }

      // Extract specs from knowledge base
      const specs = [];

      // Search through extracted facts
      if (kb.content_extracted && Array.isArray(kb.content_extracted)) {
        for (const extraction of kb.content_extracted) {
          if (extraction.result) {
            // Parse JSONL results
            const lines = extraction.result.split("\n");
            for (const line of lines) {
              if (line.trim()) {
                try {
                  const fact = JSON.parse(line);
                  if (
                    fact.vehicle?.make?.toLowerCase() === make.toLowerCase() ||
                    fact.vehicle?.model?.toLowerCase() === model.toLowerCase()
                  ) {
                    specs.push(fact);
                  }
                } catch (e) {
                  // Skip invalid JSON lines
                }
              }
            }
          }
        }
      }

      return {
        success: true,
        make,
        model,
        specs: specs.slice(0, 20), // Return top 20 specs
        total: specs.length,
      };
    }),

  /**
   * Get DTC codes from knowledge base
   */
  getDTCCodes: publicProcedure
    .input(
      z.object({
        code: z.string().optional(),
        system: z.string().optional(),
      })
    )
    .query(async ({ input: { code, system } }: any) => {
      const kb = loadKnowledgeBase();
      if (!kb) {
        return {
          success: false,
          message: "Knowledge base not available",
          codes: [],
        };
      }

      const codes = [];

      // Search through extracted facts for DTC codes
      if (kb.content_extracted && Array.isArray(kb.content_extracted)) {
        for (const extraction of kb.content_extracted) {
          if (extraction.result) {
            const lines = extraction.result.split("\n");
            for (const line of lines) {
              if (line.trim()) {
                try {
                  const fact = JSON.parse(line);
                  if (fact.type === "diagnostic" && fact.code) {
                    if (!code || fact.code.includes(code.toUpperCase())) {
                      codes.push(fact);
                    }
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        }
      }

      return {
        success: true,
        query: code || system || "all",
        codes: codes.slice(0, 20),
        total: codes.length,
      };
    }),

  /**
   * Get service procedures from knowledge base
   */
  getServiceProcedures: publicProcedure
    .input(
      z.object({
        system: z.string(),
        make: z.string().optional(),
      })
    )
    .query(async ({ input: { system, make } }: any) => {
      const kb = loadKnowledgeBase();
      if (!kb) {
        return {
          success: false,
          message: "Knowledge base not available",
          procedures: [],
        };
      }

      const procedures = [];

      // Search through extracted facts for procedures
      if (kb.content_extracted && Array.isArray(kb.content_extracted)) {
        for (const extraction of kb.content_extracted) {
          if (extraction.result) {
            const lines = extraction.result.split("\n");
            for (const line of lines) {
              if (line.trim()) {
                try {
                  const fact = JSON.parse(line);
                  if (
                    fact.type === "procedure" &&
                    fact.system?.toLowerCase() === system.toLowerCase()
                  ) {
                    procedures.push(fact);
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        }
      }

      return {
        success: true,
        system,
        procedures: procedures.slice(0, 10),
        total: procedures.length,
      };
    }),

  /**
   * Get knowledge base statistics
   */
  getStats: publicProcedure.query(async () => {
    const kb = loadKnowledgeBase();
    if (!kb) {
      return {
        success: false,
        message: "Knowledge base not available",
      };
    }

    return {
      success: true,
      metadata: kb.metadata,
      sources_discovered: kb.sources_discovered?.length || 0,
      licenses_validated: kb.licenses_validated?.length || 0,
      content_extracted: kb.content_extracted?.length || 0,
      data_normalized: kb.data_normalized?.length || 0,
      cross_verified: kb.cross_verified?.length || 0,
      taxonomy_tagged: kb.taxonomy_tagged?.length || 0,
      qa_reports: kb.qa_reports?.length || 0,
      total_agents: kb.metadata?.total_agents || 100,
      brands_covered: kb.metadata?.brands || 0,
      topics_covered: kb.metadata?.topics || 0,
    };
  }),

  /**
   * Search knowledge base
   */
  search: publicProcedure
    .input(
      z.object({
        query: z.string(),
        type: z
          .enum(["spec", "diagnostic", "procedure", "safety", "all"])
          .optional(),
      })
    )
    .query(async ({ input: { query, type } }: any) => {
      const kb = loadKnowledgeBase();
      if (!kb) {
        return {
          success: false,
          message: "Knowledge base not available",
          results: [],
        };
      }

      const results = [];
      const queryLower = query.toLowerCase();

      // Search through all extracted facts
      if (kb.content_extracted && Array.isArray(kb.content_extracted)) {
        for (const extraction of kb.content_extracted) {
          if (extraction.result) {
            const lines = extraction.result.split("\n");
            for (const line of lines) {
              if (line.trim()) {
                try {
                  const fact = JSON.parse(line);

                  // Check if matches type filter
                  if (
                    type &&
                    type !== "all" &&
                    fact.type !== type
                  ) {
                    continue;
                  }

                  // Check if matches query
                  const factStr = JSON.stringify(fact).toLowerCase();
                  if (factStr.includes(queryLower)) {
                    results.push(fact);
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        }
      }

      return {
        success: true,
        query,
        type: type || "all",
        results: results.slice(0, 50),
        total: results.length,
      };
    }),
});
