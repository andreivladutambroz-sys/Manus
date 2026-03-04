import { ENV } from "./_core/env";

/**
 * Kimi Synthesizer
 * Validează coerență între rezultatele agenților și detectează incoerențe
 */

interface AgentAnalysis {
  agentName: string;
  analysis: string;
  confidence: number;
}

interface CoherenceIssue {
  type: "contradiction" | "missing_data" | "low_confidence" | "conflicting_recommendation";
  agents: string[];
  description: string;
  severity: "low" | "medium" | "high";
}

interface SynthesisResult {
  isCoherent: boolean;
  coherenceScore: number; // 0-100
  issues: CoherenceIssue[];
  needsReanalysis: boolean;
  agentsToReanalyze?: string[];
  synthesizedConclusion: string;
}

/**
 * Detectează incoerență între rezultatele agenților
 */
export async function validateCoherence(
  analyses: AgentAnalysis[]
): Promise<SynthesisResult> {
  const issues: CoherenceIssue[] = [];
  let coherenceScore = 100;

  // 1. Verifică confidence scores
  const lowConfidenceAgents = analyses.filter((a) => a.confidence < 0.6);
  if (lowConfidenceAgents.length > 0) {
    coherenceScore -= lowConfidenceAgents.length * 10;
    issues.push({
      type: "low_confidence",
      agents: lowConfidenceAgents.map((a) => a.agentName),
      description: `${lowConfidenceAgents.length} agenți au confidence < 0.6`,
      severity: "medium",
    });
  }

  // 2. Detectează contradicții între agenți
  const contradictions = detectContradictions(analyses);
  if (contradictions.length > 0) {
    coherenceScore -= contradictions.length * 15;
    issues.push(...contradictions);
  }

  // 3. Verifică dacă toți agenții au date
  const emptyAnalyses = analyses.filter((a) => !a.analysis || a.analysis.length < 50);
  if (emptyAnalyses.length > 0) {
    coherenceScore -= emptyAnalyses.length * 5;
    issues.push({
      type: "missing_data",
      agents: emptyAnalyses.map((a) => a.agentName),
      description: `${emptyAnalyses.length} agenți au date incomplete`,
      severity: "low",
    });
  }

  // 4. Calculează necesitatea re-analizei
  const needsReanalysis = coherenceScore < 70 || issues.some((i) => i.severity === "high");
  const agentsToReanalyze = needsReanalysis
    ? issues.flatMap((i) => i.agents)
    : undefined;

  // 5. Sintetizează concluzia
  const synthesizedConclusion = await synthesizeConclusion(analyses, issues);

  return {
    isCoherent: coherenceScore >= 70,
    coherenceScore: Math.max(0, coherenceScore),
    issues,
    needsReanalysis,
    agentsToReanalyze,
    synthesizedConclusion,
  };
}

/**
 * Detectează contradicții între agenți
 */
function detectContradictions(analyses: AgentAnalysis[]): CoherenceIssue[] {
  const contradictions: CoherenceIssue[] = [];

  // Extrage cuvinte cheie din fiecare analiză
  const keywords = analyses.map((a) => ({
    agent: a.agentName,
    words: extractKeywords(a.analysis),
  }));

  // Caută contradicții (ex: "defect" vs "normal")
  const conflictingPairs = [
    ["defect", "normal"],
    ["urgent", "non-urgent"],
    ["replace", "repair"],
    ["critical", "minor"],
  ];

  for (let i = 0; i < keywords.length; i++) {
    for (let j = i + 1; j < keywords.length; j++) {
      const words1 = keywords[i].words;
      const words2 = keywords[j].words;

      for (const [word1, word2] of conflictingPairs) {
        if (words1.includes(word1) && words2.includes(word2)) {
          contradictions.push({
            type: "contradiction",
            agents: [keywords[i].agent, keywords[j].agent],
            description: `Contradicție: "${word1}" vs "${word2}"`,
            severity: "high",
          });
        }
      }
    }
  }

  return contradictions;
}

/**
 * Extrage cuvinte cheie din text
 */
function extractKeywords(text: string): string[] {
  const keywords = [
    "defect",
    "normal",
    "urgent",
    "non-urgent",
    "replace",
    "repair",
    "critical",
    "minor",
    "battery",
    "alternator",
    "starter",
    "engine",
    "transmission",
    "brake",
    "suspension",
  ];

  const lowerText = text.toLowerCase();
  return keywords.filter((k) => lowerText.includes(k));
}

/**
 * Sintetizează concluzia finală din analize
 */
async function synthesizeConclusion(
  analyses: AgentAnalysis[],
  issues: CoherenceIssue[]
): Promise<string> {
  // Construiește prompt pentru synthesizer
  const analysesText = analyses
    .map((a) => `${a.agentName} (confidence: ${a.confidence}):\n${a.analysis}`)
    .join("\n\n");

  const issuesText =
    issues.length > 0
      ? `Probleme detectate:\n${issues.map((i) => `- ${i.description}`).join("\n")}`
      : "Nu au fost detectate probleme de coerență.";

  const prompt = `Ești un expert în sintetizarea diagnosticelor auto. Analizează următoarele rapoarte de la agenți specialiști și creează o concluzie finală coerență:

${analysesText}

${issuesText}

Creează o concluzie finală care:
1. Sintetizează informațiile din toți agenții
2. Rezolvă orice contradicții
3. Prioritizează recomandări pe baza severității
4. Oferă o diagnostic clar și actionabil

Răspunde în limba română, concis și specific.`;

  try {
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
            content: "Ești un expert în sintetizarea diagnosticelor auto.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      throw new Error(`Kimi API error: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    return data.choices[0]?.message.content || "Eroare la sintetizare";
  } catch (error) {
    return `Eroare la sintetizare: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

/**
 * Determină complexitate diagnostic pentru cost optimization
 */
export function determineComplexity(
  symptoms: string,
  errorCodes?: string[]
): "simple" | "moderate" | "complex" {
  let complexityScore = 0;

  // Lungime simptome
  if (symptoms.length > 200) complexityScore += 2;
  else if (symptoms.length > 100) complexityScore += 1;

  // Număr coduri eroare
  if (errorCodes && errorCodes.length > 3) complexityScore += 2;
  else if (errorCodes && errorCodes.length > 0) complexityScore += 1;

  // Cuvinte cheie care indică complexitate
  const complexityKeywords = [
    "intermittent",
    "multiple",
    "complex",
    "electrical",
    "transmission",
    "engine",
    "sare",
    "zgomotos",
  ];
  const symptomLower = symptoms.toLowerCase();
  complexityScore += complexityKeywords.filter((k) => symptomLower.includes(k)).length * 2;

  if (complexityScore >= 6) return "complex";
  if (complexityScore >= 3) return "moderate";
  return "simple";
}

/**
 * Selectează agenți pe baza complexității
 */
export function selectAgentsForComplexity(
  complexity: "simple" | "moderate" | "complex"
): string[] {
  const allAgents = [
    "SymptomAnalyzer",
    "HistoryLookup",
    "ErrorCodeDecoder",
    "ComponentEvaluator",
    "RepairProcedure",
    "PartsIdentifier",
  ];

  switch (complexity) {
    case "simple":
      // 3 agenți pentru cazuri simple
      return [allAgents[0], allAgents[2], allAgents[5]]; // Symptom, ErrorCode, Parts
    case "moderate":
      // 4-5 agenți pentru moderate
      return allAgents.slice(0, 5);
    case "complex":
      // Toți 6 agenți
      return allAgents;
  }
}

/**
 * Fallback la single-agent dacă Swarm fail-uiește
 */
export async function fallbackToSingleAgent(
  symptoms: string,
  vehicleInfo: string
): Promise<string> {
  const prompt = `Ești un expert în diagnosticul vehiculelor. Analizează următoarele simptome și oferă o diagnostic complet:

Vehicul: ${vehicleInfo}
Simptome: ${symptoms}

Oferă:
1. Cauze probabile
2. Teste diagnostice recomandate
3. Procedură de reparație
4. Piese necesare și costuri estimate

Răspunde în limba română, concis și specific.`;

  try {
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
            content: "Ești un expert în diagnosticul vehiculelor.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`Kimi API error: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    return data.choices[0]?.message.content || "Eroare la diagnostic";
  } catch (error) {
    return `Eroare la diagnostic: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}
