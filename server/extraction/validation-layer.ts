/**
 * VALIDATION LAYER - Phase 0
 * Strict validation rules for production-grade extraction
 * 
 * Reject records immediately if:
 * - vehicle_make == "Unknown"
 * - vehicle_model == "Unknown"
 * - error_code == "P0000"
 * - symptoms < 2
 * - repair_steps < 3
 * - source_url missing
 * - evidence_snippets missing
 */

export interface ValidationError {
  field: string;
  message: string;
  severity: 'critical' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  score: number; // 0-100
}

export interface ExtractedRecord {
  vehicle: {
    make: string;
    model: string;
    year?: number;
    engine?: string;
    engine_code?: string;
  };
  error_code: {
    code: string;
    system?: string;
    description?: string;
  };
  symptoms: string[];
  repair_procedures: Array<{
    step: number;
    action: string;
  }>;
  tools_required: string[];
  torque_specs?: Array<{
    component: string;
    value_nm?: number;
  }>;
  repair_action?: string;
  repair_outcome?: 'success' | 'fail' | 'unknown';
  confidence: number;
  source_url: string;
  source_domain: string;
  evidence_snippets: Array<{
    field: string;
    snippet: string;
  }>;
}

/**
 * VALIDATION RULES
 */

const VALIDATION_RULES = {
  // Critical rules - record must be rejected if violated
  critical: {
    vehicleMakeNotUnknown: (record: ExtractedRecord) => {
      if (record.vehicle.make === 'Unknown' || record.vehicle.make === '') {
        return {
          field: 'vehicle.make',
          message: 'Vehicle make cannot be "Unknown" or empty',
          severity: 'critical' as const
        };
      }
      return null;
    },

    vehicleModelNotUnknown: (record: ExtractedRecord) => {
      if (record.vehicle.model === 'Unknown' || record.vehicle.model === '') {
        return {
          field: 'vehicle.model',
          message: 'Vehicle model cannot be "Unknown" or empty',
          severity: 'critical' as const
        };
      }
      return null;
    },

    errorCodeNotP0000: (record: ExtractedRecord) => {
      if (record.error_code.code === 'P0000' || record.error_code.code === '') {
        return {
          field: 'error_code.code',
          message: 'Error code cannot be "P0000" or empty (must be real diagnostic code)',
          severity: 'critical' as const
        };
      }
      return null;
    },

    symptomsMinimum: (record: ExtractedRecord) => {
      if (!record.symptoms || record.symptoms.length < 2) {
        return {
          field: 'symptoms',
          message: `Minimum 2 symptoms required (found ${record.symptoms?.length || 0})`,
          severity: 'critical' as const
        };
      }
      return null;
    },

    repairStepsMinimum: (record: ExtractedRecord) => {
      if (!record.repair_procedures || record.repair_procedures.length < 3) {
        return {
          field: 'repair_procedures',
          message: `Minimum 3 repair steps required (found ${record.repair_procedures?.length || 0})`,
          severity: 'critical' as const
        };
      }
      return null;
    },

    sourceUrlRequired: (record: ExtractedRecord) => {
      if (!record.source_url || record.source_url === '') {
        return {
          field: 'source_url',
          message: 'Source URL is required',
          severity: 'critical' as const
        };
      }
      return null;
    },

    evidenceSnippetsRequired: (record: ExtractedRecord) => {
      if (!record.evidence_snippets || record.evidence_snippets.length === 0) {
        return {
          field: 'evidence_snippets',
          message: 'At least one evidence snippet is required',
          severity: 'critical' as const
        };
      }
      return null;
    },

    confidenceInRange: (record: ExtractedRecord) => {
      if (record.confidence < 0.70 || record.confidence > 0.95) {
        return {
          field: 'confidence',
          message: `Confidence must be between 0.70-0.95 (found ${record.confidence})`,
          severity: 'critical' as const
        };
      }
      return null;
    }
  },

  // Warning rules - record can pass but should be noted
  warnings: {
    torqueSpecsPreferred: (record: ExtractedRecord) => {
      if (!record.torque_specs || record.torque_specs.length === 0) {
        return {
          field: 'torque_specs',
          message: 'Torque specifications are preferred but not required',
          severity: 'warning' as const
        };
      }
      return null;
    },

    repairOutcomePreferred: (record: ExtractedRecord) => {
      if (!record.repair_outcome || record.repair_outcome === 'unknown') {
        return {
          field: 'repair_outcome',
          message: 'Repair outcome should be "success" or "fail" for better quality',
          severity: 'warning' as const
        };
      }
      return null;
    },

    toolsPreferred: (record: ExtractedRecord) => {
      if (!record.tools_required || record.tools_required.length === 0) {
        return {
          field: 'tools_required',
          message: 'Tools required are preferred but not required',
          severity: 'warning' as const
        };
      }
      return null;
    },

    vehicleYearPreferred: (record: ExtractedRecord) => {
      if (!record.vehicle.year) {
        return {
          field: 'vehicle.year',
          message: 'Vehicle year is preferred for better context',
          severity: 'warning' as const
        };
      }
      return null;
    }
  }
};

/**
 * PLACEHOLDER DETECTION
 */

const PLACEHOLDER_PATTERNS = [
  /^unknown$/i,
  /^n\/a$/i,
  /^not specified$/i,
  /^see manual$/i,
  /^consult mechanic$/i,
  /^fix problem$/i,
  /^generic/i,
  /^placeholder/i,
  /^test/i,
  /^example/i
];

function isPlaceholderText(text: string): boolean {
  if (!text) return true;
  return PLACEHOLDER_PATTERNS.some(pattern => pattern.test(text));
}

function detectPlaceholders(record: ExtractedRecord): ValidationError[] {
  const errors: ValidationError[] = [];

  if (isPlaceholderText(record.vehicle.make)) {
    errors.push({
      field: 'vehicle.make',
      message: `Placeholder text detected: "${record.vehicle.make}"`,
      severity: 'critical'
    });
  }

  if (isPlaceholderText(record.vehicle.model)) {
    errors.push({
      field: 'vehicle.model',
      message: `Placeholder text detected: "${record.vehicle.model}"`,
      severity: 'critical'
    });
  }

  if (isPlaceholderText(record.error_code.code)) {
    errors.push({
      field: 'error_code.code',
      message: `Placeholder text detected: "${record.error_code.code}"`,
      severity: 'critical'
    });
  }

  record.symptoms?.forEach((symptom, idx) => {
    if (isPlaceholderText(symptom)) {
      errors.push({
        field: `symptoms[${idx}]`,
        message: `Placeholder text detected: "${symptom}"`,
        severity: 'critical'
      });
    }
  });

  record.repair_procedures?.forEach((proc, idx) => {
    if (isPlaceholderText(proc.action)) {
      errors.push({
        field: `repair_procedures[${idx}].action`,
        message: `Placeholder text detected: "${proc.action}"`,
        severity: 'critical'
      });
    }
  });

  return errors;
}

/**
 * ERROR CODE VALIDATION
 */

const VALID_ERROR_CODE_PATTERNS = [
  /^P[0-3]\d{3}$/,  // P0000-P3999
  /^U[0-3]\d{3}$/,  // U0000-U3999
  /^B[0-3]\d{3}$/,  // B0000-B3999
  /^C[0-3]\d{3}$/   // C0000-C3999
];

function isValidErrorCode(code: string): boolean {
  return VALID_ERROR_CODE_PATTERNS.some(pattern => pattern.test(code));
}

/**
 * CONFIDENCE SCORING
 */

function calculateConfidenceScore(record: ExtractedRecord): number {
  let score = 0.70; // Base score

  // Vehicle information
  if (record.vehicle.make && record.vehicle.make !== 'Unknown') score += 0.05;
  if (record.vehicle.model && record.vehicle.model !== 'Unknown') score += 0.05;
  if (record.vehicle.year && record.vehicle.year > 1990 && record.vehicle.year < 2030) score += 0.03;
  if (record.vehicle.engine && record.vehicle.engine !== 'Unknown') score += 0.02;

  // Symptoms
  if (record.symptoms?.length >= 2) score += 0.05;
  if (record.symptoms?.length >= 4) score += 0.03;

  // Repair procedures
  if (record.repair_procedures?.length >= 3) score += 0.05;
  if (record.repair_procedures?.length >= 5) score += 0.03;

  // Tools
  if (record.tools_required?.length >= 1) score += 0.03;
  if (record.tools_required?.length >= 3) score += 0.02;

  // Torque specs
  if (record.torque_specs?.length > 0) score += 0.05;

  // Evidence
  if (record.evidence_snippets?.length >= 1) score += 0.05;
  if (record.evidence_snippets?.length >= 3) score += 0.03;

  // Repair outcome
  if (record.repair_outcome === 'success' || record.repair_outcome === 'fail') score += 0.05;

  // Source quality
  if (record.source_domain?.includes('manual') || record.source_domain?.includes('obd')) score += 0.05;
  if (record.source_domain?.includes('forum') || record.source_domain?.includes('reddit')) score += 0.02;

  // Cap at 0.95
  return Math.min(0.95, Math.max(0.70, score));
}

/**
 * MAIN VALIDATION FUNCTION
 */

export function validateRecord(record: ExtractedRecord): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Check for placeholder text first
  const placeholderErrors = detectPlaceholders(record);
  errors.push(...placeholderErrors);

  // Run critical validation rules
  for (const [ruleName, rule] of Object.entries(VALIDATION_RULES.critical)) {
    const error = rule(record);
    if (error) {
      errors.push(error);
    }
  }

  // Validate error code format
  if (!isValidErrorCode(record.error_code.code)) {
    errors.push({
      field: 'error_code.code',
      message: `Invalid error code format: "${record.error_code.code}" (must match P/U/B/CXXXX)`,
      severity: 'critical'
    });
  }

  // Run warning validation rules (only if no critical errors)
  if (errors.length === 0) {
    for (const [ruleName, rule] of Object.entries(VALIDATION_RULES.warnings)) {
      const warning = rule(record);
      if (warning) {
        warnings.push(warning);
      }
    }
  }

  // Calculate confidence score
  const calculatedConfidence = calculateConfidenceScore(record);
  
  // If confidence was not provided or is uniform, use calculated score
  if (!record.confidence || record.confidence === 0.85) {
    record.confidence = calculatedConfidence;
  }

  // Calculate quality score
  const score = Math.max(0, 100 - errors.length * 20 - warnings.length * 5);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    score: Math.min(100, Math.max(0, score))
  };
}

/**
 * BATCH VALIDATION
 */

export interface BatchValidationResult {
  total: number;
  valid: number;
  invalid: number;
  validRecords: ExtractedRecord[];
  invalidRecords: Array<{
    record: ExtractedRecord;
    errors: ValidationError[];
  }>;
  avgConfidence: number;
  avgScore: number;
  validationPassRate: number;
}

export function validateBatch(records: ExtractedRecord[]): BatchValidationResult {
  const validRecords: ExtractedRecord[] = [];
  const invalidRecords: Array<{
    record: ExtractedRecord;
    errors: ValidationError[];
  }> = [];

  let totalConfidence = 0;
  let totalScore = 0;

  for (const record of records) {
    const result = validateRecord(record);
    totalConfidence += record.confidence;
    totalScore += result.score;

    if (result.isValid) {
      validRecords.push(record);
    } else {
      invalidRecords.push({
        record,
        errors: result.errors
      });
    }
  }

  const avgConfidence = records.length > 0 ? totalConfidence / records.length : 0;
  const avgScore = records.length > 0 ? totalScore / records.length : 0;
  const validationPassRate = records.length > 0 ? (validRecords.length / records.length) * 100 : 0;

  return {
    total: records.length,
    valid: validRecords.length,
    invalid: invalidRecords.length,
    validRecords,
    invalidRecords,
    avgConfidence: Math.round(avgConfidence * 100) / 100,
    avgScore: Math.round(avgScore),
    validationPassRate: Math.round(validationPassRate * 100) / 100
  };
}

/**
 * VALIDATION STATISTICS
 */

export interface ValidationStats {
  recordsValidated: number;
  recordsAccepted: number;
  recordsRejected: number;
  acceptanceRate: number;
  topRejectionReasons: Array<{
    reason: string;
    count: number;
  }>;
  avgConfidence: number;
  avgScore: number;
}

export function getValidationStats(result: BatchValidationResult): ValidationStats {
  const rejectionReasons = new Map<string, number>();

  for (const invalid of result.invalidRecords) {
    for (const error of invalid.errors) {
      const key = `${error.field}: ${error.message}`;
      rejectionReasons.set(key, (rejectionReasons.get(key) || 0) + 1);
    }
  }

  const topReasons = Array.from(rejectionReasons.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    recordsValidated: result.total,
    recordsAccepted: result.valid,
    recordsRejected: result.invalid,
    acceptanceRate: result.validationPassRate,
    topRejectionReasons: topReasons,
    avgConfidence: result.avgConfidence,
    avgScore: result.avgScore
  };
}
