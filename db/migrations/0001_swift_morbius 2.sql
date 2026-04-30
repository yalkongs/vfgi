ALTER TABLE "run" ADD COLUMN "compare_group" uuid;--> statement-breakpoint
ALTER TABLE "run" ADD COLUMN "compare_label" text;--> statement-breakpoint
CREATE INDEX "run_compare_group_idx" ON "run" USING btree ("compare_group");