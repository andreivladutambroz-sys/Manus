/**
 * Diagnostic Service
 * Handles Bayesian inference for repair diagnostics
 */

import fs from "fs";
import path from "path";
import { getDb } from "../db";
import { knowledgeBase } from "../../drizzle/schema";
import type { KnowledgeBase } from "../../drizzle/schema";
import { eq, inArray } from "drizzle-orm";

interface BayesianModel {
  errorCodes: string[];
  symptoms: string[];
  priors: Record<string, number>;
  likelihoods: Record<string, Record<string, number>>;
  confidenceScores: Record<string, number>;
}

interface DiagnosticInput {
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear?: number;
  engine?: string;
  errorCode: string;
  symptoms: string[];
}

interface DiagnosticResult {
  errorCode: string;
  errorSystem: string;
  description: string;
  confidence: number;
  probableCauses: Array<{
    cause: string;
    probability: number;
  }>;
  repairProcedures: Array<{
    step: number;
    action: string;
  }>;
  toolsRequired: string[];
  torqueSpecs: Array<{
    component: string;
    value: number;
    unit: string;
  }>;
  estimatedTime: string;
  estimatedCost: number;
  similarCasesCount: number;
  sourceReference: string;
  successRate?: number;
}

class DiagnosticService {
  private bayesianModel: BayesianModel | null = null;

  /**
   * Load Bayesian model from JSON file
   */
  async loadBayesianModel(): Promise<void> {
    try {
      const modelPath = path.join(
        process.cwd(),
        "bayesian-model.json"
      );
      
      if (!fs.existsSync(modelPath)) {
        console.warn("Bayesian model not found at:", modelPath);
        return;
      }

      const modelData = fs.readFileSync(modelPath, "utf-8");
      this.bayesianModel = JSON.parse(modelData);
      console.log("✅ Bayesian model loaded successfully");
    } catch (error) {
      console.error("Error loading Bayesian model:", error);
    }
  }

  /**
   * Get Bayesian model (lazy load if needed)
   */
  private async getBayesianModel(): Promise<BayesianModel | null> {
    if (!this.bayesianModel) {
      await this.loadBayesianModel();
    }
    return this.bayesianModel;
  }

  /**
   * Calculate Bayesian probability for error code given symptoms
   */
  private calculateProbability(
    errorCode: string,
    symptoms: string[],
    model: BayesianModel
  ): number {
    if (!model.priors[errorCode]) {
      return 0;
    }

    let probability = model.priors[errorCode];

    // Multiply by likelihood of each symptom given error code
    for (const symptom of symptoms) {
      const key = `${errorCode}|${symptom}`;
      if (model.likelihoods[errorCode]?.[symptom]) {
        probability *= model.likelihoods[errorCode][symptom];
      }
    }

    return Math.min(probability, 1.0); // Cap at 1.0
  }

  /**
   * Main diagnostic function
   */
  async diagnose(input: DiagnosticInput): Promise<DiagnosticResult> {
    try {
      // Load model
      const model = await this.getBayesianModel();

      // Query knowledge base for matching records
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const records = await db
        .select()
        .from(knowledgeBase)
        .where(
          inArray(
            knowledgeBase.brand,
            [input.vehicleMake]
          )
        )
        .limit(100);

      // Find matching error code record
      const matchingRecord = records.find(
        (r: typeof records[0]) => r.errorCode === input.errorCode
      );

      if (!matchingRecord) {
        throw new Error(
          `No diagnostic data found for error code: ${input.errorCode}`
        );
      }

      // Calculate confidence
      let confidence = 0.85; // Default confidence
      if (model) {
        confidence = this.calculateProbability(
          input.errorCode,
          input.symptoms,
          model
        );
        confidence = Math.max(
          confidence,
          model.confidenceScores[input.errorCode] || 0.78
        );
      }

      // Parse repair steps from solution text
      const repairSteps: Array<{ step: number; action: string }> = [];
      if (matchingRecord.solution) {
        const steps = matchingRecord.solution
          .split("\n")
          .filter((s: string) => s.trim());
        steps.forEach((step: string, index: number) => {
          repairSteps.push({
            step: index + 1,
            action: step.trim(),
          });
        });
      }

      // Extract probable causes
      const probableCauses = [
        {
          cause: matchingRecord.probableCause || "Unknown cause",
          probability: confidence,
        },
      ];

      // Parse torque specs (simplified)
      const torqueSpecs: Array<{
        component: string;
        value: number;
        unit: string;
      }> = [];

      // Count similar cases
      const similarCases = records.filter(
        (r: typeof records[0]) => r.errorCode === input.errorCode
      ).length;

      return {
        errorCode: input.errorCode,
        errorSystem: matchingRecord.errorCode?.split("|")[0] || "Unknown",
        description: matchingRecord.problem,
        confidence: Math.round(confidence * 100) / 100,
        probableCauses,
        repairProcedures: repairSteps,
        toolsRequired: [],
        torqueSpecs,
        estimatedTime: matchingRecord.repairTime || "1-3 hours",
        estimatedCost: Number(matchingRecord.estimatedCost) || 0,
        similarCasesCount: similarCases,
        sourceReference: "Internal Knowledge Base",
        successRate: 0.85,
      };
    } catch (error) {
      console.error("Diagnostic error:", error);
      throw error;
    }
  }

  /**
   * Get all available error codes
   */
  async getErrorCodes(): Promise<string[]> {
    const db = await getDb();
    if (!db) {
      return [];
    }

    const records = await db
      .select({ errorCode: knowledgeBase.errorCode })
      .from(knowledgeBase);

    const codes = records
      .map((r: { errorCode: string | null }) => r.errorCode)
      .filter((code): code is string => code !== null && code.length > 0);
    return Array.from(new Set(codes));
  }

  /**
   * Get diagnostics by error code
   */
  async getByErrorCode(errorCode: string) {
    const db = await getDb();
    if (!db) {
      return [];
    }

    return db
      .select()
      .from(knowledgeBase)
      .where(eq(knowledgeBase.errorCode, errorCode))
      .limit(50);
  }

  /**
   * Get diagnostics by vehicle
   */
  async getByVehicle(make: string, model: string) {
    const db = await getDb();
    if (!db) {
      return [];
    }

    return db
      .select()
      .from(knowledgeBase)
      .where(
        eq(knowledgeBase.brand, make)
      )
      .limit(100);
  }
}

// Export singleton instance
export const diagnosticService = new DiagnosticService();
