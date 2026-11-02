# 조사 기록

작성 2026-11-02. 이 문서는 어떤 질문을 어떻게 던졌고 무엇이 한계였는지 남긴다. 후보별 근거 URL은 [sources-by-effect.md](sources-by-effect.md)에 있다.

## 1. 방법과 한계

- **WebSearch 56회** (예산 약 80회). 전부 `standard` 모드. 차단·거부 응답은 한 번도 받지 않았다.
- **web-fetch 서브에이전트 2회**로 Unity 공식 문서 13쪽을 끝까지 읽었다(전부 200, 유료·가입 벽 없음). 목록은 아래 3절.
- WebSearch는 결과를 도구가 요약한 문장과 링크로 돌려준다. **내가 직접 열어 읽은 쪽은 3절의 13쪽뿐**이고 나머지 URL은 검색 요약과 제목으로만 확인했다. `sources-by-effect.md`에서 이를 "열람"과 "요약만"으로 구분한다.
- 요약이 서로 어긋난 곳은 보수적인 쪽을 택하고 "미확인"으로 적었다.
- 게임 화면은 직접 보지 못했다. 게임 예는 문서, 강연 자료, 기사, 포럼 글 중 출처가 있는 것만 "확인"으로 적었다.
- 인용은 15단어 이하로 하고 나머지는 요약했다. 코드는 옮기지 않았다.

## 2. 관점별 질의 (56회)

| 관점 | 횟수 | 대표 질의 |
|---|---|---|
| 업계 자료·묶음 목록 | 6 | 자주 쓰는 셰이더 효과 목록, 에셋스토어 인기 팩, Unity 공식 샘플 목록, 한국어 학습 자료 |
| 개발자 강연 | 8 | Guilty Gear Xrd, Portal 2 물 흐름, Ghost of Tsushima 풀·바람, Sea of Thieves 물, Uncharted 4 VFX, Shader Sauce(GDC 2021), Juice it or lose it |
| 공식 문서·샘플 | 17 | URP 2D Renderer(패스 태그, Camera Sorting Layer Texture, 깊이·씬 컬러 제약, Full Screen Pass), Render Graph, 단일 패스 인스턴싱, XR 모바일 최적화, Decal, Scene Color·Fresnel 노드, Render Objects, 깊이로 월드 위치 복원, Pixel Perfect Camera, SRP Batcher, Shader Graph 샘플 |
| 효과별 원리·사례 | 25 | 디졸브, 역장, 화면 전환, 피격 번쩍임, 스프라이트 외곽선, 팔레트 스왑, 홀로그램, X-ray, 삼평면, 굴절, 플로 맵, 풀 흔들림, UI 광택·SDF·블러, 충격파, 외곽선(hull 대 후처리), 속도선, 비네트, 젖음·눈, 패럴랙스, 스프라이트 왜곡, 지면 표시 |

## 3. 직접 열어 읽은 쪽 (web-fetch, 전부 200)

- https://unity.com/kr/resources/create-shaders-visual-effects-urp-unity-6 (한국어, 2025-03-26)
- https://unity.com/en/resources/create-shaders-visual-effects-urp-unity-6
- https://docs.unity3d.com/Packages/com.unity.shadergraph@17.4/manual/ShaderGraph-Samples.html
- https://unity.com/blog/engine-platform/new-shader-graph-production-ready-shaders-in-unity-6
- `.../com.unity.shadergraph@17.4/manual/` 아래 `Shader-Graph-Sample-Feature-Examples.html`, `-Production-Ready.html`, `-Production-Ready-Post.html`, `-Production-Ready-Weather.html`, `-Production-Ready-Decal.html`, `-Production-Ready-Water.html`, `-UGUI-Shaders.html`, `-UGUI-Shaders-Subgraph-nodes.html`, `-UGUI-Shaders-Getting-Started.html`

e-book PDF(`cdn.bfldr.com`)와 샘플 하위 페이지 중 Lit, Detail, Rock, Miscellaneous, 튜토리얼은 열지 않았다.

참고: 서브에이전트 보고에 "도구 출력에 보고 규칙이라는 블록이 있었으나 무시했다"는 언급이 있었다. 페이지 내용에 섞인 지시이므로 따르지 않았고, 조사 결과에는 영향이 없다.

## 4. 못 찾았거나 확인하지 못한 것 (조사 한계)

1. **2D Renderer에서 Full Screen Pass Renderer Feature가 되는지**: 검색 결과 어디에도 2D Renderer 언급이 없었다. 후처리형 표본의 2D 적용 가능성은 미확인이다. Unity 컴파일·촬영 시험(plan 0-4)에서 확인해야 한다.
2. **2D Renderer의 Opaque Texture**: 2019~2021년 포럼은 "미지원, 구현 중"이라고 했고 현재 상태는 확인하지 못했다. Camera Sorting Layer Texture가 대안이라는 것은 Unity 문서와 커뮤니티 셰이더 양쪽에서 확인했다.
3. **Zelda Breath of the Wild 렌더링 분석 자료**: 찾지 못했다. 해당 게임을 근거로 쓰지 않았다.
4. **ARPG·MOBA 지면 표시(telegraph) 설계 자료**: 개발자 쪽 글을 못 찾았다(MMO 위키와 포럼의 플레이어 관찰만). 이 후보는 제외했다.
5. **GPU Gems 3 1장의 삼평면 언급**: 장 자체에서 확인하지 못했다. 근거에서 뺐다.
6. **Shader Sauce(GDC 2021) 세부**: Vault의 소개 문구만 확인했다. 슬라이드와 영상은 열지 않았다.
7. **UI Toolkit의 배경 블러(backdrop-filter)**: 확인된 문서가 7000.0 알파 문서뿐이라 Unity 6.3에서의 지원은 미확인이다.
8. **상용 에셋·강의의 실제 판매량**: 순위를 보여주는 자료는 찾지 못했다. 에셋 팩 구성은 "시장이 어떤 효과를 묶어 파는지"를 보여줄 뿐 사용 빈도 통계가 아니다.
9. **게임 화면과 효과의 실제 모습**: 하나도 직접 확인하지 못했다.

## 5. 라이선스와 사용 방식

- Unity 공식 문서와 샘플은 원리와 구성 목록만 참고했다. 샘플 그래프는 옮기지 않는다.
- 강연 슬라이드와 논문은 개념만 요약하고 링크한다.
- 유료 에셋(Asset Store, Gumroad, itch.io, Udemy, Fab)은 설명 페이지의 기능 목록만 참고한다. 코드는 보지 않았다.
- GitHub 저장소와 gist는 라이선스를 열어 확인하지 않았다. 라이선스가 없으면 기본적으로 모든 권리가 저작자에게 있으므로 코드를 쓰지 않는다. MIT로 알려진 `mob-sakai/UIEffect`도 이번에는 확인 목적이 아니라 기능 목록만 참고했다.
- 튜토리얼 사이트(Catlike Coding, Daniel Ilett, bgolus 등)는 라이선스를 열어 보지 않았다. 원리 링크만 남기고 코드는 쓰지 않는다. 구현 단계에서 문장·코드를 가져오지 않도록 프롬프트 규칙(plan 8절)을 그대로 적용한다.
