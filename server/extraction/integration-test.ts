/**
 * INTEGRATION TEST - Full Extraction Pipeline
 * Tests all 7 phases end-to-end
 */

import { ExtractionPipeline } from './extraction-pipeline';
import { getRealCollectors } from './collectors-forum';
import { calculateQualityMetrics } from './quality-reporter';
import { validateBatch } from './validation-layer';

export async function runIntegrationTest() {
  console.log('🧪 STARTING INTEGRATION TEST\n');
  console.log('='.repeat(60));

  const startTime = Date.now();

  try {
    // Initialize pipeline
    const pipeline = new ExtractionPipeline({
      batchSize: 50,
      maxRecords: 40000,
      enableCaching: true,
      enableCompression: true,
      enableDeduplication: true,
      validationThreshold: 0.70
    });

    // Get real collectors
    const collectors = getRealCollectors();
    console.log(`\n📦 Initialized ${collectors.length} real collectors\n`);

    // Create mock sources
    const sources = [
      { domain: 'bmwforums.co.uk', name: 'BMW Forums' },
      { domain: 'reddit.com/r/MechanicAdvice', name: 'r/MechanicAdvice' },
      { domain: 'haynes.com', name: 'Haynes Manuals' }
    ];

    // Execute pipeline
    console.log('🚀 Executing extraction pipeline...\n');
    const result = await pipeline.execute(sources);

    // Analyze results
    console.log('\n' + '='.repeat(60));
    console.log('📊 PIPELINE RESULTS\n');

    const records = result.records;
    console.log(`Total Records Collected: ${records.length}`);

    // Validate records
    const validationResult = validateBatch(records);
    console.log(`Valid Records: ${validationResult.valid}`);
    console.log(`Invalid Records: ${validationResult.invalid}`);
    console.log(`Validation Pass Rate: ${validationResult.validationPassRate.toFixed(2)}%`);

    // Calculate quality metrics
    const metrics = calculateQualityMetrics(records, validationResult);

    console.log('\n📈 QUALITY METRICS\n');
    console.log(`Acceptance Rate: ${metrics.acceptanceRate.toFixed(2)}%`);
    console.log(`Avg Confidence: ${metrics.avgConfidence.toFixed(2)}`);
    console.log(`Avg Quality Score: ${metrics.avgScore}/100`);
    console.log(`Avg Symptoms/Record: ${metrics.avgSymptoms.toFixed(2)}`);
    console.log(`Avg Repair Steps: ${metrics.avgRepairSteps.toFixed(2)}`);
    console.log(`Avg Tools/Record: ${metrics.avgTools.toFixed(2)}`);
    console.log(`Torque Specs Coverage: ${metrics.torqueSpecsCoverage.toFixed(2)}%`);
    console.log(`Evidence Coverage: ${metrics.evidenceCoverage.toFixed(2)}%`);

    // Top error codes
    console.log('\n🔧 TOP ERROR CODES\n');
    metrics.topErrorCodes.slice(0, 5).forEach((ec, i) => {
      console.log(`${i + 1}. ${ec.code}: ${ec.count} records`);
    });

    // Top vehicles
    console.log('\n🚗 TOP VEHICLES\n');
    metrics.topVehicles.slice(0, 5).forEach((v, i) => {
      console.log(`${i + 1}. ${v.vehicle}: ${v.count} records`);
    });

    // Cache statistics
    const cacheStats = pipeline.getCacheStats();
    console.log('\n💾 CACHE STATISTICS\n');
    console.log(`Total Requests: ${cacheStats.totalRequests}`);
    console.log(`Cache Hits: ${cacheStats.cacheHits}`);
    console.log(`Cache Misses: ${cacheStats.cacheMisses}`);
    console.log(`Hit Rate: ${cacheStats.hitRate.toFixed(2)}%`);
    console.log(`Cost Savings: $${cacheStats.costSavings.toFixed(2)}`);

    // Pipeline results
    console.log('\n📋 PIPELINE PHASES\n');
    result.results.forEach((r, i) => {
      const status = r.status === 'success' ? '✅' : r.status === 'warning' ? '⚠️' : '❌';
      console.log(`${status} ${r.phase}: ${r.recordsAccepted}/${r.recordsProcessed} records`);
    });

    // Final assessment
    console.log('\n' + '='.repeat(60));
    console.log('🎯 FINAL ASSESSMENT\n');

    const isProduction = metrics.acceptanceRate >= 90 && metrics.avgConfidence >= 0.80;
    const status = isProduction ? '✅ PRODUCTION READY' : '⚠️ NEEDS OPTIMIZATION';

    console.log(`Status: ${status}`);
    console.log(`Quality Score: ${metrics.avgScore}/100`);
    console.log(`Recommendation: ${isProduction ? 'Ready for deployment' : 'Requires optimization before deployment'}`);

    // Timing
    const elapsed = (Date.now() - startTime) / 1000;
    console.log(`\nExecution Time: ${elapsed.toFixed(2)}s`);
    console.log(`Records/Second: ${(records.length / elapsed).toFixed(2)}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ INTEGRATION TEST COMPLETE\n');

    return {
      success: true,
      records,
      metrics,
      isProduction,
      elapsed
    };
  } catch (error) {
    console.error('\n❌ INTEGRATION TEST FAILED\n');
    console.error(error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Run test if executed directly
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = __filename.split('/').slice(0, -1).join('/');

if (process.argv[1] === __filename) {
  runIntegrationTest().then(result => {
    process.exit(result.success ? 0 : 1);
  });
}

export default runIntegrationTest;
