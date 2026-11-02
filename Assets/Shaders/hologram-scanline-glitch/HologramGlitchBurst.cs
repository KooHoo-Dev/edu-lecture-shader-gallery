// 전송이 끊기는 순간처럼 홀로그램의 전송 끊김 값(_Dropout)을 1 로 올렸다가 0 으로 내린다. 글리치가 몰리고 잠깐 어두워진다.
using System.Collections;
using UnityEngine;

namespace ShaderGallery.Samples
{
    [RequireComponent(typeof(Renderer))]
    public class HologramGlitchBurst : MonoBehaviour
    {
        static readonly int Dropout = Shader.PropertyToID("_Dropout");

        [SerializeField] float holdSeconds = 0.12f;
        [SerializeField] float fadeSeconds = 0.68f;
        // 물체 전체가 어두워졌다 돌아오므로 실제 시간으로 1 초에 3 번을 넘지 않게 막는다. 0.34 아래로 낮추지 않는다.
        [SerializeField] float minInterval = 0.34f;

        Material material;
        // Time.unscaledTime 기준. Time.time 으로 세면 Time.timeScale 을 올렸을 때 실제로는 초당 3 번을 넘는다.
        float lastBurstTime = float.NegativeInfinity;

        void Awake()
        {
            // 이 물체 전용 복사본을 쓴다. 같은 머티리얼을 쓰는 다른 홀로그램이 함께 끊기지 않고 SRP Batcher 도 유지된다.
            material = GetComponent<Renderer>().material;
            material.SetFloat(Dropout, 0f);
        }

        /// <summary>
        /// 전송이 끊기는 순간(피격, 통신 방해, 연결 해제 등)에 호출한다. 인자가 없어 Inspector 의 UnityEvent 에 바로 연결할 수 있다.
        /// 오브젝트나 컴포넌트가 꺼져 있으면 아무 일도 하지 않는다.
        /// </summary>
        public void Burst()
        {
            // 꺼진 오브젝트에서는 StartCoroutine 이 오류를 낸다.
            if (!isActiveAndEnabled)
            {
                return;
            }
            if (Time.unscaledTime - lastBurstTime < minInterval)
            {
                return;
            }
            lastBurstTime = Time.unscaledTime;
            StopAllCoroutines();
            StartCoroutine(Animate());
        }

        IEnumerator Animate()
        {
            material.SetFloat(Dropout, 1f);
            yield return new WaitForSeconds(holdSeconds);
            for (float t = 0f; t < fadeSeconds; t += Time.deltaTime)
            {
                material.SetFloat(Dropout, 1f - t / fadeSeconds);
                yield return null;
            }
            material.SetFloat(Dropout, 0f);
        }

        void OnDisable()
        {
            // 끊기던 중에 꺼져도 글리치가 남지 않게 되돌린다.
            StopAllCoroutines();
            lastBurstTime = float.NegativeInfinity;
            if (material != null)
            {
                material.SetFloat(Dropout, 0f);
            }
        }

        void OnDestroy()
        {
            // renderer.material 로 만든 복사본은 직접 지워야 한다.
            Destroy(material);
        }
    }
}
