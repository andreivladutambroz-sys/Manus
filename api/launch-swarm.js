/**
 * Vercel API Route: Launch 200-Agent Swarm
 * 
 * Orchestrates parallel data collection from multiple suppliers
 * Executes agents in batches to avoid resource exhaustion
 * 
 * Usage: POST /api/launch-swarm
 * Body: { agents: 30, batchSize: 5 }
 */

import { Orchestrator } from '../swarm-free-data-collection/Orchestrator.mjs';
import { AGENTS_CONFIG } from '../swarm-free-data-collection/config/agents.config.mjs';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Bypass token for public access
  const bypassToken = req.headers['x-bypass-token'];
  const validBypass = bypassToken === 'swarm-bypass-token-2026';

  if (!validBypass) {
    return res.status(401).json({ error: 'Unauthorized - missing bypass token' });
  }

  try {
    const { agents = 30, batchSize = 5 } = req.body;

    console.log(`[Swarm Launcher] Starting ${agents} agents with batch size ${batchSize}`);

    // Initialize orchestrator
    const orchestrator = new Orchestrator({
      batchSize,
      flaresolverrApi: process.env.FLARESOLVERR_API || 'http://localhost:8191/v1',
      maxTimeout: 60000,
      workerTimeout: 300000
    });

    // Get agents
    const selectedAgents = AGENTS_CONFIG.suppliers.slice(0, agents);

    // Run swarm
    const result = await orchestrator.run(selectedAgents);

    // Collect all data
    const allData = [];
    result.allResults.forEach(workerResult => {
      if (workerResult.success && workerResult.data) {
        allData.push(...workerResult.data);
      }
    });

    // Return results
    return res.status(200).json({
      success: true,
      stats: orchestrator.getStats(),
      totalRecords: allData.length,
      data: allData.slice(0, 100) // Return first 100 records as sample
    });

  } catch (error) {
    console.error('[Swarm Launcher] Error:', error.message);

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
