import { useState, useEffect } from 'react';
import { AlertCircle, Bluetooth, CheckCircle, Loader, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { OBDScanner, type OBDDevice, type ScanResult, type DTCCode } from '@/lib/obdScanner';

export default function OBDScannerPage() {
  const [scanner] = useState(() => new OBDScanner());
  const [isAvailable, setIsAvailable] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<OBDDevice | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [vehicleSpeed, setVehicleSpeed] = useState<number | null>(null);
  const [engineRPM, setEngineRPM] = useState<number | null>(null);

  // Check Web Bluetooth availability
  useEffect(() => {
    const checkAvailability = async () => {
      const available = await OBDScanner.isAvailable();
      setIsAvailable(available);
    };
    checkAvailability();
  }, []);

  // Handle device selection and connection
  const handleSelectDevice = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const device = await scanner.requestDevice();
      setSelectedDevice(device);

      // Auto-connect
      await scanner.connect();
      setIsConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to device');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle disconnect
  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      await scanner.disconnect();
      setIsConnected(false);
      setSelectedDevice(null);
      setScanResult(null);
      setVehicleSpeed(null);
      setEngineRPM(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle scan DTCs
  const handleScanDTCs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await scanner.readDTCs();
      setScanResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan DTCs');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle clear DTCs
  const handleClearDTCs = async () => {
    if (!confirm('Are you sure you want to clear all DTC codes?')) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await scanner.clearDTCs();
      setScanResult(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear DTCs');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle read vehicle speed
  const handleReadSpeed = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const speed = await scanner.getVehicleSpeed();
      setVehicleSpeed(speed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read vehicle speed');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle read engine RPM
  const handleReadRPM = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const rpm = await scanner.getEngineRPM();
      setEngineRPM(rpm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read engine RPM');
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10 border-red-500 text-red-700';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500 text-yellow-700';
      default:
        return 'bg-blue-500/10 border-blue-500 text-blue-700';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'warning':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Warning</Badge>;
      default:
        return <Badge variant="outline">Info</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white flex items-center gap-3">
            <Bluetooth className="w-8 h-8 text-orange-500" />
            OBD-II Scanner
          </h1>
          <p className="text-slate-400">
            Connect to your Bluetooth OBD-II scanner to read and clear diagnostic trouble codes
          </p>
        </div>

        {/* Availability Alert */}
        {!isAvailable && (
          <Alert className="border-red-500 bg-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700">
              Web Bluetooth API is not available in your browser. Please use Chrome, Edge, or Opera.
            </AlertDescription>
          </Alert>
        )}

        {/* Connection Status */}
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader>
            <CardTitle className="text-white">Connection Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-700/50 border border-slate-600">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <div>
                  <p className="text-white font-medium">
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </p>
                  {selectedDevice && (
                    <p className="text-sm text-slate-400">{selectedDevice.name}</p>
                  )}
                </div>
              </div>
              {isAvailable && (
                <Button
                  onClick={isConnected ? handleDisconnect : handleSelectDevice}
                  disabled={isLoading}
                  variant={isConnected ? 'destructive' : 'default'}
                >
                  {isLoading ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      {isConnected ? 'Disconnecting...' : 'Connecting...'}
                    </>
                  ) : (
                    isConnected ? 'Disconnect' : 'Connect Device'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Real-time Data */}
        {isConnected && (
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white">Real-time Data</CardTitle>
              <CardDescription>Current vehicle parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600">
                  <p className="text-sm text-slate-400 mb-2">Vehicle Speed</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white">
                      {vehicleSpeed !== null ? vehicleSpeed : '--'}
                    </span>
                    <span className="text-slate-400">km/h</span>
                  </div>
                  <Button
                    onClick={handleReadSpeed}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                  >
                    {isLoading ? <Loader className="w-3 h-3 mr-2 animate-spin" /> : null}
                    Read Speed
                  </Button>
                </div>

                <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600">
                  <p className="text-sm text-slate-400 mb-2">Engine RPM</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white">
                      {engineRPM !== null ? engineRPM.toLocaleString() : '--'}
                    </span>
                    <span className="text-slate-400">RPM</span>
                  </div>
                  <Button
                    onClick={handleReadRPM}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                  >
                    {isLoading ? <Loader className="w-3 h-3 mr-2 animate-spin" /> : null}
                    Read RPM
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* DTC Scanning */}
        {isConnected && (
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white">Diagnostic Trouble Codes</CardTitle>
              <CardDescription>Scan and manage vehicle fault codes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  onClick={handleScanDTCs}
                  disabled={isLoading}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  {isLoading ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Scan DTCs
                    </>
                  )}
                </Button>
                {scanResult && scanResult.dtcCount > 0 && (
                  <Button
                    onClick={handleClearDTCs}
                    disabled={isLoading}
                    variant="destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear DTCs
                  </Button>
                )}
              </div>

              {/* DTC Results */}
              {scanResult && (
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-400">Total Codes Found</p>
                        <p className="text-2xl font-bold text-white">{scanResult.dtcCount}</p>
                      </div>
                      {scanResult.dtcCount === 0 && (
                        <CheckCircle className="w-8 h-8 text-green-500" />
                      )}
                    </div>
                  </div>

                  {scanResult.codes.length > 0 && (
                    <div className="space-y-2">
                      {scanResult.codes.map((code: DTCCode, index: number) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border ${getSeverityColor(code.severity)}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono font-bold text-lg">{code.code}</span>
                                {getSeverityBadge(code.severity)}
                              </div>
                              <p className="text-sm">{code.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Alert className="border-red-500 bg-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {/* Info Card */}
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader>
            <CardTitle className="text-white text-sm">Supported Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-slate-400 space-y-1">
              <li>✓ ELM327 Bluetooth adapters</li>
              <li>✓ VGATE iCar devices</li>
              <li>✓ BAFX OBD-II scanners</li>
              <li>✓ Other Bluetooth OBD-II adapters</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
