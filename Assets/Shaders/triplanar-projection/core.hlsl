// 삼평면 투영 효과 본체. Unity 래퍼(TriplanarProjection.shader)와 웹 미리보기가 이 파일을 그대로 함께 쓴다.

// SG_STEP: 웹의 '단계 보기'가 중간 결과를 꺼내는 표시. Unity 에서는 아무 일도 하지 않는다.
#ifndef SG_STEP
#define SG_STEP(n, rgb)
#endif

// 세 축 가중치. 법선이 가리키는 축일수록 크다.
// 거듭제곱으로 경계를 좁히고, 합이 1 이 되게 나눠야 섞인 자리가 밝아지거나 어두워지지 않는다.
float3 triplanarWeights(float3 n, float sharpness)
{
    float3 w = pow(abs(n), float3(sharpness, sharpness, sharpness));
    return w / max(w.x + w.y + w.z, 0.00001);
}

float4 sgEffect(SgInput i)
{
    // 투영 공간 고르기. 월드(0)는 물체가 움직여도 무늬가 제자리에 남고, 오브젝트(1)는 무늬가 물체에 붙는다.
    float useObject = step(0.5, _Space);
    float3 p = lerp(i.positionWS, i.positionOS, useObject) / _TileSize;
    float3 n = lerp(i.normalWS, i.normalOS, useObject);

    // 1. 가중치: X 축(옆을 보는 면)은 빨강, Y 축(위아래)은 초록, Z 축(앞뒤)은 파랑으로 본다.
    float3 w = triplanarWeights(n, _BlendSharpness);
    SG_STEP(1, w);

    // 세 평면에 텍스처를 한 번씩 투영한다. 각 축은 그 축과 수직인 두 좌표를 UV 로 쓴다.
    float3 texX = SG_TEX(_TileTex, p.zy).rgb;
    float3 texY = SG_TEX(_TileTex, p.xz).rgb;
    float3 texZ = SG_TEX(_TileTex, p.xy).rgb;

#ifdef SG_OFF
    // 흔한 실수: 위에서 한 번만 투영(평면 투영)하면 윗면은 멀쩡하지만 옆면은 같은 줄을 세로로 끌어 늘린다.
    return float4(texY * _Tint.rgb * i.lighting, 1.0);
#endif

    // 2. 한 축 투영: X 축 투영(zy 좌표)만 전체에 씌우면 옆을 보는 면은 멀쩡하지만,
    //    앞을 보는 면은 z 가 거의 변하지 않아 같은 줄이 가로로 길게 늘어난다.
    SG_STEP(2, texX);

    // 3. 섞기: 각 면에서 늘어나지 않는 투영의 비중이 커지므로 늘어난 부분이 가려진다.
    float3 albedo = (texX * w.x + texY * w.y + texZ * w.z) * _Tint.rgb;
    SG_STEP(3, albedo);

    // 최종: 조명을 곱한다. 텍스처는 색이므로 sRGB 로 읽어 선형 값으로 계산한다.
    float3 color = albedo * i.lighting;
    return float4(color, 1.0);
}
