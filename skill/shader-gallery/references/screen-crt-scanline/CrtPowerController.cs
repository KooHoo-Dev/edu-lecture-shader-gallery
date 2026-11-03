// CRT 화면 필터의 '전원 끄기' 연출을 재생한다. 화면이 세로로 눌려 가로선, 점이 되었다가 꺼지고 다시 켜진다.
// 머티리얼 에셋 하나를 고치므로 하나만 두고, 꺼진 사이에 씬을 바꿔도 연출이 끝까지 이어지게 씬 전환에도 살아 남는다.
// 다른 스크립트는 CrtPowerController.Instance.PowerOff() 를 부른다.
using System;
using System.Collections;
using UnityEngine;

namespace ShaderGallery.Samples
{
    public class CrtPowerController : MonoBehaviour
    {
        static readonly int PowerOffId = Shader.PropertyToID("_PowerOff");
        static readonly int RollId = Shader.PropertyToID("_Roll");

        /// <summary>씬이 바뀌어도 살아 있는 하나뿐인 CRT 전원 연출 관리자.</summary>
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
        // 재생 중에 끄면 연출을 멈춰 화면을 되돌리고, 아직 부르지 않은 onBlack 을 그 자리에서 부른다.
        [SerializeField] bool powerEffectEnabled = true;
        // 끄면 느린 밝은 띠(_Roll)를 0 으로 둔다.
        [SerializeField] bool rollEnabled = true;

        // 화면 머티리얼은 하나라 마지막 재생 시각도 모든 컨트롤러가 함께 쓴다.
        // 분할 화면, 추가 씬, 씬 재로드 직후처럼 컨트롤러가 둘이 되어도 합쳐서 초당 3 회를 넘지 않는다.
        static float lastPowerTime = float.NegativeInfinity;

        float savedRoll;
        bool saved;
        // 재생 중인 연출이 검게 꺼질 때 부를 콜백. 부르고 나면 비운다.
        Action pendingBlack;

        /// <summary>
        /// 전원 끄기 연출을 켜고 끈다. 번쩍임이 불편한 이용자를 위한 옵션이다.
        /// 재생 중에 끄면 연출을 멈추고 화면을 원래대로 되돌린 뒤, 아직 부르지 않은 onBlack 을 바로 부른다
        /// (연출을 끈 상태에서 PowerOff() 를 부른 것과 같게, 씬 전환이 빠지지 않게 한다).
        /// </summary>
        public bool PowerEffectEnabled
        {
            get => powerEffectEnabled;
            set
            {
                powerEffectEnabled = value;
                if (!value && IsPlaying)
                {
                    StopAllCoroutines();
                    IsPlaying = false;
                    crtMaterial.SetFloat(PowerOffId, 0f);
                    InvokePendingBlack();
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
            // 이 오브젝트가 있던 씬으로 돌아오거나 씬을 다시 불러오면 복사본이 또 생긴다. 먼저 있던 것만 남긴다.
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            // onBlack 에서 SceneManager.LoadScene 을 불러도 이 오브젝트가 사라지지 않게 한다.
            // 사라지면 OnDisable 이 전원 값을 0 으로 되돌려 검은 화면에서 원래 화면이 한 프레임에 튀어나온다.
            // DontDestroyOnLoad 는 루트 오브젝트에만 듣는다.
            if (transform.parent != null)
            {
                Debug.LogWarning("CrtPowerController 는 루트 오브젝트에 둡니다. 씬 전환에 살아 남도록 부모에서 떼어 냅니다.", this);
                transform.SetParent(null, true);
            }
            DontDestroyOnLoad(gameObject);
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
        /// 재생 중(IsPlaying)이거나 앞 재생을 시작한 지 0.34 초가 안 되었으면 무시하고 false 를 돌려준다.
        /// 연출을 끈 옵션에서는 onBlack 만 바로 부른다.
        /// 컴포넌트가 꺼지면(OnDisable) 연출이 끊기고 아직 부르지 않은 onBlack 은 부르지 않는다.
        /// </summary>
        public bool PowerOff(Action onBlack = null)
        {
            // 꺼진 오브젝트에서는 StartCoroutine 이 오류를 낸다.
            if (Instance != this || !saved || !isActiveAndEnabled)
            {
                return false;
            }
            // 재생 중에 처음부터 다시 시작하면 눌린 화면이나 검은 화면이 한 프레임에 원래 화면으로 튀고,
            // 앞 호출의 onBlack 이 불리지 않는다. 끝날 때까지 새 호출을 받지 않는다.
            if (IsPlaying)
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
            IsPlaying = true;
            pendingBlack = onBlack;
            StartCoroutine(Run());
            return true;
        }

        IEnumerator Run()
        {
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
            // 여기서 SceneManager.LoadScene 을 불러도 이 오브젝트는 DontDestroyOnLoad 라 남아 다시 켜기까지 이어진다.
            InvokePendingBlack();
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

        // 기다리던 onBlack 을 한 번만 부른다. 콜백이 예외를 던져도 연출이 검은 화면에서 멈추지 않게 로그만 남긴다.
        void InvokePendingBlack()
        {
            Action callback = pendingBlack;
            pendingBlack = null;
            if (callback == null)
            {
                return;
            }
            try
            {
                callback();
            }
            catch (Exception e)
            {
                Debug.LogException(e, this);
            }
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
            // 끊긴 연출의 onBlack 은 부르지 않고 버린다. 앱 종료나 오브젝트 삭제 중에 씬 전환 같은 콜백이 돌지 않게 한다.
            StopAllCoroutines();
            IsPlaying = false;
            pendingBlack = null;
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
