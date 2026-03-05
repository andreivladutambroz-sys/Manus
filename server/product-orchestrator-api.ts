/**
 * Product-Orchestrator API
 * Main API for diagnostic, parts, estimates, and case management
 * Endpoints:
 *   POST /diagnose    - Semantic search for repair procedures
 *   POST /parts       - Find supplier parts
 *   POST /estimate    - Get time + cost estimate
 *   POST /case        - Store confirmed repair outcomes
 */

import { Router, Request, Response } from "express";
import { Pool } from "pg";
import { Queue } from "bullmq";
import { getGlobalKimiRateLimiter } from "./kimi-rate-limiter";
import VectorSearchService from "./vector-search-service";

interface DiagnoseRequest {
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  symptoms?: string[];
  error_codes?: string[];
}

interface DiagnoseResponse {
  vehicle: {
    make: string;
    model: string;
    year: number;
  };
  matched_procedures: Array<{
    procedure_id: string;
    title: string;
    difficulty_level: string;
    estimated_time_minutes: number;
    similarity_score: number;
    steps: Array<{
      step: number;
      action: string;
    }>;
    tools_required: string[];
    confidence: number;
  }>;
  error_codes: Array<{
    code: string;
    description: string;
    confidence: number;
  }>;
  processing_time_ms: number;
}

interface PartsRequest {
  component_name: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: number;
}

interface PartsResponse {
  parts: Array<{
    part_name: string;
    part_number: string;
    supplier_name: string;
    price_usd: number;
    stock_quantity: number;
    lead_time_days: number;
    quality_rating: number;
  }>;
  total_results: number;
}

interface EstimateRequest {
  procedure_title: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
}

interface EstimateResponse {
  procedure: string;
  estimated_labor_hours: number;
  estimated_labor_cost_usd: number;
  estimated_parts_cost_usd: number;
  total_estimated_cost_usd: number;
  confidence: number;
}

interface CaseRequest {
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  error_code: string;
  symptoms: string[];
  repair_performed: string;
  parts_replaced?: string[];
  labor_hours: number;
  actual_cost_usd: number;
  resolution_status: "resolved" | "partial" | "unresolved";
  customer_satisfaction_score?: number;
}

interface CaseResponse {
  case_id: string;
  status: string;
  message: string;
}

export function createProductOrchestratorAPI(
  postgresPool: Pool,
  mysqlPool: any,
  redisConnection: any,
  vectorSearchService: VectorSearchService
): Router {
  const router = Router();
  const rateLimiter = getGlobalKimiRateLimiter();
  const kmiQueue = new Queue("kimi-requests", { connection: redisConnection });

  /**
   * POST /diagnose
   * Semantic search for repair procedures based on symptoms/error codes
   */
  router.post("/diagnose", async (req: Request, res: Response) => {
    const startTime = Date.now();
    const agentId = req.headers["x-agent-id"] || "api-client";

    try {
      const { vehicle_make, vehicle_model, vehicle_year, symptoms, error_codes } =
        req.body as DiagnoseRequest;

      // Validate input
      if (!vehicle_make || !vehicle_model || !vehicle_year) {
        return res.status(400).json({
          error: "Missing required fields: vehicle_make, vehicle_model, vehicle_year",
        });
      }

      // Rate limit check
      await rateLimiter.acquireToken(String(agentId));

      const pgClient = await postgresPool.connect();
      try {
        // 1. Find vehicle in KB
        const vehicleResult = await pgClient.query(
          `SELECT id FROM vehicles WHERE make = $1 AND model = $2 AND year = $3 LIMIT 1`,
          [vehicle_make, vehicle_model, vehicle_year]
        );

        if (vehicleResult.rows.length === 0) {
          return res.status(404).json({
            error: "Vehicle not found in knowledge base",
            vehicle: { make: vehicle_make, model: vehicle_model, year: vehicle_year },
          });
        }

        const vehicleId = vehicleResult.rows[0].id;

        // 2. Build search query
        let searchQuery = `${vehicle_make} ${vehicle_model} ${vehicle_year}`;
        if (symptoms && symptoms.length > 0) {
          searchQuery += ` ${symptoms.join(" ")}`;
        }
        if (error_codes && error_codes.length > 0) {
          searchQuery += ` ${error_codes.join(" ")}`;
        }

        // 3. Semantic search using vectors
        const matchedProcedures = await vectorSearchService.semanticSearch(
          searchQuery,
          5,
          0.5
        );

        // 4. Get error code details
        let errorCodeDetails: any[] = [];
        if (error_codes && error_codes.length > 0) {
          const codesResult = await pgClient.query(
            `SELECT code, description, system FROM dtc_codes WHERE code = ANY($1)`,
            [error_codes]
          );
          errorCodeDetails = codesResult.rows;
        }

        // 5. Get procedure details with steps
        const procedureDetails = [];
        for (const proc of matchedProcedures) {
          const stepsResult = await pgClient.query(
            `SELECT step_number, action FROM procedure_steps
             WHERE procedure_id = $1 ORDER BY step_number`,
            [proc.procedure_id]
          );

          procedureDetails.push({
            procedure_id: proc.procedure_id,
            title: proc.title,
            difficulty_level: proc.difficulty_level,
            estimated_time_minutes: proc.estimated_time_minutes,
            similarity_score: proc.similarity_score,
            steps: stepsResult.rows.map((r) => ({
              step: r.step_number,
              action: r.action,
            })),
            tools_required: [], // TODO: fetch from DB
            confidence: proc.similarity_score,
          });
        }

        const processingTime = Date.now() - startTime;

        // Log to telemetry
        await mysqlPool.query(
          `INSERT INTO telemetry (agent_id, operation, duration_ms, success, records_processed)
           VALUES (?, ?, ?, ?, ?)`,
          [String(agentId), "diagnose", processingTime, true, 1]
        );

        res.json({
          vehicle: { make: vehicle_make, model: vehicle_model, year: vehicle_year },
          matched_procedures: procedureDetails,
          error_codes: errorCodeDetails,
          processing_time_ms: processingTime,
        } as DiagnoseResponse);
      } finally {
        pgClient.release();
      }
    } catch (error) {
      console.error("[API] /diagnose error:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  /**
   * POST /parts
   * Find supplier parts for a component
   */
  router.post("/parts", async (req: Request, res: Response) => {
    const startTime = Date.now();
    const agentId = req.headers["x-agent-id"] || "api-client";

    try {
      const { component_name, vehicle_make, vehicle_model, vehicle_year } =
        req.body as PartsRequest;

      if (!component_name) {
        return res.status(400).json({
          error: "Missing required field: component_name",
        });
      }

      // Rate limit
      await rateLimiter.acquireToken(String(agentId));

      const pgClient = await postgresPool.connect();
      try {
        // Query parts from PostgreSQL KB
        let query = `
          SELECT
            po.part_name,
            po.part_number,
            po.oem_number,
            po.supplier_name,
            po.price_usd,
            po.stock_quantity,
            po.lead_time_days,
            po.quality_rating
          FROM parts_offers po
          WHERE po.part_name ILIKE $1
        `;

        const params: any[] = [`%${component_name}%`];

        if (vehicle_make && vehicle_model && vehicle_year) {
          query += ` AND po.compatible_makes @> $2
                     AND po.compatible_models @> $3
                     AND po.compatible_years @> $4`;
          params.push([vehicle_make], [vehicle_model], [vehicle_year]);
        }

        query += ` ORDER BY po.price_usd ASC LIMIT 20`;

        const result = await pgClient.query(query, params);

        const processingTime = Date.now() - startTime;

        res.json({
          parts: result.rows,
          total_results: result.rows.length,
        } as PartsResponse);
      } finally {
        pgClient.release();
      }
    } catch (error) {
      console.error("[API] /parts error:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  /**
   * POST /estimate
   * Get time + cost estimate for a repair procedure
   */
  router.post("/estimate", async (req: Request, res: Response) => {
    const startTime = Date.now();
    const agentId = req.headers["x-agent-id"] || "api-client";

    try {
      const { procedure_title, vehicle_make, vehicle_model, vehicle_year } =
        req.body as EstimateRequest;

      if (!procedure_title || !vehicle_make || !vehicle_model || !vehicle_year) {
        return res.status(400).json({
          error: "Missing required fields",
        });
      }

      // Rate limit
      await rateLimiter.acquireToken(String(agentId));

      const pgClient = await postgresPool.connect();
      try {
        // Find procedure
        const procResult = await pgClient.query(
          `SELECT id, estimated_time_minutes FROM procedures WHERE title ILIKE $1 LIMIT 1`,
          [`%${procedure_title}%`]
        );

        if (procResult.rows.length === 0) {
          return res.status(404).json({
            error: "Procedure not found",
          });
        }

        const procedure = procResult.rows[0];
        const laborHours = procedure.estimated_time_minutes / 60;
        const laborCostPerHour = 75; // Average shop rate
        const laborCost = laborHours * laborCostPerHour;

        // Estimate parts cost (average from similar vehicles)
        const partsResult = await pgClient.query(
          `SELECT AVG(price_usd) as avg_price FROM parts_offers
           WHERE compatible_makes @> $1 AND compatible_models @> $2
           LIMIT 100`,
          [vehicle_make, vehicle_model]
        );

        const avgPartsCost = partsResult.rows[0]?.avg_price || 50;

        const processingTime = Date.now() - startTime;

        res.json({
          procedure: procedure_title,
          estimated_labor_hours: laborHours,
          estimated_labor_cost_usd: laborCost,
          estimated_parts_cost_usd: avgPartsCost,
          total_estimated_cost_usd: laborCost + avgPartsCost,
          confidence: 0.75,
        } as EstimateResponse);
      } finally {
        pgClient.release();
      }
    } catch (error) {
      console.error("[API] /estimate error:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  /**
   * POST /case
   * Store confirmed repair outcomes
   */
  router.post("/case", async (req: Request, res: Response) => {
    const startTime = Date.now();
    const agentId = req.headers["x-agent-id"] || "api-client";

    try {
      const {
        vehicle_make,
        vehicle_model,
        vehicle_year,
        error_code,
        symptoms,
        repair_performed,
        parts_replaced,
        labor_hours,
        actual_cost_usd,
        resolution_status,
        customer_satisfaction_score,
      } = req.body as CaseRequest;

      // Validate
      if (
        !vehicle_make ||
        !vehicle_model ||
        !vehicle_year ||
        !error_code ||
        !repair_performed
      ) {
        return res.status(400).json({
          error: "Missing required fields",
        });
      }

      // Rate limit
      await rateLimiter.acquireToken(String(agentId));

      // Store in MySQL (app DB)
      const caseId = `CASE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      await mysqlPool.query(
        `INSERT INTO cases (
          case_id, vehicle_make, vehicle_model, vehicle_year,
          error_codes, symptoms, status, resolution_status,
          labor_hours, actual_cost_usd, customer_satisfaction_score,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          caseId,
          vehicle_make,
          vehicle_model,
          vehicle_year,
          JSON.stringify([error_code]),
          JSON.stringify(symptoms || []),
          "closed",
          resolution_status,
          labor_hours,
          actual_cost_usd,
          customer_satisfaction_score || null,
        ]
      );

      const processingTime = Date.now() - startTime;

      res.json({
        case_id: caseId,
        status: "stored",
        message: "Case outcome recorded successfully",
      } as CaseResponse);
    } catch (error) {
      console.error("[API] /case error:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  /**
   * GET /status
   * Health check and metrics
   */
  router.get("/status", async (req: Request, res: Response) => {
    try {
      const rateLimitStatus = rateLimiter.getStatus();
      const queueSize = await kmiQueue.count();

      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        rate_limiter: {
          current_requests: rateLimitStatus.currentRequests,
          max_requests: rateLimitStatus.maxRequests,
          available_slots: rateLimitStatus.availableSlots,
          waiting_agents: rateLimitStatus.waitingAgents,
        },
        queue: {
          pending_jobs: queueSize,
        },
      });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  return router;
}

export default createProductOrchestratorAPI;
