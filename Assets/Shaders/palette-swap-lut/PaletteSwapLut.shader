// 팔레트 스왑 (URP 17, HLSL). SpriteRenderer 의 Material 칸에 넣어 쓴다.
// 스프라이트는 R 에 색 번호를 담은 인덱스 이미지(sRGB 끔, Point)이고, 색은 팔레트 텍스처(sRGB 켬, Point)에서 읽는다.
// Universal2D 패스는 2D Renderer, UniversalForward 패스는 Universal Renderer 에서 그려진다.
Shader "ShaderGallery/PaletteSwapLut"
{
    Properties
    {
        [PerRendererData] _MainTex ("인덱스 스프라이트", 2D) = "white" {}
        [NoScaleOffset] _PaletteTex ("팔레트 (가로 색 번호, 세로 줄)", 2D) = "white" {}
        [IntRange] _PaletteRow ("팔레트 줄", Range(0, 7)) = 0
        [IntRange] _HitRow ("피격 줄", Range(0, 7)) = 7
        _HitFlash ("피격 (0.5 이상이면 피격 줄)", Range(0, 1)) = 0
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
        TEXTURE2D(_PaletteTex);
        SAMPLER(sampler_PaletteTex);

        // SRP Batcher 호환: 머티리얼 값은 모두 이 버퍼 안에 둔다.
        CBUFFER_START(UnityPerMaterial)
            float4 _PaletteTex_TexelSize;
            float _PaletteRow;
            float _HitRow;
            float _HitFlash;
        CBUFFER_END

        // core.hlsl 안에서 텍스처를 읽는 매크로. 웹에서는 texture() 로 바뀐다.
        // 밉맵 0 단계만 읽는다. 팔레트 좌표는 색 번호 경계에서 한 픽셀 사이에 크게 뛰어 GPU 가 작은 밉맵을 고르고,
        // 경계마다 섞인 색의 가는 선이 생긴다. 웹 미리보기(밉맵 없는 Nearest)와도 이렇게 해야 같다.
        #define SG_TEX(name, uv) SAMPLE_TEXTURE2D_LOD(name, sampler##name, uv, 0)

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
