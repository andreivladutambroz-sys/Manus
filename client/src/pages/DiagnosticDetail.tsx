import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import {
  Download, ArrowLeft, CheckCircle2, AlertTriangle, XCircle,
  Wrench, Search, Shield, Clock, Zap, ChevronRight, ChevronDown,
  Target, ListChecks, Package, FileText, Brain, Activity,
  Gauge, Info, ArrowRight, CircleDot, TriangleAlert, CircleCheck,
  MessageSquare
} from "lucide-react";

// ============================================================
// TYPES (matching DiagnosticReport from orchestrator)
// ============================================================

interface ProbableCause {
  id: string;
  cause: string;
  accuracy: number;
  severity: "critical" | "high" | "medium" | "low";
  system: string;
  explanation: string;
  sources: string[];
  validatedBy: string[];
}

interface EliminationStep {
  stepNumber: number;
  action: string;
  expectedResult: string;
  ifPositive: string;
  ifNegative: string;
  toolsNeeded: string[];
  estimatedTime: string;
  relatedCauseId: string;
}

interface RepairStep {
  stepNumber: number;
  description: string;
  details: string;
  torqueSpecs?: string;
  precautions?: string[];
  estimatedTime: string;
  difficulty: number;
  tools: string[];
}

interface RepairPart {
  name: string;
  oemCode: string;
  aftermarketCode?: string;
  estimatedPrice: { min: number; max: number; currency: string };
  action: "replace" | "repair" | "clean" | "adjust";
  availability: "in_stock" | "order" | "rare";
}

interface ValidationResult {
  isValid: boolean;
  coherenceScore: number;
  logicScore: number;
  overallAccuracy: number;
  issues: Array<{
    type: string;
    description: string;
    severity: "critical" | "warning" | "info";
    affectedAgents: string[];
    suggestedFix?: string;
  }>;
  corrections: string[];
}

interface DiagnosticReport {
  id: string;
  probableCauses: ProbableCause[];
  eliminationSteps: EliminationStep[];
  repairSteps: RepairStep[];
  parts: RepairPart[];
  totalEstimatedCost: { min: number; max: number; currency: string };
  totalEstimatedTime: string;
  overallDifficulty: number;
  validation: ValidationResult;
  agentExecutionLog: Array<{
    agentName: string;
    layer: number;
    status: string;
    confidence: number;
  }>;
  totalExecutionTime: number;
  swarmMode: string;
  timestamp: string;
}

// ============================================================
// HELPERS
// ============================================================

function getSeverityColor(severity: string) {
  switch (severity) {
    case "critical": return "bg-red-500 text-white";
    case "high": return "bg-orange-500 text-white";
    case "medium": return "bg-yellow-500 text-white";
    case "low": return "bg-green-500 text-white";
    default: return "bg-slate-500 text-white";
  }
}

function getSeverityLabel(severity: string) {
  switch (severity) {
    case "critical": return "Critic";
    case "high": return "Ridicat";
    case "medium": return "Mediu";
    case "low": return "Scăzut";
    default: return severity;
  }
}

function getDifficultyStars(difficulty: number) {
  return Array.from({ length: 5 }, (_, i) => (
    <span key={i} className={i < difficulty ? "text-orange-500" : "text-slate-300"}>
      {i < difficulty ? "★" : "☆"}
    </span>
  ));
}

function getActionLabel(action: string) {
  switch (action) {
    case "replace": return "Înlocuire";
    case "repair": return "Reparare";
    case "clean": return "Curățare";
    case "adjust": return "Reglare";
    default: return action;
  }
}

function getAvailabilityBadge(availability: string) {
  switch (availability) {
    case "in_stock": return <Badge className="bg-green-100 text-green-700">În Stoc</Badge>;
    case "order": return <Badge className="bg-yellow-100 text-yellow-700">Comandă</Badge>;
    case "rare": return <Badge className="bg-red-100 text-red-700">Rar</Badge>;
    default: return <Badge variant="secondary">{availability}</Badge>;
  }
}

function getAccuracyColor(accuracy: number) {
  if (accuracy >= 80) return "text-green-600";
  if (accuracy >= 60) return "text-yellow-600";
  return "text-red-600";
}

function getAccuracyBgColor(accuracy: number) {
  if (accuracy >= 80) return "bg-green-500";
  if (accuracy >= 60) return "bg-yellow-500";
  return "bg-red-500";
}

// ============================================================
// COMPONENT
// ============================================================

export default function DiagnosticDetail() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const params = useParams();
  const diagnosticId = parseInt(params.id || "0");
  const [expandedCause, setExpandedCause] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const { data: diagnostic, isLoading } = trpc.diagnostic.get.useQuery({ id: diagnosticId });
  const { data: vehicle } = trpc.vehicle.get.useQuery(
    { id: diagnostic?.vehicleId || 0 },
    { enabled: !!diagnostic?.vehicleId }
  );
  const exportPDF = trpc.export.pdf.useMutation();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="w-12 h-12 mx-auto text-slate-400 mb-4" />
            <p className="text-lg text-slate-600 mb-4">Autentificați-vă pentru a vedea diagnosticul</p>
            <Button onClick={() => navigate("/")}>Pagina Principală</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <Brain className="w-12 h-12 mx-auto text-orange-500 animate-pulse mb-4" />
          <p className="text-slate-600">Se încarcă diagnosticul...</p>
        </div>
      </div>
    );
  }

  if (!diagnostic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
            <p className="text-lg text-slate-600 mb-4">Diagnostic negăsit</p>
            <Button onClick={() => navigate("/dashboard")}>Înapoi la Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const report = diagnostic.kimiResponse as unknown as DiagnosticReport | null;

  const handleExportPDF = async () => {
    try {
      toast.info("Generare raport PDF...");
      const result = await exportPDF.mutateAsync({ diagnosticId: diagnostic.id });
      window.open(result.url, "_blank");
      toast.success("Raport PDF generat cu succes!");
    } catch {
      toast.error("Eroare la generarea PDF");
    }
  };

  const toggleStep = (stepNum: number) => {
    const newSet = new Set(completedSteps);
    if (newSet.has(stepNum)) {
      newSet.delete(stepNum);
    } else {
      newSet.add(stepNum);
    }
    setCompletedSteps(newSet);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 max-w-5xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {vehicle?.brand} {vehicle?.model} ({vehicle?.year})
                </h1>
                <p className="text-sm text-slate-500">
                  {vehicle?.engine && `Motor: ${vehicle.engine}`}
                  {vehicle?.mileage && ` | ${vehicle.mileage.toLocaleString()} km`}
                  {vehicle?.vin && ` | VIN: ${vehicle.vin}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={diagnostic.status === "completed" ? "bg-green-500 text-white" : "bg-yellow-500 text-white"}>
                {diagnostic.status === "completed" ? "Finalizat" : diagnostic.status}
              </Badge>
              <Button onClick={handleExportPDF} size="sm" className="bg-orange-500 hover:bg-orange-600">
                <Download className="w-4 h-4 mr-1" />
                PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Accuracy Overview Card */}
        {report?.validation && (
          <Card className="mb-6 overflow-hidden">
            <div className={`p-6 text-white ${getAccuracyBgColor(report.validation.overallAccuracy)} bg-gradient-to-r`}>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                <div className="col-span-2 md:col-span-1">
                  <div className="w-20 h-20 mx-auto rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-3xl font-bold">{report.validation.overallAccuracy}%</span>
                  </div>
                  <p className="text-sm mt-2 opacity-90">Acuratețe Generală</p>
                </div>
                <div>
                  <Gauge className="w-8 h-8 mx-auto mb-1 opacity-80" />
                  <p className="text-2xl font-bold">{report.validation.coherenceScore}%</p>
                  <p className="text-xs opacity-80">Coerență</p>
                </div>
                <div>
                  <Brain className="w-8 h-8 mx-auto mb-1 opacity-80" />
                  <p className="text-2xl font-bold">{report.validation.logicScore}%</p>
                  <p className="text-xs opacity-80">Logică</p>
                </div>
                <div>
                  <Target className="w-8 h-8 mx-auto mb-1 opacity-80" />
                  <p className="text-2xl font-bold">{report.probableCauses?.length || 0}</p>
                  <p className="text-xs opacity-80">Cauze</p>
                </div>
                <div>
                  <Activity className="w-8 h-8 mx-auto mb-1 opacity-80" />
                  <p className="text-2xl font-bold">{report.swarmMode === "full" ? "Full" : report.swarmMode === "optimized" ? "Optim" : "Fallback"}</p>
                  <p className="text-xs opacity-80">Mod Swarm</p>
                </div>
              </div>
            </div>

            {/* Validation Issues */}
            {report.validation.issues && report.validation.issues.length > 0 && (
              <CardContent className="pt-4">
                <p className="text-sm font-semibold text-slate-700 mb-2">Observații Validare:</p>
                <div className="space-y-2">
                  {report.validation.issues.map((issue, idx) => (
                    <div key={idx} className={`flex items-start gap-2 p-2 rounded-lg text-sm ${
                      issue.severity === "critical" ? "bg-red-50 text-red-700" :
                      issue.severity === "warning" ? "bg-yellow-50 text-yellow-700" :
                      "bg-blue-50 text-blue-700"
                    }`}>
                      {issue.severity === "critical" ? <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> :
                       issue.severity === "warning" ? <TriangleAlert className="w-4 h-4 mt-0.5 flex-shrink-0" /> :
                       <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                      <div>
                        <p>{issue.description}</p>
                        {issue.suggestedFix && <p className="text-xs mt-1 opacity-80">Sugestie: {issue.suggestedFix}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Symptoms Recap */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-500" />
              Simptome Raportate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700">{diagnostic.symptomsText}</p>
            {diagnostic.symptomsSelected && (diagnostic.symptomsSelected as string[]).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {(diagnostic.symptomsSelected as string[]).map((s: string) => (
                  <Badge key={s} variant="secondary">{s}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        {report && (
          <Tabs defaultValue="causes" className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="causes" className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                <span className="hidden md:inline">Cauze</span>
              </TabsTrigger>
              <TabsTrigger value="elimination" className="flex items-center gap-1">
                <Search className="w-4 h-4" />
                <span className="hidden md:inline">Eliminare</span>
              </TabsTrigger>
              <TabsTrigger value="repair" className="flex items-center gap-1">
                <Wrench className="w-4 h-4" />
                <span className="hidden md:inline">Reparație</span>
              </TabsTrigger>
              <TabsTrigger value="parts" className="flex items-center gap-1">
                <Package className="w-4 h-4" />
                <span className="hidden md:inline">Piese</span>
              </TabsTrigger>
            </TabsList>

            {/* ═══ TAB: CAUZE PROBABILE ═══ */}
            <TabsContent value="causes" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Target className="w-6 h-6 text-orange-500" />
                Cauze Probabile
              </h2>

              {report.probableCauses?.map((cause, idx) => (
                <Card key={cause.id || idx} className="overflow-hidden transition-all hover:shadow-md">
                  <button
                    className="w-full text-left"
                    onClick={() => setExpandedCause(expandedCause === cause.id ? null : cause.id)}
                  >
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-4">
                        {/* Rank */}
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-orange-600 font-bold">#{idx + 1}</span>
                        </div>

                        {/* Main Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-900 truncate">{cause.cause}</h3>
                            <Badge className={getSeverityColor(cause.severity)}>
                              {getSeverityLabel(cause.severity)}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-500">{cause.system}</p>
                        </div>

                        {/* Accuracy */}
                        <div className="text-right flex-shrink-0">
                          <p className={`text-2xl font-bold ${getAccuracyColor(cause.accuracy)}`}>
                            {cause.accuracy}%
                          </p>
                          <p className="text-xs text-slate-400">probabilitate</p>
                        </div>

                        {/* Expand */}
                        {expandedCause === cause.id
                          ? <ChevronDown className="w-5 h-5 text-slate-400" />
                          : <ChevronRight className="w-5 h-5 text-slate-400" />
                        }
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3">
                        <Progress value={cause.accuracy} className="h-2" />
                      </div>
                    </CardContent>
                  </button>

                  {/* Expanded Details */}
                  {expandedCause === cause.id && (
                    <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-700 mb-1">Explicație:</p>
                        <p className="text-sm text-slate-600">{cause.explanation}</p>
                      </div>
                      <div className="flex gap-4">
                        <div>
                          <p className="text-xs font-semibold text-slate-500 mb-1">Surse analiză:</p>
                          <div className="flex flex-wrap gap-1">
                            {cause.sources?.map(s => (
                              <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-500 mb-1">Validat de:</p>
                          <div className="flex flex-wrap gap-1">
                            {cause.validatedBy?.map(v => (
                              <Badge key={v} variant="outline" className="text-xs bg-green-50 text-green-700">{v}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </TabsContent>

            {/* ═══ TAB: WORKFLOW ELIMINARE ═══ */}
            <TabsContent value="elimination" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Search className="w-6 h-6 text-blue-500" />
                Workflow Eliminare Pas-cu-Pas
              </h2>
              <p className="text-sm text-slate-500 mb-4">
                Urmați pașii în ordine pentru a identifica cauza exactă. Bifați fiecare pas pe măsură ce îl finalizați.
              </p>

              {report.eliminationSteps?.map((step, idx) => (
                <Card
                  key={step.stepNumber || idx}
                  className={`overflow-hidden transition-all ${
                    completedSteps.has(step.stepNumber) ? "border-green-300 bg-green-50/50" : ""
                  }`}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-4">
                      {/* Step Number / Checkbox */}
                      <button
                        onClick={() => toggleStep(step.stepNumber)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                          completedSteps.has(step.stepNumber)
                            ? "bg-green-500 text-white"
                            : "bg-blue-100 text-blue-600"
                        }`}
                      >
                        {completedSteps.has(step.stepNumber)
                          ? <CircleCheck className="w-6 h-6" />
                          : <span className="font-bold">{step.stepNumber}</span>
                        }
                      </button>

                      <div className="flex-1 space-y-3">
                        {/* Action */}
                        <div>
                          <h3 className={`font-semibold ${completedSteps.has(step.stepNumber) ? "text-green-700 line-through" : "text-slate-900"}`}>
                            {step.action}
                          </h3>
                        </div>

                        {/* Expected Result */}
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-xs font-semibold text-blue-600 mb-1">Rezultat Așteptat (Normal):</p>
                          <p className="text-sm text-blue-800">{step.expectedResult}</p>
                        </div>

                        {/* Decision Tree */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                            <p className="text-xs font-semibold text-red-600 flex items-center gap-1 mb-1">
                              <XCircle className="w-3 h-3" /> Dacă e DEFECT:
                            </p>
                            <p className="text-sm text-red-800">{step.ifPositive}</p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                            <p className="text-xs font-semibold text-green-600 flex items-center gap-1 mb-1">
                              <CheckCircle2 className="w-3 h-3" /> Dacă e OK:
                            </p>
                            <p className="text-sm text-green-800">{step.ifNegative}</p>
                          </div>
                        </div>

                        {/* Tools & Time */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                          {step.toolsNeeded && step.toolsNeeded.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Wrench className="w-4 h-4" />
                              <span>{step.toolsNeeded.join(", ")}</span>
                            </div>
                          )}
                          {step.estimatedTime && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{step.estimatedTime}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Arrow to next step */}
                    {idx < (report.eliminationSteps?.length || 0) - 1 && !completedSteps.has(step.stepNumber) && (
                      <div className="flex justify-center mt-3">
                        <ArrowRight className="w-5 h-5 text-slate-300 rotate-90" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* ═══ TAB: PROCEDURĂ REPARAȚIE ═══ */}
            <TabsContent value="repair" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Wrench className="w-6 h-6 text-green-500" />
                  Procedură Reparație
                </h2>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{report.totalEstimatedTime}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>Dificultate:</span>
                    <span className="flex">{getDifficultyStars(report.overallDifficulty)}</span>
                  </div>
                </div>
              </div>

              {report.repairSteps?.map((step, idx) => (
                <Card key={step.stepNumber || idx} className="overflow-hidden">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-green-600 font-bold">{step.stepNumber}</span>
                      </div>

                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-slate-900">{step.description}</h3>
                          <div className="flex items-center gap-2">
                            <span className="flex text-sm">{getDifficultyStars(step.difficulty)}</span>
                            {step.estimatedTime && (
                              <Badge variant="secondary" className="text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                {step.estimatedTime}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-slate-600">{step.details}</p>

                        {/* Torque Specs */}
                        {step.torqueSpecs && (
                          <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                            <p className="text-xs font-semibold text-amber-700 mb-1">Cuplu de Strângere:</p>
                            <p className="text-sm text-amber-900 font-mono">{step.torqueSpecs}</p>
                          </div>
                        )}

                        {/* Precautions */}
                        {step.precautions && step.precautions.length > 0 && (
                          <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                            <p className="text-xs font-semibold text-red-600 flex items-center gap-1 mb-1">
                              <AlertTriangle className="w-3 h-3" /> Precauții:
                            </p>
                            <ul className="text-sm text-red-800 space-y-1">
                              {step.precautions.map((p, i) => (
                                <li key={i} className="flex items-start gap-1">
                                  <span className="text-red-400 mt-1">•</span>
                                  {p}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Tools */}
                        {step.tools && step.tools.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {step.tools.map((tool, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                <Wrench className="w-3 h-3 mr-1" />
                                {tool}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* ═══ TAB: PIESE ═══ */}
            <TabsContent value="parts" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Package className="w-6 h-6 text-purple-500" />
                  Piese Necesare
                </h2>
                {report.totalEstimatedCost && (
                  <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                    <CardContent className="py-2 px-4">
                      <p className="text-xs opacity-80">Cost Total Estimat</p>
                      <p className="text-xl font-bold">
                        {report.totalEstimatedCost.min} - {report.totalEstimatedCost.max} {report.totalEstimatedCost.currency}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="grid gap-4">
                {report.parts?.map((part, idx) => (
                  <Card key={idx} className="overflow-hidden hover:shadow-md transition-all">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-900">{part.name}</h3>
                            <Badge variant="outline" className="text-xs">
                              {getActionLabel(part.action)}
                            </Badge>
                            {getAvailabilityBadge(part.availability)}
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-xs text-slate-500">Cod OEM:</p>
                              <p className="font-mono font-semibold text-slate-900">{part.oemCode}</p>
                            </div>
                            {part.aftermarketCode && (
                              <div>
                                <p className="text-xs text-slate-500">Cod Aftermarket:</p>
                                <p className="font-mono text-slate-700">{part.aftermarketCode}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-slate-500">Preț estimat</p>
                          <p className="text-xl font-bold text-green-600">
                            {part.estimatedPrice?.min} - {part.estimatedPrice?.max}
                          </p>
                          <p className="text-xs text-slate-400">{part.estimatedPrice?.currency}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* No Report Fallback */}
        {!report && (
          <Card className="text-center py-12">
            <CardContent>
              <Brain className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">Diagnostic în Așteptare</h3>
              <p className="text-slate-400">Rezultatele analizei AI nu sunt încă disponibile.</p>
            </CardContent>
          </Card>
        )}

        {/* Agent Execution Log */}
        {report?.agentExecutionLog && report.agentExecutionLog.length > 0 && (
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-5 h-5 text-slate-500" />
                Log Execuție Agenți
              </CardTitle>
              <CardDescription>
                Timp total: {report.totalExecutionTime ? `${(report.totalExecutionTime / 1000).toFixed(1)}s` : "N/A"} | Mod: {report.swarmMode}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {report.agentExecutionLog.map((log, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm">
                    <div className={`w-2 h-2 rounded-full ${
                      log.status === "success" ? "bg-green-500" :
                      log.status === "error" ? "bg-red-500" :
                      log.status === "rerun" ? "bg-yellow-500" :
                      "bg-slate-300"
                    }`} />
                    <span className="text-slate-500 w-16">Layer {log.layer}</span>
                    <span className="font-medium text-slate-700 flex-1">{log.agentName}</span>
                    <span className="text-slate-400">{Math.round(log.confidence * 100)}% conf.</span>
                    <Badge variant={log.status === "success" ? "default" : "destructive"} className="text-xs">
                      {log.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bottom Actions */}
        <div className="flex justify-between mt-8 mb-12">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Înapoi la Dashboard
          </Button>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
              onClick={() => navigate(`/diagnostic-chat?diagnosticId=${diagnosticId}`)}
            >
              <Brain className="w-4 h-4 mr-2" />
              Chat AI
            </Button>
            <Button
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
              onClick={() => navigate(`/diagnostic/${diagnosticId}/feedback`)}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Trimite Feedback
            </Button>
            <Button onClick={handleExportPDF} className="bg-orange-500 hover:bg-orange-600">
              <Download className="w-4 h-4 mr-2" />
              Export Raport PDF
            </Button>
            <Button variant="outline" onClick={() => navigate("/diagnostic/new")}>
              <Zap className="w-4 h-4 mr-2" />
              Diagnostic Nou
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
