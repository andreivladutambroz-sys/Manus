import type { FavoriteCase } from '@/hooks/useFavorites';

export interface SharePayload {
  make: string;
  model: string;
  year?: number;
  engine?: string;
  code: string;
  conf: number;
  symp: string[];
  steps?: string;
  tools?: string[];
  time?: number;
  cost?: number;
  status?: string;
  notes?: string;
}

export function createSharePayload(caseData: FavoriteCase): SharePayload {
  return {
    make: caseData.vehicleMake,
    model: caseData.vehicleModel,
    year: caseData.year,
    engine: caseData.engine,
    code: caseData.errorCode,
    conf: parseFloat(caseData.confidence),
    symp: caseData.symptoms || [],
    steps: caseData.repairAction,
    tools: caseData.toolsUsed,
    time: caseData.repairTimeHours,
    cost: caseData.repairCostEstimate,
    status: caseData.status,
    notes: caseData.notes,
  };
}

export function generateShareSummary(caseData: FavoriteCase): string {
  const lines = [
    `${caseData.vehicleMake} ${caseData.vehicleModel} (${caseData.year || 'N/A'})`,
    `Error: ${caseData.errorCode}`,
    `Confidence: ${(parseFloat(caseData.confidence) * 100).toFixed(0)}%`,
    `Status: ${caseData.status || 'Pending'}`,
  ];

  if (caseData.symptoms && caseData.symptoms.length > 0) {
    lines.push(`Symptoms: ${caseData.symptoms.join(', ')}`);
  }

  if (caseData.repairAction) {
    lines.push(`Repair: ${caseData.repairAction}`);
  }

  if (caseData.toolsUsed && caseData.toolsUsed.length > 0) {
    lines.push(`Tools: ${caseData.toolsUsed.join(', ')}`);
  }

  if (caseData.repairTimeHours) {
    lines.push(`Time: ${caseData.repairTimeHours}h`);
  }

  if (caseData.repairCostEstimate) {
    lines.push(`Cost: $${caseData.repairCostEstimate}`);
  }

  if (caseData.notes) {
    lines.push(`Notes: ${caseData.notes}`);
  }

  return lines.join('\n');
}

export function encodePayloadForQR(payload: SharePayload): string {
  return JSON.stringify(payload);
}

export function copyToClipboard(text: string): Promise<boolean> {
  return navigator.clipboard
    .writeText(text)
    .then(() => true)
    .catch(() => false);
}
