// 로그인(구글, 게스트)과 랭킹. Firebase 설정이 없으면 조용히 꺼져 있음
// Firestore: scores/{uid} = { name, cleared(깬 스테이지 수), tower(인어섬 최고 층), contest(제초 대회 최고 점수), updated }
const loadScript = src => new Promise((ok, bad) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = bad; document.head.appendChild(s); });
const clearedCount = () => ROUTE.filter((_, k) => routeStars(k) != null).length;

const Net = {
  on: false, user: null, listeners: [],
  async init() {
    if (!window.FIREBASE_CONFIG) return;
    try {
      for (const f of ['app', 'auth', 'firestore']) await loadScript(`assets/vendor/firebase-${f}-compat.js`);
      firebase.initializeApp(window.FIREBASE_CONFIG);
      Net.auth = firebase.auth();
      Net.db = firebase.firestore();
      Net.on = true;
      Net.auth.getRedirectResult().catch(() => {});
      Net.auth.onAuthStateChanged(u => { Net.user = u; Net.listeners.forEach(f => f()); if (u) Net.submit(); });
    } catch (e) { console.warn('랭킹 서버를 켜지 못했어요', e); }
  },
  onChange(f) { Net.listeners.push(f); },
  async google() {
    const p = new firebase.auth.GoogleAuthProvider();
    try { await Net.auth.signInWithPopup(p); } catch { await Net.auth.signInWithRedirect(p); }
  },
  guest() { return Net.auth.signInAnonymously(); },
  logout() { return Net.auth.signOut(); },
  name() { return (Save.data.nick || Net.user?.displayName || '이름 없는 친구').slice(0, 12); },
  // 내 기록 올리기: 서버에 있는 값과 비교해 더 큰 쪽을 남김 (다른 기기에서 한 기록도 지키게)
  async submit() {
    if (!Net.on || !Net.user) return;
    try {
      const ref = Net.db.collection('scores').doc(Net.user.uid);
      const old = (await ref.get()).data() || {};
      await ref.set({
        name: Net.name(),
        cleared: Math.max(old.cleared || 0, clearedCount()),
        tower: Math.max(old.tower || 0, Save.data.towerBest || 0),
        contest: Math.max(old.contest || 0, Save.data.contestBest || 0),
        updated: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (e) { console.warn('기록을 못 올렸어요', e); }
  },
  async top(field) {
    const q = await Net.db.collection('scores').orderBy(field, 'desc').limit(50).get();
    return q.docs.map(d => ({ id: d.id, ...d.data() }));
  },
};

// ---------- 도전 화면: 인어섬 탐험, 제초 대회, 랭킹 ----------
function openChallenge() {
  Life.stopTimer();
  show('challenge');
  Meta.coinUI();
  $('#towerBest').textContent = Save.data.towerBest ? `최고 ${Save.data.towerBest}층` : '첫 도전!';
  $('#contestBest').textContent = Save.data.contestBest ? `최고 ${Save.data.contestBest}점` : '첫 도전!';
}
$('#btnTower').onclick = () => { Sound.play('open'); go(() => Tower.start(1)); };
$('#btnContest').onclick = () => { Sound.play('open'); go(() => Life.begin(CONTEST, { kind: 'contest' })); };
$('#btnChallenge').onclick = () => { Sound.play('click'); go(openChallenge); };
$('#btnRanking').onclick = () => { Sound.play('click'); go(() => openRanking('cleared')); };
document.querySelectorAll('.btn-tochallenge').forEach(b => (b.onclick = () => { Sound.play('click'); go(openChallenge); }));

const BOARDS = { cleared: { label: '깬 스테이지', unit: '개' }, tower: { label: '인어섬', unit: '층' }, contest: { label: '제초 대회', unit: '점' } };
let rankTab = 'cleared';
async function openRanking(tab = rankTab) {
  rankTab = tab;
  show('ranking');
  document.querySelectorAll('.rank-tabs button').forEach(b => b.classList.toggle('on', b.dataset.t === tab));
  const me = $('#rankMe'), list = $('#rankList');
  const mine = { cleared: clearedCount(), tower: Save.data.towerBest || 0, contest: Save.data.contestBest || 0 }[tab];
  if (!Net.on) {
    me.innerHTML = `<div class="rank-note">랭킹 서버가 아직 꺼져 있어요</div>`;
    list.innerHTML = `<li class="mine"><span class="rk">나</span><span class="nm">${Net.name()}</span><b>${mine}${BOARDS[tab].unit}</b></li>`;
    return;
  }
  if (!Net.user) {
    me.innerHTML = `<div class="rank-note">로그인하면 내 기록이 랭킹에 올라가요</div>
      <div class="login-btns"><button class="big-btn" id="btnGoogle">구글로 로그인</button><button class="big-btn ghost" id="btnGuest">게스트로 시작</button></div>`;
    $('#btnGoogle').onclick = () => Net.google();
    $('#btnGuest').onclick = () => Net.guest();
  } else {
    me.innerHTML = `<div class="me-row"><span class="nm">${Net.name()}</span><button class="mini-btn" id="btnNick">이름 바꾸기</button><button class="mini-btn" id="btnLogout">로그아웃</button></div>`;
    $('#btnNick').onclick = async () => {
      const n = prompt('랭킹에 보일 이름 (12자까지)', Net.name());
      if (n && n.trim()) { Save.data.nick = n.trim().slice(0, 12); Save.save(); await Net.submit(); openRanking(); }
    };
    $('#btnLogout').onclick = async () => { await Net.logout(); openRanking(); };
  }
  list.innerHTML = '<li class="rank-note">불러오는 중…</li>';
  try {
    const rows = await Net.top(tab);
    list.innerHTML = rows.map((r, k) => `<li class="${r.id === Net.user?.uid ? 'mine' : ''}"><span class="rk${k < 3 ? ' top' + (k + 1) : ''}">${k + 1}</span><span class="nm">${String(r.name || '???').replace(/[<>&]/g, '')}</span><b>${r[tab] || 0}${BOARDS[tab].unit}</b></li>`).join('') ||
      '<li class="rank-note">아직 아무도 없어요. 첫 번째가 되어 보세요!</li>';
  } catch {
    list.innerHTML = '<li class="rank-note">랭킹을 불러오지 못했어요</li>';
  }
}
document.querySelectorAll('.rank-tabs button').forEach(b => (b.onclick = () => { Sound.play('pop', 1.2, 0.5); openRanking(b.dataset.t); }));
Net.onChange(() => { if ($('#ranking').classList.contains('active')) openRanking(); });
Net.init();
