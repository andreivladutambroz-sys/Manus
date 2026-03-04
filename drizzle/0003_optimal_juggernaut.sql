CREATE TABLE `diagnosticImages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`diagnosticId` int NOT NULL,
	`imageUrl` varchar(500) NOT NULL,
	`description` text,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `diagnosticImages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`diagnosticId` int,
	`type` enum('analysis_complete','diagnostic_saved','system_alert') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `diagnosticImages` ADD CONSTRAINT `diagnosticImages_diagnosticId_diagnostics_id_fk` FOREIGN KEY (`diagnosticId`) REFERENCES `diagnostics`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_diagnosticId_diagnostics_id_fk` FOREIGN KEY (`diagnosticId`) REFERENCES `diagnostics`(`id`) ON DELETE cascade ON UPDATE no action;