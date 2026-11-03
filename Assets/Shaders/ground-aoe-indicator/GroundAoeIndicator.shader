// 지면 범위 표시: 바닥과 소품을 덮는 상자 메시 안의 씬 표면에 원, 고리, 부채꼴을 투영하는 박스 투영 (URP 17, HLSL).
// URP Asset 의 Depth Texture 를 켜야 한다. 효과 본체는 core.hlsl 에 있다.
Shader "ShaderGallery/GroundAoeIndicator"
{
    Properties
    {
        [Enum(Circle, 0, Ring, 1, Cone, 2)] _Shape ("모양", Float) = 0
        _Radius ("반지름 (상자 반폭 대비)", Range(0.1, 1)) = 0.95
        _InnerRadius ("고리 안쪽 비율 (고리)", Range(0, 0.95)) = 0.85
        _ConeAngle ("부채꼴 각도 (부채꼴)", Range(15, 240)) = 90
        _BorderWidth ("테두리 두께", Range(0, 0.3)) = 0.06
        _FillDensity ("안쪽 채움 진하기", Range(0, 1)) = 0.3
        _Fill ("시전 진행", Range(0, 1)) = 0
        _Color ("색", Color) = (1, 0.6, 0.2, 1)
        _Intensity ("밝기", Range(0, 4)) = 1.5
        _SideFade ("옆면 문턱", Range(0, 0.95)) = 0.6
    }

    SubShader
    {
        Tags { "RenderType" = "Transparent" "Queue" = "Transparent" "RenderPipeline" = "UniversalPipeline" }

        Pass
        {
            Name "Forward"
            Tags { "LightMode" = "UniversalForward" }

            // 상자 메시는 보이지 않고 그 안의 씬 표면에만 알파로 얹힌다. 깊이는 쓰지 않는다.
            // 카메라가 상자 밖에 있다고 보고 앞면만 그린다. 카메라가 상자 안에 들어가면 앞면이 잘려 표시가 사라진다.
            Blend SrcAlpha OneMinusSrcAlpha
            ZWrite Off
            Cull Back

            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile_instancing

            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/DeclareDepthTexture.hlsl"

            // SRP Batcher 호환: 머티리얼 값은 모두 이 버퍼 안에 둔다.
            CBUFFER_START(UnityPerMaterial)
                float _Shape;
                float _Radius;
                float _InnerRadius;
                float _ConeAngle;
                float _BorderWidth;
                float _FillDensity;
                float _Fill;
                float4 _Color;
                float _Intensity;
                float _SideFade;
            CBUFFER_END

            // core.hlsl 이 받는 입력. 깊이 무대의 공통 형식이다.
            struct SgInput
            {
                float3 positionOS;
                float3 cameraPosOS;
                float2 screenUV;
                float depthDelta;
                float time;
            };

            // 그 화면 좌표에 있는 씬 표면의 눈 깊이(미터, 카메라 정면 축 방향의 거리).
            // 직교 카메라는 깊이 버퍼가 이미 선형이라 LinearEyeDepth 를 쓰면 틀린다. 가까운, 먼 평면 사이를 직접 보간한다.
            float sgSceneDepth(float2 uv)
            {
                float raw = SampleSceneDepth(uv);
                if (unity_OrthoParams.w > 0.5)
                {
                #if UNITY_REVERSED_Z
                    raw = 1.0 - raw;
                #endif
                    return lerp(_ProjectionParams.y, _ProjectionParams.z, raw);
                }
                return LinearEyeDepth(raw, _ZBufferParams);
            }

            #include "core.hlsl"

            struct Attributes
            {
                float4 positionOS : POSITION;
                UNITY_VERTEX_INPUT_INSTANCE_ID
            };

            struct Varyings
            {
                float4 positionCS : SV_POSITION;
                float3 positionOS : TEXCOORD0;
                float3 positionWS : TEXCOORD1;
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
                o.positionOS = v.positionOS.xyz;
                return o;
            }

            float4 frag(Varyings v) : SV_Target
            {
                UNITY_SETUP_INSTANCE_ID(v);
                UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX(v);

                SgInput i;
                i.positionOS = v.positionOS;
                // 카메라 위치를 이 상자의 오브젝트 공간으로 옮긴다. 상자가 돌거나 늘어나 있어도 시선 비율은 그대로다.
                i.cameraPosOS = TransformWorldToObject(GetCameraPositionWS());
                i.screenUV = GetNormalizedScreenSpaceUV(v.positionCS);

                // 씬 표면의 눈 깊이 - 이 픽셀의 눈 깊이. 눈 깊이는 카메라 정면 축 방향의 거리다.
                float sceneEye = sgSceneDepth(i.screenUV);
                float selfEye = LinearEyeDepth(v.positionWS, UNITY_MATRIX_V);
                i.depthDelta = sceneEye - selfEye;

                i.time = _Time.y;
                return sgEffect(i);
            }
            ENDHLSL
        }
    }
}
