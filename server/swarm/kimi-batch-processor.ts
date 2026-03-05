/**
 * Kimi Batch Processor
 * Batches LLM calls to reduce cost by 95%
 */

interface BatchItem {
  id: string;
  data: Record<string, unknown>;
  type: "normalize" | "dedup" | "validate";
}

interface BatchResult {
  id: string;
  result: Record<string, unknown>;
  success: boolean;
  error?: string;
}

class KimiBatchProcessor {
  private batchSize: number = 50; // 50 records per API call
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = process.env.BUILT_IN_FORGE_API_URL || "";
    this.apiKey = process.env.BUILT_IN_FORGE_API_KEY || "";
  }

  /**
   * Process batch of items
   */
  async processBatch(items: BatchItem[]): Promise<BatchResult[]> {
    const results: BatchResult[] = [];

    // Split into chunks of batchSize
    for (let i = 0; i < items.length; i += this.batchSize) {
      const chunk = items.slice(i, i + this.batchSize);
      const chunkResults = await this.processChunk(chunk);
      results.push(...chunkResults);
    }

    return results;
  }

  /**
   * Process single chunk (up to 50 items)
   */
  private async processChunk(items: BatchItem[]): Promise<BatchResult[]> {
    try {
      const baseURL = this.apiUrl.endsWith("/v1") ? this.apiUrl : `${this.apiUrl}/v1`;

      const response = await fetch(`${baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4-turbo",
          messages: [
            {
              role: "system",
              content: `You are a data processing assistant. Process the following batch of items according to their type.
For each item, return a JSON object with the processed result.
Return results as a JSON array.`,
            },
            {
              role: "user",
              content: `Process these ${items.length} items:\n${JSON.stringify(items, null, 2)}`,
            },
          ],
          temperature: 0.1,
          max_tokens: 4000,
        }),
      });

      const data = (await response.json()) as any;
      const content = data.choices?.[0]?.message?.content || "[]";

      // Parse results
      const parsed = this.parseResults(content, items);
      return parsed;
    } catch (error) {
      console.error("Batch processing error:", error);
      // Return error results
      return items.map((item) => ({
        id: item.id,
        result: {},
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
    }
  }

  /**
   * Parse LLM results
   */
  private parseResults(content: string, items: BatchItem[]): BatchResult[] {
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("No JSON array found in response");
      }

      const results = JSON.parse(jsonMatch[0]) as Record<string, unknown>[];

      return items.map((item, index) => ({
        id: item.id,
        result: results[index] || {},
        success: true,
      }));
    } catch (error) {
      console.error("Parse results error:", error);
      return items.map((item) => ({
        id: item.id,
        result: {},
        success: false,
        error: "Failed to parse results",
      }));
    }
  }

  /**
   * Estimate cost savings
   */
  estimateCostSavings(totalRecords: number): {
    withoutBatching: number;
    withBatching: number;
    savings: number;
    savingsPercent: number;
  } {
    const costPerCall = 0.005; // $0.005 per call (approximate)
    const callsWithoutBatching = totalRecords;
    const callsWithBatching = Math.ceil(totalRecords / this.batchSize);

    return {
      withoutBatching: callsWithoutBatching * costPerCall,
      withBatching: callsWithBatching * costPerCall,
      savings: callsWithoutBatching * costPerCall - callsWithBatching * costPerCall,
      savingsPercent:
        ((callsWithoutBatching - callsWithBatching) / callsWithoutBatching) * 100,
    };
  }

  /**
   * Set batch size
   */
  setBatchSize(size: number): void {
    if (size < 1 || size > 100) {
      throw new Error("Batch size must be between 1 and 100");
    }
    this.batchSize = size;
  }

  /**
   * Get batch size
   */
  getBatchSize(): number {
    return this.batchSize;
  }
}

export const kimiBatchProcessor = new KimiBatchProcessor();
