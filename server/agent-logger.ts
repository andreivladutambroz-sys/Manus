/**
 * Agent Logger
 * Real-time logging și tracking pentru execuția agenților
 */

export interface AgentLogEntry {
  agentName: string;
  timestamp: number;
  status: "pending" | "running" | "completed" | "error";
  progress: number; // 0-100
  executionTime: number;
  confidence?: number;
  errorMessage?: string;
  analysisPreview?: string;
}

export interface SwarmExecutionLog {
  diagnosticId: string;
  startTime: number;
  endTime?: number;
  totalDuration?: number;
  complexity: "simple" | "moderate" | "complex";
  agentLogs: AgentLogEntry[];
  coherenceScore?: number;
  coherenceIssues?: string[];
  synthesizedConclusion?: string;
  fallbackUsed: boolean;
}

// In-memory store pentru logs (în producție, folosiți Redis/Database)
const executionLogs = new Map<string, SwarmExecutionLog>();

/**
 * Creează log entry pentru diagnostic
 */
export function createExecutionLog(
  diagnosticId: string,
  complexity: "simple" | "moderate" | "complex",
  agentCount: number
): SwarmExecutionLog {
  const log: SwarmExecutionLog = {
    diagnosticId,
    startTime: Date.now(),
    complexity,
    agentLogs: Array.from({ length: agentCount }, (_, i) => ({
      agentName: `Agent${i + 1}`,
      timestamp: Date.now(),
      status: "pending" as const,
      progress: 0,
      executionTime: 0,
    })),
    fallbackUsed: false,
  };

  executionLogs.set(diagnosticId, log);
  return log;
}

/**
 * Actualizează status agent
 */
export function updateAgentStatus(
  diagnosticId: string,
  agentName: string,
  status: "pending" | "running" | "completed" | "error",
  progress: number = 0,
  errorMessage?: string
): void {
  const log = executionLogs.get(diagnosticId);
  if (!log) return;

  const agentLog = log.agentLogs.find((a) => a.agentName === agentName);
  if (agentLog) {
    agentLog.status = status;
    agentLog.progress = progress;
    agentLog.timestamp = Date.now();
    if (errorMessage) {
      agentLog.errorMessage = errorMessage;
    }
  }
}

/**
 * Finalizează execuție agent
 */
export function completeAgent(
  diagnosticId: string,
  agentName: string,
  executionTime: number,
  confidence: number,
  analysisPreview?: string
): void {
  const log = executionLogs.get(diagnosticId);
  if (!log) return;

  const agentLog = log.agentLogs.find((a) => a.agentName === agentName);
  if (agentLog) {
    agentLog.status = "completed";
    agentLog.progress = 100;
    agentLog.executionTime = executionTime;
    agentLog.confidence = confidence;
    agentLog.analysisPreview = analysisPreview?.substring(0, 200);
    agentLog.timestamp = Date.now();
  }
}

/**
 * Finalizează diagnostic
 */
export function completeDiagnostic(
  diagnosticId: string,
  coherenceScore: number,
  coherenceIssues: string[],
  synthesizedConclusion: string,
  fallbackUsed: boolean = false
): SwarmExecutionLog | undefined {
  const log = executionLogs.get(diagnosticId);
  if (!log) return;

  log.endTime = Date.now();
  log.totalDuration = log.endTime - log.startTime;
  log.coherenceScore = coherenceScore;
  log.coherenceIssues = coherenceIssues;
  log.synthesizedConclusion = synthesizedConclusion;
  log.fallbackUsed = fallbackUsed;

  return log;
}

/**
 * Obține log pentru diagnostic
 */
export function getExecutionLog(diagnosticId: string): SwarmExecutionLog | undefined {
  return executionLogs.get(diagnosticId);
}

/**
 * Obține toți logs
 */
export function getAllExecutionLogs(): SwarmExecutionLog[] {
  return Array.from(executionLogs.values());
}

/**
 * Șterge log după finalizare (după 1 oră)
 */
export function cleanupOldLogs(maxAgeMs: number = 3600000): void {
  const now = Date.now();
  const keysToDelete: string[] = [];

  executionLogs.forEach((log, key) => {
    if (log.endTime && now - log.endTime > maxAgeMs) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach((key) => executionLogs.delete(key));
}

/**
 * Formatează log pentru afișare
 */
export function formatExecutionLog(log: SwarmExecutionLog): string {
  const lines: string[] = [
    `=== DIAGNOSTIC EXECUTION LOG ===`,
    `Diagnostic ID: ${log.diagnosticId}`,
    `Complexity: ${log.complexity}`,
    `Duration: ${log.totalDuration ? log.totalDuration + "ms" : "In progress"}`,
    `Fallback Used: ${log.fallbackUsed ? "Yes" : "No"}`,
    `Coherence Score: ${log.coherenceScore || "N/A"}`,
    "",
    "=== AGENT EXECUTION ===",
  ];

  log.agentLogs.forEach((agent) => {
    lines.push(`${agent.agentName}:`);
    lines.push(`  Status: ${agent.status}`);
    lines.push(`  Progress: ${agent.progress}%`);
    lines.push(`  Execution Time: ${agent.executionTime}ms`);
    if (agent.confidence) {
      lines.push(`  Confidence: ${(agent.confidence * 100).toFixed(1)}%`);
    }
    if (agent.errorMessage) {
      lines.push(`  Error: ${agent.errorMessage}`);
    }
    lines.push("");
  });

  if (log.coherenceIssues && log.coherenceIssues.length > 0) {
    lines.push("=== COHERENCE ISSUES ===");
    log.coherenceIssues.forEach((issue) => lines.push(`- ${issue}`));
    lines.push("");
  }

  if (log.synthesizedConclusion) {
    lines.push("=== SYNTHESIZED CONCLUSION ===");
    lines.push(log.synthesizedConclusion.substring(0, 300) + "...");
  }

  return lines.join("\n");
}

/**
 * Calculează statistici din logs
 */
export function calculateLogStatistics(): {
  totalDiagnostics: number;
  averageDuration: number;
  averageCoherence: number;
  fallbackRate: number;
  agentSuccessRate: Record<string, number>;
} {
  const logs = Array.from(executionLogs.values());

  if (logs.length === 0) {
    return {
      totalDiagnostics: 0,
      averageDuration: 0,
      averageCoherence: 0,
      fallbackRate: 0,
      agentSuccessRate: {},
    };
  }

  const totalDuration = logs.reduce((sum, log) => sum + (log.totalDuration || 0), 0);
  const totalCoherence = logs.reduce((sum, log) => sum + (log.coherenceScore || 0), 0);
  const fallbackCount = logs.filter((log) => log.fallbackUsed).length;

  // Calculează success rate per agent
  const agentSuccessRate: Record<string, number> = {};
  logs.forEach((log) => {
    log.agentLogs.forEach((agent) => {
      if (!agentSuccessRate[agent.agentName]) {
        agentSuccessRate[agent.agentName] = 0;
      }
      if (agent.status === "completed") {
        agentSuccessRate[agent.agentName]++;
      }
    });
  });

  Object.keys(agentSuccessRate).forEach((agent) => {
    agentSuccessRate[agent] = agentSuccessRate[agent] / logs.length;
  });

  return {
    totalDiagnostics: logs.length,
    averageDuration: totalDuration / logs.length,
    averageCoherence: totalCoherence / logs.length,
    fallbackRate: fallbackCount / logs.length,
    agentSuccessRate,
  };
}
