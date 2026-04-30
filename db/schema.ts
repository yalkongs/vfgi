import {
  pgTable,
  pgEnum,
  text,
  uuid,
  varchar,
  integer,
  jsonb,
  timestamp,
  numeric,
  index,
  primaryKey,
  bigserial,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const stimulusKindEnum = pgEnum("stimulus_kind", [
  "concept",
  "copy",
  "ux_screen",
  "ad_creative",
  "policy",
  "brand",
  "channel",
  "feature",
  "price",
  "competitor",
]);

export const guideSourceEnum = pgEnum("guide_source", [
  "auto",
  "manual",
  "hybrid",
]);

export const personaSourceEnum = pgEnum("persona_source", [
  "nemotron",
  "custom",
  "synthesized",
]);

export const studyStatusEnum = pgEnum("study_status", [
  "draft",
  "running",
  "done",
  "archived",
]);

export const runStatusEnum = pgEnum("run_status", [
  "queued",
  "running",
  "succeeded",
  "failed",
  "canceled",
]);

export const reportKindEnum = pgEnum("report_kind", ["exec", "full", "deck"]);

export const study = pgTable(
  "study",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    owner: text("owner").notNull().default("default"),
    title: text("title").notNull(),
    objective: text("objective").notNull(),
    researchQuestions: jsonb("research_questions").$type<string[]>().default([]),
    tags: text("tags").array().default([]),
    status: studyStatusEnum("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("study_owner_idx").on(t.owner),
    index("study_status_idx").on(t.status),
  ]
);

export const stimulus = pgTable(
  "stimulus",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studyId: uuid("study_id").notNull().references(() => study.id, { onDelete: "cascade" }),
    kind: stimulusKindEnum("kind").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    attachments: jsonb("attachments").$type<Array<{
      url: string;
      contentType: string;
      name: string;
    }>>().default([]),
    competitors: text("competitors").array().default([]),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("stimulus_study_idx").on(t.studyId)]
);

export const panelSpec = pgTable(
  "panel_spec",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studyId: uuid("study_id").notNull().references(() => study.id, { onDelete: "cascade" }),
    filters: jsonb("filters").$type<Record<string, unknown>>().default({}),
    quotas: jsonb("quotas").$type<Array<Record<string, unknown>>>().default([]),
    diversity: text("diversity").notNull().default("medium"),
    size: integer("size").notNull().default(8),
    seed: integer("seed").notNull().default(42),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("panel_spec_study_idx").on(t.studyId)]
);

export const guide = pgTable(
  "guide",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studyId: uuid("study_id").notNull().references(() => study.id, { onDelete: "cascade" }),
    sections: jsonb("sections").$type<Array<{
      key: string;
      title: string;
      prompts: string[];
    }>>().notNull(),
    version: integer("version").notNull().default(1),
    source: guideSourceEnum("source").notNull().default("auto"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("guide_study_idx").on(t.studyId)]
);

export const persona = pgTable(
  "persona",
  {
    id: text("id").primaryKey(),
    source: personaSourceEnum("source").notNull().default("nemotron"),
    sourceUuid: text("source_uuid"),
    name: text("name").notNull(),
    sex: text("sex").notNull(),
    age: integer("age").notNull(),
    province: text("province").notNull(),
    district: text("district").notNull(),
    occupation: text("occupation").notNull(),
    maritalStatus: text("marital_status"),
    familyType: text("family_type"),
    housingType: text("housing_type"),
    educationLevel: text("education_level"),
    fields: jsonb("fields").$type<Record<string, unknown>>().notNull().default({}),
    tags: text("tags").array().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("persona_province_idx").on(t.province),
    index("persona_age_idx").on(t.age),
    index("persona_sex_idx").on(t.sex),
    index("persona_occupation_idx").on(t.occupation),
    index("persona_fields_gin").using("gin", t.fields),
  ]
);

export const run = pgTable(
  "run",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studyId: uuid("study_id").notNull().references(() => study.id, { onDelete: "cascade" }),
    stimulusId: uuid("stimulus_id").references(() => stimulus.id, { onDelete: "set null" }),
    guideId: uuid("guide_id").references(() => guide.id, { onDelete: "set null" }),
    panelIds: text("panel_ids").array().notNull().default([]),
    models: jsonb("models").$type<Record<string, string>>().default({}),
    seed: integer("seed").notNull().default(42),
    promptHash: varchar("prompt_hash", { length: 64 }),
    status: runStatusEnum("status").notNull().default("queued"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    metrics: jsonb("metrics").$type<Record<string, unknown>>().default({}),
    verdict: jsonb("verdict").$type<Record<string, unknown>>().default({}),
    costUsd: numeric("cost_usd", { precision: 10, scale: 4 }).default("0"),
    tokensIn: integer("tokens_in").default(0),
    tokensOut: integer("tokens_out").default(0),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("run_study_idx").on(t.studyId),
    index("run_status_idx").on(t.status),
  ]
);

export const event = pgTable(
  "event",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    runId: uuid("run_id").notNull().references(() => run.id, { onDelete: "cascade" }),
    seq: integer("seq").notNull(),
    ts: timestamp("ts", { withTimezone: true }).defaultNow().notNull(),
    type: text("type").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  },
  (t) => [index("event_run_seq_idx").on(t.runId, t.seq)]
);

export const insight = pgTable(
  "insight",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    runId: uuid("run_id").notNull().references(() => run.id, { onDelete: "cascade" }),
    segment: text("segment").notNull(),
    theme: text("theme").notNull(),
    quote: text("quote"),
    strength: numeric("strength", { precision: 3, scale: 2 }).default("0"),
    personaIds: text("persona_ids").array().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("insight_run_idx").on(t.runId)]
);

export const report = pgTable(
  "report",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    runId: uuid("run_id").notNull().references(() => run.id, { onDelete: "cascade" }),
    kind: reportKindEnum("kind").notNull().default("exec"),
    pdfBlobUrl: text("pdf_blob_url"),
    summary: jsonb("summary").$type<Record<string, unknown>>().default({}),
    generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("report_run_idx").on(t.runId)]
);

export const calibration = pgTable("calibration", {
  id: uuid("id").defaultRandom().primaryKey(),
  studyId: uuid("study_id").notNull().references(() => study.id, { onDelete: "cascade" }),
  realFgiSummary: jsonb("real_fgi_summary").$type<Record<string, unknown>>().default({}),
  deltas: jsonb("deltas").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const savedSegment = pgTable("saved_segment", {
  id: uuid("id").defaultRandom().primaryKey(),
  owner: text("owner").notNull().default("default"),
  name: text("name").notNull(),
  filters: jsonb("filters").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const templateStimulus = pgTable("template_stimulus", {
  id: uuid("id").defaultRandom().primaryKey(),
  kind: stimulusKindEnum("kind").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  fields: jsonb("fields").$type<Record<string, unknown>>().default({}),
  owner: text("owner").notNull().default("system"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const templateGuide = pgTable("template_guide", {
  id: uuid("id").defaultRandom().primaryKey(),
  kind: stimulusKindEnum("kind").notNull(),
  sections: jsonb("sections").$type<Array<{
    key: string;
    title: string;
    prompts: string[];
  }>>().notNull(),
  owner: text("owner").notNull().default("system"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Study = typeof study.$inferSelect;
export type NewStudy = typeof study.$inferInsert;
export type Stimulus = typeof stimulus.$inferSelect;
export type NewStimulus = typeof stimulus.$inferInsert;
export type Persona = typeof persona.$inferSelect;
export type NewPersona = typeof persona.$inferInsert;
export type Run = typeof run.$inferSelect;
export type NewRun = typeof run.$inferInsert;
export type Event = typeof event.$inferSelect;
export type Guide = typeof guide.$inferSelect;
export type Insight = typeof insight.$inferSelect;

export const _ensure = sql`select 1`;
