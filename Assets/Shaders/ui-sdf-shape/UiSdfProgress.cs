// UGUI Image 의 SDF 도형 머티리얼에 진행 값(_Fill)을 넘긴다. 체력 바는 SetValue, 쿨타임 링은 StartCooldown 을 부른다.
using System.Collections;
using UnityEngine;
using UnityEngine.UI;

namespace ShaderGallery.Samples
{
    [RequireComponent(typeof(Image))]
    public class UiSdfProgress : MonoBehaviour
    {
        static readonly int Fill = Shader.PropertyToID("_Fill");

        [SerializeField, Range(0f, 1f)] float startValue = 1f;
        [Tooltip("SetValue 로 값이 바뀔 때 따라가는 시간(초). 0 이면 바로 바뀐다")]
        [SerializeField] float smoothSeconds = 0.15f;
        [Tooltip("일시정지(Time.timeScale = 0) 중에도 UI 가 움직이게 하려면 켠다")]
        [SerializeField] bool unscaledTime = true;

        Image image;
        Material original;
        Material material;
        float shown;
        float target;

        /// <summary>쿨타임이 도는 중이면 true.</summary>
        public bool IsCoolingDown { get; private set; }

        void Awake()
        {
            image = GetComponent<Image>();
            original = image.material;
            if (!original.HasProperty(Fill))
            {
                Debug.LogWarning($"{name}: Image 의 Material 이 _Fill 속성을 가진 머티리얼이 아니다. ShaderGallery/UiSdfShape 머티리얼을 넣는다.", this);
            }
            // Image.material 은 Renderer.material 과 달리 복사본을 만들지 않고 공유 에셋을 그대로 돌려준다.
            // 그대로 고치면 같은 머티리얼을 쓰는 모든 체력 바가 함께 바뀌므로 직접 복사본을 만들어 이 Image 에만 넣는다.
            material = new Material(original) { name = original.name + " (Instance)" };
            image.material = material;
            // 머티리얼 기본값은 썸네일용일 수 있다. 시작 값은 여기서 넣는다.
            shown = target = startValue;
            Apply(shown);
        }

        /// <summary>체력처럼 현재 값과 최대 값으로 채움 양을 정한다.</summary>
        public void SetValue(float current, float max)
        {
            target = max > 0f ? Mathf.Clamp01(current / max) : 0f;
            IsCoolingDown = false;
            StopAllCoroutines();
            // 꺼진 오브젝트에서는 StartCoroutine 이 오류를 내므로 바로 넣는다.
            if (!isActiveAndEnabled || smoothSeconds <= 0f)
            {
                shown = target;
                Apply(shown);
                return;
            }
            StartCoroutine(Animate(shown, target, smoothSeconds));
        }

        /// <summary>채움 양을 0 에서 1 까지 seconds 초 동안 올린다. 스킬을 쓴 순간에 부른다.</summary>
        public void StartCooldown(float seconds)
        {
            if (!isActiveAndEnabled)
            {
                return;
            }
            target = 1f;
            StopAllCoroutines();
            StartCoroutine(Cooldown(Mathf.Max(seconds, 0.01f)));
        }

        IEnumerator Cooldown(float seconds)
        {
            IsCoolingDown = true;
            yield return Animate(0f, 1f, seconds);
            IsCoolingDown = false;
        }

        IEnumerator Animate(float from, float to, float seconds)
        {
            for (float t = 0f; t < seconds; t += unscaledTime ? Time.unscaledDeltaTime : Time.deltaTime)
            {
                shown = Mathf.Lerp(from, to, t / seconds);
                Apply(shown);
                yield return null;
            }
            shown = to;
            Apply(shown);
        }

        void Apply(float value)
        {
            material.SetFloat(Fill, value);
            // 씬을 닫을 때는 Image 가 먼저 지워져 있을 수 있다.
            if (image == null)
            {
                return;
            }
            // Mask 안에 있으면 UGUI 가 스텐실 값을 바꾼 머티리얼 복사본(materialForRendering)으로 그린다.
            // 그 복사본은 만들어질 때 값을 한 번 베끼므로 같은 값을 함께 넣는다.
            Material rendering = image.materialForRendering;
            if (rendering != null && rendering != material)
            {
                rendering.SetFloat(Fill, value);
            }
        }

        void OnDisable()
        {
            // 움직이던 중에 꺼져도 중간 값에 멈추지 않게 목표 값으로 맞추고 상태를 되돌린다.
            StopAllCoroutines();
            IsCoolingDown = false;
            if (material != null)
            {
                shown = target;
                Apply(shown);
            }
        }

        void OnDestroy()
        {
            // 컴포넌트만 지워져도 Image 가 지워진 머티리얼을 가리키지 않게 원래 머티리얼로 돌려놓는다.
            if (image != null && image.material == material)
            {
                image.material = original;
            }
            // new Material 로 만든 복사본은 직접 지워야 한다.
            Destroy(material);
        }
    }
}
