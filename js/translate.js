/* COLOR.M CHARACTER MAKER — 직접 입력 한국어 → 영어 변환
 * 1) 사용자가 확인·수정한 번역(state.tr)을 가장 먼저 사용
 * 2) 없으면 캐릭터 디자인 전용 사전으로 자동 변환 (구 → 단어 순, 긴 것부터)
 * 사전에 없는 부분은 한국어로 남으며, 결과 페이지의 '번역 확인'에서 고칠 수 있다.
 */
const HANGUL = /[가-힣]/;

const TR_DICT = [
  /* --- 자주 쓰는 구 --- */
  ['살짝 접혀 있음', 'slightly folded'], ['살짝 접힌', 'slightly folded'], ['살짝 접힘', 'slightly folded'], ['접혀 있음', 'folded'], ['접힌', 'folded'], ['접힘', 'folded'],
  ['꼬리 끝', 'tail tip'], ['귀 끝', 'ear tips'], ['발끝', 'paw tips'], ['손끝', 'fingertips'],
  ['이마에', 'on the forehead'], ['볼에', 'on the cheeks'], ['배에', 'on the belly'], ['등에', 'on the back'], ['목에', 'around the neck'], ['머리에', 'on the head'],
  ['한쪽 눈', 'one eye'], ['양쪽 귀', 'both ears'], ['왼쪽 귀', 'left ear'], ['오른쪽 귀', 'right ear'], ['왼쪽 눈', 'left eye'], ['오른쪽 눈', 'right eye'],
  ['왼쪽', 'left'], ['오른쪽', 'right'], ['양쪽', 'both sides'], ['가운데', 'center'],
  ['별 모양', 'star-shaped'], ['하트 모양', 'heart-shaped'], ['달 모양', 'moon-shaped'], ['꽃 모양', 'flower-shaped'], ['도토리 모양', 'acorn-shaped'], ['물방울 모양', 'droplet-shaped'], ['번개 모양', 'lightning-shaped'], ['구름 모양', 'cloud-shaped'],
  ['모양의', '-shaped'], ['모양', 'shape'],
  ['호기심이 많고', 'curious and'], ['호기심 많은', 'curious'], ['호기심이 많은', 'curious'],
  ['잘 웃는', 'smiles a lot'], ['눈물이 많은', 'easily moved to tears'], ['정이 많은', 'affectionate'], ['책임감 있는', 'responsible'], ['배려심 많은', 'considerate'],
  ['편지가 든', 'filled with letters'], ['편지를 든', 'holding a letter'], ['물감 묻은', 'paint-stained'], ['정지 표지판 모양', 'stop-sign-shaped'],
  ['단추 달린', 'buttoned'], ['주머니 많은', 'multi-pocket'], ['챙 있는', 'brimmed'], ['귀가 나오는', 'with ear holes'], ['끈 달린', 'strapped'],
  ['2.5등신', '2.5-head-tall proportions'], ['3등신', '3-head-tall proportions'], ['2등신', '2-head-tall proportions'], ['머리가 몸보다 큼', 'head larger than the body'],

  ['횡단보도에서는', 'at the crosswalk'], ['횡단보도', 'crosswalk'], ['신호등', 'traffic light'], ['정지 표지판', 'stop sign'], ['표지판', 'sign'], ['깃발', 'flag'],
  ['안전모', 'safety helmet'], ['안전 조끼', 'safety vest'], ['안전 지킴이', 'safety guardian'], ['지킴이', 'guardian'], ['안전', 'safety'], ['교통', 'traffic'],
  ['반사띠가 있는', 'reflective-striped'], ['손을 들고 건너요', 'raise your hand and cross'], ['손을 들고', 'raising a hand'], ['건너요', 'cross'], ['건너는', 'crossing'],
  ['손을 씻어요', 'wash your hands'], ['손 씻기', 'hand washing'], ['분리수거', 'recycling'], ['양치', 'brushing teeth'], ['꼭', ''],
  ['고개를 갸웃한다', 'tilts its head curiously'], ['깡충 뛰어', 'hops'], ['뛰어넘는다', 'jumps over'], ['넘는다', 'jumps over'], ['손을 흔들고', 'waves'], ['손을 흔든다', 'waves'], ['웃는다', 'smiles'],
  ['카메라를 보며', 'looking at the camera'], ['카메라를 바라보며', 'looking at the camera'], ['고개를 끄덕인다', 'nods'], ['박수를 친다', 'claps'], ['빙글빙글 돈다', 'spins around'], ['걸어간다', 'walks'], ['달려간다', 'runs'], ['앉는다', 'sits down'],
  ['웅덩이', 'puddle'], ['물웅덩이', 'puddle'], ['무지개', 'rainbow'], ['골목', 'alley'], ['아침 햇살', 'morning sunlight'], ['햇살', 'sunlight'], ['비 온 뒤', 'after the rain'], ['나뭇잎', 'leaves'], ['흔들리고', 'sway and'], ['흔들린다', 'sway'], ['파문이 퍼진다', 'ripples spread'], ['파문', 'ripples'],
  ['안녕', 'Hi'], ['오늘도', 'today too'],
  ['양갈래 머리', 'pigtails'], ['양갈래', 'pigtails'], ['단발머리', 'bob haircut'], ['포니테일', 'ponytail'], ['곱슬머리', 'curly hair'], ['그림이 있는', 'printed'], ['그림', 'print'],

  /* --- 색 --- */
  ['연보라색', 'light purple'], ['연분홍색', 'light pink'], ['연두색', 'yellow-green'], ['하늘색', 'sky blue'], ['남색', 'navy'], ['청록색', 'teal'],
  ['분홍색', 'pink'], ['노란색', 'yellow'], ['초록색', 'green'], ['빨간색', 'red'], ['주황색', 'orange'], ['갈색', 'brown'], ['베이지색', 'beige'],
  ['하얀색', 'white'], ['흰색', 'white'], ['파란색', 'blue'], ['보라색', 'purple'], ['검은색', 'black'], ['검정색', 'black'], ['회색', 'gray'], ['금색', 'gold'], ['은색', 'silver'], ['민트색', 'mint'], ['크림색', 'cream'], ['아이보리', 'ivory'],
  ['빨간', 'red'], ['파란', 'blue'], ['노란', 'yellow'], ['하얀', 'white'], ['까만', 'black'], ['검은', 'black'], ['초록', 'green'], ['분홍', 'pink'], ['보라', 'purple'], ['주황', 'orange'], ['갈색의', 'brown'],
  ['연한', 'light'], ['진한', 'dark'], ['밝은', 'bright'], ['어두운', 'dark'], ['투명한', 'transparent'], ['반짝이는', 'sparkly'], ['알록달록한', 'colorful'], ['무지개색', 'rainbow-colored'],

  /* --- 신체 --- */
  ['머리카락', 'hair'], ['앞머리', 'bangs'], ['눈썹', 'eyebrows'], ['눈동자', 'pupils'], ['속눈썹', 'eyelashes'], ['얼굴', 'face'], ['이마', 'forehead'],
  ['볼', 'cheeks'], ['코', 'nose'], ['입', 'mouth'], ['이빨', 'teeth'], ['송곳니', 'fang'], ['귀', 'ears'], ['꼬리', 'tail'], ['날개', 'wings'], ['뿔', 'horns'], ['더듬이', 'antennae'],
  ['몸통', 'torso'], ['배', 'belly'], ['등', 'back'], ['팔', 'arms'], ['다리', 'legs'], ['손', 'hands'], ['발', 'feet'], ['발바닥', 'paw pads'], ['털', 'fur'], ['수염', 'whiskers'], ['부리', 'beak'], ['깃털', 'feathers'], ['비늘', 'scales'], ['점', 'dot'], ['주근깨', 'freckles'],
  ['눈', 'eyes'], ['머리', 'head'],

  /* --- 의상·소품 --- */
  ['후드티', 'hoodie'], ['티셔츠', 't-shirt'], ['셔츠', 'shirt'], ['니트', 'knit sweater'], ['스웨터', 'sweater'], ['카디건', 'cardigan'], ['조끼', 'vest'], ['재킷', 'jacket'], ['코트', 'coat'], ['망토', 'cape'], ['우비', 'raincoat'], ['가운', 'gown'], ['제복', 'uniform'], ['앞치마', 'apron'], ['한복', 'hanbok'],
  ['멜빵바지', 'overalls'], ['반바지', 'shorts'], ['청바지', 'jeans'], ['바지', 'pants'], ['치마', 'skirt'], ['원피스', 'dress'],
  ['장화', 'rain boots'], ['운동화', 'sneakers'], ['부츠', 'boots'], ['구두', 'shoes'], ['샌들', 'sandals'], ['신발', 'shoes'], ['양말', 'socks'],
  ['밀짚모자', 'straw hat'], ['비니', 'beanie'], ['베레모', 'beret'], ['헬멧', 'helmet'], ['왕관', 'crown'], ['머리띠', 'headband'], ['머리핀', 'hairpin'], ['모자', 'hat'],
  ['목도리', 'scarf'], ['스카프', 'scarf'], ['넥타이', 'tie'], ['나비넥타이', 'bow tie'], ['리본', 'ribbon'], ['목걸이', 'necklace'], ['팔찌', 'bracelet'], ['반지', 'ring'], ['귀걸이', 'earrings'], ['안경', 'glasses'], ['선글라스', 'sunglasses'], ['이름표', 'name tag'], ['배지', 'badge'], ['장갑', 'gloves'], ['청진기', 'stethoscope'],
  ['어깨 가방', 'shoulder bag'], ['크로스백', 'crossbody bag'], ['손가방', 'handbag'], ['책가방', 'school backpack'], ['배낭', 'backpack'], ['가방', 'bag'], ['우산', 'umbrella'], ['지팡이', 'wand'], ['국자', 'ladle'], ['돋보기', 'magnifying glass'], ['물뿌리개', 'watering can'], ['붓', 'paintbrush'], ['방패', 'shield'], ['칼', 'sword'], ['책', 'book'], ['편지', 'letter'], ['꽃', 'flower'], ['풍선', 'balloon'], ['별가루', 'stardust'], ['도토리', 'acorn'], ['안테나', 'antenna'], ['표시등', 'indicator light'],

  /* --- 무늬·재질·형태 --- */
  ['줄무늬', 'stripes'], ['체크무늬', 'checkered pattern'], ['물방울무늬', 'polka dots'], ['꽃무늬', 'floral pattern'], ['점박이', 'spotted'], ['얼룩', 'patches'], ['무늬', 'pattern'],
  ['나무', 'wooden'], ['털실', 'yarn'], ['가죽', 'leather'], ['금속', 'metal'], ['유리', 'glass'], ['종이', 'paper'],
  ['동그란', 'round'], ['둥근', 'round'], ['네모난', 'square'], ['세모난', 'triangular'], ['뾰족한', 'pointy'], ['길쭉한', 'long'], ['통통한', 'chubby'], ['보송보송한', 'fluffy'], ['복슬복슬한', 'shaggy'], ['매끈한', 'smooth'], ['곱슬', 'curly'],
  ['커다란', 'big'], ['큰', 'big'], ['작은', 'small'], ['조그만', 'tiny'], ['긴', 'long'], ['짧은', 'short'], ['두꺼운', 'thick'], ['얇은', 'thin'], ['짝짝이', 'mismatched'],

  /* --- 성격·감정 --- */
  ['소심한', 'timid'], ['용감한', 'brave'], ['다정한', 'kind'], ['씩씩한', 'spirited'], ['활발한', 'energetic'], ['조용한', 'quiet'], ['수줍은', 'shy'], ['엉뚱한', 'quirky'], ['똑똑한', 'smart'], ['느긋한', 'laid-back'], ['부지런한', 'diligent'], ['고집 센', 'stubborn'], ['겁 많은', 'timid'], ['상냥한', 'gentle'],
  ['따뜻한', 'warm'], ['귀여운', 'cute'], ['사랑스러운', 'lovely'], ['신비로운', 'mysterious'], ['장난스러운', 'playful'], ['설레는', 'excited'], ['억울한', 'feeling wronged'], ['행복한', 'happy'], ['슬픈', 'sad'], ['놀란', 'surprised'],

  /* --- 동물·사물·직업 --- */
  ['북극여우', 'arctic fox'], ['시바견', 'shiba inu'], ['너구리', 'raccoon'], ['다람쥐', 'squirrel'], ['고슴도치', 'hedgehog'], ['수달', 'otter'], ['판다', 'panda'], ['코알라', 'koala'], ['오리', 'duck'], ['병아리', 'chick'], ['공룡', 'dinosaur'], ['고래', 'whale'], ['문어', 'octopus'], ['개구리', 'frog'], ['부엉이', 'owl'], ['사슴', 'deer'], ['양', 'sheep'],
  ['구름', 'cloud'], ['별', 'star'], ['달', 'moon'], ['해', 'sun'], ['물방울', 'water drop'],
  ['우체부', 'mail carrier'], ['요리사', 'chef'], ['탐험가', 'explorer'], ['마법사', 'wizard'], ['소방관', 'firefighter'], ['의사', 'doctor'], ['선생님', 'teacher'], ['화가', 'painter'], ['농부', 'farmer'], ['기사', 'knight'], ['꼬마', 'little'], ['숲속', 'forest'], ['숲', 'forest'], ['바다', 'sea'], ['마을', 'village'], ['우체국', 'post office'],
  ['특별한', 'distinctive'], ['특징', 'feature'],
].sort((a, b) => b[0].length - a[0].length);

/* 조사·어미 정리 */
function trCleanup(s) {
  return s
    .replace(/([a-zA-Z)])\s?(은|는|이|가|을|를|의|도|만|에|에서|에게|처럼|와|과|로|으로|이고|이며|이다|임|함|색)(?=[\s,./]|$)/g, '$1')
    .replace(/\s+/g, ' ')
    .replace(/\s([,.!?])/g, '$1')
    .trim();
}

/* 1~2글자 단어는 다른 단어의 일부를 바꾸지 않도록 낱말 단위로만 매칭 (예: '양'이 '양갈래'를 바꾸지 않게) */
const TR_RULES = TR_DICT.map(([ko, en]) => {
  if (ko.length > 2) return { ko, en };
  const esc = ko.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return { ko, en, re: new RegExp(`(?<![가-힣])${esc}(?=(은|는|이|가|을|를|의|도|에|과|와|로|만)?(?![가-힣]))`, 'g') };
});

/** 사전 기반 자동 변환 → { en, complete } */
function autoTr(text) {
  let s = text;
  TR_RULES.forEach((r) => {
    if (!s.includes(r.ko)) return;
    s = r.re ? s.replace(r.re, ` ${r.en} `) : s.split(r.ko).join(` ${r.en} `);
  });
  s = trCleanup(s);
  return { en: s, complete: !HANGUL.test(s) };
}

/** 한글 이름 로마자 표기 (국어의 로마자 표기법 기본 규칙, 예: 모리 → Mori, 구리 → Guri) */
const RR_CHO = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'];
const RR_JUNG = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'];
const RR_JONG = ['', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'k', 'm', 'l', 'l', 'l', 'p', 'l', 'm', 'p', 'p', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 't'];
function romanize(text) {
  if (!text || !HANGUL.test(text)) return text;
  return text.replace(/[가-힣]+/g, (word) => {
    let out = '';
    [...word].forEach((ch, i) => {
      const n = ch.charCodeAt(0) - 0xac00;
      const cho = Math.floor(n / 588);
      const jung = Math.floor((n % 588) / 28);
      const jong = n % 28;
      let c = RR_CHO[cho];
      if (cho === 5 && i === 0) c = 'r'; // ㄹ 첫소리
      out += c + RR_JUNG[jung] + RR_JONG[jong];
    });
    return out.charAt(0).toUpperCase() + out.slice(1);
  });
}

/** 확정 번역: 사용자가 고친 값 → 자동 변환 */
function trOf(text) {
  if (!text || !HANGUL.test(text)) return text;
  const t = state.tr && state.tr[text];
  return t && t.trim() ? t.trim() : autoOf(text).en;
}
/** 자동 변환: 캐릭터·브랜드 이름은 로마자 표기, 나머지는 사전 변환 */
function autoOf(text) {
  if (text === txt('name') || text === txt('brand_name')) return { en: romanize(text), complete: true };
  return autoTr(text);
}

/** 번역 대상: 사용자가 직접 입력한 한국어 문구 목록 */
function koInputs() {
  const out = [];
  const add = (s) => { s = (s || '').trim(); if (s && HANGUL.test(s) && !out.includes(s)) out.push(s); };
  Object.keys(state.v).forEach((id) => {
    const v = state.v[id];
    if (typeof v === 'string') add(v); else if (v && v.customOn) add(v.custom);
  });
  state.locks.forEach(add);
  add(state.idOverride);
  ['main', 'sub', 'point'].forEach((k) => add(state.colors[k].name));
  return out.sort((a, b) => b.length - a.length);
}

/** 영어 프롬프트 안에 남은 직접 입력 한국어를 번역으로 교체 (이름은 로마자로) */
function enFix(str) {
  if (!str || !HANGUL.test(str)) return str;
  let s = str;
  koInputs().forEach((ko) => { if (s.includes(ko)) s = s.split(ko).join(trOf(ko)); });
  return s;
}
