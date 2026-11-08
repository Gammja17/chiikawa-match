// 하드 모드: 보통으로 10판을 다 깬 장을 더 어렵게 다시 하기. 판 그림·이야기는 그대로, 값만 js/hard-data.js(봇으로 잰 표)로 덮어 씀
//   일상 퍼즐: 이동 수(시험 판은 시간)를 줄이고 장애물을 질긴 것으로 (잡초 → 큰 잡초, 상자 → 선물 상자, 없으면 상자 몇 개 더), 모으기 목표 +15%
//   토벌: 괴물 체력·공격력을 올리고 공격 간격을 1 줄임
// 장 안에서는 하드 판이 차례로 열림 (첫 판은 바로, 다음 판은 앞 판을 하드로 깨면)
// 이야기 「치이카와의 악몽 × 랏코의 수련」은 js/hard-story.js: 처음 한 번 프롤로그, 장 첫 판에 잠드는 대사, 장을 다 깨면 깨어나는 대사,
//   10장마다 랏코 수련 도장, 모든 장을 깨면 엔딩. 꿈 대사는 대사 창에 보랏빛 꿈 효과(#story.dream, css/hard.css)
// Save.data.hard = { l: [LIFE 번호별 별], b: [STAGES 번호별 별], got: { 장 번호: 1 } 하드 장 별 보상, view: 지도가 하드 쪽인지,
//   prize: 모든 장 하드 보상을 받았는지, ending: 엔딩을 봤는지, prologue: 프롤로그를 봤는지, seen/told: 안내 창·알림을 봤는지 }
// 지도: 오른쪽 위 「보통 | HARD」 스위치(하드 장이 하나라도 열리면 보임). 하드 쪽이면 지도에 보라 물이 들고, 장 띠의 별 표가 하드 별로 바뀜
const HARD_LINES = {
  chiikawa: '(쿨쿨…) …!! (또 그 꿈이다. 예전보다 훨씬 무섭다…)',
  hachiware: '여기 꿈속이라는 거야…? 그래도 어떻게든 되겠지~',
  usagi: '하아?! …우라~!! 야하~!!',
  momonga: '꿈속이면 내가 제일 세다는 거지? 따라와!',
  rakko: '…꿈이라도 봐주지 않아. 가자!',
  shisa: '꿈속에서도… 힘내 볼게요…!',
  kurimanju: '(꿈속에서도 프하~) …한 판 더.',
  kani: '(꿈속에서 집게를 딸깍딸깍, 각오한 얼굴)',
};
// 하드 이야기 표에 없는 장은 그 판 응원 친구 한 줄 (꿈에 들어가는 말)
// 모든 장을 하드로 깨면: 엔딩(HARD_ENDING) + 랏코 「가면 히어로」 옷 (이미 있으면 코인 600) + 칭호 「악몽을 이긴 랏코의 제자」
const HARD_PRIZE = { cid: 'rakko', skin: 'mask', coins: 600 };

const Hard = {
  play: false, // 지금 하는 판이 하드인지 (지도에서 판을 누를 때 정해짐, 지도로 돌아오면 풀림)
  s() {
    const h = (Save.data.hard = Save.data.hard || {});
    h.l = h.l || []; h.b = h.b || []; h.got = h.got || {};
    return h;
  },
  // 지도가 하드 쪽인지 (열린 하드 장이 없으면 늘 보통)
  get on() { return !!Hard.s().view && Hard.any(); },
  set on(v) { Hard.s().view = !!v; Save.save(); },
  chapOf: k => { let j = 0; while (j + 1 < CHAPTERS.length && CHAPTERS[j + 1][0] <= k) j++; return j; },
  stars: k => (ROUTE[k][0] === 'b' ? Hard.s().b : Hard.s().l)[ROUTE[k][1]],
  // 장 j의 하드: 그 장 보통 판을 다 깨면 열림
  open(j) { const [a, b] = ChapStar.range(j); for (let k = a; k < b; k++) if (routeStars(k) == null) return false; return true; },
  any: () => CHAPTERS.some((_, j) => Hard.open(j)),
  openCount: () => CHAPTERS.filter((_, j) => Hard.open(j)).length,
  stageOpen(k) { const j = Hard.chapOf(k); return Hard.open(j) && (k === CHAPTERS[j][0] || Hard.stars(k - 1) != null); },
  // 지도에서 친구들이 서 있을 자리: 아직 안 깬 열린 하드 판 중 맨 앞 (다 깼으면 열린 마지막 판)
  cur() {
    let last = 0;
    for (let k = 0; k < ROUTE.length; k++) { if (!Hard.stageOpen(k)) continue; if (Hard.stars(k) == null) return k; last = k; }
    return last;
  },
  cleared: () => ROUTE.filter((_, k) => Hard.stars(k) != null).length,
  chapDone(j) { const [a, b] = ChapStar.range(j); for (let k = a; k < b; k++) if (Hard.stars(k) == null) return false; return true; },
  chapsDone: () => CHAPTERS.filter((_, j) => Hard.chapDone(j)).length,
  allStars: () => [...Hard.s().l, ...Hard.s().b].reduce((t, v) => t + (v || 0), 0),

  // 하드 판 만들기 (보통 판을 복사해서 하드 값으로 덮음)
  life(i) {
    const st = JSON.parse(JSON.stringify(LIFE[i])), h = HARD_DATA.l[i];
    if (h) Object.assign(st, JSON.parse(JSON.stringify(h)));
    st.hard = true;
    return st;
  },
  battle(i) {
    const st = STAGES[i], h = HARD_DATA.b[i];
    return { ...st, hard: true, waves: st.waves.map((w, n) => ({ ...w, ...(h?.waves[n] || {}) })) };
  },
  go(k) {
    Hard.play = true;
    return ROUTE[k][0] === 'b' ? openFormation(ROUTE[k][1]) : Life.start(ROUTE[k][1]);
  },
  // 꿈 대사: 대사 창에 보랏빛 꿈 효과를 씌우고 보여 줌
  async dream(lines) {
    if (!lines?.length) return;
    const el = $('#story');
    el.classList.add('dream');
    try { await playStory(lines); } finally { el.classList.remove('dream'); }
  },
  // 장 첫 판을 처음 할 때: (맨 처음이면 프롤로그 +) 잠들어 꿈으로. 이야기 표에 없는 장은 그 판 응원 친구 한 줄 (토벌은 우사기)
  async intro(k, host) {
    const j = Hard.chapOf(k), s = Hard.s();
    if (k !== CHAPTERS[j][0] || Hard.stars(k) != null) return;
    const id = HARD_LINES[host] ? host : ROUTE[k][0] === 'b' ? 'usagi' : 'hachiware';
    const lines = [...(s.prologue ? [] : HARD_PROLOGUE), ...(HARD_STORY[j]?.start || [[id, HARD_LINES[id]]])];
    if (!s.prologue) { s.prologue = 1; Save.save(); }
    await Hard.dream(lines);
  },
  // 판을 깬 뒤 (결과 창 전): 이번에 장을 다 깼으면 깨어나는 대사, 10장마다 수련 도장, 모든 장이면 엔딩과 보상
  done: -1,
  async after(k) {
    const j = Hard.chapOf(k);
    if (Hard.done !== j) return;
    Hard.done = -1;
    await Hard.dream(HARD_STORY[j]?.end);
    const n = Hard.chapsDone();
    if (n % 10 === 0 && HARD_STAMP[n / 10]) {
      await Hard.dream(HARD_STAMP[n / 10]);
      Daily.toast(`랏코의 수련 도장 ${n / 10}개째!`, 'medal');
    }
    // 마지막 장: 엔딩은 바로, 졸업 선물 창은 결과 창에 덮이지 않게 지도로 돌아갔을 때 (openMap → Hard.prize)
    if (n >= CHAPTERS.length && !Hard.s().ending) { Hard.s().ending = 1; Save.save(); await Hard.dream(HARD_ENDING); }
  },
  // 깼을 때: 기록하고 처음 깬 건지 돌려줌. 장을 다 깼으면 알림, 모든 장을 다 깼으면 보상
  win(t, i, stars) {
    const list = t === 'b' ? Hard.s().b : Hard.s().l;
    const first = list[i] == null;
    list[i] = Math.max(list[i] || 0, stars);
    const k = routeIdx(t, i), j = Hard.chapOf(k);
    if (first && Hard.chapDone(j)) { Hard.done = j; setTimeout(() => Daily.toast(`${ChapStar.name(j)[0]} 하드 모드 정복!`, 'medal'), 400); } // 결과 창 전에 Hard.after가 장 끝 대사
    Save.save();
    Achieve.check();
    return first;
  },
  // 코인: 하드는 보통 판 보상의 1.5배 (Meta.reward가 준 만큼의 절반을 더 줌). 결과 창에 보일 합계를 돌려줌
  coins(n, hard) {
    if (!hard) return n;
    const x = Math.round(n / 2);
    Meta.addCoins(x);
    return n + x;
  },
  // 다음 하드 판 (같은 장이면 다음 판, 장 끝이면 다음 하드 장 첫 판이 열려 있을 때만)
  next(k) { return k + 1 < ROUTE.length && Hard.stageOpen(k + 1) ? k + 1 : -1; },
  // 모든 장 하드 보상: 지도를 열 때 (엔딩은 마지막 판을 깬 뒤 Hard.after에서 봄. 못 봤으면 여기서)
  async prize() {
    const s = Hard.s();
    if (s.prize || Hard.chapsDone() < CHAPTERS.length) return;
    s.prize = 1;
    const story = !s.ending;
    s.ending = 1;
    Save.save();
    if (story) await Hard.dream(HARD_ENDING);
    const { cid, skin, coins } = HARD_PRIZE, sk = SKINS[cid]?.[skin];
    const have = !sk || hasSkin(cid, skin);
    if (have) Meta.addCoins(coins);
    else (Save.data.skins[cid] = Save.data.skins[cid] || []).push(skin);
    Save.save();
    Meta.coinUI(true);
    modal({
      title: '수련 졸업!', img: sk ? SKIN(cid, skin) : ITEM('medal'),
      text: `랏코: "…졸업 선물이야. 이제 꿈도 무섭지 않지?"`,
      rows: [have ? [`<img class="row-ic" src="${ITEM('coin')}">`, `+${coins}`] : ['새 옷', `${CHARS[charIdx(cid)].name} ${sk.name}`], ['칭호', '악몽을 이긴 랏코의 제자']],
      btn1: '고마워!', on1: () => {},
    });
    confetti(24);
  },

  // ---------- 지도 ----------
  // 오른쪽 위 스위치: 하드 장이 하나라도 열리면 보임
  toggleUi() {
    let el = $('#hardToggle');
    if (!el) {
      el = document.createElement('button');
      el.id = 'hardToggle';
      el.setAttribute('aria-label', '보통 / 하드 모드');
      el.innerHTML = '<span class="ht-n">보통</span><span class="ht-h">HARD</span>';
      $('#map').appendChild(el);
      el.onclick = () => {
        Sound.play(Hard.on ? 'click' : 'open');
        Hard.on = !Hard.on;
        mapPage = null; // 그쪽 지금 판이 있는 지역으로
        openMap(null, true);
        if (Hard.on && !Hard.s().seen) { Hard.s().seen = 1; Save.save(); Hard.help(); }
      };
    }
    const any = Hard.any();
    el.style.display = any ? '' : 'none';
    el.classList.toggle('on', Hard.on);
    $('#map').classList.toggle('hard-view', Hard.on);
    // 처음 열린 날 한 번 알림
    if (any && !Hard.s().told) { Hard.s().told = 1; Save.save(); setTimeout(() => Daily.toast('하드 모드가 열렸어요! 지도 오른쪽 위 HARD', 'medal'), 1200); }
  },
  help() {
    modal({
      title: '하드 모드', img: ITEM('medal'),
      text: '치이카와가 밤마다 지나온 모험을 더 무섭게 꿔요. 랏코: "그럼 꿈속에서도 이겨. 수련이야." 보통으로 10판을 다 깬 장을 더 어렵게 다시 해요. 이동이 줄고 장애물이 질겨지고, 괴물은 더 세고 더 자주 때려요.',
      rows: [['별·기록', '보통과 따로'], ['토벌', '친구 Lv10 기준'], ['장 별 30개', '하드 장 보상'], ['모든 장 정복', '졸업장 + 랏코 가면 히어로 옷']],
      btn1: '해 볼래!', on1: () => {},
    });
  },
  // 지도 판 하나: 잠김·별을 하드 기록으로
  locked: k => !Hard.stageOpen(k),
  // 잠긴 하드 판을 누르면 왜 잠겼는지
  why(k) {
    const j = Hard.chapOf(k);
    Daily.toast(Hard.open(j) ? '앞 판을 하드로 먼저 깨요' : `${ChapStar.name(j)[0]}을 보통으로 다 깨면 열려요`, 'medal');
  },
};
