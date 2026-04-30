import { anthropic } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";

export type AgentRole =
  | "moderator"
  | "panelist"
  | "crosstalk"
  | "adjudicator"
  | "analyst"
  | "reportwriter"
  | "guidebuilder";

export type ModelOverrides = Partial<Record<AgentRole, string>>;

const DEFAULT_MAP: Record<AgentRole, string> = {
  moderator: "claude-sonnet-4-5",
  panelist: "claude-haiku-4-5-20251001",
  crosstalk: "claude-haiku-4-5-20251001",
  adjudicator: "claude-sonnet-4-5",
  analyst: "claude-sonnet-4-5",
  reportwriter: "claude-sonnet-4-5",
  guidebuilder: "claude-sonnet-4-5",
};

function stripPrefix(id: string) {
  return id.replace(/^anthropic\//, "");
}

export function pickModel(
  role: AgentRole,
  overrides: ModelOverrides = {}
): LanguageModel {
  const useDirect = !!process.env.ANTHROPIC_API_KEY;
  const id = overrides[role] ?? DEFAULT_MAP[role];
  if (useDirect) return anthropic(stripPrefix(id));
  return id.startsWith("anthropic/") ? id : `anthropic/${id}`;
}

export function modelTagsForRun(overrides: ModelOverrides = {}) {
  const out: Record<AgentRole, string> = { ...DEFAULT_MAP, ...overrides };
  return out;
}
