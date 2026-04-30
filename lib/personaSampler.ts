import { and, eq, gte, lte, inArray, sql, type SQL } from "drizzle-orm";
import { db } from "../db/client";
import { persona, type Persona } from "../db/schema";

export type PanelFilters = {
  province?: string[];
  district?: string[];
  ageMin?: number;
  ageMax?: number;
  sex?: string[];
  occupationKeywords?: string[];
  educationLevels?: string[];
};

export type Quota = { key: string; values: Record<string, number> };

export type SampleInput = {
  filters?: PanelFilters;
  quotas?: Quota[];
  size: number;
  seed?: number;
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function samplePanel(input: SampleInput): Promise<Persona[]> {
  const seed = input.seed ?? 42;
  const rand = mulberry32(seed);
  const filters = input.filters ?? {};
  const conditions: SQL[] = [];

  if (filters.province && filters.province.length > 0) {
    conditions.push(inArray(persona.province, filters.province));
  }
  if (filters.district && filters.district.length > 0) {
    conditions.push(inArray(persona.district, filters.district));
  }
  if (filters.sex && filters.sex.length > 0) {
    conditions.push(inArray(persona.sex, filters.sex));
  }
  if (typeof filters.ageMin === "number") {
    conditions.push(gte(persona.age, filters.ageMin));
  }
  if (typeof filters.ageMax === "number") {
    conditions.push(lte(persona.age, filters.ageMax));
  }
  if (filters.educationLevels && filters.educationLevels.length > 0) {
    conditions.push(inArray(persona.educationLevel, filters.educationLevels));
  }
  if (
    filters.occupationKeywords &&
    filters.occupationKeywords.length > 0
  ) {
    const ors = filters.occupationKeywords.map((kw) =>
      sql`${persona.occupation} ILIKE ${`%${kw}%`}`
    );
    conditions.push(sql`(${sql.join(ors, sql` OR `)})`);
  }

  const whereExpr = conditions.length > 0 ? and(...conditions) : undefined;

  const candidates = whereExpr
    ? await db.select().from(persona).where(whereExpr).limit(2000)
    : await db.select().from(persona).limit(2000);

  if (candidates.length === 0) return [];

  const pool = shuffle(candidates, rand);

  if (!input.quotas || input.quotas.length === 0) {
    return pool.slice(0, input.size);
  }

  const picked: Persona[] = [];
  const used = new Set<string>();

  for (const q of input.quotas) {
    for (const [bucketName, count] of Object.entries(q.values)) {
      const matched = pool.filter((p) => {
        if (used.has(p.id)) return false;
        if (q.key === "province") return matchesProvinceBucket(p, bucketName);
        return String((p as Record<string, unknown>)[q.key] ?? "") === bucketName;
      });
      const take = matched.slice(0, count);
      for (const p of take) {
        used.add(p.id);
        picked.push(p);
        if (picked.length >= input.size) break;
      }
      if (picked.length >= input.size) break;
    }
    if (picked.length >= input.size) break;
  }

  if (picked.length < input.size) {
    for (const p of pool) {
      if (used.has(p.id)) continue;
      picked.push(p);
      used.add(p.id);
      if (picked.length >= input.size) break;
    }
  }

  return picked.slice(0, input.size);
}

function matchesProvinceBucket(p: Persona, bucket: string): boolean {
  const groups: Record<string, string[]> = {
    "대구·경북": ["대구", "경북"],
    수도권: ["서울", "경기", "인천"],
    호남권: ["광주", "전북", "전남"],
    충청권: ["대전", "충북", "충남", "세종"],
    부울경: ["부산", "울산", "경남"],
    강원제주: ["강원", "제주"],
  };
  if (groups[bucket]) return groups[bucket].some((g) => p.province.startsWith(g));
  return p.province === bucket;
}
