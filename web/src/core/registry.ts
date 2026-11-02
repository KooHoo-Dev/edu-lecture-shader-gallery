import type { PlannedSpecimen, Specimen, SpecimenFile, SpecimenMeta } from './types'

/* 표본 자동 등록: web/src/specimens/<id>/meta.ts 를 만들기만 하면 갤러리에 나타난다.
 * 셰이더 파일은 Assets/Shaders/<id>/ 에서, 스크린샷은 web/src/shots/<id>/ 에서 모은다. */
const metas = import.meta.glob<{ meta: SpecimenMeta }>('../specimens/*/meta.ts', { eager: true })
const sources = import.meta.glob<string>('../../../Assets/Shaders/*/*.{shader,hlsl,cs}', { query: '?raw', import: 'default', eager: true })
const webGlsl = import.meta.glob<string>('../specimens/*/web.glsl', { query: '?raw', import: 'default', eager: true })
const shotUrls = import.meta.glob<string>('../shots/*/*.webp', { import: 'default', eager: true })
const pngUrls = import.meta.glob<string>('../../../Assets/Shaders/*/*.png', { import: 'default', eager: true })

const fileOrder = (name: string) => (name.endsWith('.shader') ? 0 : name.endsWith('.hlsl') ? 1 : 2)

function filesOf(id: string): SpecimenFile[] {
  const prefix = `../../../Assets/Shaders/${id}/`
  return Object.entries(sources)
    .filter(([path]) => path.startsWith(prefix))
    .map(([path, code]) => {
      const name = path.slice(prefix.length)
      return { name, lang: name.endsWith('.cs') ? 'csharp' : 'cpp', code } as SpecimenFile
    })
    .sort((a, b) => fileOrder(a.name) - fileOrder(b.name) || a.name.localeCompare(b.name))
}

function shotsOf(id: string): Record<string, string> {
  const prefix = `../shots/${id}/`
  return Object.fromEntries(
    Object.entries(shotUrls)
      .filter(([path]) => path.startsWith(prefix))
      .map(([path, url]) => [path.slice(prefix.length, -'.webp'.length), url]),
  )
}

function texturesOf(meta: SpecimenMeta): Record<string, string> {
  return Object.fromEntries(
    Object.entries(meta.stage.textures ?? {}).map(([prop, texture]) => {
      const url = pngUrls[`../../../Assets/Shaders/${meta.id}/${texture.file}`]
      if (!url) throw new Error(`${meta.id}: 텍스처 파일이 없습니다: ${texture.file}`)
      return [prop, url]
    }),
  )
}

export const SPECIMENS: Specimen[] = Object.entries(metas)
  .map(([path, mod]) => {
    const id = path.split('/').at(-2)!
    if (mod.meta.id !== id) throw new Error(`표본 폴더명(${id})과 meta.id(${mod.meta.id})가 다릅니다`)
    const files = filesOf(id)
    const override = webGlsl[`../specimens/${id}/web.glsl`]
    const core = override ?? files.find(f => f.name === 'core.hlsl')?.code ?? ''
    return { meta: mod.meta, files, core, shots: shotsOf(id), textureUrls: texturesOf(mod.meta) }
  })
  .sort((a, b) => a.meta.group.localeCompare(b.meta.group) || a.meta.order - b.meta.order)

export const findSpecimen = (id: string) => SPECIMENS.find(s => s.meta.id === id)

/* 옛 ID -> 새 ID (ID는 영구 불변이 원칙. 이름을 바꿔야 할 때만 여기에 추가) */
export const ALIASES: Record<string, string> = {}

/* 아직 구현되지 않은 표본. 구현되면 자동으로 목록에서 빠진다. 목록은 docs/shader-selection.md (2-4 확인 대기) */
const PLANNED_ALL: PlannedSpecimen[] = [
  { id: 'toon-ramp-lit', title: '램프 툰 조명', group: 'A', order: 1, kind: 'mesh', oneLiner: '빛의 밝기를 단계로 끊어 만화풍 음영을 만든다' },
  { id: 'fresnel-rim-glow', title: '프레넬 림 빛', group: 'A', order: 2, kind: 'mesh', oneLiner: '비스듬히 보이는 가장자리만 밝힌다' },
  { id: 'triplanar-projection', title: '삼평면 투영', group: 'A', order: 3, kind: 'mesh', oneLiner: 'UV 없이 세 축에서 텍스처를 투영한다' },
  { id: 'screen-refraction-glass', title: '씬 컬러 굴절 유리', group: 'A', order: 4, kind: 'depth', oneLiner: '투명 표면 뒤 장면을 휘어 보여 준다' },
  { id: 'inverted-hull-outline', title: '껍데기 외곽선', group: 'B', order: 2, kind: 'mesh', oneLiner: '부풀린 뒷면을 한 번 더 그려 외곽선을 만든다' },
  { id: 'xray-occluded-silhouette', title: '가려진 실루엣', group: 'B', order: 3, kind: 'mesh', oneLiner: '벽 뒤에 가려진 부분만 단색으로 덧그린다' },
  { id: 'water-wave-surface', title: '물결 수면', group: 'C', order: 1, kind: 'mesh', oneLiner: '사인파를 더해 수면을 출렁이게 하고 하늘빛을 비춘다' },
  { id: 'water-depth-foam', title: '깊이 기반 물가 거품', group: 'C', order: 2, kind: 'depth', oneLiner: '물체와 만나는 곳에 거품 띠를 그린다' },
  { id: 'wind-sway-foliage', title: '바람 흔들림', group: 'C', order: 3, kind: 'mesh', oneLiner: '정점을 높이에 따라 흔들어 바람을 만든다' },
  { id: 'flow-map-liquid', title: '플로 맵 액체', group: 'C', order: 4, kind: 'mesh', oneLiner: '방향 텍스처로 UV 를 흘려 액체를 만든다' },
  { id: 'surface-wet-snow', title: '젖음과 눈 쌓임', group: 'C', order: 5, kind: 'mesh', oneLiner: '윗면에 젖은 느낌이나 눈을 얹는다' },
  { id: 'fire-noise-flame', title: '노이즈 불꽃', group: 'D', order: 1, kind: 'mesh', oneLiner: '흐르는 노이즈를 불꽃 모양으로 깎아 타오르게 한다' },
  { id: 'screen-shockwave-distortion', title: '충격파 왜곡', group: 'D', order: 3, kind: 'fullscreen', oneLiner: '퍼지는 고리 모양으로 화면을 왜곡한다' },
  { id: 'hologram-scanline-glitch', title: '홀로그램', group: 'D', order: 4, kind: 'mesh', oneLiner: '스캔라인과 글리치로 홀로그램을 만든다' },
  { id: 'scroll-distort-energy', title: '스크롤·왜곡 에너지', group: 'D', order: 5, kind: 'mesh', oneLiner: '흐르는 무늬를 겹쳐 레이저와 마법 기운을 만든다' },
  { id: 'palette-swap-lut', title: '팔레트 스왑', group: 'E', order: 2, kind: 'sprite', oneLiner: '이미지 한 장으로 색 변형을 만든다' },
  { id: 'tiling-scroll-parallax', title: '타일 스크롤 패럴랙스', group: 'E', order: 3, kind: 'sprite', oneLiner: 'UV 오프셋으로 끝없는 배경을 스크롤한다' },
  { id: 'ui-sdf-shape', title: 'SDF 도형', group: 'F', order: 1, kind: 'sprite', oneLiner: '거리장으로 해상도와 상관없이 매끈한 도형을 그린다' },
  { id: 'ui-sheen-sweep', title: '광택 훑기', group: 'F', order: 2, kind: 'sprite', oneLiner: '버튼 위를 빛 띠가 주기적으로 지나간다' },
  { id: 'ui-backdrop-blur', title: '배경 블러 유리', group: 'F', order: 3, kind: 'depth', oneLiner: '패널 뒤 화면을 흐리게 비춘다' },
  { id: 'depth-normal-edge-outline', title: '깊이·법선 윤곽선 후처리', group: 'G', order: 2, kind: 'fullscreen', oneLiner: '깊이와 법선 차이로 전체 화면에 윤곽선을 그린다' },
  { id: 'screen-vignette', title: '화면 비네트', group: 'G', order: 3, kind: 'fullscreen', oneLiner: '화면 가장자리를 어둡게 하거나 붉게 한다' },
]

export const PLANNED: PlannedSpecimen[] = PLANNED_ALL.filter(p => !SPECIMENS.some(s => s.meta.id === p.id))
