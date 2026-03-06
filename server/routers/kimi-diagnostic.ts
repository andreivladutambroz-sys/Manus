import { router, publicProcedure, protectedProcedure } from '../_core/router';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

const KIMI_API_URL = process.env.BUILT_IN_FORGE_API_URL || 'https://api.manus.im';
const KIMI_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

interface KimiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface KimiResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export const kimiDiagnosticRouter = router({
  /**
   * Natural language diagnostic query
   * Example: "My BMW has rough idle and check engine light"
   */
  queryDiagnostic: publicProcedure
    .input(
      z.object({
        query: z.string().min(10).max(500),
        conversationHistory: z.array(z.object({
          role: z.enum(['user', 'assistant']),
          content: z.string()
        })).optional()
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        if (!KIMI_API_KEY) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Kimi API key not configured'
          });
        }

        // Build conversation history
        const messages: KimiMessage[] = [
          {
            role: 'system',
            content: `You are an expert automotive diagnostic assistant. Help users diagnose car problems based on symptoms they describe. 
            
When a user describes symptoms, you should:
1. Identify the vehicle make/model if mentioned
2. List the most likely error codes (P0xxx format)
3. Explain what each error code means
4. Suggest repair procedures
5. Recommend tools needed
6. Ask clarifying questions if needed

Format your response as JSON with this structure:
{
  "likely_codes": ["P0171", "P0300"],
  "code_descriptions": {
    "P0171": "System Too Lean (Bank 1)",
    "P0300": "Random/Multiple Cylinder Misfire"
  },
  "symptoms_identified": ["rough idle", "check engine light"],
  "repair_suggestions": [
    {
      "code": "P0171",
      "repair": "Check fuel pressure and replace fuel pump if needed",
      "tools": ["fuel pressure gauge", "fuel pump tool"],
      "difficulty": "moderate"
    }
  ],
  "next_questions": ["What year is your BMW?", "When did the problem start?"]
}`
          }
        ];

        // Add conversation history
        if (input.conversationHistory && input.conversationHistory.length > 0) {
          messages.push(...input.conversationHistory as KimiMessage[]);
        }

        // Add current query
        messages.push({
          role: 'user',
          content: input.query
        });

        // Call Kimi API
        const response = await fetch(`${KIMI_API_URL}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${KIMI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'kimi',
            messages: messages,
            temperature: 0.7,
            max_tokens: 1000
          })
        });

        if (!response.ok) {
          const error = await response.text();
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Kimi API error: ${error}`
          });
        }

        const data: KimiResponse = await response.json();
        const assistantMessage = data.choices[0]?.message?.content || '';

        // Parse JSON response
        let parsedResponse;
        try {
          const jsonMatch = assistantMessage.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedResponse = JSON.parse(jsonMatch[0]);
          } else {
            parsedResponse = {
              response: assistantMessage,
              likely_codes: [],
              repair_suggestions: [],
              next_questions: []
            };
          }
        } catch (e) {
          parsedResponse = {
            response: assistantMessage,
            likely_codes: [],
            repair_suggestions: [],
            next_questions: []
          };
        }

        return {
          success: true,
          response: assistantMessage,
          parsed: parsedResponse,
          tokens: {
            prompt: data.usage.prompt_tokens,
            completion: data.usage.completion_tokens,
            total: data.usage.total_tokens
          }
        };
      } catch (error) {
        console.error('Kimi diagnostic error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to query diagnostic'
        });
      }
    }),

  /**
   * Stream diagnostic response for real-time chat
   */
  streamDiagnostic: publicProcedure
    .input(
      z.object({
        query: z.string().min(10).max(500),
        conversationHistory: z.array(z.object({
          role: z.enum(['user', 'assistant']),
          content: z.string()
        })).optional()
      })
    )
    .mutation(async ({ input }) => {
      try {
        if (!KIMI_API_KEY) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Kimi API key not configured'
          });
        }

        const messages: KimiMessage[] = [
          {
            role: 'system',
            content: `You are an expert automotive diagnostic assistant. Help users diagnose car problems based on symptoms they describe.`
          }
        ];

        if (input.conversationHistory && input.conversationHistory.length > 0) {
          messages.push(...input.conversationHistory as KimiMessage[]);
        }

        messages.push({
          role: 'user',
          content: input.query
        });

        // Return stream URL for client-side streaming
        return {
          streamUrl: `${KIMI_API_URL}/v1/chat/completions`,
          payload: {
            model: 'kimi',
            messages: messages,
            temperature: 0.7,
            max_tokens: 1000,
            stream: true
          },
          headers: {
            'Authorization': `Bearer ${KIMI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to stream diagnostic'
        });
      }
    }),

  /**
   * Get diagnostic suggestions based on error code
   */
  getCodeSuggestions: publicProcedure
    .input(
      z.object({
        errorCode: z.string().regex(/^[PUB][0-9]{4}$/),
        vehicleMake: z.string().optional(),
        vehicleModel: z.string().optional()
      })
    )
    .query(async ({ input }) => {
      try {
        if (!KIMI_API_KEY) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Kimi API key not configured'
          });
        }

        const prompt = `Provide diagnostic information for error code ${input.errorCode}${
          input.vehicleMake ? ` on a ${input.vehicleMake} ${input.vehicleModel || ''}` : ''
        }. Include:
1. What the code means
2. Common causes
3. Typical symptoms
4. Recommended repairs
5. Tools needed
6. Estimated difficulty level

Format as JSON.`;

        const response = await fetch(`${KIMI_API_URL}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${KIMI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'kimi',
            messages: [
              {
                role: 'system',
                content: 'You are an automotive diagnostic expert. Provide detailed, accurate information about OBD-II error codes.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.5,
            max_tokens: 800
          })
        });

        if (!response.ok) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to get code suggestions'
          });
        }

        const data: KimiResponse = await response.json();
        const content = data.choices[0]?.message?.content || '';

        // Parse JSON from response
        let parsed;
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { response: content };
        } catch (e) {
          parsed = { response: content };
        }

        return {
          errorCode: input.errorCode,
          suggestions: parsed,
          tokens: data.usage.total_tokens
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get suggestions'
        });
      }
    })
});
