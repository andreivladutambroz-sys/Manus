import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

const SYMPTOMS = [
  "Check Engine Light On",
  "Power Loss",
  "Increased Fuel Consumption",
  "Vibrations at Idle",
  "Abnormal Sounds",
  "Exhaust Smoke",
];

const BRANDS = ["Volkswagen", "Audi", "Skoda", "Seat", "BMW", "Mercedes", "Other"];

export default function DiagnosticNew() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);

  // Step 1: Vehicle data
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [engine, setEngine] = useState("");
  const [engineCode, setEngineCode] = useState("");
  const [mileage, setMileage] = useState("");

  // Step 2: Symptoms
  const [symptomsText, setSymptomsText] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  const createVehicle = trpc.vehicle.create.useMutation();
  const createDiagnostic = trpc.diagnostic.create.useMutation();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-lg text-slate-600 mb-4">Please sign in to create a diagnostic</p>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  const handleNextStep = async () => {
    if (step === 1) {
      if (!brand || !model || !year) {
        toast.error("Please fill in all required fields");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!symptomsText && selectedSymptoms.length === 0) {
        toast.error("Please describe symptoms or select symptoms");
        return;
      }
      handleCreateDiagnostic();
    }
  };

  const handleCreateDiagnostic = async () => {
    try {
      // Create vehicle first
      await createVehicle.mutateAsync({
        brand,
        model,
        year: parseInt(year),
        engine,
        engineCode,
        mileage: mileage ? parseInt(mileage) : undefined,
      });

      // Get the latest vehicle (should be the one we just created)
      const vehiclesQuery = trpc.useUtils().vehicle.list;
      const vehicles = await vehiclesQuery.fetch();
      const newVehicle = vehicles[vehicles.length - 1];

      if (newVehicle) {
        // Create diagnostic
        await createDiagnostic.mutateAsync({
          vehicleId: newVehicle.id,
          symptomsText,
          symptomsSelected: selectedSymptoms,
        });

        toast.success("Diagnostic created successfully!");
        navigate("/dashboard");
      }
    } catch (error) {
      toast.error("Failed to create diagnostic");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">New Diagnostic</h1>
          <p className="text-slate-600">Step {step} of 2</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 flex gap-2">
          <div className={`flex-1 h-2 rounded-full ${step >= 1 ? "bg-orange-500" : "bg-slate-200"}`} />
          <div className={`flex-1 h-2 rounded-full ${step >= 2 ? "bg-orange-500" : "bg-slate-200"}`} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 ? "Vehicle Information" : "Symptoms"}
            </CardTitle>
            <CardDescription>
              {step === 1
                ? "Enter the vehicle details"
                : "Describe the symptoms and issues"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="brand">Brand *</Label>
                    <Select value={brand} onValueChange={setBrand}>
                      <SelectTrigger id="brand">
                        <SelectValue placeholder="Select brand" />
                      </SelectTrigger>
                      <SelectContent>
                        {BRANDS.map(b => (
                          <SelectItem key={b} value={b}>{b}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="model">Model *</Label>
                    <Input
                      id="model"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="e.g., Golf, A4"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="year">Year *</Label>
                    <Input
                      id="year"
                      type="number"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      placeholder="e.g., 2020"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mileage">Mileage (km)</Label>
                    <Input
                      id="mileage"
                      type="number"
                      value={mileage}
                      onChange={(e) => setMileage(e.target.value)}
                      placeholder="e.g., 150000"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="engine">Engine</Label>
                  <Input
                    id="engine"
                    value={engine}
                    onChange={(e) => setEngine(e.target.value)}
                    placeholder="e.g., 2.0 TDI"
                  />
                </div>

                <div>
                  <Label htmlFor="engineCode">Engine Code</Label>
                  <Input
                    id="engineCode"
                    value={engineCode}
                    onChange={(e) => setEngineCode(e.target.value)}
                    placeholder="e.g., CBBB"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="symptoms">Describe Symptoms</Label>
                  <Textarea
                    id="symptoms"
                    value={symptomsText}
                    onChange={(e) => setSymptomsText(e.target.value)}
                    placeholder="Describe the vehicle symptoms and issues in detail..."
                    rows={5}
                  />
                </div>

                <div>
                  <Label className="text-base font-medium mb-3 block">Quick Symptoms</Label>
                  <div className="space-y-2">
                    {SYMPTOMS.map(symptom => (
                      <div key={symptom} className="flex items-center">
                        <Checkbox
                          id={symptom}
                          checked={selectedSymptoms.includes(symptom)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedSymptoms([...selectedSymptoms, symptom]);
                            } else {
                              setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
                            }
                          }}
                        />
                        <Label htmlFor={symptom} className="ml-2 cursor-pointer">
                          {symptom}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
          >
            Previous
          </Button>
          <Button
            onClick={handleNextStep}
            className="bg-orange-500 hover:bg-orange-600"
            disabled={createVehicle.isPending || createDiagnostic.isPending}
          >
            {step === 2 ? "Create Diagnostic" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}
