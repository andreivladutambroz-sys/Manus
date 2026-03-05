import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, decimal, boolean } from "drizzle-orm/mysql-core";
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
/**
 * Diagnostic images - images uploaded for diagnostics
 */
export const diagnosticImages = mysqlTable("diagnosticImages", {
  id: int("id").autoincrement().primaryKey(),
  diagnosticId: int("diagnosticId").notNull().references(() => diagnostics.id, { onDelete: "cascade" }),
  imageUrl: varchar("imageUrl", { length: 500 }).notNull(),
  description: text("description"),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
});

export type DiagnosticImage = typeof diagnosticImages.$inferSelect;
export type InsertDiagnosticImage = typeof diagnosticImages.$inferInsert;

/**
 * Notifications - real-time notifications for mechanics
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  diagnosticId: int("diagnosticId").references(() => diagnostics.id, { onDelete: "cascade" }),
  type: mysqlEnum("type", ["analysis_complete", "diagnostic_saved", "system_alert"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Knowledge base - common VAG vehicle problems and solutions
 */
/**
 * Vehicle Motorizations - official engine variants per brand/model
 */
export const vehicleMotorizations = mysqlTable("vehicleMotorizations", {
  id: int("id").autoincrement().primaryKey(),
  brand: varchar("brand", { length: 50 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  yearFrom: int("yearFrom").notNull(),
  yearTo: int("yearTo").notNull(),
  
  // Engine details
  engineName: varchar("engineName", { length: 100 }).notNull(), // "3.0 TDI 171kW CARA"
  engineCode: varchar("engineCode", { length: 20 }).notNull(), // "CARA"
  engineType: varchar("engineType", { length: 50 }).notNull(), // "Diesel", "Petrol", "Hybrid"
  displacement: varchar("displacement", { length: 20 }), // "3.0"
  power: varchar("power", { length: 20 }), // "171kW"
  torque: varchar("torque", { length: 20 }), // "500Nm"
  
  // Additional info
  fuelType: varchar("fuelType", { length: 20 }), // "Diesel", "Petrol", "Hybrid"
  transmission: varchar("transmission", { length: 50 }), // "Manual", "Automatic"
  isActive: boolean("isActive").default(true).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VehicleMotorization = typeof vehicleMotorizations.$inferSelect;
export type InsertVehicleMotorization = typeof vehicleMotorizations.$inferInsert;

/**
 * Knowledge base - common VAG vehicle problems and solutions
 */
/**
 * Automotive API Cache - normalized vehicle data from external APIs
 */
export const vehicleApiCache = mysqlTable("vehicleApiCache", {
  id: int("id").autoincrement().primaryKey(),
  
  // VIN or vehicle identifier
  vin: varchar("vin", { length: 50 }).unique(),
  make: varchar("make", { length: 50 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  year: int("year").notNull(),
  
  // Engine specifications
  engineCode: varchar("engineCode", { length: 20 }),
  engineType: varchar("engineType", { length: 50 }), // Petrol, Diesel, Hybrid, Electric
  displacement: varchar("displacement", { length: 20 }), // e.g., "3.0"
  power: varchar("power", { length: 20 }), // e.g., "171kW" or "232hp"
  torque: varchar("torque", { length: 20 }), // e.g., "500Nm"
  cylinders: int("cylinders"),
  
  // Transmission
  transmission: varchar("transmission", { length: 50 }), // Manual, Automatic, CVT
  
  // Fuel and emissions
  fuelType: varchar("fuelType", { length: 20 }),
  fuelConsumption: varchar("fuelConsumption", { length: 50 }), // e.g., "7.5 L/100km"
  co2Emissions: varchar("co2Emissions", { length: 50 }), // e.g., "195 g/km"
  
  // Body type
  bodyType: varchar("bodyType", { length: 50 }), // Sedan, SUV, Truck, etc.
  
  // Source tracking
  dataSources: json("dataSources").$type<DataSource[]>(), // Which APIs provided this data
  confidenceScore: decimal("confidenceScore", { precision: 3, scale: 2 }), // 0.0-1.0
  
  // Cache management
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export interface DataSource {
  provider: string; // "nhtsa", "carquery", "fueleconomy", etc.
  confidence: number; // 0.0-1.0
  lastFetched: string; // ISO timestamp
  fields: string[]; // Which fields came from this provider
}

export type VehicleApiCache = typeof vehicleApiCache.$inferSelect;
export type InsertVehicleApiCache = typeof vehicleApiCache.$inferInsert;

/**
 * Vehicle Recalls - safety recalls from NHTSA and other sources
 */
export const vehicleRecalls = mysqlTable("vehicleRecalls", {
  id: int("id").autoincrement().primaryKey(),
  
  // Vehicle identification
  make: varchar("make", { length: 50 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  yearFrom: int("yearFrom").notNull(),
  yearTo: int("yearTo").notNull(),
  
  // Recall details
  recallId: varchar("recallId", { length: 50 }).notNull().unique(), // NHTSA recall ID
  manufacturer: varchar("manufacturer", { length: 100 }).notNull(),
  description: text("description").notNull(),
  riskLevel: mysqlEnum("riskLevel", ["critical", "high", "medium", "low"]).notNull(),
  
  // Recall procedure
  fixProcedure: text("fixProcedure"),
  estimatedRepairTime: varchar("estimatedRepairTime", { length: 50 }),
  
  // Status
  recallDate: timestamp("recallDate"),
  status: mysqlEnum("status", ["open", "closed", "superseded"]).default("open").notNull(),
  
  // Source
  source: varchar("source", { length: 50 }).notNull(), // "nhtsa", "eu_database", etc.
  sourceUrl: varchar("sourceUrl", { length: 500 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VehicleRecall = typeof vehicleRecalls.$inferSelect;
export type InsertVehicleRecall = typeof vehicleRecalls.$inferInsert;

/**
 * API Request Log - track API calls for monitoring and debugging
 */
export const apiRequestLog = mysqlTable("apiRequestLog", {
  id: int("id").autoincrement().primaryKey(),
  
  // Request details
  provider: varchar("provider", { length: 50 }).notNull(), // "nhtsa", "carquery", etc.
  endpoint: varchar("endpoint", { length: 500 }).notNull(),
  method: varchar("method", { length: 10 }).notNull(), // GET, POST
  
  // Response details
  statusCode: int("statusCode"),
  responseTime: int("responseTime"), // milliseconds
  success: boolean("success").notNull(),
  errorMessage: text("errorMessage"),
  
  // Cache info
  fromCache: boolean("fromCache").default(false).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ApiRequestLog = typeof apiRequestLog.$inferSelect;
export type InsertApiRequestLog = typeof apiRequestLog.$inferInsert;

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

// ============================================================
// LEARNING SYSTEM TABLES
// ============================================================

/**
 * Diagnostic Feedback - mecanicul confirmă/corectează diagnosticul
 */
export const diagnosticFeedback = mysqlTable("diagnosticFeedback", {
  id: int("id").autoincrement().primaryKey(),
  diagnosticId: int("diagnosticId").notNull().references(() => diagnostics.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Rating general
  overallRating: int("overallRating").notNull(), // 1-5 stele
  accuracyRating: int("accuracyRating").notNull(), // 1-5
  usefulnessRating: int("usefulnessRating").notNull(), // 1-5
  
  // Feedback per cauză
  causesFeedback: json("causesFeedback").$type<CauseFeedback[]>(),
  
  // Corecții mecanic
  actualCause: text("actualCause"), // cauza reală dacă AI a greșit
  actualParts: json("actualParts").$type<string[]>(), // piese reale folosite
  actualCost: decimal("actualCost", { precision: 10, scale: 2 }),
  actualTime: varchar("actualTime", { length: 50 }),
  
  // Note mecanic
  mechanicNotes: text("mechanicNotes"),
  wasResolved: boolean("wasResolved").default(false).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export interface CauseFeedback {
  causeId: string;
  cause: string;
  rating: "correct" | "partially_correct" | "incorrect";
  mechanicComment?: string;
}

export type DiagnosticFeedbackRow = typeof diagnosticFeedback.$inferSelect;
export type InsertDiagnosticFeedback = typeof diagnosticFeedback.$inferInsert;

/**
 * Learned Patterns - pattern-uri validate din diagnostic-uri confirmate
 */
export const learnedPatterns = mysqlTable("learnedPatterns", {
  id: int("id").autoincrement().primaryKey(),
  
  // Identificare vehicul
  brand: varchar("brand", { length: 50 }).notNull(),
  model: varchar("model", { length: 100 }),
  yearFrom: int("yearFrom"),
  yearTo: int("yearTo"),
  engineCode: varchar("engineCode", { length: 20 }),
  
  // Pattern
  symptomPattern: text("symptomPattern").notNull(), // simptome normalizate
  errorCodes: json("errorCodes").$type<string[]>(),
  confirmedCause: text("confirmedCause").notNull(),
  confirmedSolution: text("confirmedSolution").notNull(),
  confirmedParts: json("confirmedParts").$type<string[]>(),
  
  // Metrici
  timesConfirmed: int("timesConfirmed").default(1).notNull(),
  avgAccuracy: decimal("avgAccuracy", { precision: 5, scale: 2 }),
  avgCost: decimal("avgCost", { precision: 10, scale: 2 }),
  avgRepairTime: varchar("avgRepairTime", { length: 50 }),
  
  // Sursă
  sourceType: mysqlEnum("sourceType", ["mechanic_feedback", "manual_entry", "auto_detected"]).notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 2 }).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LearnedPattern = typeof learnedPatterns.$inferSelect;
export type InsertLearnedPattern = typeof learnedPatterns.$inferInsert;

/**
 * Prompt Versions - versiuni prompt cu performance tracking
 */
export const promptVersions = mysqlTable("promptVersions", {
  id: int("id").autoincrement().primaryKey(),
  
  agentName: varchar("agentName", { length: 50 }).notNull(),
  version: int("version").notNull(),
  promptText: text("promptText").notNull(),
  
  // Parametri
  temperature: decimal("temperature", { precision: 3, scale: 2 }),
  maxTokens: int("maxTokens"),
  
  // Performance
  totalUses: int("totalUses").default(0).notNull(),
  avgAccuracy: decimal("avgAccuracy", { precision: 5, scale: 2 }),
  avgFeedbackScore: decimal("avgFeedbackScore", { precision: 3, scale: 2 }),
  successRate: decimal("successRate", { precision: 5, scale: 2 }),
  
  isActive: boolean("isActive").default(true).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PromptVersion = typeof promptVersions.$inferSelect;
export type InsertPromptVersion = typeof promptVersions.$inferInsert;

/**
 * Accuracy Metrics - metrici acuratețe per categorie
 */
export const accuracyMetrics = mysqlTable("accuracyMetrics", {
  id: int("id").autoincrement().primaryKey(),
  
  // Dimensiune
  dimension: mysqlEnum("dimension", ["brand", "model", "symptom_category", "error_code", "agent", "overall"]).notNull(),
  dimensionValue: varchar("dimensionValue", { length: 200 }).notNull(),
  
  // Metrici
  totalDiagnostics: int("totalDiagnostics").default(0).notNull(),
  correctDiagnostics: int("correctDiagnostics").default(0).notNull(),
  partiallyCorrect: int("partiallyCorrect").default(0).notNull(),
  incorrectDiagnostics: int("incorrectDiagnostics").default(0).notNull(),
  
  avgAccuracy: decimal("avgAccuracy", { precision: 5, scale: 2 }),
  avgFeedbackScore: decimal("avgFeedbackScore", { precision: 3, scale: 2 }),
  trend: mysqlEnum("trend", ["improving", "stable", "declining"]).default("stable").notNull(),
  
  // Perioadă
  periodStart: timestamp("periodStart").notNull(),
  periodEnd: timestamp("periodEnd").notNull(),
  
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AccuracyMetric = typeof accuracyMetrics.$inferSelect;
export type InsertAccuracyMetric = typeof accuracyMetrics.$inferInsert;

// ============================================================
// KNOWLEDGE BASE DOCUMENTS
// ============================================================

/**
 * Knowledge Base Documents - manuale ELSA, ETKA, Autodata uploadate de admin
 */
export const knowledgeDocuments = mysqlTable("knowledgeDocuments", {
  id: int("id").autoincrement().primaryKey(),
  uploadedBy: int("uploadedBy").notNull().references(() => users.id),
  
  // Document info
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["elsa", "etka", "autodata", "workshop_manual", "wiring_diagram", "tsi_bulletin", "other"]).notNull(),
  
  // Vehicle scope
  brand: varchar("brand", { length: 50 }),
  model: varchar("model", { length: 100 }),
  yearFrom: int("yearFrom"),
  yearTo: int("yearTo"),
  engineCode: varchar("engineCode", { length: 20 }),
  
  // File info
  fileUrl: varchar("fileUrl", { length: 500 }).notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileSize: int("fileSize"),
  mimeType: varchar("mimeType", { length: 100 }),
  
  // Extracted content for AI search
  extractedText: text("extractedText"),
  tags: json("tags").$type<string[]>(),
  
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KnowledgeDocument = typeof knowledgeDocuments.$inferSelect;
export type InsertKnowledgeDocument = typeof knowledgeDocuments.$inferInsert;

// ============================================================
// DIAGNOSTIC CHAT MESSAGES
// ============================================================

/**
 * Chat Messages - conversații mecanic-AI despre diagnostic
 */
export const chatMessages = mysqlTable("chatMessages", {
  id: varchar("id", { length: 36 }).primaryKey(),
  chatId: varchar("chatId", { length: 36 }).notNull(),
  diagnosticId: int("diagnosticId").references(() => diagnostics.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: json("content").notNull(), // Full UIMessage object
  ordering: int("ordering").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;
