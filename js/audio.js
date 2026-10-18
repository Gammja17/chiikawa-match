// 효과음: Kenney CC0 팩. WebAudio로 재생하고, file:// 처럼 fetch가 막히면 <audio>로 대체
const SFX_NAMES = ['swap', 'bad', 'pop', 'sparkle', 'click', 'win', 'star', 'open', 'special', 'line',
  'rainbow', 'heal', 'lose', 'defeat', 'wave', 'hit1', 'hit2', 'hit3', 'enemy', 'land',
  'jingle_win', 'jingle_lose', 'jingle_start', 'jingle_skill'];

const Sound = {
  ctx: null, buffers: {}, muted: false, fallback: false,

  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { this.fallback = true; return; }
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.8;
    this.master.connect(this.ctx.destination);
    SFX_NAMES.forEach(n => {
      fetch(`assets/sfx/${n}.mp3`)
        .then(r => r.arrayBuffer())
        .then(b => this.ctx.decodeAudioData(b))
        .then(buf => (this.buffers[n] = buf))
        .catch(() => (this.fallback = true));
    });
  },

  // rate: 재생 속도(음높이), vol: 볼륨. 퍼즐 손맛 소리는 직접 합성(SYN), 나머지는 Kenney 효과음
  play(name, rate = 1, vol = 1) {
    if (this.muted) return;
    if (SYN[name] && this.ctx && this.ctx.state === 'running') { SYN[name](this.ctx, this.master, rate, vol); return; }
    const buf = this.buffers[name];
    if (buf && this.ctx) {
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = rate;
      const g = this.ctx.createGain();
      g.gain.value = vol;
      src.connect(g).connect(this.master);
      src.start();
    } else if (this.fallback) {
      const a = new Audio(`assets/sfx/${name}.mp3`);
      a.preservesPitch = false;
      a.playbackRate = rate;
      a.volume = Math.min(1, vol * 0.8);
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

// ---------- 합성 효과음: 짧고 또렷하게 (뽁, 슉, 쾅) ----------
let NOISE = null;
function noiseBuf(ctx) {
  if (NOISE) return NOISE;
  NOISE = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = NOISE.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return NOISE;
}
// 음 하나: 주파수가 f0→f1로 미끄러지며 짧게 울림
function tone(ctx, out, { type = 'sine', f0, f1 = f0, t = 0, dur = 0.1, vol = 0.5, attack = 0.003 }) {
  const now = ctx.currentTime + t;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, now);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), now + dur);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(vol, now + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  o.connect(g).connect(out);
  o.start(now);
  o.stop(now + dur + 0.02);
}
// 잡음 한 줌: 필터를 걸어 톡, 슉, 쿵을 만듦
function hiss(ctx, out, { t = 0, dur = 0.05, vol = 0.3, type = 'bandpass', f0 = 3000, f1 = f0, q = 1 }) {
  const now = ctx.currentTime + t;
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noiseBuf(ctx);
  f.type = type;
  f.Q.value = q;
  f.frequency.setValueAtTime(f0, now);
  f.frequency.exponentialRampToValueAtTime(Math.max(40, f1), now + dur);
  g.gain.setValueAtTime(vol, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  s.connect(f).connect(g).connect(out);
  s.start(now, Math.random() * 0.5);
  s.stop(now + dur + 0.02);
}
const SYN = {
  // 구슬 뽁: 동글한 음이 뚝 떨어지고 끝에 톡
  pop(ctx, out, r, v) {
    tone(ctx, out, { f0: 620 * r, f1: 240 * r, dur: 0.09, vol: 0.55 * v });
    tone(ctx, out, { type: 'triangle', f0: 1240 * r, f1: 700 * r, dur: 0.05, vol: 0.18 * v });
    hiss(ctx, out, { dur: 0.012, vol: 0.35 * v, type: 'highpass', f0: 2500 });
  },
  swap(ctx, out, r, v) {
    hiss(ctx, out, { dur: 0.05, vol: 0.25 * v, f0: 1800 * r, f1: 3600 * r, q: 2 });
    tone(ctx, out, { f0: 520 * r, f1: 760 * r, dur: 0.05, vol: 0.15 * v });
  },
  bad(ctx, out, r, v) {
    tone(ctx, out, { type: 'triangle', f0: 260, f1: 240, dur: 0.09, vol: 0.35 * v });
    tone(ctx, out, { type: 'triangle', f0: 200, f1: 170, t: 0.1, dur: 0.12, vol: 0.35 * v });
  },
  click(ctx, out, r, v) {
    tone(ctx, out, { f0: 1500 * r, f1: 1100 * r, dur: 0.03, vol: 0.2 * v });
  },
  // 착지: 아주 작은 툭
  land(ctx, out, r, v) {
    tone(ctx, out, { f0: 220 * r, f1: 110 * r, dur: 0.05, vol: 0.18 * v });
  },
  // 로켓: 슈웅 하고 쓸고 지나감
  line(ctx, out, r, v) {
    hiss(ctx, out, { dur: 0.28, vol: 0.4 * v, f0: 500 * r, f1: 5000 * r, q: 1.4 });
    tone(ctx, out, { type: 'sawtooth', f0: 1400 * r, f1: 260 * r, dur: 0.22, vol: 0.08 * v });
  },
  // 아이템 생김: 띠링
  special(ctx, out, r, v) {
    [0, 4, 7, 12].forEach((s, i) => tone(ctx, out, { f0: 880 * r * Math.pow(2, s / 12), t: i * 0.045, dur: 0.22, vol: 0.2 * v }));
  },
  sparkle(ctx, out, r, v) {
    for (let i = 0; i < 3; i++) tone(ctx, out, { f0: (2000 + Math.random() * 1400) * r, t: i * 0.035, dur: 0.12, vol: 0.08 * v });
  },
  // 몬스터 맞음: 퍽
  hit1(ctx, out, r, v) { SYN.thwack(ctx, out, r, v); },
  hit2(ctx, out, r, v) { SYN.thwack(ctx, out, r * 1.1, v); },
  hit3(ctx, out, r, v) { SYN.thwack(ctx, out, r * 0.9, v); },
  thwack(ctx, out, r, v) {
    hiss(ctx, out, { dur: 0.08, vol: 0.55 * v, type: 'lowpass', f0: 2600 * r, f1: 500 });
    tone(ctx, out, { f0: 190 * r, f1: 55, dur: 0.14, vol: 0.6 * v });
  },
  // 무지개: 도레미솔라 쫙
  rainbow(ctx, out, r, v) {
    [0, 2, 4, 7, 9, 12, 14, 16, 19].forEach((s, i) => tone(ctx, out, { type: 'triangle', f0: 660 * Math.pow(2, s / 12), t: i * 0.035, dur: 0.18, vol: 0.14 * v }));
    hiss(ctx, out, { dur: 0.4, vol: 0.12 * v, type: 'highpass', f0: 5000 });
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
    if (navigator.vibrate) { navigator.vibrate(ms); return; }
    if (!this.lbl) {
      const i = document.createElement('input');
      i.type = 'checkbox';
      i.setAttribute('switch', '');
      i.id = 'hapticSwitch';
      const l = document.createElement('label');
      l.htmlFor = 'hapticSwitch';
      i.style.cssText = l.style.cssText = 'position:absolute;width:1px;height:1px;opacity:0;pointer-events:none';
      document.body.append(i, l);
      this.lbl = l;
    }
    this.lbl.click();
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
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + len + 0.05);
    if (kind === 'mallet') {      // 마림바 느낌: 2배음을 아주 짧게 섞음
      const o2 = this.ctx.createOscillator(), g2 = this.ctx.createGain();
      o2.frequency.value = f * 4;
      g2.gain.setValueAtTime(vol * 0.35, t);
      g2.gain.exponentialRampToValueAtTime(0.0005, t + 0.08);
      o2.connect(g2).connect(this.master);
      o2.start(t);
      o2.stop(t + 0.1);
    }
  },
});
