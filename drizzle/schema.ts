import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, decimal, boolean, longtext, bigint } from "drizzle-orm/mysql-core";
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
  hourly_rate: decimal("hourly_rate", { precision: 10, scale: 2 }).default("50.00"),
  currency: varchar("currency", { length: 10 }).default("USD"),
  rate_updated_at: timestamp("rate_updated_at").defaultNow(),
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


// ============================================================
// PREDICTIVE MAINTENANCE
// ============================================================

/**
 * Vehicle History - agregat diagnostic-uri și reparații pentru fiecare vehicul
 */
export const vehicleHistory = mysqlTable("vehicleHistory", {
  id: int("id").autoincrement().primaryKey(),
  vehicleId: int("vehicleId").notNull().references(() => vehicles.id, { onDelete: "cascade" }),
  
  // Diagnostic history
  totalDiagnostics: int("totalDiagnostics").default(0).notNull(),
  lastDiagnosticDate: timestamp("lastDiagnosticDate"),
  commonIssues: json("commonIssues").$type<string[]>(),
  
  // Repair history
  totalRepairs: int("totalRepairs").default(0).notNull(),
  lastRepairDate: timestamp("lastRepairDate"),
  repairCost: decimal("repairCost", { precision: 10, scale: 2 }),
  
  // Mileage tracking
  currentMileage: int("currentMileage"),
  mileageHistory: json("mileageHistory").$type<Array<{date: string; mileage: number}>>(),
  
  // Health score
  healthScore: decimal("healthScore", { precision: 5, scale: 2 }).default("100"),
  lastHealthUpdate: timestamp("lastHealthUpdate"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VehicleHistory = typeof vehicleHistory.$inferSelect;
export type InsertVehicleHistory = typeof vehicleHistory.$inferInsert;

/**
 * Failure Predictions - predicții AI despre defecte viitoare
 */
export const failurePredictions = mysqlTable("failurePredictions", {
  id: int("id").autoincrement().primaryKey(),
  vehicleId: int("vehicleId").notNull().references(() => vehicles.id, { onDelete: "cascade" }),
  
  // Component info
  component: varchar("component", { length: 100 }).notNull(), // "Engine", "Transmission", "Brakes", etc.
  componentCode: varchar("componentCode", { length: 50 }),
  
  // Prediction
  failureRisk: decimal("failureRisk", { precision: 5, scale: 2 }).notNull(), // 0-100%
  riskLevel: mysqlEnum("riskLevel", ["critical", "high", "medium", "low"]).notNull(),
  predictedFailureDate: timestamp("predictedFailureDate"),
  
  // Reasoning
  reason: text("reason"),
  historicalPattern: json("historicalPattern").$type<Record<string, unknown>>(),
  
  // Recommendations
  recommendedAction: text("recommendedAction"),
  estimatedCost: decimal("estimatedCost", { precision: 10, scale: 2 }),
  
  // Confidence
  confidence: decimal("confidence", { precision: 5, scale: 2 }).notNull(), // 0-100%
  dataPoints: int("dataPoints").default(0), // Number of historical data points used
  
  // Status
  status: mysqlEnum("status", ["active", "dismissed", "confirmed_failure", "preventive_maintenance_done"]).default("active").notNull(),
  dismissedAt: timestamp("dismissedAt"),
  dismissedReason: text("dismissedReason"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FailurePrediction = typeof failurePredictions.$inferSelect;
export type InsertFailurePrediction = typeof failurePredictions.$inferInsert;

/**
 * Maintenance Recommendations - recomandări preventive
 */
export const maintenanceRecommendations = mysqlTable("maintenanceRecommendations", {
  id: int("id").autoincrement().primaryKey(),
  vehicleId: int("vehicleId").notNull().references(() => vehicles.id, { onDelete: "cascade" }),
  
  // Recommendation
  maintenanceType: varchar("maintenanceType", { length: 100 }).notNull(), // "Oil Change", "Brake Pads", etc.
  description: text("description"),
  
  // Trigger
  triggerType: mysqlEnum("triggerType", ["mileage", "time", "prediction", "manual"]).notNull(),
  triggerValue: int("triggerValue"), // Mileage or days
  
  // Scheduling
  recommendedDate: timestamp("recommendedDate"),
  urgency: mysqlEnum("urgency", ["critical", "high", "medium", "low"]).default("medium").notNull(),
  
  // Cost estimate
  estimatedCost: decimal("estimatedCost", { precision: 10, scale: 2 }),
  estimatedTime: varchar("estimatedTime", { length: 50 }), // "2 hours", "30 minutes"
  
  // Status
  status: mysqlEnum("status", ["pending", "scheduled", "completed", "dismissed"]).default("pending").notNull(),
  completedAt: timestamp("completedAt"),
  
  // Linked prediction
  predictionId: int("predictionId").references(() => failurePredictions.id, { onDelete: "set null" }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MaintenanceRecommendation = typeof maintenanceRecommendations.$inferSelect;
export type InsertMaintenanceRecommendation = typeof maintenanceRecommendations.$inferInsert;

/**
 * Component Health Scores - sănătate per component
 */
export const componentHealthScores = mysqlTable("componentHealthScores", {
  id: int("id").autoincrement().primaryKey(),
  vehicleId: int("vehicleId").notNull().references(() => vehicles.id, { onDelete: "cascade" }),
  
  // Component
  component: varchar("component", { length: 100 }).notNull(),
  componentCode: varchar("componentCode", { length: 50 }),
  
  // Health metrics
  healthScore: decimal("healthScore", { precision: 5, scale: 2 }).notNull(), // 0-100
  lastAssessmentDate: timestamp("lastAssessmentDate"),
  
  // Trend
  trend: mysqlEnum("trend", ["improving", "stable", "degrading"]).default("stable").notNull(),
  trendData: json("trendData").$type<Array<{date: string; score: number}>>(),
  
  // Issues
  knownIssues: json("knownIssues").$type<string[]>(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ComponentHealthScore = typeof componentHealthScores.$inferSelect;
export type InsertComponentHealthScore = typeof componentHealthScores.$inferInsert;


// ============================================================
// GLOBAL VEHICLE DATABASE LAYER
// ============================================================

/**
 * Manufacturers - Global vehicle manufacturers
 */
export const manufacturers = mysqlTable("manufacturers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  country: varchar("country", { length: 100 }),
  carqueryId: varchar("carqueryId", { length: 100 }).unique(),
  nhtsa_id: varchar("nhtsa_id", { length: 50 }).unique(),
  logo_url: varchar("logo_url", { length: 500 }),
  founded_year: int("founded_year"),
  is_active: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Manufacturer = typeof manufacturers.$inferSelect;
export type InsertManufacturer = typeof manufacturers.$inferInsert;

/**
 * Models - Vehicle models per manufacturer
 */
export const models = mysqlTable("models", {
  id: int("id").autoincrement().primaryKey(),
  manufacturer_id: int("manufacturer_id").notNull().references(() => manufacturers.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  carquery_id: varchar("carquery_id", { length: 100 }).unique(),
  body_type: varchar("body_type", { length: 50 }), // Sedan, SUV, Truck, etc.
  class: varchar("class", { length: 50 }), // Compact, Mid-size, Luxury, etc.
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Model = typeof models.$inferSelect;
export type InsertModel = typeof models.$inferInsert;

/**
 * Generations - Vehicle generations/facelifts
 */
export const generations = mysqlTable("generations", {
  id: int("id").autoincrement().primaryKey(),
  model_id: int("model_id").notNull().references(() => models.id, { onDelete: "cascade" }),
  generation_name: varchar("generation_name", { length: 100 }),
  start_year: int("start_year").notNull(),
  end_year: int("end_year"),
  carquery_id: varchar("carquery_id", { length: 100 }).unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Generation = typeof generations.$inferSelect;
export type InsertGeneration = typeof generations.$inferInsert;

/**
 * Engines - Engine specifications
 */
export const engines = mysqlTable("engines", {
  id: int("id").autoincrement().primaryKey(),
  engine_code: varchar("engine_code", { length: 50 }).unique(),
  engine_name: varchar("engine_name", { length: 150 }).notNull(),
  displacement_cc: int("displacement_cc"), // Cubic centimeters
  displacement_liters: decimal("displacement_liters", { precision: 5, scale: 2 }),
  power_kw: int("power_kw"),
  power_hp: int("power_hp"),
  torque_nm: int("torque_nm"),
  fuel_type: varchar("fuel_type", { length: 50 }), // Petrol, Diesel, Hybrid, Electric, etc.
  cylinders: int("cylinders"),
  valves: int("valves"),
  turbo: boolean("turbo").default(false),
  supercharged: boolean("supercharged").default(false),
  co2_emissions: int("co2_emissions"), // g/km
  combined_consumption: decimal("combined_consumption", { precision: 5, scale: 2 }), // L/100km
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Engine = typeof engines.$inferSelect;
export type InsertEngine = typeof engines.$inferInsert;

/**
 * Vehicle Variants - Specific vehicle configurations
 */
export const vehicleVariants = mysqlTable("vehicleVariants", {
  id: int("id").autoincrement().primaryKey(),
  generation_id: int("generation_id").notNull().references(() => generations.id, { onDelete: "cascade" }),
  engine_id: int("engine_id").notNull().references(() => engines.id, { onDelete: "cascade" }),
  
  // Variant info
  trim_name: varchar("trim_name", { length: 150 }), // "SE", "Limited", "Sport", etc.
  transmission: varchar("transmission", { length: 50 }), // Manual, Automatic, CVT, etc.
  drivetrain: varchar("drivetrain", { length: 50 }), // FWD, RWD, AWD, 4WD
  
  // Production dates
  production_start: int("production_start"),
  production_end: int("production_end"),
  
  // Specifications
  seats: int("seats"),
  doors: int("doors"),
  length_mm: int("length_mm"),
  width_mm: int("width_mm"),
  height_mm: int("height_mm"),
  wheelbase_mm: int("wheelbase_mm"),
  curb_weight_kg: int("curb_weight_kg"),
  gvwr_kg: int("gvwr_kg"), // Gross Vehicle Weight Rating
  
  // Carquery reference
  carquery_id: varchar("carquery_id", { length: 100 }).unique(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VehicleVariant = typeof vehicleVariants.$inferSelect;
export type InsertVehicleVariant = typeof vehicleVariants.$inferInsert;

/**
 * VIN Patterns - WMI and VDS patterns for VIN decoding
 */
export const vinPatterns = mysqlTable("vinPatterns", {
  id: int("id").autoincrement().primaryKey(),
  wmi: varchar("wmi", { length: 3 }).notNull(), // World Manufacturer Identifier (positions 1-3)
  vds_pattern: varchar("vds_pattern", { length: 100 }), // Vehicle Descriptor Section pattern
  year_code: varchar("year_code", { length: 1 }), // Single character year code
  vehicle_variant_id: int("vehicle_variant_id").references(() => vehicleVariants.id, { onDelete: "set null" }),
  manufacturer_id: int("manufacturer_id").notNull().references(() => manufacturers.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VinPattern = typeof vinPatterns.$inferSelect;
export type InsertVinPattern = typeof vinPatterns.$inferInsert;

/**
 * VIN Decode Cache - Cache VIN decode results for performance
 */
export const vinDecodeCache = mysqlTable("vinDecodeCache", {
  id: int("id").autoincrement().primaryKey(),
  vin: varchar("vin", { length: 17 }).notNull().unique(),
  manufacturer_id: int("manufacturer_id").references(() => manufacturers.id, { onDelete: "set null" }),
  model_id: int("model_id").references(() => models.id, { onDelete: "set null" }),
  generation_id: int("generation_id").references(() => generations.id, { onDelete: "set null" }),
  variant_id: int("variant_id").references(() => vehicleVariants.id, { onDelete: "set null" }),
  engine_id: int("engine_id").references(() => engines.id, { onDelete: "set null" }),
  
  // Decoded data
  year: int("year"),
  manufacturer_name: varchar("manufacturer_name", { length: 100 }),
  model_name: varchar("model_name", { length: 100 }),
  engine_name: varchar("engine_name", { length: 150 }),
  trim_name: varchar("trim_name", { length: 150 }),
  
  // Source
  source: varchar("source", { length: 50 }), // "nhtsa", "carquery", "manual"
  raw_response: json("raw_response").$type<Record<string, unknown>>(),
  
  // Cache control
  expires_at: timestamp("expires_at"),
  hit_count: int("hit_count").default(0),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VinDecodeCache = typeof vinDecodeCache.$inferSelect;
export type InsertVinDecodeCache = typeof vinDecodeCache.$inferInsert;

/**
 * Data Import Status - Track progress of data imports
 */
export const dataImportStatus = mysqlTable("dataImportStatus", {
  id: int("id").autoincrement().primaryKey(),
  import_type: varchar("import_type", { length: 50 }).notNull(), // "manufacturers", "models", "engines", etc.
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "failed"]).notNull(),
  total_records: int("total_records"),
  processed_records: int("processed_records").default(0),
  failed_records: int("failed_records").default(0),
  error_message: text("error_message"),
  started_at: timestamp("started_at").defaultNow().notNull(),
  completed_at: timestamp("completed_at"),
  duration_seconds: int("duration_seconds"),
});

export type DataImportStatus = typeof dataImportStatus.$inferSelect;
export type InsertDataImportStatus = typeof dataImportStatus.$inferInsert;


/**
 * ============================================================
 * SWARM TABLES - Repair Knowledge Collection & RSI
 * ============================================================
 */

/**
 * repair_cases - Individual repair cases from swarm collection
 */
export const repairCases = mysqlTable("repairCases", {
  id: bigint("id", { mode: "bigint" }).autoincrement().primaryKey(),
  vehicleMake: varchar("vehicleMake", { length: 50 }).notNull(),
  vehicleModel: varchar("vehicleModel", { length: 100 }).notNull(),
  vehicleYear: int("vehicleYear"),
  engine: varchar("engine", { length: 100 }),
  engineCode: varchar("engineCode", { length: 50 }),
  errorCode: varchar("errorCode", { length: 20 }),
  errorSystem: varchar("errorSystem", { length: 50 }),
  errorDescription: text("errorDescription"),
  symptoms: json("symptoms").$type<string[]>(),
  repairAction: varchar("repairAction", { length: 255 }),
  repairPerformed: text("repairPerformed"),
  repairTimeHours: decimal("repairTimeHours", { precision: 5, scale: 2 }),
  repairCostEstimate: decimal("repairCostEstimate", { precision: 10, scale: 2 }),
  repairCostActual: decimal("repairCostActual", { precision: 10, scale: 2 }),
  toolsUsed: json("toolsUsed").$type<string[]>(),
  partsNeeded: json("partsNeeded").$type<string[]>(),
  repairOutcome: mysqlEnum("repairOutcome", ["success", "partial", "failed", "unknown"]).default("unknown"),
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  sourceUrl: varchar("sourceUrl", { length: 500 }),
  sourceDomain: varchar("sourceDomain", { length: 100 }),
  sourceType: mysqlEnum("sourceType", ["forum", "reddit", "manual", "obd", "blog", "video"]).default("forum"),
  evidenceSnippets: json("evidenceSnippets").$type<string[]>(),
  evidenceQuality: decimal("evidenceQuality", { precision: 3, scale: 2 }),
  language: varchar("language", { length: 10 }).default("en"),
  canonicalKey: varchar("canonicalKey", { length: 255 }).unique(),
  clusterId: varchar("clusterId", { length: 100 }),
  mergedCount: int("mergedCount").default(1),
  sourceCount: int("sourceCount").default(1),
  rawJson: text("rawJson"),
  contentHash: varchar("contentHash", { length: 64 }),
  normalizedHash: varchar("normalizedHash", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RepairCase = typeof repairCases.$inferSelect;
export type InsertRepairCase = typeof repairCases.$inferInsert;

/**
 * service_procedures - Step-by-step repair procedures
 */
export const serviceProcedures = mysqlTable("serviceProcedures", {
  id: bigint("id", { mode: "bigint" }).autoincrement().primaryKey(),
  vehicleMake: varchar("vehicleMake", { length: 50 }).notNull(),
  vehicleModel: varchar("vehicleModel", { length: 100 }).notNull(),
  vehicleYear: int("vehicleYear"),
  engine: varchar("engine", { length: 100 }),
  engineCode: varchar("engineCode", { length: 50 }),
  systemType: varchar("systemType", { length: 100 }),
  procedureName: varchar("procedureName", { length: 255 }).notNull(),
  procedureDescription: text("procedureDescription"),
  repairSteps: json("repairSteps").$type<Array<{ step: number; action: string }>>().notNull(),
  toolsRequired: json("toolsRequired").$type<string[]>(),
  torqueSpecs: json("torqueSpecs").$type<Array<{ component: string; value: number }>>(),
  estimatedTimeHours: decimal("estimatedTimeHours", { precision: 5, scale: 2 }),
  difficultyLevel: mysqlEnum("difficultyLevel", ["easy", "medium", "hard", "expert"]).default("medium"),
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  sourceUrl: varchar("sourceUrl", { length: 500 }),
  sourceDomain: varchar("sourceDomain", { length: 100 }),
  sourceType: mysqlEnum("sourceType", ["manual", "forum", "blog", "video"]).default("manual"),
  evidenceSnippets: json("evidenceSnippets").$type<string[]>(),
  evidenceQuality: decimal("evidenceQuality", { precision: 3, scale: 2 }),
  language: varchar("language", { length: 10 }).default("en"),
  canonicalKey: varchar("canonicalKey", { length: 255 }).unique(),
  rawJson: text("rawJson"),
  contentHash: varchar("contentHash", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ServiceProcedure = typeof serviceProcedures.$inferSelect;
export type InsertServiceProcedure = typeof serviceProcedures.$inferInsert;

/**
 * torque_specifications - Torque values for components
 */
export const torqueSpecifications = mysqlTable("torqueSpecifications", {
  id: bigint("id", { mode: "bigint" }).autoincrement().primaryKey(),
  vehicleMake: varchar("vehicleMake", { length: 50 }).notNull(),
  vehicleModel: varchar("vehicleModel", { length: 100 }).notNull(),
  vehicleYear: int("vehicleYear"),
  engine: varchar("engine", { length: 100 }),
  engineCode: varchar("engineCode", { length: 50 }),
  systemType: varchar("systemType", { length: 100 }),
  componentName: varchar("componentName", { length: 255 }).notNull(),
  torqueValueNm: decimal("torqueValueNm", { precision: 8, scale: 2 }).notNull(),
  torqueValueFtlb: decimal("torqueValueFtlb", { precision: 8, scale: 2 }),
  torqueSequence: varchar("torqueSequence", { length: 255 }),
  torquePattern: varchar("torquePattern", { length: 255 }),
  coldTorque: decimal("coldTorque", { precision: 8, scale: 2 }),
  warmTorque: decimal("warmTorque", { precision: 8, scale: 2 }),
  notes: text("notes"),
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  sourceUrl: varchar("sourceUrl", { length: 500 }),
  sourceDomain: varchar("sourceDomain", { length: 100 }),
  evidenceSnippet: text("evidenceSnippet"),
  evidenceQuality: decimal("evidenceQuality", { precision: 3, scale: 2 }),
  language: varchar("language", { length: 10 }).default("en"),
  canonicalKey: varchar("canonicalKey", { length: 255 }).unique(),
  rawJson: text("rawJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TorqueSpecification = typeof torqueSpecifications.$inferSelect;
export type InsertTorqueSpecification = typeof torqueSpecifications.$inferInsert;

/**
 * repair_outcomes - RSI (Repair Success Intelligence) data
 */
export const repairOutcomes = mysqlTable("repairOutcomes", {
  id: bigint("id", { mode: "bigint" }).autoincrement().primaryKey(),
  vehicleMake: varchar("vehicleMake", { length: 50 }).notNull(),
  vehicleModel: varchar("vehicleModel", { length: 100 }).notNull(),
  vehicleYear: int("vehicleYear"),
  engine: varchar("engine", { length: 100 }),
  engineCode: varchar("engineCode", { length: 50 }),
  errorCode: varchar("errorCode", { length: 20 }).notNull(),
  errorSystem: varchar("errorSystem", { length: 50 }),
  repairAction: varchar("repairAction", { length: 255 }).notNull(),
  success: mysqlEnum("success", ["true", "false", "unknown"]),
  repairTimeHours: decimal("repairTimeHours", { precision: 5, scale: 2 }),
  repairCost: decimal("repairCost", { precision: 10, scale: 2 }),
  sourceDomain: varchar("sourceDomain", { length: 100 }),
  sourceUrl: varchar("sourceUrl", { length: 500 }),
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  successRate: decimal("successRate", { precision: 5, scale: 2 }),
  totalCases: int("totalCases").default(1),
  avgRepairTime: decimal("avgRepairTime", { precision: 5, scale: 2 }),
  avgRepairCost: decimal("avgRepairCost", { precision: 10, scale: 2 }),
  successCount: int("successCount").default(0),
  failureCount: int("failureCount").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type RepairOutcome = typeof repairOutcomes.$inferSelect;
export type InsertRepairOutcome = typeof repairOutcomes.$inferInsert;

/**
 * repair_feedback - User feedback from mechanics
 */
export const repairFeedback = mysqlTable("repairFeedback", {
  id: bigint("id", { mode: "bigint" }).autoincrement().primaryKey(),
  diagnosticId: varchar("diagnosticId", { length: 100 }),
  userId: varchar("userId", { length: 100 }),
  mechanicId: varchar("mechanicId", { length: 100 }),
  vehicleMake: varchar("vehicleMake", { length: 50 }),
  vehicleModel: varchar("vehicleModel", { length: 100 }),
  vehicleYear: int("vehicleYear"),
  engine: varchar("engine", { length: 100 }),
  engineCode: varchar("engineCode", { length: 50 }),
  errorCode: varchar("errorCode", { length: 20 }),
  repairAction: varchar("repairAction", { length: 255 }),
  success: mysqlEnum("success", ["true", "false", "partial"]),
  repairTimeHours: decimal("repairTimeHours", { precision: 5, scale: 2 }),
  repairCost: decimal("repairCost", { precision: 10, scale: 2 }),
  actualCost: decimal("actualCost", { precision: 10, scale: 2 }),
  costVariance: decimal("costVariance", { precision: 10, scale: 2 }),
  feedbackText: text("feedbackText"),
  rating: int("rating"),
  issuesFound: json("issuesFound").$type<string[]>(),
  improvementsSuggested: json("improvementsSuggested").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type RepairFeedback = typeof repairFeedback.$inferSelect;
export type InsertRepairFeedback = typeof repairFeedback.$inferInsert;

/**
 * source_registry - Track sources used by swarm
 */
export const sourceRegistry = mysqlTable("sourceRegistry", {
  id: bigint("id", { mode: "bigint" }).autoincrement().primaryKey(),
  sourceUrl: varchar("sourceUrl", { length: 500 }).notNull().unique(),
  sourceDomain: varchar("sourceDomain", { length: 100 }).notNull(),
  sourceType: mysqlEnum("sourceType", ["forum", "reddit", "manual", "obd", "blog", "video", "other"]).default("forum"),
  sourceCategory: varchar("sourceCategory", { length: 100 }),
  sourceName: varchar("sourceName", { length: 255 }),
  accessibilityScore: decimal("accessibilityScore", { precision: 3, scale: 2 }),
  relevanceScore: decimal("relevanceScore", { precision: 3, scale: 2 }),
  qualityScore: decimal("qualityScore", { precision: 3, scale: 2 }),
  extractionScore: decimal("extractionScore", { precision: 3, scale: 2 }),
  legalRiskScore: decimal("legalRiskScore", { precision: 3, scale: 2 }),
  overallScore: decimal("overallScore", { precision: 3, scale: 2 }),
  pagesScanned: int("pagesScanned").default(0),
  uniqueRecords: int("uniqueRecords").default(0),
  duplicateRate: decimal("duplicateRate", { precision: 5, scale: 2 }).default("0"),
  avgConfidence: decimal("avgConfidence", { precision: 3, scale: 2 }),
  yieldScore: decimal("yieldScore", { precision: 5, scale: 2 }),
  lastScanned: timestamp("lastScanned"),
  cooldownUntil: timestamp("cooldownUntil"),
  blacklisted: boolean("blacklisted").default(false),
  blacklistReason: varchar("blacklistReason", { length: 255 }),
  discoveredFrom: varchar("discoveredFrom", { length: 255 }),
  discoveryQuery: varchar("discoveryQuery", { length: 255 }),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SourceRegistry = typeof sourceRegistry.$inferSelect;
export type InsertSourceRegistry = typeof sourceRegistry.$inferInsert;

/**
 * beta_invites - Beta program invitations
 */
export const betaInvites = mysqlTable("betaInvites", {
  id: bigint("id", { mode: "bigint" }).autoincrement().primaryKey(),
  inviteCode: varchar("inviteCode", { length: 20 }).notNull().unique(),
  email: varchar("email", { length: 255 }),
  mechanicName: varchar("mechanicName", { length: 100 }),
  mechanicShop: varchar("mechanicShop", { length: 100 }),
  invitedBy: varchar("invitedBy", { length: 100 }),
  status: mysqlEnum("status", ["pending", "accepted", "expired", "revoked"]).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  acceptedAt: timestamp("acceptedAt"),
  expiresAt: timestamp("expiresAt"),
});

export type BetaInvite = typeof betaInvites.$inferSelect;
export type InsertBetaInvite = typeof betaInvites.$inferInsert;

/**
 * beta_users - Beta program participants
 */
export const betaUsers = mysqlTable("betaUsers", {
  id: bigint("id", { mode: "bigint" }).autoincrement().primaryKey(),
  userId: varchar("userId", { length: 100 }).notNull().unique(),
  mechanicName: varchar("mechanicName", { length: 100 }),
  mechanicShop: varchar("mechanicShop", { length: 100 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  specialties: json("specialties").$type<string[]>(),
  certifications: json("certifications").$type<string[]>(),
  experienceYears: int("experienceYears"),
  diagnosticsCount: int("diagnosticsCount").default(0),
  feedbackCount: int("feedbackCount").default(0),
  avgRating: decimal("avgRating", { precision: 3, scale: 2 }),
  status: mysqlEnum("status", ["active", "inactive", "suspended"]).default("active"),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  lastActive: timestamp("lastActive"),
});

export type BetaUser = typeof betaUsers.$inferSelect;
export type InsertBetaUser = typeof betaUsers.$inferInsert;
