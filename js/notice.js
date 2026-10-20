// 공지사항(업데이트 노트)과 홈 화면에 추가 안내
// - 공지: 지도 왼쪽 '공지' 버튼. 새 글이 있으면 빨간 점, 이미 하던 사람에게는 새 글이 올라오면 지도에서 한 번 열어 줌
//   새 업데이트를 올릴 땐 NOTICES 맨 위에 하나 추가 (id가 바뀌면 새 글로 침)
// - 홈 화면 추가: 9판을 깨면 한 번 (8판 가게·10판 도전 안내와 안 겹치게). 이미 앱으로 켰으면 안 띄움. 설정에도 '앱처럼 쓰기'
const NOTICES = [
  {
    id: '2026-10-20f', date: '10월 20일', title: '끊김 잡기!',
    items: [
      '스킬을 여러 번 써도 덜 끊기게 고쳤어요 (컷인 집중선·띠·테두리를 폰이 쉽게 그리는 방식으로)',
      '터진 칸을 새로 만들지 않고 다시 써서, 연쇄가 이어질 때 더 매끄러워요',
      '쾅 할 때 화면이 커지던 연출과 순간 멈칫을 빼서 뚝뚝 끊기는 느낌이 줄었어요',
      '콤보 5에 피버가 떠도 연쇄가 멈추지 않고 계속 이어져요',
    ],
  },
  {
    id: '2026-10-20e', date: '10월 20일', title: '주간 리그 개막!',
    items: [
      '도전 화면에 주간 리그가 생겼어요. 일주일 동안 모두 같은 판으로 점수를 겨뤄요 (하루 5판)',
      '처음 깔리는 블록도, 떨어지는 블록도 모두 같아요. 같은 수를 두면 같은 블록이 떨어져요',
      '판 중에는 바로 위 순위 점수가 보이고, 넘기면 추월!',
      '매주 월요일 0시에 새 판, 지난주 순위대로 코인 보상 (1위 1000코인)',
      '설정에서 스킬 연출을 끌 수 있어요. 끄면 컷인 없이 바로 스킬이 나가요',
    ],
  },
  {
    id: '2026-10-20d', date: '10월 20일', title: '빨리 켜지고, 자랑도 하고!',
    items: [
      '처음 켤 때 받는 양을 1/3로 줄여서 훨씬 빨리 떠요',
      '스테이지를 깨면 결과 창의 자랑하기로 클리어 카드를 카톡·인스타에 보낼 수 있어요',
      '같은 스테이지에서 여러 번 막히면 하치와레가 응원 선물을 챙겨 와요',
    ],
  },
  {
    id: '2026-10-20c', date: '10월 20일', title: '더 부드럽고 찰지게!',
    items: [
      '아이템이 여러 개 터질 때 덜 끊기게 고쳤어요. 폰이 힘들어하면 연출을 알아서 가볍게 바꿔요',
      '연쇄 폭발이 따-따-딴! 하나씩 박자 맞춰 터져요',
      '랏코 검과 랏코 스킬이 쓱싹 베는 연출로 바뀌었어요',
      '얼굴이 더 빨리, 쫀득하게 떨어져요',
      '시럽·국물이 칸마다 끊기지 않고 한 덩어리로 이어져요',
      '공지사항 탭이 생겼어요. 홈 화면에 추가하면 앱처럼 쓸 수 있어요',
    ],
  },
  {
    id: '2026-10-20', date: '10월 20일', title: '지역·괴물·가게 대개편',
    items: [
      '모험 지도가 10개 지역으로! 지역마다 풍경이 판 뒤에 깔려요',
      '괴물이 둘·셋씩 나오고, 괴물마다 특수 공격(잠·독·어둠·거품…)이 생겼어요',
      '라멘 가게: 포장 코너(시작 아이템·이어하기권·도시락)와 수련(영구 강화)',
      '집 꾸미기: 가구를 끌어서 옮기고 벽지·바닥도 바꿀 수 있어요',
      '업적·칭호·프사, 뽑기 위시 친구가 생겼어요',
    ],
  },
  {
    id: '2026-10-19', date: '10월 19일', title: '스테이지 300개!',
    items: [
      '7장~30장이 열렸어요. 라멘 가게, 여름 축제, 마법소녀, 산타의 밤… 토벌 대축제까지 300스테이지',
      '뒤로 갈수록 어려워져요. 친구를 강화하고 스킬을 골라 도전해 보세요',
      '12스테이지를 깨면 설문이 떠요. 의견은 설정 → 의견 보내기로도 보낼 수 있어요',
      '스페셜 코스튬(마법소녀·산타·가리비), 진짜 배경음악, 간식 창고가 생겼어요',
    ],
  },
];

const Notice = {
  latest: () => NOTICES[0].id,
  unread: () => (Save.data.noticeSeen || '') < Notice.latest(),
  dot() { document.getElementById('btnNotice')?.classList.toggle('new', Notice.unread()); },
  // 이미 하던 사람에게 새 글이 올라왔으면 지도에서 한 번 열어 줌 (처음 하는 사람은 빨간 점만)
  dueAuto: () => Notice.unread() && Save.data.noticeSeen != null,
  open() {
    return new Promise(done => {
      const card = $('#charSheet .sheet-card');
      card.style.setProperty('--ring', '#ff8ab8');
      card.innerHTML = `<div class="mates-title">공지사항</div>
        <div class="notice-list">${NOTICES.map((n, i) => `<section class="notice${i ? '' : ' first'}"><h3>${n.title}<small>${n.date}</small></h3><ul>${n.items.map(t => `<li>${t}</li>`).join('')}</ul></section>`).join('')}</div>
        <div class="sheet-btns"><button class="big-btn" data-go>확인</button></div>`;
      card.querySelector('[data-go]').onclick = () => { Sound.play('click'); $('#charSheet').classList.remove('show'); done(); };
      Save.data.noticeSeen = Notice.latest();
      Save.save();
      Notice.dot();
      $('#charSheet').classList.add('show');
      fitText($('#charSheet'));
    });
  },
};
// 예전에 하던 사람(깬 판이 있음)은 이번 공지부터 새 글로 보이게, 처음 하는 사람은 지금 공지까지 읽은 걸로 치지 않고 빨간 점만
if (Save.data.noticeSeen == null && clearedCount() > 0) Save.data.noticeSeen = '';
$('#btnNotice').onclick = () => { Sound.play('click'); Notice.open(); };
Notice.dot();

// ---------- 홈 화면에 추가 (앱처럼 쓰기) ----------
const Install = {
  AT: 9,
  deferred: null, // 안드로이드 크롬: 설치 창을 바로 띄울 수 있는 이벤트
  standalone: () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true,
  // 기기와 브라우저 알아보기
  kind() {
    const ua = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const inApp = /KAKAOTALK|NAVER|Instagram|FBAN|FBAV|Line\/|DaumApps|everytimeApp/i.test(ua);
    if (ios) return inApp ? 'ios-inapp' : /CriOS|FxiOS|EdgiOS|Whale/.test(ua) ? 'ios-other' : 'ios';
    if (/Android/.test(ua)) return inApp ? 'android-inapp' : /SamsungBrowser/.test(ua) ? 'samsung' : 'android';
    return 'desktop';
  },
  due() {
    return !Install.standalone() && Install.kind() !== 'desktop' && !Tutor.seen('a2hs') && clearedCount() >= Install.AT;
  },
  steps(k) {
    const S = {
      ios: ['아래쪽 <b>공유 버튼</b>(네모에서 화살표가 위로 나온 모양)을 눌러요', '목록을 올려서 <b>홈 화면에 추가</b>를 눌러요', '오른쪽 위 <b>추가</b>를 누르면 끝!'],
      'ios-other': ['주소창 옆 <b>공유 버튼</b>을 눌러요', '<b>홈 화면에 추가</b>를 눌러요 (안 보이면 사파리로 열어서 해 주세요)', '<b>추가</b>를 누르면 끝!'],
      'ios-inapp': ['오른쪽 아래(또는 위) <b>⋯</b> 메뉴에서 <b>사파리로 열기</b>를 눌러요', '사파리 아래쪽 <b>공유 버튼</b> → <b>홈 화면에 추가</b>', '<b>추가</b>를 누르면 끝!'],
      samsung: ['아래쪽 <b>≡ 메뉴</b>를 눌러요', '<b>현재 페이지 추가</b> → <b>홈 화면</b>을 눌러요', '<b>추가</b>를 누르면 끝!'],
      android: ['오른쪽 위 <b>⋮ 메뉴</b>를 눌러요', '<b>홈 화면에 추가</b>(또는 <b>앱 설치</b>)를 눌러요', '<b>설치</b>나 <b>추가</b>를 누르면 끝!'],
      'android-inapp': ['오른쪽 위 <b>⋮</b> 메뉴에서 <b>다른 브라우저로 열기</b>(크롬·삼성 인터넷)를 눌러요', '그 브라우저 메뉴에서 <b>홈 화면에 추가</b>', '<b>추가</b>를 누르면 끝!'],
    };
    return S[k] || S.android;
  },
  open(from = 'auto') {
    if (from === 'auto') Tutor.mark('a2hs');
    return new Promise(done => {
      const k = Install.kind(), card = $('#charSheet .sheet-card');
      const can = !!Install.deferred; // 크롬이면 버튼 하나로 설치
      card.style.setProperty('--ring', '#4f93dc');
      card.innerHTML = `<div class="mates-title">앱처럼 쓰기</div>
        <div class="helper-pick"><span class="fig"><img src="${artOf('hachiware')}" draggable="false"></span><div><b>하치와레</b><p>홈 화면에 추가하면 주소창 없이 꽉 찬 화면으로, 아이콘 한 번에 바로 켜져! 인터넷이 잠깐 끊겨도 켤 수 있어~</p></div></div>
        ${can ? '' : `<ol class="install-steps">${Install.steps(k).map(s => `<li>${s}</li>`).join('')}</ol>`}
        ${k === 'desktop' ? '<p class="survey-note">휴대폰으로 열면 홈 화면에 추가할 수 있어요</p>' : ''}
        <div class="sheet-btns"><button class="big-btn ghost" data-back>${can ? '나중에' : '알았어'}</button>${can ? '<button class="big-btn" data-go>홈 화면에 추가</button>' : ''}</div>`;
      const close = () => { $('#charSheet').classList.remove('show'); done(); };
      card.querySelector('[data-back]').onclick = () => { Sound.play('click'); close(); };
      const go = card.querySelector('[data-go]');
      if (go) go.onclick = async () => {
        Sound.play('click');
        const e = Install.deferred;
        Install.deferred = null;
        close();
        try { await e.prompt(); } catch {}
      };
      $('#charSheet').classList.add('show');
      fitText($('#charSheet'));
    });
  },
};
addEventListener('beforeinstallprompt', e => { e.preventDefault(); Install.deferred = e; });
addEventListener('appinstalled', () => { Install.deferred = null; Tutor.mark('a2hs'); });
