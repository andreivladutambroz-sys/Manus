import { z } from "zod";

// TSB (Technical Service Bulletin) types
export interface TSB {
  id: string;
  brand: string;
  model: string;
  year: number;
  bulletinNumber: string;
  title: string;
  description: string;
  affectedSystems: string[];
  symptoms: string[];
  solution: string;
  partsRequired: { partNumber: string; name: string; cost: number }[];
  estimatedTime: number;
  difficulty: "easy" | "moderate" | "difficult" | "expert";
  releaseDate: number;
  supersededBy?: string;
  relatedErrorCodes: string[];
  safetyWarnings: string[];
  tools: string[];
  source: "manufacturer" | "dealer" | "community";
  rating: number;
  downloads: number;
}

// Recall types
export interface Recall {
  id: string;
  brand: string;
  model: string;
  yearRange: { start: number; end: number };
  recallNumber: string;
  title: string;
  description: string;
  affectedSystems: string[];
  symptoms: string[];
  remedy: string;
  safetyRisk: "low" | "medium" | "high" | "critical";
  issueDate: number;
  reminderDate?: number;
  manufacturer: string;
  status: "open" | "closed";
  estimatedTime: number;
  dealerInstructions: string;
}

// Service Update types
export interface ServiceUpdate {
  id: string;
  brand: string;
  model: string;
  year: number;
  updateNumber: string;
  title: string;
  description: string;
  category: "maintenance" | "performance" | "reliability" | "safety";
  recommendedMileage?: number;
  recommendedMonths?: number;
  procedures: string[];
  releaseDate: number;
  priority: "low" | "medium" | "high" | "critical";
}

// OEM TSB Integration Service
export class OEMTSBIntegrationService {
  private tsbs: Map<string, TSB> = new Map();
  private recalls: Map<string, Recall> = new Map();
  private updates: Map<string, ServiceUpdate> = new Map();
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.initializeSampleData();
  }

  // Initialize with sample data
  private initializeSampleData(): void {
    // Sample TSBs
    const sampleTSBs: TSB[] = [
      {
        id: "tsb-vw-001",
        brand: "Volkswagen",
        model: "Golf",
        year: 2015,
        bulletinNumber: "VW-2015-001",
        title: "MAF Sensor Cleaning Procedure",
        description: "Procedure for cleaning MAF sensor to resolve rough idle and poor fuel economy",
        affectedSystems: ["Engine Management", "Air Intake"],
        symptoms: ["Rough idle", "Poor fuel economy", "Check engine light P0101"],
        solution:
          "1. Remove air intake hose\n2. Locate MAF sensor\n3. Remove sensor carefully\n4. Clean with MAF sensor cleaner\n5. Reinstall and clear codes",
        partsRequired: [
          { partNumber: "06A 133 471 C", name: "MAF Sensor", cost: 85.0 },
          { partNumber: "N 10 132 701", name: "MAF Sensor Cleaner", cost: 12.0 },
        ],
        estimatedTime: 45,
        difficulty: "moderate",
        releaseDate: Date.now() - 365 * 24 * 60 * 60 * 1000,
        relatedErrorCodes: ["P0101", "P0102", "P0103"],
        safetyWarnings: ["Engine must be cold", "Disconnect battery before starting"],
        tools: ["Screwdriver set", "Socket set"],
        source: "manufacturer",
        rating: 4.8,
        downloads: 1250,
      },
      {
        id: "tsb-bmw-001",
        brand: "BMW",
        model: "320i",
        year: 2018,
        bulletinNumber: "BMW-2018-045",
        title: "Fuel Pump Module Replacement",
        description: "Procedure for replacing fuel pump module due to potential failure",
        affectedSystems: ["Fuel System"],
        symptoms: ["Engine stalling", "Difficulty starting", "Fuel pressure low"],
        solution:
          "1. Relieve fuel pressure\n2. Remove rear seat\n3. Access fuel pump module\n4. Disconnect electrical connector\n5. Remove mounting bolts\n6. Install new module\n7. Reconnect and test",
        partsRequired: [
          { partNumber: "16117375701", name: "Fuel Pump Module", cost: 450.0 },
          { partNumber: "16117375702", name: "Fuel Filter", cost: 35.0 },
        ],
        estimatedTime: 120,
        difficulty: "difficult",
        releaseDate: Date.now() - 180 * 24 * 60 * 60 * 1000,
        relatedErrorCodes: ["P0087", "P0088"],
        safetyWarnings: ["Relieve fuel pressure before starting", "Fuel is flammable"],
        tools: ["Fuel pressure gauge", "Socket set", "Screwdriver set"],
        source: "manufacturer",
        rating: 4.5,
        downloads: 890,
      },
    ];

    sampleTSBs.forEach((tsb) => this.tsbs.set(tsb.id, tsb));

    // Sample Recalls
    const sampleRecalls: Recall[] = [
      {
        id: "recall-vw-001",
        brand: "Volkswagen",
        model: "Golf",
        yearRange: { start: 2014, end: 2017 },
        recallNumber: "VW-2023-001",
        title: "Airbag Control Module Software Update",
        description: "Airbag control module may not deploy airbags properly in certain crash scenarios",
        affectedSystems: ["Airbag System"],
        symptoms: ["Airbag warning light", "Airbag system malfunction"],
        remedy: "Update airbag control module software to latest version",
        safetyRisk: "high",
        issueDate: Date.now() - 90 * 24 * 60 * 60 * 1000,
        manufacturer: "Volkswagen",
        status: "open",
        estimatedTime: 30,
        dealerInstructions: "Connect to diagnostic system and update software",
      },
      {
        id: "recall-bmw-001",
        brand: "BMW",
        model: "320i",
        yearRange: { start: 2015, end: 2019 },
        recallNumber: "BMW-2023-012",
        title: "Brake Fluid Leak Risk",
        description: "Brake fluid may leak from brake lines under certain conditions",
        affectedSystems: ["Brake System"],
        symptoms: ["Soft brake pedal", "Brake fluid leak", "Brake warning light"],
        remedy: "Inspect brake lines and replace if necessary",
        safetyRisk: "critical",
        issueDate: Date.now() - 60 * 24 * 60 * 60 * 1000,
        manufacturer: "BMW",
        status: "open",
        estimatedTime: 90,
        dealerInstructions: "Perform complete brake system inspection and replacement",
      },
    ];

    sampleRecalls.forEach((recall) => this.recalls.set(recall.id, recall));

    // Sample Service Updates
    const sampleUpdates: ServiceUpdate[] = [
      {
        id: "update-vw-001",
        brand: "Volkswagen",
        model: "Golf",
        year: 2015,
        updateNumber: "VW-UPDATE-2023-001",
        title: "Engine Oil Specification Update",
        description: "Update to engine oil specification for improved performance and longevity",
        category: "maintenance",
        recommendedMileage: 10000,
        recommendedMonths: 12,
        procedures: ["Oil change", "Oil filter replacement"],
        releaseDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
        priority: "medium",
      },
      {
        id: "update-bmw-001",
        brand: "BMW",
        model: "320i",
        year: 2018,
        updateNumber: "BMW-UPDATE-2023-008",
        title: "Transmission Software Optimization",
        description: "Software update to improve transmission shifting and fuel economy",
        category: "performance",
        procedures: ["Connect to diagnostic system", "Update transmission software"],
        releaseDate: Date.now() - 45 * 24 * 60 * 60 * 1000,
        priority: "high",
      },
    ];

    sampleUpdates.forEach((update) => this.updates.set(update.id, update));
  }

  // ============================================
  // TSB OPERATIONS
  // ============================================

  getTSBsByModel(brand: string, model: string, year?: number): TSB[] {
    return Array.from(this.tsbs.values()).filter((tsb) => {
      const brandMatch = tsb.brand.toLowerCase() === brand.toLowerCase();
      const modelMatch = tsb.model.toLowerCase() === model.toLowerCase();
      const yearMatch = !year || tsb.year === year;
      return brandMatch && modelMatch && yearMatch;
    });
  }

  getTSBsByErrorCode(errorCode: string): TSB[] {
    return Array.from(this.tsbs.values()).filter((tsb) => tsb.relatedErrorCodes.includes(errorCode));
  }

  getTSBsBySymptoms(symptoms: string[]): TSB[] {
    return Array.from(this.tsbs.values()).filter((tsb) =>
      symptoms.some((symptom) => tsb.symptoms.some((s) => s.toLowerCase().includes(symptom.toLowerCase())))
    );
  }

  // ============================================
  // RECALL OPERATIONS
  // ============================================

  getRecallsByModel(brand: string, model: string, year: number): Recall[] {
    return Array.from(this.recalls.values()).filter((recall) => {
      const brandMatch = recall.brand.toLowerCase() === brand.toLowerCase();
      const modelMatch = recall.model.toLowerCase() === model.toLowerCase();
      const yearMatch = year >= recall.yearRange.start && year <= recall.yearRange.end;
      return brandMatch && modelMatch && yearMatch;
    });
  }

  getOpenRecalls(): Recall[] {
    return Array.from(this.recalls.values()).filter((recall) => recall.status === "open");
  }

  getCriticalRecalls(): Recall[] {
    return Array.from(this.recalls.values()).filter((recall) => recall.safetyRisk === "critical" && recall.status === "open");
  }

  // ============================================
  // SERVICE UPDATE OPERATIONS
  // ============================================

  getServiceUpdatesByModel(brand: string, model: string, year?: number): ServiceUpdate[] {
    return Array.from(this.updates.values()).filter((update) => {
      const brandMatch = update.brand.toLowerCase() === brand.toLowerCase();
      const modelMatch = update.model.toLowerCase() === model.toLowerCase();
      const yearMatch = !year || update.year === year;
      return brandMatch && modelMatch && yearMatch;
    });
  }

  getServiceUpdatesByCategory(category: ServiceUpdate["category"]): ServiceUpdate[] {
    return Array.from(this.updates.values()).filter((update) => update.category === category);
  }

  // ============================================
  // COMPREHENSIVE VEHICLE CHECK
  // ============================================

  getComprehensiveVehicleCheck(brand: string, model: string, year: number): {
    tsbs: TSB[];
    recalls: Recall[];
    updates: ServiceUpdate[];
    criticalIssues: string[];
    recommendations: string[];
  } {
    const tsbs = this.getTSBsByModel(brand, model, year);
    const recalls = this.getRecallsByModel(brand, model, year);
    const updates = this.getServiceUpdatesByModel(brand, model, year);

    const criticalIssues: string[] = [];
    const recommendations: string[] = [];

    // Check for critical recalls
    const criticalRecalls = recalls.filter((r) => r.safetyRisk === "critical");
    if (criticalRecalls.length > 0) {
      criticalIssues.push(`${criticalRecalls.length} critical safety recalls found`);
      criticalRecalls.forEach((r) => {
        recommendations.push(`URGENT: ${r.title} - ${r.remedy}`);
      });
    }

    // Check for high-priority updates
    const highPriorityUpdates = updates.filter((u) => u.priority === "high" || u.priority === "critical");
    if (highPriorityUpdates.length > 0) {
      recommendations.push(`${highPriorityUpdates.length} high-priority updates available`);
    }

    // Check for relevant TSBs
    if (tsbs.length > 0) {
      recommendations.push(`${tsbs.length} technical service bulletins available for this model`);
    }

    return {
      tsbs,
      recalls,
      updates,
      criticalIssues,
      recommendations,
    };
  }

  // ============================================
  // CACHING
  // ============================================

  private getCacheKey(brand: string, model: string, year: number): string {
    return `${brand}-${model}-${year}`;
  }

  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.cacheExpiry;
  }

  // ============================================
  // DATA MANAGEMENT
  // ============================================

  addTSB(tsb: Omit<TSB, "id">): TSB {
    const id = `tsb-${Date.now()}`;
    const newTSB: TSB = { ...tsb, id };
    this.tsbs.set(id, newTSB);
    return newTSB;
  }

  addRecall(recall: Omit<Recall, "id">): Recall {
    const id = `recall-${Date.now()}`;
    const newRecall: Recall = { ...recall, id };
    this.recalls.set(id, newRecall);
    return newRecall;
  }

  addServiceUpdate(update: Omit<ServiceUpdate, "id">): ServiceUpdate {
    const id = `update-${Date.now()}`;
    const newUpdate: ServiceUpdate = { ...update, id };
    this.updates.set(id, newUpdate);
    return newUpdate;
  }
}

// Create singleton instance
export const oemTSB = new OEMTSBIntegrationService();
