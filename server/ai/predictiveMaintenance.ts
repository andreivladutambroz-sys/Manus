import { ENV } from '../_core/env';

/**
 * Predictive Maintenance Engine
 * Generates maintenance schedules and parts replacement recommendations
 */

export interface MaintenanceRecommendation {
  service: string;
  dueAt: {
    mileage: number;
    months: number;
  };
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedCost: {
    min: number;
    max: number;
    currency: string;
  };
  description: string;
  partsNeeded: string[];
  estimatedTime: number;
}

export interface VehicleProfile {
  brand: string;
  model: string;
  year: number;
  mileage: number;
  fuelType: string;
  transmissionType: string;
  driveType: string;
}

/**
 * Call Kimi API
 */
async function callKimi(
  systemPrompt: string,
  userPrompt: string,
  options: { temperature?: number; maxTokens?: number; jsonMode?: boolean } = {}
): Promise<string> {
  const { temperature = 0.3, maxTokens = 2000, jsonMode = false } = options;

  const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ENV.kimiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'moonshot-v1-128k',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Kimi API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  return data.choices[0]?.message.content || '';
}

/**
 * Generate maintenance schedule for vehicle
 */
export async function generateMaintenanceSchedule(
  vehicle: VehicleProfile
): Promise<MaintenanceRecommendation[]> {
  const systemPrompt = `You are an expert automotive maintenance advisor.
Generate a comprehensive maintenance schedule for the specified vehicle.
Provide recommendations in valid JSON format.`;

  const userPrompt = `Generate maintenance schedule for:
${vehicle.brand} ${vehicle.model} (${vehicle.year})
Fuel Type: ${vehicle.fuelType}
Transmission: ${vehicle.transmissionType}
Drive Type: ${vehicle.driveType}
Current Mileage: ${vehicle.mileage.toLocaleString()} km

Provide 10-15 maintenance items in JSON format:
{
  "recommendations": [
    {
      "service": "Oil Change",
      "dueAt": {"mileage": 10000, "months": 6},
      "priority": "critical",
      "estimatedCost": {"min": 50, "max": 150, "currency": "USD"},
      "description": "Regular oil and filter change",
      "partsNeeded": ["Oil Filter", "Engine Oil"],
      "estimatedTime": 0.5
    }
  ]
}`;

  try {
    const response = await callKimi(systemPrompt, userPrompt, {
      temperature: 0.5,
      maxTokens: 3000,
      jsonMode: true,
    });

    return parseMaintenanceRecommendations(response);
  } catch (error) {
    console.error('Error generating maintenance schedule:', error);
    return getDefaultMaintenanceSchedule(vehicle);
  }
}

/**
 * Parse maintenance recommendations from AI response
 */
function parseMaintenanceRecommendations(response: string): MaintenanceRecommendation[] {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return parsed.recommendations.map((r: any) => ({
      service: r.service || 'Unknown Service',
      dueAt: {
        mileage: r.dueAt?.mileage || 10000,
        months: r.dueAt?.months || 6,
      },
      priority: r.priority || 'medium',
      estimatedCost: {
        min: r.estimatedCost?.min || 0,
        max: r.estimatedCost?.max || 0,
        currency: r.estimatedCost?.currency || 'USD',
      },
      description: r.description || '',
      partsNeeded: Array.isArray(r.partsNeeded) ? r.partsNeeded : [],
      estimatedTime: r.estimatedTime || 1,
    }));
  } catch (error) {
    console.error('Error parsing maintenance recommendations:', error);
    return [];
  }
}

/**
 * Get default maintenance schedule (fallback)
 */
function getDefaultMaintenanceSchedule(vehicle: VehicleProfile): MaintenanceRecommendation[] {
  return [
    {
      service: 'Oil Change',
      dueAt: { mileage: 10000, months: 6 },
      priority: 'critical',
      estimatedCost: { min: 50, max: 150, currency: 'USD' },
      description: 'Regular oil and filter change',
      partsNeeded: ['Oil Filter', 'Engine Oil'],
      estimatedTime: 0.5,
    },
    {
      service: 'Air Filter Replacement',
      dueAt: { mileage: 20000, months: 12 },
      priority: 'high',
      estimatedCost: { min: 30, max: 80, currency: 'USD' },
      description: 'Engine air filter replacement',
      partsNeeded: ['Air Filter'],
      estimatedTime: 0.25,
    },
    {
      service: 'Tire Rotation',
      dueAt: { mileage: 10000, months: 6 },
      priority: 'high',
      estimatedCost: { min: 50, max: 100, currency: 'USD' },
      description: 'Rotate tires for even wear',
      partsNeeded: [],
      estimatedTime: 1,
    },
    {
      service: 'Brake Inspection',
      dueAt: { mileage: 20000, months: 12 },
      priority: 'critical',
      estimatedCost: { min: 100, max: 300, currency: 'USD' },
      description: 'Check brake pads and rotors',
      partsNeeded: [],
      estimatedTime: 1,
    },
    {
      service: 'Coolant Flush',
      dueAt: { mileage: 40000, months: 24 },
      priority: 'medium',
      estimatedCost: { min: 100, max: 200, currency: 'USD' },
      description: 'Replace engine coolant',
      partsNeeded: ['Coolant'],
      estimatedTime: 1.5,
    },
  ];
}

/**
 * Calculate next maintenance due date
 */
export function calculateNextMaintenanceDue(
  currentMileage: number,
  lastServiceMileage: number,
  intervalMileage: number
): { mileage: number; isOverdue: boolean } {
  const nextDue = lastServiceMileage + intervalMileage;
  const isOverdue = currentMileage > nextDue;

  return {
    mileage: nextDue,
    isOverdue,
  };
}

/**
 * Get maintenance recommendations based on mileage
 */
export function getMaintenanceByMileage(
  currentMileage: number,
  allRecommendations: MaintenanceRecommendation[]
): MaintenanceRecommendation[] {
  return allRecommendations.filter(r => {
    const mileageDue = r.dueAt.mileage;
    const isOverdue = currentMileage >= mileageDue;
    return isOverdue;
  });
}

/**
 * Cache for maintenance schedules
 */
const maintenanceCache = new Map<string, MaintenanceRecommendation[]>();

export async function getCachedMaintenanceSchedule(
  vehicle: VehicleProfile,
  ttl: number = 86400000
): Promise<MaintenanceRecommendation[]> {
  const cacheKey = `${vehicle.brand}-${vehicle.model}-${vehicle.year}`;

  if (maintenanceCache.has(cacheKey)) {
    return maintenanceCache.get(cacheKey)!;
  }

  const schedule = await generateMaintenanceSchedule(vehicle);

  maintenanceCache.set(cacheKey, schedule);
  setTimeout(() => maintenanceCache.delete(cacheKey), ttl);

  return schedule;
}
