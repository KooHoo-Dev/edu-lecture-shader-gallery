// 카메라가 움직인 거리를 배경 텍스처의 UV 오프셋(_ScrollOffset)으로 넘기고 층 계수(_LayerFactor)를 넣는다. 배경 층마다 SpriteRenderer 하나에 붙인다.
using UnityEngine;

namespace ShaderGallery.Samples
{
    // 카메라를 옮기는 스크립트(보통 LateUpdate)보다 뒤에 돌아야 한 프레임 늦은 떨림이 없다.
    [DefaultExecutionOrder(100)]
    [RequireComponent(typeof(SpriteRenderer))]
    public class TextureParallaxScroller : MonoBehaviour
    {
        static readonly int ScrollOffset = Shader.PropertyToID("_ScrollOffset");
        static readonly int LayerFactor = Shader.PropertyToID("_LayerFactor");
        static readonly int Tiling = Shader.PropertyToID("_Tiling");

        [Tooltip("비우면 Camera.main 을 쓴다.")]
        [SerializeField] Transform cameraTransform;

        [Tooltip("0 이면 하늘처럼 멈춰 있고 1 이면 땅처럼 카메라와 같이 지나간다. 먼 층일수록 작게.")]
        [SerializeField, Range(0f, 2f)] float layerFactor = 0.5f;

        [Tooltip("켜면 스프라이트가 카메라를 가로로 따라가 화면을 계속 덮는다. 움직임은 텍스처 오프셋이 만든다. 끄려면 스프라이트를 카메라의 자식으로 둔다. 월드에 서 있는 스프라이트에 오프셋까지 주면 두 배로 움직인다.")]
        [SerializeField] bool followCameraX = true;

        [Tooltip("픽셀 아트용. 최종 오프셋을 텍셀 단위로 끊어 반 픽셀 번짐과 떨림을 막는다. 자동 흐름 속도가 0 일 때만 정확하다.")]
        [SerializeField] bool snapToTexel;

        SpriteRenderer spriteRenderer;
        Material material;
        float startCameraX;
        float startSelfX;

        void Awake()
        {
            spriteRenderer = GetComponent<SpriteRenderer>();
            // 층마다 계수가 다르므로 이 스프라이트 전용 복사본을 쓴다. SRP Batcher 도 유지된다.
            material = spriteRenderer.material;
            material.SetFloat(LayerFactor, layerFactor);
            if (cameraTransform == null && Camera.main != null)
            {
                cameraTransform = Camera.main.transform;
            }
        }

        void Start()
        {
            // 시작 위치를 기준으로 잡아 처음 화면은 머티리얼에 넣은 그림 그대로 보인다.
            if (cameraTransform != null)
            {
                startCameraX = cameraTransform.position.x;
            }
            startSelfX = transform.position.x;
        }

        void LateUpdate()
        {
            if (cameraTransform == null)
            {
                return;
            }

            float cameraX = cameraTransform.position.x;
            if (followCameraX)
            {
                Vector3 p = transform.position;
                p.x = startSelfX + (cameraX - startCameraX);
                transform.position = p;
            }

            // 텍스처 한 장이 월드에서 차지하는 폭. 오프셋 단위(장)로 바꾸는 데 쓴다.
            float tiling = Mathf.Max(0.0001f, material.GetFloat(Tiling));
            float tileWidth = spriteRenderer.bounds.size.x / tiling;
            if (tileWidth <= 0f)
            {
                return;
            }

            // 카메라가 간 거리(장). 셰이더가 층 계수를 곱한다.
            float offset = (cameraX - startCameraX) / tileWidth;
            if (snapToTexel && layerFactor > 0f && spriteRenderer.sprite != null)
            {
                float texels = spriteRenderer.sprite.texture.width;
                offset = Mathf.Round(offset * layerFactor * texels) / texels / layerFactor;
            }
            material.SetFloat(ScrollOffset, offset);
        }

        void OnDestroy()
        {
            // renderer.material 로 만든 복사본은 직접 지워야 한다.
            Destroy(material);
        }
    }
}
