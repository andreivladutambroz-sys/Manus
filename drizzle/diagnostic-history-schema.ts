import { pgTable, text, integer, varchar, timestamp, jsonb, numeric, boolean } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const diagnosticHistoryTable = pgTable('diagnostic_history', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  vehicleId: text('vehicle_id').notNull(),
  brand: varchar('brand', { length: 100 }).notNull(),
  model: varchar('model', { length: 100 }).notNull(),
  year: integer('year'),
  mileage: integer('mileage'),
  symptoms: jsonb('symptoms').notNull(), // Array of symptoms
  errorCodes: jsonb('error_codes').notNull(), // Array of DTC codes
  diagnosticResult: jsonb('diagnostic_result').notNull(), // Full diagnostic analysis
  aiSuggestions: jsonb('ai_suggestions'), // AI-generated suggestions
  maintenanceRecommendations: jsonb('maintenance_recommendations'), // Predictive maintenance
  estimatedRepairCost: numeric('estimated_repair_cost'),
  repairCostCurrency: varchar('repair_cost_currency', { length: 10 }).default('EUR'),
  status: varchar('status', { length: 50 }).default('completed'), // completed, pending, in_progress
  notes: text('notes'),
  imageUrls: jsonb('image_urls'), // Array of uploaded images
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  completedAt: timestamp('completed_at'),
});

export const diagnosticComparisonTable = pgTable('diagnostic_comparisons', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  vehicleId: text('vehicle_id').notNull(),
  diagnostic1Id: text('diagnostic1_id').notNull(),
  diagnostic2Id: text('diagnostic2_id').notNull(),
  comparisonType: varchar('comparison_type', { length: 50 }).notNull(), // 'symptoms_change', 'error_codes_change', 'trend_analysis'
  findings: jsonb('findings').notNull(), // Comparison results
  trendAnalysis: jsonb('trend_analysis'), // Trend data
  improvementSuggestions: jsonb('improvement_suggestions'), // Suggestions based on comparison
  createdAt: timestamp('created_at').defaultNow(),
});

export const vehicleHealthScoreTable = pgTable('vehicle_health_scores', {
  id: text('id').primaryKey(),
  vehicleId: text('vehicle_id').notNull(),
  userId: text('user_id').notNull(),
  overallScore: numeric('overall_score'), // 0-100
  engineHealth: numeric('engine_health'),
  transmissionHealth: numeric('transmission_health'),
  suspensionHealth: numeric('suspension_health'),
  brakesHealth: numeric('brakes_health'),
  electricalHealth: numeric('electrical_health'),
  lastDiagnosticId: text('last_diagnostic_id'),
  trendDirection: varchar('trend_direction', { length: 20 }), // 'improving', 'stable', 'declining'
  maintenanceUrgency: varchar('maintenance_urgency', { length: 20 }), // 'low', 'medium', 'high', 'critical'
  estimatedTimeToFailure: varchar('estimated_time_to_failure', { length: 100 }),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const insertDiagnosticHistorySchema = createInsertSchema(diagnosticHistoryTable);
export const selectDiagnosticHistorySchema = createSelectSchema(diagnosticHistoryTable);

export const insertDiagnosticComparisonSchema = createInsertSchema(diagnosticComparisonTable);
export const selectDiagnosticComparisonSchema = createSelectSchema(diagnosticComparisonTable);

export const insertVehicleHealthScoreSchema = createInsertSchema(vehicleHealthScoreTable);
export const selectVehicleHealthScoreSchema = createSelectSchema(vehicleHealthScoreTable);

export type DiagnosticHistory = typeof diagnosticHistoryTable.$inferSelect;
export type InsertDiagnosticHistory = typeof diagnosticHistoryTable.$inferInsert;

export type DiagnosticComparison = typeof diagnosticComparisonTable.$inferSelect;
export type InsertDiagnosticComparison = typeof diagnosticComparisonTable.$inferInsert;

export type VehicleHealthScore = typeof vehicleHealthScoreTable.$inferSelect;
export type InsertVehicleHealthScore = typeof vehicleHealthScoreTable.$inferInsert;
