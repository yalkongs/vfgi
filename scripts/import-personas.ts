import { config } from "dotenv";
import { resolve } from "node:path";
config({ path: resolve(process.cwd(), ".env.local") });

import { db } from "../db/client";
import { persona, type NewPersona } from "../db/schema";

const DATASET = "nvidia/Nemotron-Personas-Korea";
const SPLIT = "train";
const CONFIG = "default";
const TARGET = Number(process.env.TARGET ?? 1000);
const BATCH = 100;

const ROWS_API = "https://datasets-server.huggingface.co/rows";

type HFRow = {
  row_idx: number;
  row: Record<string, unknown>;
};

async function fetchPage(offset: number, length: number) {
  const u = new URL(ROWS_API);
  u.searchParams.set("dataset", DATASET);
  u.searchParams.set("config", CONFIG);
  u.searchParams.set("split", SPLIT);
  u.searchParams.set("offset", String(offset));
  u.searchParams.set("length", String(length));
  const res = await fetch(u);
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`HF API ${res.status}: ${t.slice(0, 300)}`);
  }
  const json = (await res.json()) as { rows: HFRow[] };
  return json.rows ?? [];
}

function pickStr(o: Record<string, unknown>, key: string): string {
  const v = o[key];
  return typeof v === "string" ? v : "";
}
function pickInt(o: Record<string, unknown>, key: string): number {
  const v = o[key];
  return typeof v === "number" ? v : Number(v) || 0;
}

function toPersona(row: HFRow): NewPersona {
  const r = row.row;
  const uuid = pickStr(r, "uuid");
  const id = uuid ? `nemo-${uuid.slice(0, 12)}` : `nemo-row${row.row_idx}`;
  const district = pickStr(r, "district");
  const province = pickStr(r, "province");
  return {
    id,
    source: "nemotron",
    sourceUuid: uuid || null,
    name: pickStr(r, "persona") ? deriveName(r) : `페르소나-${row.row_idx}`,
    sex: pickStr(r, "sex") || "미상",
    age: pickInt(r, "age"),
    province: province || "미상",
    district: district || "미상",
    occupation: pickStr(r, "occupation") || "미상",
    maritalStatus: pickStr(r, "marital_status") || null,
    familyType: pickStr(r, "family_type") || null,
    housingType: pickStr(r, "housing_type") || null,
    educationLevel: pickStr(r, "education_level") || null,
    fields: r as Record<string, unknown>,
    tags: [province, pickStr(r, "occupation")].filter(Boolean) as string[],
  };
}

function deriveName(r: Record<string, unknown>): string {
  const summary = pickStr(r, "persona");
  const m = summary.match(/^([가-힣]{2,4})\s/);
  if (m) return m[1];
  const prof = pickStr(r, "professional_persona");
  const m2 = prof.match(/^([가-힣]{2,4})\s/);
  if (m2) return m2[1];
  return "이름미상";
}

async function main() {
  console.log(`▶ Importing up to ${TARGET} personas from ${DATASET}`);
  let imported = 0;
  let offset = 0;

  while (imported < TARGET) {
    const remaining = TARGET - imported;
    const length = Math.min(BATCH, remaining);
    let rows: HFRow[] = [];
    try {
      rows = await fetchPage(offset, length);
    } catch (e) {
      console.error(`  ! page ${offset}: ${(e as Error).message}`);
      offset += length;
      continue;
    }
    if (rows.length === 0) {
      console.log("  · no more rows from dataset, stopping");
      break;
    }

    const batch = rows.map(toPersona);
    if (batch.length > 0) {
      await db.insert(persona).values(batch).onConflictDoNothing();
    }
    imported += batch.length;
    offset += length;
    console.log(
      `  · imported ${imported}/${TARGET} (offset=${offset}, batch=${batch.length})`
    );
  }

  console.log(`✓ Imported ${imported} personas`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
