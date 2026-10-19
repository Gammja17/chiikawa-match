# 먼작귀 퍼즐 토벌 대작전! (비공식 팬게임)

> ⚠️ **이 게임은 비공식 팬게임입니다.**
> 원작자 나가노 및 치이카와 제작위원회와 아무 관계가 없으며, 승인이나 후원을 받지 않았습니다.
> 비영리로 만들었고, 수익을 내지 않습니다.
> 권리자께서 요청하시면 바로 내리겠습니다.

**플레이:** https://gammja17.github.io/chiikawa-match/

'먼가 작고 귀여운 녀석들' 캐릭터 얼굴을 맞추는 3매치 퍼즐에 괴물 토벌 전투를 더한 브라우저 게임입니다.

## 놀이 방법

- 옆 칸의 얼굴과 자리를 바꿔 같은 얼굴 3개 이상을 맞추면, 그 캐릭터가 괴물을 공격합니다.
- 카니를 맞추면 공격 대신 체력을 회복합니다. 우사기는 가끔 치명타("우라!")를 냅니다.
- 연쇄로 터질수록 피해가 커집니다.
- 괴물은 몇 턴마다 반격합니다. 체력이 다 떨어지면 후퇴합니다.
- 특수 구슬
  - 4개 한 줄: 한 줄을 지우는 줄폭탄
  - L, T 모양: 주변을 터뜨리는 폭탄
  - 5개 한 줄: 한 캐릭터를 전부 지우는 무지개 폭탄
  - 특수 구슬끼리 바꾸면 더 큰 효과
- 남은 체력에 따라 별 1~3개

### 아이템

- 4개 한 줄: 🚀로켓(한 줄), L·T 모양: 💣폭탄, 5개 한 줄: 🌈무지개, **2×2 네모: ✈️비행기** (목표 쪽으로 날아감)
- 속성: 🔥씩씩 → ⭐엉뚱 → 💧울보 → 🔥씩씩 (화살표 쪽에 1.5배), ☀️빛 ⇄ 🌙어둠은 서로에게 1.5배
- 아이템은 색이 없는 아이콘 하나. **두 번 톡톡 누르거나 아무 쪽으로 쓱 밀면** 바로 발동
- 아이템끼리 바꾸면 한 칸으로 빨려 들어가 합체한 뒤 더 큰 효과 (꿈의집과 같은 조합). 비행기는 상대 아이템을 싣고 날아감
- 아이템은 터지기 전(부르르, 부풀기, 빙글) → 터짐(로켓은 차례로 쓸고, 폭탄은 둥글게, 무지개는 빛줄기, 비행기는 날아가 꽂힘) → 여운(연기, 불씨)

### 모험 지도

30장 300판: 토벌 93개와 일상 퍼즐 207개가 한 줄 루트에 정해진 순서로 섞여 있습니다. 장마다 10판(일상 7, 토벌 3 안팎)이고 마지막 판은 보스. 스테이지마다 판 모양이 다릅니다.

- 1~6장: 풀 뽑기 첫걸음, 섞어 보기, 제초 검정 1급, 하치와레의 노래, 끝나지 않는 오늘, 고블린 동굴 (`js/data.js`, `js/life.js`)
- 7~30장: 라멘 가게 대작전, 비 오는 날, 카니의 헌책방, 여름 축제, 바다로!, 랏코 선생님의 수련, 모몽가 소동, 쿠리만쥬의 하루, 별똥별의 밤, 마법소녀 치이카와, 할로윈 밤, 풍뎅이와 숙제, 가을 소풍, 제초 검정 특급, 눈 내리는 날, 산타의 밤, 새해 첫 해돋이, 우사기의 보물 돌, 온천 마을, 꽃놀이, 하치와레의 첫 공연, 키메라의 숲, 거인의 성, 토벌 대축제 (`js/chapters.js`)

- 일상 퍼즐에는 친구 한 명을 데려가서 그 친구 스킬을 씀 (처음 두 판은 하치와레)
- 스킬 AUTO 버튼: 게이지가 차면 알아서 발동
- 풀 뽑기: 잡초는 칸을 차지한 장애물. 바로 옆에서 맞추거나 아이템으로 뽑기 (큰 잡초는 두 번)
- 요리: 나루토, 달걀, 경단 같은 재료를 맨 아래까지 떨구기 / 시럽·국물: 시럽 칸이 낀 매치로 판 전체에 번지게
- 거품 청소: 한 번 움직일 동안 하나도 못 터뜨리면 거품이 번짐
- 상자, 선물 상자(두 번), 리본에 묶인 구슬(못 움직임, 한 번 터뜨리면 풀림)
- 제초 검정 5급~1급: 제한 시간 안에 목표 (구슬이 터지는 동안 시계는 멈춤)
- 토벌의 미믹은 공격하면서 판에 상자를 던짐

### 모으기와 꾸미기

- 스테이지를 깨면 코인
- 출석 도장판: 하루에 한 칸, 빠진 날이 있어도 이어서 찍힘. 7일째는 뽑기 티켓 3장 (코인, 경단, 파르페, 주먹밥 순)
- 오늘의 미션(3판 깨면 열림): 날마다 3개 (잡초 뽑기, 구슬 터뜨리기, 5콤보, 토벌, 스킬, 라멘, 뽑기, 쓰다듬기 등). 하나에 60코인, 다 깨면 뽑기 티켓 1장. 지도 왼쪽 위 「미션」
- 호감도: 집에서 하루 한 번 톡 쓰다듬기(+2), 간식 주기(+5, 좋아하는 간식은 +10), 같이 모험을 이기면 +1. 2단계 코인 100, 3단계 이야기, 4단계 뽑기 티켓, 5단계 단짝(공격·회복 +5%)
- 처음엔 치이카와 혼자. 하치와레(1단계), 우사기(2단계), 카니(첫 토벌), 랏코(두 번째 토벌)가 차례로 합류하고, 시사는 라멘 가게에서 수행 중이다가 「시사의 라멘 가게」를 깨면 합류
- 간식으로 데려오기: 모몽가(딸기 파르페 5), 쿠리만쥬(경단 5), 고블린(주먹밥 4). 라멘 가게 문가에 기웃거리는 손님에게 간식을 주면 친구가 됨
- 편성은 1~5명. 빈자리는 응원 친구 구슬로 채워짐 (공격 절반, 스킬 없음). 끝나고 나오는 친구는 가장 많이 때린 MVP
- 하트: 5개까지, 20분마다 하나씩 참. 모험 지도 스테이지를 못 깨거나 하던 중에 나가면 하나 줄어듦 (코인 150으로 다 채우기)
- 기능은 깬 스테이지 수에 따라 열림: 친구들 2, 라멘 가게 4, 집 6, 캡슐 뽑기 8, 도전 10. 열릴 때 그 자리를 비춰 주며 안내
- 라멘 가게: 갑옷 아저씨와 시사에게 말 걸기, 토벌을 새로 깰 때마다 한 그릇(곱빼기: 체력 150 / 진한 국물: 스킬 게이지 반)
- 캡슐 뽑기: 친구 뽑기(1번 100코인·10번 900코인, 10번은 새 친구 하나 확정, 이미 있는 친구는 강화 조각)와 옷 가게(애니 장면에서 가져온 코스튬을 코인으로 삼, 입으면 공격 +5%)
- 편성: 친구 카드를 톡 누르면 넣고 빼기, 꾹 누르면 친구 상세
- 친구 상세: 레벨, 스탯, 스킬, 옷 갈아입히기 (그림을 통째로 바꿈, `assets/img/skins/`), 레벨 2에 열리는 짧은 이야기
- 친구네 집: 친구마다 집이 있고 가구와 같이 살 친구를 정함. 친구를 꾹 잡고 끌어서 자리를 옮김. 들고 있으면 성격대로 바둥바둥 (치이카와는 울먹), 톡 누르면 쫄깃하게 눌리며 한마디, 세 번 연달아 찌르면 반응
- 캐릭터 목소리: `assets/voice/`에 직접 넣는 칸만 있습니다 (README 참고)
- 진동: 구슬이 터질 때 폰이 톡톡 울림 (안드로이드, iOS 18 이상 사파리). 게임 중 일시정지 창에서 끄고 켬

### 도전 (지도 아래 「도전」)

- 인어섬 탐험: 층마다 일상 퍼즐이 나오고 올라갈수록 이동 수가 줄어드는 무한 모드. 실패하면 거기까지 (층마다 +5번 한 번)
- 제초 대회: 60초 동안 최대한 높은 점수. 판 전체 잡초를 다 뽑으면 +2000점과 함께 다시 자람
- 랭킹: 깬 스테이지 수, 인어섬 최고 층, 제초 대회 최고 점수 (구글 로그인 또는 게스트)

### 홈 화면 앱과 안전장치

- 사파리에서 공유 → 「홈 화면에 추가」 하면 주소창 없이 앱처럼 켜짐 (`manifest.webmanifest`, `sw.js`). 코드는 켤 때마다 새로 받고, 인터넷이 없으면 저장해 둔 걸로 켬
- 플레이어 폰에서 난 에러는 Firestore `errors` 컬렉션에 쌓임 (켤 때마다 최대 8개, 어떤 화면·판·판 크기였는지 함께). Firebase 콘솔 → Firestore → `errors`에서 봄
- 판이 20초 넘게 아무 연출 없이 멈춰 있으면 「앗, 판이 멈췄어요」 창이 뜨고 하트를 잃지 않고 다시 시작 (이것도 `errors`에 `stuck`으로 남음)

## 스테이지 만들기 (7장~)

`js/chapters.js`는 만든 파일입니다. 이름·목표·응원 친구·대사는 `tools/stages/spec.js`에 적고, 판 그림·이동 수·별 점수·괴물 체력은 봇이 정합니다.

```bash
node tools/stages/make.js                      # 바뀐 판만 다시 재서 js/chapters.js를 새로 씀
node tools/stages/make.js "--only=진한 국물"     # 이 판만
node tools/stages/make.js --all                # 전부 (4코어로 20분쯤)
node tools/sim.js route 100                    # 루트 전체를 봇으로 돌려 판마다 깨는 비율 보기
```

- 봇(`tools/sim.js`)은 `js/board.js`를 그대로 불러와 화면 없이 둠. 둘 수 있는 수를 하나씩 미리 터뜨려 보고 목표에 제일 가까워지는 수를 고름
- 일상 퍼즐: 봇이 깨는 데 든 수의 분포에서 이동 수를 정함 (보통 93%→88%, 도전 85%, HARD 64%→56% 깸, 1~6장을 같은 봇으로 잰 값과 맞춤). 너무 짧거나 길면 장애물 양을 늘리고 줄여 다시 잼. 별은 깬 판 점수(보너스 포함)의 40%·75% 지점
- 토벌: 친구 레벨이 60판 6 → 300판 10으로 오른다고 보고, 깨는 비율과 싸움 길이(10~18턴)에 맞춰 괴물 체력·공격력을 정함
- 잰 값은 `tools/stages/tuned.json`에 남겨 둬서, 대사만 고치면 다시 재지 않음

## 실행

정적 파일만 있어서 아무 웹 서버로 열면 됩니다.

```bash
python -m http.server 8770
```

그다음 http://localhost:8770 을 엽니다.

## 저작권과 출처

- 캐릭터, 괴물 이미지: © nagano / chiikawa committee. 퍼즐 얼굴은 인터넷에서 모은 이미지, 전신·포즈 일러스트와 괴물은 [Chiikawa Wiki (Fandom)](https://chiikawa.fandom.com/)에서, 옷 그림은 Chiikawa Wiki의 애니메이션 장면·공식 일러스트에서 배경을 지워서, 춤추는 치이카와 GIF는 작가 nagano의 [GIPHY](https://giphy.com/ngntrtr)에서 가져왔습니다. 이미지의 권리는 원저작자에게 있으며, 이 저장소의 라이선스 대상이 아닙니다.
- 도전 화면 그림(인어섬, 제초 검정, 랏코), 타이틀 풀밭 그림: 원작 애니메이션·게임 이미지 (© nagano / chiikawa committee, 「映画ちいかわ」製作委員会, Applibot)
- 배경, 터짐 조각, 체력바·점수바 틀과 스킬 고리: [VARCO](https://3d.varco.ai)로 생성
- '+'·'초'·'보너스 타임!'·'피버 타임!'·'선물!' 그림 글자: 콤보 숫자 그림과 같은 느낌으로 [Jua](https://fonts.google.com/specimen/Jua) 글꼴(SIL Open Font License)을 써서 코드로 그림
- 효과음: [Pixabay](https://pixabay.com/sound-effects/) (floraphonic, humordome / Pixabay Content License)와 [Mixkit](https://mixkit.co/free-sound-effects/) (Mixkit Sound Effects Free License). 크기를 맞추고 일부는 잘라서 mp3로 변환했습니다. 소리 파일만 따로 떼어 배포하는 것은 각 라이선스에서 허용하지 않습니다. 소리마다 볼륨은 `js/audio.js`의 `SFX_VOL`
- 파티클 이펙트: [Kenney Particle Pack](https://kenney.nl/assets/particle-pack) (CC0). 라이선스 원문은 `assets/img/fx/k/LICENSE-kenney-particles.txt`
- 배경 음악: OpenGameArt의 CC0 곡 (`assets/bgm/`, 출처는 `js/prefs.js`의 CREDITS)
- 아이템, 장애물, 재료, 가구, 액세서리 아이콘: [Noto Emoji](https://github.com/googlefonts/noto-emoji) (Google, Apache License 2.0). 라이선스 원문은 `assets/img/items/LICENSE-noto.txt`
- 글꼴: [Dongle](https://fonts.google.com/specimen/Dongle), [Gowun Dodum](https://fonts.google.com/specimen/Gowun+Dodum), [Gaegu](https://fonts.google.com/specimen/Gaegu) (Google Fonts, SIL Open Font License)
- 게임 코드(`js/`, `css/`, `index.html`): 팬 창작물

## 배포 (Cloudflare)

공개 주소: https://chiikawa.3match.workers.dev

```bash
python tools/build_dist.py
npx wrangler deploy
```

- `build_dist.py`가 게임에 필요한 파일만 `dist/`로 모으고, 그 폴더만 올립니다 (`wrangler.jsonc`).
- 유료 이펙트는 원본 PNG(`assets/king/`) 대신 줄이고 뒤섞은 팩(`js/king-pack.js`)으로만 들어갑니다. 원본, 팩, `dist/`는 저장소에 올라가지 않습니다. 원본이 없는 곳에서는 무료(Kenney) 이펙트로 돌아갑니다.
- 버전별 미리보기 주소는 꺼 두었습니다 (`preview_urls: false`).

## 랭킹 서버 (Firebase)

설정 전에는 랭킹 없이 기기 안 기록만 씁니다. 켜려면:

1. [Firebase 콘솔](https://console.firebase.google.com)에서 프로젝트를 만들고 **웹 앱**을 추가합니다.
2. **Authentication → 로그인 방법**에서 `Google`과 `익명`을 켭니다. 게스트로 하다가 구글을 연결하면 그 기록이 그대로 이어지고, 로그인하면 진행이 계정에 저장되어 다른 기기에서도 이어서 할 수 있습니다.
3. **Authentication → 설정 → 승인된 도메인**에 `chiikawa.3match.workers.dev`(와 `gammja17.github.io`)를 추가합니다.
4. **Firestore Database**를 만들고 저장소의 `firestore.rules`를 올립니다: `npx firebase-tools deploy --only firestore:rules` (또는 콘솔 **규칙**에 그 파일 내용을 붙여 넣기). 아래는 예전 요약이고, 에러 모으기(`errors`)까지 들어 있는 건 `firestore.rules`입니다.
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
        && request.resource.data.cleared is int && request.resource.data.cleared <= 500
        && request.resource.data.tower is int && request.resource.data.tower <= 999
        && request.resource.data.contest is int && request.resource.data.contest <= 300000;
    }
  }
}
```

점수는 브라우저에서 올리는 값이라 마음먹고 조작하면 막을 수 없습니다. 규칙은 말도 안 되는 값만 걸러 냅니다.

Firebase SDK(Apache License 2.0)는 `assets/vendor/`에 넣어 두었습니다.
