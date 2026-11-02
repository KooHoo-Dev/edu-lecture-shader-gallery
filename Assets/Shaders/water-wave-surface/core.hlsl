// 물결 수면 효과 본체. Unity 래퍼(WaterWaveSurface.shader)와 웹 미리보기가 이 파일을 그대로 함께 쓴다.
// 정점 단계(sgVertex)가 사인파 세 개를 더한 높이로 평면을 오르내리게 하고,
// 픽셀 단계(sgEffect)가 같은 식의 도함수로 법선을 다시 구해 프레넬과 반사광을 칠한다.
// 파도는 오브젝트 공간 xz 로 계산한다. 평면을 키우면 파도도 함께 커지고, 평면을 Y 로 돌리면 파도 방향도 함께 돈다.
// 값은 한 변 10 m, 100 칸(정점 간격 0.1 m)인 평면을 크기 1 로 둔 호수에 맞췄다 (WaterSurfaceGrid.cs 가 만드는 메시).

// SG_STEP: 웹의 '단계 보기'가 중간 결과를 꺼내는 표시. Unity 에서는 아무 일도 하지 않는다.
#ifndef SG_STEP
#define SG_STEP(n, rgb)
#endif

// 오브젝트 공간 법선을 월드로 바꾸는 자리. 행렬은 공통 문법에서 쓸 수 없어 Unity 래퍼가 include 앞에서
// TransformObjectToWorldNormal 로 정의한다. 웹 무대의 평면은 돌지 않고 크기도 1 이라
// 오브젝트 축과 월드 축이 같으므로 그대로 둔다.
#ifndef WAVE_NORMAL_TO_WORLD
#define WAVE_NORMAL_TO_WORLD(n) (n)
#endif

#define WAVE_TAU 6.2831853

// 파도 하나. x 는 높이, y 와 z 는 높이를 x, z 로 미분한 기울기 (dh/dx, dh/dz).
// 높이 = 진폭 * sin(k * (방향 · 위치) - 위상). k = 2π / 파장.
// 미분하면 진폭 * k * cos(...) * 방향 이라 높이와 같은 sin, cos 으로 기울기가 바로 나온다 (GPU Gems 1장).
// 위상은 마루가 1초에 속도만큼 나아가도록 frac 으로 한 주기 안에 감싼다. sin 은 2π 마다 같아 결과는 같고,
// 오래 켜 두어도 큰 수가 쌓여 파도가 떨리지 않는다.
float3 waveOne(float2 xz, float angleDeg, float lambda, float amp, float speed, float time)
{
    float a = angleDeg * 0.0174533;
    // 각도는 Y 회전처럼 읽는다: 0 은 +Z, 90 은 +X 쪽으로 나아간다.
    float2 dir = float2(sin(a), cos(a));
    float k = WAVE_TAU / lambda;
    float phase = k * dot(dir, xz) - WAVE_TAU * frac(time * speed / lambda);
    float s = sin(phase);
    float c = amp * k * cos(phase);
    return float3(amp * s, c * dir.x, c * dir.y);
}

// 사인파 세 개의 합. 조절 값은 첫 파도의 높이, 파장, 속도, 방향뿐이고 나머지 둘은 일정 비율로 만든다.
// 방향을 엇갈려 두어야 마루가 한 줄로 늘어선 골판지 모양이 되지 않는다.
// 둘째는 55도 돌고 파장 0.77 배, 셋째는 -40도 돌고 파장 0.58 배다. 진폭도 함께 줄여 짧은 파도가 덜 가파르게 했다.
// 깊은 물에서는 긴 파도가 빠르다(속도가 파장의 제곱근에 비례). 그래서 속도도 0.88 배, 0.76 배로 줄였다.
// 가장 짧은 셋째 파장 = 첫 파장 * 0.58. 첫 파장의 최솟값 0.8 에서 약 0.46 으로, 100 칸 평면의 정점 간격(0.1)의 4 배가 넘는다.
// 정점 간격 1 인 Unity 기본 Plane 에서는 첫 파장을 4 m 이상으로 올려야 짧은 파도가 정점 사이에서 깨지지 않는다.
// 그래도 가장 짧은 파도(약 2.3 m)에 정점이 두세 개뿐이라 윤곽이 조금 꺾이므로 촘촘한 평면을 권한다.
float3 waveSum(float2 xz, float time)
{
    float3 w = waveOne(xz, _WaveAngle, _WaveLength, _WaveHeight, _WaveSpeed, time);
    w = w + waveOne(xz, _WaveAngle + 55.0, _WaveLength * 0.77, _WaveHeight * 0.6, _WaveSpeed * 0.88, time);
    w = w + waveOne(xz, _WaveAngle - 40.0, _WaveLength * 0.58, _WaveHeight * 0.4, _WaveSpeed * 0.76, time);
    return w;
}

// 정점 단계: 높이만 바꾼다. 법선은 여기서 넘길 방법이 없어(sgVertex 는 위치만 돌려준다) sgEffect 에서 다시 구한다.
float3 sgVertex(float3 positionOS, float3 normalOS, float2 uv, float time)
{
    float h = waveSum(positionOS.xz, time).x;
    return float3(positionOS.x, positionOS.y + h, positionOS.z);
}

float4 sgEffect(SgInput i)
{
    // 픽셀 단계의 positionOS 는 밀린 뒤의 위치다. 높이(y)만 밀었으므로 xz 는 원래 자리 그대로라
    // 정점과 같은 식에 넣으면 이 픽셀 자리의 높이와 기울기가 정확히 나온다.
    float3 w = waveSum(i.positionOS.xz, i.time);

    // 1. 파도 높이: 세 파도 진폭의 합(1 + 0.6 + 0.4 = 2)으로 나눠 -1~1 을 0~1 회색으로 본다.
    //    화면에 나갈 때 sRGB 로 밝아져 그대로 칠하면 거의 다 희게 보이므로 제곱해서 보여 준다.
    float h01 = saturate(0.5 + 0.5 * w.x / max(_WaveHeight * 2.0, 0.0001));
    float hShown = h01 * h01;
    SG_STEP(1, float3(hShown, hShown, hShown));

    // 시선 쪽과 광원 쪽의 가운데 방향 (Blinn-Phong 하프 벡터). 광원은 씬의 주 광원이다.
    float3 v = i.viewWS;
    float3 halfDir = normalize(i.lightDirWS + v);

#ifdef SG_OFF
    // 흔한 실수: 정점만 밀고 법선은 평면의 원래 법선(위쪽)을 그대로 쓴다.
    // 윤곽은 출렁이는데 프레넬과 반사광이 물결을 모르니, 거리에 따라 고르게 바뀌는 평평한 판처럼 보인다.
    float3 flatN = i.normalWS;
    float fresnelOff = 0.02 + 0.98 * pow(1.0 - saturate(dot(flatN, v)), 5.0);
    float specOff = pow(saturate(dot(flatN, halfDir)), _SpecPower) * _SpecStrength;
    float3 specColorOff = i.lightColor * specOff;
    float3 colorOff = lerp(_DeepColor.rgb, _SkyColor.rgb, fresnelOff) + specColorOff;
    float specAlphaOff = max(specColorOff.r, max(specColorOff.g, specColorOff.b));
    return float4(colorOff, saturate(0.35 + fresnelOff * 1.2 + specAlphaOff));
#endif

    // 2. 파도 법선: 높이 y = h(x, z) 인 면의 법선은 (-dh/dx, 1, -dh/dz) 방향이다.
    //    오브젝트 공간에서 구했으므로 월드로 바꾼다. 픽셀마다 다시 계산해 정점이 성긴 메시에서도 음영이 매끈하다.
    float3 n = normalize(WAVE_NORMAL_TO_WORLD(normalize(float3(-w.y, 1.0, -w.z))));
    //    법선을 0~1 색으로 바꿔(R 은 x, G 는 위, B 는 z) 본다. 1단계처럼 sRGB 로 바래지 않게 제곱해서 보여 준다.
    float3 nShown = n * 0.5 + 0.5;
    SG_STEP(2, nShown * nShown);

    // 3. 프레넬 (Schlick 근사, 물의 정면 반사율 약 0.02): 수면을 비스듬히 볼수록 하늘이 많이 비친다.
    //    카메라 쪽으로 기운 물결 면은 어둡고(물빛), 먼 쪽과 카메라 반대로 기운 면은 밝다(하늘빛).
    float fresnel = 0.02 + 0.98 * pow(1.0 - saturate(dot(n, v)), 5.0);
    SG_STEP(3, float3(fresnel, fresnel, fresnel));

    // 4. 반사광 (Blinn-Phong): 법선이 하프 벡터와 거의 같을 때만 밝다. 날카로움이 클수록 점이 작고 또렷하다.
    //    lightColor 에는 그림자가 곱해져 있어 그늘진 물에는 반짝임이 없다.
    float spec = pow(saturate(dot(n, halfDir)), _SpecPower) * _SpecStrength;
    float3 specColor = i.lightColor * spec;
    SG_STEP(4, specColor);

    // 최종: 프레넬로 물빛과 하늘빛을 섞고 반사광을 더한다.
    // 알파도 프레넬로 정한다. 내려다보는 앞쪽은 프레넬이 거의 0 이라 알파가 0.35 쯤으로 아래 바닥이 비치고,
    // 비스듬한 먼 쪽은 프레넬이 커져 하늘이 덮어 불투명해진다.
    // 반사광은 알파에도 더해 반투명한 곳에서도 반짝임이 흐려지지 않게 한다.
    // 그림자가 곱해진 반사광 색의 가장 밝은 채널을 더해, 그늘에서는 알파도 올라가지 않는다.
    float3 color = lerp(_DeepColor.rgb, _SkyColor.rgb, fresnel) + specColor;
    float specAlpha = max(specColor.r, max(specColor.g, specColor.b));
    float alpha = saturate(0.35 + fresnel * 1.2 + specAlpha);
    return float4(color, alpha);
}
