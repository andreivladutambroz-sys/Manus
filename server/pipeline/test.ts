/**
 * Pipeline Test with Mock Data
 * 
 * This is a TEST with mock data to verify pipeline logic
 * NOT a real data collection run
 */

import type { NormalizedRecord } from "../collectors";

// Mock data generator
function generateMockRecords(count: number): NormalizedRecord[] {
  const makes = ["BMW", "Volkswagen", "Mercedes-Benz", "Audi", "Ford"];
  const models = ["320i", "Golf", "C-Class", "A4", "Mustang"];
  const symptoms = [
    ["Engine knocking", "Loss of power"],
    ["Check engine light", "Rough idle"],
    ["Transmission slipping", "Burning smell"],
    ["Brake noise", "Soft pedal"],
    ["Overheating", "Coolant leak"],
  ];
  const errorCodes = ["P0101", "P0102", "P0103", "P0104", "P0105"];

  const records: NormalizedRecord[] = [];

  for (let i = 0; i < count; i++) {
    records.push({
      vehicleInfo: {
        make: makes[i % makes.length],
        model: models[i % models.length],
        year: 2015 + (i % 10),
        engine: "2.0L",
        transmission: "Automatic",
      },
      symptoms: symptoms[i % symptoms.length],
      errorCodes: [errorCodes[i % errorCodes.length]],
      repairSteps: [
        {
          step: 1,
          description: "Disconnect negative battery terminal",
          tools: ["Wrench"],
          parts: [],
          timeEstimate: 5,
        },
        {
          step: 2,
          description: "Remove air filter",
          tools: ["Screwdriver"],
          parts: ["Air filter"],
          timeEstimate: 10,
        },
        {
          step: 3,
          description: "Install new part",
          tools: ["Wrench"],
          parts: ["Replacement part"],
          torqueSpec: "25 Nm",
          timeEstimate: 15,
        },
      ],
      confidence: 0.75 + Math.random() * 0.2,
      evidenceAnchors: [
        {
          text: "Engine knocking is typically caused by carbon buildup",
          source: "https://example.com/forum/post-123",
          offset: { start: 0, end: 50 },
        },
      ],
      source: {
        domain: "example.com",
        url: `https://example.com/post-${i}`,
        type: ["forum", "reddit", "manual", "obd", "blog", "video"][i % 6] as any,
        accessedAt: new Date(),
      },
    });
  }

  return records;
}

// Test pipeline
export async function testPipeline() {
  console.log("\n" + "=".repeat(60));
  console.log("🧪 PIPELINE TEST WITH MOCK DATA");
  console.log("=".repeat(60));

  // Generate mock data
  const mockRecords = generateMockRecords(1000);
  console.log(`\n✅ Generated ${mockRecords.length} mock records`);

  // Test Layer 1: Collection
  console.log("\n📡 Layer 1: Collection");
  console.log(`   Input: ${mockRecords.length} records`);
  console.log(`   Output: ${mockRecords.length} records`);

  // Test Layer 2: Normalization
  console.log("\n🔄 Layer 2: Normalization");
  const normalized = mockRecords.filter(r => {
    return r.vehicleInfo.make && r.vehicleInfo.model && r.symptoms.length >= 2;
  });
  console.log(`   Input: ${mockRecords.length} records`);
  console.log(`   Output: ${normalized.length} records`);

  // Test Layer 3: Deduplication
  console.log("\n🔀 Layer 3: Deduplication");
  const seen = new Set<string>();
  const deduplicated = normalized.filter(r => {
    const key = `${r.vehicleInfo.make}|${r.vehicleInfo.model}|${r.errorCodes.join("|")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const dedupRate = ((normalized.length - deduplicated.length) / normalized.length * 100).toFixed(1);
  console.log(`   Input: ${normalized.length} records`);
  console.log(`   Output: ${deduplicated.length} records`);
  console.log(`   Dedup rate: ${dedupRate}%`);

  // Test Layer 4: Validation
  console.log("\n✔️  Layer 4: Validation");
  const validated = deduplicated.filter(r => {
    // Check all validation gates
    if (!r.vehicleInfo.make || !r.vehicleInfo.model) return false;
    if (r.errorCodes.length === 0) return false;
    if (r.symptoms.length < 2) return false;
    if (r.repairSteps.length < 3) return false;
    if (r.evidenceAnchors.length === 0) return false;
    if (r.confidence < 0.70 || r.confidence > 0.95) return false;
    return true;
  });
  const validationRate = (validated.length / deduplicated.length * 100).toFixed(1);
  console.log(`   Input: ${deduplicated.length} records`);
  console.log(`   Output: ${validated.length} records`);
  console.log(`   Validation rate: ${validationRate}%`);

  // Test Layer 5: Database Insertion (simulated)
  console.log("\n💾 Layer 5: Database Insertion (Simulated)");
  const inserted = validated.length; // In real scenario, would actually insert
  console.log(`   Input: ${validated.length} records`);
  console.log(`   Output: ${inserted} records inserted`);

  // Final statistics
  console.log("\n" + "=".repeat(60));
  console.log("📊 FINAL STATISTICS");
  console.log("=".repeat(60));
  console.log(`\n   Collection:    ${mockRecords.length} records`);
  console.log(`   Normalization: ${normalized.length} records (${(normalized.length / mockRecords.length * 100).toFixed(1)}%)`);
  console.log(`   Deduplication: ${deduplicated.length} records (${dedupRate}% removed)`);
  console.log(`   Validation:    ${validated.length} records (${validationRate}% passed)`);
  console.log(`   Insertion:     ${inserted} records`);
  console.log(`   Acceptance:    ${(inserted / mockRecords.length * 100).toFixed(1)}%`);

  console.log("\n✅ TEST COMPLETE\n");

  return {
    collected: mockRecords.length,
    normalized: normalized.length,
    deduplicated: deduplicated.length,
    validated: validated.length,
    inserted: inserted,
  };
}

// Run test
if (import.meta.url === `file://${process.argv[1]}`) {
  testPipeline().catch(console.error);
}
