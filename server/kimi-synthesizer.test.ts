import { describe, it, expect } from "vitest";
import {
  validateCoherence,
  determineComplexity,
  selectAgentsForComplexity,
} from "./kimi-synthesizer";

describe("Kimi Synthesizer", () => {
  it("should validate coherent analyses", async () => {
    const analyses = [
      {
        agentName: "SymptomAnalyzer",
        analysis: "Motor nu porneste - posibila problema cu bateria",
        confidence: 0.9,
      },
      {
        agentName: "ErrorCodeDecoder",
        analysis: "Cod P0100 - Masa de aer defecta",
        confidence: 0.85,
      },
      {
        agentName: "ComponentEvaluator",
        analysis: "Bateria sau alternator defect",
        confidence: 0.88,
      },
    ];

    const result = await validateCoherence(analyses);

    expect(result.isCoherent).toBe(true);
    expect(result.coherenceScore).toBeGreaterThan(70);
    expect(result.issues.length).toBeLessThan(2);
  });

  it("should detect low confidence", async () => {
    const analyses = [
      {
        agentName: "SymptomAnalyzer",
        analysis: "Posibila problema",
        confidence: 0.5,
      },
      {
        agentName: "ErrorCodeDecoder",
        analysis: "Cod neclar",
        confidence: 0.4,
      },
    ];

    const result = await validateCoherence(analyses);

    expect(result.coherenceScore).toBeLessThan(100);
    expect(result.issues.some((i) => i.type === "low_confidence")).toBe(true);
  });

  it("should determine complexity correctly", () => {
    // Simple case
    const simpleComplexity = determineComplexity("Motor nu porneste");
    expect(simpleComplexity).toBe("simple");

    // Moderate case
    const moderateComplexity = determineComplexity(
      "Motor nu porneste, transmisie sare din viteza, suspensie zgomotos",
      ["P0100", "P0200"]
    );
    expect(moderateComplexity).toBe("moderate");

    // Complex case
    const complexComplexity = determineComplexity(
      "Motor intermittent, multiple electrical issues, complex transmission problems",
      ["P0100", "P0200", "P0300", "P0400"]
    );
    expect(complexComplexity).toBe("complex");
  });

  it("should select correct agents for complexity", () => {
    const simpleAgents = selectAgentsForComplexity("simple");
    expect(simpleAgents).toHaveLength(3);

    const moderateAgents = selectAgentsForComplexity("moderate");
    expect(moderateAgents.length).toBeGreaterThanOrEqual(4);
    expect(moderateAgents.length).toBeLessThanOrEqual(5);

    const complexAgents = selectAgentsForComplexity("complex");
    expect(complexAgents).toHaveLength(6);
  });

  it("should mark reanalysis needed for incoherent data", async () => {
    const analyses = [
      {
        agentName: "Agent1",
        analysis: "Defect motor",
        confidence: 0.3,
      },
      {
        agentName: "Agent2",
        analysis: "Motor normal",
        confidence: 0.3,
      },
    ];

    const result = await validateCoherence(analyses);

    expect(result.needsReanalysis).toBe(true);
    expect(result.agentsToReanalyze).toBeDefined();
  });

  it("should handle empty analyses", async () => {
    const analyses = [
      {
        agentName: "Agent1",
        analysis: "",
        confidence: 0.5,
      },
    ];

    const result = await validateCoherence(analyses);

    expect(result.issues.some((i) => i.type === "missing_data")).toBe(true);
  });
});
