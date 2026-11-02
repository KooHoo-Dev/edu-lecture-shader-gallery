// 껍데기 외곽선 효과 본체. Unity 래퍼(InvertedHullOutline.shader)와 웹 미리보기가 이 파일을 그대로 함께 쓴다.
// 한 물체를 두 번 그린다. SG_OUTLINE 블록은 조금 키운 껍데기(외곽선 패스, Cull Front), #else 블록은 본체다.
// 래퍼는 외곽선 패스에서만 이 파일 앞에 SG_OUTLINE 을 정의한다.

// SG_STEP: 웹의 '단계 보기'가 중간 결과를 꺼내는 표시. Unity 에서는 아무 일도 하지 않는다.
#ifndef SG_STEP
#define SG_STEP(n, rgb)
#endif

#ifdef SG_OUTLINE

// ── 외곽선 패스: 정점을 옮겨 본체보다 조금 큰 껍데기를 만든다 ──

// 껍데기를 만드는 두 방식.
// 법선(_PushDir = 0): 정점을 법선 방향으로 width 만큼 민다. 부드러운 메시(구, 캡슐, 캐릭터)에 맞다.
//   같은 자리에 정점이 하나뿐이라 껍데기가 닫힌다. 각진 메시는 모서리 정점이 면마다 따로 있고
//   법선도 면마다 달라, 면이 제각기 밀려 나가며 모서리가 벌어진다.
// 피벗 기준 확대(_PushDir = 1, 기본): 메시 전체를 피벗 기준으로 (1 + width * 2) 배 키운다.
//   같은 자리의 정점은 같은 자리로 가므로 각진 메시에서도 모서리가 벌어지지 않는다.
//   한 변 1 인 큐브는 면이 정확히 width 만큼 나가고, 반지름 0.5 인 구는 법선 밀기와 같아진다.
//   대신 두께가 피벗에서의 거리에 비례한다. 판자처럼 납작한 메시는 두께 방향으로 거의 커지지 않아 넓은 면 쪽 선이 거의 0 이 되고,
//   오목한 곳(팔 안쪽, 컵 안)은 안쪽으로 밀려 선이 사라지며, 피벗이 발밑이면 위쪽만 두꺼워진다.
float3 sgVertex(float3 positionOS, float3 normalOS, float2 uv, float time)
{
    // 두께는 오브젝트 공간 길이다. 켜기 값이 0 이면 살짝 안쪽으로 넣어 본체 안에 완전히 숨긴다.
    // 0 으로만 두면 본체와 같은 자리라 윤곽에서 외곽선 색이 한두 픽셀 비칠 수 있다.
    float width = lerp(-0.01, _OutlineWidth, saturate(_OutlineAmount));
    float3 pushed = positionOS + normalOS * width;

#ifdef SG_OFF
    // 흔한 실수: 각진 메시에서도 정점 법선 그대로 민다. 면마다 따로 밀려 나가 모서리마다 외곽선이 끊긴다.
    return pushed;
#endif

    float3 scaled = positionOS * (1.0 + width * 2.0);
    return lerp(pushed, scaled, step(0.5, _PushDir));
}

// 외곽선 패스의 색. 조명과 상관없는 단색이라 그늘 쪽 윤곽에서도 선이 또렷하다.
float3 hullPassColor(float3 lit)
{
    return _OutlineColor.rgb;
}

#else

// ── 본체 패스: 기본 색에 조명을 곱한 단순한 음영 ──

float3 hullPassColor(float3 lit)
{
    return lit;
}

#endif

// 두 패스가 같은 sgEffect 를 쓰고 색만 hullPassColor 로 갈린다.
// 단계 보기는 두 패스에 같은 번호가 함께 걸리므로, 한 함수에 두면 두 패스의 단계가 어긋나지 않는다.
float4 sgEffect(SgInput i)
{
    float3 lit = _BaseColor.rgb * i.lighting;

    // 1. 숨은 껍데기: 껍데기도 본체와 같은 음영으로 칠해 외곽선 색을 감춘다. 실루엣이 살짝 부푼 자리가 껍데기다.
    SG_STEP(1, lit);

    // 2. 앞면까지: Cull Front 를 빼면 부풀린 껍데기의 앞면이 본체보다 카메라에 가까워 본체를 통째로 가린다.
    //    본체도 외곽선 색으로 칠해 그 모습을 흉내 낸다. 외곽선 색 덩어리만 남는다.
    SG_STEP(2, _OutlineColor.rgb);

    // 3. 최종: 본체가 앞을 가리고, 껍데기는 뒷면만 남아 윤곽 바깥으로 삐져나온 띠만 외곽선이 된다.
    float3 color = hullPassColor(lit);
    SG_STEP(3, color);

    // 불투명 표본이라 알파는 항상 1 이다.
    return float4(color, 1.0);
}
