// 처음 하는 사람 돕기: 첫 이야기, 첫 수 따라 하기, 처음 보는 것 짧은 안내, 오래 멈추면 힌트
const OPENING = [
  ['hachiware', '치이카와! 게시판에 새 일거리가 붙었어.'],
  ['chiikawa', '…!'],
  ['hachiware', '오늘은 풀 뽑기야. 끝나면 같이 라멘 먹으러 가자!'],
  ['usagi', '우라!'],
  ['chiikawa', '(끄덕끄덕)'],
];
// 처음 볼 때 한 번만 뜨는 안내: [아이콘, 한 줄]
const TIPS = {
  item: ['rocket', '아이템은 톡톡 두 번 누르거나, 아무 쪽으로 쓱 밀면 터져요'],
  plane: ['plane', '비행기는 목표 쪽으로 날아가요'],
  rainbow: ['rainbow', '무지개는 바꾼 얼굴을 전부 지워요'],
  skill: ['sparkle', '동그라미가 꽉 차면 얼굴을 톡! 스킬을 써요'],
  battle: ['boom', '같은 얼굴을 맞추면 그 친구가 공격해요. 숫자는 몬스터가 공격할 때까지 남은 턴'],
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
  onStart() {
    if (B.mode === 'battle') { Tutor.tip('battle'); return; }
    const kinds = new Set();
    Board.each(B.grid, t => { if (t.block) kinds.add(t.block); if (t.lock) kinds.add('lock'); if (t.type === ING) kinds.add('ing'); });
    if (Board.syrup) kinds.add('syrup');
    ['box', 'bubble', 'lock', 'syrup', 'ing'].some(k => kinds.has(k) && !Tutor.seen(k) && (Tutor.tip(k), true));
    // 맨 첫 판: 첫 수를 손가락으로 알려 주고 그 수만 둘 수 있게
    if (L.run?.kind === 'route' && L.i === 0 && !Tutor.seen('firstMove')) {
      const mv = Tutor.findMove(true);
      if (mv) { Tutor.guide = mv; Tutor.showHand(mv, true); }
    }
  },
  onCreate(kind) {
    if (kind === 'plane') Tutor.tip(Tutor.seen('item') ? 'plane' : 'item');
    else if (kind === 'rainbow') Tutor.tip(Tutor.seen('item') ? 'rainbow' : 'item');
    else Tutor.tip('item');
  },
  // 첫 수 따라 하기 중이면 그 수만 허락
  allow(a, b) {
    const g = Tutor.guide;
    if (!g) return true;
    const ok = (a[0] === g[0][0] && a[1] === g[0][1] && b[0] === g[1][0] && b[1] === g[1][1]) || (a[0] === g[1][0] && a[1] === g[1][1] && b[0] === g[0][0] && b[1] === g[0][1]);
    if (ok) { Tutor.guide = null; Tutor.mark('firstMove'); Tutor.hideHand(); }
    return ok;
  },

  // 매치되는 수 하나 찾기 (잡초 옆이면 더 좋음)
  findMove(preferBlocks = false) {
    const g = B.grid, moves = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) for (const [dr, dc] of [[0, 1], [1, 0]]) {
      const r2 = r + dr, c2 = c + dc;
      if (!inside(r2, c2) || !movable(g[r][c]) || !movable(g[r2][c2])) continue;
      Board.swap(g, [r, c], [r2, c2]);
      const runs = Board.findRuns(g);
      Board.swap(g, [r, c], [r2, c2]);
      if (!runs.length) continue;
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
