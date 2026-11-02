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
        static readonly int ScrollSpeed = Shader.PropertyToID("_ScrollSpeed");
        static readonly int LayerFactor = Shader.PropertyToID("_LayerFactor");
        static readonly int Tiling = Shader.PropertyToID("_Tiling");

        [Tooltip("비우면 Camera.main 을 쓴다.")]
        [SerializeField] Transform cameraTransform;

        [Tooltip("0 이면 하늘처럼 멈춰 있고 1 이면 땅처럼 카메라와 같이 지나간다. 먼 층일수록 작게.")]
        [SerializeField, Range(0f, 2f)] float layerFactor = 0.5f;

        [Tooltip("카메라가 서 있어도 흐르는 속도(장/초). 머티리얼 기본값(0.15)은 썸네일용이라 Awake 에서 이 값으로 덮어쓴다. 0 이면 카메라가 움직일 때만 흐른다. 셰이더의 _Time 을 쓰므로 Time.timeScale 이 0 이면 멈춘다.")]
        [SerializeField, Range(-1f, 1f)] float autoScrollSpeed = 0f;

        [Tooltip("켜면 스프라이트가 카메라를 가로로 따라가 화면을 계속 덮는다. 움직임은 텍스처 오프셋이 만든다. 끄려면 스프라이트를 카메라의 자식으로 둔다. 월드에 서 있는 스프라이트에 오프셋까지 주면 두 배로 움직인다.")]
        [SerializeField] bool followCameraX = true;

        [Tooltip("픽셀 아트용. 최종 오프셋을 텍셀 단위로 끊어 반 픽셀 번짐과 떨림을 막는다. Auto Scroll Speed 가 0 일 때만 정확하다.")]
        [SerializeField] bool snapToTexel;

        SpriteRenderer spriteRenderer;
        Material material;
        float startCameraX;
        float startSelfX;
        bool hasStartCamera;
        bool warnedNoCamera;

        void Awake()
        {
            spriteRenderer = GetComponent<SpriteRenderer>();
            // 층마다 계수가 다르므로 이 스프라이트 전용 복사본을 쓴다. SRP Batcher 도 유지된다.
            material = spriteRenderer.material;
            material.SetFloat(LayerFactor, layerFactor);
            // 머티리얼 기본 흐름 속도는 썸네일용이다. 넣지 않으면 카메라가 서 있어도 층마다 계속 흐른다.
            material.SetFloat(ScrollSpeed, autoScrollSpeed);
        }

        void Start()
        {
            // 시작 위치를 기준으로 잡아 처음 화면은 머티리얼에 넣은 그림 그대로 보인다.
            startSelfX = transform.position.x;
            TryBindCamera();
        }

        // 카메라를 찾고 처음 찾은 순간의 위치를 기준으로 잡는다. 없으면 한 번만 경고한다.
        bool TryBindCamera()
        {
            if (cameraTransform == null)
            {
                Camera mainCamera = Camera.main;
                if (mainCamera != null)
                {
                    cameraTransform = mainCamera.transform;
                }
            }

            if (cameraTransform == null)
            {
                if (!warnedNoCamera)
                {
                    warnedNoCamera = true;
                    Debug.LogWarning($"{name}: 따라갈 카메라가 없어 배경을 스크롤하지 않는다. 카메라에 MainCamera 태그를 달거나 Camera Transform 칸에 넣는다.", this);
                }
                return false;
            }

            if (!hasStartCamera)
            {
                hasStartCamera = true;
                startCameraX = cameraTransform.position.x;
            }
            return true;
        }

        void LateUpdate()
        {
            if (!TryBindCamera())
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
            if (layerFactor > 0f)
            {
                // 셰이더가 계수를 곱한 뒤 한 장(1) 주기라서 여기서는 1 / 계수 주기로 감싼다.
                // 카메라가 멀리 가도 넘기는 값이 작게 유지되어 float 정밀도로 떨리지 않는다.
                offset = Mathf.Repeat(offset, 1f / layerFactor);
            }
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
