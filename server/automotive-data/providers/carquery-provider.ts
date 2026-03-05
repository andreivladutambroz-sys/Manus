/**
 * CarQuery API Provider
 * Provides comprehensive vehicle make/model/trim database
 */

import { BaseProvider, VehicleData, RecallData, ProviderResponse } from './base-provider';

export class CarQueryProvider extends BaseProvider {
  private apiKey: string;

  constructor(apiKey?: string) {
    super('carquery', 'https://www.carqueryapi.com/api/0.3');
    this.apiKey = apiKey || '';
    this.rateLimit = 50; // Conservative rate limit for free tier
  }

  /**
   * Decode VIN - CarQuery doesn't support VIN decoding
   */
  async decodeVin(vin: string): Promise<ProviderResponse<VehicleData>> {
    return {
      success: false,
      error: 'CarQuery API does not support VIN decoding',
      source: this.name,
      confidence: 0,
      timestamp: new Date(),
    };
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

      // CarQuery uses JSONP callback format
      const url = new URL(`${this.baseUrl}/`);
      url.searchParams.append('callback', '?');
      url.searchParams.append('cmd', 'getVehicleInfo');
      url.searchParams.append('make', make);
      url.searchParams.append('model', model);
      url.searchParams.append('year', year.toString());

      if (this.apiKey) {
        url.searchParams.append('key', this.apiKey);
      }

      const response = await this.fetchWithTimeout(url.toString());

      if (!response.ok) {
        return {
          success: false,
          error: `CarQuery API returned ${response.status}`,
          source: this.name,
          confidence: 0,
          timestamp: new Date(),
        };
      }

      const text = await response.text();
      const jsonData = this.parseJsonpResponse(text);

      if (!jsonData || jsonData.Status === 'error') {
        return {
          success: false,
          error: `CarQuery: ${jsonData?.Message || 'Unknown error'}`,
          source: this.name,
          confidence: 0,
          timestamp: new Date(),
        };
      }

      const vehicleData = this.parseCarQueryResponse(jsonData, make, model, year);

      return {
        success: true,
        data: vehicleData,
        source: this.name,
        confidence: 0.85, // CarQuery is reliable but less authoritative than OEM
        timestamp: new Date(),
        fields: Object.keys(vehicleData).filter(
          k => vehicleData[k as keyof VehicleData] !== undefined
        ),
      };
    } catch (error) {
      return {
        success: false,
        error: `CarQuery search failed: ${error instanceof Error ? error.message : String(error)}`,
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
    return this.searchVehicle(make, model, year);
  }

  /**
   * Get recalls - CarQuery doesn't have recall data
   */
  async getRecalls(
    make: string,
    model: string,
    year: number,
    vin?: string
  ): Promise<ProviderResponse<RecallData[]>> {
    return {
      success: false,
      error: 'CarQuery API does not provide recall data',
      source: this.name,
      confidence: 0,
      timestamp: new Date(),
    };
  }

  /**
   * Parse JSONP response
   */
  private parseJsonpResponse(text: string): any {
    try {
      // Remove JSONP wrapper: ?({"Status":"ok",...})
      const jsonMatch = text.match(/^\?(\{.*\})$/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  /**
   * Parse CarQuery response
   */
  private parseCarQueryResponse(
    data: any,
    make: string,
    model: string,
    year: number
  ): VehicleData {
    const vehicleData: Partial<VehicleData> = {
      make,
      model,
      year,
    };

    // Map CarQuery fields
    if (data.engine_type) vehicleData.engineType = data.engine_type;
    if (data.engine_displacement) vehicleData.displacement = String(data.engine_displacement);
    if (data.engine_power_ps) vehicleData.power = `${data.engine_power_ps}PS`;
    if (data.engine_torque_nm) vehicleData.torque = `${data.engine_torque_nm}Nm`;
    if (data.engine_cylinders) vehicleData.cylinders = data.engine_cylinders;
    if (data.transmission_type) vehicleData.transmission = data.transmission_type;
    if (data.fuel_type) vehicleData.fuelType = data.fuel_type;
    if (data.body_type) vehicleData.bodyType = data.body_type;

    return vehicleData as VehicleData;
  }
}
