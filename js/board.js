// 3매치 판 로직 (화면과 분리)
// 타일: { id, type, special }
//   type 0~: 캐릭터 구슬, -1: 무지개, -2: 재료(ing, 맨 밑으로 떨구면 모임), -3: 장애물(block: 'box'|'bubble', hp)
//   special: null|'h'|'v'|'bomb'|'rainbow'|'plane'
//   lock: 리본에 묶인 구슬. 못 움직이고, 한 번 터뜨리면 리본만 풀림
const ROWS = 7, COLS = 7;
let NTYPES = 7; // 편성 인원에 맞춰 출격 때 바뀜
const ING = -2, BLOCK = -3;
let nextTileId = 1;
const newTile = (type, special = null) => ({ id: nextTileId++, type, special });
const newIng = ing => ({ id: nextTileId++, type: ING, special: null, ing });
const newBlock = (block, hp = 1) => ({ id: nextTileId++, type: BLOCK, special: null, block, hp });
const randType = () => Math.floor(Math.random() * NTYPES);
const key = (r, c) => r * COLS + c;
const unkey = k => [Math.floor(k / COLS), k % COLS];
const inside = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS;
const movable = t => !!t && !t.block && !t.lock;
const NEAR4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// 판 모양: mask[r][c]가 false인 칸은 판에 없는 구멍
const hole = (r, c) => !!Board.mask && !Board.mask[r][c];

const Board = {
  mask: null,     // 판 모양 (없으면 7x7 꽉 찬 판)
  floor: null,    // 잡초: floor[r][c] = 남은 겹 수 (일상 퍼즐에서만)
  syrup: null,    // 시럽: syrup[r][c] = 발렸는지. 시럽 칸이 낀 매치는 그 칸들에 시럽을 번지게 함
  spawnIng: null, // 새 칸을 채울 때 재료를 낼지: () => 재료 이름 | null

  // spec: { blocks: [[r, c, 'box'|'bubble', hp]], ings: [[r, c, 이름]], locks: [[r, c]] }
  create(spec = {}) {
    let g;
    do {
      g = Array.from({ length: ROWS }, () => new Array(COLS).fill(null));
      (spec.blocks || []).forEach(([r, c, b, hp]) => (g[r][c] = newBlock(b, hp)));
      (spec.ings || []).forEach(([r, c, n]) => (g[r][c] = newIng(n)));
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        if (g[r][c] || hole(r, c)) continue;
        let t, tries = 0;
        do t = randType();
        while (Board.makesMatch(g, r, c, t) && ++tries < 40);
        g[r][c] = newTile(t);
      }
      (spec.locks || []).forEach(([r, c]) => { if (g[r][c]?.type >= 0) g[r][c].lock = 1; });
    } while (!Board.hasMove(g) || Board.findRuns(g).length);
    return g;
  },

  // 왼쪽, 위에서 채운 칸만 보고 t를 놓으면 줄이나 네모가 되는지
  makesMatch(g, r, c, t) {
    const ty = (rr, cc) => (inside(rr, cc) ? g[rr][cc]?.type : undefined);
    return (ty(r, c - 1) === t && ty(r, c - 2) === t) ||
      (ty(r - 1, c) === t && ty(r - 2, c) === t) ||
      (ty(r, c - 1) === t && ty(r - 1, c) === t && ty(r - 1, c - 1) === t);
  },

  // 가로/세로 3개 이상 연속, 그리고 2x2 네모
  findRuns(g) {
    const runs = [];
    const scan = (dir) => {
      const outer = dir === 'h' ? ROWS : COLS, inner = dir === 'h' ? COLS : ROWS;
      for (let a = 0; a < outer; a++) {
        let s = 0;
        while (s < inner) {
          const at = i => (dir === 'h' ? g[a][i] : g[i][a]);
          const t = at(s)?.type;
          let e = s + 1;
          while (t >= 0 && e < inner && at(e)?.type === t) e++;
          if (t >= 0 && e - s >= 3) {
            const cells = [];
            for (let i = s; i < e; i++) cells.push(dir === 'h' ? [a, i] : [i, a]);
            runs.push({ dir, type: t, cells });
          }
          s = e;
        }
      }
    };
    scan('h'); scan('v');
    for (let r = 0; r < ROWS - 1; r++) for (let c = 0; c < COLS - 1; c++) {
      const t = g[r][c]?.type;
      if (t >= 0 && g[r][c + 1]?.type === t && g[r + 1][c]?.type === t && g[r + 1][c + 1]?.type === t)
        runs.push({ dir: 'sq', type: t, cells: [[r, c], [r, c + 1], [r + 1, c], [r + 1, c + 1]] });
    }
    return runs;
  },

  // 칸을 공유하는 줄끼리 묶음 (L, T 모양 판정용)
  groupRuns(runs) {
    const parent = runs.map((_, i) => i);
    const find = i => (parent[i] === i ? i : (parent[i] = find(parent[i])));
    const owner = new Map();
    runs.forEach((run, i) => run.cells.forEach(([r, c]) => {
      const k = key(r, c);
      if (owner.has(k)) parent[find(i)] = find(owner.get(k)); else owner.set(k, i);
    }));
    const groups = new Map();
    runs.forEach((run, i) => {
      const root = find(i);
      if (!groups.has(root)) groups.set(root, { type: run.type, runs: [], keys: new Set() });
      const grp = groups.get(root);
      grp.runs.push(run);
      run.cells.forEach(([r, c]) => grp.keys.add(key(r, c)));
    });
    return [...groups.values()];
  },

  // 5개: 무지개(쿠리만쥬), L/T: 폭탄, 4개: 줄폭탄, 2x2 네모: 비행기
  specialFor(grp, swapped) {
    const lines = grp.runs.filter(r => r.dir !== 'sq');
    const maxLen = Math.max(0, ...lines.map(r => r.cells.length));
    const hasH = lines.some(r => r.dir === 'h'), hasV = lines.some(r => r.dir === 'v');
    let kind = null;
    if (maxLen >= 5) kind = 'rainbow';
    else if (hasH && hasV) kind = 'bomb';
    else if (maxLen === 4) kind = lines.find(r => r.cells.length === 4).dir;
    else if (grp.runs.some(r => r.dir === 'sq')) kind = 'plane';
    if (!kind) return null;
    let pos = (swapped || []).find(([r, c]) => grp.keys.has(key(r, c)));
    if (!pos && kind === 'bomb') {
      const hk = new Set(lines.filter(r => r.dir === 'h').flatMap(r => r.cells.map(([a, b]) => key(a, b))));
      const v = lines.filter(r => r.dir === 'v').flatMap(r => r.cells).find(([a, b]) => hk.has(key(a, b)));
      if (v) pos = v;
    }
    if (!pos) {
      const longest = (lines.length ? lines : grp.runs).reduce((a, b) => (b.cells.length > a.cells.length ? b : a));
      pos = longest.cells[Math.floor(longest.cells.length / 2)];
    }
    // 리본 묶인 칸에는 아이템을 안 만듦 (풀린 구슬이 그대로 남으니까)
    if (grp.locked?.has(key(pos[0], pos[1]))) {
      pos = [...grp.keys].map(unkey).find(([r, c]) => !grp.locked.has(key(r, c)));
      if (!pos) return null;
    }
    return { pos, kind, type: -1 }; // 아이템은 색이 없음
  },

  // avoid: 이미 지울 칸 (비행기가 그쪽으로는 안 날아감)
  effectCells(g, t, r, c, avoid = new Set()) {
    const out = [];
    if (t.special === 'h') for (let i = 0; i < COLS; i++) out.push([r, i]);
    else if (t.special === 'v') for (let i = 0; i < ROWS; i++) out.push([i, c]);
    else if (t.special === 'bomb') {
      for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++)
        if (Math.abs(dr) + Math.abs(dc) <= 2 && inside(r + dr, c + dc)) out.push([r + dr, c + dc]);
    } else if (t.special === 'rainbow') {
      const type = Board.commonType(g);
      Board.each(g, (tt, rr, cc) => { if (tt.type === type) out.push([rr, cc]); });
    } else if (t.special === 'plane') {
      out.push([r, c]);
      NEAR4.forEach(([dr, dc]) => inside(r + dr, c + dc) && out.push([r + dr, c + dc]));
      const skip = new Set([...avoid, ...out.map(([a, b]) => key(a, b))]);
      t.target = Board.pickTarget(g, skip);
      if (t.target) out.push(t.target);
    }
    return out;
  },

  // 비행기가 날아갈 곳: 장애물 > 잡초 > 재료 바로 밑 > 아무 구슬
  pickTarget(g, avoid = new Set()) {
    const tiers = [[], [], [], []];
    Board.each(g, (t, r, c) => {
      if (avoid.has(key(r, c))) return;
      if (t.block || t.lock) tiers[0].push([r, c]);
      else if ((Board.floor?.[r][c] > 0 || (Board.syrup && !Board.syrup[r][c])) && t.type !== ING) tiers[1].push([r, c]);
      else if (t.type >= 0 && r > 0 && g[r - 1][c]?.type === ING) tiers[2].push([r, c]);
      else if (t.type >= 0) tiers[3].push([r, c]);
    });
    const tier = tiers.find(x => x.length);
    return tier ? tier[Math.floor(Math.random() * tier.length)] : null;
  },

  commonType(g) {
    const n = new Array(NTYPES).fill(0);
    Board.each(g, t => { if (t.type >= 0) n[t.type]++; });
    return n.indexOf(Math.max(...n));
  },

  each(g, fn) {
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (g[r][c]) fn(g[r][c], r, c);
  },

  // 특수 구슬끼리, 또는 무지개를 바꿨을 때. 강제로 지울 칸 목록을 돌려줌 (없으면 null)
  swapCombo(g, a, b) {
    const ta = g[a[0]][a[1]], tb = g[b[0]][b[1]];
    const out = [];
    const all = () => Board.each(g, (t, r, c) => out.push([r, c]));
    if (ta.special === 'rainbow' && tb.special === 'rainbow') {
      ta.special = tb.special = null; all();
      return { cells: out, kind: 'rainbow2', at: b };
    }
    if (ta.special === 'rainbow' || tb.special === 'rainbow') {
      const [rb, other, rpos] = ta.special === 'rainbow' ? [ta, tb, a] : [tb, ta, b];
      rb.special = null;
      out.push(rpos);
      // 재료와 바꾸면 제일 많은 색을 지움
      const type = other.type >= 0 ? other.type : Board.commonType(g);
      const conv = other.special && other.special !== 'rainbow' ? other.special : null;
      Board.each(g, (t, r, c) => {
        if (t.type !== type) return;
        if (conv && t !== other && !t.lock) t.special = conv === 'h' || conv === 'v' ? (Math.random() < 0.5 ? 'h' : 'v') : conv;
        out.push([r, c]);
      });
      return { cells: out, kind: 'rainbow', at: rpos, type, converted: !!conv };
    }
    if (ta.special && tb.special) {
      const sa = ta.special, sb = tb.special;
      const kinds = [sa, sb].sort().join('+');
      ta.special = tb.special = null;
      const [r0, c0] = b;
      const add = (r, c) => inside(r, c) && out.push([r, c]);
      if (kinds.includes('plane')) {
        // 비행기 + 무엇: 그 자리 십자로 터지고, 비행기가 상대 아이템을 싣고 날아감. 비행기끼리면 셋이 날아감
        add(r0, c0);
        NEAR4.forEach(([dr, dc]) => add(r0 + dr, c0 + dc));
        out.push(a);
        const carry = kinds === 'plane+plane' ? null : sa === 'plane' ? sb : sa;
        const avoid = new Set(out.map(([r, c]) => key(r, c)));
        const planes = [];
        for (let i = 0; i < (carry ? 1 : 3); i++) {
          const tg = Board.pickTarget(g, avoid);
          if (!tg) break;
          avoid.add(key(tg[0], tg[1]));
          planes.push(tg);
          if (carry) out.push(...Board.effectCells(g, { special: carry }, tg[0], tg[1]));
          else out.push(tg);
        }
        return { cells: out, kind: kinds, at: b, planes, carry };
      }
      if (kinds === 'bomb+bomb') {
        for (let dr = -3; dr <= 3; dr++) for (let dc = -3; dc <= 3; dc++) add(r0 + dr, c0 + dc);
      } else if (kinds.includes('bomb')) {
        for (let d = -1; d <= 1; d++) { for (let i = 0; i < COLS; i++) add(r0 + d, i); for (let i = 0; i < ROWS; i++) add(i, c0 + d); }
      } else {
        for (let i = 0; i < COLS; i++) add(r0, i);
        for (let i = 0; i < ROWS; i++) add(i, c0);
      }
      out.push(a);
      return { cells: out, kind: kinds, at: b };
    }
    return null;
  },

  // 한 단계 터뜨리기. 판을 바꾸고 무엇이 지워지고 생겼는지 돌려줌
  // 장애물은 매치 바로 옆이거나 효과 범위에 들면 한 대 맞고, 재료는 안 터짐. 잡초는 위의 것이 터지면 한 겹 뽑힘
  resolve(g, swapped, forced = []) {
    const groups = Board.groupRuns(Board.findRuns(g));
    const clear = new Set(), matched = new Set();
    const creates = [];
    const syrupKeys = new Set();
    const hasSyrup = ks => Board.syrup && ks.some(k => { const [r, c] = unkey(k); return Board.syrup[r][c]; });
    groups.forEach(grp => {
      grp.keys.forEach(k => { clear.add(k); matched.add(k); });
      grp.locked = new Set([...grp.keys].filter(k => { const [r, c] = unkey(k); return g[r][c]?.lock; }));
      if (hasSyrup([...grp.keys])) grp.keys.forEach(k => syrupKeys.add(k));
      const sp = Board.specialFor(grp, swapped);
      if (sp) creates.push(sp);
    });
    const forcedKeys = forced.filter(([r, c]) => inside(r, c)).map(([r, c]) => key(r, c));
    forcedKeys.forEach(k => clear.add(k));
    if (hasSyrup(forcedKeys)) forcedKeys.forEach(k => syrupKeys.add(k));
    if (!clear.size) return null;

    const effects = [];
    const fired = new Set();
    const queue = [...clear];
    while (queue.length) {
      const [r, c] = unkey(queue.pop());
      const t = g[r][c];
      if (!t || !t.special || fired.has(t.id)) continue;
      fired.add(t.id);
      const cells = Board.effectCells(g, t, r, c, clear);
      effects.push({ kind: t.special, r, c, type: t.type, target: t.target });
      if (Board.syrup?.[r][c] || syrupKeys.has(key(r, c))) cells.forEach(([rr, cc]) => syrupKeys.add(key(rr, cc)));
      cells.forEach(([rr, cc]) => {
        const k = key(rr, cc);
        if (!clear.has(k)) { clear.add(k); queue.push(k); }
      });
    }

    const hitKeys = new Set();
    matched.forEach(k => {
      const [r, c] = unkey(k);
      NEAR4.forEach(([dr, dc]) => inside(r + dr, c + dc) && g[r + dr][c + dc]?.block && hitKeys.add(key(r + dr, c + dc)));
    });
    clear.forEach(k => { const [r, c] = unkey(k); if (g[r][c]?.block) hitKeys.add(k); });

    const cleared = [], hits = [], weeds = [], unlocked = [], syrup = [];
    const pullWeed = (r, c) => {
      if (Board.floor?.[r][c] > 0) weeds.push({ r, c, left: --Board.floor[r][c] });
    };
    clear.forEach(k => {
      const [r, c] = unkey(k);
      const t = g[r][c];
      if (!t || t.block || t.type === ING) return;
      if (t.lock) { t.lock = 0; unlocked.push({ r, c, tile: t }); pullWeed(r, c); return; }
      cleared.push({ r, c, tile: t });
      g[r][c] = null;
      pullWeed(r, c);
    });
    hitKeys.forEach(k => {
      const [r, c] = unkey(k);
      const t = g[r][c];
      const gone = --t.hp <= 0;
      hits.push({ r, c, tile: t, gone });
      if (gone) { g[r][c] = null; pullWeed(r, c); }
    });
    const created = creates.map(sp => {
      const t = newTile(sp.type, sp.kind);
      g[sp.pos[0]][sp.pos[1]] = t;
      return { r: sp.pos[0], c: sp.pos[1], tile: t };
    });
    syrupKeys.forEach(k => {
      const [r, c] = unkey(k);
      if (Board.syrup && !hole(r, c) && !Board.syrup[r][c]) { Board.syrup[r][c] = true; syrup.push({ r, c }); }
    });
    return { cleared, created, effects, hits, weeds, unlocked, syrup };
  },

  // 빈칸 메우기. 한 칸씩 박자(tick)로 움직이고, 장애물 밑은 옆 위에서 비스듬히 채움
  // 반환: [{ tile, fresh, path: [[r, c, tick], ...] }]
  gravity(g) {
    const paths = new Map();
    const rec = (t, r0, c0, r1, c1, tick) => {
      let p = paths.get(t.id);
      if (!p) paths.set(t.id, (p = { tile: t, path: [[r0, c0, tick]] }));
      else if (p.path[p.path.length - 1][2] < tick) p.path.push([r0, c0, tick]);
      p.path.push([r1, c1, tick + 1]);
    };
    // 새 구슬은 칸마다 맨 위 판 칸에서 나옴
    const top = Array.from({ length: COLS }, (_, c) => { let r = 0; while (r < ROWS && hole(r, c)) r++; return r; });
    const openAbove = (r, c) => {
      for (let rr = r - 1; rr >= top[c]; rr--) if ((g[rr][c] && !movable(g[rr][c])) || hole(rr, c)) return false;
      return true;
    };
    const spawn = () => {
      const ing = Board.spawnIng && Board.spawnIng();
      return ing ? newIng(ing) : newTile(randType());
    };
    for (let tick = 0; tick < 80; tick++) {
      let moved = false;
      for (let r = ROWS - 2; r >= 0; r--) for (let c = 0; c < COLS; c++) {
        const t = g[r][c];
        if (movable(t) && !g[r + 1][c] && !hole(r + 1, c)) {
          g[r + 1][c] = t; g[r][c] = null;
          rec(t, r, c, r + 1, c, tick);
          moved = true;
        }
      }
      for (let c = 0; c < COLS; c++) {
        const r0 = top[c];
        if (r0 >= ROWS || g[r0][c]) continue;
        const t = spawn();
        g[r0][c] = t;
        paths.set(t.id, { tile: t, fresh: true, path: [[r0 - 1, c, tick], [r0, c, tick + 1]] });
        moved = true;
      }
      if (moved) continue;
      for (let r = ROWS - 1; r >= 1 && !moved; r--) for (let c = 0; c < COLS; c++) {
        if (g[r][c] || hole(r, c) || openAbove(r, c)) continue;
        for (const dc of Math.random() < 0.5 ? [-1, 1] : [1, -1]) {
          const t = inside(r - 1, c + dc) ? g[r - 1][c + dc] : null;
          if (!movable(t)) continue;
          g[r][c] = t; g[r - 1][c + dc] = null;
          rec(t, r - 1, c + dc, r, c, tick);
          moved = true;
          break;
        }
      }
      if (moved) continue;
      // 위가 다 막힌 칸은 옆에서 미끄러져 들어옴 (옆 칸은 다시 채워질 수 있을 때만)
      const fed = (r, c) => openAbove(r, c) || [-1, 1].some(dc => inside(r - 1, c + dc) && movable(g[r - 1][c + dc]));
      for (let r = ROWS - 1; r >= 0 && !moved; r--) for (let c = 0; c < COLS; c++) {
        if (g[r][c] || hole(r, c) || fed(r, c)) continue;
        for (const dc of [-1, 1]) {
          const t = inside(r, c + dc) ? g[r][c + dc] : null;
          if (!movable(t) || !fed(r, c + dc)) continue;
          g[r][c] = t; g[r][c + dc] = null;
          rec(t, r, c + dc, r, c, tick);
          moved = true;
          break;
        }
      }
      if (!moved) break;
    }
    return [...paths.values()];
  },

  // 바닥까지 내려온 재료를 거둠 (밑이 전부 장애물이나 구멍이어도 바닥으로 침)
  collectIngs(g) {
    const got = [];
    Board.each(g, (t, r, c) => {
      if (t.type !== ING) return;
      for (let rr = r + 1; rr < ROWS; rr++) if (!g[rr][c]?.block && !hole(rr, c)) return;
      got.push({ r, c, tile: t });
    });
    got.forEach(({ r, c }) => (g[r][c] = null));
    return got;
  },

  // 거품이 옆 구슬 하나를 덮음
  spreadBubble(g) {
    const cand = [];
    Board.each(g, (t, r, c) => {
      if (t.block !== 'bubble') return;
      NEAR4.forEach(([dr, dc]) => {
        const n = inside(r + dr, c + dc) ? g[r + dr][c + dc] : null;
        if (n && n.type >= 0 && !n.special && !n.lock) cand.push([r + dr, c + dc]);
      });
    });
    if (!cand.length) return null;
    const [r, c] = cand[Math.floor(Math.random() * cand.length)];
    const old = g[r][c];
    g[r][c] = newBlock('bubble', 1);
    return { r, c, old, tile: g[r][c] };
  },

  swap(g, a, b) {
    const t = g[a[0]][a[1]];
    g[a[0]][a[1]] = g[b[0]][b[1]];
    g[b[0]][b[1]] = t;
  },

  // 아이템이 있으면 눌러서 쓸 수 있으니 수가 있는 것
  hasMove(g) {
    let item = false;
    Board.each(g, t => { if (t.special) item = true; });
    if (item) return true;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (!movable(g[r][c])) continue;
      for (const [dr, dc] of [[0, 1], [1, 0]]) {
        const r2 = r + dr, c2 = c + dc;
        if (!inside(r2, c2) || !movable(g[r2][c2])) continue;
        Board.swap(g, [r, c], [r2, c2]);
        const ok = Board.findRuns(g).length > 0;
        Board.swap(g, [r, c], [r2, c2]);
        if (ok) return true;
      }
    }
    return false;
  },

  // 몬스터가 구슬 n개를 상자로 바꿈 (토벌 미믹)
  dropBoxes(g, n) {
    const cand = [];
    Board.each(g, (t, r, c) => { if (t.type >= 0 && !t.special && !t.lock) cand.push([r, c]); });
    const out = [];
    for (let i = 0; i < n && cand.length; i++) {
      const [r, c] = cand.splice(Math.floor(Math.random() * cand.length), 1)[0];
      out.push({ r, c, old: g[r][c], tile: (g[r][c] = newBlock('box', 1)) });
    }
    return out;
  },

  // 섞기: 구슬끼리 위치만 바꿈 (장애물, 재료는 제자리)
  shuffle(g) {
    const cells = [];
    Board.each(g, (t, r, c) => { if (movable(t) && t.type !== ING) cells.push([r, c]); });
    const tiles = cells.map(([r, c]) => g[r][c]);
    for (let tries = 0; tries < 200; tries++) {
      for (let i = tiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
      }
      cells.forEach(([r, c], i) => (g[r][c] = tiles[i]));
      if (!Board.findRuns(g).length && Board.hasMove(g)) return;
    }
    tiles.forEach(t => { if (!t.special) t.type = randType(); });
  },
};
