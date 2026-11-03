// 매트캡 효과 본체. Unity 래퍼(MatcapLitSphere.shader)와 웹 미리보기가 이 파일을 그대로 함께 쓴다.

// SG_STEP: 웹의 '단계 보기'가 중간 결과를 꺼내는 표시. Unity 에서는 아무 일도 하지 않는다.
#ifndef SG_STEP
#define SG_STEP(n, rgb)
#endif

// 원판 반지름(0.5) 대신 조금 안쪽까지만 읽는다. 윤곽에서 원판 가장자리 텍셀과 그 바깥이 섞이지 않게 한다.
#define MATCAP_DISK_SCALE 0.49

// 고른 채널(0 점토 R, 1 툰 G, 2 크롬 B) 하나를 꺼낸다. select 값은 범위로 비교한다.
float matcapPickChannel(float3 m)
{
    float v = m.r;
    if (_Channel > 0.5 && _Channel < 1.5)
    {
        v = m.g;
    }
    if (_Channel > 1.5)
    {
        v = m.b;
    }
    return v;
}

// 매트캡 값에 틴트를 입히고 바탕색과 합친다. 0 곱하기: 바탕색이 고유색, 매트캡이 음영. 1 더하기: 매트캡이 빛처럼 얹힌다.
float3 matcapCombine(float value)
{
    float3 lit = _MatcapColor.rgb * value;
    float3 multiplied = _BaseColor.rgb * lit;
    float3 added = _BaseColor.rgb + lit;
    return lerp(multiplied, added, step(0.5, _Combine));
}

float4 sgEffect(SgInput i)
{
    // 테두리(옥 프리셋용): 프레넬 림. 조명과 상관없이 윤곽에 더한다.
    // _RimPulse 는 웹의 자동 데모가 올렸다 내리는 더하기용 값이라 세기에 더한다 (프리셋 값을 덮어쓰지 않게).
    // 이 표본에는 C# 이 없다. 게임에서 쓰려면 직접 만든 스크립트가 renderer.material 의 이 값을 움직인다.
    float rim = pow(max(1.0 - saturate(dot(i.normalWS, i.viewWS)), 0.0001), 3.0);
    float3 rimLight = _RimColor.rgb * ((_RimIntensity + _RimPulse) * rim);

#ifdef SG_OFF
    // 흔한 실수: 카메라 축 대신 오브젝트 공간 법선 xy 로 읽는다. 물체가 돌면 구워진 빛이 카메라 쪽에 머물지 않고 물체에 붙어 함께 돈다.
    float2 badUV = i.normalOS.xy * MATCAP_DISK_SCALE + 0.5;
    float badValue = matcapPickChannel(SG_TEX(_MatcapTex, badUV).rgb);
    return float4(matcapCombine(badValue) + rimLight, 1.0);
#endif

    // 1. 화면 기준 법선: 월드 법선을 카메라의 오른쪽·위 축에 내적한다. x 는 화면 오른쪽, y 는 화면 위로 얼마나 기울었는지다.
    //    물체가 돌아도 이 값의 배치는 화면에 고정된다 (매트캡 그림의 빛이 늘 카메라 쪽에 있는 이유).
    float3 right = i.cameraRightWS;
    float3 up = i.cameraUpWS;
    float2 flatXY = float2(dot(i.normalWS, right), dot(i.normalWS, up));

    // 원근 보정: 화면 가장자리의 픽셀은 카메라 정면이 아니라 비스듬히 보인다. 이 픽셀의 시선 d 를 앞 방향으로 삼아
    // 오른쪽·위 축을 다시 세운다. 그러면 '이 픽셀에서 나를 보는 면'이 늘 매트캡 가운데에 온다. 직교 카메라는 d 가 모두 같아 차이가 없다.
    float3 d = -i.viewWS;
    float3 r = normalize(cross(up, d));
    float3 u = cross(d, r);
    float2 perspXY = float2(dot(i.normalWS, r), dot(i.normalWS, u));

    float2 xy = lerp(flatXY, perspXY, step(0.5, _Perspective));
    SG_STEP(1, float3(xy.x * 0.5 + 0.5, xy.y * 0.5 + 0.5, 0.0));

    // 2. 매트캡 읽기: -1~1 인 xy 를 원판 안의 텍스처 좌표로 옮긴다. 고른 채널 하나가 구워진 음영이다.
    float2 uv = xy * MATCAP_DISK_SCALE + 0.5;
    float value = matcapPickChannel(SG_TEX(_MatcapTex, uv).rgb);
    SG_STEP(2, float3(value, value, value));

    // 3. 원근 보정 전후 차이: 두 좌표가 얼마나 다른지 5 배로 키워 본다. 시선이 화면 정면 축에서 벗어날수록 커진다.
    float diff = length(perspXY - flatXY) * 5.0;
    SG_STEP(3, float3(diff, diff, diff));

    // 최종: 바탕색과 합치고 테두리를 더한다. 빛 계산이 없어 해를 돌려도 그대로다.
    return float4(matcapCombine(value) + rimLight, 1.0);
}
