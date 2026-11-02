---
name: shader-gallery
description: "Unity URP 에 게임 셰이더 효과를 넣거나 변형하거나 고칠 때 쓴다. Unity 6.3 LTS, URP 17.3, HLSL 코드 셰이더 기준의 검증된 샘플과 설정 순서가 들어 있다. 포함된 효과: 디졸브(Dissolve Edge Glow), 역장 교차(Force Field Intersection), 스프라이트 외곽선 + 피격 번쩍임(Sprite Outline & Hit Flash), 화면 전환 와이프(Screen Transition Wipe). 비슷한 효과를 새로 만들 때도 기준 코드로 삼는다."
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
| `dissolve-edge-glow` | 디졸브 | 메시 | 노이즈와 임계값으로 물체를 태워 없앤다. 사망, 소환, 텔레포트 연출의 기본 |
| `force-field-intersection` | 역장 교차 | 깊이 사용 | 투명한 보호막이 다른 물체와 닿는 선을 깊이 비교로 밝힌다 |
| `sprite-outline-hit-flash` | 스프라이트 외곽선 + 피격 번쩍임 | 스프라이트 | 이웃 픽셀 알파로 외곽선을 그리고, 맞은 순간 단색으로 번쩍였다 돌아온다 |
| `screen-transition-wipe` | 화면 전환 와이프 | 전체 화면 | 진행값과 순서 값을 비교해 화면을 덮고 걷는다. 원, 대각선, 마름모 격자를 한 셰이더로 |

## 진행 순서

1. `references/<id>/guide.md` 를 읽는다.
2. 같은 폴더의 `.shader`, `core.hlsl`, C# 파일을 프로젝트의 `Assets/Shaders/<id>/` 에 그대로 복사한다.
3. guide 의 넣는 순서대로 머티리얼과 렌더러 설정을 안내하거나 적용한다.
4. 사용자가 다른 모습을 원하면 효과 본체인 `core.hlsl` 을 고친다. `.shader` 는 새 속성을 넣거나 패스 설정이 달라질 때만 고친다.
5. 새 머티리얼 값은 `Properties` 와 `CBUFFER_START(UnityPerMaterial)` 양쪽에 넣는다.
6. guide 의 확인 방법을 사용자에게 알려 준다.

## 지킬 것

- `HLSLPROGRAM` 과 URP 의 `Packages/com.unity.render-pipelines.universal/ShaderLibrary` 만 쓴다. `CGPROGRAM`, `UnityCG.cginc`, Surface Shader 는 쓰지 않는다.
- SRP Batcher 호환을 유지한다. 머티리얼 값은 모두 `CBUFFER_START(UnityPerMaterial)` 안에 둔다.
- 렌더 패스를 새로 만들어야 하면 Render Graph(`RecordRenderGraph`)로 작성한다. `Execute`, `OnCameraSetup`, `cmd.Blit` 같은 구버전 렌더 패스 API 는 쓰지 않는다.

## 파일을 다룰 때

- `SG_STEP(...)` 줄과 `#ifdef SG_OFF` 블록은 웹 갤러리의 단계 보기와 효과 끄기에 쓰는 표시다. Unity 에서는 아무 일도 하지 않으므로 그대로 두어도 되고 지워도 된다.
- 표에 없는 효과는 가장 비슷한 효과의 `.shader` 를 틀로 삼아 새로 만든다.
