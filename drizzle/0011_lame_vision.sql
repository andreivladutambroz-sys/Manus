ALTER TABLE `repairFeedback` ADD `created_at` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `repairOutcomes` ADD `created_at` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `repairFeedback` DROP COLUMN `timestamp`;--> statement-breakpoint
ALTER TABLE `repairOutcomes` DROP COLUMN `timestamp`;