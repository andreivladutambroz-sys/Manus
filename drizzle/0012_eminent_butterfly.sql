ALTER TABLE `users` ADD `hourly_rate` decimal(10,2) DEFAULT '50.00';--> statement-breakpoint
ALTER TABLE `users` ADD `currency` varchar(10) DEFAULT 'USD';--> statement-breakpoint
ALTER TABLE `users` ADD `rate_updated_at` timestamp DEFAULT (now());