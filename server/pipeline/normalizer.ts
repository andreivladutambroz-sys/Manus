/**
 * NORMALIZATION & DEDUPLICATION ENGINE
 * 
 * Standardizes vehicle make/model/engine/symptoms
 * Removes duplicates using vehicle + symptom + source hash
 */

import crypto from 'crypto';

export interface NormalizedRecord {
  vehicle_make: string;
  vehicle_model?: string;
  vehicle_year?: number;
  engine?: string;
  symptoms: string[];
  defects: string[];
  canonical_key: string;
  source_url: string;
  confidence: number;
  raw_source_id: string;
}

export class Normalizer {
  // Symptom normalization map
  private readonly SYMPTOM_NORMALIZATION: { [key: string]: string } = {
    'check engine light': 'CEL',
    'engine knocking': 'knock',
    'gearbox slipping': 'transmission_slip',
    'timing chain noise': 'timing_chain',
    'dpf problem': 'DPF_issue',
    'egr problem': 'EGR_issue',
    'turbo failure': 'turbo_failure',
    'oil leak': 'oil_leak',
    'coolant leak': 'coolant_leak',
    'overheating': 'overheating',
    'misfire': 'misfire',
    'rough idle': 'rough_idle',
    'hesitation': 'hesitation',
    'loss of power': 'power_loss',
    'reduced fuel economy': 'fuel_economy_reduced',
    'no start': 'no_start',
    'stalling': 'stalling',
    'excessive emissions': 'emissions_high',
    'brake imbalance': 'brake_imbalance',
    'suspension play': 'suspension_play',
    'exhaust leak': 'exhaust_leak',
    'steering problem': 'steering_issue',
    'electrical fault': 'electrical_fault',
    'sensor failure': 'sensor_failure'
  };

  // Vehicle make normalization
  private readonly MAKE_NORMALIZATION: { [key: string]: string } = {
    'bmw': 'BMW',
    'mercedes': 'Mercedes',
    'mercedes-benz': 'Mercedes',
    'audi': 'Audi',
    'volkswagen': 'Volkswagen',
    'vw': 'Volkswagen',
    'toyota': 'Toyota',
    'honda': 'Honda',
    'nissan': 'Nissan',
    'ford': 'Ford',
    'chevrolet': 'Chevrolet',
    'chevy': 'Chevrolet',
    'dodge': 'Dodge',
    'jeep': 'Jeep',
    'volvo': 'Volvo',
    'fiat': 'Fiat',
    'peugeot': 'Peugeot',
    'renault': 'Renault',
    'citroën': 'Citroën',
    'hyundai': 'Hyundai',
    'kia': 'Kia',
    'mazda': 'Mazda',
    'subaru': 'Subaru',
    'lexus': 'Lexus',
    'porsche': 'Porsche',
    'ferrari': 'Ferrari',
    'lamborghini': 'Lamborghini'
  };

  /**
   * Normalize symptom
   */
  private normalizeSymptom(symptom: string): string {
    const lower = symptom.toLowerCase();
    return this.SYMPTOM_NORMALIZATION[lower] || lower.replace(/\s+/g, '_');
  }

  /**
   * Normalize vehicle make
   */
  private normalizeMake(make: string): string {
    const lower = make.toLowerCase();
    return this.MAKE_NORMALIZATION[lower] || make;
  }

  /**
   * Normalize vehicle model
   */
  private normalizeModel(model: string): string {
    return model
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_-]/g, '');
  }

  /**
   * Normalize engine
   */
  private normalizeEngine(engine: string): string {
    return engine
      .toUpperCase()
      .replace(/\s+/g, '_')
      .replace(/[^A-Z0-9_-]/g, '');
  }

  /**
   * Generate canonical key for deduplication
   */
  private generateCanonicalKey(
    make: string,
    model: string | undefined,
    year: number | undefined,
    engine: string | undefined,
    symptoms: string[]
  ): string {
    const parts = [
      this.normalizeMake(make),
      model ? this.normalizeModel(model) : 'unknown',
      year ? year.toString() : 'unknown',
      engine ? this.normalizeEngine(engine) : 'unknown',
      symptoms.map(s => this.normalizeSymptom(s)).sort().join('|')
    ];

    const combined = parts.join('::');
    return crypto.createHash('sha256').update(combined).digest('hex').substring(0, 16);
  }

  /**
   * Normalize record
   */
  normalize(
    vehicleMake: string,
    vehicleModel: string | undefined,
    vehicleYear: number | undefined,
    engine: string | undefined,
    symptoms: string[],
    defects: string[],
    sourceUrl: string,
    confidence: number,
    rawSourceId: string
  ): NormalizedRecord {
    const normalizedSymptoms = symptoms.map(s => this.normalizeSymptom(s));
    const normalizedDefects = defects.map(d => this.normalizeSymptom(d));

    const canonicalKey = this.generateCanonicalKey(
      vehicleMake,
      vehicleModel,
      vehicleYear,
      engine,
      normalizedSymptoms
    );

    return {
      vehicle_make: this.normalizeMake(vehicleMake),
      vehicle_model: vehicleModel ? this.normalizeModel(vehicleModel) : undefined,
      vehicle_year: vehicleYear,
      engine: engine ? this.normalizeEngine(engine) : undefined,
      symptoms: normalizedSymptoms,
      defects: normalizedDefects,
      canonical_key: canonicalKey,
      source_url: sourceUrl,
      confidence,
      raw_source_id: rawSourceId
    };
  }
}

export class Deduplicator {
  private seenKeys: Set<string> = new Set();
  private records: Map<string, NormalizedRecord> = new Map();

  /**
   * Check if record is duplicate
   */
  isDuplicate(canonicalKey: string): boolean {
    return this.seenKeys.has(canonicalKey);
  }

  /**
   * Add record
   */
  add(record: NormalizedRecord): boolean {
    if (this.isDuplicate(record.canonical_key)) {
      return false;
    }

    this.seenKeys.add(record.canonical_key);
    this.records.set(record.canonical_key, record);
    return true;
  }

  /**
   * Get unique records
   */
  getUnique(): NormalizedRecord[] {
    return Array.from(this.records.values());
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      total_unique: this.seenKeys.size,
      total_records: this.records.size,
      dedup_rate: (1 - (this.records.size / (this.seenKeys.size + 1))) * 100
    };
  }
}

export default { Normalizer, Deduplicator };
