import { eq, desc, and, like, sql, gte } from "drizzle-orm";
import { getDb } from "./db";
import { ENV } from "./_core/env";
import {
  diagnosticFeedback,
  learnedPatterns,
  promptVersions,
  accuracyMetrics,
  diagnostics,
  InsertDiagnosticFeedback,
  InsertLearnedPattern,
  CauseFeedback,
} from "../drizzle/schema";

// ============================================================
// 1. FEEDBACK LOOP - Mecanicul confirmă/corectează diagnosticul
// ============================================================

export interface FeedbackInput {
  diagnosticId: number;
  userId: number;
  overallRating: number;
  accuracyRating: number;
  usefulnessRating: number;
  causesFeedback?: CauseFeedback[];
  actualCause?: string;
  actualParts?: string[];
  actualCost?: number;
  actualTime?: string;
  mechanicNotes?: string;
  wasResolved: boolean;
}

/**
 * Salvează feedback-ul mecanicului și declanșează procesul de învățare
 */
export async function submitFeedback(input: FeedbackInput): Promise<{
  feedbackId: number;
  patternLearned: boolean;
  promptOptimized: boolean;
  metricsUpdated: boolean;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 1. Salvează feedback-ul
  const [result] = await db.insert(diagnosticFeedback).values({
    diagnosticId: input.diagnosticId,
    userId: input.userId,
    overallRating: input.overallRating,
    accuracyRating: input.accuracyRating,
    usefulnessRating: input.usefulnessRating,
    causesFeedback: input.causesFeedback || null,
    actualCause: input.actualCause || null,
    actualParts: input.actualParts || null,
    actualCost: input.actualCost?.toString() || null,
    actualTime: input.actualTime || null,
    mechanicNotes: input.mechanicNotes || null,
    wasResolved: input.wasResolved,
  }).$returningId();

  const feedbackId = result.id;

  // 2. Obține detaliile diagnosticului original
  const [diagnostic] = await db
    .select()
    .from(diagnostics)
    .where(eq(diagnostics.id, input.diagnosticId))
    .limit(1);

  let patternLearned = false;
  let promptOptimized = false;
  let metricsUpdated = false;

  if (diagnostic) {
    // 3. Dacă feedback-ul e pozitiv (4-5 stele), învață pattern-ul
    if (input.overallRating >= 4 && input.wasResolved) {
      await learnFromPositiveFeedback(diagnostic, input);
      patternLearned = true;
    }

    // 4. Dacă feedback-ul e negativ (1-2 stele), ajustează prompt-urile
    if (input.overallRating <= 2) {
      await adjustFromNegativeFeedback(diagnostic, input);
      promptOptimized = true;
    }

    // 5. Actualizează metrici acuratețe
    await updateAccuracyMetrics(diagnostic, input);
    metricsUpdated = true;
  }

  return { feedbackId, patternLearned, promptOptimized, metricsUpdated };
}

// ============================================================
// 2. KNOWLEDGE STORE - Acumulare cunoștințe din feedback
// ============================================================

/**
 * Învață din feedback pozitiv - creează/actualizează pattern
 */
async function learnFromPositiveFeedback(
  diagnostic: any,
  feedback: FeedbackInput
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const analysisResult = diagnostic.analysisResult as any;
  if (!analysisResult) return;

  const brand = analysisResult?.vehicle?.brand || diagnostic.vehicleBrand || "Unknown";
  const model = analysisResult?.vehicle?.model || diagnostic.vehicleModel || "";
  const year = analysisResult?.vehicle?.year || 0;

  // Normalizează simptomele pentru matching
  const symptomPattern = normalizeSymptoms(diagnostic.symptoms || "");
  const errorCodes = diagnostic.errorCodes as string[] || [];

  // Determină cauza confirmată
  const confirmedCause = feedback.actualCause || 
    (analysisResult?.probableCauses?.[0]?.cause) || 
    "Unknown";

  const confirmedSolution = analysisResult?.repairSteps
    ?.map((s: any) => `${s.stepNumber}. ${s.description}`)
    .join("\n") || "N/A";

  // Verifică dacă pattern-ul există deja
  const existingPatterns = await db
    .select()
    .from(learnedPatterns)
    .where(
      and(
        eq(learnedPatterns.brand, brand),
        like(learnedPatterns.symptomPattern, `%${symptomPattern.substring(0, 50)}%`)
      )
    )
    .limit(1);

  if (existingPatterns.length > 0) {
    // Actualizează pattern-ul existent
    const existing = existingPatterns[0];
    const newCount = (existing.timesConfirmed || 1) + 1;
    const currentAvg = parseFloat(existing.avgAccuracy?.toString() || "70");
    const newAvg = ((currentAvg * (newCount - 1)) + feedback.accuracyRating * 20) / newCount;

    await db
      .update(learnedPatterns)
      .set({
        timesConfirmed: newCount,
        avgAccuracy: newAvg.toFixed(2),
        avgCost: feedback.actualCost?.toString() || existing.avgCost,
        avgRepairTime: feedback.actualTime || existing.avgRepairTime,
        confidence: Math.min(99, newAvg + (newCount * 2)).toFixed(2),
      })
      .where(eq(learnedPatterns.id, existing.id));
  } else {
    // Creează pattern nou
    await db.insert(learnedPatterns).values({
      brand,
      model,
      yearFrom: year > 0 ? year - 2 : null,
      yearTo: year > 0 ? year + 2 : null,
      engineCode: analysisResult?.vehicle?.engineCode || null,
      symptomPattern,
      errorCodes: errorCodes.length > 0 ? errorCodes : null,
      confirmedCause,
      confirmedSolution,
      confirmedParts: feedback.actualParts || null,
      timesConfirmed: 1,
      avgAccuracy: (feedback.accuracyRating * 20).toFixed(2),
      avgCost: feedback.actualCost?.toString() || null,
      avgRepairTime: feedback.actualTime || null,
      sourceType: "mechanic_feedback",
      confidence: (feedback.accuracyRating * 15 + 10).toFixed(2),
    });
  }
}

/**
 * Ajustează din feedback negativ - notează ce a mers prost
 */
async function adjustFromNegativeFeedback(
  diagnostic: any,
  feedback: FeedbackInput
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Dacă mecanicul a dat cauza reală, salvează ca pattern corect
  if (feedback.actualCause) {
    const brand = diagnostic.vehicleBrand || "Unknown";
    const symptomPattern = normalizeSymptoms(diagnostic.symptoms || "");

    await db.insert(learnedPatterns).values({
      brand,
      model: diagnostic.vehicleModel || null,
      symptomPattern,
      errorCodes: diagnostic.errorCodes as string[] || null,
      confirmedCause: feedback.actualCause,
      confirmedSolution: feedback.mechanicNotes || "Corectat de mecanic",
      confirmedParts: feedback.actualParts || null,
      timesConfirmed: 1,
      avgAccuracy: "90.00", // Feedback direct de la mecanic = acuratețe mare
      avgCost: feedback.actualCost?.toString() || null,
      avgRepairTime: feedback.actualTime || null,
      sourceType: "mechanic_feedback",
      confidence: "85.00",
    });
  }

  // Înregistrează feedback-ul negativ pentru analiza prompt-urilor
  // Identifică care agenți au greșit din causesFeedback
  if (feedback.causesFeedback) {
    const incorrectCauses = feedback.causesFeedback.filter(
      cf => cf.rating === "incorrect"
    );

    if (incorrectCauses.length > 0) {
      // Marchează pentru prompt optimization
      await recordPromptFailure(
        incorrectCauses.map(c => c.cause).join("; "),
        feedback.mechanicNotes || ""
      );
    }
  }
}

/**
 * Înregistrează eșecuri de prompt pentru optimizare viitoare
 */
async function recordPromptFailure(
  failedPrediction: string,
  mechanicCorrection: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Actualizează metrici pentru agenții activi
  const activePrompts = await db
    .select()
    .from(promptVersions)
    .where(eq(promptVersions.isActive, true));

  for (const prompt of activePrompts) {
    const currentSuccess = parseFloat(prompt.successRate?.toString() || "80");
    const totalUses = (prompt.totalUses || 0) + 1;
    const newSuccess = ((currentSuccess * (totalUses - 1)) + 0) / totalUses;

    await db
      .update(promptVersions)
      .set({
        totalUses,
        successRate: newSuccess.toFixed(2),
      })
      .where(eq(promptVersions.id, prompt.id));
  }
}

// ============================================================
// 3. PROMPT OPTIMIZER - Ajustare automată prompt-uri
// ============================================================

/**
 * Generează prompt optimizat bazat pe feedback acumulat
 */
export async function optimizePromptForAgent(agentName: string): Promise<{
  optimizedPrompt: string;
  version: number;
  improvements: string[];
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Obține prompt-ul curent activ
  const [currentPrompt] = await db
    .select()
    .from(promptVersions)
    .where(
      and(
        eq(promptVersions.agentName, agentName),
        eq(promptVersions.isActive, true)
      )
    )
    .orderBy(desc(promptVersions.version))
    .limit(1);

  // Obține pattern-uri învățate recente
  const recentPatterns = await db
    .select()
    .from(learnedPatterns)
    .orderBy(desc(learnedPatterns.updatedAt))
    .limit(20);

  // Obține feedback recent negativ
  const recentNegativeFeedback = await db
    .select()
    .from(diagnosticFeedback)
    .where(sql`${diagnosticFeedback.overallRating} <= 2`)
    .orderBy(desc(diagnosticFeedback.createdAt))
    .limit(10);

  // Folosește Kimi pentru a genera prompt optimizat
  const patternsContext = recentPatterns
    .map(p => `[${p.brand} ${p.model || ""}] ${p.symptomPattern} → ${p.confirmedCause} (confirmat ${p.timesConfirmed}x, acuratețe: ${p.avgAccuracy}%)`)
    .join("\n");

  const feedbackContext = recentNegativeFeedback
    .map(f => `Rating: ${f.overallRating}/5 - ${f.mechanicNotes || "Fără note"} - Cauza reală: ${f.actualCause || "N/A"}`)
    .join("\n");

  const response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
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
          content: `Ești un expert în optimizarea prompt-urilor pentru agenți AI de diagnostic auto.
Scopul tău e să îmbunătățești prompt-ul agentului "${agentName}" bazat pe feedback real de la mecanici.
Răspunde DOAR cu JSON valid.`,
        },
        {
          role: "user",
          content: `Prompt curent al agentului "${agentName}":
${currentPrompt?.promptText || "Prompt implicit - agent de diagnostic auto"}

Pattern-uri validate de mecanici:
${patternsContext || "Niciun pattern încă"}

Feedback negativ recent:
${feedbackContext || "Niciun feedback negativ"}

Optimizează prompt-ul și returnează JSON:
{
  "optimizedPrompt": "prompt-ul îmbunătățit complet",
  "improvements": ["îmbunătățire 1", "îmbunătățire 2"],
  "reasoning": "de ce aceste schimbări vor îmbunătăți acuratețea"
}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 3000,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(`Kimi API error: ${response.statusText}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  const text = data.choices[0]?.message.content || "{}";

  let parsed: { optimizedPrompt: string; improvements: string[] };
  try {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch?.[1] || jsonMatch?.[0] || text);
  } catch {
    parsed = {
      optimizedPrompt: currentPrompt?.promptText || "",
      improvements: ["Optimizare automată nu a reușit"],
    };
  }

  // Salvează noua versiune
  const newVersion = (currentPrompt?.version || 0) + 1;

  // Dezactivează versiunea veche
  if (currentPrompt) {
    await db
      .update(promptVersions)
      .set({ isActive: false })
      .where(eq(promptVersions.id, currentPrompt.id));
  }

  // Creează versiunea nouă
  await db.insert(promptVersions).values({
    agentName,
    version: newVersion,
    promptText: parsed.optimizedPrompt,
    temperature: currentPrompt?.temperature || "0.30",
    maxTokens: currentPrompt?.maxTokens || 2000,
    totalUses: 0,
    avgAccuracy: null,
    avgFeedbackScore: null,
    successRate: null,
    isActive: true,
  });

  return {
    optimizedPrompt: parsed.optimizedPrompt,
    version: newVersion,
    improvements: parsed.improvements || [],
  };
}

/**
 * Obține prompt-ul activ pentru un agent (cu knowledge injection)
 */
export async function getActivePromptForAgent(
  agentName: string,
  vehicleBrand?: string,
  symptoms?: string
): Promise<{ prompt: string; learnedContext: string }> {
  const db = await getDb();
  if (!db) return { prompt: "", learnedContext: "" };

  // Obține prompt-ul activ
  const [activePrompt] = await db
    .select()
    .from(promptVersions)
    .where(
      and(
        eq(promptVersions.agentName, agentName),
        eq(promptVersions.isActive, true)
      )
    )
    .orderBy(desc(promptVersions.version))
    .limit(1);

  // Obține pattern-uri relevante pentru vehicul/simptome
  let relevantPatterns: any[] = [];
  if (vehicleBrand) {
    relevantPatterns = await db
      .select()
      .from(learnedPatterns)
      .where(eq(learnedPatterns.brand, vehicleBrand))
      .orderBy(desc(learnedPatterns.timesConfirmed))
      .limit(10);
  }

  // Dacă nu sunt destule pattern-uri per marcă, adaugă cele mai confirmate
  if (relevantPatterns.length < 5) {
    const generalPatterns = await db
      .select()
      .from(learnedPatterns)
      .orderBy(desc(learnedPatterns.timesConfirmed))
      .limit(10 - relevantPatterns.length);
    relevantPatterns = [...relevantPatterns, ...generalPatterns];
  }

  // Construiește context de cunoștințe învățate
  const learnedContext = relevantPatterns.length > 0
    ? `\n\n--- CUNOȘTINȚE VALIDATE DE MECANICI ---\n${relevantPatterns
        .map(p => `• [${p.brand} ${p.model || ""}${p.engineCode ? ` (${p.engineCode})` : ""}] "${p.symptomPattern}" → Cauza confirmată: ${p.confirmedCause} (confirmat ${p.timesConfirmed}x, acuratețe: ${p.avgAccuracy}%)`)
        .join("\n")}\n--- FOLOSEȘTE ACESTE CUNOȘTINȚE PENTRU A ÎMBUNĂTĂȚI DIAGNOSTICUL ---`
    : "";

  return {
    prompt: activePrompt?.promptText || "",
    learnedContext,
  };
}

// ============================================================
// 4. ACCURACY TRACKER - Metrici acuratețe per categorie
// ============================================================

/**
 * Actualizează metrici de acuratețe din feedback
 */
async function updateAccuracyMetrics(
  diagnostic: any,
  feedback: FeedbackInput
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const brand = diagnostic.vehicleBrand || "Unknown";
  const model = diagnostic.vehicleModel || "Unknown";
  const category = diagnostic.category || "general";
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  type DimensionType = "brand" | "model" | "symptom_category" | "error_code" | "agent" | "overall";
  
  // Dimensiuni de tracking
  const dimensions: Array<{ dimension: DimensionType; value: string }> = [
    { dimension: "brand", value: brand },
    { dimension: "model", value: `${brand} ${model}` },
    { dimension: "symptom_category", value: category },
    { dimension: "overall", value: "all" },
  ];

  // Adaugă coduri eroare ca dimensiuni
  const errorCodes = diagnostic.errorCodes as string[] || [];
  for (const code of errorCodes.slice(0, 3)) {
    dimensions.push({ dimension: "error_code", value: code });
  }

  for (const dim of dimensions) {
    // Verifică dacă metrica există pentru această perioadă
    const existing = await db
      .select()
      .from(accuracyMetrics)
      .where(
        and(
          eq(accuracyMetrics.dimension, dim.dimension),
          eq(accuracyMetrics.dimensionValue, dim.value),
          gte(accuracyMetrics.periodStart, periodStart)
        )
      )
      .limit(1);

    const isCorrect = feedback.overallRating >= 4;
    const isPartial = feedback.overallRating === 3;

    if (existing.length > 0) {
      const metric = existing[0];
      const newTotal = (metric.totalDiagnostics || 0) + 1;
      const newCorrect = (metric.correctDiagnostics || 0) + (isCorrect ? 1 : 0);
      const newPartial = (metric.partiallyCorrect || 0) + (isPartial ? 1 : 0);
      const newIncorrect = (metric.incorrectDiagnostics || 0) + (!isCorrect && !isPartial ? 1 : 0);
      const newAvg = ((newCorrect * 100 + newPartial * 50) / newTotal).toFixed(2);
      
      const currentAvgFeedback = parseFloat(metric.avgFeedbackScore?.toString() || "3");
      const newAvgFeedback = ((currentAvgFeedback * (newTotal - 1) + feedback.overallRating) / newTotal).toFixed(2);

      // Determină trend
      const prevAvg = parseFloat(metric.avgAccuracy?.toString() || "70");
      const trend = parseFloat(newAvg) > prevAvg + 2 ? "improving" as const
        : parseFloat(newAvg) < prevAvg - 2 ? "declining" as const
        : "stable" as const;

      await db
        .update(accuracyMetrics)
        .set({
          totalDiagnostics: newTotal,
          correctDiagnostics: newCorrect,
          partiallyCorrect: newPartial,
          incorrectDiagnostics: newIncorrect,
          avgAccuracy: newAvg,
          avgFeedbackScore: newAvgFeedback,
          trend,
        })
        .where(eq(accuracyMetrics.id, metric.id));
    } else {
      await db.insert(accuracyMetrics).values({
        dimension: dim.dimension,
        dimensionValue: dim.value,
        totalDiagnostics: 1,
        correctDiagnostics: isCorrect ? 1 : 0,
        partiallyCorrect: isPartial ? 1 : 0,
        incorrectDiagnostics: !isCorrect && !isPartial ? 1 : 0,
        avgAccuracy: (feedback.overallRating * 20).toFixed(2),
        avgFeedbackScore: feedback.overallRating.toFixed(2),
        trend: "stable",
        periodStart,
        periodEnd,
      });
    }
  }
}

// ============================================================
// 5. QUERY HELPERS - Funcții de interogare
// ============================================================

/**
 * Obține metrici de acuratețe pentru dashboard
 */
export async function getAccuracyDashboard(): Promise<{
  overall: { accuracy: number; totalDiagnostics: number; trend: string };
  byBrand: Array<{ brand: string; accuracy: number; total: number; trend: string }>;
  byCategory: Array<{ category: string; accuracy: number; total: number }>;
  recentFeedback: Array<{ rating: number; notes: string; createdAt: Date }>;
  topPatterns: Array<{ brand: string; symptom: string; cause: string; confirmed: number }>;
}> {
  const db = await getDb();
  if (!db) {
    return {
      overall: { accuracy: 0, totalDiagnostics: 0, trend: "stable" },
      byBrand: [],
      byCategory: [],
      recentFeedback: [],
      topPatterns: [],
    };
  }

  // Overall metrics
  const overallMetrics = await db
    .select()
    .from(accuracyMetrics)
    .where(
      and(
        eq(accuracyMetrics.dimension, "overall"),
        eq(accuracyMetrics.dimensionValue, "all")
      )
    )
    .orderBy(desc(accuracyMetrics.periodStart))
    .limit(1);

  const overall = overallMetrics.length > 0
    ? {
        accuracy: parseFloat(overallMetrics[0].avgAccuracy?.toString() || "0"),
        totalDiagnostics: overallMetrics[0].totalDiagnostics || 0,
        trend: overallMetrics[0].trend || "stable",
      }
    : { accuracy: 0, totalDiagnostics: 0, trend: "stable" };

  // By brand
  const brandMetrics = await db
    .select()
    .from(accuracyMetrics)
    .where(eq(accuracyMetrics.dimension, "brand"))
    .orderBy(desc(accuracyMetrics.totalDiagnostics))
    .limit(10);

  const byBrand = brandMetrics.map(m => ({
    brand: m.dimensionValue,
    accuracy: parseFloat(m.avgAccuracy?.toString() || "0"),
    total: m.totalDiagnostics || 0,
    trend: m.trend || "stable",
  }));

  // By category
  const categoryMetrics = await db
    .select()
    .from(accuracyMetrics)
    .where(eq(accuracyMetrics.dimension, "symptom_category"))
    .orderBy(desc(accuracyMetrics.totalDiagnostics))
    .limit(10);

  const byCategory = categoryMetrics.map(m => ({
    category: m.dimensionValue,
    accuracy: parseFloat(m.avgAccuracy?.toString() || "0"),
    total: m.totalDiagnostics || 0,
  }));

  // Recent feedback
  const recentFeedback = await db
    .select({
      rating: diagnosticFeedback.overallRating,
      notes: diagnosticFeedback.mechanicNotes,
      createdAt: diagnosticFeedback.createdAt,
    })
    .from(diagnosticFeedback)
    .orderBy(desc(diagnosticFeedback.createdAt))
    .limit(10);

  // Top patterns
  const topPatterns = await db
    .select({
      brand: learnedPatterns.brand,
      symptom: learnedPatterns.symptomPattern,
      cause: learnedPatterns.confirmedCause,
      confirmed: learnedPatterns.timesConfirmed,
    })
    .from(learnedPatterns)
    .orderBy(desc(learnedPatterns.timesConfirmed))
    .limit(10);

  return {
    overall,
    byBrand,
    byCategory,
    recentFeedback: recentFeedback.map(f => ({
      rating: f.rating,
      notes: f.notes || "",
      createdAt: f.createdAt,
    })),
    topPatterns: topPatterns.map(p => ({
      brand: p.brand,
      symptom: p.symptom,
      cause: p.cause,
      confirmed: p.confirmed,
    })),
  };
}

/**
 * Obține feedback pentru un diagnostic specific
 */
export async function getFeedbackForDiagnostic(diagnosticId: number) {
  const db = await getDb();
  if (!db) return null;

  const [feedback] = await db
    .select()
    .from(diagnosticFeedback)
    .where(eq(diagnosticFeedback.diagnosticId, diagnosticId))
    .limit(1);

  return feedback || null;
}

/**
 * Obține pattern-uri similare pentru un diagnostic nou
 */
export async function findSimilarPatterns(
  brand: string,
  symptoms: string,
  errorCodes?: string[]
): Promise<Array<{
  cause: string;
  solution: string;
  confidence: number;
  timesConfirmed: number;
  parts: string[];
}>> {
  const db = await getDb();
  if (!db) return [];

  const normalizedSymptoms = normalizeSymptoms(symptoms);
  const keywords = normalizedSymptoms.split(" ").filter(w => w.length > 3).slice(0, 5);

  // Caută pattern-uri cu brand matching
  let patterns = await db
    .select()
    .from(learnedPatterns)
    .where(eq(learnedPatterns.brand, brand))
    .orderBy(desc(learnedPatterns.timesConfirmed))
    .limit(20);

  // Scorează pattern-urile pe baza similarității
  const scored = patterns.map(p => {
    let score = 0;
    const patternWords = p.symptomPattern.toLowerCase().split(" ");

    // Keyword matching
    for (const kw of keywords) {
      if (patternWords.some(pw => pw.includes(kw))) score += 20;
    }

    // Error code matching
    if (errorCodes && p.errorCodes) {
      const patternCodes = p.errorCodes as string[];
      for (const code of errorCodes) {
        if (patternCodes.includes(code)) score += 30;
      }
    }

    // Bonus pentru confirmări multiple
    score += Math.min(20, (p.timesConfirmed || 1) * 5);

    return { pattern: p, score };
  });

  // Returnează top 5 cu scor > 20
  return scored
    .filter(s => s.score > 20)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(s => ({
      cause: s.pattern.confirmedCause,
      solution: s.pattern.confirmedSolution,
      confidence: parseFloat(s.pattern.confidence?.toString() || "50"),
      timesConfirmed: s.pattern.timesConfirmed || 1,
      parts: (s.pattern.confirmedParts as string[]) || [],
    }));
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Normalizează simptomele pentru matching consistent
 */
function normalizeSymptoms(symptoms: string): string {
  return symptoms
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
