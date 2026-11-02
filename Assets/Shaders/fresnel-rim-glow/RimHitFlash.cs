// 피격이나 선택 순간에 림 번쩍임 값(_HitFlash)을 1 로 올렸다 0 으로 내린다. 3D 물체의 MeshRenderer 에 붙여 쓴다.
using System.Collections;
using UnityEngine;

namespace ShaderGallery.Samples
{
    [RequireComponent(typeof(Renderer))]
    public class RimHitFlash : MonoBehaviour
    {
        static readonly int HitFlash = Shader.PropertyToID("_HitFlash");

        [SerializeField] float holdSeconds = 0.08f;
        [SerializeField] float fadeSeconds = 0.32f;
        // 번쩍일 때 림이 몸 전체로 넓어지므로 1 초에 3 번을 넘지 않게 막는다.
        [SerializeField] float minInterval = 0.34f;

        Material material;
        float lastFlashTime = float.NegativeInfinity;

        void Awake()
        {
            // 이 물체 전용 복사본을 쓴다. 그래야 같은 머티리얼의 다른 물체가 함께 번쩍이지 않고 SRP Batcher 도 유지된다.
            material = GetComponent<Renderer>().material;
            material.SetFloat(HitFlash, 0f);
        }

        /// <summary>
        /// 피격 판정이 난 순간에 호출한다. 인자가 없어 Inspector 의 UnityEvent
        /// (예: XR Simple Interactable 의 Select Entered, 체력 컴포넌트의 피격 이벤트)에 바로 연결할 수 있다.
        /// </summary>
        public void Flash()
        {
            if (Time.time - lastFlashTime < minInterval)
            {
                return;
            }
            lastFlashTime = Time.time;
            StopAllCoroutines();
            StartCoroutine(Animate());
        }

        IEnumerator Animate()
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
            // 번쩍이던 중에 꺼져도 밝은 채로 남지 않게 되돌린다.
            StopAllCoroutines();
            lastFlashTime = float.NegativeInfinity;
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
