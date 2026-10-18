// 팬게임 데이터: 캐릭터, 몬스터, 스테이지, 스토리
// attr: 속성, skill: 게이지(need)가 차면 쓰는 스킬
const CHARS = [
  { id: 'chiikawa',  name: '치이카와', ring: '#f7a8c4', attr: 'cry',   dmg: 10, line: '…!',
    skill: { id: 'random8',  name: '울면서 휘두르기', desc: '무작위 구슬 8개 터뜨림', need: 14, say: '으앗…! 에잇!' } },
  { id: 'hachiware', name: '하치와레', ring: '#6fa8dc', attr: 'brave', dmg: 10, line: '할 수 있어!',
    skill: { id: 'rows2',    name: '할 수 있어!', desc: '가로줄 2줄 지움', need: 16, say: '할 수 있어!' } },
  { id: 'usagi',     name: '우사기',   ring: '#ffd84d', attr: 'odd',   dmg: 9, crit: 0.3, line: '우라!',
    skill: { id: 'bighit',   name: '우라!', desc: '몬스터에 큰 한 방', need: 16, say: '우라아아!!' } },
  { id: 'momonga',   name: '모몽가',   ring: '#b99cf0', attr: 'odd',   dmg: 11, line: '칭찬해줘!',
    skill: { id: 'convert6', name: '칭찬해줘!', desc: '구슬 6개를 모몽가로 바꿈', need: 12, say: '나를 칭찬해!' } },
  { id: 'rakko',     name: '랏코',     ring: '#a9a9a9', attr: 'brave', dmg: 13, line: '…간다.',
    skill: { id: 'cross',    name: '…간다.', desc: '십자로 지우고 몬스터 공격 2턴 늦춤', need: 18, say: '…간다.' } },
  { id: 'kani',      name: '카니',     ring: '#ff6f61', attr: 'cry',   heal: 4, line: '힘내!',
    skill: { id: 'heal40',   name: '힘내!', desc: '체력 40% 회복', need: 14, say: '다들 힘내!' } },
  { id: 'kurimanju', name: '쿠리만쥬', ring: '#a6d96a', attr: 'odd',   dmg: 12, line: '……(캬아)',
    skill: { id: 'rainbow',  name: '캬아', desc: '판에 무지개 폭탄 하나', need: 15, say: '……캬아.' } },
  { id: 'shisa',     name: '시사',     ring: '#ff9f5a', attr: 'odd',   dmg: 11, line: '어서 오세요!',
    skill: { id: 'ramen',    name: '라멘 배달', desc: '체력 20% 회복, 모두 게이지 +3', need: 15, say: '라멘 나왔어요~!' } },
  { id: 'shooting',  name: '별똥별',   ring: '#f5d90a', attr: 'brave', dmg: 11, line: '반짝!',
    skill: { id: 'meteor',   name: '소원 별똥별', desc: '무작위 3곳에 폭탄이 떨어짐', need: 17, say: '소원을 빌어!' } },
  { id: 'darkstar',  name: '까만별',   ring: '#5d5d72', attr: 'cry',   dmg: 12, line: '……',
    skill: { id: 'cols2',    name: '어둠의 별빛', desc: '세로줄 2줄 지움', need: 16, say: '……반짝.' } },
  { id: 'goblin',    name: '고블린',   ring: '#4fbf8f', attr: 'brave', dmg: 11, line: '킥킥',
    skill: { id: 'stall',    name: '고블린 장난', desc: '몬스터 공격 3턴 늦춤, 작은 피해', need: 14, say: '킥킥, 이쪽이다~' } },
  { id: 'beetle',    name: '풍뎅이',   ring: '#b07a4a', attr: 'cry',   dmg: 10, line: '부웅~',
    skill: { id: 'cheer',    name: '데굴데굴', desc: '판 섞고 다른 멤버 게이지 +4', need: 13, say: '데굴데굴~' } },
];
const TEAM_SIZE = 5;
const DEFAULT_TEAM = ['chiikawa', 'hachiware', 'usagi', 'rakko', 'kani'];

// 속성: 씩씩 > 엉뚱 > 울보 > 씩씩. 이기면 1.5배, 지면 0.5배
const ATTR = {
  brave: { name: '씩씩', icon: '💪', color: '#ff8a5c' },
  odd:   { name: '엉뚱', icon: '🌀', color: '#9b7bff' },
  cry:   { name: '울보', icon: '💧', color: '#4fa3ff' },
};
const BEATS = { brave: 'odd', odd: 'cry', cry: 'brave' };
const attrMult = (atk, def) => (BEATS[atk] === def ? 1.5 : BEATS[def] === atk ? 0.5 : 1);
const FACE = id => `assets/img/faces/${id}.png`;
const BODY = id => `assets/img/chars/${id}.png`;
const TILE = id => `assets/img/tiles/${id}.png`;
const ITEM = name => `assets/img/items/${name}.png`;
// 전신 그림이 없는 캐릭터는 얼굴로
const NO_BODY = new Set(['kani', 'shooting', 'darkstar', 'goblin', 'beetle']);
const FXI = n => `assets/img/fx/${n}.png`;
const UI = n => `assets/img/ui/${n}.png`;
const FX_SPRITES = ['star_y', 'star_p', 'star_b', 'star_m', 'heart_p', 'heart_r', 'heart_l', 'heart_o', 'twinkle1', 'twinkle2', 'twinkle3', 'twinkle4'];
const portrait = id => (NO_BODY.has(id) ? FACE(id) : BODY(id));

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
  { name: '붉은 미믹',      waves: [{ a: 'brave', m: 'mimic', hp: 650, atk: 32, cd: 3 }, { a: 'brave', m: 'mimic', hp: 780, atk: 36, cd: 3, hue: 320, title: '붉은' }] },
  { name: '연속 토벌',      waves: [{ a: 'odd', m: 'chimera', hp: 600, atk: 27, cd: 3 }, { a: 'brave', m: 'mimic', hp: 720, atk: 32, cd: 3 }, { a: 'brave', m: 'chimera', hp: 810, atk: 32, cd: 3, hue: 100, title: '초록' }] },
  { name: '성급한 녀석',    waves: [{ a: 'odd', m: 'chimera', hp: 1190, atk: 29, cd: 2, hue: 250, title: '보라' }] },
  { name: '토벌 대작전',    waves: [{ a: 'brave', m: 'mimic', hp: 850, atk: 36, cd: 3 }, { a: 'cry', m: 'chimera', hp: 950, atk: 36, cd: 3, hue: 200, title: '푸른' }, { a: 'cry', m: 'dekatsuyo', hp: 1690, atk: 43, cd: 4, hue: 30, title: '진·', boss: true }] },
];

// 스테이지 시작 전 짧은 대사 (팬 창작)
const STORY = {
  0: [
    ['hachiware', '토벌 게시판에 새 의뢰가 붙었어!'],
    ['chiikawa', '(끄덕끄덕…)'],
    ['usagi', '우라~!'],
    ['hachiware', '같은 얼굴을 셋 맞추면 그 친구가 공격해. 카니는 회복이야!'],
    ['hachiware', '4개는 ↔줄폭탄, L이나 T 모양은 💣폭탄, 5개는 🌈무지개 폭탄이 생겨!'],
  ],
  2: [
    ['momonga', '저 상자, 수상해. 내가 먼저 찾았으니까 칭찬해줘!'],
    ['chiikawa', '…!!'],
  ],
  4: [
    ['rakko', '이 근처에 큰 녀석이 나온다는 소문이 있어.'],
    ['rakko', '방심하지 마. 네 개를 맞추면 줄을 날려버리는 구슬이 생겨.'],
    ['kurimanju', '……(캬아)'],
  ],
  9: [
    ['hachiware', '마지막 의뢰야. 다 같이 가자!'],
    ['shisa', '끝나면 다 같이 라멘 먹으러 가요!'],
    ['usagi', '하아?!'],
  ],
  end: [
    ['chiikawa', '…해냈다!'],
    ['hachiware', '토벌 대성공! 보수로 맛있는 거 먹자~'],
    ['kurimanju', '……(건배)'],
  ],
};
const CHAR_NAME = { shisa: '시사' };
CHARS.forEach(c => (CHAR_NAME[c.id] = c.name));
