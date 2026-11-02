// 노이즈 불꽃: 흐르는 노이즈 두 층을 곱하고 불꽃 모양 마스크로 깎아 노랑, 주황, 빨강을 입히는 투명 더하기 메시 효과 (URP 17, HLSL).
// 효과 본체는 core.hlsl 에 있고, 이 파일은 Unity 전용 부분(혼합, 패스, SRP Batcher)만 맡는다.
Shader "ShaderGallery/FireNoiseFlame"
{
    Properties
    {
        // 크기와 흐름은 core.hlsl 이 직접 계산하므로 _NoiseTex_ST(Tiling, Offset)는 쓰지 않는다. Inspector 에서 칸을 숨긴다.
        // 노이즈는 sRGB 를 끈 데이터라 빈 칸 기본값도 선형 0.5 인 linearGrey 로 둔다.
        // "gray" 는 sRGB 0.5 라 Linear 프로젝트에서 약 0.21 로 읽혀 불이 작고 어둡게 쪼그라든다.
        // 칸이 비면 무늬 없이 모양 마스크만 깎여 움직이지 않는 매끈한 불꽃이 된다.
        [NoScaleOffset] _NoiseTex ("노이즈 텍스처", 2D) = "linearGrey" {}
        _CoreColor ("속 색", Color) = (1, 0.902, 0.502, 1)
        _MidColor ("가운데 색", Color) = (1, 0.502, 0.0784, 1)
        _EdgeColor ("가장자리 색", Color) = (0.851, 0.1373, 0.0392, 1)
        _Intensity ("세기 (HDR)", Range(0, 4)) = 1.5
        _FlowSpeed ("흐름 속도", Range(0, 3)) = 1
        _NoiseScale ("노이즈 크기", Range(0.5, 3)) = 1
        _FlameHeight ("불꽃 높이", Range(0.3, 1)) = 1
        _FlameWidth ("불꽃 폭", Range(0.1, 0.45)) = 0.32
        _EdgeSoftness ("가장자리 부드러움", Range(0.01, 0.4)) = 0.08
        _Wobble ("너울 세기", Range(0, 0.4)) = 0.15
    }

    SubShader
    {
        Tags { "RenderType" = "Transparent" "Queue" = "Transparent" "RenderPipeline" = "UniversalPipeline" }

        Pass
        {
            Name "Forward"
            Tags { "LightMode" = "UniversalForward" }

            // 더하기 혼합: 뒤에 빛을 더한다. 깊이를 쓰지 않아 겹친 불꽃끼리 서로 가리지 않는다.
            // Quad 는 한쪽 면만 있으므로 뒤에서 봐도 불이 사라지지 않게 양면을 그린다 (뒤에서는 좌우가 뒤집혀 보인다).
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
                float4 _CoreColor;
                float4 _MidColor;
                float4 _EdgeColor;
                float _Intensity;
                float _FlowSpeed;
                float _NoiseScale;
                float _FlameHeight;
                float _FlameWidth;
                float _EdgeSoftness;
                float _Wobble;
            CBUFFER_END

            // core.hlsl 안에서 텍스처를 읽는 매크로. 웹에서는 texture() 로 바뀐다.
            #define SG_TEX(name, uv) SAMPLE_TEXTURE2D(name, sampler##name, uv)

            // core.hlsl 이 받는 입력. 메시 무대의 공통 형식이다.
            // 지금 core 는 uv, color, time 만 쓰지만 프레넬이나 높이 페이드 같은 변형을 core 에 넣어도 컴파일되게
            // 위치, 법선, 시선 방향을 함께 넘긴다. 조명을 받지 않는 발광 효과라 광원 값은 넘기지 않는다.
            // color 는 정점 색이다. Particle System 의 Start Color 와 Color over Lifetime 이 이 값으로 들어오고,
            // 기본 Quad 는 흰색(1)이라 그대로 그려진다.
            struct SgInput
            {
                float2 uv;
                float4 color;
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
                float4 color : COLOR;
                UNITY_VERTEX_INPUT_INSTANCE_ID
            };

            struct Varyings
            {
                float4 positionCS : SV_POSITION;
                float2 uv : TEXCOORD0;
                float3 positionOS : TEXCOORD1;
                float3 positionWS : TEXCOORD2;
                float3 normalWS : TEXCOORD3;
                float4 color : TEXCOORD4;
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
                o.color = v.color;
                return o;
            }

            float4 frag(Varyings v) : SV_Target
            {
                UNITY_SETUP_INSTANCE_ID(v);
                UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX(v);

                SgInput i;
                i.uv = v.uv;
                i.color = v.color;
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
