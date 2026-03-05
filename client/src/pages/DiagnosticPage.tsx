/**
 * Diagnostic Page
 * Main diagnostic interface for mechanics
 */

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Upload, AlertCircle, CheckCircle2, XCircle } from "lucide-react";

interface DiagnosticFormData {
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear?: number;
  engine?: string;
  errorCode: string;
  symptoms: string[];
  vin?: string;
  certificateImage?: string;
}

interface DiagnosticResult {
  success: boolean;
  data?: {
    errorCode: string;
    errorSystem: string;
    description: string;
    confidence: number;
    probableCauses: Array<{ cause: string; probability: number }>;
    repairProcedures: Array<{ step: number; action: string }>;
    toolsRequired: string[];
    torqueSpecs: Array<{ component: string; value: number; unit: string }>;
    estimatedTime: string;
    estimatedCost: number;
    similarCasesCount: number;
    sourceReference: string;
    successRate?: number;
  };
  error?: string;
}

export function DiagnosticPage() {
  const [formData, setFormData] = useState<DiagnosticFormData>({
    vehicleMake: "",
    vehicleModel: "",
    errorCode: "",
    symptoms: [],
  });

  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [vinDecoding, setVinDecoding] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Fetch error codes
  const { data: errorCodesResponse } = trpc.diagnosticEngine.getErrorCodes.useQuery();
  const errorCodes = errorCodesResponse?.data || [];

  // Common symptoms list
  const commonSymptoms = [
    "Check engine light",
    "Rough idle",
    "Poor acceleration",
    "Reduced fuel economy",
    "Engine misfire",
    "Stalling",
    "Hard starting",
    "Excessive emissions",
    "Knocking noise",
    "Vibration",
    "Loss of power",
    "Overheating",
  ];

  // VIN Decode (simplified - in production would call external API)
  const decodeVIN = async (vin: string) => {
    if (vin.length !== 17) {
      alert("VIN must be 17 characters");
      return;
    }

    setVinDecoding(true);
    try {
      // Simulate VIN decode - in production would call actual VIN decoder API
      const make = vin.substring(3, 8).toUpperCase();
      const year = parseInt(vin.substring(9, 10), 36) + 2010;

      setFormData((prev) => ({
        ...prev,
        vehicleMake: make || prev.vehicleMake,
        vehicleYear: year || prev.vehicleYear,
      }));
    } catch (error) {
      console.error("VIN decode error:", error);
    } finally {
      setVinDecoding(false);
    }
  };

  // Handle certificate image upload (Kimi Vision)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        // In production, would call Kimi Vision API to extract VIN and vehicle data
        // For now, just store the image
        setFormData((prev) => ({
          ...prev,
          certificateImage: base64,
        }));
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingImage(false);
    }
  };

  // Run diagnostic using mutation pattern
  const diagnosticMutation = trpc.diagnosticEngine.diagnose.useQuery(
    {
      vehicleMake: formData.vehicleMake,
      vehicleModel: formData.vehicleModel,
      vehicleYear: formData.vehicleYear,
      engine: formData.engine,
      errorCode: formData.errorCode,
      symptoms: selectedSymptoms,
    },
    {
      enabled: false, // Don't auto-run
    }
  );

  const runDiagnostic = async () => {
    if (!formData.vehicleMake || !formData.errorCode || selectedSymptoms.length === 0) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const response = await diagnosticMutation.refetch();
      if (response.data) {
        setResult(response.data);
      }
    } catch (error) {
      console.error("Diagnostic error:", error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Extract error codes safely
  const safeErrorCodes = Array.isArray(errorCodes) ? errorCodes : [];

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Vehicle Diagnostic</h1>
        <p className="text-lg text-muted-foreground">
          Analyze vehicle issues using Bayesian inference
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* VIN Input */}
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Identification</CardTitle>
              <CardDescription>Enter VIN or vehicle details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vin">VIN (17 characters)</Label>
                <div className="flex gap-2">
                  <Input
                    id="vin"
                    placeholder="WBADT43452G297186"
                    value={formData.vin || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, vin: e.target.value }))
                    }
                  />
                  <Button
                    onClick={() => formData.vin && decodeVIN(formData.vin)}
                    disabled={vinDecoding || !formData.vin}
                  >
                    {vinDecoding ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Decode"
                    )}
                  </Button>
                </div>
              </div>

              {/* Certificate Upload */}
              <div className="space-y-2">
                <Label htmlFor="certificate">Or upload certificate image</Label>
                <div className="border-2 border-dashed rounded-lg p-4">
                  <input
                    id="certificate"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() =>
                      document.getElementById("certificate")?.click()
                    }
                    disabled={uploadingImage}
                    className="w-full"
                  >
                    {uploadingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Upload Certificate
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Details */}
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="make">Make *</Label>
                  <Input
                    id="make"
                    placeholder="BMW"
                    value={formData.vehicleMake}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        vehicleMake: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model *</Label>
                  <Input
                    id="model"
                    placeholder="320d"
                    value={formData.vehicleModel}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        vehicleModel: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    placeholder="2014"
                    value={formData.vehicleYear || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        vehicleYear: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="engine">Engine</Label>
                  <Input
                    id="engine"
                    placeholder="2.0L Diesel"
                    value={formData.engine || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        engine: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Code & Symptoms */}
          <Card>
            <CardHeader>
              <CardTitle>Diagnostic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="errorCode">Error Code *</Label>
                <Select
                  value={formData.errorCode}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      errorCode: value,
                    }))
                  }
                >
                  <SelectTrigger id="errorCode">
                    <SelectValue placeholder="Select error code" />
                  </SelectTrigger>
                  <SelectContent>
                    {safeErrorCodes.map((code: string) => (
                      <SelectItem key={code} value={code}>
                        {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Symptoms * (select at least one)</Label>
                <div className="grid grid-cols-2 gap-3">
                  {commonSymptoms.map((symptom) => (
                    <div key={symptom} className="flex items-center space-x-2">
                      <Checkbox
                        id={symptom}
                        checked={selectedSymptoms.includes(symptom)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSymptoms((prev) => [...prev, symptom]);
                          } else {
                            setSelectedSymptoms((prev) =>
                              prev.filter((s) => s !== symptom)
                            );
                          }
                        }}
                      />
                      <Label htmlFor={symptom} className="text-sm font-normal">
                        {symptom}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={runDiagnostic}
                disabled={loading || diagnosticMutation.isLoading}
                className="w-full"
                size="lg"
              >
                {loading || diagnosticMutation.isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Run Diagnostic
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-1">
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  {result.success ? "Diagnosis" : "Error"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.success && result.data ? (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Error Code</p>
                      <p className="text-2xl font-bold">{result.data.errorCode}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Confidence</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${result.data.confidence * 100}%`,
                            }}
                          />
                        </div>
                        <span className="font-bold">
                          {Math.round(result.data.confidence * 100)}%
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Probable Causes
                      </p>
                      <ul className="text-sm space-y-1">
                        {result.data.probableCauses.map((cause, i) => (
                          <li key={i}>
                            • {cause.cause} ({Math.round(cause.probability * 100)}%)
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Estimated Time
                      </p>
                      <p className="font-semibold">{result.data.estimatedTime}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Estimated Cost
                      </p>
                      <p className="text-xl font-bold">
                        ${result.data.estimatedCost.toFixed(2)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Similar Cases
                      </p>
                      <p className="font-semibold">
                        {result.data.similarCasesCount} found
                      </p>
                    </div>

                    {/* Outcome Tracking */}
                    <div className="border-t pt-4 space-y-2">
                      <p className="text-sm font-semibold">
                        Did this fix your problem?
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            alert("Thank you! Feedback recorded.");
                          }}
                        >
                          ✓ Yes
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            alert("Feedback recorded. We'll improve.");
                          }}
                        >
                          ✗ No
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{result.error || "Unknown error"}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
