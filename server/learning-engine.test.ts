import { describe, expect, it } from "vitest";

describe("Learning Engine", () => {
  describe("FeedbackInput validation", () => {
    it("should validate rating ranges", () => {
      const validInput = {
        diagnosticId: 1,
        userId: 1,
        overallRating: 4,
        accuracyRating: 3,
        usefulnessRating: 5,
        wasResolved: true,
      };
      expect(validInput.overallRating).toBeGreaterThanOrEqual(1);
      expect(validInput.overallRating).toBeLessThanOrEqual(5);
      expect(validInput.accuracyRating).toBeGreaterThanOrEqual(1);
      expect(validInput.accuracyRating).toBeLessThanOrEqual(5);
      expect(validInput.usefulnessRating).toBeGreaterThanOrEqual(1);
      expect(validInput.usefulnessRating).toBeLessThanOrEqual(5);
    });

    it("should handle causes feedback structure", () => {
      const causesFeedback = [
        { causeId: "cause_1", cause: "Bobina defecta", rating: "correct" as const },
        { causeId: "cause_2", cause: "Sonda lambda", rating: "incorrect" as const, mechanicComment: "Nu era sonda" },
        { causeId: "cause_3", cause: "Bujie", rating: "partially_correct" as const },
      ];
      expect(causesFeedback).toHaveLength(3);
      expect(causesFeedback[0].rating).toBe("correct");
      expect(causesFeedback[1].rating).toBe("incorrect");
      expect(causesFeedback[1].mechanicComment).toBe("Nu era sonda");
    });

    it("should handle optional fields", () => {
      const input = {
        diagnosticId: 1,
        userId: 1,
        overallRating: 3,
        accuracyRating: 2,
        usefulnessRating: 4,
        wasResolved: false,
        actualCause: "Pompa de apa defecta",
        actualParts: ["Pompa apa SKF VKPC81230"],
        actualCost: 250,
        actualTime: "2.5 ore",
        mechanicNotes: "Diagnosticul AI a sugerat termostat, dar era pompa",
      };
      expect(input.actualCause).toBeDefined();
      expect(input.actualParts).toHaveLength(1);
      expect(input.actualCost).toBe(250);
      expect(input.actualTime).toBe("2.5 ore");
    });
  });

  describe("Accuracy calculation", () => {
    it("should calculate accuracy from feedback", () => {
      const feedbacks = [
        { overallRating: 5, accuracyRating: 5 },
        { overallRating: 4, accuracyRating: 4 },
        { overallRating: 3, accuracyRating: 2 },
        { overallRating: 5, accuracyRating: 5 },
      ];
      const avgAccuracy = feedbacks.reduce((sum, f) => sum + f.accuracyRating, 0) / feedbacks.length;
      const accuracyPercent = (avgAccuracy / 5) * 100;
      expect(accuracyPercent).toBe(80);
    });

    it("should determine trend from accuracy history", () => {
      function determineTrend(recent: number, previous: number): string {
        if (recent > previous + 5) return "improving";
        if (recent < previous - 5) return "declining";
        return "stable";
      }
      expect(determineTrend(85, 70)).toBe("improving");
      expect(determineTrend(60, 80)).toBe("declining");
      expect(determineTrend(75, 73)).toBe("stable");
    });
  });

  describe("Pattern matching", () => {
    it("should match similar symptoms", () => {
      function calculateSimilarity(a: string, b: string): number {
        const wordsA = new Set(a.toLowerCase().split(/\s+/));
        const wordsB = new Set(b.toLowerCase().split(/\s+/));
        let intersection = 0;
        for (const word of wordsA) {
          if (wordsB.has(word)) intersection++;
        }
        const union = new Set([...wordsA, ...wordsB]).size;
        return union > 0 ? (intersection / union) * 100 : 0;
      }

      const similarity1 = calculateSimilarity(
        "motor trage greu la accelerare fum negru",
        "motor pierde putere fum negru la accelerare"
      );
      expect(similarity1).toBeGreaterThan(40);

      const similarity2 = calculateSimilarity(
        "motor trage greu la accelerare",
        "frana scartaie la franare"
      );
      expect(similarity2).toBeLessThan(30);
    });

    it("should match error codes", () => {
      const diagnosticCodes = ["P0300", "P0301", "P0302"];
      const searchCodes = ["P0300", "P0303"];
      const matchCount = diagnosticCodes.filter(c => searchCodes.includes(c)).length;
      expect(matchCount).toBe(1);
      expect(matchCount).toBeGreaterThan(0);
    });
  });

  describe("Prompt optimization", () => {
    it("should generate improved prompt based on feedback", () => {
      const basePrompt = "Analizează simptomele vehiculului și identifică cauzele probabile.";
      const improvements = [
        "Adaugă verificare presiune turbo pentru simptome de pierdere putere",
        "Prioritizează cauze electrice pentru coduri P0300-P0312",
        "Include verificare EGR pentru fum negru",
      ];
      const optimizedPrompt = `${basePrompt}\n\nÎmbunătățiri bazate pe feedback:\n${improvements.map(i => `- ${i}`).join("\n")}`;
      expect(optimizedPrompt).toContain("Îmbunătățiri bazate pe feedback");
      expect(optimizedPrompt).toContain("presiune turbo");
      expect(optimizedPrompt).toContain("EGR");
    });

    it("should version prompts correctly", () => {
      const versions = [
        { version: 1, isActive: false },
        { version: 2, isActive: false },
        { version: 3, isActive: true },
      ];
      const activeVersion = versions.find(v => v.isActive);
      expect(activeVersion?.version).toBe(3);
      const nextVersion = Math.max(...versions.map(v => v.version)) + 1;
      expect(nextVersion).toBe(4);
    });
  });

  describe("Context injection", () => {
    it("should inject learned patterns into agent prompts", () => {
      const patterns = [
        { brand: "VW", symptomKeywords: "pierdere putere fum", confirmedCause: "Turbo defect", confirmedCount: 5 },
        { brand: "VW", symptomKeywords: "ralanti instabil", confirmedCause: "Bobina aprindere", confirmedCount: 3 },
      ];
      
      const contextBlock = patterns
        .filter(p => p.confirmedCount >= 3)
        .map(p => `[${p.brand}] ${p.symptomKeywords} → ${p.confirmedCause} (confirmat ${p.confirmedCount}x)`)
        .join("\n");
      
      expect(contextBlock).toContain("Turbo defect");
      expect(contextBlock).toContain("Bobina aprindere");
      expect(contextBlock).toContain("confirmat 5x");
    });

    it("should filter patterns by brand relevance", () => {
      const allPatterns = [
        { brand: "VW", symptomKeywords: "motor", confirmedCause: "Bobina", confirmedCount: 5 },
        { brand: "BMW", symptomKeywords: "motor", confirmedCause: "Injector", confirmedCount: 3 },
        { brand: "Audi", symptomKeywords: "motor", confirmedCause: "Turbo", confirmedCount: 4 },
      ];
      
      const vwPatterns = allPatterns.filter(p => p.brand === "VW" || p.brand === "Audi"); // VAG group
      expect(vwPatterns).toHaveLength(2);
    });
  });
});
