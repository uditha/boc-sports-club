CREATE TABLE `sport_disciplines` (
	`id` text PRIMARY KEY NOT NULL,
	`sport_id` text NOT NULL,
	`name` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`sport_id`) REFERENCES `sports`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sport_discipline_uniq` ON `sport_disciplines` (`sport_id`,`name`);--> statement-breakpoint
ALTER TABLE `results` ADD `discipline` text;