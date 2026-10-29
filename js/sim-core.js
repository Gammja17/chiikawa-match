// 자동 플레이 봇의 속: 게임 판(js/board.js, js/life.js)을 그대로 쓰며 화면 없이 일상 퍼즐·토벌을 돌림
// 쓰는 곳: tools/sim.js(Node, vm 안에서), 스테이지 에디터(js/editor-worker.js, 웹 워커 안에서). ROWS, COLS, NTYPES, Board, LIFE_CHARS… 를 그대로 씀
// globalThis.SIM = { lifeRun, battleRun, seed }
(function () {
  let seed = 1;
  Math.random = () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const shuffleArr = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pickTiles = (g, n, ok = t => !t.special && t.type >= 0) => { const all = []; Board.each(g, (t, r, c) => ok(t) && all.push([r, c])); return shuffleArr(all).slice(0, n); };
  const SPV = { rainbow: 7, bomb: 4, plane: 3, h: 3, v: 3 }; // 판에 있는 아이템 값 (나중에 쓸 수 있는 힘)

  let S, G; // 지금 판 상태, 판
  const cloneGrid = g => g.map(row => row.map(t => (t ? { ...t } : t)));
  const snap = () => ({ S: { ...S, chars: { ...S.chars } }, G: cloneGrid(G), syrup: Board.syrup && Board.syrup.map(r => r.slice()), floor: Board.floor && Board.floor.map(r => r.slice()) });
  const restore = s => { S = s.S; G = s.G; Board.syrup = s.syrup; Board.floor = s.floor; Board._protect = Board._deferred = null; };

  function spawnIng() {
    const { n, max, kinds } = S.st.ing;
    let on = 0;
    Board.each(G, t => { if (t.type === ING) on++; });
    if (S.spawned >= n || on >= max) return null;
    if (on > 0 && Math.random() > 0.15) return null;
    return kinds[S.spawned++ % kinds.length];
  }

  // ---------- 한 단계 결과를 점수·공격으로 ----------
  function onStep(res, combo) {
    if (S.life) {
      const pts = Math.round((res.cleared.length * 20 * combo + res.created.length * 100 + res.hits.length * 50 + res.weeds.length * 60 +
        res.unlocked.length * 60 + res.syrup.length * 40) * (S.fever ? 1.5 : 1));
      S.score += pts;
      res.cleared.forEach(({ tile }) => {
        if (!S.inSkill) S.hg += tile.type >= 0 && tile.type === S.helperType ? 1 : 1 / 3;
        if (tile.type >= 0) { const id = LIFE_CHARS[tile.type]; S.chars[id] = (S.chars[id] || 0) + 1; }
      });
      if (res.hits.some(h => h.tile.block === 'bubble')) S.popped = true;
      return;
    }
    // 토벌: 맞춘 얼굴마다 공격(카니는 회복)
    const tally = new Map();
    res.cleared.forEach(({ tile }) => { if (tile.type >= 0) tally.set(tile.type, (tally.get(tile.type) || 0) + 1); });
    const mult = (1 + 0.25 * (combo - 1)) * (S.fever ? 1.5 : 1) * (S.rally ? 1.3 : 1);
    for (const [type, n] of tally) {
      const ch = S.chars5[type], cheer = type >= S.real;
      if (!cheer && !S.inSkill) S.gauge[type] += n;
      if (ch.heal) { const amt = Math.round(n * ch.heal * mult * (cheer ? 0.5 : S.lvm[type])); S.healed += Math.min(amt, S.hpMax - S.hp); S.hp = Math.min(S.hpMax, S.hp + amt); }
      else if (S.monHp > 0) {
        const crit = ch.crit && Math.random() < ch.crit, eff = cheer ? 1 : attrMult(ch.attr, S.wave.a);
        hit(Math.round(n * ch.dmg * mult * eff * (cheer ? 0.5 : S.lvm[type]) * (crit ? 2.5 : 1)));
      }
    }
  }
  const hit = d => { const x = Math.min(d, S.monHp); S.dealt += x; S.monHp -= x; };

  function collect() {
    for (;;) {
      const got = Board.collectIngs(G);
      if (!got.length) return;
      S.ing += got.length;
      S.score += 500 * got.length;
      Board.gravity(G);
    }
  }

  function cascade(swapped, forced, depth = 0) {
    let combo = 0;
    for (;;) {
      const res = Board.resolve(G, combo === 0 ? swapped : null, combo === 0 ? forced : []);
      if (!res) break;
      combo++;
      if (combo === 5 && !S.fever) { S.fever = S.life && S.st.time ? 4 : 3; S.feverGift = !!S.life; } // 시간 판 피버 10초 ≈ 4수
      onStep(res, combo);
      Board.gravity(G);
      if (S.life) collect();
    }
    if (S.feverGift) {
      S.feverGift = false;
      const [rc] = pickTiles(G, 1, t => !t.special && t.type >= 0 && !t.lock);
      if (rc) { const t = G[rc[0]][rc[1]]; t.special = ['h', 'v', 'bomb', 'plane'][Math.floor(Math.random() * 4)]; t.type = -1; }
    }
    if (!Board.hasMove(G)) {
      Board.shuffle(G);
      if (Board.findRuns(G).length && depth < 4) cascade(null, [], depth + 1);
      else if (!Board.hasMove(G)) {
        const spots = [];
        Board.each(G, t => { if (t.type >= 0 && !t.special && movable(t)) spots.push(t); });
        const t = spots[Math.floor(Math.random() * spots.length)];
        if (t) { t.special = 'rainbow'; t.type = -1; }
      }
    }
  }

  // 둘 수 있는 수: 옆 칸 바꾸기(매치가 되거나 아이템을 밀면) + 아이템 톡
  function moves() {
    const out = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const t = G[r][c];
      if (!movable(t)) continue;
      if (t.special) out.push({ act: [r, c] });
      for (const [dr, dc] of [[0, 1], [1, 0]]) {
        const r2 = r + dr, c2 = c + dc;
        if (!inside(r2, c2) || !movable(G[r2][c2])) continue;
        const u = G[r2][c2];
        if (t.special || u.special) { out.push({ a: [r, c], b: [r2, c2] }); continue; }
        Board.swap(G, [r, c], [r2, c2]);
        const ok = Board.findRuns(G).length > 0;
        Board.swap(G, [r, c], [r2, c2]);
        if (ok) out.push({ a: [r, c], b: [r2, c2] });
      }
    }
    return out;
  }
  function play(m) {
    if (m.act) return cascade(null, [m.act]);
    const { a, b } = m, ta = G[a[0]][a[1]], tb = G[b[0]][b[1]];
    Board.swap(G, a, b);
    const combo = Board.swapCombo(G, a, b);
    const items = combo ? [] : [[b, ta], [a, tb]].filter(([, t]) => t.special).map(([p]) => p);
    cascade([a, b], combo ? combo.cells : items);
  }

  // ---------- 일상 퍼즐 ----------
  const count = k => {
    let n = 0;
    if (k === 'syrup') { Board.syrup?.forEach((row, r) => row.forEach((v, c) => { if (!v && !hole(r, c)) n++; })); return n; }
    if (k === 'lock') { Board.each(G, t => { if (t.lock) n++; }); return n; }
    Board.each(G, t => { if (t.block === k) n += t.hp; });
    return n;
  };
  const remain = g => g.k === 'ing' ? Math.max(0, S.st.ing.n - S.ing) : g.k === 'char' ? Math.max(0, g.n - (S.chars[g.id] || 0))
    : g.k === 'score' ? Math.max(0, g.n - S.score) : count(g.k);
  const done = () => S.st.goals.every(g => remain(g) === 0);
  const potential = () => { let v = 0; Board.each(G, t => { if (t.special) v += SPV[t.special] || 0; }); return v; };
  // 재료가 바닥에 얼마나 가까운지 (밑이 막힌 칸은 바닥으로 침)
  const ingDepth = () => {
    let v = 0;
    Board.each(G, (t, r, c) => {
      if (t.type !== ING) return;
      let below = 0;
      for (let rr = r + 1; rr < ROWS; rr++) if (!G[rr][c]?.block && !hole(rr, c)) below++;
      v -= below;
    });
    return v;
  };
  const GW = { weed: 10, box: 10, bubble: 11, lock: 9, syrup: 4, char: 2.2, score: 0.012, ing: 45 };
  function lifeValue() {
    let v = 0;
    for (const g of S.st.goals) {
      const n = remain(g);
      v -= n * GW[g.k];
      if (g.k === 'ing') v += ingDepth() * 2.5;
    }
    return v + potential() * 1.2 + S.score * 0.0004;
  }

  function lifeSetup(st, helper) {
    NTYPES = st.types;
    Board.setSize(st.map.length, st.map[0].length);
    const lay = parseLayout(st);
    Board.floor = lay.floor; Board.mask = lay.mask; Board.syrup = lay.syrup;
    S = { life: true, st, score: 0, ing: 0, chars: {}, popped: false, fever: 0, feverGift: false, spawned: lay.ings.length, used: 0, hg: 0, inSkill: false,
      helperType: LIFE_CHARS.indexOf(helper) };
    Board.spawnIng = st.ing ? spawnIng : null;
    G = Board.create(lay);
  }

  const copyOf = s => ({ S: { ...s.S, chars: { ...s.S.chars } }, G: cloneGrid(s.G), syrup: s.syrup && s.syrup.map(r => r.slice()), floor: s.floor && s.floor.map(r => r.slice()) });
  function lifeTurn() {
    const ms = moves();
    const before = lifeValue(), s0 = snap();
    let best = null, bv = -Infinity;
    for (const m of ms) {
      play(m);
      let v = lifeValue() - before;
      if (!S.popped && count('bubble') && !done()) v -= 6; // 거품이 번짐
      if (done()) v += 1000;
      v += Math.random() * 0.3;
      if (v > bv) { bv = v; best = m; }
      restore(copyOf(s0)); // 되돌림
    }
    if (!best) { Board.shuffle(G); return; }
    play(best);
    S.used++;
    if (S.fever) S.fever--;
    if (!S.popped && count('bubble') && !done()) { const s = Board.spreadBubble(G); if (s) cascade(null, []); }
    S.popped = false;
  }

  // 남은 이동을 아이템으로 바꿔 터뜨리는 보너스 타임 (시간 판은 3초마다 하나)
  function bonus(left) {
    if (left <= 0) return;
    const cells = pickTiles(G, Math.min(left, 12));
    cells.forEach(([r, c]) => { const t = G[r][c], x = Math.random(); t.special = x < 0.5 ? (Math.random() < 0.5 ? 'h' : 'v') : x < 0.8 ? 'bomb' : 'plane'; t.type = -1; S.score += 150; });
    const rest = left - cells.length;
    cascade(null, cells);
    S.score += rest * 500;
  }

  const filled = () => { for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (!hole(r, c) && !G[r][c]) return false; return true; };
  // 한 판: limit 수 안에 깨면 { used, score } (limit 없으면 깰 때까지, 최대 cap)
  // 시간 판은 한 수 2.6초로 셈, 보너스는 남은 시간 3초마다
  function lifeRun(st, { limit = null, cap = 160, helper = 'hachiware' } = {}) {
    lifeSetup(st, helper);
    const lim = limit ?? cap;
    while (S.used < lim) {
      lifeTurn();
      if (!filled()) return { used: Infinity, bad: true, score: S.score }; // 판 모양 때문에 안 채워지는 칸이 생김
      if (done()) {
        const score0 = S.score;
        if (limit != null) bonus(st.time ? Math.floor((st.time - S.used * 2.6) / 3) : limit - S.used);
        return { used: S.used, score: S.score, score0 };
      }
    }
    return { used: Infinity, score: S.score };
  }

  // ---------- 토벌 ----------
  // team: 친구 id 5명, lv: 레벨. 스킬은 기본 스킬, 게이지가 차면 바로 씀
  const TREAT_UP = new Set(['momonga', 'kurimanju', 'goblin']);
  const lvMult = (id, lv) => 1 + (TREAT_UP.has(id) ? 0.12 : 0.08) * Math.max(0, lv - 1);
  function battleSetup(stage, team, lv) {
    NTYPES = team.length;
    Board.setSize(7, 7);
    Board.floor = Board.syrup = Board.mask = null;
    Board.spawnIng = null;
    const chars5 = team.map(id => CHARS.find(c => c.id === id));
    S = { life: false, stage, w: 0, wave: stage.waves[0], monHp: stage.waves[0].hp, cd: stage.waves[0].cd, hp: 120, hpMax: 120, fever: 0, rally: 0,
      chars5, real: team.length, lvm: chars5.map(c => lvMult(c.id, lv)), gauge: team.map(() => 0), need: chars5.map(c => Math.round(c.skill.need * (1 - 0.04 * Math.max(0, lv - 1)))),
      inSkill: false, dealt: 0, healed: 0, turns: 0 };
    G = Board.create();
  }
  function nextWave() {
    S.w++;
    if (S.w >= S.stage.waves.length) return true;
    S.wave = S.stage.waves[S.w];
    S.monHp = S.wave.hp;
    S.cd = S.wave.cd;
    return false;
  }
  function useSkill(k) {
    const ch = S.chars5[k], id = ch.skill.id, eff = attrMult(ch.attr, S.wave.a);
    S.gauge[k] = 0;
    S.inSkill = true;
    let cells = [];
    const rowsOf = n => shuffleArr([...Array(ROWS).keys()]).slice(0, n);
    if (id === 'random8') cells = pickTiles(G, 8, () => true);
    else if (id === 'rows2') rowsOf(2).forEach(r => { for (let c = 0; c < COLS; c++) cells.push([r, c]); });
    else if (id === 'cols2') rowsOf(2).forEach(c => { for (let r = 0; r < ROWS; r++) cells.push([r, c]); });
    else if (id === 'cross') {
      const r0 = 1 + Math.floor(Math.random() * (ROWS - 2)), c0 = 1 + Math.floor(Math.random() * (COLS - 2));
      for (let d = -1; d <= 1; d++) { for (let i = 0; i < COLS; i++) cells.push([r0 + d, i]); for (let i = 0; i < ROWS; i++) cells.push([i, c0 + d]); }
      hit(Math.round(ch.dmg * 10 * eff * S.lvm[k]));
      S.cd += 2;
    } else if (id === 'bighit') hit(Math.round(ch.dmg * 18 * eff));
    else if (id === 'heal40') S.hp = Math.min(S.hpMax, S.hp + Math.round(S.hpMax * 0.25));
    else if (id === 'ramen') { S.hp = Math.min(S.hpMax, S.hp + Math.round(S.hpMax * 0.2)); S.gauge = S.gauge.map(g => g + 3); }
    else if (id === 'convert6') pickTiles(G, 6, t => !t.special && t.type >= 0 && t.type !== k).forEach(([r, c]) => (G[r][c].type = k));
    else if (id === 'rainbow') { const [rc] = pickTiles(G, 1); if (rc) { G[rc[0]][rc[1]].special = 'rainbow'; G[rc[0]][rc[1]].type = -1; } }
    else if (id === 'stall') { S.cd += 3; hit(Math.round(ch.dmg * 4 * eff)); }
    else if (id === 'meteor') { cells = pickTiles(G, 3); cells.forEach(([r, c]) => { G[r][c].special = 'bomb'; G[r][c].type = -1; }); }
    else if (id === 'cheer') { Board.shuffle(G); S.gauge = S.gauge.map((g, j) => (j === k ? g : g + 4)); }
    cascade(null, cells);
    S.inSkill = false;
  }
  function battleValue() {
    let v = S.dealt * 1 + potential() * 6;
    const miss = S.hpMax - S.hp;
    v += S.healed * (0.4 + miss / S.hpMax * 3);
    v += S.gauge.reduce((a, g, j) => a + Math.min(g, S.need[j]) * 1.5, 0);
    return v;
  }
  // 한 판: 이기면 { win: true, turns, hp }, 지면 { win: false, frac: 깎은 비율 }
  function battleRun(stage, team, lv) {
    battleSetup(stage, team, lv);
    const total = stage.waves.reduce((a, w) => a + w.hp, 0);
    let gone = 0;
    for (let turn = 0; turn < 400; turn++) {
      // 게이지가 찬 스킬부터 (오토)
      for (let k = 0; k < S.real; k++) if (S.gauge[k] >= S.need[k] && S.monHp > 0) {
        useSkill(k);
        if (S.monHp <= 0) { gone += S.wave.hp; if (nextWave()) return { win: true, turns: turn, hp: S.hp }; }
      }
      const ms = moves();
      const s0 = snap();
      let best = null, bv = -Infinity;
      for (const m of ms) {
        S = { ...s0.S, gauge: s0.S.gauge.slice(), chars: s0.S.chars };
        S.dealt = 0; S.healed = 0;
        const g0 = S.gauge.slice();
        play(m);
        let v = battleValue() - g0.reduce((a, g, j) => a + Math.min(g, S.need[j]) * 1.5, 0) + Math.random() * 0.5;
        if (S.monHp <= 0) v += 30;
        if (v > bv) { bv = v; best = m; }
        G = cloneGrid(s0.G);
        Board._protect = Board._deferred = null;
      }
      S = { ...s0.S, gauge: s0.S.gauge.slice() };
      G = s0.G;
      if (!best) { Board.shuffle(G); continue; }
      play(best);
      S.turns++;
      if (S.monHp <= 0) { gone += S.wave.hp; if (nextWave()) return { win: true, turns: turn, hp: S.hp }; continue; }
      if (S.fever) S.fever--;
      if (S.rally) S.rally--;
      if (--S.cd <= 0) {
        S.hp -= S.wave.atk;
        S.cd = S.wave.cd;
        if (S.hp <= 0) return { win: false, frac: (gone + S.wave.hp - S.monHp) / total };
        if (S.wave.m === 'mimic') { Board.dropBlocks(G, S.wave.boss ? 3 : 2); if (!Board.hasMove(G)) cascade(null, []); }
      }
    }
    return { win: false, frac: 0 };
  }

  globalThis.SIM = { lifeRun, battleRun, seed: s => (seed = s) };
})();
