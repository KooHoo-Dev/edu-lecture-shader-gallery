// 지면 범위 표시 효과 본체. Unity 래퍼와 웹 미리보기가 이 파일을 그대로 함께 쓴다.
// 바닥과 소품을 덮는 상자 메시를 그리고, 깊이로 그 시선 위 씬 표면의 위치를 되살려 상자 공간 xz 로 모양을 그린다.

// SG_STEP: 웹의 '단계 보기'가 중간 결과를 꺼내는 표시. Unity 에서는 아무 일도 하지 않는다.
#ifndef SG_STEP
#define SG_STEP(n, rgb)
#endif

// 경계를 부드럽게 하는 폭 (상자 반폭 = 1 단위). fwidth 를 쓰지 않고 고정한다.
// 깊이가 끊기는 물체 윤곽에서는 이웃 픽셀의 위치가 멀리 튀어 fwidth 가 커지고, 그 자리에 선이 생긴다.
#define GROUND_AOE_EDGE 0.015

// 부채꼴 SDF. p 는 중심 기준 위치(x 오른쪽, y 가 부채꼴이 향하는 +Z), halfAngle 은 반각(라디안), radius 는 반지름.
// 안쪽이 음수다. 원호 쪽 거리와 양옆 직선 쪽 거리 중 먼 것을 쓴다.
float groundAoePie(float2 p, float halfAngle, float radius)
{
    float2 c = float2(sin(halfAngle), cos(halfAngle));
    float2 q = float2(abs(p.x), p.y);
    float toArc = length(q) - radius;
    float2 onRay = c * clamp(dot(q, c), 0.0, radius);
    float toRay = length(q - onRay) * sign(c.y * q.x - c.x * q.y);
    return max(toArc, toRay);
}

// 고른 모양의 SDF. 안쪽이 음수, 단위는 상자 반폭.
float groundAoeShape(float2 p, float radius, float inner)
{
    float circle = length(p) - radius;
    if (_Shape > 0.5 && _Shape < 1.5)
    {
        // 고리: 안쪽 반지름과 바깥 반지름 사이의 띠
        float mid = (radius + inner) * 0.5;
        float halfWidth = (radius - inner) * 0.5;
        return abs(length(p) - mid) - halfWidth;
    }
    if (_Shape > 1.5)
    {
        return groundAoePie(p, radians(_ConeAngle) * 0.5, radius);
    }
    return circle;
}

float4 sgEffect(SgInput i)
{
    // 1. 위치 복원: 이 픽셀(상자 표면)과 그 뒤에 보이는 씬 표면은 같은 시선 위에 있다.
    //    카메라에서의 거리 비율(씬 눈 깊이 / 이 픽셀의 눈 깊이)만큼 시선을 늘이면 씬 표면에 닿는다.
    //    오브젝트 공간에서도 직선과 비율은 그대로라 상자 공간 위치가 바로 나온다.
    float sceneEye = sgSceneDepth(i.screenUV);
    float pixelEye = sceneEye - i.depthDelta;
    float3 sceneOS = i.positionOS + (i.positionOS - i.cameraPosOS) * (sceneEye / pixelEye - 1.0);

    // 상자 밖이면 버린다. 상자 앞면 뒤에 보여도 실제 표면이 상자 바깥(먼 바닥, 하늘)이면 칠하지 않는다.
    float3 away = abs(sceneOS);
    float inBox = step(away.x, 0.5) * step(away.y, 0.5) * step(away.z, 0.5);

    // 되살린 위치에 1/4 간격 격자를 그어 본다. 바닥, 상자 소품, 공에 같은 격자가 이어 붙으면 복원이 맞다.
    float3 cell = frac(sceneOS * 4.0);
    float3 toLine = min(cell, float3(1.0, 1.0, 1.0) - cell);
    float3 gridLine = float3(1.0, 1.0, 1.0) - smoothstep(float3(0.0, 0.0, 0.0), float3(0.06, 0.06, 0.06), toLine);
    SG_STEP(1, (gridLine * 0.85 + float3(0.12, 0.12, 0.12)) * inBox);

    // 2. 상자 공간 좌표: xz 가 -0.5~0.5 다. 반폭을 1 로 맞춰 모양 계산에 쓴다 (반지름 1 이 상자 가장자리).
    float2 p = sceneOS.xz * 2.0;
    SG_STEP(2, float3(sceneOS.x + 0.5, sceneOS.z + 0.5, 0.0) * inBox);

    // 3. 모양 SDF: 안쪽 채움, 테두리, 시전 진행.
    float radius = _Radius;
    float inner = min(_InnerRadius, 0.98) * radius;
    float d = groundAoeShape(p, radius, inner);
    float inside = 1.0 - smoothstep(-GROUND_AOE_EDGE, GROUND_AOE_EDGE, d);
    // 테두리: 경계에서 안쪽으로 _BorderWidth 만큼의 띠
    float border = inside * smoothstep(-_BorderWidth - GROUND_AOE_EDGE, -_BorderWidth + GROUND_AOE_EDGE, d);
    // 안쪽 채움은 가장자리로 갈수록 조금 진하게 해 범위의 끝이 읽히게 한다
    float r = length(p);
    float fillBase = inside * _FillDensity * (0.4 + 0.6 * saturate(r / max(radius, 0.001)));
    // 시전 진행: 가운데(고리는 안쪽 반지름)에서 바깥으로 차오른다. _Fill 이 0 이면 아무것도 없다
    float start = 0.0;
    if (_Shape > 0.5 && _Shape < 1.5)
    {
        start = inner;
    }
    float front = lerp(start, radius, _Fill);
    float casting = saturate(_Fill * 50.0);
    float charged = inside * (1.0 - smoothstep(front - GROUND_AOE_EDGE, front + GROUND_AOE_EDGE, r)) * casting;
    // 차오르는 앞머리에 얇은 선을 둔다. 다 차면(1) 테두리와 겹치므로 사라지게 한다
    float frontLine = inside * (1.0 - smoothstep(0.0, 0.03, abs(r - front))) * casting * (1.0 - smoothstep(0.9, 1.0, _Fill));
    float shapeAlpha = saturate(border + fillBase + charged * 0.45 + frontLine * 0.7);
    SG_STEP(3, float3(shapeAlpha, shapeAlpha, shapeAlpha) * inBox);

    // 4. 옆면 감쇠: 되살린 위치의 화면 미분 두 개를 외적하면 그 표면의 법선이다.
    //    위를 향한 면(바닥, 상자 소품 윗면)만 남기고 옆면은 흐리게 한다. 위에서 내려 찍는 투영이라
    //    옆면에서는 모양이 세로로 늘어나 줄무늬가 된다.
    //    기울기는 월드 위치로 잰다. 상자 공간은 상자 크기로 눌려 있어, 납작한 상자(Scale 4, 1, 4)에서는
    //    상자 공간 기울기가 월드보다 가팔라져 완만한 비탈도 옆면으로 지워진다.
    //    눈 깊이 차(카메라 정면 축 방향)를 시선과 정면 축의 코사인으로 나누면 시선 위의 길이가 된다.
    float3 cameraForwardWS = cross(i.cameraRightWS, i.cameraUpWS);
    float3 sceneWS = i.positionWS - i.viewWS * i.depthDelta / max(abs(dot(i.viewWS, cameraForwardWS)), 1e-4);
    //    외적의 부호는 화면 y 방향(D3D 는 아래, GL 은 위)과 좌표계 손잡이에 따라 뒤집히므로,
    //    보이는 면의 법선은 카메라 쪽(viewWS 쪽)을 향한다는 점으로 부호를 맞춘다.
    //    그래서 공 아래쪽처럼 아래를 향한 면은 위를 향한 면으로 잘못 남지 않는다.
    float3 surfaceNormal = normalize(cross(ddy(sceneWS), ddx(sceneWS)));
    if (dot(surfaceNormal, i.viewWS) < 0.0)
    {
        surfaceNormal = -surfaceNormal;
    }
    float facing = smoothstep(_SideFade - 0.15, _SideFade + 0.05, surfaceNormal.y);
    // 상자 위아래 끝에서도 부드럽게 줄여 상자 경계에서 표시가 칼로 자른 듯 끊기지 않게 한다
    float heightFade = 1.0 - smoothstep(0.4, 0.5, away.y);
    SG_STEP(4, float3(facing, facing, facing) * heightFade * inBox);

#ifdef SG_OFF
    // 흔한 실수: 옆면 감쇠를 빼면 위에서 내려 찍은 모양이 소품 앞면을 타고 세로 줄무늬로 흘러내리고 공 옆면에도 얼룩이 묻는다.
    facing = 1.0;
#endif

    // 최종: 색과 밝기를 나눠 곱한다. 알파는 모양 x 감쇠 x 상자 안.
    float alpha = shapeAlpha * facing * heightFade * inBox;
    float3 color = _Color.rgb * _Intensity;
    return float4(color, alpha);
}
