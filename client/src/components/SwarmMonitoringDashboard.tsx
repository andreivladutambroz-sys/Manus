import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertCircle, Zap } from "lucide-react";

export interface AgentStatus {
  agentName: string;
  status: "pending" | "running" | "completed" | "error";
  progress: number;
  executionTime: number;
  confidence?: number;
  errorMessage?: string;
}

export interface SwarmMonitoringProps {
  diagnosticId: string;
  agents: AgentStatus[];
  totalDuration?: number;
  coherenceScore?: number;
  isComplete: boolean;
}

export default function SwarmMonitoringDashboard({
  diagnosticId,
  agents,
  totalDuration,
  coherenceScore,
  isComplete,
}: SwarmMonitoringProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (isComplete) return;

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 100);
    }, 100);

    return () => clearInterval(interval);
  }, [isComplete]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "running":
        return <Zap className="w-5 h-5 text-blue-500 animate-pulse" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-50 border-green-200";
      case "running":
        return "bg-blue-50 border-blue-200";
      case "error":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "running":
        return "secondary";
      case "error":
        return "destructive";
      default:
        return "outline";
    }
  };

  const completedAgents = agents.filter((a) => a.status === "completed").length;
  const runningAgents = agents.filter((a) => a.status === "running").length;
  const overallProgress = (completedAgents / agents.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Diagnostic ID
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs font-mono text-gray-500 truncate">{diagnosticId}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Elapsed Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">
              {(elapsedTime / 1000).toFixed(1)}s
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Agents Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">
              {completedAgents}/{agents.length}
            </p>
          </CardContent>
        </Card>

        {coherenceScore !== undefined && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Coherence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold">
                {(coherenceScore * 100).toFixed(0)}%
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Overall Progress</CardTitle>
          <CardDescription>
            {completedAgents} of {agents.length} agents completed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Progress value={overallProgress} className="h-3" />
          <p className="text-sm text-gray-500">
            {overallProgress.toFixed(0)}% complete
          </p>
        </CardContent>
      </Card>

      {/* Agent List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agent Execution</CardTitle>
          <CardDescription>Real-time monitoring of all agents</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {agents.map((agent) => (
            <div
              key={agent.agentName}
              className={`p-4 border rounded-lg transition-colors ${getStatusColor(
                agent.status
              )}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getStatusIcon(agent.status)}
                  <div>
                    <p className="font-medium text-sm">{agent.agentName}</p>
                    <p className="text-xs text-gray-500">
                      {agent.executionTime}ms
                    </p>
                  </div>
                </div>
                <Badge variant={getStatusBadgeVariant(agent.status)}>
                  {agent.status}
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <Progress value={agent.progress} className="h-2" />
                <div className="flex justify-between items-center text-xs text-gray-600">
                  <span>{agent.progress}%</span>
                  {agent.confidence !== undefined && (
                    <span className="text-green-600 font-medium">
                      {(agent.confidence * 100).toFixed(0)}% confidence
                    </span>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {agent.errorMessage && (
                <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-xs text-red-700">
                  {agent.errorMessage}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Status Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">
                {agents.filter((a) => a.status === "completed").length}
              </p>
              <p className="text-xs text-gray-600">Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {agents.filter((a) => a.status === "running").length}
              </p>
              <p className="text-xs text-gray-600">Running</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-600">
                {agents.filter((a) => a.status === "pending").length}
              </p>
              <p className="text-xs text-gray-600">Pending</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">
                {agents.filter((a) => a.status === "error").length}
              </p>
              <p className="text-xs text-gray-600">Errors</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
