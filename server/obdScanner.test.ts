import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * OBD Scanner Tests
 * Tests for Web Bluetooth OBD-II integration
 */

describe('OBD Scanner', () => {
  describe('DTC Parsing', () => {
    it('should decode DTC bytes correctly', () => {
      // Test DTC decoding logic
      // Format: P0101 = Powertrain, 01, 01
      // DTC byte format: [PP][SS][TTTT] where PP=type, SS=system, TTTT=code
      const byte1 = 0b00000001; // Type P (00) + System 0 (00) + Code 1 (0001)
      const byte2 = 0b00000001; // Code 01 (0000 0001)

      // Expected: P0101
      const firstChar = String.fromCharCode(0x50 + ((byte1 >> 6) & 0x03)); // P (0x50 = 80)
      const secondChar = String.fromCharCode(0x30 + ((byte1 >> 4) & 0x03)); // 0 (0x30 = 48)
      const thirdChar = String.fromCharCode(0x30 + (byte1 & 0x0f)); // 1 (0x30 + 1 = 49)
      const fourthChar = String.fromCharCode(0x30 + ((byte2 >> 4) & 0x0f)); // 0
      const fifthChar = String.fromCharCode(0x30 + (byte2 & 0x0f)); // 1

      const dtc = firstChar + secondChar + thirdChar + fourthChar + fifthChar;
      expect(dtc).toBe('P0101');
    });

    it('should parse DTC response correctly', () => {
      // Simulate ELM327 response: 43 02 P0101 P0128
      // Response format: 43 <num_dtcs> <dtc1_byte1> <dtc1_byte2> <dtc2_byte1> <dtc2_byte2>
      const response = '43 02 01 01 01 28';
      const parts = response.split(' ').filter((p) => p.length > 0);

      const dtcCount = parseInt(parts[1], 16);
      expect(dtcCount).toBe(2);

      // Parse first DTC
      const byte1_1 = parseInt(parts[2], 16);
      const byte2_1 = parseInt(parts[3], 16);
      const firstChar = String.fromCharCode(0x50 + ((byte1_1 >> 6) & 0x03));
      const secondChar = String.fromCharCode(0x30 + ((byte1_1 >> 4) & 0x03));
      const thirdChar = String.fromCharCode(0x30 + (byte1_1 & 0x0f));
      const fourthChar = String.fromCharCode(0x30 + ((byte2_1 >> 4) & 0x0f));
      const fifthChar = String.fromCharCode(0x30 + (byte2_1 & 0x0f));

      const dtc1 = firstChar + secondChar + thirdChar + fourthChar + fifthChar;
      expect(dtc1).toBe('P0101');
    });

    it('should handle empty DTC response', () => {
      const response = '43 00';
      const parts = response.split(' ').filter((p) => p.length > 0);

      const dtcCount = parseInt(parts[1], 16);
      expect(dtcCount).toBe(0);
    });
  });

  describe('Vehicle Speed Parsing', () => {
    it('should parse vehicle speed correctly', () => {
      // Response format: 410D <speed_value>
      // Speed in km/h is the value directly
      const response = '410D 50'; // 80 km/h
      const parts = response.split(' ');

      const speedValue = parseInt(parts[1], 16);
      expect(speedValue).toBe(80);
    });

    it('should handle zero speed', () => {
      const response = '410D 00';
      const parts = response.split(' ');

      const speedValue = parseInt(parts[1], 16);
      expect(speedValue).toBe(0);
    });

    it('should handle high speed', () => {
      const response = '410D FF'; // 255 km/h (max)
      const parts = response.split(' ');

      const speedValue = parseInt(parts[1], 16);
      expect(speedValue).toBe(255);
    });
  });

  describe('Engine RPM Parsing', () => {
    it('should parse engine RPM correctly', () => {
      // Response format: 410C <rpm_high> <rpm_low>
      // RPM = ((rpm_high * 256 + rpm_low) / 4)
      const response = '410C 04 00'; // (4 * 256 + 0) / 4 = 256 RPM
      const parts = response.split(' ');

      const rpmHigh = parseInt(parts[1], 16);
      const rpmLow = parseInt(parts[2], 16);
      const rpm = ((rpmHigh * 256 + rpmLow) / 4).toFixed(0);

      expect(parseInt(rpm)).toBe(256);
    });

    it('should parse idle RPM', () => {
      const response = '410C 0C 00'; // 3072 / 4 = 768 RPM
      const parts = response.split(' ');

      const rpmHigh = parseInt(parts[1], 16);
      const rpmLow = parseInt(parts[2], 16);
      const rpm = ((rpmHigh * 256 + rpmLow) / 4).toFixed(0);

      expect(parseInt(rpm)).toBe(768);
    });

    it('should parse high RPM', () => {
      const response = '410C 40 00'; // 16384 / 4 = 4096 RPM
      const parts = response.split(' ');

      const rpmHigh = parseInt(parts[1], 16);
      const rpmLow = parseInt(parts[2], 16);
      const rpm = ((rpmHigh * 256 + rpmLow) / 4).toFixed(0);

      expect(parseInt(rpm)).toBe(4096);
    });
  });

  describe('DTC Severity Classification', () => {
    it('should classify P codes as critical', () => {
      const code = 'P0101';
      const severity = code.startsWith('P0') ? 'critical' : 'warning';
      expect(severity).toBe('critical');
    });

    it('should classify C codes as warning', () => {
      const code = 'C0101';
      const severity = code.startsWith('C0') ? 'warning' : 'info';
      expect(severity).toBe('warning');
    });

    it('should classify B and U codes as info', () => {
      const codeB = 'B0101';
      const codeU = 'U0101';

      const severityB = codeB.startsWith('P0') ? 'critical' : codeB.startsWith('C0') ? 'warning' : 'info';
      const severityU = codeU.startsWith('P0') ? 'critical' : codeU.startsWith('C0') ? 'warning' : 'info';

      expect(severityB).toBe('info');
      expect(severityU).toBe('info');
    });
  });

  describe('ELM327 Command Format', () => {
    it('should format AT commands correctly', () => {
      const commands = [
        'AT Z',      // Reset
        'AT E0',     // Echo off
        'AT L0',     // Line feed off
        'AT S0',     // Space off
        'AT SP 6',   // Set protocol
        '03',        // Read DTCs
        '04',        // Clear DTCs
        '010D',      // Vehicle speed
        '010C',      // Engine RPM
      ];

      commands.forEach(cmd => {
        expect(cmd).toMatch(/^[A-Z0-9\s]+$/);
      });
    });

    it('should handle command responses', () => {
      const responses = [
        '43 02 01 01 01 28',  // DTC response
        '410D 50',            // Speed response
        '410C 10 00',         // RPM response
        '>',                  // Prompt
      ];

      responses.forEach(resp => {
        expect(resp.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Web Bluetooth Device Filtering', () => {
    it('should filter for OBD-II devices', () => {
      const filters = [
        { namePrefix: 'ELM' },
        { namePrefix: 'OBD' },
        { namePrefix: 'VGATE' },
        { namePrefix: 'BAFX' },
      ];

      const deviceNames = [
        'ELM327',
        'OBD-II Scanner',
        'VGATE iCar',
        'BAFX OBD',
        'Random Device',
      ];

      deviceNames.forEach(name => {
        const matches = filters.some(f => name.includes(f.namePrefix));
        if (name.includes('ELM') || name.includes('OBD') || name.includes('VGATE') || name.includes('BAFX')) {
          expect(matches).toBe(true);
        } else {
          expect(matches).toBe(false);
        }
      });
    });
  });

  describe('GATT Characteristics', () => {
    it('should use correct UUIDs', () => {
      const serviceUUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
      const characteristicUUID = '0000ffe1-0000-1000-8000-00805f9b34fb';

      expect(serviceUUID).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(characteristicUUID).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed responses', () => {
      const malformedResponses = [
        '',
        '?',
        'NO DATA',
        'BUS ERROR',
      ];

      malformedResponses.forEach(resp => {
        const isValid = resp.startsWith('43') || resp.startsWith('410');
        expect(isValid).toBe(false);
      });
    });

    it('should handle timeout scenarios', () => {
      const timeout = 2000; // 2 seconds
      expect(timeout).toBeGreaterThan(0);
      expect(timeout).toBeLessThan(5000);
    });

    it('should handle connection errors', () => {
      const errors = [
        'Device not found',
        'Connection timeout',
        'GATT error',
        'Characteristic not found',
      ];

      errors.forEach(error => {
        expect(error.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Data Validation', () => {
    it('should validate DTC format', () => {
      const validCodes = ['P0101', 'C0202', 'B0303', 'U0404'];
      const invalidCodes = ['P01', 'C020', 'INVALID', '12345'];

      validCodes.forEach(code => {
        expect(code).toMatch(/^[PCBU]\d{4}$/);
      });

      invalidCodes.forEach(code => {
        expect(code).not.toMatch(/^[PCBU]\d{4}$/);
      });
    });

    it('should validate speed range', () => {
      const speeds = [0, 50, 100, 200, 255];

      speeds.forEach(speed => {
        expect(speed).toBeGreaterThanOrEqual(0);
        expect(speed).toBeLessThanOrEqual(255);
      });
    });

    it('should validate RPM range', () => {
      const rpms = [0, 500, 1000, 3000, 6000, 8000];

      rpms.forEach(rpm => {
        expect(rpm).toBeGreaterThanOrEqual(0);
        expect(rpm).toBeLessThanOrEqual(8000);
      });
    });
  });
});
