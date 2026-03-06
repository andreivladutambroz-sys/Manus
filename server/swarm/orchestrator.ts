import { runAgent, type CollectionTask, type CollectionResult, type AgentType } from './agents';

export interface SwarmConfig {
  totalAgents: number;
  agentsPerType: number;
  tasksPerAgent: number;
  searchQueries: string[];
}

export interface SwarmStats {
  totalAgents: number;
  tasksCompleted: number;
  totalCollected: number;
  totalFailed: number;
  totalDuplicates: number;
  successRate: number;
  duration: number;
  timestamp: Date;
}

const AGENT_TYPES: AgentType[] = ['forum', 'reddit', 'manual', 'obd', 'blog', 'video'];

export async function orchestrateSwarm(config: SwarmConfig): Promise<SwarmStats> {
  const startTime = Date.now();
  const results: CollectionResult[] = [];

  console.log(`\n🚀 SWARM ORCHESTRATION STARTING`);
  console.log(`📊 Configuration:`);
  console.log(`   Total Agents: ${config.totalAgents}`);
  console.log(`   Agents per Type: ${config.agentsPerType}`);
  console.log(`   Tasks per Agent: ${config.tasksPerAgent}`);
  console.log(`   Search Queries: ${config.searchQueries.length}`);

  // Create tasks for all agents
  const tasks: CollectionTask[] = [];
  let taskId = 0;

  for (let i = 0; i < config.totalAgents; i++) {
    const agentType = AGENT_TYPES[i % AGENT_TYPES.length];
    for (let j = 0; j < config.tasksPerAgent; j++) {
      const query = config.searchQueries[Math.floor(Math.random() * config.searchQueries.length)];
      tasks.push({
        id: `task-${taskId++}`,
        agentType,
        searchQuery: query,
        targetCount: 5,
        priority: Math.floor(Math.random() * 10)
      });
    }
  }

  console.log(`\n📋 Total Tasks Generated: ${tasks.length}`);
  console.log(`⏳ Running ${config.totalAgents} agents in parallel...`);

  // Run agents in parallel (batches of 50)
  const batchSize = 50;
  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, Math.min(i + batchSize, tasks.length));
    const batchPromises = batch.map(task => runAgent(task.agentType, task));
    
    try {
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      const progress = Math.min(i + batchSize, tasks.length);
      console.log(`   Progress: ${progress}/${tasks.length} tasks completed`);
    } catch (err) {
      console.error(`   Batch error: ${err}`);
    }
  }

  // Calculate statistics
  const totalCollected = results.reduce((sum, r) => sum + r.collected, 0);
  const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
  const totalDuplicates = results.reduce((sum, r) => sum + r.duplicates, 0);
  const successCount = results.filter(r => r.status === 'success').length;
  const successRate = (successCount / results.length) * 100;
  const duration = Date.now() - startTime;

  const stats: SwarmStats = {
    totalAgents: config.totalAgents,
    tasksCompleted: results.length,
    totalCollected,
    totalFailed,
    totalDuplicates,
    successRate,
    duration,
    timestamp: new Date()
  };

  return stats;
}

export async function runFullSwarm(): Promise<SwarmStats> {
  const config: SwarmConfig = {
    totalAgents: 200,
    agentsPerType: 33, // 200 / 6 types
    tasksPerAgent: 2,
    searchQueries: [
      'P0171 system too lean',
      'P0300 random misfire',
      'P0401 EGR flow',
      'P0420 catalyst efficiency',
      'P0505 idle control',
      'P0606 PCM error',
      'P0700 transmission fault',
      'P0741 fan control',
      'P0800 transmission control',
      'P0900 clutch control',
      'BMW 3 Series diagnostic',
      'Honda Civic repair',
      'Toyota Camry maintenance',
      'Ford F-150 issues',
      'Volkswagen Golf problems',
      'Audi A4 service',
      'Mercedes C-Class repair',
      'Hyundai Elantra diagnostic',
      'Mazda CX-5 issues',
      'Nissan Altima problems'
    ]
  };

  return orchestrateSwarm(config);
}

export function printSwarmStats(stats: SwarmStats): void {
  console.log(`\n✅ SWARM EXECUTION COMPLETE\n`);
  console.log(`📊 RESULTS:`);
  console.log(`   Total Agents: ${stats.totalAgents}`);
  console.log(`   Tasks Completed: ${stats.tasksCompleted}`);
  console.log(`   Total Collected: ${stats.totalCollected}`);
  console.log(`   Failed: ${stats.totalFailed}`);
  console.log(`   Duplicates: ${stats.totalDuplicates}`);
  console.log(`   Success Rate: ${stats.successRate.toFixed(1)}%`);
  console.log(`   Duration: ${(stats.duration / 1000).toFixed(2)}s`);
  console.log(`   Timestamp: ${stats.timestamp.toISOString()}`);
  console.log(`\n💾 Data ready for pipeline processing...`);
}
