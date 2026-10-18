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
      fetch(`assets/sfx/${n}.ogg`)
        .then(r => r.arrayBuffer())
        .then(b => this.ctx.decodeAudioData(b))
        .then(buf => (this.buffers[n] = buf))
        .catch(() => (this.fallback = true));
    });
  },

  // rate: 재생 속도(음높이), vol: 볼륨
  play(name, rate = 1, vol = 1) {
    if (this.muted) return;
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
      const a = new Audio(`assets/sfx/${name}.ogg`);
      a.preservesPitch = false;
      a.playbackRate = rate;
      a.volume = Math.min(1, vol * 0.8);
      a.play().catch(() => {});
    }
  },

  // 뽀용: 콤보가 쌓일수록 음이 올라감 (도레미파솔라시도…)
  pop(combo, i = 0) {
    const scale = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19];
    const semi = scale[Math.min(combo, scale.length - 1)] + (i % 2) * 0.3;
    this.play('pop', Math.pow(2, semi / 12) * 1.05, 0.9);
  },
};

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
