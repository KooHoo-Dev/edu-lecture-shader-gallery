import type { GroupId, StageKind } from './types'

/* 그룹은 docs/shader-selection.md 와 같다 */
export const GROUPS: Record<GroupId, { name: string; desc: string }> = {
  A: { name: '재질', desc: '물체 표면이 어떻게 보이는가' },
  B: { name: '상태 피드백', desc: '게임 상태가 바뀌었음을 물체의 모습으로 알린다' },
  C: { name: '자연', desc: '물, 바람, 날씨처럼 움직이는 환경' },
  D: { name: 'VFX', desc: '시뮬레이션 없이 셰이더만으로 만드는 연출' },
  E: { name: '2D', desc: '스프라이트와 2D 게임에서 바로 쓰는 효과' },
  F: { name: 'UI', desc: '버튼과 패널에 쓰는 효과' },
  G: { name: '후처리', desc: '카메라가 그린 화면 전체를 다시 그리는 효과' },
}

export const STAGE_KINDS: Record<StageKind, { name: string; short: string; desc: string }> = {
  mesh: { name: '메시', short: '메시', desc: '3D 물체에 머티리얼로 입히는 효과' },
  sprite: { name: '스프라이트', short: '스프라이트', desc: 'SpriteRenderer 에 쓰는 2D 효과' },
  depth: { name: '깊이 사용', short: '깊이', desc: '씬의 깊이를 읽어 다른 물체와의 겹침을 표현한다' },
  fullscreen: { name: '전체 화면', short: '전체 화면', desc: '카메라가 그린 결과를 다시 그린다' },
}
