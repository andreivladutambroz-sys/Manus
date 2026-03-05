import { describe, it, expect, beforeEach } from 'vitest';
import { partsPricingService } from './services/parts-pricing-service';
import { obd2ScannerService } from './services/obd2-scanner-service';
import { repairCostCalculator } from './services/repair-cost-calculator';

describe('Parts Pricing Service', () => {
  it('should search for part prices', async () => {
    const result = await partsPricingService.searchPartPrices('Brake Pads', 'BP-001', 'VW', 'Golf');
    
    expect(result).toBeDefined();
    expect(result.parts).toBeDefined();
    expect(Array.isArray(result.parts)).toBe(true);
    expect(result.averagePrice).toBeGreaterThanOrEqual(0);
    expect(result.sources).toBeDefined();
  });

  it('should get parts for specific repair', async () => {
    const parts = await partsPricingService.getPartsForRepair('oil_change', 'VW', 'Golf');
    
    expect(Array.isArray(parts)).toBe(true);
    if (parts.length > 0) {
      expect(parts[0]).toHaveProperty('partName');
      expect(parts[0]).toHaveProperty('price');
      expect(parts[0]).toHaveProperty('source');
    }
  });

  it('should calculate price statistics', async () => {
    const result = await partsPricingService.searchPartPrices('Oil Filter', 'OF-001');
    
    if (result.parts.length > 0) {
      expect(result.averagePrice).toBeGreaterThan(0);
      expect(result.lowestPrice).toBeGreaterThan(0);
      expect(result.highestPrice).toBeGreaterThanOrEqual(result.lowestPrice);
      expect(result.confidence).toBeGreaterThan(0);
    }
  });
});

describe('OBD-II Scanner Service', () => {
  beforeEach(() => {
    obd2ScannerService.disconnectDevice();
  });

  it('should connect to OBD-II device', async () => {
    const connected = await obd2ScannerService.connectDevice('ELM327');
    
    expect(connected).toBe(true);
    const state = obd2ScannerService.getState();
    expect(state.connected).toBe(true);
    expect(state.deviceName).toBe('ELM327');
  });

  it('should read DTC codes', async () => {
    await obd2ScannerService.connectDevice('ELM327');
    const codes = await obd2ScannerService.readDTCCodes();
    
    expect(Array.isArray(codes)).toBe(true);
    if (codes.length > 0) {
      expect(codes[0]).toHaveProperty('code');
      expect(codes[0]).toHaveProperty('description');
      expect(codes[0]).toHaveProperty('severity');
      expect(['info', 'warning', 'critical']).toContain(codes[0].severity);
    }
  });

  it('should read engine parameters', async () => {
    await obd2ScannerService.connectDevice('ELM327');
    const readings = await obd2ScannerService.readEngineParameters();
    
    expect(Array.isArray(readings)).toBe(true);
    expect(readings.length).toBeGreaterThan(0);
    
    const engineSpeedReading = readings.find((r) => r.parameter === 'Engine Speed');
    expect(engineSpeedReading).toBeDefined();
    expect(engineSpeedReading?.unit).toBe('RPM');
    expect(typeof engineSpeedReading?.value).toBe('number');
  });

  it('should clear DTC codes', async () => {
    await obd2ScannerService.connectDevice('ELM327');
    await obd2ScannerService.readDTCCodes();
    
    const cleared = await obd2ScannerService.clearDTCCodes();
    expect(cleared).toBe(true);
    
    const state = obd2ScannerService.getState();
    expect(state.dtcCodes.length).toBe(0);
  });

  it('should analyze readings for issues', async () => {
    await obd2ScannerService.connectDevice('ELM327');
    await obd2ScannerService.readEngineParameters();
    
    const issues = obd2ScannerService.analyzeReadings();
    expect(Array.isArray(issues)).toBe(true);
  });

  it('should disconnect from device', async () => {
    await obd2ScannerService.connectDevice('ELM327');
    await obd2ScannerService.disconnectDevice();
    
    const state = obd2ScannerService.getState();
    expect(state.connected).toBe(false);
  });
});

describe('Repair Cost Calculator', () => {
  it('should calculate repair cost', async () => {
    const estimate = await repairCostCalculator.calculateRepairCost(
      'oil_change',
      'VW',
      'Golf',
      'standard'
    );
    
    expect(estimate).toBeDefined();
    expect(estimate.repairType).toBe('oil_change');
    expect(estimate.partsCost).toBeGreaterThanOrEqual(0);
    expect(estimate.laborCost).toBeGreaterThan(0);
    expect(estimate.diagnosticsFee).toBeGreaterThan(0);
    expect(estimate.totalCost).toBeGreaterThan(0);
    expect(estimate.currency).toBe('EUR');
    expect(estimate.confidence).toBeGreaterThan(0);
  });

  it('should calculate costs for multiple repairs', async () => {
    const result = await repairCostCalculator.calculateMultipleRepairs(
      [
        { type: 'oil_change', brand: 'VW', model: 'Golf' },
        { type: 'brake_pads', brand: 'VW', model: 'Golf' },
      ],
      'standard'
    );
    
    expect(result.estimates.length).toBe(2);
    expect(result.totalCost).toBeGreaterThan(0);
    expect(result.averageCostPerRepair).toBeGreaterThan(0);
    expect(result.totalCost).toBeGreaterThanOrEqual(result.averageCostPerRepair);
  });

  it('should get cost comparison', async () => {
    const comparison = await repairCostCalculator.getCostComparison(
      'brake_pads',
      'VW',
      'Golf'
    );
    
    expect(comparison.lowCost).toBeGreaterThan(0);
    expect(comparison.averageCost).toBeGreaterThan(0);
    expect(comparison.highCost).toBeGreaterThan(0);
    expect(comparison.savings).toBeGreaterThan(0);
    expect(comparison.lowCost).toBeLessThanOrEqual(comparison.averageCost);
    expect(comparison.averageCost).toBeLessThanOrEqual(comparison.highCost);
  });

  it('should estimate warranty', () => {
    const warranty = repairCostCalculator.estimateWarranty('battery_replacement');
    
    expect(warranty).toBeDefined();
    expect(warranty.warrantyMonths).toBeGreaterThan(0);
    expect(warranty.warrantyKm).toBeGreaterThan(0);
    expect(warranty.description).toBeDefined();
    expect(warranty.warrantyMonths).toBe(24);
    expect(warranty.warrantyKm).toBe(100000);
  });

  it('should calculate cost breakdown', async () => {
    const estimate = await repairCostCalculator.calculateRepairCost(
      'suspension_repair',
      'VW',
      'Golf',
      'complex'
    );
    
    expect(estimate.breakdown).toBeDefined();
    expect(estimate.breakdown.parts).toBeGreaterThanOrEqual(0);
    expect(estimate.breakdown.labor).toBeGreaterThanOrEqual(0);
    expect(estimate.breakdown.diagnostics).toBeGreaterThanOrEqual(0);
    expect(estimate.breakdown.parts + estimate.breakdown.labor + estimate.breakdown.diagnostics).toBe(100);
  });

  it('should handle different diagnostic levels', async () => {
    const simple = await repairCostCalculator.calculateRepairCost('oil_change', 'VW', 'Golf', 'simple');
    const standard = await repairCostCalculator.calculateRepairCost('oil_change', 'VW', 'Golf', 'standard');
    const complex = await repairCostCalculator.calculateRepairCost('oil_change', 'VW', 'Golf', 'complex');
    
    expect(simple.diagnosticsFee).toBeLessThan(standard.diagnosticsFee);
    expect(standard.diagnosticsFee).toBeLessThan(complex.diagnosticsFee);
  });
});
