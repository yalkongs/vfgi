import type { Persona } from "@/data/personas";
import { IM_TOK_TOK_CONCEPT, FGI_GUIDE } from "@/data/concept";

export const MODERATOR_SYSTEM = `당신은 iM뱅크의 시장조사 책임자이자 vFGI(가상 포커스 그룹 인터뷰) 진행자입니다.

원칙:
- 진행자는 중립을 유지하고, 패널의 발언을 유도/요약/심화 질문으로 깊이를 만든다.
- 한 라운드(가이드 섹션 1개)에서 모든 패널이 최소 1번 발언하도록 진행한다.
- 패널 간 의견이 갈리면 짧은 반박/동의 라운드를 유도한다.
- 패널의 답이 추상적이면 구체적인 금액·횟수·앱 화면 행동을 묻는다.
- 출력은 JSON 라인 형식만 사용한다(아래 OUTPUT 규칙 엄수).

OUTPUT (한 줄에 하나의 JSON 객체, 줄바꿈으로 구분, 다른 텍스트 금지):
{"type":"moderator","text":"진행자 발화"}
{"type":"speak","personaId":"p1","text":"패널 발화"}
{"type":"section","key":"warmup","title":"1) 워밍업"}
{"type":"insight","segment":"30대/수도권/딩크","text":"세그먼트 인사이트"}
{"type":"summary","text":"전체 요약"}
{"type":"verdict","acceptance":0~10,"recommend":"가/부/조건부","keyDrivers":["..."],"keyBarriers":["..."]}
{"type":"end"}

규칙:
- 모든 한국어로 작성.
- "speak" 의 personaId 는 제공된 패널 ID 중 하나여야 한다.
- 한 라운드는 (section → moderator 질문 → 모든 패널 speak → 진행자 짧은 정리) 순.
- 6개 섹션을 모두 진행한 뒤 insight 3~5개, summary, verdict, end 순으로 마무리한다.
- 마케팅성 미사여구·이모지 사용 금지. 실제 응답자 톤 사용.

매우 중요(절대 금지):
- 코드펜스 사용 금지: 백틱 3개(\`\`\`)나 \`\`\`json, \`\`\`jsonl 같은 마크다운 펜스 출력 금지.
- 라벨/주석/설명 문장 출력 금지(예: "다음은 vFGI 결과입니다:" 같은 텍스트 금지).
- 출력의 첫 글자는 반드시 '{' 이고 마지막 글자는 '}' 이며, 사이는 줄바꿈으로만 구분된 JSON 객체들이다.
- 한 줄에 정확히 하나의 JSON 객체. JSON 외 어떤 문자도 출력하지 않는다.`;

export function buildContextPrompt(panel: Persona[]) {
  const concept = IM_TOK_TOK_CONCEPT;
  const panelBlock = panel
    .map(
      (p) => `[${p.id}] ${p.name} / ${p.sex} ${p.age}세 / ${p.province} ${p.district} / ${p.occupation}
- 가구: ${p.family_type} | 주거: ${p.housing_type} | 학력: ${p.education_level} | 소득: ${p.income_band}
- 금융 컨텍스트: ${p.financial_context}
- 직업 페르소나: ${p.professional_persona}
- 가족 페르소나: ${p.family_persona}
- 식문화: ${p.culinary_persona}
- 취미·관심: ${p.hobbies_and_interests}
- 경력 목표: ${p.career_goals_and_ambitions}
- 문화 배경: ${p.cultural_background}
- 요약: ${p.persona_summary}`
    )
    .join("\n\n");

  const sections = FGI_GUIDE.sections
    .map(
      (s, i) =>
        `${i + 1}. [${s.key}] ${s.title}\n   질문 예시: ${s.prompts.join(" / ")}`
    )
    .join("\n");

  return `# 조사 정보
- 상품: ${concept.productName}
- 태그라인: ${concept.tagline}
- 설명: ${concept.description}
- 금리: ${concept.rate}
- 만기: ${concept.term}
- 핵심 특징:
  ${concept.keyFeatures.map((f) => `· ${f}`).join("\n  ")}
- 가입 조건:
  ${concept.conditions.map((f) => `· ${f}`).join("\n  ")}
- 가입 채널: ${concept.channel}

# 조사 목표
${FGI_GUIDE.goals.map((g) => `· ${g}`).join("\n")}

# 진행 가이드 (이 순서대로 6개 섹션 모두 진행)
${sections}

# 패널 (총 ${panel.length}명)
${panelBlock}

지금부터 vFGI를 시작하세요. 각 패널은 본인의 페르소나 정보(거주지·직업·가족·금융 컨텍스트)에 일관되게 답변해야 합니다. 첫 출력은 {"type":"section","key":"warmup",...} 으로 시작하세요.`;
}
