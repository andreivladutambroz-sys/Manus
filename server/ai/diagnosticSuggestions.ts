import { ENV } from '../_core/env';

/**
 * AI Diagnostic Suggestions Service
 * Predicts likely causes based on symptoms and provides confidence scores
 */

export interface DiagnosticSuggestion {
  cause: string;
  confidence: number;
  description: string;
  components: string[];
  estimatedCost: {
    min: number;
    max: number;
    currency: string;
  };
  repairTime: {
    min: number;
    max: number;
  };
  relatedCodes: string[];
  preventiveMeasures: string[];
}

export interface DiagnosticInput {
  symptoms: string[];
  brand: string;
  model: string;
  year: number;
  mileage: number;
  category: string;
  errorCodes: string[];
  previousDiagnostics?: Array<{
    cause: string;
    confirmed: boolean;
  }>;
}

/**
 * Call Kimi API
 */
async function callKimi(
  systemPrompt: string,
  userPrompt: string,
  options: { temperature?: number; maxTokens?: number; jsonMode?: boolean } = {}
): Promise<string> {
  const { temperature = 0.3, maxTokens = 2000, jsonMode = false } = options;

  const response = await fetch('https://api.moonshot.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ENV.kimiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'moonshot-v1-128k',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Kimi API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  return data.choices[0]?.message.content || '';
}

/**
 * Build system prompt for diagnostic suggestions
 */
function buildSystemPrompt(): string {
  return `You are an expert automotive diagnostic AI with deep knowledge of vehicle systems.
Your role is to analyze vehicle symptoms and error codes to predict the most likely causes.
Provide your analysis in valid JSON format.`;
}

/**
 * Build prompt for AI suggestion generation
 */
function buildSuggestionPrompt(input: DiagnosticInput): string {
  const symptomsText = input.symptoms.join(', ');
  const codesText = input.errorCodes.length > 0 ? input.errorCodes.join(', ') : 'None';
  const mileageInfo = `${input.mileage.toLocaleString()} km`;
  const vehicleAge = new Date().getFullYear() - input.year;

  const previousDiagnosticsInfo = input.previousDiagnostics
    ? input.previousDiagnostics
        .map(d => `${d.cause} (${d.confirmed ? 'Confirmed' : 'Not confirmed'})`)
        .join('; ')
    : 'None';

  return `Analyze this vehicle issue and provide the most likely causes with confidence scores.

VEHICLE: ${input.brand} ${input.model} (${input.year}, ${vehicleAge} years old, ${mileageInfo})
CATEGORY: ${input.category}

SYMPTOMS: ${symptomsText}
ERROR CODES: ${codesText}
PREVIOUS DIAGNOSTICS: ${previousDiagnosticsInfo}

Provide 3-5 suggestions in this JSON format:
{
  "suggestions": [
    {
      "cause": "Name of cause",
      "confidence": 85,
      "description": "Explanation",
      "components": ["Component 1"],
      "estimatedCost": {"min": 100, "max": 500, "currency": "USD"},
      "repairTime": {"min": 1, "max": 3},
      "relatedCodes": ["P0101"],
      "preventiveMeasures": ["Measure 1"]
    }
  ]
}`;
}

/**
 * Generate AI suggestions for diagnostic
 */
export async function generateDiagnosticSuggestions(
  input: DiagnosticInput,
  topN: number = 3
): Promise<DiagnosticSuggestion[]> {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildSuggestionPrompt(input);

  try {
    const response = await callKimi(systemPrompt, userPrompt, {
      temperature: 0.7,
      maxTokens: 2000,
      jsonMode: true,
    });

    const suggestions = parseSuggestions(response, input);

    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, topN);
  } catch (error) {
    console.error('Error generating diagnostic suggestions:', error);
    throw new Error('Failed to generate diagnostic suggestions');
  }
}

/**
 * Parse AI response and extract suggestions
 */
function parseSuggestions(
  response: string,
  input: DiagnosticInput
): DiagnosticSuggestion[] {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return parsed.suggestions.map((s: any) => ({
      cause: s.cause || 'Unknown',
      confidence: Math.min(100, Math.max(0, s.confidence || 50)),
      description: s.description || '',
      components: Array.isArray(s.components) ? s.components : [],
      estimatedCost: {
        min: s.estimatedCost?.min || 0,
        max: s.estimatedCost?.max || 0,
        currency: s.estimatedCost?.currency || 'USD',
      },
      repairTime: {
        min: s.repairTime?.min || 1,
        max: s.repairTime?.max || 2,
      },
      relatedCodes: Array.isArray(s.relatedCodes) ? s.relatedCodes : [],
      preventiveMeasures: Array.isArray(s.preventiveMeasures) ? s.preventiveMeasures : [],
    }));
  } catch (error) {
    console.error('Error parsing suggestions:', error);
    return [];
  }
}

/**
 * Get suggestions with caching
 */
const suggestionCache = new Map<string, DiagnosticSuggestion[]>();

export async function getCachedSuggestions(
  input: DiagnosticInput,
  ttl: number = 3600000
): Promise<DiagnosticSuggestion[]> {
  const cacheKey = generateCacheKey(input);

  if (suggestionCache.has(cacheKey)) {
    return suggestionCache.get(cacheKey)!;
  }

  const suggestions = await generateDiagnosticSuggestions(input);

  suggestionCache.set(cacheKey, suggestions);
  setTimeout(() => suggestionCache.delete(cacheKey), ttl);

  return suggestions;
}

/**
 * Generate cache key from input
 */
function generateCacheKey(input: DiagnosticInput): string {
  const key = `${input.brand}-${input.model}-${input.category}-${input.symptoms.sort().join('-')}`;
  return Buffer.from(key).toString('base64');
}

/**
 * Learn from confirmed diagnostics
 */
export async function learnFromDiagnostic(
  input: DiagnosticInput,
  confirmedCause: string,
  accuracy: number
): Promise<void> {
  console.log(`Learning: ${confirmedCause} for ${input.brand} ${input.model} with accuracy ${accuracy}%`);
}
