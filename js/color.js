/* COLOR.M CHARACTER DESIGN MAKER — 컬러 디자인
 * 1) 인상 키워드 → 추천 컬러 계열 (색채 심리)
 * 2) 메인 컬러 → 배색 방식별 서브·포인트 컬러 (HSL 계산)
 */
function hexToHsl(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255; const g = ((n >> 8) & 255) / 255; const b = (n & 255) / 255;
  const max = Math.max(r, g, b); const min = Math.min(r, g, b);
  let h = 0; let s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}
function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360; s = Math.max(0, Math.min(100, s)) / 100; l = Math.max(0, Math.min(100, l)) / 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return '#' + [f(0), f(8), f(4)].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
}

/* 색 이름 (영문, 프롬프트용) */
const FAMILY_EN = { '빨강': 'Red', '주황': 'Orange', '노랑': 'Yellow', '초록': 'Green', '하늘': 'Sky Blue', '파랑': 'Blue', '남색': 'Navy', '보라': 'Purple', '분홍': 'Pink', '갈색': 'Brown', '무채색': 'Gray' };
function familyOf(hex) {
  const { h, s, l } = hexToHsl(hex);
  if (s < 12) return '무채색';
  if (l < 45 && h >= 15 && h < 50 && s < 70) return '갈색';
  if (h < 12 || h >= 345) return l > 70 ? '분홍' : '빨강';
  if (h < 40) return '주황';
  if (h < 65) return '노랑';
  if (h < 165) return '초록';
  if (h < 205) return '하늘';
  if (h < 235) return l < 35 ? '남색' : '파랑';
  if (h < 255) return l < 40 ? '남색' : '보라';
  if (h < 300) return '보라';
  return '분홍';
}
function colorName(hex) {
  const { l } = hexToHsl(hex);
  const base = FAMILY_EN[familyOf(hex)];
  if (l > 80) return `Light ${base}`;
  if (l < 30) return `Deep ${base}`;
  return base;
}

/** 인상 키워드 → 추천 컬러 계열 (많이 겹치는 순) */
function adviseFamilies() {
  const score = {};
  const why = {};
  sel('impression').forEach((v) => {
    const imp = IMPRESSIONS.find((x) => x.v === v);
    if (!imp) return;
    imp.x.colors.forEach((f, i) => {
      score[f] = (score[f] || 0) + (3 - i);
      (why[f] = why[f] || []).push(v);
    });
  });
  return Object.keys(score).sort((a, b) => score[b] - score[a]).slice(0, 4).map((f) => ({ family: f, ...COLOR_FAMILIES[f], from: why[f] }));
}

/** 메인 컬러 → 배색 방식별 { sub, point } */
function harmonyPalette(mainHex, key) {
  const { h, s, l } = hexToHsl(mainHex);
  const ss = Math.max(s, 45);
  switch (key) {
    case 'mono': return { sub: hslToHex(h, ss * 0.5, 90), point: hslToHex(h, ss, Math.max(25, l - 25)) };
    case 'analog': return { sub: hslToHex(h + 30, ss * 0.6, 88), point: hslToHex(h - 35, ss, 55) };
    case 'comp': return { sub: hslToHex(h, ss * 0.35, 93), point: hslToHex(h + 180, Math.max(ss, 65), 55) };
    case 'triad': return { sub: hslToHex(h + 120, ss * 0.55, 87), point: hslToHex(h + 240, Math.max(ss, 65), 57) };
    default: return { sub: mainHex, point: mainHex };
  }
}
