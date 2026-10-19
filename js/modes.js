// 도전 화면의 하루짜리 모드: 오늘의 도전(날마다 한 판, 누구나 같은 판), 미믹 보물창고(하루 3번 코인 벌기)
// Save.data.dch = { day, done } 오늘의 도전을 깼는지 / Save.data.dun = { day, n } 오늘 보물창고에 들어간 수

// 날짜 글자로 정해지는 난수 (그날은 누구나 같은 판)
function seeded(text) {
  let s = [...text].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7) >>> 0;
  return () => ((s = (s * 1103515245 + 12345) >>> 0) % 10000) / 10000;
}
// 판 그림 만들기: 빈 판(구멍 모양 hole)에 글자들을 좌우 대칭으로 흩뿌림. put: [[글자, 개수, 위 줄, 아래 줄]]
function scatter(rnd, hole, put) {
  const g = hole.map(row => [...row]), C = g[0].length;
  put.forEach(([ch, n, top = 0, bot = g.length - 1]) => {
    const free = [];
    for (let r = top; r <= bot; r++) for (let c = 0; c < Math.ceil(C / 2); c++) if (g[r][c] === '.' && g[r][C - 1 - c] === '.') free.push([r, c]);
    for (let k = 0; k < n && free.length;) {
      const [r, c] = free.splice(Math.floor(rnd() * free.length), 1)[0];
      g[r][c] = g[r][C - 1 - c] = ch;
      k += c === C - 1 - c ? 1 : 2;
    }
  });
  return g.map(row => row.join(''));
}
const FULL = (r, c) => Array.from({ length: r }, () => '.'.repeat(c));

// 오늘의 비틀기. 장애물 수는 고정이고 자리만 날마다 바뀜 (moves, stars는 자동 플레이 봇으로 잼: 85~90% 깸)
const DAY_TWISTS = [
  { name: '거품만 가득 9x9', icon: 'bubble', host: 'hachiware', types: 5, moves: 16, goals: [{ k: 'bubble' }], stars: [9500, 12500, 14500],
    make: rnd => scatter(rnd, FULL(9, 9), [['o', 26, 0, 8]]) },
  { name: '이동 10번 안에', icon: 'clock', host: 'momonga', types: 5, moves: 10, goals: [{ k: 'weed' }, { k: 'box' }], stars: [3500, 5500, 7500],
    make: rnd => scatter(rnd, ['#.....#', ...FULL(6, 7)], [['w', 6, 3, 6], ['b', 4, 2, 6]]) },
  { name: '큰 잡초 잔뜩', icon: 'weed2', host: 'usagi', types: 5, moves: 20, goals: [{ k: 'weed' }], stars: [9500, 13000, 15000],
    make: rnd => scatter(rnd, FULL(8, 8), [['W', 14, 2, 7]]) },
  { name: '선물 상자 산더미', icon: 'gift', host: 'momonga', types: 5, moves: 19, goals: [{ k: 'box' }], stars: [10000, 13000, 15000],
    make: rnd => scatter(rnd, FULL(8, 8), [['g', 10, 2, 7], ['b', 8, 1, 7]]) },
  { name: '리본 꽁꽁', icon: 'ribbon', host: 'chiikawa', types: 5, moves: 19, goals: [{ k: 'lock' }, { k: 'weed' }], stars: [8000, 12500, 15000],
    make: rnd => scatter(rnd, FULL(8, 8), [['w', 6, 4, 7], ['l', 20, 0, 7]]) },
  { name: '시럽 한가득', icon: 'pancake', host: 'chiikawa', types: 5, moves: 26, goals: [{ k: 'syrup' }], stars: [14000, 19000, 21000],
    make: rnd => scatter(rnd, ['#......#', ...FULL(6, 8), '#......#'], [['s', 2, 3, 4]]) },
  { name: '특급 재료 배달', icon: 'ramen', host: 'shisa', types: 5, moves: 19, goals: [{ k: 'ing' }, { k: 'box' }], stars: [10500, 13000, 15500], ing: { n: 4, max: 2, kinds: ['naruto', 'egg'] },
    make: rnd => scatter(rnd, ['..i..i..', ...FULL(5, 8), '#......#', '##....##'], [['b', 6, 3, 6]]) },
  { name: '42초 깜짝 시험', icon: 'medal', host: 'usagi', types: 5, time: 42, exam: true, goals: [{ k: 'weed' }, { k: 'score', n: 9000 }], stars: [10000, 12500, 15500],
    make: rnd => scatter(rnd, FULL(8, 8), [['W', 4, 3, 7], ['w', 8, 2, 7]]) },
  { name: '친구 잔뜩 모으기', icon: 'target', host: 'kurimanju', types: 6, moves: 22, goals: [{ k: 'char', id: 'kurimanju', n: 24 }, { k: 'bubble' }], stars: [6500, 8500, 13000],
    make: rnd => scatter(rnd, FULL(8, 8), [['o', 8, 2, 7]]) },
];
const dayNo = day => Math.round(Date.parse(day) / 864e5);
// 그날의 판: 비틀기는 날마다 차례로 돌고(5칸씩 건너뛰어 9가지를 다 돎), 자리는 날짜로 섞음
function dayStage(day = today()) {
  const tw = DAY_TWISTS[(dayNo(day) * 5) % DAY_TWISTS.length];
  const { make, ...st } = tw;
  return { ...JSON.parse(JSON.stringify(st)), twist: tw.name, name: '오늘의 도전', intro: tw.name, done: '오늘의 도전<br>성공!', map: make(seeded(day)) };
}

// 미믹 보물창고: 정해진 이동 안에 상자를 깨서 코인. 선물 상자(두 번)는 미믹: 한 대 치면 상자만 남음
// 상자를 다 깨면 새로 굴러 들어옴. 코인은 봇 기준 한 판 100~150 (뽑기 100, 처음 깨기 130~190과 맞춤)
const DUNGEON = { name: '미믹 보물창고', icon: 'gift', types: 5, moves: 15, host: 'hachiware', dungeon: true, intro: '15번! 상자를 깨서 코인!',
  goals: [], stars: [6000, 9000, 12000],
  map: ['........', '.b....b.', '..g..g..', '.b.bb.b.', '...gg...', '.b....b.', 'b.g..g.b', '........'] };
const DUN_COIN = { box: 3, mimic: 5, refill: 10 }; // 상자 하나, 미믹 한 대, 다 깨고 새로 들어올 때
// 간식 창고: 판은 보물창고와 같고 상자 속엔 골라 둔 간식. 코인 셈 30마다 간식 하나 (한 판 4~7개, 하루 3번)
const SNACK = { ...DUNGEON, name: '간식 창고', host: 'kurimanju', intro: '15번! 상자 속 간식을 찾아!' };
const SNACK_PER = 30;
const DUN_DAILY = 3;
const DCH_COINS = 150;
const dayTreat = day => ['dango', 'parfait', 'onigiri'][dayNo(day) % 3];

// 도전 화면 카드 처음 볼 때 안내: [본 표시, 카드, 한 줄]. 도전이 처음 열릴 때는 tutor.js의 UNLOCK_INTRO가 이어서 보여 줌
const CH_TIPS = [
  ['chDaily', '#btnDayChal', '오늘의 도전! 하루에 한 판, 날마다 판이 바뀌어. 깨면 코인이랑 간식을 줘'],
  ['chDungeon', '#btnDungeon', '미믹 보물창고! 15번 움직이는 동안 상자를 깨면 코인이 나와. 하루 3번'],
  ['chSnack', '#btnSnack', '간식 창고! 받고 싶은 간식을 톡 골라 두고 들어가. 간식은 친구 데려오기랑 강화에 써'],
];
async function chTips() {
  if (Tutor.busyFlow || chTips.on || CH_TIPS.every(([k]) => Tutor.seen(k))) return;
  chTips.on = true;
  await sleep(500);
  for (const [k, sel, text] of CH_TIPS) {
    if (Tutor.seen(k) || !$('#challenge').classList.contains('active')) continue;
    Tutor.mark(k);
    await Spot.show($(sel), text);
  }
  chTips.on = false;
}

// ---------- 오늘의 도전 ----------
const DayChal = {
  done: () => Save.data.dch?.day === today() && Save.data.dch.done,
  start() { return Life.begin(dayStage(), { kind: 'daily' }); },
  // 도전 화면 카드: 오늘의 비틀기와 깼는지
  card() {
    const st = dayStage();
    $('#dayTwist').textContent = st.twist;
    $('#dayState').innerHTML = DayChal.done() ? '오늘 완료 ✓' : `<img src="${ITEM('coin')}">${DCH_COINS} + <img src="${ITEM(dayTreat(today()))}">×2`;
    $('#btnDayChal').classList.toggle('done', DayChal.done());
    chTips();
  },
  // Life.win에서 보너스 타임 뒤에 부름. 보상은 하루 한 번
  async cleared() {
    const st = L.st, day = today();
    const stars = L.score >= st.stars[2] ? 3 : L.score >= st.stars[1] ? 2 : 1;
    const first = !DayChal.done();
    const rows = [['점수', L.score]];
    if (first) {
      Save.data.dch = { day, done: true };
      Meta.addCoins(DCH_COINS);
      Save.data.treats[dayTreat(day)] = (Save.data.treats[dayTreat(day)] || 0) + 2;
      Daily.add('dchal');
      rows.push([`<img class="row-ic" src="${ITEM('coin')}">`, '+' + DCH_COINS], [`<img class="row-ic" src="${ITEM(dayTreat(day))}">`, '+2']);
    } else rows.push(['보상', '내일 또!']);
    Save.save();
    Sound.play('win', 1);
    await clearShow(doneWord(st));
    Sound.music(null);
    const ch = mvp();
    modal({
      title: '오늘의 도전 성공!', stars, char: ch.id, text: `${ch.name}: "${lineOf(ch.id)}"`, rows,
      btn1: '좋아!', on1: () => go(openChallenge),
    });
  },
};
$('#btnDayChal').onclick = () => { Sound.play('open'); go(DayChal.start); };

// ---------- 미믹 보물창고 ----------
const Dungeon = {
  snack: false, // true: 간식 창고 (하루 횟수는 창고마다 따로)
  key: (snack = Dungeon.snack) => (snack ? 'snackDun' : 'dun'),
  left(snack = Dungeon.snack) { const d = Save.data[Dungeon.key(snack)]; return DUN_DAILY - (d?.day === today() ? d.n : 0); },
  got: () => Math.floor(Dungeon.coins / SNACK_PER), // 간식 창고에서 지금까지 모은 간식
  card() {
    const n = Dungeon.left(false);
    $('#dunLeft').textContent = n > 0 ? `오늘 ${n} / ${DUN_DAILY}번` : '내일 또 열려요';
    $('#btnDungeon').classList.toggle('done', n <= 0);
    const m = Dungeon.left(true), pick = Save.data.snackPick || 'dango';
    $('#snackLeft').textContent = m > 0 ? `오늘 ${m} / ${DUN_DAILY}번` : '내일 또 열려요';
    $('#btnSnack').classList.toggle('done', m <= 0);
    $('#snackPick').innerHTML = Object.keys(TREATS).map(t => `<i data-t="${t}" class="${t === pick ? 'on' : ''}"><img src="${ITEM(t)}" alt="">${Save.data.treats[t] || 0}</i>`).join('');
  },
  start(snack = false) {
    if (Dungeon.left(snack) <= 0) return;
    Object.assign(Dungeon, { snack, coins: 0, boxes: 0, mimics: 0, treat: Save.data.snackPick || 'dango' });
    return Life.begin(snack ? SNACK : DUNGEON, { kind: 'dungeon' });
  },
  // 판 위쪽 목표 칸: 보물창고는 코인, 간식 창고는 모은 간식
  chip: () => `<div class="gchip coin"><img src="${ITEM(Dungeon.snack ? Dungeon.treat : 'coin')}"><b>${Dungeon.snack ? Dungeon.got() : Dungeon.coins}</b></div>`,
  // 맞은 상자에서 코인이 톡 (미믹은 한 대 맞으면 상자만 남음)
  loot(res) {
    res.hits.forEach(({ r, c, tile, gone }) => {
      if (tile.block !== 'box') return;
      const n = gone ? DUN_COIN.box : DUN_COIN.mimic, had = Dungeon.got();
      if (gone) Dungeon.boxes++; else Dungeon.mimics++;
      Dungeon.coins += n;
      const p = tileCenter(r, c);
      const text = !Dungeon.snack ? `+${n} 코인` : Dungeon.got() > had ? `+1 ${TREATS[Dungeon.treat]}` : null; // 간식은 하나 찰 때만 톡
      if (text) setTimeout(() => floatNum(p.x, p.y - B.S * 0.3, text, Dungeon.snack ? '#ff5d9e' : '#e0a020'), 220);
    });
  },
  // 상자를 다 깨면 새 상자와 미믹이 굴러 들어옴
  async refill() {
    Dungeon.coins += DUN_COIN.refill;
    Sound.play('special', 1, 0.9);
    banner(Dungeon.snack ? '새 상자!' : `새 상자! +${DUN_COIN.refill} 코인`, 450);
    const drop = [...Board.dropBlocks(B.grid, 6, 'box', 1), ...Board.dropBlocks(B.grid, 2, 'box', 2)];
    drop.forEach(({ r, c, old, tile }, k) => setTimeout(() => {
      popTile(old, 0);
      makeTile(tile);
      place(tile, r, c);
      tile.inner.animate([{ transform: 'scale(0) translateY(-40%)' }, { transform: 'scale(1.2)', offset: 0.6 }, { transform: 'scale(1)' }], { duration: 320, easing: 'ease-out' });
    }, k * 50));
    await sleep(550);
    if (!Board.hasMove(B.grid)) await cascade(null, []);
  },
  // 이동을 다 쓰면 끝: 점수 1000마다 1코인 더
  async end() {
    B.over = true;
    B.busy = true;
    clearSel();
    Sound.music(null);
    Sound.play('jingle_win', 1, 0.9);
    await banner(Dungeon.snack ? '간식 창고 끝!!' : '보물창고 끝!!', 700);
    // 끝까지 한 판만 하루 횟수를 씀 (중간에 나가면 코인도 횟수도 없음)
    Save.data[Dungeon.key()] = { day: today(), n: DUN_DAILY - Dungeon.left() + 1 };
    const bonus = Math.floor(L.score / 1000), total = Dungeon.coins + bonus;
    if (Dungeon.snack) return Dungeon.endSnack(total);
    Meta.addCoins(total);
    Daily.add('mimic');
    Save.save();
    confetti(14);
    const n = Dungeon.left();
    modal({
      title: '보물창고 끝!', char: 'hachiware', text: `하치와레: "${total >= 120 ? '코인이 잔뜩이야~! 부자가 됐다는 거야!?' : '상자 속에 코인이 들어 있었어~!'}"`,
      rows: [[`<img class="row-ic" src="${ITEM('box')}">`, `${Dungeon.boxes}개`], [`<img class="row-ic" src="${ITEM('gift')}">`, `미믹 ${Dungeon.mimics}번`], ['점수 보너스', '+' + bonus], [`<img class="row-ic" src="${ITEM('coin')}">`, '+' + total]],
      btn2: n > 0 ? '나가기' : '', on2: () => go(openChallenge),
      btn1: n > 0 ? `한 번 더 (${n}번 남음)` : '나가기', on1: () => go(n > 0 ? () => Dungeon.start(false) : openChallenge),
    });
  },
  // 간식 창고 정산: 코인 셈(점수 보너스 포함) 30마다 고른 간식 하나, 적어도 하나
  endSnack(total) {
    const t = Dungeon.treat, got = Math.max(1, Math.round(total / SNACK_PER));
    Save.data.treats[t] = (Save.data.treats[t] || 0) + got;
    Save.save();
    confetti(14);
    const n = Dungeon.left();
    modal({
      title: '간식 창고 끝!', char: 'kurimanju', text: got >= 6 ? '쿠리만쥬: "……하아~~"' : '쿠리만쥬: "……(간식을 꼭 안고 있다)"',
      rows: [[`<img class="row-ic" src="${ITEM('box')}">`, `${Dungeon.boxes}개`], [`<img class="row-ic" src="${ITEM('gift')}">`, `미믹 ${Dungeon.mimics}번`], [`<img class="row-ic" src="${ITEM(t)}">`, `${TREATS[t]} +${got}`]],
      btn2: n > 0 ? '나가기' : '', on2: () => go(openChallenge),
      btn1: n > 0 ? `한 번 더 (${n}번 남음)` : '나가기', on1: () => go(n > 0 ? () => Dungeon.start(true) : openChallenge),
    });
  },
};
$('#btnDungeon').onclick = () => {
  if (Dungeon.left(false) <= 0) { Sound.play('bad', 1.2, 0.5); banner('내일 또 열려요', 500); return; }
  Sound.play('open');
  go(() => Dungeon.start(false));
};
// 간식 창고: 이름표 안의 간식을 누르면 받을 간식만 바꾸고, 나머지를 누르면 들어감
$('#btnSnack').onclick = e => {
  const t = e.target.closest('[data-t]')?.dataset.t;
  if (t) { Save.data.snackPick = t; Save.save(); Sound.play('pop', 1.2, 0.5); Dungeon.card(); return; }
  if (Dungeon.left(true) <= 0) { Sound.play('bad', 1.2, 0.5); banner('내일 또 열려요', 500); return; }
  Sound.play('open');
  go(() => Dungeon.start(true));
};
