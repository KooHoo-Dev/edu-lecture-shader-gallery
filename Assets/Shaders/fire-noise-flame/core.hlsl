// 노이즈 불꽃 효과 본체. Unity 래퍼와 웹 미리보기가 이 파일을 그대로 함께 쓴다.
// 흐르는 노이즈 두 층, 모양 마스크, 깎기, 색 그라데이션 네 가지로 가장 기본이 되는 불을 만든다.

// SG_STEP: 웹의 '단계 보기'가 중간 결과를 꺼내는 표시. Unity 에서는 아무 일도 하지 않는다.
#ifndef SG_STEP
#define SG_STEP(n, rgb)
#endif

// 깎는 기준값. 마스크와 노이즈를 합친 값이 이보다 크면 불, 작으면 빈 곳이다.
#define FIRE_FLAME_CUT 0.5

float4 sgEffect(SgInput i)
{
    float2 uv = i.uv;
    // 흐른 거리 = 시간 * 속도. 실행 중에 속도를 바꾸면 그동안 흐른 시간 전체에 변화량이 곱해져 무늬가 한 번에 튄다.
    float t = i.time * _FlowSpeed;

    // 1. 노이즈 한 층: UV 에서 시간을 빼면 무늬가 위(+v)로 흘러 보인다.
    // 흐름 오프셋은 frac 으로 0~1 에 감싼다. 텍스처 주기가 1 이라 결과는 같고, 오래 켜 두어도 UV 에 큰 수가 붙지 않아 떨리지 않는다.
    // 텍스처 자체가 세로로 긴 결이라 UV 에 크기만 곱하면 위로 뻗은 불길 무늬가 된다.
    float2 noiseUV = uv * _NoiseScale;
    float2 uvA = noiseUV + float2(0.0, frac(-t * 0.6));
    float layerA = SG_TEX(_NoiseTex, uvA).r;
    SG_STEP(1, float3(layerA, layerA, layerA));

    // 2. 두 층 곱하기: 같은 텍스처를 두 배 잘게, 두 배쯤 빠르게 한 번 더 읽어 곱한다.
    // 두 무늬의 밝은 곳이 겹치는 자리만 남고, 속도가 달라 겹치는 자리가 계속 바뀌어 일렁인다.
    // 0.5 근처 값끼리 곱하면 0.25 근처로 어두워지므로 2 를 곱해 평균 밝기를 되돌린다.
    float2 uvB = noiseUV * 2.0 + float2(0.37, frac(-t * 1.3));
    float layerB = SG_TEX(_NoiseTex, uvB).r;
    float noise = layerA * layerB * 2.0;
    SG_STEP(2, float3(noise, noise, noise));

    // 3. 모양 마스크: UV 로 만든 부드러운 불꽃 모양. 아래는 넓고 위로 갈수록 좁아지다 불꽃 높이에서 0 이 된다.
    // 너울: 크고 느린 노이즈로 가로 위치를 민다. 높이를 곱해 뿌리는 제자리에 두고 위쪽만 좌우로 흔든다.
    float h = saturate(uv.y / _FlameHeight);
    float sway = SG_TEX(_NoiseTex, uv * 0.5 + float2(0.21, frac(-t * 0.25))).r - 0.5;
    float x = uv.x - 0.5 + sway * _Wobble * h;
    // 높이마다 불꽃 반폭. 위로 갈수록 좁아져 불꽃 높이에서 뿌리의 0.2 배가 된다.
    // 끝을 뾰족하게 지우는 일은 아래 (1 - h * h) 가 맡는다. 0 으로 나누지 않게 아주 작은 값을 남긴다.
    float halfWidth = max(_FlameWidth * (1.0 - h * 0.8), 0.001);
    float side = saturate(abs(x) / halfWidth);
    // 가운데가 가장 진하고 옆과 위로 갈수록 옅어진다. 아래 끝도 살짝 흐려 사각형 밑변이 보이지 않게 한다.
    float mask = (1.0 - side * side) * (1.0 - h * h) * smoothstep(0.0, 0.15, uv.y);
    SG_STEP(3, float3(mask, mask, mask));

#ifdef SG_OFF
    // 흔한 실수: 모양 마스크 없이 노이즈만 깎으면 사각형 판 전체가 타올라 Quad 의 네 변이 그대로 드러난다.
    mask = 1.0;
#endif

    // 4. 깎기: 마스크에 노이즈를 곱한 값을 기준값에서 smoothstep 으로 깎는다.
    // 마스크가 진한 아래 가운데는 노이즈가 어두워도 남고, 옅은 가장자리와 위쪽은 노이즈가 밝은 곳만 남아 혀처럼 갈라진다.
    // 노이즈에 0.3 을 더해 노이즈가 어두운 곳에서도 불의 속이 뚫리지 않게 한다.
    // 2.5 는 기본값에서 불길이 Quad 높이의 3분의 2 남짓까지 오르고 그 위로 조각이 가끔 떨어져 나가게 맞춘 배율이다.
    float fire = mask * (noise + 0.3) * 2.5;
    float flame = smoothstep(FIRE_FLAME_CUT - _EdgeSoftness, FIRE_FLAME_CUT + _EdgeSoftness, fire);
    SG_STEP(4, float3(flame, flame, flame));

    // 최종: 기준값을 넘은 정도(heat)로 색을 고른다. 가장자리는 빨강, 가운데는 주황, 속은 밝은 노랑.
    float heat = saturate((fire - FIRE_FLAME_CUT) / 2.0);
    float3 color = lerp(_EdgeColor.rgb, _MidColor.rgb, smoothstep(0.0, 0.3, heat));
    color = lerp(color, _CoreColor.rgb, smoothstep(0.5, 1.0, heat));
    // 세기는 1 을 넘는 HDR 배율. Bloom 이 있으면 번지므로 세기를 낮춘다.
    // 더하기 혼합이라 알파는 가리는 정도가 아니라 더할 양이다. 깎여 나간 곳은 아무것도 더하지 않는다.
    return float4(color * _Intensity, flame);
}
