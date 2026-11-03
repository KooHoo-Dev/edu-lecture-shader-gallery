// CRT 화면 필터의 '전원 끄기' 연출을 재생한다. 화면이 세로로 눌려 가로선, 점이 되었다가 꺼지고 다시 켜진다.
// 머티리얼 에셋 하나를 고치므로 씬에 하나만 둔다. 다른 스크립트는 CrtPowerController.Instance.PowerOff() 를 부른다.
using System;
using System.Collections;
using UnityEngine;

namespace ShaderGallery.Samples
{
    public class CrtPowerController : MonoBehaviour
    {
        static readonly int PowerOffId = Shader.PropertyToID("_PowerOff");
        static readonly int RollId = Shader.PropertyToID("_Roll");

        /// <summary>씬에 하나뿐인 CRT 전원 연출 관리자.</summary>
        public static CrtPowerController Instance { get; private set; }

        // Full Screen Pass Renderer Feature 의 Pass Material 에 넣은 그 머티리얼.
        [SerializeField] Material crtMaterial;

        [Header("전원 끄기 (웹 이벤트 트랙과 같은 곡선)")]
        // 0 에서 1 로: 세로로 눌려 가로선(0.5), 가로로 줄어 점(0.8), 검정(1).
        [SerializeField] float offSeconds = 0.6f;
        // 검게 꺼진 채 기다리는 시간. 씬 전환이나 게임 오버 화면을 이 사이에 바꾼다.
        [SerializeField] float holdSeconds = 0.5f;
        // 1 에서 0 으로: 점, 가로선, 화면 순서로 다시 켜진다.
        [SerializeField] float onSeconds = 0.5f;
        // 화면 전체가 꺼졌다 켜지는 번쩍임이라 1 초에 3 번을 넘지 않게 막는다 (모든 컨트롤러 합계).
        [SerializeField] float minInterval = 0.34f;

        [Header("접근성 (옵션 메뉴에서 끌 수 있게)")]
        // 끄면 PowerOff() 를 불러도 화면은 그대로이고 onBlack 콜백만 바로 부른다.
        [SerializeField] bool powerEffectEnabled = true;
        // 끄면 느린 밝은 띠(_Roll)를 0 으로 둔다.
        [SerializeField] bool rollEnabled = true;

        // 화면 머티리얼은 하나라 마지막 재생 시각도 모든 컨트롤러가 함께 쓴다.
        // 분할 화면, 추가 씬, 씬 재로드 직후처럼 컨트롤러가 둘이 되어도 합쳐서 초당 3 회를 넘지 않는다.
        static float lastPowerTime = float.NegativeInfinity;

        float savedRoll;
        bool saved;

        /// <summary>전원 끄기 연출을 켜고 끈다. 번쩍임이 불편한 이용자를 위한 옵션이다.</summary>
        public bool PowerEffectEnabled
        {
            get => powerEffectEnabled;
            set
            {
                powerEffectEnabled = value;
                if (!value && saved)
                {
                    StopAllCoroutines();
                    crtMaterial.SetFloat(PowerOffId, 0f);
                }
            }
        }

        /// <summary>느린 밝은 띠를 켜고 끈다.</summary>
        public bool RollEnabled
        {
            get => rollEnabled;
            set
            {
                rollEnabled = value;
                ApplyRoll();
            }
        }

        /// <summary>지금 전원 끄기 연출이 재생 중인지.</summary>
        public bool IsPlaying { get; private set; }

        // 도메인 리로드를 끈 설정(Enter Play Mode Options)에서는 static 값이 이전 플레이에서 넘어온다.
        // Time.unscaledTime 은 플레이마다 0 부터 다시 세므로 시작할 때 지워 둔다.
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.SubsystemRegistration)]
        static void ResetStatics()
        {
            lastPowerTime = float.NegativeInfinity;
            Instance = null;
        }

        void Awake()
        {
            // 컨트롤러가 둘이면 서로의 중간 값을 에셋에 되써서 화면이 꺼진 채 남을 수 있다.
            // 먼저 있던 것만 남기고 뒤에 생긴 컴포넌트는 스스로 지운다.
            if (Instance != null && Instance != this)
            {
                Debug.LogWarning("CrtPowerController 는 씬에 하나만 둡니다. 중복된 컴포넌트를 지웁니다.", this);
                Destroy(this);
                return;
            }
            Instance = this;
        }

        void OnEnable()
        {
            if (Instance != this)
            {
                return;
            }
            if (crtMaterial == null)
            {
                Debug.LogError("CrtPowerController: CRT 머티리얼이 비어 있습니다.", this);
                return;
            }
            // 느린 띠는 저장값을 되돌린다. 전원 끄기는 이벤트 전용 값이라 저장하지 않고 늘 0 에서 시작한다.
            savedRoll = crtMaterial.GetFloat(RollId);
            saved = true;
            crtMaterial.SetFloat(PowerOffId, 0f);
            ApplyRoll();
        }

        /// <summary>
        /// 전원 끄기 연출을 한 번 재생한다. 완전히 검게 꺼진 순간 onBlack 을 부른다 (씬 전환 등).
        /// 0.34 초 안에 다시 부르면 무시하고 false 를 돌려준다. 연출을 끈 옵션에서는 onBlack 만 바로 부른다.
        /// </summary>
        public bool PowerOff(Action onBlack = null)
        {
            // 꺼진 오브젝트에서는 StartCoroutine 이 오류를 낸다.
            if (Instance != this || !saved || !isActiveAndEnabled)
            {
                return false;
            }
            if (!powerEffectEnabled)
            {
                onBlack?.Invoke();
                return true;
            }
            // 실제 시간으로 센다. Time.time 은 Time.timeScale 을 올리면 빨라져 초당 3 번 제한이 깨진다.
            // Inspector 에서 minInterval 을 낮춰도 0.34 초 아래로는 내려가지 않는다.
            if (Time.unscaledTime - lastPowerTime < Mathf.Max(minInterval, 0.34f))
            {
                return false;
            }
            lastPowerTime = Time.unscaledTime;
            StopAllCoroutines();
            StartCoroutine(Run(onBlack));
            return true;
        }

        IEnumerator Run(Action onBlack)
        {
            IsPlaying = true;
            // 일시정지(timeScale 0) 중에도 화면이 꺼진 채 멈춰 남지 않도록 실제 시간으로 움직인다.
            float off = Mathf.Max(offSeconds, 0.05f);
            float hold = Mathf.Max(holdSeconds, 0f);
            float on = Mathf.Max(onSeconds, 0.05f);
            for (float t = 0f; t < off; t += Time.unscaledDeltaTime)
            {
                crtMaterial.SetFloat(PowerOffId, InOutSine(t / off));
                yield return null;
            }
            crtMaterial.SetFloat(PowerOffId, 1f);
            onBlack?.Invoke();
            for (float t = 0f; t < hold; t += Time.unscaledDeltaTime)
            {
                yield return null;
            }
            for (float t = 0f; t < on; t += Time.unscaledDeltaTime)
            {
                crtMaterial.SetFloat(PowerOffId, 1f - InOutSine(t / on));
                yield return null;
            }
            crtMaterial.SetFloat(PowerOffId, 0f);
            IsPlaying = false;
        }

        // 웹 이벤트 트랙의 inOutSine 과 같다.
        static float InOutSine(float u)
        {
            u = Mathf.Clamp01(u);
            return 0.5f - 0.5f * Mathf.Cos(Mathf.PI * u);
        }

        void ApplyRoll()
        {
            if (!saved)
            {
                return;
            }
            crtMaterial.SetFloat(RollId, rollEnabled ? savedRoll : 0f);
        }

        void OnValidate()
        {
            // 플레이 중 Inspector 에서 끄기 옵션을 바꾸면 바로 보이게 한다. 편집 모드에서는 에셋을 건드리지 않는다.
            if (Application.isPlaying && saved)
            {
                ApplyRoll();
                if (!powerEffectEnabled)
                {
                    PowerEffectEnabled = false;
                }
            }
        }

        void OnDisable()
        {
            // lastPowerTime 은 지우지 않는다. 껐다 켜는 것으로 초당 3 회 제한을 피하지 못하게 한다.
            StopAllCoroutines();
            IsPlaying = false;
            if (Instance != this || !saved)
            {
                return;
            }
            // 머티리얼 에셋의 값은 플레이를 멈춰도 남는다. 꺼지던 중이어도 전원 값은 0 으로 되돌려 화면이 검게 남지 않게 한다.
            crtMaterial.SetFloat(PowerOffId, 0f);
            crtMaterial.SetFloat(RollId, savedRoll);
            saved = false;
        }

        void OnDestroy()
        {
            if (Instance == this)
            {
                Instance = null;
            }
        }
    }
}
