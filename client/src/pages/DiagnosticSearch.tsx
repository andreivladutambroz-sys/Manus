import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, AlertCircle, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function DiagnosticSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const search = trpc.diagnostic.search.useQuery(
    { query: searchQuery, limit: 20 },
    { enabled: submitted && searchQuery.length >= 2 }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      setSubmitted(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(e as any);
    }
  };

  const results = search.data?.results || [];
  const isSearching = search.isLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Search Repairs</h1>
          <p className="text-slate-400">Find solutions by error code, symptom, or vehicle</p>
        </div>

        {/* Search Section */}
        <Card className="mb-8 bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Find a Solution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="P0171, rough idle, BMW 320i..."
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
                {isSearching ? "Searching..." : "Search"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          {isSearching && (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <div className="text-center text-slate-400">
                  <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                  <p>Searching...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {search.error && (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <div className="text-center text-red-400">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                  <p>Search error. Try again.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {results.length === 0 && searchQuery && !isSearching && submitted && (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <div className="text-center text-slate-400">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No results found for "{searchQuery}"</p>
                </div>
              </CardContent>
            </Card>
          )}

          {results.map((record: any, idx: number) => (
            <Card key={idx} className="bg-slate-800 border-slate-700 hover:border-slate-600 transition">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-white text-xl">
                      {record.vehicleMake} {record.vehicleModel}
                      {record.vehicleYear && (
                        <span className="text-slate-400 text-sm ml-2">({record.vehicleYear})</span>
                      )}
                    </CardTitle>
                    {record.errorCode && (
                      <CardDescription className="text-slate-300 mt-1">
                        Error Code: <Badge variant="secondary" className="ml-1">{record.errorCode}</Badge>
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Error Description */}
                {record.errorDescription && (
                  <div>
                    <p className="text-slate-300 text-sm">{record.errorDescription}</p>
                  </div>
                )}

                {/* Symptoms */}
                {record.symptoms && (
                  <div>
                    <h4 className="text-white font-semibold mb-2 text-sm">Symptoms</h4>
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(record.symptoms)
                        ? record.symptoms
                        : JSON.parse(record.symptoms || "[]")
                      ).map((symptom: string, i: number) => (
                        <Badge key={i} variant="outline" className="bg-slate-700 text-slate-200">
                          {symptom}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Repair Action */}
                {record.repairAction && (
                  <div>
                    <h4 className="text-white font-semibold mb-2 text-sm">What to Do</h4>
                    <p className="text-slate-300 text-sm">{record.repairAction}</p>
                  </div>
                )}

                {/* Footer */}
                <div className="pt-2 border-t border-slate-700">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div>
                      {record.repairOutcome === "success" && "✅ Success"}
                      {record.repairOutcome === "partial" && "⚠️ Partial"}
                      {record.repairOutcome === "failed" && "❌ Failed"}
                      {record.sourceType && (
                        <span className="ml-2 capitalize">• {record.sourceType}</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {!submitted && (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-center text-slate-400">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Start searching above</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
