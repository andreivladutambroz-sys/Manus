import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search, Wrench, AlertCircle, TrendingUp } from 'lucide-react';
import { trpc } from '@/lib/trpc';

const VEHICLE_MAKES = [
  'BMW', 'Toyota', 'Mercedes', 'Ford', 'Honda', 'Audi', 'Volkswagen',
  'Nissan', 'Chevy', 'Dodge', 'Hyundai', 'Kia', 'Mazda', 'Subaru'
];

const COMMON_ERROR_CODES = [
  { code: 'P0171', desc: 'System Too Lean' },
  { code: 'P0300', desc: 'Random Misfire' },
  { code: 'P0420', desc: 'Catalyst System' },
  { code: 'P0128', desc: 'Coolant Thermostat' },
  { code: 'P0505', desc: 'Idle Control' },
  { code: 'P0101', desc: 'Mass Airflow' },
  { code: 'P0335', desc: 'Crankshaft Sensor' },
  { code: 'P0700', desc: 'Transmission' }
];

export function DiagnosticSearchMobile() {
  const [searchTab, setSearchTab] = useState('vehicle');
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [symptom, setSymptom] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleVehicleSearch = async () => {
    if (!vehicleMake || !vehicleModel) return;
    setIsLoading(true);
    // API call would go here
    setIsLoading(false);
  };

  const handleCodeSearch = async () => {
    if (!errorCode) return;
    setIsLoading(true);
    // API call would go here
    setIsLoading(false);
  };

  const handleSymptomSearch = async () => {
    if (!symptom) return;
    setIsLoading(true);
    // API call would go here
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border p-4 space-y-3">
        <h1 className="text-2xl font-bold text-foreground">Diagnostic Search</h1>
        <p className="text-sm text-muted-foreground">Find repair solutions quickly</p>
      </div>

      {/* Search Tabs */}
      <Tabs value={searchTab} onValueChange={setSearchTab} className="w-full">
        <TabsList className="w-full grid grid-cols-3 rounded-none border-b border-border">
          <TabsTrigger value="vehicle" className="rounded-none">By Vehicle</TabsTrigger>
          <TabsTrigger value="code" className="rounded-none">By Code</TabsTrigger>
          <TabsTrigger value="symptom" className="rounded-none">By Symptom</TabsTrigger>
        </TabsList>

        {/* Search by Vehicle */}
        <TabsContent value="vehicle" className="p-4 space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Vehicle Make
              </label>
              <Select value={vehicleMake} onValueChange={setVehicleMake}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select make..." />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_MAKES.map(make => (
                    <SelectItem key={make} value={make}>{make}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Model
              </label>
              <Input
                placeholder="e.g., 320d, Camry, C200"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                className="w-full"
              />
            </div>

            <Button
              onClick={handleVehicleSearch}
              disabled={!vehicleMake || !vehicleModel || isLoading}
              className="w-full"
              size="lg"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </TabsContent>

        {/* Search by Error Code */}
        <TabsContent value="code" className="p-4 space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Error Code
              </label>
              <Input
                placeholder="e.g., P0171"
                value={errorCode}
                onChange={(e) => setErrorCode(e.target.value.toUpperCase())}
                className="w-full font-mono"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Common Codes
              </label>
              <div className="grid grid-cols-2 gap-2">
                {COMMON_ERROR_CODES.map(({ code, desc }) => (
                  <Button
                    key={code}
                    variant="outline"
                    size="sm"
                    onClick={() => setErrorCode(code)}
                    className="text-xs h-auto py-2"
                  >
                    <div className="text-left">
                      <div className="font-mono font-bold">{code}</div>
                      <div className="text-xs opacity-70">{desc}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleCodeSearch}
              disabled={!errorCode || isLoading}
              className="w-full"
              size="lg"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </TabsContent>

        {/* Search by Symptom */}
        <TabsContent value="symptom" className="p-4 space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Describe Symptoms
              </label>
              <textarea
                placeholder="e.g., rough idle, check engine light, poor fuel economy"
                value={symptom}
                onChange={(e) => setSymptom(e.target.value)}
                className="w-full p-3 border border-border rounded-md bg-background text-foreground text-sm"
                rows={4}
              />
            </div>

            <Button
              onClick={handleSymptomSearch}
              disabled={!symptom || isLoading}
              className="w-full"
              size="lg"
            >
              <Wrench className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Results */}
      {results.length > 0 && (
        <div className="p-4 space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Results</h2>
          {results.map((result, idx) => (
            <Card key={idx} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-foreground">
                    {result.vehicle_make} {result.vehicle_model}
                  </h3>
                  <Badge variant="secondary" className="mt-1">
                    {result.error_code}
                  </Badge>
                </div>
                <Badge variant="outline" className="text-xs">
                  {Math.round(result.confidence * 100)}%
                </Badge>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Symptoms</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {result.symptoms?.slice(0, 3).map((s: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground">Repair Steps</p>
                  <ol className="text-sm space-y-1 mt-1">
                    {result.repair_steps?.slice(0, 2).map((step: string, i: number) => (
                      <li key={i} className="text-foreground">
                        {i + 1}. {step}
                      </li>
                    ))}
                  </ol>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground">Tools Needed</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {result.tools_required?.slice(0, 3).map((tool: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {tool}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <Button variant="outline" size="sm" className="w-full text-xs">
                View Full Details
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {results.length === 0 && (
        <div className="p-4 text-center space-y-3 mt-8">
          <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
          <p className="text-muted-foreground">
            Use the search tabs above to find diagnostic solutions
          </p>
        </div>
      )}
    </div>
  );
}
