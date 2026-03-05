/**
 * OBD-II Scanner Service
 * Handles Bluetooth connection and communication with OBD-II devices
 */

export interface OBDReading {
  parameter: string;
  value: number | string;
  unit: string;
  timestamp: number;
}

export interface DTCCode {
  code: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  system: string;
}

export interface OBDScannerState {
  connected: boolean;
  deviceName: string;
  batteryVoltage: number;
  engineRunning: boolean;
  dtcCodes: DTCCode[];
  readings: OBDReading[];
}

class OBD2ScannerService {
  private state: OBDScannerState = {
    connected: false,
    deviceName: '',
    batteryVoltage: 0,
    engineRunning: false,
    dtcCodes: [],
    readings: [],
  };

  /**
   * Initialize Bluetooth connection to OBD-II device
   */
  async connectDevice(deviceName: string): Promise<boolean> {
    try {
      // In browser environment, this would use Web Bluetooth API
      // For server-side, we simulate the connection
      this.state.connected = true;
      this.state.deviceName = deviceName;
      
      console.log(`✅ Connected to OBD-II device: ${deviceName}`);
      return true;
    } catch (error) {
      console.error('Failed to connect OBD-II device:', error);
      this.state.connected = false;
      return false;
    }
  }

  /**
   * Disconnect from OBD-II device
   */
  async disconnectDevice(): Promise<void> {
    this.state.connected = false;
    this.state.deviceName = '';
    console.log('Disconnected from OBD-II device');
  }

  /**
   * Read diagnostic trouble codes (DTCs)
   */
  async readDTCCodes(): Promise<DTCCode[]> {
    if (!this.state.connected) {
      throw new Error('OBD-II device not connected');
    }

    try {
      // Simulate reading DTCs from vehicle
      const dtcMap: Record<string, { description: string; severity: 'info' | 'warning' | 'critical'; system: string }> = {
        'P0101': { description: 'Mass or Volume Air Flow Circuit Range/Performance', severity: 'warning', system: 'Engine' },
        'P0102': { description: 'Mass or Volume Air Flow Circuit Low Input', severity: 'warning', system: 'Engine' },
        'P0103': { description: 'Mass or Volume Air Flow Circuit High Input', severity: 'warning', system: 'Engine' },
        'P0128': { description: 'Coolant Thermostat (Coolant Temp Regulation) Malfunction', severity: 'warning', system: 'Cooling' },
        'P0133': { description: 'O2 Sensor Circuit No Activity (Bank 1 Sensor 1)', severity: 'warning', system: 'Emissions' },
        'P0171': { description: 'System Too Lean (Bank 1)', severity: 'critical', system: 'Fuel' },
        'P0172': { description: 'System Too Rich (Bank 1)', severity: 'critical', system: 'Fuel' },
        'P0300': { description: 'Random/Multiple Cylinder Misfire Detected', severity: 'critical', system: 'Ignition' },
        'P0401': { description: 'EGR Flow Insufficient Detected', severity: 'warning', system: 'Emissions' },
        'P0420': { description: 'Catalyst System Efficiency Below Threshold (Bank 1)', severity: 'warning', system: 'Emissions' },
        'P0500': { description: 'Vehicle Speed Sensor Malfunction', severity: 'warning', system: 'Speed Control' },
        'P0606': { description: 'PCM/ECM Processor Fault', severity: 'critical', system: 'Engine Control' },
        'P0700': { description: 'Transmission Control System Malfunction', severity: 'warning', system: 'Transmission' },
        'P0740': { description: 'Torque Converter Clutch Circuit Malfunction', severity: 'warning', system: 'Transmission' },
        'P0800': { description: 'Transfer Case Control Module Communication Error', severity: 'warning', system: 'Drivetrain' },
        'C0035': { description: 'Right Front ABS Sensor Circuit Malfunction', severity: 'warning', system: 'ABS' },
        'C0040': { description: 'Right Rear ABS Sensor Circuit Malfunction', severity: 'warning', system: 'ABS' },
        'B0001': { description: 'Battery Voltage Out of Range', severity: 'warning', system: 'Electrical' },
        'U0001': { description: 'High Speed CAN Communication Bus Off', severity: 'critical', system: 'Network' },
      };

      // Simulate random DTCs for demo
      const codes = Object.entries(dtcMap)
        .slice(0, Math.floor(Math.random() * 3) + 1)
        .map(([code, info]) => ({
          code,
          ...info,
        }));

      this.state.dtcCodes = codes;
      return codes;
    } catch (error) {
      console.error('Error reading DTC codes:', error);
      return [];
    }
  }

  /**
   * Read real-time engine parameters
   */
  async readEngineParameters(): Promise<OBDReading[]> {
    if (!this.state.connected) {
      throw new Error('OBD-II device not connected');
    }

    try {
      const timestamp = Date.now();
      const readings: OBDReading[] = [
        { parameter: 'Engine Load', value: Math.random() * 100, unit: '%', timestamp },
        { parameter: 'Coolant Temperature', value: 85 + Math.random() * 20, unit: '°C', timestamp },
        { parameter: 'Short Term Fuel Trim (Bank 1)', value: -5 + Math.random() * 10, unit: '%', timestamp },
        { parameter: 'Long Term Fuel Trim (Bank 1)', value: -3 + Math.random() * 6, unit: '%', timestamp },
        { parameter: 'Intake Manifold Absolute Pressure', value: 30 + Math.random() * 70, unit: 'kPa', timestamp },
        { parameter: 'Engine Speed', value: 600 + Math.random() * 3000, unit: 'RPM', timestamp },
        { parameter: 'Vehicle Speed', value: Math.random() * 120, unit: 'km/h', timestamp },
        { parameter: 'Timing Advance', value: 10 + Math.random() * 15, unit: '°', timestamp },
        { parameter: 'Intake Air Temperature', value: 20 + Math.random() * 40, unit: '°C', timestamp },
        { parameter: 'Mass Air Flow', value: 5 + Math.random() * 20, unit: 'g/s', timestamp },
        { parameter: 'Throttle Position', value: Math.random() * 100, unit: '%', timestamp },
        { parameter: 'O2 Sensor Voltage (Bank 1)', value: 0.4 + Math.random() * 0.6, unit: 'V', timestamp },
        { parameter: 'Fuel Pressure', value: 300 + Math.random() * 100, unit: 'kPa', timestamp },
        { parameter: 'Battery Voltage', value: 12 + Math.random() * 2, unit: 'V', timestamp },
      ];

      this.state.readings = readings;
      this.state.batteryVoltage = readings.find((r) => r.parameter === 'Battery Voltage')?.value as number || 12;
      this.state.engineRunning = (readings.find((r) => r.parameter === 'Engine Speed')?.value as number || 0) > 100;

      return readings;
    } catch (error) {
      console.error('Error reading engine parameters:', error);
      return [];
    }
  }

  /**
   * Clear diagnostic trouble codes
   */
  async clearDTCCodes(): Promise<boolean> {
    if (!this.state.connected) {
      throw new Error('OBD-II device not connected');
    }

    try {
      this.state.dtcCodes = [];
      console.log('✅ DTC codes cleared');
      return true;
    } catch (error) {
      console.error('Error clearing DTC codes:', error);
      return false;
    }
  }

  /**
   * Get current scanner state
   */
  getState(): OBDScannerState {
    return { ...this.state };
  }

  /**
   * Analyze readings for issues
   */
  analyzeReadings(): string[] {
    const issues: string[] = [];

    for (const reading of this.state.readings) {
      const value = reading.value as number;

      if (reading.parameter === 'Coolant Temperature' && value > 105) {
        issues.push('⚠️ Engine overheating - Coolant temperature too high');
      }
      if (reading.parameter === 'Engine Load' && value > 90) {
        issues.push('⚠️ High engine load - Check for mechanical issues');
      }
      if (reading.parameter === 'Battery Voltage' && value < 11.5) {
        issues.push('⚠️ Low battery voltage - Check battery and alternator');
      }
      if (reading.parameter === 'Fuel Pressure' && value < 250) {
        issues.push('⚠️ Low fuel pressure - Check fuel pump and filter');
      }
      if (reading.parameter === 'O2 Sensor Voltage (Bank 1)' && (value < 0.3 || value > 0.8)) {
        issues.push('⚠️ O2 sensor reading out of range - Sensor may be faulty');
      }
    }

    return issues;
  }
}

export const obd2ScannerService = new OBD2ScannerService();
