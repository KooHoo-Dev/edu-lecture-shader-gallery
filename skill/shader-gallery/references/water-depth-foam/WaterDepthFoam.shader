// 깊이 기반 물가 거품: 씬 깊이와 비교해 물체와 만나는 곳에 거품 띠를 그리고 얕은 물을 투명하게 하는 수면 (URP 17, HLSL).
// URP Asset 의 Depth Texture 를 켜야 한다. 효과 본체는 core.hlsl 에 있고, 이 파일은 Unity 전용 부분(깊이 읽기, 혼합, 패스)만 맡는다.
Shader "ShaderGallery/WaterDepthFoam"
{
    Properties
    {
        // 물결과 거품 무늬는 core.hlsl 이 크기와 흐름을 직접 계산하므로 _NoiseTex_ST(Tiling, Offset)는 쓰지 않는다.
        // 노이즈는 sRGB 를 끈 높이 데이터라 빈 칸 기본값도 선형 0.5 인 linearGrey 로 둔다.
        // 칸이 비면 물결이 멈춘 평평한 수면과 고른 거품 띠가 된다.
        [NoScaleOffset] _NoiseTex ("노이즈 텍스처", 2D) = "linearGrey" {}
        _ShallowColor ("얕은 색", Color) = (0.2471, 0.8314, 0.7686, 1)
        _DeepColor ("깊은 색", Color) = (0.0431, 0.2078, 0.3373, 1)
        _DepthRange ("깊이 범위", Range(0.1, 3)) = 0.8
        _FoamColor ("거품 색", Color) = (0.9569, 0.9843, 1, 1)
        _FoamWidth ("거품 폭", Range(0.02, 1)) = 0.45
        _FoamBreakup ("거품 끊김", Range(0, 1)) = 0.8
        _FlowSpeed ("흐름 속도", Range(0, 2)) = 0.6
        _RippleScale ("물결 반복 수", Range(1, 12)) = 5
        _RippleStrength ("물결 세기", Range(0, 1)) = 0.5
    }

    SubShader
    {
        Tags { "RenderType" = "Transparent" "Queue" = "Transparent" "RenderPipeline" = "UniversalPipeline" }

        Pass
        {
            Name "Forward"
            Tags { "LightMode" = "UniversalForward" }

            // 알파 혼합: 얕은 곳은 바닥이 비치고 깊은 곳은 가려진다. 수면은 깊이를 쓰지 않는다.
            // 깊이를 쓰면 수면 아래 다른 투명 물체가 가려지고, 깊이 텍스처에는 어차피 들어가지 않는다.
            Blend SrcAlpha OneMinusSrcAlpha
            ZWrite Off

            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile_instancing

            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/DeclareDepthTexture.hlsl"

            // 텍스처 선언은 CBUFFER 밖에 둔다.
            TEXTURE2D(_NoiseTex);
            SAMPLER(sampler_NoiseTex);

            // SRP Batcher 호환: 머티리얼 값은 모두 이 버퍼 안에 둔다.
            CBUFFER_START(UnityPerMaterial)
                float4 _NoiseTex_TexelSize;
                float4 _ShallowColor;
                float4 _DeepColor;
                float _DepthRange;
                float4 _FoamColor;
                float _FoamWidth;
                float _FoamBreakup;
                float _FlowSpeed;
                float _RippleScale;
                float _RippleStrength;
            CBUFFER_END

            // core.hlsl 안에서 텍스처를 읽는 매크로. 웹에서는 texture() 로 바뀐다.
            #define SG_TEX(name, uv) SAMPLE_TEXTURE2D(name, sampler##name, uv)

            // core.hlsl 이 받는 입력. 깊이 무대의 공통 형식이다.
            struct SgInput
            {
                float2 uv;
                float3 positionOS;
                float3 normalWS;
                float3 viewWS;
                float2 screenUV;
                float depthDelta;
                float time;
            };

            #include "core.hlsl"

            struct Attributes
            {
                float4 positionOS : POSITION;
                float3 normalOS : NORMAL;
                float2 uv : TEXCOORD0;
                UNITY_VERTEX_INPUT_INSTANCE_ID
            };

            struct Varyings
            {
                float4 positionCS : SV_POSITION;
                float2 uv : TEXCOORD0;
                float3 positionOS : TEXCOORD1;
                float3 positionWS : TEXCOORD2;
                float3 normalWS : TEXCOORD3;
                UNITY_VERTEX_INPUT_INSTANCE_ID
                UNITY_VERTEX_OUTPUT_STEREO
            };

            Varyings vert(Attributes v)
            {
                Varyings o;
                UNITY_SETUP_INSTANCE_ID(v);
                UNITY_TRANSFER_INSTANCE_ID(v, o);
                UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO(o);
                o.positionWS = TransformObjectToWorld(v.positionOS.xyz);
                o.positionCS = TransformWorldToHClip(o.positionWS);
                o.normalWS = TransformObjectToWorldNormal(v.normalOS);
                o.positionOS = v.positionOS.xyz;
                o.uv = v.uv;
                return o;
            }

            float4 frag(Varyings v) : SV_Target
            {
                UNITY_SETUP_INSTANCE_ID(v);
                UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX(v);

                SgInput i;
                i.uv = v.uv;
                i.positionOS = v.positionOS;
                i.normalWS = normalize(v.normalWS);
                i.viewWS = GetWorldSpaceNormalizeViewDir(v.positionWS);
                i.screenUV = GetNormalizedScreenSpaceUV(v.positionCS);

                // 눈 깊이(카메라 정면 축 방향의 거리) 차이: 수면 뒤 씬 표면의 눈 깊이 - 이 수면 픽셀의 눈 깊이 (미터).
                // 수직 물 깊이가 아니다. 같은 물도 낮은 각도로 볼수록 값이 커진다.
                float sceneEye = LinearEyeDepth(SampleSceneDepth(i.screenUV), _ZBufferParams);
                float selfEye = LinearEyeDepth(v.positionWS, UNITY_MATRIX_V);
                i.depthDelta = sceneEye - selfEye;

                i.time = _Time.y;
                return sgEffect(i);
            }
            ENDHLSL
        }
    }
}
