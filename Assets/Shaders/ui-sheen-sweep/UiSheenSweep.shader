// 광택 훑기 UI 셰이더 (URP 17, HLSL). UGUI Image 의 Material 칸에 넣어 쓴다.
//
// [UI 래퍼] ui-sdf-shape 의 UiSdfShape.shader 래퍼를 복사해 (1) 셰이더 이름, (2) "표본 속성" 묶음, (3) CBUFFER 안의 표본 값만 바꿨다.
// 이 래퍼는 Unity 내장 UI/Default 셰이더의 구조를 HLSLPROGRAM 과 URP ShaderLibrary 로 옮긴 틀이다.
// "UI 공통" 이라고 적힌 줄은 Mask, RectMask2D, 캔버스가 이름으로 찾아 쓰므로 이름과 구조를 그대로 둔다.
//
// 패스는 LightMode 태그 없이 하나다.
//   - Screen Space - Overlay 캔버스는 셰이더의 첫 패스를 그대로 쓴다.
//   - Camera, World Space 캔버스와 2D Renderer 는 태그 없는 패스를 SRPDefaultUnlit 으로 보고 그린다.
//   그래서 스프라이트 표본처럼 Universal2D, UniversalForward 패스를 나누지 않는다.
//
// UI 표본이 알아야 할 UGUI 의 동작 (아래 해당 줄에도 적었다):
//   - Mask 는 마스크 그래픽의 머티리얼 복사본에 UNITY_UI_ALPHACLIP 을 자동으로 켠다. 그래서 frag 의 clip 이 있어야
//     자식이 그림 모양대로 가려진다. 없으면 알파 0 인 곳까지 스텐실이 써져 Image 사각형 그대로 가려진다.
//   - CanvasGroup 의 alpha, Button 의 색 전환(Color Tint), Image.color 는 모두 정점 색으로 들어온다.
//     core.hlsl 이 i.color 를 곱하지 않으면 페이드와 버튼 눌림 색이 통째로 무시된다.
//   - 캔버스의 Vertex Color Always In Gamma Color Space 는 캔버스 전체 옵션이다. 켜면 정점 색이 sRGB 그대로 들어오므로
//     Linear 프로젝트에서 vert 가 선형으로 바꾼다 (_UIVertexColorAlwaysGammaSpace).
//   - RectMask2D 는 UNITY_UI_CLIP_RECT 와 _ClipRect, Softness 를 넘긴다. frag 가 Softness 식으로 가장자리를 자른다.
Shader "ShaderGallery/UiSheenSweep"
{
    Properties
    {
        // UI 공통: Image 가 Source Image 를 렌더러 단위로 넘긴다. [PerRendererData] 라 머티리얼 인스펙터에는 안 보인다.
        // 이 표본은 Source Image 의 그림과 알파를 읽고 그 위에 광택을 얹는다.
        [PerRendererData] _MainTex ("스프라이트", 2D) = "white" {}

        // 표본 속성
        _SheenColor ("광택 색", Color) = (1, 0.9529, 0.8196, 1)
        _SheenIntensity ("광택 세기", Range(0, 2)) = 0.75
        _SheenWidth ("띠 폭 (짧은 변 비율)", Range(0.02, 0.6)) = 0.22
        _SheenSoftness ("띠 부드러움", Range(0, 1)) = 0.7
        _SheenAngle ("띠 각도 (도)", Range(-60, 60)) = 25
        _SweepPeriod ("주기 (초)", Range(1, 6)) = 2.2
        _SweepPause ("쉬는 간격 (주기 비율)", Range(0, 0.9)) = 0.35
        [ToggleUI] _AutoSweep ("자동 훑기", Float) = 1
        _SweepPulse ("이벤트 훑기 진행", Range(0, 1)) = 0

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
        // (스텐실을 그림 모양대로 쓰게). 직접 켜는 것은 겹친 UI 의 스텐실, 깊이 문제를 피할 때다.
        [Toggle(UNITY_UI_ALPHACLIP)] _UseUIAlphaClip ("Use Alpha Clip", Float) = 0
    }

    SubShader
    {
        // UI 공통: UI/Default 와 같은 태그. 단 CanUseSpriteAtlas 만 다르다.
        // 이 셰이더는 uv 가 Image 의 0~1 을 돈다고 보고 띠의 위치와 이동 거리를 정한다. 아틀라스에 묶인 스프라이트는
        // uv 가 아틀라스 속 작은 구간만 돌아 띠가 아틀라스 전체를 기준으로 지나가므로 False 로 둔다.
        // 스프라이트 시트(Sprite Mode Multiple)와 Sliced, Tiled 도 같다. 아틀라스·시트에서 뺀 스프라이트를 Simple 로 쓰거나,
        // BaseMeshEffect 로 Image 기준 0~1 좌표를 uv1 에 넣고(캔버스 Additional Shader Channels 의 TexCoord1) 그 좌표로 띠를 계산한다.
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
        // unity_GUIZTestMode 는 캔버스가 넣는다. Overlay 는 깊이 비교를 끄고, World Space 는 LessEqual 로 3D 물체에 가려진다.
        Cull Off
        ZWrite Off
        ZTest [unity_GUIZTestMode]
        // 알파 혼합. 알파 채널은 One OneMinusSrcAlpha 로 쌓아야 렌더 텍스처에 찍어도 알파가 맞다.
        // 광택은 색에 더하고 알파는 이미지 알파 그대로 두므로, 이 혼합이 색에 알파를 곱하면서 광택을 그림 안에만 남긴다.
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

            // 머티리얼 값은 모두 이 버퍼 안에 둔다 (SRP Batcher 규칙. UI 는 캔버스가 따로 묶지만 SpriteRenderer 에 써도 맞게 둔다).
            CBUFFER_START(UnityPerMaterial)
                float4 _MainTex_ST;
                float4 _SheenColor;
                float _SheenIntensity;
                float _SheenWidth;
                float _SheenSoftness;
                float _SheenAngle;
                float _SweepPeriod;
                float _SweepPause;
                float _AutoSweep;
                float _SweepPulse;
            CBUFFER_END

            // core.hlsl 안에서 텍스처를 읽는 매크로. 웹에서는 texture() 로 바뀐다.
            #define SG_TEX(name, uv) SAMPLE_TEXTURE2D(name, sampler##name, uv)

            // core.hlsl 이 받는 입력. 스프라이트 무대와 같은 형식이라 웹 미리보기가 그대로 돈다.
            struct SgInput
            {
                float2 uv;
                float4 color;
                float2 texelSize;
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
                // 렌더러 단위로 넘어오는 텍스처는 _MainTex_TexelSize 를 믿을 수 없다 (스프라이트 표본과 같은 이유).
                // 이 표본의 core 는 texelSize 를 쓰지 않지만 SgInput 형식을 맞추려고 실제 크기를 묻는다.
                uint width, height;
                _MainTex.GetDimensions(width, height);

                SgInput i;
                i.uv = v.uv;
                i.color = v.color;
                i.texelSize = float2(1.0 / width, 1.0 / height);
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
                // UI 공통: UI/Default 와 같은 기준값. Mask 는 마스크 그래픽에서 이 키워드를 자동으로 켜므로,
                // 이 줄이 있어야 알파 0 인 바깥이 스텐실에 안 써지고 자식이 그림 모양대로 가려진다.
                clip(c.a - 0.001);
                #endif

                return c;
            }
            ENDHLSL
        }
    }
}
