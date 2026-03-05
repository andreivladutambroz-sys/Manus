/**
 * ENHANCED SOURCE PARSER - Phase 1
 * Advanced HTML/text parsing to extract rich data (2-4 symptoms, 3-5 repair steps)
 * 
 * Solution 5A: Enhanced Source Parsing
 * Extracts deeper content from sources
 */

// Import types from validation-layer instead
export interface ExtractedRecord {
  vehicle: {
    make: string;
    model: string;
    year?: number;
    engine?: string;
    engine_code?: string;
  };
  error_code: {
    code: string;
    system?: string;
    description?: string;
  };
  symptoms: string[];
  repair_procedures: Array<{
    step: number;
    action: string;
  }>;
  tools_required: string[];
  torque_specs?: Array<{
    component: string;
    value_nm?: number;
  }>;
  repair_action?: string;
  repair_outcome?: 'success' | 'fail' | 'unknown';
  confidence: number;
  source_url: string;
  source_domain: string;
  evidence_snippets: Array<{
    field: string;
    snippet: string;
  }>;
}

export interface EvidenceSnippet {
  field: string;
  snippet: string;
  confidence: number;
  sourceLineNumber?: number;
}

export interface ParsedContent {
  title?: string;
  symptoms: string[];
  repairSteps: Array<{ step: number; action: string }>;
  tools: string[];
  torqueSpecs: Array<{ component: string; value_nm?: number }>;
  vehicle: {
    make: string;
    model: string;
    year?: number;
    engine?: string;
  };
  errorCodes: string[];
  confidence: number;
}

/**
 * ADVANCED SYMPTOM EXTRACTION
 */

export function extractSymptomsAdvanced(content: string): string[] {
  const symptoms: string[] = [];
  const seen = new Set<string>();

  // Pattern 1: "symptom: ...", "symptoms: ...", "issue: ...", "problem: ..."
  const pattern1 = /(?:symptom|symptoms|issue|problem|complaint|complains?)[:\s]+([^.\n]+[.!?]?)/gi;
  let match;
  while ((match = pattern1.exec(content)) !== null) {
    const symptom = normalizeSymptom(match[1] || match[0]);
    if (symptom && !seen.has(symptom)) {
      symptoms.push(symptom);
      seen.add(symptom);
    }
  }

  // Pattern 2: "the car ...", "the engine ...", "the vehicle ..."
  const pattern2 = /(?:the (?:car|engine|vehicle|transmission|battery|alternator)[^.!?]*[.!?])/gi;
  while ((match = pattern2.exec(content)) !== null) {
    const symptom = normalizeSymptom(match[0]);
    if (symptom && !seen.has(symptom)) {
      symptoms.push(symptom);
      seen.add(symptom);
    }
  }

  // Pattern 3: "I noticed ...", "I experienced ...", "I had ..."
  const pattern3 = /(?:I (?:noticed|experienced|had|observed|found|saw)[^.!?]*[.!?])/gi;
  while ((match = pattern3.exec(content)) !== null) {
    const symptom = normalizeSymptom(match[0]);
    if (symptom && !seen.has(symptom)) {
      symptoms.push(symptom);
      seen.add(symptom);
    }
  }

  // Pattern 4: Bullet points or lists
  const pattern4 = /(?:^|\n)[-•*]\s+([^.\n]+[.!?]?)/gm;
  while ((match = pattern4.exec(content)) !== null) {
    const symptom = normalizeSymptom(match[1]);
    if (symptom && !seen.has(symptom)) {
      symptoms.push(symptom);
      seen.add(symptom);
    }
  }

  // Pattern 5: Common symptom keywords
  const symptomKeywords = [
    'rough idle', 'engine misfire', 'check engine light', 'poor fuel economy',
    'stalling', 'loss of power', 'hesitation', 'knocking', 'grinding',
    'squealing', 'overheating', 'coolant leak', 'oil leak', 'transmission slip',
    'hard shifting', 'no start', 'slow start', 'battery drain', 'electrical issue'
  ];

  for (const keyword of symptomKeywords) {
    if (content.toLowerCase().includes(keyword)) {
      if (!seen.has(keyword)) {
        symptoms.push(keyword);
        seen.add(keyword);
      }
    }
  }

  return symptoms.slice(0, 10); // Max 10 symptoms
}

function normalizeSymptom(symptom: string): string {
  return symptom
    .replace(/^[-•*]\s+/, '') // Remove bullet points
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .substring(0, 200); // Max 200 chars
}

/**
 * ADVANCED REPAIR STEP EXTRACTION
 */

export function extractRepairStepsAdvanced(content: string): Array<{ step: number; action: string }> {
  const steps: Array<{ step: number; action: string }> = [];
  const seen = new Set<string>();
  let stepNumber = 1;

  // Pattern 1: "step 1: ...", "step 2: ...", etc.
  const pattern1 = /(?:step\s+(\d+)|first|second|third|next|then)[:\s]+([^.\n]+[.!?]?)/gi;
  let match;
  while ((match = pattern1.exec(content)) !== null) {
    const action = normalizeStep(match[2] || match[0]);
    if (action && !seen.has(action) && !isPlaceholderStep(action)) {
      steps.push({ step: stepNumber++, action });
      seen.add(action);
    }
  }

  // Pattern 2: "1. ...", "2. ...", "- ..."
  const pattern2 = /(?:^\d+\.|^-)\s+([^.\n]+[.!?]?)/gim;
  while ((match = pattern2.exec(content)) !== null) {
    const action = normalizeStep(match[1]);
    if (action && !seen.has(action) && !isPlaceholderStep(action)) {
      steps.push({ step: stepNumber++, action });
      seen.add(action);
    }
  }

  // Pattern 3: Action verbs (replace, install, check, measure, test, inspect, clean, remove)
  const actionVerbs = [
    'replace', 'install', 'check', 'measure', 'test', 'inspect', 'clean',
    'remove', 'disconnect', 'connect', 'tighten', 'loosen', 'adjust',
    'verify', 'confirm', 'diagnose', 'repair', 'fix', 'swap', 'upgrade'
  ];

  for (const verb of actionVerbs) {
    const pattern = new RegExp(`${verb}[^.!?]*[.!?]`, 'gi');
    while ((match = pattern.exec(content)) !== null) {
      const action = normalizeStep(match[0]);
      if (action && !seen.has(action) && !isPlaceholderStep(action)) {
        steps.push({ step: stepNumber++, action });
        seen.add(action);
      }
    }
  }

  return steps.slice(0, 15); // Max 15 steps
}

function normalizeStep(step: string): string {
  return step
    .replace(/^\d+\.\s+/, '') // Remove numbering
    .replace(/^-\s+/, '') // Remove bullets
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .substring(0, 300); // Max 300 chars
}

function isPlaceholderStep(step: string): boolean {
  const placeholders = [
    'see manual', 'consult mechanic', 'fix problem', 'generic',
    'placeholder', 'test', 'example', 'n/a', 'unknown'
  ];
  return placeholders.some(p => step.toLowerCase().includes(p));
}

/**
 * ADVANCED TOOL EXTRACTION
 */

export function extractToolsAdvanced(content: string): string[] {
  const tools: string[] = [];
  const seen = new Set<string>();

  const toolPatterns = [
    { pattern: /OBD\s+(?:scanner|reader|code reader)/gi, name: 'OBD scanner' },
    { pattern: /multimeter/gi, name: 'multimeter' },
    { pattern: /torque\s+wrench/gi, name: 'torque wrench' },
    { pattern: /compression\s+tester/gi, name: 'compression tester' },
    { pattern: /fuel\s+pressure\s+gauge/gi, name: 'fuel pressure gauge' },
    { pattern: /oscilloscope/gi, name: 'oscilloscope' },
    { pattern: /scan\s+tool/gi, name: 'scan tool' },
    { pattern: /diagnostic\s+tool/gi, name: 'diagnostic tool' },
    { pattern: /socket\s+set/gi, name: 'socket set' },
    { pattern: /wrench/gi, name: 'wrench' },
    { pattern: /screwdriver/gi, name: 'screwdriver' },
    { pattern: /pliers/gi, name: 'pliers' },
    { pattern: /hammer/gi, name: 'hammer' },
    { pattern: /jack/gi, name: 'jack' },
    { pattern: /lift/gi, name: 'lift' },
    { pattern: /vacuum\s+pump/gi, name: 'vacuum pump' },
    { pattern: /pressure\s+tester/gi, name: 'pressure tester' },
    { pattern: /leak\s+detector/gi, name: 'leak detector' },
    { pattern: /timing\s+light/gi, name: 'timing light' },
    { pattern: /stroboscope/gi, name: 'stroboscope' }
  ];

  for (const { pattern, name } of toolPatterns) {
    if (pattern.test(content) && !seen.has(name)) {
      tools.push(name);
      seen.add(name);
    }
  }

  return tools;
}

/**
 * ADVANCED TORQUE SPEC EXTRACTION
 */

export function extractTorqueSpecsAdvanced(content: string): Array<{ component: string; value_nm?: number }> {
  const specs: Array<{ component: string; value_nm?: number }> = [];
  const seen = new Set<string>();

  // Pattern 1: "component: 25 Nm", "component = 25 Nm"
  const pattern1 = /(\w+(?:\s+\w+)?)\s*[:=]\s*(\d+(?:\.\d+)?)\s*(?:Nm|N·m|ft-lbs?|ft·lbs?|in-lbs?|in·lbs?)\b/gi;
  let match;
  while ((match = pattern1.exec(content)) !== null) {
    const component = match[1].trim();
    let value = parseFloat(match[2]);

    // Convert to Nm if needed
    if (match[0].toLowerCase().includes('ft-lbs') || match[0].toLowerCase().includes('ft·lbs')) {
      value = value * 1.355; // Convert ft-lbs to Nm
    } else if (match[0].toLowerCase().includes('in-lbs') || match[0].toLowerCase().includes('in·lbs')) {
      value = value * 0.1129; // Convert in-lbs to Nm
    }

    const key = `${component}:${value}`;
    if (!seen.has(key)) {
      specs.push({ component, value_nm: Math.round(value * 10) / 10 });
      seen.add(key);
    }
  }

  // Pattern 2: "torque X to Y Nm", "tighten X to Y Nm"
  const pattern2 = /(?:torque|tighten)\s+(?:the\s+)?(\w+(?:\s+\w+)?)\s+(?:to|spec)?[:\s]+(\d+(?:\.\d+)?)\s*(?:Nm|N·m)/gi;
  while ((match = pattern2.exec(content)) !== null) {
    const component = match[1].trim();
    const value = parseFloat(match[2]);
    const key = `${component}:${value}`;

    if (!seen.has(key)) {
      specs.push({ component, value_nm: value });
      seen.add(key);
    }
  }

  return specs;
}

/**
 * PARSE COMPLETE CONTENT
 */

export function parseContentAdvanced(content: string, sourceType: string): ParsedContent {
  const symptoms = extractSymptomsAdvanced(content);
  const repairSteps = extractRepairStepsAdvanced(content);
  const tools = extractToolsAdvanced(content);
  const torqueSpecs = extractTorqueSpecsAdvanced(content);

  // Extract vehicle info (reuse from collector agents)
  const vehicle = extractVehicleInfo(content);

  // Extract error codes
  const errorCodes = extractErrorCodes(content);

  // Calculate confidence
  let confidence = 0.70;
  if (symptoms.length >= 2) confidence += 0.05;
  if (repairSteps.length >= 3) confidence += 0.05;
  if (tools.length > 0) confidence += 0.03;
  if (torqueSpecs.length > 0) confidence += 0.05;
  if (vehicle.make !== 'Unknown') confidence += 0.05;
  if (errorCodes.length > 0) confidence += 0.05;

  confidence = Math.min(0.95, Math.max(0.70, confidence));

  return {
    symptoms,
    repairSteps,
    tools,
    torqueSpecs,
    vehicle,
    errorCodes,
    confidence
  };
}

/**
 * HELPER FUNCTIONS (from collector agents)
 */

function extractVehicleInfo(text: string): {
  make: string;
  model: string;
  year?: number;
  engine?: string;
} {
  const makes = [
    'BMW', 'VW', 'Volkswagen', 'Audi', 'Ford', 'Honda', 'Toyota',
    'Nissan', 'Mercedes', 'Volvo', 'Chevrolet', 'GMC', 'Dodge',
    'Jeep', 'Hyundai', 'Kia', 'Mazda', 'Subaru', 'Lexus', 'Acura'
  ];

  const makeRegex = new RegExp(`\\b(${makes.join('|')})\\b`, 'i');
  const makeMatch = text.match(makeRegex);
  const make = makeMatch ? makeMatch[1] : 'Unknown';

  const modelRegex = new RegExp(`${make}\\s+([A-Z0-9\\-]+)`, 'i');
  const modelMatch = text.match(modelRegex);
  const model = modelMatch ? modelMatch[1] : 'Unknown';

  const yearRegex = /\b(19\d{2}|20\d{2})\b/;
  const yearMatch = text.match(yearRegex);
  const year = yearMatch ? parseInt(yearMatch[1]) : undefined;

  const engineRegex = /\b(V\d|I\d|W\d|\d+\.\d+L)\b/i;
  const engineMatch = text.match(engineRegex);
  const engine = engineMatch ? engineMatch[1] : undefined;

  return { make, model, year, engine };
}

function extractErrorCodes(text: string): string[] {
  const codeRegex = /\b([PUB][0-3]\d{3})\b/g;
  const matches = text.match(codeRegex) || [];
  return [...new Set(matches)];
}
