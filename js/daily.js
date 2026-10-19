// 매일 할 거리: 출석 도장판(7칸)과 오늘의 미션 3개
// Save.data.att = { n: 이번 판에 찍은 도장 수, last: 마지막으로 찍은 날 }
// Save.data.mis = { day, ids: [미션 3개], got: {id: 진행}, done: {id: 받음}, bonus: 다 깨고 보너스 받음 }
// Save.data.tickets = 캡슐 뽑기 1번 티켓

// 출석 보상 (7일째는 뽑기 티켓). 도장은 날마다 한 칸, 빠진 날이 있어도 이어서
const ATTEND = [
  { coins: 50 }, { treat: 'dango', n: 2 }, { coins: 100 }, { treat: 'parfait', n: 2 },
  { coins: 150 }, { treat: 'onigiri', n: 3 }, { tickets: 3 },
];
// 미션 (need: 그 기능이 열려 있어야 뽑힘)
const MISSIONS = [
  { id: 'pop', text: '구슬 300개 터뜨리기', n: 300, icon: 'sparkle' },
  { id: 'weed', text: '잡초 40개 뽑기', n: 40, icon: 'weed2' },
  { id: 'item', text: '아이템 15번 터뜨리기', n: 15, icon: 'bomb' },
  { id: 'combo5', text: '5콤보 만들기', n: 1, icon: 'rainbow' },
  { id: 'win', text: '모험 지도 3판 깨기', n: 3, icon: 'medal' },
  { id: 'battle', text: '토벌 1판 이기기', n: 1, icon: 'boom' },
  { id: 'skill', text: '친구 스킬 5번 쓰기', n: 5, icon: 'sparkle' },
  { id: 'bubble', text: '거품 25개 터뜨리기', n: 25, icon: 'bubble' },
  { id: 'box', text: '상자 15개 뜯기', n: 15, icon: 'box' },
  { id: 'tower', text: '인어섬 3층 오르기', n: 3, icon: 'medal', need: 'challenge' },
  { id: 'dchal', text: '오늘의 도전 깨기', n: 1, icon: 'star', need: 'challenge' },
  { id: 'mimic', text: '미믹 보물창고 1번 끝까지', n: 1, icon: 'gift', need: 'challenge' },
  { id: 'ramen', text: '라멘 한 그릇 먹기', n: 1, icon: 'ramen', need: 'ramen' },
  { id: 'gacha', text: '캡슐 1번 뽑기', n: 1, icon: 'gift', need: 'gacha' },
  { id: 'pat', text: '집에서 친구 3명 쓰다듬기', n: 3, icon: 'house', need: 'house' },
];
const MISSION_COINS = 60;
const MISSION_AT = 3; // 3판을 깨면 미션이 열림

const Daily = {
  // 오늘 날짜로 정해지는 미션 3개 (열린 기능만)
  roll() {
    const d = Save.data, day = today();
    if (d.mis?.day === day) return d.mis;
    const open = id => { const u = UNLOCKS.find(x => x.id === id); return !u || Unlock.open(u); };
    const pool = MISSIONS.filter(m => !m.need || open(m.need));
    let seed = [...day].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7) >>> 0;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) % 10000) / 10000;
    const ids = [];
    while (ids.length < 3) { const m = pool[Math.floor(rnd() * pool.length)]; if (!ids.includes(m.id)) ids.push(m.id); }
    d.mis = { day, ids, got: {}, done: {}, bonus: false };
    Save.save();
    return d.mis;
  },
  on: () => clearedCount() >= MISSION_AT,
  // 게임 곳곳에서 부름: Daily.add('weed', 3)
  add(id, n = 1) {
    if (typeof Achieve !== 'undefined') Achieve.add(id, n); // 업적 기록도 같이 쌓음
    if (!n || !Daily.on()) return;
    const ms = Daily.roll();
    if (!ms.ids.includes(id) || ms.done[id]) return;
    const m = MISSIONS.find(x => x.id === id);
    const before = ms.got[id] || 0;
    if (before >= m.n) return;
    ms.got[id] = Math.min(m.n, before + n);
    if (ms.got[id] >= m.n) { Daily.toast(`미션 완료! ${m.text}`, m.icon); Daily.badge(); }
    clearTimeout(Daily.saveT);
    Daily.saveT = setTimeout(() => Save.save(), 1500);
  },
  claimable() {
    if (!Daily.on()) return 0;
    const ms = Daily.roll();
    const n = ms.ids.filter(id => !ms.done[id] && (ms.got[id] || 0) >= MISSIONS.find(m => m.id === id).n).length;
    return n + (!ms.bonus && ms.ids.every(id => ms.done[id]) ? 1 : 0);
  },
  // 지도 왼쪽 위 미션 버튼: 받을 게 있으면 빨간 점
  badge() {
    const b = $('#btnMission');
    if (!b) return;
    b.style.display = Daily.on() ? '' : 'none';
    const n = Daily.claimable();
    b.querySelector('i').textContent = n || '';
    b.classList.toggle('ready', n > 0);
  },
  // 판 위쪽에 잠깐 뜨는 알림
  toast(text, icon) {
    const el = document.createElement('div');
    el.className = 'tip mtoast';
    el.innerHTML = `<img src="${ITEM(icon)}"><span>${text}</span>`;
    app.appendChild(el);
    Sound.play('star', 1.4, 0.6);
    el.animate([{ transform: 'translate(-50%, -20px)', opacity: 0 }, { transform: 'translate(-50%, 0)', opacity: 1, offset: 0.12 }, { transform: 'translate(-50%, 0)', opacity: 1, offset: 0.85 }, { transform: 'translate(-50%, -10px)', opacity: 0 }],
      { duration: 2600, easing: 'ease-out' }).finished.then(() => el.remove());
  },
  give(r) {
    if (r.coins) Meta.addCoins(r.coins);
    if (r.treat) Save.data.treats[r.treat] = (Save.data.treats[r.treat] || 0) + r.n;
    if (r.tickets) Save.data.tickets = (Save.data.tickets || 0) + r.tickets;
    Save.save();
  },
  rewardHtml: r => r.coins ? `<img src="${ITEM('coin')}">${r.coins}` : r.treat ? `<img src="${ITEM(r.treat)}">×${r.n}` : `<img src="${ITEM('gift')}">티켓 ${r.tickets}`,

  // ---------- 출석 도장판 ----------
  // 지도를 열 때 오늘 처음이면 도장 한 칸 찍고 보상
  attend() {
    const d = Save.data;
    if (d.daily === today()) return false;
    d.daily = today();
    const a = (d.att = d.att || { n: 0 });
    if (a.n >= ATTEND.length) a.n = 0; // 7칸 다 찍었으면 새 판
    const k = a.n++;
    a.last = today();
    Daily.give(ATTEND[k]);
    Daily.roll();
    setTimeout(() => Daily.board(k), 700);
    return true;
  },
  board(stampAt = -1) {
    const a = Save.data.att || { n: 0 };
    const el = $('#attend');
    // 찍은 칸은 분홍 + 도장, 오늘 찍은 칸은 반짝, 다음에 찍을 칸은 점선. 7일째는 큰 선물 칸
    const last = ATTEND.length - 1;
    el.querySelector('.att-grid').innerHTML = ATTEND.map((r, k) => `<div class="att-cell${k < a.n ? ' on' : ''}${k === stampAt ? ' today' : ''}${k === a.n ? ' next' : ''}${k === last ? ' big' : ''}">
      <b class="dd">${k === a.n ? '내일' : k + 1 + '일'}</b><span class="rw">${Daily.rewardHtml(r)}</span>${k < a.n ? '<i class="stamp">참<br>잘했어요</i>' : ''}${k === last ? `<img class="peek" src="${art('usagi')}" alt="">` : ''}</div>`).join('');
    el.querySelector('.att-sub').innerHTML = a.n >= ATTEND.length ? '7일 다 모았어요! 내일부터 새 도장판' : `<b>${a.n}일째</b> 출석! 7일째엔 뽑기 티켓 ${ATTEND[last].tickets}장`;
    el.classList.add('show');
    fitText(el);
    el.querySelector('.modal-card').animate([{ transform: 'scale(.6)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 260, easing: 'cubic-bezier(.3,1.5,.6,1)' });
    if (stampAt >= 0) {
      const cell = el.querySelectorAll('.att-cell')[stampAt], st = cell.querySelector('.stamp');
      st.animate([{ transform: 'rotate(-14deg) scale(2.6)', opacity: 0 }, { transform: 'rotate(-14deg) scale(.9)', opacity: 1, offset: 0.7 }, { transform: 'rotate(-14deg) scale(1)', opacity: 1 }],
        { duration: 340, delay: 450, easing: 'cubic-bezier(.6,0,.9,.6)', fill: 'backwards' });
      setTimeout(() => {
        Sound.play('hit1', 0.9, 0.7);
        Haptic.tap(25);
        const c = centerOf(cell);
        burst(c.x, c.y, '#ff8ab8', 12);
        floatNum(c.x, c.y - 30, '+ ' + cell.querySelector('.rw').textContent.trim(), '#ff5d9e');
        Meta.coinUI(true);
      }, 760);
    }
    el.querySelector('[data-close]').onclick = () => { Sound.play('click'); el.classList.remove('show'); Daily.badge(); };
  },

  // ---------- 미션 창 ----------
  open() {
    const el = $('#mission'), ms = Daily.roll();
    const a = Save.data.att || { n: 0 };
    const rows = ms.ids.map(id => {
      const m = MISSIONS.find(x => x.id === id), got = ms.got[id] || 0, done = ms.done[id], full = got >= m.n;
      return `<div class="mis${done ? ' done' : full ? ' full' : ''}"><img src="${ITEM(m.icon)}"><div class="mtx"><b>${m.text}</b>
        <span class="mbar"><i style="width:${(got / m.n) * 100}%"></i></span><small>${got} / ${m.n}</small></div>
        <button class="mini-btn" data-id="${id}" ${!full || done ? 'disabled' : ''}>${done ? '받음' : `<img src="${ITEM('coin')}">${MISSION_COINS}`}</button></div>`;
    }).join('');
    const all = ms.ids.every(id => ms.done[id]);
    el.querySelector('.mis-list').innerHTML = rows + `<div class="mis bonus${ms.bonus ? ' done' : all ? ' full' : ''}"><img src="${ITEM('gift')}"><div class="mtx"><b>오늘 미션 다 깨기</b><small>뽑기 티켓 1장</small></div>
      <button class="mini-btn" data-id="bonus" ${!all || ms.bonus ? 'disabled' : ''}>${ms.bonus ? '받음' : '받기'}</button></div>`;
    el.querySelector('.att-line').innerHTML = `출석 도장 ${Math.min(a.n, ATTEND.length)} / ${ATTEND.length}<button class="mini-btn" data-att>도장판 보기</button>`;
    el.querySelectorAll('[data-id]').forEach(b => (b.onclick = () => {
      const id = b.dataset.id, c = centerOf(b);
      if (id === 'bonus') { ms.bonus = true; Daily.give({ tickets: 1 }); floatNum(c.x, c.y - 20, '뽑기 티켓 +1', '#ff5d9e'); }
      else { ms.done[id] = true; Daily.give({ coins: MISSION_COINS }); floatNum(c.x, c.y - 20, '+' + MISSION_COINS, '#e0a020'); }
      Save.save();
      Sound.play('star', 1.2, 0.9);
      burst(c.x, c.y, '#ffd84d', 12);
      Daily.open();
      Daily.badge();
    }));
    el.querySelector('[data-att]').onclick = () => { Sound.play('click'); el.classList.remove('show'); Daily.board(); };
    el.querySelector('[data-close]').onclick = () => { Sound.play('click'); el.classList.remove('show'); };
    if (!el.classList.contains('show')) {
      el.classList.add('show');
      el.querySelector('.modal-card').animate([{ transform: 'translateY(30px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 220, easing: 'ease-out' });
    }
    fitText(el);
  },
};
// 예전 '오늘의 용돈'은 출석 도장판으로
Meta.checkDaily = () => { Daily.attend(); Daily.badge(); };
$('#btnMission').onclick = () => { Sound.play('click'); Daily.open(); };
