/**
 * UNIFIED EXTRACTOR WITH ANCHORING
 * 
 * Extracts structured fields from raw text with evidence anchoring
 * - Vehicle information (make, model, year, engine, VIN, mileage)
 * - Symptoms (engine knocking, misfire, overheating, oil leak, etc.)
 * - Defects (engine damage, transmission problem, no start, etc.)
 * - Confidence scoring (0.70-0.95)
 */

export interface Evidence {
  snippet: string;
  start: number;
  end: number;
}

export interface ExtractedRecord {
  vehicle: {
    make?: string;
    model?: string;
    year?: number;
    engine?: string;
    vin?: string;
    mileage?: number;
  };
  symptoms: Array<{
    text: string;
    evidence: Evidence;
  }>;
  defects: Array<{
    type: string;
    evidence: Evidence;
  }>;
  raw_source_text: string;
  source_url: string;
  evidence_count: number;
  confidence: number;
  rejection_reason?: string;
}

export class UnifiedExtractor {
  // Vehicle makes
  private readonly VEHICLE_MAKES = [
    'BMW', 'Mercedes', 'Audi', 'Volkswagen', 'Toyota', 'Honda', 'Nissan', 'Ford',
    'Chevrolet', 'Dodge', 'Jeep', 'Volvo', 'Fiat', 'Peugeot', 'Renault', 'Citroën',
    'Hyundai', 'Kia', 'Mazda', 'Subaru', 'Lexus', 'Porsche', 'Ferrari', 'Lamborghini'
  ];

  // Symptom keywords
  private readonly SYMPTOM_KEYWORDS = [
    'rough idle', 'hesitation', 'check engine light', 'stalling', 'loss of power',
    'reduced fuel economy', 'no start', 'misfire', 'fluctuates', 'knocking',
    'overheating', 'oil leak', 'coolant leak', 'turbo failure', 'transmission slip',
    'timing chain noise', 'dpf problem', 'egr problem', 'gearbox slipping'
  ];

  // Defect keywords
  private readonly DEFECT_KEYWORDS = [
    'engine damage', 'transmission problem', 'no start', 'overheating', 'engine knocking',
    'turbo failure', 'oil leak', 'coolant leak', 'excessive emissions', 'brake imbalance',
    'suspension play', 'exhaust leak', 'steering problem', 'electrical fault', 'sensor failure'
  ];

  /**
   * Find snippet in text
   */
  private findSnippet(text: string, phrase: string): Evidence | null {
    const index = text.toLowerCase().indexOf(phrase.toLowerCase());
    if (index === -1) return null;

    return {
      snippet: text.substring(index, index + phrase.length),
      start: index,
      end: index + phrase.length
    };
  }

  /**
   * Extract vehicle information
   */
  private extractVehicle(text: string): ExtractedRecord['vehicle'] {
    const vehicle: ExtractedRecord['vehicle'] = {};

    // Extract make
    for (const make of this.VEHICLE_MAKES) {
      if (text.toLowerCase().includes(make.toLowerCase())) {
        vehicle.make = make;
        break;
      }
    }

    // Extract year (4-digit number between 1900-2100)
    const yearMatch = text.match(/\b(19\d{2}|20\d{2})\b/);
    if (yearMatch) {
      vehicle.year = parseInt(yearMatch[1]);
    }

    // Extract mileage (number followed by km or miles)
    const mileageMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:km|miles|mi)/i);
    if (mileageMatch) {
      vehicle.mileage = parseInt(mileageMatch[1].replace(/\./g, ''));
    }

    // Extract VIN (17-character alphanumeric)
    const vinMatch = text.match(/\b[A-HJ-NPR-Z0-9]{17}\b/);
    if (vinMatch) {
      vehicle.vin = vinMatch[0];
    }

    return vehicle;
  }

  /**
   * Extract symptoms with evidence
   */
  private extractSymptoms(text: string): Array<{ text: string; evidence: Evidence }> {
    const symptoms: Array<{ text: string; evidence: Evidence }> = [];

    for (const keyword of this.SYMPTOM_KEYWORDS) {
      const evidence = this.findSnippet(text, keyword);
      if (evidence) {
        symptoms.push({
          text: keyword,
          evidence
        });
      }
    }

    return symptoms;
  }

  /**
   * Extract defects with evidence
   */
  private extractDefects(text: string): Array<{ type: string; evidence: Evidence }> {
    const defects: Array<{ type: string; evidence: Evidence }> = [];

    for (const keyword of this.DEFECT_KEYWORDS) {
      const evidence = this.findSnippet(text, keyword);
      if (evidence) {
        defects.push({
          type: keyword,
          evidence
        });
      }
    }

    return defects;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(
    vehicle: ExtractedRecord['vehicle'],
    symptoms: Array<{ text: string; evidence: Evidence }>,
    defects: Array<{ type: string; evidence: Evidence }>
  ): number {
    let confidence = 0.70; // Base score

    // Vehicle make found
    if (vehicle.make) confidence += 0.05;

    // Year specified
    if (vehicle.year) confidence += 0.05;

    // VIN specified
    if (vehicle.vin) confidence += 0.05;

    // Multiple symptoms
    if (symptoms.length >= 2) confidence += 0.05;

    // Defects found
    if (defects.length > 0) confidence += 0.05;

    return Math.min(0.95, confidence);
  }

  /**
   * Extract record from raw text
   */
  extract(
    rawText: string,
    sourceUrl: string,
    rawSourceId: string
  ): ExtractedRecord {
    // Extract components
    const vehicle = this.extractVehicle(rawText);
    const symptoms = this.extractSymptoms(rawText);
    const defects = this.extractDefects(rawText);

    // Calculate confidence
    const confidence = this.calculateConfidence(vehicle, symptoms, defects);

    // Count evidence
    const evidenceCount = symptoms.length + defects.length;

    return {
      vehicle,
      symptoms,
      defects,
      raw_source_text: rawText,
      source_url: sourceUrl,
      evidence_count: evidenceCount,
      confidence,
      rejection_reason: this.validateRecord(vehicle, symptoms, defects)
    };
  }

  /**
   * Validate record
   */
  private validateRecord(
    vehicle: ExtractedRecord['vehicle'],
    symptoms: Array<{ text: string; evidence: Evidence }>,
    defects: Array<{ type: string; evidence: Evidence }>
  ): string | undefined {
    // Must have vehicle make
    if (!vehicle.make) {
      return 'Vehicle make not found';
    }

    // Must have symptoms OR defects
    if (symptoms.length === 0 && defects.length === 0) {
      return 'No symptoms or defects found';
    }

    // Minimum evidence
    if (symptoms.length + defects.length < 1) {
      return 'Insufficient evidence';
    }

    return undefined;
  }
}

export default UnifiedExtractor;
