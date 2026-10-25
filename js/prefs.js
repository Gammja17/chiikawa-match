// 이 기기만의 설정 (계정 저장과 따로): 테마 색, 연출 가볍게, 화면 흔들림 끄기, 빠른 진행, 스킬 연출 끄기
// data.js 다음, game.js 앞에서 불러옴 (sleep·animate가 빠른 진행을 따라가게)
const Prefs = {
  KEY: 'chiikawa-prefs',
  d: { theme: null, light: false, noShake: false, fast: false, noSkillFx: false },
  load() {
    try { Object.assign(Prefs.d, JSON.parse(localStorage.getItem(Prefs.KEY) || '{}')); } catch {}
    Prefs.applyTheme();
  },
  save() { try { localStorage.setItem(Prefs.KEY, JSON.stringify(Prefs.d)); } catch {} },
  set(k, v) { Prefs.d[k] = v; Prefs.save(); if (k === 'theme') Prefs.applyTheme(); },
  boost: 1, // 스킬 연출을 두 번 톡해서 빨리 감을 때만 잠깐 커짐
  speed: () => (Prefs.d.fast ? 1.5 : 1) * Prefs.boost,
  // 테마 색: 친구 상징색(ring)을 강조색으로. 없으면 기본 분홍
  THEME_DEFAULT: '#ff6fa5',
  themeColor: () => (Prefs.d.theme && CHARS.find(c => c.id === Prefs.d.theme)?.ring) || Prefs.THEME_DEFAULT,
  applyTheme() {
    const c = Prefs.themeColor(), root = document.documentElement.style;
    root.setProperty('--pink', c);
    root.setProperty('--pink-l', `color-mix(in srgb, ${c} 18%, #fff)`);
    root.setProperty('--cream', `color-mix(in srgb, ${c} 7%, #fff)`);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', c);
  },
};
Prefs.load();

// 처음 켤 때는 타이틀에 필요한 것만 받고, 나머지 그림(괴물·이펙트·콤보 글자·화면마다 쓰는 그림)은 타이틀이 뜬 뒤 한가할 때 조금씩 받음
// (예전엔 켜자마자 5MB를 한꺼번에 받아서 4G에서 타이틀이 늦게 떴음)
const Preload = {
  q: [], started: false,
  add(src) { if (Preload.started) new Image().src = src; else Preload.q.push(src); },
  start() {
    if (Preload.started) return;
    Preload.started = true;
    // 숨은 화면의 <img loading=lazy>도 미리 받아 둠 (화면이 열릴 때 그림이 늦게 뜨지 않게)
    const q = [...Preload.q, ...[...document.querySelectorAll('img[loading=lazy]')].map(im => im.src)];
    Preload.q = [];
    let i = 0;
    const step = () => {
      for (const end = i + 6; i < Math.min(end, q.length); i++) new Image().src = q[i];
      if (i < q.length) setTimeout(step, 150);
    };
    step();
  },
};
addEventListener('load', () => setTimeout(() => (window.requestIdleCallback ? requestIdleCallback(Preload.start, { timeout: 2000 }) : Preload.start()), 900));

// 빠른 진행: 모든 움직임을 1.5배로 (계속 도는 반복 애니메이션은 그대로)
{
  const animate = Element.prototype.animate;
  Element.prototype.animate = function (frames, opts) {
    const s = Prefs.speed();
    if (s !== 1) {
      if (typeof opts === 'number') opts /= s;
      else if (opts && opts.iterations !== Infinity) opts = { ...opts, duration: (opts.duration || 0) / s, delay: (opts.delay || 0) / s };
    }
    return animate.call(this, frames, opts);
  };
}
