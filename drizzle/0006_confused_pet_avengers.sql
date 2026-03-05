CREATE TABLE `vehicleMotorizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`brand` varchar(50) NOT NULL,
	`model` varchar(100) NOT NULL,
	`yearFrom` int NOT NULL,
	`yearTo` int NOT NULL,
	`engineName` varchar(100) NOT NULL,
	`engineCode` varchar(20) NOT NULL,
	`engineType` varchar(50) NOT NULL,
	`displacement` varchar(20),
	`power` varchar(20),
	`torque` varchar(20),
	`fuelType` varchar(20),
	`transmission` varchar(50),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vehicleMotorizations_id` PRIMARY KEY(`id`)
);
