// 가려진 실루엣: 벽 뒤에 가려진 부분만 ZTest Greater 패스로 단색 실루엣을 덧그리는 불투명 메시 효과 (URP 17, HLSL).
// 효과 본체는 core.hlsl 에 있고, 이 파일은 Unity 전용 부분(조명, 패스 구성, 깊이 테스트, 혼합, SRP Batcher)만 맡는다.
// core.hlsl 은 패스마다 include 한다. 실루엣 패스만 그 앞에 SG_OCCLUDED 를 정의해 실루엣 쪽 코드를 고른다.
Shader "ShaderGallery/XrayOccludedSilhouette"
{
    Properties
    {
        _SilhouetteColor ("실루엣 색", Color) = (0.184, 0.549, 1, 1)
        _Opacity ("실루엣 불투명도", Range(0, 1)) = 0.5
        _RimStrength ("테두리 세기", Range(0, 3)) = 1.5
        _RimWidth ("테두리 폭", Range(0.05, 1)) = 0.6
        _Reveal ("발견 펄스", Range(0, 1)) = 0
        _BaseColor ("본체 색", Color) = (0.604, 0.659, 0.561, 1)
    }

    SubShader
    {
        // 알파는 항상 1 이라 잘려 나가는 곳은 없다. 갤러리의 메시 무대 규격(잘라 내기)에 맞춰 둔다.
        // AlphaTest 큐(2450)라 Geometry 큐(2000)의 벽보다 늦게 그려진다. 벽 깊이가 먼저 있어야 ZTest Greater 가 가려진 곳을 찾는다.
        Tags { "RenderType" = "TransparentCutout" "Queue" = "AlphaTest" "RenderPipeline" = "UniversalPipeline" }

        HLSLINCLUDE
        #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
        #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"

        // SRP Batcher 호환: 머티리얼 값은 모두 이 버퍼 안에 둔다. 모든 패스가 같은 버퍼를 써야 배칭이 유지된다.
        CBUFFER_START(UnityPerMaterial)
            float4 _SilhouetteColor;
            float _Opacity;
            float _RimStrength;
            float _RimWidth;
            float _Reveal;
            float4 _BaseColor;
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

        // 모든 패스가 같은 정점 함수를 쓴다. 실루엣 패스의 깊이가 본체와 정확히 같아야 경계가 어긋나지 않는다.
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
                // distanceAttenuation(광원 Culling Mask)은 곱하지 않는다. 갤러리 촬영 씬에서 0 으로 들어와 직사광이 사라졌다.
                // 그래서 광원의 Culling Mask 와 Rendering Layers 는 이 본체 조명에 반영되지 않는다.
                Light light = GetMainLight(TransformWorldToShadowCoord(v.positionWS), v.positionWS, half4(1, 1, 1, 1));
                float3 lightColor = light.color * light.shadowAttenuation;
                float3 lighting = lightColor * saturate(dot(normalWS, light.direction)) + SampleSH(normalWS);

                float4 c = sgEffect(makeInput(v, light.direction, lightColor, lighting));
                clip(c.a - 0.5);
                return float4(c.rgb, 1.0);
            }
            ENDHLSL
        }

        // 실루엣 패스. 깊이 버퍼에 이미 더 가까운 것(벽)이 있는 픽셀만 통과한다(ZTest Greater).
        // 깊이를 쓰지 않아(ZWrite Off) 본체와 다른 물체의 깊이를 망치지 않고, 알파로 벽 위에 섞는다.
        // Forward(+) 에서 Unity 는 같은 물체의 SRPDefaultUnlit 패스를 UniversalForwardOnly 본체보다 먼저 그린다. 그래서 자기 몸에 가려진 뒷부분은 실루엣이 되지 않는다.
        // Depth Priming 이 켜지면 불투명 그리기 전체가 ZTest Equal 로 덮어써져 이 패스의 ZTest Greater 가 무시되고 실루엣이 통째로 사라진다.
        // 프라이밍 없는 깊이 프리패스(SSAO 등)는 깊이 텍스처에만 그리므로 상관없다.
        // 자기 겹침은 Deferred(본체가 먼저 그려질 수 있다)와 렌더러, 서브메시가 여럿인 캐릭터에서 생긴다 (meta 의 pitfalls 참고).
        // 같은 LightMode 태그의 패스가 둘이면 URP 는 첫 패스만 그리므로 본체와 다른 태그를 쓴다.
        Pass
        {
            Name "Occluded"
            Tags { "LightMode" = "SRPDefaultUnlit" }
            ZTest Greater
            ZWrite Off
            Blend SrcAlpha OneMinusSrcAlpha

            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment fragOccluded
            #pragma multi_compile_instancing

            #define SG_OCCLUDED
            #include "core.hlsl"

            float4 fragOccluded(Varyings v) : SV_Target
            {
                UNITY_SETUP_INSTANCE_ID(v);
                UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX(v);
                // 실루엣은 조명을 쓰지 않는다. 입력 형식만 본체와 맞춘다.
                float4 c = sgEffect(makeUnlitInput(v));
                return float4(c.rgb, saturate(c.a));
            }
            ENDHLSL
        }

        // 그림자는 본체만 드리운다. 실루엣은 그림자를 만들지 않는다.
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
