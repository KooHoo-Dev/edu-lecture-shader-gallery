# Shader Gallery 셰이더 선정 (plan 2-1~2-3)

작성 2026-11-02, 상태 **2-4 확정 (2026-11-02)**. 이 문서는 24개 목록과 선정 근거다. 조사 근거는 `research/`에 있다: [search-log.md](../research/search-log.md)(방법과 한계), [course-survey.md](../research/course-survey.md)(수업 프로젝트 3개 확인), [sources-by-effect.md](../research/sources-by-effect.md)(후보별 URL).

**읽기 전에 알아둘 한계**
- 게임 화면은 하나도 직접 확인하지 못했다. 게임 예는 문서, 강연 자료, 기사, 포럼 글 같은 출처가 있는 것만 "확인"으로 적고, 근거가 없으면 "범용 기법, 대표작 미확인"이라고 적었다.
- 출처 URL 중 내가 직접 열어 읽은 것은 Unity 공식 문서 13쪽(○)이고, 나머지는 검색 요약과 제목으로만 확인(△)했다. 카드의 URL에는 ○·△를 붙였다.
- 2D Renderer의 일부 기능(Full Screen Pass, Opaque Texture)은 끝내 확인하지 못했다. 6절과 7절에서 다시 다룬다.

## 0. 요약

7그룹 26개. 확정된 샘플 4개(S 표시)를 포함한다. 아래 ID는 확정된 영구 ID다. 공개 후에는 바꾸지 않는다. 2026-11-03 에 Jay 요청으로 가장 기본이 되는 물과 불(25, 26번)을 더했다.

| 그룹 | ID | 난이도 | 우선 | 근거 | 무대 |
|---|---|---|---|---|---|
| 재질 | `toon-ramp-lit` | ★2 | 1 | 강 | 메시 |
| | `fresnel-rim-glow` | ★1 | 1 | 강 | 메시 |
| | `triplanar-projection` | ★2 | 1 | 강~중 | 메시 |
| | `screen-refraction-glass` | ★3 | 2 | 중~강 | 깊이 사용(씬 컬러) |
| 상태 피드백 | `dissolve-edge-glow` **S** | ★2 | 1 | 강 | 메시 |
| | `inverted-hull-outline` | ★2 | 2 | 중 | 메시 |
| | `xray-occluded-silhouette` | ★2 | 1 | 강 | 깊이 사용 |
| 자연 | `water-wave-surface` | ★1 | 추가 | 강 | 메시 |
| | `water-depth-foam` | ★3 | 1 | 강 | 깊이 사용 |
| | `wind-sway-foliage` | ★2 | 1 | 강 | 메시 |
| | `flow-map-liquid` | ★2 | 2 | 강 | 메시 |
| | `surface-wet-snow` | ★2 | 2 | 중 | 메시 |
| VFX | `fire-noise-flame` | ★1 | 추가 | 강~중 | 메시 |
| | `force-field-intersection` **S** | ★3 | 1 | 강 | 깊이 사용 |
| | `screen-shockwave-distortion` | ★3 | 2 | 중 | 전체 화면 |
| | `hologram-scanline-glitch` | ★2 | 2 | 중~강 | 메시 |
| | `scroll-distort-energy` | ★2 | 2 | 중 | 메시 |
| 2D | `sprite-outline-hit-flash` **S** | ★2 | 1 | 강 | 스프라이트 |
| | `palette-swap-lut` | ★2 | 2 | 강~중 | 스프라이트 |
| | `tiling-scroll-parallax` | ★1 | 3 | 약~중 | 스프라이트 |
| UI | `ui-sdf-shape` | ★2 | 1 | 강~중 | 스프라이트(UI 대체) |
| | `ui-sheen-sweep` | ★1 | 2 | 강~중 | 스프라이트(UI 대체) |
| | `ui-backdrop-blur` | ★3 | 3 | 중 | 깊이 사용(씬 컬러) |
| 후처리 | `screen-transition-wipe` **S** | ★1 | 1 | 강(원리) | 전체 화면 |
| | `depth-normal-edge-outline` | ★3 | 2 | 강~중 | 전체 화면 |
| | `screen-vignette` | ★1 | 1 | 강(공식) | 전체 화면 |

- 우선순위 1순위 12개(샘플 4 + 8), 2순위 10개, 3순위 2개. 난이도는 ★1 5개, ★2 13개, ★3 6개.
- 이 목록은 "시장과 공식 자료가 같은 효과를 묶어 다룬다"는 겹침을 기준으로 골랐다. Unity가 직접 낸 두 자료(Unity 6 e-book의 주제 목록, Shader Graph 샘플 8종)와 업계 팩들이 같은 효과를 반복해서 다루는 것이 가장 큰 근거다. 사용 빈도를 센 통계는 찾지 못했다(`search-log.md` 4절 8번).
- 수업 프로젝트에 이미 있는 셰이더(물결, 정점 사인, 스텐실 포털, 깊이 가림, 프레넬 하이라이트, 터널링 비네트, 껍데기 외곽선)와 겹치는 7개는 "확장편"으로 위치시키고 수업 파일을 링크하는 방향을 제안한다(7절 4번).

## 1. 공통 요구 사항

### 1-1. URP 설정과 렌더러
- **깊이 텍스처와 오파크 텍스처**: 수업 프로젝트의 PC용 URP 에셋은 둘 다 켜져 있고 모바일용과 2D용은 둘 다 꺼져 있다(`course-survey.md` 1절). `force-field-intersection`, `water-depth-foam`, `screen-refraction-glass`, `screen-shockwave-distortion`, `depth-normal-edge-outline`, `ui-backdrop-blur`는 켜야 동작한다. 그래서 AI 지시 세트의 필수 단계로 "URP 에셋에서 Depth Texture / Opaque Texture 켜기"를 넣어야 한다. Unity 문서도 깊이 텍스처를 켜지 않으면 소프트 파티클류가 안 보일 수 있다고 안내한다(△).
- **모바일 XR 비용**: Unity 문서는 untethered XR 기기에서 Opaque·Depth Texture를 끄라고 권한다(△). 위 6개는 XR 표시를 △로 둔다.
- **Render Graph**: Unity 6.3에서는 커스텀 렌더러 기능을 Render Graph API로 써야 한다고 안내한다(호환 모드는 define 뒤로 숨겨졌다는 포럼 글, 출시 전 문서가 섞여 있음, △). 이를 피하려고 전체 화면 표본은 **내장 Full Screen Pass Renderer Feature + 머티리얼**을 쓰는 방식을 기본으로 제안한다. 래퍼가 `_BlitTexture`를 읽고, Requirements로 Depth·Normal·Color를 고른다(Unity 문서, △).
- **데칼**: URP의 Decal 렌더러 기능은 Shader Graph의 Decal 머티리얼 타입을 전제한다(△). 코드 셰이더만 쓰는 이번 결정과 충돌해 지면 표시류는 제외했다(5절).

### 1-2. 2D 스프라이트 셰이더 요구 사항
2D 과정은 2D Renderer를 쓰는 것으로 판단한다(`Renderer2D.asset` 이름과 필드로 추정, 에디터에서는 확인하지 않음). 다음을 `sprite-*`, `palette-*`, `tiling-*`, UI 표본의 공통 규격으로 제안한다.

1. **패스 태그**: 2D 라이트를 받으려면 `Universal2D` 패스(노멀까지 쓰면 `NormalsRendering`)가 필요하다. 태그가 없으면 `SRPDefaultUnlit`로 취급된다(△). 수업에 들어 있는 `AllIn1Urp2dRenderer.shader`가 `Universal2D`, `NormalsRendering`, `UniversalForward` 세 패스를 쓴다(로컬 확인). 최소 규격은 `Universal2D` + `UniversalForward`로 시작하자고 제안한다.
2. **Opaque Texture 의존 금지**: 2D Renderer에서 지원하지 않는다는 2019~2021년 포럼 글만 있고 현재 상태는 확인하지 못했다(△). 대안은 Renderer 2D Data의 Camera Sorting Layer Texture(Unity 문서, △)다. 2D 표본은 이것에 의존하지 않거나 대안을 따로 적는다.
3. **Full Screen Pass 지원은 미확인**: 검색 결과에 2D Renderer 언급이 없었다. 2D 대상 후처리형(`screen-transition-wipe`, `screen-vignette`, `screen-shockwave-distortion`)은 plan 0-4(Unity 컴파일·촬영 시험)에서 먼저 확인하고, 안 되면 UI Image 방식 대안을 쓴다.
4. **머티리얼 인스턴스**: 수업이 `SpriteRenderer.material`로 인스턴스를 만들고 `_HitEffectBlend`를 `SetFloat`한다(로컬 확인). MaterialPropertyBlock을 쓰면 SRP Batcher에서 빠지고, Unity 6 + 2D에서 빈 블록이 렌더를 깨뜨렸다는 보고가 있다(Spine 포럼, △, 현재 상태 미확인). 표본은 `CBUFFER_START(UnityPerMaterial)`에 속성을 두고 인스턴스 머티리얼 방식을 기본으로 한다.
5. **스프라이트 패딩**: 이웃 알파를 샘플하는 외곽선은 아틀라스 이웃 스프라이트를 끌어오거나 타이트 메시에서 잘린다. 1~2px 패딩 가정과 UV 범위 제한을 규격으로 둔다(포럼, △).

### 1-3. XR (5000-Unity-XR)
- 수업의 OpenXR 설정 `m_renderMode: 1`은 Single Pass Instanced 계열로 추정한다(에디터 미확인). 수업 셰이더는 `UNITY_VERTEX_INPUT_INSTANCE_ID`, `UNITY_VERTEX_OUTPUT_STEREO`, `UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX`를 이미 쓴다(`LakeWater_Step6.shader` 확인).
- 메시형 표본은 래퍼가 이 매크로를 포함하면 core.hlsl은 영향받지 않는다. 전체 화면 패스는 소스 텍스처가 배열이 되므로 전용 샘플 매크로가 필요하다(Unity 문서, △).
- 표시 기준: **XR ○** = 래퍼 매크로만 있으면 됨. **XR △** = 깊이·씬 컬러·전체 화면이라 텍스처 배열과 모바일 비용을 확인해야 함. **XR ✕** = 머리에 고정된 전체 화면 효과나 월드 스페이스에서 의미가 불분명한 효과라 비권장(비권장 판단은 추정이고 근거 문서는 없음).

### 1-4. core.hlsl 적합성 표기
- **◎** 효과 계산 전체가 공통 문법이고 입력은 UV, 시간, 텍스처, 색뿐이다.
- **○** 핵심 수식은 core에 두고 조명, 깊이, 씬 컬러, 법선 같은 입력은 래퍼가 계산해 넘긴다. 웹 무대가 같은 입력을 제공해야 한다.
- **△** 효과의 본질이 Stencil, ZTest, Cull, 다중 패스, 렌더러 기능 같은 ShaderLab 상태다. core에는 색·마스크 계산만 두고 나머지는 래퍼와 문서로 설명하며, 웹은 three.js 설정으로 재현한다.

### 1-5. inspiredBy 표기
"확인"은 출처가 있는 것이고 "미확인"은 출처 없는 기억이라 쓰지 않았다. 대부분의 기본 기법(프레넬, 삼평면, 스크롤)은 특정 게임을 대표로 들 근거가 없어 비워 둔다. 이 정책은 7절 9번에서 판단을 받는다.

## 2. 그룹별 목록

### 재질 (4개)

#### 1. toon-ramp-lit — 램프 툰 조명 (★2, 1순위, 근거 강)
- **설명**: 빛의 밝기를 램프 텍스처나 단계로 끊어 만화풍 음영과 그림자 색조를 만든다.
- **왜 자주 쓰나**: 격투 게임 강연이 음영이 켜짐과 꺼짐 둘뿐이라 법선이 조금만 달라도 큰 얼룩이 생긴다는 설계 제약을 직접 다룬다. Unity가 Unity 6 e-book에 개선된 툰 셰이더와 툰·외곽선 레시피를 넣었고 Shader Graph 샘플의 Custom Lighting에도 cel shading이 있다. 상용 툰 팩도 많다. 출처: https://gdcvault.com/play/1022031/GuiltyGearXrd-s-Art-Style-The (△) · https://unity.com/kr/resources/create-shaders-visual-effects-urp-unity-6 (○) · https://docs.unity3d.com/Packages/com.unity.shadergraph@17.4/manual/ShaderGraph-Samples.html (○)
- **대표 게임 예**: Guilty Gear Xrd(GDC 2015 강연으로 확인). Genshin Impact(서드파티 아티스트의 분석 글로 확인, 화면 미확인: https://bjayers.artstation.com/blog/category/5 △).
- **무대**: 메시.
- **URP 핵심 기법**: `GetMainLight()`의 N·L을 램프로 변환, 램프 LUT 직접 생성, 그림자 수신 키워드(`_MAIN_LIGHT_SHADOWS`)는 래퍼, SRP Batcher 호환 속성.
- **수업 연계**: 3D 14 Animation의 `Jay/URP/SimpleUnlitToon`(조명을 받지 않는 Unlit + 외곽선)의 확장편. 3D 01 Rendering(라이트).
- **core.hlsl**: ○ (N·L은 래퍼가 넘기고 램프 계산이 core). **XR ○** (모바일 XR은 추가 조명 비용 주의).

#### 2. fresnel-rim-glow — 프레넬 림 빛 (★1, 1순위, 근거 강)
- **설명**: 시선과 법선이 비스듬할수록 밝아지는 가장자리 빛이다. 림 라이트, 상호작용 하이라이트, 에너지막의 기본 부품이다.
- **왜 자주 쓰나**: Shader Graph 공식 노드 문서가 림 라이팅에 흔히 쓴다고 설명한다. XRI Starter Assets에 `Unlit_Fresnel`, `Interactable`이 들어 있다(수업 XR 프로젝트에서 확인). 홀로그램류 팩이 모두 프레넬을 쓴다. 출처: https://docs.unity3d.com/Packages/com.unity.shadergraph@17.0/manual/Fresnel-Effect-Node.html (△) · `research/course-survey.md` 4절
- **대표 게임 예**: 범용 기법, 대표작 미확인.
- **무대**: 메시.
- **URP 핵심 기법**: `pow(1 - saturate(dot(N, V)), p)`, 뷰 방향은 눈별 카메라 위치로 계산, 가산 또는 알파 합성, 피격 번쩍임 프리셋(3D판).
- **수업 연계**: XR 00 XR Basics의 XRI 상호작용 하이라이트, 3D 01 Rendering.
- **core.hlsl**: ◎. **XR ○**.

#### 3. triplanar-projection — 삼평면 투영 (★2, 1순위, 근거 강~중)
- **설명**: UV 없이 월드 좌표로 세 축에서 텍스처를 투영하고 법선 가중치로 섞어 절벽과 바위의 늘어남을 없앤다.
- **왜 자주 쓰나**: Shader Graph Feature Examples에 삼평면·이평면 예제가 있고, Production Ready의 데칼이 지형 재질을 바위에 투영하는 삼평면 방식을 쓴다. 법선맵은 삼평면에서 어려운 부분이라는 글과 논문이 있다. 수업 3D 프로젝트에 Synty의 `POLYGON_Triplanar`가 이미 들어 있다. 출처: https://docs.unity3d.com/Packages/com.unity.shadergraph@17.4/manual/Shader-Graph-Sample-Feature-Examples.html (○) · https://bgolus.medium.com/normal-mapping-for-a-triplanar-shader-10bf39dca05a (△) · https://diglib7.eg.org/bitstream/handle/10.2312/egs20201016/053-056.pdf (△)
- **대표 게임 예**: 범용 기법, 대표작 미확인. GPU Gems 3 1장은 삼평면 서술을 확인하지 못해 근거에서 뺐다.
- **무대**: 메시(절벽 큐브). 텍스처는 직접 생성한 절차 패턴.
- **URP 핵심 기법**: 가중치 `abs(N)` 거듭제곱 후 정규화, 텍스처 세 번 샘플, 선택 사항으로 법선 reoriented 블렌딩, 월드 vs 오브젝트 공간 선택.
- **수업 연계**: 3D 05 Terrain(Island), 3D 07 External Assets(Synty).
- **core.hlsl**: ○ (텍스처 샘플 추상화 필요). **XR ○**.

#### 4. screen-refraction-glass — 씬 컬러 굴절 유리 (★3, 2순위, 근거 중~강)
- **설명**: 투명 표면 뒤의 장면을 법선과 노이즈로 휘어 보여 유리, 얼음, 물방울을 만든다.
- **왜 자주 쓰나**: Unity 6 e-book에 "반사와 굴절" 레시피가 있고 Production Ready의 물 4종이 모두 굴절을 쓰며 Rain On Lens도 같은 원리다. 공식 Scene Color 노드 문서는 URP에서 Opaque Texture를 읽고 머티리얼이 Transparent여야 한다고 설명한다. 출처: https://unity.com/kr/resources/create-shaders-visual-effects-urp-unity-6 (○) · https://docs.unity3d.com/Packages/com.unity.shadergraph@17.4/manual/Shader-Graph-Sample-Production-Ready-Water.html (○) · https://docs.unity3d.com/Packages/com.unity.shadergraph%4017.0/manual/Scene-Color-Node.html (△)
- **대표 게임 예**: 범용 기법, 대표작 미확인.
- **무대**: 깊이 사용(씬 컬러 겸용, 무대가 배경을 텍스처로 제공해야 함: 7절 5번).
- **URP 핵심 기법**: `SampleSceneColor`, 스크린 UV 오프셋, 두께·색수차, Transparent 서피스, URP 에셋의 Opaque Texture. 2D Renderer에서는 미지원으로 알려져 있다.
- **수업 연계**: 3D 외부 에셋 FORGE3D의 `HeatDepthFixed`, XR 01 Lake Shader(물 표면).
- **core.hlsl**: △~○ (씬 컬러 샘플은 래퍼, 오프셋 계산이 core). **XR △**. 우선순위는 `screen-shockwave-distortion`과 같은 기법이라 같은 묶음으로 만든다.

#### 27. matcap-lit-sphere — 매트캡 (★1, 추가, 근거 중)
- **설명**: 빛을 받은 공을 그린 텍스처 한 장(매트캡)을 준비하고, 픽셀의 법선을 화면 기준(카메라의 오른쪽·위 축)으로 바꿔 그 xy 를 `0.5 + 0.5 * n.xy` 로 텍스처 좌표 삼아 색을 읽는다. 라이트 계산이 없고 텍스처 한 번 읽기로 점토, 금속, 툰 같은 재질과 조명을 통째로 흉내 낸다. 조명이 텍스처에 구워져 있어 빛은 늘 카메라를 따라온다.
- **왜 자주 쓰나**: 원전은 Sloan 등(Graphics Interface 2001)의 lit sphere 로, 화가가 공에 그린 음영 연구를 "법선으로 칠하기"로 3D 모델에 옮긴다. 텍스처 중심은 눈을 향한 법선, 가장자리는 윤곽선에 대응하며, 당시 SGI 환경 매핑 하드웨어로 실시간 표시했다고 적었다. 같은 논문이 시선 쪽으로 나가는 빛만 담으므로 애니메이션에서 무늬가 눈을 따라 "헤엄친다"는 한계도 밝힌다. 오늘날에는 Unity 가 Shader Graph Feature Examples(UV Projection 분류의 "Mat Cap (Sphere Mapping)", 가장 싼 반사지만 늘 카메라를 향해 정확하지 않다고 설명), Unity Toon Shader 패키지의 MatCap 설정(곱하기·더하기 합성, 밉맵 블러, 카메라 롤 안정화, 전용 법선맵, 마스크), HDRP Scene 뷰의 MatCap 모드를 공식으로 낸다. VRM 의 표준 툰 셰이더 규격 MToon 1.0 이 `matcapTexture` 를 규격 항목으로 두고 조명 결과에 더한다. Blender(뷰포트 Lighting 의 MatCap)와 ZBrush(Maxon: "조명이 구워진 재질")에서는 모델링 미리보기의 기본 도구다. 비용 측면에서는 Banzai Games 기술 아티스트의 글이 모바일 대전 게임의 금속 반사를 "싸고 처리하기 쉬운" 매트캡으로 만들었다고 밝힌다. 출처: https://graphicsinterface.org/proceedings/gi2001/gi2001-17 (○, 2026-11-03 열람, 본문 PDF https://users.cs.northwestern.edu/~bgooch/PDFs/LitSphere.pdf ○) · https://docs.unity3d.com/Packages/com.unity.shadergraph@17.4/manual/Shader-Graph-Sample-Feature-Examples.html (○) · https://docs.unity3d.com/Packages/com.unity.toonshader@0.13/manual/MatCap.html (○) · https://github.com/vrm-c/vrm-specification/blob/master/specification/VRMC_materials_mtoon-1.0/README.md (○) · https://docs.blender.org/manual/en/4.4/editors/3dview/display/shading.html (○) · https://www.gamedeveloper.com/design/rendering-process-in-shadow-fight-3 (○)
- **대표 게임 예**: Shadow Fight 3(Game Developer 의 2019-02-15 글로 확인. 글쓴이 Roman Tersky 는 Nekki 의 개발 파트너 Banzai Games 의 리드 기술 아티스트이고, 갑옷·무기의 금속 부위를 RGB 마스크의 G 채널로 골라 매트캡을 입히며 장소마다 512×512 매트캡을 따로 만든다고 적었다. 화면 미확인). 출시 2017(전 세계 2017-11-16, iOS·Android), 개발 Banzai.Games, 배급 Nekki(Wikipedia 시리즈 문서 https://en.wikipedia.org/wiki/Shadow_Fight ○. 일부 기사는 Nekki 를 개발사로도 적는다).
- **무대**: 메시. 카메라 오른쪽·위 축(`cameraRightWS`, `cameraUpWS`)이 필요하다(아래 설계 제안 1).
- **URP 핵심 기법**: 월드 법선을 카메라 축에 내적해 화면 법선 xy 를 얻기(래퍼는 `UNITY_MATRIX_V[0].xyz`, `[1].xyz`), `0.5 + 0.5 * xy` 로 UV, 가장자리 텍셀을 피하는 축소(MToon 은 0.495), 원근 보정(픽셀별 시선 방향으로 기저를 다시 세워 화면 가장자리와 평평한 면의 어긋남을 줄임), 매트캡 텍스처는 Clamp·압축 없음, 바탕색과 곱하기 또는 더하기 합성, 라이트·그림자 키워드 없음(Unlit 패스).
- **수업 연계**: 3D 14 Animation 의 `Jay/URP/SimpleUnlitToon` 이 Unlit 이라 음영이 없는데, 매트캡은 Unlit 을 유지한 채 입체감을 주는 가장 싼 방법이다. 3D 01 Rendering(머티리얼과 라이트: "빛을 계산하지 않고 그림으로 흉내 내기"의 대조). XR 06 VR Avatar 와 모바일 XR(라이트 없는 저비용 셰이딩). `fresnel-rim-glow`(같은 시선·법선 내적), `toon-ramp-lit`(빛을 따르는 툰과의 비교)과 묶어 본다. 수업 프로젝트 세 곳에서 매트캡, MToon, lilToon, VRM 파일은 찾지 못했다(파일 이름·셰이더·머티리얼 검색).
- **core.hlsl**: ○ (카메라 축은 래퍼가 넘기고 UV 계산과 합성이 core). **XR ○** (래퍼의 `UNITY_MATRIX_V` 는 눈마다 다르다. 원근 보정을 켜면 눈마다 시선 방향이 달라 반사가 두 눈에서 조금 다르게 보인다. 실기기 미확인).
- **비고 (2026-11-03 결정)**: 표본 화면에 금속 마스크가 없어 대표작이 빌린 축(마스크로 금속 부위만, 장소마다 다른 매트캡)이 보이지 않는다. 그래서 표본의 `inspiredBy` 는 비워 두고 위 근거는 이 카드에만 둔다.

#### 32. interior-room-mapping — 인테리어 매핑 (★3, 추가, 근거 강)
- **설명**: 건물 벽면을 창 칸으로 나누고, 픽셀마다 카메라에서 이 점으로 오는 시선을 "창 뒤에 있다고 치는 방 상자" 안으로 이어 쏜다. 시선이 상자의 뒷벽, 바닥, 천장, 옆벽 가운데 가장 먼저 닿는 면(세 평면 교차 거리의 `min`)을 찾고, 그 자리의 방 그림을 읽는다. 벽은 평평한 판 하나인데 창마다 원근이 맞는 방이 보이고, 돌려 보면 방 안쪽이 시선에 따라 달라진다. 방마다 난수로 다른 방 그림과 불 켜짐을 고르면 도시 전체의 창을 모델링 없이 채운다. 가구는 벽과 바닥에 그려진 그림이라 납작하다.
- **왜 자주 쓰나**: 원전은 Joost van Dongen 의 CGI 2008 논문 "Interior Mapping" 이다. 오브젝트 공간에서 일정 간격의 천장·벽 평면과 시선을 교차시켜 가장 가까운 면의 텍스처를 읽고, 방 수가 400만 개로 늘어도 프레임이 그대로라고 측정했다. 같은 논문이 방마다 3D 노이즈로 불 켜짐을 정하는 확률 c, 텍스처 아틀라스로 방마다 다른 그림 고르기, 창과 평행한 "가구 평면", 건물 모서리의 이음매를 다룬다. 저자는 2018 년 Game Developer 글에서 기법의 유래와 쓰임(SimCity 2013, UE4 의 InteriorCubeMap 함수)을 다시 정리했다. Unity 는 Shader Graph Feature Examples 의 UV Projection 분류에 **Interior Cube Mapping** 을 두고, "창 너머 내부 메시가 없는 곳에 건물 내부의 착시를 만든다"며 모델링보다 훨씬 싸다고 설명한다(`UVInteriorCubemap` 서브그래프, 창 수, 벽 무작위 회전, 오브젝트 공간/UV 공간 선택). 게임 쪽에서는 Playground Games 의 기술 아트 디렉터가 Edinburgh 의 밀도 때문에 실제 실내 모델 대신 시차(parallax) 실내 셰이더를 썼다고 밝혔고, SCS Software 개발 블로그가 같은 계열의 "Parallax Interiors" 를 상자 근사, 종류별 아틀라스, 시간대별 조명 세 벌로 설명한다. Unity 포럼에서는 Ben Golus 가 큐브맵판과 2D 아틀라스판(방 깊이를 알파에 저장, 칸마다 무작위 방) 두 가지를 공개했다. 출처: https://www.proun-game.com/Oogst3D/CODING/InteriorMapping/InteriorMapping.pdf (○, 2026-11-03 열람, 8쪽 본문 전체) · https://www.gamedeveloper.com/programming/interior-mapping-rendering-real-rooms-without-geometry (○, 2026-11-03 열람) · https://docs.unity3d.com/Packages/com.unity.shadergraph@17.4/manual/Shader-Graph-Sample-Feature-Examples.html (○, 2026-11-03 열람) · https://www.gamedeveloper.com/design/game-tech-deep-dive-a-window-into-playground-games-latest-shader-development (○, 2026-11-03 열람) · https://blog.scssoft.com/2025/02/under-hood-parallax-interiors.html (○, 2026-11-03 열람) · https://discussions.unity.com/threads/interior-mapping.424676/ (○, 2026-11-03 열람)
- **대표 게임 예**: Forza Horizon 4(Game Developer 의 2018-12-10 글로 확인. 글쓴이 Gareth Harwood 는 Playground Games 기술 아트 디렉터이고, 실내를 같은 축척으로 3D 모델링해 시차 실내 셰이더용 텍스처로 렌더하고, 같은 양식의 방을 최대 8개씩 아틀라스로 묶고, 보통 방과 얕은 진열창 두 가지 깊이를 두며, 창틀·커튼·실내 세 층을 창마다 따로 고르고, 밤에는 방마다 구운 조명 텍스처와 건물별 점등 시각을 쓰고, 멀어지면 평평한 한 장 그림으로 바꾼다고 적었다. 화면 미확인). 출시 2018(Windows·Xbox One 2018-10-02), 개발 Playground Games, 배급 Microsoft Studios(Wikipedia https://en.wikipedia.org/wiki/Forza_Horizon_4 ○). 보조 사례: Euro Truck Simulator 2(출시 2012, 개발·배급 SCS Software)와 American Truck Simulator(출시 2016, 같은 회사)는 SCS 블로그(2025-02-15, 셰이더 담당 그래픽 프로그래머·3D 디자이너·도구 프로그래머 인터뷰)가 두 게임에 "Parallax Interiors" 를 넣었다고 밝힌다. 최근 Greece DLC 부터 보인다고만 하고 처음 들어간 업데이트는 적지 않았다(연도는 Wikipedia https://en.wikipedia.org/wiki/Euro_Truck_Simulator_2 ○, https://en.wikipedia.org/wiki/American_Truck_Simulator ○). SimCity(2013, Maxis Emeryville, Wikipedia ○)는 van Dongen 이 "그 게임 프로그래머에게서 들었다"고 쓴 간접 확인이라 보조로만 둔다(Maxis 개발자 인터뷰 기사 https://www.pcgameshardware.de/Sim-City-Spiel-15619/Specials/Sim-City-5-Technik-Interview-vor-Release-1057030/ 는 403 으로 열지 못함, △). Marvel's Spider-Man 은 흔히 대표로 거론되지만 van Dongen 도 Insomniac 의 공식 설명을 본 적 없다고 써서 **적지 않는다**.
- **무대**: 메시(`cube`). 도는 큐브라 창 안쪽의 시차가 각도에 따라 바뀌는 것이 보인다. 시선을 오브젝트 공간으로 옮기려면 메시 무대에 `cameraPosOS` 가 필요하다(설계 제안 2).
- **URP 핵심 기법**: 오브젝트 공간 시선(`positionOS - cameraPosOS`), `normalOS` 의 주축으로 면 기저 고르기(접선 입력 없이), 칸 좌표 `floor`·`frac`, 칸 안 상자와의 교차(축마다 `(±0.5 - o) / d` 와 뒷벽 거리의 `min`), 교차점을 한 점 투시 방 그림 좌표로 되돌리기(`q = hit.xy / (1 + w)`), 칸 번호 해시로 아틀라스 칸·좌우 반전·불 켜짐 고르기, 창틀 마스크, 프레넬 유리 반사(하늘색 그라데이션, 큐브맵 없음), 칸 경계의 밉 이음매 처리.
- **수업 연계**: 3D 07 External Assets 에 건물 프리팹이 있다(RageRun `Easy Paper Plane Controller` 의 `large_buildingA~F`, Synty PolygonApocalypse 의 고층 건물. 파일 이름만 확인했고 창 머티리얼과 씬 사용은 확인하지 않았다). XR 10 MR Portal 의 `PortalMask`(스텐실로 진짜 3D 공간을 구멍 너머에 보이기)와 "가짜 공간을 셰이더로 만들기"의 대조. `ground-aoe-indicator`(오브젝트 공간 상자와 `cameraPosOS` 로 시선 따라가기)와 같은 수학을 반대 방향(바깥 → 안)으로 쓰고, `triplanar-projection`(오브젝트 공간 좌표로 무늬 붙이기), `matcap-lit-sphere`(구운 그림 한 장으로 입체 흉내)와 묶어 본다. 수업 프로젝트 세 곳에서 interior 이름의 셰이더·셰이더 그래프·HLSL 은 찾지 못했다.
- **core.hlsl**: ○ (교차, 기저, 그림 좌표, 해시, 합성 전부 공통 문법. 카메라 위치의 오브젝트 공간 변환만 래퍼가 넘긴다). **XR ○** (픽셀마다 그 눈의 카메라 위치로 시선을 쏘므로 두 눈이 서로 다른 시차를 보아 깊이가 맞는다. 추론, 실기기 미확인).
- **비고 (2026-11-03 결정)**: 오브젝트 공간 시선을 위해 메시 무대에도 `cameraPosOS` 를 넣었다 (가이드 4절).

### 상태 피드백 (3개)

#### 5. dissolve-edge-glow — 디졸브 (★2, 1순위, 샘플 S, 근거 강)
- **설명**: 노이즈를 임계값과 비교해 픽셀을 지우고, 경계 띠를 발광시켜 사망, 소환, 텔레포트를 표현한다.
- **왜 자주 쓰나**: 튜토리얼이 모두 같은 원리(노이즈 vs 임계값, clip, 경계 띠 발광)를 설명한다. 2D 디졸브 팩의 설명이 용도로 스폰과 소멸, 텔레포트, 캐릭터 사망을 든다. 엔진 불문하고 외곽선, 히트 플래시, 샤인과 함께 한 세트로 묶여 판매된다. 출처: https://gamedeveloper.com/design/unity-shader-graph-quick-tutorial---dissolve-shader (△) · https://bugnet.io/blog/how-to-implement-a-dissolve-effect (△) · https://assetstore-fallback.unity.com/packages/tools/2d-dissolve-effect-pack-for-the-universal-render-pipeline-201782 (△)
- **대표 게임 예**: 범용 기법, 대표작 미확인.
- **무대**: 메시(스프라이트 변형은 샘플 2D 프리셋으로).
- **URP 핵심 기법**: 절차 노이즈(`hash` 기반), 알파 클립과 그림자 패스의 clip 일치(일반 지식, 미검증), 경계 띠 발광(HDR 색), 월드 y 방향성, 진행값을 C#이 넘김.
- **수업 연계**: 2D 14 Action Platformer와 99 Rockman의 적 사망, 3D 17 FPS Game 보스전. 수업의 AllIn1SpriteShader에도 상용 디졸브가 있다.
- **core.hlsl**: ◎. **XR ○**.

#### 6. inverted-hull-outline — 껍데기 외곽선 (★2, 2순위, 근거 중)
- **설명**: 법선 방향으로 부풀린 뒷면 메시를 한 번 더 그려 선택, 타깃 표시용 외곽선을 만든다.
- **왜 자주 쓰나**: Unity 6 e-book의 "툰과 외곽선" 레시피, 상용 레트로 팩이 껍데기 외곽선을 기능으로 판매한다. 모바일 URP에서 비용이 문제라는 글이 있어 대안(후처리)과 비교 거리가 있다. 출처: https://unity.com/kr/resources/create-shaders-visual-effects-urp-unity-6 (○) · https://realtimevfx.com/t/unity-outline-by-normals-for-mobile-game-urp/14919 (△) · https://danielilett.itch.io/psx-shaders-pro-for-unity-urp/devlog/998452/version-14-brings-hull-outlines-and-texel-aligned-shading (△)
- **대표 게임 예**: Genshin Impact(외곽선은 보통 뒤집은 껍데기라는 서드파티 분석, 화면 미확인).
- **무대**: 메시.
- **URP 핵심 기법**: 두 패스(`SRPDefaultUnlit` 외곽선 + `UniversalForward` 본체), `Cull Front`, 클립 공간 두께 보정, 하드 에지에서 갈라지는 법선 문제(일반 지식, 미검증).
- **수업 연계**: 3D 14 Animation의 `SimpleUnlitToon`이 이미 같은 2패스 구성을 쓴다(로컬 확인). 확장편으로 두께 보정과 선택 하이라이트 용도를 더한다.
- **core.hlsl**: △ (패스 구성과 `Cull`이 본질, core는 오프셋 함수). **XR ○**.

#### 7. xray-occluded-silhouette — 가려진 실루엣 (★2, 1순위, 근거 강)
- **설명**: 벽 뒤에 가려진 캐릭터만 단색 실루엣으로 덧그려 아군 표시, 투시, 숨은 대상 강조를 만든다.
- **왜 자주 쓰나**: Unity 공식 예제가 Render Objects 기능에 Depth Test = Greater를 써서 가려진 부분만 그리는 방법과, 자기 겹침 오탐을 두 번째 기능으로 해결하는 방법을 설명한다. Unity 6 e-book도 스텐실 X-ray 레시피를 둔다. 실제 게임에서는 아군을 벽 너머로 보이게 하는 외곽선을 Overwatch가 2018년 패치로 추가했다. 출처: https://docs.unity3d.com/6000.2/Documentation/Manual/urp/renderer-features/how-to-custom-effect-render-objects.html (△) · https://unity.com/kr/resources/create-shaders-visual-effects-urp-unity-6 (○) · https://eu.forums.blizzard.com/en/overwatch/t/overwatch-ptr-patch-notes-august-30-2018/8320 (△)
- **대표 게임 예**: Overwatch(패치 노트로 확인. 출시 2016, Blizzard Entertainment, 2026-11-02 기사로 확인), Call of Duty: Modern Warfare(2019 리부트, 기사로 확인: https://mp1st.com/news/call-of-duty-modern-warfare-will-have-teammates-feature-outlines-so-you-can-see-them-through-walls △).
- **무대**: 깊이 사용(벽 + 캐릭터).
- **URP 핵심 기법**: `ZTest Greater`, `ZWrite Off`, Render Objects 렌더러 기능과 레이어 마스크, 스텐실 대안. 셰이더만으로는 안 되고 렌더러 기능 설정이 함께 필요하다.
- **수업 연계**: XR 10 MR Portal의 `PortalMask`(스텐실), XR 11 MR Room의 `Occlusion`(깊이만 쓰기). 같은 도구(Stencil, ZTest)를 쓰는 짝이다. 3D 17 FPS Game.
- **core.hlsl**: △ (ZTest와 렌더러 기능이 본질, core는 색 계산). **XR ○** (깊이 텍스처 복사가 필요 없는 깊이 버퍼 테스트라고 판단, 추정).

#### 28. cloak-refraction-shimmer — 클로킹 투명화 (★3, 추가, 근거 강~중)
- **설명**: 캐릭터 몸 대신 뒤 장면(Opaque Texture)을 법선 방향으로 조금 밀어 그려 거의 보이지 않게 하고, 프레넬 테두리로 윤곽만 남긴다. 진행값 하나(0 보임 ~ 1 은신)가 노이즈와 높이로 만든 경계 띠를 몸 위로 훑으며 위장을 켜고 끈다. 피격 때 잠깐 드러나는 연출을 이벤트로 더한다.
- **왜 자주 쓰나**: 여러 엔진이 이 효과를 기본 셰이더 기능으로 넣었다. Valve 가 공개한 Source SDK 2013 의 `VertexLitGeneric` 에는 "cloak render in a second pass" 파라미터(`$cloakpassenabled`, `$cloakfactor`, `$cloakcolortint`, `$refractamount`)가 있고, 그 픽셀 셰이더(`cloak_blended_pass_ps2x.fxc`)가 프레임 버퍼 복사본을 화면 공간 법선만큼 밀어 읽고(포아송 블러 포함), `1 - N·V` 프레넬로 은신 마스크를 만들며, 은신이 끝날수록 미는 양·블러·색조를 0 으로 줄인다. CryEngine 3 셰이더 목록에 "see-through / aberration" 용 `CloakLayer` 셰이더가 있고, Microsoft XNA 의 Distortion 샘플이 화면 공간 왜곡의 예로 투명 망토를 든다. Unity 쪽은 URP Asset 문서가 Opaque Texture 를 "투명 메시를 그리기 직전 장면의 스냅샷"이라 설명하고, URP 용 Shader Graph 실험 저장소가 `_CameraOpaqueTexture` 로 투명 망토를 흉내 내며 그림자 처리를 따로 적는다. 출처: https://raw.githubusercontent.com/ValveSoftware/source-sdk-2013/master/src/materialsystem/stdshaders/cloak_blended_pass_ps2x.fxc (○, 2026-11-03 열람, 소스) · https://raw.githubusercontent.com/ValveSoftware/source-sdk-2013/master/src/materialsystem/stdshaders/vertexlitgeneric_dx9.cpp (○, 소스) · https://www.cryengine.com/docs/static/engines/cryengine-3/categories/1114113/pages/1048660 (○, 목록 한 줄만) · https://github.com/SimonDarksideJ/XNAGameStudio/wiki/Distortion (○, 커뮤니티 보관본 소개 문장만, 샘플 소스 미열람) · https://docs.unity.com/en-us/engine/6000.3/manual/render-pipelines/universal-render-pipeline/urp-reference/universalrp-asset (○) · https://docs.unity3d.com/Packages/com.unity.shadergraph@17.3/manual/Scene-Color-Node.html (○) · https://github.com/gamedevserj/Shader-Graph-Experiments (○, Unity 2019.3 / Shader Graph 7.3.1 시절)
- **대표 게임 예**: Team Fortress 2(출시 2007, 제작 Valve, Steam 상점 페이지로 확인: https://store.steampowered.com/app/440/Team_Fortress_2/ ○). Valve 가 공개한 같은 저장소의 TF2 클라이언트 코드 `src/game/client/tf/c_tf_player.cpp` 에 "Used for spy invisibility material" 주석이 달린 `CSpyInvisProxy`(`spy_invis` 머티리얼 프록시)가 있고, 기반 클래스(`tf_proxyentity.cpp`)가 `$cloakfactor` 를 찾아 은신 비율을 넣는다. 같은 프록시가 `$cloakColorTint` 를 팀 색으로 바꾼다(○, 2026-11-03 소스 열람). 같은 편에게 보이는 최대 투명도는 `tf_teammate_max_invis`(기본 0.95)로 제한된다(`c_tf_player.cpp`, ○, 2026-11-03 리뷰가 확인). Valve Developer Community 위키의 `VertexLitGeneric` 문서도 이 파라미터가 TF2 스파이 클로크 효과를 지원한다고 적는다(https://developer.valvesoftware.com/wiki/VertexLitGeneric △, 봇 차단으로 열지 못함). 화면은 직접 확인하지 못했다.
- **무대**: 깊이 사용(씬 컬러 겸용). `mesh: 'capsule'`(캐릭터 대신)이 상자, 공 앞에 선다.
- **URP 핵심 기법**: `SampleSceneColor`(Opaque Texture), 법선을 카메라 오른쪽·위 축에 내린 화면 좌표 오프셋, 밀린 좌표의 깊이 비교로 앞 물체 끌림 방지(`screen-refraction-glass` 와 같은 가드), 프레넬 테두리, 노이즈 + 높이 진행값 경계 띠, 흐르는 스캔라인(선택), Transparent 큐에서 알파 1 로 그리기, 그림자는 C# 이 `shadowCastingMode` 로 끔. URP 에셋 Opaque Texture + Depth Texture.
- **수업 연계**: 3D 17 FPS Game(보스전의 은신 적, 피격 시 드러남), 3D 08 Skinned Mesh·14 Animation(여러 렌더러로 된 캐릭터에 머티리얼 일괄 적용). 3D 07 External Assets 의 FORGE3D `HeatDepthFixed`, `Holographic` 이 같은 원리(씬 컬러 왜곡, 스캔라인)를 에셋으로 이미 쓴다. 갤러리 안에서는 `screen-refraction-glass`(굴절), `fresnel-rim-glow`(테두리), `dissolve-edge-glow`(경계 띠 훑기), `hologram-scanline-glitch`(스캔라인)를 합친 응용편이다.
- **core.hlsl**: ○ (씬 컬러·깊이 샘플은 래퍼, 오프셋·마스크·테두리 계산이 core). **XR △** (Opaque Texture 는 눈마다 배열이고 untethered 기기에서 끄라는 권고가 있다. 실기기 미확인).

### 자연 (5개)

#### 8. water-depth-foam — 깊이 기반 물가 거품 (★3, 1순위, 근거 강)
- **설명**: 물 표면이 지형이나 물체와 만나는 곳에 깊이 차이로 거품 띠를 그리고 얕은 곳을 투명하게 한다.
- **왜 자주 쓰나**: Sea of Thieves의 SIGGRAPH 2018 발표가 물체가 수면과 교차하는 곳의 거품을 깊이 버퍼 비교로 만든다고 설명한다. Production Ready의 물 4종 중 연못 셰이더가 교차 거품과 칠할 수 있는 거품 마스크를 갖는다. 에셋스토어 툰 물 팩도 깊이 기반 색 그라데이션과 거품을 판다. 물 에셋 하나는 Unity 6 Render Graph와 비호환이라고 명시해 직접 구현의 가치를 보여 준다. 출처: https://history.siggraph.org/wp-content/uploads/2022/09/2018-Talks-Ang_The-Technical-Art-of-Sea-of-Thieves.pdf (△) · https://docs.unity3d.com/Packages/com.unity.shadergraph@17.4/manual/Shader-Graph-Sample-Production-Ready-Water.html (○) · https://assetstore-fallback.unity.com/packages/vfx/shaders/toon-water-urp-170520 (△)
- **대표 게임 예**: Sea of Thieves(SIGGRAPH 발표로 확인). 출시 2018, 제작 Rare (2026-11-02 기사로 확인).
- **무대**: 깊이 사용.
- **URP 핵심 기법**: `SampleSceneDepth`와 `LinearEyeDepth` 차이, 스크린 UV, Gerstner 정점 변위 몇 개, 법선 스크롤, 프레넬, URP 에셋 Depth Texture.
- **수업 연계**: XR 01 Lake Shader(Step1~7: 파동, 법선맵 두 장, 프레넬, 반사)와 10 MR Portal `Caustics`. 수업에 없는 것이 깊이 거품이므로 "Step 8" 확장으로 위치시킨다. 3D 05 Terrain Island.
- **core.hlsl**: ○ (깊이는 래퍼, 거품·파동 계산이 core). **XR △** (모바일 XR 에셋은 Depth Texture 꺼짐).

#### 9. wind-sway-foliage — 바람 흔들림 (★2, 1순위, 근거 강)
- **설명**: 풀과 잎의 정점을 높이에 따라 노이즈와 사인으로 흔들어 바람을 만든다.
- **왜 자주 쓰나**: Ghost of Tsushima의 GDC 2021 풀 발표와 2022 바람 발표(바람은 일정한 방향에 노이즈로 세기를 바꾼다는 요약)가 있다. Unity 블로그가 정점 색 마스크와 월드 노이즈 방법을 설명하고, Feature Examples에 풀 휨, 깃발, 빌보드 정점 애니메이션이 있다. 출처: https://gdcvault.com/play/1027214/Advanced-Graphics-Summit-Procedural-Grass (△) · https://gamedeveloper.com/design/using-vorticles-to-simulate-wind-in-i-ghost-of-tsushima-i- (△) · https://unity.com/blog/engine-platform/creating-animated-materials-with-shader-graph (△)
- **대표 게임 예**: Ghost of Tsushima(GDC 소개 문구와 요약으로 확인).
- **무대**: 메시.
- **URP 핵심 기법**: 정점 셰이더 변위, UV.y나 정점 색 마스크, 월드 위치 노이즈, 법선 재계산 생략, `multi_compile_instancing`.
- **수업 연계**: XR 04 Reel And Fish `FishSwim`(몸통 축 사인 흔들기, 위상은 C#이 넘김)과 같은 원리라서 "일반화" 확장으로 위치시킨다. 3D 05 Terrain.
- **core.hlsl**: ○ (정점 변위 함수가 core, 웹도 정점 단계를 지원해야 함). **XR ○**.

#### 10. flow-map-liquid — 플로 맵 액체 (★2, 2순위, 근거 강)
- **설명**: 방향 텍스처로 UV를 흘리고 위상 두 벌을 섞어 반복 끊김을 숨겨 용암, 강물, 마법 액체를 만든다.
- **왜 자주 쓰나**: Valve가 Portal 2의 물 흐름을 SIGGRAPH 2010과 GDC 2011에서 발표했고 Left 4 Dead 2 셰이더의 확장이라고 밝혔다. Feature Examples에 Flow Mapping 예제가 있다. 튜토리얼 두 편이 위상 두 벌과 패턴 정렬이라는 다른 접근을 설명한다. 출처: https://www.advances.realtimerendering.com/s2010/Vlachos-Waterflow(SIGGRAPH%202010%20Advanced%20RealTime%20Rendering%20Course).pdf (△) · https://www.hlportal.de/files/GDC2011_BronwenGrimes_NonstandardTextures.pdf (△) · https://docs.unity3d.com/Packages/com.unity.shadergraph@17.4/manual/Shader-Graph-Sample-Feature-Examples.html (○)
- **대표 게임 예**: Portal 2, Left 4 Dead 2(Valve 발표로 확인).
- **무대**: 메시(평면).
- **URP 핵심 기법**: `frac(time)` 위상 두 벌, 플로 텍스처(선형 공간, 직접 생성), 노이즈로 위상 분산, 법선·색 모두 흘리기.
- **수업 연계**: XR 01 Lake Shader Step6(법선맵 두 장 스크롤)의 확장. 3D 05 Terrain Island의 용암·강.
- **core.hlsl**: ◎. **XR ○**.

#### 11. surface-wet-snow — 젖음과 눈 쌓임 (★2, 2순위, 근거 중)
- **설명**: 월드 법선과 마스크로 윗면에 젖음(어둡고 매끈) 또는 눈을 얹는다.
- **왜 자주 쓰나**: Production Ready의 날씨 서브그래프가 비, 웅덩이, 젖음, 눈을 제공하고 가장 비싼 조합은 필요한 곳에만 쓰라고 안내한다. 윗면 기준 마스크라는 설명은 커뮤니티 글이다. 출처: https://docs.unity3d.com/Packages/com.unity.shadergraph@17.4/manual/Shader-Graph-Sample-Production-Ready-Weather.html (○) · https://forums.unrealengine.com/t/rain-wet-shader/16716 (△)
- **대표 게임 예**: 범용 기법, 대표작 미확인.
- **무대**: 메시.
- **URP 핵심 기법**: `normalWS.y` 마스크 + 노이즈 + 높이, 스무드니스와 알베도 조정, URP Lit 라이팅 입력 사용(조명은 래퍼).
- **수업 연계**: 3D 01 Rendering(머티리얼·텍스처), 05 Terrain.
- **core.hlsl**: ○ (색·스무드니스 출력 계산이 core). **XR ○** (모바일 XR은 Lit 비용 주의).

#### 25. water-wave-surface — 물결 수면 (★1, 추가, 근거 강)
- **설명**: 사인파 몇 개를 더해 평면 정점을 오르내리게 하고, 같은 식의 도함수로 법선을 구해 조명을 맞춘다. 프레넬로 물빛과 하늘빛을 섞고 주 광원 반사광을 얹는다. 깊이 텍스처 없이 되는 가장 기본 물이다.
- **왜 자주 쓰나**: GPU Gems 1장(Mark Finch, Cyan Worlds)이 사인파 합으로 수면을 만들고 법선을 도함수로 바로 구하는 방법을 설명하고, 이 방식을 Uru: Ages Beyond Myst 에 썼다고 밝힌다. 같은 장이 Gerstner 파도도 다룬다. Catlike Coding 의 Unity 튜토리얼이 같은 순서(사인파 → 법선 → Gerstner)를 따른다. 출처: https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-1-effective-water-simulation-physical-models (○, 2026-11-03 열람) · https://catlikecoding.com/unity/tutorials/flow/waves/ (△)
- **대표 게임 예**: Uru: Ages Beyond Myst(GPU Gems 1장 본문으로 확인). 출시 2003, 제작 Cyan Worlds.
- **무대**: 메시(평면).
- **URP 핵심 기법**: 정점 셰이더 변위, 사인파 합, 도함수로 법선 다시 계산, 프레넬, Blinn-Phong 반사광(`GetMainLight`), 알파 혼합.
- **수업 연계**: XR 01 Lake Shader(Step1~7: 파동, 법선맵 두 장, 프레넬, 반사)의 앞부분을 한 장에 모은 기초편이다. 깊이 거품은 `water-depth-foam`이 이어받는다. 3D 05 Terrain Island.
- **core.hlsl**: ◎ (파도와 색 계산이 core). **XR ○** (정점 수가 많은 수면 메시는 비용 주의).

### VFX (5개)

#### 26. fire-noise-flame — 노이즈 불꽃 (★1, 추가, 근거 강~중)
- **설명**: 같은 노이즈 텍스처를 크기와 속도를 달리해 두 층 위로 흘려 곱하고, 부드러운 불꽃 모양 마스크로 깎은 뒤 세기에 따라 노랑, 주황, 빨강을 입혀 더하기 혼합으로 그린다. 시뮬레이션 없이 셰이더만으로 만드는 가장 기본 불이다.
- **왜 자주 쓰나**: Julian Love(Blizzard)의 GDC 2013 Technical Artist Bootcamp 발표 "The VFX of Diablo" 가 같은 노이즈 텍스처 여러 장을 곱하는 공식(Tex1.a × Tex2.a × 2)을 보여 주고, JangaFX 의 분석 글이 이를 크기 0.5·1·2 로 흘린 같은 노이즈 층과 모양을 잡는 부드러운 마스크로 재현한다. 출처: https://gdcvault.com/play/1017660/Technical-Artist-Bootcamp-The-VFX (△, 세션 제목과 발표자만 확인) · https://jangafx.com/insights/diablo-3-vfx-experiments (○, 2026-11-03 열람)
- **대표 게임 예**: Diablo III(GDC 2013 발표와 분석 글로 확인). 출시 2012, 제작 Blizzard Entertainment.
- **무대**: 메시(Quad).
- **URP 핵심 기법**: UV 패닝 두 층(크기와 속도가 다름), 노이즈 곱, UV 기반 모양 마스크, `smoothstep` 으로 깎기, 세기 → 색 그라데이션, 가산 블렌드, `ZWrite Off`.
- **수업 연계**: 3D 07 External Assets 와 2D 의 MagicArsenal 같은 이펙트 팩의 불꽃이 같은 원리를 쓴다. `scroll-distort-energy`(흐르는 층과 왜곡)와 `dissolve-edge-glow`(노이즈 임계값 깎기)의 기초편이다.
- **core.hlsl**: ◎. **XR ○** (가산 블렌드 과드로우 주의).

#### 12. force-field-intersection — 역장 교차 (★3, 1순위, 샘플 S, 근거 강)
- **설명**: 반투명 보호막이 다른 물체와 닿는 선을 깊이 비교로 밝히고, 프레넬 테두리와 육각 패턴, 충돌 맥동을 더한다.
- **왜 자주 쓰나**: Unity 포럼이 깊이 교차 원리를 설명하고, URP용 Shader Graph 데모 저장소가 "Depth Texture와 Opaque Texture를 켜야 한다"고 명시한다. 상용 팩이 역장, 디졸브, 용암을 묶어 판다. 같은 원리가 타 엔진 이식 글에서도 반복된다. 출처: https://discussions.unity.com/t/why-do-depth-intersection-shaders-work/827541 (△) · https://github.com/alansley/UnityShaderGraphDemos (△) · https://www.fab.com/listings/531ab9d7-bc90-4173-bfc3-f01623a16054 (△)
- **대표 게임 예**: 범용 기법, 대표작 미확인.
- **무대**: 깊이 사용.
- **URP 핵심 기법**: `SampleSceneDepth` 차이, 원근 카메라 깊이, 프레넬, 육각 SDF 또는 보로노이 절차 패턴, 충돌점 파라미터, `ZWrite Off` 투명, URP 에셋 Depth Texture.
- **수업 연계**: 3D 07 External Assets의 FORGE3D Sci-Fi Effects(역장류), XR 상호작용 하이라이트. 3D 17 FPS Game 보스전.
- **core.hlsl**: ○. **XR △**. 넓은 영역이 번쩍이는 맥동은 정책 8절의 제한기를 거친다.

#### 13. screen-shockwave-distortion — 충격파 왜곡 (★3, 2순위, 근거 중)
- **설명**: 폭발이나 충격 지점에서 퍼지는 고리 모양으로 화면을 왜곡한다. 열기 아지랑이도 같은 원리다.
- **왜 자주 쓰나**: 오픈 소스 저장소에 화면 공간 충격파 예제가 있고(Opaque Texture 의존, Unity 2021.3 기준), 포럼은 전체 화면 셰이더와 Full Screen Pass를 안내한다. 2D 쪽은 Camera Sorting Layer Texture를 쓰는 커뮤니티 리플 셰이더가 있다. Production Ready의 Underwater 후처리가 왜곡을 쓴다. 출처: https://github.com/Delt06/opaque-texture-shaders (△) · https://discussions.unity.com/t/full-screen-shaders-in-urp/869111 (△) · https://docs.unity3d.com/Packages/com.unity.shadergraph@17.4/manual/Shader-Graph-Sample-Production-Ready-Post.html (○)
- **대표 게임 예**: 범용 기법, 대표작 미확인.
- **무대**: 전체 화면.
- **URP 핵심 기법**: Full Screen Pass + `_BlitTexture`, 링 마스크(`abs(dist - r) < w`), UV 오프셋 방향·감쇠, 화면비 보정.
- **수업 연계**: 3D `HeatDepthFixed`(FORGE3D), 2D 15 Mini Defence의 폭발 연출.
- **core.hlsl**: ○ (샘플링은 래퍼가 소스를 넘김). **XR △~✕** (전 화면 왜곡이 멀미를 일으킬 수 있다는 판단은 추정). 2D는 Full Screen Pass 지원 미확인.

#### 14. hologram-scanline-glitch — 홀로그램 (★2, 2순위, 근거 중~강)
- **설명**: 프레넬 테두리, 이동하는 스캔라인, 시간 단계로 튀는 정점 글리치, 깜빡임으로 만든 홀로그램이다.
- **왜 자주 쓰나**: 유료 팩이 기본 프레넬, 글리치 두 종류(정점 스냅, 슬라이스 오프셋), 스캔라인 변형으로 제품을 나눠 판다. 무료 Godot 구현도 스캔라인, 노이즈, 계단 변위, 깜빡임, 프레넬을 같은 구성으로 쓴다. 수업 3D 프로젝트에 FORGE3D `Holographic.shadergraph`가 이미 들어 있다. 출처: https://danielilett.itch.io/hologram-shaders-pro-unity (△) · https://godotshaders.com/shader/hologram-effect/ (△) · https://marketplace.unity.com/packages/vfx/shaders/hologram-lwrp-urp-161392 (△)
- **대표 게임 예**: 범용 기법, 대표작 미확인.
- **무대**: 메시.
- **URP 핵심 기법**: 가산 또는 알파 블렌드, 월드 y 스캔 마스크, 양자화한 시간으로 정점 밴드 밀기, 프레넬, 깜빡임(정책상 초당 3회 이하).
- **수업 연계**: 3D 07 External Assets의 `Holographic`(수강생이 원리 없이 쓰던 효과), XR 인터랙션 UI.
- **core.hlsl**: ○ (정점 오프셋 함수 포함). **XR ○** (알파 블렌드 과드로우 주의).

#### 15. scroll-distort-energy — 스크롤·왜곡 에너지 (★2, 2순위, 근거 중)
- **설명**: 길게 늘인 메시에 서로 다른 방향으로 흐르는 텍스처 두 장, 노이즈 왜곡, 그라데이션 마스크를 겹쳐 레이저, 토네이도, 마법 기운을 만든다.
- **왜 자주 쓰나**: GDC 2021 Shader Sauce가 손그림 애니메이션과 시뮬레이션 없이 기본 셰이더 기법을 겹쳐 스타일 VFX를 만드는 방식을 소개한다(슬라이드 미열람). Unity 6 e-book이 프로시저럴 노이즈 VFX를 다루고, Feature Examples에 Flipbook이 있다. 이 항목은 한 출처가 효과 자체를 증명하지 않아 근거를 중으로 둔다. 출처: https://gdcvault.com/play/1027131/Visual-Effects-Summit-Shader-Sauce (△) · https://unity.com/kr/resources/create-shaders-visual-effects-urp-unity-6 (○)
- **대표 게임 예**: 범용 기법, 대표작 미확인.
- **무대**: 메시(원통, 리본).
- **URP 핵심 기법**: UV 패닝 두 레이어(반대 방향), `uv += noise * k`, 가산 블렌드, 끝단 알파 마스크, HDR 색(블룸).
- **수업 연계**: 3D 07 External Assets의 FORGE3D `Additive`, `AlphaBlended` 그래프, 2D의 MagicArsenal 이펙트가 같은 원리를 쓴다.
- **core.hlsl**: ◎. **XR ○**.

#### 29. ground-aoe-indicator — 지면 범위 표시 (★3, 추가, 근거 중~강)
- **설명**: 바닥과 소품을 감싸는 상자 메시를 그리고, 픽셀마다 씬 깊이로 그 자리에 실제로 있는 표면의 위치를 되살린다. 그 위치를 상자 공간으로 옮겨 상자 밖은 버리고, 위에서 내려다본 좌표(xz)로 원, 고리, 부채꼴을 그린다. 바닥이 울퉁불퉁하거나 소품이 끼어 있어도 표시가 표면을 따라 붙는다. 스킬 사거리, 공격 예고, 대상 선택 고리에 쓴다. URP Decal Projector 를 쓰지 않고 HLSL 로 직접 쓰는 박스 투영이다.
- **왜 자주 쓰나**: 상자를 그려 깊이에서 위치를 되살리고 상자 공간으로 투영해 밖을 버리는 "화면 공간(지연) 데칼"은 업계 표준으로 불릴 만큼 흔하다. Wronski 는 이 방식을 "industry standard" 라 부르며 상자 공간 투영과 가장자리 밉 문제를 다룬다. Unity 블로그(Aras, 2015)가 상자 하나가 그 안의 모든 지오메트리에 영향을 주는 지연 데칼 예제를 보이고, Unreal 문서도 데칼을 "영향 영역을 둘러싼 상자"로 그리며 비용이 화면에서 상자 크기에 비례한다고 쓴다. URP 17 에도 같은 계열의 Decal Renderer Feature 가 들어 있다. Unity 문서의 깊이에서 월드 위치 복원 예제(`ComputeWorldSpacePosition`)가 손으로 쓰는 판의 기초다. 지면 범위 표시라는 쓰임에 대한 근거는 Riot 기술 글(포탑 사거리 표시를 데칼 단계에서 그림, 아래 대표 게임 참고)과 커뮤니티 글(Unreal 포럼의 MOBA 사거리 데칼, Godot 의 텔레그래프 데칼 셰이더)이다. 출처: https://bartwronski.com/2015/03/12/fixing-screen-space-deferred-decals/ (○, 2026-11-03 열람) · https://unity.com/blog/engine-platform/extending-unity-5-rendering-pipeline-command-buffers (○, 2026-11-03 열람) · https://dev.epicgames.com/documentation/en-us/unreal-engine/decal-actors-in-unreal-engine (○, 2026-11-03 열람) · https://docs.unity.com/en-us/engine/6000.3/manual/materials-and-shaders/shaders/writing-custom-shaders-urp/writing-shaders-urp/reconstruct-world-position (○, 2026-11-03 열람) · https://www.riotgames.com/en/news/trip-down-lol-graphics-pipeline (○, 2026-11-03 열람) · https://godotshaders.com/shader/constructive-telegraph-decals/ (△, 열기 실패 429, 검색 요약만)
- **대표 게임 예**: 범용 기법, 대표작 미확인. 깊이 투영 방식의 지면 표시를 특정 게임과 묶은 개발 발표나 공식 글을 찾지 못했다. 참고로 Riot 의 기술 글(Tony Albrecht, 2017-01-12)은 League of Legends 의 포탑 사거리 표시를 "지형 위에 겹쳐 놓는 단순한 평면 텍스처 지오메트리"인 데칼로 설명한다. 사거리 표시라는 쓰임은 맞지만 깊이 투영이 아니라 **평면 메시 방식**이라 이 표본의 대표작으로는 적지 않는다. Wronski 글이 언급하는 Saints Row: The Third, Warhammer 40,000: Space Marine 의 데칼 발표도 일반 데칼(총탄 자국 등)이지 지면 표시가 아니다.
- **무대**: 깊이 사용 (`mesh: 'cube'`). 상자가 바닥 가운데를 덮고 오른쪽 상자 소품의 모서리와 왼쪽 공의 옆면이 상자 안에 들어온다(배치 계산, 촬영 미확인).
- **URP 핵심 기법**: `SampleSceneDepth` 로 씬 깊이를 읽고, 이 픽셀과 씬 표면이 같은 시선 위에 있다는 점으로 씬 위치를 되살린다(Unity 예제는 `ComputeWorldSpacePosition(UV, depth, UNITY_MATRIX_I_VP)`). 상자 공간으로 옮겨 `abs(p) > 0.5` 면 버리기, xz 로 원·고리·부채꼴 SDF, `ddx`/`ddy` 로 되살린 위치의 법선을 구해 옆면 감쇠, `ZWrite Off` 알파 혼합, URP 에셋 Depth Texture.
- **수업 연계**: 수업 프로젝트에 같은 효과는 없다(확인한 범위). 3D 17 FPS Game 보스전의 공격 예고, 3D 15 Navigation 의 이동 목표 표시, 3D 05 Terrain 의 울퉁불퉁한 지형 위 투영이 쓰임새다. 2D 15 Mini Defence 의 사거리 표시는 같은 발상이지만 2D Renderer 라 깊이 무대 패스가 그려지지 않으므로 직접 연결하지 않는다. `force-field-intersection`(깊이 차이)의 다음 단계로, 깊이를 "차이"가 아니라 "위치"로 되살리는 첫 표본이다.
- **core.hlsl**: ○ (위치 복원, 상자 공간, 모양, 감쇠 계산이 core. 깊이는 래퍼. 단, 상자 공간으로 옮기려면 무대에 새 입력이 필요하다. 설계 제안 2절). **XR △** (Depth Texture 필요, 모바일 XR 에셋은 꺼짐, 실기기 미확인).
- **비고 (2026-11-03 결정)**: 상자 공간으로 옮기는 입력은 무대에 `cameraPosOS` 를 더해 해결했다 (가이드 4절).

### 2D (3개)

#### 16. sprite-outline-hit-flash — 스프라이트 외곽선 + 피격 번쩍임 (★2, 1순위, 샘플 S, 근거 강)
- **설명**: 이웃 픽셀 알파로 스프라이트 외곽선을 그리고, 피격 때 단색으로 번쩍였다 돌아온다.
- **왜 자주 쓰나**: 외곽선, 디졸브, 히트 플래시, 샤인을 한 세트로 묶은 2D 팩이 엔진을 가리지 않고 판매된다. 게임 필 글은 번쩍임을 "맞았다"를 알리는 저비용 신호로 설명한다. 외곽선은 아틀라스 이웃 스프라이트가 끌려오는 문제와 1~2px 패딩 해법이 포럼에 반복된다. 수업이 이미 같은 효과를 `_HitEffectBlend`와 상용 에셋으로 쓴다. 출처: https://discussions.unity.com/t/2d-outline-with-texture-sprite-in-multiple-invading-neighbor-frame/948815 (△) · https://uhiyama-lab.com/en/notes/unity/unity-game-feel-hit-feedback/ (△) · https://forum.godotengine.org/t/2d-fx-essentials-nine-free-sprite-shaders-for-godot-4-outline-dissolve-hit-flash-shine/145788 (△)
- **대표 게임 예**: 범용 기법, 대표작 미확인(번쩍임이 요점인 강연 "Juice it or lose it"은 게임이 아니라 강연이라 inspiredBy로 쓰지 않음).
- **무대**: 스프라이트.
- **URP 핵심 기법**: 4~8방향 알파 샘플과 `_MainTex_TexelSize` 두께, `lerp(색, 번쩍임 색, 값)`와 알파 보존, 1-2절의 2D 규격(패스 태그, 인스턴스 머티리얼, 패딩).
- **수업 연계**: 2D 02 Sprite Renderer, 14 Action Platformer와 99 Rockman의 `Enemy.cs`(`_HitEffectBlend`, `SpriteRenderer.material` 인스턴스 정리).
- **core.hlsl**: ◎. XR 해당 없음.

#### 17. palette-swap-lut — 팔레트 스왑 (★2, 2순위, 근거 강~중)
- **설명**: 스프라이트의 인덱스(그레이 단계)를 한 줄짜리 팔레트 텍스처로 바꿔 캐릭터 색 변형과 팀 컬러를 이미지 한 장으로 만든다.
- **왜 자주 쓰나**: 스왑 텍스처 튜토리얼, 1×256 팔레트와 반 텍셀 오프셋 포럼 글, 오픈 소스 팔레트맵, 유료 에셋이 있다. Little Nemo 제작기가 조명 분위기를 바꾸는 팔레트 스왑을 커스텀 스프라이트 셰이더로 지원한다고 쓴다. 출처: https://code.tutsplus.com/how-to-use-a-shader-to-dynamically-swap-a-sprites-colors--cms-25129t (△) · https://discussions.unity.com/t/palette-swapping-shader-for-single-channels/676602 (△) · https://diesoft.games/2022/06/13/nemo-art-pipeline.html (△)
- **대표 게임 예**: Little Nemo and the Guardians of Slumberland(제작기로 확인). 제작사 DIE SOFT, PC 출시 2026 (2026-11-02 리뷰에서 기사로 확인).
- **무대**: 스프라이트.
- **URP 핵심 기법**: 포인트 필터, 반 텍셀 오프셋 샘플, 스프라이트와 팔레트의 sRGB 설정, 머티리얼별 팔레트 텍스처.
- **수업 연계**: 2D 08 Merge Game(단계별 색), 99 Rockman(클래식 팔레트 연출).
- **core.hlsl**: ◎. XR 해당 없음.

#### 18. tiling-scroll-parallax — 타일 스크롤 패럴랙스 (★1, 3순위, 근거 약~중)
- **설명**: 머티리얼 UV 오프셋으로 끝없이 이어지는 배경을 스크롤하고 층마다 속도를 달리해 시차를 만든다.
- **왜 자주 쓰나**: SpriteRenderer에서는 텍스처 오프셋이 먹지 않아 커스텀 스프라이트 셰이더가 필요하다는 포럼 글과, 트랜스폼 이동 방식의 패럴랙스 튜토리얼이 있다. **공식 문서나 강연 근거는 없다.** 수업 연계가 강해서 3순위로 남겼다. 출처: https://discussions.unity.com/t/is-it-still-possible-to-scroll-sprite-textures-with-material-maintextureoffset/652556 (△) · https://dev.to/nafisnil/create-parallax-effect-of-a-2d-game-background-unity3d-2ked (△)
- **대표 게임 예**: 범용 기법, 대표작 미확인.
- **무대**: 스프라이트.
- **URP 핵심 기법**: `frac(uv)`, 래핑 모드 Repeat(아틀라스에 넣지 않은 단독 텍스처), 카메라 위치 기반 오프셋, 정수 PPU 스냅, 오프셋 방향 부호.
- **수업 연계**: 2D 05 Layer And Scroll의 `ScrollController`(오브젝트를 좌우상하로 옮겨 스크롤)와 비교하는 수업용 대안.
- **core.hlsl**: ◎. XR 해당 없음.

#### 33. sprite-wind-sway — 스프라이트 바람 흔들림 (★2, 추가, 근거 중)
- **설명**: 풀 덤불, 수초, 매달린 장식 같은 스프라이트의 위쪽만 바람에 좌우로 흔든다. 정점 단계에서는 `uv.y`(뿌리 0, 끝 1)에 비례해 꼭짓점을 옆으로 밀어 스프라이트를 기울인다. 조각 단계에서는 `uv.x` 를 높이에 따라 조금 되돌려 곧은 기울기를 휜 모양으로 바꾼다. 위상은 꼭짓점의 **월드 x** 에서 얻으므로, 같은 그림을 여러 장 놓아도 자리마다 박자가 다르고 배칭 방식이 바뀌어도 결과가 같다. 플레이어가 지나갈 때 한 번 휘청이는 밀기 이벤트도 있다. 3D `wind-sway-foliage` 의 2D 짝이다. 5절의 "스프라이트 정점 왜곡(물 반사, 깃발)" 후보에서 흔들림만 떼어 왔다. 물 반사는 Camera Sorting Layer Texture 가 필요해 계속 제외한다.
- **왜 자주 쓰나**: Unity 의 공식 2D 샘플 Happy Harvest(URP 2D)는 소개 글에 "나무와 다른 식물을 셰이더로 움직여 산들바람을 흉내 낸다"고 적었다. Unity 블로그(2018)는 풀과 잎의 바람을 월드 공간 그래디언트 노이즈로 밀고 "UV 마스크로 밑동을 고정한다"고 설명한다. 이 글은 3D 메시 기준이지만 마스크와 월드 노이즈라는 구성은 같다. Unity 포럼에서 스프라이트 풀 전체가 움직인다는 질문에 `UV.y` 를 곱하라는 답이 달렸다. Godot 커뮤니티의 2D 흔들림 셰이더들은 같은 효과를 조각 단계 UV 밀기로 만든다. 사각형을 키워 여유를 두고 높이 마스크를 쓴다. 수업 2D 프로젝트에 들어 있는 상용 에셋 AllIn1SpriteShader 에도 "Grass Movement"(`WIND_ON`)가 있다(로컬 확인). 이 기능은 조각 단계 `uv.x` 밀기와 스프라이트 사각형 기준 높이 마스크를 쓰고, 머티리얼마다 `_RandomSeed` 를 넣는다. 아틀라스 사각형은 `SetAtlasUvs` 스크립트가 머티리얼에 넣는다. 정점 수 제약은 Unity 문서로 확인했다. Full Rect 는 사각형 하나이고 Tight 는 알파 외곽을 따른다. 출처: https://unity.com/blog/games/happy-harvest-demo-latest-2d-techniques (○, 2026-11-03 열람) · https://unity.com/blog/engine-platform/creating-animated-materials-with-shader-graph (○, 2026-11-03 열람) · https://discussions.unity.com/t/move-grass-shader/912816 (○, 2026-11-03 열람) · https://godotshaders.com/shader/2d-wind-sway-tree-grass-motion-shader/ (○, 2026-11-03 열람) · https://godotshaders.com/shader/2d-pixel-perfect-wind-sway-effect/ (△) · https://docs.unity.com/en-us/engine/6000.3/manual/materials-and-shaders/textures/textures-reference/texture-type-sprite (○, 2026-11-03 열람)
- **대표 게임 예**: 범용 기법, 대표작 미확인. Hollow Knight, Ori and the Blind Forest, Dead Cells, Celeste 를 찾아봤지만 스프라이트 바람 흔들림을 셰이더로 만들었다는 개발 발표나 공식 글은 없었다. Unity 의 Hollow Knight 사례 글도 바람이나 풀 셰이더는 말하지 않는다(△). Happy Harvest 는 게임이 아니라 Unity 샘플이라 `inspiredBy` 에 넣지 않는다.
- **무대**: 스프라이트. 풀 덤불 텍스처(`stage.textures._MainTex`, 직접 생성)를 쓴다. `stage.layers` 로 같은 덤불을 좌우에 두 장 더 놓아 위상이 자리마다 다른 것을 보인다. 정점 단계(`sgVertex`)와 월드 위치 입력이 필요하다(설계 제안 2절).
- **URP 핵심 기법**: 정점에서 `TransformObjectToWorld` 로 월드로 옮긴 뒤 x 만 밀고 `TransformWorldToHClip` 으로 그린다. 그래서 SRP Batcher 경로와 동적 배칭 경로가 같은 결과를 낸다. 마스크는 선형 `uv.y` 로 두어 정점 수와 상관없이 같은 기울기를 낸다. 조각 단계 휨 보정은 `uv.x += S·(y − y²) / 폭` 으로 하고, 폭은 `ddx(uv.x)/ddx(positionWS.x)` 로 구한다. 위상은 월드 x 에서 얻고, 값 노이즈 돌풍이 x 를 따라 흐른다. 패스는 `Universal2D`·`UniversalForward` 두 개다. `UnityFlipSprite` 뒤에 밀고, 정점 색(`unity_SpriteColor`)은 유지한다. Mesh Type 은 Full Rect 로 두고 텍스처에 투명 여백을 둔다.
- **수업 연계**: 2D 02 Sprite Renderer(Mesh Type, Pivot), 05 Layer And Scroll(장식 층), 14 Action Platformer(플레이어가 풀을 지나가면 트리거로 밀기). 수업 프로젝트의 Kenney New Platformer Pack 에 `grass.png`, `bush.png` 장식 스프라이트가 있다(로컬 확인). 수업이 상용 AllIn1SpriteShader 의 Grass Movement 로 쓰던 효과의 원리편이다. 3D 쪽은 `wind-sway-foliage`(그리고 XR `FishSwim`)와 짝을 이룬다.
- **core.hlsl**: ○. 밀기, 휨, 위상, 돌풍 계산은 core 에 둔다. 월드 위치는 래퍼와 무대가 넘긴다. 웹 스프라이트 무대에 정점 단계와 `positionWS` 가 있어야 한다. XR 해당 없음.
- **비고 (2026-11-03 결정)**: 스프라이트 무대에 정점 단계를 넣었다. 스프라이트의 `sgVertex` 는 월드 위치를 받고 돌려주며, `SgInput.positionWS` 는 밀기 전 월드 위치다 (가이드 3-4·4절). 배칭 경로에 상관없이 같은 결과를 낸다.

### UI (3개)

UI 표본은 UGUI에서 쓰는 것을 기본으로 한다. 정점 색과 UV를 받는 Image 호환이 필요하다. 미리보기 무대가 UI 캔버스를 제공하지 않으므로 스프라이트 무대로 대체한다(7절 5번).

#### 19. ui-sdf-shape — SDF 도형 (★2, 1순위, 근거 강~중)
- **설명**: 거리장(SDF)으로 둥근 사각형, 원, 링 진행 바를 해상도와 상관없이 매끈하게 그리고 윤곽선과 채움을 분리한다.
- **왜 자주 쓰나**: Unity의 UGUI Shaders 샘플이 SDF 도형 6종, RoundedCorners, Anti Aliasing 헬퍼, 진행 바 예를 제공한다. 오픈 소스 SDF UI 패키지와 둥근 모서리 패키지도 있다. 같은 원리를 UI 갤러리의 `tutorial-spotlight` 컷아웃이 쓴다. 작은 상자에서 가장자리 아티팩트 보고가 있어 구현 때 확인이 필요하다. 출처: https://docs.unity3d.com/Packages/com.unity.shadergraph@17.4/manual/Shader-Graph-Sample-UGUI-Shaders-Subgraph-nodes.html (○) · https://github.com/TLabAltoh/Unity-SDF-UI-Toolkit/wiki (△) · https://github.com/smitdylan2001/Unity-UI-Rounded-Corners (△)
- **대표 게임 예**: 범용 기법, 대표작 미확인.
- **무대**: 스프라이트(UI 대체).
- **URP 핵심 기법**: `fwidth` 기반 안티앨리어싱, Fill/Stroke 출력, 불리언 합성(합집합·차집합), 종횡비 보정, 정점 색 곱.
- **수업 연계**: 2D 09 UGUI Basic Component, 10 Inventory And TradeSystem(슬롯), 15 Mini Defence HUD. UI 갤러리(`C:\Users\user\UIGallery`)와 짝.
- **core.hlsl**: ◎ (`fwidth`는 웹에서 `fwidth`/`dFdx` 매크로로). XR 해당 없음~○ (월드 스페이스 캔버스 사용은 미확인).

#### 20. ui-sheen-sweep — 광택 훑기 (★1, 2순위, 근거 강~중)
- **설명**: 버튼, 카드, 아이콘 위를 대각선 빛 띠가 주기적으로 지나간다. 레어 표시와 클릭 유도에 쓴다.
- **왜 자주 쓰나**: UGUI Shaders 샘플에 Animated Sheen 서브그래프가 있고, 유명 Unity UI 효과 패키지가 Shiny 컴포넌트를 둔다. 샤인이 외곽선, 디졸브와 함께 한 세트로 묶이는 타 엔진 팩도 있다. 출처: https://docs.unity3d.com/Packages/com.unity.shadergraph@17.4/manual/Shader-Graph-Sample-UGUI-Shaders-Subgraph-nodes.html (○) · https://github.com/mob-sakai/UIEffect (△) · https://forum.godotengine.org/t/2d-fx-essentials-nine-free-sprite-shaders-for-godot-4-outline-dissolve-hit-flash-shine/145788 (△)
- **대표 게임 예**: 범용 기법, 대표작 미확인.
- **무대**: 스프라이트(UI 대체).
- **URP 핵심 기법**: 대각선 선형 그라데이션 마스크와 `frac(time)`, 이미지 알파로 마스킹, 가산 합성, 주기·간격 파라미터. 스프라이트 샤인으로도 쓸 수 있어 2D 프리셋을 둔다.
- **수업 연계**: 2D 09 UGUI Basic Component, 10 Inventory And TradeSystem(희귀 아이템 슬롯).
- **core.hlsl**: ◎. XR 해당 없음~○.

#### 21. ui-backdrop-blur — 배경 블러 유리 (★3, 3순위, 근거 중)
- **설명**: 패널 뒤 화면을 흐리게 비추는 반투명 유리 배경이다.
- **왜 자주 쓰나**: UGUI Shaders 샘플에 나선 샘플링 배경 블러(`Scene Color Blurred`)가 있다. 다만 Screen Space Overlay 캔버스는 카메라가 그린 이후에 그려져 카메라 결과를 캡처할 수 없으므로 Camera나 World 캔버스가 필요하다는 포럼 서술이 있다. UI Toolkit의 배경 필터는 7000.0 알파 문서에서만 확인했고 6.3 지원은 미확인이다. 출처: https://docs.unity3d.com/Packages/com.unity.shadergraph@17.4/manual/Shader-Graph-Sample-UGUI-Shaders-Subgraph-nodes.html (○) · https://discussions.unity.com/t/ugui-blurred-ui-image-for-all-render-pipelines-and-canvas-types-overlay-camera-world/928393 (△)
- **대표 게임 예**: 범용 기법, 대표작 미확인.
- **무대**: 깊이 사용(씬 컬러 겸용, 7절 5번).
- **URP 핵심 기법**: `SampleSceneColor`, 다중 탭 블러(비용), Screen Space Camera 캔버스, URP 에셋 Opaque Texture. 2D Renderer는 Camera Sorting Layer Texture.
- **수업 연계**: 2D 09 UGUI Basic Component(캔버스 렌더 모드 개념을 이어서 설명).
- **core.hlsl**: △~○ (씬 컬러 소스가 래퍼 입력). **XR ✕** (월드 스페이스 UI에서의 용도 불분명, 비용 큼).

### 후처리 (3개)

#### 22. screen-transition-wipe — 화면 전환 와이프 (★1, 1순위, 샘플 S, 근거 강(원리))
- **설명**: 진행값과 마스크(원, 대각선, 텍스처)를 비교해 화면을 덮고 걷는다. 아이리스와 와이프를 한 셰이더로 만든다.
- **왜 자주 쓰나**: 그래픽스 학술지의 고전 글이 흑백 마스크로 와이프를, 마스크 크기를 시간에 따라 바꾸면 아이리스를 만든다고 설명한다. 오픈 소스 전환 셰이더와 마스크 생성기, Flutter 패키지가 같은 원리를 쓰며 첫 사용 때 셰이더 컴파일이 느리니 시작 시 미리 로드하라고 조언한다. Unity 전용 근거는 상용 에셋뿐이라 약하다. 출처: https://www.glassner.com/wp-content/uploads/2014/04/CG-CGA-PDF-01-05-A-Change-of-Scene-May01.pdf (△) · https://godotshaders.com/shader/universal-transition-shader/ (△) · https://pub.dev/packages/shader_transitions (△)
- **대표 게임 예**: 범용 기법, 대표작 미확인.
- **무대**: 전체 화면.
- **URP 핵심 기법**: Full Screen Pass 또는 UI RawImage, 화면비 보정 거리, 진행값 `smoothstep` 가장자리, 씬 로드 타이밍 코루틴. 첫 프레임 컴파일 지연을 시작 시 워밍업.
- **수업 연계**: 2D 13 Scene Management, 99 Async And Tween, 99 Lerp And Coroutine 2D.
- **core.hlsl**: ◎. **XR ✕** (머리에 고정된 전체 화면 와이프는 비권장, 추정). 2D Renderer의 Full Screen Pass 지원 미확인.

#### 23. depth-normal-edge-outline — 깊이·법선 윤곽선 후처리 (★3, 2순위, 근거 강~중)
- **설명**: 깊이와 법선의 차이로 전체 화면에 윤곽선을 그려 툰, 스케치 룩을 만든다. 오브젝트 수와 상관없는 비용이다.
- **왜 자주 쓰나**: Production Ready의 후처리에 Edge Detection이 있고(깊이 또는 법선 가장자리를 씬 위에 블렌드), Unity 6 e-book에 툰·외곽선과 후처리 AO 레시피가 있다. 후처리는 오브젝트 수와 상관없지만 개별 오브젝트 분리가 어렵다는 점이 껍데기 외곽선과 비교된다. 출처: https://docs.unity3d.com/Packages/com.unity.shadergraph@17.4/manual/Shader-Graph-Sample-Production-Ready-Post.html (○) · https://unity.com/kr/resources/create-shaders-visual-effects-urp-unity-6 (○) · https://realtimevfx.com/t/unity-outline-by-normals-for-mobile-game-urp/14919 (△)
- **대표 게임 예**: 범용 기법, 대표작 미확인.
- **무대**: 전체 화면(+깊이).
- **URP 핵심 기법**: Full Screen Pass Requirements의 Depth와 Normal, Sobel 또는 Roberts Cross, 깊이 선형화, 거리 감쇠, 두께 파라미터.
- **수업 연계**: 3D 14 Animation의 `SimpleUnlitToon` 껍데기 외곽선과 비교하는 수업.
- **core.hlsl**: ○ (깊이·법선 샘플은 래퍼가 함수로 제공). **XR △** (깊이·법선 필요, 텍스처 배열, 모바일 비용).

#### 24. screen-vignette — 화면 비네트 (★1, 1순위, 근거 강(공식))
- **설명**: 화면 가장자리를 어둡게 하거나 붉게 하는 오버레이다. 피격과 저체력 경고, VR 멀미 완화 터널링에 같은 수식을 쓴다.
- **왜 자주 쓰나**: XR Interaction Toolkit이 TunnelingVignetteController(aperture 0~1, 페더, 서서히 켜기와 끄기)를 제공하고 Meta Interaction SDK도 비네트를 도 단위로 정의해 기기별 시야각 차이를 없앤다. 수업 XR 프로젝트에 `TunnelingVignette` 셰이더가 이미 있다. 게임 디자인 측면에서는 피격 번쩍임과 저체력 상태를 분리하고 끄기 옵션을 둔다는 실무 글이 있다(일화 수준). 출처: https://docs.unity3d.com/Packages/com.unity.xr.interaction.toolkit%403.0/manual/tunneling-vignette-controller.html (△) · https://developers.meta.com/horizon/documentation/unity/unity-isdk-locomotion-comfort/ (△) · https://community.focus-entmt.com/focus-entertainment/space-marine-2/ideas/8114-can-we-get-an-option-to-remove-the-vignette (△)
- **대표 게임 예**: Space Marine 2(저체력 비네트에 대한 이용자 글로 확인). 원제 Warhammer 40,000: Space Marine 2, 출시 2024, 개발 Saber Interactive (2026-11-02 기사로 확인).
- **무대**: 전체 화면.
- **URP 핵심 기법**: Full Screen Pass, 중심 거리 `smoothstep`, 화면비 보정, 맥동(초당 3회 이하), 강도를 C#이 체력으로 전달, 끄기 옵션.
- **수업 연계**: XR의 XRI `TunnelingVignette` 샘플과 터널링 설정, 2D·3D 체력 HUD(UI 갤러리 체력 바 계열과 연결).
- **core.hlsl**: ◎. **XR △** (눈별 대칭과 시야각 기준 정의 필요). URP Volume에 내장 Vignette가 있어 기능이 겹치는 점은 7절 6번(일반 지식, 미검증).

#### 30. screen-crt-scanline — CRT 화면 필터 (★2, 추가, 근거 중)
- **설명**: 화면을 가상 해상도의 가로 줄(스캔라인)로 나누고, 줄 중심에서 화면 색을 읽어 빔 모양으로 밝기를 깎는다. 그 위에 RGB 형광체 마스크(세로 줄 또는 슬롯), 볼록한 화면 휨(배럴 왜곡)과 가장자리 검은 테, 비네트, 가로 색 번짐을 얹는다. 어두워진 만큼 밝기를 되돌린다. 하프톤은 넣지 않는다(설계 제안 1번).
- **왜 자주 쓰나**: libretro 문서가 CRT 셰이더를 "CRT 디스플레이의 특성을 현대 하드웨어로 재현"하는 것으로 정의하고, 대부분이 스캔라인과 형광체 마스크를 쓰며 일부가 가짜 곡률을 더한다고 정리한다. 같은 문서가 crt-geom, Timothy Lottes 작업 기반의 crt-lottes, crt-royale 등 수십 종을 나열하고 "정수 배율에서 더 좋아 보인다", 약한 기기에는 zfast-crt 를 먼저 쓰라고 안내한다. crt-royale 문서는 세로 줄(aperture grille), 슬롯, 섀도 마스크 세 가지를 다루고, 마스크와 스캔라인으로 잃는 밝기를 블룸으로 되돌리는 것과 그 비용을 설명한다. libretro 포럼 스레드(2018)는 곡률이 스캔라인을 휘게 해 화면 픽셀 격자와 어긋나 모아레가 생기고 정수 배율로도 잘 안 사라지며 약간의 흐림이 필요하다는 점을 반복한다. Unity 공식 Production Ready 후처리 샘플에는 CRT 가 없고 Half Tone 과 VHS 가 따로 있다. 출처: https://docs.libretro.com/shader/crt/ (○, 2026-11-03 열람) · https://docs.libretro.com/shader/crt_royale/ (○, 2026-11-03 열람) · https://forums.libretro.com/t/shader-curvature-and-moire/16174 (○, 2026-11-03 열람) · https://docs.unity3d.com/Packages/com.unity.shadergraph@17.4/manual/Shader-Graph-Sample-Production-Ready-Post.html (○, 2026-11-03 열람)
- **대표 게임 예**: Teenage Mutant Ninja Turtles: Shredder's Revenge(2022-12-23 업데이트 보도 자료로 확인. 옵션 메뉴에 CRT 필터 일반·곡면과 VCR 필터를 더했다는 Tribute Games·Dotemu 명의 글). 출시 2022(PC·Switch·PS4·Xbox One 2022-06-16), 개발 Tribute Games, 배급 Dotemu (Wikipedia 로 확인). 출처: https://indigo-pearl.prezly.com/teenage-mutant-ninja-turtles-shredders-revenge-update-now-available (○, 2026-11-03 열람) · https://en.wikipedia.org/wiki/Teenage_Mutant_Ninja_Turtles:_Shredder%27s_Revenge (○, 2026-11-03 열람). 보도 자료는 옵션 이름만 밝히고 구현은 설명하지 않는다. 하프톤 화면 셰이더의 대표작은 미확인.
- **무대**: 전체 화면 (`stage.bright` 권장: 어두운 무대에서는 스캔라인과 마스크가 묻힌다).
- **URP 핵심 기법**: Full Screen Pass(`_BlitTexture`, Requirements 없음), `texelSize` 로 화면 높이를 구해 스캔라인 간격을 정수 픽셀로 맞추기, 줄 중심 샘플, 빔 프로필(`smoothstep` 또는 가우시안), `fwidth` 로 줄이 너무 촘촘하거나 휠 때 대비 낮추기, 픽셀 열 번호로 RGB 마스크, 화면비 보정 배럴 왜곡과 바깥 검은 테, 가로 3탭 색 번짐, 밝기 보정, 비네트. 깜빡임·흘러가는 스캔라인은 쓰지 않는다.
- **수업 연계**: 2D 99 Rockman 과 14 Action Platformer, 외부 에셋 Space Shooter Redux(레트로 픽셀 게임에 덮는 화면 필터). 2D Renderer 에서 Full Screen Pass 가 동작함은 plan 11절에서 확인됐다. 픽셀 퍼펙트 카메라(URP 2D 내장)의 기준 해상도와 가상 줄 수를 맞추는 이야기로 이어진다. `screen-vignette`(같은 가장자리 수식), `screen-shockwave-distortion`(UV 휨과 Clamp 샘플러), `hologram-scanline-glitch`(메시 위 월드 y 스캔라인과 비교).
- **core.hlsl**: ◎ (`uv`, `aspect`, `texelSize`, `time`, `sgSource` 만 쓴다). **XR ✕** (머리에 고정된 화면 공간 줄무늬와 휨, 화면 중심이 눈 정면이 아님. 추정). XR 에서는 같은 core 를 가상 모니터 메시의 렌더 텍스처에 쓰는 방식을 권한다.
- **비고 (2026-11-03 결정)**: 하프톤은 핵심 코드와 단계가 겹치지 않아 이 표본에 넣지 않고 5절 후보로 돌렸다. 정지 줄무늬 안전 규칙은 가이드 7절.

#### 31. screen-halftone-dots — 하프톤 망점 (★2, 추가, 근거 중~강)
- **설명**: 화면을 비스듬히 돌린 정사각 칸 격자로 나누고, 칸마다 **칸 중심에서 한 번** 화면 색을 읽는다. 그 밝기(선형)로 잉크가 덮을 면적을 정하고, 면적이 맞도록 **반지름 = 제곱근**으로 원을 그린다. 원 가장자리는 `fwidth` 로 1픽셀만 부드럽게 한다. 흑백 한 판(신문), 칸 색으로 칠한 한 판(팝아트), 각도가 다른 C·M·Y·K 네 판(만화 인쇄) 세 방식을 고른다. 칸 크기는 화면 높이에 대한 줄 수로 정해 해상도가 바뀌어도 모양이 같다. 점은 흘리거나 움직이지 않는다.
- **왜 자주 쓰나**: Unity 공식 Production Ready 후처리 샘플에 Half Tone 이 있다. 빨강·초록·파랑마다 SDF 원 격자를 만들고 inverse lerp 로 점을 만들며 "점 크기가 그 자리 색의 밝기를 나타낸다"고 설명한다(CMYK 와 칸 크기 설명은 없다). 같은 Unity 의 UGUI Shaders 샘플에도 `Halftone` 서브그래프와 `Examples/Backgrounds/Halftone` 배경 예가 있다. Stefan Gustavson 의 WebGL 하프톤 튜토리얼이 기법을 단계별로 정리한다: 격자를 45도 돌리는 이유(눈이 가로·세로에 민감), 미분(`dFdx`, `dFdy`)으로 만든 `aastep()` 안티에일리어싱, CMYK 판 각도 15·75·0·45도, 점이 한 픽셀 크기로 줄면 원본으로 섞어 되돌리기. 이 튜토리얼은 원 면적이 반지름의 제곱에 비례함을 알면서도 설명을 단순하게 하려고 반지름을 밝기에 선형으로 두었고, 그래서 결과가 "너무 밝고 색이 빠진다"고 스스로 적는다. Maxime Heckel 의 글(2026-02-10)은 같은 과정을 칸 중심 샘플, 엇갈린 줄, CMYK 판마다 칸 중심 샘플과 `r = maxRadius × sqrt(coverage)`, 판을 다른 각도로 돌려 모아레를 줄이는 것까지 이어 가고, 칸 중심이 아니라 픽셀마다 읽으면 색 경계에서 점이 잘린다는 점과 고해상도 화면의 계단을 `fwidth` 로 막는 점을 짚는다. 인쇄에서 몇 가지 잉크로 그라데이션 착시를 만들던 기법이 지금은 질감을 더하는 표현 수단으로 쓰인다는 것이 두 글의 공통 설명이다. 출처: https://docs.unity3d.com/Packages/com.unity.shadergraph@17.4/manual/Shader-Graph-Sample-Production-Ready-Post.html (○, 2026-11-03 열람) · https://docs.unity3d.com/Packages/com.unity.shadergraph@17.4/manual/Shader-Graph-Sample-UGUI-Shaders-Subgraph-nodes.html (○, 2026-11-03 열람) · https://itn-web.it.liu.se/~stegu76/webglshadertutorial/shadertutorial.html (○, 2026-11-03 열람. 페이지에 저자·날짜가 없고 Gustavson 저작은 파생 패키지 설명으로만 확인, △) · https://blog.maximeheckel.com/posts/shades-of-halftone/ (○, 2026-11-03 열람)
- **대표 게임 예**: 범용 기법, 대표작 미확인 (화면 후처리로서). Hi-Fi RUSH(출시 2023-01-25, 개발 Tango Gameworks, Wikipedia 로 확인)는 GDC 2024 강연 "3D Toon Rendering in 'Hi-Fi RUSH'"(Kosuke Tanaka, Takashi Komada)의 주제 목록에 comic shader 가 있고, 강연 영상을 정리한 제3자 노트가 "Lit: halftone dot", "Shadow: hatching lines" 를 적으며 하프톤이 **카메라에 찍힌 인쇄처럼 보이지 않고 모델 위에 있게** 월드 법선·월드 UV 를 쓴다고 정리한다. 즉 **화면 공간 후처리가 아니라 표면 음영**이고, 이 표본이 만드는 화면 고정 무늬는 오히려 피한 쪽이다. 그래서 `inspiredBy` 는 비운다. 출처: https://gdcvault.com/play/1034251/3D-Toon-Rendering-in-Hi (○, 세션 설명만, 하프톤 언급 없음) · https://80.lv/articles/the-making-of-hi-fi-rush-s-3d-toon-rendering-style (○, 2024-07-10, 주제 목록만) · https://www.foth.top/article/gdc-2024-hifirush-toonrendering-notes/ (○, 2025-06-08, 제3자 노트, 2차 근거) · https://media.gdcvault.com/gdc2024/Slides/GDC+slide+presentations/Tanaka_Kosuke_3D_Toon_Rendering.pdf (△, 공식 슬라이드, 10MB 를 넘어 열지 못함) · https://en.wikipedia.org/wiki/Hi-Fi_Rush (○, 2026-11-03 열람)
- **무대**: 전체 화면 (`stage.bright` 권장: 어두운 무대는 거의 모든 칸이 큰 점으로 덮여 검은 덩어리가 되고, 밝은 하늘·바닥이 있어야 점 크기의 그라데이션이 보인다).
- **URP 핵심 기법**: Full Screen Pass(`_BlitTexture`, Requirements 없음, 주입 시점 After Rendering Post Processing 권장: 블룸과 톤매핑 뒤에 점을 찍어야 블룸이 점을 번지게 하지 않는다), `uv / texelSize` 로 픽셀 좌표를 만들어 화면비와 상관없이 정사각 칸, 2D 회전 헬퍼로 격자 돌리기, `floor + 0.5` 칸 중심을 거꾸로 돌려 uv 로 되돌린 뒤 한 번 샘플, 선형 휘도 → 잉크 덮임 `1 - Y`, 반지름 `sqrt(덮임 / π)`(원이 맞닿는 78.5% 위에서는 칸 반대각선 0.707 까지 보간), `fwidth` 로 1픽셀 경계, 칸이 3~4픽셀보다 작아지면 원본으로 섞기, CMYK 는 판 4개(15·75·0·45도)를 각자 칸 중심에서 샘플해 곱한다(종이 위 잉크).
- **수업 연계**: 3D 14 Animation 의 `SimpleUnlitToon`(툰 음영 위에 덮는 만화 인쇄 질감), `toon-ramp-lit` 과 `depth-normal-edge-outline`(외곽선 + 하프톤 = 만화 룩), `screen-crt-scanline`(같은 "가상 해상도 칸의 중심에서 읽기" 원리를 1D 줄에서 회전한 2D 칸으로 넓힌 것), `ui-sdf-shape`(원 SDF 와 `fwidth` 안티에일리어싱이 같다). 2D 과정의 만화풍 컷신이나 일시정지 화면 배경.
- **core.hlsl**: ◎ (`uv`, `aspect`, `texelSize`, `sgSource` 만 쓴다. `time` 은 쓰지 않는다). **XR ✕** (머리에 고정된 화면 공간 점 무늬는 두 눈의 무늬가 장면 깊이와 맞지 않아 화면에 붙은 막처럼 보인다. 추정, 실기기 미확인). XR 에서는 같은 원리를 표면 음영(월드 공간)으로 옮기는 변형을 권한다.
- **비고**: 화면 전체 정지 무늬 안전 규칙(가이드 7절)을 점 격자에도 적용한다 (설계 제안 7번).
- **비고 (2026-11-03 결정)**: 점 격자도 가이드 7절 정지 줄무늬 규칙을 따른다. 기본값과 촬영은 잉크가 종이의 60% 이상 밝기, 점은 움직이지 않는다. 신문 흑백처럼 대비가 높은 프리셋은 수강생이 고를 때만 쓰도록 허용한다.

## 3. 우선순위 요약

- **1순위 (12개)**: 샘플 4개(`dissolve-edge-glow`, `sprite-outline-hit-flash`, `force-field-intersection`, `screen-transition-wipe`)와 `toon-ramp-lit`, `fresnel-rim-glow`, `triplanar-projection`, `xray-occluded-silhouette`, `water-depth-foam`, `wind-sway-foliage`, `ui-sdf-shape`, `screen-vignette`. 근거가 강하고 수업 연계가 크며 규격 검증(메시, 깊이, 스프라이트, 전체 화면, UI)을 모두 덮는다.
- **2순위 (10개)**: `screen-refraction-glass`, `inverted-hull-outline`, `flow-map-liquid`, `surface-wet-snow`, `screen-shockwave-distortion`, `hologram-scanline-glitch`, `scroll-distort-energy`, `palette-swap-lut`, `ui-sheen-sweep`, `depth-normal-edge-outline`.
- **3순위 (2개)**: `tiling-scroll-parallax`(근거 약), `ui-backdrop-blur`(Overlay 제약, ★3). 앞 묶음을 보고 교체 여부를 정한다.
- **추가 (2개, 2026-11-03)**: `water-wave-surface`, `fire-noise-flame`. 24개를 다 만든 뒤 Jay 가 "가장 기본이 되는 물과 불" 을 요청했다. 둘 다 ★1 기초편이고 그룹에서 가장 앞에 둔다.

## 4. 5단계 제작 묶음 제안

샘플 4개는 plan 3-6에서 만든다. 아래 5개 묶음은 나머지 20개를 묶음당 4개로 나눈 것이다. 순서는 위험이 낮고 의존이 적은 것부터다.

| 묶음 | 항목 | 묶은 이유 |
|---|---|---|
| **1. 메시 표면·조명** | `toon-ramp-lit`, `fresnel-rim-glow`, `triplanar-projection`, `inverted-hull-outline` | 전부 메시 무대에 추가 텍스처나 깊이 의존이 없다. 조명 입력을 래퍼가 넘기는 규격(○)을 처음 굳히기에 안전하다. 수업의 `SimpleUnlitToon`과 XRI 프레넬을 확장하는 묶음이다. |
| **2. UV·정점 움직임** | `wind-sway-foliage`, `flow-map-liquid`, `hologram-scanline-glitch`, `scroll-distort-energy` | 시간 입력과 정점 변위, 알파 블렌드가 공통이라 웹 정점 단계 지원과 시간 파라미터 규격을 한 번에 검증한다. |
| **3. 2D 스프라이트·UI** | `palette-swap-lut`, `tiling-scroll-parallax`, `ui-sdf-shape`, `ui-sheen-sweep` | 스프라이트 무대를 공유하고 1-2절의 2D Renderer 규격(패스 태그, 인스턴스 머티리얼, 패딩)을 한꺼번에 시험한다. 샘플 `sprite-outline-hit-flash`가 먼저 규격을 증명해야 한다. |
| **4. 월드 정보·화면 기초** | `water-depth-foam`, `xray-occluded-silhouette`, `surface-wet-snow`, `screen-vignette` | 깊이, 월드 법선, 렌더러 기능(Render Objects, Full Screen Pass)의 첫 본격 사용이다. 샘플 `force-field-intersection`과 `screen-transition-wipe`가 깊이와 전체 화면 경로를 먼저 증명한 뒤에 만든다. |
| **5. 씬 컬러·깊이·법선 사용** | `screen-refraction-glass`, `screen-shockwave-distortion`, `depth-normal-edge-outline`, `ui-backdrop-blur` | Opaque Texture 의존과 모바일 XR·2D Renderer 제약이 몰려 있다. 앞 묶음에서 제약(7절 1~3번)이 정리된 뒤 마지막에 만든다. |

묶음 6(2026-11-03 추가)은 `water-wave-surface`, `fire-noise-flame` 이다. 둘 다 메시 무대에 깊이 의존이 없어 앞 묶음과 상관없이 만든다.

묶음 1~3은 서로 독립이라 병렬로 진행할 수 있다. 4는 3-6 샘플 뒤, 5는 4 뒤가 좋다. 묶음 5는 통째로 보류하거나 일부를 교체해도 앞 묶음에 영향이 없다.

## 5. 뺀 후보와 사유

| 후보 | 사유 |
|---|---|
| ~~지면 표시(AoE 범위 데칼)~~ | 2026-11-03 추가 (29번 `ground-aoe-indicator`). 무대에 `cameraPosOS` 를 더해 HLSL 박스 투영으로 만든다. |
| 속도선(방사형) | 근거가 오픈 소스 하나와 상용 팩 정도이고 Unity 6·URP 17 호환이 미확인이다. 후보 풀에 둔다. |
| CRT·VHS·하프톤 | CRT 는 30번, 하프톤은 31번 `screen-halftone-dots` 로 2026-11-03 추가. VHS 는 깜빡임 부담으로 계속 뺀다. |
| 볼류메트릭 구름·안개·물, 하늘 | 컴퓨트·레이마칭이 필요하고 ★3 이상이며 모바일 비용이 크다. 수업 연계도 약하다. |
| 코스틱 | XR 수업의 `Caustics.shader`에 이미 있다. `water-depth-foam`에서 링크한다. |
| 스텐실 포털, 깊이 가림 | XR 수업의 `PortalMask`, `Occlusion`에 이미 있다. `xray-occluded-silhouette`에서 링크한다. |
| 정점 사인 물고기 | XR 수업 `FishSwim`이 있다. `wind-sway-foliage`가 일반화한다. |
| 블룸, 피사계 심도, 색수차, LUT 색보정, SSAO | URP Volume과 렌더러 기능에 내장돼 있다(일반 지식). SSAO는 모바일 XR에서 비싸다고 Unity 문서가 경고한다(△). |
| 퍼 셰이더(다중 셸) | 다중 패스 비용이 크고 수업 연계가 약하다. 에셋 팩 구성에는 등장하지만 이번 조사에서 원리 근거를 따로 찾지 않았다. |
| 불·연기·플립북 | 파티클 시스템과 VFX Graph가 본체다. Feature Examples의 Flipbook이 있지만 별도 표본 가치가 낮다. |
| 매트캡, 패럴랙스(오클루전), 인테리어 매핑 | 매트캡 27번, 인테리어 매핑 32번 `interior-room-mapping` (2026-11-03 추가, Forza Horizon 4 개발자 글로 근거 확인). 패럴랙스 오클루전은 메시 무대에 탄젠트 입력이 없어 남는다. |
| 2D 픽셀화·픽셀 스냅 | Pixel Perfect Camera가 URP 2D에 내장돼 있다(△). |
| 2D 노멀맵 라이팅 스프라이트 | 내장 Sprite-Lit이 있다. 1-2절 규격(패스 태그)으로 반영했다. |
| 스프라이트 정점 왜곡(물 반사, 깃발) | 흔들림은 2026-11-03 추가 (33번 `sprite-wind-sway`). 물 반사는 Camera Sorting Layer Texture 가 필요해 계속 뺀다. |
| Gerstner·FFT 바다 | 범위가 너무 크다. `water-depth-foam`에서 Gerstner 몇 개만 쓴다. |
| 투명화(클로킹), 얼음·냉동 | 클로킹은 2026-11-03 추가 (28번 `cloak-refraction-shimmer`, Source SDK 공개 코드로 근거 확인). 얼음은 근거를 찾지 못했다. |
| 스프라이트 샤인 단독 | `ui-sheen-sweep`의 2D 프리셋으로 흡수했다. |

## 6. 근거가 약하거나 확인하지 못한 항목

1. `tiling-scroll-parallax` (약~중): 공식·강연 근거 없음, 포럼과 튜토리얼 위주.
2. `scroll-distort-energy` (중): 단일 강연의 소개 문구가 근거이고 슬라이드는 못 읽었다.
3. `surface-wet-snow` (중): Unity 샘플 한 가지에 의존하고 게임 사례를 못 찾았다.
4. `ui-backdrop-blur` (중): 캔버스 렌더 모드 제약이 포럼 서술이다. UI Toolkit 지원은 6.3에서 미확인.
5. `screen-shockwave-distortion` (중): 저장소와 포럼 중심이고 URP 12 시절 자료다. 현재 URP 17 동작은 시험이 필요하다.
6. `screen-transition-wipe`: 원리는 강하지만 Unity 전용 근거는 상용 에셋뿐이다.
7. `screen-vignette`의 게임 디자인 측면: 이용자 글과 모드 수준의 일화다. 공식 근거는 XR 쪽이다.
8. **2D Renderer 관련 두 가지는 전부 미확인**: Full Screen Pass 지원, Opaque Texture 현재 상태.
9. **게임 예 대부분이 미확인**: 대표작이 확인된 것은 Guilty Gear Xrd, Portal 2, Left 4 Dead 2, Sea of Thieves, Ghost of Tsushima, Overwatch, Call of Duty: Modern Warfare, Little Nemo, Space Marine 2뿐이다. 모두 화면을 직접 확인하지 못했다.
10. 모든 외부 URL의 라이선스를 열어 확인하지 않았다. 코드는 어디서도 가져오지 않는다.

## 7. 쟁점과 결정

2026-11-02 목록 확정과 함께 아래처럼 정했다. 표가 그 아래 쟁점 설명과 다르면 표를 따른다.

| 번호 | 결정 |
|---|---|
| 1 | 메타에 요구 사항을 적고 AI 지시 세트에 URP 설정 단계를 자동으로 넣는다 |
| 2 | Full Screen Pass 가 2D Renderer 에서 동작함을 촬영으로 확인했다 (plan 11절). UI 대안은 만들지 않는다. Opaque Texture 미지원은 소스만 읽은 판단이다 |
| 3 | 메시형만 XR 호환을 약속하고 △, ✕ 는 표시만 한다. 실기기 시험은 하지 않는다 |
| 4 | 확장편으로 둔다. 공개 앱이므로 비공개 수업 파일은 링크하지 않고 이름만 언급한다 |
| 5 | UI 3개는 스프라이트 무대를 쓴다. 씬 컬러 제공은 무대에 추가했다 |
| 6 | `screen-vignette` 를 유지하고 "Volume 으로 충분한 경우"를 해설에 넣는다 |
| 7 | 앞 묶음을 만든 뒤 유지 여부를 판단한다 |
| 8 | 지면 표시는 이번에 제외한다 |
| 9 | `inspiredBy` 는 출처가 확인된 게임만 적고 나머지는 비운다 |
| 10 | ID 는 0절의 제안대로 확정한다 |
| 11 | 전체 화면 표본은 내장 Full Screen Pass + 머티리얼만 쓴다 |
| 12 | 계획서 버전 표기는 정정했다 |

1. **깊이·씬 컬러 의존 표본의 URP 설정 정책** (6개). 켜야 하는 설정을 표본 메타에 `requires: [depth, opaque]`처럼 적고 AI 지시 세트에 자동으로 "URP 에셋에서 켜기" 단계를 넣는 것을 권장한다. 수업의 모바일·2D 에셋은 꺼져 있다.
2. **2D Renderer 한계**: Opaque Texture는 미지원으로 알려져 있고 Full Screen Pass 지원은 확인하지 못했다. 2D 대상 후처리형(전환, 비네트, 충격파)을 UI Image 방식으로 대체할지, plan 0-4 시험 결과를 보고 결정할지 정해 주세요. 권장은 시험 결과를 본 뒤 결정이다.
3. **XR 약속의 범위**: 메시형(○)은 래퍼 매크로로 호환을 약속하고, △와 ✕는 "주의, 비권장"으로 표시만 하는 것을 권장한다. 실기기 시험은 이번 범위에 넣지 않았다.
4. **수업과 겹치는 7개를 확장편으로 둘지**: `toon-ramp-lit`·`inverted-hull-outline`(수업 `SimpleUnlitToon`), `water-depth-foam`(`LakeWater`), `wind-sway-foliage`(`FishSwim`), `fresnel-rim-glow`(XRI), `screen-vignette`(XRI 터널링), `xray-occluded-silhouette`(`Occlusion`·`PortalMask`의 짝). 권장은 확장편으로 위치시키고 수업 파일을 해설에서 링크하는 것이다. 독립 표본으로 만들면 수업과 중복이다.
5. **무대 사양**: plan 4절의 무대 4종에는 UI 캔버스와 "씬 컬러 제공"이 없다. UI 3개는 스프라이트 무대로 대체하고, 씬 컬러가 필요한 3개(`screen-refraction-glass`, `ui-backdrop-blur`, `screen-shockwave-distortion`)는 "깊이 사용" 무대가 배경을 텍스처로 함께 제공하도록 확장하는 것을 권장한다.
6. **`screen-vignette`와 URP 내장 Vignette의 겹침**: URP Volume에 Vignette가 이미 있는 것으로 알고 있다(일반 지식, 이번에 문서로 확인하지 않았다). 이 표본의 고유 가치는 피격 펄스, 체력 연동, XR 터널링 연동이다. 유지하되 "Volume으로 충분한 경우"를 해설에 넣을지, 제외하고 `speed-lines`로 교체할지 정해 주세요. 권장은 유지다.
7. **근거가 약한 항목의 처리**: `tiling-scroll-parallax`(근거 약, 수업 연계 강)와 `ui-backdrop-blur`(제약 큼)를 3순위로 두었다. 앞 묶음을 만든 뒤 두 항목을 유지할지 판단하고, 교체한다면 후보 풀(속도선, 스프라이트 정점 왜곡)에서 고르는 방안이다.
8. **지면 표시 제외**: Decal 렌더러는 Shader Graph를 전제한다. HLSL로 깊이에서 월드 위치를 복원해 박스에 투영하는 방식(★3)으로 살릴지 정해 주세요. 권장은 이번에는 제외다.
9. **inspiredBy 정책**: 확인된 대표작은 9개뿐이고 나머지는 범용 기법으로 비어 있다. 비워 둘지, Jay가 아는 게임(수강생이 아는 국내 모바일 게임 포함)으로 채울지 정해 주세요. 채운다면 화면을 직접 보고 확인한 것만 넣는 것을 권장한다.
10. **ID 확정**: ID는 영구 ID다. 특히 `flow-map-liquid`, `scroll-distort-energy`, `surface-wet-snow`, `ui-backdrop-blur`처럼 이름이 좁거나 넓을 수 있는 것을 확인해 주세요. 샘플 4개의 ID도 같이 확정해 주세요.
11. **Render Graph 정책**: Unity 6.3에서는 커스텀 렌더러 기능을 Render Graph로 써야 한다(△). 전체 화면 표본은 내장 Full Screen Pass + 머티리얼만 쓰고 직접 쓰는 C# 렌더러 기능은 만들지 않는 것을 권장한다.
12. **계획서 정정 알림**: plan 1절의 "수업 프로젝트 5개 모두 6000.3.20f1"은 확인한 3개 중 2D와 3D가 6000.3.15f1이라 맞지 않는다. `docs/plan.md`는 다른 세션 영역이라 수정하지 않았다.

## 부록. 수업 프로젝트와의 연계 한눈에 보기

| 수업 | 연결되는 표본 | 비고 |
|---|---|---|
| 2D 02 Sprite Renderer | `sprite-outline-hit-flash`, `palette-swap-lut` | 스프라이트 머티리얼 입문 |
| 2D 05 Layer And Scroll | `tiling-scroll-parallax` | C# 이동 vs UV 스크롤 비교 |
| 2D 09·10 UGUI, Inventory | `ui-sdf-shape`, `ui-sheen-sweep`, `ui-backdrop-blur` | UI 갤러리와 짝 |
| 2D 13 Scene Management, 99 Async And Tween | `screen-transition-wipe` | 전환 타이밍 코루틴 |
| 2D 14 Action Platformer, 99 Rockman | `sprite-outline-hit-flash`, `dissolve-edge-glow` | 이미 `_HitEffectBlend` 사용 |
| 2D 15 Mini Defence | `screen-shockwave-distortion`, `screen-vignette` | 팀 프로젝트 연출 |
| 3D 01 Rendering, 05 Terrain | `triplanar-projection`, `surface-wet-snow`, `flow-map-liquid` | 지형·머티리얼 |
| 3D 14 Animation (`SimpleUnlitToon`) | `toon-ramp-lit`, `inverted-hull-outline`, `depth-normal-edge-outline` | 이미 2패스 외곽선 |
| 3D 07 External Assets (FORGE3D, Synty) | `hologram-scanline-glitch`, `force-field-intersection`, `scroll-distort-energy`, `screen-refraction-glass`, `triplanar-projection` | 수강생이 원리 없이 쓰는 에셋 |
| 3D 17 FPS Game | `dissolve-edge-glow`, `force-field-intersection`, `xray-occluded-silhouette` | 보스전 연출 |
| XR 01·05 Lake Shader, VR Lake | `water-depth-foam`, `flow-map-liquid`, `fresnel-rim-glow` | 물결·법선·프레넬은 이미 있음 |
| XR 04 Reel And Fish | `wind-sway-foliage` | `FishSwim` 일반화 |
| XR 10·11 MR Portal, MR Room | `xray-occluded-silhouette` | 스텐실·깊이 짝 |
| XR XRI Starter Assets | `fresnel-rim-glow`, `screen-vignette` | 상호작용 하이라이트, 터널링 |
