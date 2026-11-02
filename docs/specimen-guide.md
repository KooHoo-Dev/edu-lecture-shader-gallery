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

- 텍스처는 `SG_TEX(_MyTex, uv)` 로만 읽는다. `_MyTex_TexelSize` 도 쓸 수 있다. 래퍼에는 `Properties` 에 `_MyTex ("이름", 2D) = "white" {}`, 그 아래에 `TEXTURE2D(_MyTex); SAMPLER(sampler_MyTex);` 와 `#define SG_TEX(name, uv) SAMPLE_TEXTURE2D(name, sampler##name, uv)`, `CBUFFER` 안에 `float4 _MyTex_TexelSize;` 를 둔다. 텍스처 파일은 표본 폴더에 두고 `meta.stage.textures` 에 적는다. 텍스처는 `meta.params` 에 넣지 않는다. 임포트 설정은 촬영 도구가 맞춘다. PNG 는 프롬프트에 넣을 수 없어 Skill zip 으로 전달되므로 `unity.setup` 에 임포트 설정(sRGB, Wrap Mode, Filter Mode)을 적는다.
- PNG 는 `tools/textures/<이름>.mjs` 에 무늬를 코드로 쓰고 `node tools/gen-texture.mjs <이름>` 으로 만든다. 모듈 형식은 `tools/gen-texture.mjs` 머리말에 있고, 노이즈 같은 공용 도구는 `tools/lib/texture-kit.mjs` 에 있다. 표본 잡은 자기 모듈 경로를 `writePaths` 에 넣고 직접 쓴다. PNG 는 HTML 에 그대로 들어가므로 128 정도로 작게 둔다. 만든 PNG 는 Read 로 열어 눈으로 본다.
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
| `mesh` | 바닥과 물체 하나 (`stage.mesh`). Y 30도에서 시작해 천천히 돈다 (`quad`, `plane`, `grass` 는 돌지 않는다) | `uv positionOS positionWS normalOS normalWS viewWS lightDirWS lightColor lighting time` | | 디졸브 |
| `sprite` | 정사영 카메라, 드론 스프라이트(또는 `stage.textures._MainTex`), 2유닛 높이 | `uv color texelSize time` | `SG_TEX(_MainTex, uv)` | 스프라이트 |
| `depth` | 바닥, 상자, 공, 그 위를 덮는 물체 (`stage.mesh`). `plane` 이면 소품을 가르는 수면 높이에 놓인다 | `uv positionOS positionWS normalOS normalWS viewWS screenUV depthDelta time` | `sgSceneColor(screenUV)` | 역장 |
| `fullscreen` | 바닥, 상자, 공을 그린 화면 전체 | `uv aspect time` | `sgSource(uv)` | 전환 |

- `lighting` = `lightColor * saturate(dot(normalWS, lightDirWS)) + 환경광`. 대부분은 `albedo * i.lighting` 이면 된다. 툰처럼 빛을 직접 다루면 `lightDirWS`, `lightColor` 를 쓴다.
- `viewWS` 는 표면에서 카메라 쪽 방향. `normalWS`, `viewWS`, `normalOS` 는 정규화되어 있다.
- `positionWS`, `normalOS` 는 삼평면 투영처럼 월드와 오브젝트 공간을 고르는 표본용이다. 기준 샘플 래퍼에는 없으므로, 쓰는 표본은 래퍼의 `SgInput` 과 `Varyings` 에 넣고 정점에서 `normalOS` 를 넘긴다. 메시 무대는 돌기 때문에 월드 공간 무늬는 물체 위를 흐르고 오브젝트 공간 무늬는 물체에 붙는다.
- `depthDelta` = 카메라에서 씬 표면까지 거리 - 카메라에서 이 픽셀까지 거리 (미터). 물체가 닿는 곳에서 0 에 가까워진다.
- `fullscreen` 의 `uv` 는 왼쪽 아래가 (0, 0) 이고 위쪽이 1 이다. 화면비 보정은 `float2(aspect, 1.0)` 을 곱한다.
- `positionOS` 는 오브젝트 공간. `sphere` 반지름 0.5, `capsule`, `cylinder` 높이 2, `cube`, `quad` 한 변 1 (`quad` 는 카메라 쪽으로 서 있다), `plane` 은 XZ 로 누운 한 변 10 이다. `plane` 은 Unity 기본 메시라 정점 간격이 1 이다. 정점 변형은 그만큼 거칠다.
- 웹도 위치, 법선, 방향을 Unity 좌표로 넘긴다 (three.js 의 z 를 뒤집는다). 월드나 오브젝트 좌표로 만든 무늬와 방향(바람 방향 등)이 두 화면에서 같다. 웹 무대의 메시는 three.js 가 만든 것이라 정점 수가 Unity 기본 메시와 다르다. `cube` 와 `grass` 만 같다. 정점을 미는 표본은 Unity 의 정점 간격을 기준으로 정한다.
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

불투명 표본은 `blend: 'cutout'` 으로 두고 항상 알파 1.0 을 돌려준다. 투명 메시는 샘플이 없다. 역장의 래퍼에서 깊이 관련 줄을 빼고 `SgInput` 을 메시 형식으로 바꾼 뒤, `"LightMode" = "UniversalForward"` 패스 하나로 쓴다. 웹 쪽 입력은 `stage.kind` 를 따르므로 `kind: 'mesh'` 와 `blend` 를 함께 적는다. 양면을 그리면 래퍼에 `Cull Off`, 메타에 `stage.doubleSided: true` 를 둔다.

### 래퍼 규칙

- `.shader` 에는 `HLSLPROGRAM` 과 URP `ShaderLibrary` 만 쓴다. **금지:** `CGPROGRAM`, `UnityCG.cginc`, Surface Shader, `cmd.Blit` 등 구버전 렌더 패스 API.
- 머티리얼 값은 전부 `CBUFFER_START(UnityPerMaterial)` 안에 둔다 (SRP Batcher). 텍스처 선언(`TEXTURE2D`, `SAMPLER`)은 밖에 둔다.
- 샘플의 XR 매크로(`UNITY_VERTEX_INPUT_INSTANCE_ID` 등)와 `#pragma multi_compile_instancing` 을 지우지 않는다. 수업 XR 프로젝트에서 쓴다.
- 메시 잘라 내기 표본은 `Forward`, `ShadowCaster`, `DepthOnly`, `DepthNormals` 네 패스를 모두 유지한다. 알파로 자르는 부분이 그림자와 깊이에 빠지면 사라진 자리에 그림자가 남는다. 투명 표본은 `Forward` 패스 하나면 된다.
- 불투명, 잘라 내기 메시의 `Forward` 패스 태그는 `UniversalForwardOnly`, 노멀 패스 태그는 `DepthNormalsOnly` 다. `UniversalForward` 만 있으면 Deferred 렌더 경로에서 오류 없이 사라진다.
- 스프라이트 표본은 `Universal2D` 와 `UniversalForward` 두 패스를 유지한다. 2D Renderer 는 `Universal2D` 와 `SRPDefaultUnlit` 만 그리고 Universal Renderer 는 `UniversalForward` 만 그린다. 둘 다 촬영으로 확인했다.
- 메시, 깊이 표본의 패스는 2D Renderer 에서 그려지지 않는다 (`Universal2D`, `SRPDefaultUnlit` 만 그린다). 3D 프로젝트용이라고 `unity.pitfalls` 에 적는다. 예외로 외곽선 패스(`SRPDefaultUnlit`)는 그려지므로 외곽선 표본은 본체 없이 외곽선 색 덩어리만 보인다.
- 깊이 표본은 `DeclareDepthTexture.hlsl` 을 include 하고 `meta.requires` 에 `'depth'` 를 넣는다. 씬 색상을 쓰면 `DeclareOpaqueTexture.hlsl` 을 더 include 하고 다음을 `core.hlsl` include 앞에 두고 `requires` 에 `'opaque'` 를 넣는다.

  ```hlsl
  float4 sgSceneColor(float2 uv) { return float4(SampleSceneColor(uv), 1.0); }
  ```

- 전체 화면 표본은 C# 렌더러 기능을 새로 만들지 않는다. 내장 Full Screen Pass Renderer Feature 에 머티리얼을 넣는 방식만 쓴다. 2D Renderer 에서도 동작한다 (촬영으로 확인).

### UI 래퍼 (`stage.ui`)

UGUI Image 에 쓰는 표본용이다. 미리보기와 촬영은 스프라이트 무대 그대로지만 래퍼는 Unity 의 UI 셰이더 구조를 따른다. 기준 샘플이 아직 없으므로 첫 UI 표본(`ui-sdf-shape`)이 틀을 정하고 다음 UI 표본은 그 래퍼를 복사한다.

- 패스는 `LightMode` 태그 없이 하나다. Screen Space - Overlay 캔버스는 첫 패스를 쓰고, Camera·World Space 캔버스와 2D Renderer 는 이것을 `SRPDefaultUnlit` 으로 그린다.
- Unity 내장 UI/Default 셰이더의 구조를 HLSLPROGRAM 과 URP include 로 옮긴다: `[PerRendererData] _MainTex`, Stencil 속성(`_StencilComp`, `_Stencil`, `_StencilOp`, `_StencilWriteMask`, `_StencilReadMask`)과 Stencil 블록, `ColorMask [_ColorMask]`, `ZTest [unity_GUIZTestMode]`, `ZWrite Off`, `Cull Off`, 정점 색 곱, `#pragma multi_compile_local _ UNITY_UI_CLIP_RECT` 와 `_ClipRect` 클리핑, `UNITY_UI_ALPHACLIP`. `UnityUI.cginc` 는 쓸 수 없으므로 `UnityGet2DClipping` 은 래퍼에 직접 옮긴다 (`step` 두 번으로 사각형 안쪽을 구하는 몇 줄).
- Stencil 속성이 없으면 Mask 안에 넣었을 때 Unity 가 경고하고 가려지지 않는다. RectMask2D 클리핑이 없으면 스크롤 목록 밖으로 그림이 샌다. 둘 다 `unity.pitfalls` 에 증상으로 적는다.
- 혼합은 `blend: 'alpha'` 다. Unity 에서 Image 에 머티리얼을 넣는 절차(Material 칸, 텍스처는 Image 의 Source Image)를 `unity.setup` 에 적는다.
- `tools/check.mjs` 가 위 항목과 `LightMode` 가 없는지를 확인한다.

### 외곽선 패스 (`stage.outline`)

껍데기 외곽선처럼 같은 물체를 한 번 더 그리는 표본용이다. mesh, depth 무대에서만 쓴다.

- `core.hlsl` 은 `#ifdef SG_OUTLINE` 블록에 외곽선 패스의 `sgVertex`(정점을 미는 함수)를 둔다. `sgEffect` 는 블록마다 따로 두어도 되고, 하나로 두고 `#ifdef SG_OUTLINE` 으로 색만 갈라도 된다.
- 단계 번호(`_SgStep`)는 두 패스에 함께 걸린다. 모든 단계가 본체와 외곽선 양쪽에서 말이 되게 정한다. `SG_OFF` 도 두 패스에 함께 걸린다.
- 래퍼는 `core.hlsl` 을 `HLSLINCLUDE` 가 아니라 패스마다 include 한다. 외곽선 패스만 include 앞에 `#define SG_OUTLINE` 을 둔다.
- 외곽선 패스는 `Tags { "LightMode" = "SRPDefaultUnlit" }`, `Cull Front`, 정점에서 `sgVertex` 를 부른다. URP 17.3 은 이 태그를 Forward, Deferred(Forward 전용 목록), 2D Renderer 모두에서 그린다 (패키지 소스 확인). 그림자와 깊이 패스는 본체만 둔다.
- 웹은 같은 메시를 자식으로 하나 더 두고 뒷면만 그린다. 외곽선은 그림자를 드리우지 않는다.
- `meta.stage.outline: true` 로 적는다. `tools/check.mjs` 가 블록, `#define`, `Cull Front`, 태그를 확인하고 외곽선 프로그램도 WebGL 로 컴파일한다.
- `unity.pitfalls` 에 적을 것 (리뷰 지적, Unity 에서는 아직 확인하지 않았다):
  - 외곽선 패스는 깊이 프리패스(DepthOnly)에 없다. Universal Renderer 의 Depth Priming 이 켜지고 프리패스가 돌면(SSAO 등) 불투명 그리기가 ZTest Equal 로 바뀌어 외곽선이 통째로 사라질 수 있다.
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
| `params` | 효과를 만드는 값. `key` 는 셰이더 속성 이름. 모든 값이 화면에 **눈에 띄는** 차이를 만들어야 한다. `hint` 로 무엇이 바뀌는지 적는다 |
| `presets` | 2~5개. 쓰임새 이름 (게임명 금지). `values` 에는 기본값과 다른 것만 |
| `events` | 버튼으로 한 번 재생. C# 스크립트가 실제로 하는 일과 같게. `tracks` 의 `frames` 는 `[초, 값]` 목록. 트랙 값은 절대값이라 프리셋이나 슬라이더가 바꾸는 값을 움직이면 시작과 끝에서 튄다. 이벤트는 0 에서 올라갔다 0 으로 돌아오는 더하기용 전용 값(`_HitFlash`, `_Gust` 등)을 움직이고 셰이더가 기본 값에 더한다. C# 도 같은 값을 움직인다 |
| `demo` | 사람이 없어도 핵심 상황이 돌게. `loops` 는 반복 트랙, `fire` 는 일정 간격 이벤트 |
| `steps` | 2~5개. `n` 은 `SG_STEP` 번호. `body` 는 무엇을 보고 무엇을 이해해야 하는지 |
| `offNote` | 효과를 끈 화면에서 무엇이 나쁜지 |
| `mistakes` | 3~5개. 수강생이 실제로 겪을 증상을 제목으로, 원인과 해결을 본문으로. '문제 해결' 프롬프트에 그대로 들어간다 |
| `unity.setup` | Unity 에 넣는 순서 2~7단계. 메뉴 이름을 정확히 |
| `unity.verify` | 잘 되었는지 확인하는 한 문장. 값을 움직이면 무엇이 보여야 하는지 |
| `unity.pitfalls` | 2~6개. 설정, 플랫폼, 렌더러 제약. 프롬프트에 들어간다 |
| `unity.graph` | Shader Graph 에서 Custom Function 으로 쓰는 법 (선택) |
| `prompt.goal` | 프롬프트 첫 문장. 넣고 나면 무엇이 되는지 |
| `prompt.adaptIdeas` | 2~6개. 수강생이 실제로 원할 만한 변형. 첫 번째가 프롬프트 예시로 들어간다 |
| `captures` | 기본값 외에 더 찍을 상태. 표본당 3장 이내 (용량). 값이 다른 모습을 보여 주는 것만 |
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
- 머티리얼 에셋을 직접 고치면(전체 화면 표본) `OnDisable` 에서 원래 값으로 되돌린다.
- 머티리얼 기본값은 썸네일을 위한 값일 수 있다. 연출을 시작하기 전의 값은 `Awake` 에서 넣는다 (`DissolveController` 참고).
- `DontDestroyOnLoad` 오브젝트는 씬을 오갈 때 복사본이 쌓이지 않게 인스턴스를 하나만 남긴다 (`ScreenTransitionController` 참고).
- 코루틴은 `OnDisable` 에서 `StopAllCoroutines` 하고 상태 변수를 초기화한다.
- 금지: `FindObjectOfType`, `Rigidbody.velocity`, 구 Input Manager (`Input.GetKey` 등), DOTween 같은 외부 패키지.

## 7. 콘텐츠와 안전

- 게임 원작의 텍스처, 모델, 셰이더 코드를 추출하거나 옮기지 않는다. 튜토리얼, 블로그, 오픈소스 코드도 복사하지 않고 원리만 참고해 출처를 링크한다. 코드는 새로 쓴다.
- 게임명은 `inspiredBy` 에만 쓴다. ID, 제목, 프리셋, 변수 이름에는 쓰지 않는다.
- 텍스처와 노이즈는 직접 생성한다. PNG 가 필요하면 코드로 만들고 256×256 이하로 둔다.
- 넓은 면이 번쩍이는 효과는 `flashes: true` 로 두고, C# 에도 초당 3회 제한을 넣는다 (`ForceFieldPulse` 참고). 반복 맥동은 2Hz 이하.

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
```

`live.mjs` 는 이 표본만 넣어 빌드하고 `_shots/<id>/` 에 PNG 를 남긴다. 파일을 열어 눈으로 본다. 표본을 합친 뒤의 전체 검사는 다음과 같다. 표본 하나를 만드는 작업에서는 돌리지 않아도 된다.

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
| 웹에서 `ZTest Greater` 로 가려진 부분만 그리기 | `xray-occluded-silhouette` | 앱 확장 필요 |
| 전체 화면 무대에서 깊이, 법선 읽기 | `depth-normal-edge-outline` | 앱 확장 필요 |
| 촘촘한 수면 메시 (`plane` 은 정점 간격 1) | `water-depth-foam` 의 파도 | 파도가 거칠면 요청 |
| UGUI Canvas 무대 | `ui-*` | 스프라이트 무대로 대체. `_MainTex` 만 바꾼다 |

공통 문법으로 도저히 안 되는 효과는 `web/src/specimens/<id>/web.glsl` 에 같은 `sgEffect` 를 GLSL 로 따로 쓰고 `meta.webGlslReason` 에 사유를 적는다. Unity 쪽은 여전히 `core.hlsl` 을 쓴다. 양쪽이 갈릴 위험이 있으므로 마지막 수단이다.

## 10. 환경 함정

- PowerShell 5.1 의 `Get-Content`, `Set-Content` 는 UTF-8 한글을 깨뜨린다. 파일 편집은 전용 도구로, 커밋 메시지는 파일로 만들어 `git commit -F`. 제목 다음에 빈 줄.
- Unity 에디터가 프로젝트를 열고 있어도 `tools/unity.mjs` 는 동작한다. 복사본 쪽 프로세스를 직접 띄우지 않는다.
- 헤드리스 Chrome 스크린샷은 같은 경로를 다시 읽으면 이전 이미지가 보일 수 있다. `live.mjs` 는 시각이 붙은 새 파일을 만든다.
- 브라우저 패널이 화면에 안 보이면 rAF 가 0 이다. 애니메이션 확인은 `live.mjs` 로 한다.
- `_Time` 은 편집 모드에서 제어할 수 없어 시간을 쓰는 표본의 스크린샷은 찍을 때마다 조금 다르다. 시간과 상관없이 기본값 화면이 의미 있게 보이도록 만든다.
