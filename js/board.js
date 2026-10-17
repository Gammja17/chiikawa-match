// 3매치 판 로직 (화면과 분리). 타일: { id, type(0~5, 무지개는 -1), special: null|'h'|'v'|'bomb'|'rainbow' }
const ROWS = 7, COLS = 7, NTYPES = 6;
let nextTileId = 1;
const newTile = (type, special = null) => ({ id: nextTileId++, type, special });
const randType = () => Math.floor(Math.random() * NTYPES);
const key = (r, c) => r * COLS + c;
const unkey = k => [Math.floor(k / COLS), k % COLS];
const inside = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS;

const Board = {
  create() {
    let g;
    do {
      g = [];
      for (let r = 0; r < ROWS; r++) {
        g.push([]);
        for (let c = 0; c < COLS; c++) {
          let t;
          do t = randType();
          while ((c >= 2 && g[r][c - 1].type === t && g[r][c - 2].type === t) ||
                 (r >= 2 && g[r - 1][c].type === t && g[r - 2][c].type === t));
          g[r].push(newTile(t));
        }
      }
    } while (!Board.hasMove(g));
    return g;
  },

  // 가로/세로 3개 이상 연속
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

  // 4개: 줄폭탄, L/T: 폭탄, 5개: 무지개(쿠리만쥬)
  specialFor(grp, swapped) {
    const maxLen = Math.max(...grp.runs.map(r => r.cells.length));
    const hasH = grp.runs.some(r => r.dir === 'h'), hasV = grp.runs.some(r => r.dir === 'v');
    let kind = null;
    if (maxLen >= 5) kind = 'rainbow';
    else if (hasH && hasV) kind = 'bomb';
    else if (maxLen === 4) kind = grp.runs[0].dir;
    if (!kind) return null;
    let pos = (swapped || []).find(([r, c]) => grp.keys.has(key(r, c)));
    if (!pos && kind === 'bomb') {
      const hk = new Set(grp.runs.filter(r => r.dir === 'h').flatMap(r => r.cells.map(([a, b]) => key(a, b))));
      const v = grp.runs.filter(r => r.dir === 'v').flatMap(r => r.cells).find(([a, b]) => hk.has(key(a, b)));
      if (v) pos = v;
    }
    if (!pos) {
      const longest = grp.runs.reduce((a, b) => (b.cells.length > a.cells.length ? b : a));
      pos = longest.cells[Math.floor(longest.cells.length / 2)];
    }
    return { pos, kind, type: kind === 'rainbow' ? -1 : grp.type };
  },

  effectCells(g, t, r, c) {
    const out = [];
    if (t.special === 'h') for (let i = 0; i < COLS; i++) out.push([r, i]);
    else if (t.special === 'v') for (let i = 0; i < ROWS; i++) out.push([i, c]);
    else if (t.special === 'bomb') {
      for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++)
        if (Math.abs(dr) + Math.abs(dc) <= 2 && inside(r + dr, c + dc)) out.push([r + dr, c + dc]);
    } else if (t.special === 'rainbow') {
      const type = Board.commonType(g);
      Board.each(g, (tt, rr, cc) => { if (tt.type === type) out.push([rr, cc]); });
    }
    return out;
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
      Board.each(g, (t, r, c) => {
        if (t.type !== other.type) return;
        if (other.special && t !== other) t.special = other.special === 'bomb' ? 'bomb' : (Math.random() < 0.5 ? 'h' : 'v');
        out.push([r, c]);
      });
      return { cells: out, kind: 'rainbow', at: rpos, type: other.type, converted: !!other.special };
    }
    if (ta.special && tb.special) {
      const kinds = [ta.special, tb.special].sort().join('+');
      ta.special = tb.special = null;
      const [r0, c0] = b;
      const add = (r, c) => inside(r, c) && out.push([r, c]);
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
  resolve(g, swapped, forced = []) {
    const groups = Board.groupRuns(Board.findRuns(g));
    const clear = new Set();
    const creates = [];
    groups.forEach(grp => {
      grp.keys.forEach(k => clear.add(k));
      const sp = Board.specialFor(grp, swapped);
      if (sp) creates.push(sp);
    });
    forced.forEach(([r, c]) => clear.add(key(r, c)));
    if (!clear.size) return null;

    const effects = [];
    const fired = new Set();
    const queue = [...clear];
    while (queue.length) {
      const [r, c] = unkey(queue.pop());
      const t = g[r][c];
      if (!t || !t.special || fired.has(t.id)) continue;
      fired.add(t.id);
      effects.push({ kind: t.special, r, c, type: t.type });
      Board.effectCells(g, t, r, c).forEach(([rr, cc]) => {
        const k = key(rr, cc);
        if (!clear.has(k)) { clear.add(k); queue.push(k); }
      });
    }

    const cleared = [];
    clear.forEach(k => {
      const [r, c] = unkey(k);
      if (g[r][c]) cleared.push({ r, c, tile: g[r][c] });
      g[r][c] = null;
    });
    const created = creates.map(sp => {
      const t = newTile(sp.type, sp.kind);
      g[sp.pos[0]][sp.pos[1]] = t;
      return { r: sp.pos[0], c: sp.pos[1], tile: t };
    });
    return { cleared, created, effects };
  },

  // 빈칸 메우기. 이동 목록: { tile, from, to, c, fresh }
  gravity(g) {
    const moves = [];
    for (let c = 0; c < COLS; c++) {
      let w = ROWS - 1;
      for (let r = ROWS - 1; r >= 0; r--) {
        const t = g[r][c];
        if (!t) continue;
        if (r !== w) { g[w][c] = t; g[r][c] = null; moves.push({ tile: t, from: r, to: w, c }); }
        w--;
      }
      let spawn = -1;
      for (let r = w; r >= 0; r--) {
        const t = newTile(randType());
        g[r][c] = t;
        moves.push({ tile: t, from: spawn--, to: r, c, fresh: true });
      }
    }
    return moves;
  },

  swap(g, a, b) {
    const t = g[a[0]][a[1]];
    g[a[0]][a[1]] = g[b[0]][b[1]];
    g[b[0]][b[1]] = t;
  },

  hasMove(g) {
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (g[r][c].special === 'rainbow') return true;
      for (const [dr, dc] of [[0, 1], [1, 0]]) {
        const r2 = r + dr, c2 = c + dc;
        if (!inside(r2, c2)) continue;
        if (g[r][c].special && g[r2][c2].special) return true;
        Board.swap(g, [r, c], [r2, c2]);
        const ok = Board.findRuns(g).length > 0;
        Board.swap(g, [r, c], [r2, c2]);
        if (ok) return true;
      }
    }
    return false;
  },

  // 섞기: 타일은 그대로, 위치만 바꿈
  shuffle(g) {
    const tiles = g.flat();
    for (let tries = 0; tries < 200; tries++) {
      for (let i = tiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
      }
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) g[r][c] = tiles[r * COLS + c];
      if (!Board.findRuns(g).length && Board.hasMove(g)) return;
    }
    tiles.forEach(t => { if (!t.special) t.type = randType(); });
  },
};
