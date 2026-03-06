/**
 * STAGE B: STRICT EXTRACTOR WITH ANCHORING
 * 
 * Extracts diagnostic records ONLY from anchored evidence in text.
 * REJECTS if any required field is missing or not anchored.
 * NO fabrication, NO paraphrasing, NO template steps.
 */

interface EvidenceSnippet {
  snippet: string;
  start: number;
  end: number;
}

interface ExtractedRecord {
  vehicle: {
    make?: string;
    model?: string;
    year?: number;
    engine?: string;
  };
  error_code: {
    code: string;
    system?: string;
    description?: string;
  };
  related_codes: string[];
  symptoms: Array<{ text: string; evidence: EvidenceSnippet }>;
  repair_procedures: Array<{ step: number; action: string; evidence: EvidenceSnippet }>;
  tools_required: string[];
  torque_specs: Array<{ component: string; value: number; unit: string; evidence: EvidenceSnippet }>;
  repair_outcome: 'success' | 'fail' | 'unknown';
  confidence: number;
  source_url: string;
  source_domain: string;
  raw_source_id: string;
  text_sha256: string;
}

interface ExtractionResult {
  status: 'ACCEPT' | 'REJECT';
  record?: ExtractedRecord;
  reason?: string;
}

export class StageBStrictExtractor {
  // Regex patterns
  private readonly DTC_REGEX = /\b([PUBC][0-3][0-9A-F]{3})\b/g;
  private readonly YEAR_REGEX = /\b(19[89]\d|20[0-3]\d)\b/;
  private readonly ENGINE_REGEX = /\b(\d\.\d)\s?(L|l)\b/;
  private readonly TORQUE_NM_REGEX = /\b(\d{1,3})\s?(N\.?m|Nm|NEWTON\s?METER(S)?)\b/i;
  private readonly TORQUE_FTLB_REGEX = /\b(\d{1,3})\s?(ft[- ]?lb|lb[- ]?ft|foot[- ]?pound(s)?)\b/i;

  // Known vehicle makes
  private readonly VEHICLE_MAKES = [
    'BMW', 'Mercedes', 'Audi', 'Volkswagen', 'Porsche', 'Volvo', 'Jaguar', 'Range Rover',
    'Toyota', 'Honda', 'Nissan', 'Mazda', 'Subaru', 'Mitsubishi', 'Daihatsu', 'Lexus', 'Acura', 'Infiniti',
    'Ford', 'Chevrolet', 'GMC', 'Dodge', 'Ram', 'Jeep', 'Cadillac', 'Buick', 'Pontiac', 'Saturn',
    'Chrysler', 'Hyundai', 'Kia', 'Daewoo', 'Genesis',
    'Fiat', 'Alfa Romeo', 'Lancia', 'Ferrari', 'Lamborghini', 'Maserati',
    'Renault', 'Peugeot', 'Citroen', 'Seat', 'Skoda',
    'Rolls Royce', 'Bentley', 'Aston Martin', 'Lotus',
    'Tesla', 'Rivian', 'Lucid'
  ];

  // Action verbs for repair steps
  private readonly ACTION_VERBS = [
    'inspect', 'check', 'test', 'measure', 'replace', 'clean', 'tighten', 'reseat',
    'reset', 'recalibrate', 'smoke test', 'diagnose', 'verify', 'seal', 'repair',
    'reconnect', 'update', 'reflash', 'remove', 'install', 'disconnect', 'reconnect'
  ];

  // Tool keywords
  private readonly TOOL_KEYWORDS = [
    'OBD', 'scanner', 'scan tool', 'VCDS', 'ISTA', 'Techstream', 'multimeter', 'DMM',
    'torque wrench', 'compression tester', 'smoke test', 'fuel pressure gauge',
    'vacuum pump', 'oscilloscope', 'code reader', 'jack stands'
  ];

  // Ban template steps
  private readonly BANNED_STEPS = [
    'scan obd', 'replace component', 'consult manual', 'take to mechanic',
    'see manual', 'follow procedure', 'do repair'
  ];

  // Symptom keywords
  private readonly SYMPTOM_KEYWORDS = [
    'symptom', 'issue', 'problem', 'happens when', 'I get', 'car does', 'CEL', 'MIL',
    'rough', 'stall', 'misfire', 'no start', 'hesitation', 'error', 'fault'
  ];

  /**
   * Extract record from raw text with strict anchoring
   */
  async extractRecord(
    extractedText: string,
    sourceUrl: string,
    sourceDomain: string,
    rawSourceId: string,
    textSha256: string
  ): Promise<ExtractionResult> {
    try {
      // 1. Extract error code (REQUIRED)
      const errorCodeResult = this.extractErrorCode(extractedText);
      if (!errorCodeResult) {
        return { status: 'REJECT', reason: 'No valid error code found' };
      }

      // 2. Extract vehicle (REQUIRED unless DTC database)
      const vehicleResult = this.extractVehicle(extractedText);
      if (!vehicleResult.make) {
        return { status: 'REJECT', reason: 'Vehicle make not found' };
      }

      // 3. Extract symptoms (REQUIRED: >=2)
      const symptoms = this.extractSymptoms(extractedText);
      if (symptoms.length < 2) {
        return { status: 'REJECT', reason: `Only ${symptoms.length} symptoms found (need >=2)` };
      }

      // 4. Extract repair procedures (REQUIRED: >=3)
      const repairProcedures = this.extractRepairProcedures(extractedText);
      if (repairProcedures.length < 3) {
        return { status: 'REJECT', reason: `Only ${repairProcedures.length} repair steps found (need >=3)` };
      }

      // 5. Extract tools (optional)
      const tools = this.extractTools(extractedText);

      // 6. Extract torque specs (optional)
      const torqueSpecs = this.extractTorqueSpecs(extractedText);

      // 7. Detect repair outcome
      const repairOutcome = this.detectRepairOutcome(extractedText);

      // 8. Calculate confidence
      const confidence = this.calculateConfidence(
        symptoms,
        repairProcedures,
        torqueSpecs,
        repairOutcome,
        extractedText
      );

      // Build record
      const record: ExtractedRecord = {
        vehicle: vehicleResult,
        error_code: errorCodeResult.primary,
        related_codes: errorCodeResult.related,
        symptoms: symptoms.map(s => ({ text: s.text, evidence: s.evidence })),
        repair_procedures: repairProcedures,
        tools_required: tools,
        torque_specs: torqueSpecs,
        repair_outcome: repairOutcome,
        confidence,
        source_url: sourceUrl,
        source_domain: sourceDomain,
        raw_source_id: rawSourceId,
        text_sha256: textSha256
      };

      // Verify all evidence snippets are valid
      if (!this.verifyAllEvidenceSnippets(record, extractedText)) {
        return { status: 'REJECT', reason: 'Evidence snippet verification failed' };
      }

      return { status: 'ACCEPT', record };
    } catch (error: any) {
      return { status: 'REJECT', reason: `Extraction error: ${error.message}` };
    }
  }

  /**
   * Extract error code with anchoring
   */
  private extractErrorCode(text: string): { primary: any; related: string[] } | null {
    const matches = [...text.matchAll(this.DTC_REGEX)];
    if (matches.length === 0) return null;

    const codes = matches.map(m => m[1]);
    const uniqueCodes = [...new Set(codes)];

    // Primary code is the most frequent
    const primaryCode = uniqueCodes[0];

    return {
      primary: {
        code: primaryCode,
        system: this.getCodeSystem(primaryCode),
        description: this.getCodeDescription(primaryCode)
      },
      related: uniqueCodes.slice(1)
    };
  }

  /**
   * Extract vehicle make and model
   */
  private extractVehicle(text: string): { make?: string; model?: string; year?: number; engine?: string } {
    const result: any = {};

    // Find vehicle make
    for (const make of this.VEHICLE_MAKES) {
      if (text.toLowerCase().includes(make.toLowerCase())) {
        result.make = make;
        
        // Find model near make
        const makeIndex = text.toLowerCase().indexOf(make.toLowerCase());
        const window = text.substring(makeIndex, makeIndex + 100);
        
        // Extract model (next word or phrase)
        const modelMatch = window.match(/\b([A-Z][a-zA-Z0-9\-\s]{2,20})\b/);
        if (modelMatch && modelMatch[1] !== make) {
          result.model = modelMatch[1].trim();
        }
        break;
      }
    }

    // Extract year
    const yearMatch = text.match(this.YEAR_REGEX);
    if (yearMatch) {
      result.year = parseInt(yearMatch[1]);
    }

    // Extract engine
    const engineMatch = text.match(this.ENGINE_REGEX);
    if (engineMatch) {
      result.engine = `${engineMatch[1]}${engineMatch[2]}`;
    }

    return result;
  }

  /**
   * Extract symptoms with anchoring
   */
  private extractSymptoms(text: string): Array<{ text: string; evidence: EvidenceSnippet }> {
    const symptoms: Array<{ text: string; evidence: EvidenceSnippet }> = [];

    // Find symptom sections
    for (const keyword of this.SYMPTOM_KEYWORDS) {
      const regex = new RegExp(`${keyword}[^.!?]*[.!?]`, 'gi');
      const matches = [...text.matchAll(regex)];

      for (const match of matches) {
        const symptomText = match[0].replace(/^[^:]*:\s*/, '').trim();
        
        if (symptomText.length > 10 && symptomText.length < 200) {
          symptoms.push({
            text: symptomText,
            evidence: {
              snippet: symptomText,
              start: match.index || 0,
              end: (match.index || 0) + match[0].length
            }
          });
        }
      }
    }

    // Deduplicate
    const uniqueSymptoms = new Map<string, any>();
    for (const symptom of symptoms) {
      if (!uniqueSymptoms.has(symptom.text.toLowerCase())) {
        uniqueSymptoms.set(symptom.text.toLowerCase(), symptom);
      }
    }

    return Array.from(uniqueSymptoms.values()).slice(0, 5);
  }

  /**
   * Extract repair procedures with anchoring
   */
  private extractRepairProcedures(text: string): Array<{ step: number; action: string; evidence: EvidenceSnippet }> {
    const procedures: Array<{ step: number; action: string; evidence: EvidenceSnippet }> = [];

    // Find action verbs
    for (const verb of this.ACTION_VERBS) {
      const regex = new RegExp(`${verb}[^.!?]*[.!?]`, 'gi');
      const matches = [...text.matchAll(regex)];

      for (const match of matches) {
        const actionText = match[0].trim();
        
        // Ban template steps
        let isBanned = false;
        for (const banned of this.BANNED_STEPS) {
          if (actionText.toLowerCase().includes(banned)) {
            isBanned = true;
            break;
          }
        }

        if (!isBanned && actionText.length > 15 && actionText.length < 300) {
          procedures.push({
            step: procedures.length + 1,
            action: actionText,
            evidence: {
              snippet: actionText,
              start: match.index || 0,
              end: (match.index || 0) + match[0].length
            }
          });
        }
      }
    }

    // Deduplicate
    const uniqueProcedures = new Map<string, any>();
    for (const proc of procedures) {
      if (!uniqueProcedures.has(proc.action.toLowerCase())) {
        uniqueProcedures.set(proc.action.toLowerCase(), proc);
      }
    }

    return Array.from(uniqueProcedures.values()).slice(0, 6).map((p, i) => ({ ...p, step: i + 1 }));
  }

  /**
   * Extract tools with anchoring
   */
  private extractTools(text: string): string[] {
    const tools: string[] = [];

    for (const tool of this.TOOL_KEYWORDS) {
      if (text.toLowerCase().includes(tool.toLowerCase())) {
        tools.push(tool);
      }
    }

    return [...new Set(tools)];
  }

  /**
   * Extract torque specifications with anchoring
   */
  private extractTorqueSpecs(text: string): Array<{ component: string; value: number; unit: string; evidence: EvidenceSnippet }> {
    const specs: Array<{ component: string; value: number; unit: string; evidence: EvidenceSnippet }> = [];

    // Find torque values
    const nmMatches = [...text.matchAll(this.TORQUE_NM_REGEX)];
    const ftlbMatches = [...text.matchAll(this.TORQUE_FTLB_REGEX)];

    for (const match of nmMatches) {
      const value = parseInt(match[1]);
      const context = text.substring(Math.max(0, (match.index || 0) - 60), (match.index || 0) + 60);
      
      // Extract component name
      const componentMatch = context.match(/\b([a-z\s]+)\s*(?:torque|Nm)/i);
      const component = componentMatch ? componentMatch[1].trim() : 'unknown';

      specs.push({
        component,
        value,
        unit: 'Nm',
        evidence: {
          snippet: match[0],
          start: match.index || 0,
          end: (match.index || 0) + match[0].length
        }
      });
    }

    return specs;
  }

  /**
   * Detect repair outcome
   */
  private detectRepairOutcome(text: string): 'success' | 'fail' | 'unknown' {
    const successKeywords = ['fixed', 'solved', 'working', 'resolved', 'success', 'works now'];
    const failKeywords = ['failed', 'didn\'t work', 'still broken', 'no luck'];

    for (const keyword of successKeywords) {
      if (text.toLowerCase().includes(keyword)) return 'success';
    }

    for (const keyword of failKeywords) {
      if (text.toLowerCase().includes(keyword)) return 'fail';
    }

    return 'unknown';
  }

  /**
   * Calculate confidence from signals
   */
  private calculateConfidence(
    symptoms: any[],
    procedures: any[],
    torqueSpecs: any[],
    outcome: string,
    text: string
  ): number {
    let confidence = 0.70;

    // +0.10 if repair outcome is success
    if (outcome === 'success') confidence += 0.10;

    // +0.05 if all three present
    if (symptoms.length >= 2 && procedures.length >= 3) confidence += 0.05;

    // +0.03 if measurements present
    if (torqueSpecs.length > 0) confidence += 0.03;

    // -0.10 if vague language
    if (/maybe|might|could|probably/i.test(text)) confidence -= 0.10;

    // Clamp to [0.70, 0.95]
    return Math.max(0.70, Math.min(0.95, confidence));
  }

  /**
   * Verify all evidence snippets are valid substrings
   */
  private verifyAllEvidenceSnippets(record: ExtractedRecord, text: string): boolean {
    const checkSnippet = (snippet: EvidenceSnippet): boolean => {
      const extracted = text.substring(snippet.start, snippet.end);
      return extracted === snippet.snippet;
    };

    for (const symptom of record.symptoms) {
      if (!checkSnippet(symptom.evidence)) return false;
    }

    for (const proc of record.repair_procedures) {
      if (!checkSnippet(proc.evidence)) return false;
    }

    for (const spec of record.torque_specs) {
      if (!checkSnippet(spec.evidence)) return false;
    }

    return true;
  }

  // Helper methods
  private getCodeSystem(code: string): string {
    if (code.startsWith('P')) return 'Powertrain';
    if (code.startsWith('U')) return 'Network';
    if (code.startsWith('B')) return 'Body';
    if (code.startsWith('C')) return 'Chassis';
    return 'Unknown';
  }

  private getCodeDescription(code: string): string {
    // Simplified mapping
    const descriptions: { [key: string]: string } = {
      'P0171': 'System Too Lean',
      'P0300': 'Random Misfire',
      'P0128': 'Coolant Thermostat',
      'P0420': 'Catalyst System Efficiency',
      'P0505': 'Idle Air Control'
    };
    return descriptions[code] || 'See diagnostic database';
  }
}

export default StageBStrictExtractor;
