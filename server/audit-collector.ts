import { getDb } from './db';
import { repairCases } from '../drizzle/schema';

async function collectAuditData() {
  const db = await getDb();
  
  // Get all records
  const allRecords = await db.select().from(repairCases);
  
  // Calculate metrics
  const totalRecords = allRecords.length;
  const recordsWithConfidence = allRecords.filter(r => r.confidence).length;
  const avgConfidence = recordsWithConfidence > 0 
    ? (allRecords.reduce((sum, r) => sum + (r.confidence || 0), 0) / recordsWithConfidence).toFixed(3)
    : 0;
  
  const recordsWithSymptoms = allRecords.filter(r => r.symptoms).length;
  const recordsWithTools = allRecords.filter(r => r.toolsUsed).length;
  const recordsWithUrl = allRecords.filter(r => r.sourceUrl).length;
  
  // Get source breakdown
  const sourceMap = new Map<string, any>();
  allRecords.forEach(r => {
    const source = r.sourceDomain || 'unknown';
    if (!sourceMap.has(source)) {
      sourceMap.set(source, {
        domain: source,
        count: 0,
        avgConfidence: 0,
        types: new Set()
      });
    }
    const entry = sourceMap.get(source);
    entry.count++;
    entry.avgConfidence += r.confidence || 0;
    if (r.sourceType) entry.types.add(r.sourceType);
  });
  
  // Convert to array and sort
  const sources = Array.from(sourceMap.values())
    .map(s => ({
      ...s,
      types: Array.from(s.types),
      avgConfidence: (s.avgConfidence / s.count).toFixed(3)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
  
  // Sample records (first 10)
  const samples = allRecords.slice(0, 10).map(r => {
    let symptoms = [];
    let tools = [];
    try {
      if (r.symptoms && typeof r.symptoms === 'string') {
        symptoms = JSON.parse(r.symptoms);
      } else if (Array.isArray(r.symptoms)) {
        symptoms = r.symptoms;
      }
    } catch (e) {
      symptoms = [String(r.symptoms)];
    }
    try {
      if (r.toolsUsed && typeof r.toolsUsed === 'string') {
        tools = JSON.parse(r.toolsUsed);
      } else if (Array.isArray(r.toolsUsed)) {
        tools = r.toolsUsed;
      }
    } catch (e) {
      tools = [String(r.toolsUsed)];
    }
    return {
      vehicle_make: r.vehicleMake,
      vehicle_model: r.vehicleModel,
      year: r.vehicleYear,
      engine: r.engine,
      error_code: r.errorCode,
      symptoms: symptoms,
      repair_steps: r.repairPerformed,
      tools_required: tools,
      torque_specs: 'N/A',
      confidence: r.confidence,
      source_url: r.sourceUrl
    };
  });
  
  // Get process info
  const uptime = process.uptime();
  const memUsage = process.memoryUsage();
  
  const report = {
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.round(uptime),
    memory_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
    total_records: totalRecords,
    avg_confidence: avgConfidence,
    records_with_symptoms: recordsWithSymptoms,
    records_with_tools: recordsWithTools,
    records_with_url: recordsWithUrl,
    sources_top_20: sources,
    sample_records: samples
  };
  
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

collectAuditData().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
