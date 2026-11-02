// 돌풍: 풀 머티리얼의 바람 세기(_WindStrength)를 잠깐 올렸다가 되돌린다. 폭발, 헬리콥터, 지나가는 탈것 같은 이벤트에 연결한다.
using System.Collections;
using UnityEngine;

namespace ShaderGallery.Samples
{
    [RequireComponent(typeof(Renderer))]
    public class WindGust : MonoBehaviour
    {
        static readonly int WindStrength = Shader.PropertyToID("_WindStrength");

        [Tooltip("돌풍이 평소 세기에 더하는 값")]
        [SerializeField] float extraStrength = 0.4f;
        [SerializeField] float riseSeconds = 0.35f;
        [SerializeField] float holdSeconds = 0.75f;
        [SerializeField] float fallSeconds = 1.2f;
        [Tooltip("0 보다 크면 이 간격(초)마다 저절로 돌풍이 분다")]
        [SerializeField] float autoInterval = 0f;

        Material material;
        float calmStrength;
        float nextAuto;

        void Awake()
        {
            // 이 물체 전용 복사본을 쓴다. 공유 머티리얼을 고치면 같은 머티리얼의 풀이 모두 함께 흔들린다.
            // 여러 풀을 한꺼번에 흔들려면 셰이더에 전역 값을 두고 Shader.SetGlobalFloat 를 쓴다 (해설 참고).
            material = GetComponent<Renderer>().material;
            // 머티리얼에 넣어 둔 세기를 평소 바람으로 삼고 돌풍이 끝나면 여기로 돌아온다.
            calmStrength = material.GetFloat(WindStrength);
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
            // 돌풍 도중에 다시 불면 지금 세기에서 이어 올려 값이 튀지 않는다.
            float start = material.GetFloat(WindStrength);
            float peak = calmStrength + extraStrength;
            for (float t = 0f; t < riseSeconds; t += Time.deltaTime)
            {
                material.SetFloat(WindStrength, Ease(start, peak, t / riseSeconds));
                yield return null;
            }
            material.SetFloat(WindStrength, peak);
            yield return new WaitForSeconds(holdSeconds);
            for (float t = 0f; t < fallSeconds; t += Time.deltaTime)
            {
                material.SetFloat(WindStrength, Ease(peak, calmStrength, t / fallSeconds));
                yield return null;
            }
            material.SetFloat(WindStrength, calmStrength);
        }

        // 천천히 출발해 천천히 멈춘다 (사인 가감속). 갤러리 이벤트의 inOutSine 과 같은 곡선이다.
        static float Ease(float from, float to, float t)
        {
            return Mathf.Lerp(from, to, 0.5f - 0.5f * Mathf.Cos(Mathf.PI * Mathf.Clamp01(t)));
        }

        void OnDisable()
        {
            // 돌풍 도중에 꺼져도 센 바람으로 남지 않게 평소 세기로 되돌린다.
            StopAllCoroutines();
            if (material != null)
            {
                material.SetFloat(WindStrength, calmStrength);
            }
        }

        void OnDestroy()
        {
            // renderer.material 로 만든 복사본은 직접 지워야 한다.
            Destroy(material);
        }
    }
}
