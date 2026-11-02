// 배경 블러 유리 효과 본체. Unity 래퍼와 웹 미리보기가 이 파일을 그대로 함께 쓴다.
// 패널은 자기 뒤에 이미 그려진 화면(씬 색상)을 화면 좌표로 여러 번 읽어 평균을 낸다. 그 평균이 흐린 배경이다.
// 흐린 배경에 유리 색을 섞고 테두리 빛을 더한 뒤, 거리장(SDF)으로 만든 둥근 사각형 모양만큼 덮는다.

// SG_STEP: 웹의 '단계 보기'가 중간 결과를 꺼내는 표시. Unity 에서는 아무 일도 하지 않는다.
#ifndef SG_STEP
#define SG_STEP(n, rgb)
#endif

// 황금각(라디안). 샘플마다 이만큼 돌리면 몇 개를 찍든 원판 위에 고르게 퍼진 나선이 된다
#define BACKDROP_GOLDEN_ANGLE 2.39996323
// 반복 횟수의 상한. High 의 샘플 수와 같다. 루프 상한이 상수여야 양쪽 컴파일러가 받아 준다
#define BACKDROP_MAX_TAPS 32
// 패널 가장자리 여백 (짧은 변 비율). 가장자리 1픽셀 안티앨리어싱이 Image 사각형 밖으로 잘리지 않게 둔다
#define BACKDROP_MARGIN 0.01
// 테두리 빛의 폭 (짧은 변 비율)
#define BACKDROP_RIM_WIDTH 0.012

// 둥근 사각형의 거리. 원점이 가운데, halfSize 는 반 크기, r 은 모서리 반경. 안쪽이 음수다.
float backdropRoundBox(float2 p, float2 halfSize, float r)
{
    float2 q = abs(p) - halfSize + float2(r, r);
    return length(max(q, float2(0.0, 0.0))) + min(max(q.x, q.y), 0.0) - r;
}

// 거리를 덮인 정도(0~1)로 바꾼다. fwidth 로 픽셀 하나의 폭을 재서 Image 크기와 상관없이 가장자리를 1픽셀만 부드럽게 한다
float backdropCover(float d)
{
    float pixel = max(fwidth(d), 0.00001);
    return saturate(0.5 - d / pixel);
}

// 화면 픽셀마다 다른 0~1 값 (interleaved gradient noise). 나선을 픽셀마다 조금씩 돌려
// 적은 샘플 수에서 생기는 겹상(같은 물체가 몇 겹으로 비치는 무늬)을 고운 알갱이로 바꾼다.
// 화면 픽셀 좌표로 정해지므로 알갱이 무늬는 화면에 고정되어, 패널이 움직여도 제자리에 남는다
float backdropPixelNoise(float2 pixel)
{
    return frac(52.9829189 * frac(dot(pixel, float2(0.06711056, 0.00583715))));
}

// 나선 샘플링 블러. center 주변 반경 radius(화면 uv, 가로세로 따로) 안을 taps 번 읽어 가중 평균한다.
// k 번째 샘플은 반지름 sqrt((k + 0.5) / taps), 각도 k * 황금각에 놓인다 (해바라기 씨 배치).
// 반지름에 sqrt 를 쓰면 원판 넓이에 고르게 퍼지고, 가운데일수록 무겁게(가우스 모양) 주어 경계가 부드럽다.
// 탭마다 cos, sin, exp 를 새로 부르면 High 에서 픽셀당 96번이다. 방향은 황금각 회전을 곱해 이어 가고
// 무게는 같은 비율을 곱해 이어 가서, 픽셀마다 cos, sin, exp 를 한 번씩만 부른다. sqrt 는 싼 명령이라 탭마다 둔다.
float3 backdropBlur(float2 center, float2 radius, float taps, float spin)
{
    float3 sum = float3(0.0, 0.0, 0.0);
    float total = 0.0;
    // 첫 샘플의 방향. 픽셀마다 다른 spin 만큼 돌아 있다
    float2 dir = float2(cos(spin), sin(spin));
    // 한 샘플마다 돌리는 회전. 상수라 컴파일러가 미리 계산한다
    float2 turn = float2(cos(BACKDROP_GOLDEN_ANGLE), sin(BACKDROP_GOLDEN_ANGLE));
    // 무게 exp(-2t) 는 t 가 1/taps 씩 늘 때마다 exp(-2/taps) 배가 된다. 끝에 total 로 나누므로 첫 무게는 1 로 둔다
    float decay = exp(-2.0 / taps);
    float w = 1.0;
    for (int k = 0; k < BACKDROP_MAX_TAPS; k++)
    {
        float fk = float(k);
        // 고른 질보다 많이 돌지 않는다. 샘플 수가 곧 비용이다
        if (fk >= taps)
        {
            break;
        }
        float t = (fk + 0.5) / taps;
        float2 offset = dir * sqrt(t) * radius;
        sum = sum + sgSceneColor(center + offset).rgb * w;
        total = total + w;
        // 다음 샘플: 방향을 황금각만큼 돌리고 무게를 줄인다
        dir = float2(dir.x * turn.x - dir.y * turn.y, dir.x * turn.y + dir.y * turn.x);
        w = w * decay;
    }
    return sum / max(total, 0.0001);
}

float4 sgEffect(SgInput i)
{
    // 0. 좌표와 크기.
    //    Image 의 가로세로 비: uv 가 화면 한 픽셀에 변하는 양(ddx, ddy)으로 잰다. 가로 uv 는 폭 W 픽셀 동안 1 변하므로 1/W, 세로는 1/H.
    float2 du = float2(ddx(i.uv.x), ddy(i.uv.x));
    float2 dv = float2(ddx(i.uv.y), ddy(i.uv.y));
    float aspect = max(length(dv) / max(length(du), 0.000001), 0.0001);
    // 짧은 변이 1 인 좌표. 모서리 반경과 테두리 폭을 짧은 변 비율로 쓰면 가로로 긴 패널에서도 모서리가 찌그러지지 않는다
    float unit = min(aspect, 1.0);
    float2 p = (i.uv - float2(0.5, 0.5)) * float2(aspect, 1.0) / unit;
    float2 halfImage = float2(aspect, 1.0) * 0.5 / unit;
    //    화면 픽셀 크기(uv 단위)도 같은 방법으로 잰다. 흐림 반경을 화면 높이 비율로 쓰고 가로는 화면비만큼 줄여야 원이 된다
    float2 pixelUV = max(float2(abs(ddx(i.screenUV.x)), abs(ddy(i.screenUV.y))), float2(0.000001, 0.000001));
    float screenAspect = pixelUV.y / pixelUV.x;
    // 패널 열기 정도. 닫을수록 흐림 반경, 유리 색, 알파가 함께 0 으로 간다
    float open = 1.0 - saturate(_Hide);

    // 1. 패널 모양: 둥근 사각형 거리장의 안쪽. 이 알파가 곧 유리판의 모양이다
    float2 halfSize = halfImage - float2(BACKDROP_MARGIN, BACKDROP_MARGIN);
    float corner = saturate(_CornerRadius) * min(halfSize.x, halfSize.y);
    float d = backdropRoundBox(p, halfSize, corner);
    float shapeA = backdropCover(d);
    SG_STEP(1, float3(shapeA, shapeA, shapeA));

    // 2. 흐리기 전 씬 색상: 이 픽셀 바로 뒤에 그려진 장면. 화면 좌표 그대로 한 번 읽는다
    float3 scene = sgSceneColor(i.screenUV).rgb;
    SG_STEP(2, scene * shapeA);

    // 3. 흐린 씬 색상: 같은 자리 주변을 나선으로 여러 번 읽어 평균한다
    float2 radius = float2(_BlurRadius / screenAspect, _BlurRadius) * open;
    // 질 고르기: Low 8, Medium 16, High 32 번 읽는다
    float taps = 8.0;
    if (_Quality > 0.5 && _Quality < 1.5)
    {
        taps = 16.0;
    }
    if (_Quality > 1.5)
    {
        taps = 32.0;
    }
    float spin = backdropPixelNoise(i.screenUV / pixelUV) * 6.2831853;
    float3 blurred = backdropBlur(i.screenUV, radius, taps, spin);

#ifdef SG_OFF
    // 흔한 실수: 반경은 그대로 두고 십자 모양으로 네 번만 읽는다 (픽셀마다 돌리지도 않는다).
    // 평균이 흐림이 아니라 같은 장면을 네 군데로 밀어 겹친 것이 되어 상자와 공이 네 겹으로 비친다
    float3 cheap = sgSceneColor(i.screenUV + float2(radius.x, 0.0)).rgb;
    cheap = cheap + sgSceneColor(i.screenUV - float2(radius.x, 0.0)).rgb;
    cheap = cheap + sgSceneColor(i.screenUV + float2(0.0, radius.y)).rgb;
    cheap = cheap + sgSceneColor(i.screenUV - float2(0.0, radius.y)).rgb;
    blurred = cheap * 0.25;
#endif

    SG_STEP(3, blurred * shapeA);

    // 4. 유리 색과 테두리 빛. 흐린 배경에 유리 색을 비율만큼 섞는다 (어두운 색이면 글이 잘 읽히는 판이 된다).
    //    테두리는 가장자리 안쪽 가는 띠이고, 위쪽이 더 밝아 빛이 위에서 비치는 유리처럼 보인다
    float3 glass = lerp(blurred, _TintColor.rgb, saturate(_TintAmount) * open);
    float rim = max(shapeA - backdropCover(d + BACKDROP_RIM_WIDTH), 0.0);
    float top = saturate(i.uv.y);
    float rimLight = rim * lerp(0.12, 1.0, top * top);
    SG_STEP(4, float3(rimLight, rimLight, rimLight));
    glass = glass + _RimColor.rgb * (_RimGlow * rimLight * open);

    // 최종: 패널 모양으로 덮고 정점 색(Image 의 Color, CanvasGroup 의 alpha)을 곱한다.
    // 모양 안쪽은 알파 1 이라 흐린 배경이 원래 장면을 완전히 덮는다. 열기 정도만큼 투명해진다
    return float4(glass * i.color.rgb, shapeA * open * i.color.a);
}
