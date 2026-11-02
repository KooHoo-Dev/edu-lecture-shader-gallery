// 깊이·법선 윤곽선 후처리 효과 본체. Unity 래퍼와 웹 미리보기가 이 파일을 그대로 함께 쓴다.

// SG_STEP: 웹의 '단계 보기'가 중간 결과를 꺼내는 표시. Unity 에서는 아무 일도 하지 않는다.
#ifndef SG_STEP
#define SG_STEP(n, rgb)
#endif

// 효과 끄기(흔한 실수)에서 쓰는 '한 거리에서만 맞춘' 기준 거리(미터). 물체가 놓인 4m 근처에서 맞춰 보고 고정한 상황이다.
#define EDGE_OUTLINE_TUNED_DISTANCE 4.0

float4 sgEffect(SgInput i)
{
    float3 scene = sgSource(i.uv).rgb;

    // 0. Roberts Cross 의 네 점. 대각선 두 쌍의 차이를 잰다.
    //    두께(픽셀)를 아래·위로 나눌 때 floor, ceil 을 써야 홀수 두께에서도 샘플이 픽셀 가운데에 놓여 번지지 않는다.
    float t = max(floor(_Thickness + 0.5), 1.0);
    float lo = floor(t * 0.5);
    float hi = ceil(t * 0.5);
    float2 uvBL = i.uv - i.texelSize * lo;
    float2 uvTR = i.uv + i.texelSize * hi;
    float2 uvBR = i.uv + i.texelSize * float2(hi, -lo);
    float2 uvTL = i.uv + i.texelSize * float2(-lo, hi);

    // 1. 깊이 윤곽: 대각선 두 쌍의 깊이 차이. 같은 각도의 바닥이라도 멀수록 한 픽셀 사이의 깊이 차이가 커지므로
    //    가장 가까운 샘플까지의 거리로 나눈 '상대 차이'로 잰다. 그래야 가까운 곳과 먼 곳에 같은 기준이 통한다.
    float dBL = sgSceneDepth(uvBL);
    float dTR = sgSceneDepth(uvTR);
    float dBR = sgSceneDepth(uvBR);
    float dTL = sgSceneDepth(uvTL);
    float d1 = dTR - dBL;
    float d2 = dTL - dBR;
    float depthGap = sqrt(d1 * d1 + d2 * d2);
    float nearest = min(min(dBL, dTR), min(dBR, dTL));
    float depthDiff = depthGap / max(nearest, 0.001);

#ifdef SG_OFF
    // 흔한 실수: 깊이 차이를 거리로 나누지 않고 미터 그대로 쓴다. 기준 거리(4m)에서 맞춘 민감도가 먼 비스듬한 바닥에서는
    // 너무 예민해 바닥이 줄무늬 선으로 덮이고, 가까운 곳에서는 둔해져 얕은 단차가 빠진다.
    depthDiff = depthGap / EDGE_OUTLINE_TUNED_DISTANCE;
#endif

    // 민감도를 곱한 값이 0.5 를 넘으면 선이 생기기 시작하고 1 에서 진해진다. 문턱을 두어야 비스듬한 면의 잔물결이 걸러진다.
    float depthEdge = smoothstep(0.5, 1.0, depthDiff * _DepthSensitivity);
    SG_STEP(1, float3(depthEdge, depthEdge, depthEdge));

    // 2. 법선 윤곽: 대각선 두 쌍의 법선 벡터 차이. 깊이가 이어진 접힌 곳(상자 모서리, 물체가 바닥에 닿는 곳)을 잡는다.
    //    법선 차이의 길이는 같은 면이면 0, 90도로 꺾이면 약 1.4 다. 하늘은 법선이 0 이라 물체와의 경계에도 선이 생긴다.
    float3 nBL = sgSceneNormal(uvBL);
    float3 nTR = sgSceneNormal(uvTR);
    float3 nBR = sgSceneNormal(uvBR);
    float3 nTL = sgSceneNormal(uvTL);
    float3 n1 = nTR - nBL;
    float3 n2 = nTL - nBR;
    float normalDiff = sqrt(dot(n1, n1) + dot(n2, n2));
    float normalEdge = smoothstep(0.5, 1.0, normalDiff * _NormalSensitivity);
    SG_STEP(2, float3(normalEdge, normalEdge, normalEdge));

    // 3. 합친 윤곽: 둘 중 강한 쪽을 쓰고, 먼 곳은 선이 화면을 어지럽히지 않게 흐린다.
    //    사라지는 거리의 절반부터 서서히 흐려진다. 거리는 가장 가까운 샘플로 재야 물체 실루엣이 뒤 배경 거리에 끌려 흐려지지 않는다.
    float fade = 1.0 - smoothstep(_FadeDistance * 0.5, _FadeDistance, nearest);
    float edge = max(depthEdge, normalEdge) * fade;
    SG_STEP(3, float3(edge, edge, edge));

    // 최종: 원래 화면을 종이색과 섞은 바탕 위에 선 색을 얹는다. 섞기 0 이면 종이 위의 선만 남는 스케치가 된다.
    float3 base = lerp(_PaperColor.rgb, scene, _SceneMix);
    float3 color = lerp(base, _LineColor.rgb, edge);
    return float4(color, 1.0);
}
