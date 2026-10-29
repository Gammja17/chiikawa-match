// 스테이지 에디터 (editor.html): 일상 퍼즐 판을 칠하고, 목표·이동 수를 정하고, 봇으로 재고, 진짜 게임에서 해 보고, spec.js·life.js 모양으로 내보냄
// 만든 판은 이 기기(localStorage)에만 남음. 다른 기기로 옮기려면 '전부 파일로 저장'
// 판 글자는 js/life.js와 같음: # 구멍 . 구슬 w 잡초 W 큰 잡초 b 상자 g 선물 상자 o 거품 l 리본 i 재료 s 시럽
const $ = s => document.querySelector(s);
const ITEM = n => `assets/img/items/${n}.png?v=3`;
const FACE = id => `assets/img/faces/${id}.png`;
const KEY = 'chiikawaEditor.stages', CUR = 'chiikawaEditor.cur';

const BRUSHES = [
  ['.', '구슬'], ['#', '구멍'], ['w', '잡초', 'weed1'], ['W', '큰 잡초', 'weed2'], ['b', '상자', 'box'],
  ['g', '선물 상자', 'gift'], ['o', '거품', 'bubble'], ['l', '리본', 'ribbon'], ['i', '재료', 'naruto'], ['s', '시럽', 'honey'],
];
// 목표: 이름, 아이콘, 판에 있어야 하는 글자
const GOALS = {
  weed: ['잡초', 'weed2', 'wW'], box: ['상자', 'box', 'bg'], bubble: ['거품', 'bubble', 'o'], lock: ['리본', 'ribbon', 'l'],
  syrup: ['시럽', 'pancake', 's'], ing: ['재료', 'ramen', 'i'], char: ['친구 모으기', 'target', ''], score: ['점수', 'medal', ''],
};
const DONE_WORD = { weed: '제초 끝!!', box: '상자 다 뜯었다!', bubble: '거품 싹싹!', ing: '배달 완료!', lock: '리본 풀었다!', syrup: '시럽 듬뿍!', char: '모으기 끝!', score: '목표 달성!' };
const ICONS = [['weed1', '잡초'], ['weed2', '큰 잡초'], ['box', '상자'], ['gift', '선물'], ['bubble', '거품'], ['ribbon', '리본'], ['ramen', '라멘'], ['pot', '냄비'],
  ['pancake', '핫케이크'], ['dango', '경단'], ['bento', '도시락'], ['target', '과녁 (모으기)'], ['medal', '메달 (검정)'], ['bath', '목욕'], ['sparkle', '반짝'],
  ['star', '별'], ['sakura', '벚꽃'], ['plane', '비행기'], ['clock', '시계']];
const INGS = [['naruto', '나루토'], ['egg', '달걀'], ['dango', '경단'], ['onigiri', '주먹밥'], ['donut', '도넛'], ['berry', '딸기'], ['honey', '꿀'], ['candle', '양초'], ['sakura', '벚꽃'], ['star', '별']];
// 봇 기준 깨는 비율 목표 (make.js와 비슷하게: 보통 92→78%, 도전 84→68%, HARD 60→40%의 가운데쯤)
const TARGET = { '': [0.9, '보통'], challenge: [0.8, '도전'], hard: [0.55, 'HARD'] };
// 판 모양 (tools/stages/make.js의 SHAPES와 같음): 칸이 열려 있으면 true
const SHAPES = {
  '네모': () => true,
  '모서리 깎기': (r, c, R, C) => !((r === 0 || r === R - 1) && (c === 0 || c === C - 1)),
  '모서리 둥글게': (r, c, R, C) => { const e = Math.min(c, C - 1 - c), v = Math.min(r, R - 1 - r); return !((v === 0 && e < 2) || (v === 1 && e < 1)); },
  '위만 깎기': (r, c, R, C) => { const e = Math.min(c, C - 1 - c); return !((r === 0 && e < 2) || (r === 1 && e < 1)); },
  '깔때기': (r, c, R, C) => { const b = R - 1 - r, mc = (C - 1) / 2; if (b > 2) return true; const hw = Math.floor((C - 1) / 2) - (3 - b); return Math.abs(c - mc) <= hw + (C % 2 ? 0 : 0.5); },
  '그릇': (r, c, R, C) => { const b = R - 1 - r, mc = (C - 1) / 2; if (b > 1) return true; const hw = Math.floor((C - 1) / 2) - (2 - b); return Math.abs(c - mc) <= hw + (C % 2 ? 0 : 0.5); },
  '팔각': (r, c, R, C) => Math.min(r, R - 1 - r) + Math.min(c, C - 1 - c) >= 2,
  '둥글게': (r, c, R, C) => Math.min(r, R - 1 - r) + Math.min(c, C - 1 - c) >= 1,
  '마름모': (r, c, R, C) => Math.abs(r - (R - 1) / 2) + Math.abs(c - (C - 1) / 2) <= Math.max(R, C) / 2 + 0.6,
  '가운데 구멍': (r, c, R, C) => !(Math.abs(r - (R - 1) / 2) < 0.6 && Math.abs(c - (C - 1) / 2) < (C % 2 ? 0.6 : 1.1)),
  '큰 가운데 구멍': (r, c, R, C) => !(Math.abs(r - (R - 1) / 2) < 1 && Math.abs(c - (C - 1) / 2) < (C % 2 ? 0.6 : 1.1)),
  '위 기둥': (r, c, R, C) => !(r <= 2 && Math.abs(c - (C - 1) / 2) < 0.6),
  '모래시계': (r, c, R, C) => { const d = Math.abs(r - (R - 1) / 2), e = Math.min(c, C - 1 - c); return !(d < 1.6 && e < (d < 0.6 ? 2 : 1)); },
  '아치': (r, c, R, C) => !(r >= R - 2 && Math.abs(c - (C - 1) / 2) < (C % 2 ? 0.6 : 1.1)),
};

// ---------- 게임 데이터 (일꾼이 게임 파일을 읽어서 보내 줌) ----------
const G = { route: [], chars: [], lifeChars: ['chiikawa', 'hachiware', 'usagi', 'momonga', 'kurimanju', 'rakko'], ready: false };
const charName = id => G.chars.find(c => c.id === id)?.name || id;
const charId = name => G.chars.find(c => c.name === name.trim() || c.id === name.trim())?.id;

// ---------- 내가 만든 판들 ----------
const blankMap = (R, C) => Array.from({ length: R }, () => '.'.repeat(C));
function newStage() {
  const map = blankMap(8, 8);
  map[6] = '.w....w.';
  map[7] = 'ww....ww';
  return { id: Date.now().toString(36), name: '새 스테이지', icon: 'weed1', host: 'chiikawa', intro: '잡초를 뽑자!', done: '', types: 5, mode: 'moves', moves: 18, time: 60,
    goals: [{ k: 'weed' }], charId: 'hachiware', charN: 24, scoreN: 9000, ingN: 3, ingKinds: ['naruto', 'egg'], stars: [4000, 6000, 8000], lv: '', memo: '', story: '', after: '', map };
}
let list = [], cur = 0;
try { list = JSON.parse(localStorage.getItem(KEY)) || []; cur = +localStorage.getItem(CUR) || 0; } catch {}
if (!list.length) list = [newStage()];
cur = Math.min(cur, list.length - 1);
const S = () => list[cur];
let saveT = 0;
const save = () => { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(list)); localStorage.setItem(CUR, cur); } catch {} }, 200); };

// 받침이 있으면 a, 없으면 b (잡초이 → 잡초가)
const josa = (w, a, b) => { const c = w.charCodeAt(w.length - 1) - 0xac00; return w + (c >= 0 && c < 11172 && c % 28 ? a : b); };
const toast = msg => { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => (t.hidden = true), 1800); };

// ---------- 게임에 들어가는 모양으로 ----------
function goalsOf(s) {
  return s.goals.map(g => (g.k === 'char' ? { k: 'char', id: s.charId, n: s.charN } : g.k === 'score' ? { k: 'score', n: s.scoreN } : { k: g.k }));
}
function toStage(s) {
  const st = { name: s.name.trim() };
  if (s.done.trim()) st.done = s.done.trim().replace(/\s*\/\s*/g, '<br>');
  st.icon = s.icon;
  st.types = s.types;
  if (s.mode === 'time') st.time = s.time; else st.moves = s.moves;
  st.host = s.host;
  if (s.mode === 'time') st.exam = true;
  st.intro = s.intro.trim();
  st.goals = goalsOf(s);
  st.stars = s.stars.slice();
  if (s.goals.some(g => g.k === 'ing')) st.ing = { n: s.ingN, max: 2, kinds: s.ingKinds.slice() };
  st.map = s.map.slice();
  return st;
}
// 대사: 한 줄에 '친구: 말'
const parseLines = txt => txt.split('\n').map(l => l.trim()).filter(Boolean).map(l => { const i = l.indexOf(':'); return i < 0 ? [null, l] : [charId(l.slice(0, i)), l.slice(i + 1).trim(), l.slice(0, i)]; });

// ---------- 판 칠하기 ----------
const undo = [];
let brush = 'w';
function brushHtml([ch, name, img]) {
  const sw = ch === '.' ? '<span class="sw dot"></span>' : ch === '#' ? '<span class="sw" style="outline:1.5px dashed #e6ddf0;outline-offset:-3px"></span>'
    : ch === 's' ? `<span class="sw" style="background:#f7c76b"><img src="${ITEM(img)}" alt=""></span>` : `<span class="sw"><img src="${ITEM(ch === 'i' ? S().ingKinds[0] || img : img)}" alt=""></span>`;
  return `<button role="radio" data-b="${ch}" class="${ch === brush ? 'on' : ''}" aria-checked="${ch === brush}">${sw}${name}</button>`;
}
function drawBrushes() {
  $('#brushes').innerHTML = BRUSHES.map(brushHtml).join('');
}
$('#brushes').onclick = e => { const b = e.target.closest('[data-b]'); if (!b) return; brush = b.dataset.b; drawBrushes(); };

function cellHtml(ch, ingIdx) {
  const s = S();
  if (ch === '.') return '';
  if (ch === '#') return '';
  if (ch === 'l') return `<img class="face" src="${FACE(G.lifeChars[0])}" alt=""><img class="rib" src="${ITEM('ribbon')}" alt="">`;
  if (ch === 'i') return `<img src="${ITEM(s.ingKinds[ingIdx % s.ingKinds.length] || 'naruto')}" alt="">`;
  if (ch === 's') return `<img src="${ITEM('honey')}" alt="" style="width:50%;height:50%;opacity:.7">`;
  const img = BRUSHES.find(b => b[0] === ch)?.[2];
  return img ? `<img src="${ITEM(img)}" alt="">` : '';
}
const cellCls = ch => 'cell' + (ch === '#' ? ' hole' : ch === '.' ? ' dot' : ch === 's' ? ' syrup' : ch === 'l' ? ' lock' : '');
function drawBoard() {
  const s = S(), R = s.map.length, C = s.map[0].length;
  const room = Math.min($('#board').parentElement.clientWidth - 4, 520);
  const size = Math.max(26, Math.min(48, Math.floor((room - (C - 1) * 2) / C)));
  const el = $('#board');
  el.style.setProperty('--cell', size + 'px');
  el.style.gridTemplateColumns = `repeat(${C}, ${size}px)`;
  let ing = 0, html = '';
  s.map.forEach((row, r) => [...row].forEach((ch, c) => { html += `<div class="${cellCls(ch)}" data-r="${r}" data-c="${c}">${cellHtml(ch, ch === 'i' ? ing++ : 0)}</div>`; }));
  el.innerHTML = html;
  $('#rowsN').textContent = R;
  $('#colsN').textContent = C;
  drawCounts();
}
function drawCounts() {
  const txt = S().map.join(''), n = ch => [...txt].filter(x => x === ch).length;
  const open = txt.length - n('#');
  const parts = [`칸 ${open}`];
  [['w', '잡초'], ['W', '큰 잡초'], ['b', '상자'], ['g', '선물 상자'], ['o', '거품'], ['l', '리본'], ['i', '재료'], ['s', '시럽']].forEach(([ch, name]) => n(ch) && parts.push(`${name} ${n(ch)}`));
  $('#counts').textContent = parts.join(' · ');
}
function setCell(r, c, ch) {
  const s = S(), row = [...s.map[r]];
  if (row[c] === ch) return false;
  row[c] = ch;
  s.map[r] = row.join('');
  return true;
}
let stroke = null;
function paintAt(el) {
  const cell = el?.closest?.('.cell');
  if (!cell || !stroke) return;
  const r = +cell.dataset.r, c = +cell.dataset.c, key = r + ',' + c;
  if (stroke.last === key) return;
  stroke.last = key;
  const C = S().map[0].length;
  let changed = setCell(r, c, stroke.ch);
  if ($('#mirror').checked) changed = setCell(r, C - 1 - c, stroke.ch) || changed;
  if (changed) { stroke.dirty = true; drawBoard(); }
}
$('#board').addEventListener('pointerdown', e => {
  const cell = e.target.closest('.cell');
  if (!cell) return;
  e.preventDefault();
  undo.push(S().map.slice());
  if (undo.length > 60) undo.shift();
  // 이미 그 붓인 칸에서 시작하면 이번 획은 지우개 (구슬로)
  const ch = S().map[+cell.dataset.r][+cell.dataset.c] === brush && brush !== '.' ? '.' : brush;
  stroke = { ch, last: null, dirty: false };
  paintAt(cell);
});
addEventListener('pointermove', e => { if (stroke) paintAt(document.elementFromPoint(e.clientX, e.clientY)); });
const endStroke = () => { if (!stroke) return; if (!stroke.dirty) undo.pop(); else changed(); stroke = null; };
addEventListener('pointerup', endStroke);
addEventListener('pointercancel', endStroke);

$('#btnUndo').onclick = () => { if (!undo.length) return toast('되돌릴 게 없어요'); S().map = undo.pop(); drawBoard(); changed(); };
$('#btnClear').onclick = () => { undo.push(S().map.slice()); S().map = S().map.map(row => row.replace(/[^#]/g, '.')); drawBoard(); changed(); };
$('#shape').innerHTML += Object.keys(SHAPES).map(k => `<option>${k}</option>`).join('');
$('#shape').onchange = e => {
  const f = SHAPES[e.target.value];
  e.target.value = '';
  if (!f) return;
  const s = S(), R = s.map.length, C = s.map[0].length;
  undo.push(s.map.slice());
  s.map = s.map.map((row, r) => [...row].map((ch, c) => (!f(r, c, R, C) ? '#' : ch === '#' ? '.' : ch)).join(''));
  drawBoard();
  changed();
};
// 크기: 줄은 맨 위에서 더하고 빼고(재료가 떨어지는 쪽), 칸은 가운데에서 더하고 빼서 좌우 대칭이 안 깨지게
document.querySelectorAll('[data-size]').forEach(b => (b.onclick = () => {
  const s = S(), R = s.map.length, C = s.map[0].length, d = b.dataset.size;
  const next = d[0] === 'r' ? R + (d[1] === '+' ? 1 : -1) : C + (d[1] === '+' ? 1 : -1);
  if (next < 5 || next > 9) return toast('판은 5~9칸이에요 (보통 7~9)');
  undo.push(s.map.slice());
  if (d === 'r+') s.map.unshift(s.map[0].replace(/[^#]/g, '.'));
  else if (d === 'r-') s.map.shift();
  else {
    const m = Math.floor(C / 2);
    s.map = s.map.map(row => (d === 'c+' ? row.slice(0, m) + row[m] + row.slice(m) : row.slice(0, m) + row.slice(m + 1)));
  }
  drawBoard();
  changed();
}));
addEventListener('resize', () => drawBoard());

// ---------- 스테이지 칸들 ----------
function drawSeg(id, v) { document.querySelectorAll(`#${id} button`).forEach(b => b.classList.toggle('on', b.dataset.v === String(v))); }
function drawFields() {
  const s = S();
  $('#fName').value = s.name;
  $('#fHost').innerHTML = G.chars.map(c => `<option value="${c.id}"${c.id === s.host ? ' selected' : ''}>${c.name}</option>`).join('') || `<option>${s.host}</option>`;
  $('#fIcon').innerHTML = ICONS.map(([id, n]) => `<option value="${id}"${id === s.icon ? ' selected' : ''}>${n}</option>`).join('');
  $('#fIntro').value = s.intro;
  $('#fDone').value = s.done;
  $('#fDone').placeholder = `비우면 '${DONE_WORD[s.goals[0]?.k] || '클리어!'}' (줄바꿈은 /)`;
  $('#fMoves').value = s.moves;
  $('#fTime').value = s.time;
  $('#movesBox').hidden = s.mode !== 'moves';
  $('#timeBox').hidden = s.mode !== 'time';
  drawSeg('fMode', s.mode);
  drawSeg('fTypes', s.types);
  drawSeg('fLv', s.lv);
  [s.stars[0], s.stars[1], s.stars[2]].forEach((v, i) => ($(`#fS${i + 1}`).value = v));
  $('#fMemo').value = s.memo;
  $('#fStory').value = s.story;
  $('#fAfter').value = s.after;
  drawGoals();
}
function drawGoals() {
  const s = S(), on = new Set(s.goals.map(g => g.k));
  $('#goals').innerHTML = Object.entries(GOALS).map(([k, [name, icon]]) =>
    `<button data-g="${k}" class="${on.has(k) ? 'on' : ''}" aria-pressed="${on.has(k)}"><img src="${ITEM(icon)}" alt="">${name}</button>`).join('');
  let more = '';
  if (on.has('char')) {
    more += `<div class="field"><span>모을 친구 (판에 나오는 얼굴 ${s.types}가지 중에서)</span><div class="faces">${G.lifeChars.slice(0, s.types).map(id =>
      `<button data-cid="${id}" class="${id === s.charId ? 'on' : ''}" title="${charName(id)}"><img src="${FACE(id)}" alt="${charName(id)}"></button>`).join('')}</div></div>
      <label class="field"><span>몇 개</span><input id="fCharN" type="number" min="1" max="99" inputmode="numeric" value="${s.charN}"></label>`;
  }
  if (on.has('score')) more += `<label class="field"><span>목표 점수</span><input id="fScoreN" type="number" step="500" inputmode="numeric" value="${s.scoreN}"></label>`;
  if (on.has('ing')) {
    more += `<div class="field"><span>재료 (누른 차례대로 번갈아 나옴)</span><div class="chips">${INGS.map(([id, n]) => {
      const k = s.ingKinds.indexOf(id);
      return `<button data-ing="${id}" class="${k >= 0 ? 'on' : ''}"><img src="${ITEM(id)}" alt="">${n}${k >= 0 ? ` ${k + 1}` : ''}</button>`;
    }).join('')}</div></div>
      <label class="field"><span>내릴 재료 수 (판에 칠한 재료 포함)</span><input id="fIngN" type="number" min="1" max="12" inputmode="numeric" value="${s.ingN}"></label>`;
  }
  $('#goalMore').innerHTML = more;
}
$('#goals').onclick = e => {
  const b = e.target.closest('[data-g]');
  if (!b) return;
  const s = S(), k = b.dataset.g, i = s.goals.findIndex(g => g.k === k);
  if (i >= 0) s.goals.splice(i, 1);
  else if (s.goals.length >= 3) return toast('목표는 화면에 3개까지예요');
  else s.goals.push({ k });
  drawGoals();
  drawFields();
  changed();
};
$('#goalMore').addEventListener('click', e => {
  const s = S(), f = e.target.closest('[data-cid]'), g = e.target.closest('[data-ing]');
  if (f) s.charId = f.dataset.cid;
  else if (g) {
    const id = g.dataset.ing, k = s.ingKinds.indexOf(id);
    if (k >= 0) { if (s.ingKinds.length > 1) s.ingKinds.splice(k, 1); else return toast('재료는 하나 이상'); } else if (s.ingKinds.length >= 3) return toast('재료는 3가지까지'); else s.ingKinds.push(id);
    drawBrushes();
    drawBoard();
  } else return;
  drawGoals();
  changed();
});
$('#goalMore').addEventListener('input', e => {
  const s = S(), v = +e.target.value;
  if (e.target.id === 'fCharN') s.charN = v;
  if (e.target.id === 'fScoreN') s.scoreN = v;
  if (e.target.id === 'fIngN') s.ingN = v;
  changed();
});
const bind = (id, key, num) => $(id).addEventListener('input', e => { S()[key] = num ? +e.target.value : e.target.value; changed(); });
bind('#fName', 'name');
bind('#fHost', 'host');
bind('#fIcon', 'icon');
bind('#fIntro', 'intro');
bind('#fDone', 'done');
bind('#fMoves', 'moves', true);
bind('#fTime', 'time', true);
bind('#fMemo', 'memo');
bind('#fStory', 'story');
bind('#fAfter', 'after');
[1, 2, 3].forEach(i => $(`#fS${i}`).addEventListener('input', e => { S().stars[i - 1] = +e.target.value; changed(); }));
const seg = (id, key, num) => ($(id).onclick = e => {
  const b = e.target.closest('button');
  if (!b) return;
  S()[key] = num ? +b.dataset.v : b.dataset.v;
  drawFields();
  changed();
});
seg('#fMode', 'mode');
seg('#fTypes', 'types', true);
seg('#fLv', 'lv');

// ---------- 점검: tools/stages/check.js와 같은 것 + 게임이 멈추는 것 ----------
function checks(s) {
  const out = [], err = t => out.push(['err', t]), warn = t => out.push(['warn', t]);
  const txt = s.map.join(''), has = chs => [...chs].some(ch => txt.includes(ch)), n = ch => [...txt].filter(x => x === ch).length;
  const on = k => s.goals.some(g => g.k === k);
  if (!s.name.trim()) err('이름이 비어 있어요');
  if (!s.goals.length) err('목표가 없어요');
  for (const g of s.goals) {
    const [name, , chs] = GOALS[g.k];
    if (chs && !has(chs)) err(`${name} 목표인데 판에 ${josa(g.k === 'syrup' ? name + ' 칸' : name, '이', '가')} 없어요`);
  }
  if (has('i') && !on('ing')) err('재료 칸이 있는데 재료 목표가 없어요 (게임이 멈춰요)');
  if (has('s') && !on('syrup')) warn('시럽 칸은 시럽 목표가 있을 때만 깔려요');
  [['weed', 'wW', '잡초'], ['box', 'bg', '상자'], ['bubble', 'o', '거품'], ['lock', 'l', '리본']].forEach(([k, chs, name]) => {
    if (has(chs) && !on(k)) warn(`${josa(name, '이', '가')} 있는데 목표에 없어요 (막는 장애물로만 쓰는 거면 괜찮아요)`);
  });
  if (on('ing')) {
    if (!s.ingKinds.length) err('재료 종류를 골라 주세요');
    if (!(s.ingN > 0)) err('내릴 재료 수가 없어요');
    else if (n('i') > s.ingN) warn(`판에 재료가 ${n('i')}개인데 내릴 수는 ${s.ingN}개예요`);
    if (!has('i')) warn('판에 재료가 없어서 처음엔 위에서 떨어져 내려와요');
  }
  if (on('char')) {
    if (G.lifeChars.indexOf(s.charId) >= s.types) err(`${charName(s.charId)} 얼굴은 얼굴 ${s.types}가지 판엔 안 나와요`);
    if (!(s.charN > 0)) err('모을 친구 수가 없어요');
  }
  if (on('score') && !(s.scoreN > 0)) err('목표 점수가 없어요');
  if (on('score') && s.stars[0] < s.scoreN) warn('별 1 점수가 목표 점수보다 낮아요 (보통 같게 둬요)');
  if (s.mode === 'moves' && !(s.moves > 0)) err('이동 수가 없어요');
  if (s.mode === 'time' && !(s.time > 0)) err('시간이 없어요');
  if (!(s.stars[0] < s.stars[1] && s.stars[1] < s.stars[2])) err('별 점수는 별 1 < 별 2 < 별 3 이어야 해요');
  if (s.intro.trim().length > 14) warn('시작 말이 길면 판 위 글자가 화면 밖으로 나갈 수 있어요 (14자 안쪽 추천)');
  if (txt.length - n('#') < 30) warn('열린 칸이 너무 적어요');
  for (const [txt2, label] of [[s.story, '시작 전 대사'], [s.after, '깼을 때 대사']]) parseLines(txt2).forEach(([id, , who]) => { if (!id) warn(`${label}: '${who ?? '?'}' 친구를 모르겠어요 (친구 이름: 대사)`); });
  const same = G.route.find(x => x.st.name === s.name.trim());
  if (same && same.k !== s.from) warn(`'${s.name.trim()}'${josa(s.name.trim(), '은', '는').slice(-1)} 이미 ${same.k + 1}번 스테이지 이름이에요 (spec.js에선 이름이 겹치면 안 돼요)`);
  // 구멍 모양 때문에 구슬이 못 내려가는 칸: 아주 가끔이면 괜찮고(지금 판들에도 있음), 자주면 판이 멈춤
  if (s.bad && s.bot?.sig === sig(s)) (s.bad / s.bot.runs > 0.1 ? err : warn)(`봇이 해 보니 ${s.bot.runs}판 중 ${s.bad}판에서 구슬이 안 채워지는 칸이 생겼어요${s.bad / s.bot.runs > 0.1 ? '. 구멍 모양을 바꿔 주세요' : ' (가끔이라 괜찮아요)'}`);
  return out;
}
function drawChecks() {
  const out = checks(S());
  $('#checks').innerHTML = out.length ? out.map(([c, t]) => `<li class="${c}">${t}</li>`).join('') : '<li class="ok">문제 없어요</li>';
  $('#btnPlay').disabled = out.some(([c]) => c === 'err');
}

// ---------- 봇으로 재기 ----------
let worker = null, busy = false;
try {
  worker = new Worker('js/editor-worker.js?v=1');
  worker.onerror = () => { $('#botOut').innerHTML = '<p class="muted">봇을 못 불렀어요. 파일을 바로 열지 말고 웹 서버로 열어 주세요 (python -m http.server)</p>'; };
} catch {}
const pct = (a, p) => a[Math.min(a.length - 1, Math.max(0, Math.ceil(p * a.length) - 1))];
const round = (x, s) => Math.round(x / s) * s;
const limitOf = s => (s.mode === 'time' ? s.time / 2.6 : s.moves); // 시간 판은 한 수 2.6초로 셈 (make.js와 같음)
function measure() {
  if (!worker || busy) return;
  const s = S(), bad = checks({ ...s, bad: 0 }).filter(([c]) => c === 'err');
  if (bad.length) return toast('점검에서 빨간 줄부터 고쳐 주세요');
  busy = true;
  $('#btnBot').disabled = true;
  $('#botProg').hidden = false;
  $('#botProg i').style.width = '0';
  const st = toStage(s), runs = +$('#botRuns').value, limit = Math.max(1, Math.floor(limitOf(s)));
  worker.onmessage = ({ data }) => {
    if (data.type === 'progress') $('#botProg i').style.width = `${(100 * data.done) / data.total}%`;
    if (data.type !== 'result') return;
    busy = false;
    $('#btnBot').disabled = false;
    $('#botProg').hidden = true;
    s.bad = data.bad;
    s.bot = { need: data.need, scores: data.scores, limit, runs, at: Date.now(), sig: sig(s) };
    drawBot();
    drawChecks();
    save();
  };
  worker.postMessage({ st, runs, limit });
}
$('#btnBot').onclick = measure;
const sig = s => JSON.stringify([s.map, s.goals, s.types, s.charId, s.charN, s.scoreN, s.ingN, s.ingKinds]); // 판이 바뀌었는지
function drawBot() {
  const s = S(), b = s.bot;
  if (!b) { $('#botOut').innerHTML = ''; return; }
  const need = b.need.slice().sort((x, y) => x - y), ok = need.filter(isFinite);
  const rate = need.filter(x => x <= b.limit).length / need.length;
  const stale = b.sig !== sig(s) ? '<p class="muted">판을 바꿨어요. 다시 재 주세요.</p>' : '';
  const unit = s.mode === 'time' ? '수 (×2.6초)' : '수';
  // 막대: 깨는 데 든 수마다 판 수 (90수 안에 못 깬 판은 따로 셈)
  const lo = ok.length ? ok[0] : 0, hi = ok.length ? ok[ok.length - 1] : 0;
  const bins = [];
  for (let m = lo; m <= hi; m++) bins.push([m, ok.filter(x => x === m).length]);
  const top = Math.max(1, ...bins.map(x => x[1]));
  const markAt = hi > lo ? Math.min(1, Math.max(0, (b.limit - lo + 0.5) / (hi - lo + 1))) : 0.5;
  const fail = need.length - ok.length;
  const tgt = TARGET[s.lv] || TARGET[''];
  const rec = Object.entries(TARGET).map(([lv, [t, name]]) => [lv, name, t, pct(need, t)]);
  let starTxt = '';
  if (b.scores.length) {
    const sc = b.scores.slice().sort((x, y) => x - y), q = p => sc[Math.min(sc.length - 1, Math.floor(p * sc.length))] || 0;
    const sg = s.goals.some(g => g.k === 'score') ? s.scoreN : 0;
    const s1 = sg || Math.max(1000, round(q(0.1), 500)), s2 = Math.max(s1 + 500, round(q(0.4), 500)), s3 = Math.max(s2 + 500, round(q(0.75), 500));
    b.stars = [s1, s2, s3];
    starTxt = `<p>지금 ${s.mode === 'time' ? `${s.time}초` : `이동 ${s.moves}번`}으로 깬 판 점수로 정한 별 점수: <b>${s1} · ${s2} · ${s3}</b></p>
      <div class="rec"><button data-stars>이 별 점수 넣기</button></div>`;
  }
  $('#botOut').innerHTML = `${stale}
    <div class="stats">
      <div class="stat"><b>${Math.round(rate * 100)}%</b><span>지금 ${s.mode === 'time' ? `${s.time}초` : `${s.moves}번`}으로 깸</span></div>
      <div class="stat"><b>${isFinite(pct(need, 0.5)) ? pct(need, 0.5) : '–'}</b><span>절반이 깨는 수</span></div>
      <div class="stat"><b>${isFinite(pct(need, 0.9)) ? pct(need, 0.9) : '–'}</b><span>열에 아홉이 깨는 수</span></div>
    </div>
    <div class="hist" id="hist" aria-label="깨는 데 든 수">${bins.map(([m, c]) => `<div class="bar${m <= b.limit ? ' in' : ''}" data-m="${m}" data-c="${c}" style="height:${(100 * c) / top}%"></div>`).join('')}
      <div class="mark" style="left:${markAt * 100}%"><span>${s.mode === 'time' ? `${s.time}초` : `${b.limit}번`}</span></div></div>
    <div class="hist-axis"><span>${lo}${unit}</span><span>깨는 데 든 ${unit}</span><span>${hi}${unit}</span></div>
    <p class="muted">${b.runs}판 중 ${fail ? `${fail}판은 90수 안에 못 깼어요. ` : ''}진한 막대가 지금 ${s.mode === 'time' ? '시간' : '이동 수'} 안에 깬 판이에요.</p>
    <div class="suggest">
      <p>난이도마다 맞는 ${s.mode === 'time' ? '시간' : '이동 수'} (봇이 이만큼 깨는 지점)</p>
      <div class="rec">${rec.map(([lv, name, t, m]) => `<button data-moves="${m}" class="${lv === s.lv ? 'on' : ''}" ${isFinite(m) ? '' : 'disabled'}>${name} ${Math.round(t * 100)}% → ${isFinite(m) ? (s.mode === 'time' ? `${Math.max(30, round(m * 2.6, 5))}초` : `${m}번`) : '못 깸'}</button>`).join('')}</div>
      ${starTxt}
    </div>`;
  $('#botOut').querySelectorAll('[data-moves]').forEach(x => (x.onclick = () => {
    const m = +x.dataset.moves;
    if (s.mode === 'time') s.time = Math.max(30, round(m * 2.6, 5)); else s.moves = m;
    drawFields();
    changed();
    toast('넣었어요. 별 점수는 다시 재면 맞춰져요');
  }));
  const sb = $('#botOut [data-stars]');
  if (sb) sb.onclick = () => { s.stars = b.stars.slice(); drawFields(); changed(); toast('별 점수를 넣었어요'); };
  // 막대에 손가락·마우스를 올리면 몇 판인지
  const tip = document.createElement('div');
  tip.className = 'tip';
  tip.hidden = true;
  $('#botOut').appendChild(tip);
  const hist = $('#hist');
  const showTip = e => {
    const bar = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('.bar');
    if (!bar || !hist.contains(bar)) { tip.hidden = true; return; }
    tip.textContent = `${bar.dataset.m}수에 깸: ${bar.dataset.c}판`;
    tip.hidden = false;
    tip.style.left = `${Math.min(innerWidth - 120, e.clientX + 10)}px`;
    tip.style.top = `${e.clientY - 34}px`;
  };
  hist.addEventListener('pointermove', showTip);
  hist.addEventListener('pointerdown', showTip);
  hist.addEventListener('pointerleave', () => (tip.hidden = true));
}

// ---------- 테스트 플레이 ----------
$('#btnPlay').onclick = () => {
  try { localStorage.setItem('chiikawaEditor.test', JSON.stringify(toStage(S()))); } catch { return toast('저장 공간이 없어요'); }
  save();
  localStorage.setItem(KEY, JSON.stringify(list));
  location.href = 'index.html?test';
};
function drawLastPlay() {
  let r = null;
  try { r = JSON.parse(localStorage.getItem('chiikawaEditor.result')); } catch {}
  if (!r || r.name !== S().name.trim()) { $('#lastPlay').textContent = ''; return; }
  const ago = Math.round((Date.now() - r.at) / 60000);
  const when = ago < 1 ? '방금' : ago < 60 ? `${ago}분 전` : `${Math.round(ago / 60)}시간 전`;
  $('#lastPlay').textContent = r.clear
    ? `마지막 테스트 (${when}): 클리어, 별 ${r.stars}개, 점수 ${r.score}${r.used != null ? `, ${r.used}번 써서 ${r.left}번 남김` : `, ${r.left}초 남김`}`
    : `마지막 테스트 (${when}): 실패, 목표 ${r.pct}% 남음`;
}

// ---------- 내보내기 ----------
const q = v => `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const lit = v => (Array.isArray(v) ? `[${v.map(lit).join(', ')}]` : v && typeof v === 'object' ? `{ ${Object.entries(v).map(([k, x]) => `${k}: ${lit(x)}`).join(', ')} }` : typeof v === 'string' ? q(v) : String(v));
const memoLines = (s, pad) => (s.memo.trim() ? s.memo.trim().split('\n').map(l => `${pad}// ${l}\n`).join('') : '');
const linesLit = (txt, pad) => `[\n${parseLines(txt).filter(([id]) => id).map(([id, say]) => `${pad}  ${lit([id, say])},`).join('\n')}\n${pad}]`;
let fmt = 'spec';
function exportText() {
  const s = S(), st = toStage(s);
  if (fmt === 'json') return JSON.stringify(s, (k, v) => (k === 'bot' || k === 'bad' ? undefined : v), 1);
  if (fmt === 'life') {
    const head = Object.entries(st).filter(([k]) => !['goals', 'stars', 'ing', 'map'].includes(k)).map(([k, v]) => `${k}: ${lit(v)}`).join(', ');
    let out = memoLines(s, '  ') + `  { ${head},\n    goals: ${lit(st.goals)}, stars: ${lit(st.stars)}${st.ing ? `, ing: ${lit(st.ing)}` : ''},\n    map: ${lit(st.map)} },`;
    if (s.story.trim()) out += `\n  // 시작 전 대사 (LIFE_STORY[이 판 번호]): ${linesLit(s.story, '  ')}`;
    if (s.after.trim()) out += `\n  // 깼을 때 대사 (LIFE_STORY_AFTER[이 판 번호]): ${linesLit(s.after, '  ')}`;
    return out;
  }
  // spec.js: L(이름, 목표, 옵션). map이 있으면 make.js가 판 그림을 그대로 쓰고, 이동 수·별을 지우면 봇이 재서 채움
  const goals = s.goals.map(g => (g.k === 'char' ? `char:${s.charId}` : g.k)).join('+');
  const o = { host: s.host, icon: s.icon, intro: st.intro };
  if (st.done) o.done = st.done;
  if (s.lv) o.lv = s.lv;
  o.types = s.types;
  if (s.mode === 'time') o.time = s.time; else o.moves = s.moves;
  o.stars = st.stars;
  if (s.goals.some(g => g.k === 'char')) o.n = s.charN;
  if (s.goals.some(g => g.k === 'score')) o.score = s.scoreN;
  if (st.ing) { o.ing = st.ing.kinds; o.ingN = st.ing.n; }
  const opts = Object.entries(o).map(([k, v]) => `${k}: ${lit(v)}`).join(', ');
  let out = memoLines(s, '    ') + `    L(${q(st.name)}, ${q(goals)}, { ${opts},\n      map: ${lit(st.map)}`;
  if (s.story.trim()) out += `,\n      story: ${linesLit(s.story, '      ')}`;
  if (s.after.trim()) out += `,\n      after: ${linesLit(s.after, '      ')}`;
  return out + ' }),';
}
const EX_HELP = {
  spec: s => `7~30장 스테이지는 tools/stages/spec.js의 장 목록에 이 줄을 넣고 node tools/stages/make.js 를 돌려요. moves·stars를 지우면 봇이 재서 채워요.${s.from != null ? ` ${s.from + 1}번 스테이지를 불러온 거라면 spec.js에서 같은 이름 줄을 이걸로 바꿔요.` : ''} 폰이면 이 글을 Claude한테 보내서 "몇 장 몇 번째 판을 이걸로 바꿔 줘"라고 하면 돼요.`,
  life: () => '1~6장 스테이지는 js/life.js의 LIFE 목록에 이 모양으로 들어가요. 루트(ROUTE)에 넣는 자리도 정해야 해요.',
  json: () => '이 스테이지 하나를 그대로 담은 글이에요. 다른 기기 에디터에서 … → 파일 열기로 열거나, 여기 붙여 넣어 공유해요.',
};
function drawExport() {
  drawSeg('exFmt', fmt);
  $('#exHelp').textContent = EX_HELP[fmt](S());
  $('#exOut').value = exportText();
}
$('#exFmt').onclick = e => { const b = e.target.closest('button'); if (!b) return; fmt = b.dataset.v; drawExport(); };
$('#btnCopy').onclick = async () => {
  try { await navigator.clipboard.writeText($('#exOut').value); toast('복사했어요'); } catch { $('#exOut').select(); document.execCommand('copy'); toast('복사했어요'); }
};

// ---------- 목록·불러오기·파일 ----------
function drawMine() {
  $('#mine').innerHTML = list.map((s, i) => `<option value="${i}"${i === cur ? ' selected' : ''}>${s.name || '(이름 없음)'}${s.from != null ? ` · ${s.from + 1}번 고침` : ''}</option>`).join('');
}
$('#mine').onchange = e => { cur = +e.target.value; undo.length = 0; drawAll(); save(); };
const add = s => { list.push(s); cur = list.length - 1; undo.length = 0; drawAll(); save(); };
$('#btnNew').onclick = () => add(newStage());
function fromRoute(x) {
  const st = x.st, s = newStage();
  const g = k => st.goals.find(y => y.k === k);
  Object.assign(s, {
    name: st.name, icon: st.icon, host: st.host || 'chiikawa', intro: st.intro || '', done: (st.done || '').replace(/<br>/g, ' / '), types: st.types,
    mode: st.time ? 'time' : 'moves', moves: st.moves || 20, time: st.time || 60, goals: st.goals.map(y => ({ k: y.k })),
    charId: g('char')?.id || s.charId, charN: g('char')?.n || s.charN, scoreN: g('score')?.n || s.scoreN,
    ingN: st.ing?.n || s.ingN, ingKinds: st.ing?.kinds.slice() || s.ingKinds, stars: st.stars.slice(), lv: x.lv || '', map: st.map.slice(), from: x.k,
  });
  return s;
}
const sheet = (title, html) => { $('#sheetTitle').textContent = title; $('#sheetBody').innerHTML = html; $('#sheet').hidden = false; };
$('#sheetX').onclick = () => ($('#sheet').hidden = true);
$('#sheet').onclick = e => { if (e.target.id === 'sheet') $('#sheet').hidden = true; };
$('#btnLoad').onclick = () => {
  if (!G.ready) return toast('게임 데이터를 불러오는 중이에요');
  let html = '<div class="load-list">', chap = '';
  G.route.forEach((x, j) => {
    if (x.chapter !== chap) { chap = x.chapter; html += `<h4>${chap}</h4>`; }
    html += `<button data-j="${j}"><span class="k">${x.k + 1}</span>${x.st.name}${x.lv ? `<span class="lv">${x.lv === 'hard' ? 'HARD' : '도전'}</span>` : ''}</button>`;
  });
  sheet('일상 퍼즐 불러오기 (사본으로 열려요)', html + '</div>');
  $('#sheetBody').onclick = e => { const b = e.target.closest('[data-j]'); if (!b) return; $('#sheet').hidden = true; add(fromRoute(G.route[+b.dataset.j])); toast('불러왔어요. 고쳐도 원래 판은 그대로예요'); };
};
$('#btnMore').onclick = e => { e.stopPropagation(); $('#moreMenu').hidden = !$('#moreMenu').hidden; };
addEventListener('click', () => ($('#moreMenu').hidden = true));
$('#moreMenu').onclick = e => {
  const act = e.target.closest('[data-act]')?.dataset.act;
  if (act === 'copy') add({ ...JSON.parse(JSON.stringify(S())), id: Date.now().toString(36), name: S().name + ' 사본', from: undefined });
  if (act === 'del') {
    if (!confirm(`'${S().name}'${josa(S().name, '을', '를').slice(-1)} 지울까요?`)) return;
    list.splice(cur, 1);
    if (!list.length) list.push(newStage());
    cur = Math.min(cur, list.length - 1);
    drawAll();
    save();
  }
  if (act === 'save') {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(list.map(s => ({ ...s, bot: undefined, bad: undefined })), null, 1)], { type: 'application/json' }));
    a.download = `stages-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  }
  if (act === 'open') $('#fileIn').click();
  if (act === 'help') sheet('쓰는 법', HELP);
};
$('#fileIn').onchange = async e => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  try {
    const got = JSON.parse(await f.text());
    const arr = (Array.isArray(got) ? got : [got]).filter(s => Array.isArray(s?.map) && Array.isArray(s.goals));
    if (!arr.length) return toast('스테이지가 없는 파일이에요');
    arr.forEach(s => list.push({ ...newStage(), ...s, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5) }));
    cur = list.length - 1;
    drawAll();
    save();
    toast(`${arr.length}개 열었어요`);
  } catch { toast('파일을 못 읽었어요'); }
};
const HELP = `<div class="help">
  <ol>
    <li><b>판 칠하기</b>: 아래 붓을 고르고 판을 톡 누르거나 쓱 문질러요. 같은 걸 칠한 칸에서 시작하면 지워져요. '좌우 대칭'이 켜져 있으면 반대쪽도 같이 칠해져요.</li>
    <li><b>판 모양</b>: 구멍(#)은 판 밖이에요. '판 모양 고르기'로 깔때기·마름모 같은 모양을 한 번에 깎을 수 있어요.</li>
    <li><b>목표</b>: 판에 칠한 장애물을 목표로 고르면 그걸 다 없애야 깨요. 목표가 아닌 장애물은 그냥 길을 막아요.</li>
    <li><b>점검</b>: 빨간 줄이 있으면 게임이 멈추거나 못 깨는 판이라 테스트 플레이가 막혀요.</li>
    <li><b>봇으로 재 보기</b>: 자동 플레이 봇이 수백 판 해 봐요. 몇 %가 깨는지 보고 난이도에 맞는 이동 수·별 점수를 넣어요.</li>
    <li><b>테스트 플레이</b>: 진짜 게임 화면에서 해 봐요. 끝나면 '에디터로'를 누르면 돌아와요.</li>
    <li><b>내보내기</b>: 게임에 넣을 글을 복사해요. 폰이면 그대로 Claude한테 보내면 넣어 줘요.</li>
  </ol>
  <p><b>새 기믹</b>(예: 얼음, 체인, 움직이는 장애물)은 코드를 새로 짜야 해서 여기서 바로 칠할 순 없어요. 비슷한 장애물로 자리를 잡아 두고 '기획 메모'에 어떻게 움직이는지 적어 두면, 내보낸 글에 주석으로 같이 가요.</p>
  <p>만든 판은 이 기기 브라우저에만 남아요. 다른 기기로 옮길 땐 … → '전부 파일로 저장'.</p>
</div>`;

// ---------- 다시 그리기 ----------
function changed() {
  save();
  drawCounts();
  drawChecks();
  drawExport();
  drawMine();
  if (S().bot) drawBot();
  drawLastPlay();
}
function drawAll() {
  drawMine();
  drawBrushes();
  drawFields();
  drawBoard();
  drawChecks();
  drawBot();
  drawExport();
  drawLastPlay();
}
drawAll();
if (worker) worker.addEventListener('message', function first({ data }) {
  if (data.type !== 'data') return;
  worker.removeEventListener('message', first);
  Object.assign(G, { route: data.route, chars: data.chars, lifeChars: data.lifeChars, ready: true });
  drawFields();
  drawChecks();
});
