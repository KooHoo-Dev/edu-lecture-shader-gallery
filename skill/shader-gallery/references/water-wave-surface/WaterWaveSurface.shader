// 물결 수면: 사인파 세 개를 더해 평면 정점을 오르내리게 하고, 같은 식의 도함수로 구한 법선으로
// 프레넬(물빛과 하늘빛 섞기)과 주 광원 반사광을 칠하는 알파 혼합 투명 메시 (URP 17, HLSL).
// 효과 본체는 core.hlsl 에 있고, 이 파일은 Unity 전용 부분(혼합, 조명, 정점 변환, SRP Batcher)만 맡는다.
// 투명 메시라 Forward 패스 하나만 둔다. 그림자를 드리우지 않고 깊이 텍스처에도 들어가지 않는다.
Shader "ShaderGallery/WaterWaveSurface"
{
    Properties
    {
        // 파도 값은 오브젝트 공간 단위(m)다. 기본값은 WaterSurfaceGrid 가 만드는 한 변 10 m, 100 칸(정점 간격 0.1 m) 평면 기준이다.
        // 정점 간격 1 m 인 Unity 기본 Plane 에 쓰면 파장을 4 m 이상으로 올린다.
        _WaveHeight ("파도 높이", Range(0, 0.14)) = 0.04
        _WaveLength ("파장", Range(0.8, 6)) = 2.2
        _WaveSpeed ("파도 속도", Range(0, 3)) = 0.8
        _WaveAngle ("파도 방향 (Y 회전, 도)", Range(0, 360)) = 225
        _DeepColor ("물빛", Color) = (0.0157, 0.1647, 0.2706, 1)
        _SkyColor ("하늘빛", Color) = (0.4392, 0.6431, 0.8, 1)
        _SpecStrength ("반사광 세기", Range(0, 3)) = 1.2
        // 해가 카메라 맞은편에 있으면 높은 값에서 작은 반짝임이 모여 해 반짝임 길이 된다. 낮추면 넓은 흰 막으로 번진다.
        _SpecPower ("반사광 날카로움", Range(4, 256)) = 200
    }

    SubShader
    {
        Tags { "RenderType" = "Transparent" "Queue" = "Transparent" "RenderPipeline" = "UniversalPipeline" }

        Pass
        {
            Name "Forward"
            // 투명 물체는 Deferred 렌더 경로에서도 Forward 로 그려지므로 UniversalForward 로 둔다.
            Tags { "LightMode" = "UniversalForward" }

            // 알파 혼합: 앞쪽은 바닥이 비치고 먼 쪽은 하늘빛이 덮는다. 수면은 깊이를 쓰지 않는다.
            // 깊이를 쓰면 수면 아래 다른 투명 물체가 가려진다. 대신 한 메시 안에서는 삼각형을 그리는 순서가 곧 앞뒤라
            // 반대편(+Z)에서 보면 뒤쪽 물결이 앞 마루 위에 그려질 수 있다. 그때는 파도를 낮추거나 ZWrite On 으로 바꾼다.
            Blend SrcAlpha OneMinusSrcAlpha
            ZWrite Off

            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile_instancing
            #pragma multi_compile _ _MAIN_LIGHT_SHADOWS _MAIN_LIGHT_SHADOWS_CASCADE _MAIN_LIGHT_SHADOWS_SCREEN
            #pragma multi_compile_fragment _ _SHADOWS_SOFT

            // 투명 물체는 화면 공간 그림자 텍스처(불투명 깊이로 만든 것)를 읽으면 안 된다.
            // URP Lit 의 투명 표면처럼 이 값을 정의해 두면 그림자 맵을 직접 읽는다.
            #define _SURFACE_TYPE_TRANSPARENT 1

            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"

            // SRP Batcher 호환: 머티리얼 값은 모두 이 버퍼 안에 둔다.
            CBUFFER_START(UnityPerMaterial)
                float _WaveHeight;
                float _WaveLength;
                float _WaveSpeed;
                float _WaveAngle;
                float4 _DeepColor;
                float4 _SkyColor;
                float _SpecStrength;
                float _SpecPower;
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

            // core.hlsl 은 파도 법선을 오브젝트 공간에서 구한다. 평면을 돌리거나 늘려도 조명이 맞도록 월드로 바꾸는 법을 알려 준다.
            #define WAVE_NORMAL_TO_WORLD(n) TransformObjectToWorldNormal(n)

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
                // 파도 높이만큼 민 위치로 월드 위치와 화면 위치를 구한다.
                float3 p = sgVertex(v.positionOS.xyz, v.normalOS, v.uv, _Time.y);
                o.positionWS = TransformObjectToWorld(p);
                o.positionCS = TransformWorldToHClip(o.positionWS);
                // 평면의 원래 법선. 파도 법선은 core.hlsl 이 픽셀마다 다시 구한다.
                o.normalWS = TransformObjectToWorldNormal(v.normalOS);
                o.positionOS = p;
                o.uv = v.uv;
                return o;
            }

            float4 frag(Varyings v) : SV_Target
            {
                UNITY_SETUP_INSTANCE_ID(v);
                UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX(v);
                float3 normalWS = normalize(v.normalWS);
                // 위치와 Shadowmask 까지 넘겨야 그림자 거리 페이드가 들어가 Max Distance 에서 그림자가 선을 긋고 끊기지 않는다.
                // distanceAttenuation(광원 Culling Mask)은 곱하지 않는다. 갤러리 촬영 씬에서 0 으로 들어와 직사광이 사라졌다.
                Light light = GetMainLight(TransformWorldToShadowCoord(v.positionWS), v.positionWS, half4(1, 1, 1, 1));
                float3 lightColor = light.color * light.shadowAttenuation;

                SgInput i;
                i.uv = v.uv;
                i.positionOS = v.positionOS;
                i.normalWS = normalWS;
                // 눈마다 따로 구한다. XR 에서 두 눈의 프레넬과 반사광이 맞는다.
                i.viewWS = GetWorldSpaceNormalizeViewDir(v.positionWS);
                i.lightDirWS = light.direction;
                i.lightColor = lightColor;
                i.lighting = lightColor * saturate(dot(normalWS, light.direction)) + SampleSH(normalWS);
                i.time = _Time.y;
                return sgEffect(i);
            }
            ENDHLSL
        }
    }
}
