import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SwarmMonitoringDashboard, { AgentStatus } from "@/components/SwarmMonitoringDashboard";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";

export default function SwarmMonitoring() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [diagnosticId, setDiagnosticId] = useState("diag-2026-001");
  const [agents, setAgents] = useState<AgentStatus[]>([
    { agentName: "SymptomAnalyzer", status: "completed", progress: 100, executionTime: 1200, confidence: 0.95 },
    { agentName: "HistoryLookup", status: "completed", progress: 100, executionTime: 950, confidence: 0.88 },
    { agentName: "ErrorCodeDecoder", status: "running", progress: 65, executionTime: 0, confidence: undefined },
    { agentName: "ComponentEvaluator", status: "pending", progress: 0, executionTime: 0 },
    { agentName: "RepairProcedure", status: "pending", progress: 0, executionTime: 0 },
    { agentName: "PartsIdentifier", status: "pending", progress: 0, executionTime: 0 },
  ]);
  const [coherenceScore, setCoherenceScore] = useState(0.82);
  const [isComplete, setIsComplete] = useState(false);
  const [totalDuration, setTotalDuration] = useState(3150);

  useEffect(() => {
    // Simulate agent execution
    const interval = setInterval(() => {
      setAgents((prevAgents) => {
        const newAgents = [...prevAgents];
        const runningAgent = newAgents.find((a) => a.status === "running");

        if (runningAgent) {
          runningAgent.progress += Math.random() * 20;
          if (runningAgent.progress >= 100) {
            runningAgent.progress = 100;
            runningAgent.status = "completed";
            runningAgent.executionTime = Math.floor(800 + Math.random() * 400);
            runningAgent.confidence = 0.85 + Math.random() * 0.15;

            // Start next agent
            const nextAgent = newAgents.find((a) => a.status === "pending");
            if (nextAgent) {
              nextAgent.status = "running";
            }
          }
        }

        return newAgents;
      });

      setTotalDuration((prev) => prev + 100);
    }, 500);

    // Check if all agents are complete
    const allComplete = agents.every((a) => a.status === "completed" || a.status === "error");
    if (allComplete && agents.some((a) => a.status === "completed")) {
      setIsComplete(true);
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/dashboard")}
              className="text-white hover:bg-slate-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Swarm Monitoring</h1>
              <p className="text-slate-400">Real-time diagnostic execution tracking</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="text-white border-slate-600 hover:bg-slate-700"
          >
            <RefreshCw className="w-5 h-5" />
          </Button>
        </div>

        {/* Main Monitoring Dashboard */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <SwarmMonitoringDashboard
            diagnosticId={diagnosticId}
            agents={agents}
            totalDuration={totalDuration}
            coherenceScore={coherenceScore}
            isComplete={isComplete}
          />
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-200">Parallel Speedup</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-400">4.67x</p>
              <p className="text-xs text-slate-400">vs sequential execution</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-200">Cache Hit Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-400">68%</p>
              <p className="text-xs text-slate-400">similar diagnostics cached</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-200">Avg Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-400">1.2s</p>
              <p className="text-xs text-slate-400">with caching optimization</p>
            </CardContent>
          </Card>
        </div>

        {/* Status Messages */}
        {isComplete && (
          <Card className="bg-green-900 border-green-700">
            <CardHeader>
              <CardTitle className="text-green-100">Diagnostic Complete</CardTitle>
              <CardDescription className="text-green-200">
                All agents have finished execution. Results are ready for review.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setLocation(`/diagnostic/${diagnosticId}`)}
                className="bg-green-600 hover:bg-green-700"
              >
                View Results
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
