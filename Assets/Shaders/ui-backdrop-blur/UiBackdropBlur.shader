// 배경 블러 유리 UI 셰이더 (URP 17, HLSL). UGUI Image 의 Material 칸에 넣어 쓴다.
// 패널 뒤 화면을 URP 의 Opaque Texture(카메라가 불투명 물체를 그린 직후의 복사본)에서 여러 번 읽어 흐리게 비춘다.
// URP Asset 의 Opaque Texture 를 켜야 한다. 효과 본체는 core.hlsl 에 있다.
//
// 패널을 열고 닫는 _Hide 는 UiBackdropPanel.cs 가 Image 마다 만든 머티리얼 복사본에 넣는다.
//
// [UI 래퍼] ui-sdf-shape 의 UiSdfShape.shader 를 복사했다. 셰이더 이름, "표본 속성" 묶음, CBUFFER, 씬 색상 읽기만 바꿨다.
// "UI 공통" 이라고 적힌 줄은 Mask, RectMask2D, 캔버스가 이름으로 찾아 쓰므로 이름과 구조를 그대로 둔다.
//
// 캔버스 제약:
//   - Screen Space - Camera 캔버스를 권한다 (Render Camera 에 장면을 그리는 Base 카메라). World Space 캔버스도 된다.
//   - Screen Space - Overlay 캔버스에서 Opaque Texture 가 읽히는지는 보장되지 않고 확인하지 않았다. URP 17.3 은 Overlay UI 도
//     카메라 렌더 그래프 안에서 그려 읽힐 수 있지만, 읽혀도 투명 물체와 후처리가 빠진 복사본이라 패널 색이 주변 화면과 다르다.
//   - UI 만 그리는 Overlay 카메라(카메라 스택)는 Opaque Texture 를 만들지 않는다. 그 카메라를 Render Camera 로 쓰면 뒤가 비치지 않는다.
//   - Opaque Texture 는 불투명 물체만 담는다. 다른 UI, 투명 물체, 파티클은 흐림에 들어가지 않는다.
//     반대로 패널보다 앞에 있는 불투명 물체는 들어 있어, 그 물체 둘레에 물체 색이 흐리게 번진다.
//   - 2D Renderer 에는 Opaque Texture 가 없다. Camera Sorting Layer Texture 를 대신 읽어야 한다 (sgSceneColor 를 바꾼다).
//
// 패스는 LightMode 태그 없이 하나다.
//   - Camera, World Space 캔버스와 2D Renderer 는 태그 없는 패스를 SRPDefaultUnlit 으로 보고 그린다.
//   - Overlay 캔버스도 첫 패스를 쓰지만 위 이유로 뒤가 맞게 비친다고 보장할 수 없다.
Shader "ShaderGallery/UiBackdropBlur"
{
    Properties
    {
        // UI 공통: Image 가 Source Image 를 렌더러 단위로 넘긴다. [PerRendererData] 라 머티리얼 인스펙터에는 안 보인다.
        // 이 표본은 패널 모양을 계산으로 그리므로 텍스처를 읽지 않는다. Source Image 는 비워 둔다.
        [PerRendererData] _MainTex ("스프라이트 (쓰지 않음)", 2D) = "white" {}

        // 표본 속성
        _BlurRadius ("흐림 반경 (화면 높이 비율)", Range(0, 0.1)) = 0.045
        [Enum(Low, 0, Medium, 1, High, 2)] _Quality ("샘플 수 (Low 8, Medium 16, High 32)", Float) = 1
        _TintColor ("유리 색", Color) = (0.8314, 0.8784, 0.9412, 1)
        _TintAmount ("유리 색 비율", Range(0, 1)) = 0.18
        _RimColor ("테두리 빛 색", Color) = (0.8784, 0.9333, 1, 1)
        _RimGlow ("테두리 빛 밝기", Range(0, 2)) = 0.8
        _CornerRadius ("모서리 둥글기 (짧은 변 반의 비율)", Range(0, 1)) = 0.18
        _Hide ("닫힘 (0 = 열림)", Range(0, 1)) = 0

        // UI 공통: Mask 컴포넌트가 이 다섯 값을 바꾼 복사본 머티리얼로 스텐실을 써서 자식을 가린다.
        // 없으면 Mask 안에 넣었을 때 Unity 가 경고하고 가려지지 않는다. 이름을 바꾸지 않는다.
        _StencilComp ("Stencil Comparison", Float) = 8
        _Stencil ("Stencil ID", Float) = 0
        _StencilOp ("Stencil Operation", Float) = 0
        _StencilWriteMask ("Stencil Write Mask", Float) = 255
        _StencilReadMask ("Stencil Read Mask", Float) = 255

        // UI 공통: Mask 의 Show Mask Graphic 을 끄면 0 이 들어와 색을 쓰지 않고 스텐실만 쓴다.
        _ColorMask ("Color Mask", Float) = 15

        // UI 공통: 켜면 알파가 거의 0 인 픽셀을 버린다. Mask 가 마스크 그래픽의 복사본 머티리얼에서 자동으로 켠다
        // (스텐실을 패널 모양대로 쓰게). 직접 켜는 것은 겹친 UI 의 스텐실, 깊이 문제를 피할 때다.
        [Toggle(UNITY_UI_ALPHACLIP)] _UseUIAlphaClip ("Use Alpha Clip", Float) = 0
    }

    SubShader
    {
        // UI 공통: UI/Default 와 같은 태그. uv 0~1 로 패널 모양을 그리므로 아틀라스 스프라이트를 받지 않는다 (CanUseSpriteAtlas False).
        Tags
        {
            "Queue" = "Transparent"
            "IgnoreProjector" = "True"
            "RenderType" = "Transparent"
            "PreviewType" = "Plane"
            "CanUseSpriteAtlas" = "False"
            "RenderPipeline" = "UniversalPipeline"
        }

        // UI 공통: Mask 가 넣는 값으로 스텐실을 읽고 쓴다.
        Stencil
        {
            Ref [_Stencil]
            Comp [_StencilComp]
            Pass [_StencilOp]
            ReadMask [_StencilReadMask]
            WriteMask [_StencilWriteMask]
        }

        // UI 공통: 앞뒤 구분 없이 그리고(Cull Off) 깊이를 쓰지 않는다.
        // unity_GUIZTestMode 는 캔버스가 넣는다. Camera, World Space 캔버스는 LessEqual 로 더 가까운 3D 물체에 가려진다.
        Cull Off
        ZWrite Off
        ZTest [unity_GUIZTestMode]
        // 알파 혼합. 알파 채널은 One OneMinusSrcAlpha 로 쌓아야 렌더 텍스처에 찍어도 알파가 맞다.
        Blend SrcAlpha OneMinusSrcAlpha, One OneMinusSrcAlpha
        ColorMask [_ColorMask]

        Pass
        {
            // LightMode 태그를 붙이지 않는다 (위 머리말 참고).
            Name "Default"

            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            // XR(싱글 패스 인스턴싱)과 GPU 인스턴싱 매크로가 동작하게 둔다. 수업 XR 프로젝트에서 쓴다.
            #pragma multi_compile_instancing
            // UI 공통: RectMask2D 가 자식에게 켜는 키워드. 켜지면 _ClipRect 밖을 지운다.
            #pragma multi_compile_local _ UNITY_UI_CLIP_RECT
            // UI 공통: _UseUIAlphaClip 토글이 켜는 키워드. Mask 가 마스크 그래픽의 머티리얼 복사본에서 자동으로 켠다.
            // 실행 중에 만든 복사본이 켜는 키워드라 shader_feature 로 바꾸면 빌드에서 변형이 빠질 수 있다. multi_compile 로 둔다.
            #pragma multi_compile_local _ UNITY_UI_ALPHACLIP

            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            // 깊이 무대 공통 include. 이 표본은 깊이를 읽지 않지만 깊이 무대 래퍼의 틀을 맞춘다
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/DeclareDepthTexture.hlsl"
            // 씬 색상(_CameraOpaqueTexture). URP Asset 의 Opaque Texture 가 꺼져 있으면 빈 텍스처가 들어온다
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/DeclareOpaqueTexture.hlsl"

            // UI 공통: Image 의 Source Image. 비어 있으면 흰 텍스처가 들어온다.
            TEXTURE2D(_MainTex);
            SAMPLER(sampler_MainTex);

            // UI 공통: 아래 넷은 머티리얼 속성이 아니라 캔버스와 CanvasRenderer 가 넣는 값이라 UI/Default 처럼 CBUFFER 밖에 둔다.
            // RectMask2D 의 사각형 (캔버스 좌표, xy = 왼쪽 아래, zw = 오른쪽 위).
            float4 _ClipRect;
            // RectMask2D 의 Softness (픽셀). 0 이면 칼같이 자르고, 크면 그 폭에 걸쳐 흐려진다.
            float _UIMaskSoftnessX;
            float _UIMaskSoftnessY;
            // 캔버스의 Vertex Color Always In Gamma Color Space (캔버스 전체 옵션). 켜져 있으면 1.
            float _UIVertexColorAlwaysGammaSpace;

            // 머티리얼 값은 모두 이 버퍼 안에 둔다 (SRP Batcher 규칙).
            CBUFFER_START(UnityPerMaterial)
                float4 _MainTex_ST;
                float _BlurRadius;
                float _Quality;
                float4 _TintColor;
                float _TintAmount;
                float4 _RimColor;
                float _RimGlow;
                float _CornerRadius;
                float _Hide;
            CBUFFER_END

            // core.hlsl 안에서 텍스처를 읽는 매크로. 이 표본은 쓰지 않는다.
            #define SG_TEX(name, uv) SAMPLE_TEXTURE2D(name, sampler##name, uv)

            // 씬 색상. SampleSceneColor 와 같은 텍스처를 읽되 밉 0 을 직접 고른다(LOD).
            // 블러는 반복문 안에서 여러 번 읽는데, 미분을 쓰는 보통 샘플은 횟수가 바뀌는 반복문 안에서
            // 일부 컴파일러(D3D)가 반복을 강제로 펼치거나 거부한다. Opaque Texture 는 밉이 없어 결과는 같다.
            // SampleSceneColor 가 하던 좌표 처리도 같이 옮긴다. ClampAndScaleUVForBilinear 는 Dynamic Resolution 처럼
            // 텍스처의 일부만 쓰일 때 좌표를 그 영역으로 줄이고, 가장자리 반 텍셀 안으로 묶는다.
            // 흐림은 화면 가장자리 너머까지 읽으므로 이것이 없으면 유효 영역 밖의 쓰레기 색이 섞인다.
            float4 sgSceneColor(float2 uv)
            {
                uv = ClampAndScaleUVForBilinear(UnityStereoTransformScreenSpaceTex(uv), _CameraOpaqueTexture_TexelSize.xy);
                return float4(SAMPLE_TEXTURE2D_X_LOD(_CameraOpaqueTexture, sampler_CameraOpaqueTexture, uv, 0).rgb, 1.0);
            }

            // core.hlsl 이 받는 입력. 깊이 무대 형식 중 이 표본이 쓰는 것만 둔다.
            // color 는 Image 의 정점 색 (웹 무대는 항상 1).
            struct SgInput
            {
                float2 uv;
                float4 color;
                float2 screenUV;
                float time;
            };

            #include "core.hlsl"

            // UI 공통: sRGB 색을 선형으로 바꾼다 (sRGB 표준 식). 감마 정점 색 옵션을 켠 캔버스에서 쓴다.
            float3 UiGammaToLinear(float3 c)
            {
                float3 low = c / 12.92;
                float3 high = pow(max((c + 0.055) / 1.055, 0.0), 2.4);
                return lerp(low, high, step(0.04045, c));
            }

            struct Attributes
            {
                float4 positionOS : POSITION;
                float4 color : COLOR;
                float2 uv : TEXCOORD0;
                UNITY_VERTEX_INPUT_INSTANCE_ID
            };

            struct Varyings
            {
                float4 positionCS : SV_POSITION;
                float4 color : COLOR;
                float2 uv : TEXCOORD0;
                // UI 공통: RectMask2D 클리핑 재료. xy = 사각형 가운데 기준 위치의 두 배, zw = Softness 를 넣은 기울기.
                float4 mask : TEXCOORD1;
                UNITY_VERTEX_OUTPUT_STEREO
            };

            Varyings vert(Attributes v)
            {
                Varyings o = (Varyings)0;
                UNITY_SETUP_INSTANCE_ID(v);
                UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO(o);
                o.positionCS = TransformObjectToHClip(v.positionOS.xyz);
                o.uv = TRANSFORM_TEX(v.uv, _MainTex);

                // UI 공통: RectMask2D 의 Softness 클리핑 (UI/Default 와 같은 식).
                // 캔버스의 정점은 오브젝트 공간이 곧 캔버스 공간이라 positionOS 를 _ClipRect 와 바로 비교한다.
                // pixelSize 는 화면 한 픽셀이 캔버스 단위로 얼마인지다. Softness 가 0 이어도 1픽셀만큼은 부드럽게 자른다.
                float2 pixelSize = o.positionCS.w;
                pixelSize /= abs(mul((float2x2)UNITY_MATRIX_P, _ScreenParams.xy));
                // RectMask2D 가 없을 때 _ClipRect 는 아주 큰 값이라 계산이 넘치지 않게 묶는다
                float4 clampedRect = clamp(_ClipRect, -2e10, 2e10);
                o.mask = float4(v.positionOS.xy * 2.0 - clampedRect.xy - clampedRect.zw,
                                0.25 / (0.25 * float2(_UIMaskSoftnessX, _UIMaskSoftnessY) + abs(pixelSize.xy)));

                // UI 공통: 정점 색에는 Image.color, CanvasGroup 의 alpha, Button 의 색 전환(Color Tint)이 곱해져 들어온다.
                // core.hlsl 이 SgInput.color 로 받아 꼭 곱한다. 안 곱하면 페이드와 버튼 눌림 색이 무시된다.
                // 캔버스의 Vertex Color Always In Gamma Color Space(캔버스 전체 옵션)를 켜면 정점 색이 sRGB 그대로 오므로
                // Linear 프로젝트에서는 선형으로 바꾼다. Gamma 프로젝트는 원래 sRGB 로 계산하므로 그대로 둔다.
                // (UI/Default 의 _TextureSampleAdd 는 Text 의 글꼴 텍스처(알파 전용)를 위한 값이라 옮기지 않았다.)
                o.color = v.color;
                #ifndef UNITY_COLORSPACE_GAMMA
                if (_UIVertexColorAlwaysGammaSpace > 0.5)
                {
                    o.color.rgb = UiGammaToLinear(v.color.rgb);
                }
                #endif
                return o;
            }

            float4 frag(Varyings v) : SV_Target
            {
                // XR 에서 Opaque Texture 는 눈마다 한 장씩인 배열이다. 어느 눈의 장을 읽을지 정한다
                UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX(v);

                SgInput i;
                i.uv = v.uv;
                i.color = v.color;
                // 이 픽셀의 화면 좌표 (0~1). 씬 색상을 같은 자리에서 읽는 열쇠다
                i.screenUV = GetNormalizedScreenSpaceUV(v.positionCS);
                i.time = _Time.y;
                float4 c = sgEffect(i);

                #ifdef UNITY_UI_CLIP_RECT
                // UI 공통: RectMask2D 밖은 알파 0. 이것이 없으면 스크롤 목록 밖으로 그림이 샌다.
                // 사각형 반 크기에서 가운데까지의 거리를 빼면 안쪽이 양수다. Softness 폭으로 나눠 0~1 로 만든다.
                // (step 두 번으로 자르는 옛 UnityGet2DClipping 은 Softness 를 무시한다.)
                float2 m = saturate((_ClipRect.zw - _ClipRect.xy - abs(v.mask.xy)) * v.mask.zw);
                c.a *= m.x * m.y;
                #endif

                #ifdef UNITY_UI_ALPHACLIP
                // UI 공통: UI/Default 와 같은 기준값. Mask 가 마스크 그래픽에서 이 키워드를 자동으로 켠다.
                // 이 줄이 있어야 알파 0 인 모서리 바깥이 스텐실에 안 써지고 자식이 둥근 패널 모양대로 가려진다.
                clip(c.a - 0.001);
                #endif

                return c;
            }
            ENDHLSL
        }
    }
}
