// 관리자 통계 (admin.html): Firestore의 유저 기록(users)·이름(scores)·설문(feedback)·에러(errors)를 읽어 표로 보여 주고 엑셀로 받음
// 읽기는 firestore.rules의 isAdmin() 계정만 됨. 유저 기록은 로그인(구글·게스트)한 사람만 계정에 올라가 있음
// 모은·쓴 코인과 플레이 시간은 Save.data.stat (js/meta.js Track)이 생긴 뒤부터 셈 → '통계 시작일' 열
const $ = s => document.querySelector(s);
const status = (t, bad) => { $('#status').textContent = t; $('#status').className = bad ? 'err' : ''; };
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

firebase.initializeApp(window.FIREBASE_CONFIG);
const auth = firebase.auth(), db = firebase.firestore();
let DATA = null;

const charName = id => CHARS.find(c => c.id === id)?.name || id;
const skinName = (id, s) => SKINS[id]?.[s]?.name || s;
const sum = o => Object.values(o || {}).reduce((t, v) => t + (+v || 0), 0);
const filled = a => (a || []).filter(v => v != null);
const toDate = v => (v?.toDate ? v.toDate() : typeof v === 'number' ? new Date(v) : null);
const fmt = d => (d ? d.toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' }) : '');
// 기기 대충: 아이폰 / 안드로이드 / PC / 맥
const device = ua => (!ua ? '' : /iPhone|iPad/.test(ua) ? 'iPhone' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac OS/.test(ua) ? 'Mac' : '기타');
// 업적 기록(ach.n) 이름
const REC = { gacha: '뽑기', pop: '터뜨린 구슬', weed: '뽑은 잡초', box: '뜯은 상자', bubble: '터뜨린 거품', item: '아이템 사용', skill: '스킬 사용', combo5: '5콤보',
  boss: '보스 처치', battle: '토벌 판', win: '이긴 판', ramen: '라멘', tower: '인어섬 층', mimic: '미믹', pat: '쓰다듬기', dchal: '오늘의 도전' };

async function load() {
  status('불러오는 중…');
  $('#btnXlsx').disabled = true;
  try {
    const [users, scores, feedback, errors] = await Promise.all(['users', 'scores', 'feedback', 'errors'].map(c => db.collection(c).get()));
    const names = {};
    scores.forEach(s => (names[s.id] = s.data().name || ''));
    DATA = { users: [], friends: [], skins: [], feedback: [], errors: [] };
    users.forEach(doc => {
      let d;
      try { d = JSON.parse(doc.data().data); } catch { return; }
      const uid = doc.id, name = names[uid] || '', st = d.stat || {}, ach = d.ach || {}, own = d.own || {}, skins = d.skins || {};
      const row = {
        닉네임: name, uid,
        '마지막 저장': toDate(doc.data().at || d.savedAt),
        '깬 스테이지': filled(d.stars).length + filled(d.life).length,
        '별 합계': sum(filled(d.stars)) + sum(filled(d.life)),
        '보유 코인': d.coins || 0,
        '모은 코인': st.coinIn ?? '',
        '쓴 코인': st.coinOut ?? '',
        '플레이 시간(분)': st.playSec != null ? Math.round(st.playSec / 60) : '',
        '통계 시작일': st.since || '',
        '뽑기 횟수': ach.n?.gacha || 0,
        '친구 수': Object.keys(own).length,
        '옷 수': Object.values(skins).reduce((t, a) => t + (a?.length || 0), 0),
        이어하기권: d.tickets || 0,
        '간식 합계': sum(d.treats),
        '조각 합계': sum(d.shards),
        '인어섬 최고층': d.towerBest || 0,
        '제초 대회 최고': d.contestBest || 0,
        '칭호 수': Object.keys(ach.got || {}).length,
      };
      Object.entries(ach.n || {}).forEach(([k, v]) => { if (k !== 'gacha') row['기록: ' + (REC[k] || k)] = v; });
      DATA.users.push(row);
      Object.entries(own).forEach(([id, lv]) => DATA.friends.push({ 닉네임: name, uid, 친구: charName(id), 레벨: lv, '입은 옷': d.outfit?.[id] ? skinName(id, d.outfit[id]) : '' }));
      Object.entries(skins).forEach(([id, list]) => (list || []).forEach(s => DATA.skins.push({ 닉네임: name, uid, 친구: charName(id), 옷: skinName(id, s), '입는 중': d.outfit?.[id] === s ? 'O' : '' })));
    });
    DATA.users.sort((a, b) => b['깬 스테이지'] - a['깬 스테이지']);
    feedback.forEach(doc => {
      const f = doc.data();
      DATA.feedback.push({ 날짜: toDate(f.at), 별: f.stars, 내용: f.text || '', '깬 판': f.cleared, 어디서: f.from === 'auto' ? '자동 설문' : '설정', 버전: f.ver, 기기: device(f.ua), 닉네임: names[f.uid] || '', uid: f.uid || '', ua: f.ua || '' });
    });
    errors.forEach(doc => {
      const e = doc.data();
      DATA.errors.push({ 날짜: toDate(e.at), 종류: e.kind, 내용: e.msg, 위치: e.ctx, 버전: e.ver, 기기: device(e.ua), 흐름: e.stack || '', 닉네임: names[e.uid] || '', uid: e.uid || '', ua: e.ua || '' });
    });
    const byDate = (a, b) => (b.날짜 || 0) - (a.날짜 || 0);
    DATA.feedback.sort(byDate);
    DATA.errors.sort(byDate);
    render();
    $('#btnXlsx').disabled = false;
    status(`불러왔어요 (${fmt(new Date())})`);
  } catch (e) {
    console.error(e);
    status(e.code === 'permission-denied' ? '읽을 권한이 없어요. 관리자 계정으로 로그인했는지, Firestore 규칙을 올렸는지 확인해 주세요.' : '불러오지 못했어요: ' + e.message, true);
  }
}

function render() {
  const u = DATA.users, f = DATA.feedback;
  const avg = (rows, k) => { const v = rows.map(r => r[k]).filter(x => typeof x === 'number'); return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : '-'; };
  const tiles = [
    ['유저(계정에 기록 있음)', u.length], ['평균 깬 스테이지', avg(u, '깬 스테이지')], ['평균 뽑기', avg(u, '뽑기 횟수')],
    ['설문', f.length], ['평균 별점', avg(f, '별')], ['에러', DATA.errors.length], ['그중 튕김', DATA.errors.filter(e => e.종류 === 'crash').length],
  ];
  $('#tiles').innerHTML = tiles.map(([k, v]) => `<div class="tile"><b>${esc(v)}</b><small>${esc(k)}</small></div>`).join('');
  const table = (title, rows, cols, n = 30) => `<section><h2>${esc(title)} <small>(${rows.length}개${rows.length > n ? `, 위 ${n}개만 보임 — 전부는 엑셀에` : ''})</small></h2>
    <table><tr>${cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr>${rows.slice(0, n).map(r => `<tr>${cols.map(c => { const v = r[c]; return `<td class="${typeof v === 'number' ? 'n' : ''}">${esc(v instanceof Date ? fmt(v) : v)}</td>`; }).join('')}</tr>`).join('')}</table></section>`;
  $('#preview').innerHTML =
    table('설문', f, ['날짜', '별', '내용', '깬 판', '어디서', '기기', '닉네임']) +
    table('유저', u, ['닉네임', '깬 스테이지', '별 합계', '보유 코인', '모은 코인', '쓴 코인', '플레이 시간(분)', '뽑기 횟수', '친구 수', '옷 수', '마지막 저장']) +
    table('에러', DATA.errors, ['날짜', '종류', '내용', '위치', '버전', '기기'], 15);
}

// 시트마다 열 너비를 내용에 맞춤 (너무 길면 60자에서 자름)
function sheet(rows) {
  const ws = XLSX.utils.json_to_sheet(rows, { cellDates: true, dateNF: 'yyyy-mm-dd hh:mm' });
  const cols = rows.length ? [...new Set(rows.flatMap(r => Object.keys(r)))] : [];
  ws['!cols'] = cols.map(c => ({ wch: Math.min(60, Math.max(c.length * 2, ...rows.map(r => { const v = r[c]; return v instanceof Date ? 16 : String(v ?? '').length; })) + 2) }));
  return ws;
}
function xlsx() {
  const wb = XLSX.utils.book_new();
  const summary = [
    { 항목: '뽑은 때', 값: fmt(new Date()) },
    { 항목: '유저(계정에 기록 있음)', 값: DATA.users.length },
    { 항목: '설문', 값: DATA.feedback.length },
    { 항목: '에러', 값: DATA.errors.length },
    { 항목: '참고', 값: '로그인(구글·게스트)한 사람만 계정에 기록이 있음. 모은·쓴 코인, 플레이 시간은 통계 시작일부터 셈' },
  ];
  [['요약', summary], ['유저', DATA.users], ['친구', DATA.friends], ['옷', DATA.skins], ['설문', DATA.feedback], ['에러', DATA.errors]]
    .forEach(([n, rows]) => XLSX.utils.book_append_sheet(wb, sheet(rows), n));
  XLSX.writeFile(wb, `chiikawa-stats-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

$('#btnLogin').onclick = () => auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).catch(e => status('로그인 실패: ' + e.message, true));
$('#btnLogout').onclick = () => auth.signOut();
$('#btnLoad').onclick = load;
$('#btnXlsx').onclick = xlsx;
auth.onAuthStateChanged(u => {
  const google = u && !u.isAnonymous;
  $('#btnLogin').hidden = google;
  $('#btnLogout').hidden = !google;
  $('#btnLoad').disabled = !google;
  if (!google) { status('관리자 구글 계정으로 로그인해 주세요'); $('#tiles').innerHTML = $('#preview').innerHTML = ''; DATA = null; $('#btnXlsx').disabled = true; return; }
  status(`${u.email}로 로그인됨`);
  load();
});
