import { ENV } from '../_core/env';
import { storagePut } from '../storage';

/**
 * Automated Report Generation Service
 * Generates professional PDF reports with custom templates
 */

export interface ReportTemplate {
  id: string;
  name: string;
  brand?: string;
  language: 'ro' | 'en' | 'fr' | 'de' | 'it';
  sections: string[];
  includeLogos: boolean;
  customColors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export interface DiagnosticReport {
  diagnosticId: string;
  vehicleInfo: {
    brand: string;
    model: string;
    year: number;
    mileage: number;
    vin?: string;
    licensePlate?: string;
  };
  symptoms: string[];
  errorCodes: string[];
  findings: {
    cause: string;
    confidence: number;
    description: string;
  }[];
  recommendations: string[];
  estimatedCost: {
    min: number;
    max: number;
    currency: string;
  };
  repairProcedure: string[];
  partsNeeded: Array<{
    name: string;
    oemCode: string;
    price: number;
  }>;
  generatedAt: Date;
  mechanicName: string;
  workshopName: string;
}

/**
 * Call Kimi API to generate report content
 */
async function callKimi(
  systemPrompt: string,
  userPrompt: string,
  options: { temperature?: number; maxTokens?: number; jsonMode?: boolean } = {}
): Promise<string> {
  const { temperature = 0.3, maxTokens = 2000, jsonMode = false } = options;

  const response = await fetch('https://api.moonshot.ai/v1/chat/completions', {
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
 * Generate professional diagnostic report
 */
export async function generateDiagnosticReport(
  report: DiagnosticReport,
  template: ReportTemplate
): Promise<string> {
  const systemPrompt = `You are a professional automotive report writer.
Generate a comprehensive diagnostic report in Markdown format.
The report should be professional, detailed, and easy to understand.`;

  const userPrompt = `Generate a diagnostic report for:

VEHICLE: ${report.vehicleInfo.brand} ${report.vehicleInfo.model} (${report.vehicleInfo.year})
MILEAGE: ${report.vehicleInfo.mileage.toLocaleString()} km
MECHANIC: ${report.mechanicName}
WORKSHOP: ${report.workshopName}

SYMPTOMS: ${report.symptoms.join(', ')}
ERROR CODES: ${report.errorCodes.join(', ')}

FINDINGS:
${report.findings.map(f => `- ${f.cause} (${f.confidence}% confidence): ${f.description}`).join('\n')}

RECOMMENDATIONS: ${report.recommendations.join(', ')}

ESTIMATED COST: ${report.estimatedCost.min}-${report.estimatedCost.max} ${report.estimatedCost.currency}

REPAIR PROCEDURE:
${report.repairProcedure.map((step, i) => `${i + 1}. ${step}`).join('\n')}

PARTS NEEDED:
${report.partsNeeded.map(p => `- ${p.name} (OEM: ${p.oemCode}) - ${p.price}`).join('\n')}

Generate a professional report in Markdown format with sections for:
1. Executive Summary
2. Vehicle Information
3. Diagnostic Findings
4. Recommended Repairs
5. Parts List
6. Estimated Costs
7. Repair Timeline`;

  try {
    const content = await callKimi(systemPrompt, userPrompt, {
      temperature: 0.5,
      maxTokens: 3000,
    });

    return content;
  } catch (error) {
    console.error('Error generating report:', error);
    return generateDefaultReport(report);
  }
}

/**
 * Generate default report (fallback)
 */
function generateDefaultReport(report: DiagnosticReport): string {
  return `# Diagnostic Report

## Executive Summary
Diagnostic performed on ${report.generatedAt.toLocaleDateString()} for ${report.vehicleInfo.brand} ${report.vehicleInfo.model}.

## Vehicle Information
- **Brand:** ${report.vehicleInfo.brand}
- **Model:** ${report.vehicleInfo.model}
- **Year:** ${report.vehicleInfo.year}
- **Mileage:** ${report.vehicleInfo.mileage.toLocaleString()} km
- **VIN:** ${report.vehicleInfo.vin || 'N/A'}
- **License Plate:** ${report.vehicleInfo.licensePlate || 'N/A'}

## Symptoms
${report.symptoms.map(s => `- ${s}`).join('\n')}

## Error Codes
${report.errorCodes.map(c => `- ${c}`).join('\n')}

## Findings
${report.findings.map(f => `- **${f.cause}** (${f.confidence}% confidence)\n  ${f.description}`).join('\n\n')}

## Recommendations
${report.recommendations.map(r => `- ${r}`).join('\n')}

## Repair Procedure
${report.repairProcedure.map((step, i) => `${i + 1}. ${step}`).join('\n')}

## Parts Needed
${report.partsNeeded.map(p => `- ${p.name} (OEM: ${p.oemCode}) - $${p.price}`).join('\n')}

## Estimated Costs
- **Labor:** $${report.estimatedCost.min}
- **Parts:** $${report.estimatedCost.max}
- **Total:** $${report.estimatedCost.min + report.estimatedCost.max}

---
**Generated by:** ${report.mechanicName}
**Workshop:** ${report.workshopName}
**Date:** ${report.generatedAt.toLocaleDateString()}`;
}

/**
 * Convert Markdown report to HTML
 */
export function convertMarkdownToHTML(markdown: string): string {
  let html = markdown
    .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
    .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
    .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n- (.*?)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)/, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.+)$/gm, (match) => {
      if (!match.match(/^<[h|u|l|p]/)) {
        return `<p>${match}</p>`;
      }
      return match;
    });

  return html;
}

/**
 * Generate report and upload to S3
 */
export async function generateAndUploadReport(
  report: DiagnosticReport,
  template: ReportTemplate
): Promise<{ url: string; key: string }> {
  const markdownContent = await generateDiagnosticReport(report, template);
  const htmlContent = convertMarkdownToHTML(markdownContent);

  const fileName = `diagnostic-report-${report.diagnosticId}-${Date.now()}.html`;

  const { url, key } = await storagePut(
    `reports/${report.diagnosticId}/${fileName}`,
    htmlContent,
    'text/html'
  );

  return { url, key };
}

/**
 * Schedule report generation for later
 */
export async function scheduleReportGeneration(
  report: DiagnosticReport,
  template: ReportTemplate,
  delayMinutes: number = 0
): Promise<void> {
  if (delayMinutes > 0) {
    setTimeout(async () => {
      try {
        await generateAndUploadReport(report, template);
        console.log(`Report generated for diagnostic ${report.diagnosticId}`);
      } catch (error) {
        console.error('Error generating scheduled report:', error);
      }
    }, delayMinutes * 60 * 1000);
  } else {
    await generateAndUploadReport(report, template);
  }
}

/**
 * Get available report templates
 */
export const REPORT_TEMPLATES: Record<string, ReportTemplate> = {
  default_ro: {
    id: 'default_ro',
    name: 'Default Romanian',
    language: 'ro',
    sections: ['summary', 'vehicle', 'findings', 'recommendations', 'costs'],
    includeLogos: true,
  },
  default_en: {
    id: 'default_en',
    name: 'Default English',
    language: 'en',
    sections: ['summary', 'vehicle', 'findings', 'recommendations', 'costs'],
    includeLogos: true,
  },
  professional_ro: {
    id: 'professional_ro',
    name: 'Professional Romanian',
    language: 'ro',
    sections: ['summary', 'vehicle', 'findings', 'procedure', 'parts', 'costs', 'warranty'],
    includeLogos: true,
    customColors: {
      primary: '#1e40af',
      secondary: '#0f172a',
      accent: '#f97316',
    },
  },
};
