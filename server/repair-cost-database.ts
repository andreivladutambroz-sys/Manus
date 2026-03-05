// Professional repair cost database with regional pricing and shop integration

export interface RepairCostEstimate {
  repairType: string;
  description: string;
  minCost: number;
  maxCost: number;
  averageCost: number;
  laborHours: number;
  partsCost: number;
  currency: string;
  difficulty: "easy" | "moderate" | "difficult" | "very_difficult";
  estimatedTime: string;
  commonIssues: string[];
  relatedRepairs: string[];
}

export interface RepairShop {
  id: string;
  name: string;
  location: string;
  region: string;
  country: string;
  specialization: string[];
  rating: number;
  reviewCount: number;
  averageRepairCost: number;
  responseTime: string;
  contactPhone: string;
  contactEmail: string;
  website?: string;
}

// Comprehensive repair cost database by repair type
export const repairCostDatabase: Record<string, RepairCostEstimate> = {
  "engine-oil-change": {
    repairType: "Engine Oil Change",
    description: "Complete engine oil and filter replacement",
    minCost: 30,
    maxCost: 80,
    averageCost: 50,
    laborHours: 0.5,
    partsCost: 20,
    currency: "EUR",
    difficulty: "easy",
    estimatedTime: "30-45 minutes",
    commonIssues: ["Dirty oil", "Clogged filter", "Oil leak"],
    relatedRepairs: ["oil-filter-replacement", "engine-flush"],
  },
  "brake-pad-replacement": {
    repairType: "Brake Pad Replacement",
    description: "Front or rear brake pad replacement",
    minCost: 150,
    maxCost: 400,
    averageCost: 250,
    laborHours: 1.5,
    partsCost: 100,
    currency: "EUR",
    difficulty: "moderate",
    estimatedTime: "1.5-2 hours",
    commonIssues: ["Worn brake pads", "Brake noise", "Reduced braking"],
    relatedRepairs: ["brake-rotor-replacement", "brake-fluid-flush"],
  },
  "windshield-replacement": {
    repairType: "Windshield Replacement",
    description: "Complete windshield glass replacement",
    minCost: 200,
    maxCost: 600,
    averageCost: 400,
    laborHours: 1,
    partsCost: 300,
    currency: "EUR",
    difficulty: "moderate",
    estimatedTime: "1-2 hours",
    commonIssues: ["Cracked windshield", "Chip damage", "Visibility issues"],
    relatedRepairs: ["windshield-trim-replacement", "sensor-recalibration"],
  },
  "battery-replacement": {
    repairType: "Battery Replacement",
    description: "Car battery replacement and terminal cleaning",
    minCost: 80,
    maxCost: 200,
    averageCost: 130,
    laborHours: 0.5,
    partsCost: 100,
    currency: "EUR",
    difficulty: "easy",
    estimatedTime: "30-45 minutes",
    commonIssues: ["Dead battery", "Weak battery", "Corrosion"],
    relatedRepairs: ["alternator-replacement", "starter-replacement"],
  },
  "tire-replacement": {
    repairType: "Tire Replacement",
    description: "Single or complete tire set replacement",
    minCost: 60,
    maxCost: 250,
    averageCost: 150,
    laborHours: 1,
    partsCost: 100,
    currency: "EUR",
    difficulty: "easy",
    estimatedTime: "45-60 minutes",
    commonIssues: ["Worn tires", "Puncture", "Uneven wear"],
    relatedRepairs: ["wheel-alignment", "tire-balancing"],
  },
  "transmission-fluid-change": {
    repairType: "Transmission Fluid Change",
    description: "Complete transmission fluid and filter replacement",
    minCost: 150,
    maxCost: 400,
    averageCost: 250,
    laborHours: 1.5,
    partsCost: 100,
    currency: "EUR",
    difficulty: "moderate",
    estimatedTime: "1.5-2 hours",
    commonIssues: ["Dirty fluid", "Slipping gears", "Rough shifting"],
    relatedRepairs: ["transmission-filter-replacement", "transmission-pan-gasket"],
  },
  "coolant-flush": {
    repairType: "Coolant Flush",
    description: "Complete cooling system flush and refill",
    minCost: 100,
    maxCost: 250,
    averageCost: 175,
    laborHours: 1,
    partsCost: 50,
    currency: "EUR",
    difficulty: "moderate",
    estimatedTime: "1-1.5 hours",
    commonIssues: ["Overheating", "Rust in system", "Coolant leak"],
    relatedRepairs: ["thermostat-replacement", "water-pump-replacement"],
  },
  "air-filter-replacement": {
    repairType: "Air Filter Replacement",
    description: "Engine air filter replacement",
    minCost: 20,
    maxCost: 60,
    averageCost: 40,
    laborHours: 0.25,
    partsCost: 20,
    currency: "EUR",
    difficulty: "easy",
    estimatedTime: "15-30 minutes",
    commonIssues: ["Dirty filter", "Reduced performance", "Poor fuel economy"],
    relatedRepairs: ["cabin-air-filter-replacement", "intake-cleaning"],
  },
  "spark-plug-replacement": {
    repairType: "Spark Plug Replacement",
    description: "Spark plug replacement (set of 4 or 6)",
    minCost: 80,
    maxCost: 200,
    averageCost: 140,
    laborHours: 1,
    partsCost: 60,
    currency: "EUR",
    difficulty: "moderate",
    estimatedTime: "1-1.5 hours",
    commonIssues: ["Engine misfire", "Rough idle", "Poor acceleration"],
    relatedRepairs: ["ignition-coil-replacement", "fuel-injector-cleaning"],
  },
  "suspension-repair": {
    repairType: "Suspension Repair",
    description: "Shock absorber or strut replacement",
    minCost: 300,
    maxCost: 800,
    averageCost: 550,
    laborHours: 2,
    partsCost: 400,
    currency: "EUR",
    difficulty: "difficult",
    estimatedTime: "2-3 hours",
    commonIssues: ["Bouncy ride", "Clunking noise", "Uneven wear"],
    relatedRepairs: ["wheel-alignment", "ball-joint-replacement"],
  },
  "alternator-replacement": {
    repairType: "Alternator Replacement",
    description: "Complete alternator replacement",
    minCost: 300,
    maxCost: 700,
    averageCost: 500,
    laborHours: 2,
    partsCost: 350,
    currency: "EUR",
    difficulty: "difficult",
    estimatedTime: "2-3 hours",
    commonIssues: ["Charging system failure", "Dim lights", "Battery not charging"],
    relatedRepairs: ["battery-replacement", "serpentine-belt-replacement"],
  },
  "catalytic-converter-replacement": {
    repairType: "Catalytic Converter Replacement",
    description: "Complete catalytic converter replacement",
    minCost: 500,
    maxCost: 1500,
    averageCost: 1000,
    laborHours: 1.5,
    partsCost: 800,
    currency: "EUR",
    difficulty: "difficult",
    estimatedTime: "1.5-2 hours",
    commonIssues: ["Check engine light", "Reduced performance", "Rotten egg smell"],
    relatedRepairs: ["oxygen-sensor-replacement", "exhaust-repair"],
  },
  "engine-head-gasket": {
    repairType: "Engine Head Gasket Replacement",
    description: "Complete head gasket replacement",
    minCost: 800,
    maxCost: 2000,
    averageCost: 1400,
    laborHours: 6,
    partsCost: 800,
    currency: "EUR",
    difficulty: "very_difficult",
    estimatedTime: "6-8 hours",
    commonIssues: ["Coolant leak", "White smoke", "Overheating"],
    relatedRepairs: ["cylinder-head-replacement", "engine-block-repair"],
  },
};

// Sample repair shops database (would be expanded with real data)
export const repairShopsDatabase: RepairShop[] = [
  {
    id: "shop-001",
    name: "AutoRepair Pro",
    location: "Berlin, Germany",
    region: "Berlin",
    country: "Germany",
    specialization: ["Volkswagen", "Audi", "Skoda"],
    rating: 4.8,
    reviewCount: 245,
    averageRepairCost: 450,
    responseTime: "24 hours",
    contactPhone: "+49 30 123456",
    contactEmail: "info@autorepairpro.de",
    website: "https://autorepairpro.de",
  },
  {
    id: "shop-002",
    name: "BMW Specialist Center",
    location: "Munich, Germany",
    region: "Bavaria",
    country: "Germany",
    specialization: ["BMW", "Mercedes-Benz"],
    rating: 4.9,
    reviewCount: 189,
    averageRepairCost: 650,
    responseTime: "12 hours",
    contactPhone: "+49 89 987654",
    contactEmail: "service@bmwspecialist.de",
    website: "https://bmwspecialist.de",
  },
  {
    id: "shop-003",
    name: "Quick Fix Auto",
    location: "Frankfurt, Germany",
    region: "Hesse",
    country: "Germany",
    specialization: ["General Repairs", "Oil Changes", "Tire Service"],
    rating: 4.5,
    reviewCount: 512,
    averageRepairCost: 300,
    responseTime: "Same day",
    contactPhone: "+49 69 555555",
    contactEmail: "contact@quickfixauto.de",
    website: "https://quickfixauto.de",
  },
];

export function getRepairCostEstimate(repairType: string): RepairCostEstimate | null {
  return repairCostDatabase[repairType] || null;
}

export function getRepairShops(region?: string, specialization?: string): RepairShop[] {
  return repairShopsDatabase.filter((shop) => {
    if (region && shop.region !== region) return false;
    if (specialization && !shop.specialization.includes(specialization)) return false;
    return true;
  });
}

export function calculateTotalRepairCost(repairs: string[]): {
  minTotal: number;
  maxTotal: number;
  averageTotal: number;
  estimatedHours: number;
} {
  let minTotal = 0;
  let maxTotal = 0;
  let averageTotal = 0;
  let estimatedHours = 0;

  repairs.forEach((repairType) => {
    const estimate = getRepairCostEstimate(repairType);
    if (estimate) {
      minTotal += estimate.minCost;
      maxTotal += estimate.maxCost;
      averageTotal += estimate.averageCost;
      estimatedHours += estimate.laborHours;
    }
  });

  return {
    minTotal,
    maxTotal,
    averageTotal,
    estimatedHours,
  };
}
