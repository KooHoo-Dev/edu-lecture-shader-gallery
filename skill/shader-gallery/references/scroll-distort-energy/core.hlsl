// 스크롤·왜곡 에너지 효과 본체. Unity 래퍼와 웹 미리보기가 이 파일을 그대로 함께 쓴다.

// SG_STEP: 웹의 '단계 보기'가 중간 결과를 꺼내는 표시. Unity 에서는 아무 일도 하지 않는다.
#ifndef SG_STEP
#define SG_STEP(n, rgb)
#endif

// 노이즈 텍스처 한 장을 레이어 두 장과 왜곡에 함께 쓴다. 크기(타일)와 흐르는 속도만 다르게 준다.
// 둘레 방향 타일 수는 정수여야 원통 UV 의 이음매(u = 0 과 1)에서 무늬가 끊기지 않는다.
#define SCROLL_ENERGY_WRAP_A 2.0
#define SCROLL_ENERGY_WRAP_B 3.0

// 레이어 두 장을 곱해 밝기를 만든다. 두 무늬의 밝은 곳이 겹치는 자리만 빛나므로 겹침이 시시각각 바뀐다.
// warp 는 왜곡 오프셋. 단계 보기에서는 0 을 넘겨 왜곡 전 모습을 보여 준다.
// 흐름 오프셋은 frac 으로 0~1 에 감싼다. 텍스처 주기가 1 이고 화면 전체에 같은 값이라 결과와 미분이 같고,
// 에디터를 오래 켜 두어 시간이 커져도 UV 에 큰 수가 더해지지 않아, float 정밀도가 떨어져 빠른 흐름이 떨리는 일이 없다.
float scrollEnergyLayers(float2 base, float t, float2 warp)
{
    // 레이어 A: 위로 흐른다. UV 에서 시간을 빼면 무늬는 +v 쪽(위)으로 움직여 보인다.
    float2 uvA = base * float2(SCROLL_ENERGY_WRAP_A, _Tiling) + float2(0.0, frac(-t)) + warp;
    // 레이어 B: 더 잘고 아래로 흐른다. 속도와 크기를 다르게 해야 같은 무늬가 겹쳐 보이지 않는다.
    float2 uvB = base * float2(SCROLL_ENERGY_WRAP_B, _Tiling * 1.7) + float2(0.13, frac(t * 0.7)) + warp * 1.5;
    float a = SG_TEX(_NoiseTex, uvA).r;
    float b = SG_TEX(_NoiseTex, uvB).r;
    return a * b * 2.0;
}

float4 sgEffect(SgInput i)
{
    // 원통 좌표. 둘레는 메시 UV 의 u, 길이는 오브젝트 높이(-1~1)를 0~1 로 바꿔 쓴다.
    // 길이를 위치로 구하면 메시마다 다른 뚜껑(캡) UV 에 상관없이 끝단 마스크가 정확히 양 끝에서 0 이 된다.
    float along = i.positionOS.y * 0.5 + 0.5;
    float2 base = float2(i.uv.x, along);
    // 흐른 거리 = 시간 * 속도. 실행 중에 속도를 바꾸면 그동안 흐른 시간에 변화량이 곱해져 무늬가 한 번에 튄다.
    // 속도를 연출로 바꾸려면 C# 에서 속도 * deltaTime 을 쌓은 오프셋을 넘겨 이 자리에 쓴다.
    float t = i.time * _ScrollSpeed;

    // 1. 레이어 하나: 텍스처 한 장을 위로 흘린다. 무늬가 그대로 미끄러질 뿐 모양은 변하지 않는다.
    float2 uvOne = base * float2(SCROLL_ENERGY_WRAP_A, _Tiling) + float2(0.0, frac(-t));
    float one = SG_TEX(_NoiseTex, uvOne).r;
    SG_STEP(1, float3(one, one, one));

    // 2. 두 레이어 겹침: 반대로 흐르는 레이어를 곱한다. 겹침 무늬가 계속 바뀌지만 아직 결이 곧다.
    float plain = scrollEnergyLayers(base, t, float2(0.0, 0.0));
    SG_STEP(2, float3(plain, plain, plain));

    // 3. 왜곡: 같은 텍스처를 크게, 느리게 흘려 읽은 값으로 두 레이어의 UV 를 흔든다.
    // 일렁임을 만드는 것은 노이즈가 자리마다 다른 부분이다. 0.5 를 빼든 안 빼든 그 부분은 같고 차이는 상수 이동뿐인데,
    // 반복 텍스처에서 상수 이동은 보이지 않는다. 0.5 를 빼 두는 까닭은 그 이동량이 세기에 비례하기 때문이다.
    // 빼지 않으면 왜곡 세기를 움직일 때 무늬 전체가 함께 미끄러진다. 고정된 배경을 미는 화면 왜곡이라면 화면이 통째로 밀린다.
    // 두 축에 다른 자리를 읽어 대각선으로만 흔들리지 않게 한다.
    float2 uvWarp = base * float2(1.0, _Tiling * 0.5) + float2(0.0, frac(-t * 0.35));
    float warpX = SG_TEX(_NoiseTex, uvWarp).r - 0.5;
    float warpY = SG_TEX(_NoiseTex, uvWarp + float2(0.37, 0.61)).r - 0.5;
    float2 warp = float2(warpX, warpY) * _DistortStrength;
    float energy = scrollEnergyLayers(base, t, warp);
    SG_STEP(3, float3(energy, energy, energy));

    // HDR 색: 1 을 넘는 밝기. Bloom 을 켜면 이 값이 번져 빛난다.
    float3 color = _EnergyColor.rgb * _Intensity * energy;

#ifdef SG_OFF
    // 흔한 실수: 끝단 마스크가 없으면 원통 위아래가 칼로 자른 듯 끊기고 바닥에 닿은 자리도 각이 진다.
    return float4(color, 1.0);
#endif

    // 4. 끝단 마스크: 원통 양 끝으로 갈수록 0 이 된다. 끝단 마스크 값만큼의 길이에서 서서히 사라진다.
    float mask = smoothstep(0.0, _EdgeFade, along) * smoothstep(0.0, _EdgeFade, 1.0 - along);
    SG_STEP(4, float3(mask, mask, mask));

    // 최종: 더하기 혼합이라 알파는 덮는 정도가 아니라 더할 양이다. 마스크가 0 인 끝은 아무것도 더하지 않는다.
    return float4(color, mask);
}
