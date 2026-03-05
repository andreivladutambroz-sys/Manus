import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Bluetooth, Zap, AlertTriangle, CheckCircle2, Loader2, TrendingUp,
  Gauge, Thermometer, Droplets, Wind, Activity, Power
} from "lucide-react";
import { RESPONSIVE_TEXT, RESPONSIVE_SPACING, MOBILE_BUTTON_CLASS } from "@/lib/mobile-utils";

interface OBDReading {
  parameter: string;
  value: number;
  unit: string;
  status: "normal" | "warning" | "critical";
  icon: React.ReactNode;
}

export function OBDScannerMobile() {
  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [readings, setReadings] = useState<OBDReading[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>("Disconnected");

  // Mock OBD readings
  const mockReadings: OBDReading[] = [
    { parameter: "RPM", value: 1200, unit: "rpm", status: "normal", icon: <Gauge className="w-4 h-4" /> },
    { parameter: "Speed", value: 45, unit: "km/h", status: "normal", icon: <TrendingUp className="w-4 h-4" /> },
    { parameter: "Engine Temp", value: 92, unit: "°C", status: "normal", icon: <Thermometer className="w-4 h-4" /> },
    { parameter: "Fuel Level", value: 75, unit: "%", status: "normal", icon: <Droplets className="w-4 h-4" /> },
    { parameter: "Air Intake", value: 28, unit: "g/s", status: "normal", icon: <Wind className="w-4 h-4" /> },
    { parameter: "Throttle", value: 15, unit: "%", status: "normal", icon: <Power className="w-4 h-4" /> },
  ];

  const handleConnect = async () => {
    try {
      setConnectionStatus("Connecting...");
      // Simulate Bluetooth connection
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setIsConnected(true);
      setConnectionStatus("Connected");
    } catch (error) {
      setConnectionStatus("Connection failed");
      console.error("Bluetooth connection error:", error);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setReadings([]);
    setConnectionStatus("Disconnected");
  };

  const handleStartScan = async () => {
    setIsScanning(true);
    // Simulate scanning
    for (let i = 0; i < mockReadings.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      setReadings((prev) => [...prev, mockReadings[i]]);
    }
    setIsScanning(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal":
        return "bg-green-500/20 text-green-700 border-green-200";
      case "warning":
        return "bg-yellow-500/20 text-yellow-700 border-yellow-200";
      case "critical":
        return "bg-red-500/20 text-red-700 border-red-200";
      default:
        return "bg-gray-500/20 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "normal":
        return <CheckCircle2 className="w-4 h-4" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4" />;
      case "critical":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className={`${RESPONSIVE_SPACING.CONTAINER_PADDING} py-4 sm:py-6 space-y-4`}>
      {/* Connection Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Bluetooth className="w-5 h-5" />
            Bluetooth Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Indicator */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="text-sm font-medium">{connectionStatus}</span>
            </div>
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? "Active" : "Inactive"}
            </Badge>
          </div>

          {/* Connection Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleConnect}
              disabled={isConnected}
              className={`flex-1 ${MOBILE_BUTTON_CLASS}`}
            >
              <Bluetooth className="w-4 h-4 mr-2" />
              Connect
            </Button>
            <Button
              onClick={handleDisconnect}
              disabled={!isConnected}
              variant="outline"
              className={`flex-1 ${MOBILE_BUTTON_CLASS}`}
            >
              Disconnect
            </Button>
          </div>

          {/* Scan Button */}
          {isConnected && (
            <Button
              onClick={handleStartScan}
              disabled={isScanning}
              className={`w-full ${MOBILE_BUTTON_CLASS} bg-orange-500 hover:bg-orange-600`}
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Start Scan
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Readings Grid */}
      {readings.length > 0 && (
        <div>
          <h2 className={`${RESPONSIVE_TEXT.H3} text-foreground mb-3`}>Live Readings</h2>
          <div className="space-y-2">
            {readings.map((reading, idx) => (
              <Card key={idx} className={getStatusColor(reading.status)}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="flex-shrink-0">{reading.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{reading.parameter}</p>
                        <p className="text-xs opacity-75">
                          {reading.value} {reading.unit}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusIcon(reading.status)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Scanning Progress */}
      {isScanning && (
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Scanning parameters...</p>
              <Progress value={(readings.length / mockReadings.length) * 100} />
              <p className="text-xs text-muted-foreground">
                {readings.length} of {mockReadings.length} parameters
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Readings Message */}
      {!isConnected && (
        <Card className="text-center py-8">
          <Bluetooth className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
          <p className="text-muted-foreground mb-4">
            Connect a Bluetooth OBD-II scanner to view live readings
          </p>
        </Card>
      )}

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <p className="text-xs sm:text-sm text-blue-900">
            <strong>Tip:</strong> Make sure your OBD-II Bluetooth scanner is paired with your device before connecting.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
