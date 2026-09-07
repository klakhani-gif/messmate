CREATE TABLE `requests` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`area` text NOT NULL,
	`details` text NOT NULL,
	`provider` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `requests_created_idx` ON `requests` (`created_at`);