import type { SpecimenMeta, StageKind } from '../core/types'

/* core.hlsl 을 WebGL2 로 컴파일할 수 있게 앞뒤를 붙인다. 호환 매크로와 무대별 입력(SgInput)을 앱이 제공하므로
 * 표본은 웹 전용 코드가 없다. 무대별 입력 필드는 docs/specimen-guide.md 의 표와 .shader 래퍼에 있는 것과 같다.
 * three.js 는 오른손 좌표계라 z 가 Unity 와 반대다. core.hlsl 에 넘기는 위치, 법선, 방향은 SG_FLIP 으로 Unity 좌표로 바꾼다.
 * 모든 벡터를 함께 뒤집으므로 내적(조명, 프레넬)은 그대로이고, 월드·오브젝트 좌표를 쓰는 무늬와 방향이 Unity 와 같아진다. */

const COMPAT = `precision highp float;
precision highp int;
precision highp sampler2D;
#define float2 vec2
#define float3 vec3
#define float4 vec4
#define lerp mix
#define frac fract
#define saturate(x) clamp((x), 0.0, 1.0)
#define atan2 atan
#define ddx dFdx
#define ddy dFdy
#define SG_TEX(name, uv) texture(name, uv)
#define SG_FLIP(v) ((v) * vec3(1.0, 1.0, -1.0))
uniform int _SgStep;
#define SG_STEP(n, rgb) if (_SgStep == (n)) { return float4((rgb), 1.0); }
`

const INPUT: Record<StageKind, string> = {
  mesh: `struct SgInput { float2 uv; float4 color; float3 positionOS; float3 positionWS; float3 normalOS; float3 normalWS; float3 viewWS; float3 lightDirWS; float3 lightColor; float3 lighting; float time; };`,
  sprite: `struct SgInput { float2 uv; float4 color; float2 texelSize; float time; };`,
  depth: `uniform sampler2D _SgSceneDepth;
uniform sampler2D _SgSceneColor;
uniform vec2 uNearFar;
float4 sgSceneColor(float2 uv) { return texture(_SgSceneColor, uv); }
float sgLinearEye(float raw) {
  float z = raw * 2.0 - 1.0;
  return 2.0 * uNearFar.x * uNearFar.y / (uNearFar.y + uNearFar.x - z * (uNearFar.y - uNearFar.x));
}
float sgSceneDepth(float2 uv) { return sgLinearEye(texture(_SgSceneDepth, uv).r); }
struct SgInput { float2 uv; float4 color; float3 positionOS; float3 positionWS; float3 normalOS; float3 normalWS; float3 viewWS; float3 cameraRightWS; float3 cameraUpWS; float2 screenUV; float depthDelta; float time; };`,
  fullscreen: `uniform sampler2D _SgSource;
uniform sampler2D _SgSceneDepth;
uniform sampler2D _SgSceneNormal;
uniform vec2 uNearFar;
float4 sgSource(float2 uv) { return texture(_SgSource, uv); }
float sgSceneDepth(float2 uv) {
  float z = texture(_SgSceneDepth, uv).r * 2.0 - 1.0;
  return 2.0 * uNearFar.x * uNearFar.y / (uNearFar.y + uNearFar.x - z * (uNearFar.y - uNearFar.x));
}
float3 sgSceneNormal(float2 uv) { return SG_FLIP(texture(_SgSceneNormal, uv).xyz); }
struct SgInput { float2 uv; float aspect; float2 texelSize; float time; };`,
}

const writeColor = (cutout: boolean) => (cutout ? 'if (c.a < 0.5) discard;\n  sgOut = vec4(c.rgb, 1.0);' : 'sgOut = c;')

const FRAGMENT_MAIN: Record<StageKind, (cutout: boolean) => string> = {
  mesh: cutout => `in vec2 vUv;
in vec3 vPositionOS;
in vec3 vPositionWS;
in vec3 vNormalOS;
in vec3 vNormalWS;
uniform vec3 cameraPosition;
uniform vec3 uLightDir;
uniform vec3 uLightColor;
uniform vec3 uAmbient;
uniform float uTime;
out vec4 sgOut;
void main() {
  SgInput i;
  i.uv = vUv;
  i.positionOS = SG_FLIP(vPositionOS);
  i.positionWS = SG_FLIP(vPositionWS);
  i.normalOS = normalize(SG_FLIP(vNormalOS));
  i.normalWS = normalize(SG_FLIP(vNormalWS));
  i.viewWS = normalize(SG_FLIP(cameraPosition - vPositionWS));
  i.lightDirWS = SG_FLIP(uLightDir);
  i.lightColor = uLightColor;
  i.lighting = uLightColor * saturate(dot(i.normalWS, i.lightDirWS)) + uAmbient;
  // 정점 색. 웹 무대 메시는 정점 색이 없어 흰색이다 (Unity 래퍼는 파티클의 Color over Lifetime 등을 넣는다)
  i.color = vec4(1.0);
  i.time = uTime;
  vec4 c = sgEffect(i);
  ${writeColor(cutout)}
}`,
  sprite: cutout => `in vec2 vUv;
uniform vec4 uSpriteColor;
uniform float uTime;
out vec4 sgOut;
void main() {
  SgInput i;
  i.uv = vUv;
  i.color = uSpriteColor;
  i.texelSize = _MainTex_TexelSize.xy;
  i.time = uTime;
  vec4 c = sgEffect(i);
  ${writeColor(cutout)}
}`,
  depth: cutout => `in vec2 vUv;
in vec3 vPositionOS;
in vec3 vPositionWS;
in vec3 vNormalOS;
in vec3 vNormalWS;
in float vEyeDepth;
uniform vec3 cameraPosition;
uniform mat4 viewMatrix;
uniform vec2 uViewport;
uniform float uTime;
out vec4 sgOut;
void main() {
  SgInput i;
  i.uv = vUv;
  i.positionOS = SG_FLIP(vPositionOS);
  i.positionWS = SG_FLIP(vPositionWS);
  i.normalOS = normalize(SG_FLIP(vNormalOS));
  i.normalWS = normalize(SG_FLIP(vNormalWS));
  i.viewWS = normalize(SG_FLIP(cameraPosition - vPositionWS));
  i.screenUV = gl_FragCoord.xy / uViewport;
  i.depthDelta = sgSceneDepth(i.screenUV) - vEyeDepth;
  i.color = vec4(1.0);
  // 카메라의 오른쪽, 위 축 (월드). 보기 행렬의 첫 두 행이다 (Unity 래퍼는 UNITY_MATRIX_V[0], [1])
  i.cameraRightWS = SG_FLIP(vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]));
  i.cameraUpWS = SG_FLIP(vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]));
  i.time = uTime;
  vec4 c = sgEffect(i);
  ${writeColor(cutout)}
}`,
  fullscreen: () => `in vec2 vUv;
uniform float uAspect;
uniform vec2 uViewport;
uniform float uTime;
out vec4 sgOut;
void main() {
  SgInput i;
  i.uv = vUv;
  i.aspect = uAspect;
  i.texelSize = 1.0 / uViewport;
  i.time = uTime;
  sgOut = vec4(sgEffect(i).rgb, 1.0);
}`,
}

const WORLD_VERTEX = (displace: boolean) => `in vec3 position;
in vec3 normal;
in vec2 uv;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
out vec2 vUv;
out vec3 vPositionOS;
out vec3 vPositionWS;
out vec3 vNormalOS;
out vec3 vNormalWS;
out float vEyeDepth;
void main() {
  vec3 p = ${displace ? 'SG_FLIP(sgVertex(SG_FLIP(position), SG_FLIP(normal), uv, uTime))' : 'position'};
  vec4 world = modelMatrix * vec4(p, 1.0);
  vec4 view = viewMatrix * world;
  vUv = uv;
  vPositionOS = p;
  vPositionWS = world.xyz;
  vNormalOS = normal;
  vNormalWS = mat3(modelMatrix) * normal;
  vEyeDepth = -view.z;
  gl_Position = projectionMatrix * view;
}`

const FULLSCREEN_VERTEX = `in vec3 position;
out vec2 vUv;
void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`

/** 주석을 지운다. WebGL 에 한글 주석을 넘기지 않고, 오류 줄 번호가 어긋나지 않게 줄 수는 유지한다 */
export function stripComments(source: string): string {
  return source.replace(/\r\n/g, '\n').replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, '')).replace(/\/\/.*$/gm, '')
}

function uniformDeclarations(meta: SpecimenMeta): string {
  const lines = meta.params.map(p => `uniform ${p.type === 'color' ? 'vec4' : 'float'} ${p.key};`)
  for (const name of textureNames(meta)) lines.push(`uniform sampler2D ${name};`, `uniform vec4 ${name}_TexelSize;`, `uniform vec4 ${name}_ST;`)
  return lines.join('\n')
}

export function textureNames(meta: SpecimenMeta): string[] {
  const names = new Set(Object.keys(meta.stage.textures ?? {}))
  if (meta.stage.kind === 'sprite') names.add('_MainTex')
  return [...names]
}

export interface ProgramSources {
  vertex: string
  fragment: string
}

export const defaultBlend = (meta: SpecimenMeta) => meta.stage.blend ?? (meta.stage.kind === 'mesh' ? 'cutout' : 'alpha')

/**
 * 한 물체를 여러 번 그릴 때의 패스. outline 은 외곽선 패스(stage.outline): SG_OUTLINE 블록의 sgVertex 로 항상 정점을 밀고
 * 불투명으로 그린다. occluded 는 가려진 부분 패스(stage.occluded): 본체와 같은 정점으로 알파 혼합한다
 */
export type StagePass = 'body' | 'outline' | 'occluded'

export function buildProgram(meta: SpecimenMeta, core: string, off: boolean, pass: StagePass = 'body'): ProgramSources {
  const kind = meta.stage.kind
  const body = stripComments(core)
  const passDefine = pass === 'outline' ? '#define SG_OUTLINE\n' : pass === 'occluded' ? '#define SG_OCCLUDED\n' : ''
  const defines = `${off ? '#define SG_OFF\n' : ''}${passDefine}`
  const common = `${COMPAT}${defines}${uniformDeclarations(meta)}\n${INPUT[kind]}\n`
  const clip = pass === 'outline' || (pass === 'body' && defaultBlend(meta) === 'cutout')
  const fragment = `${common}${body}\n${FRAGMENT_MAIN[kind](clip)}\n`
  if (kind === 'fullscreen') return { vertex: FULLSCREEN_VERTEX, fragment }
  const displace = pass === 'outline' || Boolean(meta.stage.vertex)
  const vertexHead = displace ? `#define SG_VERTEX_STAGE\n${common}uniform float uTime;\n${body}\n` : 'precision highp float;\n'
  return { vertex: `${vertexHead}${WORLD_VERTEX(displace)}\n`, fragment }
}

/** 무대의 바닥과 소품. URP Lit 대신 같은 값의 Lambert 로 그린다 */
export const LIT_VERTEX = `precision highp float;
in vec3 position;
in vec3 normal;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
out vec3 vPositionWS;
out vec3 vNormalWS;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vPositionWS = world.xyz;
  vNormalWS = mat3(modelMatrix) * normal;
  gl_Position = projectionMatrix * viewMatrix * world;
}`

export const LIT_FRAGMENT = `precision highp float;
in vec3 vPositionWS;
in vec3 vNormalWS;
uniform vec3 uAlbedo;
uniform vec3 uAlbedo2;
uniform float uTile;
uniform vec3 uLightDir;
uniform vec3 uLightColor;
uniform vec3 uAmbient;
uniform vec4 uShadowSpheres[3];
uniform int uShadowCount;
uniform sampler2D uShadowMask;
uniform mat4 uShadowMatrix;
uniform float uShadowMaskOn;
uniform float uShadowSoft;
out vec4 sgOut;
float sphereShadow(vec3 p, vec3 l, vec4 s) {
  vec3 toCenter = s.xyz - p;
  float along = dot(toCenter, l);
  if (along < 0.0) return 1.0;
  float miss = length(toCenter - l * along);
  float soft = 0.04 + 0.05 * along;
  return smoothstep(s.w - soft, s.w + soft, miss);
}
float maskShadow(vec3 p) {
  vec2 uv = (uShadowMatrix * vec4(p, 1.0)).xy * 0.5 + 0.5;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return 1.0;
  float covered = 0.0;
  for (int y = -2; y <= 2; y++) {
    for (int x = -2; x <= 2; x++) covered += texture(uShadowMask, uv + vec2(float(x), float(y)) * uShadowSoft).a;
  }
  return 1.0 - covered / 25.0;
}
void main() {
  vec3 albedo = uAlbedo;
  if (uTile > 0.0) {
    vec2 cell = floor(vPositionWS.xz / uTile);
    albedo = mod(cell.x + cell.y, 2.0) < 0.5 ? uAlbedo : uAlbedo2;
  }
  vec3 n = normalize(vNormalWS);
  float shadow = 1.0;
  for (int k = 0; k < uShadowCount; k++) shadow *= sphereShadow(vPositionWS, uLightDir, uShadowSpheres[k]);
  if (uShadowMaskOn > 0.5) shadow *= maskShadow(vPositionWS);
  sgOut = vec4(albedo * (uLightColor * max(dot(n, uLightDir), 0.0) * shadow + uAmbient), 1.0);
}`

/** 잘라 내기를 무시하고 물체 전체를 그림자 마스크에 그린다 ('효과 끄기'의 온전한 그림자) */
export const SHADOW_PLAIN_FRAGMENT = `precision highp float;
out vec4 sgOut;
void main() {
  sgOut = vec4(1.0);
}`

export const PRESENT_FRAGMENT = `precision highp float;
in vec2 vUv;
uniform sampler2D uSource;
out vec4 sgOut;
vec3 linearToSrgb(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}
void main() {
  sgOut = vec4(linearToSrgb(texture(uSource, vUv).rgb), 1.0);
}`

export const PRESENT_VERTEX = `precision highp float;\n${FULLSCREEN_VERTEX}`

/** 표본의 웹 셰이더를 새 컨텍스트에서 컴파일해 오류 로그를 돌려준다 (tools/check.mjs 가 사용) */
export function compileProgram(gl: WebGL2RenderingContext, sources: ProgramSources): string[] {
  const errors: string[] = []
  const compile = (type: number, source: string, label: string) => {
    const shader = gl.createShader(type)!
    gl.shaderSource(shader, `#version 300 es\n${source}`)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) errors.push(`${label}: ${gl.getShaderInfoLog(shader)}`)
    return shader
  }
  const vs = compile(gl.VERTEX_SHADER, sources.vertex, '정점')
  const fs = compile(gl.FRAGMENT_SHADER, sources.fragment, '프래그먼트')
  if (!errors.length) {
    const program = gl.createProgram()!
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) errors.push(`링크: ${gl.getProgramInfoLog(program)}`)
  }
  return errors
}

/** 전체 화면 무대의 법선 버퍼. 월드 법선을 그대로 쓴다 (URP 의 _CameraNormalsTexture 에 해당). 빈 곳은 0 */
export const NORMAL_FRAGMENT = `precision highp float;
in vec3 vPositionWS;
in vec3 vNormalWS;
out vec4 sgOut;
void main() {
  sgOut = vec4(normalize(vNormalWS), 1.0);
}`
