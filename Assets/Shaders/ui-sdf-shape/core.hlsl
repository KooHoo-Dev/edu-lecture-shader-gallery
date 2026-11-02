// SDF 도형 효과 본체. Unity 래퍼와 웹 미리보기가 이 파일을 그대로 함께 쓴다.
// 거리장(SDF, signed distance field): 픽셀마다 "도형 가장자리까지의 거리"를 구한다. 안쪽은 음수, 바깥은 양수, 가장자리가 0 이다.
// 거리를 알면 채움(d < 0), 윤곽(-두께 < d < 0), 부드러운 가장자리(d 가 0 근처인 1픽셀)를 같은 값 하나로 나눌 수 있다.

// SG_STEP: 웹의 '단계 보기'가 중간 결과를 꺼내는 표시. Unity 에서는 아무 일도 하지 않는다.
#ifndef SG_STEP
#define SG_STEP(n, rgb)
#endif

#define UISDF_PI 3.14159265
// 윤곽과 부드러운 가장자리가 이미지 밖으로 잘리지 않게 남기는 여백 (이미지 높이에 대한 비율)
#define UISDF_MARGIN 0.06
// 링 트랙의 두께 (이미지 높이에 대한 비율)
#define UISDF_RING_WIDTH 0.2
// 아직 안 채운 자리를 채움 색으로 얼마나 비치게 할지. 진행 바의 빈 칸이 보여야 얼마나 남았는지 읽힌다
#define UISDF_TRACK_ALPHA 0.25

// 둥근 사각형의 거리. 원점이 가운데, halfSize 는 반 크기, r 은 모서리 반경.
// 모서리 반경만큼 줄인 사각형까지의 거리에서 r 을 빼면 모서리가 원호가 된다.
float uiSdfRoundBox(float2 p, float2 halfSize, float r)
{
    float2 q = abs(p) - halfSize + float2(r, r);
    return length(max(q, float2(0.0, 0.0))) + min(max(q.x, q.y), 0.0) - r;
}

// 원점에서 dir 방향으로 뻗은 선분(from ~ to 구간)까지의 거리. 호의 끝면을 만든다.
float uiSdfRadialSegment(float2 p, float2 dir, float from, float to)
{
    float t = clamp(dot(p, dir), from, to);
    return length(p - dir * t);
}

// 끝이 각진 호의 거리. 12시에서 시계 방향으로 a0 ~ a1 라디안, 반지름 radius, 반 두께 halfWidth.
float uiSdfArc(float2 p, float radius, float halfWidth, float a0, float a1)
{
    // 링 띠까지의 거리. 각도와 상관없이 원 둘레에서 얼마나 떨어졌는지만 본다
    float band = abs(length(p) - radius) - halfWidth;
    // atan2(x, y) 는 12시가 0 이고 시계 방향으로 커진다. 음수 쪽을 2π 만큼 옮겨 0 ~ 2π 로 만든다.
    // y 에 아주 작은 값을 더해 정확히 원점에서 atan2(0, 0) 이 정의되지 않는 경우를 피한다
    float angle = atan2(p.x, p.y + 0.000001);
    angle = angle + 2.0 * UISDF_PI * (1.0 - step(0.0, angle));
    float inside = step(a0, angle) * step(angle, a1);
    // 두 끝면까지의 거리. 각도 범위 밖에서는 이것이 곧 호까지의 거리다
    float capA = uiSdfRadialSegment(p, float2(sin(a0), cos(a0)), radius - halfWidth, radius + halfWidth);
    float capB = uiSdfRadialSegment(p, float2(sin(a1), cos(a1)), radius - halfWidth, radius + halfWidth);
    float cap = min(capA, capB);
    // 범위 안에서는 띠와 끝면 중 가까운 쪽이 가장자리다. 끝면 쪽도 거리로 이어져야 끝이 부드럽게 칠해진다
    return lerp(cap, max(band, -cap), inside);
}

// 거리를 덮인 정도(0~1)로 바꾼다. fwidth(d) 는 옆 픽셀과 d 가 얼마나 다른지, 곧 픽셀 하나의 폭을 거리 단위로 잰 값이다.
// 그 폭으로 나누면 이미지가 크든 작든 가장자리가 항상 1픽셀에 걸쳐 부드럽게 바뀐다.
float uiSdfCover(float d)
{
    float pixel = max(fwidth(d), 0.00001);
    return saturate(0.5 - d / pixel);
}

// 덮인 정도 세 가지(채움, 윤곽 안쪽, 도형 전체)로 색을 합친다.
// 채움과 윤곽은 겹치지 않는 영역이라 알파를 곱한 색끼리 더하고 마지막에 알파로 나눈다.
float4 uiSdfCompose(float fillA, float innerA, float shapeA, float4 tint)
{
    float trackA = max(innerA - fillA, 0.0) * UISDF_TRACK_ALPHA;
    float outlineA = max(shapeA - innerA, 0.0);
    float aFill = (fillA + trackA) * _FillColor.a;
    float aLine = outlineA * _OutlineColor.a;
    float alpha = aFill + aLine;
    float3 rgb = (_FillColor.rgb * aFill + _OutlineColor.rgb * aLine) / max(alpha, 0.0001);
    // 정점 색(Image 의 Color)을 곱한다. UI 에서 투명도 연출과 색 바꾸기가 Image.color 하나로 된다
    return float4(rgb * tint.rgb, alpha * tint.a);
}

float4 sgEffect(SgInput i)
{
    // 0. 좌표: 가운데가 원점이고 세로가 -0.5 ~ 0.5 인 공간. 가로는 이미지의 실제 가로세로 비만큼 넓힌다.
    //    셰이더는 Image 의 크기를 모른다. uv 가 화면 한 픽셀에 얼마나 변하는지(ddx, ddy)로 가로세로 비를 직접 잰다.
    //    가로 uv 는 폭 W 픽셀 동안 0 에서 1 로 변하므로 한 픽셀에 1/W, 세로는 1/H. 둘의 비가 W/H 다.
    float2 du = float2(ddx(i.uv.x), ddy(i.uv.x));
    float2 dv = float2(ddx(i.uv.y), ddy(i.uv.y));
    float aspect = length(dv) / max(length(du), 0.000001);
    float2 p = (i.uv - float2(0.5, 0.5)) * float2(aspect, 1.0);

    float isCircle = step(0.5, _Shape) * step(_Shape, 1.5);
    float isRing = step(1.5, _Shape);
    float fillAmount = saturate(_Fill);
    float hasFill = step(0.001, fillAmount);
    float stroke = _OutlineWidth;

    // 1. 도형의 거리
    // 둥근 사각형과 원: 가로세로 비가 _Aspect 인 상자를 이미지 안에 들어가는 가장 큰 크기로 놓는다.
    float halfH = min(0.5 - UISDF_MARGIN, (aspect * 0.5 - UISDF_MARGIN) / _Aspect);
    float2 halfSize = float2(halfH * _Aspect, halfH);
    float shortHalf = min(halfSize.x, halfSize.y);
    // 원은 모서리 반경이 짧은 변의 절반인 둥근 사각형이다. 가로로 늘리면 타원이 아니라 캡슐이 된다
    float corner = lerp(_Radius * shortHalf, shortHalf, isCircle);
    float dBox = uiSdfRoundBox(p, halfSize, corner);
    // 링: 원 둘레까지의 거리에서 반 두께를 빼면 띠가 된다.
    float ringHalf = UISDF_RING_WIDTH * 0.5;
    float ringRadius = min(0.5, aspect * 0.5) - UISDF_MARGIN - ringHalf;
    float dRing = abs(length(p) - ringRadius) - ringHalf;
    float d = lerp(dBox, dRing, isRing);

    // 거리를 색으로 본다: 안쪽 파랑, 바깥 주황, 등고선 간격이 일정한 것이 거리장이라는 뜻이다. 흰 선이 d = 0 이다
    float3 field = lerp(float3(0.3, 0.6, 1.0), float3(1.0, 0.55, 0.2), step(0.0, d));
    field = field * (1.0 - exp(-6.0 * abs(d)));
    field = field * (0.8 + 0.2 * cos(120.0 * d));
    field = lerp(field, float3(1.0, 1.0, 1.0), 1.0 - smoothstep(0.0, 2.0 * max(fwidth(d), 0.00001), abs(d)));
    SG_STEP(1, field);

    // 2. 채움 영역의 거리. 윤곽 두께만큼 안쪽(d + stroke)에서 진행 정도만큼만 남긴다.
    // 사각형은 왼쪽부터, 원은 아래부터 채운다. 반평면도 거리장이고, 두 거리장의 max 는 교집합이다
    float edgeX = -halfSize.x + 2.0 * halfSize.x * fillAmount;
    float edgeY = -halfSize.y + 2.0 * halfSize.y * fillAmount;
    float dProgress = lerp(p.x - edgeX, p.y - edgeY, isCircle);
    float dFillBox = max(dBox + stroke, dProgress);
    // 링은 12시에서 시계 방향으로 호를 늘린다. 모서리 반경이 호 끝의 둥글기다.
    // 끝을 cap 만큼 둥글게 하려면 호를 cap 만큼 가늘고 짧게 만든 뒤 거리에서 cap 을 뺀다 (거리장을 부풀리면 모서리가 둥글어진다)
    float fillHalf = max(ringHalf - stroke, 0.0);
    float cap = _Radius * fillHalf;
    float capAngle = cap / ringRadius;
    float a1 = max(capAngle, fillAmount * 2.0 * UISDF_PI - capAngle);
    float dArc = uiSdfArc(p, ringRadius, fillHalf - cap, capAngle, a1) - cap;
    // 다 찼으면 이음매 없는 온전한 링으로 바꾼다
    float dFillRing = lerp(dArc, dRing + stroke, step(0.999, fillAmount));
    float dFill = lerp(dFillBox, dFillRing, isRing);

#ifdef SG_OFF
    // 흔한 실수: fwidth 대신 가장자리 폭을 숫자(0.03)로 고정한다. 그 폭이 화면에서 몇 픽셀인지가 Image 크기에 따라 달라져
    // 큰 Image 에서는 가장자리가 뿌옇게 번지고 얇은 윤곽은 흐려진다. 작은 아이콘에서는 반대로 1픽셀보다 좁아져 계단이 생긴다
    float offFill = (1.0 - smoothstep(-0.015, 0.015, dFill)) * hasFill;
    float offInner = 1.0 - smoothstep(-0.015, 0.015, d + stroke);
    float offShape = 1.0 - smoothstep(-0.015, 0.015, d);
    return uiSdfCompose(offFill, offInner, offShape, i.color);
#endif

    float shapeA = uiSdfCover(d);
    float innerA = uiSdfCover(d + stroke);
    float fillA = uiSdfCover(dFill) * hasFill;
    SG_STEP(2, float3(1.0, 1.0, 1.0) * (fillA + max(innerA - fillA, 0.0) * UISDF_TRACK_ALPHA));

    // 3. 윤곽: 도형 전체에서 윤곽 안쪽을 뺀 띠
    float outlineA = max(shapeA - innerA, 0.0);
    SG_STEP(3, float3(outlineA, outlineA, outlineA));

    // 최종: 채움, 빈 칸, 윤곽을 합치고 정점 색을 곱한다
    return uiSdfCompose(fillA, innerA, shapeA, i.color);
}
