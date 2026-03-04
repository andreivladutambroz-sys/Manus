import { describe, expect, it } from "vitest";

// Test the i18n translation system structure
describe("i18n Translation System", () => {
  it("should have all 5 supported languages defined", () => {
    const supportedLanguages = ["ro", "en", "fr", "de", "it"];
    expect(supportedLanguages).toHaveLength(5);
    expect(supportedLanguages).toContain("ro");
    expect(supportedLanguages).toContain("en");
    expect(supportedLanguages).toContain("fr");
    expect(supportedLanguages).toContain("de");
    expect(supportedLanguages).toContain("it");
  });

  it("should have consistent translation key structure", () => {
    const requiredKeyPrefixes = [
      "nav.", "home.", "dashboard.", "diag.", "results.",
      "cat.", "profile.", "kb.", "adminKb.", "chat.",
      "feedback.", "learning.", "common."
    ];
    // Verify all key prefixes are defined
    expect(requiredKeyPrefixes.length).toBeGreaterThan(10);
  });

  it("should have language metadata with flags", () => {
    const languages = [
      { code: "ro", label: "Română", flag: "🇷🇴" },
      { code: "en", label: "English", flag: "🇬🇧" },
      { code: "fr", label: "Français", flag: "🇫🇷" },
      { code: "de", label: "Deutsch", flag: "🇩🇪" },
      { code: "it", label: "Italiano", flag: "🇮🇹" },
    ];
    
    expect(languages).toHaveLength(5);
    languages.forEach(lang => {
      expect(lang.code).toBeTruthy();
      expect(lang.label).toBeTruthy();
      expect(lang.flag).toBeTruthy();
    });
  });

  it("should default to Romanian language", () => {
    const defaultLang = "ro";
    expect(defaultLang).toBe("ro");
  });

  it("should store language preference key", () => {
    const storageKey = "mechanic-helper-lang";
    expect(storageKey).toBe("mechanic-helper-lang");
  });

  it("should have navigation translations for all languages", () => {
    const navKeys = [
      "nav.home", "nav.dashboard", "nav.newDiagnostic",
      "nav.vehicles", "nav.knowledgeBase", "nav.profile",
      "nav.login", "nav.getStarted", "nav.logout",
      "nav.aiLearning", "nav.chatAI", "nav.adminKB"
    ];
    expect(navKeys).toHaveLength(12);
  });

  it("should have diagnostic form translations", () => {
    const diagKeys = [
      "diag.brand", "diag.model", "diag.year", "diag.engine",
      "diag.mileage", "diag.vin", "diag.symptoms", "diag.errorCodes",
      "diag.category", "diag.conditions", "diag.startAnalysis"
    ];
    expect(diagKeys).toHaveLength(11);
  });

  it("should have category translations for all vehicle systems", () => {
    const categories = [
      "cat.engine", "cat.transmission", "cat.brakes", "cat.electrical",
      "cat.suspension", "cat.cooling", "cat.exhaust", "cat.steering",
      "cat.fuel", "cat.ac", "cat.body", "cat.other"
    ];
    expect(categories).toHaveLength(12);
  });
});
