// 모으기와 꾸미기: 코인, 캡슐 뽑기(친구, 액세서리), 친구 레벨, 집 꾸미기, 매일 용돈, 친구 이야기, 목소리 칸
const STARTERS = ['chiikawa', 'hachiware', 'usagi', 'rakko', 'kani'];
const LV_MAX = 10;
const GACHA_COST = 100;
// at: 붙는 자리 (head 머리 위, eyes 눈)
const ACCS = [
  { id: 'ribbon', name: '분홍 리본' }, { id: 'crown', name: '왕관' }, { id: 'tophat', name: '실크햇' },
  { id: 'cap', name: '야구 모자' }, { id: 'shades', name: '선글라스', at: 'eyes' }, { id: 'sakura', name: '벚꽃 핀' },
  { id: 'gradcap', name: '학사모' }, { id: 'berry', name: '딸기 핀' }, { id: 'star', name: '별 핀' }, { id: 'phones', name: '헤드폰' },
];
// x, y: 방 안 위치(%), w: 너비(%)
const FURN = [
  { id: 'plant', name: '화분', price: 80, x: 8, y: 58, w: 15 },
  { id: 'candle', name: '촛불', price: 60, x: 40, y: 47, w: 8 },
  { id: 'sunflower', name: '해바라기', price: 70, x: 91, y: 60, w: 14 },
  { id: 'clock', name: '벽시계', price: 90, x: 72, y: 16, w: 12 },
  { id: 'teddy', name: '곰 인형', price: 100, x: 50, y: 80, w: 13 },
  { id: 'frame', name: '그림 액자', price: 120, x: 30, y: 18, w: 17 },
  { id: 'mirror', name: '거울', price: 150, x: 90, y: 34, w: 13 },
  { id: 'sofa', name: '소파', price: 200, x: 22, y: 74, w: 30 },
  { id: 'tv', name: 'TV', price: 250, x: 55, y: 48, w: 19 },
  { id: 'bed', name: '침대', price: 300, x: 76, y: 76, w: 32 },
];
// 레벨이 오르면 열리는 짧은 이야기 (팬 창작)
const CHAR_STORY = {
  chiikawa: [[2, [['chiikawa', '(풀 뽑기 일 끝…)'], ['chiikawa', '…오늘 번 돈으로 뭐 먹지…'], ['hachiware', '치이카와~ 같이 라멘 먹으러 가자!'], ['chiikawa', '…!! (끄덕끄덕)']]]],
  hachiware: [[2, [['hachiware', '언젠가 노래 대회에 나가 보고 싶어.'], ['chiikawa', '…!'], ['hachiware', '치이카와가 응원해 주면 할 수 있을 것 같아!']]]],
  usagi: [[2, [['usagi', '우라!'], ['usagi', '하아~?'], ['hachiware', '우사기가 오늘 번 돈으로 다 같이 간식 산대!'], ['usagi', '야하!']]]],
  momonga: [[2, [['momonga', '나 오늘 토벌 열심히 했어.'], ['momonga', '그러니까 칭찬해 줘! 지금 당장!'], ['chiikawa', '…(쓰담쓰담)']]]],
  rakko: [[2, [['rakko', '…검을 닦는 것도 수련이야.'], ['hachiware', '랏코 선배 멋있어…!'], ['rakko', '…너희도 할 수 있어.']]]],
  kani: [[2, [['kani', '다친 데 없어?'], ['chiikawa', '…(괜찮아)'], ['kani', '그래도 반창고는 붙이자. 힘내!']]]],
  kurimanju: [[2, [['kurimanju', '……(캬아)'], ['kurimanju', '……(한 잔 더)'], ['hachiware', '쿠리만쥬 씨는 오늘도 행복해 보여.']]]],
  shisa: [[2, [['shisa', '라멘 가게 일, 오늘도 열심히 할게요!'], ['shisa', '사장님한테 칭찬받았어요~!'], ['chiikawa', '…(박수)']]]],
  shooting: [[2, [['shooting', '반짝!'], ['shooting', '소원을 하나 들어줄게. 뭐든지!'], ['chiikawa', '…(라멘 곱빼기…)']]]],
  darkstar: [[2, [['darkstar', '……'], ['darkstar', '…까만 별도 반짝일 수 있어.'], ['hachiware', '응, 엄청 예뻐!']]]],
  goblin: [[2, [['goblin', '킥킥, 오늘은 장난 안 쳐.'], ['goblin', '…진짜야. 같이 놀래?'], ['usagi', '우라~!']]]],
  beetle: [[2, [['beetle', '부웅~'], ['beetle', '데굴데굴 굴리는 게 제일 좋아.'], ['chiikawa', '…(같이 데굴데굴)']]]],
};
const today = () => new Date().toISOString().slice(0, 10);
const charIdx = id => CHARS.findIndex(c => c.id === id);

const Meta = {
  init() {
    const d = Save.data;
    if (d.coins == null) d.coins = 300; // 처음 시작 선물: 뽑기 3번
    d.own = d.own || {};
    [...STARTERS, ...(d.team || [])].forEach(id => { if (!d.own[id]) d.own[id] = 1; });
    d.acc = d.acc || [];
    d.wear = d.wear || {};
    d.furn = d.furn || [];
    Save.save();
    Meta.coinUI();
  },
  owned: id => !!Save.data.own[id],
  lv: id => Save.data.own[id] || 0,
  // 레벨마다 공격·회복 8%씩
  mult: id => 1 + 0.08 * Math.max(0, Meta.lv(id) - 1),
  addCoins(n) {
    Save.data.coins += n;
    Save.save();
    Meta.coinUI(n > 0);
  },
  coinUI(pop) {
    document.querySelectorAll('.coins b').forEach(b => {
      b.textContent = Save.data.coins;
      if (pop) b.parentElement.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 300 });
    });
  },
  // 처음 깨면 100 + 별마다 30, 다시 깨면 별마다 15
  reward(stars, first) {
    const n = first ? 100 + stars * 30 : stars * 15;
    Meta.addCoins(n);
    return n;
  },
  // 액세서리를 얹은 그림 (face: 얼굴 그림이면 true)
  figure(id, src, cls = '') {
    const a = ACCS.find(x => x.id === Save.data.wear[id]);
    return `<span class="fig ${cls}"><img src="${src}" draggable="false">` +
      (a ? `<img class="acc ${a.at || 'head'}" src="${ITEM(a.id)}" draggable="false">` : '') + '</span>';
  },
  checkDaily() {
    if (Save.data.daily === today()) return;
    Save.data.daily = today();
    Save.save();
    setTimeout(() => {
      modal({ title: '오늘의 용돈', img: ITEM('coin'), text: '하치와레: 오늘도 와 줬구나! 용돈 50코인이야~', rows: [['코인', '+50']], btn1: '고마워!', on1: () => Meta.addCoins(50) });
      $('#modalChar').classList.add('icon');
    }, 700);
  },
};

// ---------- 친구 상세 (편성, 친구들, 집에서 열림) ----------
const Sheet = {
  open(id, opts = {}) {
    const ch = CHARS[charIdx(id)];
    const own = Meta.owned(id), lv = Meta.lv(id);
    const el = $('#charSheet');
    const card = el.querySelector('.sheet-card');
    card.style.setProperty('--ring', ch.ring);
    const stat = ch.heal ? `회복 ${Math.round(ch.heal * Meta.mult(id) * 10) / 10}` : `공격 ${Math.round(ch.dmg * Meta.mult(id))}`;
    const stories = (CHAR_STORY[id] || []).map(([need], k) =>
      `<button class="story-btn" data-k="${k}" ${lv >= need ? '' : 'disabled'}>📖 이야기 ${k + 1}${lv >= need ? '' : ` (Lv${need})`}</button>`).join('');
    card.innerHTML = `
      <div class="sheet-art">${own ? Meta.figure(id, art(id), 'big') : `<span class="fig big"><img src="${art(id)}" class="shadow"></span>`}<div class="sheet-say"></div></div>
      <div class="sheet-name">${ch.name} ${attrTag(ch.attr)}</div>
      ${own ? `<div class="sheet-lv"><b>Lv ${lv}</b><div class="lvbar"><i style="width:${(lv / LV_MAX) * 100}%"></i></div><small>${lv >= LV_MAX ? 'MAX' : '뽑기에서 또 만나면 레벨 업'}</small></div>` : '<div class="sheet-lv"><small>아직 못 만났어요. 캡슐 뽑기에서 만날 수 있어요!</small></div>'}
      <div class="sheet-rows"><div>${ch.heal ? '회복' : '공격'}<b>${stat.split(' ')[1]}</b></div><div>속성<b>${ATTR[ch.attr].icon}${ATTR[ch.attr].name}</b></div><div>스킬 게이지<b>${ch.skill.need}</b></div></div>
      <div class="sheet-skill"><b>${ch.skill.name}</b> ${ch.skill.desc}</div>
      ${own ? `<div class="sheet-label">액세서리</div><div class="sheet-accs"><button data-a="" class="${Save.data.wear[id] ? '' : 'on'}">없음</button>${Save.data.acc.map(a => `<button data-a="${a}" class="${Save.data.wear[id] === a ? 'on' : ''}"><img src="${ITEM(a)}"></button>`).join('') || ''}</div>
        ${Save.data.acc.length ? '' : '<small class="sheet-hint">캡슐 뽑기에서 액세서리를 모아 보세요</small>'}` : ''}
      <div class="sheet-stories">${own ? stories : ''}</div>
      <div class="sheet-btns"><button class="big-btn ghost" data-close>닫기</button>${opts.action && own ? `<button class="big-btn" data-act>${opts.action.label}</button>` : ''}</div>`;
    const say = () => {
      const bub = card.querySelector('.sheet-say');
      bub.textContent = ch.line;
      bub.animate([{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1.1)', opacity: 1, offset: 0.6 }, { transform: 'scale(1)', opacity: 1 }], { duration: 260, fill: 'forwards' });
      card.querySelector('.sheet-art .fig').animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-14px) scale(1.04,.96)' }, { transform: 'none' }], { duration: 320 });
      Sound.voice(id, 'pick') || Sound.play('pop', 1.3, 0.6);
    };
    card.querySelector('.sheet-art').onclick = () => own && say();
    card.querySelectorAll('.sheet-accs button').forEach(b => (b.onclick = () => {
      if (b.dataset.a) Save.data.wear[id] = b.dataset.a; else delete Save.data.wear[id];
      Save.save();
      Sound.play('sparkle', 1.3, 0.6);
      Sheet.open(id, opts);
      opts.onChange && opts.onChange();
    }));
    card.querySelectorAll('.story-btn').forEach(b => (b.onclick = async () => {
      el.classList.remove('show');
      await playStory(CHAR_STORY[id][+b.dataset.k][1]);
      Sheet.open(id, opts);
    }));
    card.querySelector('[data-close]').onclick = () => { Sound.play('click'); el.classList.remove('show'); };
    const act = card.querySelector('[data-act]');
    if (act) act.onclick = () => { el.classList.remove('show'); opts.action.run(); };
    if (!el.classList.contains('show')) {
      el.classList.add('show');
      card.animate([{ transform: 'translateY(60%)', opacity: 0 }, { transform: 'translateY(-3%)', opacity: 1, offset: 0.7 }, { transform: 'none' }], { duration: 320, easing: 'ease-out' });
      if (own) setTimeout(say, 200);
    }
  },
};

// ---------- 친구들 (도감) ----------
function openFriends() {
  show('friends');
  const n = CHARS.filter(c => Meta.owned(c.id)).length;
  $('#friendsCount').textContent = `${n} / ${CHARS.length}`;
  $('#friendsGrid').innerHTML = CHARS.map(c => `<button class="fcard${Meta.owned(c.id) ? '' : ' locked'}" style="--ring:${c.ring}" data-id="${c.id}">
    ${Meta.owned(c.id) ? Meta.figure(c.id, art(c.id)) : `<span class="fig"><img src="${art(c.id)}" class="shadow"></span>`}
    <span class="fname">${Meta.owned(c.id) ? c.name : '???'}</span>${Meta.owned(c.id) ? `<span class="flv">Lv${Meta.lv(c.id)}</span>` : ''}</button>`).join('');
  $('#friendsGrid').querySelectorAll('.fcard').forEach(b => (b.onclick = () => { Sound.play('click'); Sheet.open(b.dataset.id, { onChange: openFriends }); }));
}

// ---------- 캡슐 뽑기 ----------
function openGacha() {
  show('gacha');
  Meta.coinUI();
  $('#btnPull').disabled = Save.data.coins < GACHA_COST;
}
async function pullGacha() {
  if (Save.data.coins < GACHA_COST || wiping) return;
  Meta.addCoins(-GACHA_COST);
  $('#btnPull').disabled = true;
  // 뽑기: 친구 60%, 액세서리 40%
  let prize;
  if (Math.random() < 0.6) {
    const c = CHARS[Math.floor(Math.random() * CHARS.length)];
    const lv = Meta.lv(c.id);
    if (!lv) { Save.data.own[c.id] = 1; prize = { kind: 'new', id: c.id }; }
    else if (lv < LV_MAX) { Save.data.own[c.id] = lv + 1; prize = { kind: 'up', id: c.id, lv: lv + 1 }; }
    else { Save.data.coins += 50; prize = { kind: 'max', id: c.id }; }
  } else {
    const a = ACCS[Math.floor(Math.random() * ACCS.length)];
    if (Save.data.acc.includes(a.id)) { Save.data.coins += 40; prize = { kind: 'accdup', acc: a }; }
    else { Save.data.acc.push(a.id); prize = { kind: 'acc', acc: a }; }
  }
  Save.save();
  // 캡슐이 덜컹덜컹 굴러 나와 톡 열림
  const m = $('#gachaMachine');
  Sound.play('click', 0.8, 0.9);
  await m.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-6deg)' }, { transform: 'rotate(6deg)' }, { transform: 'rotate(-4deg)' }, { transform: 'rotate(0)' }], { duration: 500 }).finished;
  const cap = $('#capsule');
  const hue = prize.kind === 'new' ? '#ff8ab8' : prize.kind.startsWith('acc') ? '#8fd3ff' : '#ffd84d';
  cap.style.setProperty('--cap', hue);
  cap.className = 'capsule show';
  Sound.play('land', 1.2, 0.8);
  await cap.animate([
    { transform: 'translate(-50%, -120px) scale(.5)' },
    { transform: 'translate(-50%, 0) scale(1.1,.9)', offset: 0.55 },
    { transform: 'translate(-50%, -24px) scale(.95,1.05)', offset: 0.75 },
    { transform: 'translate(-50%, 0) scale(1)' },
  ], { duration: 650, easing: 'ease-in', fill: 'forwards' }).finished;
  await cap.animate([{ transform: 'translate(-50%,0) rotate(0)' }, { transform: 'translate(-50%,0) rotate(-10deg)' }, { transform: 'translate(-50%,0) rotate(10deg)' }, { transform: 'translate(-50%,0) rotate(0)' }],
    { duration: 380, iterations: 2 }).finished;
  cap.classList.add('open');
  Sound.play('star', 1.1, 0.9);
  const c = centerOf(cap);
  burst(c.x, c.y, hue, 16);
  confetti(prize.kind === 'new' ? 18 : 8);
  flash('#ffffff', 0.5);
  await sleep(300);
  const ch = prize.id ? CHARS[charIdx(prize.id)] : null;
  const info = {
    new: () => ({ title: '새 친구!', char: prize.id, text: `${ch.name}: "${ch.line}"`, rows: [['친구', ch.name], ['레벨', 'Lv1']] }),
    up: () => ({ title: '레벨 업!', char: prize.id, text: `${ch.name}이(가) 더 강해졌어요!`, rows: [['친구', ch.name], ['레벨', `Lv${prize.lv}`], ['공격·회복', `+${Math.round((Meta.mult(prize.id) - 1) * 100)}%`]] }),
    max: () => ({ title: '이미 최고 레벨', char: prize.id, text: '대신 코인 50개를 돌려받았어요.', rows: [['코인', '+50']] }),
    acc: () => ({ title: '새 액세서리!', img: ITEM(prize.acc.id), text: `${prize.acc.name}! 친구 상세에서 씌워 줄 수 있어요.`, rows: [] }),
    accdup: () => ({ title: '이미 있는 액세서리', img: ITEM(prize.acc.id), text: '대신 코인 40개를 돌려받았어요.', rows: [['코인', '+40']] }),
  }[prize.kind]();
  if (prize.kind === 'new' || prize.kind === 'up') Sound.voice(prize.id, 'pick');
  Meta.coinUI();
  modal({ ...info, btn1: '좋아!', on1: () => { cap.className = 'capsule'; openGacha(); } });
  $('#modalChar').classList.toggle('icon', !!info.img);
}

// ---------- 집 꾸미기 ----------
function openHouse() {
  show('house');
  Meta.coinUI();
  const room = $('#room');
  room.querySelectorAll('.furn, .resident').forEach(e => e.remove());
  FURN.filter(f => Save.data.furn.includes(f.id)).forEach(f => {
    const im = new Image();
    im.src = ITEM(f.id);
    im.className = 'furn';
    Object.assign(im.style, { left: f.x + '%', top: f.y + '%', width: f.w + '%' });
    room.appendChild(im);
  });
  // 모은 친구들이 방 안을 통통 돌아다님 (눌러 보면 한마디)
  const friends = CHARS.filter(c => Meta.owned(c.id)).slice(0, 8);
  friends.forEach((c, k) => {
    const el = document.createElement('div');
    el.className = 'resident';
    el.innerHTML = Meta.figure(c.id, art(c.id)) + '<span class="rsay"></span>';
    const x = 10 + ((k * 37) % 80), y = 62 + ((k * 13) % 22);
    Object.assign(el.style, { left: x + '%', top: y + '%', zIndex: Math.round(y) });
    el.style.animationDelay = k * 0.17 + 's';
    el.onclick = () => {
      const s = el.querySelector('.rsay');
      s.textContent = c.line;
      s.animate([{ opacity: 0, transform: 'translate(-50%, 6px) scale(.6)' }, { opacity: 1, transform: 'translate(-50%, 0) scale(1)', offset: 0.2 }, { opacity: 1, offset: 0.85 }, { opacity: 0 }], { duration: 1600 });
      Sound.voice(c.id, 'pick') || Sound.play('pop', 1.2 + Math.random() * 0.3, 0.6);
    };
    // 가끔 옆으로 걸어감
    const wander = () => {
      if (!el.isConnected) return;
      const nx = Math.max(6, Math.min(88, parseFloat(el.style.left) + (Math.random() - 0.5) * 30));
      el.animate([{ left: el.style.left }, { left: nx + '%' }], { duration: 1600, easing: 'ease-in-out' });
      el.style.left = nx + '%';
      el.classList.toggle('flip', Math.random() < 0.5);
      setTimeout(wander, 2500 + Math.random() * 3000);
    };
    setTimeout(wander, 1500 + Math.random() * 2000);
    room.appendChild(el);
  });
  $('#shop').innerHTML = FURN.map(f => {
    const have = Save.data.furn.includes(f.id);
    return `<button class="shop-item${have ? ' have' : ''}" data-id="${f.id}" ${have ? 'disabled' : ''}>
      <img src="${ITEM(f.id)}"><span>${f.name}</span><b>${have ? '놓았어요' : `<img src="${ITEM('coin')}">${f.price}`}</b></button>`;
  }).join('');
  $('#shop').querySelectorAll('.shop-item').forEach(b => (b.onclick = () => {
    const f = FURN.find(x => x.id === b.dataset.id);
    if (Save.data.coins < f.price) {
      Sound.play('bad', 1.2, 0.6);
      b.animate([{ transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'none' }], { duration: 200 });
      return;
    }
    Save.data.furn.push(f.id);
    Meta.addCoins(-f.price);
    Sound.play('star', 1.2, 0.8);
    openHouse();
    const r = room.getBoundingClientRect(), a = app.getBoundingClientRect();
    burst(r.left - a.left + (r.width * f.x) / 100, r.top - a.top + (r.height * f.y) / 100, '#ffd84d', 14);
  }));
}

$('#btnHouse').onclick = () => { Sound.play('click'); go(openHouse); };
$('#btnGacha').onclick = () => { Sound.play('click'); go(openGacha); };
$('#btnFriends').onclick = () => { Sound.play('click'); go(openFriends); };
$('#btnPull').onclick = pullGacha;
document.querySelectorAll('.btn-tomap').forEach(b => (b.onclick = () => { Sound.play('click'); go(openMap); }));
Meta.init();
