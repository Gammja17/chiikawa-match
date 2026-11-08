// 스테이지 데이터 점검: 판 크기, 목표와 판 글자, 얼굴 가짓수, 아이콘·재료 그림 파일, 대사 속 친구, 괴물
// 하드 모드 값(js/hard-data.js)도 보통 판에 덮어 같은 점검 + 500판이 다 있는지, 판 크기가 같은지, 이동이 보통보다 적은지
//   node tools/stages/check.js
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const { load } = require(path.join(ROOT, 'tools', 'sim.js'));
const vm = require('vm');
const ctx = load();
const G = vm.runInContext('({ LIFE, STAGES, ROUTE, CHAPTERS, STORY, STORY_AFTER, LIFE_STORY, LIFE_STORY_AFTER, CHAR_NAME, MONSTERS, STORY_CAST, LIFE_CHARS, CHARS })', ctx);
const item = n => ['.webp', '.png'].some(x => fs.existsSync(path.join(ROOT, 'assets', 'img', 'items', n + x)));
const bad = [];
const err = (where, msg) => bad.push(`${where}: ${msg}`);
const checkLife = (st, w) => {
  const R = st.map.length, C = st.map[0].length;
  if (R < 5 || R > 9 || C < 5 || C > 9) err(w, `판 크기 ${R}x${C}`);
  if (st.map.some(r => r.length !== C)) err(w, '줄 길이가 다름');
  if (st.goals.length > 3) err(w, `목표 ${st.goals.length}개 (화면에 3개까지)`);
  const txt = st.map.join('');
  const has = ch => txt.includes(ch);
  for (const g of st.goals) {
    if (g.k === 'weed' && !has('w') && !has('W')) err(w, '잡초 목표인데 잡초가 없음');
    if (g.k === 'box' && !has('b') && !has('g')) err(w, '상자 목표인데 상자가 없음');
    if (g.k === 'bubble' && !has('o')) err(w, '거품 목표인데 거품이 없음');
    if (g.k === 'lock' && !has('l')) err(w, '리본 목표인데 리본이 없음');
    if (g.k === 'syrup' && !has('s')) err(w, '시럽 목표인데 시럽 칸이 없음');
    if (g.k === 'clam' && !has('c')) err(w, '진주 목표인데 조개가 없음');
    if (g.k === 'sand' && !has('d')) err(w, '모래 목표인데 모래 바닥이 없음');
    if (g.k === 'ink' && !has('k')) err(w, '먹물 목표인데 먹물 구슬이 없음');
    if (g.k === 'seat' && !has('a')) err(w, '관객 목표인데 빈 객석이 없음');
    if (g.k === 'feather' && !has('f')) err(w, '깃털 목표인데 깃털이 없음');
    if (g.k === 'note' && !(st.beat?.rows?.length && st.beat.every > 0)) err(w, '음표 목표인데 박자 줄(beat)이 없음');
    if (g.k === 'clap' && !(st.spot?.size > 0 && st.spot.every > 0)) err(w, '박수 목표인데 스포트라이트(spot)가 없음');
    if ((g.k === 'note' || g.k === 'clap') && !(g.n > 0)) err(w, `${g.k} 목표 수 없음`);
    if (g.k === 'ing' && !st.ing) err(w, '재료 목표인데 ing가 없음');
    if (g.k === 'char' && G.LIFE_CHARS.indexOf(g.id) >= st.types) err(w, `${g.id} 얼굴이 판에 안 나옴 (types ${st.types})`);
    if ((g.k === 'char' || g.k === 'score') && !(g.n > 0)) err(w, `${g.k} 목표 수 없음`);
  }
  // 소용돌이: 입구(v)와 출구(V) 수가 같아야 하고, 입구 밑은 막혀 있어야 함(맨 아래 줄이거나 밑이 구멍)
  const nv = (txt.match(/v/g) || []).length, nV = (txt.match(/V/g) || []).length;
  if (nv !== nV) err(w, `소용돌이 입구 ${nv}개, 출구 ${nV}개`);
  st.map.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === 'v' && r < R - 1 && st.map[r + 1][c] !== '#') err(w, `소용돌이 입구 (${r},${c}) 밑이 열려 있음`); }));
  if (st.current && !(st.current.every > 0 && st.current.rows.every(r => r >= 0 && r < R))) err(w, `물살 ${JSON.stringify(st.current)}`);
  if (st.ing) st.ing.kinds.forEach(k => item(k) || err(w, `재료 그림 없음 ${k}`));
  if (!item(st.icon)) err(w, `아이콘 없음 ${st.icon}`);
  if (!(st.moves > 0) && !(st.time > 0)) err(w, '이동 수·시간 없음');
  if (!(st.stars[0] < st.stars[1] && st.stars[1] < st.stars[2])) err(w, `별 점수 순서 ${st.stars}`);
  if (st.host && !G.CHAR_NAME[st.host]) err(w, `host ${st.host}`);
};
G.LIFE.forEach((st, i) => checkLife(st, `일상 ${i} ${st.name}`));
// 하드 모드
const HD = path.join(ROOT, 'js', 'hard-data.js');
if (fs.existsSync(HD)) {
  vm.runInContext(fs.readFileSync(HD, 'utf8') + ';this.HARD_DATA = HARD_DATA;', ctx, { filename: 'js/hard-data.js' });
  const H = ctx.HARD_DATA;
  G.ROUTE.forEach(([t, i], k) => {
    const h = H[t][i], w = `하드 ${k + 1} ${(t === 'b' ? G.STAGES : G.LIFE)[i].name}`;
    if (!h) return err(w, '하드 값 없음 (node tools/stages/hard.js)');
    if (t === 'b') {
      const st = G.STAGES[i];
      if (h.waves.length !== st.waves.length) err(w, '웨이브 수가 다름');
      h.waves.forEach(x => { if (!(x.hp > 0 && x.atk > 0 && x.atk <= 120 && x.cd >= 2)) err(w, `괴물 값 ${JSON.stringify(x)}`); });
      return;
    }
    const st = G.LIFE[i], hs = { ...JSON.parse(JSON.stringify(st)), ...JSON.parse(JSON.stringify(h)) };
    checkLife(hs, w);
    if (hs.map.length !== st.map.length || hs.map[0].length !== st.map[0].length) err(w, '판 크기가 보통과 다름');
    if (st.moves && !(hs.moves < st.moves)) err(w, `이동 ${hs.moves} (보통 ${st.moves})`);
    if (st.time && !(hs.time < st.time)) err(w, `시간 ${hs.time} (보통 ${st.time})`);
  });
} else err('js/hard-data.js', '없음');
G.STAGES.forEach((st, i) => st.waves.forEach(wv => {
  if (!G.MONSTERS[wv.m]) err(`토벌 ${i} ${st.name}`, `괴물 ${wv.m}`);
  if (!(wv.hp > 0 && wv.atk > 0 && wv.cd > 0)) err(`토벌 ${i} ${st.name}`, '체력·공격·턴');
}));
for (const [name, book] of Object.entries({ STORY: G.STORY, STORY_AFTER: G.STORY_AFTER, LIFE_STORY: G.LIFE_STORY, LIFE_STORY_AFTER: G.LIFE_STORY_AFTER }))
  for (const [k, lines] of Object.entries(book)) lines.forEach(([id, a]) => {
    if (id === 'scene') { if (!fs.existsSync(path.join(ROOT, a))) err(`${name}[${k}]`, `장면 그림 없음 ${a}`); return; } // ['scene', 그림, 설명]
    G.CHAR_NAME[id] || G.MONSTERS[id] || G.STORY_CAST[id] || err(`${name}[${k}]`, `모르는 친구 ${id}`);
  });
G.ROUTE.forEach(([t, i], k) => { if (!(t === 'b' ? G.STAGES : G.LIFE)[i]) err(`루트 ${k + 1}`, '없는 판'); });
console.log(`루트 ${G.ROUTE.length}판 (일상 ${G.LIFE.length}, 토벌 ${G.STAGES.length}), 장 ${G.CHAPTERS.length}개`);
console.log(bad.length ? bad.join('\n') : '문제 없음');
process.exit(bad.length ? 1 : 0);
