import { describe, it, expect, beforeEach } from "vitest";
import {
  createExecutionLog,
  updateAgentStatus,
  completeAgent,
  completeDiagnostic,
  getExecutionLog,
  calculateLogStatistics,
} from "./agent-logger";
import {
  generateCacheKey,
  calculateSimilarity,
  searchCache,
  setCacheEntry,
  getCacheStats,
  estimateLatencyReduction,
  clearCache,
} from "./diagnostic-cache";
import {
  createPromptVariation,
  getPromptVariation,
  addTestResult,
  calculateVariationMetrics,
  compareVariations,
  recommendBestVariation,
  resetTestResults,
} from "./ab-testing";

describe("Advanced Features", () => {
  beforeEach(() => {
    clearCache();
    resetTestResults();
  });

  describe("Agent Logger", () => {
    it("should create execution log", () => {
      const log = createExecutionLog("diag-123", "simple", 3);

      expect(log.diagnosticId).toBe("diag-123");
      expect(log.complexity).toBe("simple");
      expect(log.agentLogs).toHaveLength(3);
      expect(log.agentLogs[0].status).toBe("pending");
    });

    it("should update agent status", () => {
      const log = createExecutionLog("diag-123", "simple", 2);
      updateAgentStatus("diag-123", "Agent1", "running", 50);

      const updated = getExecutionLog("diag-123");
      expect(updated?.agentLogs[0].status).toBe("running");
      expect(updated?.agentLogs[0].progress).toBe(50);
    });

    it("should complete agent", () => {
      const log = createExecutionLog("diag-123", "simple", 1);
      completeAgent("diag-123", "Agent1", 1200, 0.95, "Test analysis");

      const updated = getExecutionLog("diag-123");
      expect(updated?.agentLogs[0].status).toBe("completed");
      expect(updated?.agentLogs[0].executionTime).toBe(1200);
      expect(updated?.agentLogs[0].confidence).toBe(0.95);
    });

    it("should complete diagnostic", () => {
      const log = createExecutionLog("diag-123", "simple", 1);
      completeAgent("diag-123", "Agent1", 1200, 0.95);
      completeDiagnostic("diag-123", 85, ["issue1"], "conclusion");

      const updated = getExecutionLog("diag-123");
      expect(updated?.endTime).toBeDefined();
      expect(updated?.coherenceScore).toBe(85);
      expect(updated?.synthesizedConclusion).toBe("conclusion");
    });

    it("should calculate log statistics", () => {
      createExecutionLog("diag-1", "simple", 1);
      createExecutionLog("diag-2", "moderate", 2);
      completeAgent("diag-1", "Agent1", 1000, 0.9);
      completeDiagnostic("diag-1", 90, [], "conclusion1");

      const stats = calculateLogStatistics();
      expect(stats.totalDiagnostics).toBeGreaterThan(0);
    });
  });

  describe("Diagnostic Cache", () => {
    it("should generate cache key", () => {
      const key1 = generateCacheKey("Motor nu porneste", ["P0100"]);
      const key2 = generateCacheKey("Motor nu porneste", ["P0100"]);

      expect(key1).toBe(key2);
      expect(key1).toHaveLength(64); // SHA256 hex
    });

    it("should calculate similarity", () => {
      const similarity1 = calculateSimilarity(
        "Motor nu porneste",
        "Motor nu porneste"
      );
      expect(similarity1).toBe(1);

      const similarity2 = calculateSimilarity(
        "Motor nu porneste",
        "Transmisie sare din viteza"
      );
      expect(similarity2).toBeLessThan(0.5);
    });

    it("should cache and retrieve entry", () => {
      setCacheEntry("Motor nu porneste", ["P0100"], "Result 1", 0.9);

      const found = searchCache("Motor nu porneste", ["P0100"]);
      expect(found).toBeDefined();
      expect(found?.result).toBe("Result 1");
    });

    it("should find similar entries", () => {
      setCacheEntry("Motor nu porneste", undefined, "Result 1", 0.9);

      const similar = searchCache("Motor nu porneste, baterie descarcata", undefined, 0.6);
      expect(similar).toBeDefined();
    });

    it("should track cache statistics", () => {
      setCacheEntry("Symptom 1", undefined, "Result 1", 0.85);
      setCacheEntry("Symptom 2", undefined, "Result 2", 0.90);

      const stats = getCacheStats();
      expect(stats.totalEntries).toBe(2);
      expect(stats.averageCoherence).toBeGreaterThan(0.8);
    });

    it("should estimate latency reduction", () => {
      setCacheEntry("Symptom 1", undefined, "Result 1", 0.85);
      searchCache("Symptom 1", undefined);

      const latency = estimateLatencyReduction();
      expect(latency.withoutCache).toBe(1200);
      expect(latency.withCache).toBeLessThan(latency.withoutCache);
      expect(latency.percentReduction).toBeGreaterThan(0);
    });
  });

  describe("A/B Testing", () => {
    it("should create prompt variation", () => {
      const variation = createPromptVariation({
        id: "test-1",
        name: "Test Variation",
        description: "Test",
        agentName: "SymptomAnalyzer",
        promptTemplate: "Test prompt",
        temperature: 0.7,
        maxTokens: 1000,
      });

      expect(variation.id).toBe("test-1");
      const retrieved = getPromptVariation("test-1");
      expect(retrieved).toBeDefined();
    });

    it("should add test result", () => {
      addTestResult({
        variationId: "baseline-symptom-1",
        diagnosticId: "diag-1",
        accuracy: 0.95,
        executionTime: 1200,
        coherenceScore: 0.9,
        timestamp: Date.now(),
      });

      addTestResult({
        variationId: "baseline-symptom-1",
        diagnosticId: "diag-2",
        accuracy: 0.92,
        executionTime: 1150,
        coherenceScore: 0.88,
        timestamp: Date.now(),
      });

      const metrics = calculateVariationMetrics("baseline-symptom-1");
      expect(metrics.totalTests).toBe(2);
      expect(metrics.averageAccuracy).toBeCloseTo(0.935, 1);
    });

    it("should compare variations", () => {
      addTestResult({
        variationId: "baseline-symptom-1",
        diagnosticId: "diag-1",
        accuracy: 0.95,
        executionTime: 1200,
        coherenceScore: 0.9,
        timestamp: Date.now(),
      });

      addTestResult({
        variationId: "baseline-errorcode-1",
        diagnosticId: "diag-2",
        accuracy: 0.85,
        executionTime: 1100,
        coherenceScore: 0.85,
        timestamp: Date.now(),
      });

      const compared = compareVariations([
        "baseline-symptom-1",
        "baseline-errorcode-1",
      ]);
      expect(compared).toHaveLength(2);
      expect(compared[0].metrics.averageAccuracy).toBeGreaterThan(
        compared[1].metrics.averageAccuracy
      );
    });

    it("should recommend best variation", () => {
      addTestResult({
        variationId: "baseline-symptom-1",
        diagnosticId: "diag-1",
        accuracy: 0.95,
        executionTime: 1200,
        coherenceScore: 0.9,
        timestamp: Date.now(),
      });

      const best = recommendBestVariation("SymptomAnalyzer");
      expect(best).toBeDefined();
      expect(best?.variation.agentName).toBe("SymptomAnalyzer");
    });
  });
});
