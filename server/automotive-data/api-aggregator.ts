/**
 * Automotive API Aggregator
 * Coordinates multiple data providers and normalizes responses
 */

import { BaseProvider, VehicleData, RecallData, ProviderResponse, DataSource } from './providers/base-provider';
import { NhtsaProvider } from './providers/nhtsa-provider';
import { FuelEconomyProvider } from './providers/fuel-economy-provider';

export interface AggregatedVehicleData extends VehicleData {
  sources: DataSource[];
  overallConfidence: number;
}

export interface AggregatedRecalls {
  recalls: RecallData[];
  sources: DataSource[];
  overallConfidence: number;
}

export class ApiAggregator {
  private providers: BaseProvider[] = [];
  private requestLog: Map<string, number> = new Map(); // Track request counts for rate limiting

  constructor() {
    // Initialize all providers
    this.providers.push(new NhtsaProvider());
    this.providers.push(new FuelEconomyProvider());
    // Additional providers can be added here
  }

  /**
   * Decode VIN by querying all providers and aggregating results
   */
  async decodeVin(vin: string): Promise<AggregatedVehicleData> {
    const responses = await Promise.all(
      this.providers.map(provider => provider.decodeVin(vin))
    );

    return this.aggregateVehicleResponses(responses);
  }

  /**
   * Search vehicle by make, model, year
   */
  async searchVehicle(
    make: string,
    model: string,
    year: number
  ): Promise<AggregatedVehicleData> {
    const responses = await Promise.all(
      this.providers.map(provider => provider.searchVehicle(make, model, year))
    );

    return this.aggregateVehicleResponses(responses);
  }

  /**
   * Get vehicle specifications
   */
  async getSpecifications(
    make: string,
    model: string,
    year: number
  ): Promise<AggregatedVehicleData> {
    const responses = await Promise.all(
      this.providers.map(provider => provider.getSpecifications(make, model, year))
    );

    return this.aggregateVehicleResponses(responses);
  }

  /**
   * Get recalls for a vehicle
   */
  async getRecalls(
    make: string,
    model: string,
    year: number,
    vin?: string
  ): Promise<AggregatedRecalls> {
    const responses = await Promise.all(
      this.providers.map(provider => provider.getRecalls(make, model, year, vin))
    );

    return this.aggregateRecallResponses(responses);
  }

  /**
   * Aggregate vehicle data responses from multiple providers
   */
  private aggregateVehicleResponses(
    responses: ProviderResponse<VehicleData>[]
  ): AggregatedVehicleData {
    const successfulResponses = responses.filter(r => r.success);

    if (successfulResponses.length === 0) {
      throw new Error('All providers failed to return vehicle data');
    }

    // Start with the most confident response
    const baseResponse = successfulResponses.reduce((prev, current) =>
      current.confidence > prev.confidence ? current : prev
    );

    const aggregatedData: Partial<AggregatedVehicleData> = { ...baseResponse.data };
    const sources: DataSource[] = [];

    // Merge data from all successful responses
    for (const response of successfulResponses) {
      if (response.data) {
        // Fill in missing fields from other providers
        for (const [key, value] of Object.entries(response.data)) {
          if (
            value !== undefined &&
            value !== null &&
            !aggregatedData[key as keyof VehicleData]
          ) {
            aggregatedData[key as keyof VehicleData] = value;
          }
        }
      }

      // Track sources
      sources.push({
        provider: response.source,
        confidence: response.confidence,
        lastFetched: response.timestamp.toISOString(),
        fields: response.fields || [],
      });
    }

    // Calculate overall confidence (average of all sources)
    const overallConfidence =
      sources.reduce((sum, s) => sum + s.confidence, 0) / sources.length;

    return {
      ...(aggregatedData as VehicleData),
      sources,
      overallConfidence,
    };
  }

  /**
   * Aggregate recall responses from multiple providers
   */
  private aggregateRecallResponses(
    responses: ProviderResponse<RecallData[]>[]
  ): AggregatedRecalls {
    const successfulResponses = responses.filter(r => r.success);

    const allRecalls: RecallData[] = [];
    const sources: DataSource[] = [];
    const seenRecallIds = new Set<string>();

    // Merge recalls from all providers, avoiding duplicates
    for (const response of successfulResponses) {
      if (response.data) {
        for (const recall of response.data) {
          if (!seenRecallIds.has(recall.recallId)) {
            allRecalls.push(recall);
            seenRecallIds.add(recall.recallId);
          }
        }
      }

      sources.push({
        provider: response.source,
        confidence: response.confidence,
        lastFetched: response.timestamp.toISOString(),
        fields: response.fields || [],
      });
    }

    const overallConfidence =
      sources.length > 0
        ? sources.reduce((sum, s) => sum + s.confidence, 0) / sources.length
        : 0;

    return {
      recalls: allRecalls,
      sources,
      overallConfidence,
    };
  }

  /**
   * Get list of available providers
   */
  getProviders(): string[] {
    return this.providers.map(p => p.getName());
  }

  /**
   * Get request statistics
   */
  getStats(): Record<string, number> {
    return Object.fromEntries(this.requestLog);
  }
}

// Export singleton instance
export const apiAggregator = new ApiAggregator();
