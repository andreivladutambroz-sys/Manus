/**
 * ANALYTICS & STATISTICS GENERATOR
 * 
 * Generates failure statistics:
 * - Failure frequency by vehicle
 * - Failure frequency by engine
 * - Symptom distribution
 * - Common defects per model
 */

export interface VehicleStats {
  vehicle_make: string;
  vehicle_model?: string;
  total_records: number;
  unique_symptoms: string[];
  unique_defects: string[];
  avg_confidence: number;
  failure_types: { [key: string]: number };
}

export interface EngineStats {
  engine: string;
  total_records: number;
  vehicle_makes: string[];
  common_failures: Array<{ failure: string; count: number }>;
  avg_confidence: number;
  failure_types?: { [key: string]: number };
}

export interface SymptomStats {
  symptom: string;
  frequency: number;
  affected_vehicles: string[];
  avg_confidence: number;
}

export interface DefectStats {
  defect: string;
  frequency: number;
  affected_vehicles: string[];
  avg_confidence: number;
}

export class Analytics {
  private vehicleStats: Map<string, VehicleStats> = new Map();
  private engineStats: Map<string, EngineStats> = new Map();
  private symptomStats: Map<string, SymptomStats> = new Map();
  private defectStats: Map<string, DefectStats> = new Map();
  private totalRecords = 0;

  /**
   * Add record to analytics
   */
  addRecord(
    vehicleMake: string,
    vehicleModel: string | undefined,
    engine: string | undefined,
    symptoms: string[],
    defects: string[],
    confidence: number
  ): void {
    this.totalRecords++;

    // Vehicle stats
    const vehicleKey = `${vehicleMake}${vehicleModel ? `-${vehicleModel}` : ''}`;
    if (!this.vehicleStats.has(vehicleKey)) {
      this.vehicleStats.set(vehicleKey, {
        vehicle_make: vehicleMake,
        vehicle_model: vehicleModel,
        total_records: 0,
        unique_symptoms: [],
        unique_defects: [],
        avg_confidence: 0,
        failure_types: {}
      });
    }

    const vStats = this.vehicleStats.get(vehicleKey)!;
    vStats.total_records++;
    vStats.avg_confidence = (vStats.avg_confidence * (vStats.total_records - 1) + confidence) / vStats.total_records;

    // Add symptoms
    for (const symptom of symptoms) {
      if (!vStats.unique_symptoms.includes(symptom)) {
        vStats.unique_symptoms.push(symptom);
      }
      vStats.failure_types[symptom] = (vStats.failure_types[symptom] || 0) + 1;
    }

    // Add defects
    for (const defect of defects) {
      if (!vStats.unique_defects.includes(defect)) {
        vStats.unique_defects.push(defect);
      }
      vStats.failure_types[defect] = (vStats.failure_types[defect] || 0) + 1;
    }

    // Engine stats
    if (engine) {
      if (!this.engineStats.has(engine)) {
        this.engineStats.set(engine, {
          engine,
          total_records: 0,
          vehicle_makes: [],
          common_failures: [],
          avg_confidence: 0
        });
      }

      const eStats = this.engineStats.get(engine)!;
      eStats.total_records++;
      eStats.avg_confidence = (eStats.avg_confidence * (eStats.total_records - 1) + confidence) / eStats.total_records;

      if (!eStats.vehicle_makes.includes(vehicleMake)) {
        eStats.vehicle_makes.push(vehicleMake);
      }
    }

    // Symptom stats
    for (const symptom of symptoms) {
      if (!this.symptomStats.has(symptom)) {
        this.symptomStats.set(symptom, {
          symptom,
          frequency: 0,
          affected_vehicles: [],
          avg_confidence: 0
        });
      }

      const sStats = this.symptomStats.get(symptom)!;
      sStats.frequency++;
      sStats.avg_confidence = (sStats.avg_confidence * (sStats.frequency - 1) + confidence) / sStats.frequency;

      if (!sStats.affected_vehicles.includes(vehicleKey)) {
        sStats.affected_vehicles.push(vehicleKey);
      }
    }

    // Defect stats
    for (const defect of defects) {
      if (!this.defectStats.has(defect)) {
        this.defectStats.set(defect, {
          defect,
          frequency: 0,
          affected_vehicles: [],
          avg_confidence: 0
        });
      }

      const dStats = this.defectStats.get(defect)!;
      dStats.frequency++;
      dStats.avg_confidence = (dStats.avg_confidence * (dStats.frequency - 1) + confidence) / dStats.frequency;

      if (!dStats.affected_vehicles.includes(vehicleKey)) {
        dStats.affected_vehicles.push(vehicleKey);
      }
    }
  }

  /**
   * Get vehicle statistics
   */
  getVehicleStats(): VehicleStats[] {
    return Array.from(this.vehicleStats.values())
      .sort((a, b) => b.total_records - a.total_records);
  }

  /**
   * Get engine statistics
   */
  getEngineStats(): EngineStats[] {
    return Array.from(this.engineStats.values())
      .map(stats => ({
        ...stats,
        common_failures: Object.entries(stats.failure_types || {})
          .map(([failure, count]) => ({ failure, count: count as number }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
      }))
      .sort((a, b) => b.total_records - a.total_records);
  }

  /**
   * Get symptom statistics
   */
  getSymptomStats(): SymptomStats[] {
    return Array.from(this.symptomStats.values())
      .sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Get defect statistics
   */
  getDefectStats(): DefectStats[] {
    return Array.from(this.defectStats.values())
      .sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    return {
      total_records: this.totalRecords,
      unique_vehicles: this.vehicleStats.size,
      unique_engines: this.engineStats.size,
      unique_symptoms: this.symptomStats.size,
      unique_defects: this.defectStats.size,
      avg_confidence: Array.from(this.vehicleStats.values())
        .reduce((sum, v) => sum + v.avg_confidence, 0) / (this.vehicleStats.size || 1)
    };
  }

  /**
   * Export as JSON
   */
  export() {
    return {
      summary: this.getSummary(),
      vehicles: this.getVehicleStats(),
      engines: this.getEngineStats(),
      symptoms: this.getSymptomStats(),
      defects: this.getDefectStats()
    };
  }
}

export default Analytics;
