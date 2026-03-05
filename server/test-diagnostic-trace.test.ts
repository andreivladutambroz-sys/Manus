import { describe, it, expect } from "vitest";
import { analyzeSymptoms } from "./kimi";
import {
  trackKimiResponse,
  trackOEMSource,
  trackUserInput,
  createSourcedResult,
  formatSourcesForDisplay,
  exportSourcesAsJSON,
} from "./services/diagnostic-sources";

describe("Diagnostic Source Tracing - Real Kimi Calls", { timeout: 60000 }, () => {
  it("should trace VW Golf check engine light diagnostic", async () => {
    // Skip if KIMI_API_KEY not set
    if (!process.env.KIMI_API_KEY) {
      console.log("⏭️  Skipping - KIMI_API_KEY not set");
      return;
    }
    const sources = [];

    // Track user input
    sources.push(trackUserInput("Vehicle", "Volkswagen Golf (2015)"));
    sources.push(
      trackUserInput(
        "Symptoms",
        "Engine light on, rough idle, poor acceleration, fuel smell"
      )
    );

    // Track OEM source
    sources.push(trackOEMSource("Volkswagen", "Golf", 2015, "Engine specifications"));

    // Call Kimi
    const kimiResponse = await analyzeSymptoms(
      "Volkswagen",
      "Golf",
      2015,
      "1.6 TDI",
      "Engine light on, rough idle, poor acceleration, fuel smell",
      ["Engine light", "Rough idle", "Fuel smell"]
    );

    // Verify Kimi response structure
    expect(kimiResponse).toBeDefined();
    expect(kimiResponse.probableCauses).toBeDefined();
    expect(kimiResponse.probableCauses.length).toBeGreaterThan(0);

    // Track Kimi response
    const kimiSource = await trackKimiResponse(
      "Diagnose VW Golf check engine light symptoms",
      JSON.stringify(kimiResponse),
      "kimi-latest"
    );
    sources.push(kimiSource);

    // Create sourced result
    const diagnosis = kimiResponse.recommendation || "Diagnostic analysis completed";
    const result = createSourcedResult(diagnosis, sources);

    // Verify result
    expect(result.sourcesSummary.totalSources).toBeGreaterThan(0);
    expect(result.trustScore).toBeGreaterThan(0);

    // Log sources for inspection
    console.log("\n=== VW GOLF DIAGNOSTIC SOURCES ===");
    console.log(formatSourcesForDisplay(result));
    console.log("\nKimi Response:");
    console.log(JSON.stringify(kimiResponse, null, 2));
    console.log("\nSources JSON:");
    console.log(JSON.stringify(exportSourcesAsJSON(result), null, 2));
  });

  it("should trace Mercedes transmission diagnostic", async () => {
    // Skip if KIMI_API_KEY not set
    if (!process.env.KIMI_API_KEY) {
      console.log("⏭️  Skipping - KIMI_API_KEY not set");
      return;
    }
    const sources = [];

    // Track user input
    sources.push(trackUserInput("Vehicle", "Mercedes-Benz C-Class (2018)"));
    sources.push(
      trackUserInput(
        "Symptoms",
        "Transmission slipping, delayed engagement, burning smell"
      )
    );

    // Track OEM source
    sources.push(
      trackOEMSource("Mercedes-Benz", "C-Class", 2018, "Transmission specifications")
    );

    // Call Kimi
    const kimiResponse = await analyzeSymptoms(
      "Mercedes-Benz",
      "C-Class",
      2018,
      "2.0 Diesel",
      "Transmission slipping, delayed engagement, burning smell",
      ["Transmission slipping", "Delayed engagement"]
    );

    // Verify Kimi response structure
    expect(kimiResponse).toBeDefined();
    expect(kimiResponse.probableCauses).toBeDefined();

    // Track Kimi response
    const kimiSource = await trackKimiResponse(
      "Diagnose Mercedes transmission issues",
      JSON.stringify(kimiResponse),
      "kimi-latest"
    );
    sources.push(kimiSource);

    // Create sourced result
    const diagnosis = kimiResponse.recommendation || "Diagnostic analysis completed";
    const result = createSourcedResult(diagnosis, sources);

    // Verify result
    expect(result.sourcesSummary.totalSources).toBeGreaterThan(0);
    expect(result.trustScore).toBeGreaterThan(0);

    // Log sources for inspection
    console.log("\n=== MERCEDES TRANSMISSION DIAGNOSTIC SOURCES ===");
    console.log(formatSourcesForDisplay(result));
    console.log("\nKimi Response:");
    console.log(JSON.stringify(kimiResponse, null, 2));
  });

  it("should trace BMW electrical diagnostic", async () => {
    // Skip if KIMI_API_KEY not set
    if (!process.env.KIMI_API_KEY) {
      console.log("⏭️  Skipping - KIMI_API_KEY not set");
      return;
    }
    const sources = [];

    // Track user input
    sources.push(trackUserInput("Vehicle", "BMW 3 Series (2019)"));
    sources.push(
      trackUserInput(
        "Symptoms",
        "Battery drains quickly, electrical system warning, lights flickering"
      )
    );

    // Track OEM source
    sources.push(
      trackOEMSource("BMW", "3 Series", 2019, "Electrical system specifications")
    );

    // Call Kimi
    const kimiResponse = await analyzeSymptoms(
      "BMW",
      "3 Series",
      2019,
      "2.0 Turbo",
      "Battery drains quickly, electrical system warning, lights flickering",
      ["Battery drain", "Electrical warning", "Flickering lights"]
    );

    // Verify Kimi response structure
    expect(kimiResponse).toBeDefined();
    expect(kimiResponse.probableCauses).toBeDefined();

    // Track Kimi response
    const kimiSource = await trackKimiResponse(
      "Diagnose BMW electrical issues",
      JSON.stringify(kimiResponse),
      "kimi-latest"
    );
    sources.push(kimiSource);

    // Create sourced result
    const diagnosis = kimiResponse.recommendation || "Diagnostic analysis completed";
    const result = createSourcedResult(diagnosis, sources);

    // Verify result
    expect(result.sourcesSummary.totalSources).toBeGreaterThan(0);
    expect(result.trustScore).toBeGreaterThan(0);

    // Log sources for inspection
    console.log("\n=== BMW ELECTRICAL DIAGNOSTIC SOURCES ===");
    console.log(formatSourcesForDisplay(result));
    console.log("\nKimi Response:");
    console.log(JSON.stringify(kimiResponse, null, 2));
  });

  it("should show what Kimi AI actually returns", async () => {
    // Skip if KIMI_API_KEY not set
    if (!process.env.KIMI_API_KEY) {
      console.log("⏭️  Skipping - KIMI_API_KEY not set");
      return;
    }
    // Simple test to see raw Kimi response
    const kimiResponse = await analyzeSymptoms(
      "Volkswagen",
      "Golf",
      2015,
      "1.6 TDI",
      "Engine light on, rough idle",
      ["Engine light", "Rough idle"]
    );

    console.log("\n=== RAW KIMI RESPONSE ===");
    console.log("Response structure:");
    console.log(JSON.stringify(kimiResponse, null, 2));

    console.log("\n=== KIMI RESPONSE ANALYSIS ===");
    console.log(`Probable causes: ${kimiResponse.probableCauses?.length || 0}`);
    console.log(`Error codes: ${kimiResponse.errorCodes?.length || 0}`);
    console.log(`Check order steps: ${kimiResponse.checkOrder?.length || 0}`);
    console.log(`Estimated time: ${kimiResponse.estimatedTime}`);
    console.log(`Estimated cost: ${kimiResponse.estimatedCost}`);
    console.log(`Recommendation: ${kimiResponse.recommendation}`);

    expect(kimiResponse).toBeDefined();
  });
});
