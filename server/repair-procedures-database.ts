// Professional Repair Procedures Database - Similar to Identifix but with AI enhancements

export interface RepairStep {
  stepNumber: number;
  title: string;
  description: string;
  detailedInstructions: string;
  toolsRequired: string[];
  estimatedTimeMinutes: number;
  imageUrl?: string;
  videoUrl?: string;
  warnings: string[];
  tips: string[];
  commonMistakes: string[];
}

export interface RepairProcedure {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  applicableBrands: string[];
  applicableModels: string[];
  difficulty: "easy" | "moderate" | "difficult" | "expert";
  estimatedTimeMinutes: number;
  estimatedCostMin: number;
  estimatedCostMax: number;
  steps: RepairStep[];
  toolsRequired: string[];
  partsRequired: Array<{ partName: string; partNumber: string; quantity: number; cost: number }>;
  safetyWarnings: string[];
  videoUrl?: string;
  youtubeVideoIds?: string[];
  relatedProcedures: string[];
  errorCodesToFix: string[];
}

// Comprehensive repair procedures database
export const repairProceduresDatabase: Record<string, RepairProcedure> = {
  "engine-oil-change": {
    id: "engine-oil-change",
    title: "Engine Oil Change",
    description: "Complete engine oil and filter replacement with proper disposal",
    category: "Engine",
    subcategory: "Maintenance",
    applicableBrands: ["Volkswagen", "Audi", "BMW", "Mercedes", "Ford", "Toyota"],
    applicableModels: ["*"], // All models
    difficulty: "easy",
    estimatedTimeMinutes: 45,
    estimatedCostMin: 30,
    estimatedCostMax: 80,
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
      },
      {
        stepNumber: 2,
        title: "Drain Old Oil",
        description: "Remove drain plug and drain old oil",
        detailedInstructions: "Locate oil drain plug on bottom of engine. Place drain pan underneath. Using appropriate socket wrench, carefully remove drain plug. Allow oil to drain completely (5-10 minutes). Wipe drain plug with cloth and inspect for damage.",
        toolsRequired: ["Oil drain pan", "Socket wrench", "Cloth"],
        estimatedTimeMinutes: 10,
        warnings: ["Oil may be hot - use caution", "Dispose of old oil properly"],
        tips: ["Save drain plug for reinstallation", "Use a drain plug wrench for stuck plugs"],
        commonMistakes: ["Losing drain plug in drain pan", "Not waiting for complete drainage"],
      },
      {
        stepNumber: 3,
        title: "Replace Oil Filter",
        description: "Remove old oil filter and install new one",
        detailedInstructions: "Locate oil filter. Using oil filter wrench, turn counterclockwise to remove. Drain remaining oil from filter. Clean filter mounting surface on engine. Apply thin layer of new oil to rubber gasket of new filter. Install new filter by hand until gasket contacts, then tighten 3/4 turn.",
        toolsRequired: ["Oil filter wrench", "New oil filter", "Cloth"],
        estimatedTimeMinutes: 8,
        warnings: ["Old filter may contain hot oil", "Do not over-tighten new filter"],
        tips: ["Pre-fill new filter with oil for faster priming", "Mark filter with installation date"],
        commonMistakes: ["Forgetting to remove old filter gasket", "Over-tightening new filter"],
      },
      {
        stepNumber: 4,
        title: "Reinstall Drain Plug",
        description: "Install drain plug with new washer",
        detailedInstructions: "Install new washer on drain plug. Carefully thread drain plug into engine block. Tighten to manufacturer specification (typically 20-30 Nm). Do not over-tighten as this can strip threads.",
        toolsRequired: ["Socket wrench", "Torque wrench", "New washer"],
        estimatedTimeMinutes: 5,
        warnings: ["Do not over-tighten"],
        tips: ["Use torque wrench for proper tightness", "Check for leaks after tightening"],
        commonMistakes: ["Over-tightening drain plug", "Forgetting to install new washer"],
      },
      {
        stepNumber: 5,
        title: "Fill with New Oil",
        description: "Add new oil to engine",
        detailedInstructions: "Locate oil filler cap on top of engine. Remove cap. Using funnel, pour new oil into engine. Refer to owner's manual for correct oil type and capacity. Pour slowly to avoid spilling.",
        toolsRequired: ["Funnel", "New oil", "Oil can opener"],
        estimatedTimeMinutes: 5,
        warnings: ["Use correct oil type and viscosity"],
        tips: ["Check oil level with dipstick after filling", "Let oil settle for 2-3 minutes before checking"],
        commonMistakes: ["Using wrong oil type", "Overfilling engine"],
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
      },
    ],
    toolsRequired: ["Jack", "Jack stands", "Oil drain pan", "Socket wrench set", "Oil filter wrench", "Funnel", "Torque wrench"],
    partsRequired: [
      { partName: "Engine Oil", partNumber: "5W-30 or per manual", quantity: 1, cost: 20 },
      { partName: "Oil Filter", partNumber: "OEM filter", quantity: 1, cost: 10 },
      { partName: "Drain Plug Washer", partNumber: "OEM washer", quantity: 1, cost: 2 },
    ],
    safetyWarnings: [
      "Hot oil can cause severe burns",
      "Dispose of old oil properly - do not dump down drain",
      "Ensure vehicle is on level ground and secure",
      "Use jack stands - never rely on jack alone",
    ],
    relatedProcedures: ["air-filter-replacement", "cabin-air-filter-replacement"],
    errorCodesToFix: ["P0101", "P0128"],
  },

  "brake-pad-replacement": {
    id: "brake-pad-replacement",
    title: "Brake Pad Replacement",
    description: "Front or rear brake pad replacement with rotor inspection",
    category: "Brakes",
    subcategory: "Maintenance",
    applicableBrands: ["Volkswagen", "Audi", "BMW", "Mercedes"],
    applicableModels: ["*"],
    difficulty: "moderate",
    estimatedTimeMinutes: 120,
    estimatedCostMin: 150,
    estimatedCostMax: 400,
    steps: [
      {
        stepNumber: 1,
        title: "Prepare Vehicle",
        description: "Safely lift vehicle and remove wheel",
        detailedInstructions: "Park on level ground. Engage parking brake. Loosen lug nuts slightly. Raise vehicle with jack. Secure with jack stands. Remove lug nuts completely and remove wheel.",
        toolsRequired: ["Jack", "Jack stands", "Lug wrench", "Socket wrench"],
        estimatedTimeMinutes: 10,
        warnings: ["Always use jack stands", "Never work under vehicle supported only by jack"],
        tips: ["Loosen lug nuts before lifting for easier removal"],
        commonMistakes: ["Not using jack stands", "Dropping wheel on foot"],
      },
      {
        stepNumber: 2,
        title: "Inspect Brake System",
        description: "Check rotor and caliper condition",
        detailedInstructions: "Visually inspect brake rotor for wear, scoring, or warping. Check caliper for leaks or damage. Measure rotor thickness if available. Document any issues.",
        toolsRequired: ["Caliper (measuring tool)", "Flashlight"],
        estimatedTimeMinutes: 5,
        warnings: ["Do not touch hot brake components"],
        tips: ["Take photos for documentation"],
        commonMistakes: ["Not inspecting rotor condition"],
      },
      {
        stepNumber: 3,
        title: "Remove Caliper",
        description: "Unbolt and remove brake caliper",
        detailedInstructions: "Locate caliper mounting bolts. Using appropriate socket wrench, remove bolts. Carefully slide caliper off rotor. Do not let caliper hang by brake hose - support with wire or rope.",
        toolsRequired: ["Socket wrench set", "Wire or rope"],
        estimatedTimeMinutes: 8,
        warnings: ["Do not damage brake hose", "Support caliper to prevent hose damage"],
        tips: ["Mark caliper position for reinstallation"],
        commonMistakes: ["Letting caliper hang by hose", "Losing caliper bolts"],
      },
      {
        stepNumber: 4,
        title: "Remove Old Brake Pads",
        description: "Remove worn brake pads from caliper",
        detailedInstructions: "Remove brake pad retaining clips or pins. Slide old pads out of caliper. Inspect caliper piston for damage. Clean caliper with brake cleaner.",
        toolsRequired: ["Brake cleaner", "Brush", "Screwdriver"],
        estimatedTimeMinutes: 5,
        warnings: ["Brake dust may contain asbestos - use caution"],
        tips: ["Keep track of pad orientation"],
        commonMistakes: ["Not cleaning caliper", "Mixing up pad orientation"],
      },
      {
        stepNumber: 5,
        title: "Install New Brake Pads",
        description: "Install new brake pads in correct orientation",
        detailedInstructions: "Apply thin layer of brake grease to back of new pads. Install pads in caliper ensuring correct orientation (friction material faces rotor). Install retaining clips or pins. Ensure pads move freely.",
        toolsRequired: ["New brake pads", "Brake grease", "Screwdriver"],
        estimatedTimeMinutes: 8,
        warnings: ["Do not get grease on friction material"],
        tips: ["Use OEM or quality aftermarket pads"],
        commonMistakes: ["Installing pads backwards", "Using wrong pad type"],
      },
      {
        stepNumber: 6,
        title: "Reinstall Caliper",
        description: "Bolt caliper back onto rotor",
        detailedInstructions: "Position caliper over rotor and pads. Install and tighten caliper mounting bolts to specification (typically 20-30 Nm). Ensure caliper is secure and pads are properly seated.",
        toolsRequired: ["Socket wrench", "Torque wrench"],
        estimatedTimeMinutes: 5,
        warnings: ["Use correct torque specification"],
        tips: ["Double-check bolt tightness"],
        commonMistakes: ["Under-tightening bolts", "Over-tightening bolts"],
      },
      {
        stepNumber: 7,
        title: "Bleed Brake System (if needed)",
        description: "Bleed air from brake lines if caliper was disconnected",
        detailedInstructions: "If brake hose was disconnected, bleed brake system. Locate bleeder screw on caliper. Attach clear tubing to bleeder. Open bleeder and have assistant pump brake pedal. Close bleeder before pedal reaches top. Repeat until no air bubbles appear.",
        toolsRequired: ["Bleeder wrench", "Clear tubing", "Brake fluid"],
        estimatedTimeMinutes: 15,
        warnings: ["Brake fluid is corrosive - avoid skin contact"],
        tips: ["Have helper ready before starting"],
        commonMistakes: ["Not bleeding system after disconnecting hose", "Letting brake fluid run dry"],
      },
      {
        stepNumber: 8,
        title: "Reinstall Wheel",
        description: "Install wheel and tighten lug nuts",
        detailedInstructions: "Position wheel on hub. Install lug nuts and tighten by hand. Lower vehicle with jack. Tighten lug nuts in star pattern to specification (typically 100-120 Nm).",
        toolsRequired: ["Lug wrench", "Torque wrench"],
        estimatedTimeMinutes: 10,
        warnings: ["Use correct lug nut torque"],
        tips: ["Tighten in star pattern for even pressure"],
        commonMistakes: ["Under-tightening lug nuts", "Over-tightening lug nuts"],
      },
      {
        stepNumber: 9,
        title: "Test Brakes",
        description: "Test brake system before driving",
        detailedInstructions: "Start engine. Pump brake pedal several times to build pressure. Brake pedal should feel firm and not go to floor. Test brakes at low speed in safe area. Ensure brakes work properly before normal driving.",
        toolsRequired: [],
        estimatedTimeMinutes: 10,
        warnings: ["Do not drive if brakes feel soft or spongy"],
        tips: ["Bed in new pads gradually over first 100 miles"],
        commonMistakes: ["Driving with soft brakes", "Not testing before driving"],
      },
    ],
    toolsRequired: ["Jack", "Jack stands", "Socket wrench set", "Lug wrench", "Brake cleaner", "Wire or rope"],
    partsRequired: [
      { partName: "Brake Pads (set)", partNumber: "OEM pads", quantity: 1, cost: 80 },
      { partName: "Brake Fluid", partNumber: "DOT 4", quantity: 0.5, cost: 15 },
    ],
    safetyWarnings: [
      "Hot brake components can cause burns",
      "Brake dust may contain asbestos",
      "Always use jack stands",
      "Test brakes before driving",
    ],
    relatedProcedures: ["rotor-replacement", "brake-fluid-flush"],
    errorCodesToFix: ["C0035", "C0050"],
  },

  // Add more procedures...
};

export function getRepairProcedure(procedureId: string): RepairProcedure | null {
  return repairProceduresDatabase[procedureId] || null;
}

export function searchRepairProcedures(query: string): RepairProcedure[] {
  const lowerQuery = query.toLowerCase();
  return Object.values(repairProceduresDatabase).filter(
    (proc) =>
      proc.title.toLowerCase().includes(lowerQuery) ||
      proc.description.toLowerCase().includes(lowerQuery) ||
      proc.category.toLowerCase().includes(lowerQuery) ||
      proc.errorCodesToFix.some((code) => code.toLowerCase().includes(lowerQuery))
  );
}

export function getProceduresByErrorCode(errorCode: string): RepairProcedure[] {
  return Object.values(repairProceduresDatabase).filter((proc) =>
    proc.errorCodesToFix.includes(errorCode)
  );
}

export function getProceduresByBrandAndCategory(brand: string, category: string): RepairProcedure[] {
  return Object.values(repairProceduresDatabase).filter(
    (proc) =>
      (proc.applicableBrands.includes(brand) || proc.applicableBrands.includes("*")) &&
      proc.category === category
  );
}
