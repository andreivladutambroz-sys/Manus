import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import AgentFineTuningUI, { AgentConfig } from "@/components/AgentFineTuningUI";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const DEFAULT_AGENTS: AgentConfig[] = [
  {
    agentName: "SymptomAnalyzer",
    description: "Analyzes vehicle symptoms and identifies affected systems",
    promptTemplate: `Ești expert în diagnosticul vehiculelor. Analizează simptomele și identifică:
1. Sisteme afectate
2. Cauze potențiale
3. Gradul de urgență
4. Teste recomandate

Răspunde în format JSON cu câmpurile: systems, causes, urgency, tests`,
    temperature: 0.7,
    maxTokens: 1000,
  },
  {
    agentName: "ErrorCodeDecoder",
    description: "Decodes OBD-II error codes and explains their meaning",
    promptTemplate: `Ești expert în coduri OBD-II. Decodifică codul și explică:
1. Semnificația codului
2. Sistemul afectat
3. Cauze comune
4. Procedură de diagnosticare

Răspunde în format JSON cu câmpurile: meaning, system, causes, procedure`,
    temperature: 0.5,
    maxTokens: 800,
  },
  {
    agentName: "ComponentEvaluator",
    description: "Evaluates vehicle components and their condition",
    promptTemplate: `Ești expert în evaluarea componentelor auto. Evaluează:
1. Starea componentei
2. Probabilitate de defect
3. Timp de viață rămas
4. Recomandări de înlocuire

Răspunde în format JSON cu câmpurile: condition, defectProbability, lifespan, recommendation`,
    temperature: 0.6,
    maxTokens: 900,
  },
  {
    agentName: "RepairProcedure",
    description: "Provides step-by-step repair procedures",
    promptTemplate: `Ești expert în proceduri de reparație. Furnizează:
1. Pași detaliați de reparație
2. Echipament necesar
3. Timp estimat
4. Precauții de siguranță

Răspunde în format JSON cu câmpurile: steps, equipment, estimatedTime, safety`,
    temperature: 0.4,
    maxTokens: 1200,
  },
  {
    agentName: "PartsIdentifier",
    description: "Identifies parts and provides pricing information",
    promptTemplate: `Ești expert în piese auto. Identifică și furnizează:
1. Denumirea piesei
2. Codul OEM
3. Preț estimat
4. Furnizori disponibili

Răspunde în format JSON cu câmpurile: partName, oemCode, estimatedPrice, suppliers`,
    temperature: 0.5,
    maxTokens: 800,
  },
];

export default function AgentFineTuning() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [agents, setAgents] = useState<AgentConfig[]>(DEFAULT_AGENTS);
  const [savedConfigs, setSavedConfigs] = useState<Record<string, AgentConfig>>({});

  const handleSaveConfig = (agentName: string, config: Partial<AgentConfig>) => {
    setAgents((prevAgents) =>
      prevAgents.map((agent) =>
        agent.agentName === agentName
          ? { ...agent, ...config }
          : agent
      )
    );

    setSavedConfigs((prev) => ({
      ...prev,
      [agentName]: {
        ...agents.find((a) => a.agentName === agentName)!,
        ...config,
      },
    }));

    toast.success(`${agentName} configuration saved!`);
  };

  const handleTestPrompt = (agentName: string, testInput: string) => {
    toast.info(`Testing ${agentName} with: "${testInput.substring(0, 30)}..."`);
    // In production, this would call the backend to test the prompt
  };

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
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/dashboard")}
            className="text-white hover:bg-slate-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Agent Fine-tuning</h1>
            <p className="text-slate-400">Customize prompts and parameters for each agent</p>
          </div>
        </div>

        {/* Fine-tuning UI */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <AgentFineTuningUI
            agents={agents}
            onSaveConfig={handleSaveConfig}
            onTestPrompt={handleTestPrompt}
          />
        </div>

        {/* Saved Configurations */}
        {Object.keys(savedConfigs).length > 0 && (
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-lg font-bold text-white mb-4">Saved Configurations</h2>
            <div className="space-y-2">
              {Object.entries(savedConfigs).map(([agentName, config]) => (
                <div
                  key={agentName}
                  className="flex items-center justify-between p-3 bg-slate-700 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-white">{agentName}</p>
                    <p className="text-sm text-slate-400">
                      Temperature: {config.temperature} | Max Tokens: {config.maxTokens}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-300 hover:text-white"
                    onClick={() => {
                      toast.info(`Loaded ${agentName} configuration`);
                    }}
                  >
                    Load
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="bg-blue-900 border border-blue-700 rounded-lg p-4 text-blue-100">
          <p className="font-medium mb-2">💡 Fine-tuning Tips:</p>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li>Lower temperature (0.3-0.5) for consistent, factual responses</li>
            <li>Higher temperature (0.8-1.2) for creative, diverse responses</li>
            <li>Test your prompts with real diagnostic data</li>
            <li>Save configurations for reuse across multiple diagnostics</li>
            <li>Monitor accuracy and coherence scores to optimize performance</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
