import { z } from "zod";

// Gauge types and configurations
export interface GaugeConfig {
  id: string;
  name: string;
  pid: string;
  unit: string;
  min: number;
  max: number;
  warning: number;
  critical: number;
  type: "linear" | "circular" | "bar";
  color: string;
  icon?: string;
}

export interface GaugeReading {
  gaugeId: string;
  value: number;
  timestamp: number;
  status: "normal" | "warning" | "critical";
}

export interface DataLog {
  id: string;
  sessionId: string;
  gaugeId: string;
  readings: GaugeReading[];
  startTime: number;
  endTime: number;
  duration: number;
  avgValue: number;
  minValue: number;
  maxValue: number;
  peakValue: number;
  peakTime: number;
}

// Standard OBD gauges
export const STANDARD_GAUGES: Record<string, GaugeConfig> = {
  rpm: {
    id: "rpm",
    name: "Engine RPM",
    pid: "010C",
    unit: "RPM",
    min: 0,
    max: 8000,
    warning: 7000,
    critical: 7500,
    type: "circular",
    color: "#3b82f6",
    icon: "⚙️",
  },
  speed: {
    id: "speed",
    name: "Vehicle Speed",
    pid: "010D",
    unit: "km/h",
    min: 0,
    max: 200,
    warning: 180,
    critical: 200,
    type: "linear",
    color: "#10b981",
    icon: "🚗",
  },
  throttle: {
    id: "throttle",
    name: "Throttle Position",
    pid: "0111",
    unit: "%",
    min: 0,
    max: 100,
    warning: 90,
    critical: 95,
    type: "bar",
    color: "#f59e0b",
    icon: "🎚️",
  },
  engineTemp: {
    id: "engineTemp",
    name: "Engine Temperature",
    pid: "0105",
    unit: "°C",
    min: 0,
    max: 120,
    warning: 100,
    critical: 110,
    type: "linear",
    color: "#ef4444",
    icon: "🌡️",
  },
  fuelPressure: {
    id: "fuelPressure",
    name: "Fuel Pressure",
    pid: "010A",
    unit: "kPa",
    min: 0,
    max: 100,
    warning: 80,
    critical: 90,
    type: "bar",
    color: "#8b5cf6",
    icon: "⛽",
  },
  maf: {
    id: "maf",
    name: "MAF Sensor",
    pid: "0110",
    unit: "g/s",
    min: 0,
    max: 100,
    warning: 80,
    critical: 90,
    type: "linear",
    color: "#06b6d4",
    icon: "💨",
  },
  o2: {
    id: "o2",
    name: "O2 Sensor",
    pid: "0114",
    unit: "V",
    min: 0,
    max: 1,
    warning: 0.8,
    critical: 0.9,
    type: "bar",
    color: "#ec4899",
    icon: "💨",
  },
  load: {
    id: "load",
    name: "Engine Load",
    pid: "0104",
    unit: "%",
    min: 0,
    max: 100,
    warning: 80,
    critical: 90,
    type: "bar",
    color: "#f97316",
    icon: "📊",
  },
};

// Gauge Dashboard Service
export class GaugeDashboardService {
  private activeSessions: Map<string, DataLog[]> = new Map();
  private dataLogs: DataLog[] = [];

  // Start monitoring session
  startMonitoringSession(sessionId: string): void {
    this.activeSessions.set(sessionId, []);
  }

  // Record gauge reading
  recordReading(sessionId: string, reading: GaugeReading): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    // Find or create data log for this gauge
    let dataLog = session.find((log) => log.gaugeId === reading.gaugeId);
    if (!dataLog) {
      dataLog = {
        id: `${sessionId}-${reading.gaugeId}`,
        sessionId,
        gaugeId: reading.gaugeId,
        readings: [],
        startTime: reading.timestamp,
        endTime: reading.timestamp,
        duration: 0,
        avgValue: 0,
        minValue: reading.value,
        maxValue: reading.value,
        peakValue: reading.value,
        peakTime: reading.timestamp,
      };
      session.push(dataLog);
    }

    // Add reading
    dataLog.readings.push(reading);
    dataLog.endTime = reading.timestamp;
    dataLog.duration = dataLog.endTime - dataLog.startTime;

    // Update statistics
    this.updateDataLogStats(dataLog);
  }

  // Update data log statistics
  private updateDataLogStats(dataLog: DataLog): void {
    if (dataLog.readings.length === 0) return;

    const values = dataLog.readings.map((r) => r.value);
    dataLog.minValue = Math.min(...values);
    dataLog.maxValue = Math.max(...values);
    dataLog.avgValue = values.reduce((a, b) => a + b, 0) / values.length;

    // Find peak
    const peakReading = dataLog.readings.reduce((prev, current) =>
      Math.abs(current.value - dataLog.avgValue) > Math.abs(prev.value - dataLog.avgValue) ? current : prev
    );
    dataLog.peakValue = peakReading.value;
    dataLog.peakTime = peakReading.timestamp;
  }

  // End monitoring session
  endMonitoringSession(sessionId: string): DataLog[] | null {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;

    // Save to permanent storage
    this.dataLogs.push(...session);

    // Remove from active sessions
    this.activeSessions.delete(sessionId);

    return session;
  }

  // Get session data
  getSessionData(sessionId: string): DataLog[] | null {
    return this.activeSessions.get(sessionId) || null;
  }

  // Get gauge data for playback
  getGaugePlayback(sessionId: string, gaugeId: string): GaugeReading[] {
    const session = this.activeSessions.get(sessionId);
    if (!session) return [];

    const dataLog = session.find((log) => log.gaugeId === gaugeId);
    return dataLog?.readings || [];
  }

  // Analyze gauge data for anomalies
  analyzeGaugeData(sessionId: string, gaugeId: string): {
    anomalies: GaugeReading[];
    warnings: string[];
    recommendations: string[];
  } {
    const readings = this.getGaugePlayback(sessionId, gaugeId);
    const gauge = Object.values(STANDARD_GAUGES).find((g) => g.id === gaugeId);

    if (!gauge || readings.length === 0) {
      return { anomalies: [], warnings: [], recommendations: [] };
    }

    const anomalies = readings.filter((r) => r.status !== "normal");
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Analyze patterns
    if (anomalies.length > readings.length * 0.1) {
      warnings.push(`${gaugeId}: ${anomalies.length} anomalies detected (${((anomalies.length / readings.length) * 100).toFixed(1)}%)`);
    }

    // Check for spikes
    const diffs = [];
    for (let i = 1; i < readings.length; i++) {
      diffs.push(Math.abs(readings[i].value - readings[i - 1].value));
    }
    const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    const maxDiff = Math.max(...diffs);

    if (maxDiff > avgDiff * 3) {
      warnings.push(`${gaugeId}: Sudden spike detected (${maxDiff.toFixed(2)} units)`);
      recommendations.push(`Check ${gauge.name} sensor for loose connections or intermittent faults`);
    }

    // Check for drift
    const firstHalf = readings.slice(0, Math.floor(readings.length / 2));
    const secondHalf = readings.slice(Math.floor(readings.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b.value, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b.value, 0) / secondHalf.length;

    if (Math.abs(secondAvg - firstAvg) > gauge.max * 0.2) {
      warnings.push(`${gaugeId}: Significant drift detected`);
      recommendations.push(`${gauge.name} may be drifting. Consider sensor calibration or replacement`);
    }

    return { anomalies, warnings, recommendations };
  }

  // Get all saved data logs
  getAllDataLogs(): DataLog[] {
    return this.dataLogs;
  }

  // Export data for analysis
  exportSessionData(sessionId: string): string {
    const session = this.activeSessions.get(sessionId);
    if (!session) return "";

    const data = {
      sessionId,
      timestamp: new Date().toISOString(),
      gauges: session.map((log) => ({
        gaugeId: log.gaugeId,
        readings: log.readings,
        stats: {
          duration: log.duration,
          avgValue: log.avgValue,
          minValue: log.minValue,
          maxValue: log.maxValue,
          peakValue: log.peakValue,
        },
      })),
    };

    return JSON.stringify(data, null, 2);
  }
}

// Create singleton instance
export const gaugeDashboard = new GaugeDashboardService();
