// 디졸브 진행값(_Threshold)을 시간에 따라 올린다. 적 사망이나 소환 연출에 붙여 쓴다.
using System.Collections;
using UnityEngine;

namespace ShaderGallery.Samples
{
    [RequireComponent(typeof(Renderer))]
    public class DissolveController : MonoBehaviour
    {
        static readonly int Threshold = Shader.PropertyToID("_Threshold");

        [SerializeField] float duration = 1.2f;
        [SerializeField] bool destroyWhenDone = true;

        Material material;
        Coroutine running;

        void Awake()
        {
            // 공유 머티리얼을 건드리지 않도록 이 물체 전용 복사본을 쓴다.
            material = GetComponent<Renderer>().material;
        }

        /// <summary>물체를 태워 없앤다.</summary>
        public void DissolveOut() => Play(0f, 1f, destroyWhenDone);

        /// <summary>없던 물체가 나타난다.</summary>
        public void DissolveIn() => Play(1f, 0f, false);

        void Play(float from, float to, bool destroyAtEnd)
        {
            if (running != null)
            {
                StopCoroutine(running);
            }
            running = StartCoroutine(Animate(from, to, destroyAtEnd));
        }

        IEnumerator Animate(float from, float to, bool destroyAtEnd)
        {
            for (float t = 0f; t < duration; t += Time.deltaTime)
            {
                material.SetFloat(Threshold, Mathf.Lerp(from, to, t / duration));
                yield return null;
            }
            material.SetFloat(Threshold, to);
            running = null;
            if (destroyAtEnd)
            {
                Destroy(gameObject);
            }
        }

        void OnDisable()
        {
            StopAllCoroutines();
            running = null;
        }

        void OnDestroy()
        {
            // renderer.material 로 만든 복사본은 직접 지워야 한다.
            Destroy(material);
        }
    }
}
