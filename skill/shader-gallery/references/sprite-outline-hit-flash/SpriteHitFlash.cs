// 피격 때 번쩍임 값(_HitFlash)을 1 에서 0 으로 내린다. 적이나 플레이어의 SpriteRenderer 에 붙여 쓴다.
using System.Collections;
using UnityEngine;

namespace ShaderGallery.Samples
{
    [RequireComponent(typeof(SpriteRenderer))]
    public class SpriteHitFlash : MonoBehaviour
    {
        static readonly int HitFlash = Shader.PropertyToID("_HitFlash");

        [SerializeField] float holdSeconds = 0.06f;
        [SerializeField] float fadeSeconds = 0.2f;

        Material material;

        void Awake()
        {
            // 이 스프라이트 전용 복사본을 쓴다. 그래야 다른 적까지 함께 번쩍이지 않고 SRP Batcher 도 유지된다.
            material = GetComponent<SpriteRenderer>().material;
        }

        /// <summary>피격 판정이 난 순간에 호출한다.</summary>
        public void Hit()
        {
            // 꺼진 오브젝트에서는 StartCoroutine 이 오류를 낸다.
            if (!isActiveAndEnabled)
            {
                return;
            }
            StopAllCoroutines();
            StartCoroutine(Flash());
        }

        IEnumerator Flash()
        {
            material.SetFloat(HitFlash, 1f);
            yield return new WaitForSeconds(holdSeconds);
            for (float t = 0f; t < fadeSeconds; t += Time.deltaTime)
            {
                material.SetFloat(HitFlash, 1f - t / fadeSeconds);
                yield return null;
            }
            material.SetFloat(HitFlash, 0f);
        }

        void OnDisable()
        {
            // 번쩍이던 중에 꺼져도 하얀 채로 남지 않게 되돌린다.
            StopAllCoroutines();
            if (material != null)
            {
                material.SetFloat(HitFlash, 0f);
            }
        }

        void OnDestroy()
        {
            // renderer.material 로 만든 복사본은 직접 지워야 한다.
            Destroy(material);
        }
    }
}
