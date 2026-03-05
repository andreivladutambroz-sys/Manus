/**
 * Wave-Based Executor
 * Executes agents in sequential waves to manage memory
 */

import { agentPool, type AgentConfig } from "./agent-pool";

export interface Wave {
  id: number;
  name: string;
  agents: AgentConfig[];
  status: "pending" | "running" | "completed" | "failed";
  startTime?: number;
  endTime?: number;
  recordsCollected: number;
}

class WaveExecutor {
  private waves: Wave[] = [];
  private currentWaveIndex: number = -1;

  /**
   * Create wave
   */
  createWave(name: string, agents: AgentConfig[]): Wave {
    const wave: Wave = {
      id: this.waves.length + 1,
      name,
      agents,
      status: "pending",
      recordsCollected: 0,
    };

    this.waves.push(wave);
    return wave;
  }

  /**
   * Execute all waves sequentially
   */
  async executeAllWaves(
    onProgress?: (wave: Wave, progress: number) => void
  ): Promise<Wave[]> {
    for (let i = 0; i < this.waves.length; i++) {
      this.currentWaveIndex = i;
      const wave = this.waves[i];

      try {
        await this.executeWave(wave, (progress) => {
          if (onProgress) onProgress(wave, progress);
        });
      } catch (error) {
        console.error(`Wave ${wave.id} failed:`, error);
        wave.status = "failed";
      }
    }

    return this.waves;
  }

  /**
   * Execute single wave
   */
  async executeWave(wave: Wave, onProgress?: (progress: number) => void): Promise<void> {
    wave.status = "running";
    wave.startTime = Date.now();

    const totalAgents = wave.agents.length;
    let completedAgents = 0;

    for (const agent of wave.agents) {
      try {
        agentPool.startAgent(agent.id);

        // Simulate agent work (in real implementation, this would call actual collector)
        const recordsProcessed = Math.floor(Math.random() * 1000) + 500;
        await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate work

        agentPool.completeAgent(agent.id, recordsProcessed);
        wave.recordsCollected += recordsProcessed;

        completedAgents++;
        if (onProgress) {
          onProgress((completedAgents / totalAgents) * 100);
        }
      } catch (error) {
        console.error(`Agent ${agent.id} failed:`, error);
        agentPool.failAgent(agent.id, error instanceof Error ? error.message : String(error));
      }
    }

    wave.status = "completed";
    wave.endTime = Date.now();
  }

  /**
   * Get current wave
   */
  getCurrentWave(): Wave | undefined {
    return this.waves[this.currentWaveIndex];
  }

  /**
   * Get all waves
   */
  getAllWaves(): Wave[] {
    return [...this.waves];
  }

  /**
   * Get wave by id
   */
  getWave(id: number): Wave | undefined {
    return this.waves.find((w) => w.id === id);
  }

  /**
   * Get execution summary
   */
  getSummary(): {
    totalWaves: number;
    completedWaves: number;
    failedWaves: number;
    totalRecords: number;
    totalTime: number;
  } {
    const completedWaves = this.waves.filter((w) => w.status === "completed").length;
    const failedWaves = this.waves.filter((w) => w.status === "failed").length;
    const totalRecords = this.waves.reduce((sum, w) => sum + w.recordsCollected, 0);
    const totalTime = this.waves.reduce((sum, w) => {
      if (w.startTime && w.endTime) {
        return sum + (w.endTime - w.startTime);
      }
      return sum;
    }, 0);

    return {
      totalWaves: this.waves.length,
      completedWaves,
      failedWaves,
      totalRecords,
      totalTime,
    };
  }

  /**
   * Reset executor
   */
  reset(): void {
    this.waves = [];
    this.currentWaveIndex = -1;
  }
}

export { WaveExecutor };
export const waveExecutor = new WaveExecutor();
