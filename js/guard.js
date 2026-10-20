// 에러 모으기와 멈춤 풀기
// - 플레이어 폰에서 난 에러를 Firestore errors 컬렉션에 쌓음 (한 번 켤 때 최대 8개, 같은 에러는 한 번만)
// - 판이 20초 넘게 아무것도 안 하고 멈춰 있으면 기록하고, 다시 시작할 수 있게 창을 띄움
const VER = (document.querySelector('script[src*="game.js"]')?.src.split('v=')[1]) || '?';
const Guard = {
  sent: 0, seen: new Set(), queue: [],
  // 에러가 났을 때 어디였는지
  ctx() {
    try {
      const scr = document.querySelector('.screen.active')?.id || '-';
      if (scr !== 'battle') return scr;
      const name = B.mode === 'life' ? L.st?.name : STAGES[B.stage]?.name;
      const k = B.mode === 'life' ? (L.run?.kind === 'route' ? routeIdx('l', L.i) + 1 : L.run?.kind) : routeIdx('b', B.stage) + 1;
      return `${scr} ${B.mode} ${k} ${name} ${ROWS}x${COLS} busy=${B.busy} over=${B.over}`;
    } catch { return '?'; }
  },
  report(kind, msg, stack = '') {
    const key = kind + ':' + msg;
    if (Guard.seen.has(key) || Guard.sent >= 8) return;
    Guard.seen.add(key);
    Guard.sent++;
    Guard.queue.push({
      kind: String(kind).slice(0, 20), msg: String(msg).slice(0, 300), stack: String(stack).slice(0, 1200),
      ctx: Guard.ctx().slice(0, 300), ver: String(VER).slice(0, 20), ua: navigator.userAgent.slice(0, 160),
    });
    Guard.flush();
  },
  flush() {
    if (typeof Net === 'undefined' || !Net.on) return;
    while (Guard.queue.length) {
      const d = Guard.queue.shift();
      Net.db.collection('errors').add({ ...d, uid: Net.user?.uid || '', at: firebase.firestore.FieldValue.serverTimestamp() }).catch(() => {});
    }
  },
};
// 앞에서(index.html) 모아 둔 것 + 이제부터 나는 것
(window.__errs || []).forEach(e => Guard.report(e[0], e[1], e[2]));
window.__errs = { push: e => Guard.report(e[0], e[1], e[2]) };
if (typeof Net !== 'undefined') Net.onChange(Guard.flush);
setTimeout(Guard.flush, 4000);

// ---------- 멈춤 풀기 ----------
// 판 화면인데 B.busy가 켜진 채로, 창도 연출도 없이 20초가 지나면 멈춘 걸로 봄
let stuckFor = 0;
const overlayOpen = () => ['#modal', '#story', '#charSheet', '#pause'].some(s => $(s)?.classList.contains('show')) ||
  !!document.querySelector('.spot, .join-show, .cine, .cutin, .wipe, .clear-show, .fever-show');
const moving = () => document.getAnimations().some(a => a.playState === 'running' && a.effect?.getTiming().iterations !== Infinity);
setInterval(() => {
  const on = $('#battle').classList.contains('active') && B.busy && !B.over && !(B.mode === 'life' && L.ending) && !overlayOpen() && !moving();
  stuckFor = on ? stuckFor + 1 : 0;
  if (stuckFor < 20) return;
  stuckFor = 0;
  Guard.report('stuck', '판이 20초 넘게 멈춤');
  Life.stopTimer();
  modal({
    title: '앗, 판이 멈췄어요', char: 'hachiware', text: '하치와레: 미안, 뭔가 꼬였나 봐. 하트는 그대로니까 다시 해 보자!',
    btn2: '지도로', on2: () => { B.over = true; go(leaveTo()); },
    btn1: '다시 시작',
    on1: () => {
      B.over = true;
      go(() => {
        if (B.mode === 'battle') return startStage(B.stage);
        if (L.run?.kind === 'tower') return Tower.start(L.run.floor);
        if (L.run?.kind === 'contest') return Life.begin(CONTEST, { kind: 'contest' });
        if (L.run?.kind === 'league') return League.start();
        return Life.start(L.i);
      });
    },
  });
}, 1000);
