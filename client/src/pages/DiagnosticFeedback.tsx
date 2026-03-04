import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { useState } from "react";
import { Star, CheckCircle, XCircle, AlertCircle, ArrowLeft, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

function StarRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-sm font-medium text-slate-700">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="transition-all hover:scale-110"
          >
            <Star
              className={`h-7 w-7 ${
                star <= value
                  ? "fill-amber-400 text-amber-400"
                  : "text-slate-300 hover:text-amber-300"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function DiagnosticFeedback() {
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const diagnosticId = parseInt(params.id || "0");

  const { data: diagnostic, isLoading } = trpc.diagnostic.get.useQuery(
    { id: diagnosticId },
    { enabled: diagnosticId > 0 }
  );

  const { data: existingFeedback } = trpc.learning.getFeedback.useQuery(
    { diagnosticId },
    { enabled: diagnosticId > 0 }
  );

  const submitMutation = trpc.learning.submitFeedback.useMutation({
    onSuccess: (result) => {
      toast.success("Feedback trimis cu succes!", {
        description: `${result.patternLearned ? "Pattern învățat. " : ""}${result.promptOptimized ? "Prompt optimizat. " : ""}Metrici actualizate.`,
      });
      navigate(`/diagnostic/${diagnosticId}`);
    },
    onError: (error) => {
      toast.error("Eroare la trimiterea feedback-ului", { description: error.message });
    },
  });

  // Form state
  const [overallRating, setOverallRating] = useState(0);
  const [accuracyRating, setAccuracyRating] = useState(0);
  const [usefulnessRating, setUsefulnessRating] = useState(0);
  const [wasResolved, setWasResolved] = useState(false);
  const [actualCause, setActualCause] = useState("");
  const [actualParts, setActualParts] = useState("");
  const [actualCost, setActualCost] = useState("");
  const [actualTime, setActualTime] = useState("");
  const [mechanicNotes, setMechanicNotes] = useState("");
  const [causesFeedback, setCausesFeedback] = useState<
    Array<{ causeId: string; cause: string; rating: "correct" | "partially_correct" | "incorrect"; mechanicComment?: string }>
  >([]);

  // Parse causes from diagnostic
  const kimiResponse = diagnostic?.kimiResponse as any;
  const causes = kimiResponse?.probableCauses || [];

  const handleCauseRating = (causeId: string, cause: string, rating: "correct" | "partially_correct" | "incorrect") => {
    setCausesFeedback((prev) => {
      const existing = prev.find((f) => f.causeId === causeId);
      if (existing) {
        return prev.map((f) => (f.causeId === causeId ? { ...f, rating } : f));
      }
      return [...prev, { causeId, cause, rating }];
    });
  };

  const handleSubmit = () => {
    if (overallRating === 0 || accuracyRating === 0 || usefulnessRating === 0) {
      toast.error("Te rog completează toate rating-urile");
      return;
    }

    submitMutation.mutate({
      diagnosticId,
      overallRating,
      accuracyRating,
      usefulnessRating,
      causesFeedback: causesFeedback.length > 0 ? causesFeedback : undefined,
      actualCause: actualCause || undefined,
      actualParts: actualParts ? actualParts.split(",").map((p) => p.trim()) : undefined,
      actualCost: actualCost ? parseFloat(actualCost) : undefined,
      actualTime: actualTime || undefined,
      mechanicNotes: mechanicNotes || undefined,
      wasResolved,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (existingFeedback) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-6 w-6" />
                Feedback deja trimis
              </CardTitle>
              <CardDescription>
                Ai trimis deja feedback pentru acest diagnostic. Rating: {existingFeedback.overallRating}/5
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => navigate(`/diagnostic/${diagnosticId}`)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Înapoi la diagnostic
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/diagnostic/${diagnosticId}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Feedback Diagnostic</h1>
            <p className="text-sm text-slate-500">
              Ajută AI-ul să învețe din experiența ta. Feedback-ul tău îmbunătățește diagnosticele viitoare.
            </p>
          </div>
        </div>

        {/* Rating Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Evaluare Generală</CardTitle>
            <CardDescription>Cum evaluezi diagnosticul primit?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <StarRating value={overallRating} onChange={setOverallRating} label="Rating General" />
            <StarRating value={accuracyRating} onChange={setAccuracyRating} label="Acuratețe Diagnostic" />
            <StarRating value={usefulnessRating} onChange={setUsefulnessRating} label="Utilitate Practică" />

            <div className="flex items-center gap-3 pt-2">
              <Switch checked={wasResolved} onCheckedChange={setWasResolved} />
              <Label className="text-sm">Problema a fost rezolvată cu ajutorul diagnosticului</Label>
            </div>
          </CardContent>
        </Card>

        {/* Cause Feedback */}
        {causes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Evaluare Cauze Identificate</CardTitle>
              <CardDescription>Evaluează fiecare cauză identificată de AI</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {causes.map((cause: any, index: number) => {
                const causeId = cause.id || `cause_${index}`;
                const feedback = causesFeedback.find((f) => f.causeId === causeId);
                return (
                  <div key={causeId} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-slate-900">{cause.cause}</p>
                        <p className="text-sm text-slate-500">Acuratețe AI: {cause.accuracy}%</p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          cause.severity === "critical"
                            ? "bg-red-100 text-red-700"
                            : cause.severity === "high"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {cause.severity}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={feedback?.rating === "correct" ? "default" : "outline"}
                        className={feedback?.rating === "correct" ? "bg-green-600 hover:bg-green-700" : ""}
                        onClick={() => handleCauseRating(causeId, cause.cause, "correct")}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" /> Corect
                      </Button>
                      <Button
                        size="sm"
                        variant={feedback?.rating === "partially_correct" ? "default" : "outline"}
                        className={feedback?.rating === "partially_correct" ? "bg-amber-600 hover:bg-amber-700" : ""}
                        onClick={() => handleCauseRating(causeId, cause.cause, "partially_correct")}
                      >
                        <AlertCircle className="h-4 w-4 mr-1" /> Parțial
                      </Button>
                      <Button
                        size="sm"
                        variant={feedback?.rating === "incorrect" ? "default" : "outline"}
                        className={feedback?.rating === "incorrect" ? "bg-red-600 hover:bg-red-700" : ""}
                        onClick={() => handleCauseRating(causeId, cause.cause, "incorrect")}
                      >
                        <XCircle className="h-4 w-4 mr-1" /> Incorect
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Corrections */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Corecții și Date Reale</CardTitle>
            <CardDescription>
              Dacă diagnosticul a fost incorect, spune-ne cauza reală și detaliile reparației
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Cauza reală (dacă diferită de diagnostic)</Label>
              <Textarea
                value={actualCause}
                onChange={(e) => setActualCause(e.target.value)}
                placeholder="Ex: Bobina de aprindere cilindrul 3 defectă, nu sonda lambda cum a sugerat AI-ul..."
                className="mt-1"
              />
            </div>
            <div>
              <Label>Piese folosite efectiv (separate prin virgulă)</Label>
              <Input
                value={actualParts}
                onChange={(e) => setActualParts(e.target.value)}
                placeholder="Ex: Bobina aprindere Bosch 0221504470, Bujii NGK BKR6EIX-11"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cost real (EUR)</Label>
                <Input
                  type="number"
                  value={actualCost}
                  onChange={(e) => setActualCost(e.target.value)}
                  placeholder="150"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Timp real reparație</Label>
                <Input
                  value={actualTime}
                  onChange={(e) => setActualTime(e.target.value)}
                  placeholder="Ex: 1.5 ore"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Note adiționale</Label>
              <Textarea
                value={mechanicNotes}
                onChange={(e) => setMechanicNotes(e.target.value)}
                placeholder="Orice observații suplimentare care ar putea ajuta AI-ul să învețe..."
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-3 justify-end pb-8">
          <Button variant="outline" onClick={() => navigate(`/diagnostic/${diagnosticId}`)}>
            Anulează
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitMutation.isPending || overallRating === 0}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {submitMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Trimite Feedback
          </Button>
        </div>
      </div>
    </div>
  );
}
