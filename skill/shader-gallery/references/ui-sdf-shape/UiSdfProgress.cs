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
        [Tooltip("SetValue 로 값이 바뀔 때 따라가는 시간(초). outQuad 로 처음에 빠르게 움직인다. 0 이면 바로 바뀐다")]
        [SerializeField] float smoothSeconds = 0.15f;
        [Tooltip("일시정지(Time.timeScale = 0) 중에도 UI 가 움직이게 하려면 켠다")]
        [SerializeField] bool unscaledTime = true;

        Image image;
        Material original;
        Material material;
        // 화면에 보이는 값과 SetValue 가 정한 목표 값
        float shown;
        float target;
        // SetValue 나 StartCooldown 이 한 번이라도 값을 넣었는지. Awake 가 시작 값으로 덮어쓰지 않게 한다
        bool hasValue;
        bool warnedNoFill;
        // 쿨타임은 시작 시각과 길이로 기억한다. 꺼져 있는 동안에도 시간이 흐른 것으로 보고, 다시 켜면 그 지점부터 이어 간다
        bool cooling;
        float cooldownStart;
        float cooldownLength;

        /// <summary>쿨타임이 도는 중이면 true. 오브젝트가 꺼져 있어도 시간이 다 지나면 false 가 된다.</summary>
        public bool IsCoolingDown => cooling && Now - cooldownStart < cooldownLength;

        // 일시정지 중에도 UI 가 움직이게 하려면 실제 시간을 쓴다
        float Now => unscaledTime ? Time.unscaledTime : Time.time;

        void Awake()
        {
            if (!EnsureMaterial())
            {
                return;
            }
            // 머티리얼 기본값은 썸네일용일 수 있으므로 시작 값을 넣는다.
            // 단, Awake 전에 SetValue 나 StartCooldown 이 이미 값을 넣었으면 (꺼진 채 시작한 HUD, 비활성 슬롯 프리팹) 그 값을 지킨다.
            if (!hasValue)
            {
                shown = target = startValue;
                hasValue = true;
                Apply(shown);
            }
        }

        // 복사본 머티리얼을 처음 쓸 때 만든다. Awake 는 오브젝트가 처음 켜질 때에야 불리므로,
        // 꺼진 오브젝트에 Awake 전에 값을 넣어도 동작하려면 Awake 에서 만들면 안 된다.
        bool EnsureMaterial()
        {
            if (material != null)
            {
                return true;
            }
            if (image == null)
            {
                image = GetComponent<Image>();
            }
            original = image.material;
            if (original == null || !original.HasProperty(Fill))
            {
                // Material 칸이 비어 있으면 UI 기본 머티리얼이 들어와 _Fill 이 없다. 값을 넣어도 아무 일이 없으므로 멈춘다.
                if (!warnedNoFill)
                {
                    Debug.LogWarning($"{name}: Image 의 Material 이 _Fill 속성을 가진 머티리얼이 아니다. ShaderGallery/UiSdfShape 머티리얼을 넣는다.", this);
                    warnedNoFill = true;
                }
                enabled = false;
                return false;
            }
            // Image.material 은 Renderer.material 과 달리 복사본을 만들지 않고 공유 에셋을 그대로 돌려준다.
            // 그대로 고치면 같은 머티리얼을 쓰는 모든 체력 바가 함께 바뀌므로 직접 복사본을 만들어 이 Image 에만 넣는다.
            material = new Material(original) { name = original.name + " (Instance)" };
            image.material = material;
            return true;
        }

        /// <summary>체력처럼 현재 값과 최대 값으로 채움 양을 정한다. 꺼져 있거나 Awake 전이어도 된다.</summary>
        public void SetValue(float current, float max)
        {
            if (!EnsureMaterial())
            {
                return;
            }
            target = max > 0f ? Mathf.Clamp01(current / max) : 0f;
            hasValue = true;
            cooling = false;
            StopAllCoroutines();
            // 꺼진 오브젝트에서는 StartCoroutine 이 오류를 내므로 바로 넣는다.
            if (!isActiveAndEnabled || smoothSeconds <= 0f)
            {
                shown = target;
                Apply(shown);
                return;
            }
            StartCoroutine(Smooth(shown, target, smoothSeconds));
        }

        /// <summary>채움 양을 0 에서 1 까지 seconds 초 동안 올린다. 스킬을 쓴 순간에 부른다.
        /// 꺼져 있을 때 불러도 시작 시각을 기억해 두고, 다시 켜면 그만큼 진행된 모습부터 이어 간다.</summary>
        public void StartCooldown(float seconds)
        {
            if (!EnsureMaterial())
            {
                return;
            }
            cooling = true;
            cooldownStart = Now;
            cooldownLength = Mathf.Max(seconds, 0.01f);
            target = 1f;
            hasValue = true;
            StopAllCoroutines();
            if (isActiveAndEnabled)
            {
                StartCoroutine(Cooldown());
            }
            else
            {
                shown = 0f;
                Apply(shown);
            }
        }

        void OnEnable()
        {
            // 꺼져 있는 동안 쿨타임이 흘렀다. 아직 남았으면 지난 만큼부터 이어 가고, 끝났으면 다 찬 모습으로 둔다.
            if (cooling && material != null)
            {
                StartCoroutine(Cooldown());
            }
        }

        IEnumerator Cooldown()
        {
            // 매 프레임 시작 시각에서 지난 비율을 다시 잰다. 꺼졌다 켜져도 같은 식으로 맞는 지점이 나온다.
            // 쿨타임은 선형이다 (웹의 쿨타임 이벤트도 linear).
            while (IsCoolingDown)
            {
                shown = (Now - cooldownStart) / cooldownLength;
                Apply(shown);
                yield return null;
            }
            cooling = false;
            shown = target = 1f;
            Apply(shown);
        }

        IEnumerator Smooth(float from, float to, float seconds)
        {
            float start = Now;
            for (float t = 0f; t < 1f; t = (Now - start) / seconds)
            {
                // outQuad: 처음에 빠르게 줄고 끝에서 느려진다. 웹의 피해 이벤트와 같은 곡선이다.
                float eased = 1f - (1f - t) * (1f - t);
                shown = Mathf.LerpUnclamped(from, to, eased);
                Apply(shown);
                yield return null;
            }
            shown = to;
            Apply(shown);
        }

        void Apply(float value)
        {
            if (material == null)
            {
                return;
            }
            material.SetFloat(Fill, value);
            // Mask 안에 있으면 UGUI 가 스텐실 값을 바꾼 머티리얼 복사본(materialForRendering)으로 그린다.
            // 그 복사본은 만들어질 때 값을 한 번 베끼므로 같은 값을 함께 넣는다.
            // Image 가 꺼져 있으면 건드리지 않는다. 꺼질 때 지운 스텐실 복사본이 materialForRendering 을 부르는 순간 다시 생겨
            // 아무도 지우지 않는 머티리얼로 샌다. 다시 켜질 때 UGUI 가 위 material 에서 새로 베끼므로 값은 맞는다.
            // (씬을 닫을 때는 Image 가 먼저 지워져 있을 수 있어 null 도 본다.)
            if (image == null || !image.isActiveAndEnabled)
            {
                return;
            }
            Material rendering = image.materialForRendering;
            if (rendering != null && rendering != material)
            {
                rendering.SetFloat(Fill, value);
            }
        }

        void OnDisable()
        {
            StopAllCoroutines();
            // SetValue 로 움직이던 중에 꺼지면 중간 값에 멈추지 않게 목표 값으로 맞춘다.
            // 쿨타임은 시작 시각을 기억하고 있으므로 그대로 두고 OnEnable 에서 이어 간다.
            if (!cooling && material != null)
            {
                shown = target;
                Apply(shown);
            }
        }

        void OnDestroy()
        {
            // 한 번도 쓰지 않았으면 만든 복사본이 없다.
            if (material == null)
            {
                return;
            }
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
