// 주간 리그: 일주일 동안 모두 같은 판으로 점수 겨루기 (애니팡 주간 랭킹처럼)
// - 매주 월요일 0시(한국 시간)에 새 판. 판 모양도, 처음 깔리는 블록도, 떨어지는 블록도 그 주 씨앗으로 정해짐
//   → 같은 자리에서 같은 수를 두면 누구나 같은 블록이 떨어짐. 시작 아이템·라멘은 못 씀 (데려갈 친구는 고름)
// - 하루 5판. 한 주 최고 점수가 순위. 판 중에는 위 순위 친구 점수가 보이고, 넘기면 '추월!'
// - 다음 주 처음 도전 화면을 열면 지난주 순위로 코인 보상
// - Firestore: league/{그 주 월요일}/scores/{uid} = { name, score, title, fav, updated }
// Save.data.league = { week, best, day, n }
const LEAGUE_DAILY = 5;
const LEAGUE_MOVES = 20;
// 지난주 순위 보상 [이 순위까지, 코인]. 순위 밖(또는 로그인 안 함)이어도 한 판이라도 했으면 참가 보상
const LEAGUE_PRIZE = [[1, 1000], [3, 700], [10, 500], [30, 300], [100, 200]];
const LEAGUE_JOIN = 100;

// 주마다 돌아가는 판. 장애물은 깰 때 점수가 더 붙음. stars는 점수 막대 눈금 (자동 플레이 봇 점수 25·60·90%)
const WEEK_TWISTS = [
  { name: '잡초 정원', icon: 'weed2', host: 'usagi', stars: [14000, 18000, 25000],
    make: rnd => scatter(rnd, FULL(8, 8), [['W', 6, 3, 7], ['w', 10, 2, 7]]) },
  { name: '선물 상자 더미', icon: 'gift', host: 'momonga', stars: [13500, 19000, 24000],
    make: rnd => scatter(rnd, FULL(8, 8), [['g', 8, 2, 7], ['b', 10, 1, 7]]) },
  { name: '거품 목욕탕', icon: 'bubble', host: 'hachiware', stars: [19500, 30000, 38000],
    make: rnd => scatter(rnd, ['#.......#', ...FULL(7, 9), '#.......#'], [['o', 16, 1, 8]]) },
  { name: '리본 꽁꽁', icon: 'ribbon', host: 'chiikawa', stars: [12000, 18500, 27500],
    make: rnd => scatter(rnd, FULL(8, 8), [['l', 18, 0, 7], ['w', 6, 4, 7]]) },
  { name: '시럽 팬케이크', icon: 'pancake', host: 'chiikawa', stars: [16500, 20000, 26000],
    make: rnd => scatter(rnd, ['#......#', ...FULL(6, 8), '#......#'], [['s', 2, 3, 4], ['b', 6, 1, 6]]) },
  { name: '다 같이 섞어', icon: 'medal', host: 'rakko', stars: [11000, 18000, 27000],
    make: rnd => scatter(rnd, FULL(8, 8), [['w', 6, 4, 7], ['b', 6, 2, 7], ['o', 6, 0, 5], ['l', 6, 0, 7]]) },
];

const League = {
  // 그 주 월요일 (한국 날짜 'YYYY-MM-DD')
  week(t = Date.now()) {
    const d = new Date(t + 9 * 3600e3);
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    return d.toISOString().slice(0, 10);
  },
  endsAt: (w = League.week()) => Date.parse(`${w}T00:00:00+09:00`) + 7 * 864e5,
  left() {
    const ms = League.endsAt() - Date.now(), h = Math.floor(ms / 3600e3);
    return h >= 24 ? `${Math.floor(h / 24)}일 ${h % 24}시간` : h >= 1 ? `${h}시간 ${Math.floor((ms % 3600e3) / 60e3)}분` : `${Math.max(1, Math.ceil(ms / 60e3))}분`;
  },
  // 글자로 정해지는 난수 (mulberry32). 판이 골고루 섞이게 modes.js의 seeded보다 고른 걸 씀
  rand(text) {
    let s = [...text].reduce((a, ch) => Math.imul(a ^ ch.charCodeAt(0), 2654435761), 1779033703) >>> 0;
    return () => {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  },
  stage(w = League.week()) {
    const n = Math.round(Date.parse(w) / (7 * 864e5));
    const tw = WEEK_TWISTS[((n % WEEK_TWISTS.length) + WEEK_TWISTS.length) % WEEK_TWISTS.length];
    const { make, ...st } = tw;
    return { ...JSON.parse(JSON.stringify(st)), types: 5, moves: LEAGUE_MOVES, goals: [], league: true, seed: `league:${w}`, twist: tw.name, name: '주간 리그', intro: `${LEAGUE_MOVES}번! 최고 점수!`, map: make(League.rand(`map:${w}`)) };
  },
  // 이번 주 내 기록 (주가 바뀌었으면 claim이 정리할 때까지 지난주 것을 그대로 둠)
  data() { return (Save.data.league = Save.data.league || { week: League.week(), best: 0, day: '', n: 0 }); },
  playsLeft() { const d = League.data(); return d.week !== League.week() ? LEAGUE_DAILY : LEAGUE_DAILY - (d.day === today() ? d.n : 0); },
  ref: (w = League.week()) => Net.db.collection('league').doc(w).collection('scores'),
  // 50위까지 (maxAge 안에 불러온 게 있으면 다시 씀)
  cache: {},
  async top(w = League.week(), maxAge = 0) {
    const c = League.cache[w];
    if (c && Date.now() - c.at < maxAge) return c.rows;
    const q = await League.ref(w).orderBy('score', 'desc').limit(w === League.week() ? 50 : 100).get();
    const rows = q.docs.map(d => ({ id: d.id, ...d.data() }));
    League.cache[w] = { at: Date.now(), rows };
    return rows;
  },
  can: () => Net.on && !!Net.user,

  // ---------- 도전 화면 카드와 리그 창 ----------
  card() {
    const st = League.stage(), d = League.data(), n = League.playsLeft();
    $('#lgTwist').textContent = `이번 주: ${st.twist} · ${League.left()} 남음`;
    $('#lgState').textContent = d.week === League.week() && d.best ? `내 최고 ${d.best}점 · 오늘 ${n}/${LEAGUE_DAILY}번` : `오늘 ${n}/${LEAGUE_DAILY}번`;
    $('#btnLeague').classList.toggle('done', n <= 0);
    League.claim();
  },
  async open() {
    const d = League.data(), st = League.stage(), n = League.playsLeft();
    const card = $('#charSheet .sheet-card');
    card.style.setProperty('--ring', '#ffb43f');
    const mine = d.week === League.week() ? d.best : 0;
    card.innerHTML = `<div class="mates-title">주간 리그</div>
      <div class="lg-head"><b>${st.twist}</b><small>${LEAGUE_MOVES}번 움직여서 최고 점수 · ${League.left()} 남음</small></div>
      <div class="lg-me" id="lgMe">내 최고 <b>${mine}</b>점</div>
      <ol class="lg-list" id="lgList"><li class="rank-note">불러오는 중…</li></ol>
      <div class="lg-prize">지난주 순위 보상 · 1위 ${LEAGUE_PRIZE[0][1]} · 2~3위 ${LEAGUE_PRIZE[1][1]} · 10위까지 ${LEAGUE_PRIZE[2][1]} · 참가 ${LEAGUE_JOIN} 코인</div>
      <div class="sheet-btns"><button class="big-btn ghost" data-back>닫기</button><button class="big-btn" data-go${n > 0 ? '' : ' disabled'}>${n > 0 ? `도전! (${n}/${LEAGUE_DAILY})` : '내일 또!'}</button></div>`;
    card.querySelector('[data-back]').onclick = () => { Sound.play('click'); $('#charSheet').classList.remove('show'); };
    card.querySelector('[data-go]').onclick = () => {
      if (League.playsLeft() <= 0) return;
      Sound.play('open');
      $('#charSheet').classList.remove('show');
      go(League.start);
    };
    $('#charSheet').classList.add('show');
    fitText($('#charSheet'));
    const list = $('#lgList');
    if (!Net.on) { list.innerHTML = '<li class="rank-note">랭킹 서버가 꺼져 있어요. 혼자 연습할 수 있어요</li>'; return; }
    if (!Net.user) {
      list.innerHTML = '<li class="rank-note">로그인하면 순위에 올라가요<br><button class="big-btn ghost" id="lgGuest">게스트로 참가</button></li>';
      $('#lgGuest').onclick = async () => { Sound.play('click'); try { await Net.guest(); } catch {} League.open(); };
      return;
    }
    try {
      const rows = await League.top(League.week(), 60 * 1000);
      if (!list.isConnected) return;
      const k = rows.findIndex(r => r.id === Net.user.uid);
      if (k >= 0) $('#lgMe').innerHTML = `내 최고 <b>${rows[k].score}</b>점 · <b>${k + 1}위</b>`;
      else if (mine) $('#lgMe').innerHTML = `내 최고 <b>${mine}</b>점 · 50위 밖`;
      list.innerHTML = rows.map((r, j) => `<li class="${r.id === Net.user.uid ? 'mine' : ''}"><span class="rk${j < 3 ? ' top' + (j + 1) : ''}">${j + 1}</span><span class="nm">${rankFace(r.fav)}<span class="rk-nm">${esc(r.name)}</span></span><b>${r.score}</b></li>`).join('') ||
        '<li class="rank-note">아직 아무도 없어요. 이번 주 첫 번째가 되어 보세요!</li>';
    } catch { list.innerHTML = '<li class="rank-note">순위를 불러오지 못했어요</li>'; }
  },

  // ---------- 한 판 ----------
  async start() {
    return Life.begin(League.stage(), { kind: 'league' });
  },
  // 친구를 고르고 판이 깔린 뒤 (여기서 하루 횟수를 씀: 중간에 나가도 한 번)
  began() {
    const d = League.data(), w = League.week();
    if (d.week !== w) Object.assign(d, { week: w, best: 0, day: '', n: 0 });
    if (d.day !== today()) Object.assign(d, { day: today(), n: 0 });
    d.n++;
    Save.save();
    League.rivals = null;
    League.passed = new Set();
    League.lastPass = 0;
    if (League.can()) League.top(w, 60 * 1000).then(rows => { if (L.st?.league) League.rivals = rows.filter(r => r.id !== Net.user?.uid && r.score > 0); }).catch(() => {});
  },
  // 목표 칸 자리: 바로 위 순위 친구 점수 (없으면 1위 왕관, 불러오지 못했으면 내 최고)
  chip(score) {
    const above = (League.rivals || []).filter(r => r.score > score).pop();
    if (above) return `<div class="gchip rival">${rankFace(above.fav) || `<img src="${ITEM('medal')}">`}<b>${above.score}</b></div>`;
    if (League.rivals?.length) return `<div class="gchip rival top"><img src="${ITEM('medal')}"><b>1위!</b></div>`;
    return `<div class="gchip best"><img src="${ITEM('medal')}"><b>${League.data().best || 0}</b></div>`;
  },
  // 점수가 오를 때: 위 순위 친구를 넘기면 '추월!' (처음 몇 수에 줄줄이 뜨지 않게 내 최고 근처나 20위 안만, 1.2초에 한 번)
  watch(score) {
    const rows = League.rivals;
    if (!rows) return;
    const best = League.data().best || 0;
    const now = rows.filter((r, j) => r.score <= score && !League.passed.has(r.id) && (j < 20 || r.score >= best * 0.8));
    if (!now.length) return;
    now.forEach(r => League.passed.add(r.id));
    if (performance.now() - League.lastPass < 1200) return;
    League.lastPass = performance.now();
    Sound.play('star', 1.3, 0.8);
    banner(now.length > 1 ? `${now.length}명 추월!` : `${esc(now[0].name)} 추월!`, 380);
  },
  async end() {
    B.over = true;
    B.busy = true;
    clearSel();
    Sound.music(null);
    Sound.play('jingle_win', 1, 0.9);
    await banner('리그 끝!!', 700);
    boardRand = Math.random;
    const d = League.data(), isBest = L.score > d.best;
    d.best = Math.max(d.best, L.score);
    const coins = Math.floor(L.score / 500);
    Meta.addCoins(coins);
    Save.save();
    Stats.send('post_score', { score: L.score, level_name: `league_${d.week}`, character: CHARS[L.helper]?.id });
    if (isBest) confetti(20);
    const n = League.playsLeft(), ch = CHARS[L.helper];
    modal({
      title: isBest ? '이번 주 최고 기록!' : '리그 끝!', char: ch.id, text: `${ch.name}: "${lineOf(ch.id)}"`,
      rows: [['점수', L.score], ['이번 주 최고', d.best], [`<img class="row-ic" src="${ITEM('coin')}">`, '+' + coins]],
      btn2: '순위 보기', on2: () => go(() => { openChallenge(); League.open(); }),
      btn1: n > 0 ? `다시 도전 (${n}번 남음)` : '나가기', on1: () => go(n > 0 ? League.start : openChallenge),
    });
    Net.rankLine(League.submit());
  },
  // 이번 주 최고를 올리고 내 순위 글자를 돌려줌 (서버 값이 더 크면 그대로 둠)
  async submit() {
    if (!League.can()) return Net.on ? '<span>로그인하면 리그 순위에 올라가요</span>' : null;
    const d = League.data(), w = d.week;
    try {
      const ref = League.ref(w).doc(Net.user.uid);
      const old = (await ref.get()).data();
      const mine = { name: Net.name(), score: Math.max(old?.score || 0, d.best), title: Achieve.title(), fav: Pic.code() };
      if (!old || mine.score > old.score || old.name !== mine.name || old.fav !== mine.fav || old.title !== mine.title)
        await ref.set({ ...mine, updated: firebase.firestore.FieldValue.serverTimestamp() });
      const rows = await League.top(w);
      const k = rows.findIndex(r => r.id === Net.user.uid);
      if (k < 0) return `<span>이번 주 50위까지 ${rows[rows.length - 1].score - mine.score}점</span>`;
      return `<span>이번 주 <b>${k + 1}위</b>${k > 0 ? `<small>${esc(rows[k - 1].name)}까지 ${rows[k - 1].score - mine.score}점</small>` : ' 👑'}</span>`;
    } catch (e) { console.warn('리그 기록을 못 올렸어요', e); return null; }
  },

  // ---------- 지난주 보상 ----------
  async claim() {
    const d = League.data(), w = League.week();
    if (d.week === w || (Net.on && !Net.ready)) return; // 로그인 확인 전이면 기다림 (순위를 봐야 해서)
    const last = d.week, best = d.best;
    Object.assign(d, { week: w, best: 0, day: '', n: 0 }); // 먼저 이번 주로 넘겨 둠 (보상은 한 번만)
    Save.save();
    if (!best) return;
    let rank = null;
    if (League.can()) {
      try { const rows = await League.top(last); const k = rows.findIndex(r => r.id === Net.user.uid); if (k >= 0) rank = k + 1; } catch {}
    }
    const coins = rank ? (LEAGUE_PRIZE.find(([to]) => rank <= to)?.[1] || LEAGUE_JOIN) : LEAGUE_JOIN;
    Meta.addCoins(coins);
    Save.save();
    if (rank && rank <= 3) confetti(20);
    modal({
      title: '지난주 리그 결과', char: rank && rank <= 10 ? 'usagi' : 'hachiware',
      text: rank ? (rank <= 3 ? `${rank}위! 대단하다는 거야~!!` : `${rank}위! 이번 주도 같이 해 보자~`) : '참가해 줘서 고마워! 이번 주엔 순위에 올라가 보자~',
      rows: [['최고 점수', best], ['순위', rank ? `${rank}위` : '-'], [`<img class="row-ic" src="${ITEM('coin')}">`, '+' + coins]],
      btn1: '좋아!', on1: () => {},
    });
  },
};
const esc = s => String(s || '???').replace(/[<>&"']/g, '');
$('#btnLeague').onclick = () => { Sound.play('click'); League.open(); };
Net.onChange(() => { if ($('#challenge').classList.contains('active')) League.claim(); });
