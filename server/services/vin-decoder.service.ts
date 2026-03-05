/**
 * VIN Decoder Service
 * Decodes VIN and extracts vehicle information
 */

interface VINDecodedData {
  make: string;
  model?: string;
  year?: number;
  engine?: string;
  bodyType?: string;
  driveType?: string;
  transmission?: string;
}

class VINDecoderService {
  /**
   * Decode VIN and extract vehicle data
   * VIN Format: WBADT43452G297186
   * Position 0-2: World Manufacturer Identifier (WMI)
   * Position 3-8: Vehicle Descriptor Section (VDS)
   * Position 9: Check digit
   * Position 10: Model year
   * Position 11: Assembly plant
   * Position 12-17: Serial number
   */
  decode(vin: string): VINDecodedData {
    if (!vin || vin.length !== 17) {
      throw new Error("VIN must be exactly 17 characters");
    }

    const vinUpper = vin.toUpperCase();

    // Extract make from first 3 characters (WMI)
    const make = this.decodeMake(vinUpper.substring(0, 3));

    // Extract year from position 10
    const year = this.decodeYear(vinUpper.charAt(10));

    // Extract body type from position 3
    const bodyType = this.decodeBodyType(vinUpper.charAt(3));

    // Extract drive type from position 4
    const driveType = this.decodeDriveType(vinUpper.charAt(4));

    // Extract engine from position 8
    const engine = this.decodeEngine(vinUpper.charAt(8));

    return {
      make,
      year,
      bodyType,
      driveType,
      engine,
    };
  }

  /**
   * Decode manufacturer from WMI (World Manufacturer Identifier)
   */
  private decodeMake(wmi: string): string {
    const makes: Record<string, string> = {
      "WBA": "BMW",
      "WBX": "BMW",
      "WBS": "BMW",
      "WAG": "Audi",
      "WAU": "Audi",
      "WVW": "Volkswagen",
      "WV1": "Volkswagen",
      "WV2": "Volkswagen",
      "WVG": "Volkswagen",
      "ZFF": "Ferrari",
      "ZLA": "Lamborghini",
      "ZAR": "Rolls-Royce",
      "JHM": "Honda",
      "JT2": "Toyota",
      "JT3": "Toyota",
      "JT4": "Toyota",
      "JT6": "Toyota",
      "JT7": "Toyota",
      "JTH": "Toyota",
      "JTL": "Toyota",
      "JTW": "Toyota",
      "KMH": "Hyundai",
      "KNA": "Kia",
      "KNB": "Kia",
      "KNC": "Kia",
      "KND": "Kia",
      "KNE": "Kia",
      "KNF": "Kia",
      "KNG": "Kia",
      "KNH": "Kia",
      "KNJ": "Kia",
      "KNK": "Kia",
      "LVV": "Volvo",
      "LVS": "Volvo",
      "YV1": "Volvo",
      "YV2": "Volvo",
      "YV3": "Volvo",
      "YV4": "Volvo",
      "YV6": "Volvo",
      "YV7": "Volvo",
      "YV8": "Volvo",
      "YV9": "Volvo",
      "SAJ": "Jaguar",
      "SAL": "Land Rover",
      "SAR": "Range Rover",
      "SCC": "Lamborghini",
      "SCB": "Lamborghini",
      "ZAM": "Maserati",
      "ZAP": "Porsche",
      "WP0": "Porsche",
      "WP1": "Porsche",
      "VSS": "Nissan",
      "VNK": "Nissan",
      "JN1": "Nissan",
      "JN2": "Nissan",
      "JN3": "Nissan",
      "JN4": "Nissan",
      "JN5": "Nissan",
      "JN6": "Nissan",
      "JN7": "Nissan",
      "JN8": "Nissan",
      "JN9": "Nissan",
      "MZA": "Mazda",
      "MZB": "Mazda",
      "MZC": "Mazda",
      "MZD": "Mazda",
      "MZE": "Mazda",
      "MZF": "Mazda",
      "MZG": "Mazda",
      "MZH": "Mazda",
      "MZJ": "Mazda",
      "MZK": "Mazda",
      "MZL": "Mazda",
      "MZM": "Mazda",
      "MZN": "Mazda",
      "MZP": "Mazda",
      "MZR": "Mazda",
      "MZS": "Mazda",
      "MZT": "Mazda",
      "MZU": "Mazda",
      "MZV": "Mazda",
      "MZW": "Mazda",
      "MZX": "Mazda",
      "MZY": "Mazda",
      "MZZ": "Mazda",
      "DAM": "Daimler",
      "DAR": "Daimler",
      "WDB": "Mercedes-Benz",
      "WDC": "Mercedes-Benz",
      "WDD": "Mercedes-Benz",
      "WDE": "Mercedes-Benz",
      "WDF": "Mercedes-Benz",
      "WDG": "Mercedes-Benz",
      "WDH": "Mercedes-Benz",
      "WDJ": "Mercedes-Benz",
      "WDK": "Mercedes-Benz",
      "WDL": "Mercedes-Benz",
      "WDM": "Mercedes-Benz",
      "WDN": "Mercedes-Benz",
      "WDP": "Mercedes-Benz",
      "WDR": "Mercedes-Benz",
      "WDS": "Mercedes-Benz",
      "WDT": "Mercedes-Benz",
      "WDU": "Mercedes-Benz",
      "WDV": "Mercedes-Benz",
      "WDW": "Mercedes-Benz",
      "WDX": "Mercedes-Benz",
      "WDY": "Mercedes-Benz",
      "WDZ": "Mercedes-Benz",
      "1G1": "Chevrolet",
      "1G2": "Pontiac",
      "1G3": "Oldsmobile",
      "1G4": "Cadillac",
      "1G5": "Cadillac",
      "1G6": "Cadillac",
      "1G7": "Cadillac",
      "1G8": "Cadillac",
      "1G9": "Cadillac",
      "1GT": "GMC",
      "1GU": "GMC",
      "1GV": "GMC",
      "1GW": "GMC",
      "1GX": "GMC",
      "1GY": "GMC",
      "1GZ": "GMC",
      "1FA": "Ford",
      "1FB": "Ford",
      "1FC": "Ford",
      "1FD": "Ford",
      "1FE": "Ford",
      "1FF": "Ford",
      "1FG": "Ford",
      "1FH": "Ford",
      "1FT": "Ford",
      "1FU": "Ford",
      "1FV": "Ford",
      "1FW": "Ford",
      "1FX": "Ford",
      "1FY": "Ford",
      "1FZ": "Ford",
      "2G1": "Pontiac",
      "2G2": "Pontiac",
      "2G3": "Oldsmobile",
      "2G4": "Oldsmobile",
      "2G5": "Cadillac",
      "2G6": "Cadillac",
      "2G7": "Cadillac",
      "2G8": "Cadillac",
      "2G9": "Cadillac",
      "2GT": "GMC",
      "2GU": "GMC",
      "2GV": "GMC",
      "2GW": "GMC",
      "2GX": "GMC",
      "2GY": "GMC",
      "2GZ": "GMC",
      "2HA": "Honda",
      "2HB": "Honda",
      "2HC": "Honda",
      "2HD": "Honda",
      "2HE": "Honda",
      "2HF": "Honda",
      "2HG": "Honda",
      "2HH": "Honda",
      "2HJ": "Honda",
      "2HK": "Honda",
      "2HL": "Honda",
      "2HM": "Honda",
      "2HN": "Honda",
      "2HP": "Honda",
      "2HR": "Honda",
      "2HS": "Honda",
      "2HT": "Honda",
      "2HU": "Honda",
      "2HV": "Honda",
      "2HW": "Honda",
      "2HX": "Honda",
      "2HY": "Honda",
      "2HZ": "Honda",
      "5TP": "Toyota",
      "5TR": "Toyota",
      "5TS": "Toyota",
      "5TT": "Toyota",
      "5TU": "Toyota",
      "5TV": "Toyota",
      "5TW": "Toyota",
      "5TX": "Toyota",
      "5TY": "Toyota",
      "5TZ": "Toyota",
      "TMA": "Tesla",
      "TMB": "Tesla",
      "TMC": "Tesla",
      "TMD": "Tesla",
      "TME": "Tesla",
      "TMF": "Tesla",
      "TMG": "Tesla",
      "TMH": "Tesla",
      "TMJ": "Tesla",
      "TMK": "Tesla",
      "TML": "Tesla",
      "TMM": "Tesla",
      "TMN": "Tesla",
      "TMP": "Tesla",
      "TMR": "Tesla",
      "TMS": "Tesla",
      "TMT": "Tesla",
      "TMU": "Tesla",
      "TMV": "Tesla",
      "TMW": "Tesla",
      "TMX": "Tesla",
      "TMY": "Tesla",
      "TMZ": "Tesla",
    };

    return makes[wmi] || "Unknown";
  }

  /**
   * Decode model year from position 10
   */
  private decodeYear(yearChar: string): number {
    const yearMap: Record<string, number> = {
      "A": 2010,
      "B": 2011,
      "C": 2012,
      "D": 2013,
      "E": 2014,
      "F": 2015,
      "G": 2016,
      "H": 2017,
      "J": 2018,
      "K": 2019,
      "L": 2020,
      "M": 2021,
      "N": 2022,
      "P": 2023,
      "R": 2024,
      "S": 2025,
      "T": 2026,
      "V": 2027,
      "W": 2028,
      "X": 2029,
      "Y": 2030,
    };

    return yearMap[yearChar] || new Date().getFullYear();
  }

  /**
   * Decode body type from position 3
   */
  private decodeBodyType(char: string): string {
    const bodyTypes: Record<string, string> = {
      "A": "Sedan",
      "B": "Coupe",
      "C": "Convertible",
      "D": "Station Wagon",
      "E": "SUV",
      "F": "Hatchback",
      "G": "Minivan",
      "H": "Pickup",
      "J": "Jeep",
      "K": "Truck",
      "L": "Van",
      "M": "Motorcycle",
      "N": "Bus",
      "P": "Cabriolet",
      "R": "Roadster",
      "S": "Sedan",
      "T": "Touring",
      "U": "Utility",
      "V": "Van",
      "W": "Wagon",
      "X": "Crossover",
      "Y": "Coupe",
      "Z": "Other",
    };

    return bodyTypes[char] || "Unknown";
  }

  /**
   * Decode drive type from position 4
   */
  private decodeDriveType(char: string): string {
    const driveTypes: Record<string, string> = {
      "A": "Front-Wheel Drive",
      "B": "Rear-Wheel Drive",
      "C": "All-Wheel Drive",
      "D": "Four-Wheel Drive",
      "E": "All-Wheel Drive",
      "F": "Front-Wheel Drive",
      "G": "Rear-Wheel Drive",
      "H": "All-Wheel Drive",
      "J": "Four-Wheel Drive",
      "K": "Front-Wheel Drive",
      "L": "Rear-Wheel Drive",
      "M": "All-Wheel Drive",
      "N": "Front-Wheel Drive",
      "P": "Rear-Wheel Drive",
      "R": "All-Wheel Drive",
      "S": "Front-Wheel Drive",
      "T": "Rear-Wheel Drive",
      "U": "All-Wheel Drive",
      "V": "Front-Wheel Drive",
      "W": "Rear-Wheel Drive",
      "X": "All-Wheel Drive",
      "Y": "Front-Wheel Drive",
      "Z": "Rear-Wheel Drive",
    };

    return driveTypes[char] || "Unknown";
  }

  /**
   * Decode engine from position 8
   */
  private decodeEngine(char: string): string {
    const engines: Record<string, string> = {
      "A": "1.6L",
      "B": "1.8L",
      "C": "2.0L",
      "D": "2.2L",
      "E": "2.4L",
      "F": "2.6L",
      "G": "2.8L",
      "H": "3.0L",
      "J": "3.2L",
      "K": "3.5L",
      "L": "3.8L",
      "M": "4.0L",
      "N": "4.2L",
      "P": "4.4L",
      "R": "4.6L",
      "S": "4.8L",
      "T": "5.0L",
      "U": "5.2L",
      "V": "5.4L",
      "W": "5.6L",
      "X": "5.8L",
      "Y": "6.0L",
      "Z": "6.2L",
    };

    return engines[char] || "Unknown";
  }
}

export const vinDecoderService = new VINDecoderService();
