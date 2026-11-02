// 씬 컬러 굴절 유리: 불투명 장면을 담은 Opaque Texture 를 밀린 화면 좌표로 읽어 뒤를 휘어 보이는 유리 (URP 17, HLSL).
// URP Asset 의 Opaque Texture 와 Depth Texture 를 켜야 한다. 효과 본체는 core.hlsl 에 있다.
Shader "ShaderGallery/ScreenRefractionGlass"
{
    Properties
    {
        _Refraction ("굴절 세기", Range(0, 0.2)) = 0.12
        _Thickness ("가장자리 두께", Range(0, 4)) = 1.5
        _NoiseStrength ("노이즈 세기", Range(0, 1)) = 0.3
        _NoiseScale ("노이즈 촘촘함", Range(1, 20)) = 6
        _FlowSpeed ("노이즈 흐름", Range(-1, 1)) = 0.15
        _Dispersion ("색수차", Range(0, 1)) = 0.25
        _GlassColor ("유리 색", Color) = (0.851, 0.9412, 1, 1)
        _FresnelColor ("반사 색", Color) = (0.8784, 0.9333, 1, 1)
        _FresnelPower ("반사 좁히기", Range(0.5, 8)) = 3
        _FresnelStrength ("반사 세기", Range(0, 1)) = 0.6
    }

    SubShader
    {
        Tags { "RenderType" = "Transparent" "Queue" = "Transparent" "RenderPipeline" = "UniversalPipeline" }

        Pass
        {
            Name "Forward"
            Tags { "LightMode" = "UniversalForward" }

            // 뒤 장면은 Opaque Texture 에서 직접 읽어 그리므로 알파는 1 이다. 투명 큐에 두어야 Opaque Texture 가 준비된 뒤 그려진다.
            // ZWrite Off 라 유리 뒤에 있으면서 유리보다 늦게 그려지는 투명 물체는 굴절 없이 유리 위에 얹힌다.
            // 그런 물체를 일관되게 가리려면 ZWrite On 으로 바꾼다. 깊이 텍스처는 불투명 뒤에 복사되므로 굴절 계산에는 영향이 없다.
            // 갤러리 규격의 투명 혼합(ZWrite Off)을 따라 기본은 Off 로 둔다.
            Blend SrcAlpha OneMinusSrcAlpha
            ZWrite Off

            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile_instancing

            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/DeclareDepthTexture.hlsl"
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/DeclareOpaqueTexture.hlsl"

            // SRP Batcher 호환: 머티리얼 값은 모두 이 버퍼 안에 둔다.
            CBUFFER_START(UnityPerMaterial)
                float _Refraction;
                float _Thickness;
                float _NoiseStrength;
                float _NoiseScale;
                float _FlowSpeed;
                float _Dispersion;
                float4 _GlassColor;
                float4 _FresnelColor;
                float _FresnelPower;
                float _FresnelStrength;
            CBUFFER_END

            // core.hlsl 이 받는 입력. 깊이 무대의 공통 형식이다.
            struct SgInput
            {
                float2 uv;
                float3 positionOS;
                float3 normalWS;
                float3 viewWS;
                float3 cameraRightWS;
                float3 cameraUpWS;
                float2 screenUV;
                float depthDelta;
                float time;
            };

            // 불투명 물체만 그려진 장면 색 (URP 의 _CameraOpaqueTexture).
            float4 sgSceneColor(float2 uv) { return float4(SampleSceneColor(uv), 1.0); }

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
                // 카메라의 오른쪽, 위 축(월드). 화면 좌표를 미는 방향을 이 두 축으로 만든다.
                i.cameraRightWS = UNITY_MATRIX_V[0].xyz;
                i.cameraUpWS = UNITY_MATRIX_V[1].xyz;

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
