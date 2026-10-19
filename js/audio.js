// 효과음: Pixabay(floraphonic 등)·Mixkit 무료 효과음. 받은 뒤 크기를 맞춰 mp3로 변환
// WebAudio로 재생하고, file:// 처럼 fetch가 막히면 <audio>로 대체
const SFX_NAMES = ['star', 'heal', 'open', 'win', 'jingle_win', 'jingle_lose', 'jingle_start', 'jingle_skill',
  'enemy', 'wave', 'defeat', 'pop', 'swap', 'bad', 'click', 'land', 'line', 'special', 'sparkle', 'hit', 'rainbow'];
const SFX_V = 2; // 파일을 바꾸면 올려서 예전 소리가 캐시에서 나오지 않게 함
// 소리마다 볼륨 (자주 나는 소리는 작게). 여기 숫자만 바꾸면 조절됨
const SFX_VOL = { pop: 0.55, click: 0.45, swap: 0.5, land: 0.4, bad: 0.6, line: 0.7, hit: 0.75, sparkle: 0.6,
  special: 0.8, star: 0.8, heal: 0.8, enemy: 0.85 };
// 예전 이름 → 새 소리 (이름, 음높이)
const SFX_ALIAS = { hit1: ['hit', 1], hit2: ['hit', 1.1], hit3: ['hit', 0.9], thwack: ['hit', 0.85] };

const Sound = {
  ctx: null, buffers: {}, muted: false, fallback: false,
  // 효과음·배경음악 볼륨 (설정 창에서 바꿈, 이 기기에 저장)
  vol: (() => { try { return { sfx: 0.8, bgm: 0.6, ...JSON.parse(localStorage.getItem('chiikawaMatch.v1.vol')) }; } catch { return { sfx: 0.8, bgm: 0.6 }; } })(),
  setVol(k, v) {
    this.vol[k] = v;
    try { localStorage.setItem('chiikawaMatch.v1.vol', JSON.stringify(this.vol)); } catch {}
    if (this[k]) this[k].gain.value = v;
  },

  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); this.bgmSync(); return; }
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { this.fallback = true; return; }
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.8;
    this.master.connect(this.ctx.destination);
    ['sfx', 'bgm'].forEach(k => { this[k] = this.ctx.createGain(); this[k].gain.value = this.vol[k]; this[k].connect(this.master); });
    this.bgmInit();
    SFX_NAMES.forEach(n => {
      fetch(`assets/sfx/${n}.mp3?v=${SFX_V}`)
        .then(r => r.arrayBuffer())
        .then(b => this.ctx.decodeAudioData(b))
        .then(buf => (this.buffers[n] = buf))
        .catch(() => (this.fallback = true));
    });
  },

  // rate: 재생 속도(음높이), vol: 볼륨 (SFX_VOL을 곱함)
  play(name, rate = 1, vol = 1) {
    if (this.muted) return;
    if (SFX_ALIAS[name]) { rate *= SFX_ALIAS[name][1]; name = SFX_ALIAS[name][0]; }
    vol *= SFX_VOL[name] ?? 1;
    const buf = this.buffers[name];
    if (buf && this.ctx) {
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = rate;
      const g = this.ctx.createGain();
      g.gain.value = vol;
      src.connect(g).connect(this.sfx);
      src.start();
    } else if (this.fallback) {
      const a = new Audio(`assets/sfx/${name}.mp3?v=${SFX_V}`);
      a.preservesPitch = false;
      a.playbackRate = rate;
      a.volume = Math.min(1, vol * 0.8 * this.vol.sfx);
      a.play().catch(() => {});
    }
  },

  // 캐릭터 목소리: assets/voice/voices.json 에 적힌 파일만 재생 (없으면 false를 돌려줘서 효과음으로 대신함)
  // 예: { "chiikawa": ["pick", "skill", "win"] } → assets/voice/chiikawa_pick.mp3 ...
  voices: {},
  voice(id, ev) {
    if (this.muted || !this.voices[id]?.includes(ev)) return false;
    const name = `voice_${id}_${ev}`;
    if (!this.buffers[name] && this.ctx) {
      fetch(`assets/voice/${id}_${ev}.mp3`).then(r => r.arrayBuffer()).then(b => this.ctx.decodeAudioData(b))
        .then(buf => { this.buffers[name] = buf; this.play(name); }).catch(() => {});
      return true;
    }
    this.play(name);
    return true;
  },

  // 뽀용: 콤보가 쌓일수록 음이 올라감 (도레미파솔라시도…)
  pop(combo, i = 0) {
    const scale = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19];
    const semi = scale[Math.min(combo, scale.length - 1)] + (i % 2) * 0.3;
    this.play('pop', Math.pow(2, semi / 12) * 1.05, 0.9);
    Haptic.tap(combo > 2 ? 18 : 12);
  },
};

// ---------- 진동: 구슬이 터질 때 폰이 톡톡 (안드로이드 vibrate, 아이폰은 스위치 햅틱) ----------
const Haptic = {
  on: localStorage.getItem('chiikawaMatch.v1.vib') !== '0',
  last: 0,
  tap(ms = 12) {
    if (!this.on) return;
    const now = performance.now();
    if (now - this.last < 40) return;
    this.last = now;
    if (navigator.vibrate) { navigator.vibrate(Math.max(20, ms)); return; }
    // 아이폰(iOS 18+): 숨긴 스위치를 누르면 탭틱이 울림. 손가락으로 누르는 순간에 불러야 잘 됨
    try {
      const l = document.createElement('label');
      l.ariaHidden = 'true';
      l.style.display = 'none';
      const i = document.createElement('input');
      i.type = 'checkbox';
      i.setAttribute('switch', '');
      l.appendChild(i);
      document.head.appendChild(l);
      l.click();
      l.remove();
    } catch {}
  },
  toggle() {
    this.on = !this.on;
    try { localStorage.setItem('chiikawaMatch.v1.vib', this.on ? '1' : '0'); } catch {}
    if (this.on) this.tap(30);
  },
};

fetch('assets/voice/voices.json').then(r => r.json()).then(v => (Sound.voices = v || {})).catch(() => {});

// ---------- BGM: OpenGameArt의 CC0 곡 (출처는 prefs.js의 CREDITS). 원본을 112kbps mp3로 줄여 assets/bgm/에 둠 ----------
// 화면 이름 → 파일. 여러 곡이면 틀 때마다 다음 곡으로 돌아감
const BGM = {
  map: ['map'],                      // Caturday (iamoneabe)
  life: ['life1', 'life2', 'life3'], // happy lofi day (Tarush Singhal), Florist, Countryside (Tad)
  ramen: ['ramen'],                  // Cat caffe (Tad)
  battle: ['battle'],                // Trouble in the Garden (Augmentality)
  boss: ['boss'],                    // Baby Black Magi (bobjt)
};
const BGM_V = 1; // 파일을 바꾸면 올림
Object.assign(Sound, {
  song: null, el: null, fade: null, turn: {},

  music(name) {
    if (this.song === name) return;
    this.song = name;
    this.bgmPlay();
  },

  // <audio> 하나를 계속 씀 (아이폰은 손가락으로 한 번 튼 요소만 나중에도 소리를 냄). 처음 터치 때 만듦
  bgmInit() {
    this.el = new Audio();
    this.el.loop = true;
    this.bgmGain = this.ctx.createGain();
    this.ctx.createMediaElementSource(this.el).connect(this.bgmGain).connect(this.bgm);
    this.bgmPlay();
  },

  // 지금 song 틀기: 재생 중이면 소리를 줄였다가 파일을 바꿈
  bgmPlay() {
    const el = this.el;
    if (!el) return;
    clearTimeout(this.fade);
    const swap = () => {
      el.pause();
      const name = this.song;
      if (!name || this.muted || document.hidden) return;
      const list = BGM[name], k = (this.turn[name] = ((this.turn[name] ?? -1) + 1) % list.length);
      el.src = `assets/bgm/${list[k]}.mp3?v=${BGM_V}`;
      el.dataset.song = name;
      const g = this.bgmGain.gain, t = this.ctx.currentTime;
      g.cancelScheduledValues(t);
      g.setValueAtTime(0, t);
      g.linearRampToValueAtTime(1, t + 0.6);
      el.play().catch(() => {});
    };
    if (el.paused) { swap(); return; }
    this.bgmGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.12);
    this.fade = setTimeout(swap, 450);
  },

  // 소리 끄기·앱 숨김·막혔던 자동 재생: 같은 곡이면 이어서, 바뀌었으면 새로
  bgmSync() {
    const el = this.el;
    if (!el) return;
    if (this.muted || document.hidden || !this.song) { el.pause(); return; }
    if (!el.paused) return;
    if (el.dataset.song === this.song) el.play().catch(() => {});
    else this.bgmPlay();
  },
});
document.addEventListener('visibilitychange', () => Sound.bgmSync());
