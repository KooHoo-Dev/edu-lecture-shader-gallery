// 스프라이트 바람 흔들림 효과 본체. Unity 래퍼(SpriteWindSway.shader)와 웹 미리보기가 이 파일을 그대로 함께 쓴다.
// 정점 단계(sgVertex)가 위쪽 꼭짓점을 옆으로 밀어 스프라이트를 기울이고,
// 픽셀 단계(sgEffect)가 uv.x 를 높이에 따라 되돌려 곧은 기울기를 휜 모양으로 바꾼다.
// 스프라이트의 sgVertex 는 월드 위치를 받고 월드 위치를 돌려준다. Unity 는 배칭 경로에 따라 오브젝트 공간이
// 월드가 되기도 해서(동적 배칭) 오브젝트 공간은 믿을 수 없다. 월드 위치는 두 경로에서 같다.

// SG_STEP: 웹의 '단계 보기'가 중간 결과를 꺼내는 표시. Unity 에서는 아무 일도 하지 않는다.
#ifndef SG_STEP
#define SG_STEP(n, rgb)
#endif

// 밀기 값 1 이 꼭대기를 옆으로 미는 거리 (월드 유닛). 월드 단위라 Transform 의 Scale 과 상관없다.
#define SWAY_PUSH_REACH 0.45

// 0~1 격자 난수 (2D)
float swayHash(float2 p)
{
    float3 q = frac(float3(p.x, p.y, p.x) * 0.1031);
    q = q + dot(q, q.yzx + 33.33);
    return frac((q.x + q.y) * q.z);
}

// 값 노이즈 (2D)
float swayNoise(float2 p)
{
    float2 cell = floor(p);
    float2 f = frac(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = swayHash(cell);
    float b = swayHash(cell + float2(1.0, 0.0));
    float c = swayHash(cell + float2(0.0, 1.0));
    float d = swayHash(cell + float2(1.0, 1.0));
    return lerp(lerp(a, b, f.x), lerp(c, d, f.x), f.y);
}

// 돌풍 세기 0~1. 월드 x 를 따라 놓인 노이즈 덩어리(약 3 유닛)를 +x 로 흘려 보낸다.
// 화면 속도는 _WindSpeed × 1.2 유닛/초다. 덩어리가 덤불 폭보다 커서 한 덤불은 거의 함께 세지고 약해지고,
// 덤불 간격(1.7 유닛)쯤 떨어지면 세기가 갈린다.
// 값 노이즈는 0.5 근처에 몰리므로 넓혀서 약한 곳과 센 곳이 함께 보이게 한다.
float swayGust(float x, float time)
{
    float p = (x - time * _WindSpeed * 1.2) * 0.33;
    float n = swayNoise(float2(p, 0.5)) * 0.7 + swayNoise(float2(p * 2.3 + 3.1, 5.5)) * 0.3;
    return saturate((n - 0.2) / 0.6);
}

// 꼭대기(uv.y = 1)가 옆으로 밀리는 양 S (월드 유닛, + 는 오른쪽).
// 느린 사인: sin(시간 - x × 박자 어긋남) 이라 마루가 +x 로 흐르고, 자리가 다른 덤불은 박자가 어긋난다.
// 위상을 오브젝트 원점이나 positionOS 에서 얻으면 배칭 경로에 따라 모든 풀이 같은 박자가 되므로 월드 x 를 쓴다.
// 돌풍은 쏠림과 사인을 함께 키우거나 줄인다. 밀기(_Push)는 C# 과 이벤트가 0 에서 움직였다 0 으로 돌리는 더하기용 값이다.
float swayAt(float x, float time)
{
    float wave = sin(time * _WindSpeed * 1.8 - x * _PhaseSpread);
    float gust = swayGust(x, time);
    float strength = lerp(1.0, 0.3 + 1.4 * gust, _Gustiness);
    return (_Lean + _WindStrength * wave) * strength + _Push * SWAY_PUSH_REACH;
}

float3 sgVertex(float3 positionWS, float3 normalWS, float2 uv, float time)
{
    float s = swayAt(positionWS.x, time);

#ifdef SG_OFF
    // 흔한 실수: 마스크 없이 모든 꼭짓점을 같은 만큼 민다. 뿌리까지 밀려 덤불이 땅 위를 미끄러진다.
    return positionWS + float3(s, 0.0, 0.0);
#endif

    // 뿌리(uv.y = 0)는 그대로, 꼭대기(uv.y = 1)는 S 만큼. 선형 마스크라 Full Rect(정점 4개)든
    // Tight(정점 여럿)든 같은 곧은 기울기가 된다. 휨은 픽셀 단계가 맡는다.
    return positionWS + float3(s * saturate(uv.y), 0.0, 0.0);
}

float4 sgEffect(SgInput i)
{
    float y = saturate(i.uv.y);

    // 1. 흔들림 마스크: 정점이 S 에 곱하는 uv.y. 뿌리는 검고 꼭대기는 희다.
    //    화면에 나갈 때 sRGB 로 밝아지므로 제곱해 칠해야 밝기가 값과 거의 비례해 보인다.
    //    단계 보기는 알파 없이 사각형 전체를 칠해, 정점 4개짜리 사각형이 평행사변형으로 기우는 것이 보인다.
    SG_STEP(1, float3(y * y, y * y, y * y));

    // 2. 바람 값 S: 이 픽셀의 밀기 전 월드 x 로 다시 구한다. 오른쪽(+)은 주황, 왼쪽(-)은 파랑, 클수록 밝다.
    //    잎이 있는 곳은 밝게, 투명 여백은 어둡게 칠해 덤불 모양도 함께 보인다.
    float s = swayAt(i.positionWS.x, i.time);
    float shown = saturate(abs(s) / 0.5);
    float3 windColor = lerp(float3(0.15, 0.45, 1.0), float3(1.0, 0.55, 0.12), step(0.0, s)) * shown;
    float4 straight = SG_TEX(_MainTex, i.uv);
    SG_STEP(2, windColor * (0.35 + 0.65 * straight.a));

    float4 tint = i.color * _Tint;
    float shade = _Shade;

#ifdef SG_OFF
    // 정점이 통째로 밀렸으니 휨 보정 없이 그대로 칠한다.
    float4 slid = straight * tint;
    return float4(slid.rgb * shade, slid.a);
#endif

    // 3. 곧게 기울이기만: 원래 uv 로 읽으면 잎이 휘지 않고 평행사변형으로 기운다 (정점이 4개뿐이다).
    float4 leaning = straight * tint;
    SG_STEP(3, leaning.rgb * shade * leaning.a);

    // 4. 휨 보정: 정점은 높이 y 에서 S × y 만큼 밀었다. 잎 모양은 S × y² 만큼 밀린 것처럼 보이고 싶다.
    //    차이 S × (y - y²) 만큼 옆 텍셀을 읽어 되돌리면 뿌리 쪽은 거의 서 있고 끝으로 갈수록 휜다.
    //    월드 거리를 uv 거리로 바꾸는 비율은 화면 미분으로 구한다 (uv 폭 / 월드 폭).
    //    positionWS 는 밀기 전 위치라 정점이 어떻게 밀렸든 비율이 같다. 뒤집은 스프라이트(Flip X)는 비율이 음수가 되어 맞다.
    float2 uv = i.uv;
#ifndef SG_VERTEX_STAGE
    float worldStep = ddx(i.positionWS.x);
    worldStep = (worldStep < 0.0 ? -1.0 : 1.0) * max(abs(worldStep), 0.00001);
    float uvPerWorld = ddx(i.uv.x) / worldStep;
    uv.x += s * (y - y * y) * _Bend * uvPerWorld;
#endif

    // 0~1 밖은 이 스프라이트의 그림이 아니다 (Clamp 면 가장자리 열이 늘어나고, 아틀라스면 옆 그림이 끌려온다).
    float inside = step(0.0, uv.x) * step(uv.x, 1.0);
    float4 c = SG_TEX(_MainTex, uv) * tint;
    return float4(c.rgb * shade, c.a * inside);
}
