---
# 묶음 4 수정 잡 (plan 5-3). 독립 리뷰 지적을 반영한다. 구현 결과는 main 에 합쳐 두었다.
model: claude-opus-5-5
effort: high
budgetUsd: 5
verify:
  - node tools/check.mjs xray-occluded-silhouette
  - node tools/unity.mjs xray-occluded-silhouette
  - node tools/shots.mjs xray-occluded-silhouette
allowedTools: [Read, Edit, Write, Glob, Grep, "Bash(node tools/check.mjs *)", "Bash(node tools/live.mjs *)", "Bash(git status*)", "Bash(git diff*)", "Bash(ls *)"]
writePaths:
  - Assets/Shaders/xray-occluded-silhouette/**
  - Assets/Shaders/xray-occluded-silhouette.meta
  - web/src/specimens/xray-occluded-silhouette/**
  - web/src/shots/xray-occluded-silhouette/**
allowProfiles: [org]
verifyLock: unity
verifyTimeoutMinutes: 30
timeoutMinutes: 60
maxRetries: 2
---

# 표본 수정: xray-occluded-silhouette 리뷰 반영

`xray-occluded-silhouette` 표본은 이미 있고 Unity 컴파일과 촬영을 통과했다. 독립 리뷰에서 나온 아래 항목만 고친다. 규격은 `docs/specimen-guide.md` 를 따른다. 래퍼의 패스 구성(태그, 큐, Blend, ZTest/ZWrite, SRP Batcher, XR 매크로, 그림자·깊이·노멀 패스), C# 의 복사본·제한기·트랙, 색과 inspiredBy 는 리뷰에서 문제가 없었으니 바꾸지 않는다.

리뷰 뒤 앱과 가이드에서 이미 바뀐 것 (다시 고치지 않는다):
- 가이드에 리뷰에서 나온 규칙이 들어갔다. 읽고 따른다: 3-4절 텍스처 반복을 range 로 노출, 4절 XR 의 화면 중심(uv 0.5 는 눈 정면이 아님)과 래퍼의 distanceAttenuation 주석, 5절 `steps` 의 마지막 단계와 `unity.graph` 의 Custom Function 형식과 `thumbnail` 의 쓰임, 6절 머티리얼 기본값과 공유 머티리얼 제한기의 `static`, 7절 포화된 빨강의 정의와 느린 맥동.
- 링크 쿼리 `t=<초>` 로 웹 무대 시간을 멈춘 채 찍을 수 있다 (가이드 8절). `live.mjs` 는 한 번에 `--query` 하나만 받는다.
- 가이드 4절의 Depth Priming 설명을 바로잡았다 (프라이밍은 두 번째 패스를 ZTest Equal 로 덮어써 사라지게 한다. 자기 겹침은 Deferred 순서와 여러 렌더러·서브메시에서 생긴다). `depthDelta` 정의는 눈 깊이 차로 고쳤다. '그대로 넣기' 프롬프트는 이제 linear·point 텍스처에 Compression None 단계를, Depth 설정에 Depth Texture Mode 안내를 자동으로 넣는다.
- 웹 그림자 검사가 이제 벽을 숨기고 잰다. 첫 시도에서 캡슐이 실패한 원인은 앱이었다.

## 필수

1. **캡슐로 되돌리기**: 작업 지시대로 `mesh: 'capsule'` 로 바꾼다. 캡슐은 원통과 높이, 반지름, 배치가 같아 벽이 가리는 범위도 같고, 아래 반구 곡선에 테두리가 생겨 형태가 더 잘 읽힌다. `meta.ts` 의 "검사가 벽을 그대로 둔 채" 주석은 이제 사실이 아니니 지운다. 단계 1·2 와 `offNote` 의 "원통" 을 캡슐에 맞게 고치고, 2단계에는 아래 곡선의 테두리를 적는다. 원통 때문에 바꾼 프레넬 식(`sqrt(1 - d²)`)이 캡슐에서도 맞는지 화면으로 보고 정한다. `check` 의 그림자 면적을 다시 확인한다.
2. **사라짐·겹침의 원인 글**: `mistakes` 3, setup 5, pitfalls 2, `.shader` 의 주석이 "깊이 프리패스(SSAO 등)가 돌면 실루엣이 사라지거나 몸에 겹친다" 고 적었다. 가이드 4절 "가려진 부분 패스" 의 새 설명대로 고친다: Depth Priming 은 ZTest Equal 로 덮어써 실루엣을 통째로 지운다(겹침은 생기지 않는다). Auto 모드가 데스크톱에서 켜질 수 있다. 프라이밍 없는 프리패스는 상관없다. 수강생이 SSAO 를 끄며 헛수고하지 않게 쓴다.
3. **여러 렌더러·서브메시와 Deferred**: pitfalls 5 는 "모든 머티리얼을 이 셰이더로" 바꾸라고 권하지만, 그러면 부위마다 실루엣→본체가 따로 그려져 먼저 그린 부위 위에 뒤 부위의 실루엣이 덮인다. 다른 큐의 무기나 모자(Lit, 2000)도 같다 (몸 앞에 든 총 위에 실루엣 색). 이 경우 Render Objects 방식을 권하는 글을 `mistakes` 와 pitfalls 에 넣는다. Deferred 에서는 본체가 먼저 그려질 수 있다는 점(추론)도 pitfalls 에 넣는다.

## 권장

4. 안개: 가이드 4절 안개 방침대로 본체에 `MixFog` 를 거는 방법을 적고, 실루엣은 일부러 안개를 무시해도 된다고 적는다.
5. `unity.graph` 의 "Power 1 근처" 는 `mistakes` 4 가 "실처럼 가늘다" 고 한 식과 같다. sin 모양에 가까운 값(Power 0.5 쯤)으로 고친다. 가이드 5절의 Custom Function 형식도 지킨다.
6. `mistakes` 2 의 "깊이만 쓰는 ColorMask 0 물체" 대안은 그 뒤의 스카이박스와 본체를 지운다. 부작용을 적거나 뺀다.
7. `mistakes` 1 의 "2000 이하" 는 "벽보다 작은 큐" 로 고치고 원인 목록에 Depth Priming 을 더한다.
8. `mistakes` 5 의 "그 레이어의 깊이만 비교" 는 틀렸다 (깊이 버퍼는 하나다). 그리는 순서(벽 → 실루엣 → 덤불 레이어)로 설명한다.
9. 효과 끄기는 지금 1단계와 픽셀 단위로 같다. `mistakes` 4 의 실제 실수(`1 - facing` 의 가는 테두리)를 끄기로 쓰면 1단계와도 갈리고 진짜 흔한 실수가 된다. 바꾸면 `offNote` 와 맞춘다.

## 끝내기 전에

1. `node tools/check.mjs xray-occluded-silhouette` 를 통과시킨다.
2. `node tools/live.mjs` 로 기본, 효과 끄기, 단계, 프리셋, 발견 이벤트 화면을 찍어 Read 로 본다.
3. 바꾼 글이 프롬프트에 들어갈 때 어색하지 않은지 `meta.ts` 를 다시 읽는다.

마지막 보고에는 고친 것과 직접 확인하지 못한 것을 적는다.
