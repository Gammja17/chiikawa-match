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
  save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)); } catch {} },
};
Save.load();
const unlockedIdx = () => Math.min(Save.data.stars.length, STAGES.length - 1);

// 이미지 미리 불러오기
[...CHARS.map(c => FACE(c.id)), ...CHARS.map(c => TILE(c.id)),
  ...['chiikawa', 'hachiware', 'usagi', 'momonga', 'rakko', 'shisa', 'kurimanju'].map(BODY), ...Object.values(MONSTERS).map(m => m.img),
  ...['h', 'v', 'bomb', 'rainbow', 'boom', 'sparkle'].map(ITEM)]
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

function burst(x, y, color, n = 6) {
  for (let i = 0; i < n; i++) {
    const spr = Math.random() < 0.45;
    const p = addFx(spr ? 'p spr' : 'p', x, y);
    if (spr) p.style.backgroundImage = `url(${FXI(FX_SPRITES[Math.floor(Math.random() * FX_SPRITES.length)])})`;
    else p.style.background = color;
    const ang = Math.random() * Math.PI * 2, d = 26 + Math.random() * 42, rot = (Math.random() - 0.5) * 240;
    p.animate([
      { transform: 'translate(0,0) scale(1) rotate(0)', opacity: 1 },
      { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d}px) scale(0) rotate(${rot}deg)`, opacity: 0.6 },
    ], { duration: 420 + Math.random() * 200, easing: 'cubic-bezier(.2,.8,.4,1)' }).finished.then(() => p.remove());
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
}
function flash(color = '#ff4d6d', peak = 0.45) {
  const f = $('#flash');
  f.style.background = color;
  f.animate([{ opacity: peak }, { opacity: 0 }], { duration: 350, easing: 'ease-out' });
}

// ---------- 타이틀 ----------
['chiikawa', 'hachiware', 'usagi', 'momonga', 'kurimanju', 'rakko', 'shisa'].forEach((id, i) => {
  const im = new Image();
  im.src = art(id);
  im.draggable = false;
  im.style.animationDelay = i * 0.12 + 's';
  $('#titleParty').appendChild(im);
});
$('#btnStart').onclick = () => { Sound.play('open'); go(openMap); };

// ---------- 지도 ----------
const NODE_GAP = 108, NODE_TOP = 160;
const nodePos = (i, W) => ({ x: (0.5 + Math.sin(i * 1.15) * 0.28) * W, y: NODE_TOP + i * NODE_GAP });

function openMap(advanceFrom = null) {
  show('map');
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
    `<svg><path d="${d}" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" stroke-dasharray="1 22"/></svg>`);

  const cur = unlockedIdx();
  STAGES.forEach((st, i) => {
    const n = document.createElement('button');
    const locked = i > cur;
    const boss = st.waves.some(w => w.boss);
    n.className = 'node' + (locked ? ' locked' : '') + (boss ? ' boss' : '') + (i === cur ? ' current' : '');
    n.style.left = pts[i].x + 'px';
    n.style.top = pts[i].y + 'px';
    const s = Save.data.stars[i] || 0;
    n.innerHTML = `${locked ? '🔒' : boss ? '👹' : i + 1}<span class="nname">${st.name}</span>` +
      (s ? `<span class="nstars">${'★'.repeat(s)}${'☆'.repeat(3 - s)}</span>` : '');
    n.onclick = () => {
      if (locked) { Sound.play('bad'); n.animate([{ transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'none' }], { duration: 200 }); return; }
      Sound.play('click');
      go(() => openFormation(i));
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
const B = { team: [], gauge: [], grid: null, stage: 0, wave: 0, monHp: 0, monMax: 0, cd: 0, teamHp: 120, teamMax: 120, busy: true, over: false, sel: null, S: 56, pending: [] };
const curWave = () => STAGES[B.stage].waves[B.wave];
// 구슬 type(편성 순번) → 캐릭터
const teamCh = type => CHARS[B.team[type]];
const attrTag = a => `<span class="attr-tag" style="--ac:${ATTR[a].color}">${ATTR[a].icon}${ATTR[a].name}</span>`;

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
  }
  if (B.grid) Board.each(B.grid, (t, r, c) => t.el && place(t, r, c));
}
window.addEventListener('resize', () => { if ($('#battle').classList.contains('active')) layoutBoard(); });

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
  if (t.special === 'rainbow' || t.type < 0) {
    inner.classList.add('rainbow');
    inner.innerHTML = `<img src="${ITEM('rainbow')}" draggable="false">`;
    return;
  }
  const ch = teamCh(t.type);
  inner.style.setProperty('--ring', ch.ring);
  inner.classList.toggle('special', !!t.special);
  inner.innerHTML = `<img src="${TILE(ch.id)}" draggable="false">` +
    (t.special ? `<img class="badge ${t.special}" src="${ITEM(t.special)}" draggable="false">` : '');
}

function buildParty() {
  $('#party').innerHTML = B.team.map(i => CHARS[i]).map(c =>
    `<div class="pm" style="--ring:${c.ring}"><img src="${FACE(c.id)}" draggable="false"><span class="at">${ATTR[c.attr].icon}</span><i class="g"></i></div>`).join('');
  [...$('#party').children].forEach((el, k) => (el.onclick = () => useSkill(k)));
  updateGauges();
}
function updateGauges() {
  [...$('#party').children].forEach((el, k) => {
    const need = teamCh(k).skill.need;
    el.style.setProperty('--g', Math.min(1, B.gauge[k] / need));
    el.classList.toggle('ready', B.gauge[k] >= need);
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
  el.innerHTML = `<b>${Math.max(B.cd, 0)}</b>${B.cd <= 1 ? '곧 공격!' : '턴 후 공격'}`;
  el.classList.toggle('danger', B.cd <= 1);
}

function spawnMonster(animated) {
  const w = curWave(), M = MONSTERS[w.m];
  const img = $('#monster');
  img.src = M.img;
  img.style.maxWidth = w.boss ? '86%' : '70%';
  $('#monSprite').style.filter = w.hue ? `hue-rotate(${w.hue}deg) saturate(1.3)` : '';
  const title = w.title ? (w.title.endsWith('·') ? w.title : w.title + ' ') : '';
  $('#monName').innerHTML = (w.boss ? '👑 ' : '') + title + M.name + attrTag(w.a);
  $('#monName').classList.toggle('boss', !!w.boss);
  B.monHp = B.monMax = w.hp;
  B.cd = w.cd;
  $('#waveInfo').textContent = `WAVE ${B.wave + 1} / ${STAGES[B.stage].waves.length}`;
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
  $('#stageName').textContent = `${i + 1}. ${STAGES[i].name}`;
  buildParty();
  layoutBoard();
  boardEl.querySelectorAll('.tile').forEach(e => e.remove());
  fx.innerHTML = '';
  B.grid = Board.create();
  spawnMonster(false);
  updateTeam();
  if (STORY[i] && Save.data.stars[i] == null) await playStory(STORY[i]);
  // 판 떨어지며 등장
  const ps = [];
  Board.each(B.grid, (t, r, c) => {
    makeTile(t);
    place(t, r - ROWS - 1, c);
    ps.push(slide(t, r, c, 420, 'cubic-bezier(.5,0,1,1)', c * 35 + (ROWS - r) * 25).then(() => squish(t)));
  });
  setTimeout(() => Sound.play('land', 1, 0.4), 450);
  banner('토벌 시작!');
  Sound.play('jingle_start', 1, 0.8);
  await Promise.all(ps);
  B.busy = false;
}
$('#btnBack').onclick = () => { if (B.busy && !B.over) return; Sound.play('click'); go(openMap); };

// ---------- 입력 ----------
let down = null;
function cellAt(e) {
  const rect = boardEl.getBoundingClientRect();
  const c = Math.floor((e.clientX - rect.left) / B.S), r = Math.floor((e.clientY - rect.top) / B.S);
  return inside(r, c) ? [r, c] : null;
}
function setSel(cell) {
  clearSel();
  B.sel = cell;
  B.grid[cell[0]][cell[1]].el.classList.add('sel');
  Sound.play('click', 1.4, 0.4);
}
function clearSel() {
  if (B.sel) B.grid[B.sel[0]][B.sel[1]]?.el?.classList.remove('sel');
  B.sel = null;
}
boardEl.addEventListener('pointerdown', e => {
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
  if (inside(to[0], to[1])) trySwap(down.cell, to);
});
boardEl.addEventListener('pointerup', () => {
  if (!down) return;
  const d = down;
  down = null;
  if (d.moved || B.busy) return;
  if (B.sel) {
    const [r, c] = B.sel, [r2, c2] = d.cell;
    if (Math.abs(r - r2) + Math.abs(c - c2) === 1) { clearSel(); trySwap([r, c], [r2, c2]); return; }
    if (r === r2 && c === c2) { clearSel(); return; }
  }
  setSel(d.cell);
});
boardEl.addEventListener('pointercancel', () => (down = null));

async function trySwap(a, b) {
  if (B.busy || B.over) return;
  B.busy = true;
  const g = B.grid;
  const ta = g[a[0]][a[1]], tb = g[b[0]][b[1]];
  Sound.play('swap', 1.15);
  Board.swap(g, a, b);
  await Promise.all([slide(ta, b[0], b[1], 100, 'cubic-bezier(.3,.7,.4,1)'), slide(tb, a[0], a[1], 100, 'cubic-bezier(.3,.7,.4,1)')]);
  const combo = Board.swapCombo(g, a, b);
  if (!combo && !Board.findRuns(g).length) {
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
  await cascade([a, b], combo ? combo.cells : []);
  await endTurn();
  if (!B.over) B.busy = false;
}

// ---------- 연쇄 ----------
async function cascade(swapped, forced) {
  let combo = 0;
  for (;;) {
    const res = Board.resolve(B.grid, combo === 0 ? swapped : null, combo === 0 ? forced : []);
    if (!res) break;
    combo++;
    B.maxCombo = Math.max(B.maxCombo || 0, combo);
    if (combo === 5 && !B.fever) await feverShow();
    await stepFx(res, combo);
    await fall(Board.gravity(B.grid));
  }
  if (!Board.hasMove(B.grid)) {
    await banner('섞는 중…', 400);
    Board.shuffle(B.grid);
    await Promise.all(B.grid.flatMap((row, r) => row.map((t, c) => slide(t, r, c, 380, 'cubic-bezier(.3,1.4,.6,1)'))));
    if (Board.findRuns(B.grid).length) await cascade(null, []);
  }
}

async function comboFx(combo) {
  const [r, c] = combo.at;
  const p = tileCenter(r, c);
  const names = { rainbow: '무지개 폭탄!', rainbow2: '무지개 대폭발!!', 'bomb+bomb': '대폭발!', 'bomb+h': '크로스 폭발!', 'bomb+v': '크로스 폭발!' };
  const label = names[combo.kind] || '크로스!';
  if (combo.converted) Board.each(B.grid, t => t.special && refreshTile(t));
  Sound.play(combo.kind.startsWith('rainbow') ? 'rainbow' : 'special', 1);
  flash('#fff6a8', 0.5);
  shake(8, 350);
  const ring = addFx('ring', p.x, p.y);
  ring.animate([{ width: '0px', height: '0px', opacity: 1 }, { width: B.S * 8 + 'px', height: B.S * 8 + 'px', opacity: 0 }], { duration: 500, easing: 'ease-out' }).finished.then(() => ring.remove());
  banner(label, 350);
  await sleep(250);
}

function effectFx(ef) {
  const b = boardEl.getBoundingClientRect(), a = app.getBoundingClientRect();
  const bx = b.left - a.left, by = b.top - a.top, S = B.S;
  if (ef.kind === 'h' || ef.kind === 'v') {
    Sound.play('line', 1.1, 0.7);
    const horiz = ef.kind === 'h', thick = S * 0.55;
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
    const blast = addFx('blast', p.x, p.y);
    blast.animate([{ width: '0px', height: '0px', opacity: 1 }, { width: S * 3.5 + 'px', height: S * 3.5 + 'px', opacity: 0 }], { duration: 260, easing: 'ease-out' }).finished.then(() => blast.remove());
    const ring = addFx('ring', p.x, p.y);
    ring.animate([{ width: '0px', height: '0px', opacity: 1 }, { width: S * 5 + 'px', height: S * 5 + 'px', opacity: 0 }], { duration: 420, easing: 'ease-out' }).finished.then(() => ring.remove());
    fxImage('boom', p.x, p.y, S * 2.4, 420);
    shake(7, 280);
    flash('#fff6a8', 0.3);
  } else if (ef.kind === 'rainbow') {
    Sound.play('rainbow', 1);
    flash('#ffffff', 0.5);
    shake(6, 300);
  }
}

function popTile(t, delay) {
  return t.inner.animate([
    { transform: 'scale(1)', opacity: 1 },
    { transform: 'scale(1.3)', opacity: 1, offset: 0.35 },
    { transform: 'scale(0) rotate(40deg)', opacity: 0 },
  ], { duration: 200, delay, easing: 'ease-in', fill: 'forwards' }).finished.then(() => t.el.remove());
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

  // 뽀용 터짐
  const n = res.cleared.length;
  res.cleared.forEach(({ r, c, tile }, i) => {
    const p = tileCenter(r, c);
    const color = tile.type >= 0 ? teamCh(tile.type).ring : '#ffd84d';
    setTimeout(() => burst(p.x, p.y, color, n > 15 ? 3 : 6), Math.min(i * 10, 150));
    popTile(tile, Math.min(i * 10, 150));
  });
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

  // 공격과 회복
  const tally = new Map();
  res.cleared.forEach(({ r, c, tile }) => {
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
        const amt = Math.round(cells.length * ch.heal * mult);
        B.teamHp = Math.min(B.teamMax, B.teamHp + amt);
        updateTeam();
        Sound.play('heal', 1.2, 0.6);
        floatNum(teamC.x, teamC.y - 10, `+${amt}`, '#3fae4f');
      } else if (B.monHp > 0) {
        const crit = ch.crit && Math.random() < ch.crit;
        const eff = attrMult(ch.attr, curWave().a);
        const dmg = Math.round(cells.length * ch.dmg * mult * eff * (crit ? 2.5 : 1));
        hitMonster(dmg, ch, crit, k++, eff);
      }
      await sleep(110);
    }
    updateGauges();
  })());

  await sleep(Math.min(n * 10, 150) + 170);

  res.created.forEach(({ r, c, tile }) => {
    makeTile(tile);
    place(tile, r, c);
    tile.inner.animate([{ transform: 'scale(0) rotate(-90deg)' }, { transform: 'scale(1.35) rotate(10deg)', offset: 0.6 }, { transform: 'scale(1)' }],
      { duration: 380, easing: 'ease-out' });
    const p = tileCenter(r, c);
    burst(p.x, p.y, '#ffffff', 10);
    Sound.play('special', 1.1, 0.8);
    const LABEL = { h: '줄폭탄!', v: '줄폭탄!', bomb: '폭탄!', rainbow: '무지개 폭탄!' };
    floatNum(p.x, p.y - B.S * 0.4, LABEL[tile.special], '#f07ea6');
    fxImage('sparkle', p.x, p.y, B.S * 1.6, 500);
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
  const c = centerOf(m);
  const x = c.x + (Math.random() - 0.5) * c.w * 0.6, y = c.y - c.h * 0.1 + (Math.random() - 0.5) * 30;
  burst(x, y, ch.ring, 5);
  const mark = eff > 1 ? ' ▲' : eff < 1 ? ' ▼' : '';
  floatNum(x, y, (crit ? `${ch.line} ${dmg}` : `${dmg}`) + mark, ch.ring === '#ffd84d' ? '#d9a400' : ch.ring, crit || eff > 1 ? 'crit' : '');
  if (crit) shake(5, 200);
  if (Math.random() < 0.55) {
    const o = addFx('ono', x + (Math.random() - 0.5) * 60, y - 34);
    o.textContent = ONO[Math.floor(Math.random() * ONO.length)];
    o.style.setProperty('--c', ch.ring === '#ffd84d' || ch.ring === '#f5d90a' ? '#e8a600' : ch.ring);
    o.animate([
      { transform: 'translate(-50%,-50%) rotate(-10deg) scale(.2)', opacity: 0 },
      { transform: 'translate(-50%,-50%) rotate(-10deg) scale(1.25)', opacity: 1, offset: 0.25 },
      { transform: 'translate(-50%,-80%) rotate(-6deg) scale(1)', opacity: 1, offset: 0.7 },
      { transform: 'translate(-50%,-110%) rotate(-6deg) scale(.9)', opacity: 0 },
    ], { duration: 700, easing: 'ease-out' }).finished.then(() => o.remove());
  }
}

async function fall(moves) {
  const ps = moves.map(mv => {
    const t = mv.tile;
    if (mv.fresh) { makeTile(t); place(t, mv.from, mv.c); }
    const dist = mv.to - mv.from;
    return slide(t, mv.to, mv.c, 90 + Math.sqrt(dist) * 55, 'cubic-bezier(.6,0,1,1)').then(() => squish(t));
  });
  if (moves.length) setTimeout(() => Sound.play('land', 1.3, 0.25), 180);
  await Promise.all(ps);
}

// ---------- 턴 끝 ----------
async function endTurn() {
  await Promise.all(B.pending);
  B.pending = [];
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
}

async function monsterDefeated() {
  const m = $('#monster');
  Sound.play('defeat', 1);
  const c = centerOf(m);
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
  if (firstClear) Save.data.ramen = true;
  Save.data.stars[B.stage] = Math.max(Save.data.stars[B.stage] || 0, stars);
  Save.save();
  Sound.play('win', 1);
  await clearShow();
  const isLast = B.stage === STAGES.length - 1;
  if (isLast && firstClear) await playStory(STORY.end);
  const pool = B.team.map(i => CHARS[i]);
  const ch = pool[Math.floor(Math.random() * pool.length)] || CHARS[0];
  Sound.music(null);
  const from = B.stage;
  modal({
    title: '토벌 성공!', stars, char: ch.id, text: `${ch.name}: "${ch.line}"`,
    rows: [['남은 체력', Math.round(ratio * 100) + '%'], ['최대 콤보', B.maxCombo || 1], ['라면', firstClear ? '+1그릇' : '-']],
    btn2: '지도', on2: () => go(() => openMap(firstClear ? from : null)),
    btn1: isLast ? '지도로' : '다음 스테이지',
    on1: () => go(() => (isLast ? openMap(firstClear ? from : null) : openFormation(B.stage + 1))),
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
  formPick = saved.slice(0, TEAM_SIZE);
  show('formation');
  $('#formStage').textContent = `${i + 1}. ${STAGES[i].name}`;
  const seen = new Set();
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
    return `<div class="slot">${c ? `<img src="${FACE(c.id)}"><span class="at">${ATTR[c.attr].icon}</span>` : ''}</div>`;
  }).join('');
  $('#formCount').textContent = `${formPick.length} / ${TEAM_SIZE}`;
  $('#formRoster').innerHTML = CHARS.map((c, k) => {
    const good = [...foes].some(a => BEATS[c.attr] === a);
    return `<button class="ccard${formPick.includes(k) ? ' on' : ''}" style="--ring:${c.ring}" data-k="${k}">
      <img src="${art(c.id)}"><div><div class="nm">${c.name} ${attrTag(c.attr)}</div>
      <div class="sk">${c.heal ? '회복' : '공격'} · ${c.skill.name}: ${c.skill.desc}</div></div>${good ? '<span class="good">유리!</span>' : ''}</button>`;
  }).join('');
  $('#formRoster').querySelectorAll('.ccard').forEach(el => (el.onclick = () => {
    const k = +el.dataset.k, at = formPick.indexOf(k);
    if (at >= 0) formPick.splice(at, 1);
    else if (formPick.length < TEAM_SIZE) formPick.push(k);
    else { Sound.play('bad'); return; }
    Sound.play('pop', at >= 0 ? 0.9 : 1.3, 0.6);
    renderFormation();
  }));
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
    floatNum(p.x, p.y - 20, `${ch.skill.need - B.gauge[k]}개 더!`, ch.ring);
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
    const r0 = 1 + Math.floor(Math.random() * 5), c0 = 1 + Math.floor(Math.random() * 5);
    for (let i = 0; i < COLS; i++) cells.push([r0, i]);
    for (let i = 0; i < ROWS; i++) if (i !== r0) cells.push([i, c0]);
    B.cd += 2;
    updateCd();
    const p = centerOf($('#countdown'));
    floatNum(p.x, p.y - 16, '+2턴', '#7a7a7a');
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
    spots.forEach(([r, c]) => { const t = B.grid[r][c]; t.special = 'bomb'; refreshTile(t); });
    cells = spots;
  } else if (id === 'cols2') {
    const cs = [0, 1, 2, 3, 4, 5, 6].sort(() => Math.random() - 0.5).slice(0, 2);
    cs.forEach(c => { for (let r = 0; r < ROWS; r++) cells.push([r, c]); });
  } else if (id === 'stall') {
    B.cd += 3;
    updateCd();
    const p = centerOf($('#countdown'));
    floatNum(p.x, p.y - 16, '+3턴', '#4fbf8f');
    const eff = attrMult(ch.attr, curWave().a);
    hitMonster(Math.round(ch.dmg * 4 * eff), ch, false, 0, eff);
    await sleep(400);
  } else if (id === 'cheer') {
    Board.shuffle(B.grid);
    await Promise.all(B.grid.flatMap((row, r) => row.map((t, c) => slide(t, r, c, 420, 'cubic-bezier(.3,1.4,.6,1)'))));
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

async function clearShow() {
  const el = document.createElement('div');
  el.className = 'clear-show';
  const pool = B.team.map(i => CHARS[i]);
  const ch = pool[Math.floor(Math.random() * pool.length)];
  el.innerHTML = `<div class="dim"></div>
    <div class="slam">토벌<br>성공!</div>
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
}
async function feverShow() {
  B.fever = 3;
  updateFever();
  const el = document.createElement('div');
  el.className = 'fever-show';
  el.innerHTML = `<img src="assets/img/art/pajama_uwawa.png"><div class="fever-txt">응원 피버! 공격 ×1.5</div>`;
  app.appendChild(el);
  const [img, txt] = el.children;
  img.animate([{ transform: 'translate(-50%,110%) rotate(4deg)' }, { transform: 'translate(-50%,-6%) rotate(-2deg)', offset: 0.7 }, { transform: 'translate(-50%,0) rotate(0)' }],
    { duration: 320, easing: 'ease-out', fill: 'forwards' });
  txt.animate([{ transform: 'translateX(-50%) scale(0)' }, { transform: 'translateX(-50%) scale(1.15)', offset: 0.7 }, { transform: 'translateX(-50%) scale(1)' }],
    { duration: 260, delay: 160, fill: 'backwards' });
  for (let i = 0; i < 4; i++) setTimeout(() => Sound.pop(4 + i), 120 + i * 90);
  confetti(8);
  await sleep(850);
  img.animate([{ transform: 'translate(-50%,0)' }, { transform: 'translate(-50%,115%)' }], { duration: 220, easing: 'ease-in', fill: 'forwards' });
  await txt.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: 'forwards' }).finished;
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
