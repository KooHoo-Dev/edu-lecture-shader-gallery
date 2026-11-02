// 타일 스크롤 패럴랙스 효과 본체. Unity 래퍼와 웹 미리보기가 이 파일을 그대로 함께 쓴다.

// SG_STEP: 웹의 '단계 보기'가 중간 결과를 꺼내는 표시. Unity 에서는 아무 일도 하지 않는다.
#ifndef SG_STEP
#define SG_STEP(n, rgb)
#endif

float4 sgEffect(SgInput i)
{
    // 1. 원래 UV: 스프라이트 왼쪽 아래가 (0, 0), 오른쪽 위가 (1, 1) 이다.
    // 가로만 반복 횟수를 곱한다. 스프라이트를 가로로 늘린 만큼 올리면 그림이 납작해지지 않는다.
    float2 uv = float2(i.uv.x * _Tiling, i.uv.y);
    SG_STEP(1, float3(i.uv.x, i.uv.y, 0.0));

    // 2. 오프셋: C# 이 넘긴 카메라 위치와 자동 흐름을 더해 '가상 카메라 위치'를 만들고 층 계수를 곱한다.
    // 계수가 작을수록 덜 움직여 멀어 보인다. 단위는 텍스처 한 장의 폭이다.
    float offset = (_ScrollOffset + i.time * _ScrollSpeed) * _LayerFactor;
    // 더하기라서 오프셋이 커지면 그림은 왼쪽으로 흐른다. 카메라가 오른쪽으로 가는 것과 같다.
    float scrolledX = uv.x + offset;
    // frac 은 보여 주기만 한다. 실제 샘플링은 frac 없이 Wrap Mode Repeat 에 맡긴다.
    // 셰이더에서 frac 을 하면 이음매에서 UV 미분이 튀어 밉맵이 있을 때 세로 줄이 생긴다.
    SG_STEP(2, float3(frac(scrolledX), i.uv.y, 0.0));

    // 세로는 반복하지 않는다. 위 끝(투명)과 아래 끝(땅)이 필터링으로 섞이지 않게 반 텍셀 안쪽에 묶는다.
    float halfTexelY = 0.5 * i.texelSize.y;
    float v = clamp(uv.y, halfTexelY, 1.0 - halfTexelY);

#ifdef SG_OFF
    // 흔한 실수: 텍스처 Wrap Mode 가 Clamp 이면 0~1 밖에서 끝 열만 계속 읽는다.
    // 처음엔 멀쩡하다가 스크롤할수록 끝 픽셀이 가로 줄무늬로 길게 늘어난다.
    float halfTexelX = 0.5 * i.texelSize.x;
    float4 clamped = SG_TEX(_MainTex, float2(clamp(scrolledX, halfTexelX, 1.0 - halfTexelX), v)) * i.color;
    float3 clampedRgb = lerp(clamped.rgb, _HazeColor.rgb, _Haze);
    return float4(clampedRgb, clamped.a);
#endif

    float4 tex = SG_TEX(_MainTex, float2(scrolledX, v)) * i.color;

    // 최종: 먼 층은 공기 색에 묻혀 흐려 보이게 섞는다. 계수와 함께 쓰면 거리감이 커진다.
    float3 rgb = lerp(tex.rgb, _HazeColor.rgb, _Haze);
    SG_STEP(3, rgb * tex.a);
    return float4(rgb, tex.a);
}
