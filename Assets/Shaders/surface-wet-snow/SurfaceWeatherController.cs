// 날씨 연출: 젖음·눈 머티리얼의 값 두 개를 움직인다.
// - SetCoverage(목표, 초): 평소 덮는 양(_Coverage)을 날씨에 맞춰 천천히 옮긴다. 비가 오기 시작하면 올리고, 그치면 내린다.
// - Storm(): 소나기·눈발 값(_Storm)을 0 에서 올렸다가 0 으로 내린다. 지나가는 소나기, 잠깐 몰아치는 눈발에 연결한다.
// 둘은 따로 움직인다. 셰이더가 _Storm 의 0.4 배를 _Coverage 에 더하므로, 덮는 양을 어디로 옮기는 중이든 이벤트 동안은 그보다 더 덮인다.
using System.Collections;
using UnityEngine;

namespace ShaderGallery.Samples
{
    public class SurfaceWeatherController : MonoBehaviour
    {
        static readonly int StormId = Shader.PropertyToID("_Storm");
        static readonly int CoverageId = Shader.PropertyToID("_Coverage");

        [Tooltip("비워 두면 이 물체 Renderer 의 머티리얼 복사본(renderer.material)만 바꾼다. " +
                 "머티리얼 에셋을 넣으면 그 에셋을 쓰는 모든 물체가 함께 바뀌고, 꺼질 때 원래 값으로 되돌린다")]
        [SerializeField] Material sharedMaterial;
        [Tooltip("가장 셀 때의 _Storm 값 (0~1). 1 이면 덮는 양에 0.4 를 더한 만큼 덮인다")]
        [Range(0f, 1f)]
        [SerializeField] float peak = 1f;
        [SerializeField] float riseSeconds = 0.8f;
        [SerializeField] float holdSeconds = 1.6f;
        [SerializeField] float fallSeconds = 1.6f;
        [Tooltip("0 보다 크면 이 간격(초)마다 저절로 날씨가 몰아친다")]
        [SerializeField] float autoInterval = 0f;

        Material material;
        bool ownsCopy;
        float originalStorm;
        float originalCoverage;
        float nextAuto;
        // Storm 과 SetCoverage 는 서로의 코루틴을 멈추지 않도록 따로 들고 있는다.
        Coroutine stormRoutine;
        Coroutine coverageRoutine;

        void Awake()
        {
            if (sharedMaterial != null)
            {
                // 여러 물체를 함께 바꾸는 경우. 에셋을 직접 고치므로, 에디터 Play 중 바꾼 값은 에셋 파일에 남는다.
                // 그래서 시작 값을 기억했다가 OnDisable 에서 되돌린다.
                material = sharedMaterial;
                originalStorm = material.GetFloat(StormId);
                originalCoverage = material.GetFloat(CoverageId);
            }
            else
            {
                // 물체 하나만 바꾸는 경우. 공유 머티리얼을 건드리지 않도록 이 물체 전용 복사본을 쓴다.
                // MaterialPropertyBlock 은 SRP Batcher 에서 빠지므로 쓰지 않는다.
                var targetRenderer = GetComponent<Renderer>();
                if (targetRenderer == null)
                {
                    Debug.LogWarning($"{name}: Renderer 가 없고 머티리얼 에셋도 지정되지 않아 날씨를 바꿀 수 없다.", this);
                    enabled = false;
                    return;
                }
                material = targetRenderer.material;
                ownsCopy = true;
            }
            // 머티리얼에 시험 삼아 올려 둔 값이 남지 않게 맑은 날씨로 시작한다.
            material.SetFloat(StormId, 0f);
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
                Storm();
            }
        }

        /// <summary>소나기나 눈발을 한 번 몰아친다. 인자가 없어 UnityEvent(트리거, 타임라인 신호, 버튼)에 바로 연결할 수 있다.</summary>
        public void Storm()
        {
            // 꺼진 오브젝트에서는 StartCoroutine 이 오류를 낸다.
            if (!isActiveAndEnabled || material == null)
            {
                return;
            }
            if (stormRoutine != null)
            {
                StopCoroutine(stormRoutine);
            }
            stormRoutine = StartCoroutine(Blow());
        }

        /// <summary>
        /// 평소 덮는 양(_Coverage, 0~1)을 seconds 초 동안 target 으로 천천히 옮긴다. 0 초면 바로 바꾼다.
        /// 날씨 시스템의 강수량에 맞춰 부른다. 진행 중인 Storm() 의 _Storm 은 건드리지 않으며, 셰이더에서 그 위에 더해진다.
        /// </summary>
        public void SetCoverage(float target, float seconds)
        {
            if (!isActiveAndEnabled || material == null)
            {
                return;
            }
            if (coverageRoutine != null)
            {
                StopCoroutine(coverageRoutine);
                coverageRoutine = null;
            }
            target = Mathf.Clamp01(target);
            if (seconds <= 0f)
            {
                material.SetFloat(CoverageId, target);
                return;
            }
            coverageRoutine = StartCoroutine(MoveCoverage(target, seconds));
        }

        IEnumerator MoveCoverage(float target, float seconds)
        {
            // 도중에 다시 부르면 지금 값에서 이어 옮겨 값이 튀지 않는다.
            float start = material.GetFloat(CoverageId);
            for (float t = 0f; t < seconds; t += Time.deltaTime)
            {
                material.SetFloat(CoverageId, Ease(start, target, t / seconds));
                yield return null;
            }
            material.SetFloat(CoverageId, target);
            coverageRoutine = null;
        }

        IEnumerator Blow()
        {
            // 도중에 다시 부르면 지금 값에서 이어 올려 값이 튀지 않는다.
            float start = material.GetFloat(StormId);
            for (float t = 0f; t < riseSeconds; t += Time.deltaTime)
            {
                material.SetFloat(StormId, Ease(start, peak, t / riseSeconds));
                yield return null;
            }
            material.SetFloat(StormId, peak);
            yield return new WaitForSeconds(holdSeconds);
            for (float t = 0f; t < fallSeconds; t += Time.deltaTime)
            {
                material.SetFloat(StormId, Ease(peak, 0f, t / fallSeconds));
                yield return null;
            }
            material.SetFloat(StormId, 0f);
            stormRoutine = null;
        }

        // 천천히 출발해 천천히 멈춘다 (사인 가감속). 갤러리 이벤트의 inOutSine 과 같은 곡선이다.
        static float Ease(float from, float to, float t)
        {
            return Mathf.Lerp(from, to, 0.5f - 0.5f * Mathf.Cos(Mathf.PI * Mathf.Clamp01(t)));
        }

        void OnDisable()
        {
            StopAllCoroutines();
            stormRoutine = null;
            coverageRoutine = null;
            if (material == null)
            {
                return;
            }
            if (ownsCopy)
            {
                // 복사본은 소나기만 맑은 날씨로 거둔다. 덮는 양은 날씨 상태라 옮기던 자리에 그대로 둔다.
                material.SetFloat(StormId, 0f);
            }
            else
            {
                // 에셋은 두 값 모두 시작할 때의 값으로 되돌린다. 되돌리지 않으면 Play 를 멈춘 뒤에도 덮인 채 저장된다.
                material.SetFloat(StormId, originalStorm);
                material.SetFloat(CoverageId, originalCoverage);
            }
        }

        void OnDestroy()
        {
            // renderer.material 로 만든 복사본은 직접 지워야 한다. 에셋은 지우지 않는다.
            if (ownsCopy && material != null)
            {
                Destroy(material);
            }
        }
    }
}
