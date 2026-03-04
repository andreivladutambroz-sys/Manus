import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useLocation, useSearch } from "wouter";
import { useState, useMemo } from "react";
import { AIChatBox } from "@/components/AIChatBox";
import type { UIMessage } from "ai";
import {
  ArrowLeft, MessageSquare, Car, AlertTriangle, Wrench,
  Brain, Sparkles
} from "lucide-react";

export default function DiagnosticChat() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const diagnosticId = params.get("diagnosticId");
  const parsedDiagnosticId = diagnosticId ? parseInt(diagnosticId) : undefined;

  const [chatId] = useState(() => {
    if (parsedDiagnosticId) return `diag-${parsedDiagnosticId}`;
    return `chat-${Date.now()}`;
  });

  const diagnosticQuery = trpc.diagnostic.get.useQuery(
    { id: parsedDiagnosticId! },
    { enabled: !!parsedDiagnosticId }
  );

  const vehicleQuery = trpc.vehicle.get.useQuery(
    { id: diagnosticQuery.data?.vehicleId! },
    { enabled: !!diagnosticQuery.data?.vehicleId }
  );

  const messagesQuery = trpc.chat.loadMessages.useQuery({ chatId });
  const trpcUtils = trpc.useUtils();

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  const diagnostic = diagnosticQuery.data;
  const vehicle = vehicleQuery.data;
  const kimiResponse = diagnostic?.kimiResponse as any;

  // Build context-aware suggested prompts
  const suggestedPrompts = useMemo(() => {
    if (diagnostic && vehicle) {
      return [
        `Care sunt cele mai frecvente probleme la ${vehicle.brand} ${vehicle.model} ${vehicle.year}?`,
        `Explică-mi pas cu pas cum verific ${kimiResponse?.probableCauses?.[0]?.cause || "prima cauză identificată"}`,
        `Ce unelte am nevoie pentru diagnosticul la ${vehicle.brand} ${vehicle.model}?`,
        `Există recall-uri sau buletine tehnice pentru ${vehicle.brand} ${vehicle.model} ${vehicle.year}?`,
      ];
    }
    return [
      "Ce înseamnă codul de eroare P0300?",
      "Care sunt simptomele unui turbo defect?",
      "Cum verific presiunea în sistemul de combustibil?",
      "Ce cauzează vibrații la volan la 80-120 km/h?",
    ];
  }, [diagnostic, vehicle, kimiResponse]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(diagnostic ? `/diagnostic/${diagnostic.id}` : "/dashboard")} className="text-slate-400 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Brain className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold flex items-center gap-2">
                  Asistent Diagnostic AI
                  <Sparkles className="h-4 w-4 text-orange-400" />
                </h1>
                <p className="text-xs text-slate-400">
                  {vehicle ? `${vehicle.brand} ${vehicle.model} ${vehicle.year}` : "Conversație generală"}
                </p>
              </div>
            </div>
          </div>
          {diagnostic && (
            <Badge variant="outline" className="border-orange-500/50 text-orange-300">
              Diagnostic #{diagnostic.id}
            </Badge>
          )}
        </div>
      </div>

      {/* Context Banner */}
      {diagnostic && kimiResponse && (
        <div className="border-b border-slate-800 bg-slate-900/50">
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center gap-4 text-xs overflow-x-auto">
              <div className="flex items-center gap-1 text-slate-400 whitespace-nowrap">
                <Car className="h-3 w-3" />
                {vehicle?.brand} {vehicle?.model} {vehicle?.year}
              </div>
              {kimiResponse.probableCauses?.slice(0, 3).map((cause: any, i: number) => (
                <div key={i} className="flex items-center gap-1 whitespace-nowrap">
                  <AlertTriangle className="h-3 w-3 text-amber-400" />
                  <span className="text-slate-300">{cause.cause}</span>
                  <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-orange-500/20 text-orange-300">
                    {cause.probability}%
                  </Badge>
                </div>
              ))}
              {kimiResponse.validation && (
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <Wrench className="h-3 w-3 text-green-400" />
                  <span className="text-green-300">Acuratețe: {kimiResponse.validation.overallAccuracy}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">
        <AIChatBox
          chatId={chatId}
          initialMessages={(messagesQuery.data as UIMessage[]) ?? []}
          onFinish={(messages) => {
            trpcUtils.chat.loadMessages.setData({ chatId }, messages);
          }}
          placeholder={diagnostic ? "Întreabă despre acest diagnostic..." : "Întreabă orice despre diagnostic auto..."}
          emptyStateMessage={
            diagnostic
              ? `Sunt asistentul tău AI pentru diagnosticul #${diagnostic.id}. Am context complet despre vehicul și analiză. Întreabă-mă orice!`
              : "Sunt asistentul tău AI pentru diagnostic auto. Pot răspunde la întrebări despre coduri eroare, simptome, proceduri de reparație și multe altele."
          }
          suggestedPrompts={suggestedPrompts}
          className="flex-1"
        />
      </div>
    </div>
  );
}
