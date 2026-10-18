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
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { this.fallback = true; return; }
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.8;
    this.master.connect(this.ctx.destination);
    ['sfx', 'bgm'].forEach(k => { this[k] = this.ctx.createGain(); this[k].gain.value = this.vol[k]; this[k].connect(this.master); });
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

// ---------- BGM: 코드로 연주하는 오리지널 루프 (마림바 + 오르골 + 통통 베이스) ----------
// 음 번호는 C4=0 기준 반음. 한 칸 = 8분음표
const SONGS = {
  map: {
    bpm: 92,
    chords: [[0, 4, 7], [-3, 0, 4], [-7, -3, 0], [-5, -1, 2]],           // C Am F G
    mel: [12, null, 16, 19, 16, null, 14, 12, 9, null, 12, 16, 14, null, 12, null,
          9, null, 12, 14, 16, null, 14, 12, 11, null, 14, 12, 7, null, null, null],
  },
  battle: {
    bpm: 132,
    chords: [[0, 4, 7], [-5, -1, 2], [-3, 0, 4], [-7, -3, 0]],            // C G Am F
    mel: [12, 16, 19, 16, 21, 19, 16, 14, 12, 14, 16, 19, 16, 14, 12, null,
          11, 14, 19, 14, 16, 14, 11, 7, 9, 12, 16, 12, 14, 12, 9, null],
  },
};
Object.assign(Sound, {
  song: null, step: 0, nextAt: 0, timer: null,

  music(name) {
    if (this.song === name) return;
    this.song = name;
    clearInterval(this.timer);
    this.timer = null;
    if (!name) return;
    const start = () => {
      if (!this.ctx) { setTimeout(start, 300); return; }
      if (this.song !== name || this.timer) return;
      this.step = 0;
      this.nextAt = this.ctx.currentTime + 0.1;
      this.timer = setInterval(() => this.tick(), 60);
    };
    start();
  },

  tick() {
    const s = SONGS[this.song];
    if (!s || !this.ctx) return;
    const dt = 60 / s.bpm / 2;
    while (this.nextAt < this.ctx.currentTime + 0.25) {
      if (!this.muted) {
        const i = this.step % s.mel.length, bar = Math.floor(i / 8) % s.chords.length, ch = s.chords[bar];
        if (s.mel[i] != null) this.note(s.mel[i], this.nextAt, dt * 1.6, 'mallet', 0.10);
        if (i % 8 === 0) this.note(ch[0] - 12, this.nextAt, dt * 3, 'bass', 0.13);
        if (i % 8 === 4) this.note(ch[0] - 5, this.nextAt, dt * 2, 'bass', 0.09);
        if (i % 2 === 1) this.note(ch[(i >> 1) % 3] + 12, this.nextAt, dt * 0.9, 'box', 0.035);
      }
      this.nextAt += dt;
      this.step++;
    }
  },

  note(semi, t, len, kind, vol) {
    const f = 261.63 * Math.pow(2, semi / 12);
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = kind === 'bass' ? 'triangle' : 'sine';
    o.frequency.value = f;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0008, t + len);
    o.connect(g).connect(this.bgm);
    o.start(t);
    o.stop(t + len + 0.05);
    if (kind === 'mallet') {      // 마림바 느낌: 2배음을 아주 짧게 섞음
      const o2 = this.ctx.createOscillator(), g2 = this.ctx.createGain();
      o2.frequency.value = f * 4;
      g2.gain.setValueAtTime(vol * 0.35, t);
      g2.gain.exponentialRampToValueAtTime(0.0005, t + 0.08);
      o2.connect(g2).connect(this.bgm);
      o2.start(t);
      o2.stop(t + 0.1);
    }
  },
});
