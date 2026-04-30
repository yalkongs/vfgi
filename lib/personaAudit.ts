import type { Persona } from "../db/schema";

export type DistroBucket = { label: string; count: number; pct: number };
export type Distribution = {
  total: number;
  buckets: DistroBucket[];
};

// 통계청 KOSIS 기준 권역별 인구 비율 (2024 기준 추정치)
export const KOSTAT_PROVINCE_PCT: Record<string, number> = {
  서울: 18.4,
  부산: 6.4,
  대구: 4.6,
  인천: 5.8,
  광주: 2.8,
  대전: 2.8,
  울산: 2.1,
  세종: 0.7,
  경기: 26.4,
  강원: 3.0,
  충북: 3.1,
  충남: 4.1,
  전북: 3.4,
  전남: 3.5,
  경북: 5.0,
  경남: 6.3,
  제주: 1.3,
};

// 통계청 연령 분포 (KOSIS 2024 추정, 19~99세 한정)
export const KOSTAT_AGE_PCT: Record<string, number> = {
  "19-29": 14.0,
  "30-39": 15.5,
  "40-49": 17.8,
  "50-59": 19.8,
  "60-69": 16.5,
  "70-79": 10.2,
  "80+": 6.2,
};

function ageBucket(age: number): string {
  if (age < 30) return "19-29";
  if (age < 40) return "30-39";
  if (age < 50) return "40-49";
  if (age < 60) return "50-59";
  if (age < 70) return "60-69";
  if (age < 80) return "70-79";
  return "80+";
}

export function provinceDistribution(personas: Persona[]): Distribution {
  const total = personas.length;
  const counts = new Map<string, number>();
  for (const p of personas) {
    counts.set(p.province, (counts.get(p.province) ?? 0) + 1);
  }
  const buckets: DistroBucket[] = Array.from(counts.entries())
    .map(([label, count]) => ({ label, count, pct: (count / total) * 100 }))
    .sort((a, b) => b.count - a.count);
  return { total, buckets };
}

export function ageDistribution(personas: Persona[]): Distribution {
  const total = personas.length;
  const counts = new Map<string, number>();
  for (const p of personas) {
    const b = ageBucket(p.age);
    counts.set(b, (counts.get(b) ?? 0) + 1);
  }
  const ORDER = ["19-29", "30-39", "40-49", "50-59", "60-69", "70-79", "80+"];
  const buckets: DistroBucket[] = ORDER.filter((k) => counts.has(k)).map(
    (label) => ({
      label,
      count: counts.get(label)!,
      pct: (counts.get(label)! / total) * 100,
    })
  );
  return { total, buckets };
}

export function sexDistribution(personas: Persona[]): Distribution {
  const total = personas.length;
  const counts = new Map<string, number>();
  for (const p of personas) {
    counts.set(p.sex, (counts.get(p.sex) ?? 0) + 1);
  }
  const buckets = Array.from(counts.entries())
    .map(([label, count]) => ({ label, count, pct: (count / total) * 100 }))
    .sort((a, b) => b.count - a.count);
  return { total, buckets };
}

export function familyDistribution(personas: Persona[]): Distribution {
  const total = personas.length;
  const counts = new Map<string, number>();
  for (const p of personas) {
    const k = p.familyType ?? "(미상)";
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const buckets = Array.from(counts.entries())
    .map(([label, count]) => ({ label, count, pct: (count / total) * 100 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
  return { total, buckets };
}

export type AuditReport = {
  panelSize: number;
  province: Distribution;
  provinceVsKostat: Array<{ label: string; panelPct: number; kostatPct: number; deltaPct: number }>;
  age: Distribution;
  ageVsKostat: Array<{ label: string; panelPct: number; kostatPct: number; deltaPct: number }>;
  sex: Distribution;
  family: Distribution;
};

export function buildAuditReport(personas: Persona[]): AuditReport {
  const province = provinceDistribution(personas);
  const age = ageDistribution(personas);
  const sex = sexDistribution(personas);
  const family = familyDistribution(personas);

  const provinceMap = new Map(province.buckets.map((b) => [b.label, b.pct]));
  const provinceVsKostat = Object.entries(KOSTAT_PROVINCE_PCT)
    .map(([label, kostatPct]) => {
      const panelPct = provinceMap.get(label) ?? 0;
      return { label, panelPct, kostatPct, deltaPct: panelPct - kostatPct };
    })
    .filter((row) => row.panelPct > 0 || row.kostatPct >= 3) // 주요 시도만
    .sort((a, b) => b.panelPct - a.panelPct);

  const ageMap = new Map(age.buckets.map((b) => [b.label, b.pct]));
  const ageVsKostat = Object.entries(KOSTAT_AGE_PCT)
    .map(([label, kostatPct]) => {
      const panelPct = ageMap.get(label) ?? 0;
      return { label, panelPct, kostatPct, deltaPct: panelPct - kostatPct };
    });

  return {
    panelSize: personas.length,
    province,
    provinceVsKostat,
    age,
    ageVsKostat,
    sex,
    family,
  };
}
