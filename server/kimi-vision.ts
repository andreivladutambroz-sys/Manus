

export interface VisionAnalysisResult {
  defectsDetected: string[];
  damageLevel: 'none' | 'minor' | 'moderate' | 'severe';
  confidence: number;
  recommendations: string[];
  estimatedRepairCost: {
    min: number;
    max: number;
    currency: string;
  };
  detailedAnalysis: string;
}

const KIMI_API_KEY = process.env.KIMI_API_KEY || '';
const KIMI_API_URL = 'https://api.moonshot.ai/v1/chat/completions';

async function analyzeVehicleImage(imageUrl: string, vehicleInfo: {
  brand: string;
  model: string;
  year?: number;
}): Promise<VisionAnalysisResult> {
  const prompt = `You are an expert automotive inspector. Analyze this vehicle image and provide a professional damage assessment.

VEHICLE INFORMATION:
- Brand: ${vehicleInfo.brand}
- Model: ${vehicleInfo.model}
- Year: ${vehicleInfo.year || 'Unknown'}

Please analyze the image and provide:

1. **Defects Detected**: List all visible defects, damage, or issues
2. **Damage Level**: Rate overall damage (none, minor, moderate, severe)
3. **Confidence**: Your confidence level (0-100%)
4. **Recommendations**: What repairs are needed
5. **Estimated Repair Cost**: Min and max cost in EUR
6. **Detailed Analysis**: Professional assessment

Format your response as JSON with these exact fields:
{
  "defectsDetected": ["defect1", "defect2"],
  "damageLevel": "moderate",
  "confidence": 85,
  "recommendations": ["recommendation1", "recommendation2"],
  "estimatedRepairCost": {"min": 500, "max": 1500, "currency": "EUR"},
  "detailedAnalysis": "Professional analysis text"
}`;

  try {
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
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      throw new Error(`Kimi Vision API error ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || '';

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in vision response');
    }

    const result = JSON.parse(jsonMatch[0]);

    return {
      defectsDetected: result.defectsDetected || [],
      damageLevel: result.damageLevel || 'none',
      confidence: result.confidence || 50,
      recommendations: result.recommendations || [],
      estimatedRepairCost: result.estimatedRepairCost || { min: 0, max: 0, currency: 'EUR' },
      detailedAnalysis: result.detailedAnalysis || '',
    };
  } catch (error) {
    console.error('Kimi Vision analysis failed:', error);
    throw error;
  }
}

export { analyzeVehicleImage };
