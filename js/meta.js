// 모으기와 꾸미기: 코인, 캡슐 뽑기(친구, 옷), 친구 레벨, 집 꾸미기, 매일 용돈, 친구 이야기, 목소리 칸
const STARTERS = ['chiikawa']; // 처음엔 치이카와 혼자. 나머지는 스테이지, 간식, 라멘 가게, 뽑기로 한 명씩
const LV_MAX = 10;
// 강화: 뽑기에서 이미 있는 친구가 나오면 조각. Lv n → n+1 에 조각 SHARD_NEED[n]개 + 코인 n×80
const SHARD_PER_DUP = 10;
const SHARD_NEED = [0, 10, 15, 20, 25, 30, 40, 50, 60, 80];
// 간식으로 데려온 친구(모몽가·쿠리만쥬·고블린)는 좋아하는 간식도 Lv×2개 더 듦 (대신 레벨마다 더 많이 오름)
const upCost = id => { const lv = Meta.lv(id), t = RECRUIT[id]?.treat; return lv >= LV_MAX ? null : { shards: SHARD_NEED[lv], coins: lv * 80, treat: t, tn: t ? lv * 2 : 0 }; };
const canUp = id => { const c = upCost(id); return !!c && Meta.owned(id) && (Save.data.shards[id] || 0) >= c.shards && Save.data.coins >= c.coins && (!c.treat || (Save.data.treats[c.treat] || 0) >= c.tn); };
// 레벨로 오르는 몫: 레벨마다 +8% (간식으로 데려온 친구는 +12%)
const lvMult = (id, lv = Meta.lv(id)) => 1 + (RECRUIT[id]?.treat ? 0.12 : 0.08) * Math.max(0, lv - 1);
// 레벨 lv일 때 공격(회복) 숫자. 옷·친밀도 보너스는 지금 그대로 두고 레벨 몫만 바꿔 셈 (강화하면 얼마나 오르는지 미리 보여 주려고)
const powAt = (id, lv) => { const ch = CHARS[charIdx(id)], m = Meta.mult(id) / lvMult(id) * lvMult(id, lv); return ch.heal ? Math.round(ch.heal * m * 10) / 10 : Math.round(ch.dmg * m); };
const GACHA_COST = 100;
// x, y: 처음 놓일 자리(%, 가구 아래쪽 가운데), w: 너비(%). wall: 벽에 거는 것, flat: 바닥에 까는 것(늘 맨 아래)
// 치이카와네 원룸에 있을 법한 살림 (VARCO로 원작 느낌 그림)
const FURN = [
  { id: 'f_tissue', name: '휴지 상자', price: 50, x: 46, y: 60, w: 10 },
  { id: 'f_grass', name: '풀 화분', price: 60, x: 92, y: 62, w: 13 },
  { id: 'f_cushion', name: '방석', price: 70, x: 26, y: 86, w: 18 },
  { id: 'f_clock', name: '자명종', price: 90, x: 72, y: 16, w: 13, wall: true },
  { id: 'f_board', name: '스티커 게시판', price: 110, x: 32, y: 18, w: 20, wall: true },
  { id: 'f_rice', name: '밥솥', price: 130, x: 10, y: 84, w: 15 },
  { id: 'f_table', name: '밥상', price: 150, x: 46, y: 74, w: 24 },
  { id: 'f_fridge', name: '작은 냉장고', price: 200, x: 9, y: 60, w: 17 },
  { id: 'f_tv', name: '옛날 TV', price: 240, x: 62, y: 60, w: 17 },
  { id: 'f_futon', name: '이불', price: 300, x: 78, y: 78, w: 30 },
  { id: 'f_poster', name: '라멘 포스터', price: 60, x: 40, y: 44, w: 15, wall: true },
  { id: 'f_garland', name: '깃발 장식', price: 70, x: 50, y: 16, w: 36, wall: true },
  { id: 'f_wclock', name: '벽시계', price: 80, x: 76, y: 26, w: 12, wall: true },
  { id: 'f_frame', name: '꽃 액자', price: 90, x: 60, y: 40, w: 13, wall: true },
  { id: 'f_shelf', name: '벽 선반', price: 110, x: 80, y: 48, w: 22, wall: true },
  { id: 'f_window', name: '창문', price: 120, x: 24, y: 40, w: 24, wall: true },
  { id: 'f_stool', name: '나무 의자', price: 60, x: 34, y: 90, w: 11 },
  { id: 'f_balloon', name: '풍선', price: 80, x: 14, y: 70, w: 14 },
  { id: 'f_cake', name: '딸기 케이크', price: 90, x: 54, y: 80, w: 11 },
  { id: 'f_lamp', name: '스탠드', price: 100, x: 8, y: 76, w: 12 },
  { id: 'f_toybox', name: '장난감 상자', price: 130, x: 70, y: 94, w: 16 },
  { id: 'f_rug', name: '둥근 러그', price: 140, x: 50, y: 97, w: 44, flat: true },
  { id: 'f_monstera', name: '큰 화분', price: 150, x: 92, y: 94, w: 18 },
  { id: 'f_bookcase', name: '책장', price: 180, x: 88, y: 72, w: 20 },
  { id: 'f_sofa', name: '작은 소파', price: 260, x: 28, y: 76, w: 30 },
  { id: 'f_kotatsu', name: '코타츠', price: 320, x: 56, y: 90, w: 30 },
];
// 벽지·바닥: 산 건 모든 집에서 골라 쓸 수 있음 (id ''는 기본)
const WALLS = [
  { id: '', name: '기본 벽' }, { id: 'w_dot', name: '분홍 물방울', price: 120 }, { id: 'w_stripe', name: '민트 줄무늬', price: 120 }, { id: 'w_check', name: '복숭아 체크', price: 120 },
  { id: 'w_star', name: '노란 별', price: 150 }, { id: 'w_heart', name: '라벤더 하트', price: 150 }, { id: 'w_daisy', name: '데이지', price: 150 },
  { id: 'w_cloud', name: '구름 하늘', price: 180 }, { id: 'w_night', name: '밤하늘', price: 200 },
];
const FLOORS = [
  { id: '', name: '기본 마루' }, { id: 'fl_wood', name: '꿀색 마루', price: 100 }, { id: 'fl_dark', name: '초코 마루', price: 100 }, { id: 'fl_tile', name: '분홍 타일', price: 120 },
  { id: 'fl_carpet', name: '하늘 카펫', price: 120 }, { id: 'fl_tatami', name: '다다미', price: 150 }, { id: 'fl_stone', name: '디딤돌', price: 150 },
  { id: 'fl_grass', name: '풀밭', price: 180 }, { id: 'fl_sand', name: '모래사장', price: 200 },
];
const DECO_IMG = id => `assets/img/house/${id}.webp`;
// 예전 가구를 산 사람은 새 살림으로 바꿔 줌
const FURN_OLD = { plant: 'f_grass', candle: 'f_tissue', sunflower: 'f_cushion', clock: 'f_clock', teddy: 'f_rice', frame: 'f_board', mirror: 'f_fridge', sofa: 'f_table', tv: 'f_tv', bed: 'f_futon' };
// 레벨이 오르면 열리는 짧은 이야기 (팬 창작)
const CHAR_STORY = {
  chiikawa: [[2, [['chiikawa', '(풀 뽑기 끝! 땀을 닦는다)'], ['chiikawa', '(동전을 세어 본다) …!'], ['hachiware', '저기~ 라멘 먹으러 가자!'], ['chiikawa', '…!! (끄덕끄덕)']]]],
  hachiware: [[2, [['hachiware', '(기타 둥가둥가~) 흐흥~ ♪'], ['hachiware', '언젠가 노래 대회에 나가 보고 싶어. 조금 부끄럽지만…'], ['chiikawa', '…!! (박수)'], ['hachiware', '네가 들어 주면 어떻게든 될 것 같아!']]]],
  usagi: [[2, [['usagi', '우라!'], ['usagi', '(반짝이는 돌을 내민다)'], ['hachiware', '돌 모으는 게 취미라는 거야!? 이거 주는 거야!?'], ['usagi', '야하~!']]]],
  momonga: [[2, [['momonga', '(남의 토벌 보수를 슬쩍 챙긴다)'], ['momonga', '뭘 봐? 내가 제일 열심히 했으니까 내 거야.'], ['chiikawa', '…!! (울먹울먹)'], ['momonga', '흥! 대신 칭찬하게 해 줄게. 빨리 해!']]]],
  rakko: [[2, [['rakko', '…검을 닦는 것도 수련이야.'], ['hachiware', '선생님 멋있다…!'], ['rakko', '…너희도 매일 하면 강해질 거야!'], ['rakko', '(단 과자를 한 입) (좋아… 맛있다…!)']]]],
  kani: [[2, [['kani', '(헌책방 문 앞에서 꾸벅 인사한다)'], ['kani', '(게 머리띠를 고쳐 쓰고, 책 한 권을 골라 준다)'], ['momonga', '얘는 내 단짝이야. 건드리면 가만 안 둬!'], ['kani', '(모몽가에게 간식을 슬쩍 내민다)'], ['chiikawa', '…!! (반짝반짝)']]]],
  kurimanju: [[2, [['kurimanju', '(꿀꺽꿀꺽)'], ['kurimanju', '……하아~~ 으어어…'], ['kurimanju', '(안주를 슥 내민다)'], ['chiikawa', '(모구모구…) …!!']]]],
  shisa: [[2, [['shisa', '오늘도 라멘 가게에서 수행이에요!'], ['shisa', '사부님께 국물 맛 칭찬받았어요! 기쁜 시사~!'], ['chiikawa', '…!! (박수)']]]],
  shooting: [[2, [['shooting', '반짝!'], ['shooting', '소원을 하나 들어줄게. 뭐든지!'], ['chiikawa', '…!! (라멘 그림을 가리킨다)']]]],
  darkstar: [[2, [['darkstar', '오늘이 계속되면 좋겠다며? 들어줬잖아~'], ['darkstar', '아~아, 들켰네~ 칫, 재미없어!'], ['hachiware', '이번엔 장난치면 안 돼!']]]],
  goblin: [[2, [['goblin', '옴 빰 빰~ 예 예 예~'], ['goblin', '제야! 야요!'], ['usagi', '이얏하!']]]],
  beetle: [[2, [['beetle', '냐하~'], ['beetle', '(제초 검정 참고서를 구기고 나서… 춤춘다)'], ['chiikawa', '…!! (꼬옥 안아 준다)']]]],
};
// 몇몇 친구는 좋아하는 간식을 모아서 데려옴 (간식은 스테이지를 깨면 받음)
const TREATS = { parfait: '딸기 파르페', dango: '경단', onigiri: '주먹밥' };
const RECRUIT = {
  momonga: { treat: 'parfait', n: 10, story: [['momonga', '딸기 파르페다! 이리 내. 전부.'], ['momonga', '(순식간에 다 먹어 치운다) …흥, 같이 다녀 줄게. 대신 매일 칭찬해. 안 하면 운다?'], ['chiikawa', '…!! (끄덕끄덕)']] },
  kurimanju: { treat: 'dango', n: 30, story: [['kurimanju', '……(경단을 바라본다)'], ['kurimanju', '(한 입) ……하아~~'], ['hachiware', '같이 가 준다는 거야!?']] },
  goblin: { treat: 'onigiri', n: 50, story: [['goblin', '(주먹밥 냄새를 킁킁)'], ['goblin', '옴 빰 빰~ 예 예 예~!'], ['usagi', '야하!']] },
  // 모험을 하다 보면 차례로 합류
  hachiware: { stage: ['l', 0], story: [['hachiware', '같이 하니까 금방 끝났다!'], ['hachiware', '앞으로도 같이 일하자. 둘이면 어떻게든 될 거야~!'], ['chiikawa', '…!! (끄덕끄덕)']] },
  usagi: { stage: ['l', 1], story: [['usagi', '우라!'], ['hachiware', '너도 같이 다니고 싶다는 거야!?'], ['usagi', '야하~!!']] },
  // 카니: 모몽가가 온 뒤 새 판을 3개 더 깨면 같이 옴. 원작처럼 모몽가가 게 머리띠 두 개를 겹쳐 쓰다가 불편해서,
  // 하나를 헌책방 주인 머리에 그냥 툭 얹어 줌 → 그 뒤로 늘 쓰고 다님
  kani: { after: 'momonga', wait: 3, story: [['momonga', '(게 머리띠를 두 개나 겹쳐 쓰고 뽐낸다)'], ['momonga', '…무거워. 불편해.'], ['momonga', '(헌책방 앞을 지나다가, 하나를 책방 주인 머리에 툭 얹어 준다)'], ['kani', '(…! 머리 위 머리띠를 살짝 만져 본다)'], ['kani', '(그 뒤로 게 머리띠를 꼭 쓰고 모몽가를 따라다닌다)'], ['chiikawa', '…!! (끄덕끄덕)']] },
  rakko: { stage: ['b', 1], story: [['rakko', '…강해졌구나!'], ['rakko', '다음 토벌, 나랑 같이 가자!'], ['hachiware', '선생님이랑 같이…!?'], ['chiikawa', '…!!!']] },
  shisa: { stage: ['l', 2], story: [['shisa', '도와주셔서 고마워요~!'], ['shisa', '사부님이 밖에서도 수행하고 오래요. 토벌은 서툴지만… 따라가도 될까요!?'], ['hachiware', '물론이지~! 같이 가자!'], ['shisa', '열심히 할게요!']] },
};
// 스테이지마다 주는 간식 (일상·토벌 모두 세 가지가 돌아가며)
const stageTreat = (t, i) => ['dango', 'parfait', 'onigiri'][(t === 'b' ? i + 1 : i) % 3]; // 토벌도 돌아가며 (예전엔 늘 파르페라 모몽가가 너무 빨리 옴)

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
    d.shards = d.shards || {}; // 강화 조각 { 친구id: 개수 }
    d.skins = d.skins || {};   // 가진 옷 { 친구id: [옷id] }
    d.outfit = d.outfit || {}; // 입은 옷 { 친구id: 옷id }
    // 없어진 옷(예전 치이카와 포켓 코스튬)은 한 벌에 40코인으로 돌려주고 정리
    Object.keys(d.skins).forEach(id => { const ok = (d.skins[id] || []).filter(s => SKINS[id]?.[s]); d.coins += ((d.skins[id] || []).length - ok.length) * 40; d.skins[id] = ok; });
    Object.keys(d.outfit).forEach(id => { if (!SKINS[id]?.[d.outfit[id]]) delete d.outfit[id]; });
    d.furn = d.furn || [];
    d.treats = d.treats || {};
    Save.save();
    Meta.coinUI();
  },
  owned: id => !!Save.data.own[id],
  lv: id => Save.data.own[id] || 0,
  // 레벨마다 공격·회복 8%씩
  mult: id => lvMult(id) * (Save.data.outfit?.[id] ? 1.05 : 1), // 레벨마다 +8% (간식으로 데려온 친구는 +12%), 옷을 입으면 +5%
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
  // 간식: 처음 깨면 1개(별 3개면 2개), 다시 깨면 1개. 결과 창에 넣을 [아이콘, 개수]를 돌려줌
  treat(t, i, stars, first) {
    const k = stageTreat(t, i), n = first && stars === 3 ? 2 : 1;
    Save.data.treats[k] = (Save.data.treats[k] || 0) + n;
    Save.save();
    return [`<img class="row-ic" src="${ITEM(k)}">`, '+' + n];
  },
  // 모험 지도 판을 처음 깨면 MVP(토벌)나 같이 간 친구(일상)에게 조각을 별 수만큼(1~3). 최고 레벨이면 없음. 결과 창에 넣을 [아이콘, 글] 또는 null
  shardGift(id, stars) {
    if (!Meta.owned(id) || Meta.lv(id) >= LV_MAX) return null;
    Save.data.shards[id] = (Save.data.shards[id] || 0) + stars;
    Save.save();
    friendsDot();
    return [`<img class="row-ic face" src="${FACE(id)}">`, `조각+${stars}`];
  },
  canRecruit(id) {
    const r = RECRUIT[id];
    return !!r && !Meta.owned(id) && (r.treat ? (Save.data.treats[r.treat] || 0) >= r.n : false);
  },
  async recruit(id) {
    const r = RECRUIT[id];
    if (r.treat) Save.data.treats[r.treat] -= r.n;
    Save.data.own[id] = 1;
    (Save.data.joinAt = Save.data.joinAt || {})[id] = clearedCount();
    Save.save();
    await playStory(r.story);
    await Meta.joinShow(id);
  },
  // 스테이지를 깨서 합류하는 친구 (시사), 누가 온 뒤 새 판을 몇 개 더 깨면 오는 친구 (카니: 모몽가가 온 뒤 3판)
  // 예전 기록엔 합류한 때가 없어서 0으로 셈 (이미 모몽가가 있으면 다음 새 판에 바로 옴)
  async stageJoin(t, i) {
    for (const [id, r] of Object.entries(RECRUIT)) {
      if (Meta.owned(id)) continue;
      const byStage = r.stage && r.stage[0] === t && r.stage[1] === i;
      const byFriend = r.after && Meta.owned(r.after) && clearedCount() >= (Save.data.joinAt?.[r.after] || 0) + r.wait;
      if (byStage || byFriend) {
        Save.data.own[id] = 1;
        (Save.data.joinAt = Save.data.joinAt || {})[id] = clearedCount();
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
    if (Hearts.inf()) return; // 무한 리필 중엔 안 줄어듦
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
      el.querySelector('small').textContent = Hearts.inf() ? '∞ ' + Hearts.infLeft() : full ? 'MAX' : Hearts.wait();
      el.classList.toggle('empty', !n);
    });
  },
  // 무한 리필권: 30분 동안 하트가 안 줄어듦 (Save.data.infUntil)
  inf: () => (Save.data.infUntil || 0) > Date.now(),
  infLeft: () => Math.ceil(((Save.data.infUntil || 0) - Date.now()) / 60000) + '분',
  startInf() { Save.data.infUntil = Math.max(Date.now(), Save.data.infUntil || 0) + 30 * 60000; Save.save(); Hearts.ui(); },
  add(k) { Hearts.sync(); Save.data.hearts = Math.min(HEART_MAX, Save.data.hearts + k); if (Save.data.hearts >= HEART_MAX) Save.data.heartAt = Date.now(); Save.save(); Hearts.ui(); },
  // 하트가 있으면 바로 시작, 없으면 기다리거나 코인으로 채우기
  need(go, no = () => {}) {
    if (Hearts.n() > 0 || Hearts.inf()) return go();
    const lunch = Items.n('lunch') > 0, refill = !lunch && Items.n('refill') > 0; // 포장 코너에서 사 둔 것부터
    Sound.play('bad', 1, 0.6);
    modal({
      title: '하트가 없어요', img: ITEM('heart'), text: `다음 하트까지 ${Hearts.wait()} · 코인 ${HEART_REFILL}개로 다 채울 수 있어요`,
      rows: !lunch && Save.data.coins >= itemPrice('lunch') ? [[`<img class="row-ic" src="${ITEM('bento')}">`, `<button class="mini-btn" data-lunch>도시락 사서 먹기 · 코인 ${itemPrice('lunch')}</button>`]] : [],
      btn2: '기다릴게', on2: no,
      btn1: lunch ? `하트 도시락 먹기 (${Items.n('lunch')})` : refill ? `무한 리필권 쓰기 (${Items.n('refill')})` : `채우기 ${HEART_REFILL}`,
      on1: () => {
        if (lunch || refill) { Items.use(lunch ? 'lunch' : 'refill'); lunch ? Hearts.add(1) : Hearts.startInf(); Sound.play('heal', 1.2, 0.9); go(); return; }
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
    const lb = $('#modalRows [data-lunch]');
    if (lb) lb.onclick = () => { Meta.addCoins(-itemPrice('lunch')); Hearts.add(1); Sound.play('heal', 1.2, 0.9); $('#modal').classList.remove('show'); go(); };
  },
};
setInterval(() => $('#map').classList.contains('active') && Hearts.ui(), 1000);

// ---------- 친구 상세 (편성, 친구들, 집에서 열림) ----------
const Sheet = {
  // 아직 없는 친구: 데려오는 방법 (간식 모으기, 스테이지, 뽑기)
  recruitHtml(id) {
    const r = RECRUIT[id];
    const meet = (icon, text) => `<section class="sh-sec"><h3>만나는 곳</h3><div class="recruit"><img src="${ITEM(icon)}"><span><b>${text}</b></span></div></section>`;
    if (!r) return meet('gift', '가게 캡슐 뽑기에서 만나요');
    if (r.stage) { const k = routeIdx(r.stage[0], r.stage[1]); return meet(routeStage(k).icon, `${k + 1}. ${routeStage(k).name}을(를) 깨면 와요`); }
    if (r.after) { const n = CHARS[charIdx(r.after)].name, jong = (n.charCodeAt(n.length - 1) - 0xac00) % 28; return meet('ribbon', `${n}${jong ? '과' : '와'} 친해지고 조금 지나면 와요`); }
    const have = Save.data.treats[r.treat] || 0;
    return `<section class="sh-sec"><h3>데려오기 <small>좋아하는 간식을 모으면 같이 다녀요</small></h3><div class="recruit"><img src="${ITEM(r.treat)}"><span><b>${TREATS[r.treat]} ${Math.min(have, r.n)} / ${r.n}</b><span class="sh-bar"><i style="width:${Math.min(1, have / r.n) * 100}%"></i></span></span>
      <button class="big-btn" data-recruit ${have >= r.n ? '' : 'disabled'}>데려오기</button></div></section>`;
  },
  // 강화 칸: 드는 것(조각·간식·코인)과 가진 개수, 강화하면 오르는 숫자, 강화 버튼. 최고 레벨이면 없음
  upHtml(id) {
    const lv = Meta.lv(id), ch = CHARS[charIdx(id)];
    if (lv >= LV_MAX) return '';
    const c = upCost(id), shard = Save.data.shards[id] || 0, tr = c.treat ? Save.data.treats[c.treat] || 0 : 0;
    const mat = (ok, icon, label, have, need) => `<div class="mat${ok ? '' : ' lack'}">${icon}<b>${have}${need ? `<i>/${need}</i>` : ''}</b><small>${label}</small></div>`;
    const lack = [shard < c.shards && '조각은 가게 캡슐 뽑기에서 또 만나면 10개', c.treat && tr < c.tn && `${TREATS[c.treat]}는 도전 › 간식 창고`, Save.data.coins < c.coins && '코인이 모자라요'].filter(Boolean);
    const pow0 = powAt(id, lv), pow1 = powAt(id, lv + 1), need0 = skillNeed(id, false), need1 = skillNeed(id, false, lv + 1);
    return `<section class="sh-sec">
      <h3>강화 <small>Lv ${lv} → ${lv + 1}</small></h3>
      <div class="up-mats">
        ${mat(shard >= c.shards, `<span class="shard-ic"><img src="${FACE(id)}" alt=""></span>`, '조각', shard, c.shards)}
        ${c.treat ? mat(tr >= c.tn, `<img src="${ITEM(c.treat)}" alt="">`, TREATS[c.treat], tr, c.tn) : ''}
        ${mat(Save.data.coins >= c.coins, `<img src="${ITEM('coin')}" alt="">`, '코인', c.coins, 0)}
      </div>
      <div class="up-row">
        <div class="up-next"><span>${ch.heal ? '회복' : '공격'} ${pow1 > pow0 ? `${pow0} → <b>${pow1}</b>` : `<b>+${RECRUIT[id]?.treat ? 12 : 8}%</b>`}</span>${need1 < need0 ? `<span>게이지 ${need0} → <b>${need1}</b></span>` : ''}</div>
        <button class="up-btn${canUp(id) ? ' ready' : ''}" data-up>강화</button>
      </div>
      ${lack.length ? `<small class="up-hint">${lack.join(' · ')}</small>` : ''}
    </section>`;
  },
  // 강화 연출: 레벨 도장이 쾅, 바가 차오르고, 오른 숫자 옆에 +몇이 톡
  levelUp(id, before) {
    const card = $('#charSheet .sheet-card'), ch = CHARS[charIdx(id)], lv = Meta.lv(id);
    const artEl = card.querySelector('.sheet-art'), fig = artEl.querySelector('.fig');
    Sound.play('star', 1.2); Sound.play('jingle_win', 1.3, 0.5);
    setTimeout(() => Sound.voice(id, 'pick'), 300);
    const stamp = document.createElement('div');
    stamp.className = 'lvup-stamp';
    stamp.innerHTML = `<small>LEVEL UP!</small><b>Lv ${lv}</b>`;
    artEl.appendChild(stamp);
    stamp.animate([{ transform: 'translate(-50%,-50%) scale(2.2) rotate(-14deg)', opacity: 0 }, { transform: 'translate(-50%,-50%) scale(.92) rotate(-6deg)', opacity: 1, offset: 0.25 }, { transform: 'translate(-50%,-50%) scale(1) rotate(-6deg)', opacity: 1, offset: 0.8 }, { transform: 'translate(-50%,-80%) scale(1) rotate(-6deg)', opacity: 0 }], { duration: 1500, easing: 'ease-out', fill: 'forwards' }).finished.then(() => stamp.remove());
    fig.animate([{ transform: 'none' }, { transform: 'translateY(-26px) scale(1.06,.94)', offset: 0.35 }, { transform: 'translateY(0) scale(1.08,.92)', offset: 0.6 }, { transform: 'none' }], { duration: 520, easing: 'ease-out' });
    const bar = card.querySelector('.sh-bar i');
    bar.animate([{ width: (before.lv / LV_MAX) * 100 + '%' }, { width: bar.style.width }], { duration: 600, delay: 200, easing: 'ease-out', fill: 'backwards' });
    card.querySelector('.sh-lv b').animate([{ transform: 'scale(1)' }, { transform: 'scale(1.6)', color: ch.ring }, { transform: 'scale(1)' }], { duration: 420, delay: 300 });
    // 오른 숫자: 그 숫자가 초록으로 반짝, 옆에 +몇 (게이지는 줄어드는 게 좋은 것)
    const gains = { pow: Math.round((powAt(id, lv) - before.pow) * 10) / 10, need: before.need - skillNeed(id, false) };
    Object.entries(gains).forEach(([k, d], j) => {
      if (!d) return;
      const cell = card.querySelector(`[data-st="${k}"]`);
      cell.classList.add('gain');
      const tag = document.createElement('em');
      tag.textContent = k === 'need' ? '−' + d : '+' + d;
      cell.appendChild(tag);
      tag.animate([{ transform: 'translateY(8px) scale(.4)', opacity: 0 }, { transform: 'translateY(-4px) scale(1.2)', opacity: 1, offset: 0.4 }, { transform: 'none', opacity: 1 }], { duration: 420, delay: 500 + j * 150, easing: 'ease-out', fill: 'backwards' });
      setTimeout(() => { cell.classList.remove('gain'); tag.remove(); }, 2200);
    });
    const r = artEl.getBoundingClientRect(), ar = app.getBoundingClientRect();
    burst(r.left - ar.left + r.width / 2, r.top - ar.top + r.height * 0.55, ch.ring, 16);
    setTimeout(() => burst(r.left - ar.left + r.width / 2, r.top - ar.top + r.height * 0.45, '#ffd84d', 10), 220);
  },
  open(id, opts = {}) {
    const ch = CHARS[charIdx(id)];
    const own = Meta.owned(id), lv = Meta.lv(id);
    const el = $('#charSheet');
    const card = el.querySelector('.sheet-card');
    card.style.setProperty('--ring', ch.ring);
    const stories = (CHAR_STORY[id] || []).map(([need], k) =>
      `<button class="story-btn" data-k="${k}" ${lv >= need ? '' : 'disabled'}><img src="assets/img/ui/book.png" alt=""><b>이야기 ${k + 1}</b><small>${lv >= need ? '읽기' : `Lv${need}에 열림`}</small></button>`).join('');
    card.innerHTML = `
      <div class="sheet-art${own && specialOf(id) ? ' special' : ''}"${own && specialOf(id) ? ` style="--scene:url(${SCENE(specialOf(id).special)})"` : ''}>${own ? Meta.figure(id, art(id), 'big') : `<span class="fig big"><img src="${art(id)}" class="shadow"></span>`}${own && specialOf(id) ? '<span class="sp-tag">✦ 스페셜</span>' : ''}<div class="sheet-say"></div></div>
      <div class="sheet-head">
        <div class="sh-name"><h2>${ch.name}</h2>${attrTag(ch.attr)}</div>
        ${own ? `<div class="sh-lv"><small>Lv</small><b>${lv}</b><small>${lv >= LV_MAX ? 'MAX' : '/' + LV_MAX}</small></div>` : ''}
      </div>
      ${own ? `<div class="sh-bar"><i style="width:${(lv / LV_MAX) * 100}%"></i></div>` : ''}
      <div class="sh-stats">
        <div data-st="pow"><img src="${ITEM(ch.heal ? 'heart' : 'sword')}" alt=""><span>${ch.heal ? '회복' : '공격'}</span><b>${powAt(id, Math.max(1, lv))}</b></div>
        <div data-st="need"><img src="${ITEM('sparkle')}" alt=""><span>스킬 게이지</span><b>${skillNeed(id, false)}</b><small>일상 ${skillNeed(id, true)}</small></div>
      </div>
      ${own ? Sheet.upHtml(id) : Sheet.recruitHtml(id)}
      <section class="sh-sec"><h3>스킬 <small>하나 골라 장착</small></h3>
        <div class="sk-list">${ch.skills.map((sk, k) => { const open = own && lv >= sk.lv, on = open && skillOf(id) === sk;
          return `<button data-sk="${k}" class="sk-row${on ? ' on' : ''}${open ? '' : ' locked'}">
            <span class="sk-ic"><img src="${skillIcon(id, sk)}" alt="">${on ? '<img class="sk-badge" src="assets/img/ui/check.png" alt="">' : open ? '' : '<img class="sk-badge" src="assets/img/ui/lock.png" alt="">'}</span>
            <span class="sk-text"><b>${sk.name}</b><small>${sk.desc}</small></span>
            <span class="sk-need">${open ? `<small>게이지</small><b>${sk.need}</b>` : `<small>열리는 레벨</small><b>Lv${sk.lv}</b>`}</span></button>`; }).join('')}</div>
      </section>
      ${own && SKINS[id] ? `<section class="sh-sec"><h3>옷 <small>입으면 공격 +5%</small></h3><div class="sheet-accs"><button data-s="" class="${Save.data.outfit[id] ? '' : 'on'}">기본</button>${(Save.data.skins[id] || []).map(s => `<button data-s="${s}" class="${Save.data.outfit[id] === s ? 'on' : ''}"><img src="${SKIN(id, s)}"></button>`).join('')}</div>
        ${(Save.data.skins[id] || []).length ? '' : '<small class="sheet-hint">가게의 옷 가게에서 살 수 있어요</small>'}</section>` : ''}
      ${own && stories ? `<section class="sh-sec"><h3>이야기</h3><div class="sheet-stories">${stories}</div></section>` : ''}
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
    const up = card.querySelector('[data-up]');
    if (up) up.onclick = () => {
      const c = upCost(id);
      if (!canUp(id)) {
        Sound.play('bad');
        up.animate([{ transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }], { duration: 180 });
        card.querySelectorAll('.mat.lack').forEach(e => e.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 260 }));
        return;
      }
      const before = { lv, pow: powAt(id, lv), need: skillNeed(id, false) };
      Save.data.shards[id] -= c.shards;
      if (c.treat) Save.data.treats[c.treat] -= c.tn;
      Save.data.own[id] = lv + 1;
      Meta.addCoins(-c.coins);
      Sheet.open(id, opts);
      Sheet.levelUp(id, before);
      opts.onChange && opts.onChange();
      friendsDot();
    };
    // 스킬 장착: 열린 스킬만 고를 수 있음
    card.querySelectorAll('[data-sk]').forEach(b => (b.onclick = () => {
      const sk = ch.skills[+b.dataset.sk];
      if (!own || lv < sk.lv) { Sound.play('bad'); b.animate([{ transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }], { duration: 180 }); return; }
      (Save.data.skill = Save.data.skill || {})[id] = +b.dataset.sk;
      Save.save();
      Sound.play('sparkle', 1.3, 0.6);
      Sheet.open(id, opts);
      opts.onChange && opts.onChange();
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
      // 처음으로 강화할 수 있게 되면 강화 버튼을 비춰 줌
      if (canUp(id) && !Tutor.seen('upBtn')) {
        Tutor.mark('upBtn');
        Tutor.mark('upCard');
        setTimeout(() => el.classList.contains('show') && Spot.show(card.querySelector('[data-up]'), '조각이랑 코인이 다 모였어! 강화하면 더 세지고 스킬도 더 빨리 차', { tap: true }), 450);
      }
    }
  },
};

// 스킬 아이콘: 하는 일을 그림으로. face = 그 친구 얼굴(구슬을 그 친구로 바꿈), sk_* = 스킬 그림(assets/img/ui), 나머지는 아이템 그림
const SKILL_ICON = {
  random8: 'sk_burst', c_sword: 'sword', c_weed: 'weed1',
  rows2: 'sk_line_h', h_guitar: 'sparkle', h_song: 'face',
  bighit: 'sk_slash', u_ura: 'bombball', u_yaha: 'sk_cross',
  convert6: 'face', m_fake: 'timer', m_praise: 'face',
  cross: 'sk_cross', r_one: 'sk_slash', r_rally: 'sk_rally',
  heal40: 'heart', k_mark: 'timer', k_read: 'heart',
  rainbow: 'dango3', q_snack: 'bombball', q_two: 'dango3',
  ramen: 'heart', s_deliver: 'gift', s_train: 'heart',
  meteor: 'sk_meteor', st_wish: 'dango3', st_shower: 'sk_meteor',
  cols2: 'sk_line_v', d_prank: 'sk_shuffle', d_again: 'sparkle',
  stall: 'timer', g_chorus: 'timer', g_cave: 'sk_shuffle',
  cheer: 'sk_shuffle', b_hug: 'heart', b_nyaha: 'sparkle',
};
const skillIcon = (id, sk) => { const k = SKILL_ICON[sk.id] || 'sparkle'; return k === 'face' ? FACE(id) : k.startsWith('sk_') ? `assets/img/ui/${k}.png` : ITEM(k); };
// 강화할 수 있을 때 친구 카드에 붙는 작은 위쪽 화살표
const UP_SVG = '<svg viewBox="0 0 24 24"><path d="M12 4l7 8h-4.2v7.5H9.2V12H5z" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
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
  $('#friendsGrid').innerHTML = CHARS.map(c => `<button class="fcard${Meta.owned(c.id) ? '' : ' locked'}${Meta.owned(c.id) && specialOf(c.id) ? ' special' : ''}" style="--ring:${c.ring}${Meta.owned(c.id) && specialOf(c.id) ? `;--scene:url(${SCENE(specialOf(c.id).special)})` : ''}" data-id="${c.id}">
    ${Meta.owned(c.id) ? Meta.figure(c.id, art(c.id)) : `<span class="fig"><img src="${art(c.id)}" class="shadow"></span>`}
    <span class="fname">${Meta.owned(c.id) ? c.name : '???'}</span>${Meta.owned(c.id) ? `<span class="flv${canUp(c.id) ? ' up' : ''}">Lv<b>${Meta.lv(c.id)}</b>${canUp(c.id) ? `${UP_SVG}강화` : ''}</span>` : treatBadge(c.id)}</button>`).join('');
  $('#friendsGrid').querySelectorAll('.fcard').forEach(b => (b.onclick = () => { Sound.play('click'); Sheet.open(b.dataset.id, { onChange: openFriends }); }));
  // 처음으로 강화할 수 있는 친구가 생기면 그 카드를 비춰 줌
  const upCard = $('#friendsGrid .flv.up')?.closest('.fcard');
  if (upCard && !Tutor.seen('upCard') && !Tutor.busyFlow && !$('#charSheet').classList.contains('show')) {
    Tutor.mark('upCard');
    setTimeout(() => $('#friends').classList.contains('active') && Spot.show(upCard, '강화할 수 있는 친구가 있어! 눌러 보자', { tap: true }), 400);
  }
  albumUI();
}
// 도감 보상: 친구를 모으거나 레벨 합계를 올리면 한 번씩 받음
const ALBUM = [
  { k: 'f4', n: 4, coins: 150 }, { k: 'f6', n: 6, coins: 250, treat: 'parfait' }, { k: 'f8', n: 8, coins: 350 },
  { k: 'f10', n: 10, coins: 500, treat: 'onigiri' }, { k: 'f12', n: 12, coins: 800 },
  { k: 'l20', lv: 20, coins: 300 }, { k: 'l40', lv: 40, coins: 600, treat: 'dango' }, { k: 'l80', lv: 80, coins: 1000 },
];
const albumNow = () => ({ n: CHARS.filter(c => Meta.owned(c.id)).length, lv: CHARS.reduce((a, c) => a + Meta.lv(c.id), 0) });
const albumDone = (a, now) => (a.n ? now.n >= a.n : now.lv >= a.lv);
const albumReady = () => { const now = albumNow(), got = Save.data.album || []; return ALBUM.filter(a => !got.includes(a.k) && albumDone(a, now)); };
function albumUI() {
  const now = albumNow(), got = Save.data.album || [];
  const next = kind => ALBUM.find(a => (kind === 'n' ? a.n : a.lv) && !got.includes(a.k));
  const row = (a, label, have, need) => {
    if (!a) return `<div class="alb-row done"><b>${label}</b><span>전부 받았어요!</span></div>`;
    const ready = albumDone(a, now), gift = `${a.coins}<img src="${ITEM('coin')}">${a.treat ? ` + ${TREATS[a.treat]}` : ''}`;
    return `<div class="alb-row${ready ? ' ready' : ''}"><b>${label} ${have}/${need}</b><span>${gift}</span>${ready ? `<button data-k="${a.k}">받기</button>` : ''}</div>`;
  };
  const fn = next('n'), ln = next('lv');
  let bar = $('#albumBar');
  if (!bar) { bar = document.createElement('div'); bar.id = 'albumBar'; $('#friendsGrid').before(bar); }
  bar.innerHTML = row(fn, '친구 모으기', now.n, fn?.n) + row(ln, '레벨 합계', now.lv, ln?.lv);
  bar.querySelectorAll('button').forEach(b => (b.onclick = () => {
    const a = ALBUM.find(x => x.k === b.dataset.k);
    (Save.data.album = Save.data.album || []).push(a.k);
    if (a.treat) Save.data.treats[a.treat] = (Save.data.treats[a.treat] || 0) + 1;
    Meta.addCoins(a.coins);
    Sound.play('star', 1.2);
    const r = b.getBoundingClientRect(), ar = app.getBoundingClientRect();
    burst(r.left - ar.left + r.width / 2, r.top - ar.top + r.height / 2, '#ffcf3f', 12);
    openFriends();
  }));
  friendsDot();
}
// 받을 도감 보상이 있으면 지도 '친구들' 버튼에 빨간 점
function friendsDot() {
  const btn = $('#btnFriends');
  if (!btn.querySelector('.dot')) btn.insertAdjacentHTML('beforeend', '<i class="dot"></i>');
  btn.classList.toggle('on', albumReady().length > 0 || CHARS.some(c => canUp(c.id)));
}

// ---------- 캡슐 뽑기: 친구 뽑기 / 옷 뽑기, 한 번(100) · 10번(900, 새 친구나 새 옷 하나 확정) ----------
const GACHA10_COST = 900;
// 기계 그림에서 손잡이(가운데 x·y, 반지름은 너비 비율)와 캡슐이 나오는 구멍 자리
const MACHINE = { knob: { x: 0.65, y: 0.665, r: 0.13 }, chute: { x: 0.66, y: 0.85 } };
const CHUTE = MACHINE.chute;
let gachaKind = 'friend', gachaBusy = false;
// 연출 건너뛰기: 뽑는 동안 '건너뛰기'를 누르면 손잡이·톡톡·10개 열기를 바로 넘기고 남은 움직임은 빨리 감음
let gachaSkip = null;
const onSkip = fn => { if (!gachaSkip) return; if (gachaSkip.on) fn(); else gachaSkip.fns.push(fn); };
// 옷 뽑기 후보: 내가 가진 친구의 옷 전부 (이미 있는 옷이 나오면 코인 40)
const outfitPool = () => Object.entries(SKINS).flatMap(([cid, ss]) => (Meta.owned(cid) ? Object.keys(ss).map(s => [cid, s]) : []));
const hasSkin = (cid, s) => (Save.data.skins[cid] || []).includes(s);
const friendPool = () => CHARS.filter(c => !RECRUIT[c.id] || Meta.owned(c.id)); // 간식·스테이지로 데려오는 친구는 처음엔 안 나옴
const isFresh = p => p.kind === 'new' || p.kind === 'skin';
const pickOne = a => a[Math.floor(Math.random() * a.length)];

// 뽑기 한 번: 결과를 정하고 저장까지. sure면 아직 없는 친구·옷 중에서 (10번 뽑기 확정)
function drawPrize(kind, sure = false, force = null) { // force: 이 친구로 정해서 뽑음 (위시)
  if (kind === 'outfit') {
    const all = outfitPool(), fresh = all.filter(([c, s]) => !hasSkin(c, s));
    const [cid, s] = pickOne(sure && fresh.length ? fresh : all);
    if (hasSkin(cid, s)) { Save.data.coins += 40; return { kind: 'skindup', id: cid, skin: s }; }
    (Save.data.skins[cid] = Save.data.skins[cid] || []).push(s);
    return { kind: 'skin', id: cid, skin: s };
  }
  const all = friendPool(), fresh = all.filter(c => !Meta.owned(c.id));
  const c = force ? CHARS[charIdx(force)] : pickOne(sure && fresh.length ? fresh : all), lv = Meta.lv(c.id);
  if (!lv) { Save.data.own[c.id] = 1; return { kind: 'new', id: c.id }; }
  if (lv < LV_MAX) { Save.data.shards[c.id] = (Save.data.shards[c.id] || 0) + SHARD_PER_DUP; return { kind: 'shard', id: c.id, n: SHARD_PER_DUP }; }
  Save.data.coins += 50;
  return { kind: 'max', id: c.id };
}
// 위시 친구: 캡슐에서 나오는 친구 하나를 골라 두면 10번 뽑기에서 꼭 한 번 나옴 (최고 레벨이 되면 풀림)
const wishOf = () => { const w = Save.data.wish; return w && friendPool().some(c => c.id === w) && Meta.lv(w) < LV_MAX ? w : null; };
function wishUI() {
  const el = $('#gachaWish'), w = wishOf(), c = w && CHARS[charIdx(w)];
  el.style.setProperty('--ring', c ? c.ring : 'var(--ink3)');
  el.innerHTML = `<span class="wish-face${c ? '' : ' empty'}"><img src="${c ? FACE(w) : ITEM('star')}" class="${c && !Meta.owned(w) ? 'shadow' : ''}" alt=""></span>
    <span class="wish-txt"><small>위시 친구</small><b>${c ? (Meta.owned(w) ? c.name : '???') : '아직 안 골랐어요'}</b><em>10번 뽑기에서 꼭 한 번 나와요</em></span>
    <span class="wish-btn">${c ? '바꾸기' : '고르기'}</span>`;
}
function pickWish() {
  if (gachaBusy) return;
  Sound.play('click');
  const el = $('#charSheet'), card = el.querySelector('.sheet-card');
  card.style.setProperty('--ring', '#ff8ab8');
  card.innerHTML = `<div class="mates-title">위시 친구 고르기 <small>10번 뽑기에서 꼭 한 번</small></div>
    <div class="mates-grid">${friendPool().map(c => { const lv = Meta.lv(c.id), max = lv >= LV_MAX;
      return `<button data-id="${c.id}" class="${Save.data.wish === c.id ? 'on' : ''}" style="--ring:${c.ring}" ${max ? 'disabled' : ''}><img src="${FACE(c.id)}" class="${lv ? '' : 'shadow'}" alt=""><span>${lv ? c.name : '???'}</span><i>${!lv ? 'NEW' : max ? 'MAX' : 'Lv' + lv}</i></button>`; }).join('')}</div>
    <small class="sheet-hint">간식이나 모험으로 데려오는 친구는 데려온 뒤에 고를 수 있어요. 최고 레벨 친구는 못 골라요</small>
    <div class="sheet-btns"><button class="big-btn ghost" data-close>닫기</button></div>`;
  card.querySelectorAll('.mates-grid button').forEach(b => (b.onclick = () => {
    Save.data.wish = b.dataset.id;
    Save.save();
    Sound.play('sparkle', 1.3, 0.6);
    el.classList.remove('show');
    syncGacha();
  }));
  card.querySelector('[data-close]').onclick = () => { Sound.play('click'); el.classList.remove('show'); };
  el.classList.add('show');
  fitText(el);
}
// 아직 안 가진 게 남아 있는지 (없으면 10번 뽑기 확정도 없음)
const canFresh = kind => (kind === 'outfit' ? outfitPool().some(([c, s]) => !hasSkin(c, s)) : friendPool().some(c => !Meta.owned(c.id)));

const CAP_COLOR = { new: '#ff8ab8', up: '#ffd84d', shard: '#ffd84d', max: '#d9d2e6', skin: '#8fd3ff', skindup: '#d9d2e6' };
const prizeImg = p => (p.skin ? SKIN(p.id, p.skin) : FACE(p.id));
const prizeTag = p => ({ new: 'NEW', up: `Lv${p.lv}`, shard: `조각+${p.n}`, max: '+50', skin: 'NEW', skindup: '+40' })[p.kind];

function openGacha() {
  show('gacha');
  Meta.coinUI();
  $('#gachaStage').innerHTML = '';
  $('#gachaStage').className = '';
  gachaBusy = false;
  syncGacha();
}
function syncGacha() {
  document.querySelectorAll('.gacha-tabs button').forEach(b => b.classList.toggle('on', b.dataset.g === gachaKind));
  // 옷 탭은 뽑기 기계 대신 옷 가게
  $('#gacha .gacha-body').classList.toggle('shop-mode', gachaKind === 'outfit');
  wishUI();
  if (gachaKind === 'outfit') return renderOutfitShop();
  const none = gachaKind === 'outfit' && !outfitPool().length;
  $('#gachaNote').textContent = none ? '옷이 있는 친구를 먼저 데려와요'
    : (gachaKind === 'outfit' ? '가진 친구의 옷이 나와요 · 이미 있으면 코인 40' : '새 친구를 만나거나 레벨 업!') +
      (canFresh(gachaKind) ? ` · 10번 뽑기는 새 ${gachaKind === 'outfit' ? '옷' : '친구'} 하나 확정` : '');
  const tk = Save.data.tickets || 0; // 뽑기 티켓이 있으면 1번 뽑기는 티켓으로
  $('#btnPull').innerHTML = tk ? `<img src="${ITEM('gift')}" alt="">티켓 ${tk} · 1번` : `<img src="${ITEM('coin')}" alt="">${GACHA_COST} · 1번`;
  $('#btnPull').disabled = gachaBusy || none || (!tk && Save.data.coins < GACHA_COST);
  $('#btnPull10').disabled = gachaBusy || none || Save.data.coins < GACHA10_COST;
}

// ---------- 옷 가게: 가진 친구의 옷을 코인으로 삼. 산 옷은 바로 입어 보기 ----------
function renderOutfitShop() {
  let shop = $('#outfitShop');
  if (!shop) { shop = document.createElement('div'); shop.id = 'outfitShop'; $('#gacha .gacha-tabs').after(shop); }
  const rows = Object.entries(SKINS).map(([cid, ss]) => {
    const own = Meta.owned(cid), ch = CHARS[charIdx(cid)];
    const items = Object.entries(ss).map(([s, k]) => {
      const have = hasSkin(cid, s), wear = Save.data.outfit[cid] === s;
      const btn = !own ? '<em class="lock">친구를 먼저 만나요</em>' : wear ? '<em class="wear">입는 중</em>' : have ? '<button data-wear>입기</button>'
        : `<button data-buy class="${Save.data.coins >= k.price ? '' : 'poor'}"><img src="${ITEM('coin')}">${k.price}</button>`;
      return `<div class="os-item${own ? '' : ' locked'}${have ? ' have' : ''}${k.special ? ' special' : ''}" data-c="${cid}" data-s="${s}"${k.special ? ` style="--scene:url(${SCENE(k.special)})"` : ''}>${k.special ? '<span class="sp-tag">✦ 스페셜</span>' : ''}<img class="os-img" src="${SKIN(cid, s)}" draggable="false"><b>${k.name}</b>${btn}</div>`;
    }).join('');
    return `<div class="os-row"><div class="os-who" style="--ring:${ch.ring}">${own ? ch.name : '???'}</div><div class="os-items">${items}</div></div>`;
  }).join('');
  shop.innerHTML = `<p class="os-note">원하는 옷을 골라 사요 · 입으면 공격 +5%</p>${rows}`;
  shop.querySelectorAll('.os-item').forEach(el => {
    const cid = el.dataset.c, s = el.dataset.s, k = SKINS[cid][s];
    el.querySelector('[data-buy]')?.addEventListener('click', () => {
      if (Save.data.coins < k.price) { Sound.play('bad'); el.animate([{ transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }], { duration: 180 }); return; }
      Meta.addCoins(-k.price);
      (Save.data.skins[cid] = Save.data.skins[cid] || []).push(s);
      Save.data.outfit[cid] = s; // 사자마자 입혀 줌
      Save.save();
      Sound.play('star', 1.2); Sound.voice(cid, 'pick');
      const r = el.getBoundingClientRect(), ar = app.getBoundingClientRect();
      burst(r.left - ar.left + r.width / 2, r.top - ar.top + r.height / 3, CHARS[charIdx(cid)].ring, 14);
      renderOutfitShop();
    });
    el.querySelector('[data-wear]')?.addEventListener('click', () => { Save.data.outfit[cid] = s; Save.save(); Sound.play('sparkle', 1.3, 0.6); renderOutfitShop(); });
  });
}

// 캡슐 하나 (새 친구는 무지개 캡슐)
function capsuleEl(p) {
  const el = document.createElement('div');
  el.className = 'cap' + (p.kind === 'new' ? ' rainbow' : '');
  el.style.setProperty('--cap', CAP_COLOR[p.kind]);
  el.innerHTML = '<i class="top"></i><i class="bottom"></i>';
  return el;
}
// 기계 구멍 자리 (뽑기 무대 기준 좌표)
function chutePos() {
  const m = $('#gachaMachine img').getBoundingClientRect(), st = $('#gachaStage').getBoundingClientRect();
  return { x: m.left - st.left + m.width * CHUTE.x, y: m.top - st.top + m.height * CHUTE.y };
}
const placeAt = (el, x, y) => Object.assign(el.style, { left: x + 'px', top: y + 'px' });

// 손잡이 돌리기: 손가락으로 빙글 돌리거나 톡톡 누르면(한 번에 90도) 한 바퀴에 캡슐이 나옴
function turnKnob() {
  const knob = $('#gachaKnob'), m = $('#gachaMachine');
  const hint = document.createElement('div');
  hint.className = 'knob-hint';
  hint.textContent = '손잡이를 빙글 돌려요!';
  m.appendChild(hint);
  knob.classList.add('ready');
  return new Promise(done => {
    let turned = 0, step = 0, last = null;
    const set = () => {
      knob.style.setProperty('--turn', turned + 'deg');
      // 90도마다 딸깍 + 기계가 톡
      while (turned >= (step + 1) * 90) {
        step++;
        Sound.play('click', 0.7 + step * 0.08, 0.9);
        Haptic.tap(15);
        m.animate([{ transform: 'none' }, { transform: `scale(1.02, .98) rotate(${step % 2 ? -2 : 2}deg)` }, { transform: 'none' }], { duration: 160 });
      }
      if (turned >= 360) {
        knob.classList.remove('ready');
        knob.onpointerdown = knob.onpointermove = knob.onpointerup = knob.onpointercancel = null;
        hint.remove();
        done();
      }
    };
    onSkip(() => { if (turned < 360) { turned = 360; set(); } });
    const ang = e => { const r = knob.getBoundingClientRect(); return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI; };
    let moved = 0;
    knob.onpointerdown = e => { e.preventDefault(); knob.setPointerCapture(e.pointerId); last = ang(e); moved = 0; };
    knob.onpointermove = e => {
      if (last == null) return;
      const a = ang(e);
      let d = a - last;
      if (d > 180) d -= 360;
      if (d < -180) d += 360;
      last = a;
      moved += Math.abs(d);
      turned += Math.abs(d); // 어느 쪽으로 돌려도 앞으로
      set();
    };
    knob.onpointerup = knob.onpointercancel = () => {
      if (last != null && moved < 8) { turned = (step + 1) * 90; set(); } // 톡 누르면 90도
      last = null;
    };
  });
}
// 손잡이를 다 돌리면 기계가 찌그러졌다 튐 (10번이면 더 크게)
async function crankMachine(big) {
  const m = $('#gachaMachine');
  Sound.play('land', 0.8, 0.8);
  Haptic.tap(big ? 40 : 20);
  const a = big ? 9 : 5;
  await m.animate([
    { transform: 'none' }, { transform: `scale(1.06, .9) rotate(-${a}deg)` }, { transform: `scale(.95, 1.06) rotate(${a}deg)` },
    { transform: `scale(1.04, .94) rotate(-${a / 2}deg)` }, { transform: 'none' },
  ], { duration: big ? 700 : 520, easing: 'ease-in-out' }).finished;
}
// 캡슐 열기: 부르르 모으다가(이음새로 결과 색 빛이 샘) → 펑! 반쪽이 날아가고 충격파·빛기둥 → 결과가 톡 튀어나옴
async function popCapsule(cap, p, small = false) {
  const col = p.kind === 'new' ? '#ffffff' : CAP_COLOR[p.kind], fresh = isFresh(p);
  cap.style.setProperty('--glow', col);
  cap.classList.add('charge');
  Sound.play('sparkle', 0.8, small ? 0.3 : 0.6);
  await cap.animate([
    { transform: 'translate(-50%,-50%) scale(1)' },
    { transform: 'translate(-50%,-50%) scale(1.12) rotate(-6deg)', offset: 0.3 },
    { transform: 'translate(-50%,-50%) scale(1.18) rotate(6deg)', offset: 0.6 },
    { transform: 'translate(-50%,-50%) scale(1.28, 1.22) rotate(-3deg)' },
  ], { duration: small ? 200 : 450, easing: 'ease-in', fill: 'forwards' }).finished;
  await sleep(small ? 30 : 80); // 멈칫
  const [top, bottom] = cap.children, { x, y } = centerOf(cap), k = small ? 0.6 : 1;
  cap.classList.add('open');
  top.animate([{ transform: 'none' }, { transform: `translate(${-40 * k}px, ${-90 * k}px) rotate(-260deg)`, opacity: 1, offset: 0.6 }, { transform: `translate(${-70 * k}px, ${-40 * k}px) rotate(-400deg)`, opacity: 0 }],
    { duration: 600, easing: 'cubic-bezier(.2,.8,.5,1)', fill: 'forwards' });
  bottom.animate([{ transform: 'none' }, { transform: `translate(${50 * k}px, ${30 * k}px) rotate(140deg)`, opacity: 1, offset: 0.6 }, { transform: `translate(${80 * k}px, ${90 * k}px) rotate(220deg)`, opacity: 0 }],
    { duration: 600, easing: 'cubic-bezier(.2,.8,.5,1)', fill: 'forwards' });
  ringFx(x, y, small ? 90 : 170, '#ffffff', 420);
  setTimeout(() => ringFx(x, y, small ? 120 : 240, col === '#ffffff' ? '#ffd84d' : col, 520), 80);
  burst(x, y, CAP_COLOR[p.kind], fresh ? 18 : 8);
  Haptic.tap(fresh ? 40 : 20);
  if (!small) shake(fresh ? 8 : 4, 220);
  if (fresh) {
    // 위로 솟는 빛기둥 + 별 반짝이 (새 친구면 꽃가루까지)
    const beam = document.createElement('i');
    beam.className = 'beam' + (p.kind === 'new' ? ' rainbow' : '');
    beam.style.setProperty('--glow', col);
    placeAt(beam, cap.offsetLeft, cap.offsetTop);
    cap.parentNode.appendChild(beam);
    beam.animate([{ transform: 'translate(-50%,-100%) scaleX(0)', opacity: 1 }, { transform: 'translate(-50%,-100%) scaleX(1)', opacity: 1, offset: 0.3 }, { transform: 'translate(-50%,-100%) scaleX(.2)', opacity: 0 }],
      { duration: 900, easing: 'ease-out', fill: 'forwards' }).finished.then(() => beam.remove());
    for (let i = 0; i < (small ? 3 : 6); i++) setTimeout(() => burst(x + (Math.random() - 0.5) * 120 * k, y - Math.random() * 140 * k, '#fff6a8', 4), 80 + i * 60);
    if (!small) flash('#ffffff', 0.45);
    if (p.kind === 'new') confetti(small ? 6 : 18);
    Sound.play('star', 1.1, 0.9);
  } else Sound.play('pop', 1.2, 0.8);
}
// 결과 그림이 캡슐 속에서 톡 튀어나와 크게 통 커졌다 자리 잡고 둥실
function riseUp(pe, small) {
  const lift = small ? 0 : -20;
  return pe.animate([
    { transform: 'translate(-50%,-50%) scale(.2)', opacity: 0 },
    { transform: `translate(-50%,-50%) translateY(${lift - (small ? 14 : 40)}px) scale(1.35)`, opacity: 1, offset: 0.55 },
    { transform: `translate(-50%,-50%) translateY(${lift}px) scale(.94)`, offset: 0.8 },
    { transform: `translate(-50%,-50%) translateY(${lift}px) scale(1)` },
  ], { duration: small ? 380 : 520, easing: 'ease-out', fill: 'forwards' }).finished.then(() => pe.classList.add('float'));
}
// 결과 그림 (캡슐 자리에 톡 떠오름)
function prizeEl(p) {
  const el = document.createElement('div');
  el.className = 'prize' + (isFresh(p) ? ' fresh' : '');
  el.innerHTML = `${isFresh(p) ? '<i class="rays"></i>' : ''}<img src="${prizeImg(p)}"><b>${prizeTag(p)}</b>`;
  return el;
}

// 한 번 뽑기: 캡슐이 굴러 나오고, 세 번 톡톡 눌러야 열림
async function openOne(p) {
  const st = $('#gachaStage'), from = chutePos(), w = st.clientWidth;
  const cap = capsuleEl(p);
  placeAt(cap, w / 2, st.clientHeight * 0.42);
  st.appendChild(cap);
  const dx = from.x - w / 2, dy = from.y - st.clientHeight * 0.42;
  Sound.play('land', 1.2, 0.8);
  await cap.animate([
    { transform: `translate(-50%,-50%) translate(${dx}px, ${dy - 14}px) scale(.3)`, opacity: 0 },
    { transform: `translate(-50%,-50%) translate(${dx}px, ${dy + 10}px) scale(.45)`, opacity: 1, offset: 0.22 }, // 구멍에서 툭 떨어지고
    { transform: `translate(-50%,-50%) translate(${dx * 0.4}px, ${dy * 0.3 - 90}px) scale(.9) rotate(-200deg)`, offset: 0.55 }, // 통 튀어 가운데로
    { transform: 'translate(-50%,-50%) scale(1.15, .85) rotate(-360deg)', offset: 0.85 },
    { transform: 'translate(-50%,-50%) scale(1)' },
  ], { duration: 900, easing: 'ease-out', fill: 'forwards' }).finished;
  const hint = document.createElement('div');
  hint.className = 'cap-hint';
  hint.textContent = '톡! 톡! 눌러서 열기';
  st.appendChild(hint);
  await new Promise(done => {
    let n = 0;
    cap.onclick = () => {
      n++;
      Haptic.tap(15 + n * 10);
      if (n < 3) {
        Sound.play('pop', 1 + n * 0.25, 0.7);
        const a = 8 + n * 8;
        cap.animate([{ transform: 'translate(-50%,-50%) rotate(0)' }, { transform: `translate(-50%,-50%) rotate(-${a}deg) scale(1.1)` }, { transform: `translate(-50%,-50%) rotate(${a}deg)` }, { transform: 'translate(-50%,-50%)' }], { duration: 260 });
        return;
      }
      cap.onclick = null;
      hint.remove();
      done();
    };
    onSkip(() => { if (!cap.onclick) return; cap.onclick = null; hint.remove(); done(); });
  });
  await popCapsule(cap, p);
  const pe = prizeEl(p);
  placeAt(pe, w / 2, st.clientHeight * 0.42);
  st.appendChild(pe);
  riseUp(pe, false);
  await sleep(900);
  const ch = CHARS[charIdx(p.id)];
  const info = {
    new: () => ({ title: '새 친구!', char: p.id, text: `${ch.name}: "${lineOf(ch.id)}"`, rows: [['친구', ch.name], ['레벨', 'Lv1']] }),
    up: () => ({ title: '레벨 업!', char: p.id, text: `${ch.name}이(가) 더 강해졌어요!`, rows: [['친구', ch.name], ['레벨', `Lv${p.lv}`], ['공격·회복', `+${Math.round((Meta.mult(p.id) - 1) * 100)}%`]] }),
    shard: () => ({ title: '조각 모음!', char: p.id, text: `${ch.name} 조각 +${p.n}! 친구 상세에서 코인이랑 같이 써서 강화할 수 있어요.`, rows: [['조각', `${Save.data.shards[p.id] || 0}${upCost(p.id) ? '/' + upCost(p.id).shards : ''}`]] }),
    max: () => ({ title: '이미 최고 레벨', char: p.id, text: '대신 코인 50개를 돌려받았어요.', rows: [['코인', '+50']] }),
    skin: () => ({ title: '새 옷!', img: SKIN(p.id, p.skin), text: `${ch.name}의 ${SKINS[p.id][p.skin].name}! 친구 상세에서 갈아입힐 수 있어요.`, rows: [] }),
    skindup: () => ({ title: '이미 있는 옷', img: SKIN(p.id, p.skin), text: '대신 코인 40개를 돌려받았어요.', rows: [['코인', '+40']] }),
  }[p.kind]();
  if (p.kind === 'new' || p.kind === 'up' || p.kind === 'shard') Sound.voice(p.id, 'pick');
  await new Promise(done => modal({ ...info, btn1: '좋아!', on1: done }));
  st.innerHTML = '';
}

// 10번 뽑기: 캡슐 10개가 쏟아져 줄을 서고, 하나씩 눌러 열거나 '모두 열기'
async function openTen(prizes) {
  const st = $('#gachaStage'), from = chutePos(), w = st.clientWidth, h = st.clientHeight;
  st.className = 'ten';
  const cell = Math.min(70, (w - 24) / 5);
  const pos = prizes.map((_, i) => ({ x: w / 2 + (i % 5 - 2) * cell, y: h * 0.3 + Math.floor(i / 5) * cell * 1.35 }));
  const caps = prizes.map((p, i) => {
    const cap = capsuleEl(p);
    cap.classList.add('small');
    placeAt(cap, pos[i].x, pos[i].y);
    st.appendChild(cap);
    const dx = from.x - pos[i].x, dy = from.y - pos[i].y;
    cap.animate([
      { transform: `translate(-50%,-50%) translate(${dx}px, ${dy}px) scale(.3)`, opacity: 0 },
      { transform: `translate(-50%,-50%) translate(${dx * 0.5}px, ${dy * 0.5 - 70}px) scale(.8) rotate(-180deg)`, opacity: 1, offset: 0.55 },
      { transform: 'translate(-50%,-50%) scale(1.1, .9) rotate(-360deg)', offset: 0.85 },
      { transform: 'translate(-50%,-50%)' },
    ], { duration: 560, delay: i * 90, easing: 'ease-out', fill: 'backwards' });
    setTimeout(() => Sound.play('land', 1 + i * 0.04, 0.5), i * 90 + 300);
    return cap;
  });
  await sleep(prizes.length * 90 + 560);
  const btn = document.createElement('button');
  btn.className = 'big-btn ten-btn';
  btn.textContent = '모두 열기';
  st.appendChild(btn);
  let left = prizes.length;
  await new Promise(done => {
    const open = (i, delay = 0) => {
      const cap = caps[i];
      if (cap.opened) return;
      cap.opened = true;
      setTimeout(async () => {
        await popCapsule(cap, prizes[i], true);
        const pe = prizeEl(prizes[i]);
        pe.classList.add('small');
        placeAt(pe, pos[i].x, pos[i].y);
        st.appendChild(pe);
        riseUp(pe, true);
        if (--left === 0) { btn.textContent = '확인'; btn.onclick = () => { Sound.play('click'); done(); }; }
      }, delay);
    };
    caps.forEach((cap, i) => (cap.onclick = () => open(i)));
    btn.onclick = () => { Sound.play('click'); let k = 0; caps.forEach((c, i) => !c.opened && open(i, k++ * 140)); };
    onSkip(() => caps.forEach((c, i) => open(i)));
  });
  st.innerHTML = '';
  st.className = '';
}

async function pullGacha(n = 1) {
  const ticket = n === 1 && (Save.data.tickets || 0) > 0;
  const cost = ticket ? 0 : n === 10 ? GACHA10_COST : GACHA_COST;
  if (gachaBusy || wiping || Save.data.coins < cost || gachaKind === 'outfit') return; // 옷은 뽑기 대신 가게에서 삼
  gachaBusy = true;
  if (ticket) Save.data.tickets--;
  else Meta.addCoins(-cost);
  Daily.add('gacha', n);
  syncGacha();
  const prizes = [], wish = n === 10 && gachaKind === 'friend' && wishOf();
  if (wish) prizes.push(drawPrize(gachaKind, false, wish)); // 10번 뽑기: 위시 친구 한 번은 꼭 (자리는 아래에서 섞임)
  while (prizes.length < n - 1) prizes.push(drawPrize(gachaKind));
  // 10번 뽑기: 앞의 9번에 새 친구(새 옷)가 없으면 마지막은 확정, 자리는 아무 데나
  const last = drawPrize(gachaKind, n === 10 && !prizes.some(isFresh));
  prizes.push(last);
  for (let i = prizes.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [prizes[i], prizes[j]] = [prizes[j], prizes[i]]; } // 위시·확정 칸이 늘 같은 자리에 오지 않게
  Save.save();
  gachaSkip = { on: false, fns: [] };
  const skipBtn = document.createElement('button');
  skipBtn.className = 'gacha-skip';
  skipBtn.textContent = '건너뛰기 ▶▶';
  skipBtn.onclick = () => { Sound.play('click'); skipBtn.remove(); gachaSkip.on = true; FastFwd.on(12); gachaSkip.fns.splice(0).forEach(f => f()); };
  $('.gacha-body').appendChild(skipBtn);
  try {
    await turnKnob();
    await crankMachine(n === 10);
    if (n === 10) await openTen(prizes); else await openOne(prizes[0]);
  } finally { // 연출 중 에러가 나도 뽑기가 잠기지 않게
    skipBtn.remove();
    gachaSkip = null;
    FastFwd.off();
    Meta.coinUI();
    gachaBusy = false;
    syncGacha();
  }
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
  if (!d.furnV3) {
    d.furnInv = d.furnInv || {};
    Object.values(d.homes).forEach(h => {
      h.items = (h.furn || []).map(k => FURN.find(f => f.id === k)).filter(Boolean).map(f => { d.furnInv[f.id] = (d.furnInv[f.id] || 0) + 1; return { k: f.id, x: f.x, y: f.y }; });
      delete h.furn;
    });
    d.furnV3 = 1;
  }
  return d.homes;
};
const home = id => (homes()[id] = homes()[id] || { items: [], mates: [] });
const furnOf = k => FURN.find(f => f.id === k);
const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
// 보관함에 남은 개수 = 산 개수 - 모든 집에 놓인 개수
const furnLeft = k => (Save.data.furnInv?.[k] || 0) - Object.values(homes()).reduce((a, h) => a + (h.items || []).filter(it => it.k === k).length, 0);
// 놓을 수 있는 높이: 벽 가구는 벽에, 러그는 바닥 맨 아래까지, 나머지는 바닥 위
const furnY = (f, y) => (f.wall ? clampN(y, 14, 58) : f.flat ? clampN(y, 66, 100) : clampN(y, 60, 99));
// 아늑함: 가구 종류마다 값의 1/10, 같은 가구를 더 놓으면 2씩, 벽지·바닥을 바꾸면 15씩. 아늑할수록 집주인이 하루 한 번 주는 선물 코인이 늘어남
const cozyOf = h => {
  const seen = new Set();
  let n = (h.wall ? 15 : 0) + (h.floor ? 15 : 0);
  (h.items || []).forEach(it => { const f = furnOf(it.k); if (!f) return; n += seen.has(it.k) ? 2 : Math.round(f.price / 10); seen.add(it.k); });
  return n;
};
const houseGift = cozy => Math.min(60, 5 + Math.floor(cozy / 4));
let houseEdit = false, shopTab = 'furn';
const DECO_TIP = '꾸미기를 누르면 가구를 끌어서 옮기고 뒤집을 수 있어! 아늑할수록 매일 선물이 커져';

function openHouse(id = homeOf) {
  if (!$('#house').classList.contains('active')) houseEdit = false; // 다른 화면에서 들어오면 구경 모드로
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
  room.querySelectorAll('.furn, .resident, .furn-tools, .house-gift').forEach(e => e.remove());
  room.querySelector('.wall').style.background = h.wall ? `url(${DECO_IMG(h.wall)}) center / cover` : '';
  room.querySelector('.floor').style.background = h.floor ? `url(${DECO_IMG(h.floor)}) center / cover` : '';
  h.items.forEach(it => {
    const f = furnOf(it.k);
    if (!f) return;
    const im = new Image();
    im.src = ITEM(f.id);
    im.className = 'furn' + (f.wall ? ' on-wall' : '');
    im.draggable = false;
    const put = () => Object.assign(im.style, { left: it.x + '%', top: it.y + '%', width: f.w + '%', zIndex: f.wall ? 2 : f.flat ? 3 : Math.round(it.y), transform: `translate(-50%, -100%)${it.f ? ' scaleX(-1)' : ''}` });
    put();
    // 꾸미기 모드: 끌면 옮기고, 톡 하면 뒤집기·넣기 버튼
    im.onpointerdown = e => {
      if (!houseEdit) return;
      e.preventDefault();
      im.setPointerCapture(e.pointerId);
      const rr = room.getBoundingClientRect(), sx = e.clientX, sy = e.clientY, ox = it.x, oy = it.y;
      let moved = false;
      im.classList.add('lift');
      im.onpointermove = ev => {
        if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return;
        if (!moved) { moved = true; furnTools(); }
        it.x = Math.round(clampN(ox + ((ev.clientX - sx) / rr.width) * 100, 4, 96) * 10) / 10;
        it.y = Math.round(furnY(f, oy + ((ev.clientY - sy) / rr.height) * 100) * 10) / 10;
        put();
      };
      im.onpointerup = im.onpointercancel = () => {
        im.onpointermove = im.onpointerup = im.onpointercancel = null;
        im.classList.remove('lift');
        if (moved) { Sound.play('land', 1.3, 0.5); Save.save(); } else Sound.play('pop', 1.3, 0.4);
        furnTools(im, it, put);
      };
    };
    room.appendChild(im);
  });
  // 고른 가구 위에 뜨는 작은 버튼: 좌우 뒤집기, 보관함에 넣기
  function furnTools(im, it, put) {
    room.querySelector('.furn-tools')?.remove();
    if (!im) return;
    const t = document.createElement('div');
    t.className = 'furn-tools';
    t.innerHTML = '<button data-a="flip">뒤집기</button><button data-a="away">넣기</button>';
    const rr = room.getBoundingClientRect(), r = im.getBoundingClientRect();
    Object.assign(t.style, { left: clampN(r.left + r.width / 2 - rr.left, 60, rr.width - 60) + 'px', top: Math.max(6, r.top - rr.top - 44) + 'px' });
    room.appendChild(t);
    t.querySelector('[data-a="flip"]').onclick = () => { it.f = !it.f; put(); Save.save(); Sound.play('swap', 1.3, 0.5); };
    t.querySelector('[data-a="away"]').onclick = () => { h.items.splice(h.items.indexOf(it), 1); Save.save(); Sound.play('pop', 1.1, 0.6); openHouse(id); };
  }
  room.onpointerdown = e => { if (houseEdit && !e.target.closest('.furn, .furn-tools')) furnTools(); }; // 빈 곳을 누르면 버튼 닫기
  room.classList.toggle('edit', houseEdit);
  $('#btnDeco').textContent = houseEdit ? '다 했어' : '꾸미기';
  $('#btnDeco').onclick = () => { houseEdit = !houseEdit; Sound.play('click'); openHouse(id); };
  const cozy = cozyOf(h);
  $('#cozy').innerHTML = `아늑함 <b>${cozy}</b>`;
  $('#cozy').onclick = () => { Sound.play('click'); banner(`아늑할수록 선물이 커져요 (하루 ${houseGift(cozy)}코인)`, 900); };
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
      if (houseEdit) return; // 꾸미기 중에는 친구는 그대로
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
          Aff.pat(c.id, el); // 하루 한 번 쓰다듬으면 호감도
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
    if (k === 0 && cozy >= 10 && h.gift !== today()) {
      const g = document.createElement('button');
      g.className = 'house-gift';
      g.innerHTML = `<img src="${ITEM('gift')}" alt="">`;
      g.onpointerdown = ev => ev.stopPropagation(); // 집주인을 끌지 않게
      g.onclick = () => {
        const n = houseGift(cozy), r = g.getBoundingClientRect(), a = app.getBoundingClientRect();
        h.gift = today();
        Meta.addCoins(n);
        Sound.play('star', 1.2, 0.8);
        burst(r.left - a.left + r.width / 2, r.top - a.top + r.height / 2, '#ffd84d', 14);
        floatNum(r.left - a.left + r.width / 2, r.top - a.top, '+' + n, '#e0a020');
        say(GIFT_SAY[c.id] || '집이 아늑해서 좋아~ 이거 선물!');
        g.remove();
      };
      el.appendChild(g);
    }
  });
  Aff.bar(id);
  // 꾸미기가 생긴 뒤 처음 들어오면 한 번 알려 줌 (집이 처음 열릴 때는 UNLOCK_INTRO가 같이 알려 줌)
  if (!Tutor.seen('houseDeco') && !Tutor.busyFlow) { Tutor.mark('houseDeco'); setTimeout(() => $('#house').classList.contains('active') && Spot.show($('#btnDeco'), DECO_TIP), 500); }
  // 아래쪽 가게: 가구 / 벽지 / 바닥
  document.querySelectorAll('.shop-tabs button').forEach(b => {
    b.classList.toggle('on', b.dataset.t === shopTab);
    b.onclick = () => { shopTab = b.dataset.t; Sound.play('pop', 1.2, 0.5); openHouse(id); };
  });
  const coinTag = n => `<img src="${ITEM('coin')}">${n}`;
  const poor = (b, price) => {
    if (Save.data.coins >= price) return false;
    Sound.play('bad', 1.2, 0.6);
    b.animate([{ transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'none' }], { duration: 200 });
    return true;
  };
  if (shopTab === 'furn') {
    $('#shop').innerHTML = FURN.map(f => {
      const left = furnLeft(f.id);
      return `<button class="shop-item" data-id="${f.id}"><img src="${ITEM(f.id)}"><span>${f.name}</span><b>${left > 0 ? `<small>보관 ${left}</small>` : coinTag(f.price)}</b></button>`;
    }).join('');
    // 보관함에 있으면 바로 놓고, 없으면 사서 놓음. 놓으면 꾸미기 모드로 바뀌어서 바로 옮길 수 있음
    $('#shop').querySelectorAll('.shop-item').forEach(b => (b.onclick = () => {
      const f = furnOf(b.dataset.id);
      if (furnLeft(f.id) <= 0) {
        if (poor(b, f.price)) return;
        Meta.addCoins(-f.price);
        Save.data.furnInv[f.id] = (Save.data.furnInv[f.id] || 0) + 1;
        Sound.play('star', 1.2, 0.8);
      } else Sound.play('pop', 1.2, 0.6);
      const same = h.items.filter(it => it.k === f.id).length; // 같은 가구는 조금씩 비켜서 놓음
      h.items.push({ k: f.id, x: clampN(f.x + same * 8, 4, 96), y: f.y });
      Save.save();
      houseEdit = true;
      const scroll = $('#shop').scrollLeft;
      openHouse(id);
      $('#shop').scrollLeft = scroll;
      const r = room.getBoundingClientRect(), a = app.getBoundingClientRect(), it = h.items[h.items.length - 1];
      burst(r.left - a.left + (r.width * it.x) / 100, r.top - a.top + (r.height * it.y) / 100, '#ffd84d', 14);
    }));
  } else {
    const list = shopTab === 'wall' ? WALLS : FLOORS, invKey = shopTab === 'wall' ? 'wallInv' : 'floorInv', inv = (Save.data[invKey] = Save.data[invKey] || []);
    $('#shop').innerHTML = list.map(d => {
      const has = !d.id || inv.includes(d.id), on = (h[shopTab] || '') === d.id;
      return `<button class="shop-item deco${on ? ' on' : ''}" data-id="${d.id}"><span class="swatch ${shopTab}"${d.id ? ` style="background-image:url(${DECO_IMG(d.id)})"` : ''}></span><span>${d.name}</span><b>${on ? '<small>쓰는 중</small>' : has ? '<small>바꾸기</small>' : coinTag(d.price)}</b></button>`;
    }).join('');
    $('#shop').querySelectorAll('.shop-item').forEach(b => (b.onclick = () => {
      const d = list.find(x => x.id === b.dataset.id);
      if (d.id && !inv.includes(d.id)) {
        if (poor(b, d.price)) return;
        Meta.addCoins(-d.price);
        inv.push(d.id);
        Sound.play('star', 1.2, 0.8);
      } else Sound.play('pop', 1.2, 0.6);
      if (d.id) h[shopTab] = d.id; else delete h[shopTab];
      Save.save();
      const scroll = $('#shop').scrollLeft;
      openHouse(id);
      $('#shop').scrollLeft = scroll;
    }));
  }
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
$('#btnPull').onclick = () => pullGacha(1);
$('#btnPull10').onclick = () => pullGacha(10);
$('#gachaWish').onclick = pickWish;
document.querySelectorAll('.gacha-tabs button').forEach(b => (b.onclick = () => { if (gachaBusy) return; Sound.play('pop', 1.2, 0.5); gachaKind = b.dataset.g; syncGacha(); }));
document.querySelectorAll('.btn-tomap').forEach(b => (b.onclick = () => { Sound.play('click'); go(openMap); }));
Meta.init();
