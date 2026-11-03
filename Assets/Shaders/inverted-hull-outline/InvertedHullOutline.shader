// 껍데기 외곽선: 피벗 기준으로 조금 키운(또는 법선 방향으로 민) 껍데기의 뒷면을 한 번 더 그려 외곽선을 만드는 불투명 메시 효과 (URP 17, HLSL).
// 효과 본체는 core.hlsl 에 있고, 이 파일은 Unity 전용 부분(조명, 패스 구성, Cull, SRP Batcher)만 맡는다.
// core.hlsl 은 패스마다 include 한다. 외곽선 패스만 그 앞에 SG_OUTLINE 을 정의해 껍데기 쪽 코드를 고른다.
Shader "ShaderGallery/InvertedHullOutline"
{
    Properties
    {
        _BaseColor ("기본 색", Color) = (0.31, 0.525, 0.776, 1)
        _OutlineColor ("외곽선 색", Color) = (1, 0.788, 0.302, 1)
        _OutlineWidth ("외곽선 두께", Range(0, 0.15)) = 0.04
        _OutlineAmount ("외곽선 켜기", Range(0, 1)) = 1
        [Enum(Normal, 0, ScaleFromPivot, 1)] _PushDir ("미는 방식", Float) = 1
    }

    SubShader
    {
        // 알파는 항상 1 이라 잘려 나가는 곳은 없다. 갤러리의 메시 무대 규격(잘라 내기)에 맞춰 둔다.
        Tags { "RenderType" = "TransparentCutout" "Queue" = "AlphaTest" "RenderPipeline" = "UniversalPipeline" }

        HLSLINCLUDE
        #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
        #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"

        // SRP Batcher 호환: 머티리얼 값은 모두 이 버퍼 안에 둔다. 두 패스가 같은 버퍼를 써야 배칭이 유지된다.
        CBUFFER_START(UnityPerMaterial)
            float4 _BaseColor;
            float4 _OutlineColor;
            float _OutlineWidth;
            float _OutlineAmount;
            float _PushDir;
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

        // 정점 위치만 바꿔 끼울 수 있게 나눠 둔다. 본체는 원래 위치, 외곽선 패스는 sgVertex 로 민 위치를 넣는다.
        Varyings vertAt(Attributes v, float3 positionOS)
        {
            Varyings o;
            UNITY_SETUP_INSTANCE_ID(v);
            UNITY_TRANSFER_INSTANCE_ID(v, o);
            UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO(o);
            o.positionWS = TransformObjectToWorld(positionOS);
            o.positionCS = TransformWorldToHClip(o.positionWS);
            o.normalWS = TransformObjectToWorldNormal(v.normalOS);
            o.positionOS = positionOS;
            o.uv = v.uv;
            return o;
        }

        Varyings vert(Attributes v)
        {
            return vertAt(v, v.positionOS.xyz);
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

        // 조명이 필요 없는 패스용 입력. 알파만 쓴다.
        SgInput makeUnlitInput(Varyings v)
        {
            return makeInput(v, float3(0.0, 1.0, 0.0), float3(1.0, 1.0, 1.0), float3(1.0, 1.0, 1.0));
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

            #include "core.hlsl"

            float4 frag(Varyings v) : SV_Target
            {
                UNITY_SETUP_INSTANCE_ID(v);
                UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX(v);
                float3 normalWS = normalize(v.normalWS);
                // 위치를 넘기는 형식이라야 그림자가 Max Distance 근처에서 서서히 사라진다.
                Light light = GetMainLight(TransformWorldToShadowCoord(v.positionWS), v.positionWS, half4(1, 1, 1, 1));
                float3 lightColor = light.color * light.shadowAttenuation;
                float3 lighting = lightColor * saturate(dot(normalWS, light.direction)) + SampleSH(normalWS);

                float4 c = sgEffect(makeInput(v, light.direction, lightColor, lighting));
                clip(c.a - 0.5);
                return float4(c.rgb, 1.0);
            }
            ENDHLSL
        }

        // 외곽선 패스. 본체보다 조금 큰 껍데기를 그리되 앞면은 버리고(Cull Front) 뒷면만 남긴다.
        // 깊이 프리패스(DepthOnly)에는 이 패스가 없다. Depth Priming 이 켜지면 통째로 사라진다 (촬영으로 확인. meta 의 pitfalls 참고).
        // 앞면까지 그리면 껍데기가 본체보다 카메라에 가까워 본체를 통째로 덮는다.
        // 같은 LightMode 태그의 패스가 둘이면 URP 는 첫 패스만 그리므로 본체와 다른 태그를 쓴다.
        // URP 17 은 SRPDefaultUnlit 을 Forward, Deferred, 2D Renderer 에서 모두 그린다.
        Pass
        {
            Name "Outline"
            Tags { "LightMode" = "SRPDefaultUnlit" }
            Cull Front

            HLSLPROGRAM
            #pragma vertex vertOutline
            #pragma fragment fragOutline
            #pragma multi_compile_instancing

            #define SG_OUTLINE
            #include "core.hlsl"

            Varyings vertOutline(Attributes v)
            {
                // 모든 정점을 sgVertex 로 옮긴다. 두께는 오브젝트 공간 길이라 물체의 스케일과 함께 커진다.
                // 정적 배칭된 물체는 positionOS 가 월드 위치라 확대 기준이 월드 원점이 된다.
                float3 p = sgVertex(v.positionOS.xyz, v.normalOS, v.uv, _Time.y);
                return vertAt(v, p);
            }

            float4 fragOutline(Varyings v) : SV_Target
            {
                UNITY_SETUP_INSTANCE_ID(v);
                UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX(v);
                // 외곽선 색은 조명을 쓰지 않는다. 입력 형식을 본체와 맞추려고 그림자 없는 주광만 넣는다.
                float3 normalWS = normalize(v.normalWS);
                Light light = GetMainLight();
                float3 lighting = light.color * saturate(dot(normalWS, light.direction)) + SampleSH(normalWS);

                float4 c = sgEffect(makeInput(v, light.direction, light.color, lighting));
                clip(c.a - 0.5);
                return float4(c.rgb, 1.0);
            }
            ENDHLSL
        }

        // 그림자는 본체만 드리운다. 외곽선은 그림자를 만들지 않는다.
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

            #include "core.hlsl"

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
                clip(sgEffect(makeUnlitInput(v)).a - 0.5);
                return 0;
            }
            ENDHLSL
        }

        // 깊이 텍스처를 쓰는 다른 효과가 이 물체를 볼 수 있게 한다. 본체만 쓴다.
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

            #include "core.hlsl"

            float4 fragClip(Varyings v) : SV_Target
            {
                UNITY_SETUP_INSTANCE_ID(v);
                UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX(v);
                clip(sgEffect(makeUnlitInput(v)).a - 0.5);
                return v.positionCS.z;
            }
            ENDHLSL
        }

        // SSAO 처럼 노멀을 쓰는 렌더러 기능과 맞물릴 때 필요하다. 본체만 쓴다.
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

            #include "core.hlsl"

            void fragNormals(Varyings v, out float4 outNormalWS : SV_Target0
            #ifdef _WRITE_RENDERING_LAYERS
                , out uint outRenderingLayers : SV_Target1
            #endif
            )
            {
                UNITY_SETUP_INSTANCE_ID(v);
                UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX(v);
                clip(sgEffect(makeUnlitInput(v)).a - 0.5);
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
