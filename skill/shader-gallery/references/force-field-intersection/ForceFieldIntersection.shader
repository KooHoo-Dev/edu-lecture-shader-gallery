// 역장 교차: 씬 깊이와 비교해 다른 물체에 닿은 선을 밝히는 투명 보호막 (URP 17, HLSL).
// URP Asset 의 Depth Texture 를 켜야 한다. 효과 본체는 core.hlsl 에 있다.
Shader "ShaderGallery/ForceFieldIntersection"
{
    Properties
    {
        _FieldColor ("역장 색", Color) = (0.251, 0.651, 1, 1)
        _FresnelPower ("테두리 좁히기", Range(0.5, 8)) = 3
        _PatternScale ("무늬 크기", Range(2, 30)) = 12
        _PatternStrength ("무늬 밝기", Range(0, 1)) = 0.3
        _ContactWidth ("교차선 폭", Range(0.02, 1)) = 0.2
        _ContactGlow ("교차선 밝기", Range(0, 4)) = 3
        _HitPulse ("맥동", Range(0, 1)) = 0
    }

    SubShader
    {
        Tags { "RenderType" = "Transparent" "Queue" = "Transparent" "RenderPipeline" = "UniversalPipeline" }

        Pass
        {
            Name "Forward"
            Tags { "LightMode" = "UniversalForward" }

            // 투명 막은 깊이를 쓰지 않고 뒤에 더해진다.
            Blend SrcAlpha One
            ZWrite Off

            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile_instancing

            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/DeclareDepthTexture.hlsl"

            // SRP Batcher 호환: 머티리얼 값은 모두 이 버퍼 안에 둔다.
            CBUFFER_START(UnityPerMaterial)
                float4 _FieldColor;
                float _FresnelPower;
                float _PatternScale;
                float _PatternStrength;
                float _ContactWidth;
                float _ContactGlow;
                float _HitPulse;
            CBUFFER_END

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

                // 씬 표면의 눈 깊이 - 이 픽셀의 눈 깊이 (카메라 정면 축 방향 거리).
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
