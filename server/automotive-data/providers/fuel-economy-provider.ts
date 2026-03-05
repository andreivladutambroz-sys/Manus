/**
 * FuelEconomy.gov API Provider
 * Provides fuel consumption and emissions data from EPA
 */

import { BaseProvider, VehicleData, RecallData, ProviderResponse } from './base-provider';

export class FuelEconomyProvider extends BaseProvider {
  constructor() {
    super('fueleconomy', 'https://www.fueleconomy.gov/ws/rest/vehicle');
    this.rateLimit = 100; // Conservative rate limit
  }

  /**
   * Decode VIN - FuelEconomy doesn't support VIN decoding
   */
  async decodeVin(vin: string): Promise<ProviderResponse<VehicleData>> {
    return {
      success: false,
      error: 'FuelEconomy API does not support VIN decoding',
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

      // First, find the vehicle ID
      const searchUrl = `${this.baseUrl}/menu/findByModel?year=${year}&make=${make}&model=${model}`;
      const searchResponse = await this.fetchWithTimeout(searchUrl);

      if (!searchResponse.ok) {
        return {
          success: false,
          error: `FuelEconomy search returned ${searchResponse.status}`,
          source: this.name,
          confidence: 0,
          timestamp: new Date(),
        };
      }

      const searchData = await searchResponse.json() as any;
      const vehicles = searchData.vehicles || [];

      if (vehicles.length === 0) {
        return {
          success: false,
          error: `No vehicles found for ${year} ${make} ${model}`,
          source: this.name,
          confidence: 0,
          timestamp: new Date(),
        };
      }

      // Get details for the first matching vehicle
      const vehicleId = vehicles[0].id;
      const detailsUrl = `${this.baseUrl}/${vehicleId}`;
      const detailsResponse = await this.fetchWithTimeout(detailsUrl);

      if (!detailsResponse.ok) {
        return {
          success: false,
          error: `FuelEconomy details returned ${detailsResponse.status}`,
          source: this.name,
          confidence: 0,
          timestamp: new Date(),
        };
      }

      const vehicleData = await detailsResponse.json() as any;
      const parsedData = this.parseFuelEconomyResponse(vehicleData, make, model, year);

      return {
        success: true,
        data: parsedData,
        source: this.name,
        confidence: 0.90, // EPA data is reliable
        timestamp: new Date(),
        fields: Object.keys(parsedData).filter(
          k => parsedData[k as keyof VehicleData] !== undefined
        ),
      };
    } catch (error) {
      return {
        success: false,
        error: `FuelEconomy search failed: ${error instanceof Error ? error.message : String(error)}`,
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
   * Get recalls - FuelEconomy doesn't have recall data
   */
  async getRecalls(
    make: string,
    model: string,
    year: number,
    vin?: string
  ): Promise<ProviderResponse<RecallData[]>> {
    return {
      success: false,
      error: 'FuelEconomy API does not provide recall data',
      source: this.name,
      confidence: 0,
      timestamp: new Date(),
    };
  }

  /**
   * Parse FuelEconomy response
   */
  private parseFuelEconomyResponse(
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

    // Map FuelEconomy fields
    if (data.fuelType) vehicleData.fuelType = data.fuelType;
    if (data.transmission) vehicleData.transmission = data.transmission;
    if (data.cylinders) vehicleData.cylinders = data.cylinders;
    if (data.displacement) vehicleData.displacement = String(data.displacement);

    // Fuel economy data
    if (data.fuelEconomyCombined) {
      vehicleData.fuelConsumption = `${data.fuelEconomyCombined} mpg`;
    }

    // CO2 emissions
    if (data.co2Emissions) {
      vehicleData.co2Emissions = `${data.co2Emissions} g/km`;
    }

    return vehicleData as VehicleData;
  }
}
