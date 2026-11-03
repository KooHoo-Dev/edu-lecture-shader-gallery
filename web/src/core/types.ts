/* ──────────────────────────────────────────────────────────────
 * 표본 규격 v1 (자세한 규칙은 docs/specimen-guide.md)
 * 표본 1개 = 다음 두 폴더. React 코드는 없다.
 *   Assets/Shaders/<id>/          core.hlsl + <Name>.shader (+ 선택: C# 스크립트)
 *   web/src/specimens/<id>/       meta.ts
 * Unity 와 웹이 같은 core.hlsl 을 쓴다. 웹용 래퍼는 무대 종류에 맞춰 앱이 만든다.
 * ────────────────────────────────────────────────────────────── */

export type GroupId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'

/** 미리보기 무대 4종 */
export type StageKind = 'mesh' | 'sprite' | 'depth' | 'fullscreen'
/**
 * grass 는 앱이 만드는 풀 다발 (web/src/stage/grass.ts, SgGrass.cs), grid 는 앱이 만드는 촘촘한 평면
 * (Unity Plane 과 같은 10 × 10 크기와 UV 에 100 × 100 칸, SgGrid.cs), torus 는 앱이 만드는 고리 (SgTorus.cs, 볼록하지 않은 메시
 * 시험용. 돌면 고리의 앞뒤가 겹친다). 나머지는 Unity 기본 메시
 */
export type MeshShape = 'sphere' | 'capsule' | 'cube' | 'cylinder' | 'quad' | 'plane' | 'grass' | 'grid' | 'torus'
/** URP 에셋에서 켜야 하는 것. 프롬프트의 설정 단계에 자동으로 들어간다 */
export type Requirement = 'depth' | 'opaque' | 'normals'
/** cutout: 알파 0.5 미만을 잘라 낸다 · alpha: 알파 혼합 · additive: 더하기 혼합 */
export type StageBlend = 'cutout' | 'alpha' | 'additive'

export type ParamValue = number | string | boolean
export type ParamValues = Record<string, ParamValue>

interface ParamBase {
  /** .shader Properties 와 같은 이름 (예: _Threshold). 웹 유니폼 이름이기도 하다 */
  key: string
  label: string
  /** 이 값이 화면에서 무엇을 바꾸는지 */
  hint?: string
  /** 같은 표본의 select 값(key)이 values 중 하나일 때만 조절 패널에 보인다. 셰이더가 다른 선택에서는 이 값을 쓰지 않을 때 */
  showWhen?: { key: string; values: string[] }
}
export type ParamDef =
  | (ParamBase & { type: 'range'; min: number; max: number; step: number; default: number; unit?: string })
  /** [Enum] 속성. value 는 Unity 에 들어가는 숫자의 문자열 */
  | (ParamBase & { type: 'select'; options: { value: string; label: string }[]; default: string })
  /** [ToggleUI] 속성. 셰이더에서는 0 또는 1 인 float */
  | (ParamBase & { type: 'toggle'; default: boolean })
  /** Color 속성. sRGB 16진수로 적고, 셰이더에는 Unity 와 같이 선형으로 변환해 넘긴다 */
  | (ParamBase & { type: 'color'; default: string })

export interface Preset {
  id: string
  /** 쓰임새 이름 (게임명 금지) */
  name: string
  look?: string
  values: ParamValues
}

export type Ease = 'linear' | 'inOutSine' | 'outQuad' | 'inQuad'

/**
 * 값 하나를 시간에 따라 움직이는 트랙. frames 는 [초, 값] 목록이고 사이는 ease 로 보간한다.
 * 이벤트에서는 마지막 시각 뒤 조절 값으로 돌아가고, 자동 데모에서는 처음부터 반복한다.
 */
export interface Track {
  key: string
  frames: [number, number][]
  ease?: Ease
}

/** 이벤트 버튼 또는 단축키로 한 번 재생 */
export interface StageEvent {
  id: string
  label: string
  tracks: Track[]
}

/** 사람이 없어도 핵심 상황이 도는 자동 데모 */
export interface Demo {
  loops?: Track[]
  /** 일정 간격(초)으로 발생시키는 이벤트 */
  fire?: { event: string; every: number }[]
}

/** 단계 보기. n 은 core.hlsl 의 SG_STEP(n, ...) 번호와 같다 */
export interface Step {
  n: number
  label: string
  body: string
}

export interface Mistake {
  title: string
  body: string
}

export interface InspiredBy {
  title: string
  credit: string
  /** 빌린 시각 축. 최대 2개 */
  borrowed: string[]
  learned: string
  link?: string
}

export interface Reference {
  label: string
  url: string
}

export interface UnityGuide {
  /** Unity 에 넣는 순서 */
  setup: string[]
  /** 잘 되었는지 확인하는 방법 한 줄 */
  verify: string
  pitfalls: string[]
  /** Shader Graph 에서 Custom Function 으로 쓰는 법. 선택 */
  graph?: string
}

export interface PromptGuide {
  /** 이 효과로 무엇을 하려는지 한 문장. 프롬프트 첫머리에 들어간다 */
  goal: string
  /** '내 프로젝트에 맞게 변형' 프롬프트에 넣는 예시 */
  adaptIdeas: string[]
}

export interface StageTexture {
  /** Assets/Shaders/<id>/ 안의 PNG 파일 이름 */
  file: string
  /** 색이 아닌 데이터 텍스처 (플로 맵 등). Unity 의 sRGB 끔과 같다 */
  linear?: boolean
  repeat?: boolean
  /** 포인트 필터 (팔레트 등) */
  point?: boolean
}

export interface SpecimenStage {
  kind: StageKind
  /** mesh 무대의 물체. 기본 sphere */
  mesh?: MeshShape
  /** 기본값: mesh=cutout, sprite=alpha, depth=alpha, fullscreen 은 해당 없음 */
  blend?: StageBlend
  /** core.hlsl 에 sgVertex 가 있으면 true (mesh, depth, sprite 무대. sprite 는 UI 가 아닐 때만) */
  vertex?: boolean
  /** 래퍼가 Cull Off 이면 true */
  doubleSided?: boolean
  /**
   * 외곽선 패스가 있으면 true (mesh, depth 무대). core.hlsl 의 `#ifdef SG_OUTLINE` 블록에 그 패스의 sgVertex 와 sgEffect 를 둔다.
   * 웹은 같은 물체를 뒷면만 한 번 더 그린다. 래퍼의 두 번째 패스(Cull Front, SRPDefaultUnlit)에 해당한다
   */
  outline?: boolean
  /**
   * 가려진 부분 패스가 있으면 true (mesh, depth 무대). 무대가 물체 앞에 벽을 세우고, 같은 물체를 `ZTest Greater` 로 한 번 더 그린다.
   * core.hlsl 의 `#ifdef SG_OCCLUDED` 블록이 그 패스의 색을 정한다. 래퍼의 두 번째 패스(SRPDefaultUnlit, ZTest Greater)에 해당한다.
   * outline 과 함께 쓸 수 없다 (같은 LightMode 태그를 두 패스가 쓰면 URP 는 첫 패스만 그린다)
   */
  occluded?: boolean
  /**
   * 해를 카메라 맞은편 낮은 곳(높이 15도)에 둔다 (mesh, depth 무대). 수면처럼 해 반짝임이 효과의 핵심인 표본용이다.
   * 기본 해는 카메라 뒤 위쪽이라 평평한 면의 반사광이 카메라로 오지 않는다. 바닥은 비스듬히 받아 어두워진다
   */
  backlit?: boolean
  /**
   * UGUI Image 에 쓰는 UI 셰이더면 true (sprite 무대). 래퍼는 Unity UI 셰이더 구조(Stencil, RectMask2D 클리핑, 정점 색)를 따르고
   * Universal2D, UniversalForward 대신 LightMode 없는 패스 하나를 쓴다. 미리보기는 스프라이트 무대 그대로다
   */
  ui?: boolean
  /**
   * stage.ui 의 Image 가로세로 비 (폭 / 높이). 기본 1. 4 면 4:1 배너다. 미리보기는 스프라이트를 이 비로 늘리고,
   * Unity 촬영은 Screen Space - Camera 캔버스의 Image 를 이 비로 만든다 (Image 는 Source Image 비와 상관없이 늘어난다)
   */
  uiAspect?: number
  /**
   * sprite 무대에서 같은 스프라이트를 뒤에 더 그리는 층. 앞에 적은 것이 가장 멀다. 본체(조절 패널의 값)는 맨 앞에 그린다.
   * 층마다 본체 값 위에 values 를 덮어쓰고, position(유닛)만큼 옮겨 놓는다. 시차 스크롤처럼 같은 셰이더를 값만 바꿔 겹쳐 쓰는 표본용이다
   */
  layers?: SpriteLayer[]
  /**
   * mesh 무대: 물체와 해 사이에 작은 공을 띄워 물체에 그림자를 드리운다. 받는 그림자를 보여 주는 표본용이다.
   * 웹은 SgInput.shadow(그림자 감쇠)와 lightColor, lighting 에 그 그림자를 넣는다
   */
  shadowProp?: boolean
  /**
   * mesh 무대: 물체를 Z 축으로 이만큼(도, Unity 기준) 옆으로 눕힌 채 Y 축으로 돌린다. 오브젝트 공간과 월드 공간이 달라져
   * 오브젝트 공간 실수(법선, 높이)가 화면에 드러난다. 90 이면 물체의 위(+Y)가 월드 -X 를 가리킨다. 회전은 Unity 의 Euler(0, yaw, tilt) 과 같다
   */
  tilt?: number
  /**
   * 투명 혼합(alpha) 표본이 깊이를 쓴다 (래퍼의 ZWrite On). 뒤 장면을 직접 읽어 알파 1 로 덮어 그리는 표본(클로킹)용이다.
   * 팔이 몸통 앞을 지나는 것처럼 몸이 여러 겹이어도 가장 앞면만 남는다. 패스는 하나로 둔다
   */
  zwrite?: boolean
  /** fullscreen 무대: 하늘색 배경과 밝은 바닥. 가장자리를 어둡게 덮는 효과(비네트)가 어두운 무대에 묻히지 않게 한다 */
  bright?: boolean
  /** 표본 폴더에 둔 텍스처. sprite 무대에서 _MainTex 를 적지 않으면 앱이 스테이지 스프라이트를 넣는다 */
  textures?: Record<string, StageTexture>
}

export interface SpriteLayer {
  /** 본체 값 위에 덮어쓰는 값 */
  values: ParamValues
  /** 본체에서 옮긴 거리 (x, y 유닛). 스프라이트 높이가 2 유닛이다 */
  position?: [number, number]
}

export interface Capture {
  name: string
  label: string
  values: ParamValues
}

export interface SpecimenMeta {
  /** 영구 불변 ID (kebab-case). 폴더 이름, URL 에 쓰인다 */
  id: string
  title: string
  titleEn: string
  group: GroupId
  order: number
  oneLiner: string
  goals: string[]
  /** 쓰인 기법. 검색과 필터에 쓴다 (예: 노이즈, 임계값, 깊이) */
  tags: string[]
  difficulty: 1 | 2 | 3
  /** Assets/Shaders/<id>/ 안의 .shader 파일 이름 */
  shaderFile: string
  /** 공통 문법으로 안 되어 웹용 GLSL 을 따로 둘 때의 사유. 있으면 web/src/specimens/<id>/web.glsl 을 쓴다 */
  webGlslReason?: string
  stage: SpecimenStage
  /** URP 에셋에서 켜야 하는 설정 */
  requires?: Requirement[]
  params: ParamDef[]
  presets: Preset[]
  events: StageEvent[]
  demo?: Demo
  steps: Step[]
  /** '효과 끄기' 때 보이는 것 (core.hlsl 의 SG_OFF 분기) 설명 */
  offNote: string
  mistakes: Mistake[]
  unity: UnityGuide
  prompt: PromptGuide
  /** 기본값 외에 더 찍을 Unity 스크린샷 */
  captures?: Capture[]
  /**
   * 갤러리 썸네일로 쓸 촬영 이름 (captures 의 name). 기본은 'default'. 띠가 쉬는 시간이 있는 주기 효과처럼
   * 기본값 촬영이 효과가 없는 순간에 찍힐 수 있거나 무대에서 효과가 약하게 보일 때, 효과가 잘 보이는 촬영을 고른다
   */
  thumbnail?: string
  inspiredBy: InspiredBy[]
  /** 원작과 다르게 새로 만든 것 */
  original: string
  references: Reference[]
  related?: { id: string; why: string }[]
  /** 화면의 넓은 영역이 번쩍이는 효과. 이벤트가 제한기를 거친다 */
  flashes?: boolean
}

export interface SpecimenFile {
  /** 파일 이름 (예: Dissolve.shader) */
  name: string
  lang: 'cpp' | 'csharp'
  code: string
}

export interface Specimen {
  meta: SpecimenMeta
  files: SpecimenFile[]
  /** core.hlsl 내용 (webGlslReason 이 있으면 web.glsl 내용) */
  core: string
  /** 상태 이름 -> Unity 스크린샷 주소 */
  shots: Record<string, string>
  /** 텍스처 속성 이름 -> 이미지 주소 */
  textureUrls: Record<string, string>
}

/** 아직 구현되지 않은 계획 표본 ('제작 중' 카드) */
export interface PlannedSpecimen {
  id: string
  title: string
  group: GroupId
  order: number
  kind: StageKind
  oneLiner: string
}
