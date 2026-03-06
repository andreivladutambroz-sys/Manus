import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, AlertCircle, Wrench, Lightbulb, Loader2, ChevronDown, ChevronUp, Clock, DollarSign, Zap, X, Heart, Download, Edit2, Save, Trash2, FileText } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useFavorites, type FavoriteCase, type RepairStatus, STATUS_COLORS, STATUS_LABELS } from '@/hooks/useFavorites';
import { exportFavoritesToPDF } from '@/lib/exportPdf';

interface SearchResult {
  id: number;
  vehicleMake: string;
  vehicleModel: string;
  year?: number;
  engine?: string;
  errorCode: string;
  symptoms: string[];
  repairAction: string;
  repairTimeHours: number | null;
  repairCostEstimate: number | null;
  toolsUsed: string[];
  confidence: string;
  sourceUrl: string;
}

interface ExpandedState {
  [key: number]: boolean;
}

interface EditingNotes {
  [key: number]: string;
}

interface Filters {
  minYear?: number;
  maxYear?: number;
  engineFilter?: string;
  minConfidence?: number;
}

type ViewMode = 'search' | 'favorites';

export default function DiagnosticSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [expandedResults, setExpandedResults] = useState<ExpandedState>({});
  const [filters, setFilters] = useState<Filters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('search');
  const [editingNotes, setEditingNotes] = useState<EditingNotes>({});

  const { favorites, toggleFavorite, isFavorite, isLoaded, updateNote, deleteNote, updateStatus } = useFavorites();

  // Use tRPC query for search with filters
  const { data: searchData, isLoading, error } = trpc.diagnostic.search.useQuery(
    { 
      query: searchQuery, 
      limit: 20,
      ...filters
    },
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
      setExpandedResults({});
      setViewMode('search');
    }
  }, [searchQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setHasSearched(false);
  };

  const toggleExpand = (id: number) => {
    setExpandedResults(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const updateFilter = (key: keyof Filters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined && v !== '');

  const confidenceColor = (conf: string | number) => {
    const num = typeof conf === 'string' ? parseFloat(conf) : conf;
    if (num >= 0.85) return 'bg-green-100 text-green-800';
    if (num >= 0.75) return 'bg-blue-100 text-blue-800';
    if (num >= 0.65) return 'bg-yellow-100 text-yellow-800';
    return 'bg-orange-100 text-orange-800';
  };

  const getConfidencePercent = (conf: string | number) => {
    const num = typeof conf === 'string' ? parseFloat(conf) : conf;
    return (num * 100).toFixed(0);
  };

  const handleBookmarkClick = (result: SearchResult) => {
    const favoriteCase: FavoriteCase = {
      id: result.id,
      vehicleMake: result.vehicleMake,
      vehicleModel: result.vehicleModel,
      year: result.year,
      engine: result.engine,
      errorCode: result.errorCode,
      confidence: result.confidence,
      symptoms: result.symptoms,
      sourceUrl: result.sourceUrl,
    };
    toggleFavorite(favoriteCase);
  };

  const handleExportPDF = () => {
    exportFavoritesToPDF(favorites);
  };

  const startEditNote = (caseId: number, currentNote: string | undefined) => {
    setEditingNotes(prev => ({
      ...prev,
      [caseId]: currentNote || ''
    }));
  };

  const saveNote = (caseId: number) => {
    const note = editingNotes[caseId];
    if (note && note.length > 1000) {
      alert('Note must be less than 1000 characters');
      return;
    }
    updateNote(caseId, note);
    setEditingNotes(prev => {
      const updated = { ...prev };
      delete updated[caseId];
      return updated;
    });
  };

  const cancelEditNote = (caseId: number) => {
    setEditingNotes(prev => {
      const updated = { ...prev };
      delete updated[caseId];
      return updated;
    });
  };

  const renderResultCard = (result: SearchResult, isFav: boolean) => (
    <Card key={result.id} className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors overflow-hidden">
      {/* Compact Header */}
      <button
        onClick={() => toggleExpand(result.id)}
        className="w-full text-left"
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-white text-lg">
                  {result.vehicleModel} ({result.year})
                </CardTitle>
                <Badge variant="outline" className="text-slate-300 border-slate-600">
                  {result.vehicleMake}
                </Badge>
              </div>
              <CardDescription className="text-slate-400">
                {result.engine && `${result.engine} • `}
                <span className="font-mono text-orange-400">{result.errorCode}</span>
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={confidenceColor(result.confidence)}>
                {getConfidencePercent(result.confidence)}% Match
              </Badge>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleBookmarkClick(result);
                }}
                className="p-2 hover:bg-slate-700 rounded transition-colors"
              >
                <Heart
                  className={`w-5 h-5 ${
                    isFav
                      ? 'fill-red-500 text-red-500'
                      : 'text-slate-400 hover:text-red-400'
                  }`}
                />
              </button>
              {expandedResults[result.id] ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </div>
          </div>
        </CardHeader>
      </button>

      {/* Expandable Details */}
      {expandedResults[result.id] && (
        <CardContent className="space-y-4 border-t border-slate-700 pt-4">
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

          {/* Repair Action */}
          {result.repairAction && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Wrench className="w-4 h-4 text-blue-400" />
                <p className="font-medium text-white">Repair Steps</p>
              </div>
              <p className="text-slate-300 ml-6 text-sm leading-relaxed">
                {result.repairAction}
              </p>
            </div>
          )}

          {/* Tools Required */}
          {Array.isArray(result.toolsUsed) && result.toolsUsed.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <p className="font-medium text-white">Tools Required</p>
              </div>
              <ul className="ml-6 space-y-1">
                {result.toolsUsed.map((tool, idx) => (
                  <li key={idx} className="text-slate-300 text-sm flex items-start">
                    <span className="mr-2">•</span>
                    <span>{tool}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Time & Cost */}
          <div className="grid grid-cols-2 gap-4">
            {result.repairTimeHours !== null && (
              <div className="bg-slate-700 rounded p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <p className="text-xs font-medium text-slate-400">Estimated Time</p>
                </div>
                <p className="text-white font-semibold">
                  {result.repairTimeHours.toFixed(1)} hours
                </p>
              </div>
            )}
            {result.repairCostEstimate !== null && (
              <div className="bg-slate-700 rounded p-3">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <p className="text-xs font-medium text-slate-400">Estimated Cost</p>
                </div>
                <p className="text-white font-semibold">
                  ${result.repairCostEstimate.toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {/* Source Link */}
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
      )}
    </Card>
  );

  const renderFavoriteCard = (favorite: FavoriteCase) => {
    const isEditingNote = editingNotes[favorite.id] !== undefined;
    const hasNote = !!favorite.notes;

    return (
      <Card key={favorite.id} className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors overflow-hidden">
        <button
          onClick={() => toggleExpand(favorite.id)}
          className="w-full text-left"
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-white text-lg">
                    {favorite.vehicleModel} ({favorite.year})
                  </CardTitle>
                  <Badge variant="outline" className="text-slate-300 border-slate-600">
                    {favorite.vehicleMake}
                  </Badge>
                  {hasNote && (
                    <Badge className="bg-blue-600 text-white">
                      <FileText className="w-3 h-3 mr-1" />
                      Note
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-slate-400">
                  {favorite.engine && `${favorite.engine} • `}
                  <span className="font-mono text-orange-400">{favorite.errorCode}</span>
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={confidenceColor(favorite.confidence)}>
                  {getConfidencePercent(favorite.confidence)}% Match
                </Badge>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(favorite);
                  }}
                  className="p-2 hover:bg-slate-700 rounded transition-colors"
                >
                  <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                </button>
                {expandedResults[favorite.id] ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </div>
          </CardHeader>
        </button>

        {/* Expandable Details */}
        {expandedResults[favorite.id] && (
          <CardContent className="space-y-4 border-t border-slate-700 pt-4">
            {/* Symptoms */}
            {Array.isArray(favorite.symptoms) && favorite.symptoms.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-orange-400" />
                  <p className="font-medium text-white">Symptoms</p>
                </div>
                <div className="flex flex-wrap gap-2 ml-6">
                  {favorite.symptoms.map((symptom, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-slate-700 text-slate-200">
                      {symptom}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Status Selector */}
            <div className="bg-slate-700 rounded p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-medium text-white">Status</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['pending', 'in progress', 'completed', 'resolved', 'not fixed'] as RepairStatus[]).map(status => (
                  <button
                    key={status}
                    onClick={() => updateStatus(favorite.id, status)}
                    className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                      favorite.status === status
                        ? STATUS_COLORS[status]
                        : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                    }`}
                  >
                    {STATUS_LABELS[status]}
                  </button>
                ))}
              </div>
              {favorite.resolvedDate && (favorite.status === 'resolved' || favorite.status === 'completed') && (
                <p className="text-xs text-slate-400 mt-2">Resolved: {favorite.resolvedDate}</p>
              )}
            </div>

            {/* Notes Section */}
            <div className="bg-slate-700 rounded p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <p className="font-medium text-white">Notes</p>
                </div>
                {!isEditingNote && (
                  <button
                    onClick={() => startEditNote(favorite.id, favorite.notes)}
                    className="p-1 hover:bg-slate-600 rounded transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-slate-400 hover:text-slate-200" />
                  </button>
                )}
              </div>

              {isEditingNote ? (
                <div className="space-y-2">
                  <textarea
                    value={editingNotes[favorite.id]}
                    onChange={(e) => {
                      if (e.target.value.length <= 1000) {
                        setEditingNotes(prev => ({
                          ...prev,
                          [favorite.id]: e.target.value
                        }));
                      }
                    }}
                    placeholder="Add your notes here... (max 1000 characters)"
                    className="w-full h-24 bg-slate-600 border border-slate-500 rounded text-white placeholder:text-slate-400 p-2 text-sm resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400">
                      {editingNotes[favorite.id]?.length || 0} / 1000
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => cancelEditNote(favorite.id)}
                        className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-sm transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => saveNote(favorite.id)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm flex items-center gap-1 transition-colors"
                      >
                        <Save className="w-3 h-3" />
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  {favorite.notes ? (
                    <div className="bg-slate-600 rounded p-3 text-slate-100 text-sm whitespace-pre-wrap break-words">
                      {favorite.notes}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm italic">No notes yet. Click edit to add one.</p>
                  )}
                  {favorite.notes && (
                    <button
                      onClick={() => deleteNote(favorite.id)}
                      className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete Note
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Source Link */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-700">
              <Lightbulb className="w-4 h-4 text-slate-400" />
              <a
                href={favorite.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300 truncate"
              >
                View source
              </a>
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Diagnostic Search</h1>
          <p className="text-slate-400">Find real repair cases and solutions from verified sources</p>
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setViewMode('search')}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              viewMode === 'search'
                ? 'bg-orange-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-4 h-4 inline mr-2" />
            Search
          </button>
          <button
            onClick={() => setViewMode('favorites')}
            className={`px-4 py-2 rounded font-medium transition-colors relative ${
              viewMode === 'favorites'
                ? 'bg-orange-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Heart className="w-4 h-4 inline mr-2" />
            Favorites
            {favorites.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-red-500 text-white">
                {favorites.length}
              </Badge>
            )}
          </button>
        </div>

        {/* Search Mode */}
        {viewMode === 'search' && (
          <>
            {/* Search Form */}
            <Card className="mb-6 bg-slate-800 border-slate-700">
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

            {/* Filter Toggle Button */}
            {hasSearched && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="mb-4 flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300 transition-colors"
              >
                <Zap className="w-4 h-4" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
                {hasActiveFilters && (
                  <Badge variant="secondary" className="bg-orange-500 text-white ml-2">
                    {Object.values(filters).filter(v => v !== undefined && v !== '').length}
                  </Badge>
                )}
              </button>
            )}

            {/* Filter Panel */}
            {showFilters && hasSearched && (
              <Card className="mb-6 bg-slate-800 border-slate-700">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-base">Filter Results</CardTitle>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        Clear All
                      </button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Year Range Filter */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-400 block mb-2">Min Year</label>
                      <Input
                        type="number"
                        placeholder="e.g., 2010"
                        value={filters.minYear || ''}
                        onChange={(e) => updateFilter('minYear', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-400 block mb-2">Max Year</label>
                      <Input
                        type="number"
                        placeholder="e.g., 2024"
                        value={filters.maxYear || ''}
                        onChange={(e) => updateFilter('maxYear', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 text-sm"
                      />
                    </div>
                  </div>

                  {/* Engine Filter */}
                  <div>
                    <label className="text-xs font-medium text-slate-400 block mb-2">Engine (e.g., 2.0L, 5.3L)</label>
                    <Input
                      type="text"
                      placeholder="Filter by engine size..."
                      value={filters.engineFilter || ''}
                      onChange={(e) => updateFilter('engineFilter', e.target.value || undefined)}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 text-sm"
                    />
                  </div>

                  {/* Confidence Threshold */}
                  <div>
                    <label className="text-xs font-medium text-slate-400 block mb-2">Minimum Confidence</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[0.70, 0.75, 0.80, 0.85, 0.90].map(conf => (
                        <button
                          key={conf}
                          onClick={() => updateFilter('minConfidence', filters.minConfidence === conf ? undefined : conf)}
                          className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                            filters.minConfidence === conf
                              ? 'bg-orange-500 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          {(conf * 100).toFixed(0)}%
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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
                    {hasActiveFilters && <p className="text-slate-500 text-sm mt-2">Try adjusting your filters</p>}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results */}
            {results.length > 0 && (
              <div className="space-y-4">
                <div className="text-sm text-slate-400">
                  Found {results.length} repair case{results.length !== 1 ? 's' : ''}
                  {hasActiveFilters && ' (filtered)'}
                </div>

                {results.map((result) => renderResultCard(result, isFavorite(result.id)))}
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
          </>
        )}

        {/* Favorites Mode */}
        {viewMode === 'favorites' && (
          <>
            {favorites.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Heart className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg">No saved favorites yet</p>
                    <p className="text-slate-500 text-sm mt-2">Bookmark diagnostic cases to save them here</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Export Button */}
                <div className="mb-6 flex justify-end">
                  <Button
                    onClick={handleExportPDF}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                </div>

                {/* Favorites List */}
                <div className="space-y-4">
                  <div className="text-sm text-slate-400">
                    {favorites.length} saved case{favorites.length !== 1 ? 's' : ''}
                  </div>

                  {favorites.map((favorite) => renderFavoriteCard(favorite))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
