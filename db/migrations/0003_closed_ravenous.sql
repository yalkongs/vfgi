ALTER TABLE "calibration" ADD COLUMN "run_id" uuid;--> statement-breakpoint
ALTER TABLE "calibration" ADD COLUMN "title" text DEFAULT '외부 FGI 비교' NOT NULL;--> statement-breakpoint
ALTER TABLE "calibration" ADD CONSTRAINT "calibration_run_id_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."run"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "calibration_study_idx" ON "calibration" USING btree ("study_id");