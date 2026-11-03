// 클로킹 투명화: 몸 대신 Opaque Texture 의 뒤 장면을 법선만큼 밀어 그리고 프레넬 테두리만 남기는 은신 효과 (URP 17, HLSL).
// URP Asset 의 Opaque Texture 와 Depth Texture 를 켜야 한다. 효과 본체는 core.hlsl 에 있다.
Shader "ShaderGallery/CloakRefractionShimmer"
{
    Properties
    {
        _Cloak ("은신", Range(0, 1)) = 0.55
        _MaxCloak ("최대 은신", Range(0, 1)) = 1
        _Reveal ("피격 노출", Range(0, 1)) = 0
        [Enum(Height, 0, Noise, 1, FresnelInward, 2)] _MaskMode ("마스크 방식", Float) = 0
        _BodyBottom ("몸 아래 끝 (오브젝트 y)", Range(-2, 2)) = -1
        _BodyHeight ("몸 높이", Range(0.5, 4)) = 2
        _Refraction ("굴절 세기", Range(0, 0.15)) = 0.05
        [ToggleUI] _CalmAtFull ("완전 은신 때 굴절 줄이기", Float) = 1
        _ShimmerSpeed ("일렁임 속도", Range(0, 3)) = 0.8
        _NoiseScale ("노이즈 크기", Range(1, 20)) = 6
        _RimColor ("테두리 색", Color) = (0.624, 0.847, 1, 1)
        _RimStrength ("테두리 세기", Range(0, 2)) = 0.5
        _RimPower ("테두리 날카로움", Range(0.5, 8)) = 3
        _BandColor ("경계 띠 색", Color) = (0.498, 0.831, 1, 1)
        _BandWidth ("경계 띠 폭", Range(0.01, 0.3)) = 0.08
        _BandGlow ("경계 띠 밝기", Range(0, 3)) = 1
        _BaseColor ("몸 색", Color) = (0.541, 0.588, 0.639, 1)
    }

    SubShader
    {
        // 투명 큐에 두어야 Opaque Texture 가 준비된 뒤 그려진다.
        Tags { "RenderType" = "Transparent" "Queue" = "Transparent" "RenderPipeline" = "UniversalPipeline" }

        HLSLINCLUDE
        #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
        #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"
        #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/DeclareDepthTexture.hlsl"
        #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/DeclareOpaqueTexture.hlsl"

        // SRP Batcher 호환: 머티리얼 값은 모두 이 버퍼 안에 둔다.
        CBUFFER_START(UnityPerMaterial)
            float _Cloak;
            float _MaxCloak;
            float _Reveal;
            float _MaskMode;
            float _BodyBottom;
            float _BodyHeight;
            float _Refraction;
            float _CalmAtFull;
            float _ShimmerSpeed;
            float _NoiseScale;
            float4 _RimColor;
            float _RimStrength;
            float _RimPower;
            float4 _BandColor;
            float _BandWidth;
            float _BandGlow;
            float4 _BaseColor;
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
            float3 lightDirWS;
            float3 lightColor;
            float3 lighting;
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
        ENDHLSL

        // 몸의 가장 앞면만 남기는 깊이 패스. 색은 쓰지 않고 깊이만 쓴다 (ZWrite On, ColorMask 0).
        // URP 는 같은 물체에서 SRPDefaultUnlit 패스를 UniversalForward 보다 먼저 그린다. 그래서 아래 Forward 패스가
        // 같은 깊이(ZTest LEqual)인 가장 앞면에서만 그려지고, 팔 뒤의 몸통처럼 뒤에 겹친 면은 깊이 시험에서 빠진다.
        // 알파 1 로 뒤 장면을 덮어 그리므로 이 패스가 없으면 그리는 순서에 따라 뒤쪽 면이 앞면 위에 칠해진다.
        // 깊이 텍스처는 불투명 뒤에 복사되므로 이 깊이는 굴절 계산(앞 물체 가드)에 섞이지 않는다.
        Pass
        {
            Name "CloakDepth"
            Tags { "LightMode" = "SRPDefaultUnlit" }
            ZWrite On
            ColorMask 0

            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment fragDepth
            #pragma multi_compile_instancing

            float4 fragDepth(Varyings v) : SV_Target
            {
                UNITY_SETUP_INSTANCE_ID(v);
                UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX(v);
                return 0;
            }
            ENDHLSL
        }

        Pass
        {
            Name "Forward"
            Tags { "LightMode" = "UniversalForward" }

            // 뒤 장면은 Opaque Texture 에서 직접 읽어 그리므로 평소 알파는 1 이다. 혼합은 갤러리의 효과 끄기(알파 페이드)만 쓴다.
            // 깊이는 위 CloakDepth 패스가 이미 썼으므로 여기서는 쓰지 않고 같은 깊이만 통과시킨다.
            Blend SrcAlpha OneMinusSrcAlpha
            ZWrite Off
            ZTest LEqual

            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile_instancing

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

                // 보이는 상태의 몸 음영. 위치를 넘기는 형식이라야 그림자 거리 페이드와 Shadowmask 가 빠지지 않는다.
                // distanceAttenuation(광원 Culling Mask)은 곱하지 않는다. 갤러리 촬영 씬에서 0 으로 들어와 직사광이 사라졌다.
                // 깊이 무대의 규칙대로 받는 그림자는 넣지 않는다 (웹 미리보기와 같다).
                Light light = GetMainLight(TransformWorldToShadowCoord(v.positionWS), v.positionWS, half4(1, 1, 1, 1));
                i.lightDirWS = light.direction;
                i.lightColor = light.color;
                i.lighting = light.color * saturate(dot(i.normalWS, light.direction)) + SampleSH(i.normalWS);

                // 씬 표면의 눈 깊이 - 이 픽셀의 눈 깊이. 눈 깊이는 카메라 정면 축 방향의 거리다.
                float sceneEye = sgSceneDepth(i.screenUV);
                float selfEye = LinearEyeDepth(v.positionWS, UNITY_MATRIX_V);
                i.depthDelta = sceneEye - selfEye;

                i.time = _Time.y;
                return sgEffect(i);
            }
            ENDHLSL
        }

        // 보이는 상태의 몸이 그림자를 드리운다. 은신 중에는 CloakController 가 Renderer 의 Cast Shadows 를 끈다.
        Pass
        {
            Name "ShadowCaster"
            Tags { "LightMode" = "ShadowCaster" }
            ZWrite On
            ColorMask 0

            HLSLPROGRAM
            #pragma vertex vertShadow
            #pragma fragment fragShadow
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

            float4 fragShadow(Varyings v) : SV_Target
            {
                UNITY_SETUP_INSTANCE_ID(v);
                UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX(v);
                return 0;
            }
            ENDHLSL
        }
    }
}
