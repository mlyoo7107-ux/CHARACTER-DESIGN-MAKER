/* COLOR.M CHARACTER MAKER — 프롬프트 생성 */

/* ---------- 상태 조회 헬퍼 (state는 app.js 전역) ---------- */
const FIELD_INDEX = {};
(function indexFields() {
  const walk = (list) => list.forEach((f) => {
    if (f.id) FIELD_INDEX[f.id] = f;
    if (f.fields) walk(f.fields);
  });
  STEPS.forEach((s) => walk(s.fields));
  APPS.forEach((a) => walk(a.fields));
})();

function optionsOf(f) {
  if (!f) return [];
  if (f.dynamic === 'subtype') return SUBTYPES[sel('type')[0]] || [];
  if (f.dynamic === 'theme') return briefCfg().themes;
  if (f.dynamic === 'cond') return briefCfg().conds;
  if (f.dynamic === 'trait') {
    const ages = sel('target_age');
    return TRAIT_GROUPS.filter((g) => g.ages.some((a) => ages.includes(a))).flatMap((g) => g.opts);
  }
  return f.options || [];
}
function chipState(id) {
  const v = state.v[id];
  return v && typeof v === 'object' ? v : { sel: [], customOn: false, custom: '' };
}
function sel(id) { return chipState(id).sel; }
function customOf(id) {
  const s = chipState(id);
  return s.customOn && s.custom.trim() ? s.custom.trim() : '';
}
/** 선택값(언어별 라벨) + 직접입력 값 */
function vals(id, lang) {
  const f = FIELD_INDEX[id];
  const opts = optionsOf(f);
  const out = sel(id).map((v) => {
    const op = opts.find((x) => x.v === v);
    return op ? op[lang] : v;
  });
  const c = customOf(id);
  if (c) out.push(c);
  return out;
}
function txt(id) {
  const v = state.v[id];
  return typeof v === 'string' ? v.trim() : '';
}

/* ---------- 문자열 헬퍼 ---------- */
function hasBatchim(word) {
  const ch = word.trim().slice(-1);
  const code = ch.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 !== 0;
  if (/[0-9]/.test(ch)) return '013678'.includes(ch);
  return !/[aeiouyAEIOUY]/.test(ch);
}
const josa = (word, withB, withoutB) => word + (hasBatchim(word) ? withB : withoutB);
function list(arr, lang) {
  const a = arr.filter(Boolean);
  if (lang === 'ko' || a.length < 2) return a.join(', ');
  return a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
}
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const clean = (s) => s.replace(/\s+/g, ' ').replace(/\s([,.])/g, '$1').trim();
const uniq = (a) => [...new Set(a)];

/* ---------- 고정 특징 ----------
 * 자동 고정: STEP 03에서 선택·입력한 외형은 항목(체형/얼굴 각 부위/의상 각 칸/대표 특징) 단위로 자동 고정.
 *           state.unlocked 에 들어 있는 항목만 고정 해제(활용 이미지에서 바뀌어도 됨).
 * 직접 추가: state.locks
 */
function isLocked(key) { return !(state.unlocked || []).includes(key); }
function autoLocks(lang) {
  const L = (ko, en) => (lang === 'ko' ? ko : en);
  const out = [];
  [['silhouette', '실루엣', 'silhouette'], ['proportion', '비율', 'proportions'], ['hands', '손', 'hands'], ['feet', '발', 'feet']].forEach(([id, ko, en]) => {
    const v = vals(id, lang);
    if (v.length) out.push({ key: id, group: ko, text: `${L(ko, en)}: ${v.join(', ')}` });
  });
  if (vals('body', lang).length) out.push({ key: 'body', group: '체형', text: L(`체형: ${vals('body', lang).join(', ')}`, `body: ${vals('body', lang).join(', ')}`) });
  FACE_PARTS.forEach((p) => {
    const v = vals(p.id, lang);
    if (v.length) out.push({ key: p.id, group: p.label, text: `${L(p.label, p.en)}: ${v.join(', ')}` });
  });
  OUTFIT_PARTS.forEach((p) => {
    if (txt(p.id)) out.push({ key: p.id, group: p.id === 'out_etc' ? '의상' : p.label, text: `${L(p.id === 'out_etc' ? '의상' : p.label, p.en)}: ${txt(p.id)}` });
  });
  if (vals('signature', lang).length) out.push({ key: 'signature', group: '대표 특징', text: L(`대표 특징: ${vals('signature', lang).join(', ')}`, `signature features: ${vals('signature', lang).join(', ')}`) });
  return out;
}
/** 최종 고정 특징 = 자동 고정(해제 제외) + 직접 추가 */
function allLocks(lang) {
  return [...autoLocks(lang).filter((x) => isLocked(x.key)).map((x) => x.text), ...state.locks];
}

/* ---------- ★ 핵심 특징 ----------
 * 고정 특징 중 "이 캐릭터를 알아보게 하는" 3~5개. 프롬프트 맨 앞에 가장 강하게 넣는다.
 * state.core = null → 자동 추천, 배열 → 사용자가 고른 키 (자동 고정 key 또는 'lock:<직접 추가 문구>')
 */
const CORE_MAX = 5;
/** 고를 수 있는 후보: { key, text(언어별), label } */
function coreCandidates(lang) {
  return [
    ...state.locks.map((l) => ({ key: `lock:${l}`, text: l, label: '디테일' })),
    ...autoLocks(lang).filter((x) => isLocked(x.key)).map((x) => ({ key: x.key, text: x.text, label: x.group })),
  ];
}
/** 자동 추천: 직접 추가한 디테일 → 모자·액세서리·소품·상의 → 귀·무늬·헤어 → 실루엣 순 */
function suggestCore() {
  const order = ['out_hat', 'out_acc', 'out_prop', 'out_top', 'out_dress', 'face_ears', 'face_pattern', 'face_hair', 'signature', 'silhouette'];
  const keys = coreCandidates('ko').map((x) => x.key);
  const picked = keys.filter((k) => k.startsWith('lock:'));
  order.forEach((k) => { if (keys.includes(k) && !picked.includes(k)) picked.push(k); });
  return picked.slice(0, 3);
}
function coreKeys() {
  const valid = coreCandidates('ko').map((x) => x.key);
  return (Array.isArray(state.core) ? state.core : suggestCore()).filter((k) => valid.includes(k)).slice(0, CORE_MAX);
}
function coreLocks(lang) {
  const cand = coreCandidates(lang);
  return coreKeys().map((k) => (cand.find((x) => x.key === k) || {}).text).filter(Boolean);
}

/* ---------- 컨텍스트 수집 ---------- */
function collect(lang) {
  const L = (ko, en) => (lang === 'ko' ? ko : en);
  const pOpt = PURPOSES.find((p) => p.v === sel('purpose')[0]);
  const typeV = sel('type')[0];
  const typeLabels = vals('type', lang);
  const subLabels = vals('subtype', lang);
  let noun = (subLabels.length ? subLabels : typeLabels).join(' / ');
  if (!noun) noun = L('캐릭터', 'character');
  const anthro = ANTHRO_TYPES.includes(typeV);
  const nounFull = anthro ? L(`의인화된 ${noun} 캐릭터`, `anthropomorphic ${noun} character`) : noun;

  const colors = ['main', 'sub', 'point']
    .map((k) => ({ k, ...state.colors[k] }))
    .filter((c) => c.hex)
    .map((c) => {
      const role = { main: L('메인 컬러', 'main color'), sub: L('서브 컬러', 'secondary color'), point: L('포인트 컬러', 'accent color') }[c.k];
      return `${role} ${c.hex.toUpperCase()}${c.name ? ` (${c.name})` : ''}`;
    });

  const styleSel = sel('style')[0];
  const styleParts = [];
  if (styleSel && STYLE_DESC[styleSel]) styleParts.push(STYLE_DESC[styleSel][lang]);
  if (customOf('style')) styleParts.push(customOf('style'));

  const c = {
    lang, L,
    name: txt('name'),
    purposeKey: pOpt ? pOpt.app : '',
    purposeLabel: vals('purpose', lang).join(', '),
    purposeCustom: customOf('purpose'),
    typeLabel: typeLabels.join(', '),
    noun, nounFull,
    age: vals('age', lang), gender: vals('gender', lang), role: vals('role', lang), job: txt('job'),
    personality: vals('personality', lang),
    body: vals('body', lang),
    face: FACE_PARTS.map((p) => ({ key: p.id, label: L(p.label, p.en), v: vals(p.id, lang) })).filter((x) => x.v.length),
    outfit: OUTFIT_PARTS.map((p) => ({ key: p.id, label: L(p.id === 'out_etc' ? '기타' : p.label, p.en), v: txt(p.id) })).filter((x) => x.v),
    signature: vals('signature', lang),
    locks: allLocks(lang),
    core: coreLocks(lang),
    colors,
    mood: vals('mood', lang),
    styleLabel: vals('style', lang).join(', '),
    style: styleParts.join(', '),
    framing: vals('framing', lang), view: vals('view', lang),
    expr: vals('expr', lang), action: vals('action', lang), bg: vals('bg', lang),
    /* V2 — 타깃 · 브리프 · 콘셉트 · 형태 */
    targetAge: vals('target_age', lang), targetGender: vals('target_gender', lang), targetDesc: txt('target_desc'),
    targetTraits: vals('target_trait', lang), coTarget: vals('target_co', lang).filter((v) => !/^없음|^none/.test(v)),
    message: txt('brief_msg'), theme: vals('brief_theme', lang), impression: vals('impression', lang), conditions: vals('conditions', lang),
    brief: briefCfg(),
    world: vals('world', lang), story: txt('story'),
    silhouette: vals('silhouette', lang), proportion: vals('proportion', lang), hands: vals('hands', lang), feet: vals('feet', lang),
  };
  c.target = [c.targetAge.join(', '), c.targetGender.filter((g) => !/무관|all genders/.test(g)).join(', ')].filter(Boolean).join(' / ');
  c.idSentence = idSentence(lang);
  c.who = c.name || L(`이 ${noun}`, `the ${noun}`);
  return c;
}

/* ---------- 캐릭터 한 줄 정의 ---------- */
function idSentence(lang) {
  if (state.idOverride && state.idOverride.trim()) return state.idOverride.trim();
  return autoIdSentence(lang);
}
function autoIdSentence(lang) {
  const name = txt('name');
  const subLabels = vals('subtype', lang);
  const typeLabels = vals('type', lang);
  let noun = (subLabels[0] || typeLabels[0] || (lang === 'ko' ? '캐릭터' : 'character'));
  if (ANTHRO_TYPES.includes(sel('type')[0]) && lang === 'en') noun = `${noun} character`;

  /* 한 줄 정의에는 직접 추가한 고정 특징 → 대표 특징 순으로 사용 */
  const coreShort = coreLocks(lang).map((t) => t.replace(/^[^:]+:\s*/, ''));
  const features = (coreShort.length ? coreShort : state.locks.length ? state.locks : vals('signature', lang)).slice(0, 2);
  const pers = sel('personality').map((v) => PERSONALITIES.find((p) => p.v === v)).filter(Boolean).slice(0, 2);
  const persCustom = !pers.length && customOf('personality').length <= 12 ? customOf('personality') : '';
  const bodyOpt = BODIES.find((b) => sel('body').includes(b.v));
  const size = bodyOpt ? bodyOpt.x[lang === 'ko' ? 0 : 1] : '';

  if (lang === 'ko') {
    let feat = '';
    if (features.length === 2) feat = `${josa(features[0], '과', '와')} ${josa(features[1], '이', '가')} 특징인`;
    else if (features.length === 1) feat = `${josa(features[0], '이', '가')} 특징인`;
    let p = '';
    if (pers.length === 2) p = `${pers[0].x} ${pers[1].ko}`;
    else if (pers.length === 1) p = pers[0].ko;
    else p = persCustom;
    return clean(`${feat} ${p} ${size} ${noun} ${name}`) + '.';
  }
  const p = pers.length ? list(pers.map((x) => x.en), 'en') : persCustom;
  const desc = clean(`${p} ${size} ${noun}`);
  const article = /^[aeiou]/i.test(desc) ? 'an' : 'a';
  const feat = features.length ? ` with ${list(features, 'en')}` : '';
  return name ? `${name}, ${article} ${desc}${feat}.` : `${cap(article)} ${desc}${feat}.`;
}

/* ---------- 공통 블록 ---------- */
function negative(c) {
  return c.L(
    '피해야 할 것: 고정 특징 변경, 다른 캐릭터처럼 보이는 얼굴, 팔다리 추가·누락, 일관되지 않은 색상, 글자, 워터마크',
    'Avoid: changing the locked features, off-model face, extra or missing limbs, inconsistent colors, text, watermark',
  );
}
/* ★핵심 특징을 맨 앞에 가장 강하게, 나머지 고정 특징은 짧게 이어서 */
function lockLine(c) {
  if (!c.locks.length) return '';
  const rest = c.locks.filter((l) => !c.core.includes(l));
  if (!c.core.length) return c.L(`🔒 반드시 유지할 특징: ${c.locks.join('; ')}`, `Identity lock — always keep: ${c.locks.join('; ')}`);
  return [
    c.L(`★ 핵심 특징 (절대 바꾸지 말 것): ${c.core.join('; ')}`, `★ Core identity — never change: ${c.core.join('; ')}`),
    rest.length ? c.L(`🔒 함께 유지: ${rest.join('; ')}`, `Also keep: ${rest.join('; ')}`) : '',
  ].filter(Boolean).join('\n');
}
function colorLine(c) {
  const parts = [];
  if (c.colors.length) parts.push(c.colors.join(', '));
  if (c.mood.length) parts.push(c.L(`${c.mood.join(', ')} 컬러 분위기`, `${list(c.mood, 'en')} color mood`));
  return parts.length ? c.L(`컬러: ${parts.join('; ')}`, `Color palette: ${parts.join('; ')}`) : '';
}
function charBlock(c) {
  const flex = appearanceLines(c);
  return [
    c.L(`캐릭터: ${c.idSentence}`, `Character: ${c.idSentence}`),
    lockLine(c),
    flex.length ? c.L(`기본 외형(장면에 따라 바뀌어도 됨): ${flex.join(' / ')}`, `Default look (may vary by scene): ${flex.join('; ')}`) : '',
    c.style ? c.L(`스타일: ${c.style}`, `Style: ${c.style}`) : '',
    colorLine(c),
  ].filter(Boolean).join('\n');
}
/** 타깃 · 메시지 · 인상 · 조건 · 세계관 — "목적에 맞는 디자인"을 이미지 AI에 전달 */
function briefLines(c) {
  const L = c.L;
  return [
    c.target || c.targetDesc ? L(`타깃: ${[c.target, c.targetDesc].filter(Boolean).join(' — ')}`, `Target audience: ${[c.target, c.targetDesc].filter(Boolean).join(' — ')}`) : '',
    c.targetTraits.length ? L(`타깃의 특징: ${c.targetTraits.join(', ')} — 디자인에 반영`, `Audience traits to design for: ${c.targetTraits.join(', ')}`) : '',
    c.coTarget.length ? L(`함께 호감을 줘야 할 사람: ${c.coTarget.join(', ')}`, `Must also appeal to: ${c.coTarget.join(', ')}`) : '',
    c.message ? L(`${c.brief.msgLabel}: "${c.message}" — 캐릭터의 표정·자세·소품에서 이 메시지가 느껴지도록`, `${c.brief.msgEn}: "${c.message}" — the character's expression, posture and props should communicate this`) : '',
    c.theme.length && c.brief.themeLabel ? L(`${c.brief.themeLabel}: ${c.theme.join(', ')}`, `${c.brief.themeEn}: ${c.theme.join(', ')}`) : '',
    c.impression.length ? L(`느껴져야 할 인상: ${c.impression.join(', ')}`, `Intended impression: ${list(c.impression, 'en')}`) : '',
    c.conditions.length ? L(`디자인 조건: ${c.conditions.join(', ')}`, `Design requirements: ${c.conditions.join(', ')}`) : '',
    c.world.length || c.story ? L(`세계관: ${[c.world.join(', '), c.story].filter(Boolean).join(' — ')}`, `World: ${[c.world.join(', '), c.story].filter(Boolean).join(' — ')}`) : '',
  ].filter(Boolean);
}

/** 고정 해제된 외형만 (고정된 항목은 lockLine에 들어감) */
function appearanceLines(c) {
  const L = c.L;
  const face = c.face.filter((f) => !isLocked(f.key));
  const outfit = c.outfit.filter((f) => !isLocked(f.key));
  const form = [['silhouette', c.silhouette, '실루엣', 'Silhouette'], ['proportion', c.proportion, '비율', 'Proportions'], ['hands', c.hands, '손', 'Hands'], ['feet', c.feet, '발', 'Feet']]
    .filter(([k, v]) => v.length && !isLocked(k)).map(([, v, ko, en]) => L(`${ko}: ${v.join(', ')}`, `${en}: ${v.join(', ')}`));
  return [
    ...form,
    c.body.length && !isLocked('body') ? L(`체형: ${c.body.join(', ')}`, `Body: ${list(c.body, 'en')}`) : '',
    face.length ? L(`얼굴: ${face.map((f) => `${f.label}: ${f.v.join(', ')}`).join(' / ')}`, `Face: ${face.map((f) => `${f.label}: ${f.v.join(', ')}`).join('; ')}`) : '',
    outfit.length ? L(`의상: ${outfit.map((f) => `${f.label}: ${f.v}`).join(' / ')}`, `Outfit: ${outfit.map((f) => `${f.label}: ${f.v}`).join('; ')}`) : '',
    c.signature.length && !isLocked('signature') ? L(`대표 특징: ${c.signature.join(', ')}`, `Signature features: ${list(c.signature, 'en')}`) : '',
  ].filter(Boolean);
}
function purposeLine(c) {
  if (c.purposeKey && PURPOSE_TUNING[c.purposeKey]) {
    const t = PURPOSE_TUNING[c.purposeKey][c.lang];
    return c.L(`용도: ${t}${c.purposeCustom ? ` (${c.purposeCustom})` : ''}`, `Intended use: ${t}${c.purposeCustom ? ` (${c.purposeCustom})` : ''}`);
  }
  if (c.purposeLabel) return c.L(`용도: ${c.purposeLabel}`, `Intended use: ${c.purposeLabel}`);
  return '';
}

/* ---------- ① PROFILE ---------- */
function buildProfile(c) {
  const L = c.L;
  const rows = [
    [L('이름', 'Name'), c.name],
    [L('사용 목적', 'Purpose'), c.purposeLabel],
    [L('타깃', 'Target audience'), [c.target, c.targetDesc].filter(Boolean).join(' — ')],
    [L('타깃의 특징', 'Audience traits'), c.targetTraits.join(', ')],
    [L('함께 고려할 사람', 'Also appeals to'), c.coTarget.join(', ')],
    [L(c.brief.msgLabel, c.brief.msgEn), c.message],
    [L(c.brief.themeLabel || '테마', c.brief.themeEn || 'Theme'), c.theme.join(', ')],
    [L('인상', 'Impression'), c.impression.join(', ')],
    [L('디자인 조건', 'Requirements'), c.conditions.join(', ')],
    [L('종류', 'Type'), [c.typeLabel, vals('subtype', c.lang).join(', ')].filter(Boolean).join(' › ')],
    [L('캐릭터 나이 / 성별', 'Age / Gender'), [c.age.join(', '), c.gender.join(', ')].filter(Boolean).join(' / ')],
    [L('역할', 'Role'), [c.role.join(', '), c.job].filter(Boolean).join(' · ')],
    [L('성격', 'Personality'), c.personality.join(', ')],
    [L('세계관', 'World'), [c.world.join(', '), c.story].filter(Boolean).join(' — ')],
    [L('형태', 'Form'), [c.silhouette.join(', '), c.proportion.join(', '), c.hands.join(', '), c.feet.join(', ')].filter(Boolean).join(' / ')],
    [L('체형', 'Body'), c.body.join(', ')],
    [L('얼굴', 'Face'), c.face.map((f) => `${f.label}: ${f.v.join(', ')}`).join(' / ')],
    [L('의상', 'Outfit'), c.outfit.map((f) => `${f.label}: ${f.v}`).join(' / ')],
    [L('특징', 'Features'), c.signature.join(', ')],
    [L('컬러', 'Colors'), [c.colors.join(', '), c.mood.join(', ')].filter(Boolean).join(' · ')],
    [L('스타일', 'Style'), c.styleLabel],
  ];
  return rows.filter((r) => r[1]);
}

/* ---------- ② IDENTITY ---------- */
function buildIdentity(c) {
  const L = c.L;
  const lines = [L('[캐릭터 ID]', '[CHARACTER ID]'), c.idSentence, ''];
  lines.push(L('[반드시 유지할 특징 🔒]', '[MUST KEEP 🔒]'));
  if (c.locks.length) {
    c.core.forEach((l) => lines.push(`★ ${l}`));
    c.locks.filter((l) => !c.core.includes(l)).forEach((l) => lines.push(`- ${l}`));
  }
  else lines.push(L('- (STEP 09에서 고정 특징을 입력하세요)', '- (add locked features in STEP 09)'));
  if (c.colors.length) {
    lines.push('', L('[고정 컬러]', '[FIXED COLORS]'));
    c.colors.forEach((x) => lines.push(`- ${x}`));
  }
  return lines.join('\n');
}

/* ---------- ③ MASTER ---------- */
function buildMaster(c) {
  const L = c.L;
  const basics = [c.age.join(', '), c.gender.join(', '), c.nounFull].filter(Boolean).join(' ');
  const roleTxt = [c.role.join(', '), c.job].filter(Boolean).join(', ');
  const comp = [
    c.framing.join(', '), c.view.join(', '),
    c.expr.length ? L(`${c.expr.join(', ')} 표정`, `${list(c.expr, 'en')} expression`) : '',
    c.action.length ? L(`${c.action.join(', ')} 동작`, `${list(c.action, 'en')} pose`) : '',
    c.bg.join(', '),
  ].filter(Boolean);

  const lines = [
    c.style ? L(`${c.style} 스타일의 오리지널 캐릭터 이미지.`, `${cap(c.style)} — original character illustration.`) : L('오리지널 캐릭터 이미지.', 'Original character illustration.'),
    L(`캐릭터: ${c.idSentence}`, `Character: ${c.idSentence}`),
    L(`기본 설정: ${basics}${roleTxt ? `, 역할: ${roleTxt}` : ''}`, `Basics: ${basics}${roleTxt ? `, role: ${roleTxt}` : ''}`),
    c.personality.length ? L(`성격: ${c.personality.join(', ')} — 표정과 몸짓으로 성격이 드러나도록`, `Personality: ${c.personality.join(', ')} — expressed through facial expression and body language`) : '',
    ...briefLines(c),
    ...appearanceLines(c),
    colorLine(c),
    comp.length ? L(`구성: ${comp.join(', ')}`, `Composition: ${comp.join(', ')}`) : '',
    lockLine(c),
    purposeLine(c),
    L('품질: 일관된 오리지널 캐릭터 디자인, 매력적인 비율, 깔끔한 디테일, 고품질', 'Quality: consistent original character design, appealing proportions, clean details, high quality'),
    negative(c),
  ];
  return lines.filter(Boolean).join('\n');
}

/* ---------- ④ CHARACTER SHEET ----------
 * 한 장에 턴어라운드·표정·포즈를 모두 요청하면 이미지 AI가 측면·후면을 빼먹기 쉬워서
 * 턴어라운드 / 표정 / 포즈를 각각의 프롬프트로 나누고, 방향별 개별 프롬프트도 함께 제공한다.
 */
const VIEW_DETAIL = {
  '정면': ['정면: 보는 사람을 정면으로 바라봄', 'FRONT view: facing the viewer directly'],
  '45도': ['45도: 몸을 오른쪽으로 45° 돌린 모습', 'THREE-QUARTER view: body turned 45° to the right'],
  '측면': ['측면: 오른쪽을 향한 완전한 옆모습, 눈은 하나만 보임', 'SIDE view: full profile facing right, only one eye visible'],
  '후면': ['후면: 뒤돌아선 모습, 얼굴은 보이지 않음', 'BACK view: facing away from the viewer, face not visible'],
};

/* 뒷모습에서 보여야 할 요소 (꼬리, 가방끈, 리본 매듭 등) */
function backDetails(c) {
  const L = c.L;
  const out = [L('뒤통수', 'back of the head')];
  const all = [...sel('signature'), ...OUTFIT_PARTS.map((p) => txt(p.id)), ...state.locks].join(' ');
  if (c.typeLabel && (sel('type')[0] === '동물' || /꼬리/.test(all))) out.push(L('꼬리', 'tail'));
  if (/가방|bag/.test(all)) out.push(L('가방끈', 'bag strap'));
  if (/리본/.test(all)) out.push(L('리본 매듭 뒷면', 'back of the ribbon'));
  if (/망토|cape/.test(all)) out.push(L('망토 뒷면', 'back of the cape'));
  if (/날개/.test(all) || sel('hands').includes('날개')) out.push(L('날개', 'wings'));
  return uniq(out);
}

function sheetCommon(c) {
  const L = c.L;
  return [
    c.style ? L(`스타일: ${c.style}`, `Style: ${c.style}`) : '',
    colorLine(c),
    ...appearanceLines(c),
    lockLine(c),
    c.locks.length ? L('위 특징은 모든 그림에서 동일하게', 'All of the above must stay identical in every drawing') : '',
  ];
}

function buildSheets(c) {
  const L = c.L;
  /* 턴어라운드 = 정면·45°·측면·후면 4방향 고정 + 직접 입력한 추가 방향 */
  const ordered = SHEET_VIEWS.map((x) => x.v);
  const viewLines = ordered.map((v, i) => `${i + 1}. ${VIEW_DETAIL[v][c.lang === 'ko' ? 0 : 1]}`);
  const n = viewLines.length;
  const back = backDetails(c);

  const turnaround = {
    key: 'turn', ar: n > 3 ? '16:9' : '4:3',
    title: L('④-1 턴어라운드 (정면 · 45° · 측면 · 후면)', '④-1 Turnaround'),
    text: [
      L(`캐릭터 턴어라운드 시트(정투영 모델 시트): ${c.idSentence}`, `Character turnaround sheet (orthographic model sheet) of ONE character: ${c.idSentence}`),
      L(`같은 캐릭터를 회전시킨 전신 ${n}개를 가로 한 줄로, 왼쪽부터 순서대로:`, `Exactly ${n} full-body views of the SAME character rotating, in a single horizontal row, left to right:`),
      ...viewLines,
      ordered.includes('후면') ? L(`후면에서는 ${josa(back.join(', '), '이', '가')} 보이도록`, `In the back view show the ${back.join(', ')}`) : '',
      L('모두 같은 키·같은 크기, 하나의 바닥선에 맞춰 정렬, 팔을 몸에서 살짝 뗀 기본 서 있는 자세, 원근 없음, 고른 조명',
        'All views the same height and scale, aligned on one ground line, neutral standing pose with arms slightly away from the body, no perspective distortion, flat even lighting'),
      L('이 이미지에는 턴어라운드만 — 표정 클로즈업·다른 포즈·글자 라벨 없음', 'This image shows ONLY the turnaround — no expression close-ups, no extra poses, no text labels'),
      ...sheetCommon(c),
      L('흰색 배경', 'Plain white background'),
      negative(c),
    ].filter(Boolean).join('\n'),
  };

  const exprs = uniq([...c.expr, ...EXPRESSIONS.slice(0, 6).map((x) => x[c.lang])]).slice(0, 8);
  const expression = {
    key: 'expr', ar: '3:2',
    title: L(`④-2 표정 시트 (${exprs.length}개)`, `④-2 Expression sheet (${exprs.length})`),
    text: [
      L(`같은 캐릭터의 표정 시트: ${c.idSentence}`, `Expression sheet of the SAME character: ${c.idSentence}`),
      L(`얼굴·어깨까지 클로즈업 ${exprs.length}개를 ${exprs.length > 4 ? '2줄' : '1줄'} 격자로, 모두 정면·같은 크기: ${exprs.join(', ')}`,
        `${exprs.length} head-and-shoulders close-ups in a ${exprs.length > 4 ? '2-row' : 'single-row'} grid, all front-facing and the same size: ${list(exprs, 'en')}`),
      L('표정만 바뀌고 얼굴 형태·귀·머리·색은 모두 동일', 'Only the expression changes — face shape, ears, hair and colors stay identical'),
      ...sheetCommon(c),
      L('흰색 배경, 글자 라벨 없음', 'Plain white background, no text labels'),
      negative(c),
    ].filter(Boolean).join('\n'),
  };

  const defPose = [ACTIONS[0], ACTIONS[1], ACTIONS[3], ACTIONS[4]].map((x) => x[c.lang]);
  const poses = uniq([...c.action, ...defPose]).slice(0, 6);
  const pose = {
    key: 'pose', ar: '16:9',
    title: L(`④-3 포즈 시트 (${poses.length}개)`, `④-3 Pose sheet (${poses.length})`),
    text: [
      L(`같은 캐릭터의 포즈 시트: ${c.idSentence}`, `Pose sheet of the SAME character: ${c.idSentence}`),
      L(`전신 포즈 ${poses.length}개를 한 줄로, 같은 크기: ${poses.join(', ')}`, `${poses.length} full-body poses in a row, same scale: ${list(poses, 'en')}`),
      L('자세만 바뀌고 비율·의상·소품·색은 모두 동일', 'Only the pose changes — proportions, outfit, props and colors stay identical'),
      ...sheetCommon(c),
      L('흰색 배경, 글자 라벨 없음', 'Plain white background, no text labels'),
      negative(c),
    ].filter(Boolean).join('\n'),
  };

  /* 한 장으로 잘 안 나올 때: 마스터 이미지를 첨부하고 방향별로 한 장씩 */
  const single = {
    key: 'views', ar: '3:4', list: true,
    title: L('④-4 방향별 개별 프롬프트 (턴어라운드가 잘 안 나올 때)', '④-4 One view per image (if the turnaround fails)'),
    text: ordered.map((v) => L(
      `${c.idSentence} — 전신 ${VIEW_DETAIL[v][0]}${v === '후면' ? `, ${josa(back.join(', '), '이', '가')} 보이도록` : ''}, 기본 서 있는 자세, 흰색 배경${c.style ? `, ${c.style}` : ''}`,
      `${c.idSentence} — full body ${VIEW_DETAIL[v][1]}${v === '후면' ? `, showing the ${back.join(', ')}` : ''}, neutral standing pose, plain white background${c.style ? `, ${c.style}` : ''}`,
    )).join('\n'),
  };

  return [turnaround, expression, pose, single];
}

/* ---------- ⑤ APPLICATION ---------- */
const GOODS_DESC = {
  '인형': ['봉제 인형 제품 디자인: 부드러운 극세사 원단, 자수로 표현한 눈과 디테일, 단순화된 둥근 형태, 바느질 선이 보이는 제품 사진, 깔끔한 배경, 정면',
    'Plush toy product design: soft minky fabric, embroidered eyes and details, simplified rounded shapes, visible stitched seams, product photo on a clean background, front view'],
  '키링': ['아크릴 키링 디자인: 투명 아크릴에 인쇄된 캐릭터, 화이트 인쇄 레이어, 얇은 칼선 테두리, 금속 고리, 제품 목업',
    'Acrylic keyring design: character printed on clear acrylic with white underlayer, thin die-cut border, metal ring attached, product mockup'],
  '스티커': ['다이컷 스티커 디자인: 두꺼운 흰색 테두리, 면 컬러, 은은한 그림자, 스티커 시트 목업',
    'Die-cut sticker design: thick white border, flat colors, subtle drop shadow, sticker sheet mockup'],
  '문구': ['문구 디자인: 메모지·노트 표지·패턴에 캐릭터 모티프 반복 배치, 통일된 팔레트, 제품 목업',
    'Stationery design: memo pad, notebook cover and repeat pattern with the character motif, cohesive palette, product mockup'],
  '패키지': ['패키지 디자인: 캐릭터가 주인공인 박스 전면, 로고·제품명 들어갈 여백, 매대 진열용 완성도',
    'Product packaging design: box front panel with the character as the hero, clear space for logo and product name, retail-ready'],
  '피규어': ['소장용 비닐 피규어: 3D 피규어, 무광 도색 마감, 원형 받침대, 스튜디오 제품 촬영, 부드러운 조명',
    'Collectible vinyl figure: 3D figure, matte painted finish, round display base, studio product photography, soft lighting'],
};
const BRAND_DESC = {
  '브랜드 홍보': ['브랜드 키 비주얼: 마스코트가 주인공, 반갑게 맞이하는 역동적인 포즈, 브랜드 컬러 중심', 'Brand key visual: the mascot as the hero in a dynamic welcoming pose, brand colors dominant'],
  '포스터': ['홍보 포스터: 세로 레이아웃, 상단에 헤드라인 공간, 캐릭터가 시선을 끄는 구도', 'Promotional poster: vertical layout, headline space at the top, eye-catching character composition'],
  '패키지': ['브랜드 패키지: 마스코트가 들어간 제품 패키지, 로고 영역 확보, 깔끔한 정리', 'Brand packaging: product package featuring the mascot, reserved logo area, clean arrangement'],
  'SNS': ['SNS 게시물(1:1): 마스코트가 말을 거는 듯한 친근한 포즈, 선명한 배경, 짧은 문구 공간', 'Social media post (1:1): mascot in a friendly talking-to-viewer pose, bold background, space for a short caption'],
};
const EDU_DESC = {
  '학습 카드': ['학습 카드 일러스트: 캐릭터가 주제를 소개, 크고 명확한 그림, 단어 라벨 공간', 'Educational flashcard illustration: the character presenting the topic, large clear visual, space for a word label'],
  '워크시트': ['워크시트 삽화: 모서리에서 힌트를 주는 캐릭터, 인쇄하기 좋은 단순한 선, 넓은 여백', 'Worksheet illustration: the character in a corner giving a hint, simple print-friendly lines, lots of white space'],
  '교구·포스터': ['교실 포스터: 캐릭터가 단계별로 설명하는 구성, 큰 글자 공간, 밝은 색감', 'Classroom poster: the character explaining step by step, large text areas, bright colors'],
  '교육 영상 썸네일': ['교육 영상 썸네일(16:9): 표정이 큰 캐릭터, 제목 공간, 한눈에 들어오는 구성', 'Educational video thumbnail (16:9): character with a big expression, title space, instantly readable composition'],
  '안내 캐릭터': ['안내 캐릭터 포즈: 옆을 가리키며 친절하게 설명하는 동작, 배경 없이 단독, 학습 자료 배치용', 'Guide character pose: pointing to the side with a friendly explaining gesture, isolated, for placing in learning materials'],
};
const SNS_DESC = {
  '피드 이미지(1:1)': ['정사각형 1:1 피드 이미지: 중앙의 캐릭터, 선명한 배경, 짧은 문구 공간', 'Square 1:1 feed image: character centered, bold background, room for a short caption'],
  '세로 피드(4:5)': ['세로 4:5 피드 이미지: 캐릭터 반신, 상단 문구 공간', 'Portrait 4:5 feed image: half-body character, headline space at the top'],
  '릴스·쇼츠 커버(9:16)': ['세로 9:16 릴스·쇼츠 커버: 캐릭터 클로즈업, 화면 중앙 안전 영역, 큰 제목 공간', 'Vertical 9:16 reels/shorts cover: character close-up within the center safe area, big title space'],
  '카드뉴스': ['카드뉴스 표지(1:1): 캐릭터가 주제를 소개, 큰 제목 영역, 깔끔한 그래픽', 'Card news carousel cover (1:1): the character introducing the topic, large title area, clean graphics'],
  '프로필 이미지': ['프로필 이미지: 캐릭터 얼굴 클로즈업, 원형으로 잘라도 안전한 중앙 배치, 단색 배경', 'Profile picture: character face close-up, centered to be safe for circular crop, solid background'],
};
const GAME_DESC = {
  '스프라이트 시트': ['게임 스프라이트 시트', 'Game sprite sheet'],
  '캐릭터 일러스트': ['게임 캐릭터 키 아트', 'Game character key art'],
  '게임 아이콘': ['게임 아이콘', 'Game icon'],
};

function itemsFor(id, map, c) {
  let s = sel(id);
  if (!s.length && !customOf(id)) s = Object.keys(map).slice(0, 3);
  const out = s.filter((k) => map[k]).map((k) => ({ key: k, desc: map[k][c.lang === 'ko' ? 0 : 1] }));
  if (customOf(id)) out.push({ key: customOf(id), custom: true });
  return out;
}
function block(...lines) { return lines.flat().filter(Boolean).join('\n'); }

const APP_BUILDERS = {
  picturebook(c) {
    const L = c.L;
    const expr = vals('pb_expr', c.lang);
    const comp = vals('pb_comp', c.lang);
    return [{
      title: L('그림책 장면', 'Picture book scene'),
      text: block(
        L('그림책 장면 일러스트.', "Children's picture book page illustration."),
        txt('pb_scene') && L(`장면: ${txt('pb_scene')}`, `Scene: ${txt('pb_scene')}`),
        L(`${josa(c.who, '이', '가')} ${txt('pb_action') || '장면 속에서 자연스럽게 행동한다'}${expr.length ? `, 표정: ${expr.join(', ')}` : ''}.`,
          `${cap(c.who)} is ${txt('pb_action') || 'acting naturally within the scene'}${expr.length ? `, with a ${list(expr, 'en')} expression` : ''}.`),
        txt('pb_bg') && L(`배경: ${txt('pb_bg')}`, `Background: ${txt('pb_bg')}`),
        comp.length && L(`구도: ${comp.join(', ')}`, `Composition: ${comp.join(', ')}`),
        L('동화책 분위기, 이야기의 감정이 느껴지는 조명, 글 넣을 여백 확보', 'Storybook atmosphere, lighting that conveys the emotion of the story, leave empty space for text'),
        '', charBlock(c), negative(c),
      ),
      ar: sel('pb_comp').includes('양면 펼침') ? '16:9' : '4:3',
    }];
  },
  goods(c) {
    const L = c.L;
    return itemsFor('goods_items', GOODS_DESC, c).map((it) => ({
      title: L(`굿즈 · ${it.key}`, `Goods · ${it.custom ? it.key : GOODS_DESC[it.key][1].split(':')[0]}`),
      text: block(
        it.custom ? L(`${it.key} 제품 디자인: 캐릭터를 활용한 굿즈 목업`, `${it.key} product design featuring the character, merchandise mockup`) : it.desc,
        PURPOSE_TUNING.goods[c.lang], '', charBlock(c), negative(c),
      ),
      ar: '1:1',
    }));
  },
  brand(c) {
    const L = c.L;
    const name = txt('brand_name');
    const msg = txt('brand_msg');
    const brandLine = [name && L(`브랜드명 "${name}" 로고 공간`, `space for the brand logo "${name}"`), msg && L(`슬로건 "${msg}"`, `slogan "${msg}"`)].filter(Boolean).join(', ');
    return itemsFor('brand_items', BRAND_DESC, c).map((it) => ({
      title: L(`브랜드 · ${it.key}`, `Brand · ${it.custom ? it.key : BRAND_DESC[it.key][1].split(':')[0]}`),
      text: block(
        it.custom ? L(`${it.key}: 브랜드 마스코트를 활용한 디자인`, `${it.key} featuring the brand mascot`) : it.desc,
        brandLine, PURPOSE_TUNING.brand[c.lang], '', charBlock(c), negative(c),
      ),
      ar: { '브랜드 홍보': '16:9', '포스터': '3:4' }[it.key] || '1:1',
    }));
  },
  emoticon(c) {
    const L = c.L;
    let emotions = vals('emo_emotions', c.lang);
    const actions = vals('emo_actions', c.lang);
    const situ = txt('emo_situ');
    if (!emotions.length && !actions.length) emotions = APPS.find((a) => a.key === 'emoticon').fields[0].options.slice(0, 8).map((x) => x[c.lang]);
    const countSel = sel('emo_count')[0];
    const n = customOf('emo_count').replace(/[^0-9]/g, '') || (countSel ? countSel.replace(/[^0-9]/g, '') : '') || String(Math.max(8, emotions.length + actions.length));
    const set = {
      title: L(`이모티콘 세트 (${n}개)`, `Emoticon set (${n})`),
      text: block(
        L(`같은 캐릭터로 구성된 이모티콘 스티커 세트 ${n}개.`, `Emoticon sticker set of ${n} featuring the same character.`),
        L(`레이아웃: ${n}개의 개별 스티커를 격자로 배치, 각각 흰색 외곽선, 배경 없이 분리하기 쉬운 단색 배경`, `Layout: grid of ${n} separate stickers, each with a white outline on a plain background that is easy to cut out`),
        emotions.length && L(`감정: ${emotions.join(', ')}`, `Emotions: ${emotions.join(', ')}`),
        actions.length && L(`행동: ${actions.join(', ')}`, `Actions: ${actions.join(', ')}`),
        situ && L(`상황: ${situ}`, `Situations: ${situ}`),
        PURPOSE_TUNING.emoticon[c.lang],
        L('각 스티커는 하나의 감정 또는 행동을 명확하게, 100px 크기에서도 읽히도록', 'Each sticker shows one clear emotion or action, readable at 100px'),
        '', charBlock(c), negative(c),
      ),
      ar: '1:1',
    };
    const items = [...emotions, ...actions, ...(situ ? situ.split(/[,，、]/).map((s) => s.trim()).filter(Boolean) : [])];
    const singles = {
      title: L('이모티콘 개별 프롬프트', 'Emoticon individual prompts'),
      text: items.map((e, i) => L(
        `${i + 1}. ${c.idSentence} — "${e}" 표현, 이모티콘 스타일, 흰색 외곽선, 단색 배경${c.core.length ? `, 유지: ${c.core.join('; ')}` : ''}`,
        `${i + 1}. ${c.idSentence} — "${e}", emoticon sticker style, white outline, plain background${c.core.length ? `, keep: ${c.core.join('; ')}` : ''}`,
      )).join('\n'),
      ar: '1:1',
      list: true,
    };
    return items.length ? [set, singles] : [set];
  },
  edu(c) {
    const L = c.L;
    const topic = txt('edu_topic');
    const age = c.targetAge.join(', ');
    return itemsFor('edu_items', EDU_DESC, c).map((it) => ({
      title: L(`교육 · ${it.key}`, `Education · ${it.custom ? it.key : EDU_DESC[it.key][1].split(':')[0]}`),
      text: block(
        it.custom ? L(`${it.key}: 캐릭터가 등장하는 교육용 이미지`, `${it.key}: educational image featuring the character`) : it.desc,
        (topic || c.message) && L(`학습 주제: ${topic || c.message}`, `Topic: ${topic || c.message}`),
        age && L(`대상: ${age}`, `Audience: ${age}`),
        PURPOSE_TUNING.edu[c.lang], '', charBlock(c), negative(c),
      ),
      ar: { '교육 영상 썸네일': '16:9', '워크시트': '3:4', '교구·포스터': '3:4' }[it.key] || '4:3',
    }));
  },
  sns(c) {
    const L = c.L;
    const topic = txt('sns_topic');
    return itemsFor('sns_items', SNS_DESC, c).map((it) => ({
      title: `SNS · ${it.key}`,
      text: block(
        it.custom ? L(`${it.key}: 캐릭터를 활용한 SNS 이미지`, `${it.key}: social media image featuring the character`) : it.desc,
        topic && L(`콘텐츠 주제: ${topic}`, `Content topic: ${topic}`),
        PURPOSE_TUNING.sns[c.lang], '', charBlock(c), negative(c),
      ),
      ar: { '세로 피드(4:5)': '4:5', '릴스·쇼츠 커버(9:16)': '9:16' }[it.key] || '1:1',
    }));
  },
  video(c) { return buildVideo(c); },
  game(c) {
    const L = c.L;
    const poses = vals('game_pose', c.lang);
    const item = txt('game_item');
    const world = txt('game_world');
    let fmts = sel('game_format');
    if (!fmts.length && !customOf('game_format')) fmts = ['캐릭터 일러스트'];
    const out = fmts.map((k) => {
      let main;
      if (k === '스프라이트 시트') {
        main = L(`게임 스프라이트 시트: ${(poses.length ? poses : ['대기', '걷기', '점프']).join(', ')} 애니메이션 프레임, 측면 시점, 동일 크기 격자, 배경 분리 쉬운 단색 배경`,
          `Game sprite sheet: ${list(poses.length ? poses : ['idle', 'walk', 'jump'], 'en')} animation frames, side view, equal-size grid, plain background easy to remove`);
      } else if (k === '게임 아이콘') {
        main = L('게임 아이콘: 캐릭터 얼굴 클로즈업, 정사각형, 둥근 모서리, 강한 대비, 작은 크기에서도 선명', 'Game icon: character face close-up, square with rounded corners, strong contrast, crisp at small sizes');
      } else {
        main = L(`게임 캐릭터 키 아트: ${poses.length ? `${poses.join(', ')} 포즈` : '역동적인 포즈'}${item ? `, ${josa(item, '을', '를')} 들고 있음` : ''}`,
          `Game character key art: ${poses.length ? `${list(poses, 'en')} pose` : 'dynamic pose'}${item ? `, holding ${item}` : ''}`);
      }
      return { title: L(`게임 · ${k}`, `Game · ${GAME_DESC[k][1]}`), main, ar: { '스프라이트 시트': '16:9', '게임 아이콘': '1:1' }[k] || '3:4' };
    });
    if (customOf('game_format')) out.push({ title: L(`게임 · ${customOf('game_format')}`, `Game · ${customOf('game_format')}`), main: L(`${customOf('game_format')}: 게임용 캐릭터 이미지`, `${customOf('game_format')}: game art of the character`), ar: '1:1' });
    return out.map((x) => ({
      title: x.title,
      ar: x.ar,
      text: block(
        x.main,
        item && L(`아이템: ${item}`, `Item: ${item}`),
        world && L(`세계관: ${world}`, `World setting: ${world}`),
        PURPOSE_TUNING.game[c.lang], '', charBlock(c), negative(c),
      ),
    }));
  },
};

/* ---------- 🎬 영상 (V2) ----------
 * 이미지→영상: 첨부한 마스터 이미지가 생김새를 담당하므로 외모를 다시 길게 설명하지 않고
 * 카메라 · 시간 순서대로의 동작 · 주변 변화 · 소리를 지시한다. 도구별로 형식을 바꾼다.
 */
/* 알아보기 쉬운 핵심 특징 = ★핵심 특징 (라벨 없이 짧게) */
function coreIdentity(c) {
  return c.core.map((t) => t.replace(/^[^:]+:\s*/, '')).slice(0, 4);
}
/* 성격 → 움직임의 느낌 */
function motionFeel(c) {
  const L = c.L;
  const has = (...v) => v.some((x) => sel('personality').includes(x));
  if (has('활발한', '장난꾸러기', '밝은')) return L('통통 튀는 경쾌한 움직임', 'bouncy, lively, playful movement');
  if (has('수줍은')) return L('조심스럽고 작은 움직임', 'small, hesitant, shy movement');
  if (has('차분한', '신비로운')) return L('느리고 부드러운 움직임', 'slow, gentle, graceful movement');
  if (has('용감한')) return L('힘차고 당당한 움직임', 'confident, energetic movement');
  return L('부드럽고 자연스러운 움직임', 'smooth, natural movement');
}

function buildVideo(c) {
  const L = c.L;
  const tool = (sel('vid_tool')[0] && ({ '범용': 'generic', 'Veo': 'veo', 'Sora': 'sora', 'Kling': 'kling', 'Runway': 'runway' })[sel('vid_tool')[0]]) || 'generic';
  const toolName = customOf('vid_tool') || sel('vid_tool')[0] || L('범용', 'Generic');
  const i2v = !sel('vid_mode').includes('텍스트→영상');
  const fmtSel = sel('vid_format')[0] || '';
  const loop = fmtSel.includes('루프');
  const ar = customOf('vid_format') || ({ '숏폼 9:16': '9:16', '가로 16:9': '16:9', '정사각 1:1': '1:1', '짧은 루프(GIF)': '1:1' })[fmtSel] || '16:9';
  const sec = parseInt(customOf('vid_length') || (sel('vid_length')[0] || '8'), 10) || 8;
  const place = txt('vid_scene');
  const env = txt('vid_bg');
  const cam = vals('vid_camera', c.lang)[0] || L('고정 샷', 'static locked-off camera');
  let beats = ['vid_beat1', 'vid_beat2', 'vid_beat3'].map(txt).filter(Boolean);
  if (!beats.length) beats = [L('카메라를 바라보며 반갑게 손을 흔든다', 'waves happily at the camera')];
  /* 초 단위 구간 나누기 */
  const cuts = beats.map((_, i) => Math.round((sec * i) / beats.length));
  const timeline = beats.map((b, i) => `${cuts[i]}–${i === beats.length - 1 ? sec : cuts[i + 1]}s: ${b}`);
  const seq = beats.join(L(', 그다음 ', ', then '));
  const feel = motionFeel(c);
  const core = coreIdentity(c);
  const who = c.who;
  const sounds = vals('vid_sound', c.lang).filter((s) => !/대사|dialogue/.test(s));
  const noAudio = sel('vid_sound').includes('무음');
  const line = txt('vid_line');
  const style = c.style || '';

  const keepRef = i2v
    ? L(`첨부한 마스터 이미지를 첫 프레임으로 사용. 캐릭터는 이미지와 완전히 동일하게 유지${core.length ? ` (${core.join(', ')})` : ''} — 다시 디자인하지 말 것`,
      `Use the attached master image as the first frame. Keep the character exactly as in the image${core.length ? ` (${core.join(', ')})` : ''} — do not redesign it`)
    : L(`캐릭터: ${c.idSentence}${c.core.length ? ` 핵심 특징: ${c.core.join('; ')}` : ''}`, `Character: ${c.idSentence}${c.core.length ? ` Core identity: ${c.core.join('; ')}` : ''}`);
  const audio = noAudio ? L('소리 없음', 'No audio')
    : [sounds.length ? sounds.join(', ') : '', line ? L(`대사 — ${who}: "${line}"`, `Dialogue — ${cap(who)} says: "${line}"`) : ''].filter(Boolean).join('; ');
  const avoid = L('피해야 할 것: 캐릭터 모양이 변하는 현상(모핑), 팔다리 왜곡, 깜빡임, 색 변화, 다른 캐릭터 등장, 화면 글자',
    'Avoid: morphing, distorted limbs, flicker, color shifts, extra characters, on-screen text');
  const loopLine = loop ? L('끝 장면이 첫 장면과 자연스럽게 이어지는 반복 루프', 'Seamless loop — the last frame flows back into the first') : '';

  let text;
  if (tool === 'veo') {
    text = block(
      L(`[카메라] ${cam}, ${ar}`, `Camera: ${cam}, ${ar} framing`),
      L(`[대상] ${who}${i2v ? ' — 첨부한 이미지 속 캐릭터 그대로' : ` — ${c.idSentence}`}`, `Subject: ${cap(who)}${i2v ? ' — exactly the character in the reference image' : ` — ${c.idSentence}`}`),
      L(`[동작] ${seq} (${feel})`, `Action: ${seq} (${feel})`),
      L(`[배경] ${[place, env].filter(Boolean).join(', ') || '단순한 배경'}`, `Context: ${[place, env].filter(Boolean).join(', ') || 'simple clean background'}`),
      L(`[스타일·분위기] ${[style, c.mood.join(', ')].filter(Boolean).join(', ')}`, `Style & ambiance: ${[style, c.mood.join(', ')].filter(Boolean).join(', ')}`),
      audio && L(`[소리] ${audio}`, `Audio: ${audio}`),
      loopLine, i2v ? keepRef : '', avoid,
      L(`(설정: ${sec}초, ${ar}${i2v ? ', 이미지→영상' : ''})`, `(Settings: ${sec}s, ${ar}${i2v ? ', image-to-video' : ''})`),
    );
  } else if (tool === 'sora') {
    text = block(
      L(`${sec}초 길이의 ${ar} 영상. 카메라는 ${cam}. ${place ? `${place}에서 ` : ''}${josa(who, '이', '가')} ${seq}. ${env ? `${env}. ` : ''}${feel}. ${style ? `${style}.` : ''}${audio ? ` 소리: ${audio}.` : ''}`,
        `A ${sec}-second ${ar} shot. Camera: ${cam}. ${place ? `In ${place}, ` : ''}${who} ${seq}. ${env ? `${cap(env)}. ` : ''}${cap(feel)}. ${style ? `${cap(style)}.` : ''}${audio ? ` Audio: ${audio}.` : ''}`),
      loopLine, keepRef, avoid,
      '---', L(`설정: 길이 ${sec}초, 비율 ${ar}`, `Settings: duration ${sec}s, aspect ratio ${ar}`),
    );
  } else if (tool === 'runway') {
    /* Runway: 이미지 기반 — 움직임만 짧게, 외모 설명 반복 금지 */
    text = block(
      L(`${cam}. 캐릭터가 ${seq}. ${env ? `${env}. ` : ''}${feel}.`, `${cap(cam)}. The character ${seq}. ${env ? `${cap(env)}. ` : ''}${cap(feel)}.`),
      loopLine,
      '---', L(`설정: 마스터 이미지를 시작 이미지로, ${sec}초, ${ar} — 한 번에 한 가지씩만 바꿔 가며 다듬으세요`, `Settings: master image as the start image, ${sec}s, ${ar} — refine one variable at a time`),
    );
  } else if (tool === 'kling') {
    text = block(
      L(`프롬프트: ${josa(who, '이', '가')} ${seq}, ${cam}, ${[place, env].filter(Boolean).join(', ')}${style ? `, ${style}` : ''}, ${feel}`,
        `Prompt: ${who} ${seq}, ${cam}, ${[place, env].filter(Boolean).join(', ')}${style ? `, ${style}` : ''}, ${feel}`),
      audio && L(`소리: ${audio}`, `Audio: ${audio}`),
      loopLine, i2v ? keepRef : '',
      L('네거티브 프롬프트: 모핑, 팔다리 왜곡, 깜빡임, 색 변화, 다른 캐릭터, 글자', 'Negative prompt: morphing, deformed limbs, flicker, color shift, extra characters, text'),
      '---', L(`설정: ${sec}초, ${ar}${i2v ? ', 이미지→영상 (마스터 이미지를 시작 프레임으로)' : ''}`, `Settings: ${sec}s, ${ar}${i2v ? ', image-to-video with the master image as the start frame' : ''}`),
    );
  } else {
    text = block(
      keepRef,
      L(`샷: ${ar}, ${sec}초, ${cam}`, `Shot: ${ar}, ${sec} seconds, ${cam}`),
      (place || env) && L(`장소: ${[place, env].filter(Boolean).join(' — ')}`, `Setting: ${[place, env].filter(Boolean).join(' — ')}`),
      L('동작 타임라인:', 'Action timeline:'), ...timeline,
      L(`움직임: ${feel}, 모든 프레임에서 비율·색 일정`, `Motion: ${feel}, proportions and colors consistent in every frame`),
      audio && L(`소리: ${audio}`, `Audio: ${audio}`),
      style && L(`스타일: ${style}`, `Style: ${style}`),
      loopLine, avoid,
    );
  }

  const out = [{ title: L(`🎬 영상 프롬프트 — ${toolName}`, `🎬 Video prompt — ${toolName}`), text, ar, raw: true }];

  /* 시작·끝 프레임 이미지 (처음·끝 프레임을 지정할 수 있는 도구용 / 장면이 마스터 이미지와 다를 때) */
  const frame = (beat, label) => ({
    title: L(`🖼 ${label} 프레임 이미지`, `🖼 ${label === '시작' ? 'Start' : 'End'} frame image`), ar,
    text: block(
      L(`영상의 ${label} 프레임으로 쓸 정지 이미지: ${who} — ${beat}`, `Still image for the video's ${label === '시작' ? 'first' : 'last'} frame: ${who} — ${beat}`),
      (place || env) && L(`장소: ${[place, env].filter(Boolean).join(', ')}`, `Setting: ${[place, env].filter(Boolean).join(', ')}`),
      L(`카메라 구도: ${cam}의 ${label} 구도, 비율 ${ar}`, `Framing: ${label === '시작' ? 'opening' : 'closing'} composition of a ${cam}, aspect ratio ${ar}`),
      '', charBlock(c), negative(c),
    ),
  });
  out.push(frame(beats[0], '시작'));
  if (beats.length > 1) out.push(frame(beats[beats.length - 1], '끝'));
  return out;
}

/* 색칠 도안 (V2) */
APP_BUILDERS.coloring = function coloring(c) {
  const L = c.L;
  const line = vals('col_line', c.lang)[0] || (c.targetAge.some((a) => /0~3|0-3/.test(a)) ? L('아주 굵게', 'very thick bold outlines') : L('굵고 깔끔한 선', 'thick clean outlines'));
  const scene = txt('col_scene');
  const age = c.targetAge.join(', ');
  const base = [
    c.L(`캐릭터: ${c.idSentence}`, `Character: ${c.idSentence}`),
    lockLine(c),
  ];
  let items = sel('col_items');
  if (!items.length && !customOf('col_items')) items = ['색칠 도안'];
  const out = items.map((k) => {
    if (k === '따라 그리기') {
      return {
        title: L('따라 그리기 단계 도안', 'Step-by-step drawing guide'), ar: '16:9',
        text: block(
          L('따라 그리기 단계 도안: 기본 도형에서 시작해 완성된 캐릭터까지 4~6단계, 각 단계에서 새로 추가된 선만 진하게, 흰 배경, 번호 표시',
            'Step-by-step drawing guide: 4 to 6 steps from basic shapes to the finished character, newly added lines emphasized in each step, white background, numbered steps'),
          c.silhouette.length && L(`시작 도형: ${c.silhouette.join(', ')}`, `Start from: ${c.silhouette.join(', ')}`),
          age && L(`대상: ${age}`, `Audience: ${age}`),
          '', ...base, L('피해야 할 것: 채색, 음영, 복잡한 디테일', 'Avoid: coloring, shading, complex details'),
        ),
      };
    }
    if (k === '컬러 가이드') {
      return {
        title: L('컬러 가이드 (색칠 예시)', 'Color guide'), ar: '3:4',
        text: block(
          L('색칠 예시 페이지: 왼쪽에 채색된 캐릭터, 오른쪽에 같은 캐릭터의 선화, 하단에 사용한 색 견본 원형 칩', 'Coloring reference page: colored character on the left, the same character as line art on the right, round color swatches at the bottom'),
          colorLine(c), '', ...base, negative(c),
        ),
      };
    }
    return {
      title: L('색칠 도안 (선화)', 'Coloring page (line art)'), ar: '3:4',
      text: block(
        L(`색칠 도안: 검은 선으로만 그린 선화, ${line}, 채색·음영·회색 없음, 흰 배경, 넓은 칠하기 영역, 인쇄용`,
          `Coloring page: black and white line art only, ${line}, no color, no shading, no gray, white background, large areas to color, printable`),
        scene && L(`함께 넣을 장면: ${scene}`, `Include in the scene: ${scene}`),
        c.message && L(`메시지가 느껴지는 장면: "${c.message}"`, `Scene that conveys: "${c.message}"`),
        age && L(`대상: ${age}`, `Audience: ${age}`),
        '', ...base, L('피해야 할 것: 채색, 회색 음영, 지나치게 작은 디테일, 글자', 'Avoid: color fills, gray shading, tiny details, text'),
      ),
    };
  });
  if (customOf('col_items')) out.push({ title: customOf('col_items'), ar: '3:4', text: block(L(`${customOf('col_items')}: 캐릭터를 활용한 활동지, 흑백 선화`, `${customOf('col_items')}: activity sheet featuring the character, black and white line art`), '', ...base) });
  return out;
};

function buildApplications(c) {
  const out = [];
  state.apps.forEach((k) => {
    const app = APPS.find((a) => a.key === k);
    if (app && APP_BUILDERS[k]) out.push({ app, prompts: APP_BUILDERS[k](c) });
  });
  if (!out.length && c.purposeLabel) {
    out.push({
      app: { key: 'custom', icon: '✨', title: c.purposeLabel },
      prompts: [{
        title: c.purposeLabel,
        text: block(c.L(`활용: ${josa(c.purposeLabel, '을', '를')} 위한 캐릭터 이미지`, `Application: character image for ${c.purposeLabel}`), '', charBlock(c), negative(c)),
      }],
    });
  }
  return out;
}

/* ---------- ⓪ DESIGN RATIONALE (디자인 기획서, 한국어) ---------- */
function buildRationale() {
  const c = collect('ko');
  const out = [];
  const who = c.target || c.targetDesc;
  const subj = c.name || `이 ${c.noun}`;

  /* 1. 목적과 타깃 */
  if (c.purposeLabel || who || c.message) {
    out.push({
      t: '목적 · 타깃',
      d: `${who ? `${josa([c.target, c.targetDesc].filter(Boolean).join(' — '), '을', '를')} 위한 ` : ''}${c.purposeLabel ? `${c.purposeLabel}용 ` : ''}캐릭터입니다.${c.targetTraits.length ? ` 타깃은 '${c.targetTraits.join(', ')}' 특징이 있어 이를 디자인에 반영했습니다.` : ''}${c.coTarget.length ? ` ${c.coTarget.join('·')}에게도 신뢰를 줄 수 있어야 합니다.` : ''}${c.message ? ` ${c.brief.msgLabel}: "${c.message}".` : ''}${c.theme.length && c.brief.themeLabel ? ` ${c.brief.themeLabel}: ${c.theme.join(', ')}.` : ''}`,
    });
  }
  /* 2. 인상 → 콘셉트 */
  if (c.impression.length || c.personality.length) {
    const imps = sel('impression').map((v) => IMPRESSIONS.find((x) => x.v === v)).filter(Boolean);
    out.push({
      t: '인상 · 성격',
      d: `${c.impression.length ? `${c.impression.join(', ')} 인상을 주기 위해 ` : ''}${c.personality.length ? `${c.personality.join(', ')} 성격` : '성격'}${c.role.length ? `의 ${c.role.join(', ')}` : ''}${c.job ? `(${c.job})` : ''}로 설정했습니다.${imps.length ? ` 근거: ${imps.slice(0, 2).map((x) => x.x.why).join(', ')}.` : ''}`,
    });
  }
  /* 3. 형태 */
  const sil = SILHOUETTES.find((s) => sel('silhouette').includes(s.v));
  if (sil || c.proportion.length || c.hands.length) {
    const parts = [];
    if (sil) parts.push(`${sil.x.icon} ${sil.v} 실루엣(${sil.x.mean})`);
    else if (c.silhouette.length) parts.push(`${c.silhouette.join(', ')} 실루엣`);
    if (c.proportion.length) parts.push(`${c.proportion.join(', ')} 비율`);
    if (c.hands.length) parts.push(`${c.hands.join(', ')}`);
    const condTxt = c.conditions.length ? ` 디자인 조건(${c.conditions.join(', ')})을 고려했습니다.` : '';
    out.push({ t: '형태', d: `${josa(parts.join(', ').replace(/\)$/, ')'), '을', '를')} 사용했습니다.${condTxt}` });
  }
  /* 4. 컬러 */
  const cols = ['main', 'sub', 'point'].map((k) => ({ k, ...state.colors[k] })).filter((x) => validHex(x.hex));
  if (cols.length) {
    const role = { main: '메인', sub: '서브', point: '포인트' };
    const seen = [];
    const desc = cols.map((x) => {
      const f = familyOf(x.hex);
      const again = seen.includes(f);
      seen.push(f);
      return `${role[x.k]} ${x.hex.toUpperCase()}(${again ? `${f} 계열 보조 톤` : `${f} — ${COLOR_FAMILIES[f].mean}`})`;
    });
    out.push({ t: '컬러', d: `${desc.join(', ')}.${c.mood.length ? ` 전체 무드는 ${c.mood.join(', ')}입니다.` : ''}` });
  }
  /* 5. 아이덴티티 */
  if (c.locks.length) {
    const shown = (c.core.length ? c.core : c.locks).map((l) => l.replace(/^[^:]+:\s*/, '')).slice(0, CORE_MAX);
    out.push({ t: '아이덴티티', d: `어떤 이미지에서도 ${subj}임을 알아볼 수 있도록 ${shown.length}개의 ★핵심 특징(${shown.join(', ')})을 정하고, 나머지 외형 ${Math.max(0, c.locks.length - shown.length)}개도 함께 고정했습니다.` });
  }
  /* 6. 활용 */
  const apps = state.apps.map((k) => APPS.find((a) => a.key === k)).filter(Boolean);
  if (apps.length || c.styleLabel) {
    out.push({ t: '표현 · 활용', d: `${c.styleLabel ? `${c.styleLabel} 스타일로 표현하고, ` : ''}${apps.length ? `${apps.map((a) => a.title).join(', ')} 분야로 확장합니다.` : '활용 방향은 11단계에서 정할 수 있습니다.'}` });
  }
  return out;
}

/* ---------- 전체 ---------- */
function buildAll(lang) {
  const c = collect(lang);
  const r = {
    c,
    rationale: buildRationale(),
    profile: buildProfile(c),
    identity: buildIdentity(c),
    master: buildMaster(c),
    sheets: buildSheets(c),
    apps: buildApplications(c),
  };
  /* 영어 프롬프트: 직접 입력한 한국어를 번역으로 교체 */
  if (lang === 'en') {
    r.profile = r.profile.map(([k, v]) => [k, enFix(v)]);
    r.identity = enFix(r.identity);
    r.master = enFix(r.master);
    r.sheets.forEach((s) => { s.text = enFix(s.text); });
    r.apps.forEach((a) => a.prompts.forEach((p) => { p.text = enFix(p.text); p.title = enFix(p.title); }));
  }
  return r;
}

/** 선택한 AI 도구 형식으로 변환한 결과 */
function formatted(r) {
  const tool = state.tool || 'generic';
  const lang = r.c.lang;
  return {
    master: formatFor(tool, r.master, { ar: AR.master }, lang),
    sheets: r.sheets.map((s) => ({ ...s, text: formatFor(tool, s.text, { ar: s.ar, derived: true, list: s.list }, lang) })),
    /* 영상 프롬프트(raw)는 영상 AI용이라 이미지 도구 형식을 적용하지 않음 */
    apps: r.apps.map((a) => ({ ...a, prompts: a.prompts.map((p) => ({ ...p, text: p.raw ? p.text : formatFor(tool, p.text, { ar: p.ar, derived: true, list: p.list }, lang) })) })),
  };
}

function fullText(r) {
  const f = formatted(r);
  r = { ...r, master: f.master, sheets: f.sheets, apps: f.apps };
  const hr = '='.repeat(48);
  const out = [
    'COLOR.M CHARACTER MAKER',
    `${r.c.name || 'Untitled'} — ${new Date().toLocaleString()}`,
    '', hr, '⓪ DESIGN BRIEF — 디자인 기획서', hr,
    ...r.rationale.map((x) => `[${x.t}] ${x.d}`),
    '', hr, '① CHARACTER PROFILE', hr,
    ...r.profile.map(([k, v]) => `${k}: ${v}`),
    '', hr, '② CHARACTER IDENTITY 🔒', hr, r.identity,
    '', hr, '③ MASTER PROMPT', hr, r.master,
    '', hr, '④ CHARACTER SHEET PROMPT', hr,
  ];
  r.sheets.forEach((s) => out.push(`[${s.title}]`, s.text, ''));
  out.push(hr, '⑤ APPLICATION PROMPT', hr);
  r.apps.forEach((a) => a.prompts.forEach((p) => out.push(`[${a.app.icon} ${p.title}]`, p.text, '')));
  return out.join('\n');
}
