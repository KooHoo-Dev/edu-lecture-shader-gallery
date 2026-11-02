# 수업 프로젝트 구성 확인 (읽기 전용)

확인일 2026-11-02. 세 프로젝트의 폴더, 패키지 목록, 렌더러·URP 에셋 설정, 셰이더 파일 머리말만 읽었다. 에디터는 열지 않았고 어떤 파일도 바꾸지 않았다. 아래 "추정"은 파일만으로 판단한 것이고 에디터에서 확인하지 않았다는 뜻이다.

## 1. 한눈에 비교

| 항목 | 1000-Unity-Basic-2D | 3000-Unity-3D | 5000-Unity-XR |
|---|---|---|---|
| 에디터 | 6000.3.15f1 | 6000.3.15f1 | 6000.3.20f1 |
| URP | 17.3.0 | 17.3.0 | 17.3.0 |
| 렌더러 데이터 | `Settings/Renderer2D.asset` (2D Renderer로 추정) | `PC_Renderer`, `Mobile_Renderer` (Universal Renderer) | `PC_Renderer`, `Mobile_Renderer`, `MR_Renderer`, `Portal_Renderer` |
| URP 에셋의 Depth Texture / Opaque Texture | 0 / 0 | PC 1 / 1, Mobile 0 / 0 | PC 1 / 1, Mobile 0 / 0 |
| HDR / MSAA | HDR 켬 / MSAA 1 | PC·Mobile 모두 HDR 켬, Mobile 렌더 스케일 0.8 | Mobile은 HDR 끔, MSAA 4 |
| 렌더링 모드 | 해당 없음 | PC는 `m_RenderingMode: 2`(Forward+로 추정), 나머지 0(Forward) | Portal, MR, Mobile 렌더러는 0(Forward). PC 렌더러는 확인하지 않음 |
| 렌더러 기능 | 없음(확인한 범위) | PC_Renderer에 ScreenSpaceAmbientOcclusion | Portal_Renderer에 Underwater Transparent/Opaque, AR Background. MR_Renderer에 AR Background |
| 스테레오 | 해당 없음 | 해당 없음 | OpenXR 설정 `m_renderMode: 1`이 두 번 나온다(Single Pass Instanced 계열로 추정). 수업 셰이더가 `UNITY_VERTEX_OUTPUT_STEREO`와 `UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX`를 이미 쓴다 |

주의: `docs/plan.md` 1절은 "수업 프로젝트 5개가 모두 6000.3.20f1"이라고 적었다. 확인한 3개 중 2D와 3D는 6000.3.15f1이다. 나머지 2개 프로젝트는 요청 범위 밖이라 보지 않았다.

## 2. 1000-Unity-Basic-2D

- **렌더러**: `Assets/Settings/UniversalRP.asset`의 렌더러 목록에 `Renderer2D.asset` 하나가 들어 있다. 이 에셋에 `m_UseDepthStencilBuffer: 1`이 있고 `Lit2DSceneTemplate`, `URP2DSceneTemplate`가 있어 2D Renderer로 판단한다. QualitySettings의 렌더 파이프라인 에셋이 이 URP 에셋을 가리킨다.
- **깊이·씬 컬러**: URP 에셋에서 둘 다 꺼져 있다. 2D Renderer에서 Opaque Texture를 못 쓴다는 포럼 글이 있고(현재도 그런지 미확인), 대신 Renderer 2D Data의 Camera Sorting Layer Texture가 있다. 근거는 `sources-by-effect.md` 0절.
- **스프라이트 셰이더 형태**: 외부 에셋 `AllIn1SpriteShader`의 `AllIn1Urp2dRenderer.shader`가 `Universal2D`, `NormalsRendering`, `UniversalForward` 세 가지 LightMode 패스를 쓴다. 2D 라이트와 같이 쓰는 스프라이트 셰이더가 갖춰야 할 형태의 실물 예다. 그대로 베끼지 않고 요구 사항만 반영한다.
- **수업 흐름** (`Assets/10. Scripts/00. 커리큘럼 로드맵.md`): Unity 2D·C# 기초(레슨 00~13) → 14 Action Platformer → OOP·디자인 패턴 → 자료구조 → 비동기·트윈(UniTask, DoTween).
- **셰이더와 직접 닿는 레슨**
  - 02 Sprite Renderer: 스프라이트와 머티리얼 입문.
  - 05 Layer And Scroll: `ScrollController`가 오브젝트를 왼쪽·오른쪽·위·아래로 옮겨 배경을 스크롤한다. UV 스크롤 셰이더와 비교하기 좋다.
  - 13 Scene Management, 99 Async And Tween, 99 Lerp And Coroutine 2D: 화면 전환 연출의 재료.
  - 14 Action Platformer와 99 Rockman의 `Enemy.cs`: `Shader.PropertyToID("_HitEffectBlend")`로 피격 효과를 켜고, `SpriteRenderer.material`로 인스턴스 머티리얼을 만들고 `Destroy`로 정리한다. 이 속성은 외부 에셋 AllIn1SpriteShader의 것이다. 수업이 이미 "피격 번쩍임"을 상용 에셋으로 가르치므로 갤러리 샘플은 원리 설명과 프롬프트로 가치를 낸다.
  - 15 Mini Defence: 팀 프로젝트(타워 디펜스류).
- **외부 에셋**: AllIn1SpriteShader(스프라이트 올인원, 상용), MagicArsenal(이펙트), Modern UI Pack, Layer Lab(UI), Playing Cards Pack, Puzzle Assets, Space Shooter Redux 등.

## 3. 3000-Unity-3D

- **수업 흐름** (`Assets/00. Study`): 00 Primitive, 01 Rendering(메시·머티리얼·라이트), 02 Transform, 03 Solar System, 04 Physics, 05 Terrain, 06 Mini Golf, 07 External Assets, 08 Skinned Mesh, 09 Rotation, 10 Cinemachine, 11 Vector Math, 12 Camera Control, 13 Sound, 14 Animation, 15 Navigation, 16 Game Systems(대화·드롭·퀘스트), 17 FPS Game(보스전).
- **이미 있는 셰이더**: `00. Study/14. Animation/Shaders/SimpleUnlitToon.shader`(`Jay/URP/SimpleUnlitToon`). `Outline` 패스(`SRPDefaultUnlit`, `Cull Front`)와 `UnlitBase` 패스(`UniversalForward`)의 2패스 구성이라 뒤집은 껍데기(inverted hull) 외곽선을 이미 가르친다. 속성은 `_OutlineColor`, `_OutlineWidth`. 갤러리의 `toon-ramp-lit`과 `inverted-hull-outline`은 이것과 겹치므로 확장편으로 위치를 잡는다.
- **외부 에셋의 셰이더 그래프**: FORGE3D Sci-Fi Effects(`Additive`, `AlphaBlended`, `HeatDepthFixed`, `Holographic`), Synty PolygonApocalypse(`POLYGON_Triplanar`, `POLYGON_Zombies`). 홀로그램, 열 왜곡, 삼평면 투영이 이미 에셋으로 들어와 있다는 뜻이다. 수강생은 원리 없이 쓰고 있을 가능성이 높다.
- **렌더 설정**: PC는 Depth/Opaque Texture를 켜고, Mobile은 끈다. 깊이·씬 컬러를 쓰는 표본은 URP 에셋 설정 단계를 프롬프트에 넣어야 한다.
- **문서 체계**: `Docs/Specs/_Conventions.md`가 교안 규칙의 단일 출처다. 이 연구에서는 읽지 않았다.

## 4. 5000-Unity-XR

- **수업 흐름** (`Assets/00. Study`): 00 XR Basics, 01 Lake Shader, 02 Rod IK, 03 Casting And Line, 04 Reel And Fish, 05 VR Lake, 06 VR Avatar, 07 Netcode Basics, 08 Multiplayer Fishing, 09 MR Passthrough, 10 MR Portal, 11 MR Room, 12 MR Anchors. 주제는 VR 낚시 → 멀티플레이 → MR이다.
- **이미 있는 셰이더** (전부 HLSL, URP, 한국어 주석)
  - `01. Lake Shader`: `LakeWater_Step1~6`, `WaterCommon.hlsl`. 6단계가 노멀맵 두 장 스크롤이고 파동, 프레넬, 반사까지 단계별로 쌓는다. `05. VR Lake`에 Step7이 있다.
  - `04. Reel And Fish/FishSwim.shader`: 리그 없는 물고기를 몸통 축의 사인파로 흔드는 정점 애니메이션. 위상은 C#이 쌓아서 넘긴다.
  - `04. Reel And Fish/LineTensionColor.shader`: C#이 넘긴 `_Tension`으로 색을 섞고 한계 근처에서 깜빡인다.
  - `10. MR Portal/Caustics.shader`: 텍스처 없는 보로노이로 물속 빛 무늬를 만든다. `positionWS.xz`로 투영한다.
  - `10. MR Portal/PortalMask.shader`: 스텐실로 구멍 면을 만들고 안쪽 물체는 스텐실이 있는 곳에만 그린다.
  - `11. MR Room/Occlusion.shader`: 색은 쓰지 않고 깊이만 써서 실제 가구 뒤의 가상 물체를 가린다.
  - XRI Starter Assets: `Interactable.shadergraph`, `Unlit_Fresnel.shadergraph`, `BiRP_Fresnel.shader`, `TunnelingVignette.shader`와 `TunnelingVignetteSG.shadergraph`(+ 프리팹·머티리얼), `UI-NoZTest.shader`.
- **함의 1: 물·정점 흔들기·스텐실·깊이 가림은 이미 수업에 있다.** 갤러리가 같은 것을 새로 만들면 중복이다. 확장(깊이 기반 물거품, 바람 흔들림 일반화, 벽 뒤 실루엣)이나 링크로 처리한다.
- **함의 2: 프레넬과 터널링 비네트는 XRI 샘플로 이미 접한다.** 갤러리는 "원리와 프롬프트"를 제공한다.
- **스테레오**: 위 수업 셰이더가 `UNITY_VERTEX_INPUT_INSTANCE_ID`, `UNITY_VERTEX_OUTPUT_STEREO`, `UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX`를 쓴다(예: `LakeWater_Step6.shader`). 래퍼 `.shader`가 이 매크로를 포함하면 core.hlsl은 영향받지 않는다. 전체 화면 패스는 소스 텍스처가 배열이 되므로 별도 매크로가 필요하다(Unity 문서, `sources-by-effect.md` 0절).
- **모바일 XR 설정**: Mobile URP 에셋은 HDR 끔, MSAA 4, Depth/Opaque Texture 꺼짐. Unity 문서는 untethered 기기에서 이 두 텍스처를 끄라고 권한다. 깊이·씬 컬러 표본에는 XR 비용 경고가 필요하다.

## 5. 갤러리 설계에 주는 결론

1. 스프라이트 셰이더는 2D Renderer 기준으로 쓴다. 최소 요구: `Universal2D`(2D 라이트를 받으려면 `NormalsRendering`까지) 패스 구성, 인스턴스 머티리얼 또는 SRP Batcher 호환 속성, 1~2px 패딩 가정.
2. 2D 쪽은 Opaque Texture 의존 표본(굴절, 충격파, 배경 블러)을 피하거나 Camera Sorting Layer Texture 대안을 같이 적는다.
3. 수업에서 상용 에셋으로 쓰는 효과(피격, 디졸브, 홀로그램, 열 왜곡, 삼평면)가 갤러리의 가치가 큰 영역이다. "왜 이렇게 동작하는지"와 "AI에게 어떻게 시키는지"를 준다.
4. 수업에 이미 있는 효과(물결, 정점 사인, 스텐실 포털, 깊이 가림, 프레넬 하이라이트, 터널링 비네트, inverted hull 외곽선)는 확장·링크로 처리하고 새로 만드는 것처럼 보이지 않게 한다.
5. XR 대상 표본은 모두 URP 에셋 설정(깊이·씬 컬러), 스테레오 매크로, 모바일 비용을 표시한다.
