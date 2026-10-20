// 스테이지 플레이 기록(Google Analytics)과 막힌 스테이지 도와주기
// - 기록: 모험 지도 스테이지만. level_start(시작), level_continue(이어하기), level_end(클리어·실패·중간 포기)
//   level_end에는 그 판 동안의 프레임 기록도 (fps, jank_pct, slow_pct, worst_ms, light, dpr: js/particles.js PerfWatch)
//   GA4 권장 이벤트 이름이라 GA 보고서에 바로 잡힘. 진짜 사이트에서만 보냄(gtag는 workers.dev에서만 켜짐, net.js), 로컬에선 콘솔에만
//   보는 법은 README '플레이 기록 보기'
// - 도와주기: 아직 못 깬 스테이지를 3번 넘게 실패하면 하치와레가 응원 선물 (퍼즐: 랏코 검 2개 / 토벌: 스킬 게이지 반)
//   5번부터는 더 (퍼즐: 폭탄 + 이동 3번 또는 8초 / 토벌: 체력 +20%). 깨면 실패 횟수는 지움
const Stats = {
  run: null,
  send(name, p) {
    try { if (window.gtag) gtag('event', name, p); } catch {}
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') console.debug('[stats]', name, JSON.stringify(p));
  },
  base() {
    const r = Stats.run;
    return { level_name: `stage_${r.k + 1}`, stage: r.k + 1, chapter: Math.floor(r.k / 10) + 1, mode: r.t === 'b' ? 'battle' : 'puzzle', difficulty: routeLevel(r.k) || 'normal', attempt: r.attempt, help: r.help };
  },
  // t: 'b' 토벌 / 'l' 일상, i: 그 목록 번호. help: 이번에 받은 도움 단계(0~2)
  start(t, i, help = 0) {
    if (Stats.run && !Stats.run.ended) Stats.end('quit'); // 끝을 못 보고 넘어간 판
    const k = routeIdx(t, i);
    if (k < 0) { Stats.run = null; return; }
    const tries = (Save.data.tries = Save.data.tries || {});
    tries[k] = (tries[k] || 0) + 1;
    Stats.run = { t, i, k, t0: Date.now(), attempt: tries[k], help, cont: 0, moves: 0, ended: false };
    PerfWatch.begin();
    Stats.send('level_start', Stats.base());
  },
  turn() { if (Stats.run && !Stats.run.ended) Stats.run.moves++; },
  cont(method) {
    if (!Stats.run || Stats.run.ended) return;
    Stats.run.cont++;
    Stats.send('level_continue', { ...Stats.base(), method }); // free(공짜 +5번) / ticket(이어하기권) / coins
  },
  // result: clear / fail / quit. extra: stars, moves_left, goals_left(남은 목표 %), monster_hp(남은 괴물 체력 %) …
  end(result, extra = {}) {
    const r = Stats.run;
    if (!r || r.ended) return;
    r.ended = true;
    Stats.send('level_end', { ...Stats.base(), success: result === 'clear', result, moves_used: r.moves, continues: r.cont, duration_sec: Math.round((Date.now() - r.t0) / 1000), ...extra, ...PerfWatch.take() });
    const fails = (Save.data.fails = Save.data.fails || {});
    if (result === 'clear') delete fails[r.k];
    else if (r.moves > 0) fails[r.k] = (fails[r.k] || 0) + 1; // 한 수도 안 두고 나간 건 안 셈
    Save.save();
  },
};
// 앱을 닫거나 다른 앱으로 넘어가면 하던 판은 '중간 포기'로 (돌아와서 이어 하면 그대로 계속 셈)
addEventListener('pagehide', () => { if (Stats.run && !Stats.run.ended && Stats.run.moves > 0) Stats.send('level_end', { ...Stats.base(), success: false, result: 'closed', moves_used: Stats.run.moves, continues: Stats.run.cont, duration_sec: Math.round((Date.now() - Stats.run.t0) / 1000), ...PerfWatch.take() }); });

const Help = {
  // 이 스테이지에서 받을 도움 단계: 0 없음, 1 (3번 실패), 2 (5번 실패). 이미 깬 스테이지는 없음
  level(t, i) {
    const k = routeIdx(t, i);
    if (k < 0 || routeStars(k) != null) return 0;
    const f = Save.data.fails?.[k] || 0;
    return f >= 5 ? 2 : f >= 3 ? 1 : 0;
  },
  // 일상 퍼즐: 판을 만든 뒤에 부름. 랏코 검 2개(+폭탄), 이동·시간 더하기
  life(lv) {
    if (!lv) return;
    const spots = [];
    Board.each(B.grid, t => { if (t.type >= 0 && !t.special && !t.lock) spots.push(t); });
    (lv >= 2 ? ['h', 'v', 'bomb'] : ['h', 'v']).forEach(k => {
      const t = spots.splice(Math.floor(Math.random() * spots.length), 1)[0];
      if (t) { t.special = k; t.type = -1; }
    });
    if (lv >= 2) { if (L.st.time) L.time += 8; else L.moves += 3; }
  },
  // 토벌: 편성한 친구 스킬 게이지를 반까지, 2단계면 체력 +20%
  battle(lv) {
    if (!lv) return;
    B.gauge = B.gauge.map((g, j) => (j < B.real ? Math.max(g, Math.floor(skillNeed(teamCh(j).id, false) / 2)) : g));
    if (lv >= 2) { const add = Math.round(B.teamMax * 0.2); B.teamMax += add; B.teamHp += add; }
  },
  say(lv, mode) {
    if (!lv) return Promise.resolve();
    const gift = mode === 'b' ? (lv >= 2 ? '스킬 게이지 반이랑, 체력도 넉넉하게' : '다 같이 응원해서 스킬 게이지 반부터') : lv >= 2 ? '랏코 검 두 개랑 폭탄, 그리고 조금 더 움직일 수 있게' : '랏코 검 두 개';
    return playStory([['hachiware', `여기 좀 어렵지? 괜찮아, 다들 막혔던 데야!`], ['hachiware', `${gift} 챙겨 왔어. 같이 해 보자~!`]]);
  },
};
