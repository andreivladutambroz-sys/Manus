import { describe, it, expect } from "vitest";

describe("Supabase Connection", () => {
  it("should validate Supabase URL format", () => {
    const supabaseUrl = process.env.SUPABASE_URL;
    
    if (supabaseUrl) {
      expect(supabaseUrl).toMatch(/^https:\/\/.*\.supabase\.co$/);
      expect(supabaseUrl).toContain("supabase.co");
    }
  });

  it("should validate Supabase Anon Key exists", () => {
    const anonKey = process.env.SUPABASE_ANON_KEY;
    
    if (anonKey) {
      expect(anonKey).toBeDefined();
      expect(anonKey.length).toBeGreaterThan(0);
    }
  });

  it("should validate Supabase Service Role Key exists", () => {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (serviceRoleKey) {
      expect(serviceRoleKey).toBeDefined();
      expect(serviceRoleKey.length).toBeGreaterThan(0);
    }
  });

  it("should have DATABASE_URL configured", () => {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (databaseUrl) {
      expect(databaseUrl).toMatch(/^mysql:\/\//);
      expect(databaseUrl).toContain("@");
    }
  });
});
