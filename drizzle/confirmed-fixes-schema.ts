import { mysqlTable, varchar, text, int, timestamp, boolean, decimal, index } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

// Technician-Confirmed Fixes Database Schema

export const confirmedFixes = mysqlTable(
  "confirmed_fixes",
  {
    id: varchar("id", { length: 36 }).primaryKey().default("uuid()"),
    errorCode: varchar("error_code", { length: 10 }).notNull(), // P0101, P0128, etc.
    brand: varchar("brand", { length: 50 }).notNull(), // Volkswagen, BMW, etc.
    model: varchar("model", { length: 50 }).notNull(), // Golf, 320i, etc.
    year: int("year"), // 2010, 2015, 2020, etc.
    engineType: varchar("engine_type", { length: 50 }), // TDI, TSI, Diesel, Petrol, etc.
    title: varchar("title", { length: 255 }).notNull(), // "MAF Sensor Cleaning Fixed P0101"
    description: text("description").notNull(), // Detailed fix description
    solution: text("solution").notNull(), // Step-by-step solution
    toolsRequired: text("tools_required"), // JSON array of tools
    partsNeeded: text("parts_needed"), // JSON array of parts with part numbers
    estimatedTime: int("estimated_time"), // minutes
    estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }), // USD
    difficulty: varchar("difficulty", { length: 20 }), // easy, moderate, difficult, expert
    successRate: decimal("success_rate", { precision: 5, scale: 2 }), // 0-100%
    totalVotes: int("total_votes").default(0),
    upvotes: int("upvotes").default(0),
    downvotes: int("downvotes").default(0),
    averageRating: decimal("average_rating", { precision: 3, scale: 2 }), // 0-5
    views: int("views").default(0),
    helpful: int("helpful").default(0),
    notHelpful: int("not_helpful").default(0),
    submittedBy: varchar("submitted_by", { length: 36 }).notNull(), // User ID
    submittedAt: timestamp("submitted_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
    verified: boolean("verified").default(false), // Admin verified
    verifiedBy: varchar("verified_by", { length: 36 }), // Admin user ID
    verifiedAt: timestamp("verified_at"),
    featured: boolean("featured").default(false), // Featured on homepage
    active: boolean("active").default(true),
  },
  (table) => ({
    errorCodeIdx: index("error_code_idx").on(table.errorCode),
    brandModelIdx: index("brand_model_idx").on(table.brand, table.model),
    verifiedIdx: index("verified_idx").on(table.verified),
    successRateIdx: index("success_rate_idx").on(table.successRate),
  })
);

export const fixVotes = mysqlTable(
  "fix_votes",
  {
    id: varchar("id", { length: 36 }).primaryKey().default("uuid()"),
    fixId: varchar("fix_id", { length: 36 }).notNull(),
    userId: varchar("user_id", { length: 36 }).notNull(),
    voteType: varchar("vote_type", { length: 10 }).notNull(), // upvote, downvote
    helpful: boolean("helpful"), // Was this fix helpful?
    rating: int("rating"), // 1-5 stars
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    fixUserIdx: index("fix_user_idx").on(table.fixId, table.userId),
  })
);

export const fixComments = mysqlTable(
  "fix_comments",
  {
    id: varchar("id", { length: 36 }).primaryKey().default("uuid()"),
    fixId: varchar("fix_id", { length: 36 }).notNull(),
    userId: varchar("user_id", { length: 36 }).notNull(),
    userName: varchar("user_name", { length: 100 }).notNull(),
    comment: text("comment").notNull(),
    upvotes: int("upvotes").default(0),
    downvotes: int("downvotes").default(0),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => ({
    fixIdx: index("fix_idx").on(table.fixId),
  })
);

export const fixPhotos = mysqlTable(
  "fix_photos",
  {
    id: varchar("id", { length: 36 }).primaryKey().default("uuid()"),
    fixId: varchar("fix_id", { length: 36 }).notNull(),
    photoUrl: varchar("photo_url", { length: 500 }).notNull(),
    caption: varchar("caption", { length: 255 }),
    stepNumber: int("step_number"), // Which step this photo is for
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    fixIdx: index("fix_idx").on(table.fixId),
  })
);

export const fixVideos = mysqlTable(
  "fix_videos",
  {
    id: varchar("id", { length: 36 }).primaryKey().default("uuid()"),
    fixId: varchar("fix_id", { length: 36 }).notNull(),
    videoUrl: varchar("video_url", { length: 500 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    duration: int("duration"), // seconds
    source: varchar("source", { length: 50 }), // youtube, vimeo, etc.
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    fixIdx: index("fix_idx").on(table.fixId),
  })
);

export const fixStatistics = mysqlTable(
  "fix_statistics",
  {
    id: varchar("id", { length: 36 }).primaryKey().default("uuid()"),
    fixId: varchar("fix_id", { length: 36 }).notNull(),
    dayDate: timestamp("day_date").notNull(),
    views: int("views").default(0),
    upvotes: int("upvotes").default(0),
    downvotes: int("downvotes").default(0),
    helpful: int("helpful").default(0),
    notHelpful: int("not_helpful").default(0),
    comments: int("comments").default(0),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    fixDateIdx: index("fix_date_idx").on(table.fixId, table.dayDate),
  })
);

// Relations
export const confirmedFixesRelations = relations(confirmedFixes, ({ many }) => ({
  votes: many(fixVotes),
  comments: many(fixComments),
  photos: many(fixPhotos),
  videos: many(fixVideos),
  statistics: many(fixStatistics),
}));

export const fixVotesRelations = relations(fixVotes, ({ one }) => ({
  fix: one(confirmedFixes, {
    fields: [fixVotes.fixId],
    references: [confirmedFixes.id],
  }),
}));

export const fixCommentsRelations = relations(fixComments, ({ one }) => ({
  fix: one(confirmedFixes, {
    fields: [fixComments.fixId],
    references: [confirmedFixes.id],
  }),
}));

export const fixPhotosRelations = relations(fixPhotos, ({ one }) => ({
  fix: one(confirmedFixes, {
    fields: [fixPhotos.fixId],
    references: [confirmedFixes.id],
  }),
}));

export const fixVideosRelations = relations(fixVideos, ({ one }) => ({
  fix: one(confirmedFixes, {
    fields: [fixVideos.fixId],
    references: [confirmedFixes.id],
  }),
}));

export const fixStatisticsRelations = relations(fixStatistics, ({ one }) => ({
  fix: one(confirmedFixes, {
    fields: [fixStatistics.fixId],
    references: [confirmedFixes.id],
  }),
}));
