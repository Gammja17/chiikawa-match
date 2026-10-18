// 일상 퍼즐: 풀 뽑기, 요리, 거품 청소, 상자 뜯기, 제초 검정. 괴물 없이 목표를 채우는 스테이지
// 판 글자: # 판 밖(구멍)  . 구슬  w 잡초  W 큰 잡초(두 번)  b 상자  g 선물 상자(두 번)
//          o 거품(번짐)  i 재료  l 리본 구슬  s 처음부터 시럽 칸
// 잡초, 상자, 거품은 칸을 차지하는 장애물: 바로 옆에서 매치하거나 아이템으로 맞히면 깨짐
const LIFE_CHARS = ['chiikawa', 'hachiware', 'usagi', 'momonga', 'kurimanju', 'rakko'];

// goals: lock 리본 다 풀기, syrup 시럽을 판 전체에 바르기, weed 잡초 다 뽑기, box 상자 다 뜯기, bubble 거품 다 터뜨리기, ing 재료 n개 바닥까지, char 그 캐릭터 n개, score 점수
// moves 이동 수 또는 time 초(제한 시간), stars 별 점수 [1, 2, 3], host 화면 옆 응원 캐릭터
const LIFE = [
  // 1장: 하나씩 배우기 (4색으로 쉽게)
  { name: '풀 뽑기 첫날', icon: 'weed1', types: 4, moves: 20, host: 'chiikawa', intro: '잡초 옆에서 터뜨리기!',
    goals: [{ k: 'weed' }], stars: [2500, 4500, 6500],
    map: ['.......', '.......', '.......', '.......', '.......', '.w...w.', 'ww...ww'] },
  { name: '비행기 연습', icon: 'plane', types: 4, moves: 18, host: 'hachiware', intro: '네모로 모으면 비행기!',
    goals: [{ k: 'weed' }], stars: [3000, 5000, 7000],
    map: ['w.....w', 'ww...ww', '.......', '.......', '.......', '.......', '.......'] },
  { name: '라멘 재료 나르기', done: '배달<br>완료!', icon: 'ramen', types: 5, moves: 22, host: 'shisa', intro: '재료를 맨 아래로!',
    goals: [{ k: 'ing' }], stars: [4000, 6500, 9000], ing: { n: 2, max: 2, kinds: ['naruto', 'egg'] },
    map: ['..i.i..', '.......', '.......', '.......', '#.....#', '##...##', '###.###'] },
  { name: '택배 상자 뜯기', icon: 'box', types: 5, moves: 20, host: 'momonga', intro: '상자를 모두 뜯자!',
    goals: [{ k: 'box' }], stars: [4000, 6500, 9000],
    map: ['#.....#', '.......', '.b...b.', 'bb...bb', '.......', '..bbb..', '#.....#'] },
  { name: '목욕탕 거품 청소', icon: 'bubble', types: 5, moves: 32, host: 'hachiware', intro: '거품이 번지기 전에!',
    goals: [{ k: 'bubble' }], stars: [4500, 7500, 10000],
    map: ['.......', '.......', '.......', '.......', '...o...', '#.o.o.#', '##o.o##'] },
  { name: '하치와레 노래 연습', done: '노래<br>완성!', icon: 'target', types: 5, moves: 18, host: 'hachiware', intro: '하치와레를 모아 줘!',
    goals: [{ k: 'char', id: 'hachiware', n: 20 }], stars: [4500, 7500, 10000],
    map: ['#..#..#', '.......', '.......', '.......', '#.....#', '##...##', '###.###'] },
  { name: '제초 검정 5급', icon: 'medal', types: 5, time: 60, host: 'usagi', exam: true, intro: '60초 안에 점수!',
    goals: [{ k: 'score', n: 6500 }], stars: [6500, 9000, 12000],
    map: ['.......', '.......', '.......', '..###..', '.......', '.......', '.......'] },
  // 2장: 섞어 보기
  { name: '선물 상자 정리', done: '정리<br>끝!!', icon: 'gift', types: 5, moves: 22, host: 'momonga', intro: '선물 상자는 두 번!',
    goals: [{ k: 'box' }, { k: 'weed' }], stars: [5500, 9000, 12000],
    map: ['##.#.##', '.......', '.g...g.', '.w.w.w.', 'w.g.g.w', '.......', '.......'] },
  { name: '시사의 라멘 가게', done: '라멘<br>완성!', icon: 'ramen', types: 5, moves: 32, host: 'shisa', intro: '재료 3개를 맨 아래로!',
    goals: [{ k: 'ing' }], stars: [6000, 9500, 12500], ing: { n: 3, max: 2, kinds: ['naruto', 'egg'] },
    map: ['#.i.i.#', '.......', '.......', '.b...b.', '.bb.bb.', '.......', '.......'] },
  { name: '제초 검정 4급', icon: 'medal', types: 5, time: 75, host: 'usagi', exam: true, intro: '75초 안에 잡초 전부!',
    goals: [{ k: 'weed' }], stars: [6000, 10000, 14000],
    map: ['##...##', '#.....#', '.......', 'w.w.w.w', '.w.w.w.', 'w.w.w.w', '.w.w.w.'] },
  { name: '거품 대소동', icon: 'bubble', types: 5, moves: 32, host: 'chiikawa', intro: '거품과 잡초를 한꺼번에!',
    goals: [{ k: 'bubble' }, { k: 'weed' }], stars: [6500, 10500, 13500],
    map: ['#.....#', '.......', '.w...w.', '..w.w..', '.......', '.o...o.', '.o...o.'] },
  { name: '쿠리만쥬의 안주', done: '안주<br>완성!', icon: 'dango', types: 5, moves: 32, host: 'kurimanju', intro: '경단, 주먹밥 내리고 상자도!',
    goals: [{ k: 'ing' }, { k: 'box' }], stars: [7500, 12000, 15000], ing: { n: 3, max: 2, kinds: ['dango', 'onigiri'] },
    map: ['..i.i..', '.......', '.......', 'b.....b', 'bg...gb', '#.....#', '##...##'] },
  { name: '제초 검정 3급', icon: 'medal', types: 5, time: 60, host: 'usagi', exam: true, intro: '큰 잡초는 두 번!',
    goals: [{ k: 'weed' }, { k: 'score', n: 9000 }], stars: [9000, 12500, 16000],
    map: ['##...##', '#.....#', '.W...W.', '..W.W..', 'w..W..w', '.w...w.', '..www..'] },
  // 3장: 새 기믹과 어려운 조합
  { name: '선물 리본 풀기', icon: 'ribbon', types: 5, moves: 20, host: 'momonga', intro: '리본을 모두 풀자!',
    goals: [{ k: 'lock' }], stars: [5000, 8000, 10500],
    map: ['##...##', '#.....#', '.l.l.l.', '..lll..', '.l.l.l.', '#.....#', '##...##'] },
  { name: '핫케이크 시럽', done: '핫케이크<br>완성!', icon: 'pancake', types: 5, moves: 25, host: 'chiikawa', intro: '시럽을 판 전체에!',
    goals: [{ k: 'syrup' }], stars: [5000, 8000, 10500],
    map: ['##...##', '#.....#', '.......', '...s...', '.......', '#.....#', '##...##'] },
  { name: '제초 검정 2급', icon: 'medal', types: 6, time: 65, host: 'usagi', exam: true, intro: '리본 사이 잡초!',
    goals: [{ k: 'weed' }, { k: 'lock' }], stars: [8000, 12000, 16000],
    map: ['.......', '.l...l.', 'w.l.l.w', '.w.l.w.', 'W.w.w.W', '.W...W.', '..www..'] },
  { name: '라멘 국물 내기', done: '국물<br>완성!', icon: 'pot', types: 5, moves: 32, host: 'shisa', intro: '국물을 바르고 재료도!',
    goals: [{ k: 'syrup' }, { k: 'ing' }], stars: [8000, 12000, 15000], ing: { n: 3, max: 2, kinds: ['naruto', 'egg'] },
    map: ['..i.i..', '.......', '.......', '.......', '#..s..#', '##...##', '###.###'] },
  { name: '거품 목욕 대작전', icon: 'bath', types: 5, moves: 28, host: 'hachiware', intro: '거품도 리본도!',
    goals: [{ k: 'bubble' }, { k: 'lock' }], stars: [7000, 11000, 14000],
    map: ['.......', '.l...l.', '..l.l..', '.......', '.o...o.', '#oo.oo#', '##...##'] },
  { name: '소풍 도시락', done: '도시락<br>완성!', icon: 'bento', types: 5, moves: 31, host: 'kurimanju', intro: '도시락 재료 모으기!',
    goals: [{ k: 'ing' }, { k: 'box' }, { k: 'weed' }], stars: [9000, 13000, 16000], ing: { n: 3, max: 2, kinds: ['onigiri', 'dango', 'donut'] },
    map: ['.i...i.', '.......', '.......', 'b.....b', 'wb...bw', '.w.w.w.', '..www..'] },
  { name: '제초 검정 1급', icon: 'medal', types: 6, time: 130, host: 'usagi', exam: true, intro: '최종 시험!',
    goals: [{ k: 'weed' }, { k: 'bubble' }, { k: 'score', n: 12000 }], stars: [12000, 16000, 20000],
    map: ['#.....#', '.......', 'W.W.W.W', '.w.w.w.', 'w.WoW.w', '#.w.w.#', '##ooo##'] },
];
// 스테이지 시작 전 짧은 대사 (팬 창작)
const LIFE_STORY = {
  0: [
    ['hachiware', '잡초는 바로 옆에서 같은 얼굴 셋을 맞추면 쑥 뽑혀. 쉽지?'],
    ['chiikawa', '(끄덕끄덕)'],
  ],
  1: [
    ['usagi', '우라!'],
    ['hachiware', '우사기다~! 같이 하자!'],
    ['hachiware', '같은 얼굴 넷을 네모로 모으면 종이비행기가 생겨. 잡초 쪽으로 슝 날아가!'],
    ['usagi', '야하!'],
  ],
  2: [
    ['shisa', '라멘 재료가 모자라요~! 나루토랑 달걀을 맨 아래까지 내려 주실 수 있나요?'],
    ['hachiware', '재료 밑에 있는 걸 터뜨리면 쑥 내려가. 맡겨 줘!'],
  ],
  3: [
    ['momonga', '모몽가 택배 왔어! 근데 안 열려…'],
    ['momonga', '열어 줘~ 모몽가 착하게 기다릴게. 착하지? 칭찬해 줘!'],
    ['hachiware', '상자는 바로 옆에서 터뜨리면 뜯을 수 있어!'],
  ],
  4: [
    ['hachiware', '목욕탕에 거품이 넘친다는 거야!?'],
    ['hachiware', '한 번 움직일 동안 거품을 하나도 못 터뜨리면 옆으로 번져. 조심!'],
    ['chiikawa', '…!!'],
  ],
  6: [
    ['hachiware', '제초 검정 5급 시험이다…! 시간 안에 점수를 모으면 합격이야.'],
    ['hachiware', '치이카와는 저번에 두 번 떨어졌지… 이번엔 어떻게든 될 거야!'],
    ['hachiware', '구슬이 터지는 동안은 시계가 멈추니까 침착하게~'],
    ['chiikawa', '(두근두근…)'],
    ['usagi', '하아?!'],
  ],
  12: [
    ['usagi', '야하!'],
    ['chiikawa', '…(꿀꺽)'],
    ['hachiware', '두 겹 잡초는 두 번 뽑아야 해. 어떻게든 되겠지~!'],
  ],
  13: [
    ['momonga', '이거 모몽가 선물이야! 리본 좀 풀어 줘~'],
    ['hachiware', '리본 묶인 구슬은 못 움직여. 한 번 터뜨리면 풀려!'],
  ],
  14: [
    ['chiikawa', '(핫케이크…!)'],
    ['hachiware', '시럽 칸이 낀 매치를 하면 그 줄로 시럽이 쭉 번져. 판 전체에 듬뿍~!'],
  ],
  19: [
    ['usagi', '우라!!'],
    ['hachiware', '드디어 1급 시험… 거품, 두 겹 잡초, 점수까지 전부래. 2급까지 가진 우사기도 처음 보는 시험이래!'],
    ['chiikawa', '…(꿀꺽)'],
    ['hachiware', '어떻게든 되라~!!'],
  ],
  end: [
    ['chiikawa', '…!! (와아…!)'],
    ['hachiware', '제초 검정 1급 합격이라는 거야!? 해냈다~!'],
    ['usagi', '야하~!!'],
    ['shisa', '어서 오세요~! 오늘은 축하 곱빼기예요!'],
  ],
};

// 모험 루트: 일상 일을 하다 토벌 의뢰가 끼어드는 순서. 마지막은 토벌 대작전
const ROUTE = [
  ['l', 0], ['l', 1], ['b', 0], ['l', 2], ['l', 3], ['b', 1], ['l', 4], ['l', 5], ['b', 2], ['l', 6],
  ['l', 7], ['b', 3], ['l', 8], ['b', 4], ['l', 9], ['l', 10], ['b', 5], ['l', 11], ['b', 6], ['l', 12],
  ['l', 13], ['b', 7], ['l', 14], ['l', 15], ['b', 8], ['l', 16], ['l', 17], ['l', 18], ['l', 19], ['b', 9],
];

// 난이도: 1~19는 쉽게, 그 사이 도전 두 번(제초 검정 5급, 데카츠요). 20부터 HARD가 띄엄띄엄
const CHALLENGE_AT = new Set([10, 14]);
const HARD_AT = new Set([20, 24, 25, 28, 29, 30]);
const routeLevel = k => (HARD_AT.has(k + 1) ? 'hard' : CHALLENGE_AT.has(k + 1) ? 'challenge' : '');

// 깼을 때 쾅 찍히는 말: 스테이지에 done이 있으면 그것, 없으면 첫 목표에 맞춰서
const DONE_WORD = { weed: '제초<br>끝!!', box: '상자<br>다 뜯었다!', bubble: '거품<br>싹싹!', ing: '배달<br>완료!', lock: '리본<br>풀었다!', syrup: '시럽<br>듬뿍!', char: '모으기<br>끝!', score: '목표<br>달성!' };
const doneWord = st => st.done || DONE_WORD[st.goals[0].k] || '클리어!';

const GOAL_ICON = { lock: () => ITEM('ribbon'), syrup: () => ITEM('pancake'), weed: () => ITEM('weed2'), box: () => ITEM('box'), bubble: () => ITEM('bubble'), ing: () => ITEM('ramen'),
  char: g => FACE(g.id), score: () => ITEM('target') };
const GOAL_NAME = { lock: () => '리본', syrup: () => '시럽', weed: () => '잡초', box: () => '상자', bubble: () => '거품', ing: () => '재료', char: g => CHAR_NAME[g.id], score: () => '점수' };

function parseLayout(st) {
  const floor = Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
  const mask = st.map.map(row => [...row].map(ch => ch !== '#'));
  const blocks = [], ings = [], locks = [];
  const syrup = st.goals.some(g => g.k === 'syrup') ? Array.from({ length: ROWS }, () => new Array(COLS).fill(false)) : null;
  let k = 0;
  st.map.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch === 'l') locks.push([r, c]);
    if (ch === 's' && syrup) syrup[r][c] = true;
    if (ch === 'w') blocks.push([r, c, 'weed', 1]);
    if (ch === 'W') blocks.push([r, c, 'weed', 2]);
    if (ch === 'b') blocks.push([r, c, 'box', 1]);
    if (ch === 'g') blocks.push([r, c, 'box', 2]);
    if (ch === 'o') blocks.push([r, c, 'bubble', 1]);
    if (ch === 'i') ings.push([r, c, st.ing.kinds[k++ % st.ing.kinds.length]]);
  }));
  return { floor, mask, blocks, ings, locks, syrup };
}

const MOVE_SVG = '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="15.5" rx="5" ry="4.2"/><circle cx="6" cy="9.5" r="2.1"/><circle cx="10" cy="6" r="2.1"/><circle cx="14" cy="6" r="2.1"/><circle cx="18" cy="9.5" r="2.1"/></svg>';
const L = { st: null, i: 0, moves: 0, time: 0, score: 0, ing: 0, spawned: 0, chars: {}, popped: false, extra: false, timer: null, goalsHtml: '' };

// 판에 재료가 모자라면 위에서 새로 내려보냄
function spawnIng() {
  const { n, max, kinds } = L.st.ing;
  let on = 0;
  Board.each(B.grid, t => { if (t.type === ING) on++; });
  if (L.spawned >= n || on >= max) return null;
  if (on > 0 && Math.random() > 0.15) return null;
  return kinds[L.spawned++ % kinds.length];
}

const Life = {
  hasIng: () => !!L.st?.ing,
  stopTimer() { clearInterval(L.timer); L.timer = null; },

  start(i) { return Life.begin(LIFE[i], { kind: 'route', i }); },

  // run: { kind: 'route', i } 모험 지도 / { kind: 'tower', floor } 인어섬 탐험 / { kind: 'contest' } 제초 대회
  async begin(st, run) {
    const i = run.i ?? -1;
    Life.stopTimer();
    // 같이 갈 친구 한 명 (인어섬은 1층에서만 고름)
    if (run.kind === 'route' && run.i < 2 && !Save.data.helper) L.helper = CHARS.findIndex(c => c.id === 'hachiware'); // 처음 두 판은 하치와레가 알아서 따라옴
    else if (run.kind !== 'tower' || run.floor === 1 || L.helper == null) await pickHelper();
    Object.assign(L, { hg: 0, run, ending: false, st, i, moves: st.moves || 0, time: st.time || 0, score: 0, ing: 0, chars: {}, popped: false, extra: false, goalsHtml: '' });
    Object.assign(B, { mode: 'life', stage: i, over: false, busy: true, sel: null, pending: [], maxCombo: 0, fever: 0 });
    B.team = LIFE_CHARS.slice(0, st.types).map(id => CHARS.findIndex(c => c.id === id));
    Object.assign(B, { real: B.team.length, played: false, dmgBy: {} });
    NTYPES = st.types;
    const lay = parseLayout(st);
    Board.floor = lay.floor;
    Board.mask = lay.mask;
    Board.syrup = lay.syrup;
    L.spawned = lay.ings.length;
    Board.spawnIng = st.ing ? spawnIng : null;
    app.classList.add('life-mode');
    app.classList.toggle('tower-mode', run.kind === 'tower');
    updateFever();
    Sound.music('map');
    show('battle');
    stageTitle(run.kind === 'route' ? routeIdx('l', i) : -1, st.name);
    $('#waveInfo').innerHTML = '';
    const hc = CHARS[L.helper];
    $('#lhHelper').style.setProperty('--ring', hc.ring);
    $('#lhHelper .pm-face').innerHTML = Meta.figure(hc.id, FACE(hc.id));
    layoutBoard();
    boardEl.querySelectorAll('.tile').forEach(e => e.remove());
    fx.innerHTML = '';
    B.grid = Board.create(lay);
    renderFloor();
    Life.hud();
    if (run.kind === 'route' && LIFE_STORY[i] && (Save.data.life || [])[i] == null) await playStory(LIFE_STORY[i]);
    await dropIn(run.kind === 'route' && routeLevel(routeIdx('l', i)) === 'hard' ? 'HARD!' : st.intro);
    B.busy = false;
    Tutor.onStart();
    Tutor.poke();
    if (st.time) Life.runTimer();
  },

  // 구슬이 터지거나 창이 떠 있는 동안은 시계가 멈춤
  runTimer() {
    Life.stopTimer();
    let last = performance.now();
    L.timer = setInterval(() => {
      const now = performance.now(), dt = (now - last) / 1000;
      last = now;
      if (B.mode !== 'life' || B.over || B.busy || wiping || !$('#battle').classList.contains('active') || $('#modal').classList.contains('show')) return;
      L.time = Math.max(0, L.time - dt);
      Life.hud();
      if (L.time <= 0) Life.check();
    }, 100);
  },

  count(k) {
    let n = 0;
    if (k === 'syrup') { Board.syrup?.forEach((row, r) => row.forEach((v, c) => { if (!v && !hole(r, c)) n++; })); return n; }
    if (k === 'lock') { Board.each(B.grid, t => { if (t.lock) n++; }); return n; }
    Board.each(B.grid, t => { if (t.block === k) n++; });
    return n;
  },
  remain(g) {
    if (g.k === 'ing') return Math.max(0, L.st.ing.n - L.ing);
    if (g.k === 'char') return Math.max(0, g.n - (L.chars[g.id] || 0));
    if (g.k === 'score') return Math.max(0, g.n - L.score);
    return Life.count(g.k);
  },
  done: () => !L.st.contest && L.st.goals.every(g => Life.remain(g) === 0),

  hud() {
    const st = L.st;
    $('#lhLimitLabel').innerHTML = st.time ? `<img src="${ITEM('timer')}">` : MOVE_SVG;
    $('#lhLimit').textContent = st.time ? Math.ceil(L.time) : L.moves;
    $('.lh-limit').classList.toggle('danger', st.time ? L.time <= 10 : L.moves <= 3);
    const html = st.contest ? `<div class="gchip best"><img src="${ITEM('medal')}"><b>${Save.data.contestBest || 0}</b></div>` : st.goals.map(g => {
      const n = Life.remain(g);
      return `<div class="gchip ${g.k}${n ? '' : ' done'}" data-id="${g.id || ''}"><img src="${GOAL_ICON[g.k](g)}"><b>${n || '✓'}</b></div>`;
    }).join('');
    if (html !== L.goalsHtml) {
      const was = L.goalsHtml;
      $('#lhGoals').innerHTML = L.goalsHtml = html;
      if (was) $('#lhHelper').animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-10px) rotate(-4deg)' }, { transform: 'none' }], { duration: 300 });
      if (!st.contest) st.goals.forEach((g, k) => {
        const n = Life.remain(g), before = (L.prevRemain || [])[k];
        if (n === 0 && before > 0) Life.goalDone($('#lhGoals').children[k]);
      });
    }
    if (!st.contest) L.prevRemain = st.goals.map(g => Life.remain(g));
    const top = st.stars[2] * 1.12;
    $('#lhScore .fill').style.width = Math.min(1, L.score / top) * 100 + '%';
    [...$('#lhScore .bar').querySelectorAll('i')].forEach((m, k) => {
      m.style.left = (st.stars[k] / top) * 100 + '%';
      m.classList.toggle('on', L.score >= st.stars[k]);
    });
    $('#lhScore b').textContent = L.score;
    const need = CHARS[L.helper].skill.need;
    $('#lhHelper').style.setProperty('--g', Math.min(1, L.hg / need));
    $('#lhHelper').classList.toggle('ready', L.hg >= need);
  },

  onStep(res, combo) {
    const pts = res.cleared.length * 20 * combo + res.created.length * 100 + res.hits.length * 50 + res.weeds.length * 60 +
      res.unlocked.length * 60 + res.syrup.length * 40;
    res.cleared.forEach(({ tile }) => {
      // 데려간 친구 얼굴이면 게이지 1, 다른 얼굴은 1/3
      L.hg += tile.type >= 0 && B.team[tile.type] === L.helper ? 1 : 1 / 3;
      if (tile.type < 0) return;
      const id = teamCh(tile.type).id;
      L.chars[id] = (L.chars[id] || 0) + 1;
    });
    if (res.hits.some(h => h.tile.block === 'bubble')) L.popped = true;
    L.score += pts;
    // 터진 자리 한가운데에 점수가 톡 (콤보일수록 크게)
    if (pts && res.cleared.length) {
      const cx = res.cleared.reduce((a, x) => a + x.c, 0) / res.cleared.length, cy = res.cleared.reduce((a, x) => a + x.r, 0) / res.cleared.length;
      const b = boardEl.getBoundingClientRect(), a = app.getBoundingClientRect();
      setTimeout(() => floatNum(b.left - a.left + (cx + 0.5) * B.S, b.top - a.top + (cy + 0.5) * B.S, '+' + pts, combo > 1 ? '#ff5d9e' : '#ffb020', combo > 2 ? 'crit' : ''), 160);
    }
    Life.hud();
  },

  // 바닥에 닿은 재료를 라면 그릇으로 휙
  async collect() {
    for (;;) {
      const got = Board.collectIngs(B.grid);
      if (!got.length) return;
      const to = centerOf($('#lhGoals .ing') || $('#lhGoals'));
      await Promise.all(got.map(({ r, c, tile }, i) => {
        const p = tileCenter(r, c);
        tile.el.remove();
        Sound.play('star', 1.2 + i * 0.1, 0.8);
        burst(p.x, p.y, '#ffd84d', 10);
        const im = new Image();
        im.src = ITEM(tile.ing);
        im.className = 'fximg';
        Object.assign(im.style, { left: p.x + 'px', top: p.y + 'px', width: B.S + 'px' });
        fx.appendChild(im);
        const dx = to.x - p.x, dy = to.y - p.y;
        return im.animate([
          { transform: 'translate(-50%,-50%) scale(1)' },
          { transform: `translate(calc(-50% + ${dx * 0.3}px), calc(-50% + ${dy * 0.3 - 80}px)) scale(1.5)`, offset: 0.4 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.6)` },
        ], { duration: 650, easing: 'ease-in-out' }).finished.then(() => {
          im.remove();
          L.ing++;
          L.score += 500;
          Life.hud();
          Sound.play('heal', 1.3, 0.7);
        });
      }));
      await fall(Board.gravity(B.grid));
    }
  },

  async endTurn() {
    if (!L.st.time) L.moves--;
    // 거품을 하나도 못 터뜨린 턴에는 거품이 번짐
    if (!L.popped && Life.count('bubble') && !Life.done()) {
      const s = Board.spreadBubble(B.grid);
      if (s) {
        popTile(s.old, 0);
        makeTile(s.tile);
        place(s.tile, s.r, s.c);
        s.tile.inner.animate([{ transform: 'scale(0)' }, { transform: 'scale(1.25)', offset: 0.6 }, { transform: 'scale(1)' }], { duration: 360, easing: 'ease-out' });
        Sound.play('pop', 0.7, 0.8);
        const p = tileCenter(s.r, s.c);
        burst(p.x, p.y, '#9fdcff', 6);
        await sleep(380);
        await cascade(null, []); // 수가 없어졌으면 섞기
      }
    }
    L.popped = false;
    if (L.st.contest && !Life.count('weed')) await Life.regrow();
    Life.hud();
    await Life.check();
  },

  // 제초 대회: 잡초를 다 뽑으면 보너스와 함께 여기저기 새로 돋아남
  async regrow() {
    L.score += 2000;
    Sound.play('special', 1, 0.9);
    banner('+2000', 450);
    const sprouts = Board.dropBlocks(B.grid, 8, 'weed', Math.random() < 0.3 ? 2 : 1);
    sprouts.forEach(({ r, c, old, tile }, k) => setTimeout(() => {
      popTile(old, 0);
      makeTile(tile);
      place(tile, r, c);
      tile.inner.animate([{ transform: 'scale(0) translateY(30%)' }, { transform: 'scale(1.2)', offset: 0.6 }, { transform: 'scale(1)' }], { duration: 320, easing: 'ease-out' });
    }, k * 50));
    await sleep(500);
    if (!Board.hasMove(B.grid)) await cascade(null, []);
  },

  async check() {
    if (B.over || L.ending) return;
    if (L.st.contest) { if (L.time <= 0) return Life.contestEnd(); return; }
    if (Life.done()) { L.ending = true; return Life.win(); }
    if (L.st.time ? L.time <= 0 : L.moves <= 0) return Life.fail();
  },

  // 목표 하나 끝: 칩이 통 부풀고 초록 체크가 쾅 + 반짝
  goalDone(chip) {
    if (!chip) return;
    const c = centerOf(chip);
    chip.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.5) rotate(-8deg)', filter: 'brightness(1.4)', offset: 0.45 }, { transform: 'scale(.92)', offset: 0.75 }, { transform: 'scale(1)' }], { duration: 520, easing: 'ease-out' });
    const ck = addFx('goal-check', c.x, c.y);
    ck.textContent = '✓';
    ck.animate([{ transform: 'translate(-50%,-50%) scale(2.6) rotate(-20deg)', opacity: 0 }, { transform: 'translate(-50%,-50%) scale(.9) rotate(0)', opacity: 1, offset: 0.55 }, { transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: 0.8 }, { transform: 'translate(-50%,-70%) scale(1)', opacity: 0 }],
      { duration: 900, easing: 'ease-out' }).finished.then(() => ck.remove());
    kx('explosion01', 'star_09', c.x, c.y, B.S * 2.4, '#7be0a0', [{ transform: 'scale(.2)', opacity: 1 }, { transform: 'scale(1.1) rotate(30deg)', opacity: 0 }], { duration: 420, easing: 'ease-out' });
    burst(c.x, c.y, '#7be0a0', 12);
    Sound.play('star', 1.25, 0.9);
    Sound.play('sparkle', 1.3, 0.6);
    Haptic.tap(25);
  },

  // 모든 목표 완료: 띠가 쓱 들어오고 이번 판 친구가 반가워함
  async allDone() {
    const el = document.createElement('div');
    el.className = 'goal-strip';
    el.innerHTML = `<img src="${art(L.st.host || 'chiikawa')}"><span>${L.st.exam ? '합격 점수!' : '모든 목표 완료!'}</span>`;
    app.appendChild(el);
    Sound.play('jingle_win', 1.1, 0.8);
    Haptic.tap(30);
    const [img] = el.children;
    el.animate([{ transform: 'translateX(-110%) skewX(-8deg)' }, { transform: 'translateX(3%) skewX(-8deg)', offset: 0.7 }, { transform: 'translateX(0) skewX(-8deg)' }], { duration: 360, easing: 'ease-out', fill: 'backwards' });
    img.animate([{ transform: 'translateY(40%) rotate(-10deg)' }, { transform: 'translateY(-8%) rotate(4deg)', offset: 0.7 }, { transform: 'none' }], { duration: 420, delay: 180, easing: 'ease-out', fill: 'backwards' });
    confetti(12);
    await sleep(1150);
    await el.animate([{ transform: 'translateX(0) skewX(-8deg)', opacity: 1 }, { transform: 'translateX(110%) skewX(-8deg)', opacity: 0 }], { duration: 260, easing: 'ease-in', fill: 'forwards' }).finished;
    el.remove();
  },

  // 남은 이동(시간 3초마다)을 줄폭탄으로 바꿔 한꺼번에 터뜨림
  async bonus() {
    const left = () => (L.st.time ? Math.floor(L.time / 3) : L.moves);
    if (left() <= 0) return;
    banner('보너스 타임!', 500);
    await sleep(600);
    const cells = pickTiles(Math.min(left(), 12));
    const from = centerOf($('.lh-limit'));
    for (const [i, [r, c]] of cells.entries()) {
      flyTile(ITEM('rocket'), from, tileCenter(r, c), 0, '#bfe9ff');
      await sleep(330);
      const t = B.grid[r][c];
      t.special = Math.random() < 0.5 ? 'h' : 'v';
      t.type = -1;
      refreshTile(t);
      squish(t);
      const p = tileCenter(r, c);
      burst(p.x, p.y, '#ffffff', 6);
      Sound.pop(i);
      if (L.st.time) L.time = Math.max(0, L.time - 3); else L.moves--;
      Life.hud();
      await sleep(90);
    }
    const rest = left();
    await cascade(null, cells);
    if (rest > 0) {
      L.score += rest * 300;
      if (L.st.time) L.time = 0; else L.moves = 0;
      const c = centerOf($('#lhScore'));
      floatNum(c.x, c.y, `+${rest * 300}`, '#e07b39', 'crit');
    }
    Life.hud();
    await sleep(400);
  },

  async win() {
    // 보너스 타임이 끝날 때까지는 over를 세우지 않음 (그 사이 뒤로 가기로 판이 바뀌지 않게)
    B.busy = true;
    Life.stopTimer();
    clearSel();
    await Life.allDone();
    await Life.bonus();
    B.over = true;
    if (L.run.kind === 'tower') return Tower.cleared();
    const st = L.st, i = L.i;
    const stars = L.score >= st.stars[2] ? 3 : L.score >= st.stars[1] ? 2 : 1;
    const list = (Save.data.life = Save.data.life || []);
    const first = list[i] == null;
    const coins = Meta.reward(stars, first), treat = Meta.treat('l', i, stars, first);
    list[i] = Math.max(list[i] || 0, stars);
    setTimeout(() => Net.submit(), 0);
    if (first) Save.data.ramen = true;
    Save.save();
    Sound.play('win', 1);
    await clearShow(st.exam ? '검정<br>합격!' : doneWord(st));
    const k = routeIdx('l', i), last = k === ROUTE.length - 1;
    if (i === LIFE.length - 1 && first) await playStory(LIFE_STORY.end);
    if (first) await Meta.stageJoin('l', i);
    Sound.music(null);
    const ch = mvp();
    modal({
      title: st.exam ? '합격!' : '클리어!', stars, char: ch.id, text: `${ch.name}: "${lineOf(ch.id)}"`,
      rows: [['점수', L.score], [`<img class="row-ic" src="${ITEM('coin')}">`, '+' + coins], treat],
      btn2: '지도', on2: () => go(() => openMap(first ? k : null)),
      btn1: last ? '지도로' : '다음 스테이지',
      on1: () => (last ? go(() => openMap(first ? k : null)) : Hearts.need(() => go(() => goRoute(k + 1)), () => go(() => openMap(first ? k : null)))),
    });
  },

  async fail() {
    B.over = true;
    B.busy = true;
    Life.stopTimer();
    clearSel();
    Sound.music(null);
    Sound.play('jingle_lose', 1, 0.9);
    await banner(L.st.time ? '시간 끝…' : '이동 끝…', 600);
    if (L.run.kind === 'tower' && L.extra) return Tower.over();
    const left = L.st.goals.filter(g => Life.remain(g) > 0).map(g => `${GOAL_NAME[g.k](g)} ${Life.remain(g)}`).join(', ');
    // 모험 지도 스테이지를 포기하면 하트 하나
    const route = L.run.kind === 'route';
    const retry = () => {
      if (!route) return go(() => (L.run.kind === 'tower' ? Tower.over() : Life.start(L.i)));
      Hearts.lose();
      Hearts.need(() => go(() => Life.start(L.i)), () => go(openMap));
    };
    const card = { title: '아쉬워…', img: 'assets/img/art/scene_crying.jpg', photo: true, text: `남은 목표: ${left}` };
    if (!L.extra) {
      modal({
        ...card,
        btn1: L.st.time ? '+15초 더!' : '+5번 더!',
        on1: () => {
          L.extra = true;
          if (L.st.time) L.time += 15; else L.moves += 5;
          B.over = false;
          B.busy = false;
          Life.hud();
          Sound.music('map');
          if (L.st.time) Life.runTimer();
        },
        btn2: L.run.kind === 'tower' ? '여기까지' : '다시 하기', on2: retry,
      });
    } else {
      modal({ ...card, btn1: '다시 하기', on1: retry, btn2: '지도', on2: () => { if (route) Hearts.lose(); go(openMap); } });
    }
  },
};

// ---------- 인어섬 탐험: 끝없이 올라가는 층 (무한 모드) ----------
// 층마다 일상 퍼즐 하나를 골라 이동 수를 줄여 가며 어렵게. 실패하면 거기까지 (+5번은 층마다 한 번)
const Tower = {
  stage(floor) {
    const pool = LIFE.filter(s => !s.exam && !s.contest);
    const base = pool[Math.floor(Math.random() * pool.length)];
    const st = JSON.parse(JSON.stringify(base));
    st.name = `인어섬 ${floor}층`;
    st.intro = `${floor}층!`;
    st.types = floor >= 12 ? 6 : 5;
    st.moves = Math.max(12, Math.round(base.moves * (1 - Math.min(0.35, floor * 0.02))));
    return st;
  },
  start(floor = 1) {
    if (floor === 1) Tower.coins = 0;
    return Life.begin(Tower.stage(floor), { kind: 'tower', floor });
  },
  async cleared() {
    const f = L.run.floor;
    const c = 20 + f * 2;
    Tower.coins += c;
    Meta.addCoins(c);
    Save.data.towerBest = Math.max(Save.data.towerBest || 0, f);
    Save.save();
    Net.submit();
    Sound.play('win', 1.1);
    confetti(14);
    await banner(`${f}층 클리어!`, 700);
    go(() => Tower.start(f + 1));
  },
  over() {
    const f = L.run.floor - 1;
    Sound.music(null);
    Net.submit();
    modal({
      title: '탐험 끝!', char: 'hachiware', text: f ? `하치와레: "${f}층까지 왔다는 거야!? 대단해~!"` : '하치와레: "다음엔 어떻게든 더 높이 가 보자~!"',
      rows: [['오른 층', f], ['최고 기록', Save.data.towerBest || 0], [`<img class="row-ic" src="${ITEM('coin')}">`, '+' + (Tower.coins || 0)]],
      btn2: '나가기', on2: () => go(openChallenge),
      btn1: '다시 도전', on1: () => go(() => Tower.start(1)),
    });
  },
};

// ---------- 제초 대회: 60초 동안 최대한 높은 점수 ----------
const CONTEST = { name: '제초 대회', icon: 'medal', types: 5, time: 60, host: 'usagi', contest: true, intro: '60초! 최대한 많이!',
  goals: [], stars: [8000, 15000, 25000], map: ['.......', '.w...w.', '...w...', '.w...w.', '...w...', '.w...w.', '.......'] };
Life.contestEnd = async function () {
  B.over = true;
  B.busy = true;
  Life.stopTimer();
  clearSel();
  Sound.music(null);
  Sound.play('jingle_win', 1, 0.9);
  await banner('제초 대회 끝!!', 700);
  const best = Save.data.contestBest || 0, isBest = L.score > best;
  Save.data.contestBest = Math.max(best, L.score);
  const coins = Math.floor(L.score / 250);
  Meta.addCoins(coins);
  Save.save();
  Net.submit();
  if (isBest) confetti(20);
  modal({
    title: isBest ? '최고 기록!' : '제초 대회 끝!', char: 'usagi', text: isBest ? '우사기: "우라~!!"' : '우사기: "하아?! 한 번 더!"',
    rows: [['점수', L.score], ['최고', Save.data.contestBest], [`<img class="row-ic" src="${ITEM('coin')}">`, '+' + coins]],
    btn2: '나가기', on2: () => go(openChallenge),
    btn1: '다시 도전', on1: () => go(() => Life.begin(CONTEST, { kind: 'contest' })),
  });
};

// ---------- 같이 갈 친구 고르기 (일상 퍼즐은 한 명만) ----------
function pickHelper() {
  return new Promise(done => {
    const list = CHARS.map((c, k) => [c, k]).filter(([c]) => Meta.owned(c.id));
    let pick = L.helper != null && Meta.owned(CHARS[L.helper].id) ? L.helper : CHARS.findIndex(c => c.id === (Save.data.helper || 'hachiware'));
    if (pick < 0 || !Meta.owned(CHARS[pick].id)) pick = list[0][1];
    const card = $('#charSheet .sheet-card');
    const draw = () => {
      const ch = CHARS[pick];
      card.style.setProperty('--ring', ch.ring);
      card.innerHTML = `<div class="mates-title">같이 갈 친구 한 명</div>
        <div class="helper-pick"><span class="fig">${Meta.figure(ch.id, art(ch.id))}</span><div><b>${ch.name}</b><small>${ch.skill.name}</small><p>${ch.skill.desc}</p></div></div>
        <div class="mates-grid">${list.map(([c, k]) => `<button class="${k === pick ? 'on' : ''}" data-k="${k}" style="--ring:${c.ring}"><img src="${FACE(c.id)}"><span>${c.name}</span></button>`).join('')}</div>
        <div class="sheet-btns"><button class="big-btn" data-go>같이 가자!</button></div>`;
      card.querySelectorAll('.mates-grid button').forEach(b => (b.onclick = () => { pick = +b.dataset.k; Sound.play('pop', 1.2, 0.5); draw(); }));
      card.querySelector('[data-go]').onclick = () => {
        L.helper = pick;
        Save.data.helper = CHARS[pick].id;
        Save.save();
        Sound.voice(CHARS[pick].id, 'pick') || Sound.play('click');
        $('#charSheet').classList.remove('show');
        done();
      };
    };
    draw();
    $('#charSheet').classList.add('show');
    fitText($('#charSheet'));
  });
}
$('#lhHelper').onclick = () => useSkill(0);
