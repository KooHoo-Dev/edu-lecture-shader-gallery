// 역장 교차 효과 본체. Unity 래퍼와 웹 미리보기가 이 파일을 그대로 함께 쓴다.

// SG_STEP: 웹의 '단계 보기'가 중간 결과를 꺼내는 표시. Unity 에서는 아무 일도 하지 않는다.
#ifndef SG_STEP
#define SG_STEP(n, rgb)
#endif

// 자이로이드 곡면. 삼각함수 세 쌍만으로 끊김 없는 입체 무늬가 나온다. 값이 0 에 가까운 곳이 무늬의 선이다.
float forceFieldLines(float3 p, float time)
{
    float3 q = p + float3(0.0, time * 0.35, 0.0);
    float g = sin(q.x) * cos(q.y) + sin(q.y) * cos(q.z) + sin(q.z) * cos(q.x);
    return 1.0 - smoothstep(0.0, 0.16, abs(g));
}

float4 sgEffect(SgInput i)
{
    // 1. 프레넬: 표면이 시선과 비스듬할수록 밝다. 구의 윤곽이 드러난다.
    float fresnel = pow(1.0 - saturate(dot(i.normalWS, i.viewWS)), _FresnelPower);
    SG_STEP(1, float3(fresnel, fresnel, fresnel));

    // 2. 무늬: 에너지 막의 결. 시간에 따라 위로 흐른다.
    float lines = forceFieldLines(i.positionOS * _PatternScale, i.time) * _PatternStrength;
    SG_STEP(2, float3(lines, lines, lines));

#ifdef SG_OFF
    // 흔한 실수: 깊이를 읽지 않으면 바닥과 물체를 뚫고 나간 자리가 칼로 자른 듯 끊긴다.
    float plain = fresnel + lines;
    return float4(_FieldColor.rgb, saturate(plain));
#endif

    // 3. 교차선: 씬 표면까지의 거리가 가까울수록 1 이다. 다른 물체에 닿은 자리가 밝아진다.
    float contact = 1.0 - saturate(i.depthDelta / _ContactWidth);
    contact = contact * contact;
    SG_STEP(3, float3(contact, contact, contact));

    // 4. 맥동: 충돌 지점에서 고리가 퍼진다. 값은 C# 이 1 에서 0 으로 내린다.
    float radius = (1.0 - _HitPulse) * 1.1;
    float ring = (1.0 - smoothstep(0.0, 0.09, abs(length(i.positionOS - float3(0.3, 0.3, 0.0)) - radius))) * _HitPulse;
    SG_STEP(4, float3(ring, ring, ring));

    // 최종: 세 값을 더해 밝기로 쓴다. 더하기 혼합이라 알파가 곧 밝기다.
    float energy = fresnel + lines + contact * _ContactGlow + ring * 2.0;
    float3 color = _FieldColor.rgb * (1.0 + energy);
    return float4(color, saturate(energy));
}
