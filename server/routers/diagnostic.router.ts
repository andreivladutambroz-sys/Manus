/**
 * Diagnostic Router
 * tRPC procedures for vehicle diagnostics
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { diagnosticService } from "../services/diagnostic.service";

export const diagnosticRouter = router({
  /**
   * Perform Bayesian diagnostic inference
   */
  diagnose: publicProcedure
    .input(
      z.object({
        vehicleMake: z.string().min(1, "Vehicle make is required"),
        vehicleModel: z.string().min(1, "Vehicle model is required"),
        vehicleYear: z.number().optional(),
        engine: z.string().optional(),
        errorCode: z.string().min(1, "Error code is required"),
        symptoms: z.array(z.string()).min(1, "At least one symptom is required"),
      })
    )
    .query(async ({ input }) => {
      try {
        const result = await diagnosticService.diagnose(input);
        return {
          success: true,
          data: result,
        };
      } catch (error) {
        console.error("Diagnostic error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  /**
   * Get all available error codes
   */
  getErrorCodes: publicProcedure.query(async () => {
    try {
      const codes = await diagnosticService.getErrorCodes();
      return {
        success: true,
        data: codes,
      };
    } catch (error) {
      console.error("Error fetching error codes:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        data: [],
      };
    }
  }),

  /**
   * Get diagnostics by error code
   */
  getByErrorCode: publicProcedure
    .input(
      z.object({
        errorCode: z.string().min(1, "Error code is required"),
      })
    )
    .query(async ({ input }) => {
      try {
        const records = await diagnosticService.getByErrorCode(input.errorCode);
        return {
          success: true,
          data: records,
        };
      } catch (error) {
        console.error("Error fetching diagnostics:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          data: [],
        };
      }
    }),

  /**
   * Get diagnostics by vehicle
   */
  getByVehicle: publicProcedure
    .input(
      z.object({
        vehicleMake: z.string().min(1, "Vehicle make is required"),
        vehicleModel: z.string().min(1, "Vehicle model is required"),
      })
    )
    .query(async ({ input }) => {
      try {
        const records = await diagnosticService.getByVehicle(
          input.vehicleMake,
          input.vehicleModel
        );
        return {
          success: true,
          data: records,
        };
      } catch (error) {
        console.error("Error fetching vehicle diagnostics:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          data: [],
        };
      }
    }),
});
