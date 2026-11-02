// 역장에 무언가 부딪힐 때 맥동 값(_HitPulse)을 1 에서 0 으로 내린다.
using System.Collections;
using UnityEngine;

namespace ShaderGallery.Samples
{
    [RequireComponent(typeof(Renderer))]
    public class ForceFieldPulse : MonoBehaviour
    {
        static readonly int HitPulse = Shader.PropertyToID("_HitPulse");

        [SerializeField] float seconds = 0.6f;
        // 넓은 면이 번쩍이므로 1 초에 3 번을 넘지 않게 막는다.
        [SerializeField] float minInterval = 0.34f;

        Material material;
        float lastPulseTime = float.NegativeInfinity;

        void Awake()
        {
            material = GetComponent<Renderer>().material;
        }

        /// <summary>충돌 판정이 난 순간에 호출한다.</summary>
        public void Pulse()
        {
            if (Time.time - lastPulseTime < minInterval)
            {
                return;
            }
            lastPulseTime = Time.time;
            StopAllCoroutines();
            StartCoroutine(Animate());
        }

        IEnumerator Animate()
        {
            for (float t = 0f; t < seconds; t += Time.deltaTime)
            {
                material.SetFloat(HitPulse, 1f - t / seconds);
                yield return null;
            }
            material.SetFloat(HitPulse, 0f);
        }

        void OnDisable()
        {
            StopAllCoroutines();
            if (material != null)
            {
                material.SetFloat(HitPulse, 0f);
            }
        }

        void OnDestroy()
        {
            Destroy(material);
        }
    }
}
