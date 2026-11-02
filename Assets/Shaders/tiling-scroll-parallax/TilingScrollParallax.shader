// 타일 스크롤 패럴랙스 (URP 17, HLSL). 배경 층마다 SpriteRenderer 하나에 이 머티리얼 복사본을 넣어 쓴다.
// 스프라이트 텍스처는 아틀라스에 넣지 않은 단독 텍스처, Wrap Mode Repeat, Mesh Type Full Rect 여야 끝없이 이어진다.
// Universal2D 패스는 2D Renderer, UniversalForward 패스는 Universal Renderer 에서 그려진다.
Shader "ShaderGallery/TilingScrollParallax"
{
    Properties
    {
        [PerRendererData] _MainTex ("배경 층 스프라이트", 2D) = "white" {}
        _ScrollSpeed ("자동 흐름 속도 (장/초)", Range(-1, 1)) = 0.15
        _LayerFactor ("층 계수", Range(0, 2)) = 1
        _ScrollOffset ("카메라 오프셋 (장)", Range(-4, 4)) = 0
        _Tiling ("가로 반복 횟수", Range(1, 4)) = 1
        _HazeColor ("공기 색", Color) = (0.62, 0.722, 0.839, 1)
        _Haze ("공기 섞기", Range(0, 1)) = 0
    }

    SubShader
    {
        Tags { "Queue" = "Transparent" "RenderType" = "Transparent" "RenderPipeline" = "UniversalPipeline" "IgnoreProjector" = "True" }

        Blend SrcAlpha OneMinusSrcAlpha, One OneMinusSrcAlpha
        Cull Off
        ZWrite Off

        HLSLINCLUDE
        #include "Packages/com.unity.render-pipelines.universal/Shaders/2D/Include/Core2D.hlsl"

        TEXTURE2D(_MainTex);
        SAMPLER(sampler_MainTex);

        // SRP Batcher 호환: 머티리얼 값은 모두 이 버퍼 안에 둔다.
        CBUFFER_START(UnityPerMaterial)
            float _ScrollSpeed;
            float _LayerFactor;
            float _ScrollOffset;
            float _Tiling;
            float4 _HazeColor;
            float _Haze;
        CBUFFER_END

        // core.hlsl 안에서 텍스처를 읽는 매크로. 웹에서는 texture() 로 바뀐다.
        #define SG_TEX(name, uv) SAMPLE_TEXTURE2D(name, sampler##name, uv)

        // core.hlsl 이 받는 입력. 스프라이트 무대의 공통 형식이다.
        struct SgInput
        {
            float2 uv;
            float4 color;
            float2 texelSize;
            float time;
        };

        #include "core.hlsl"

        struct Attributes
        {
            COMMON_2D_INPUTS
            float4 color : COLOR;
            UNITY_SKINNED_VERTEX_INPUTS
        };

        struct Varyings
        {
            float4 positionCS : SV_POSITION;
            float2 uv : TEXCOORD0;
            float4 color : COLOR;
            UNITY_VERTEX_OUTPUT_STEREO
        };

        Varyings vert(Attributes v)
        {
            Varyings o = (Varyings)0;
            UNITY_SETUP_INSTANCE_ID(v);
            UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO(o);
            UNITY_SKINNED_VERTEX_COMPUTE(v);
            SetUpSpriteInstanceProperties();
            v.positionOS = UnityFlipSprite(v.positionOS, unity_SpriteProps.xy);
            o.positionCS = TransformObjectToHClip(v.positionOS);
            o.uv = v.uv;
            o.color = v.color * unity_SpriteColor;
            return o;
        }

        float4 frag(Varyings v) : SV_Target
        {
            // SpriteRenderer 는 텍스처를 렌더러 단위로 넘겨서 _MainTex_TexelSize 를 믿을 수 없다. 실제 크기를 묻는다.
            uint width, height;
            _MainTex.GetDimensions(width, height);

            SgInput i;
            i.uv = v.uv;
            i.color = v.color;
            i.texelSize = float2(1.0 / width, 1.0 / height);
            i.time = _Time.y;
            return sgEffect(i);
        }
        ENDHLSL

        Pass
        {
            Name "Sprite2D"
            Tags { "LightMode" = "Universal2D" }

            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile_instancing
            #pragma multi_compile _ SKINNED_SPRITE
            ENDHLSL
        }

        Pass
        {
            Name "SpriteForward"
            Tags { "LightMode" = "UniversalForward" }

            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile_instancing
            #pragma multi_compile _ SKINNED_SPRITE
            ENDHLSL
        }
    }
}
