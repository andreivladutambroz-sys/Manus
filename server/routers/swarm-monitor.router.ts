/**
 * Swarm Monitoring Router
 * Real-time metrics and dashboard
 */

import { router, publicProcedure } from "../_core/trpc";
import { agentPool } from "../swarm/agent-pool";
import { waveExecutor } from "../swarm/wave-executor";
import { sourceDiscovery } from "../swarm/source-discovery";
import { z } from "zod";

export const swarmMonitorRouter = router({
  /**
   * Get agent pool metrics
   */
  getAgentMetrics: publicProcedure.query(() => {
    return agentPool.getMetrics();
  }),

  /**
   * Get all agents
   */
  getAllAgents: publicProcedure.query(() => {
    return agentPool.getAllAgents();
  }),

  /**
   * Get agents by team
   */
  getTeamAgents: publicProcedure.input(z.object({ team: z.string() })).query(({ input }) => {
    return agentPool.getTeamAgents(input.team);
  }),

  /**
   * Get agents by status
   */
  getAgentsByStatus: publicProcedure
    .input(z.object({ status: z.enum(["idle", "running", "completed", "failed"]) }))
    .query(({ input }) => {
      return agentPool.getAgentsByStatus(input.status);
    }),

  /**
   * Get wave execution summary
   */
  getWaveSummary: publicProcedure.query(() => {
    return waveExecutor.getSummary();
  }),

  /**
   * Get all waves
   */
  getAllWaves: publicProcedure.query(() => {
    return waveExecutor.getAllWaves();
  }),

  /**
   * Get wave by id
   */
  getWave: publicProcedure.input(z.object({ id: z.number() })).query(({ input }) => {
    return waveExecutor.getWave(input.id);
  }),

  /**
   * Get source discovery stats
   */
  getSourceStats: publicProcedure.query(() => {
    return sourceDiscovery.getStats();
  }),

  /**
   * Get all sources
   */
  getAllSources: publicProcedure.query(() => {
    return sourceDiscovery.getAllSources();
  }),

  /**
   * Get active sources
   */
  getActiveSources: publicProcedure.query(() => {
    return sourceDiscovery.getActiveSources();
  }),

  /**
   * Get sources by type
   */
  getSourcesByType: publicProcedure
    .input(z.object({ type: z.enum(["forum", "reddit", "manual", "blog", "video", "obd"]) }))
    .query(({ input }) => {
      return sourceDiscovery.getSourcesByType(input.type);
    }),

  /**
   * Get dashboard overview
   */
  getDashboardOverview: publicProcedure.query(() => {
    const agentMetrics = agentPool.getMetrics();
    const waveSummary = waveExecutor.getSummary();
    const sourceStats = sourceDiscovery.getStats();

    return {
      agents: agentMetrics,
      waves: waveSummary,
      sources: sourceStats,
      timestamp: Date.now(),
    };
  }),

  /**
   * Get cost estimation
   */
  getCostEstimation: publicProcedure
    .input(z.object({ totalRecords: z.number().min(1) }))
    .query(({ input }) => {
      const { kimiBatchProcessor } = require("../swarm/kimi-batch-processor");
      return kimiBatchProcessor.estimateCostSavings(input.totalRecords);
    }),

  /**
   * Get performance metrics
   */
  getPerformanceMetrics: publicProcedure.query(() => {
    const agentMetrics = agentPool.getMetrics();
    const waveSummary = waveExecutor.getSummary();

    return {
      totalAgents: agentMetrics.totalAgents,
      successRate: agentMetrics.successRate,
      avgTimePerRecord: agentMetrics.avgTimePerRecord,
      totalRecords: agentMetrics.totalRecords,
      totalTime: agentMetrics.totalTime,
      recordsPerSecond:
        agentMetrics.totalTime > 0
          ? (agentMetrics.totalRecords / agentMetrics.totalTime) * 1000
          : 0,
      wavesCompleted: waveSummary.completedWaves,
      wavesFailed: waveSummary.failedWaves,
    };
  }),
});
