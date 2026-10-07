/* COLOR.M CHARACTER MAKER — UI */
const STORE_KEY = 'colorm-character-design-maker-v2';
/* COLOR.M MAKER GALLERY — 캐릭터 디자인 탭의 작품 올리기 */
const GALLERY_UPLOAD = 'https://mlyoo7107-ux.github.io/PRODUCT-DESIGN-MAKER/gallery/upload.html?product=CHARACTER_MAKER';

function fresh() {
  return {
    step: 0,
    v: {},
    colors: { main: { hex: '', name: '' }, sub: { hex: '', name: '' }, point: { hex: '', name: '' } },
    locks: [],
    unlocked: [],
    idOverride: '',
    apps: [],
    lang: 'en',
    tool: 'generic',
    tr: {},
    refImage: '',
    core: null, // ★핵심 특징 — null이면 자동 추천
  };
}

/* 마스터 이미지는 실제 이미지 데이터(data:image/…;base64)만 허용 — 조작된 파일로 화면에 코드가 들어가는 것을 막음 */
const safeImage = (s) => (typeof s === 'string' && /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(s) ? s : '');

/* 저장된 값·불러온 파일을 V2 형식으로 정리 (V1 파일 호환) */
const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
const strs = (a) => (Array.isArray(a) ? a.filter((x) => typeof x === 'string') : []);
const str = (x) => (typeof x === 'string' ? x : '');
function normalize(raw, version) {
  /* 일부가 빠지거나 형식이 다른 값이 있어도 화면이 멈추지 않도록 항목마다 검사 */
  const st = { ...fresh(), ...(isObj(raw) ? raw : {}) };
  delete st.refUrl; // 미드저니 제거로 더 이상 쓰지 않음
  st.refImage = safeImage(st.refImage);
  const v = isObj(st.v) ? st.v : {};
  st.v = {};
  Object.keys(v).forEach((id) => {
    const x = v[id];
    if (typeof x === 'string') st.v[id] = x;
    else if (isObj(x)) st.v[id] = { sel: strs(x.sel), customOn: !!x.customOn, custom: str(x.custom) };
  });
  const col = isObj(st.colors) ? st.colors : {};
  st.colors = {};
  ['main', 'sub', 'point'].forEach((k) => {
    const c = isObj(col[k]) ? col[k] : {};
    st.colors[k] = { hex: str(c.hex), name: str(c.name) };
  });
  st.locks = strs(st.locks);
  st.unlocked = strs(st.unlocked);
  st.apps = strs(st.apps).filter((k) => APPS.some((a) => a.key === k));
  st.core = Array.isArray(st.core) ? strs(st.core) : null;
  st.idOverride = str(st.idOverride);
  st.lang = st.lang === 'ko' ? 'ko' : 'en';
  st.tool = TOOLS.some((t) => t.key === st.tool) ? st.tool : 'generic';
  const tr = isObj(st.tr) ? st.tr : {};
  st.tr = {};
  Object.keys(tr).forEach((k) => { if (typeof tr[k] === 'string') st.tr[k] = tr[k]; });
  if (typeof st.autoApp !== 'string') delete st.autoApp;
  if (version !== undefined && version < 2) {
    /* V1 → V2: 단계 구성이 달라서 처음 단계부터, 바뀐 선택지 이름 정리 */
    st.step = 0;
    const ears = st.v.face_ears;
    if (ears && Array.isArray(ears.sel)) ears.sel = ears.sel.map((v) => v.replace(/ 귀$/, ''));
    const body = st.v.body;
    if (body && Array.isArray(body.sel)) {
      if (body.sel.includes('SD 비율') && !st.v.proportion) st.v.proportion = { sel: ['2등신'], customOn: false, custom: '' };
      if (body.sel.includes('긴 비율') && !st.v.proportion) st.v.proportion = { sel: ['4~5등신'], customOn: false, custom: '' };
      body.sel = body.sel.filter((v) => v !== 'SD 비율' && v !== '긴 비율');
    }
  }
  st.step = Math.max(0, Math.min(STEPS.length - 1, +st.step || 0));
  return st;
}
function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? normalize(JSON.parse(raw)) : null;
  } catch (e) { return null; }
}
let state = load() || fresh();
let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* 저장 불가 환경 */ }
  }, 200);
}

const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const main = $('#main');
const side = $('#side');
let lastResult = null;

/* ---------- 색상 헬퍼 ---------- */
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const t = amt > 0 ? v + (255 - v) * amt : v * (1 + amt);
    return Math.round(Math.min(255, Math.max(0, t))).toString(16).padStart(2, '0');
  });
  return '#' + ch.join('');
}
const validHex = (h) => /^#[0-9a-f]{6}$/i.test(h);

/* ---------- 캐릭터 미리보기 SVG ---------- */
let svgUid = 0;
function charSVG(kind, col = {}) {
  const u = 'c' + (++svgUid);
  const m = col.main || '#9B92D6';
  const s = col.sub || '#F4E9F1';
  const p = col.point || '#FF9AA2';
  const ink = '#2b2540';
  let defs = '';
  let fill = (c) => c;
  let stroke = 'none';
  let sw = 0;
  let filter = '';
  let bg = '';
  let op = 1;
  let extra = '';

  const grad = (c, i) => `<radialGradient id="${u}g${i}" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="${shade(c, 0.45)}"/><stop offset=".55" stop-color="${c}"/><stop offset="1" stop-color="${shade(c, -0.28)}"/></radialGradient>`;
  const gradFill = () => {
    defs += grad(m, 0) + grad(s, 1) + grad(p, 2);
    fill = (c) => `url(#${u}g${[m, s, p].indexOf(c)})`;
  };
  const rough = (scale, freq = 0.06) => {
    defs += `<filter id="${u}f" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="${scale}"/></filter>`;
    filter = `filter="url(#${u}f)"`;
  };

  switch (kind) {
    case 'r3d': gradFill(); extra = '<ellipse cx="42" cy="34" rx="7" ry="4" fill="#fff" opacity=".45"/>'; break;
    case 'illust': stroke = ink; sw = 1.8; break;
    case 'book': stroke = '#7a5a44'; sw = 1.6; bg = '#FBF4E6'; rough(2.2); break;
    case 'flat': break;
    case 'cartoon': stroke = '#111'; sw = 3.6; break;
    case 'clay': gradFill(); rough(1.6, 0.9); break;
    case 'pencil':
      defs += [m, s, p].map((c, i) => `<pattern id="${u}h${i}" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="3" height="3" fill="${shade(c, 0.55)}"/><line x1="0" y1="0" x2="0" y2="3" stroke="${c}" stroke-width="1.6"/></pattern>`).join('');
      fill = (c) => `url(#${u}h${[m, s, p].indexOf(c)})`;
      stroke = shade(m, -0.35); sw = 0.9; rough(1.4, 0.3); break;
    case 'water': op = 0.78; bg = '#FDFCF8'; rough(3, 0.04); break;
    case 'minimal': fill = () => 'none'; stroke = ink; sw = 1.4; break;
    default: break;
  }
  const st = `stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"`;
  const g = `fill-opacity="${op}"`;
  const eye = kind === 'minimal' ? ink : ink;
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>${defs}</defs>
    ${bg ? `<rect width="100" height="100" fill="${bg}"/>` : ''}
    <ellipse cx="50" cy="92" rx="24" ry="3.5" fill="#000" opacity=".08"/>
    <g ${filter} ${g}>
      <circle cx="31" cy="27" r="10" fill="${fill(m)}" ${st}/>
      <circle cx="69" cy="27" r="10" fill="${fill(m)}" ${st}/>
      <circle cx="31" cy="27" r="5" fill="${fill(s)}" ${kind === 'minimal' ? st : ''}/>
      <circle cx="69" cy="27" r="5" fill="${fill(s)}" ${kind === 'minimal' ? st : ''}/>
      <ellipse cx="50" cy="72" rx="21" ry="18" fill="${fill(m)}" ${st}/>
      <ellipse cx="50" cy="75" rx="12" ry="10" fill="${fill(s)}" ${kind === 'minimal' ? st : ''}/>
      <circle cx="50" cy="45" r="24" fill="${fill(m)}" ${st}/>
      <path d="M31 63 Q50 72 69 63 L68 68 Q50 77 32 68 Z" fill="${fill(p)}" ${st}/>
    </g>
    ${extra}
    <circle cx="41" cy="45" r="3.2" fill="${eye}"/><circle cx="59" cy="45" r="3.2" fill="${eye}"/>
    <circle cx="42" cy="44" r="1" fill="#fff"/><circle cx="60" cy="44" r="1" fill="#fff"/>
    ${kind === 'minimal' ? '' : `<ellipse cx="35" cy="52" rx="4" ry="2.4" fill="${p}" opacity=".55"/><ellipse cx="65" cy="52" rx="4" ry="2.4" fill="${p}" opacity=".55"/>`}
    <path d="M46 52 Q50 56 54 52" fill="none" stroke="${ink}" stroke-width="1.6" stroke-linecap="round"/>
  </svg>`;
}
function currentColors() {
  const c = state.colors;
  return { main: validHex(c.main.hex) ? c.main.hex : '', sub: validHex(c.sub.hex) ? c.sub.hex : '', point: validHex(c.point.hex) ? c.point.hex : '' };
}
function currentStyleKind() {
  const sv = sel('style')[0];
  const op = STYLES.find((x) => x.v === sv);
  return op ? op.x : 'illust';
}

/* ---------- 추천 ---------- */
function purposeKey() {
  const p = PURPOSES.find((x) => x.v === sel('purpose')[0]);
  return p ? p.app : '';
}
function recFor(id) {
  const pk = purposeKey();
  return (pk && RECOMMEND[pk] && RECOMMEND[pk][id]) || [];
}

/* ---------- 필드 렌더링 ---------- */
function renderFields(fields) { return fields.map(renderField).join(''); }

function renderField(f) {
  switch (f.type) {
    case 'section':
      return `<div class="section-title"><h3>${esc(f.label)}</h3>${f.hint ? `<span>${esc(f.hint)}</span>` : ''}</div>`;
    case 'grid':
      return `<div class="grid">${renderFields(f.fields)}</div>`;
    case 'text':
      return `<div class="field field-text"><label class="field-text"><span class="label">${esc(fieldLabel(f))}</span>${f.desc ? `<span class="field-desc">${esc(f.desc)}</span>` : ''}
        <input type="text" data-act="text" data-id="${f.id}" value="${esc(state.v[f.id] || '')}" placeholder="${esc(f.dynLabel === 'msg' ? briefCfg().msgPh : (f.ph || ''))}"></label>${aiLine(f)}</div>`;
    case 'brief-head': {
      const p = PURPOSES.find((x) => x.v === sel('purpose')[0]);
      return p
        ? `<div class="brief-head"><span class="ico">${p.icon}</span><div><b>${esc(p.v)}용 브리프</b><span>여기서 정한 내용이 형태·컬러·특징 추천과 디자인 기획서의 근거가 돼요.</span></div><button type="button" class="link" data-act="goto" data-i="0">목적 바꾸기</button></div>`
        : `<div class="brief-head none"><span class="ico">💡</span><div><b>기본 브리프</b><span>STEP 01에서 사용 목적을 고르면 그 용도에 맞는 질문과 선택지로 바뀌어요.</span></div><button type="button" class="link" data-act="goto" data-i="0">목적 고르기</button></div>`;
    }
    case 'ai-all': return aiAllBox(f.step);
    case 'shapes': return shapeField(f);
    case 'color-advice': return colorAdviceField();
    case 'chips': return chipField(f);
    case 'styles': return styleField(f);
    case 'colors': return colorField();
    case 'locks': return lockField();
    case 'core': return coreField();
    case 'idsentence': return idField();
    case 'apps': return appsField();
    case 'apps-scope':
      return `<div class="scope-note">ℹ️ 여기서 만드는 것은 각 분야에 바로 쓸 수 있는 <b>캐릭터 이미지 · 짧은 영상 클립 프롬프트</b>예요.
        그림책 한 권, 뮤직비디오, 게임 자체를 완성해 주는 도구는 아니에요. 카드마다 <b>결과물</b>을 확인하세요.</div>`;
    default: return '';
  }
}

function customBlock(f, st, forceOpen) {
  const open = forceOpen || st.customOn;
  if (!open) return '';
  const tag = f.area ? 'textarea' : 'input';
  const attrs = `class="custom-input" data-act="custom-input" data-id="${f.id}" placeholder="${esc(f.customPh || '직접 입력하세요')}"`;
  return f.area
    ? `<${tag} ${attrs} rows="2">${esc(st.custom)}</${tag}>`
    : `<${tag} type="text" ${attrs} value="${esc(st.custom)}">`;
}

/* ---------- 추천 (브리프 기반 규칙) ---------- */
function aiLine(f) {
  if (!f.ai) return '';
  const r = aiRecommend(f.id);
  if (!r && f.id.startsWith('out_')) return '';
  if (!r) return '<div class="ai-line none"><span class="ai-tag">✨ 추천</span><span class="why">이 캐릭터 종류에는 생략해도 좋아요</span></div>';
  const label = r.text !== undefined ? r.text : r.vals.join(', ');
  const done = aiApplied(f.id, r);
  return `<div class="ai-line">
    <span class="ai-tag">✨ 추천</span><b>${esc(label)}</b><span class="why">${esc(r.why)}</span>
    ${done ? '<span class="ai-done">✓ 적용됨</span>' : `<button type="button" class="ai-btn" data-act="ai-apply" data-id="${f.id}">적용</button>`}
  </div>`;
}

function aiAllBox(step) {
  const basis = [
    sel('purpose')[0] && `${sel('purpose')[0]}용`,
    vals('target_age', 'ko').slice(0, 2).join('·'),
    sel('impression').slice(0, 3).join('·') && `${sel('impression').slice(0, 3).join('·')} 인상`,
    sel('conditions').length && `조건 ${sel('conditions').length}개`,
    step !== 'concept' && (vals('subtype', 'ko')[0] || vals('type', 'ko')[0]),
    step !== 'concept' && vals('personality', 'ko').filter((v) => v.length < 12).slice(0, 2).join('·'),
    txt('job'),
  ].filter(Boolean);
  const what = { concept: '역할과 성격', form: '형태', fashion: '의상과 소품' }[step] || '항목';
  return `<div class="ai-all">
    <div>
      <b>✨ 무엇을 골라야 할지 모르겠다면?</b>
      <p>${basis.length
        ? `앞에서 정한 내용(<em>${esc(basis.join(' / '))}</em>)을 근거로 목적에 맞는 ${josa(what, '을', '를')} 추천해 드려요.`
        : `STEP 01~03(목적, 타깃, 디자인 브리프)을 입력하면 목적에 맞는 ${josa(what, '을', '를')} 추천해 드려요.`}</p>
    </div>
    <button type="button" class="btn ai-all-btn" data-act="ai-apply-all" data-step="${step}">추천 한 번에 적용</button>
  </div>`;
}

/* 05 실루엣 — 형태 언어 카드 */
function shapeField(f) {
  const st = chipState(f.id);
  const ai = aiRecommend(f.id);
  const cards = f.options.map((op) => {
    const on = st.sel.includes(op.v);
    const pick = ai && ai.vals && ai.vals.includes(op.v);
    return `<button type="button" class="shape-card${on ? ' on' : ''}${pick ? ' ai-pick' : ''}" data-act="chip" data-id="${f.id}" data-v="${esc(op.v)}" aria-pressed="${on}">
      <span class="shape-icon">${op.x.icon}</span><b>${esc(op.v)}</b><small>${esc(op.x.mean)}</small></button>`;
  }).join('');
  return `<div class="field">
    <span class="label">${esc(f.label)}<small>기본 도형은 캐릭터의 첫인상을 결정해요</small></span>
    <div class="shape-grid">${cards}
      <button type="button" class="shape-card custom${st.customOn ? ' on' : ''}" data-act="custom" data-id="${f.id}" aria-pressed="${st.customOn}"><span class="shape-icon">+</span><b>직접입력</b></button>
    </div>
    ${customBlock(f, st)}
    ${aiLine(f)}
  </div>`;
}

/* 07 메시지 기반 컬러 추천 + 배색 */
function colorAdviceField() {
  const fams = adviseFamilies();
  const main = currentColors().main;
  const famHTML = fams.length
    ? `<div class="advice-list">${fams.map((f) => `<button type="button" class="advice" data-act="advice-main" data-hex="${f.hex}" title="메인 컬러로 적용">
        <i style="background:${f.hex}"></i><span><b>${esc(f.family)}</b><small>${esc(f.mean)}</small><em>${esc(f.from.join('·'))} 인상</em></span></button>`).join('')}</div>`
    : '<p class="muted small">STEP 03에서 "느껴져야 할 인상"을 고르면 메시지에 맞는 컬러를 추천해 드려요.</p>';
  const harm = main
    ? `<div class="harmony">${HARMONIES.map((h) => {
        const p = harmonyPalette(main, h.key);
        return `<button type="button" class="harm" data-act="harmony" data-k="${h.key}" title="서브·포인트 컬러로 적용">
          <span class="sw"><i style="background:${main}"></i><i style="background:${p.sub}"></i><i style="background:${p.point}"></i></span>
          <b>${esc(h.ko)}</b><small>${esc(h.desc)}</small></button>`;
      }).join('')}</div>`
    : '<p class="muted small">메인 컬러를 정하면 배색 방식별 서브·포인트 컬러를 추천해 드려요.</p>';
  return `<div class="field color-advice">
    <span class="label">✨ 메시지에 맞는 메인 컬러 <small>색채 심리 기반 · 누르면 메인 컬러로 적용</small></span>
    ${famHTML}
    <span class="label">🎨 배색 추천 <small>메인 컬러 기준 · 누르면 서브·포인트 컬러로 적용</small></span>
    ${harm}
  </div>`;
}

/* 사용 목적에 따라 바뀌는 라벨 (디자인 브리프) */
function fieldLabel(f) {
  if (f.dynLabel === 'msg') return briefCfg().msgLabel;
  if (f.dynLabel === 'theme') return briefCfg().themeLabel;
  return f.label;
}

function chipField(f) {
  const st = chipState(f.id);
  const opts = optionsOf(f);
  if (f.dynamic === 'theme' && !opts.length) return '';
  /* 추천 표시는 ✨ 하나로 통일: 근거가 있는 추천(브리프 기반)이 있으면 그것을, 없으면 목적별 기본 추천을 표시 */
  const ai = f.ai ? aiRecommend(f.id) : null;
  const picks = ai && ai.vals ? ai.vals : recFor(f.id);
  let label = fieldLabel(f);
  if (f.dynamic === 'subtype') {
    const t = sel('type')[0];
    if (!t && !customOf('type')) {
      return `<div class="field"><span class="label">${esc(label)}</span><p class="muted">캐릭터 종류를 먼저 선택하면 세부 종류가 나타나요.</p></div>`;
    }
    label = `${t || customOf('type')} — 세부 종류`;
  }
  if (f.dynamic === 'trait' && !opts.length) {
    return `<div class="field"><span class="label">${esc(label)}</span>${f.desc ? `<p class="field-desc">${esc(f.desc)}</p>` : ''}
      <p class="muted small">① 타깃 연령을 먼저 고르면 그 연령의 특징이 나타나요.</p>${customBlock(f, st, !sel('target_age').length && st.customOn)}</div>`;
  }
  const chips = opts.map((op) => {
    const on = st.sel.includes(op.v);
    const pick = picks.includes(op.v);
    return `<button type="button" class="chip${on ? ' on' : ''}${f.big ? ' big' : ''}${pick ? ' ai-pick' : ''}" data-act="chip" data-id="${f.id}" data-v="${esc(op.v)}" aria-pressed="${on}"${pick ? ' title="추천"' : ''}>
      ${op.icon ? `<span class="ico">${op.icon}</span>` : ''}${esc(op.v)}</button>`;
  }).join('');
  const noOpts = !opts.length;
  const customChip = noOpts ? '' : `<button type="button" class="chip custom${st.customOn ? ' on' : ''}${f.big ? ' big' : ''}" data-act="custom" data-id="${f.id}" aria-pressed="${st.customOn}">+ 직접입력</button>`;
  return `<div class="field${f.compact ? ' compact' : ''}">
    <span class="label">${esc(label)}${f.multi ? '<small>복수 선택</small>' : ''}${f.hint ? `<small>· ${esc(f.hint)}</small>` : ''}</span>
    ${(f.dynLabel === 'theme' ? briefCfg().themeDesc : f.desc) ? `<p class="field-desc">${esc(f.dynLabel === 'theme' ? briefCfg().themeDesc : f.desc)}</p>` : ''}
    <div class="chips">${chips}${customChip}</div>
    ${customBlock(f, st, noOpts)}
    ${aiLine(f)}
  </div>`;
}

function styleField(f) {
  const st = chipState(f.id);
  const ai = f.ai ? aiRecommend(f.id) : null;
  const picks = ai && ai.vals ? ai.vals : recFor(f.id);
  const col = currentColors();
  const cards = f.options.map((op) => {
    const on = st.sel.includes(op.v);
    return `<button type="button" class="style-card${on ? ' on' : ''}${picks.includes(op.v) ? ' ai-pick' : ''}" data-act="chip" data-id="${f.id}" data-v="${esc(op.v)}" aria-pressed="${on}">
      <div class="thumb">${charSVG(op.x, col)}</div>
      <span>${esc(op.v)}</span></button>`;
  }).join('');
  return `<div class="field">
    <span class="label">${esc(f.label)}<small>미리보기는 선택한 컬러로 표시됩니다</small></span>
    <div class="style-grid">${cards}
      <button type="button" class="style-card custom${st.customOn ? ' on' : ''}" data-act="custom" data-id="${f.id}" aria-pressed="${st.customOn}">
        <div class="thumb plus">+</div><span>직접입력</span></button>
    </div>
    ${customBlock(f, st)}
    ${aiLine(f)}
  </div>`;
}

function colorField() {
  const rows = [['main', '메인 컬러'], ['sub', '서브 컬러'], ['point', '포인트 컬러']].map(([k, label]) => {
    const c = state.colors[k];
    const hex = validHex(c.hex) ? c.hex : '#ffffff';
    return `<div class="color-row">
      <span class="label">${label}</span>
      <input type="color" data-act="color-pick" data-k="${k}" value="${hex}" aria-label="${label} 선택">
      <input type="text" class="hex" data-act="color-hex" data-k="${k}" value="${esc(c.hex)}" placeholder="#6257A8" maxlength="7" aria-label="${label} HEX">
      <input type="text" data-act="color-name" data-k="${k}" value="${esc(c.name)}" placeholder="색 이름 (예: Lavender Purple)" aria-label="${label} 이름">
      ${c.hex ? `<button type="button" class="icon-btn" data-act="color-clear" data-k="${k}" title="지우기">✕</button>` : ''}
    </div>`;
  }).join('');
  const presets = PALETTE_PRESETS.map((p, i) => `<button type="button" class="preset" data-act="preset" data-i="${i}">
    ${p.c.map((x) => `<i style="background:${x[0]}"></i>`).join('')}<span>${esc(p.name)}</span></button>`).join('');
  return `<div class="field">
    <span class="label">컬러<small>컬러피커 · HEX · 직접입력</small></span>
    <div class="colors">${rows}</div>
    <div class="presets"><span class="muted">팔레트 프리셋</span>${presets}</div>
  </div>`;
}

/* 09 — ★핵심 특징 고르기 (최대 5개). 고르지 않으면 자동 추천 3개 */
function coreField() {
  const cand = coreCandidates('ko');
  if (!cand.length) return '';
  const keys = coreKeys();
  const auto = !Array.isArray(state.core);
  const chips = cand.map((x) => {
    const on = keys.includes(x.key);
    const short = x.text.replace(/^[^:]+:\s*/, '');
    return `<button type="button" class="chip core-chip${on ? ' on' : ''}" data-act="core-toggle" data-k="${esc(x.key)}" aria-pressed="${on}">
      ${on ? '★ ' : ''}<small>${esc(x.label)}</small> ${esc(short)}</button>`;
  }).join('');
  return `<div class="field core-box">
    <span class="label">★ 핵심 특징 <small>${keys.length} / ${CORE_MAX} · 이 캐릭터를 알아보게 하는 것</small></span>
    <p class="field-desc">${auto
      ? '자동으로 골랐어요. 눌러서 바꿀 수 있어요. 핵심은 모든 프롬프트 맨 앞에 "절대 바꾸지 말 것"으로 들어가요.'
      : `직접 고른 핵심이에요. <button type="button" class="link" data-act="core-auto">자동 추천으로 되돌리기</button>`}</p>
    <div class="chips">${chips}</div>
  </div>`;
}

function lockField() {
  const auto = autoLocks('ko');
  const lockedN = auto.filter((x) => isLocked(x.key)).length;
  const autoItems = auto.map((x) => {
    const on = isLocked(x.key);
    return `<li class="${on ? '' : 'off'}">
      <span class="grp">${esc(x.group)}</span><span class="txt">${esc(x.text.replace(/^[^:]+:\s*/, ''))}</span>
      <button type="button" class="lock-toggle" data-act="lock-toggle" data-k="${x.key}" aria-pressed="${on}" title="${on ? '고정 해제' : '다시 고정'}">${on ? '🔒 고정' : '🔓 변경 가능'}</button>
    </li>`;
  }).join('');
  const items = state.locks.map((l, i) => `<li><span class="txt">🔒 ${esc(l)}</span><button type="button" class="icon-btn" data-act="lock-del" data-i="${i}" aria-label="삭제">✕</button></li>`).join('');
  return `<div class="field lock-box">
    <span class="label">① 앞 단계에서 선택한 외형 <small>자동 고정 ${lockedN} / ${auto.length}</small></span>
    <p class="muted small">STEP 05~06에서 고른 형태·의상은 모두 자동으로 고정돼요. 장면·상품에 따라 바뀌어도 되는 항목(예: 의상)만 눌러서 <b>🔓 변경 가능</b>으로 바꾸세요.</p>
    ${auto.length ? `<ul class="locks auto">${autoItems}</ul>` : `<p class="empty">STEP 05~06에서 형태·의상을 정하면 여기에 자동으로 고정돼요. <button type="button" class="link" data-act="goto" data-i="${stepIndex('form')}">형태 디자인으로 →</button></p>`}
  </div>
  <div class="field lock-box">
    <span class="label">② 그 밖에 꼭 지켜야 할 디테일 <small>직접 추가</small></span>
    <div class="lock-input">
      <input type="text" id="lockInput" data-act="lock-input" placeholder="예: 왼쪽 귀가 살짝 접혀 있음 (Enter로 추가)">
      <button type="button" class="btn primary" data-act="lock-add">추가</button>
    </div>
    <p class="muted small">선택지로 표현하기 어려운 세부 특징을 적어 주세요. 여러 개는 / 로 구분해요. 예: 꼬리 끝은 흰색 / 이마에 별 모양 점</p>
    ${items ? `<ul class="locks">${items}</ul>` : ''}
  </div>`;
}

function idField() {
  return `<div class="field id-box">
    <span class="label">캐릭터 한 줄 정의 <small>자동 생성 · 캐릭터 ID 문장으로 사용됩니다</small></span>
    <div class="id-auto">
      <p><b>KO</b><span id="idKo">${esc(autoIdSentence('ko'))}</span></p>
      <p><b>EN</b><span id="idEn">${esc(autoIdSentence('en'))}</span></p>
    </div>
    <label class="field-text"><span class="label sub">직접 수정 (입력하면 자동 문장 대신 사용)</span>
      <textarea data-act="id-override" rows="2" placeholder="예: 커다란 귀와 파란 꼬리 끝이 특징인 호기심 많고 따뜻한 작은 여우 모리.">${esc(state.idOverride)}</textarea>
    </label>
  </div>`;
}

/* 그림책 메이커 연결 — 주소(PICTUREBOOK_MAKER_URL)가 생기면 버튼, 없으면 준비 중 안내 */
function pbBridge() {
  return PICTUREBOOK_MAKER_URL
    ? `<div class="pb-bridge"><span>📖 이야기와 장면 전체는 <b>그림책 메이커</b>에서 만들어요. 이 캐릭터의 마스터 이미지와 ★핵심 특징을 가지고 가세요.</span>
        <a class="btn small primary" href="${esc(PICTUREBOOK_MAKER_URL)}" target="_blank" rel="noopener">그림책 메이커로 이어가기 →</a></div>`
    : '<div class="pb-bridge"><span>📖 여기서는 장면 이미지 프롬프트를 간단히 만들어요. 이야기·장면 전체를 만드는 <b>COLOR.M 그림책 메이커</b>는 준비 중이에요.</span></div>';
}

/* 영상 결과 — 영상 프롬프트와 시작·끝 프레임 이미지를 쓰는 순서 */
function videoGuide() {
  const tool = sel('vid_tool')[0] || customOf('vid_tool') || '범용';
  const t2v = sel('vid_mode').includes('텍스트→영상');
  const hasEnd = ['vid_beat1', 'vid_beat2', 'vid_beat3'].filter(txt).length > 1;
  const toolLine = tool === '범용'
    ? '<b>범용</b>은 어떤 영상 AI에도 붙여 넣을 수 있는 기본 형식이에요. 쓰는 도구가 정해져 있으면 STEP 11에서 Veo·Sora·Kling·Runway 중 하나를 고르세요. 그 도구가 잘 알아듣는 형식으로 바뀌어요.'
    : `<b>${esc(tool)}</b>에 맞춘 형식이에요. 그대로 붙여 넣으면 돼요.`;
  return `<div class="video-guide">
    <b>🎬 이렇게 사용하세요</b>
    <ul class="vg-what">
      <li><b>영상 프롬프트</b> — 영상 AI에 붙여 넣는 글이에요. ${toolLine}</li>
      <li><b>시작 프레임 이미지</b> — 영상의 <b>첫 장면</b>이 될 그림이에요. 영상 AI가 아니라 이미지 AI(ChatGPT·나노바나나 등)에서 만들어요.</li>
      ${hasEnd ? '<li><b>끝 프레임 이미지</b> — 영상의 <b>마지막 장면</b>이 될 그림이에요. 만드는 방법은 시작 프레임과 같아요.</li>' : ''}
    </ul>
    <ol>
      ${t2v
        ? '<li>영상 AI에서 <b>텍스트로 영상 만들기</b>를 고르고, 아래 <b>영상 프롬프트</b>를 붙여 넣어 생성하세요.</li><li>캐릭터가 자꾸 달라지면 <b>이미지로 영상 만들기</b> 방식이 더 잘 유지돼요. 아래 시작 프레임 이미지를 만들어 함께 쓰세요.</li>'
        : `<li><b>이미지 AI</b>에 마스터 이미지를 첨부하고, <b>시작 프레임 이미지</b> 프롬프트를 붙여 넣어 첫 장면 그림을 만드세요.${hasEnd ? ' 끝 프레임도 같은 방법으로 만들어요.' : ''}<br><small>첫 장면이 마스터 이미지와 거의 같다면 마스터 이미지를 그대로 써도 돼요.</small></li>
      <li><b>영상 AI</b>에서 <b>이미지로 영상 만들기</b>(Image to Video)를 고르고, 첫 장면 그림을 시작 이미지로 올리세요.${hasEnd ? '<br><small>도구에 끝 프레임(End frame / Last frame) 칸이 있으면 끝 장면 그림도 올리세요. 캐릭터가 그 장면으로 자연스럽게 움직여요. 칸이 없으면 시작 이미지만 쓰면 돼요.</small>' : ''}</li>
      <li><b>영상 프롬프트</b>를 붙여 넣고, 길이·비율을 프롬프트에 적힌 대로 맞춘 뒤 생성하세요.</li>`}
      <li>마음에 들지 않으면 <b>한 번에 한 가지만</b> 바꿔서 다시 만들어요. 예를 들면 동작만, 또는 카메라만 바꿔요.</li>
    </ol>
  </div>`;
}

function appsField() {
  const pk = purposeKey();
  return `<div class="apps">${APPS.map((a) => {
    const on = state.apps.includes(a.key);
    return `<div class="app-card${on ? ' on' : ''}">
      <button type="button" class="app-head" data-act="app-toggle" data-k="${a.key}" aria-expanded="${on}">
        <span class="ico">${a.icon}</span>
        <span class="t"><b>${esc(a.title)}${a.key === pk ? '<em class="rec">사용 목적</em>' : ''}</b><small>${esc(a.sub)}</small>${APP_GETS[a.key] ? `<small class="gets">결과물 → ${esc(APP_GETS[a.key])}</small>` : ''}</span>
        <span class="check">${on ? '✓' : '+'}</span>
      </button>
      ${on ? `<div class="app-body">${a.key === 'picturebook' ? pbBridge() : ''}${renderFields(a.fields)}</div>` : ''}
    </div>`;
  }).join('')}</div>`;
}

/* ---------- 단계 렌더링 ---------- */
function renderStepper() {
  $('#stepper').innerHTML = STEPS.map((s, i) => `<button type="button" class="${i === state.step ? 'cur' : ''}${i < state.step ? ' done' : ''}" data-act="goto" data-i="${i}"${i === state.step ? ' aria-current="step"' : ''}>
    <b>${s.no}</b><span>${esc(s.title)}</span></button>`).join('');
  /* 현재 단계가 보이도록 스테퍼만 가로로 스크롤 (페이지 세로 위치는 건드리지 않음) */
  const bar = $('#stepper');
  const cur = $('#stepper .cur');
  if (cur) bar.scrollLeft = cur.offsetLeft - (bar.clientWidth - cur.offsetWidth) / 2;
}

function render() {
  /* 다시 그려도 보던 위치 유지 */
  const y = window.scrollY;
  try {
    renderView();
  } catch (err) {
    /* 예상하지 못한 값으로 화면을 못 그릴 때 — 하얀 화면 대신 백업·새로 시작 안내 */
    console.error(err);
    main.innerHTML = `<section class="step recover">
      <header class="step-head"><span class="no">ERROR</span><h1>작업 내용을 화면에 표시하지 못했어요</h1>
      <p class="q">저장된 내용 중 일부가 예상과 달라요. 먼저 작업파일로 백업한 뒤 새로 시작해 주세요.</p></header>
      <div class="result-actions">
        <button type="button" class="btn" data-act="save-json">💾 작업파일로 백업</button>
        <button type="button" class="btn primary" data-act="recover-reset">🔄 새로 시작하기</button>
      </div>
    </section>`;
  }
  window.scrollTo(0, y);
}
function renderView() {
  renderStepper();
  const s = STEPS[state.step];
  if (s.result) { renderResult(); updateSide(); return; }
  const tip = TIPS[purposeKey()] && TIPS[purposeKey()][s.key];
  const pLabel = sel('purpose')[0] || '';
  main.innerHTML = `<section class="step${s.lock ? ' is-lock' : ''}">
    <header class="step-head">
      <span class="no">STEP ${s.no} · ${s.en}${s.lock ? ' 🔒' : ''}</span>
      <h1>${esc(s.title)}</h1>
      <p class="q">${esc(s.dynQ ? briefCfg().q : s.q)}</p>
      ${s.desc ? `<p class="desc">${esc(s.desc)}</p>` : ''}
    </header>
    ${tip ? `<div class="tip">💡 <b>${esc(pLabel)}</b> ${esc(tip)}</div>` : ''}
    <div class="fields">${renderFields(s.fields)}</div>
    <nav class="step-nav">
      ${state.step > 0 ? '<button type="button" class="btn" data-act="prev">← 이전</button>' : '<span></span>'}
      <button type="button" class="btn primary" data-act="next">${state.step === STEPS.length - 2 ? '캐릭터 디자인 완성 ✨' : '다음 →'}</button>
    </nav>
  </section>`;
  updateSide();
}

function go(i) {
  state.step = Math.max(0, Math.min(STEPS.length - 1, i));
  save();
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------- 사이드 캐릭터 카드 ---------- */
function updateSide() {
  const col = currentColors();
  const name = txt('name') || '이름 없음';
  const typeTxt = [vals('type', 'ko')[0], vals('subtype', 'ko')[0]].filter(Boolean).join(' › ');
  const swatches = ['main', 'sub', 'point'].map((k) => col[k] ? `<i style="background:${col[k]}" title="${col[k]}"></i>` : '').join('');
  const filled = STEPS.slice(0, -1).filter((s) => stepFilled(s)).length;
  const locks = allLocks('ko');
  side.innerHTML = `<div class="card char-card">
    <div class="char-thumb">${charThumb()}${safeImage(state.refImage) ? '' : '<span class="thumb-cap">스타일 예시</span>'}</div>
    <h2>${esc(name)}</h2>
    ${typeTxt ? `<p class="type">${esc(typeTxt)}</p>` : ''}
    ${sel('purpose')[0] || customOf('purpose') ? `<p class="badge">${esc(vals('purpose', 'ko').join(', '))}</p>` : ''}
    <blockquote>${esc(idSentence('ko'))}</blockquote>
    ${swatches ? `<div class="swatches">${swatches}</div>` : ''}
    ${locks.length ? `<div class="side-locks"><b>🔒 고정 특징 ${locks.length}개</b><ul>${locks.slice(0, 8).map((l) => `<li>${esc(l)}</li>`).join('')}${locks.length > 8 ? `<li class="muted">외 ${locks.length - 8}개</li>` : ''}</ul></div>` : ''}
    <div class="progress"><span style="width:${Math.round((filled / (STEPS.length - 1)) * 100)}%"></span></div>
    <p class="muted small">${filled} / ${STEPS.length - 1} 단계 입력됨 · 이 브라우저에 자동 저장</p>
  </div>`;
  const ko = $('#idKo'); const en = $('#idEn');
  if (ko) ko.textContent = autoIdSentence('ko');
  if (en) en.textContent = autoIdSentence('en');
}
function stepFilled(s) {
  if (s.key === 'lock') return allLocks('ko').length > 0;
  if (s.key === 'apps') return state.apps.length > 0;
  if (s.key === 'color') return !!(currentColors().main || sel('mood').length || customOf('mood'));
  const ids = [];
  const walk = (fs) => fs.forEach((f) => { if (f.id) ids.push(f.id); if (f.fields) walk(f.fields); });
  walk(s.fields);
  return ids.some((id) => (typeof state.v[id] === 'string' ? state.v[id].trim() : sel(id).length || customOf(id)));
}

/* ---------- 결과 페이지 ---------- */
function promptCard(title, key, text, sub, id) {
  return `<article class="card out"${id ? ` id="${id}"` : ''}>
    <header><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ''}<button type="button" class="btn small" data-act="copy" data-key="${key}">프롬프트 복사</button></header>
    <pre>${esc(text)}</pre>
  </article>`;
}

/* 캐릭터 썸네일: 마스터 이미지가 있으면 그 이미지, 없으면 스타일 미리보기 */
function charThumb() {
  return state.refImage ? `<img src="${safeImage(state.refImage)}" alt="마스터 이미지">` : charSVG(currentStyleKind(), currentColors());
}

/* 직접 입력한 한국어 → 영어 확인 */
function trPanel() {
  if (state.lang !== 'en') return '';
  const list = koInputs();
  if (!list.length) return '';
  let partial = 0;
  const rows = list.map((ko, i) => {
    const edited = state.tr && state.tr[ko] && state.tr[ko].trim();
    const auto = autoOf(ko);
    /* 동작·메시지 같은 문장은 단어 사전으로는 어순이 틀리기 쉬워서 항상 확인 요청 */
    const sentence = /(다|요|자|해)[.!?~]*$/.test(ko.trim());
    if (!edited && (!auto.complete || sentence)) partial++;
    const badge = edited ? '<span class="tr-badge ok">확인됨</span>'
      : !auto.complete ? '<span class="tr-badge warn">한국어 남음</span>'
        : sentence ? '<span class="tr-badge warn">문장 — 확인 필요</span>' : '<span class="tr-badge auto">자동 변환</span>';
    return `<div class="tr-row">
      <span class="tr-ko">${esc(ko)}</span>
      <input type="text" data-act="tr" data-i="${i}" value="${esc(edited || auto.en)}" aria-label="${esc(ko)} 영어 번역">
      ${badge}
    </div>`;
  }).join('');
  return `<details class="card tr-panel"${partial ? ' open' : ''}>
    <summary>🌐 직접 입력한 한국어 ${list.length}개를 영어로 바꿨어요 ${partial ? `<em>${partial}개 확인 필요</em>` : '<span class="ok">모두 변환됨</span>'}</summary>
    <p class="muted small">이미지 AI는 한국어를 잘못 읽을 수 있어요. 자동 변환 결과를 확인하고, 한국어가 남은 항목은 영어로 고쳐 주세요. 고친 내용은 모든 프롬프트에 반영되고 저장됩니다.</p>
    <div class="tr-list">${rows}</div>
  </details>`;
}

/* 기준 이미지로 고정하기 */
function refCard() {
  const t = toolOf(state.tool);
  return `<article class="card out ref-card">
    <header><h2>🖼 기준 이미지로 고정하기</h2><p>텍스트 고정 + 기준 이미지를 함께 쓰면 캐릭터가 가장 잘 유지돼요</p></header>
    <div class="ref-wrap">
      <div class="ref-img">
        ${state.refImage
          ? `<img src="${safeImage(state.refImage)}" alt="마스터 이미지"><div class="ref-btns"><button type="button" class="btn small" data-act="ref-upload">바꾸기</button><button type="button" class="btn small danger" data-act="ref-clear">삭제</button></div>`
          : '<button type="button" class="ref-drop" data-act="ref-upload"><b>＋</b><span>마스터 이미지 올리기</span><small>③으로 만든 이미지 중<br>가장 마음에 드는 1장</small></button>'}
      </div>
      <div class="ref-guide">
        <b>${t.icon} ${esc(t.name)}에서 사용하는 방법</b>
        <ol>${t.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
        ${t.prefix ? '<p class="muted small">④·⑤ 프롬프트 맨 앞에 "첨부한 기준 이미지와 같은 캐릭터로" 문장이 자동으로 들어가요.</p>' : ''}
      </div>
    </div>
  </article>`;
}

/* 결과의 품질을 좌우하는 핵심 입력이 비었는지 확인 */
function missingBox() {
  const has = (id) => sel(id).length || customOf(id);
  const miss = [
    ['purpose', '사용 목적', 'purpose'],
    ['type', '캐릭터 종류', 'concept'],
    ['personality', '성격', 'concept'],
    ['silhouette', '형태(실루엣)', 'form'],
    ['style', '표현 스타일', 'style'],
  ].filter(([id]) => !has(id));
  if (!miss.length) return '';
  return `<div class="missing-box">
    <b>⚠ 아직 비어 있는 항목이 ${miss.length}개 있어요</b>
    <p>비어 있으면 프롬프트가 너무 단순해져서 원하는 캐릭터가 나오기 어려워요. 채우면 결과가 훨씬 좋아져요.</p>
    <div class="miss-links">${miss.map(([, label, step]) => `<button type="button" class="chip" data-act="goto" data-i="${stepIndex(step)}">${esc(label)} 채우기 →</button>`).join('')}</div>
  </div>`;
}

/* 결과 페이지 바로가기 목차 — 긴 결과에서 원하는 곳으로 이동 */
function resultToc() {
  const items = [['r-brief', '기획서'], ['r-master', '마스터'], ['r-sheet', '캐릭터 시트'], ['r-apps', '활용'], ['r-save', '저장 · 갤러리']];
  return `<nav class="result-toc" aria-label="결과 바로가기">${items.map(([id, t]) => `<a href="#${id}">${t}</a>`).join('')}</nav>`;
}

function renderResult() {
  const r = buildAll(state.lang);
  lastResult = r;
  const f = formatted(r);
  const profileRows = r.profile.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('');
  const apps = f.apps.map((a, i) => `<div class="app-group">
      <h3>${a.app.icon} ${esc(a.app.title)}</h3>${APP_GETS[a.app.key] ? `<p class="muted small gets-line">${esc(APP_GETS[a.app.key])}</p>` : ''}${a.app.key === 'picturebook' ? pbBridge() : ''}${a.app.key === 'video' ? videoGuide() : ''}
      ${a.prompts.map((p, j) => `<div class="sub-out">
        <header><b>${esc(p.title)}${a.app.key === 'video' ? `<em class="where">${p.raw ? '→ 영상 AI에 붙여 넣기' : '→ 이미지 AI에 붙여 넣기'}</em>` : ''}</b><button type="button" class="btn small" data-act="copy" data-key="app-${i}-${j}">프롬프트 복사</button></header>
        <pre>${esc(p.text)}</pre></div>`).join('')}
    </div>`).join('');

  main.innerHTML = `<section class="step result">
    <header class="step-head">
      <span class="no">RESULT</span>
      <h1>${esc(r.c.name || '나의 캐릭터')} 완성!</h1>
      <p class="q">캐릭터 기획부터 활용까지, 단계별 프롬프트를 확인하세요.</p>
      <div class="lang-toggle" role="group" aria-label="프롬프트 언어">
        <button type="button" class="${state.lang === 'en' ? 'on' : ''}" data-act="lang" data-v="en">English 프롬프트 <small>권장</small></button>
        <button type="button" class="${state.lang === 'ko' ? 'on' : ''}" data-act="lang" data-v="ko">한국어 프롬프트</button>
      </div>
      <div class="tool-pick">
        <span class="label sub">사용할 이미지 AI 도구</span>
        <div class="chips">${TOOLS.map((t) => `<button type="button" class="chip${(state.tool || 'generic') === t.key ? ' on' : ''}" data-act="tool" data-v="${t.key}" title="${esc(t.desc)}">${t.icon} ${esc(t.name)}</button>`).join('')}</div>
        <p class="muted small">${esc(toolOf(state.tool).desc)} — 선택한 도구에 맞는 형식으로 프롬프트가 바뀌어요.</p>
      </div>
    </header>

    ${missingBox()}
    ${resultToc()}
    ${trPanel()}

    <article class="card out rationale" id="r-brief">
      <header><h2>⓪ DESIGN BRIEF — 디자인 기획서</h2><p>왜 이렇게 디자인했는가</p><button type="button" class="btn small" data-act="copy" data-key="rationale">복사하기</button></header>
      ${r.rationale.length ? `<dl>${r.rationale.map((x) => `<div><dt>${esc(x.t)}</dt><dd>${esc(x.d)}</dd></div>`).join('')}</dl>` : '<p class="empty">STEP 01~03을 입력하면 디자인 근거가 정리돼요.</p>'}
    </article>

    <details class="card out profile">
      <summary><h2>① CHARACTER PROFILE</h2><p>입력한 설정 전체 — 눌러서 펼치기</p><button type="button" class="btn small" data-act="copy" data-key="profile">복사하기</button></summary>
      <div class="profile-wrap">
        <div class="char-thumb big">${charThumb()}</div>
        <table>${profileRows || '<tr><td class="muted">입력된 정보가 없어요.</td></tr>'}</table>
      </div>
    </details>

    <article class="card out identity">
      <header><h2>② CHARACTER IDENTITY 🔒</h2><p>모든 이미지에서 유지할 캐릭터의 핵심</p><button type="button" class="btn small" data-act="copy" data-key="identity">복사하기</button></header>
      <pre>${esc(r.identity)}</pre>
    </article>

    ${promptCard('③ MASTER PROMPT', 'master', f.master, '캐릭터의 기본 이미지 생성용 — 가장 먼저 만드세요', 'r-master')}
    ${refCard()}
    <article class="card out" id="r-sheet">
      <header><h2>④ CHARACTER SHEET PROMPT</h2><p>한 장에 모두 담으면 측면·후면이 빠지기 쉬워서 4개로 나눴어요 — 순서대로 만드세요</p></header>
      ${f.sheets.map((s, j) => `<div class="sub-out">
        <header><b>${esc(s.title)}</b><button type="button" class="btn small" data-act="copy" data-key="sheet-${j}">프롬프트 복사</button></header>
        ${s.key === 'views' ? '<p class="muted small">④-1에서 측면·후면이 제대로 안 나오면, 마스터 이미지를 첨부하고 아래 줄을 한 줄씩 따로 생성하세요.</p>' : ''}
        <pre>${esc(s.text)}</pre></div>`).join('')}
    </article>

    <article class="card out" id="r-apps">
      <header><h2>⑤ APPLICATION PROMPT</h2><p>사용 목적과 활용 방향에 맞춰 자동 생성</p></header>
      ${apps || `<p class="empty">STEP 11에서 활용 방향을 선택하면 목적별 프롬프트가 만들어져요. <button type="button" class="link" data-act="goto" data-i="${stepIndex('apps')}">활용 방향 선택하기 →</button></p>`}
    </article>

    <!-- 프로젝트 저장 · 불러오기 (제품 디자인 메이커와 같은 구성) -->
    <article class="card out save-box" id="r-save">
      <header><h2>프로젝트 저장 · 불러오기</h2></header>
      <p class="muted small">작업파일을 저장하면 다음 수업에서 다시 불러와 선택 항목과 입력 내용을 이어서 수정할 수 있어요.</p>
      <div class="result-actions">
        <button type="button" class="btn primary" data-act="bible-open">📘 캐릭터 바이블 PDF 저장</button>
        <button type="button" class="btn" data-act="save-txt">📝 TXT 저장</button>
        <button type="button" class="btn" data-act="save-json">💾 작업파일 저장</button>
        <button type="button" class="btn" data-act="load-json">📂 작업파일 불러오기</button>
        <button type="button" class="btn" data-act="copy-all">📋 전체 내용 복사</button>
        <button type="button" class="btn danger" data-act="restart">🔄 처음부터 다시 만들기</button>
      </div>
      <p class="muted small">※ PDF는 제출·출력용이에요. 다시 수정하려면 '작업파일(.json)'을 저장해 주세요.</p>
      <div class="gallery-cta">
        <p>🖼 완성한 캐릭터 이미지가 있나요?</p>
        <a class="btn primary big" href="${GALLERY_UPLOAD}" target="_blank" rel="noopener">✨ 갤러리에 자랑하기 →</a>
      </div>
    </article>
  </section>`;
}

function copyText(key) {
  const r = lastResult;
  if (!r) return '';
  if (key === 'profile') return r.profile.map(([k, v]) => `${k}: ${v}`).join('\n');
  if (key === 'identity') return r.identity;
  if (key === 'rationale') return r.rationale.map((x) => `[${x.t}] ${x.d}`).join('\n');
  const f = formatted(r);
  if (key === 'master') return f.master;
  if (key.startsWith('sheet-')) return f.sheets[+key.split('-')[1]].text;
  if (key.startsWith('app-')) {
    const [, i, j] = key.split('-').map(Number);
    return f.apps[i].prompts[j].text;
  }
  return '';
}

/* ---------- 클립보드 / 파일 ---------- */
async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  toast('복사되었어요');
}
function download(name, text, type) {
  const blob = new Blob([text], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
const fileBase = () => (txt('name') || 'character').replace(/[\\/:*?"<>|\s]+/g, '_');

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1600);
}

/* ---------- 상태 변경 ---------- */
function setChip(id, v) {
  const f = FIELD_INDEX[id];
  const st = { ...chipState(id) };
  st.sel = st.sel.slice();
  const i = st.sel.indexOf(v);
  if (i >= 0) st.sel.splice(i, 1);
  else if (f && (f.multi)) st.sel.push(v);
  else st.sel = [v];
  state.v[id] = st;

  if (id === 'type') state.v.subtype = { ...chipState('subtype'), sel: [] };
  /* 연령이 바뀌면 해당하지 않는 '연령의 특징' 선택은 지움 */
  if (id === 'target_age') {
    const valid = optionsOf(FIELD_INDEX.target_trait).map((x) => x.v);
    state.v.target_trait = { ...chipState('target_trait'), sel: sel('target_trait').filter((v) => valid.includes(v)) };
  }
  if (id === 'purpose') {
    syncPurposeApp();
    /* 목적이 바뀌면 이전 목적의 테마·조건 선택은 지움 */
    ['brief_theme', 'conditions'].forEach((fid) => {
      const valid = optionsOf(FIELD_INDEX[fid]).map((x) => x.v);
      state.v[fid] = { ...chipState(fid), sel: sel(fid).filter((v) => valid.includes(v)) };
    });
  }
}
/* 사용 목적이 바뀌면 활용 방향을 자동 선택 */
function syncPurposeApp() {
  const pk = purposeKey();
  if (state.autoApp && state.autoApp !== pk) state.apps = state.apps.filter((a) => a !== state.autoApp);
  if (pk && !state.apps.includes(pk)) state.apps.unshift(pk);
  state.autoApp = pk;
}
function addLocks(text) {
  text.split(/\n|\//).map((s) => s.trim()).filter(Boolean).forEach((s) => {
    if (!state.locks.includes(s)) state.locks.push(s);
  });
}

/* ---------- 이벤트 ---------- */
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;
  const id = el.dataset.id;
  switch (act) {
    case 'chip': setChip(id, el.dataset.v); break;
    case 'custom': {
      const st = { ...chipState(id) };
      st.customOn = !st.customOn;
      state.v[id] = st;
      save(); render();
      if (st.customOn) { const inp = main.querySelector(`[data-act="custom-input"][data-id="${id}"]`); if (inp) inp.focus(); }
      return;
    }
    case 'goto': go(+el.dataset.i); return;
    case 'prev': go(state.step - 1); return;
    case 'next': go(state.step + 1); return;
    case 'lock-add': {
      const inp = $('#lockInput');
      if (inp && inp.value.trim()) { addLocks(inp.value); save(); render(); $('#lockInput').focus(); }
      return;
    }
    case 'ai-apply': aiApply(id); break;
    case 'advice-main': state.colors.main = { hex: el.dataset.hex, name: colorName(el.dataset.hex) }; break;
    case 'harmony': {
      const m = currentColors().main;
      if (!m) return;
      const p = harmonyPalette(m, el.dataset.k);
      state.colors.sub = { hex: p.sub, name: colorName(p.sub) };
      state.colors.point = { hex: p.point, name: colorName(p.point) };
      break;
    }
    case 'ai-apply-all': aiApplyAll(el.dataset.step); toast('추천을 적용했어요. 마음에 들지 않는 항목은 바꿔 보세요'); break;
    case 'lock-del': state.locks.splice(+el.dataset.i, 1); break;
    case 'core-toggle': {
      const k = el.dataset.k;
      const cur = coreKeys();
      if (cur.includes(k)) state.core = cur.filter((x) => x !== k);
      else if (cur.length >= CORE_MAX) { toast(`핵심 특징은 ${CORE_MAX}개까지 고를 수 있어요`); return; }
      else state.core = [...cur, k];
      break;
    }
    case 'core-auto': state.core = null; break;
    case 'lock-toggle': {
      const k = el.dataset.k;
      const u = state.unlocked || [];
      state.unlocked = u.includes(k) ? u.filter((x) => x !== k) : [...u, k];
      break;
    }
    case 'preset': {
      const p = PALETTE_PRESETS[+el.dataset.i];
      ['main', 'sub', 'point'].forEach((k, i) => { state.colors[k] = { hex: p.c[i][0], name: p.c[i][1] }; });
      break;
    }
    case 'color-clear': state.colors[el.dataset.k] = { hex: '', name: '' }; break;
    case 'app-toggle': {
      const k = el.dataset.k;
      state.apps = state.apps.includes(k) ? state.apps.filter((a) => a !== k) : [...state.apps, k];
      break;
    }
    case 'lang': state.lang = el.dataset.v; break;
    case 'tool': state.tool = el.dataset.v; break;
    case 'ref-upload': $('#refInput').click(); return;
    case 'bible-open': openBible(); return;
    case 'bible-close': closeBible(); return;
    case 'bible-print': printBible(); return;
    case 'ref-clear': state.refImage = ''; break;
    case 'copy':
      if (el.closest('summary')) e.preventDefault(); // 접힌 프로필의 복사 버튼은 펼치기와 분리
      copy(copyText(el.dataset.key)); return;
    case 'copy-all': copy(fullText(lastResult)); return;
    case 'save-txt': download(`${fileBase()}_prompts.txt`, fullText(lastResult), 'text/plain;charset=utf-8'); toast('텍스트 파일로 저장했어요'); return;
    case 'load-json': $('#fileInput').click(); return;
    case 'save-json': saveProject(); return;
    case 'restart':
      if (!confirm('입력한 내용을 모두 지우고 처음부터 다시 만들까요?\n(필요하면 먼저 프로젝트를 저장하세요)')) return;
      state = fresh(); save(); render(); window.scrollTo({ top: 0 }); return;
    case 'recover-reset': state = fresh(); save(); render(); window.scrollTo({ top: 0 }); return;
    default: return;
  }
  save();
  render();
});

document.addEventListener('input', (e) => {
  const el = e.target;
  const act = el.dataset && el.dataset.act;
  if (!act) return;
  const id = el.dataset.id;
  const k = el.dataset.k;
  switch (act) {
    case 'text': state.v[id] = el.value; break;
    case 'custom-input': state.v[id] = { ...chipState(id), customOn: true, custom: el.value }; break;
    case 'id-override': state.idOverride = el.value; break;
    case 'color-pick': {
      state.colors[k].hex = el.value.toUpperCase();
      const hex = main.querySelector(`[data-act="color-hex"][data-k="${k}"]`);
      if (hex) hex.value = state.colors[k].hex;
      refreshStyleThumbs();
      break;
    }
    case 'color-hex': {
      let v = el.value.trim();
      if (v && v[0] !== '#') v = '#' + v;
      state.colors[k].hex = v;
      if (validHex(v)) {
        const pick = main.querySelector(`[data-act="color-pick"][data-k="${k}"]`);
        if (pick) pick.value = v.toLowerCase();
        refreshStyleThumbs();
      }
      break;
    }
    case 'color-name': state.colors[k].name = el.value; break;
    case 'tr': {
      const ko = koInputs()[+el.dataset.i];
      if (ko) state.tr = { ...(state.tr || {}), [ko]: el.value };
      break;
    }
    default: return;
  }
  save();
  updateSide();
});

document.addEventListener('change', (e) => {
  /* 번역 수정을 마치면 프롬프트 다시 생성 */
  if (e.target.dataset && e.target.dataset.act === 'tr') { render(); return; }
  /* 컬러 피커를 닫을 때 지우기 버튼 등을 갱신 */
  if (e.target.dataset && (e.target.dataset.act === 'color-pick' || e.target.dataset.act === 'color-hex')) render();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.body.classList.contains('bible-open')) { closeBible(); return; }
  if (e.key === 'Enter' && e.target.id === 'lockInput' && !e.isComposing) {
    e.preventDefault();
    if (e.target.value.trim()) { addLocks(e.target.value); save(); render(); $('#lockInput').focus(); }
  }
});

function refreshStyleThumbs() {
  const col = currentColors();
  main.querySelectorAll('.style-card[data-v]').forEach((card) => {
    const op = STYLES.find((x) => x.v === card.dataset.v);
    if (op) card.querySelector('.thumb').innerHTML = charSVG(op.x, col);
  });
}

$('#fileInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (data.app !== 'colorm-character-maker' || !data.state || typeof data.state !== 'object') throw new Error('format');
      const ver = +data.version || 1;
      const prev = state;
      state = normalize(data.state, ver);
      /* 불러온 내용으로 결과까지 만들어 보고, 안 되면 지금 작업을 그대로 둠 */
      try { buildAll(state.lang); } catch (err) { state = prev; throw err; }
      save(); render();
      toast(ver < 2 ? '예전(V1) 프로젝트를 불러왔어요. 새로 생긴 타깃·브리프 단계를 채워 주세요' : '프로젝트를 불러왔어요');
    } catch (err) {
      alert('COLOR.M 캐릭터 프로젝트 파일(.json)이 아니에요.');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});

/* 마스터 이미지: 최대 640px JPEG로 줄여 브라우저에 저장 */
$('#refInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file || !file.type.startsWith('image/')) return;
  const img = new Image();
  img.onload = () => {
    const scale = Math.min(1, 640 / Math.max(img.width, img.height));
    const cv = document.createElement('canvas');
    cv.width = Math.round(img.width * scale);
    cv.height = Math.round(img.height * scale);
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.drawImage(img, 0, 0, cv.width, cv.height);
    state.refImage = cv.toDataURL('image/jpeg', 0.85);
    URL.revokeObjectURL(img.src);
    save(); render();
    toast('마스터 이미지를 저장했어요');
  };
  img.onerror = () => alert('이미지를 불러오지 못했어요.');
  img.src = URL.createObjectURL(file);
});

/* 작업파일(.json) 저장 — 상단 '저장'과 결과 페이지 '작업파일 저장'이 같이 씀 */
function saveProject() {
  download(`${fileBase()}.colorm.json`, JSON.stringify({ app: 'colorm-character-maker', version: 2, state }, null, 2), 'application/json');
  toast('작업파일로 저장했어요');
}
$('#btnSave').addEventListener('click', saveProject);
$('#btnLoad').addEventListener('click', () => $('#fileInput').click());
$('#btnNew').addEventListener('click', () => {
  if (!confirm('입력한 내용을 모두 지우고 새 캐릭터를 만들까요?')) return;
  state = fresh(); save(); render(); window.scrollTo({ top: 0 });
});

/* 고정 머리말(로고 바 + 단계 메뉴)의 실제 높이를 CSS에 알려 줌 — 사이드 카드 위치·화면 이동 위치 보정 */
const appHead = $('#appHead');
function syncHeadHeight() {
  if (appHead) document.documentElement.style.setProperty('--head-h', `${appHead.offsetHeight}px`);
}
window.addEventListener('resize', syncHeadHeight);
window.addEventListener('load', syncHeadHeight); // 웹폰트 로딩 후 높이 재측정
window.addEventListener('scroll', () => { if (appHead) appHead.classList.toggle('scrolled', window.scrollY > 4); }, { passive: true });

render();
syncHeadHeight();
