# 먼작귀 퍼즐 토벌 대작전! (비공식 팬게임)

> ⚠️ **이 게임은 비공식 팬게임입니다.**
> 원작자 나가노 및 치이카와 제작위원회와 아무 관계가 없으며, 승인이나 후원을 받지 않았습니다.
> 비영리로 만들었고, 수익을 내지 않습니다.
> 권리자께서 요청하시면 바로 내리겠습니다.

**플레이:** https://gammja17.github.io/chiikawa-match/

'먼가 작고 귀여운 녀석들' 캐릭터 얼굴을 맞추는 3매치 퍼즐에 몬스터 토벌 전투를 더한 브라우저 게임입니다.

## 놀이 방법

- 옆 칸의 얼굴과 자리를 바꿔 같은 얼굴 3개 이상을 맞추면, 그 캐릭터가 몬스터를 공격합니다.
- 카니를 맞추면 공격 대신 체력을 회복합니다. 우사기는 가끔 치명타("우라!")를 냅니다.
- 연쇄로 터질수록 피해가 커집니다.
- 몬스터는 몇 턴마다 반격합니다. 체력이 다 떨어지면 후퇴합니다.
- 특수 구슬
  - 4개 한 줄: 한 줄을 지우는 줄폭탄
  - L, T 모양: 주변을 터뜨리는 폭탄
  - 5개 한 줄: 한 캐릭터를 전부 지우는 무지개 폭탄
  - 특수 구슬끼리 바꾸면 더 큰 효과
- 스테이지 10개, 남은 체력에 따라 별 1~3개

### 아이템

- 4개 한 줄: 🚀로켓(한 줄), L·T 모양: 💣폭탄, 5개 한 줄: 🌈무지개, **2×2 네모: ✈️비행기** (목표 쪽으로 날아감)
- 속성: 🔥씩씩 → ⭐엉뚱 → 💧울보 → 🔥씩씩 (화살표 쪽에 1.5배), ☀️빛 ⇄ 🌙어둠은 서로에게 1.5배
- 아이템은 색이 없는 아이콘 하나. **두 번 톡톡 누르거나 아무 쪽으로 쓱 밀면** 바로 발동
- 아이템끼리 바꾸면 더 큰 효과. 비행기는 상대 아이템을 싣고 날아감

### 모험 지도

토벌 10개와 일상 퍼즐 20개가 한 줄 루트에 정해진 순서로 섞여 있습니다. 스테이지마다 판 모양이 다릅니다.

- 풀 뽑기: 구슬을 덮은 잡초(한 겹, 두 겹)를 그 위에서 터뜨려 뽑기
- 요리: 나루토, 달걀, 경단 같은 재료를 맨 아래까지 떨구기 / 시럽·국물: 시럽 칸이 낀 매치로 판 전체에 번지게
- 거품 청소: 한 번 움직일 동안 하나도 못 터뜨리면 거품이 번짐
- 상자, 선물 상자(두 번), 리본에 묶인 구슬(못 움직임, 한 번 터뜨리면 풀림)
- 제초 검정 5급~1급: 제한 시간 안에 목표 (구슬이 터지는 동안 시계는 멈춤)
- 토벌의 미믹은 공격하면서 판에 상자를 던짐

### 모으기와 꾸미기

- 스테이지를 깨면 코인. 매일 처음 들어오면 용돈 50코인
- 간식으로 데려오기: 모몽가(딸기 파르페 5), 쿠리만쥬(경단 5), 고블린(주먹밥 4), 시사는 「시사의 라멘 가게」를 깨면 합류. 간식은 스테이지를 깨면 받음
- 캡슐 뽑기(100코인): 새 친구를 만나거나, 이미 있는 친구면 레벨 업(최대 Lv10, 레벨마다 공격·회복 +8%), 액세서리
- 편성: 친구 카드를 톡 누르면 넣고 빼기, 꾹 누르면 친구 상세
- 친구 상세: 레벨, 스탯, 스킬, 액세서리 씌우기, 레벨 2에 열리는 짧은 이야기
- 우리 집: 가구를 사서 놓으면 모은 친구들이 방 안을 돌아다님 (눌러 보면 한마디)
- 캐릭터 목소리: `assets/voice/`에 직접 넣는 칸만 있습니다 (README 참고)
- 진동: 구슬이 터질 때 폰이 톡톡 울림 (안드로이드, iOS 18 이상 사파리). 지도 위 버튼으로 끄고 켬

### 도전 (지도 아래 「도전」)

- 인어섬 탐험: 층마다 일상 퍼즐이 나오고 올라갈수록 이동 수가 줄어드는 무한 모드. 실패하면 거기까지 (층마다 +5번 한 번)
- 제초 대회: 60초 동안 최대한 높은 점수. 판 전체 잡초를 다 뽑으면 +2000점과 함께 다시 자람
- 랭킹: 깬 스테이지 수, 인어섬 최고 층, 제초 대회 최고 점수 (구글 로그인 또는 게스트)

## 실행

정적 파일만 있어서 아무 웹 서버로 열면 됩니다.

```bash
python -m http.server 8770
```

그다음 http://localhost:8770 을 엽니다.

## 저작권과 출처

- 캐릭터, 몬스터 이미지: © nagano / chiikawa committee. 퍼즐 얼굴은 인터넷에서 모은 이미지, 전신·포즈 일러스트와 몬스터는 [Chiikawa Wiki (Fandom)](https://chiikawa.fandom.com/)에서 가져왔습니다. 이미지의 권리는 원저작자에게 있으며, 이 저장소의 라이선스 대상이 아닙니다.
- 도전 화면 그림(인어섬, 제초 검정, 랏코), 타이틀 풀밭 그림: 원작 애니메이션·게임 이미지 (© nagano / chiikawa committee, 「映画ちいかわ」製作委員会, Applibot)
- 배경, 터짐 조각: [VARCO](https://3d.varco.ai)로 생성
- 효과음: 구슬 터짐, 로켓, 타격 같은 퍼즐 소리는 코드(`js/audio.js`)로 직접 합성. 징글과 일부 효과음은 [Kenney](https://kenney.nl) Interface Sounds, Digital Audio, Impact Sounds, Music Jingles (CC0). 라이선스 원문은 `assets/sfx/LICENSE-kenney*.txt` (아이폰 재생을 위해 mp3로 변환)
- 파티클 이펙트: [Kenney Particle Pack](https://kenney.nl/assets/particle-pack) (CC0). 라이선스 원문은 `assets/img/fx/k/LICENSE-kenney-particles.txt`
- 배경 음악: 코드(`js/audio.js`)로 직접 연주하는 오리지널 곡
- 아이템, 장애물, 재료, 가구, 액세서리 아이콘: [Noto Emoji](https://github.com/googlefonts/noto-emoji) (Google, Apache License 2.0). 라이선스 원문은 `assets/img/items/LICENSE-noto.txt`
- 글꼴: [Dongle](https://fonts.google.com/specimen/Dongle), [Gowun Dodum](https://fonts.google.com/specimen/Gowun+Dodum), [Gaegu](https://fonts.google.com/specimen/Gaegu) (Google Fonts, SIL Open Font License)
- 게임 코드(`js/`, `css/`, `index.html`): 팬 창작물

## 랭킹 서버 (Firebase)

설정 전에는 랭킹 없이 기기 안 기록만 씁니다. 켜려면:

1. [Firebase 콘솔](https://console.firebase.google.com)에서 프로젝트를 만들고 **웹 앱**을 추가합니다.
2. **Authentication → 로그인 방법**에서 `Google`과 `익명`을 켭니다. 게스트로 하다가 구글을 연결하면 그 기록이 그대로 이어지고, 로그인하면 진행이 계정에 저장되어 다른 기기에서도 이어서 할 수 있습니다.
3. **Authentication → 설정 → 승인된 도메인**에 `gammja17.github.io`를 추가합니다.
4. **Firestore Database**를 만들고 **규칙**에 아래를 붙여 넣습니다.
5. 웹 앱 설정값(`apiKey`, `authDomain`, `projectId`, `appId`)을 `js/firebase-config.js`의 `window.FIREBASE_CONFIG`에 넣습니다. 이 값은 공개되어도 되는 값이고, 실제 보호는 아래 규칙이 맡습니다.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid
        && request.resource.data.data is string && request.resource.data.data.size() < 200000;
    }
    match /scores/{uid} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == uid
        && request.resource.data.keys().hasOnly(['name', 'cleared', 'tower', 'contest', 'updated'])
        && request.resource.data.name is string && request.resource.data.name.size() <= 12
        && request.resource.data.cleared is int && request.resource.data.cleared <= 30
        && request.resource.data.tower is int && request.resource.data.tower <= 999
        && request.resource.data.contest is int && request.resource.data.contest <= 300000;
    }
  }
}
```

점수는 브라우저에서 올리는 값이라 마음먹고 조작하면 막을 수 없습니다. 규칙은 말도 안 되는 값만 걸러 냅니다.

Firebase SDK(Apache License 2.0)는 `assets/vendor/`에 넣어 두었습니다.
