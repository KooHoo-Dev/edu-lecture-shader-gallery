# 표본 제작 가이드 (규격 v1)

셰이더 표본 하나를 새로 만들 때 따르는 규칙과 절차. 이 문서와 기준 샘플 4개만 보고 만들 수 있어야 한다. 빠진 내용을 발견하면 추측하지 말고 작업 결과에 적는다.

| 기준 샘플 | 무대 | 먼저 볼 점 |
|---|---|---|
| [`dissolve-edge-glow`](../Assets/Shaders/dissolve-edge-glow) | 메시 | 잘라 내기(cutout)와 보조 패스 3개, 노이즈, 자동 데모 |
| [`sprite-outline-hit-flash`](../Assets/Shaders/sprite-outline-hit-flash) | 스프라이트 | 패스 2개, `SG_TEX`, 이벤트, 머티리얼 복사본 C# |
| [`force-field-intersection`](../Assets/Shaders/force-field-intersection) | 깊이 사용 | `depthDelta`, 더하기 혼합, `requires`, `flashes` |
| [`screen-transition-wipe`](../Assets/Shaders/screen-transition-wipe) | 전체 화면 | `sgSource`, `select` 속성, 씬 전환 코루틴 |

새 표본은 **무대가 같은 샘플의 폴더를 복사해 시작**한다. `.shader` 래퍼는 표본끼리 거의 같다.

## 1. 큰 그림

브라우저는 HLSL 을 실행하지 못한다. 미리보기와 실제 결과가 갈리지 않도록 **효과 본체를 공통 문법의 `core.hlsl` 하나로** 쓰고 양쪽이 같은 파일을 읽는다.

- Unity: `.shader` 래퍼가 `core.hlsl` 을 include 한다. 조명, 깊이, 씬 색상처럼 Unity 전용인 값은 래퍼가 계산해 `SgInput` 으로 넘긴다.
- 웹: 앱이 호환 매크로와 `SgInput` 을 앞에 붙이고, 무대에 맞는 `main()` 을 뒤에 붙여 WebGL2 로 컴파일한다. 표본에 React 코드나 웹 전용 코드는 없다.

표본 하나는 다음 파일이 전부다.

```text
Assets/Shaders/<id>/core.hlsl          효과 본체. 공통 문법만
Assets/Shaders/<id>/<Name>.shader      Unity 래퍼
Assets/Shaders/<id>/<Name>...cs        C# 스크립트 (값을 움직이는 표본만)
Assets/Shaders/<id>/*.png              표본 전용 텍스처 (필요할 때만, 직접 생성)
Assets/Shaders/<id>/*.meta             Unity 가 만든다. 함께 커밋
Assets/Shaders/<id>.meta               폴더의 .meta. 역시 Unity 가 만든다
web/src/specimens/<id>/meta.ts         글, 조절 값, 프리셋, 단계, 프롬프트 재료
web/src/shots/<id>/<상태>.webp         Unity 실측 스크린샷 (도구가 만든다)
```

- `<id>` 는 **영구 불변** kebab-case 영어. 폴더 이름과 `meta.id` 가 같아야 한다.
- `<Name>` 은 ID 를 PascalCase 로 바꾼 것 (`force-field-intersection` -> `ForceFieldIntersection`). 파일 이름은 `<Name>.shader`, 셰이더 이름은 `Shader "ShaderGallery/<Name>"`.
- **폴더 하나만 복사하면 동작해야 한다.** 다른 폴더의 파일을 include 하지 않는다. 노이즈 같은 헬퍼는 3-3절에서 복사해 넣는다.
- 맡은 폴더 밖(`web/src/app`, `web/src/core`, `web/src/stage`, `tools`, 다른 표본, `skill/`)은 고치지 않는다. 공통 기능이 필요하면 9절대로 요청으로 남긴다. `skill/` 은 생성물이라 표본들을 합치는 단계에서 다시 만든다.

## 2. 새 표본 만드는 순서

1. 같은 무대의 샘플 폴더를 `Assets/Shaders/<id>/` 로 복사한다. `.meta` 파일은 지우고, `.cs` 는 지우거나 파일 이름과 클래스 이름을 새 표본에 맞게 바꾼다. 같은 이름의 클래스가 둘이면 Unity 프로젝트 전체의 컴파일이 멈춘다. `.shader` 파일 이름도 `<Name>.shader` 로 바꾼다.
2. `core.hlsl` 을 쓴다 (3절). 단계마다 `SG_STEP`, 흔한 실수를 `SG_OFF` 로 넣는다.
3. `.shader` 의 셰이더 이름, `Properties`, `CBUFFER` 를 고친다 (4절). 나머지는 그대로 둔다.
4. `web/src/specimens/<id>/meta.ts` 를 쓴다 (5절).
5. 검증한다 (8절). `node tools/check.mjs <id>` 부터 통과시킨다.
6. Unity 로 컴파일하고 촬영한다. 만든 `.meta` 가 리포로 회수된다.
7. 스크린샷을 내장 이미지로 바꾸고 화면을 눈으로 본다.

## 3. core.hlsl 규격

### 3-1. 파일 모양

```hlsl
// <효과 이름> 효과 본체. Unity 래퍼와 웹 미리보기가 이 파일을 그대로 함께 쓴다.

// SG_STEP: 웹의 '단계 보기'가 중간 결과를 꺼내는 표시. Unity 에서는 아무 일도 하지 않는다.
#ifndef SG_STEP
#define SG_STEP(n, rgb)
#endif

float effectHelper(float3 p) { ... }   // 헬퍼 이름 앞에 효과 이름을 붙인다. Unity 라이브러리와 충돌을 막는다

float4 sgEffect(SgInput i)
{
    // 1. 첫 단계 설명
    float a = ...;
    SG_STEP(1, float3(a, a, a));

#ifdef SG_OFF
    // 흔한 실수: 왜 나쁜지 한 줄
    return float4(...);
#endif

    // 2. 다음 단계 설명
    ...
    SG_STEP(2, float3(b, b, b));

    // 최종: 합치기
    return float4(color, alpha);
}
```

- `SG_STEP(n, rgb)`: 웹에서 `n` 단계를 고르면 그 자리에서 `rgb` 를 그대로 출력한다. `n` 은 1부터 차례로, `meta.steps` 의 `n` 과 하나씩 맞아야 한다. 2~5단계. 단계가 곧 수업의 해설이므로 처음 보는 사람이 원리를 따라갈 수 있게 나눈다.
  - 단계 출력도 화면에 나갈 때 sRGB 로 바뀐다. 0~1 값의 어두운 쪽이 밝게 보여 0.2 도 꽤 회색이다. `body` 는 "0 은 검정" 처럼 숫자로 쓰지 말고 `live.mjs` 로 찍은 화면에 보이는 대로 쓴다.
- `SG_OFF`: 웹의 '효과 끄기' 때만 컴파일되는 분기. 효과가 빠진 모습이나 **흔한 실수를 재현한 나쁜 예**를 돌려준다. 그냥 안 보이는 것은 안 된다. Unity 에서는 컴파일되지 않으므로 공통 문법 위반이 숨기 쉽다. 이 분기도 `tools/check.mjs` 가 WebGL 로 컴파일한다.
- 머티리얼 값(`_Threshold` 등)은 인자로 받지 않고 전역 이름 그대로 쓴다. 래퍼의 `CBUFFER` 와 웹이 만드는 유니폼이 같은 이름이다.
- 주석은 한국어로 왜 그렇게 하는지 쓴다. 웹은 주석을 지우고 컴파일한다.
- `sgEffect` 가 돌려주는 알파의 뜻은 무대가 정한다 (4절).

### 3-2. 공통 문법

HLSL 로 쓰되 GLSL ES 3.00 으로도 그대로 뜻이 같은 것만 쓴다. 왼쪽을 쓰면 **컴파일이 안 되거나, 더 나쁘게는 양쪽 결과가 달라진다.** `tools/check.mjs` 가 대부분 잡는다.

| 쓰지 않는다 | 이유 | 대신 |
|---|---|---|
| `1`, `0` 을 실수 자리에 | GLSL 은 암시적 형변환 없음 | `1.0`, `0.0` |
| `float3 v = 1.0;` | GLSL 은 스칼라를 벡터로 승격 안 함 | `float3(1.0, 1.0, 1.0)` |
| `float3(1.0)` | HLSL 은 인자 수가 맞아야 함 | `float3(1.0, 1.0, 1.0)` |
| `(float)x` | GLSL 에 없음 | `float(x)` |
| `1.0f` | 표기 통일 | `1.0` |
| `half`, `fixed` | GLSL 에 없음 | `float` |
| `mul`, `float2x2` 등 행렬 | 행렬 순서가 반대 | 아래 헬퍼의 2D 회전. 3D 변환은 래퍼에서 |
| `%`, `fmod`, `mod` | 음수 결과가 다르거나 한쪽에 없음 | `x - y * floor(x / y)` |
| `float a[3] = {...}` | 초기화 문법이 다름 | 원소를 하나씩 대입하거나 `if` |
| 구조체 생성자 `S(1.0, 2.0)` | HLSL 에 없음 | 필드를 하나씩 대입 |
| 벡터 조건 `v > 0.5 ? a : b` | GLSL 은 스칼라 조건만 | `lerp(b, a, step(0.5, v))` |
| `any`, `all`, `v1 == v2` | 인자 형식이 다름 | 필드별 비교 |
| 스칼라 스위즐 `f.xxx` | GLSL 에서 오류 | `float3(f, f, f)` |
| `static`, 전역 `const` | HLSL 과 GLSL 의 뜻이 다름 | `#define EFFECT_CELLS 8.0`. 함수 안의 `const float` 는 괜찮다 |
| `#include`, `#pragma`, `clip`, `discard` | 래퍼와 앱의 일 | 알파를 돌려주면 래퍼가 처리 |
| `_Time`, `unity_*`, `UNITY_*`, `_WorldSpaceCameraPos` | Unity 전용 | `SgInput` 으로 받는다 |
| `texture`, `tex2D`, `SAMPLE_TEXTURE2D` | 한쪽 전용 | `SG_TEX(이름, uv)` |

앱이 바꿔 주므로 그냥 써도 되는 것: `float2~4`, `lerp`, `frac`, `saturate`, `atan2(y, x)`, `ddx`, `ddy`. 양쪽에 같은 이름으로 있는 것: `sin cos tan abs min max floor ceil step smoothstep clamp pow exp log sqrt length distance dot cross normalize reflect refract sign round fwidth`.

**이름으로 쓰면 안 되는 단어.** 한쪽의 예약어다: `input output common partition active filter sample texture flat smooth centroid noperspective line point triangle pass technique register packoffset linear string vector matrix dword shared snorm unorm precision highp mediump lowp attribute varying class template this namespace union enum typedef long short double interface external uniform buffer sampler mix fract`.

### 3-3. 복사해서 쓰는 헬퍼

필요한 것만 `core.hlsl` 에 복사해 이름 앞에 효과 이름을 붙인다.

```hlsl
// 음수에서도 항상 0 이상을 돌려주는 나머지 (GLSL 의 mod 와 같다)
float effectMod(float x, float y) { return x - y * floor(x / y); }

// 2D 회전. 행렬을 쓰지 않는다
float2 effectRotate(float2 p, float radians)
{
    float s = sin(radians);
    float c = cos(radians);
    return float2(p.x * c - p.y * s, p.x * s + p.y * c);
}

// 0~1 격자 난수 (2D)
float effectHash(float2 p)
{
    float3 q = frac(float3(p.x, p.y, p.x) * 0.1031);
    q = q + dot(q, q.yzx + 33.33);
    return frac((q.x + q.y) * q.z);
}

// 값 노이즈 (2D). 3D 판은 dissolve-edge-glow 참고
float effectNoise(float2 p)
{
    float2 cell = floor(p);
    float2 f = frac(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = effectHash(cell);
    float b = effectHash(cell + float2(1.0, 0.0));
    float c = effectHash(cell + float2(0.0, 1.0));
    float d = effectHash(cell + float2(1.0, 1.0));
    return lerp(lerp(a, b, f.x), lerp(c, d, f.x), f.y);
}
```

값 노이즈는 0.5 근처에 몰린다. 슬라이더 전 구간에서 변화가 보이도록 `saturate((n - 0.2) / 0.6)` 처럼 넓힌다.

### 3-4. 텍스처와 정점 변형

- 텍스처는 `SG_TEX(_MyTex, uv)` 로만 읽는다. `_MyTex_TexelSize` 도 쓸 수 있다. 래퍼에는 `Properties` 에 `_MyTex ("이름", 2D) = "white" {}`, 그 아래에 `TEXTURE2D(_MyTex); SAMPLER(sampler_MyTex);` 와 `#define SG_TEX(name, uv) SAMPLE_TEXTURE2D(name, sampler##name, uv)`, `CBUFFER` 안에 `float4 _MyTex_TexelSize;` 를 둔다. 텍스처 파일은 표본 폴더에 두고 `meta.stage.textures` 에 적는다. 텍스처는 `meta.params` 에 넣지 않는다. sRGB 를 끈 데이터 텍스처(`linear: true`)의 기본값은 `"gray"` 가 아니라 `"linearGrey"` 다. `"gray"` 는 sRGB 0.5 라 Linear 프로젝트에서 약 0.21 로 읽혀, 0.5 를 0 으로 쓰는 맵은 칸이 비었을 때 한쪽으로 쏠린다 (`tools/check.mjs` 가 잡는다). 임포트 설정은 촬영 도구가 맞춘다. PNG 는 프롬프트에 넣을 수 없어 Skill zip 으로 전달되므로 `unity.setup` 에 임포트 설정(sRGB, Wrap Mode, Filter Mode)을 적는다.
- PNG 는 `tools/textures/<이름>.mjs` 에 무늬를 코드로 쓰고 `node tools/gen-texture.mjs <이름>` 으로 만든다. 모듈 형식은 `tools/gen-texture.mjs` 머리말에 있고, 노이즈 같은 공용 도구는 `tools/lib/texture-kit.mjs` 에 있다. 표본 잡은 자기 모듈 경로를 `writePaths` 에 넣고 직접 쓴다. PNG 는 HTML 에 그대로 들어가므로 128 정도로 작게 둔다 (7절 용량 기준). 만든 PNG 는 Read 로 열어 눈으로 본다.
- 데이터 텍스처(`linear`)와 포인트 텍스처는 Unity 기본 압축(BC, ASTC)에서 값이 바뀐다. 촬영 도구는 압축하지 않고, '그대로 넣기' 프롬프트도 Compression None 단계를 자동으로 넣는다.
- 흐르는 무늬의 화면 속도는 오프셋 속도를 반복 횟수로 나눈 값이다. `uv * 2 + t * 1.3` 은 `uv + t * 0.6` 과 화면에서 거의 같은 빠르기로 흐른다. 크기가 다른 층을 다른 빠르기로 흘리려면 오프셋 속도를 반복 횟수만큼 곱해 두고 주석에 화면 속도를 적는다. 움직임을 말하는 단계 본문("재생하면 끓듯이")은 정지 화면으로 확인되지 않으므로 `live.mjs` 의 `burst` 연속 촬영 시트로 확인한다 (8절).
- 머티리얼의 Tiling, Offset 은 `stage.textures` 의 텍스처마다 `<이름>_ST` 로 쓸 수 있다 (xy 반복, zw 오프셋): `SG_TEX(_MyTex, i.uv * _MyTex_ST.xy + _MyTex_ST.zw)`. 래퍼는 `CBUFFER` 에 `float4 _MyTex_ST;` 를 두고 그 텍스처 속성에 `[NoScaleOffset]` 을 붙이지 않는다 (`tools/check.mjs` 가 확인). 그러면 수강생이 Inspector 의 Tiling, Offset 칸으로 바꿀 수 있다. 스프라이트·UI 의 `_MainTex` 는 `[PerRendererData]` 라 칸이 없으므로 `_MainTex_ST` 는 쓰지 않는다 (검사가 막는다). 웹은 Unity 새 머티리얼과 같은 (1, 1, 0, 0) 을 넘기고 조절 패널에는 칸이 없다. 그래서 무대에서 반복 횟수를 바꿔 보여야 하는 표본은 range 값을 따로 둔다 (`surface-wet-snow` 의 `_TilingU`, `_TilingV`). 반복 횟수는 `#define` 으로 고정하지 않는다. 구 UV 에 맞춘 비율은 큐브나 Plane 에서 늘어난다.
- 스프라이트의 `_MainTex` 크기는 `_MainTex_TexelSize` 를 믿을 수 없다 (렌더러 단위로 넘어와 머티리얼 버퍼와 어긋난다. 실제로 촬영에서 틀린 값이 나왔다). `i.texelSize` 를 쓴다.
- 정점을 움직이는 표본은 `core.hlsl` 에 다음 함수를 두고 `meta.stage.vertex = true` 로 한다. 메시와 깊이 무대에서 쓸 수 있다. 움직인 뒤의 오브젝트 공간 위치를 돌려준다.

  ```hlsl
  float3 sgVertex(float3 positionOS, float3 normalOS, float2 uv, float time) { ... }
  ```

  래퍼의 `vert` 에서 `float3 p = sgVertex(v.positionOS.xyz, v.normalOS, v.uv, _Time.y);` 로 받아 `v.positionOS` 대신 쓴다. 모든 패스의 `vert` 가 같아야 그림자가 맞는다. 웹은 `core.hlsl` 을 정점 단계에서도 컴파일하므로 `ddx`, `ddy`, `fwidth` 를 쓰는 코드는 `#ifndef SG_VERTEX_STAGE` 로 감싼다.

## 4. 무대 4종

앱과 Unity 촬영 도구가 같은 배치로 무대를 꾸민다. 표본은 무대를 꾸미지 않는다.

| 무대 (`stage.kind`) | 무대 내용 | `SgInput` 필드 | 쓰는 함수 | 기준 샘플 |
|---|---|---|---|---|
| `mesh` | 바닥과 물체 하나 (`stage.mesh`). Y 30도에서 시작해 천천히 돈다 (`quad`, `plane`, `grass`, `grid` 는 돌지 않는다) | `uv color positionOS positionWS normalOS normalWS viewWS lightDirWS lightColor lighting time` | | 디졸브 |
| `sprite` | 정사영 카메라, 드론 스프라이트(또는 `stage.textures._MainTex`), 2유닛 높이 | `uv color texelSize time` | `SG_TEX(_MainTex, uv)` | 스프라이트 |
| `depth` | 바닥, 상자, 공, 그 위를 덮는 물체 (`stage.mesh`). `plane` 이면 소품을 가르는 수면 높이에 놓인다 | `uv color positionOS positionWS normalOS normalWS viewWS cameraRightWS cameraUpWS screenUV depthDelta time` | `sgSceneColor(uv)`, `sgSceneDepth(uv)` | 역장 |
| `fullscreen` | 바닥, 상자, 공을 그린 화면 전체 | `uv aspect texelSize time` | `sgSource(uv)`, `sgSceneDepth(uv)`, `sgSceneNormal(uv)` | 전환 |

- `lighting` = `lightColor * saturate(dot(normalWS, lightDirWS)) + 환경광`. 대부분은 `albedo * i.lighting` 이면 된다. 툰처럼 빛을 직접 다루면 `lightDirWS`, `lightColor` 를 쓴다.
- `viewWS` 는 표면에서 카메라 쪽 방향. `normalWS`, `viewWS`, `normalOS` 는 정규화되어 있다.
- `positionWS`, `normalOS` 는 삼평면 투영처럼 월드와 오브젝트 공간을 고르는 표본용이다. 기준 샘플 래퍼에는 없으므로, 쓰는 표본은 래퍼의 `SgInput` 과 `Varyings` 에 넣고 정점에서 `normalOS` 를 넘긴다. 메시 무대는 돌기 때문에 월드 공간 무늬는 물체 위를 흐르고 오브젝트 공간 무늬는 물체에 붙는다.
- `depthDelta` = 씬 표면의 눈 깊이 - 이 픽셀의 눈 깊이 (미터). 눈 깊이는 카메라 정면 축 방향의 거리다 (시선 길이에 화면 중심에서 벗어난 각의 cos 을 곱한 값). 물체가 닿는 곳에서 0 에 가까워진다. 수직 깊이가 아니라 보는 각도에 따라 같은 물가에서도 값이 달라진다.
- 깊이 무대의 `color` 는 정점 색이다. 웹 무대는 항상 흰색(1)이고, 깊이 무대에 쓰는 UI 표본(`stage.ui`, 예: 배경 블러)의 Unity 래퍼는 Image 의 정점 색을 넣는다. 일반 깊이 표본은 쓰지 않는다.
- 메시 무대의 `color` 도 정점 색이다 (2026-11-03 추가). 웹은 항상 흰색이다. Particle System 의 Renderer 머티리얼로 쓰일 표본(불꽃, 연기)은 래퍼의 `Attributes` 에 `float4 color : COLOR` 를 두고 `i.color` 로 넘겨, core 에서 색과 알파에 곱한다. 그래야 Start Color 와 Color over Lifetime 이 먹고 파티클이 서서히 나타나고 사라진다. 쓰지 않는 표본은 `i.color = 1` 로 채우거나 필드를 두지 않아도 된다 (웹의 필드는 쓰지 않으면 무시된다).
  - **파티클 하나 띄우기 (표준 문장).** 새 Particle System 은 파티클을 계속 뿜어 Cone 모양으로 퍼지므로, 그대로 넣으면 같은 무늬 수십 장이 겹쳐 하얗게 뜬다. 파티클 표본의 `unity.setup` 에는 먼저 하나만 띄워 셰이더를 확인하는 단계를 다음 문장으로 넣는다 (메뉴 이름은 Unity 6.3 기준, 촬영으로는 확인하지 않았다):
    > `GameObject > Effects > Particle System` 으로 만든다. Main 모듈에서 Start Speed 를 0, Max Particles 를 1 로 두고, Shape 모듈의 체크를 끈다. Renderer 모듈의 Material 에 이 머티리얼을 넣는다. 파티클 하나가 제자리에 Start Size 크기로 카메라를 보고 서며, Start Lifetime(기본 5초)이 끝날 때마다 새로 나타난다. Color over Lifetime 을 켜고 그라데이션 양 끝의 알파를 0 으로 두면 그 주기로 나타났다 사라진다. 서 있는 물체(불꽃)는 Renderer 모듈의 Render Mode 를 Vertical Billboard 로 한다.

    여러 개를 띄우는 변형(Max Particles, Rate over Time, 퍼짐)은 `adaptIdeas` 나 `unity.pitfalls` 에 적는다. 래퍼가 정점 색과 UV 만 읽으면 Renderer 의 기본 Vertex Streams(Position, Normal, Color, UV)로 충분하다. 파티클마다 다른 값(무늬 어긋남 등)을 쓰려면 Custom Vertex Streams 가 필요하다.
- `stage.backlit: true` 면 해가 카메라 맞은편 낮은 곳(높이 15도, `Quaternion.Euler(15, 180, 0)`)에 있다 (mesh, depth 무대). 기본 해는 카메라 뒤 위쪽이라 평평한 면의 반사광이 카메라로 오지 않는다. 수면처럼 해 반짝임이 핵심인 표본만 쓴다. 바닥은 해를 비스듬히 받아 어두워지고, 소품 그림자는 카메라 쪽으로 길게 늘어진다.
- `fullscreen` 의 `uv` 는 왼쪽 아래가 (0, 0) 이고 위쪽이 1 이다. 화면비 보정은 `float2(aspect, 1.0)` 을 곱한다. `texelSize` 는 화면 한 픽셀의 uv 크기다 (Unity 래퍼는 `_ScreenSize.zw`).
- XR 에서 전체 화면 uv 의 (0.5, 0.5) 는 눈의 정면이 아니다. HMD 투영은 눈마다 비대칭이라 화면 중심을 쓰는 효과(비네트, 충격파 중심)는 두 눈에서 어긋날 수 있다. URP 내장 Vignette 는 투영 행렬로 이를 보정한다. XR 설명은 '실기기 미확인' 으로 쓰고 XRI 나 Volume 같은 보정된 대안을 먼저 권한다.
- 전체 화면 무대의 `sgSceneDepth(uv)` 는 그 픽셀의 눈 깊이(카메라 정면 축 방향 거리, 미터, 하늘은 먼 평면 100 근처), `sgSceneNormal(uv)` 는 월드 법선(하늘은 0)이다. 쓰면 `meta.requires` 에 `'depth'`, `'normals'` 를 넣고, 래퍼는 `DeclareDepthTexture.hlsl`, `DeclareNormalsTexture.hlsl` 을 include 한 뒤 core 앞에 다음을 둔다. 수강생은 Full Screen Pass 의 Requirements 에서 Depth, Normal 을 켠다 (촬영 도구도 같은 칸을 켠다. 웹과 Unity 를 법선 색과 깊이 줄무늬로 비교해 확인했다).

  ```hlsl
  // 직교 카메라는 깊이가 선형이라 LinearEyeDepth 를 쓰면 안 된다
  float sgSceneDepth(float2 uv)
  {
      float raw = SampleSceneDepth(uv);
      return unity_OrthoParams.w > 0.5 ? LinearDepthToEyeDepth(raw) : LinearEyeDepth(raw, _ZBufferParams);
  }
  float3 sgSceneNormal(float2 uv) { return SampleSceneNormals(uv); }
  ```

  법선을 읽는 래퍼는 `#pragma multi_compile_fragment _ _GBUFFER_NORMALS_OCT` 를 둔다 (Deferred 의 정확한 G-buffer 노멀은 8면체로 인코딩되어, 이 변형 없이 읽으면 매끈한 면에도 얼룩 선이 생긴다). Requirements 의 Normal 은 불투명 물체를 DepthNormals 패스로 한 번 더 그리는 프리패스를 강제하고 깊이도 그 패스에서 나온다. 그 패스가 없는 직접 만든 셰이더의 물체는 깊이와 법선 모두에서 빠진다. 이 점과 그 비용(불투명 물체를 한 번 더 그림)을 `unity.pitfalls` 에 적는다. 2D Renderer 는 법선 텍스처를 만들지 않는다 (소스 확인).
- `positionOS` 는 오브젝트 공간. `sphere` 반지름 0.5, `capsule`, `cylinder` 높이 2, `cube`, `quad` 한 변 1 (`quad` 는 카메라 쪽으로 서 있다), `plane` 은 XZ 로 누운 한 변 10 이다. `plane` 은 Unity 기본 메시라 정점 간격이 1 이다. 정점 변형은 그만큼 거칠다.
- Unity 기본 Plane 은 위에서 볼 때 UV 가 180도 돌아 있다. u 는 −X(카메라에서 보면 왼쪽), v 는 −Z(카메라 쪽)로 커진다. 웹도 같게 맞췄다 (촬영으로 확인). 텍스처 위쪽으로 흐르게 그린 맵은 기본 Plane 에서 카메라 쪽으로 흐르므로, UV 방향이 중요한 표본은 이 점을 `unity.pitfalls` 에 단정해서 적는다 (Y 180도 회전이나 Quad 로 맞춘다).
- 웹도 위치, 법선, 방향을 Unity 좌표로 넘긴다 (three.js 의 z 를 뒤집는다). 월드나 오브젝트 좌표로 만든 무늬와 방향(바람 방향 등)이 두 화면에서 같다. 웹 무대의 메시는 three.js 가 만든 것이라 정점 수가 Unity 기본 메시와 다르다. `cube`, `grass`, `grid` 만 같다. 정점을 미는 표본은 Unity 의 정점 간격을 기준으로 정한다.
- `grid` 는 앱이 웹과 Unity 에서 같게 만드는 촘촘한 평면이다 (`ShaderStage.ts`, `SgGrid.cs`). 크기(한 변 10)와 UV 방향은 Unity 기본 Plane 과 같고 칸만 100 × 100 이라 정점 간격이 0.1 이다. 두 무대 모두 y = 0.3 에 크기 1 로 놓여 카메라 아래를 지나 화면 아래쪽을 호수처럼 덮는다 (먼 가장자리 z = 5 가 화면 가운데 조금 위). 정점을 미는 수면처럼 기본 Plane 이 너무 성긴 표본에 쓴다. Unity 에는 이런 내장 메시가 없으므로, 쓰는 표본은 수강생이 촘촘한 평면을 얻는 방법(표본의 C# 로 메시를 만들거나 ProBuilder, DCC 툴)을 `unity.setup` 에 적는다. 웹과 Unity 를 UV 색 격자로 비교해 같은 것을 확인했다 (2026-11-03).
- `grass` 는 앱이 웹과 Unity 에서 같은 계산으로 만드는 풀 다발이다 (`web/src/stage/grass.ts`, `SgGrass.cs`). 잎 36장, 높이 0.7~1.2, 잎마다 세로 5칸, 뿌리가 y = 0, `uv.y` 는 뿌리 0 에서 끝 1, 법선은 잎의 앞쪽. 잎은 얇은 판이라 래퍼의 모든 패스를 `Cull Off` 로 하고 `stage.doubleSided: true` 로 둔다. 돌지 않으므로 오브젝트 공간 방향이 월드 방향과 같다.
- 스프라이트는 높이 2 유닛에 맞고 폭은 텍스처 비율을 따른다.
- `time` 은 초. 웹에서는 배속과 일시정지가 반영된다. `sin(time * 빠른 값)` 처럼 넓은 면이 깜빡이는 코드는 9절 안전 규칙을 본다.

### 알파의 뜻 (`stage.blend`)

| 값 | 웹 | Unity 래퍼 | 쓰는 곳 |
|---|---|---|---|
| `cutout` (mesh 기본) | 알파 0.5 미만 버림 | `clip(c.a - 0.5)`, `"Queue" = "AlphaTest"`, `"RenderType" = "TransparentCutout"`, `"LightMode" = "UniversalForwardOnly"` | 디졸브 |
| `alpha` (sprite, depth 기본) | 알파 혼합 | `Blend SrcAlpha OneMinusSrcAlpha`, `ZWrite Off`, `"Queue" = "Transparent"`, `"RenderType" = "Transparent"` | 스프라이트 |
| `additive` | 더하기 혼합 | `Blend SrcAlpha One`, `ZWrite Off`, 태그는 `alpha` 와 같다 | 역장 |
| (fullscreen) | 알파 무시 | 해당 없음 | 전환 |

**잘라 내기 메시의 그림자.** `mesh` 무대의 `cutout` 표본은 앱이 광원 쪽에서 `sgEffect` 를 한 번 더 돌려 그 알파로 바닥 그림자를 만든다 (Unity 의 `ShadowCaster` 패스에 해당). 구멍, 시간에 따른 변화, 정점 변형까지 따라오므로 표본이 따로 할 일은 없다. 단계 보기에서도 그림자는 최종 알파를 쓴다. 효과 끄기에서는 잘라 내기를 무시한 온전한 그림자가 나온다. 그림자 패스를 자르지 않는 흔한 실수이므로, 표본의 `SG_OFF` 와 `offNote` 는 이 모습과 어울리게 쓴다. `node tools/check.mjs <id>` 가 첫 자동 데모 트랙(없으면 첫 이벤트 트랙)을 양 끝으로 움직여, 평소에는 그림자가 따라 변하고 효과 끄기에서는 변하지 않는지 잰다. 알파를 자르지 않는 표본(마지막 `return` 의 알파가 `1.0`)은 값 변화 검사를 건너뛴다. `depth`, `fullscreen` 무대의 소품 그림자는 단순 근사이고, 투명 표본은 그림자를 만들지 않는 것이 맞다.

불투명 표본은 `blend: 'cutout'` 으로 두고 항상 알파 1.0 을 돌려준다. 투명 메시는 샘플이 없다. 역장의 래퍼에서 깊이 관련 줄을 빼고 `SgInput` 을 메시 형식으로 바꾼 뒤, `"LightMode" = "UniversalForward"` 패스 하나로 쓴다. 웹 쪽 입력은 `stage.kind` 를 따르므로 `kind: 'mesh'` 와 `blend` 를 함께 적는다. 양면을 그리면 래퍼에 `Cull Off`, 메타에 `stage.doubleSided: true` 를 둔다. 단계 보기는 혼합 없이 값을 그대로 보여 주고 그동안만 깊이를 써서 앞면이 보인다. 웹 무대는 투명 메시에 바닥 그림자를 그리지 않는다.

빛과 그림자를 받는 투명 메시(`GetMainLight(shadowCoord, ...)` 를 쓰는 수면 등)는 include 앞에 `#define _SURFACE_TYPE_TRANSPARENT 1` 을 둔다. URP Lit 의 투명과 같이 화면 공간 그림자 대신 그림자 맵을 직접 읽는다 (`water-wave-surface` 가 첫 선례). `ZWrite Off` 인 투명 메시는 한 메시 안에서 삼각형을 그리는 순서가 곧 앞뒤가 된다. 정점을 밀어 스스로 겹치는 메시(파도 마루가 뒤쪽 골을 가림)는 보는 방향에 따라 뒤쪽이 앞에 그려질 수 있으므로, 증상과 대처(변위 낮추기, `ZWrite On`)를 `unity.pitfalls` 에 적는다. `grid` 와 기본 Plane 은 +Z 쪽 행부터 그려 무대 카메라에서는 문제가 없다.

**안개.** 샘플 래퍼는 아직 안개를 처리하지 않는다. Fog 를 켠 씬에서 먼 물체가 그대로 보이므로, 넓은 공간에 쓰일 표본은 `unity.pitfalls` 에 적고 변형 예시로 처리 방법을 안내한다: 불투명과 알파 혼합은 `MixFog(color, fogFactor)`, 더하기 혼합은 안개 색 대신 0 으로 사라져야 하므로 `MixFogColor(color, half3(0, 0, 0), fogFactor)`. 둘 다 `#pragma multi_compile_fog` 와 정점의 `ComputeFogFactor(positionCS.z)` 가 필요하다.

### 래퍼 규칙

- `.shader` 에는 `HLSLPROGRAM` 과 URP `ShaderLibrary` 만 쓴다. **금지:** `CGPROGRAM`, `UnityCG.cginc`, Surface Shader, `cmd.Blit` 등 구버전 렌더 패스 API.
- 머티리얼 값은 전부 `CBUFFER_START(UnityPerMaterial)` 안에 둔다 (SRP Batcher). 텍스처 선언(`TEXTURE2D`, `SAMPLER`)은 밖에 둔다.
- 샘플의 XR 매크로(`UNITY_VERTEX_INPUT_INSTANCE_ID` 등)와 `#pragma multi_compile_instancing` 을 지우지 않는다. 수업 XR 프로젝트에서 쓴다.
- 메시 잘라 내기 표본은 `Forward`, `ShadowCaster`, `DepthOnly`, `DepthNormals` 네 패스를 모두 유지한다. 알파로 자르는 부분이 그림자와 깊이에 빠지면 사라진 자리에 그림자가 남는다. 투명 표본은 `Forward` 패스 하나면 된다.
- 빛을 받는 메시 래퍼는 디졸브처럼 `GetMainLight(TransformWorldToShadowCoord(positionWS), positionWS, half4(1, 1, 1, 1))` 로 주 광원을 받는다. 그림자 좌표만 넘기는 형식은 그림자 거리 페이드와 Shadowmask 가 빠져 Max Distance 에서 그림자가 선을 긋고 끊긴다 (`tools/check.mjs` 가 잡는다). `distanceAttenuation` 은 곱하지 않으므로(디졸브 주석 참고) 광원의 Culling Mask 와 Rendering Layers 가 무시된다. 래퍼를 복사할 때 이 주석을 지우지 않고 `unity.pitfalls` 에 한 구절로 적는다.
- 불투명, 잘라 내기 메시의 `Forward` 패스 태그는 `UniversalForwardOnly`, 노멀 패스 태그는 `DepthNormalsOnly` 다. `UniversalForward` 만 있으면 Deferred 렌더 경로에서 오류 없이 사라진다.
- 스프라이트 표본은 `Universal2D` 와 `UniversalForward` 두 패스를 유지한다. 2D Renderer 는 `Universal2D` 와 `SRPDefaultUnlit` 만 그리고 Universal Renderer 는 `UniversalForward` 만 그린다. 둘 다 촬영으로 확인했다.
- 메시, 깊이 표본의 패스는 2D Renderer 에서 그려지지 않는다 (`Universal2D`, `SRPDefaultUnlit` 만 그린다). 3D 프로젝트용이라고 `unity.pitfalls` 에 적는다. 예외로 외곽선 패스(`SRPDefaultUnlit`)는 그려지므로 외곽선 표본은 본체 없이 외곽선 색 덩어리만 보인다.
- 깊이 표본은 `DeclareDepthTexture.hlsl` 을 include 하고 `meta.requires` 에 `'depth'` 를 넣는다. 씬 색상을 쓰면 `DeclareOpaqueTexture.hlsl` 을 더 include 하고 다음을 `core.hlsl` include 앞에 두고 `requires` 에 `'opaque'` 를 넣는다.

  ```hlsl
  float4 sgSceneColor(float2 uv) { return float4(SampleSceneColor(uv), 1.0); }
  ```

  반복문 안에서 여러 번 읽느라 밉 0 으로 직접 샘플링하면 `SampleSceneColor` 가 하던 스케일·경계 처리를 같이 옮긴다: `uv = ClampAndScaleUVForBilinear(UnityStereoTransformScreenSpaceTex(uv), _CameraOpaqueTexture_TexelSize.xy);` 다음에 `SAMPLE_TEXTURE2D_X_LOD(_CameraOpaqueTexture, sampler_CameraOpaqueTexture, uv, 0)`. 빠지면 Dynamic Resolution 처럼 스케일이 1 보다 작을 때 가장자리에서 유효 영역 밖을 읽는다 (`tools/check.mjs` 가 경고).
- 깊이 무대의 `sgSceneDepth(uv)` 는 그 화면 좌표에 있는 씬 표면의 눈 깊이다. 이 픽셀의 눈 깊이는 `sgSceneDepth(i.screenUV) - i.depthDelta` 다. 화면 좌표를 밀어 읽는 표본(굴절)은 밀린 좌표의 깊이가 이 픽셀보다 앞이면 밀지 않은 좌표로 돌아가 앞 물체가 끌려 들어오지 않게 한다. 래퍼는 전체 화면과 같은 `sgSceneDepth` 함수(직교 카메라 분기 포함)를 core 앞에 둔다.
- 깊이 무대의 `cameraRightWS`, `cameraUpWS` 는 카메라의 오른쪽과 위 방향(월드)이다. 화면 좌표를 미는 방향은 월드 위쪽이 아니라 이 두 축으로 만든다 (그래야 카메라가 기울거나 내려다보거나 XR 일 때 맞다). 래퍼는 `i.cameraRightWS = UNITY_MATRIX_V[0].xyz; i.cameraUpWS = UNITY_MATRIX_V[1].xyz;` 를 넣는다.

- 전체 화면 표본은 C# 렌더러 기능을 새로 만들지 않는다. 내장 Full Screen Pass Renderer Feature 에 머티리얼을 넣는 방식만 쓴다. 2D Renderer 에서도 동작한다 (촬영으로 확인).

### UI 래퍼 (`stage.ui`)

UGUI Image 에 쓰는 표본용이다. 미리보기와 촬영은 스프라이트 무대 그대로지만 래퍼는 Unity 의 UI 셰이더 구조를 따른다. 기준 샘플이 아직 없으므로 첫 UI 표본(`ui-sdf-shape`)이 틀을 정하고 다음 UI 표본은 그 래퍼를 복사한다.

- 패스는 `LightMode` 태그 없이 하나다. Screen Space - Overlay 캔버스는 첫 패스를 쓰고, Camera·World Space 캔버스와 2D Renderer 는 이것을 `SRPDefaultUnlit` 으로 그린다.
- Unity 내장 UI/Default 셰이더의 구조를 HLSLPROGRAM 과 URP include 로 옮긴다: `[PerRendererData] _MainTex`, Stencil 속성(`_StencilComp`, `_Stencil`, `_StencilOp`, `_StencilWriteMask`, `_StencilReadMask`)과 Stencil 블록, `ColorMask [_ColorMask]`, `ZTest [unity_GUIZTestMode]`, `ZWrite Off`, `Cull Off`, 정점 색 곱, `#pragma multi_compile_local _ UNITY_UI_CLIP_RECT` 와 `_ClipRect` 클리핑, `UNITY_UI_ALPHACLIP`. `UnityUI.cginc` 는 쓸 수 없으므로 `UnityGet2DClipping` 은 래퍼에 직접 옮긴다 (`step` 두 번으로 사각형 안쪽을 구하는 몇 줄).
- Stencil 속성이 없으면 Mask 안에 넣었을 때 Unity 가 경고하고 가려지지 않는다. RectMask2D 클리핑이 없으면 스크롤 목록 밖으로 그림이 샌다. 둘 다 `unity.pitfalls` 에 증상으로 적는다.
- 혼합은 `blend: 'alpha'` 다. 직선 알파(`Blend SrcAlpha OneMinusSrcAlpha`)와 Unity UI/Default 같은 미리 곱한 알파(`Blend One OneMinusSrcAlpha` + `rgb *= a`) 모두 된다. Unity 에서 Image 에 머티리얼을 넣는 절차(Material 칸, 텍스처는 Image 의 Source Image)를 `unity.setup` 에 적는다. '그대로 넣기' 프롬프트는 `stage.ui` 이면 Image 에 넣는 단계를 자동으로 쓴다.
- Mask 는 마스크 그래픽의 머티리얼 복사본에 `UNITY_UI_ALPHACLIP` 을 자동으로 켠다. 그래서 알파 클립 코드가 있어야 도형 모양대로 가려지고, 없으면 사각형으로 가려진다.
- CanvasGroup 의 alpha 와 Button 의 색 전환은 정점 색으로 들어온다. core 가 `i.color` 를 꼭 곱한다.
- 캔버스의 Vertex Color Always In Gamma Color Space 를 켜면 정점 색이 sRGB 그대로 들어온다. `_UIVertexColorAlwaysGammaSpace` 를 `CBUFFER` 밖에 선언하고, Linear 프로젝트(`#ifndef UNITY_COLORSPACE_GAMMA`)에서 값이 1 이면 정점 색을 선형으로 바꾼다.
- 최근 UI/Default 는 RectMask2D 의 Softness(`_UIMaskSoftnessX`, `_UIMaskSoftnessY`)로 가장자리를 부드럽게 자른다. `step` 두 번으로 자르면 Softness 가 무시된다. 쓸 수 있으면 Softness 식으로 옮긴다.
- 지금 미리보기와 촬영은 정사각형 스프라이트 하나라 4:1 같은 Image 비율, Mask, RectMask2D, Overlay 캔버스를 화면으로 확인하지 못한다. 이 부분은 글로 정확히 쓰고 Unity 에서 확인하지 못했다고 보고한다.
- 씬 색상을 읽는 UI(배경 블러)는 Screen Space - Camera 캔버스를 권한다. URP 17.3 은 Overlay UI 도 카메라 렌더 그래프 안에서 그려 Opaque Texture 가 읽힐 수 있지만 보장되지 않고 확인하지 않았다 (읽혀도 투명 물체와 후처리가 빠진 복사본이라 색이 주변과 다르다). UI 전용 Overlay 카메라(카메라 스택)는 Opaque Texture 를 만들지 않는다. Unity 6.3 의 메뉴 이름은 `GameObject > UI (Canvas) > Image` 다.
- 깊이 무대에 둔 UI 패널(`mesh: 'quad'`)은 바닥에서 띄워 아래 모서리가 보이게 놓인다. 촬영 도구는 캔버스가 넣는 `unity_GUIZTestMode` 를 LessEqual 로 고정해 찍는다.
- `tools/check.mjs` 가 위 항목과 `LightMode` 가 없는지를 확인한다.

### 가려진 부분 패스 (`stage.occluded`)

벽 뒤에 가려진 부분만 덧그리는 표본용이다 (투시, 아군 표시). mesh, depth 무대에서만 쓴다. 무대가 카메라와 물체 사이에 벽을 세워 물체의 왼쪽 아래를 가린다. `mesh: 'capsule'` 이 캐릭터 대신으로 알맞다.

- `core.hlsl` 은 `#ifdef SG_OCCLUDED` 블록에서 가려진 부분의 색과 알파를 정한다. 단계 번호와 `SG_OFF` 는 두 패스에 함께 걸린다.
- 래퍼는 본체 패스들에 더해 `Tags { "LightMode" = "SRPDefaultUnlit" }`, `ZTest Greater`, `ZWrite Off`, `Blend SrcAlpha OneMinusSrcAlpha` 패스를 하나 둔다. 정점은 본체와 같고 `core.hlsl` 앞에 `#define SG_OCCLUDED` 를 둔다. core 를 패스마다 include 하는 방식은 외곽선 패스와 같다.
- Forward 와 Forward+ 의 불투명 그리기 목록은 `SRPDefaultUnlit` 가 첫째라 같은 물체의 실루엣 패스가 `UniversalForwardOnly` 본체보다 먼저 그려진다 (2026-11-02 촬영으로 확인. Forward+, Depth Priming 꺼짐, MSAA 꺼짐 설정에서). 그래서 본체 깊이가 아직 없을 때 실루엣이 그려져, 렌더러 하나짜리 캐릭터에서는 팔이 몸을 가리는 식의 자기 겹침이 생기지 않는다. 벽보다 늦게 그려지도록 본체는 잘라 내기 표본처럼 `"Queue" = "AlphaTest"` 에 둔다. 웹도 벽, 실루엣, 본체 순서로 그린다.
- 같은 LightMode 태그를 두 패스가 쓰면 URP 는 첫 패스만 그리므로 `stage.outline` 과 함께 쓸 수 없다.
- `unity.pitfalls` 에 적을 것 (URP 17.3 소스로 확인, 아래 둘째부터는 Unity 촬영으로 확인하지 않았다):
  - Depth Priming 이 켜지면 불투명 그리기 전체가 `ZTest Equal, ZWrite Off` 로 덮어써져 실루엣 패스의 `ZTest Greater` 가 무시되고 실루엣이 통째로 사라진다. 17.3 의 Auto 모드는 데스크톱에서 MSAA 가 꺼져 있으면 프리패스가 필요 없어도 프라이밍을 켤 수 있다. Depth Priming 이 꺼진 깊이 프리패스(SSAO 등)는 깊이 텍스처에만 그리므로 상관없다.
  - Deferred 의 Forward 전용 목록은 `UniversalForwardOnly, SRPDefaultUnlit` 순이라 본체가 먼저 그려질 수 있다 (추론). 그러면 볼록하지 않은 캐릭터는 팔 위에 뒤쪽 몸통의 실루엣이 칠해진다.
  - 렌더러나 서브메시가 여러 개인 캐릭터는 부위마다 실루엣과 본체가 따로 그려져, 먼저 그린 부위 위에 뒤 부위의 실루엣이 덮인다. 다른 큐의 무기나 모자도 같다. 이때는 Render Objects 방식(레이어 전체 실루엣을 먼저, 본체를 나중에)을 쓴다.
  - 실루엣은 깊이 버퍼만 비교하므로 Depth Texture 설정은 필요 없다.
- 머티리얼 하나로 끝나는 이 방식 대신 Universal Renderer 의 Render Objects 기능(레이어 마스크, Depth Test Greater, Override Material)으로 같은 효과를 내는 방법이 Unity 공식 예제에 있다. 캐릭터가 여럿이거나 팀마다 색이 다를 때의 변형으로 해설이나 `adaptIdeas` 에 적는다. 직접 쓰는 C# 렌더러 기능은 만들지 않는다.
- `meta.stage.occluded: true` 로 적는다. `tools/check.mjs` 가 블록, `#define`, 렌더 상태, 태그를 확인하고 실루엣 프로그램도 WebGL 로 컴파일한다.

### 외곽선 패스 (`stage.outline`)

껍데기 외곽선처럼 같은 물체를 한 번 더 그리는 표본용이다. mesh, depth 무대에서만 쓴다.

- `core.hlsl` 은 `#ifdef SG_OUTLINE` 블록에 외곽선 패스의 `sgVertex`(정점을 미는 함수)를 둔다. `sgEffect` 는 블록마다 따로 두어도 되고, 하나로 두고 `#ifdef SG_OUTLINE` 으로 색만 갈라도 된다.
- 단계 번호(`_SgStep`)는 두 패스에 함께 걸린다. 모든 단계가 본체와 외곽선 양쪽에서 말이 되게 정한다. `SG_OFF` 도 두 패스에 함께 걸린다.
- 래퍼는 `core.hlsl` 을 `HLSLINCLUDE` 가 아니라 패스마다 include 한다. 외곽선 패스만 include 앞에 `#define SG_OUTLINE` 을 둔다.
- 외곽선 패스는 `Tags { "LightMode" = "SRPDefaultUnlit" }`, `Cull Front`, 정점에서 `sgVertex` 를 부른다. URP 17.3 은 이 태그를 Forward, Deferred(Forward 전용 목록), 2D Renderer 모두에서 그린다 (패키지 소스 확인). 그림자와 깊이 패스는 본체만 둔다.
- 웹은 같은 메시를 자식으로 하나 더 두고 뒷면만 그린다. 외곽선은 그림자를 드리우지 않는다.
- `meta.stage.outline: true` 로 적는다. `tools/check.mjs` 가 블록, `#define`, `Cull Front`, 태그를 확인하고 외곽선 프로그램도 WebGL 로 컴파일한다.
- `unity.pitfalls` 에 적을 것 (리뷰 지적, Unity 에서는 아직 확인하지 않았다):
  - Universal Renderer 의 Depth Priming 이 켜지면 불투명 그리기 전체가 ZTest Equal 로 바뀌어, 깊이 프리패스(DepthOnly)에 없는 외곽선 패스가 통째로 사라질 수 있다. 17.3 의 Auto 모드는 데스크톱에서 MSAA 가 꺼져 있으면 켜질 수 있다 (소스 판단). 프라이밍이 꺼진 프리패스는 상관없다.
  - 깊이 텍스처에 외곽선이 들어가는지는 프리패스냐 불투명 뒤 깊이 복사냐에 따라 다르다. 노멀 텍스처에는 들어가지 않는다.

`positionOS` 를 쓰는 모든 표본은 `unity.pitfalls` 에 정적 배칭을 적는다. Batching Static 물체는 정점이 월드 좌표로 합쳐져 `positionOS` 가 월드 위치가 된다. 웹 `cube` 는 Unity 기본 큐브처럼 면을 나누지 않은 정점 24개다.

### 속성 형식 대응

`meta.params` 와 `.shader` 의 `Properties` 는 이름과 기본값이 같아야 한다. `tools/check.mjs` 가 대조한다.

| `meta.params[].type` | `.shader` Properties | CBUFFER | 셰이더에서의 값 |
|---|---|---|---|
| `range` | `_X ("이름", Range(0, 1)) = 0.5` | `float _X;` | 그대로 |
| `select` | `[Enum(Name0, 0, Name1, 1)] _X ("이름", Float) = 0` | `float _X;` | 0, 1, 2 (비교는 `_X > 0.5 && _X < 1.5` 처럼 범위로) |
| `toggle` | `[ToggleUI] _X ("이름", Float) = 1` | `float _X;` | 0 또는 1 |
| `color` | `_X ("이름", Color) = (1, 0.5, 0.2, 1)` | `float4 _X;` | 선형 색 (Unity 와 웹이 자동 변환) |

- `color` 는 `meta` 에 sRGB 16진수로 적는다. `.shader` 의 값은 그 16진수를 255 로 나눈 값이다 (`#ff8000` -> `(1, 0.502, 0, 1)`).
- HDR 은 `[HDR]` 대신 색과 밝기 값을 나눈다 (`_EdgeColor`, `_EdgeGlow`). 슬라이더 하나로 밝기를 조절할 수 있고, Bloom 이 없어도 색이 남게 기본값을 정한다.
- `Enum` 이름은 영어로 쓴다. `Properties` 표시 이름은 한국어로 쓴다.
- 트랙(이벤트, 자동 데모)은 `range` 값만 움직인다.

## 5. meta.ts 규격

타입은 [`web/src/core/types.ts`](../web/src/core/types.ts), 예시는 샘플의 `meta.ts`. 글은 수업에서 그대로 읽을 수 있게 한국어로 짧게 쓴다. `**굵게**`, `` `코드` ``, `[링크](https://...)`, `[표본](#/s/<id>)` 를 쓸 수 있다.

| 필드 | 규칙 |
|---|---|
| `id` `title` `titleEn` | 제목은 효과 이름. 게임명 금지 |
| `group` `order` | `docs/shader-selection.md` 의 그룹: A 재질, B 상태 피드백, C 자연, D VFX, E 2D, F UI, G 후처리 |
| `oneLiner` | 한 문장. 무엇을 하는 효과인지 |
| `goals` | 3~4개. "~할 수 있다" |
| `tags` | 쓰인 기법 2~5개 (노이즈, 깊이 텍스처 등). 검색과 필터에 쓴다 |
| `difficulty` | `shader-selection.md` 의 별 수 |
| `shaderFile` | `.shader` 파일 이름 |
| `stage` | 4절. `kind` 필수 |
| `requires` | URP Asset 에서 켜야 하는 것 (`depth`, `opaque`). 프롬프트의 설정 단계에 자동으로 들어간다 |
| `params` | 효과를 만드는 값. `key` 는 셰이더 속성 이름. 모든 값이 화면에 **눈에 띄는** 차이를 만들어야 한다. `hint` 로 무엇이 바뀌는지 적는다. select 값에 따라 셰이더가 쓰지 않는 값은 `showWhen: { key: '<select 키>', values: ['0'] }` 으로 그 선택에서만 보이게 한다 (Unity Inspector 에는 늘 보이므로 `hint` 에도 어느 선택에서 쓰는지 적는다) |
| `presets` | 2~5개. 쓰임새 이름 (게임명 금지). `values` 에는 기본값과 다른 것만 |
| `events` | 버튼으로 한 번 재생. C# 스크립트가 실제로 하는 일과 같게. `tracks` 의 `frames` 는 `[초, 값]` 목록. 트랙 값은 절대값이라 프리셋이나 슬라이더가 바꾸는 값을 움직이면 시작과 끝에서 튄다. 이벤트는 0 에서 올라갔다 0 으로 돌아오는 더하기용 전용 값(`_HitFlash`, `_Gust` 등)을 움직이고 셰이더가 기본 값에 더한다. C# 도 같은 값을 움직인다 |
| `demo` | 사람이 없어도 핵심 상황이 돌게. `loops` 는 반복 트랙, `fire` 는 일정 간격 이벤트 |
| `steps` | 2~5개. `n` 은 `SG_STEP` 번호. `body` 는 무엇을 보고 무엇을 이해해야 하는지. 앱이 최종 화면을 따로 보여 주므로 마지막 단계가 최종 화면과 같으면 넣지 않는다 |
| `offNote` | 효과를 끈 화면에서 무엇이 나쁜지 |
| `mistakes` | 3~5개. 수강생이 실제로 겪을 증상을 제목으로, 원인과 해결을 본문으로. '문제 해결' 프롬프트에 그대로 들어간다 |
| `unity.setup` | Unity 에 넣는 순서 2~7단계. 메뉴 이름을 정확히 |
| `unity.verify` | 잘 되었는지 확인하는 한 문장. 값을 움직이면 무엇이 보여야 하는지 |
| `unity.pitfalls` | 2~6개. 설정, 플랫폼, 렌더러 제약. 프롬프트에 들어간다 |
| `unity.graph` | Shader Graph 로 옮기는 법 (선택). Custom Function 노드는 `void 이름_float(입력..., out 출력)` 형식의 함수만 받는다. `core.hlsl` 을 File 모드로 통째로 지정하면 `SgInput` 과 머티리얼 값 선언이 없어 컴파일되지 않으므로, 필요한 함수만 String 모드로 복사해 감싸는 법을 쓴다 |
| `prompt.goal` | 프롬프트 첫 문장. 넣고 나면 무엇이 되는지 |
| `prompt.adaptIdeas` | 2~6개. 수강생이 실제로 원할 만한 변형. 첫 번째가 프롬프트 예시로 들어간다 |
| `captures` | 기본값 외에 더 찍을 상태. 표본당 3장 이내 (용량). 값이 다른 모습을 보여 주는 것만 |
| `thumbnail` | 갤러리 썸네일로 쓸 `captures` 의 이름 (선택). 기본은 기본값 촬영. 쉬는 시간이 있는 주기 효과처럼 Unity 시간에 따라 효과가 안 보이는 순간에 찍힐 수 있으면, 시간과 상관없이 효과가 보이는 촬영(이벤트 값을 고정한 상태 등)을 고른다. 무대에서 기본값 효과가 약하게 보여 다른 촬영이 효과를 더 잘 보여 줄 때도 쓴다 |
| `inspiredBy` | 확인된 대표작만. `원제 (연도)` 형식, 빌린 축 최대 2개. 근거가 없으면 빈 배열 |
| `original` | 무엇을 새로 만들었는지 |
| `references` | 1~6개. 원리의 출처. `shader-selection.md` 의 URL 을 우선 쓴다 |
| `related` | 함께 보면 좋은 표본과 이유 |
| `flashes` | 넓은 면이 번쩍이면 `true`. 이벤트가 제한기를 거친다 |
| `webGlslReason` | 9절. 공통 문법으로 도저히 안 될 때만 |

프롬프트 3종, Skill, 코드 탭은 위 데이터에서 자동으로 만들어진다. 표본에서 프롬프트 문장을 직접 쓰지 않는다.

## 6. C# 스크립트

값을 시간에 따라 움직여야 쓸 수 있는 표본은 C# 스크립트를 함께 둔다. 샘플의 `DissolveController`, `SpriteHitFlash`, `ForceFieldPulse`, `ScreenTransitionController` 를 따른다.

- `namespace ShaderGallery.Samples`. 파일 첫 줄에 무엇을 하는지 한국어 주석.
- `Shader.PropertyToID` 로 ID 를 캐시한다.
- 물체 하나에 쓰는 값은 `renderer.material` 복사본에 넣고 `OnDestroy` 에서 지운다. MaterialPropertyBlock 은 쓰지 않는다 (SRP Batcher 에서 빠진다).
- UGUI Image 는 다르다. `Image.material` 은 복사본을 만들지 않으므로 `new Material(...)` 로 직접 만들어 넣고 `OnDestroy` 에서 지운다. 복사본은 처음 쓸 때 만든다 (꺼진 채 시작한 UI 에 `Awake` 전에 값을 넣어도 되게). Mask 안에서는 Unity 가 스텐실용 복사본(`materialForRendering`)을 따로 쓰므로 그쪽에도 값을 넣되, Image 가 꺼져 있을 때는 `materialForRendering` 을 건드리지 않는다 (지운 복사본이 다시 생겨 샌다).
- 머티리얼 에셋을 직접 고치면(전체 화면 표본) `OnDisable` 에서 원래 값으로 되돌린다. 머티리얼 기본값이 썸네일용으로 진하면 Scene 뷰와 컨트롤러가 없는 씬에도 그대로 걸리므로, `unity.setup` 에 평소 값으로 낮춰 두는 단계를 넣는다.
- 머티리얼 에셋을 고치는 컨트롤러는 머티리얼 하나에 인스턴스 하나만 둔다 (`ScreenTransitionController` 처럼 `Instance` 를 남기고 중복은 스스로 지운다). 둘이 각자 저장하고 되돌리면 서로의 중간 값을 에셋에 남긴다. 이벤트 전용 값(더하기용)은 저장값이 아니라 항상 0 으로 되돌린다.
- 화면 머티리얼 하나를 여러 컴포넌트가 함께 고치는 효과는 번쩍임 제한기의 마지막 시각을 `static` 으로 둔다. 밝기 번쩍임이 아니어도 연타로 다시 시작하면 넓은 면이 튀는 효과(화면 왜곡, 흔들림)도 같은 제한기를 둔다. 분할 화면, 추가 씬, 씬 재로드 직후처럼 컨트롤러가 둘이 되어도 합쳐서 초당 3회를 넘지 않게 한다. 도메인 리로드를 끄는 설정에 대비해 `[RuntimeInitializeOnLoadMethod]` 로 초기화한다.
- 머티리얼 기본값은 썸네일을 위한 값일 수 있다. 연출을 시작하기 전의 값은 `Awake` 에서 넣는다 (`DissolveController` 참고).
- `DontDestroyOnLoad` 오브젝트는 씬을 오갈 때 복사본이 쌓이지 않게 인스턴스를 하나만 남긴다 (`ScreenTransitionController` 참고).
- 코루틴은 `OnDisable` 에서 `StopAllCoroutines` 하고 상태 변수를 초기화한다.
- 금지: `FindObjectOfType`, `Rigidbody.velocity`, 구 Input Manager (`Input.GetKey` 등), DOTween 같은 외부 패키지.

## 7. 콘텐츠와 안전

- 게임 원작의 텍스처, 모델, 셰이더 코드를 추출하거나 옮기지 않는다. 튜토리얼, 블로그, 오픈소스 코드도 복사하지 않고 원리만 참고해 출처를 링크한다. 코드는 새로 쓴다.
- 게임명은 `inspiredBy` 에만 쓴다. ID, 제목, 프리셋, 변수 이름에는 쓰지 않는다.
- 텍스처와 노이즈는 직접 생성한다. PNG 가 필요하면 코드로 만들고 긴 변 512 이하로 둔다.
- **용량 기준** (2026-11-03). 단일 HTML 의 gzip 예산(1.5MB)을 표본들이 나눠 쓴다. 이미지는 base64 로 들어가 1.33배가 되고 gzip 으로도 거의 줄지 않아, 이미지 바이트가 곧 예산을 쓴다.
  - 표본 하나가 늘리는 gzip 은 45KB 이하. `node tools/size.mjs <id>` 로 잰다.
  - PNG 한 장 24KB 이하 (`tools/check.mjs` 가 24KB 를 넘으면 경고, 32KB 를 넘으면 오류), 표본당 합 32KB 이하 (경고). `gen-texture.mjs` 가 행 필터를 골라 저장하므로 128 노이즈가 10KB 안팎이다. 넘으면 크기를 줄이거나 채널 하나에 담을 수 있는 값을 합친다.
  - Unity 촬영은 720×405 WebP 품질 0.75 (`tools/shots.mjs`), 표본당 `captures` 3장 이내. 한 장 16KB 를 넘으면 경고한다. 잔무늬가 화면을 덮는 촬영이 크다.
- 투명 텍셀에도 이웃 불투명 색을 칠해 둔다. 웹은 Unity 의 Alpha Is Transparency 가 없어 Bilinear 로 읽으면 가장자리에 검은 테가 생긴다.
- 확인된 대표작의 연도와 제작사는 선정 카드에 적힌 것만 쓴다. 기억으로 채우지 않는다.
- 넓은 면이 번쩍이는 효과는 `flashes: true` 로 두고, C# 에도 초당 3회 제한을 넣는다 (`ForceFieldPulse` 참고). 반복 맥동은 2Hz 이하.
  - C# 제한은 실제 시간(`Time.unscaledTime`)으로 세고, 코드에서 하한을 고정하며(`Mathf.Max(minInterval, 0.34f)`), `OnDisable` 에서 마지막 시각을 지우지 않는다. 껐다 켜거나 Inspector 값을 낮춰 제한을 피할 수 없게 한다.
  - 셰이더의 `_Time` 은 Play 중 배속(`Time.timeScale`)을 따른다. 셰이더 안의 깜빡임은 배속 2 면 두 배가 된다. 배속이 있는 게임에서 끄라는 점을 `unity.pitfalls` 에 적는다.
  - 셰이더 깜빡임과 C# 이벤트 번쩍임은 합쳐서 초당 3회 이하가 되게 한다. 밝기 변화가 작은(상대 밝기 10% 미만) 1Hz 이하의 느린 맥동은 번쩍임으로 세지 않는다.
  - 포화된 빨강: 선형 RGB 에서 R / (R + G + B) ≥ 0.8 이고 (R − G − B) × 320 > 20 이면 포화된 빨강이다 (WCAG 2.2 의 red flash 정의). 피격처럼 이 색을 쓰는 연출은 화면 가장자리 띠에 머물게 하고, 넓게 덮을 때는 어둡고 채도 낮은 색으로 바꾼다.
  - 움직이는 줄무늬가 한 점을 지나는 빈도(속도 / 간격)는 3Hz 이하를 권한다. 포화된 빨강을 넓게 깜빡이지 않는다.
  - 시간만 쓰는 깜빡임은 같은 머티리얼을 쓰는 물체가 모두 같은 순간에 번쩍인다. 면적이 커지므로 물체마다 시간을 어긋나게 하는 방법을 해설에 적는다.

## 8. 검증

```bash
node tools/check.mjs <id>                # 규격 검사, 이 표본만 넣은 빌드, WebGL 컴파일, 무대 실행. 먼저 통과시킨다
node tools/unity.mjs <id>                # Unity 컴파일(D3D11, Vulkan, GLES3, Metal, 인스턴싱·스테레오 등 키워드 조합)과 촬영. 새 .meta 회수
node tools/shots.mjs <id>                # 촬영 결과를 내장 이미지로
node tools/live.mjs <id> --query="auto=0" wait:1000 stage:final
node tools/live.mjs <id> --query="auto=0&step=1" wait:800 stage:step1
node tools/live.mjs <id> --query="auto=0&off=1" wait:800 stage:off
node tools/live.mjs <id> --query="auto=0&preset=<프리셋>" wait:800 stage:preset
node tools/live.mjs <id> --query="auto=0" wait:800 click:<이벤트 글자> wait:100 stage:event
node tools/live.mjs <id> --query="auto=0&step=2&t=1.3" wait:800 burst:step2,6,100
node tools/live.mjs <id> --query="auto=0&t=1" wait:800 click:<이벤트 글자> burst:event,8,50
```

**연속 촬영 (`burst:<이름>,<장수>,<간격ms>`).** 무대 시간을 간격만큼 직접 옮겨 가며 무대를 여러 장 찍는다. 실제 시간으로 흘리지 않으므로 헤드리스 브라우저가 느려도 매번 같은 순간이 찍힌다. 결과는 `t=` 라벨이 붙은 시트 한 장(Read 로 연다), 장마다의 PNG, 이웃한 장 사이의 변화량(평균 차이, 바뀐 픽셀 비율)이다. 모든 장이 같으면 "움직임 없음" 을 알린다. 자동 데모와 이미 누른 이벤트는 같은 시간축으로 진행하고, 메시 무대의 물체 회전은 멈춘다 (셰이더의 움직임만 비교하려고). 흐르는 무늬, 끓는 불꽃처럼 움직임을 말하는 글은 이 시트로 확인한다. 무늬가 단순히 한쪽으로 옮겨지는지 모양이 바뀌는지, 층의 빠르기가 서로 다른지를 본다. `t=` 로 멈춘 채 이벤트를 누르고 연속 촬영하면 이벤트의 시작부터 끝까지가 매번 같게 찍힌다.

Unity 촬영은 1280×720, 웹 촬영은 약 1000 픽셀 폭이라 픽셀 단위 효과(윤곽선 두께 등)는 두 화면에서 굵기가 달라 보인다. `live.mjs` 는 한 번에 `--query` 하나만 받는다. 쿼리에 `t=<초>` 를 더하면 무대 시간이 그 순간에 멈춘 채 열린다. 시간에 따라 모습이 바뀌는 효과는 단계와 효과 끄기를 `t=` 로 같은 순간에 찍어 비교한다 (예: `--query="auto=0&step=2&t=1.2"`). `live.mjs` 는 이 표본만 넣어 빌드하고 `_shots/<id>/` 에 PNG 를 남긴다. 파일을 열어 눈으로 본다. 표본을 합친 뒤의 전체 검사는 다음과 같다. 표본 하나를 만드는 작업에서는 돌리지 않아도 된다.

```bash
npm --prefix web run build
node tools/build-skill.mjs
node tools/check.mjs
```

- `tools/unity.mjs` 는 에디터가 이 프로젝트를 열고 있으면 그 에디터에 명령 파일로 맡기고, 안 되면 `~/.sg-unity/<리포 이름>` 복사본을 배치 모드로 돌린다. 첫 실행은 수 분 걸린다.
- 웹 무대는 Unity 와 숫자를 맞춰 두었지만 그림자는 근사이고 스키닝, 후처리는 없다. 웹과 Unity 스크린샷을 나란히 보고 **효과가 같아 보이는지** 확인한다.

### 완료 체크리스트

- [ ] `check`, `unity` 가 오류 없이 통과하고 Unity 경고도 원인을 확인했다
- [ ] 스크린샷이 의미 있게 보인다. 기본값 화면이 곧 썸네일이므로 효과가 한눈에 보여야 한다
- [ ] 단계마다 화면이 달라지고 `body` 설명과 맞다
- [ ] 효과 끄기가 설득력 있는 나쁜 예다
- [ ] 모든 슬라이더와 프리셋이 눈에 띄는 차이를 만든다
- [ ] 이벤트 버튼과 자동 데모가 동작한다
- [ ] 프롬프트 탭의 글을 처음부터 끝까지 읽어 빈칸이나 어색한 문장이 없다
- [ ] 게임명이 ID, 제목, 코드에 없다
- [ ] 다른 폴더를 고치지 않았다

## 9. v1 에서 안 되는 것과 요청 방법

표본만으로 안 되면 앱을 고치지 말고 작업 결과에 **무엇이 왜 필요한지** 적는다. 구독 세션이 앱을 확장한다. 지금 알려진 것은 다음과 같다.

| 필요한 것 | 해당 표본 | 상태 |
|---|---|---|
| 웹에서 한 물체를 패스 두 개로 그리기 (`Cull Front`) | `inverted-hull-outline` | 지원. 4절 "외곽선 패스" |
| 웹에서 `ZTest Greater` 로 가려진 부분만 그리기 | `xray-occluded-silhouette` | 지원. 4절 "가려진 부분 패스" |
| 전체 화면 무대에서 깊이, 법선 읽기 | `depth-normal-edge-outline` | 지원. 4절 `sgSceneDepth`, `sgSceneNormal` |
| 촘촘한 수면 메시 (`plane` 은 정점 간격 1) | `water-wave-surface` | 지원. 4절 `grid` |
| 해 반짝임이 보이는 역광 | `water-wave-surface` | 지원. 4절 `stage.backlit` |
| 메시 무대의 정점 색 (파티클 색) | `fire-noise-flame` | 지원. 4절 메시 무대의 `color` |
| UGUI Canvas 무대 | `ui-*` | 스프라이트 무대로 대체. `_MainTex` 만 바꾼다 |

공통 문법으로 도저히 안 되는 효과는 `web/src/specimens/<id>/web.glsl` 에 같은 `sgEffect` 를 GLSL 로 따로 쓰고 `meta.webGlslReason` 에 사유를 적는다. Unity 쪽은 여전히 `core.hlsl` 을 쓴다. 양쪽이 갈릴 위험이 있으므로 마지막 수단이다.

## 10. 환경 함정

- PowerShell 5.1 의 `Get-Content`, `Set-Content` 는 UTF-8 한글을 깨뜨린다. 파일 편집은 전용 도구로, 커밋 메시지는 파일로 만들어 `git commit -F`. 제목 다음에 빈 줄.
- Unity 에디터가 프로젝트를 열고 있어도 `tools/unity.mjs` 는 동작한다. 복사본 쪽 프로세스를 직접 띄우지 않는다.
- 헤드리스 Chrome 스크린샷은 같은 경로를 다시 읽으면 이전 이미지가 보일 수 있다. `live.mjs` 는 시각이 붙은 새 파일을 만든다.
- 브라우저 패널이 화면에 안 보이면 rAF 가 0 이다. 애니메이션 확인은 `live.mjs` 로 한다.
- `_Time` 은 편집 모드에서 제어할 수 없어 시간을 쓰는 표본의 스크린샷은 찍을 때마다 조금 다르다. 시간과 상관없이 기본값 화면이 의미 있게 보이도록 만든다.
- URP 의 `_Time` 은 Play 중에는 `Time.time` 이라 `Time.timeScale` 을 따른다 (0 이면 멈춘다). 편집 모드에서만 실제 시간으로 흐른다. 일시정지 중에도 흘러야 하는 값은 C# 에서 `Time.unscaledDeltaTime` 을 쌓아 넘긴다.
- 시간이나 카메라 위치로 계속 커지는 오프셋은 float 정밀도가 떨어져 오래 켜 두면 떨린다. 셰이더나 C# 에서 한 주기로 감싼다 (`frac`, `Mathf.Repeat`). 텍스처 주기가 1 이고 화면 전체에 같은 값(`_Time.y * 속도`)이면 `frac` 으로 감싸도 결과와 미분이 같다. 다만 셰이더의 `frac(_Time.y * 속도)` 는 큰 값을 UV 에 더할 때 생기는 손실만 막고, `_Time.y` 자체가 커져 잃은 정밀도는 되돌리지 못한다. 그것은 C# 에서 감싸 쌓은 값(`Mathf.Repeat`)을 넘겨야 해결된다.
- `_Time.y * 속도` 로 흐르는 무늬는 실행 중에 속도를 바꾸면 그동안 흐른 시간에 변화량이 곱해져 한 번에 튄다. 속도를 연출로 바꾸는 표본은 C# 에서 오프셋을 쌓아 넘기는 방법을 해설이나 `mistakes` 에 적는다.
