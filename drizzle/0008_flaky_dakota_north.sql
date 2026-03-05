CREATE TABLE `componentHealthScores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vehicleId` int NOT NULL,
	`component` varchar(100) NOT NULL,
	`componentCode` varchar(50),
	`healthScore` decimal(5,2) NOT NULL,
	`lastAssessmentDate` timestamp,
	`trend` enum('improving','stable','degrading') NOT NULL DEFAULT 'stable',
	`trendData` json,
	`knownIssues` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `componentHealthScores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `failurePredictions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vehicleId` int NOT NULL,
	`component` varchar(100) NOT NULL,
	`componentCode` varchar(50),
	`failureRisk` decimal(5,2) NOT NULL,
	`riskLevel` enum('critical','high','medium','low') NOT NULL,
	`predictedFailureDate` timestamp,
	`reason` text,
	`historicalPattern` json,
	`recommendedAction` text,
	`estimatedCost` decimal(10,2),
	`confidence` decimal(5,2) NOT NULL,
	`dataPoints` int DEFAULT 0,
	`status` enum('active','dismissed','confirmed_failure','preventive_maintenance_done') NOT NULL DEFAULT 'active',
	`dismissedAt` timestamp,
	`dismissedReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `failurePredictions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `maintenanceRecommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vehicleId` int NOT NULL,
	`maintenanceType` varchar(100) NOT NULL,
	`description` text,
	`triggerType` enum('mileage','time','prediction','manual') NOT NULL,
	`triggerValue` int,
	`recommendedDate` timestamp,
	`urgency` enum('critical','high','medium','low') NOT NULL DEFAULT 'medium',
	`estimatedCost` decimal(10,2),
	`estimatedTime` varchar(50),
	`status` enum('pending','scheduled','completed','dismissed') NOT NULL DEFAULT 'pending',
	`completedAt` timestamp,
	`predictionId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `maintenanceRecommendations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vehicleHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vehicleId` int NOT NULL,
	`totalDiagnostics` int NOT NULL DEFAULT 0,
	`lastDiagnosticDate` timestamp,
	`commonIssues` json,
	`totalRepairs` int NOT NULL DEFAULT 0,
	`lastRepairDate` timestamp,
	`repairCost` decimal(10,2),
	`currentMileage` int,
	`mileageHistory` json,
	`healthScore` decimal(5,2) DEFAULT '100',
	`lastHealthUpdate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vehicleHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `componentHealthScores` ADD CONSTRAINT `componentHealthScores_vehicleId_vehicles_id_fk` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `failurePredictions` ADD CONSTRAINT `failurePredictions_vehicleId_vehicles_id_fk` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `maintenanceRecommendations` ADD CONSTRAINT `maintenanceRecommendations_vehicleId_vehicles_id_fk` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `maintenanceRecommendations` ADD CONSTRAINT `maintenanceRecommendations_predictionId_failurePredictions_id_fk` FOREIGN KEY (`predictionId`) REFERENCES `failurePredictions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vehicleHistory` ADD CONSTRAINT `vehicleHistory_vehicleId_vehicles_id_fk` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles`(`id`) ON DELETE cascade ON UPDATE no action;