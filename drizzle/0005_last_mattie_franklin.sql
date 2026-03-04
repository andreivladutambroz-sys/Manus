CREATE TABLE `chatMessages` (
	`id` varchar(36) NOT NULL,
	`chatId` varchar(36) NOT NULL,
	`diagnosticId` int,
	`userId` int NOT NULL,
	`content` json NOT NULL,
	`ordering` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `knowledgeDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uploadedBy` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`category` enum('elsa','etka','autodata','workshop_manual','wiring_diagram','tsi_bulletin','other') NOT NULL,
	`brand` varchar(50),
	`model` varchar(100),
	`yearFrom` int,
	`yearTo` int,
	`engineCode` varchar(20),
	`fileUrl` varchar(500) NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileSize` int,
	`mimeType` varchar(100),
	`extractedText` text,
	`tags` json,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `knowledgeDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `chatMessages` ADD CONSTRAINT `chatMessages_diagnosticId_diagnostics_id_fk` FOREIGN KEY (`diagnosticId`) REFERENCES `diagnostics`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chatMessages` ADD CONSTRAINT `chatMessages_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `knowledgeDocuments` ADD CONSTRAINT `knowledgeDocuments_uploadedBy_users_id_fk` FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;