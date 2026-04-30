CREATE TYPE "public"."guide_source" AS ENUM('auto', 'manual', 'hybrid');--> statement-breakpoint
CREATE TYPE "public"."persona_source" AS ENUM('nemotron', 'custom', 'synthesized');--> statement-breakpoint
CREATE TYPE "public"."report_kind" AS ENUM('exec', 'full', 'deck');--> statement-breakpoint
CREATE TYPE "public"."run_status" AS ENUM('queued', 'running', 'succeeded', 'failed', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."stimulus_kind" AS ENUM('concept', 'copy', 'ux_screen', 'ad_creative', 'policy', 'brand', 'channel', 'feature', 'price', 'competitor');--> statement-breakpoint
CREATE TYPE "public"."study_status" AS ENUM('draft', 'running', 'done', 'archived');--> statement-breakpoint
CREATE TABLE "calibration" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"study_id" uuid NOT NULL,
	"real_fgi_summary" jsonb DEFAULT '{}'::jsonb,
	"deltas" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"run_id" uuid NOT NULL,
	"seq" integer NOT NULL,
	"ts" timestamp with time zone DEFAULT now() NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guide" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"study_id" uuid NOT NULL,
	"sections" jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"source" "guide_source" DEFAULT 'auto' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insight" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"segment" text NOT NULL,
	"theme" text NOT NULL,
	"quote" text,
	"strength" numeric(3, 2) DEFAULT '0',
	"persona_ids" text[] DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "panel_spec" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"study_id" uuid NOT NULL,
	"filters" jsonb DEFAULT '{}'::jsonb,
	"quotas" jsonb DEFAULT '[]'::jsonb,
	"diversity" text DEFAULT 'medium' NOT NULL,
	"size" integer DEFAULT 8 NOT NULL,
	"seed" integer DEFAULT 42 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "persona" (
	"id" text PRIMARY KEY NOT NULL,
	"source" "persona_source" DEFAULT 'nemotron' NOT NULL,
	"source_uuid" text,
	"name" text NOT NULL,
	"sex" text NOT NULL,
	"age" integer NOT NULL,
	"province" text NOT NULL,
	"district" text NOT NULL,
	"occupation" text NOT NULL,
	"marital_status" text,
	"family_type" text,
	"housing_type" text,
	"education_level" text,
	"fields" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"tags" text[] DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"kind" "report_kind" DEFAULT 'exec' NOT NULL,
	"pdf_blob_url" text,
	"summary" jsonb DEFAULT '{}'::jsonb,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "run" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"study_id" uuid NOT NULL,
	"stimulus_id" uuid,
	"guide_id" uuid,
	"panel_ids" text[] DEFAULT '{}' NOT NULL,
	"models" jsonb DEFAULT '{}'::jsonb,
	"seed" integer DEFAULT 42 NOT NULL,
	"prompt_hash" varchar(64),
	"status" "run_status" DEFAULT 'queued' NOT NULL,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"metrics" jsonb DEFAULT '{}'::jsonb,
	"verdict" jsonb DEFAULT '{}'::jsonb,
	"cost_usd" numeric(10, 4) DEFAULT '0',
	"tokens_in" integer DEFAULT 0,
	"tokens_out" integer DEFAULT 0,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_segment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner" text DEFAULT 'default' NOT NULL,
	"name" text NOT NULL,
	"filters" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stimulus" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"study_id" uuid NOT NULL,
	"kind" "stimulus_kind" NOT NULL,
	"title" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"competitors" text[] DEFAULT '{}',
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner" text DEFAULT 'default' NOT NULL,
	"title" text NOT NULL,
	"objective" text NOT NULL,
	"research_questions" jsonb DEFAULT '[]'::jsonb,
	"tags" text[] DEFAULT '{}',
	"status" "study_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "template_guide" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "stimulus_kind" NOT NULL,
	"sections" jsonb NOT NULL,
	"owner" text DEFAULT 'system' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "template_stimulus" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "stimulus_kind" NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"fields" jsonb DEFAULT '{}'::jsonb,
	"owner" text DEFAULT 'system' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "calibration" ADD CONSTRAINT "calibration_study_id_study_id_fk" FOREIGN KEY ("study_id") REFERENCES "public"."study"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_run_id_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guide" ADD CONSTRAINT "guide_study_id_study_id_fk" FOREIGN KEY ("study_id") REFERENCES "public"."study"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insight" ADD CONSTRAINT "insight_run_id_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panel_spec" ADD CONSTRAINT "panel_spec_study_id_study_id_fk" FOREIGN KEY ("study_id") REFERENCES "public"."study"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_run_id_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "run" ADD CONSTRAINT "run_study_id_study_id_fk" FOREIGN KEY ("study_id") REFERENCES "public"."study"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "run" ADD CONSTRAINT "run_stimulus_id_stimulus_id_fk" FOREIGN KEY ("stimulus_id") REFERENCES "public"."stimulus"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "run" ADD CONSTRAINT "run_guide_id_guide_id_fk" FOREIGN KEY ("guide_id") REFERENCES "public"."guide"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stimulus" ADD CONSTRAINT "stimulus_study_id_study_id_fk" FOREIGN KEY ("study_id") REFERENCES "public"."study"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "event_run_seq_idx" ON "event" USING btree ("run_id","seq");--> statement-breakpoint
CREATE INDEX "guide_study_idx" ON "guide" USING btree ("study_id");--> statement-breakpoint
CREATE INDEX "insight_run_idx" ON "insight" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "panel_spec_study_idx" ON "panel_spec" USING btree ("study_id");--> statement-breakpoint
CREATE INDEX "persona_province_idx" ON "persona" USING btree ("province");--> statement-breakpoint
CREATE INDEX "persona_age_idx" ON "persona" USING btree ("age");--> statement-breakpoint
CREATE INDEX "persona_sex_idx" ON "persona" USING btree ("sex");--> statement-breakpoint
CREATE INDEX "persona_occupation_idx" ON "persona" USING btree ("occupation");--> statement-breakpoint
CREATE INDEX "persona_fields_gin" ON "persona" USING gin ("fields");--> statement-breakpoint
CREATE INDEX "report_run_idx" ON "report" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "run_study_idx" ON "run" USING btree ("study_id");--> statement-breakpoint
CREATE INDEX "run_status_idx" ON "run" USING btree ("status");--> statement-breakpoint
CREATE INDEX "stimulus_study_idx" ON "stimulus" USING btree ("study_id");--> statement-breakpoint
CREATE INDEX "study_owner_idx" ON "study" USING btree ("owner");--> statement-breakpoint
CREATE INDEX "study_status_idx" ON "study" USING btree ("status");