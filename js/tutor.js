// 처음 하는 사람 돕기: 첫 이야기, 첫 수 따라 하기, 처음 보는 것 짧은 안내, 오래 멈추면 힌트
const OPENING = [
  ['hachiware', '저기~! 게시판에 새 일이 붙었어!'],
  ['chiikawa', '…!'],
  ['hachiware', '풀 뽑기래. 이거 끝나면… 라멘 먹을 수 있다는 거야!?'],
  ['chiikawa', '…!! (두근두근)'],
  ['hachiware', '좋아, 어떻게든 되겠지~! 가자!'],
];
// 아이템을 처음 만들었을 때 따라 하기 한 줄
const LESSON = {
  h: '랏코 검이다! 아무 쪽으로 쓱 밀면 한 줄을 싹 베어 버려~',
  bomb: '폭탄이다! 쓱 밀면 주변이 쾅!',
  plane: '종이비행기야! 쓱 밀면 목표 쪽으로 날아가서 콕!',
  rainbow: '경단이다! 옆 얼굴이랑 바꾸면 그 얼굴이 전부 사라져',
};
// 처음 볼 때 한 번만 뜨는 안내: [아이콘, 한 줄]
const TIPS = {
  item: ['rocket', '아이템은 톡톡 두 번 누르거나, 아무 쪽으로 쓱 밀면 터져요'],
  plane: ['plane', '종이비행기는 목표 쪽으로 날아가요'],
  rainbow: ['rainbow', '경단은 바꾼 얼굴을 전부 지워요'],
  skill: ['sparkle', '동그라미가 꽉 차면 얼굴을 톡! 스킬을 써요'],
  battle: ['boom', '같은 얼굴을 맞추면 그 친구가 공격해요. 숫자는 괴물이 공격할 때까지 남은 턴'],
  box: ['box', '상자는 바로 옆에서 맞추면 깨져요'],
  bubble: ['bubble', '거품은 한 턴에 하나도 안 터뜨리면 옆으로 번져요'],
  lock: ['ribbon', '리본 구슬은 못 움직여요. 한 번 맞추면 풀려요'],
  syrup: ['pancake', '시럽 칸이 낀 매치는 그 칸들로 시럽을 번지게 해요'],
  ing: ['ramen', '재료는 맨 아래 칸까지 내려가면 모여요'],
};

const Tutor = {
  guide: null, idle: null,
  seen(k) { return (Save.data.tips = Save.data.tips || {})[k]; },
  mark(k) { Save.data.tips[k] = 1; Save.save(); },

  // 맨 처음 시작하기를 누르면 짧은 이야기
  async opening() {
    if (Tutor.seen('opening')) return;
    Tutor.mark('opening');
    await Cine.play(CINE);
    await playStory(OPENING);
  },

  // 화면 위쪽에 잠깐 뜨는 안내 카드 (톡 누르면 닫힘)
  tip(k) {
    if (Tutor.seen(k) || !TIPS[k]) return;
    Tutor.mark(k);
    const [icon, text] = TIPS[k];
    const el = document.createElement('div');
    el.className = 'tip';
    el.innerHTML = `<img src="${ITEM(icon)}"><span>${text}</span>`;
    app.appendChild(el);
    Sound.play('special', 1.3, 0.5);
    el.animate([{ transform: 'translate(-50%, -20px)', opacity: 0 }, { transform: 'translate(-50%, 0)', opacity: 1 }], { duration: 260, easing: 'ease-out', fill: 'backwards' });
    const close = () => { el.onclick = null; el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' }).finished.then(() => el.remove()); };
    el.onclick = close;
    setTimeout(close, 4200);
  },

  // 스테이지 시작 때 그 판에 처음 나오는 것 안내
  async onStart() {
    if (B.mode === 'battle') { await Tutor.battleIntro(); return; }
    // 맨 첫 판: 목표, 이동 수를 비춰 주고 → 첫 수를 손가락으로 알려 주고 그 수만 둘 수 있게
    if (L.run?.kind === 'route' && L.i === 0 && !Tutor.seen('firstMove')) {
      B.busy = true;
      await Spot.show($('.lh-goals'), '오늘 할 일! 잡초를 전부 뽑으면 끝이야');
      await Spot.show($('.lh-limit'), '움직일 수 있는 횟수야. 다 쓰기 전에 끝내자!');
      await Spot.show($('.lh-help'), '나도 도와줄게! 동그라미가 꽉 차면 스킬을 쓸 수 있어');
      B.busy = false;
      const mv = Tutor.findMove(true);
      if (mv) {
        Tutor.guide = mv;
        Tutor.showHand(mv);
        Spot.show(mv.slice(0, 2).map(([r, c]) => B.grid[r][c].el), '같은 얼굴 셋이 나란히 되게 쓱 밀어 봐!', { tap: 'external', pad: 4 });
      }
      return;
    }
    if (L.st?.icon === 'plane' && !Tutor.seen('makePlane')) {
      const mv = Tutor.findMove(false, 'plane');
      if (mv) {
        Tutor.mark('makePlane');
        Tutor.guide = mv;
        Tutor.showHand(mv, true);
        Spot.show(mv.slice(0, 2).map(([r, c]) => B.grid[r][c].el), '같은 얼굴 넷을 네모로 모으면 종이비행기가 생겨! 여기를 쓱 밀어 봐', { tap: 'external', pad: 4 });
        return;
      }
    }
    const kinds = new Set();
    Board.each(B.grid, t => { if (t.block) kinds.add(t.block); if (t.lock) kinds.add('lock'); if (t.type === ING) kinds.add('ing'); });
    if (Board.syrup) kinds.add('syrup');
    ['box', 'bubble', 'lock', 'syrup', 'ing'].some(k => kinds.has(k) && !Tutor.seen(k) && (Tutor.tip(k), true));
  },
  // 첫 토벌: 괴물, 공격까지 남은 턴, 친구들, 체력을 차례로 비춤
  async battleIntro() {
    if (Tutor.seen('battleIntro')) return;
    Tutor.mark('battleIntro');
    B.busy = true;
    await Spot.show($('#monsterWrap'), '괴물이다…! 체력을 0으로 만들면 이겨');
    await Spot.show($('#countdown'), '이 숫자가 0이 되면 괴물이 공격해. 한 번 움직일 때마다 1씩 줄어', { pad: 10 });
    await Spot.show($('#party'), '같은 얼굴을 맞추면 그 친구가 공격! 빈자리는 응원 친구들이 채워 줘');
    await Spot.show($('#teamRow'), '이건 우리 체력. 0이 되면 후퇴야…');
    B.busy = false;
  },
  // 게이지가 처음 꽉 차면 그 친구를 비춰서 눌러 보게
  skillSpot() {
    if (Tutor.seen('skillSpot')) return false;
    if ($('#pause').classList.contains('show') || $('#modal').classList.contains('show')) return false;
    const el = B.mode === 'life' ? ($('#lhHelper').classList.contains('ready') ? $('#lhHelper') : null) : $('#party .pm.ready');
    if (!el) return false;
    Tutor.mark('skillSpot');
    Spot.show(el, '꽉 찼다! 톡 눌러서 스킬 써 보자~', { tap: true });
    return true;
  },
  onCreate(kind) {
    const k = kind === 'v' ? 'h' : kind;
    if (!Tutor.seen('lesson_' + k) && LESSON[k]) { Tutor.wait = k; return; }
    if (kind === 'plane') Tutor.tip(Tutor.seen('item') ? 'plane' : 'item');
    else if (kind === 'rainbow') Tutor.tip(Tutor.seen('item') ? 'rainbow' : 'item');
    else Tutor.tip('item');
  },
  // 꿈의집처럼: 새 아이템이 처음 생기면 그것만 밝게 비추고, 손가락으로 쓰는 법을 보여 주고, 그 수만 둘 수 있게
  lesson() {
    const k = Tutor.wait;
    if (!k || B.over || B.busy) return false;
    Tutor.wait = null;
    let at = null;
    Board.each(B.grid, (t, r, c) => { if (!at && t.special && (t.special === k || (k === 'h' && t.special === 'v'))) at = [r, c]; });
    if (!at) return false;
    const nb = NEAR4.map(([dr, dc]) => [at[0] + dr, at[1] + dc]).find(([r, c]) => inside(r, c) && movable(B.grid[r][c]) && !B.grid[r][c].special);
    if (!nb) return false;
    Tutor.mark('lesson_' + k);
    Tutor.guide = [at, nb];
    Tutor.guideItem = at;
    Tutor.showHand([at, nb], true);
    Spot.show([B.grid[at[0]][at[1]].el, B.grid[nb[0]][nb[1]].el], LESSON[k], { tap: 'external', pad: 4, who: k === 'rainbow' ? 'kurimanju' : 'hachiware' });
    return true;
  },
  // 아이템 배우기 중에는 그 아이템을 톡톡 눌러 쓰는 것도 허락
  allowItem([r, c]) {
    const g = Tutor.guideItem;
    if (!g || g[0] !== r || g[1] !== c) return false;
    Tutor.guide = Tutor.guideItem = null;
    Tutor.hideHand();
    Spot.close();
    return true;
  },
  // 첫 수 따라 하기 중이면 그 수만 허락
  allow(a, b) {
    const g = Tutor.guide;
    if (!g) return true;
    const ok = (a[0] === g[0][0] && a[1] === g[0][1] && b[0] === g[1][0] && b[1] === g[1][1]) || (a[0] === g[1][0] && a[1] === g[1][1] && b[0] === g[0][0] && b[1] === g[0][1]);
    if (ok) { if (!Tutor.guideItem) Tutor.mark('firstMove'); Tutor.guide = Tutor.guideItem = null; Tutor.hideHand(); Spot.close(); }
    return ok;
  },

  // 매치되는 수 하나 찾기 (잡초 옆이면 더 좋음)
  findMove(preferBlocks = false, makes = null) {
    const g = B.grid, moves = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) for (const [dr, dc] of [[0, 1], [1, 0]]) {
      const r2 = r + dr, c2 = c + dc;
      if (!inside(r2, c2) || !movable(g[r][c]) || !movable(g[r2][c2])) continue;
      Board.swap(g, [r, c], [r2, c2]);
      const runs = Board.findRuns(g);
      Board.swap(g, [r, c], [r2, c2]);
      if (!runs.length) continue;
      if (makes) {
        Board.swap(g, [r, c], [r2, c2]);
        const kinds = Board.groupRuns(Board.findRuns(g)).map(grp => Board.specialFor(grp, [[r, c], [r2, c2]])?.kind);
        Board.swap(g, [r, c], [r2, c2]);
        if (!kinds.includes(makes)) continue;
      }
      let score = runs.reduce((a, x) => a + x.cells.length, 0);
      if (preferBlocks) runs.forEach(x => x.cells.forEach(([rr, cc]) => NEAR4.forEach(([a, b]) => { if (g[rr + a]?.[cc + b]?.block) score += 3; })));
      moves.push([[r, c], [r2, c2], score]);
    }
    moves.sort((x, y) => y[2] - x[2]);
    return moves[0] || null;
  },

  // 손가락이 a에서 b로 쓱 (첫 수 안내와 힌트에 같이 씀)
  showHand([a, b], dim = false) {
    Tutor.hideHand();
    const pa = tileCenter(a[0], a[1]), pb = tileCenter(b[0], b[1]);
    const hand = new Image();
    hand.src = ITEM('hand');
    hand.className = 'hint-hand';
    Object.assign(hand.style, { left: pa.x + 'px', top: pa.y + 'px', width: B.S * 0.8 + 'px' });
    fx.appendChild(hand);
    hand.animate([
      { transform: 'translate(-30%, -10%) scale(1)', opacity: 0 },
      { transform: 'translate(-30%, -10%) scale(.9)', opacity: 1, offset: 0.2 },
      { transform: `translate(calc(-30% + ${pb.x - pa.x}px), calc(-10% + ${pb.y - pa.y}px)) scale(.9)`, opacity: 1, offset: 0.7 },
      { transform: `translate(calc(-30% + ${pb.x - pa.x}px), calc(-10% + ${pb.y - pa.y}px)) scale(1)`, opacity: 0 },
    ], { duration: 1300, iterations: Infinity, easing: 'ease-in-out' });
    [a, b].forEach(([r, c]) => B.grid[r][c]?.el?.classList.add('hinted'));
    if (dim) boardEl.classList.add('guiding');
    Tutor.hand = hand;
  },
  hideHand() {
    Tutor.hand?.remove();
    Tutor.hand = null;
    boardEl.classList.remove('guiding');
    boardEl.querySelectorAll('.hinted').forEach(e => e.classList.remove('hinted'));
  },

  // 6초 동안 아무것도 안 하면 둘 만한 수를 살짝 알려 줌
  poke() {
    clearTimeout(Tutor.idle);
    if (!Tutor.guide) Tutor.hideHand();
    Tutor.idle = setTimeout(() => {
      if (!$('#battle').classList.contains('active') || B.busy || B.over || Tutor.guide || $('#modal').classList.contains('show')) return Tutor.poke();
      const mv = Tutor.findMove();
      if (mv) Tutor.showHand(mv);
    }, 6000);
  },
};


// ---------- 스포트라이트: 눌러야 할 곳만 밝게, 나머지는 어둡게 ----------
// tap: false 아무 데나 톡 하면 다음 / true 그 자리를 눌러야 다음 / 'external' 밖에서 Spot.close()로 끝냄
const Spot = {
  finish: null,
  show(target, text, { tap = false, pad = 8, who = 'hachiware' } = {}) {
    Spot.close();
    const els = [].concat(target).filter(e => e && e.getClientRects().length); // 안 보이는 곳(다른 화면의 버튼 등)은 건너뜀
    if (!els.length) return Promise.resolve();
    return new Promise(done => {
      const a = app.getBoundingClientRect();
      const rs = els.map(e => e.getBoundingClientRect());
      const x1 = Math.max(0, Math.min(...rs.map(r => r.left)) - a.left - pad), y1 = Math.max(0, Math.min(...rs.map(r => r.top)) - a.top - pad);
      const x2 = Math.min(a.width, Math.max(...rs.map(r => r.right)) - a.left + pad), y2 = Math.min(a.height, Math.max(...rs.map(r => r.bottom)) - a.top + pad);
      const ov = document.createElement('div');
      ov.className = 'spot';
      const box = (cls, l, t, w, h) => `<i class="${cls}" style="left:${l}px;top:${t}px;width:${Math.max(0, w)}px;height:${Math.max(0, h)}px"></i>`;
      ov.innerHTML = box('hole', x1, y1, x2 - x1, y2 - y1) +
        box('blk', 0, 0, a.width, y1) + box('blk', 0, y2, a.width, a.height - y2) + box('blk', 0, y1, x1, y2 - y1) + box('blk', x2, y1, a.width - x2, y2 - y1) +
        (tap ? '' : box('blk', x1, y1, x2 - x1, y2 - y1)) +
        `<div class="spot-say"><img src="${FACE(who)}"><span>${text}</span>${tap ? '' : '<small>톡 눌러서 다음 ▶</small>'}</div>` +
        (tap === true ? `<img class="spot-hand" src="${ITEM('hand')}" style="left:${(x1 + x2) / 2}px;top:${(y1 + y2) / 2}px">` : '');
      app.appendChild(ov);
      // 말풍선은 비춘 곳 아래에 자리가 있으면 아래, 없으면 위
      const say = ov.querySelector('.spot-say');
      if (a.height - y2 > 150) say.style.top = y2 + 14 + 'px';
      else say.style.bottom = a.height - y1 + 14 + 'px';
      ov.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220 });
      say.animate([{ transform: 'translateY(10px) scale(.9)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 260, delay: 120, easing: 'cubic-bezier(.3,1.5,.6,1)', fill: 'backwards' });
      Sound.play('pop', 1.4, 0.5);
      let ended = false;
      const finish = () => {
        if (ended) return;
        ended = true;
        Spot.finish = null;
        els.forEach(e => e.removeEventListener('click', finish));
        ov.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' }).finished.then(() => ov.remove());
        done();
      };
      Spot.finish = finish;
      if (tap === true) els.forEach(e => e.addEventListener('click', finish));
      else if (!tap) setTimeout(() => (ov.onclick = () => { Sound.play('click', 1.3, 0.4); finish(); }), 300);
    });
  },
  close() { Spot.finish?.(); },
};

// ---------- 게임 밖 기능은 스테이지를 깰수록 하나씩 열림 ----------
const UNLOCKS = [
  { id: 'friends', btn: '#btnFriends', at: 2, text: '친구들 메뉴가 열렸어! 지금까지 만난 친구를 볼 수 있어' },
  { id: 'ramen', btn: '#btnRamen', at: 4, text: '라멘 가게가 열렸다는 거야!? 들어가 보자~' },
  { id: 'house', btn: '#btnHouse', at: 6, text: '친구네 집이 열렸어! 코인으로 집을 꾸밀 수 있어' },
  { id: 'gacha', btn: '#btnGacha', at: 8, text: '캡슐 뽑기가 열렸어! 친구 뽑기랑 옷 뽑기가 있어' },
  { id: 'challenge', btn: '#btnChallenge', at: 10, text: '도전 모드가 열렸어! 인어섬 탐험이랑 제초 대회~' },
];
// 들어가면 그 화면에서 비춰 줄 곳
const UNLOCK_INTRO = {
  friends: () => [['#friendsGrid .fcard', '친구를 꾹 누르면 스킬이랑 이야기를 볼 수 있어. 간식을 모으면 데려올 수 있는 친구도 있대!']],
  ramen: () => [['#shopMaster', '갑옷 아저씨네 라멘 가게야. 말 걸어 봐!'], ['#ramenMenu', '토벌을 새로 깰 때마다 한 그릇! 먹으면 다음 토벌이 편해져'], ['#shopShisa', '시사는 여기서 수행 중이야. 언젠가 같이 다닐지도~?']],
  house: () => [['#room .resident.owner', '친구를 꾹 잡고 끌면 원하는 자리로 옮길 수 있어'], ['.shop-wrap', '코인으로 가구를 사서 꾸미자~'], ['#btnMates', '같이 살 친구도 정할 수 있어!']],
  gacha: () => [['#btnPull', '코인 100개로 캡슐 하나! 뭐가 나올까~']],
  challenge: () => [['.ch-card.tower', '인어섬 탐험! 끝없이 올라가. 몇 층까지 갈 수 있을까?'], ['.ch-card.contest', '제초 대회! 60초 동안 최고 점수 내기~']],
};
const Unlock = {
  open: u => clearedCount() >= u.at,
  // 아래 메뉴: 아직 안 열린 건 자물쇠와 '몇 단계'
  dock() {
    UNLOCKS.forEach(u => {
      const b = $(u.btn);
      b.classList.toggle('locked', !Unlock.open(u));
      b.dataset.need = `${u.at}단계`;
    });
  },
  // 이미 하던 사람은 열려 있는 건 안내 없이 넘어감
  init() {
    if (Tutor.seen('unlockInit')) return;
    Save.data.tips = Save.data.tips || {};
    UNLOCKS.forEach(u => Unlock.open(u) && (Save.data.tips['u_' + u.id] = 1));
    if (clearedCount() > 0) ['mapFirst', 'firstMove', 'battleIntro', 'skillSpot', 'formIntro', 'opening'].forEach(k => (Save.data.tips[k] = 1));
    Tutor.mark('unlockInit');
  },
};
$('.dock').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b || !b.classList.contains('locked')) return;
  e.stopPropagation();
  e.preventDefault();
  Sound.play('bad', 1.1, 0.6);
  b.animate([{ transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }], { duration: 200 });
  const c = centerOf(b);
  floatNum(c.x, c.y - 40, `${b.dataset.need}를 깨면 열려요`, '#8a7fa6');
}, true);

// 지도를 열면: 처음이면 첫 칸을 비추고, 새로 열린 기능이 있으면 비추고, 5단계쯤엔 구글 계정 연결 권하기
Tutor.mapFlow = async function (delay) {
  Unlock.init();
  Unlock.dock();
  if (Tutor.busyFlow) return;
  Tutor.busyFlow = true;
  try {
    await sleep(delay);
    const ready = async () => { while ($('#modal').classList.contains('show') || $('#story').classList.contains('show') || $('#attend').classList.contains('show') || $('.join-show')) await sleep(300); return $('#map').classList.contains('active'); };
    if (!(await ready())) return;
    if (!Tutor.seen('mapFirst') && clearedCount() === 0) {
      Tutor.mark('mapFirst');
      await Spot.show($('#mapPath .node.current'), '여기 눌러서 첫 일 시작하자!', { tap: true });
      return;
    }
    const u = UNLOCKS.find(x => Unlock.open(x) && !Tutor.seen('u_' + x.id));
    if (u) {
      Tutor.mark('u_' + u.id);
      const b = $(u.btn);
      b.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.3) rotate(-8deg)' }, { transform: 'scale(1)' }], { duration: 420, easing: 'cubic-bezier(.3,1.6,.6,1)' });
      Sound.play('star', 1.2, 0.8);
      const c = centerOf(b);
      burst(c.x, c.y, '#ffd84d', 14);
      await sleep(350);
      await Spot.show(b, u.text, { tap: true });
      await sleep(800); // 화면이 넘어갈 때까지
      for (const [sel, text] of UNLOCK_INTRO[u.id]()) await Spot.show($(sel), text);
      return;
    }
    // 게스트로 5판, 15판을 깼을 때 한 번씩 (나중에를 눌러도 그 단계는 다시 안 물어봄)
    const linkTip = clearedCount() >= 15 ? 'google15' : clearedCount() >= 5 ? 'google' : null;
    if (linkTip && !Tutor.seen(linkTip) && typeof Net !== 'undefined' && Net.ready && (!Net.user || Net.user.isAnonymous)) {
      Tutor.mark(linkTip);
      modal({
        title: '기록 지키기', char: 'hachiware', text: '하치와레: 구글 계정을 연결하면 폰을 바꿔도 이어서 할 수 있어! 랭킹에도 올라가고~',
        btn2: '나중에', on2: () => {}, btn1: '연결하기', on1: () => Net.google(),
      });
    }
  } finally { Tutor.busyFlow = false; }
};
// 첫 편성: 슬롯과 출격 버튼
Tutor.formIntro = async function () {
  if (Tutor.seen('formIntro')) return;
  Tutor.mark('formIntro');
  await sleep(600);
  await Spot.show($('#formRoster'), '같이 갈 친구를 톡 눌러서 넣고 빼. 꾹 누르면 자세히 볼 수 있어');
  await Spot.show($('#btnSortie'), '준비됐으면 출격!', { tap: true });
};

// ---------- 처음 시작할 때 짧은 컷씬: 그림이 천천히 움직이고 자막이 한 줄씩 ----------
const CINE = [
  { img: 'assets/img/art/title.jpg', text: '어느 들판 마을에,', pan: ['scale(1.25) translateY(8%)', 'scale(1.1) translateY(-4%)'] },
  { img: 'assets/img/art/pose_chiikawa.png', fit: 'contain', bg: '#fff3f7', text: '작고 귀여운 녀석이 살고 있었어요.', pan: ['scale(.8) translateY(6%)', 'scale(.95)'] },
  { img: 'assets/img/art/scene_scared.jpg', text: '세상엔 무서운 것도 많고,', pan: ['scale(1.05)', 'scale(1.2) translateX(-4%)'] },
  { img: 'assets/img/art/scene_goblins.jpg', text: '토벌해야 할 녀석들도 잔뜩이지만…', pan: ['scale(1.3) translateX(6%)', 'scale(1.3) translateX(-6%)'] },
  { img: 'assets/img/art/scene_pajama_dance.jpg', text: '친구들이 하나둘 모이면 괜찮아!', pan: ['scale(1.3)', 'scale(1.1)'] },
];
const Cine = {
  play(scenes) {
    return new Promise(done => {
      const el = document.createElement('div');
      el.className = 'cine';
      el.innerHTML = '<div class="cine-img"></div><i class="bar top"></i><i class="bar bot"></i><p class="cine-text"></p><button class="cine-skip">건너뛰기 ▶▶</button><div class="cine-logo"><small>먼작귀</small><b>퍼즐 토벌<br>대작전!</b></div>';
      app.appendChild(el);
      const imgBox = el.querySelector('.cine-img'), txt = el.querySelector('.cine-text');
      let k = -1, timer = null, ended = false;
      const end = () => {
        if (ended) return;
        ended = true;
        clearTimeout(timer);
        el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' }).finished.then(() => { el.remove(); done(); });
      };
      const logo = () => {
        imgBox.innerHTML = '';
        txt.textContent = '';
        const lg = el.querySelector('.cine-logo');
        lg.style.display = 'block';
        lg.animate([{ transform: 'translate(-50%,-50%) scale(2.4) rotate(-12deg)', opacity: 0 }, { transform: 'translate(-50%,-50%) scale(.92) rotate(-4deg)', opacity: 1, offset: 0.7 }, { transform: 'translate(-50%,-50%) scale(1) rotate(-4deg)', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.6,0,.9,.6)', fill: 'forwards' });
        setTimeout(() => { Sound.play('hit1', 0.8, 0.9); Sound.play('jingle_start', 1, 0.8); shake(8, 260); flash('#ffffff', 0.5); confetti(14); }, 300);
        timer = setTimeout(end, 2200);
      };
      const next = () => {
        clearTimeout(timer);
        k++;
        if (k > scenes.length) return end();
        if (k === scenes.length) return logo();
        const sc = scenes[k];
        const im = new Image();
        im.src = sc.img;
        im.className = sc.fit === 'contain' ? 'contain' : '';
        imgBox.style.background = sc.bg || '#2a2440';
        const old = imgBox.querySelector('img');
        imgBox.appendChild(im);
        im.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, fill: 'backwards' });
        im.animate([{ transform: sc.pan[0] }, { transform: sc.pan[1] }], { duration: 3400, easing: 'ease-out', fill: 'forwards' });
        if (old) old.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, fill: 'forwards' }).finished.then(() => old.remove());
        txt.textContent = '';
        let n = 0;
        const typer = setInterval(() => { txt.textContent = sc.text.slice(0, ++n); if (n >= sc.text.length) clearInterval(typer); }, 55);
        Sound.play('click', 1.6, 0.3);
        timer = setTimeout(next, 3000);
      };
      el.querySelector('.cine-skip').onclick = e => { e.stopPropagation(); Sound.play('click'); end(); };
      el.onclick = () => (k >= scenes.length ? end() : next());
      [el.querySelector('.bar.top'), el.querySelector('.bar.bot')].forEach((b, j) => b.animate([{ transform: `translateY(${j ? 100 : -100}%)` }, { transform: 'none' }], { duration: 500, easing: 'ease-out' }));
      Sound.music('map');
      setTimeout(next, 300);
    });
  },
};
