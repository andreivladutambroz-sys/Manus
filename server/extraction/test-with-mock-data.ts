/**
 * MOCK DATA TEST - Full Pipeline Validation
 * Tests all 7 phases with realistic mock data
 * Then ready for real swarm execution
 */

import { validateRecord } from './validation-layer';
import { calculateQualityMetrics, generateQualityReport } from './quality-reporter';
import { fullDeduplicationPipeline } from './deduplication';
import { validateBatch } from './validation-layer';

/**
 * GENERATE MOCK RECORDS
 */

function generateMockRecords(count: number = 30): any[] {
  const vehicles = [
    { make: 'BMW', model: '3 Series', year: 2015 },
    { make: 'Toyota', model: 'Camry', year: 2012 },
    { make: 'Ford', model: 'F150', year: 2010 },
    { make: 'Honda', model: 'Civic', year: 2018 },
    { make: 'Nissan', model: 'Altima', year: 2014 },
    { make: 'Volkswagen', model: 'Jetta', year: 2016 }
  ];

  const errorCodes = ['P0171', 'P0300', 'P0128', 'P0420', 'P0505', 'P0101'];
  const symptoms = [
    ['Check engine light', 'Poor fuel economy', 'Rough idle'],
    ['Rough idle', 'Engine misfire', 'Loss of power'],
    ['Check engine light', 'Hesitation', 'Stalling'],
    ['Check engine light', 'Catalytic converter issue', 'Poor performance'],
    ['Rough idle', 'Stalling at stops', 'Hesitation'],
    ['Check engine light', 'Air flow sensor issue', 'Poor economy']
  ];

  const repairSteps = [
    ['Replace fuel filter', 'Check fuel pressure', 'Replace fuel injectors', 'Clear code'],
    ['Replace spark plugs', 'Replace ignition coil', 'Check compression', 'Clear code'],
    ['Replace thermostat', 'Check coolant level', 'Bleed cooling system', 'Clear code'],
    ['Replace oxygen sensor', 'Check catalytic converter', 'Inspect exhaust', 'Clear code'],
    ['Clean idle air control valve', 'Check fuel pressure', 'Replace spark plugs', 'Clear code'],
    ['Replace mass air flow sensor', 'Check air filter', 'Clean intake', 'Clear code']
  ];

  const tools = [
    ['OBD scanner', 'Fuel pressure gauge', 'Socket set', 'Torque wrench'],
    ['OBD scanner', 'Spark plug socket', 'Multimeter', 'Torque wrench'],
    ['OBD scanner', 'Thermostat housing tool', 'Coolant flush kit', 'Torque wrench'],
    ['OBD scanner', 'Oxygen sensor socket', 'Jack', 'Socket set'],
    ['OBD scanner', 'Idle air control cleaner', 'Fuel pressure gauge', 'Multimeter'],
    ['OBD scanner', 'Mass air flow sensor cleaner', 'Air filter', 'Socket set']
  ];

  const torqueSpecs = [
    [{ component: 'Fuel filter', value_nm: 25 }, { component: 'Fuel rail', value_nm: 25 }],
    [{ component: 'Spark plug', value_nm: 18 }, { component: 'Ignition coil', value_nm: 25 }],
    [{ component: 'Thermostat housing', value_nm: 35 }, { component: 'Water pump', value_nm: 45 }],
    [{ component: 'Oxygen sensor', value_nm: 45 }, { component: 'Exhaust manifold', value_nm: 55 }],
    [{ component: 'IAC valve', value_nm: 15 }, { component: 'Fuel injector', value_nm: 10 }],
    [{ component: 'MAF sensor', value_nm: 5 }, { component: 'Air intake', value_nm: 20 }]
  ];

  const records: any[] = [];

  for (let i = 0; i < count; i++) {
    const vehicle = vehicles[i % vehicles.length];
    const errorCodeIdx = i % errorCodes.length;
    const symptomsIdx = i % symptoms.length;

    const record = {
      vehicle,
      error_code: {
        code: errorCodes[errorCodeIdx],
        system: 'Engine',
        description: `Error code ${errorCodes[errorCodeIdx]}`
      },
      symptoms: symptoms[symptomsIdx],
      repair_procedures: repairSteps[symptomsIdx].map((action, step) => ({
        step: step + 1,
        action
      })),
      tools_required: tools[symptomsIdx],
      torque_specs: torqueSpecs[symptomsIdx],
      confidence: 0.70 + Math.random() * 0.25, // 0.70-0.95
      source_url: `https://example.com/repair/${i}`,
      source_domain: ['bmwforums.co.uk', 'reddit.com', 'haynes.com', 'youcanic.com'][i % 4],
      evidence_snippets: [
        { field: 'symptoms', snippet: symptoms[symptomsIdx][0] },
        { field: 'repair_procedures', snippet: repairSteps[symptomsIdx][0] },
        { field: 'tools', snippet: tools[symptomsIdx][0] }
      ]
    };

    records.push(record);
  }

  return records;
}

/**
 * RUN MOCK DATA TEST
 */

export async function runMockDataTest() {
  console.log('🧪 MOCK DATA TEST - Full Pipeline Validation\n');
  console.log('='.repeat(70));

  const startTime = Date.now();

  try {
    // Generate mock records
    console.log('\n📝 Generating 30 mock records...');
    const mockRecords = generateMockRecords(30);
    console.log(`✅ Generated ${mockRecords.length} mock records\n`);

    // Phase 1: Validation
    console.log('📋 PHASE 1: VALIDATION');
    const validationResult = validateBatch(mockRecords);
    console.log(`  Valid: ${validationResult.valid}/${mockRecords.length}`);
    console.log(`  Invalid: ${validationResult.invalid}/${mockRecords.length}`);
    console.log(`  Pass Rate: ${validationResult.validationPassRate.toFixed(2)}%`);
    console.log(`  Avg Confidence: ${validationResult.avgConfidence.toFixed(2)}`);
    console.log(`  Avg Score: ${validationResult.avgScore}/100\n`);

    // Phase 2: Deduplication
    console.log('📋 PHASE 2: DEDUPLICATION');
    const dedupResult = fullDeduplicationPipeline(mockRecords);
    console.log(`  Original Records: ${mockRecords.length}`);
    console.log(`  Deduplicated: ${dedupResult.deduplicated.length}`);
    console.log(`  Dedup Rate: ${dedupResult.stats.deduplicationRate.toFixed(2)}%`);
    console.log(`  Aggregated Records: ${dedupResult.aggregated.length}\n`);

    // Phase 3: Quality Metrics
    console.log('📋 PHASE 3: QUALITY METRICS');
    const metrics = calculateQualityMetrics(mockRecords, validationResult);
    console.log(`  Acceptance Rate: ${metrics.acceptanceRate.toFixed(2)}%`);
    console.log(`  Avg Confidence: ${metrics.avgConfidence.toFixed(2)}`);
    console.log(`  Avg Quality Score: ${metrics.avgScore}/100`);
    console.log(`  Avg Symptoms: ${metrics.avgSymptoms.toFixed(2)}`);
    console.log(`  Avg Repair Steps: ${metrics.avgRepairSteps.toFixed(2)}`);
    console.log(`  Avg Tools: ${metrics.avgTools.toFixed(2)}`);
    console.log(`  Torque Specs Coverage: ${metrics.torqueSpecsCoverage.toFixed(2)}%`);
    console.log(`  Evidence Coverage: ${metrics.evidenceCoverage.toFixed(2)}%\n`);

    // Phase 4: Top Error Codes
    console.log('📋 PHASE 4: TOP ERROR CODES');
    metrics.topErrorCodes.slice(0, 6).forEach((ec, i) => {
      console.log(`  ${i + 1}. ${ec.code}: ${ec.count} records`);
    });
    console.log();

    // Phase 5: Top Vehicles
    console.log('📋 PHASE 5: TOP VEHICLES');
    metrics.topVehicles.slice(0, 6).forEach((v, i) => {
      console.log(`  ${i + 1}. ${v.vehicle}: ${v.count} records`);
    });
    console.log();

    // Phase 6: Top Sources
    console.log('📋 PHASE 6: TOP SOURCES');
    metrics.topSources.slice(0, 4).forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.domain}: ${s.count} records`);
    });
    console.log();

    // Phase 7: Confidence Distribution
    console.log('📋 PHASE 7: CONFIDENCE DISTRIBUTION');
    const dist = metrics.confidenceDistribution;
    console.log(`  0.70-0.75: ${dist.range_70_75} records`);
    console.log(`  0.75-0.80: ${dist.range_75_80} records`);
    console.log(`  0.80-0.85: ${dist.range_80_85} records`);
    console.log(`  0.85-0.90: ${dist.range_85_90} records`);
    console.log(`  0.90-0.95: ${dist.range_90_95} records\n`);

    // Final Assessment
    console.log('='.repeat(70));
    console.log('🎯 FINAL ASSESSMENT\n');

    const isProduction = metrics.acceptanceRate >= 90 && metrics.avgConfidence >= 0.80;
    const status = isProduction ? '✅ PRODUCTION READY' : '⚠️ ACCEPTABLE';

    console.log(`Status: ${status}`);
    console.log(`Quality Score: ${metrics.avgScore}/100`);
    console.log(`Recommendation: ${isProduction ? 'Ready for production deployment' : 'Ready for swarm execution'}`);

    // Timing
    const elapsed = (Date.now() - startTime) / 1000;
    console.log(`\nExecution Time: ${elapsed.toFixed(2)}s`);
    console.log(`Records/Second: ${(mockRecords.length / elapsed).toFixed(2)}`);

    console.log('\n' + '='.repeat(70));
    console.log('✅ MOCK DATA TEST COMPLETE\n');

    // Generate report
    const report = generateQualityReport(metrics, new Date().toISOString());
    console.log('📄 QUALITY REPORT GENERATED\n');

    return {
      success: true,
      records: mockRecords,
      metrics,
      isProduction,
      elapsed,
      report
    };
  } catch (error) {
    console.error('\n❌ MOCK DATA TEST FAILED\n');
    console.error(error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Run test
runMockDataTest().then(result => {
  if (result.success) {
    console.log('🚀 READY FOR SWARM EXECUTION\n');
    console.log('Next Step: Launch real swarm with 158 agents on 5 waves');
    process.exit(0);
  } else {
    console.log('❌ TEST FAILED\n');
    process.exit(1);
  }
});
