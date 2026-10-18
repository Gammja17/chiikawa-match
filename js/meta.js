// 모으기와 꾸미기: 코인, 캡슐 뽑기(친구, 액세서리), 친구 레벨, 집 꾸미기, 매일 용돈, 친구 이야기, 목소리 칸
const STARTERS = ['chiikawa']; // 처음엔 치이카와 혼자. 나머지는 스테이지, 간식, 라멘 가게, 뽑기로 한 명씩
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
  chiikawa: [[2, [['chiikawa', '(풀 뽑기 끝…)'], ['chiikawa', '(오늘 번 돈으로… 뭐 먹지…)'], ['hachiware', '치이카와~ 라멘 먹으러 가자!'], ['chiikawa', '…!! (끄덕끄덕)']]]],
  hachiware: [[2, [['hachiware', '흐흥~ ♪'], ['hachiware', '언젠가 노래 대회에 나가 보고 싶어. 조금 부끄럽지만…'], ['chiikawa', '…!! (박수)'], ['hachiware', '치이카와가 들어 주면 어떻게든 될 것 같아!']]]],
  usagi: [[2, [['usagi', '우라!'], ['usagi', '푸루루루루…'], ['hachiware', '우사기가 오늘 번 돈으로 간식 사 왔대!'], ['usagi', '야하~!']]]],
  momonga: [[2, [['momonga', '모몽가 오늘 토벌 엄청 열심히 했어.'], ['momonga', '그러니까 칭찬해 줘! 많이! 지금!'], ['chiikawa', '…(쓰담쓰담)'], ['momonga', '에헤헤~ 더!']]]],
  rakko: [[2, [['rakko', '…검을 닦는 것도 수련이다.'], ['hachiware', '랏코 선배 멋있다…!'], ['rakko', '…너희도 매일 하면 된다.']]]],
  kani: [[2, [['kani', '다친 데 없어?'], ['chiikawa', '…(도리도리)'], ['kani', '그래도 반창고는 붙이자. 호~']]]],
  kurimanju: [[2, [['kurimanju', '(꿀꺽꿀꺽)'], ['kurimanju', '……프하아~'], ['kurimanju', '(안주를 슥 내민다)'], ['chiikawa', '…!! (맛있다…!)']]]],
  shisa: [[2, [['shisa', '오늘도 라멘 가게 수행이에요!'], ['shisa', '마스터한테 국물 맛 칭찬받았어요~!'], ['chiikawa', '…!! (박수)']]]],
  shooting: [[2, [['shooting', '반짝!'], ['shooting', '소원을 하나 들어줄게. 뭐든지!'], ['chiikawa', '…(라멘 곱빼기…)']]]],
  darkstar: [[2, [['darkstar', '……'], ['darkstar', '…까만 별도 반짝일 수 있어.'], ['hachiware', '응, 엄청 예뻐!']]]],
  goblin: [[2, [['goblin', '킥킥, 오늘은 장난 안 쳐.'], ['goblin', '…진짜야. 같이 놀래?'], ['usagi', '우라~!']]]],
  beetle: [[2, [['beetle', '부웅~'], ['beetle', '데굴데굴 굴리는 게 제일 좋아.'], ['chiikawa', '…(같이 데굴데굴)']]]],
};
// 몇몇 친구는 좋아하는 간식을 모아서 데려옴 (간식은 스테이지를 깨면 받음)
const TREATS = { parfait: '딸기 파르페', dango: '경단', onigiri: '주먹밥' };
const RECRUIT = {
  momonga: { treat: 'parfait', n: 5, story: [['momonga', '딸기 파르페다! 그거 다 모몽가 주는 거지?'], ['momonga', '에헤헤~ 좋아, 오늘부터 같이 다녀 줄게. 대신 매일 칭찬해 줘야 해!'], ['chiikawa', '…!! (끄덕끄덕)']] },
  kurimanju: { treat: 'dango', n: 5, story: [['kurimanju', '……(경단을 바라본다)'], ['kurimanju', '(한 입) ……프하~'], ['hachiware', '쿠리만쥬 씨도 같이 가 준다는 거야!?']] },
  goblin: { treat: 'onigiri', n: 4, story: [['goblin', '킥킥, 주먹밥 냄새가 나서 따라왔어.'], ['goblin', '…맛있다. 너희랑 다니면 이런 거 또 먹을 수 있어?'], ['usagi', '우라~!']] },
  // 모험을 하다 보면 차례로 합류
  hachiware: { stage: ['l', 0], story: [['hachiware', '치이카와~ 같이 하니까 금방 끝났다!'], ['hachiware', '앞으로도 같이 일하자. 둘이면 어떻게든 될 거야~!'], ['chiikawa', '…!! (끄덕끄덕)']] },
  usagi: { stage: ['l', 1], story: [['usagi', '우라!'], ['hachiware', '우사기도 같이 다니고 싶다는 거야!?'], ['usagi', '야하~!!']] },
  kani: { stage: ['b', 0], story: [['kani', '다들 다친 데 없어? 토벌하면 꼭 어디 까지더라.'], ['kani', '내가 따라가서 호~ 해 줄게!'], ['chiikawa', '…!']] },
  rakko: { stage: ['b', 1], story: [['rakko', '…제법이군.'], ['rakko', '다음 토벌, 같이 간다.'], ['hachiware', '랏코 선배랑 같이…!?'], ['chiikawa', '…!!!']] },
  shisa: { stage: ['l', 8], story: [['shisa', '도와주셔서 감사합니다~!'], ['shisa', '마스터가 밖에서 수행하고 오래요. 저도 토벌 따라가도 될까요!?'], ['hachiware', '물론이지~! 같이 가자!'], ['shisa', '넵! 열심히 하겠습니다!']] },
};
// 스테이지마다 주는 간식 (토벌은 딸기 파르페)
const stageTreat = (t, i) => (t === 'b' ? 'parfait' : ['dango', 'parfait', 'onigiri'][i % 3]);

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
    d.treats = d.treats || {};
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
  // 간식: 처음 깨면 별 수만큼, 다시 깨면 1개. 결과 창에 넣을 [아이콘, 개수]를 돌려줌
  treat(t, i, stars, first) {
    const k = stageTreat(t, i), n = first ? stars : 1;
    Save.data.treats[k] = (Save.data.treats[k] || 0) + n;
    Save.save();
    return [`<img class="row-ic" src="${ITEM(k)}">`, '+' + n];
  },
  canRecruit(id) {
    const r = RECRUIT[id];
    return !!r && !Meta.owned(id) && (r.treat ? (Save.data.treats[r.treat] || 0) >= r.n : false);
  },
  async recruit(id) {
    const r = RECRUIT[id];
    if (r.treat) Save.data.treats[r.treat] -= r.n;
    Save.data.own[id] = 1;
    Save.save();
    await playStory(r.story);
    await Meta.joinShow(id);
  },
  // 스테이지를 깨서 합류하는 친구 (시사)
  async stageJoin(t, i) {
    for (const [id, r] of Object.entries(RECRUIT)) {
      if (r.stage && r.stage[0] === t && r.stage[1] === i && !Meta.owned(id)) {
        Save.data.own[id] = 1;
        Save.save();
        await playStory(r.story);
        await Meta.joinShow(id);
      }
    }
  },
  // 새 친구 합류: 빛이 돌고 친구가 통 튀어나와 이름과 한마디
  joinShow(id) {
    const ch = CHARS[charIdx(id)];
    const n = Object.keys(Save.data.own).length;
    return new Promise(done => {
      const el = document.createElement('div');
      el.className = 'join-show';
      el.style.setProperty('--ring', ch.ring);
      el.innerHTML = `<div class="rays"></div><div class="jtag">새 친구!</div><img src="${art(id)}"><b>${ch.name}</b><p>${lineOf(id)}</p><small>친구 ${n}명 · 톡 눌러서 계속</small>`;
      app.appendChild(el);
      const [, tag, img, name] = el.children;
      Sound.play('jingle_win', 1.1, 0.8);
      setTimeout(() => Sound.voice(id, 'pick') || Sound.play('star', 1.3, 0.8), 350);
      confetti(16);
      el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
      img.animate([{ transform: 'translateY(60px) scale(.3)', opacity: 0 }, { transform: 'translateY(-14px) scale(1.12)', opacity: 1, offset: 0.6 }, { transform: 'none' }], { duration: 520, delay: 120, easing: 'ease-out', fill: 'backwards' });
      tag.animate([{ transform: 'scale(2.4) rotate(-14deg)', opacity: 0 }, { transform: 'scale(1) rotate(-6deg)', opacity: 1 }], { duration: 300, delay: 400, easing: 'cubic-bezier(.6,0,.9,.6)', fill: 'backwards' });
      name.animate([{ transform: 'translateY(16px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 300, delay: 560, fill: 'backwards' });
      setTimeout(() => {
        el.onclick = () => {
          Sound.play('click');
          el.onclick = null;
          el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' }).finished.then(() => { el.remove(); done(); });
        };
      }, 700);
    });
  },
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
      modal({ title: '오늘의 용돈', img: ITEM('coin'), text: '하치와레: 오늘도 와 줬구나~ 용돈 50코인이야!', rows: [['코인', '+50']], btn1: '고마워!', on1: () => Meta.addCoins(50) });
      $('#modalChar').classList.add('icon');
    }, 700);
  },
};

// ---------- 하트: 5개까지, 20분마다 하나씩 참. 모험 지도 스테이지를 못 깨면 하나 줄어듦 ----------
const HEART_MAX = 5, HEART_MS = 20 * 60 * 1000, HEART_REFILL = 150;
const Hearts = {
  sync() {
    const d = Save.data;
    if (d.hearts == null) d.hearts = HEART_MAX;
    if (d.hearts >= HEART_MAX) { d.heartAt = Date.now(); return; }
    const n = Math.floor((Date.now() - (d.heartAt || Date.now())) / HEART_MS);
    if (n > 0) {
      d.hearts = Math.min(HEART_MAX, d.hearts + n);
      d.heartAt = d.hearts >= HEART_MAX ? Date.now() : d.heartAt + n * HEART_MS;
      Save.save();
    }
  },
  n() { Hearts.sync(); return Save.data.hearts; },
  // 다음 하트까지 남은 시간 "12:30"
  wait() {
    const ms = Math.max(0, HEART_MS - (Date.now() - Save.data.heartAt));
    const m = Math.floor(ms / 60000), sec = Math.floor((ms % 60000) / 1000);
    return `${m}:${String(sec).padStart(2, '0')}`;
  },
  lose() {
    Hearts.sync();
    if (Save.data.hearts >= HEART_MAX) Save.data.heartAt = Date.now();
    Save.data.hearts = Math.max(0, Save.data.hearts - 1);
    Save.save();
    Hearts.ui();
  },
  ui() {
    const n = Hearts.n(), full = n >= HEART_MAX;
    document.querySelectorAll('.hearts').forEach(el => {
      el.querySelector('b').textContent = n;
      el.querySelector('small').textContent = full ? 'MAX' : Hearts.wait();
      el.classList.toggle('empty', !n);
    });
  },
  // 하트가 있으면 바로 시작, 없으면 기다리거나 코인으로 채우기
  need(go, no = () => {}) {
    if (Hearts.n() > 0) return go();
    Sound.play('bad', 1, 0.6);
    modal({
      title: '하트가 없어요', img: ITEM('heart'), text: `다음 하트까지 ${Hearts.wait()} · 코인 ${HEART_REFILL}개로 다 채울 수 있어요`,
      btn2: '기다릴게', on2: no,
      btn1: `채우기 ${HEART_REFILL}`,
      on1: () => {
        if (Save.data.coins < HEART_REFILL) { Sound.play('bad'); floatNum(app.clientWidth / 2, app.clientHeight / 2, '코인이 모자라요', '#e2543f'); no(); return; }
        Meta.addCoins(-HEART_REFILL);
        Save.data.hearts = HEART_MAX;
        Save.data.heartAt = Date.now();
        Save.save();
        Hearts.ui();
        Sound.play('heal', 1.2, 0.9);
        go();
      },
    });
    $('#modalChar').classList.add('icon');
  },
};
setInterval(() => $('#map').classList.contains('active') && Hearts.ui(), 1000);

// ---------- 친구 상세 (편성, 친구들, 집에서 열림) ----------
const Sheet = {
  // 아직 없는 친구: 데려오는 방법 (간식 모으기, 스테이지, 뽑기)
  recruitHtml(id) {
    const r = RECRUIT[id];
    if (!r) return `<div class="recruit"><img src="${ITEM('gift')}"><span>캡슐 뽑기에서 만나요</span></div>`;
    if (r.stage) { const k = routeIdx(r.stage[0], r.stage[1]); return `<div class="recruit"><img src="${ITEM(routeStage(k).icon)}"><span>${k + 1}. ${routeStage(k).name}을(를) 깨면 와요</span></div>`; }
    const have = Save.data.treats[r.treat] || 0;
    return `<div class="recruit"><img src="${ITEM(r.treat)}"><span>${TREATS[r.treat]} ${Math.min(have, r.n)} / ${r.n}</span>
      <button class="big-btn" data-recruit ${have >= r.n ? '' : 'disabled'}>데려오기</button></div>`;
  },
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
      ${own ? `<div class="sheet-lv"><b>Lv ${lv}</b><div class="lvbar"><i style="width:${(lv / LV_MAX) * 100}%"></i></div><small>${lv >= LV_MAX ? 'MAX' : '뽑기에서 또 만나면 레벨 업'}</small></div>` : Sheet.recruitHtml(id)}
      <div class="sheet-rows"><div>${ch.heal ? '회복' : '공격'}<b>${stat.split(' ')[1]}</b></div><div>속성<b>${ATTR[ch.attr].icon}${ATTR[ch.attr].name}</b></div><div>스킬 게이지<b>${ch.skill.need}</b></div></div>
      <div class="sheet-skill"><b>${ch.skill.name}</b> ${ch.skill.desc}</div>
      ${own ? `<div class="sheet-label">액세서리</div><div class="sheet-accs"><button data-a="" class="${Save.data.wear[id] ? '' : 'on'}">없음</button>${Save.data.acc.map(a => `<button data-a="${a}" class="${Save.data.wear[id] === a ? 'on' : ''}"><img src="${ITEM(a)}"></button>`).join('') || ''}</div>
        ${Save.data.acc.length ? '' : '<small class="sheet-hint">캡슐 뽑기에서 액세서리를 모아 보세요</small>'}` : ''}
      <div class="sheet-stories">${own ? stories : ''}</div>
      <div class="sheet-btns"><button class="big-btn ghost" data-close>닫기</button>${opts.action && own ? `<button class="big-btn" data-act>${opts.action.label}</button>` : ''}</div>`;
    const say = () => {
      const bub = card.querySelector('.sheet-say');
      bub.textContent = lineOf(ch.id);
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
    const rb = card.querySelector('[data-recruit]');
    if (rb) rb.onclick = async () => { el.classList.remove('show'); await Meta.recruit(id); Sheet.open(id, opts); opts.onChange && opts.onChange(); };
    const act = card.querySelector('[data-act]');
    if (act) act.onclick = () => { el.classList.remove('show'); opts.action.run(); };
    if (!el.classList.contains('show')) {
      el.classList.add('show');
      fitText(el);
      card.animate([{ transform: 'translateY(60%)', opacity: 0 }, { transform: 'translateY(-3%)', opacity: 1, offset: 0.7 }, { transform: 'none' }], { duration: 320, easing: 'ease-out' });
      if (own) setTimeout(say, 200);
    }
  },
};

// 아직 없는 친구 카드 위: 모으는 간식과 개수 (데려올 수 있으면 반짝)
const treatBadge = id => {
  const r = RECRUIT[id];
  if (!r || !r.treat) return '';
  return `<span class="tbadge${Meta.canRecruit(id) ? ' ready' : ''}"><img src="${ITEM(r.treat)}">${Math.min(Save.data.treats[r.treat] || 0, r.n)}/${r.n}</span>`;
};

// ---------- 친구들 (도감) ----------
function openFriends() {
  show('friends');
  const n = CHARS.filter(c => Meta.owned(c.id)).length;
  $('#friendsCount').textContent = `${n} / ${CHARS.length}`;
  $('#friendsGrid').innerHTML = CHARS.map(c => `<button class="fcard${Meta.owned(c.id) ? '' : ' locked'}" style="--ring:${c.ring}" data-id="${c.id}">
    ${Meta.owned(c.id) ? Meta.figure(c.id, art(c.id)) : `<span class="fig"><img src="${art(c.id)}" class="shadow"></span>`}
    <span class="fname">${Meta.owned(c.id) ? c.name : '???'}</span>${Meta.owned(c.id) ? `<span class="flv">Lv${Meta.lv(c.id)}</span>` : treatBadge(c.id)}</button>`).join('');
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
    // 간식·스테이지로 데려오는 친구는 처음엔 뽑기에서 안 나옴
    const pool = CHARS.filter(c => !RECRUIT[c.id] || Meta.owned(c.id));
    const c = pool[Math.floor(Math.random() * pool.length)];
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
    new: () => ({ title: '새 친구!', char: prize.id, text: `${ch.name}: "${lineOf(ch.id)}"`, rows: [['친구', ch.name], ['레벨', 'Lv1']] }),
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

// ---------- 친구네 집: 친구마다 자기 집이 있고, 가구를 놓고, 같이 살 친구를 정함 ----------
// Save.data.homes = { 친구id: { furn: [가구id], mates: [같이 사는 친구id] } }
const MATES_MAX = 2;
let homeOf = null;
const homes = () => {
  const d = Save.data;
  if (!d.homes) {
    d.homes = {};
    if (d.furn && d.furn.length) d.homes.chiikawa = { furn: d.furn.slice(), mates: [] }; // 예전 '우리 집' 가구는 치이카와네로
  }
  return d.homes;
};
const home = id => (homes()[id] = homes()[id] || { furn: [], mates: [] });

function openHouse(id = homeOf) {
  const owned = CHARS.filter(c => Meta.owned(c.id));
  if (!id || !Meta.owned(id)) id = owned[0].id;
  homeOf = id;
  const ch = CHARS[charIdx(id)], h = home(id);
  show('house');
  Meta.coinUI();
  $('#houseTitle').textContent = `${ch.name}네 집`;
  // 위쪽: 누구네 집으로 갈지
  $('#homeTabs').innerHTML = owned.map(c => `<button class="${c.id === id ? 'on' : ''}" data-id="${c.id}" style="--ring:${c.ring}"><img src="${FACE(c.id)}"></button>`).join('');
  $('#homeTabs').querySelectorAll('button').forEach(b => (b.onclick = () => { Sound.play('pop', 1.2, 0.5); openHouse(b.dataset.id); }));
  $('#homeTabs .on')?.scrollIntoView({ inline: 'center', block: 'nearest' });
  const room = $('#room');
  room.style.setProperty('--ring', ch.ring);
  room.querySelectorAll('.furn, .resident').forEach(e => e.remove());
  FURN.filter(f => h.furn.includes(f.id)).forEach(f => {
    const im = new Image();
    im.src = ITEM(f.id);
    im.className = 'furn';
    Object.assign(im.style, { left: f.x + '%', top: f.y + '%', width: f.w + '%' });
    room.appendChild(im);
  });
  // 집주인 + 같이 사는 친구들. 꾹 잡고 끌면 원하는 자리로 옮겨지고, 그 자리를 기억함
  h.pos = h.pos || {};
  [id, ...h.mates.filter(m => Meta.owned(m))].forEach((cid, k) => {
    const c = CHARS[charIdx(cid)];
    const el = document.createElement('div');
    el.className = 'resident' + (k === 0 ? ' owner' : '');
    el.innerHTML = Meta.figure(c.id, art(c.id)) + '<span class="rsay"></span>';
    const [x, y] = h.pos[cid] || [[50, 26, 74][k], [80, 74, 74][k]];
    const put = (nx, ny) => Object.assign(el.style, { left: nx + '%', top: ny + '%', zIndex: Math.round(ny) });
    put(x, y);
    el.querySelector('.fig').style.animationDelay = k * 0.2 + 's';
    const say = () => {
      const s = el.querySelector('.rsay');
      s.textContent = lineOf(c.id);
      s.animate([{ opacity: 0, transform: 'translate(-50%, 6px) scale(.6)' }, { opacity: 1, transform: 'translate(-50%, 0) scale(1)', offset: 0.2 }, { opacity: 1, offset: 0.85 }, { opacity: 0 }], { duration: 1600 });
      Sound.voice(c.id, 'pick') || Sound.play('pop', 1.2 + Math.random() * 0.3, 0.6);
      Haptic.tap(15);
    };
    // 톡: 한마디 / 끌기: 들어 올려 옮기기 (바닥 안에서만)
    el.onpointerdown = e => {
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      const rr = room.getBoundingClientRect();
      const sx = e.clientX, sy = e.clientY, ox = parseFloat(el.style.left), oy = parseFloat(el.style.top);
      let moved = false;
      el.onpointermove = ev => {
        const dx = ((ev.clientX - sx) / rr.width) * 100, dy = ((ev.clientY - sy) / rr.height) * 100;
        if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 8) return;
        if (!moved) { moved = true; el.classList.add('held'); Sound.play('swap', 1.4, 0.5); Haptic.tap(10); }
        put(Math.max(10, Math.min(90, ox + dx)), Math.max(64, Math.min(97, oy + dy)));
        el.classList.toggle('flip', ev.clientX < sx);
      };
      el.onpointerup = el.onpointercancel = () => {
        el.onpointermove = el.onpointerup = el.onpointercancel = null;
        if (!moved) return say();
        el.classList.remove('held');
        el.querySelector('.fig').animate([{ transform: 'scale(1.15, .85)' }, { transform: 'scale(.95, 1.05)' }, { transform: 'none' }], { duration: 260, easing: 'ease-out' });
        Sound.play('land', 1.2, 0.6);
        h.pos[cid] = [Math.round(parseFloat(el.style.left)), Math.round(parseFloat(el.style.top))];
        Save.save();
      };
    };
    room.appendChild(el);
  });
  // 아래쪽: 이 집 가구 가게
  $('#shop').innerHTML = FURN.map(f => {
    const have = h.furn.includes(f.id);
    return `<button class="shop-item${have ? ' have' : ''}" data-id="${f.id}" ${have ? 'disabled' : ''}>
      <img src="${ITEM(f.id)}"><span>${f.name}</span><b>${have ? '✓' : `<img src="${ITEM('coin')}">${f.price}`}</b></button>`;
  }).join('');
  $('#shop').querySelectorAll('.shop-item').forEach(b => (b.onclick = () => {
    const f = FURN.find(x => x.id === b.dataset.id);
    if (Save.data.coins < f.price) {
      Sound.play('bad', 1.2, 0.6);
      b.animate([{ transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'none' }], { duration: 200 });
      return;
    }
    h.furn.push(f.id);
    Meta.addCoins(-f.price);
    Sound.play('star', 1.2, 0.8);
    openHouse(id);
    const r = room.getBoundingClientRect(), a = app.getBoundingClientRect();
    burst(r.left - a.left + (r.width * f.x) / 100, r.top - a.top + (r.height * f.y) / 100, '#ffd84d', 14);
  }));
  $('#btnMates').onclick = () => pickMates(id);
}

// 같이 살 친구 고르기 (최대 2명)
function pickMates(id) {
  const h = home(id), ch = CHARS[charIdx(id)];
  const list = CHARS.filter(c => Meta.owned(c.id) && c.id !== id);
  const card = $('#charSheet .sheet-card');
  card.style.setProperty('--ring', ch.ring);
  const draw = () => {
    card.innerHTML = `<div class="mates-title">${ch.name}네 집에 같이 살 친구 <small>${h.mates.length} / ${MATES_MAX}</small></div>
      <div class="mates-grid">${list.map(c => `<button class="${h.mates.includes(c.id) ? 'on' : ''}" data-id="${c.id}" style="--ring:${c.ring}"><img src="${FACE(c.id)}"><span>${c.name}</span></button>`).join('')}</div>
      <div class="sheet-btns"><button class="big-btn" data-close>다 골랐어</button></div>`;
    card.querySelectorAll('.mates-grid button').forEach(b => (b.onclick = () => {
      const k = h.mates.indexOf(b.dataset.id);
      if (k >= 0) h.mates.splice(k, 1);
      else if (h.mates.length < MATES_MAX) h.mates.push(b.dataset.id);
      else { Sound.play('bad', 1.2, 0.5); return; }
      Sound.play('pop', 1.2, 0.5);
      Save.save();
      draw();
    }));
    card.querySelector('[data-close]').onclick = () => { $('#charSheet').classList.remove('show'); openHouse(id); };
  };
  draw();
  $('#charSheet').classList.add('show');
  fitText($('#charSheet'));
}

$('#btnHouse').onclick = () => { Sound.play('click'); go(() => openHouse()); };
$('#btnGacha').onclick = () => { Sound.play('click'); go(openGacha); };
$('#btnFriends').onclick = () => { Sound.play('click'); go(openFriends); };
$('#btnPull').onclick = pullGacha;
document.querySelectorAll('.btn-tomap').forEach(b => (b.onclick = () => { Sound.play('click'); go(openMap); }));
Meta.init();
