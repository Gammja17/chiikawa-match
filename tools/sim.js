// 자동 플레이 봇: 판 로직(js/board.js)과 스테이지 데이터를 그대로 불러와 화면 없이 일상 퍼즐·토벌을 돌림
// 스테이지 이동 수, 별 점수, 괴물 체력을 맞출 때 씀 (tools/tune.js가 이걸로 잼)
//   node tools/sim.js life 12 [판 수]      일상 퍼즐 LIFE[12]: 깨는 데 든 수 분포와 지금 이동 수로 깨는 비율
//   node tools/sim.js battle 5 [판 수]     토벌 STAGES[5]: 깨는 비율 (친구 레벨은 --lv=3)
//   node tools/sim.js route [판 수]        루트 전체를 차례로
// 봇: 둘 수 있는 수를 하나씩 미리 터뜨려 보고(새로 떨어지는 구슬은 무작위) 목표에 제일 가까워지는 수를 둠. 스킬은 게이지가 차면 바로 씀
const fs = require('fs'), vm = require('vm'), path = require('path');
const ROOT = path.join(__dirname, '..');

function load() {
  const dummy = new Proxy(function () {}, { get: (t, k) => (k === Symbol.toPrimitive ? () => '' : dummy), set: () => true, apply: () => dummy });
  const ctx = vm.createContext({ console, Math, $: () => dummy, document: dummy, location: { href: 'http://x/' }, URL, setTimeout, clearTimeout, setInterval: () => 0 });
  for (const f of ['js/data.js', 'js/board.js', 'js/life.js', 'js/chapters.js']) if (fs.existsSync(path.join(ROOT, f))) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'sim-core.js'), 'utf8'), ctx, { filename: 'js/sim-core.js' });
  // const로 선언된 것은 ctx에 안 붙어서 꺼내 둠
  Object.assign(ctx, vm.runInContext('({ LIFE, STAGES, ROUTE, CHAPTERS, CHARS, attrMult, routeLevel, HARD_AT, CHALLENGE_AT })', ctx));
  return ctx;
}

// ---------- 밖(Node) ----------
// 속성에 맞춰 편성: 카니(회복)는 늘 넣고, 나머지 넷은 공격력 × 상성이 좋은 순
const POOL = ['chiikawa', 'hachiware', 'usagi', 'rakko', 'momonga', 'shisa', 'kurimanju'];
function pickTeam(ctx, stage, owned = POOL) {
  const { CHARS, attrMult } = ctx;
  const score = id => { const c = CHARS.find(x => x.id === id); return stage.waves.reduce((a, w) => a + (c.dmg || 0) * (1 + (c.crit || 0) * 1.5) * attrMult(c.attr, w.a) * w.hp, 0); };
  return ['kani', ...owned.filter(id => id !== 'kani').sort((a, b) => score(b) - score(a)).slice(0, 4)];
}

const pct = (arr, p) => { const a = arr.slice().sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.floor(p * a.length))]; };

module.exports = { load, pickTeam, pct, POOL };

if (require.main === module) {
  const [mode = 'life', a1, a2] = process.argv.slice(2).filter(x => !x.startsWith('--'));
  const opt = Object.fromEntries(process.argv.filter(x => x.startsWith('--')).map(x => x.slice(2).split('=')));
  const ctx = load();
  const runs = +(mode === 'route' ? a1 : a2) || 100;
  const lifeOne = i => {
    const st = ctx.LIFE[i], need = [];
    for (let k = 0; k < runs; k++) { ctx.SIM.seed(k * 7919 + i); need.push(ctx.SIM.lifeRun(st).used); }
    const lim = st.time ? st.time / 2.6 : st.moves, rate = need.filter(n => n <= lim).length / runs;
    return { i, name: st.name, lim: Math.round(lim), p50: pct(need, 0.5), p90: pct(need, 0.9), rate };
  };
  const battleOne = (i, lv) => {
    const st = ctx.STAGES[i], team = pickTeam(ctx, st);
    let w = 0;
    for (let k = 0; k < runs; k++) { ctx.SIM.seed(k * 7919 + i); if (ctx.SIM.battleRun(st, team, lv).win) w++; }
    return { i, name: st.name, team: team.join(','), rate: w / runs };
  };
  const t0 = Date.now();
  if (mode === 'life') console.log(lifeOne(+a1));
  else if (mode === 'battle') console.log(battleOne(+a1, +(opt.lv || 1)));
  else if (mode === 'route') {
    const { ROUTE, routeLevel } = ctx;
    const from = +(opt.from || 0), to = +(opt.to || ROUTE.length);
    for (let k = from; k < to; k++) {
      const [t, i] = ROUTE[k];
      const r = t === 'l' ? lifeOne(i) : battleOne(i, +(opt.lv || 1));
      console.log(String(k + 1).padStart(3), t, (routeLevel(k) || '-').padEnd(9), r.name.padEnd(12), t === 'l' ? `수 ${r.lim} 중간 ${r.p50} 90% ${r.p90}` : r.team, `깸 ${Math.round(r.rate * 100)}%`);
    }
  }
  console.error(`${((Date.now() - t0) / 1000).toFixed(1)}초`);
}
