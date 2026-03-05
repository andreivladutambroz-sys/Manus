import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from "lucide-react";

interface HealthMetrics {
  overall: number;
  engine: number;
  transmission: number;
  suspension: number;
  brakes: number;
  electrical: number;
}

interface DiagnosticSnapshot {
  id: string;
  timestamp: Date;
  mileage: number;
  healthMetrics: HealthMetrics;
  errorCodes: string[];
  symptoms: string[];
}

interface DiagnosticComparisonProps {
  diagnostic1: DiagnosticSnapshot;
  diagnostic2: DiagnosticSnapshot;
  trendData?: Array<{ date: string; health: number; mileage: number }>;
}

export function DiagnosticComparison({
  diagnostic1,
  diagnostic2,
  trendData = [],
}: DiagnosticComparisonProps) {
  const healthChange = diagnostic2.healthMetrics.overall - diagnostic1.healthMetrics.overall;
  const mileageDifference = diagnostic2.mileage - diagnostic1.mileage;
  const isImproving = healthChange > 0;

  // Identify changes
  const newErrorCodes = diagnostic2.errorCodes.filter((code) => !diagnostic1.errorCodes.includes(code));
  const resolvedErrorCodes = diagnostic1.errorCodes.filter((code) => !diagnostic2.errorCodes.includes(code));
  const newSymptoms = diagnostic2.symptoms.filter((symptom) => !diagnostic1.symptoms.includes(symptom));
  const resolvedSymptoms = diagnostic1.symptoms.filter((symptom) => !diagnostic2.symptoms.includes(symptom));

  // Component health comparison data
  const componentComparison = [
    { component: "Engine", d1: diagnostic1.healthMetrics.engine, d2: diagnostic2.healthMetrics.engine },
    { component: "Transmission", d1: diagnostic1.healthMetrics.transmission, d2: diagnostic2.healthMetrics.transmission },
    { component: "Suspension", d1: diagnostic1.healthMetrics.suspension, d2: diagnostic2.healthMetrics.suspension },
    { component: "Brakes", d1: diagnostic1.healthMetrics.brakes, d2: diagnostic2.healthMetrics.brakes },
    { component: "Electrical", d1: diagnostic1.healthMetrics.electrical, d2: diagnostic2.healthMetrics.electrical },
  ];

  return (
    <div className="space-y-6">
      {/* Overall Health Comparison */}
      <Card className={isImproving ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {isImproving ? (
                <TrendingUp className="w-6 h-6 text-green-600" />
              ) : (
                <TrendingDown className="w-6 h-6 text-red-600" />
              )}
              Overall Health Change
            </CardTitle>
            <Badge variant={isImproving ? "default" : "destructive"} className="text-lg px-3 py-1">
              {isImproving ? "+" : ""}{healthChange.toFixed(1)}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600 font-medium">Previous Score</p>
              <p className="text-3xl font-bold">{diagnostic1.healthMetrics.overall}</p>
              <p className="text-xs text-gray-500">{new Date(diagnostic1.timestamp).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Current Score</p>
              <p className="text-3xl font-bold">{diagnostic2.healthMetrics.overall}</p>
              <p className="text-xs text-gray-500">{new Date(diagnostic2.timestamp).toLocaleDateString()}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium mb-2">Mileage Difference</p>
            <p className="text-lg font-semibold">{mileageDifference.toLocaleString()} km</p>
          </div>
        </CardContent>
      </Card>

      {/* Component Health Comparison Chart */}
      {componentComparison.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Component Health Comparison</CardTitle>
            <CardDescription>Health scores by component</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={componentComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="component" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="d1" fill="#8884d8" name="Previous" />
                <Bar dataKey="d2" fill="#82ca9d" name="Current" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Trend Chart */}
      {trendData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Health Trend Over Time</CardTitle>
            <CardDescription>Vehicle health progression</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="health" stroke="#8884d8" name="Health Score" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* New Issues */}
      {newErrorCodes.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              New Issues Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {newErrorCodes.map((code) => (
                <div key={code} className="flex items-center justify-between p-2 bg-white rounded border border-red-200">
                  <span className="font-semibold">{code}</span>
                  <Badge variant="destructive">New</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resolved Issues */}
      {resolvedErrorCodes.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              Issues Resolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {resolvedErrorCodes.map((code) => (
                <div key={code} className="flex items-center justify-between p-2 bg-white rounded border border-green-200">
                  <span className="font-semibold">{code}</span>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    Resolved
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* New Symptoms */}
      {newSymptoms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Symptoms</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {newSymptoms.map((symptom) => (
                <li key={symptom} className="flex items-center gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  {symptom}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Resolved Symptoms */}
      {resolvedSymptoms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resolved Symptoms</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {resolvedSymptoms.map((symptom) => (
                <li key={symptom} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  {symptom}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="font-semibold">Time Between Diagnostics:</span> {Math.round((new Date(diagnostic2.timestamp).getTime() - new Date(diagnostic1.timestamp).getTime()) / (1000 * 60 * 60 * 24))} days
          </p>
          <p>
            <span className="font-semibold">Mileage Driven:</span> {mileageDifference.toLocaleString()} km
          </p>
          <p>
            <span className="font-semibold">New Issues:</span> {newErrorCodes.length}
          </p>
          <p>
            <span className="font-semibold">Resolved Issues:</span> {resolvedErrorCodes.length}
          </p>
          <p>
            <span className="font-semibold">Status:</span>{" "}
            {isImproving ? (
              <span className="text-green-600 font-semibold">Improving</span>
            ) : (
              <span className="text-red-600 font-semibold">Declining</span>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
