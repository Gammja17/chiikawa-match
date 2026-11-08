// 하드 모드 만들기: 모험 지도 500판을 그대로 두고, 판마다 '하드' 값(이동 수·장애물·별 점수 / 괴물 체력·공격력·공격 간격)을 봇으로 재서 js/hard-data.js에 씀
//   node tools/stages/hard.js            바뀐 판만 다시 잼 (잰 값은 tools/stages/hard-tuned.json에 남겨 둠)
//   node tools/stages/hard.js --all      전부 다시 잼
//   node tools/stages/hard.js --only=12,57   지도 번호(1부터)로 몇 판만
//   node tools/stages/hard.js --report   다시 재지 않고 지금 값으로 깨는 비율만 봄 (판마다 400판)
// 보통 판 데이터(js/data.js, js/life.js, js/chapters.js)는 건드리지 않음. 게임은 js/hard.js가 보통 판에 이 값을 덮어 씀
//
// 일상 퍼즐: 판 그림은 그대로 두고 장애물을 질긴 것으로 (잡초 w → 큰 잡초 W, 상자 b → 선물 상자 g, 절반쯤 좌우 대칭으로).
//   바꿀 잡초·상자가 거의 없는 판은 빈 칸에 상자를 좌우 대칭으로 몇 개 더 깖 (시럽·재료·소용돌이 판은 안 깖).
//   친구 모으기·음표·박수 목표 수는 15% 늘림. 그다음 이동 수(시험 판은 시간)를 봇이 깨는 비율 목표에 맞춰 줄임.
//   이동 수가 보통 판 이상이 되면 장애물을 덜 바꾸고, 보통 판의 55%보다 적어지면 더 바꿈
// 토벌: 공격 간격 1 줄이고(최소 2. 너무 어려우면 보스만 / 보스 빼고 / 안 줄임 순으로), 괴물 체력 배율(1.15배 이상)을 깨는 비율 목표·싸움 길이에 맞게 이분 탐색,
//   아직 쉬우면 공격력을 올리고(최대 115), 그래도 쉬우면 싸움 길이 상한을 1.6배로 늘려 체력을 더 올림
// 깨는 비율 목표(이 봇, 친구 레벨 10): 보통 판 58%, 도전 45%, HARD 28%, 보스 판 30%
const fs = require('fs'), path = require('path'), os = require('os');
const { Worker, isMainThread, parentPort } = require('worker_threads');
const ROOT = path.join(__dirname, '..', '..');
const OUT = path.join(ROOT, 'js', 'hard-data.js'), CACHE = path.join(__dirname, 'hard-tuned.json');
const VERSION = 4; // 만드는 법을 바꾸면 올려서 전부 다시 잼
const LV = 10; // 하드 모드는 장을 다 깬 뒤에 열리니 친구 레벨 10으로 봄

const hash = s => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.codePointAt(0), 16777619); return h >>> 0; };
const rng = seed => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const round = (x, s) => Math.round(x / s) * s;
const TARGET = { '': 0.58, challenge: 0.45, hard: 0.28, boss: 0.30 };

// ---------- 일상 퍼즐 ----------
// 판 그림을 하드로: knob 0이면 그대로, 1이면 잡초·상자 절반을 질긴 것으로 (+ 거의 없으면 상자 몇 개), 2면 거의 다 + 상자 더
function hardMap(st, knob, seed) {
  const rnd = rng(seed);
  const g = st.map.map(row => [...row]);
  const R = g.length, C = g[0].length;
  if (!knob) return st.map.slice();
  const frac = Math.min(0.95, 0.5 * knob);
  let up = 0;
  for (let r = 0; r < R; r++) for (let c = 0; c <= (C - 1) >> 1; c++) {
    const d = C - 1 - c, a = g[r][c];
    if ((a !== 'w' && a !== 'b') || g[r][d] !== a) continue;
    if (rnd() >= frac) continue;
    const x = a === 'w' ? 'W' : 'g';
    g[r][c] = g[r][d] = x;
    up += c === d ? 1 : 2;
  }
  // 바꾼 게 4칸도 안 되면 빈 칸에 상자를 깖. 시럽(판 전체를 칠해야 함)·재료(떨어지는 길)·소용돌이 판은 길이 막히니 안 깖
  const kinds = new Set(st.goals.map(x => x.k));
  const noBox = kinds.has('syrup') || st.ing || st.map.some(row => /[vVi]/.test(row)) || kinds.has('box');
  if (up < 4 && !noBox) {
    const open = g.flat().filter(ch => ch !== '#').length;
    let want = Math.round(open * 0.06 * knob);
    const near = (r, c) => { for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { const ch = g[r + dr]?.[c + dc]; if (ch && /[zcafk]/.test(ch)) return true; } return false; };
    const cells = [];
    // 맨 위 두 줄은 비워 둠 (새 구슬이 떨어지는 길)
    for (let r = 2; r < R; r++) for (let c = 0; c <= (C - 1) >> 1; c++) {
      const d = C - 1 - c;
      if (g[r][c] === '.' && g[r][d] === '.' && !near(r, c) && g[r - 1][c] !== '#') cells.push([r, c, rnd() + (r / R) * 0.6]);
    }
    cells.sort((a, b) => b[2] - a[2]);
    for (const [r, c] of cells) {
      if (want <= 0) break;
      // 바로 옆에 이미 상자가 둘 넘게 붙으면 건너뜀 (덩어리로 막히지 않게)
      let adj = 0;
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (g[r + dr]?.[c + dc] === 'b') adj++;
      if (adj > 1) continue;
      const d = C - 1 - c;
      g[r][c] = g[r][d] = 'b';
      want -= c === d ? 1 : 2;
    }
  }
  return g.map(row => row.join(''));
}
function hardLife(st, knob, seed) {
  const h = JSON.parse(JSON.stringify(st));
  h.map = hardMap(st, knob, seed);
  const more = 1 + 0.15 * Math.min(knob, 1.5);
  h.goals = st.goals.map(x => (x.k === 'char' || x.k === 'note' || x.k === 'clap' ? { ...x, n: Math.round(x.n * more) } : x));
  if (knob >= 1.6 && h.types < 5) h.types = 5; // 얼굴 4가지인 1장 판은 5가지로
  return h;
}
function needAt(st, tgt, runs, sim, salt) {
  const need = [];
  let bad = 0;
  for (let k = 0; k < runs; k++) { sim.SIM.seed(hash(st.name + salt) + k * 7919); const r = sim.SIM.lifeRun(st, { cap: 90 }); if (r.bad) bad++; need.push(r.used); }
  need.sort((a, b) => a - b);
  return { bad, m: need[Math.min(runs - 1, Math.ceil(tgt * runs) - 1)] };
}
function starsAt(st, limit, exam, sim) {
  const scores = [];
  for (let k = 0; k < 160; k++) {
    sim.SIM.seed(hash(st.name + 'hard') + 99991 + k * 104729);
    const r = sim.SIM.lifeRun(exam ? { ...st, time: limit * 2.6 } : { ...st, moves: limit }, { limit });
    if (isFinite(r.used)) scores.push(r.score);
  }
  scores.sort((a, b) => a - b);
  const q = p => scores[Math.min(scores.length - 1, Math.floor(p * scores.length))] || 0;
  const sg = st.goals.find(x => x.k === 'score');
  const s1 = sg ? sg.n : Math.max(1000, round(q(0.1), 500));
  const s2 = Math.max(s1 + 500, round(q(0.4), 500)), s3 = Math.max(s2 + 500, round(q(0.75), 500));
  return [s1, s2, s3];
}
function tuneLife(job, sim) {
  const st = sim.LIFE[job.i], exam = !!st.time, tgt = TARGET[job.lv];
  const lim0 = exam ? st.time / 2.6 : st.moves; // 보통 판 이동 수 (시험 판은 한 수 2.6초로)
  const seed = hash(st.name + '#hard');
  const tries = [];
  const tryKnob = knob => {
    let t;
    // 안 채워지는 칸이 생기면 상자 자리를 바꿔 두 번 더
    for (let s = 0; s < 3; s++) {
      const h = hardLife(st, knob, seed + s * 101);
      const r = needAt(h, tgt, 200, sim, '');
      t = { knob, h, m: r.m, bad: r.bad };
      if (!r.bad) break;
    }
    tries.push(t);
    return t;
  };
  // 이동 수가 [보통의 55%, 보통 - 1] 안에 들게 장애물 양을 고름 (너무 어려우면 덜, 너무 쉬우면 더)
  const hi = Math.max(5, Math.floor(lim0) - 1), lo = Math.max(5, Math.ceil(lim0 * 0.55));
  const ok = t => !t.bad && t.m >= lo && t.m <= hi;
  let t = tryKnob(1);
  if (!ok(t)) {
    const down = t.bad || t.m > hi;
    for (const k of down ? [0.5, 0.25, 0] : [1.6, 2.2, 3]) {
      t = tryKnob(k);
      if (ok(t) || (down && !t.bad && t.m <= hi)) break;
    }
  }
  // 그래도 안 되면 제일 가까운 것
  const off = x => (x.bad ? 999 : x.m < lo ? lo - x.m : x.m > hi ? x.m - hi : 0);
  t = tries.slice().sort((a, b) => off(a) - off(b) || b.knob - a.knob)[0];
  const h = t.h;
  let m = isFinite(t.m) ? Math.round(t.m) : hi;
  m = Math.max(5, Math.min(hi, m));
  const out = { map: h.map, stars: starsAt(h, m, exam, sim) };
  if (exam) out.time = Math.max(20, Math.min(st.time - 5, round(m * 2.6, 5)));
  else out.moves = m;
  if (JSON.stringify(h.goals) !== JSON.stringify(st.goals)) out.goals = h.goals;
  if (h.types !== st.types) out.types = h.types;
  if (out.map.join() === st.map.join()) delete out.map;
  // 잰 값으로 다시 깨는 비율
  const lim = exam ? out.time / 2.6 : out.moves;
  return { out, info: { k: job.k + 1, lv: job.lv || '-', knob: t.knob, m0: Math.round(lim0), m: Math.round(lim), tgt, rate: rateLife(h, lim, sim) } };
}
function rateLife(h, lim, sim, runs = 240) {
  let w = 0;
  for (let k = 0; k < runs; k++) { sim.SIM.seed(hash(h.name + 'rate') + k * 7919); const r = sim.SIM.lifeRun(h, { cap: 90 }); if (r.used <= lim) w++; }
  return +(w / runs).toFixed(2);
}

// ---------- 토벌 ----------
function tuneBattle(job, sim) {
  const st = sim.STAGES[job.i];
  const boss = st.waves.some(w => w.boss);
  const tgt = boss ? TARGET.boss : TARGET[job.lv];
  const team = require(path.join(ROOT, 'tools', 'sim.js')).pickTeam(sim, st);
  const nw = st.waves.length, Tmax = nw === 1 ? 13 : nw === 2 ? 16 : nw === 3 ? 19 : 23;
  const runs = 80;
  // cut: 2 모든 괴물 공격 간격 -1, 3 보스만 -1, 1 보스만 빼고 -1, 0 그대로
  const make = (H, am, cut) => ({ ...st, waves: st.waves.map(w => {
    const o = { ...w, hp: Math.max(300, round(w.hp * H, 10)), atk: Math.min(115, Math.round(w.atk * am)), cd: Math.max(2, w.cd - (cut === 2 || (cut === 1 && !w.boss) || (cut === 3 && w.boss) ? 1 : 0)) };
    if (w.sh) o.sh = round(w.sh * H, 10);
    return o;
  }) });
  const run = s => {
    let win = 0;
    const turns = [];
    for (let n = 0; n < runs; n++) { sim.SIM.seed(hash(st.name + 'hard') + n * 7919); const r = sim.SIM.battleRun(s, team, LV); if (r.win) { win++; turns.push(r.turns); } }
    turns.sort((a, b) => a - b);
    return { rate: win / runs, T: turns.length ? turns[turns.length >> 1] : 999 };
  };
  let best = null;
  for (const cut of boss ? [2, 3, 1, 0] : [2, 0]) {
    const r0 = run(make(1.15, 1, cut));
    if (r0.rate < tgt) { best = best || { H: 1.15, am: 1, cut, r: r0 }; continue; }
    // 1) 체력: 깨는 비율이 목표 이상이고 싸움 길이가 상한 안인 가장 큰 배율. 공격력이 상한(115)이라 그래도 쉬우면 싸움 길이 상한을 1.4배까지 늘려 다시
    const searchH = T => { let lo = 1.15, hi = 60; for (let it = 0; it < 13; it++) { const mid = Math.sqrt(lo * hi), r = run(make(mid, 1, cut)); if (r.rate >= tgt && r.T <= T) lo = mid; else hi = mid; } return lo; };
    // 2) 아직 쉬우면 공격력을 올림 (상한 115: 체력 120이면 한 방에 안 쓰러지게)
    const fit = T => {
      const lo = searchH(T);
      let am = 1, r = run(make(lo, 1, cut));
      if (r.rate > tgt + 0.04) {
        let alo = 1, ahi = Math.max(1.05, 115 / Math.min(...st.waves.map(w => w.atk)));
        for (let it = 0; it < 9; it++) { const mid = (alo + ahi) / 2, x = run(make(lo, mid, cut)); if (x.rate >= tgt) alo = mid; else ahi = mid; }
        am = alo;
        r = run(make(lo, am, cut));
      }
      return { H: lo, am, cut, r };
    };
    best = fit(Tmax);
    // 공격력이 상한에 걸려 그래도 쉬우면 싸움 길이 상한을 1.6배로 늘려 다시 (체력을 더 올림)
    if (best.r.rate > tgt + 0.06) { const b2 = fit(Math.round(Tmax * 1.6)); if (Math.abs(b2.r.rate - tgt) < Math.abs(best.r.rate - tgt)) best = b2; }
    break;
  }
  const s = make(best.H, best.am, best.cut);
  // 큰 새는 친구를 낚아채는데 봇은 모름 → make.js처럼 체력·보호막을 15% 덜어 줌
  s.waves.forEach(w => { if (w.m === 'bird') { w.hp = Math.max(300, round(w.hp * 0.85, 10)); if (w.sh) w.sh = round(w.sh * 0.85, 10); } });
  const out = { waves: s.waves.map(w => ({ hp: w.hp, atk: w.atk, cd: w.cd, ...(w.sh ? { sh: w.sh } : {}) })) };
  return { out, info: { k: job.k + 1, lv: boss ? 'boss' : job.lv || '-', H: +best.H.toFixed(2), am: +best.am.toFixed(2), cut: best.cut, tgt, rate: +best.r.rate.toFixed(2), T: best.r.T, team: team.join(',') } };
}

// ---------- JS로 ----------
const q = s => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
function lit(v) {
  if (Array.isArray(v)) return `[${v.map(lit).join(', ')}]`;
  if (v && typeof v === 'object') return `{ ${Object.entries(v).map(([k, x]) => `${k}: ${lit(x)}`).join(', ')} }`;
  return typeof v === 'string' ? q(v) : String(v);
}
function emit(sim, results) {
  const { ROUTE, CHAPTERS } = sim;
  let s = `// 하드 모드 값 (만든 파일: node tools/stages/hard.js). 보통 판에 덮어 씀 (js/hard.js Hard.life / Hard.battle)
// l: LIFE 번호 → { moves | time, stars, map?(질긴 장애물), goals?(늘린 목표) }, b: STAGES 번호 → { waves: [{ hp, atk, cd, sh? }] }
// 봇 깨는 비율 목표(친구 레벨 10): 보통 판 58%, 도전 45%, HARD 28%, 보스 30%
const HARD_DATA = { l: {}, b: {} };
`;
  let ch = -1;
  ROUTE.forEach(([t, i], k) => {
    const j = CHAPTERS.findIndex(([at], n) => at <= k && (CHAPTERS[n + 1] ? CHAPTERS[n + 1][0] > k : true));
    if (j !== ch) { ch = j; s += `// ${CHAPTERS[j][1]}\n`; }
    const r = results[k];
    if (!r) return;
    s += `HARD_DATA.${t}[${i}] = ${lit(r.out)}; // ${k + 1}\n`;
  });
  fs.writeFileSync(OUT, s);
}

// ---------- 일꾼 ----------
if (!isMainThread) {
  const sim = require(path.join(ROOT, 'tools', 'sim.js')).load();
  parentPort.on('message', job => {
    if (!job) process.exit(0);
    try {
      const res = job.report ? reportOne(job, sim) : job.t === 'b' ? tuneBattle(job, sim) : tuneLife(job, sim);
      parentPort.postMessage({ k: job.k, ...res });
    } catch (e) { parentPort.postMessage({ k: job.k, err: String(e.stack || e) }); }
  });
} else {
  const sim = require(path.join(ROOT, 'tools', 'sim.js')).load();
  const { ROUTE, LIFE, STAGES, routeLevel } = sim;
  const all = process.argv.includes('--all'), report = process.argv.includes('--report');
  const only = new Set((process.argv.find(a => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean).map(x => +x - 1));
  const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {};
  const keyOf = k => { const [t, i] = ROUTE[k]; const st = (t === 'b' ? STAGES : LIFE)[i]; return hash(JSON.stringify({ VERSION, t, lv: routeLevel(k), st })).toString(36); };
  const jobs = [], results = {};
  ROUTE.forEach(([t, i], k) => {
    const key = keyOf(k), c = cache[k];
    if (report) { if (c) jobs.push({ k, t, i, lv: routeLevel(k), report: true, out: c.out }); return; }
    if (only.size ? !only.has(k) && c : !all && c?.key === key) { results[k] = c; return; }
    jobs.push({ k, t, i, lv: routeLevel(k), key });
  });
  console.log(`${report ? '깨는 비율 볼' : '잴'} 판 ${jobs.length}개 (남겨 둔 값 ${Object.keys(results).length}개)`);
  const n = Math.max(1, Math.min(os.cpus().length - 2, jobs.length));
  let next = 0, done = 0;
  const t0 = Date.now();
  const save = () => {
    if (report) return;
    fs.writeFileSync(CACHE, JSON.stringify(Object.fromEntries(Object.entries({ ...cache, ...results }).sort((a, b) => a[0] - b[0])), null, 0));
    if (ROUTE.every((_, k) => results[k])) emit(sim, results);
  };
  const rep = [];
  if (!jobs.length) save();
  for (let w = 0; w < n; w++) {
    const wk = new Worker(__filename);
    const feed = () => { const j = jobs[next++]; wk.postMessage(j || null); };
    wk.on('message', r => {
      const job = jobs.find(j => j.k === r.k);
      done++;
      if (r.err) { console.error(`${r.k + 1}판 에러`, r.err); feed(); return; }
      if (report) rep.push(r.info); else results[r.k] = { key: job.key, out: r.out, info: r.info };
      console.log(`[${done}/${jobs.length}] ${r.k + 1} ${job.t}`, JSON.stringify(r.info), `${((Date.now() - t0) / 1000).toFixed(0)}초`);
      if (done % 20 === 0 || done === jobs.length) save();
      if (done === jobs.length && report) summary(rep);
      feed();
    });
    wk.on('error', e => { console.error(e); process.exit(1); });
    feed();
  }
}

// --report: 지금 값으로 400판씩 돌려 깨는 비율
function reportOne(job, sim) {
  const runs = 400;
  if (job.t === 'b') {
    const st = sim.STAGES[job.i], boss = st.waves.some(w => w.boss);
    const s = { ...st, waves: st.waves.map((w, n) => ({ ...w, ...job.out.waves[n] })) };
    const team = require(path.join(ROOT, 'tools', 'sim.js')).pickTeam(sim, s);
    let win = 0;
    for (let n = 0; n < runs; n++) { sim.SIM.seed(hash(st.name + 'rep') + n * 7919); if (sim.SIM.battleRun(s, team, LV).win) win++; }
    return { info: { k: job.k + 1, t: 'b', lv: boss ? 'boss' : job.lv || '-', rate: +(win / runs).toFixed(3) } };
  }
  const st = sim.LIFE[job.i], h = { ...JSON.parse(JSON.stringify(st)), ...job.out };
  const lim = h.time ? h.time / 2.6 : h.moves;
  return { info: { k: job.k + 1, t: 'l', lv: job.lv || '-', rate: rateLife(h, lim, sim, runs), m0: st.time ? Math.round(st.time / 2.6) : st.moves, m: Math.round(lim) } };
}
function summary(rep) {
  const groups = {};
  rep.forEach(r => { const g = `${r.t} ${r.lv}`; (groups[g] = groups[g] || []).push(r.rate); });
  console.log('\n종류별 깨는 비율 (평균, 최소~최대, 판 수)');
  Object.entries(groups).sort().forEach(([g, a]) => console.log(g.padEnd(14), (a.reduce((x, y) => x + y, 0) / a.length * 100).toFixed(1) + '%', `${Math.round(Math.min(...a) * 100)}~${Math.round(Math.max(...a) * 100)}%`, a.length));
  fs.writeFileSync(path.join(__dirname, 'hard-report.json'), JSON.stringify(rep));
}
