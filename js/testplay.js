// 스테이지 에디터(editor.html)의 '테스트 플레이': index.html?test 로 열면 에디터에서 그린 판을 바로 해 봄
// 기기·계정 저장(Save.save), 로그인·랭킹·통계(net.js)는 꺼져 있고 하트도 안 씀. 친구는 이 판에서만 전부 데려갈 수 있게 채워 둠
// 판은 localStorage 'chiikawaEditor.test', 끝난 결과는 'chiikawaEditor.result'에 남겨서 에디터가 보여 줌
const TestPlay = {
  KEY: 'chiikawaEditor.test',
  stage() { try { return JSON.parse(localStorage.getItem(TestPlay.KEY)); } catch { return null; } },
  start() {
    const st = TestPlay.stage();
    if (!st) return TestPlay.back();
    return Life.begin(st, { kind: 'test' });
  },
  back() { location.href = 'editor.html'; },
  note(res) {
    try { localStorage.setItem('chiikawaEditor.result', JSON.stringify({ name: L.st.name, score: L.score, ...res, at: Date.now() })); } catch {}
  },
  cleared(left) {
    const st = L.st, stars = L.score >= st.stars[2] ? 3 : L.score >= st.stars[1] ? 2 : 1;
    const used = st.time ? null : st.moves - left;
    TestPlay.note({ clear: true, stars, left, used });
    Sound.play('win', 1);
    modal({
      title: '클리어!', stars, char: CHARS[L.helper].id, text: '테스트 플레이라서 기록은 남지 않아요',
      rows: [['점수', L.score], [st.time ? '남은 시간' : '남은 이동', st.time ? `${left}초` : left]],
      btn2: '에디터로', on2: TestPlay.back,
      btn1: '다시 하기', on1: () => go(TestPlay.start),
    });
  },
  failed() {
    const left = L.st.goals.filter(g => Life.remain(g) > 0).slice(0, 3).map(g => [`<img class="row-ic" src="${GOAL_ICON[g.k](g)}">`, Life.remain(g)]);
    TestPlay.note({ clear: false, left: L.st.goals.map(g => [g.k, Life.remain(g)]), pct: Life.leftPct() });
    modal({
      title: '실패…', stars: 0, img: 'assets/img/art/scene_crying.jpg', photo: true, rows: left, text: '남은 목표예요',
      btn2: '에디터로', on2: TestPlay.back,
      btn1: '다시 하기', on1: () => go(TestPlay.start),
    });
  },
};

if (window.TEST_PLAY) {
  Save.data = JSON.parse(JSON.stringify(Save.data)); // 이 판에서만 쓰는 사본 (저장은 안 됨)
  Save.data.own = Save.data.own || {};
  CHARS.forEach(c => { if (!Save.data.own[c.id]) Save.data.own[c.id] = 1; });
  Save.data.coins = Math.max(Save.data.coins || 0, 99999); // 시작 아이템도 마음껏
  const begin = () => setTimeout(TestPlay.start, 300);
  if (document.readyState === 'complete') begin(); else addEventListener('load', begin);
}
