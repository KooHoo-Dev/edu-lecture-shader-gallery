// 스크롤·왜곡 에너지: 반대로 흐르는 노이즈 두 장을 왜곡하고 끝을 흐리게 해 레이저, 마법 기운을 만드는 투명 메시 효과 (URP 17, HLSL).
// 효과 본체는 core.hlsl 에 있고, 이 파일은 Unity 전용 부분(혼합, 패스, SRP Batcher)만 맡는다.
Shader "ShaderGallery/ScrollDistortEnergy"
{
    Properties
    {
        // 타일과 흐름은 core.hlsl 이 직접 계산하므로 _NoiseTex_ST(Tiling, Offset)는 쓰지 않는다. Inspector 에서 칸을 숨긴다.
        // 노이즈는 sRGB 를 끈 데이터라 빈 칸 기본값도 선형 0.5 인 linearGrey 로 둔다.
        // "gray" 는 sRGB 0.5 라 Linear 프로젝트에서 약 0.21 로 읽혀 희미한 통만 보인다.
        // 칸이 비면 무늬 없이 고르게 빛나고 왜곡은 0 이 된다.
        [NoScaleOffset] _NoiseTex ("노이즈 텍스처", 2D) = "linearGrey" {}
        _EnergyColor ("에너지 색", Color) = (0.1608, 0.7137, 1, 1)
        _Intensity ("밝기 (HDR)", Range(0, 6)) = 2.5
        _ScrollSpeed ("흐름 속도", Range(0, 3)) = 0.8
        _Tiling ("무늬 길이 반복", Range(0.5, 4)) = 1.5
        _DistortStrength ("왜곡 세기", Range(0, 0.5)) = 0.12
        _EdgeFade ("끝단 흐림 길이", Range(0.02, 0.5)) = 0.3
    }

    SubShader
    {
        Tags { "RenderType" = "Transparent" "Queue" = "Transparent" "RenderPipeline" = "UniversalPipeline" }

        Pass
        {
            Name "Forward"
            Tags { "LightMode" = "UniversalForward" }

            // 더하기 혼합: 뒤에 빛을 더한다. 깊이를 쓰지 않아 뒤쪽 면과 다른 투명 효과가 가려지지 않는다.
            // 원통 안쪽 면도 그려 기둥에 두께가 있어 보이게 한다.
            Blend SrcAlpha One
            ZWrite Off
            Cull Off

            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile_instancing

            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"

            // 텍스처 선언은 CBUFFER 밖에 둔다.
            TEXTURE2D(_NoiseTex);
            SAMPLER(sampler_NoiseTex);

            // SRP Batcher 호환: 머티리얼 값은 모두 이 버퍼 안에 둔다.
            CBUFFER_START(UnityPerMaterial)
                float4 _NoiseTex_TexelSize;
                float4 _EnergyColor;
                float _Intensity;
                float _ScrollSpeed;
                float _Tiling;
                float _DistortStrength;
                float _EdgeFade;
            CBUFFER_END

            // core.hlsl 안에서 텍스처를 읽는 매크로. 웹에서는 texture() 로 바뀐다.
            #define SG_TEX(name, uv) SAMPLE_TEXTURE2D(name, sampler##name, uv)

            // core.hlsl 이 받는 입력. 메시 무대의 공통 형식이다.
            // 지금 core 는 uv, positionOS, time 만 쓰지만 프레넬 테두리 같은 변형을 core 에 넣어도 컴파일되게
            // 위치, 법선, 시선 방향을 함께 넘긴다. 조명을 받지 않는 발광 효과라 광원 값은 넘기지 않는다.
            struct SgInput
            {
                float2 uv;
                float3 positionOS;
                float3 positionWS;
                float3 normalWS;
                float3 viewWS;
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
                i.positionWS = v.positionWS;
                i.normalWS = normalize(v.normalWS);
                i.viewWS = GetWorldSpaceNormalizeViewDir(v.positionWS);
                i.time = _Time.y;
                return sgEffect(i);
            }
            ENDHLSL
        }
    }
}
