// 광택 훑기 효과 본체. Unity 래퍼와 웹 미리보기가 이 파일을 그대로 함께 쓴다.
// uv 를 각도만큼 돌린 좌표의 한 축(x)을 따라 빛 띠를 옮긴다. 띠는 그 축의 한 값 근처만 밝은 마스크라서
// 돌린 각도만큼 기울어진 대각선이 된다. 띠는 이미지 알파 안에서만 화면에 남고, 색에 더하는 빛(가산)으로 얹는다.

// SG_STEP: 웹의 '단계 보기'가 중간 결과를 꺼내는 표시. Unity 에서는 아무 일도 하지 않는다.
#ifndef SG_STEP
#define SG_STEP(n, rgb)
#endif

#define SHEEN_DEG_TO_RAD 0.01745329
// 띠가 이미지 밖에서 출발하고 밖으로 완전히 빠져나가게 이동 거리에 더하는 여유 (띠 반 폭에 대한 비율)
#define SHEEN_MARGIN 1.1

// 2D 회전. 행렬을 쓰지 않는다
float2 sheenRotate(float2 p, float radians)
{
    float s = sin(radians);
    float c = cos(radians);
    return float2(p.x * c - p.y * s, p.x * s + p.y * c);
}

// 띠 하나의 세기 (0~1). d 는 띠 가운데까지의 거리(돌린 좌표의 x), halfWidth 는 반 폭.
// 부드러움이 0 이면 가장자리가 또렷하고 1 이면 가운데에서 바깥까지 서서히 옅어진다.
// fwidth(d) 는 화면 한 픽셀 동안 d 가 변하는 양이다. 부드러움 0 에서도 1픽셀만큼은 부드럽게 해 계단을 막는다.
float sheenBand(float d, float halfWidth, float softness)
{
    float pixel = max(fwidth(d), 0.00001);
    float inner = halfWidth * (1.0 - saturate(softness));
    return 1.0 - smoothstep(inner - pixel * 0.5, halfWidth + pixel * 0.5, abs(d));
}

float4 sgEffect(SgInput i)
{
    float4 tex = SG_TEX(_MainTex, i.uv);

    // 0. 좌표: 가운데가 원점이고 이미지의 짧은 변이 1 인 공간. 긴 변은 실제 가로세로 비만큼 길다.
    //    uv 를 그대로 돌리면 가로로 긴 Image 에서 uv 1 칸이 화면에서 더 길어 띠의 기울기가 눕는다.
    //    셰이더는 Image 크기를 모르므로 uv 가 화면 한 픽셀에 얼마나 변하는지(ddx, ddy)로 비율을 잰다 (ui-sdf-shape 와 같은 방법).
    //    Image 가 납작해져(X 스케일 0) 비율이 0 으로 가도 0 으로 나누지 않게 아래를 막는다.
    float2 du = float2(ddx(i.uv.x), ddy(i.uv.x));
    float2 dv = float2(ddx(i.uv.y), ddy(i.uv.y));
    float aspect = max(length(dv) / max(length(du), 0.000001), 0.0001);
    float unit = min(aspect, 1.0);
    float2 halfImage = float2(aspect, 1.0) * 0.5 / unit;
    float2 p = (i.uv - float2(0.5, 0.5)) * 2.0 * halfImage;

    // 1. 돌린 좌표. x 축이 띠가 나아가는 방향이고, x 가 같은 점을 이은 선이 띠의 방향이다.
    //    각도가 양수면 띠 위쪽이 오른쪽으로 기울고(/ 모양) 띠는 왼쪽 위에서 오른쪽 아래로 간다.
    //    0 이면 세로 띠가 왼쪽에서 오른쪽으로 간다.
    float angle = _SheenAngle * SHEEN_DEG_TO_RAD;
    float2 r = sheenRotate(p, angle);
    // 띠가 지나갈 거리: 이미지 네 모서리 중 진행 방향으로 가장 먼 곳 + 띠 반 폭. 각도와 비율이 바뀌어도
    // 띠가 항상 이미지 밖에서 출발해 밖으로 빠져나가므로 주기의 시작과 끝에서 띠가 튀어나오거나 사라지지 않는다
    float halfWidth = _SheenWidth * 0.5;
    float reach = abs(cos(angle)) * halfImage.x + abs(sin(angle)) * halfImage.y + halfWidth * SHEEN_MARGIN;
    float ramp = saturate(r.x / reach * 0.5 + 0.5);
    // 같은 x 를 이은 줄무늬를 겹쳐 기울어진 방향이 보이게 한다
    float stripe = 0.8 + 0.2 * step(0.5, frac(ramp * 10.0));
    SG_STEP(1, float3(ramp, ramp, ramp) * stripe);

    // 2. 띠 마스크. 한 주기 = 지나가는 시간 + 쉬는 시간. frac 으로 주기 안에서의 위치(0~1)를 구하고,
    //    앞쪽 (1 - 쉬는 비율) 동안만 띠를 -reach 에서 +reach 로 옮긴다. 나머지는 +reach 끝(이미지 밖)에서 쉰다.
    //    한 점을 띠가 지나는 빈도는 1 / 주기다. 주기 하한 1초라 1Hz 를 넘지 않는다.
    //    Range(1, 6) 은 Inspector 에서만 막고 SetFloat 나 Animator 는 그 아래 값도 넣으므로 여기서 한 번 더 막는다.
    float phase = frac(i.time / max(_SweepPeriod, 1.0));
    float travel = min(phase / max(1.0 - _SweepPause, 0.05), 1.0);
    float autoBand = sheenBand(r.x - lerp(-reach, reach, travel), halfWidth, _SheenSoftness) * step(0.5, _AutoSweep);
    // 이벤트(클릭, 획득)용 띠. C# 이 _SweepPulse 를 0 에서 1 로 올리는 동안 한 번 지나간다.
    // 0 과 1 은 둘 다 이미지 밖이라 평소 값 0 에서는 보이지 않는다. 자동 띠와 겹치면 더 밝은 쪽을 쓴다
    float pulseBand = sheenBand(r.x - lerp(-reach, reach, saturate(_SweepPulse)), halfWidth, _SheenSoftness);
    float band = max(autoBand, pulseBand);
    SG_STEP(2, float3(band, band, band));

    // 띠가 더할 빛. 1 을 넘는 색은 일반 UI 화면에서 흰색으로 포화된다
    float3 light = _SheenColor.rgb * (_SheenIntensity * band);

#ifdef SG_OFF
    // 흔한 실수: 띠를 잘 보이게 하려고 알파를 띠로 올린다 (col.a = max(col.a, sheen)).
    // 광택을 따로 만든 더하기 Image 를 위에 겹쳐도 같다. 그림 바깥 투명 여백 위로도 사각형 Image 를 가로지르는 띠가 지나간다
    return float4((tex.rgb + light) * i.color.rgb, max(tex.a, band) * i.color.a);
#endif

    // 3. 알파로 가린 띠: 화면에 실제로 더해지는 빛의 양. 알파 혼합은 색에 알파를 곱해 화면에 얹으므로,
    //    알파를 이미지 알파 그대로 두면 빛도 band * 이미지 알파만큼만 남는다. 투명 여백에서는 0, 그림 가장자리에서는 옅다.
    float masked = band * tex.a;
    // 띠가 쉬는 동안에도 어디가 그림 안인지 보이게 이미지 알파를 옅은 회색 윤곽으로 깐다 (단계 보기 전용)
    float shown = max(masked, tex.a * 0.05);
    SG_STEP(3, float3(shown, shown, shown));

    // 최종: 이미지 색에 빛을 더하고(가산) 정점 색을 곱한다. 알파는 이미지 알파 그대로다.
    // 정점 색에는 Image.color, CanvasGroup 의 alpha, Button 의 색 전환이 들어온다. 광택까지 함께 곱하므로
    // 페이드하면 광택도 사라지고, 눌림·비활성 색에서는 광택도 함께 어두워진다.
    return float4((tex.rgb + light) * i.color.rgb, tex.a * i.color.a);
}
