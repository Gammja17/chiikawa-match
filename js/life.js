// 일상 퍼즐: 풀 뽑기, 요리, 거품 청소, 상자 뜯기, 제초 검정. 괴물 없이 목표를 채우는 스테이지
// 판 크기는 map 줄 수 x 글자 수 (7x7 ~ 9x9). 판 글자: # 판 밖(구멍)  . 구슬  w 잡초  W 큰 잡초(두 번)  b 상자  g 선물 상자(두 번)
//          o 거품(번짐)  i 재료  l 리본 구슬  s 처음부터 시럽 칸
// 잡초, 상자, 거품은 칸을 차지하는 장애물: 바로 옆에서 매치하거나 아이템으로 맞히면 깨짐
const LIFE_CHARS = ['chiikawa', 'hachiware', 'usagi', 'momonga', 'kurimanju', 'rakko'];

// goals: lock 리본 다 풀기, syrup 시럽을 판 전체에 바르기, weed 잡초 다 뽑기, box 상자 다 뜯기, bubble 거품 다 터뜨리기, ing 재료 n개 바닥까지, char 그 캐릭터 n개, score 점수
// stars: 별 점수. 봇 점수 분포로 맞춤 (깬 판의 60%가 별 2, 25%가 별 3)
// moves 이동 수 또는 time 초(제한 시간). 자동 플레이 봇으로 잰 '깨는 데 든 수'에 맞춤 (보통 85~95%, 도전 80%, HARD 50~60% 깸; 시간 판은 한 수 2.6초), stars 별 점수 [1, 2, 3], host 화면 옆 응원 캐릭터
const LIFE = [
  // 1장: 하나씩 배우기 (4색으로 쉽게)
  { name: '풀 뽑기 첫날', icon: 'weed1', types: 4, moves: 10, host: 'chiikawa', intro: '잡초 옆에서 터뜨리기!',
    goals: [{ k: 'weed' }], stars: [4000, 7000, 9000],
    map: ['.......', '.......', '.......', '.......', '.......', '.w...w.', 'ww...ww'] },
  { name: '비행기 연습', icon: 'plane', types: 4, moves: 12, host: 'hachiware', intro: '네모로 모으면 비행기!',
    goals: [{ k: 'weed' }], stars: [5000, 7500, 9500],
    map: ['w.....w', 'ww...ww', '.......', '.......', '.......', '.......', '.......'] },
  { name: '라멘 재료 나르기', done: '배달<br>완료!', icon: 'ramen', types: 5, moves: 19, host: 'shisa', intro: '재료를 맨 아래로!',
    goals: [{ k: 'ing' }], stars: [4000, 5000, 5500], ing: { n: 2, max: 2, kinds: ['naruto', 'egg'] },
    map: ['..i.i..', '.......', '.......', '.......', '#.....#', '##...##', '###.###'] },
  { name: '택배 상자 뜯기', icon: 'box', types: 5, moves: 10, host: 'momonga', intro: '상자를 모두 뜯자!',
    goals: [{ k: 'box' }], stars: [3000, 4000, 5000],
    map: ['#.....#', '.......', '.b...b.', 'bb...bb', '.......', '..bbb..', '#.....#'] },
  { name: '목욕탕 거품 청소', icon: 'bubble', types: 5, moves: 11, host: 'hachiware', intro: '거품이 번지기 전에!',
    goals: [{ k: 'bubble' }], stars: [3000, 4000, 5000],
    map: ['.......', '.......', '.......', '.......', '...o...', '#.o.o.#', '##o.o##'] },
  { name: '하치와레 노래 연습', done: '노래<br>완성!', icon: 'target', types: 5, moves: 22, host: 'hachiware', intro: '하치와레를 모아 줘!',
    goals: [{ k: 'char', id: 'hachiware', n: 20 }], stars: [4500, 6000, 7000],
    map: ['#..#..#', '.......', '.......', '.......', '#.....#', '##...##', '###.###'] },
  { name: '제초 검정 5급', icon: 'medal', types: 5, time: 60, host: 'usagi', exam: true, intro: '60초 안에 점수!',
    goals: [{ k: 'score', n: 6500 }], stars: [6500, 8500, 9500],
    map: ['.......', '.......', '.......', '..###..', '.......', '.......', '.......'] },
  // 2장: 섞어 보기
  { name: '선물 상자 정리', done: '정리<br>끝!!', icon: 'gift', types: 5, moves: 21, host: 'momonga', intro: '선물 상자는 두 번!',
    goals: [{ k: 'box' }, { k: 'weed' }], stars: [7000, 8500, 10500],
    map: ['##....##', '.g.ww.g.', '..w..w..', '.w.gg.w.', 'w.gbbg.w', '.b.ww.b.', '..w..w..', '#.bwwb.#'] },
  { name: '시사의 라멘 가게', done: '라멘<br>완성!', icon: 'ramen', types: 5, moves: 16, host: 'shisa', intro: '재료 3개를 맨 아래로!',
    goals: [{ k: 'ing' }], stars: [4000, 6000, 7500], ing: { n: 3, max: 2, kinds: ['naruto', 'egg'] },
    map: ['#.i.i.#', '.......', '.......', '.b...b.', '.bb.bb.', '.......', '.......'] },
  { name: '제초 검정 4급', icon: 'medal', types: 5, time: 35, host: 'usagi', exam: true, intro: '75초 안에 잡초 전부!',
    goals: [{ k: 'weed' }], stars: [3500, 4500, 6000],
    map: ['##...##', '#.....#', '.......', 'w.w.w.w', '.w.w.w.', 'w.w.w.w', '.w.w.w.'] },
  { name: '거품 대소동', icon: 'bubble', types: 5, moves: 17, host: 'chiikawa', intro: '거품과 잡초를 한꺼번에!',
    goals: [{ k: 'bubble' }, { k: 'weed' }], stars: [5000, 7000, 8500],
    map: ['........', '.w....w.', '..w..w..', '...##...', '...##...', '.o....o.', 'o.o..o.o', '.o....o.'] },
  { name: '쿠리만쥬의 안주', done: '안주<br>완성!', icon: 'dango', types: 5, moves: 22, host: 'kurimanju', intro: '경단, 주먹밥 내리고 상자도!',
    goals: [{ k: 'ing' }, { k: 'box' }], stars: [7500, 10000, 11500], ing: { n: 4, max: 2, kinds: ['dango', 'onigiri'] },
    map: ['..i..i..', '........', '........', 'b......b', 'bg....gb', '.b....b.', '#......#', '##....##'] },
  { name: '제초 검정 3급', icon: 'medal', types: 5, time: 55, host: 'usagi', exam: true, intro: '큰 잡초는 두 번!',
    goals: [{ k: 'weed' }, { k: 'score', n: 9000 }], stars: [9000, 10500, 11000],
    map: ['##...##', '#.....#', '.W...W.', '..W.W..', 'w..W..w', '.w...w.', '..www..'] },
  // 3장: 새 기믹과 어려운 조합
  { name: '선물 리본 풀기', icon: 'ribbon', types: 5, moves: 20, host: 'momonga', intro: '리본을 모두 풀자!',
    goals: [{ k: 'lock' }], stars: [4500, 6000, 7500],
    map: ['####.####', '###...###', '##.l.l.##', '#.l.l.l.#', '.l.l.l.l.', '#.l.l.l.#', '##.l.l.##', '###.l.###', '####.####'] },
  { name: '핫케이크 시럽', done: '핫케이크<br>완성!', icon: 'pancake', types: 5, moves: 29, host: 'chiikawa', intro: '시럽을 판 전체에!',
    goals: [{ k: 'syrup' }], stars: [9500, 12000, 13500],
    map: ['#..###..#', '.........', '.........', '....s....', '#.......#', '##.....##', '###...###', '####.####'] },
  { name: '제초 검정 2급', icon: 'medal', types: 6, time: 50, host: 'usagi', exam: true, intro: '리본 사이 잡초!',
    goals: [{ k: 'weed' }, { k: 'lock' }], stars: [4000, 5500, 6500],
    map: ['.......', '.l...l.', 'w.l.l.w', '.w.l.w.', 'W.w.w.W', '.W...W.', '..www..'] },
  { name: '라멘 국물 내기', done: '국물<br>완성!', icon: 'pot', types: 5, moves: 30, host: 'shisa', intro: '국물을 바르고 재료도!',
    goals: [{ k: 'syrup' }, { k: 'ing' }], stars: [12000, 16000, 19000], ing: { n: 4, max: 2, kinds: ['naruto', 'egg'] },
    map: ['..i...i..', '.........', '.........', '.........', '#...s...#', '#.......#', '##.....##', '###...###'] },
  { name: '거품 목욕 대작전', icon: 'bath', types: 5, moves: 16, host: 'hachiware', intro: '거품도 리본도!',
    goals: [{ k: 'bubble' }, { k: 'lock' }], stars: [7500, 10000, 12500],
    map: ['.l.....l.', '.l.l.l.l.', '..l...l..', '.o.....o.', 'oo.o.o.oo', '#oo...oo#', '#.o.o.o.#', '##.ooo.##'] },
  { name: '소풍 도시락', done: '도시락<br>완성!', icon: 'bento', types: 5, moves: 15, host: 'kurimanju', intro: '도시락 재료 모으기!',
    goals: [{ k: 'ing' }, { k: 'box' }, { k: 'weed' }], stars: [6000, 9000, 11000], ing: { n: 3, max: 2, kinds: ['onigiri', 'dango', 'donut'] },
    map: ['.i..#..i.', '....#....', '....#....', 'b.......b', 'wb.....bw', '.w.w.w.w.', '..wwwww..', '#.......#', '##.....##'] },
  { name: '제초 검정 1급', icon: 'medal', types: 6, time: 90, host: 'usagi', exam: true, intro: '최종 시험!',
    goals: [{ k: 'weed' }, { k: 'bubble' }, { k: 'score', n: 12000 }], stars: [12500, 14000, 15000],
    map: ['#.......#', '.........', 'W.W.W.W.W', '.w.w.w.w.', 'w.W.o.W.w', '.w.ooo.w.', '#.w...w.#', '##.ooo.##', '###...###'] },
  // 4장: 하치와레의 노래
  { name: '기타 줄 찾기', done: '기타 줄<br>찾았다!', icon: 'box', types: 5, moves: 16, host: 'hachiware', intro: '상자 속 기타 줄!',
    goals: [{ k: 'box' }], stars: [5000, 6500, 8000],
    map: ['.g...g.', 'bgb.bgb', 'b.b.b.b', '.......', '.b.b.b.', 'b.....b', '#.....#'] },
  { name: '목 풀기 연습', done: '목 풀기<br>끝!', icon: 'target', types: 5, moves: 21, host: 'hachiware', intro: '하치와레를 잔뜩!',
    goals: [{ k: 'char', id: 'hachiware', n: 30 }], stars: [6000, 8000, 9500],
    map: ['#.....#', '.......', '.......', '...#...', '.......', '.......', '#.....#'] },
  { name: '무대 꾸미기', done: '무대<br>완성!', icon: 'ribbon', types: 5, moves: 19, host: 'momonga', intro: '리본이랑 선물 상자!',
    goals: [{ k: 'lock' }, { k: 'box' }], stars: [8000, 10000, 12000],
    map: ['#.l...l.#', '.l.g.g.l.', '..lgggl..', '.g.lll.g.', '..l.g.l..', '.l.g.g.l.', '.l.....l.', '##.....##'] },
  { name: '객석 잡초 뽑기', icon: 'weed1', types: 5, moves: 14, host: 'chiikawa', intro: '관객 자리를 만들자!',
    goals: [{ k: 'weed' }], stars: [4500, 6000, 7000],
    map: ['.......', '.......', 'w.W.W.w', '.w...w.', 'W.w.w.W', '.wwwww.', '#.....#'] },
  { name: '응원 안주', done: '안주<br>완성!', icon: 'dango', types: 5, moves: 18, host: 'kurimanju', intro: '안주 내리고 거품도!',
    goals: [{ k: 'ing' }, { k: 'bubble' }], stars: [4500, 6000, 7500], ing: { n: 3, max: 2, kinds: ['dango', 'onigiri'] },
    map: ['..i.i..', '.......', '.......', '.......', '.o...o.', '#o...o#', '##o.o##'] },
  { name: '리허설', done: '리허설<br>끝!', icon: 'bubble', types: 6, moves: 20, host: 'hachiware', intro: '거품 속 하치와레!',
    goals: [{ k: 'char', id: 'hachiware', n: 24 }, { k: 'bubble' }], stars: [5000, 6000, 7500],
    map: ['.......', '.......', '.......', '..o.o..', '.o...o.', 'o.....o', '.o...o.'] },
  { name: '무대 조명', done: '조명<br>반짝!', icon: 'sparkle', types: 5, moves: 24, host: 'usagi', intro: '조명을 판 전체에!',
    goals: [{ k: 'syrup' }], stars: [13000, 16500, 19500],
    map: ['###...###', '##.....##', '#.......#', '.........', '....s....', '.........', '.........', '#.......#', '##.....##'] },
  // 5장: 끝나지 않는 오늘
  { name: '좋은 하루', icon: 'weed2', types: 5, moves: 11, host: 'chiikawa', intro: '오늘도 풀 뽑기!',
    goals: [{ k: 'weed' }, { k: 'box' }], stars: [3500, 5000, 6000],
    map: ['.w...w.', 'w.w.w.w', '.......', 'b.w.w.b', '.b.g.b.', '..www..', '#.....#'] },
  { name: '또 오늘…', icon: 'clock', types: 5, moves: 13, host: 'hachiware', intro: '어제랑… 똑같아?',
    goals: [{ k: 'weed' }, { k: 'box' }], stars: [4500, 6000, 7000],
    map: ['#.....#', '..WWW..', '.g...g.', 'b.w.w.b', '.g...g.', '.w...w.', 'w.....w'] },
  { name: '어제도 했잖아', icon: 'box', types: 5, moves: 12, host: 'hachiware', intro: '상자도 거품도 또!',
    goals: [{ k: 'box' }, { k: 'bubble' }], stars: [4000, 5500, 7000],
    map: ['#.....#', '.b.g.b.', 'bb...bb', '.g...g.', '..o.o..', '.o.o.o.', '#o...o#'] },
  { name: '데자뷔 라멘', done: '라멘<br>완성!', icon: 'ramen', types: 5, moves: 21, host: 'shisa', intro: '재료 4개를 맨 아래로!',
    goals: [{ k: 'ing' }, { k: 'box' }], stars: [5500, 7000, 8500], ing: { n: 4, max: 2, kinds: ['naruto', 'egg'] },
    map: ['..i.i..', '.......', '.......', 'b.b.b.b', '.b.b.b.', '#.....#', '##...##'] },
  { name: '시계 바늘 리본', icon: 'ribbon', types: 5, moves: 16, host: 'momonga', intro: '리본 풀고 잡초도!',
    goals: [{ k: 'lock' }, { k: 'weed' }], stars: [7500, 10500, 13000],
    map: ['##.....##', '#.l...l.#', '..l.l.l..', '.w.l.l.w.', '.l..l..l.', 'w..l.l..w', 'w.w.w.w.w', '#.w.w.w.#', '##wwwww##'] },
  { name: '또 같은 시험', icon: 'medal', types: 6, time: 85, host: 'usagi', exam: true, intro: '큰 잡초와 점수!',
    goals: [{ k: 'weed' }, { k: 'score', n: 9000 }], stars: [9000, 10500, 11500],
    map: ['##...##', '.W...W.', '..W.W..', 'W..w..W', '.w...w.', '..w.w..', '#.....#'] },
  { name: '하루의 끝', done: '내일로!', icon: 'pancake', types: 5, moves: 30, host: 'chiikawa', intro: '시럽 바르고 재료도!',
    goals: [{ k: 'syrup' }, { k: 'ing' }], stars: [13500, 16000, 18000], ing: { n: 3, max: 2, kinds: ['donut', 'dango'] },
    map: ['..i...i..', '.........', '.........', '....s....', '.........', '#.......#', '##.....##', '###...###'] },
  // 6장: 고블린 동굴
  { name: '동굴 입구', icon: 'weed2', types: 6, moves: 18, host: 'usagi', intro: '큰 잡초가 잔뜩!',
    goals: [{ k: 'weed' }], stars: [4000, 5500, 6500],
    map: ['.......', 'W.....W', '.W...W.', '..WWW..', '.w...w.', 'w.w.w.w', '.......'] },
  { name: '고블린의 노래', done: '같이<br>불렀다!', icon: 'target', types: 6, moves: 37, host: 'usagi', intro: '우사기를 잔뜩!',
    goals: [{ k: 'char', id: 'usagi', n: 40 }], stars: [8500, 10500, 12000],
    map: ['###...###', '##.....##', '#.......#', '.........', '....#....', '.........', '#.......#', '##.....##', '###...###'] },
  { name: '버섯 상자', icon: 'gift', types: 6, moves: 17, host: 'momonga', intro: '상자를 몽땅!',
    goals: [{ k: 'box' }], stars: [3500, 5000, 5500],
    map: ['.g...g.', 'b.b.b.b', '.b.g.b.', 'b.b.b.b', '.......', '.......', '#.....#'] },
  { name: '동굴 온천', icon: 'bath', types: 6, moves: 18, host: 'kurimanju', intro: '거품과 리본!',
    goals: [{ k: 'bubble' }, { k: 'lock' }], stars: [4000, 5000, 6000],
    map: ['.......', '.l...l.', '..l.l..', '.......', 'o.o.o.o', '.o.o.o.', '#.....#'] },
  { name: '고블린 주먹밥', done: '주먹밥<br>배달!', icon: 'bento', types: 6, moves: 35, host: 'usagi', intro: '주먹밥 내리고 잡초도!',
    goals: [{ k: 'ing' }, { k: 'weed' }], stars: [8500, 10500, 12000], ing: { n: 5, max: 2, kinds: ['onigiri', 'dango'] },
    map: ['###.i.###', '##.....##', '#.i...i.#', '.........', 'w.......w', '.w.....w.', '..w...w..', '.w.www.w.', '.........'] },
  { name: '반짝이는 돌', icon: 'ribbon', types: 6, moves: 12, host: 'usagi', intro: '리본과 상자!',
    goals: [{ k: 'lock' }, { k: 'box' }], stars: [3000, 4000, 5000],
    map: ['#.....#', '.l.l.l.', 'l.l.l.l', '.b.b.b.', 'b.....b', '.......', '.......'] },
  { name: '거인의 발자국', icon: 'medal', types: 6, time: 70, host: 'hachiware', exam: true, intro: '잡초, 거품, 점수!',
    goals: [{ k: 'weed' }, { k: 'bubble' }, { k: 'score', n: 10000 }], stars: [10500, 12000, 13000],
    map: ['#.......#', '.W.W.W.W.', 'W.w.w.w.W', '.w.o.o.w.', 'w.ooooo.w', '.w.o.o.w.', '#.......#', '##.....##', '###...###'] },
];
// 스테이지 시작 전 짧은 대사 (팬 창작)
const LIFE_STORY = {
  0: [
    ['hachiware', '잡초는 바로 옆에서 같은 얼굴 셋을 맞추면 쑥 뽑혀. 쉽지?'],
    ['chiikawa', '(끄덕끄덕)'],
  ],
  1: [
    ['usagi', '우라!'],
    ['hachiware', '와~ 같이 하자!'],
    ['hachiware', '같은 얼굴 넷을 네모로 모으면 종이비행기가 생겨. 잡초 쪽으로 슝 날아가!'],
    ['usagi', '야하!'],
  ],
  2: [
    ['shisa', '라멘 재료가 모자라요~! 나루토랑 달걀을 맨 아래까지 내려 주실래요?'],
    ['hachiware', '재료 밑에 있는 걸 터뜨리면 쑥 내려가. 맡겨 줘!'],
  ],
  3: [
    ['momonga', '야! 택배 왔는데 안 열려! 빨리 열어!'],
    ['momonga', '느려! 안에 든 거 망가지면 다 너네 탓이야!'],
    ['hachiware', '상자는 바로 옆에서 터뜨리면 뜯을 수 있어!'],
  ],
  4: [
    ['hachiware', '목욕탕에 거품이 넘친다는 거야!?'],
    ['hachiware', '한 번 움직일 동안 거품을 하나도 못 터뜨리면 옆으로 번져. 조심!'],
    ['chiikawa', '…!!'],
  ],
  6: [
    ['hachiware', '제초 검정 5급 시험이다…! 시간 안에 점수를 모으면 합격이야.'],
    ['hachiware', '두 번 떨어졌어도 괜찮아… 이번엔 어떻게든 될 거야!'],
    ['hachiware', '구슬이 터지는 동안은 시계가 멈추니까 침착하게~'],
    ['chiikawa', '(두근두근…)'],
    ['usagi', '하아?!'],
  ],
  5: [
    ['hachiware', '(흥얼흥얼) 흐흥~ ♪'],
    ['chiikawa', '…!? (두리번두리번)'],
    ['hachiware', '앗, 들었어…? 노래 연습 중이었어. 조금 부끄럽네…'],
    ['hachiware', '내 얼굴을 모아 주면 박자를 맞출 수 있을 것 같아!'],
  ],
  7: [
    ['hachiware', '토벌도 하고 풀도 뽑고… 요즘 일이 많아졌다!'],
    ['momonga', '선물 상자 잔뜩 받았어. 정리는 너네가 해.'],
    ['hachiware', '선물 상자는 두 번 터뜨려야 열린대!'],
    ['momonga', '흥! 빨리 해!'],
  ],
  8: [
    ['shisa', '어서 오세요~! 오늘은 손님이 너무 많아요!'],
    ['shisa', '사부님이 재료를 3개 더 가져오래요. 도와주실 수 있어요?'],
    ['hachiware', '상자 밑에 깔린 재료도 꺼내 줄게!'],
  ],
  9: [
    ['hachiware', '4급 시험이다! 이번엔 시간 안에 잡초를 전부 뽑아야 해.'],
    ['usagi', '우라!'],
    ['chiikawa', '(두근두근…)'],
  ],
  10: [
    ['hachiware', '목욕탕 거품이 또 넘쳤대! 이번엔 잡초까지 자랐다는 거야!?'],
    ['chiikawa', '…!! (부들부들)'],
    ['usagi', '야하!'],
  ],
  11: [
    ['kurimanju', '……(술병을 들어 보인다)'],
    ['kurimanju', '(빈 안주 접시를 가리킨다)'],
    ['hachiware', '안주가 필요하구나! 경단이랑 주먹밥을 내려 주자!'],
  ],
  15: [
    ['hachiware', '2급… 리본 사이에 잡초가 숨어 있대.'],
    ['usagi', '하아?!'],
    ['hachiware', '3급도 붙었으니까, 어떻게든 되겠지~!'],
  ],
  16: [
    ['shisa', '오늘은 국물부터 새로 끓여요!'],
    ['shisa', '사부님이 국물은 냄비 전체에 골고루 퍼져야 한대요.'],
    ['hachiware', '국물 바르고 재료도 내리자!'],
  ],
  17: [
    ['hachiware', '토벌 끝나고 목욕이다~!'],
    ['kurimanju', '(냉탕에 몸을 담근다) ……하아~~'],
    ['hachiware', '리본 묶인 수건이 거품에 섞였어. 같이 치우자!'],
  ],
  18: [
    ['hachiware', '내일은 소풍이다! 도시락 싸자~'],
    ['chiikawa', '…!! (폴짝폴짝)'],
    ['kurimanju', '(주먹밥을 슥 내민다)'],
    ['hachiware', '1급 시험 전에 든든하게 먹어 두자!'],
  ],
  12: [
    ['usagi', '야하!'],
    ['chiikawa', '…(꿀꺽)'],
    ['hachiware', '두 겹 잡초는 두 번 뽑아야 해. 어떻게든 되겠지~!'],
  ],
  13: [
    ['momonga', '이거 내가 받은 선물이야. 너네 건 없어. 리본이나 풀어!'],
    ['hachiware', '리본 묶인 구슬은 못 움직여. 한 번 터뜨리면 풀려!'],
  ],
  14: [
    ['chiikawa', '…!! (핫케이크를 보고 눈이 반짝)'],
    ['hachiware', '시럽 칸이 낀 매치를 하면 그 줄로 시럽이 쭉 번져. 판 전체에 듬뿍~!'],
  ],
  19: [
    ['usagi', '우라!!'],
    ['hachiware', '드디어 1급 시험… 거품, 두 겹 잡초, 점수까지 전부래. 2급 딴 애들도 처음 보는 시험이래!'],
    ['chiikawa', '…(꿀꺽)'],
    ['hachiware', '어떻게든 돼라~!!'],
  ],
  20: [
    ['hachiware', '저기… 나, 노래 부르는 거 좋아하잖아.'],
    ['hachiware', '언젠가 다른 애들 앞에서 기타 치면서 불러 보고 싶어. 조금 부끄럽지만…'],
    ['chiikawa', '…!! (박수)'],
    ['usagi', '푸루야~!'],
    ['hachiware', '그럼 먼저 끊어진 기타 줄부터 찾자! 상자 안에 있을 거야.'],
  ],
  21: [
    ['hachiware', '아~ 아~ 목 풀기부터!'],
    ['chiikawa', '(두근두근…)'],
    ['hachiware', '내 얼굴을 많이 모아 주면 힘이 날 것 같아!'],
  ],
  22: [
    ['momonga', '뭐야 그 무대? 촌스러워.'],
    ['momonga', '내가 더 귀엽게 꾸며 줄게. 대신 맨 앞자리는 내 거야!'],
    ['hachiware', '리본이랑 선물 상자로 꾸미자!'],
  ],
  23: [
    ['chiikawa', '(소매를 걷어붙인다) …!!'],
    ['hachiware', '무대 앞 잡초를 싹 뽑자! 관객이 앉을 자리야.'],
  ],
  24: [
    ['kurimanju', '……(경단을 슥 내민다)'],
    ['kurimanju', '(꿀꺽꿀꺽) ……하아~~'],
    ['hachiware', '공연 끝나고 먹을 안주를 준비해 준대!'],
  ],
  25: [
    ['hachiware', '리허설이다…! 떨려…'],
    ['chiikawa', '…!! (주먹을 꼭 쥔다)'],
    ['usagi', '우라!'],
  ],
  26: [
    ['usagi', '야하!'],
    ['hachiware', '무대 조명을 판 전체에 쭉 바르자. 반짝반짝하게!'],
  ],
  27: [
    ['hachiware', '오늘 정말 좋은 하루다~ 날씨도 좋고, 라멘도 맛있었고!'],
    ['chiikawa', '(밤하늘에 반짝이는 별을 보며 두 손을 모은다)'],
  ],
  28: [
    ['hachiware', '…어라? 이 잡초, 어제도 뽑지 않았어…?'],
    ['chiikawa', '…?'],
    ['usagi', '하아?'],
  ],
  29: [
    ['hachiware', '상자도, 거품도, 전부 어제랑 같아…'],
    ['hachiware', '혹시 우리… 같은 날을 계속 반복하고 있는 거야!?'],
    ['chiikawa', '…!! (부들부들)'],
  ],
  30: [
    ['shisa', '어서 오세요~! 오늘 첫 손님이에요!'],
    ['hachiware', '…어제도 그 말 했어.'],
    ['shisa', '어라? 처음 뵙는 분들 같은데요…?'],
  ],
  31: [
    ['momonga', '시계 바늘에 리본이 감겼어. 풀어. 빨리!'],
    ['hachiware', '시간이 멈춘 게… 이것 때문일까?'],
  ],
  32: [
    ['hachiware', '또 시험이야… 이것도 어제 봤는데…'],
    ['usagi', '하아?!'],
    ['hachiware', '그래도 이번엔 더 잘할 수 있어! 어떻게든 되겠지~!'],
  ],
  33: [
    ['chiikawa', '(밤하늘을 올려다본다) …!'],
    ['hachiware', '저 까만 별… 저게 소원을 들어준 거야!?'],
    ['hachiware', '하루의 끝까지 가 보자!'],
  ],
  34: [
    ['usagi', '우라!'],
    ['hachiware', '동굴에서 이상한 노랫소리가 들린대. 가 보자는 거야!?'],
    ['chiikawa', '…(꿀꺽)'],
  ],
  35: [
    ['goblin', '옴 빰 빰~ 예 예 예~'],
    ['goblin', '제야! 야요!'],
    ['usagi', '이얏하!'],
    ['hachiware', '따라 부르면… 친해질 수 있을지도?'],
  ],
  36: [
    ['momonga', '버섯 상자다! 안에 든 건 다 내 거야.'],
    ['hachiware', '다 같이 나누자~!'],
    ['momonga', '흥!'],
  ],
  37: [
    ['kurimanju', '(온천에 몸을 담근다) ……하아~~'],
    ['hachiware', '동굴 온천이다! 거품부터 치우자~'],
  ],
  38: [
    ['goblin', '(주먹밥을 가리킨다) 옴 빰 빰~'],
    ['hachiware', '주먹밥을 좋아하는구나! 많이 내려 주자!'],
  ],
  39: [
    ['usagi', '(반짝이는 돌을 높이 든다) 야하~!!'],
    ['hachiware', '동굴 깊은 곳에 반짝이는 돌이 잔뜩이래!'],
  ],
  40: [
    ['hachiware', '이 큰 발자국… 뭐지?'],
    ['goblin', '(벌벌 떨며 동굴 안쪽을 가리킨다)'],
    ['chiikawa', '…!!'],
  ],
  end: [
    ['chiikawa', '…!! (와아…!)'],
    ['hachiware', '제초 검정 1급 합격이라는 거야!? 해냈다~!'],
    ['usagi', '야하~!!'],
    ['shisa', '어서 오세요~! 오늘은 축하 곱빼기예요! 기쁜 시사~!'],
  ],
};
// 그 일상 퍼즐을 처음 깼을 때 나오는 장 끝 대사
const LIFE_STORY_AFTER = {
  6: [
    ['hachiware', '합격이다~!! 제초 검정 5급!'],
    ['chiikawa', '…!! (울먹울먹)'],
    ['usagi', '야하~!!'],
    ['hachiware', '다음엔 더 높은 급수도 따 보자! 어떻게든 될 거야~'],
  ],
  12: [
    ['hachiware', '3급 합격…! 큰 잡초도 이제 무섭지 않아!'],
    ['usagi', '우라!!'],
    ['shisa', '축하해요~! 라멘 드시고 가세요!'],
    ['chiikawa', '(모구모구…) …!!'],
  ],
  19: LIFE_STORY.end,
};

// 모험 루트: 일상 일을 하다 토벌 의뢰가 끼어드는 순서. 마지막은 토벌 대작전
const ROUTE = [
  ['l', 0], ['l', 1], ['b', 0], ['l', 2], ['l', 3], ['b', 1], ['l', 4], ['l', 5], ['b', 2], ['l', 6],
  ['l', 7], ['b', 3], ['l', 8], ['b', 4], ['l', 9], ['l', 10], ['b', 5], ['l', 11], ['b', 6], ['l', 12],
  ['l', 13], ['b', 7], ['l', 14], ['l', 15], ['b', 8], ['l', 16], ['l', 17], ['l', 18], ['l', 19], ['b', 9],
  // 4장 하치와레의 노래
  ['l', 20], ['l', 21], ['b', 10], ['l', 22], ['l', 23], ['b', 11], ['l', 24], ['l', 25], ['l', 26], ['b', 12],
  // 5장 끝나지 않는 오늘
  ['l', 27], ['l', 28], ['b', 13], ['l', 29], ['l', 30], ['b', 14], ['l', 31], ['l', 32], ['l', 33], ['b', 15],
  // 6장 고블린 동굴
  ['l', 34], ['l', 35], ['b', 16], ['l', 36], ['l', 37], ['b', 17], ['l', 38], ['l', 39], ['l', 40], ['b', 18],
];
// 지도에 띄우는 장 띠 (ROUTE 번호에서 시작)
const CHAPTERS = [[0, '1장 풀 뽑기 첫걸음'], [10, '2장 섞어 보기'], [20, '3장 제초 검정 1급'], [30, '4장 하치와레의 노래'], [40, '5장 끝나지 않는 오늘'], [50, '6장 고블린 동굴']];

// 난이도: 1~19는 쉽게, 그 사이 도전 두 번(제초 검정 5급, 데카츠요). 20부터 HARD가 띄엄띄엄, 장마다 끝은 HARD
const CHALLENGE_AT = new Set([10, 14, 36, 46, 56]);
const HARD_AT = new Set([20, 24, 25, 28, 29, 30, 38, 40, 48, 50, 58, 59, 60]);
const routeLevel = k => (HARD_AT.has(k + 1) ? 'hard' : CHALLENGE_AT.has(k + 1) ? 'challenge' : '');

// 깼을 때 쾅 찍히는 말: 스테이지에 done이 있으면 그것, 없으면 첫 목표에 맞춰서
const DONE_WORD = { weed: '제초<br>끝!!', box: '상자<br>다 뜯었다!', bubble: '거품<br>싹싹!', ing: '배달<br>완료!', lock: '리본<br>풀었다!', syrup: '시럽<br>듬뿍!', char: '모으기<br>끝!', score: '목표<br>달성!' };
const doneWord = st => st.done || DONE_WORD[st.goals[0].k] || '클리어!';

const GOAL_ICON = { lock: () => ITEM('ribbon'), syrup: () => ITEM('pancake'), weed: () => ITEM('weed2'), box: () => ITEM('box'), bubble: () => ITEM('bubble'), ing: () => ITEM('ramen'),
  char: g => FACE(g.id), score: () => ITEM('target') };
const GOAL_NAME = { lock: () => '리본', syrup: () => '시럽', weed: () => '잡초', box: () => '상자', bubble: () => '거품', ing: () => '재료', char: g => CHAR_NAME[g.id], score: () => '점수' };

function parseLayout(st) {
  const floor = Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
  const mask = st.map.map(row => [...row].map(ch => ch !== '#'));
  const blocks = [], ings = [], locks = [];
  const syrup = st.goals.some(g => g.k === 'syrup') ? Array.from({ length: ROWS }, () => new Array(COLS).fill(false)) : null;
  let k = 0;
  st.map.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch === 'l') locks.push([r, c]);
    if (ch === 's' && syrup) syrup[r][c] = true;
    if (ch === 'w') blocks.push([r, c, 'weed', 1]);
    if (ch === 'W') blocks.push([r, c, 'weed', 2]);
    if (ch === 'b') blocks.push([r, c, 'box', 1]);
    if (ch === 'g') blocks.push([r, c, 'box', 2]);
    if (ch === 'o') blocks.push([r, c, 'bubble', 1]);
    if (ch === 'i') ings.push([r, c, st.ing.kinds[k++ % st.ing.kinds.length]]);
  }));
  return { floor, mask, blocks, ings, locks, syrup };
}

const MOVE_SVG = '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="15.5" rx="5" ry="4.2"/><circle cx="6" cy="9.5" r="2.1"/><circle cx="10" cy="6" r="2.1"/><circle cx="14" cy="6" r="2.1"/><circle cx="18" cy="9.5" r="2.1"/></svg>';
const L = { st: null, i: 0, moves: 0, time: 0, score: 0, ing: 0, spawned: 0, chars: {}, popped: false, extra: false, timer: null, goalsHtml: '' };

// 판에 재료가 모자라면 위에서 새로 내려보냄
function spawnIng() {
  const { n, max, kinds } = L.st.ing;
  let on = 0;
  Board.each(B.grid, t => { if (t.type === ING) on++; });
  if (L.spawned >= n || on >= max) return null;
  if (on > 0 && Math.random() > 0.15) return null;
  return kinds[L.spawned++ % kinds.length];
}

const Life = {
  hasIng: () => !!L.st?.ing,
  stopTimer() { clearInterval(L.timer); L.timer = null; },

  start(i) { return Life.begin(LIFE[i], { kind: 'route', i }); },

  // run: { kind: 'route', i } 모험 지도 / { kind: 'tower', floor } 인어섬 탐험 / { kind: 'contest' } 제초 대회 / { kind: 'daily' } 오늘의 도전 / { kind: 'dungeon' } 미믹 보물창고
  async begin(st, run) {
    const i = run.i ?? -1;
    Life.stopTimer();
    // 같이 갈 친구 한 명 (인어섬은 1층에서만 고름)
    if (run.kind === 'route' && run.i < 2 && !Save.data.helper) L.helper = CHARS.findIndex(c => c.id === 'hachiware'); // 처음 두 판은 하치와레가 알아서 따라옴
    else if ((run.kind !== 'tower' || run.floor === 1 || L.helper == null) && !(await pickHelper(st))) return go(run.kind === 'route' ? openMap : openChallenge); // 고르다가 돌아가기
    const buddy = !!st.host && CHARS[L.helper]?.id === st.host; // 단짝 보너스
    Object.assign(L, { hg: 0, run, ending: false, st, i, moves: (st.moves || 0) + (buddy && st.moves ? 2 : 0), time: (st.time || 0) + (buddy && st.time ? 6 : 0), score: 0, ing: 0, chars: {}, popped: false, extra: false, cont: false, goalsHtml: '', feverT: 0, feverGift: false });
    Object.assign(B, { mode: 'life', stage: i, over: false, busy: true, inSkill: false, sel: null, pending: [], maxCombo: 0, fever: 0, moving: new Set(), open: false, quick: null, quickSwapped: null });
    B.team = LIFE_CHARS.slice(0, st.types).map(id => CHARS.findIndex(c => c.id === id));
    Object.assign(B, { real: B.team.length, played: false, dmgBy: {} });
    NTYPES = st.types;
    Board.setSize(st.map.length, st.map[0].length); // 판 그림 크기대로 (7x7 ~ 9x9)
    B.grid = null; // 앞 판(크기가 다를 수 있음)은 버림. 남겨 두면 새 크기로 옛 판을 읽다가 멈춤
    const lay = parseLayout(st);
    Board.floor = lay.floor;
    Board.mask = lay.mask;
    Board.syrup = lay.syrup;
    L.spawned = lay.ings.length;
    Board.spawnIng = st.ing ? spawnIng : null;
    app.classList.add('life-mode');
    app.classList.toggle('tower-mode', run.kind === 'tower');
    app.classList.toggle('broth', st.name.includes('국물')); // 국물 판은 시럽 대신 국물 무늬
    updateFever();
    Sound.music('life');
    show('battle');
    stageTitle(run.kind === 'route' ? routeIdx('l', i) : -1, st.name);
    stageBg(run.kind === 'route' ? routeIdx('l', i) : -1);
    $('#waveInfo').innerHTML = '';
    const hc = CHARS[L.helper];
    Sticker.make(artOf(hc.id)); // 스킬 컷인 그림을 미리 구워 둠
    setTimeout(speedLines, 600);
    $('#lhHelper').style.setProperty('--ring', hc.ring);
    $('#lhHelper .pm-face').innerHTML = Meta.figure(hc.id, FACE(hc.id));
    layoutBoard();
    TilePool.reset();
    fx.innerHTML = '';
    Particles.clear();
    boardRand = st.seed ? League.rand(st.seed) : Math.random; // 주간 리그: 그 주 씨앗
    B.grid = Board.create(lay);
    const bowl = run.kind === 'route' ? Ramen.takeLife() : null; // 먹고 온 라멘: 아이템 깔기·이동 더하기
    const boosts = Items.applyBoost(); // 친구 고르는 창에서 켠 시작 아이템
    const help = run.kind === 'route' ? Help.level('l', i) : 0; // 여러 번 막힌 스테이지면 응원 선물 (js/stats.js)
    Help.life(help);
    L.goal0 = st.goals.map(g => Life.remain(g)); // 처음 목표 양 (실패했을 때 얼마나 남았는지 기록하려고)
    if (run.kind === 'route') Stats.start('l', i, help);
    if (run.kind === 'league') League.began();
    renderFloor();
    Life.hud();
    if (run.kind === 'route' && LIFE_STORY[i] && (Save.data.life || [])[i] == null) await playStory(LIFE_STORY[i]);
    await Help.say(help, 'l');
    await dropIn(run.kind === 'route' && routeLevel(routeIdx('l', i)) === 'hard' ? 'HARD!' : st.intro);
    if (bowl) banner(`${bowl.name}!`, 500);
    else if (boosts) banner('시작 아이템!', 500);
    if (buddy) setTimeout(() => banner(`단짝 보너스! ${st.time ? '+6초' : '이동 +2'}`, 450), bowl ? 900 : 0);
    B.busy = false;
    Tutor.onStart();
    Tutor.poke();
    if (st.time) Life.runTimer();
  },

  // 구슬이 터지거나 창이 떠 있는 동안은 시계가 멈춤
  runTimer() {
    Life.stopTimer();
    let last = performance.now();
    L.timer = setInterval(() => {
      const now = performance.now(), dt = (now - last) / 1000;
      last = now;
      if (B.mode !== 'life' || B.over || B.busy || wiping || !$('#battle').classList.contains('active') || $('#modal').classList.contains('show')) return;
      L.time = Math.max(0, L.time - dt);
      if (B.fever) { L.feverT = Math.max(0, L.feverT - dt); if (!L.feverT) B.fever = 0; updateFever(); } // 시간 판 피버는 10초
      Life.hud();
      if (L.time <= 0) Life.check();
    }, 100);
  },

  count(k) {
    let n = 0;
    if (k === 'syrup') { Board.syrup?.forEach((row, r) => row.forEach((v, c) => { if (!v && !hole(r, c)) n++; })); return n; }
    if (k === 'lock') { Board.each(B.grid, t => { if (t.lock) n++; }); return n; }
    Board.each(B.grid, t => { if (t.block === k) n++; });
    return n;
  },
  remain(g) {
    if (g.k === 'ing') return Math.max(0, L.st.ing.n - L.ing);
    if (g.k === 'char') return Math.max(0, g.n - (L.chars[g.id] || 0));
    if (g.k === 'score') return Math.max(0, g.n - L.score);
    return Life.count(g.k);
  },
  done: () => !L.st.contest && !L.st.dungeon && !L.st.league && L.st.goals.every(g => Life.remain(g) === 0),

  hud() {
    const st = L.st;
    $('#lhLimitLabel').innerHTML = st.time ? `<img src="${ITEM('timer')}">` : MOVE_SVG;
    $('#lhLimit').textContent = st.time ? Math.ceil(L.time) : L.moves;
    $('.lh-limit').classList.toggle('danger', st.time ? L.time <= 10 : L.moves <= 3);
    const html = st.contest ? `<div class="gchip best"><img src="${ITEM('medal')}"><b>${Save.data.contestBest || 0}</b></div>`
      : st.dungeon ? Dungeon.chip() : st.league ? League.chip(L.score) : st.goals.map(g => {
      const n = Life.remain(g);
      return `<div class="gchip ${g.k}${n ? '' : ' done'}" data-id="${g.id || ''}"><img src="${GOAL_ICON[g.k](g)}"><b>${n || '<img class="ck" src="assets/img/ui/check.png" alt="">'}</b></div>`;
    }).join('');
    if (st.league) League.watch(L.score);
    if (html !== L.goalsHtml) {
      const was = L.goalsHtml;
      $('#lhGoals').innerHTML = L.goalsHtml = html;
      if (was) $('#lhHelper').animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-10px) rotate(-4deg)' }, { transform: 'none' }], { duration: 300 });
      if (!st.contest) st.goals.forEach((g, k) => {
        const n = Life.remain(g), before = (L.prevRemain || [])[k];
        if (n === 0 && before > 0) Life.goalDone($('#lhGoals').children[k]);
      });
    }
    if (!st.contest) L.prevRemain = st.goals.map(g => Life.remain(g));
    const top = st.stars[2] * 1.12;
    $('#lhScore .fill').style.width = Math.min(1, L.score / top) * 100 + '%';
    [...$('#lhScore .bar').querySelectorAll('i')].forEach((m, k) => {
      m.style.left = (st.stars[k] / top) * 100 + '%';
      m.classList.toggle('on', L.score >= st.stars[k]);
    });
    $('#lhScore b').textContent = L.score;
    const need = skillNeed(CHARS[L.helper].id);
    setGauge($('#lhHelper'), Math.min(1, L.hg / need), L.hg >= need);
  },

  onStep(res, combo) {
    const pts = Math.round((res.cleared.length * 20 * combo + res.created.length * 100 + res.hits.length * 50 + res.weeds.length * 60 +
      res.unlocked.length * 60 + res.syrup.length * 40) * (B.fever ? 1.5 : 1)); // 피버 중 ×1.5
    res.cleared.forEach(({ tile }) => {
      // 데려간 친구 얼굴이면 게이지 1, 다른 얼굴은 1/3
      if (!B.inSkill) L.hg += tile.type >= 0 && B.team[tile.type] === L.helper ? 1 : 1 / 3;
      if (tile.type < 0) return;
      const id = teamCh(tile.type).id;
      L.chars[id] = (L.chars[id] || 0) + 1;
    });
    if (res.hits.some(h => h.tile.block === 'bubble')) L.popped = true;
    if (L.st.dungeon) Dungeon.loot(res);
    L.score += pts;
    // 터진 자리 한가운데에 점수가 톡 (콤보일수록 크게)
    if (pts && res.cleared.length) {
      const cx = res.cleared.reduce((a, x) => a + x.c, 0) / res.cleared.length, cy = res.cleared.reduce((a, x) => a + x.r, 0) / res.cleared.length;
      const b = boardEl.getBoundingClientRect(), a = app.getBoundingClientRect();
      setTimeout(() => floatNum(b.left - a.left + (cx + 0.5) * B.S, b.top - a.top + (cy + 0.5) * B.S, '+' + pts, combo > 1 ? '#ff5d9e' : '#ffb020', combo > 2 ? 'crit' : ''), 160);
    }
    Life.hud();
  },

  // 바닥에 닿은 재료를 라면 그릇으로 휙
  async collect() {
    for (;;) {
      const got = Board.collectIngs(B.grid);
      if (!got.length) return;
      const to = centerOf($('#lhGoals .ing') || $('#lhGoals'));
      await Promise.all(got.map(({ r, c, tile }, i) => {
        const p = tileCenter(r, c);
        TilePool.put(tile);
        Sound.play('star', 1.2 + i * 0.1, 0.8);
        burst(p.x, p.y, '#ffd84d', 10);
        const im = new Image();
        im.src = ITEM(tile.ing);
        im.className = 'fximg';
        Object.assign(im.style, { left: p.x + 'px', top: p.y + 'px', width: B.S + 'px' });
        fx.appendChild(im);
        const dx = to.x - p.x, dy = to.y - p.y;
        return im.animate([
          { transform: 'translate(-50%,-50%) scale(1)' },
          { transform: `translate(calc(-50% + ${dx * 0.3}px), calc(-50% + ${dy * 0.3 - 80}px)) scale(1.5)`, offset: 0.4 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.6)` },
        ], { duration: 650, easing: 'ease-in-out' }).finished.then(() => {
          im.remove();
          L.ing++;
          L.score += 500;
          Life.hud();
          Sound.play('heal', 1.3, 0.7);
        });
      }));
      await fall(Board.gravity(B.grid));
    }
  },

  async endTurn() {
    Stats.turn();
    if (!L.st.time) L.moves--;
    if (B.fever && !L.st.time) { B.fever--; updateFever(); }
    // 거품을 하나도 못 터뜨린 턴에는 거품이 번짐
    if (!L.popped && Life.count('bubble') && !Life.done()) {
      const s = Board.spreadBubble(B.grid);
      if (s) {
        popTile(s.old, 0);
        makeTile(s.tile);
        place(s.tile, s.r, s.c);
        s.tile.inner.animate([{ transform: 'scale(0)' }, { transform: 'scale(1.25)', offset: 0.6 }, { transform: 'scale(1)' }], { duration: 360, easing: 'ease-out' });
        Sound.play('pop', 0.7, 0.8);
        const p = tileCenter(s.r, s.c);
        burst(p.x, p.y, '#9fdcff', 6);
        await sleep(380);
        await cascade(null, []); // 수가 없어졌으면 섞기
      }
    }
    L.popped = false;
    if (L.st.contest && !Life.count('weed')) await Life.regrow();
    if (L.st.dungeon && !Life.count('box') && L.moves > 0) await Dungeon.refill();
    Life.hud();
    await Life.check();
  },

  // 피버 선물: 구슬 하나가 반짝 하고 아이템으로 바뀜 (터지지는 않고 그대로 둠)
  async feverGift() {
    const [rc] = pickTiles(1, t => !t.special && t.type >= 0 && !t.lock);
    if (!rc) return;
    const t = B.grid[rc[0]][rc[1]], p = tileCenter(rc[0], rc[1]);
    t.special = ['h', 'v', 'bomb', 'plane'][Math.floor(boardRand() * 4)];
    t.type = -1;
    refreshTile(t);
    t.inner.animate([{ transform: 'scale(0) rotate(-180deg)' }, { transform: 'scale(1.4)', offset: 0.6 }, { transform: 'scale(1)' }], { duration: 420 });
    kp('light_02', p.x, p.y, B.S * 3, '#fff6c8', [{ transform: 'scale(.2)', opacity: 1 }, { transform: 'scale(1)', opacity: 0 }], { duration: 360, easing: 'ease-out' });
    burst(p.x, p.y, '#ff8ab8', 10);
    floatNum(p.x, p.y - B.S * 0.4, '선물!', '#ff5d9e');
    Sound.play('special', 1.2, 0.9);
    await sleep(450);
  },

  // 제초 대회: 잡초를 다 뽑으면 보너스와 함께 여기저기 새로 돋아남
  async regrow() {
    L.score += 2000;
    Sound.play('special', 1, 0.9);
    banner('+2000', 450);
    const sprouts = Board.dropBlocks(B.grid, 8, 'weed', Math.random() < 0.3 ? 2 : 1);
    sprouts.forEach(({ r, c, old, tile }, k) => setTimeout(() => {
      popTile(old, 0);
      makeTile(tile);
      place(tile, r, c);
      tile.inner.animate([{ transform: 'scale(0) translateY(30%)' }, { transform: 'scale(1.2)', offset: 0.6 }, { transform: 'scale(1)' }], { duration: 320, easing: 'ease-out' });
    }, k * 50));
    await sleep(500);
    if (!Board.hasMove(B.grid)) await cascade(null, []);
  },

  async check() {
    if (B.over || L.ending) return;
    if (L.st.contest) { if (L.time <= 0) return Life.contestEnd(); return; }
    if (L.st.dungeon) { if (L.moves <= 0) return Dungeon.end(); return; }
    if (L.st.league) { if (L.moves <= 0) return League.end(); return; }
    if (Life.done()) { L.ending = true; return Life.win(); }
    if (L.st.time ? L.time <= 0 : L.moves <= 0) return Life.fail();
  },

  // 목표 하나 끝: 칩이 통 부풀고 초록 체크가 쾅 + 반짝
  goalDone(chip) {
    if (!chip) return;
    const c = centerOf(chip);
    chip.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.5) rotate(-8deg)', filter: 'brightness(1.4)', offset: 0.45 }, { transform: 'scale(.92)', offset: 0.75 }, { transform: 'scale(1)' }], { duration: 520, easing: 'ease-out' });
    const ck = addFx('goal-check', c.x, c.y);
    ck.innerHTML = '<img src="assets/img/ui/check.png" alt="">';
    ck.animate([{ transform: 'translate(-50%,-50%) scale(2.6) rotate(-20deg)', opacity: 0 }, { transform: 'translate(-50%,-50%) scale(.9) rotate(0)', opacity: 1, offset: 0.55 }, { transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: 0.8 }, { transform: 'translate(-50%,-70%) scale(1)', opacity: 0 }],
      { duration: 900, easing: 'ease-out' }).finished.then(() => ck.remove());
    kx('explosion01', 'star_09', c.x, c.y, B.S * 2.4, '#7be0a0', [{ transform: 'scale(.2)', opacity: 1 }, { transform: 'scale(1.1) rotate(30deg)', opacity: 0 }], { duration: 420, easing: 'ease-out' });
    burst(c.x, c.y, '#7be0a0', 12);
    Sound.play('star', 1.25, 0.9);
    Sound.play('sparkle', 1.3, 0.6);
    Haptic.tap(25);
  },

  // 모든 목표 완료: 띠가 쓱 들어오고 이번 판 친구가 반가워함
  async allDone() {
    const el = document.createElement('div');
    el.className = 'goal-strip';
    el.innerHTML = `<img src="${art(L.st.host || 'chiikawa')}"><span>${L.st.exam ? '합격 점수!' : '모든 목표 완료!'}</span>`;
    app.appendChild(el);
    Sound.play('jingle_win', 1.1, 0.8);
    Haptic.tap(30);
    const [img] = el.children;
    el.animate([{ transform: 'translateX(-110%) skewX(-8deg)' }, { transform: 'translateX(3%) skewX(-8deg)', offset: 0.7 }, { transform: 'translateX(0) skewX(-8deg)' }], { duration: 360, easing: 'ease-out', fill: 'backwards' });
    img.animate([{ transform: 'translateY(40%) rotate(-10deg)' }, { transform: 'translateY(-8%) rotate(4deg)', offset: 0.7 }, { transform: 'none' }], { duration: 420, delay: 180, easing: 'ease-out', fill: 'backwards' });
    confetti(12);
    await sleep(1150);
    await el.animate([{ transform: 'translateX(0) skewX(-8deg)', opacity: 1 }, { transform: 'translateX(110%) skewX(-8deg)', opacity: 0 }], { duration: 260, easing: 'ease-in', fill: 'forwards' }).finished;
    el.remove();
  },

  // 남은 이동(시간 3초마다)을 아이템(줄폭탄 50%, 폭탄 30%, 종이비행기 20%)으로 바꿔 한꺼번에 터뜨림. 칸마다 +150
  // 로켓은 0.11초 간격으로 겹쳐 날아가고, 화면을 한 번 누르면 남은 칸은 바로 바뀜
  async bonus() {
    const left = () => (L.st.time ? Math.floor(L.time / 3) : L.moves);
    if (left() <= 0) return;
    banner('보너스 타임!', 500);
    await sleep(600);
    const cells = pickTiles(Math.min(left(), 10));
    const from = centerOf($('.lh-limit'));
    let skip = false, skipNow;
    const tapped = new Promise(ok => (skipNow = ok));
    const onTap = () => { skip = true; skipNow(); };
    window.addEventListener('pointerdown', onTap, { capture: true });
    const done = new Set();
    const kind = () => { const x = Math.random(); return x < 0.5 ? (Math.random() < 0.5 ? 'h' : 'v') : x < 0.8 ? 'bomb' : 'plane'; };
    // 로켓이 꽂힌 칸을 줄폭탄으로 (건너뛰기와 겹쳐도 한 번만)
    const make = (r, c, i) => {
      if (done.has(r * 100 + c)) return;
      done.add(r * 100 + c);
      const t = B.grid[r][c];
      t.special = kind();
      t.type = -1;
      refreshTile(t);
      squish(t);
      const p = tileCenter(r, c);
      burst(p.x, p.y, '#ffffff', 6);
      L.score += 150;
      floatNum(p.x, p.y, '+150', '#e07b39');
      Sound.pop(Math.min(i, 11));
      if (L.st.time) L.time = Math.max(0, L.time - 3); else L.moves--;
      Life.hud();
    };
    const flights = [];
    for (const [i, [r, c]] of cells.entries()) {
      if (skip) break;
      flights.push(flyTile(ITEM('rocket'), from, tileCenter(r, c), 0, '#bfe9ff', () => make(r, c, i)));
      await sleep(110);
    }
    // 다 날아갈 때까지 기다리다가, 그 사이 누르면 바로 다 바꿈
    await Promise.race([Promise.all(flights), tapped]);
    window.removeEventListener('pointerdown', onTap, { capture: true });
    cells.forEach(([r, c], i) => make(r, c, i));
    await sleep(skip ? 120 : 200);
    const rest = left();
    // 한꺼번에 다 터뜨리면 버벅이고 맛이 없어서: 두 개씩 차례로 펑. 그 사이 누르면 남은 걸 한 번에
    const items = cells.map(([r, c]) => B.grid[r][c]);
    const where = t => { let at = null; Board.each(B.grid, (x, r, c) => { if (x === t) at = [r, c]; }); return at; };
    const onTap2 = () => (skip = true);
    window.addEventListener('pointerdown', onTap2, { capture: true });
    while (items.length) {
      const batch = items.splice(0, skip ? items.length : 2).map(where).filter(p => p && B.grid[p[0]][p[1]]?.special);
      if (batch.length) await cascade(null, batch);
    }
    window.removeEventListener('pointerdown', onTap2, { capture: true });
    if (rest > 0) {
      L.score += rest * 500;
      if (L.st.time) L.time = 0; else L.moves = 0;
      const c = centerOf($('#lhScore'));
      floatNum(c.x, c.y, `+${rest * 500}`, '#e07b39', 'crit');
    }
    Life.hud();
    await sleep(400);
  },

  // 남은 목표 비율(%): 목표마다 남은 비율의 평균 (실패 기록용)
  leftPct: () => Math.round((100 * L.st.goals.reduce((a, g, k) => a + Life.remain(g) / Math.max(1, L.goal0?.[k] || 1), 0)) / Math.max(1, L.st.goals.length)),

  async win() {
    const left = L.st.time ? Math.ceil(L.time) : L.moves; // 보너스 타임 전 남은 이동(초)
    // 보너스 타임이 끝날 때까지는 over를 세우지 않음 (그 사이 뒤로 가기로 판이 바뀌지 않게)
    B.busy = true;
    Life.stopTimer();
    clearSel();
    await Life.allDone();
    await Life.bonus();
    B.over = true;
    if (L.run.kind === 'tower') return Tower.cleared();
    if (L.run.kind === 'daily') return DayChal.cleared();
    const st = L.st, i = L.i;
    const stars = L.score >= st.stars[2] ? 3 : L.score >= st.stars[1] ? 2 : 1;
    if (L.run.kind === 'route') Stats.end('clear', { stars, moves_left: left });
    const list = (Save.data.life = Save.data.life || []);
    const first = list[i] == null;
    const coins = Meta.reward(stars, first), treat = Meta.treat('l', i, stars, first);
    if (L.run.kind === 'route') { Daily.add('win'); Aff.afterWin([CHARS[L.helper].id]); }
    list[i] = Math.max(list[i] || 0, stars);
    setTimeout(() => Net.submit(), 0);
    if (first) Save.data.ramen = true;
    Save.save();
    const rank = first && L.run.kind === 'route' && Net.clearRank();
    Sound.play('win', 1);
    await clearShow(st.exam ? '검정<br>합격!' : doneWord(st));
    const k = routeIdx('l', i), last = k === ROUTE.length - 1;
    if (LIFE_STORY_AFTER[i] && first) await playStory(LIFE_STORY_AFTER[i]); // 장 끝 대사
    if (first) await Meta.stageJoin('l', i);
    Sound.music(null);
    const ch = mvp(), shard = first && L.run.kind === 'route' && Meta.shardGift(ch.id, stars);
    if (L.run.kind === 'route') Share.prepare({ k, name: st.name, stars, mode: 'l', char: ch.id, rows: [['점수', L.score]] });
    modal({
      share: L.run.kind === 'route',
      title: st.exam ? '합격!' : '클리어!', stars, char: ch.id, text: `${ch.name}: "${lineOf(ch.id)}"`,
      rows: [['점수', L.score], [`<img class="row-ic" src="${ITEM('coin')}">`, '+' + coins], treat, shard].filter(Boolean),
      btn2: '🏠 지도로', on2: () => go(() => openMap(first ? k : null)),
      btn1: last ? '🏠 지도로' : Unlock.fresh() ? '🎁 새 기능 보러 가기' : '다음 스테이지 ▶', // 새 기능이 열렸으면 지도로 데려가서 안내
      on1: () => (last || Unlock.fresh() ? go(() => openMap(first ? k : null)) : Hearts.need(() => go(() => goRoute(k + 1)), () => go(() => openMap(first ? k : null)))),
    });
    Net.rankLine(rank);
  },

  async fail() {
    B.over = true;
    B.busy = true;
    Life.stopTimer();
    clearSel();
    Sound.music(null);
    Sound.play('jingle_lose', 1, 0.9);
    await banner(L.st.time ? '시간 끝…' : '이동 끝…', 600);
    if (L.run.kind === 'tower' && L.extra) return Tower.over();
    // 모험 지도 스테이지를 포기하면 하트 하나
    const route = L.run.kind === 'route';
    const lost = () => route && Stats.end('fail', { goals_left: Life.leftPct() });
    const retry = () => {
      if (!route) return go(() => (L.run.kind === 'tower' ? Tower.over() : L.run.kind === 'daily' ? DayChal.start() : Life.start(L.i)));
      lost();
      Hearts.lose();
      Hearts.need(() => go(() => Life.start(L.i)), () => go(openMap));
    };
    // 못 모은 목표를 아이콘과 남은 수로 (결과 창처럼)
    const left = L.st.goals.filter(g => Life.remain(g) > 0).slice(0, 3).map(g => [`<img class="row-ic" src="${GOAL_ICON[g.k](g)}">`, Life.remain(g)]);
    const card = { title: L.st.exam ? '불합격…' : '실패…', stars: 0, img: 'assets/img/art/scene_crying.jpg', photo: true, rows: left };
    const have = Items.n('cont') > 0; // 공짜 한 번을 쓴 뒤엔 이어하기권(없으면 그 자리에서 코인으로), 스테이지마다 한 번
    const ticket = L.extra && L.run.kind !== 'tower' && !L.cont && (have || Save.data.coins >= itemPrice('cont'));
    if (!L.extra || ticket) {
      modal({
        ...card, text: ticket ? `이어하기${have ? '권으로' : '로'} ${L.st.time ? '15초' : '5번'} 더 해 볼까요?` : `조금만 더! ${L.st.time ? '15초' : '5번'} 더 해 볼까요?`,
        btn1: ticket ? (have ? `이어하기권 쓰기 (${Items.n('cont')})` : `이어하기 (코인 ${itemPrice('cont')})`) : L.st.time ? '+15초 더!' : '+5번 더!',
        on1: () => {
          if (route) Stats.cont(ticket ? (have ? 'ticket' : 'coins') : 'free');
          if (ticket) { if (have) Items.use('cont'); else Meta.addCoins(-itemPrice('cont')); L.cont = true; }
          L.extra = true;
          if (L.st.time) L.time += 15; else L.moves += 5;
          B.over = false;
          B.busy = false;
          Life.hud();
          Sound.music('life');
          if (L.st.time) Life.runTimer();
        },
        btn2: L.run.kind === 'tower' ? '여기까지' : '다시 하기', on2: retry,
      });
    } else {
      modal({ ...card, text: '아깝다! 다음엔 꼭 깰 수 있어', rows: route ? [...left, [`<img class="row-ic" src="${ITEM('heart')}">`, '-1']] : left, btn1: '다시 하기', on1: retry, btn2: '🏠 지도로', on2: () => { lost(); if (route) Hearts.lose(); go(route ? openMap : openChallenge); } });
    }
  },
};

// ---------- 인어섬 탐험: 끝없이 올라가는 층 (무한 모드) ----------
// 층마다 일상 퍼즐 하나를 골라 이동 수를 줄여 가며 어렵게. 실패하면 거기까지 (+5번은 층마다 한 번)
const Tower = {
  stage(floor) {
    const pool = LIFE.filter(s => !s.exam && !s.contest);
    const base = pool[Math.floor(Math.random() * pool.length)];
    const st = JSON.parse(JSON.stringify(base));
    st.name = `인어섬 ${floor}층`;
    st.intro = `${floor}층!`;
    st.types = floor >= 12 ? 6 : 5;
    st.moves = Math.max(12, Math.round(base.moves * (1 - Math.min(0.35, floor * 0.02))));
    return st;
  },
  start(floor = 1) {
    if (floor === 1) Tower.coins = 0;
    return Life.begin(Tower.stage(floor), { kind: 'tower', floor });
  },
  async cleared() {
    const f = L.run.floor;
    Daily.add('tower');
    const c = 20 + f * 2;
    Tower.coins += c;
    Meta.addCoins(c);
    Save.data.towerBest = Math.max(Save.data.towerBest || 0, f);
    Save.save();
    Net.submit();
    Sound.play('win', 1.1);
    confetti(14);
    await banner(`${f}층 클리어!`, 700);
    go(() => Tower.start(f + 1));
  },
  over() {
    const f = L.run.floor - 1;
    Sound.music(null);
    Net.submit();
    modal({
      title: '탐험 끝!', char: 'hachiware', text: f ? `하치와레: "${f}층까지 왔다는 거야!? 대단해~!"` : '하치와레: "다음엔 어떻게든 더 높이 가 보자~!"',
      rows: [['오른 층', f], ['최고 기록', Save.data.towerBest || 0], [`<img class="row-ic" src="${ITEM('coin')}">`, '+' + (Tower.coins || 0)]],
      btn2: '나가기', on2: () => go(openChallenge),
      btn1: '다시 도전', on1: () => go(() => Tower.start(1)),
    });
  },
};

// ---------- 제초 대회: 60초 동안 최대한 높은 점수 ----------
const CONTEST = { name: '제초 대회', icon: 'medal', types: 5, time: 60, host: 'usagi', contest: true, intro: '60초! 최대한 많이!',
  goals: [], stars: [8000, 15000, 25000], map: ['.......', '.w...w.', '...w...', '.w...w.', '...w...', '.w...w.', '.......'] };
Life.contestEnd = async function () {
  B.over = true;
  B.busy = true;
  Life.stopTimer();
  clearSel();
  Sound.music(null);
  Sound.play('jingle_win', 1, 0.9);
  await banner('제초 대회 끝!!', 700);
  const best = Save.data.contestBest || 0, isBest = L.score > best;
  Save.data.contestBest = Math.max(best, L.score);
  const coins = Math.floor(L.score / 250);
  Meta.addCoins(coins);
  Save.save();
  Net.submit();
  if (isBest) confetti(20);
  modal({
    title: isBest ? '최고 기록!' : '제초 대회 끝!', char: 'usagi', text: isBest ? '우사기: "우라~!!"' : '우사기: "하아?! 푸루야!!"',
    rows: [['점수', L.score], ['최고', Save.data.contestBest], [`<img class="row-ic" src="${ITEM('coin')}">`, '+' + coins]],
    btn2: '나가기', on2: () => go(openChallenge),
    btn1: '다시 도전', on1: () => go(() => Life.begin(CONTEST, { kind: 'contest' })),
  });
};

// ---------- 같이 갈 친구 고르기 (일상 퍼즐은 한 명만) ----------
function pickHelper(st = L.st) {
  return new Promise(done => {
    const list = CHARS.map((c, k) => [c, k]).filter(([c]) => Meta.owned(c.id));
    const host = st?.host ? CHARS[charIdx(st.host)] : null;
    let pick = L.helper != null && Meta.owned(CHARS[L.helper].id) ? L.helper : CHARS.findIndex(c => c.id === (Save.data.helper || 'hachiware'));
    if (pick < 0 || !Meta.owned(CHARS[pick].id)) pick = list[0][1];
    const card = $('#charSheet .sheet-card');
    L.boost = new Set(); // 이번 판에 쓸 시작 아이템
    const draw = () => {
      const ch = CHARS[pick];
      card.style.setProperty('--ring', ch.ring);
      card.innerHTML = `<div class="mates-title">같이 갈 친구 한 명</div>
        <div class="helper-pick"><span class="fig">${Meta.figure(ch.id, art(ch.id))}</span><div><b>${ch.name}</b><small>${skillOf(ch.id).name}</small><p>${skillOf(ch.id).desc}</p></div></div>
        ${host ? `<div class="buddy-note${CHARS[pick].id === st.host ? ' on' : ''}"><img class="bn-face" src="${FACE(host.id)}" alt="">이 스테이지 단짝: <b>${host.name}</b> · 데려가면 ${st.time ? '+6초' : '이동 +2'}${Meta.owned(host.id) ? '' : ' (아직 없는 친구)'}</div>` : ''}
        ${st?.league ? '<div class="buddy-note">주간 리그는 모두 같은 판이라 시작 아이템 없이 겨뤄요</div>' : `<div class="boost-row"><span>시작 아이템</span>${SHOP_ITEMS.filter(it => it.put).map(it => `<button data-bo="${it.id}" class="${L.boost.has(it.id) ? 'on' : ''}"><img src="${ITEM(it.icon)}" alt="">${Items.n(it.id) ? `<i>${Items.n(it.id)}</i>` : `<i class="price"><img src="${ITEM('coin')}" alt="">${it.price}</i>`}</button>`).join('')}</div>`}
        <div class="mates-grid">${list.map(([c, k]) => `<button class="${k === pick ? 'on' : ''}${c.id === st?.host ? ' buddy' : ''}" data-k="${k}" style="--ring:${c.ring}"><img src="${FACE(c.id)}"><span>${c.name}</span></button>`).join('')}</div>
        <div class="sheet-btns"><button class="big-btn ghost" data-back><img class="b-ic" src="assets/img/ui/back.png" alt="">돌아가기</button><button class="big-btn" data-go>같이 가자!</button></div>`;
      card.querySelectorAll('.mates-grid button').forEach(b => (b.onclick = () => { pick = +b.dataset.k; Sound.play('pop', 1.2, 0.5); draw(); }));
      card.querySelectorAll('[data-bo]').forEach(b => (b.onclick = () => {
        const id = b.dataset.bo, it = SHOP_ITEMS.find(x => x.id === id);
        if (L.boost.has(id)) L.boost.delete(id);
        else {
          if (!Items.n(id)) { // 없으면 그 자리에서 코인으로 사서 켬 (끄면 사 둔 걸로 남음)
            if (Save.data.coins < it.price) { Sound.play('bad'); const c = centerOf(b); floatNum(c.x, c.y - 24, '코인이 모자라요', '#e2543f'); return; }
            Meta.addCoins(-it.price);
            Items.add(id);
          }
          L.boost.add(id);
        }
        Sound.play('pop', 1.4, 0.5);
        draw();
      }));
      card.querySelector('[data-go]').onclick = () => {
        L.helper = pick;
        Save.data.helper = CHARS[pick].id;
        Save.save();
        Sound.voice(CHARS[pick].id, 'pick') || Sound.play('click');
        $('#charSheet').classList.remove('show');
        done(true);
      };
      card.querySelector('[data-back]').onclick = () => { Sound.play('click'); $('#charSheet').classList.remove('show'); done(false); };
    };
    draw();
    $('#charSheet').classList.add('show');
    fitText($('#charSheet'));
  });
}
$('#lhHelper').onclick = () => useSkill(0);
