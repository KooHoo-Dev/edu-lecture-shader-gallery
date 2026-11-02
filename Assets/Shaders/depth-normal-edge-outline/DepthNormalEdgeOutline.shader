// 깊이·법선 윤곽선 후처리 (URP 17, HLSL). Full Screen Pass Renderer Feature 의 Pass Material 로 쓴다.
// 효과 본체는 core.hlsl 에 있고, 이 파일은 URP 가 넘겨주는 화면, 깊이, 법선 텍스처를 읽는 부분만 맡는다.
// Full Screen Pass 의 Requirements 에서 Depth 와 Normal 을 켜야 깊이·법선 텍스처가 만들어진다.
// Normal 을 켜면 불투명 물체를 DepthNormals 패스로 한 번 더 그리는 프리패스가 돌고 깊이도 거기서 나온다.
// 그래서 DepthNormals 패스가 없는 셰이더(직접 쓴 언릿·툰 등)로 그린 물체에는 선이 생기지 않는다.
Shader "ShaderGallery/DepthNormalEdgeOutline"
{
    Properties
    {
        _Thickness ("선 두께 (픽셀)", Range(1, 4)) = 3
        _DepthSensitivity ("깊이 민감도", Range(0, 40)) = 12
        _NormalSensitivity ("법선 민감도", Range(0, 4)) = 1.5
        _LineColor ("선 색", Color) = (1, 0.941, 0.784, 1)
        _FadeDistance ("선이 사라지는 거리", Range(5, 100)) = 30
        _SceneMix ("원래 화면 섞기", Range(0, 1)) = 1
        _PaperColor ("종이 색", Color) = (0.106, 0.141, 0.2, 1)
    }

    SubShader
    {
        Tags { "RenderType" = "Opaque" "RenderPipeline" = "UniversalPipeline" }
        ZWrite Off
        ZTest Always
        Cull Off

        Pass
        {
            Name "DepthNormalEdgeOutline"

            HLSLPROGRAM
            #pragma vertex Vert
            #pragma fragment frag
            // Deferred 에서 Accurate G-buffer Normals 를 켜면 법선 텍스처가 8각형(oct) 부호화로 저장된다.
            // 이 키워드가 있어야 SampleSceneNormals 가 풀어서 돌려준다. 없으면 부호화된 값을 법선으로 읽어 매끈한 공에도 얼룩 선이 생긴다.
            #pragma multi_compile_fragment _ _GBUFFER_NORMALS_OCT

            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            // _BlitTexture, Vert, Varyings 를 제공한다.
            #include "Packages/com.unity.render-pipelines.core/Runtime/Utilities/Blit.hlsl"
            // _CameraDepthTexture 와 SampleSceneDepth. Requirements 의 Depth 가 채운다.
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/DeclareDepthTexture.hlsl"
            // _CameraNormalsTexture 와 SampleSceneNormals. Requirements 의 Normal 이 채운다.
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/DeclareNormalsTexture.hlsl"

            // SRP Batcher 호환: 머티리얼 값은 모두 이 버퍼 안에 둔다.
            CBUFFER_START(UnityPerMaterial)
                float _Thickness;
                float _DepthSensitivity;
                float _NormalSensitivity;
                float4 _LineColor;
                float _FadeDistance;
                float _SceneMix;
                float4 _PaperColor;
            CBUFFER_END

            // core.hlsl 이 받는 입력. 전체 화면 무대의 공통 형식이다. uv 는 왼쪽 아래가 (0, 0) 이다.
            struct SgInput
            {
                float2 uv;
                float aspect;
                float2 texelSize;
                float time;
            };

            float4 sgSource(float2 uv)
            {
                return SAMPLE_TEXTURE2D_X(_BlitTexture, sampler_LinearClamp, uv);
            }

            // 카메라에서 그 픽셀까지의 선형 거리(미터). 하늘은 먼 평면 근처다.
            // 직교 카메라(아이소메트릭 등)는 깊이 버퍼가 이미 선형이라 LinearEyeDepth 로 풀면 값이 틀려 깊이 윤곽이 사라진다.
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
            // 월드 법선. 법선 텍스처에 그려지지 않은 곳(하늘, 투명 물체, DepthNormals 패스가 없는 셰이더)은 0 이다.
            float3 sgSceneNormal(float2 uv) { return SampleSceneNormals(uv); }

            #include "core.hlsl"

            float4 frag(Varyings v) : SV_Target
            {
                UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX(v);

                SgInput i;
                i.uv = v.texcoord;
                i.aspect = _ScreenParams.x / _ScreenParams.y;
                // 화면 한 픽셀의 uv 크기. 렌더 스케일이 바뀌면 이 값도 바뀌어 선 두께가 화면 비율로는 달라진다.
                i.texelSize = _ScreenSize.zw;
                i.time = _Time.y;
                return float4(sgEffect(i).rgb, 1.0);
            }
            ENDHLSL
        }
    }
}
