// 스프라이트 외곽선 + 피격 번쩍임 효과 본체. Unity 래퍼와 웹 미리보기가 이 파일을 그대로 함께 쓴다.

// SG_STEP: 웹의 '단계 보기'가 중간 결과를 꺼내는 표시. Unity 에서는 아무 일도 하지 않는다.
#ifndef SG_STEP
#define SG_STEP(n, rgb)
#endif

// 주변 8방향의 알파 중 가장 큰 값. 근처에 그림이 있으면 1 에 가까워진다.
float outlineNeighborAlpha(float2 uv, float2 offset)
{
    float diagonal = 0.7071;
    float a = SG_TEX(_MainTex, uv + offset * float2(1.0, 0.0)).a;
    a = max(a, SG_TEX(_MainTex, uv + offset * float2(-1.0, 0.0)).a);
    a = max(a, SG_TEX(_MainTex, uv + offset * float2(0.0, 1.0)).a);
    a = max(a, SG_TEX(_MainTex, uv + offset * float2(0.0, -1.0)).a);
    a = max(a, SG_TEX(_MainTex, uv + offset * float2(diagonal, diagonal)).a);
    a = max(a, SG_TEX(_MainTex, uv + offset * float2(-diagonal, diagonal)).a);
    a = max(a, SG_TEX(_MainTex, uv + offset * float2(diagonal, -diagonal)).a);
    a = max(a, SG_TEX(_MainTex, uv + offset * float2(-diagonal, -diagonal)).a);
    return a;
}

float4 sgEffect(SgInput i)
{
    // 1. 원본: 스프라이트 색에 SpriteRenderer 의 Color 를 곱한다.
    float4 tex = SG_TEX(_MainTex, i.uv);
    float4 base = tex * i.color;
    SG_STEP(1, base.rgb * base.a);

#ifdef SG_OFF
    // 흔한 실수: SpriteRenderer.color 처럼 색을 곱하면 원본보다 밝아지지 않아 번쩍이지 않는다.
    float3 tinted = base.rgb * lerp(float3(1.0, 1.0, 1.0), _FlashColor.rgb, _HitFlash);
    return float4(tinted, base.a);
#endif

    // 2. 외곽선: 주변에 그림이 있는데 자기 자리는 비어 있는 픽셀만 남는다.
    float neighbor = outlineNeighborAlpha(i.uv, i.texelSize * _OutlineWidth);
    float outline = saturate(neighbor - tex.a) * step(0.01, _OutlineWidth);
    SG_STEP(2, float3(outline, outline, outline));

    // 3. 번쩍임: 곱하기가 아니라 번쩍임 색으로 보간해야 어두운 스프라이트도 하얗게 된다.
    float3 flashed = lerp(base.rgb, _FlashColor.rgb, _HitFlash);
    SG_STEP(3, flashed * base.a);

    // 최종: 외곽선을 스프라이트 뒤에 깔고 합친다.
    float outlineAlpha = outline * _OutlineColor.a * i.color.a;
    float alpha = base.a + outlineAlpha * (1.0 - base.a);
    // 스프라이트 자체가 반투명이어도(Color 의 알파) 안쪽에 외곽선 색이 섞이지 않게 비율로 나눈다.
    float3 rgb = lerp(_OutlineColor.rgb, flashed, base.a / max(alpha, 0.0001));
    return float4(rgb, alpha);
}
