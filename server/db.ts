import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, profiles, vehicles, diagnostics, diagnosticImages, notifications, knowledgeBase } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getOrCreateProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  let profile = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  if (profile.length === 0) {
    await db.insert(profiles).values({ userId });
    profile = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  }
  return profile[0];
}

export async function getUserVehicles(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vehicles).where(eq(vehicles.userId, userId));
}

export async function getUserDiagnostics(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(diagnostics).where(eq(diagnostics.userId, userId));
}

export async function getVehicleById(vehicleId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(vehicles).where(eq(vehicles.id, vehicleId)).limit(1);
  return result[0];
}

export async function getDiagnosticById(diagnosticId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(diagnostics).where(eq(diagnostics.id, diagnosticId)).limit(1);
  return result[0];
}

export async function getDiagnosticImages(diagnosticId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(diagnosticImages).where(eq(diagnosticImages.diagnosticId, diagnosticId));
}

export async function addDiagnosticImage(diagnosticId: number, imageUrl: string, description?: string) {
  const db = await getDb();
  if (!db) return undefined;
  return db.insert(diagnosticImages).values({ diagnosticId, imageUrl, description });
}

export async function getUserNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
}

export async function createNotification(userId: number, type: "analysis_complete" | "diagnostic_saved" | "system_alert", title: string, message?: string, diagnosticId?: number) {
  const db = await getDb();
  if (!db) return undefined;
  return db.insert(notifications).values({ userId, type, title, message, diagnosticId });
}

export async function markNotificationAsRead(notificationId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return db.update(notifications).set({ isRead: true }).where(eq(notifications.id, notificationId));
}

export async function searchKnowledgeBase(query: string, brand?: string) {
  const db = await getDb();
  if (!db) return [];
  if (brand) {
    return db.select().from(knowledgeBase).where(eq(knowledgeBase.brand, brand));
  }
  return db.select().from(knowledgeBase);
}
