import type { SpecimenMeta, StageKind } from '../core/types'

/* core.hlsl 을 WebGL2 로 컴파일할 수 있게 앞뒤를 붙인다. 호환 매크로와 무대별 입력(SgInput)을 앱이 제공하므로
 * 표본은 웹 전용 코드가 없다. 무대별 입력 필드는 docs/specimen-guide.md 의 표와 .shader 래퍼에 있는 것과 같다. */

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
uniform int _SgStep;
#define SG_STEP(n, rgb) if (_SgStep == (n)) { return float4((rgb), 1.0); }
`

const INPUT: Record<StageKind, string> = {
  mesh: `struct SgInput { float2 uv; float3 positionOS; float3 normalWS; float3 viewWS; float3 lightDirWS; float3 lightColor; float3 lighting; float time; };`,
  sprite: `struct SgInput { float2 uv; float4 color; float2 texelSize; float time; };`,
  depth: `uniform sampler2D _SgSceneDepth;
uniform sampler2D _SgSceneColor;
float4 sgSceneColor(float2 uv) { return texture(_SgSceneColor, uv); }
struct SgInput { float2 uv; float3 positionOS; float3 normalWS; float3 viewWS; float2 screenUV; float depthDelta; float time; };`,
  fullscreen: `uniform sampler2D _SgSource;
float4 sgSource(float2 uv) { return texture(_SgSource, uv); }
struct SgInput { float2 uv; float aspect; float time; };`,
}

const FRAGMENT_MAIN: Record<StageKind, (cutout: boolean) => string> = {
  mesh: cutout => `in vec2 vUv;
in vec3 vPositionOS;
in vec3 vPositionWS;
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
  i.positionOS = vPositionOS;
  i.normalWS = normalize(vNormalWS);
  i.viewWS = normalize(cameraPosition - vPositionWS);
  i.lightDirWS = uLightDir;
  i.lightColor = uLightColor;
  i.lighting = uLightColor * saturate(dot(i.normalWS, uLightDir)) + uAmbient;
  i.time = uTime;
  vec4 c = sgEffect(i);
  ${cutout ? 'if (c.a < 0.5) discard;\n  sgOut = vec4(c.rgb, 1.0);' : 'sgOut = c;'}
}`,
  sprite: () => `in vec2 vUv;
uniform vec4 uSpriteColor;
uniform float uTime;
out vec4 sgOut;
void main() {
  SgInput i;
  i.uv = vUv;
  i.color = uSpriteColor;
  i.texelSize = _MainTex_TexelSize.xy;
  i.time = uTime;
  sgOut = sgEffect(i);
}`,
  depth: () => `in vec2 vUv;
in vec3 vPositionOS;
in vec3 vPositionWS;
in vec3 vNormalWS;
in float vEyeDepth;
uniform vec3 cameraPosition;
uniform vec2 uViewport;
uniform vec2 uNearFar;
uniform float uTime;
out vec4 sgOut;
float sgLinearEye(float raw) {
  float z = raw * 2.0 - 1.0;
  return 2.0 * uNearFar.x * uNearFar.y / (uNearFar.y + uNearFar.x - z * (uNearFar.y - uNearFar.x));
}
void main() {
  SgInput i;
  i.uv = vUv;
  i.positionOS = vPositionOS;
  i.normalWS = normalize(vNormalWS);
  i.viewWS = normalize(cameraPosition - vPositionWS);
  i.screenUV = gl_FragCoord.xy / uViewport;
  i.depthDelta = sgLinearEye(texture(_SgSceneDepth, i.screenUV).r) - vEyeDepth;
  i.time = uTime;
  sgOut = sgEffect(i);
}`,
  fullscreen: () => `in vec2 vUv;
uniform float uAspect;
uniform float uTime;
out vec4 sgOut;
void main() {
  SgInput i;
  i.uv = vUv;
  i.aspect = uAspect;
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
out vec3 vNormalWS;
out float vEyeDepth;
void main() {
  vec3 p = ${displace ? 'sgVertex(position, normal, uv, uTime)' : 'position'};
  vec4 world = modelMatrix * vec4(p, 1.0);
  vec4 view = viewMatrix * world;
  vUv = uv;
  vPositionOS = p;
  vPositionWS = world.xyz;
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
  for (const name of textureNames(meta)) lines.push(`uniform sampler2D ${name};`, `uniform vec4 ${name}_TexelSize;`)
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

export function buildProgram(meta: SpecimenMeta, core: string, off: boolean): ProgramSources {
  const kind = meta.stage.kind
  const body = stripComments(core)
  const common = `${COMPAT}${off ? '#define SG_OFF\n' : ''}${uniformDeclarations(meta)}\n${INPUT[kind]}\n`
  const fragment = `${common}${body}\n${FRAGMENT_MAIN[kind](defaultBlend(meta) === 'cutout')}\n`
  if (kind === 'fullscreen') return { vertex: FULLSCREEN_VERTEX, fragment }
  const displace = Boolean(meta.stage.vertex)
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
out vec4 sgOut;
float sphereShadow(vec3 p, vec3 l, vec4 s) {
  vec3 toCenter = s.xyz - p;
  float along = dot(toCenter, l);
  if (along < 0.0) return 1.0;
  float miss = length(toCenter - l * along);
  float soft = 0.04 + 0.05 * along;
  return smoothstep(s.w - soft, s.w + soft, miss);
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
  sgOut = vec4(albedo * (uLightColor * max(dot(n, uLightDir), 0.0) * shadow + uAmbient), 1.0);
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
