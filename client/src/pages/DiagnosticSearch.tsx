import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, AlertCircle, Wrench, Lightbulb } from 'lucide-react';

interface DiagnosticRecord {
  vehicle_make: string;
  vehicle_model: string;
  year?: number;
  error_code: string;
  symptoms: string[];
  repair_steps: string[];
  tools_required?: string[];
  torque_specs?: { [key: string]: string };
  source_url: string;
  confidence: number;
}

export default function DiagnosticSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'vehicle' | 'code' | 'symptom'>('vehicle');
  const [results, setResults] = useState<DiagnosticRecord[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Mock data for demonstration
  const mockData: DiagnosticRecord[] = [
    {
      vehicle_make: 'BMW',
      vehicle_model: '320d',
      year: 2010,
      error_code: 'P0171',
      symptoms: ['CEL', 'knock', 'idle rough'],
      repair_steps: ['Scan OBD', 'Check fuel pressure', 'Inspect injectors', 'Replace fuel filter'],
      tools_required: ['OBD scanner', 'Fuel pressure gauge', 'Socket set'],
      torque_specs: { 'fuel_rail': '25 Nm', 'injectors': '15 Nm' },
      source_url: 'https://www.bimmerfest.com/forums/',
      confidence: 0.85
    },
    {
      vehicle_make: 'Toyota',
      vehicle_model: 'Camry',
      year: 2015,
      error_code: 'P0300',
      symptoms: ['misfire', 'idle rough', 'hesitation'],
      repair_steps: ['Scan OBD', 'Check spark plugs', 'Test coils', 'Replace plugs if needed'],
      tools_required: ['OBD scanner', 'Spark plug socket', 'Gap tool'],
      source_url: 'https://www.reddit.com/r/MechanicAdvice/',
      confidence: 0.78
    },
    {
      vehicle_make: 'Mercedes',
      vehicle_model: 'C200',
      year: 2012,
      error_code: 'P0700',
      symptoms: ['transmission_slip', 'power_loss'],
      repair_steps: ['Scan transmission', 'Check fluid level', 'Inspect filter', 'Replace fluid'],
      tools_required: ['OBD scanner', 'Transmission fluid', 'Filter'],
      source_url: 'https://www.youcanic.com/guides',
      confidence: 0.82
    }
  ];

  const handleSearch = () => {
    setIsSearching(true);
    
    // Simulate search delay
    setTimeout(() => {
      const filtered = mockData.filter(record => {
        const query = searchQuery.toLowerCase();
        
        if (filterType === 'vehicle') {
          return (
            record.vehicle_make.toLowerCase().includes(query) ||
            record.vehicle_model.toLowerCase().includes(query)
          );
        } else if (filterType === 'code') {
          return record.error_code.toLowerCase().includes(query);
        } else {
          return record.symptoms.some(s => s.toLowerCase().includes(query));
        }
      });
      
      setResults(filtered);
      setIsSearching(false);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🔧 Diagnostic Search</h1>
          <p className="text-slate-400">Find repair procedures for your vehicle issues</p>
        </div>

        {/* Search Section */}
        <Card className="mb-8 bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Search Diagnostics</CardTitle>
            <CardDescription>Search by vehicle, error code, or symptom</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {(['vehicle', 'code', 'symptom'] as const).map(type => (
                <Button
                  key={type}
                  variant={filterType === type ? 'default' : 'outline'}
                  onClick={() => setFilterType(type)}
                  className="capitalize"
                >
                  {type === 'vehicle' && '🚗 Vehicle'}
                  {type === 'code' && '📊 Error Code'}
                  {type === 'symptom' && '⚠️ Symptom'}
                </Button>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder={
                  filterType === 'vehicle' ? 'e.g., BMW 320d' :
                  filterType === 'code' ? 'e.g., P0171' :
                  'e.g., rough idle'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              />
              <Button
                onClick={handleSearch}
                disabled={!searchQuery || isSearching}
                className="gap-2"
              >
                <Search className="w-4 h-4" />
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          {results.length === 0 && searchQuery && !isSearching && (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <div className="text-center text-slate-400">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No results found for "{searchQuery}"</p>
                </div>
              </CardContent>
            </Card>
          )}

          {results.map((record, idx) => (
            <Card key={idx} className="bg-slate-800 border-slate-700 hover:border-slate-600 transition">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-white text-xl">
                      {record.vehicle_make} {record.vehicle_model}
                      {record.year && <span className="text-slate-400 text-sm ml-2">({record.year})</span>}
                    </CardTitle>
                    <CardDescription className="text-slate-300 mt-1">
                      Error Code: <Badge variant="secondary" className="ml-1">{record.error_code}</Badge>
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-400">Confidence</div>
                    <div className="text-lg font-bold text-green-400">{(record.confidence * 100).toFixed(0)}%</div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Symptoms */}
                <div>
                  <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Symptoms
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {record.symptoms.map((symptom, i) => (
                      <Badge key={i} variant="outline" className="bg-slate-700 text-slate-200">
                        {symptom}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Repair Steps */}
                <div>
                  <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                    <Wrench className="w-4 h-4" />
                    Repair Steps
                  </h4>
                  <ol className="list-decimal list-inside space-y-1 text-slate-300">
                    {record.repair_steps.map((step, i) => (
                      <li key={i} className="text-sm">{step}</li>
                    ))}
                  </ol>
                </div>

                {/* Tools Required */}
                {record.tools_required && record.tools_required.length > 0 && (
                  <div>
                    <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      Tools Required
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {record.tools_required.map((tool, i) => (
                        <Badge key={i} variant="secondary" className="bg-slate-700">
                          {tool}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Torque Specs */}
                {record.torque_specs && Object.keys(record.torque_specs).length > 0 && (
                  <div>
                    <h4 className="text-white font-semibold mb-2">Torque Specifications</h4>
                    <div className="bg-slate-700 rounded p-3 text-sm text-slate-300 space-y-1">
                      {Object.entries(record.torque_specs).map(([key, value], i) => (
                        <div key={i} className="flex justify-between">
                          <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                          <span className="font-mono font-semibold">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Source */}
                <div className="pt-2 border-t border-slate-700">
                  <a
                    href={record.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    View Source →
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Section */}
        {results.length === 0 && !searchQuery && (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-center text-slate-400">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Start by searching for a vehicle, error code, or symptom above</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
