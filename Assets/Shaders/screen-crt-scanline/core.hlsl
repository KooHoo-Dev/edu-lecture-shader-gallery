// CRT 화면 필터 효과 본체. Unity 래퍼와 웹 미리보기가 이 파일을 그대로 함께 쓴다.

// SG_STEP: 웹의 '단계 보기'가 중간 결과를 꺼내는 표시. Unity 에서는 아무 일도 하지 않는다.
#ifndef SG_STEP
#define SG_STEP(n, rgb)
#endif

// 안전 상한 (가이드 7절 "화면 전체를 덮는 정지 줄무늬"). 머티리얼 값이 범위를 넘어 들어와도 여기서 자른다.
// 줄 사이는 최대 40% 만 어둡게 한다. 어두운 줄이 밝은 줄의 60% 아래로 내려가지 않는다.
#define CRT_SCAN_MAX 0.4
// 형광체 마스크 세기 상한. 0.5 면 흰 화면에서 가장 어두운 열(파랑)이 가장 밝은 열(초록)의 약 63% 다.
#define CRT_MASK_MAX 0.5
// 느린 밝은 띠: 넓고 흐린 띠 하나가 7 초에 한 번 위에서 아래로 지나가고 밝기를 최대 8% 만 올린다.
// 밝기 변화 10% 미만, 1Hz 아래라 번쩍임으로 세지 않는다. 속도는 일부러 머티리얼 값으로 두지 않는다
// (빠르게 돌리면 흘러가는 줄무늬가 된다).
#define CRT_ROLL_SECONDS 7.0
#define CRT_ROLL_MAX 0.08
#define CRT_ROLL_WIDTH 0.15
// 화면 테두리가 검게 사라지는 폭 (화면 높이 비율)
#define CRT_EDGE_SOFT 0.015
// 전원 끄기에서 세로로 눌린 가로선의 두께 (픽셀)
#define CRT_POWER_LINE_PX 4.0

// 음수에서도 항상 0 이상을 돌려주는 나머지 (GLSL 의 mod 와 같다)
float crtMod(float x, float y) { return x - y * floor(x / y); }

// 배럴 왜곡: 화면 가운데에서 멀수록 더 바깥을 읽어 그림이 볼록하게 휜다.
// 거리는 화면비를 곱해 재므로 가로가 긴 화면에서도 휨이 원을 따라간다. 네 모서리가 1 이 되게 나눈다.
float2 crtCurve(float2 uv, float aspect, float curve)
{
    float2 c = (uv - float2(0.5, 0.5)) * 2.0;
    float r2 = (c.x * c.x * aspect * aspect + c.y * c.y) / (aspect * aspect + 1.0);
    c = c * (1.0 + curve * r2);
    return c * 0.5 + float2(0.5, 0.5);
}

// 가로 3탭 색 번짐: 옆 픽셀을 섞어 흐리고, 빨강은 왼쪽, 파랑은 오른쪽에서 조금 더 가져와 색이 살짝 갈린다.
float3 crtRead(float2 uv, float texelX, float bleed)
{
    float offset = texelX * lerp(1.0, 2.5, bleed);
    float3 mid = sgSource(uv).rgb;
    float3 left = sgSource(uv - float2(offset, 0.0)).rgb;
    float3 right = sgSource(uv + float2(offset, 0.0)).rgb;
    float3 c = lerp(mid, (left + mid * 2.0 + right) * 0.25, bleed);
    c.r = lerp(c.r, left.r, bleed * 0.5);
    c.b = lerp(c.b, right.b, bleed * 0.5);
    return c;
}

// 형광체 마스크: 화면 픽셀의 열 번호로 R, G, B 를 번갈아 남긴다. 화면 픽셀에 붙어 있어 휘지 않는다
// (휜 좌표로 만들면 픽셀 격자와 어긋나 모아레가 생긴다). 슬롯은 세 열 묶음마다 엇갈린 가로 틈을 더한다.
float3 crtMask(float2 pixelPos, float mode, float strength)
{
    float3 mask = float3(1.0, 1.0, 1.0);
    if (mode < 0.5)
    {
        return mask;
    }
    float dim = 1.0 - strength;
    float column = crtMod(pixelPos.x, 3.0);
    mask = float3(dim, dim, dim);
    if (column < 0.5)
    {
        mask.r = 1.0;
    }
    else if (column < 1.5)
    {
        mask.g = 1.0;
    }
    else
    {
        mask.b = 1.0;
    }
    if (mode > 1.5)
    {
        float triad = floor(pixelPos.x / 3.0);
        float row = crtMod(pixelPos.y +crtMod(triad, 2.0) * 2.0, 4.0);
        float gap = 1.0 - step(0.5, row);
        mask = mask * (1.0 - strength * gap);
    }
    return mask;
}

float4 sgEffect(SgInput i)
{
    float2 screenPx = float2(1.0 / i.texelSize.x, 1.0 / i.texelSize.y);
    float2 pixelPos = floor(i.uv * screenPx);
    float power = saturate(_PowerOff);

    // 전원 끄기: 그림 전체(줄과 테두리 포함)를 가운데로 세로로 눌러 가로선으로, 다시 가로로 줄여 점으로 만든 뒤 꺼뜨린다.
    // 화면 좌표를 가운데에서 늘려 읽으므로 눌린 만큼 그림 밖(검은 테두리)이 화면을 덮는다.
    float squash = smoothstep(0.0, 0.5, power);
    float squashY = lerp(1.0, CRT_POWER_LINE_PX * i.texelSize.y, squash);
    float squashX = lerp(1.0, 0.02, smoothstep(0.5, 0.8, power));
    float fade = 1.0 - smoothstep(0.8, 1.0, power);
    float2 uv = (i.uv - float2(0.5, 0.5)) / float2(squashX, squashY) + float2(0.5, 0.5);

    // 1. 휜 좌표: 이 픽셀이 읽을 화면 좌표. 0~1 밖은 브라운관 밖이라 부드럽게 검게 지운다.
    // 테두리 폭은 픽셀 크기(fwidth)보다 좁아지지 않게 해 휘거나 눌린 테두리도 계단지지 않는다.
    // 휨이 0 이면 테두리 폭도 픽셀 하나로 줄어 평면 화면의 가장자리 픽셀이 어두워지지 않는다.
    float2 cuv = crtCurve(uv, i.aspect, _Curve);
    float2 pixelUv = fwidth(cuv);
    float edgeAmount = saturate(_Curve / 0.04);
    float2 edgeSoft = max(float2(CRT_EDGE_SOFT / i.aspect, CRT_EDGE_SOFT) * edgeAmount, pixelUv);
    float2 inside = smoothstep(float2(0.0, 0.0), edgeSoft, cuv + pixelUv * 0.5) * smoothstep(float2(0.0, 0.0), edgeSoft, float2(1.0, 1.0) - cuv + pixelUv * 0.5);
    float edge = inside.x * inside.y;
    // 단계 보기용 격자: 휜 좌표의 8 칸 격자선. 직선이던 격자가 바깥으로 볼록하게 휘는 것이 보인다.
    float2 gridDist = abs(frac(cuv * 8.0 + 0.5) - 0.5);
    float2 gridWidth = fwidth(cuv * 8.0);
    float2 onGrid = float2(1.0, 1.0) - smoothstep(gridWidth, gridWidth * 2.0, gridDist);
    float gridShade = 1.0 - 0.6 * max(onGrid.x, onGrid.y);
    SG_STEP(1, float3(saturate(cuv.x), saturate(cuv.y), 0.2) * gridShade * edge);

    // 2. 줄 중심에서 읽기: 줄 간격을 화면 높이에 맞춘 정수 픽셀(최소 2)로 정하고 목표 줄 수에 가장 가깝게 둔다.
    // 정수 픽셀이라 모든 줄의 굵기가 같다. 한 줄 안의 픽셀은 모두 그 줄 가운데 높이의 색을 읽어 그림이 세로로 계단진다.
    float pitch = max(2.0, floor(screenPx.y / max(_Lines, 1.0) + 0.5));
    // 줄 좌표: 정수가 되는 곳이 빔의 가운데다. 픽셀 중심이 (k + 0.5) 라 0.5 를 빼 첫 픽셀을 줄 가운데에 둔다.
    float lineCoord = (cuv.y * screenPx.y - 0.5) / pitch;
    float lineIndex = floor(lineCoord + 0.5);
    float lineCenterY = (lineIndex * pitch + 0.5) * i.texelSize.y;
    float3 picture = crtRead(float2(cuv.x, lineCenterY), i.texelSize.x, _Bleed);
    // 전원이 꺼지며 눌릴수록 색을 빼 회백색 선이 된다. 밝기(휘도)는 그대로 두어 원래 화면보다 밝아지지 않는다.
    float luma = dot(picture, float3(0.2126, 0.7152, 0.0722));
    picture = lerp(picture, float3(luma, luma, luma), squash * 0.7);
    SG_STEP(2, picture * edge);

    // 공통 마무리 값: 마스크, 비네트, 느린 밝은 띠
    float scan = clamp(_Scan, 0.0, CRT_SCAN_MAX);
    float3 mask = crtMask(pixelPos, _Mask, clamp(_MaskStrength, 0.0, CRT_MASK_MAX));
    float vignetteDist = length((cuv - float2(0.5, 0.5)) * 2.0);
    float vignette = 1.0 - saturate(_Vignette) * smoothstep(0.6, 1.5, vignetteDist);
    // frac 으로 한 주기 안에 감싸 오래 켜 두어도 시간 값이 커져 떨리지 않게 한다. 띠는 화면 위 밖에서 아래 밖으로 지나간다.
    float rollPos = 1.3 - 1.6 * frac(i.time / CRT_ROLL_SECONDS);
    float rollDist = (cuv.y - rollPos) / CRT_ROLL_WIDTH;
    float roll = 1.0 + saturate(_Roll) * CRT_ROLL_MAX * exp(-rollDist * rollDist);

#ifdef SG_OFF
    // 흔한 실수: 줄 수를 uv 에 바로 곱한 고정 스캔라인. 화면 높이가 줄 수의 정수배가 아니라 줄이 픽셀 사이에 걸려
    // 굵기가 들쭉날쭉하고 굵은 띠(모아레)가 생긴다. 창 크기를 바꾸면 띠가 움직인다. 줄 대비 상한은 그대로 지킨다.
    float naive = 1.0 - scan * 0.5 * (1.0 - cos(cuv.y * _Lines * 6.2831853));
    float3 naivePicture = crtRead(cuv, i.texelSize.x, _Bleed);
    float naiveLuma = dot(naivePicture, float3(0.2126, 0.7152, 0.0722));
    naivePicture = lerp(naivePicture, float3(naiveLuma, naiveLuma, naiveLuma), squash * 0.7);
    return float4(naivePicture * naive * mask * _Boost * vignette * roll * edge * fade, 1.0);
#endif

    // 3. 빔 프로필: 줄 가운데는 그대로, 줄 사이로 갈수록 cos 모양으로 어두워진다. 가장 어두운 곳이 1 - 줄 사이 어둡기다.
    // 줄이 휘어 비스듬하거나 픽셀보다 촘촘하면 fwidth(줄 좌표)가 커진다. 그때는 대비를 평균 밝기 쪽으로 낮춰
    // 모아레를 줄인다 (밝은 쪽이 아니라 평균으로 낮춰 전체 밝기가 변하지 않는다).
    float f = lineCoord - lineIndex;
    float beamSharp = 1.0 - scan * 0.5 * (1.0 - cos(f * 6.2831853));
    float beamAverage = 1.0 - scan * 0.5;
    float density = fwidth(lineCoord);
    float beam = lerp(beamAverage, beamSharp, 1.0 - smoothstep(0.36, 0.62, density));
    SG_STEP(3, float3(beam, beam, beam) * edge);

    // 4. 형광체 마스크를 빔에 곱한 빛의 무늬. 최종 화면은 2 단계 그림에 이것을 곱한 것이다.
    float3 light = beam * mask;
    SG_STEP(4, light * edge);

    // 최종: 줄과 마스크로 잃은 밝기를 밝기 보정으로 곱해 되돌리고, 비네트와 느린 띠, 테두리, 전원 끄기를 곱한다.
    // 전원 끄기 중의 가로선은 줄 대비가 평균으로 낮아질 뿐 밝기를 더하지 않으므로 원래 화면보다 밝아지지 않는다.
    float3 color = picture * light * _Boost * vignette * roll * edge * fade;
    return float4(color, 1.0);
}
