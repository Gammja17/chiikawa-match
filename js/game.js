// 화면, 입력, 전투 연출
const $ = s => document.querySelector(s);
const SLEEPS = new Set(); // 기다리는 중인 sleep (빨리 감기 때 남은 시간을 줄이려고)
const sleep = ms => new Promise(r => { // 빠른 진행이면 기다림도 짧게
  const s = { r, end: performance.now() + ms / Prefs.speed() };
  s.t = setTimeout(() => { SLEEPS.delete(s); r(); }, ms / Prefs.speed());
  SLEEPS.add(s);
});
// 스킬 연출 빨리 감기: 지금 도는 움직임과 기다림을 한꺼번에 몇 배 빠르게
const FastFwd = {
  on(x = 6) {
    if (Prefs.boost !== 1) return;
    Prefs.boost = x;
    document.getAnimations().forEach(a => { try { if (a.effect?.getTiming().iterations !== Infinity) a.updatePlaybackRate(a.playbackRate * x); } catch {} });
    const now = performance.now();
    SLEEPS.forEach(s => { clearTimeout(s.t); s.t = setTimeout(() => { SLEEPS.delete(s); s.r(); }, Math.max(0, s.end - now) / x); });
  },
  off() { Prefs.boost = 1; },
};
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
    if (this.wiped) return; // 초기화 중에는 다시 저장하지 않음
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
  if (typeof Spot !== 'undefined') Spot.close(); // 화면이 바뀌면 떠 있던 안내는 닫음 (안 보이는 버튼을 기다리며 멈추지 않게)
  Prefs.boost = 1; // 혹시 빨리 감기가 남아 있어도 화면이 바뀌면 원래 속도로
  document.querySelector('.skip-hint')?.remove();
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  fitText($('#' + id));
}
// 버튼 글씨가 칸보다 길면 한 줄에 들어갈 때까지 글씨를 줄임
function fitText(root = document) {
  requestAnimationFrame(() => root.querySelectorAll('.big-btn, .mini-btn').forEach(b => {
    b.style.fontSize = '';
    let fs = parseFloat(getComputedStyle(b).fontSize);
    while (b.scrollWidth > b.clientWidth + 1 && fs > 12) b.style.fontSize = --fs + 'px';
  }));
}
function updateMute() {
  document.querySelectorAll('.btn-set').forEach(b => b.classList.toggle('off', Sound.muted)); // 소리를 꺼 두면 ⚙가 흐려짐
  try { localStorage.setItem(SAVE_KEY + '.mute', Sound.muted ? '1' : '0'); } catch {}
  Sound.bgmSync();
}
updateMute();
const updateVib = () => document.querySelectorAll('.btn-vib').forEach(b => b.classList.toggle('off', !Haptic.on));
document.querySelectorAll('.btn-vib').forEach(b => (b.onclick = () => { Haptic.toggle(); updateVib(); Sound.play('click'); }));
updateVib();
window.addEventListener('pointerdown', () => Sound.unlock(), { capture: true });
// 설정: 어디서든 ⚙로 열림. 효과음·배경음악 볼륨, 소리 끄기, 진동, 게임 초기화
function openSettings() {
  const el = $('#settings');
  const sync = () => {
    ['sfx', 'bgm'].forEach(k => { const r = el.querySelector(`[data-s=${k}]`); r.value = Math.round(Sound.vol[k] * 100); r.nextElementSibling.textContent = r.value; });
    el.querySelector('[data-s=mute]').classList.toggle('off', Sound.muted);
    el.querySelector('[data-s=vib]').classList.toggle('off', !Haptic.on);
    // 이 기기 설정: 연출 가볍게, 화면 흔들림, 빠른 진행 (켜진 게 분홍, 꺼진 게 회색)
    el.querySelector('[data-s=light]').classList.toggle('off', !Prefs.d.light);
    el.querySelector('[data-s=shake]').classList.toggle('off', Prefs.d.noShake);
    el.querySelector('[data-s=fast]').classList.toggle('off', !Prefs.d.fast);
    // 테마 색: 기본 분홍 + 가진 친구 색
    const cur = Prefs.d.theme || '';
    el.querySelector('[data-s=theme]').innerHTML = [['', Prefs.THEME_DEFAULT, '기본'], ...CHARS.filter(c => Meta.owned(c.id)).map(c => [c.id, c.ring, c.name])]
      .map(([id, col, name]) => `<button data-t="${id}" class="${id === cur ? 'on' : ''}" style="--c:${col}" title="${name}">${id ? `<img src="${FACE(id)}" alt="">` : ''}</button>`).join('');
    el.querySelectorAll('[data-t]').forEach(b => (b.onclick = () => { Prefs.set('theme', b.dataset.t || null); Sound.play('sparkle', 1.3, 0.6); sync(); }));
  };
  ['sfx', 'bgm'].forEach(k => {
    const r = el.querySelector(`[data-s=${k}]`);
    r.oninput = () => { Sound.setVol(k, r.value / 100); r.nextElementSibling.textContent = r.value; };
    if (k === 'sfx') r.onchange = () => Sound.play('pop'); // 손을 떼면 바뀐 크기로 한 번 들려줌
  });
  el.querySelector('[data-s=mute]').onclick = () => { Sound.muted = !Sound.muted; updateMute(); Sound.play('click'); sync(); };
  el.querySelector('[data-s=vib]').onclick = () => { Haptic.toggle(); updateVib(); Sound.play('click'); sync(); };
  el.querySelector('[data-s=light]').onclick = () => { Prefs.set('light', !Prefs.d.light); Sound.play('click'); sync(); };
  el.querySelector('[data-s=shake]').onclick = () => { Prefs.set('noShake', !Prefs.d.noShake); Sound.play('click'); sync(); shake(6, 260); };
  el.querySelector('[data-s=fast]').onclick = () => { Prefs.set('fast', !Prefs.d.fast); Sound.play('click'); sync(); };
  el.querySelector('[data-s=credits]').onclick = () => {
    Sound.play('click');
    el.classList.remove('show');
    modal({ title: '만든 사람·출처', char: 'hachiware', text: CREDITS, btn1: '닫기', on1: openSettings });
  };
  // 의견 보내기: 별점 + 하고 싶은 말 (js/survey.js)
  el.querySelector('[data-s=feedback]').onclick = () => {
    Sound.play('click');
    el.classList.remove('show');
    if (typeof Net !== 'undefined' && Net.on) Survey.open('settings');
    else modal({ title: '의견 보내기', char: 'hachiware', text: '지금은 서버에 연결이 안 돼서 보낼 수 없어요. 인터넷을 확인해 주세요!', btn1: '닫기', on1: openSettings });
  };
  const close = () => el.classList.remove('show');
  // 게임 초기화: 한 번 더 물어보고, 이 기기 기록(계정에 연결돼 있으면 계정 기록도)을 지우고 처음부터
  el.querySelector('[data-s=reset]').onclick = () => {
    Sound.play('click');
    close();
    modal({
      title: '처음부터 할까요?', char: 'chiikawa', text: '친구, 코인, 깬 스테이지, 집까지 전부 사라져요. 되돌릴 수 없어요.',
      btn2: '취소', on2: openSettings,
      btn1: '초기화',
      on1: async () => {
        Save.wiped = true;
        Life.stopTimer();
        try { localStorage.removeItem(SAVE_KEY); } catch {}
        if (typeof Net !== 'undefined' && Net.on && Net.user) {
          clearTimeout(Net.saveTimer);
          await Net.db.collection('users').doc(Net.user.uid).delete().catch(() => {});
        }
        location.reload();
      },
    });
  };
  el.querySelector('[data-s=close]').onclick = () => { Sound.play('click'); close(); };
  sync();
  el.classList.add('show');
  fitText(el);
  el.querySelector('.modal-card').animate([{ transform: 'scale(.6)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 220, easing: 'cubic-bezier(.3,1.5,.6,1)' });
}
document.querySelectorAll('.btn-set').forEach(b => (b.onclick = () => { Sound.play('click'); openSettings(); }));
// 아이폰에서 빠르게 두 번 누르면 화면이 확대되는 것 막기 (두 번째 탭은 클릭으로 그대로 전달)
let lastTouchEnd = 0;
document.addEventListener('touchend', e => {
  if (e.timeStamp - lastTouchEnd < 350 && e.changedTouches.length === 1) {
    e.preventDefault();
    if (!e.target.closest('#board')) e.target.click?.();
  }
  lastTouchEnd = e.timeStamp;
}, { passive: false });
['gesturestart', 'gesturechange', 'dblclick'].forEach(t => document.addEventListener(t, e => e.preventDefault(), { passive: false }));

// 판과 화면의 위치는 한 프레임에 한 번만 읽음 (터질 때 수백 번 읽으며 화면 배치를 다시 계산하느라 멈칫하던 것)
const RECT = new Map();
let rectReset = 0;
function cachedRect(el) {
  let r = RECT.get(el);
  if (!r) {
    RECT.set(el, (r = el.getBoundingClientRect()));
    if (!rectReset) {
      const clear = () => { RECT.clear(); rectReset = 0; };
      rectReset = requestAnimationFrame(clear);
      setTimeout(clear, 100); // 창이 가려져 프레임이 안 돌 때도 비움
    }
  }
  return r;
}
function rel(rect) {
  const a = cachedRect(app);
  return { x: rect.left - a.left + rect.width / 2, y: rect.top - a.top + rect.height / 2, w: rect.width, h: rect.height };
}
const centerOf = el => rel(cachedRect(el)); // 같은 프레임 안에서는 한 번만 읽음
function tileCenter(r, c) {
  const b = cachedRect(boardEl), a = cachedRect(app);
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
const FX_MAX = 120;
function kp(name, x, y, size, color, frames, opts) {
  if (fx.childElementCount > (Prefs.d.light ? 40 : FX_MAX) || (Prefs.d.light && Math.random() < 0.6)) return Promise.resolve(); // 연출 가볍게: 반짝이 줄임
  const el = addFx('kp', x, y);
  Object.assign(el.style, { width: size + 'px', height: size + 'px', marginLeft: -size / 2 + 'px', marginTop: -size / 2 + 'px' });
  el.style.setProperty('--m', KP(name));
  el.style.setProperty('--c', color);
  return el.animate(frames, opts).finished.then(() => el.remove());
}
// 유료 이펙트: js/king-pack.js(뒤섞은 팩)가 있으면 풀어서 메모리 안에서만 씀. 없으면(깃허브판) Kenney 그림으로 대신함
let KING = false;
const KMASK = {};
{
  const sc = document.createElement('script');
  sc.src = 'js/king-pack.js';
  sc.onload = async () => {
    try {
      const P = window.KING_PACK;
      delete window.KING_PACK;
      const d = Uint8Array.from(atob(P.d), ch => ch.charCodeAt(0));
      let s = P.k;
      for (let i = 0; i < d.length; i++) { s = (Math.imul(s, 1103515245) + 12345) >>> 0; d[i] ^= s >>> 24; }
      const a = new Uint8Array(await new Response(new Blob([d]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
      const W = P.w, n = W * W, cv = document.createElement('canvas');
      cv.width = cv.height = W;
      const ctx = cv.getContext('2d'), img = ctx.createImageData(W, W);
      for (let k = 0; k < P.n.length; k++) {
        for (let i = 0; i < n; i++) { const o = i * 4; img.data[o] = img.data[o + 1] = img.data[o + 2] = 255; img.data[o + 3] = a[k * n + i]; }
        ctx.putImageData(img, 0, 0);
        const b = await new Promise(r => cv.toBlob(r));
        KMASK[P.n[k]] = `url(${URL.createObjectURL(b)})`;
      }
      KING = true;
    } catch (e) { console.warn('이펙트 팩을 못 풀었어요', e); }
  };
  sc.onerror = () => sc.remove();
  document.head.appendChild(sc);
}
const KXU = n => KMASK[n];
function kx(name, alt, x, y, size, color, frames, opts) {
  if (!KING || Prefs.d.light) return kp(alt, x, y, size, color, frames, opts);
  const el = addFx('kp', x, y);
  Object.assign(el.style, { width: size + 'px', height: size + 'px', marginLeft: -size / 2 + 'px', marginTop: -size / 2 + 'px' });
  el.style.setProperty('--m', KXU(name));
  el.style.setProperty('--c', color);
  return el.animate(frames, opts).finished.then(() => el.remove());
}

// 박치기 자국: 날아온 쪽을 향한 만화 효과선 + 별 모양 번쩍 (너무 잦으면 건너뜀)
let impactAt = 0;
function impact(x, y, color, ang = 0, big = false) {
  const now = performance.now();
  if (!big && now - impactAt < 30) return;
  impactAt = now;
  const S = B.S;
  kx(`punch0${1 + Math.floor(Math.random() * 5)}`, 'spark_05', x, y, S * (big ? 2.6 : 1.6), '#ffffff',
    [{ transform: `rotate(${ang}deg) scale(.5)`, opacity: 1 }, { transform: `rotate(${ang}deg) scale(1.2)`, opacity: 0 }], { duration: 210, easing: 'ease-out' });
  kx('explosion02', 'star_09', x, y, S * (big ? 1.7 : 1.05), color,
    [{ transform: 'scale(.3) rotate(0)', opacity: 0.95 }, { transform: 'scale(1) rotate(25deg)', opacity: 0 }], { duration: 250, easing: 'ease-out' });
}

// 얼굴 스티커가 포물선을 그리며 날아가 박치기. 도착하면 onHit
let flyCount = 0;
function flyTile(src, from, to, delay, color, onHit) {
  const S = B.S, im = new Image();
  im.src = src;
  im.className = 'fly-tile';
  Object.assign(im.style, { left: from.x + 'px', top: from.y + 'px', width: S + 'px', height: S + 'px' });
  fx.appendChild(im);
  const dx = to.x - from.x, dy = to.y - from.y;
  const side = (Math.random() - 0.5) * S * 2.2, lift = S * (0.9 + Math.random() * 0.7), spin = Math.sign(side || 1) * (20 + Math.random() * 30);
  const frames = [];
  for (let k = 0; k <= 10; k++) {
    const u = k / 10, arc = Math.sin(Math.PI * u);
    const x = dx * u + side * arc * 0.6, y = dy * u - lift * arc;
    const sc = u < 0.2 ? 1 + u * 1.3 : 1.26 - (u - 0.2) * 0.75;
    frames.push({ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${spin * u}deg) scale(${sc})`, offset: u });
  }
  const dur = 330 + Math.min(260, Math.hypot(dx, dy) * 0.28);
  flyCount++;
  return im.animate(frames, { duration: dur, delay, easing: 'cubic-bezier(.4,0,.85,.6)', fill: 'backwards' }).finished.then(() => {
    flyCount--;
    im.remove();
    impact(to.x, to.y, color, Math.atan2(dy, dx) * 180 / Math.PI + 180);
    onHit?.();
  });
}

// 아이템에 맞은 얼굴: 깨지지 않고 통째로 데굴데굴 튕겨 나감
function knockTile(t, x, y, push, delay) {
  const S = B.S, src = t.inner.querySelector('img')?.src;
  return sleep(delay).then(() => {
    if (!t.el.isConnected) return;
    t.el.remove();
    if (!src) return;
    const im = new Image();
    im.src = src;
    im.className = 'fly-tile';
    Object.assign(im.style, { left: x + 'px', top: y + 'px', width: S + 'px', height: S + 'px' });
    fx.appendChild(im);
    const ddx = x - push.x, ddy = y - push.y, d = Math.hypot(ddx, ddy) || 1;
    const vx = (ddx / d || (Math.random() - 0.5)) * S * (1.1 + Math.random() * 0.9) * push.power, vy = (ddy / d) * S * 0.7 * push.power;
    const up = S * (0.7 + Math.random() * 0.6), fall = S * 3.2, rot = (vx < 0 ? -1 : 1) * (220 + Math.random() * 280);
    const frames = [];
    for (let k = 0; k <= 8; k++) {
      const u = k / 8;
      const px = vx * u, py = vy * u * 0.6 - up * 4 * u * (1 - u) + fall * u * u;
      frames.push({ transform: `translate(calc(-50% + ${px}px), calc(-50% + ${py}px)) rotate(${rot * u}deg) scale(${1 + 0.18 * Math.sin(Math.PI * u) - u * 0.3})`, opacity: u < 0.7 ? 1 : 1 - (u - 0.7) / 0.3, offset: u });
    }
    im.animate(frames, { duration: 600, easing: 'linear' }).finished.then(() => im.remove());
  });
}

// 괴물이 얼굴 박치기를 맞을 때마다 움찔 + 톡 (너무 잦으면 건너뜀)
let peckAt = 0, peckN = 0;
function monsterPeck() {
  const now = performance.now();
  if (now - peckAt < 45) return;
  peckN = now - peckAt > 600 ? 0 : peckN + 1;
  peckAt = now;
  monImg().animate([{ transform: 'scale(1)' }, { transform: `scale(.93,1.06) translate(${(Math.random() - 0.5) * 10}px, 2px)`, filter: 'brightness(1.8)' }, { transform: 'scale(1)' }], { duration: 120 });
  Sound.play('hit' + (1 + (peckN % 3)), 1.15 + Math.min(peckN, 8) * 0.05, 0.35);
  Haptic.tap(6);
}
function chipBump(el) {
  el?.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.28)', filter: 'brightness(1.3)' }, { transform: 'scale(1)' }], { duration: 220, easing: 'ease-out' });
  Sound.play('pop', 1.8, 0.35);
}
// 일상 퍼즐: 목표 칩 (k: weed, box, char …, id: 캐릭터)
function goalChip(k, id) {
  if (B.mode !== 'life') return null;
  return $(`#lhGoals .gchip.${k}${id ? `[data-id="${id}"]` : ''}`);
}
// 그림 하나(장애물 아이콘)를 목표 칩으로 날려 보냄
function flyToGoal(src, p, chip, color = '#ffd84d') {
  if (!chip || flyCount > 18) return;
  flyTile(src, p, centerOf(chip), 0, color, () => chipBump(chip));
}

// 반짝이 별과 불똥이 사방으로 튐
function burst(x, y, color, n = 6) {
  if (fx.childElementCount > 60) n = Math.ceil(n / 2); // 효과가 이미 많으면 반만
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

// '+숫자'(점수·보너스·회복·코인, '+3초')와 몇몇 말은 그림 글자로. 콤보(노랑→분홍)와 헷갈리지 않게 점수 숫자는 하늘→라벤더
const NUM_WORD = { '선물!': 'w_gift' };
function spriteText(text) {
  if (NUM_WORD[text]) return `<img class="w" src="${CIMG(NUM_WORD[text])}">`;
  // 공격 데미지(괴물에게 '123 ▲', 우리 편이 맞으면 '-12'): 하양→장미 빨강 숫자
  const dm = text.match(/^(-?)(\d+)( [▲▼])?$/);
  if (dm) return (dm[1] ? `<img class="mi" src="${CIMG('mminus')}">` : '') + [...dm[2]].map(d => `<img src="${CIMG('m' + d)}">`).join('') + (dm[3] ? `<b class="mk">${dm[3].trim()}</b>` : '');
  if (!/^\+\d+초?$/.test(text)) return null;
  return [...text].map(ch => `<img src="${CIMG(ch === '+' ? 'plus' : ch === '초' ? 'sec' : 'n' + ch)}"${ch === '+' ? ' class="pl"' : ''}>`).join('');
}
function floatNum(x, y, text, color, cls = '') {
  const n = addFx('num ' + cls, x, y);
  const spr = spriteText(text);
  if (spr) { n.classList.add('spr'); n.innerHTML = spr; } else n.textContent = text;
  n.style.setProperty('--c', color);
  return n.animate([
    { transform: 'translate(-50%,-50%) scale(.3)', opacity: 0 },
    { transform: 'translate(-50%,-90%) scale(1.3)', opacity: 1, offset: 0.22 },
    { transform: 'translate(-50%,-110%) scale(1)', opacity: 1, offset: 0.7 },
    { transform: 'translate(-50%,-170%) scale(.9)', opacity: 0 },
  ], { duration: 950, easing: 'ease-out' }).finished.then(() => n.remove());
}

const BANNER_IMG = { '보너스 타임!': 'w_bonus' }; // 그림 글자가 있는 띠 문구
function banner(text, hold = 650) {
  const b = addFx('banner', 0, 0);
  b.style.left = '50%';
  b.style.top = '45%';
  if (BANNER_IMG[text]) { b.classList.add('img'); b.innerHTML = `<img src="${CIMG(BANNER_IMG[text])}" alt="${text}">`; }
  else if (spriteText(text)) { b.classList.add('nums'); b.innerHTML = spriteText(text); }
  else b.textContent = text;
  // 긴 문장은 화면 안에 들어오게 글씨를 줄임
  b.style.fontSize = Math.min(54, Math.floor((app.clientWidth * 0.86) / Math.max(4, [...text].length))) + 'px';
  return b.animate([
    { transform: 'translate(-50%,-50%) scale(0) rotate(-8deg)', opacity: 0 },
    { transform: 'translate(-50%,-50%) scale(1.2) rotate(3deg)', opacity: 1, offset: 0.12 },
    { transform: 'translate(-50%,-50%) scale(1) rotate(0)', opacity: 1, offset: 0.22 },
    { transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: 0.8 },
    { transform: 'translate(-50%,-60%) scale(1.1)', opacity: 0 },
  ], { duration: hold + 400, easing: 'ease-out' }).finished.then(() => b.remove());
}

function shake(power = 6, dur = 300) {
  if (Prefs.d.noShake) return Haptic.tap(Math.min(60, power * 5)); // 화면 흔들림 끄기 (진동은 그대로)
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
    if (Prefs.d.noShake) return;
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

// ---------- 프로필: 닉네임, 구글 연결, 최애 친구 (지도 왼쪽 위 이름표를 누르면 열림) ----------
// 지도에서 다니는 친구: 최애 한 명만 (입은 옷 그대로)
const walkImg = id => { const s = Save.data.outfit?.[id]; return s && SKINS[id]?.[s] ? SKIN(id, s) : portrait(id); };
const favId = () => (Save.data.fav && Meta.owned(Save.data.fav) ? Save.data.fav : 'hachiware');
function mapPartyHtml() {
  return `<img src="${walkImg(favId())}" class="fav" draggable="false">`;
}
const netName = () => (typeof Net !== 'undefined' ? Net.name() : (Save.data.nick || '이름 없는 친구')).replace(/[<>&]/g, '');
const googleOn = () => typeof Net !== 'undefined' && Net.user && !Net.user.isAnonymous;
function profileChip() {
  const b = $('#btnProfile'), fav = CHARS[charIdx(favId())];
  b.style.setProperty('--ring', fav.ring);
  const t = Achieve.title();
  b.innerHTML = `<span class="pf-ava">${Pic.img()}</span><span class="pf-name"><span class="pf-nm">${netName()}</span>${t ? `<small class="pf-title">${t}</small>` : ''}</span>${googleOn() ? '<i class="pf-g" title="구글 연결됨">G</i>' : ''}`;
}
$('#btnProfile').onclick = () => { Sound.play('click'); openProfile(); };
function openProfile() {
  const card = $('#charSheet .sheet-card');
  const draw = () => {
    const fav = CHARS[charIdx(favId())], net = typeof Net !== 'undefined' && Net.on;
    card.style.setProperty('--ring', fav.ring);
    card.innerHTML = `<div class="mates-title">프로필</div>
      <div class="pf-head"><span class="pf-ava big">${Pic.img()}</span>
        <div class="pf-info"><b>${netName()}${Achieve.title() ? `<small class="pf-title">${Achieve.title()}</small>` : ''}</b><button class="mini-btn" data-nick>이름 바꾸기</button></div></div>
      ${net ? (googleOn() ? '<div class="pf-google on">✓ 구글 연결됨 · 진행이 계정에 저장돼요</div>'
        : '<button class="pf-google" data-google>구글로 로그인하고 진행 저장</button>') : ''}
      <div class="sheet-label">최애 친구 <small>지도에서 같이 다녀요 · 랭킹 얼굴도 이 친구</small></div>
      <div class="mates-grid">${CHARS.filter(c => Meta.owned(c.id)).map(c => `<button class="${c.id === fav.id ? 'on' : ''}" data-id="${c.id}" style="--ring:${c.ring}"><img src="${FACE(c.id)}"><span>${c.name}</span></button>`).join('')}</div>
      ${Pic.html()}
      ${Achieve.html()}
      <div class="sheet-btns"><button class="big-btn" data-go>닫기</button></div>`;
    Pic.bind(card, draw);
    Achieve.bind(card, draw);
    card.querySelectorAll('.mates-grid button').forEach(b => (b.onclick = () => {
      Save.data.fav = b.dataset.id;
      Save.save();
      Sound.voice(b.dataset.id, 'pick') || Sound.play('pop', 1.2, 0.5);
      draw();
    }));
    card.querySelector('[data-nick]').onclick = () => {
      const n = prompt('랭킹에 보일 이름 (12자까지)', netName());
      if (!n || !n.trim()) return;
      Save.data.nick = n.trim().slice(0, 12);
      Save.save();
      if (typeof Net !== 'undefined') Net.submit();
      draw();
    };
    card.querySelector('[data-google]')?.addEventListener('click', async () => { Sound.play('click'); await Net.google(); draw(); profileChip(); });
    card.querySelector('[data-go]').onclick = () => {
      Sound.play('click');
      $('#charSheet').classList.remove('show');
      profileChip();
      if ($('#mapParty')) $('#mapParty').innerHTML = mapPartyHtml();
    };
  };
  draw();
  $('#charSheet').classList.add('show');
  fitText($('#charSheet'));
}

// 지도 지역: 30판(3장)마다 다른 그림 (assets/img/map/m1~10.jpg), 판 배경도 같은 지역 풍경 (assets/img/stage/s1~10.jpg)
const MAP_PAGE = 30;
const REGIONS = ['봄 들판', '숲과 고블린 동굴', '비 오는 마을', '여름 바닷가', '별똥별 언덕', '할로윈 밤', '가을 소풍길', '눈 내린 새해', '온천 꽃마을', '키메라 숲과 거인의 성'];
const regionOf = k => Math.min(Math.floor(k / MAP_PAGE), REGIONS.length - 1);
let mapPage = null;
// 판 배경: 지도에서 고른 판만 그 지역 풍경 (오늘의 도전·탑 같은 건 원래 무늬). k는 지도 번호, 없으면 -1
function stageBg(k) {
  const el = $('#battle');
  el.classList.toggle('has-bg', k >= 0);
  el.style.setProperty('--stage-bg', k >= 0 ? `url(${new URL(`assets/img/stage/s${regionOf(k) + 1}.jpg`, location.href)})` : 'none'); // CSS 변수의 주소는 style.css 기준으로 풀려서 절대 주소로
}

function openMap(advanceFrom = null, paging = false) {
  Life.stopTimer();
  show('map');
  Meta.coinUI();
  Hearts.ui();
  if (!paging) Meta.checkDaily();
  const STAGES = ROUTE.map((_, k) => routeStage(k));
  const cur = unlockedIdx(), pages = Math.ceil(STAGES.length / MAP_PAGE);
  // 지도는 30판(3장)씩 한 지역: 위의 ◀ ▶로 넘김. 판을 깨고 오면 지금 판이 있는 지역으로
  if (advanceFrom != null || mapPage == null) mapPage = Math.min(pages - 1, Math.floor(cur / MAP_PAGE));
  if (advanceFrom != null && Math.floor(advanceFrom / MAP_PAGE) !== mapPage) advanceFrom = null; // 새 지역으로 넘어가면 걷는 연출 없이
  const a0 = mapPage * MAP_PAGE, a1 = Math.min(STAGES.length, a0 + MAP_PAGE), r = regionOf(a0);
  $('#mapRegion').textContent = REGIONS[r];
  $('#mapRange').textContent = `스테이지 ${a0 + 1}~${a1}`;
  $('#mapPrev').disabled = mapPage === 0;
  $('#mapNext').disabled = mapPage >= pages - 1 || mapPage > Math.floor(cur / MAP_PAGE); // 지금 지역의 다음 지역까지만 미리 보기
  $('#mapScroll').style.backgroundImage = `url(assets/img/map/m${r + 1}.jpg)`;
  Sound.music('map');
  $('#btnRamen').classList.toggle('on', Save.data.ramen !== false && !Save.data.buff);
  friendsDot();
  rankDot();
  if (!paging) Achieve.check();
  const path = $('#mapPath');
  path.innerHTML = '';
  path.style.height = NODE_TOP + (a1 - a0) * NODE_GAP + 40 + 'px';
  const W = path.clientWidth;
  const pts = STAGES.map((_, i) => ({ x: nodePos(i, W).x, y: nodePos(i - a0, W).y })); // 좌우 굽이는 판 번호대로, 높이는 지역 안에서
  // 길은 20판씩 잘라 그림 (300판이면 3만 px가 넘어서 한 장으로 그리면 폰에서 무거움)
  for (let a = a0; a < a1 - 1; a += 20) {
    const b = Math.min(a1 - 1, a + 20), top = pts[a].y - 20;
    let d = `M${pts[a].x} ${pts[a].y - top}`;
    for (let i = a + 1; i <= b; i++) {
      const p = pts[i - 1], q = pts[i];
      d += ` C${p.x} ${p.y - top + NODE_GAP / 2} ${q.x} ${q.y - top - NODE_GAP / 2} ${q.x} ${q.y - top}`;
    }
    path.insertAdjacentHTML('beforeend',
      `<svg style="top:${top}px;height:${pts[b].y - top + 20}px"><path d="${d}" fill="none" stroke="#fffaf2" stroke-width="14" stroke-linecap="round" opacity=".9"/><path d="${d}" fill="none" stroke="#4b3f3a" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 12" opacity=".45"/></svg>`);
  }

  // 장이 시작되는 자리 위에 띠 ("4장 하치와레의 노래")
  CHAPTERS.forEach(([at, name]) => {
    if (at < a0 || at >= a1) return;
    const b = document.createElement('div');
    b.className = 'chapter-band' + (at > cur ? ' locked' : '');
    b.style.top = pts[at].y - NODE_GAP / 2 + 'px';
    b.textContent = name;
    path.appendChild(b);
  });
  STAGES.forEach((st, i) => {
    if (i < a0 || i >= a1) return;
    const n = document.createElement('button');
    const locked = i > cur;
    const boss = st.waves?.some(w => w.boss);
    const lv = routeLevel(i);
    n.className = 'node' + (locked ? ' locked' : '') + (boss ? ' boss' : '') + (i === cur ? ' current' : '') + (lv ? ' ' + lv : '');
    n.style.left = pts[i].x + 'px';
    n.style.top = pts[i].y + 'px';
    const s = routeStars(i) || 0;
    const icon = st.icon ? ITEM(st.icon) : MONSTERS[st.waves[st.waves.length - 1].m].img;
    const kind = st.exam ? ['exam', 'gradcap'] : st.icon ? ['life', 'plant'] : ['hunt', 'sword']; // 일상·토벌·시험 배지
    n.innerHTML = `<i class="nkind ${kind[0]}"><img src="${ITEM(kind[1])}" alt=""></i>` + (st.host ? `<img class="nhost" src="${FACE(st.host)}" alt="">` : '') + (locked ? LOCK_SVG : `<img class="nicon" src="${icon}" loading="lazy"><span class="nnum">${i + 1}</span>`) +
      (i === cur ? `<span class="nname">${st.name}</span>` : '') +
      (lv && !locked ? `<span class="ntag">${lv === 'hard' ? 'HARD' : '도전'}</span>` : '') +
      (s ? `<span class="nstars">${[0, 1, 2].map(k => `<i class="${k < s ? 'on' : ''}"></i>`).join('')}</span>` : '');
    if (!st.icon) n.classList.add('battle');
    n.onclick = () => {
      if (locked) { Sound.play('bad'); n.animate([{ transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'none' }], { duration: 200 }); return; }
      Sound.play('click');
      Hearts.need(() => go(() => goRoute(i)));
    };
    path.appendChild(n);
  });

  const party = document.createElement('div');
  party.id = 'mapParty';
  party.innerHTML = mapPartyHtml();
  party.onclick = () => { Sound.play('click'); openProfile(); };
  path.appendChild(party);
  profileChip();
  const scroller = $('#mapScroll');
  const inPage = cur >= a0 && cur < a1, goal = pts[inPage ? cur : cur < a0 ? a0 : a1 - 1]; // 지나온 지역은 끝, 앞 지역은 처음을 보여 줌
  party.style.display = inPage ? '' : 'none';
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
  if (!paging) Tutor.mapFlow(advanceFrom != null && advanceFrom !== cur ? 1500 : 950); // 오늘의 용돈 창(0.7초 뒤)이 먼저 뜨고 닫힌 뒤에
}
$('#btnMapHome').onclick = () => { Sound.play('click'); go(() => show('title')); };
$('#mapPrev').onclick = () => { if (mapPage > 0) { Sound.play('click'); mapPage--; openMap(null, true); } };
$('#mapNext').onclick = () => { Sound.play('click'); mapPage++; openMap(null, true); };

// ---------- 스토리 ----------
// 입힌 옷이 있으면 그 그림, 없으면 기본 그림 (대화창·스킬 컷인·결과창)
// 스킬 게이지 요구치: 일상 퍼즐(친구 한 명)은 2.5배, 친구 레벨 1마다 4%씩 줄어듦 (Lv10이면 64%)
const skillNeed = (id, life = B.mode === 'life', lv = Meta.lv(id)) => Math.round(skillOf(id).need * (life ? 2.5 : 1) * (1 - 0.04 * Math.max(0, lv - 1)));
const artOf = id => { const s = Save.data.outfit?.[id]; return s && SKINS[id]?.[s] ? SKIN(id, s) : art(id); };
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
      $('#storyChar').src = artOf(id);
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
// 버튼 글자 속 기호(🏠 ▶ ◀)를 손그림 아이콘으로 (버튼 글은 코드에 적힌 것만 들어옴)
const UI_ICON = { '🏠': 'home', '▶': 'next', '◀': 'back' };
const uiIcons = s => s.replace(/🏠|▶|◀/g, m => `<img class="b-ic" src="assets/img/ui/${UI_ICON[m]}.png" alt="">`);
function modal({ title, stars = null, char, img = null, photo = false, rows = [], text, btn1, on1, btn2 = '', on2 = null }) {
  $('#modalTitle').textContent = title;
  $('#modalChar').src = img || artOf(char);
  $('#modalChar').classList.toggle('photo', photo);
  $('#modalChar').classList.remove('icon');
  $('#modal .modal-card').classList.toggle('has-photo', photo);
  $('#modalRows').innerHTML = rows.map(([k, v]) => `<div>${k}<b>${v}</b></div>`).join('');
  $('#modalText').textContent = text;
  const st = $('#modalStars');
  st.innerHTML = stars == null ? '' : '<span>★</span><span>★</span><span>★</span>';
  st.style.display = stars == null ? 'none' : '';
  const b1 = $('#modalBtn1'), b2 = $('#modalBtn2');
  b1.innerHTML = uiIcons(btn1);
  b2.innerHTML = uiIcons(btn2);
  const close = () => $('#modal').classList.remove('show');
  // 뜨자마자 눌리지 않게 (연출을 넘기던 손가락이 바로 버튼을 누르는 걸 막음)
  const shownAt = performance.now();
  const ready = () => performance.now() - shownAt > 500;
  b1.onclick = () => { if (!ready()) return; Sound.play('click'); close(); on1(); };
  b2.onclick = () => { if (!ready()) return; Sound.play('click'); close(); on2 && on2(); };
  $('#modal').classList.add('show');
  fitText($('#modal'));
  $('#modal .modal-card').animate([{ transform: 'scale(.5)', opacity: 0 }, { transform: 'scale(1.06)', opacity: 1, offset: 0.6 }, { transform: 'scale(1)' }],
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
// ---------- 괴물 여럿: 3장부터 보스가 아닌 첫 웨이브는 2~3마리가 한꺼번에 (각자 카운트다운), 누르면 그 괴물부터 때림 ----------
// B.mons = [{ w: 웨이브 정보, hp, max, cd, el: {img, hp, cd, name, sprite, card} }], B.pick = 고른 괴물 (안 고르면 왼쪽부터)
const GROUP_AT = 20, TRIO_AT = 140; // 모험 지도 21판(3장)부터 둘, 141판(15장)부터 가끔 셋
const aliveMons = () => (B.mons || []).filter(m => m.hp > 0);
const tgt = () => { const al = aliveMons(); return al.includes(B.pick) ? B.pick : al[0] || null; };
Object.defineProperty(B, 'monHp', { get: () => tgt()?.hp ?? 0, set: v => { const m = tgt(); if (m) m.hp = v; } });
Object.defineProperty(B, 'monMax', { get: () => tgt()?.max ?? 1 });
const monImg = () => (tgt() || B.lastMon || B.mons?.[0])?.el.img || $('#monster');
const cdEl = () => (tgt() || B.mons?.[0])?.el.cd || $('#countdown');
// 지금 때리는 괴물의 정보 (속성·공격력 등)
const curWave = () => tgt()?.w || STAGES[B.stage].waves[B.wave];
// 이 웨이브에 나오는 괴물들: 둘이면 체력 55%씩(합 1.1배), 셋이면 38%씩. 공격은 나눠서 약하게, 카운트다운은 1씩 어긋나게
function waveMembers(stage, wv) {
  const w = STAGES[stage].waves[wv], k = routeIdx('b', stage);
  let n = w.group || 0;
  if (!n && !w.boss && wv === 0 && k >= GROUP_AT) n = k >= TRIO_AT && stage % 2 === 0 ? 3 : 2;
  if (n < 2) return [w];
  const others = STAGES[stage].waves.filter(x => !x.boss && x !== w);
  const share = n === 2 ? 0.55 : 0.38, atkK = n === 2 ? 0.6 : 0.45;
  return Array.from({ length: n }, (_, j) => {
    const base = j === 0 ? w : others[j - 1] || { ...w, hue: ((w.hue || 0) + 50 * j) % 360 };
    return { ...base, hp: Math.round(w.hp * share), atk: Math.round(w.atk * atkK), cd: w.cd + j, boss: false };
  });
}
// 괴물 하나 고르기 (다시 누르면 풀기)
function pickMon(m) {
  if (m.hp <= 0 || B.mode !== 'battle') return;
  B.pick = B.pick === m ? null : m;
  Sound.play('pop', 1.3, 0.5);
  m.el.card.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 200 });
  markPick();
  markMatchup();
}
function markPick() {
  const t = tgt(), many = (B.mons || []).length > 1;
  (B.mons || []).forEach(m => { m.el.card.classList.toggle('pick', many && m === t); m.el.card.classList.toggle('chosen', many && m === B.pick); });
}
// 여럿 중 하나가 쓰러짐 (마지막 한 마리는 monsterDefeated가 크게 처리)
function killMon(mon) {
  if (mon.w.boss) Achieve.add('boss');
  const c = centerOf(mon.el.img);
  Sound.play('defeat', 1.25, 0.7);
  burst(c.x, c.y, '#ffcf3f', 10);
  shake(5, 200);
  mon.el.img.animate([
    { transform: 'scale(1) rotate(0)', opacity: 1, filter: 'brightness(2)' },
    { transform: 'scale(.2) rotate(160deg) translateY(-40px)', opacity: 0 },
  ], { duration: 480, easing: 'ease-in', fill: 'forwards' });
  mon.el.card.classList.add('dead');
  if (B.pick === mon) B.pick = null;
  markPick();
  markMatchup();
  updateCd();
}
// 괴물들 카운트다운을 다 같이 늦춤 (방해 스킬)
function delayMons(n) {
  aliveMons().forEach(m => { m.cd += n; m.el.cd.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 300 }); });
  updateCd();
}
// 구슬 type(편성 순번) → 캐릭터
const teamCh = type => CHARS[B.team[type]];
const attrTag = a => `<span class="attr-tag" style="--ac:${ATTR[a].color}">${attrIcon(a)}${ATTR[a].name}</span>`;

function layoutBoard() {
  const w = $('#boardWrap');
  B.S = Math.max(28, Math.floor(Math.min((w.clientWidth - 16) / COLS, (w.clientHeight - 16) / ROWS)));
  app.style.setProperty('--s', B.S + 'px');
  boardEl.style.setProperty('--cols', COLS);
  boardEl.style.setProperty('--rows', ROWS);
  // 판 크기가 바뀌면 칸 바탕을 새로 깖
  if (boardEl.querySelectorAll('.cellbg').length !== ROWS * COLS) boardEl.querySelectorAll('.cellbg, .cellfg').forEach(e => e.remove());
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
  // 시럽은 이웃 시럽 칸과 이어 그림 (꿈의집 꿀처럼 한 덩어리): n-t/r/b/l = 그쪽에 시럽이 이어짐
  const sy = (rr, cc) => inside(rr, cc) && !hole(rr, cc) && Board.syrup?.[rr][cc];
  const join = Board.syrup?.[r][c] ? ' syrup' + (sy(r - 1, c) ? ' n-t' : '') + (sy(r, c + 1) ? ' n-r' : '') + (sy(r + 1, c) ? ' n-b' : '') + (sy(r, c - 1) ? ' n-l' : '') : '';
  return 'cellbg' + (out ? ' void' : '') + (w ? ' weed w' + w : '') + join + (exit ? ' exit' : '');
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
// 거품 칸끼리 한 덩어리로: n-t/r/b/l = 그쪽 이웃도 거품이라 경계 없이 이어 그림 (시럽처럼)
function foamJoin() {
  const g = B.grid;
  if (!g) return;
  const fo = (r, c) => inside(r, c) && g[r][c]?.block === 'bubble';
  Board.each(g, (t, r, c) => {
    if (t?.block !== 'bubble' || !t.inner) return;
    [['n-t', -1, 0], ['n-r', 0, 1], ['n-b', 1, 0], ['n-l', 0, -1]].forEach(([k, dr, dc]) => t.inner.classList.toggle(k, fo(r + dr, c + dc)));
    // 무늬를 판 전체 기준으로 맞춰 칸이 바뀌어도 이어져 보이게
    t.inner.style.backgroundPosition = `${-(c * B.S + (fo(r, c - 1) ? 0 : 1))}px ${-(r * B.S + (fo(r - 1, c) ? 0 : 1))}px`;
  });
}
function refreshTile(t) {
  const inner = t.inner;
  inner.className = 'inner';
  if (t.block) {
    inner.classList.add('block', t.block);
    const img = t.block === 'bubble' ? 'bubble' : t.block === 'weed' ? (t.hp >= 2 ? 'weed2' : 'weed1') : t.hp >= 2 ? 'gift' : 'box';
    inner.innerHTML = `<img src="${ITEM(img)}" draggable="false">`;
    if (t.block === 'bubble') foamJoin();
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
    // 줄폭탄은 랏코 검 하나가 터질 방향으로 누워 있음 (가로: 칼끝이 오른쪽 / 세로: 칼끝이 위)
    inner.innerHTML = sp === 'h' || sp === 'v'
      ? `<i class="axis"></i><img class="sp" src="${ITEM('rocket')}" draggable="false">`
      : `<img src="${ITEM(ITEM_ICON[sp] || sp)}" draggable="false">`;
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
  $('#party').innerHTML = B.team.slice(0, B.real).map(i => CHARS[i]).map(c =>
    `<div class="pm" style="--ring:${c.ring}"><i class="glow"></i><div class="pm-face">${Meta.figure(c.id, FACE(c.id))}</div>${attrIcon(c.attr)}<i class="up"></i><i class="g"><b></b></i></div>`).join('');
  [...$('#party').children].forEach((el, k) => (el.onclick = () => useSkill(k)));
  updateGauges();
}
// 스킬 게이지 칸: 값이 오르면 고리가 톡 부풂 (일상 퍼즐 도우미도 같이 씀)
function setGauge(el, v, ready) {
  if (v > (el._g ?? v) && !ready) el.animate([{ scale: 1 }, { scale: 1.1 }, { scale: 1 }], { duration: 260, easing: 'ease-out' });
  if (ready && !el.classList.contains('ready')) el.animate([{ scale: 1 }, { scale: 1.3 }, { scale: .95 }, { scale: 1 }], { duration: 420, easing: 'cubic-bezier(.3,1.6,.6,1)' });
  el._g = v;
  el.style.setProperty('--g', v);
  el.classList.toggle('ready', ready);
}
function updateGauges() {
  [...$('#party').children].forEach((el, k) => {
    if (!teamCh(k)) return; // 토벌 연출이 늦게 끝나 일상 퍼즐 칸을 만질 때
    const need = skillNeed(teamCh(k).id);
    setGauge(el, Math.min(1, B.gauge[k] / need), B.gauge[k] >= need);
  });
}
// 지금 괴물에게 유리한 친구는 ▲ 표시
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
  $('#teamHp').classList.toggle('low', B.teamHp <= B.teamMax * 0.3);
}
function updateMon() {
  (B.mons || []).forEach(m => {
    const hp = Math.max(0, m.hp);
    m.el.hp.querySelector('.fill').style.width = (hp / m.max) * 100 + '%';
    m.el.hp.querySelector('span').textContent = `${hp} / ${m.max}`;
  });
}
function updateCd() {
  (B.mons || []).forEach(m => {
    m.el.cd.innerHTML = `<b>${Math.max(m.cd, 0)}</b>`;
    m.el.cd.classList.toggle('danger', m.hp > 0 && m.cd <= 1);
  });
}

function spawnMonster(animated) {
  const list = waveMembers(B.stage, B.wave), group = list.length > 1;
  let box = $('#monGroup');
  if (!box) { box = document.createElement('div'); box.id = 'monGroup'; $('#arena').appendChild(box); }
  box.innerHTML = '';
  box.style.display = group ? '' : 'none';
  $('#monsterWrap').style.display = group ? 'none' : '';
  B.pick = null;
  B.lastMon = null;
  B.mons = list.map(w => {
    const M = MONSTERS[w.m];
    let el;
    if (!group) {
      el = { img: $('#monster'), hp: $('#monHp'), cd: $('#countdown'), name: $('#monName'), sprite: $('#monSprite'), card: $('#monsterWrap') };
      el.img.style.maxWidth = w.boss ? '86%' : '70%';
    } else {
      const card = document.createElement('div');
      card.className = 'mon';
      card.innerHTML = '<div class="mon-name"></div><div class="hp"><div class="fill"></div><span></span></div><div class="mon-sprite"><img alt="" draggable="false"></div><div class="mon-cd"></div>';
      box.appendChild(card);
      el = { img: card.querySelector('img'), hp: card.querySelector('.hp'), cd: card.querySelector('.mon-cd'), name: card.querySelector('.mon-name'), sprite: card.querySelector('.mon-sprite'), card };
    }
    el.img.src = M.img;
    el.sprite.style.filter = w.hue ? `hue-rotate(${w.hue}deg) saturate(1.3)` : '';
    const title = w.title ? (w.title.endsWith('·') ? w.title : w.title + ' ') : '';
    el.name.innerHTML = attrIcon(w.a) + (w.boss ? '<img class="crown-ic" src="assets/img/ui/crown.png" alt="">' : '') + (group ? '' : title) + M.name;
    el.name.classList.toggle('boss', !!w.boss);
    el.img.style.opacity = 1;
    const m = { w, hp: w.hp, max: w.hp, cd: w.cd, el };
    if (group) el.card.onclick = () => pickMon(m);
    return m;
  });
  Sound.music(list.some(w => w.boss) ? 'boss' : 'battle'); // 보스가 나오면 곡이 바뀜
  const nw = STAGES[B.stage].waves.length;
  $('#waveInfo').innerHTML = nw > 1 ? Array.from({ length: nw }, (_, k) => `<i class="${k <= B.wave ? 'on' : ''}"></i>`).join('') : '';
  markMatchup();
  markPick();
  updateMon();
  updateCd();
  if (animated) {
    Sound.play('wave');
    B.mons.forEach((m, j) => m.el.img.animate([
      { transform: 'translateY(-220px) scale(.6)', opacity: 0 },
      { transform: 'translateY(0) scale(1.15,.85)', opacity: 1, offset: 0.6 },
      { transform: 'translateY(-14px) scale(.95,1.05)', offset: 0.8 },
      { transform: 'translateY(0) scale(1)' },
    ], { duration: 600, delay: j * 120, easing: 'ease-out', fill: 'backwards' }));
  }
  if (group && !Tutor.seen('monGroup')) setTimeout(() => {
    if (B.mode !== 'battle' || B.over) return;
    Tutor.mark('monGroup');
    Spot.show(box, '괴물이 여럿이면 왼쪽부터 때려. 괴물을 톡 누르면 그 괴물부터! 숫자는 괴물마다 따로 줄어');
  }, animated ? 900 : 1600);
}

async function startStage(i) {
  B.mode = 'battle';
  app.classList.remove('life-mode', 'tower-mode');
  stageBg(routeIdx('b', i));
  Board.setSize(7, 7);
  B.grid = null; // 앞 판(크기가 다를 수 있음)은 버림
  Board.floor = null;
  Board.syrup = null;
  Board.mask = null;
  Board.spawnIng = null;
  B.stage = i; B.wave = 0; B.over = false; B.busy = true; B.inSkill = false; B.sel = null; B.pending = [];
  const bowl = Ramen.takeBattle(); // 먹고 온 라멘
  B.teamHp = B.teamMax = bowl && (bowl.id === 'hp' || bowl.id === 'okinawa') ? 150 : 120;
  B.fever = 0;
  B.rally = 0;
  B.cont = false; // 이어하기는 스테이지마다 한 번
  B.maxCombo = 0;
  Debuff.reset(); // 괴물이 건 잠·독·어둠은 새 판에서 다 풀림
  updateFever();
  // 편성이 5명보다 적으면 빈자리는 응원 친구 구슬로 채움 (공격 절반, 스킬 없음)
  B.squad = B.squad || B.team.slice();
  B.real = B.squad.length;
  const cheer = [...LIFE_CHARS, ...CHARS.map(c => c.id)].map(id => CHARS.findIndex(c => c.id === id)).filter((k, j, a) => k >= 0 && a.indexOf(k) === j && !B.squad.includes(k));
  B.team = [...B.squad, ...cheer.slice(0, Math.max(0, TEAM_SIZE - B.real))];
  B.dmgBy = {};
  B.played = false;
  NTYPES = B.team.length;
  B.gauge = B.team.map((k, j) => (j < B.real && bowl && (bowl.id === 'gauge' || bowl.id === 'okinawa') ? Math.floor(skillNeed(CHARS[k].id, false) / 2) : 0));
  show('battle');
  stageTitle(routeIdx('b', i), STAGES[i].name);
  buildParty();
  layoutBoard();
  boardEl.querySelectorAll('.tile').forEach(e => e.remove());
  fx.innerHTML = '';
  B.grid = Board.create();
  spawnMonster(false);
  updateTeam();
  if (STORY[i] && Save.data.stars[i] == null) await playStory(STORY[i]);
  await dropIn(routeLevel(routeIdx('b', i)) === 'hard' ? 'HARD!' : '토벌 시작!');
  if (bowl) banner(`${bowl.name}!`, 500);
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

// 스테이지 제목 + 난이도 딱지
function stageTitle(k, name) {
  const lv = k >= 0 ? routeLevel(k) : '';
  $('#stageName').innerHTML = (lv ? `<b class="lvtag ${lv}">${lv === 'hard' ? 'HARD' : '도전'}</b>` : '') + (k >= 0 ? `${k + 1}. ` : '') + name;
  app.classList.toggle('hard-stage', lv === 'hard');
}

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
// 일시정지: 계속하기, 설정, 나가기 (모험 지도 스테이지를 하다 나가면 하트 하나)
const leaveTo = () => (B.mode === 'life' && L.run && L.run.kind !== 'route' ? openChallenge : openMap);
const inRoute = () => B.mode === 'battle' || L.run?.kind === 'route';
$('#btnBack').onclick = () => {
  Sound.play('click');
  if (B.over) { Life.stopTimer(); go(leaveTo()); return; }
  if ($('#modal').classList.contains('show') || $('#story').classList.contains('show')) return;
  Life.stopTimer();
  const costs = inRoute() && B.played;
  const el = $('#pause');
  el.querySelector('.p-warn').textContent = costs ? '지금 나가면 하트가 하나 줄어요' : '';
  el.classList.add('show');
  fitText(el);
  el.querySelector('.modal-card').animate([{ transform: 'scale(.6)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 220, easing: 'cubic-bezier(.3,1.5,.6,1)' });
  const close = () => el.classList.remove('show');
  el.querySelector('[data-p=resume]').onclick = () => {
    Sound.play('click');
    close();
    if (B.mode === 'life' && L.st?.time && !B.over) Life.runTimer();
  };
  el.querySelector('[data-p=settings]').onclick = () => { Sound.play('click'); openSettings(); };
  el.querySelector('[data-p=quit]').onclick = () => {
    Sound.play('click');
    close();
    if (costs) Hearts.lose();
    B.over = true;
    go(leaveTo());
  };
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
  B.played = true;
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
  if (combo) { await mergeFx(ta, tb, b); await comboFx(combo); }
  await cascade([a, b], combo ? combo.cells : items, combo);
  await endTurn();
  if (!B.over) { B.busy = false; if (!Tutor.lesson()) setTimeout(autoSkill, 300); }
}

// 아이템 하나를 제자리에서 터뜨림 (한 턴 씀)
async function activate([r, c]) {
  const t = B.grid[r][c];
  if (B.busy || B.over || !t?.special || (Tutor.guide && !Tutor.allowItem([r, c]))) return;
  Haptic.tap(25);
  B.busy = true;
  B.played = true;
  clearSel();
  Sound.play('click', 1.6, 0.5);
  await t.inner.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1.1)' }], { duration: 140, easing: 'ease-out' }).finished;
  await cascade(null, [[r, c]]);
  await endTurn();
  if (!B.over) { B.busy = false; if (!Tutor.lesson()) setTimeout(autoSkill, 300); }
}

const settleAll = dur => {
  const ps = [];
  Board.each(B.grid, (t, r, c) => ps.push(slide(t, r, c, dur, 'cubic-bezier(.3,1.4,.6,1)')));
  return Promise.all(ps);
};

// ---------- 콤보: 연쇄가 이어지는 동안 한 덩어리로 쾅쾅 커지고, 끝나면 톡 튀어 사라짐 ----------
// 콤보 글자는 그림으로 (숫자 + '콤보' + 칭찬 한마디)
const CIMG = n => `assets/img/combo/${n}.png`;
const COMBO_WORDS = ['', '', 'w_good', 'w_nice', 'w_great', 'w_amazing'];
const Combo = {
  el: null,
  show(n) {
    const col = `hsl(${(n * 47) % 360} 75% 58%)`, s = 1 + Math.min(n, 8) * 0.08;
    if (!this.el) {
      const b = cachedRect(boardEl), a = cachedRect(app);
      this.el = addFx('combo', b.left - a.left + b.width / 2, b.top - a.top + b.height * 0.28);
      this.el.innerHTML = `<i class="rays"></i><div class="crow"><span class="cnum"></span><img class="cword" src="${CIMG('w_combo')}"></div><img class="cpraise">`;
    }
    const el = this.el;
    el.style.setProperty('--hue', col);
    el.style.setProperty('--rs', 0.8 + Math.min(n, 8) * 0.15); // 뒤 햇살 크기
    el.querySelector('.cnum').innerHTML = String(n).split('').map(d => `<img src="${CIMG('d' + d)}">`).join('');
    const w = COMBO_WORDS[n] ?? 'w_best', pr = el.querySelector('.cpraise');
    pr.hidden = !w;
    if (w) pr.src = CIMG(w);
    el.animate([
      { transform: `translate(-50%,-50%) scale(${s * 1.5}) rotate(${n % 2 ? -8 : 8}deg)` },
      { transform: `translate(-50%,-50%) scale(${s * 0.9}) rotate(0)`, offset: 0.55 },
      { transform: `translate(-50%,-50%) scale(${s})` },
    ], { duration: 320, easing: 'ease-out', fill: 'forwards' });
    // 콤보 3부터: 숫자에서 반짝이가 터지고 판 테두리가 콤보 색으로 번쩍
    if (n >= 3) {
      const p = centerOf(el);
      burst(p.x, p.y, col, 6 + Math.min(n, 8));
      const b = cachedRect(boardEl), a = cachedRect(app), glow = addFx('board-glow', b.left - a.left, b.top - a.top);
      Object.assign(glow.style, { width: b.width + 'px', height: b.height + 'px', boxShadow: `0 0 0 7px ${col}, 0 0 22px 6px ${col}` });
      glow.animate([{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 0 }], { duration: 460, easing: 'ease-out' }).finished.then(() => glow.remove()); // 투명도만 움직여서 가벼움
    }
  },
  end() {
    const el = this.el;
    if (!el) return;
    this.el = null;
    el.animate([{ opacity: 1 }, { transform: 'translate(-50%,-80%) scale(1.15)', opacity: 1, offset: 0.35 }, { transform: 'translate(-50%,-130%) scale(.7)', opacity: 0 }],
      { duration: 420, easing: 'ease-in', fill: 'forwards' }).finished.then(() => el.remove());
  },
};

// ---------- 연쇄 ----------
async function cascade(swapped, forced, origin = null, depth = 0) {
  let combo = 0;
  for (;;) {
    const res = Board.resolve(B.grid, combo === 0 ? swapped : null, combo === 0 ? forced : []);
    if (!res) break;
    combo++;
    B.maxCombo = Math.max(B.maxCombo || 0, combo);
    Achieve.best('combo', combo);
    if (combo === 5) Daily.add('combo5');
    if (combo === 5 && !B.fever) await feverShow();
    await stepFx(res, combo, combo === 1 ? origin : null);
    await fall(Board.gravity(B.grid));
    if (B.mode === 'life') await Life.collect();
  }
  Combo.end();
  if (B.mode === 'life' && L.feverGift) { L.feverGift = false; await Life.feverGift(); } // 피버 첫 턴 선물
  if (!Board.hasMove(B.grid)) {
    await banner('섞는 중…', 400);
    Board.shuffle(B.grid);
    await settleAll(380);
    // 섞고 또 섞어도 끝이 안 나는 판(장애물이 너무 많을 때)이 멈추지 않게 몇 번까지만
    if (Board.findRuns(B.grid).length && depth < 4) await cascade(null, [], null, depth + 1);
    else if (!Board.hasMove(B.grid)) {
      // 그래도 둘 곳이 없으면 경단 하나를 선물 (톡 누르면 터짐)
      const spots = [];
      Board.each(B.grid, t => { if (t.type >= 0 && !t.special && movable(t)) spots.push(t); });
      const t = spots[Math.floor(Math.random() * spots.length)];
      if (t) { t.special = 'rainbow'; t.type = -1; refreshTile(t); }
    }
  }
}

// 아이템 합체: 두 아이템이 한 칸으로 빨려 들어가 빙글 돌며 번쩍
async function mergeFx(ta, tb, at) {
  const p = tileCenter(at[0], at[1]);
  Sound.play('special', 0.8, 0.8);
  Haptic.tap(20);
  tb.el.style.zIndex = 5;
  const spin = [{ transform: 'scale(1) rotate(0)' }, { transform: 'scale(1.35) rotate(200deg)', offset: 0.7 }, { transform: 'scale(1.6) rotate(360deg)', filter: 'brightness(2)' }];
  slide(tb, at[0], at[1], 220, 'cubic-bezier(.5,0,.4,1)');
  ta.inner.animate(spin, { duration: 380, easing: 'ease-in', fill: 'forwards' });
  tb.inner.animate(spin, { duration: 380, easing: 'ease-in', fill: 'forwards' });
  kp('twirl_01', p.x, p.y, B.S * 2.6, '#ffe680', [{ transform: 'scale(1.3) rotate(0)', opacity: 0 }, { transform: 'scale(.5) rotate(-300deg)', opacity: 1 }], { duration: 380, easing: 'ease-in' });
  await sleep(380);
  kp('flare_01', p.x, p.y, B.S * 4, '#ffffff', [{ transform: 'scale(.3)', opacity: 1 }, { transform: 'scale(1.3)', opacity: 0 }], { duration: 320 });
}

// 합체 아이템 그림: 합친 자리에서 크게 튀어나왔다가 사라짐 (글자 대신)
const COMBO_ART = { rainbow: 'dango_any', rainbow2: 'dango_dango', 'bomb+bomb': 'bomb_bomb', 'bomb+h': 'bomb_sword', 'bomb+v': 'bomb_sword',
  'h+h': 'sword_sword', 'h+v': 'sword_sword', 'v+v': 'sword_sword', 'plane+plane': 'plane_plane', 'bomb+plane': 'bomb_plane', 'h+plane': 'sword_plane', 'plane+v': 'sword_plane' };
[...Object.values(COMBO_ART), 'w_combo', 'w_good', 'w_nice', 'w_great', 'w_amazing', 'w_best', ...'0123456789'.split('').map(d => 'd' + d)]
  .forEach(n => (new Image().src = CIMG(n)));
function comboArt(kind, p) {
  const el = addFx('combo-art', p.x, p.y);
  el.style.width = B.S * 2.6 + 'px';
  el.innerHTML = `<img src="${CIMG(COMBO_ART[kind] || 'sword_sword')}">`;
  el.animate([
    { transform: 'translate(-50%,-50%) scale(.2) rotate(-25deg)', opacity: 0 },
    { transform: 'translate(-50%,-50%) scale(1.25) rotate(6deg)', opacity: 1, offset: 0.25 },
    { transform: 'translate(-50%,-50%) scale(1) rotate(0)', opacity: 1, offset: 0.4 },
    { transform: 'translate(-50%,-50%) scale(1.04) rotate(0)', opacity: 1, offset: 0.75 },
    { transform: 'translate(-50%,-50%) scale(1.5)', opacity: 0 },
  ], { duration: 900, easing: 'ease-out' }).finished.then(() => el.remove());
}

async function comboFx(combo) {
  const [r, c] = combo.at;
  const p = tileCenter(r, c);
  Juice.zoom(p.x, p.y, combo.kind.startsWith('rainbow') || combo.kind === 'bomb+bomb' ? 1.12 : 1.07);
  if (combo.converted) Board.each(B.grid, t => t.special && refreshTile(t));
  Sound.play(combo.kind.startsWith('rainbow') ? 'rainbow' : 'special', 1);
  flash('#fff6a8', 0.5);
  shake(8, 350);
  const ring = addFx('ring', p.x, p.y);
  ring.animate([{ width: '0px', height: '0px', opacity: 1 }, { width: B.S * 8 + 'px', height: B.S * 8 + 'px', opacity: 0 }], { duration: 500, easing: 'ease-out' }).finished.then(() => ring.remove());
  comboArt(combo.kind, p);
  await sleep(250);
  if (combo.planes) {
    await Promise.all(combo.planes.map(tg => planeFly(p, tileCenter(tg[0], tg[1]), combo.carry, 620)));
    combo.planes.forEach(([tr, tc]) => (combo.carry ? effectFx({ kind: combo.carry, r: tr, c: tc }) : burst(tileCenter(tr, tc).x, tileCenter(tr, tc).y, '#bff3ff', 8)));
  }
}

// 비행기가 목표 칸으로 활처럼 날아감 (carry: 싣고 가는 아이템), 반짝이 꼬리
function planeFly(from, to, carry = null, dur = 600) {
  Sound.play('swap', 0.75, 0.8);
  const el = addFx('plane-fly', from.x, from.y);
  el.style.width = el.style.height = B.S * 1.25 + 'px';
  el.innerHTML = `<img src="${ITEM('plane')}">` + (carry ? `<img class="carry" src="${ITEM(ITEM_ICON[carry] || carry)}">` : '');
  const dx = to.x - from.x, dy = to.y - from.y;
  const lift = Math.max(80, Math.hypot(dx, dy) * 0.45);
  const pt = t => [dx * t, dy * t - lift * 4 * t * (1 - t)];
  const frames = [];
  for (let k = 0; k <= 12; k++) {
    const t = k / 12, [x, y] = pt(t), [x2, y2] = pt(Math.min(1, t + 0.05));
    const ang = Math.atan2(y2 - y, x2 - x) * 180 / Math.PI + 30; // 그림이 오른쪽 위를 봄
    const sc = 0.8 + Math.sin(t * Math.PI) * 0.5;
    frames.push({ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${ang}deg) scale(${sc})`, offset: t });
  }
  for (let k = 1; k < 10; k++) setTimeout(() => {
    const [x, y] = pt(k / 10);
    kp('star_06', from.x + x, from.y + y, B.S * 0.6, '#ffffff', [{ transform: 'scale(1)', opacity: 0.9 }, { transform: 'scale(0)', opacity: 0 }], { duration: 400 });
  }, (dur * k) / 10);
  return el.animate(frames, { duration: dur, easing: 'ease-in-out' }).finished.then(() => el.remove());
}

// 터지고 난 뒤 여운: 연기, 떠오르는 불씨, 남은 빛줄기
function afterFx(ef) {
  const S = B.S, o = tileCenter(ef.r, ef.c);
  const embers = (x, y, color, n) => { for (let k = 0; k < n; k++) {
    const dx = (Math.random() - 0.5) * S * 2.4, up = S * (0.8 + Math.random());
    kp('star_06', x + dx * 0.3, y, S * (0.3 + Math.random() * 0.3), color, [{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${dx}px, ${-up}px) scale(0)`, opacity: 0 }], { duration: 700 + Math.random() * 400, delay: k * 40, easing: 'ease-out' });
  } };
  if (ef.kind === 'bomb') {
    kp('smoke_04', o.x, o.y - S * 0.3, S * 2.6, '#d9cfc2', [{ transform: 'translateY(0) scale(.6)', opacity: 0.7 }, { transform: `translateY(${-S}px) scale(1.4)`, opacity: 0 }], { duration: 1000, easing: 'ease-out' });
    embers(o.x, o.y, '#ffb347', 8);
  } else if (ef.kind === 'h' || ef.kind === 'v') {
    const b = cachedRect(boardEl), a = cachedRect(app), horiz = ef.kind === 'h';
    const line = addFx('afterline' + (horiz ? '' : ' v'), horiz ? b.left - a.left : o.x, horiz ? o.y : b.top - a.top);
    Object.assign(line.style, horiz ? { width: b.width + 'px' } : { height: b.height + 'px' });
    line.animate([{ opacity: 0.9 }, { opacity: 0 }], { duration: 500, easing: 'ease-out' }).finished.then(() => line.remove());
    for (let k = 0; k < 7; k++) { const x = horiz ? b.left - a.left + (k + 0.5) * S : o.x, y = horiz ? o.y : b.top - a.top + (k + 0.5) * S; embers(x, y, '#bfe9ff', 1); }
  } else if (ef.kind === 'rainbow') {
    const b = cachedRect(boardEl), a = cachedRect(app);
    const colors = ['#ff8ab8', '#ffd84d', '#7cc4ec', '#a6d96a', '#b99cf0'];
    for (let k = 0; k < 14; k++) embers(b.left - a.left + Math.random() * b.width, b.top - a.top + Math.random() * b.height, colors[k % 5], 1);
  } else if (ef.kind === 'plane' && ef.target) {
    const t = tileCenter(ef.target[0], ef.target[1]);
    kp('smoke_04', t.x, t.y, S * 1.8, '#e3eef7', [{ transform: 'scale(.5)', opacity: 0.7 }, { transform: 'scale(1.3)', opacity: 0 }], { duration: 700 });
    embers(t.x, t.y, '#bff3ff', 5);
  }
}

// 빛줄기: from에서 to까지 쭉 뻗었다가 사라짐 (무지개)
function beamTo(from, to, color, delay = 0) {
  const el = addFx('ray', from.x, from.y);
  const dx = to.x - from.x, dy = to.y - from.y;
  Object.assign(el.style, { width: Math.hypot(dx, dy) + 'px', transform: `rotate(${Math.atan2(dy, dx)}rad)` });
  el.style.setProperty('--c', color);
  el.animate([{ clipPath: 'inset(0 100% 0 0)', opacity: 1 }, { clipPath: 'inset(0 0 0 0)', opacity: 1, offset: 0.5 }, { clipPath: 'inset(0 0 0 0)', opacity: 0 }],
    { duration: 300, delay, fill: 'backwards' }).finished.then(() => el.remove());
}

// 아이템 발동 연출 (ef.base 시각에 불림, 칸이 터지는 시각은 ef.times)
function effectFx(ef) {
  const S = B.S, o = tileCenter(ef.r, ef.c), inner = ef.tile?.inner;
  if (ef.kind === 'h' || ef.kind === 'v') {
    const horiz = ef.kind === 'h';
    // 로켓이 부르르 → 양쪽 끝으로 쓩. 지나가는 칸이 차례로 터짐
    inner?.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25) rotate(-6deg)' }, { transform: 'scale(1.25) rotate(6deg)' }], { duration: FUSE.h });
    setTimeout(() => {
      Sound.play('line', 1.1, 0.8);
      kp('flare_01', o.x, o.y, S * 2.8, '#ffffff', [{ transform: 'scale(.3)', opacity: 1 }, { transform: 'scale(1.2)', opacity: 0 }], { duration: 300, easing: 'ease-out' });
      kx('poof2', 'circle_05', o.x, o.y, S * 2.4, '#bfe9ff', [{ transform: 'scale(.3)', opacity: 1 }, { transform: 'scale(1.15)', opacity: 0 }], { duration: 260, easing: 'ease-out' });
      Juice.stop(40);
      const cells = horiz ? COLS : ROWS, from = horiz ? ef.c : ef.r;
      [-1, 1].forEach(dir => {
        const im = new Image();
        im.src = ITEM('rocket');
        im.className = 'fximg';
        Object.assign(im.style, { left: o.x + 'px', top: o.y + 'px', width: S * 0.95 + 'px', zIndex: 3 });
        fx.appendChild(im);
        const steps = dir > 0 ? cells - from + 0.5 : from + 1.5;
        const dist = steps * S * dir;
        const rot = horiz ? (dir > 0 ? 45 : -135) : (dir > 0 ? 135 : -45);
        // 로켓 뒤로 하얀 꼬리가 쭉 그어졌다가 사라짐
        const tr = addFx('rtrail', o.x, o.y), len = Math.abs(dist);
        Object.assign(tr.style, horiz
          ? { width: len + 'px', height: S * 0.42 + 'px', marginTop: -S * 0.21 + 'px', marginLeft: dir > 0 ? '0px' : -len + 'px', transformOrigin: dir > 0 ? 'left center' : 'right center' }
          : { height: len + 'px', width: S * 0.42 + 'px', marginLeft: -S * 0.21 + 'px', marginTop: dir > 0 ? '0px' : -len + 'px', transformOrigin: dir > 0 ? 'center top' : 'center bottom' });
        if (!horiz) tr.classList.add('v');
        const sc = horiz ? 'scaleX' : 'scaleY';
        tr.animate([{ transform: `${sc}(0)`, opacity: 1 }, { transform: `${sc}(1)`, opacity: 1, offset: 0.55 }, { transform: `${sc}(1) ${horiz ? 'scaleY' : 'scaleX'}(.2)`, opacity: 0 }],
          { duration: steps * 32 / 0.55, easing: 'linear' }).finished.then(() => tr.remove());
        im.animate([
          { transform: `translate(-50%,-50%) rotate(${rot}deg) scale(.7)` },
          { transform: `translate(calc(-50% + ${horiz ? dist : 0}px), calc(-50% + ${horiz ? 0 : dist}px)) rotate(${rot}deg) scale(1.1)` },
        ], { duration: steps * 32, easing: 'linear' }).finished.then(() => im.remove());
        // 불꽃 꼬리
        for (let k = 1; k <= steps; k++) setTimeout(() => {
          const x = o.x + (horiz ? dir * k * S : 0), y = o.y + (horiz ? 0 : dir * k * S);
          kp('spark_05', x, y, S * 1.1, '#bfe9ff', [{ transform: `scale(.5) rotate(${horiz ? 90 : 0}deg)`, opacity: 1 }, { transform: `scale(1.2) rotate(${horiz ? 90 : 0}deg)`, opacity: 0 }], { duration: 260 });
        }, k * 32);
      });
      shake(4, 200);
    }, FUSE.h);
  } else if (ef.kind === 'bomb') {
    // 폭탄이 부풀며 빨갛게 지지직 → 쾅! 충격파가 둥글게 퍼짐
    Sound.play('swap', 0.6, 0.6);
    inner?.animate([
      { transform: 'scale(1)', filter: 'brightness(1)' },
      { transform: 'scale(1.25) rotate(-8deg)', filter: 'brightness(1.3) sepia(.4) hue-rotate(-30deg)', offset: 0.3 },
      { transform: 'scale(1.3) rotate(8deg)', filter: 'brightness(1.6) sepia(.6) hue-rotate(-30deg)', offset: 0.6 },
      { transform: 'scale(1.55)', filter: 'brightness(2.5)' },
    ], { duration: FUSE.bomb, fill: 'forwards' });
    for (let k = 0; k < 4; k++) setTimeout(() => kp('star_06', o.x + S * 0.25, o.y - S * 0.35, S * 0.7, '#ffcf3f', [{ transform: 'scale(.3)', opacity: 1 }, { transform: 'scale(1)', opacity: 0 }], { duration: 120 }), k * 70);
    setTimeout(() => {
      Sound.play('thwack', 0.6, 1);
      Sound.play('line', 0.6, 0.9);
      kp('light_02', o.x, o.y, S * 5, '#fff6c8', [{ transform: 'scale(.2)', opacity: 1 }, { transform: 'scale(1)', opacity: 0 }], { duration: 320, easing: 'ease-out' });
      kx('explosion01', 'star_09', o.x, o.y, S * 4.2, '#ffd25a', [{ transform: 'scale(.2) rotate(0)', opacity: 1 }, { transform: 'scale(1.05) rotate(20deg)', opacity: 0 }], { duration: 380, easing: 'cubic-bezier(.2,.9,.3,1)' });
      kx('glowlines', 'spark_05', o.x, o.y, S * 6, '#ffffff', [{ transform: 'scale(.4)', opacity: 1 }, { transform: 'scale(1.2)', opacity: 0 }], { duration: 320 });
      kp('magic_02', o.x, o.y, S * 5, '#ffb347', [{ transform: 'scale(.2) rotate(0)', opacity: 1 }, { transform: 'scale(1) rotate(60deg)', opacity: 0 }], { duration: 520, easing: 'ease-out' });
      kp('smoke_04', o.x, o.y, S * 3.4, '#e8dccb', [{ transform: 'scale(.3)', opacity: 0.9 }, { transform: 'scale(1.3)', opacity: 0 }], { duration: 800, easing: 'ease-out' });
      kp('circle_03', o.x, o.y, S * 5.5, '#ffe066', [{ transform: 'scale(.1)', opacity: 1 }, { transform: 'scale(1)', opacity: 0 }], { duration: 420, easing: 'cubic-bezier(.2,.8,.3,1)' });
      burst(o.x, o.y, '#ffb347', 10);
      confettiRing(o.x, o.y);
      shards(o.x, o.y, ['#4a4262', '#ff9a4d', '#ffd84d'], 10, 10);
      Juice.zoom(o.x, o.y, 1.06, 300);
      Juice.stop(70);
      shake(9, 320);
      flash('#fff6a8', 0.35);
    }, FUSE.bomb);
  } else if (ef.kind === 'rainbow') {
    // 무지개가 빙글빙글 모았다가 → 같은 얼굴마다 빛줄기가 하나씩 닿음
    Sound.play('rainbow', 1);
    inner?.animate([{ transform: 'scale(1) rotate(0)' }, { transform: 'scale(1.45) rotate(360deg)' }], { duration: FUSE.rainbow, easing: 'ease-in', fill: 'forwards' });
    kp('twirl_01', o.x, o.y, S * 3, '#ffb3d1', [{ transform: 'scale(1.2) rotate(0)', opacity: 0 }, { transform: 'scale(.4) rotate(-240deg)', opacity: 1 }], { duration: FUSE.rainbow, easing: 'ease-in' });
    const colors = ['#ff8ab8', '#ffd84d', '#7cc4ec', '#a6d96a', '#b99cf0'];
    let k = 0;
    ef.times.forEach((t, cell) => {
      const [r, c] = unkey(cell);
      if (r === ef.r && c === ef.c) return;
      beamTo(o, tileCenter(r, c), colors[k++ % colors.length], Math.max(0, t - 150));
    });
    setTimeout(() => { flash('#ffffff', 0.4); shake(6, 300); }, FUSE.rainbow);
  } else if (ef.kind === 'plane') {
    // 비행기가 붕 떠올라 → 활처럼 날아가 → 꽂히면서 쾅
    inner?.animate([{ transform: 'scale(1) rotate(0)' }, { transform: 'scale(1.3) rotate(-15deg) translateY(-20%)' }], { duration: FUSE.plane, fill: 'forwards' });
    setTimeout(() => {
      NEAR4.forEach(([dr, dc]) => inside(ef.r + dr, ef.c + dc) && burst(o.x + dc * S, o.y + dr * S, '#bff3ff', 3));
      if (ef.target) {
        const to = tileCenter(ef.target[0], ef.target[1]);
        planeFly(o, to, null, 720 - FUSE.plane).then(() => {
          kp('flare_01', to.x, to.y, S * 2.6, '#ffffff', [{ transform: 'scale(.3)', opacity: 1 }, { transform: 'scale(1.2)', opacity: 0 }], { duration: 300 });
          ringFx(to.x, to.y, S * 2.4, '#7cc4ec', 320);
          burst(to.x, to.y, '#bff3ff', 10);
          Sound.play('thwack', 1.1, 0.8);
          shake(4, 160);
        });
      }
    }, FUSE.plane);
  }
}

// 얼굴은 깨지지 않음: 꾹 눌렸다가 쭈욱 기지개 → 뿅 연기 → 괴물(또는 목표)에게 날아가 박치기
// to: { at: {x, y}, hit } 날아갈 곳. 없으면 하트나 별로 뿅 사라짐. push: 아이템에 맞으면 통째로 튕겨 나감
function popTile(t, delay, push = null, to = null, at = null) {
  const { x, y } = at || centerOf(t.el);
  if (t.el.isConnected && t.type >= 0) {
    if (push && !to) return knockTile(t, x, y, push, delay);
    const S = B.S, src = t.inner.querySelector('img')?.src, color = teamCh(t.type)?.ring || '#ffd84d';
    const fly = to && flyCount < 16;
    t.el.style.zIndex = 3;
    t.inner.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(1.3,.68)', offset: 0.38 },
      { transform: 'scale(.84,1.26) translateY(-10%)', offset: 0.72 },
      fly ? { transform: 'scale(1.1) translateY(-16%)' } : { transform: 'scale(0) translateY(-20%) rotate(25deg)' },
    ], { duration: fly ? 140 : 230, delay, easing: 'ease-out', fill: 'forwards' });
    return sleep(delay + (fly ? 140 : 150)).then(() => {
      kx('poof2', 'circle_05', x, y, S * 1.75, color, [{ transform: 'scale(.3) rotate(0)', opacity: 0.85 }, { transform: 'scale(1.1) rotate(30deg)', opacity: 0 }], { duration: 300, easing: 'ease-out' });
      popSparkle(x, y, color);
      if (fly) {
        t.el.remove();
        flyTile(src, { x, y: y - S * 0.16 }, to.at, 0, color, to.hit);
      } else {
        kx(Math.random() < 0.5 ? 'heart' : 'star', 'star_06', x, y - S * 0.2, S * 0.62, color,
          [{ transform: 'translateY(0) scale(.4)', opacity: 1 }, { transform: `translateY(${-S * 0.9}px) scale(1)`, opacity: 0 }], { duration: 520, easing: 'ease-out' });
        setTimeout(() => t.el.remove(), 90);
      }
    });
  }
  return t.inner.animate([
    { transform: 'scale(1)', opacity: 1 },
    { transform: 'scale(1.18,.86)', opacity: 1, offset: 0.2 },
    { transform: 'scale(1.38)', opacity: 1, offset: 0.45 },
    { transform: 'scale(0) rotate(30deg)', opacity: 0 },
  ], { duration: 260, delay, easing: 'ease-in', fill: 'forwards' }).finished.then(() => t.el.remove());
}

// 얼굴이 깨질 때: 하얀 번쩍 + 친구 색 고리 + 작은 별·하트 셋이 톡 튀었다 떨어짐
// 한꺼번에 많이 터지면 앞의 10개만, 효과가 이미 많으면 건너뜀 (보너스 타임 버벅임 막기)
const popBudget = { t: 0, n: 0 };
function popSparkle(x, y, color) {
  if (Prefs.d.light) return;
  const now = performance.now();
  if (now - popBudget.t > 120) { popBudget.t = now; popBudget.n = 0; }
  if (++popBudget.n > 10 || fx.childElementCount > 70) return;
  const S = B.S;
  kp('light_02', x, y, S * 1.3, '#ffffff', [{ transform: 'scale(.3)', opacity: 0.9 }, { transform: 'scale(1.1)', opacity: 0 }], { duration: 200, easing: 'ease-out' });
  kp('circle_03', x, y, S * 1.6, color, [{ transform: 'scale(.3)', opacity: 0.9 }, { transform: 'scale(1)', opacity: 0 }], { duration: 340, easing: 'cubic-bezier(.2,.8,.3,1)' });
  for (let k = 0; k < 3; k++) {
    const ang = -Math.PI / 2 + (k - 1) * 0.95 + (Math.random() - 0.5) * 0.5, d = S * (0.5 + Math.random() * 0.35), rot = (Math.random() - 0.5) * 240;
    const dx = Math.cos(ang) * d, dy = Math.sin(ang) * d;
    kp(k === 1 ? 'symbol_01' : 'star_04', x, y, S * (0.3 + Math.random() * 0.12), k === 1 ? color : ['#ffffff', '#fff3a8'][k >> 1], [
      { transform: 'translate(0,0) scale(.3) rotate(0)', opacity: 1 },
      { transform: `translate(${dx}px,${dy}px) scale(1) rotate(${rot / 2}deg)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${dx * 1.2}px,${dy + S * 0.55}px) scale(.4) rotate(${rot}deg)`, opacity: 0 },
    ], { duration: 560, easing: 'cubic-bezier(.25,.7,.5,1)' });
  }
}
// 폭탄이 터질 때 둘레로 파스텔 색종이 별이 둥글게
function confettiRing(x, y, n = 10) {
  if (Prefs.d.light || fx.childElementCount > 70) return;
  const S = B.S, cols = ['#ff8ab8', '#ffd84d', '#7be0a0', '#7cc4ec', '#b99cf0'];
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2 + Math.random() * 0.3, d = S * (1.6 + Math.random() * 0.8);
    kp(k % 3 ? 'star_06' : 'symbol_01', x, y, S * 0.5, cols[k % cols.length], [
      { transform: 'translate(0,0) scale(.3) rotate(0)', opacity: 1 },
      { transform: `translate(${Math.cos(a) * d * 0.8}px,${Math.sin(a) * d * 0.8}px) scale(1.1) rotate(120deg)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d + S * 0.6}px) scale(.3) rotate(220deg)`, opacity: 0 },
    ], { duration: 700, easing: 'cubic-bezier(.2,.8,.4,1)' });
  }
}

// 조각이 포물선으로 튀어 떨어짐 (상자 나무 조각, 포장지, 흙, 물방울)
function shards(x, y, colors, n = 8, size = 10, round = false) {
  if (Prefs.d.light) return;
  if (fx.childElementCount > 60) n = Math.ceil(n / 2);
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
// 장애물 연출용 그림 (잡초 뿌리째, 풀린 리본, 열린 상자, 거품 터짐 …)
const OBST = n => `assets/img/obst/${n}.png`;
['weed_pull', 'sprout_pull', 'ribbon_loose', 'box_open', 'box_flap', 'bubble_pop', 'dirt', 'leaf'].forEach(n => (new Image().src = OBST(n)));
const at3 = (dx, dy, s = 1, r = 0) => `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${s}) rotate(${r}deg)`;
// 그림 하나를 (x, y)에 띄워 frames대로 움직인 뒤 지움
function piece(src, x, y, size, frames, opts) {
  const im = new Image();
  im.src = src;
  im.className = 'fximg';
  Object.assign(im.style, { left: x + 'px', top: y + 'px', width: size + 'px', zIndex: 9 });
  fx.appendChild(im);
  const a = im.animate(frames, { fill: 'forwards', ...opts });
  a.finished.then(() => im.remove(), () => im.remove());
  return a;
}
// 뿌리째 쑥: 두 번 당기다가 흙덩이 달린 채로 뽑혀 위로 날아감
function pullOut(src, x, y, size) {
  const dx = (Math.random() < 0.5 ? -1 : 1) * (18 + Math.random() * 22);
  piece(src, x, y, size, [
    { transform: at3(0, 0), opacity: 1 },
    { transform: at3(-3, -6, 1, -6), offset: 0.14 },
    { transform: at3(2, 0, 1, 4), offset: 0.26 },
    { transform: at3(-2, -12, 1.02, -8), offset: 0.4 },
    { transform: at3(0, -4, 1, 2), offset: 0.5 },
    { transform: at3(dx * 0.4, -size * 1.1, 1.12, dx * 0.6), opacity: 1, offset: 0.72 },
    { transform: at3(dx, -size * 1.6, 0.9, dx * 1.6), opacity: 0 },
  ], { duration: 720, easing: 'ease-out' });
}
// 조각 하나가 옆으로 튀어 빙글 떨어짐 (상자 날개, 잎, 흙, 풀린 리본)
function tossPiece(src, x, y, size, dir, delay = 0) {
  const dx = dir * (40 + Math.random() * 30);
  piece(src, x, y, size, [
    { transform: at3(0, 0, 0.8, 0), opacity: 1 },
    { transform: at3(dx * 0.5, -size * 0.9, 1, dir * 120), opacity: 1, offset: 0.4 },
    { transform: at3(dx, size * 0.9, 0.8, dir * 300), opacity: 0 },
  ], { duration: 640, delay, easing: 'ease-out' });
}
// 장애물이 맞거나 깨짐, 리본이 풀림, 잡초가 뽑힘, 시럽이 번짐
function hitFx(res, T) {
  const at = (r, c) => T.get(key(r, c)) ?? 60;
  const S = B.S;
  res.unlocked.forEach(({ r, c, tile }) => setTimeout(() => {
    const p = tileCenter(r, c);
    flyOff(ITEM('ribbon'), p.x, p.y, S * 0.9);
    tossPiece(OBST('ribbon_loose'), p.x, p.y, S * 0.8, Math.random() < 0.5 ? -1 : 1, 60);
    shards(p.x, p.y, ['#ff8ab8', '#ffc4dc', '#ff5d9e'], 8, 9);
    ringFx(p.x, p.y, S * 1.6, '#ff8ab8');
    refreshTile(tile);
    squish(tile);
    flyToGoal(ITEM('ribbon'), p, goalChip('lock'), '#ff8ab8');
    Sound.play('pop', 1.7, 0.8);
    Sound.play('sparkle', 1.5, 0.4);
  }, at(r, c)));
  res.hits.forEach(({ r, c, tile, gone }) => setTimeout(() => {
    const p = tileCenter(r, c);
    if (tile.block === 'weed') {
      // 잡초 쑥: 다 뽑히면 뿌리째 쑥 빠져 날아가고, 한 번 맞으면 잎만 우수수
      if (gone) { tile.inner.style.opacity = 0; pullOut(OBST('weed_pull'), p.x, p.y, S); }
      else {
        tossPiece(OBST('leaf'), p.x, p.y - S * 0.1, S * 0.4, -1);
        tossPiece(OBST('leaf'), p.x, p.y - S * 0.1, S * 0.36, 1, 50);
        tile.inner.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-10%) rotate(-6deg)' }, { transform: 'translateY(0) rotate(4deg)' }, { transform: 'none' }], { duration: 260 });
      }
      tossPiece(OBST('dirt'), p.x, p.y + S * 0.25, S * 0.3, Math.random() < 0.5 ? -1 : 1, 220);
      shards(p.x, p.y + S * 0.2, ['#9b6b3a', '#7a5230', '#6dbf57', '#8fd06a'], 8, 7, true);
      ringFx(p.x, p.y, S * 1.6, '#8fd06a', 300);
      Sound.play('swap', 1.5, 0.7);
      Sound.play('pop', 1.2, 0.6);
    } else if (tile.block === 'bubble') {
      // 거품: 볼록 부풀었다가 퐁 터져 물방울이 둥글게 퍼짐
      if (gone) {
        tile.inner.style.opacity = 0;
        piece(ITEM('bubble'), p.x, p.y, S * 0.86, [{ transform: at3(0, 0), opacity: 1 }, { transform: at3(0, 0, 1.25, 0), opacity: 1, offset: 0.7 }, { transform: at3(0, 0, 1.35, 0), opacity: 0 }], { duration: 140, easing: 'ease-in' });
      }
      piece(OBST('bubble_pop'), p.x, p.y, S * 1.1, [{ transform: at3(0, 0, 0.5, 0), opacity: 1 }, { transform: at3(0, 0, 1.3, 20), opacity: 0 }], { duration: 420, delay: 120, easing: 'ease-out' });
      ringFx(p.x, p.y, S * 2, '#9fdcff', 320);
      shards(p.x, p.y, ['#bfe9ff', '#e6f7ff', '#8fd3ff'], 10, 8, true);
      Sound.play('pop', 1.9, 0.9);
      Sound.play('sparkle', 1.8, 0.4);
    } else if (gone) {
      // 상자: 날개가 활짝 열리며 통 튀어 오르고, 날개 두 장은 양옆으로 날아감
      tile.inner.style.opacity = 0;
      const dir = Math.random() < 0.5 ? -1 : 1;
      piece(OBST('box_open'), p.x, p.y, S * 0.95, [
        { transform: at3(0, 0, 0.9, 0), opacity: 1 },
        { transform: at3(0, -S * 0.25, 1.22, dir * -6), offset: 0.3 },
        { transform: at3(dir * 30, -S * 1.1, 1, dir * 40), opacity: 1, offset: 0.65 },
        { transform: at3(dir * 60, -S * 0.6, 0.7, dir * 110), opacity: 0 },
      ], { duration: 620, easing: 'ease-out' });
      tossPiece(OBST('box_flap'), p.x - S * 0.2, p.y - S * 0.2, S * 0.5, -1, 90);
      tossPiece(OBST('box_flap'), p.x + S * 0.2, p.y - S * 0.2, S * 0.5, 1, 120);
      shards(p.x, p.y, ['#c8955a', '#e2b77d', '#9b6b3a', '#f1d6a8'], 8, 11);
      ringFx(p.x, p.y, S * 1.8, '#e2b77d', 300);
      Sound.play('hit2', 0.7, 0.9);
      Sound.play('land', 0.8, 0.9);
      shake(4, 160);
    } else {
      // 선물: 리본이 흔들흔들하다 스르륵 풀려 양옆으로 날아가고 상자가 남음
      piece(ITEM('gift'), p.x, p.y, S * 0.86, [
        { transform: at3(0, 0), opacity: 1 }, { transform: at3(0, 0, 1.05, -8), offset: 0.25 }, { transform: at3(0, 0, 1.05, 8), offset: 0.5 },
        { transform: at3(0, -S * 0.1, 1.1, 0), opacity: 1, offset: 0.7 }, { transform: at3(0, -S * 0.2, 1.15, 0), opacity: 0 },
      ], { duration: 320, easing: 'ease-in-out' });
      flyOff(ITEM('ribbon'), p.x, p.y - S * 0.25, S * 0.6);
      tossPiece(OBST('ribbon_loose'), p.x, p.y, S * 0.75, -1, 200);
      tossPiece(OBST('ribbon_loose'), p.x, p.y, S * 0.75, 1, 230);
      shards(p.x, p.y, ['#ff6b6b', '#ffd84d', '#ff9f5a'], 10, 10);
      Sound.play('hit1', 1.2, 0.8);
    }
    const k = tile.block === 'weed' ? 'weed' : tile.block === 'bubble' ? 'bubble' : 'box';
    if (gone || k !== 'box') flyToGoal(ITEM(tile.block === 'weed' ? 'weed1' : tile.block === 'bubble' ? 'bubble' : 'box'), p, goalChip(k), '#ffd84d');
    if (gone) { popTile(tile, 0); if (tile.block === 'bubble') foamJoin(); }
    else { refreshTile(tile); squish(tile); }
  }, at(r, c)));
  if (res.weeds.length) {
    const cells = boardEl.querySelectorAll('.cellbg'), fgs = boardEl.querySelectorAll('.cellfg');
    res.weeds.forEach(({ r, c, left }, i) => setTimeout(() => {
      cells[key(r, c)].className = cellClass(r, c);
      fgs[key(r, c)].className = fgClass(r, c);
      const p = tileCenter(r, c);
      if (fx.childElementCount < 50) pullOut(OBST(left ? 'weed_pull' : 'sprout_pull'), p.x, p.y + S * 0.1, S * (left ? 0.8 : 0.62));
      if (goalChip('weed')) setTimeout(() => flyToGoal(ITEM('weed1'), p, goalChip('weed'), '#8fd06a'), 380);
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
      NEAR4.forEach(([dr, dc]) => inside(r + dr, c + dc) && (cells[key(r + dr, c + dc)].className = cellClass(r + dr, c + dc))); // 이웃 시럽과 이어지게
      d.animate([{ transform: 'scale(.3)', filter: 'brightness(1.6)' }, { transform: 'scale(1.18)', offset: 0.6 }, { transform: 'scale(1)', filter: 'brightness(1)' }], { duration: 360, easing: 'ease-out' });
      const p = tileCenter(r, c);
      shards(p.x, p.y, ['#ffb347', '#ffd27a', '#e8912d'], 4, 8, true);
    }, 80 + Math.min(i * 30, 300)));
    setTimeout(() => Sound.play('heal', 1.6, 0.45), 80);
  }
}

// 아이템마다 터지는 순서: 칸마다 '언제 터질지(ms)'를 정해 두고 그 시각에 터뜨림
// 로켓은 출발점에서 양 끝으로 쓸고 가고, 폭탄은 부풀었다가 둥글게 퍼지고, 무지개는 빛줄기가 하나씩 닿고, 비행기는 날아가 꽂힘
const FUSE = { h: 90, v: 90, bomb: 320, rainbow: 260, plane: 120 };
function effectTimes(res, from) {
  const T = new Map();
  const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
  res.effects.forEach(e => {
    const base = T.get(key(e.r, e.c)) ?? 0;
    const o = [e.r, e.c];
    const order = e.kind === 'rainbow' ? e.cells.slice().sort((x, y) => dist(x, o) - dist(y, o)) : e.cells;
    e.base = base;
    e.times = new Map();
    order.forEach(([r, c], idx) => {
      let d;
      if (e.kind === 'h' || e.kind === 'v') d = FUSE.h + Math.abs(e.kind === 'h' ? c - e.c : r - e.r) * 32;
      else if (e.kind === 'bomb') d = FUSE.bomb + dist([r, c], o) * 45;
      else if (e.kind === 'rainbow') d = r === e.r && c === e.c ? FUSE.rainbow + order.length * 38 : FUSE.rainbow + idx * 38;
      else if (e.kind === 'plane') d = e.target && r === e.target[0] && c === e.target[1] ? 720 : FUSE.plane;
      else d = 60;
      const k = key(r, c);
      e.times.set(k, d);
      if (!T.has(k) || base + d < T.get(k)) T.set(k, base + d);
    });
  });
  // 아이템 조합으로 지운 칸: 조합한 자리에서 물결처럼
  if (from) [...res.cleared, ...res.hits].forEach(({ r, c }) => { const k = key(r, c); if (!T.has(k)) T.set(k, 60 + dist([r, c], from.at) * 34); });
  return T;
}

// 칸 하나를 하얗게 켬: on(ms)에 켜지고 깜빡이며 기다리다가 pop(ms)에 번쩍하고 꺼짐
const ZONE_TINT = { h: '#7cc4ec', v: '#7cc4ec', bomb: '#ffb020', rainbow: '#ff8ab8', plane: '#7cc4ec', combo: '#ffd84d' };
function zoneCell([r, c], on, pop, kind) {
  if (!inside(r, c) || hole(r, c)) return; // 모양 판의 빈 곳(칸 없는 자리)은 안 켬
  const el = document.createElement('div');
  el.className = 'zone';
  Object.assign(el.style, { left: c * B.S + 'px', top: r * B.S + 'px', width: B.S + 'px', height: B.S + 'px' });
  el.style.setProperty('--zc', ZONE_TINT[kind] || '#ffffff');
  boardEl.appendChild(el);
  const wait = Math.max(60, pop - on), dur = wait + 260, f = x => Math.min(0.98, x / dur);
  el.animate([
    { opacity: 0, transform: 'scale(.6)' },
    { opacity: 0.85, transform: 'scale(1)', offset: f(Math.min(70, wait * 0.5)) },
    { opacity: 0.55, transform: 'scale(.94)', offset: f(wait * 0.75) },
    { opacity: 1, transform: 'scale(1.08)', offset: f(wait) },
    { opacity: 0, transform: 'scale(1.2)' },
  ], { duration: dur, delay: on, easing: 'ease-out', fill: 'backwards' }).finished.then(() => el.remove());
}

async function stepFx(res, combo, from = null) {
  const T = effectTimes(res, from);
  // 터질 범위: 아이템이 발동하는 순간 범위 칸이 하얗게 켜졌다가, 그 칸이 터질 때 번쩍
  const zoned = new Set();
  res.effects.forEach(ef => ef.times.forEach((d, k) => {
    if (zoned.has(k)) return;
    zoned.add(k);
    zoneCell(unkey(k), ef.base, T.get(k) ?? ef.base + d, ef.kind);
  }));
  if (from) res.cleared.forEach(({ r, c }) => { const k = key(r, c); if (!zoned.has(k)) { zoned.add(k); zoneCell([r, c], 0, T.get(k) ?? 60, 'combo'); } });
  res.effects.forEach(ef => {
    setTimeout(() => effectFx(ef), ef.base);
    setTimeout(() => afterFx(ef), ef.base + Math.max(...ef.times.values()) + 60);
  });
  const n = res.cleared.length;
  let i = 0, last = 0;
  // 얼굴이 날아갈 곳: 토벌이면 괴물(회복 친구는 체력바), 일상 퍼즐이면 그 캐릭터 목표 칩
  const monC = B.mode === 'battle' ? centerOf(monImg()) : null, teamC = B.mode === 'battle' ? centerOf($('#teamHp')) : null;
  const targetOf = tile => {
    if (tile.type < 0) return null;
    const ch = teamCh(tile.type);
    if (B.mode === 'battle') return ch.heal ? { at: teamC, hit: () => $('#teamHp').animate([{ transform: 'scale(1)' }, { transform: 'scale(1.05)' }, { transform: 'scale(1)' }], { duration: 140 }) } : { at: monC, hit: monsterPeck };
    const chip = goalChip('char', ch.id);
    return chip ? { at: centerOf(chip), hit: () => chipBump(chip) } : null;
  };
  // 아이템에 맞아 깨지는 칸은 터진 자리 반대쪽으로 날아감
  const pushAt = new Map(), POWER = { bomb: 1.7, h: 1.3, v: 1.3, plane: 1.2, rainbow: 0.8 };
  res.effects.forEach(ef => { const o = tileCenter(ef.r, ef.c); ef.times.forEach((_, k) => !pushAt.has(k) && pushAt.set(k, { ...o, power: POWER[ef.kind] || 1 })); });
  if (from) { const o = tileCenter(from.at[0], from.at[1]); res.cleared.forEach(({ r, c }) => !pushAt.has(key(r, c)) && pushAt.set(key(r, c), { ...o, power: 1.5 })); }
  res.cleared.forEach(({ r, c, tile }) => {
    const p = tileCenter(r, c);
    const color = tile.type >= 0 ? teamCh(tile.type).ring : '#ffd84d';
    const delay = T.get(key(r, c)) ?? Math.min(i++ * 10, 150);
    last = Math.max(last, delay);
    setTimeout(() => {
      // 캐릭터 색 고리 + 반짝이 + 같은 색 방울이 포물선으로 톡톡
      if (n < 16 || Math.random() < 0.5) ringFx(p.x, p.y, B.S * 1.5, color, 300);
      burst(p.x, p.y, color, n > 15 ? 3 : 5);
      shards(p.x, p.y, [color, '#ffffff'], n > 12 ? 2 : 4, 9, true);
    }, delay + 50);
    popTile(tile, delay, pushAt.get(key(r, c)), targetOf(tile), p);
  });
  // 많이 터질수록 판이 통 울림
  if (n >= 4) setTimeout(() => boardEl.animate([{ transform: 'scale(1)' }, { transform: `scale(${1 + Math.min(0.03, n * 0.002)})` }, { transform: 'scale(1)' }], { duration: 160, easing: 'ease-out' }), 60);
  if (combo >= 3) setTimeout(() => shake(2 + combo, 160), 60);
  hitFx(res, T);
  res.hits.forEach(({ r, c }) => (last = Math.max(last, T.get(key(r, c)) ?? 60)));
  // 무지개 조합: 무지개 자리에서 지우는 칸마다 빛줄기
  if (from && from.kind.startsWith('rainbow')) {
    const o = tileCenter(from.at[0], from.at[1]), colors = ['#ff8ab8', '#ffd84d', '#7cc4ec', '#a6d96a', '#b99cf0'];
    res.cleared.forEach(({ r, c }, k) => k < 40 && beamTo(o, tileCenter(r, c), colors[k % colors.length], Math.max(0, (T.get(key(r, c)) ?? 0) - 120)));
  }
  stepFx.wait = last;
  if (B.mode === 'life') Life.onStep(res, combo);
  // 오늘의 미션
  Daily.add('pop', res.cleared.filter(x => x.tile.type >= 0).length);
  Daily.add('item', res.effects.length);
  ['weed', 'bubble', 'box'].forEach(k => Daily.add(k, res.hits.filter(h => h.gone && h.tile.block === k).length));
  for (let i = 0; i < Math.min(3, Math.ceil(n / 3)); i++) setTimeout(() => Sound.pop(combo - 1 + i), i * 70);
  if (n >= 6) setTimeout(() => Sound.play('sparkle', 1 + combo * 0.05, 0.6), 60);

  if (combo >= 2) Combo.show(combo);

  // 공격과 회복 (토벌에서만)
  const tally = new Map();
  (B.mode === 'battle' ? res.cleared : []).forEach(({ r, c, tile }) => {
    if (tile.type < 0) return;
    if (!tally.has(tile.type)) tally.set(tile.type, []);
    tally.get(tile.type).push([r, c]);
  });
  const mult = (1 + 0.25 * (combo - 1)) * (B.fever ? 1.5 : 1) * (B.rally ? 1.3 : 1), noGauge = B.inSkill;
  B.pending.push((async () => {
    await sleep(Math.min(1100, last + 560));
    let k = 0;
    for (const [type, cells] of tally) {
      const ch = teamCh(type), cheer = type >= B.real;
      const zz = Debuff.asleep(type); // 잠든 친구: 게이지가 안 차고 공격·회복이 반
      if (!cheer && !noGauge && !zz) B.gauge[type] += cells.length;
      $('#party').children[type]?.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-10px) scale(1.15)' }, { transform: 'translateY(0)' }], { duration: 260 });
      if (ch.heal) {
        const amt = Math.round(cells.length * ch.heal * mult * (cheer ? 0.5 : Meta.mult(ch.id)) * (zz ? 0.5 : 1));
        B.dmgBy[ch.id] = (B.dmgBy[ch.id] || 0) + Math.min(amt, B.teamMax - B.teamHp);
        B.teamHp = Math.min(B.teamMax, B.teamHp + amt);
        updateTeam();
        Sound.play('heal', 1.2, 0.6);
        floatNum(teamC.x, teamC.y - 10, `+${amt}`, '#3fae4f');
      } else if (B.monHp > 0) {
        const crit = ch.crit && Math.random() < ch.crit;
        const eff = cheer ? 1 : attrMult(ch.attr, curWave().a);
        const dmg = Math.round(cells.length * ch.dmg * mult * eff * (cheer ? 0.5 : Meta.mult(ch.id)) * (crit ? 2.5 : 1) * (zz ? 0.5 : 1));
        hitMonster(dmg, ch, crit, k++, eff);
      }
      await sleep(110);
    }
    updateGauges();
  })());

  await sleep(Math.max(Math.min(n * 10, 150), stepFx.wait) + 220);

  // 아이템이 생기는 순간 아주 잠깐 멈칫 + 통 (손맛)
  if (res.created.length) { Juice.stop(55); shake(3, 140); Haptic.tap(20); }
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

function hitMonster(dmg, ch, crit, k, eff = 1, carried = false) {
  const mon = tgt();
  if (!mon) return;
  if (!carried) dmg = Debuff.weaken(dmg); // 어둠이면 약하게 (넘어가는 남은 데미지엔 또 걸지 않음)
  B.lastMon = mon;
  const dealt = Math.min(dmg, mon.hp);
  B.dmgBy[ch.id] = (B.dmgBy[ch.id] || 0) + dealt;
  mon.hp = Math.max(0, mon.hp - dmg);
  updateMon();
  // 여럿 중 하나가 쓰러지면: 쓰러지는 연출 + 남은 데미지는 다음 괴물에게 (속성 상성은 다시 따짐)
  if (mon.hp <= 0 && aliveMons().length) {
    killMon(mon);
    const nx = tgt(), rest = dmg - dealt;
    if (nx && rest > 0) setTimeout(() => { const e2 = attrMult(ch.attr, nx.w.a); hitMonster(Math.max(1, Math.round((rest / eff) * e2)), ch, crit, k + 1, e2, true); }, 160);
  }
  const m = mon.el.img;
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
    // 새로 생긴 얼굴은 첫 칸 동안 서서히 나타남 (판 위쪽이 빈 모양이면 그 자리에 뿅 생기는 것처럼 보여서)
    const frames = path.map(([r, c, k], i) => ({ transform: tf(r, c), offset: (k - t0) / span, ...(fresh ? { opacity: i ? 1 : 0 } : {}) }));
    // 떨어지는 게 눈에 보이게: 칸마다 조금 더 천천히, 점점 빨라지다 톡 착지
    return t.el.animate(frames, { duration: 150 + span * 85, delay: t0 * 72, easing: 'cubic-bezier(.45,0,.9,.55)', fill: 'backwards' })
      .finished.then(() => squish(t));
  });
  if (moves.length) setTimeout(() => Sound.play('land', 1.3, 0.25), 320);
  await Promise.all(ps);
}

// ---------- 턴 끝 ----------
async function endTurn() {
  await Promise.all(B.pending);
  B.pending = [];
  if (B.mode === 'life') { await Life.endTurn(); return; }
  if (!aliveMons().length) { await monsterDefeated(); return; }
  if (B.fever) { B.fever--; updateFever(); }
  if (B.rally) B.rally--;
  await Debuff.tick(); // 독이 들고, 잠·어둠이 한 턴씩 풀림
  aliveMons().forEach(m => m.cd--);
  updateCd();
  for (const m of aliveMons()) {
    if (m.cd > 0) continue;
    await monsterAttack(m);
    m.cd = m.w.cd;
    updateCd();
    if (B.teamHp <= 0) { await lose(); return; }
  }
}

async function monsterAttack(mon = tgt()) {
  const m = mon.el.img;
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
  const atk = mon.w.atk;
  B.teamHp = Math.max(0, B.teamHp - atk);
  updateTeam();
  const c = centerOf($('#teamHp'));
  floatNum(c.x, c.y - 10, `-${atk}`, '#e2543f', 'crit');
  $('#party').animate([{ transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'none' }], { duration: 240 });
  await sleep(450);
  if (mon.w.m === 'mimic') await throwBoxes(mon.w.boss ? 3 : 2, centerOf(m));
  await Debuff.special(mon); // 괴물마다 특수 공격 (한 번 걸러 한 번)
}

// 미믹은 공격하면서 판에 상자를 던짐. 옆에서 터뜨리면 깨짐
async function throwBoxes(n, from = centerOf(monImg())) {
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
  const last = B.lastMon || B.mons?.[0], m = last ? last.el.img : $('#monster');
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
  if (last?.w.boss) Achieve.add('boss');
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
  Daily.add('win');
  Daily.add('battle');
  Aff.afterWin(B.team.slice(0, B.real).map(k => CHARS[k].id));
  if (firstClear) Save.data.ramen = true;
  Save.data.stars[B.stage] = Math.max(Save.data.stars[B.stage] || 0, stars);
  setTimeout(() => Net.submit(), 0);
  Save.save();
  const rank = firstClear && Net.clearRank();
  Sound.play('win', 1);
  await clearShow();
  const k = routeIdx('b', B.stage), isLast = k === ROUTE.length - 1;
  if (STORY_AFTER[B.stage] && firstClear) await playStory(STORY_AFTER[B.stage]); // 장 끝 대사
  if (firstClear) await Meta.stageJoin('b', B.stage);
  const ch = mvp(), shard = firstClear && Meta.shardGift(ch.id, stars);
  Sound.music(null);
  const from = k;
  modal({
    title: '토벌 성공!', stars, char: ch.id, text: `MVP ${ch.name}: "${lineOf(ch.id)}"`,
    rows: [['남은 체력', Math.round(ratio * 100) + '%'], [`<img class="row-ic" src="${ITEM('coin')}">`, '+' + coins], treat, shard].filter(Boolean),
    btn2: '🏠 지도로', on2: () => go(() => openMap(firstClear ? from : null)),
    btn1: isLast ? '🏠 지도로' : Unlock.fresh() ? '🎁 새 기능 보러 가기' : '다음 스테이지 ▶', // 새 기능이 열렸으면 지도로 데려가서 안내
    on1: () => (isLast || Unlock.fresh() ? go(() => openMap(firstClear ? from : null)) : Hearts.need(() => go(() => goRoute(k + 1)), () => go(() => openMap(firstClear ? from : null)))),
  });
  Net.rankLine(rank);
}

async function lose() {
  B.over = true;
  B.busy = true;
  Sound.music(null);
  Sound.play('jingle_lose', 1, 0.9);
  await banner('후퇴…', 600);
  modal({
    title: '실패…', stars: 0, img: 'assets/img/art/scene_scared.jpg', photo: true, text: '치이카와: (훌쩍…) 상성 좋은 친구랑 다시 가 보자',
    rows: [['괴물 체력', Math.ceil((aliveMons().reduce((t, m) => t + m.hp, 0) / Math.max(1, (B.mons || []).reduce((t, m) => t + m.max, 0))) * 100) + '%'], ['웨이브', `${B.wave + 1} / ${STAGES[B.stage].waves.length}`], [`<img class="row-ic" src="${ITEM('heart')}">`, '-1']],
    btn2: '🏠 지도로', on2: () => { Hearts.lose(); go(openMap); },
    btn1: '다시 하기', on1: () => { Hearts.lose(); Hearts.need(() => go(() => startStage(B.stage)), () => go(openMap)); },
    ...(!B.cont && (Items.n('cont') || Save.data.coins >= itemPrice('cont')) ? { // 이어하기: 체력 절반 채우고 그 자리에서 계속. 이어하기권이 없으면 코인으로, 스테이지마다 한 번
      btn2: '다시 하기', on2: () => { Hearts.lose(); Hearts.need(() => go(() => startStage(B.stage)), () => go(openMap)); },
      btn1: Items.n('cont') ? `이어하기권 쓰기 (${Items.n('cont')})` : `이어하기 (코인 ${itemPrice('cont')})`,
      on1: () => {
        if (Items.n('cont')) Items.use('cont'); else Meta.addCoins(-itemPrice('cont'));
        B.cont = true;
        B.teamHp = Math.ceil(B.teamMax / 2);
        aliveMons().forEach(m => (m.cd = m.w.cd));
        updateTeam();
        updateCd();
        B.over = false;
        B.busy = false;
        Sound.play('heal', 1.2, 0.9);
        Sound.music(aliveMons().some(m => m.w.boss) ? 'boss' : 'battle');
      },
    } : {}),
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
  Tutor.formIntro();
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
    const strong = [...foes].some(a => attrMult(c.attr, a) > 1), own = Meta.owned(c.id), good = own && strong;
    const wish = !own && strong && !RECRUIT[c.id]; // 아직 없지만 이 판에 유리한 친구 → 뽑기에서 만날 수 있음
    const sp = own && specialOf(c.id); // 스페셜 코스튬을 입었으면 카드 배경이 애니 장면
    return `<button class="ccard${formPick.includes(k) ? ' on' : ''}${own ? '' : ' locked'}${sp ? ' special' : ''}" style="--ring:${c.ring}${sp ? `;--scene:url(${SCENE(sp.special)})` : ''}" data-k="${k}">
      ${own ? Meta.figure(c.id, art(c.id)) : `<span class="fig"><img src="${art(c.id)}" class="shadow"></span>`}
      <span class="nm">${own ? c.name : '???'}</span>
      <span class="meta">${own ? `${attrIcon(c.attr)}Lv${Meta.lv(c.id)}` : RECRUIT[c.id]?.treat ? '' : LOCK_SVG}</span>${own ? '' : treatBadge(c.id)}
      ${good ? '<span class="good">유리!</span>' : ''}${wish ? '<span class="wish">유리 · 뽑기에서</span>' : ''}</button>`;
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
  $('#btnSortie').disabled = !formPick.length;
}
$('#btnSortie').onclick = () => {
  if (!formPick.length) return;
  Hearts.need(() => {
    Sound.play('open');
    B.squad = formPick.slice();
    Save.data.team = B.squad.map(k => CHARS[k].id);
    Save.save();
    go(() => startStage(formStage));
  });
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
$('#btnFormBack').onclick = $('#btnFormMap').onclick = () => { Sound.play('click'); go(openMap); };

// ---------- 스킬 ----------
// 캐릭터 색 스티커 띠가 찰싹 붙고, 그림이 튀어나와 대사, 빛줄기 남기고 빠짐 (약 1초)
// 스페셜 옷 컷인 덧칠: 장면 그림이 서서히 다가오고, 친구가 커졌다 작아졌다, 둘레로 별이 퐁퐁 (transform/opacity만)
function specialCut(el, dim, body, sp, ch) {
  const scene = document.createElement('div');
  scene.className = 'scene';
  dim.after(scene);
  scene.animate([{ opacity: 0, transform: 'scale(1.15)' }, { opacity: 0.9, transform: 'scale(1.05)', offset: 0.3 }, { opacity: 0.9, transform: 'scale(1)' }], { duration: 1200, easing: 'ease-out', fill: 'forwards' });
  const tag = document.createElement('div');
  tag.className = 'sp-tag';
  tag.textContent = `✦ ${sp.name} ✦`;
  el.appendChild(tag);
  tag.animate([{ transform: 'translateX(-50%) scale(0) rotate(-10deg)', opacity: 0 }, { transform: 'translateX(-50%) scale(1.2) rotate(3deg)', opacity: 1, offset: 0.6 }, { transform: 'translateX(-50%) scale(1)', opacity: 1 }],
    { duration: 320, delay: 520, easing: 'ease-out', fill: 'backwards' });
  body.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.1, .92) translateY(4%)', offset: 0.3 }, { transform: 'scale(.95, 1.07) translateY(-6%)', offset: 0.6 }, { transform: 'scale(1)' }],
    { duration: 340, delay: 560, iterations: 2, easing: 'ease-in-out' });
  // 별: 컷인 위에 직접 띄움 (판 효과 층은 컷인 밑이라)
  const star = (x, y, size, color, delay) => {
    const s = document.createElement('i');
    s.className = 'kp';
    Object.assign(s.style, { left: x + 'px', top: y + 'px', width: size + 'px', height: size + 'px', marginLeft: -size / 2 + 'px', marginTop: -size / 2 + 'px', zIndex: 3 });
    s.style.setProperty('--m', KP(Math.random() < 0.5 ? 'star_06' : 'star_04'));
    s.style.setProperty('--c', color);
    el.appendChild(s);
    const a = Math.random() * Math.PI * 2, d = 50 + Math.random() * 70;
    s.animate([{ transform: 'translate(0,0) scale(0) rotate(0)', opacity: 1 }, { transform: `translate(${Math.cos(a) * d * 0.7}px,${Math.sin(a) * d * 0.7}px) scale(1.2) rotate(90deg)`, opacity: 1, offset: 0.4 },
      { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px) scale(0) rotate(180deg)`, opacity: 0 }], { duration: 650, delay, easing: 'cubic-bezier(.2,.8,.4,1)', fill: 'backwards' }).finished.then(() => s.remove());
  };
  setTimeout(() => {
    const r = body.getBoundingClientRect(), a = el.getBoundingClientRect();
    const x = r.left - a.left + r.width / 2, y = r.top - a.top + r.height / 2;
    for (let k = 0; k < 14; k++) star(x, y, 18 + Math.random() * 16, [ch.ring, '#ffffff', '#ffd84d', '#ff9ec4'][k % 4], (k % 3) * 220);
    Sound.play('sparkle', 1.4, 0.7);
  }, 560);
}

async function cutIn(ch) {
  // 화면이 어두워지고 집중선이 돌며 → 캐릭터 색 띠가 쾅 → 친구가 튀어나와 한마디 → 스킬 이름이 한 글자씩 → 번쩍 하고 빠짐
  const el = document.createElement('div');
  el.className = 'cutin';
  el.style.setProperty('--ring', ch.ring);
  const sp = specialOf(ch.id); // 스페셜 옷: 그 옷이 나온 애니 장면이 뒤에 깔리고, 친구가 통통 튀며 별이 터짐
  if (sp) { el.classList.add('special'); el.style.setProperty('--scene', `url(${SCENE(sp.special)})`); }
  const sk = skillOf(ch.id);
  const letters = [...sk.name].map((t, k) => `<i style="animation-delay:${0.32 + k * 0.05}s">${t === ' ' ? '&nbsp;' : t}</i>`).join('');
  el.innerHTML = `<div class="dim"></div><div class="lines"></div><div class="band"><span></span></div><div class="band2"></div>
    <img class="body" src="${artOf(ch.id)}"><div class="say">${sk.say}</div><div class="sname">${letters}</div><div class="streak"></div>`;
  app.appendChild(el);
  const [dim, lines, band, band2, body, say, sname, streak] = el.children;
  if (sp) specialCut(el, dim, body, sp, ch);
  Sound.play('jingle_skill', 1, 0.9);
  Haptic.tap(40);
  setTimeout(() => Sound.voice(ch.id, 'skill'), 200);
  dim.animate([{ opacity: 0 }, { opacity: 0.6 }], { duration: 140, fill: 'forwards' });
  lines.animate([{ opacity: 0, transform: 'translate(-50%,-50%) scale(1.4) rotate(0)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1) rotate(25deg)' }], { duration: 1100, fill: 'forwards' });
  band.animate([
    { transform: 'rotate(-8deg) translateX(-110%)' },
    { transform: 'rotate(-8deg) translateX(3%)', offset: 0.7 },
    { transform: 'rotate(-8deg) translateX(0)' },
  ], { duration: 240, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'backwards' });
  band2.animate([{ transform: 'rotate(-8deg) translateX(110%)' }, { transform: 'rotate(-8deg) translateX(0)' }], { duration: 260, delay: 60, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'backwards' });
  setTimeout(() => { shake(8, 220); flash('#ffffff', 0.35); Sound.play('thwack', 1.2, 0.7); }, 230);
  body.animate([
    { transform: 'translate(-60%, 40px) scale(.5) rotate(-15deg)', opacity: 0 },
    { transform: 'translate(4%, -12px) scale(1.15) rotate(4deg)', opacity: 1, offset: 0.6 },
    { transform: 'translate(0, 0) scale(.97, 1.03)', offset: 0.8 },
    { transform: 'none', opacity: 1 },
  ], { duration: 420, delay: 120, easing: 'ease-out', fill: 'backwards' });
  setTimeout(() => {
    const r = body.getBoundingClientRect(), a = cachedRect(app);
    const x = r.left - a.left + r.width / 2, y = r.top - a.top + r.height / 2;
    burst(x, y, ch.ring, 14);
    burst(x, y, '#ffffff', 10);
    kp('star_09', x, y, 260, '#fff6c8', [{ transform: 'scale(.3) rotate(0)', opacity: 1 }, { transform: 'scale(1.2) rotate(90deg)', opacity: 0 }], { duration: 600 });
  }, 380);
  say.animate([{ transform: 'scale(0) rotate(-10deg)', opacity: 0 }, { transform: 'scale(1.18) rotate(3deg)', opacity: 1, offset: 0.7 }, { transform: 'scale(1)', opacity: 1 }],
    { duration: 260, delay: 300, easing: 'ease-out', fill: 'backwards' });
  setTimeout(() => Sound.play('pop', 1.4, 0.7), 300);
  [...sname.children].forEach((_, k) => setTimeout(() => Sound.play('pop', 1.6 + k * 0.08, 0.35), 320 + k * 50));
  // 띠 위 물방울 무늬가 흐름
  band.firstChild.animate([{ backgroundPosition: '0 0' }, { backgroundPosition: '120px 0' }], { duration: 1000, iterations: 2 });
  await sleep(980);
  Sound.play('line', 1.3, 0.6);
  streak.animate([
    { opacity: 1, transform: 'rotate(-8deg) scaleX(0)' },
    { opacity: 1, transform: 'rotate(-8deg) scaleX(1)', offset: 0.5 },
    { opacity: 0, transform: 'rotate(-8deg) scaleX(1) scaleY(.2)' },
  ], { duration: 260 });
  flash('#ffffff', 0.5);
  const out = { duration: 220, easing: 'ease-in', fill: 'forwards' };
  band.animate([{ transform: 'rotate(-8deg) translateX(0)' }, { transform: 'rotate(-8deg) translateX(115%)' }], out);
  band2.animate([{ transform: 'rotate(-8deg) translateX(0)' }, { transform: 'rotate(-8deg) translateX(-115%)' }], out);
  [body, say, sname].forEach(e => e.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateX(140%) scale(1.2)', opacity: 0 }], out));
  lines.animate([{ opacity: 1 }, { opacity: 0 }], out);
  await dim.animate([{ opacity: 0.6 }, { opacity: 0 }], { duration: 240, fill: 'forwards' }).finished;
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
// 일상 퍼즐에서는 데려간 친구 한 명(L.helper)의 스킬을 씀. 전투 전용 효과는 일상용으로 바꿈
// ---------- 스킬 반짝이: 지나간 자리 빛줄기·별가루, 맞은 칸 번쩍, 판 테두리 빛, 마무리 펑 ----------
// 전부 transform/opacity만 움직임 (필터·그림자를 매 프레임 바꾸면 버벅임)
// trail: beam 빛줄기 | dust 별가루 | heart 하트, hit: 맞은 칸에 번지는 그림, fin: 마무리 모양
const SKFX = {
  random8: { trail: 'dust', hit: 'star_06', fin: 'ring' },              // 치이카와: 별가루 톡톡
  rows2: { trail: 'beam', hit: 'spark_05', fin: 'ring' },               // 하치와레: 빛줄기 쓩
  cols2: { trail: 'beam', hit: 'magic_02', fin: 'ring', c2: '#b99cf0' }, // 까만별
  cross: { trail: 'dust', hit: 'slash_03', fin: 'cross' },              // 랏코: 칼빛 번쩍
  bighit: { trail: 'dust', hit: 'flare_01', fin: 'fireworks' },         // 우사기: 불꽃 펑펑
  convert6: { trail: 'dust', hit: 'twirl_01', fin: 'ring', c2: '#ffd84d' }, // 모몽가: 빙글 마법
  heal40: { trail: 'heart', hit: 'symbol_01', fin: 'hearts' },          // 카니
  ramen: { trail: 'heart', hit: 'symbol_01', fin: 'hearts', c2: '#ffd84d' }, // 시사
  stall: { trail: 'dust', hit: 'star_04', fin: 'ring', c2: '#ffd84d' }, // 고블린
  meteor: { trail: 'dust', hit: 'star_09', fin: 'ring', c2: '#fff3a8' }, // 별똥별
  cheer: { trail: 'heart', hit: 'twirl_01', fin: 'twirl' },             // 풍뎅이
  rainbow: { trail: 'dust', hit: 'star_06', fin: 'rainbow' },           // 쿠리만쥬
};
let skStyle = SKFX.random8;
const RAINBOW = ['#ff8ab8', '#ffb347', '#ffd84d', '#7be0a0', '#7cc4ec', '#b99cf0'];
// 한 번 뛰는 동안 지나간 자리에 남는 빛: a→(m)→b, dur 동안 (몸 가운데 높이로 올려서)
function skTrail(a, m, b, dur, color, size) {
  const S = B.S, st = skStyle, up = S * size * 0.3;
  if (st.trail === 'beam') {
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy);
    if (len < S * 0.4) return;
    // 한 칸 뒤에서부터 그어서 앞 줄기와 겹치게 (끊긴 점선처럼 안 보이게)
    const back = S * 0.8, sx = a.x - (dx / len) * back, sy = a.y - (dy / len) * back;
    const el = addFx('sk-beam', sx, sy - up);
    el.style.setProperty('--c', color);
    Object.assign(el.style, { width: len + back + 'px', height: S * 0.46 + 'px', marginTop: -S * 0.23 + 'px' });
    const rot = `rotate(${Math.atan2(dy, dx) * 180 / Math.PI}deg)`;
    el.animate([{ transform: `${rot} scaleX(.2)`, opacity: 1 }, { transform: `${rot} scaleX(1)`, opacity: 1, offset: 0.25 }, { transform: `${rot} scaleX(1) scaleY(.7)`, opacity: 0.9, offset: 0.5 },
      { transform: `${rot} scaleX(1) scaleY(.1)`, opacity: 0 }], { duration: dur + 460, easing: 'ease-out' }).finished.then(() => el.remove());
    return;
  }
  const heart = st.trail === 'heart';
  for (let k = 1; k <= 3; k++) {
    const u = k / 4, s = u < 0.5 ? u * 2 : u * 2 - 1, f = u < 0.5 ? a : m, t = u < 0.5 ? m : b;
    const x = f.x + (t.x - f.x) * s + (Math.random() - 0.5) * S * 0.3, y = f.y + (t.y - f.y) * s - up;
    const sz = S * (heart ? 0.42 : 0.34 + Math.random() * 0.2);
    kp(heart ? 'symbol_01' : k % 2 ? 'star_04' : 'spark_05', x, y, sz, k === 2 ? '#ffffff' : st.c2 || color, [
      { transform: 'scale(.2) rotate(0)', opacity: 0 },
      { transform: 'scale(1.1) rotate(40deg)', opacity: 1, offset: 0.3 },
      { transform: `translateY(${heart ? -S * 0.6 : S * 0.35}px) scale(0) rotate(90deg)`, opacity: 0 },
    ], { duration: 460, delay: dur * u, easing: 'ease-out', fill: 'backwards' });
  }
}
// 맞은 칸: 하얀 빛이 번쩍 + 스킬마다 다른 그림이 퍼짐
function skHit(p, color) {
  const S = B.S, rot = Math.random() * 360;
  kp('light_02', p.x, p.y, S * 1.9, '#ffffff', [{ transform: 'scale(.3)', opacity: 1 }, { transform: 'scale(1.15)', opacity: 0 }], { duration: 240, easing: 'ease-out' });
  kp(skStyle.hit, p.x, p.y, S * 1.3, skStyle.c2 || color, [{ transform: `rotate(${rot}deg) scale(.2)`, opacity: 1 }, { transform: `rotate(${rot + 70}deg) scale(1.1)`, opacity: 0 }],
    { duration: 380, easing: 'ease-out' });
}
// 스킬 쓰는 동안 판 테두리가 친구 색으로 은은히 빛남 (그림자는 한 번만 그리고 투명도만 움직임). 돌려주는 함수로 끔
function skillAura(color) {
  const b = cachedRect(boardEl), a = cachedRect(app), S = B.S;
  const x = b.left - a.left, y = b.top - a.top;
  const el = addFx('skill-aura', x - 6, y - 6);
  Object.assign(el.style, { width: b.width + 12 + 'px', height: b.height + 12 + 'px' });
  el.style.setProperty('--c', color);
  el.innerHTML = '<i></i>';
  el.animate([{ opacity: 0, transform: 'scale(1.04)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 220, easing: 'ease-out', fill: 'forwards' });
  el.firstChild.animate([{ opacity: 1 }, { opacity: 0.45 }, { opacity: 1 }], { duration: 620, iterations: Infinity });
  // 테두리를 따라 반짝이 몇 개
  for (let k = 0; k < 8; k++) {
    const side = k % 4, u = Math.random();
    const px = side === 0 ? x + u * b.width : side === 1 ? x + b.width : side === 2 ? x + u * b.width : x;
    const py = side === 0 ? y : side === 1 ? y + u * b.height : side === 2 ? y + b.height : y + u * b.height;
    kp('star_04', px, py, S * 0.55, k % 2 ? color : '#ffffff', [{ transform: 'scale(0) rotate(0)', opacity: 1 }, { transform: 'scale(1.1) rotate(60deg)', opacity: 1, offset: 0.4 }, { transform: 'scale(0) rotate(120deg)', opacity: 0 }],
      { duration: 520, delay: k * 70, fill: 'backwards' });
  }
  return () => el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, fill: 'forwards' }).finished.then(() => el.remove());
}
// 스킬 마무리: 친구 색 큰 별 펑 + 하얀 고리 + 스킬마다 다른 반짝이
function skillFinish(ch, p) {
  const S = B.S, st = skStyle, c = ch.ring;
  flash(c, 0.22);
  Sound.play('sparkle', 1.2, 0.6);
  kx('explosion01', 'star_09', p.x, p.y, S * 3.4, c, [{ transform: 'scale(.2) rotate(0)', opacity: 1 }, { transform: 'scale(1.1) rotate(40deg)', opacity: 0 }], { duration: 520, easing: 'ease-out' });
  kp('circle_03', p.x, p.y, S * 6, '#ffffff', [{ transform: 'scale(.1)', opacity: 1 }, { transform: 'scale(1)', opacity: 0 }], { duration: 460, easing: 'cubic-bezier(.2,.8,.3,1)' });
  const ring = (n, colors, name = 'star_06', dist = S * 2.4) => {
    for (let k = 0; k < n; k++) {
      const ang = (k / n) * Math.PI * 2, dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist;
      kp(k % 2 ? 'star_04' : name, p.x, p.y, S * 0.7, colors[k % colors.length], [
        { transform: 'translate(0,0) scale(.3) rotate(0)', opacity: 1 },
        { transform: `translate(${dx * 0.8}px,${dy * 0.8}px) scale(1.1) rotate(120deg)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${dx}px,${dy}px) scale(0) rotate(200deg)`, opacity: 0 },
      ], { duration: 620, easing: 'cubic-bezier(.2,.8,.4,1)' });
    }
  };
  if (st.fin === 'hearts') {
    for (let k = 0; k < 7; k++) {
      const dx = (k - 3) * S * 0.45, rise = S * (1.6 + Math.random() * 1.2);
      kp('symbol_01', p.x + dx, p.y, S * (0.5 + Math.random() * 0.3), k % 2 ? '#ffffff' : st.c2 || c, [
        { transform: 'translate(0,0) scale(.2)', opacity: 0 },
        { transform: `translate(${-dx * 0.2}px,${-rise * 0.5}px) scale(1.1)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${dx * 0.3}px,${-rise}px) scale(.6)`, opacity: 0 },
      ], { duration: 820, delay: k * 50, easing: 'ease-out', fill: 'backwards' });
    }
  } else if (st.fin === 'fireworks') {
    ['#ffd84d', '#ff6b4a', '#ffffff'].forEach((col, k) => setTimeout(() => {
      const q = { x: p.x + (k - 1) * S * 1.6, y: p.y - S * (0.6 + (k % 2) * 0.8) };
      kp('circle_05', q.x, q.y, S * 2.2, col, [{ transform: 'scale(.2)', opacity: 1 }, { transform: 'scale(1.2)', opacity: 0 }], { duration: 360, easing: 'ease-out' });
      burst(q.x, q.y, col, 8);
      Sound.play('pop', 0.9 + k * 0.2, 0.6);
    }, k * 140));
  } else if (st.fin === 'cross') {
    [0, 90].forEach(r => kp('flare_01', p.x, p.y, S * 5, '#ffffff', [{ transform: `rotate(${r + 45}deg) scale(.2, .2)`, opacity: 1 }, { transform: `rotate(${r + 45}deg) scale(1.3, .5)`, opacity: 0 }], { duration: 420, easing: 'ease-out' }));
    ring(8, [c, '#ffffff']);
  } else if (st.fin === 'twirl') {
    kp('twirl_01', p.x, p.y, S * 4, c, [{ transform: 'scale(.3) rotate(0)', opacity: 1 }, { transform: 'scale(1.2) rotate(-280deg)', opacity: 0 }], { duration: 600, easing: 'ease-out' });
    ring(8, ['#ffffff', c], 'symbol_01');
  } else if (st.fin === 'rainbow') ring(12, RAINBOW);
  else ring(10, [c, '#ffffff', st.c2 || c]);
}

// ---------- 스킬 쓸 때 친구가 판 위에 나와서 직접 움직임 (입은 옷 그대로) ----------
// points를 차례로 콩콩 뛰어다니고, 도착할 때마다 onHit(i). hop: 뛰는 높이(칸), dur: 한 번 뛰는 시간
async function actor(ch, points, { dur = 170, hop = 0.8, size = 1.5, onHit = null } = {}) {
  if (!points.length) return;
  const S = B.S, im = new Image();
  im.src = artOf(ch.id);
  im.className = 'actor';
  im.style.width = S * size + 'px';
  fx.appendChild(im);
  const place = (p, extra = '') => `translate(${p.x}px, ${p.y}px) translate(-50%, -78%) ${extra}`;
  let prev = { x: points[0].x, y: cachedRect(app).height + S }; // 화면 아래에서 폴짝 등장
  for (const [i, p] of points.entries()) {
    const f = p.x < prev.x - 1 ? -1 : 1;
    const mid = { x: (prev.x + p.x) / 2, y: Math.min(prev.y, p.y) - S * hop };
    skTrail(prev, mid, p, i ? dur : 280, ch.ring, size);
    await im.animate([
      { transform: place(prev, `scale(${f}, 1)`) },
      { transform: place(mid, `scale(${f * 0.9}, 1.12)`), offset: 0.5 },
      { transform: place(p, `scale(${f * 1.15}, .82)`) },
    ], { duration: i ? dur : 280, easing: 'ease-in-out', fill: 'forwards' }).finished;
    onHit?.(i, p);
    prev = p;
  }
  await im.animate([{ transform: place(prev) }, { transform: place({ x: prev.x, y: prev.y - S * 2 }, 'scale(.6)'), opacity: 0 }],
    { duration: 260, easing: 'ease-in', fill: 'forwards' }).finished;
  im.remove();
}
// 친구가 닿은 칸: 찌그러지며 번쩍 + 별이 튐
function actorHit(r, c, color, i = 0) {
  const t = B.grid[r]?.[c];
  if (t?.inner) squish(t);
  const p = tileCenter(r, c);
  skHit(p, color);
  burst(p.x, p.y, color, 3);
  Sound.pop(Math.min(i, 11));
}
// 랏코: 십자 가운데에 폴짝 나타나 칼을 가로로 한 번, 세로로 한 번 휘두름. 칼이 지나간 자리에 하얀 칼자국이 남고 칸이 차례로 베임
async function rakkoSlash(ch, r0, c0) {
  const S = B.S, p = tileCenter(r0, c0), im = new Image();
  im.src = artOf(ch.id);
  im.className = 'actor';
  im.style.width = S * 1.7 + 'px';
  fx.appendChild(im);
  const at = (extra = '') => `translate(${p.x}px, ${p.y}px) translate(-50%, -78%) ${extra}`;
  await im.animate([{ transform: at('scale(.2)'), opacity: 0 }, { transform: at('scale(1.15, .85)'), opacity: 1, offset: 0.6 }, { transform: at() }],
    { duration: 260, easing: 'ease-out', fill: 'forwards' }).finished;
  const lines = [[[r0, 0], [r0, COLS - 1], [...Array(COLS).keys()].map(c => [r0, c])], [[0, c0], [ROWS - 1, c0], [...Array(ROWS).keys()].map(r => [r, c0])]];
  for (const [k, [from, to, cells]] of lines.entries()) {
    // 휘두르기 전 살짝 몸을 뒤로 젖힘
    await im.animate([{ transform: at() }, { transform: at(`rotate(${k ? 10 : -12}deg) scale(1.05, .95)`) }], { duration: 90, easing: 'ease-out', fill: 'forwards' }).finished;
    slashLine(tileCenter(...from), tileCenter(...to), cells, ch.ring);
    im.animate([{ transform: at(`rotate(${k ? -16 : 18}deg) scale(1.1, .9)`) }, { transform: at() }], { duration: 220, easing: 'ease-out', fill: 'forwards' });
    await sleep(260);
  }
  await im.animate([{ transform: at() }, { transform: at('translateY(-30%) scale(.6)'), opacity: 0 }], { duration: 240, easing: 'ease-in', fill: 'forwards' }).finished;
  im.remove();
}
// 칼자국 한 줄: a→b로 하얀 빛줄기가 쫙 그어지고, 칼이 그 위를 휙 지나가며 칸을 차례로 벰
function slashLine(a, b, cells, color) {
  const S = B.S, dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) + S, ang = Math.atan2(dy, dx) * 180 / Math.PI;
  const sx = a.x - (dx / Math.hypot(dx, dy)) * S / 2, sy = a.y - (dy / Math.hypot(dx, dy)) * S / 2;
  const cut = document.createElement('i');
  cut.className = 'slash-cut';
  Object.assign(cut.style, { left: sx + 'px', top: sy + 'px', width: len + 'px', height: S * 0.42 + 'px', transform: `translateY(-50%) rotate(${ang}deg)` });
  fx.appendChild(cut);
  cut.animate([{ clipPath: 'inset(0 100% 0 0)', opacity: 1 }, { clipPath: 'inset(0 0 0 0)', opacity: 1, offset: 0.35 }, { clipPath: 'inset(0 0 0 0)', opacity: 0, transform: `translateY(-50%) rotate(${ang}deg) scaleY(.2)` }],
    { duration: 420, easing: 'ease-out', fill: 'forwards' }).finished.then(() => cut.remove());
  // 줄 아이템처럼: 칼을 따라 빛기둥이 쭉 뻗고, 은은한 빛이 잠깐 남았다가 사라짐
  const rot = `rotate(${ang}deg)`;
  const tr = addFx('rtrail', sx, sy);
  Object.assign(tr.style, { width: len + 'px', height: S * 0.9 + 'px', marginTop: -S * 0.45 + 'px', transformOrigin: 'left center' });
  tr.animate([{ transform: `${rot} scaleX(0)`, opacity: 1 }, { transform: `${rot} scaleX(1)`, opacity: 1, offset: 0.3 }, { transform: `${rot} scaleX(1) scaleY(.15)`, opacity: 0 }],
    { duration: 540, easing: 'ease-out' }).finished.then(() => tr.remove());
  const after = addFx('afterline', sx, sy);
  Object.assign(after.style, { width: len + 'px', transformOrigin: 'left center', transform: rot });
  after.animate([{ opacity: 0 }, { opacity: 0.9, offset: 0.25 }, { opacity: 0 }], { duration: 700, easing: 'ease-out' }).finished.then(() => after.remove());
  const sw = new Image();
  sw.src = ITEM('rocket');
  sw.className = 'slash-sword';
  sw.style.width = S * 1.1 + 'px';
  fx.appendChild(sw);
  const pos = (x, y) => `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${ang + 45}deg)`; // 그림은 칼끝이 오른쪽 위
  sw.animate([{ transform: pos(sx, sy), opacity: 0 }, { opacity: 1, offset: 0.1 }, { opacity: 1, offset: 0.85 }, { transform: pos(sx + dx + (dx / Math.hypot(dx, dy)) * S, sy + dy + (dy / Math.hypot(dx, dy)) * S), opacity: 0 }],
    { duration: 160, easing: 'cubic-bezier(.3,0,.2,1)', fill: 'forwards' }).finished.then(() => sw.remove());
  Sound.play('swap', 1.4, 0.9);
  shake(5, 180);
  cells.forEach(([r, c], i) => setTimeout(() => {
    actorHit(r, c, color, i % 7);
    const p = tileCenter(r, c); // 지나간 칸마다 줄 아이템 같은 불꽃
    kp('spark_05', p.x, p.y, S * 1.1, '#bfe9ff', [{ transform: `rotate(${ang + 90}deg) scale(.5)`, opacity: 1 }, { transform: `rotate(${ang + 90}deg) scale(1.2)`, opacity: 0 }], { duration: 260 });
  }, 20 + i * (130 / cells.length)));
}
// 칸 목록 → 친구가 지나갈 길
const linePath = cs => cs.map(([r, c]) => tileCenter(r, c));

async function useSkill(k) {
  const life = B.mode === 'life';
  const ch = life ? CHARS[L.helper] : teamCh(k);
  if (B.busy || B.over || !ch) return;
  const btn = life ? $('#lhHelper') : $('#party').children[k];
  if ((life ? L.hg : B.gauge[k]) < skillNeed(ch.id)) {
    Sound.play('bad', 1.2, 0.5);
    btn.animate([{ transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }], { duration: 180 });
    return;
  }
  B.busy = true;
  Daily.add('skill');
  B.inSkill = true; // 스킬로 깨진 칸(이어지는 연쇄 포함)은 게이지를 안 채움: 스킬이 스킬을 부르는 무한 반복 막기
  clearSel();
  Tutor.hideHand();
  if (life) { L.hg = 0; Life.hud(); } else { B.gauge[k] = 0; updateGauges(); }
  const sk = skillOf(ch.id); // 장착한 스킬
  skStyle = SKFX[sk.style || sk.id] || SKFX.random8;
  let lastTap = 0;
  const onTap = () => { const now = performance.now(); if (now - lastTap < 400) { FastFwd.on(); hint.remove(); } lastTap = now; };
  window.addEventListener('pointerdown', onTap, { capture: true });
  const hint = document.createElement('div');
  hint.className = 'skip-hint';
  hint.textContent = '두 번 톡 ▶▶ 빨리 감기';
  app.appendChild(hint);
  await cutIn(ch);
  const auraOff = skillAura(ch.ring);
  let finAt = null; // 마무리 펑 자리 (없으면 맞은 칸들 가운데)
  // 일상 퍼즐: 이동(시간)을 더 주는 스킬
  const bonusMoves = (n, color) => {
    if (L.st.time) L.time += n * 3; else L.moves += n;
    Life.hud();
    const p = centerOf($('.lh-limit'));
    floatNum(p.x, p.y, L.st.time ? `+${n * 3}초` : `+${n}`, color, 'crit');
    Sound.play('heal', 1.2, 0.9);
  };
  const id = sk.id;
  let cells = [];
  if (id === 'random8') {
    // 치이카와: 8칸을 울면서 콩콩 뛰어다니며 휘두름
    cells = pickTiles(8, () => true);
    await actor(ch, linePath(cells), { onHit: i => actorHit(...cells[i], ch.ring, i) });
  } else if (id === 'rows2') {
    // 하치와레: 두 줄을 쓩 미끄러지며 지나감 (두 번째 줄은 반대로)
    const rows = [...Array(ROWS).keys()].filter(r => [...Array(COLS).keys()].some(c => !hole(r, c))).sort(() => Math.random() - 0.5).slice(0, 2);
    rows.forEach((r, j) => { for (let c = 0; c < COLS; c++) cells.push([r, j ? COLS - 1 - c : c]); });
    await actor(ch, linePath(cells), { dur: 55, hop: 0.15, onHit: i => actorHit(...cells[i], ch.ring, i % 7) });
  } else if (id === 'cross') {
    // 랏코: 굵은 십자로 베고 괴물에게 큰 한 방
    const r0 = 1 + Math.floor(Math.random() * (ROWS - 2)), c0 = 1 + Math.floor(Math.random() * (COLS - 2));
    for (let d = -1; d <= 1; d++) {
      for (let i = 0; i < COLS; i++) cells.push([r0 + d, i]);
      for (let i = 0; i < ROWS; i++) cells.push([i, c0 + d]);
    }
    // 랏코가 십자 가운데에 서서 칼로 가로 한 번, 세로 한 번 슉슉 벰
    await rakkoSlash(ch, r0, c0);
    if (!life) {
      const eff = attrMult(ch.attr, curWave().a);
      const m = centerOf(monImg());
      Juice.zoom(m.x, m.y, 1.1, 500);
      hitMonster(Math.round(ch.dmg * 10 * eff * Meta.mult(ch.id)), ch, true, 0, eff);
      delayMons(2);
    }
  } else if (id === 'bighit' && life) {
    // 일상: 제일 귀찮은 칸에 폭탄을 꽂음
    const tg = Board.pickTarget(B.grid) || pickTiles(1)[0];
    if (tg) await actor(ch, [(finAt = tileCenter(tg[0], tg[1]))], { hop: 1.6 });
    if (tg && B.grid[tg[0]][tg[1]] && !B.grid[tg[0]][tg[1]].block) { const t = B.grid[tg[0]][tg[1]]; t.special = 'bomb'; t.type = -1; refreshTile(t); squish(t); }
    cells = tg ? [tg] : [];
    await sleep(200);
  } else if (id === 'bighit') {
    const eff = attrMult(ch.attr, curWave().a);
    const m = (finAt = centerOf(monImg()));
    await actor(ch, [m], { hop: 2.2, dur: 320, size: 1.8 }); // 우사기: 괴물에게 높이 뛰어올라 쾅
    fxImage('boom', m.x, m.y, B.S * 4, 500);
    flash('#fff6a8', 0.5);
    shake(14, 420);
    hitMonster(Math.round(ch.dmg * 18 * eff), ch, true, 0, eff);
    await sleep(500);
  } else if (id === 'convert6') {
    const into = life ? Math.max(0, B.team.indexOf(L.helper)) : k;
    // 모몽가: 6칸을 콩콩 다니며 닿는 칸을 모몽가로 바꿈
    const picks = pickTiles(6, t => !t.special && t.type >= 0 && t.type !== into);
    picks.forEach(([r, c]) => (B.grid[r][c].type = into));
    await actor(ch, linePath(picks), { onHit: i => { const [r, c] = picks[i]; refreshTile(B.grid[r][c]); actorHit(r, c, ch.ring, i); } });
    await sleep(150);
  } else if (life && (id === 'heal40' || id === 'ramen' || id === 'stall')) {
    const p = (finAt = centerOf($('.lh-limit')));
    await actor(ch, [p, { x: p.x + B.S * 0.6, y: p.y }, p], { hop: 0.6, dur: 200, size: 1.2 });
    bonusMoves(id === 'heal40' ? 4 : 3, ch.ring);
    await sleep(400);
  } else if (id === 'heal40') {
    const hp = (finAt = centerOf($('#teamHp')));
    await actor(ch, [hp, { x: hp.x + B.S, y: hp.y }], { hop: 0.7, dur: 220, size: 1.2 }); // 카니: 체력바 위에서 통통
    const amt = Math.round(B.teamMax * 0.25); // 회복이 너무 세면 토벌이 '안 다치거나 두 방에 끝'이 돼서 25%로
    B.teamHp = Math.min(B.teamMax, B.teamHp + amt);
    updateTeam();
    Sound.play('heal', 1, 0.9);
    const p = centerOf($('#teamHp'));
    burst(p.x, p.y, '#7fd17a', 14);
    floatNum(p.x, p.y - 10, `+${amt}`, '#3fae4f', 'crit');
    await sleep(400);
  } else if (id === 'ramen') {
    const hp = (finAt = centerOf($('#teamHp')));
    await actor(ch, [hp, { x: hp.x - B.S, y: hp.y }, hp], { hop: 0.7, dur: 200, size: 1.2 }); // 시사: 간식 들고 통통
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
        { duration: 380, easing: 'cubic-bezier(.5,0,1,1)' }).finished.then(() => { s.remove(); skHit(p, ch.ring); });
      // 떨어지는 별 뒤로 반짝이 (점점 빨라지는 별을 따라가게 늦춰 둠)
      [0.3, 0.55, 0.8].forEach((u, j) => kp(j % 2 ? 'spark_05' : 'star_04', p.x + 140 * (1 - u), p.y - 420 * (1 - u), B.S * 0.5, j % 2 ? '#ffffff' : '#fff3a8',
        [{ transform: 'scale(.3)', opacity: 0 }, { transform: 'scale(1.1)', opacity: 1, offset: 0.2 }, { transform: 'translateY(12px) scale(0)', opacity: 0 }],
        { duration: 420, delay: 380 * Math.sqrt(u), fill: 'backwards' }));
      await sleep(130);
    }
    await sleep(260);
    spots.forEach(([r, c]) => { const t = B.grid[r][c]; t.special = 'bomb'; t.type = -1; refreshTile(t); });
    cells = spots;
  } else if (id === 'cols2') {
    // 두 세로줄을 위아래로 쓩 (두 번째 줄은 반대로)
    const cs = [...Array(COLS).keys()].filter(c => [...Array(ROWS).keys()].some(r => !hole(r, c))).sort(() => Math.random() - 0.5).slice(0, 2);
    cs.forEach((c, j) => { for (let r = 0; r < ROWS; r++) cells.push([j ? ROWS - 1 - r : r, c]); });
    await actor(ch, linePath(cells), { dur: 55, hop: 0.15, onHit: i => actorHit(...cells[i], ch.ring, i % 7) });
  } else if (id === 'stall') {
    const cd = (finAt = centerOf(cdEl()));
    await actor(ch, [cd, { x: cd.x - B.S * 0.7, y: cd.y }, { x: cd.x + B.S * 0.7, y: cd.y }, cd], { hop: 0.7, dur: 180, size: 1.2 }); // 고블린: 옴 빰 빰 춤
    delayMons(3);
    const eff = attrMult(ch.attr, curWave().a);
    hitMonster(Math.round(ch.dmg * 4 * eff), ch, false, 0, eff);
    await sleep(400);
  } else if (id === 'cheer') {
    // 판 가운데를 좌우로 데굴데굴 지나가며 섞음
    const mid = ROWS >> 1;
    await actor(ch, [tileCenter(mid, 0), tileCenter(mid, COLS >> 1), tileCenter(mid, COLS - 1)], { hop: 0.5, dur: 200 });
    Board.shuffle(B.grid);
    await settleAll(420);
    if (life) bonusMoves(1, ch.ring);
    else { B.gauge = B.gauge.map((g, j) => (j === k ? g : g + 4)); updateGauges(); }
    Sound.play('sparkle', 1.1, 0.8);
  } else if (id === 'rainbow') {
    const [rc] = pickTiles(1);
    if (rc) await actor(ch, [(finAt = tileCenter(rc[0], rc[1]))], { hop: 1.2, dur: 260 }); // 쿠리만쥬: 폴짝 와서 경단 두고 감
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
  } else if (sk.fx) {
    // ---------- Lv4·Lv7 스킬: 이미 있는 효과를 짜 맞춤 ----------
    const ITEMS_ANY = ['h', 'v', 'bomb', 'plane'];
    const lifeMoves = n => bonusMoves(n, ch.ring);
    const mixBoard = async () => {
      const mid = ROWS >> 1;
      await actor(ch, [tileCenter(mid, 0), tileCenter(mid, COLS >> 1), tileCenter(mid, COLS - 1)], { hop: 0.5, dur: 200 });
      Board.shuffle(B.grid);
      await settleAll(420);
    };
    if (sk.fx === 'drop') {
      if (sk.shuffle) await mixBoard();
      const kinds = sk.items.map(x => (x === 'any' ? ITEMS_ANY[Math.floor(Math.random() * 4)] : x));
      const spots = pickTiles(kinds.length);
      await actor(ch, linePath(spots), { onHit: i => {
        const [r, c] = spots[i], t = B.grid[r][c];
        t.special = kinds[i]; t.type = -1; refreshTile(t); squish(t); actorHit(r, c, ch.ring, i);
      } });
      Sound.play('special', 1.2, 0.8);
      if (sk.fire) cells = spots; // 유성우: 놓자마자 터짐
      await sleep(250);
    } else if (sk.fx === 'blocks') {
      // 장애물·잡초를 전부 한 대씩. 없으면 구슬 10개
      Board.each(B.grid, (t, r, c) => { if (t.block || t.lock || Board.floor?.[r][c] > 0) cells.push([r, c]); });
      if (Board.floor) for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (Board.floor[r][c] > 0 && !cells.some(([a, b]) => a === r && b === c)) cells.push([r, c]);
      if (!cells.length) cells = pickTiles(10);
      const path = cells.slice().sort(() => Math.random() - 0.5).slice(0, 10);
      await actor(ch, linePath(path), { dur: 120, onHit: i => actorHit(...path[i], ch.ring, i) });
    } else if (sk.fx === 'lines') {
      const okRows = [...Array(ROWS).keys()].filter(r => [...Array(COLS).keys()].some(c => !hole(r, c))).sort(() => Math.random() - 0.5);
      const okCols = [...Array(COLS).keys()].filter(c => [...Array(ROWS).keys()].some(r => !hole(r, c))).sort(() => Math.random() - 0.5);
      okRows.slice(0, sk.rows).forEach(r => { for (let c = 0; c < COLS; c++) cells.push([r, c]); });
      okCols.slice(0, sk.cols).forEach((c, j) => { for (let r = 0; r < ROWS; r++) cells.push([j ? ROWS - 1 - r : r, c]); });
      await actor(ch, linePath(cells), { dur: 45, hop: 0.15, onHit: i => actorHit(...cells[i], ch.ring, i % 7) });
    } else if (sk.fx === 'convert') {
      const into = life ? Math.max(0, B.team.indexOf(L.helper)) : k;
      const picks = pickTiles(sk.n, t => !t.special && t.type >= 0 && t.type !== into);
      picks.forEach(([r, c]) => (B.grid[r][c].type = into));
      await actor(ch, linePath(picks), { dur: 140, onHit: i => { const [r, c] = picks[i]; refreshTile(B.grid[r][c]); actorHit(r, c, ch.ring, i); } });
      if (sk.heal && !life) { B.teamHp = Math.min(B.teamMax, B.teamHp + Math.round(B.teamMax * sk.heal)); updateTeam(); Sound.play('heal', 1.1, 0.8); }
      await sleep(150);
    } else if (life && sk.life) {
      // 일상 퍼즐에서는 괴물이 없으니 이동(시간)으로 바꿔 줌
      const p = (finAt = centerOf($('.lh-limit')));
      await actor(ch, [p, { x: p.x + B.S * 0.6, y: p.y }, p], { hop: 0.6, dur: 200, size: 1.2 });
      if (sk.shuffle) { Board.shuffle(B.grid); await settleAll(420); }
      lifeMoves(sk.life);
      await sleep(400);
    } else if (sk.fx === 'bighit' && life) {
      // 일상: 귀찮은 칸 두 곳에 폭탄
      const spots = [Board.pickTarget(B.grid), Board.pickTarget(B.grid)].filter(Boolean);
      if (spots.length) await actor(ch, linePath(spots), { hop: 1.4, onHit: i => { const [r, c] = spots[i], t = B.grid[r][c]; if (t && !t.block) { t.special = 'bomb'; t.type = -1; refreshTile(t); squish(t); } } });
      await sleep(200);
    } else if (sk.fx === 'bighit') {
      const eff = attrMult(ch.attr, curWave().a);
      const m = (finAt = centerOf(monImg()));
      await actor(ch, [m], { hop: 2.2, dur: 320, size: 1.8 });
      fxImage('boom', m.x, m.y, B.S * 4, 500);
      flash('#fff6a8', 0.5);
      shake(14, 420);
      hitMonster(Math.round(ch.dmg * sk.mult * eff * Meta.mult(ch.id)), ch, true, 0, eff);
      await sleep(500);
    } else if (sk.fx === 'delay') {
      const cd = (finAt = centerOf(cdEl()));
      await actor(ch, [cd, { x: cd.x - B.S * 0.7, y: cd.y }, { x: cd.x + B.S * 0.7, y: cd.y }, cd], { hop: 0.7, dur: 180, size: 1.2 });
      delayMons(sk.n);
      if (sk.hit) { const eff = attrMult(ch.attr, curWave().a); hitMonster(Math.round(ch.dmg * sk.hit * eff), ch, false, 0, eff); }
      await sleep(400);
    } else if (sk.fx === 'gauge' || sk.fx === 'half' || sk.fx === 'rally' || sk.fx === 'heal') {
      const hp = (finAt = centerOf($('#teamHp')));
      await actor(ch, [hp, { x: hp.x + B.S, y: hp.y }, hp], { hop: 0.7, dur: 200, size: 1.2 });
      if (sk.shuffle) { Board.shuffle(B.grid); await settleAll(420); }
      if (sk.heal) {
        const amt = Math.round(B.teamMax * sk.heal);
        B.teamHp = Math.min(B.teamMax, B.teamHp + amt);
        updateTeam();
        floatNum(hp.x, hp.y - 10, `+${amt}`, '#3fae4f', 'crit');
        Sound.play('heal', 1.1, 0.9);
      }
      const plus = sk.fx === 'gauge' ? sk.n : sk.fx === 'rally' ? 5 : sk.gauge || 0;
      if (plus) B.gauge = B.gauge.map((g, j) => (j === k || j >= B.real ? g : g + plus));
      if (sk.fx === 'half') B.gauge = B.gauge.map((g, j) => (j === k || j >= B.real ? g : Math.max(g, Math.ceil(skillNeed(teamCh(j).id) / 2))));
      if (sk.fx === 'rally') { B.rally = 3; banner('공격 ×1.3!', 450); }
      updateGauges();
      Sound.play('sparkle', 1.1, 0.8);
      await sleep(400);
    }
  }
  auraOff();
  if (!finAt && cells.length) {
    const ps = cells.map(([r, c]) => tileCenter(r, c));
    finAt = { x: ps.reduce((a, q) => a + q.x, 0) / ps.length, y: ps.reduce((a, q) => a + q.y, 0) / ps.length };
  }
  if (!finAt) { const b = cachedRect(boardEl), a = cachedRect(app); finAt = { x: b.left - a.left + b.width / 2, y: b.top - a.top + b.height / 2 }; }
  skillFinish(ch, finAt);
  window.removeEventListener('pointerdown', onTap, { capture: true });
  hint.remove();
  FastFwd.off();
  await cascade(null, cells);
  await Promise.all(B.pending);
  B.pending = [];
  B.inSkill = false;
  if (life) { Life.hud(); await Life.check(); } else if (B.monHp <= 0) await monsterDefeated();
  if (!B.over) { B.busy = false; if (!Tutor.lesson()) setTimeout(autoSkill, 300); }
}

// 오토: 게이지가 꽉 찬 친구가 있으면 알아서 스킬
function autoSkill() {
  if (B.busy || B.over || !$('#battle').classList.contains('active')) return;
  if (Tutor.skillSpot()) return; // 처음 게이지가 꽉 차면 눌러 보라고 비춰 줌
  if (!Save.data.autoSkill) return;
  if (B.mode === 'life') { if (L.helper != null && L.hg >= skillNeed(CHARS[L.helper].id)) useSkill(0); return; }
  const k = B.team.findIndex((_, j) => j < B.real && B.gauge[j] >= skillNeed(teamCh(j).id));
  if (k >= 0) useSkill(k);
}
const updateAutoBtn = () => document.querySelectorAll('.btn-auto').forEach(b => b.classList.toggle('on', !!Save.data.autoSkill));
document.querySelectorAll('.btn-auto').forEach(b => (b.onclick = () => { Save.data.autoSkill = !Save.data.autoSkill; Save.save(); updateAutoBtn(); Sound.play('click'); autoSkill(); }));
updateAutoBtn();

// ---------- 화면 전환: 크레용 종이가 쓱 덮었다 걷힘 ----------
let wiping = false;
async function go(fn) {
  if (wiping) return;
  wiping = true;
  if (typeof Spot !== 'undefined') Spot.close(); // 넘어가는 순간 떠 있던 안내는 닫음 (화면 전환·친구 고르기 창 위에 겹치지 않게)
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

// 끝나고 나오는 친구: 토벌은 가장 많이 때린(회복한) MVP, 일상은 데려간 친구
function mvp() {
  if (B.mode === 'life') return CHARS[L.helper] || CHARS[0];
  const squad = B.team.slice(0, B.real).map(k => CHARS[k]);
  return squad.reduce((a, c) => ((B.dmgBy[c.id] || 0) > (B.dmgBy[a.id] || 0) ? c : a), squad[0]);
}
// 자주 나오는 클리어 도장은 손그림 글자 그림으로 (판마다 다른 문구는 글자 그대로)
const SLAM_ART = { '토벌<br>성공!': 'battle', '제초<br>끝!!': 'weed', '상자<br>다 뜯었다!': 'box', '거품<br>싹싹!': 'bubble', '배달<br>완료!': 'ing',
  '리본<br>풀었다!': 'lock', '시럽<br>듬뿍!': 'syrup', '모으기<br>끝!': 'char', '목표<br>달성!': 'score', '검정<br>합격!': 'exam', '클리어!': 'clear' };
Object.values(SLAM_ART).forEach(n => (new Image().src = `assets/img/ui/words/${n}.webp`)); // 도장이 늦게 뜨지 않게 미리
async function clearShow(text = '토벌<br>성공!') {
  const el = document.createElement('div');
  el.className = 'clear-show';
  const ch = mvp();
  el.innerHTML = `<div class="dim"></div>
    <div class="slam${SLAM_ART[text] ? ' art' : ''}">${SLAM_ART[text] ? `<img src="assets/img/ui/words/${SLAM_ART[text]}.webp" alt="">` : text}</div>
    <img class="hero" src="${artOf(ch.id)}"><div class="hero-say">${B.mode === 'battle' ? '<b class="mvp">MVP</b>' : ''}${lineOf(ch.id)}</div>`;
  app.appendChild(el);
  const [dim, stamp, hero, say] = el.children;
  // 차례가 올 때까지 숨겨 둠 (안 그러면 제자리에 먼저 한 번 보였다가, 애니메이션이 시작되며 다시 나옴)
  stamp.style.opacity = hero.style.opacity = say.style.opacity = 0;
  const longest = Math.max(...text.split('<br>').map(l => [...l].length));
  stamp.style.fontSize = Math.min(89, Math.floor((app.clientWidth * 0.82) / longest)) + 'px';
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
  hero.style.opacity = say.style.opacity = '';
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
  // 일상 퍼즐: 점수 막대 위에 '피버 ×1.5 3턴'(시간 판은 초) 그림 글자. 바뀔 때만 다시 그림 (시계가 0.1초마다 부름)
  if (B.mode === 'life' && B.fever) {
    let fb = $('#lhScore .fever-badge');
    if (!fb) { fb = document.createElement('span'); fb.className = 'fever-badge'; $('#lhScore').appendChild(fb); }
    const n = L.st.time ? Math.ceil(L.feverT) : B.fever;
    const html = `<img src="${CIMG('fbadge')}" alt="피버 ×1.5">` + [...String(n)].map(d => `<img class="d" src="${CIMG('f' + d)}">`).join('') + `<img class="d" src="${CIMG(L.st.time ? 'fsec' : 'fturn')}" alt="${L.st.time ? '초' : '턴'}">`;
    if (fb._h !== html) fb.innerHTML = fb._h = html;
  }
}
// 일상 퍼즐: 점수 ×1.5 (이동 판은 3턴, 시간 판은 10초) + 첫 턴에 아이템 하나 선물
async function feverShow() {
  const life = B.mode === 'life';
  B.fever = 3;
  if (life) { L.feverGift = true; if (L.st.time) L.feverT = 10; }
  updateFever();
  // 우후~! 빛줄기가 돌고, 파자마 파티즈가 통통 튀어 올라 춤추고, 하트·별이 쏟아짐
  const el = document.createElement('div');
  el.className = 'fever-show';
  el.innerHTML = `<div class="rays"></div><img src="assets/img/art/pajama_uwawa.png"><img class="fever-txt" src="${CIMG('w_fever')}" alt="피버 타임!"><img class="fever-sub" src="${CIMG(life ? (L.st.time ? 'fsub_score10' : 'fsub_score') : 'fsub_atk')}" alt="${life ? '점수' : '공격'} ×1.5">`;
  app.appendChild(el);
  const [rays, img, txt, sub] = el.children;
  // 스킬 컷인처럼 뒤 화면을 어둡게 (맨 뒤에 깔림)
  const dim = document.createElement('div');
  dim.className = 'dim';
  el.appendChild(dim);
  dim.animate([{ opacity: 0 }, { opacity: 0.6 }], { duration: 160, fill: 'forwards' });
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

// ---------- 라면 가게: 갑옷 아저씨네 가게. 시사가 아르바이트하고, 친구들이 앉아 있고, 가끔 손님이 놀러 옴 ----------
// 토벌을 새로 깰 때마다 한 그릇 (곱빼기: 다음 토벌 체력 150 / 진한 국물: 스킬 게이지 반부터)
// 라멘 갑옷 씨: 가게 규칙에 엄격한 사장. 아이들은 이름 대신 생김새로 부름
const MASTER_LINES = ['왔군. 주문은 순서대로.', '면 굵기, 기름 양, 국물 진하기. 정하고 말해라.', '가게 규칙은 지켜라.', '토벌 하나 끝냈으면 한 그릇 먹고 가라.', '국물은 새벽부터 끓인다.', '하얀 녀석, 오늘도 왔군.', '시사 녀석… 요즘 손이 빨라졌다.'];
const SHISA_LINES = ['어서 오세요~!', '여기서 수행 중이에요! 사부님 라멘은 맛있는 시사~!', '주문 들어갑니다~!', '언젠가 토벌에도 따라가 보고 싶어요…!'];
function shopSay(el, text) {
  const say = $('#shopSay'), r = el.getBoundingClientRect(), sc = $('#shopScene').getBoundingClientRect();
  say.textContent = text;
  const hw = say.offsetWidth / 2 + 6, h = say.offsetHeight + 6; // 말풍선 크기만큼 안쪽으로 (가게 밖으로 잘리지 않게)
  say.style.left = Math.max(hw, Math.min(sc.width - hw, r.left - sc.left + r.width / 2)) + 'px';
  say.style.top = Math.max(h, r.top - sc.top - 8) + 'px';
  say.getAnimations().forEach(a => a.cancel());
  say.animate([{ opacity: 0, transform: 'translate(-50%, -90%) scale(.7)' }, { opacity: 1, transform: 'translate(-50%, -100%) scale(1)', offset: 0.12 }, { opacity: 1, transform: 'translate(-50%, -100%)', offset: 0.88 }, { opacity: 0, transform: 'translate(-50%, -100%)' }], { duration: 2600, fill: 'forwards' });
  el.animate([{ translate: '0 0' }, { translate: '0 -8px' }, { translate: '0 0' }], { duration: 260 }); // transform을 덮으면 가운데 맞춤(translateX(-50%))이 풀려 반 칸 밀림
  Sound.play('pop', 1.1 + Math.random() * 0.3, 0.6);
}
// 문가 손님이 하는 말 (간식을 모아 오면 친구가 됨)
const RECRUIT_ASK = { momonga: '딸기 파르페 가져와. 많이. 그럼 같이 다녀 줄 수도 있고~ 흥.', kurimanju: '……(경단 쪽을 힐끔)', goblin: '옴 빰 빰~ (주먹밥을 가리킨다)' };
function openRamen() {
  show('ramen');
  Meta.coinUI();
  Sound.music('ramen');
  const scene = $('#shopScene');
  scene.querySelectorAll('.guest, .seat').forEach(e => e.remove());
  let mi = 0, si = 0;
  $('#shopMaster').onclick = e => shopSay(e.currentTarget, MASTER_LINES[mi++ % MASTER_LINES.length]);
  // 시사: 아르바이트 중. 3번째 일상(라멘 재료 나르기)을 도와주면 친구가 됨
  const shisa = $('#shopShisa');
  shisa.onclick = () => shopSay(shisa, Meta.owned('shisa') ? lineOf('shisa') : SHISA_LINES[si++ % SHISA_LINES.length]);
  // 카운터에 앉은 친구들 (가진 친구 중 셋)
  const sitters = CHARS.filter(c => Meta.owned(c.id) && c.id !== 'shisa').sort(() => Math.random() - 0.5).slice(0, 3);
  sitters.forEach((c, k) => {
    const el = document.createElement('button');
    el.className = 'seat';
    el.style.left = [22, 50, 78][k] + '%';
    el.innerHTML = `<img src="${art(c.id)}" draggable="false"><i class="stool"></i>`;
    el.onclick = () => { shopSay(el, lineOf(c.id)); Sound.voice(c.id, 'pick'); };
    scene.appendChild(el);
  });
  // 문가에 기웃거리는 손님: 좋아하는 간식을 모아 오면 친구가 됨
  const gid = ['momonga', 'kurimanju', 'goblin'].find(id => !Meta.owned(id) && CHARS[charIdx(id)]);
  if (gid) {
    const r = RECRUIT[gid], c = CHARS[charIdx(gid)];
    const el = document.createElement('button');
    el.className = 'guest' + (Meta.canRecruit(gid) ? ' ready' : '');
    el.innerHTML = `<img src="${art(gid)}" draggable="false"><span class="tbadge${Meta.canRecruit(gid) ? ' ready' : ''}"><img src="${ITEM(r.treat)}">${Math.min(Save.data.treats[r.treat] || 0, r.n)}/${r.n}</span>`;
    el.onclick = async () => {
      if (Meta.canRecruit(gid)) { Sound.play('open'); await Meta.recruit(gid); openRamen(); return; }
      shopSay(el, RECRUIT_ASK[gid] || `${TREATS[r.treat]} ${r.n}개…`);
    };
    scene.appendChild(el);
    el.animate([{ transform: 'translateX(-60px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 500, delay: 300, easing: 'ease-out', fill: 'backwards' });
  }
  renderRamenMenu();
  setTimeout(() => $('#ramen').classList.contains('active') && shopSay($('#shopMaster'), Save.data.buff ? '먹던 거부터 다 먹고 와라.' : ramenFree() ? '왔군. 한 그릇은 서비스다.' : '왔군. 한 그릇 먹고 가라.'), 450);
}
// 라멘 메뉴: 모험 지도를 at판까지 깨면 열림. mode b = 다음 토벌, l = 다음 일상 퍼즐에 효과
// 새로 깬 판이 생기면 다음 한 그릇은 서비스(공짜), 그 밖에는 코인. 한 번에 한 그릇만 (먹은 효과가 남아 있으면 못 시킴)
const RAMEN_MENU = [
  { id: 'hp', name: '곱빼기', icon: 'ramen', desc: '토벌 체력 150', mode: 'b', price: 60, at: 0, say: '곱빼기다. 남기지 마라.' },
  { id: 'gauge', name: '진한 국물', icon: 'pot', desc: '토벌 스킬 게이지 반', mode: 'b', price: 60, at: 0, say: '진한 국물이다. 힘이 날 거다.' },
  { id: 'naruto', name: '나루토 토핑', icon: 'naruto', desc: '퍼즐: 랏코 검 2개 깔고 시작', mode: 'l', price: 50, at: 10, say: '나루토 듬뿍. 판이 술술 풀릴 거다.' },
  { id: 'egg', name: '반숙 달걀', icon: 'egg', desc: '퍼즐: 이동 +3 (시간 스테이지 +10초)', mode: 'l', price: 70, at: 20, say: '반숙이다. 터뜨리지 말고 먹어라.' },
  { id: 'onigiri', name: '주먹밥 세트', icon: 'onigiri', desc: '퍼즐: 폭탄·종이비행기 깔고 시작', mode: 'l', price: 90, at: 30, say: '주먹밥도 같이 먹어라. 든든할 거다.' },
  { id: 'okinawa', name: '사타안다기 세트', icon: 'donut', desc: '토벌: 체력 150 + 게이지 반', mode: 'b', price: 120, at: 40, say: '시사가 튀긴 거다. 맛있게 먹어라.' },
  { id: 'secret', name: '사부님 비밀 메뉴', icon: 'dango', desc: '퍼즐: 경단 깔고 + 이동 +2', mode: 'l', price: 150, at: 50, say: '…아무한테도 말하지 마라.' },
];
const ramenOf = id => RAMEN_MENU.find(m => m.id === id);
const ramenFree = () => Save.data.ramen !== false;
function renderRamenMenu() {
  if (ramenTab === 'items') return renderShopItems(); // 포장 코너 칸
  const cur = Save.data.buff ? ramenOf(Save.data.buff) : null, prog = unlockedIdx();
  const wrap = $('#ramenMenu .rm-btns');
  wrap.innerHTML = RAMEN_MENU.map(m => {
    const locked = prog < m.at && !(m.at === 0);
    const price = ramenFree() ? '<em class="free">서비스</em>' : `<em><img src="${ITEM('coin')}">${m.price}</em>`;
    return `<button data-b="${m.id}" class="${locked ? 'locked' : ''}${cur?.id === m.id ? ' on' : ''}">` +
      `<img src="${ITEM(m.icon)}" alt=""><b>${m.name}</b><small>${locked ? `스테이지 ${m.at + 1}까지 열면 메뉴에 나와요` : m.desc}</small>${locked ? '' : price}</button>`;
  }).join('');
  wrap.querySelectorAll('button').forEach(b => (b.onclick = () => orderRamen(b.dataset.b)));
  const stamp = Save.data.ramenStamp || 0;
  $('#ramenNote').innerHTML = cur
    ? `먹은 효과: <b>${cur.name}</b> · 다음 ${cur.mode === 'b' ? '토벌' : '퍼즐'}에서 써요`
    : `${ramenFree() ? '새로 깬 스테이지 축하 · 한 그릇은 서비스! ' : ''}도장 ${'●'.repeat(stamp % 5)}${'○'.repeat(5 - (stamp % 5))} (5개마다 간식)`;
}
function orderRamen(id) {
  const m = ramenOf(id), shopkeep = $('#shopMaster');
  if (unlockedIdx() < m.at) { Sound.play('bad'); shopSay(shopkeep, '그건 아직 안 판다.'); return; }
  if (Save.data.buff) { Sound.play('bad'); shopSay(shopkeep, '먹던 거부터 다 먹고 와라.'); return; }
  const free = ramenFree();
  if (!free && Save.data.coins < m.price) { Sound.play('bad'); shopSay(shopkeep, '코인이 모자라다. 토벌하고 와라.'); return; }
  if (!free) Meta.addCoins(-m.price);
  Save.data.buff = id;
  Save.data.ramen = false;
  Save.data.ramenStamp = (Save.data.ramenStamp || 0) + 1;
  Save.save();
  Daily.add('ramen');
  // 그릇이 카운터에 탁 놓이고 김이 모락모락
  const sc = $('#shopScene'), bowl = document.createElement('img');
  bowl.className = 'bowl';
  bowl.src = ITEM(m.icon === 'ramen' || m.icon === 'pot' ? 'ramen' : m.icon);
  sc.appendChild(bowl);
  Sound.play('land', 0.9, 0.9);
  bowl.animate([{ transform: 'translate(-50%, -120px) scale(.6)', opacity: 0 }, { transform: 'translate(-50%, 6px) scale(1.1, .9)', opacity: 1, offset: 0.7 }, { transform: 'translate(-50%, 0)' }], { duration: 420, easing: 'ease-in' });
  const c = centerOf(bowl);
  setTimeout(() => { Sound.play('heal', 1, 0.9); burst(c.x, c.y, '#ff9f5a', 14); floatNum(c.x, c.y - 40, m.desc, '#e07b39'); }, 420);
  shopSay(shopkeep, free ? '서비스다. ' + m.say : m.say);
  // 도장 5개: 문가 손님이 좋아하는 간식(없으면 아무 간식) 하나
  if (Save.data.ramenStamp % 5 === 0) setTimeout(() => {
    const gid = ['momonga', 'kurimanju', 'goblin'].find(g => !Meta.owned(g));
    const t = gid ? RECRUIT[gid].treat : Object.keys(TREATS)[Math.floor(Math.random() * 3)];
    Save.data.treats[t] = (Save.data.treats[t] || 0) + 1;
    Save.save();
    shopSay(shopkeep, `도장 다섯 개다. ${TREATS[t]}, 덤이다.`);
    Sound.play('star', 1.2);
    floatNum(c.x, c.y - 70, `+ ${TREATS[t]}`, '#ff5d9e');
    setTimeout(() => $('#ramen').classList.contains('active') && openRamen(), 1600); // 문가 손님 간식 숫자 새로
  }, 2200);
  renderRamenMenu();
  $('#btnRamen').classList.remove('on');
  setTimeout(() => bowl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: 'forwards' }).finished.then(() => bowl.remove()), 2600);
}
// 먹은 라멘 효과 쓰기. 토벌: 시작할 때 체력·게이지 / 일상 퍼즐: 판에 아이템을 깔거나 이동 더하기
const Ramen = {
  takeBattle() {
    const m = Save.data.buff && ramenOf(Save.data.buff);
    if (!m || m.mode !== 'b') return null;
    Save.data.buff = null;
    Save.save();
    return m;
  },
  takeLife() {
    const m = Save.data.buff && ramenOf(Save.data.buff);
    if (!m || m.mode !== 'l') return null;
    Save.data.buff = null;
    Save.save();
    const put = kinds => {
      const spots = [];
      Board.each(B.grid, (t, r, c) => { if (t.type >= 0 && !t.special && !t.lock) spots.push(t); });
      kinds.forEach(k => { const t = spots.splice(Math.floor(Math.random() * spots.length), 1)[0]; if (t) { t.special = k; t.type = -1; } });
    };
    const more = n => (L.st.time ? (L.time += n * 10 / 3) : (L.moves += n));
    if (m.id === 'naruto') put(['h', 'v']);
    if (m.id === 'egg') more(3);
    if (m.id === 'onigiri') put(['bomb', 'plane']);
    if (m.id === 'secret') { put(['rainbow']); more(2); }
    return m;
  },
};
// ---------- 라멘 가게 포장 코너: 사 두고 필요할 때 쓰는 아이템 (Save.data.items = { id: 개수 }) ----------
// 하트 도시락·무한 리필권: 하트가 없을 때 창이나 가게에서 / 이어하기권: 실패 창에서 / 시작 아이템: 친구 고르는 창에서 켜면 판에 깔고 시작
const SHOP_ITEMS = [
  { id: 'lunch', name: '하트 도시락', icon: 'bento', desc: '하트 1개 바로 채움', price: 40, say: '도시락이다. 배고프면 먹어라.' },
  { id: 'refill', name: '무한 리필권', icon: 'heart', desc: '30분 동안 하트가 안 줄어요', price: 250, say: '무한 리필이다. 30분은 마음껏 다녀와라.' },
  { id: 'cont', name: '이어하기권', icon: 'timer', desc: '실패했을 때 이어서 (일상 +5번, 토벌 체력 절반)', price: 120, say: '이어하기권이다. 포기하지 마라.' },
  { id: 'sword', name: '랏코 검', icon: 'rocket', desc: '일상 퍼즐: 가로·세로 검 깔고 시작', price: 60, put: ['h', 'v'], say: '랏코 검이다. 조심해서 들고 가라.' },
  { id: 'bomb', name: '폭탄', icon: 'bomb', desc: '일상 퍼즐: 폭탄 깔고 시작', price: 80, put: ['bomb'], say: '폭탄이다… 가게 안에서 터뜨리지 마라.' },
  { id: 'dango', name: '경단', icon: 'rainbow', desc: '일상 퍼즐: 경단 깔고 시작', price: 120, put: ['rainbow'], say: '경단이다. 시사가 빚은 거다.' },
];
const itemPrice = id => SHOP_ITEMS.find(x => x.id === id).price;
const Items = {
  n: id => Save.data.items?.[id] || 0,
  add(id, k = 1) { (Save.data.items = Save.data.items || {})[id] = Items.n(id) + k; Save.save(); },
  use(id) { if (Items.n(id) < 1) return false; Save.data.items[id]--; Save.save(); return true; },
  // 친구 고르는 창에서 켠 시작 아이템을 판에 깖 (보드를 만든 뒤에 부름)
  applyBoost() {
    const used = [...(L.boost || [])].filter(id => Items.use(id));
    L.boost = new Set();
    if (!used.length) return null;
    const spots = [];
    Board.each(B.grid, t => { if (t.type >= 0 && !t.special && !t.lock) spots.push(t); });
    used.flatMap(id => SHOP_ITEMS.find(x => x.id === id).put).forEach(k => {
      const t = spots.splice(Math.floor(Math.random() * spots.length), 1)[0];
      if (t) { t.special = k; t.type = -1; }
    });
    return used;
  },
};
let ramenTab = 'ramen';
document.querySelectorAll('.rm-tabs button').forEach(b => (b.onclick = () => {
  Sound.play('pop', 1.2, 0.5);
  ramenTab = b.dataset.t;
  document.querySelectorAll('.rm-tabs button').forEach(x => x.classList.toggle('on', x === b));
  renderRamenMenu();
}));
function renderShopItems() {
  const wrap = $('#ramenMenu .rm-btns');
  wrap.innerHTML = SHOP_ITEMS.map(it => {
    const n = Items.n(it.id), use = n && ((it.id === 'lunch' && Hearts.n() < HEART_MAX) || it.id === 'refill');
    return `<button data-i="${it.id}"><img src="${ITEM(it.icon)}" alt=""><b>${it.name}${n ? ` <i class="have">×${n}</i>` : ''}</b><small>${it.desc}</small>` +
      `<em><img src="${ITEM('coin')}">${it.price}</em>${use ? `<span class="use" data-use>${it.id === 'lunch' ? '먹기' : '쓰기'}</span>` : ''}</button>`;
  }).join('');
  wrap.querySelectorAll('button').forEach(b => (b.onclick = e => (e.target.closest('[data-use]') ? useShopItem(b.dataset.i) : buyShopItem(b.dataset.i))));
  $('#ramenNote').innerHTML = Hearts.inf() ? `무한 리필 중 · <b>${Hearts.infLeft()}</b> 남음` : '사 두면 필요할 때 써요 · 하트가 없을 때, 실패했을 때, 스테이지 시작 전 (종류마다 스테이지에 한 번)';
}
function buyShopItem(id) {
  const it = SHOP_ITEMS.find(x => x.id === id), shopkeep = $('#shopMaster');
  if (Save.data.coins < it.price) { Sound.play('bad'); shopSay(shopkeep, '코인이 모자라다. 토벌하고 와라.'); return; }
  Meta.addCoins(-it.price);
  Items.add(id);
  Sound.play('land', 1.1, 0.8);
  shopSay(shopkeep, it.say);
  const b = $(`#ramenMenu [data-i="${id}"]`);
  if (b) { const c = centerOf(b); floatNum(c.x, c.y - 20, `+1 ${it.name}`, '#e07b39'); }
  renderRamenMenu();
}
function useShopItem(id) {
  if (!Items.use(id)) return;
  if (id === 'lunch') Hearts.add(1); else Hearts.startInf();
  Sound.play('heal', 1.2, 0.9);
  shopSay($('#shopMaster'), id === 'lunch' ? '든든하게 먹어라.' : '30분 동안 마음껏 다녀와라.');
  renderRamenMenu();
}
$('#btnRamen').onclick = () => { Sound.play('click'); go(openRamen); };
