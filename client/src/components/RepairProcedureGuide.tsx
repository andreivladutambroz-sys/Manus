import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, CheckCircle, Clock, DollarSign, Wrench, AlertTriangle, Lightbulb, XCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RepairStep {
  stepNumber: number;
  title: string;
  description: string;
  detailedInstructions: string;
  toolsRequired: string[];
  estimatedTimeMinutes: number;
  imageUrl?: string;
  videoUrl?: string;
  warnings: string[];
  tips: string[];
  commonMistakes: string[];
}

interface RepairProcedure {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: "easy" | "moderate" | "difficult" | "expert";
  estimatedTimeMinutes: number;
  estimatedCostMin: number;
  estimatedCostMax: number;
  steps: RepairStep[];
  toolsRequired: string[];
  partsRequired: Array<{ partName: string; partNumber: string; quantity: number; cost: number }>;
  safetyWarnings: string[];
  relatedProcedures: string[];
  errorCodesToFix: string[];
}

interface RepairProcedureGuideProps {
  procedure: RepairProcedure;
  onSessionStart?: (procedureId: string) => void;
  onSessionComplete?: (procedureId: string, sessionData: any) => void;
}

export function RepairProcedureGuide({
  procedure,
  onSessionStart,
  onSessionComplete,
}: RepairProcedureGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionNotes, setSessionNotes] = useState("");
  const [actualTimeSpent, setActualTimeSpent] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  const handleStartSession = () => {
    setSessionStarted(true);
    setStartTime(Date.now());
    onSessionStart?.(procedure.id);
  };

  const handleStepComplete = (stepNumber: number) => {
    if (!completedSteps.includes(stepNumber)) {
      setCompletedSteps([...completedSteps, stepNumber]);
    }
  };

  const handleCompleteSession = () => {
    if (startTime) {
      setActualTimeSpent(Math.floor((Date.now() - startTime) / 60000));
    }
    onSessionComplete?.(procedure.id, {
      completedSteps,
      notes: sessionNotes,
      actualTimeSpent,
    });
  };

  const progressPercent = (completedSteps.length / procedure.steps.length) * 100;
  const difficultyColors = {
    easy: "bg-green-100 text-green-800",
    moderate: "bg-yellow-100 text-yellow-800",
    difficult: "bg-orange-100 text-orange-800",
    expert: "bg-red-100 text-red-800",
  };

  if (!sessionStarted) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{procedure.title}</CardTitle>
              <CardDescription className="mt-2">{procedure.description}</CardDescription>
            </div>
            <Badge className={difficultyColors[procedure.difficulty]}>
              {procedure.difficulty.charAt(0).toUpperCase() + procedure.difficulty.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">Time</span>
              </div>
              <p className="text-lg font-bold">{procedure.estimatedTimeMinutes} min</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">Cost</span>
              </div>
              <p className="text-lg font-bold">€{procedure.estimatedCostMin}-{procedure.estimatedCostMax}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Wrench className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-600">Tools</span>
              </div>
              <p className="text-lg font-bold">{procedure.toolsRequired.length}</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-600">Steps</span>
              </div>
              <p className="text-lg font-bold">{procedure.steps.length}</p>
            </div>
          </div>

          {/* Safety Warnings */}
          {procedure.safetyWarnings.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-red-900 mb-2">Safety Warnings</h4>
                  <ul className="space-y-1">
                    {procedure.safetyWarnings.map((warning, idx) => (
                      <li key={idx} className="text-sm text-red-800">• {warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Tools Required */}
          <div>
            <h4 className="font-semibold mb-3">Tools Required</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {procedure.toolsRequired.map((tool, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-gray-100 rounded">
                  <Checkbox id={`tool-${idx}`} />
                  <label htmlFor={`tool-${idx}`} className="text-sm cursor-pointer">{tool}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Parts Required */}
          {procedure.partsRequired.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">Parts Required</h4>
              <div className="space-y-2">
                {procedure.partsRequired.map((part, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{part.partName}</p>
                      <p className="text-sm text-gray-600">Part #: {part.partNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">€{part.cost}</p>
                      <p className="text-sm text-gray-600">Qty: {part.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Codes */}
          {procedure.errorCodesToFix.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">Fixes Error Codes</h4>
              <div className="flex flex-wrap gap-2">
                {procedure.errorCodesToFix.map((code) => (
                  <Badge key={code} variant="outline">{code}</Badge>
                ))}
              </div>
            </div>
          )}

          <Button onClick={handleStartSession} size="lg" className="w-full">
            Start Repair Session
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Session View
  const step = procedure.steps[currentStep];

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Progress: Step {currentStep + 1} of {procedure.steps.length}</CardTitle>
            <span className="text-sm font-medium">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="mt-2" />
        </CardHeader>
      </Card>

      {/* Current Step */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{step.title}</CardTitle>
          <CardDescription>{step.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="instructions" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="instructions">Instructions</TabsTrigger>
              <TabsTrigger value="tools">Tools</TabsTrigger>
              <TabsTrigger value="warnings">Warnings</TabsTrigger>
              <TabsTrigger value="tips">Tips</TabsTrigger>
              <TabsTrigger value="mistakes">Mistakes</TabsTrigger>
            </TabsList>

            <TabsContent value="instructions" className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <p className="text-base leading-relaxed">{step.detailedInstructions}</p>
              </div>
              {step.imageUrl && (
                <img src={step.imageUrl} alt={step.title} className="w-full rounded-lg max-h-96 object-cover" />
              )}
              {step.videoUrl && (
                <div className="aspect-video rounded-lg overflow-hidden bg-black">
                  <iframe
                    width="100%"
                    height="100%"
                    src={step.videoUrl}
                    title={step.title}
                    frameBorder="0"
                    allowFullScreen
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="tools">
              <div className="space-y-2">
                {step.toolsRequired.map((tool, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-gray-100 rounded">
                    <Checkbox id={`step-tool-${idx}`} />
                    <label htmlFor={`step-tool-${idx}`} className="text-sm cursor-pointer">{tool}</label>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="warnings">
              <div className="space-y-3">
                {step.warnings.map((warning, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-800">{warning}</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="tips">
              <div className="space-y-3">
                {step.tips.map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded">
                    <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-800">{tip}</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="mistakes">
              <div className="space-y-3">
                {step.commonMistakes.map((mistake, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <XCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-yellow-800">{mistake}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Step Completion */}
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <Checkbox
              id="step-complete"
              checked={completedSteps.includes(currentStep)}
              onCheckedChange={() => handleStepComplete(currentStep)}
            />
            <label htmlFor="step-complete" className="text-sm font-medium cursor-pointer">
              Mark this step as complete
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          variant="outline"
        >
          Previous Step
        </Button>
        <Button
          onClick={() => setCurrentStep(Math.min(procedure.steps.length - 1, currentStep + 1))}
          disabled={currentStep === procedure.steps.length - 1}
          className="flex-1"
        >
          Next Step
        </Button>
        {currentStep === procedure.steps.length - 1 && (
          <Button onClick={handleCompleteSession} variant="default" className="bg-green-600 hover:bg-green-700">
            Complete Repair
          </Button>
        )}
      </div>

      {/* Session Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Session Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
            placeholder="Add notes about this repair session..."
            className="w-full p-3 border rounded-lg resize-none"
            rows={4}
          />
        </CardContent>
      </Card>
    </div>
  );
}
