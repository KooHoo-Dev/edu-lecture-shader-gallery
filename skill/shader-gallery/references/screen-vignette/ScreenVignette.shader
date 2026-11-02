// 화면 비네트 (URP 17, HLSL). Full Screen Pass Renderer Feature 의 Pass Material 로 쓴다.
// 효과 본체는 core.hlsl 에 있고, 이 파일은 URP 가 넘겨주는 화면 텍스처를 읽는 부분만 맡는다.
Shader "ShaderGallery/ScreenVignette"
{
    Properties
    {
        _VignetteColor ("비네트 색", Color) = (0, 0, 0, 1)
        _Intensity ("세기", Range(0, 1)) = 0.9
        _Radius ("반경", Range(0, 1.5)) = 0.45
        _Softness ("부드러움", Range(0, 1.5)) = 0.65
        _Roundness ("원형 비율", Range(0, 1)) = 1
        _LowHealth ("저체력", Range(0, 1)) = 0
        _LowHealthColor ("저체력 색", Color) = (0.302, 0.0784, 0.0784, 1)
        _HitPulse ("피격 펄스", Range(0, 1)) = 0
        _HitColor ("피격 색", Color) = (0.4275, 0.2392, 0.2392, 1)
    }

    SubShader
    {
        Tags { "RenderType" = "Opaque" "RenderPipeline" = "UniversalPipeline" }
        ZWrite Off
        ZTest Always
        Cull Off

        Pass
        {
            Name "ScreenVignette"

            HLSLPROGRAM
            #pragma vertex Vert
            #pragma fragment frag

            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            // _BlitTexture, Vert, Varyings 를 제공한다.
            #include "Packages/com.unity.render-pipelines.core/Runtime/Utilities/Blit.hlsl"

            // SRP Batcher 호환: 머티리얼 값은 모두 이 버퍼 안에 둔다.
            CBUFFER_START(UnityPerMaterial)
                float4 _VignetteColor;
                float _Intensity;
                float _Radius;
                float _Softness;
                float _Roundness;
                float _LowHealth;
                float4 _LowHealthColor;
                float _HitPulse;
                float4 _HitColor;
            CBUFFER_END

            // core.hlsl 이 받는 입력. 전체 화면 무대의 공통 형식이다. uv 는 왼쪽 아래가 (0, 0) 이다.
            struct SgInput
            {
                float2 uv;
                float aspect;
                float time;
            };

            float4 sgSource(float2 uv)
            {
                return SAMPLE_TEXTURE2D_X(_BlitTexture, sampler_LinearClamp, uv);
            }

            #include "core.hlsl"

            float4 frag(Varyings v) : SV_Target
            {
                UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX(v);

                SgInput i;
                // XR 주의: uv (0.5, 0.5) 는 눈의 정면이 아니다. HMD 투영은 눈마다 비대칭이라
                // 비네트 중심이 두 눈에서 어긋날 수 있다 (실기기 미확인). URP 내장 Vignette 는 투영 행렬로 보정하므로
                // XR 에서는 XRI TunnelingVignetteController 나 Volume 의 Vignette 를 먼저 쓴다.
                i.uv = v.texcoord;
                i.aspect = _ScreenParams.x / _ScreenParams.y;
                i.time = _Time.y;
                return float4(sgEffect(i).rgb, 1.0);
            }
            ENDHLSL
        }
    }
}
