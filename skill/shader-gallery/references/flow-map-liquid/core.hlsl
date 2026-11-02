// 플로 맵 액체 효과 본체. Unity 래퍼(FlowMapLiquid.shader)와 웹 미리보기가 이 파일을 그대로 함께 쓴다.

// SG_STEP: 웹의 '단계 보기'가 중간 결과를 꺼내는 표시. Unity 에서는 아무 일도 하지 않는다.
#ifndef SG_STEP
#define SG_STEP(n, rgb)
#endif

// 위상 하나로 무늬를 읽는다. 위상이 0 에서 1 로 가는 동안 읽는 자리를 흐름 반대쪽으로 옮기므로
// 무늬는 흐름 방향으로 밀려 간다. 흐름이 자리마다 달라 오래 밀수록 무늬가 늘어나고 찢어진다.
// 흐름은 표면 UV 단위라 무늬 크기를 바꿔도 흐르는 거리는 같다.
float flowPattern(float2 uv, float2 flow, float phase)
{
    float2 p = (uv - flow * phase) * _PatternScale;
    return SG_TEX(_PatternTex, p).r;
}

// 삼각파 가중치. 위상 0 과 1 에서 0, 0.5 에서 1 이다.
// 무늬가 처음 자리로 튀는 순간(위상 1 -> 0)에 그 층의 가중치가 0 이라 튀는 모습이 보이지 않는다.
float flowWeight(float phase)
{
    return 1.0 - abs(1.0 - 2.0 * phase);
}

float4 sgEffect(SgInput i)
{
    // 1. 플로 맵: RG 에 UV 공간 흐름 방향이 0~1 로 들어 있다. 0.5 가 멈춤이라 2 를 곱하고 1 을 빼서 -1~1 로 되돌린다.
    //    데이터 텍스처라 sRGB 를 끄고 읽어야 0.5 가 그대로 0.5 로 들어온다.
    //    B 에는 위상 노이즈가 들어 있다. 같은 읽기로 함께 가져온다.
    float3 flowTexel = SG_TEX(_FlowTex, i.uv).rgb;
    float2 raw = flowTexel.xy;
    SG_STEP(1, float3(raw.x, raw.y, 0.0));
    float2 flow = (raw * 2.0 - 1.0) * _FlowStrength;
    float t = i.time * _Speed;

#ifdef SG_OFF
    // 흔한 실수: 위상 frac(t) 하나만 쓴다. 무늬가 한 주기 동안 늘어나다가 위상이 0 으로 돌아가는 순간
    // 표면 전체가 한꺼번에 원래 무늬로 튄다. 노이즈도 없어 모든 자리가 같은 순간에 튄다.
    float patOff = flowPattern(i.uv, flow, frac(t));
    float3 albedoOff = lerp(_DeepColor.rgb, _BrightColor.rgb, patOff);
    return float4(albedoOff * i.lighting + _BrightColor.rgb * (patOff * patOff) * _Glow, 1.0);
#endif

    // 위상 노이즈: 자리마다 위상을 다르게 시작해 튀는(가중치가 바뀌는) 순간이 표면 전체에 몰리지 않게 한다.
    // 플로 맵 B 에 0~1 로 넓혀 담아 두었다. 텍스처라 0~1 에서 반복하므로 평면을 이어 깔아도 경계에서 위상이 맞고,
    // 셰이더가 노이즈를 계산하지 않아 가볍다.
    float n = flowTexel.z * _PhaseNoise;
    float phaseA = frac(t + n);
    // 두 번째 층은 반 주기 어긋난다. 한 층이 튀는 순간 다른 층은 한가운데(가중치 1)에 있다.
    float phaseB = frac(t + n + 0.5);

    // 2. 위상 하나: 첫 번째 층만 본다. 무늬가 흐름을 따라 늘어나다 어느 순간 원래 모양으로 튄다.
    float patA = flowPattern(i.uv, flow, phaseA);
    SG_STEP(2, float3(patA, patA, patA));

    // 3. 두 위상 섞기: 삼각파 가중치로 섞는다. 두 가중치는 합이 항상 1 이다.
    float patB = flowPattern(i.uv, flow, phaseB);
    float wA = flowWeight(phaseA);
    float pat = patA * wA + patB * (1.0 - wA);
    SG_STEP(3, float3(pat, pat, pat));

    // 최종: 무늬 밝기로 두 색을 섞고 조명을 곱한다. 밝은 부분은 발광을 더해 용암처럼 스스로 빛나게 한다.
    float3 albedo = lerp(_DeepColor.rgb, _BrightColor.rgb, pat);
    float3 color = albedo * i.lighting + _BrightColor.rgb * (pat * pat) * _Glow;
    return float4(color, 1.0);
}
