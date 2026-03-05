/**
 * Diagnostic Sources Tracing Service
 * Tracks and logs all sources used in diagnostic analysis
 * Ensures transparency and verifiability
 */

export interface DiagnosticSource {
  type: "kimi_ai" | "oem_database" | "technical_manual" | "forum" | "parts_api" | "market_data" | "user_input";
  name: string;
  url?: string;
  description: string;
  confidence: number; // 0-100
  timestamp: Date;
  data?: any;
}

export interface SourcedDiagnosticResult {
  diagnosis: string;
  sources: DiagnosticSource[];
  sourcesSummary: {
    totalSources: number;
    averageConfidence: number;
    verifiedSources: number;
    unverifiedSources: number;
  };
  trustScore: number; // 0-100
}

/**
 * Track Kimi AI responses with source information
 */
export async function trackKimiResponse(
  prompt: string,
  response: string,
  model: string = "kimi-latest"
): Promise<DiagnosticSource> {
  return {
    type: "kimi_ai",
    name: `Kimi AI (${model})`,
    url: "https://api.moonshot.ai",
    description: `AI-generated analysis using prompt: "${prompt.substring(0, 100)}..."`,
    confidence: 60, // AI is less trusted than verified sources
    timestamp: new Date(),
    data: {
      prompt,
      response,
      model,
    },
  };
}

/**
 * Track OEM database sources
 */
export function trackOEMSource(
  brand: string,
  model: string,
  year: number,
  dataType: string
): DiagnosticSource {
  return {
    type: "oem_database",
    name: `OEM Database - ${brand}`,
    url: `https://www.autodata.com/${brand}/${model}/${year}`,
    description: `Official OEM data for ${brand} ${model} (${year}): ${dataType}`,
    confidence: 98, // OEM data is highly trusted
    timestamp: new Date(),
  };
}

/**
 * Track technical manual sources
 */
export function trackTechnicalManualSource(
  manual: string,
  section: string
): DiagnosticSource {
  return {
    type: "technical_manual",
    name: `Technical Manual: ${manual}`,
    description: `Section: ${section}`,
    confidence: 90,
    timestamp: new Date(),
  };
}

/**
 * Track forum/community sources
 */
export function trackForumSource(
  forumName: string,
  url: string,
  threadTitle: string,
  upvotes: number
): DiagnosticSource {
  // Confidence based on community validation (upvotes)
  const confidence = Math.min(50 + upvotes * 5, 85);

  return {
    type: "forum",
    name: `${forumName}`,
    url,
    description: `Community discussion: "${threadTitle}" (${upvotes} upvotes)`,
    confidence,
    timestamp: new Date(),
  };
}

/**
 * Track parts API sources
 */
export function trackPartsAPISource(
  apiName: string,
  partName: string,
  price: number,
  availability: string
): DiagnosticSource {
  return {
    type: "parts_api",
    name: `Parts API: ${apiName}`,
    url: `https://${apiName.toLowerCase()}.com`,
    description: `${partName}: ${price} EUR (${availability})`,
    confidence: 85,
    timestamp: new Date(),
  };
}

/**
 * Track market data sources
 */
export function trackMarketDataSource(
  source: string,
  dataType: string,
  dataPoints: number
): DiagnosticSource {
  return {
    type: "market_data",
    name: `Market Data: ${source}`,
    description: `${dataType} from ${dataPoints} data points`,
    confidence: 75,
    timestamp: new Date(),
  };
}

/**
 * Track user input
 */
export function trackUserInput(
  inputType: string,
  value: string
): DiagnosticSource {
  return {
    type: "user_input",
    name: "User Input",
    description: `${inputType}: ${value}`,
    confidence: 50, // User input has lower confidence
    timestamp: new Date(),
  };
}

/**
 * Create sourced diagnostic result
 */
export function createSourcedResult(
  diagnosis: string,
  sources: DiagnosticSource[]
): SourcedDiagnosticResult {
  const verifiedSources = sources.filter((s) => s.confidence >= 75).length;
  const unverifiedSources = sources.length - verifiedSources;
  const averageConfidence =
    sources.length > 0
      ? Math.round(sources.reduce((sum, s) => sum + s.confidence, 0) / sources.length)
      : 0;

  // Calculate trust score based on sources
  let trustScore = averageConfidence;

  // Boost trust if we have multiple verified sources
  if (verifiedSources >= 3) {
    trustScore = Math.min(trustScore + 15, 100);
  }

  // Reduce trust if we only have AI sources
  const onlyAI = sources.every((s) => s.type === "kimi_ai");
  if (onlyAI) {
    trustScore = Math.min(trustScore, 65);
  }

  return {
    diagnosis,
    sources,
    sourcesSummary: {
      totalSources: sources.length,
      averageConfidence,
      verifiedSources,
      unverifiedSources,
    },
    trustScore,
  };
}

/**
 * Format sources for display
 */
export function formatSourcesForDisplay(result: SourcedDiagnosticResult): string {
  const sourcesList = result.sources
    .map((source, idx) => {
      const trustBadge =
        source.confidence >= 90
          ? "✅"
          : source.confidence >= 75
          ? "✔️"
          : "⚠️";

      const link = source.url ? ` [Link](${source.url})` : "";

      return `${idx + 1}. ${trustBadge} **${source.name}** (${source.confidence}% confidence)\n   ${source.description}${link}`;
    })
    .join("\n");

  const trustBadge =
    result.trustScore >= 85
      ? "🟢 Foarte sigur"
      : result.trustScore >= 70
      ? "🟡 Sigur"
      : "🔴 Neverificat";

  return `
## Diagnostic Sources (Trust Score: ${result.trustScore}% - ${trustBadge})

**Rezumat surse:**
- Total surse: ${result.sourcesSummary.totalSources}
- Surse verificate: ${result.sourcesSummary.verifiedSources}
- Surse neverificate: ${result.sourcesSummary.unverifiedSources}
- Încredere medie: ${result.sourcesSummary.averageConfidence}%

**Detalii surse:**
${sourcesList}

---
`;
}

/**
 * Validate diagnostic result has sufficient sources
 */
export function validateDiagnosticSources(result: SourcedDiagnosticResult): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (result.sourcesSummary.totalSources === 0) {
    issues.push("Nu au fost găsite surse pentru diagnostic");
  }

  if (result.sourcesSummary.verifiedSources === 0) {
    issues.push("Diagnostic se bazează doar pe surse neverificate");
  }

  if (result.trustScore < 50) {
    issues.push("Diagnostic are scor de încredere prea scăzut");
  }

  // Check if too many AI sources
  const aiSources = result.sources.filter((s) => s.type === "kimi_ai").length;
  if (aiSources > result.sourcesSummary.totalSources * 0.7) {
    issues.push("Diagnostic se bazează prea mult pe AI, insuficiente surse verificate");
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Log diagnostic sources for audit trail
 */
export function logDiagnosticSources(
  diagnosticId: string,
  result: SourcedDiagnosticResult
): void {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`DIAGNOSTIC SOURCES AUDIT - ID: ${diagnosticId}`);
  console.log(`${"=".repeat(60)}`);
  console.log(formatSourcesForDisplay(result));
  console.log(`${"=".repeat(60)}\n`);
}

/**
 * Export sources as JSON for API response
 */
export function exportSourcesAsJSON(result: SourcedDiagnosticResult): any {
  return {
    diagnosis: result.diagnosis,
    trustScore: result.trustScore,
    sourcesSummary: result.sourcesSummary,
    sources: result.sources.map((source) => ({
      type: source.type,
      name: source.name,
      url: source.url,
      description: source.description,
      confidence: source.confidence,
      timestamp: source.timestamp.toISOString(),
    })),
  };
}
