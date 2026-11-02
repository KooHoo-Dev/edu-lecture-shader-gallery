// 돌풍: 풀 머티리얼의 돌풍 값(_Gust)을 0 에서 올렸다가 0 으로 내린다. 폭발, 헬리콥터, 지나가는 탈것 같은 이벤트에 연결한다.
// 셰이더가 _Gust 를 평소 바람 세기(_WindStrength)에 더하므로, 세기를 얼마로 두었든 돌풍은 늘 바람을 키운다.
using System.Collections;
using UnityEngine;

namespace ShaderGallery.Samples
{
    [RequireComponent(typeof(Renderer))]
    public class WindGust : MonoBehaviour
    {
        static readonly int GustId = Shader.PropertyToID("_Gust");

        [Tooltip("돌풍이 가장 셀 때의 _Gust 값 (0~1). 1 이면 바람 세기에 0.4 를 더한 만큼 분다")]
        [Range(0f, 1f)]
        [SerializeField] float peak = 1f;
        [SerializeField] float riseSeconds = 0.35f;
        [SerializeField] float holdSeconds = 0.75f;
        [SerializeField] float fallSeconds = 1.2f;
        [Tooltip("0 보다 크면 이 간격(초)마다 저절로 돌풍이 분다")]
        [SerializeField] float autoInterval = 0f;

        Material material;
        float nextAuto;

        void Awake()
        {
            // 이 물체 전용 복사본을 쓴다. 공유 머티리얼을 고치면 같은 머티리얼의 풀이 모두 함께 흔들린다.
            // 여러 풀을 한꺼번에 흔들려면 셰이더의 _Gust 를 전역 값으로 바꾸고 Shader.SetGlobalFloat 를 쓴다 (해설 참고).
            material = GetComponent<Renderer>().material;
            // 머티리얼에 시험 삼아 넣어 둔 값이 남지 않게 돌풍 없이 시작한다.
            material.SetFloat(GustId, 0f);
        }

        void OnEnable()
        {
            nextAuto = Time.time + autoInterval;
        }

        void Update()
        {
            if (autoInterval > 0f && Time.time >= nextAuto)
            {
                nextAuto = Time.time + autoInterval;
                Gust();
            }
        }

        /// <summary>돌풍을 한 번 일으킨다. 인자가 없어 UnityEvent(트리거, 애니메이션 이벤트, 버튼)에 바로 연결할 수 있다.</summary>
        public void Gust()
        {
            // 꺼진 오브젝트에서는 StartCoroutine 이 오류를 낸다.
            if (!isActiveAndEnabled)
            {
                return;
            }
            StopAllCoroutines();
            StartCoroutine(Blow());
        }

        IEnumerator Blow()
        {
            // 돌풍 도중에 다시 불면 지금 값에서 이어 올려 값이 튀지 않는다.
            float start = material.GetFloat(GustId);
            for (float t = 0f; t < riseSeconds; t += Time.deltaTime)
            {
                material.SetFloat(GustId, Ease(start, peak, t / riseSeconds));
                yield return null;
            }
            material.SetFloat(GustId, peak);
            yield return new WaitForSeconds(holdSeconds);
            for (float t = 0f; t < fallSeconds; t += Time.deltaTime)
            {
                material.SetFloat(GustId, Ease(peak, 0f, t / fallSeconds));
                yield return null;
            }
            material.SetFloat(GustId, 0f);
        }

        // 천천히 출발해 천천히 멈춘다 (사인 가감속). 갤러리 이벤트의 inOutSine 과 같은 곡선이다.
        static float Ease(float from, float to, float t)
        {
            return Mathf.Lerp(from, to, 0.5f - 0.5f * Mathf.Cos(Mathf.PI * Mathf.Clamp01(t)));
        }

        void OnDisable()
        {
            // 돌풍 도중에 꺼져도 센 바람으로 남지 않게 돌풍 값을 0 으로 되돌린다.
            StopAllCoroutines();
            if (material != null)
            {
                material.SetFloat(GustId, 0f);
            }
        }

        void OnDestroy()
        {
            // renderer.material 로 만든 복사본은 직접 지워야 한다.
            Destroy(material);
        }
    }
}
