/* COLOR.M CHARACTER MAKER — 데이터 정의
 * 옵션 형식: o(한국어, English, 부가값)
 */
const o = (ko, en, x) => ({ v: ko, ko, en, x });

/* ---------- STEP 01. 사용 목적 ---------- */
const PURPOSES = [
  { ...o('그림책', "children's picture book"), app: 'picturebook', icon: '📖' },
  { ...o('브랜드·마스코트', 'brand mascot'), app: 'brand', icon: '🏢' },
  { ...o('굿즈·상품', 'merchandise'), app: 'goods', icon: '🧸' },
  { ...o('이모티콘', 'emoticon / sticker'), app: 'emoticon', icon: '😊' },
  { ...o('교육 콘텐츠', 'educational content'), app: 'edu', icon: '✏️' },
  { ...o('SNS 콘텐츠', 'social media content'), app: 'sns', icon: '📱' },
  { ...o('영상·애니메이션', 'video & animation'), app: 'video', icon: '🎬' },
  { ...o('게임·콘텐츠', 'game content'), app: 'game', icon: '🎮' },
];

/* 목적별 프롬프트 튜닝 문장 */
const PURPOSE_TUNING = {
  picturebook: {
    ko: '그림책 캐릭터, 따뜻하고 친근한 인상, 아이들이 읽기 쉬운 단순한 형태, 동화책 같은 분위기',
    en: "children's picture book character, warm and friendly, simple readable shapes, storybook atmosphere",
  },
  brand: {
    ko: '브랜드 마스코트, 단순하고 기억에 남는 실루엣, 작은 크기에서도 알아보기 쉬움, 친근하고 신뢰감 있는 인상',
    en: 'brand mascot, simple memorable silhouette, recognizable at small sizes, friendly and trustworthy',
  },
  goods: {
    ko: '굿즈 제작용 디자인, 깔끔한 외곽선, 단순한 형태, 선명한 면 컬러, 인형·아크릴·스티커로 제작하기 쉬운 형태',
    en: 'merchandise-ready design, clean outlines, simple shapes, bold flat colors, easy to produce as plush, acrylic or sticker',
  },
  emoticon: {
    ko: '이모티콘 캐릭터, 큰 머리와 작은 몸, 과장되고 명확한 표정, 굵고 깔끔한 외곽선, 작은 크기에서도 잘 읽힘',
    en: 'emoticon sticker character, big head and small body, exaggerated readable expressions, thick clean outline, legible at small size',
  },
  edu: {
    ko: '교육 콘텐츠 캐릭터, 친근하고 다가가기 쉬운 인상, 명확하고 단순한 형태, 연령에 맞는 표현',
    en: 'educational content character, friendly and approachable, clear simple shapes, age-appropriate',
  },
  sns: {
    ko: 'SNS 콘텐츠 캐릭터, 시선을 끄는 디자인, 트렌디하고 표정이 풍부함',
    en: 'social media character, eye-catching, trendy and expressive',
  },
  video: {
    ko: '애니메이션 제작용 캐릭터 디자인, 명확한 관절과 실루엣, 움직임에도 일관된 비율',
    en: 'animation-ready character design, clear joints and silhouette, proportions consistent in motion',
  },
  game: {
    ko: '게임 캐릭터 디자인, 독특한 실루엣, 게임 화면 크기에서도 잘 보이는 형태',
    en: 'game character design, distinctive silhouette, readable at gameplay scale',
  },
};

/* ---------- STEP 02. 기본 설정 ---------- */
const TYPES = [
  o('사람', 'human'), o('동물', 'animal'), o('식물', 'plant'), o('음식', 'food'),
  o('사물', 'object'), o('로봇', 'robot'), o('몬스터', 'monster'), o('판타지 생명체', 'fantasy creature'),
];
/* 의인화가 필요한 종류 */
const ANTHRO_TYPES = ['식물', '음식', '사물'];

const SUBTYPES = {
  '사람': [o('여자아이', 'girl'), o('남자아이', 'boy'), o('청년', 'young person'), o('어른', 'adult'), o('할머니', 'grandmother'), o('할아버지', 'grandfather'), o('아기', 'baby')],
  '동물': [o('호랑이', 'tiger'), o('고양이', 'cat'), o('강아지', 'puppy'), o('토끼', 'rabbit'), o('곰', 'bear'), o('여우', 'fox'), o('새', 'bird'), o('펭귄', 'penguin'), o('햄스터', 'hamster')],
  '식물': [o('꽃', 'flower'), o('새싹', 'sprout'), o('나무', 'tree'), o('선인장', 'cactus'), o('버섯', 'mushroom'), o('나뭇잎', 'leaf')],
  '음식': [o('빵', 'bread'), o('떡', 'rice cake'), o('과일', 'fruit'), o('채소', 'vegetable'), o('디저트', 'dessert'), o('주먹밥', 'rice ball')],
  '사물': [o('컵', 'cup'), o('연필', 'pencil'), o('책', 'book'), o('우산', 'umbrella'), o('시계', 'clock'), o('가방', 'bag')],
  '로봇': [o('소형 로봇', 'small robot'), o('휴머노이드', 'humanoid robot'), o('동물형 로봇', 'animal-shaped robot'), o('가전형 로봇', 'home-appliance robot')],
  '몬스터': [o('귀여운 몬스터', 'cute monster'), o('슬라임', 'slime'), o('털복숭이 몬스터', 'furry monster'), o('외눈 몬스터', 'one-eyed monster')],
  '판타지 생명체': [o('요정', 'fairy'), o('드래곤', 'dragon'), o('유니콘', 'unicorn'), o('정령', 'spirit'), o('마법 생물', 'magical creature')],
};

const AGES = [o('아기', 'baby'), o('어린이', 'child'), o('청소년', 'teenage'), o('청년', 'young adult'), o('성인', 'adult'), o('노년', 'elderly'), o('나이 없음', 'ageless')];
const GENDERS = [o('남성', 'male'), o('여성', 'female'), o('성별 없음', 'genderless')];
const ROLES = [o('주인공', 'main character'), o('친구·조력자', 'friend and helper'), o('안내자', 'guide'), o('마스코트', 'mascot'), o('라이벌', 'rival'), o('악당', 'villain')];

/* x = 연결형(한 줄 정의에 사용) */
const PERSONALITIES = [
  o('밝은', 'cheerful', '밝고'), o('활발한', 'lively', '활발하고'), o('귀여운', 'cute', '귀엽고'),
  o('장난꾸러기', 'mischievous', '장난스럽고'), o('용감한', 'brave', '용감하고'), o('수줍은', 'shy', '수줍고'),
  o('차분한', 'calm', '차분하고'), o('신비로운', 'mysterious', '신비롭고'), o('엉뚱한', 'quirky', '엉뚱하고'),
  o('따뜻한', 'warm-hearted', '따뜻하고'), o('호기심 많은', 'curious', '호기심 많고'),
];

/* ---------- STEP 03. 외형 ---------- */
/* x = 한 줄 정의용 크기 형용사 [ko, en] */
const BODIES = [
  o('작고 귀여운', 'small and cute', ['작은', 'small']),
  o('둥글둥글한', 'round and soft', ['둥글둥글한', 'round']), o('통통한', 'plump', ['통통한', 'plump']),
  o('날씬한', 'slim', ['날씬한', 'slim']),
];

const FACE_PARTS = [
  { id: 'face_shape', label: '얼굴형', en: 'face shape', options: [o('둥근', 'round'), o('계란형', 'oval'), o('통통한 볼', 'chubby-cheeked'), o('각진', 'square'), o('하트형', 'heart-shaped')] },
  { id: 'face_eyes', label: '눈', en: 'eyes', options: [o('크고 동그란', 'big and round'), o('반짝이는', 'sparkling'), o('점눈', 'simple dots'), o('졸린 듯한', 'sleepy'), o('초승달 눈웃음', 'crescent smiling')] },
  { id: 'face_nose', label: '코', en: 'nose', options: [o('작은 점', 'tiny dot'), o('동그란', 'round'), o('하트 모양', 'heart-shaped'), o('생략', 'none')] },
  { id: 'face_mouth', label: '입', en: 'mouth', options: [o('작은 미소', 'small smile'), o('활짝 웃는', 'wide open smile'), o('ω 모양', 'cat-like ω shape'), o('작은 송곳니', 'small fang')] },
  { id: 'face_ears', label: '귀', en: 'ears', options: [o('큰', 'big'), o('뾰족한', 'pointy'), o('둥근', 'round'), o('처진', 'floppy')] },
  { id: 'face_hair', label: '헤어', en: 'hair', options: [o('짧은 머리', 'short'), o('긴 생머리', 'long straight'), o('곱슬머리', 'curly'), o('양갈래', 'pigtails'), o('삐죽 한 가닥', 'single sticking-up strand')] },
  { id: 'face_fur', label: '털', en: 'fur', options: [o('보송보송한', 'fluffy'), o('매끈한', 'smooth'), o('복슬복슬한', 'shaggy'), o('털 없음', 'no fur')] },
  { id: 'face_pattern', label: '무늬', en: 'markings', options: [o('줄무늬', 'stripes'), o('점박이', 'spots'), o('얼룩', 'patches'), o('볼터치', 'blush marks'), o('별 무늬', 'star marks')] },
];

const OUTFIT_PARTS = [
  { id: 'out_top', label: '상의', en: 'top', ph: '예: 노란 후드티' },
  { id: 'out_bottom', label: '하의', en: 'bottom', ph: '예: 청 멜빵바지' },
  { id: 'out_dress', label: '원피스', en: 'dress', ph: '예: 꽃무늬 원피스' },
  { id: 'out_shoes', label: '신발', en: 'shoes', ph: '예: 빨간 장화' },
  { id: 'out_hat', label: '모자', en: 'hat', ph: '예: 도토리 모양 비니' },
  { id: 'out_acc', label: '액세서리', en: 'accessories', ph: '예: 별 모양 머리핀' },
  { id: 'out_prop', label: '소품', en: 'props', ph: '예: 작은 편지 가방' },
  { id: 'out_etc', label: '+ 직접입력', en: 'other outfit details', ph: '그 밖의 의상 설명' },
];

const SIGNATURES = [
  o('안경', 'glasses'), o('리본', 'ribbon'), o('목도리', 'scarf'), o('가방', 'bag'),
  o('특별한 귀', 'distinctive ears'), o('특별한 꼬리', 'distinctive tail'), o('특별한 무늬', 'distinctive markings'),
];

/* ---------- STEP 05. 컬러 & 스타일 ---------- */
const COLOR_MOODS = [
  o('파스텔', 'pastel'), o('비비드', 'vivid'), o('내추럴', 'natural'), o('웜', 'warm-toned'),
  o('쿨', 'cool-toned'), o('모던', 'modern'), o('고급스러운', 'luxurious'), o('환상적인', 'dreamy fantasy'),
];

const PALETTE_PRESETS = [
  { name: 'COLOR.M', c: [['#6257A8', 'Lavender Purple'], ['#F4D9E6', 'Soft Pink'], ['#FFC94D', 'Sunny Yellow']] },
  { name: '숲속', c: [['#D9824B', 'Fox Orange'], ['#F6EBD9', 'Cream'], ['#4F8A5B', 'Forest Green']] },
  { name: '바다', c: [['#4BA3D9', 'Sky Blue'], ['#E8F4FA', 'Foam White'], ['#FF7A6B', 'Coral']] },
  { name: '파스텔', c: [['#FFB8C9', 'Baby Pink'], ['#C9E7F2', 'Baby Blue'], ['#FFF1A8', 'Butter Yellow']] },
  { name: '모노', c: [['#2B2B2B', 'Charcoal'], ['#F2F2F2', 'Off White'], ['#E84A4A', 'Signal Red']] },
];

const STYLES = [
  o('귀여운 3D', 'cute 3D', 'r3d'), o('2D 일러스트', '2D illustration', 'illust'), o('그림책', 'picture book', 'book'),
  o('플랫 벡터', 'flat vector', 'flat'), o('카툰', 'cartoon', 'cartoon'), o('클레이', 'clay', 'clay'),
  o('색연필', 'colored pencil', 'pencil'), o('수채화', 'watercolor', 'water'), o('미니멀', 'minimal', 'minimal'),
];
/* 스타일 상세 묘사 */
const STYLE_DESC = {
  '귀여운 3D': { ko: '귀여운 3D 렌더링, 부드러운 음영, 장난감 같은 매끈한 재질, 은은한 조명', en: 'cute 3D render, soft shading, smooth toy-like materials, soft studio lighting' },
  '2D 일러스트': { ko: '2D 디지털 일러스트, 깔끔한 선, 부드러운 채색', en: '2D digital illustration, clean lines, soft cel shading' },
  '그림책': { ko: '그림책 일러스트, 종이 질감, 손으로 그린 듯한 따뜻한 느낌', en: "children's picture book illustration, paper texture, warm hand-drawn feel" },
  '플랫 벡터': { ko: '플랫 벡터 일러스트, 단순한 도형, 그라데이션 없는 면 컬러', en: 'flat vector illustration, simple geometric shapes, solid colors without gradients' },
  '카툰': { ko: '카툰 스타일, 굵은 외곽선, 선명한 색, 과장된 표현', en: 'cartoon style, bold outlines, bright saturated colors, exaggerated expression' },
  '클레이': { ko: '클레이(점토) 스타일, 손으로 빚은 질감, 부드러운 조명, 스톱모션 느낌', en: 'claymation style, handmade clay texture, soft lighting, stop-motion look' },
  '색연필': { ko: '색연필 일러스트, 연필 결이 보이는 질감, 부드러운 손그림 느낌', en: 'colored pencil illustration, visible pencil strokes and grain, soft hand-drawn feel' },
  '수채화': { ko: '수채화 일러스트, 번지는 물감, 맑고 투명한 색감, 종이 질감', en: 'watercolor illustration, soft bleeding pigments, transparent washes, paper texture' },
  '미니멀': { ko: '미니멀 스타일, 최소한의 선과 형태, 넓은 여백', en: 'minimal style, minimal lines and shapes, generous negative space' },
};

/* ---------- STEP 06. 이미지 구성 ---------- */
const FRAMINGS = [o('전신', 'full body'), o('반신', 'half body (waist up)'), o('얼굴 중심', 'close-up portrait')];
const VIEWS = [o('정면', 'front view'), o('45도', 'three-quarter (45°) view'), o('측면', 'side view'), o('후면', 'back view')];
const EXPRESSIONS = [o('기쁨', 'happy'), o('웃음', 'laughing'), o('슬픔', 'sad'), o('화남', 'angry'), o('놀람', 'surprised'), o('고민', 'thoughtful'), o('신남', 'excited')];
const ACTIONS = [o('서기', 'standing'), o('걷기', 'walking'), o('뛰기', 'running'), o('앉기', 'sitting'), o('손 흔들기', 'waving'), o('물건 들기', 'holding an object')];
const BACKGROUNDS = [
  o('흰색', 'plain white background'), o('단색', 'solid color background'), o('투명 배경용', 'isolated on a plain background, easy to cut out (transparent-ready)'),
  o('실내', 'indoor scene'), o('야외', 'outdoor scene'), o('판타지 배경', 'fantasy background'),
];

/* ---------- 02 TARGET ---------- */
const TARGET_AGES = [
  o('영유아 (0~3세)', 'toddlers aged 0-3'), o('유아 (4~7세)', 'preschool children aged 4-7'), o('초등 저학년', 'early elementary school children'),
  o('초등 고학년', 'upper elementary school children'), o('청소년', 'teenagers'), o('청년·대학생', 'young adults'),
  o('성인', 'adults'), o('시니어', 'seniors'), o('전 연령', 'all ages'),
];
const TARGET_GENDERS = [o('성별 무관', 'all genders'), o('여성', 'women'), o('남성', 'men')];
/* 타깃 연령별 특징 — 선택한 연령에 따라 선택지가 바뀜 */
const TRAIT_GROUPS = [
  {
    ages: ['영유아 (0~3세)', '유아 (4~7세)'],
    opts: [o('글을 아직 읽지 못함', 'cannot read yet'), o('짧은 집중 시간', 'short attention span'), o('크고 선명한 형태에 반응', 'responds to big, clear shapes and bright colors'),
      o('반복을 좋아함', 'loves repetition'), o('처음 겪는 일이 많음 (유치원 등)', 'facing many first experiences such as starting kindergarten')],
  },
  {
    ages: ['초등 저학년', '초등 고학년'],
    opts: [o('규칙·약속을 배우는 시기', 'learning rules and promises'), o('캐릭터 수집을 좋아함', 'loves collecting characters'),
      o('친구 관계가 중요함', 'friendships matter a lot'), o('게임·영상에 익숙함', 'familiar with games and videos')],
  },
  {
    ages: ['청소년', '청년·대학생'],
    opts: [o('유행에 민감함', 'sensitive to trends'), o('유치한 것은 싫어함', 'dislikes anything childish'),
      o('공감·개성을 중시함', 'values empathy and individuality'), o('SNS로 공유함', 'shares on social media')],
  },
  {
    ages: ['성인'],
    opts: [o('바쁜 일상', 'busy daily life'), o('공감·위로를 원함', 'seeks empathy and comfort'), o('실용성을 중시함', 'values practicality'), o('브랜드 신뢰를 중시함', 'values brand trust')],
  },
  {
    ages: ['시니어'],
    opts: [o('크고 명확한 형태가 필요함', 'needs large, clear shapes'), o('친숙한 소재를 선호함', 'prefers familiar subjects'), o('차분한 색을 선호함', 'prefers calm colors')],
  },
  {
    ages: ['전 연령'],
    opts: [o('누구나 쉽게 이해해야 함', 'must be easy for anyone to understand'), o('세대를 넘어 공감', 'appeals across generations')],
  },
];
/* 함께 고려할 사람 — 타깃이 직접 사거나 고르지 않을 때 */
const CO_TARGETS = [
  o('학부모', 'parents'), o('교사·교육기관', 'teachers and schools'), o('보호자·가족', 'caregivers and family'),
  o('선물하는 사람', 'gift buyers'), o('브랜드 담당자', 'brand managers'), o('없음 (타깃이 직접 선택)', 'none — the target audience chooses directly'),
];

/* ---------- 03 BRIEF ---------- */
/* 인상 키워드. x = 디자인 연결 { shape: 추천 실루엣, colors: 추천 컬러 계열, pers: 추천 성격, why: 근거 } */
const IMPRESSIONS = [
  o('친근한', 'friendly', { shape: '원형', colors: ['주황', '노랑'], pers: ['밝은', '따뜻한'], why: '둥근 형태와 따뜻한 색으로 경계심을 낮춤' }),
  o('신뢰감 있는', 'trustworthy', { shape: '사각형', colors: ['파랑', '초록'], pers: ['차분한', '용감한'], why: '안정적인 사각 실루엣과 파랑 계열로 믿음을 줌' }),
  o('안심되는', 'reassuring and safe', { shape: '원형', colors: ['초록', '하늘'], pers: ['따뜻한', '차분한'], why: '부드러운 곡선과 초록·하늘색으로 안정감을 줌' }),
  o('활기찬', 'energetic', { shape: '삼각형', colors: ['빨강', '주황', '노랑'], pers: ['활발한', '밝은'], why: '역동적인 삼각 실루엣과 난색으로 에너지를 전달함' }),
  o('귀여운', 'adorable', { shape: '원형', colors: ['분홍', '노랑'], pers: ['귀여운', '수줍은'], why: '큰 머리와 둥근 형태로 보호 본능을 자극함' }),
  o('전문적인', 'professional', { shape: '사각형', colors: ['남색', '파랑'], pers: ['차분한'], why: '절제된 형태와 남색 계열로 전문성을 보여줌' }),
  o('따뜻한', 'warm', { shape: '원형', colors: ['주황', '갈색'], pers: ['따뜻한'], why: '난색과 부드러운 곡선으로 따뜻함을 전함' }),
  o('재미있는', 'fun and playful', { shape: '혼합', colors: ['노랑', '보라'], pers: ['장난꾸러기', '엉뚱한'], why: '과장된 비율과 대비되는 색으로 재미를 줌' }),
  o('신비로운', 'mysterious', { shape: '삼각형', colors: ['보라', '남색'], pers: ['신비로운'], why: '길쭉한 형태와 보라·남색으로 신비감을 줌' }),
  o('세련된', 'sophisticated', { shape: '사각형', colors: ['무채색', '남색'], pers: ['차분한'], why: '단순한 형태와 절제된 색으로 세련된 인상을 줌' }),
  o('용감한', 'brave', { shape: '삼각형', colors: ['빨강', '파랑'], pers: ['용감한'], why: '각진 형태와 강한 원색으로 용기를 표현함' }),
  o('차분한', 'calm', { shape: '원형', colors: ['하늘', '초록'], pers: ['차분한'], why: '낮은 채도와 완만한 곡선으로 차분함을 줌' }),
];
const CONDITIONS = [
  o('단순한 형태 (따라 그리기 쉬움)', 'simple shapes that are easy to draw'), o('작은 크기에서도 식별', 'recognizable at small sizes'),
  o('흑백 인쇄에서도 구분', 'readable in black and white'), o('인형·자수 제작 가능', 'producible as plush or embroidery'),
  o('애니메이션 동작 고려', 'animation-friendly construction'), o('문화권·성별 중립', 'culturally and gender neutral'),
  o('브랜드 컬러 사용', 'uses the brand colors'),
];

/* 사용 목적별 디자인 브리프 — 질문 · 메시지 칸 · 목적별 항목(theme) · 디자인 조건이 목적에 맞게 바뀜 */
const BRIEF = {
  picturebook: {
    q: '이 캐릭터는 이야기 속에서 무엇을 전하나요?',
    msgLabel: '이야기의 주제 · 전하고 싶은 마음', msgEn: 'Story message', msgPh: '예: 서툴러도 괜찮아, 함께하면 용기가 생겨',
    themeLabel: '이야기 테마', themeEn: 'Story theme',
    themeDesc: '그림책 전체가 아니라, 그 이야기의 주인공이 될 캐릭터를 만들어요. 고른 테마는 디자인 기획서와 프롬프트에 반영돼요.',
    themes: [o('우정', 'friendship'), o('용기', 'courage'), o('성장', 'growing up'), o('가족', 'family'), o('모험', 'adventure'), o('자연·환경', 'nature and environment'), o('다름을 인정하기', 'accepting differences'), o('감정 이해', 'understanding emotions'), o('생활 습관', 'daily habits')],
    conds: [o('여러 장면에 반복 등장 (그리기 쉬운 형태)', 'appears in many scenes, so the design is easy to redraw'), o('다양한 표정·동작 표현', 'can express a wide range of emotions and actions'),
      o('배경 그림과 어울리는 색', 'colors that harmonize with illustrated backgrounds'), o('읽어 주는 어른도 공감', 'also appealing to the adults reading aloud'), o('다른 등장인물과 구분', 'clearly distinguishable from other characters')],
  },
  brand: {
    q: '이 마스코트는 브랜드의 무엇을 대신 말하나요?',
    msgLabel: '브랜드 메시지 · 슬로건', msgEn: 'Brand message', msgPh: '예: 매일을 다채롭게',
    themeLabel: '브랜드 핵심 가치', themeEn: 'Brand core values',
    themeDesc: '마스코트가 대신 보여 줄 브랜드의 가치예요. 디자인 기획서와 프롬프트에 반영돼요.',
    themes: [o('신뢰', 'trust'), o('혁신', 'innovation'), o('친근함', 'approachability'), o('건강', 'health'), o('즐거움', 'joy'), o('전문성', 'expertise'), o('지속가능성', 'sustainability'), o('프리미엄', 'premium quality')],
    conds: [o('아이콘 크기에서도 식별', 'recognizable even at icon size'), o('로고와 함께 배치', 'works next to the logo'), o('브랜드 컬러 사용', 'uses the brand colors'),
      o('1도(단색) 인쇄 가능', 'works in single-color print'), o('다양한 매체로 확장', 'extends across many media')],
  },
  goods: {
    q: '어떤 상품으로, 누구에게 팔릴 캐릭터인가요?',
    msgLabel: '상품 콘셉트', msgEn: 'Product concept', msgPh: '예: 가방에 달고 다니는 작은 행운 부적',
    themeLabel: '구매 포인트', themeEn: 'Selling points',
    themeDesc: '사람들이 이 상품을 사는 이유예요. 디자인 기획서와 프롬프트에 반영돼요.',
    themes: [o('귀여움·소장욕', 'cuteness and collectibility'), o('선물용', 'gift-worthy'), o('실용성', 'practical use'), o('한정판·수집', 'limited edition and collecting'), o('힐링', 'comfort and healing'), o('지역 특색', 'local identity')],
    conds: [o('인형·자수 제작 가능', 'producible as plush or embroidery'), o('아크릴·스티커 칼선 고려', 'clean outer contour for acrylic and sticker die-cutting'),
      o('3도 이하 인쇄', 'printable in three colors or fewer'), o('작은 크기에서도 식별', 'recognizable at small sizes'),
      o('단가를 고려한 단순한 형태', 'simple shapes to keep production cost low'), o('피규어 입체 제작', 'works as a 3D figure')],
  },
  emoticon: {
    q: '어떤 대화에서 쓰일 이모티콘인가요?',
    msgLabel: '이모티콘 콘셉트', msgEn: 'Emoticon concept', msgPh: '예: 말 대신 마음을 전하는 다정한 리액션',
    themeLabel: '주로 쓰일 대화', themeEn: 'Chat contexts',
    themeDesc: '어떤 대화에서 쓰일지 고르면 디자인 기획서와 프롬프트에 반영돼요.',
    themes: [o('친구·연인', 'friends and couples'), o('가족', 'family'), o('직장·업무', 'work'), o('학교', 'school'), o('응원·위로', 'cheering and comfort'), o('리액션·밈', 'reactions and memes')],
    conds: [o('작은 크기에서도 표정이 보임', 'expressions readable at small sizes'), o('굵고 깔끔한 외곽선', 'thick clean outline'), o('움직이는 이모티콘 고려', 'ready for animated stickers'),
      o('글자 없이도 의미 전달', 'meaning clear without text'), o('감정 표현 폭이 넓음', 'wide emotional range')],
  },
  edu: {
    q: '이 캐릭터는 무엇을 배우게 하나요?',
    msgLabel: '학습 목표 · 전달할 행동 규칙', msgEn: 'Learning goal', msgPh: '예: 횡단보도에서는 꼭 손을 들고 건너요',
    themeLabel: '교육 주제', themeEn: 'Education topic',
    themeDesc: '캐릭터가 함께할 교육 주제예요. 교육 자료용 이미지 프롬프트에도 반영돼요.',
    themes: [o('안전', 'safety'), o('생활 습관', 'daily habits'), o('건강·위생', 'health and hygiene'), o('환경', 'environment'), o('감정·관계', 'emotions and relationships'), o('한글·숫자', 'letters and numbers'), o('과학', 'science'), o('경제·진로', 'money and careers')],
    conds: [o('흑백 인쇄에서도 구분', 'readable in black and white'), o('단순한 형태 (따라 그리기 쉬움)', 'simple shapes that are easy to draw'),
      o('교재·화면 어디에나 배치', 'fits anywhere in worksheets and slides'), o('문화권·성별 중립', 'culturally and gender neutral'), o('손짓·동작으로 안내', 'guides with clear gestures')],
  },
  sns: {
    q: '어떤 콘텐츠로 팔로워와 소통하나요?',
    msgLabel: '계정 콘셉트', msgEn: 'Account concept', msgPh: '예: 직장인의 소소한 하루에 공감해 주는 친구',
    themeLabel: '콘텐츠 톤', themeEn: 'Content tone',
    themeDesc: '계정이 주로 올릴 콘텐츠의 분위기예요. 디자인 기획서와 프롬프트에 반영돼요.',
    themes: [o('공감·일상', 'relatable daily life'), o('정보·꿀팁', 'tips and information'), o('유머·밈', 'humor and memes'), o('힐링', 'healing'), o('브랜드 소식', 'brand news')],
    conds: [o('피드 썸네일에서 눈에 띔', 'stands out in feed thumbnails'), o('작은 크기에서도 식별', 'recognizable at small sizes'), o('시리즈로 확장 가능', 'works as a recurring series'), o('트렌드 반영', 'on-trend')],
  },
  video: {
    q: '영상 속에서 어떤 역할을 하나요?',
    msgLabel: '영상 콘셉트', msgEn: 'Video concept', msgPh: '예: 아이와 함께 노래하며 양치 습관을 알려 주는 친구',
    themeLabel: '등장할 영상 종류', themeEn: 'Will appear in',
    themeDesc: '이 캐릭터가 어떤 영상에 나올지 골라 주세요. 이 메이커는 영상 전체가 아니라 캐릭터와 5~10초 장면 클립 프롬프트를 만들어요.',
    themes: [o('숏폼 영상', 'short-form videos'), o('시리즈 애니메이션', 'an animated series'), o('교육 영상', 'educational videos'), o('광고·홍보 영상', 'advertising videos'), o('뮤직비디오·댄스 영상', 'music and dance videos')],
    conds: [o('애니메이션 동작 고려', 'animation-friendly construction'), o('측면·뒷모습 표현이 쉬움', 'easy to draw from the side and back'), o('립싱크 가능한 입', 'mouth suitable for lip-sync'), o('단순한 채색 (프레임 작업)', 'simple coloring for frame-by-frame work')],
  },
  game: {
    q: '게임 속에서 어떤 존재인가요?',
    msgLabel: '캐릭터 콘셉트', msgEn: 'Character concept', msgPh: '예: 잃어버린 별을 찾아 떠나는 꼬마 탐험가',
    themeLabel: '등장할 게임 장르', themeEn: 'Will appear in a game genre',
    themeDesc: '어떤 장르의 게임에 들어갈 캐릭터인지 골라 주세요. 이 메이커는 게임을 만들지 않고, 게임에 넣을 캐릭터 이미지 프롬프트를 만들어요.',
    themes: [o('캐주얼·퍼즐', 'casual puzzle'), o('RPG', 'RPG'), o('액션', 'action'), o('시뮬레이션·육성', 'simulation and raising'), o('교육용 게임', 'educational game')],
    conds: [o('작은 화면에서도 실루엣 식별', 'silhouette readable on small screens'), o('스프라이트 애니메이션 고려', 'ready for sprite animation'), o('장비·의상 교체 고려', 'designed for swappable gear and outfits'), o('다른 캐릭터와 구분되는 색', 'color-coded apart from other characters')],
  },
};
const BRIEF_DEFAULT = {
  q: '이 캐릭터는 무엇을 전달해야 하나요?',
  msgLabel: '전달할 메시지', msgEn: 'Message to convey', msgPh: '예: 누구에게나 다정한 우리 동네 친구',
  themeLabel: '', themeEn: '', themes: [], conds: CONDITIONS,
};
/** 현재 사용 목적의 브리프 설정 */
function briefCfg() {
  const p = PURPOSES.find((x) => x.v === sel('purpose')[0]);
  return (p && BRIEF[p.app]) || BRIEF_DEFAULT;
}

/* ---------- 04 CONCEPT ---------- */
const WORLDS = [
  o('일상 (집·학교·동네)', 'everyday life (home, school, neighborhood)'), o('자연 (숲·바다·정원)', 'nature (forest, sea, garden)'),
  o('판타지 왕국', 'fantasy kingdom'), o('우주·미래', 'space and the future'), o('도시·일터', 'city and workplace'), o('동화 속 마을', 'fairytale village'),
];

/* ---------- 05 FORM ---------- */
/* 실루엣 = 형태 언어. x = { icon, mean } */
const SILHOUETTES = [
  o('원형', 'round, circle-based silhouette', { icon: '●', mean: '친근함 · 안전 · 귀여움' }),
  o('사각형', 'sturdy, square-based silhouette', { icon: '■', mean: '신뢰 · 안정 · 듬직함' }),
  o('삼각형', 'dynamic, triangle-based silhouette', { icon: '▲', mean: '활동성 · 속도 · 긴장감' }),
  o('혼합', 'combined circle and square silhouette', { icon: '◐', mean: '친근함 + 신뢰 (가장 범용)' }),
];
const PROPORTIONS = [
  o('2등신', '2-head-tall chibi proportions'), o('3등신', '3-head-tall proportions'),
  o('4~5등신', '4 to 5-head-tall proportions'), o('실제 비율', 'realistic proportions'),
];
const HANDS = [
  o('동그란 손 (손가락 생략)', 'round mitten-like hands without fingers'), o('네 손가락', 'four-fingered cartoon hands'),
  o('다섯 손가락', 'five-fingered hands'), o('동물 앞발', 'animal paws'), o('날개', 'wings as arms'), o('손 없음', 'no hands'),
];
const FEET = [
  o('동그란 발', 'round stubby feet'), o('신발 신은 발', 'feet wearing shoes'), o('동물 발바닥', 'animal paws with paw pads'),
  o('발 없음 (떠 있음)', 'no feet, floating'), o('바퀴', 'wheels instead of feet'),
];

/* ---------- 07 COLOR — 배색 방식 ---------- */
const HARMONIES = [
  { key: 'mono', ko: '톤온톤', desc: '같은 색의 밝기 차이 — 통일감' },
  { key: 'analog', ko: '유사색', desc: '이웃한 색 — 자연스럽고 편안함' },
  { key: 'comp', ko: '보색 대비', desc: '반대 색 — 눈에 잘 띔' },
  { key: 'triad', ko: '3색 배색', desc: '120° 간격 — 활기차고 다채로움' },
];
/* 컬러 계열 → 대표 색 · 의미 (색채 심리) */
const COLOR_FAMILIES = {
  '빨강': { hex: '#E8473F', mean: '열정 · 용기 · 주의' },
  '주황': { hex: '#F28C38', mean: '활기 · 친근함 · 식욕' },
  '노랑': { hex: '#FFC93C', mean: '밝음 · 즐거움 · 주의 환기' },
  '초록': { hex: '#4CAF6E', mean: '안전 · 자연 · 성장' },
  '하늘': { hex: '#6EC3EB', mean: '청량 · 자유 · 차분함' },
  '파랑': { hex: '#3D7DD8', mean: '신뢰 · 안정 · 지성' },
  '남색': { hex: '#2E3F80', mean: '전문성 · 깊이 · 신중함' },
  '보라': { hex: '#8A63D2', mean: '창의 · 신비 · 상상력' },
  '분홍': { hex: '#F58FB1', mean: '다정함 · 사랑 · 귀여움' },
  '갈색': { hex: '#A0714F', mean: '따뜻함 · 자연 · 편안함' },
  '무채색': { hex: '#3A3A40', mean: '세련됨 · 절제 · 모던' },
};

/* ---------- 10 SHEET ---------- */
const SHEET_VIEWS = [o('정면', 'front view'), o('45도', 'three-quarter (45°) view'), o('측면', 'side view'), o('후면', 'back view')];

/* ---------- STEP 정의 ---------- */
const STEPS = [
  {
    key: 'purpose', no: '01', en: 'PURPOSE', title: '사용 목적', q: '왜 만드는 캐릭터인가요?',
    desc: '주 목적에 따라 이후 추천과 최종 프롬프트가 달라집니다. (확장 활용은 11단계에서 고를 수 있어요)',
    fields: [{ id: 'purpose', type: 'chips', options: PURPOSES, big: true, customPh: '예: 병원 안내 캐릭터, 지역 축제 캐릭터' }],
  },
  {
    key: 'target', no: '02', en: 'TARGET', title: '타깃', q: '누가 보고 좋아할 캐릭터인가요?',
    desc: '캐릭터의 나이가 아니라, 이 캐릭터를 보는 사람을 정해요.',
    fields: [
      { id: 'target_age', label: '① 타깃 연령', desc: '이 캐릭터를 보고 좋아할 사람은 몇 살인가요?', type: 'chips', multi: true, options: TARGET_AGES, customPh: '예: 5~6세, 40대 직장인' },
      { id: 'target_gender', label: '② 타깃 성별', type: 'chips', options: TARGET_GENDERS, customPh: '예: 주로 여성' },
      { id: 'target_trait', label: '③ 그 연령의 특징', desc: '고른 연령에 따라 선택지가 바뀌어요. 디자인에 반영할 특징을 골라 주세요.', type: 'chips', multi: true, dynamic: 'trait', customPh: '예: 병원을 무서워함' },
      { id: 'target_co', label: '④ 함께 고려할 사람', desc: '타깃이 직접 사거나 고르지 않는다면, 누구의 마음에도 들어야 하나요? (예: 유아용 → 학부모·교사)', type: 'chips', multi: true, options: CO_TARGETS, ai: true, customPh: '예: 소아과 의사' },
      { id: 'target_desc', label: '⑤ 타깃을 한 문장으로', type: 'text', ph: '예: 횡단보도를 혼자 건너기 시작하는 5~7세 어린이' },
    ],
  },
  {
    key: 'brief', no: '03', en: 'BRIEF', title: '디자인 브리프', q: '이 캐릭터는 무엇을 전달해야 하나요?', dynQ: true,
    fields: [
      { type: 'brief-head' },
      { id: 'brief_msg', label: '전달할 메시지', dynLabel: 'msg', type: 'text', ph: '예: 횡단보도에서는 꼭 손을 들고 건너요' },
      { id: 'brief_theme', label: '목적별 항목', dynLabel: 'theme', type: 'chips', multi: true, dynamic: 'theme', customPh: '직접 입력' },
      { id: 'impression', label: '느껴져야 할 인상', type: 'chips', multi: true, options: IMPRESSIONS, customPh: '예: 든든한, 믿음직한', hint: '2~3개를 고르면 가장 좋아요' },
      { id: 'conditions', label: '디자인 조건', desc: '이 용도에서 꼭 지켜야 할 제작·사용 조건이에요.', type: 'chips', multi: true, dynamic: 'cond', customPh: '예: 3가지 색 이하로 표현' },
    ],
  },
  {
    key: 'concept', no: '04', en: 'CONCEPT', title: '캐릭터 콘셉트', q: '어떤 캐릭터인가요?',
    fields: [
      { type: 'ai-all', step: 'concept' },
      { id: 'type', label: '캐릭터 종류', type: 'chips', options: TYPES, customPh: '예: 구름, 별, 공룡' },
      { id: 'subtype', label: '세부 종류', type: 'chips', dynamic: 'subtype', customPh: '예: 북극여우, 시바견' },
      { type: 'section', label: '기본 정보' },
      { id: 'name', label: '캐릭터 이름', type: 'text', ph: '예: 모리' },
      { id: 'age', label: '캐릭터의 나이', type: 'chips', options: AGES, customPh: '예: 7살, 300살 요정' },
      { id: 'gender', label: '캐릭터의 성별', type: 'chips', options: GENDERS, customPh: '예: 중성적인 느낌' },
      { id: 'role', label: '역할', type: 'chips', options: ROLES, ai: true, customPh: '예: 이야기를 들려주는 화자' },
      { id: 'job', label: '└ 역할을 구체적으로 (직업 · 하는 일)', type: 'text', ph: '예: 횡단보도 안전 지킴이, 숲속 우체부' },
      { id: 'personality', label: '성격', type: 'chips', multi: true, options: PERSONALITIES, ai: true, customPh: '예: 평소에는 소심하지만 친구가 위험할 때는 용감해진다.', area: true },
      { type: 'section', label: '세계관 · 스토리' },
      { id: 'world', label: '세계관', type: 'chips', options: WORLDS, customPh: '예: 신호등이 말을 하는 작은 도시' },
      { id: 'story', label: '배경 이야기', type: 'text', ph: '예: 사고를 당할 뻔한 친구를 구한 뒤 안전 지킴이가 되었다' },
    ],
  },
  {
    key: 'form', no: '05', en: 'FORM', title: '형태 디자인', q: '어떤 형태로 보여야 하나요?',
    fields: [
      { type: 'ai-all', step: 'form' },
      { id: 'silhouette', label: '실루엣 (형태 언어)', type: 'shapes', options: SILHOUETTES, ai: true, customPh: '예: 물방울 형태' },
      { id: 'proportion', label: '비율', type: 'chips', options: PROPORTIONS, ai: true, customPh: '예: 2.5등신' },
      { id: 'body', label: '체형', type: 'chips', multi: true, options: BODIES, ai: true, customPh: '예: 머리가 몸보다 큼' },
      { type: 'section', label: '얼굴', hint: '각 항목을 선택하거나 직접 입력하세요.' },
      ...FACE_PARTS.map((p) => ({ id: p.id, label: p.label, type: 'chips', multi: true, options: p.options, compact: true, ai: true, customPh: `${p.label} 직접입력` })),
      { type: 'section', label: '손 · 발' },
      { id: 'hands', label: '손', type: 'chips', options: HANDS, compact: true, ai: true, customPh: '예: 장갑 낀 손' },
      { id: 'feet', label: '발', type: 'chips', options: FEET, compact: true, ai: true, customPh: '예: 오리발' },
    ],
  },
  {
    key: 'fashion', no: '06', en: 'FASHION & ITEM', title: '의상 · 소품', q: '무엇을 입고, 무엇을 지니나요?',
    fields: [
      { type: 'ai-all', step: 'fashion' },
      { type: 'grid', fields: OUTFIT_PARTS.map((p) => ({ id: p.id, label: p.label, type: 'text', ph: p.ph, ai: p.id !== 'out_etc' })) },
    ],
  },
  {
    key: 'color', no: '07', en: 'COLOR', title: '컬러 디자인', q: '어떤 색이 메시지를 가장 잘 전달할까요?',
    fields: [
      { type: 'color-advice' },
      { type: 'colors' },
      { id: 'mood', label: '컬러 무드', type: 'chips', multi: true, options: COLOR_MOODS, ai: true, customPh: '예: 레트로, 빈티지' },
    ],
  },
  {
    key: 'style', no: '08', en: 'VISUAL STYLE', title: '표현 스타일', q: '어떤 그림체로 표현할까요?',
    fields: [{ id: 'style', label: '표현 스타일', type: 'styles', options: STYLES, ai: true, customPh: '예: 픽셀아트, 펠트 인형, 판화' }],
  },
  {
    key: 'lock', no: '09', en: 'IDENTITY LOCK', title: '캐릭터 고정 특징', q: '이 캐릭터에서 절대 바뀌면 안 되는 것은 무엇인가요?', lock: true,
    desc: '고른 외형은 모두 자동으로 고정돼요. 그중 이 캐릭터를 알아보게 하는 ★핵심 특징 3~5개를 고르면 모든 프롬프트 맨 앞에 가장 강하게 들어가요.',
    fields: [{ type: 'core' }, { type: 'locks' }, { type: 'idsentence' }],
  },
  {
    key: 'sheet', no: '10', en: 'CHARACTER SHEET', title: '캐릭터 시트', q: '어떤 모습들을 정리해 둘까요?',
    desc: '턴어라운드(정면·45°·측면·후면)는 항상 포함돼요. 여기서는 표정·포즈와 기본 이미지(마스터) 구성을 정해요.',
    fields: [
      { id: 'expr', label: '표정', type: 'chips', multi: true, options: EXPRESSIONS, customPh: '예: 수줍게 볼을 붉힘' },
      { id: 'action', label: '포즈', type: 'chips', multi: true, options: ACTIONS, customPh: '예: 손을 들고 길을 건너는 동작' },
      { type: 'section', label: '기본 이미지 (마스터)' },
      { id: 'framing', label: '표현 범위', type: 'chips', options: FRAMINGS, customPh: '예: 무릎 위까지' },
      { id: 'view', label: '방향', type: 'chips', options: VIEWS, customPh: '예: 살짝 위에서 내려다봄' },
      { id: 'bg', label: '배경', type: 'chips', options: BACKGROUNDS, customPh: '예: 노을 지는 언덕' },
    ],
  },
  {
    key: 'apps', no: '11', en: 'APPLICATION', title: '활용', q: '완성된 캐릭터를 어디로 확장할까요?',
    desc: '주 목적에 맞는 활용이 자동 선택됩니다. 여러 개를 함께 선택할 수 있어요.',
    fields: [{ type: 'apps-scope' }, { type: 'apps' }],
  },
  { key: 'result', no: '✓', en: 'RESULT', title: '결과', q: '캐릭터 디자인이 완성되었어요', result: true, fields: [] },
];
const stepIndex = (key) => STEPS.findIndex((s) => s.key === key);

/* ---------- STEP 07. 활용 방향 ---------- */
const APPS = [
  {
    key: 'picturebook', icon: '📖', title: '그림책', sub: '장면 / 행동 / 표정 / 배경 / 구도',
    fields: [
      { id: 'pb_scene', label: '장면', type: 'text', ph: '예: 숲속 우체국에서 첫 편지를 받는 아침' },
      { id: 'pb_action', label: '행동', type: 'text', ph: '예: 편지를 두 손으로 꼭 안고 있다' },
      { id: 'pb_expr', label: '표정', type: 'chips', multi: true, options: EXPRESSIONS, customPh: '예: 설레는' },
      { id: 'pb_bg', label: '배경', type: 'text', ph: '예: 햇살이 비치는 작은 나무 우체국' },
      { id: 'pb_comp', label: '구도', type: 'chips', options: [o('와이드 풍경', 'wide shot, character within the landscape'), o('미디엄 샷', 'medium shot'), o('클로즈업', 'close-up'), o('위에서 내려다봄', 'high angle'), o('아래에서 올려다봄', 'low angle'), o('양면 펼침', 'double-page spread composition')], customPh: '예: 왼쪽에 글자 공간' },
    ],
  },
  {
    key: 'goods', icon: '🧸', title: '굿즈·상품', sub: '인형 / 키링 / 스티커 / 문구 / 패키지 / 피규어',
    fields: [{ id: 'goods_items', label: '제작할 굿즈', type: 'chips', multi: true, options: [o('인형', 'plush'), o('키링', 'keyring'), o('스티커', 'sticker'), o('문구', 'stationery'), o('패키지', 'package'), o('피규어', 'figure')], customPh: '예: 머그컵, 에코백, 그립톡' }],
  },
  {
    key: 'brand', icon: '🏢', title: '브랜드·마스코트', sub: '브랜드 홍보 / 포스터 / 패키지 / SNS',
    fields: [
      { id: 'brand_items', label: '활용 매체', type: 'chips', multi: true, options: [o('브랜드 홍보', 'promo'), o('포스터', 'poster'), o('패키지', 'package'), o('SNS', 'sns')], customPh: '예: 매장 입간판, 명함' },
      { id: 'brand_name', label: '브랜드 이름', type: 'text', ph: '예: COLOR.M' },
      { id: 'brand_msg', label: '브랜드 메시지 / 슬로건', type: 'text', ph: '예: 매일을 다채롭게' },
    ],
  },
  {
    key: 'emoticon', icon: '😊', title: '이모티콘', sub: '감정 / 행동 / 상황별 표현',
    fields: [
      { id: 'emo_emotions', label: '감정', type: 'chips', multi: true, options: [o('기쁨', 'happy'), o('사랑', 'love'), o('감사', 'thank you'), o('미안', 'sorry'), o('화남', 'angry'), o('슬픔', 'crying'), o('놀람', 'surprised'), o('응원', 'cheering'), o('졸림', 'sleepy'), o('축하', 'congratulations'), o('당황', 'flustered'), o('OK', 'OK')], customPh: '예: 억울함' },
      { id: 'emo_actions', label: '행동', type: 'chips', multi: true, options: [o('인사', 'bowing hello'), o('하트', 'making a heart'), o('엄지척', 'thumbs up'), o('박수', 'clapping'), o('뒹굴뒹굴', 'rolling on the floor'), o('달려가기', 'running toward the viewer'), o('숨기', 'peeking from hiding')], customPh: '예: 이불 덮고 눕기' },
      { id: 'emo_situ', label: '상황별 표현', type: 'text', ph: '예: 출근, 퇴근, 밥 먹자, 생일 축하' },
      { id: 'emo_count', label: '세트 구성', type: 'chips', options: [o('8개', '8'), o('16개', '16'), o('24개', '24'), o('32개', '32')], customPh: '예: 40개' },
    ],
  },
  {
    key: 'edu', icon: '✏️', title: '교육 콘텐츠', sub: '학습 카드 / 워크시트 / 교구 / 안내 캐릭터',
    fields: [
      { id: 'edu_items', label: '제작물', type: 'chips', multi: true, options: [o('학습 카드', 'flashcard'), o('워크시트', 'worksheet'), o('교구·포스터', 'classroom poster'), o('교육 영상 썸네일', 'video thumbnail'), o('안내 캐릭터', 'guide')], customPh: '예: 교과서 삽화' },
      { id: 'edu_topic', label: '학습 주제', type: 'text', ph: '예: 손 씻기, 숫자 1~10, 분리수거' },
    ],
  },
  {
    key: 'coloring', icon: '🖍️', title: '색칠 도안', sub: '색칠 도안 / 따라 그리기 / 컬러 가이드',
    fields: [
      { id: 'col_items', label: '제작물', type: 'chips', multi: true, options: [o('색칠 도안', 'coloring'), o('따라 그리기', 'drawing'), o('컬러 가이드', 'guide')], customPh: '예: 숨은그림찾기' },
      { id: 'col_line', label: '선 굵기', type: 'chips', options: [o('아주 굵게 (영유아)', 'very thick bold outlines'), o('굵게 (유아·초등)', 'thick clean outlines'), o('보통 (초등 고학년 이상)', 'medium-weight clean outlines')], customPh: '예: 점선' },
      { id: 'col_scene', label: '함께 넣을 장면·소품', type: 'text', ph: '예: 횡단보도와 신호등' },
    ],
  },
  {
    key: 'sns', icon: '📱', title: 'SNS 콘텐츠', sub: '피드 / 릴스 / 카드뉴스 / 프로필',
    fields: [
      { id: 'sns_items', label: '형식', type: 'chips', multi: true, options: [o('피드 이미지(1:1)', 'feed11'), o('세로 피드(4:5)', 'feed45'), o('릴스·쇼츠 커버(9:16)', 'reels'), o('카드뉴스', 'cardnews'), o('프로필 이미지', 'profile')], customPh: '예: 유튜브 배너' },
      { id: 'sns_topic', label: '콘텐츠 주제', type: 'text', ph: '예: 월요일 아침 인사, 신제품 소개' },
    ],
  },
  {
    key: 'video', icon: '🎬', title: '영상·애니메이션', sub: '이미지→영상 프롬프트 (Veo · Sora · Kling · Runway)',
    fields: [
      { id: 'vid_tool', label: '영상 AI 도구', desc: '도구마다 잘 알아듣는 프롬프트 형식이 달라요.', type: 'chips', options: [o('범용', 'generic'), o('Veo', 'veo'), o('Sora', 'sora'), o('Kling', 'kling'), o('Runway', 'runway')], customPh: '예: Pika, Hailuo' },
      { id: 'vid_mode', label: '만드는 방식', type: 'chips', options: [o('이미지→영상 (추천)', 'i2v'), o('텍스트→영상', 't2v')], customPh: '예: 처음·끝 프레임 지정' },
      { id: 'vid_format', label: '화면 비율', type: 'chips', options: [o('숏폼 9:16', '9:16'), o('가로 16:9', '16:9'), o('정사각 1:1', '1:1'), o('짧은 루프(GIF)', 'loop')], customPh: '예: 4:5' },
      { id: 'vid_length', label: '길이', type: 'chips', options: [o('5초', '5'), o('8초', '8'), o('10초', '10')], customPh: '예: 15초' },
      { type: 'section', label: '장면 · 동작 (시간 순서대로)' },
      { id: 'vid_scene', label: '장소 · 상황', type: 'text', ph: '예: 비 온 뒤 무지개가 뜬 골목, 아침 햇살' },
      { id: 'vid_beat1', label: '① 시작', type: 'text', ph: '예: 웅덩이 앞에서 고개를 갸웃한다' },
      { id: 'vid_beat2', label: '② 중간', type: 'text', ph: '예: 깡충 뛰어 웅덩이를 넘는다' },
      { id: 'vid_beat3', label: '③ 끝', type: 'text', ph: '예: 카메라를 보며 손을 흔들고 웃는다' },
      { id: 'vid_camera', label: '카메라', type: 'chips', options: [o('고정 샷', 'static locked-off camera'), o('천천히 줌 인', 'slow push-in'), o('패닝', 'slow pan'), o('따라가기 (트래킹)', 'tracking shot following the character'), o('캐릭터 주위 회전', 'slow orbit around the character'), o('위에서 내려오기', 'crane down')], customPh: '예: 핸드헬드 느낌' },
      { id: 'vid_bg', label: '주변의 움직임', type: 'text', ph: '예: 나뭇잎이 흔들리고 물웅덩이에 파문이 퍼진다' },
      { type: 'section', label: '소리' },
      { id: 'vid_sound', label: '소리', type: 'chips', multi: true, options: [o('배경음악', 'soft background music'), o('효과음', 'matching sound effects'), o('대사', 'dialogue'), o('무음', 'no audio')], customPh: '예: 빗소리, 경쾌한 우쿨렐레' },
      { id: 'vid_line', label: '대사 (선택)', type: 'text', ph: '예: 안녕! 오늘도 손 들고 건너자!' },
    ],
  },
  {
    key: 'game', icon: '🎮', title: '게임·콘텐츠', sub: '캐릭터 포즈 / 아이템 / 세계관',
    fields: [
      { id: 'game_pose', label: '캐릭터 포즈', type: 'chips', multi: true, options: [o('대기', 'idle'), o('걷기', 'walk'), o('점프', 'jump'), o('공격', 'attack'), o('승리', 'victory'), o('피격', 'hit reaction')], customPh: '예: 마법 시전' },
      { id: 'game_item', label: '아이템', type: 'text', ph: '예: 별가루 지팡이, 도토리 방패' },
      { id: 'game_world', label: '세계관', type: 'text', ph: '예: 떠다니는 섬들로 이루어진 하늘 왕국' },
      { id: 'game_format', label: '결과물 형식', type: 'chips', multi: true, options: [o('스프라이트 시트', 'sprite'), o('캐릭터 일러스트', 'keyart'), o('게임 아이콘', 'icon')], customPh: '예: 카드 일러스트' },
    ],
  },
];

/* ---------- 활용별로 실제로 만들어지는 결과물 (과장 없이 안내) ---------- */
/* 그림책 메이커(C:\colorm\AI PICTUREBOOK MAKER_20206.2) — 현재 제작 중.
 * 온라인 주소가 생기면 여기에 넣으면 11단계 그림책 카드와 결과 페이지에 "그림책 메이커로 이어가기" 버튼이 나타난다. */
const PICTUREBOOK_MAKER_URL = '';

const APP_GETS = {
  picturebook: '그림책 장면 이미지 프롬프트 (간단 버전) — 이야기·장면 전체 제작은 그림책 메이커에서 (준비 중)',
  goods: '굿즈 제품 시안 이미지 프롬프트',
  brand: '홍보물·포스터·패키지 시안 이미지 프롬프트',
  emoticon: '이모티콘 세트 이미지 + 개별 프롬프트',
  edu: '학습 카드·워크시트 등 교육 자료용 이미지 프롬프트',
  coloring: '색칠 도안·따라 그리기 선화 이미지 프롬프트',
  sns: 'SNS 게시물·썸네일 이미지 프롬프트',
  video: '5~10초 클립 영상 프롬프트 + 시작·끝 프레임 이미지 (긴 영상은 클립을 이어 붙여 제작)',
  game: '게임에 넣을 캐릭터 이미지 (스프라이트·키 아트·아이콘) — 게임 자체를 만들지는 않아요',
};

/* ---------- 목적별 추천값 ---------- */
const RECOMMEND = {
  picturebook: { style: ['그림책', '수채화', '색연필'], framing: ['전신'], view: ['45도'], bg: ['야외'], mood: ['파스텔', '웜'], body: ['작고 귀여운'], proportion: ['3등신'], impression: ['따뜻한', '귀여운'], conditions: ['여러 장면에 반복 등장 (그리기 쉬운 형태)', '다양한 표정·동작 표현'] },
  brand: { style: ['귀여운 3D', '플랫 벡터'], framing: ['전신'], view: ['정면'], bg: ['흰색'], body: ['둥글둥글한'], mood: ['모던'], impression: ['친근한', '신뢰감 있는'], conditions: ['아이콘 크기에서도 식별', '브랜드 컬러 사용'] },
  goods: { style: ['플랫 벡터', '귀여운 3D'], framing: ['전신'], view: ['정면'], bg: ['투명 배경용'], body: ['둥글둥글한', '작고 귀여운'], mood: ['파스텔'], proportion: ['2등신'], impression: ['귀여운', '친근한'], conditions: ['인형·자수 제작 가능', '단가를 고려한 단순한 형태'] },
  emoticon: { style: ['카툰', '2D 일러스트'], framing: ['얼굴 중심', '반신'], view: ['정면'], bg: ['투명 배경용'], body: ['작고 귀여운'], proportion: ['2등신'], expr: ['기쁨', '웃음', '슬픔', '화남', '놀람'], impression: ['귀여운', '재미있는'], conditions: ['작은 크기에서도 표정이 보임', '굵고 깔끔한 외곽선'] },
  edu: { style: ['2D 일러스트', '그림책'], framing: ['전신'], view: ['정면'], bg: ['흰색'], body: ['작고 귀여운'], personality: ['밝은', '따뜻한'], impression: ['친근한', '신뢰감 있는'], conditions: ['흑백 인쇄에서도 구분', '단순한 형태 (따라 그리기 쉬움)'] },
  sns: { style: ['귀여운 3D', '2D 일러스트'], framing: ['반신'], view: ['정면'], mood: ['비비드', '파스텔'], impression: ['친근한', '재미있는'], conditions: ['피드 썸네일에서 눈에 띔', '시리즈로 확장 가능'] },
  video: { style: ['2D 일러스트', '귀여운 3D'], framing: ['전신'], view: ['정면', '45도', '측면'], bg: ['단색'], impression: ['활기찬', '친근한'], conditions: ['애니메이션 동작 고려', '측면·뒷모습 표현이 쉬움'] },
  game: { style: ['카툰', '2D 일러스트'], framing: ['전신'], view: ['45도'], bg: ['투명 배경용'], body: ['작고 귀여운'], proportion: ['3등신'], action: ['서기', '뛰기'], impression: ['용감한', '활기찬'], conditions: ['작은 화면에서도 실루엣 식별', '스프라이트 애니메이션 고려'] },
};

/* ---------- 목적별 단계 팁 ---------- */
const TIPS = {
  picturebook: {
    target: '그림책은 읽어 주는 어른도 함께 보는 독자예요. 아이 연령과 함께 학부모·교사도 고려해 보세요.',
    brief: '그림책 캐릭터는 이야기의 주제를 행동과 표정으로 보여 주는 존재예요. "이 책을 덮었을 때 아이가 느꼈으면 하는 마음"을 한 문장으로 적어 보세요.',
    concept: '그림책 캐릭터는 성격이 행동과 표정으로 드러나야 이야기가 살아납니다. 성격과 배경 이야기를 구체적으로 적어 주세요.',
    form: '여러 장면에 반복 등장하므로 그리기 쉬운 단순한 형태와 눈에 띄는 대표 특징 1~2개가 좋아요.',
    lock: '그림책은 페이지마다 캐릭터가 달라 보이기 쉬워요. 의상 색, 귀·꼬리 모양 등을 꼭 고정하세요.',
    sheet: '기본 이미지는 전신 + 45도가 이후 장면 제작에 가장 활용도가 높아요.',
  },
  brand: {
    brief: '마스코트는 브랜드가 하고 싶은 말을 대신하는 존재예요. 브랜드 슬로건을 메시지로 적어 보세요.',
    form: '마스코트는 실루엣만 보고도 알아볼 수 있어야 해요. 대표 특징을 과감하게 정해 보세요.',
    color: '브랜드 컬러를 메인 컬러로 지정하면 모든 프롬프트에 HEX 값이 고정됩니다.',
    sheet: '정면 + 흰색 배경은 로고·패키지 등 다양한 매체에 활용하기 좋아요.',
  },
  goods: {
    brief: '굿즈는 제작 방식이 디자인을 결정해요. 디자인 조건에서 인형·자수 제작 가능 여부를 꼭 정해 주세요.',
    form: '굿즈는 단순한 형태일수록 제작이 쉽고 단가가 낮아져요. 둥글고 통통한 체형을 추천합니다.',
    style: '플랫한 면 컬러는 인쇄·자수·아크릴 제작에 모두 유리해요.',
    sheet: '투명 배경용 + 정면 전신 이미지는 바로 굿즈 시안으로 활용할 수 있어요.',
  },
  emoticon: {
    form: '이모티콘은 작은 화면에서 보이므로 2등신(큰 머리, 작은 몸)과 큰 눈을 추천해요.',
    sheet: '표정을 여러 개 선택해 두면 캐릭터 시트에도 표정 세트가 포함됩니다.',
    apps: '감정과 행동을 골고루 선택하면 바로 쓸 수 있는 이모티콘 세트 프롬프트가 만들어져요.',
  },
  edu: {
    target: '교육용은 학습자 연령이 가장 중요해요. 연령에 따라 형태의 단순함과 색 수가 달라집니다.',
    brief: '교육 캐릭터는 "무엇을 배우게 할지"가 메시지예요. 행동 규칙을 한 문장으로 적어 보세요.',
    concept: '학습자의 연령에 맞는 친근한 성격과 역할(안내자 등)을 추천해요.',
    sheet: '정면 + 흰색 배경은 학습 자료에 배치하기 좋아요.',
  },
  sns: {
    color: '피드에서 눈에 띄도록 선명한 포인트 컬러를 정해 보세요.',
  },
  video: {
    form: '애니메이션은 움직임이 많으므로 복잡한 무늬나 장식은 최소화하는 게 좋아요.',
    sheet: '정면·45도·측면·후면을 모두 선택하면 턴어라운드 제작에 유리해요.',
    apps: '이미지→영상은 마스터 이미지가 생김새를 담당해요. 프롬프트에는 외모 대신 "시간 순서대로의 동작·카메라·소리"를 적으면 캐릭터가 덜 변해요.',
  },
  game: {
    form: '게임 화면에서도 구분되도록 독특한 실루엣(무기, 모자, 귀 모양 등)을 정해 보세요.',
    sheet: '투명 배경용 이미지는 스프라이트 작업에 바로 활용할 수 있어요.',
  },
};
