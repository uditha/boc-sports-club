DROP INDEX `results_player_event_uniq`;--> statement-breakpoint
ALTER TABLE `results` ADD `age_category` text;--> statement-breakpoint
ALTER TABLE `results` ADD `performance` text;--> statement-breakpoint
CREATE UNIQUE INDEX `results_player_event_discipline_uniq` ON `results` (`player_id`,`event_id`,`discipline`,`gender`,`age_category`);