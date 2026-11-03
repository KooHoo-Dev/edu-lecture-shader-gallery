// 하루 시간(0~24시)으로 인테리어 매핑 건물의 밤 정도(_Night)와 불 켜진 비율(_LightsOn)을 정한다. 건물의 MeshRenderer 에 붙여 쓴다.
// 건물마다 점등 시각 오프셋을 달리 주면 도시의 불이 한꺼번에 켜지지 않는다.
using UnityEngine;

namespace ShaderGallery.Samples
{
    [RequireComponent(typeof(Renderer))]
    public class InteriorLightsSchedule : MonoBehaviour
    {
        static readonly int Night = Shader.PropertyToID("_Night");
        static readonly int LightsOn = Shader.PropertyToID("_LightsOn");

        [Tooltip("지금 시각 (0~24). 여러 건물이 같은 시계를 쓰려면 외부에서 Hour 를 넣고 hoursPerSecond 를 0 으로 둔다.")]
        [SerializeField, Range(0f, 24f)] float hour = 18f;
        [Tooltip("실제 1초에 흐르는 게임 시간(시). 0 이면 시간이 멈춘다.")]
        [SerializeField] float hoursPerSecond = 0.2f;
        [Tooltip("이 건물만 불 켜는 시각을 앞당기거나(-) 늦춘다(+). 밤 정도(하늘)는 모든 건물이 같다.")]
        [SerializeField, Range(-3f, 3f)] float lightsOffsetHours = 0f;
        [Tooltip("0 보다 크면 시작할 때 오프셋을 ±이 값(시) 안에서 무작위로 정한다.")]
        [SerializeField, Range(0f, 3f)] float randomOffsetHours = 0f;
        [Tooltip("시각(0~24) → 밤 정도(0~1). 셰이더의 _Night 로 들어간다.")]
        [SerializeField] AnimationCurve nightCurve = new AnimationCurve(
            new Keyframe(0f, 0.85f), new Keyframe(5f, 0.85f), new Keyframe(7f, 0f),
            new Keyframe(17f, 0f), new Keyframe(19.5f, 0.85f), new Keyframe(24f, 0.85f));
        [Tooltip("시각(0~24) → 불 켜진 방의 비율(0~1). 셰이더의 _LightsOn 으로 들어간다.")]
        [SerializeField] AnimationCurve lightsCurve = new AnimationCurve(
            new Keyframe(0f, 0.35f), new Keyframe(2f, 0.12f), new Keyframe(5.5f, 0.1f), new Keyframe(7f, 0.3f),
            new Keyframe(9f, 0.15f), new Keyframe(16.5f, 0.15f), new Keyframe(20f, 0.7f), new Keyframe(22.5f, 0.6f), new Keyframe(24f, 0.35f));

        Material material;

        /// <summary>지금 시각 (0~24). 바깥의 시계가 넣어도 된다.</summary>
        public float Hour
        {
            get => hour;
            set => hour = Mathf.Repeat(value, 24f);
        }

        void Awake()
        {
            // 이 건물 전용 복사본을 쓴다. 그래야 건물마다 다른 점등 비율을 넣을 수 있고 SRP Batcher 도 유지된다.
            material = GetComponent<Renderer>().material;
            if (randomOffsetHours > 0f)
            {
                lightsOffsetHours = Random.Range(-randomOffsetHours, randomOffsetHours);
            }
            Apply();
        }

        void Update()
        {
            if (hoursPerSecond != 0f)
            {
                // 24 로 감싸 오래 켜 두어도 값이 커지지 않게 한다. Time.deltaTime 이라 일시정지와 배속을 따른다.
                hour = Mathf.Repeat(hour + Time.deltaTime * hoursPerSecond, 24f);
            }
            Apply();
        }

        void Apply()
        {
            if (material == null)
            {
                return;
            }
            material.SetFloat(Night, Mathf.Clamp01(nightCurve.Evaluate(hour)));
            // 오프셋만큼 이른(늦은) 시각의 비율을 쓴다. 방마다 고정 난수와 비교하므로 비율이 오르면 새 방만 켜진다.
            material.SetFloat(LightsOn, Mathf.Clamp01(lightsCurve.Evaluate(Mathf.Repeat(hour - lightsOffsetHours, 24f))));
        }

        void OnDestroy()
        {
            // renderer.material 로 만든 복사본은 직접 지워야 한다.
            Destroy(material);
        }
    }
}
