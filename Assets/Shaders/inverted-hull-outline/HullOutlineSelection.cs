// 선택하거나 타깃으로 잡은 물체에만 껍데기 외곽선을 켜고 끈다. 외곽선 켜기 값(_OutlineAmount)을 짧게 올리고 내리며, 꺼진 동안에는 외곽선 패스를 그리지 않는다.
using System.Collections;
using UnityEngine;

namespace ShaderGallery.Samples
{
    [RequireComponent(typeof(Renderer))]
    public class HullOutlineSelection : MonoBehaviour
    {
        static readonly int OutlineAmount = Shader.PropertyToID("_OutlineAmount");

        // 외곽선 패스의 LightMode 태그. SetShaderPassEnabled 는 패스 이름이 아니라 이 태그로 켜고 끈다.
        // 그래서 같은 셰이더에 SRPDefaultUnlit 태그의 패스가 더 있으면 그 패스도 함께 꺼진다.
        // 이 셰이더를 고쳐 그런 패스를 더하면 외곽선만 끄는 다른 방법(예: _OutlineAmount 만 0)을 쓴다.
        const string OutlinePassTag = "SRPDefaultUnlit";

        [SerializeField] bool selectedOnStart = false;
        // 외곽선이 자라거나 줄어드는 시간. 0 이면 바로 바뀐다. 번쩍이지 않게 한 번만 바뀐다.
        [SerializeField] float fadeSeconds = 0.12f;

        Material material;
        bool selected;
        float amount;

        public bool IsSelected => selected;

        void Awake()
        {
            // 이 물체 전용 복사본을 쓴다. 그래야 같은 머티리얼의 다른 물체에는 외곽선이 켜지지 않고 SRP Batcher 도 유지된다.
            // 머티리얼 에셋의 기본값(1)은 썸네일용이라, 시작 상태는 여기서 넣는다.
            // .material 은 Materials 목록의 첫 머티리얼만 잡는다. 이 스크립트는 이 셰이더가 첫 머티리얼(본체와 외곽선을 함께 그림)일 때용이다.
            // 외곽선을 두 번째 머티리얼로 덧붙이는 방식과 함께 쓰면 본체 머티리얼만 바뀌어 외곽선이 켜지지 않는다.
            // 그 방식이면 .materials 배열에서 외곽선 머티리얼의 칸을 골라 고친다.
            material = GetComponent<Renderer>().material;
            selected = selectedOnStart;
            Apply(selected ? 1f : 0f);
        }

        /// <summary>외곽선을 켠다. 인자가 없어 UnityEvent(예: XR Simple Interactable 의 Hover Entered)에 바로 연결할 수 있다.</summary>
        public void Select() => SetSelected(true);

        /// <summary>외곽선을 끈다 (예: Hover Exited).</summary>
        public void Deselect() => SetSelected(false);

        /// <summary>켜져 있으면 끄고 꺼져 있으면 켠다 (예: 클릭으로 고르기).</summary>
        public void Toggle() => SetSelected(!selected);

        public void SetSelected(bool value)
        {
            if (material == null)
            {
                // Awake 전(꺼진 오브젝트)에 불리면 시작 상태로 기억해 둔다.
                selectedOnStart = value;
                return;
            }
            selected = value;
            StopAllCoroutines();
            // 꺼진 오브젝트에서는 StartCoroutine 이 오류를 내므로 바로 바꾼다.
            if (!isActiveAndEnabled || fadeSeconds <= 0f)
            {
                Apply(value ? 1f : 0f);
                return;
            }
            StartCoroutine(Fade(value ? 1f : 0f));
        }

        IEnumerator Fade(float target)
        {
            float start = amount;
            // 일시정지 메뉴(timeScale 0)에서 고를 때도 멈추지 않게 실제 시간으로 잰다.
            for (float t = 0f; t < fadeSeconds; t += Time.unscaledDeltaTime)
            {
                Apply(Mathf.Lerp(start, target, t / fadeSeconds));
                yield return null;
            }
            Apply(target);
        }

        void Apply(float value)
        {
            amount = value;
            material.SetFloat(OutlineAmount, value);
            // 완전히 꺼진 동안에는 외곽선 패스 자체를 건너뛴다. 껍데기를 한 번 더 그리는 비용이 들지 않는다.
            material.SetShaderPassEnabled(OutlinePassTag, value > 0f);
        }

        void OnDisable()
        {
            // 자라던 중에 꺼져도 중간 두께로 남지 않게 목표 상태로 맞춘다.
            StopAllCoroutines();
            if (material != null)
            {
                Apply(selected ? 1f : 0f);
            }
        }

        void OnDestroy()
        {
            // renderer.material 로 만든 복사본은 직접 지워야 한다.
            Destroy(material);
        }
    }
}
