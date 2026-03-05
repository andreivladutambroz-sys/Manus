/**
 * Repair Cost Calculator
 * Calculates total repair costs based on parts, labor, and diagnostics
 */

import { partsPricingService, PartPrice } from './parts-pricing-service';

export interface LaborRate {
  category: string;
  hourlyRate: number;
  estimatedHours: number;
}

export interface RepairCostEstimate {
  repairType: string;
  parts: PartPrice[];
  partsCost: number;
  labor: LaborRate;
  laborCost: number;
  diagnosticsFee: number;
  totalCost: number;
  currency: string;
  confidence: number;
  breakdown: {
    parts: number;
    labor: number;
    diagnostics: number;
  };
}

class RepairCostCalculator {
  /**
   * Standard labor rates by category (EUR/hour)
   */
  private laborRates: Record<string, number> = {
    'oil_change': 30,
    'brake_pads': 50,
    'battery_replacement': 40,
    'spark_plugs': 45,
    'air_filter': 25,
    'transmission_fluid': 60,
    'coolant_flush': 55,
    'suspension_repair': 80,
    'engine_repair': 120,
    'transmission_repair': 150,
    'electrical_repair': 70,
    'diagnostic': 60,
  };

  /**
   * Estimated labor hours by repair type
   */
  private laborHours: Record<string, number> = {
    'oil_change': 0.5,
    'brake_pads': 1.5,
    'battery_replacement': 0.5,
    'spark_plugs': 1,
    'air_filter': 0.25,
    'transmission_fluid': 2,
    'coolant_flush': 1.5,
    'suspension_repair': 3,
    'engine_repair': 8,
    'transmission_repair': 12,
    'electrical_repair': 4,
    'diagnostic': 1,
  };

  /**
   * Diagnostic fees (EUR)
   */
  private diagnosticFees: Record<string, number> = {
    'simple': 30,
    'standard': 60,
    'complex': 120,
    'engine_diagnostic': 100,
    'transmission_diagnostic': 150,
    'electrical_diagnostic': 80,
  };

  /**
   * Calculate total repair cost
   */
  async calculateRepairCost(
    repairType: string,
    brand: string,
    model: string,
    diagnosticLevel: 'simple' | 'standard' | 'complex' = 'standard'
  ): Promise<RepairCostEstimate> {
    try {
      // Get parts for this repair
      const parts = await partsPricingService.getPartsForRepair(repairType, brand, model);

      // Calculate parts cost
      const partsCost = parts.reduce((sum, part) => sum + part.price, 0);

      // Get labor information
      const hourlyRate = this.laborRates[repairType] || 60;
      const estimatedHours = this.laborHours[repairType] || 1;
      const laborCost = hourlyRate * estimatedHours;

      // Get diagnostic fee
      const diagnosticsFee = this.diagnosticFees[diagnosticLevel] || 60;

      // Calculate total
      const totalCost = partsCost + laborCost + diagnosticsFee;

      // Calculate confidence based on data availability
      const confidence = parts.length > 0 ? 85 : 60;

      return {
        repairType,
        parts,
        partsCost: Math.round(partsCost * 100) / 100,
        labor: {
          category: repairType,
          hourlyRate,
          estimatedHours,
        },
        laborCost: Math.round(laborCost * 100) / 100,
        diagnosticsFee,
        totalCost: Math.round(totalCost * 100) / 100,
        currency: 'EUR',
        confidence,
        breakdown: {
          parts: Math.round((partsCost / totalCost) * 100),
          labor: Math.round((laborCost / totalCost) * 100),
          diagnostics: Math.round((diagnosticsFee / totalCost) * 100),
        },
      };
    } catch (error) {
      console.error('Error calculating repair cost:', error);
      throw error;
    }
  }

  /**
   * Calculate costs for multiple repairs
   */
  async calculateMultipleRepairs(
    repairs: Array<{ type: string; brand: string; model: string }>,
    diagnosticLevel: 'simple' | 'standard' | 'complex' = 'standard'
  ): Promise<{
    estimates: RepairCostEstimate[];
    totalCost: number;
    averageCostPerRepair: number;
  }> {
    const estimates = await Promise.all(
      repairs.map((repair) =>
        this.calculateRepairCost(repair.type, repair.brand, repair.model, diagnosticLevel)
      )
    );

    const totalCost = estimates.reduce((sum, est) => sum + est.totalCost, 0);
    const averageCostPerRepair = totalCost / estimates.length;

    return {
      estimates,
      totalCost: Math.round(totalCost * 100) / 100,
      averageCostPerRepair: Math.round(averageCostPerRepair * 100) / 100,
    };
  }

  /**
   * Get cost comparison between different shops
   */
  async getCostComparison(
    repairType: string,
    brand: string,
    model: string
  ): Promise<{
    lowCost: number;
    averageCost: number;
    highCost: number;
    savings: number;
  }> {
    const estimate = await this.calculateRepairCost(repairType, brand, model);

    // Simulate different shop pricing
    const lowCost = estimate.totalCost * 0.85; // 15% discount
    const averageCost = estimate.totalCost;
    const highCost = estimate.totalCost * 1.25; // 25% markup
    const savings = highCost - lowCost;

    return {
      lowCost: Math.round(lowCost * 100) / 100,
      averageCost: Math.round(averageCost * 100) / 100,
      highCost: Math.round(highCost * 100) / 100,
      savings: Math.round(savings * 100) / 100,
    };
  }

  /**
   * Estimate warranty coverage
   */
  estimateWarranty(repairType: string): {
    warrantyMonths: number;
    warrantyKm: number;
    description: string;
  } {
    const warranties: Record<string, { warrantyMonths: number; warrantyKm: number; description: string }> = {
      'oil_change': { warrantyMonths: 3, warrantyKm: 5000, description: 'Oil change warranty' },
      'brake_pads': { warrantyMonths: 12, warrantyKm: 20000, description: 'Brake pad replacement warranty' },
      'battery_replacement': { warrantyMonths: 24, warrantyKm: 100000, description: 'Battery warranty' },
      'spark_plugs': { warrantyMonths: 6, warrantyKm: 10000, description: 'Spark plug warranty' },
      'air_filter': { warrantyMonths: 6, warrantyKm: 10000, description: 'Air filter warranty' },
      'transmission_fluid': { warrantyMonths: 12, warrantyKm: 30000, description: 'Transmission fluid warranty' },
      'coolant_flush': { warrantyMonths: 12, warrantyKm: 30000, description: 'Coolant flush warranty' },
      'suspension_repair': { warrantyMonths: 24, warrantyKm: 50000, description: 'Suspension repair warranty' },
      'engine_repair': { warrantyMonths: 36, warrantyKm: 100000, description: 'Engine repair warranty' },
      'transmission_repair': { warrantyMonths: 36, warrantyKm: 100000, description: 'Transmission repair warranty' },
      'electrical_repair': { warrantyMonths: 12, warrantyKm: 30000, description: 'Electrical repair warranty' },
    };

    return (
      warranties[repairType] || {
        warrantyMonths: 6,
        warrantyKm: 10000,
        description: 'Standard warranty',
      }
    );
  }
}

export const repairCostCalculator = new RepairCostCalculator();
