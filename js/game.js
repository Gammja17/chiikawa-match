// 화면, 입력, 전투 연출
const $ = s => document.querySelector(s);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const app = $('#app'), fx = $('#fx'), boardEl = $('#board');

// ---------- 저장 ----------
const SAVE_KEY = 'chiikawaMatch.v1';
const Save = {
  data: { stars: [], team: null },
  load() {
    try {
      const d = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (d && Array.isArray(d.stars)) this.data = d;
      Sound.muted = localStorage.getItem(SAVE_KEY + '.mute') === '1';
    } catch {}
  },
  save() {
    this.data.savedAt = Date.now();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)); } catch {}
    if (typeof Net !== 'undefined') Net.cloudSave();
  },
};
Save.load();
// 지도는 한 줄 루트: 토벌(b)과 일상(l) 스테이지가 정해진 순서로 섞여 있음 (ROUTE는 life.js)
const routeStage = k => (ROUTE[k][0] === 'b' ? STAGES : LIFE)[ROUTE[k][1]];
const routeStars = k => (ROUTE[k][0] === 'b' ? Save.data.stars : Save.data.life || [])[ROUTE[k][1]];
const routeIdx = (t, i) => ROUTE.findIndex(([tt, ii]) => tt === t && ii === i);
const unlockedIdx = () => { const k = ROUTE.findIndex((_, k) => routeStars(k) == null); return k < 0 ? ROUTE.length - 1 : k; };
const goRoute = k => (ROUTE[k][0] === 'b' ? openFormation(ROUTE[k][1]) : Life.start(ROUTE[k][1]));

// 이미지 미리 불러오기
[...CHARS.map(c => FACE(c.id)), ...CHARS.map(c => TILE(c.id)),
  ...['chiikawa', 'hachiware', 'usagi', 'momonga', 'rakko', 'shisa', 'kurimanju'].map(BODY), ...Object.values(MONSTERS).map(m => m.img),
  ...['h', 'v', 'bomb', 'rainbow', 'boom', 'sparkle', 'plane', 'box', 'gift', 'bubble', 'weed1', 'weed2'].map(ITEM)]
  .forEach(src => (new Image().src = src));

// ---------- 공통 ----------
function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));
}
function updateMute() {
  document.querySelectorAll('.btn-mute').forEach(b => b.classList.toggle('off', Sound.muted));
  try { localStorage.setItem(SAVE_KEY + '.mute', Sound.muted ? '1' : '0'); } catch {}
}
document.querySelectorAll('.btn-mute').forEach(b => (b.onclick = () => { Sound.muted = !Sound.muted; updateMute(); Sound.play('click'); }));
updateMute();
const updateVib = () => document.querySelectorAll('.btn-vib').forEach(b => b.classList.toggle('off', !Haptic.on));
document.querySelectorAll('.btn-vib').forEach(b => (b.onclick = () => { Haptic.toggle(); updateVib(); Sound.play('click'); }));
updateVib();
window.addEventListener('pointerdown', () => Sound.unlock(), { capture: true });

function rel(rect) {
  const a = app.getBoundingClientRect();
  return { x: rect.left - a.left + rect.width / 2, y: rect.top - a.top + rect.height / 2, w: rect.width, h: rect.height };
}
const centerOf = el => rel(el.getBoundingClientRect());
function tileCenter(r, c) {
  const b = boardEl.getBoundingClientRect(), a = app.getBoundingClientRect();
  return { x: b.left - a.left + (c + 0.5) * B.S, y: b.top - a.top + (r + 0.5) * B.S };
}
function addFx(cls, x, y) {
  const el = document.createElement('div');
  el.className = cls;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  fx.appendChild(el);
  return el;
}

// Kenney 파티클(CC0) 그림을 원하는 색으로 칠해서 씀
// CSS 변수 안의 url()은 css/ 기준으로 풀려서 절대 주소로 넣음
const KP = n => `url(${new URL(`assets/img/fx/k/${n}.png`, location.href).href})`;
function kp(name, x, y, size, color, frames, opts) {
  const el = addFx('kp', x, y);
  Object.assign(el.style, { width: size + 'px', height: size + 'px', marginLeft: -size / 2 + 'px', marginTop: -size / 2 + 'px' });
  el.style.setProperty('--m', KP(name));
  el.style.setProperty('--c', color);
  return el.animate(frames, opts).finished.then(() => el.remove());
}
// 반짝이 별과 불똥이 사방으로 튐
function burst(x, y, color, n = 6) {
  for (let i = 0; i < n; i++) {
    const ang = Math.random() * Math.PI * 2, d = 24 + Math.random() * 44, rot = (Math.random() - 0.5) * 300;
    const star = i % 3 !== 2;
    const sz = star ? 14 + Math.random() * 14 : 10 + Math.random() * 8;
    kp(star ? (i % 2 ? 'star_06' : 'star_04') : 'spark_05', x, y, sz, i % 2 ? color : '#ffffff', [
      { transform: 'translate(0,0) scale(.4) rotate(0)', opacity: 1 },
      { transform: `translate(${Math.cos(ang) * d * 0.7}px,${Math.sin(ang) * d * 0.7}px) scale(1.2) rotate(${rot / 2}deg)`, opacity: 1, offset: 0.35 },
      { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d}px) scale(0) rotate(${rot}deg)`, opacity: 0 },
    ], { duration: 420 + Math.random() * 220, easing: 'cubic-bezier(.2,.8,.4,1)' });
  }
}

function floatNum(x, y, text, color, cls = '') {
  const n = addFx('num ' + cls, x, y);
  n.textContent = text;
  n.style.setProperty('--c', color);
  return n.animate([
    { transform: 'translate(-50%,-50%) scale(.3)', opacity: 0 },
    { transform: 'translate(-50%,-90%) scale(1.3)', opacity: 1, offset: 0.22 },
    { transform: 'translate(-50%,-110%) scale(1)', opacity: 1, offset: 0.7 },
    { transform: 'translate(-50%,-170%) scale(.9)', opacity: 0 },
  ], { duration: 950, easing: 'ease-out' }).finished.then(() => n.remove());
}

function banner(text, hold = 650) {
  const b = addFx('banner', 0, 0);
  b.style.left = '50%';
  b.style.top = '45%';
  b.textContent = text;
  return b.animate([
    { transform: 'translate(-50%,-50%) scale(0) rotate(-8deg)', opacity: 0 },
    { transform: 'translate(-50%,-50%) scale(1.2) rotate(3deg)', opacity: 1, offset: 0.12 },
    { transform: 'translate(-50%,-50%) scale(1) rotate(0)', opacity: 1, offset: 0.22 },
    { transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: 0.8 },
    { transform: 'translate(-50%,-60%) scale(1.1)', opacity: 0 },
  ], { duration: hold + 400, easing: 'ease-out' }).finished.then(() => b.remove());
}

function shake(power = 6, dur = 300) {
  const k = [];
  for (let i = 0; i < 6; i++) k.push({ transform: `translate(${(Math.random() - .5) * power * 2}px,${(Math.random() - .5) * power * 2}px)` });
  k.push({ transform: 'translate(0,0)' });
  app.animate(k, { duration: dur });
  Haptic.tap(Math.min(60, power * 5));
}
// 손맛: 멈칫(히트스톱), 슬로모션, 클로즈업
const Juice = {
  stop(ms = 70) {
    const anims = document.getAnimations();
    anims.forEach(a => a.pause());
    setTimeout(() => anims.forEach(a => { try { a.play(); } catch {} }), ms);
  },
  slow(ms = 450, rate = 0.3) {
    document.getAnimations().forEach(a => a.updatePlaybackRate(rate));
    setTimeout(() => document.getAnimations().forEach(a => a.updatePlaybackRate(1)), ms);
  },
  zoom(x, y, scale = 1.08, dur = 420) {
    app.style.transformOrigin = `${x}px ${y}px`;
    app.animate([{ transform: 'scale(1)' }, { transform: `scale(${scale})`, offset: 0.25 }, { transform: 'scale(1)' }], { duration: dur, easing: 'cubic-bezier(.2,.8,.3,1)' });
  },
};
function flash(color = '#ff4d6d', peak = 0.45) {
  const f = $('#flash');
  f.style.background = color;
  f.animate([{ opacity: peak }, { opacity: 0 }], { duration: 350, easing: 'ease-out' });
}

// ---------- 타이틀 ----------
['kurimanju', 'usagi', 'hachiware', 'chiikawa', 'momonga', 'rakko', 'shisa'].forEach((id, i) => {
  const im = new Image();
  im.src = art(id);
  im.draggable = false;
  im.style.animationDelay = i * 0.12 + 's';
  $('#titleParty').appendChild(im);
});
// 타이틀 그림: assets/img/art/title.jpg 가 있으면 배경으로 씀 (공식 일러스트 등)
{
  const im = new Image();
  im.onload = () => { $('.title-sky').style.setProperty('--title-bg', `url(${im.src})`); $('.title-sky').classList.add('has-art'); };
  im.src = 'assets/img/art/title.jpg';
}
$('#btnStart').onclick = async () => { Sound.play('open'); await Tutor.opening(); go(openMap); };

// ---------- 지도 ----------
const NODE_GAP = 112, NODE_TOP = 150;
const LOCK_SVG = '<svg class="lock" viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke-width="2.4"/></svg>';
const nodePos = (i, W) => ({ x: (0.5 + Math.sin(i * 1.15) * 0.28) * W, y: NODE_TOP + i * NODE_GAP });

function openMap(advanceFrom = null) {
  Life.stopTimer();
  show('map');
  Meta.coinUI();
  Meta.checkDaily();
  const STAGES = ROUTE.map((_, k) => routeStage(k));
  Sound.music('map');
  $('#btnRamen').classList.toggle('on', Save.data.ramen !== false);
  const path = $('#mapPath');
  path.innerHTML = '';
  path.style.height = NODE_TOP + STAGES.length * NODE_GAP + 40 + 'px';
  const W = path.clientWidth;
  const pts = STAGES.map((_, i) => nodePos(i, W));
  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1], q = pts[i];
    d += ` C${p.x} ${p.y + NODE_GAP / 2} ${q.x} ${q.y - NODE_GAP / 2} ${q.x} ${q.y}`;
  }
  path.insertAdjacentHTML('beforeend',
    `<svg><path d="${d}" fill="none" stroke="#fffaf2" stroke-width="14" stroke-linecap="round" opacity=".9"/><path d="${d}" fill="none" stroke="#4b3f3a" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 12" opacity=".45"/></svg>`);

  const cur = unlockedIdx();
  STAGES.forEach((st, i) => {
    const n = document.createElement('button');
    const locked = i > cur;
    const boss = st.waves?.some(w => w.boss);
    n.className = 'node' + (locked ? ' locked' : '') + (boss ? ' boss' : '') + (i === cur ? ' current' : '');
    n.style.left = pts[i].x + 'px';
    n.style.top = pts[i].y + 'px';
    const s = routeStars(i) || 0;
    const icon = st.icon ? ITEM(st.icon) : MONSTERS[st.waves[st.waves.length - 1].m].img;
    n.innerHTML = (locked ? LOCK_SVG : `<img class="nicon" src="${icon}"><span class="nnum">${i + 1}</span>`) +
      (i === cur ? `<span class="nname">${st.name}</span>` : '') +
      (s ? `<span class="nstars">${[0, 1, 2].map(k => `<i class="${k < s ? 'on' : ''}"></i>`).join('')}</span>` : '');
    if (!st.icon) n.classList.add('battle');
    n.onclick = () => {
      if (locked) { Sound.play('bad'); n.animate([{ transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'none' }], { duration: 200 }); return; }
      Sound.play('click');
      go(() => goRoute(i));
    };
    path.appendChild(n);
  });

  const party = document.createElement('div');
  party.id = 'mapParty';
  party.innerHTML = ['hachiware', 'chiikawa', 'usagi'].map(id => `<img src="${BODY(id)}" draggable="false">`).join('');
  path.appendChild(party);
  const scroller = $('#mapScroll');
  const goal = pts[cur];
  party.style.left = goal.x + 'px';
  party.style.top = goal.y + 'px';
  if (advanceFrom != null && advanceFrom !== cur) {
    const from = pts[advanceFrom];
    const dx = from.x - goal.x, dy = from.y - goal.y;
    scroller.scrollTop = from.y - scroller.clientHeight / 2;
    party.animate([
      { transform: `translate(${dx}px,${dy}px)` },
      { transform: `translate(${dx / 2}px,${dy / 2 - 70}px)`, offset: 0.5 },
      { transform: 'translate(0,0)' },
    ], { duration: 800, delay: 300, easing: 'ease-in-out', fill: 'backwards' }).finished.then(() => {
      Sound.play('star', 1.2);
      burst(goal.x, goal.y - scroller.scrollTop + scroller.offsetTop, '#ffcf3f', 10);
    });
    scroller.scrollTo({ top: goal.y - scroller.clientHeight / 2, behavior: 'smooth' });
  } else {
    scroller.scrollTop = goal.y - scroller.clientHeight / 2;
  }
}
$('#btnMapHome').onclick = () => { Sound.play('click'); go(() => show('title')); };

// ---------- 스토리 ----------
function playStory(lines) {
  return new Promise(done => {
    const ov = $('#story'), lineEl = $('#storyLine');
    let i = 0, timer = null, full = '';
    const type = text => {
      full = text;
      let n = 0;
      lineEl.textContent = '';
      clearInterval(timer);
      timer = setInterval(() => {
        lineEl.textContent = text.slice(0, ++n);
        if (n % 3 === 0) Sound.play('click', 1.6 + Math.random() * 0.3, 0.15);
        if (n >= text.length) { clearInterval(timer); timer = null; }
      }, 38);
    };
    const next = () => {
      if (i >= lines.length) { ov.classList.remove('show'); ov.onclick = null; done(); return; }
      const [id, text] = lines[i++];
      $('#storyChar').src = art(id);
      $('#storyName').textContent = CHAR_NAME[id];
      $('#storyChar').animate([{ transform: 'translateY(24px) scale(.85)' }, { transform: 'translateY(0) scale(1)' }],
        { duration: 320, easing: 'cubic-bezier(.3,1.6,.6,1)' });
      Sound.play('pop', 1.3, 0.6);
      type(text);
    };
    ov.onclick = () => {
      if (timer) { clearInterval(timer); timer = null; lineEl.textContent = full; return; }
      next();
    };
    ov.classList.add('show');
    next();
  });
}

// ---------- 모달 ----------
function modal({ title, stars = null, char, img = null, photo = false, rows = [], text, btn1, on1, btn2 = '', on2 = null }) {
  $('#modalTitle').textContent = title;
  $('#modalChar').src = img || art(char);
  $('#modalChar').classList.toggle('photo', photo);
  $('#modalChar').classList.remove('icon');
  $('.modal-card').classList.toggle('has-photo', photo);
  $('#modalRows').innerHTML = rows.map(([k, v]) => `<div>${k}<b>${v}</b></div>`).join('');
  $('#modalText').textContent = text;
  const st = $('#modalStars');
  st.innerHTML = stars == null ? '' : '<span>★</span><span>★</span><span>★</span>';
  st.style.display = stars == null ? 'none' : '';
  const b1 = $('#modalBtn1'), b2 = $('#modalBtn2');
  b1.textContent = btn1;
  b2.textContent = btn2;
  const close = () => $('#modal').classList.remove('show');
  b1.onclick = () => { Sound.play('click'); close(); on1(); };
  b2.onclick = () => { Sound.play('click'); close(); on2 && on2(); };
  $('#modal').classList.add('show');
  $('.modal-card').animate([{ transform: 'scale(.5)', opacity: 0 }, { transform: 'scale(1.06)', opacity: 1, offset: 0.6 }, { transform: 'scale(1)' }],
    { duration: 380, easing: 'ease-out' });
  if (stars) {
    [...st.children].slice(0, stars).forEach((s, i) => setTimeout(() => {
      s.className = 'on';
      s.animate([{ transform: 'scale(2.2) rotate(-30deg)', opacity: 0 }, { transform: 'scale(1) rotate(0)', opacity: 1 }],
        { duration: 350, easing: 'cubic-bezier(.3,1.6,.6,1)' });
      Sound.play('star', 1 + i * 0.2);
      const c = centerOf(s);
      burst(c.x, c.y, '#ffcf3f', 8);
    }, 450 + i * 330));
  }
}

// ---------- 전투 ----------
const B = { mode: 'battle', team: [], gauge: [], grid: null, stage: 0, wave: 0, monHp: 0, monMax: 0, cd: 0, teamHp: 120, teamMax: 120, busy: true, over: false, sel: null, S: 56, pending: [] };
const curWave = () => STAGES[B.stage].waves[B.wave];
// 구슬 type(편성 순번) → 캐릭터
const teamCh = type => CHARS[B.team[type]];
const attrTag = a => `<span class="attr-tag" style="--ac:${ATTR[a].color}">${attrIcon(a)}${ATTR[a].name}</span>`;

function layoutBoard() {
  const w = $('#boardWrap');
  B.S = Math.max(30, Math.floor(Math.min(w.clientWidth - 16, w.clientHeight - 16) / COLS));
  app.style.setProperty('--s', B.S + 'px');
  if (!boardEl.querySelector('.cellbg')) {
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const d = document.createElement('div');
      d.className = 'cellbg';
      d.style.left = `calc(var(--s) * ${c})`;
      d.style.top = `calc(var(--s) * ${r})`;
      boardEl.appendChild(d);
    }
    // 구슬 위에 씌우는 층: 잡초가 반투명하게 덮임 (꿈의집 젤리처럼)
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const d = document.createElement('div');
      d.className = 'cellfg';
      d.style.left = `calc(var(--s) * ${c})`;
      d.style.top = `calc(var(--s) * ${r})`;
      boardEl.appendChild(d);
    }
  }
  renderFloor();
  if (B.grid) Board.each(B.grid, (t, r, c) => t.el && place(t, r, c));
}
window.addEventListener('resize', () => { if ($('#battle').classList.contains('active')) layoutBoard(); });

// 칸 바닥: 잡초 겹 수, 재료 나가는 곳
function cellClass(r, c) {
  const w = Board.floor?.[r][c] || 0, out = hole(r, c);
  const exit = B.mode === 'life' && Life.hasIng() && !out && (r === ROWS - 1 || hole(r + 1, c));
  return 'cellbg' + (out ? ' void' : '') + (w ? ' weed w' + w : '') + (Board.syrup?.[r][c] ? ' syrup' : '') + (exit ? ' exit' : '');
}
const fgClass = (r, c) => { const w = Board.floor?.[r][c] || 0; return 'cellfg' + (w ? ' w' + w : ''); };
function renderFloor() {
  boardEl.querySelectorAll('.cellbg').forEach((d, i) => (d.className = cellClass(...unkey(i))));
  boardEl.querySelectorAll('.cellfg').forEach((d, i) => (d.className = fgClass(...unkey(i))));
}

const tf = (r, c) => `translate(${c * B.S}px,${r * B.S}px)`;
function place(t, r, c) { t.el.style.transform = tf(r, c); }
function slide(t, r, c, dur, easing = 'ease-out', delay = 0) {
  const from = t.el.style.transform || tf(r, c);
  const to = tf(r, c);
  t.el.style.transform = to;
  return t.el.animate([{ transform: from }, { transform: to }], { duration: dur, easing, delay, fill: 'backwards' }).finished;
}
function squish(t, delay = 0) {
  t.inner.animate([
    { transform: 'scale(1)' },
    { transform: 'scale(1.16,.82)', offset: 0.3 },
    { transform: 'scale(.94,1.06)', offset: 0.65 },
    { transform: 'scale(1)' },
  ], { duration: 280, delay, easing: 'ease-out' });
}

function makeTile(t) {
  const el = document.createElement('div');
  el.className = 'tile';
  el.innerHTML = '<div class="inner"></div>';
  t.el = el;
  t.inner = el.firstChild;
  refreshTile(t);
  boardEl.appendChild(el);
  return t;
}
function refreshTile(t) {
  const inner = t.inner;
  inner.className = 'inner';
  if (t.block) {
    inner.classList.add('block', t.block);
    const img = t.block === 'bubble' ? 'bubble' : t.block === 'weed' ? (t.hp >= 2 ? 'weed2' : 'weed1') : t.hp >= 2 ? 'gift' : 'box';
    inner.innerHTML = `<img src="${ITEM(img)}" draggable="false">`;
    return;
  }
  if (t.type === ING) {
    inner.classList.add('ing');
    inner.innerHTML = `<img src="${ITEM(t.ing)}" draggable="false">`;
    return;
  }
  // 아이템은 캐릭터 없이 아이콘 하나 (색이 없어서 매치에 안 끼고, 톡톡/쓱/조합으로 터짐)
  if (t.special || t.type < 0) {
    const sp = t.special || 'rainbow';
    inner.classList.add('item', sp);
    inner.innerHTML = `<img src="${ITEM(ITEM_ICON[sp] || sp)}" draggable="false">`;
    return;
  }
  const ch = teamCh(t.type);
  inner.style.setProperty('--ring', ch.ring);
  inner.classList.toggle('locked', !!t.lock);
  inner.innerHTML = `<img src="${TILE(ch.id)}" draggable="false">` +
    (t.lock ? `<i class="band"></i><img class="lockimg" src="${ITEM('ribbon')}" draggable="false">` : '');
}
const ITEM_ICON = { h: 'rocket', v: 'rocket' };

function buildParty() {
  $('#party').innerHTML = B.team.map(i => CHARS[i]).map(c =>
    `<div class="pm" style="--ring:${c.ring}"><div class="pm-face">${Meta.figure(c.id, FACE(c.id))}</div>${attrIcon(c.attr)}<i class="up"></i><i class="g"><b></b></i></div>`).join('');
  [...$('#party').children].forEach((el, k) => (el.onclick = () => useSkill(k)));
  updateGauges();
}
function updateGauges() {
  [...$('#party').children].forEach((el, k) => {
    const need = teamCh(k).skill.need;
    el.style.setProperty('--g', Math.min(1, B.gauge[k] / need));
    el.classList.toggle('ready', B.gauge[k] >= need);
    if (B.gauge[k] >= need) Tutor.tip('skill');
  });
}
// 지금 몬스터에게 유리한 친구는 ▲ 표시
function markMatchup() {
  if (B.mode !== 'battle') return;
  [...$('#party').children].forEach((el, k) => {
    const m = attrMult(teamCh(k).attr, curWave().a);
    el.classList.toggle('strong', m > 1);
    el.classList.toggle('weak', m < 1);
  });
}
function updateTeam() {
  $('#teamHp .fill').style.width = (B.teamHp / B.teamMax) * 100 + '%';
  $('#teamHp span').textContent = `${B.teamHp} / ${B.teamMax}`;
}
function updateMon() {
  $('#monHp .fill').style.width = (B.monHp / B.monMax) * 100 + '%';
  $('#monHp span').textContent = `${B.monHp} / ${B.monMax}`;
}
function updateCd() {
  const el = $('#countdown');
  el.innerHTML = `<b>${Math.max(B.cd, 0)}</b>`;
  el.classList.toggle('danger', B.cd <= 1);
}

function spawnMonster(animated) {
  const w = curWave(), M = MONSTERS[w.m];
  const img = $('#monster');
  img.src = M.img;
  img.style.maxWidth = w.boss ? '86%' : '70%';
  $('#monSprite').style.filter = w.hue ? `hue-rotate(${w.hue}deg) saturate(1.3)` : '';
  const title = w.title ? (w.title.endsWith('·') ? w.title : w.title + ' ') : '';
  $('#monName').innerHTML = attrIcon(w.a) + (w.boss ? '👑 ' : '') + title + M.name;
  $('#monName').classList.toggle('boss', !!w.boss);
  B.monHp = B.monMax = w.hp;
  B.cd = w.cd;
  const nw = STAGES[B.stage].waves.length;
  $('#waveInfo').innerHTML = nw > 1 ? Array.from({ length: nw }, (_, k) => `<i class="${k <= B.wave ? 'on' : ''}"></i>`).join('') : '';
  markMatchup();
  updateMon();
  updateCd();
  img.style.opacity = 1;
  if (animated) {
    Sound.play('wave');
    img.animate([
      { transform: 'translateY(-220px) scale(.6)', opacity: 0 },
      { transform: 'translateY(0) scale(1.15,.85)', opacity: 1, offset: 0.6 },
      { transform: 'translateY(-14px) scale(.95,1.05)', offset: 0.8 },
      { transform: 'translateY(0) scale(1)' },
    ], { duration: 600, easing: 'ease-out' });
  }
}

async function startStage(i) {
  B.mode = 'battle';
  app.classList.remove('life-mode', 'tower-mode');
  Board.floor = null;
  Board.syrup = null;
  Board.mask = null;
  Board.spawnIng = null;
  B.stage = i; B.wave = 0; B.over = false; B.busy = true; B.sel = null; B.pending = [];
  B.teamHp = B.teamMax = Save.data.buff === 'hp' ? 150 : 120;
  B.fever = 0;
  B.maxCombo = 0;
  updateFever();
  Sound.music('battle');
  NTYPES = B.team.length;
  B.gauge = B.team.map(k => (Save.data.buff === 'gauge' ? Math.floor(CHARS[k].skill.need / 2) : 0));
  if (Save.data.buff) { Save.data.buff = null; Save.save(); }
  show('battle');
  $('#stageName').textContent = `${routeIdx('b', i) + 1}. ${STAGES[i].name}`;
  buildParty();
  layoutBoard();
  boardEl.querySelectorAll('.tile').forEach(e => e.remove());
  fx.innerHTML = '';
  B.grid = Board.create();
  spawnMonster(false);
  updateTeam();
  if (STORY[i] && Save.data.stars[i] == null) await playStory(STORY[i]);
  await dropIn('토벌 시작!');
  B.busy = false;
  Tutor.onStart();
  Tutor.poke();
}

// 반짝반짝: 가만히 있을 때 판 위 구슬에 가끔 별빛이 스침
setInterval(() => {
  if (!$('#battle').classList.contains('active') || B.busy || B.over || !B.grid || document.hidden) return;
  const all = [];
  Board.each(B.grid, (t, r, c) => t.el && t.type >= 0 && all.push([r, c]));
  const [r, c] = all[Math.floor(Math.random() * all.length)] || [];
  if (r == null) return;
  const p = tileCenter(r, c);
  kp('star_06', p.x - B.S * 0.22, p.y - B.S * 0.24, B.S * 0.55, '#ffffff', [
    { transform: 'scale(0) rotate(0)', opacity: 0 }, { transform: 'scale(1) rotate(45deg)', opacity: 1, offset: 0.4 }, { transform: 'scale(0) rotate(90deg)', opacity: 0 },
  ], { duration: 700, easing: 'ease-in-out' });
}, 900);

// 판 떨어지며 등장
async function dropIn(text) {
  const ps = [];
  Board.each(B.grid, (t, r, c) => {
    makeTile(t);
    place(t, r - ROWS - 1, c);
    ps.push(slide(t, r, c, 420, 'cubic-bezier(.5,0,1,1)', c * 35 + (ROWS - r) * 25).then(() => squish(t)));
  });
  setTimeout(() => Sound.play('land', 1, 0.4), 450);
  banner(text);
  Sound.play('jingle_start', 1, 0.8);
  await Promise.all(ps);
}
$('#btnBack').onclick = () => {
  if (B.busy && !B.over) return;
  Sound.play('click');
  Life.stopTimer();
  go(B.mode === 'life' && L.run && L.run.kind !== 'route' ? openChallenge : openMap);
};

// ---------- 입력 ----------
let down = null;
function cellAt(e) {
  const rect = boardEl.getBoundingClientRect();
  const c = Math.floor((e.clientX - rect.left) / B.S), r = Math.floor((e.clientY - rect.top) / B.S);
  return inside(r, c) ? [r, c] : null;
}
function setSel(cell) {
  clearSel();
  if (!movable(B.grid[cell[0]][cell[1]])) return;
  B.sel = cell;
  B.grid[cell[0]][cell[1]].el.classList.add('sel');
  Sound.play('click', 1.4, 0.4);
}
function clearSel() {
  if (B.sel) B.grid[B.sel[0]][B.sel[1]]?.el?.classList.remove('sel');
  B.sel = null;
}
boardEl.addEventListener('pointerdown', e => {
  Tutor.poke();
  if (B.busy || B.over) return;
  const cell = cellAt(e);
  if (!cell) return;
  down = { x: e.clientX, y: e.clientY, cell, moved: false };
  boardEl.setPointerCapture(e.pointerId);
});
boardEl.addEventListener('pointermove', e => {
  if (!down || down.moved) return;
  const dx = e.clientX - down.x, dy = e.clientY - down.y;
  if (Math.hypot(dx, dy) < B.S * 0.35) return;
  down.moved = true;
  const [r, c] = down.cell;
  const to = Math.abs(dx) > Math.abs(dy) ? [r, c + Math.sign(dx)] : [r + Math.sign(dy), c];
  clearSel();
  if (inside(to[0], to[1]) && movable(B.grid[to[0]][to[1]])) trySwap(down.cell, to);
  else if (B.grid[r][c]?.special) activate(down.cell); // 벽이나 장애물 쪽으로 밀어도 제자리에서 발동
});
boardEl.addEventListener('pointerup', () => {
  if (!down) return;
  const d = down;
  down = null;
  if (d.moved || B.busy) return;
  if (B.sel) {
    const [r, c] = B.sel, [r2, c2] = d.cell;
    if (Math.abs(r - r2) + Math.abs(c - c2) === 1) { clearSel(); trySwap([r, c], [r2, c2]); return; }
    if (r === r2 && c === c2) {
      clearSel();
      if (B.grid[r][c]?.special) activate([r, c]); // 아이템은 두 번 톡톡 누르면 발동
      return;
    }
  }
  setSel(d.cell);
});
boardEl.addEventListener('pointercancel', () => (down = null));

async function trySwap(a, b) {
  if (B.busy || B.over) return;
  const g = B.grid;
  const ta = g[a[0]][a[1]], tb = g[b[0]][b[1]];
  if (!movable(ta) || !movable(tb)) return;
  if (!Tutor.allow(a, b)) { Sound.play('bad', 1.2, 0.5); return; }
  Haptic.tap(15); // 손가락이 닿아 있는 동안 울려야 아이폰에서도 느껴짐
  B.busy = true;
  Sound.play('swap', 1.15);
  Board.swap(g, a, b);
  await Promise.all([slide(ta, b[0], b[1], 100, 'cubic-bezier(.3,.7,.4,1)'), slide(tb, a[0], a[1], 100, 'cubic-bezier(.3,.7,.4,1)')]);
  const combo = Board.swapCombo(g, a, b);
  // 밀어서 옮긴 아이템은 매치가 없어도 그 자리에서 발동 (꿈의집처럼)
  const items = combo ? [] : [[b, ta], [a, tb]].filter(([, t]) => t.special).map(([p]) => p);
  if (!combo && !items.length && !Board.findRuns(g).length) {
    Sound.play('bad', 1.2, 0.7);
    Board.swap(g, a, b);
    await Promise.all([
      slide(ta, a[0], a[1], 220, 'cubic-bezier(.3,1.6,.6,1)'),
      slide(tb, b[0], b[1], 220, 'cubic-bezier(.3,1.6,.6,1)'),
    ]);
    B.busy = false;
    return;
  }
  if (combo) await comboFx(combo);
  await cascade([a, b], combo ? combo.cells : items);
  await endTurn();
  if (!B.over) B.busy = false;
}

// 아이템 하나를 제자리에서 터뜨림 (한 턴 씀)
async function activate([r, c]) {
  const t = B.grid[r][c];
  if (B.busy || B.over || !t?.special || Tutor.guide) return;
  Haptic.tap(25);
  B.busy = true;
  clearSel();
  Sound.play('click', 1.6, 0.5);
  await t.inner.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1.1)' }], { duration: 140, easing: 'ease-out' }).finished;
  await cascade(null, [[r, c]]);
  await endTurn();
  if (!B.over) B.busy = false;
}

const settleAll = dur => {
  const ps = [];
  Board.each(B.grid, (t, r, c) => ps.push(slide(t, r, c, dur, 'cubic-bezier(.3,1.4,.6,1)')));
  return Promise.all(ps);
};

// ---------- 연쇄 ----------
async function cascade(swapped, forced) {
  let combo = 0;
  for (;;) {
    const res = Board.resolve(B.grid, combo === 0 ? swapped : null, combo === 0 ? forced : []);
    if (!res) break;
    combo++;
    B.maxCombo = Math.max(B.maxCombo || 0, combo);
    if (B.mode === 'battle' && combo === 5 && !B.fever) await feverShow();
    await stepFx(res, combo);
    await fall(Board.gravity(B.grid));
    if (B.mode === 'life') await Life.collect();
  }
  if (!Board.hasMove(B.grid)) {
    await banner('섞는 중…', 400);
    Board.shuffle(B.grid);
    await settleAll(380);
    if (Board.findRuns(B.grid).length) await cascade(null, []);
  }
}

async function comboFx(combo) {
  const [r, c] = combo.at;
  const p = tileCenter(r, c);
  const names = { rainbow: '무지개 폭탄!', rainbow2: '무지개 대폭발!!', 'bomb+bomb': '대폭발!', 'bomb+h': '크로스 폭발!', 'bomb+v': '크로스 폭발!',
    'plane+plane': '비행기 편대!', 'bomb+plane': '폭탄 배달!', 'h+plane': '줄폭탄 배달!', 'plane+v': '줄폭탄 배달!' };
  const label = names[combo.kind] || '크로스!';
  Juice.zoom(p.x, p.y, combo.kind.startsWith('rainbow') || combo.kind === 'bomb+bomb' ? 1.12 : 1.07);
  if (combo.converted) Board.each(B.grid, t => t.special && refreshTile(t));
  Sound.play(combo.kind.startsWith('rainbow') ? 'rainbow' : 'special', 1);
  flash('#fff6a8', 0.5);
  shake(8, 350);
  const ring = addFx('ring', p.x, p.y);
  ring.animate([{ width: '0px', height: '0px', opacity: 1 }, { width: B.S * 8 + 'px', height: B.S * 8 + 'px', opacity: 0 }], { duration: 500, easing: 'ease-out' }).finished.then(() => ring.remove());
  banner(label, 350);
  await sleep(250);
  if (combo.planes) {
    await Promise.all(combo.planes.map(tg => planeFly(p, tileCenter(tg[0], tg[1]), combo.carry)));
    combo.planes.forEach(([tr, tc]) => (combo.carry ? effectFx({ kind: combo.carry, r: tr, c: tc }) : burst(tileCenter(tr, tc).x, tileCenter(tr, tc).y, '#bff3ff', 8)));
  }
}

// 비행기가 목표 칸으로 휙 날아감 (carry: 싣고 가는 아이템)
function planeFly(from, to, carry = null) {
  Sound.play('swap', 0.75, 0.8);
  const el = addFx('plane-fly', from.x, from.y);
  el.innerHTML = `<img src="${ITEM('plane')}">` + (carry ? `<img class="carry" src="${ITEM(carry)}">` : '');
  const dx = to.x - from.x, dy = to.y - from.y;
  const ang = Math.atan2(dy, dx) * 180 / Math.PI + 30; // 그림이 오른쪽 위를 봄
  const lift = -Math.max(60, Math.hypot(dx, dy) * 0.35);
  return el.animate([
    { transform: 'translate(-50%,-50%) scale(.6) rotate(0deg)' },
    { transform: `translate(calc(-50% + ${dx * 0.4}px), calc(-50% + ${dy * 0.4 + lift}px)) scale(1.25) rotate(${ang}deg)`, offset: 0.45 },
    { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.8) rotate(${ang}deg)` },
  ], { duration: 380, easing: 'ease-in-out' }).finished.then(() => el.remove());
}

function effectFx(ef) {
  const b = boardEl.getBoundingClientRect(), a = app.getBoundingClientRect();
  const bx = b.left - a.left, by = b.top - a.top, S = B.S;
  if (ef.kind === 'h' || ef.kind === 'v') {
    Sound.play('line', 1.1, 0.7);
    const horiz = ef.kind === 'h', thick = S * 0.55;
    // 로켓 두 개가 양쪽 끝으로 쓩, 출발점은 하얗게 번쩍
    const o = tileCenter(ef.r, ef.c);
    kp('flare_01', o.x, o.y, S * 2.6, '#ffffff', [{ transform: 'scale(.3)', opacity: 1 }, { transform: 'scale(1.2)', opacity: 0 }], { duration: 300, easing: 'ease-out' });
    for (let k = 1; k < 7; k++) [-1, 1].forEach(d => setTimeout(() => {
      const x = o.x + (horiz ? d * k * S : 0), y = o.y + (horiz ? 0 : d * k * S);
      kp('spark_05', x, y, S * 0.9, '#bfe9ff', [{ transform: `scale(.4) rotate(${horiz ? 90 : 0}deg)`, opacity: 1 }, { transform: `scale(1.1) rotate(${horiz ? 90 : 0}deg)`, opacity: 0 }], { duration: 240 });
    }, k * 28));
    [-1, 1].forEach(dir => {
      const im = new Image();
      im.src = ITEM('rocket');
      im.className = 'fximg';
      Object.assign(im.style, { left: o.x + 'px', top: o.y + 'px', width: S * 0.8 + 'px', zIndex: 3 });
      fx.appendChild(im);
      const dist = (horiz ? app.clientWidth : app.clientHeight) * dir;
      const rot = horiz ? (dir > 0 ? 45 : -135) : (dir > 0 ? 135 : -45);
      im.animate([
        { transform: `translate(-50%,-50%) rotate(${rot}deg) scale(.6)` },
        { transform: `translate(calc(-50% + ${horiz ? dist : 0}px), calc(-50% + ${horiz ? 0 : dist}px)) rotate(${rot}deg) scale(1.1)` },
      ], { duration: 420, easing: 'cubic-bezier(.4,0,.9,.5)' }).finished.then(() => im.remove());
    });
    const beam = addFx('beam ' + ef.kind, 0, 0);
    Object.assign(beam.style, horiz
      ? { left: '0px', top: by + (ef.r + 0.5) * S - thick / 2 + 'px', width: app.clientWidth + 'px', height: thick + 'px' }
      : { left: bx + (ef.c + 0.5) * S - thick / 2 + 'px', top: '0px', width: thick + 'px', height: app.clientHeight + 'px' });
    const [along, across] = horiz ? ['X', 'Y'] : ['Y', 'X'];
    beam.animate([
      { transform: `scale${along}(0) scale${across}(1.6)`, opacity: 1 },
      { transform: `scale${along}(1) scale${across}(1)`, opacity: 1, offset: 0.3 },
      { transform: `scale${along}(1) scale${across}(.15)`, opacity: 0 },
    ], { duration: 450, easing: 'ease-out' }).finished.then(() => beam.remove());
    const n = horiz ? COLS : ROWS, from = horiz ? ef.c : ef.r;
    for (let i = 0; i < n; i++) {
      const p = horiz ? tileCenter(ef.r, i) : tileCenter(i, ef.c);
      setTimeout(() => burst(p.x, p.y, '#bff3ff', 3), 40 + Math.abs(i - from) * 25);
    }
    shake(4, 200);
  } else if (ef.kind === 'bomb') {
    Sound.play('line', 0.7, 0.9);
    const p = tileCenter(ef.r, ef.c);
    kp('light_02', p.x, p.y, S * 4, '#fff6c8', [{ transform: 'scale(.2)', opacity: 1 }, { transform: 'scale(1)', opacity: 0 }], { duration: 300, easing: 'ease-out' });
    kp('magic_02', p.x, p.y, S * 4.2, '#ffb347', [{ transform: 'scale(.2) rotate(0)', opacity: 1 }, { transform: 'scale(1) rotate(60deg)', opacity: 0 }], { duration: 480, easing: 'ease-out' });
    kp('smoke_04', p.x, p.y, S * 3, '#e8dccb', [{ transform: 'scale(.3)', opacity: 0.9 }, { transform: 'scale(1.2)', opacity: 0 }], { duration: 700, easing: 'ease-out' });
    ringFx(p.x, p.y, S * 5, '#ffd84d', 420);
    burst(p.x, p.y, '#ffb347', 10);
    Juice.stop(60);
    shake(7, 280);
    flash('#fff6a8', 0.3);
  } else if (ef.kind === 'rainbow') {
    Sound.play('rainbow', 1);
    const p = tileCenter(ef.r, ef.c);
    kp('twirl_01', p.x, p.y, S * 6, '#ffb3d1', [{ transform: 'scale(.2) rotate(0)', opacity: 1 }, { transform: 'scale(1) rotate(240deg)', opacity: 0 }], { duration: 650, easing: 'ease-out' });
    burst(p.x, p.y, '#b99cf0', 14);
    flash('#ffffff', 0.5);
    shake(6, 300);
  } else if (ef.kind === 'plane') {
    const p = tileCenter(ef.r, ef.c);
    NEAR4.forEach(([dr, dc]) => inside(ef.r + dr, ef.c + dc) && burst(p.x + dc * S, p.y + dr * S, '#bff3ff', 3));
    if (ef.target) {
      const to = tileCenter(ef.target[0], ef.target[1]);
      planeFly(p, to).then(() => { burst(to.x, to.y, '#ffffff', 8); Sound.play('pop', 0.9, 0.8); });
    }
  }
}

function popTile(t, delay) {
  if (t.el.isConnected && t.type >= 0) {
    const r = t.el.getBoundingClientRect(), a = app.getBoundingClientRect();
    const f = addFx('popflash', r.left - a.left + r.width / 2, r.top - a.top + r.height / 2);
    f.style.width = f.style.height = r.width + 'px';
    f.animate([{ transform: 'translate(-50%,-50%) scale(.4)', opacity: 0.95 }, { transform: 'translate(-50%,-50%) scale(1.25)', opacity: 0 }],
      { duration: 260, delay: delay + 60, easing: 'ease-out', fill: 'backwards' }).finished.then(() => f.remove());
  }
  // 하얗게 번쩍 → 통 부풀었다가 → 쏙 사라짐
  return t.inner.animate([
    { transform: 'scale(1)', opacity: 1, filter: 'brightness(1)' },
    { transform: 'scale(1.18,.86)', opacity: 1, filter: 'brightness(2.2)', offset: 0.2 },
    { transform: 'scale(1.38)', opacity: 1, filter: 'brightness(1.6)', offset: 0.45 },
    { transform: 'scale(0) rotate(30deg)', opacity: 0, filter: 'brightness(1)' },
  ], { duration: 260, delay, easing: 'ease-in', fill: 'forwards' }).finished.then(() => t.el.remove());
}

// 조각이 포물선으로 튀어 떨어짐 (상자 나무 조각, 포장지, 흙, 물방울)
function shards(x, y, colors, n = 8, size = 10, round = false) {
  for (let i = 0; i < n; i++) {
    const el = addFx('shard' + (round ? ' round' : ''), x, y);
    el.style.background = colors[i % colors.length];
    el.style.width = size * (0.6 + Math.random() * 0.8) + 'px';
    el.style.height = size * (round ? 1 : 0.5 + Math.random() * 0.5) + 'px';
    const dx = (Math.random() - 0.5) * 120, up = 40 + Math.random() * 60, rot = (Math.random() - 0.5) * 720;
    el.animate([
      { transform: 'translate(-50%,-50%) rotate(0)', opacity: 1 },
      { transform: `translate(calc(-50% + ${dx * 0.5}px), calc(-50% - ${up}px)) rotate(${rot / 2}deg)`, opacity: 1, offset: 0.4 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${up * 0.8}px)) rotate(${rot}deg)`, opacity: 0 },
    ], { duration: 650 + Math.random() * 250, easing: 'cubic-bezier(.2,.6,.5,1)' }).finished.then(() => el.remove());
  }
}
function ringFx(x, y, size, color, dur = 380) {
  kp('circle_05', x, y, size, color, [{ transform: 'scale(.1)', opacity: 1 }, { transform: 'scale(1)', opacity: 0 }], { duration: dur, easing: 'ease-out' });
}
// 그림 하나가 튀어 오르며 빙글 날아감 (리본, 선물 포장)
function flyOff(img, x, y, size) {
  const im = new Image();
  im.src = img;
  im.className = 'fximg';
  Object.assign(im.style, { left: x + 'px', top: y + 'px', width: size + 'px' });
  fx.appendChild(im);
  const dx = (Math.random() < 0.5 ? -1 : 1) * (40 + Math.random() * 40);
  im.animate([
    { transform: 'translate(-50%,-50%) scale(1) rotate(0)', opacity: 1 },
    { transform: `translate(calc(-50% + ${dx * 0.5}px), calc(-50% - 70px)) scale(1.25) rotate(${dx * 2}deg)`, opacity: 1, offset: 0.35 },
    { transform: `translate(calc(-50% + ${dx}px), calc(-50% + 60px)) scale(.7) rotate(${dx * 5}deg)`, opacity: 0 },
  ], { duration: 750, easing: 'ease-out' }).finished.then(() => im.remove());
}
// 장애물이 맞거나 깨짐, 리본이 풀림, 잡초가 뽑힘, 시럽이 번짐
function hitFx(res, late) {
  const at = (r, c) => (late.has(key(r, c)) ? 380 : 60);
  const S = B.S;
  res.unlocked.forEach(({ r, c, tile }) => setTimeout(() => {
    const p = tileCenter(r, c);
    flyOff(ITEM('ribbon'), p.x, p.y, S * 0.9);
    shards(p.x, p.y, ['#ff8ab8', '#ffc4dc', '#ff5d9e'], 8, 9);
    ringFx(p.x, p.y, S * 1.6, '#ff8ab8');
    refreshTile(tile);
    squish(tile);
    Sound.play('pop', 1.7, 0.8);
    Sound.play('sparkle', 1.5, 0.4);
  }, at(r, c)));
  res.hits.forEach(({ r, c, tile, gone }) => setTimeout(() => {
    const p = tileCenter(r, c);
    if (tile.block === 'weed') {
      // 잡초 쑥: 잎이 튀어 오르고 흙이 흩어짐
      flyOff(ITEM(gone ? 'weed1' : 'weed2'), p.x, p.y, S * 0.9);
      shards(p.x, p.y + S * 0.2, ['#9b6b3a', '#7a5230', '#6dbf57', '#8fd06a'], 10, 8, true);
      ringFx(p.x, p.y, S * 1.6, '#8fd06a', 300);
      Sound.play('swap', 1.5, 0.7);
      Sound.play('pop', 1.2, 0.6);
    } else if (tile.block === 'bubble') {
      ringFx(p.x, p.y, S * 2, '#9fdcff', 320);
      shards(p.x, p.y, ['#bfe9ff', '#e6f7ff', '#8fd3ff'], 10, 8, true);
      Sound.play('pop', 1.9, 0.9);
      Sound.play('sparkle', 1.8, 0.4);
    } else if (gone) {
      shards(p.x, p.y, ['#c8955a', '#e2b77d', '#9b6b3a', '#f1d6a8'], 12, 13);
      ringFx(p.x, p.y, S * 1.8, '#e2b77d', 300);
      Sound.play('hit2', 0.7, 0.9);
      Sound.play('land', 0.8, 0.9);
      shake(4, 160);
    } else {
      // 선물 포장이 벗겨지고 상자가 남음
      flyOff(ITEM('gift'), p.x, p.y, S);
      shards(p.x, p.y, ['#ff6b6b', '#ffd84d', '#ff9f5a'], 10, 10);
      Sound.play('hit1', 1.2, 0.8);
    }
    if (gone) popTile(tile, 0);
    else { refreshTile(tile); squish(tile); }
  }, at(r, c)));
  if (res.weeds.length) {
    const cells = boardEl.querySelectorAll('.cellbg'), fgs = boardEl.querySelectorAll('.cellfg');
    res.weeds.forEach(({ r, c, left }, i) => setTimeout(() => {
      cells[key(r, c)].className = cellClass(r, c);
      fgs[key(r, c)].className = fgClass(r, c);
      const p = tileCenter(r, c);
      flyOff(ITEM(left ? 'weed2' : 'weed1'), p.x, p.y + S * 0.2, S * 0.8);
      shards(p.x, p.y + S * 0.3, ['#9b6b3a', '#7a5230', '#6dbf57'], 6, 7, true);
    }, 40 + Math.min(i * 25, 250)));
    setTimeout(() => Sound.play('sparkle', 1.4, 0.5), 60);
    Sound.play('swap', 1.6, 0.5);
  }
  if (res.syrup.length) {
    const cells = boardEl.querySelectorAll('.cellbg');
    res.syrup.forEach(({ r, c }, i) => setTimeout(() => {
      const d = cells[key(r, c)];
      d.className = cellClass(r, c);
      d.animate([{ transform: 'scale(.3)', filter: 'brightness(1.6)' }, { transform: 'scale(1.18)', offset: 0.6 }, { transform: 'scale(1)', filter: 'brightness(1)' }], { duration: 360, easing: 'ease-out' });
      const p = tileCenter(r, c);
      shards(p.x, p.y, ['#ffb347', '#ffd27a', '#e8912d'], 4, 8, true);
    }, 80 + Math.min(i * 30, 300)));
    setTimeout(() => Sound.play('heal', 1.6, 0.45), 80);
  }
}

function projectile(from, to, img, ring, delay) {
  const p = addFx('proj', from.x, from.y);
  p.style.backgroundImage = `url(${img})`;
  const dx = to.x - from.x, dy = to.y - from.y, side = (Math.random() - 0.5) * 140;
  return p.animate([
    { transform: 'translate(0,0) scale(.5)', opacity: 0 },
    { transform: `translate(${dx * 0.25 + side}px,${dy * 0.25 + 20}px) scale(1.15)`, opacity: 1, offset: 0.3 },
    { transform: `translate(${dx}px,${dy}px) scale(.55)`, opacity: 1 },
  ], { duration: 460, delay, easing: 'cubic-bezier(.5,0,.85,.55)', fill: 'both' }).finished.then(() => p.remove());
}

async function stepFx(res, combo) {
  res.effects.forEach(effectFx);
  if (res.effects.length) await sleep(60);

  // 뽀용 터짐 (비행기가 날아간 칸은 도착할 때)
  const late = new Set(res.effects.filter(e => e.target).map(e => key(e.target[0], e.target[1])));
  const n = res.cleared.length;
  res.cleared.forEach(({ r, c, tile }, i) => {
    const p = tileCenter(r, c);
    const color = tile.type >= 0 ? teamCh(tile.type).ring : '#ffd84d';
    const delay = late.has(key(r, c)) ? 380 : Math.min(i * 10, 150);
    setTimeout(() => {
      // 캐릭터 색 고리 + 반짝이 + 같은 색 방울이 포물선으로 톡톡
      if (i < 14) ringFx(p.x, p.y, B.S * 1.5, color, 300);
      burst(p.x, p.y, color, n > 15 ? 3 : 5);
      if (i < 20) shards(p.x, p.y, [color, '#ffffff'], n > 12 ? 2 : 4, 9, true);
    }, delay + 50);
    popTile(tile, delay);
  });
  // 많이 터질수록 판이 통 울림
  if (n >= 4) setTimeout(() => boardEl.animate([{ transform: 'scale(1)' }, { transform: `scale(${1 + Math.min(0.03, n * 0.002)})` }, { transform: 'scale(1)' }], { duration: 160, easing: 'ease-out' }), 60);
  if (combo >= 3) setTimeout(() => shake(2 + combo, 160), 60);
  hitFx(res, late);
  if (B.mode === 'life') Life.onStep(res, combo);
  for (let i = 0; i < Math.min(3, Math.ceil(n / 3)); i++) setTimeout(() => Sound.pop(combo - 1 + i), i * 70);
  if (n >= 6) setTimeout(() => Sound.play('sparkle', 1 + combo * 0.05, 0.6), 60);

  if (combo >= 2) {
    const b = boardEl.getBoundingClientRect(), a = app.getBoundingClientRect();
    const t = addFx('combo', b.left - a.left + b.width / 2, b.top - a.top + b.height * 0.3);
    t.textContent = `${combo} 콤보!`;
    const hue = (combo * 47) % 360;
    t.style.webkitTextStroke = `2px hsl(${hue} 70% 55%)`;
    t.style.textShadow = `0 4px 0 hsl(${hue} 70% 45%)`;
    t.animate([
      { transform: 'translate(-50%,-50%) scale(0)', opacity: 0 },
      { transform: `translate(-50%,-50%) scale(${1.2 + combo * 0.08})`, opacity: 1, offset: 0.25 },
      { transform: 'translate(-50%,-80%) scale(1)', opacity: 1, offset: 0.75 },
      { transform: 'translate(-50%,-110%) scale(.9)', opacity: 0 },
    ], { duration: 800, easing: 'ease-out' }).finished.then(() => t.remove());
  }

  // 공격과 회복 (토벌에서만)
  const tally = new Map();
  (B.mode === 'battle' ? res.cleared : []).forEach(({ r, c, tile }) => {
    if (tile.type < 0) return;
    if (!tally.has(tile.type)) tally.set(tile.type, []);
    tally.get(tile.type).push([r, c]);
  });
  const monC = centerOf($('#monster'));
  const teamC = centerOf($('#teamHp'));
  let d = 0;
  tally.forEach((cells, type) => {
    const ch = teamCh(type);
    const to = ch.heal ? teamC : monC;
    cells.slice(0, 4).forEach(([r, c]) => projectile(tileCenter(r, c), to, TILE(ch.id), ch.ring, (d++) * 35));
  });
  const mult = (1 + 0.25 * (combo - 1)) * (B.fever ? 1.5 : 1);
  B.pending.push((async () => {
    await sleep(440);
    let k = 0;
    for (const [type, cells] of tally) {
      const ch = teamCh(type);
      B.gauge[type] += cells.length;
      $('#party').children[type]?.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-10px) scale(1.15)' }, { transform: 'translateY(0)' }], { duration: 260 });
      if (ch.heal) {
        const amt = Math.round(cells.length * ch.heal * mult * Meta.mult(ch.id));
        B.teamHp = Math.min(B.teamMax, B.teamHp + amt);
        updateTeam();
        Sound.play('heal', 1.2, 0.6);
        floatNum(teamC.x, teamC.y - 10, `+${amt}`, '#3fae4f');
      } else if (B.monHp > 0) {
        const crit = ch.crit && Math.random() < ch.crit;
        const eff = attrMult(ch.attr, curWave().a);
        const dmg = Math.round(cells.length * ch.dmg * mult * eff * Meta.mult(ch.id) * (crit ? 2.5 : 1));
        hitMonster(dmg, ch, crit, k++, eff);
      }
      await sleep(110);
    }
    updateGauges();
  })());

  await sleep(Math.min(n * 10, 150) + 170);

  res.created.forEach(({ r, c, tile }) => {
    setTimeout(() => Tutor.onCreate(tile.special), 500);
    makeTile(tile);
    place(tile, r, c);
    tile.inner.animate([{ transform: 'scale(0) rotate(-90deg)' }, { transform: 'scale(1.35) rotate(10deg)', offset: 0.6 }, { transform: 'scale(1)' }],
      { duration: 380, easing: 'ease-out' });
    const p = tileCenter(r, c);
    burst(p.x, p.y, '#ffffff', 10);
    Sound.play('special', 1.1, 0.8);
    kp('star_09', p.x, p.y, B.S * 2.2, '#ffe680', [{ transform: 'scale(.2) rotate(0)', opacity: 1 }, { transform: 'scale(1) rotate(90deg)', opacity: 0 }], { duration: 520, easing: 'ease-out' });
  });
}

// 아이템 그림을 화면 한 곳에 크게 띄웠다가 사라지게
function fxImage(name, x, y, size, dur) {
  const im = new Image();
  im.src = ITEM(name);
  im.className = 'fximg';
  Object.assign(im.style, { left: x + 'px', top: y + 'px', width: size + 'px' });
  fx.appendChild(im);
  im.animate([
    { transform: 'translate(-50%,-50%) scale(.2)', opacity: 1 },
    { transform: 'translate(-50%,-50%) scale(1.1)', opacity: 1, offset: 0.4 },
    { transform: 'translate(-50%,-50%) scale(1.3)', opacity: 0 },
  ], { duration: dur, easing: 'ease-out' }).finished.then(() => im.remove());
}

function hitMonster(dmg, ch, crit, k, eff = 1) {
  B.monHp = Math.max(0, B.monHp - dmg);
  updateMon();
  const m = $('#monster');
  m.animate([
    { transform: 'translateX(0) scale(1)', filter: 'brightness(2.2)' },
    { transform: 'translateX(-10px) scale(.9,1.08)', filter: 'brightness(1.6)', offset: 0.3 },
    { transform: 'translateX(7px) scale(1.05,.95)', offset: 0.65 },
    { transform: 'translateX(0) scale(1)', filter: 'brightness(1)' },
  ], { duration: 280 });
  Sound.play('hit' + (1 + (k % 3)), 1 + Math.random() * 0.15, 0.8);
  Haptic.tap(crit ? 30 : 15);
  if (crit || eff > 1) Juice.stop(crit ? 90 : 50);
  const c = centerOf(m);
  const x = c.x + (Math.random() - 0.5) * c.w * 0.6, y = c.y - c.h * 0.1 + (Math.random() - 0.5) * 30;
  // 캐릭터 색 베기 자국 + 충격 고리
  const sl = addFx('slash', x, y);
  sl.style.setProperty('--c', ch.ring);
  const ang = -35 + (Math.random() - 0.5) * 50;
  sl.animate([
    { transform: `translate(-50%,-50%) rotate(${ang}deg) scaleX(0)`, opacity: 1 },
    { transform: `translate(-50%,-50%) rotate(${ang}deg) scaleX(1)`, opacity: 1, offset: 0.4 },
    { transform: `translate(-50%,-50%) rotate(${ang}deg) scaleX(1.1) scaleY(.2)`, opacity: 0 },
  ], { duration: 260, easing: 'ease-out' }).finished.then(() => sl.remove());
  ringFx(x, y, crit ? 150 : 90, crit ? '#ffd84d' : '#ffffff', 300);
  if (crit || eff > 1) {
    app.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.025)' }, { transform: 'scale(1)' }], { duration: 160, easing: 'ease-out' });
    flash('#ffffff', 0.25);
  }
  burst(x, y, ch.ring, 5);
  const mark = eff > 1 ? ' ▲' : eff < 1 ? ' ▼' : '';
  floatNum(x, y, `${dmg}` + mark, ch.ring, crit || eff > 1 ? 'crit' : '');
  if (crit) shake(5, 200);
}

// 이동 경로(박자 단위)를 따라 떨어뜨림. 장애물을 비켜 비스듬히 가는 것도 한 번에
async function fall(moves) {
  const ps = moves.map(({ tile: t, path, fresh }) => {
    if (fresh) makeTile(t);
    const t0 = path[0][2], span = Math.max(1, path[path.length - 1][2] - t0);
    const [r1, c1] = path[path.length - 1];
    place(t, r1, c1);
    const frames = path.map(([r, c, k]) => ({ transform: tf(r, c), offset: (k - t0) / span }));
    return t.el.animate(frames, { duration: 90 + Math.sqrt(span) * 55, delay: t0 * 40, easing: 'cubic-bezier(.6,0,1,1)', fill: 'backwards' })
      .finished.then(() => squish(t));
  });
  if (moves.length) setTimeout(() => Sound.play('land', 1.3, 0.25), 180);
  await Promise.all(ps);
}

// ---------- 턴 끝 ----------
async function endTurn() {
  await Promise.all(B.pending);
  B.pending = [];
  if (B.mode === 'life') { await Life.endTurn(); return; }
  if (B.monHp <= 0) { await monsterDefeated(); return; }
  if (B.fever) { B.fever--; updateFever(); }
  B.cd--;
  updateCd();
  if (B.cd <= 0) {
    await monsterAttack();
    B.cd = curWave().cd;
    updateCd();
    if (B.teamHp <= 0) await lose();
  }
}

async function monsterAttack() {
  const m = $('#monster');
  Sound.play('enemy', 0.85, 0.5);
  m.animate([
    { transform: 'scale(1)' },
    { transform: 'translateY(6px) scale(1.1,.88)', offset: 0.35 },
    { transform: 'translateY(30px) scale(1.4)', offset: 0.65 },
    { transform: 'scale(1)' },
  ], { duration: 520, easing: 'ease-out' });
  await sleep(330);
  Sound.play('enemy', 1, 1);
  flash();
  shake(12, 380);
  const atk = curWave().atk;
  B.teamHp = Math.max(0, B.teamHp - atk);
  updateTeam();
  const c = centerOf($('#teamHp'));
  floatNum(c.x, c.y - 10, `-${atk}`, '#e2543f', 'crit');
  $('#party').animate([{ transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'none' }], { duration: 240 });
  await sleep(450);
  if (curWave().m === 'mimic') await throwBoxes(curWave().boss ? 3 : 2);
}

// 미믹은 공격하면서 판에 상자를 던짐. 옆에서 터뜨리면 깨짐
async function throwBoxes(n) {
  const from = centerOf($('#monster'));
  const drops = Board.dropBlocks(B.grid, n);
  await Promise.all(drops.map(({ r, c, old, tile }, i) => {
    const to = tileCenter(r, c);
    const im = new Image();
    im.src = ITEM('box');
    im.className = 'fximg';
    Object.assign(im.style, { left: from.x + 'px', top: from.y + 'px', width: B.S + 'px' });
    fx.appendChild(im);
    const dx = to.x - from.x, dy = to.y - from.y;
    return im.animate([
      { transform: 'translate(-50%,-50%) scale(.4) rotate(0)' },
      { transform: `translate(calc(-50% + ${dx * 0.5}px), calc(-50% + ${dy * 0.5 - 90}px)) scale(1.2) rotate(200deg)`, offset: 0.5 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1) rotate(360deg)` },
    ], { duration: 480, delay: i * 120, easing: 'ease-in', fill: 'backwards' }).finished.then(() => {
      im.remove();
      popTile(old, 0);
      makeTile(tile);
      place(tile, r, c);
      squish(tile);
      burst(to.x, to.y, '#c8955a', 6);
      Sound.play('land', 1.2, 0.8);
    });
  }));
  if (!Board.hasMove(B.grid)) await cascade(null, []);
}

async function monsterDefeated() {
  const m = $('#monster');
  Sound.play('defeat', 1);
  const c = centerOf(m);
  Juice.stop(120);
  await sleep(120);
  Juice.zoom(c.x, c.y, 1.14, 900);
  Juice.slow(500, 0.35);
  shake(10, 320);
  burst(c.x, c.y, '#ffcf3f', 16);
  burst(c.x, c.y, '#ffffff', 12);
  const out = m.animate([
    { transform: 'scale(1) rotate(0)', opacity: 1, filter: 'brightness(1)' },
    { transform: 'scale(1.2,.8) rotate(-6deg)', filter: 'brightness(2.5)', offset: 0.3 },
    { transform: 'scale(.2) rotate(200deg) translateY(-60px)', opacity: 0 },
  ], { duration: 650, easing: 'ease-in', fill: 'forwards' });
  await out.finished;
  m.style.opacity = 0;
  out.cancel();
  B.wave++;
  if (B.wave < STAGES[B.stage].waves.length) {
    await banner(`WAVE ${B.wave + 1}`, 400);
    spawnMonster(true);
    await sleep(500);
  } else {
    await win();
  }
}

async function win() {
  B.over = true;
  B.busy = true;
  const ratio = B.teamHp / B.teamMax;
  const stars = ratio >= 0.7 ? 3 : ratio >= 0.35 ? 2 : 1;
  const firstClear = Save.data.stars[B.stage] == null;
  const coins = Meta.reward(stars, firstClear), treat = Meta.treat('b', B.stage, stars, firstClear);
  if (firstClear) Save.data.ramen = true;
  Save.data.stars[B.stage] = Math.max(Save.data.stars[B.stage] || 0, stars);
  setTimeout(() => Net.submit(), 0);
  Save.save();
  Sound.play('win', 1);
  await clearShow();
  const k = routeIdx('b', B.stage), isLast = k === ROUTE.length - 1;
  if (B.stage === STAGES.length - 1 && firstClear) await playStory(STORY.end);
  const pool = B.team.map(i => CHARS[i]);
  const ch = pool[Math.floor(Math.random() * pool.length)] || CHARS[0];
  Sound.music(null);
  const from = k;
  modal({
    title: '토벌 성공!', stars, char: ch.id, text: `${ch.name}: "${ch.line}"`,
    rows: [['남은 체력', Math.round(ratio * 100) + '%'], [`<img class="row-ic" src="${ITEM('coin')}">`, '+' + coins], treat],
    btn2: '지도', on2: () => go(() => openMap(firstClear ? from : null)),
    btn1: isLast ? '지도로' : '다음 스테이지',
    on1: () => go(() => (isLast ? openMap(firstClear ? from : null) : goRoute(k + 1))),
  });
}

async function lose() {
  B.over = true;
  B.busy = true;
  Sound.music(null);
  Sound.play('jingle_lose', 1, 0.9);
  await banner('후퇴…', 600);
  modal({
    title: '후퇴…', img: 'assets/img/art/scene_scared.jpg', photo: true, text: '치이카와: (훌쩍…) 다시 해볼까?',
    btn2: '지도', on2: () => go(openMap),
    btn1: '다시 하기', on1: () => go(() => startStage(B.stage)),
  });
}

// ---------- 편성 ----------
let formStage = 0, formPick = [];
function openFormation(i) {
  formStage = i;
  const saved = (Save.data.team || DEFAULT_TEAM).map(id => CHARS.findIndex(c => c.id === id)).filter(k => k >= 0);
  formPick = saved.filter(k => Meta.owned(CHARS[k].id)).slice(0, TEAM_SIZE);
  show('formation');
  $('#formStage').textContent = `${routeIdx('b', i) + 1}. ${STAGES[i].name}`;
  const seen = new Set();
  $('.attr-rule').innerHTML = matchupSVG();
  $('#formEnemies').innerHTML = STAGES[i].waves.filter(w => {
    const k = w.m + w.a + (w.hue || '');
    return !seen.has(k) && seen.add(k);
  }).map(w => {
    const title = w.title ? w.title + (w.title.endsWith('·') ? '' : ' ') : '';
    const tint = w.hue ? `filter:hue-rotate(${w.hue}deg) saturate(1.3)` : '';
    return `<div class="enemy-chip"><img src="${MONSTERS[w.m].img}" style="${tint}">${title}${MONSTERS[w.m].name}${attrTag(w.a)}</div>`;
  }).join('');
  renderFormation();
}
function renderFormation() {
  const foes = new Set(STAGES[formStage].waves.map(w => w.a));
  $('#formSlots').innerHTML = Array.from({ length: TEAM_SIZE }, (_, k) => {
    const c = CHARS[formPick[k]];
    return `<div class="slot" data-k="${k}" style="--ring:${c ? c.ring : 'transparent'}">${c ? Meta.figure(c.id, FACE(c.id)) + attrIcon(c.attr) : ''}</div>`;
  }).join('');
  $('#formSlots').querySelectorAll('.slot').forEach(el => (el.onclick = () => {
    if (formPick[+el.dataset.k] == null) return;
    formPick.splice(+el.dataset.k, 1);
    Sound.play('pop', 0.9, 0.6);
    renderFormation();
  }));
  $('#formCount').textContent = `${formPick.length} / ${TEAM_SIZE}`;
  // 친구 카드: 누르면 상세 창에서 넣고 빼기
  $('#formRoster').innerHTML = CHARS.map((c, k) => {
    const own = Meta.owned(c.id), good = own && [...foes].some(a => BEATS[c.attr] === a);
    return `<button class="ccard${formPick.includes(k) ? ' on' : ''}${own ? '' : ' locked'}" style="--ring:${c.ring}" data-k="${k}">
      ${own ? Meta.figure(c.id, art(c.id)) : `<span class="fig"><img src="${art(c.id)}" class="shadow"></span>`}
      <span class="nm">${own ? c.name : '???'}</span>
      <span class="meta">${own ? `${attrIcon(c.attr)}Lv${Meta.lv(c.id)}` : RECRUIT[c.id]?.treat ? '' : LOCK_SVG}</span>${own ? '' : treatBadge(c.id)}
      ${good ? '<span class="good">유리!</span>' : ''}</button>`;
  }).join('');
  // 톡: 넣고 빼기, 꾹(0.4초): 친구 상세 (스킬, 레벨)
  $('#formRoster').querySelectorAll('.ccard').forEach(el => {
    let timer = null, long = false;
    el.onpointerdown = () => {
      long = false;
      timer = setTimeout(() => { long = true; el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 200 }); openDetail(); }, 420);
    };
    el.onpointerup = el.onpointerleave = el.onpointercancel = () => clearTimeout(timer);
    el.oncontextmenu = e => e.preventDefault();
    el.onclick = () => {
      if (long) return;
      const k = +el.dataset.k, id = CHARS[k].id, at = formPick.indexOf(k);
      if (!Meta.owned(id)) { openDetail(); return; }
      if (at >= 0) formPick.splice(at, 1);
      else if (formPick.length < TEAM_SIZE) { formPick.push(k); Sound.voice(id, 'pick'); }
      else { Sound.play('bad'); el.animate([{ transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }], { duration: 180 }); return; }
      Sound.play('pop', at >= 0 ? 0.9 : 1.3, 0.6);
      renderFormation();
    };
    const openDetail = () => {
    const k = +el.dataset.k, id = CHARS[k].id, at = formPick.indexOf(k);
    Sound.play('click');
    Sheet.open(id, {
      action: {
        label: at >= 0 ? '편성에서 빼기' : formPick.length < TEAM_SIZE ? '출격 멤버로!' : '자리가 꽉 찼어요',
        run: () => {
          if (at >= 0) formPick.splice(at, 1);
          else if (formPick.length < TEAM_SIZE) { formPick.push(k); Sound.voice(id, 'pick'); }
          else { Sound.play('bad'); return; }
          Sound.play('pop', at >= 0 ? 0.9 : 1.3, 0.6);
          renderFormation();
        },
      },
      onChange: renderFormation,
    });
    };
  });
  $('#btnSortie').disabled = formPick.length !== TEAM_SIZE;
}
$('#btnSortie').onclick = () => {
  if (formPick.length !== TEAM_SIZE) return;
  Sound.play('open');
  B.team = formPick.slice();
  Save.data.team = B.team.map(k => CHARS[k].id);
  Save.save();
  go(() => startStage(formStage));
};
// 자동 편성: 이번 적에게 강한 친구 + 레벨 높은 친구, 회복 담당 한 명
$('#btnAuto').onclick = () => {
  const foes = STAGES[formStage].waves.map(w => w.a);
  const score = c => {
    const m = foes.reduce((a, f) => a + attrMult(c.attr, f), 0) / foes.length;
    return (c.heal ? 10 : c.dmg) * m * Meta.mult(c.id);
  };
  const owned = CHARS.map((c, k) => [c, k]).filter(([c]) => Meta.owned(c.id));
  const healer = owned.filter(([c]) => c.heal).sort((a, b) => score(b[0]) - score(a[0]))[0];
  const rest = owned.filter(([c]) => !c.heal).sort((a, b) => score(b[0]) - score(a[0]));
  formPick = [...(healer ? [healer] : []), ...rest].slice(0, TEAM_SIZE).map(([, k]) => k);
  Sound.play('sparkle', 1.2, 0.8);
  renderFormation();
  $('#formSlots').animate([{ transform: 'scale(1)' }, { transform: 'scale(1.04)' }, { transform: 'scale(1)' }], { duration: 260 });
};
$('#btnFormBack').onclick = () => { Sound.play('click'); go(openMap); };

// ---------- 스킬 ----------
// 캐릭터 색 스티커 띠가 찰싹 붙고, 그림이 튀어나와 대사, 빛줄기 남기고 빠짐 (약 1초)
async function cutIn(ch) {
  const el = document.createElement('div');
  el.className = 'cutin';
  el.style.setProperty('--ring', ch.ring);
  el.innerHTML = `<div class="dim"></div><div class="band"></div><img class="body" src="${art(ch.id)}">
    <div class="say">${ch.skill.say}</div><div class="sname">${ch.skill.name}</div><div class="streak"></div>`;
  app.appendChild(el);
  const [dim, band, body, say, sname, streak] = el.children;
  Sound.play('jingle_skill', 1, 0.9);
  setTimeout(() => Sound.voice(ch.id, 'skill'), 200);
  dim.animate([{ opacity: 0 }, { opacity: 0.55 }], { duration: 120, fill: 'forwards' });
  band.animate([
    { transform: 'rotate(-6deg) translateX(-110%)' },
    { transform: 'rotate(-6deg) translateX(4%)', offset: 0.75 },
    { transform: 'rotate(-6deg) translateX(0)' },
  ], { duration: 220, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'backwards' });
  body.animate([
    { transform: 'translateY(60px) scale(.6) rotate(-8deg)', opacity: 0 },
    { transform: 'translateY(-8px) scale(1.08) rotate(3deg)', opacity: 1, offset: 0.7 },
    { transform: 'none', opacity: 1 },
  ], { duration: 300, delay: 90, easing: 'ease-out', fill: 'backwards' });
  say.animate([
    { transform: 'scale(0)', opacity: 0 },
    { transform: 'scale(1.15)', opacity: 1, offset: 0.7 },
    { transform: 'scale(1)', opacity: 1 },
  ], { duration: 240, delay: 200, easing: 'ease-out', fill: 'backwards' });
  sname.animate([{ opacity: 0, transform: 'translateX(-20px)' }, { opacity: 1, transform: 'none' }], { duration: 200, delay: 260, fill: 'backwards' });
  setTimeout(() => Sound.play('pop', 1.4, 0.7), 220);
  await sleep(760);
  Sound.play('line', 1.3, 0.6);
  streak.animate([
    { opacity: 1, transform: 'rotate(-6deg) scaleX(0)' },
    { opacity: 1, transform: 'rotate(-6deg) scaleX(1)', offset: 0.5 },
    { opacity: 0, transform: 'rotate(-6deg) scaleX(1) scaleY(.2)' },
  ], { duration: 260 });
  const out = { duration: 200, easing: 'ease-in', fill: 'forwards' };
  band.animate([{ transform: 'rotate(-6deg) translateX(0)' }, { transform: 'rotate(-6deg) translateX(115%)' }], out);
  [body, say, sname].forEach(e => e.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateX(140%)', opacity: 0 }], out));
  await dim.animate([{ opacity: 0.55 }, { opacity: 0 }], { duration: 220, fill: 'forwards' }).finished;
  el.remove();
}

function pickTiles(n, ok = t => !t.special && t.type >= 0) {
  const all = [];
  Board.each(B.grid, (t, r, c) => ok(t) && all.push([r, c]));
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all.slice(0, n);
}

// 게이지가 차면 파티 얼굴을 눌러 사용. 턴은 쓰지 않음
async function useSkill(k) {
  const ch = teamCh(k);
  if (B.busy || B.over) return;
  if (B.gauge[k] < ch.skill.need) {
    const p = centerOf($('#party').children[k]);
    Sound.play('bad', 1.2, 0.5);
    $('#party').children[k].animate([{ transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }], { duration: 180 });
    return;
  }
  B.busy = true;
  clearSel();
  B.gauge[k] = 0;
  updateGauges();
  await cutIn(ch);
  const id = ch.skill.id;
  let cells = [];
  if (id === 'random8') {
    cells = pickTiles(8, () => true);
  } else if (id === 'rows2') {
    const rows = [0, 1, 2, 3, 4, 5, 6].sort(() => Math.random() - 0.5).slice(0, 2);
    rows.forEach(r => { for (let c = 0; c < COLS; c++) cells.push([r, c]); });
  } else if (id === 'cross') {
    // 랏코: 굵은 십자로 베고 몬스터에 큰 한 방
    const r0 = 1 + Math.floor(Math.random() * 5), c0 = 1 + Math.floor(Math.random() * 5);
    for (let d = -1; d <= 1; d++) {
      for (let i = 0; i < COLS; i++) cells.push([r0 + d, i]);
      for (let i = 0; i < ROWS; i++) cells.push([i, c0 + d]);
    }
    const eff = attrMult(ch.attr, curWave().a);
    const m = centerOf($('#monster'));
    Juice.zoom(m.x, m.y, 1.1, 500);
    hitMonster(Math.round(ch.dmg * 10 * eff * Meta.mult(ch.id)), ch, true, 0, eff);
    B.cd += 2;
    updateCd();
    const p = centerOf($('#countdown'));
    $('#countdown').animate([{ transform: 'scale(1)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 300 });
  } else if (id === 'bighit') {
    const eff = attrMult(ch.attr, curWave().a);
    const m = centerOf($('#monster'));
    fxImage('boom', m.x, m.y, B.S * 4, 500);
    flash('#fff6a8', 0.5);
    shake(14, 420);
    hitMonster(Math.round(ch.dmg * 18 * eff), ch, true, 0, eff);
    await sleep(500);
  } else if (id === 'convert6') {
    pickTiles(6, t => !t.special && t.type >= 0 && t.type !== k).forEach(([r, c], i) => {
      const t = B.grid[r][c];
      t.type = k;
      setTimeout(() => {
        refreshTile(t);
        squish(t);
        const p = tileCenter(r, c);
        burst(p.x, p.y, ch.ring, 6);
        Sound.pop(i);
      }, i * 70);
    });
    await sleep(6 * 70 + 200);
  } else if (id === 'heal40') {
    const amt = Math.round(B.teamMax * 0.4);
    B.teamHp = Math.min(B.teamMax, B.teamHp + amt);
    updateTeam();
    Sound.play('heal', 1, 0.9);
    const p = centerOf($('#teamHp'));
    burst(p.x, p.y, '#7fd17a', 14);
    floatNum(p.x, p.y - 10, `+${amt}`, '#3fae4f', 'crit');
    await sleep(400);
  } else if (id === 'ramen') {
    const amt = Math.round(B.teamMax * 0.2);
    B.teamHp = Math.min(B.teamMax, B.teamHp + amt);
    updateTeam();
    B.gauge = B.gauge.map(g => g + 3);
    updateGauges();
    Sound.play('heal', 1.1, 0.9);
    const p = centerOf($('#teamHp'));
    burst(p.x, p.y, '#ff9f5a', 14);
    floatNum(p.x, p.y - 10, `+${amt}`, '#3fae4f', 'crit');
    await sleep(400);
  } else if (id === 'meteor') {
    const spots = pickTiles(3);
    for (const [r, c] of spots) {
      const p = tileCenter(r, c);
      const s = new Image();
      s.src = FXI('star_y');
      s.className = 'fximg';
      Object.assign(s.style, { left: p.x + 'px', top: p.y + 'px', width: B.S * 1.2 + 'px' });
      fx.appendChild(s);
      s.animate([{ transform: 'translate(-50%,-50%) translate(140px,-420px) rotate(-200deg)' }, { transform: 'translate(-50%,-50%) rotate(0)' }],
        { duration: 380, easing: 'cubic-bezier(.5,0,1,1)' }).finished.then(() => s.remove());
      await sleep(130);
    }
    await sleep(260);
    spots.forEach(([r, c]) => { const t = B.grid[r][c]; t.special = 'bomb'; t.type = -1; refreshTile(t); });
    cells = spots;
  } else if (id === 'cols2') {
    const cs = [0, 1, 2, 3, 4, 5, 6].sort(() => Math.random() - 0.5).slice(0, 2);
    cs.forEach(c => { for (let r = 0; r < ROWS; r++) cells.push([r, c]); });
  } else if (id === 'stall') {
    B.cd += 3;
    updateCd();
    const p = centerOf($('#countdown'));
    $('#countdown').animate([{ transform: 'scale(1)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 300 });
    const eff = attrMult(ch.attr, curWave().a);
    hitMonster(Math.round(ch.dmg * 4 * eff), ch, false, 0, eff);
    await sleep(400);
  } else if (id === 'cheer') {
    Board.shuffle(B.grid);
    await settleAll(420);
    B.gauge = B.gauge.map((g, j) => (j === k ? g : g + 4));
    updateGauges();
    Sound.play('sparkle', 1.1, 0.8);
  } else if (id === 'rainbow') {
    const [rc] = pickTiles(1);
    if (rc) {
      const t = B.grid[rc[0]][rc[1]];
      t.special = 'rainbow';
      t.type = -1;
      refreshTile(t);
      t.inner.animate([{ transform: 'scale(0) rotate(-180deg)' }, { transform: 'scale(1.4)', offset: 0.6 }, { transform: 'scale(1)' }], { duration: 420 });
      const p = tileCenter(rc[0], rc[1]);
      fxImage('sparkle', p.x, p.y, B.S * 2, 500);
      Sound.play('special', 1.2, 0.9);
      await sleep(450);
    }
  }
  await cascade(null, cells);
  await Promise.all(B.pending);
  B.pending = [];
  if (B.monHp <= 0) await monsterDefeated();
  if (!B.over) B.busy = false;
}

// ---------- 화면 전환: 크레용 종이가 쓱 덮었다 걷힘 ----------
let wiping = false;
async function go(fn) {
  if (wiping) return;
  wiping = true;
  const w = document.createElement('div');
  w.className = 'wipe';
  w.innerHTML = `<img src="${POCKETS[Math.floor(Math.random() * POCKETS.length)]}">`;
  app.appendChild(w);
  await w.animate([{ transform: 'translateX(-105%) rotate(-4deg)' }, { transform: 'translateX(0) rotate(-4deg)' }],
    { duration: 240, easing: 'cubic-bezier(.3,.8,.4,1)', fill: 'forwards' }).finished;
  fn();
  await sleep(60);
  await w.animate([{ transform: 'translateX(0) rotate(-4deg)' }, { transform: 'translateX(105%) rotate(-4deg)' }],
    { duration: 260, easing: 'cubic-bezier(.6,0,.7,.2)', fill: 'forwards' }).finished;
  w.remove();
  wiping = false;
}

// ---------- 클리어 연출: 폭죽 → 도장 쾅 → 칭찬 ----------
function confetti(n = 14) {
  const W = app.clientWidth;
  for (let i = 0; i < n; i++) {
    const s = addFx('p spr big', Math.random() * W, -30);
    s.style.backgroundImage = `url(${FXI(FX_SPRITES[Math.floor(Math.random() * FX_SPRITES.length)])})`;
    const dx = (Math.random() - 0.5) * 120, dy = app.clientHeight * (0.6 + Math.random() * 0.5), rot = (Math.random() - 0.5) * 720;
    s.animate([
      { transform: 'translate(0,0) rotate(0) scale(.6)', opacity: 1 },
      { transform: `translate(${dx}px,${dy}px) rotate(${rot}deg) scale(1)`, opacity: 0.9 },
    ], { duration: 1300 + Math.random() * 700, delay: Math.random() * 300, easing: 'cubic-bezier(.3,.2,.6,1)', fill: 'backwards' }).finished.then(() => s.remove());
  }
}

async function clearShow(text = '토벌<br>성공!') {
  const el = document.createElement('div');
  el.className = 'clear-show';
  const pool = B.team.map(i => CHARS[i]);
  const ch = pool[Math.floor(Math.random() * pool.length)];
  el.innerHTML = `<div class="dim"></div>
    <div class="slam">${text}</div>
    <img class="hero" src="${art(ch.id)}"><div class="hero-say">${ch.line}</div>`;
  app.appendChild(el);
  const [dim, stamp, hero, say] = el.children;
  dim.animate([{ opacity: 0 }, { opacity: 0.35 }], { duration: 200, fill: 'forwards' });
  confetti(); setTimeout(() => confetti(10), 250);
  await sleep(250);
  // 도장: 크게 떠 있다가 쾅
  await stamp.animate([
    { transform: 'translate(-50%,-50%) scale(2.6) rotate(-24deg)', opacity: 0 },
    { transform: 'translate(-50%,-50%) scale(.88) rotate(-10deg)', opacity: 1, offset: 0.7 },
    { transform: 'translate(-50%,-50%) scale(1) rotate(-12deg)', opacity: 1 },
  ], { duration: 320, easing: 'cubic-bezier(.6,0,.9,.6)', fill: 'forwards' }).finished;
  Sound.play('hit1', 0.7, 1);
  Sound.play('jingle_win', 1, 1);
  setTimeout(() => Sound.voice(ch.id, 'win'), 500);
  shake(12, 320);
  flash('#ffffff', 0.4);
  const sc = centerOf(stamp);
  burst(sc.x, sc.y, '#e2543f', 16);
  await sleep(420);
  hero.animate([
    { transform: 'translateY(120%) rotate(-8deg)' },
    { transform: 'translateY(-6%) rotate(3deg)', offset: 0.7 },
    { transform: 'translateY(0) rotate(0)' },
  ], { duration: 380, easing: 'ease-out' });
  say.animate([{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1.12)', opacity: 1, offset: 0.7 }, { transform: 'scale(1)', opacity: 1 }],
    { duration: 260, delay: 280, fill: 'backwards' });
  setTimeout(() => Sound.play('pop', 1.3, 0.8), 300);
  await sleep(1300);
  await el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: 'forwards' }).finished;
  el.remove();
}

// ---------- 5콤보 응원 피버: 파자마 파티즈 등장 ----------
function updateFever() {
  $('#feverTag').classList.toggle('on', B.fever > 0);
  app.classList.toggle('fever', B.fever > 0);
}
async function feverShow() {
  B.fever = 3;
  updateFever();
  // 우후~! 빛줄기가 돌고, 파자마 파티즈가 통통 튀어 올라 춤추고, 하트·별이 쏟아짐
  const el = document.createElement('div');
  el.className = 'fever-show';
  el.innerHTML = `<div class="rays"></div><img src="assets/img/art/pajama_uwawa.png"><div class="fever-txt">피버 타임!</div><div class="fever-sub">공격 ×1.5</div>`;
  app.appendChild(el);
  const [rays, img, txt, sub] = el.children;
  Sound.play('rainbow', 1.1, 1);
  Sound.play('jingle_skill', 1.25, 0.8);
  [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => setTimeout(() => Sound.play('pop', Math.pow(2, s / 12), 0.7), 80 + i * 70));
  flash('#ff9ec4', 0.55);
  Haptic.tap(60);
  setTimeout(() => Haptic.tap(40), 250);
  rays.animate([{ opacity: 0, transform: 'translate(-50%,-50%) scale(.3) rotate(0)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1) rotate(60deg)', offset: 0.3 },
    { opacity: 1, transform: 'translate(-50%,-50%) scale(1.1) rotate(160deg)', offset: 0.8 }, { opacity: 0, transform: 'translate(-50%,-50%) scale(1.2) rotate(200deg)' }], { duration: 1500, fill: 'forwards' });
  // 화면 한가운데로 쏙 튀어나와 들썩들썩
  img.animate([
    { transform: 'translate(-50%,-50%) scale(0) rotate(-20deg)', opacity: 0 },
    { transform: 'translate(-50%,-50%) scale(1.15) rotate(4deg)', opacity: 1, offset: 0.2 },
    { transform: 'translate(-50%,-50%) scale(1.04,.94)', offset: 0.32 },
    { transform: 'translate(-50%,-56%) scale(.98,1.04) rotate(4deg)', offset: 0.45 },
    { transform: 'translate(-50%,-50%) scale(1.04,.94)', offset: 0.57 },
    { transform: 'translate(-50%,-56%) scale(.98,1.04) rotate(-4deg)', offset: 0.7 },
    { transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: 0.85 },
    { transform: 'translate(-50%,-50%) scale(1.3)', opacity: 0 },
  ], { duration: 1500, easing: 'ease-in-out', fill: 'forwards' });
  txt.animate([{ transform: 'translateX(-50%) scale(0) rotate(-12deg)' }, { transform: 'translateX(-50%) scale(1.35) rotate(4deg)', offset: 0.5 }, { transform: 'translateX(-50%) scale(1) rotate(-3deg)' }],
    { duration: 420, delay: 120, easing: 'ease-out', fill: 'backwards' });
  sub.animate([{ opacity: 0, transform: 'translateX(-50%) translateY(10px)' }, { opacity: 1, transform: 'translateX(-50%)' }], { duration: 260, delay: 380, fill: 'backwards' });
  confetti(22);
  setTimeout(() => confetti(16), 350);
  const W = app.clientWidth, H = app.clientHeight;
  for (let i = 0; i < 6; i++) setTimeout(() => burst(W * (0.15 + Math.random() * 0.7), H * (0.2 + Math.random() * 0.5), ['#ff8ab8', '#ffd84d', '#9be7ff', '#b99cf0'][i % 4], 10), 150 + i * 140);
  shake(6, 300);
  await sleep(1300);
  await el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: 'forwards' }).finished;
  el.remove();
}

// ---------- 라면 가게: 토벌을 새로 깰 때마다 한 그릇 ----------
$('#btnRamen').onclick = () => {
  Sound.play('click');
  if (Save.data.ramen === false) {
    modal({ title: '라면 가게', img: 'assets/img/art/armor_one.png', text: '갑옷 아저씨: 오늘 국물은 다 떨어졌어. 토벌 하나 더 하고 와.', btn1: '알겠어요', on1: () => {} });
    return;
  }
  const take = buff => {
    Save.data.buff = buff;
    Save.data.ramen = false;
    Save.save();
    Sound.play('heal', 1, 0.9);
    $('#btnRamen').classList.remove('on');
    const c = centerOf($('#btnRamen'));
    burst(c.x, c.y, '#ff9f5a', 14);
    floatNum(c.x, c.y - 30, buff === 'hp' ? '다음 토벌 체력 150!' : '다음 토벌 게이지 반!', '#e07b39');
  };
  modal({
    title: '라면 가게', img: 'assets/img/art/armor_one.png', text: '갑옷 아저씨: 한 그릇 먹고 가. 곱빼기는 체력 150, 진한 국물은 스킬 게이지 반부터.',
    btn2: '진한 국물', on2: () => take('gauge'),
    btn1: '곱빼기', on1: () => take('hp'),
  });
};
