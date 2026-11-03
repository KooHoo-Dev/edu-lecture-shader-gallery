// 바람 흔들림 효과 본체. Unity 래퍼(WindSwayFoliage.shader)와 웹 미리보기가 이 파일을 그대로 함께 쓴다.
// 정점 단계(sgVertex)가 잎을 밀어 흔들고, 픽셀 단계(sgEffect)는 잎 색만 칠한다.
// 래퍼의 모든 패스(그림자 포함)가 같은 sgVertex 를 불러 그림자도 함께 흔들린다.

// SG_STEP: 웹의 '단계 보기'가 중간 결과를 꺼내는 표시. Unity 에서는 아무 일도 하지 않는다.
#ifndef SG_STEP
#define SG_STEP(n, rgb)
#endif

// 바람이 부는 쪽 (XZ). 오브젝트 공간 기준이다. 회전하지 않은 풀에서는 월드와 같다.
// _WindAngle 은 Y 회전처럼 읽는다: 0 은 +Z, 90 은 +X. 풀 오브젝트를 Y 로 돌리면 바람 방향도 함께 돈다.
// 웹도 Unity 좌표로 넘기므로 같은 각도면 두 화면에서 같은 쪽으로 눕는다.
float2 windDirection()
{
    float a = _WindAngle * 0.0174533;
    return float2(sin(a), cos(a));
}

// 0~1 격자 난수 (2D)
float windHash(float2 p)
{
    float3 q = frac(float3(p.x, p.y, p.x) * 0.1031);
    q = q + dot(q, q.yzx + 33.33);
    return frac((q.x + q.y) * q.z);
}

// 값 노이즈 (2D)
float windNoise(float2 p)
{
    float2 cell = floor(p);
    float2 f = frac(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = windHash(cell);
    float b = windHash(cell + float2(1.0, 0.0));
    float c = windHash(cell + float2(0.0, 1.0));
    float d = windHash(cell + float2(1.0, 1.0));
    return lerp(lerp(a, b, f.x), lerp(c, d, f.x), f.y);
}

// 돌풍 세기 0~1. 큰 노이즈 덩어리를 바람 방향으로 흘려 보내, 덩어리가 지나가는 자리의 잎이 더 눕는다.
// 덩어리 하나가 약 0.5 미터라 풀 다발(지름 약 0.9) 안에서도 센 곳과 약한 곳이 함께 생긴다.
// 값 노이즈는 0.5 근처에 몰리므로 넓혀서 약한 곳과 센 곳이 함께 보이게 한다.
float windGust(float2 xz, float2 dir, float time)
{
    float2 p = (xz - dir * (time * _WindSpeed * 0.9)) * 2.0;
    float n = windNoise(p) * 0.65 + windNoise(p * 2.1 + float2(5.2, 1.3)) * 0.35;
    return saturate((n - 0.2) / 0.6);
}

// 흔들림 마스크. 뿌리(uv.y = 0)는 0, 끝(uv.y = 1)은 1.
// 제곱하면 뿌리 근처는 거의 움직이지 않고 위쪽이 휘어, 막대처럼 통째로 기울지 않고 줄기가 휜다.
float windBendMask(float2 uv)
{
    float y = saturate(uv.y);
    return y * y;
}

// 떨림의 위상 (라디안). 오브젝트 공간 위치(xz)로 정해 자리가 다른 잎끼리 박자가 어긋난다.
// 바람에 옆으로 선 축(side)으로 크게, 바람 축(dir)으로 작게 바뀐다. 잎은 주로 바람 쪽으로 밀리므로
// 밀린 뒤의 위치로 다시 구해도(픽셀 단계의 단계 보기) 기본값에서 잎 끝이 0.4 rad 안쪽으로만 달라진다.
// 한 잎 안에서도 정점 위치가 다르므로 위상이 똑같지는 않다. 잎 폭과 잎의 원래 휨을 합쳐 정점끼리 많아야 0.2 미터쯤
// 떨어져 있어 위상이 최대 약 0.9 rad, 대부분 0.5 rad 안쪽으로 갈린다. 계수를 키우면 이웃 잎과 더 어긋나지만
// 한 잎 안에서도 더 갈려 떨림 값을 올릴 때 잎이 꼬인다.
float windFlutterPhase(float2 xz, float2 dir, float2 side)
{
    return dot(xz, side) * 4.5 + dot(xz, dir) * 1.2;
}

float3 sgVertex(float3 positionOS, float3 normalOS, float2 uv, float time)
{
    float2 dir = windDirection();
    float2 side = float2(-dir.y, dir.x);

    // 1. 마스크: 끝으로 갈수록 크게 민다.
    float bend = windBendMask(uv);

    // 2. 큰 흔들림: 늘 같은 방향으로 밀되 세기는 흘러가는 돌풍 노이즈가 정한다.
    //    느린 사인을 조금 섞어 돌풍이 없는 자리도 숨 쉬듯 출렁인다. 사인의 마루도 돌풍 노이즈처럼 바람 쪽으로 흐른다
    //    (시간에서 바람 축 위치를 뺀다. 더하면 마루가 바람을 거슬러 흐른다). 속도 0 이면 멈춘 채 기운다.
    //    _Gust 는 C# 돌풍 이벤트가 0 에서 1 로 올렸다 0 으로 내리는 값이다. 평소 세기에 더하므로 어느 세기에서도 바람을 키운다.
    float strength = _WindStrength + 0.4 * _Gust;
    float gust = windGust(positionOS.xz, dir, time);
    float wave = sin(time * _WindSpeed * 2.3 - dot(positionOS.xz, dir) * 2.5);
    float sway = strength * (lerp(0.55, gust, _Gustiness) + 0.15 * wave);

    // 3. 떨림: 잎마다 위상이 다른 작은 흔들림. 돌풍이 셀수록 더 떤다.
    float t = time * _WindSpeed * 6.5 + windFlutterPhase(positionOS.xz, dir, side);
    float2 flutter = (side * sin(t) + dir * (0.5 * sin(t * 1.7 + 1.3))) * (_Flutter * (0.5 + gust));

#ifdef SG_OFF
    // 흔한 실수: 마스크 없이 정점 전체를 민다. 뿌리까지 같은 만큼 밀려 풀 다발이 통째로 바닥 위를 미끄러진다.
    float2 slide = dir * sway + flutter;
    return positionOS + float3(slide.x, 0.0, slide.y);
#endif

    float2 offset = (dir * sway + flutter) * bend;

    // 4. 길이 보정: 뿌리(y = 0)에서 정점까지의 길이는 두고 방향만 기울인다.
    //    옆으로 민 만큼 아래로 내려와 잎이 늘어나지 않는다. 뿌리가 y = 0 인 메시 기준이다.
    float h = positionOS.y;
    float3 lean = float3(offset.x, h, offset.y);
    lean = lean * (abs(h) / max(length(lean), 0.0001));
    return float3(positionOS.x + lean.x, lean.y, positionOS.z + lean.z);
}

float4 sgEffect(SgInput i)
{
    // 단계 보기는 색만 바꾼다. 정점의 움직임은 어느 단계에서나 최종과 같다.
    float2 dir = windDirection();
    float2 side = float2(-dir.y, dir.x);

    // 1. 흔들림 마스크: 잎을 세로로 반 갈라 한쪽(uv.x < 0.5)은 uv.y 그대로, 다른 쪽은 제곱한 마스크를 칠한다.
    //    화면에 나갈 때 sRGB 로 밝아져 값을 그대로 칠하면 uv.y 는 금세 희고 제곱도 거의 곧은 그라데이션으로 보인다.
    //    한 번 더 제곱해 칠하면 화면 밝기가 값과 거의 비례해, uv.y 쪽은 고른 그라데이션, 제곱 쪽은 아래가 오래 어두운 곡선이 된다.
    //    밝은 곳일수록 많이 움직인다.
    float bend = windBendMask(i.uv);
    float mask = lerp(saturate(i.uv.y), bend, step(0.5, i.uv.x));
    float maskShown = mask * mask;
    SG_STEP(1, float3(maskShown, maskShown, maskShown));

    // 2. 큰 흔들림: 지금 그 자리의 돌풍 세기를 칠한다. 밝은 덩어리가 바람 방향으로 흘러간다.
    //    픽셀 단계의 positionOS 는 밀린 뒤의 위치라 정점이 쓴 값과 조금 어긋나지만, 덩어리가 커서 거의 같다.
    //    화면에 나갈 때 sRGB 로 밝아져 중간값도 거의 희게 보이므로 제곱해서 보여 준다.
    float gust = windGust(i.positionOS.xz, dir, i.time);
    float gustShown = gust * gust;
    SG_STEP(2, float3(gustShown, gustShown, gustShown));

    // 3. 떨림: 지금 떨림이 어느 쪽 끝에 있는지(0.5 + 0.5 * sin)를 회색으로 칠한다. 흰 잎과 검은 잎은 서로 반대쪽으로 떤다.
    //    잎마다 밝기가 다르고 시간에 따라 각자 박자로 깜빡여, 위상이 잎마다 다른 것이 한 장에 보인다.
    float t = i.time * _WindSpeed * 6.5 + windFlutterPhase(i.positionOS.xz, dir, side);
    float beat = 0.5 + 0.5 * sin(t);
    SG_STEP(3, float3(beat, beat, beat));

    // 4. 양면 조명. 단계 보기는 잎 색을 빼고 조명만 보여 주고, 최종은 잎 색(뿌리에서 끝으로 섞기)에 이 조명을 곱한다.
    //    잎은 Cull Off 로 뒷면도 그리지만 법선은 앞면 하나뿐이다. 앱이 앞면·뒷면을 알려 주지 않으므로,
    //    직사광을 abs(dot(N, L)) 로 구해 빛을 받는 쪽이 앞면이든 뒷면이든 똑같이 밝힌다.
    //    i.lighting 은 lightColor * saturate(dot(N, L)) + 환경광이다. 여기에 반대쪽 몫 lightColor * saturate(-dot(N, L)) 을 더하면
    //    lightColor * abs(dot(N, L)) + 환경광이 되어, 환경광을 따로 빼내지 않고도 그대로 남는다.
    //    정점을 밀어도 법선은 다시 계산하지 않는다. 얇은 잎은 조금 기울어도 음영 차이가 작다.
    float3 albedo = lerp(_RootColor.rgb, _TipColor.rgb, saturate(i.uv.y));
    float3 lighting = i.lighting + i.lightColor * saturate(-dot(i.normalWS, i.lightDirWS));
    SG_STEP(4, lighting);
    float3 color = albedo * lighting;

    // 불투명 표본이라 알파는 항상 1 이다.
    return float4(color, 1.0);
}
