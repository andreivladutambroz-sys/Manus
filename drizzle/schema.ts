import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, decimal } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Mechanic profiles - extended user information for mechanics
 */
export const profiles = mysqlTable("profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  workshopName: text("workshopName"),
  phone: varchar("phone", { length: 20 }),
  city: varchar("city", { length: 100 }),
  specializations: json("specializations").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;

/**
 * Vehicles - vehicles diagnosed by mechanics
 */
export const vehicles = mysqlTable("vehicles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  brand: varchar("brand", { length: 50 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  year: int("year").notNull(),
  engine: varchar("engine", { length: 100 }),
  engineCode: varchar("engineCode", { length: 20 }),
  mileage: int("mileage"),
  vin: varchar("vin", { length: 50 }),
  licensePlate: varchar("licensePlate", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = typeof vehicles.$inferInsert;

/**
 * Diagnostics - diagnostic records for vehicles
 */
export const diagnostics = mysqlTable("diagnostics", {
  id: int("id").autoincrement().primaryKey(),
  vehicleId: int("vehicleId").notNull().references(() => vehicles.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  symptomsText: text("symptomsText"),
  symptomsSelected: json("symptomsSelected").$type<string[]>(),
  kimiResponse: json("kimiResponse").$type<Record<string, unknown>>(),
  status: mysqlEnum("status", ["in_progress", "completed", "saved"]).default("in_progress").notNull(),
  pdfUrl: varchar("pdfUrl", { length: 500 }),
  imageUrls: json("imageUrls").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Diagnostic = typeof diagnostics.$inferSelect;
export type InsertDiagnostic = typeof diagnostics.$inferInsert;

/**
 * Knowledge base - common VAG vehicle problems and solutions
 */
export const knowledgeBase = mysqlTable("knowledgeBase", {
  id: int("id").autoincrement().primaryKey(),
  brand: varchar("brand", { length: 50 }).notNull(),
  engine: varchar("engine", { length: 100 }),
  errorCode: varchar("errorCode", { length: 20 }),
  problem: text("problem").notNull(),
  probableCause: text("probableCause"),
  solution: text("solution"),
  repairTime: varchar("repairTime", { length: 50 }),
  frequency: varchar("frequency", { length: 20 }),
  estimatedCost: decimal("estimatedCost", { precision: 10, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type KnowledgeBase = typeof knowledgeBase.$inferSelect;
export type InsertKnowledgeBase = typeof knowledgeBase.$inferInsert;

/**
 * Relations
 */
export const usersRelations = relations(users, ({ one, many }) => (
  {
    profile: one(profiles, {
      fields: [users.id],
      references: [profiles.userId],
    }),
    vehicles: many(vehicles),
    diagnostics: many(diagnostics),
  }
));

export const profilesRelations = relations(profiles, ({ one }) => (
  {
    user: one(users, {
      fields: [profiles.userId],
      references: [users.id],
    }),
  }
));

export const vehiclesRelations = relations(vehicles, ({ one, many }) => (
  {
    user: one(users, {
      fields: [vehicles.userId],
      references: [users.id],
    }),
    diagnostics: many(diagnostics),
  }
));

export const diagnosticsRelations = relations(diagnostics, ({ one }) => (
  {
    vehicle: one(vehicles, {
      fields: [diagnostics.vehicleId],
      references: [vehicles.id],
    }),
    user: one(users, {
      fields: [diagnostics.userId],
      references: [users.id],
    }),
  }
));
