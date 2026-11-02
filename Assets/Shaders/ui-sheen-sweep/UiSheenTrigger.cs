// UGUI Image 의 광택 머티리얼에 이벤트 훑기 값(_SweepPulse)을 0 에서 1 로 올려 띠를 한 번 지나가게 한다.
// 마우스가 올라오거나 눌릴 때, 패드·키보드로 선택될 때 재생하고, 아이템을 얻은 순간처럼 코드에서 Play() 를 불러도 된다.
using System.Collections;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace ShaderGallery.Samples
{
    [RequireComponent(typeof(Image))]
    public class UiSheenTrigger : MonoBehaviour, IPointerEnterHandler, IPointerDownHandler, ISelectHandler
    {
        static readonly int SweepPulse = Shader.PropertyToID("_SweepPulse");

        // 띠 하나가 이 시간보다 자주 지나가지 않게 막는 하한(초). 마우스를 버튼 위에서 흔들어도 빛이 깜빡이듯 연달아 지나가지 않는다.
        // 머티리얼의 자동 훑기(주기 1초 이상)와 합쳐도 한 점을 지나는 빈도가 초당 3회를 넘지 않게 정했다.
        const float MinIntervalFloor = 0.5f;

        [SerializeField] bool playOnPointerEnter = true;
        [SerializeField] bool playOnPointerDown = true;
        [Tooltip("패드나 키보드로 이 버튼이 선택됐을 때도 재생한다")]
        [SerializeField] bool playOnSelect = true;
        [Tooltip("띠가 한쪽 끝에서 반대쪽 끝까지 가는 시간(초). 웹의 '훑기 한 번' 이벤트는 0.6초다")]
        [SerializeField] float sweepSeconds = 0.6f;
        [Tooltip("연달아 재생할 수 있는 최소 간격(초). 코드에서 0.5초 아래로는 내려가지 않는다")]
        [SerializeField] float minInterval = 0.5f;
        [Tooltip("일시정지(Time.timeScale = 0) 중에도 메뉴 버튼이 반짝이게 하려면 켠다")]
        [SerializeField] bool unscaledTime = true;

        Image image;
        Material original;
        Material material;
        bool warnedNoPulse;
        bool playing;
        // 마지막으로 재생을 시작한 실제 시각. OnDisable 에서 지우지 않는다 (껐다 켜서 간격 제한을 피하지 못하게).
        float lastPlay = float.NegativeInfinity;

        float Now => unscaledTime ? Time.unscaledTime : Time.time;

        public void OnPointerEnter(PointerEventData eventData)
        {
            if (playOnPointerEnter)
            {
                Play();
            }
        }

        public void OnPointerDown(PointerEventData eventData)
        {
            if (playOnPointerDown)
            {
                Play();
            }
        }

        public void OnSelect(BaseEventData eventData)
        {
            if (playOnSelect)
            {
                Play();
            }
        }

        /// <summary>띠를 한 번 지나가게 한다. 이미 지나가는 중이거나 간격 제한 안이면 무시한다.</summary>
        public void Play()
        {
            // 꺼진 오브젝트에서는 StartCoroutine 이 오류를 낸다.
            if (!isActiveAndEnabled || playing || !EnsureMaterial())
            {
                return;
            }
            // 간격은 실제 시간으로 잰다. 배속(Time.timeScale)을 올려도 더 자주 지나가지 않는다.
            float interval = Mathf.Max(minInterval, MinIntervalFloor);
            if (Time.unscaledTime - lastPlay < interval)
            {
                return;
            }
            lastPlay = Time.unscaledTime;
            StartCoroutine(Sweep());
        }

        // 복사본 머티리얼을 처음 쓸 때 만든다 (UiSdfProgress 와 같은 규칙).
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
            if (original == null || !original.HasProperty(SweepPulse))
            {
                // Material 칸이 비어 있으면 UI 기본 머티리얼이 들어와 _SweepPulse 가 없다.
                if (!warnedNoPulse)
                {
                    Debug.LogWarning($"{name}: Image 의 Material 이 _SweepPulse 속성을 가진 머티리얼이 아니다. ShaderGallery/UiSheenSweep 머티리얼을 넣는다.", this);
                    warnedNoPulse = true;
                }
                return false;
            }
            // Image.material 은 Renderer.material 과 달리 복사본을 만들지 않고 공유 에셋을 그대로 돌려준다.
            // 그대로 고치면 같은 머티리얼을 쓰는 모든 버튼이 함께 반짝이므로 직접 복사본을 만들어 이 Image 에만 넣는다.
            material = new Material(original) { name = original.name + " (Instance)" };
            image.material = material;
            return true;
        }

        IEnumerator Sweep()
        {
            playing = true;
            float seconds = Mathf.Max(sweepSeconds, 0.05f);
            float start = Now;
            for (float t = 0f; t < 1f; t = (Now - start) / seconds)
            {
                // inOutSine: 천천히 들어와 가운데에서 빠르고 끝에서 느려진다. 웹의 이벤트 트랙과 같은 곡선이다.
                Apply(0.5f - 0.5f * Mathf.Cos(Mathf.PI * t));
                yield return null;
            }
            // 1 과 0 은 둘 다 띠가 이미지 밖에 있는 위치라 0 으로 돌려놔도 튀지 않는다.
            Apply(0f);
            playing = false;
        }

        void Apply(float value)
        {
            if (material == null)
            {
                return;
            }
            material.SetFloat(SweepPulse, value);
            // Mask 안에 있으면 UGUI 가 스텐실 값을 바꾼 머티리얼 복사본(materialForRendering)으로 그린다.
            // 그 복사본은 만들어질 때 값을 한 번 베끼므로 같은 값을 함께 넣는다.
            // Image 가 꺼져 있으면 건드리지 않는다. 꺼질 때 지운 스텐실 복사본이 materialForRendering 을 부르는 순간 다시 생겨
            // 아무도 지우지 않는 머티리얼로 샌다. 다시 켜질 때 UGUI 가 위 material 에서 새로 베끼므로 값은 맞는다.
            if (image == null || !image.isActiveAndEnabled)
            {
                return;
            }
            Material rendering = image.materialForRendering;
            if (rendering != null && rendering != material)
            {
                rendering.SetFloat(SweepPulse, value);
            }
        }

        void OnDisable()
        {
            // 지나가던 중에 꺼져도 띠가 가운데 멈춘 채 남지 않게 되돌린다. lastPlay 는 그대로 둔다.
            StopAllCoroutines();
            playing = false;
            Apply(0f);
        }

        void OnDestroy()
        {
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
