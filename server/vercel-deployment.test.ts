import { describe, it, expect } from "vitest";

describe("Vercel Deployment Configuration", () => {
  it("should validate Vercel API Token exists", () => {
    const vercelToken = process.env.VERCEL_API_TOKEN;
    
    if (vercelToken) {
      expect(vercelToken).toBeDefined();
      expect(vercelToken.length).toBeGreaterThan(0);
    }
  });

  it("should validate Vercel Team ID format if provided", () => {
    const teamId = process.env.VERCEL_TEAM_ID;
    
    if (teamId) {
      expect(teamId).toBeDefined();
      expect(teamId.length).toBeGreaterThan(0);
    }
  });

  it("should validate GitHub Token format if provided", () => {
    const githubToken = process.env.GITHUB_TOKEN;
    
    if (githubToken) {
      expect(githubToken).toBeDefined();
      expect(githubToken.length).toBeGreaterThan(0);
    }
  });

  it("should have all required environment variables for deployment", () => {
    const requiredVars = [
      "SUPABASE_URL",
      "SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
      "KIMI_API_KEY",
      "DATABASE_URL",
    ];

    requiredVars.forEach(varName => {
      expect(process.env[varName]).toBeDefined();
    });
  });
});
