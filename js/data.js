// 팬게임 데이터: 캐릭터, 괴물, 스테이지, 스토리
// attr: 속성, skill: 게이지(need)가 차면 쓰는 스킬
const CHARS = [
  { id: 'chiikawa',  name: '치이카와', ring: '#f27aa5', attr: 'cry',   dmg: 10, line: '…!',
    skill: { id: 'random8',  name: '울면서 휘두르기', desc: '무작위 구슬 8개 터뜨림', need: 14, say: '으앗…! 에잇!' } },
  { id: 'hachiware', name: '하치와레', ring: '#4f93dc', attr: 'brave', dmg: 10, line: '어떻게든 되겠지~!',
    skill: { id: 'rows2',    name: '어떻게든 되라~!', desc: '가로줄 2줄 지움', need: 16, say: '어떻게든 되라앗~!!' } },
  { id: 'usagi',     name: '우사기',   ring: '#f0b90b', attr: 'odd',   dmg: 9, crit: 0.3, line: '우라!',
    skill: { id: 'bighit',   name: '불꽃 봉', desc: '양 끝에서 불꽃이 펑! 괴물에게 큰 한 방', need: 16, say: '우라아아!! (펑펑!)' } },
  { id: 'momonga',   name: '모몽가',   ring: '#9b7be8', attr: 'odd',   dmg: 11, line: '빨리 칭찬해!',
    skill: { id: 'convert6', name: '전부 내 거!', desc: '구슬 6개를 모몽가로 바꿈', need: 12, say: '여기도 저기도 다 내 거야! 불만 있어?' } },
  { id: 'rakko',     name: '랏코',     ring: '#8a8a96', attr: 'brave', dmg: 17, crit: 0.2, line: '…간다.',
    skill: { id: 'cross',    name: '기세를 타라!', desc: '대검으로 십자 3줄을 베고 괴물에게 큰 한 방, 공격 2턴 늦춤', need: 16, say: '…간다. 기세를 타라!' } },
  { id: 'kani',      name: '카니',     ring: '#ff5a4a', attr: 'cry',   heal: 2, line: '(꾸벅)',
    skill: { id: 'heal40',   name: '조용한 책 시간', desc: '좋아하는 책을 읽어 주며 체력 25% 회복', need: 14, say: '(좋아하는 책을 펼쳐 조용히 보여 준다)' } },
  { id: 'kurimanju', name: '쿠리만쥬', ring: '#79bf3f', attr: 'odd',   dmg: 12, line: '하아~~ 으어어…',
    skill: { id: 'rainbow',  name: '한잔 하아~', desc: '판에 경단 하나', need: 15, say: '(꿀꺽꿀꺽) ……하아~~ 으어어…' } },
  { id: 'shisa',     name: '시사',     ring: '#ff8a33', attr: 'odd',   dmg: 11, line: '어서 와사~!',
    skill: { id: 'ramen',    name: '치바리요~!', desc: '오키나와 간식 나눠 주기: 체력 20% 회복, 모두 게이지 +3', need: 15, say: '치바리요~! 이거 먹고 힘내사!' } },
  { id: 'shooting',  name: '별똥별',   ring: '#e5c100', attr: 'light', dmg: 11, line: '반짝!',
    skill: { id: 'meteor',   name: '소원 별똥별', desc: '무작위 3곳에 폭탄이 떨어짐', need: 17, say: '구해 준 보답이야! 소원을 빌어!' } },
  { id: 'darkstar',  name: '까만별',   ring: '#4b4b66', attr: 'dark',   dmg: 12, line: '칫, 재미없어!',
    skill: { id: 'cols2',    name: '비틀린 소원', desc: '세로줄 2줄 지움', need: 16, say: '소원? 들어줄게~ 내 맘대로! 히히.' } },
  { id: 'goblin',    name: '고블린',   ring: '#2fae7a', attr: 'brave', dmg: 11, line: '옴 빰 빰~',
    skill: { id: 'stall',    name: '고블린 춤', desc: '다 같이 춤을 춰서 괴물 공격 3턴 늦춤, 작은 피해', need: 14, say: '옴 빰 빰~ 예 예 예~! 제야! 야요!' } },
  { id: 'beetle',    name: '풍뎅이',   ring: '#a5683a', attr: 'cry',   dmg: 10, line: '냐하~',
    skill: { id: 'cheer',    name: '꼬옥 안기', desc: '판 섞고 다른 멤버 게이지 +4', need: 13, say: '냐하~! (꼬옥)' } },
];
// ---------- 스킬 3개: Lv1(기본) · Lv4 · Lv7에 열리고, 친구 카드에서 하나 골라 장착 ----------
// fx: drop(아이템 놓기) blocks(장애물 한 대씩) gauge(모두 게이지) convert(구슬 바꾸기) delay(괴물 늦추기)
//     bighit(큰 한 방) rally(공격 ×1.3) heal(회복) half(게이지 반까지) lines(줄 지우기)
// style: 스킬 빛 모양(SKFX 키), life: 일상 퍼즐에서 대신 주는 이동 수
const MORE_SKILLS = {
  chiikawa: [
    { id: 'c_sword', name: '랏코 검 찌르기', desc: '판에 랏코 검 2개를 놓음', need: 14, say: '…!! 에잇!', fx: 'drop', items: ['h', 'v'], style: 'random8' },
    { id: 'c_weed', name: '풀 뽑기 장인', desc: '모든 장애물·잡초를 한 대씩 (없으면 구슬 10개)', need: 18, say: '(소매를 걷어붙인다) …!!', fx: 'blocks', style: 'random8' }],
  hachiware: [
    { id: 'h_guitar', name: '기타 둥가둥가', desc: '모두 스킬 게이지 +4 (일상: 이동 +2)', need: 14, say: '(기타 둥가둥가~) 흐흥~ ♪', fx: 'gauge', n: 4, life: 2, style: 'rows2' },
    { id: 'h_song', name: '노래의 힘', desc: '구슬 6개를 하치와레로 바꾸고 체력 15% 회복', need: 17, say: '다 같이 불러 보자~!', fx: 'convert', n: 6, heal: 0.15, style: 'convert6' }],
  usagi: [
    { id: 'u_ura', name: '우라! 연타', desc: '폭탄 3개를 놓음', need: 16, say: '우라! 우라! 우라!!', fx: 'drop', items: ['bomb', 'bomb', 'bomb'], style: 'bighit' },
    { id: 'u_yaha', name: '야하! 대폭주', desc: '세로 2줄 + 가로 1줄을 쓸어버림', need: 18, say: '야하~!! 이얏하!!', fx: 'lines', rows: 1, cols: 2, style: 'rows2' }],
  momonga: [
    { id: 'm_fake', name: '우는 척', desc: '괴물 공격을 2턴 늦춤 (일상: 이동 +2)', need: 13, say: '(우는 척) …흑. 봤지?', fx: 'delay', n: 2, life: 2, style: 'convert6' },
    { id: 'm_praise', name: '칭찬해!', desc: '구슬 10개를 모몽가로 바꿈', need: 17, say: '빨리 칭찬해! 전부 내 거야!', fx: 'convert', n: 10, style: 'convert6' }],
  rakko: [
    { id: 'r_one', name: '일도양단', desc: '괴물에게 아주 큰 한 방 (일상: 폭탄 2개)', need: 18, say: '…베어 낸다.', fx: 'bighit', mult: 25, style: 'cross' },
    { id: 'r_rally', name: '강해졌구나', desc: '모두 게이지 +5, 3턴 동안 공격 ×1.3 (일상: 이동 +3)', need: 18, say: '강해졌구나. 기세를 타라!', fx: 'rally', life: 3, style: 'cross' }],
  kani: [
    { id: 'k_mark', name: '책갈피', desc: '괴물 공격을 2턴 늦춤 (일상: 이동 +2)', need: 13, say: '(책갈피를 슬쩍 꽂는다)', fx: 'delay', n: 2, life: 2, style: 'heal40' },
    { id: 'k_read', name: '함께 읽기', desc: '체력 20% 회복, 모두 게이지 +3 (일상: 이동 +4)', need: 16, say: '(다 같이 책을 펼친다)', fx: 'heal', heal: 0.2, gauge: 3, life: 4, style: 'heal40' }],
  kurimanju: [
    { id: 'q_snack', name: '안주 한 접시', desc: '폭탄 2개를 놓음', need: 15, say: '(안주를 슥 내민다) ……하아~', fx: 'drop', items: ['bomb', 'bomb'], style: 'rainbow' },
    { id: 'q_two', name: '두 잔째', desc: '경단 2개를 놓음', need: 20, say: '(꿀꺽꿀꺽) ……하아~~ 으어어…', fx: 'drop', items: ['rainbow', 'rainbow'], style: 'rainbow' }],
  shisa: [
    { id: 's_deliver', name: '라멘 배달', desc: '아무 아이템 3개를 놓음', need: 15, say: '배달 왔사~!', fx: 'drop', items: ['any', 'any', 'any'], style: 'ramen' },
    { id: 's_train', name: '수행의 성과', desc: '체력 30% 회복, 모두 게이지 +5 (일상: 이동 +5)', need: 19, say: '스승님, 보고 계사!? 치바리요~!', fx: 'heal', heal: 0.3, gauge: 5, life: 5, style: 'ramen' }],
  shooting: [
    { id: 'st_wish', name: '소원 하나', desc: '경단 1개를 놓음', need: 14, say: '소원 하나, 들어줄게!', fx: 'drop', items: ['rainbow'], style: 'meteor' },
    { id: 'st_shower', name: '유성우', desc: '폭탄 5개가 떨어져 바로 터짐', need: 22, say: '반짝반짝~! 다 같이 소원 빌어!', fx: 'drop', items: ['bomb', 'bomb', 'bomb', 'bomb', 'bomb'], fire: true, style: 'meteor' }],
  darkstar: [
    { id: 'd_prank', name: '장난', desc: '판을 섞고 랏코 검 2개를 놓음', need: 15, say: '히히, 섞어 버릴 거야~', fx: 'drop', shuffle: true, items: ['h', 'v'], style: 'cols2' },
    { id: 'd_again', name: '오늘 한 번 더', desc: '모두 게이지를 반까지 채움 (일상: 이동 +3)', need: 20, say: '오늘이 한 번 더 오면 좋겠지? 히히.', fx: 'half', life: 3, style: 'cols2' }],
  goblin: [
    { id: 'g_chorus', name: '옴 빰 빰 합창', desc: '괴물 공격을 4턴 늦추고 작은 피해 (일상: 이동 +3)', need: 17, say: '옴 빰 빰~ 옴 빰 빰~ 제야!', fx: 'delay', n: 4, hit: 4, life: 3, style: 'stall' },
    { id: 'g_cave', name: '동굴 춤', desc: '판을 섞고 아무 아이템 3개를 놓음', need: 18, say: '(다 같이 빙글빙글) 예 예 예~!', fx: 'drop', shuffle: true, items: ['any', 'any', 'any'], style: 'stall' }],
  beetle: [
    { id: 'b_hug', name: '꼬옥 꼬옥', desc: '체력 15% 회복하고 판을 섞음 (일상: 이동 +2)', need: 13, say: '냐하~ (꼬옥)', fx: 'heal', heal: 0.15, shuffle: true, life: 2, style: 'cheer' },
    { id: 'b_nyaha', name: '냐하하~', desc: '모두 스킬 게이지 +6 (일상: 이동 +3)', need: 18, say: '냐하하~!', fx: 'gauge', n: 6, life: 3, style: 'cheer' }],
};
const SKILL_LV = [1, 4, 7];
CHARS.forEach(c => (c.skills = [{ ...c.skill, lv: 1 }, ...(MORE_SKILLS[c.id] || []).map((s, k) => ({ ...s, lv: SKILL_LV[k + 1] }))]));
// 장착한 스킬 (레벨이 모자라면 기본 스킬)
const skillOf = id => {
  const c = CHARS.find(x => x.id === id), k = (typeof Save !== 'undefined' && Save.data?.skill?.[id]) || 0;
  const s = c.skills[k];
  return s && (typeof Meta === 'undefined' || Meta.lv(id) >= s.lv) ? s : c.skills[0];
};
const TEAM_SIZE = 5;
const DEFAULT_TEAM = ['chiikawa', 'hachiware', 'usagi', 'rakko', 'kani']; // 아직 없는 친구는 편성에서 빠짐

// 속성: 씩씩 > 엉뚱 > 울보 > 씩씩. 이기면 1.5배, 지면 0.5배
const ATTR = {
  brave: { name: '씩씩', icon: '🔥', color: '#ff7a45' },
  odd:   { name: '엉뚱', icon: '⭐', color: '#9b6bff' },
  cry:   { name: '울보', icon: '💧', color: '#3d9bff' },
  light: { name: '빛', icon: '☀️', color: '#f5b800' },
  dark:  { name: '어둠', icon: '🌙', color: '#6a5a96' },
};
// 속성 아이콘 (불꽃, 별, 물방울) — 색 동그라미 안에 흰 그림
const ATTR_SVG = {
  brave: '<path d="M12 2.5c.8 3.6 5.2 5.6 5.2 10.6a5.2 5.2 0 0 1-10.4 0c0-2.6 1.4-4.2 2.5-5.2.1 2 .9 3.2 2.1 3.4-.4-3.6-.4-6 .6-8.8z"/>',
  odd: '<path d="M12 2.8l2.7 5.7 6.2.8-4.6 4.3 1.2 6.2L12 16.8l-5.5 3 1.2-6.2-4.6-4.3 6.2-.8z"/>',
  cry: '<path d="M12 2.8C9.3 7.4 6.2 10.6 6.2 14.6a5.8 5.8 0 0 0 11.6 0c0-4-3.1-7.2-5.8-11.8z"/>',
  light: '<circle cx="12" cy="12" r="4.6"/><path d="M12 1.8v3.4M12 18.8v3.4M1.8 12h3.4M18.8 12h3.4M4.8 4.8l2.4 2.4M16.8 16.8l2.4 2.4M4.8 19.2l2.4-2.4M16.8 7.2l2.4-2.4" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>',
  dark: '<path d="M15.5 3.2a9 9 0 1 0 5.3 13.6A7.4 7.4 0 0 1 15.5 3.2z"/>',
};
// 상성 그림: 세 속성 삼각형(화살표 쪽이 약함) + 빛⇄어둠
function matchupSVG() {
  const node = (a, x, y, below = true) => `<g transform="translate(${x - 15} ${y - 15})"><circle cx="15" cy="15" r="14" fill="${ATTR[a].color}" stroke="#4a4262" stroke-width="2.5"/>` +
    `<g transform="translate(4.5 4.5) scale(.875)" fill="#fff">${ATTR_SVG[a]}</g>` +
    `<text x="15" y="${below ? 44 : -6}" text-anchor="middle" font-family="Poor Story, sans-serif" font-size="14" fill="#4a4262">${ATTR[a].name}</text></g>`;
  const arrow = (x1, y1, x2, y2) => {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
    const sx = x1 + ux * 20, sy = y1 + uy * 20, ex = x2 - ux * 22, ey = y2 - uy * 22;
    const hx = ex - ux * 9, hy = ey - uy * 9, px = -uy * 6, py = ux * 6;
    return `<path d="M${sx} ${sy}L${hx} ${hy}" stroke="#4b3f3a" stroke-width="3" stroke-linecap="round"/>` +
      `<path d="M${ex} ${ey}L${hx + px} ${hy + py}L${hx - px} ${hy - py}Z" fill="#4b3f3a" stroke="#4b3f3a" stroke-width="2" stroke-linejoin="round"/>`;
  };
  const A = [60, 34], Bp = [100, 100], C = [20, 100];
  return `<svg class="matchup" viewBox="0 0 220 136">` +
    arrow(...A, ...Bp) + arrow(...Bp, ...C) + arrow(...C, ...A) +
    node('brave', ...A, false) + node('odd', ...Bp) + node('cry', ...C) +
    `<path d="M164 68H186M164 68l7-5M164 68l7 5M186 68l-7-5M186 68l-7 5" stroke="#4a4262" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
    node('light', 146, 68) + node('dark', 204, 68) + `</svg>`;
}
const attrIcon = a => `<i class="ai" style="--ac:${ATTR[a].color}"><svg viewBox="0 0 24 24">${ATTR_SVG[a]}</svg></i>`;
// 세 속성은 가위바위보, 빛과 어둠은 서로에게 강함
const BEATS = { brave: 'odd', odd: 'cry', cry: 'brave' };
const attrMult = (atk, def) => ((atk === 'light' && def === 'dark') || (atk === 'dark' && def === 'light') ? 1.5
  : BEATS[atk] === def ? 1.5 : BEATS[def] === atk ? 0.5 : 1);
const FACE = id => `assets/img/faces/${id}.png`;
const BODY = id => `assets/img/chars/${id}.png`;
const TILE = id => `assets/img/tiles/${id}.png?v=2`; // 테두리를 매끈하게 다시 그려서 새로 받게
// 아이템은 치이카와 원작 도구로: 줄폭탄=랏코 검, 폭탄=동글 폭탄, 무지개=경단, 비행기=종이비행기 (VARCO로 그림)
const ITEM_ALIAS = { rocket: 'sword_o', bomb: 'bombball_o', rainbow: 'dango3_o', plane: 'paperplane_o' }; // _o: 테두리를 그림에 미리 그려 둔 판 (CSS 필터는 보너스 타임에 렉)
const ITEM = name => `assets/img/items/${ITEM_ALIAS[name] || name}.png?v=3`; // v: 그림을 바꾸면 올려서 폰에 남은 옛 그림 대신 새로 받게
// 전신 그림이 없는 캐릭터는 얼굴로
const NO_BODY = new Set(['kani', 'shooting', 'darkstar', 'goblin', 'beetle']);
const FXI = n => `assets/img/fx/${n}.png`;
const FX_SPRITES = ['star_y', 'star_p', 'star_b', 'star_m', 'heart_p', 'heart_r', 'heart_l', 'heart_o', 'twinkle1', 'twinkle2', 'twinkle3', 'twinkle4'];
const portrait = id => (NO_BODY.has(id) ? FACE(id) : BODY(id));
// 귀여운 포즈 일러스트 (컷인, 스토리, 결과창에 씀)
const ART = { chiikawa: 'pose_chiikawa', hachiware: 'pose_hachiware2', usagi: 'pose_usagi', momonga: 'pose_momonga', rakko: 'pose_rakko',
  kani: 'body_kani', kurimanju: 'pose_kurimanju', shisa: 'pose_shisa' };
const art = id => (ART[id] ? `assets/img/art/${ART[id]}.png` : portrait(id));
// 화면 넘어갈 때 쓱 지나가는 친구 그림 (위키 포즈 그림)
const POCKETS = ['chiikawa', 'hachiware', 'usagi', 'momonga', 'rakko', 'shisa', 'kurimanju'].map(id => art(id));


const MONSTERS = {
  chimera:   { name: '키메라',   img: 'assets/img/monsters/chimera.png' },
  mimic:     { name: '미믹',     img: 'assets/img/monsters/mimic.png' },
  dekatsuyo: { name: '데카츠요', img: 'assets/img/monsters/dekatsuyo.png' },
  // 4~6장 보스 (Chiikawa Wiki 그림에서 배경을 지움)
  elephant:  { name: '한밤의 코끼리', img: 'assets/img/monsters/elephant.png' },
  blackstar: { name: '까만별',   img: 'assets/img/monsters/blackstar.png' },
  ode:       { name: '오데',     img: 'assets/img/monsters/ode.png' },
};

// a: 속성, m: 몬스터 종류, hp, atk: 공격력, cd: 몇 턴마다 공격, hue: 색 변형, title: 이름 앞말, boss
// 토벌 hp·atk: 자동 플레이 봇으로 맞춤 (처음 100% → 보통 80~95% → HARD 50% 안팎 깸). 카니 회복을 줄인 뒤 기준
const STAGES = [
  { name: '풀숲 토벌',      waves: [{ a: 'odd', m: 'chimera', hp: 880, atk: 26, cd: 3 }] },
  { name: '두 마리 출몰',   waves: [{ a: 'odd', m: 'chimera', hp: 570, atk: 39, cd: 3 }, { a: 'cry', m: 'chimera', hp: 650, atk: 48, cd: 3, hue: 200, title: '푸른' }] },
  { name: '수상한 상자',    waves: [{ a: 'brave', m: 'mimic', hp: 2260, atk: 48, cd: 3 }] },
  { name: '숲 속 순찰',     waves: [{ a: 'odd', m: 'chimera', hp: 1090, atk: 52, cd: 3 }, { a: 'brave', m: 'mimic', hp: 1500, atk: 68, cd: 3 }] },
  { name: '데카츠요 습격',  waves: [{ a: 'brave', m: 'dekatsuyo', hp: 3820, atk: 76, cd: 4, boss: true }] },
  { name: '푸른 무리',      waves: [{ a: 'cry', m: 'chimera', hp: 1500, atk: 51, cd: 3, hue: 200, title: '푸른' }, { a: 'cry', m: 'chimera', hp: 1620, atk: 51, cd: 3, hue: 200, title: '푸른' }] },
  { name: '붉은 미믹',      waves: [{ a: 'brave', m: 'mimic', hp: 1760, atk: 54, cd: 3 }, { a: 'light', m: 'mimic', hp: 2110, atk: 60, cd: 3, hue: 320, title: '붉은' }] },
  { name: '연속 토벌',      waves: [{ a: 'odd', m: 'chimera', hp: 1450, atk: 56, cd: 3 }, { a: 'brave', m: 'mimic', hp: 1740, atk: 66, cd: 3 }, { a: 'brave', m: 'chimera', hp: 1960, atk: 66, cd: 3, hue: 100, title: '초록' }] },
  { name: '성급한 녀석',    waves: [{ a: 'dark', m: 'chimera', hp: 5340, atk: 50, cd: 2, hue: 250, title: '보라' }] },
  { name: '토벌 대작전',    waves: [{ a: 'brave', m: 'mimic', hp: 1360, atk: 80, cd: 3 }, { a: 'cry', m: 'chimera', hp: 1520, atk: 80, cd: 3, hue: 200, title: '푸른' }, { a: 'dark', m: 'dekatsuyo', hp: 2700, atk: 95, cd: 4, hue: 30, title: '진·', boss: true }] },
  // 4장
  { name: '밤의 키메라',    waves: [{ a: 'dark', m: 'chimera', hp: 5000, atk: 52, cd: 3, hue: 240, title: '밤의' }] },
  { name: '시끄러운 상자',  waves: [{ a: 'brave', m: 'mimic', hp: 2470, atk: 64, cd: 3 }, { a: 'odd', m: 'chimera', hp: 2290, atk: 60, cd: 3 }] },
  { name: '한밤의 코끼리',  waves: [{ a: 'cry', m: 'chimera', hp: 1910, atk: 75, cd: 3, hue: 200, title: '푸른' }, { a: 'light', m: 'elephant', hp: 4370, atk: 105, cd: 4, boss: true }] },
  // 5장
  { name: '또 같은 키메라', waves: [{ a: 'odd', m: 'chimera', hp: 3010, atk: 62, cd: 3 }, { a: 'odd', m: 'chimera', hp: 3010, atk: 62, cd: 3, title: '또' }] },
  { name: '되돌아온 녀석들', waves: [{ a: 'light', m: 'mimic', hp: 2750, atk: 68, cd: 3, hue: 320, title: '붉은' }, { a: 'brave', m: 'dekatsuyo', hp: 3100, atk: 71, cd: 3 }] },
  { name: '까만별',         waves: [{ a: 'dark', m: 'chimera', hp: 2420, atk: 59, cd: 2, hue: 250, title: '보라' }, { a: 'dark', m: 'blackstar', hp: 5440, atk: 80, cd: 3, boss: true }] },
  // 6장
  { name: '동굴 키메라',    waves: [{ a: 'brave', m: 'chimera', hp: 2760, atk: 58, cd: 3, hue: 30, title: '동굴' }, { a: 'cry', m: 'mimic', hp: 2920, atk: 61, cd: 3 }] },
  { name: '동굴의 데카츠요', waves: [{ a: 'brave', m: 'dekatsuyo', hp: 7150, atk: 68, cd: 3 }] },
  { name: '거인 오데',      waves: [{ a: 'odd', m: 'chimera', hp: 2070, atk: 81, cd: 3 }, { a: 'brave', m: 'mimic', hp: 2180, atk: 85, cd: 3 }, { a: 'brave', m: 'ode', hp: 5060, atk: 106, cd: 4, boss: true }] },
];

// 스테이지 시작 전 짧은 대사 (팬 창작)
const STORY = {
  0: [
    ['hachiware', '토벌 게시판에 새 의뢰가 붙었어! 괴물을 쓰러뜨리면 보수를 받을 수 있대.'],
    ['chiikawa', '(끄덕끄덕…)'],
    ['usagi', '우-라-!'],
    ['hachiware', '같은 얼굴 셋을 맞추면 그 친구가 공격해. 넷이면 랏코 검, L이나 T는 폭탄, 다섯이면 경단!'],
  ],
  1: [
    ['rakko', '…두 마리다.'],
    ['rakko', '한 마리 쓰러뜨렸다고 방심하지 마라.'],
    ['hachiware', '네, 선생님!'],
  ],
  3: [
    ['hachiware', '숲 속 순찰 의뢰야. 상자를 던지는 미믹이 있대.'],
    ['usagi', '우라!'],
    ['hachiware', '던진 상자는 바로 옆에서 터뜨리면 깨져!'],
  ],
  5: [
    ['hachiware', '파란 키메라가 무리 지어 나왔대…'],
    ['chiikawa', '…!! (부들부들)'],
    ['rakko', '속성을 보고 편성해라. 유리한 녀석을 앞에 세워라.'],
  ],
  6: [
    ['usagi', '하아?'],
    ['hachiware', '상자가… 빨개!?'],
    ['rakko', '…색이 다르면 성질도 다르다. 기세를 타라.'],
  ],
  7: [
    ['hachiware', '오늘은 쉬지 않고 세 마리래…!'],
    ['rakko', '강해졌구나. 이번엔 끝까지 버텨 봐라.'],
    ['chiikawa', '…!! (끄덕끄덕)'],
  ],
  8: [
    ['hachiware', '저 보라색 키메라, 엄청 성급하대. 공격이 빨라!'],
    ['usagi', '우-라-!!'],
    ['hachiware', '먼저 쓰러뜨리면 돼! 어떻게든 되라~!'],
  ],
  2: [
    ['momonga', '저 상자 내가 먼저 찾았어! 안에 든 건 전부 내 거야. 알았지?'],
    ['chiikawa', '…!!'],
  ],
  4: [
    ['rakko', '이 근처에 큰 놈이 나온다는 소문이다.'],
    ['rakko', '…방심은 금물.'],
    ['kurimanju', '……하아~~'],
  ],
  9: [
    ['hachiware', '마지막 의뢰야. 다 같이 가자!'],
    ['shisa', '끝나면 다 같이 라멘 먹으러 와사~!'],
    ['usagi', '우라!!'],
  ],
  10: [
    ['rakko', '밤에는 놈들이 더 날뛴다.'],
    ['rakko', '…연습하는 소리에 끌려온 모양이군.'],
    ['hachiware', '노래 연습 방해하지 마~!'],
  ],
  11: [
    ['usagi', '하아?!'],
    ['hachiware', '상자가… 움직인다는 거야!?'],
  ],
  12: [
    ['hachiware', '공연 날 밤인데… 어디서 노랫소리가 들려.'],
    ['chiikawa', '…!?'],
    ['hachiware', '저, 저건… 밤새 노래하는 코끼리!? 무대를 지켜야 해!'],
  ],
  13: [
    ['hachiware', '이 키메라도… 어제 쓰러뜨린 거랑 똑같아!'],
    ['rakko', '…같은 놈이 또 나왔다고? 방심하지 마라.'],
  ],
  14: [
    ['usagi', '우-라-!!'],
    ['hachiware', '이번엔 순서를 바꿔 보자. 뭔가 달라질지도!'],
  ],
  15: [
    ['darkstar', '아~아, 들켰네~'],
    ['darkstar', '오늘이 계속되면 좋겠다며? 들어줬잖아~ 히히.'],
    ['hachiware', '그런 뜻이 아니었어! 내일로 보내 줘!'],
  ],
  16: [
    ['rakko', '동굴 안은 어둡다. 발밑을 조심해라.'],
    ['hachiware', '앗, 키메라다!'],
  ],
  17: [
    ['hachiware', '저, 저건 데카츠요…!?'],
    ['rakko', '…강해졌구나. 이번엔 너희가 앞장서라.'],
  ],
  18: [
    ['hachiware', '거, 거인이다…!!'],
    ['goblin', '옴 빰… 빰…'],
    ['rakko', '기세를 타라!'],
    ['usagi', '우라아아!!'],
  ],
  end: [
    ['chiikawa', '…!! (폴짝폴짝)'],
    ['hachiware', '토벌 대성공이라는 거야!? 보수로 맛있는 거 먹자~!'],
    ['kurimanju', '(건배) ……하아~~ 으어어…'],
  ],
};
// 그 토벌을 처음 깼을 때 나오는 장 끝 대사
const STORY_AFTER = {
  9: STORY.end,
  12: [
    ['hachiware', '(기타 둥가둥가~) …♪'],
    ['chiikawa', '…!! (눈물이 그렁그렁)'],
    ['usagi', '푸루야 우라우라!'],
    ['kurimanju', '(건배) ……하아~~ 으어어…'],
    ['hachiware', '다들 들어 줘서 고마워. …어떻게든 됐다!'],
  ],
  15: [
    ['darkstar', '칫, 재미없어!'],
    ['chiikawa', '…!! (창밖으로 아침 햇살)'],
    ['hachiware', '내일이다…! 진짜 내일이 왔어!'],
    ['usagi', '야하~!!'],
  ],
  18: [
    ['goblin', '옴 빰 빰~ 예 예 예~!'],
    ['hachiware', '고블린들이 고맙다고 춤춰 주는 거야!?'],
    ['shisa', '다들 라멘 먹으러 와사~! 오늘은 다 같이 곱빼기사!'],
    ['chiikawa', '…!! (모구모구…)'],
    ['hachiware', '다음엔 또 무슨 일이 기다리고 있을까~ 어떻게든 되겠지!'],
  ],
};
// 친구마다 하는 말 (끝나고 한마디, 집, 라멘 가게에서 톡 했을 때). 우사기는 말 대신 소리, 치이카와는 거의 말이 없음, 카니는 말을 안 함(몸짓만)
const LINES = {
  // 치이카와: 문장 대신 소리와 짧은 말. 울 땐 우에에엥, 신나면 움차차~
  chiikawa: ['…!', '…!!', '와…!', '(끄덕끄덕)', '우에에엥…', '나도!', '응?!', '움차차~ 움차차~', '(모구모구…)', '(풀 뽑기 열심히!)'],
  // 하치와레: 셋 중 유일하게 말을 함. 친구 이름은 부르지 않음 (너, 같이 가자!)
  hachiware: ['어떻게든 되겠지~!', '고거 좋다!', '이거 완전 대박이라는 거야!?', '흐흥~ ♪', '괜찮아? 내가 도울게!', '끝나면 라멘 먹으러 가자~', '…라는 느낌이었대!', '(기타 둥가둥가~ ♪)', '언젠가 동굴 말고 진짜 집에 살 거야~'],
  // 우사기: 우사기어만
  usagi: ['우라!', '우-라-!!', '야하!', '하아?!', '후웅', '푸루야~', '푸루야 우라우라!', '이야-!', '이얏하!', '쥬르리…'],
  // 모몽가: 귀여운 척하지만 표독하고 이기적. 명령조로 칭찬을 요구하고, 남의 걸 뺏고, 떼쓰고, 우는 척. 자기 이름(3인칭)은 아주 가끔만
  momonga: ['빨리 칭찬해!', '모몽가 귀엽지? 귀엽잖아. 대답해!', '그거 내 거야. 내놔.', '흥! 너네가 느린 거잖아!', '내가 다 한 거야. (아님)', '싫어싫어싫어! (바닥에 드러누워 버둥버둥)', '(우는 척) …흑. 봤지? 그러니까 칭찬해.', '뭘 봐? 칭찬 안 할 거면 저리 가!'],
  // 랏코: 진중한 무인 말투. 단 걸 먹을 땐 속으로 감탄
  rakko: ['…간다.', '강해졌구나.', '기세를 타라!', '방심은 금물이다.', '수련은 매일 하는 거다.', '(좋아… 맛있다…! 고소하고 달콤해…!)', '…선생님이라. 나쁘지 않군.'],
  // 카니(헌책방): 말을 안 함. 몸짓만. 모몽가 단짝
  kani: ['(꾸벅)', '(……)', '(책을 슬쩍 내민다)', '(게 모자를 고쳐 쓴다)', '(조용히 책장을 넘긴다)', '(모몽가 옆에 꼭 붙어 있다)', '(수줍게 고개를 숙인다)'],
  // 쿠리만쥬: 말은 거의 없고 마시고 나서 아저씨 감탄사
  kurimanju: ['……', '하아~~ 으어어…', '(꿀꺽꿀꺽) 하아~~', '(안주를 슥 내민다)', '……(만족)', '(냉탕에 몸을 담근다) 하아~~'],
  // 시사: 오키나와 말투 '~사', 스승님(라멘 갑옷 씨)을 존경
  shisa: ['어서 와사~!', '열심히 할 거사!', '기쁘사! (우레시사!)', '치바리요~! (힘내요!)', '스승님 라멘은 최고사!', '술 자격증 공부 중이사…!', '오키나와 간식 먹어 볼 거사?'],
  // 고블린: 말은 안 하고 단체로 기묘한 노래
  goblin: ['옴 빰 빰~ 예 예 예~', '제야! 야요!', '(버섯을 꼭 껴안는다)', '옴 빰 빰~'],
  // 풍뎅이(치이카부): 귀여운 소리, 안기기, 장난치고 춤
  beetle: ['냐하~', '끙~', '(꼬옥 안긴다)', '(장난치고 나서 춤춘다)', '냐하하~'],
  shooting: ['반짝!', '반짝반짝~!', '구해 줘서 고마워!', '소원 빌었어?'],
  // 까만별: 소원을 비틀어 들어주는 얄미운 별
  darkstar: ['소원? 들어줄게~ 내 맘대로!', '아~아, 들켰네~', '칫, 재미없어!', '오늘이 계속되면 좋겠다며? 히히.'],
};
const lineOf = id => { const p = LINES[id]; return p ? p[Math.floor(Math.random() * p.length)] : (CHARS.find(c => c.id === id) || {}).line || '…!'; };
// 옷 갈아입기: assets/img/skins/<친구>/<파일> 그림으로 통째로 바꿔 끼움. 애니·만화 장면에서 배경을 지운 그림 (Chiikawa Wiki)
// price: 옷 가게 값 (캡슐 뽑기 화면의 '옷 가게' 탭에서 코인으로 삼)
const SKINS = {
  chiikawa: {
    sprout:   { name: '멜론 새싹',   img: 'sprout.png',   price: 150 },
    gelsheet: { name: '해열 시트',   img: 'gelsheet.png', price: 150 },
    pochette: { name: '분홍 포셰트', img: 'pochette.png', price: 200 },
    sasumata: { name: '토벌봉',      img: 'sasumata.png', price: 250 },
    melon:    { name: '멜론 모자',   img: 'melon.png',    price: 300 },
    squid:    { name: '오징어 옷',   img: 'squid.png',    price: 350 },
    tanuki:   { name: '너구리 옷',   img: 'tanuki.png',   price: 400 },
    magical:  { name: '마법소녀',    img: 'magical.png',  price: 600, special: 'magical_chiikawa' },
  },
  hachiware: {
    bugnet:   { name: '잠자리채',    img: 'bugnet.png',   price: 150 },
    sasumata: { name: '토벌봉',      img: 'sasumata.png', price: 250 },
    guitar:   { name: '기타',        img: 'guitar.png',   price: 300 },
    tanuki:   { name: '너구리 옷',   img: 'tanuki.png',   price: 400 },
    magical:  { name: '마법소녀',    img: 'magical.png',  price: 600, special: 'magical_hachiware' },
  },
  usagi: {
    neckie:   { name: '시원한 넥밴드', img: 'neckie.png', price: 150 },
    squid:    { name: '오징어 옷',   img: 'squid.png',    price: 350 },
    magical:  { name: '마법소녀',    img: 'magical.png',  price: 600, special: 'magical_usagi' },
  },
  // 마법소녀 MV(まじかるちいかわ) 장면에서
  momonga:   { magical: { name: '마법소녀',      img: 'magical.png', price: 600, special: 'magical_momonga' } },
  rakko:     { mask:    { name: '가면 히어로',   img: 'mask.png',    price: 600, special: 'rakko_mask' } },
  kurimanju: { magical: { name: '마법소녀',      img: 'magical.png', price: 600, special: 'magical_meadow' } },
  shisa:     { magical: { name: '마법소녀',      img: 'magical.png', price: 600, special: 'magical_meadow' } },
};
const SKIN = (id, s) => `assets/img/skins/${id}/${SKINS[id][s].img}`;
// 스페셜 코스튬(special: 장면 그림 이름): 입고 있으면 카드·상세 창 배경이 그 옷이 나온 애니 장면으로 바뀜
const SCENE = n => new URL(`assets/img/scenes/${n}.jpg`, location.href).href; // CSS 변수 안 url()은 css/ 기준으로 풀려서 절대 주소로
const specialOf = id => { const s = Save.data.outfit?.[id], k = s && SKINS[id]?.[s]; return k?.special ? k : null; };
// 표정: 기본 옷일 때만 잠깐 바꿔 끼움
const MOODS = { chiikawa: { cry: 'cry.png', happy: 'dance.gif' } };
// 집에서 들어 올렸을 때 반응: held=들고 있을 때 말, cry=오래 들면, drop=내려놨을 때 말, mood=들고 있을 때 표정
// fx=효과(tears 눈물 / sweat 땀 / sparkle 반짝), flail=바둥거리는 빠르기(초), eye=눈 높이(%, moodEye는 표정 그림일 때), spin=내려놓으면 한 바퀴
const REACT = {
  chiikawa:  { held: ['와…!', '(바둥바둥)', '싫어…!'], cry: ['우에에엥…!', '(훌쩍훌쩍…)'], drop: ['(훌쩍…)', '…!'], mood: 'cry', fx: 'tears', flail: 0.14, eye: 36, moodEye: 64 },
  hachiware: { held: ['와아~ 높다~!', '흐흥~ ♪'], drop: ['고거 좋다~!'], fx: 'sparkle', flail: 0.3 },
  usagi:     { held: ['야하~!!', '우라!'], drop: ['이얏하!!'], fx: 'sparkle', flail: 0.1, spin: true },
  kani:      { held: ['(바둥바둥…!)', '(……!!)'], drop: ['(꾸벅)'], fx: 'sweat', flail: 0.25 },
  _:         { held: ['!?', '…!'], drop: ['…휴.'], fx: 'sweat', flail: 0.2 },
};
const CHAR_NAME = { shisa: '시사' };
CHARS.forEach(c => (CHAR_NAME[c.id] = c.name));
