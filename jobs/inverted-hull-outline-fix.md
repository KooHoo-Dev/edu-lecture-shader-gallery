---
# 묶음 1 수정 잡 (plan 5-3). 독립 리뷰 지적을 반영한다. 구현 결과를 main 에 먼저 합쳐 앱 수정과 함께 고친다.
model: claude-opus-5-5
effort: high
budgetUsd: 5
verify:
  - node tools/check.mjs inverted-hull-outline
  - node tools/unity.mjs inverted-hull-outline
  - node tools/shots.mjs inverted-hull-outline
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/inverted-hull-outline/**
  - Assets/Shaders/inverted-hull-outline.meta
  - web/src/specimens/inverted-hull-outline/**
  - web/src/shots/inverted-hull-outline/**
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 수정: inverted-hull-outline 리뷰 반영

`inverted-hull-outline` 표본은 이미 있고 Unity 컴파일과 촬영을 통과했다. 독립 리뷰에서 나온 아래 항목만 고친다. 규격은 `docs/specimen-guide.md` 를 따른다. 패스 구성, C# 수명 주기, 메타와 셰이더 대응은 리뷰에서 문제가 없었으니 바꾸지 않는다.

앱과 가이드가 바뀌었다:
- 웹 `cube` 는 이제 Unity 기본 큐브처럼 면을 나누지 않는다 (정점 24개). 전에는 8분할이라 정점을 밀면 웹에서만 베개처럼 휘었다.
- mesh 무대 물체는 Unity 촬영과 웹 첫 화면 모두 Y 30도에서 시작한다. 큐브 촬영이 정면 테두리처럼 보이던 문제가 풀린다.
- 가이드 4절 외곽선 패스: 공통 `sgEffect` 에서 `#ifdef SG_OUTLINE` 으로 색만 가르는 지금 방식을 허용한다. 린트도 파일 끝의 `#endif` 를 받는다. 깊이 프리패스, 정적 배칭 주의가 추가됐다.
- 외곽선 표본의 프롬프트에는 `SG_OUTLINE` 을 지우지 말라는 규칙이 자동으로 들어간다.

## 필수

1. **미는 방식**: 기본 방식을 피벗 기준 확대 `positionOS * (1.0 + width * 2.0)` 으로 바꾼다. 한 변 1 인 큐브는 면이 정확히 `width` 만큼 나가고, 구는 법선 밀기와 같아진다. 주석, hint, 관련 글을 이 방식에 맞추고, 효과 끄기(법선 그대로 밀기)는 그대로 둔다. 웹으로 기본과 효과 끄기를 다시 찍어 확인한다.
2. **사실과 다른 글** (이 글들은 프롬프트에 그대로 들어간다):
   - 2D Renderer 항목: 본체는 그려지지 않지만 외곽선 패스(`SRPDefaultUnlit`)는 그려져 외곽선 색 덩어리만 보인다.
   - 깊이 텍스처 항목: 프리패스일 때만 빠지고, 불투명 뒤 깊이 복사면 껍데기 깊이도 들어간다. 노멀 텍스처에 안 들어간다는 부분은 맞다.
   - "피벗이 가운데인 볼록한 메시면 고르게 부푼다" 는 과장이다. 판자처럼 납작한 메시는 얇은 쪽 두께가 거의 0 이 되고, 오목한 곳은 안쪽으로 밀려 선이 사라진다. 증상을 구체적으로 적는다.
   - `prompt.goal` 과 래퍼 첫 줄의 "법선 방향으로 부풀린" 은 기본 방식과 다르다. "각진 메시에서도 모서리가 끊기지 않고" 는 조건이 맞는 메시에서만이라고 적는다.
3. **빠진 주의 두 가지**를 mistakes 나 Unity pitfalls 에 넣는다 (가이드 4절 참고):
   - Depth Priming: 증상 "SSAO 를 켜자 외곽선이 사라진다". Unity 에서 확인하지 않은 내용이니 "그럴 수 있다" 로 적고 확인 방법(Frame Debugger, Depth Priming Mode)을 준다.
   - 정적 배칭: Batching Static 물체는 `positionOS` 가 월드 위치가 되어 확대 기준이 월드 원점으로 바뀌고 선이 한쪽으로 쏠린다.
4. **한국어**: attack-target 프리셋의 "노리는 적을 가린다" 는 "숨긴다" 로 읽힌다. "짚어 준다" 나 "표시한다" 로. fine-line 의 "실루엣만 떼어 낸다" 도 자연스럽게.

## 권장

5. 단계 1 의 이름 "본체만" 은 화면에 껍데기 띠가 함께 보이니 "숨은 껍데기" 같은 이름으로.
6. 이벤트 ease 를 C# 의 선형 Lerp 와 같게 `linear` 로 (가이드 5절).
7. `captures` 의 `toon-ink` 는 Unity 화면에서 어두운 선이 배경에 묻힌다. `attack-target` 처럼 잘 보이는 상태로 바꾼다.
8. C#: 페이드를 `Time.unscaledDeltaTime` 으로 (일시정지 메뉴에서 고를 때 멈추지 않게). `.material` 은 첫 머티리얼만 잡으므로 두 번째 머티리얼 방식과 같이 쓰면 안 된다는 점을 주석이나 pitfalls 에. `SetShaderPassEnabled` 가 같은 태그의 다른 패스도 함께 끈다는 점을 주석에.
9. `unity.graph`: Shader Graph 로 외곽선을 만드는 법(두 번째 머티리얼: Unlit, Render Face = Back, Vertex Position 에서 밀기)을 Custom Function 설명과 함께 적는다.

## 끝내기 전에

1. `node tools/check.mjs inverted-hull-outline` 를 통과시킨다.
2. `node tools/live.mjs` 로 기본, 효과 끄기, 단계, 이벤트 화면을 찍어 Read 로 본다. 큐브 면이 휘지 않는지 본다.
3. 바꾼 글이 프롬프트에 들어갈 때 어색하지 않은지 `meta.ts` 를 다시 읽는다.

마지막 보고에는 고친 것과 직접 확인하지 못한 것을 적는다.
