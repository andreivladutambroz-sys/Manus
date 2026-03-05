import { pgTable, text, integer, varchar, timestamp, jsonb, numeric, boolean, array } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const repairProceduresTable = pgTable('repair_procedures', {
  id: text('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }).notNull(), // e.g., "Engine", "Transmission", "Brakes"
  subcategory: varchar('subcategory', { length: 100 }),
  
  // Vehicle compatibility
  applicableBrands: array(varchar('applicable_brands', { length: 100 })),
  applicableModels: array(varchar('applicable_models', { length: 100 })),
  yearRange: jsonb('year_range'), // { start: 2000, end: 2024 }
  
  // Procedure details
  difficulty: varchar('difficulty', { length: 50 }).notNull(), // easy, moderate, difficult, expert
  estimatedTimeMinutes: integer('estimated_time_minutes'),
  estimatedCostMin: numeric('estimated_cost_min'),
  estimatedCostMax: numeric('estimated_cost_max'),
  
  // Step-by-step instructions
  steps: jsonb('steps').notNull(), // Array of step objects
  toolsRequired: array(text('tools_required')),
  partsRequired: jsonb('parts_required'), // Array of { partName, partNumber, quantity, cost }
  safetyWarnings: array(text('safety_warnings')),
  
  // Media and references
  videoUrl: varchar('video_url', { length: 500 }),
  youtubeVideoIds: array(varchar('youtube_video_ids', { length: 100 })),
  imageUrls: array(varchar('image_urls', { length: 500 })),
  wiring DiagramUrl: varchar('wiring_diagram_url', { length: 500 }),
  oemManualLink: varchar('oem_manual_link', { length: 500 }),
  
  // Related procedures
  relatedProcedures: array(text('related_procedures')),
  commonIssues: array(text('common_issues')),
  errorCodesToFix: array(varchar('error_codes_to_fix', { length: 50 })),
  
  // Metadata
  author: varchar('author', { length: 255 }),
  source: varchar('source', { length: 255 }), // e.g., "OEM Manual", "Technician Experience", "YouTube"
  verified: boolean('verified').default(false),
  verifiedBy: varchar('verified_by', { length: 255 }),
  verificationDate: timestamp('verification_date'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  viewCount: integer('view_count').default(0),
  helpfulCount: integer('helpful_count').default(0),
});

export const repairSessionsTable = pgTable('repair_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  vehicleId: text('vehicle_id').notNull(),
  diagnosticId: text('diagnostic_id'),
  procedureId: text('procedure_id').notNull(),
  
  // Session tracking
  status: varchar('status', { length: 50 }).notNull(), // started, in_progress, completed, paused
  startedAt: timestamp('started_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  totalTimeSpent: integer('total_time_spent'), // in minutes
  
  // Progress tracking
  currentStep: integer('current_step').default(0),
  completedSteps: array(integer('completed_steps')),
  skippedSteps: array(integer('skipped_steps')),
  
  // Documentation
  photos: jsonb('photos'), // Array of { stepNumber, photoUrl, timestamp, notes }
  notes: text('notes'),
  observations: text('observations'),
  
  // Results
  actualTimeSpent: integer('actual_time_spent'), // in minutes
  actualCostSpent: numeric('actual_cost_spent'),
  partsUsed: jsonb('parts_used'), // Array of { partName, partNumber, quantity, costPerUnit }
  toolsUsed: array(text('tools_used')),
  
  // Feedback
  difficulty: varchar('difficulty', { length: 50 }), // User's feedback on difficulty
  successRating: integer('success_rating'), // 1-5 scale
  issues: array(text('issues')), // Any issues encountered
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const procedureStepsTable = pgTable('procedure_steps', {
  id: text('id').primaryKey(),
  procedureId: text('procedure_id').notNull(),
  stepNumber: integer('step_number').notNull(),
  
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  detailedInstructions: text('detailed_instructions'),
  
  // Step-specific details
  toolsRequired: array(text('tools_required')),
  partsRequired: jsonb('parts_required'),
  estimatedTimeMinutes: integer('estimated_time_minutes'),
  
  // Media
  imageUrl: varchar('image_url', { length: 500 }),
  videoUrl: varchar('video_url', { length: 500 }),
  diagramUrl: varchar('diagram_url', { length: 500 }),
  
  // Warnings and tips
  warnings: array(text('warnings')),
  tips: array(text('tips')),
  commonMistakes: array(text('common_mistakes')),
  
  // Alternative methods
  alternativeMethods: jsonb('alternative_methods'), // Array of alternative step descriptions
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const repairFeedbackTable = pgTable('repair_feedback', {
  id: text('id').primaryKey(),
  procedureId: text('procedure_id').notNull(),
  userId: text('user_id').notNull(),
  
  rating: integer('rating').notNull(), // 1-5
  comment: text('comment'),
  
  // Specific feedback
  accuracyRating: integer('accuracy_rating'), // 1-5
  clarityRating: integer('clarity_rating'), // 1-5
  completenessRating: integer('completeness_rating'), // 1-5
  
  // Issues reported
  issuesFound: array(text('issues_found')),
  suggestedImprovements: text('suggested_improvements'),
  
  // Time and cost feedback
  actualTimeVsEstimate: varchar('actual_time_vs_estimate', { length: 50 }), // faster, accurate, slower
  actualCostVsEstimate: varchar('actual_cost_vs_estimate', { length: 50 }), // cheaper, accurate, expensive
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const insertRepairProcedureSchema = createInsertSchema(repairProceduresTable);
export const selectRepairProcedureSchema = createSelectSchema(repairProceduresTable);

export const insertRepairSessionSchema = createInsertSchema(repairSessionsTable);
export const selectRepairSessionSchema = createSelectSchema(repairSessionsTable);

export const insertProcedureStepSchema = createInsertSchema(procedureStepsTable);
export const selectProcedureStepSchema = createSelectSchema(procedureStepsTable);

export const insertRepairFeedbackSchema = createInsertSchema(repairFeedbackTable);
export const selectRepairFeedbackSchema = createSelectSchema(repairFeedbackTable);

export type RepairProcedure = typeof repairProceduresTable.$inferSelect;
export type InsertRepairProcedure = typeof repairProceduresTable.$inferInsert;

export type RepairSession = typeof repairSessionsTable.$inferSelect;
export type InsertRepairSession = typeof repairSessionsTable.$inferInsert;

export type ProcedureStep = typeof procedureStepsTable.$inferSelect;
export type InsertProcedureStep = typeof procedureStepsTable.$inferInsert;

export type RepairFeedback = typeof repairFeedbackTable.$inferSelect;
export type InsertRepairFeedback = typeof repairFeedbackTable.$inferInsert;
