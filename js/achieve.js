// 업적과 칭호, 프사: 게임 곳곳의 기록을 쌓고(대부분 Daily.add로 같이 들어옴), 목표를 넘으면 칭호를 얻음
// 고른 칭호는 프로필·지도 이름표·랭킹 이름 옆에 붙음
// Save.data.ach = { n: {기록: 누적}, best: {combo: 한 번에 최고}, got: {업적 id: 1}, title: 고른 업적 id }
const ACHIEVES = [
  { id: 'clear1', title: '새싹 토벌러', text: '모험 지도 첫 스테이지 깨기', n: 1, val: () => clearedCount() },
  { id: 'clear10', title: '풀숲 탐험가', text: '모험 지도 스테이지 10개 깨기', n: 10, val: () => clearedCount() },
  { id: 'clear50', title: '모험 지도 단골', text: '모험 지도 스테이지 50개 깨기', n: 50, val: () => clearedCount() },
  { id: 'clear150', title: '지도의 주인', text: '모험 지도 스테이지 150개 깨기', n: 150, val: () => clearedCount() },
  { id: 'boss10', title: '보스 사냥꾼', text: '보스 10마리 물리치기', n: 10, val: s => s.n.boss || 0 },
  { id: 'boss50', title: '전설의 토벌대', text: '보스 50마리 물리치기', n: 50, val: s => s.n.boss || 0 },
  { id: 'combo20', title: '콤보 장인', text: '5콤보 20번 만들기', n: 20, val: s => s.n.combo5 || 0 },
  { id: 'combo10', title: '연쇄 마법사', text: '한 번에 10콤보', n: 10, val: s => s.best.combo || 0 },
  { id: 'weed300', title: '제초 달인', text: '잡초 300개 뽑기', n: 300, val: s => s.n.weed || 0 },
  { id: 'box200', title: '택배 기사', text: '상자 200개 뜯기', n: 200, val: s => s.n.box || 0 },
  { id: 'bubble200', title: '거품 청소부', text: '거품 200개 터뜨리기', n: 200, val: s => s.n.bubble || 0 },
  { id: 'pop5000', title: '구슬 부수기 왕', text: '구슬 5000개 터뜨리기', n: 5000, val: s => s.n.pop || 0 },
  { id: 'item300', title: '아이템 박사', text: '아이템 300번 터뜨리기', n: 300, val: s => s.n.item || 0 },
  { id: 'skill100', title: '스킬 마스터', text: '친구 스킬 100번 쓰기', n: 100, val: s => s.n.skill || 0 },
  { id: 'stars300', title: '별 수집가', text: '별 300개 모으기', n: 300, val: () => Achieve.stars() },
  { id: 'friends10', title: '인기쟁이', text: '친구 10명 모으기', n: 10, val: () => Object.keys(Save.data.own || {}).length },
  { id: 'tower20', title: '인어섬 모험가', text: '인어섬 20층 오르기', n: 20, val: () => Save.data.towerBest || 0 },
  { id: 'ramen30', title: '라멘 단골', text: '라멘 30그릇 먹기', n: 30, val: s => s.n.ramen || 0 },
  // 친구들 말투 칭호
  { id: 'say_clear30', title: '와… 와아…!', text: '모험 지도 스테이지 30개 깨기', n: 30, val: () => clearedCount() },
  { id: 'say_combo50', title: '으럇~!!', text: '5콤보 50번 만들기', n: 50, val: s => s.n.combo5 || 0 },
  { id: 'say_skill300', title: '우라~ 야하~!!', text: '친구 스킬 300번 쓰기', n: 300, val: s => s.n.skill || 0 },
  { id: 'say_friends5', title: '어떻게든 되겠지~', text: '친구 5명 모으기', n: 5, val: () => Object.keys(Save.data.own || {}).length },
  { id: 'say_tower10', title: '하아?', text: '인어섬 10층 오르기', n: 10, val: () => Save.data.towerBest || 0 },
  { id: 'say_ramen10', title: '캬~! 한 그릇 더', text: '라멘 10그릇 먹기', n: 10, val: s => s.n.ramen || 0 },
  { id: 'say_weed1000', title: '풀 뽑기 장인이사!', text: '잡초 1000개 뽑기', n: 1000, val: s => s.n.weed || 0 },
];

const Achieve = {
  s() {
    if (!Save.data.ach) { Save.data.ach = {}; Achieve.quiet = true; } // 처음엔 이미 해 둔 것만큼 조용히 채움 (알림이 쏟아지지 않게)
    const a = Save.data.ach;
    a.n = a.n || {}; a.best = a.best || {}; a.got = a.got || {};
    return a;
  },
  stars: () => [...(Save.data.stars || []), ...(Save.data.life || [])].reduce((t, v) => t + (v || 0), 0),
  // 누적 기록 (Daily.add가 같이 부름)
  add(k, n = 1) {
    if (!n) return;
    const s = Achieve.s();
    s.n[k] = (s.n[k] || 0) + n;
    Achieve.check();
  },
  // 한 번에 낸 최고 기록 (콤보)
  best(k, v) {
    const s = Achieve.s();
    if (v <= (s.best[k] || 0)) return;
    s.best[k] = v;
    Achieve.check();
  },
  // 새로 넘은 목표가 있으면 칭호를 주고 알림 (처음 얻은 칭호는 바로 달아 줌)
  check() {
    const s = Achieve.s();
    let got = false;
    ACHIEVES.forEach(a => {
      if (s.got[a.id] || a.val(s) < a.n) return;
      s.got[a.id] = 1;
      got = true;
      if (!s.title) s.title = a.id;
      if (!Achieve.quiet && typeof Daily !== 'undefined') Daily.toast(`업적 달성! 칭호 '${a.title}'`, 'medal');
    });
    Achieve.quiet = false;
    if (got) { Save.save(); if (typeof profileChip === 'function' && $('#map').classList.contains('active')) profileChip(); }
  },
  title() { const a = ACHIEVES.find(x => x.id === Achieve.s().title && Achieve.s().got[x.id]); return a ? a.title : ''; },
  // 프로필 창: 칭호 고르기 + 업적 진행
  html() {
    const s = Achieve.s(), cnt = ACHIEVES.filter(a => s.got[a.id]).length;
    return `<div class="sheet-label">칭호 <small>업적 ${cnt} / ${ACHIEVES.length} · 얻은 칭호를 누르면 랭킹 이름 옆에 붙어요</small></div>
      <div class="ach-list">${ACHIEVES.map(a => {
        const v = Math.min(a.n, a.val(s)), got = s.got[a.id], on = s.title === a.id && got;
        return `<button class="ach${got ? ' got' : ''}${on ? ' on' : ''}" data-ach="${a.id}" ${got ? '' : 'disabled'}>
          <b>${a.title}</b><small>${a.text}</small>${got ? `<i>${on ? '다는 중' : '달기'}</i>` : `<span class="mbar"><i style="width:${(v / a.n) * 100}%"></i></span><em>${v} / ${a.n}</em>`}</button>`;
      }).join('')}</div>`;
  },
  bind(card, redraw) {
    card.querySelectorAll('.ach.got').forEach(b => (b.onclick = () => {
      const s = Achieve.s();
      s.title = s.title === b.dataset.ach ? null : b.dataset.ach; // 다시 누르면 떼기
      Save.save();
      Sound.play('pop', 1.2, 0.5);
      if (typeof Net !== 'undefined') Net.submit();
      redraw();
    }));
  },
};

// 프사: 기본은 최애 친구 얼굴, 옷을 해금했으면 그 옷 그림으로도 (Save.data.pic = '친구:옷')
const Pic = {
  list() {
    const out = [];
    Object.entries(Save.data.skins || {}).forEach(([cid, ss]) => (ss || []).forEach(sk => SKINS[cid]?.[sk] && out.push(cid + ':' + sk)));
    return out;
  },
  valid(v) { if (!v) return false; const [c, sk] = v.split(':'); return !!SKINS[c]?.[sk] && hasSkin(c, sk); },
  cur() { return Pic.valid(Save.data.pic) ? Save.data.pic : null; },
  src(v = Pic.cur()) { if (!v) return FACE(favId()); const [c, sk] = v.split(':'); return SKIN(c, sk); },
  img(cls = '') { return `<img src="${Pic.src()}" class="${Pic.cur() ? 'pic ' : ''}${cls}" alt="">`; },
  // 랭킹에 올리는 값: 옷 프사면 '친구:옷', 아니면 최애 친구 id
  code() { return Pic.cur() || favId(); },
  html() {
    const cur = Pic.cur(), list = Pic.list();
    return `<div class="sheet-label">프사 <small>${list.length ? '옷을 해금하면 그 옷 그림으로도 할 수 있어요' : '가게에서 옷을 해금하면 그 옷 그림으로도 할 수 있어요'}</small></div>
      <div class="pic-grid"><button class="${cur ? '' : 'on'}" data-pic=""><span class="pf-ava"><img src="${FACE(favId())}" alt=""></span><small>최애 얼굴</small></button>${list.map(v => {
        const [c, sk] = v.split(':');
        return `<button class="${cur === v ? 'on' : ''}" data-pic="${v}"><span class="pf-ava"><img class="pic" src="${SKIN(c, sk)}" alt=""></span><small>${SKINS[c][sk].name}</small></button>`;
      }).join('')}</div>`;
  },
  bind(card, redraw) {
    card.querySelectorAll('[data-pic]').forEach(b => (b.onclick = () => {
      Save.data.pic = b.dataset.pic || null;
      Save.save();
      Sound.play('pop', 1.2, 0.5);
      if (typeof Net !== 'undefined') Net.submit();
      redraw();
    }));
  },
};
