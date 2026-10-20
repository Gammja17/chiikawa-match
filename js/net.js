// 로그인(구글, 게스트)과 랭킹. Firebase 설정이 없으면 조용히 꺼져 있음
// Firestore: scores/{uid} = { name, cleared(깬 스테이지 수), tower(인어섬 최고 층), contest(제초 대회 최고 점수), updated }
const loadScript = src => new Promise((ok, bad) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = bad; document.head.appendChild(s); });
const clearedCount = () => ROUTE.filter((_, k) => routeStars(k) != null).length;
// 기록 한 벌의 진행 정도 (어느 쪽 기록을 쓸지 고를 때 보여 줌)
const progressOf = d => {
  const n = a => (a || []).filter(v => v != null).length;
  return { cleared: n(d.stars) + n(d.life), friends: Object.keys(d.own || {}).length, coins: d.coins || 0 };
};

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
      Net.analytics();
      Net.auth.getRedirectResult().catch(() => {});
      Net.auth.onAuthStateChanged(async u => { Net.user = u; Net.ready = true; Net.synced = false; Net.listeners.forEach(f => f()); if (u) { await Net.cloudLoad(); Net.submit(); } });
    } catch (e) { console.warn('랭킹 서버를 켜지 못했어요', e); }
  },
  onChange(f) { Net.listeners.push(f); },
  // 방문자 수·이용 시간 (Google Analytics). 진짜 사이트에서만 켬 (로컬에서 시험한 게 통계에 안 섞이게)
  // Firebase Analytics 대신 gtag.js를 바로 씀: Firebase 쪽 앱 설정에 측정 ID가 없으면 SDK가 우리 ID를 버리고 아무것도 안 보냄
  analytics() {
    const id = window.FIREBASE_CONFIG.measurementId;
    if (!id || !location.hostname.endsWith('workers.dev')) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', id);
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${id}`).catch(e => console.warn('방문 통계를 켜지 못했어요', e));
  },
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
  // 진행 저장을 계정에: users/{uid} = { data(JSON), at }
  // 이 기기가 마지막으로 계정과 맞춘 때(syncAt, syncUid)를 기억해서, 그 뒤 다른 기기에서 바뀐 계정 기록을 덮어쓰지 않음
  // (켜자마자 저장이 한 번 일어나서 '더 최근 쪽'으로만 고르면 새 기기의 빈 기록이 계정 기록을 덮어썼음)
  // 판 중에는 미션 숫자 때문에 1~2초마다 저장돼서, 계정에는 1분에 한 번만 올림 (앱을 닫거나 다른 앱으로 넘어가면 바로 올림)
  cloudSave() {
    if (!Net.on || !Net.user) return;
    Net.savePending = true;
    if (!Net.saveTimer) Net.saveTimer = setTimeout(Net.flush, 60 * 1000);
  },
  // 미뤄 둔 저장을 바로 올림 (앱을 닫거나 다른 앱으로 넘어갈 때). 계정 기록과 맞추기 전(synced 전)에는 안 올림
  flush() {
    clearTimeout(Net.saveTimer);
    Net.saveTimer = null;
    if (!Net.savePending || !Net.on || !Net.user || !Net.synced) return;
    Net.savePending = false;
    const uid = Net.user.uid, at = Save.data.savedAt || Date.now();
    // 지난번에 올린 기록과 내용이 같으면(저장 시각만 다름) 안 올림
    const { savedAt, syncAt, syncUid, ...rest } = Save.data, same = uid + JSON.stringify(rest);
    if (same === Net.lastSaved) return;
    Object.assign(Save.data, { syncAt: at, syncUid: uid });
    Net.db.collection('users').doc(uid).set({ data: JSON.stringify(Save.data), at }).then(() => (Net.lastSaved = same), () => { Net.savePending = true; });
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(Save.data)); } catch {}
  },
  // 이 기기 기록으로 계속 (계정 기록은 이 기기 것으로 바뀜)
  keepLocal() {
    Net.synced = true;
    Net.savePending = true;
    Net.flush();
  },
  // 계정 기록을 이 기기에 받고 다시 켬
  takeCloud(d) {
    Save.wiped = true; // 다시 켜기 전에 지금 기록으로 덮어쓰지 않게
    const data = JSON.parse(d.data);
    Object.assign(data, { savedAt: d.at, syncAt: d.at, syncUid: Net.user.uid });
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch {}
    location.reload();
  },
  async cloudLoad() {
    try {
      const uid = Net.user.uid, d = (await Net.db.collection('users').doc(uid).get()).data();
      // 계정에 기록이 없거나, 이 기기가 마지막으로 맞춘 뒤 계정 기록이 그대로면 → 이 기기 기록을 올림
      if (!d || (Save.data.syncUid === uid && d.at <= (Save.data.syncAt || 0))) return Net.keepLocal();
      const cloud = JSON.parse(d.data), mine = progressOf(Save.data), theirs = progressOf(cloud);
      // 이 기기는 아직 아무것도 안 깼으면(새 기기) → 묻지 않고 계정 기록을 받음
      if (!mine.cleared) return Net.takeCloud(d);
      const line = p => `깬 스테이지 ${p.cleared} · 친구 ${p.friends} · 코인 ${p.coins}`;
      const cloudBetter = theirs.cleared >= mine.cleared;
      modal({
        title: '기록 불러오기', char: 'hachiware',
        text: '다른 기기에서 한 기록이 있어요. 어느 쪽으로 할까요?',
        btn1: cloudBetter ? '계정 기록 불러오기' : '이 기기 기록으로', on1: () => (cloudBetter ? Net.takeCloud(d) : Net.keepLocal()),
        btn2: cloudBetter ? '이 기기 기록으로' : '계정 기록 불러오기', on2: () => (cloudBetter ? Net.keepLocal() : Net.takeCloud(d)),
      });
      $('#modalText').innerHTML += `<br><small>계정: ${line(theirs)}<br>이 기기: ${line(mine)}</small>`; // 숫자만 들어감
    } catch (e) { console.warn('계정 기록을 못 불러왔어요', e); } // 못 불러오면 이번엔 안 올림 (계정 기록을 지킴)
  },
  guest() { return Net.auth.signInAnonymously(); },
  logout() { return Net.auth.signOut(); },
  name() { return (Save.data.nick || Net.user?.displayName || '이름 없는 친구').slice(0, 12); },
  // 내 기록 올리기: 서버에 있는 값과 비교해 더 큰 쪽을 남김 (다른 기기에서 한 기록도 지키게)
  async submit() {
    if (!Net.on || !Net.user) return;
    const mine = {
      name: Net.name(), cleared: clearedCount(), tower: Save.data.towerBest || 0, contest: Save.data.contestBest || 0,
      title: Achieve.title(), // 고른 칭호 (없으면 빈 글자)
      fav: Pic.code(), // 프사: 최애 친구 id 또는 '친구:옷' (랭킹에 같이 보임)
    };
    const key = Net.user.uid + JSON.stringify(mine);
    if (key === Net.subKey()) return;
    try {
      const ref = Net.db.collection('scores').doc(Net.user.uid);
      const old = (await ref.get()).data() || {};
      await ref.set({
        ...mine,
        cleared: Math.max(old.cleared || 0, mine.cleared),
        tower: Math.max(old.tower || 0, mine.tower),
        contest: Math.max(old.contest || 0, mine.contest),
        updated: firebase.firestore.FieldValue.serverTimestamp(),
      });
      if (old.name !== mine.name || old.title !== mine.title || old.fav !== mine.fav) Net.cache = {}; // 이름·칭호·프사가 바뀌면 랭킹을 새로 불러옴
      try { localStorage.setItem(SAVE_KEY + '.sub', key); } catch {}
    } catch (e) { console.warn('기록을 못 올렸어요', e); }
  },
  subKey() { try { return localStorage.getItem(SAVE_KEY + '.sub'); } catch { return null; } },
  // 50위까지. maxAge(ms) 안에 불러온 게 있으면 그걸 다시 씀 (Firestore 읽기를 아끼려고)
  cache: {},
  async top(field, maxAge = 0) {
    const c = Net.cache[field];
    if (c && Date.now() - c.at < maxAge) return c.rows;
    const q = await Net.db.collection('scores').orderBy(field, 'desc').limit(50).get();
    const rows = q.docs.map(d => ({ id: d.id, ...d.data() }));
    Net.cache[field] = { at: Date.now(), rows };
    return rows;
  },
  // 판을 처음 깬 뒤: '깬 스테이지' 랭킹에서 내 자리 (지난번 자리보다 오르면 지도 랭킹 버튼에 점)
  async clearRank() {
    if (!Net.on || !Net.user) return null;
    try {
      const mine = clearedCount(), rows = (await Net.top('cleared', 10 * 60 * 1000)).filter(r => r.id !== Net.user.uid);
      const rank = 1 + rows.filter(r => (r.cleared || 0) > mine).length;
      if (rank > 50) return `50위까지 스테이지 ${rows[49].cleared - mine}개 남았어요`;
      const up = Save.data.rankLast ? Save.data.rankLast - rank : 0;
      if (up > 0) Save.data.rankNew = true;
      Save.data.rankLast = rank;
      Save.save();
      return `랭킹 <b>${rank}위</b>${up > 0 ? ` <em>↑${up}</em>` : ''}`;
    } catch { return null; }
  },
  // 결과 창 글 아래에 랭킹 자리를 붙임 (그 사이 창이 바뀌었으면 안 붙임)
  rankLine(p) {
    if (!p) return;
    const box = $('#modalText');
    const el = document.createElement('span');
    el.className = 'rank-pop';
    el.hidden = true;
    box.appendChild(el);
    p.then(t => {
      if (!t || !el.isConnected) return;
      el.innerHTML = `<img src="${ITEM('medal')}">${t}`;
      el.hidden = false;
      el.animate([{ transform: 'scale(.6)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 300, easing: 'cubic-bezier(.3,1.6,.6,1)' });
    });
  },
};
// 랭킹이 올랐으면 지도의 랭킹 버튼에 빨간 점
function rankDot() {
  const btn = $('#btnMapRank');
  if (!btn.querySelector('.dot')) btn.insertAdjacentHTML('beforeend', '<i class="dot"></i>');
  btn.classList.toggle('on', !!Save.data.rankNew);
}

// ---------- 도전 화면: 인어섬 탐험, 제초 대회, 랭킹 ----------
function openChallenge() {
  Life.stopTimer();
  show('challenge');
  Meta.coinUI();
  $('#towerBest').textContent = Save.data.towerBest ? `최고 ${Save.data.towerBest}층` : '첫 도전!';
  $('#contestBest').textContent = Save.data.contestBest ? `최고 ${Save.data.contestBest}점` : '첫 도전!';
  DayChal.card();
  Dungeon.card();
  League.card();
}
$('#btnTower').onclick = () => { Sound.play('open'); go(() => Tower.start(1)); };
$('#btnContest').onclick = () => { Sound.play('open'); go(() => Life.begin(CONTEST, { kind: 'contest' })); };
$('#btnChallenge').onclick = () => { Sound.play('click'); go(openChallenge); };
$('#btnMapRank').onclick = () => { Sound.play('click'); go(() => openRanking('cleared')); };

// 랭킹 줄의 프사: 최애 친구 얼굴이나 '친구:옷' 그림 (모르는 값이면 안 그림)
const rankFace = v => {
  const [c, sk] = String(v || '').split(':');
  if (sk) return SKINS[c]?.[sk] ? `<img class="rk-face pic" src="${SKIN(c, sk)}" alt="">` : '';
  return CHARS.some(x => x.id === c) ? `<img class="rk-face" src="${FACE(c)}" alt="">` : '';
};
const BOARDS = { cleared: { label: '깬 스테이지', unit: '개' }, tower: { label: '인어섬', unit: '층' }, contest: { label: '제초 대회', unit: '점' } };
let rankTab = 'cleared';
async function openRanking(tab = rankTab) {
  rankTab = tab;
  if (Save.data.rankNew) { Save.data.rankNew = false; Save.save(); }
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
    const rows = await Net.top(tab, 60 * 1000);
    list.innerHTML = rows.map((r, k) => `<li class="${r.id === Net.user?.uid ? 'mine' : ''}"><span class="rk${k < 3 ? ' top' + (k + 1) : ''}">${k + 1}</span><span class="nm">${rankFace(r.fav)}<span class="rk-nm">${String(r.name || '???').replace(/[<>&]/g, '')}</span>${r.title ? `<small class="rk-title">${String(r.title).replace(/[<>&]/g, '')}</small>` : ''}</span><b>${r[tab] || 0}${BOARDS[tab].unit}</b></li>`).join('') ||
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
Net.onChange(profileChip); // 지도 왼쪽 위 이름표 (이름, 구글 표시)
document.addEventListener('visibilitychange', () => document.hidden && Net.flush());
window.addEventListener('pagehide', () => Net.flush());
// 로그인·랭킹 라이브러리(470KB)는 타이틀 그림을 먼저 받은 뒤에
if (document.readyState === 'complete') Net.init().then(titleLogin); else addEventListener('load', () => Net.init().then(titleLogin));
