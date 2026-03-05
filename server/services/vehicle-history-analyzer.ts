import { getDb } from "../db";
import { vehicles, diagnostics, vehicleHistory, diagnosticFeedback } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export interface VehicleHistoryAnalysis {
  vehicleId: number;
  totalDiagnostics: number;
  lastDiagnosticDate: Date | null;
  commonIssues: string[];
  totalRepairs: number;
  lastRepairDate: Date | null;
  repairCost: number;
  currentMileage: number;
  mileageHistory: Array<{ date: string; mileage: number }>;
  healthScore: number;
  healthTrend: "improving" | "stable" | "degrading";
  riskFactors: string[];
}

/**
 * Analyzes vehicle history from diagnostics and repairs
 */
export class VehicleHistoryAnalyzer {
  /**
   * Analyze complete vehicle history
   */
  static async analyzeVehicleHistory(vehicleId: number): Promise<VehicleHistoryAnalysis> {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Get vehicle info
    const vehicle = await db.select().from(vehicles).where(eq(vehicles.id, vehicleId)).limit(1);
    const vehicleData = vehicle[0];

    if (!vehicleData) {
      throw new Error(`Vehicle ${vehicleId} not found`);
    }

    // Get all diagnostics for this vehicle
    const vehicleDiagnostics = await db
      .select()
      .from(diagnostics)
      .where(eq(diagnostics.vehicleId, vehicleId))
      .orderBy(desc(diagnostics.createdAt));

    // Get feedback for diagnostics from diagnostics table
    const feedbackRecords = await db
      .select()
      .from(diagnosticFeedback)
      .innerJoin(diagnostics, eq(diagnosticFeedback.diagnosticId, diagnostics.id))
      .where(eq(diagnostics.vehicleId, vehicleId));

    // Analyze data
    const totalDiagnostics = vehicleDiagnostics.length;
    const lastDiagnosticDate = vehicleDiagnostics[0]?.createdAt || null;

    // Extract common issues from diagnostics
    const commonIssues = this.extractCommonIssues(vehicleDiagnostics);

    // Count repairs (diagnostics with confirmed fixes)
    const totalRepairs = feedbackRecords.filter((row: any) => {
      const feedback = row.diagnosticFeedback;
      return feedback?.wasResolved === true;
    }).length;
    const lastRepairDate = feedbackRecords.length > 0 ? feedbackRecords[0]?.diagnosticFeedback?.createdAt || null : null;

    // Calculate repair cost
    const repairCost = feedbackRecords.reduce((sum: number, row: any) => {
      const feedback = row.diagnosticFeedback;
      return sum + (feedback?.actualCost ? parseFloat(feedback.actualCost.toString()) : 0);
    }, 0);

    // Build mileage history
    const mileageHistory = this.buildMileageHistory(vehicleDiagnostics);
    const currentMileage = vehicleData.mileage || 0;

    // Calculate health score
    const healthScore = this.calculateHealthScore(
      totalDiagnostics,
      totalRepairs,
      currentMileage,
      vehicleData.year,
      commonIssues.length
    );

    // Determine health trend
    const healthTrend = this.determineHealthTrend(feedbackRecords.map((r: any) => r.diagnosticFeedback));

    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(
      vehicleData,
      commonIssues,
      currentMileage,
      healthScore,
      totalDiagnostics
    );

    return {
      vehicleId,
      totalDiagnostics,
      lastDiagnosticDate,
      commonIssues,
      totalRepairs,
      lastRepairDate,
      repairCost,
      currentMileage,
      mileageHistory,
      healthScore,
      healthTrend,
      riskFactors,
    };
  }

  /**
   * Extract common issues from diagnostic history
   */
  private static extractCommonIssues(diagnostics: any[]): string[] {
    const issueMap = new Map<string, number>();

    for (const diag of diagnostics) {
      if (diag.kimiResponse && typeof diag.kimiResponse === "object") {
        const response = diag.kimiResponse as Record<string, any>;

        // Extract from probable causes
        if (Array.isArray(response.probableCauses)) {
          for (const cause of response.probableCauses) {
            const issue = cause.cause || cause;
            issueMap.set(issue, (issueMap.get(issue) || 0) + 1);
          }
        }
      }
    }

    // Return top 5 issues
    return Array.from(issueMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([issue]) => issue);
  }

  /**
   * Build mileage history timeline
   */
  private static buildMileageHistory(diagnostics: any[]): Array<{ date: string; mileage: number }> {
    const history: Array<{ date: string; mileage: number }> = [];

    for (const diag of diagnostics.reverse()) {
      if (diag.createdAt) {
        history.push({
          date: new Date(diag.createdAt).toISOString().split("T")[0],
          mileage: diag.mileage || 0,
        });
      }
    }

    return history;
  }

  /**
   * Calculate overall vehicle health score (0-100)
   */
  private static calculateHealthScore(
    totalDiagnostics: number,
    totalRepairs: number,
    currentMileage: number,
    year: number,
    issueCount: number
  ): number {
    let score = 100;

    // Deduct for high mileage
    if (currentMileage > 200000) {
      score -= 30;
    } else if (currentMileage > 150000) {
      score -= 20;
    } else if (currentMileage > 100000) {
      score -= 10;
    }

    // Deduct for age
    const age = new Date().getFullYear() - year;
    if (age > 15) {
      score -= 20;
    } else if (age > 10) {
      score -= 10;
    }

    // Deduct for frequent issues
    if (issueCount > 5) {
      score -= 20;
    } else if (issueCount > 3) {
      score -= 10;
    }

    // Bonus for repairs
    if (totalRepairs > 0) {
      score += Math.min(totalRepairs * 2, 10);
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Determine health trend from feedback
   */
  private static determineHealthTrend(feedbackRecords: any[]): "improving" | "stable" | "degrading" {
    if (feedbackRecords.length < 2) {
      return "stable";
    }

    // Get last 5 feedbacks
    const recent = feedbackRecords.slice(0, 5);
    const correctCount = recent.filter((f: any) => f?.wasResolved === true).length;

    if (correctCount >= 4) {
      return "improving";
    } else if (correctCount <= 1) {
      return "degrading";
    }

    return "stable";
  }

  /**
   * Identify risk factors for vehicle
   */
  private static identifyRiskFactors(
    vehicle: any,
    commonIssues: string[],
    currentMileage: number,
    healthScore: number,
    totalDiagnostics: number
  ): string[] {
    const risks: string[] = [];

    // High mileage
    if (currentMileage > 200000) {
      risks.push("High mileage (>200k km) - increased wear on components");
    }

    // Age
    const age = new Date().getFullYear() - vehicle.year;
    if (age > 15) {
      risks.push("Vehicle age >15 years - potential rust and corrosion");
    }

    // Recurring issues
    if (commonIssues.length > 3) {
      risks.push(`${commonIssues.length} recurring issues detected - pattern of problems`);
    }

    // Low health score
    if (healthScore < 50) {
      risks.push("Low health score - comprehensive inspection recommended");
    }

    // Frequent diagnostics
    if (totalDiagnostics > 10) {
      risks.push("Frequent diagnostics - vehicle requires frequent repairs");
    }

    // Specific component risks
    for (const issue of commonIssues) {
      if (issue.toLowerCase().includes("transmission")) {
        risks.push("Transmission issues detected - monitor fluid and performance");
      }
      if (issue.toLowerCase().includes("engine")) {
        risks.push("Engine issues detected - check compression and timing");
      }
      if (issue.toLowerCase().includes("brake")) {
        risks.push("Brake issues detected - safety critical component");
      }
    }

    return risks;
  }

  /**
   * Update vehicle history in database
   */
  static async updateVehicleHistory(vehicleId: number): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    const analysis = await this.analyzeVehicleHistory(vehicleId);

    await db
      .insert(vehicleHistory)
      .values({
        vehicleId,
        totalDiagnostics: analysis.totalDiagnostics,
        lastDiagnosticDate: analysis.lastDiagnosticDate,
        commonIssues: analysis.commonIssues,
        totalRepairs: analysis.totalRepairs,
        lastRepairDate: analysis.lastRepairDate,
        repairCost: analysis.repairCost.toString(),
        currentMileage: analysis.currentMileage,
        mileageHistory: analysis.mileageHistory,
        healthScore: analysis.healthScore.toString(),
        lastHealthUpdate: new Date(),
      })
      .onDuplicateKeyUpdate({
        set: {
          totalDiagnostics: analysis.totalDiagnostics,
          lastDiagnosticDate: analysis.lastDiagnosticDate,
          commonIssues: analysis.commonIssues,
          totalRepairs: analysis.totalRepairs,
          lastRepairDate: analysis.lastRepairDate,
          repairCost: analysis.repairCost.toString(),
          currentMileage: analysis.currentMileage,
          mileageHistory: analysis.mileageHistory,
          healthScore: analysis.healthScore.toString(),
          lastHealthUpdate: new Date(),
        },
      });
  }
}
