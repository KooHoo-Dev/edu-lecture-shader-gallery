// 화면 전환 와이프 (URP 17, HLSL). Full Screen Pass Renderer Feature 의 Pass Material 로 쓴다.
// 효과 본체는 core.hlsl 에 있고, 이 파일은 URP 가 넘겨주는 화면 텍스처를 읽는 부분만 맡는다.
Shader "ShaderGallery/ScreenTransitionWipe"
{
    Properties
    {
        _Progress ("진행", Range(0, 1)) = 0.5
        [Enum(Diamond Grid, 0, Circle, 1, Diagonal, 2)] _Pattern ("모양", Float) = 0
        _Cells ("격자 칸 수", Range(2, 24)) = 9
        _Softness ("경계 부드러움", Range(0, 0.3)) = 0.03
        _CoverColor ("덮개 색", Color) = (0.03, 0.03, 0.06, 1)
        _RimColor ("경계 빛 색", Color) = (1, 0.55, 0.2, 1)
        _RimGlow ("경계 빛 밝기", Range(0, 4)) = 0.8
    }

    SubShader
    {
        Tags { "RenderType" = "Opaque" "RenderPipeline" = "UniversalPipeline" }
        ZWrite Off
        ZTest Always
        Cull Off

        Pass
        {
            Name "ScreenTransitionWipe"

            HLSLPROGRAM
            #pragma vertex Vert
            #pragma fragment frag

            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            // _BlitTexture, Vert, Varyings 를 제공한다.
            #include "Packages/com.unity.render-pipelines.core/Runtime/Utilities/Blit.hlsl"

            // SRP Batcher 호환: 머티리얼 값은 모두 이 버퍼 안에 둔다.
            CBUFFER_START(UnityPerMaterial)
                float _Progress;
                float _Pattern;
                float _Cells;
                float _Softness;
                float4 _CoverColor;
                float4 _RimColor;
                float _RimGlow;
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
                i.uv = v.texcoord;
                i.aspect = _ScreenParams.x / _ScreenParams.y;
                i.time = _Time.y;
                return float4(sgEffect(i).rgb, 1.0);
            }
            ENDHLSL
        }
    }
}
