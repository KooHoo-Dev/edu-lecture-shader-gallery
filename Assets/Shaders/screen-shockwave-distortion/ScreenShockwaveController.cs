// 월드 위치에서 충격파를 시작한다. 폭발 지점을 화면 좌표로 바꿔 넘기고 고리 반경과 세기를 시간에 따라 움직인다.
// 머티리얼 에셋 하나를 고치므로 씬에 하나만 둔다. 폭발 스크립트는 ScreenShockwaveController.Instance.Play(위치) 를 부른다.
using System.Collections;
using UnityEngine;

namespace ShaderGallery.Samples
{
    public class ScreenShockwaveController : MonoBehaviour
    {
        static readonly int CenterX = Shader.PropertyToID("_CenterX");
        static readonly int CenterY = Shader.PropertyToID("_CenterY");
        static readonly int Strength = Shader.PropertyToID("_Strength");
        static readonly int BlastRadius = Shader.PropertyToID("_BlastRadius");
        static readonly int BlastStrength = Shader.PropertyToID("_BlastStrength");

        /// <summary>씬에 하나뿐인 충격파 관리자. 다른 스크립트는 이쪽으로 Play 를 부른다.</summary>
        public static ScreenShockwaveController Instance { get; private set; }

        // Full Screen Pass Renderer Feature 의 Pass Material 에 넣은 그 머티리얼.
        [SerializeField] Material shockwaveMaterial;
        // 비워 두면 Camera.main 을 쓴다.
        [SerializeField] Camera targetCamera;
        [SerializeField] float duration = 1.5f;
        [SerializeField] float riseSeconds = 0.08f;
        // 화면 높이 단위. 머티리얼의 '사라지는 반경'을 넘는 구간은 감쇠로 보이지 않는다.
        [SerializeField] float maxRadius = 1.4f;
        [SerializeField, Range(0f, 0.15f)] float peakStrength = 0.15f;
        // Play 를 연타하면 넓은 고리 띠와 색수차의 빨강 띠가 빠르게 튄다. 1 초에 3 번을 넘지 않게 막는다.
        [SerializeField] float minInterval = 0.34f;

        // 마지막 Play 시각. 모든 컨트롤러가 함께 쓴다.
        // 씬 재로드 직후나 추가 씬처럼 컨트롤러가 잠깐 둘이 되어도 합쳐서 초당 3 회를 넘지 않는다.
        static float lastPlayTime = float.NegativeInfinity;

        // 폭발과 상관없는 값은 시작 전 값을 기억해 두었다가 되돌린다.
        // 폭발 전용 값(_BlastRadius, _BlastStrength)은 저장하지 않고 항상 0 으로 되돌린다.
        float savedCenterX;
        float savedCenterY;
        float savedStrength;
        bool saved;

        // 도메인 리로드를 끈 설정(Enter Play Mode Options)에서는 static 값이 이전 플레이에서 넘어온다.
        // Time.unscaledTime 은 플레이마다 0 부터 다시 세므로 시작할 때 지워 둔다.
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.SubsystemRegistration)]
        static void ResetStatics()
        {
            lastPlayTime = float.NegativeInfinity;
            Instance = null;
        }

        void Awake()
        {
            // 컨트롤러가 둘이면 서로의 중간 값(퍼지는 중의 반경, 세기)을 에셋에 되써서 고리가 멈춘 채 남는다.
            // 먼저 있던 것만 남기고 뒤에 생긴 컴포넌트는 스스로 지운다. 붙어 있던 오브젝트(폭발 프리팹 등)는 지우지 않는다.
            if (Instance != null && Instance != this)
            {
                Debug.LogWarning("ScreenShockwaveController 는 씬에 하나만 둡니다. 중복된 컴포넌트를 지웁니다.", this);
                Destroy(this);
                return;
            }
            Instance = this;
        }

        void OnEnable()
        {
            // 지워질 중복 컴포넌트는 머티리얼을 건드리지 않는다.
            if (Instance != this)
            {
                return;
            }
            if (shockwaveMaterial == null)
            {
                Debug.LogError("ScreenShockwaveController: 머티리얼이 비어 있습니다.", this);
                return;
            }
            savedCenterX = shockwaveMaterial.GetFloat(CenterX);
            savedCenterY = shockwaveMaterial.GetFloat(CenterY);
            savedStrength = shockwaveMaterial.GetFloat(Strength);
            saved = true;
            // 머티리얼의 멈춘 고리(세기)는 썸네일과 값 조절용이다. 켜져 있는 동안에는 폭발 고리만 보이게 끈다.
            // 웹의 폭발 버튼은 멈춘 고리 위에 폭발 고리를 겹쳐 보이지만 여기서는 폭발 고리만 남는다.
            shockwaveMaterial.SetFloat(Strength, 0f);
            SetIdle();
        }

        /// <summary>
        /// 월드 위치에서 충격파를 시작한다. 이미 퍼지는 중이면 그 고리를 끊고 새 위치에서 다시 시작한다.
        /// 머티리얼 하나에는 폭발 고리가 하나뿐이라 마지막 폭발이 이긴다. 0.34 초 안에 다시 부르면 무시한다.
        /// </summary>
        public void Play(Vector3 worldPosition)
        {
            // 꺼진 오브젝트에서는 StartCoroutine 이 오류를 낸다.
            if (Instance != this || !saved || !isActiveAndEnabled)
            {
                return;
            }
            // 실제 시간으로 센다. Time.time 은 Time.timeScale 을 올리면 빨라져 초당 3 번 제한이 깨진다.
            // Inspector 에서 minInterval 을 낮춰도 0.34 초 아래로는 내려가지 않는다.
            if (Time.unscaledTime - lastPlayTime < Mathf.Max(minInterval, 0.34f))
            {
                return;
            }
            lastPlayTime = Time.unscaledTime;
            StopAllCoroutines();
            StartCoroutine(Run(worldPosition));
        }

        IEnumerator Run(Vector3 worldPosition)
        {
            // 게임 시간(Time.deltaTime)을 따른다. 슬로모션이면 고리도 느리게 퍼지고 일시정지(timeScale 0)면 멈춘다.
            for (float t = 0f; t < duration; t += Time.deltaTime)
            {
                // 반경은 처음에 빠르고 점점 느려진다. 실제 충격파처럼 퍼질수록 감속한다.
                float radius = maxRadius * EaseOut(t / duration);
                // 짧게 세기를 올렸다가 퍼지는 동안 곧게 줄인다. 웹 이벤트 트랙과 같은 모양이다.
                float strength = t < riseSeconds
                    ? peakStrength * (t / riseSeconds)
                    : peakStrength * (1f - Mathf.Clamp01((t - riseSeconds) / Mathf.Max(duration - riseSeconds, 0.0001f)));
                Apply(worldPosition, radius, strength);
                yield return null;
            }
            SetIdle();
        }

        void Apply(Vector3 worldPosition, float radius, float strength)
        {
            Camera cam = targetCamera != null ? targetCamera : Camera.main;
            if (cam == null)
            {
                SetIdle();
                return;
            }
            // 매 프레임 다시 구한다. 카메라가 움직여도 고리 중심이 폭발 지점에 붙어 있다.
            Vector3 viewport = cam.WorldToViewportPoint(worldPosition);
            // 카메라 뒤(z < 0)의 폭발은 화면 좌표가 뒤집혀 엉뚱한 곳에 생긴다. 그 동안은 보이지 않게 한다.
            if (viewport.z <= 0f)
            {
                strength = 0f;
            }
            shockwaveMaterial.SetFloat(CenterX, viewport.x);
            shockwaveMaterial.SetFloat(CenterY, viewport.y);
            shockwaveMaterial.SetFloat(BlastRadius, radius);
            shockwaveMaterial.SetFloat(BlastStrength, strength);
        }

        void SetIdle()
        {
            shockwaveMaterial.SetFloat(BlastRadius, 0f);
            shockwaveMaterial.SetFloat(BlastStrength, 0f);
        }

        static float EaseOut(float u)
        {
            u = Mathf.Clamp01(u);
            return 1f - (1f - u) * (1f - u);
        }

        void OnDisable()
        {
            // lastPlayTime 은 지우지 않는다. 껐다 켜는 것으로 초당 3 회 제한을 피하지 못하게 한다.
            StopAllCoroutines();
            if (Instance != this || !saved)
            {
                return;
            }
            // 머티리얼 에셋의 값은 플레이를 멈춰도 남는다. 폭발 값은 퍼지던 중이어도 0 으로 되돌려 고리가 멈춰 남지 않게 한다.
            SetIdle();
            shockwaveMaterial.SetFloat(CenterX, savedCenterX);
            shockwaveMaterial.SetFloat(CenterY, savedCenterY);
            shockwaveMaterial.SetFloat(Strength, savedStrength);
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
