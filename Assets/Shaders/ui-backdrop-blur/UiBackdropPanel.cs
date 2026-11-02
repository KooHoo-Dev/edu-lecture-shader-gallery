// UGUI Image 의 배경 블러 유리 머티리얼에 닫힘 값(_Hide)을 넘겨 패널을 열고 닫는다. Open, Close, Reopen 을 부른다.
using System.Collections;
using UnityEngine;
using UnityEngine.UI;

namespace ShaderGallery.Samples
{
    [RequireComponent(typeof(Image))]
    public class UiBackdropPanel : MonoBehaviour
    {
        static readonly int Hide = Shader.PropertyToID("_Hide");

        [Tooltip("켜면 열린 채, 끄면 닫힌 채 시작한다")]
        [SerializeField] bool startOpen = true;
        [Tooltip("다 열린 패널을 닫는 시간(초). 갤러리의 '닫았다 열기' 이벤트와 같은 0.25초")]
        [SerializeField] float closeSeconds = 0.25f;
        [Tooltip("다 닫힌 패널을 여는 시간(초). 흐림 반경이 0 에서 서서히 커진다. 갤러리 이벤트와 같은 0.8초")]
        [SerializeField] float openSeconds = 0.8f;
        [Tooltip("Reopen 에서 닫힌 채 쉬는 시간(초). 갤러리 이벤트와 같은 0.35초")]
        [SerializeField] float reopenPause = 0.35f;
        [Tooltip("일시정지(Time.timeScale = 0) 중에도 열고 닫히게 하려면 켠다. 메뉴는 대개 일시정지 중에 열린다")]
        [SerializeField] bool unscaledTime = true;
        [Tooltip("패널의 글과 버튼을 모은 자식 오브젝트의 CanvasGroup (선택). 넣으면 패널과 함께 사라지고, 반 넘게 닫히면 클릭을 받지 않는다.\n" +
                 "패널 오브젝트 자체의 CanvasGroup 을 넣지 않는다 (유리의 알파가 두 번 곱해진다)")]
        [SerializeField] CanvasGroup content;

        Image image;
        Material original;
        Material material;
        // 화면에 보이는 닫힘 값과 목표 값 (0 = 열림, 1 = 닫힘)
        float shown;
        float target;
        // Open, Close, Reopen 이 한 번이라도 값을 넣었는지. Awake 가 시작 값으로 덮어쓰지 않게 한다
        bool hasValue;
        // 다 닫혀서 이 스크립트가 Image 를 껐는지. 지워질 때 다시 켜 둔다
        bool imageHiddenByUs;
        bool warnedNoHide;

        /// <summary>열려 있거나 열리는 중이면 true. Reopen 중에는 다시 열릴 것이므로 true 다.</summary>
        public bool IsOpen => target < 0.5f;

        // 일시정지 중에도 UI 가 움직이게 하려면 실제 시간을 쓴다
        float Now => unscaledTime ? Time.unscaledTime : Time.time;

        void Awake()
        {
            if (!EnsureMaterial())
            {
                return;
            }
            // Awake 전에 Open, Close 가 이미 값을 넣었으면 (꺼진 채 시작한 메뉴) 그 값을 지킨다.
            if (!hasValue)
            {
                shown = target = startOpen ? 0f : 1f;
                hasValue = true;
                Apply(shown);
            }
        }

        // 복사본 머티리얼을 처음 쓸 때 만든다. Awake 는 오브젝트가 처음 켜질 때에야 불리므로,
        // 꺼진 오브젝트에 Awake 전에 Open, Close 를 불러도 동작하려면 Awake 에서 만들면 안 된다.
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
            if (original == null || !original.HasProperty(Hide))
            {
                // Material 칸이 비어 있으면 UI 기본 머티리얼이 들어와 _Hide 가 없다. 값을 넣어도 아무 일이 없으므로 멈춘다.
                if (!warnedNoHide)
                {
                    Debug.LogWarning($"{name}: Image 의 Material 이 _Hide 속성을 가진 머티리얼이 아니다. ShaderGallery/UiBackdropBlur 머티리얼을 넣는다.", this);
                    warnedNoHide = true;
                }
                enabled = false;
                return false;
            }
            // Image.material 은 Renderer.material 과 달리 복사본을 만들지 않고 공유 에셋을 그대로 돌려준다.
            // 그대로 고치면 같은 머티리얼을 쓰는 모든 패널이 함께 닫히므로 직접 복사본을 만들어 이 Image 에만 넣는다.
            material = new Material(original) { name = original.name + " (Instance)" };
            image.material = material;
            return true;
        }

        /// <summary>패널을 연다. 흐림 반경, 유리 색, 알파가 0 에서 서서히 커진다. 꺼져 있을 때 부르면 바로 열린 상태가 된다.</summary>
        public void Open()
        {
            MoveTo(0f, openSeconds);
        }

        /// <summary>패널을 닫는다. 다 닫히면 Image 를 꺼서 보이지 않는 패널이 흐림 비용을 쓰거나 클릭을 막지 않게 한다.</summary>
        public void Close()
        {
            MoveTo(1f, closeSeconds);
        }

        /// <summary>빨리 닫고 잠깐 쉰 뒤 천천히 연다. 갤러리의 '닫았다 열기' 이벤트와 같다 (탭 전환, 내용 바꾸기 연출).</summary>
        public void Reopen()
        {
            if (!EnsureMaterial())
            {
                return;
            }
            hasValue = true;
            target = 0f;
            StopAllCoroutines();
            // 꺼진 오브젝트에서는 StartCoroutine 이 오류를 내므로 끝 상태(열림)로 바로 둔다.
            if (!isActiveAndEnabled)
            {
                shown = 0f;
                Apply(shown);
                return;
            }
            StartCoroutine(ReopenRoutine());
        }

        void MoveTo(float to, float fullSeconds)
        {
            if (!EnsureMaterial())
            {
                return;
            }
            hasValue = true;
            target = to;
            StopAllCoroutines();
            // 반쯤 닫힌 중에 다시 열면 남은 거리만큼만 시간을 쓴다
            float seconds = Mathf.Max(fullSeconds, 0f) * Mathf.Abs(to - shown);
            if (!isActiveAndEnabled || seconds <= 0f)
            {
                shown = to;
                Apply(shown);
                return;
            }
            StartCoroutine(Move(shown, to, seconds));
        }

        IEnumerator ReopenRoutine()
        {
            yield return StartCoroutine(Move(shown, 1f, Mathf.Max(closeSeconds, 0f) * (1f - shown)));
            float pauseStart = Now;
            while (Now - pauseStart < reopenPause)
            {
                yield return null;
            }
            yield return StartCoroutine(Move(1f, 0f, Mathf.Max(openSeconds, 0f)));
        }

        IEnumerator Move(float from, float to, float seconds)
        {
            float start = Now;
            for (float t = 0f; t < 1f; t = seconds > 0f ? (Now - start) / seconds : 1f)
            {
                // inOutSine: 천천히 시작해 가운데서 빠르고 천천히 멈춘다. 갤러리 이벤트와 같은 곡선이다.
                float eased = 0.5f - 0.5f * Mathf.Cos(Mathf.PI * t);
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
            material.SetFloat(Hide, value);

            if (content != null)
            {
                content.alpha = 1f - value;
                bool usable = value < 0.5f;
                content.interactable = usable;
                content.blocksRaycasts = usable;
            }

            // 씬을 닫을 때는 Image 가 먼저 지워져 있을 수 있다.
            if (image == null)
            {
                return;
            }
            // 다 닫힌 패널은 알파가 0 이어도 픽셀마다 흐림을 계산하고 Raycast Target 이면 클릭을 막는다. Image 를 끈다.
            bool closed = value >= 0.999f;
            if (closed && image.enabled)
            {
                image.enabled = false;
                imageHiddenByUs = true;
            }
            else if (!closed && imageHiddenByUs)
            {
                image.enabled = true;
                imageHiddenByUs = false;
            }

            // Mask 안에 있으면 UGUI 가 스텐실 값을 바꾼 머티리얼 복사본(materialForRendering)으로 그린다.
            // 그 복사본은 만들어질 때 값을 한 번 베끼므로 같은 값을 함께 넣는다.
            // Image 가 꺼져 있으면 건드리지 않는다. 꺼질 때 지운 스텐실 복사본이 materialForRendering 을 부르는 순간 다시 생겨
            // 아무도 지우지 않는 머티리얼로 샌다. 다시 켜질 때 UGUI 가 위 material 에서 새로 베끼므로 값은 맞는다.
            if (!image.isActiveAndEnabled)
            {
                return;
            }
            Material rendering = image.materialForRendering;
            if (rendering != null && rendering != material)
            {
                rendering.SetFloat(Hide, value);
            }
        }

        void OnDisable()
        {
            StopAllCoroutines();
            // 움직이던 중에 꺼지면 중간 값에 멈추지 않게 목표 값으로 맞춘다.
            if (material != null)
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
            if (image != null)
            {
                // 컴포넌트만 지워져도 Image 가 지워진 머티리얼을 가리키지 않게 원래 머티리얼로 돌려놓는다.
                if (image.material == material)
                {
                    image.material = original;
                }
                // 닫혀서 끈 Image 는 다시 켜 둔다 (원래 머티리얼은 열린 모습이다).
                if (imageHiddenByUs)
                {
                    image.enabled = true;
                }
            }
            // new Material 로 만든 복사본은 직접 지워야 한다.
            Destroy(material);
        }
    }
}
