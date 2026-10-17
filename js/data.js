// 팬게임 데이터: 캐릭터, 몬스터, 스테이지, 스토리
const CHARS = [
  { id: 'chiikawa',  name: '치이카와', ring: '#f7a8c4', dmg: 10, line: '…!' },
  { id: 'hachiware', name: '하치와레', ring: '#6fa8dc', dmg: 10, line: '할 수 있어!' },
  { id: 'usagi',     name: '우사기',   ring: '#ffd84d', dmg: 9,  crit: 0.3, line: '우라!' },
  { id: 'momonga',   name: '모몽가',   ring: '#8fd3ea', dmg: 11, line: '칭찬해줘!' },
  { id: 'rakko',     name: '랏코',     ring: '#a9a9a9', dmg: 13, line: '…간다.' },
  { id: 'shisa',     name: '시사',     ring: '#ff9f5a', heal: 4, line: '힘내자!' },
];
const FACE = id => `assets/img/faces/${id}.png`;
const BODY = id => `assets/img/chars/${id}.png`;

const MONSTERS = {
  chimera:   { name: '키메라',   img: 'assets/img/monsters/chimera.png' },
  mimic:     { name: '미믹',     img: 'assets/img/monsters/mimic.png' },
  dekatsuyo: { name: '데카츠요', img: 'assets/img/monsters/dekatsuyo.png' },
};

// m: 몬스터 종류, hp, atk: 공격력, cd: 몇 턴마다 공격, hue: 색 변형, title: 이름 앞말, boss
const STAGES = [
  { name: '풀숲 토벌',      waves: [{ m: 'chimera', hp: 200, atk: 10, cd: 3 }] },
  { name: '두 마리 출몰',   waves: [{ m: 'chimera', hp: 220, atk: 10, cd: 3 }, { m: 'chimera', hp: 260, atk: 12, cd: 3, hue: 200, title: '푸른' }] },
  { name: '수상한 상자',    waves: [{ m: 'mimic', hp: 420, atk: 15, cd: 3 }] },
  { name: '숲 속 순찰',     waves: [{ m: 'chimera', hp: 320, atk: 12, cd: 3 }, { m: 'mimic', hp: 440, atk: 16, cd: 3 }] },
  { name: '데카츠요 습격',  waves: [{ m: 'dekatsuyo', hp: 950, atk: 22, cd: 4, boss: true }] },
  { name: '푸른 무리',      waves: [{ m: 'chimera', hp: 480, atk: 14, cd: 3, hue: 200, title: '푸른' }, { m: 'chimera', hp: 520, atk: 14, cd: 3, hue: 200, title: '푸른' }] },
  { name: '붉은 미믹',      waves: [{ m: 'mimic', hp: 600, atk: 18, cd: 3 }, { m: 'mimic', hp: 720, atk: 20, cd: 3, hue: 320, title: '붉은' }] },
  { name: '연속 토벌',      waves: [{ m: 'chimera', hp: 560, atk: 15, cd: 3 }, { m: 'mimic', hp: 680, atk: 18, cd: 3 }, { m: 'chimera', hp: 760, atk: 18, cd: 3, hue: 100, title: '초록' }] },
  { name: '성급한 녀석',    waves: [{ m: 'chimera', hp: 1100, atk: 16, cd: 2, hue: 250, title: '보라' }] },
  { name: '토벌 대작전',    waves: [{ m: 'mimic', hp: 800, atk: 20, cd: 3 }, { m: 'chimera', hp: 900, atk: 20, cd: 3, hue: 200, title: '푸른' }, { m: 'dekatsuyo', hp: 1600, atk: 28, cd: 4, hue: 30, title: '진·', boss: true }] },
];

// 스테이지 시작 전 짧은 대사 (팬 창작)
const STORY = {
  0: [
    ['hachiware', '토벌 게시판에 새 의뢰가 붙었어!'],
    ['chiikawa', '(끄덕끄덕…)'],
    ['usagi', '우라~!'],
    ['hachiware', '같은 얼굴을 셋 맞추면 그 친구가 공격해. 시사는 회복이야!'],
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
const CHAR_NAME = { kurimanju: '쿠리만쥬' };
CHARS.forEach(c => (CHAR_NAME[c.id] = c.name));
