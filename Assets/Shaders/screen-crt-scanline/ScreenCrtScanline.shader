// CRT 화면 필터 (URP 17, HLSL). Full Screen Pass Renderer Feature 의 Pass Material 로 쓴다.
// 효과 본체는 core.hlsl 에 있고, 이 파일은 URP 가 넘겨주는 화면 텍스처를 읽는 부분만 맡는다.
Shader "ShaderGallery/ScreenCrtScanline"
{
    Properties
    {
        _Lines ("목표 줄 수", Range(120, 480)) = 200
        _Scan ("줄 사이 어둡기", Range(0, 0.4)) = 0.3
        [Enum(None, 0, Aperture Grille, 1, Slot, 2)] _Mask ("형광체 마스크", Float) = 1
        _MaskStrength ("마스크 세기 (세로 줄, 슬롯)", Range(0, 0.5)) = 0.15
        _Curve ("화면 휨", Range(0, 0.3)) = 0.08
        _Bleed ("색 번짐", Range(0, 1)) = 0.3
        _Vignette ("비네트", Range(0, 1)) = 0.3
        _Boost ("밝기 보정", Range(1, 1.6)) = 1.2
        _Roll ("느린 밝은 띠", Range(0, 1)) = 0.5
        _PowerOff ("전원 끄기", Range(0, 1)) = 0
    }

    SubShader
    {
        Tags { "RenderType" = "Opaque" "RenderPipeline" = "UniversalPipeline" }
        ZWrite Off
        ZTest Always
        Cull Off

        Pass
        {
            Name "ScreenCrtScanline"

            HLSLPROGRAM
            #pragma vertex Vert
            #pragma fragment frag

            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            // _BlitTexture, Vert, Varyings 를 제공한다.
            #include "Packages/com.unity.render-pipelines.core/Runtime/Utilities/Blit.hlsl"

            // SRP Batcher 호환: 머티리얼 값은 모두 이 버퍼 안에 둔다.
            CBUFFER_START(UnityPerMaterial)
                float _Lines;
                float _Scan;
                float _Mask;
                float _MaskStrength;
                float _Curve;
                float _Bleed;
                float _Vignette;
                float _Boost;
                float _Roll;
                float _PowerOff;
            CBUFFER_END

            // core.hlsl 이 받는 입력. 전체 화면 무대의 공통 형식이다. uv 는 왼쪽 아래가 (0, 0) 이다.
            struct SgInput
            {
                float2 uv;
                float aspect;
                float2 texelSize;
                float time;
            };

            // 휜 좌표와 색 번짐 탭이 화면 밖으로 나가도 가장자리 색을 읽도록 Clamp 샘플러를 쓴다 (밖은 core 가 검게 지운다).
            float4 sgSource(float2 uv)
            {
                return SAMPLE_TEXTURE2D_X(_BlitTexture, sampler_LinearClamp, uv);
            }

            #include "core.hlsl"

            float4 frag(Varyings v) : SV_Target
            {
                UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX(v);

                SgInput i;
                // XR 주의: 줄무늬와 휨이 머리에 붙은 화면 공간에 그려지고 uv (0.5, 0.5) 가 눈의 정면이 아니다 (실기기 미확인).
                // XR 에서는 이 패스를 끄고, 가상 모니터 메시에 렌더 텍스처로 입히는 방식을 쓴다.
                i.uv = v.texcoord;
                i.aspect = _ScreenParams.x / _ScreenParams.y;
                // 화면 한 픽셀의 uv 크기. 줄 간격을 정수 픽셀로 맞추고 마스크의 픽셀 열 번호를 구하는 데 쓴다.
                i.texelSize = _ScreenSize.zw;
                i.time = _Time.y;
                return float4(sgEffect(i).rgb, 1.0);
            }
            ENDHLSL
        }
    }
}
