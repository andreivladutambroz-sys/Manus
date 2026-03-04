import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, RotateCcw, Play } from "lucide-react";

export interface AgentConfig {
  agentName: string;
  promptTemplate: string;
  temperature: number;
  maxTokens: number;
  description: string;
}

export interface AgentFineTuningUIProps {
  agents: AgentConfig[];
  onSaveConfig: (agentName: string, config: Partial<AgentConfig>) => void;
  onTestPrompt: (agentName: string, testInput: string) => void;
}

export default function AgentFineTuningUI({
  agents,
  onSaveConfig,
  onTestPrompt,
}: AgentFineTuningUIProps) {
  const [selectedAgent, setSelectedAgent] = useState(agents[0]?.agentName || "");
  const [editedConfigs, setEditedConfigs] = useState<Record<string, Partial<AgentConfig>>>({});
  const [testInput, setTestInput] = useState("");
  const [testResults, setTestResults] = useState<Record<string, string>>({});

  const currentAgent = agents.find((a) => a.agentName === selectedAgent);
  const editedConfig = editedConfigs[selectedAgent] || {};

  const handlePromptChange = (newPrompt: string) => {
    setEditedConfigs((prev) => ({
      ...prev,
      [selectedAgent]: {
        ...prev[selectedAgent],
        promptTemplate: newPrompt,
      },
    }));
  };

  const handleTemperatureChange = (value: number[]) => {
    setEditedConfigs((prev) => ({
      ...prev,
      [selectedAgent]: {
        ...prev[selectedAgent],
        temperature: value[0],
      },
    }));
  };

  const handleMaxTokensChange = (value: number[]) => {
    setEditedConfigs((prev) => ({
      ...prev,
      [selectedAgent]: {
        ...prev[selectedAgent],
        maxTokens: value[0],
      },
    }));
  };

  const handleSave = () => {
    if (editedConfig && selectedAgent) {
      onSaveConfig(selectedAgent, editedConfig);
      setEditedConfigs((prev) => {
        const newConfigs = { ...prev };
        delete newConfigs[selectedAgent];
        return newConfigs;
      });
    }
  };

  const handleReset = () => {
    setEditedConfigs((prev) => {
      const newConfigs = { ...prev };
      delete newConfigs[selectedAgent];
      return newConfigs;
    });
  };

  const handleTestPrompt = () => {
    onTestPrompt(selectedAgent, testInput);
    // Simulate test result
    setTestResults((prev) => ({
      ...prev,
      [selectedAgent]: `Test result for ${selectedAgent} with input: "${testInput.substring(0, 50)}..."`,
    }));
  };

  const temperature = editedConfig.temperature ?? currentAgent?.temperature ?? 0.7;
  const maxTokens = editedConfig.maxTokens ?? currentAgent?.maxTokens ?? 1000;
  const promptTemplate = editedConfig.promptTemplate ?? currentAgent?.promptTemplate ?? "";

  const hasChanges = Object.keys(editedConfig).length > 0;

  return (
    <div className="space-y-6">
      {/* Agent Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select Agent</CardTitle>
          <CardDescription>Choose an agent to fine-tune</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {agents.map((agent) => (
              <Button
                key={agent.agentName}
                variant={selectedAgent === agent.agentName ? "default" : "outline"}
                onClick={() => setSelectedAgent(agent.agentName)}
                className="text-sm"
              >
                {agent.agentName}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {currentAgent && (
        <>
          {/* Agent Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{currentAgent.agentName}</CardTitle>
                  <CardDescription>{currentAgent.description}</CardDescription>
                </div>
                {hasChanges && <Badge variant="secondary">Unsaved Changes</Badge>}
              </div>
            </CardHeader>
          </Card>

          {/* Configuration Tabs */}
          <Tabs defaultValue="prompt" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="prompt">Prompt</TabsTrigger>
              <TabsTrigger value="parameters">Parameters</TabsTrigger>
              <TabsTrigger value="test">Test</TabsTrigger>
            </TabsList>

            {/* Prompt Tab */}
            <TabsContent value="prompt" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Prompt Template</CardTitle>
                  <CardDescription>
                    Edit the prompt that will be sent to Kimi AI
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={promptTemplate}
                    onChange={(e) => handlePromptChange(e.target.value)}
                    placeholder="Enter prompt template..."
                    className="min-h-[300px] font-mono text-sm"
                  />

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                    <p className="font-medium mb-2">💡 Prompt Tips:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Be specific about the task and expected output format</li>
                      <li>Include examples for better results</li>
                      <li>Use clear instructions and numbered steps</li>
                      <li>Specify the language and tone</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Parameters Tab */}
            <TabsContent value="parameters" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Model Parameters</CardTitle>
                  <CardDescription>
                    Adjust temperature and token limits
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Temperature */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium">Temperature</label>
                      <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                        {temperature.toFixed(2)}
                      </span>
                    </div>
                    <Slider
                      value={[temperature]}
                      onValueChange={handleTemperatureChange}
                      min={0}
                      max={2}
                      step={0.1}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-600 mt-2">
                      Lower = more deterministic, Higher = more creative
                    </p>
                  </div>

                  {/* Max Tokens */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium">Max Tokens</label>
                      <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                        {maxTokens}
                      </span>
                    </div>
                    <Slider
                      value={[maxTokens]}
                      onValueChange={handleMaxTokensChange}
                      min={100}
                      max={4000}
                      step={100}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-600 mt-2">
                      Maximum length of the response
                    </p>
                  </div>

                  {/* Parameter Info */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                    <p className="font-medium mb-2">⚙️ Parameter Guide:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Temperature 0.0-0.5: Precise, consistent responses</li>
                      <li>Temperature 0.7-1.0: Balanced creativity and consistency</li>
                      <li>Temperature 1.5+: Very creative, less predictable</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Test Tab */}
            <TabsContent value="test" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Test Prompt</CardTitle>
                  <CardDescription>
                    Test your prompt with sample input
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    placeholder="Enter test input..."
                    className="min-h-[150px]"
                  />

                  <Button
                    onClick={handleTestPrompt}
                    className="w-full"
                    disabled={!testInput.trim()}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Run Test
                  </Button>

                  {testResults[selectedAgent] && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
                      <p className="font-medium text-green-900 mb-2">Test Result:</p>
                      <p className="text-green-800">{testResults[selectedAgent]}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          {hasChanges && (
            <div className="flex gap-2 sticky bottom-0 bg-white p-4 border-t rounded-lg">
              <Button
                onClick={handleSave}
                className="flex-1"
                variant="default"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Discard
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
