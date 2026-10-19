// 7장~30장 만들기: spec.js(이름·목표·대사) → 판 그림을 짜고, 봇(tools/sim.js)으로 이동 수·별 점수·괴물 체력을 재서 js/chapters.js에 씀
//   node tools/stages/make.js          바뀐 판만 다시 잼 (잰 값은 tools/stages/tuned.json에 남겨 둠)
//   node tools/stages/make.js --all    전부 다시 잼
//   node tools/stages/make.js --only=가게 문 열기,진한 국물
// 깨는 비율 목표(이 봇 기준, 1~6장을 이 봇으로 잰 값에 맞춤): 보통 93%→88%, 도전 85%, HARD 64%→56% (장이 갈수록 조금씩 빡빡하게)
// 토벌: 친구 레벨은 60판에서 6, 300판에서 10으로 오른다고 보고 잼 (1~6장은 2→6)
const fs = require('fs'), path = require('path'), os = require('os');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const ROOT = path.join(__dirname, '..', '..');
const OUT = path.join(ROOT, 'js', 'chapters.js'), CACHE = path.join(__dirname, 'tuned.json');
const VERSION = 6; // 만드는 법을 바꾸면 올려서 전부 다시 잼

// ---------- 무작위 (판 이름으로 씨앗을 정해서 매번 같은 판) ----------
const hash = s => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.codePointAt(0), 16777619); return h >>> 0; };
const rng = seed => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = (rnd, a) => a[Math.floor(rnd() * a.length)];

// ---------- 판 모양: open(r, c) ----------
const SHAPES = {
  full: () => true,
  corner1: (r, c, R, C) => !((r === 0 || r === R - 1) && (c === 0 || c === C - 1)),
  corner2: (r, c, R, C) => { const e = Math.min(c, C - 1 - c), v = Math.min(r, R - 1 - r); return !((v === 0 && e < 2) || (v === 1 && e < 1)); },
  topcut: (r, c, R, C) => { const e = Math.min(c, C - 1 - c); return !((r === 0 && e < 2) || (r === 1 && e < 1)); },
  funnel: (r, c, R, C) => { const b = R - 1 - r, mc = (C - 1) / 2; if (b > 2) return true; const hw = Math.floor((C - 1) / 2) - (3 - b); return Math.abs(c - mc) <= hw + (C % 2 ? 0 : 0.5); },
  bowl: (r, c, R, C) => { const b = R - 1 - r, mc = (C - 1) / 2; if (b > 1) return true; const hw = Math.floor((C - 1) / 2) - (2 - b); return Math.abs(c - mc) <= hw + (C % 2 ? 0 : 0.5); },
  octagon: (r, c, R, C) => Math.min(r, R - 1 - r) + Math.min(c, C - 1 - c) >= 2,
  round: (r, c, R, C) => Math.min(r, R - 1 - r) + Math.min(c, C - 1 - c) >= 1,
  diamond: (r, c, R, C) => Math.abs(r - (R - 1) / 2) + Math.abs(c - (C - 1) / 2) <= Math.max(R, C) / 2 + 0.6,
  center: (r, c, R, C) => !(Math.abs(r - (R - 1) / 2) < 0.6 && Math.abs(c - (C - 1) / 2) < (C % 2 ? 0.6 : 1.1)),
  twin: (r, c, R, C) => !(Math.abs(r - (R - 1) / 2) < 1 && Math.abs(c - (C - 1) / 2) < (C % 2 ? 0.6 : 1.1)),
  pillar: (r, c, R, C) => !(r <= 2 && Math.abs(c - (C - 1) / 2) < 0.6),
  hourglass: (r, c, R, C) => { const d = Math.abs(r - (R - 1) / 2); const e = Math.min(c, C - 1 - c); return !(d < 1.6 && e < (d < 0.6 ? 2 : 1)); },
  arch: (r, c, R, C) => !(r >= R - 2 && Math.abs(c - (C - 1) / 2) < (C % 2 ? 0.6 : 1.1)),
};
// 재료 판은 바닥이 좁아지는 모양, 시럽은 둥근 모양이 어울림
const SHAPE_FOR = {
  ing: ['funnel', 'bowl', 'full', 'corner2', 'arch', 'topcut'],
  syrup: ['octagon', 'round', 'diamond', 'full', 'corner2', 'funnel'],
  any: ['full', 'corner1', 'corner2', 'topcut', 'octagon', 'round', 'center', 'twin', 'pillar', 'hourglass', 'funnel', 'bowl'],
};

// ---------- 장애물 무늬: 점수가 높은 칸부터 좌우 대칭으로 채움 ----------
const PAT = {
  bottom: (r) => r,
  top: (r) => -r,
  middle: (r, c, R) => -Math.abs(r - R * 0.55),
  center: (r, c, R, C) => -(Math.abs(r - (R - 1) / 2) + Math.abs(c - (C - 1) / 2)),
  edge: (r, c, R, C) => Math.abs(r - (R - 1) / 2) + Math.abs(c - (C - 1) / 2),
  checker: (r, c) => ((r + c) % 2 ? 0 : 6) + r * 0.2,
  checkup: (r, c) => ((r + c) % 2 ? 0 : 6) - r * 0.2,
  vee: (r, c, R, C) => -Math.abs(Math.abs(c - (C - 1) / 2) - (R - 1 - r) * 0.9) * 2 + r * 0.1,
  rows: (r, c, R) => ((R - 1 - r) % 2 ? 0 : 6) + r * 0.3,
  cols: (r, c, R, C) => (c === 1 || c === C - 2 || Math.abs(c - (C - 1) / 2) < 0.6 ? 6 : 0) + r * 0.1,
  ring: (r, c, R, C) => -Math.abs(Math.abs(r - (R - 1) / 2) + Math.abs(c - (C - 1) / 2) - 2.5) * 2,
  frame: (r, c, R, C) => (r === R - 1 || c === 0 || c === C - 1 ? 6 : 0) + r * 0.1,
  cluster: (r, c, R, C) => -Math.hypot(r - R * 0.62, Math.min(c, C - 1 - c) - C * 0.2),
  band: (r, c, R) => (r >= R - 3 ? 6 : 0) + ((r + c) % 2 ? 0 : 1),
  scatter: () => 0,
};
const PAT_FOR = {
  weed: ['bottom', 'checker', 'vee', 'rows', 'band', 'frame', 'scatter', 'cluster'],
  box: ['middle', 'cluster', 'cols', 'center', 'ring', 'checkup', 'frame'],
  bubble: ['bottom', 'cluster', 'frame', 'band', 'edge'],
  lock: ['center', 'ring', 'checker', 'cols', 'middle', 'checkup'],
};
// 열린 칸 중 이만큼 (여러 장애물이 함께면 줄임)
const DENS = { weed: 0.22, box: 0.17, bubble: 0.075, lock: 0.17 };

function parseGoals(str) {
  const out = { kinds: {}, goals: [], chars: [] };
  for (const tok of str.split('+')) {
    if (/^weed$/i.test(tok)) { out.kinds.weed = { big: tok === 'WEED' ? 1 : tok === 'Weed' ? 0.4 : 0 }; out.goals.push({ k: 'weed' }); }
    else if (tok === 'box' || /^gift$/i.test(tok)) {
      const big = tok === 'GIFT' ? 1 : tok === 'gift' ? 0.45 : 0;
      if (!out.kinds.box) out.goals.push({ k: 'box' });
      out.kinds.box = { big: Math.max(out.kinds.box?.big || 0, big) };
    } else if (tok === 'bubble') { out.kinds.bubble = { big: 0 }; out.goals.push({ k: 'bubble' }); }
    else if (tok === 'lock') { out.kinds.lock = { big: 0 }; out.goals.push({ k: 'lock' }); }
    else if (tok === 'syrup') out.goals.push({ k: 'syrup' });
    else if (tok === 'ing') out.goals.push({ k: 'ing' });
    else if (tok === 'score') out.goals.push({ k: 'score' });
    else if (tok.startsWith('char:')) tok.slice(5).split(',').forEach(id => { out.goals.push({ k: 'char', id }); out.chars.push(id); });
    else throw new Error('모르는 목표: ' + tok);
  }
  return out;
}

// 판 그림 만들기. knob: 장애물 양 배율
function buildMap(sp, R, C, shape, knob, seed) {
  const rnd = rng(seed);
  const g = parseGoals(sp.goals);
  const open = Array.from({ length: R }, (_, r) => Array.from({ length: C }, (_, c) => SHAPES[shape](r, c, R, C)));
  const grid = open.map(row => row.map(o => (o ? '.' : '#')));
  const mc = (C - 1) / 2;
  const free = (r, c) => open[r][c] && grid[r][c] === '.';
  // 재료: 맨 위 줄 좌우 대칭 두 자리
  if (g.goals.some(x => x.k === 'ing')) {
    const top = c => { let r = 0; while (r < R && !open[r][c]) r++; return r; };
    const cs = C >= 8 ? [2, C - 3] : [1, C - 2];
    cs.forEach(c => { if (top(c) < R) grid[top(c)][c] = 'i'; });
  }
  // 시럽: 가운데 한 칸
  if (g.goals.some(x => x.k === 'syrup')) {
    let r = Math.floor(R / 2), c = Math.floor(mc);
    while (!free(r, c) && r < R - 1) r++;
    grid[r][c] = 's';
  }
  const kinds = Object.keys(g.kinds);
  const share = kinds.length <= 1 ? 1 : kinds.length === 2 ? 0.68 : kinds.length === 3 ? 0.52 : 0.42;
  const nOpen = open.flat().filter(Boolean).length;
  const usedPat = new Set();
  for (const k of kinds) {
    let want = Math.round(nOpen * DENS[k] * share * knob * (sp.dens || 1));
    if (k === 'bubble') want = Math.max(2, want);
    const pats = PAT_FOR[k].filter(p => !usedPat.has(p));
    const pat = sp.pat?.[k] || pick(rnd, pats);
    usedPat.add(pat);
    const cells = [];
    for (let r = 1; r < R; r++) for (let c = 0; c <= Math.floor(mc); c++) if (free(r, c) && free(r, C - 1 - c)) cells.push([r, c, PAT[pat](r, c, R, C) + rnd() * 1.5]);
    cells.sort((a, b) => b[2] - a[2]);
    const big = g.kinds[k].big;
    const ch = { weed: ['w', 'W'], box: ['b', 'g'], bubble: ['o', 'o'], lock: ['l', 'l'] }[k];
    let n = 0;
    for (const [r, c] of cells) {
      if (n >= want) break;
      const x = rnd() < big ? ch[1] : ch[0];
      grid[r][c] = x;
      grid[r][C - 1 - c] = x;
      n += c === C - 1 - c ? 1 : 2;
    }
  }
  return grid.map(row => row.join(''));
}

// ---------- 목표 수치 ----------
const lerp = (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t));
// 장이 갈수록 빡빡하게. 봇은 친구 스킬을 안 쓰니, 실제로는 강화한 친구 스킬(이동 +, 아이템)이 그 차이를 메움
const target = (lv, ch) => { const t = (ch - 7) / 23; return lv === 'hard' ? lerp(0.6, 0.4, t) : lv === 'challenge' ? lerp(0.84, 0.68, t) : lerp(0.92, 0.78, t); };
const teamLv = k => (k <= 60 ? Math.max(2, Math.min(6, 2 + (k - 20) / 10)) : 6 + (k - 60) / 60);
const round = (x, s) => Math.round(x / s) * s;

// ---------- 일상 퍼즐 하나 재기 (일꾼 안에서) ----------
function tuneLife(job, sim) {
  const { sp, ch } = job;
  const g = parseGoals(sp.goals);
  const rnd = rng(hash(sp.name));
  const hasIng = g.goals.some(x => x.k === 'ing'), hasSyrup = g.goals.some(x => x.k === 'syrup');
  const nObs = Object.keys(g.kinds).length;
  // 판 크기: 장이 갈수록, 목표가 많을수록 크게 (최대 9x9)
  const sizes = sp.size ? [sp.size] : nObs + g.goals.length <= 1 ? [[7, 7], [7, 7], [8, 8]] : nObs + g.goals.length <= 3 ? [[7, 7], [8, 8], [8, 8], [9, 9], [8, 9]] : [[8, 8], [9, 9], [9, 9], [8, 9]];
  // 얼굴 6가지(맞추기 어려움)는 뒤로 갈수록 자주: HARD는 12장부터, 보통 판은 20장부터
  const six = sp.lv === 'hard' ? lerp(0.2, 0.8, (ch - 12) / 14) * (ch >= 12) : lerp(0, 0.45, (ch - 20) / 10) * (ch >= 20);
  const types = sp.types || (rnd() < six ? 6 : 5);
  const exam = !!sp.time;
  const ingN = hasIng ? Math.round(lerp(3, 5, (ch - 7) / 23)) : 0;
  const charN = g.chars.length ? Math.round((g.chars.length === 1 ? lerp(26, 36, (ch - 7) / 23) : g.chars.length === 2 ? 18 : g.chars.length === 3 ? 14 : 11)) : 0;
  const scoreN = g.goals.some(x => x.k === 'score') ? round(lerp(9000, 13000, (ch - 7) / 23), 500) : 0;
  const tgt = target(sp.lv, ch);
  const [minM, maxM] = exam ? [20, 34] : sp.lv === 'hard' ? [14, 32] : [12, 30];
  let knob = 1, seed = hash(sp.name + '#'), last = null;
  let [R, C] = pick(rnd, sizes), shape = sp.shape || pick(rnd, SHAPE_FOR[hasIng ? 'ing' : hasSyrup ? 'syrup' : 'any']);
  const make = () => {
    const map = buildMap(sp, R, C, shape, knob, seed);
    const goals = g.goals.map(x => ({ ...x, ...(x.k === 'char' ? { n: Math.max(6, Math.round(charN * knob)) } : x.k === 'score' ? { n: round(scoreN * Math.sqrt(knob), 500) } : {}) }));
    const st = { name: sp.name, ...(sp.done ? { done: sp.done } : {}), icon: sp.icon, types, moves: 99, host: sp.host, ...(exam ? { exam: true } : {}), intro: sp.intro, goals, stars: [0, 0, 0],
      ...(hasIng ? { ing: { n: Math.max(2, Math.round(ingN * Math.sqrt(knob))), max: 2, kinds: sp.ing || ['naruto', 'egg'] } } : {}), map };
    return st;
  };
  const measure = (st, runs) => {
    const need = [];
    let bad = 0;
    for (let k = 0; k < runs; k++) { sim.SIM.seed(hash(st.name) + k * 7919); const r = sim.SIM.lifeRun(st, { cap: 90 }); if (r.bad) bad++; need.push(r.used); }
    need.sort((a, b) => a - b);
    return { bad, m: need[Math.min(runs - 1, Math.ceil(tgt * runs) - 1)] };
  };
  // 장애물 양(knob)을 이분 탐색: 깨는 데 든 수가 [minM, maxM] 안에 들 때까지
  let st, m, lo = 0, hi = Infinity, best = null;
  const off = x => (x < minM ? minM - x : x > maxM ? x - maxM : 0);
  for (let it = 0; it < 10; it++) {
    st = make();
    const r = measure(st, 90);
    // 안 채워지는 칸이 생김: 장애물을 늘리다 그랬으면 줄이고, 처음부터면 모양을 바꿈
    if (r.bad) { if (lo) { hi = knob; knob = Math.sqrt(lo * hi); } else { shape = pick(rnd, ['full', 'corner1', 'corner2', 'octagon', 'round']); seed++; } continue; }
    m = r.m;
    if (!best || off(m) < off(best.m)) best = { knob, m, shape, seed };
    if (!off(m)) break;
    if (m > maxM) hi = knob; else lo = knob;
    knob = isFinite(hi) && lo ? Math.sqrt(lo * hi) : m > maxM ? knob * (isFinite(m) ? Math.max(0.55, Math.pow(maxM / m, 1.2)) : 0.55) : knob * Math.min(1.7, Math.pow(minM / m, 1.1));
  }
  ({ knob, shape, seed } = best || { knob, shape, seed });
  st = make();
  m = measure(st, 220).m;
  if (!isFinite(m)) m = 60;
  // 별: 정한 이동 수로 다시 돌려서, 깬 판 점수(보너스 포함)의 40%·75% 지점 (깬 판의 60%가 별 2, 25%가 별 3)
  const limit = m;
  const scores = [];
  for (let k = 0; k < 160; k++) {
    sim.SIM.seed(hash(st.name) + 99991 + k * 104729);
    const r = sim.SIM.lifeRun(exam ? { ...st, time: limit * 2.6 } : { ...st, moves: limit }, { limit });
    if (isFinite(r.used)) scores.push(r.score);
  }
  scores.sort((a, b) => a - b);
  const q = p => scores[Math.min(scores.length - 1, Math.floor(p * scores.length))] || 0;
  const sg = st.goals.find(x => x.k === 'score');
  let s1 = sg ? sg.n : Math.max(1000, round(q(0.1), 500));
  let s2 = Math.max(s1 + 500, round(q(0.4), 500)), s3 = Math.max(s2 + 500, round(q(0.75), 500));
  st.stars = [s1, s2, s3];
  if (exam) { delete st.moves; st.time = Math.max(40, round(m * 2.6, 5)); st = reorder(st); }
  else st.moves = m;
  return { st, info: { m, knob: +knob.toFixed(2), tgt: +tgt.toFixed(2), shape, R, C } };
}
// time을 moves 자리에 (보기 좋게)
function reorder(st) {
  const out = {};
  for (const k of ['name', 'done', 'icon', 'types', 'moves', 'time', 'host', 'exam', 'intro', 'goals', 'stars', 'ing', 'map']) if (st[k] !== undefined) out[k] = st[k];
  return out;
}

// ---------- 토벌 하나 재기: 괴물 체력 배율을 깨는 비율 목표에 맞게 이분 탐색 ----------
function tuneBattle(job, sim) {
  const { sp, ch, k } = job;
  const tgt = target(sp.lv, ch), lv = teamLv(k + 1);
  // 공격력: 체력 120이라 60이 넘으면 두 방. 보통 괴물은 세 방(44~59), 보스만 두 방(85→110). 어려움은 주로 괴물 체력으로
  const t = (ch - 7) / 23, jit = rng(hash(sp.name + 'atk'));
  const waves = sp.waves.map(w => {
    const cd = w.cd || (w.boss ? 4 : 3);
    const base = w.boss ? lerp(85, 110, t) * (cd <= 3 ? 0.85 : 1) : Math.min(59, lerp(50, 57, t) + (jit() * 6 - 3) - (sp.waves.length >= 3 ? 4 : 0));
    const atk = Math.round(base * (cd <= 2 ? 0.65 : 1));
    const o = { a: w.a, m: w.m, hp: 0, atk, cd };
    if (w.hue != null) o.hue = w.hue;
    if (w.title) o.title = w.title;
    if (w.boss) o.boss = true;
    return o;
  });
  const stage = { name: sp.name, waves };
  const team = require(path.join(ROOT, 'tools', 'sim.js')).pickTeam(sim, stage);
  const runs = 70, atk0 = waves.map(w => w.atk);
  // 싸움 길이(이긴 판 턴 수 가운데값) 상한: 예전 판처럼 10~13턴, 뒤로 갈수록 조금 길게
  const nw = waves.length, Tmax = Math.round((nw === 1 ? 10 : nw === 2 ? 12 : nw === 3 ? 14 : 18) * lerp(1, 1.3, t) + (sp.lv === 'hard' ? 2 : 0));
  const run = (H, am = 1) => {
    waves.forEach((w, i) => { w.hp = Math.max(300, round(sp.waves[i].w * H, 10)); w.atk = Math.min(115, Math.round(atk0[i] * am)); });
    let win = 0;
    const turns = [];
    for (let n = 0; n < runs; n++) { sim.SIM.seed(hash(sp.name) + n * 7919); const r = sim.SIM.battleRun(stage, team, lv); if (r.win) { win++; turns.push(r.turns); } }
    turns.sort((a, b) => a - b);
    return { rate: win / runs, T: turns.length ? turns[turns.length >> 1] : 999 };
  };
  // 1) 체력: 깨는 비율이 목표 이상이고 턴 수가 상한 안인 가장 큰 값
  let lo = 300, hi = 40000;
  for (let it = 0; it < 12; it++) { const mid = Math.sqrt(lo * hi), r = run(mid); if (r.rate >= tgt && r.T <= Tmax) lo = mid; else hi = mid; }
  const H = lo;
  // 2) 아직 너무 쉬우면 공격력을 올려서 목표에 맞춤
  let am = 1, r = run(H);
  if (r.rate > tgt + 0.04) {
    let alo = 1, ahi = 2.2;
    for (let it = 0; it < 9; it++) { const mid = (alo + ahi) / 2, x = run(H, mid); if (x.rate >= tgt) alo = mid; else ahi = mid; }
    am = alo;
    r = run(H, am);
  }
  const weakLv = Math.max(1, lv - 3), weak = (() => { let w = 0; for (let n = 0; n < runs; n++) { sim.SIM.seed(hash(sp.name) + n * 7919); if (sim.SIM.battleRun(stage, team, weakLv).win) w++; } return w / runs; })();
  return { st: stage, info: { H: Math.round(H), am: +am.toFixed(2), rate: +r.rate.toFixed(2), weak: +weak.toFixed(2), T: r.T, Tmax, tgt: +tgt.toFixed(2), lv: +lv.toFixed(1), team: team.join(',') } };
}

// ---------- JS 글로 ----------
const q = s => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
function lit(v) {
  if (Array.isArray(v)) return `[${v.map(lit).join(', ')}]`;
  if (v && typeof v === 'object') return `{ ${Object.entries(v).map(([k, x]) => `${k}: ${lit(x)}`).join(', ')} }`;
  return typeof v === 'string' ? q(v) : String(v);
}
function emitStage(st, sp, b) {
  const head = Object.entries(st).filter(([k]) => !['goals', 'stars', 'ing', 'map', 'waves'].includes(k)).map(([k, v]) => `${k}: ${lit(v)}`);
  if (b) head.unshift('b: 1');
  if (sp.lv) head.push(`lv: ${q(sp.lv)}`);
  let s = `  { ${head.join(', ')},\n`;
  if (b) s += `    waves: [${st.waves.map(lit).join(',\n      ')}],\n`;
  else {
    s += `    goals: ${lit(st.goals)}, stars: ${lit(st.stars)}${st.ing ? `, ing: ${lit(st.ing)}` : ''},\n`;
    s += `    map: ${lit(st.map)},\n`;
  }
  if (sp.story) s += `    story: [\n${sp.story.map(l => `      ${lit(l)},`).join('\n')}\n    ],\n`;
  if (sp.after) s += `    after: [\n${sp.after.map(l => `      ${lit(l)},`).join('\n')}\n    ],\n`;
  return s.replace(/,\n$/, ' },\n');
}
function emit(spec, results) {
  let s = `// 7장~30장: 장마다 10판 (일상 퍼즐 7판, 토벌 3판 안팎)
// 만든 파일: tools/stages/spec.js(이름·목표·대사)를 고치고 node tools/stages/make.js로 다시 만듦
// 판 그림은 좌우 대칭으로 짜고, 이동 수·별 점수·괴물 체력은 자동 플레이 봇(tools/sim.js)으로 잼
// b: 토벌, lv: 'challenge' 도전 / 'hard', story: 시작 전 대사, after: 처음 깼을 때 대사
function addChapter(name, list) {
  CHAPTERS.push([ROUTE.length, name]);
  for (const { b, lv, story, after, ...st } of list) {
    const i = (b ? STAGES : LIFE).push(st) - 1;
    ROUTE.push([b ? 'b' : 'l', i]);
    if (lv === 'hard') HARD_AT.add(ROUTE.length);
    else if (lv === 'challenge') CHALLENGE_AT.add(ROUTE.length);
    if (story) (b ? STORY : LIFE_STORY)[i] = story;
    if (after) (b ? STORY_AFTER : LIFE_STORY_AFTER)[i] = after;
  }
}
`;
  for (const chap of spec) {
    s += `\naddChapter(${q(chap.name)}, [\n`;
    for (const sp of chap.stages) s += emitStage(results[sp.name].st, sp, sp.kind === 'b');
    s += ']);\n';
  }
  return s;
}

// ---------- 일꾼 ----------
if (!isMainThread) {
  const sim = require(path.join(ROOT, 'tools', 'sim.js')).load();
  parentPort.on('message', job => {
    if (!job) process.exit(0);
    const res = job.sp.kind === 'b' ? tuneBattle(job, sim) : tuneLife(job, sim);
    parentPort.postMessage({ name: job.sp.name, ...res });
  });
} else {
  const spec = require('./spec.js');
  const all = process.argv.includes('--all');
  const only = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
  const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {};
  const keyOf = (sp, k) => hash(JSON.stringify({ VERSION, k, ...sp, story: 0, after: 0 })).toString(36); // 대사만 바꾸면 다시 안 잼
  const jobs = [], results = {};
  let k = 60;
  spec.forEach((chap, ci) => chap.stages.forEach(sp => {
    const key = keyOf(sp, k), ch = ci + 7;
    if (only.length ? !only.includes(sp.name) : !all && cache[sp.name]?.key === key) { if (cache[sp.name]) results[sp.name] = cache[sp.name]; }
    else jobs.push({ sp, ch, k, key });
    k++;
  }));
  console.log(`잴 판 ${jobs.length}개 (남겨 둔 값 ${Object.keys(results).length}개)`);
  const n = Math.min(os.cpus().length, jobs.length);
  let next = 0, done = 0;
  const t0 = Date.now();
  const save = () => {
    fs.writeFileSync(CACHE, JSON.stringify(Object.fromEntries(Object.entries({ ...cache, ...results }).sort()), null, 0));
    if (spec.every(c => c.stages.every(sp => results[sp.name]))) fs.writeFileSync(OUT, emit(spec, results));
  };
  if (!jobs.length) save();
  for (let w = 0; w < n; w++) {
    const wk = new Worker(__filename);
    const feed = () => { const j = jobs[next++]; wk.postMessage(j || null); };
    wk.on('message', r => {
      const job = jobs.find(j => j.sp.name === r.name);
      results[r.name] = { key: job.key, st: r.st, info: r.info };
      done++;
      console.log(`[${done}/${jobs.length}] ${job.ch}장 ${r.name}`, JSON.stringify(r.info), `${((Date.now() - t0) / 1000).toFixed(0)}초`);
      if (done % 8 === 0 || done === jobs.length) save();
      feed();
    });
    wk.on('error', e => { console.error(e); process.exit(1); });
    feed();
  }
}
