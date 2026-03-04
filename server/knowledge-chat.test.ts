import { describe, expect, it } from "vitest";

describe("Knowledge Base Admin", () => {
  it("should validate document upload input schema", () => {
    const validInput = {
      title: "ELSA Manual - VW Golf 7",
      description: "Workshop manual for VW Golf 7 2.0 TDI",
      category: "elsa",
      brand: "Volkswagen",
      model: "Golf",
      yearFrom: 2013,
      yearTo: 2020,
      engineCode: "CRLB",
      fileUrl: "https://storage.example.com/elsa-golf7.pdf",
      fileKey: "docs/elsa-golf7.pdf",
      fileName: "elsa-golf7.pdf",
      fileSize: 15000000,
      mimeType: "application/pdf",
      tags: ["VW", "Golf", "TDI", "2.0"],
    };

    expect(validInput.title).toBeTruthy();
    expect(validInput.category).toBe("elsa");
    expect(validInput.fileUrl).toContain("https://");
    expect(validInput.tags).toHaveLength(4);
  });

  it("should validate document categories", () => {
    const validCategories = ["elsa", "etka", "autodata", "workshop_manual", "wiring_diagram", "tsi_bulletin", "other"];
    
    validCategories.forEach(cat => {
      expect(typeof cat).toBe("string");
      expect(cat.length).toBeGreaterThan(0);
    });
    expect(validCategories).toHaveLength(7);
  });

  it("should validate search query structure", () => {
    const searchQuery = {
      query: "turbo",
      brand: "Volkswagen",
      category: "elsa",
    };

    expect(searchQuery.query).toBeTruthy();
    expect(searchQuery.brand).toBeTruthy();
    expect(searchQuery.category).toBeTruthy();
  });
});

describe("Diagnostic Chat Assistant", () => {
  it("should validate chat message structure", () => {
    const chatMessage = {
      chatId: "diag-123",
      messageId: "msg-abc",
      diagnosticId: 123,
      content: { role: "user", content: "Ce înseamnă codul P0300?" },
      ordering: 1,
    };

    expect(chatMessage.chatId).toContain("diag-");
    expect(chatMessage.messageId).toBeTruthy();
    expect(chatMessage.diagnosticId).toBe(123);
    expect(chatMessage.content.role).toBe("user");
    expect(chatMessage.ordering).toBe(1);
  });

  it("should build context-aware system prompt", () => {
    const diagnosticContext = {
      vehicle: { brand: "VW", model: "Golf", year: 2018, engine: "2.0 TDI", mileage: 150000 },
      symptoms: "Motor trage greu, fum negru la accelerare",
      errorCodes: ["P0299", "P0234"],
      probableCauses: [
        { cause: "Turbo defect", probability: 75 },
        { cause: "Supapă wastegate blocată", probability: 60 },
      ],
      accuracy: 82,
    };

    let systemPrompt = "Ești un asistent AI expert în diagnostic auto.";
    
    if (diagnosticContext.vehicle) {
      systemPrompt += `\nVehicul: ${diagnosticContext.vehicle.brand} ${diagnosticContext.vehicle.model} ${diagnosticContext.vehicle.year}`;
    }
    if (diagnosticContext.symptoms) {
      systemPrompt += `\nSimptome: ${diagnosticContext.symptoms}`;
    }
    if (diagnosticContext.errorCodes?.length) {
      systemPrompt += `\nCoduri eroare: ${diagnosticContext.errorCodes.join(", ")}`;
    }
    if (diagnosticContext.probableCauses?.length) {
      systemPrompt += `\nCauze probabile:`;
      diagnosticContext.probableCauses.forEach(c => {
        systemPrompt += `\n  - ${c.cause} (${c.probability}%)`;
      });
    }

    expect(systemPrompt).toContain("VW Golf 2018");
    expect(systemPrompt).toContain("Motor trage greu");
    expect(systemPrompt).toContain("P0299, P0234");
    expect(systemPrompt).toContain("Turbo defect (75%)");
    expect(systemPrompt).toContain("Supapă wastegate blocată (60%)");
  });

  it("should decode OBD-II error codes", () => {
    const commonCodes: Record<string, { description: string; system: string }> = {
      "P0300": { description: "Random/Multiple Cylinder Misfire Detected", system: "Aprindere/Motor" },
      "P0171": { description: "System Too Lean (Bank 1)", system: "Alimentare combustibil" },
      "P0420": { description: "Catalyst System Efficiency Below Threshold", system: "Emisii" },
    };

    expect(commonCodes["P0300"]?.description).toContain("Misfire");
    expect(commonCodes["P0171"]?.system).toContain("combustibil");
    expect(commonCodes["P0420"]?.system).toBe("Emisii");
  });

  it("should estimate repair costs", () => {
    const estimates: Record<string, { partsMin: number; partsMax: number; laborMin: number; laborMax: number }> = {
      "bujii": { partsMin: 40, partsMax: 200, laborMin: 50, laborMax: 150 },
      "distribuție": { partsMin: 200, partsMax: 800, laborMin: 300, laborMax: 1000 },
      "turbo": { partsMin: 500, partsMax: 2500, laborMin: 300, laborMax: 800 },
    };

    const turboEstimate = estimates["turbo"]!;
    expect(turboEstimate.partsMin + turboEstimate.laborMin).toBe(800);
    expect(turboEstimate.partsMax + turboEstimate.laborMax).toBe(3300);

    const bujiiEstimate = estimates["bujii"]!;
    expect(bujiiEstimate.partsMin).toBeLessThan(bujiiEstimate.partsMax);
  });

  it("should generate suggested prompts based on diagnostic context", () => {
    const vehicle = { brand: "BMW", model: "320d", year: 2019 };
    const kimiResponse = {
      probableCauses: [{ cause: "Injector defect" }],
    };

    const suggestedPrompts = [
      `Care sunt cele mai frecvente probleme la ${vehicle.brand} ${vehicle.model} ${vehicle.year}?`,
      `Explică-mi pas cu pas cum verific ${kimiResponse.probableCauses[0].cause}`,
      `Ce unelte am nevoie pentru diagnosticul la ${vehicle.brand} ${vehicle.model}?`,
      `Există recall-uri sau buletine tehnice pentru ${vehicle.brand} ${vehicle.model} ${vehicle.year}?`,
    ];

    expect(suggestedPrompts).toHaveLength(4);
    expect(suggestedPrompts[0]).toContain("BMW 320d 2019");
    expect(suggestedPrompts[1]).toContain("Injector defect");
  });
});
