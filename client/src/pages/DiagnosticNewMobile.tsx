import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  Car, Upload, Camera, FileText, Wrench, AlertTriangle, CheckCircle2,
  ArrowLeft, Loader2, Zap, Search, Shield, Clock, ChevronRight, X, Plus, Brain
} from "lucide-react";
import { RESPONSIVE_TEXT, RESPONSIVE_SPACING, RESPONSIVE_GRID, MOBILE_INPUT_CLASS, MOBILE_BUTTON_CLASS, MOBILE_SELECT_CLASS } from "@/lib/mobile-utils";

// Vehicle brands (simplified for mobile)
const BRANDS = [
  "Volkswagen", "Audi", "BMW", "Mercedes-Benz", "Ford", "Renault", "Toyota",
  "Honda", "Hyundai", "Kia", "Nissan", "Mazda", "Subaru", "Jeep", "Ram",
  "Chevrolet", "GMC", "Cadillac", "Dodge", "Chrysler", "Volvo", "Porsche",
  "Lamborghini", "Ferrari", "Maserati", "Bentley", "Rolls-Royce", "Aston Martin",
  "Jaguar", "Land Rover", "Alfa Romeo", "Fiat", "Lancia", "Suzuki", "Daihatsu",
  "Mitsubishi", "Isuzu", "Tata", "Mahindra", "BYD", "Geely", "Chery", "Other"
];

const MODELS_BY_BRAND: Record<string, string[]> = {
  "Volkswagen": ["Golf", "Passat", "Tiguan", "Polo", "Jetta", "Beetle", "Arteon", "Touareg"],
  "BMW": ["3 Series", "5 Series", "7 Series", "X1", "X3", "X5", "X7", "M3", "M5", "M4"],
  "Mercedes-Benz": ["C-Class", "E-Class", "S-Class", "A-Class", "GLA", "GLC", "GLE", "GLS"],
  "Ford": ["Mustang", "F-150", "Explorer", "Edge", "Escape", "Fusion", "Focus", "Fiesta"],
  "Toyota": ["Corolla", "Camry", "Highlander", "RAV4", "Prius", "Tacoma", "Tundra"],
  "Honda": ["Civic", "Accord", "CR-V", "Pilot", "Odyssey", "Fit", "HR-V"],
  "Hyundai": ["Elantra", "Sonata", "Tucson", "Santa Fe", "Venue", "Kona"],
  "Kia": ["Sportage", "Sorento", "Telluride", "Niro", "Seltos", "Stinger"],
  "Nissan": ["Altima", "Sentra", "Rogue", "Murano", "Pathfinder", "Leaf"],
  "Mazda": ["CX-5", "Mazda3", "Mazda6", "MX-5", "CX-3", "CX-30"],
  "Subaru": ["Outback", "Forester", "Crosstrek", "Impreza", "Legacy"],
  "Jeep": ["Wrangler", "Cherokee", "Grand Cherokee", "Compass", "Renegade"],
  "Ram": ["1500", "2500", "3500", "ProMaster"],
  "Chevrolet": ["Silverado", "Equinox", "Traverse", "Tahoe", "Malibu"],
  "GMC": ["Sierra", "Acadia", "Terrain", "Yukon"],
  "Cadillac": ["Escalade", "XT6", "XT5", "XT4", "CT5"],
  "Dodge": ["Charger", "Challenger", "Durango", "Journey"],
  "Chrysler": ["300", "Pacifica", "Voyager"],
  "Renault": ["Clio", "Megane", "Scenic", "Espace", "Koleos"],
  "Volvo": ["S90", "S60", "V90", "V60", "XC90", "XC60"],
  "Porsche": ["911", "Boxster", "Cayenne", "Macan", "Panamera"],
  "Audi": ["A1", "A3", "A4", "A5", "A6", "Q2", "Q3", "Q5"],
  "Skoda": ["Octavia", "Superb", "Fabia", "Kodiaq", "Karoq"],
  "Seat": ["Ibiza", "Leon", "Tarraco", "Ateca"],
  "Fiat": ["500", "Panda", "Tipo", "Argo"],
  "Alfa Romeo": ["Giulia", "Stelvio", "Tonale"],
  "Lancia": ["Ypsilon", "Thema", "Delta"],
  "Suzuki": ["Swift", "Vitara", "Jimny", "Baleno"],
  "Daihatsu": ["Mira", "Tanto", "Move"],
  "Mitsubishi": ["Outlander", "Eclipse Cross", "ASX", "Mirage"],
  "Isuzu": ["D-Max", "MU-X"],
  "Tata": ["Nexon", "Harrier", "Safari"],
  "Mahindra": ["XUV700", "XUV500", "Scorpio"],
  "BYD": ["Qin", "Song", "Yuan", "Tang"],
  "Geely": ["Emgrand", "Vision", "Coolray"],
  "Chery": ["Tiggo", "QQ", "Arrizo"],
};

export default function DiagnosticNewMobile() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [errorCodes, setErrorCodes] = useState<string[]>([]);
  const [newCode, setNewCode] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const createDiagnostic = trpc.diagnostic.create.useMutation({
    onSuccess: (data) => {
      toast.success("Diagnostic created successfully");
      navigate(`/diagnostic/${data.diagnosticId}`);
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleAddCode = () => {
    if (newCode.trim() && !errorCodes.includes(newCode.trim())) {
      setErrorCodes([...errorCodes, newCode.trim()]);
      setNewCode("");
    }
  };

  const handleRemoveCode = (code: string) => {
    setErrorCodes(errorCodes.filter((c) => c !== code));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages([...images, ...files]);
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!brand || !model || !symptoms) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      // Get or create vehicle first
      const vehicleResponse = await fetch("/api/vehicle/get-or-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand, model, year: year ? parseInt(year) : null }),
      });
      const vehicleData = await vehicleResponse.json();

      await createDiagnostic.mutateAsync({
        vehicleId: vehicleData.vehicleId,
        symptomsText: symptoms,
        symptomsSelected: errorCodes,
      });
    } catch (error) {
      console.error("Error creating diagnostic:", error);
      toast.error("Failed to create diagnostic");
    }
  };

  const models = brand ? (MODELS_BY_BRAND[brand] || []) : [];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  return (
    <div className={`${RESPONSIVE_SPACING.CONTAINER_PADDING} py-4 sm:py-6 min-h-screen bg-background`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="h-10 w-10 p-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className={`${RESPONSIVE_TEXT.H2} text-foreground`}>New Diagnostic</h1>
      </div>

      {/* Progress Indicator */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 mx-1 rounded-full transition-colors ${
                s <= step ? "bg-orange-500" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Step {step} of 3
        </p>
      </div>

      {/* Step 1: Vehicle Selection */}
      {step === 1 && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <Car className="w-5 h-5" />
              Vehicle Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Brand Select */}
            <div>
              <label className="text-sm font-medium mb-2 block">Brand *</label>
              <Select value={brand} onValueChange={setBrand}>
                <SelectTrigger className={MOBILE_SELECT_CLASS}>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {BRANDS.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Model Select */}
            {brand && (
              <div>
                <label className="text-sm font-medium mb-2 block">Model *</label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger className={MOBILE_SELECT_CLASS}>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Year Select */}
            <div>
              <label className="text-sm font-medium mb-2 block">Year (Optional)</label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className={MOBILE_SELECT_CLASS}>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Next Button */}
            <Button
              onClick={() => setStep(2)}
              disabled={!brand || !model}
              className={`w-full ${MOBILE_BUTTON_CLASS}`}
            >
              Next <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Symptoms & Error Codes */}
      {step === 2 && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Symptoms & Error Codes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Symptoms */}
            <div>
              <label className="text-sm font-medium mb-2 block">Symptoms *</label>
              <Textarea
                placeholder="Describe the vehicle symptoms (e.g., check engine light, rough idle, poor acceleration)"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="min-h-24 text-base"
              />
            </div>

            {/* Error Codes */}
            <div>
              <label className="text-sm font-medium mb-2 block">Error Codes (Optional)</label>
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="e.g., P0301"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleAddCode();
                    }
                  }}
                  className={MOBILE_INPUT_CLASS}
                />
                <Button
                  onClick={handleAddCode}
                  variant="outline"
                  size="sm"
                  className="h-12 px-3"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Error Codes List */}
              {errorCodes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {errorCodes.map((code) => (
                    <Badge key={code} variant="secondary" className="text-xs sm:text-sm py-1">
                      {code}
                      <X
                        className="w-3 h-3 ml-1 cursor-pointer"
                        onClick={() => handleRemoveCode(code)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className={`flex-1 ${MOBILE_BUTTON_CLASS}`}
              >
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!symptoms}
                className={`flex-1 ${MOBILE_BUTTON_CLASS}`}
              >
                Next <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Images & Submit */}
      {step === 3 && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Images & Submit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Image Upload */}
            <div>
              <label className="text-sm font-medium mb-2 block">Photos (Optional)</label>
              <div className="flex gap-2 mb-3">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className={`flex-1 ${MOBILE_BUTTON_CLASS}`}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
                <Button
                  onClick={() => cameraInputRef.current?.click()}
                  variant="outline"
                  className={`flex-1 ${MOBILE_BUTTON_CLASS}`}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Camera
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageUpload}
                className="hidden"
              />

              {/* Images Preview */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {images.map((file, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${idx}`}
                        className="w-full h-20 object-cover rounded border"
                      />
                      <button
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Summary */}
            <Card className="bg-muted/50 border-0">
              <CardContent className="pt-4 space-y-2 text-sm">
                <p><strong>Vehicle:</strong> {year} {brand} {model}</p>
                <p><strong>Symptoms:</strong> {symptoms.substring(0, 50)}...</p>
                {errorCodes.length > 0 && (
                  <p><strong>Error Codes:</strong> {errorCodes.join(", ")}</p>
                )}
                <p><strong>Images:</strong> {images.length} attached</p>
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => setStep(2)}
                variant="outline"
                className={`flex-1 ${MOBILE_BUTTON_CLASS}`}
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createDiagnostic.isPending}
                className={`flex-1 ${MOBILE_BUTTON_CLASS} bg-orange-500 hover:bg-orange-600`}
              >
                {createDiagnostic.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Submit
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
