import { webScraper, DiagnosticContext, ScrapedDiagnosticInfo } from './web-scraper';

export interface EnhancedDiagnosticRequest {
  brand: string;
  model: string;
  year?: number;
  symptoms: string[];
  errorCodes?: string[];
  vehicleHistory?: string;
}

export interface EnhancedDiagnosticResult {
  diagnosis: string;
  confidence: number;
  possibleCauses: Array<{
    cause: string;
    probability: number;
    description: string;
  }>;
  recommendedActions: string[];
  sources: ScrapedDiagnosticInfo[];
  relatedDiscussions: string[];
  expertOpinions: string[];
}

const KIMI_API_KEY = process.env.KIMI_API_KEY || '';
const KIMI_API_URL = 'https://api.moonshot.ai/v1/chat/completions';

async function enhancedDiagnose(request: EnhancedDiagnosticRequest): Promise<EnhancedDiagnosticResult> {
  // Step 1: Scrape relevant information from online sources
  const context: DiagnosticContext = {
    brand: request.brand,
    model: request.model,
    year: request.year,
    symptoms: request.symptoms,
    errorCodes: request.errorCodes,
  };

  const sources = await webScraper.aggregateSources(context);

  // Step 2: Build enhanced prompt with scraped data
  const sourcesContext = sources
    .map((s, i) => `${i + 1}. [${s.source}] ${s.title}\n   ${s.content.substring(0, 200)}...`)
    .join('\n');

  const prompt = `You are an expert automotive diagnostic specialist. Analyze this vehicle issue using the provided context from online forums and resources.

VEHICLE INFORMATION:
- Brand: ${request.brand}
- Model: ${request.model}
- Year: ${request.year || 'Unknown'}

SYMPTOMS:
${request.symptoms.map((s) => `- ${s}`).join('\n')}

ERROR CODES:
${request.errorCodes?.map((c) => `- ${c}`).join('\n') || 'None'}

RELEVANT ONLINE DISCUSSIONS & RESOURCES:
${sourcesContext}

VEHICLE HISTORY:
${request.vehicleHistory || 'No history provided'}

Based on the symptoms, error codes, and relevant online discussions above, provide:

1. Primary Diagnosis: The most likely cause
2. Confidence Level: 0-100%
3. Alternative Causes: List 2-3 other possible causes with probabilities
4. Recommended Actions: Step-by-step diagnostic procedures
5. Related Expert Opinions: Insights from the online discussions

Format your response as JSON.`;

  // Step 3: Call Kimi API with enhanced context
  const response = await fetch(KIMI_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${KIMI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'moonshot-v1-128k',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    throw new Error(`Kimi API error ${response.status}`);
  }

  const data = await response.json();
  const responseText = data.choices?.[0]?.message?.content || '';

  // Step 4: Parse response
  let parsedResult;
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsedResult = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('No JSON found in response');
    }
  } catch (error) {
    console.error('Failed to parse diagnostic response:', error);
    parsedResult = {
      diagnosis: responseText,
      confidence: 50,
      possibleCauses: [],
      recommendedActions: [],
      expertOpinions: [],
    };
  }

  // Step 5: Extract related discussions from sources
  const relatedDiscussions = sources.map((s) => s.url);

  return {
    diagnosis: parsedResult.diagnosis || 'Unable to determine',
    confidence: parsedResult.confidence || 50,
    possibleCauses: parsedResult.possibleCauses || [],
    recommendedActions: parsedResult.recommendedActions || [],
    sources,
    relatedDiscussions,
    expertOpinions: parsedResult.expertOpinions || [],
  };
}

export { enhancedDiagnose };
