/**
 * EVIDENCE EXTRACTOR - Phase 0
 * Extracts and tracks evidence snippets from source content
 * 
 * Every record must contain evidence snippets that reference original source text
 * Example: "replaced the upstream O2 sensor and the code cleared"
 */

export interface EvidenceSnippet {
  field: string; // 'symptoms', 'repair_procedures', 'tools_required', 'torque_specs'
  snippet: string; // Original source text
  confidence: number; // 0.70-0.95
  sourceLineNumber?: number;
}

export interface SourceContent {
  url: string;
  domain: string;
  title?: string;
  content: string; // Full HTML or text content
  type: 'forum' | 'reddit' | 'manual' | 'blog' | 'video' | 'obd' | 'unknown';
}

/**
 * SNIPPET EXTRACTION PATTERNS
 */

const SNIPPET_PATTERNS = {
  symptoms: [
    // "symptom: ...", "symptoms: ...", "issue: ...", "problem: ..."
    /(?:symptom|symptoms|issue|problem|complaint|complains?)[:\s]+([^.\n]+[.!?]?)/gi,
    // "the car ...", "the engine ...", "the vehicle ..."
    /(?:the (?:car|engine|vehicle|transmission|battery|alternator)[^.!?]*[.!?])/gi,
    // "I noticed ...", "I experienced ...", "I had ..."
    /(?:I (?:noticed|experienced|had|observed|found)[^.!?]*[.!?])/gi
  ],

  repairSteps: [
    // "step 1: ...", "first: ...", "then: ...", "next: ..."
    /(?:step \d+|first|second|third|next|then|after that)[:\s]+([^.\n]+[.!?]?)/gi,
    // "1. ...", "2. ...", "- ..."
    /(?:^\d+\.|^-)\s+([^.\n]+[.!?]?)/gim,
    // "replace ...", "install ...", "check ...", "measure ...", "test ..."
    /(?:replace|install|check|measure|test|inspect|clean|remove|disconnect|connect)[^.!?]*[.!?]/gi
  ],

  tools: [
    // "OBD scanner", "multimeter", "torque wrench", etc.
    /(?:OBD scanner|multimeter|torque wrench|compression tester|fuel pressure gauge|oscilloscope|scan tool|diagnostic tool|socket set|wrench|screwdriver|pliers|hammer|jack|lift|vacuum pump|pressure tester|leak detector|timing light|stroboscope|code reader|diagnostic computer)/gi
  ],

  torqueSpecs: [
    // "25 Nm", "120 Nm", "50 ft-lbs", etc.
    /(\d+(?:\.\d+)?)\s*(?:Nm|N·m|ft-lbs?|ft·lbs?|in-lbs?|in·lbs?)\b/gi,
    // "torque: 25 Nm", "torque to: 120 Nm"
    /torque\s+(?:to|spec)?[:\s]+(\d+(?:\.\d+)?)\s*(?:Nm|N·m|ft-lbs?|ft·lbs?|in-lbs?|in·lbs?)\b/gi,
    // "tighten to 25 Nm"
    /tighten\s+(?:to|spec)?[:\s]+(\d+(?:\.\d+)?)\s*(?:Nm|N·m|ft-lbs?|ft·lbs?|in-lbs?|in·lbs?)\b/gi
  ],

  confidence: [
    // "confirmed", "verified", "tested", "works", "fixed", "solved"
    /(?:confirmed|verified|tested|works|fixed|solved|successful|success|resolved)/gi,
    // "likely", "probably", "might", "could", "may"
    /(?:likely|probably|might|could|may|possible|possibly)/gi,
    // "uncertain", "unsure", "not sure", "unclear"
    /(?:uncertain|unsure|not sure|unclear|unknown|unclear)/gi
  ]
};

/**
 * EXTRACT SNIPPETS FROM SOURCE CONTENT
 */

export function extractSnippets(
  sourceContent: SourceContent,
  extractionType: 'symptoms' | 'repairSteps' | 'tools' | 'torqueSpecs'
): EvidenceSnippet[] {
  const snippets: EvidenceSnippet[] = [];
  const patterns = SNIPPET_PATTERNS[extractionType];

  if (!patterns) {
    return snippets;
  }

  for (const pattern of patterns) {
    let match;
    const regex = new RegExp(pattern);

    while ((match = regex.exec(sourceContent.content)) !== null) {
      const snippet = match[0] || match[1];

      if (snippet && snippet.length > 5 && snippet.length < 500) {
        // Calculate confidence based on source type and pattern match quality
        const confidence = calculateSnippetConfidence(
          snippet,
          extractionType,
          sourceContent.type
        );

        snippets.push({
          field: extractionType,
          snippet: snippet.trim(),
          confidence,
          sourceLineNumber: getLineNumber(sourceContent.content, match.index)
        });
      }
    }
  }

  // Remove duplicates
  return Array.from(
    new Map(snippets.map(s => [s.snippet, s])).values()
  );
}

/**
 * CALCULATE SNIPPET CONFIDENCE
 */

function calculateSnippetConfidence(
  snippet: string,
  type: string,
  sourceType: string
): number {
  let confidence = 0.70; // Base confidence

  // Source type confidence
  const sourceConfidence: Record<string, number> = {
    manual: 0.95,
    obd: 0.92,
    forum: 0.75,
    reddit: 0.72,
    blog: 0.70,
    video: 0.68,
    unknown: 0.65
  };

  confidence = sourceConfidence[sourceType] || 0.70;

  // Snippet quality adjustments
  const snippetLength = snippet.length;

  // Too short or too long = lower confidence
  if (snippetLength < 20) confidence -= 0.05;
  if (snippetLength > 300) confidence -= 0.05;

  // Specific keywords increase confidence
  const highConfidenceKeywords = [
    'confirmed', 'verified', 'tested', 'works', 'fixed', 'solved',
    'successful', 'success', 'resolved', 'replaced', 'installed',
    'checked', 'measured', 'tested'
  ];

  if (highConfidenceKeywords.some(kw => snippet.toLowerCase().includes(kw))) {
    confidence += 0.05;
  }

  // Uncertain keywords decrease confidence
  const lowConfidenceKeywords = [
    'might', 'could', 'may', 'possibly', 'uncertain', 'unsure',
    'not sure', 'unclear', 'unknown', 'maybe'
  ];

  if (lowConfidenceKeywords.some(kw => snippet.toLowerCase().includes(kw))) {
    confidence -= 0.05;
  }

  // Specific numbers (torque, pressure, etc.) increase confidence
  if (/\d+/.test(snippet)) {
    confidence += 0.02;
  }

  // Cap at 0.70-0.95 range
  return Math.min(0.95, Math.max(0.70, confidence));
}

/**
 * GET LINE NUMBER IN SOURCE
 */

function getLineNumber(content: string, index: number): number {
  return content.substring(0, index).split('\n').length;
}

/**
 * EXTRACT ALL EVIDENCE FOR A RECORD
 */

export interface RecordEvidence {
  symptoms: EvidenceSnippet[];
  repairSteps: EvidenceSnippet[];
  tools: EvidenceSnippet[];
  torqueSpecs: EvidenceSnippet[];
  avgConfidence: number;
  totalSnippets: number;
}

export function extractAllEvidence(sourceContent: SourceContent): RecordEvidence {
  const symptoms = extractSnippets(sourceContent, 'symptoms');
  const repairSteps = extractSnippets(sourceContent, 'repairSteps');
  const tools = extractSnippets(sourceContent, 'tools');
  const torqueSpecs = extractSnippets(sourceContent, 'torqueSpecs');

  const allSnippets = [...symptoms, ...repairSteps, ...tools, ...torqueSpecs];
  const avgConfidence = allSnippets.length > 0
    ? allSnippets.reduce((sum, s) => sum + s.confidence, 0) / allSnippets.length
    : 0.70;

  return {
    symptoms,
    repairSteps,
    tools,
    torqueSpecs,
    avgConfidence: Math.round(avgConfidence * 100) / 100,
    totalSnippets: allSnippets.length
  };
}

/**
 * CLEAN AND NORMALIZE SNIPPET TEXT
 */

export function normalizeSnippet(snippet: string): string {
  return snippet
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\s\-.,!?()]/g, '') // Remove special characters
    .trim()
    .substring(0, 500); // Max 500 chars
}

/**
 * VALIDATE EVIDENCE QUALITY
 */

export interface EvidenceQuality {
  hasEvidence: boolean;
  snippetCount: number;
  avgConfidence: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  recommendations: string[];
}

export function validateEvidenceQuality(evidence: RecordEvidence): EvidenceQuality {
  const snippetCount = evidence.totalSnippets;
  const avgConfidence = evidence.avgConfidence;

  let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
  const recommendations: string[] = [];

  if (snippetCount >= 5 && avgConfidence >= 0.85) {
    quality = 'excellent';
  } else if (snippetCount >= 3 && avgConfidence >= 0.80) {
    quality = 'good';
  } else if (snippetCount >= 1 && avgConfidence >= 0.70) {
    quality = 'fair';
  } else {
    quality = 'poor';
    recommendations.push('Add more evidence snippets from source');
  }

  if (evidence.symptoms.length === 0) {
    recommendations.push('No symptom evidence found');
  }

  if (evidence.repairSteps.length === 0) {
    recommendations.push('No repair step evidence found');
  }

  if (evidence.tools.length === 0) {
    recommendations.push('No tools evidence found');
  }

  if (avgConfidence < 0.75) {
    recommendations.push('Increase evidence confidence by using more authoritative sources');
  }

  return {
    hasEvidence: snippetCount > 0,
    snippetCount,
    avgConfidence,
    quality,
    recommendations
  };
}

/**
 * FORMAT EVIDENCE FOR DISPLAY
 */

export function formatEvidenceForDisplay(evidence: RecordEvidence): string {
  let output = '## Evidence Snippets\n\n';

  if (evidence.symptoms.length > 0) {
    output += '### Symptoms\n';
    evidence.symptoms.forEach((s, i) => {
      output += `${i + 1}. "${s.snippet}" (confidence: ${(s.confidence * 100).toFixed(0)}%)\n`;
    });
    output += '\n';
  }

  if (evidence.repairSteps.length > 0) {
    output += '### Repair Steps\n';
    evidence.repairSteps.forEach((s, i) => {
      output += `${i + 1}. "${s.snippet}" (confidence: ${(s.confidence * 100).toFixed(0)}%)\n`;
    });
    output += '\n';
  }

  if (evidence.tools.length > 0) {
    output += '### Tools\n';
    evidence.tools.forEach((s, i) => {
      output += `${i + 1}. "${s.snippet}" (confidence: ${(s.confidence * 100).toFixed(0)}%)\n`;
    });
    output += '\n';
  }

  if (evidence.torqueSpecs.length > 0) {
    output += '### Torque Specs\n';
    evidence.torqueSpecs.forEach((s, i) => {
      output += `${i + 1}. "${s.snippet}" (confidence: ${(s.confidence * 100).toFixed(0)}%)\n`;
    });
    output += '\n';
  }

  output += `**Average Confidence:** ${(evidence.avgConfidence * 100).toFixed(0)}%\n`;
  output += `**Total Snippets:** ${evidence.totalSnippets}\n`;

  return output;
}
