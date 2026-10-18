// 일상 퍼즐: 풀 뽑기, 요리, 거품 청소, 상자 뜯기, 제초 검정. 몬스터 없이 목표를 채우는 스테이지
// 판 글자: # 판 밖(구멍)  . 빈칸  w 잡초  W 잡초 두 겹  b 상자  g 선물 상자(두 번)  x 상자+잡초  X 선물+잡초
//          o 거품(번짐)  q 거품+잡초  i 재료  l 리본 구슬  L 리본+잡초  s 처음부터 시럽 칸
const LIFE_CHARS = ['chiikawa', 'hachiware', 'usagi', 'momonga', 'kurimanju', 'rakko'];

// goals: lock 리본 다 풀기, syrup 시럽을 판 전체에 바르기, weed 잡초 다 뽑기, box 상자 다 뜯기, bubble 거품 다 터뜨리기, ing 재료 n개 바닥까지, char 그 캐릭터 n개, score 점수
// moves 이동 수 또는 time 초(제한 시간), stars 별 점수 [1, 2, 3], host 화면 옆 응원 캐릭터
const LIFE = [
  { name: '풀 뽑기 첫날', icon: 'weed1', types: 5, moves: 18, host: 'chiikawa', intro: '잡초를 모두 뽑자!',
    goals: [{ k: 'weed' }], stars: [4000, 7000, 9500],
    map: ['#.....#', '.......', '..www..', '.wwwww.', '.wwwww.', '..www..', '#.....#'] },
  { name: '비행기 연습', icon: 'plane', types: 5, moves: 20, host: 'hachiware', intro: '네모로 모아 비행기!',
    goals: [{ k: 'weed' }], stars: [5000, 8000, 10000],
    map: ['ww...ww', 'ww...ww', '#.....#', '##...##', '#.....#', 'ww...ww', 'ww...ww'] },
  { name: '라멘 재료 나르기', icon: 'ramen', types: 5, moves: 20, host: 'shisa', intro: '재료를 맨 아래로!',
    goals: [{ k: 'ing' }], stars: [6000, 9000, 11500], ing: { n: 3, max: 2, kinds: ['naruto', 'egg'] },
    map: ['..i.i..', '.......', '.......', '.......', '#.....#', '##...##', '###.###'] },
  { name: '택배 상자 뜯기', icon: 'box', types: 5, moves: 20, host: 'momonga', intro: '상자를 모두 뜯자!',
    goals: [{ k: 'box' }], stars: [4500, 7500, 9500],
    map: ['#.....#', '.......', 'bb...bb', 'bb...bb', '.......', '..bbb..', '#.....#'] },
  { name: '목욕탕 거품 청소', icon: 'bubble', types: 5, moves: 22, host: 'hachiware', intro: '거품을 다 터뜨리자!',
    goals: [{ k: 'bubble' }], stars: [5000, 9000, 11000],
    map: ['.......', '.......', '.......', '.......', '...o...', '#.o.o.#', '##o.o##'] },
  { name: '하치와레 노래 연습', icon: 'target', types: 5, moves: 18, host: 'hachiware', intro: '하치와레를 모아 줘!',
    goals: [{ k: 'char', id: 'hachiware', n: 26 }], stars: [5000, 8000, 10000],
    map: ['#..#..#', '.......', '.......', '.......', '#.....#', '##...##', '###.###'] },
  { name: '제초 검정 5급', icon: 'medal', types: 5, time: 60, host: 'usagi', exam: true, intro: '60초 안에 점수!',
    goals: [{ k: 'score', n: 6000 }], stars: [6000, 9000, 12000],
    map: ['.......', '.......', '.......', '..###..', '.......', '.......', '.......'] },
  { name: '선물 상자 정리', icon: 'gift', types: 5, moves: 24, host: 'momonga', intro: '선물 상자와 잡초!',
    goals: [{ k: 'box' }, { k: 'weed' }], stars: [6000, 10000, 12000],
    map: ['##.#.##', '.......', '.X...X.', '.wwwww.', '.wXwXw.', '.wwwww.', '.......'] },
  { name: '시사의 라멘 가게', icon: 'ramen', types: 5, moves: 26, host: 'shisa', intro: '재료 4개를 맨 아래로!',
    goals: [{ k: 'ing' }], stars: [7000, 11000, 14000], ing: { n: 4, max: 2, kinds: ['naruto', 'egg'] },
    map: ['#.i.i.#', '.......', '.......', '.b...b.', '.bb.bb.', '.......', '.......'] },
  { name: '제초 검정 4급', icon: 'medal', types: 5, time: 75, host: 'usagi', exam: true, intro: '75초 안에 잡초 전부!',
    goals: [{ k: 'weed' }], stars: [8000, 13000, 17000],
    map: ['##...##', '#.....#', '.......', 'wwwwwww', 'wwwwwww', 'wwwwwww', 'wwwwwww'] },
  { name: '거품 대소동', icon: 'bubble', types: 5, moves: 27, host: 'chiikawa', intro: '거품과 잡초를 한꺼번에!',
    goals: [{ k: 'bubble' }, { k: 'weed' }], stars: [7000, 11000, 13500],
    map: ['#.....#', '.......', '.www.w.', '.wwwww.', '..www..', '.qq.qq.', 'qq...qq'] },
  { name: '쿠리만쥬의 안주', icon: 'dango', types: 5, moves: 29, host: 'kurimanju', intro: '경단, 주먹밥 내리고 상자도!',
    goals: [{ k: 'ing' }, { k: 'box' }], stars: [8000, 13000, 15000], ing: { n: 4, max: 2, kinds: ['dango', 'onigiri'] },
    map: ['..i.i..', '.......', '.......', 'g.....g', 'gg...gg', '#.....#', '##...##'] },
  { name: '제초 검정 3급', icon: 'medal', types: 6, time: 90, host: 'usagi', exam: true, intro: '90초! 두 겹 잡초까지!',
    goals: [{ k: 'weed' }, { k: 'score', n: 10000 }], stars: [10000, 13000, 17000],
    map: ['##...##', '#.....#', '.WwWwW.', 'wWWWWWw', 'wWwWwWw', '#WWWWW#', '##www##'] },
  { name: '선물 리본 풀기', icon: 'ribbon', types: 5, moves: 20, host: 'momonga', intro: '리본을 모두 풀자!',
    goals: [{ k: 'lock' }], stars: [5000, 8000, 10000],
    map: ['##...##', '#.....#', '.l.l.l.', '..lll..', '.l.l.l.', '#.....#', '##...##'] },
  { name: '핫케이크 시럽', icon: 'pancake', types: 5, moves: 22, host: 'chiikawa', intro: '시럽을 판 전체에!',
    goals: [{ k: 'syrup' }], stars: [5000, 8000, 10000],
    map: ['##...##', '#.....#', '.......', '...s...', '.......', '#.....#', '##...##'] },
  { name: '제초 검정 2급', icon: 'medal', types: 6, time: 100, host: 'usagi', exam: true, intro: '100초! 리본 사이 잡초!',
    goals: [{ k: 'weed' }, { k: 'lock' }], stars: [9000, 12000, 15000],
    map: ['.......', '.......', 'wLwwwLw', 'wwLwLww', 'WwwLwwW', 'wWwwwWw', '.wwwww.'] },
  { name: '라멘 국물 내기', icon: 'pot', types: 5, moves: 29, host: 'shisa', intro: '국물을 바르고 재료도!',
    goals: [{ k: 'syrup' }, { k: 'ing' }], stars: [8000, 12000, 15000], ing: { n: 3, max: 2, kinds: ['naruto', 'egg'] },
    map: ['..i.i..', '.......', '.......', '.......', '#..s..#', '##...##', '###.###'] },
  { name: '거품 목욕 대작전', icon: 'bath', types: 5, moves: 26, host: 'hachiware', intro: '거품도 리본도!',
    goals: [{ k: 'bubble' }, { k: 'lock' }], stars: [7000, 11000, 14000],
    map: ['.......', '.l...l.', '..l.l..', '.......', '.o...o.', '#oo.oo#', '##...##'] },
  { name: '소풍 도시락', icon: 'bento', types: 5, moves: 31, host: 'kurimanju', intro: '도시락 재료 모으기!',
    goals: [{ k: 'ing' }, { k: 'box' }, { k: 'weed' }], stars: [9000, 13000, 16000], ing: { n: 4, max: 2, kinds: ['onigiri', 'dango', 'donut'] },
    map: ['.i...i.', '.......', '.......', 'x.....x', 'wx...xw', 'wwwwwww', '.wwwww.'] },
  { name: '제초 검정 1급', icon: 'medal', types: 6, time: 120, host: 'usagi', exam: true, intro: '최종 시험! 120초!',
    goals: [{ k: 'weed' }, { k: 'bubble' }, { k: 'score', n: 14000 }], stars: [14000, 18000, 22000],
    map: ['#.....#', '.......', 'WWwWwWW', 'WwWWWwW', 'wWWqWWw', '#WwWwW#', '##qqq##'] },
];
// 스테이지 시작 전 짧은 대사 (팬 창작)
const LIFE_STORY = {
  0: [
    ['hachiware', '오늘은 풀 뽑기 일이야! 초록 칸 위에서 구슬을 터뜨리면 잡초가 뽑혀.'],
    ['chiikawa', '(끄덕끄덕)'],
    ['hachiware', '같은 얼굴 넷을 네모로 모으면 ✈️비행기가 생겨. 잡초 쪽으로 날아가!'],
    ['usagi', '아이템은 톡톡 두 번 누르거나, 아무 쪽으로 쓱 밀어도 터져~ 우라!'],
  ],
  2: [
    ['shisa', '라멘 재료가 모자라요~! 나루토랑 달걀을 맨 아래까지 내려 주세요!'],
    ['hachiware', '재료 밑에 있는 구슬을 터뜨리면 쑥 내려가!'],
  ],
  3: [['momonga', '택배 상자다! 바로 옆에서 구슬을 터뜨리면 뜯을 수 있어. 칭찬해줘!']],
  4: [
    ['hachiware', '목욕탕 거품이 넘쳐!'],
    ['hachiware', '한 번 움직일 동안 거품을 하나도 못 터뜨리면 옆으로 번져. 조심!'],
    ['chiikawa', '…!!'],
  ],
  6: [
    ['hachiware', '제초 검정 시험이야! 제한 시간 안에 점수를 모으면 합격!'],
    ['hachiware', '구슬이 터지는 동안에는 시계가 멈춰. 천천히 생각해도 돼.'],
    ['chiikawa', '(두근두근…)'],
    ['usagi', '하아?!'],
  ],
  13: [['momonga', '선물에 리본이 칭칭… 묶인 구슬은 못 움직여. 한 번 터뜨리면 풀려!']],
  14: [
    ['chiikawa', '(핫케이크…!)'],
    ['hachiware', '시럽 칸이 낀 매치를 하면 그 줄에 시럽이 쭉 번져. 판 전체에 발라 보자!'],
  ],
  19: [
    ['usagi', '우라! 1급!!'],
    ['hachiware', '마지막 시험이야. 거품, 두 겹 잡초, 점수까지 전부!'],
    ['chiikawa', '…(꿀꺽)'],
  ],
  12: [
    ['usagi', '우라! 3급이다~!'],
    ['chiikawa', '…(꿀꺽)'],
    ['hachiware', '두 겹짜리 잡초는 두 번 뽑아야 해. 할 수 있어!'],
  ],
  end: [
    ['chiikawa', '…합격했다!'],
    ['hachiware', '제초 검정 1급! 오늘은 라멘 곱빼기 먹자~'],
    ['shisa', '어서 오세요~!'],
  ],
};

// 모험 루트: 일상 일을 하다 토벌 의뢰가 끼어드는 순서. 마지막은 토벌 대작전
const ROUTE = [
  ['l', 0], ['l', 1], ['b', 0], ['l', 2], ['l', 3], ['b', 1], ['l', 4], ['l', 5], ['b', 2], ['l', 6],
  ['l', 7], ['b', 3], ['l', 8], ['b', 4], ['l', 9], ['l', 10], ['b', 5], ['l', 11], ['b', 6], ['l', 12],
  ['l', 13], ['b', 7], ['l', 14], ['l', 15], ['b', 8], ['l', 16], ['l', 17], ['l', 18], ['l', 19], ['b', 9],
];

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
    if ('wxXqL'.includes(ch)) floor[r][c] = 1;
    if (ch === 'l' || ch === 'L') locks.push([r, c]);
    if (ch === 's' && syrup) syrup[r][c] = true;
    if (ch === 'W') floor[r][c] = 2;
    if (ch === 'b' || ch === 'x') blocks.push([r, c, 'box', 1]);
    if (ch === 'g' || ch === 'X') blocks.push([r, c, 'box', 2]);
    if (ch === 'o' || ch === 'q') blocks.push([r, c, 'bubble', 1]);
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

  async start(i) {
    const st = LIFE[i];
    Life.stopTimer();
    Object.assign(L, { ending: false, st, i, moves: st.moves || 0, time: st.time || 0, score: 0, ing: 0, chars: {}, popped: false, extra: false, goalsHtml: '' });
    Object.assign(B, { mode: 'life', stage: i, over: false, busy: true, sel: null, pending: [], maxCombo: 0, fever: 0 });
    B.team = LIFE_CHARS.slice(0, st.types).map(id => CHARS.findIndex(c => c.id === id));
    NTYPES = st.types;
    const lay = parseLayout(st);
    Board.floor = lay.floor;
    Board.mask = lay.mask;
    Board.syrup = lay.syrup;
    L.spawned = lay.ings.length;
    Board.spawnIng = st.ing ? spawnIng : null;
    app.classList.add('life-mode');
    updateFever();
    Sound.music('map');
    show('battle');
    $('#stageName').textContent = `${routeIdx('l', i) + 1}. ${st.name}`;
    $('#waveInfo').innerHTML = '';
    $('#lhChar').src = art(st.host);
    layoutBoard();
    boardEl.querySelectorAll('.tile').forEach(e => e.remove());
    fx.innerHTML = '';
    B.grid = Board.create(lay);
    renderFloor();
    Life.hud();
    if (LIFE_STORY[i] && (Save.data.life || [])[i] == null) await playStory(LIFE_STORY[i]);
    await dropIn(st.intro);
    B.busy = false;
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
    if (k === 'weed') { Board.floor?.forEach(row => row.forEach(w => { if (w > 0) n++; })); return n; }
    Board.each(B.grid, t => { if (t.block === k) n++; });
    return n;
  },
  remain(g) {
    if (g.k === 'ing') return Math.max(0, L.st.ing.n - L.ing);
    if (g.k === 'char') return Math.max(0, g.n - (L.chars[g.id] || 0));
    if (g.k === 'score') return Math.max(0, g.n - L.score);
    return Life.count(g.k);
  },
  done: () => L.st.goals.every(g => Life.remain(g) === 0),

  hud() {
    const st = L.st;
    $('#lhLimitLabel').innerHTML = st.time ? `<img src="${ITEM('timer')}">` : MOVE_SVG;
    $('#lhLimit').textContent = st.time ? Math.ceil(L.time) : L.moves;
    $('.lh-limit').classList.toggle('danger', st.time ? L.time <= 10 : L.moves <= 3);
    const html = st.goals.map(g => {
      const n = Life.remain(g);
      return `<div class="gchip ${g.k}${n ? '' : ' done'}"><img src="${GOAL_ICON[g.k](g)}"><b>${n || '✓'}</b></div>`;
    }).join('');
    if (html !== L.goalsHtml) {
      const was = L.goalsHtml;
      $('#lhGoals').innerHTML = L.goalsHtml = html;
      if (was) $('#lhChar').animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-10px) rotate(-4deg)' }, { transform: 'none' }], { duration: 300 });
    }
    const top = st.stars[2] * 1.12;
    $('#lhScore .fill').style.width = Math.min(1, L.score / top) * 100 + '%';
    [...$('#lhScore .bar').querySelectorAll('i')].forEach((m, k) => {
      m.style.left = (st.stars[k] / top) * 100 + '%';
      m.classList.toggle('on', L.score >= st.stars[k]);
    });
    $('#lhScore b').textContent = L.score;
  },

  onStep(res, combo) {
    const pts = res.cleared.length * 20 * combo + res.created.length * 100 + res.hits.length * 50 + res.weeds.length * 60 +
      res.unlocked.length * 60 + res.syrup.length * 40;
    res.cleared.forEach(({ tile }) => {
      if (tile.type < 0) return;
      const id = teamCh(tile.type).id;
      L.chars[id] = (L.chars[id] || 0) + 1;
    });
    if (res.hits.some(h => h.tile.block === 'bubble')) L.popped = true;
    L.score += pts;
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
    Life.hud();
    await Life.check();
  },

  async check() {
    if (B.over || L.ending) return;
    if (Life.done()) { L.ending = true; return Life.win(); }
    if (L.st.time ? L.time <= 0 : L.moves <= 0) return Life.fail();
  },

  // 남은 이동(시간 3초마다)을 줄폭탄으로 바꿔 한꺼번에 터뜨림
  async bonus() {
    const left = () => (L.st.time ? Math.floor(L.time / 3) : L.moves);
    if (left() <= 0) return;
    banner('보너스 타임!', 500);
    await sleep(600);
    const cells = pickTiles(Math.min(left(), 12));
    for (const [i, [r, c]] of cells.entries()) {
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
    await banner(L.st.exam ? '합격 점수!' : '목표 달성!', 500);
    await Life.bonus();
    B.over = true;
    const st = L.st, i = L.i;
    const stars = L.score >= st.stars[2] ? 3 : L.score >= st.stars[1] ? 2 : 1;
    const list = (Save.data.life = Save.data.life || []);
    const first = list[i] == null;
    const coins = Meta.reward(stars, first);
    list[i] = Math.max(list[i] || 0, stars);
    if (first) Save.data.ramen = true;
    Save.save();
    Sound.play('win', 1);
    await clearShow(st.exam ? '검정<br>합격!' : '일<br>끝!');
    const k = routeIdx('l', i), last = k === ROUTE.length - 1;
    if (i === LIFE.length - 1 && first) await playStory(LIFE_STORY.end);
    Sound.music(null);
    const ch = CHARS.find(c => c.id === st.host) || CHARS[0];
    modal({
      title: st.exam ? '합격!' : '클리어!', stars, char: ch.id, text: `${ch.name}: "${ch.line}"`,
      rows: [['점수', L.score], ['코인', '+' + coins], ['라면', first ? '+1그릇' : '-']],
      btn2: '지도', on2: () => go(() => openMap(first ? k : null)),
      btn1: last ? '지도로' : '다음 스테이지',
      on1: () => go(() => (last ? openMap(first ? k : null) : goRoute(k + 1))),
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
    const left = L.st.goals.filter(g => Life.remain(g) > 0).map(g => `${GOAL_NAME[g.k](g)} ${Life.remain(g)}`).join(', ');
    const retry = () => go(() => Life.start(L.i));
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
        btn2: '다시 하기', on2: retry,
      });
    } else {
      modal({ ...card, btn1: '다시 하기', on1: retry, btn2: '지도', on2: () => go(openMap) });
    }
  },
};
