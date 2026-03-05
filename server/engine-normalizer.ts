/**
 * Engine Normalization Module
 * Parses engine strings and creates canonical identity keys for deduplication
 */

export interface ParsedEngine {
  code?: string;
  displacement?: number; // in liters
  cylinders?: number;
  fuel_type?: string;
  induction?: string;
  turbo?: boolean;
  supercharger?: boolean;
  hybrid?: boolean;
  electric?: boolean;
  raw_string: string;
}

export interface CanonicalEngineKey {
  make: string;
  model: string;
  year: number;
  engine_code: string;
  displacement_cc: number;
  fuel_type: string;
  hash: string;
}

/**
 * Parse engine string into structured data
 * Examples:
 * "3.5L V6" → {displacement: 3.5, cylinders: 6}
 * "EA888 1.4L TSI" → {code: "EA888", displacement: 1.4, induction: "Turbocharged"}
 * "L15B7 1.5L Turbo" → {code: "L15B7", displacement: 1.5, turbo: true}
 */
export function parseEngine(engineString: string): ParsedEngine {
  const result: ParsedEngine = {
    raw_string: engineString.trim(),
  };

  if (!engineString) return result;

  const str = engineString.toUpperCase();

  // Extract engine code (usually alphanumeric at start)
  const codeMatch = str.match(/^([A-Z0-9]{2,10})\s+/);
  if (codeMatch) {
    result.code = codeMatch[1];
  }

  // Extract displacement (e.g., "3.5L", "1.4L")
  const displacementMatch = str.match(/(\d+\.?\d*)\s*L/i);
  if (displacementMatch) {
    result.displacement = parseFloat(displacementMatch[1]);
  }

  // Extract cylinder count (e.g., "V6", "I4", "L4")
  const cylinderMatch = str.match(/([VI])(\d)/i);
  if (cylinderMatch) {
    result.cylinders = parseInt(cylinderMatch[2]);
  }

  // Detect fuel type
  if (str.includes("DIESEL")) {
    result.fuel_type = "Diesel";
  } else if (str.includes("HYBRID")) {
    result.hybrid = true;
    result.fuel_type = "Hybrid";
  } else if (str.includes("ELECTRIC") || str.includes("EV")) {
    result.electric = true;
    result.fuel_type = "Electric";
  } else if (str.includes("PETROL") || str.includes("GASOLINE")) {
    result.fuel_type = "Petrol";
  } else {
    result.fuel_type = "Petrol"; // Default
  }

  // Detect induction
  if (str.includes("TURBO")) {
    result.turbo = true;
    result.induction = "Turbocharged";
  } else if (str.includes("SUPERCHARG")) {
    result.supercharger = true;
    result.induction = "Supercharged";
  } else if (str.includes("TSI") || str.includes("TFSI")) {
    result.turbo = true;
    result.induction = "Turbocharged";
  } else {
    result.induction = "Naturally Aspirated";
  }

  return result;
}

/**
 * Create canonical engine identity key for deduplication
 * Format: make|model|year|engine_code|displacement_cc|fuel_type
 */
export function createCanonicalEngineKey(
  make: string,
  model: string,
  year: number,
  engineString: string,
  displacement?: number
): CanonicalEngineKey {
  const parsed = parseEngine(engineString);

  // Use provided displacement or parsed displacement
  const displacementLiters = displacement || parsed.displacement || 0;
  const displacementCc = Math.round(displacementLiters * 1000);

  const keyString = `${make}|${model}|${year}|${parsed.code || "UNKNOWN"}|${displacementCc}|${parsed.fuel_type || "Petrol"}`;

  return {
    make,
    model,
    year,
    engine_code: parsed.code || "UNKNOWN",
    displacement_cc: displacementCc,
    fuel_type: parsed.fuel_type || "Petrol",
    hash: Buffer.from(keyString).toString("base64"),
  };
}

/**
 * Normalize engine string to standard format
 */
export function normalizeEngine(engineString: string): string {
  const parsed = parseEngine(engineString);

  const parts: string[] = [];

  if (parsed.code) {
    parts.push(parsed.code);
  }

  if (parsed.displacement) {
    parts.push(`${parsed.displacement}L`);
  }

  if (parsed.cylinders) {
    parts.push(`${parsed.cylinders}cyl`);
  }

  if (parsed.turbo) {
    parts.push("Turbo");
  } else if (parsed.supercharger) {
    parts.push("Supercharged");
  }

  if (parsed.fuel_type && parsed.fuel_type !== "Petrol") {
    parts.push(parsed.fuel_type);
  }

  return parts.join(" ") || engineString;
}

/**
 * Extract all engine variants from a vehicle record
 */
export function extractEngineVariants(record: any): ParsedEngine[] {
  const engines: ParsedEngine[] = [];

  if (record.engine) {
    engines.push(parseEngine(record.engine));
  }

  if (record.engine_code) {
    engines.push(parseEngine(record.engine_code));
  }

  if (record.engines && Array.isArray(record.engines)) {
    record.engines.forEach((e: any) => {
      engines.push(parseEngine(typeof e === "string" ? e : e.code || e.name || ""));
    });
  }

  return engines.filter((e) => e.raw_string);
}

/**
 * Compare two engines for similarity
 * Returns similarity score 0-1
 */
export function compareEngines(engine1: ParsedEngine, engine2: ParsedEngine): number {
  let score = 0;
  let factors = 0;

  // Compare displacement
  if (engine1.displacement && engine2.displacement) {
    const diff = Math.abs(engine1.displacement - engine2.displacement);
    if (diff < 0.1) {
      score += 1;
    } else if (diff < 0.5) {
      score += 0.5;
    }
    factors++;
  }

  // Compare cylinders
  if (engine1.cylinders && engine2.cylinders) {
    if (engine1.cylinders === engine2.cylinders) {
      score += 1;
    }
    factors++;
  }

  // Compare fuel type
  if (engine1.fuel_type && engine2.fuel_type) {
    if (engine1.fuel_type === engine2.fuel_type) {
      score += 1;
    }
    factors++;
  }

  // Compare turbo/supercharger
  if (engine1.turbo === engine2.turbo && engine1.supercharger === engine2.supercharger) {
    score += 1;
    factors++;
  }

  return factors > 0 ? score / factors : 0;
}

/**
 * Validate engine string
 */
export function isValidEngine(engineString: string): boolean {
  if (!engineString || typeof engineString !== "string") return false;

  const parsed = parseEngine(engineString);

  // At least one of: code, displacement, cylinders
  return !!(parsed.code || parsed.displacement || parsed.cylinders);
}

/**
 * Batch normalize engines
 */
export function batchNormalizeEngines(engines: string[]): Map<string, ParsedEngine> {
  const map = new Map<string, ParsedEngine>();

  engines.forEach((engine) => {
    if (isValidEngine(engine)) {
      const normalized = normalizeEngine(engine);
      const parsed = parseEngine(engine);
      map.set(normalized, parsed);
    }
  });

  return map;
}
