// 홀로그램 효과 본체. Unity 래퍼(HologramScanlineGlitch.shader)와 웹 미리보기가 이 파일을 그대로 함께 쓴다.
// 프레넬 테두리 + 월드 y 로 흐르는 스캔라인 + 양자화한 시간으로 가로 띠를 옆으로 미는 정점 글리치 + 깜빡임.

// SG_STEP: 웹의 '단계 보기'가 중간 결과를 꺼내는 표시. Unity 에서는 아무 일도 하지 않는다.
#ifndef SG_STEP
#define SG_STEP(n, rgb)
#endif

// 글리치 띠 개수. 오브젝트 공간 높이 1 에 4 개라 띠 하나의 폭이 0.25 다.
// 정점만 움직이므로 위아래 정점이 서로 다른 띠에 걸친 한 칸은 정점 간격과 상관없이 늘 비스듬히 찢어진다.
// Unity 기본 구는 정점 간격이 약 0.1 이라 폭 0.25 면 찢어진 한 칸 말고도 곧게 밀린 칸이 한두 개 남아 계단으로 읽힌다.
// 5 개(폭 0.2)는 곧은 칸이 거의 없어 띠가 혹처럼 꿈틀대 보였고, 3 개는 물체 3분의 1 이 통째로 미끄러졌다 (웹 24x16 구로 비교).
#define HOLOGRAM_GLITCH_BANDS 4.0
// 띠를 다시 고르는 횟수 (초당). 시간을 이 간격으로 끊어야 띠가 멈춰 있다가 한 번에 툭 튄다.
#define HOLOGRAM_GLITCH_RATE 10.0
// 글리치가 몰려 오는 구간을 정하는 횟수 (초당). 0.5 초마다 이번 구간에 글리치를 낼지 정한다.
#define HOLOGRAM_BURST_RATE 2.0
// 띠를 미는 최대 거리 (오브젝트 공간). 구 반지름 0.5 의 약 3분의 1 이다. 더 크면 띠가 몸에서 떨어져 나간 조각처럼 보인다.
#define HOLOGRAM_GLITCH_MAX 0.18
// 깜빡임 밝기를 바꾸는 횟수 (초당). 2 면 밝기가 0.5 초마다 한 번만 바뀌어 어두워졌다 돌아오는 주기가 1 초 이상이다 (2Hz 이하 규칙).
// Play 중 _Time 은 Time.timeScale 을 따르므로 배속 3 이면 이 값도 세 배가 된다. 배속이 있는 게임에서는 _Flicker 를 0 으로 둔다.
#define HOLOGRAM_FLICKER_RATE 2.0

// 0~1 격자 난수 (2D)
float hologramHash(float2 p)
{
    float3 q = frac(float3(p.x, p.y, p.x) * 0.1031);
    q = q + dot(q, q.yzx + 33.33);
    return frac((q.x + q.y) * q.z);
}

// 글리치 세기. 조절 값에 전송 끊김(_Dropout, C# 이 잠깐 올린다)을 더한다.
float hologramGlitchStrength()
{
    return saturate(_GlitchStrength + _Dropout);
}

// 높이 y 가 속한 띠의 번호. 띠 경계를 칸마다 조금씩 옮겨 늘 같은 자리만 튀지 않게 한다.
float hologramBand(float y, float slot)
{
    return floor(y * HOLOGRAM_GLITCH_BANDS + hologramHash(float2(slot, 5.3)));
}

// x: 이 높이의 띠가 지금 밀려 있으면 1. yz: 오브젝트 공간 xz 로 미는 거리.
// 정점 단계와 프래그먼트 단계가 같은 함수를 불러 같은 띠를 고른다.
float3 hologramGlitch(float y, float time)
{
    float strength = hologramGlitchStrength();
    // 시간을 끊는다. floor 로 자른 값은 다음 칸이 올 때까지 그대로라 그동안 띠가 멈춰 있다.
    float slot = floor(time * HOLOGRAM_GLITCH_RATE);
    float burstSlot = floor(time * HOLOGRAM_BURST_RATE);
    // 이번 0.5 초가 글리치 구간인지. 세기가 클수록 자주 오고, 전송 끊김 중에는 항상 온다.
    float burst = step(hologramHash(float2(burstSlot, 17.0)), strength * 0.8 + _Dropout);
    // 한 칸에 띠 몇 개만 고른다. 끊김이 셀수록 많이 고른다.
    float band = hologramBand(y, slot);
    float chosen = step(hologramHash(float2(band, slot)), 0.35 + 0.35 * _Dropout) * burst;
    // 방향을 띠마다 난수로 정한다. 한 축으로만 밀면 물체가 돌다가 그 축이 카메라를 향할 때 글리치가 안 보인다.
    float angle = hologramHash(float2(band + 31.0, slot)) * 6.2831853;
    float reach = (0.4 + 0.6 * hologramHash(float2(band, slot + 71.0))) * strength * HOLOGRAM_GLITCH_MAX * chosen;
    return float3(chosen, cos(angle) * reach, sin(angle) * reach);
}

// 정점 글리치. 고른 띠의 정점만 옆으로 민다. 높이(y)는 그대로라 띠 모양이 유지된다.
float3 sgVertex(float3 positionOS, float3 normalOS, float2 uv, float time)
{
#ifdef SG_OFF
    // 흔한 실수: 시간을 floor 로 끊지 않고 sin 에 그대로 넣는다. 띠가 툭툭 튀는 신호 오류가 아니라
    // 물체 전체가 젤리처럼 출렁이는 물결이 된다.
    float phase = positionOS.y * 14.0 + time * 6.0;
    float wave = HOLOGRAM_GLITCH_MAX * 0.5 * hologramGlitchStrength();
    return positionOS + float3(sin(phase) * wave, 0.0, cos(phase) * wave);
#endif

    float3 g = hologramGlitch(positionOS.y, time);
    return positionOS + float3(g.y, 0.0, g.z);
}

float4 sgEffect(SgInput i)
{
    // 1. 프레넬: 시선과 비스듬한 윤곽일수록 밝다. 속이 빈 빛의 껍데기처럼 보이게 하는 바탕이다.
    float rim = pow(1.0 - saturate(dot(i.normalWS, i.viewWS)), _RimPower);
    SG_STEP(1, float3(rim, rim, rim));

    // 2. 스캔라인: 월드 y 를 간격으로 나눠 frac 한 줄무늬. 시간을 빼서 위로 흐른다.
    //    월드 높이를 쓰므로 메시의 UV 이음매와 상관없이 이어지고, 물체가 돌아도 줄은 늘 수평이다.
    float cell = frac((i.positionWS.y - i.time * _ScanSpeed) / _LineSpacing);
    float lines = 1.0 - smoothstep(0.08, 0.3, abs(cell - 0.5));
    SG_STEP(2, float3(lines, lines, lines));

    // 3. 글리치 띠 마스크: 정점 단계와 같은 함수로 지금 밀린 띠를 다시 구한다.
    //    밀린 띠는 흰색, 나머지 띠는 번호의 홀짝으로 두 가지 어두운 회색이라 띠 폭이 보인다.
    float glitched = hologramGlitch(i.positionOS.y, i.time).x;
    float parity = frac(hologramBand(i.positionOS.y, floor(i.time * HOLOGRAM_GLITCH_RATE)) * 0.5) * 2.0;
    float shade = 0.04 + 0.08 * parity;
    SG_STEP(3, lerp(float3(shade, shade, shade), float3(1.0, 1.0, 1.0), glitched));

#ifdef SG_OFF
    // 효과 끄기에서는 정점이 물결로 움직이므로 띠 색 표시도 뺀다.
    glitched = 0.0;
#endif

    // 4. 깜빡임: 0.5 초 칸마다 난수로 어두워질지 정한다. 전송 끊김 중에는 절반으로 어두워진다.
    float flickSlot = floor(i.time * HOLOGRAM_FLICKER_RATE);
    float dip = step(0.5, hologramHash(float2(flickSlot, 41.0))) * (0.5 + 0.5 * hologramHash(float2(flickSlot, 43.0)));
    float flicker = (1.0 - _Flicker * 0.7 * dip) * (1.0 - 0.5 * _Dropout);

    // 최종: 테두리, 옅은 몸통, 스캔라인을 더해 밝기로 쓴다. 더하기 혼합이라 알파가 곧 밝기다.
    // 전송 끊김 중에만 밀린 띠가 흰색 쪽으로 바랜다. 평소 글리치에도 바래면 띠가 초당 10 번 밝아졌다 돌아와
    // 같은 머티리얼의 홀로그램이 모두 한꺼번에 번쩍인다. _Dropout 은 C# 제한기를 거치므로 횟수가 묶인다.
    float energy = (rim * 1.2 + 0.07 + lines * 0.35) * flicker;
    float3 color = lerp(_HoloColor.rgb, float3(1.0, 1.0, 1.0), glitched * 0.35 * _Dropout) * (1.0 + energy);
    float alpha = saturate(energy);
    SG_STEP(4, color * alpha);
    return float4(color, alpha);
}
