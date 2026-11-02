// 월드 위치에서 충격파를 시작한다. 폭발 지점을 화면 좌표로 바꿔 넘기고 고리 반경과 세기를 시간에 따라 움직인다.
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

        // Full Screen Pass Renderer Feature 의 Pass Material 에 넣은 그 머티리얼.
        [SerializeField] Material shockwaveMaterial;
        // 비워 두면 Camera.main 을 쓴다.
        [SerializeField] Camera targetCamera;
        [SerializeField] float duration = 1.5f;
        [SerializeField] float riseSeconds = 0.08f;
        // 화면 높이 단위. 머티리얼의 '사라지는 반경'을 넘는 구간은 감쇠로 보이지 않는다.
        [SerializeField] float maxRadius = 1.4f;
        [SerializeField, Range(0f, 0.15f)] float peakStrength = 0.15f;

        // 머티리얼 에셋을 직접 고치므로 시작 전 값을 기억해 두었다가 되돌린다.
        float savedCenterX;
        float savedCenterY;
        float savedStrength;
        float savedBlastRadius;
        float savedBlastStrength;
        bool saved;

        void Awake()
        {
            if (shockwaveMaterial == null)
            {
                Debug.LogError("ScreenShockwaveController: 머티리얼이 비어 있습니다.", this);
                return;
            }
            savedCenterX = shockwaveMaterial.GetFloat(CenterX);
            savedCenterY = shockwaveMaterial.GetFloat(CenterY);
            savedStrength = shockwaveMaterial.GetFloat(Strength);
            savedBlastRadius = shockwaveMaterial.GetFloat(BlastRadius);
            savedBlastStrength = shockwaveMaterial.GetFloat(BlastStrength);
            saved = true;
        }

        void OnEnable()
        {
            if (!saved)
            {
                return;
            }
            // 머티리얼 기본값의 멈춘 고리는 썸네일용이다. 켜져 있는 동안에는 폭발 고리만 보이게 끈다.
            // Awake 다음에도, 껐다 다시 켤 때도 불린다.
            shockwaveMaterial.SetFloat(Strength, 0f);
            SetIdle();
        }

        /// <summary>
        /// 월드 위치에서 충격파를 시작한다. 이미 퍼지는 중이면 그 고리를 끊고 새 위치에서 다시 시작한다.
        /// 머티리얼 하나에는 폭발 고리가 하나뿐이라 마지막 폭발이 이긴다.
        /// </summary>
        public void Play(Vector3 worldPosition)
        {
            if (!saved || !isActiveAndEnabled)
            {
                return;
            }
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
            StopAllCoroutines();
            if (!saved)
            {
                return;
            }
            // 머티리얼 에셋의 값은 플레이를 멈춰도 남는다. 고리가 화면에 멈춰 남지 않게 시작 전 값으로 되돌린다.
            shockwaveMaterial.SetFloat(CenterX, savedCenterX);
            shockwaveMaterial.SetFloat(CenterY, savedCenterY);
            shockwaveMaterial.SetFloat(Strength, savedStrength);
            shockwaveMaterial.SetFloat(BlastRadius, savedBlastRadius);
            shockwaveMaterial.SetFloat(BlastStrength, savedBlastStrength);
        }
    }
}
