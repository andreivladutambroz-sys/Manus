import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, profiles, vehicles, diagnostics, diagnosticImages, notifications, knowledgeBase } from "../drizzle/schema";
import { eq } from "drizzle-orm";
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

// Export db proxy for backward compatibility
export const db = {
  query: {
    users: {
      findFirst: async (opts?: any) => {
        const database = await getDb() as any;
        if (!database) return null;
        return (database as any)?.query?.users?.findFirst(opts);
      },
      findMany: async (opts?: any) => {
        const database = await getDb() as any;
        if (!database) return [];
        return (database as any)?.query?.users?.findMany(opts);
      }
    }
  },
  update: (table: any) => ({
    set: (values: any) => ({
      where: (condition: any) => ({
        async execute() {
          const database = await getDb() as any;
          if (!database) return null;
          return database.update(table).set(values).where(condition);
        }
      })
    })
  })
} as any;

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const database = await getDb() as any;
  if (!database) {
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

    // Upsert: insert or update on duplicate key
    await database
      .insert(users)
      .values(values)
      .onDuplicateKeyUpdate({
        set: updateSet,
      });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}


// Additional helper functions
export async function getOrCreateProfile(userId: number) {
  const database = await getDb() as any;
  if (!database) return null;
  const profile = await database?.query?.profiles?.findFirst({ where: (p: any) => p.userId === userId });
  if (profile) return profile;
  // Create default profile
  return { userId, workshopName: null, phone: null, city: null, specializations: [] };
}

export async function getUserVehicles(userId: number) {
  const database = await getDb() as any;
  if (!database) return [];
  return (database as any)?.query?.vehicles?.findMany({ where: (v: any) => v.userId === userId });
}

export async function getUserDiagnostics(userId: number) {
  const database = await getDb() as any;
  if (!database) return [];
  try {
    const result = await database.select().from(diagnostics)
      .leftJoin(vehicles, eq(diagnostics.vehicleId, vehicles.id))
      .where(eq(diagnostics.userId, userId))
      .orderBy(diagnostics.createdAt);
    
    // Transform to include vehicle data
    return result.map((row: any) => ({
      ...row.diagnostics,
      vehicle: row.vehicles || null
    })) || [];
  } catch (error) {
    console.error("[getUserDiagnostics] Error:", error);
    return [];
  }
}

export async function getVehicleById(vehicleId: number) {
  try {
    const connection = await import('mysql2/promise').then(m => m.createConnection(process.env.DATABASE_URL!));
    const [rows] = await connection.query('SELECT * FROM vehicles WHERE id = ?', [vehicleId]);
    await connection.end();
    return (rows as any[])[0] || null;
  } catch (error) {
    console.error('[getVehicleById] Error:', error);
    return null;
  }
}

export async function getDiagnosticById(diagnosticId: number) {
  const database = await getDb() as any;
  if (!database) return null;
  try {
    const result = await database.select().from(diagnostics).where(eq(diagnostics.id, diagnosticId)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[getDiagnosticById] Error:", error);
    return null;
  }
}

export async function getUserNotifications(userId: number) {
  const database = await getDb() as any;
  if (!database) return [];
  return (database as any)?.query?.notifications?.findMany({ where: (n: any) => n.userId === userId });
}

export async function createNotification(userId: number, type: string, title: string, message: string, diagnosticId?: number) {
  const database = await getDb() as any;
  if (!database) return null;
  // Placeholder implementation
  return { id: 1, userId, type, title, message, diagnosticId, read: false, createdAt: new Date() };
}

export async function markNotificationAsRead(notificationId: number) {
  const database = await getDb() as any;
  if (!database) return null;
  // Placeholder implementation
  return { id: notificationId, read: true };
}

export async function getDiagnosticImages(diagnosticId: number) {
  const database = await getDb() as any;
  if (!database) return [];
  return (database as any)?.query?.diagnosticImages?.findMany({ where: (di: any) => di.diagnosticId === diagnosticId });
}

export async function addDiagnosticImage(diagnosticId: number, imageUrl: string, description?: string) {
  const database = await getDb() as any;
  if (!database) return null;
  // Placeholder implementation
  return { id: 1, diagnosticId, imageUrl, description, uploadedAt: new Date() };
}


export async function getUserByOpenId(openId: string) {
  const database = await getDb() as any;
  if (!database) return null;
  return (database as any)?.query?.users?.findFirst({ where: (u: any) => u.openId === openId });
}
