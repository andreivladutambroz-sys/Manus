CREATE TABLE `accuracyMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dimension` enum('brand','model','symptom_category','error_code','agent','overall') NOT NULL,
	`dimensionValue` varchar(200) NOT NULL,
	`totalDiagnostics` int NOT NULL DEFAULT 0,
	`correctDiagnostics` int NOT NULL DEFAULT 0,
	`partiallyCorrect` int NOT NULL DEFAULT 0,
	`incorrectDiagnostics` int NOT NULL DEFAULT 0,
	`avgAccuracy` decimal(5,2),
	`avgFeedbackScore` decimal(3,2),
	`trend` enum('improving','stable','declining') NOT NULL DEFAULT 'stable',
	`periodStart` timestamp NOT NULL,
	`periodEnd` timestamp NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accuracyMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `diagnosticFeedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`diagnosticId` int NOT NULL,
	`userId` int NOT NULL,
	`overallRating` int NOT NULL,
	`accuracyRating` int NOT NULL,
	`usefulnessRating` int NOT NULL,
	`causesFeedback` json,
	`actualCause` text,
	`actualParts` json,
	`actualCost` decimal(10,2),
	`actualTime` varchar(50),
	`mechanicNotes` text,
	`wasResolved` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `diagnosticFeedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learnedPatterns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`brand` varchar(50) NOT NULL,
	`model` varchar(100),
	`yearFrom` int,
	`yearTo` int,
	`engineCode` varchar(20),
	`symptomPattern` text NOT NULL,
	`errorCodes` json,
	`confirmedCause` text NOT NULL,
	`confirmedSolution` text NOT NULL,
	`confirmedParts` json,
	`timesConfirmed` int NOT NULL DEFAULT 1,
	`avgAccuracy` decimal(5,2),
	`avgCost` decimal(10,2),
	`avgRepairTime` varchar(50),
	`sourceType` enum('mechanic_feedback','manual_entry','auto_detected') NOT NULL,
	`confidence` decimal(5,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learnedPatterns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `promptVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentName` varchar(50) NOT NULL,
	`version` int NOT NULL,
	`promptText` text NOT NULL,
	`temperature` decimal(3,2),
	`maxTokens` int,
	`totalUses` int NOT NULL DEFAULT 0,
	`avgAccuracy` decimal(5,2),
	`avgFeedbackScore` decimal(3,2),
	`successRate` decimal(5,2),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `promptVersions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `diagnosticFeedback` ADD CONSTRAINT `diagnosticFeedback_diagnosticId_diagnostics_id_fk` FOREIGN KEY (`diagnosticId`) REFERENCES `diagnostics`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `diagnosticFeedback` ADD CONSTRAINT `diagnosticFeedback_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;