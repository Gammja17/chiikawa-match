// 이 기기만의 설정 (계정 저장과 따로): 테마 색, 연출 가볍게, 화면 흔들림 끄기, 빠른 진행
// data.js 다음, game.js 앞에서 불러옴 (sleep·animate가 빠른 진행을 따라가게)
const Prefs = {
  KEY: 'chiikawa-prefs',
  d: { theme: null, light: false, noShake: false, fast: false },
  load() {
    try { Object.assign(Prefs.d, JSON.parse(localStorage.getItem(Prefs.KEY) || '{}')); } catch {}
    Prefs.applyTheme();
  },
  save() { try { localStorage.setItem(Prefs.KEY, JSON.stringify(Prefs.d)); } catch {} },
  set(k, v) { Prefs.d[k] = v; Prefs.save(); if (k === 'theme') Prefs.applyTheme(); },
  speed: () => (Prefs.d.fast ? 1.5 : 1),
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

// 만든 사람·출처 (설정 → 만든 사람·출처)
const CREDITS = `먼작귀 퍼즐 토벌 대작전!은 팬이 만든 비공식 게임이에요. 돈을 받지 않아요.
캐릭터·괴물: © nagano / chiikawa committee
그림: Chiikawa Wiki(Fandom)의 원작 애니메이션 장면과 공식 일러스트
효과음: Pixabay, Mixkit · 이펙트: Kenney Particle Pack(CC0)
아이콘: Noto Emoji(Google, Apache 2.0) · 글꼴: Poor Story(Google Fonts, OFL)
배경 음악: 직접 만든 곡 · 배경 그림 일부: VARCO로 생성`;
