// 스테이지 에디터의 일꾼: 게임 데이터와 자동 플레이 봇(js/sim-core.js)을 화면 없이 불러서 판을 재 줌
// tools/sim.js가 Node vm에서 하는 것과 같음: $, document는 아무 일도 안 하는 가짜로 둠
const dummy = new Proxy(function () {}, { get: (t, k) => (k === Symbol.toPrimitive ? () => '' : dummy), set: () => true, apply: () => dummy });
self.$ = () => dummy;
self.document = dummy;
self.setInterval = () => 0;
importScripts('data.js', 'board.js', 'life.js', 'chapters.js', 'sim-core.js');

const hash = s => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.codePointAt(0), 16777619); return h >>> 0; }; // make.js와 같은 씨앗

// 처음 한 번: 모험 지도의 일상 퍼즐(불러오기 목록)과 친구 이름
const routeLife = ROUTE.map(([t, i], k) => [t, i, k]).filter(([t]) => t === 'l').map(([, i, k]) => ({
  k, chapter: (CHAPTERS.filter(([at]) => at <= k).pop() || [0, ''])[1], lv: routeLevel(k), st: LIFE[i],
}));
postMessage({ type: 'data', route: routeLife, chars: CHARS.map(c => ({ id: c.id, name: c.name, ring: c.ring })), lifeChars: LIFE_CHARS });

// 재기: runs판을 이동 제한 없이(최대 90수) 돌려 깨는 데 든 수를 모으고, limit이 있으면 그 수로 다시 돌려 점수(보너스 포함)를 모음
onmessage = ({ data: { st, runs, limit } }) => {
  const need = [], scores = [];
  let bad = 0;
  const total = runs * (limit ? 2 : 1);
  for (let k = 0; k < runs; k++) {
    SIM.seed(hash(st.name) + k * 7919);
    const r = SIM.lifeRun(st, { cap: 90 });
    if (r.bad) bad++;
    need.push(r.used);
    if (k % 10 === 9) postMessage({ type: 'progress', done: k + 1, total });
  }
  if (limit) for (let k = 0; k < runs; k++) {
    SIM.seed(hash(st.name) + 99991 + k * 104729);
    const r = SIM.lifeRun(st.time ? { ...st, time: limit * 2.6 } : { ...st, moves: limit }, { limit });
    if (isFinite(r.used)) scores.push(r.score);
    if (k % 10 === 9) postMessage({ type: 'progress', done: runs + k + 1, total });
  }
  postMessage({ type: 'result', need, bad, scores });
};
