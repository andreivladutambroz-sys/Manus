import { describe, it, expect } from "vitest";
import {
  trackKimiResponse,
  trackOEMSource,
  trackTechnicalManualSource,
  trackForumSource,
  trackPartsAPISource,
  trackMarketDataSource,
  trackUserInput,
  createSourcedResult,
  formatSourcesForDisplay,
  validateDiagnosticSources,
  exportSourcesAsJSON,
} from "./services/diagnostic-sources";

describe("Diagnostic Sources Tracking", () => {
  it("should track Kimi AI responses", async () => {
    const source = await trackKimiResponse(
      "Diagnose engine light",
      "Possible causes: oxygen sensor, catalytic converter...",
      "kimi-latest"
    );

    expect(source.type).toBe("kimi_ai");
    expect(source.name).toContain("Kimi AI");
    expect(source.confidence).toBe(60);
    expect(source.url).toBe("https://api.moonshot.ai");
  });

  it("should track OEM database sources", () => {
    const source = trackOEMSource("Volkswagen", "Golf", 2020, "Engine specifications");

    expect(source.type).toBe("oem_database");
    expect(source.confidence).toBe(98);
    expect(source.name).toContain("OEM");
    expect(source.url).toContain("autodata.com");
  });

  it("should track technical manual sources", () => {
    const source = trackTechnicalManualSource(
      "VW Golf Service Manual",
      "Engine Diagnostics"
    );

    expect(source.type).toBe("technical_manual");
    expect(source.confidence).toBe(90);
    expect(source.description).toContain("Engine Diagnostics");
  });

  it("should track forum sources with confidence based on upvotes", () => {
    const source = trackForumSource(
      "BenzWorld",
      "https://benzworld.org/thread/123",
      "Check engine light diagnosis",
      15
    );

    expect(source.type).toBe("forum");
    expect(source.confidence).toBeGreaterThan(50);
    expect(source.confidence).toBeLessThanOrEqual(85);
    expect(source.url).toContain("benzworld.org");
  });

  it("should track parts API sources", () => {
    const source = trackPartsAPISource("Autodoc", "Oxygen Sensor", 45.99, "in_stock");

    expect(source.type).toBe("parts_api");
    expect(source.confidence).toBe(85);
    expect(source.description).toContain("Oxygen Sensor");
    expect(source.description).toContain("45.99");
  });

  it("should track market data sources", () => {
    const source = trackMarketDataSource("eBay Motors", "Sensor prices", 150);

    expect(source.type).toBe("market_data");
    expect(source.confidence).toBe(75);
    expect(source.description).toContain("150 data points");
  });

  it("should track user input", () => {
    const source = trackUserInput("Symptoms", "Engine light on, rough idle");

    expect(source.type).toBe("user_input");
    expect(source.confidence).toBe(50);
    expect(source.description).toContain("Engine light");
  });

  it("should create sourced diagnostic result with proper statistics", () => {
    const sources = [
      trackOEMSource("Volkswagen", "Golf", 2020, "Engine specs"),
      trackTechnicalManualSource("VW Manual", "Diagnostics"),
      trackForumSource("BenzWorld", "https://benzworld.org", "Discussion", 10),
      trackPartsAPISource("Autodoc", "Sensor", 45.99, "in_stock"),
    ];

    const result = createSourcedResult("Faulty oxygen sensor", sources);

    expect(result.diagnosis).toBe("Faulty oxygen sensor");
    expect(result.sourcesSummary.totalSources).toBe(4);
    expect(result.sourcesSummary.verifiedSources).toBeGreaterThan(0);
    expect(result.trustScore).toBeGreaterThan(0);
    expect(result.trustScore).toBeLessThanOrEqual(100);
  });

  it("should boost trust score with multiple verified sources", () => {
    const sources = [
      trackOEMSource("Volkswagen", "Golf", 2020, "Engine specs"),
      trackTechnicalManualSource("VW Manual", "Diagnostics"),
      trackOEMSource("Volkswagen", "Golf", 2020, "Sensor info"),
    ];

    const result = createSourcedResult("Diagnosis", sources);

    expect(result.sourcesSummary.verifiedSources).toBe(3);
    expect(result.trustScore).toBeGreaterThan(80);
  });

  it("should reduce trust score with only AI sources", async () => {
    const sources = [
      await trackKimiResponse("Diagnose", "Response 1"),
      await trackKimiResponse("Diagnose", "Response 2"),
    ];

    const result = createSourcedResult("AI-only diagnosis", sources);

    expect(result.trustScore).toBeLessThanOrEqual(65);
  });

  it("should format sources for display", () => {
    const sources = [
      trackOEMSource("Volkswagen", "Golf", 2020, "Engine specs"),
      trackPartsAPISource("Autodoc", "Sensor", 45.99, "in_stock"),
    ];

    const result = createSourcedResult("Diagnosis", sources);
    const formatted = formatSourcesForDisplay(result);

    expect(formatted).toContain("Diagnostic Sources");
    expect(formatted).toContain("Trust Score");
    expect(formatted).toContain("OEM Database");
    expect(formatted).toContain("Autodoc");
  });

  it("should validate diagnostic sources", () => {
    const sources = [
      trackOEMSource("Volkswagen", "Golf", 2020, "Engine specs"),
      trackTechnicalManualSource("VW Manual", "Diagnostics"),
    ];

    const result = createSourcedResult("Valid diagnosis", sources);
    const validation = validateDiagnosticSources(result);

    expect(validation.isValid).toBe(true);
    expect(validation.issues.length).toBe(0);
  });

  it("should detect invalid diagnosis with no sources", () => {
    const result = createSourcedResult("Diagnosis", []);
    const validation = validateDiagnosticSources(result);

    expect(validation.isValid).toBe(false);
    expect(validation.issues.length).toBeGreaterThan(0);
    expect(validation.issues[0]).toContain("Nu au fost găsite surse");
  });

  it("should detect diagnosis with only unverified sources", async () => {
    const sources = [
      trackUserInput("Symptoms", "Engine light"),
      await trackKimiResponse("Diagnose", "Response"),
    ];

    const result = createSourcedResult("Diagnosis", sources);
    const validation = validateDiagnosticSources(result);

    expect(validation.isValid).toBe(false);
  });

  it("should export sources as JSON", () => {
    const sources = [
      trackOEMSource("Volkswagen", "Golf", 2020, "Engine specs"),
      trackPartsAPISource("Autodoc", "Sensor", 45.99, "in_stock"),
    ];

    const result = createSourcedResult("Diagnosis", sources);
    const json = exportSourcesAsJSON(result);

    expect(json.diagnosis).toBe("Diagnosis");
    expect(json.trustScore).toBeGreaterThan(0);
    expect(json.sources).toHaveLength(2);
    expect(json.sources[0].type).toBe("oem_database");
    expect(json.sources[1].type).toBe("parts_api");
  });

  it("should create comprehensive diagnostic with mixed sources", async () => {
    const sources = [
      // Verified sources
      trackOEMSource("Volkswagen", "Golf", 2020, "Engine specifications"),
      trackTechnicalManualSource("VW Golf Service Manual", "Engine Diagnostics"),
      trackOEMSource("Volkswagen", "Golf", 2020, "Sensor specifications"),

      // Market data
      trackPartsAPISource("Autodoc", "Oxygen Sensor", 45.99, "in_stock"),
      trackPartsAPISource("eBay Motors", "Oxygen Sensor", 42.50, "in_stock"),

      // Community feedback
      trackForumSource(
        "BenzWorld",
        "https://benzworld.org/thread/123",
        "Oxygen sensor replacement guide",
        25
      ),

      // User input
      trackUserInput("Symptoms", "Check engine light, rough idle"),
      trackUserInput("Error Code", "P0135"),
    ];

    const diagnosis = "Faulty oxygen sensor (O2 sensor) - needs replacement";
    const result = createSourcedResult(diagnosis, sources);

    // Validate result
    expect(result.sourcesSummary.totalSources).toBe(8);
    expect(result.sourcesSummary.verifiedSources).toBeGreaterThanOrEqual(3);
    expect(result.trustScore).toBeGreaterThan(70);

    // Validate formatting
    const formatted = formatSourcesForDisplay(result);
    expect(formatted).toContain("✅"); // Verified sources
    expect(formatted).toContain("OEM Database");
    expect(formatted).toContain("Autodoc");

    // Validate JSON export
    const json = exportSourcesAsJSON(result);
    expect(json.sources).toHaveLength(8);
    expect(json.sources.some((s: any) => s.type === "oem_database")).toBe(true);
    expect(json.sources.some((s: any) => s.type === "parts_api")).toBe(true);
    expect(json.sources.some((s: any) => s.type === "forum")).toBe(true);
  });
});
