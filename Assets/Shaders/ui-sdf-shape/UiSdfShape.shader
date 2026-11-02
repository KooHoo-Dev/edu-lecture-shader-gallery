// SDF 도형 UI 셰이더 (URP 17, HLSL). UGUI Image 의 Material 칸에 넣어 쓴다.
//
// [UI 래퍼] Unity 내장 UI/Default 셰이더의 구조를 HLSLPROGRAM 과 URP ShaderLibrary 로 옮긴 틀이다.
// 다음 UI 표본은 이 파일을 복사해서 (1) 셰이더 이름, (2) "표본 속성" 묶음, (3) CBUFFER 안의 표본 값만 바꾼다.
// "UI 공통" 이라고 적힌 줄은 Mask, RectMask2D, 캔버스가 이름으로 찾아 쓰므로 이름과 구조를 그대로 둔다.
//
// 패스는 LightMode 태그 없이 하나다.
//   - Screen Space - Overlay 캔버스는 셰이더의 첫 패스를 그대로 쓴다.
//   - Camera, World Space 캔버스와 2D Renderer 는 태그 없는 패스를 SRPDefaultUnlit 으로 보고 그린다.
//   그래서 스프라이트 표본처럼 Universal2D, UniversalForward 패스를 나누지 않는다.
Shader "ShaderGallery/UiSdfShape"
{
    Properties
    {
        // UI 공통: Image 가 Source Image 를 렌더러 단위로 넘긴다. [PerRendererData] 라 머티리얼 인스펙터에는 안 보인다.
        // 이 표본은 도형을 계산으로 그리므로 텍스처를 읽지 않는다. Source Image 는 비워 둔다.
        [PerRendererData] _MainTex ("스프라이트 (쓰지 않음)", 2D) = "white" {}

        // 표본 속성
        [Enum(RoundedRect, 0, Circle, 1, Ring, 2)] _Shape ("도형", Float) = 2
        _Fill ("채움 양", Range(0, 1)) = 0.7
        _Radius ("모서리 반경", Range(0, 1)) = 0.6
        _OutlineWidth ("윤곽 두께 (높이 비율)", Range(0, 0.08)) = 0.025
        _FillColor ("채움 색", Color) = (0.3098, 0.8196, 0.7725, 1)
        _OutlineColor ("윤곽 색", Color) = (0.9569, 0.9451, 0.8706, 1)
        _Aspect ("도형 가로세로 비", Range(0.5, 5)) = 1

        // UI 공통: Mask 컴포넌트가 이 다섯 값을 바꾼 복사본 머티리얼로 스텐실을 써서 자식을 가린다.
        // 없으면 Mask 안에 넣었을 때 Unity 가 경고하고 가려지지 않는다. 이름을 바꾸지 않는다.
        _StencilComp ("Stencil Comparison", Float) = 8
        _Stencil ("Stencil ID", Float) = 0
        _StencilOp ("Stencil Operation", Float) = 0
        _StencilWriteMask ("Stencil Write Mask", Float) = 255
        _StencilReadMask ("Stencil Read Mask", Float) = 255

        // UI 공통: Mask 의 Show Mask Graphic 을 끄면 0 이 들어와 색을 쓰지 않고 스텐실만 쓴다.
        _ColorMask ("Color Mask", Float) = 15

        // UI 공통: 켜면 알파가 거의 0 인 픽셀을 버린다. 겹친 UI 의 스텐실, 깊이 문제를 피할 때 쓴다.
        [Toggle(UNITY_UI_ALPHACLIP)] _UseUIAlphaClip ("Use Alpha Clip", Float) = 0
    }

    SubShader
    {
        // UI 공통: UI/Default 와 같은 태그. CanUseSpriteAtlas 는 Image 가 아틀라스 스프라이트를 넘겨도 된다는 표시다.
        Tags
        {
            "Queue" = "Transparent"
            "IgnoreProjector" = "True"
            "RenderType" = "Transparent"
            "PreviewType" = "Plane"
            "CanUseSpriteAtlas" = "True"
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
            // UI 공통: _UseUIAlphaClip 토글이 켜는 키워드.
            #pragma multi_compile_local _ UNITY_UI_ALPHACLIP

            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"

            // UI 공통: Image 의 Source Image. 비어 있으면 흰 텍스처가 들어온다.
            TEXTURE2D(_MainTex);
            SAMPLER(sampler_MainTex);

            // UI 공통: RectMask2D 의 사각형 (캔버스 좌표, xy = 왼쪽 아래, zw = 오른쪽 위).
            // 머티리얼 속성이 아니라 CanvasRenderer 가 넣는 값이라 UI/Default 처럼 CBUFFER 밖에 둔다.
            float4 _ClipRect;

            // 머티리얼 값은 모두 이 버퍼 안에 둔다 (SRP Batcher 규칙. UI 는 캔버스가 따로 묶지만 SpriteRenderer 에 써도 맞게 둔다).
            CBUFFER_START(UnityPerMaterial)
                float4 _MainTex_ST;
                float _Shape;
                float _Fill;
                float _Radius;
                float _OutlineWidth;
                float4 _FillColor;
                float4 _OutlineColor;
                float _Aspect;
            CBUFFER_END

            // core.hlsl 안에서 텍스처를 읽는 매크로. 웹에서는 texture() 로 바뀐다. 이 표본은 쓰지 않지만 다음 UI 표본이 쓴다.
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

            // UI 공통: UnityUI.cginc 의 UnityGet2DClipping 을 옮긴 것. 점이 사각형 안이면 1, 밖이면 0.
            // step 두 번으로 왼쪽 아래보다 크고 오른쪽 위보다 작은지를 x, y 따로 구해 곱한다.
            float UiGet2DClipping(float2 position, float4 clipRect)
            {
                float2 inside = step(clipRect.xy, position) * step(position, clipRect.zw);
                return inside.x * inside.y;
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
                // UI 공통: 클리핑에 쓰는 캔버스 좌표. 캔버스의 정점은 오브젝트 공간이 곧 캔버스 공간이다.
                float4 clipPosition : TEXCOORD1;
                UNITY_VERTEX_OUTPUT_STEREO
            };

            Varyings vert(Attributes v)
            {
                Varyings o = (Varyings)0;
                UNITY_SETUP_INSTANCE_ID(v);
                UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO(o);
                o.clipPosition = v.positionOS;
                o.positionCS = TransformObjectToHClip(v.positionOS.xyz);
                o.uv = TRANSFORM_TEX(v.uv, _MainTex);
                // UI 공통: 정점 색은 Image.color 다. core.hlsl 이 SgInput.color 로 받아 곱한다.
                // (UI/Default 의 _TextureSampleAdd, Canvas 의 Vertex Color Always In Gamma Color Space 처리는 텍스트용이라 옮기지 않았다.)
                o.color = v.color;
                return o;
            }

            float4 frag(Varyings v) : SV_Target
            {
                // 이 표본은 텍스처를 읽지 않지만, 다음 UI 표본이 SgInput.texelSize 를 쓸 수 있게 실제 크기를 묻는다.
                // 렌더러 단위로 넘어오는 텍스처는 _MainTex_TexelSize 를 믿을 수 없다 (스프라이트 표본과 같은 이유).
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
                c.a *= UiGet2DClipping(v.clipPosition.xy, _ClipRect);
                #endif

                #ifdef UNITY_UI_ALPHACLIP
                // UI 공통: UI/Default 와 같은 기준값.
                clip(c.a - 0.001);
                #endif

                return c;
            }
            ENDHLSL
        }
    }
}
