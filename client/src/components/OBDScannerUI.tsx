import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Bluetooth,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Gauge,
  Zap,
  Thermometer,
  Wind,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface OBDScannerUIProps {
  onDTCsRead?: (dtcs: any[]) => void;
  onParametersRead?: (params: any[]) => void;
}

export function OBDScannerUI({ onDTCsRead, onParametersRead }: OBDScannerUIProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [deviceName, setDeviceName] = useState('ELM327');

  // Mutations
  const connectMutation = trpc.services.scanner.connect.useMutation({
    onSuccess: () => {
      setIsConnected(true);
    },
  });

  const disconnectMutation = trpc.services.scanner.disconnect.useMutation({
    onSuccess: () => {
      setIsConnected(false);
    },
  });

  const readDTCQuery = trpc.services.scanner.readDTCCodes.useQuery(undefined, {
    enabled: false,
  });

  const readParametersQuery = trpc.services.scanner.readEngineParameters.useQuery(undefined, {
    enabled: false,
  });

  const clearDTCMutation = trpc.services.scanner.clearDTCCodes.useMutation();

  // Queries
  const { data: scannerState } = trpc.services.scanner.getState.useQuery(undefined, {
    enabled: isConnected,
    refetchInterval: 2000,
  });

  const { data: issues } = trpc.services.scanner.analyzeReadings.useQuery(undefined, {
    enabled: isConnected && (scannerState?.readings.length ?? 0) > 0,
  });

  const handleConnect = async () => {
    await connectMutation.mutateAsync({ deviceName });
  };

  const handleDisconnect = async () => {
    await disconnectMutation.mutateAsync();
  };

  const handleReadDTC = async () => {
    // Trigger refetch
    await readDTCQuery.refetch();
  };

  const handleReadParameters = async () => {
    // Trigger refetch
    await readParametersQuery.refetch();
  };

  const handleClearDTC = async () => {
    if (confirm('Sigur doriți să ștergeți codurile de eroare?')) {
      await clearDTCMutation.mutateAsync();
    }
  };

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bluetooth className="w-5 h-5" />
              <span>Scanner OBD-II</span>
            </div>
            <Badge variant={isConnected ? 'default' : 'secondary'}>
              {isConnected ? '🟢 Conectat' : '🔴 Deconectat'}
            </Badge>
          </CardTitle>
          <CardDescription>
            {isConnected ? `Conectat la ${deviceName}` : 'Apasă pentru a conecta dispozitivul'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isConnected ? (
            <div className="space-y-3">
              <input
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="Nume dispozitiv (ex: ELM327)"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <Button
                onClick={handleConnect}
                disabled={connectMutation.isPending}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {connectMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Se conectează...
                  </>
                ) : (
                  <>
                    <Bluetooth className="w-4 h-4 mr-2" />
                    Conectare Scanner
                  </>
                )}
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleDisconnect}
              variant="outline"
              className="w-full"
            >
              Deconectare
            </Button>
          )}
        </CardContent>
      </Card>

      {isConnected && scannerState && (
        <>
          {/* DTC Codes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Coduri de Eroare (DTC)</span>
                {scannerState.dtcCodes.length > 0 && (
                  <Badge variant="destructive">{scannerState.dtcCodes.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {scannerState.dtcCodes.length === 0 ? (
                <p className="text-slate-600 text-sm">
                  Nu au fost detectate coduri de eroare
                </p>
              ) : (
                scannerState.dtcCodes.map((code) => (
                  <Alert
                    key={code.code}
                    variant={
                      code.severity === 'critical'
                        ? 'destructive'
                        : code.severity === 'warning'
                          ? 'default'
                          : 'default'
                    }
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-semibold">{code.code}</div>
                      <div className="text-sm mt-1">{code.description}</div>
                      <div className="text-xs mt-1 opacity-75">
                        Sistem: {code.system} | Severitate: {code.severity}
                      </div>
                    </AlertDescription>
                  </Alert>
                ))
              )}

              <div className="flex gap-2 pt-2">
              <Button
                onClick={handleReadDTC}
                disabled={readDTCQuery.isFetching}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                {readDTCQuery.isFetching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Citire...
                  </>
                ) : (
                  'Citire Coduri'
                )}
              </Button>
                {scannerState.dtcCodes.length > 0 && (
                  <Button
                    onClick={handleClearDTC}
                    disabled={clearDTCMutation.isPending}
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                  >
                    {clearDTCMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        Ștergere...
                      </>
                    ) : (
                      'Ștergere Coduri'
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Engine Parameters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Parametri Motor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {scannerState.readings.length === 0 ? (
                <p className="text-slate-600 text-sm">
                  Apasă "Citire Parametri" pentru a citi datele motorului
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {scannerState.readings.map((reading) => (
                    <div
                      key={reading.parameter}
                      className="border rounded-lg p-3 bg-slate-50"
                    >
                      <p className="text-xs text-slate-600 truncate">
                        {reading.parameter}
                      </p>
                      <p className="text-lg font-bold text-slate-900 mt-1">
                        {typeof reading.value === 'number'
                          ? reading.value.toFixed(1)
                          : reading.value}
                        <span className="text-xs text-slate-600 ml-1">
                          {reading.unit}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <Button
                onClick={handleReadParameters}
                disabled={readParametersQuery.isFetching}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {readParametersQuery.isFetching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Citire...
                  </>
                ) : (
                  <>
                    <Gauge className="w-4 h-4 mr-2" />
                    Citire Parametri Motor
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Issues Analysis */}
          {issues && issues.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-2">Probleme Detectate:</div>
                <ul className="space-y-1">
                  {issues.map((issue, idx) => (
                    <li key={idx} className="text-sm">
                      {issue}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Battery Status */}
          {scannerState.batteryVoltage > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold">Tensiune Baterie</span>
                  </div>
                  <span className="text-xl font-bold text-blue-600">
                    {scannerState.batteryVoltage.toFixed(1)}V
                  </span>
                </div>
                {scannerState.batteryVoltage < 11.5 && (
                  <p className="text-xs text-red-600 mt-2">
                    ⚠️ Tensiune baterie scăzută - verificați bateria și alternatorul
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
