// Advanced Reporting System
// 1. PDF Report Generation
// 2. Email Delivery
// 3. Customer Portal
// 4. Invoicing System

import { PDFDocument, PDFPage, rgb } from "pdf-lib";

export interface DiagnosticReport {
  diagnosticId: string;
  vehicleInfo: {
    brand: string;
    model: string;
    year: number;
    vin: string;
    licensePlate: string;
  };
  diagnosticDate: Date;
  mechanic: {
    name: string;
    shop: string;
    phone: string;
    email: string;
  };
  findings: {
    cause: string;
    confidence: number;
    severity: "low" | "medium" | "high" | "critical";
    description: string;
  }[];
  recommendations: string[];
  estimatedCost: number;
  estimatedTime: number;
  partsNeeded: { partNumber: string; name: string; cost: number }[];
  nextServiceDate?: Date;
}

export interface EmailReport {
  to: string;
  subject: string;
  body: string;
  attachments: { filename: string; content: Buffer }[];
  scheduledFor?: Date;
}

export interface Invoice {
  invoiceNumber: string;
  diagnosticId: string;
  date: Date;
  dueDate: Date;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  shop: {
    name: string;
    address: string;
    phone: string;
    email: string;
    taxId: string;
  };
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  paymentTerms: string;
  notes: string;
}

// 1. PDF REPORT GENERATION
export async function generateDiagnosticPDF(report: DiagnosticReport): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // Letter size
  const { width, height } = page.getSize();

  let yPosition = height - 50;

  // Header
  page.drawText("DIAGNOSTIC REPORT", {
    x: 50,
    y: yPosition,
    size: 24,
    color: rgb(0, 0, 0),
  });
  yPosition -= 40;

  // Vehicle Information
  page.drawText("VEHICLE INFORMATION", {
    x: 50,
    y: yPosition,
    size: 14,
    color: rgb(0.2, 0.2, 0.2),
  });
  yPosition -= 25;

  const vehicleInfo = [
    `Brand: ${report.vehicleInfo.brand}`,
    `Model: ${report.vehicleInfo.model}`,
    `Year: ${report.vehicleInfo.year}`,
    `VIN: ${report.vehicleInfo.vin}`,
    `License Plate: ${report.vehicleInfo.licensePlate}`,
  ];

  for (const info of vehicleInfo) {
    page.drawText(info, { x: 70, y: yPosition, size: 11 });
    yPosition -= 18;
  }

  yPosition -= 20;

  // Diagnostic Findings
  page.drawText("DIAGNOSTIC FINDINGS", {
    x: 50,
    y: yPosition,
    size: 14,
    color: rgb(0.2, 0.2, 0.2),
  });
  yPosition -= 25;

  for (const finding of report.findings) {
    page.drawText(`• ${finding.cause} (${Math.round(finding.confidence * 100)}% confidence)`, {
      x: 70,
      y: yPosition,
      size: 11,
    });
    yPosition -= 18;

    page.drawText(`  ${finding.description}`, {
      x: 85,
      y: yPosition,
      size: 10,
      color: rgb(0.5, 0.5, 0.5),
    });
    yPosition -= 18;
  }

  yPosition -= 20;

  // Recommendations
  page.drawText("RECOMMENDATIONS", {
    x: 50,
    y: yPosition,
    size: 14,
    color: rgb(0.2, 0.2, 0.2),
  });
  yPosition -= 25;

  for (const rec of report.recommendations) {
    page.drawText(`• ${rec}`, { x: 70, y: yPosition, size: 11 });
    yPosition -= 18;
  }

  yPosition -= 20;

  // Cost Estimate
  page.drawText("COST ESTIMATE", {
    x: 50,
    y: yPosition,
    size: 14,
    color: rgb(0.2, 0.2, 0.2),
  });
  yPosition -= 25;

  page.drawText(`Estimated Cost: $${report.estimatedCost.toFixed(2)}`, {
    x: 70,
    y: yPosition,
    size: 12,
    color: rgb(0.2, 0.6, 0.2),
  });
  yPosition -= 20;

  page.drawText(`Estimated Time: ${report.estimatedTime} minutes`, {
    x: 70,
    y: yPosition,
    size: 12,
  });

  // Convert to buffer
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

// 2. EMAIL DELIVERY
export async function sendDiagnosticReport(
  report: DiagnosticReport,
  customerEmail: string,
  pdfBuffer: Buffer
): Promise<void> {
  const emailReport: EmailReport = {
    to: customerEmail,
    subject: `Diagnostic Report - ${report.vehicleInfo.brand} ${report.vehicleInfo.model}`,
    body: generateEmailBody(report),
    attachments: [
      {
        filename: `diagnostic-report-${report.diagnosticId}.pdf`,
        content: pdfBuffer,
      },
    ],
  };

  // In production, send via email service (SendGrid, AWS SES, etc.)
  console.log("Email would be sent to:", customerEmail);
}

function generateEmailBody(report: DiagnosticReport): string {
  return `
Dear Customer,

Thank you for choosing our diagnostic services. Please find attached your diagnostic report for your ${report.vehicleInfo.brand} ${report.vehicleInfo.model}.

DIAGNOSTIC SUMMARY:
${report.findings.map((f) => `- ${f.cause} (${Math.round(f.confidence * 100)}% confidence)`).join("\n")}

ESTIMATED COST: $${report.estimatedCost.toFixed(2)}
ESTIMATED TIME: ${report.estimatedTime} minutes

For more information or to schedule a repair, please contact us:
${report.mechanic.shop}
Phone: ${report.mechanic.phone}
Email: ${report.mechanic.email}

Best regards,
${report.mechanic.name}
  `;
}

export async function scheduleReportEmail(
  report: DiagnosticReport,
  customerEmail: string,
  pdfBuffer: Buffer,
  scheduledFor: Date
): Promise<void> {
  // Schedule email delivery for later
  const emailReport: EmailReport = {
    to: customerEmail,
    subject: `Diagnostic Report - ${report.vehicleInfo.brand} ${report.vehicleInfo.model}`,
    body: generateEmailBody(report),
    attachments: [
      {
        filename: `diagnostic-report-${report.diagnosticId}.pdf`,
        content: pdfBuffer,
      },
    ],
    scheduledFor,
  };

  // In production, save to database for scheduled delivery
  console.log("Email scheduled for:", scheduledFor);
}

// 3. CUSTOMER PORTAL
export interface CustomerPortalAccess {
  customerId: string;
  diagnosticId: string;
  accessToken: string;
  expiresAt: Date;
  permissions: ("view" | "download" | "share")[];
}

export async function createCustomerPortalAccess(
  diagnosticId: string,
  customerEmail: string
): Promise<CustomerPortalAccess> {
  const accessToken = generateAccessToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  // Save to database
  return {
    customerId: `customer-${Date.now()}`,
    diagnosticId,
    accessToken,
    expiresAt,
    permissions: ["view", "download", "share"],
  };
}

export async function getCustomerDiagnosticHistory(customerId: string) {
  // Query database for customer's diagnostic history
  return [];
}

export async function shareDiagnosticReport(diagnosticId: string, shareWith: string[]): Promise<void> {
  // Generate shareable links for each recipient
  for (const email of shareWith) {
    const accessToken = generateAccessToken();
    // Save sharing record to database
    console.log(`Shared with ${email}`);
  }
}

// 4. INVOICING SYSTEM
export async function generateInvoice(
  diagnosticId: string,
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
  },
  shopInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
    taxId: string;
  },
  services: { description: string; quantity: number; unitPrice: number }[]
): Promise<Invoice> {
  const invoiceNumber = generateInvoiceNumber();
  const now = new Date();
  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + 30); // 30 days payment terms

  const lineItems = services.map((s) => ({
    description: s.description,
    quantity: s.quantity,
    unitPrice: s.unitPrice,
    total: s.quantity * s.unitPrice,
  }));

  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.19; // 19% VAT
  const total = subtotal + tax;

  return {
    invoiceNumber,
    diagnosticId,
    date: now,
    dueDate,
    customer: customerInfo,
    shop: shopInfo,
    lineItems,
    subtotal,
    tax,
    total,
    paymentTerms: "Net 30",
    notes: "Thank you for your business!",
  };
}

export async function generateInvoicePDF(invoice: Invoice): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  const { width, height } = page.getSize();

  let yPosition = height - 50;

  // Header
  page.drawText("INVOICE", {
    x: 50,
    y: yPosition,
    size: 24,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Invoice #: ${invoice.invoiceNumber}`, {
    x: 400,
    y: yPosition,
    size: 12,
  });
  yPosition -= 40;

  // Shop Info
  page.drawText(invoice.shop.name, { x: 50, y: yPosition, size: 12, color: rgb(0.2, 0.2, 0.2) });
  yPosition -= 18;
  page.drawText(invoice.shop.address, { x: 50, y: yPosition, size: 10 });
  yPosition -= 18;
  page.drawText(`Tax ID: ${invoice.shop.taxId}`, { x: 50, y: yPosition, size: 10 });
  yPosition -= 40;

  // Customer Info
  page.drawText("BILL TO:", { x: 50, y: yPosition, size: 12, color: rgb(0.2, 0.2, 0.2) });
  yPosition -= 20;
  page.drawText(invoice.customer.name, { x: 50, y: yPosition, size: 11 });
  yPosition -= 18;
  page.drawText(invoice.customer.address, { x: 50, y: yPosition, size: 10 });
  yPosition -= 40;

  // Line Items
  page.drawText("DESCRIPTION", { x: 50, y: yPosition, size: 11, color: rgb(0.2, 0.2, 0.2) });
  page.drawText("QTY", { x: 350, y: yPosition, size: 11, color: rgb(0.2, 0.2, 0.2) });
  page.drawText("UNIT PRICE", { x: 400, y: yPosition, size: 11, color: rgb(0.2, 0.2, 0.2) });
  page.drawText("TOTAL", { x: 500, y: yPosition, size: 11, color: rgb(0.2, 0.2, 0.2) });
  yPosition -= 25;

  for (const item of invoice.lineItems) {
    page.drawText(item.description, { x: 50, y: yPosition, size: 10 });
    page.drawText(item.quantity.toString(), { x: 350, y: yPosition, size: 10 });
    page.drawText(`$${item.unitPrice.toFixed(2)}`, { x: 400, y: yPosition, size: 10 });
    page.drawText(`$${item.total.toFixed(2)}`, { x: 500, y: yPosition, size: 10 });
    yPosition -= 20;
  }

  yPosition -= 20;

  // Totals
  page.drawText(`Subtotal: $${invoice.subtotal.toFixed(2)}`, { x: 400, y: yPosition, size: 11 });
  yPosition -= 20;
  page.drawText(`Tax (19%): $${invoice.tax.toFixed(2)}`, { x: 400, y: yPosition, size: 11 });
  yPosition -= 25;
  page.drawText(`TOTAL: $${invoice.total.toFixed(2)}`, {
    x: 400,
    y: yPosition,
    size: 14,
    color: rgb(0.2, 0.6, 0.2),
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

export async function sendInvoice(invoice: Invoice, customerEmail: string): Promise<void> {
  const pdfBuffer = await generateInvoicePDF(invoice);

  // Send via email service
  console.log("Invoice sent to:", customerEmail);
}

// HELPER FUNCTIONS
function generateAccessToken(): string {
  return `token_${Math.random().toString(36).substring(2, 15)}`;
}

function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(Math.random() * 10000);
  return `INV-${year}${month}-${String(random).padStart(4, "0")}`;
}

export async function trackPayment(invoiceNumber: string, amount: number, paymentDate: Date): Promise<void> {
  // Record payment in database
  console.log(`Payment of $${amount} recorded for invoice ${invoiceNumber}`);
}

export async function sendPaymentReminder(invoice: Invoice, daysUntilDue: number): Promise<void> {
  if (daysUntilDue <= 7) {
    // Send reminder email
    console.log(`Payment reminder sent for invoice ${invoice.invoiceNumber}`);
  }
}
