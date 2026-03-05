import React, { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertCircle, CheckCircle2, ExternalLink, Loader2 } from 'lucide-react';

interface VehicleRecallsProps {
  vin?: string;
  brand: string;
  model: string;
  year: number;
}

export function VehicleRecalls({ vin, brand, model, year }: VehicleRecallsProps) {
  const [recalls, setRecalls] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getRecallsQuery = trpc.automotiveData.getRecalls.useQuery(
    { make: brand, model, year, vin },
    {
      enabled: !!brand && !!model && !!year,
    }
  );

  useEffect(() => {
    if (getRecallsQuery.data) {
      setRecalls(getRecallsQuery.data.recalls || []);
    }
  }, [getRecallsQuery.data]);

  if (!brand || !model || !year) {
    return null;
  }

  if (getRecallsQuery.isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-orange-500 mr-2" />
          <span className="text-slate-600">Se încarcă recalls...</span>
        </CardContent>
      </Card>
    );
  }

  if (getRecallsQuery.error) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-900">Nu am putut verifica recalls</p>
              <p className="text-sm text-yellow-800 mt-1">
                Serviciul de recalls este temporar indisponibil
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recalls || recalls.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-green-900">Nicio problemă de siguranță</p>
              <p className="text-sm text-green-800 mt-1">
                {brand && model
                  ? `Nu au fost găsite recalls pentru ${brand} ${model}`
                  : 'Nu au fost găsite recalls pentru acest vehicul'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const criticalRecalls = recalls.filter((r) => r.riskLevel === 'CRITICAL');
  const warningRecalls = recalls.filter((r) => r.riskLevel === 'WARNING');
  const infoRecalls = recalls.filter((r) => r.riskLevel === 'INFO');

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Probleme de Siguranță (Recalls)
          </CardTitle>
          <CardDescription>
            {recalls.length} recall{recalls.length !== 1 ? 's' : ''} găsit{recalls.length !== 1 ? 'e' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Critical Recalls */}
          {criticalRecalls.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-red-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Critic ({criticalRecalls.length})
              </h4>
              {criticalRecalls.map((recall, idx) => (
                <RecallCard key={idx} recall={recall} severity="critical" />
              ))}
            </div>
          )}

          {/* Warning Recalls */}
          {warningRecalls.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-yellow-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Avertisment ({warningRecalls.length})
              </h4>
              {warningRecalls.map((recall, idx) => (
                <RecallCard key={idx} recall={recall} severity="warning" />
              ))}
            </div>
          )}

          {/* Info Recalls */}
          {infoRecalls.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Informație ({infoRecalls.length})
              </h4>
              {infoRecalls.map((recall, idx) => (
                <RecallCard key={idx} recall={recall} severity="info" />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface RecallCardProps {
  recall: any;
  severity: 'critical' | 'warning' | 'info';
}

function RecallCard({ recall, severity }: RecallCardProps) {
  const severityConfig = {
    critical: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      badge: 'bg-red-100 text-red-800',
      text: 'text-red-900',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      badge: 'bg-yellow-100 text-yellow-800',
      text: 'text-yellow-900',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      badge: 'bg-blue-100 text-blue-800',
      text: 'text-blue-900',
    },
  };

  const config = severityConfig[severity];

  return (
    <div className={`p-4 rounded-lg border ${config.bg} ${config.border}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge className={config.badge}>
              {recall.recallId}
            </Badge>
            {recall.year && (
              <span className="text-xs text-slate-600">
                {recall.year}
              </span>
            )}
          </div>
          <p className={`font-medium ${config.text}`}>
            {recall.description}
          </p>
          {recall.affectedComponent && (
            <p className="text-sm text-slate-600 mt-1">
              <span className="font-medium">Component:</span> {recall.affectedComponent}
            </p>
          )}
          {recall.fixProcedure && (
            <p className="text-sm text-slate-600 mt-2">
              <span className="font-medium">Soluție:</span> {recall.fixProcedure}
            </p>
          )}
          {recall.manufacturer && (
            <p className="text-sm text-slate-600 mt-1">
              <span className="font-medium">Producător:</span> {recall.manufacturer}
            </p>
          )}
        </div>
        {recall.sourceUrl && (
          <a
            href={recall.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 mt-1"
          >
            <ExternalLink className="w-4 h-4 text-slate-400 hover:text-slate-600" />
          </a>
        )}
      </div>
    </div>
  );
}
