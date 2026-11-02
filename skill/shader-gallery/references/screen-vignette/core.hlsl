// 화면 비네트 효과 본체. Unity 래퍼와 웹 미리보기가 이 파일을 그대로 함께 쓴다.

// SG_STEP: 웹의 '단계 보기'가 중간 결과를 꺼내는 표시. Unity 에서는 아무 일도 하지 않는다.
#ifndef SG_STEP
#define SG_STEP(n, rgb)
#endif

// 저체력 맥동의 빠르기(Hz). 반복해서 넓은 면이 변하므로 1Hz 아래로 고정한다. 배속 2 에서도 2Hz 를 넘지 않는다.
#define VIGNETTE_PULSE_HZ 0.8

// 피격 펄스의 한도. 피격은 화면이 크게 바뀌는 순간이라 면적과 색을 함께 묶어 둔다.
// 반경은 최대 0.1 만 당기고, 이미 0.3 보다 좁은 반경(터널링, 저체력)은 더 당기지 않는다.
#define VIGNETTE_HIT_PULL 0.1
#define VIGNETTE_HIT_MIN_RADIUS 0.3
// 피격 색은 화면 모양 타원의 가장자리 띠(0.75 에서 시작해 1.15 에서 다 찬다)에만, 최대 85% 까지만 섞는다.
// 피격 색 기본값(#6d3d3d)은 선형 R - G - B 가 0.06 이라 WCAG 의 포화된 빨강 기준(0.0625 초과)에 들지 않는다.
// 저체력 색(#4d1414, 0.06)도 기준 아래라 둘을 섞은 가장자리도 기준을 넘지 않는다.
#define VIGNETTE_HIT_BAND 0.75
#define VIGNETTE_HIT_BAND_WIDTH 0.4
#define VIGNETTE_HIT_MAX 0.85

// 화면 중심에서의 거리. 위아래 가장자리가 1 이 되도록 2 를 곱한다.
// roundness 1 이면 가로에 화면비를 곱해 원이 되고, 0 이면 보정하지 않아 화면 모양을 따른 타원이 된다.
float vignetteDistance(float2 uv, float aspect, float roundness)
{
    float2 centered = (uv - float2(0.5, 0.5)) * 2.0;
    centered.x = centered.x * lerp(1.0, aspect, roundness);
    return length(centered);
}

float4 sgEffect(SgInput i)
{
    float3 scene = sgSource(i.uv).rgb;
    float low = saturate(_LowHealth);
    float hit = saturate(_HitPulse);

    // 1. 중심 거리: 화면비를 무시한 uv 거리. 화면이 가로로 길어서 같은 값의 줄이 가로로 늘어난 타원이다.
    float rawDistance = vignetteDistance(i.uv, i.aspect, 0.0);
    SG_STEP(1, float3(rawDistance, rawDistance, rawDistance) * 0.6);

    // 2. 화면비 보정: 가로에 화면비를 곱하면 같은 값의 줄이 원이 된다. 원형 비율로 둘 사이를 고른다.
    float d = vignetteDistance(i.uv, i.aspect, _Roundness);
    SG_STEP(2, float3(d, d, d) * 0.6);

    // 저체력은 반경을 조금 안쪽으로 당기고 느리게 숨 쉬듯 움직인다. 진폭을 작게 두어 번쩍임이 되지 않게 한다.
    // frac 으로 한 주기 안에 감싸 오래 켜 두어도 시간 값이 커져 떨리지 않게 한다.
    float breath = 0.5 + 0.5 * sin(frac(i.time * VIGNETTE_PULSE_HZ) * 6.2831853);
    float radius = _Radius - low * (0.12 + 0.05 * breath);
    // 피격은 반경을 조금만 당긴다. 하한 아래로는 당기지 않고, 원래 하한보다 좁으면 그대로 둔다.
    radius = min(radius, max(radius - hit * VIGNETTE_HIT_PULL, VIGNETTE_HIT_MIN_RADIUS));
    float strength = saturate(_Intensity + low * 0.15 + hit * 0.15);

    // 덮는 색: 기본 색에서 저체력 색으로 옮겨 간다.
    float3 tint = lerp(_VignetteColor.rgb, _LowHealthColor.rgb, low);
    // 피격 색 띠: 비네트 모양과 상관없이 1 단계의 화면 모양 타원 거리(1 이 네 변의 가운데)로 가장자리에만 둔다.
    // 반경이나 터널링 값이 어떻든 피격 색이 화면 가운데까지 넓게 덮이지 않는다.
    float hitMask = smoothstep(VIGNETTE_HIT_BAND, VIGNETTE_HIT_BAND + VIGNETTE_HIT_BAND_WIDTH, rawDistance) * hit * VIGNETTE_HIT_MAX;

#ifdef SG_OFF
    // 흔한 실수: smoothstep 없이 거리를 그대로 세기로 쓴다 (color *= 1 - 거리 와 같은 모양).
    // 가운데 말고는 화면 전체가 어두워지고 반경과 부드러움으로 가장자리를 정할 수 없다.
    float rawAmount = saturate(d) * strength;
    return float4(lerp(lerp(scene, tint, rawAmount), _HitColor.rgb, hitMask), 1.0);
#endif

    // 3. 부드러운 마스크: 반경 안은 0, 반경에서 부드러움 폭만큼 지나면 1. 세기를 곱해 얼마나 덮을지 정한다.
    float soft = max(_Softness, 0.001);
    float mask = smoothstep(radius, radius + soft, d) * strength;
    SG_STEP(3, float3(mask, mask, mask));

    // 최종: 장면 위에 마스크만큼 덮는 색을 덮고, 피격 중이면 그 위 가장자리 띠에 피격 색을 섞는다.
    float3 color = lerp(scene, tint, mask);
    return float4(lerp(color, _HitColor.rgb, hitMask), 1.0);
}
