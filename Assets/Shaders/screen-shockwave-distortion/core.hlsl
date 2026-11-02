// 충격파 왜곡 효과 본체. Unity 래퍼와 웹 미리보기가 이 파일을 그대로 함께 쓴다.

// SG_STEP: 웹의 '단계 보기'가 중간 결과를 꺼내는 표시. Unity 에서는 아무 일도 하지 않는다.
#ifndef SG_STEP
#define SG_STEP(n, rgb)
#endif

// 아지랑이 노이즈가 세로로 반복되는 칸 수. 시간을 이 주기로 감싸도 무늬가 끊기지 않는다.
#define SHOCKWAVE_HAZE_PERIOD 16.0

// 음수에서도 항상 0 이상을 돌려주는 나머지 (GLSL 의 mod 와 같다)
float shockwaveMod(float x, float y) { return x - y * floor(x / y); }

// 0~1 격자 난수 (2D)
float shockwaveHash(float2 p)
{
    float3 q = frac(float3(p.x, p.y, p.x) * 0.1031);
    q = q + dot(q, q.yzx + 33.33);
    return frac((q.x + q.y) * q.z);
}

// 값 노이즈 (2D). 세로 칸 번호를 주기로 감싸 위로 흘려도 이음매가 없다.
float shockwaveNoise(float2 p)
{
    float2 cell = floor(p);
    float2 f = frac(p);
    f = f * f * (3.0 - 2.0 * f);
    float y0 = shockwaveMod(cell.y, SHOCKWAVE_HAZE_PERIOD);
    float y1 = shockwaveMod(cell.y + 1.0, SHOCKWAVE_HAZE_PERIOD);
    float a = shockwaveHash(float2(cell.x, y0));
    float b = shockwaveHash(float2(cell.x + 1.0, y0));
    float c = shockwaveHash(float2(cell.x, y1));
    float d = shockwaveHash(float2(cell.x + 1.0, y1));
    return lerp(lerp(a, b, f.x), lerp(c, d, f.x), f.y);
}

// 고리 마스크: 중심 거리가 반경에서 폭 안쪽이면 1 에 가깝고, 벗어날수록 부드럽게 0 이 된다.
float shockwaveRing(float dist, float radius)
{
    float width = max(_Width, 0.001);
    return 1.0 - smoothstep(0.0, width, abs(dist - radius));
}

// 감쇠: 고리가 퍼질수록 약해져 '사라지는 반경'에 닿으면 0 이 된다. 화면 끝까지 같은 세기로 찢어지지 않게 한다.
float shockwaveFade(float radius)
{
    return saturate(1.0 - radius / max(_FadeRadius, 0.001));
}

// 고리 두 개의 밀기 양. 하나는 슬라이더로 세운 고리, 하나는 이벤트(C#)가 움직이는 폭발 고리다. 둘을 더한다.
float shockwavePush(float dist)
{
    float baseRing = shockwaveRing(dist, _Radius) * shockwaveFade(_Radius) * _Strength;
    float blastRing = shockwaveRing(dist, _BlastRadius) * shockwaveFade(_BlastRadius) * _BlastStrength;
    return baseRing + blastRing;
}

// 열기 아지랑이: 위로 흐르는 노이즈로 화면을 약하게 흔든다. 아래쪽일수록 세다 (땅에서 올라오는 열).
float2 shockwaveHaze(float2 uv, float aspect, float time)
{
    // 초당 칸 4개씩 위로 흐른다. 시간을 노이즈 주기로 감싸 오래 켜 두어도 떨리지 않는다.
    float rise = shockwaveMod(time * 4.0, SHOCKWAVE_HAZE_PERIOD);
    float2 q = float2(uv.x * aspect, uv.y) * 14.0 - float2(0.0, rise);
    float nx = saturate((shockwaveNoise(q) - 0.2) / 0.6) - 0.5;
    float ny = saturate((shockwaveNoise(q + float2(7.3, 3.1)) - 0.2) / 0.6) - 0.5;
    float ground = saturate(1.2 - uv.y);
    return float2(nx, ny * 0.5) * (_Haze * 0.02 * ground);
}

// 밀린 좌표로 화면을 읽고 색수차를 넣는다. 빨강은 더 밀리고 파랑은 덜 밀려 고리 가장자리에 색이 갈린다.
float3 shockwaveShade(float2 uv, float2 offset)
{
    float r = sgSource(uv - offset * (1.0 + _Chroma)).r;
    float g = sgSource(uv - offset).g;
    float b = sgSource(uv - offset * (1.0 - _Chroma)).b;
    return float3(r, g, b);
}

float4 sgEffect(SgInput i)
{
    float2 center = float2(_CenterX, _CenterY);
    float2 aspectScale = float2(i.aspect, 1.0);
    float2 haze = shockwaveHaze(i.uv, i.aspect, i.time);

    // 1. 중심 거리: 화면비를 곱해 화면 높이 단위로 잰다. 원이 원으로 보인다.
    float2 p = (i.uv - center) * aspectScale;
    float dist = length(p);
    SG_STEP(1, float3(dist, dist, dist));

#ifdef SG_OFF
    // 흔한 실수: uv 그대로 거리를 재면 가로가 화면비만큼 늘어난 타원 고리가 되고 미는 방향도 비뚤어진다.
    float2 pBad = i.uv - center;
    float distBad = length(pBad);
    float2 offsetBad = pBad / max(distBad, 0.0001) * shockwavePush(distBad) + haze;
    return float4(shockwaveShade(i.uv, offsetBad), 1.0);
#endif

    // 2. 고리 마스크: 반경 근처만 1 이다. 폭발 고리는 세기가 있을 때만 보여 준다.
    float blastOn = step(0.0001, _BlastStrength);
    float ringMask = max(shockwaveRing(dist, _Radius), shockwaveRing(dist, _BlastRadius) * blastOn);
    SG_STEP(2, float3(ringMask, ringMask, ringMask));

    // 3. 밀기 방향: 중심에서 바깥쪽 단위 벡터에 고리 마스크, 감쇠, 세기를 곱한 만큼 민다.
    float2 dir = p / max(dist, 0.0001);
    float push = shockwavePush(dist);
    // 단계 화면은 방향을 색(오른쪽 빨강, 위 초록)으로, 미는 양을 밝기로 보인다. 세기 0.05 근처에서 가장 밝다.
    SG_STEP(3, float3(dir.x * 0.5 + 0.5, dir.y * 0.5 + 0.5, 0.0) * saturate(push * 20.0));

    // 높이 단위로 계산한 밀기를 uv 단위로 되돌린다. 가로는 화면비로 나눈다.
    float2 offset = dir * push / aspectScale + haze;

    // 4. 밀어 읽기: 안쪽 좌표를 읽어 오므로 고리 위의 화면이 바깥으로 밀려 보인다. 색수차는 아직 없다.
    SG_STEP(4, sgSource(i.uv - offset).rgb);

    // 최종: 같은 밀기에 채널마다 다른 배율을 곱해 색수차를 더한다.
    return float4(shockwaveShade(i.uv, offset), 1.0);
}
