import * as THREE from 'three'
import { requestFlash } from '../core/flash'
import { STAGE_SPRITE_URL } from './assets'
import type { Ease, ParamDef, ParamValues, Specimen, Track } from '../core/types'
import { buildProgram, defaultBlend, LIT_FRAGMENT, LIT_VERTEX, PRESENT_FRAGMENT, PRESENT_VERTEX, SHADOW_PLAIN_FRAGMENT, textureNames } from './glsl'
import { grassGeometry } from './grass'
import { hexToLinear, LAYOUT, linear3, toThree } from './layout'

/**
 * 공유 무대. WebGL 컨텍스트 하나를 앱 전체가 나눠 쓴다. 상세 페이지와 호버 중인 카드 중 한 곳에만 붙는다.
 * Unity 와 색이 맞도록 선형 HDR 버퍼에 그린 뒤 마지막에 sRGB 로 바꿔 내보낸다.
 */

THREE.ColorManagement.enabled = false

export interface StageSettings {
  values: ParamValues
  step: number
  off: boolean
  playing: boolean
  speed: number
  auto: boolean
}

export interface StageCallbacks {
  /** 셰이더 컴파일 실패 로그 */
  onError?: (log: string) => void
  /** 자동 데모·이벤트가 움직이는 값 (슬라이더 표시용) */
  onLive?: (key: string, value: number | null) => void
}

const EASE: Record<Ease, (t: number) => number> = {
  linear: t => t,
  inOutSine: t => 0.5 - 0.5 * Math.cos(Math.PI * t),
  outQuad: t => 1 - (1 - t) * (1 - t),
  inQuad: t => t * t,
}

/** 트랙의 t 초 값. 범위를 벗어나면 양 끝 값 */
function evalTrack(track: Track, t: number): number {
  const f = track.frames
  if (t <= f[0][0]) return f[0][1]
  for (let i = 1; i < f.length; i++) {
    if (t <= f[i][0]) {
      const u = (t - f[i - 1][0]) / Math.max(1e-5, f[i][0] - f[i - 1][0])
      return f[i - 1][1] + (f[i][1] - f[i - 1][1]) * EASE[track.ease ?? 'linear'](u)
    }
  }
  return f[f.length - 1][1]
}

const trackEnd = (track: Track) => track.frames[track.frames.length - 1][0]

function paramToUniform(def: ParamDef, value: unknown): number | THREE.Vector4 {
  if (def.type === 'color') {
    const [r, g, b] = hexToLinear(String(value))
    return new THREE.Vector4(r, g, b, 1)
  }
  if (def.type === 'toggle') return value ? 1 : 0
  if (def.type === 'select') return Number(value)
  return Number(value)
}

/**
 * mesh 무대에서 물체를 돌릴지. 납작한 quad, plane 은 돌리면 옆면이 되어 사라지고,
 * grass 는 바람 같은 월드 방향 효과를 위해 오브젝트 공간과 월드 공간의 방향을 같게 둔다. SgCapture 도 같은 규칙이다
 */
const spins = (shape: string | undefined) => shape !== 'quad' && shape !== 'plane' && shape !== 'grass'

/** Unity 기본 Plane 은 위에서 볼 때 UV 가 180도 돌아 있다 (u 는 -X, v 는 -Z 쪽으로 커진다). 같게 맞춘다 */
function unityPlaneUv(geometry: THREE.BufferGeometry) {
  const uv = geometry.getAttribute('uv')
  for (let i = 0; i < uv.count; i++) uv.setXY(i, 1 - uv.getX(i), 1 - uv.getY(i))
  return geometry
}

class ShaderStage {
  readonly canvas: HTMLCanvasElement
  private renderer: THREE.WebGLRenderer
  private hdr = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 4 })
  private source = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 4 })
  private opaque = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, depthTexture: new THREE.DepthTexture(4, 4, THREE.FloatType) })
  /** 잘라 내기 메시의 그림자: 광원 쪽에서 평행 투영으로 본 물체의 알파. 바닥이 이 값으로 어두워진다 */
  private shadowMask = new THREE.WebGLRenderTarget(512, 512)
  private shadowCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 30)
  private shadowMatrix = new THREE.Matrix4()
  private shadowPlain: THREE.RawShaderMaterial
  private maskFloor: THREE.Mesh<THREE.BufferGeometry, THREE.RawShaderMaterial> | null = null

  private perspective = new THREE.PerspectiveCamera(LAYOUT.camera.fov, 16 / 9, LAYOUT.camera.near, LAYOUT.camera.far)
  private ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100)
  private fullscreenCamera = new THREE.Camera()
  private effectScene = new THREE.Scene()
  private liveKeys = new Set<string>()
  private triangle: THREE.BufferGeometry
  private presentScene = new THREE.Scene()
  private presentMaterial: THREE.RawShaderMaterial

  private host: HTMLElement | null = null
  private specimen: Specimen | null = null
  private callbacks: StageCallbacks = {}
  private settings: StageSettings = { values: {}, step: 0, off: false, playing: true, speed: 1, auto: true }
  private visible = true

  private scene = new THREE.Scene()
  private effect: THREE.Mesh | null = null
  private materials: (THREE.RawShaderMaterial | null)[] = [null, null]
  /** stage.outline: 같은 메시를 뒷면만 그리는 자식. 래퍼의 Cull Front 패스에 해당한다 */
  private outline: THREE.Mesh | null = null
  private outlineMaterials: (THREE.RawShaderMaterial | null)[] = [null, null]
  private litMaterials: THREE.RawShaderMaterial[] = []
  private textures = new Map<string, THREE.Texture>()

  private raf = 0
  private last = 0
  private time = 0
  private demoTime = 0
  private dirty = true
  private fireClock = new Map<string, number>()
  private active: { tracks: Track[]; start: number }[] = []
  private azimuth = 0
  private elevation = 0
  private spin = 0
  private dragging = false
  private resizeObserver: ResizeObserver
  private errorLog: string | null = null
  /** 자동 검사용 */
  framesRendered = 0

  constructor() {
    this.canvas = document.createElement('canvas')
    this.canvas.className = 'stage-canvas'
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false, alpha: false, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(1)
    this.renderer.toneMapping = THREE.NoToneMapping
    this.renderer.debug.onShaderError = (gl, _program, vertex, fragment) => {
      const log = [gl.getShaderInfoLog(vertex), gl.getShaderInfoLog(fragment)].filter(Boolean).join('\n')
      this.errorLog = log || '셰이더 컴파일 실패'
      this.callbacks.onError?.(this.errorLog)
    }

    this.triangle = new THREE.BufferGeometry()
    this.triangle.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3))
    this.presentMaterial = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: PRESENT_VERTEX,
      fragmentShader: PRESENT_FRAGMENT,
      uniforms: { uSource: { value: this.hdr.texture } },
      depthTest: false,
      depthWrite: false,
    })
    this.presentScene.add(this.fullscreenMesh(this.presentMaterial))
    this.shadowPlain = new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: LIT_VERTEX, fragmentShader: SHADOW_PLAIN_FRAGMENT })

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.canvas.addEventListener('pointerdown', this.onPointerDown)
    this.canvas.addEventListener('pointermove', this.onPointerMove)
    this.canvas.addEventListener('pointerup', this.onPointerUp)
    this.canvas.addEventListener('pointercancel', this.onPointerUp)
  }

  private fullscreenMesh(material: THREE.Material) {
    const mesh = new THREE.Mesh(this.triangle, material)
    mesh.frustumCulled = false
    return mesh
  }

  mount(host: HTMLElement, specimen: Specimen, settings: StageSettings, callbacks: StageCallbacks) {
    this.unmountCurrent()
    this.host = host
    this.specimen = specimen
    this.callbacks = callbacks
    this.settings = settings
    this.errorLog = null
    this.time = 0
    this.demoTime = 0
    this.active = []
    this.liveKeys.clear()
    this.fireClock.clear()
    this.azimuth = 0
    this.elevation = 0
    // Unity 촬영과 같은 각도에서 시작한다. three.js 의 y 회전은 Unity 와 부호가 반대다
    const shape = specimen.meta.stage.mesh
    const turns = specimen.meta.stage.kind === 'mesh' && spins(shape)
    this.spin = turns ? (-LAYOUT.meshYawDeg * Math.PI) / 180 : 0
    this.dragging = false
    this.framesRendered = 0
    this.build(specimen)
    host.appendChild(this.canvas)
    this.resizeObserver.observe(host)
    this.resize()
    this.dirty = true
    this.last = performance.now()
    cancelAnimationFrame(this.raf)
    this.raf = requestAnimationFrame(this.tick)
  }

  unmount(host: HTMLElement) {
    if (this.host === host) this.unmountCurrent()
  }

  private unmountCurrent() {
    if (!this.host) return
    this.resizeObserver.disconnect()
    cancelAnimationFrame(this.raf)
    this.canvas.remove()
    this.disposeScene()
    this.host = null
    this.specimen = null
    this.callbacks = {}
  }

  update(settings: StageSettings) {
    this.settings = settings
    this.dirty = true
  }

  setVisible(visible: boolean) {
    this.visible = visible
    this.last = performance.now()
  }

  fire(eventId: string) {
    const meta = this.specimen?.meta
    const event = meta?.events.find(e => e.id === eventId)
    if (!event) return
    if (meta?.flashes && !requestFlash()) return
    this.active.push({ tracks: event.tracks, start: this.time })
    this.dirty = true
  }

  /** 현재 화면을 PNG 로 */
  capture(): Promise<Blob | null> {
    this.renderFrame()
    return new Promise(ok => this.canvas.toBlob(ok, 'image/png'))
  }

  get lastError() {
    return this.errorLog
  }

  /* ───────── 장면 구성 ───────── */

  private makeLit(albedo: readonly number[], options: { tile?: number; albedo2?: readonly number[] } = {}) {
    const material = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: LIT_VERTEX,
      fragmentShader: LIT_FRAGMENT,
      uniforms: {
        uAlbedo: { value: new THREE.Vector3(...linear3(albedo)) },
        uAlbedo2: { value: new THREE.Vector3(...linear3(options.albedo2 ?? albedo)) },
        uTile: { value: options.tile ?? 0 },
        uLightDir: { value: this.lightDir() },
        uLightColor: { value: new THREE.Vector3(LAYOUT.lightIntensity, LAYOUT.lightIntensity, LAYOUT.lightIntensity) },
        uAmbient: { value: new THREE.Vector3(...linear3(LAYOUT.ambient)) },
        uShadowSpheres: { value: [new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4()] },
        uShadowCount: { value: 0 },
        uShadowMask: { value: this.shadowMask.texture },
        uShadowMatrix: { value: this.shadowMatrix },
        uShadowMaskOn: { value: 0 },
        uShadowSoft: { value: 0 },
      },
    })
    this.litMaterials.push(material)
    return material
  }

  private lightDir() {
    return new THREE.Vector3(...toThree(LAYOUT.lightDirUnity)).normalize()
  }

  private addFloor(shadowCasters: { position: readonly number[]; radius: number }[]) {
    const material = this.makeLit(LAYOUT.floorA, { tile: LAYOUT.floorTile, albedo2: LAYOUT.floorB })
    material.uniforms.uShadowSpheres.value = [0, 1, 2].map(i => {
      const c = shadowCasters[i]
      return c ? new THREE.Vector4(...toThree(c.position), c.radius) : new THREE.Vector4()
    })
    material.uniforms.uShadowCount.value = Math.min(3, shadowCasters.length)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(LAYOUT.floorSize, LAYOUT.floorSize), material)
    floor.rotation.x = -Math.PI / 2
    this.scene.add(floor)
    return floor
  }

  /** 그림자 마스크 카메라를 물체에 맞추고 바닥이 마스크를 읽게 한다 */
  private aimShadowMask(floor: THREE.Mesh<THREE.BufferGeometry, THREE.RawShaderMaterial>, mesh: THREE.Mesh, specimen: Specimen) {
    mesh.geometry.computeBoundingSphere()
    const radius = mesh.geometry.boundingSphere!.radius * mesh.scale.x * (specimen.meta.stage.vertex ? 1.3 : 1.05)
    const camera = this.shadowCamera
    camera.left = camera.bottom = -radius
    camera.right = camera.top = radius
    camera.position.copy(mesh.position).addScaledVector(this.lightDir(), 10)
    camera.lookAt(mesh.position)
    camera.updateProjectionMatrix()
    camera.updateMatrixWorld()
    this.shadowMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
    floor.material.uniforms.uShadowMaskOn.value = 1
    // 그림자 경계를 약 0.08 유닛 폭으로 흐린다. 마스크 전체 폭은 radius * 2 유닛이다
    floor.material.uniforms.uShadowSoft.value = 0.02 / (radius * 2)
    this.maskFloor = floor
  }

  private addProps() {
    const box = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), this.makeLit(LAYOUT.propColor))
    box.position.set(...toThree(LAYOUT.box.position))
    box.scale.setScalar(LAYOUT.box.scale)
    box.rotation.y = (-LAYOUT.box.rotationYDeg * Math.PI) / 180
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.5, 48, 32), this.makeLit(LAYOUT.propColor2))
    ball.position.set(...toThree(LAYOUT.ball.position))
    ball.scale.setScalar(LAYOUT.ball.scale)
    this.scene.add(box, ball)
  }

  private propShadows() {
    return [
      { position: LAYOUT.box.position, radius: LAYOUT.box.scale * 0.55 },
      { position: LAYOUT.ball.position, radius: LAYOUT.ball.scale * 0.5 },
    ]
  }

  private effectGeometry(specimen: Specimen) {
    const shape = specimen.meta.stage.mesh ?? 'sphere'
    // Unity 기본 큐브처럼 면을 나누지 않는다 (정점 24개). 나누면 정점을 미는 표본이 웹에서만 휜다
    if (shape === 'cube') return new THREE.BoxGeometry(1, 1, 1)
    if (shape === 'capsule') return new THREE.CapsuleGeometry(0.5, 1, 16, 48)
    if (shape === 'cylinder') return new THREE.CylinderGeometry(0.5, 0.5, 2, 64, 24)
    if (shape === 'quad') return new THREE.PlaneGeometry(1, 1, 32, 32)
    if (shape === 'plane') return unityPlaneUv(new THREE.PlaneGeometry(10, 10, 64, 64).rotateX(-Math.PI / 2))
    if (shape === 'grass') return grassGeometry()
    // 정점을 미는 표본은 Unity 기본 구와 비슷한 밀도로 그려 Unity 에서 보일 계단을 미리보기도 보여 준다
    return specimen.meta.stage.vertex ? new THREE.SphereGeometry(0.5, 24, 16) : new THREE.SphereGeometry(0.5, 96, 64)
  }

  private build(specimen: Specimen) {
    this.disposeScene()
    this.scene = new THREE.Scene()
    const kind = specimen.meta.stage.kind
    const material = this.effectMaterial(false)

    if (kind === 'mesh') {
      const place = LAYOUT.meshPlacement[specimen.meta.stage.mesh ?? 'sphere']
      const cutout = defaultBlend(specimen.meta) === 'cutout'
      // 잘라 내기 메시는 그림자 마스크로 그린다. 투명 메시는 Unity 에서 그림자를 드리우지 않으므로 그리지 않는다
      const floor = this.addFloor([])
      const mesh = new THREE.Mesh(this.effectGeometry(specimen), material)
      mesh.position.set(...toThree(place.position))
      mesh.scale.setScalar(place.scale)
      this.scene.add(mesh)
      this.effect = mesh
      this.addOutline(mesh)
      if (cutout) this.aimShadowMask(floor, mesh, specimen)
    } else if (kind === 'depth') {
      this.addFloor(this.propShadows())
      this.addProps()
      const mesh = new THREE.Mesh(this.effectGeometry(specimen), material)
      const place = LAYOUT.depthPlacement[specimen.meta.stage.mesh ?? 'sphere']
      mesh.position.set(...toThree(place.position))
      mesh.scale.setScalar(place.scale)
      mesh.renderOrder = 10
      this.scene.add(mesh)
      this.effect = mesh
      this.addOutline(mesh)
    } else if (kind === 'sprite') {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(LAYOUT.sprite.height, LAYOUT.sprite.height), material)
      this.scene.add(mesh)
      this.effect = mesh
    } else {
      this.addFloor([...this.propShadows(), { position: LAYOUT.fullscreenBall.position, radius: LAYOUT.fullscreenBall.scale * 0.5 }])
      this.addProps()
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.5, 64, 48), this.makeLit(LAYOUT.fullscreenBallColor))
      ball.position.set(...toThree(LAYOUT.fullscreenBall.position))
      ball.scale.setScalar(LAYOUT.fullscreenBall.scale)
      this.scene.add(ball)
      this.effect = this.fullscreenMesh(material)
    }
  }

  /** 자식으로 두어 위치, 크기, 회전을 그대로 따라간다. 지오메트리도 같이 쓴다 */
  private addOutline(mesh: THREE.Mesh) {
    if (!this.specimen!.meta.stage.outline) return
    const outline = new THREE.Mesh(mesh.geometry, this.effectMaterial(false, true))
    outline.renderOrder = mesh.renderOrder
    mesh.add(outline)
    this.outline = outline
  }

  private effectMaterial(off: boolean, outline = false): THREE.RawShaderMaterial {
    const slots = outline ? this.outlineMaterials : this.materials
    const slot = off ? 1 : 0
    const existing = slots[slot]
    if (existing) return existing
    const { meta, core } = this.specimen!
    const sources = buildProgram(meta, core, off, outline)
    const uniforms: Record<string, THREE.IUniform> = {
      _SgStep: { value: 0 },
      uTime: { value: 0 },
      uLightDir: { value: this.lightDir() },
      uLightColor: { value: new THREE.Vector3(LAYOUT.lightIntensity, LAYOUT.lightIntensity, LAYOUT.lightIntensity) },
      uAmbient: { value: new THREE.Vector3(...linear3(LAYOUT.ambient)) },
      uSpriteColor: { value: new THREE.Vector4(1, 1, 1, 1) },
      uAspect: { value: 16 / 9 },
      uViewport: { value: new THREE.Vector2(1, 1) },
      uNearFar: { value: new THREE.Vector2(LAYOUT.camera.near, LAYOUT.camera.far) },
      _SgSceneDepth: { value: this.opaque.depthTexture },
      _SgSceneColor: { value: this.opaque.texture },
      _SgSource: { value: this.source.texture },
    }
    for (const def of meta.params) uniforms[def.key] = { value: paramToUniform(def, def.default) }
    for (const name of textureNames(meta)) {
      uniforms[`${name}_TexelSize`] = { value: new THREE.Vector4(1 / 256, 1 / 256, 256, 256) }
      uniforms[name] = { value: this.loadTexture(name) }
    }
    const material = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: sources.vertex,
      fragmentShader: sources.fragment,
      uniforms,
      side: outline ? THREE.BackSide : meta.stage.kind === 'sprite' || meta.stage.doubleSided ? THREE.DoubleSide : THREE.FrontSide,
    })
    const blend = defaultBlend(meta)
    if (meta.stage.kind === 'fullscreen') {
      material.depthTest = false
      material.depthWrite = false
    } else if (blend !== 'cutout' && !outline) {
      material.transparent = true
      material.depthWrite = false
      material.blending = blend === 'additive' ? THREE.CustomBlending : THREE.NormalBlending
      if (blend === 'additive') {
        material.blendSrc = THREE.SrcAlphaFactor
        material.blendDst = THREE.OneFactor
      }
    }
    slots[slot] = material
    return material
  }

  /** 표본 폴더의 텍스처를 읽는다. sprite 무대에서 지정이 없으면 스테이지 스프라이트 */
  private loadTexture(name: string): THREE.Texture {
    const specimen = this.specimen!
    const config = specimen.meta.stage.textures?.[name]
    const url = specimen.textureUrls[name] ?? STAGE_SPRITE_URL
    const key = `${url}|${config?.linear ?? false}|${config?.repeat ?? false}|${config?.point ?? false}`
    const setTexelSize = (image: { width: number; height: number }) => {
      for (const material of [...this.materials, ...this.outlineMaterials]) material?.uniforms[`${name}_TexelSize`]?.value.set(1 / image.width, 1 / image.height, image.width, image.height)
      // 스프라이트는 높이 2 유닛에 맞춘다. 정사각형이 아니면 Unity 와 같이 폭이 늘어난다
      if (name === '_MainTex' && specimen.meta.stage.kind === 'sprite') this.effect?.scale.set(image.width / image.height, 1, 1)
      this.dirty = true
    }
    const cached = this.textures.get(key)
    if (cached) {
      if (cached.image) queueMicrotask(() => setTexelSize(cached.image as HTMLImageElement))
      return cached
    }
    const texture = new THREE.TextureLoader().load(url, loaded => setTexelSize(loaded.image as HTMLImageElement))
    texture.colorSpace = config?.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace
    if (config?.repeat) texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.minFilter = config?.point ? THREE.NearestFilter : THREE.LinearMipmapLinearFilter
    texture.magFilter = config?.point ? THREE.NearestFilter : THREE.LinearFilter
    this.textures.set(key, texture)
    return texture
  }

  private disposeScene() {
    this.scene.traverse(object => {
      if (object instanceof THREE.Mesh && object.geometry !== this.triangle) object.geometry.dispose()
    })
    this.scene.clear()
    for (const material of [...this.materials, ...this.outlineMaterials]) material?.dispose()
    this.materials = [null, null]
    this.outlineMaterials = [null, null]
    for (const material of this.litMaterials) material.dispose()
    this.litMaterials = []
    this.effect = null
    this.outline = null
    this.maskFloor = null
  }

  /* ───────── 크기 ───────── */

  private resize() {
    if (!this.host) return
    const rect = this.host.getBoundingClientRect()
    if (rect.width < 2 || rect.height < 2) return
    // 1920×1080 을 넘겨도 수업 화면에서 차이가 없어 상한을 둔다
    const scale = Math.min(Math.min(devicePixelRatio || 1, 2), 1920 / rect.width)
    const w = Math.round(rect.width * scale)
    const h = Math.round(rect.height * scale)
    this.renderer.setSize(w, h, false)
    this.hdr.setSize(w, h)
    this.source.setSize(w, h)
    this.opaque.setSize(w, h)
    this.dirty = true
  }

  /* ───────── 궤도 조작 ───────── */

  private onPointerDown = (e: PointerEvent) => {
    const kind = this.specimen?.meta.stage.kind
    if (kind !== 'mesh' && kind !== 'depth') return
    this.dragging = true
    this.canvas.setPointerCapture(e.pointerId)
  }

  private onPointerMove = (e: PointerEvent) => {
    if (!this.dragging) return
    this.azimuth -= e.movementX * 0.008
    this.elevation = Math.max(-0.35, Math.min(0.9, this.elevation + e.movementY * 0.006))
    this.dirty = true
  }

  private onPointerUp = () => {
    this.dragging = false
  }

  private placeCamera() {
    const target = new THREE.Vector3(...toThree(LAYOUT.camera.target))
    const position = new THREE.Vector3(...toThree(LAYOUT.camera.position)).sub(target)
    const spherical = new THREE.Spherical().setFromVector3(position)
    spherical.theta += this.azimuth
    spherical.phi = Math.max(0.15, Math.min(Math.PI / 2 - 0.02, spherical.phi - this.elevation))
    this.perspective.position.setFromSpherical(spherical).add(target)
    this.perspective.lookAt(target)
  }

  /* ───────── 그리기 ───────── */

  private tick = (now: number) => {
    this.raf = requestAnimationFrame(this.tick)
    const running = this.settings.playing && this.visible && !document.hidden
    if (running) {
      const dt = Math.min(0.1, (now - this.last) / 1000) * this.settings.speed
      this.time += dt
      if (this.settings.auto) this.demoTime += dt
      const shape = this.specimen?.meta.stage.mesh
      if (this.specimen?.meta.stage.kind === 'mesh' && spins(shape) && !this.dragging) this.spin += dt * 0.25
      this.fireDemoEvents()
      this.dirty = true
    }
    this.last = now
    if (this.dirty && this.visible && !document.hidden) this.renderFrame()
  }

  private fireDemoEvents() {
    const fires = this.settings.auto ? this.specimen?.meta.demo?.fire : undefined
    if (!fires) return
    for (const f of fires) {
      const count = Math.floor(this.demoTime / f.every)
      if (count > (this.fireClock.get(f.event) ?? 0)) {
        this.fireClock.set(f.event, count)
        this.fire(f.event)
      }
    }
  }

  /** 슬라이더 값 위에 자동 데모와 이벤트를 덮어 쓴 현재 유니폼 값. 외곽선 패스가 있으면 같은 값을 함께 넣는다 */
  private applyUniforms(...materials: THREE.RawShaderMaterial[]) {
    const meta = this.specimen!.meta
    const set = (key: string, value: number | THREE.Vector4) => {
      for (const material of materials) {
        const uniform = material.uniforms[key]
        if (value instanceof THREE.Vector4) uniform.value.copy(value)
        else uniform.value = value
      }
    }
    for (const def of meta.params) set(def.key, paramToUniform(def, this.settings.values[def.key] ?? def.default))

    const live = new Map<string, number>()
    if (this.settings.auto) {
      for (const track of meta.demo?.loops ?? []) {
        const end = Math.max(0.001, trackEnd(track))
        const value = evalTrack(track, this.demoTime % end)
        set(track.key, value)
        live.set(track.key, value)
      }
    }
    this.active = this.active.filter(a => this.time - a.start <= Math.max(...a.tracks.map(trackEnd)))
    for (const a of this.active) {
      for (const track of a.tracks) {
        const value = evalTrack(track, this.time - a.start)
        set(track.key, value)
        live.set(track.key, value)
      }
    }
    for (const key of new Set([...live.keys(), ...this.liveKeys])) this.callbacks.onLive?.(key, live.get(key) ?? null)
    this.liveKeys = new Set(live.keys())

    for (const material of materials) {
      material.uniforms._SgStep.value = this.settings.step
      material.uniforms.uTime.value = this.time
      material.uniforms.uAspect.value = this.canvas.width / Math.max(1, this.canvas.height)
      material.uniforms.uViewport.value.set(this.hdr.width, this.hdr.height)
    }
  }

  /**
   * Unity 의 ShadowCaster 패스에 해당한다. 잘라 낸 구멍이 그림자에도 뚫린다.
   * 단계 보기와 상관없이 최종 알파를 쓰고, 효과 끄기에서는 그림자 패스를 자르지 않는 흔한 실수를 보여 준다.
   */
  private renderShadowMask(material: THREE.RawShaderMaterial) {
    const renderer = this.renderer
    const effect = this.effect!
    const floor = this.maskFloor!
    material.uniforms._SgStep.value = 0
    effect.material = this.settings.off ? this.shadowPlain : material
    floor.visible = false
    // Unity 의 외곽선 패스(SRPDefaultUnlit)는 그림자를 드리우지 않는다
    if (this.outline) this.outline.visible = false
    renderer.setClearColor(0x000000, 0)
    renderer.setRenderTarget(this.shadowMask)
    renderer.render(this.scene, this.shadowCamera)
    floor.visible = true
    if (this.outline) this.outline.visible = true
    effect.material = material
    material.uniforms._SgStep.value = this.settings.step
  }

  /** 자동 검사용: 마스크가 얼마나 찼고 바닥에 그림자가 얼마나 드리우는지 잰다. 화면에는 영향이 없다 */
  probeShadow() {
    const floor = this.maskFloor
    if (!floor || !this.effect) return null
    const renderer = this.renderer
    const { width, height } = this.shadowMask
    const mask = new Uint8Array(width * height * 4)
    renderer.readRenderTargetPixels(this.shadowMask, 0, 0, width, height, mask)
    let covered = 0
    for (let i = 3; i < mask.length; i += 4) if (mask[i] > 127) covered++

    // 바닥만 마스크를 켜고 끈 두 장을 비교한다
    const probe = new THREE.WebGLRenderTarget(128, 72, { type: THREE.FloatType })
    const floorPixels = (on: number) => {
      const pixels = new Float32Array(probe.width * probe.height * 4)
      floor.material.uniforms.uShadowMaskOn.value = on
      renderer.setRenderTarget(probe)
      renderer.render(this.scene, this.perspective)
      renderer.readRenderTargetPixels(probe, 0, 0, probe.width, probe.height, pixels)
      return pixels
    }
    this.effect.visible = false
    renderer.setClearColor(0x000000, 1)
    const shaded = floorPixels(1)
    const unshaded = floorPixels(0)
    floor.material.uniforms.uShadowMaskOn.value = 1
    this.effect.visible = true
    renderer.setRenderTarget(null)
    probe.dispose()

    let dark = 0
    for (let i = 1; i < shaded.length; i += 4) if (shaded[i] < unshaded[i] * 0.8) dark++
    return { coverage: covered / (width * height), area: dark / (shaded.length / 4) }
  }

  private renderFrame() {
    if (!this.specimen || !this.effect) return
    this.dirty = false
    const kind = this.specimen.meta.stage.kind
    const material = this.effectMaterial(this.settings.off)
    if (this.effect.material !== material) this.effect.material = material
    if (this.outline) {
      const outlineMaterial = this.effectMaterial(this.settings.off, true)
      if (this.outline.material !== outlineMaterial) this.outline.material = outlineMaterial
      this.applyUniforms(material, outlineMaterial)
    } else {
      this.applyUniforms(material)
    }
    const stepping = this.settings.step > 0
    const blend = defaultBlend(this.specimen.meta)
    if (kind !== 'fullscreen' && blend !== 'cutout') {
      // 단계 보기에서는 뒤 배경과 섞이지 않게 값을 그대로 보여 준다.
      // 섞지 않으면 양면 메시의 뒷면이 그리는 순서에 따라 앞면을 덮으므로, 그동안만 깊이를 써서 앞면을 남긴다
      material.blending = stepping ? THREE.NoBlending : blend === 'additive' ? THREE.CustomBlending : THREE.NormalBlending
      material.depthWrite = stepping
    }

    if (this.maskFloor) {
      this.effect.rotation.y = this.spin
      this.renderShadowMask(material)
    }

    const renderer = this.renderer
    const background = kind === 'sprite' ? LAYOUT.spriteBackground : LAYOUT.background
    renderer.setClearColor(new THREE.Color(...linear3(background)), 1)

    if (kind === 'sprite') {
      const aspect = this.canvas.width / Math.max(1, this.canvas.height)
      const half = LAYOUT.sprite.orthographicSize
      this.ortho.left = -half * aspect
      this.ortho.right = half * aspect
      this.ortho.top = half
      this.ortho.bottom = -half
      this.ortho.position.set(0, 0, -LAYOUT.sprite.cameraZ)
      this.ortho.updateProjectionMatrix()
      renderer.setRenderTarget(this.hdr)
      renderer.render(this.scene, this.ortho)
    } else {
      this.perspective.aspect = this.canvas.width / Math.max(1, this.canvas.height)
      this.perspective.updateProjectionMatrix()
      this.placeCamera()

      if (kind === 'mesh') {
        this.effect.rotation.y = this.spin
        renderer.setRenderTarget(this.hdr)
        renderer.render(this.scene, this.perspective)
      } else if (kind === 'depth') {
        this.effect.visible = false
        renderer.setRenderTarget(this.opaque)
        renderer.render(this.scene, this.perspective)
        this.effect.visible = true
        renderer.setRenderTarget(this.hdr)
        renderer.render(this.scene, this.perspective)
      } else {
        renderer.setRenderTarget(this.source)
        renderer.render(this.scene, this.perspective)
        renderer.setRenderTarget(this.hdr)
        this.effectScene.add(this.effect)
        renderer.render(this.effectScene, this.fullscreenCamera)
        this.effectScene.remove(this.effect)
      }
    }

    renderer.setRenderTarget(null)
    renderer.render(this.presentScene, this.fullscreenCamera)
    this.framesRendered++
  }
}

let shared: ShaderStage | null | undefined

/** 공유 무대를 돌려준다. WebGL2 를 쓸 수 없으면 null */
export function getShaderStage(): ShaderStage | null {
  if (shared === undefined) {
    try {
      shared = new ShaderStage()
    } catch {
      shared = null
    }
  }
  return shared
}

export type { ShaderStage }
