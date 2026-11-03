// 클로킹 투명화 효과 본체. Unity 래퍼(CloakRefractionShimmer.shader)와 웹 미리보기가 이 파일을 그대로 함께 쓴다.

// SG_STEP: 웹의 '단계 보기'가 중간 결과를 꺼내는 표시. Unity 에서는 아무 일도 하지 않는다.
#ifndef SG_STEP
#define SG_STEP(n, rgb)
#endif

// 노이즈가 세로로 반복되는 칸 수. 일렁임 흐름 거리를 이 주기로 감싸도 무늬가 끊기지 않는다.
#define CLOAK_NOISE_PERIOD 64.0

// 화면 좌표를 미는 최대 길이 (화면 높이 단위). 이보다 멀리 읽으면 몸과 상관없는 곳이 비친다.
#define CLOAK_MAX_SHIFT 0.25

// 격자 칸마다 고정된 난수. y 칸을 주기로 감아 세로 방향으로 반복되는 노이즈를 만든다.
float cloakHash(float3 p)
{
    p.y = p.y - CLOAK_NOISE_PERIOD * floor(p.y / CLOAK_NOISE_PERIOD);
    p = frac(p * 0.1031);
    p = p + dot(p, p.zyx + 31.32);
    return frac((p.x + p.y) * p.z);
}

// 3D 값 노이즈. 오브젝트 공간 위치로 읽어 UV 이음매 없이 몸에 붙는다.
float cloakValueNoise(float3 p)
{
    float3 cell = floor(p);
    float3 f = frac(p);
    f = f * f * (3.0 - 2.0 * f);
    float x00 = lerp(cloakHash(cell + float3(0.0, 0.0, 0.0)), cloakHash(cell + float3(1.0, 0.0, 0.0)), f.x);
    float x10 = lerp(cloakHash(cell + float3(0.0, 1.0, 0.0)), cloakHash(cell + float3(1.0, 1.0, 0.0)), f.x);
    float x01 = lerp(cloakHash(cell + float3(0.0, 0.0, 1.0)), cloakHash(cell + float3(1.0, 0.0, 1.0)), f.x);
    float x11 = lerp(cloakHash(cell + float3(0.0, 1.0, 1.0)), cloakHash(cell + float3(1.0, 1.0, 1.0)), f.x);
    return lerp(lerp(x00, x10, f.y), lerp(x01, x11, f.y), f.z);
}

// 큰 결과 잔 결을 섞는다. 잔 결의 배율을 정확히 2 로 두어야 흐름 거리를 주기로 감쌀 때 두 결이 함께 이어진다.
// 결과는 0.5 를 가운데로 한 종 모양 분포다 (표준편차 약 0.14, 98% 가 0.19~0.81).
float cloakNoiseRaw(float3 p)
{
    return cloakValueNoise(p) * 0.7 + cloakValueNoise(p * 2.0 + float3(11.7, 0.0, 7.9)) * 0.3;
}

// 일렁임과 높이 경계의 흔들림용. 0~1 로 넓힌다.
float cloakNoise(float3 p)
{
    return saturate((cloakNoiseRaw(p) - 0.2) / 0.6);
}

// 노이즈 디졸브의 순서 값용. 0.5 근처에 몰린 값을 그대로 쓰면 진행값이 가운데를 지날 때 띠가 몸의 넓은 곳을 한꺼번에 덮는다.
// 종 모양 분포의 누적 함수(로지스틱 근사, 1.702 / 0.14 ≈ 12)로 펴서 0~1 의 각 구간에 몸의 비슷한 넓이가 들어가게 한다.
float cloakNoiseEven(float3 p)
{
    return 1.0 / (1.0 + exp(-12.0 * (cloakNoiseRaw(p) - 0.5)));
}

// 앞 물체 끌림 방지 (screen-refraction-glass 와 같은 가드): 밀린 좌표의 씬 표면이 몸보다 앞(눈 깊이가 작다)이면
// 밀지 않은 좌표로 돌아간다. Opaque Texture 는 앞뒤를 가리지 않고 화면 전체를 담고 있어, 그대로 읽으면 앞 물체가 몸 속에 비친다.
float2 cloakGuardUV(float2 shiftedUV, float2 screenUV, float selfEye)
{
    float2 uv = saturate(shiftedUV);
    float front = step(sgSceneDepth(uv), selfEye);
    return lerp(uv, screenUV, front);
}

float4 sgEffect(SgInput i)
{
    // 은신 진행값. 경계 띠의 자리를 정한다. 피격 노출은 띠를 움직이지 않고 마지막에 섞는 양에서 뺀다
    // (0.4초 안에 띠가 몸 전체를 두 번 훑으면 넓은 면이 번쩍이는 것처럼 보인다).
    float progress = saturate(_Cloak);
    float3 lit = _BaseColor.rgb * i.lighting;
    float facing = saturate(dot(i.normalWS, i.viewWS));

    // 1. 화면 공간 오프셋: 월드 법선을 카메라의 오른쪽, 위 축에 내려 화면에서 미는 방향을 얻는다.
    //    월드 위쪽으로 축을 만들면 카메라가 기울거나 내려다볼 때 방향이 돈다.
    //    법선 반대쪽(가운데 쪽)을 읽어 몸 뒤 장면이 돋보기처럼 조금 커 보이게 하고, 흐르는 노이즈로 일렁이게 한다.
    float2 normalSS = float2(dot(i.normalWS, i.cameraRightWS), dot(i.normalWS, i.cameraUpWS));
    float flow = i.time * _ShimmerSpeed;
    flow = flow - CLOAK_NOISE_PERIOD * floor(flow / CLOAK_NOISE_PERIOD);
    float3 shimmerPos = i.positionOS * _NoiseScale - float3(0.0, flow, 0.0);
    float2 ripple = float2(cloakNoise(shimmerPos), cloakNoise(shimmerPos + float3(31.4, 0.0, 17.7))) * 2.0 - float2(1.0, 1.0);
    //    노이즈는 법선의 3분의 1 남짓만 섞는다. 더 크면 몸 모양대로 휘는 모습이 잔결에 묻힌다.
    float2 bend = -normalSS + ripple * 0.35;
    SG_STEP(1, float3(0.5 + bend.x * 0.5, 0.5 + bend.y * 0.5, 0.5));

    // 2. 은신 마스크와 경계 띠: 픽셀마다 '언제 사라질지' 값(0~1)을 정하고 진행값이 그 값을 넘으면 감춘다.
    //    진행값을 띠 폭만큼 넓혀 0 에서는 띠가 몸 아래에 숨고 1 에서는 몸 위로 완전히 빠져나가게 한다.
    float order = 0.0;
    if (_MaskMode < 0.5)
    {
        // 높이 훑기: 발(0)에서 머리(1)로. 노이즈로 경계를 흔들어 자로 그은 선처럼 보이지 않게 한다.
        float heightNoise = cloakNoise(i.positionOS * _NoiseScale * 0.5 + float3(5.3, 1.7, 9.1)) - 0.5;
        order = saturate((i.positionOS.y - _BodyBottom) / max(_BodyHeight, 0.001) + heightNoise * 0.18);
    }
    else if (_MaskMode < 1.5)
    {
        // 노이즈 디졸브: 몸 곳곳에서 얼룩처럼 사라진다. 값이 0~1 에 고르게 퍼진 노이즈를 쓴다.
        order = cloakNoiseEven(i.positionOS * _NoiseScale * 0.5 + float3(5.3, 1.7, 9.1));
    }
    else
    {
        // 프레넬 안쪽부터: 정면(시선과 마주한 곳)이 먼저 사라지고 윤곽이 끝까지 남는다.
        // 1 - N·V 는 정면의 넓은 면에서 0 근처로 평평해 띠가 그 면을 한 번에 덮어 번쩍인다.
        // 시선과 법선 사이 각의 사인(sqrt(1 - (N·V)^2))은 둥근 몸에서 화면상 윤곽까지의 거리에 비례해 고르게 바뀐다.
        order = sqrt(saturate(1.0 - facing * facing));
    }
    float sweep = progress * (1.0 + 2.0 * _BandWidth) - _BandWidth;
    float ahead = sweep - order;
    float hide = smoothstep(-_BandWidth * 0.35, _BandWidth * 0.35, ahead);
    float band = 1.0 - smoothstep(0.0, _BandWidth, abs(ahead));
    //    단계 보기: 감춘 곳은 회색, 경계 띠는 흰색, 아직 보이는 몸은 검정.
    float maskView = max(hide * 0.25, band);
    SG_STEP(2, float3(maskView, maskView, maskView));

#ifdef SG_OFF
    // 흔한 실수: 알파만 낮추는 페이드. 굴절도 윤곽도 없이 몸이 반투명 유령이 되었다가 실루엣까지 통째로 사라진다.
    return float4(lit, 1.0 - saturate(progress - _Reveal * 0.6));
#endif

    // 3. 가드를 거친 휜 배경: 미는 양은 화면 높이 단위로 정하고 최대 길이를 묶는다.
    //    화면 좌표 x 는 화면 폭 단위라 그대로 더하면 16:9 에서 가로로 더 민다. 한 픽셀의 uv 크기로 가로를 화면비만큼 줄인다.
    //    완전 은신 토글이 켜져 있으면 끝 무렵 미는 양을 줄여 거의 보이지 않게 한다. 경계 띠 자리는 더 일렁인다.
    float calm = lerp(1.0, 0.3, _CalmAtFull * smoothstep(0.6, 1.0, progress));
    float2 shift = bend * _Refraction * calm * (1.0 + band * 1.5);
    shift = shift * min(1.0, CLOAK_MAX_SHIFT / max(length(shift), 0.00001));
    float2 pixelUV = max(float2(abs(ddx(i.screenUV.x)), abs(ddy(i.screenUV.y))), float2(0.000001, 0.000001));
    float2 offset = shift * float2(pixelUV.x / pixelUV.y, 1.0);
    //    이 픽셀(몸 표면)의 눈 깊이. 밀린 좌표의 씬 깊이와 비교해 앞 물체를 걸러 낸다.
    float selfEye = sgSceneDepth(i.screenUV) - i.depthDelta;
    float3 scene = sgSceneColor(cloakGuardUV(i.screenUV + offset, i.screenUV, selfEye)).rgb;
    SG_STEP(3, scene);

    // 4. 프레넬 테두리: 시선과 비스듬한 윤곽만 밝다. 은신한 만큼만 얹어 보이는 몸에는 테두리가 없다.
    float rim = pow(max(1.0 - facing, 0.0001), _RimPower) * _RimStrength;
    SG_STEP(4, float3(rim, rim, rim));

    // 최종: 보이는 몸과 휜 배경을 은신 마스크로 섞는다. 최대 은신이 1 보다 작으면 끝까지 몸이 조금 비친다.
    // 피격 노출(_Reveal)은 더하기용 이벤트 값이라 은신에서 뺀다. 은신을 얼마로 두었든 숨은 몸이 잠깐 반쯤 드러난다.
    // 뒤 장면을 직접 읽어 그렸으므로 알파는 1 이다. 혼합으로 섞으면 휘지 않은 원래 장면이 비쳐 겹쳐 보인다.
    float cloak = saturate(hide * _MaxCloak - _Reveal * 0.6);
    float3 color = lerp(lit, scene, cloak) + _RimColor.rgb * (rim * cloak);
    // 경계 띠는 바탕을 덮는다(lerp). 더하면 밝은 배경 위에서 하얗게 날아가 넓게 번쩍인다.
    color = lerp(color, _BandColor.rgb * _BandGlow, band * 0.85);
    return float4(color, 1.0);
}
