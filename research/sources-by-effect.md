# 후보별 근거 URL

작성 2026-11-02. 열람 칸의 **○**는 내가 직접 열어 끝까지 읽은 쪽(서브에이전트 포함), **△**는 검색 요약과 제목으로만 확인한 쪽이다. 메모 칸의 "유료"는 판매 페이지라서 기능 목록만 참고했다는 뜻이다. 코드는 어느 것에서도 옮기지 않았다. 라이선스를 열어 확인한 곳은 없다(`search-log.md` 5절).

근거 강도: **강**은 서로 다른 종류(공식 문서·강연·사례·시장)의 출처가 3개 이상이고 원리가 일치하는 경우, **중**은 2개 정도이거나 한 종류에 몰린 경우, **약**은 1개이거나 커뮤니티 글뿐인 경우다.

## 0. 공통 근거 (플랫폼·URP 요구 사항)

| 주제 | URL | 열람 | 메모 |
|---|---|---|---|
| Unity가 "자주 쓰는 셰이더"로 묶은 목록 (Unity 6 e-book) | https://unity.com/kr/resources/create-shaders-visual-effects-urp-unity-6 · https://unity.com/en/resources/create-shaders-visual-effects-urp-unity-6 | ○ | 주제: 프로시저럴 노이즈·컴퓨트 VFX, 개선된 툰, Render Graph로 만드는 렌더러 기능, 스텐실 X-ray, 툰·외곽선, 데칼·AO 후처리, LUT 색보정, 반사·굴절, 물·볼류메트릭 구름. 선정 이유는 제목의 "자주 사용되는" 외에 설명이 없다. PDF는 열지 않음 |
| Shader Graph 샘플 8종 구성 | https://docs.unity3d.com/Packages/com.unity.shadergraph@17.4/manual/ShaderGraph-Samples.html | ○ | Procedural Patterns, Node Reference, Feature Examples, Production Ready, UGUI Shaders, Custom Material Property Drawers, Custom Lighting, Terrain |
| Feature Examples 목록 | https://docs.unity3d.com/Packages/com.unity.shadergraph@17.4/manual/Shader-Graph-Sample-Feature-Examples.html | ○ | 삼평면·이평면, 플로 맵, 패럴랙스, 매트캡, 고도·각도 마스크, 깃발·풀 휨·빌보드·Gerstner 정점 애니메이션 등 |
| Production Ready 목록 | https://unity.com/blog/engine-platform/new-shader-graph-production-ready-shaders-in-unity-6 · `.../Shader-Graph-Sample-Production-Ready-Post.html` · `-Weather.html` · `-Decal.html` · `-Water.html` | ○ | 후처리(Edge Detection, Half Tone, Rain On Lens, Underwater, VHS), 날씨(비·웅덩이·젖음·눈), 데칼(재질 투영, 물 코스틱, 흐르는 물, 젖음), 물 4종, 바위·지형 디테일 |
| UGUI Shaders 샘플 | `.../Shader-Graph-Sample-UGUI-Shaders-Subgraph-nodes.html` · `-UGUI-Shaders.html` · `-UGUI-Shaders-Getting-Started.html` | ○ | SDF 도형 6종, RoundedCorners, Anti Aliasing, Animated Sheen, Scene Color Blurred, Halftone·Pixelation 배경 예 등. 세 쪽 어디에도 Canvas 렌더 모드·파이프라인 요구 사항 서술이 없었다 |
| Full Screen Pass Renderer Feature | https://docs.unity3d.com/6/Documentation/Manual/urp/renderer-features/renderer-feature-full-screen-pass.html · https://docs.unity.com/en-us/engine/6000.3/manual/post-processing-and-full-screen-effects/urp/custom-post-processing/renderer-feature-full-screen-pass | △ | 주입 시점, Requirements(Depth, Normal, Color, Motion), `_BlitTexture`. **2D Renderer 지원 언급은 못 찾음** |
| Render Graph (6.3) | https://discussions.unity.com/t/render-graph-updates-in-unity-6-3/1668122 · https://docs.unity3d.com/Manual/UpgradeGuideUnity62.html | △ | 호환 모드는 컴파일 define 뒤로 숨겨진다는 포럼 글, 커스텀 렌더러 기능은 Render Graph로 다시 쓰라는 업그레이드 안내. 출시 전(베타) 문서가 섞여 있어 최종 릴리스 노트로 재확인 필요 |
| URP 패스 태그 | https://docs.unity3d.com/Manual/urp/urp-shaders/urp-shaderlab-pass-tags.html | △ | `Universal2D` = 2D 라이트 계산 포함 패스, 태그 없으면 `SRPDefaultUnlit`. 스프라이트 셰이더의 구체적 요구 사항은 문서에 없음 |
| 2D Renderer Data (Camera Sorting Layer Texture) | https://docs.unity.com/en-us/engine/6000.0/manual/unity2d/2d-urp/2drenderer-data-overview | △ | 특정 정렬 레이어까지 그린 카메라 색 버퍼를 사용자 셰이더용으로 캡처. 다운샘플링 선택. 깊이/스텐실 버퍼는 마스킹 등에 필요 |
| 2D Renderer와 Opaque Texture | https://discussions.unity.com/t/urp-2d-renderer-and-_cameraopaquetexture/836969 · https://discussions.unity.com/t/is-it-possible-to-have-transparents-using-the-2d-renderer-in-urp/772498 | △ | 2019~2021년 글. 미지원 → 구현 중이라는 답변까지만 확인. 현재 상태 미확인 |
| 단일 패스 인스턴싱 | https://docs.unity3d.com/6/Documentation/Manual/SinglePassInstancing.html · https://docs.unity.com/en-us/engine/6000.3/manual/xr/graphics/stereo-rendering/single-pass-instancing | △ | URP·Shader Graph는 이미 지원. 직접 쓴 셰이더는 입력/출력 구조체와 정점·프래그먼트 함수에 스테레오 매크로를 넣어야 하고, 후처리 소스 텍스처는 배열로 샘플해야 함 |
| 모바일 XR 최적화 | https://docs.unity.com/en-us/engine/6000.6/manual/xr/graphics/untethered-device-optimization (6000.5·6000.7·7000.0 동일 경로) | △ | Opaque·Depth Texture는 타일 GPU에서 비싸니 끄라고 권장, 후처리는 온타일 권장, MSAA는 온타일과 충돌. 6.3 판 쪽수는 열지 않음 |
| 깊이 텍스처 필요 (소프트 파티클 등) | https://docs.unity3d.com/Packages/com.unity.render-pipelines.universal%4014.0/manual/upgrade-guide-7-2-0.html | △ | 후처리가 더는 깊이를 강제하지 않으니 직접 켜야 한다는 안내. 깊이 꺼짐 + 소프트 파티클로 입자가 사라진 이슈 트래커 글도 있음 |
| 깊이로 월드 위치 복원 | https://docs.unity3d.com/Manual/urp/writing-shaders-urp-reconstruct-world-position.html | △ | URP 에셋 Depth Texture 필요, `SampleSceneDepth`, `UNITY_REVERSED_Z`, `ComputeWorldSpacePosition` |
| SRP Batcher와 MaterialPropertyBlock | https://docs.unity3d.com/cn/2021.3/Manual/SRPBatcher.html · https://esotericsoftware.com/forum/d/28167-unity-6-and-custom-material-bug/19 | △ | MPB를 쓰면 해당 렌더러는 SRP Batcher에서 빠진다. Unity 6 + 2D에서 빈 MPB가 Sprite 머티리얼 렌더를 깨뜨렸다는 Spine 포럼 보고(원인·현재 상태 미확인) |
| Pixel Perfect Camera (URP 2D) | https://docs.unity.com/en-us/engine/6000.3/manual/unity2d/2d-urp/2d-pixelperfect/ref | △ | 2D 템플릿에 내장, 별도 패키지는 설치하지 않는다 |
| Scene Color 노드 | https://docs.unity3d.com/Packages/com.unity.shadergraph%4017.0/manual/Scene-Color-Node.html | △ | URP에서는 Opaque Texture, 머티리얼이 Transparent여야 정상, 지원하지 않는 파이프라인에서는 검은색 |
| Fresnel Effect 노드 | https://docs.unity3d.com/Packages/com.unity.shadergraph@17.0/manual/Fresnel-Effect-Node.html | △ | 림 라이팅에 흔히 쓴다고 서술, 법선·뷰 방향·지수 |

## 1. 재질

### toon-ramp-lit — 강
| 출처 | 종류 | 열람 | 메모 |
|---|---|---|---|
| https://gdcvault.com/play/1022031/GuiltyGearXrd-s-Art-Style-The · https://www.ggxrd.com/Motomura_Junya_GuiltyGearXrd.pdf · https://www.arcsystemworks.com/guilty-gear-xrd-art-talk-at-game-developers-conference-2015/ | GDC 2015 강연과 핸드아웃 | △ | 음영이 켜짐/꺼짐 둘뿐이라 법선이 조금만 달라도 큰 얼룩이 생긴다는 설명. 외곽선 방식의 구체 내용은 확인 못 함 |
| e-book와 Feature Examples(Custom Lighting에 cel shading) (0절) | 공식 | ○ | 개선된 툰 셰이더 레시피 |
| https://bjayers.artstation.com/blog/category/5 | 서드파티 분석(Blender 재현) | △ | 원신 셰이더의 그림자 경계 양쪽 보정, 림처럼 보이는 균일한 띠, 외곽선은 보통 뒤집은 껍데기. 실시간 구현이 아니라 합성으로 재현했다고 서술 |
| https://godotshaders.com/shader/toon-shader-inspired-of-genshin-impact/ | 커뮤니티 구현(Godot) | △ | 램프 텍스처를 빛 세기로 샘플 + 뷰 각도 림 |
| https://assetstore.unity.com/packages/slug/131621 | 상용 툰 팩 | △ | 유료. 램프·외곽선·디졸브 묶음 |

### fresnel-rim-glow — 강
Fresnel 노드 문서(0절, △), XRI Starter Assets의 `Interactable`, `Unlit_Fresnel`, `BiRP_Fresnel`(로컬 5000-Unity-XR, `course-survey.md` 4절), 홀로그램 계열 전부가 프레넬 사용(14번 항목). 게임 사례는 확인하지 못했다.

### triplanar-projection — 강~중
| 출처 | 종류 | 열람 | 메모 |
|---|---|---|---|
| Feature Examples의 Triplanar·Biplanar, Production Ready Decal의 재질 투영(0절) | 공식 | ○ | |
| https://bgolus.medium.com/normal-mapping-for-a-triplanar-shader-10bf39dca05a · https://diglib7.eg.org/bitstream/handle/10.2312/egs20201016/053-056.pdf | 개인 글, Eurographics 2020 논문 | △ | 법선맵이 어려운 부분이라는 점, reoriented 블렌딩 제안 |
| 로컬 3000-Unity-3D: `POLYGON_Triplanar.shadergraph`(Synty) | 수업 에셋 | ○(파일명) | 수업에 이미 포함 |
| https://developer.nvidia.com/gpugems/gpugems3/part-i-geometry/chapter-1-generating-complex-procedural-terrains-using-gpu | 책(무료 공개) | △ | **삼평면 서술은 확인 못 함 → 근거에서 제외** |

### screen-refraction-glass — 중~강
Scene Color 노드 문서(0절), e-book "Reflections and refractions"(0절, ○), Production Ready 물과 Rain On Lens(0절, ○), 로컬 FORGE3D `HeatDepthFixed.shadergraph`. 2D Renderer 제약은 0절 참조.

## 2. 상태 피드백

### dissolve-edge-glow — 강
| 출처 | 종류 | 열람 | 메모 |
|---|---|---|---|
| https://gamedeveloper.com/design/unity-shader-graph-quick-tutorial---dissolve-shader | 튜토리얼 | △ | 노이즈를 임계값과 비교, 경계 띠 발광 |
| https://bugnet.io/blog/how-to-implement-a-dissolve-effect · https://gamedev.net/shaderlab/14-sprite-dissolve-effect/ · https://github.com/jamesplease/dissolve-urp | 튜토리얼, 예제, URP 저장소 | △ | 같은 원리. smoothstep로 경계를 부드럽게, 월드 y 방향성 확장 |
| https://aidanbrennan55.itch.io/neontrigger/devlog/985243/neon-trigger-devlog-8-how-to-create-a-dissolve-effect-in-unity | 개발일지 | △ | 코루틴으로 0→1 |
| https://assetstore-fallback.unity.com/packages/tools/2d-dissolve-effect-pack-for-the-universal-render-pipeline-201782 | 상용 팩 | △ | 용도: 적 스폰·소멸, 텔레포트, 사망 |
| https://forum.godotengine.org/t/2d-fx-essentials-nine-free-sprite-shaders-for-godot-4-outline-dissolve-hit-flash-shine/145788 | 타 엔진 팩 | △ | 외곽선·디졸브·히트 플래시·샤인이 한 세트로 묶임 = 엔진을 가리지 않는 표준 구성 |

### inverted-hull-outline — 중
| 출처 | 종류 | 열람 | 메모 |
|---|---|---|---|
| https://realtimevfx.com/t/unity-outline-by-normals-for-mobile-game-urp/14919 | 커뮤니티 | △ | 모바일 URP 외곽선, 비용 지적 |
| https://danielilett.itch.io/psx-shaders-pro-for-unity-urp/devlog/998452/version-14-brings-hull-outlines-and-texel-aligned-shading | 상용 팩 개발일지 | △ | 유료. 껍데기 외곽선을 기능으로 판매 |
| e-book "Toon and outline shader with Shader Graph"(0절) | 공식 | ○ | |
| 로컬 3000-Unity-3D `SimpleUnlitToon.shader` | 수업 | ○ | `Outline` 패스(`SRPDefaultUnlit`, `Cull Front`)와 `UnlitBase` 패스. 수업에 이미 있음 |

### xray-occluded-silhouette — 강
| 출처 | 종류 | 열람 | 메모 |
|---|---|---|---|
| https://docs.unity3d.com/6000.2/Documentation/Manual/urp/renderer-features/how-to-custom-effect-render-objects.html | 공식 예제 | △ | Render Objects 기능에 Depth Test = Greater로 가려진 부분만 그리고, 자기 겹침 오탐은 두 번째 기능(깊이 쓰기 끔)으로 해결 |
| e-book "X-ray-like image effect with stencils"(0절) | 공식 | ○ | |
| https://eu.forums.blizzard.com/en/overwatch/t/overwatch-ptr-patch-notes-august-30-2018/8320 | 패치 노트(포럼) | △ | "아군을 벽 너머로 보이게 하는 외곽선" 추가 |
| https://mp1st.com/news/call-of-duty-modern-warfare-will-have-teammates-feature-outlines-so-you-can-see-them-through-walls | 기사 | △ | 가려진 아군에게만 외곽선 |

## 3. 자연

### water-depth-foam — 강
| 출처 | 종류 | 열람 | 메모 |
|---|---|---|---|
| https://history.siggraph.org/wp-content/uploads/2022/09/2018-Talks-Ang_The-Technical-Art-of-Sea-of-Thieves.pdf | SIGGRAPH 2018 | △ | 바다는 FFT 시뮬레이션, 물체와 교차하는 곳의 거품은 깊이 버퍼 비교. Gerstner 아님 |
| Production Ready Water(0절) | 공식 | ○ | 호수·연못(교차 거품, Gerstner 3개)·시내·폭포, 모두 굴절·깊이 안개 |
| https://assetstore-fallback.unity.com/packages/vfx/shaders/toon-water-urp-170520 | 상용 | △ | 깊이 기반 색 그라데이션, 툰 거품 |
| https://marketplace.unity.com/packages/vfx/shaders/stylized-water-urp-shader-277311 | 상용 | △ | 리스팅에 Unity 6 Render Graph와 비호환이라 명시 |
| 로컬 5000-Unity-XR `LakeWater_Step1~7`, `Caustics` | 수업 | ○(머리말) | 물결·법선·프레넬·반사·빛 무늬는 이미 있음. 깊이 기반 거품이 없음 |

### wind-sway-foliage — 강
| 출처 | 종류 | 열람 | 메모 |
|---|---|---|---|
| https://gdcvault.com/play/1027214/Advanced-Graphics-Summit-Procedural-Grass | GDC 2021 | △ | 풀 한 포기를 GPU에서 생성하고 움직임 부여(소개 문구 수준) |
| https://gamedeveloper.com/design/using-vorticles-to-simulate-wind-in-i-ghost-of-tsushima-i- | GDC 2022 요약 | △ | 바람은 일정한 방향에 시간에 따라 변하는 노이즈로 크기를 바꿈 |
| https://unity.com/blog/engine-platform/creating-animated-materials-with-shader-graph | Unity 블로그(2018, LWRP 시절) | △ | 정점 색 마스크, 월드 노이즈를 오브젝트 공간으로 변환 |
| Feature Examples의 Bend Deformer - Grass, Animated Flag, Billboard(0절) | 공식 | ○ | |
| 로컬 5000-Unity-XR `FishSwim.shader` | 수업 | ○(머리말) | 같은 원리의 정점 사인 |

### flow-map-liquid — 강
| 출처 | 종류 | 열람 | 메모 |
|---|---|---|---|
| https://www.advances.realtimerendering.com/s2010/Vlachos-Waterflow(SIGGRAPH%202010%20Advanced%20RealTime%20Rendering%20Course).pdf | SIGGRAPH 2010 (Valve) | △ | 픽셀 셰이더 흐름. 플로 맵(2D 흐름 벡터)으로 법선 맵을 왜곡. Portal 2 색 맵 흐름은 오프셋 방식 |
| https://www.hlportal.de/files/GDC2011_BronwenGrimes_NonstandardTextures.pdf | GDC 2011 (Valve) | △ | Portal 2 물이 Left 4 Dead 2 셰이더의 확장이라는 설명 |
| Feature Examples의 Flow Mapping(0절) | 공식 | ○ | |
| https://louisgamedev.medium.com/shader-tutorial-flow-map-4410af832a8d · https://catlikecoding.com/unity/tutorials/flow/directional-flow/ | 튜토리얼 | △ | 위상 2벌을 반 주기 어긋나게 섞기. Catlike는 패턴을 흐름에 정렬하는 다른 방식(Unity 2017) |

### surface-wet-snow — 중
Production Ready Weather(0절, ○)가 중심이다. 젖음은 색을 어둡고 채도 높게 하고 스무드니스를 올린다, 눈은 물체 윗면에 얹는다, 비 전체 조합은 가장 비싸니 필요한 것만 쓰라고 설명한다. 그 외는 https://forums.unrealengine.com/t/rain-wet-shader/16716(월드 업 기반 마스크, △), https://gist.github.com/eviltak/e04b83ffdb91aa3d477bbfe0ca370da7(웅덩이 마스크와 비 법선, Lagarde 글 기반이라는 요약, △). 게임 사례는 확인하지 못했다.

## 4. VFX

### force-field-intersection — 강
| 출처 | 종류 | 열람 | 메모 |
|---|---|---|---|
| https://discussions.unity.com/t/why-do-depth-intersection-shaders-work/827541 · https://discussions.unity.com/t/highlight-intersection-shader/755202 | Unity 포럼 | △ | 불투명 깊이와 투명 물체 깊이 차이로 교차 판정. 원근 카메라에서만 `w`가 뷰 깊이 |
| https://github.com/alansley/UnityShaderGraphDemos | 저장소 | △ | glowing-intersection 예. Depth·Opaque Texture 켜야 한다고 명시 |
| https://itch.io/devlog/243420/how-to-make-a-power-shield.amp | 개발일지 | △ | 실드 만들기 |
| https://www.fab.com/listings/531ab9d7-bc90-4173-bfc3-f01623a16054 | 상용 | △ | 포스필드, 디졸브, 용암을 묶어 판매 |
| https://forum.babylonjs.com/t/force-field-node-material-using-unity-tutorial-help-needed-to-translate-it-to-babylon/39160 | 타 엔진 이식 | △ | 같은 원리가 엔진 불문 통용됨 |
| 로컬 3000-Unity-3D FORGE3D Sci-Fi Effects 셰이더 그래프 | 수업 에셋 | ○(파일명) | |

### screen-shockwave-distortion — 중
https://github.com/Delt06/opaque-texture-shaders(화면 공간 충격파, Opaque Texture 의존, Unity 2021.3·URP 12.1.6, △), https://discussions.unity.com/t/full-screen-shaders-in-urp/869111(Fullscreen Shader Graph + Sample Buffer + Full Screen Pass, △), 2D 리플 셰이더가 Camera Sorting Layer Texture를 쓴다는 Reddit 글(URP 12 이상, △), https://itch.io/devlog/415522/shader-showcase-wave-2-now-available.amp(열 왜곡 설명, △), Production Ready Underwater의 왜곡과 e-book 굴절(0절), 로컬 `HeatDepthFixed.shadergraph`.

### hologram-scanline-glitch — 중~강
https://danielilett.itch.io/hologram-shaders-pro-unity(프레넬, 정점 글리치 두 종류, 스캔라인 변형, 유료, △), https://godotshaders.com/shader/hologram-effect/(스캔라인·노이즈·계단 변위·깜빡임·프레넬, △), https://marketplace.unity.com/packages/vfx/shaders/hologram-lwrp-urp-161392(상용, △), 로컬 FORGE3D `Holographic.shadergraph`. 월드 y를 양자화한 해시로 정점을 밀어 시간 단계마다 튀는 글리치를 만든다는 gist 요약이 있었다(저자·라이선스 미확인, 코드 미사용).

### scroll-distort-energy — 중
https://gdcvault.com/play/1027131/Visual-Effects-Summit-Shader-Sauce(GDC 2021: 손그림 애니메이션이나 시뮬레이션 없이 기본 셰이더 개념을 겹쳐 스타일 VFX를 만든다는 소개, 슬라이드 미열람, △). Feature Examples의 Flipbook(○), e-book의 프로시저럴 노이즈 VFX(○), 로컬 FORGE3D `Additive`, `AlphaBlended` 그래프. 이 항목은 단일 강연이 효과 자체를 증명하지 않아 근거를 "중"으로 두었다.

## 5. 2D

### sprite-outline-hit-flash — 강
| 출처 | 종류 | 열람 | 메모 |
|---|---|---|---|
| https://discussions.unity.com/t/2d-outline-with-texture-sprite-in-multiple-invading-neighbor-frame/948815 · https://realtimevfx.com/t/unity-spriteatlas-and-outline-shader-amplify/18233 · https://discussions.unity.com/t/how-to-make-better-sprite-outline-shader/784734 | 포럼 | △ | 이웃 알파를 샘플하는 외곽선이 스프라이트 아틀라스의 옆 스프라이트를 끌어오는 문제. 1~2px 패딩이 해법으로 제시됨. 타이트 메시에서 외곽선이 잘림 |
| https://gamedev.net/shaderlab/36-hit-flash-and-damage-tint/ · https://uhiyama-lab.com/en/notes/unity/unity-game-feel-hit-feedback/ | 예제, 게임 필 글 | △ | `_FlashAmount`로 흰색 보간, sharedMaterial을 바꾸면 모두 번쩍이니 인스턴스나 MPB. 몇 프레임이면 충분, "맞았다"는 신호 |
| https://www.gamedeveloper.com/design/video-is-your-game-juicy-enough- | 2013 기사(Juice it or lose it 소개) | △ | 색, 트위닝, 화면 번쩍임이 요점이라는 요약 |
| 로컬 1000-Unity-Basic-2D `Enemy.cs`의 `_HitEffectBlend`, `AllIn1SpriteShader` | 수업 | ○ | 수업이 같은 효과를 상용 에셋으로 이미 사용 |
| 포럼 Spine 글(0절 SRP Batcher 행) | 포럼 | △ | 2D에서 MPB 주의 |

### palette-swap-lut — 강~중
https://code.tutsplus.com/how-to-use-a-shader-to-dynamically-swap-a-sprites-colors--cms-25129t(스왑 텍스처 방식, △), https://discussions.unity.com/t/palette-swapping-shader-for-single-channels/676602(1×256 팔레트, 반 텍셀 오프셋, △), https://github.com/redbluegames/unity-pixel-palettemap(△), https://diesoft.games/2022/06/13/nemo-art-pipeline.html(Little Nemo 제작기: 조명 분위기용 팔레트 스왑을 지원하는 커스텀 스프라이트 셰이더, △), 상용 PaletteFX 등.

### tiling-scroll-parallax — 약~중
https://discussions.unity.com/t/is-it-still-possible-to-scroll-sprite-textures-with-material-maintextureoffset/652556(SpriteRenderer에서는 텍스처 오프셋이 안 먹어 커스텀 스프라이트 셰이더가 필요, △), https://dev.to/nafisnil/create-parallax-effect-of-a-2d-game-background-unity3d-2ked(트랜스폼 이동 방식, △). 공식 문서·강연 근거는 없다. 수업 연계(05 Layer And Scroll)가 강하다.

## 6. UI

### ui-sdf-shape — 강~중
UGUI Shaders 샘플의 SDF 도형, RoundedCorners, Anti Aliasing, ProgressBars 예(0절, ○), https://github.com/TLabAltoh/Unity-SDF-UI-Toolkit/wiki(△), https://github.com/smitdylan2001/Unity-UI-Rounded-Corners(△). 작은 상자에서 가장자리 안티앨리어싱 아티팩트가 난다는 포럼 보고가 있어 구현 때 확인이 필요하다. 같은 SDF 원리를 UI 갤러리 `tutorial-spotlight`의 컷아웃이 쓴다.

### ui-sheen-sweep — 강~중
UGUI Shaders 샘플의 Animated Sheen(0절, ○), https://github.com/mob-sakai/UIEffect(Shiny, Dissolve, Blur, Transition 등 기능 묶음, 라이선스 MIT로 확인했다는 요약이나 직접 열람 안 함, △), Godot FX Essentials에 shine 포함(위 2절).

### ui-backdrop-blur — 중
UGUI Shaders 샘플의 Scene Color Blurred(0절, ○), https://discussions.unity.com/t/ugui-blurred-ui-image-for-all-render-pipelines-and-canvas-types-overlay-camera-world/928393(Overlay 캔버스는 카메라 이후에 그려져 캡처되지 않으므로 Camera/World 캔버스가 필요하다는 서술, △), https://discussions.unity.com/t/fullscreen-blur-with-urp/789332(△), UI Toolkit 배경 필터는 7000.0 알파 문서에서만 확인(6.3 지원 미확인).

## 7. 후처리

### screen-transition-wipe — 강(원리) / Unity 전용 근거는 약
https://www.glassner.com/wp-content/uploads/2014/04/CG-CGA-PDF-01-05-A-Change-of-Scene-May01.pdf(흑백 마스크로 와이프, 마스크 크기를 시간에 따라 바꾸면 아이리스, △), https://godotshaders.com/shader/universal-transition-shader/ · https://c.eev.ee/particle-wipe-generator/ · https://pub.dev/packages/shader_transitions(마스크 값과 진행값 비교, 가장자리 램프, 첫 전환 때 셰이더 컴파일이 느리니 시작 시 미리 로드, △), https://assetstore-fallback.unity.com/packages/tools/gui/easy-transitions-225607(유료, △). 수업 연계는 로컬 2D 13 Scene Management, 99 Async And Tween.

### depth-normal-edge-outline — 강~중
Production Ready Post-Process의 Edge Detection(깊이 또는 법선 가장자리를 씬 위에 블렌드, 0절, ○), e-book의 툰·외곽선과 AO 후처리(0절, ○), https://realtimevfx.com/t/unity-outline-by-normals-for-mobile-game-urp/14919(△). 후처리 외곽선은 오브젝트 수와 무관한 비용이지만 개별 오브젝트 분리가 어렵다는 요약이 있었다.

### screen-vignette — 강(공식·XR) / 게임 디자인 근거는 일화 수준
https://docs.unity3d.com/Packages/com.unity.xr.interaction.toolkit%403.0/manual/tunneling-vignette-controller.html(aperture 0~1, 여러 제공자가 켜면 가장 작은 값, ease in·out, △), https://developers.meta.com/horizon/documentation/unity/unity-isdk-locomotion-comfort/(비네트를 도 단위로 정의해 기기 시야각 차이를 없앰, 회전·이동 속도에 반응, △), 로컬 5000-Unity-XR `TunnelingVignette.shader`·`TunnelingVignetteSG.shadergraph`, https://community.focus-entmt.com/focus-entertainment/space-marine-2/ideas/8114-can-we-get-an-option-to-remove-the-vignette(저체력 비네트가 분산·두통을 일으킨다는 이용자 글 → 끄기 옵션 요구, △), https://thunderstore.io/c/valheim/p/Wire/WiresDamageVignette/(피격 순간 번쩍임과 저체력 상태를 분리, 체력이 낮을수록 강해지는 가장자리, △).

## 8. 제외한 후보의 근거

| 후보 | 근거 | 열람 |
|---|---|---|
| 지면 표시(데칼형 범위 표시) | Decal 렌더러 기능이 Shader Graph(Decal 머티리얼 타입)를 전제한다. https://docs.unity3d.com/Manual/urp/decal-shader.html · https://docs.unity.com/en-us/engine/6000.3/manual/visual-effects/decals/renderer-feature-decal/projector-reference.md. URP에는 투명 표면에 영향 주는 옵션이 없다는 포럼 글도 있다. 설계 근거는 FFXIV 위키 등 플레이어 관찰뿐(https://ffxiv.consolegameswiki.com/wiki/Common_mechanics_and_markers) | △ |
| 속도선 | https://github.com/mirzabeig/anime-speed-lines(Unity 2020.3 검증), 상용 팩. 6.3·URP 17 호환 미확인 | △ |
| 레트로 CRT·VHS·하프톤 | Production Ready Post에 VHS·Half Tone 있음(○). 레트로 룩 한정 | ○ |
| 스프라이트 정점 왜곡 | 유료 에셋과 2D 왜곡 팩(렌더 회색 보고). https://void1gaming.itch.io/free-2d-distortion-shader-for-unity-urp | △ |
| 그 외 제외 후보 | 사유는 `docs/shader-selection.md` 5절. 거기에 쓴 근거는 위 0절과 각 효과 절을 따른다 | |
