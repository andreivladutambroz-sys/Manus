/**
 * A/B Testing Framework
 * Testare prompt variations și agent configurations
 */

export interface PromptVariation {
  id: string;
  name: string;
  description: string;
  agentName: string;
  promptTemplate: string;
  temperature: number;
  maxTokens: number;
}

export interface TestResult {
  variationId: string;
  diagnosticId: string;
  accuracy: number; // 0-1
  executionTime: number;
  coherenceScore: number;
  userSatisfaction?: number; // 0-5
  timestamp: number;
}

export interface TestMetrics {
  variationId: string;
  totalTests: number;
  averageAccuracy: number;
  averageExecutionTime: number;
  averageCoherence: number;
  averageSatisfaction: number;
  winRate: number; // vs baseline
}

// In-memory storage
const promptVariations: Map<string, PromptVariation> = new Map();
const testResults: TestResult[] = [];

// Baseline variations (default)
const BASELINE_VARIATIONS: PromptVariation[] = [
  {
    id: "baseline-symptom-1",
    name: "Baseline Symptom Analyzer",
    description: "Default symptom analysis prompt",
    agentName: "SymptomAnalyzer",
    promptTemplate: `Ești expert în diagnosticul vehiculelor. Analizează simptomele și identifică:
1. Sisteme afectate
2. Cauze potențiale
3. Gradul de urgență
4. Teste recomandate`,
    temperature: 0.7,
    maxTokens: 1000,
  },
  {
    id: "baseline-errorcode-1",
    name: "Baseline Error Code Decoder",
    description: "Default error code decoding prompt",
    agentName: "ErrorCodeDecoder",
    promptTemplate: `Ești expert în coduri OBD-II. Decodifică:
1. Semnificația fiecărui cod
2. Sistemul afectat
3. Cauze comune
4. Procedură de diagnosticare`,
    temperature: 0.5,
    maxTokens: 800,
  },
];

// Initialize baseline variations
BASELINE_VARIATIONS.forEach((v) => promptVariations.set(v.id, v));

/**
 * Creează variație de prompt
 */
export function createPromptVariation(
  variation: PromptVariation
): PromptVariation {
  promptVariations.set(variation.id, variation);
  return variation;
}

/**
 * Obține variație
 */
export function getPromptVariation(id: string): PromptVariation | undefined {
  return promptVariations.get(id);
}

/**
 * Obține toate variațiile
 */
export function getAllPromptVariations(): PromptVariation[] {
  return Array.from(promptVariations.values());
}

/**
 * Obține variații pentru agent
 */
export function getVariationsForAgent(agentName: string): PromptVariation[] {
  return Array.from(promptVariations.values()).filter(
    (v) => v.agentName === agentName
  );
}

/**
 * Adaugă rezultat test
 */
export function addTestResult(result: TestResult): void {
  testResults.push({
    ...result,
    timestamp: Date.now(),
  });
}

/**
 * Calculează metrici pentru variație
 */
export function calculateVariationMetrics(variationId: string): TestMetrics {
  const results = testResults.filter((r) => r.variationId === variationId);

  if (results.length === 0) {
    return {
      variationId,
      totalTests: 0,
      averageAccuracy: 0,
      averageExecutionTime: 0,
      averageCoherence: 0,
      averageSatisfaction: 0,
      winRate: 0,
    };
  }

  const avgAccuracy = results.reduce((sum, r) => sum + r.accuracy, 0) / results.length;
  const avgTime = results.reduce((sum, r) => sum + r.executionTime, 0) / results.length;
  const avgCoherence = results.reduce((sum, r) => sum + r.coherenceScore, 0) / results.length;
  const avgSatisfaction = results
    .filter((r) => r.userSatisfaction !== undefined)
    .reduce((sum, r) => sum + (r.userSatisfaction || 0), 0) / results.length;

  // Calculează win rate vs baseline
  const baselineResults = testResults.filter((r) =>
    r.variationId.startsWith("baseline-")
  );
  const baselineAccuracy =
    baselineResults.length > 0
      ? baselineResults.reduce((sum, r) => sum + r.accuracy, 0) / baselineResults.length
      : 0;

  const winRate = baselineAccuracy > 0 ? avgAccuracy / baselineAccuracy : 0;

  return {
    variationId,
    totalTests: results.length,
    averageAccuracy: avgAccuracy,
    averageExecutionTime: avgTime,
    averageCoherence: avgCoherence,
    averageSatisfaction: avgSatisfaction,
    winRate,
  };
}

/**
 * Compară variații
 */
export function compareVariations(
  variationIds: string[]
): { variation: PromptVariation; metrics: TestMetrics }[] {
  return variationIds
    .map((id) => ({
      variation: promptVariations.get(id)!,
      metrics: calculateVariationMetrics(id),
    }))
    .filter((v) => v.variation)
    .sort((a, b) => b.metrics.averageAccuracy - a.metrics.averageAccuracy);
}

/**
 * Recomandă cea mai bună variație
 */
export function recommendBestVariation(
  agentName: string
): { variation: PromptVariation; metrics: TestMetrics } | null {
  const variations = getVariationsForAgent(agentName);
  if (variations.length === 0) return null;

  const compared = compareVariations(variations.map((v) => v.id));
  return compared.length > 0 ? compared[0] : null;
}

/**
 * Formatează raport A/B testing
 */
export function formatABTestReport(): string {
  const lines: string[] = [
    "=== A/B TESTING REPORT ===",
    "",
    "VARIATION PERFORMANCE:",
  ];

  const allVariations = getAllPromptVariations();
  const compared = compareVariations(allVariations.map((v) => v.id));

  compared.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.variation.name}`);
    lines.push(`   Accuracy: ${(item.metrics.averageAccuracy * 100).toFixed(1)}%`);
    lines.push(`   Avg Time: ${item.metrics.averageExecutionTime.toFixed(0)}ms`);
    lines.push(`   Coherence: ${(item.metrics.averageCoherence * 100).toFixed(1)}%`);
    lines.push(`   Win Rate: ${(item.metrics.winRate * 100).toFixed(1)}%`);
    lines.push(`   Tests: ${item.metrics.totalTests}`);
    lines.push("");
  });

  if (compared.length > 0) {
    lines.push("RECOMMENDATION:");
    lines.push(`Use "${compared[0].variation.name}" for best performance`);
  }

  return lines.join("\n");
}

/**
 * Exportă rezultate test
 */
export function exportTestResults(): {
  variations: PromptVariation[];
  results: TestResult[];
  metrics: TestMetrics[];
} {
  const allVariations = getAllPromptVariations();
  const metrics = allVariations.map((v) => calculateVariationMetrics(v.id));

  return {
    variations: allVariations,
    results: testResults,
    metrics,
  };
}

/**
 * Resetează test results
 */
export function resetTestResults(): void {
  testResults.length = 0;
}
