// Model-Specific Repair Procedures Database
// Each procedure is customized for specific brand/model/year/engine combinations

export interface ModelSpecificProcedure {
  id: string;
  brand: string;
  model: string;
  yearStart: number;
  yearEnd: number;
  engineType: string; // e.g., "3.0 TDI", "2.0 TSI", "2.0 Diesel"
  engineCode?: string; // e.g., "CBRA", "CAEB"
  transmissionType?: string; // Manual, Automatic, DSG
  title: string;
  description: string;
  category: string;
  difficulty: "easy" | "moderate" | "difficult" | "expert";
  estimatedTimeMinutes: number;
  estimatedCostMin: number;
  estimatedCostMax: number;
  steps: Array<{
    stepNumber: number;
    title: string;
    description: string;
    detailedInstructions: string;
    toolsRequired: string[];
    estimatedTimeMinutes: number;
    warnings: string[];
    tips: string[];
    commonMistakes: string[];
    modelSpecificNotes?: string; // Notes specific to this model
  }>;
  toolsRequired: string[];
  partsRequired: Array<{
    partName: string;
    partNumber: string; // Model-specific part number
    oemPartNumber?: string;
    quantity: number;
    cost: number;
  }>;
  safetyWarnings: string[];
  modelSpecificWarnings?: string[]; // Additional warnings for this model
  relatedProcedures: string[];
  errorCodesToFix: string[];
  applicableTransmissions?: string[];
  applicableEngines?: string[];
}

export const modelSpecificProceduresDatabase: Record<string, ModelSpecificProcedure> = {
  "vw-phaeton-3.0-tdi-oil-change": {
    id: "vw-phaeton-3.0-tdi-oil-change",
    brand: "Volkswagen",
    model: "Phaeton",
    yearStart: 2010,
    yearEnd: 2018,
    engineType: "3.0 TDI",
    engineCode: "CBRA",
    transmissionType: "Automatic",
    title: "Engine Oil Change - VW Phaeton 3.0 TDI (2010-2018)",
    description: "Complete engine oil and filter replacement for VW Phaeton 3.0 TDI with proper disposal",
    category: "Engine",
    difficulty: "easy",
    estimatedTimeMinutes: 45,
    estimatedCostMin: 40,
    estimatedCostMax: 100,
    steps: [
      {
        stepNumber: 1,
        title: "Prepare Vehicle",
        description: "Warm up engine and prepare workspace",
        detailedInstructions: "Start engine and let it run for 2-3 minutes to warm up oil. This allows better drainage. Turn off engine and wait 5 minutes. Place vehicle on level ground with parking brake engaged.",
        toolsRequired: ["Jack", "Jack stands", "Oil drain pan", "Socket wrench set"],
        estimatedTimeMinutes: 5,
        warnings: ["Do not touch hot engine parts", "Ensure vehicle is on level ground"],
        tips: ["Warm oil drains faster and more completely", "Use a creeper for comfort"],
        commonMistakes: ["Draining cold oil (incomplete drainage)", "Not securing vehicle properly"],
        modelSpecificNotes: "Phaeton requires access from underneath. Use jack stands rated for 2000+ kg.",
      },
      {
        stepNumber: 2,
        title: "Drain Old Oil",
        description: "Remove drain plug and drain old oil",
        detailedInstructions: "Locate oil drain plug on bottom of engine (part #: 06A 103 753). Place drain pan underneath. Using 17mm socket wrench, carefully remove drain plug. Allow oil to drain completely (5-10 minutes). Wipe drain plug with cloth and inspect for damage.",
        toolsRequired: ["Oil drain pan", "17mm socket wrench", "Cloth"],
        estimatedTimeMinutes: 10,
        warnings: ["Oil may be hot - use caution", "Dispose of old oil properly"],
        tips: ["Save drain plug for reinstallation", "Use a drain plug wrench for stuck plugs"],
        commonMistakes: ["Losing drain plug in drain pan", "Not waiting for complete drainage"],
        modelSpecificNotes: "Phaeton 3.0 TDI drain plug torque spec: 25 Nm. Use OEM part #06A 103 753.",
      },
      {
        stepNumber: 3,
        title: "Replace Oil Filter",
        description: "Remove old oil filter and install new one",
        detailedInstructions: "Locate oil filter housing on top of engine (part #: 06E 115 561). Using oil filter wrench (size: 86mm), turn counterclockwise to remove. Drain remaining oil from filter. Clean filter mounting surface on engine. Apply thin layer of new oil to rubber gasket of new filter. Install new filter by hand until gasket contacts, then tighten 3/4 turn.",
        toolsRequired: ["Oil filter wrench (86mm)", "New oil filter (part #06E 115 561)", "Cloth"],
        estimatedTimeMinutes: 8,
        warnings: ["Old filter may contain hot oil", "Do not over-tighten new filter"],
        tips: ["Pre-fill new filter with oil for faster priming", "Mark filter with installation date"],
        commonMistakes: ["Forgetting to remove old filter gasket", "Over-tightening new filter"],
        modelSpecificNotes: "Phaeton uses cartridge-style filter. OEM part #06E 115 561. Torque: 25 Nm.",
      },
      {
        stepNumber: 4,
        title: "Reinstall Drain Plug",
        description: "Install drain plug with new washer",
        detailedInstructions: "Install new washer (part #06A 103 753 A) on drain plug. Carefully thread drain plug into engine block. Tighten to 25 Nm using torque wrench. Do not over-tighten as this can strip threads.",
        toolsRequired: ["Socket wrench", "Torque wrench", "New washer (part #06A 103 753 A)"],
        estimatedTimeMinutes: 5,
        warnings: ["Do not over-tighten"],
        tips: ["Use torque wrench for proper tightness", "Check for leaks after tightening"],
        commonMistakes: ["Over-tightening drain plug", "Forgetting to install new washer"],
        modelSpecificNotes: "Phaeton drain plug torque: 25 Nm. OEM washer part #06A 103 753 A.",
      },
      {
        stepNumber: 5,
        title: "Fill with New Oil",
        description: "Add new oil to engine",
        detailedInstructions: "Locate oil filler cap on top of engine. Remove cap. Using funnel, pour new Castrol Edge 5W-30 (or equivalent) into engine. Phaeton 3.0 TDI capacity: 5.5 liters. Pour slowly to avoid spilling.",
        toolsRequired: ["Funnel", "Castrol Edge 5W-30 (5.5L)", "Oil can opener"],
        estimatedTimeMinutes: 5,
        warnings: ["Use correct oil type and viscosity"],
        tips: ["Check oil level with dipstick after filling", "Let oil settle for 2-3 minutes before checking"],
        commonMistakes: ["Using wrong oil type", "Overfilling engine"],
        modelSpecificNotes: "Phaeton 3.0 TDI requires 5W-30 synthetic oil. Capacity: 5.5 liters. Approved oils: Castrol Edge, Mobil 1, Shell Helix.",
      },
      {
        stepNumber: 6,
        title: "Check Oil Level",
        description: "Verify correct oil level",
        detailedInstructions: "Wait 2-3 minutes for oil to settle. Remove dipstick, wipe clean, reinsert fully, then remove again to check level. Oil should be between MIN and MAX marks. Add more oil if needed.",
        toolsRequired: ["Dipstick"],
        estimatedTimeMinutes: 5,
        warnings: ["Do not overfill"],
        tips: ["Check level on level ground", "Recheck after first drive"],
        commonMistakes: ["Checking level without letting oil settle", "Overfilling"],
      },
      {
        stepNumber: 7,
        title: "Start Engine and Check",
        description: "Start engine and verify no leaks",
        detailedInstructions: "Start engine and let it idle for 30 seconds. Check oil pressure light - it should turn off within 5 seconds. Inspect drain plug and filter for leaks. Turn off engine and wait 2-3 minutes. Recheck oil level.",
        toolsRequired: [],
        estimatedTimeMinutes: 5,
        warnings: ["Do not rev engine immediately"],
        tips: ["Check for leaks before driving", "Reset oil change reminder if applicable"],
        commonMistakes: ["Driving before checking for leaks", "Ignoring oil pressure warning light"],
        modelSpecificNotes: "Phaeton has electronic oil change reminder. Reset via dashboard menu after oil change.",
      },
    ],
    toolsRequired: ["Jack", "Jack stands", "Oil drain pan", "17mm socket wrench", "Oil filter wrench (86mm)", "Funnel", "Torque wrench"],
    partsRequired: [
      { partName: "Engine Oil 5W-30 Synthetic", partNumber: "Castrol Edge", oemPartNumber: "VAG 502.00", quantity: 1, cost: 30 },
      { partName: "Oil Filter", partNumber: "06E 115 561", oemPartNumber: "06E 115 561", quantity: 1, cost: 15 },
      { partName: "Drain Plug Washer", partNumber: "06A 103 753 A", oemPartNumber: "06A 103 753 A", quantity: 1, cost: 2 },
    ],
    safetyWarnings: [
      "Hot oil can cause severe burns",
      "Dispose of old oil properly - do not dump down drain",
      "Ensure vehicle is on level ground and secure",
      "Use jack stands rated for 2000+ kg",
    ],
    modelSpecificWarnings: [
      "Phaeton requires access from underneath - ensure proper support",
      "Oil capacity is 5.5 liters - do not overfill",
      "Use only synthetic 5W-30 oil approved by VW",
    ],
    relatedProcedures: ["air-filter-replacement", "cabin-air-filter-replacement"],
    errorCodesToFix: ["P0101", "P0128"],
    applicableTransmissions: ["Automatic"],
    applicableEngines: ["3.0 TDI"],
  },

  "bmw-320i-2015-oil-change": {
    id: "bmw-320i-2015-oil-change",
    brand: "BMW",
    model: "320i",
    yearStart: 2012,
    yearEnd: 2019,
    engineType: "2.0 Petrol",
    engineCode: "N20B20",
    transmissionType: "Automatic",
    title: "Engine Oil Change - BMW 320i (2012-2019)",
    description: "Complete engine oil and filter replacement for BMW 320i with electronic oil level monitoring",
    category: "Engine",
    difficulty: "moderate",
    estimatedTimeMinutes: 60,
    estimatedCostMin: 50,
    estimatedCostMax: 120,
    steps: [
      {
        stepNumber: 1,
        title: "Prepare Vehicle",
        description: "Warm up engine and access oil filter",
        detailedInstructions: "Start engine and let it run for 2-3 minutes. Turn off engine. Remove plastic undertray (8 screws). Access oil filter housing from below.",
        toolsRequired: ["Jack", "Jack stands", "Screwdrivers", "Oil drain pan"],
        estimatedTimeMinutes: 10,
        warnings: ["Remove undertray carefully to avoid damage"],
        tips: ["Mark undertray screws for easy reinstallation"],
        commonMistakes: ["Losing undertray screws"],
        modelSpecificNotes: "BMW 320i has plastic undertray that must be removed for oil filter access.",
      },
      {
        stepNumber: 2,
        title: "Drain Old Oil",
        description: "Remove drain plug and drain old oil",
        detailedInstructions: "Locate oil drain plug (part #: 07 11 9 407 619). Using 17mm socket, remove drain plug. Allow oil to drain completely (10 minutes).",
        toolsRequired: ["Oil drain pan", "17mm socket wrench"],
        estimatedTimeMinutes: 12,
        warnings: ["Oil may be hot"],
        tips: ["Use drain pan with spout for easier disposal"],
        commonMistakes: ["Not waiting for complete drainage"],
        modelSpecificNotes: "BMW drain plug torque: 25 Nm. Part #07 11 9 407 619.",
      },
      {
        stepNumber: 3,
        title: "Replace Oil Filter",
        description: "Replace cartridge-style oil filter",
        detailedInstructions: "Locate oil filter housing (part #: 11 42 7 570 050). Using oil filter wrench (size: 86mm), remove filter cartridge. Install new filter with new O-rings (part #: 11 42 7 570 050).",
        toolsRequired: ["Oil filter wrench (86mm)", "New filter cartridge (11 42 7 570 050)", "New O-rings"],
        estimatedTimeMinutes: 10,
        warnings: ["Do not over-tighten"],
        tips: ["Replace O-rings every oil change"],
        commonMistakes: ["Reusing old O-rings"],
        modelSpecificNotes: "BMW uses cartridge-style filter. Always replace O-rings. Part #11 42 7 570 050.",
      },
      {
        stepNumber: 4,
        title: "Reinstall Drain Plug",
        description: "Install drain plug with new washer",
        detailedInstructions: "Install new crush washer (part #: 07 11 9 407 619 A). Thread drain plug and tighten to 25 Nm.",
        toolsRequired: ["Socket wrench", "Torque wrench", "New crush washer"],
        estimatedTimeMinutes: 5,
        warnings: ["Use new crush washer"],
        tips: ["Torque to exactly 25 Nm"],
        commonMistakes: ["Reusing old washer"],
        modelSpecificNotes: "BMW requires new crush washer every oil change. Part #07 11 9 407 619 A.",
      },
      {
        stepNumber: 5,
        title: "Fill with New Oil",
        description: "Add new oil to engine",
        detailedInstructions: "Locate oil filler cap. Pour BMW Castrol Edge 5W-30 (or equivalent). BMW 320i capacity: 4.3 liters.",
        toolsRequired: ["Funnel", "BMW Castrol Edge 5W-30 (4.3L)"],
        estimatedTimeMinutes: 5,
        warnings: ["Use correct oil type"],
        tips: ["Check level electronically via iDrive"],
        commonMistakes: ["Using wrong oil type"],
        modelSpecificNotes: "BMW 320i requires 5W-30 LL-01 approved oil. Capacity: 4.3 liters.",
      },
      {
        stepNumber: 6,
        title: "Check Oil Level Electronically",
        description: "Verify oil level via iDrive system",
        detailedInstructions: "Start engine. Go to iDrive menu > Settings > Service > Oil Level. Check that level is between MIN and MAX. Add more oil if needed.",
        toolsRequired: [],
        estimatedTimeMinutes: 5,
        warnings: ["Do not overfill"],
        tips: ["Electronic level monitoring is more accurate than dipstick"],
        commonMistakes: ["Ignoring electronic reading"],
        modelSpecificNotes: "BMW 320i uses electronic oil level monitoring. No dipstick. Check via iDrive.",
      },
      {
        stepNumber: 7,
        title: "Start Engine and Check",
        description: "Start engine and verify no leaks",
        detailedInstructions: "Start engine and let it idle for 30 seconds. Check for leaks. Turn off engine and wait 2-3 minutes. Recheck oil level via iDrive.",
        toolsRequired: [],
        estimatedTimeMinutes: 5,
        warnings: ["Do not rev engine immediately"],
        tips: ["Check for leaks before driving"],
        commonMistakes: ["Driving with low oil level"],
        modelSpecificNotes: "BMW will display oil change reminder on iDrive. Reset after oil change.",
      },
      {
        stepNumber: 8,
        title: "Reinstall Undertray",
        description: "Reinstall plastic undertray",
        detailedInstructions: "Align undertray with mounting points. Install 8 screws and tighten securely.",
        toolsRequired: ["Screwdrivers"],
        estimatedTimeMinutes: 5,
        warnings: ["Ensure undertray is properly secured"],
        tips: ["Use marked screws for correct positioning"],
        commonMistakes: ["Forgetting to reinstall undertray"],
        modelSpecificNotes: "Undertray protects engine components. Ensure all screws are tight.",
      },
    ],
    toolsRequired: ["Jack", "Jack stands", "Oil drain pan", "17mm socket wrench", "Oil filter wrench (86mm)", "Funnel", "Torque wrench", "Screwdrivers"],
    partsRequired: [
      { partName: "Engine Oil 5W-30 LL-01", partNumber: "Castrol Edge", oemPartNumber: "BMW LL-01", quantity: 1, cost: 35 },
      { partName: "Oil Filter Cartridge", partNumber: "11 42 7 570 050", oemPartNumber: "11 42 7 570 050", quantity: 1, cost: 20 },
      { partName: "O-Rings (set)", partNumber: "11 42 7 570 050", oemPartNumber: "11 42 7 570 050", quantity: 1, cost: 5 },
      { partName: "Drain Plug Crush Washer", partNumber: "07 11 9 407 619 A", oemPartNumber: "07 11 9 407 619 A", quantity: 1, cost: 2 },
    ],
    safetyWarnings: [
      "Hot oil can cause severe burns",
      "Dispose of old oil properly",
      "Use jack stands - never rely on jack alone",
      "Ensure plastic undertray is properly reinstalled",
    ],
    modelSpecificWarnings: [
      "BMW 320i has no dipstick - use electronic level monitoring",
      "Always replace O-rings when changing oil filter",
      "Use only LL-01 approved oil",
      "Undertray must be reinstalled to protect engine",
    ],
    relatedProcedures: ["air-filter-replacement", "spark-plug-replacement"],
    errorCodesToFix: ["P0101", "P0128"],
    applicableTransmissions: ["Automatic"],
    applicableEngines: ["2.0 Petrol"],
  },

  // Add more model-specific procedures...
};

export function getModelSpecificProcedures(brand: string, model: string, year: number, engineType?: string): ModelSpecificProcedure[] {
  return Object.values(modelSpecificProceduresDatabase).filter((proc) => {
    const brandMatch = proc.brand.toLowerCase() === brand.toLowerCase();
    const modelMatch = proc.model.toLowerCase() === model.toLowerCase();
    const yearMatch = year >= proc.yearStart && year <= proc.yearEnd;
    const engineMatch = !engineType || proc.engineType === engineType;

    return brandMatch && modelMatch && yearMatch && engineMatch;
  });
}

export function getModelSpecificProcedure(procedureId: string): ModelSpecificProcedure | null {
  return modelSpecificProceduresDatabase[procedureId] || null;
}

export function searchModelSpecificProcedures(brand: string, model: string, query: string): ModelSpecificProcedure[] {
  const lowerQuery = query.toLowerCase();
  return getModelSpecificProcedures(brand, model, new Date().getFullYear()).filter(
    (proc) =>
      proc.title.toLowerCase().includes(lowerQuery) ||
      proc.description.toLowerCase().includes(lowerQuery) ||
      proc.category.toLowerCase().includes(lowerQuery)
  );
}
