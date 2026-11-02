// 램프 툰 조명 효과 본체. Unity 래퍼(ToonRampLit.shader)와 웹 미리보기가 이 파일을 그대로 함께 쓴다.

// SG_STEP: 웹의 '단계 보기'가 중간 결과를 꺼내는 표시. Unity 에서는 아무 일도 하지 않는다.
#ifndef SG_STEP
#define SG_STEP(n, rgb)
#endif

// 세 채널 중 가장 큰 값. 래퍼가 넘기는 lightColor 는 '빛 색 x 세기 x 받는 그림자' 라서 이 값이 빛의 양이 된다.
float toonMax3(float3 c)
{
    return max(c.r, max(c.g, c.b));
}

// 0~1 밝기를 _Bands 개의 띠로 끊는다. 결과도 0~1 이고, 띠마다 0, 1/(N-1), ..., 1 중 하나가 된다.
// 램프 텍스처 한 줄을 읽는 대신 같은 계단을 수식으로 만든다.
float toonBands(float level)
{
    float bands = max(floor(_Bands + 0.5), 2.0);
    // 경계(1/N, 2/N, ...)가 정수 + 0.5 자리에 오도록 옮긴다. 그러면 칸 안의 위치 f 가 0.5 인 곳이 경계다.
    float t = level * bands - 0.5;
    float cell = floor(t);
    float f = t - cell;
    // 부드러움은 띠 하나 폭에 대한 비율이다. fwidth 로 픽셀 하나보다 좁아지지 않게 해 경계가 계단처럼 깨지지 않게 한다.
    // smoothstep 은 두 경계가 같으면 결과가 정의되지 않으므로 최소 폭을 둔다.
    float w = clamp(max(_Softness, fwidth(t)), 0.001, 0.5);
    float stepped = cell + smoothstep(0.5 - w, 0.5 + w, f);
    return saturate(stepped / (bands - 1.0));
}

float4 sgEffect(SgInput i)
{
    // 1. dot(N, L): 빛을 정면으로 받는 곳이 1, 빛과 직각인 곳이 0, 뒤쪽은 음수다. 툰 음영의 재료는 이 값 하나다.
    float ndl = dot(i.normalWS, i.lightDirWS);
    float ndlShown = saturate(ndl);
    SG_STEP(1, float3(ndlShown, ndlShown, ndlShown));

    // 빛의 양과 색을 나눈다. 받는 그림자 안에서는 lightColor 가 0 쪽으로 줄어든다.
    // 빛 세기가 1 이상이면 그림자 밖에서는 1 로 잘려 띠 위치가 세기와 상관없어진다.
    float lightAmount = toonMax3(i.lightColor);
    float shadow = saturate(lightAmount);
    // 빛 색은 가장 큰 채널을 1 로 맞춘 색조만 쓴다. 빛이 완전히 막힌 곳은 나눌 수 없으니 흰색으로 둔다.
    float3 lightHue = lerp(float3(1.0, 1.0, 1.0), i.lightColor / max(lightAmount, 0.0001), step(0.0001, lightAmount));

    // 그늘 넓이: 경계를 빛 쪽(+)이나 뒤쪽(-)으로 민다. 음수면 dot(N, L) 이 0 아래인 곳까지 빛이 감싼다.
    // 그림자 감쇠는 띠로 끊기 전에 곱한다. 그래야 받는 그림자도 부드러운 회색이 아니라 같은 띠로 끊긴다.
    float level = saturate((ndl - _ShadeShift) / (1.0 - _ShadeShift)) * shadow;

#ifdef SG_OFF
    // 흔한 실수: 환경광과 빛 세기가 이미 섞인 lighting 을 채널마다 띠로 끊는다 (조명 결과에 Posterize 를 거는 것과 같다).
    // 뒤쪽도 환경광만큼 밝아 0 이 되지 않고 빛 세기가 1 을 넘으니 경계가 모두 그늘 쪽으로 밀린다.
    // 환경광은 채널마다 세기가 달라(푸른 하늘빛) 채널마다 경계가 어긋나고, 경계에 색 줄무늬가 생긴다.
    float3 mixedLevel = saturate((i.lighting - float3(_ShadeShift, _ShadeShift, _ShadeShift)) / (1.0 - _ShadeShift));
    float3 mixedBand = float3(toonBands(mixedLevel.r), toonBands(mixedLevel.g), toonBands(mixedLevel.b));
    return float4(_BaseColor.rgb * lerp(_ShadeColor.rgb, lightHue, mixedBand), 1.0);
#endif

    // 2. 띠로 끊기: 매끈한 밝기가 몇 개의 평평한 단계가 된다. 경계에서만 짧게 바뀐다.
    float band = toonBands(level);
    SG_STEP(2, float3(band, band, band));

    // 3. 그늘 색: 띠 값으로 그늘 색과 빛 색 사이를 고른다. 검정으로 어둡게 하지 않고 색조를 바꾼다.
    //    그늘 색은 기본 색에 곱하는 색이라 어떤 기본 색에도 같은 분위기의 그늘이 생긴다.
    float3 tint = lerp(_ShadeColor.rgb, lightHue, band);
    SG_STEP(3, tint);

    // 최종: 기본 색에 곱한다. 환경광(lighting)은 쓰지 않는다. 그늘의 밝기는 그늘 색이 정한다.
    float3 color = _BaseColor.rgb * tint;
    SG_STEP(4, color);
    return float4(color, 1.0);
}
