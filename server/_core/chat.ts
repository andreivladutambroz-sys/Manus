/**
 * Chat API Handler - Mechanic Helper Diagnostic Assistant
 *
 * Express endpoint for AI SDK streaming chat with diagnostic context.
 * Uses Kimi AI for automotive diagnostic conversations.
 */

import { streamText, stepCountIs } from "ai";
import { tool } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import type { Express } from "express";
import { z } from "zod/v4";
import { ENV } from "./env";
import { createPatchedFetch } from "./patchedFetch";

/**
 * Creates an OpenAI-compatible provider with patched fetch.
 */
function createLLMProvider() {
  const baseURL = ENV.forgeApiUrl.endsWith("/v1")
    ? ENV.forgeApiUrl
    : `${ENV.forgeApiUrl}/v1`;

  return createOpenAI({
    baseURL,
    apiKey: ENV.forgeApiKey,
    fetch: createPatchedFetch(fetch),
  });
}

/**
 * Mechanic Helper tools for diagnostic assistance
 */
const tools = {
  decodeErrorCode: tool({
    description: "Decode an OBD-II or manufacturer-specific error code and explain what it means",
    inputSchema: z.object({
      code: z.string().describe("The error code to decode, e.g. 'P0300', 'P0171', '16395'"),
    }),
    execute: async ({ code }) => {
      const commonCodes: Record<string, { description: string; system: string; severity: string; causes: string[] }> = {
        "P0300": { description: "Random/Multiple Cylinder Misfire Detected", system: "Aprindere/Motor", severity: "Ridicată", causes: ["Bujii uzate", "Bobine defecte", "Injectoare murdare", "Compresie scăzută"] },
        "P0171": { description: "System Too Lean (Bank 1)", system: "Alimentare combustibil", severity: "Medie", causes: ["Senzor MAF murdar", "Furtun vacuum fisurat", "Pompa combustibil slabă", "Filtru combustibil înfundat"] },
        "P0420": { description: "Catalyst System Efficiency Below Threshold", system: "Emisii", severity: "Medie", causes: ["Catalizator uzat", "Senzor O2 defect", "Scurgere evacuare", "Amestec combustibil incorect"] },
        "P0442": { description: "Evaporative Emission System Leak Detected (small leak)", system: "EVAP", severity: "Scăzută", causes: ["Bușon rezervor slăbit", "Furtun EVAP fisurat", "Supapă purge defectă", "Canistru carbon uzat"] },
        "P0128": { description: "Coolant Thermostat Below Regulating Temperature", system: "Răcire", severity: "Medie", causes: ["Termostat blocat deschis", "Senzor temperatură defect", "Nivel lichid răcire scăzut"] },
        "P0301": { description: "Cylinder 1 Misfire Detected", system: "Aprindere", severity: "Ridicată", causes: ["Bujie cilindru 1 defectă", "Bobină cilindru 1 defectă", "Injector cilindru 1 defect", "Compresie scăzută cilindru 1"] },
        "P0302": { description: "Cylinder 2 Misfire Detected", system: "Aprindere", severity: "Ridicată", causes: ["Bujie cilindru 2 defectă", "Bobină cilindru 2 defectă", "Injector cilindru 2 defect"] },
        "P0016": { description: "Crankshaft/Camshaft Position Correlation (Bank 1 Sensor A)", system: "Distribuție", severity: "Ridicată", causes: ["Lanț distribuție alungit", "Tensor lanț defect", "Senzor arbore cotit defect", "Senzor arbore came defect"] },
      };
      const info = commonCodes[code.toUpperCase()];
      if (info) {
        return { code: code.toUpperCase(), ...info, found: true };
      }
      // Generic decode based on prefix
      let system = "Necunoscut";
      if (code.startsWith("P0") || code.startsWith("P2")) system = "Powertrain (Motor/Transmisie)";
      else if (code.startsWith("P1")) system = "Manufacturer-specific Powertrain";
      else if (code.startsWith("B")) system = "Body (Caroserie)";
      else if (code.startsWith("C")) system = "Chassis (Șasiu)";
      else if (code.startsWith("U")) system = "Network Communication";
      return { code: code.toUpperCase(), system, description: `Cod ${code.toUpperCase()} - consultă baza de date specifică producătorului`, severity: "Necunoscută", causes: ["Necesită investigație suplimentară"], found: false };
    },
  }),

  estimateRepairCost: tool({
    description: "Estimate repair cost for a specific automotive repair",
    inputSchema: z.object({
      repair: z.string().describe("The repair to estimate, e.g. 'înlocuire bujii', 'schimb distribuție'"),
      vehicleType: z.string().optional().describe("Vehicle type for more accurate estimate"),
    }),
    execute: async ({ repair, vehicleType }) => {
      const estimates: Record<string, { partsMin: number; partsMax: number; laborMin: number; laborMax: number; timeHours: string }> = {
        "bujii": { partsMin: 40, partsMax: 200, laborMin: 50, laborMax: 150, timeHours: "0.5-1.5" },
        "bobine": { partsMin: 80, partsMax: 400, laborMin: 50, laborMax: 200, timeHours: "0.5-2" },
        "distribuție": { partsMin: 200, partsMax: 800, laborMin: 300, laborMax: 1000, timeHours: "4-8" },
        "turbo": { partsMin: 500, partsMax: 2500, laborMin: 300, laborMax: 800, timeHours: "3-6" },
        "catalizator": { partsMin: 300, partsMax: 1500, laborMin: 100, laborMax: 400, timeHours: "1-3" },
        "ambreiaj": { partsMin: 200, partsMax: 600, laborMin: 300, laborMax: 800, timeHours: "4-8" },
        "frâne": { partsMin: 80, partsMax: 300, laborMin: 50, laborMax: 200, timeHours: "1-2" },
      };
      const repairLower = repair.toLowerCase();
      for (const [key, est] of Object.entries(estimates)) {
        if (repairLower.includes(key)) {
          return { repair, ...est, totalMin: est.partsMin + est.laborMin, totalMax: est.partsMax + est.laborMax, currency: "EUR", note: "Estimare orientativă - prețurile variază în funcție de marca și modelul vehiculului" };
        }
      }
      return { repair, note: "Nu am o estimare exactă pentru această reparație. Recomand consultarea unui deviz specific.", currency: "EUR" };
    },
  }),

  lookupPartNumber: tool({
    description: "Look up OEM part numbers for common automotive parts",
    inputSchema: z.object({
      part: z.string().describe("The part to look up"),
      brand: z.string().optional().describe("Vehicle brand for specific part numbers"),
    }),
    execute: async ({ part, brand }) => {
      return { part, brand: brand || "Generic", note: "Consultă catalogul ETKA/TecDoc pentru numere exacte de piese specifice vehiculului tău. Numerele OEM variază în funcție de motorizare și an fabricație." };
    },
  }),
};

const MECHANIC_SYSTEM_PROMPT = `Ești un asistent AI expert în diagnostic auto, creat special pentru mecanici profesioniști.

ROLUL TĂU:
- Ajuți mecanicii să diagnosticheze probleme auto
- Explici coduri de eroare OBD-II și manufacturer-specific
- Propui proceduri de diagnostic pas-cu-pas
- Identifici cauze probabile bazat pe simptome
- Recomanzi piese de schimb cu coduri OEM când posibil
- Estimezi costuri și timp de reparație

REGULI:
1. Răspunde ÎNTOTDEAUNA în limba română
2. Folosește terminologie tehnică auto corectă
3. Dă răspunsuri structurate cu pași clari
4. Menționează ÎNTOTDEAUNA gradul de urgență (scăzut/mediu/ridicat/critic)
5. Când nu ești sigur, spune clar și recomandă investigație suplimentară
6. Folosește tools-urile disponibile pentru decodare coduri, estimare costuri și căutare piese
7. Prioritizează siguranța - menționează riscurile dacă reparația nu se face la timp

STIL:
- Profesional dar accesibil
- Structurat cu bullet points și pași numerotați
- Include mereu "Următorii pași recomandați" la final
- Menționează unelte necesare pentru diagnostic/reparație`;

/**
 * Registers the /api/chat endpoint for streaming AI responses.
 */
export function registerChatRoutes(app: Express) {
  const openai = createLLMProvider();

  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, diagnosticContext } = req.body;

      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: "messages array is required" });
        return;
      }

      // Build context-aware system prompt
      let systemPrompt = MECHANIC_SYSTEM_PROMPT;

      if (diagnosticContext) {
        systemPrompt += `\n\nCONTEXT DIAGNOSTIC ACTUAL:`;
        if (diagnosticContext.vehicle) {
          systemPrompt += `\nVehicul: ${diagnosticContext.vehicle.brand} ${diagnosticContext.vehicle.model} ${diagnosticContext.vehicle.year}`;
          if (diagnosticContext.vehicle.engine) systemPrompt += ` | Motor: ${diagnosticContext.vehicle.engine}`;
          if (diagnosticContext.vehicle.mileage) systemPrompt += ` | Km: ${diagnosticContext.vehicle.mileage}`;
          if (diagnosticContext.vehicle.vin) systemPrompt += ` | VIN: ${diagnosticContext.vehicle.vin}`;
        }
        if (diagnosticContext.symptoms) {
          systemPrompt += `\nSimptome raportate: ${diagnosticContext.symptoms}`;
        }
        if (diagnosticContext.errorCodes?.length) {
          systemPrompt += `\nCoduri eroare: ${diagnosticContext.errorCodes.join(", ")}`;
        }
        if (diagnosticContext.probableCauses?.length) {
          systemPrompt += `\nCauze probabile identificate:`;
          diagnosticContext.probableCauses.forEach((c: any) => {
            systemPrompt += `\n  - ${c.cause} (${c.probability}% probabilitate)`;
          });
        }
        if (diagnosticContext.accuracy) {
          systemPrompt += `\nAcuratețe diagnostic: ${diagnosticContext.accuracy}%`;
        }
        systemPrompt += `\n\nFolosește acest context pentru a da răspunsuri mai precise și relevante.`;
      }

      const result = streamText({
        model: openai.chat("gpt-4o"),
        system: systemPrompt,
        messages,
        tools,
        stopWhen: stepCountIs(5),
      });

      result.pipeUIMessageStreamToResponse(res);
    } catch (error) {
      console.error("[/api/chat] Error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });
}

export { tools };
