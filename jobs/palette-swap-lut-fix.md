---
# 묶음 3 수정 잡 (plan 5-3). 독립 리뷰 지적을 반영한다. 구현 결과는 main 에 합쳐 두었다.
model: claude-opus-5-5
effort: high
budgetUsd: 5
verify:
  - node tools/check.mjs palette-swap-lut
  - node tools/unity.mjs palette-swap-lut
  - node tools/shots.mjs palette-swap-lut
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(node tools/gen-texture.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/palette-swap-lut/**
  - Assets/Shaders/palette-swap-lut.meta
  - web/src/specimens/palette-swap-lut/**
  - web/src/shots/palette-swap-lut/**
  - tools/textures/palette-swap-lut-index.mjs
  - tools/textures/palette-swap-lut-palette.mjs
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 수정: palette-swap-lut 리뷰 반영

`palette-swap-lut` 표본은 이미 있고 Unity 컴파일과 촬영을 통과했다. 독립 리뷰에서 나온 아래 항목만 고친다. 규격은 `docs/specimen-guide.md` 를 따른다. 인덱스와 팔레트 PNG, 반 텍셀 오프셋, 밉맵 대책, 효과 끄기, 단계, C# 은 리뷰에서 문제가 없었으니 바꾸지 않는다.

리뷰 뒤 앱과 가이드에서 이미 바뀐 것 (다시 고치지 않는다):
- Unity 촬영 도구가 포인트 텍스처를 압축 없이, 밉맵 없이 가져온다. 이번 검증에서 다시 촬영된다.
- 선정 카드의 Little Nemo 항목에 제작사와 연도가 적혔다 (DIE SOFT, 2026).

## 필수

1. **`inspiredBy` 사실 오류**: 제작사는 Dream Logic Games 가 아니라 DIE SOFT 이고 PC 출시는 2026 이다. 선정 카드 "17. palette-swap-lut" 에 적힌 대로 `Little Nemo and the Guardians of Slumberland (2026)`, `DIE SOFT` 로 고친다.
2. **압축 주장**: "4x4 로 키운 아트라 압축에도 번호가 버틴다" 는 블록이 4x4 인 형식(BC, ETC2, ASTC 4x4)에서만 맞고, Android 기본 ASTC(보통 6x6)나 아틀라스 재배치에서는 깨진다. 인덱스 회색은 RGB 한 직선 위라 BC1 은 한 블록 안의 값을 4단계로 줄여 번호가 바뀐다. 이 문장을 빼고 인덱스와 팔레트 모두 Compression None 이 필수라고 쓴다.

## 권장

3. **증상 제목**: "피부가 파랗고 옷이 검게" 는 이 그림에서만 맞다. 일반 증상("색이 더 낮은 번호의 색으로 밀리고 0 과 최댓값만 맞다")으로 쓰고, Linear 색 공간 프로젝트에서만 생긴다는 점을 더한다.
4. **Sprite Atlas**: 아틀라스 하나는 sRGB 와 압축 설정을 하나만 가진다. 인덱스 스프라이트를 컬러 스프라이트와 같은 아틀라스에 넣으면 효과 끄기와 같은 고장이 난다. 인덱스 전용 아틀라스를 따로 두라는 항목을 넣는다.
5. **피격 줄 설명**: "몸 전체가 흰색" 이라고 했지만 머리, 옷, 포인트는 연분홍이다. "흰색과 연분홍" 으로 고친다.

## 끝내기 전에

1. `node tools/check.mjs palette-swap-lut` 를 통과시킨다.
2. `node tools/live.mjs` 로 기본, 효과 끄기, 바꾼 단계와 프리셋 화면을 찍어 Read 로 본다.
3. 바꾼 글이 프롬프트에 들어갈 때 어색하지 않은지 `meta.ts` 를 다시 읽는다.

마지막 보고에는 고친 것과 직접 확인하지 못한 것을 적는다.
