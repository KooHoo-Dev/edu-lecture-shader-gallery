// 디졸브 효과 본체. Unity 래퍼(Dissolve.shader)와 웹 미리보기가 이 파일을 그대로 함께 쓴다.
// 규칙: docs/specimen-guide.md 의 "공통 문법". 숫자는 소수점까지 쓰고, 벡터는 float3(a, b, c) 처럼 만든다.

// SG_STEP: 웹의 '단계 보기'가 중간 결과를 꺼내는 표시. Unity 에서는 아무 일도 하지 않는다.
#ifndef SG_STEP
#define SG_STEP(n, rgb)
#endif

// 격자 칸마다 고정된 난수. 같은 칸은 항상 같은 값이 나온다.
float dissolveHash(float3 p)
{
    p = frac(p * 0.1031);
    p = p + dot(p, p.zyx + 31.32);
    return frac((p.x + p.y) * p.z);
}

// 3D 값 노이즈. UV 대신 오브젝트 공간 위치를 쓰면 메시 UV 이음매에서 끊기지 않는다.
float dissolveValueNoise(float3 p)
{
    float3 cell = floor(p);
    float3 f = frac(p);
    f = f * f * (3.0 - 2.0 * f);
    float x00 = lerp(dissolveHash(cell + float3(0.0, 0.0, 0.0)), dissolveHash(cell + float3(1.0, 0.0, 0.0)), f.x);
    float x10 = lerp(dissolveHash(cell + float3(0.0, 1.0, 0.0)), dissolveHash(cell + float3(1.0, 1.0, 0.0)), f.x);
    float x01 = lerp(dissolveHash(cell + float3(0.0, 0.0, 1.0)), dissolveHash(cell + float3(1.0, 0.0, 1.0)), f.x);
    float x11 = lerp(dissolveHash(cell + float3(0.0, 1.0, 1.0)), dissolveHash(cell + float3(1.0, 1.0, 1.0)), f.x);
    return lerp(lerp(x00, x10, f.y), lerp(x01, x11, f.y), f.z);
}

// 큰 덩어리와 잔 무늬를 섞어 불에 타는 듯한 경계를 만든다.
float dissolveNoise(float3 p)
{
    float n = dissolveValueNoise(p) * 0.6;
    n = n + dissolveValueNoise(p * 2.03 + float3(11.7, 3.1, 7.9)) * 0.28;
    n = n + dissolveValueNoise(p * 4.01 + float3(5.3, 17.2, 2.4)) * 0.12;
    return n;
}

float4 sgEffect(SgInput i)
{
    float3 lit = _BaseColor.rgb * i.lighting;

    // 1. 노이즈: 표면 위치마다 0~1 값을 하나 정한다.
    float noise = dissolveNoise(i.positionOS * _NoiseScale);
    SG_STEP(1, float3(noise, noise, noise));

    // 2. 임계값: 노이즈가 임계값보다 작으면 사라질 자리다.
    float keep = step(_Threshold, noise);
    SG_STEP(2, float3(keep, keep, keep));

#ifdef SG_OFF
    // 흔한 실수: 잘라 내기만 하면 구멍만 뚫리고 '타는' 느낌이 없다.
    return float4(lit, keep);
#endif

    // 3. 가장자리: 임계값 바로 위 좁은 띠만 1 이 된다.
    float edge = (1.0 - smoothstep(_Threshold, _Threshold + _EdgeWidth, noise)) * keep;
    SG_STEP(3, float3(edge, edge, edge));

    // 4. 최종: 띠에 자체 발광 색을 더한다. 조명과 무관해 그림자 쪽에서도 빛난다.
    float3 glow = _EdgeColor.rgb * _EdgeGlow * edge;
    return float4(lit + glow, keep);
}
