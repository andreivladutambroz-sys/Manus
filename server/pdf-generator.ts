import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel, BorderStyle, WidthType, AlignmentType, VerticalAlign } from "docx";
import { storagePut } from "./storage";

export interface DiagnosticReportData {
  diagnosticId: number;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  vehicleEngine?: string;
  vehicleMileage?: number;
  symptomsText: string;
  symptomsSelected: string[];
  kimiResponse: {
    probableCauses?: Array<{ cause: string; probability: number }>;
    errorCodes?: string[];
    checkOrder?: string[];
    estimatedTime?: string;
    estimatedCost?: string;
    recommendation?: string;
  };
  createdAt: Date;
  mechanicName?: string;
}

export async function generateDiagnosticPDF(data: DiagnosticReportData): Promise<string> {
  const children: any[] = [];

  // Header
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "RAPORT DIAGNOSTIC VEHICUL",
          bold: true,
          size: 56,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  // Vehicle Information
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "INFORMAȚII VEHICUL",
          bold: true,
          size: 28,
        }),
      ],
      spacing: { before: 200, after: 100 },
    })
  );

  const vehicleRows = [
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph("Marcă")],
          shading: { fill: "E8E8E8" },
        }),
        new TableCell({
          children: [new Paragraph(data.vehicleBrand)],
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph("Model")],
          shading: { fill: "E8E8E8" },
        }),
        new TableCell({
          children: [new Paragraph(data.vehicleModel)],
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph("An")],
          shading: { fill: "E8E8E8" },
        }),
        new TableCell({
          children: [new Paragraph(data.vehicleYear.toString())],
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph("Motor")],
          shading: { fill: "E8E8E8" },
        }),
        new TableCell({
          children: [new Paragraph(data.vehicleEngine || "N/A")],
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph("Kilometraj")],
          shading: { fill: "E8E8E8" },
        }),
        new TableCell({
          children: [new Paragraph(data.vehicleMileage ? `${data.vehicleMileage} km` : "N/A")],
        }),
      ],
    }),
  ];

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: vehicleRows,
    })
  );

  // Symptoms
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "SIMPTOME RAPORTATE",
          bold: true,
          size: 28,
        }),
      ],
      spacing: { before: 200, after: 100 },
    })
  );

  children.push(
    new Paragraph({
      text: data.symptomsText,
      spacing: { after: 100 },
    })
  );

  if (data.symptomsSelected && data.symptomsSelected.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Simptome selectate: ${data.symptomsSelected.join(", ")}`,
            italics: true,
          }),
        ],
        spacing: { after: 200 },
      })
    );
  }

  // Diagnostic Results
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "REZULTATE DIAGNOSTIC",
          bold: true,
          size: 28,
        }),
      ],
      spacing: { before: 200, after: 100 },
    })
  );

  // Probable Causes
  if (data.kimiResponse.probableCauses && data.kimiResponse.probableCauses.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Cauze Probabile:",
            bold: true,
          }),
        ],
        spacing: { before: 100, after: 50 },
      })
    );

    data.kimiResponse.probableCauses.forEach((cause, idx) => {
      children.push(
        new Paragraph({
          text: `${idx + 1}. ${cause.cause} - ${cause.probability}%`,
          spacing: { after: 50 },
          indent: { left: 400 },
        })
      );
    });
  }

  // Error Codes
  if (data.kimiResponse.errorCodes && data.kimiResponse.errorCodes.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Coduri Eroare OBD:",
            bold: true,
          }),
        ],
        spacing: { before: 100, after: 50 },
      })
    );

    data.kimiResponse.errorCodes.forEach((code) => {
      children.push(
        new Paragraph({
          text: code,
          spacing: { after: 30 },
          indent: { left: 400 },
        })
      );
    });
  }

  // Check Order
  if (data.kimiResponse.checkOrder && data.kimiResponse.checkOrder.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Ordine Verificare:",
            bold: true,
          }),
        ],
        spacing: { before: 100, after: 50 },
      })
    );

    data.kimiResponse.checkOrder.forEach((step, idx) => {
      children.push(
        new Paragraph({
          text: `${idx + 1}. ${step}`,
          spacing: { after: 50 },
          indent: { left: 400 },
        })
      );
    });
  }

  // Estimates
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "ESTIMĂRI",
          bold: true,
          size: 28,
        }),
      ],
      spacing: { before: 200, after: 100 },
    })
  );

  children.push(
    new Paragraph({
      text: `Timp estimat: ${data.kimiResponse.estimatedTime || "N/A"}`,
      spacing: { after: 50 },
    })
  );

  children.push(
    new Paragraph({
      text: `Cost estimat: ${data.kimiResponse.estimatedCost || "N/A"}`,
      spacing: { after: 200 },
    })
  );

  // Recommendation
  if (data.kimiResponse.recommendation) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "RECOMANDARE FINALĂ",
            bold: true,
            size: 28,
          }),
        ],
        spacing: { before: 200, after: 100 },
      })
    );

    children.push(
      new Paragraph({
        text: data.kimiResponse.recommendation,
        spacing: { after: 200 },
      })
    );
  }

  // Footer
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Raport generat: ${data.createdAt.toLocaleDateString("ro-RO")} ${data.createdAt.toLocaleTimeString("ro-RO")}`,
          italics: true,
          size: 18,
        }),
      ],
      spacing: { before: 200 },
      alignment: AlignmentType.CENTER,
    })
  );

  if (data.mechanicName) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Mecanic: ${data.mechanicName}`,
            italics: true,
            size: 18,
          }),
        ],
        alignment: AlignmentType.CENTER,
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const fileName = `diagnostic-${data.diagnosticId}-${Date.now()}.docx`;
  const { url } = await storagePut(fileName, buffer, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

  return url;
}
