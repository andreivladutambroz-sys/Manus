/**
 * Agent Pool Manager
 * Manages lifecycle of AI agents in swarm
 */

export interface AgentConfig {
  id: string;
  team: string;
  type: "collector" | "normalizer" | "deduplicator" | "validator" | "writer";
  status: "idle" | "running" | "completed" | "failed";
  startTime?: number;
  endTime?: number;
  recordsProcessed: number;
  error?: string;
}

export interface SwarmMetrics {
  totalAgents: number;
  activeAgents: number;
  completedAgents: number;
  failedAgents: number;
  totalRecords: number;
  totalTime: number;
  avgTimePerRecord: number;
  successRate: number;
}

class AgentPool {
  private agents: Map<string, AgentConfig> = new Map();
  private metrics: SwarmMetrics = {
    totalAgents: 0,
    activeAgents: 0,
    completedAgents: 0,
    failedAgents: 0,
    totalRecords: 0,
    totalTime: 0,
    avgTimePerRecord: 0,
    successRate: 0,
  };

  /**
   * Create and register agent
   */
  createAgent(config: Omit<AgentConfig, "status" | "recordsProcessed">): AgentConfig {
    const agent: AgentConfig = {
      ...config,
      status: "idle",
      recordsProcessed: 0,
    };

    this.agents.set(agent.id, agent);
    this.metrics.totalAgents++;

    return agent;
  }

  /**
   * Start agent
   */
  startAgent(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`Agent ${agentId} not found`);

    agent.status = "running";
    agent.startTime = Date.now();
    this.metrics.activeAgents++;
  }

  /**
   * Complete agent
   */
  completeAgent(agentId: string, recordsProcessed: number): void {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`Agent ${agentId} not found`);

    agent.status = "completed";
    agent.endTime = Date.now();
    agent.recordsProcessed = recordsProcessed;
    this.metrics.activeAgents--;
    this.metrics.completedAgents++;
    this.metrics.totalRecords += recordsProcessed;

    this.updateMetrics();
  }

  /**
   * Fail agent
   */
  failAgent(agentId: string, error: string): void {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`Agent ${agentId} not found`);

    agent.status = "failed";
    agent.endTime = Date.now();
    agent.error = error;
    this.metrics.activeAgents--;
    this.metrics.failedAgents++;

    this.updateMetrics();
  }

  /**
   * Get agent
   */
  getAgent(agentId: string): AgentConfig | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get all agents
   */
  getAllAgents(): AgentConfig[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agents by team
   */
  getTeamAgents(team: string): AgentConfig[] {
    return Array.from(this.agents.values()).filter((a) => a.team === team);
  }

  /**
   * Get agents by status
   */
  getAgentsByStatus(status: AgentConfig["status"]): AgentConfig[] {
    return Array.from(this.agents.values()).filter((a) => a.status === status);
  }

  /**
   * Update metrics
   */
  private updateMetrics(): void {
    const completed = this.metrics.completedAgents + this.metrics.failedAgents;
    const totalTime = Array.from(this.agents.values()).reduce((sum, agent) => {
      if (agent.startTime && agent.endTime) {
        return sum + (agent.endTime - agent.startTime);
      }
      return sum;
    }, 0);

    this.metrics.totalTime = totalTime;
    this.metrics.avgTimePerRecord =
      this.metrics.totalRecords > 0 ? totalTime / this.metrics.totalRecords : 0;
    this.metrics.successRate =
      completed > 0 ? (this.metrics.completedAgents / completed) * 100 : 0;
  }

  /**
   * Get metrics
   */
  getMetrics(): SwarmMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset pool
   */
  reset(): void {
    this.agents.clear();
    this.metrics = {
      totalAgents: 0,
      activeAgents: 0,
      completedAgents: 0,
      failedAgents: 0,
      totalRecords: 0,
      totalTime: 0,
      avgTimePerRecord: 0,
      successRate: 0,
    };
  }
}

export { AgentPool };
export const agentPool = new AgentPool();
