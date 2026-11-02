// 바람 흔들림: 풀과 잎의 정점을 높이(uv.y)에 따라 밀어 바람에 흔들리게 하는 불투명 양면 메시 효과 (URP 17, HLSL).
// 효과 본체는 core.hlsl 에 있고, 이 파일은 Unity 전용 부분(조명, 패스, SRP Batcher)만 맡는다.
// 네 패스의 정점 함수가 모두 같은 sgVertex 를 불러 그림자와 깊이도 잎과 함께 흔들린다.
Shader "ShaderGallery/WindSwayFoliage"
{
    Properties
    {
        _WindAngle ("바람 방향 (Y 회전, 도)", Range(0, 360)) = 90
        _WindStrength ("바람 세기", Range(0, 1)) = 0.45
        _Gustiness ("돌풍 변화", Range(0, 1)) = 0.7
        _WindSpeed ("바람 속도", Range(0, 3)) = 1
        _Flutter ("잎 떨림", Range(0, 0.15)) = 0.04
        // WindGust.cs 가 0 에서 올렸다 0 으로 내리는 돌풍 값. 셰이더가 바람 세기에 더한다.
        _Gust ("돌풍", Range(0, 1)) = 0
        _RootColor ("뿌리 색", Color) = (0.1804, 0.3569, 0.1373, 1)
        _TipColor ("끝 색", Color) = (0.7686, 0.851, 0.4157, 1)
    }

    SubShader
    {
        // 알파는 항상 1 이라 잘려 나가는 곳은 없다. 갤러리의 메시 무대 규격(잘라 내기)에 맞춰 둔다.
        Tags { "RenderType" = "TransparentCutout" "Queue" = "AlphaTest" "RenderPipeline" = "UniversalPipeline" }

        HLSLINCLUDE
        #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
        #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"

        // SRP Batcher 호환: 머티리얼 값은 모두 이 버퍼 안에 둔다.
        CBUFFER_START(UnityPerMaterial)
            float _WindAngle;
            float _WindStrength;
            float _Gustiness;
            float _WindSpeed;
            float _Flutter;
            float _Gust;
            float4 _RootColor;
            float4 _TipColor;
        CBUFFER_END

        // core.hlsl 이 받는 입력. 메시 무대의 공통 형식이다.
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

        // 모든 패스가 이 함수로 정점을 민다. 패스마다 다르면 그림자나 깊이가 잎과 따로 논다.
        // 법선은 다시 계산하지 않는다. 얇은 잎은 조금 기울어도 음영 차이가 작다.
        Varyings vert(Attributes v)
        {
            Varyings o;
            UNITY_SETUP_INSTANCE_ID(v);
            UNITY_TRANSFER_INSTANCE_ID(v, o);
            UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO(o);
            float3 p = sgVertex(v.positionOS.xyz, v.normalOS, v.uv, _Time.y);
            o.positionWS = TransformObjectToWorld(p);
            o.positionCS = TransformWorldToHClip(o.positionWS);
            o.normalWS = TransformObjectToWorldNormal(v.normalOS);
            o.positionOS = p;
            o.uv = v.uv;
            return o;
        }

        SgInput makeInput(Varyings v, float3 lightDir, float3 lightColor, float3 lighting)
        {
            SgInput i;
            i.uv = v.uv;
            i.positionOS = v.positionOS;
            i.normalWS = normalize(v.normalWS);
            i.viewWS = GetWorldSpaceNormalizeViewDir(v.positionWS);
            i.lightDirWS = lightDir;
            i.lightColor = lightColor;
            i.lighting = lighting;
            i.time = _Time.y;
            return i;
        }

        // 조명이 필요 없는 패스용. 알파만 쓴다.
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
            // 잎은 두께 없는 판이라 뒷면도 그린다.
            Cull Off

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
                Light light = GetMainLight(TransformWorldToShadowCoord(v.positionWS), v.positionWS, half4(1, 1, 1, 1));
                float3 lightColor = light.color * light.shadowAttenuation;
                float3 lighting = lightColor * saturate(dot(normalWS, light.direction)) + SampleSH(normalWS);

                float4 c = sgEffect(makeInput(v, light.direction, lightColor, lighting));
                clip(c.a - 0.5);
                return float4(c.rgb, 1.0);
            }
            ENDHLSL
        }

        // 그림자도 같은 sgVertex 로 밀린 정점으로 그려 잎과 함께 흔들린다.
        Pass
        {
            Name "ShadowCaster"
            Tags { "LightMode" = "ShadowCaster" }
            ZWrite On
            ColorMask 0
            Cull Off

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

        // 깊이 텍스처에도 흔들린 모양이 들어가게 한다 (깊이를 쓰는 다른 효과와 맞물릴 때 필요).
        Pass
        {
            Name "DepthOnly"
            Tags { "LightMode" = "DepthOnly" }
            ZWrite On
            ColorMask R
            Cull Off

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
            Cull Off

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
