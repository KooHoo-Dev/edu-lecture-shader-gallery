// 씬 컬러 굴절 유리 효과 본체. Unity 래퍼와 웹 미리보기가 이 파일을 그대로 함께 쓴다.

// SG_STEP: 웹의 '단계 보기'가 중간 결과를 꺼내는 표시. Unity 에서는 아무 일도 하지 않는다.
#ifndef SG_STEP
#define SG_STEP(n, rgb)
#endif

// 노이즈가 세로로 반복되는 칸 수. 흐름 거리를 이 주기로 감싸도 무늬가 끊기지 않는다.
#define REFRACTION_NOISE_PERIOD 64.0

// 격자 칸마다 고정된 난수. y 칸을 주기로 감아 세로 방향으로 반복되는 노이즈를 만든다.
float refractionHash(float3 p)
{
    p.y = p.y - REFRACTION_NOISE_PERIOD * floor(p.y / REFRACTION_NOISE_PERIOD);
    p = frac(p * 0.1031);
    p = p + dot(p, p.zyx + 31.32);
    return frac((p.x + p.y) * p.z);
}

// 3D 값 노이즈. 오브젝트 공간 위치로 읽어 UV 이음매 없이 유리에 붙는다.
float refractionValueNoise(float3 p)
{
    float3 cell = floor(p);
    float3 f = frac(p);
    f = f * f * (3.0 - 2.0 * f);
    float x00 = lerp(refractionHash(cell + float3(0.0, 0.0, 0.0)), refractionHash(cell + float3(1.0, 0.0, 0.0)), f.x);
    float x10 = lerp(refractionHash(cell + float3(0.0, 1.0, 0.0)), refractionHash(cell + float3(1.0, 1.0, 0.0)), f.x);
    float x01 = lerp(refractionHash(cell + float3(0.0, 0.0, 1.0)), refractionHash(cell + float3(1.0, 0.0, 1.0)), f.x);
    float x11 = lerp(refractionHash(cell + float3(0.0, 1.0, 1.0)), refractionHash(cell + float3(1.0, 1.0, 1.0)), f.x);
    return lerp(lerp(x00, x10, f.y), lerp(x01, x11, f.y), f.z);
}

// 큰 결과 잔 결을 섞고 -1~1 근처로 넓힌다. 값 노이즈는 0.5 근처에 몰려 그대로 쓰면 거의 밀지 않는다.
// 잔 결의 배율을 정확히 2 로 두어야 흐름 거리를 주기로 감쌀 때 두 결이 함께 이어진다.
float refractionNoise(float3 p)
{
    float n = refractionValueNoise(p) * 0.7 + refractionValueNoise(p * 2.0 + float3(11.7, 0.0, 7.9)) * 0.3;
    return saturate((n - 0.2) / 0.6) * 2.0 - 1.0;
}

// 씬 색상을 읽는다. 밀린 좌표가 화면 밖으로 나가지 않게 0~1 로 묶는다.
float3 refractionScene(float2 uv)
{
    return sgSceneColor(saturate(uv)).rgb;
}

float4 sgEffect(SgInput i)
{
    // 1. 굴절 방향: 시선이 유리 표면에서 꺾인 방향(refract)과 꺾이지 않은 방향의 차이.
    //    월드 방향이므로 카메라 오른쪽, 위쪽 축에 내려 화면에서 미는 방향으로 바꾼다.
    float3 rayWS = -i.viewWS;
    float3 bentWS = refract(rayWS, i.normalWS, 1.0 / 1.45);
    float3 bendWS = bentWS - rayWS;
    float3 rightWS = normalize(cross(float3(0.0, 1.0, 0.0), rayWS));
    float3 upWS = cross(rayWS, rightWS);
    float2 bend = float2(dot(bendWS, rightWS), dot(bendWS, upWS));
    SG_STEP(1, float3(0.5 + bend.x, 0.5 + bend.y, 0.5));

    // 2. 밀린 화면 좌표: 두께(가장자리일수록 빛이 유리 속을 길게 지난다)를 곱하고 흐르는 노이즈를 더한다.
    float rim = 1.0 - saturate(dot(i.normalWS, i.viewWS));
    float2 lens = bend * (1.0 + _Thickness * rim) * _Refraction;
    float flow = i.time * _FlowSpeed;
    flow = flow - REFRACTION_NOISE_PERIOD * floor(flow / REFRACTION_NOISE_PERIOD);
    float3 noisePos = i.positionOS * _NoiseScale - float3(0.0, flow, 0.0);
    float2 ripple = float2(refractionNoise(noisePos), refractionNoise(noisePos + float3(31.4, 0.0, 17.7))) * _NoiseStrength * 0.05;
    // 물체가 유리를 뚫고 나온 자리 근처(씬 표면까지 거리가 0 에 가까운 곳)는 덜 민다.
    // 앞으로 튀어나온 부분이 유리 안으로 끌려 들어오는 것을 줄이는 근사다. 완전한 처리는 해설의 흔한 문제를 본다.
    float contact = saturate(i.depthDelta / 0.15);
    float2 offset = (lens + ripple) * contact;
    float2 shiftedUV = i.screenUV + offset;
    float grid = step(0.92, frac(shiftedUV.x * 24.0)) + step(0.92, frac(shiftedUV.y * 24.0));
    SG_STEP(2, lerp(float3(shiftedUV.x, shiftedUV.y, 0.0), float3(1.0, 1.0, 1.0), saturate(grid)));

#ifdef SG_OFF
    // 흔한 실수: 좌표를 밀지 않고 씬 색상을 그대로 쓰면 색만 입힌 투명 판이라 뒤가 하나도 휘지 않는다.
    float3 straight = refractionScene(i.screenUV) * _GlassColor.rgb;
    float straightFresnel = pow(rim, _FresnelPower) * _FresnelStrength;
    return float4(lerp(straight, _FresnelColor.rgb, straightFresnel), 1.0);
#endif

    // 3. 휜 배경: 빨강, 초록, 파랑을 조금씩 다르게 밀어 색수차를 낸다. 많이 민 가장자리일수록 색이 갈라진다.
    float spread = _Dispersion * 0.6;
    float3 scene;
    scene.r = refractionScene(i.screenUV + offset * (1.0 + spread)).r;
    scene.g = refractionScene(shiftedUV).g;
    scene.b = refractionScene(i.screenUV + offset * (1.0 - spread)).b;
    SG_STEP(3, scene);

    // 4. 프레넬: 시선과 비스듬한 가장자리일수록 뒤가 덜 보이고 주변이 비친다.
    float fresnel = pow(rim, _FresnelPower) * _FresnelStrength;
    SG_STEP(4, float3(fresnel, fresnel, fresnel));

    // 최종: 휜 배경에 유리 색을 곱하고 가장자리에 반사 색을 섞는다.
    // 뒤 장면을 직접 읽어 그렸으므로 알파는 1 이다. 혼합으로 섞으면 휘지 않은 원래 장면이 비쳐 겹쳐 보인다.
    float3 color = lerp(scene * _GlassColor.rgb, _FresnelColor.rgb, fresnel);
    return float4(color, 1.0);
}
