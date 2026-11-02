// 체력 비율로 화면 비네트의 세기를 정하고, 피격 때 가장자리 펄스를 한 번 재생한다. 플레이어나 HUD 관리 오브젝트에 붙인다.
using System.Collections;
using UnityEngine;

namespace ShaderGallery.Samples
{
    public class ScreenVignetteController : MonoBehaviour
    {
        static readonly int Intensity = Shader.PropertyToID("_Intensity");
        static readonly int LowHealth = Shader.PropertyToID("_LowHealth");
        static readonly int HitPulse = Shader.PropertyToID("_HitPulse");

        // Full Screen Pass Renderer Feature 의 Pass Material 에 넣은 그 머티리얼.
        [SerializeField] Material vignetteMaterial;

        [Header("체력 연동")]
        [SerializeField, Range(0f, 1f)] float fullHealthIntensity = 0.25f;
        [SerializeField, Range(0f, 1f)] float zeroHealthIntensity = 0.85f;
        // 체력 비율이 이 값 아래로 내려가면 저체력 색과 느린 맥동이 섞이기 시작한다.
        [SerializeField, Range(0.05f, 1f)] float lowHealthThreshold = 0.3f;

        [Header("피격 펄스")]
        [SerializeField] float hitSeconds = 0.5f;
        // 화면 가장자리가 한순간 바뀌므로 1 초에 3 번을 넘지 않게 막는다 (모든 컨트롤러 합계).
        [SerializeField] float minInterval = 0.34f;

        [Header("접근성 (옵션 메뉴에서 끌 수 있게)")]
        [SerializeField] bool vignetteEnabled = true;
        [SerializeField] bool hitPulseEnabled = true;

        // 화면 머티리얼은 하나라 마지막 펄스 시각도 모든 컨트롤러가 함께 쓴다.
        // 분할 화면, 추가 씬, 씬 재로드 직후처럼 컨트롤러가 둘이 되어도 합쳐서 초당 3 회를 넘지 않는다.
        static float lastPulseTime = float.NegativeInfinity;

        float health = 1f;
        bool saved;
        float originalIntensity;
        float originalLowHealth;
        float originalHitPulse;

        /// <summary>비네트 전체를 켜고 끈다. 끄면 체력 연동과 피격 펄스가 모두 멈춘다.</summary>
        public bool VignetteEnabled
        {
            get => vignetteEnabled;
            set
            {
                vignetteEnabled = value;
                Apply();
            }
        }

        /// <summary>피격 펄스만 켜고 끈다. 번쩍임이 불편한 이용자를 위한 옵션이다.</summary>
        public bool HitPulseEnabled
        {
            get => hitPulseEnabled;
            set
            {
                hitPulseEnabled = value;
                Apply();
            }
        }

        // 도메인 리로드를 끈 설정(Enter Play Mode Options)에서는 static 값이 이전 플레이에서 넘어온다.
        // Time.unscaledTime 은 플레이마다 0 부터 다시 세므로 시작할 때 지워 둔다.
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.SubsystemRegistration)]
        static void ResetLimiter()
        {
            lastPulseTime = float.NegativeInfinity;
        }

        void OnEnable()
        {
            if (vignetteMaterial == null)
            {
                Debug.LogError("ScreenVignetteController: 비네트 머티리얼이 비어 있습니다.", this);
                enabled = false;
                return;
            }
            // 머티리얼 에셋을 직접 고치므로 처음 값을 기억해 두고 OnDisable 에서 되돌린다.
            originalIntensity = vignetteMaterial.GetFloat(Intensity);
            originalLowHealth = vignetteMaterial.GetFloat(LowHealth);
            originalHitPulse = vignetteMaterial.GetFloat(HitPulse);
            saved = true;
            // 머티리얼 기본값은 썸네일용이다. 시작할 때 체력에 맞는 값으로 바꾼다.
            Apply();
        }

        /// <summary>체력 비율(0~1)을 넘긴다. 체력이 바뀔 때마다 부른다.</summary>
        public void SetHealth(float ratio)
        {
            health = Mathf.Clamp01(ratio);
            Apply();
        }

        /// <summary>피격 판정이 난 순간에 부른다. 초당 3 회를 넘는 호출은 무시한다.</summary>
        public void Hit()
        {
            // 꺼진 오브젝트에서는 StartCoroutine 이 오류를 낸다.
            if (!isActiveAndEnabled || !vignetteEnabled || !hitPulseEnabled)
            {
                return;
            }
            // 실제 시간으로 센다. Time.time 은 Time.timeScale 을 올리면 빨라져 초당 3 번 제한이 깨진다.
            // Inspector 에서 minInterval 을 낮춰도 0.34 초 아래로는 내려가지 않는다.
            if (Time.unscaledTime - lastPulseTime < Mathf.Max(minInterval, 0.34f))
            {
                return;
            }
            lastPulseTime = Time.unscaledTime;
            StopAllCoroutines();
            StartCoroutine(AnimateHit());
        }

        IEnumerator AnimateHit()
        {
            // 일시정지(timeScale 0) 중에 맞아도 붉은 화면이 멈춰 남지 않도록 실제 시간으로 내린다.
            float seconds = Mathf.Max(hitSeconds, 0.05f);
            for (float t = 0f; t < seconds; t += Time.unscaledDeltaTime)
            {
                // 웹 이벤트의 outQuad 와 같다: 처음에 빨리 빠지고 끝에서 느려진다.
                float k = 1f - t / seconds;
                vignetteMaterial.SetFloat(HitPulse, k * k);
                yield return null;
            }
            vignetteMaterial.SetFloat(HitPulse, 0f);
        }

        void Apply()
        {
            if (!saved)
            {
                return;
            }
            if (!vignetteEnabled)
            {
                StopAllCoroutines();
                vignetteMaterial.SetFloat(Intensity, 0f);
                vignetteMaterial.SetFloat(LowHealth, 0f);
                vignetteMaterial.SetFloat(HitPulse, 0f);
                return;
            }
            if (!hitPulseEnabled)
            {
                StopAllCoroutines();
                vignetteMaterial.SetFloat(HitPulse, 0f);
            }
            vignetteMaterial.SetFloat(Intensity, Mathf.Lerp(zeroHealthIntensity, fullHealthIntensity, health));
            vignetteMaterial.SetFloat(LowHealth, Mathf.Clamp01(1f - health / lowHealthThreshold));
        }

        void OnValidate()
        {
            // 플레이 중 Inspector 에서 끄기 옵션을 바꾸면 바로 보이게 한다. 편집 모드에서는 에셋을 건드리지 않는다.
            if (Application.isPlaying && saved)
            {
                Apply();
            }
        }

        void OnDisable()
        {
            // lastPulseTime 은 지우지 않는다. 껐다 켜는 것으로 초당 3 회 제한을 피하지 못하게 한다.
            // 여기서 되돌리는 값이 씬 전환 중 한 프레임 보일 수 있으므로 머티리얼 에셋의 세기는 평소 값으로 낮춰 둔다.
            StopAllCoroutines();
            if (!saved)
            {
                return;
            }
            // 머티리얼 에셋의 값은 플레이를 멈춰도 남는다. 붉은 채로 남지 않게 처음 값으로 되돌린다.
            vignetteMaterial.SetFloat(Intensity, originalIntensity);
            vignetteMaterial.SetFloat(LowHealth, originalLowHealth);
            vignetteMaterial.SetFloat(HitPulse, originalHitPulse);
            saved = false;
        }
    }
}
