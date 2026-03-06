import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // TEMPORARY: Enable testing mode to bypass authentication
  const isTestingModeEnabled = true;
  const testUser: User | null = isTestingModeEnabled ? {
    id: 999,
    openId: "test-user",
    name: "Test User",
    email: "test@example.com",
    loginMethod: "test",
    role: "user",
    hourly_rate: "50.00",
    currency: "USD",
    rate_updated_at: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  } : null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    // TEMPORARY: Use test user if testing is enabled
    user = testUser;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
