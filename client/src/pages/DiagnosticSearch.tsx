import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, AlertCircle, Wrench, Lightbulb, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface SearchResult {
  id: number;
  vehicleMake: string;
  vehicleModel: string;
  year?: number;
  engine?: string;
  errorCode: string;
  symptoms: string[];
  confidence: string;
  sourceUrl: string;
}

export default function DiagnosticSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Use tRPC query for search
  const { data: searchData, isLoading, error } = trpc.diagnostic.search.useQuery(
    { query: searchQuery, limit: 20 },
    { enabled: searchQuery.length > 0 }
  );

  // Update results when search data changes
  if (searchData && searchData.results) {
    setResults(searchData.results);
  }

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setHasSearched(true);
    }
  }, [searchQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setHasSearched(false);
  };

  const confidenceColor = (conf: string | number) => {
    const num = typeof conf === 'string' ? parseFloat(conf) : conf;
    if (num >= 0.85) return 'bg-green-100 text-green-800';
    if (num >= 0.75) return 'bg-blue-100 text-blue-800';
    if (num >= 0.65) return 'bg-yellow-100 text-yellow-800';
    return 'bg-orange-100 text-orange-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Diagnostic Search</h1>
          <p className="text-slate-400">Find real repair cases and solutions from verified sources</p>
        </div>

        {/* Search Form */}
        <Card className="mb-8 bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Search Repair Cases</CardTitle>
            <CardDescription>Search by error code (P0171), vehicle make (BMW), or model (Civic)</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="Enter error code, vehicle make, or model..."
                value={searchQuery}
                onChange={handleInputChange}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
              <Button
                type="submit"
                disabled={!searchQuery.trim() || isLoading}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Card className="mb-8 bg-red-900/20 border-red-700">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-red-400 font-medium">Search temporarily unavailable</p>
                  <p className="text-red-300 text-sm mt-1">Please try again in a moment</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {hasSearched && !isLoading && results.length === 0 && !error && (
          <Card className="mb-8 bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400">No results found for "{searchQuery}"</p>
                <p className="text-slate-500 text-sm mt-2">Try searching with different keywords</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            <div className="text-sm text-slate-400">
              Found {results.length} repair case{results.length !== 1 ? 's' : ''}
            </div>

            {results.map((result) => (
              <Card key={result.id} className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-white">
                          {result.vehicleModel} ({result.year})
                        </CardTitle>
                        <Badge variant="outline" className="text-slate-300 border-slate-600">
                          {result.vehicleMake}
                        </Badge>
                      </div>
                      <CardDescription className="text-slate-400">
                        {result.engine && `${result.engine} • `}
                        Error Code: <span className="font-mono text-orange-400">{result.errorCode}</span>
                      </CardDescription>
                    </div>
                    <Badge className={confidenceColor(result.confidence)}>
                      {typeof result.confidence === 'string' 
                        ? (parseFloat(result.confidence) * 100).toFixed(0) 
                        : (result.confidence * 100).toFixed(0)}% Match
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Symptoms */}
                  {Array.isArray(result.symptoms) && result.symptoms.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-orange-400" />
                        <p className="font-medium text-white">Symptoms</p>
                      </div>
                      <div className="flex flex-wrap gap-2 ml-6">
                        {result.symptoms.map((symptom, idx) => (
                          <Badge key={idx} variant="secondary" className="bg-slate-700 text-slate-200">
                            {symptom}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Source */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-700">
                    <Lightbulb className="w-4 h-4 text-slate-400" />
                    <a
                      href={result.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-400 hover:text-blue-300 truncate"
                    >
                      View source
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Initial State */}
        {!hasSearched && results.length === 0 && !isLoading && !error && (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Wrench className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">Start searching to find repair cases</p>
                <p className="text-slate-500 text-sm mt-2">Search by error code, vehicle make, or model</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
