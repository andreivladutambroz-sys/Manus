import { ENV } from "./_core/env";
import {
  validateCoherence,
  determineComplexity,
  selectAgentsForComplexity,
  fallbackToSingleAgent,
} from "./kimi-synthesizer";

/**
 * Enhanced Kimi Swarm cu Synthesizer, Coherence Validation, și Fallback
 */

interface SwarmAgent {
  name: string;
  role: string;
  prompt: string;
}

interface DiagnosticInput {
  vehicleMarque: string;
  vehicleModel: string;
  vehicleYear: number;
  vehicleMileage: number;
  symptoms: string;
  errorCodes?: string[];
}

interface AgentResult {
  agentName: string;
  role: string;
  analysis: string;
  confidence: number;
  executionTime: number;
}

interface EnhancedSwarmResult {
  diagnosticId: string;
  complexity: "simple" | "moderate" | "complex";
  agentsUsed: number;
  orchestratorSummary: string;
  agentResults: AgentResult[];
  coherenceValidation: {
    isCoherent: boolean;
    coherenceScore: number;
    issues: Array<{
      type: string;
      agents: string[];
      description: string;
      severity: string;
    }>;
    needsReanalysis: boolean;
  };
  synthesizedConclusion: string;
  totalExecutionTime: number;
  recommendations: string[];
  estimatedCost?: number;
  fallbackUsed: boolean;
}

// Definiție agenți
const SWARM_AGENTS: Record<string, SwarmAgent> = {
  symptomAnalyzer: {
    name: "SymptomAnalyzer",
    role: "Analizează simptomele raportate",
    prompt: `Ești expert în diagnosticul vehiculelor. Analizează simptomele și identifică:
1. Sisteme afectate
2. Cauze potențiale
3. Gradul de urgență
4. Teste recomandate

Simptome: {symptoms}
Vehicul: {year} {marque} {model}`,
  },

  historyLookup: {
    name: "HistoryLookup",
    role: "Caută diagnostic anterior similar",
    prompt: `Ești expert în baza de date de diagnostic. Analizează:
1. Diagnostic anterior pentru {marque} {model}
2. Frecvența acestor probleme
3. Soluții care au funcționat
4. Probleme comune la {year} {marque} {model}

Simptome actuale: {symptoms}`,
  },

  errorCodeDecoder: {
    name: "ErrorCodeDecoder",
    role: "Decodifică coduri OBD-II",
    prompt: `Ești expert în coduri OBD-II. Decodifică:
1. Semnificația fiecărui cod
2. Sistemul afectat
3. Cauze comune
4. Procedură de diagnosticare

Coduri: {errorCodes}
Vehicul: {year} {marque} {model}`,
  },

  componentEvaluator: {
    name: "ComponentEvaluator",
    role: "Evaluează componente defecte",
    prompt: `Ești expert în componente auto. Evaluează:
1. Componente care pot cauza simptomele
2. Ordinea probabilității
3. Teste specifice
4. Indicatori de defecțiune

Simptome: {symptoms}
Coduri: {errorCodes}`,
  },

  repairProcedure: {
    name: "RepairProcedure",
    role: "Propune proceduri de reparație",
    prompt: `Ești expert în reparații. Propune:
1. Pași de reparație detaliați
2. Ordinea recomandată
3. Precauții de siguranță
4. Timp estimat
5. Echipament necesar

Probleme: {symptoms}`,
  },

  partsIdentifier: {
    name: "PartsIdentifier",
    role: "Identifică piese și costuri",
    prompt: `Ești expert în piese auto. Identifică:
1. Piese necesare
2. Numere OEM
3. Costuri estimate
4. Furnizori
5. Disponibilitate

Reparații: {symptoms}
Vehicul: {year} {marque} {model}`,
  },
};

/**
 * Execută Enhanced Diagnostic Swarm cu Synthesizer
 */
export async function executeEnhancedDiagnosticSwarm(
  input: DiagnosticInput,
  diagnosticId: string
): Promise<EnhancedSwarmResult> {
  const swarmStartTime = Date.now();

  try {
    // 1. Determină complexitate
    const complexity = determineComplexity(input.symptoms, input.errorCodes);

    // 2. Selectează agenți pe baza complexității
    const selectedAgentNames = selectAgentsForComplexity(complexity);
    const selectedAgents = Object.fromEntries(
      Object.entries(SWARM_AGENTS).filter(([key]) =>
        selectedAgentNames.some((name) =>
          name.toLowerCase().includes(key.toLowerCase())
        )
      )
    );

    // 3. Execută agenții selectați în paralel
    const agentPromises = Object.values(selectedAgents).map((agent) =>
      executeAgent(agent, input)
    );

    const agentResults = await Promise.all(agentPromises);

    // 4. Validează coerență
    const coherenceResult = await validateCoherence(
      agentResults.map((r) => ({
        agentName: r.agentName,
        analysis: r.analysis,
        confidence: r.confidence,
      }))
    );

    // 5. Sintetizează concluzia
    const synthesizedConclusion = coherenceResult.synthesizedConclusion;

    // 6. Extrage recomandări
    const recommendations = extractRecommendations(agentResults);

    // 7. Estimează cost
    const estimatedCost = estimateRepairCost(agentResults);

    const totalExecutionTime = Date.now() - swarmStartTime;

    return {
      diagnosticId,
      complexity,
      agentsUsed: agentResults.length,
      orchestratorSummary: generateOrchestratorSummary(input, agentResults),
      agentResults,
      coherenceValidation: {
        isCoherent: coherenceResult.isCoherent,
        coherenceScore: coherenceResult.coherenceScore,
        issues: coherenceResult.issues as any,
        needsReanalysis: coherenceResult.needsReanalysis,
      },
      synthesizedConclusion,
      totalExecutionTime,
      recommendations,
      estimatedCost,
      fallbackUsed: false,
    };
  } catch (error) {
    // Fallback la single-agent dacă Swarm fail-uiește
    console.warn("Swarm failed, falling back to single-agent:", error);

    const vehicleInfo = `${input.vehicleYear} ${input.vehicleMarque} ${input.vehicleModel}`;
    const singleAgentAnalysis = await fallbackToSingleAgent(
      input.symptoms,
      vehicleInfo
    );

    return {
      diagnosticId,
      complexity: "simple",
      agentsUsed: 1,
      orchestratorSummary: `Fallback single-agent: ${vehicleInfo}`,
      agentResults: [
        {
          agentName: "SingleAgentFallback",
          role: "Diagnostic complet",
          analysis: singleAgentAnalysis,
          confidence: 0.7,
          executionTime: Date.now(),
        },
      ],
      coherenceValidation: {
        isCoherent: true,
        coherenceScore: 70,
        issues: [],
        needsReanalysis: false,
      },
      synthesizedConclusion: singleAgentAnalysis,
      totalExecutionTime: Date.now(),
      recommendations: extractRecommendations([
        {
          agentName: "SingleAgentFallback",
          role: "Diagnostic",
          analysis: singleAgentAnalysis,
          confidence: 0.7,
          executionTime: 0,
        },
      ]),
      estimatedCost: 0,
      fallbackUsed: true,
    };
  }
}

/**
 * Execută un agent individual
 */
async function executeAgent(
  agent: SwarmAgent,
  input: DiagnosticInput
): Promise<AgentResult> {
  const startTime = Date.now();

  try {
    let prompt = agent.prompt;
    prompt = prompt.replace("{symptoms}", input.symptoms);
    prompt = prompt.replace("{year}", input.vehicleYear.toString());
    prompt = prompt.replace("{marque}", input.vehicleMarque);
    prompt = prompt.replace("{model}", input.vehicleModel);
    prompt = prompt.replace("{errorCodes}", input.errorCodes?.join(", ") || "N/A");

    const response = await fetch("https://api.kimi.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ENV.kimiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "kimi-k2.5",
        messages: [
          {
            role: "system",
            content: `Ești ${agent.role}. Răspunde în limba română.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Kimi API error: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const analysis = data.choices[0]?.message.content || "";

    return {
      agentName: agent.name,
      role: agent.role,
      analysis,
      confidence: 0.85,
      executionTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      agentName: agent.name,
      role: agent.role,
      analysis: `Eroare: ${error instanceof Error ? error.message : "Unknown"}`,
      confidence: 0,
      executionTime: Date.now() - startTime,
    };
  }
}

/**
 * Generează rezumat orchestrator
 */
function generateOrchestratorSummary(
  input: DiagnosticInput,
  results: AgentResult[]
): string {
  return `Diagnostic pentru ${input.vehicleYear} ${input.vehicleMarque} ${input.vehicleModel} (${input.vehicleMileage} km)
Simptome: ${input.symptoms}
Agenți utilizați: ${results.length}`;
}

/**
 * Extrage recomandări
 */
function extractRecommendations(results: AgentResult[]): string[] {
  const recommendations: string[] = [];

  results.forEach((result) => {
    const lines = result.analysis.split("\n");
    lines.forEach((line) => {
      if (
        line.toLowerCase().includes("recomand") ||
        line.toLowerCase().includes("test") ||
        line.toLowerCase().includes("verific")
      ) {
        recommendations.push(line.trim());
      }
    });
  });

  return Array.from(new Set(recommendations)).slice(0, 5);
}

/**
 * Estimează cost
 */
function estimateRepairCost(results: AgentResult[]): number {
  const partsResult = results.find((r) => r.agentName.includes("Parts"));
  if (partsResult && partsResult.analysis.includes("cost")) {
    const costMatch = partsResult.analysis.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
    if (costMatch) {
      return parseFloat(costMatch[1].replace(/,/g, ""));
    }
  }
  return 0;
}
