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
            // 꺼진 오브젝트에서는 StartCoroutine 이 오류를 낸다.
            if (!isActiveAndEnabled)
            {
                return;
            }
            // 실제 시간으로 센다. Time.time 은 Time.timeScale 을 올리면 빨라져 초당 3 번 제한이 깨진다.
            if (Time.unscaledTime - lastPulseTime < minInterval)
            {
                return;
            }
            lastPulseTime = Time.unscaledTime;
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
            lastPulseTime = float.NegativeInfinity;
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
