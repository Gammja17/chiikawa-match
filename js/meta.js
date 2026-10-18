// 모으기와 꾸미기: 코인, 캡슐 뽑기(친구, 옷), 친구 레벨, 집 꾸미기, 매일 용돈, 친구 이야기, 목소리 칸
const STARTERS = ['chiikawa']; // 처음엔 치이카와 혼자. 나머지는 스테이지, 간식, 라멘 가게, 뽑기로 한 명씩
const LV_MAX = 10;
const GACHA_COST = 100;
// x, y: 방 안 위치(%), w: 너비(%)
// 치이카와네 원룸에 있을 법한 살림 (VARCO로 원작 느낌 그림)
const FURN = [
  { id: 'f_tissue', name: '휴지 상자', price: 50, x: 46, y: 60, w: 10 },
  { id: 'f_grass', name: '풀 화분', price: 60, x: 92, y: 62, w: 13 },
  { id: 'f_cushion', name: '방석', price: 70, x: 26, y: 86, w: 18 },
  { id: 'f_clock', name: '자명종', price: 90, x: 72, y: 16, w: 13 },
  { id: 'f_board', name: '스티커 게시판', price: 110, x: 32, y: 18, w: 20 },
  { id: 'f_rice', name: '밥솥', price: 130, x: 10, y: 84, w: 15 },
  { id: 'f_table', name: '밥상', price: 150, x: 46, y: 74, w: 24 },
  { id: 'f_fridge', name: '작은 냉장고', price: 200, x: 9, y: 60, w: 17 },
  { id: 'f_tv', name: '옛날 TV', price: 240, x: 62, y: 60, w: 17 },
  { id: 'f_futon', name: '이불', price: 300, x: 78, y: 78, w: 30 },
];
// 예전 가구를 산 사람은 새 살림으로 바꿔 줌
const FURN_OLD = { plant: 'f_grass', candle: 'f_tissue', sunflower: 'f_cushion', clock: 'f_clock', teddy: 'f_rice', frame: 'f_board', mirror: 'f_fridge', sofa: 'f_table', tv: 'f_tv', bed: 'f_futon' };
// 레벨이 오르면 열리는 짧은 이야기 (팬 창작)
const CHAR_STORY = {
  chiikawa: [[2, [['chiikawa', '(풀 뽑기 끝! 땀을 닦는다)'], ['chiikawa', '(동전을 세어 본다) …!'], ['hachiware', '저기~ 라멘 먹으러 가자!'], ['chiikawa', '…!! (끄덕끄덕)']]]],
  hachiware: [[2, [['hachiware', '(기타 둥가둥가~) 흐흥~ ♪'], ['hachiware', '언젠가 노래 대회에 나가 보고 싶어. 조금 부끄럽지만…'], ['chiikawa', '…!! (박수)'], ['hachiware', '네가 들어 주면 어떻게든 될 것 같아!']]]],
  usagi: [[2, [['usagi', '우라!'], ['usagi', '(반짝이는 돌을 내민다)'], ['hachiware', '돌 모으는 게 취미라는 거야!? 이거 주는 거야!?'], ['usagi', '야하~!']]]],
  momonga: [[2, [['momonga', '(남의 토벌 보수를 슬쩍 챙긴다)'], ['momonga', '뭘 봐? 내가 제일 열심히 했으니까 내 거야.'], ['chiikawa', '…!! (울먹울먹)'], ['momonga', '흥! 대신 칭찬하게 해 줄게. 빨리 해!']]]],
  rakko: [[2, [['rakko', '…검을 닦는 것도 수련이다.'], ['hachiware', '선생님 멋있다…!'], ['rakko', '…너희도 매일 하면 강해진다.'], ['rakko', '(단 과자를 한 입) (좋아… 맛있다…!)']]]],
  kani: [[2, [['kani', '(헌책방 문 앞에서 꾸벅 인사한다)'], ['kani', '(게 모자를 고쳐 쓰고, 책 한 권을 골라 준다)'], ['momonga', '얘는 내 단짝이야. 건드리면 가만 안 둬!'], ['kani', '(모몽가에게 간식을 슬쩍 내민다)'], ['chiikawa', '…!! (반짝반짝)']]]],
  kurimanju: [[2, [['kurimanju', '(꿀꺽꿀꺽)'], ['kurimanju', '……하아~~ 으어어…'], ['kurimanju', '(안주를 슥 내민다)'], ['chiikawa', '(모구모구…) …!!']]]],
  shisa: [[2, [['shisa', '오늘도 라멘 가게 수행이사!'], ['shisa', '스승님한테 국물 맛 칭찬받았사! 우레시사~!'], ['chiikawa', '…!! (박수)']]]],
  shooting: [[2, [['shooting', '반짝!'], ['shooting', '소원을 하나 들어줄게. 뭐든지!'], ['chiikawa', '…!! (라멘 그림을 가리킨다)']]]],
  darkstar: [[2, [['darkstar', '오늘이 계속되면 좋겠다며? 들어줬잖아~'], ['darkstar', '아~아, 들켰네~ 칫, 재미없어!'], ['hachiware', '이번엔 장난치면 안 돼!']]]],
  goblin: [[2, [['goblin', '옴 빰 빰~ 예 예 예~'], ['goblin', '제야! 야요!'], ['usagi', '이얏하!']]]],
  beetle: [[2, [['beetle', '냐하~'], ['beetle', '(숙제를 구기고 나서… 춤춘다)'], ['chiikawa', '…!! (꼬옥 안아 준다)']]]],
};
// 몇몇 친구는 좋아하는 간식을 모아서 데려옴 (간식은 스테이지를 깨면 받음)
const TREATS = { parfait: '딸기 파르페', dango: '경단', onigiri: '주먹밥' };
const RECRUIT = {
  momonga: { treat: 'parfait', n: 5, story: [['momonga', '딸기 파르페다! 이리 내. 전부.'], ['momonga', '(순식간에 다 먹어 치운다) …흥, 같이 다녀 줄게. 대신 매일 칭찬해. 안 하면 운다?'], ['chiikawa', '…!! (끄덕끄덕)']] },
  kurimanju: { treat: 'dango', n: 5, story: [['kurimanju', '……(경단을 바라본다)'], ['kurimanju', '(한 입) ……하아~~'], ['hachiware', '같이 가 준다는 거야!?']] },
  goblin: { treat: 'onigiri', n: 4, story: [['goblin', '(주먹밥 냄새를 킁킁)'], ['goblin', '옴 빰 빰~ 예 예 예~!'], ['usagi', '야하!']] },
  // 모험을 하다 보면 차례로 합류
  hachiware: { stage: ['l', 0], story: [['hachiware', '같이 하니까 금방 끝났다!'], ['hachiware', '앞으로도 같이 일하자. 둘이면 어떻게든 될 거야~!'], ['chiikawa', '…!! (끄덕끄덕)']] },
  usagi: { stage: ['l', 1], story: [['usagi', '우라!'], ['hachiware', '너도 같이 다니고 싶다는 거야!?'], ['usagi', '야하~!!']] },
  kani: { stage: ['b', 0], story: [['kani', '(토벌에서 돌아온 걸 보고 꾸벅 인사한다)'], ['kani', '(책 한 권을 골라 살며시 내민다)'], ['hachiware', '쉬는 동안 읽으라는 거야!? …같이 와 준대!'], ['chiikawa', '…!! (끄덕끄덕)']] },
  rakko: { stage: ['b', 1], story: [['rakko', '…강해졌구나.'], ['rakko', '다음 토벌, 같이 간다. 기세를 타라.'], ['hachiware', '선생님이랑 같이…!?'], ['chiikawa', '…!!!']] },
  shisa: { stage: ['l', 8], story: [['shisa', '도와줘서 고맙사~!'], ['shisa', '스승님이 밖에서도 수행하고 오래사. 토벌 따라가도 될까사!?'], ['hachiware', '물론이지~! 같이 가자!'], ['shisa', '열심히 할 거사! 치바리요~!']] },
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
    // 예전 액세서리는 하나에 40코인으로 돌려주고 정리 (옷 갈아입기로 바뀜)
    if (d.acc) { d.coins += d.acc.length * 40; delete d.acc; delete d.wear; }
    d.skins = d.skins || {};   // 가진 옷 { 친구id: [옷id] }
    d.outfit = d.outfit || {}; // 입은 옷 { 친구id: 옷id }
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
  // 친구 그림. 전신 그림이면 입힌 옷 그림으로 통째로 바꿔 끼움 (퍼즐 얼굴은 그대로)
  figure(id, src, cls = '') {
    const s = Save.data.outfit[id];
    if (s && src === art(id) && SKINS[id]?.[s]) src = SKIN(id, s);
    return `<span class="fig ${cls}"><img src="${src}" draggable="false"></span>`;
  },
  // 표정 바꾸기: 기본 옷이고 그 표정 그림이 있으면 바꿔 끼움. m을 비우면 원래대로 (바꿨으면 true)
  mood(fig, id, m) {
    const img = fig.querySelector('img'), f = m && !Save.data.outfit[id] && MOODS[id]?.[m];
    img.dataset.src = img.dataset.src || img.getAttribute('src');
    img.src = f ? `assets/img/skins/${id}/${f}` : img.dataset.src;
    return !!f;
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
      ${own && SKINS[id] ? `<div class="sheet-label">옷</div><div class="sheet-accs"><button data-s="" class="${Save.data.outfit[id] ? '' : 'on'}">기본</button>${(Save.data.skins[id] || []).map(s => `<button data-s="${s}" class="${Save.data.outfit[id] === s ? 'on' : ''}"><img src="${SKIN(id, s)}"></button>`).join('')}</div>
        ${(Save.data.skins[id] || []).length ? '' : '<small class="sheet-hint">캡슐 뽑기에서 옷을 모아 보세요</small>'}` : ''}
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
      if (b.dataset.s) Save.data.outfit[id] = b.dataset.s; else delete Save.data.outfit[id];
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
  // 뽑기: 아직 없는 옷이 남아 있으면 40%로 옷, 아니면 친구 (내가 가진 친구의 옷만 나옴)
  let prize;
  const left = Object.entries(SKINS).flatMap(([cid, ss]) => Meta.owned(cid)
    ? Object.keys(ss).filter(s => !(Save.data.skins[cid] || []).includes(s)).map(s => [cid, s]) : []);
  if (left.length && Math.random() < 0.4) {
    const [cid, s] = left[Math.floor(Math.random() * left.length)];
    (Save.data.skins[cid] = Save.data.skins[cid] || []).push(s);
    prize = { kind: 'skin', id: cid, skin: s };
  } else {
    // 간식·스테이지로 데려오는 친구는 처음엔 뽑기에서 안 나옴
    const pool = CHARS.filter(c => !RECRUIT[c.id] || Meta.owned(c.id));
    const c = pool[Math.floor(Math.random() * pool.length)];
    const lv = Meta.lv(c.id);
    if (!lv) { Save.data.own[c.id] = 1; prize = { kind: 'new', id: c.id }; }
    else if (lv < LV_MAX) { Save.data.own[c.id] = lv + 1; prize = { kind: 'up', id: c.id, lv: lv + 1 }; }
    else { Save.data.coins += 50; prize = { kind: 'max', id: c.id }; }
  }
  Save.save();
  // 캡슐이 덜컹덜컹 굴러 나와 톡 열림
  const m = $('#gachaMachine');
  Sound.play('click', 0.8, 0.9);
  await m.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-6deg)' }, { transform: 'rotate(6deg)' }, { transform: 'rotate(-4deg)' }, { transform: 'rotate(0)' }], { duration: 500 }).finished;
  const cap = $('#capsule');
  const hue = prize.kind === 'new' ? '#ff8ab8' : prize.kind === 'skin' ? '#8fd3ff' : '#ffd84d';
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
    skin: () => ({ title: '새 옷!', img: SKIN(prize.id, prize.skin), text: `${ch.name}의 ${SKINS[prize.id][prize.skin].name}! 친구 상세에서 갈아입힐 수 있어요.`, rows: [] }),
  }[prize.kind]();
  if (prize.kind === 'new' || prize.kind === 'up') Sound.voice(prize.id, 'pick');
  Meta.coinUI();
  modal({ ...info, btn1: '좋아!', on1: () => { cap.className = 'capsule'; openGacha(); } });
  $('#modalChar').classList.toggle('icon', !!info.img && prize.kind !== 'skin');
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
  if (!d.furnV2) {
    Object.values(d.homes).forEach(h => (h.furn = [...new Set((h.furn || []).map(f => FURN_OLD[f] || f))]));
    d.furnV2 = 1;
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
    const R = REACT[c.id] || REACT._, pick = a => a[Math.floor(Math.random() * a.length)];
    const fig = el.querySelector('.fig');
    fig.style.animationDelay = k * 0.2 + 's';
    fig.insertAdjacentHTML('beforeend', '<i class="rfx"></i>');
    el.style.setProperty('--flail', R.flail + 's');
    // 표정 바꾸기 (표정 그림일 때는 눈물 위치도 그 그림 눈에 맞춤)
    let moodT = 0;
    const mood = (m, ms) => {
      clearTimeout(moodT);
      const ok = Meta.mood(fig, c.id, m);
      if (R.eye) el.style.setProperty('--eye', (ok && R.moodEye || R.eye) + '%');
      if (ms) moodT = setTimeout(() => mood(), ms);
    };
    mood();
    const say = (line = lineOf(c.id)) => {
      const s = el.querySelector('.rsay');
      s.textContent = line;
      s.animate([{ opacity: 0, transform: 'translate(-50%, 6px) scale(.6)' }, { opacity: 1, transform: 'translate(-50%, 0) scale(1)', offset: 0.2 }, { opacity: 1, offset: 0.85 }, { opacity: 0 }], { duration: 1600 });
      Sound.voice(c.id, 'pick') || Sound.play('pop', 1.2 + Math.random() * 0.3, 0.6);
      Haptic.tap(15);
    };
    // 쫄깃: 누른 쪽으로 찌그러졌다가 젤리처럼 튕겨 돌아옴 (side: -1 왼쪽 ~ 1 오른쪽)
    const jelly = side => fig.animate([
      { transform: `scale(1.16, .82) skewX(${side * -10}deg)` },
      { transform: `scale(.9, 1.12) skewX(${side * 5}deg)` },
      { transform: 'scale(1.05, .96)' }, { transform: 'scale(.98, 1.02)' }, { transform: 'none' }],
      { duration: 560, easing: 'ease-out' });
    let pokes = [];
    // 톡: 쫄깃 + 한마디 / 끌기: 들어 올리면 바둥바둥, 성격대로 반응 (바닥 안에서만)
    el.onpointerdown = e => {
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      const rr = room.getBoundingClientRect();
      const sx = e.clientX, sy = e.clientY, ox = parseFloat(el.style.left), oy = parseFloat(el.style.top);
      let moved = false, tilt = 0, lastX = sx, raf = 0, reacted = false;
      const timers = [];
      el.classList.add('press'); // 누르는 순간 납작
      // 들고 흔들면 머리를 잡힌 것처럼 반대쪽으로 기울었다가 천천히 돌아옴
      const swing = () => { tilt *= 0.88; el.style.rotate = tilt.toFixed(1) + 'deg'; raf = requestAnimationFrame(swing); };
      el.onpointermove = ev => {
        const dx = ((ev.clientX - sx) / rr.width) * 100, dy = ((ev.clientY - sy) / rr.height) * 100;
        if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 8) return;
        if (!moved) {
          moved = true; el.classList.remove('press'); el.classList.add('held'); swing();
          Sound.play('swap', 1.4, 0.5); Haptic.tap(10);
          timers.push(setTimeout(() => { reacted = true; el.classList.add(R.fx); mood(R.mood || 'happy'); say(pick(R.held)); }, 600));
          if (R.cry) timers.push(setTimeout(() => { el.classList.add('wail'); say(pick(R.cry)); Haptic.tap(25); }, 2200));
        }
        tilt = Math.max(-25, Math.min(25, tilt - (ev.clientX - lastX) * 1.2));
        lastX = ev.clientX;
        put(Math.max(10, Math.min(90, ox + dx)), Math.max(64, Math.min(97, oy + dy)));
        el.classList.toggle('flip', ev.clientX < sx);
      };
      el.onpointerup = el.onpointercancel = ev => {
        el.onpointermove = el.onpointerup = el.onpointercancel = null;
        el.classList.remove('press');
        if (!moved) {
          // 1.5초 안에 세 번 찌르면 성격대로 반응 (치이카와는 울먹)
          const r = el.getBoundingClientRect(), now = performance.now();
          jelly(Math.max(-1, Math.min(1, (ev.clientX - r.left - r.width / 2) / (r.width / 2))));
          pokes = pokes.filter(t => now - t < 1500).concat(now);
          if (pokes.length < 3) { mood('happy', 1400); return say(); }
          pokes = [];
          el.classList.add(R.fx);
          setTimeout(() => el.classList.remove(R.fx), 1400);
          mood(R.mood || 'happy', 1400);
          return say(pick(R.cry || R.held));
        }
        timers.forEach(clearTimeout);
        cancelAnimationFrame(raf);
        el.classList.remove('held', R.fx, 'wail');
        el.style.rotate = '';
        mood();
        if (reacted) say(pick(R.drop));
        if (R.spin) fig.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(360deg)' }], { duration: 420, easing: 'ease-out' });
        else fig.animate([{ transform: 'scale(1.15, .85)' }, { transform: 'scale(.95, 1.05)' }, { transform: 'none' }], { duration: 260, easing: 'ease-out' });
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
