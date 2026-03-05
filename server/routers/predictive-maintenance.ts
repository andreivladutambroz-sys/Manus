import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { VehicleHistoryAnalyzer } from "../services/vehicle-history-analyzer";
import { FailurePredictionEngine } from "../services/failure-prediction-engine";

export const predictiveMaintenanceRouter = router({
  /**
   * Analyze vehicle history and get health score
   */
  analyzeVehicleHistory: protectedProcedure
    .input(z.object({ vehicleId: z.string() }))
    .query(async ({ input }: any) => {
      try {
        const vehicleIdNum = parseInt(input.vehicleId);
        const analysis = await VehicleHistoryAnalyzer.analyzeVehicleHistory(
          vehicleIdNum
        );
        return {
          success: true,
          data: analysis,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Analysis failed",
        };
      }
    }),

  /**
   * Get failure predictions for a vehicle
   */
  getPredictions: protectedProcedure
    .input(z.object({ vehicleId: z.string() }))
    .query(async ({ input }: any) => {
      try {
        const vehicleIdNum = parseInt(input.vehicleId);
        const predictions = await FailurePredictionEngine.generatePredictions(
          vehicleIdNum
        );
        return {
          success: true,
          data: predictions,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Prediction failed",
        };
      }
    }),

  /**
   * Get maintenance recommendations
   */
  getRecommendations: protectedProcedure
    .input(z.object({ vehicleId: z.string() }))
    .query(async ({ input }: any) => {
      try {
        const vehicleIdNum = parseInt(input.vehicleId);
        const analysis = await VehicleHistoryAnalyzer.analyzeVehicleHistory(
          vehicleIdNum
        );
        const predictions = await FailurePredictionEngine.generatePredictions(
          vehicleIdNum
        );

        // Generate recommendations based on predictions
        const recommendations = predictions
          .filter((p: any) => p.failureRisk > 50)
          .map((p) => ({
            component: p.component,
            riskLevel: p.riskLevel,
            recommendedAction: p.recommendedAction,
            estimatedCost: p.estimatedCost,
            urgency: p.failureRisk > 75 ? "high" : "medium",
          }));

        return {
          success: true,
          data: {
            vehicleHealth: analysis.healthScore,
            healthTrend: analysis.healthTrend,
            recommendations,
          },
        };
      } catch (error: any) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Recommendations failed",
        };
      }
    }),

  /**
   * Get component health scores
   */
  getComponentHealth: protectedProcedure
    .input(z.object({ vehicleId: z.string() }))
    .query(async ({ input }: any) => {
      try {
        const vehicleIdNum = parseInt(input.vehicleId);
        const predictions = await FailurePredictionEngine.generatePredictions(
          vehicleIdNum
        );

        const componentHealth = predictions.map((p: any) => ({
          component: p.component,
          healthScore: 100 - p.failureRisk,
          riskLevel: p.riskLevel,
          status:
            p.failureRisk > 75
              ? "critical"
              : p.failureRisk > 50
                ? "warning"
                : "healthy",
        }));

        return {
          success: true,
          data: componentHealth,
        };
      } catch (error: any) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Health check failed",
        };
      }
    }),
});
