/**
 * Services Router - tRPC endpoints for parts pricing, OBD-II scanner, and repair costs
 */

import { router, publicProcedure } from '../_core/trpc';
import { z } from 'zod';
import { partsPricingService } from '../services/parts-pricing-service';
import { obd2ScannerService } from '../services/obd2-scanner-service';
import { repairCostCalculator } from '../services/repair-cost-calculator';

export const servicesRouter = router({
  // ============================================================
  // PARTS PRICING ENDPOINTS
  // ============================================================
  
  parts: router({
    /**
     * Search for part prices across multiple sources
     */
    searchPrices: publicProcedure
      .input(
        z.object({
          partName: z.string(),
          partNumber: z.string().optional(),
          brand: z.string().optional(),
          model: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        return await partsPricingService.searchPartPrices(
          input.partName,
          input.partNumber,
          input.brand,
          input.model
        );
      }),

    /**
     * Get parts needed for a specific repair
     */
    getPartsForRepair: publicProcedure
      .input(
        z.object({
          repairType: z.string(),
          brand: z.string(),
          model: z.string(),
        })
      )
      .query(async ({ input }) => {
        return await partsPricingService.getPartsForRepair(
          input.repairType,
          input.brand,
          input.model
        );
      }),
  }),

  // ============================================================
  // OBD-II SCANNER ENDPOINTS
  // ============================================================

  scanner: router({
    /**
     * Connect to OBD-II device
     */
    connect: publicProcedure
      .input(z.object({ deviceName: z.string() }))
      .mutation(async ({ input }) => {
        const connected = await obd2ScannerService.connectDevice(input.deviceName);
        return { connected, deviceName: input.deviceName };
      }),

    /**
     * Disconnect from OBD-II device
     */
    disconnect: publicProcedure.mutation(async () => {
      await obd2ScannerService.disconnectDevice();
      return { disconnected: true };
    }),

    /**
     * Read diagnostic trouble codes (DTCs)
     */
    readDTCCodes: publicProcedure.query(async () => {
      return await obd2ScannerService.readDTCCodes();
    }),

    /**
     * Read real-time engine parameters
     */
    readEngineParameters: publicProcedure.query(async () => {
      return await obd2ScannerService.readEngineParameters();
    }),

    /**
     * Clear diagnostic trouble codes
     */
    clearDTCCodes: publicProcedure.mutation(async () => {
      const cleared = await obd2ScannerService.clearDTCCodes();
      return { cleared };
    }),

    /**
     * Get current scanner state
     */
    getState: publicProcedure.query(async () => {
      return obd2ScannerService.getState();
    }),

    /**
     * Analyze readings for issues
     */
    analyzeReadings: publicProcedure.query(async () => {
      return obd2ScannerService.analyzeReadings();
    }),
  }),

  // ============================================================
  // REPAIR COST CALCULATOR ENDPOINTS
  // ============================================================

  costs: router({
    /**
     * Calculate repair cost estimate
     */
    calculateRepairCost: publicProcedure
      .input(
        z.object({
          repairType: z.string(),
          brand: z.string(),
          model: z.string(),
          diagnosticLevel: z.enum(['simple', 'standard', 'complex']).default('standard'),
        })
      )
      .query(async ({ input }) => {
        return await repairCostCalculator.calculateRepairCost(
          input.repairType,
          input.brand,
          input.model,
          input.diagnosticLevel
        );
      }),

    /**
     * Calculate costs for multiple repairs
     */
    calculateMultipleRepairs: publicProcedure
      .input(
        z.object({
          repairs: z.array(
            z.object({
              type: z.string(),
              brand: z.string(),
              model: z.string(),
            })
          ),
          diagnosticLevel: z.enum(['simple', 'standard', 'complex']).default('standard'),
        })
      )
      .query(async ({ input }) => {
        return await repairCostCalculator.calculateMultipleRepairs(
          input.repairs,
          input.diagnosticLevel
        );
      }),

    /**
     * Get cost comparison between different shops
     */
    getCostComparison: publicProcedure
      .input(
        z.object({
          repairType: z.string(),
          brand: z.string(),
          model: z.string(),
        })
      )
      .query(async ({ input }) => {
        return await repairCostCalculator.getCostComparison(
          input.repairType,
          input.brand,
          input.model
        );
      }),

    /**
     * Estimate warranty coverage
     */
    estimateWarranty: publicProcedure
      .input(z.object({ repairType: z.string() }))
      .query(async ({ input }) => {
        return repairCostCalculator.estimateWarranty(input.repairType);
      }),
  }),
});
