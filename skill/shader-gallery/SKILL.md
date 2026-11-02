---
name: shader-gallery
description: "Unity URP 에 게임 셰이더 효과를 넣거나 변형하거나 고칠 때 쓴다. Unity 6.3 LTS, URP 17.3, HLSL 코드 셰이더 기준의 검증된 샘플과 설정 순서가 들어 있다. 포함된 효과: 램프 툰 조명(Toon Ramp Lit), 프레넬 림 빛(Fresnel Rim Glow), 삼평면 투영(Triplanar Projection), 씬 컬러 굴절 유리(Screen Refraction Glass), 디졸브(Dissolve Edge Glow), 껍데기 외곽선(Inverted Hull Outline), 가려진 실루엣(X-ray Occluded Silhouette), 깊이 기반 물가 거품(Water Depth Foam), 바람 흔들림(Wind Sway Foliage), 플로 맵 액체(Flow Map Liquid), 젖음과 눈 쌓임(Surface Wetness and Snow), 역장 교차(Force Field Intersection), 충격파 왜곡(Screen Shockwave Distortion), 홀로그램(Hologram Scanline Glitch), 스크롤·왜곡 에너지(Scroll Distort Energy), 스프라이트 외곽선 + 피격 번쩍임(Sprite Outline & Hit Flash), 팔레트 스왑(Palette Swap (LUT)), 타일 스크롤 패럴랙스(Tiling Scroll Parallax), SDF 도형(UI SDF Shape), 광택 훑기(UI Sheen Sweep), 배경 블러 유리(UI Backdrop Blur), 화면 전환 와이프(Screen Transition Wipe), 깊이·법선 윤곽선 후처리(Depth Normal Edge Outline), 화면 비네트(Screen Vignette). 비슷한 효과를 새로 만들 때도 기준 코드로 삼는다."
license: MIT
compatibility: Unity 6.3 LTS (6000.3), Universal Render Pipeline 17.3
metadata:
  version: "0.1.0"
  source: "Shader Gallery"
---

# Shader Gallery

사용자가 Unity 셰이더 효과를 요청하면 아래 목록에서 가장 가까운 효과를 고르고, 그 효과의 `references/<id>/guide.md` 만 읽는다. 다른 효과의 자료는 읽지 않는다.

## 효과 목록

| ID | 효과 | 무대 | 설명 |
|---|---|---|---|
| `toon-ramp-lit` | 램프 툰 조명 | 메시 | 빛의 밝기를 단계로 끊어 만화풍 음영을 만든다 |
| `fresnel-rim-glow` | 프레넬 림 빛 | 메시 | 비스듬히 보이는 가장자리만 밝힌다 |
| `triplanar-projection` | 삼평면 투영 | 메시 | UV 없이 세 축에서 텍스처를 투영한다 |
| `screen-refraction-glass` | 씬 컬러 굴절 유리 | 깊이 사용 | 투명 표면 뒤 장면을 휘어 보여 준다 |
| `dissolve-edge-glow` | 디졸브 | 메시 | 노이즈와 임계값으로 물체를 태워 없앤다. 사망, 소환, 텔레포트 연출의 기본 |
| `inverted-hull-outline` | 껍데기 외곽선 | 메시 | 조금 키운 껍데기의 뒷면을 한 번 더 그려 외곽선을 만든다 |
| `xray-occluded-silhouette` | 가려진 실루엣 | 메시 | 벽 뒤에 가려진 부분만 단색으로 덧그린다 |
| `water-depth-foam` | 깊이 기반 물가 거품 | 깊이 사용 | 물체와 만나는 곳에 거품 띠를 그린다 |
| `wind-sway-foliage` | 바람 흔들림 | 메시 | 정점을 높이에 따라 흔들어 바람을 만든다 |
| `flow-map-liquid` | 플로 맵 액체 | 메시 | 방향 텍스처로 UV 를 흘려 액체를 만든다 |
| `surface-wet-snow` | 젖음과 눈 쌓임 | 메시 | 윗면에 젖은 느낌이나 눈을 얹는다 |
| `force-field-intersection` | 역장 교차 | 깊이 사용 | 투명한 보호막이 다른 물체와 닿는 선을 깊이 비교로 밝힌다 |
| `screen-shockwave-distortion` | 충격파 왜곡 | 전체 화면 | 퍼지는 고리 모양으로 화면을 왜곡한다 |
| `hologram-scanline-glitch` | 홀로그램 | 메시 | 스캔라인과 글리치로 홀로그램을 만든다 |
| `scroll-distort-energy` | 스크롤·왜곡 에너지 | 메시 | 흐르는 무늬를 겹쳐 레이저와 마법 기운을 만든다 |
| `sprite-outline-hit-flash` | 스프라이트 외곽선 + 피격 번쩍임 | 스프라이트 | 이웃 픽셀 알파로 외곽선을 그리고, 맞은 순간 단색으로 번쩍였다 돌아온다 |
| `palette-swap-lut` | 팔레트 스왑 | 스프라이트 | 이미지 한 장으로 색 변형을 만든다 |
| `tiling-scroll-parallax` | 타일 스크롤 패럴랙스 | 스프라이트 | UV 오프셋으로 끝없는 배경을 스크롤한다 |
| `ui-sdf-shape` | SDF 도형 | 스프라이트 | 거리장으로 해상도와 상관없이 매끈한 도형을 그린다 |
| `ui-sheen-sweep` | 광택 훑기 | 스프라이트 | 버튼 위를 빛 띠가 주기적으로 지나간다 |
| `ui-backdrop-blur` | 배경 블러 유리 | 깊이 사용 | 패널 뒤 화면을 흐리게 비춘다 |
| `screen-transition-wipe` | 화면 전환 와이프 | 전체 화면 | 진행값과 순서 값을 비교해 화면을 덮고 걷는다. 원, 대각선, 마름모 격자를 한 셰이더로 |
| `depth-normal-edge-outline` | 깊이·법선 윤곽선 후처리 | 전체 화면 | 깊이와 법선 차이로 전체 화면에 윤곽선을 그린다 |
| `screen-vignette` | 화면 비네트 | 전체 화면 | 화면 가장자리를 어둡게 하거나 붉게 한다 |

## 진행 순서

1. `references/<id>/guide.md` 를 읽는다.
2. 같은 폴더의 `.shader`, `core.hlsl`, C#, PNG 파일을 프로젝트의 `Assets/Shaders/<id>/` 에 그대로 복사한다.
3. guide 의 넣는 순서대로 머티리얼과 렌더러 설정을 안내하거나 적용한다.
4. 사용자가 다른 모습을 원하면 효과 본체인 `core.hlsl` 을 고친다. `.shader` 는 새 속성을 넣거나 패스 설정이 달라질 때만 고친다.
5. 새 머티리얼 값은 `Properties` 와 `CBUFFER_START(UnityPerMaterial)` 양쪽에 넣는다.
6. guide 의 확인 방법을 사용자에게 알려 준다.

## 지킬 것

- `HLSLPROGRAM` 과 URP 패키지(`Packages/com.unity.render-pipelines.universal`, `com.unity.render-pipelines.core`)의 include 만 쓴다. `CGPROGRAM`, `UnityCG.cginc`, Surface Shader 는 쓰지 않는다.
- SRP Batcher 호환을 유지한다. 머티리얼 값은 모두 `CBUFFER_START(UnityPerMaterial)` 안에 둔다.
- 렌더 패스를 새로 만들어야 하면 Render Graph(`RecordRenderGraph`)로 작성한다. `Execute`, `OnCameraSetup`, `cmd.Blit` 같은 구버전 렌더 패스 API 는 쓰지 않는다.
- `SG_STEP` 줄, `#ifdef SG_OFF` 블록, 주석의 웹 미리보기 언급은 갤러리에서 쓰는 표시다. Unity 에서는 아무 일도 하지 않는다. 이 프로젝트에는 웹 미리보기가 없으니 웹 쪽 수정이나 주의 사항은 적지 않는다.

## 파일을 다룰 때

- `SG_STEP(...)` 줄과 `#ifdef SG_OFF` 블록은 웹 갤러리의 단계 보기와 효과 끄기에 쓰는 표시다. Unity 에서는 아무 일도 하지 않으므로 그대로 두어도 되고 지워도 된다.
- `SG_OUTLINE`, `SG_OCCLUDED` 는 다르다. 외곽선이나 가려진 실루엣이 있는 효과에서 Unity 가 실제로 쓰는 스위치다. 두 번째 패스의 `#define` 과 패스마다 하는 `core.hlsl` include 를 지우거나 합치지 않는다.
- 표에 없는 효과는 가장 비슷한 효과의 `.shader` 를 틀로 삼아 새로 만든다.
