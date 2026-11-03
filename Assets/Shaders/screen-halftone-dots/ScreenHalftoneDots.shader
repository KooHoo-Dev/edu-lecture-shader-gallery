// 하프톤 망점 (URP 17, HLSL). Full Screen Pass Renderer Feature 의 Pass Material 로 쓴다.
// 효과 본체는 core.hlsl 에 있고, 이 파일은 URP 가 넘겨주는 화면 텍스처를 읽는 부분만 맡는다.
Shader "ShaderGallery/ScreenHalftoneDots"
{
    Properties
    {
        [Enum(Mono, 0, Cell Color, 1, CMYK, 2)] _Mode ("방식", Float) = 1
        _Rows ("줄 수 (화면 높이의 칸 수)", Range(16, 240)) = 60
        _Angle ("각도 (흑백, 칸 색)", Range(0, 90)) = 45
        _DotGain ("점 굵기 보정", Range(-0.3, 0.3)) = 0
        _InkStrength ("잉크 세기", Range(0, 1)) = 0.4
        _PaperColor ("종이 색", Color) = (0.969, 0.949, 0.902, 1)
        _InkColor ("잉크 색 (흑백)", Color) = (0.122, 0.165, 0.267, 1)
    }

    SubShader
    {
        Tags { "RenderType" = "Opaque" "RenderPipeline" = "UniversalPipeline" }
        ZWrite Off
        ZTest Always
        Cull Off

        Pass
        {
            Name "ScreenHalftoneDots"

            HLSLPROGRAM
            #pragma vertex Vert
            #pragma fragment frag

            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            // _BlitTexture, Vert, Varyings 를 제공한다.
            #include "Packages/com.unity.render-pipelines.core/Runtime/Utilities/Blit.hlsl"

            // SRP Batcher 호환: 머티리얼 값은 모두 이 버퍼 안에 둔다.
            CBUFFER_START(UnityPerMaterial)
                float _Mode;
                float _Rows;
                float _Angle;
                float _DotGain;
                float _InkStrength;
                float4 _PaperColor;
                float4 _InkColor;
            CBUFFER_END

            // core.hlsl 이 받는 입력. 전체 화면 무대의 공통 형식이다. uv 는 왼쪽 아래가 (0, 0) 이다.
            struct SgInput
            {
                float2 uv;
                float aspect;
                float2 texelSize;
                float time;
            };

            // 화면 가장자리 칸의 중심은 화면 밖에 있을 수 있다. core 가 uv 를 0~1 로 자르고 Clamp 샘플러로 가장자리 색을 읽는다.
            float4 sgSource(float2 uv)
            {
                return SAMPLE_TEXTURE2D_X(_BlitTexture, sampler_LinearClamp, uv);
            }

            #include "core.hlsl"

            float4 frag(Varyings v) : SV_Target
            {
                UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX(v);

                SgInput i;
                // XR 주의: 점 무늬가 머리에 붙은 화면 공간에 그려져 두 눈의 무늬가 장면 깊이와 맞지 않는다 (추정, 실기기 미확인).
                // XR 에서는 이 패스를 끄고, 같은 원리를 표면 음영(월드 공간)으로 옮긴다.
                i.uv = v.texcoord;
                i.aspect = _ScreenParams.x / _ScreenParams.y;
                // 화면 한 픽셀의 uv 크기. 칸 한 변의 픽셀 수를 구해 너무 작으면 원본으로 섞는 데 쓴다.
                i.texelSize = _ScreenSize.zw;
                // 점은 움직이지 않는다. 시간은 쓰지 않지만 공통 입력 형식이라 채워 둔다.
                i.time = _Time.y;
                return float4(sgEffect(i).rgb, 1.0);
            }
            ENDHLSL
        }
    }
}
