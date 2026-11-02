// 깊이 기반 물가 거품 효과 본체. Unity 래퍼와 웹 미리보기가 이 파일을 그대로 함께 쓴다.

// SG_STEP: 웹의 '단계 보기'가 중간 결과를 꺼내는 표시. Unity 에서는 아무 일도 하지 않는다.
#ifndef SG_STEP
#define SG_STEP(n, rgb)
#endif

// 하늘빛. 깊이 무대에는 조명과 반사 입력이 없어 수면에 비치는 하늘을 고정 색으로 근사한다.
#define WATER_FOAM_SKY float3(0.3, 0.45, 0.62)
// 반짝임을 만드는 해의 방향 (표면에서 해 쪽). 카메라 맞은편 낮은 해라 물결 끝이 역광으로 반짝인다.
// 씬의 실제 광원과 상관없는 근사다. 광원을 따르게 하려면 래퍼에서 GetMainLight() 방향을 넘긴다.
#define WATER_FOAM_GLINT_DIR float3(-0.2, 0.2, 0.96)

// 2D 회전. 행렬을 쓰지 않는다
float2 waterFoamRotate(float2 p, float radians)
{
    float s = sin(radians);
    float c = cos(radians);
    return float2(p.x * c - p.y * s, p.x * s + p.y * c);
}

// 잔물결 높이. 같은 반복 노이즈 두 장을 크기, 각도, 흐르는 방향을 달리해 겹친다.
// 한 장만 흘리면 무늬가 통째로 미끄러질 뿐이지만, 두 장이 엇갈리면 겹친 모양이 계속 바뀌어 물결처럼 보인다.
// 둘째 장을 돌려 두는 까닭: 값 노이즈는 칸 경계에서 기울기가 0 이라, 두 장의 칸이 같은 방향으로 늘어서면 수면에 줄이 비친다.
// UV 에서 오프셋을 빼면 무늬는 오프셋 쪽으로 움직여 보인다.
float waterFoamRipple(float2 uv, float2 flowA, float2 flowB)
{
    float a = SG_TEX(_NoiseTex, uv * _RippleScale - flowA).r;
    float b = SG_TEX(_NoiseTex, waterFoamRotate(uv * (_RippleScale * 1.6), 0.6) + float2(0.37, 0.61) - flowB).r;
    return (a + b) * 0.5;
}

// 수면 색: 물빛에 프레넬로 하늘빛을 섞고 물결 끝의 반짝임을 더한다. a 는 반사가 덮는 정도(알파에 더한다).
float4 waterFoamSurface(float3 water, float3 n, float3 viewWS, float height)
{
    // 물결 높이로 밝기를 조금 흔든다. 정면에서 내려다볼 때 프레넬이 약해도 물결이 보이게 한다.
    float3 body = water * (0.8 + 0.4 * height);
    // 프레넬(Schlick 근사, 물의 정면 반사율 약 0.02). 수면을 비스듬히 볼수록 하늘이 더 비친다.
    float fresnel = 0.02 + 0.98 * pow(1.0 - saturate(dot(n, viewWS)), 5.0);
    // 반짝임: 시선을 기울어진 법선에 반사한 방향이 해 방향과 거의 같을 때만 밝다.
    float3 r = reflect(-viewWS, n);
    float glint = pow(saturate(dot(r, normalize(WATER_FOAM_GLINT_DIR))), 500.0) * 0.8;
    float3 color = lerp(body, WATER_FOAM_SKY, fresnel) + float3(glint, glint, glint);
    return float4(color, saturate(fresnel + glint));
}

float4 sgEffect(SgInput i)
{
    // 흐른 거리 = 시간 * 속도. 노이즈 주기가 1 이고 화면 전체에 같은 값이라 frac 으로 감싸도 결과가 같다.
    // 감싸 두면 오래 켜 둔 장면에서 UV 에 큰 수가 더해져 물결이 떨리는 일이 없다.
    float t = i.time * _FlowSpeed;
    // 첫 장은 주로 +u 쪽(기본 Plane 에서 −X, 화면 왼쪽)으로 흐른다. 둘째 장은 돌려 읽으므로 평면에서는
    // 주로 −u 쪽에 조금 −v 쪽(+X 에 조금 +Z, 화면 오른쪽 안)으로 흐른다.
    float2 flowA = frac(float2(0.15, 0.05) * t);
    float2 flowB = frac(float2(-0.07, -0.12) * t);

    // 잔물결 법선: 높이를 옆 칸과 비교한 기울기로 법선을 눕힌다. 한 칸 = 첫 장 텍스처의 한 텍셀.
    // 텍셀 크기를 텍스처에서 받으므로 다른 크기의 노이즈로 바꿔도 늘 한 텍셀 차이를 재고, 물결 세기가 텍스처 크기에 따라 바뀌지 않는다.
    float e = _NoiseTex_TexelSize.x / _RippleScale;
    float h = waterFoamRipple(i.uv, flowA, flowB);
    float hu = waterFoamRipple(i.uv + float2(e, 0.0), flowA, flowB);
    float hv = waterFoamRipple(i.uv + float2(0.0, e), flowA, flowB);
    // 기본 Plane 은 u 가 −X, v 가 −Z 로 커진다. 높이 y = h 인 면의 법선 (−dh/dx, 1, −dh/dz) 를 UV 로 바꾸면 (dh/du, 1, dh/dv) 다.
    // 누운 수면 전용 근사다. 세워 쓰는 메시라면 래퍼에서 접선을 넘겨 접선 공간으로 바꾼다.
    float2 slope = float2(hu - h, hv - h) * 10.0 * _RippleStrength;
    float3 n = normalize(i.normalWS + float3(slope.x, 0.0, slope.y));

    // 1. 깊이 차이: 수면 뒤 씬 표면까지의 거리를 깊이 범위로 나눠 0~1 로 만든다. 물체와 닿는 곳이 0 이다.
    // 수직 깊이가 아니라 카메라 정면 축으로 잰 눈 깊이의 차이라서, 같은 물도 비스듬히 볼수록 깊게 나온다.
    float depth01 = saturate(i.depthDelta / _DepthRange);
    SG_STEP(1, float3(depth01, depth01, depth01));

    // 2. 깊이 색: 얕은 곳은 얕은 색에 거의 투명하고, 깊을수록 깊은 색으로 덮는다.
    // 투명도를 깊이로 정해야 얕은 물에서 바닥이 비치고 깊은 물은 속이 가려진다.
    // 직선 그대로 쓰면 깊이 범위에 닿는 자리에서 기울기가 꺾여 수면에 접힌 듯한 띠가 보인다.
    // 1 - (1 - x)^2 로 끝을 눕혀 깊은 색에 부드럽게 닿게 한다.
    float deepT = 1.0 - (1.0 - depth01) * (1.0 - depth01);
    float3 water = lerp(_ShallowColor.rgb, _DeepColor.rgb, deepT);
    float alpha = lerp(0.15, 0.95, deepT);
    SG_STEP(2, water);

    // 3. 잔물결과 하늘빛: 흔들린 법선으로 프레넬과 반짝임을 구한다. 먼 쪽은 하늘빛이 비쳐 밝아진다.
    float4 surface = waterFoamSurface(water, n, i.viewWS, h);
    SG_STEP(3, surface.rgb);

#ifdef SG_OFF
    // 흔한 실수: 깊이를 읽지 못하면(URP Asset 의 Depth Texture 꺼짐) 모든 곳이 깊은 물로 계산된다.
    // 물속이 한 색으로 막히고, 상자와 공이 수면에서 칼로 자른 듯 끊기며 거품도 없다.
    float4 blocked = waterFoamSurface(_DeepColor.rgb, n, i.viewWS, h);
    return float4(blocked.rgb, saturate(0.92 + blocked.a));
#endif

    // 4. 거품 띠: 물체와 닿는 곳에서 거품 폭까지. 노이즈가 경계값보다 큰 곳만 거품이라 띠가 끊기고,
    // 닿는 곳에서 멀어질수록 경계값이 올라가 거품이 성글어진다.
    float foamNoise = SG_TEX(_NoiseTex, i.uv * (_RippleScale * 1.7) + float2(0.71, 0.13) - frac(float2(0.11, 0.04) * t)).r;
    // 일렁임: 띠 폭이 자리마다 다른 때에 거품 폭의 70~100% 사이로 늘었다 줄어든다 (한 번에 약 3.7초).
    // 물결 높이를 위상으로 써서 해안 전체가 한꺼번에 숨쉬지 않는다. 거품 폭을 넘지 않게 줄이는 쪽으로만 흔든다.
    float surge = 0.85 + 0.15 * sin(i.time * 1.7 + h * 6.2832);
    float edge = saturate(i.depthDelta / (_FoamWidth * surge));
    // 끊김 0 이면 고른 띠, 1 이면 노이즈가 그대로 띠를 쪼갠다.
    float pattern = lerp(0.6, foamNoise, _FoamBreakup);
    float foam = smoothstep(edge - 0.04, edge + 0.04, pattern);
    // 맞닿은 곳은 끊김과 상관없이 얇은 실선으로 남긴다. 물체 둘레가 물에 젖은 선처럼 이어진다.
    foam = max(foam, 1.0 - smoothstep(0.0, 0.12, edge));
    SG_STEP(4, float3(foam, foam, foam));

    // 최종: 수면 위에 거품을 덮는다. 거품은 불투명하고, 수면의 알파는 깊이와 반사가 정한다.
    float3 color = lerp(surface.rgb, _FoamColor.rgb, foam);
    alpha = saturate(alpha + surface.a);
    alpha = lerp(alpha, 1.0, foam);
    return float4(color, alpha);
}
