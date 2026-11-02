// 팔레트 스왑 효과 본체. Unity 래퍼와 웹 미리보기가 이 파일을 그대로 함께 쓴다.
// 스프라이트는 색 대신 R 에 색 번호(0~7 을 0~1 로 나눈 회색)를 담고, 팔레트 텍스처의 한 줄에서 그 번호의 색을 읽는다.

// SG_STEP: 웹의 '단계 보기'가 중간 결과를 꺼내는 표시. Unity 에서는 아무 일도 하지 않는다.
#ifndef SG_STEP
#define SG_STEP(n, rgb)
#endif

// 팔레트의 칸 수. 팔레트 PNG 를 바꾸면 이 두 값도 맞춘다. 가로가 색 번호, 세로가 팔레트 줄이다.
#define PALETTE_COLORS 8.0
#define PALETTE_ROWS 8.0

// sRGB 로 임포트된 텍스처를 읽을 때 GPU 가 하는 변환. 효과 끄기에서 그 실수를 재현하는 데만 쓴다.
float paletteSrgbToLinear(float c)
{
    return lerp(c / 12.92, pow((c + 0.055) / 1.055, 2.4), step(0.04045, c));
}

// 슬라이더 값을 0 ~ 줄 수-1 의 정수 줄 번호로 맞춘다. 줄 사이 값으로 읽으면 두 줄 경계에 걸리기 때문이다.
float paletteRowIndex(float row)
{
    return clamp(floor(row + 0.5), 0.0, PALETTE_ROWS - 1.0);
}

float4 sgEffect(SgInput i)
{
    // 1. 인덱스 읽기: R 이 색 번호다. 이 스프라이트는 sRGB 를 끈 데이터 텍스처여야 저장한 값이 그대로 나온다.
    float4 tex = SG_TEX(_MainTex, i.uv);
    float index = tex.r;
    SG_STEP(1, float3(index, index, index) * tex.a);

#ifdef SG_OFF
    // 흔한 실수: 인덱스 스프라이트를 기본값(sRGB 켬)으로 임포트했다. GPU 가 읽으면서 감마를 풀어 값이 작아지고,
    // 색 번호가 낮은 쪽으로 밀려 머리카락이 옷 색, 피부가 옷 밝은 색이 된다. 텍스처 설정은 웹에서 바꿀 수 없어 같은 변환을 셰이더에서 한다.
    index = paletteSrgbToLinear(index);
#endif

    // 2. 팔레트 좌표: 0~1 값을 가장 가까운 정수 번호로 되돌린 뒤 '칸 가운데'(+0.5)를 읽는다.
    // 칸 왼쪽 끝(번호 / 칸 수)을 읽으면 경계에 걸려 실수 오차나 필터 때문에 옆 칸 색이 나온다.
    float slot = clamp(floor(index * (PALETTE_COLORS - 1.0) + 0.5), 0.0, PALETTE_COLORS - 1.0);
    // 피격 중에는 팔레트 줄만 피격 줄로 바꾼다. 색을 섞지 않고 통째로 바꾸는 것이 팔레트 스왑다운 번쩍임이다.
    float row = lerp(paletteRowIndex(_PaletteRow), paletteRowIndex(_HitRow), step(0.5, _HitFlash));
    // 텍스처 v 는 아래가 0 이라 위에서 셀 줄 번호를 뒤집는다. 줄도 칸 가운데를 읽는다.
    float2 paletteUV = float2((slot + 0.5) / PALETTE_COLORS, 1.0 - (row + 0.5) / PALETTE_ROWS);
    SG_STEP(2, float3(paletteUV.x, paletteUV.y, 0.0) * tex.a);

    // 3. 팔레트 색: 고른 줄의 색에 SpriteRenderer 의 Color 를 곱한다. 알파는 스프라이트 알파를 그대로 쓴다.
    float3 rgb = SG_TEX(_PaletteTex, paletteUV).rgb * i.color.rgb;
    SG_STEP(3, rgb * tex.a);

    // 최종: 색은 팔레트에서, 모양(알파)은 스프라이트에서 온다.
    return float4(rgb, tex.a * i.color.a);
}
