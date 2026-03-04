import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { ArrowLeft, Brain, TrendingUp, TrendingDown, Minus, BarChart3, Zap, RefreshCw, Loader2, Star, MessageSquare } from "lucide-react";
import { toast } from "sonner";

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "improving") return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (trend === "declining") return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-slate-400" />;
}

function AccuracyBar({ value, label }: { value: number; label: string }) {
  const color = value >= 80 ? "bg-green-500" : value >= 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium">{value.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}

export default function LearningDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: dashboard, isLoading, refetch } = trpc.learning.accuracyDashboard.useQuery();

  const optimizeMutation = trpc.learning.optimizePrompt.useMutation({
    onSuccess: (result) => {
      toast.success("Prompt optimizat cu succes!", {
        description: `Versiune ${result.version} | ${result.improvements.length} îmbunătățiri aplicate`,
      });
      refetch();
    },
    onError: (error) => {
      toast.error("Eroare la optimizare", { description: error.message });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const overall = dashboard?.overall || { accuracy: 0, totalDiagnostics: 0, trend: "stable" };
  const byBrand = dashboard?.byBrand || [];
  const byCategory = dashboard?.byCategory || [];
  const recentFeedback = dashboard?.recentFeedback || [];
  const topPatterns = dashboard?.topPatterns || [];

  const agents = [
    "symptom_analyzer",
    "error_code_expert",
    "technical_manual",
    "elimination_logic",
    "parts_identifier",
    "repair_procedure",
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Brain className="h-7 w-7 text-orange-500" />
                Learning Dashboard
              </h1>
              <p className="text-sm text-slate-500">
                Monitorizare învățare continuă AI și metrici acuratețe
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-slate-500">Total Diagnostice</p>
                <p className="text-3xl font-bold text-slate-900">{overall.totalDiagnostics}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-slate-500">Acuratețe Medie</p>
                <p className="text-3xl font-bold text-green-600">
                  {overall.accuracy > 0 ? `${overall.accuracy.toFixed(1)}%` : "N/A"}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-slate-500">Feedback-uri</p>
                <p className="text-3xl font-bold text-amber-600">{recentFeedback.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-slate-500">Trend</p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <TrendIcon trend={overall.trend} />
                  <p className="text-xl font-bold capitalize text-slate-700">{overall.trend}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Brand Accuracy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-orange-500" />
              Acuratețe per Marcă
            </CardTitle>
            <CardDescription>Performanța diagnosticului per marcă auto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {byBrand.length > 0 ? (
              byBrand.map((m) => (
                <div key={m.brand} className="flex items-center gap-3">
                  <TrendIcon trend={m.trend} />
                  <div className="flex-1">
                    <AccuracyBar value={m.accuracy} label={m.brand} />
                  </div>
                  <span className="text-xs text-slate-400">{m.total} diag.</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">
                Niciun feedback încă. Trimite feedback la diagnostice pentru a vedea metrici.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Symptom Category Accuracy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Acuratețe per Categorie Simptome
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {byCategory.length > 0 ? (
              byCategory.map((m) => (
                <div key={m.category} className="flex items-center gap-3">
                  <div className="flex-1">
                    <AccuracyBar value={m.accuracy} label={m.category} />
                  </div>
                  <span className="text-xs text-slate-400">{m.total} diag.</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">Niciun feedback încă.</p>
            )}
          </CardContent>
        </Card>

        {/* Top Learned Patterns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              Pattern-uri Învățate (Top)
            </CardTitle>
            <CardDescription>Cele mai confirmate pattern-uri de diagnostic</CardDescription>
          </CardHeader>
          <CardContent>
            {topPatterns.length > 0 ? (
              <div className="space-y-3">
                {topPatterns.map((p, i) => (
                  <div key={i} className="border rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-slate-900">{p.brand}</p>
                      <p className="text-xs text-slate-500">Simptom: {p.symptom}</p>
                      <p className="text-xs text-green-600">Cauză: {p.cause}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-green-600">{p.confirmed}x</span>
                      <p className="text-xs text-slate-400">confirmat</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">
                Niciun pattern învățat încă.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Feedback */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-amber-500" />
              Feedback Recent
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentFeedback.length > 0 ? (
              <div className="space-y-3">
                {recentFeedback.map((f, i) => (
                  <div key={i} className="border rounded-lg p-3 flex items-center gap-3">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-4 w-4 ${
                            s <= f.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-slate-600 flex-1">{f.notes || "Fără note"}</p>
                    <span className="text-xs text-slate-400">
                      {new Date(f.createdAt).toLocaleDateString("ro-RO")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">Niciun feedback încă.</p>
            )}
          </CardContent>
        </Card>

        {/* Agent Optimization (Admin Only) */}
        {user?.role === "admin" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-500" />
                Optimizare Agenți AI
              </CardTitle>
              <CardDescription>
                Optimizează prompt-urile agenților bazat pe feedback-ul mecanicilor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {agents.map((agent) => (
                  <div key={agent} className="border rounded-lg p-4 space-y-2">
                    <p className="font-medium text-sm text-slate-700">
                      {agent.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      disabled={optimizeMutation.isPending}
                      onClick={() => optimizeMutation.mutate({ agentName: agent })}
                    >
                      {optimizeMutation.isPending ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Zap className="h-3 w-3 mr-1" />
                      )}
                      Optimizează Prompt
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
