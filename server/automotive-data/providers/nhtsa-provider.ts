/**
 * NHTSA vPIC API Provider
 * Provides VIN decoding and vehicle information from NHTSA
 */

import { BaseProvider, VehicleData, RecallData, ProviderResponse } from './base-provider';

export class NhtsaProvider extends BaseProvider {
  constructor() {
    super('nhtsa', 'https://vpic.nhtsa.dot.gov/api/vehicles');
    this.rateLimit = 100; // NHTSA doesn't specify, but we're conservative
  }

  /**
   * Decode VIN using NHTSA vPIC API
   */
  async decodeVin(vin: string): Promise<ProviderResponse<VehicleData>> {
    try {
      await this.checkRateLimit();

      const url = `${this.baseUrl}/DecodeVinExtended/${vin}?format=json`;
      const response = await this.fetchWithTimeout(url);

      if (!response.ok) {
        return {
          success: false,
          error: `NHTSA API returned ${response.status}`,
          source: this.name,
          confidence: 0,
          timestamp: new Date(),
        };
      }

      const data = await response.json() as any;
      const vehicleData = this.parseVinResponse(data);

      return {
        success: true,
        data: vehicleData,
        source: this.name,
        confidence: 0.95, // NHTSA VIN decoding is very reliable
        timestamp: new Date(),
        fields: Object.keys(vehicleData).filter(k => vehicleData[k as keyof VehicleData] !== undefined),
      };
    } catch (error) {
      return {
        success: false,
        error: `NHTSA VIN decode failed: ${error instanceof Error ? error.message : String(error)}`,
        source: this.name,
        confidence: 0,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Search vehicle by make, model, year
   */
  async searchVehicle(
    make: string,
    model: string,
    year: number
  ): Promise<ProviderResponse<VehicleData>> {
    try {
      await this.checkRateLimit();

      const url = `${this.baseUrl}/GetModelsForMakeYear/make/${make}/modelyear/${year}?format=json`;
      const response = await this.fetchWithTimeout(url);

      if (!response.ok) {
        return {
          success: false,
          error: `NHTSA API returned ${response.status}`,
          source: this.name,
          confidence: 0,
          timestamp: new Date(),
        };
      }

      const data = await response.json() as any;
      const models = data.Results || [];

      // Find matching model
      const matchedModel = models.find(
        (m: any) => m.Model_Name?.toLowerCase() === model.toLowerCase()
      );

      if (!matchedModel) {
        return {
          success: false,
          error: `Model ${model} not found for ${make} ${year}`,
          source: this.name,
          confidence: 0,
          timestamp: new Date(),
        };
      }

      const vehicleData: VehicleData = {
        make,
        model,
        year,
      };

      return {
        success: true,
        data: vehicleData,
        source: this.name,
        confidence: 0.85,
        timestamp: new Date(),
        fields: ['make', 'model', 'year'],
      };
    } catch (error) {
      return {
        success: false,
        error: `NHTSA search failed: ${error instanceof Error ? error.message : String(error)}`,
        source: this.name,
        confidence: 0,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get vehicle specifications
   */
  async getSpecifications(
    make: string,
    model: string,
    year: number
  ): Promise<ProviderResponse<VehicleData>> {
    // NHTSA doesn't have a direct specs endpoint, so we return basic info
    return this.searchVehicle(make, model, year);
  }

  /**
   * Get recalls for a vehicle
   * Note: NHTSA has recall data but through a different endpoint
   */
  async getRecalls(
    make: string,
    model: string,
    year: number,
    vin?: string
  ): Promise<ProviderResponse<RecallData[]>> {
    try {
      await this.checkRateLimit();

      // NHTSA recalls API endpoint (if available)
      // This is a placeholder - actual implementation would use NHTSA's recalls endpoint
      const recalls: RecallData[] = [];

      return {
        success: true,
        data: recalls,
        source: this.name,
        confidence: 0.5, // Placeholder confidence
        timestamp: new Date(),
        fields: ['recallId', 'description', 'riskLevel'],
      };
    } catch (error) {
      return {
        success: false,
        error: `NHTSA recalls fetch failed: ${error instanceof Error ? error.message : String(error)}`,
        source: this.name,
        confidence: 0,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Parse NHTSA VIN decode response
   */
  private parseVinResponse(data: any): VehicleData {
    const results = data.Results || [];
    const vehicleData: Partial<VehicleData> = {};

    // Map NHTSA field names to our schema
    const fieldMap: Record<string, keyof VehicleData> = {
      'Model Year': 'year',
      'Make': 'make',
      'Model': 'model',
      'Engine Code': 'engineCode',
      'Engine Displacement': 'displacement',
      'Engine Cylinders': 'cylinders',
      'Engine Type': 'engineType',
      'Transmission': 'transmission',
      'Fuel Type': 'fuelType',
      'Body Type': 'bodyType',
    };

    for (const result of results) {
      const variable = result.Variable;
      const value = result.Value;

      if (fieldMap[variable]) {
        const key = fieldMap[variable];
        vehicleData[key] = value;
      }
    }

    // Ensure required fields
    if (!vehicleData.make || !vehicleData.model || !vehicleData.year) {
      throw new Error('Missing required VIN decode fields');
    }

    return vehicleData as VehicleData;
  }
}
