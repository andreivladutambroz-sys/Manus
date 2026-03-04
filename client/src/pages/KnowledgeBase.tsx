import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, BookOpen } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

// Mock data - în producție ar veni din API
const KNOWLEDGE_BASE = [
  {
    id: 1,
    brand: "Volkswagen",
    engine: "2.0 TDI",
    errorCode: "P0401",
    problem: "EGR System Malfunction",
    probableCause: "Valve stuck or carbon buildup",
    solution: "Clean or replace EGR valve",
    repairTime: "2-3 hours",
    estimatedCost: "200-400 EUR",
    frequency: "Frecvent",
  },
  {
    id: 2,
    brand: "Audi",
    engine: "2.0 TDI",
    errorCode: "P0101",
    problem: "Mass Airflow Sensor Error",
    probableCause: "Dirty sensor or wiring issue",
    solution: "Clean or replace MAF sensor",
    repairTime: "1-2 hours",
    estimatedCost: "150-300 EUR",
    frequency: "Frecvent",
  },
  {
    id: 3,
    brand: "Skoda",
    engine: "1.9 TDI",
    errorCode: "P0087",
    problem: "Fuel Pressure Too Low",
    probableCause: "Fuel pump failure or filter clogged",
    solution: "Replace fuel pump or filter",
    repairTime: "3-4 hours",
    estimatedCost: "400-600 EUR",
    frequency: "Moderat",
  },
  {
    id: 4,
    brand: "Volkswagen",
    engine: "1.8 TSI",
    errorCode: "P0011",
    problem: "Camshaft Timing Over-Advanced",
    probableCause: "Timing chain stretched or valve issue",
    solution: "Replace timing chain or adjust valves",
    repairTime: "4-6 hours",
    estimatedCost: "800-1200 EUR",
    frequency: "Rar",
  },
];

const BRANDS = ["Toate", "Volkswagen", "Audi", "Skoda", "Seat"];

export default function KnowledgeBase() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("Toate");
  const [selectedFrequency, setSelectedFrequency] = useState("Toate");

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

  const filteredItems = KNOWLEDGE_BASE.filter(item => {
    const matchesSearch = 
      item.problem.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.errorCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.probableCause.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBrand = selectedBrand === "Toate" || item.brand === selectedBrand;
    const matchesFrequency = selectedFrequency === "Toate" || item.frequency === selectedFrequency;

    return matchesSearch && matchesBrand && matchesFrequency;
  });

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case "Frecvent":
        return "bg-red-100 text-red-800";
      case "Moderat":
        return "bg-yellow-100 text-yellow-800";
      case "Rar":
        return "bg-green-100 text-green-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-8 h-8 text-orange-500" />
            <h1 className="text-3xl font-bold text-slate-900">Baza de Cunoștințe VAG</h1>
          </div>
          <p className="text-slate-600">Probleme comune și soluții pentru vehicule VAG</p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Căutare
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Căutare problemă sau cod eroare..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Marcă
                </label>
                <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BRANDS.map(brand => (
                      <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Frecvență
                </label>
                <Select value={selectedFrequency} onValueChange={setSelectedFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Toate">Toate</SelectItem>
                    <SelectItem value="Frecvent">Frecvent</SelectItem>
                    <SelectItem value="Moderat">Moderat</SelectItem>
                    <SelectItem value="Rar">Rar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          {filteredItems.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-slate-600">Nu au fost găsite rezultate</p>
              </CardContent>
            </Card>
          ) : (
            filteredItems.map(item => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{item.problem}</CardTitle>
                      <p className="text-sm text-slate-600 mt-1">
                        {item.brand} • {item.engine}
                      </p>
                    </div>
                    <Badge variant="outline" className="font-mono">
                      {item.errorCode}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Cauza Probabilă</h4>
                    <p className="text-slate-700">{item.probableCause}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Soluție</h4>
                    <p className="text-slate-700">{item.solution}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200">
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Timp Estimat</p>
                      <p className="font-semibold text-slate-900">{item.repairTime}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Cost Estimat</p>
                      <p className="font-semibold text-slate-900">{item.estimatedCost}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Frecvență</p>
                      <Badge className={getFrequencyColor(item.frequency)}>
                        {item.frequency}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
          >
            Înapoi la Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
