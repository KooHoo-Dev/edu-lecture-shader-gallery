// 인테리어 매핑 효과 본체. Unity 래퍼(InteriorRoomMapping.shader)와 웹 미리보기가 이 파일을 그대로 함께 쓴다.

// SG_STEP: 웹의 '단계 보기'가 중간 결과를 꺼내는 표시. Unity 에서는 아무 일도 하지 않는다.
#ifndef SG_STEP
#define SG_STEP(n, rgb)
#endif

// 아틀라스 2×2, 방 한 칸 128 px 가운데 둘레 4 px 여백을 뺀 120 px 에 방 그림이 있다 (256 px 기준 비율).
// 여백은 그림 가장자리 색을 이어 칠해 두어 밉에서 이웃 방이 번져 들어오지 않는다.
#define INTERIOR_ATLAS_PAD 0.015625
#define INTERIOR_ATLAS_SPAN 0.46875

// 0~1 격자 난수 (2D). 칸 번호로 방 종류, 반전, 불 켜짐, 커튼을 고른다.
float interiorHash(float2 p)
{
    float3 q = frac(float3(p.x, p.y, p.x) * 0.1031);
    q = q + dot(q, q.yzx + 33.33);
    return frac((q.x + q.y) * q.z);
}

// 방 그림 좌표 q(-1~1)를 방 상자 안의 점으로 되돌린다. xy 는 -1~1, z 는 깊이 비율(0 창, 1 뒷벽).
// 그림은 창에서 방 깊이만큼 물러난 눈으로 본 한 점 투시라 뒷벽이 가운데 절반 크기다.
// 텍스처 생성기(tools/textures/interior-room-mapping-rooms.mjs)가 그림을 칠할 때 쓴 것과 같은 식이다.
float3 interiorPictureToRoom(float2 q)
{
    float s = max(max(abs(q.x), abs(q.y)), 0.5);
    return float3(q.x / s, q.y / s, 1.0 / s - 1.0);
}

float4 sgEffect(SgInput i)
{
    // 0. 면 기저. 탄젠트 입력이 없으므로 오브젝트 공간 법선의 주축으로 면을 고른다.
    //    윗면·아랫면(±Y)은 창이 없는 지붕이다. 옆면은 바깥 방향, 오른쪽, 위 세 축을 정한다.
    float3 n = i.normalOS;
    float3 an = abs(n);
    float roof = step(max(an.x, an.z), an.y);
    float useX = step(an.z, an.x);
    // sign(0) 은 0 이라 기저가 무너진다. 0 이상이면 +1 로 정한다.
    float3 outward = lerp(float3(0.0, 0.0, step(0.0, n.z) * 2.0 - 1.0), float3(step(0.0, n.x) * 2.0 - 1.0, 0.0, 0.0), useX);
    float3 upAxis = float3(0.0, 1.0, 0.0);
    // 바깥에서 면을 볼 때 오른쪽이 되는 축
    float3 rightAxis = cross(outward, upAxis);

    // 1. 창 칸. 면 위 좌표를 창 수로 나눠 칸 번호(floor)와 칸 안 좌표(frac)를 얻는다.
    //    창 수는 정수로 반올림한다. Inspector 슬라이더가 소수를 넣어도 면 끝에 잘린 칸이 생기지 않는다.
    float nx = max(floor(_WindowsX + 0.5), 1.0);
    float ny = max(floor(_WindowsY + 0.5), 1.0);
    float2 facePos = float2(dot(i.positionOS, rightAxis), i.positionOS.y);
    float2 cellPos = (facePos + float2(0.5, 0.5)) * float2(nx, ny);
    float2 cellId = floor(cellPos);
    float2 f = frac(cellPos);
    SG_STEP(1, float3(f.x, f.y, 0.0) * (1.0 - roof));

    // 2. 방 상자와 시선의 교차. 오브젝트 공간 시선을 면 기저로 옮기고, 칸을 xy -1~1, 깊이를 0~1 로 맞춘 상자 좌표로 바꾼다.
    //    방 깊이는 칸 폭 × _RoomDepth (오브젝트 단위) 다.
    float3 viewOS = normalize(i.positionOS - i.cameraPosOS);
    float3 ray = float3(dot(viewOS, rightAxis) * 2.0 * nx, viewOS.y * 2.0 * ny, dot(viewOS, -outward) * nx / max(_RoomDepth, 0.01));
    float2 start = f * 2.0 - 1.0;
    // 시선이 나가는 쪽 옆벽(x), 바닥·천장(y), 뒷벽(z)까지의 거리. 가장 가까운 면이 먼저 닿는 면이다 (min).
    // 성분이 0 이면 그 면과 평행해 닿지 않는다. 아주 작은 값으로 나눠 아주 먼 거리가 되게 한다 (0 나누기 방지).
    float2 dirSign = step(float2(0.0, 0.0), ray.xy) * 2.0 - 1.0;
    float2 tWall = (float2(1.0, 1.0) - start * dirSign) / max(abs(ray.xy), float2(0.00001, 0.00001));
    float tBack = 1.0 / max(ray.z, 0.00001);
    float t = min(min(tWall.x, tWall.y), tBack);
    float3 hit = float3(start + ray.xy * t, saturate(ray.z * t));
    float isBack = step(tBack, min(tWall.x, tWall.y));
    float isSide = (1.0 - isBack) * step(tWall.x, tWall.y);
    float isFloor = (1.0 - isBack) * (1.0 - isSide);
    // 옆벽 빨강, 바닥·천장 초록, 뒷벽 파랑. 깊을수록 어둡다.
    SG_STEP(2, float3(isSide, isFloor, isBack) * (1.0 - 0.75 * hit.z) * (1.0 - roof));

    // 3. 방 그림 좌표. 그림은 창에서 방 깊이만큼 물러난 눈으로 본 한 점 투시이므로 q = xy / (1 + 깊이 비율).
    //    깊이가 비율로 들어가 약분되므로 방 깊이를 바꿔도 같은 그림을 쓰고, 면이 바뀌는 방 모서리에서도 q 가 이어진다.
    float2 q = hit.xy / (1.0 + hit.z);

#ifdef SG_OFF
    // 흔한 실수: 시선 없이 칸 안 좌표를 그대로 그림 좌표로 쓰면(방 그림을 창에 붙이기) 정면에서는 그럴듯하지만,
    // 상자가 돌아도 방 안쪽이 움직이지 않아 벽지처럼 보인다.
    q = start;
    hit = interiorPictureToRoom(q);
#endif

    // 단계 보기용: 그림 속 방 모서리(가운데 절반 크기의 뒷벽 사각형과 네 귀퉁이로 가는 대각선)를 흰 선으로 겹친다.
    // 3D 방 모서리와 겹쳐 보이면 그림 좌표가 방에 맞게 계산된 것이다.
    float qMax = max(abs(q.x), abs(q.y));
    float qLine = max(fwidth(qMax), 0.002) * 1.5;
    float roomEdges = max(1.0 - step(qLine, abs(qMax - 0.5)), (1.0 - step(qLine, abs(abs(q.x) - abs(q.y)))) * step(0.5, qMax));
    SG_STEP(3, lerp(float3(q.x * 0.5 + 0.5, q.y * 0.5 + 0.5, 0.0), float3(1.0, 1.0, 1.0), roomEdges) * (1.0 - roof));

    // 4. 방마다 다른 그림과 불. 칸 번호에 면 번호를 섞은 난수로 아틀라스 칸, 좌우 반전, 불 켜짐, 커튼을 고른다.
    //    불은 방마다 고정 난수와 비율을 비교하므로 비율이 오르면 켜진 방은 계속 켜져 있고 새 방만 더해진다.
    float faceKey = dot(outward, float3(1.0, 2.0, 3.0));
    float2 roomId = cellId + float2(faceKey * 13.7, faceKey * 7.3);
    float rKind = interiorHash(roomId);
    float rFlip = interiorHash(roomId + float2(5.3, 9.1));
    float rLight = interiorHash(roomId + float2(11.9, 2.7));
    float rCurtain = interiorHash(roomId + float2(3.1, 17.3));
    float rCurtainLook = interiorHash(roomId + float2(23.5, 6.2));

    float kind = min(floor(rKind * 4.0), 3.0);
    float2 atlasCell = float2(kind - 2.0 * floor(kind * 0.5), floor(kind * 0.5));
    float2 qRoom = float2(lerp(q.x, -q.x, step(0.5, rFlip)), q.y);
    // 칸 경계에서는 아틀라스 좌표가 끊겨 밉이 가장 작은 단계로 튄다. 그 자리는 창틀(외벽)이 덮는다.
    float2 atlasUV = atlasCell * 0.5 + float2(INTERIOR_ATLAS_PAD, INTERIOR_ATLAS_PAD) + (qRoom * 0.5 + float2(0.5, 0.5)) * INTERIOR_ATLAS_SPAN;
    float3 albedo = SG_TEX(_RoomAtlas, atlasUV).rgb;

    // 불빛은 텍스처가 아니라 여기서 더한다. 천장 가운데 등에 가까울수록 밝다. 거리는 칸 폭을 1 로 한 실제 비율로 잰다.
    float night = saturate(_Night);
    float lit = step(rLight, _LightsOn) * step(0.001, _LightsOn);
    float cellAspect = nx / ny;
    float3 roomPos = float3(hit.x * 0.5, hit.y * 0.5 * cellAspect, hit.z * _RoomDepth);
    float3 lampPos = float3(0.0, 0.5 * cellAspect, 0.5 * _RoomDepth);
    float3 toLamp = roomPos - lampPos;
    float glow = 1.0 / (1.0 + 8.0 * dot(toLamp, toLamp));
    // 천장에 붙은 등 자체
    float fixture = step(0.999, hit.y) * (1.0 - smoothstep(0.08, 0.11, length(float2(roomPos.x, roomPos.z - lampPos.z))));
    // 낮에는 창으로 든 바깥 빛이 방을 비추고, 밤이 될수록 꺼진 방은 어두워진다. 켜진 등은 밤일수록 두드러진다.
    // 바깥 빛은 2 의 거듭제곱으로 줄인다. 선형으로 줄이면 화면의 sRGB 변환이 어두운 쪽을 들어 올려 밤 0.9 에도 외벽이 환하다.
    float outside = exp2(-6.0 * night);
    float dayLight = 0.6 * outside;
    float lamp = lit * lerp(0.3, 1.0, night);
    float3 lampColor = _LightColor.rgb * lamp;
    float3 room = albedo * (float3(dayLight, dayLight, dayLight) + lampColor * (0.2 + 2.4 * glow)) + lampColor * fixture * 1.5;
    SG_STEP(4, room * (1.0 - roof));

    // 창틀: 칸 가장자리에서 두께만큼은 외벽, 그 안쪽의 얇은 띠는 어두운 창틀. 경계는 화면 한 픽셀 폭으로 부드럽게 한다.
    float2 cellSize = float2(1.0 / nx, 1.0 / ny);
    float2 edgeDist = min(f, float2(1.0, 1.0) - f) * cellSize;
    float frameW = _FrameWidth * 0.5 * min(cellSize.x, cellSize.y);
    float2 aa = max(float2(fwidth(facePos.x), fwidth(facePos.y)), float2(0.00001, 0.00001));
    float2 openAxis = smoothstep(float2(frameW, frameW) - aa, float2(frameW, frameW) + aa, edgeDist);
    float opening = openAxis.x * openAxis.y;
    float innerW = frameW + max(frameW * 0.25, 0.004);
    float2 glassAxis = smoothstep(float2(innerW, innerW) - aa, float2(innerW, innerW) + aa, edgeDist);
    float glassMask = glassAxis.x * glassAxis.y;

    // 커튼 층: 창 평면에 붙은 반투명 주름 천. 유리 안쪽 좌표(0~1)에서 양쪽 가장자리를 덮는다.
    float2 glassUV = saturate((f * cellSize - float2(innerW, innerW)) / max(cellSize - 2.0 * float2(innerW, innerW), float2(0.001, 0.001)));
    float hasCurtain = step(rCurtain, _CurtainAmount) * step(0.001, _CurtainAmount);
    float curtainW = lerp(0.14, 0.3, frac(rCurtainLook * 7.0));
    float panel = max(1.0 - smoothstep(curtainW - 0.02, curtainW, glassUV.x), smoothstep(1.0 - curtainW, 1.0 - curtainW + 0.02, glassUV.x));
    float folds = 0.78 + 0.22 * sin(glassUV.x * 48.0);
    float3 curtainColor = lerp(float3(0.62, 0.48, 0.32), float3(0.25, 0.33, 0.45), step(0.55, rCurtainLook));
    // 켜진 방의 커튼은 뒤에서 등빛을 받아 비친다.
    float3 curtain = curtainColor * folds * (float3(dayLight, dayLight, dayLight) * 1.2 + lampColor * 0.9);
    float3 interior = lerp(room, curtain, panel * hasCurtain * 0.85);

    // 유리 반사: 반사 방향의 하늘 그라데이션(큐브맵 없음). 비스듬히 볼수록 많이 비친다 (프레넬).
    float3 reflDir = reflect(-i.viewWS, i.normalWS);
    float3 skyDay = lerp(float3(0.55, 0.66, 0.8), float3(0.18, 0.34, 0.66), saturate(reflDir.y));
    float3 sky = lerp(float3(0.1, 0.1, 0.09), skyDay, smoothstep(-0.05, 0.05, reflDir.y));
    sky = lerp(float3(0.006, 0.008, 0.016), sky, outside);
    float ndv = saturate(dot(i.normalWS, i.viewWS));
    float fresnel = 0.15 + 0.85 * pow(1.0 - ndv, 2.0);
    float3 glass = lerp(interior, sky, saturate(_GlassReflect * fresnel));

    // 외벽과 창틀은 무대 빛(i.lighting)을 받고 밤이면 어두워진다.
    float3 wall = _WallColor.rgb * i.lighting * outside;
    float3 frameColor = float3(0.07, 0.07, 0.075) * i.lighting * outside;
    float3 color = lerp(wall, frameColor, opening);
    color = lerp(color, glass, glassMask);

    // 지붕(윗면, 아랫면)은 창 없이 외벽보다 조금 어둡게.
    color = lerp(color, wall * 0.7, roof);
    return float4(color, 1.0);
}
