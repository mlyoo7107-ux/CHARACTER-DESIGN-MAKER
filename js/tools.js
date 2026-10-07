/* COLOR.M CHARACTER MAKER — AI 도구별 출력 형식 · 기준 이미지 사용법
 * 프롬프트 메타: { derived: 기준 이미지가 필요한 파생 프롬프트인지, ar: 권장 비율 }
 */
const TOOLS = [
  {
    key: 'generic', name: '범용', icon: '✨',
    desc: '어떤 이미지 생성 AI에도 붙여 넣을 수 있는 기본 형식',
    steps: [
      '③ MASTER PROMPT로 기본 이미지를 여러 장 만들고 가장 마음에 드는 1장을 고릅니다.',
      '고른 이미지를 아래 「마스터 이미지」에 저장해 두세요.',
      '이후 프롬프트를 쓸 때는 사용하는 도구의 "참조 이미지 / 캐릭터 참조" 기능에 마스터 이미지를 함께 넣으세요.',
    ],
  },
  {
    key: 'chatgpt', name: 'ChatGPT', icon: '💬',
    desc: '대화형 이미지 생성 — 마스터 이미지를 첨부하고 프롬프트를 붙여 넣기',
    steps: [
      '③ MASTER PROMPT를 붙여 넣어 기본 이미지를 만듭니다. 마음에 들 때까지 대화로 수정하세요.',
      '완성된 이미지를 저장해 「마스터 이미지」에 올려 두세요.',
      '새 장면·굿즈를 만들 때는 마스터 이미지를 첨부한 뒤 프롬프트를 붙여 넣으세요. (같은 대화 안에서 이어 만들면 더 잘 유지돼요)',
    ],
    prefix: { ko: '첨부한 기준 이미지 속 캐릭터와 완전히 같은 캐릭터로 그려 주세요. 얼굴, 비율, 색, 고정 특징을 바꾸지 마세요.', en: 'Use the attached reference image. Draw exactly the same character — do not change the face, proportions, colors or locked features.' },
  },
  {
    key: 'gemini', name: '나노바나나 (Gemini)', icon: '🍌',
    desc: 'Gemini 이미지 생성 — 기준 이미지 첨부 후 편집·생성',
    steps: [
      '③ MASTER PROMPT로 기본 이미지를 만듭니다.',
      '완성된 이미지를 「마스터 이미지」에 저장해 두세요.',
      '새 이미지를 만들 때 마스터 이미지를 첨부하고 프롬프트를 붙여 넣으세요. 한 번에 한 가지 변화(포즈, 배경 등)만 요청하면 일관성이 더 좋아요.',
    ],
    prefix: { ko: '첨부한 이미지의 캐릭터를 그대로 유지한 채 다음 이미지를 만들어 주세요.', en: 'Keep the character from the attached image exactly the same and create the following image.' },
  },
  {
    key: 'ideogram', name: 'Ideogram', icon: '🅸',
    desc: 'Ideogram Character — 이미지 1장으로 같은 캐릭터 유지',
    steps: [
      '③ MASTER PROMPT로 기본 이미지를 만듭니다. (다른 도구에서 만든 이미지도 괜찮아요)',
      '새 이미지를 만들 때 Character 기능에 마스터 이미지를 캐릭터 참조로 올립니다.',
      '프롬프트에는 장면·포즈·의상 등 바뀌는 내용 위주로 붙여 넣으세요.',
    ],
  },
  {
    key: 'firefly', name: 'Adobe Firefly', icon: '🅰',
    desc: '참조 이미지로 포즈·의상·장면 변형',
    steps: [
      '③ MASTER PROMPT로 기본 이미지를 만듭니다.',
      '새 이미지를 만들 때 마스터 이미지를 참조 이미지로 업로드합니다.',
      '손·눈·소품이 어긋나면 생성형 채우기(부분 수정)로 고치세요.',
    ],
  },
];

/* 결과물별 권장 비율 */
const AR = { master: '3:4' };

function toolOf(key) { return TOOLS.find((t) => t.key === key) || TOOLS[0]; }

/** 선택한 도구 형식으로 프롬프트 변환 */
function formatFor(toolKey, text, meta = {}, lang = 'en') {
  const t = toolOf(toolKey);
  /* 한 줄에 하나씩인 목록형 프롬프트(이모티콘 개별)는 줄마다 따로 변환 */
  if (meta.list) {
    return text.split('\n').filter(Boolean).map((line) => formatFor(toolKey, line, { ...meta, list: false }, lang)).join('\n\n---\n');
  }
  const parts = [];
  if (meta.derived && t.prefix) parts.push(t.prefix[lang]);
  parts.push(text);
  if (meta.ar) parts.push(lang === 'ko' ? `비율: ${meta.ar}` : `Aspect ratio: ${meta.ar}`);
  return parts.join('\n');
}
