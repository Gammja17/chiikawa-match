// 팬게임 데이터: 캐릭터, 괴물, 스테이지, 스토리
// attr: 속성, skill: 게이지(need)가 차면 쓰는 스킬
const CHARS = [
  { id: 'chiikawa',  name: '치이카와', ring: '#f27aa5', attr: 'cry',   dmg: 10, line: '…!',
    skill: { id: 'random8',  name: '울면서 휘두르기', desc: '무작위 구슬 8개 터뜨림', need: 14, say: '으앗…! 에잇!' } },
  { id: 'hachiware', name: '하치와레', ring: '#4f93dc', attr: 'brave', dmg: 10, line: '어떻게든 되겠지~!',
    skill: { id: 'rows2',    name: '어떻게든 되라~!', desc: '가로줄 2줄 지움', need: 16, say: '어떻게든 되라앗~!!' } },
  { id: 'usagi',     name: '우사기',   ring: '#f0b90b', attr: 'odd',   dmg: 9, crit: 0.3, line: '우라!',
    skill: { id: 'bighit',   name: '우라!', desc: '괴물에게 큰 한 방', need: 16, say: '우라아아!!' } },
  { id: 'momonga',   name: '모몽가',   ring: '#9b7be8', attr: 'odd',   dmg: 11, line: '칭찬해 줘!',
    skill: { id: 'convert6', name: '칭찬해 줘!', desc: '구슬 6개를 모몽가로 바꿈', need: 12, say: '모몽가 귀엽지? 칭찬해 줘~!' } },
  { id: 'rakko',     name: '랏코',     ring: '#8a8a96', attr: 'brave', dmg: 17, crit: 0.2, line: '…간다.',
    skill: { id: 'cross',    name: '…간다.', desc: '십자 3줄을 베고 괴물에게 큰 한 방, 공격 2턴 늦춤', need: 16, say: '…간다.' } },
  { id: 'kani',      name: '카니',     ring: '#ff5a4a', attr: 'cry',   heal: 4, line: '다친 데 없어?',
    skill: { id: 'heal40',   name: '호~ 해 줄게', desc: '체력 40% 회복', need: 14, say: '호~ 해 줄게! 금방 나을 거야.' } },
  { id: 'kurimanju', name: '쿠리만쥬', ring: '#79bf3f', attr: 'odd',   dmg: 12, line: '……프하~',
    skill: { id: 'rainbow',  name: '프하~', desc: '판에 무지개 폭탄 하나', need: 15, say: '(꿀꺽꿀꺽) ……프하아~!' } },
  { id: 'shisa',     name: '시사',     ring: '#ff8a33', attr: 'odd',   dmg: 11, line: '어서 오세요~!',
    skill: { id: 'ramen',    name: '라멘 배달', desc: '체력 20% 회복, 모두 게이지 +3', need: 15, say: '라멘 나왔어요~!' } },
  { id: 'shooting',  name: '별똥별',   ring: '#e5c100', attr: 'light', dmg: 11, line: '반짝!',
    skill: { id: 'meteor',   name: '소원 별똥별', desc: '무작위 3곳에 폭탄이 떨어짐', need: 17, say: '소원을 빌어!' } },
  { id: 'darkstar',  name: '까만별',   ring: '#4b4b66', attr: 'dark',   dmg: 12, line: '……',
    skill: { id: 'cols2',    name: '어둠의 별빛', desc: '세로줄 2줄 지움', need: 16, say: '……반짝.' } },
  { id: 'goblin',    name: '고블린',   ring: '#2fae7a', attr: 'brave', dmg: 11, line: '킥킥',
    skill: { id: 'stall',    name: '고블린 장난', desc: '괴물 공격 3턴 늦춤, 작은 피해', need: 14, say: '킥킥, 이쪽이다~' } },
  { id: 'beetle',    name: '풍뎅이',   ring: '#a5683a', attr: 'cry',   dmg: 10, line: '부웅~',
    skill: { id: 'cheer',    name: '데굴데굴', desc: '판 섞고 다른 멤버 게이지 +4', need: 13, say: '데굴데굴~' } },
];
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
const TILE = id => `assets/img/tiles/${id}.png`;
// 아이템은 치이카와 원작 도구로: 줄폭탄=토벌봉, 폭탄=동글 폭탄, 무지개=경단, 비행기=종이비행기 (VARCO로 그림)
const ITEM_ALIAS = { rocket: 'stick', bomb: 'bombball', rainbow: 'dango3', plane: 'paperplane' };
const ITEM = name => `assets/img/items/${ITEM_ALIAS[name] || name}.png`;
// 전신 그림이 없는 캐릭터는 얼굴로
const NO_BODY = new Set(['kani', 'shooting', 'darkstar', 'goblin', 'beetle']);
const FXI = n => `assets/img/fx/${n}.png`;
const FX_SPRITES = ['star_y', 'star_p', 'star_b', 'star_m', 'heart_p', 'heart_r', 'heart_l', 'heart_o', 'twinkle1', 'twinkle2', 'twinkle3', 'twinkle4'];
const portrait = id => (NO_BODY.has(id) ? FACE(id) : BODY(id));
// 귀여운 포즈 일러스트 (컷인, 스토리, 결과창에 씀)
const ART = { chiikawa: 'pose_chiikawa', hachiware: 'pose_hachiware2', usagi: 'pose_usagi', momonga: 'pose_momonga', rakko: 'pose_rakko',
  kani: 'body_kani', kurimanju: 'pose_kurimanju', shisa: 'pose_shisa' };
const art = id => (ART[id] ? `assets/img/art/${ART[id]}.png` : portrait(id));
const POCKETS = ['chiikawa', 'hachiware', 'usagi', 'momonga', 'rakko', 'shisa', 'kurimanju'].map(id => `assets/img/art/pocket_${id}.png`);

const MONSTERS = {
  chimera:   { name: '키메라',   img: 'assets/img/monsters/chimera.png' },
  mimic:     { name: '미믹',     img: 'assets/img/monsters/mimic.png' },
  dekatsuyo: { name: '데카츠요', img: 'assets/img/monsters/dekatsuyo.png' },
};

// a: 속성, m: 몬스터 종류, hp, atk: 공격력, cd: 몇 턴마다 공격, hue: 색 변형, title: 이름 앞말, boss
const STAGES = [
  { name: '풀숲 토벌',      waves: [{ a: 'odd', m: 'chimera', hp: 250, atk: 18, cd: 3 }] },
  { name: '두 마리 출몰',   waves: [{ a: 'odd', m: 'chimera', hp: 280, atk: 18, cd: 3 }, { a: 'cry', m: 'chimera', hp: 320, atk: 22, cd: 3, hue: 200, title: '푸른' }] },
  { name: '수상한 상자',    waves: [{ a: 'brave', m: 'mimic', hp: 520, atk: 27, cd: 3 }] },
  { name: '숲 속 순찰',     waves: [{ a: 'odd', m: 'chimera', hp: 400, atk: 22, cd: 3 }, { a: 'brave', m: 'mimic', hp: 550, atk: 29, cd: 3 }] },
  { name: '데카츠요 습격',  waves: [{ a: 'brave', m: 'dekatsuyo', hp: 1190, atk: 40, cd: 4, boss: true }] },
  { name: '푸른 무리',      waves: [{ a: 'cry', m: 'chimera', hp: 600, atk: 25, cd: 3, hue: 200, title: '푸른' }, { a: 'cry', m: 'chimera', hp: 650, atk: 25, cd: 3, hue: 200, title: '푸른' }] },
  { name: '붉은 미믹',      waves: [{ a: 'brave', m: 'mimic', hp: 650, atk: 32, cd: 3 }, { a: 'light', m: 'mimic', hp: 780, atk: 36, cd: 3, hue: 320, title: '붉은' }] },
  { name: '연속 토벌',      waves: [{ a: 'odd', m: 'chimera', hp: 600, atk: 27, cd: 3 }, { a: 'brave', m: 'mimic', hp: 720, atk: 32, cd: 3 }, { a: 'brave', m: 'chimera', hp: 810, atk: 32, cd: 3, hue: 100, title: '초록' }] },
  { name: '성급한 녀석',    waves: [{ a: 'dark', m: 'chimera', hp: 1190, atk: 29, cd: 2, hue: 250, title: '보라' }] },
  { name: '토벌 대작전',    waves: [{ a: 'brave', m: 'mimic', hp: 850, atk: 36, cd: 3 }, { a: 'cry', m: 'chimera', hp: 950, atk: 36, cd: 3, hue: 200, title: '푸른' }, { a: 'dark', m: 'dekatsuyo', hp: 1690, atk: 43, cd: 4, hue: 30, title: '진·', boss: true }] },
];

// 스테이지 시작 전 짧은 대사 (팬 창작)
const STORY = {
  0: [
    ['hachiware', '토벌 게시판에 새 의뢰가 붙었어! 괴물을 쓰러뜨리면 보수를 받을 수 있대.'],
    ['chiikawa', '(끄덕끄덕…)'],
    ['usagi', '우라~!'],
    ['hachiware', '같은 얼굴 셋을 맞추면 그 친구가 공격해. 넷이면 줄폭탄, L이나 T는 폭탄, 다섯이면 무지개!'],
  ],
  2: [
    ['momonga', '저 상자 수상해! 모몽가가 먼저 찾았어. 칭찬해 줘!'],
    ['chiikawa', '…!!'],
  ],
  4: [
    ['rakko', '이 근처에 큰 놈이 나온다는 소문이다.'],
    ['rakko', '…방심은 금물.'],
    ['kurimanju', '……프하~'],
  ],
  9: [
    ['hachiware', '마지막 의뢰야. 다 같이 가자!'],
    ['shisa', '끝나면 다 같이 라멘 드시러 오세요~!'],
    ['usagi', '우라!!'],
  ],
  end: [
    ['chiikawa', '…!! (해냈다…!)'],
    ['hachiware', '토벌 대성공이라는 거야!? 보수로 맛있는 거 먹자~!'],
    ['kurimanju', '(건배) ……프하아~!'],
  ],
};
// 친구마다 하는 말 (끝나고 한마디, 집, 라멘 가게에서 톡 했을 때). 우사기는 말 대신 소리, 치이카와는 거의 말이 없음
const LINES = {
  chiikawa: ['…!', '…!!', '와아…!', '(끄덕끄덕)', '이야…!', '(두근두근…)', '으앗…!', '(헤헤…)'],
  hachiware: ['어떻게든 되겠지~!', '치이카와~ 해냈다!', '이거 완전 대박이라는 거야!?', '흐흥~ ♪', '괜찮아 괜찮아, 천천히 하자.', '끝나면 라멘 먹으러 가자~', '오늘도 수고했어!'],
  usagi: ['우라!', '우라~!!', '야하!', '하아?!', '후웅~', '푸루루루루', '이야앗!', '야하~!!'],
  momonga: ['칭찬해 줘!', '모몽가 귀엽지?', '모몽가 오늘 엄청 착했어~ 칭찬해 줘!', '에헤헤~ 더 칭찬해 줘!', '이거 모몽가 주는 거지?', '흥! 모몽가가 제일 잘했어!'],
  rakko: ['…간다.', '…좋은 마음가짐이다.', '방심은 금물.', '…나쁘지 않군.', '수련은 매일 하는 거다.'],
  kani: ['다친 데 없어?', '호~ 해 줄게.', '천천히 해도 괜찮아.', '반창고 붙이자!'],
  kurimanju: ['……', '……프하~', '(꿀꺽꿀꺽) 프하아~', '(안주를 슥 내민다)', '……(만족)'],
  shisa: ['어서 오세요~!', '넵! 열심히 하겠습니다!', '마스터 라멘 최고예요~!', '오늘도 수행이에요!', '배달 다녀오겠습니다~!'],
  goblin: ['킥킥', '킥킥, 이쪽이야~', '오늘은 장난 안 쳤어. …진짜로.'],
  beetle: ['부웅~', '데굴데굴~', '부우웅!'],
  shooting: ['반짝!', '반짝반짝~!', '소원 빌었어?'],
  darkstar: ['……', '……반짝.', '…….'],
};
const lineOf = id => { const p = LINES[id]; return p ? p[Math.floor(Math.random() * p.length)] : (CHARS.find(c => c.id === id) || {}).line || '…!'; };
// 옷 갈아입기: assets/img/skins/<친구>/<파일> 그림으로 통째로 바꿔 끼움 (gif·apng·webp면 그대로 움직임)
const SKINS = {
  chiikawa:  { outing: { name: '나들이 모자', img: 'outing.png' } },
  hachiware: { outing: { name: '나들이 카메라', img: 'outing.png' } },
  usagi:     { outing: { name: '나들이 모자', img: 'outing.png' } },
  kurimanju: { chef: { name: '요리사 옷', img: 'chef.png' } },
  shisa:     { chef: { name: '요리사 옷', img: 'chef.png' } },
};
const SKIN = (id, s) => `assets/img/skins/${id}/${SKINS[id][s].img}`;
// 표정: 기본 옷일 때만 잠깐 바꿔 끼움
const MOODS = { chiikawa: { cry: 'cry.png', happy: 'dance.gif' } };
// 집에서 들어 올렸을 때 반응: held=들고 있을 때 말, cry=오래 들면, drop=내려놨을 때 말, mood=들고 있을 때 표정
// fx=효과(tears 눈물 / sweat 땀 / sparkle 반짝), flail=바둥거리는 빠르기(초), eye=눈 높이(%, moodEye는 표정 그림일 때), spin=내려놓으면 한 바퀴
const REACT = {
  chiikawa:  { held: ['으앗…!', '히잉…', '(바둥바둥)'], cry: ['으에에엥…!', '(훌쩍훌쩍…)'], drop: ['(훌쩍…)', '…!'], mood: 'cry', fx: 'tears', flail: 0.14, eye: 36, moodEye: 64 },
  hachiware: { held: ['와아~ 높다~!', '흐흥~ ♪'], drop: ['고마워~!'], fx: 'sparkle', flail: 0.3 },
  usagi:     { held: ['야하~!!', '우라!'], drop: ['우라~!!'], fx: 'sparkle', flail: 0.1, spin: true },
  _:         { held: ['!?', '…!'], drop: ['…휴.'], fx: 'sweat', flail: 0.2 },
};
const CHAR_NAME = { shisa: '시사' };
CHARS.forEach(c => (CHAR_NAME[c.id] = c.name));
