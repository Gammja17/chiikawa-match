// 효과음: Kenney CC0 팩. WebAudio로 재생하고, file:// 처럼 fetch가 막히면 <audio>로 대체
const SFX_NAMES = ['swap', 'bad', 'pop', 'sparkle', 'click', 'win', 'star', 'open', 'special', 'line',
  'rainbow', 'heal', 'lose', 'defeat', 'wave', 'hit1', 'hit2', 'hit3', 'enemy', 'land'];

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
