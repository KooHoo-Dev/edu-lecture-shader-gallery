// 충격파 왜곡 (URP 17, HLSL). Full Screen Pass Renderer Feature 의 Pass Material 로 쓴다.
// 효과 본체는 core.hlsl 에 있고, 이 파일은 URP 가 넘겨주는 화면 텍스처를 읽는 부분만 맡는다.
Shader "ShaderGallery/ScreenShockwaveDistortion"
{
    Properties
    {
        _CenterX ("중심 X", Range(0, 1)) = 0.5
        _CenterY ("중심 Y", Range(0, 1)) = 0.35
        _Radius ("반경", Range(0, 1.5)) = 0.45
        _Width ("고리 폭", Range(0.01, 0.4)) = 0.12
        _Strength ("세기", Range(0, 0.15)) = 0.06
        _FadeRadius ("사라지는 반경", Range(0.3, 3)) = 1.5
        _Chroma ("색수차", Range(0, 1)) = 0.35
        _Haze ("아지랑이", Range(0, 1)) = 0
        _BlastRadius ("폭발 반경", Range(0, 1.5)) = 0
        _BlastStrength ("폭발 세기", Range(0, 0.15)) = 0
    }

    SubShader
    {
        Tags { "RenderType" = "Opaque" "RenderPipeline" = "UniversalPipeline" }
        ZWrite Off
        ZTest Always
        Cull Off

        Pass
        {
            Name "ScreenShockwaveDistortion"

            HLSLPROGRAM
            #pragma vertex Vert
            #pragma fragment frag

            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            // _BlitTexture, Vert, Varyings 를 제공한다.
            #include "Packages/com.unity.render-pipelines.core/Runtime/Utilities/Blit.hlsl"

            // SRP Batcher 호환: 머티리얼 값은 모두 이 버퍼 안에 둔다.
            CBUFFER_START(UnityPerMaterial)
                float _CenterX;
                float _CenterY;
                float _Radius;
                float _Width;
                float _Strength;
                float _FadeRadius;
                float _Chroma;
                float _Haze;
                float _BlastRadius;
                float _BlastStrength;
            CBUFFER_END

            // core.hlsl 이 받는 입력. 전체 화면 무대의 공통 형식이다. uv 는 왼쪽 아래가 (0, 0) 이다.
            struct SgInput
            {
                float2 uv;
                float aspect;
                float2 texelSize;
                float time;
            };

            // 밀린 좌표가 화면 밖으로 나가도 가장자리 색을 읽도록 Clamp 샘플러를 쓴다.
            float4 sgSource(float2 uv)
            {
                return SAMPLE_TEXTURE2D_X(_BlitTexture, sampler_LinearClamp, uv);
            }

            #include "core.hlsl"

            float4 frag(Varyings v) : SV_Target
            {
                UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX(v);

                SgInput i;
                i.uv = v.texcoord;
                i.aspect = _ScreenParams.x / _ScreenParams.y;
                i.texelSize = _ScreenSize.zw;
                i.time = _Time.y;
                return float4(sgEffect(i).rgb, 1.0);
            }
            ENDHLSL
        }
    }
}
