/* COLOR.M CHARACTER MAKER — 캐릭터 바이블 (A4 인쇄 / PDF)
 * 1쪽: 캐릭터 카드 (이미지 · 정의 · 프로필 · 컬러 · 고정 특징 · Do & Don't)
 * 2쪽: 프롬프트 (캐릭터 ID · 마스터 · 캐릭터 시트, 영어)
 */
function bibleHTML() {
  const ko = buildAll('ko');
  const en = buildAll('en');
  const c = ko.c;
  const enF = formatted(en);
  const auto = autoLocks('ko');
  const locked = auto.filter((x) => isLocked(x.key));
  const flexible = auto.filter((x) => !isLocked(x.key));
  const colors = ['main', 'sub', 'point'].map((k) => ({ k, ...state.colors[k] })).filter((x) => validHex(x.hex));
  const roleName = { main: 'MAIN', sub: 'SUB', point: 'POINT' };
  const today = new Date().toLocaleDateString('ko-KR');
  const name = c.name || '이름 없는 캐릭터';
  const nameEn = c.name ? romanize(c.name) : '';

  const prof = [
    ['종류', [c.typeLabel, vals('subtype', 'ko').join(', ')].filter(Boolean).join(' › ')],
    ['연령 · 성별', [c.age.join(', '), c.gender.join(', ')].filter(Boolean).join(' · ')],
    ['역할', [c.role.join(', '), c.job].filter(Boolean).join(' · ')],
    ['성격', c.personality.join(', ')],
    ['스타일', [c.styleLabel, c.mood.join(', ')].filter(Boolean).join(' · ')],
    ['사용 목적', c.purposeLabel],
    ['타깃', c.target],
    ['인상', c.impression.join(', ')],
  ].filter((r) => r[1]);

  const lockItem = (x) => `<li><b>${esc(x.group)}</b>${esc(x.text.replace(/^[^:]+:\s*/, ''))}</li>`;
  const apps = state.apps.map((k) => APPS.find((a) => a.key === k)).filter(Boolean);

  const dos = [
    '🔒 고정 특징은 모든 이미지에서 그대로 유지',
    colors.length ? `컬러는 지정한 HEX 값(${colors.map((x) => x.hex.toUpperCase()).join(' · ')}) 그대로 사용` : '처음 정한 색 조합을 그대로 사용',
    c.styleLabel ? `${c.styleLabel} 스타일로 통일` : '처음 만든 그림체로 통일',
    '새 이미지는 마스터 이미지를 기준(참조) 이미지로 함께 사용',
  ];
  const donts = [
    '고정 특징을 빼거나 모양·위치 바꾸기',
    '메인·서브·포인트 컬러를 다른 색으로 바꾸기',
    '다른 그림체(실사, 다른 화풍)와 섞기',
    '얼굴 비율·체형을 다른 캐릭터처럼 바꾸기',
    '이미지 안에 의도하지 않은 글자·워터마크 넣기',
  ];

  return `
  <div class="bible-toolbar">
    <b>📘 캐릭터 바이블 미리보기</b>
    <span class="muted small">A4 3쪽 (캐릭터 카드 · 디자인 의도 · 프롬프트) · 인쇄 창에서 "PDF로 저장"을 선택하세요</span>
    <button type="button" class="btn primary" data-act="bible-print">PDF로 저장 / 인쇄</button>
    <button type="button" class="btn" data-act="bible-close">닫기</button>
  </div>

  <section class="bible-sheet">
    <header class="bb-head">
      <img src="assets/logo.png" alt="COLOR.M">
      <div><span>CHARACTER BIBLE</span><small>${esc(today)}</small></div>
    </header>

    <div class="bb-hero">
      <div class="bb-img">${state.refImage ? `<img src="${safeImage(state.refImage)}" alt="${esc(name)}">` : charSVG(currentStyleKind(), currentColors())}</div>
      <div class="bb-title">
        <h1>${esc(name)}${nameEn && nameEn !== name ? `<small>${esc(nameEn)}</small>` : ''}</h1>
        <p class="bb-id">“${esc(c.idSentence.replace(/\.$/, ''))}.”</p>
        <table class="bb-prof">${prof.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</table>
      </div>
    </div>

    ${colors.length ? `<div class="bb-colors">${colors.map((x) => `<div class="bb-sw">
      <i style="background:${x.hex}"></i><span><b>${roleName[x.k]}</b>${esc(x.hex.toUpperCase())}${x.name ? `<small>${esc(x.name)}</small>` : ''}</span></div>`).join('')}</div>` : ''}

    <div class="bb-box lock">
      <h2>🔒 반드시 유지할 특징</h2>
      ${locked.length || state.locks.length
        ? `<ul class="two-col">${locked.map(lockItem).join('')}${state.locks.map((l) => `<li><b>디테일</b>${esc(l)}</li>`).join('')}</ul>`
        : '<p class="muted">STEP 09에서 고정 특징을 정해 주세요.</p>'}
    </div>
    ${flexible.length ? `<div class="bb-box flex"><h2>🔓 상황에 따라 바뀌어도 되는 것</h2><ul class="two-col">${flexible.map(lockItem).join('')}</ul></div>` : ''}

    <footer class="bb-foot">COLOR.M AI CHARACTER DESIGN MAKER · colorm.net</footer>
  </section>

  <section class="bible-sheet">
    <header class="bb-head">
      <img src="assets/logo.png" alt="COLOR.M">
      <div><span>DESIGN BRIEF — ${esc(name)}</span><small>디자인 의도 · 사용 가이드</small></div>
    </header>

    ${c.message ? `<div class="bb-msg"><small>MESSAGE</small>“${esc(c.message)}”</div>` : ''}

    ${ko.rationale.length ? `<div class="bb-box why"><h2>💡 디자인 의도</h2><dl>${ko.rationale.map((x) => `<div><dt>${esc(x.t)}</dt><dd>${esc(x.d)}</dd></div>`).join('')}</dl></div>` : ''}

    <div class="bb-grid">
      <div class="bb-box do"><h2>✅ Do</h2><ul>${dos.map((d) => `<li>${esc(d)}</li>`).join('')}</ul></div>
      <div class="bb-box dont"><h2>⛔ Don't</h2><ul>${donts.map((d) => `<li>${esc(d)}</li>`).join('')}</ul></div>
    </div>

    ${(c.expr.length || c.action.length || apps.length) ? `<div class="bb-tags">
      ${c.expr.length ? `<div><b>대표 표정</b>${c.expr.map((x) => `<span>${esc(x)}</span>`).join('')}</div>` : ''}
      ${c.action.length ? `<div><b>대표 동작</b>${c.action.map((x) => `<span>${esc(x)}</span>`).join('')}</div>` : ''}
      ${apps.length ? `<div><b>활용 분야</b>${apps.map((a) => `<span>${a.icon} ${esc(a.title)}</span>`).join('')}</div>` : ''}
    </div>` : ''}

    <footer class="bb-foot">COLOR.M AI CHARACTER DESIGN MAKER · colorm.net</footer>
  </section>

  <section class="bible-sheet bb-page2">
    <header class="bb-head">
      <img src="assets/logo.png" alt="COLOR.M">
      <div><span>PROMPTS — ${esc(nameEn || name)}</span><small>${esc(toolOf(state.tool).name)} 형식</small></div>
    </header>
    <div class="bb-prompt"><h2>CHARACTER ID 🔒</h2><pre>${esc(en.identity)}</pre></div>
    <div class="bb-prompt"><h2>MASTER PROMPT</h2><pre>${esc(enF.master)}</pre></div>
    <div class="bb-prompt"><h2>TURNAROUND PROMPT</h2><pre>${esc(enF.sheets[0].text)}</pre></div>
    <p class="bb-note">마스터 이미지를 만든 뒤, 새 장면·굿즈를 만들 때마다 마스터 이미지를 기준(참조) 이미지로 함께 넣으세요. 활용 프롬프트 전체는 COLOR.M AI Character Design Maker 결과 페이지에서 복사할 수 있어요.</p>
    <footer class="bb-foot">COLOR.M AI CHARACTER DESIGN MAKER · colorm.net</footer>
  </section>`;
}

function openBible() {
  let el = document.getElementById('bible');
  if (!el) {
    el = document.createElement('div');
    el.id = 'bible';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', '캐릭터 바이블');
    document.body.appendChild(el);
  }
  el.innerHTML = bibleHTML();
  document.body.classList.add('bible-open');
  el.scrollTop = 0;
}
function closeBible() {
  const el = document.getElementById('bible');
  if (el) el.remove();
  document.body.classList.remove('bible-open');
}
function printBible() {
  const prev = document.title;
  document.title = `${fileBase()}_character_bible`; // PDF 기본 파일 이름
  window.print();
  document.title = prev;
}
