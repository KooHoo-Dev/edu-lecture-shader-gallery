// 프레넬 림 빛 효과 본체. Unity 래퍼(FresnelRimGlow.shader)와 웹 미리보기가 이 파일을 그대로 함께 쓴다.

// SG_STEP: 웹의 '단계 보기'가 중간 결과를 꺼내는 표시. Unity 에서는 아무 일도 하지 않는다.
#ifndef SG_STEP
#define SG_STEP(n, rgb)
#endif

// 효과 끄기에서 재현하는 실수용. 무대 카메라에서 물체까지 거리(약 3.6m)를 정규화하지 않은 시선 벡터의 길이로 쓴다.
#define FRESNEL_RAW_VIEW_LENGTH 3.6

float4 sgEffect(SgInput i)
{
    float3 lit = _BaseColor.rgb * i.lighting;

    // 피격 번쩍임: 지수를 1 아래로 낮춰 림을 몸 안쪽까지 넓히고, 세기를 올리고, 색을 번쩍임 색으로 바꾼다.
    float flash = saturate(_HitFlash);
    float power = lerp(_RimPower, 0.6, flash);
    float strength = _RimIntensity + flash * 4.0;
    float3 rimColor = lerp(_RimColor.rgb, _FlashColor.rgb, flash);

    // 1. 법선과 시선의 내적: 정면으로 보이는 곳은 1, 윤곽으로 갈수록 0 이다. 두 벡터가 모두 단위 길이여야 이 뜻이 된다.
    float facing = saturate(dot(i.normalWS, i.viewWS));
    SG_STEP(1, float3(facing, facing, facing));

    // 2. 뒤집기: 윤곽이 1, 정면이 0 이 된다. 이 값이 그대로 림의 재료다.
    float edge = 1.0 - facing;
    SG_STEP(2, float3(edge, edge, edge));

#ifdef SG_OFF
    // 흔한 실수: 카메라 위치 - 표면 위치를 정규화하지 않고 쓴다. 길이가 수 미터라 내적이 거의 다 1 을 넘어 잘리고, 림이 윤곽의 가는 선으로 줄어든다.
    float3 rawView = i.viewWS * FRESNEL_RAW_VIEW_LENGTH;
    float badRim = pow(max(1.0 - saturate(dot(i.normalWS, rawView)), 0.0001), power);
    return float4(lit + rimColor * (strength * badRim), 1.0);
#endif

    // 3. 지수로 좁히기: 0~1 값을 거듭제곱하면 1 근처만 남는다. 지수가 클수록 림이 얇아진다.
    //    max 는 0 의 거듭제곱을 피한다.
    float rim = pow(max(edge, 0.0001), power);
    SG_STEP(3, float3(rim, rim, rim));

    // 최종: 조명을 받은 표면에 림을 더한다. 조명과 곱하지 않으므로 그늘 쪽 윤곽에서도 림이 남는다.
    float3 color = lit + rimColor * (strength * rim);
    return float4(color, 1.0);
}
