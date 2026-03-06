/**
 * Data Collection Router
 * Integrates the 8-agent swarm for real data collection
 */

import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { dataSwarm } from "../data-collection";

export const dataCollectionRouter = router({
  /**
   * Start data collection pipeline
   * Scrapes, validates, enriches, and stores real data
   */
  startCollection: protectedProcedure
    .input(z.object({
      urls: z.array(z.object({
        url: z.string().url(),
        site: z.string(),
      })),
      limit: z.number().optional().default(50),
    }))
    .mutation(async ({ input }) => {
      console.log(`[DataCollection] Starting pipeline with ${input.urls.length} URLs`);
      
      try {
        const result = await dataSwarm.runPipeline(input.urls.slice(0, input.limit));
        
        return {
          success: true,
          result,
          message: `Pipeline completed: ${result.stored} records stored`,
        };
      } catch (error: any) {
        console.error('[DataCollection] Pipeline error:', error);
        return {
          success: false,
          error: error.message,
          message: 'Pipeline failed',
        };
      }
    }),

  /**
   * Get collection statistics
   */
  getStats: protectedProcedure.query(async () => {
    // TODO: Implement stats query from database
    return {
      totalRecords: 0,
      averageQuality: 0,
      lastCollectionTime: null,
    };
  }),

  /**
   * Sample URLs for testing
   */
  getSampleUrls: protectedProcedure.query(() => {
    return [
      // ePiesa.ro - Vehicle selector
      { url: 'https://www.epiesa.ro/catalog', site: 'epiesa.ro' },
      
      // Autodoc.ro - Parts catalog
      { url: 'https://www.autodoc.ro/parts', site: 'autodoc.ro' },
      
      // Ricardo.ch - Car listings
      { url: 'https://www.ricardo.ch/en/s/cars/', site: 'ricardo.ch' },
      
      // AutoScout24.de - Car listings
      { url: 'https://www.autoscout24.de/', site: 'autoscout24.de' },
      
      // OLX.ro - Auto listings
      { url: 'https://www.olx.ro/auto/', site: 'olx.ro' },
    ];
  }),
});
