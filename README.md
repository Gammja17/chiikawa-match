# 치이카와 토벌 퍼즐 (비공식 팬게임)

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

## 실행

정적 파일만 있어서 아무 웹 서버로 열면 됩니다.

```bash
python -m http.server 8770
```

그다음 http://localhost:8770 을 엽니다.

## 저작권과 출처

- 캐릭터, 몬스터 이미지: © nagano / chiikawa committee. 퍼즐 얼굴은 인터넷에서 모은 이미지, 전신·포즈 일러스트와 몬스터는 [Chiikawa Wiki (Fandom)](https://chiikawa.fandom.com/)에서 가져왔습니다. 이미지의 권리는 원저작자에게 있으며, 이 저장소의 라이선스 대상이 아닙니다.
- 배경, 터짐 조각: [VARCO](https://3d.varco.ai)로 생성
- 효과음: [Kenney](https://kenney.nl) Interface Sounds, Digital Audio, Impact Sounds, Music Jingles (CC0). 라이선스 원문은 `assets/sfx/LICENSE-kenney*.txt`
- 배경 음악: 코드(`js/audio.js`)로 직접 연주하는 오리지널 곡
- 특수 구슬 아이콘: [Noto Emoji](https://github.com/googlefonts/noto-emoji) (Google, Apache License 2.0). 라이선스 원문은 `assets/img/items/LICENSE-noto.txt`
- 글꼴: [Jua](https://fonts.google.com/specimen/Jua), [Baloo 2](https://fonts.google.com/specimen/Baloo+2), [Gaegu](https://fonts.google.com/specimen/Gaegu) (Google Fonts, SIL Open Font License)
- 게임 코드(`js/`, `css/`, `index.html`): 팬 창작물
