// 매트캡: 빛을 그린 공 텍스처 한 장을 화면 기준 법선으로 읽어 조명 없이 재질을 내는 불투명 메시 효과 (URP 17, HLSL).
// 효과 본체는 core.hlsl 에 있고, 이 파일은 Unity 전용 부분(카메라 축, 시선 방향, 패스, SRP Batcher)만 맡는다.
Shader "ShaderGallery/MatcapLitSphere"
{
    Properties
    {
        // 원판 좌표로 읽으므로 Tiling, Offset 은 쓰지 않는다. Inspector 에서 칸을 숨긴다.
        // sRGB 를 끈 데이터 텍스처라 비었을 때의 기본값은 linearGrey 다.
        [NoScaleOffset] _MatcapTex ("매트캡 (R 점토, G 툰, B 크롬)", 2D) = "linearGrey" {}
        [Enum(Clay, 0, Toon, 1, Chrome, 2)] _Channel ("매트캡 채널", Float) = 0
        _MatcapColor ("매트캡 색", Color) = (1, 1, 1, 1)
        _BaseColor ("바탕색", Color) = (0.851, 0.6, 0.4706, 1)
        [Enum(Multiply, 0, Add, 1)] _Combine ("합성 방식", Float) = 0
        [ToggleUI] _Perspective ("원근 보정", Float) = 1
        _RimColor ("테두리 색", Color) = (1, 1, 1, 1)
        _RimIntensity ("테두리 세기", Range(0, 3)) = 0
        _RimPulse ("테두리 더하기", Range(0, 1)) = 0
    }

    SubShader
    {
        // 알파는 항상 1 이라 잘려 나가는 곳은 없다. 갤러리의 메시 무대 규격(잘라 내기)에 맞춰 둔다.
        Tags { "RenderType" = "TransparentCutout" "Queue" = "AlphaTest" "RenderPipeline" = "UniversalPipeline" }

        HLSLINCLUDE
        #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
        #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"

        // 텍스처 선언은 CBUFFER 밖에 둔다.
        TEXTURE2D(_MatcapTex);
        SAMPLER(sampler_MatcapTex);

        // SRP Batcher 호환: 머티리얼 값은 모두 이 버퍼 안에 둔다.
        CBUFFER_START(UnityPerMaterial)
            float4 _MatcapTex_TexelSize;
            float _Channel;
            float4 _MatcapColor;
            float4 _BaseColor;
            float _Combine;
            float _Perspective;
            float4 _RimColor;
            float _RimIntensity;
            float _RimPulse;
        CBUFFER_END

        // core.hlsl 안에서 텍스처를 읽는 매크로. 웹에서는 texture() 로 바뀐다.
        #define SG_TEX(name, uv) SAMPLE_TEXTURE2D(name, sampler##name, uv)

        // core.hlsl 이 받는 입력. 빛은 쓰지 않으므로 메시 무대 형식에서 조명 필드를 빼고 카메라 축을 넣었다.
        // core.hlsl 의 normalOS 는 웹 미리보기의 효과 끄기(SG_OFF) 분기에서만 쓰므로 여기에는 두지 않는다.
        struct SgInput
        {
            float2 uv;
            float3 normalWS;
            float3 viewWS;
            float3 cameraRightWS;
            float3 cameraUpWS;
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
            float3 positionWS : TEXCOORD1;
            float3 normalWS : TEXCOORD2;
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
            // 매트캡은 월드 법선을 카메라 축에 내려 읽는다. 오브젝트 공간 법선을 그대로 쓰면 물체가 돌 때 빛이 따라 돈다.
            o.normalWS = TransformObjectToWorldNormal(v.normalOS);
            o.uv = v.uv;
            return o;
        }

        SgInput makeInput(Varyings v)
        {
            SgInput i;
            i.uv = v.uv;
            // 보간된 법선은 길이가 1 보다 짧아진다. 다시 정규화해야 매트캡 좌표가 원판 안쪽으로 줄어들지 않는다.
            i.normalWS = normalize(v.normalWS);
            // 원근 보정에 쓰는 픽셀별 시선. 직교 카메라에서는 카메라 정면 방향이 나와 보정이 저절로 꺼진다.
            i.viewWS = GetWorldSpaceNormalizeViewDir(v.positionWS);
            // 뷰 행렬의 0, 1 행이 카메라의 오른쪽, 위 축(월드)이다. XR 에서는 눈마다 다른 행렬이 들어온다.
            i.cameraRightWS = UNITY_MATRIX_V[0].xyz;
            i.cameraUpWS = UNITY_MATRIX_V[1].xyz;
            i.time = _Time.y;
            return i;
        }

        // 깊이·그림자 패스용. 알파만 쓴다 (이 표본은 항상 1 이라 잘리지 않는다).
        float effectAlpha(Varyings v)
        {
            return sgEffect(makeInput(v)).a;
        }
        ENDHLSL

        Pass
        {
            Name "Forward"
            // Forward 와 Deferred 렌더 경로 모두에서 그려지려면 UniversalForwardOnly 여야 한다.
            // 조명이 텍스처에 구워져 있어 빛과 그림자 키워드가 없는 Unlit 패스다. 그래서 받는 그림자도 없다.
            Tags { "LightMode" = "UniversalForwardOnly" }

            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile_instancing

            float4 frag(Varyings v) : SV_Target
            {
                UNITY_SETUP_INSTANCE_ID(v);
                UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX(v);
                float4 c = sgEffect(makeInput(v));
                clip(c.a - 0.5);
                return float4(c.rgb, 1.0);
            }
            ENDHLSL
        }

        // 그림자 드리우기. 받지는 않지만 바닥에 그림자는 남긴다. 알파가 항상 1 이라 잘리지 않는다.
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

        // 깊이 텍스처를 쓰는 다른 효과(역장, 물가 거품 등)가 이 물체를 볼 수 있게 한다.
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
