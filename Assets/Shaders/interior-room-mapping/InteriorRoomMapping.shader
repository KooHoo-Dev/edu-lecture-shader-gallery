// 인테리어 매핑: 평평한 벽을 창 칸으로 나누고, 칸마다 창 뒤에 있다고 치는 방 상자와 시선을 교차시켜 입체 방을 그리는 메시 효과 (URP 17, HLSL).
// 효과 본체는 core.hlsl 에 있고, 이 파일은 Unity 전용 부분(조명, 카메라 위치, 패스, SRP Batcher)만 맡는다.
Shader "ShaderGallery/InteriorRoomMapping"
{
    Properties
    {
        // 아틀라스 칸을 셰이더가 직접 고르므로 _RoomAtlas_ST(Tiling, Offset)는 쓰지 않는다. Inspector 에서 칸을 숨긴다.
        [NoScaleOffset] _RoomAtlas ("방 그림 아틀라스", 2D) = "white" {}
        _WindowsX ("가로 창 수", Range(1, 8)) = 3
        _WindowsY ("세로 창 수", Range(1, 8)) = 3
        _RoomDepth ("방 깊이 (칸 폭 배수)", Range(0.2, 2.5)) = 1
        _FrameWidth ("창틀 두께", Range(0.04, 0.8)) = 0.3
        _WallColor ("외벽 색", Color) = (0.722, 0.643, 0.549, 1)
        _GlassReflect ("유리 반사", Range(0, 1)) = 0.5
        _Night ("밤", Range(0, 1)) = 0.35
        _LightsOn ("불 켜진 비율", Range(0, 1)) = 0.5
        _LightColor ("조명 색", Color) = (1, 0.784, 0.471, 1)
        _CurtainAmount ("커튼 비율", Range(0, 1)) = 0.35
    }

    SubShader
    {
        Tags { "RenderType" = "TransparentCutout" "Queue" = "AlphaTest" "RenderPipeline" = "UniversalPipeline" }

        HLSLINCLUDE
        #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
        #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"

        // 텍스처 선언은 CBUFFER 밖에 둔다.
        TEXTURE2D(_RoomAtlas);
        SAMPLER(sampler_RoomAtlas);

        // SRP Batcher 호환: 머티리얼 값은 모두 이 버퍼 안에 둔다.
        CBUFFER_START(UnityPerMaterial)
            float4 _RoomAtlas_TexelSize;
            float _WindowsX;
            float _WindowsY;
            float _RoomDepth;
            float _FrameWidth;
            float4 _WallColor;
            float _GlassReflect;
            float _Night;
            float _LightsOn;
            float4 _LightColor;
            float _CurtainAmount;
        CBUFFER_END

        // core.hlsl 안에서 텍스처를 읽는 매크로. 웹에서는 texture() 로 바뀐다.
        #define SG_TEX(name, uv) SAMPLE_TEXTURE2D(name, sampler##name, uv)

        // core.hlsl 이 받는 입력. 메시 무대의 공통 형식에 positionOS, normalOS, cameraPosOS 를 더했다 (오브젝트 공간 시선용).
        struct SgInput
        {
            float2 uv;
            float3 positionOS;
            float3 positionWS;
            float3 normalOS;
            float3 normalWS;
            float3 viewWS;
            float3 cameraPosOS;
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
            float3 normalOS : TEXCOORD4;
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
            o.normalOS = v.normalOS;
            o.positionOS = v.positionOS.xyz;
            o.uv = v.uv;
            return o;
        }

        SgInput makeInput(Varyings v, float3 lightDir, float3 lightColor, float3 lighting)
        {
            SgInput i;
            i.uv = v.uv;
            i.positionOS = v.positionOS;
            i.positionWS = v.positionWS;
            // 보간된 법선은 길이가 1 보다 짧아지므로 다시 정규화한다.
            i.normalOS = normalize(v.normalOS);
            i.normalWS = normalize(v.normalWS);
            i.viewWS = GetWorldSpaceNormalizeViewDir(v.positionWS);
            // 카메라 위치를 이 물체의 오브젝트 공간으로 옮긴다. 물체가 돌거나 늘어나 있어도 오브젝트 공간 시선이 맞다.
            // XR 에서는 눈마다 카메라 위치가 달라 두 눈이 서로 다른 시차를 본다.
            i.cameraPosOS = TransformWorldToObject(GetCameraPositionWS());
            // 직교 카메라(아이소메트릭 도시)에서는 시선이 모두 카메라 정면 축과 나란하다.
            // 카메라 위치에서 쏜 시선은 틀리므로, 이 점에서 정면 축만큼 뒤로 물러난 점을 카메라로 삼는다.
            if (unity_OrthoParams.w > 0.5)
                i.cameraPosOS = v.positionOS - TransformWorldToObjectDir(GetViewForwardDir(), false);
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
                // 그래서 광원의 Culling Mask 와 Rendering Layers 는 무시된다.
                Light light = GetMainLight(TransformWorldToShadowCoord(v.positionWS), v.positionWS, half4(1, 1, 1, 1));
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
