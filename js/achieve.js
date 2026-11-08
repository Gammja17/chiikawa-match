// 업적과 칭호, 프사: 게임 곳곳의 기록을 쌓고(대부분 Daily.add로 같이 들어옴), 목표를 넘으면 칭호를 얻음
// 고른 칭호는 프로필·지도 이름표·랭킹 이름 옆에 붙음
// Save.data.ach = { n: {기록: 누적}, best: {combo: 한 번에 최고}, got: {업적 id: 1}, title: 고른 업적 id }
const ACHIEVES = [
  { id: 'clear1', title: '새싹 토벌러', text: '모험 지도 첫 스테이지 깨기', n: 1, val: () => clearedCount() },
  { id: 'clear10', title: '풀숲 탐험가', text: '모험 지도 스테이지 10개 깨기', n: 10, val: () => clearedCount() },
  { id: 'clear50', title: '모험 지도 단골', text: '모험 지도 스테이지 50개 깨기', n: 50, val: () => clearedCount() },
  { id: 'clear150', title: '지도의 주인', text: '모험 지도 스테이지 150개 깨기', n: 150, val: () => clearedCount() },
  { id: 'clear300', title: '토벌 대축제의 주인공', text: '모험 지도 스테이지 300개 깨기', n: 300, val: () => clearedCount() },
  { id: 'clear400', title: '노래를 되찾은 영웅', text: '모험 지도 스테이지 400개 깨기', n: 400, val: () => clearedCount() },
  { id: 'bossAll', title: '갑옷 씨도 놀란 토벌대', text: '모든 장의 보스 판 깨기', n: () => bossStages().length, val: () => bossStages().filter(k => routeStars(k) != null).length },
  { id: 'boss10', title: '보스 사냥꾼', text: '보스 10마리 물리치기', n: 10, val: s => s.n.boss || 0 },
  { id: 'boss50', title: '전설의 토벌대', text: '보스 50마리 물리치기', n: 50, val: s => s.n.boss || 0 },
  { id: 'combo20', title: '콤보 장인', text: '5콤보 20번 만들기', n: 20, val: s => s.n.combo5 || 0 },
  { id: 'combo10', title: '연쇄 마법사', text: '한 번에 10콤보', n: 10, val: s => s.best.combo || 0 },
  { id: 'weed300', title: '제초 달인', text: '잡초 300개 뽑기', n: 300, val: s => s.n.weed || 0 },
  { id: 'box200', title: '택배 기사', text: '상자 200개 뜯기', n: 200, val: s => s.n.box || 0 },
  { id: 'bubble200', title: '거품 청소부', text: '거품 200개 터뜨리기', n: 200, val: s => s.n.bubble || 0 },
  { id: 'pop5000', title: '구슬 부수기 왕', text: '구슬 5000개 터뜨리기', n: 5000, val: s => s.n.pop || 0 },
  { id: 'item300', title: '아이템 박사', text: '아이템 300번 터뜨리기', n: 300, val: s => s.n.item || 0 },
  { id: 'skill100', title: '스킬 마스터', text: '친구 스킬 100번 쓰기', n: 100, val: s => s.n.skill || 0 },
  { id: 'stars100', title: '반짝반짝 별 줍기', text: '별 100개 모으기', n: 100, val: () => Achieve.stars() },
  { id: 'stars300', title: '별 수집가', text: '별 300개 모으기', n: 300, val: () => Achieve.stars() },
  { id: 'stars600', title: '별똥별 사냥꾼', text: '별 600개 모으기', n: 600, val: () => Achieve.stars() },
  { id: 'stars1200', title: '밤하늘을 다 가진 아이', text: '모든 스테이지 별 3개 (별 1200개)', n: () => ROUTE.length * 3, val: () => Achieve.stars() },
  { id: 'chap1', title: '꼼꼼쟁이', text: '한 장에서 별 30개 다 모으기', n: 1, val: () => ChapStar.fullCount() },
  { id: 'chap10', title: '별 도장 수집가', text: '별 30개 다 모은 장 10개', n: 10, val: () => ChapStar.fullCount() },
  // 인어섬 편(31~40장) 기믹: 이 업적이 생긴 뒤부터 셈
  { id: 'clam100', title: '진주 줍는 아이', text: '조개에서 진주 100개 꺼내기', n: 100, val: s => s.n.clam || 0 },
  { id: 'sand300', title: '모래사장 청소부', text: '모래 바닥 300칸 걷어내기', n: 300, val: s => s.n.sand || 0 },
  { id: 'ink200', title: '먹물 세탁소', text: '먹물 구슬 200개 씻기', n: 200, val: s => s.n.ink || 0 },
  { id: 'shield30', title: '보호막 깨기 달인', text: '괴물 보호막 30번 깨기', n: 30, val: s => s.n.shield || 0 },
  { id: 'friends10', title: '인기쟁이', text: '친구 10명 모으기', n: 10, val: () => Object.keys(Save.data.own || {}).length },
  { id: 'tower20', title: '인어섬 모험가', text: '인어섬 20층 오르기', n: 20, val: () => Save.data.towerBest || 0 },
  { id: 'ramen30', title: '라멘 단골', text: '라멘 30그릇 먹기', n: 30, val: s => s.n.ramen || 0 },
  // 친구들 말투 칭호
  { id: 'say_clear30', title: '와… 와아…!', text: '모험 지도 스테이지 30개 깨기', n: 30, val: () => clearedCount() },
  { id: 'say_combo50', title: '으럇~!!', text: '5콤보 50번 만들기', n: 50, val: s => s.n.combo5 || 0 },
  { id: 'say_skill300', title: '우라~ 야하~!!', text: '친구 스킬 300번 쓰기', n: 300, val: s => s.n.skill || 0 },
  { id: 'say_friends5', title: '어떻게든 되겠지~', text: '친구 5명 모으기', n: 5, val: () => Object.keys(Save.data.own || {}).length },
  { id: 'say_tower10', title: '하아?', text: '인어섬 10층 오르기', n: 10, val: () => Save.data.towerBest || 0 },
  { id: 'say_ramen10', title: '캬~! 한 그릇 더', text: '라멘 10그릇 먹기', n: 10, val: s => s.n.ramen || 0 },
  { id: 'say_weed1000', title: '풀 뽑기 장인이사!', text: '잡초 1000개 뽑기', n: 1000, val: s => s.n.weed || 0 },
  { id: 'say_ink500', title: '얼굴이 안 보이잖아~!', text: '먹물 구슬 500개 씻기', n: 500, val: s => s.n.ink || 0 },
  { id: 'say_clam500', title: '…진주, 반짝…!', text: '조개에서 진주 500개 꺼내기', n: 500, val: s => s.n.clam || 0 },
  { id: 'say_chap40', title: '이거… 전부 별이야…!?', text: '모든 장에서 별 30개 다 모으기', n: () => CHAPTERS.length, val: () => ChapStar.fullCount() },
  // 하드 모드 (js/hard.js): 보통으로 다 깬 장을 더 어렵게
  // 하드 모드 이야기: 치이카와의 악몽을 랏코의 수련으로 (js/hard-story.js). 10장마다 랏코 수련 도장
  { id: 'hard1', title: '첫 악몽 수련', text: '하드 모드 판 하나 깨기', n: 1, val: () => Hard.cleared() },
  { id: 'hardChap10', title: '수련 도장 첫 번째', text: '하드 모드로 10장 다 깨기', n: 10, val: () => Hard.chapsDone() },
  { id: 'hardChap30', title: '악몽도 무섭지 않아', text: '하드 모드로 30장 다 깨기', n: 30, val: () => Hard.chapsDone() },
  { id: 'hardAll', title: '악몽을 이긴 랏코의 제자', text: '모든 장을 하드 모드로 다 깨기 (졸업장 + 랏코 가면 히어로 옷)', n: () => CHAPTERS.length, val: () => Hard.chapsDone() },
  { id: 'hardStar10', title: '보랏빛 별 수집가', text: '하드 별 30개 다 모은 장 10개', n: 10, val: () => ChapStar.fullCount(true) },
  { id: 'say_hard100', title: '…무리, 아니야…!', text: '하드 모드 판 100개 깨기', n: 100, val: () => Hard.cleared() },
];

// 보스가 나오는 지도 판 번호들 (장마다 끝 판, 1장은 없음)
const bossStages = () => (bossStages.k = bossStages.k || ROUTE.map((_, k) => k).filter(k => ROUTE[k][0] === 'b' && routeStage(k).waves?.some(w => w.boss)));
const achN = a => (typeof a.n === 'function' ? a.n() : a.n); // n이 함수면 판 수에 맞춰 (판이 늘어도 따라감)

const Achieve = {
  s() {
    if (!Save.data.ach) { Save.data.ach = {}; Achieve.quiet = true; } // 처음엔 이미 해 둔 것만큼 조용히 채움 (알림이 쏟아지지 않게)
    const a = Save.data.ach;
    a.n = a.n || {}; a.best = a.best || {}; a.got = a.got || {};
    return a;
  },
  stars: () => [...(Save.data.stars || []), ...(Save.data.life || [])].reduce((t, v) => t + (v || 0), 0),
  // 누적 기록 (Daily.add가 같이 부름)
  add(k, n = 1) {
    if (!n) return;
    const s = Achieve.s();
    s.n[k] = (s.n[k] || 0) + n;
    Achieve.check();
  },
  // 한 번에 낸 최고 기록 (콤보)
  best(k, v) {
    const s = Achieve.s();
    if (v <= (s.best[k] || 0)) return;
    s.best[k] = v;
    Achieve.check();
  },
  // 새로 넘은 목표가 있으면 칭호를 주고 알림 (처음 얻은 칭호는 바로 달아 줌)
  check() {
    const s = Achieve.s();
    let got = false;
    ACHIEVES.forEach(a => {
      if (s.got[a.id] || a.val(s) < achN(a)) return;
      s.got[a.id] = 1;
      got = true;
      if (!s.title) s.title = a.id;
      if (!Achieve.quiet && typeof Daily !== 'undefined') Daily.toast(`업적 달성! 칭호 '${a.title}'`, 'medal');
    });
    Achieve.quiet = false;
    if (got) { Save.save(); if (typeof profileChip === 'function' && $('#map').classList.contains('active')) profileChip(); }
  },
  title() { const a = ACHIEVES.find(x => x.id === Achieve.s().title && Achieve.s().got[x.id]); return a ? a.title : ''; },
  // 프로필 창: 칭호 고르기 + 업적 진행
  html() {
    const s = Achieve.s(), cnt = ACHIEVES.filter(a => s.got[a.id]).length;
    return `<div class="sheet-label">칭호 <small>업적 ${cnt} / ${ACHIEVES.length} · 얻은 칭호를 누르면 랭킹 이름 옆에 붙어요</small></div>
      <div class="ach-list">${ACHIEVES.map(a => {
        const n = achN(a), v = Math.min(n, a.val(s)), got = s.got[a.id], on = s.title === a.id && got;
        return `<button class="ach${got ? ' got' : ''}${on ? ' on' : ''}" data-ach="${a.id}" ${got ? '' : 'disabled'}>
          <b>${a.title}</b><small>${a.text}</small>${got ? `<i>${on ? '다는 중' : '달기'}</i>` : `<span class="mbar"><i style="width:${(v / n) * 100}%"></i></span><em>${v} / ${n}</em>`}</button>`;
      }).join('')}</div>`;
  },
  bind(card, redraw) {
    card.querySelectorAll('.ach.got').forEach(b => (b.onclick = () => {
      const s = Achieve.s();
      s.title = s.title === b.dataset.ach ? null : b.dataset.ach; // 다시 누르면 떼기
      Save.save();
      Sound.play('pop', 1.2, 0.5);
      if (typeof Net !== 'undefined') Net.submit();
      redraw();
    }));
  },
};

// 프사: 기본은 최애 친구 얼굴, 옷을 해금했으면 그 옷 그림으로도 (Save.data.pic = '친구:옷')
const Pic = {
  list() {
    const out = [];
    Object.entries(Save.data.skins || {}).forEach(([cid, ss]) => (ss || []).forEach(sk => SKINS[cid]?.[sk] && out.push(cid + ':' + sk)));
    return out;
  },
  valid(v) { if (!v) return false; const [c, sk] = v.split(':'); return !!SKINS[c]?.[sk] && hasSkin(c, sk); },
  cur() { return Pic.valid(Save.data.pic) ? Save.data.pic : null; },
  src(v = Pic.cur()) { if (!v) return FACE(favId()); const [c, sk] = v.split(':'); return SKIN(c, sk); },
  img(cls = '') { return `<img src="${Pic.src()}" class="${Pic.cur() ? 'pic ' : ''}${cls}" alt="">`; },
  // 랭킹에 올리는 값: 옷 프사면 '친구:옷', 아니면 최애 친구 id
  code() { return Pic.cur() || favId(); },
  html() {
    const cur = Pic.cur(), list = Pic.list();
    return `<div class="sheet-label">프사 <small>${list.length ? '옷을 해금하면 그 옷 그림으로도 할 수 있어요' : '가게에서 옷을 해금하면 그 옷 그림으로도 할 수 있어요'}</small></div>
      <div class="pic-grid"><button class="${cur ? '' : 'on'}" data-pic=""><span class="pf-ava"><img src="${FACE(favId())}" alt=""></span><small>최애 얼굴</small></button>${list.map(v => {
        const [c, sk] = v.split(':');
        return `<button class="${cur === v ? 'on' : ''}" data-pic="${v}"><span class="pf-ava"><img class="pic" src="${SKIN(c, sk)}" alt=""></span><small>${SKINS[c][sk].name}</small></button>`;
      }).join('')}</div>`;
  },
  bind(card, redraw) {
    card.querySelectorAll('[data-pic]').forEach(b => (b.onclick = () => {
      Save.data.pic = b.dataset.pic || null;
      Save.save();
      Sound.play('pop', 1.2, 0.5);
      if (typeof Net !== 'undefined') Net.submit();
      redraw();
    }));
  },
};

// 장 별 보상: 장마다 10판 × 별 3개 = 30개를 다 모으면 한 번 받음. 뒤 장일수록 조금씩 큼
// Save.data.chapGot = { 장 번호(0부터): 1 }. 직접 눌러서 받으니 업데이트 전에 이미 30개인 장도 그냥 '받기'가 뜸 (옛 기록은 따로 옮길 것 없음)
// 하드 모드(js/hard.js)도 장마다 하드 별 30개 보상이 따로 있음 (Save.data.hard.got). h: true면 하드, 안 주면 지금 보는 쪽(ChapStar.H)
// 보이는 곳: 지도의 장 띠(★ 27/30, 다 모으면 선물 띠를 눌러 받기), 미션 창 → 장 별 보상 목록(보통 | HARD 탭), 미션 버튼 빨간 점
const CHAP_TREATS = ['dango', 'parfait', 'onigiri'];
const ChapStar = {
  mode: null, // 목록 창에서 고른 탭 (null이면 지도가 보는 쪽)
  get H() { return ChapStar.mode ?? Hard.on; },
  range: j => [CHAPTERS[j][0], (CHAPTERS[j + 1] || [ROUTE.length])[0]],
  stars(j, h = ChapStar.H) { const [a, b] = ChapStar.range(j), f = h ? Hard.stars : routeStars; let t = 0; for (let k = a; k < b; k++) t += f(k) || 0; return t; },
  max(j) { const [a, b] = ChapStar.range(j); return (b - a) * 3; },
  full: (j, h = ChapStar.H) => ChapStar.stars(j, h) >= ChapStar.max(j),
  got: (j, h = ChapStar.H) => !!(h ? Hard.s().got : Save.data.chapGot)?.[j],
  ready: (j, h = ChapStar.H) => !ChapStar.got(j, h) && ChapStar.full(j, h),
  fullCount: (h = false) => CHAPTERS.filter((_, j) => ChapStar.full(j, h)).length, // 업적은 보통 쪽 (하드는 fullCount(true))
  claimable: h => (h == null ? ChapStar.claimable(false) + ChapStar.claimable(true) : CHAPTERS.filter((_, j) => ChapStar.ready(j, h)).length), // h를 안 주면 둘 다
  open: (j, h = ChapStar.H) => (h ? Hard.open(j) : CHAPTERS[j][0] <= unlockedIdx()),
  // 보상: 코인 100 + 장마다 10, 뽑기 티켓 1장(21장부터 2장), 덤은 장마다 돌아가며 간식(10장마다 +1개) · 이어하기권 · 간식 · 라멘 서비스권
  // 40장 다 받으면 코인 7800, 티켓 60장, 간식 70개, 이어하기권 10장, 라멘 10그릇
  // 하드: 코인 두 배, 티켓 한 장 더 (덤은 같음)
  reward(j, h = ChapStar.H) {
    const t = Math.floor(j / 10), r = { coins: (100 + 10 * j) * (h ? 2 : 1), tickets: (j < 20 ? 1 : 2) + (h ? 1 : 0) };
    const x = j % 4;
    if (x === 0 || x === 2) Object.assign(r, { treat: CHAP_TREATS[Math.floor(j / 2) % 3], n: 2 + t });
    else if (x === 1) r.item = 'cont';
    else r.ramen = 1;
    return r;
  },
  // 보상 한 줄씩: [그림, 글]
  parts: r => [[ITEM('coin'), `${r.coins}`], [ITEM('gift'), `티켓 ${r.tickets}`], r.treat && [ITEM(r.treat), `×${r.n}`],
    r.item && [ITEM('timer'), '이어하기 1'], r.ramen && [ITEM('ramen'), '라멘 1그릇']].filter(Boolean),
  chips: r => ChapStar.parts(r).map(([src, t]) => `<span><img src="${src}" alt="">${t}</span>`).join(''),
  name(j) { const s = CHAPTERS[j][1], i = s.indexOf(' '); return i < 0 ? [s, ''] : [s.slice(0, i), s.slice(i + 1)]; },
  // 받기: 보상을 주고 반짝. el은 반짝일 자리
  claim(j, el, h = ChapStar.H) {
    if (!ChapStar.ready(j, h)) return false;
    if (h) Hard.s().got[j] = 1;
    else (Save.data.chapGot = Save.data.chapGot || {})[j] = 1;
    Daily.give(ChapStar.reward(j, h)); // 저장까지
    Sound.play('star', 1.2, 0.9);
    Haptic.tap(25);
    if (el) {
      const c = centerOf(el);
      burst(c.x, c.y, '#ffd84d', 14);
      floatNum(c.x, c.y - 24, `${ChapStar.name(j)[0]} ${h ? '하드 ' : ''}보상!`, '#ff5d9e');
    }
    Meta.coinUI(true);
    ChapStar.paintBands();
    Daily.badge();
    return true;
  },
  // 지도 장 띠 (game.js openMap이 만든 .chapter-band[data-chap]). 별이 하나도 없는 장은 표를 안 붙임 (처음 화면을 깔끔하게)
  // 지도가 하드 쪽이면 하드 별, 아직 안 열린 장은 자물쇠 표 (누르면 여는 법)
  paint(b) {
    const h = Hard.on, j = +b.dataset.chap, open = ChapStar.open(j, h), s = ChapStar.stars(j, h), m = ChapStar.max(j), got = ChapStar.got(j, h), ready = !got && s >= m;
    b.classList.toggle('ready', ready);
    b.classList.toggle('got', got);
    const pre = h ? '<b class="cb-hm">HARD</b>' : '';
    b.innerHTML = `<span class="cb-name">${CHAPTERS[j][1]}</span>` + (open && s ? `<button class="cb-star">${ready ? `<img src="${ITEM('starchest')}" alt="">보상 받기` : `${pre}★ ${s}/${m}${got ? ' ✓' : ''}`}</button>`
      : h && !open ? '<button class="cb-star cb-lock">🔒 보통 10판 다 깨기</button>' : '');
    // 띠는 판을 가리지 않게 눌리지 않고, 매달린 별 표만 눌림: 받을 게 있으면 보상 창, 아니면 장 별 보상 목록
    const pill = b.querySelector('.cb-star');
    if (pill) pill.onclick = () => {
      Sound.play('click');
      if (!open) Hard.why(CHAPTERS[j][0]);
      else if (ChapStar.ready(j, h)) ChapStar.popup(j, pill, h);
      else ChapStar.list(j, h);
    };
  },
  paintBands: () => document.querySelectorAll('.chapter-band[data-chap]').forEach(ChapStar.paint),
  // 띠를 누르면: 받을 게 있으면 보상 창
  popup(j, b, h = ChapStar.H) {
    const [no, nm] = ChapStar.name(j), r = ChapStar.reward(j, h);
    modal({
      title: `${no} ${h ? '하드 ' : ''}별 30개!`, img: ITEM('starchest'), text: `「${nm}」 ${h ? '하드 모드 ' : ''}별을 다 모았어요! 우사기: 우라~!`,
      rows: ChapStar.parts(r).map(([src, t]) => [`<img class="row-ic" src="${src}" alt="">`, t]),
      btn1: '받기!', on1: () => ChapStar.claim(j, b, h),
    });
    $('#modalChar').classList.add('icon');
  },
  // 장 별 보상 목록 (미션 창에서, 또는 띠를 눌러서). at: 이 장이 보이게 스크롤
  // h: 처음 보일 탭 (안 주면 받을 게 있는 쪽, 둘 다 없으면 지도가 보는 쪽)
  list(at = -1, h) {
    const el = $('#chapStar');
    ChapStar.mode = h ?? (ChapStar.claimable(false) ? false : ChapStar.claimable(true) ? true : Hard.on);
    const draw = () => {
      const hm = ChapStar.mode, cur = unlockedIdx();
      const many = ChapStar.claimable(hm), other = ChapStar.claimable(!hm);
      el.classList.toggle('hard-view', hm);
      // 보통 | HARD 탭 (하드 장이 하나라도 열렸을 때만). 다른 탭에 받을 게 있으면 빨간 점
      const dot = on => (on ? ' <i></i>' : '');
      const tabs = Hard.any() ? `<div class="cs-tabs"><button data-tab="0" class="${hm ? '' : 'on'}">보통${dot(hm && other)}</button><button data-tab="1" class="${hm ? 'on' : ''}">HARD${dot(!hm && other)}</button></div>` : '';
      el.querySelector('.cs-sub').innerHTML = tabs + `${hm ? '하드 ' : ''}별 30개를 다 모은 장 <b>${ChapStar.fullCount(hm)}</b> / ${CHAPTERS.length} · 장마다 한 번 받아요` +
        (many > 1 ? `<button class="mini-btn ready" data-all>모두 받기 ${many}</button>` : '');
      el.querySelector('.cs-list').innerHTML = CHAPTERS.map(([a], j) => {
        const [no, nm] = ChapStar.name(j), s = ChapStar.stars(j, hm), m = ChapStar.max(j), got = ChapStar.got(j, hm), ready = !got && s >= m, lock = hm ? !Hard.open(j) : a > cur;
        return `<div class="mis cs-row${got ? ' done' : ready ? ' full' : ''}${lock ? ' locked' : ''}" data-j="${j}"><b class="cs-no">${ready ? `<img src="${ITEM('starchest')}" alt="">` : ''}${no}</b><div class="mtx"><b>${lock && a > cur ? '???' : nm}<small>★ ${s}/${m}</small></b>
          <span class="mbar"><i style="width:${(s / m) * 100}%"></i></span><span class="cs-rw">${ChapStar.chips(ChapStar.reward(j, hm))}</span></div>
          <button class="mini-btn" data-c="${j}" ${ready ? '' : 'disabled'}>${got ? '받음' : ready ? '받기' : lock && hm ? '🔒' : `<img src="${ITEM('star')}" alt="">${m - s}`}</button></div>`;
      }).join('');
      el.querySelectorAll('[data-tab]').forEach(b => (b.onclick = () => { Sound.play('click'); ChapStar.mode = b.dataset.tab === '1'; draw(); el.querySelector('.cs-list').scrollTop = 0; }));
      el.querySelectorAll('[data-c]').forEach(b => (b.onclick = () => { if (ChapStar.claim(+b.dataset.c, b, hm)) draw(); }));
      // 모두 받기: 받을 수 있는 장을 한꺼번에 (보상은 장마다 따로 들어감)
      el.querySelector('[data-all]')?.addEventListener('click', e => {
        const b = e.currentTarget, sum = { coins: 0, tickets: 0 };
        CHAPTERS.forEach((_, j) => { if (!ChapStar.ready(j, hm)) return; const r = ChapStar.reward(j, hm); sum.coins += r.coins; sum.tickets += r.tickets; ChapStar.claim(j, null, hm); });
        const c = centerOf(b);
        burst(c.x, c.y, '#ffd84d', 18);
        floatNum(c.x, c.y - 24, `+${sum.coins} · 티켓 +${sum.tickets}`, '#ff5d9e');
        draw();
      });
    };
    draw();
    el.querySelector('[data-close]').onclick = () => { Sound.play('click'); el.classList.remove('show'); ChapStar.mode = null; };
    el.classList.add('show');
    el.querySelector('.modal-card').animate([{ transform: 'translateY(30px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 220, easing: 'ease-out' });
    const box = el.querySelector('.cs-list'), row = box.querySelector(`[data-j="${at >= 0 ? at : Math.max(0, CHAPTERS.findIndex((_, j) => ChapStar.ready(j)))}"]`);
    box.scrollTop = row ? row.offsetTop - 6 : 0;
  },
  // 이번에 켠 뒤로 새로 30개가 된 장은 알림 한 번 (지도를 열 때). 보통·하드 따로
  seen: null,
  notify() {
    const now = [false, true].map(h => CHAPTERS.map((_, j) => ChapStar.full(j, h)));
    [false, true].forEach((h, n) => {
      const fresh = ChapStar.seen ? now[n].map((f, j) => (f && !ChapStar.seen[n][j] && !ChapStar.got(j, h) ? j : -1)).filter(j => j >= 0) : [];
      if (fresh.length) Daily.toast(`${fresh.length > 1 ? `장 ${fresh.length}개` : ChapStar.name(fresh[0])[0]} ${h ? '하드 ' : ''}별 30개! 장 띠의 선물을 눌러 받기`, 'starchest');
    });
    ChapStar.seen = now;
  },
};
