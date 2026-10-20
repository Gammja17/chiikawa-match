// 반짝이·별·고리·조각을 캔버스 한 장에 그림
// 예전엔 하나하나가 HTML 요소라서, 아이템이 여럿 터지며 100~150개가 생겼다 지워질 때마다 브라우저가 화면 구조를 다시 계산해 폰에서 끊겼음
// 쓰는 쪽은 그대로: kp/kx(game.js)가 넘기는 CSS 키프레임(translate·rotate·scale·opacity)과 easing을 여기서 풀어서 그림
// Juice.stop(멈칫)·Juice.slow(슬로)·빠른 진행·빨리 감기도 따라감
const Particles = {
  list: [], cv: null, ctx: null, dpr: 1, w: 0, h: 0, raf: 0,
  last: 0, pausedTo: 0, rate: 1, rateTo: 0, tintBudget: 6,
  imgs: new Map(), tints: new Map(),
  MAX: 320,

  init() {
    const fxEl = document.getElementById('fx');
    const cv = (this.cv = document.createElement('canvas'));
    cv.id = 'fxc';
    fxEl.parentNode.insertBefore(cv, fxEl); // #fx 바로 밑 (날아가는 얼굴·칼 그림은 그 위)
    this.ctx = cv.getContext('2d');
    this.resize();
    addEventListener('resize', () => this.resize());
  },
  resize() {
    const a = this.cv.parentNode;
    // 3배 화면도 2배로 그림 (반짝이는 흐려도 티가 안 나고 훨씬 가벼움). 연출 가볍게면 1배
    this.dpr = Math.min(typeof Prefs !== 'undefined' && Prefs.d.light ? 1 : 2, window.devicePixelRatio || 1);
    this.w = a.clientWidth;
    this.h = a.clientHeight;
    this.cv.width = Math.round(this.w * this.dpr);
    this.cv.height = Math.round(this.h * this.dpr);
  },
  count() { return this.list.length; },
  clear() { this.list.forEach(p => p.done()); this.list = []; this.ctx?.clearRect(0, 0, this.cv.width, this.cv.height); },
  // 멈칫 (ms 동안 시간이 안 감), 슬로 (rate배로 ms 동안), 빨리 감기 (지금 도는 것 모두 x배)
  pause(ms) { this.pausedTo = Math.max(this.pausedTo, performance.now() + ms); },
  slow(ms, rate) { this.rate = rate; this.rateTo = performance.now() + ms; },
  speedUp(x) { this.list.forEach(p => (p.speed *= x)); },

  // 그림(흰 모양) 불러오기와 색 입히기: 한 번 칠한 색은 기억해 둠
  img(src) {
    let im = this.imgs.get(src);
    if (!im) { im = new Image(); im.src = src; this.imgs.set(src, im); }
    return im;
  },
  tinted(src, color) {
    const k = src + '|' + color;
    let c = this.tints.get(k);
    if (c) return c;
    if (this.tintBudget-- <= 0) return null; // 새 색은 한 프레임에 몇 개만 칠함 (몰리면 그 프레임이 끊김)
    const im = this.img(src);
    if (!im.complete || !im.naturalWidth) return null;
    const S = 128; // 칠해 둘 크기 (그릴 때 늘리고 줄임)
    c = document.createElement('canvas');
    c.width = c.height = S;
    const g = c.getContext('2d');
    const r = Math.min(S / im.naturalWidth, S / im.naturalHeight), w = im.naturalWidth * r, h = im.naturalHeight * r;
    g.drawImage(im, (S - w) / 2, (S - h) / 2, w, h); // center / contain
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = color;
    g.fillRect(0, 0, S, S);
    if (this.tints.size > 400) this.tints.clear();
    this.tints.set(k, c);
    return c;
  },

  // ---------- CSS 키프레임 풀기 ----------
  // transform 문자열 → { tx, ty, rot(라디안), sx, sy }. 그리는 순서는 translate → rotate → scale (게임에서 쓰는 꼴은 모두 이 순서와 같은 결과)
  parseTf(s) {
    const t = { tx: 0, ty: 0, rot: 0, sx: 1, sy: 1 };
    const num = v => parseFloat(v) || 0;
    const ang = v => (v.trim().endsWith('rad') ? num(v) : (num(v) * Math.PI) / 180);
    for (const [, f, a] of s.matchAll(/([a-zA-Z]+)\(([^)]*)\)/g)) {
      const p = a.split(',');
      if (f === 'translate') { t.tx += num(p[0]); t.ty += num(p[1] ?? 0); }
      else if (f === 'translateX') t.tx += num(p[0]);
      else if (f === 'translateY') t.ty += num(p[0]);
      else if (f === 'scale') { t.sx *= num(p[0]); t.sy *= num(p[1] ?? p[0]); }
      else if (f === 'scaleX') t.sx *= num(p[0]);
      else if (f === 'scaleY') t.sy *= num(p[0]);
      else if (f === 'rotate') t.rot += ang(p[0]);
    }
    return t;
  },
  keys(frames) {
    const P = ['tx', 'ty', 'rot', 'sx', 'sy', 'op'];
    const ks = frames.map(f => {
      const k = { o: f.offset };
      if (f.transform != null) Object.assign(k, this.parseTf(String(f.transform)));
      if (f.opacity != null) k.op = +f.opacity;
      return k;
    });
    // offset이 빠진 키프레임은 앞뒤 사이에 고르게
    ks[0].o ??= 0;
    ks[ks.length - 1].o ??= 1;
    for (let i = 1; i < ks.length - 1; i++) if (ks[i].o == null) {
      let j = i;
      while (ks[j].o == null) j++;
      for (let m = i; m < j; m++) ks[m].o = ks[i - 1].o + ((ks[j].o - ks[i - 1].o) * (m - i + 1)) / (j - i + 1);
    }
    // 키프레임에 없는 값은 앞뒤에서 이어 줌 (CSS처럼)
    const def = { tx: 0, ty: 0, rot: 0, sx: 1, sy: 1, op: 1 };
    P.forEach(p => {
      const has = ks.map((k, i) => (k[p] != null ? i : -1)).filter(i => i >= 0);
      ks.forEach((k, i) => {
        if (k[p] != null) return;
        const a = has.filter(j => j < i).pop(), b = has.find(j => j > i);
        if (a == null && b == null) k[p] = def[p];
        else if (a == null) k[p] = ks[b][p];
        else if (b == null) k[p] = ks[a][p];
        else k[p] = ks[a][p] + ((ks[b][p] - ks[a][p]) * (k.o - ks[a].o)) / (ks[b].o - ks[a].o || 1);
      });
    });
    return ks;
  },
  easing(e = 'linear') {
    const B = { linear: null, ease: [0.25, 0.1, 0.25, 1], 'ease-in': [0.42, 0, 1, 1], 'ease-out': [0, 0, 0.58, 1], 'ease-in-out': [0.42, 0, 0.58, 1] };
    let c = B[e];
    const m = /cubic-bezier\(([^)]*)\)/.exec(e);
    if (m) c = m[1].split(',').map(Number);
    if (!c) return x => x;
    const [x1, y1, x2, y2] = c;
    const bz = (t, a, b) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
    return x => {
      let lo = 0, hi = 1, t = x;
      for (let i = 0; i < 14; i++) { t = (lo + hi) / 2; if (bz(t, x1, x2) < x) lo = t; else hi = t; }
      return bz(t, y1, y2);
    };
  },

  // 하나 띄움. src: 흰 모양 그림 주소(색은 color로 칠함) 또는 shape: 'rect' | 'circle' (w, h)
  // frames, opts: element.animate와 같은 꼴 ({ duration, delay, easing })
  add(o, frames, opts = {}) {
    if (this.list.length >= this.MAX) return Promise.resolve();
    if (!this.cv) this.init();
    const sp = typeof Prefs !== 'undefined' ? Prefs.speed() : 1;
    const d = typeof opts === 'number' ? { duration: opts } : opts;
    return new Promise(done => {
      const p = { ...o, ks: this.keys(frames), ease: this.easing(d.easing), dur: Math.max(1, (d.duration || 0) / sp), delay: (d.delay || 0) / sp, speed: 1, done };
      if (p.src) this.img(p.src);
      this.list.push(p);
      if (!this.raf) { this.last = performance.now(); this.raf = requestAnimationFrame(t => this.frame(t)); }
    });
  },

  frame(now) {
    const dt = now - this.last;
    this.last = now;
    if (this.rateTo && now > this.rateTo) { this.rate = 1; this.rateTo = 0; }
    const paused = now < this.pausedTo;
    this.tintBudget = 6;
    const g = this.ctx, dpr = this.dpr;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, this.cv.width, this.cv.height);
    const keep = [];
    for (const p of this.list) {
      if (!paused) p.age = (p.age || 0) + dt * this.rate * p.speed;
      const t = (p.age || 0) - p.delay;
      if (t >= p.dur) { p.done(); continue; }
      keep.push(p);
      if (t < 0) continue;
      const u = p.ease(t / p.dur), ks = p.ks;
      let i = 1;
      while (i < ks.length - 1 && ks[i].o < u) i++;
      const a = ks[i - 1], b = ks[i], f = Math.max(0, Math.min(1, (u - a.o) / (b.o - a.o || 1)));
      const v = k => a[k] + (b[k] - a[k]) * f;
      const op = v('op');
      if (op <= 0.01) continue;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.globalAlpha = Math.min(1, op);
      g.translate(p.x + v('tx'), p.y + v('ty'));
      g.rotate(v('rot'));
      g.scale(v('sx'), v('sy'));
      if (p.src) {
        const img = this.tinted(p.src, p.color || '#fff');
        if (img) g.drawImage(img, -p.size / 2, -p.size / 2, p.size, p.size);
      } else {
        g.fillStyle = p.color || '#fff';
        if (p.shape === 'circle') { g.beginPath(); g.ellipse(0, 0, p.w / 2, p.h / 2, 0, 0, Math.PI * 2); g.fill(); }
        else g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
    }
    g.globalAlpha = 1;
    this.list = keep;
    this.raf = keep.length ? requestAnimationFrame(t => this.frame(t)) : 0;
    if (!keep.length) { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, this.cv.width, this.cv.height); }
  },
};

// ---------- 자동 가볍게: 판을 하는 동안 프레임을 재서, 이 폰에서 계속 끊기면 연출을 알아서 줄임 ----------
// 4초(약 240프레임)마다 보고, 34ms(30프레임 밑)를 넘는 프레임이 22% 넘게 두 번 이어지면 '연출 가볍게'를 켜고 한 번 알려 줌
// 직접 설정에서 다시 끄면(autoLightOff) 그 뒤로는 안 건드림
const PerfWatch = {
  init() {
    let last = 0, n = 0, slow = 0, bad = 0;
    const loop = t => {
      const d = t - last;
      last = t;
      const on = document.getElementById('battle')?.classList.contains('active') && !document.hidden;
      if (on && d < 300) {
        n++;
        if (d > 34) slow++;
        if (n >= 240) {
          bad = slow / n > 0.22 ? bad + 1 : 0;
          n = slow = 0;
          if (bad >= 2 && !Prefs.d.light && !Prefs.d.autoLightOff) PerfWatch.lighten();
        }
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  },
  lighten() {
    Prefs.set('light', true);
    Prefs.set('autoLight', true);
    Particles.resize();
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = '이 폰에서 부드럽게 돌도록 연출을 가볍게 바꿨어요 (설정에서 바꿀 수 있어요)';
    document.getElementById('app').appendChild(t);
    t.animate([{ opacity: 0, transform: 'translate(-50%, 20px)' }, { opacity: 1, transform: 'translate(-50%, 0)', offset: 0.1 }, { opacity: 1, transform: 'translate(-50%, 0)', offset: 0.85 }, { opacity: 0, transform: 'translate(-50%, 0)' }],
      { duration: 4200, easing: 'ease-out' }).finished.then(() => t.remove());
  },
};
PerfWatch.init();
