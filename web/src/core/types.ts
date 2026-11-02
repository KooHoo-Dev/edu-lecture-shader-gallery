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
export type MeshShape = 'sphere' | 'capsule' | 'cube' | 'cylinder' | 'quad'
/** URP 에셋에서 켜야 하는 것. 프롬프트의 설정 단계에 자동으로 들어간다 */
export type Requirement = 'depth' | 'opaque'
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
  /** core.hlsl 에 sgVertex 가 있으면 true (mesh, depth 무대) */
  vertex?: boolean
  /** 표본 폴더에 둔 텍스처. sprite 무대에서 _MainTex 를 적지 않으면 앱이 스테이지 스프라이트를 넣는다 */
  textures?: Record<string, StageTexture>
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
  inspiredBy: InspiredBy[]
  /** 원작과 다르게 새로 만든 것 */
  original: string
  references: Reference[]
  related?: { id: string; why: string }[]
  /** 화면의 넓은 영역이 번쩍이는 효과. 이벤트가 제한기를 거친다 */
  flashes?: boolean
}

export interface StageTrigger {
  id: string
  seq: number
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
