import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Lightbulb, TrendingUp } from 'lucide-react';

interface AISuggestionsProps {
  symptoms: string[];
  brand: string;
  model: string;
  year: number;
  mileage: number;
  category: string;
  errorCodes: string[];
}

export function AISuggestions({
  symptoms,
  brand,
  model,
  year,
  mileage,
  category,
  errorCodes,
}: AISuggestionsProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { data: suggestions, isLoading, error } = trpc.ai.suggestions.useQuery(
    {
      symptoms,
      brand,
      model,
      year,
      mileage,
      category,
      errorCodes,
      useCache: true,
    },
    { enabled: showSuggestions }
  );

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-100 text-green-800';
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-orange-100 text-orange-800';
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={() => setShowSuggestions(!showSuggestions)}
        variant="outline"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating AI Suggestions...
          </>
        ) : (
          <>
            <Lightbulb className="mr-2 h-4 w-4" />
            {showSuggestions ? 'Hide' : 'Show'} AI Suggestions
          </>
        )}
      </Button>

      {showSuggestions && (
        <div className="space-y-3">
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-sm text-red-800">
                  Error generating suggestions: {error.message}
                </p>
              </CardContent>
            </Card>
          )}

          {suggestions && suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{suggestion.cause}</CardTitle>
                      <CardDescription className="mt-1">
                        {suggestion.description}
                      </CardDescription>
                    </div>
                    <Badge className={getConfidenceColor(suggestion.confidence)}>
                      {suggestion.confidence}% Confidence
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Components */}
                  {suggestion.components.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Affected Components:</h4>
                      <div className="flex flex-wrap gap-2">
                        {suggestion.components.map((component, i) => (
                          <Badge key={i} variant="secondary">
                            {component}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Related Codes */}
                  {suggestion.relatedCodes.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Related Error Codes:</h4>
                      <div className="flex flex-wrap gap-2">
                        {suggestion.relatedCodes.map((code, i) => (
                          <Badge key={i} variant="outline">
                            {code}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Costs & Time */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-xs text-gray-500">Estimated Cost</p>
                      <p className="font-semibold">
                        ${suggestion.estimatedCost.min} - ${suggestion.estimatedCost.max}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Repair Time</p>
                      <p className="font-semibold">
                        {suggestion.repairTime.min} - {suggestion.repairTime.max}h
                      </p>
                    </div>
                  </div>

                  {/* Preventive Measures */}
                  {suggestion.preventiveMeasures.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Preventive Measures:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {suggestion.preventiveMeasures.map((measure, i) => (
                          <li key={i} className="text-gray-700">
                            {measure}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            !isLoading && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-600">
                    No suggestions available at this time.
                  </p>
                </CardContent>
              </Card>
            )
          )}
        </div>
      )}
    </div>
  );
}
