import { and, gte, lte, inArray, sql, type SQL } from "drizzle-orm";
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

// Nemotron-Personas-Korea 데이터셋의 province 표기와 일반 약칭 간 alias.
// DB 는 "경상북"·"경상남"·"충청북"·"충청남"·"전라남" 같이 저장될 수 있음.
const PROVINCE_ALIASES: Record<string, string[]> = {
  경북: ["경북", "경상북", "경상북도"],
  경남: ["경남", "경상남", "경상남도"],
  충북: ["충북", "충청북", "충청북도"],
  충남: ["충남", "충청남", "충청남도"],
  전북: ["전북", "전라북", "전라북도"],
  전남: ["전남", "전라남", "전라남도"],
  서울: ["서울", "서울특별시"],
  부산: ["부산", "부산광역시"],
  대구: ["대구", "대구광역시"],
  인천: ["인천", "인천광역시"],
  광주: ["광주", "광주광역시"],
  대전: ["대전", "대전광역시"],
  울산: ["울산", "울산광역시"],
  세종: ["세종", "세종특별자치시"],
  경기: ["경기", "경기도"],
  강원: ["강원", "강원도", "강원특별자치도"],
  제주: ["제주", "제주특별자치도"],
};

export function expandProvinces(input: string[]): string[] {
  const out = new Set<string>();
  for (const p of input) {
    out.add(p);
    const aliases = PROVINCE_ALIASES[p];
    if (aliases) for (const a of aliases) out.add(a);
  }
  return Array.from(out);
}

export type Quota = { key: string; values: Record<string, number> };

export type SampleInput = {
  filters?: PanelFilters;
  quotas?: Quota[];
  size: number;
  seed?: number;
  naturalDistribution?: boolean; // E4 — quota 강제 대신 PGM 자연 분포 따르기
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
    conditions.push(inArray(persona.province, expandProvinces(filters.province)));
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

  // E4 natural 모드: PGM(데이터셋 자체 분포) 그대로 따라 size 만큼만 셔플 추출
  if (input.naturalDistribution || !input.quotas || input.quotas.length === 0) {
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
  if (groups[bucket]) {
    const expanded = expandProvinces(groups[bucket]);
    return expanded.some((g) => p.province === g || p.province.startsWith(g));
  }
  const aliases = expandProvinces([bucket]);
  return aliases.some((a) => p.province === a || p.province.startsWith(a));
}
