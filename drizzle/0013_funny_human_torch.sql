CREATE TABLE `diagnosticBookmarks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`diagnosticId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `diagnosticBookmarks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `diagnosticNotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`diagnosticId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `diagnosticNotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `diagnosticTags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`diagnosticId` int NOT NULL,
	`userId` int NOT NULL,
	`tag` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `diagnosticTags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `diagnosticBookmarks` ADD CONSTRAINT `diagnosticBookmarks_diagnosticId_diagnostics_id_fk` FOREIGN KEY (`diagnosticId`) REFERENCES `diagnostics`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `diagnosticBookmarks` ADD CONSTRAINT `diagnosticBookmarks_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `diagnosticNotes` ADD CONSTRAINT `diagnosticNotes_diagnosticId_diagnostics_id_fk` FOREIGN KEY (`diagnosticId`) REFERENCES `diagnostics`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `diagnosticNotes` ADD CONSTRAINT `diagnosticNotes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `diagnosticTags` ADD CONSTRAINT `diagnosticTags_diagnosticId_diagnostics_id_fk` FOREIGN KEY (`diagnosticId`) REFERENCES `diagnostics`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `diagnosticTags` ADD CONSTRAINT `diagnosticTags_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;