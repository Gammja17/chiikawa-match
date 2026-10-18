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
      Net.auth.onAuthStateChanged(async u => { Net.user = u; Net.listeners.forEach(f => f()); if (u) { await Net.cloudLoad(); Net.submit(); } });
    } catch (e) { console.warn('랭킹 서버를 켜지 못했어요', e); }
  },
  onChange(f) { Net.listeners.push(f); },
  // 구글 로그인. 게스트로 하던 중이면 그 기록 그대로 구글 계정에 연결
  async google() {
    const p = new firebase.auth.GoogleAuthProvider();
    const u = Net.auth.currentUser;
    try {
      if (u && u.isAnonymous) await u.linkWithPopup(p);
      else await Net.auth.signInWithPopup(p);
    } catch (e) {
      if (e.code === 'auth/credential-already-in-use' && e.credential) await Net.auth.signInWithCredential(e.credential);
      else if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') await (u?.isAnonymous ? u.linkWithRedirect(p) : Net.auth.signInWithRedirect(p));
    }
    Net.listeners.forEach(f => f());
  },
  // 진행 저장을 계정에: users/{uid} = { data(JSON), at }. 더 최근 쪽을 씀
  cloudSave() {
    if (!Net.on || !Net.user) return;
    clearTimeout(Net.saveTimer);
    Net.savePending = true;
    Net.saveTimer = setTimeout(Net.flush, 2500);
  },
  // 미뤄 둔 저장을 바로 올림 (앱을 닫거나 다른 앱으로 넘어갈 때)
  flush() {
    clearTimeout(Net.saveTimer);
    if (!Net.savePending || !Net.on || !Net.user) return;
    Net.savePending = false;
    Net.db.collection('users').doc(Net.user.uid).set({ data: JSON.stringify(Save.data), at: Save.data.savedAt || Date.now() }).catch(() => {});
  },
  async cloudLoad() {
    try {
      const d = (await Net.db.collection('users').doc(Net.user.uid).get()).data();
      if (d && d.at > (Save.data.savedAt || 0) + 1000) {
        modal({
          title: '기록 불러오기', char: 'hachiware', text: '다른 기기에서 한 기록이 있어요. 불러올까요?',
          btn2: '이 기기 기록', on2: () => Net.cloudSave(),
          btn1: '불러오기', on1: () => { localStorage.setItem(SAVE_KEY, d.data); location.reload(); },
        });
      } else Net.cloudSave();
    } catch {}
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
$('#btnMapRank').onclick = () => { Sound.play('click'); go(() => openRanking('cleared')); };

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
  if (!Net.user || Net.user.isAnonymous) {
    const guest = !!Net.user;
    me.innerHTML = `<div class="rank-note">${guest ? `게스트 ${Net.name()} · 구글 계정을 연결하면 다른 기기에서도 이어서 해요` : '로그인하면 기록이 저장되고 랭킹에 올라가요'}</div>
      <div class="login-btns"><button class="big-btn" id="btnGoogle">${guest ? '구글 계정 연결' : '구글로 로그인'}</button>${guest ? '<button class="big-btn ghost" id="btnNick2">이름 바꾸기</button>' : '<button class="big-btn ghost" id="btnGuest">게스트로 시작</button>'}</div>`;
    $('#btnGoogle').onclick = () => Net.google();
    if (guest) $('#btnNick2').onclick = async () => { const n = prompt('랭킹에 보일 이름 (12자까지)', Net.name()); if (n && n.trim()) { Save.data.nick = n.trim().slice(0, 12); Save.save(); await Net.submit(); openRanking(); } };
    else $('#btnGuest').onclick = () => Net.guest();
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
// 시작 화면: 구글로 로그인하면 진행이 계정에 저장됨 (로그인하면 이름과 '저장 중' 표시)
function titleLogin() {
  const b = $('#btnTitleLogin');
  b.hidden = !Net.on;
  if (!Net.on) return;
  const u = Net.user, google = u && !u.isAnonymous;
  b.classList.toggle('on', !!google);
  b.textContent = google ? `✓ ${Net.name()} · 진행 저장 중` : u ? '구글 계정 연결하고 진행 저장' : '구글로 로그인하고 진행 저장';
  b.onclick = google ? null : () => { Sound.play('click'); Net.google(); };
}
Net.onChange(titleLogin);
document.addEventListener('visibilitychange', () => document.hidden && Net.flush());
window.addEventListener('pagehide', () => Net.flush());
Net.init().then(titleLogin);
