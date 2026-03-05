/**
 * Base Provider Interface
 * All automotive data providers must implement this interface
 */

export interface VehicleData {
  make: string;
  model: string;
  year: number;
  engineCode?: string;
  engineType?: string;
  displacement?: string;
  power?: string;
  torque?: string;
  cylinders?: number;
  transmission?: string;
  fuelType?: string;
  fuelConsumption?: string;
  co2Emissions?: string;
  bodyType?: string;
}

export interface RecallData {
  recallId: string;
  manufacturer: string;
  description: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  fixProcedure?: string;
  estimatedRepairTime?: string;
  recallDate?: Date;
  status: 'open' | 'closed' | 'superseded';
}

export interface ProviderResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  source: string;
  confidence: number; // 0.0-1.0
  timestamp: Date;
  fields?: string[]; // Which fields were populated
}

export interface DataSource {
  provider: string;
  confidence: number;
  lastFetched: string;
  fields: string[];
}

/**
 * Base class for all automotive data providers
 */
export abstract class BaseProvider {
  protected name: string;
  protected baseUrl: string;
  protected timeout: number = 10000; // 10 seconds
  protected rateLimit: number = 100; // requests per minute
  protected lastRequestTime: number = 0;

  constructor(name: string, baseUrl: string) {
    this.name = name;
    this.baseUrl = baseUrl;
  }

  /**
   * Get provider name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Decode VIN to vehicle information
   */
  abstract decodeVin(vin: string): Promise<ProviderResponse<VehicleData>>;

  /**
   * Search vehicle by make, model, year
   */
  abstract searchVehicle(
    make: string,
    model: string,
    year: number
  ): Promise<ProviderResponse<VehicleData>>;

  /**
   * Get vehicle specifications
   */
  abstract getSpecifications(
    make: string,
    model: string,
    year: number
  ): Promise<ProviderResponse<VehicleData>>;

  /**
   * Get recalls for a vehicle
   */
  abstract getRecalls(
    make: string,
    model: string,
    year: number,
    vin?: string
  ): Promise<ProviderResponse<RecallData[]>>;

  /**
   * Rate limit check - wait if necessary
   */
  protected async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minTimeBetweenRequests = (60 * 1000) / this.rateLimit;

    if (timeSinceLastRequest < minTimeBetweenRequests) {
      const waitTime = minTimeBetweenRequests - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Make HTTP request with timeout
   */
  protected async fetchWithTimeout(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Normalize field names across providers
   */
  protected normalizeFieldName(field: string): string {
    const fieldMap: Record<string, string> = {
      'Model Year': 'year',
      'Make': 'make',
      'Model': 'model',
      'Engine': 'engineType',
      'Displacement': 'displacement',
      'Power': 'power',
      'Torque': 'torque',
      'Cylinders': 'cylinders',
      'Transmission': 'transmission',
      'Fuel Type': 'fuelType',
      'Body Type': 'bodyType',
    };

    return fieldMap[field] || field.toLowerCase();
  }
}
