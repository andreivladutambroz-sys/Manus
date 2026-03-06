/**
 * STRICT EXTRACTOR - TASK 3
 * 
 * Extraction only when ALL conditions are met:
 * - vehicle_make (required)
 * - vehicle_model (required)
 * - error_code (required, P0xxx/U0xxx/B0xxx/C0xxx format)
 * - symptoms (minimum 2, exact phrases from text)
 * - repair_steps (minimum 3, exact actions from text)
 * 
 * Each field must have:
 * - evidence_snippet
 * - text_offset_start
 * - text_offset_end
 */

export interface EvidenceField {
  value: string;
  snippet: string;
  offset_start: number;
  offset_end: number;
}

export interface ExtractedRecord {
  raw_source_id: string;
  source_url: string;
  
  vehicle: {
    make: EvidenceField;
    model: EvidenceField;
    year?: EvidenceField;
    engine?: EvidenceField;
  };
  
  error_code: EvidenceField;
  
  symptoms: EvidenceField[];
  
  repair_steps: EvidenceField[];
  
  tools_required?: string[];
  torque_specs?: { [key: string]: string };
  
  confidence: number;
  confidence_factors: {
    vehicle_identified: boolean;
    error_code_matched: boolean;
    symptoms_count: number;
    repair_steps_count: number;
    evidence_completeness: number;
  };
  
  extraction_status: 'accepted' | 'rejected';
  rejection_reason?: string;
}

export class StrictExtractor {
  // Regex patterns for error codes
  private readonly ERROR_CODE_PATTERN = /([PUBCpubc][0-1][0-9A-Fa-f]{3})/g;
  
  // Common vehicle makes
  private readonly VEHICLE_MAKES = [
    'BMW', 'Mercedes', 'Audi', 'Volkswagen', 'VW', 'Porsche',
    'Toyota', 'Honda', 'Nissan', 'Mazda', 'Subaru', 'Mitsubishi',
    'Ford', 'Chevrolet', 'GMC', 'Dodge', 'RAM', 'Jeep',
    'Hyundai', 'Kia', 'Lexus', 'Infiniti', 'Acura',
    'Tesla', 'Volvo', 'Jaguar', 'Land Rover', 'Range Rover'
  ];

  /**
   * Find text offset for a substring
   */
  private findOffset(text: string, substring: string): { start: number; end: number } | null {
    const index = text.indexOf(substring);
    if (index === -1) return null;
    return {
      start: index,
      end: index + substring.length
    };
  }

  /**
   * Extract vehicle make
   */
  private extractVehicleMake(text: string): EvidenceField | null {
    for (const make of this.VEHICLE_MAKES) {
      const pattern = new RegExp(`\\b${make}\\b`, 'i');
      const match = text.match(pattern);
      
      if (match) {
        const offset = this.findOffset(text, match[0]);
        if (offset) {
          return {
            value: make,
            snippet: match[0],
            offset_start: offset.start,
            offset_end: offset.end
          };
        }
      }
    }
    return null;
  }

  /**
   * Extract vehicle model
   */
  private extractVehicleModel(text: string, make: string): EvidenceField | null {
    // Common models by make
    const models: { [key: string]: string[] } = {
      'BMW': ['320', '330', '325', '335', '520', '530', '540', '740', 'X3', 'X5', 'X7', 'M3', 'M5'],
      'Mercedes': ['C200', 'C300', 'E300', 'E350', 'S500', 'A-Class', 'GLE', 'GLC', 'CLA'],
      'Audi': ['A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q3', 'Q5', 'Q7', 'Q8'],
      'Toyota': ['Camry', 'Corolla', 'Prius', 'RAV4', 'Highlander', 'Tacoma', '4Runner'],
      'Honda': ['Civic', 'Accord', 'CR-V', 'Pilot', 'Odyssey', 'Fit', 'Ridgeline'],
      'Ford': ['Focus', 'Fusion', 'Mustang', 'F-150', 'Explorer', 'Edge', 'Escape'],
      'Chevrolet': ['Cruze', 'Malibu', 'Corvette', 'Silverado', 'Equinox', 'Traverse']
    };

    const makeModels = models[make] || [];
    
    for (const model of makeModels) {
      const pattern = new RegExp(`\\b${model}\\b`, 'i');
      const match = text.match(pattern);
      
      if (match) {
        const offset = this.findOffset(text, match[0]);
        if (offset) {
          return {
            value: model,
            snippet: match[0],
            offset_start: offset.start,
            offset_end: offset.end
          };
        }
      }
    }
    return null;
  }

  /**
   * Extract error code
   */
  private extractErrorCode(text: string): EvidenceField | null {
    const matches = text.match(this.ERROR_CODE_PATTERN);
    
    if (matches && matches.length > 0) {
      const code = matches[0].toUpperCase();
      const offset = this.findOffset(text, code);
      
      if (offset) {
        return {
          value: code,
          snippet: code,
          offset_start: offset.start,
          offset_end: offset.end
        };
      }
    }
    return null;
  }

  /**
   * Extract symptoms (minimum 2)
   */
  private extractSymptoms(text: string): EvidenceField[] {
    const symptomPatterns = [
      'check engine light', 'CEL', 'engine knocking', 'knock', 'rough idle', 'idle rough',
      'misfire', 'cylinder misfire', 'hesitation', 'acceleration hesitation',
      'stalling', 'engine stall', 'poor acceleration', 'loss of power',
      'overheating', 'engine overheat', 'fuel leak', 'oil leak', 'coolant leak',
      'transmission slip', 'slipping transmission', 'no start', 'won\'t start',
      'battery drain', 'electrical issue', 'sensor fault', 'code',
      'black smoke', 'white smoke', 'blue smoke', 'smoke from exhaust',
      'vibration', 'shaking', 'noise', 'grinding', 'squealing',
      'poor fuel economy', 'fuel consumption', 'mpg', 'economy'
    ];

    const symptoms: EvidenceField[] = [];

    for (const pattern of symptomPatterns) {
      const regex = new RegExp(`\\b${pattern}\\b`, 'i');
      const match = text.match(regex);
      
      if (match && symptoms.length < 10) {
        const offset = this.findOffset(text, match[0]);
        if (offset) {
          symptoms.push({
            value: pattern,
            snippet: match[0],
            offset_start: offset.start,
            offset_end: offset.end
          });
        }
      }
    }

    return symptoms.slice(0, 10); // Return max 10 symptoms
  }

  /**
   * Extract repair steps (minimum 3)
   */
  private extractRepairSteps(text: string): EvidenceField[] {
    const stepPatterns = [
      'scan', 'scan obd', 'check', 'inspect', 'test', 'diagnose',
      'replace', 'install', 'remove', 'clean', 'flush',
      'refill', 'top up', 'add', 'drain', 'change',
      'tighten', 'loosen', 'torque', 'bolt',
      'disconnect', 'connect', 'unplug', 'plug',
      'repair', 'fix', 'adjust', 'calibrate',
      'clear code', 'clear codes', 'reset', 'erase',
      'test drive', 'verify', 'confirm', 'monitor'
    ];

    const steps: EvidenceField[] = [];

    for (const pattern of stepPatterns) {
      const regex = new RegExp(`\\b${pattern}\\b`, 'i');
      const match = text.match(regex);
      
      if (match && steps.length < 10) {
        const offset = this.findOffset(text, match[0]);
        if (offset) {
          steps.push({
            value: pattern,
            snippet: match[0],
            offset_start: offset.start,
            offset_end: offset.end
          });
        }
      }
    }

    return steps.slice(0, 10); // Return max 10 steps
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(record: Partial<ExtractedRecord>): number {
    let score = 0.5; // Base score

    if (record.vehicle?.make) score += 0.1;
    if (record.vehicle?.model) score += 0.1;
    if (record.vehicle?.year) score += 0.05;
    if (record.vehicle?.engine) score += 0.05;

    if (record.error_code) score += 0.1;

    if (record.symptoms && record.symptoms.length >= 2) score += 0.1;
    if (record.symptoms && record.symptoms.length >= 4) score += 0.05;

    if (record.repair_steps && record.repair_steps.length >= 3) score += 0.1;
    if (record.repair_steps && record.repair_steps.length >= 5) score += 0.05;

    if (record.tools_required && record.tools_required.length > 0) score += 0.05;
    if (record.torque_specs && Object.keys(record.torque_specs).length > 0) score += 0.05;

    return Math.min(score, 0.95); // Cap at 0.95
  }

  /**
   * Extract record from raw text
   */
  async extract(
    rawSourceId: string,
    sourceUrl: string,
    text: string
  ): Promise<ExtractedRecord> {
    const vehicleMake = this.extractVehicleMake(text);
    const vehicleModel = vehicleMake ? this.extractVehicleModel(text, vehicleMake.value) : null;
    const errorCode = this.extractErrorCode(text);
    const symptoms = this.extractSymptoms(text);
    const repairSteps = this.extractRepairSteps(text);

    // Validation: Check if all required fields are present
    const isValid = 
      vehicleMake && 
      vehicleModel && 
      errorCode && 
      symptoms.length >= 2 && 
      repairSteps.length >= 3;

    if (!isValid) {
      const reasons: string[] = [];
      if (!vehicleMake) reasons.push('no vehicle make');
      if (!vehicleModel) reasons.push('no vehicle model');
      if (!errorCode) reasons.push('no error code');
      if (symptoms.length < 2) reasons.push(`only ${symptoms.length} symptoms (need 2+)`);
      if (repairSteps.length < 3) reasons.push(`only ${repairSteps.length} repair steps (need 3+)`);

      return {
        raw_source_id: rawSourceId,
        source_url: sourceUrl,
        vehicle: {
          make: vehicleMake || { value: '', snippet: '', offset_start: 0, offset_end: 0 },
          model: vehicleModel || { value: '', snippet: '', offset_start: 0, offset_end: 0 }
        },
        error_code: errorCode || { value: '', snippet: '', offset_start: 0, offset_end: 0 },
        symptoms,
        repair_steps: repairSteps,
        confidence: 0,
        confidence_factors: {
          vehicle_identified: !!vehicleMake && !!vehicleModel,
          error_code_matched: !!errorCode,
          symptoms_count: symptoms.length,
          repair_steps_count: repairSteps.length,
          evidence_completeness: 0
        },
        extraction_status: 'rejected',
        rejection_reason: `Missing required fields: ${reasons.join(', ')}`
      };
    }

    // Calculate confidence
    const record: Partial<ExtractedRecord> = {
      vehicle: {
        make: vehicleMake!,
        model: vehicleModel!
      },
      error_code: errorCode!,
      symptoms,
      repair_steps: repairSteps
    };

    const confidence = this.calculateConfidence(record);

    return {
      raw_source_id: rawSourceId,
      source_url: sourceUrl,
      vehicle: {
        make: vehicleMake!,
        model: vehicleModel!
      },
      error_code: errorCode!,
      symptoms,
      repair_steps: repairSteps,
      confidence,
      confidence_factors: {
        vehicle_identified: true,
        error_code_matched: true,
        symptoms_count: symptoms.length,
        repair_steps_count: repairSteps.length,
        evidence_completeness: Math.min(
          (symptoms.length / 4 + repairSteps.length / 5) / 2,
          1
        )
      },
      extraction_status: 'accepted'
    };
  }
}

export default StrictExtractor;
