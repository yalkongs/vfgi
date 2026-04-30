ALTER TABLE "run" ADD COLUMN "realism_scores" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "run" ADD COLUMN "precision_mode" text DEFAULT 'off';