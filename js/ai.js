/* COLOR.M CHARACTER DESIGN MAKER — AI 추천
 * 목적 · 타깃 · 디자인 브리프(메시지 · 인상 · 조건)를 근거로 이후 단계의 값을 추천한다.
 * 반환: { vals: [옵션값], why } (칩 항목) / { text, why } (의상 텍스트 항목) / null (추천 없음)
 */

function aiProfile() {
  const has = (id, ...vs) => vs.some((v) => sel(id).includes(v));
  const subtype = [sel('subtype')[0] || '', customOf('subtype'), customOf('type')].join(' ');
  const sub = (...ks) => ks.some((k) => subtype.includes(k));
  const job = [txt('job'), customOf('role'), sel('role').join(' '), txt('brief_msg'), txt('story')].join(' ');
  const imps = sel('impression').map((v) => IMPRESSIONS.find((x) => x.v === v)).filter(Boolean);
  return {
    type: sel('type')[0] || '',
    has, sub, job, imps,
    jobHas: (...ks) => ks.some((k) => job.includes(k)),
    pk: purposeKey(),
    imp: (...vs) => vs.some((v) => sel('impression').includes(v)),
    /* '그리기 쉬운 형태', '단가를 고려한 단순한 형태' 등 목적별 조건도 '단순한'으로 함께 판단 */
    cond: (...vs) => vs.some((v) => sel('conditions').some((c) => (/그리기 쉬운|단순한|단가|칼선/.test(c) ? `${c} 단순한` : c).includes(v))),
    trait: (...vs) => vs.some((v) => sel('target_trait').some((t) => t.includes(v))),
    youngTarget: has('target_age', '영유아 (0~3세)', '유아 (4~7세)', '초등 저학년'),
    adultTarget: has('target_age', '청년·대학생', '성인', '시니어') && !has('target_age', '영유아 (0~3세)', '유아 (4~7세)', '초등 저학년', '초등 고학년'),
    young: has('age', '아기', '어린이'),
    old: has('age', '노년'),
    cute: has('personality', '귀여운', '수줍은', '따뜻한'),
    energetic: has('personality', '밝은', '활발한', '장난꾸러기', '호기심 많은'),
    calm: has('personality', '차분한', '신비로운'),
    personaTxt: sel('personality').slice(0, 2).join('·'),
    impTxt: sel('impression').slice(0, 2).join('·'),
  };
}

/* 인상 키워드에서 가장 많이 나온 값 */
function topBy(list) {
  const c = {};
  list.forEach((v) => { c[v] = (c[v] || 0) + 1; });
  return Object.keys(c).sort((a, b) => c[b] - c[a]);
}

const AI_RULES = {
  /* ---------- 02 TARGET ---------- */
  target_co(p) {
    const ages = sel('target_age');
    if (!ages.length) return null;
    if (ages.some((a) => /영유아|유아/.test(a))) return { vals: p.pk === 'edu' || p.pk === 'picturebook' ? ['학부모', '교사·교육기관'] : ['학부모'], why: '유아는 직접 고르지 않아요 — 읽어 주고 사 주는 어른의 마음에도 들어야 해요' };
    if (ages.some((a) => /초등/.test(a))) return { vals: ['학부모'], why: '초등학생 콘텐츠·상품은 부모가 함께 선택하는 경우가 많아요' };
    if (p.pk === 'brand') return { vals: ['브랜드 담당자'], why: '마스코트는 브랜드의 방향과도 맞아야 해요' };
    return { vals: ['없음 (타깃이 직접 선택)'], why: '이 연령은 보통 스스로 고르고 구매해요' };
  },

  /* ---------- 04 CONCEPT ---------- */
  role(p) {
    if (p.pk === 'edu' || p.jobHas('안전', '안내', '선생')) return { vals: ['안내자'], why: '메시지를 전달하는 교육 캐릭터는 안내자 역할이 자연스러워요' };
    if (p.pk === 'brand') return { vals: ['마스코트'], why: '브랜드를 대표하는 역할이에요' };
    return { vals: ['주인공'], why: '이야기와 콘텐츠의 중심이 되는 역할이에요' };
  },
  personality(p) {
    if (p.imps.length) {
      const vals = topBy(p.imps.flatMap((x) => x.x.pers)).slice(0, 3);
      return { vals, why: `'${p.impTxt}' 인상을 성격으로 옮겼어요` };
    }
    if (p.pk === 'edu') return { vals: ['밝은', '따뜻한'], why: '학습자에게 다가가기 쉬운 성격이에요' };
    if (p.pk === 'brand') return { vals: ['밝은', '호기심 많은'], why: '브랜드 마스코트는 긍정적인 에너지가 중요해요' };
    return { vals: ['밝은', '호기심 많은'], why: '이야기를 이끌기 좋은 성격이에요' };
  },

  /* ---------- 05 FORM ---------- */
  silhouette(p) {
    if (p.imps.length) {
      const top = topBy(p.imps.map((x) => x.x.shape))[0];
      const from = p.imps.filter((x) => x.x.shape === top).map((x) => x.v).join('·');
      return { vals: [top], why: `'${from}' 인상에는 ${top} 실루엣이 어울려요 — ${SILHOUETTES.find((s) => s.v === top).x.mean}` };
    }
    if (p.pk === 'goods' || p.pk === 'emoticon' || p.youngTarget) return { vals: ['원형'], why: '둥근 실루엣은 친근하고 안전한 인상을 줘요' };
    if (p.pk === 'game') return { vals: ['삼각형'], why: '게임 캐릭터는 역동적인 실루엣이 잘 보여요' };
    return { vals: ['혼합'], why: '친근함과 신뢰감을 함께 주는 가장 범용적인 형태예요' };
  },
  proportion(p) {
    if (p.trait('유치한 것은 싫어함')) return { vals: ['4~5등신'], why: '유치한 것을 싫어하는 타깃에는 길쭉한 비율이 어울려요' };
    if (p.pk === 'emoticon' || p.pk === 'goods' || p.has('target_age', '영유아 (0~3세)')) return { vals: ['2등신'], why: '큰 머리는 작은 크기에서도 표정이 잘 보이고 귀여워요' };
    if (p.youngTarget || p.pk === 'picturebook' || p.pk === 'edu') return { vals: ['3등신'], why: '어린이가 친근하게 느끼면서도 동작 표현이 쉬운 비율이에요' };
    if (p.adultTarget && p.imp('전문적인', '세련된')) return { vals: ['4~5등신'], why: '성인 타깃의 전문적인 인상에는 길쭉한 비율이 어울려요' };
    return { vals: ['3등신'], why: '귀여움과 동작 표현의 균형이 좋은 비율이에요' };
  },
  body(p) {
    if (sel('silhouette').includes('원형')) return { vals: ['둥글둥글한'], why: '원형 실루엣에 맞춘 둥근 체형이에요' };
    if (sel('silhouette').includes('사각형')) return { vals: ['통통한'], why: '사각 실루엣에는 듬직한 체형이 어울려요' };
    if (sel('silhouette').includes('삼각형')) return { vals: ['날씬한'], why: '삼각 실루엣에는 날렵한 체형이 어울려요' };
    if (p.pk === 'emoticon' || p.pk === 'game') return { vals: ['작고 귀여운', '둥글둥글한'], why: '작은 화면에서도 잘 보이는 체형이에요' };
    if (['음식', '사물', '식물'].includes(p.type)) return { vals: ['둥글둥글한'], why: `${p.type} 캐릭터는 둥근 형태가 의인화하기 좋아요` };
    return { vals: ['작고 귀여운'], why: '가장 무난하고 활용도가 높은 체형이에요' };
  },
  face_shape(p) {
    if (p.type === '로봇' || sel('silhouette').includes('사각형')) return { vals: ['각진'], why: '사각 실루엣·로봇에는 각진 얼굴이 어울려요' };
    if (p.youngTarget || p.imp('친근한', '귀여운', '안심되는')) return { vals: ['둥근', '통통한 볼'], why: '어린 타깃·친근한 인상에는 둥근 얼굴과 통통한 볼이 어울려요' };
    if (p.has('personality', '신비로운')) return { vals: ['하트형'], why: '신비로운 성격에는 갸름한 하트형이 어울려요' };
    if (p.calm || p.old) return { vals: ['계란형'], why: '차분한 인상에는 계란형 얼굴이 어울려요' };
    return { vals: ['둥근', '통통한 볼'], why: '둥근 얼굴과 통통한 볼은 친근한 인상을 줘요' };
  },
  face_eyes(p) {
    if (p.pk === 'emoticon' || p.pk === 'brand' || p.cond('흑백', '따라 그리기')) return { vals: ['점눈'], why: '점눈은 단순해서 작은 크기·흑백 인쇄·따라 그리기에 유리해요' };
    if (p.trait('글을 아직 읽지 못함', '크고 선명한 형태', '크고 명확한 형태')) return { vals: ['크고 동그란'], why: '타깃이 표정만으로 감정을 읽을 수 있도록 크고 또렷한 눈이 좋아요' };
    if (p.has('personality', '장난꾸러기')) return { vals: ['초승달 눈웃음'], why: '장난꾸러기 성격은 눈웃음으로 잘 드러나요' };
    if (p.has('personality', '수줍은', '차분한')) return { vals: ['초승달 눈웃음'], why: '수줍고 차분한 성격에는 부드러운 눈웃음이 어울려요' };
    if (p.has('personality', '신비로운')) return { vals: ['반짝이는'], why: '반짝이는 눈이 신비로운 분위기를 만들어요' };
    return { vals: ['크고 동그란', '반짝이는'], why: '크고 반짝이는 눈은 감정 표현이 쉽고 시선을 모아요' };
  },
  face_nose(p) {
    if (['음식', '사물', '로봇', '몬스터', '식물'].includes(p.type)) return { vals: ['생략'], why: `${p.type} 캐릭터는 코를 생략하면 더 깔끔해요` };
    if (p.sub('고양이')) return { vals: ['하트 모양'], why: '고양이는 하트 모양 코가 특징적이에요' };
    if (p.sub('강아지', '곰', '햄스터', '호랑이')) return { vals: ['동그란'], why: '동그란 코가 동물 느낌을 살려줘요' };
    return { vals: ['작은 점'], why: '작은 점 코는 얼굴을 단순하고 귀엽게 만들어요' };
  },
  face_mouth(p) {
    if (p.sub('고양이', '여우')) return { vals: ['ω 모양'], why: '고양이·여우는 ω 입 모양이 잘 어울려요' };
    if (p.has('personality', '장난꾸러기', '용감한') || p.type === '몬스터') return { vals: ['작은 송곳니'], why: '작은 송곳니가 장난기·용감함을 보여줘요' };
    if (p.energetic || p.imp('친근한', '활기찬')) return { vals: ['활짝 웃는'], why: '활짝 웃는 입은 친근하고 밝은 인상을 줘요' };
    return { vals: ['작은 미소'], why: '작은 미소는 기본 표정으로 가장 무난해요' };
  },
  face_ears(p) {
    if (p.sub('토끼')) return { vals: p.has('personality', '수줍은') ? ['큰', '처진'] : ['큰'], why: '토끼는 긴 귀가 가장 큰 특징이에요' };
    if (p.sub('여우', '요정')) return { vals: ['큰', '뾰족한'], why: '크고 뾰족한 귀가 실루엣을 살려줘요' };
    if (p.sub('고양이')) return { vals: ['뾰족한'], why: '고양이는 뾰족한 귀가 특징이에요' };
    if (p.sub('강아지')) return { vals: ['처진'], why: '처진 귀는 순하고 다정한 인상을 줘요' };
    if (p.sub('곰', '햄스터', '호랑이')) return { vals: ['둥근'], why: '둥근 귀가 귀여운 실루엣을 만들어요' };
    if (p.type === '동물' || p.type === '몬스터') return { vals: ['둥근'], why: '둥근 귀는 어떤 동물에도 무난해요' };
    return null;
  },
  face_hair(p) {
    if (!['사람', '판타지 생명체'].includes(p.type)) return null;
    if (p.has('personality', '장난꾸러기')) return { vals: ['삐죽 한 가닥'], why: '삐죽 솟은 머리 한 가닥이 장난기를 더해요' };
    if (p.sub('여자아이')) return { vals: ['양갈래'], why: '양갈래 머리는 어린 여자아이 캐릭터의 대표 실루엣이에요' };
    if (p.sub('할머니') || p.old) return { vals: ['곱슬머리'], why: '곱슬머리가 푸근한 어르신 느낌을 줘요' };
    if (p.calm) return { vals: ['긴 생머리'], why: '긴 생머리는 차분하고 신비로운 분위기를 줘요' };
    return { vals: ['짧은 머리'], why: '짧은 머리는 움직임이 많은 캐릭터에 편해요' };
  },
  face_fur(p) {
    if (p.type !== '동물' && !p.sub('털복숭이')) return null;
    if (p.cond('인형')) return { vals: ['보송보송한'], why: '보송보송한 털은 인형 원단으로 표현하기 좋아요' };
    if (p.sub('곰', '햄스터', '강아지', '털복숭이')) return { vals: ['복슬복슬한'], why: '복슬복슬한 털이 포근한 느낌을 줘요' };
    if (p.sub('고양이', '호랑이')) return { vals: ['매끈한'], why: '매끈한 털이 고양잇과의 날렵함을 살려요' };
    return { vals: ['보송보송한'], why: '보송보송한 털은 귀엽고 부드러운 인상을 줘요' };
  },
  face_pattern(p) {
    if (p.cond('단순한', '흑백') || p.trait('짧은 집중 시간', '크고 명확한 형태')) return null;
    if (p.sub('호랑이')) return { vals: ['줄무늬'], why: '호랑이는 줄무늬가 정체성이에요' };
    if (p.sub('강아지')) return { vals: ['얼룩', '볼터치'], why: '얼룩 무늬가 강아지만의 개성을 만들어요' };
    if (p.has('personality', '신비로운') || p.type === '판타지 생명체') return { vals: ['별 무늬'], why: '별 무늬가 신비롭고 판타지한 느낌을 줘요' };
    if (p.type === '로봇') return null;
    return { vals: ['볼터치'], why: '볼터치는 어떤 캐릭터에도 생기를 더해요' };
  },
  hands(p) {
    if (p.sub('새', '펭귄', '오리', '병아리')) return { vals: ['날개'], why: '새 종류는 날개가 팔 역할을 해요' };
    if (p.youngTarget || p.cond('단순한', '인형') || ['음식', '사물', '식물'].includes(p.type) || p.pk === 'emoticon') return { vals: ['동그란 손 (손가락 생략)'], why: '손가락을 생략하면 단순하고 제작·따라 그리기가 쉬워요' };
    if (p.type === '동물') return { vals: ['동물 앞발'], why: '동물 앞발이 캐릭터의 종을 살려줘요' };
    if (p.type === '사람' && p.adultTarget) return { vals: ['다섯 손가락'], why: '성인 타깃에는 자연스러운 손이 어울려요' };
    return { vals: ['네 손가락'], why: '카툰 캐릭터에서 가장 많이 쓰는 단순한 손이에요' };
  },
  feet(p) {
    if (p.sub('정령', '요정', '유령', '슬라임')) return { vals: ['발 없음 (떠 있음)'], why: '떠 있는 형태가 신비로운 느낌을 줘요' };
    if (p.type === '로봇' && p.sub('소형', '가전')) return { vals: ['바퀴'], why: '바퀴는 로봇다운 개성을 보여줘요' };
    if (p.type === '사람' || txt('out_shoes')) return { vals: ['신발 신은 발'], why: '신발은 의상 콘셉트를 완성해요' };
    if (p.type === '동물') return { vals: ['동물 발바닥'], why: '발바닥 젤리는 동물 캐릭터의 귀여운 포인트예요' };
    return { vals: ['동그란 발'], why: '짧고 둥근 발은 안정감 있고 귀여워요' };
  },

  /* ---------- 06 FASHION ---------- */
  signature(p) {
    const v = [];
    const why = [];
    const jobOnly = txt('job');
    if (p.sub('여우', '고양이', '호랑이', '다람쥐')) { v.push('특별한 꼬리'); why.push('꼬리로 실루엣 구분'); } else if (p.sub('토끼', '요정', '강아지')) { v.push('특별한 귀'); why.push('귀로 실루엣 구분'); }
    if (/안전|교통|소방|경찰/.test(jobOnly)) { v.push('목도리'); why.push('멀리서도 눈에 띄는 포인트 컬러 목도리'); }
    if (/우체부|탐험|여행|학생|배달/.test(jobOnly)) { v.push('가방'); why.push('직업을 보여주는 가방'); }
    if (/박사|선생|연구|교수/.test(jobOnly) || p.imp('전문적인')) { v.push('안경'); why.push('지적인 인상의 안경'); }
    if (v.length < 2) { v.push(p.cute || p.young || p.imp('귀여운') ? '리본' : '목도리'); why.push('한눈에 기억되는 포인트 소품'); }
    return { vals: uniq(v).slice(0, 2), why: why.slice(0, 2).join(', ') };
  },

  /* ---------- 07 COLOR ---------- */
  mood(p) {
    if (p.trait('크고 선명한 형태')) return { vals: ['비비드'], why: '크고 선명한 것에 반응하는 타깃에는 또렷한 색이 효과적이에요' };
    if (p.trait('차분한 색을 선호함')) return { vals: ['내추럴'], why: '차분한 색을 선호하는 타깃에 맞춘 자연스러운 색감이에요' };
    if (p.youngTarget && p.imp('친근한', '귀여운', '안심되는')) return { vals: ['파스텔'], why: '어린 타깃에게 부드러운 파스텔 톤은 친근하고 편안해요' };
    if (p.imp('활기찬', '재미있는', '용감한')) return { vals: ['비비드'], why: `'${p.impTxt}' 인상에는 선명한 색이 어울려요` };
    if (p.imp('전문적인', '세련된', '신뢰감 있는')) return { vals: ['모던'], why: `'${p.impTxt}' 인상에는 절제된 모던 톤이 어울려요` };
    if (p.imp('신비로운')) return { vals: ['환상적인'], why: '신비로운 인상에는 환상적인 색감이 어울려요' };
    if (p.imp('따뜻한')) return { vals: ['웜', '내추럴'], why: '따뜻한 인상에는 난색 계열이 어울려요' };
    if (p.imp('친근한', '귀여운', '안심되는') || p.youngTarget) return { vals: ['파스텔'], why: '부드러운 파스텔 톤은 친근하고 편안해요' };
    return { vals: ['내추럴'], why: '자연스러운 색감은 어떤 용도에도 무난해요' };
  },

  /* ---------- 08 STYLE ---------- */
  style(p) {
    if (p.cond('인형')) return { vals: ['귀여운 3D'], why: '3D 이미지는 인형·피규어 제작 시안으로 바로 쓸 수 있어요' };
    if (p.cond('흑백', '따라 그리기') || p.pk === 'edu') return { vals: ['2D 일러스트'], why: '깔끔한 선의 2D는 학습 자료·인쇄에 유리해요' };
    const rec = (RECOMMEND[p.pk] || {}).style;
    if (rec) return { vals: [rec[0]], why: `${sel('purpose')[0]} 용도에 가장 많이 쓰는 스타일이에요` };
    return { vals: ['2D 일러스트'], why: '가장 범용적으로 쓰이는 스타일이에요' };
  },
};

/* 직업 키워드 → 의상 */
const OUTFIT_BY_JOB = [
  [['안전', '교통', '횡단보도', '신호'], { out_hat: '노란 안전모', out_top: '반사띠가 있는 노란 안전 조끼', out_prop: '정지 표지판 모양 깃발' }],
  [['경찰'], { out_hat: '경찰 모자', out_top: '파란 제복', out_acc: '별 모양 배지' }],
  [['환경', '분리수거', '지구'], { out_top: '초록 앞치마', out_hat: '나뭇잎 모자', out_prop: '재활용 바구니' }],
  [['손 씻기', '위생', '건강'], { out_top: '하늘색 가운', out_acc: '물방울 모양 배지', out_prop: '비누' }],
  [['우체부', '배달'], { out_hat: '챙 있는 우체부 모자', out_top: '단추 달린 짧은 제복 조끼', out_prop: '편지가 든 어깨 가방' }],
  [['요리', '셰프', '빵'], { out_hat: '하얀 요리사 모자', out_top: '앞치마', out_prop: '나무 국자' }],
  [['탐험', '여행', '모험'], { out_hat: '탐험가 모자', out_top: '주머니 많은 조끼', out_shoes: '튼튼한 부츠', out_prop: '돋보기' }],
  [['의사', '간호', '병원'], { out_top: '하얀 가운', out_acc: '청진기' }],
  [['마법', '마녀', '마술'], { out_hat: '뾰족한 마법사 모자', out_top: '별 무늬 망토', out_prop: '작은 지팡이' }],
  [['기사', '용사', '전사'], { out_top: '가벼운 갑옷 조끼', out_acc: '망토', out_prop: '나무 방패' }],
  [['학생', '유치원'], { out_top: '단정한 셔츠', out_bottom: '반바지', out_prop: '작은 책가방' }],
  [['선생', '교사', '안내'], { out_top: '니트 카디건', out_acc: '이름표', out_prop: '지시봉' }],
  [['소방'], { out_hat: '소방관 헬멧', out_top: '노란 반사띠가 있는 소방복', out_shoes: '고무 장화' }],
  [['농부', '정원', '농장'], { out_hat: '밀짚모자', out_bottom: '멜빵바지', out_shoes: '장화', out_prop: '작은 물뿌리개' }],
  [['화가', '디자이너', '예술'], { out_hat: '베레모', out_top: '물감 묻은 앞치마', out_prop: '붓' }],
];

function outfitRecommend(p) {
  const hit = OUTFIT_BY_JOB.find(([ks]) => p.jobHas(...ks));
  if (hit) return { map: hit[1], why: '역할·메시지에 맞춘 의상이에요' };
  if (['음식', '사물', '식물'].includes(p.type)) return { map: { out_acc: '작은 나비넥타이' }, why: '의인화 캐릭터는 옷 대신 작은 소품 하나가 깔끔해요' };
  if (p.type === '로봇') return { map: { out_acc: '가슴의 하트 모양 표시등', out_prop: '안테나' }, why: '로봇은 의상 대신 부품으로 개성을 표현해요' };
  if (p.cond('단순한', '인형')) return { map: { out_acc: '포인트 컬러 목도리' }, why: '디자인 조건(단순한 형태)에 맞춰 소품 하나만 더했어요' };
  if (p.type === '동물' && p.pk !== 'picturebook') return { map: { out_acc: '포인트 컬러 목도리' }, why: '동물 캐릭터는 소품 하나만 더해도 충분해요' };
  if (p.energetic) return { map: { out_top: '포인트 컬러 후드티', out_bottom: '반바지', out_shoes: '운동화' }, why: '활발한 성격에는 움직이기 편한 옷이 어울려요' };
  if (p.calm) return { map: { out_top: '부드러운 니트', out_acc: '작은 망토' }, why: '차분한 성격에는 단정한 의상이 어울려요' };
  return { map: { out_top: '단색 티셔츠', out_acc: '포인트 컬러 목도리' }, why: '단순한 의상이 캐릭터를 돋보이게 해요' };
}

function aiRecommend(id) {
  const p = aiProfile();
  if (id.startsWith('out_')) {
    const r = outfitRecommend(p);
    return r.map[id] ? { text: r.map[id], why: r.why } : null;
  }
  return AI_RULES[id] ? AI_RULES[id](p) : null;
}

function aiApplied(id, r) {
  if (!r) return true;
  if (r.text !== undefined) return txt(id) === r.text;
  return r.vals.every((v) => sel(id).includes(v));
}

function aiApply(id) {
  const r = aiRecommend(id);
  if (!r) return;
  if (r.text !== undefined) { state.v[id] = r.text; return; }
  const f = FIELD_INDEX[id];
  const st = { ...chipState(id) };
  st.sel = f && f.multi ? uniq([...st.sel, ...r.vals]) : [r.vals[0]];
  state.v[id] = st;
}

/* 한 단계의 모든 AI 추천 적용 (이미 입력한 텍스트는 유지). 앞 항목 결과가 뒤 항목 추천에 반영되도록 순서대로 적용 */
function aiApplyAll(stepKey) {
  const ids = [];
  const walk = (fs) => fs.forEach((f) => { if (f.ai) ids.push(f.id); if (f.fields) walk(f.fields); });
  walk(STEPS.find((s) => s.key === stepKey).fields);
  ids.forEach((id) => {
    if (id.startsWith('out_') && txt(id)) return;
    aiApply(id);
  });
}
