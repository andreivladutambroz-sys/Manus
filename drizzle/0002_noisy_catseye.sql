ALTER TABLE `diagnostics` MODIFY COLUMN `symptomsSelected` json;--> statement-breakpoint
ALTER TABLE `diagnostics` MODIFY COLUMN `imageUrls` json;--> statement-breakpoint
ALTER TABLE `profiles` MODIFY COLUMN `specializations` json;