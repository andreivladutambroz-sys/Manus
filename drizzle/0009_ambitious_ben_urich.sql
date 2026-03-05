CREATE TABLE `dataImportStatus` (
	`id` int AUTO_INCREMENT NOT NULL,
	`import_type` varchar(50) NOT NULL,
	`status` enum('pending','in_progress','completed','failed') NOT NULL,
	`total_records` int,
	`processed_records` int DEFAULT 0,
	`failed_records` int DEFAULT 0,
	`error_message` text,
	`started_at` timestamp NOT NULL DEFAULT (now()),
	`completed_at` timestamp,
	`duration_seconds` int,
	CONSTRAINT `dataImportStatus_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `engines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`engine_code` varchar(50),
	`engine_name` varchar(150) NOT NULL,
	`displacement_cc` int,
	`displacement_liters` decimal(5,2),
	`power_kw` int,
	`power_hp` int,
	`torque_nm` int,
	`fuel_type` varchar(50),
	`cylinders` int,
	`valves` int,
	`turbo` boolean DEFAULT false,
	`supercharged` boolean DEFAULT false,
	`co2_emissions` int,
	`combined_consumption` decimal(5,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `engines_id` PRIMARY KEY(`id`),
	CONSTRAINT `engines_engine_code_unique` UNIQUE(`engine_code`)
);
--> statement-breakpoint
CREATE TABLE `generations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`model_id` int NOT NULL,
	`generation_name` varchar(100),
	`start_year` int NOT NULL,
	`end_year` int,
	`carquery_id` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `generations_id` PRIMARY KEY(`id`),
	CONSTRAINT `generations_carquery_id_unique` UNIQUE(`carquery_id`)
);
--> statement-breakpoint
CREATE TABLE `manufacturers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`country` varchar(100),
	`carqueryId` varchar(100),
	`nhtsa_id` varchar(50),
	`logo_url` varchar(500),
	`founded_year` int,
	`is_active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `manufacturers_id` PRIMARY KEY(`id`),
	CONSTRAINT `manufacturers_name_unique` UNIQUE(`name`),
	CONSTRAINT `manufacturers_carqueryId_unique` UNIQUE(`carqueryId`),
	CONSTRAINT `manufacturers_nhtsa_id_unique` UNIQUE(`nhtsa_id`)
);
--> statement-breakpoint
CREATE TABLE `models` (
	`id` int AUTO_INCREMENT NOT NULL,
	`manufacturer_id` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`carquery_id` varchar(100),
	`body_type` varchar(50),
	`class` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `models_id` PRIMARY KEY(`id`),
	CONSTRAINT `models_carquery_id_unique` UNIQUE(`carquery_id`)
);
--> statement-breakpoint
CREATE TABLE `vehicleVariants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`generation_id` int NOT NULL,
	`engine_id` int NOT NULL,
	`trim_name` varchar(150),
	`transmission` varchar(50),
	`drivetrain` varchar(50),
	`production_start` int,
	`production_end` int,
	`seats` int,
	`doors` int,
	`length_mm` int,
	`width_mm` int,
	`height_mm` int,
	`wheelbase_mm` int,
	`curb_weight_kg` int,
	`gvwr_kg` int,
	`carquery_id` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vehicleVariants_id` PRIMARY KEY(`id`),
	CONSTRAINT `vehicleVariants_carquery_id_unique` UNIQUE(`carquery_id`)
);
--> statement-breakpoint
CREATE TABLE `vinDecodeCache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vin` varchar(17) NOT NULL,
	`manufacturer_id` int,
	`model_id` int,
	`generation_id` int,
	`variant_id` int,
	`engine_id` int,
	`year` int,
	`manufacturer_name` varchar(100),
	`model_name` varchar(100),
	`engine_name` varchar(150),
	`trim_name` varchar(150),
	`source` varchar(50),
	`raw_response` json,
	`expires_at` timestamp,
	`hit_count` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vinDecodeCache_id` PRIMARY KEY(`id`),
	CONSTRAINT `vinDecodeCache_vin_unique` UNIQUE(`vin`)
);
--> statement-breakpoint
CREATE TABLE `vinPatterns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`wmi` varchar(3) NOT NULL,
	`vds_pattern` varchar(100),
	`year_code` varchar(1),
	`vehicle_variant_id` int,
	`manufacturer_id` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vinPatterns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `generations` ADD CONSTRAINT `generations_model_id_models_id_fk` FOREIGN KEY (`model_id`) REFERENCES `models`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `models` ADD CONSTRAINT `models_manufacturer_id_manufacturers_id_fk` FOREIGN KEY (`manufacturer_id`) REFERENCES `manufacturers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vehicleVariants` ADD CONSTRAINT `vehicleVariants_generation_id_generations_id_fk` FOREIGN KEY (`generation_id`) REFERENCES `generations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vehicleVariants` ADD CONSTRAINT `vehicleVariants_engine_id_engines_id_fk` FOREIGN KEY (`engine_id`) REFERENCES `engines`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vinDecodeCache` ADD CONSTRAINT `vinDecodeCache_manufacturer_id_manufacturers_id_fk` FOREIGN KEY (`manufacturer_id`) REFERENCES `manufacturers`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vinDecodeCache` ADD CONSTRAINT `vinDecodeCache_model_id_models_id_fk` FOREIGN KEY (`model_id`) REFERENCES `models`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vinDecodeCache` ADD CONSTRAINT `vinDecodeCache_generation_id_generations_id_fk` FOREIGN KEY (`generation_id`) REFERENCES `generations`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vinDecodeCache` ADD CONSTRAINT `vinDecodeCache_variant_id_vehicleVariants_id_fk` FOREIGN KEY (`variant_id`) REFERENCES `vehicleVariants`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vinDecodeCache` ADD CONSTRAINT `vinDecodeCache_engine_id_engines_id_fk` FOREIGN KEY (`engine_id`) REFERENCES `engines`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vinPatterns` ADD CONSTRAINT `vinPatterns_vehicle_variant_id_vehicleVariants_id_fk` FOREIGN KEY (`vehicle_variant_id`) REFERENCES `vehicleVariants`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vinPatterns` ADD CONSTRAINT `vinPatterns_manufacturer_id_manufacturers_id_fk` FOREIGN KEY (`manufacturer_id`) REFERENCES `manufacturers`(`id`) ON DELETE cascade ON UPDATE no action;