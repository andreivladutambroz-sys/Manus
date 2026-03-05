/**
 * Test Diagnostic Trace
 * Runs a real diagnostic and logs all sources used by Kimi
 */

import { analyzeSymptoms } from "./kimi";
import {
  trackKimiResponse,
  trackOEMSource,
  trackUserInput,
  createSourcedResult,
  formatSourcesForDisplay,
  logDiagnosticSources,
  exportSourcesAsJSON,
} from "./services/diagnostic-sources";

/**
 * Test Case 1: VW Golf - Check Engine Light
 */
export async function testDiagnosticTrace1() {
  console.log("\n" + "=".repeat(80));
  console.log("TEST DIAGNOSTIC TRACE #1: VW Golf - Check Engine Light");
  console.log("=".repeat(80) + "\n");

  const sources = [];

  // Track user input
  sources.push(trackUserInput("Vehicle", "Volkswagen Golf (2015)"));
  sources.push(
    trackUserInput(
      "Symptoms",
      "Engine light on, rough idle, poor acceleration, fuel smell"
    )
  );
  sources.push(
    trackUserInput("Selected Symptoms", "Engine light, Rough idle, Fuel smell")
  );

  // Track OEM source
  sources.push(trackOEMSource("Volkswagen", "Golf", 2015, "Engine specifications"));

  try {
    console.log("📊 Calling Kimi AI for analysis...\n");

    const kimiResponse = await analyzeSymptoms(
      "Volkswagen",
      "Golf",
      2015,
      "1.6 TDI",
      "Engine light on, rough idle, poor acceleration, fuel smell",
      ["Engine light", "Rough idle", "Fuel smell"]
    );

    console.log("✅ Kimi Response Received:\n");
    console.log(JSON.stringify(kimiResponse, null, 2));
    console.log("\n");

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

    console.log("📋 DIAGNOSTIC SOURCES SUMMARY:\n");
    console.log(formatSourcesForDisplay(result));

    console.log("📊 TRUST SCORE ANALYSIS:");
    console.log(`  Total Sources: ${result.sourcesSummary.totalSources}`);
    console.log(`  Verified Sources: ${result.sourcesSummary.verifiedSources}`);
    console.log(`  Unverified Sources: ${result.sourcesSummary.unverifiedSources}`);
    console.log(`  Average Confidence: ${result.sourcesSummary.averageConfidence}%`);
    console.log(`  Final Trust Score: ${result.trustScore}%\n`);

    console.log("📤 JSON EXPORT FOR API:");
    console.log(JSON.stringify(exportSourcesAsJSON(result), null, 2));

    // Log for audit
    logDiagnosticSources("test-diagnostic-1", result);

    return result;
  } catch (error) {
    console.error("❌ Error in diagnostic trace:", error);
    throw error;
  }
}

/**
 * Test Case 2: Mercedes - Transmission Issues
 */
export async function testDiagnosticTrace2() {
  console.log("\n" + "=".repeat(80));
  console.log("TEST DIAGNOSTIC TRACE #2: Mercedes - Transmission Issues");
  console.log("=".repeat(80) + "\n");

  const sources = [];

  // Track user input
  sources.push(trackUserInput("Vehicle", "Mercedes-Benz C-Class (2018)"));
  sources.push(
    trackUserInput(
      "Symptoms",
      "Transmission slipping, delayed engagement, burning smell"
    )
  );
  sources.push(
    trackUserInput("Selected Symptoms", "Transmission slipping, Delayed engagement")
  );

  // Track OEM source
  sources.push(
    trackOEMSource("Mercedes-Benz", "C-Class", 2018, "Transmission specifications")
  );

  try {
    console.log("📊 Calling Kimi AI for analysis...\n");

    const kimiResponse = await analyzeSymptoms(
      "Mercedes-Benz",
      "C-Class",
      2018,
      "2.0 Diesel",
      "Transmission slipping, delayed engagement, burning smell",
      ["Transmission slipping", "Delayed engagement"]
    );

    console.log("✅ Kimi Response Received:\n");
    console.log(JSON.stringify(kimiResponse, null, 2));
    console.log("\n");

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

    console.log("📋 DIAGNOSTIC SOURCES SUMMARY:\n");
    console.log(formatSourcesForDisplay(result));

    console.log("📊 TRUST SCORE ANALYSIS:");
    console.log(`  Total Sources: ${result.sourcesSummary.totalSources}`);
    console.log(`  Verified Sources: ${result.sourcesSummary.verifiedSources}`);
    console.log(`  Unverified Sources: ${result.sourcesSummary.unverifiedSources}`);
    console.log(`  Average Confidence: ${result.sourcesSummary.averageConfidence}%`);
    console.log(`  Final Trust Score: ${result.trustScore}%\n`);

    console.log("📤 JSON EXPORT FOR API:");
    console.log(JSON.stringify(exportSourcesAsJSON(result), null, 2));

    // Log for audit
    logDiagnosticSources("test-diagnostic-2", result);

    return result;
  } catch (error) {
    console.error("❌ Error in diagnostic trace:", error);
    throw error;
  }
}

/**
 * Test Case 3: BMW - Electrical Issues
 */
export async function testDiagnosticTrace3() {
  console.log("\n" + "=".repeat(80));
  console.log("TEST DIAGNOSTIC TRACE #3: BMW - Electrical Issues");
  console.log("=".repeat(80) + "\n");

  const sources = [];

  // Track user input
  sources.push(trackUserInput("Vehicle", "BMW 3 Series (2019)"));
  sources.push(
    trackUserInput(
      "Symptoms",
      "Battery drains quickly, electrical system warning, lights flickering"
    )
  );
  sources.push(
    trackUserInput("Selected Symptoms", "Battery drain, Electrical warning, Flickering lights")
  );

  // Track OEM source
  sources.push(
    trackOEMSource("BMW", "3 Series", 2019, "Electrical system specifications")
  );

  try {
    console.log("📊 Calling Kimi AI for analysis...\n");

    const kimiResponse = await analyzeSymptoms(
      "BMW",
      "3 Series",
      2019,
      "2.0 Turbo",
      "Battery drains quickly, electrical system warning, lights flickering",
      ["Battery drain", "Electrical warning", "Flickering lights"]
    );

    console.log("✅ Kimi Response Received:\n");
    console.log(JSON.stringify(kimiResponse, null, 2));
    console.log("\n");

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

    console.log("📋 DIAGNOSTIC SOURCES SUMMARY:\n");
    console.log(formatSourcesForDisplay(result));

    console.log("📊 TRUST SCORE ANALYSIS:");
    console.log(`  Total Sources: ${result.sourcesSummary.totalSources}`);
    console.log(`  Verified Sources: ${result.sourcesSummary.verifiedSources}`);
    console.log(`  Unverified Sources: ${result.sourcesSummary.unverifiedSources}`);
    console.log(`  Average Confidence: ${result.sourcesSummary.averageConfidence}%`);
    console.log(`  Final Trust Score: ${result.trustScore}%\n`);

    console.log("📤 JSON EXPORT FOR API:");
    console.log(JSON.stringify(exportSourcesAsJSON(result), null, 2));

    // Log for audit
    logDiagnosticSources("test-diagnostic-3", result);

    return result;
  } catch (error) {
    console.error("❌ Error in diagnostic trace:", error);
    throw error;
  }
}

/**
 * Run all test diagnostics
 */
export async function runAllDiagnosticTraces() {
  console.log("\n" + "🔍".repeat(40));
  console.log("RUNNING ALL DIAGNOSTIC SOURCE TRACES");
  console.log("🔍".repeat(40));

  try {
    const results = [];

    // Test 1
    results.push(await testDiagnosticTrace1());

    // Test 2
    results.push(await testDiagnosticTrace2());

    // Test 3
    results.push(await testDiagnosticTrace3());

    console.log("\n" + "=".repeat(80));
    console.log("SUMMARY OF ALL DIAGNOSTIC TRACES");
    console.log("=".repeat(80) + "\n");

    results.forEach((result, idx) => {
      console.log(`Test ${idx + 1}:`);
      console.log(`  Trust Score: ${result.trustScore}%`);
      console.log(`  Total Sources: ${result.sourcesSummary.totalSources}`);
      console.log(`  Verified: ${result.sourcesSummary.verifiedSources}`);
      console.log();
    });

    console.log("✅ All diagnostic traces completed successfully!\n");
  } catch (error) {
    console.error("❌ Error running diagnostic traces:", error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runAllDiagnosticTraces().catch(console.error);
}
