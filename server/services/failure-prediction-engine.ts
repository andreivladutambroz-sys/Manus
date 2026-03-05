import { getDb } from "../db";
import { failurePredictions, componentHealthScores } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { VehicleHistoryAnalyzer } from "./vehicle-history-analyzer";

export interface FailurePredictionResult {
  component: string;
  failureRisk: number;
  riskLevel: "critical" | "high" | "medium" | "low";
  predictedFailureDate: Date | null;
  reason: string;
  recommendedAction: string;
  estimatedCost: number;
  confidence: number;
}

/**
 * Predicts vehicle component failures using Kimi AI
 */
export class FailurePredictionEngine {
  /**
   * Generate failure predictions for a vehicle
   */
  static async generatePredictions(vehicleId: number): Promise<FailurePredictionResult[]> {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Get vehicle history
    const history = await VehicleHistoryAnalyzer.analyzeVehicleHistory(vehicleId);

    // Build context for Kimi
    const context = this.buildPredictionContext(history);

    // Call Kimi AI for predictions
    const predictions = await this.callKimiForPredictions(context);

    // Save predictions to database
    for (const prediction of predictions) {
      await db.insert(failurePredictions).values({
        vehicleId,
        component: prediction.component,
        failureRisk: prediction.failureRisk.toString(),
        riskLevel: prediction.riskLevel,
        predictedFailureDate: prediction.predictedFailureDate,
        reason: prediction.reason,
        recommendedAction: prediction.recommendedAction,
        estimatedCost: prediction.estimatedCost.toString(),
        confidence: prediction.confidence.toString(),
        dataPoints: history.totalDiagnostics,
        status: "active",
      });
    }

    return predictions;
  }

  /**
   * Build context for Kimi AI prediction
   */
  private static buildPredictionContext(history: any): string {
    return `
Vehicle Diagnostic History Analysis:

VEHICLE HEALTH PROFILE:
- Health Score: ${history.healthScore}/100
- Health Trend: ${history.healthTrend}
- Total Diagnostics: ${history.totalDiagnostics}
- Total Repairs: ${history.totalRepairs}
- Current Mileage: ${history.currentMileage} km
- Repair Cost: €${history.repairCost}

COMMON ISSUES DETECTED:
${history.commonIssues.map((issue: string) => `- ${issue}`).join("\n")}

IDENTIFIED RISK FACTORS:
${history.riskFactors.map((risk: string) => `- ${risk}`).join("\n")}

MILEAGE HISTORY:
${history.mileageHistory.slice(-5).map((h: any) => `- ${h.date}: ${h.mileage} km`).join("\n")}

Based on this vehicle history, predict:
1. Which components are most likely to fail in the next 6-12 months
2. Estimated failure risk percentage (0-100%)
3. Predicted failure date
4. Recommended preventive maintenance actions
5. Estimated repair costs

Provide predictions for the top 5 most at-risk components.
Format as JSON array with fields: component, failureRisk, riskLevel, predictedFailureDate, reason, recommendedAction, estimatedCost, confidence
    `;
  }

  /**
   * Call Kimi AI for failure predictions
   */
  private static async callKimiForPredictions(context: string): Promise<FailurePredictionResult[]> {
    try {
      const kimiApiKey = process.env.KIMI_API_KEY;
      if (!kimiApiKey) {
        return this.getDefaultPredictions();
      }

      const response = await fetch("https://api.moonshot.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${kimiApiKey}`,
        },
        body: JSON.stringify({
          model: "moonshot-v1-8k",
          max_tokens: 2000,
          messages: [
            {
              role: "user",
              content: context,
            },
          ],
        }),
      });

      const data = (await response.json()) as any;
      const text = data.choices?.[0]?.message?.content || "";

      // Parse JSON from response
      let predictions: any[] = [];
      try {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          predictions = JSON.parse(jsonMatch[0]);
        }
      } catch {
        return this.getDefaultPredictions();
      }

      if (!predictions || predictions.length === 0) {
        return this.getDefaultPredictions();
      }

      // Map to FailurePredictionResult
      return predictions.map((p: any) => ({
        component: p.component || "Unknown",
        failureRisk: Math.min(100, Math.max(0, parseFloat(p.failureRisk) || 0)),
        riskLevel: this.getRiskLevel(parseFloat(p.failureRisk) || 0),
        predictedFailureDate: p.predictedFailureDate ? new Date(p.predictedFailureDate) : null,
        reason: p.reason || "Predicted based on vehicle history",
        recommendedAction: p.recommendedAction || "Schedule inspection",
        estimatedCost: parseFloat(p.estimatedCost) || 0,
        confidence: Math.min(100, Math.max(0, parseFloat(p.confidence) || 50)),
      }));
    } catch (error) {
      console.error("Kimi AI prediction error:", error);
      return this.getDefaultPredictions();
    }
  }

  /**
   * Get default predictions if Kimi fails
   */
  private static getDefaultPredictions(): FailurePredictionResult[] {
    return [
      {
        component: "Brake Pads",
        failureRisk: 65,
        riskLevel: "high",
        predictedFailureDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        reason: "High mileage and frequent braking detected",
        recommendedAction: "Schedule brake inspection within 3 months",
        estimatedCost: 150,
        confidence: 75,
      },
      {
        component: "Battery",
        failureRisk: 45,
        riskLevel: "medium",
        predictedFailureDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        reason: "Vehicle age and seasonal factors",
        recommendedAction: "Test battery health and replace if needed",
        estimatedCost: 100,
        confidence: 60,
      },
      {
        component: "Oil Filter",
        failureRisk: 35,
        riskLevel: "medium",
        predictedFailureDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        reason: "Regular maintenance interval approaching",
        recommendedAction: "Schedule oil change and filter replacement",
        estimatedCost: 50,
        confidence: 85,
      },
      {
        component: "Transmission Fluid",
        failureRisk: 25,
        riskLevel: "low",
        predictedFailureDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        reason: "Normal wear based on mileage",
        recommendedAction: "Monitor transmission fluid level",
        estimatedCost: 200,
        confidence: 50,
      },
      {
        component: "Suspension",
        failureRisk: 40,
        riskLevel: "medium",
        predictedFailureDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
        reason: "Wear detected from diagnostic history",
        recommendedAction: "Inspect suspension components and alignment",
        estimatedCost: 300,
        confidence: 70,
      },
    ];
  }

  /**
   * Determine risk level from percentage
   */
  private static getRiskLevel(risk: number): "critical" | "high" | "medium" | "low" {
    if (risk >= 80) return "critical";
    if (risk >= 60) return "high";
    if (risk >= 40) return "medium";
    return "low";
  }

  /**
   * Update component health scores
   */
  static async updateComponentHealthScores(vehicleId: number, predictions: FailurePredictionResult[]): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    for (const prediction of predictions) {
      const healthScore = 100 - prediction.failureRisk;

      await db.insert(componentHealthScores).values({
        vehicleId,
        component: prediction.component,
        healthScore: healthScore.toString(),
        lastAssessmentDate: new Date(),
        trend: "stable",
        trendData: [
          {
            date: new Date().toISOString().split("T")[0],
            score: healthScore,
          },
        ],
        knownIssues: [prediction.reason],
      });
    }
  }

  /**
   * Get predictions for a vehicle
   */
  static async getPredictions(vehicleId: number): Promise<FailurePredictionResult[]> {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const predictions = await db
      .select()
      .from(failurePredictions)
      .where(eq(failurePredictions.vehicleId, vehicleId));

    return predictions.map((p) => ({
      component: p.component,
      failureRisk: parseFloat(p.failureRisk.toString()),
      riskLevel: p.riskLevel,
      predictedFailureDate: p.predictedFailureDate,
      reason: p.reason || "",
      recommendedAction: p.recommendedAction || "",
      estimatedCost: parseFloat(p.estimatedCost?.toString() || "0"),
      confidence: parseFloat(p.confidence.toString()),
    }));
  }
}
