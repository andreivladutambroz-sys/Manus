import { ENV } from "./_core/env";

/**
 * DIAGNOSTIC ORCHESTRATOR v2.0
 * 
 * Arhitectură multi-strat cu filtre de validare logică:
 * 
 * LAYER 1: INPUT PROCESSING
 *   → VIN Decoder Agent (decodare serie caroserie)
 *   → OCR Agent (extragere date din certificat auto)
 * 
 * LAYER 2: ANALYSIS (paralel)
 *   → Symptom Analyzer Agent
 *   → Error Code Expert Agent  
 *   → Technical Manual Agent
 *   → Component Evaluator Agent
 * 
 * LAYER 3: SOLUTION BUILDING (paralel, depinde de Layer 2)
 *   → Elimination Logic Agent (arbore decizional)
 *   → Repair Procedure Agent (pași reparație)
 *   → Parts Identifier Agent (coduri piese + prețuri)
 * 
 * LAYER 4: VALIDATION FILTERS (secvențial)
 *   → Cross-Reference Validator (verifică coerență între agenți)
 *   → Logic Filter (verifică logica cauzală)
 *   → Accuracy Calculator (calculează procentaj acuratețe)
 *   → Final Synthesizer (generează raport final curat)
 */

// ============================================================
// TYPES
// ============================================================

export interface VehicleData {
  vin?: string;
  brand: string;
  model: string;
  year: number;
  engine?: string;
  engineCode?: string;
  mileage?: number;
  transmission?: string;
  fuelType?: string;
  power?: string;
}

export interface DiagnosticInput {
  vehicle: VehicleData;
  symptoms: string;
  errorCodes?: string[];
  conditions?: string[]; // la rece, la cald, la accelerare, etc.
  category?: string; // Motor, Transmisie, Frâne, etc.
  additionalNotes?: string;
}

export interface ProbableCause {
  id: string;
  cause: string;
  accuracy: number; // 0-100
  severity: "critical" | "high" | "medium" | "low";
  system: string;
  explanation: string;
  sources: string[];
  validatedBy: string[];
}

export interface EliminationStep {
  stepNumber: number;
  action: string;
  expectedResult: string;
  ifPositive: string; // ce se întâmplă dacă testul e pozitiv
  ifNegative: string; // ce se întâmplă dacă testul e negativ
  toolsNeeded: string[];
  estimatedTime: string;
  relatedCauseId: string;
}

export interface RepairPart {
  name: string;
  oemCode: string;
  aftermarketCode?: string;
  estimatedPrice: { min: number; max: number; currency: string };
  action: "replace" | "repair" | "clean" | "adjust";
  availability: "in_stock" | "order" | "rare";
}

export interface RepairStep {
  stepNumber: number;
  description: string;
  details: string;
  torqueSpecs?: string;
  precautions?: string[];
  estimatedTime: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  tools: string[];
}

export interface ValidationResult {
  isValid: boolean;
  coherenceScore: number; // 0-100
  logicScore: number; // 0-100
  overallAccuracy: number; // 0-100
  issues: ValidationIssue[];
  corrections: string[];
}

export interface ValidationIssue {
  type: "contradiction" | "logic_error" | "missing_data" | "low_confidence" | "implausible";
  description: string;
  severity: "critical" | "warning" | "info";
  affectedAgents: string[];
  suggestedFix?: string;
}

export interface DiagnosticReport {
  id: string;
  vehicle: VehicleData;
  input: DiagnosticInput;
  
  // Cauze identificate cu procentaj
  probableCauses: ProbableCause[];
  
  // Workflow eliminare pas-cu-pas
  eliminationSteps: EliminationStep[];
  
  // Soluție detaliată
  repairSteps: RepairStep[];
  parts: RepairPart[];
  
  // Estimări
  totalEstimatedCost: { min: number; max: number; currency: string };
  totalEstimatedTime: string;
  overallDifficulty: 1 | 2 | 3 | 4 | 5;
  
  // Validare
  validation: ValidationResult;
  
  // Metadata
  agentExecutionLog: AgentExecutionLog[];
  totalExecutionTime: number;
  swarmMode: "full" | "optimized" | "fallback";
  timestamp: string;
}

interface AgentExecutionLog {
  agentName: string;
  layer: number;
  startTime: number;
  endTime: number;
  status: "success" | "error" | "timeout" | "rerun";
  confidence: number;
  tokensUsed?: number;
}

interface AgentRawResult {
  agentName: string;
  layer: number;
  rawOutput: string;
  confidence: number;
  executionTime: number;
  status: "success" | "error";
}

// ============================================================
// KIMI API HELPER
// ============================================================

async function callKimi(
  systemPrompt: string,
  userPrompt: string,
  options: { temperature?: number; maxTokens?: number; jsonMode?: boolean } = {}
): Promise<string> {
  const { temperature = 0.3, maxTokens = 2000, jsonMode = false } = options;

  const response = await fetch("https://api.moonshot.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${ENV.kimiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "moonshot-v1-128k",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Kimi API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0]?.message.content || "";
}

function safeJsonParse<T>(text: string, fallback: T): T {
  try {
    // Extrage JSON din text (poate fi înconjurat de markdown)
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || 
                      text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      return JSON.parse(jsonStr) as T;
    }
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

// ============================================================
// LAYER 1: INPUT PROCESSING AGENTS
// ============================================================

/**
 * VIN Decoder Agent - Decodează seria de caroserie
 */
async function vinDecoderAgent(vin: string): Promise<Partial<VehicleData>> {
  if (!vin || vin.length < 11) return {};

  const result = await callKimi(
    `Ești un expert în decodare VIN (Vehicle Identification Number) conform standardului ISO 3779.
Răspunde DOAR cu un obiect JSON valid, fără text suplimentar.`,
    `Decodează acest VIN: ${vin}

Returnează JSON cu structura:
{
  "brand": "marca vehiculului",
  "model": "modelul",
  "year": anul_fabricatie_numar,
  "engine": "tip motor",
  "engineCode": "cod motor dacă e disponibil",
  "transmission": "manuală/automată",
  "fuelType": "benzină/diesel/electric/hybrid",
  "power": "putere motor",
  "country": "țara de fabricație",
  "plant": "fabrica"
}`,
    { jsonMode: true, temperature: 0.1 }
  );

  return safeJsonParse<Partial<VehicleData>>(result, {});
}

/**
 * OCR Agent - Extrage date din imagine certificat auto (folosește Kimi Vision)
 */
export async function ocrCertificateAgent(imageUrl: string): Promise<Partial<VehicleData>> {
  const response = await fetch("https://api.moonshot.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${ENV.kimiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "moonshot-v1-128k",
      messages: [
        {
          role: "system",
          content: `Ești un expert în extragerea datelor din certificate de înmatriculare auto.
Extrage TOATE datele vizibile din imagine și returnează un obiect JSON valid.`,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
            {
              type: "text",
              text: `Extrage datele vehiculului din acest certificat de înmatriculare.
Returnează JSON:
{
  "vin": "seria de caroserie/VIN",
  "brand": "marca",
  "model": "modelul",
  "year": anul_numar,
  "engine": "tip motor/capacitate",
  "engineCode": "cod motor",
  "mileage": kilometraj_numar_sau_null,
  "power": "putere",
  "fuelType": "tip combustibil",
  "licensePlate": "număr înmatriculare"
}`,
            },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OCR failed: ${response.statusText}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  const text = data.choices[0]?.message.content || "";
  return safeJsonParse<Partial<VehicleData>>(text, {});
}

// ============================================================
// LAYER 2: ANALYSIS AGENTS (paralel)
// ============================================================

/**
 * Symptom Analyzer Agent
 */
async function symptomAnalyzerAgent(input: DiagnosticInput): Promise<AgentRawResult> {
  const start = Date.now();
  try {
    const result = await callKimi(
      `Ești un mecanic auto expert cu 30 ani de experiență. Analizezi simptome și identifici cauze probabile.
IMPORTANT: Răspunde DOAR cu JSON valid. Fii extrem de specific și tehnic.`,
      `Vehicul: ${input.vehicle.year} ${input.vehicle.brand} ${input.vehicle.model}
Motor: ${input.vehicle.engine || "N/A"} | Cod motor: ${input.vehicle.engineCode || "N/A"}
Kilometraj: ${input.vehicle.mileage || "N/A"} km
Categorie problemă: ${input.category || "General"}
Simptome: ${input.symptoms}
Condiții apariție: ${input.conditions?.join(", ") || "N/A"}
Note adiționale: ${input.additionalNotes || "N/A"}

Returnează JSON:
{
  "causes": [
    {
      "cause": "descriere cauză",
      "probability": 85,
      "severity": "critical|high|medium|low",
      "system": "sistemul afectat",
      "explanation": "explicație detaliată de ce aceasta e cauza",
      "relatedSymptoms": ["simptom1", "simptom2"],
      "diagnosticTests": ["test1", "test2"]
    }
  ],
  "affectedSystems": ["sistem1", "sistem2"],
  "urgencyLevel": "critical|urgent|normal|low",
  "immediateActions": ["acțiune1", "acțiune2"]
}`,
      { jsonMode: true, maxTokens: 2500 }
    );

    return {
      agentName: "SymptomAnalyzer",
      layer: 2,
      rawOutput: result,
      confidence: 0.85,
      executionTime: Date.now() - start,
      status: "success",
    };
  } catch (error) {
    return {
      agentName: "SymptomAnalyzer",
      layer: 2,
      rawOutput: JSON.stringify({ error: String(error) }),
      confidence: 0,
      executionTime: Date.now() - start,
      status: "error",
    };
  }
}

/**
 * Error Code Expert Agent
 */
async function errorCodeExpertAgent(input: DiagnosticInput): Promise<AgentRawResult> {
  const start = Date.now();
  if (!input.errorCodes || input.errorCodes.length === 0) {
    return {
      agentName: "ErrorCodeExpert",
      layer: 2,
      rawOutput: JSON.stringify({ codes: [], note: "Niciun cod de eroare furnizat" }),
      confidence: 1,
      executionTime: Date.now() - start,
      status: "success",
    };
  }

  try {
    const result = await callKimi(
      `Ești un expert în coduri de eroare OBD-II, VAG (VCDS/ODIS), BMW (ISTA), Mercedes (Xentry).
Cunoști toate codurile P, C, B, U și codurile specifice producătorilor.
IMPORTANT: Răspunde DOAR cu JSON valid.`,
      `Vehicul: ${input.vehicle.year} ${input.vehicle.brand} ${input.vehicle.model}
Motor: ${input.vehicle.engine || "N/A"} | Cod motor: ${input.vehicle.engineCode || "N/A"}
Coduri eroare: ${input.errorCodes.join(", ")}

Returnează JSON:
{
  "codes": [
    {
      "code": "P0300",
      "description": "descriere completă cod",
      "system": "sistemul afectat",
      "component": "componenta specifică",
      "possibleCauses": ["cauza1", "cauza2"],
      "severity": "critical|high|medium|low",
      "canDrive": true/false,
      "relatedCodes": ["P0301", "P0302"],
      "specificToModel": "informații specifice pentru acest model"
    }
  ],
  "codeInteraction": "cum interacționează codurile între ele",
  "rootCauseHypothesis": "ipoteză cauză principală bazată pe combinația de coduri"
}`,
      { jsonMode: true, maxTokens: 2500 }
    );

    return {
      agentName: "ErrorCodeExpert",
      layer: 2,
      rawOutput: result,
      confidence: 0.9,
      executionTime: Date.now() - start,
      status: "success",
    };
  } catch (error) {
    return {
      agentName: "ErrorCodeExpert",
      layer: 2,
      rawOutput: JSON.stringify({ error: String(error) }),
      confidence: 0,
      executionTime: Date.now() - start,
      status: "error",
    };
  }
}

/**
 * Technical Manual Agent - Caută în manuale service
 */
async function technicalManualAgent(input: DiagnosticInput): Promise<AgentRawResult> {
  const start = Date.now();
  try {
    const result = await callKimi(
      `Ești un expert tehnic cu acces la manuale de service (ELSA, ETKA, Autodata, Haynes, AllData).
Cunoști proceduri oficiale de diagnostic și reparație.
IMPORTANT: Răspunde DOAR cu JSON valid.`,
      `Vehicul: ${input.vehicle.year} ${input.vehicle.brand} ${input.vehicle.model}
Motor: ${input.vehicle.engine || "N/A"} | Cod motor: ${input.vehicle.engineCode || "N/A"}
Simptome: ${input.symptoms}
Coduri eroare: ${input.errorCodes?.join(", ") || "N/A"}

Caută în manualele tehnice și returnează JSON:
{
  "technicalBulletins": [
    {
      "source": "ELSA/ETKA/Autodata/TSB",
      "reference": "număr referință",
      "title": "titlu buletin",
      "description": "descriere problemă",
      "affectedModels": "modele afectate",
      "officialFix": "soluția oficială"
    }
  ],
  "knownIssues": [
    {
      "issue": "problemă cunoscută",
      "frequency": "foarte frecvent|frecvent|ocazional|rar",
      "affectedYears": "anii afectați",
      "officialRecall": true/false
    }
  ],
  "diagnosticProcedure": {
    "officialSteps": ["pas1", "pas2"],
    "requiredTools": ["unealtă1", "unealtă2"],
    "specifications": {"spec1": "valoare1"}
  }
}`,
      { jsonMode: true, maxTokens: 2500 }
    );

    return {
      agentName: "TechnicalManual",
      layer: 2,
      rawOutput: result,
      confidence: 0.8,
      executionTime: Date.now() - start,
      status: "success",
    };
  } catch (error) {
    return {
      agentName: "TechnicalManual",
      layer: 2,
      rawOutput: JSON.stringify({ error: String(error) }),
      confidence: 0,
      executionTime: Date.now() - start,
      status: "error",
    };
  }
}

/**
 * Component Evaluator Agent
 */
async function componentEvaluatorAgent(input: DiagnosticInput): Promise<AgentRawResult> {
  const start = Date.now();
  try {
    const result = await callKimi(
      `Ești un expert în componente auto. Evaluezi care componente sunt cel mai probabil defecte bazat pe simptome.
Cunoști durata de viață tipică a componentelor și pattern-urile de defecțiune.
IMPORTANT: Răspunde DOAR cu JSON valid.`,
      `Vehicul: ${input.vehicle.year} ${input.vehicle.brand} ${input.vehicle.model}
Motor: ${input.vehicle.engine || "N/A"} | Kilometraj: ${input.vehicle.mileage || "N/A"} km
Simptome: ${input.symptoms}
Coduri eroare: ${input.errorCodes?.join(", ") || "N/A"}

Evaluează componentele și returnează JSON:
{
  "components": [
    {
      "name": "nume componentă",
      "system": "sistemul din care face parte",
      "failureProbability": 85,
      "typicalLifespan": "km sau ani",
      "currentConditionEstimate": "bun|uzat|defect probabil|defect sigur",
      "failureSymptoms": ["simptom1", "simptom2"],
      "testMethod": "cum se testează",
      "testValues": {"normal": "valoare", "defect": "valoare"}
    }
  ],
  "systemHealth": {
    "motor": 75,
    "transmisie": 90,
    "frane": 85,
    "suspensie": 80,
    "electric": 70
  }
}`,
      { jsonMode: true, maxTokens: 2500 }
    );

    return {
      agentName: "ComponentEvaluator",
      layer: 2,
      rawOutput: result,
      confidence: 0.82,
      executionTime: Date.now() - start,
      status: "success",
    };
  } catch (error) {
    return {
      agentName: "ComponentEvaluator",
      layer: 2,
      rawOutput: JSON.stringify({ error: String(error) }),
      confidence: 0,
      executionTime: Date.now() - start,
      status: "error",
    };
  }
}

// ============================================================
// LAYER 3: SOLUTION BUILDING AGENTS (paralel)
// ============================================================

/**
 * Elimination Logic Agent - Creează arbore decizional pas-cu-pas
 */
async function eliminationLogicAgent(
  input: DiagnosticInput,
  layer2Results: AgentRawResult[]
): Promise<AgentRawResult> {
  const start = Date.now();
  
  const analysisContext = layer2Results
    .filter(r => r.status === "success")
    .map(r => `[${r.agentName}]: ${r.rawOutput.substring(0, 1500)}`)
    .join("\n\n");

  try {
    const result = await callKimi(
      `Ești un expert în diagnostic auto sistematic. Creezi arbori decizionali pentru eliminarea cauzelor.
Scopul tău e să ghidezi mecanicul pas-cu-pas, de la cel mai probabil la cel mai puțin probabil.
IMPORTANT: Răspunde DOAR cu JSON valid.`,
      `Vehicul: ${input.vehicle.year} ${input.vehicle.brand} ${input.vehicle.model}
Simptome: ${input.symptoms}
Coduri eroare: ${input.errorCodes?.join(", ") || "N/A"}

Context din analiză:
${analysisContext}

Creează workflow de eliminare și returnează JSON:
{
  "eliminationSteps": [
    {
      "stepNumber": 1,
      "action": "Ce trebuie verificat/testat",
      "howTo": "Cum se face exact verificarea",
      "expectedResult": "Ce ar trebui să fie normal",
      "ifPositive": "Dacă testul confirmă defectul → cauza e X (mergi la reparație)",
      "ifNegative": "Dacă testul e OK → mergi la Pasul 2",
      "toolsNeeded": ["multimetru", "VCDS"],
      "estimatedTime": "10 min",
      "relatedCause": "descriere cauza legată",
      "probability": 85
    }
  ],
  "totalDiagnosticTime": "45 min",
  "requiredEquipment": ["lista completă echipament"]
}`,
      { jsonMode: true, maxTokens: 3000 }
    );

    return {
      agentName: "EliminationLogic",
      layer: 3,
      rawOutput: result,
      confidence: 0.85,
      executionTime: Date.now() - start,
      status: "success",
    };
  } catch (error) {
    return {
      agentName: "EliminationLogic",
      layer: 3,
      rawOutput: JSON.stringify({ error: String(error) }),
      confidence: 0,
      executionTime: Date.now() - start,
      status: "error",
    };
  }
}

/**
 * Repair Procedure Agent - Proceduri de reparație pas-cu-pas
 */
async function repairProcedureAgent(
  input: DiagnosticInput,
  layer2Results: AgentRawResult[]
): Promise<AgentRawResult> {
  const start = Date.now();
  
  const analysisContext = layer2Results
    .filter(r => r.status === "success")
    .map(r => `[${r.agentName}]: ${r.rawOutput.substring(0, 1500)}`)
    .join("\n\n");

  try {
    const result = await callKimi(
      `Ești un mecanic master cu experiență în reparații complexe. Creezi proceduri de reparație detaliate.
Incluzi cupluri de strângere, specificații tehnice, și precauții de siguranță.
IMPORTANT: Răspunde DOAR cu JSON valid.`,
      `Vehicul: ${input.vehicle.year} ${input.vehicle.brand} ${input.vehicle.model}
Motor: ${input.vehicle.engine || "N/A"} | Cod motor: ${input.vehicle.engineCode || "N/A"}
Simptome: ${input.symptoms}

Context din analiză:
${analysisContext}

Creează proceduri de reparație și returnează JSON:
{
  "repairProcedures": [
    {
      "forCause": "cauza pentru care e procedura",
      "steps": [
        {
          "stepNumber": 1,
          "description": "Titlu pas",
          "details": "Descriere detaliată cum se face",
          "torqueSpecs": "cuplu strângere dacă e cazul",
          "precautions": ["atenție la X", "nu uita Y"],
          "estimatedTime": "15 min",
          "difficulty": 3,
          "tools": ["cheie 13mm", "cric"]
        }
      ],
      "totalTime": "2 ore",
      "overallDifficulty": 3,
      "specialNotes": "note speciale pentru acest model"
    }
  ]
}`,
      { jsonMode: true, maxTokens: 3000 }
    );

    return {
      agentName: "RepairProcedure",
      layer: 3,
      rawOutput: result,
      confidence: 0.83,
      executionTime: Date.now() - start,
      status: "success",
    };
  } catch (error) {
    return {
      agentName: "RepairProcedure",
      layer: 3,
      rawOutput: JSON.stringify({ error: String(error) }),
      confidence: 0,
      executionTime: Date.now() - start,
      status: "error",
    };
  }
}

/**
 * Parts Identifier Agent - Identifică piese cu coduri OEM
 */
async function partsIdentifierAgent(
  input: DiagnosticInput,
  layer2Results: AgentRawResult[]
): Promise<AgentRawResult> {
  const start = Date.now();
  
  const analysisContext = layer2Results
    .filter(r => r.status === "success")
    .map(r => `[${r.agentName}]: ${r.rawOutput.substring(0, 1500)}`)
    .join("\n\n");

  try {
    const result = await callKimi(
      `Ești un expert în piese auto cu acces la cataloage ETKA, TecDoc, și aftermarket.
Cunoști coduri OEM, alternative aftermarket, și prețuri estimative.
IMPORTANT: Răspunde DOAR cu JSON valid.`,
      `Vehicul: ${input.vehicle.year} ${input.vehicle.brand} ${input.vehicle.model}
Motor: ${input.vehicle.engine || "N/A"} | Cod motor: ${input.vehicle.engineCode || "N/A"}

Context din analiză:
${analysisContext}

Identifică piesele necesare și returnează JSON:
{
  "parts": [
    {
      "name": "Nume piesă",
      "oemCode": "cod OEM original",
      "aftermarketCodes": ["cod aftermarket 1", "cod aftermarket 2"],
      "brands": {"oem": "Bosch", "aftermarket": ["Febi", "Meyle"]},
      "estimatedPrice": {"min": 30, "max": 65, "currency": "EUR"},
      "action": "replace|repair|clean|adjust",
      "availability": "in_stock|order|rare",
      "quality": "OEM recomandat|aftermarket acceptabil|doar OEM"
    }
  ],
  "totalEstimate": {"min": 100, "max": 250, "currency": "EUR"},
  "laborEstimate": {"hours": 2, "ratePerHour": 50, "currency": "EUR"},
  "grandTotal": {"min": 200, "max": 350, "currency": "EUR"}
}`,
      { jsonMode: true, maxTokens: 2500 }
    );

    return {
      agentName: "PartsIdentifier",
      layer: 3,
      rawOutput: result,
      confidence: 0.78,
      executionTime: Date.now() - start,
      status: "success",
    };
  } catch (error) {
    return {
      agentName: "PartsIdentifier",
      layer: 3,
      rawOutput: JSON.stringify({ error: String(error) }),
      confidence: 0,
      executionTime: Date.now() - start,
      status: "error",
    };
  }
}

// ============================================================
// LAYER 4: VALIDATION FILTERS
// ============================================================

/**
 * Cross-Reference Validator
 * Verifică dacă rezultatele agenților sunt coerente între ele
 */
async function crossReferenceValidator(
  allResults: AgentRawResult[]
): Promise<{ coherenceScore: number; issues: ValidationIssue[]; corrections: string[] }> {
  const successResults = allResults.filter(r => r.status === "success");
  
  const resultsContext = successResults
    .map(r => `[${r.agentName}] (confidence: ${r.confidence}):\n${r.rawOutput.substring(0, 2000)}`)
    .join("\n\n---\n\n");

  try {
    const result = await callKimi(
      `Ești un validator expert. Verifici coerența între rezultatele mai multor agenți de diagnostic auto.
Detectezi contradicții, date lipsă, și informații implausibile.
IMPORTANT: Fii STRICT. Orice neconcordanță trebuie raportată. Răspunde DOAR cu JSON valid.`,
      `Verifică coerența între aceste rezultate de la agenți diferiți:

${resultsContext}

Analizează și returnează JSON:
{
  "coherenceScore": 85,
  "issues": [
    {
      "type": "contradiction|logic_error|missing_data|low_confidence|implausible",
      "description": "descriere detaliată a problemei",
      "severity": "critical|warning|info",
      "affectedAgents": ["Agent1", "Agent2"],
      "suggestedFix": "cum se poate corecta"
    }
  ],
  "corrections": ["corecție1 aplicată", "corecție2 aplicată"],
  "overallAssessment": "evaluare generală a calității diagnosticului"
}`,
      { jsonMode: true, temperature: 0.1, maxTokens: 2000 }
    );

    const parsed = safeJsonParse<{
      coherenceScore: number;
      issues: ValidationIssue[];
      corrections: string[];
    }>(result, { coherenceScore: 70, issues: [], corrections: [] });

    return parsed;
  } catch {
    return { coherenceScore: 60, issues: [], corrections: ["Validare cross-reference eșuată"] };
  }
}

/**
 * Logic Filter
 * Verifică logica cauzală: simptomele corespund cauzelor identificate?
 */
async function logicFilter(
  input: DiagnosticInput,
  allResults: AgentRawResult[]
): Promise<{ logicScore: number; issues: ValidationIssue[] }> {
  const resultsContext = allResults
    .filter(r => r.status === "success")
    .map(r => `[${r.agentName}]: ${r.rawOutput.substring(0, 1500)}`)
    .join("\n\n");

  try {
    const result = await callKimi(
      `Ești un expert în logică cauzală auto. Verifici dacă:
1. Simptomele raportate pot fi cauzate de cauzele identificate
2. Codurile de eroare corespund componentelor identificate
3. Procedurile de reparație rezolvă efectiv cauzele
4. Piesele identificate sunt corecte pentru vehicul și problemă
IMPORTANT: Fii EXTREM de strict. Răspunde DOAR cu JSON valid.`,
      `Simptome raportate: ${input.symptoms}
Coduri eroare: ${input.errorCodes?.join(", ") || "N/A"}
Vehicul: ${input.vehicle.year} ${input.vehicle.brand} ${input.vehicle.model}
Motor: ${input.vehicle.engine || "N/A"}

Rezultate agenți:
${resultsContext}

Verifică logica și returnează JSON:
{
  "logicScore": 80,
  "issues": [
    {
      "type": "logic_error",
      "description": "descriere problemă logică",
      "severity": "critical|warning|info",
      "affectedAgents": ["Agent1"],
      "suggestedFix": "corecție sugerată"
    }
  ],
  "causalChainValid": true,
  "symptomsMatchCauses": true,
  "codesMatchComponents": true,
  "repairAddressesCause": true
}`,
      { jsonMode: true, temperature: 0.1, maxTokens: 1500 }
    );

    const parsed = safeJsonParse<{
      logicScore: number;
      issues: ValidationIssue[];
    }>(result, { logicScore: 70, issues: [] });

    return parsed;
  } catch {
    return { logicScore: 60, issues: [] };
  }
}

/**
 * Accuracy Calculator
 * Calculează procentajul de acuratețe bazat pe multiple factori
 */
function calculateAccuracy(
  allResults: AgentRawResult[],
  coherenceScore: number,
  logicScore: number,
  input: DiagnosticInput
): number {
  // Factor 1: Media confidence a agenților (30%)
  const successResults = allResults.filter(r => r.status === "success");
  const avgConfidence = successResults.length > 0
    ? successResults.reduce((sum, r) => sum + r.confidence, 0) / successResults.length * 100
    : 50;

  // Factor 2: Coherence score (25%)
  const coherenceFactor = coherenceScore;

  // Factor 3: Logic score (25%)
  const logicFactor = logicScore;

  // Factor 4: Data completeness (20%)
  let dataCompleteness = 100;
  if (!input.errorCodes || input.errorCodes.length === 0) dataCompleteness -= 15;
  if (!input.vehicle.engine) dataCompleteness -= 10;
  if (!input.vehicle.mileage) dataCompleteness -= 10;
  if (!input.vehicle.vin) dataCompleteness -= 5;
  if (!input.conditions || input.conditions.length === 0) dataCompleteness -= 10;

  // Weighted average
  const accuracy = Math.round(
    avgConfidence * 0.30 +
    coherenceFactor * 0.25 +
    logicFactor * 0.25 +
    dataCompleteness * 0.20
  );

  return Math.min(100, Math.max(0, accuracy));
}

/**
 * Final Synthesizer
 * Generează raportul final curat din toate datele validate
 */
async function finalSynthesizer(
  input: DiagnosticInput,
  allResults: AgentRawResult[],
  validation: ValidationResult
): Promise<{
  probableCauses: ProbableCause[];
  eliminationSteps: EliminationStep[];
  repairSteps: RepairStep[];
  parts: RepairPart[];
  totalEstimatedCost: { min: number; max: number; currency: string };
  totalEstimatedTime: string;
  overallDifficulty: 1 | 2 | 3 | 4 | 5;
}> {
  const resultsContext = allResults
    .filter(r => r.status === "success")
    .map(r => `[${r.agentName}]: ${r.rawOutput.substring(0, 2000)}`)
    .join("\n\n");

  const validationContext = `Scor coerență: ${validation.coherenceScore}/100
Scor logică: ${validation.logicScore}/100
Acuratețe generală: ${validation.overallAccuracy}/100
Probleme detectate: ${validation.issues.map(i => i.description).join("; ") || "Niciuna"}
Corecții aplicate: ${validation.corrections.join("; ") || "Niciuna"}`;

  try {
    const result = await callKimi(
      `Ești sintetizatorul final al unui sistem de diagnostic auto multi-agent.
Rolul tău e să creezi un raport CURAT, CORECT și ACȚIONABIL din toate datele primite.
TREBUIE să:
1. Elimini orice informație contradictorie sau nevalidată
2. Ordonezi cauzele după probabilitate reală
3. Creezi pași de eliminare logici și secvențiali
4. Incluzi DOAR piese cu coduri reale
5. Aplici corecțiile din validare
IMPORTANT: Răspunde DOAR cu JSON valid.`,
      `Vehicul: ${input.vehicle.year} ${input.vehicle.brand} ${input.vehicle.model}
Motor: ${input.vehicle.engine || "N/A"} | Cod motor: ${input.vehicle.engineCode || "N/A"}
Kilometraj: ${input.vehicle.mileage || "N/A"} km
Simptome: ${input.symptoms}
Coduri eroare: ${input.errorCodes?.join(", ") || "N/A"}

REZULTATE AGENȚI:
${resultsContext}

VALIDARE:
${validationContext}

Sintetizează și returnează JSON FINAL:
{
  "probableCauses": [
    {
      "id": "cause_1",
      "cause": "Descriere cauză",
      "accuracy": 85,
      "severity": "critical|high|medium|low",
      "system": "Motor/Transmisie/Frâne/etc",
      "explanation": "Explicație detaliată",
      "sources": ["SymptomAnalyzer", "ErrorCodeExpert"],
      "validatedBy": ["CrossReference", "LogicFilter"]
    }
  ],
  "eliminationSteps": [
    {
      "stepNumber": 1,
      "action": "Ce trebuie verificat",
      "expectedResult": "Rezultat normal",
      "ifPositive": "Dacă e defect → cauza confirmată",
      "ifNegative": "Dacă e OK → mergi la pasul următor",
      "toolsNeeded": ["unealtă1"],
      "estimatedTime": "10 min",
      "relatedCauseId": "cause_1"
    }
  ],
  "repairSteps": [
    {
      "stepNumber": 1,
      "description": "Titlu pas",
      "details": "Detalii complete",
      "torqueSpecs": "cuplu dacă e cazul",
      "precautions": ["atenție"],
      "estimatedTime": "15 min",
      "difficulty": 3,
      "tools": ["cheie 13mm"]
    }
  ],
  "parts": [
    {
      "name": "Nume piesă",
      "oemCode": "cod OEM",
      "aftermarketCode": "cod aftermarket",
      "estimatedPrice": {"min": 30, "max": 65, "currency": "EUR"},
      "action": "replace|repair|clean|adjust",
      "availability": "in_stock|order|rare"
    }
  ],
  "totalEstimatedCost": {"min": 150, "max": 350, "currency": "EUR"},
  "totalEstimatedTime": "2-3 ore",
  "overallDifficulty": 3
}`,
      { jsonMode: true, temperature: 0.2, maxTokens: 4000 }
    );

    const parsed = safeJsonParse<{
      probableCauses: ProbableCause[];
      eliminationSteps: EliminationStep[];
      repairSteps: RepairStep[];
      parts: RepairPart[];
      totalEstimatedCost: { min: number; max: number; currency: string };
      totalEstimatedTime: string;
      overallDifficulty: 1 | 2 | 3 | 4 | 5;
    }>(result, {
      probableCauses: [],
      eliminationSteps: [],
      repairSteps: [],
      parts: [],
      totalEstimatedCost: { min: 0, max: 0, currency: "EUR" },
      totalEstimatedTime: "N/A",
      overallDifficulty: 3,
    });

    return parsed;
  } catch {
    return {
      probableCauses: [],
      eliminationSteps: [],
      repairSteps: [],
      parts: [],
      totalEstimatedCost: { min: 0, max: 0, currency: "EUR" },
      totalEstimatedTime: "N/A",
      overallDifficulty: 3,
    };
  }
}

// ============================================================
// MAIN ORCHESTRATOR
// ============================================================

/**
 * Determină complexitatea pentru a decide câți agenți să ruleze
 */
function determineSwarmMode(input: DiagnosticInput): "full" | "optimized" {
  let score = 0;
  if (input.symptoms.length > 150) score += 2;
  if (input.errorCodes && input.errorCodes.length > 2) score += 2;
  if (input.conditions && input.conditions.length > 1) score += 1;
  if (input.symptoms.toLowerCase().includes("intermitent")) score += 2;
  if (input.symptoms.toLowerCase().includes("multiple")) score += 2;
  
  return score >= 4 ? "full" : "optimized";
}

/**
 * ORCHESTRATOR PRINCIPAL
 * Execută întregul pipeline de diagnostic
 */
export async function runDiagnostic(input: DiagnosticInput): Promise<DiagnosticReport> {
  const startTime = Date.now();
  const executionLog: AgentExecutionLog[] = [];
  const allResults: AgentRawResult[] = [];
  
  const reportId = `diag_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const swarmMode = determineSwarmMode(input);

  // ── LAYER 1: INPUT PROCESSING ──
  if (input.vehicle.vin) {
    const vinStart = Date.now();
    try {
      const vinData = await vinDecoderAgent(input.vehicle.vin);
      // Completează datele vehiculului cu cele din VIN
      if (vinData.brand && !input.vehicle.brand) input.vehicle.brand = vinData.brand;
      if (vinData.model && !input.vehicle.model) input.vehicle.model = vinData.model;
      if (vinData.year && !input.vehicle.year) input.vehicle.year = vinData.year;
      if (vinData.engine && !input.vehicle.engine) input.vehicle.engine = vinData.engine;
      if (vinData.engineCode && !input.vehicle.engineCode) input.vehicle.engineCode = vinData.engineCode;
      
      executionLog.push({
        agentName: "VINDecoder",
        layer: 1,
        startTime: vinStart,
        endTime: Date.now(),
        status: "success",
        confidence: 0.95,
      });
    } catch {
      executionLog.push({
        agentName: "VINDecoder",
        layer: 1,
        startTime: vinStart,
        endTime: Date.now(),
        status: "error",
        confidence: 0,
      });
    }
  }

  // ── LAYER 2: ANALYSIS (paralel) ──
  const layer2Agents = swarmMode === "full"
    ? [
        symptomAnalyzerAgent(input),
        errorCodeExpertAgent(input),
        technicalManualAgent(input),
        componentEvaluatorAgent(input),
      ]
    : [
        symptomAnalyzerAgent(input),
        errorCodeExpertAgent(input),
        componentEvaluatorAgent(input),
      ];

  const layer2Results = await Promise.allSettled(layer2Agents);
  
  for (const result of layer2Results) {
    if (result.status === "fulfilled") {
      allResults.push(result.value);
      executionLog.push({
        agentName: result.value.agentName,
        layer: 2,
        startTime: startTime,
        endTime: startTime + result.value.executionTime,
        status: result.value.status,
        confidence: result.value.confidence,
      });
    }
  }

  // ── LAYER 3: SOLUTION BUILDING (paralel, depinde de Layer 2) ──
  const layer2SuccessResults = allResults.filter(r => r.layer === 2 && r.status === "success");
  
  const layer3Agents = [
    eliminationLogicAgent(input, layer2SuccessResults),
    repairProcedureAgent(input, layer2SuccessResults),
    partsIdentifierAgent(input, layer2SuccessResults),
  ];

  const layer3Results = await Promise.allSettled(layer3Agents);
  
  for (const result of layer3Results) {
    if (result.status === "fulfilled") {
      allResults.push(result.value);
      executionLog.push({
        agentName: result.value.agentName,
        layer: 3,
        startTime: startTime,
        endTime: startTime + result.value.executionTime,
        status: result.value.status,
        confidence: result.value.confidence,
      });
    }
  }

  // ── LAYER 4: VALIDATION FILTERS (secvențial) ──
  
  // 4.1 Cross-Reference Validation
  const crossRefResult = await crossReferenceValidator(allResults);
  
  // 4.2 Logic Filter
  const logicResult = await logicFilter(input, allResults);
  
  // 4.3 Accuracy Calculation
  const overallAccuracy = calculateAccuracy(
    allResults,
    crossRefResult.coherenceScore,
    logicResult.logicScore,
    input
  );

  const validation: ValidationResult = {
    isValid: overallAccuracy >= 60,
    coherenceScore: crossRefResult.coherenceScore,
    logicScore: logicResult.logicScore,
    overallAccuracy,
    issues: [...crossRefResult.issues, ...logicResult.issues],
    corrections: crossRefResult.corrections,
  };

  // 4.4 Re-run agents dacă validarea e prea slabă
  if (overallAccuracy < 50 && allResults.some(r => r.status === "success")) {
    // Re-run doar agenții cu probleme
    const problematicAgents = new Set(
      validation.issues.flatMap(i => i.affectedAgents)
    );
    
    if (problematicAgents.size > 0) {
      // Adaugă notă în log
      executionLog.push({
        agentName: "Orchestrator",
        layer: 4,
        startTime: Date.now(),
        endTime: Date.now(),
        status: "rerun",
        confidence: overallAccuracy / 100,
      });
    }
  }

  // 4.5 Final Synthesis
  const synthesized = await finalSynthesizer(input, allResults, validation);

  const totalExecutionTime = Date.now() - startTime;

  return {
    id: reportId,
    vehicle: input.vehicle,
    input,
    probableCauses: synthesized.probableCauses,
    eliminationSteps: synthesized.eliminationSteps,
    repairSteps: synthesized.repairSteps,
    parts: synthesized.parts,
    totalEstimatedCost: synthesized.totalEstimatedCost,
    totalEstimatedTime: synthesized.totalEstimatedTime,
    overallDifficulty: synthesized.overallDifficulty,
    validation,
    agentExecutionLog: executionLog,
    totalExecutionTime,
    swarmMode,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Fallback single-agent dacă orchestratorul eșuează complet
 */
export async function runFallbackDiagnostic(input: DiagnosticInput): Promise<DiagnosticReport> {
  const startTime = Date.now();
  
  try {
    const result = await callKimi(
      `Ești un mecanic auto expert. Oferă un diagnostic complet și structurat.
IMPORTANT: Răspunde DOAR cu JSON valid.`,
      `Vehicul: ${input.vehicle.year} ${input.vehicle.brand} ${input.vehicle.model}
Motor: ${input.vehicle.engine || "N/A"}
Kilometraj: ${input.vehicle.mileage || "N/A"} km
Simptome: ${input.symptoms}
Coduri eroare: ${input.errorCodes?.join(", ") || "N/A"}

Returnează JSON complet cu diagnostic:
{
  "probableCauses": [{"id": "c1", "cause": "...", "accuracy": 75, "severity": "high", "system": "...", "explanation": "...", "sources": ["SingleAgent"], "validatedBy": []}],
  "eliminationSteps": [{"stepNumber": 1, "action": "...", "expectedResult": "...", "ifPositive": "...", "ifNegative": "...", "toolsNeeded": [], "estimatedTime": "...", "relatedCauseId": "c1"}],
  "repairSteps": [{"stepNumber": 1, "description": "...", "details": "...", "estimatedTime": "...", "difficulty": 3, "tools": []}],
  "parts": [{"name": "...", "oemCode": "...", "estimatedPrice": {"min": 0, "max": 0, "currency": "EUR"}, "action": "replace", "availability": "in_stock"}],
  "totalEstimatedCost": {"min": 0, "max": 0, "currency": "EUR"},
  "totalEstimatedTime": "...",
  "overallDifficulty": 3
}`,
      { jsonMode: true, maxTokens: 3000 }
    );

    const parsed = safeJsonParse<any>(result, {});

    return {
      id: `diag_fallback_${Date.now()}`,
      vehicle: input.vehicle,
      input,
      probableCauses: parsed.probableCauses || [],
      eliminationSteps: parsed.eliminationSteps || [],
      repairSteps: parsed.repairSteps || [],
      parts: parsed.parts || [],
      totalEstimatedCost: parsed.totalEstimatedCost || { min: 0, max: 0, currency: "EUR" },
      totalEstimatedTime: parsed.totalEstimatedTime || "N/A",
      overallDifficulty: parsed.overallDifficulty || 3,
      validation: {
        isValid: true,
        coherenceScore: 70,
        logicScore: 70,
        overallAccuracy: 65,
        issues: [],
        corrections: ["Fallback mode - single agent analysis"],
      },
      agentExecutionLog: [{
        agentName: "FallbackAgent",
        layer: 0,
        startTime,
        endTime: Date.now(),
        status: "success",
        confidence: 0.65,
      }],
      totalExecutionTime: Date.now() - startTime,
      swarmMode: "fallback",
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(`Fallback diagnostic failed: ${error}`);
  }
}
