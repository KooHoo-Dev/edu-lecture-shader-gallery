// 하프톤 망점 효과 본체. Unity 래퍼와 웹 미리보기가 이 파일을 그대로 함께 쓴다.

// SG_STEP: 웹의 '단계 보기'가 중간 결과를 꺼내는 표시. Unity 에서는 아무 일도 하지 않는다.
#ifndef SG_STEP
#define SG_STEP(n, rgb)
#endif

// 칸 한 변이 이 픽셀 수 아래로 내려가면 원본 화면으로 섞는다 (한 픽셀 작은 곳에서 완전히 원본).
// 점이 픽셀보다 작아지면 원이 아니라 픽셀 격자와 부딪치는 얼룩(모아레)이 되기 때문이다.
#define HALFTONE_MIN_CELL_PX 3.0
#define HALFTONE_PI 3.14159265
#define HALFTONE_DEG 0.01745329
// 원이 칸 네 변에 막 닿을 때의 덮임 (π × 0.5²)
#define HALFTONE_TOUCH 0.78539816
// CMYK 판 각도 (도). 판마다 다르게 돌려야 겹친 판이 굵은 물결(모아레) 대신 작은 꽃 모양(로제트)이 된다.
// 눈에 가장 잘 띄는 검정을 45 도에, 가장 옅은 노랑을 0 도에 둔다.
#define HALFTONE_ANGLE_C 15.0
#define HALFTONE_ANGLE_M 75.0
#define HALFTONE_ANGLE_Y 0.0
#define HALFTONE_ANGLE_K 45.0
// 격자 원점을 화면 가운데에서 조금 비켜 둔다. 가운데에 두면 45 도 격자의 칸 경계가 화면 대각선의 픽셀 중심을
// 정확히 지나, 반올림 오차로 경계 양쪽 칸을 번갈아 읽는 점선이 생긴다.
#define HALFTONE_ORIGIN float2(0.1234, 0.0789)

// 2D 회전. 행렬을 쓰지 않는다
float2 halftoneRotate(float2 p, float angleRad)
{
    float s = sin(angleRad);
    float c = cos(angleRad);
    return float2(p.x * c - p.y * s, p.x * s + p.y * c);
}

// 화면 uv -> 돌린 칸 좌표. 화면 가운데를 원점으로 두고 화면비를 곱해 가로와 세로를 같은 길이로 잰 뒤
// 줄 수를 곱한다. 정수 하나가 칸 한 변이라 화면비와 해상도에 상관없이 칸이 정사각이고 화면 높이에 줄 수만큼 들어간다.
float2 halftoneGrid(float2 uv, float aspect, float rows, float angleRad)
{
    float2 q = (uv - float2(0.5, 0.5)) * float2(aspect, 1.0) * rows + HALFTONE_ORIGIN;
    return halftoneRotate(q, -angleRad);
}

// 칸 중심의 화면 uv. 칸 좌표를 내려(floor) 가운데(+0.5)로 옮긴 뒤 거꾸로 돌려 화면으로 되돌린다.
// 칸 안의 모든 픽셀이 같은 한 점을 읽으므로 점 하나가 색 하나를 갖는다.
float2 halftoneCellUv(float2 p, float aspect, float rows, float angleRad)
{
    float2 center = floor(p) + float2(0.5, 0.5);
    float2 q = (halftoneRotate(center, angleRad) - HALFTONE_ORIGIN) / rows;
    return saturate(q / float2(aspect, 1.0) + float2(0.5, 0.5));
}

float halftoneLuma(float3 c)
{
    return dot(c, float3(0.2126, 0.7152, 0.0722));
}

// 판 하나의 덮임(잉크 비율, 0~1). plate 0 은 밝기 한 판, 1~4 는 C, M, Y, K.
// 선형 색에서 구한다. 덮임만큼 잉크를 칠한 칸의 평균 반사율이 1 - 덮임이 되므로, 선형 밝기를 써야 멀리서 본 밝기가 원본과 맞는다.
// CMYK 는 검정(K)을 가장 밝은 채널이 모자란 만큼 먼저 깔고, 나머지를 C, M, Y 로 나눈다: (1 - C)(1 - K) = R.
float halftoneCoverage(float3 c, float plate)
{
    float k = 1.0 - max(c.r, max(c.g, c.b));
    float inv = max(1.0 - k, 0.0001);
    float coverage = 1.0 - halftoneLuma(c);
    if (plate > 3.5)
    {
        coverage = k;
    }
    else if (plate > 2.5)
    {
        coverage = 1.0 - c.b / inv;
    }
    else if (plate > 1.5)
    {
        coverage = 1.0 - c.g / inv;
    }
    else if (plate > 0.5)
    {
        coverage = 1.0 - c.r / inv;
    }
    return saturate(coverage + _DotGain);
}

// 덮임 -> 반지름 (칸 한 변 = 1). 원 면적 π r² 이 덮임과 같아야 하므로 반지름은 덮임의 제곱근에 비례한다.
// 덮임이 78.5% 를 넘으면 원이 칸 밖으로 넘친다. 그때는 칸 귀퉁이에 남는 흰 구멍의 면적(1 - 덮임)이
// 반대각선 0.707 까지 남은 거리의 제곱에 비례한다고 보고 되돌린다 (근사, 실제 면적과 2% 안쪽).
float halftoneRadius(float coverage)
{
    float cov = saturate(coverage);
    float inside = sqrt(cov / HALFTONE_PI);
    float spill = 0.70710678 - 0.20710678 * sqrt(saturate((1.0 - cov) / (1.0 - HALFTONE_TOUCH)));
    return cov < HALFTONE_TOUCH ? inside : spill;
}

// 칸 가운데의 원. fwidth 로 가장자리를 한 픽셀만 부드럽게 한다. 거리 d 는 칸 경계를 넘어도 이어지므로 fwidth 가 튀지 않는다.
// 반지름이 반 픽셀보다 작으면 진하기를 함께 줄여, 흰 곳의 칸 가운데에 흐린 점이 남지 않게 한다.
float halftoneDot(float2 p, float radius)
{
    float2 f = frac(p) - float2(0.5, 0.5);
    float d = length(f);
    float aa = max(fwidth(d), 0.0001);
    float edge = 1.0 - smoothstep(radius - aa * 0.5, radius + aa * 0.5, d);
    return edge * saturate(radius * 2.0 / aa);
}

// 판 하나: 그 판의 각도로 돌린 칸의 중심에서 한 번 읽고, 그 판의 덮임으로 점을 그린다.
// linearRadius 가 1 이면 흔한 실수(반지름을 덮임에 선형으로)를 쓴다.
float halftonePlate(float2 uv, float aspect, float rows, float angleDeg, float plate, float linearRadius)
{
    float angleRad = angleDeg * HALFTONE_DEG;
    float2 p = halftoneGrid(uv, aspect, rows, angleRad);
    float3 c = saturate(sgSource(halftoneCellUv(p, aspect, rows, angleRad)).rgb);
    float coverage = halftoneCoverage(c, plate);
    float radius = linearRadius > 0.5 ? 0.5 * coverage : halftoneRadius(coverage);
    return halftoneDot(p, radius);
}

// 잉크 밝기의 하한. 잉크(종이에 곱하는 빛의 비율)의 선형 밝기가 1 - 잉크 세기 보다 어두우면 흰색 쪽으로 올려
// 딱 그 밝기에 맞춘다 (밝기는 lerp 에 선형이라 정확히 맞는다). 그래서 가장 진한 점도 종이 × (1 - 잉크 세기) 밝기이고,
// 기본 0.4 면 점 안이 점 밖(종이)의 60% 이상 밝기다 (가이드 7절 정지 무늬 규칙). 검정 잉크는 회색이 되고,
// 하늘처럼 이미 밝은 칸 색은 그대로 남아 색이 빠지지 않는다.
float3 halftoneLift(float3 ink)
{
    float floorLuma = 1.0 - saturate(_InkStrength);
    float y = halftoneLuma(ink);
    float lift = saturate((floorLuma - y) / max(1.0 - y, 0.0001));
    return lerp(ink, float3(1.0, 1.0, 1.0), lift);
}

// 종이 위에 잉크가 남기는 빛의 비율 (1 = 잉크 없음, 잉크 세기 1 기준). 모드마다 판을 그려 곱한다.
float3 halftoneInkFilter(SgInput i, float rows, float linearRadius)
{
    float3 white = float3(1.0, 1.0, 1.0);
    if (_Mode > 1.5)
    {
        // CMYK 네 판: 판마다 다른 각도의 칸 중심에서 따로 읽는다 (샘플 4 번). 이상적인 잉크라
        // 시안은 빨강만, 마젠타는 초록만, 노랑은 파랑만 막고 검정은 모두 막는다. 겹친 곳은 곱해져 더 어둡다.
        float mc = halftonePlate(i.uv, i.aspect, rows, HALFTONE_ANGLE_C, 1.0, linearRadius);
        float mm = halftonePlate(i.uv, i.aspect, rows, HALFTONE_ANGLE_M, 2.0, linearRadius);
        float my = halftonePlate(i.uv, i.aspect, rows, HALFTONE_ANGLE_Y, 3.0, linearRadius);
        float mk = halftonePlate(i.uv, i.aspect, rows, HALFTONE_ANGLE_K, 4.0, linearRadius);
        return float3(1.0 - mc, 1.0 - mm, 1.0 - my) * (1.0 - mk);
    }
    // 한 판: 흑백은 잉크 색, 칸 색은 칸 중심에서 읽은 색으로 점을 칠한다 (샘플 1 번)
    float angleRad = _Angle * HALFTONE_DEG;
    float2 p = halftoneGrid(i.uv, i.aspect, rows, angleRad);
    float3 c = saturate(sgSource(halftoneCellUv(p, i.aspect, rows, angleRad)).rgb);
    float coverage = halftoneCoverage(c, 0.0);
    float radius = linearRadius > 0.5 ? 0.5 * coverage : halftoneRadius(coverage);
    float dotMask = halftoneDot(p, radius);
    // 잉크 색을 먼저 하한까지 올린 뒤 점 마스크로 섞어, 점 가장자리의 한 픽셀 경사가 그대로 남게 한다
    float3 ink = halftoneLift(lerp(_InkColor.rgb, c, step(0.5, _Mode)));
    return lerp(white, ink, dotMask);
}

// 종이에 찍는다. 종이 색은 점 밖과 점 안에 함께 곱한다. CMYK 는 판이 겹친 곳이 검정에 가까워지므로
// 겹친 결과에 하한을 건다 (한 판 모드는 이미 하한 위라 아무 일도 하지 않는다).
float3 halftonePrint(float3 inkFilter)
{
    return _PaperColor.rgb * halftoneLift(inkFilter);
}

float4 sgEffect(SgInput i)
{
    float3 source = sgSource(i.uv).rgb;
    float rows = max(_Rows, 1.0);
    // 칸 한 변의 픽셀 수. 줄 수로 정하므로 웹, Unity 촬영, 1080p 에서 칸 모양이 같고 크기만 비례한다.
    float cellPx = (1.0 / i.texelSize.y) / rows;
    // 칸이 너무 작으면 원본으로 되돌린다: 3 픽셀에서 섞기 시작해 2 픽셀에서 완전히 원본
    float keep = smoothstep(HALFTONE_MIN_CELL_PX - 1.0, HALFTONE_MIN_CELL_PX, cellPx);
    // 단계 보기의 대표 판: 한 판 모드는 각도 값, CMYK 는 검정 판(45 도)
    float cmyk = step(1.5, _Mode);
    float angle = lerp(_Angle, HALFTONE_ANGLE_K, cmyk) * HALFTONE_DEG;

    // 1. 돌린 칸 격자: 칸 안 좌표(0~1)를 빨강, 초록으로. 칸마다 왼쪽 아래가 검고 오른쪽 위가 노랗다.
    float2 p = halftoneGrid(i.uv, i.aspect, rows, angle);
    float2 local = frac(p);
    SG_STEP(1, float3(local.x, local.y, 0.0));

    // 2. 칸 중심에서 한 번 읽은 색: 칸마다 한 색인 비스듬한 모자이크
    float3 cellColor = saturate(sgSource(halftoneCellUv(p, i.aspect, rows, angle)).rgb);
    SG_STEP(2, cellColor);

    // 3. 점 마스크: 선형 밝기로 덮임을 구하고 반지름 = 제곱근으로 원을 그린다. 한 판 모드는 흰 종이에 검은 점,
    // CMYK 는 네 판을 잉크 세기 1 로 겹친 모습 (판 각도가 달라 로제트가 생긴다)
    float dotMask = halftoneDot(p, halftoneRadius(halftoneCoverage(cellColor, 0.0)));
    float3 single = float3(1.0 - dotMask, 1.0 - dotMask, 1.0 - dotMask);
    SG_STEP(3, lerp(single, halftoneInkFilter(i, rows, 0.0), cmyk));

#ifdef SG_OFF
    // 흔한 실수: 반지름을 밝기에 선형으로 둔다 (r = 0.5 × (1 - 밝기)). 면적은 반지름의 제곱이라
    // 중간 톤(덮임 0.5)의 잉크가 20% 만 칠해져 화면 전체가 밝고 색이 빠진다.
    float3 naive = halftonePrint(halftoneInkFilter(i, rows, 1.0));
    return float4(lerp(source, naive, keep), 1.0);
#endif

    // 최종: 판을 종이에 찍고, 칸이 너무 작으면 원본으로 섞는다
    float3 color = halftonePrint(halftoneInkFilter(i, rows, 0.0));
    return float4(lerp(source, color, keep), 1.0);
}
