// 가려진 실루엣 효과 본체. Unity 래퍼(XrayOccludedSilhouette.shader)와 웹 미리보기가 이 파일을 그대로 함께 쓴다.
// 한 물체를 두 번 그린다. SG_OCCLUDED 블록은 벽 뒤에 가려진 부분만 덧그리는 실루엣 패스(ZTest Greater), #else 블록은 본체다.
// 래퍼는 실루엣 패스에서만 이 파일 앞에 SG_OCCLUDED 를 정의한다.
// 어느 픽셀이 '가려졌는지'는 이 파일이 아니라 래퍼의 렌더 상태(ZTest Greater)가 정한다. 여기서는 그 픽셀의 색과 알파만 정한다.

// SG_STEP: 웹의 '단계 보기'가 중간 결과를 꺼내는 표시. Unity 에서는 아무 일도 하지 않는다.
#ifndef SG_STEP
#define SG_STEP(n, rgb)
#endif

// 본체 색. 디졸브처럼 기본 색에 조명을 곱한 평범한 음영이다. 단계 보기에서 본체는 모든 단계에 이 색을 보여 준다.
float3 xrayBodyColor(SgInput i)
{
    return _BaseColor.rgb * i.lighting;
}

#ifdef SG_OCCLUDED

// ── 실루엣 패스: 벽에 가려진 픽셀만 들어온다 ──

// 프레넬 테두리. 표면이 시선과 나란할수록(윤곽 쪽) 1 에 가깝다.
// 실루엣은 조명을 쓰지 않아 단색이면 입체감이 없다. 윤곽을 진하게 하면 단색 덩어리에서도 둥근 몸통과 팔다리가 읽힌다.
float xrayRim(float3 normalWS, float3 viewWS)
{
    float facing = saturate(dot(normalWS, viewWS));
    // 1 - facing 을 그대로 쓰면 둥근 몸에서 윤곽 바로 앞까지 거의 0 이라 테두리가 실처럼 가늘다.
    // sqrt(1 - facing^2) 는 시선과 법선 사이 각의 sin 이라, 캡슐의 몸통(원통)과 둥근 끝(구)에서 화면의 가운데(0)에서 윤곽(1)까지 거의 고르게 커진다.
    // 그래서 폭은 '반지름 중 바깥 몇 할을 테두리로 칠할지' 처럼 읽힌다. 1 이면 가운데까지 부드럽게 번진다.
    float side = sqrt(saturate(1.0 - facing * facing));
#ifdef SG_OFF
    // 흔한 실수: 1 - facing 을 그대로 쓴다. 둥근 몸에서는 윤곽 바로 앞까지 0 에 가까워, 같은 폭 값에서도 테두리가 실처럼 가늘다.
    side = 1.0 - facing;
#endif
    return smoothstep(1.0 - _RimWidth, 1.0, side);
}

float4 sgEffect(SgInput i)
{
    // 1. 실루엣 단색: 가려진 곳을 팀 색 하나로 칠한다. 조명도 형태도 없다.
    float3 flatColor = _SilhouetteColor.rgb;
    SG_STEP(1, flatColor);

    // 2. 프레넬 테두리: 윤곽일수록 1. 세기를 곱해 0~1 로 자른다.
    //    효과 끄기(SG_OFF)는 xrayRim 안에서 흔한 실수인 1 - facing 으로 바뀌어 테두리만 가늘어진다.
    float edge = saturate(xrayRim(i.normalWS, i.viewWS) * _RimStrength);
    SG_STEP(2, float3(edge, edge, edge));

    // 3. 섞을 비율: 안쪽은 불투명도만큼만 덮어 벽이 비치고, 윤곽은 1 로 진하게 덮는다.
    //    발견 값(_Reveal)은 더하기용이라 0 이면 아무 일도 하지 않고, 1 이면 실루엣 전체를 꽉 채운다.
    float alpha = lerp(_Opacity, 1.0, edge);
    alpha = saturate(alpha + _Reveal);
    SG_STEP(3, float3(alpha, alpha, alpha));

    // 최종: 윤곽은 살짝 희게 해 같은 색 안에서도 테두리가 도드라진다. 발견하는 순간에는 전체가 흰빛 쪽으로 밝아진다.
    float3 color = lerp(flatColor, float3(1.0, 1.0, 1.0), edge * 0.4);
    color = lerp(color, float3(1.0, 1.0, 1.0), saturate(_Reveal) * 0.55);
    return float4(color, alpha);
}

#else

// ── 본체 패스: 평범한 조명. 효과는 실루엣 패스에만 있다 ──

float4 sgEffect(SgInput i)
{
    float3 body = xrayBodyColor(i);
    // 단계 번호는 두 패스에 함께 걸린다. 본체는 단계마다 바뀌는 것이 없으므로 같은 색을 보여 준다.
    SG_STEP(1, body);
    SG_STEP(2, body);
    SG_STEP(3, body);

    // 불투명 표본이라 알파는 항상 1 이다. 그림자, 깊이 패스도 이 본체 알파를 쓴다.
    return float4(body, 1.0);
}

#endif
