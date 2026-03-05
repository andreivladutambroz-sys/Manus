import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ExternalLink, TrendingDown, TrendingUp } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface PartsPricingDisplayProps {
  repairType: string;
  brand: string;
  model: string;
}

export function PartsPricingDisplay({ repairType, brand, model }: PartsPricingDisplayProps) {
  const [selectedPart, setSelectedPart] = useState<string | null>(null);

  const { data: parts, isLoading, error } = trpc.services.parts.getPartsForRepair.useQuery({
    repairType,
    brand,
    model,
  });

  const { data: costEstimate } = trpc.services.costs.calculateRepairCost.useQuery({
    repairType,
    brand,
    model,
    diagnosticLevel: 'standard',
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Se încarcă prețurile pieselor...</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !parts || parts.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-slate-500">
          Nu au fost găsite piese pentru această reparație
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Piese Necesare</span>
            <Badge variant="secondary">{parts.length} piese</Badge>
          </CardTitle>
          <CardDescription>
            Prețuri din mai multe surse - selectați furnizorul preferat
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {parts.map((part, idx) => (
              <div
                key={idx}
                className="border rounded-lg p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => setSelectedPart(selectedPart === part.partNumber ? null : part.partNumber)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900">{part.partName}</h4>
                    <p className="text-sm text-slate-500 mt-1">
                      Cod: <span className="font-mono">{part.partNumber}</span>
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      Producător: {part.manufacturer}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-orange-600">
                      {part.price.toFixed(2)} {part.currency}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {part.source}
                    </p>
                  </div>
                </div>

                {/* Expanded details */}
                {selectedPart === part.partNumber && (
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-600">Disponibilitate</p>
                        <Badge
                          variant={
                            part.availability === 'in_stock'
                              ? 'default'
                              : part.availability === 'limited'
                                ? 'secondary'
                                : 'outline'
                          }
                        >
                          {part.availability === 'in_stock' && '✓ În stoc'}
                          {part.availability === 'limited' && '⚠ Limitat'}
                          {part.availability === 'pre_order' && '📦 Precomandă'}
                          {part.availability === 'out_of_stock' && '✗ Indisponibil'}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-slate-600">Livrare</p>
                        <p className="font-semibold">{part.shippingDays} zile</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Încredere</p>
                        <div className="flex items-center gap-1">
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${part.confidence}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold">{part.confidence}%</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="w-full mt-4"
                    >
                      <a href={part.sourceUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Vezi pe {part.source}
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cost Summary */}
      {costEstimate && (
        <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
          <CardHeader>
            <CardTitle className="text-lg">Estimare Cost Reparație</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm text-slate-600">Piese</p>
                <p className="text-xl font-bold text-slate-900">
                  {costEstimate.partsCost.toFixed(2)} {costEstimate.currency}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Manoperă</p>
                <p className="text-xl font-bold text-slate-900">
                  {costEstimate.laborCost.toFixed(2)} {costEstimate.currency}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Diagnostic</p>
                <p className="text-xl font-bold text-slate-900">
                  {costEstimate.diagnosticsFee.toFixed(2)} {costEstimate.currency}
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">Total Estimat</span>
                <span className="text-2xl font-bold text-orange-600">
                  {costEstimate.totalCost.toFixed(2)} {costEstimate.currency}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                Încredere: {costEstimate.confidence}% - Estimare bazată pe date de piață
              </p>
            </div>

            {/* Cost Breakdown Chart */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Piese</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${costEstimate.breakdown.parts}%` }}
                    />
                  </div>
                  <span className="w-8 text-right font-semibold">
                    {costEstimate.breakdown.parts}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Manoperă</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-amber-500 h-2 rounded-full"
                      style={{ width: `${costEstimate.breakdown.labor}%` }}
                    />
                  </div>
                  <span className="w-8 text-right font-semibold">
                    {costEstimate.breakdown.labor}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Diagnostic</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${costEstimate.breakdown.diagnostics}%` }}
                    />
                  </div>
                  <span className="w-8 text-right font-semibold">
                    {costEstimate.breakdown.diagnostics}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
