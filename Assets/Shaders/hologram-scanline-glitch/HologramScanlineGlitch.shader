// 홀로그램: 프레넬 테두리, 월드 y 스캔라인, 시간 단계로 튀는 정점 글리치, 깜빡임으로 만든 투명 메시 (URP 17, HLSL).
// 효과 본체는 core.hlsl 에 있고, 이 파일은 Unity 전용 부분(혼합, 패스, 정점 변환, SRP Batcher)만 맡는다.
// 더하기 혼합 투명 메시라 Forward 패스 하나만 둔다. 그림자와 깊이는 만들지 않는다.
Shader "ShaderGallery/HologramScanlineGlitch"
{
    Properties
    {
        _HoloColor ("홀로그램 색", Color) = (0.239, 0.863, 1, 1)
        _RimPower ("테두리 좁히기", Range(0.5, 6)) = 2
        _LineSpacing ("스캔라인 간격", Range(0.02, 0.3)) = 0.08
        _ScanSpeed ("스캔라인 속도", Range(-1, 1)) = 0.3
        _GlitchStrength ("글리치 세기", Range(0, 1)) = 0.5
        _Flicker ("깜빡임 세기", Range(0, 1)) = 0.35
        _Dropout ("전송 끊김", Range(0, 1)) = 0
    }

    SubShader
    {
        Tags { "RenderType" = "Transparent" "Queue" = "Transparent" "RenderPipeline" = "UniversalPipeline" }

        Pass
        {
            Name "Forward"
            Tags { "LightMode" = "UniversalForward" }

            // 빛을 뒤에 더하는 투명 껍데기. 깊이를 쓰지 않아 뒤의 물체와 다른 투명 물체가 그대로 비친다.
            Blend SrcAlpha One
            ZWrite Off

            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile_instancing

            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"

            // SRP Batcher 호환: 머티리얼 값은 모두 이 버퍼 안에 둔다.
            CBUFFER_START(UnityPerMaterial)
                float4 _HoloColor;
                float _RimPower;
                float _LineSpacing;
                float _ScanSpeed;
                float _GlitchStrength;
                float _Flicker;
                float _Dropout;
            CBUFFER_END

            // core.hlsl 이 받는 입력. 메시 무대의 공통 형식이다. 스캔라인이 월드 높이를 쓰므로 positionWS 를 넣었다.
            struct SgInput
            {
                float2 uv;
                float3 positionOS;
                float3 positionWS;
                float3 normalOS;
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
                // 정점 글리치. 밀린 위치로 월드 위치와 화면 위치를 모두 구해야 스캔라인도 함께 어긋난다.
                float3 p = sgVertex(v.positionOS.xyz, v.normalOS, v.uv, _Time.y);
                o.positionWS = TransformObjectToWorld(p);
                o.positionCS = TransformWorldToHClip(o.positionWS);
                o.normalWS = TransformObjectToWorldNormal(v.normalOS);
                o.normalOS = v.normalOS;
                o.positionOS = p;
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
                i.positionWS = v.positionWS;
                i.normalOS = normalize(v.normalOS);
                i.normalWS = normalize(v.normalWS);
                // 눈마다 따로 구한다. XR 에서 두 눈의 테두리가 맞는다.
                i.viewWS = GetWorldSpaceNormalizeViewDir(v.positionWS);

                // 이 효과는 조명을 쓰지 않지만 메시 무대의 입력 형식을 맞춰 둔다. 그림자는 읽지 않는다.
                Light light = GetMainLight();
                i.lightDirWS = light.direction;
                i.lightColor = light.color;
                i.lighting = light.color * saturate(dot(i.normalWS, light.direction)) + SampleSH(i.normalWS);

                i.time = _Time.y;
                return sgEffect(i);
            }
            ENDHLSL
        }
    }
}
