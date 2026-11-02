// 젖음과 눈 쌓임: 월드 법선의 위쪽 성분과 노이즈로 윗면에 젖은 느낌이나 눈을 얹는 메시 효과 (URP 17, HLSL).
// 효과 본체는 core.hlsl 에 있고, 이 파일은 Unity 전용 부분(조명, 패스, SRP Batcher)만 맡는다.
Shader "ShaderGallery/SurfaceWetSnow"
{
    Properties
    {
        // 반복 횟수는 아래 _TilingU, _TilingV 로 정하므로 _StoneTex_ST(Tiling, Offset)는 쓰지 않는다. Inspector 에서 칸을 숨긴다.
        [NoScaleOffset] _StoneTex ("바탕 텍스처", 2D) = "white" {}
        // 기본 6, 3 은 구 UV(둘레:위아래 = 2:1)에 맞춘 값이다. U:V 를 UV 가 덮는 가로:세로 길이 비와 같게 둔다.
        // 같은 벽돌 크기(약 0.5 유닛)로 맞추려면 큐브, Quad 는 2, 2, 한 변 10 인 Plane 은 20, 20 이다.
        _TilingU ("텍스처 반복 U", Range(1, 20)) = 6
        _TilingV ("텍스처 반복 V", Range(1, 20)) = 3
        [Enum(Wet, 0, Snow, 1)] _Mode ("모드", Float) = 1
        _Coverage ("덮는 양", Range(0, 1)) = 0.5
        _Softness ("경계 부드러움", Range(0.01, 0.5)) = 0.08
        _NoiseScale ("노이즈 크기", Range(1, 20)) = 6
        _WetDarkness ("젖음 어둡기", Range(0, 1)) = 0.8
        _Gloss ("광택", Range(0, 1)) = 0.7
        _SnowColor ("눈 색", Color) = (0.8039, 0.8392, 0.8941, 1)
        _Storm ("소나기·눈발 (이벤트용)", Range(0, 1)) = 0
    }

    SubShader
    {
        // 불투명 표본이지만 갤러리 규격(cutout)에 맞춰 잘라 내기 태그를 쓴다. 알파가 항상 1 이라 잘리는 곳은 없다.
        Tags { "RenderType" = "TransparentCutout" "Queue" = "AlphaTest" "RenderPipeline" = "UniversalPipeline" }

        HLSLINCLUDE
        #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
        #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"

        // 텍스처 선언은 CBUFFER 밖에 둔다.
        TEXTURE2D(_StoneTex);
        SAMPLER(sampler_StoneTex);

        // SRP Batcher 호환: 머티리얼 값은 모두 이 버퍼 안에 둔다.
        CBUFFER_START(UnityPerMaterial)
            float4 _StoneTex_TexelSize;
            float _TilingU;
            float _TilingV;
            float _Mode;
            float _Coverage;
            float _Softness;
            float _NoiseScale;
            float _WetDarkness;
            float _Gloss;
            float4 _SnowColor;
            float _Storm;
        CBUFFER_END

        // core.hlsl 안에서 텍스처를 읽는 매크로. 웹에서는 texture() 로 바뀐다.
        #define SG_TEX(name, uv) SAMPLE_TEXTURE2D(name, sampler##name, uv)

        // core.hlsl 이 받는 입력. 메시 무대의 공통 형식이다.
        // core 의 효과 끄기 분기(SG_OFF)가 쓰는 normalOS 는 웹 미리보기 전용이라 넣지 않았다. Unity 에서는 그 분기가 컴파일되지 않는다.
        struct SgInput
        {
            float2 uv;
            float3 positionOS;
            float3 normalWS;
            float3 viewWS;
            float3 lightDirWS;
            float3 lightColor;
            float3 lighting;
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

        SgInput makeInput(Varyings v, float3 lightDir, float3 lightColor, float3 lighting)
        {
            SgInput i;
            i.uv = v.uv;
            i.positionOS = v.positionOS;
            // 보간된 법선은 길이가 1 보다 짧아지므로 다시 정규화한다. 윗면 마스크가 삼각형 가운데서 흐려지지 않는다.
            i.normalWS = normalize(v.normalWS);
            i.viewWS = GetWorldSpaceNormalizeViewDir(v.positionWS);
            i.lightDirWS = lightDir;
            i.lightColor = lightColor;
            i.lighting = lighting;
            i.time = _Time.y;
            return i;
        }

        // 조명이 필요 없는 패스용. 알파만 쓴다 (이 표본은 항상 1 이라 잘리지 않는다).
        float effectAlpha(Varyings v)
        {
            return sgEffect(makeInput(v, float3(0.0, 1.0, 0.0), float3(1.0, 1.0, 1.0), float3(1.0, 1.0, 1.0))).a;
        }
        ENDHLSL

        Pass
        {
            Name "Forward"
            // Forward 와 Deferred 렌더 경로 모두에서 그려지려면 UniversalForwardOnly 여야 한다.
            Tags { "LightMode" = "UniversalForwardOnly" }

            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile_instancing
            #pragma multi_compile _ _MAIN_LIGHT_SHADOWS _MAIN_LIGHT_SHADOWS_CASCADE _MAIN_LIGHT_SHADOWS_SCREEN
            #pragma multi_compile_fragment _ _SHADOWS_SOFT

            float4 frag(Varyings v) : SV_Target
            {
                UNITY_SETUP_INSTANCE_ID(v);
                UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX(v);
                float3 normalWS = normalize(v.normalWS);
                // 위치를 넘기는 형식이라야 그림자가 Max Distance 근처에서 서서히 사라진다.
                // distanceAttenuation(광원 Culling Mask)은 곱하지 않는다. 갤러리 촬영 씬에서 0 으로 들어와 직사광이 사라졌다.
                // 그래서 광원의 Culling Mask 와 Rendering Layers 가 이 셰이더에는 걸리지 않는다.
                Light light = GetMainLight(TransformWorldToShadowCoord(v.positionWS), v.positionWS, half4(1, 1, 1, 1));
                // 그림자 감쇠를 빛 색에 미리 곱해 넘긴다. core 의 하이라이트도 그림자 안에서는 사라진다.
                float3 lightColor = light.color * light.shadowAttenuation;
                float3 lighting = lightColor * saturate(dot(normalWS, light.direction)) + SampleSH(normalWS);

                float4 c = sgEffect(makeInput(v, light.direction, lightColor, lighting));
                clip(c.a - 0.5);
                return float4(c.rgb, 1.0);
            }
            ENDHLSL
        }

        // 그림자. 알파가 항상 1 이라 잘리지 않지만, 알파를 쓰도록 고쳤을 때를 위해 같은 식으로 둔다.
        Pass
        {
            Name "ShadowCaster"
            Tags { "LightMode" = "ShadowCaster" }
            ZWrite On
            ColorMask 0

            HLSLPROGRAM
            #pragma vertex vertShadow
            #pragma fragment fragClip
            #pragma multi_compile_instancing
            #pragma multi_compile_vertex _ _CASTING_PUNCTUAL_LIGHT_SHADOW

            float3 _LightDirection;
            float3 _LightPosition;

            Varyings vertShadow(Attributes v)
            {
                Varyings o = vert(v);
                #if _CASTING_PUNCTUAL_LIGHT_SHADOW
                    float3 lightDir = normalize(_LightPosition - o.positionWS);
                #else
                    float3 lightDir = _LightDirection;
                #endif
                float4 cs = TransformWorldToHClip(ApplyShadowBias(o.positionWS, o.normalWS, lightDir));
                o.positionCS = ApplyShadowClamping(cs);
                return o;
            }

            float4 fragClip(Varyings v) : SV_Target
            {
                UNITY_SETUP_INSTANCE_ID(v);
                UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX(v);
                clip(effectAlpha(v) - 0.5);
                return 0;
            }
            ENDHLSL
        }

        // 깊이 텍스처를 쓰는 다른 효과와 맞물릴 때 필요하다.
        Pass
        {
            Name "DepthOnly"
            Tags { "LightMode" = "DepthOnly" }
            ZWrite On
            ColorMask R

            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment fragClip
            #pragma multi_compile_instancing

            float4 fragClip(Varyings v) : SV_Target
            {
                UNITY_SETUP_INSTANCE_ID(v);
                UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX(v);
                clip(effectAlpha(v) - 0.5);
                return v.positionCS.z;
            }
            ENDHLSL
        }

        // SSAO 처럼 노멀을 쓰는 렌더러 기능과 맞물릴 때 필요하다.
        Pass
        {
            Name "DepthNormals"
            Tags { "LightMode" = "DepthNormalsOnly" }
            ZWrite On

            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment fragNormals
            #pragma multi_compile_instancing
            // URP Unlit 의 Forward 전용 노멀 패스와 같은 키워드. Deferred 의 정확한 G-buffer 노멀과 렌더링 레이어를 켜면 쓰인다.
            #pragma multi_compile_fragment _ _GBUFFER_NORMALS_OCT
            #include_with_pragmas "Packages/com.unity.render-pipelines.universal/ShaderLibrary/RenderingLayers.hlsl"

            void fragNormals(Varyings v, out float4 outNormalWS : SV_Target0
            #ifdef _WRITE_RENDERING_LAYERS
                , out uint outRenderingLayers : SV_Target1
            #endif
            )
            {
                UNITY_SETUP_INSTANCE_ID(v);
                UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX(v);
                clip(effectAlpha(v) - 0.5);
                float3 normalWS = normalize(v.normalWS);
                #if defined(_GBUFFER_NORMALS_OCT)
                    float2 octNormalWS = PackNormalOctQuadEncode(normalWS);
                    outNormalWS = float4(PackFloat2To888(saturate(octNormalWS * 0.5 + 0.5)), 0.0);
                #else
                    outNormalWS = float4(normalWS, 0.0);
                #endif
                #ifdef _WRITE_RENDERING_LAYERS
                    outRenderingLayers = EncodeMeshRenderingLayer();
                #endif
            }
            ENDHLSL
        }
    }
}
