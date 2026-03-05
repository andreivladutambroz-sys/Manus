import { describe, it, expect } from "vitest";
import {
  trackKimiResponse,
  trackOEMSource,
  trackTechnicalManualSource,
  trackForumSource,
  trackPartsAPISource,
  trackUserInput,
  createSourcedResult,
  formatSourcesForDisplay,
  validateDiagnosticSources,
  exportSourcesAsJSON,
} from "./services/diagnostic-sources";

describe("Diagnostic Sources Integration", () => {
  it("should create complete diagnostic with all source types", () => {
    // Simulate a comprehensive diagnostic with multiple source types
    const sources = [
      // User input
      trackUserInput("Vehicle", "Volkswagen Golf (2015)"),
      trackUserInput("Symptoms", "Engine light on, rough idle, poor acceleration"),
      trackUserInput("Error Code", "P0135"),

      // OEM sources (highest confidence)
      trackOEMSource("Volkswagen", "Golf", 2015, "Engine specifications"),
      trackOEMSource("Volkswagen", "Golf", 2015, "Oxygen sensor specifications"),

      // Technical manuals
      trackTechnicalManualSource("VW Golf Service Manual", "Engine Diagnostics"),
      trackTechnicalManualSource("VW Golf Service Manual", "Oxygen Sensor Replacement"),

      // Forum discussions
      trackForumSource(
        "VWVortex",
        "https://vwvortex.com/forums/oxygen-sensor",
        "Oxygen sensor P0135 diagnosis",
        42
      ),
      trackForumSource(
        "BenzWorld",
        "https://benzworld.org/forums/diagnosis",
        "Check engine light troubleshooting",
        28
      ),

      // Parts pricing
      trackPartsAPISource("Autodoc", "Oxygen Sensor", 45.99, "in_stock"),
      trackPartsAPISource("eBay Motors", "Oxygen Sensor", 42.50, "in_stock"),
      trackPartsAPISource("Emag", "Oxygen Sensor", 52.00, "in_stock"),
    ];

    // Create diagnostic result
    const diagnosis = "Faulty oxygen sensor (O2 sensor) - needs replacement";
    const result = createSourcedResult(diagnosis, sources);

    // Verify result structure
    expect(result.diagnosis).toBe(diagnosis);
    expect(result.sourcesSummary.totalSources).toBe(12); // 2 user inputs + 2 OEM + 2 manuals + 2 forums + 3 parts
    expect(result.sourcesSummary.verifiedSources).toBeGreaterThan(5);
    expect(result.trustScore).toBeGreaterThan(70);

    // Verify validation passes
    const validation = validateDiagnosticSources(result);
    expect(validation.isValid).toBe(true);

    // Verify formatting works
    const formatted = formatSourcesForDisplay(result);
    expect(formatted).toContain("Diagnostic Sources");
    expect(formatted).toContain("Trust Score");
    expect(formatted).toContain("OEM Database");

    // Verify JSON export
    const json = exportSourcesAsJSON(result);
    expect(json.sources).toHaveLength(12);
    expect(json.trustScore).toBe(result.trustScore);

    console.log("\n=== COMPREHENSIVE DIAGNOSTIC RESULT ===");
    console.log(formatted);
    console.log("\n=== TRUST SCORE BREAKDOWN ===");
    console.log(`Total Sources: ${result.sourcesSummary.totalSources}`);
    console.log(`Verified (≥75% confidence): ${result.sourcesSummary.verifiedSources}`);
    console.log(`Unverified (<75% confidence): ${result.sourcesSummary.unverifiedSources}`);
    console.log(`Average Confidence: ${result.sourcesSummary.averageConfidence}%`);
    console.log(`Final Trust Score: ${result.trustScore}%`);
  });

  it("should show source confidence hierarchy", () => {
    const sources = [
      trackOEMSource("Volkswagen", "Golf", 2015, "Specs"), // 98%
      trackTechnicalManualSource("Manual", "Section"), // 90%
      trackForumSource("Forum", "url", "Title", 20), // ~80%
      trackPartsAPISource("Autodoc", "Part", 45.99, "in_stock"), // 85%
      trackUserInput("Symptom", "Engine light"), // 50%
    ];

    console.log("\n=== SOURCE CONFIDENCE HIERARCHY ===");
    sources.forEach((source) => {
      const badge =
        source.confidence >= 90
          ? "🟢"
          : source.confidence >= 75
          ? "🟡"
          : "🔴";
      console.log(`${badge} ${source.name}: ${source.confidence}% - ${source.description}`);
    });

    const result = createSourcedResult("Diagnosis", sources);
    expect(result.sourcesSummary.verifiedSources).toBe(4);
  });

  it("should detect weak diagnostics", () => {
    const weakSources = [
      trackUserInput("Symptom", "Engine light"),
      trackUserInput("Symptom", "Rough idle"),
    ];

    const result = createSourcedResult("Weak diagnosis", weakSources);
    const validation = validateDiagnosticSources(result);

    expect(validation.isValid).toBe(false);
    expect(validation.issues.length).toBeGreaterThan(0);

    console.log("\n=== WEAK DIAGNOSTIC ISSUES ===");
    validation.issues.forEach((issue) => {
      console.log(`⚠️  ${issue}`);
    });
  });

  it("should show parts pricing sources", () => {
    const sources = [
      trackUserInput("Vehicle", "VW Golf 2015"),
      trackUserInput("Part", "Oxygen Sensor"),
      trackPartsAPISource("Autodoc", "Oxygen Sensor", 45.99, "in_stock"),
      trackPartsAPISource("Autodata", "Oxygen Sensor", 48.50, "in_stock"),
      trackPartsAPISource("eBay Motors", "Oxygen Sensor", 42.50, "in_stock"),
      trackPartsAPISource("Emag", "Oxygen Sensor", 52.00, "in_stock"),
    ];

    const result = createSourcedResult("Oxygen Sensor pricing", sources);

    console.log("\n=== PARTS PRICING SOURCES ===");
    console.log(formatSourcesForDisplay(result));

    expect(result.sourcesSummary.totalSources).toBe(6);
    expect(result.sourcesSummary.verifiedSources).toBe(4); // Parts APIs are 85% confidence
  });

  it("should demonstrate source attribution in API response", () => {
    const sources = [
      trackOEMSource("Volkswagen", "Golf", 2015, "Engine specifications"),
      trackTechnicalManualSource("VW Golf Service Manual", "Engine Diagnostics"),
      trackPartsAPISource("Autodoc", "Oxygen Sensor", 45.99, "in_stock"),
      trackForumSource("VWVortex", "https://vwvortex.com", "P0135 diagnosis", 35),
    ];

    const result = createSourcedResult("Oxygen sensor failure", sources);
    const json = exportSourcesAsJSON(result);

    console.log("\n=== API RESPONSE WITH SOURCE ATTRIBUTION ===");
    console.log(JSON.stringify(json, null, 2));

    // Verify API response structure
    expect(json.diagnosis).toBeDefined();
    expect(json.trustScore).toBeDefined();
    expect(json.sourcesSummary).toBeDefined();
    expect(json.sources).toBeDefined();
    expect(json.sources[0].type).toBeDefined();
    expect(json.sources[0].name).toBeDefined();
    expect(json.sources[0].url).toBeDefined();
    expect(json.sources[0].confidence).toBeDefined();
  });

  it("should show how Kimi AI is tracked as a source", async () => {
    // Simulate Kimi response
    const kimiResponse = {
      probableCauses: [
        { cause: "Faulty oxygen sensor", probability: 85 },
        { cause: "Wiring issue", probability: 10 },
      ],
      errorCodes: ["P0135"],
      checkOrder: ["Check oxygen sensor", "Check wiring"],
      estimatedTime: "1-2 hours",
      estimatedCost: "50-100 EUR",
      recommendation: "Replace oxygen sensor",
    };

    const sources = [
      trackOEMSource("Volkswagen", "Golf", 2015, "Engine specs"),
      await trackKimiResponse(
        "Diagnose oxygen sensor",
        JSON.stringify(kimiResponse),
        "kimi-latest"
      ),
    ];

    const result = createSourcedResult("Oxygen sensor diagnosis", sources);

    console.log("\n=== KIMI AI AS A SOURCE ===");
    console.log(formatSourcesForDisplay(result));

    // Kimi is tracked but with lower confidence
    const kimiSource = sources.find((s) => s.type === "kimi_ai");
    expect(kimiSource).toBeDefined();
    expect(kimiSource?.confidence).toBe(60); // AI sources are lower confidence
  });
});
