/**
 * Kimi Vision Service
 * Extracts vehicle information from images using Kimi Vision API
 */

interface VisionExtractionResult {
  success: boolean;
  vin?: string;
  make?: string;
  model?: string;
  year?: number;
  licensePlate?: string;
  engineType?: string;
  confidence: number;
  extractedText?: string;
  error?: string;
}

class KimiVisionService {
  private forgeApiUrl: string;
  private forgeApiKey: string;

  constructor() {
    this.forgeApiUrl = process.env.BUILT_IN_FORGE_API_URL || "";
    this.forgeApiKey = process.env.BUILT_IN_FORGE_API_KEY || "";
  }

  /**
   * Extract vehicle information from image using Kimi Vision
   * Supports: registration certificates, license plates, VIN plates, vehicle photos
   */
  async extractVehicleInfo(imageUrl: string): Promise<VisionExtractionResult> {
    try {
      // Call Kimi Vision API with image
      const baseURL = this.forgeApiUrl.endsWith("/v1")
        ? this.forgeApiUrl
        : `${this.forgeApiUrl}/v1`;

      const response = await fetch(`${baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.forgeApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4-vision",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: { url: imageUrl },
                },
                {
                  type: "text",
                  text: `Extract vehicle information from this image. Look for:
1. VIN (Vehicle Identification Number) - usually 17 characters
2. Vehicle make and model
3. Year of manufacture
4. License plate number
5. Engine type or displacement
6. Any other visible vehicle identifiers

Return the information in JSON format with fields: vin, make, model, year, licensePlate, engineType, confidence (0-1).
If you cannot find a field, set it to null.`,
                },
              ],
            },
          ],
          max_tokens: 1024,
        }),
      });

      const data = (await response.json()) as any;
      const text = data.choices?.[0]?.message?.content || "";

      // Parse response
      const extracted = this.parseVisionResponse(text);

      return {
        success: true,
        ...extracted,
        confidence: extracted.confidence || 0.85,
        extractedText: text,
      };
    } catch (error) {
      console.error("Kimi Vision extraction error:", error);
      return {
        success: false,
        confidence: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Extract VIN specifically from image
   */
  async extractVIN(imageUrl: string): Promise<string | null> {
    try {
      const baseURL = this.forgeApiUrl.endsWith("/v1")
        ? this.forgeApiUrl
        : `${this.forgeApiUrl}/v1`;

      const response = await fetch(`${baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.forgeApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4-vision",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: { url: imageUrl },
                },
                {
                  type: "text",
                  text: `Find and extract the VIN (Vehicle Identification Number) from this image.
The VIN is a 17-character code that usually appears on:
- Registration documents
- VIN plate (usually on dashboard or door frame)
- Insurance documents

Return ONLY the 17-character VIN code, nothing else.
If you cannot find a VIN, respond with "NOT_FOUND".`,
                },
              ],
            },
          ],
          max_tokens: 100,
        }),
      });

      const data = (await response.json()) as any;
      const text = data.choices?.[0]?.message?.content || "";

      const vin = text.trim().toUpperCase();

      // Validate VIN format (17 characters, alphanumeric)
      if (vin !== "NOT_FOUND" && /^[A-Z0-9]{17}$/.test(vin)) {
        return vin;
      }

      return null;
    } catch (error) {
      console.error("VIN extraction error:", error);
      return null;
    }
  }

  /**
   * Extract license plate from image
   */
  async extractLicensePlate(imageUrl: string): Promise<string | null> {
    try {
      const baseURL = this.forgeApiUrl.endsWith("/v1")
        ? this.forgeApiUrl
        : `${this.forgeApiUrl}/v1`;

      const response = await fetch(`${baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.forgeApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4-vision",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: { url: imageUrl },
                },
                {
                  type: "text",
                  text: `Extract the license plate number from this image.
Return ONLY the license plate text, nothing else.
If you cannot find a license plate, respond with "NOT_FOUND".`,
                },
              ],
            },
          ],
          max_tokens: 100,
        }),
      });

      const data = (await response.json()) as any;
      const text = data.choices?.[0]?.message?.content || "";

      const plate = text.trim().toUpperCase();
      return plate !== "NOT_FOUND" ? plate : null;
    } catch (error) {
      console.error("License plate extraction error:", error);
      return null;
    }
  }

  /**
   * Parse Kimi Vision response and extract structured data
   */
  private parseVisionResponse(
    text: string
  ): Partial<VisionExtractionResult> {
    try {
      // Try to parse as JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as any;
        return {
          vin: parsed.vin || parsed.VIN,
          make: parsed.make || parsed.manufacturer,
          model: parsed.model,
          year: parsed.year ? parseInt(parsed.year) : undefined,
          licensePlate: parsed.licensePlate || parsed.plate,
          engineType: parsed.engineType || parsed.engine,
          confidence: parsed.confidence || 0.85,
        };
      }

      // Fallback: extract using regex patterns
      const result: Partial<VisionExtractionResult> = {};

      // Extract VIN (17 alphanumeric characters)
      const vinMatch = text.match(/\b[A-Z0-9]{17}\b/);
      if (vinMatch) result.vin = vinMatch[0];

      // Extract year (4 digits, 1900-2099)
      const yearMatch = text.match(/\b(19|20)\d{2}\b/);
      if (yearMatch) result.year = parseInt(yearMatch[0]);

      // Extract license plate (common formats)
      const plateMatch = text.match(/[A-Z]{2,3}[\s-]?\d{3,4}[\s-]?[A-Z]{2,3}/i);
      if (plateMatch) result.licensePlate = plateMatch[0];

      result.confidence = 0.65;

      return result;
    } catch (error) {
      console.error("Parse vision response error:", error);
      return { confidence: 0 };
    }
  }

  /**
   * Batch extract vehicle info from multiple images
   */
  async extractBatch(
    imageUrls: string[]
  ): Promise<VisionExtractionResult[]> {
    return Promise.all(imageUrls.map((url) => this.extractVehicleInfo(url)));
  }
}

export const kimiVisionService = new KimiVisionService();
export type { VisionExtractionResult };
