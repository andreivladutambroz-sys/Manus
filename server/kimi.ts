import { ENV } from "./_core/env";

export interface KimiDiagnosticResponse {
  probableCauses: Array<{
    cause: string;
    probability: number;
  }>;
  errorCodes: string[];
  checkOrder: string[];
  estimatedTime: string;
  estimatedCost: string;
  recommendation: string;
}

export async function analyzeSymptoms(
  brand: string,
  model: string,
  year: number,
  engine: string | undefined,
  symptomsText: string,
  symptomsSelected: string[]
): Promise<KimiDiagnosticResponse> {
  const kimiApiKey = process.env.KIMI_API_KEY;
  if (!kimiApiKey) {
    throw new Error("KIMI_API_KEY is not configured");
  }

  const systemPrompt = `Ești un expert în diagnostic auto specializat pe vehicule VAG (VW, Audi, Skoda, Seat).
Analizează simptomele și oferă:
1. Top 3 cauze probabile (cu procente)
2. Coduri eroare OBD probabile
3. Ordine verificare componente (de la ușor la complex)
4. Timp estimat diagnostic + reparație
5. Cost estimat piese (EUR)
6. Recomandare finală: reparație sau înlocuire

Răspunde în JSON structurat, limba: română.`;

  const userMessage = `
Vehicul: ${brand} ${model} (${year})
Motor: ${engine || "necunoscut"}
Simptome descrise: ${symptomsText}
Simptome selectate: ${symptomsSelected.join(", ")}

Analizează aceste simptome și oferă diagnostic profesional.
`;

  try {
    const response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${kimiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "kimi-latest",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userMessage,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Kimi API error:", error);
      throw new Error(`Kimi API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from Kimi API");
    }

    // Parse JSON response from Kimi
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // If no JSON found, create a structured response from the text
      return {
        probableCauses: [
          {
            cause: "Necesită diagnostic mai detaliat",
            probability: 50,
          },
        ],
        errorCodes: [],
        checkOrder: ["Verificare cu scaner OBD", "Inspecție vizuală"],
        estimatedTime: "1-2 ore",
        estimatedCost: "100-500 EUR",
        recommendation: content,
      };
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);
    return parsedResponse as KimiDiagnosticResponse;
  } catch (error) {
    console.error("Error calling Kimi API:", error);
    throw error;
  }
}
