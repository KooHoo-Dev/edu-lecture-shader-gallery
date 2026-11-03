// 스프라이트 바람 흔들림 (URP 17, HLSL). 풀 덤불, 수초 같은 SpriteRenderer 의 Material 칸에 넣어 쓴다.
// 스프라이트는 Mesh Type Full Rect, 아틀라스에 넣지 않은 단독 텍스처, 그림 둘레에 투명 여백이 있어야 휜 잎이 잘리지 않는다.
// Universal2D 패스는 2D Renderer, UniversalForward 패스는 Universal Renderer 에서 그려진다.
Shader "ShaderGallery/SpriteWindSway"
{
    Properties
    {
        [PerRendererData] _MainTex ("스프라이트", 2D) = "white" {}
        _WindStrength ("바람 세기 (유닛)", Range(0, 0.5)) = 0.18
        _Lean ("기울기 쏠림 (유닛)", Range(-0.5, 0.5)) = 0.1
        _WindSpeed ("바람 속도", Range(0, 3)) = 1
        _Gustiness ("돌풍 변화", Range(0, 1)) = 0.6
        _PhaseSpread ("박자 어긋남 (라디안/유닛)", Range(0, 3)) = 0.8
        _Bend ("휨", Range(0, 1)) = 1
        _Push ("밀기", Range(-1, 1)) = 0
        _Tint ("색", Color) = (1, 1, 1, 1)
        _Shade ("명암", Range(0.4, 1.2)) = 1
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
            float _WindStrength;
            float _Lean;
            float _WindSpeed;
            float _Gustiness;
            float _PhaseSpread;
            float _Bend;
            float _Push;
            float4 _Tint;
            float _Shade;
        CBUFFER_END

        // core.hlsl 안에서 텍스처를 읽는 매크로. 웹에서는 texture() 로 바뀐다.
        #define SG_TEX(name, uv) SAMPLE_TEXTURE2D(name, sampler##name, uv)

        // core.hlsl 이 받는 입력. 스프라이트 무대의 공통 형식에 밀기 전 월드 위치를 더했다.
        struct SgInput
        {
            float2 uv;
            float4 color;
            float3 positionWS;
            float2 texelSize;
            float time;
        };

        #include "core.hlsl"

        struct Attributes
        {
            COMMON_2D_INPUTS            // positionOS, uv, normal(NORMAL), 인스턴스 ID 를 이미 담고 있다.
            float4 color : COLOR;
            UNITY_SKINNED_VERTEX_INPUTS
        };

        struct Varyings
        {
            float4 positionCS : SV_POSITION;
            float2 uv : TEXCOORD0;
            float3 positionWS : TEXCOORD1;
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
            // 동적 배칭은 정점을 월드로, SRP Batcher 경로는 오브젝트로 넘긴다 (UUM-15015). 어느 쪽이든 월드로 옮긴 값은 같으므로
            // 월드에서 밀고 월드에서 그린다. 픽셀 단계에는 밀기 전 월드 위치를 넘긴다 (박자와 휨 보정 비율에 쓴다).
            float3 ws = TransformObjectToWorld(v.positionOS);
            o.positionWS = ws;
            ws = sgVertex(ws, TransformObjectToWorldNormal(v.normal), v.uv, _Time.y);
            o.positionCS = TransformWorldToHClip(ws);
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
            i.positionWS = v.positionWS;
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
