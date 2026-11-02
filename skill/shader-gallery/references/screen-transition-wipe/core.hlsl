// 화면 전환 효과 본체. Unity 래퍼와 웹 미리보기가 이 파일을 그대로 함께 쓴다.

// SG_STEP: 웹의 '단계 보기'가 중간 결과를 꺼내는 표시. Unity 에서는 아무 일도 하지 않는다.
#ifndef SG_STEP
#define SG_STEP(n, rgb)
#endif

// 화면 위치마다 '언제 덮이는가'를 0~1 로 정한다. 값이 작을수록 먼저 덮인다.
float transitionOrder(float2 uv, float aspect)
{
    // 원: 가장자리부터 가운데로 닫힌다. 화면비를 곱해야 타원이 되지 않는다.
    if (_Pattern > 0.5 && _Pattern < 1.5)
    {
        float2 centered = (uv - float2(0.5, 0.5)) * float2(aspect, 1.0);
        float corner = length(float2(aspect, 1.0)) * 0.5;
        return 1.0 - length(centered) / corner;
    }
    // 대각선: 왼쪽 아래에서 오른쪽 위로 쓸고 간다.
    if (_Pattern > 1.5)
    {
        return (uv.x + uv.y) * 0.5;
    }
    // 마름모 격자: 왼쪽부터 칸마다 차례로 마름모가 커진다.
    float2 grid = float2(uv.x * aspect, uv.y) * _Cells;
    float2 local = frac(grid) - float2(0.5, 0.5);
    float diamond = abs(local.x) + abs(local.y);
    return uv.x * 0.7 + diamond * 0.3;
}

float4 sgEffect(SgInput i)
{
    float3 scene = sgSource(i.uv).rgb;

#ifdef SG_OFF
    // 흔한 실수: 그냥 페이드하면 화면이 흐려지기만 해서 '장면이 넘어간다'는 신호가 약하다.
    return float4(lerp(scene, _CoverColor.rgb, _Progress), 1.0);
#endif

    // 1. 순서: 화면 위치별로 덮이는 차례. 어두운 곳이 먼저다.
    float order = transitionOrder(i.uv, i.aspect);
    SG_STEP(1, float3(order, order, order));

    // 2. 마스크: 진행값이 순서를 넘은 곳이 덮인다. 진행값 0 과 1 에서 정확히 비고 차도록 범위를 넓힌다.
    float soft = max(_Softness, 0.001);
    float front = lerp(-soft, 1.0 + soft, _Progress);
    float mask = smoothstep(order - soft, order + soft, front);
    SG_STEP(2, float3(mask, mask, mask));

    // 3. 경계: 덮이는 경계에만 빛 띠를 넣는다. mask 가 0.5 일 때 가장 밝다.
    float rim = mask * (1.0 - mask) * 4.0 * _RimGlow;
    SG_STEP(3, float3(rim, rim, rim));

    // 최종: 장면과 덮개를 마스크로 섞고 경계 빛을 더한다.
    float3 color = lerp(scene, _CoverColor.rgb, mask) + _RimColor.rgb * rim;
    return float4(color, 1.0);
}
