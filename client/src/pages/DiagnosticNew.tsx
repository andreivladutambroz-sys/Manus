import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import {
  Car, Upload, Camera, FileText, Wrench, AlertTriangle, CheckCircle2,
  ArrowLeft, ArrowRight, Loader2, Zap, Search, Shield, Clock,
  ChevronRight, X, Plus, Brain, Bluetooth
} from "lucide-react";
import { AISuggestions } from "@/components/AISuggestions";
import { MaintenanceRecommendations } from "@/components/MaintenanceRecommendations";

// ============================================================
// CONSTANTS
// ============================================================

const BRANDS = [
  "Volkswagen", "Audi", "Skoda", "Seat", "BMW", "Mercedes-Benz",
  "Opel", "Ford", "Renault", "Peugeot", "Citroen", "Toyota",
  "Honda", "Hyundai", "Kia", "Dacia", "Fiat", "Volvo", "Other"
];

const MODELS_BY_BRAND: Record<string, string[]> = {
  "Volkswagen": ["Golf", "Passat", "Tiguan", "Polo", "Jetta", "Touran", "Caddy", "Transporter"],
  "Audi": ["A1", "A3", "A4", "A5", "A6", "A7", "A8", "Q2", "Q3", "Q5", "Q7", "Q8"],
  "Skoda": ["Citigo", "Fabia", "Octavia", "Superb", "Rapid", "Yeti", "Karoq", "Kodiaq"],
  "Seat": ["Mii", "Ibiza", "Leon", "Toledo", "Arona", "Tarraco", "Alhambra"],
  "BMW": ["116", "118", "120", "130", "320", "330", "520", "530", "X1", "X3", "X5", "X7"],
  "Mercedes-Benz": ["A-Class", "C-Class", "E-Class", "S-Class", "CLA", "GLA", "GLC", "GLE", "GLS"],
  "Opel": ["Adam", "Astra", "Corsa", "Grandland", "Insignia", "Mokka", "Vectra", "Zafira"],
  "Ford": ["Fiesta", "Focus", "Fusion", "Mondeo", "Kuga", "Edge", "Explorer", "Ranger"],
  "Renault": ["Clio", "Megane", "Scenic", "Espace", "Laguna", "Captur", "Kadjar", "Koleos"],
  "Peugeot": ["107", "207", "307", "308", "407", "508", "2008", "3008", "5008"],
  "Citroen": ["C1", "C2", "C3", "C4", "C5", "C6", "Berlingo", "Picasso"],
  "Toyota": ["Yaris", "Corolla", "Camry", "Avensis", "RAV4", "Highlander", "Land Cruiser", "Prius"],
  "Honda": ["Jazz", "Civic", "Accord", "CR-V", "Pilot", "Odyssey", "Insight"],
  "Hyundai": ["i10", "i20", "i30", "Elantra", "Sonata", "Tucson", "Santa Fe", "Kona"],
  "Kia": ["Picanto", "Rio", "Ceed", "Optima", "Sorento", "Sportage", "Niro", "Telluride"],
  "Dacia": ["Sandero", "Logan", "Duster", "Lodgy", "Dokker", "Spring"],
  "Fiat": ["500", "Panda", "Punto", "Bravo", "Tipo", "Ducato", "500X"],
  "Volvo": ["V40", "V60", "V90", "S60", "S90", "XC40", "XC60", "XC90"],
  "Other": ["Model necunoscut"]
};

const CATEGORIES = [
  { value: "motor", label: "Motor", icon: "🔧" },
  { value: "transmisie", label: "Transmisie", icon: "⚙️" },
  { value: "frane", label: "Frâne", icon: "🛑" },
  { value: "suspensie", label: "Suspensie", icon: "🔩" },
  { value: "electric", label: "Sistem Electric", icon: "⚡" },
  { value: "racire", label: "Răcire", icon: "❄️" },
  { value: "alimentare", label: "Alimentare", icon: "⛽" },
  { value: "evacuare", label: "Evacuare", icon: "💨" },
  { value: "directie", label: "Direcție", icon: "🔄" },
  { value: "caroserie", label: "Caroserie", icon: "🚗" },
  { value: "altele", label: "Altele", icon: "📋" },
];

const CONDITIONS = [
  "La rece", "La cald", "La accelerare", "La frânare",
  "La ralanti", "La viteză constantă", "La pornire",
  "Intermitent", "Permanent", "La viraje", "Pe ploaie",
];

const COMMON_SYMPTOMS = [
  "Check Engine aprins", "Pierdere putere", "Consum crescut",
  "Vibrații la ralanti", "Zgomote anormale", "Fum la evacuare",
  "Pornire dificilă", "Mers neregulat", "Supraîncălzire",
  "Scurgeri lichide", "Miros ars", "Zgomot la frânare",
  "Direcție grea", "Bate volanul", "Cutie de viteze sare",
];

// ============================================================
// COMPONENT
// ============================================================

export default function DiagnosticNew() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 1: Vehicle data
  const [vehicleInputMode, setVehicleInputMode] = useState<"manual" | "vin" | "ocr">("manual");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [engine, setEngine] = useState("");
  const [engineCode, setEngineCode] = useState("");
  const [mileage, setMileage] = useState("");
  const [vin, setVin] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);

  // Step 2: Symptoms
  const [category, setCategory] = useState("");
  const [symptomsText, setSymptomsText] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [errorCodes, setErrorCodes] = useState<string[]>([]);
  const [newErrorCode, setNewErrorCode] = useState("");
  const [conditions, setConditions] = useState<string[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState("");

  // Step 3: Analysis
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState("");
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);

  // Mutations
  const createVehicle = trpc.vehicle.create.useMutation();
  const runOrchestrated = trpc.diagnostic.runOrchestrated.useMutation();
  const ocrCertificate = trpc.ocr.certificate.useMutation();
  const uploadImage = trpc.upload.image.useMutation();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="w-12 h-12 mx-auto text-slate-400 mb-4" />
            <p className="text-lg text-slate-600 mb-4">Autentificați-vă pentru a crea un diagnostic</p>
            <Button onClick={() => navigate("/")}>Pagina Principală</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── OCR HANDLER ──
  const handleOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsOcrProcessing(true);
    toast.info("Se procesează certificatul auto...");

    try {
      // Convert to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1] || "");
        };
        reader.readAsDataURL(file);
      });
      const base64 = await base64Promise;

      // Upload image
      const { url } = await uploadImage.mutateAsync({
        fileName: file.name,
        fileBase64: base64,
        contentType: file.type,
      });

      // Run OCR
      const result = await ocrCertificate.mutateAsync({ imageUrl: url });

      if (result.success && result.data) {
        const d = result.data as any;
        if (d.brand) setBrand(d.brand);
        if (d.model) setModel(d.model);
        if (d.year) setYear(String(d.year));
        if (d.engine) setEngine(d.engine);
        if (d.engineCode) setEngineCode(d.engineCode);
        if (d.mileage) setMileage(String(d.mileage));
        if (d.vin) setVin(d.vin);
        if (d.licensePlate) setLicensePlate(d.licensePlate);
        toast.success("Date extrase cu succes din certificat!");
      } else {
        toast.error("Nu am putut extrage datele. Completați manual.");
      }
    } catch (error) {
      toast.error("Eroare la procesarea imaginii");
      console.error(error);
    } finally {
      setIsOcrProcessing(false);
    }
  };

  // ── ERROR CODE HANDLER ──
  const addErrorCode = () => {
    const code = newErrorCode.trim().toUpperCase();
    if (code && !errorCodes.includes(code)) {
      setErrorCodes([...errorCodes, code]);
      setNewErrorCode("");
    }
  };

  const removeErrorCode = (code: string) => {
    setErrorCodes(errorCodes.filter(c => c !== code));
  };

  // ── ANALYSIS HANDLER ──
  const handleStartAnalysis = async () => {
    if (!brand || !model || !year) {
      toast.error("Completați datele vehiculului");
      setStep(1);
      return;
    }
    if (!symptomsText && selectedSymptoms.length === 0) {
      toast.error("Descrieți simptomele");
      setStep(2);
      return;
    }

    setStep(3);
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    // Simulate progress stages
    const stages = [
      { progress: 10, stage: "Se creează vehiculul..." },
      { progress: 20, stage: "Se inițializează agenții AI..." },
      { progress: 35, stage: "Layer 2: Analiză simptome în paralel..." },
      { progress: 50, stage: "Layer 2: Decodare coduri eroare..." },
      { progress: 65, stage: "Layer 3: Construire soluții..." },
      { progress: 80, stage: "Layer 4: Validare coerență..." },
      { progress: 90, stage: "Layer 4: Filtru logic..." },
      { progress: 95, stage: "Sintetizare raport final..." },
    ];

    let stageIndex = 0;
    const progressInterval = setInterval(() => {
      if (stageIndex < stages.length) {
        setAnalysisProgress(stages[stageIndex].progress);
        setAnalysisStage(stages[stageIndex].stage);
        stageIndex++;
      }
    }, 2500);

    try {
      // Create vehicle
      const vehicleResult = await createVehicle.mutateAsync({
        brand, model, year: parseInt(year),
        engine: engine || undefined,
        engineCode: engineCode || undefined,
        mileage: mileage ? parseInt(mileage) : undefined,
        vin: vin || undefined,
        licensePlate: licensePlate || undefined,
      });

      const vehicleId = (vehicleResult as any).vehicleId;
      if (!vehicleId) throw new Error("Failed to create vehicle");

      // Run orchestrated diagnostic
      const fullSymptoms = [
        symptomsText,
        ...selectedSymptoms.map(s => `- ${s}`),
      ].filter(Boolean).join("\n");

      const result = await runOrchestrated.mutateAsync({
        vehicleId,
        symptoms: fullSymptoms,
        errorCodes: errorCodes.length > 0 ? errorCodes : undefined,
        conditions: conditions.length > 0 ? conditions : undefined,
        category: category || undefined,
        additionalNotes: additionalNotes || undefined,
      });

      clearInterval(progressInterval);
      setAnalysisProgress(100);
      setAnalysisStage("Diagnostic complet!");
      setDiagnosticResult(result);
      setIsAnalyzing(false);

      toast.success("Diagnostic finalizat cu succes!");
    } catch (error) {
      clearInterval(progressInterval);
      setIsAnalyzing(false);
      toast.error("Eroare la analiză. Încercați din nou.");
      console.error(error);
    }
  };

  // ── STEP NAVIGATION ──
  const canProceedStep1 = brand && model && year;
  const canProceedStep2 = symptomsText || selectedSymptoms.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Diagnostic Nou</h1>
                <p className="text-sm text-slate-500">
                  {step === 1 && "Pasul 1: Identificare Vehicul"}
                  {step === 2 && "Pasul 2: Descriere Problemă"}
                  {step === 3 && "Pasul 3: Analiză AI"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-orange-500" />
              <span className="text-sm font-medium text-slate-600">Kimi Swarm AI</span>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all ${
                  step >= s
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
                    : "bg-slate-200 text-slate-500"
                }`}>
                  {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                </div>
                {s < 3 && (
                  <div className={`flex-1 h-1 mx-2 rounded-full transition-all ${
                    step > s ? "bg-orange-500" : "bg-slate-200"
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">

        {/* ═══════════════════════════════════════════════════════ */}
        {/* STEP 1: IDENTIFICARE VEHICUL */}
        {/* ═══════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Input Mode Selector */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-5 h-5 text-orange-500" />
                  Cum doriți să identificați vehiculul?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setVehicleInputMode("manual")}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      vehicleInputMode === "manual"
                        ? "border-orange-500 bg-orange-50 shadow-lg shadow-orange-500/10"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <FileText className={`w-8 h-8 mb-2 ${vehicleInputMode === "manual" ? "text-orange-500" : "text-slate-400"}`} />
                    <p className="font-semibold text-slate-900">Manual</p>
                    <p className="text-sm text-slate-500">Completați datele manual</p>
                  </button>

                  <button
                    onClick={() => setVehicleInputMode("vin")}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      vehicleInputMode === "vin"
                        ? "border-orange-500 bg-orange-50 shadow-lg shadow-orange-500/10"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <Search className={`w-8 h-8 mb-2 ${vehicleInputMode === "vin" ? "text-orange-500" : "text-slate-400"}`} />
                    <p className="font-semibold text-slate-900">Serie Caroserie</p>
                    <p className="text-sm text-slate-500">Introduceți VIN-ul</p>
                  </button>

                  <button
                    onClick={() => setVehicleInputMode("ocr")}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      vehicleInputMode === "ocr"
                        ? "border-orange-500 bg-orange-50 shadow-lg shadow-orange-500/10"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <Camera className={`w-8 h-8 mb-2 ${vehicleInputMode === "ocr" ? "text-orange-500" : "text-slate-400"}`} />
                    <p className="font-semibold text-slate-900">Poză Certificat</p>
                    <p className="text-sm text-slate-500">Scanare automată OCR</p>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* OCR Upload */}
            {vehicleInputMode === "ocr" && (
              <Card className="border-orange-200 bg-orange-50/50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleOcrUpload}
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isOcrProcessing}
                      size="lg"
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      {isOcrProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Se procesează...
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 mr-2" />
                          Încărcați poza certificatului auto
                        </>
                      )}
                    </Button>
                    <p className="text-sm text-slate-500 mt-3">
                      Kimi Vision va extrage automat toate datele din certificat
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* VIN Input */}
            {vehicleInputMode === "vin" && (
              <Card>
                <CardContent className="pt-6">
                  <Label htmlFor="vin" className="text-base font-semibold">Serie Caroserie (VIN)</Label>
                  <p className="text-sm text-slate-500 mb-3">17 caractere - se găsește pe certificatul de înmatriculare sau pe ușa șoferului</p>
                  <Input
                    id="vin"
                    value={vin}
                    onChange={(e) => setVin(e.target.value.toUpperCase())}
                    placeholder="WVWZZZ3CZWE123456"
                    maxLength={17}
                    className="text-lg font-mono tracking-wider"
                  />
                  {vin.length === 17 && (
                    <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> VIN valid - datele vor fi decodate automat la analiză
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Vehicle Data Form */}
            <Card>
              <CardHeader>
                <CardTitle>Date Vehicul</CardTitle>
                <CardDescription>
                  {vehicleInputMode === "ocr" ? "Verificați și completați datele extrase" : "Completați datele vehiculului"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="brand">Marcă *</Label>
                    <Select value={brand} onValueChange={setBrand}>
                      <SelectTrigger id="brand">
                        <SelectValue placeholder="Selectați marca" />
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
                    <Select value={model} onValueChange={setModel}>
                      <SelectTrigger id="model">
                        <SelectValue placeholder="Selectați modelul" />
                      </SelectTrigger>
                      <SelectContent>
                        {brand && MODELS_BY_BRAND[brand] ? (
                          MODELS_BY_BRAND[brand].map((m) => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">Selectați mai întâi marca</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="year">An fabricație *</Label>
                    <Input id="year" type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="ex: 2020" />
                  </div>
                  <div>
                    <Label htmlFor="mileage">Kilometraj</Label>
                    <Input id="mileage" type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} placeholder="ex: 150000" />
                  </div>
                  <div>
                    <Label htmlFor="licensePlate">Nr. Înmatriculare</Label>
                    <Input id="licensePlate" value={licensePlate} onChange={(e) => setLicensePlate(e.target.value)} placeholder="ex: B 123 ABC" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="engine">Motor</Label>
                    <Input id="engine" value={engine} onChange={(e) => setEngine(e.target.value)} placeholder="ex: 2.0 TDI 150CP" />
                  </div>
                  <div>
                    <Label htmlFor="engineCode">Cod Motor</Label>
                    <Input id="engineCode" value={engineCode} onChange={(e) => setEngineCode(e.target.value)} placeholder="ex: CBBB, N47D20" />
                  </div>
                </div>

                {vehicleInputMode !== "vin" && (
                  <div>
                    <Label htmlFor="vinManual">VIN (opțional)</Label>
                    <Input id="vinManual" value={vin} onChange={(e) => setVin(e.target.value.toUpperCase())} placeholder="Serie caroserie - 17 caractere" maxLength={17} className="font-mono" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Next Button */}
            <div className="flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                size="lg"
                className="bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20"
              >
                Pasul Următor
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* STEP 2: DESCRIERE PROBLEMĂ */}
        {/* ═══════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Vehicle Summary */}
            <Card className="bg-slate-900 text-white">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Car className="w-10 h-10 text-orange-400" />
                  <div>
                    <p className="text-lg font-bold">{brand} {model} ({year})</p>
                    <p className="text-slate-400">
                      {engine && `Motor: ${engine}`}
                      {mileage && ` | ${parseInt(mileage).toLocaleString()} km`}
                      {vin && ` | VIN: ${vin}`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-orange-500" />
                  Categorie Problemă
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      onClick={() => setCategory(cat.value)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        category === cat.value
                          ? "border-orange-500 bg-orange-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <span className="text-xl">{cat.icon}</span>
                      <p className="text-sm font-medium mt-1">{cat.label}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Symptoms Description */}
            <Card>
              <CardHeader>
                <CardTitle>Descriere Simptome</CardTitle>
                <CardDescription>Descrieți problema cât mai detaliat posibil</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={symptomsText}
                  onChange={(e) => setSymptomsText(e.target.value)}
                  placeholder="Descrieți ce se întâmplă cu vehiculul...&#10;&#10;Exemplu: Mașina pierde putere la accelerare peste 3000 RPM, se simte o vibrație puternică și check engine-ul se aprinde intermitent. Problema apare mai ales la cald, după 20 minute de mers."
                  rows={5}
                  className="text-base"
                />

                {/* Quick Symptoms */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">Simptome Frecvente</Label>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_SYMPTOMS.map(symptom => (
                      <button
                        key={symptom}
                        onClick={() => {
                          if (selectedSymptoms.includes(symptom)) {
                            setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
                          } else {
                            setSelectedSymptoms([...selectedSymptoms, symptom]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                          selectedSymptoms.includes(symptom)
                            ? "bg-orange-500 text-white shadow-md"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {symptom}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Error Codes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Coduri Eroare (OBD-II / VCDS / ISTA)
                </CardTitle>
                <CardDescription>Introduceți codurile de eroare citite cu testerul</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                  <p className="text-sm text-blue-700">💡 Conectați un scanner Bluetooth OBD-II pentru a citi codurile direct din vehicul</p>
                  <Button
                    onClick={() => navigate("/obd-scanner")}
                    variant="outline"
                    size="sm"
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <Bluetooth className="w-4 h-4 mr-2" />
                    OBD Scanner
                  </Button>
                </div>
                <div className="flex gap-2 mb-4">
                  <Input
                    value={newErrorCode}
                    onChange={(e) => setNewErrorCode(e.target.value.toUpperCase())}
                    placeholder="ex: P0300, 16684, 2A87"
                    onKeyDown={(e) => e.key === "Enter" && addErrorCode()}
                    className="font-mono"
                  />
                  <Button onClick={addErrorCode} variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {errorCodes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {errorCodes.map(code => (
                      <Badge key={code} variant="destructive" className="text-sm py-1 px-3 gap-1">
                        {code}
                        <button onClick={() => removeErrorCode(code)}>
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Conditions */}
            <Card>
              <CardHeader>
                <CardTitle>Condiții de Apariție</CardTitle>
                <CardDescription>Când apare problema?</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {CONDITIONS.map(cond => (
                    <button
                      key={cond}
                      onClick={() => {
                        if (conditions.includes(cond)) {
                          setConditions(conditions.filter(c => c !== cond));
                        } else {
                          setConditions([...conditions, cond]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                        conditions.includes(cond)
                          ? "bg-blue-500 text-white shadow-md"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {cond}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Additional Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Note Adiționale</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Orice informație suplimentară relevantă (reparații anterioare, piese schimbate recent, etc.)"
                  rows={3}
                />
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Înapoi
              </Button>
              <Button
                onClick={handleStartAnalysis}
                disabled={!canProceedStep2}
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg shadow-orange-500/20"
              >
                <Zap className="w-5 h-5 mr-2" />
                Lansează Diagnostic AI
              </Button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* STEP 3: ANALIZĂ AI */}
        {/* ═══════════════════════════════════════════════════════ */}
        {step === 3 && (
          <div className="space-y-6">
            {isAnalyzing && !diagnosticResult && (
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                      <Brain className="w-7 h-7 animate-pulse" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Kimi Swarm AI Diagnostic</h2>
                      <p className="text-orange-100">Orchestrare multi-agent în curs...</p>
                    </div>
                  </div>
                  <Progress value={analysisProgress} className="h-3 bg-white/20" />
                  <p className="text-sm text-orange-100 mt-3">{analysisStage}</p>
                </div>

                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Agent Status Indicators */}
                    {[
                      { name: "VIN Decoder", layer: 1, threshold: 10 },
                      { name: "Symptom Analyzer", layer: 2, threshold: 35 },
                      { name: "Error Code Expert", layer: 2, threshold: 35 },
                      { name: "Technical Manual Agent", layer: 2, threshold: 35 },
                      { name: "Component Evaluator", layer: 2, threshold: 50 },
                      { name: "Elimination Logic", layer: 3, threshold: 65 },
                      { name: "Repair Procedure", layer: 3, threshold: 65 },
                      { name: "Parts Identifier", layer: 3, threshold: 65 },
                      { name: "Cross-Reference Validator", layer: 4, threshold: 80 },
                      { name: "Logic Filter", layer: 4, threshold: 90 },
                      { name: "Final Synthesizer", layer: 4, threshold: 95 },
                    ].map(agent => {
                      const status = analysisProgress >= agent.threshold + 10
                        ? "complete"
                        : analysisProgress >= agent.threshold
                          ? "running"
                          : "pending";
                      return (
                        <div key={agent.name} className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            status === "complete" ? "bg-green-500" :
                            status === "running" ? "bg-orange-500 animate-pulse" :
                            "bg-slate-300"
                          }`} />
                          <span className={`text-sm ${
                            status === "complete" ? "text-green-700 font-medium" :
                            status === "running" ? "text-orange-600 font-medium" :
                            "text-slate-400"
                          }`}>
                            Layer {agent.layer}: {agent.name}
                          </span>
                          {status === "complete" && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
                          {status === "running" && <Loader2 className="w-4 h-4 text-orange-500 animate-spin ml-auto" />}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results */}
            {diagnosticResult && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-slate-900">Diagnostic Complet</h2>
                  <p className="text-slate-500">
                    Navigați la pagina de rezultate pentru detalii complete
                  </p>
                </div>

                {/* Quick Summary */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-3xl font-bold text-orange-500">
                          {diagnosticResult.report?.validation?.overallAccuracy || "N/A"}%
                        </p>
                        <p className="text-sm text-slate-500">Acuratețe</p>
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-blue-500">
                          {diagnosticResult.report?.probableCauses?.length || 0}
                        </p>
                        <p className="text-sm text-slate-500">Cauze Identificate</p>
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-green-500">
                          {diagnosticResult.report?.eliminationSteps?.length || 0}
                        </p>
                        <p className="text-sm text-slate-500">Pași Eliminare</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Suggestions */}
                {brand && model && year && mileage && (
                  <div className="space-y-4">
                    <AISuggestions
                      symptoms={selectedSymptoms}
                      brand={brand}
                      model={model}
                      year={parseInt(year)}
                      mileage={parseInt(mileage)}
                      category={category}
                      errorCodes={errorCodes}
                    />
                    <MaintenanceRecommendations
                      brand={brand}
                      model={model}
                      year={parseInt(year)}
                      mileage={parseInt(mileage)}
                      fuelType="Petrol"
                      transmissionType="Manual"
                      driveType="FWD"
                    />
                  </div>
                )}

                <div className="flex justify-center gap-4">
                  <Button
                    onClick={() => navigate(`/diagnostic/${diagnosticResult.diagnosticId}`)}
                    size="lg"
                    className="bg-orange-500 hover:bg-orange-600 shadow-lg"
                  >
                    <FileText className="w-5 h-5 mr-2" />
                    Vezi Rezultate Complete
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/dashboard")}
                  >
                    Înapoi la Dashboard
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
