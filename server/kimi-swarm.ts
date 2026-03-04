import { ENV } from "./_core/env";

/**
 * Kimi Swarm Orchestrator
 * Coordonează mai mulți agenți Kimi în paralel pentru diagnostic auto mai rapid
 */

interface SwarmAgent {
  name: string;
  role: string;
  prompt: string;
  tools?: string[];
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

interface SwarmResult {
  diagnosticId: string;
  orchestratorSummary: string;
  agentResults: AgentResult[];
  totalExecutionTime: number;
  recommendations: string[];
  estimatedCost?: number;
}

// Definiție agenți specialiști
const SWARM_AGENTS: Record<string, SwarmAgent> = {
  symptomAnalyzer: {
    name: "Symptom Analyzer",
    role: "Analizează simptomele raportate și identifică probleme potențiale",
    prompt: `Ești un expert în diagnosticul vehiculelor. Analizează următoarele simptome și identifică:
1. Sisteme vehiculului care ar putea fi afectate
2. Cauze potențiale pentru fiecare simptom
3. Gradul de urgență (critic/urgent/normal)
4. Teste diagnostice recomandate

Simptome: {symptoms}
Vehicul: {year} {marque} {model}
Kilometraj: {mileage} km`,
  },

  historyLookup: {
    name: "History Lookup",
    role: "Caută diagnostic anterior pentru vehicule similare",
    prompt: `Ești un expert în baza de date de diagnostic. Caută și analizează:
1. Diagnostic anterior pentru {marque} {model} cu simptome similare
2. Frecvența acestor probleme la acest model
3. Soluții care au funcționat anterior
4. Probleme comune la {year} {marque} {model}

Simptome actuale: {symptoms}`,
  },

  errorCodeDecoder: {
    name: "Error Code Decoder",
    role: "Decodifică coduri OBD și DTCs",
    prompt: `Ești un expert în coduri OBD-II și DTCs. Decodifică și explică:
1. Semnificația fiecărui cod de eroare
2. Sistemul afectat și componente implicate
3. Cauze comune pentru aceste coduri
4. Procedura de diagnosticare recomandată

Coduri de eroare: {errorCodes}
Vehicul: {year} {marque} {model}`,
  },

  componentEvaluator: {
    name: "Component Evaluator",
    role: "Evaluează care componente pot cauza simptomele",
    prompt: `Ești un expert în componente auto. Evaluează:
1. Componente care ar putea cauza simptomele observate
2. Ordinea probabilității pentru fiecare componentă
3. Teste specifice pentru fiecare componentă
4. Indicatori de defecțiune pentru fiecare

Simptome: {symptoms}
Coduri OBD: {errorCodes}
Vehicul: {year} {marque} {model}`,
  },

  repairProcedure: {
    name: "Repair Procedure",
    role: "Propune proceduri de reparație",
    prompt: `Ești un expert în proceduri de reparație. Propune:
1. Pași de reparație detaliați
2. Ordinea recomandată a reparațiilor
3. Precauții de siguranță
4. Timp estimat pentru fiecare reparație
5. Echipament necesar

Probleme identificate: {symptoms}
Componente defecte: {components}
Vehicul: {year} {marque} {model}`,
  },

  partsIdentifier: {
    name: "Parts Identifier",
    role: "Identifică piese necesare și costuri",
    prompt: `Ești un expert în piese auto. Identifică:
1. Piese necesare pentru reparație
2. Numere OEM și alternative
3. Costuri estimate
4. Furnizori recomandați
5. Disponibilitate estimată

Reparații necesare: {repairs}
Vehicul: {year} {marque} {model}
Kilometraj: {mileage}`,
  },
};

/**
 * Executează un agent Kimi individual
 */
async function executeAgent(
  agent: SwarmAgent,
  input: DiagnosticInput,
  context: Record<string, string>
): Promise<AgentResult> {
  const startTime = Date.now();

  try {
    // Înlocuiește placeholder-urile în prompt
    let prompt = agent.prompt;
    prompt = prompt.replace("{symptoms}", input.symptoms);
    prompt = prompt.replace("{year}", input.vehicleYear.toString());
    prompt = prompt.replace("{marque}", input.vehicleMarque);
    prompt = prompt.replace("{model}", input.vehicleModel);
    prompt = prompt.replace("{mileage}", input.vehicleMileage.toString());
    prompt = prompt.replace("{errorCodes}", input.errorCodes?.join(", ") || "N/A");

    // Adaugă context din alți agenți dacă disponibil
    Object.entries(context).forEach(([key, value]) => {
      prompt = prompt.replace(`{${key}}`, value);
    });

    // Apelează Kimi API
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
            content: `Ești ${agent.role}. Răspunde în limba română. Fii concis și specific.`,
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

    const executionTime = Date.now() - startTime;

    return {
      agentName: agent.name,
      role: agent.role,
      analysis,
      confidence: 0.85, // Placeholder - poate fi calculat din response
      executionTime,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    return {
      agentName: agent.name,
      role: agent.role,
      analysis: `Eroare: ${error instanceof Error ? error.message : "Unknown error"}`,
      confidence: 0,
      executionTime,
    };
  }
}

/**
 * Executează swarm-ul de agenți în paralel
 */
export async function executeDiagnosticSwarm(
  input: DiagnosticInput,
  diagnosticId: string
): Promise<SwarmResult> {
  const swarmStartTime = Date.now();
  const agentResults: AgentResult[] = [];
  const context: Record<string, string> = {};

  try {
    // Execută toți agenții în paralel
    const agentPromises = Object.values(SWARM_AGENTS).map((agent) =>
      executeAgent(agent, input, context)
    );

    const results = await Promise.all(agentPromises);
    agentResults.push(...results);

    // Construiește context din rezultate pentru agregare
    results.forEach((result) => {
      context[result.agentName.toLowerCase().replace(" ", "")] = result.analysis;
    });

    // Orchestrator agregă rezultatele
    const orchestratorSummary = generateOrchestratorSummary(input, agentResults);
    const recommendations = extractRecommendations(agentResults);
    const estimatedCost = estimateRepairCost(agentResults);

    const totalExecutionTime = Date.now() - swarmStartTime;

    return {
      diagnosticId,
      orchestratorSummary,
      agentResults,
      totalExecutionTime,
      recommendations,
      estimatedCost,
    };
  } catch (error) {
    throw new Error(
      `Diagnostic swarm failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Generează rezumat final din analiza tuturor agenților
 */
function generateOrchestratorSummary(
  input: DiagnosticInput,
  results: AgentResult[]
): string {
  const summaryParts: string[] = [
    `Diagnostic pentru ${input.vehicleYear} ${input.vehicleMarque} ${input.vehicleModel}`,
    `Kilometraj: ${input.vehicleMileage} km`,
    `Simptome raportate: ${input.symptoms}`,
    "",
    "Analiza multi-agent:",
  ];

  results.forEach((result) => {
    summaryParts.push(`\n${result.agentName}:`);
    summaryParts.push(result.analysis.substring(0, 300) + "...");
  });

  return summaryParts.join("\n");
}

/**
 * Extrage recomandări din rezultatele agenților
 */
function extractRecommendations(results: AgentResult[]): string[] {
  const recommendations: string[] = [];

  results.forEach((result) => {
    // Extrage recomandări din fiecare agent
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

  return Array.from(new Set(recommendations)).slice(0, 5); // Unice, max 5
}

/**
 * Estimează cost de reparație
 */
function estimateRepairCost(results: AgentResult[]): number {
  // Placeholder - poate fi calculat din rezultatele Parts Identifier
  const partsResult = results.find((r) => r.agentName === "Parts Identifier");

  if (partsResult && partsResult.analysis.includes("cost")) {
    // Extrage costuri din analiza Parts Identifier
    const costMatch = partsResult.analysis.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
    if (costMatch) {
      return parseFloat(costMatch[1].replace(/,/g, ""));
    }
  }

  return 0; // Default dacă nu se poate calcula
}

/**
 * Formatează rezultatele swarm-ului pentru afișare
 */
export function formatSwarmResults(result: SwarmResult): string {
  const lines: string[] = [
    "=== DIAGNOSTIC MULTI-AGENT KIMI SWARM ===",
    "",
    result.orchestratorSummary,
    "",
    "=== RECOMANDĂRI ===",
    ...result.recommendations,
    "",
    `Timp total: ${result.totalExecutionTime}ms`,
    `Cost estimat: $${result.estimatedCost?.toFixed(2) || "N/A"}`,
  ];

  return lines.join("\n");
}
