import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useParams } from "wouter";
import { Download, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface KimiResponse {
  probableCauses?: Array<{ cause: string; probability: number }>;
  errorCodes?: string[];
  checkOrder?: string[];
  estimatedTime?: string;
  estimatedCost?: string;
  recommendation?: string;
}

export default function DiagnosticDetail() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const params = useParams();
  const diagnosticId = parseInt(params.id || "0");

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-lg text-slate-600 mb-4">Vă rugăm să vă autentificați</p>
          <Button onClick={() => navigate("/")}>Acasă</Button>
        </div>
      </div>
    );
  }

  const { data: diagnostic, isLoading } = trpc.diagnostic.get.useQuery({ id: diagnosticId });
  const { data: vehicle } = trpc.vehicle.get.useQuery(
    { id: diagnostic?.vehicleId || 0 },
    { enabled: !!diagnostic?.vehicleId }
  );

  const exportPDF = trpc.export.pdf.useMutation();

  const handleExportPDF = async () => {
    if (!diagnostic) return;
    try {
      toast.info("Generare PDF în curs...");
      const result = await exportPDF.mutateAsync({ diagnosticId: diagnostic.id });
      window.open(result.url, "_blank");
      toast.success("PDF generat și descărcat cu succes!");
    } catch (error) {
      toast.error("Eroare la generarea PDF");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="container mx-auto px-4">
          <p className="text-slate-600">Se încarcă...</p>
        </div>
      </div>
    );
  }

  if (!diagnostic) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="container mx-auto px-4">
          <p className="text-slate-600 mb-4">Diagnostic nu a fost găsit</p>
          <Button onClick={() => navigate("/dashboard")}>Înapoi la Dashboard</Button>
        </div>
      </div>
    );
  }

  const kimiData = diagnostic.kimiResponse as KimiResponse | null;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Înapoi
          </Button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {vehicle?.brand} {vehicle?.model} ({vehicle?.year})
              </h1>
              <p className="text-slate-600">
                Motor: {vehicle?.engine || "Necunoscut"} | KM: {vehicle?.mileage || "N/A"}
              </p>
            </div>
            <Badge className={`${
              diagnostic.status === "completed" ? "bg-green-500" :
              diagnostic.status === "saved" ? "bg-blue-500" :
              "bg-yellow-500"
            }`}>
              {diagnostic.status}
            </Badge>
          </div>
        </div>

        {/* Symptoms Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Simptome Raportate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 mb-4">{diagnostic.symptomsText}</p>
            {diagnostic.symptomsSelected && diagnostic.symptomsSelected.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {diagnostic.symptomsSelected.map((symptom: string) => (
                  <Badge key={symptom} variant="secondary">{symptom}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Diagnostic Results */}
        {kimiData && (
          <>
            {/* Probable Causes */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Cauze Probabile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {kimiData.probableCauses?.map((cause, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium text-slate-900">{cause.cause}</span>
                      <span className="text-orange-600 font-bold">{cause.probability}%</span>
                    </div>
                    <Progress value={cause.probability} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Error Codes */}
            {kimiData.errorCodes && kimiData.errorCodes.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Coduri Eroare OBD</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {kimiData.errorCodes.map((code, idx) => (
                      <Badge key={idx} variant="destructive">{code}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Check Order */}
            {kimiData.checkOrder && kimiData.checkOrder.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Ordine Verificare Componente</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2">
                    {kimiData.checkOrder.map((step, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">
                          {idx + 1}
                        </span>
                        <span className="text-slate-700 pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            )}

            {/* Time and Cost */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Timp Estimat</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-orange-600">{kimiData.estimatedTime}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Cost Estimat</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">{kimiData.estimatedCost}</p>
                </CardContent>
              </Card>
            </div>

            {/* Recommendation */}
            {kimiData.recommendation && (
              <Card className="mb-6 border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle>Recomandare Finală</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700">{kimiData.recommendation}</p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            onClick={handleExportPDF}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
          >
            Înapoi la Diagnostice
          </Button>
        </div>
      </div>
    </div>
  );
}
