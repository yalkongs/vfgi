// E1+E2+E3+E5+E6 통합 — 페르소나 카드 컴파일러
// 13 레이어 + 시군구 컨텍스트 + 사투리/세대 어휘 + 금융 행동 + 교호작용 보정
// 모두 통합한 단일 텍스트 블록 생성.

import type { Persona } from "../../db/schema";
import { getDistrictInfo } from "./districtContext";
import { buildDialectHint } from "./dialectLexicon";
import { synthesizeFinancialContext, formatFinancialContext } from "./financialContext";
import { findRelevantInteractions } from "./interactionCorrections";

const PERSONA_LAYERS: Array<{ key: string; label: string }> = [
  { key: "professional_persona", label: "직업·일" },
  { key: "sports_persona", label: "스포츠·신체활동" },
  { key: "arts_persona", label: "문화·예술" },
  { key: "travel_persona", label: "여행" },
  { key: "culinary_persona", label: "음식·식문화" },
  { key: "family_persona", label: "가족·관계" },
  { key: "persona", label: "종합 요약" },
  { key: "cultural_background", label: "문화 배경" },
  { key: "skills_and_expertise", label: "기술·전문성" },
  { key: "hobbies_and_interests", label: "취미·관심사" },
  { key: "career_goals_and_ambitions", label: "경력 목표" },
];

export function buildPersonaCard(
  p: Persona,
  stimulusKind: string
): string {
  const fields = (p.fields ?? {}) as Record<string, unknown>;
  const district = getDistrictInfo(p.province, p.district);
  const dialect = buildDialectHint(district.dialect, p.age);
  const financial = synthesizeFinancialContext(p);
  const interactions = findRelevantInteractions(
    district.region,
    p.age,
    p.occupation,
    stimulusKind
  );

  const layers = PERSONA_LAYERS
    .map((l) => {
      const v = fields[l.key];
      if (typeof v !== "string" || !v.trim()) return null;
      return `[${l.label}] ${v.trim()}`;
    })
    .filter(Boolean)
    .join("\n");

  const districtBlock = `[지역 컨텍스트 — ${p.province} ${p.district}]
- 권역: ${district.region}
- 분위기: ${district.vibe}
- 랜드마크: ${district.landmarks.join(", ") || "(없음)"}
- 산업: ${district.industries.join(", ") || "(없음)"}
- 음식·문화: ${district.notable.join(", ") || "(없음)"}`;

  const dialectBlock = `[어조 가이드]
- 사투리: ${dialect.dialect}, 세대: ${dialect.ageBand}
- 가이드: ${dialect.guidance}
- 지역 마커 예: ${dialect.regionalMarkers.join(", ") || "(표준어)"}
- 세대 어휘 예: ${dialect.generationalVocab.join(", ")}
- 금융 어휘 예: ${dialect.financialVocab.join(", ")}`;

  const finBlock = `[금융 행동 (합성, 가구금융복지조사·금융이해력조사 분포 기반)]
${formatFinancialContext(financial)}`;

  const interactionBlock = interactions.length > 0
    ? `[교호작용 보정 — 본 자극물 (${stimulusKind}) 에서 주의할 패턴]
${interactions.map((r) => `- ${r.guidance}`).join("\n")}`
    : "";

  return [
    `[기본] ${p.name} | ${p.sex} ${p.age}세 | ${p.province} ${p.district} | ${p.occupation}`,
    `      가구: ${p.familyType ?? "-"} | 주거: ${p.housingType ?? "-"} | 학력: ${p.educationLevel ?? "-"} | 혼인: ${p.maritalStatus ?? "-"}`,
    "",
    layers || "(기본 페르소나 레이어 없음)",
    "",
    districtBlock,
    "",
    dialectBlock,
    "",
    finBlock,
    interactionBlock ? "\n" + interactionBlock : "",
  ].join("\n");
}
