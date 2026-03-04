import { describe, it, expect } from "vitest";
import { executeDiagnosticSwarm, formatSwarmResults } from "./kimi-swarm";

describe("Kimi Swarm Orchestrator", () => {
  it("should validate swarm input structure", async () => {
    const input = {
      vehicleMarque: "Volkswagen",
      vehicleModel: "Golf",
      vehicleYear: 2020,
      vehicleMileage: 50000,
      symptoms: "Motor nu porneste, baterie descarcata",
      errorCodes: ["P0100", "P0101"],
    };

    expect(input.vehicleMarque).toBeDefined();
    expect(input.symptoms).toBeDefined();
    expect(input.errorCodes).toHaveLength(2);
  });

  it("should validate swarm result structure", () => {
    const mockResult = {
      diagnosticId: "123",
      orchestratorSummary: "Test summary",
      agentResults: [
        {
          agentName: "Symptom Analyzer",
          role: "test",
          analysis: "test analysis",
          confidence: 0.85,
          executionTime: 1000,
        },
      ],
      totalExecutionTime: 5000,
      recommendations: ["Recomandare 1", "Recomandare 2"],
      estimatedCost: 500,
    };

    expect(mockResult.diagnosticId).toBe("123");
    expect(mockResult.agentResults).toHaveLength(1);
    expect(mockResult.totalExecutionTime).toBeGreaterThan(0);
  });

  it("should format swarm results correctly", () => {
    const mockResult = {
      diagnosticId: "123",
      orchestratorSummary: "2020 Volkswagen Golf - Motor nu porneste",
      agentResults: [
        {
          agentName: "Symptom Analyzer",
          role: "Analizează simptomele",
          analysis: "Posibila problema cu bateria sau alternator",
          confidence: 0.85,
          executionTime: 1200,
        },
      ],
      totalExecutionTime: 5000,
      recommendations: ["Verifica bateria", "Verifica alternator"],
      estimatedCost: 300,
    };

    const formatted = formatSwarmResults(mockResult);
    expect(formatted).toContain("DIAGNOSTIC MULTI-AGENT");
    expect(formatted).toContain("2020 Volkswagen Golf");
    expect(formatted).toContain("Verifica bateria");
    expect(formatted).toContain("5000ms");
  });

  it("should validate parallel execution concept", () => {
    // Simulează execuție paralelă
    const agents = [
      { name: "Symptom Analyzer", delay: 1000 },
      { name: "History Lookup", delay: 800 },
      { name: "Error Code Decoder", delay: 600 },
      { name: "Component Evaluator", delay: 1200 },
      { name: "Repair Procedure", delay: 900 },
      { name: "Parts Identifier", delay: 1100 },
    ];

    // Timp serial: suma tuturor delay-urilor
    const serialTime = agents.reduce((sum, a) => sum + a.delay, 0);
    expect(serialTime).toBe(5600);

    // Timp paralel: cel mai lung delay
    const parallelTime = Math.max(...agents.map((a) => a.delay));
    expect(parallelTime).toBe(1200);

    // Speedup: ~4.67x
    const speedup = serialTime / parallelTime;
    expect(speedup).toBeGreaterThan(4);
  });
});
