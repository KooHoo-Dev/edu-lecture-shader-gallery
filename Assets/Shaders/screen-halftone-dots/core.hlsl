// 하프톤 망점 효과 본체. Unity 래퍼와 웹 미리보기가 이 파일을 그대로 함께 쓴다.

// SG_STEP: 웹의 '단계 보기'가 중간 결과를 꺼내는 표시. Unity 에서는 아무 일도 하지 않는다.
#ifndef SG_STEP
#define SG_STEP(n, rgb)
#endif

// 칸 한 변이 이 픽셀 수 이하면 완전히 원본 화면이다 (한 픽셀 큰 곳부터 섞기 시작한다).
// 점이 픽셀보다 작아지면 원이 아니라 픽셀 격자와 부딪치는 얼룩(모아레)이 되기 때문이다.
#define HALFTONE_MIN_CELL_PX 3.0
// 점 안 밝기의 하한에 더하는 여유. 8비트로 저장하면 반올림으로 비율이 조금 내려가므로 60% 대신 61% 에 맞춘다.
#define HALFTONE_FLOOR_MARGIN 0.01
// 단계 보기의 점 안 밝기 (점 밖의 61%). 단계 화면도 화면 전체 정지 무늬라 대비 규칙을 지킨다.
#define HALFTONE_STEP_FLOOR 0.61
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
// 선형 색에서 구한다. 덮임만큼 검은 잉크를 칠한 칸의 평균 반사율이 1 - 덮임이 되므로, 선형 밝기를 써야 멀리서 본 밝기가
// 원본과 맞는다. 다만 이것은 잉크 세기 1 일 때뿐이고, 기본값처럼 하한을 걸면 점이 옅어져 전체가 원본보다 밝다.
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

// 칸 가운데의 원. 가장자리를 한 픽셀(aa, 칸 단위)만 부드럽게 한다. aa 는 fwidth 대신 줄 수와 화면 높이로 구한 해석값이라
// 모드 분기 안에서 불러도 미분이 필요 없다 (분기 안의 fwidth 는 Unity 에서 경고가 난다).
// 반지름이 반 픽셀보다 작으면 진하기를 함께 줄여, 흰 곳의 칸 가운데에 흐린 점이 남지 않게 한다.
float halftoneDot(float2 p, float radius, float aa)
{
    float2 f = frac(p) - float2(0.5, 0.5);
    float d = length(f);
    float edge = 1.0 - smoothstep(radius - aa * 0.5, radius + aa * 0.5, d);
    return edge * saturate(radius * 2.0 / aa);
}

// 덮임 -> 반지름. linearRadius 가 1 이면 흔한 실수(반지름을 덮임에 선형으로)를 쓴다.
float halftoneRadiusFor(float coverage, float linearRadius)
{
    return linearRadius > 0.5 ? 0.5 * coverage : halftoneRadius(coverage);
}

// 판 하나: 그 판의 각도로 돌린 칸의 중심에서 한 번 읽고, 그 판의 덮임으로 점을 그린다.
float halftonePlate(float2 uv, float aspect, float rows, float aa, float angleDeg, float plate, float linearRadius)
{
    float angleRad = angleDeg * HALFTONE_DEG;
    float2 p = halftoneGrid(uv, aspect, rows, angleRad);
    float3 c = saturate(sgSource(halftoneCellUv(p, aspect, rows, angleRad)).rgb);
    return halftoneDot(p, halftoneRadiusFor(halftoneCoverage(c, plate), linearRadius), aa);
}

// 점 안 밝기의 하한. 종이를 곱한 점 안의 선형 밝기 L(종이 × 잉크) 가 L(종이) × ratio 보다 어두우면 잉크를 흰색 쪽으로
// 올려 딱 그 밝기에 맞춘다 (밝기는 lerp 에 선형이라 정확히 맞는다). 종이 색까지 곱한 최종 색으로 재므로 색이 강한
// 종이와 잉크의 조합에서도 비율이 지켜진다. 검정 잉크는 회색이 되고, 무대 하늘(선형 밝기 약 0.38) 같은 중간 밝기의
// 칸 색도 흰색 쪽으로 올라가 옅어진다. 그대로 남는 것은 선형 밝기가 하한(기본 약 0.61) 이상인 밝은 칸 색뿐이다.
float3 halftoneLift(float3 ink, float3 paper, float ratio)
{
    float paperY = halftoneLuma(paper);
    float y = halftoneLuma(paper * ink);
    float lift = saturate((ratio * paperY - y) / max(paperY - y, 0.0001));
    return lerp(ink, float3(1.0, 1.0, 1.0), lift);
}

// 종이 위에 잉크가 남기는 빛의 비율 (1 = 잉크 없음). 모드마다 판을 그려 곱하고 하한을 건다.
// p, cellColor 는 분기 밖에서 대표 판(한 판 모드는 각도 값, CMYK 는 검정 판)의 칸 중심에서 한 번 읽은 것이다.
float3 halftoneInkFilter(SgInput i, float2 p, float3 cellColor, float rows, float aa, float linearRadius, float3 paper, float ratio)
{
    float3 white = float3(1.0, 1.0, 1.0);
    if (_Mode > 1.5)
    {
        // CMYK 네 판: 판마다 다른 각도의 칸 중심에서 따로 읽는다 (검정 판은 분기 밖에서 읽은 색, 나머지 3 번). 이상적인 잉크라
        // 시안은 빨강만, 마젠타는 초록만, 노랑은 파랑만 막고 검정은 모두 막는다. 겹친 곳은 곱해져 검정에 가까워지므로
        // 겹친 결과에 하한을 건다.
        float mc = halftonePlate(i.uv, i.aspect, rows, aa, HALFTONE_ANGLE_C, 1.0, linearRadius);
        float mm = halftonePlate(i.uv, i.aspect, rows, aa, HALFTONE_ANGLE_M, 2.0, linearRadius);
        float my = halftonePlate(i.uv, i.aspect, rows, aa, HALFTONE_ANGLE_Y, 3.0, linearRadius);
        float mk = halftoneDot(p, halftoneRadiusFor(halftoneCoverage(cellColor, 4.0), linearRadius), aa);
        return halftoneLift(float3(1.0 - mc, 1.0 - mm, 1.0 - my) * (1.0 - mk), paper, ratio);
    }
    // 한 판: 흑백은 잉크 색, 칸 색은 칸 중심에서 읽은 색으로 점을 칠한다.
    // 잉크 색을 먼저 하한까지 올린 뒤 점 마스크로 섞어, 점 가장자리의 한 픽셀 경사가 그대로 남게 한다
    float dotMask = halftoneDot(p, halftoneRadiusFor(halftoneCoverage(cellColor, 0.0), linearRadius), aa);
    float3 ink = halftoneLift(lerp(_InkColor.rgb, cellColor, step(0.5, _Mode)), paper, ratio);
    return lerp(white, ink, dotMask);
}

float4 sgEffect(SgInput i)
{
    float3 source = sgSource(i.uv).rgb;
    float rows = max(_Rows, 1.0);
    // 칸 한 변의 픽셀 수. 줄 수로 정하므로 웹, Unity 촬영, 1080p 에서 칸 모양이 같고 크기만 비례한다.
    float cellPx = (1.0 / i.texelSize.y) / rows;
    // 점 가장자리를 부드럽게 할 폭 = 한 픽셀을 칸 단위로 잰 값. 화면비를 보정한 칸 좌표에서는 가로, 세로, 돌린 방향
    // 모두 한 픽셀이 줄 수 × texelSize.y 칸이다 (= 1 / cellPx).
    float aa = rows * i.texelSize.y;
    // 칸이 너무 작으면 원본으로 되돌린다: 4 픽셀에서 섞기 시작해 3 픽셀에서 완전히 원본
    float keep = smoothstep(HALFTONE_MIN_CELL_PX, HALFTONE_MIN_CELL_PX + 1.0, cellPx);
    // 단계 보기와 분기 밖 읽기의 대표 판: 한 판 모드는 각도 값, CMYK 는 검정 판(45 도)
    float cmyk = step(1.5, _Mode);
    float angle = lerp(_Angle, HALFTONE_ANGLE_K, cmyk) * HALFTONE_DEG;
    float3 white = float3(1.0, 1.0, 1.0);
    float3 paper = _PaperColor.rgb;
    // 점 안이 점 밖(종이)의 몇 배 밝기 이상이어야 하는지. 기본 잉크 세기 0.4 면 0.61 (8비트 여유 포함)
    float ratio = saturate(1.0 - saturate(_InkStrength) + HALFTONE_FLOOR_MARGIN);

    // 1. 돌린 칸 격자: 칸 안 좌표(0~1)를 회색 바탕에 빨강(가로), 초록(세로)으로 옅게 더한다. 45 도에서 칸 좌표 (0, 0) 은
    // 마름모의 아래 꼭짓점(회색), (1, 1) 은 위 꼭짓점(주황), 빨강 (1, 0) 은 오른쪽, 초록 (0, 1) 은 왼쪽 꼭짓점이다.
    // 칸 경계의 회색 ↔ 주황 대비는 선형 밝기 비 0.64 로 정지 무늬 규칙 안이다.
    float2 p = halftoneGrid(i.uv, i.aspect, rows, angle);
    float2 local = frac(p);
    SG_STEP(1, float3(0.5 + 0.5 * local.x, 0.5 + 0.25 * local.y, 0.5));

    // 2. 칸 중심에서 한 번 읽은 색: 칸마다 한 색인 비스듬한 모자이크. 최종 점도 이 색을 쓴다 (모드 분기 밖에서 읽는다)
    float3 cellColor = saturate(sgSource(halftoneCellUv(p, i.aspect, rows, angle)).rgb);
    SG_STEP(2, cellColor);

    // 3. 점 마스크: 선형 밝기로 덮임을 구하고 반지름 = 제곱근으로 원을 그린다. 한 판 모드는 흰 바탕에 연한 회색 점
    // (점 안 61% 밝기), CMYK 는 네 판을 순수한 잉크로 겹친 뒤 흰 종이 기준으로 같은 61% 하한을 건 모습 (판 각도가 달라 로제트가 생긴다)
    float dotMask = halftoneDot(p, halftoneRadius(halftoneCoverage(cellColor, 0.0)), aa);
    float stepGray = lerp(1.0, HALFTONE_STEP_FLOOR, dotMask);
    float3 single = float3(stepGray, stepGray, stepGray);
    SG_STEP(3, lerp(single, halftoneInkFilter(i, p, cellColor, rows, aa, 0.0, white, HALFTONE_STEP_FLOOR), cmyk));

#ifdef SG_OFF
    // 흔한 실수: 반지름을 밝기에 선형으로 둔다 (r = 0.5 × (1 - 밝기)). 면적은 반지름의 제곱이라
    // 중간 톤(덮임 0.5)의 잉크가 20% 만 칠해져 화면 전체가 밝고 색이 빠진다.
    float3 naive = paper * halftoneInkFilter(i, p, cellColor, rows, aa, 1.0, paper, ratio);
    return float4(lerp(source, naive, keep), 1.0);
#endif

    // 최종: 판을 종이에 찍는다 (종이 색은 점 밖과 점 안에 함께 곱한다). 칸이 너무 작으면 원본으로 섞는다
    float3 color = paper * halftoneInkFilter(i, p, cellColor, rows, aa, 0.0, paper, ratio);
    return float4(lerp(source, color, keep), 1.0);
}
