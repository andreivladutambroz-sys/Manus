// Diagnostic History Service - Track, compare, and analyze vehicle diagnostics over time

export interface DiagnosticSnapshot {
  id: string;
  timestamp: Date;
  mileage: number;
  symptoms: string[];
  errorCodes: string[];
  overallHealth: number;
  engineHealth: number;
  transmissionHealth: number;
  suspensionHealth: number;
  brakesHealth: number;
  electricalHealth: number;
}

export interface TrendAnalysis {
  period: string;
  snapshots: DiagnosticSnapshot[];
  healthTrend: "improving" | "stable" | "declining";
  healthChangePercent: number;
  commonIssues: string[];
  recurringProblems: string[];
  estimatedFailureRisk: {
    component: string;
    riskLevel: "low" | "medium" | "high" | "critical";
    estimatedDaysToFailure?: number;
  }[];
  maintenanceRecommendations: string[];
}

export interface DiagnosticComparison {
  diagnostic1: DiagnosticSnapshot;
  diagnostic2: DiagnosticSnapshot;
  timeBetween: string;
  mileageDifference: number;
  healthChange: {
    overall: number;
    byComponent: Record<string, number>;
  };
  newIssues: string[];
  resolvedIssues: string[];
  worseningIssues: string[];
  improvingIssues: string[];
  recommendations: string[];
}

// Calculate health score based on error codes and symptoms
export function calculateHealthScore(
  errorCodes: string[],
  symptoms: string[]
): Record<string, number> {
  const baseScore = 100;
  let overallScore = baseScore;

  // Deduct points based on error codes
  const errorCodePenalties: Record<string, number> = {
    // Engine codes (P0xxx)
    "P0101": 5, // MAF sensor
    "P0128": 10, // Coolant thermostat
    "P0171": 8, // System too lean
    "P0300": 15, // Random misfire
    // Transmission codes (P06xx)
    "P0700": 10, // Transmission control system
    "P0750": 12, // Shift solenoid
    // ABS/Brake codes (C0xxx)
    "C0035": 8, // ABS wheel speed sensor
    "C0050": 10, // ABS hydraulic pressure
    // Default penalty for unknown codes
    "_default": 5,
  };

  // Deduct points based on symptoms
  const symptomPenalties: Record<string, number> = {
    "engine_misfire": 10,
    "rough_idle": 5,
    "poor_acceleration": 8,
    "overheating": 15,
    "transmission_slipping": 12,
    "brake_noise": 6,
    "suspension_noise": 7,
    "electrical_issues": 4,
  };

  // Apply error code penalties
  errorCodes.forEach((code) => {
    const penalty = errorCodePenalties[code] || errorCodePenalties["_default"];
    overallScore -= penalty;
  });

  // Apply symptom penalties
  symptoms.forEach((symptom) => {
    const penalty = symptomPenalties[symptom] || 3;
    overallScore -= penalty;
  });

  // Ensure score stays between 0-100
  overallScore = Math.max(0, Math.min(100, overallScore));

  // Calculate component-specific scores
  const engineHealth = Math.max(0, 100 - (errorCodes.filter((c) => c.startsWith("P0")).length * 5));
  const transmissionHealth = Math.max(0, 100 - (errorCodes.filter((c) => c.startsWith("P06")).length * 8));
  const suspensionHealth = Math.max(0, 100 - (symptoms.filter((s) => s.includes("suspension")).length * 10));
  const brakesHealth = Math.max(0, 100 - (errorCodes.filter((c) => c.startsWith("C0")).length * 8));
  const electricalHealth = Math.max(0, 100 - (symptoms.filter((s) => s.includes("electrical")).length * 5));

  return {
    overall: overallScore,
    engine: engineHealth,
    transmission: transmissionHealth,
    suspension: suspensionHealth,
    brakes: brakesHealth,
    electrical: electricalHealth,
  };
}

// Compare two diagnostics and identify changes
export function compareDiagnostics(
  diagnostic1: DiagnosticSnapshot,
  diagnostic2: DiagnosticSnapshot
): DiagnosticComparison {
  const timeBetween = calculateTimeDifference(diagnostic1.timestamp, diagnostic2.timestamp);
  const mileageDifference = diagnostic2.mileage - diagnostic1.mileage;

  // Identify new, resolved, worsening, and improving issues
  const newIssues = diagnostic2.errorCodes.filter((code) => !diagnostic1.errorCodes.includes(code));
  const resolvedIssues = diagnostic1.errorCodes.filter((code) => !diagnostic2.errorCodes.includes(code));
  const worseningIssues = diagnostic1.symptoms.filter(
    (symptom) =>
      diagnostic2.symptoms.includes(symptom) &&
      diagnostic2.errorCodes.length > diagnostic1.errorCodes.length
  );
  const improvingIssues = diagnostic1.symptoms.filter(
    (symptom) =>
      !diagnostic2.symptoms.includes(symptom) ||
      diagnostic2.errorCodes.length < diagnostic1.errorCodes.length
  );

  // Calculate health change
  const healthChange = {
    overall: diagnostic2.overallHealth - diagnostic1.overallHealth,
    byComponent: {
      engine: diagnostic2.engineHealth - diagnostic1.engineHealth,
      transmission: diagnostic2.transmissionHealth - diagnostic1.transmissionHealth,
      suspension: diagnostic2.suspensionHealth - diagnostic1.suspensionHealth,
      brakes: diagnostic2.brakesHealth - diagnostic1.brakesHealth,
      electrical: diagnostic2.electricalHealth - diagnostic1.electricalHealth,
    },
  };

  // Generate recommendations
  const recommendations: string[] = [];

  if (newIssues.length > 0) {
    recommendations.push(`New issues detected: ${newIssues.join(", ")}. Schedule service immediately.`);
  }

  if (resolvedIssues.length > 0) {
    recommendations.push(`Issues resolved: ${resolvedIssues.join(", ")}. Continue monitoring.`);
  }

  if (healthChange.overall < -10) {
    recommendations.push("Vehicle health has declined significantly. Schedule comprehensive inspection.");
  } else if (healthChange.overall > 10) {
    recommendations.push("Vehicle health has improved. Maintenance is working well.");
  }

  if (mileageDifference > 10000) {
    recommendations.push("High mileage since last diagnostic. Consider preventive maintenance.");
  }

  return {
    diagnostic1,
    diagnostic2,
    timeBetween,
    mileageDifference,
    healthChange,
    newIssues,
    resolvedIssues,
    worseningIssues,
    improvingIssues,
    recommendations,
  };
}

// Analyze trends over multiple diagnostics
export function analyzeTrends(snapshots: DiagnosticSnapshot[]): TrendAnalysis {
  if (snapshots.length < 2) {
    throw new Error("At least 2 diagnostics required for trend analysis");
  }

  // Sort by timestamp
  const sorted = [...snapshots].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  // Calculate health trend
  const firstHealth = sorted[0].overallHealth;
  const lastHealth = sorted[sorted.length - 1].overallHealth;
  const healthChangePercent = ((lastHealth - firstHealth) / firstHealth) * 100;

  let healthTrend: "improving" | "stable" | "declining" = "stable";
  if (healthChangePercent > 5) healthTrend = "improving";
  if (healthChangePercent < -5) healthTrend = "declining";

  // Find common and recurring issues
  const allErrorCodes = sorted.flatMap((s) => s.errorCodes);
  const errorCodeCounts: Record<string, number> = {};
  allErrorCodes.forEach((code) => {
    errorCodeCounts[code] = (errorCodeCounts[code] || 0) + 1;
  });

  const commonIssues = Object.entries(errorCodeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([code]) => code);

  const recurringProblems = Object.entries(errorCodeCounts)
    .filter(([, count]) => count > 1)
    .map(([code]) => code);

  // Estimate failure risk
  const estimatedFailureRisk = estimateFailureRisk(sorted);

  // Generate maintenance recommendations
  const maintenanceRecommendations = generateMaintenanceRecommendations(sorted, healthTrend);

  const period = `${sorted[0].timestamp.toLocaleDateString()} - ${sorted[sorted.length - 1].timestamp.toLocaleDateString()}`;

  return {
    period,
    snapshots: sorted,
    healthTrend,
    healthChangePercent,
    commonIssues,
    recurringProblems,
    estimatedFailureRisk,
    maintenanceRecommendations,
  };
}

// Helper: Calculate time difference between two dates
function calculateTimeDifference(date1: Date, date2: Date): string {
  const diffMs = Math.abs(date2.getTime() - date1.getTime());
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffMonths / 12);

  if (diffYears > 0) return `${diffYears} year${diffYears > 1 ? "s" : ""}`;
  if (diffMonths > 0) return `${diffMonths} month${diffMonths > 1 ? "s" : ""}`;
  return `${diffDays} day${diffDays > 1 ? "s" : ""}`;
}

// Helper: Estimate failure risk based on trends
function estimateFailureRisk(
  snapshots: DiagnosticSnapshot[]
): Array<{ component: string; riskLevel: "low" | "medium" | "high" | "critical"; estimatedDaysToFailure?: number }> {
  const risks: Array<{ component: string; riskLevel: "low" | "medium" | "high" | "critical"; estimatedDaysToFailure?: number }> = [];

  const lastSnapshot = snapshots[snapshots.length - 1];

  if (lastSnapshot.engineHealth < 50) {
    risks.push({ component: "Engine", riskLevel: "critical", estimatedDaysToFailure: 7 });
  } else if (lastSnapshot.engineHealth < 70) {
    risks.push({ component: "Engine", riskLevel: "high", estimatedDaysToFailure: 30 });
  }

  if (lastSnapshot.transmissionHealth < 50) {
    risks.push({ component: "Transmission", riskLevel: "critical", estimatedDaysToFailure: 14 });
  } else if (lastSnapshot.transmissionHealth < 70) {
    risks.push({ component: "Transmission", riskLevel: "high", estimatedDaysToFailure: 60 });
  }

  if (lastSnapshot.brakesHealth < 50) {
    risks.push({ component: "Brakes", riskLevel: "critical", estimatedDaysToFailure: 3 });
  } else if (lastSnapshot.brakesHealth < 70) {
    risks.push({ component: "Brakes", riskLevel: "high", estimatedDaysToFailure: 14 });
  }

  return risks;
}

// Helper: Generate maintenance recommendations
function generateMaintenanceRecommendations(snapshots: DiagnosticSnapshot[], trend: string): string[] {
  const recommendations: string[] = [];
  const lastSnapshot = snapshots[snapshots.length - 1];

  if (trend === "declining") {
    recommendations.push("Vehicle health is declining. Schedule comprehensive inspection immediately.");
  }

  if (lastSnapshot.engineHealth < 70) {
    recommendations.push("Engine health compromised. Check oil level, coolant, and spark plugs.");
  }

  if (lastSnapshot.transmissionHealth < 70) {
    recommendations.push("Transmission issues detected. Schedule transmission fluid check and service.");
  }

  if (lastSnapshot.brakesHealth < 70) {
    recommendations.push("Brake system needs attention. Check brake pads and fluid level.");
  }

  if (lastSnapshot.suspensionHealth < 70) {
    recommendations.push("Suspension components may need replacement. Schedule alignment check.");
  }

  if (lastSnapshot.electricalHealth < 70) {
    recommendations.push("Electrical system issues detected. Check battery and alternator.");
  }

  return recommendations;
}

export {
  calculateTimeDifference,
  estimateFailureRisk,
  generateMaintenanceRecommendations,
};
