# 캐릭터 목소리 칸

여기에 mp3를 넣고 `voices.json`에 적으면 게임에서 재생됩니다. 없으면 효과음으로 대신합니다.

- 파일 이름: `{캐릭터id}_{상황}.mp3` (예: `chiikawa_pick.mp3`)
- 상황: `pick` 고를 때·집에서 눌렀을 때, `skill` 스킬 쓸 때, `win` 이겼을 때
- 캐릭터 id: chiikawa, hachiware, usagi, momonga, rakko, kani, kurimanju, shisa, shooting, darkstar, goblin, beetle

```json
{ "chiikawa": ["pick", "skill", "win"], "usagi": ["skill"] }
```

애니메이션이나 공식 영상에서 잘라 낸 소리는 저작권과 성우 권리가 걸려 있어서 저장소에 올리지 마세요.
직접 녹음한 소리나 이용 조건이 분명한 소리만 넣어 주세요.
