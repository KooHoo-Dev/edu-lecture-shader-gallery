// 젖음과 눈 쌓임 효과 본체. Unity 래퍼(SurfaceWetSnow.shader)와 웹 미리보기가 이 파일을 그대로 함께 쓴다.

// SG_STEP: 웹의 '단계 보기'가 중간 결과를 꺼내는 표시. Unity 에서는 아무 일도 하지 않는다.
#ifndef SG_STEP
#define SG_STEP(n, rgb)
#endif

// 돌 텍스처 반복 횟수 (u, v). 구의 u 는 둘레, v 는 위아래라 2:1 로 두면 적도에서 칸이 정사각형에 가깝다.
#define SURFACE_TILING float2(6.0, 3.0)
// 노이즈가 경계를 흔드는 폭. 마스크 값(법선 y, -1~1)에 더해지는 크기다.
#define SURFACE_NOISE_AMOUNT 0.6
// 눈 반짝임 알갱이의 촘촘함 (오브젝트 공간 1 단위에 들어가는 칸 수).
#define SURFACE_GLINT_CELLS 90.0

// 격자 칸마다 고정된 난수. 같은 칸은 항상 같은 값이 나온다.
float surfaceHash(float3 p)
{
    p = frac(p * 0.1031);
    p = p + dot(p, p.zyx + 31.32);
    return frac((p.x + p.y) * p.z);
}

// 3D 값 노이즈. UV 대신 오브젝트 공간 위치를 써서 구의 이음매와 극점에서 끊기지 않고, 물체와 함께 움직인다.
float surfaceValueNoise(float3 p)
{
    float3 cell = floor(p);
    float3 f = frac(p);
    f = f * f * (3.0 - 2.0 * f);
    float x00 = lerp(surfaceHash(cell + float3(0.0, 0.0, 0.0)), surfaceHash(cell + float3(1.0, 0.0, 0.0)), f.x);
    float x10 = lerp(surfaceHash(cell + float3(0.0, 1.0, 0.0)), surfaceHash(cell + float3(1.0, 1.0, 0.0)), f.x);
    float x01 = lerp(surfaceHash(cell + float3(0.0, 0.0, 1.0)), surfaceHash(cell + float3(1.0, 0.0, 1.0)), f.x);
    float x11 = lerp(surfaceHash(cell + float3(0.0, 1.0, 1.0)), surfaceHash(cell + float3(1.0, 1.0, 1.0)), f.x);
    return lerp(lerp(x00, x10, f.y), lerp(x01, x11, f.y), f.z);
}

// 큰 덩어리와 잔 무늬를 섞고 0~1 로 넓힌다. 값 노이즈는 0.5 근처에 몰려 그대로 쓰면 경계가 거의 안 깨진다.
float surfaceNoise(float3 p)
{
    float n = surfaceValueNoise(p) * 0.6;
    n = n + surfaceValueNoise(p * 2.03 + float3(11.7, 3.1, 7.9)) * 0.28;
    n = n + surfaceValueNoise(p * 4.01 + float3(5.3, 17.2, 2.4)) * 0.12;
    return saturate((n - 0.2) / 0.6);
}

// 덮는 정도. up 은 위를 보는 정도(-1~1), coverage 는 0~1.
// 경계 위치를 coverage 로 1.35+폭(아무 데도 안 덮음)에서 -1.35-폭(전부 덮음)까지 옮긴다. 노이즈를 더해도 양 끝이 남지 않게 1 보다 넓게 잡았다.
float surfaceCoverMask(float up, float coverage)
{
    float soft = max(_Softness, 0.001);
    float edge = lerp(1.35 + soft, -1.35 - soft, saturate(coverage));
    return smoothstep(edge - soft, edge + soft, up);
}

// 블린-퐁 하이라이트. 래퍼가 URP Lit 이 아니므로 반사광은 여기서 직접 계산한다.
// 빛을 등진 면에는 생기지 않게 N·L 로 한 번 더 막는다.
float surfaceSpecular(float3 n, float3 h, float ndotl, float power)
{
    return pow(saturate(dot(n, h)), power) * step(0.0, ndotl);
}

float4 sgEffect(SgInput i)
{
    float3 n = i.normalWS;
    float3 h = normalize(i.lightDirWS + i.viewWS);
    float ndotl = dot(n, i.lightDirWS);
    // 이벤트(소나기, 눈발)는 전용 값 _Storm 을 0 에서 올렸다 0 으로 내린다. 조절 값 _Coverage 에 더해 어느 양에서도 더 덮인다.
    float coverage = saturate(_Coverage + _Storm * 0.4);

    // 1. 윗면 마스크: 월드 법선의 y 는 위를 볼수록 1, 옆이면 0, 아래면 -1 이다. 물체가 돌아도 늘 하늘 쪽이 덮인다.
    float up = n.y;
    float topMask = surfaceCoverMask(up, coverage);
    SG_STEP(1, float3(topMask, topMask, topMask));

    // 2. 노이즈로 깨기: 위치 노이즈를 법선 y 에 더해 경계를 들쭉날쭉하게 만든다. 노이즈는 물체에 붙어 함께 돈다.
    float noise = surfaceNoise(i.positionOS * _NoiseScale);
    float noiseOffset = (noise - 0.5) * SURFACE_NOISE_AMOUNT;
    float mask = surfaceCoverMask(up + noiseOffset, coverage);
    SG_STEP(2, float3(mask, mask, mask));

    // 마른 돌: 텍스처는 색이라 sRGB 로 읽어 선형 값으로 계산한다. 마른 돌은 거칠어 하이라이트가 넓고 약하다.
    float3 albedo = SG_TEX(_StoneTex, i.uv * SURFACE_TILING).rgb;
    float3 dry = albedo * i.lighting + i.lightColor * surfaceSpecular(n, h, ndotl, 12.0) * 0.04;

    // 3. 덮는 재질. 모드 0 은 젖음, 1 은 눈이다. 이 단계는 마스크 없이 표면 전체에 재질을 씌운 모습이다.
    // 젖음: 물이 틈을 채워 빛이 덜 튀어 나와 알베도가 어두워진다. 표면은 매끈해져 하이라이트가 좁고 강해진다.
    // 선형 값으로 곱하므로 화면(sRGB)에서는 덜 어두워 보인다. 0.25 배여도 화면 밝기는 절반쯤이다.
    // 어두운 색일수록 더 어두워지게 albedo 를 한 번 더 곱해 섞는다. 젖은 돌은 색이 진해 보인다.
    float3 wetAlbedo = lerp(albedo, albedo * albedo * 0.8, _WetDarkness) * lerp(1.0, 0.4, _WetDarkness);
    float wetPower = exp2(lerp(5.0, 10.0, _Gloss));
    float wetStrength = lerp(0.3, 3.0, _Gloss);
    // 물막은 비스듬히 볼수록 주변을 많이 비춘다 (프레넬). 환경광은 lighting 에서 직사광 몫을 빼서 얻는다.
    float3 ambient = max(i.lighting - i.lightColor * saturate(ndotl), float3(0.0, 0.0, 0.0));
    float fresnel = pow(1.0 - saturate(dot(n, i.viewWS)), 4.0);
    float3 wet = wetAlbedo * i.lighting + i.lightColor * surfaceSpecular(n, h, ndotl, wetPower) * wetStrength + ambient * fresnel * _Gloss;

    // 눈: 흰 색에 조명을 곱하고, 알갱이마다 법선을 조금씩 틀어 몇 개만 빛을 반사하게 한다 (반짝임).
    // 알갱이는 오브젝트 공간 칸이라 물체가 돌면 각도가 바뀌며 반짝이는 알갱이가 바뀐다.
    float3 grain = floor(i.positionOS * SURFACE_GLINT_CELLS);
    float3 jitter = float3(surfaceHash(grain), surfaceHash(grain + float3(17.0, 5.0, 3.0)), surfaceHash(grain + float3(7.0, 29.0, 13.0))) - 0.5;
    float3 glintN = normalize(n + jitter * 0.9);
    float glintPick = step(0.8, surfaceHash(grain + float3(3.0, 11.0, 23.0)));
    float glint = glintPick * surfaceSpecular(glintN, h, ndotl, 300.0) * lerp(0.0, 6.0, _Gloss);
    float3 snow = _SnowColor.rgb * i.lighting + i.lightColor * (surfaceSpecular(n, h, ndotl, 10.0) * 0.08 + glint);

    float isSnow = step(0.5, _Mode);
    float3 cover = lerp(wet, snow, isSnow);
    SG_STEP(3, cover);

#ifdef SG_OFF
    // 흔한 실수: 오브젝트 공간 법선으로 위쪽을 고른다. 마스크가 물체에 붙어 물체가 돌거나 기울면 덮인 자리가 옆과 아래로 돌아간다.
    // 이 무대는 Y 축으로만 돌아 normalOS.y 가 normalWS.y 와 같아서 그대로 쓰면 차이가 안 보인다.
    // 그래서 이 공을 Z 축으로 90도 눕혀 놓은 물체로 친다. 눕힌 물체의 normalOS.y 는 처음에 월드 -X(화면 왼쪽)를 가리키고 물체와 함께 돈다.
    float wrongUp = -i.normalOS.x;
    float wrongMask = surfaceCoverMask(wrongUp + noiseOffset, coverage);
    return float4(lerp(dry, cover, wrongMask), 1.0);
#endif

    // 4. 최종: 마른 돌과 덮는 재질을 2단계 마스크로 섞는다. 불투명 표본이라 알파는 항상 1 이다.
    float3 color = lerp(dry, cover, mask);
    SG_STEP(4, color);
    return float4(color, 1.0);
}
