// 은신: 자식의 모든 Renderer 머티리얼 복사본에서 은신 값(_Cloak)을 함께 올리고 내리며, 피격 때 잠깐 드러낸다(_Reveal).
// 은신이 절반을 넘으면 그림자를 끄고, 내려오면 원래 그림자 설정으로 돌린다. 캐릭터 루트에 붙여 쓴다.
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Rendering;

namespace ShaderGallery.Samples
{
    public class CloakController : MonoBehaviour
    {
        static readonly int CloakId = Shader.PropertyToID("_Cloak");
        static readonly int RevealId = Shader.PropertyToID("_Reveal");

        [Tooltip("은신을 켜고 끄는 데 걸리는 시간(초). 0 에서 1 까지 전체를 오갈 때의 길이다")]
        [Range(0.8f, 1.2f)]
        [SerializeField] float transitionSeconds = 1f;
        [Tooltip("피격 노출이 올라가는 시간(초)")]
        [SerializeField] float revealRiseSeconds = 0.1f;
        [Tooltip("피격 노출이 다시 숨는 시간(초)")]
        [SerializeField] float revealFallSeconds = 0.3f;
        [Tooltip("피격 노출 사이의 최소 간격(초). 0.34 아래로는 내려가지 않는다 (초당 3회 이하)")]
        [SerializeField] float minRevealInterval = 0.34f;

        readonly List<Material> materials = new List<Material>();
        readonly List<Renderer> renderers = new List<Renderer>();
        readonly List<ShadowCastingMode> originalShadows = new List<ShadowCastingMode>();

        float cloak;
        bool shadowsHidden;
        Coroutine cloakRoutine;
        Coroutine revealRoutine;
        // Time.unscaledTime 기준. Time.time 으로 세면 Time.timeScale 을 올렸을 때 실제로는 초당 3 번을 넘는다.
        float lastRevealTime = float.NegativeInfinity;

        /// <summary>지금 은신 쪽으로 가고 있거나 은신한 상태인지.</summary>
        public bool IsCloaked { get; private set; }

        void Awake()
        {
            // SkinnedMeshRenderer 를 포함해 자식의 모든 Renderer 를 모은다. 꺼진 자식(무기 등)도 나중에 켜질 수 있어 함께 모은다.
            foreach (Renderer r in GetComponentsInChildren<Renderer>(true))
            {
                // materials 는 이 Renderer 전용 복사본 배열을 만든다. 공유 머티리얼을 고치면 같은 머티리얼의 다른 캐릭터도 사라진다.
                Material[] copies = r.materials;
                bool uses = false;
                foreach (Material m in copies)
                {
                    materials.Add(m);
                    if (m.HasProperty(CloakId))
                    {
                        uses = true;
                        // 머티리얼 기본값은 미리보기용이라 반쯤 은신해 있다. 보이는 모습으로 시작한다.
                        m.SetFloat(CloakId, 0f);
                        m.SetFloat(RevealId, 0f);
                    }
                }
                if (uses)
                {
                    renderers.Add(r);
                    originalShadows.Add(r.shadowCastingMode);
                }
            }
        }

        void OnEnable()
        {
            // 은신한 채 꺼졌다 켜졌으면 그림자도 은신 상태에 맞춘다.
            ApplyShadows(cloak > 0.5f);
        }

        /// <summary>은신을 켜거나 끈다. 인자가 bool 이라 Toggle 같은 UnityEvent(Dynamic bool)에 바로 연결할 수 있다.</summary>
        public void SetCloaked(bool cloaked)
        {
            // 꺼진 오브젝트에서는 StartCoroutine 이 오류를 낸다.
            if (!isActiveAndEnabled)
            {
                return;
            }
            IsCloaked = cloaked;
            if (cloakRoutine != null)
            {
                StopCoroutine(cloakRoutine);
            }
            cloakRoutine = StartCoroutine(Fade(cloaked ? 1f : 0f));
        }

        IEnumerator Fade(float target)
        {
            // 도중에 방향을 바꾸면 지금 값에서 이어 가고, 남은 거리만큼만 시간을 쓴다.
            float duration = Mathf.Clamp(transitionSeconds, 0.8f, 1.2f);
            while (!Mathf.Approximately(cloak, target))
            {
                cloak = Mathf.MoveTowards(cloak, target, Time.deltaTime / duration);
                SetAll(CloakId, cloak);
                ApplyShadows(cloak > 0.5f);
                yield return null;
            }
            cloakRoutine = null;
        }

        /// <summary>
        /// 피격 판정이 난 순간에 호출한다. 셰이더가 _Reveal 의 0.6 배를 은신에서 빼서 숨은 몸이 반쯤 비쳤다가 다시 숨는다.
        /// 인자가 없어 UnityEvent 에 바로 연결할 수 있다. 숨은 몸 전체가 밝아지므로 실제 시간으로 초당 3 번을 넘지 않는다.
        /// </summary>
        public void RevealOnHit()
        {
            if (!isActiveAndEnabled)
            {
                return;
            }
            // Inspector 에서 간격을 낮춰도 0.34 초 아래로는 내려가지 않는다.
            if (Time.unscaledTime - lastRevealTime < Mathf.Max(minRevealInterval, 0.34f))
            {
                return;
            }
            lastRevealTime = Time.unscaledTime;
            if (revealRoutine != null)
            {
                StopCoroutine(revealRoutine);
            }
            revealRoutine = StartCoroutine(Reveal());
        }

        IEnumerator Reveal()
        {
            for (float t = 0f; t < revealRiseSeconds; t += Time.deltaTime)
            {
                SetAll(RevealId, t / revealRiseSeconds);
                yield return null;
            }
            for (float t = 0f; t < revealFallSeconds; t += Time.deltaTime)
            {
                SetAll(RevealId, 1f - t / revealFallSeconds);
                yield return null;
            }
            SetAll(RevealId, 0f);
            revealRoutine = null;
        }

        void SetAll(int id, float value)
        {
            foreach (Material m in materials)
            {
                if (m != null && m.HasProperty(id))
                {
                    m.SetFloat(id, value);
                }
            }
        }

        // 은신이 절반을 넘으면 그림자를 끈다. 몸은 사라졌는데 바닥에 그림자만 걸어 다니지 않게 한다.
        void ApplyShadows(bool hide)
        {
            if (hide == shadowsHidden)
            {
                return;
            }
            shadowsHidden = hide;
            for (int k = 0; k < renderers.Count; k++)
            {
                if (renderers[k] != null)
                {
                    renderers[k].shadowCastingMode = hide ? ShadowCastingMode.Off : originalShadows[k];
                }
            }
        }

        void OnDisable()
        {
            // 전환 도중에 꺼져도 코루틴이 남지 않게 멈추고, 노출 값은 0 으로, 그림자는 원래 설정으로 되돌린다.
            // 은신 값(cloak)은 그대로 두어 다시 켜면 이어 간다. lastRevealTime 은 지우지 않는다 (껐다 켜서 제한을 피하지 못하게).
            StopAllCoroutines();
            cloakRoutine = null;
            revealRoutine = null;
            SetAll(RevealId, 0f);
            ApplyShadows(false);
        }

        void OnDestroy()
        {
            // renderer.materials 로 만든 복사본은 직접 지워야 한다.
            foreach (Material m in materials)
            {
                if (m != null)
                {
                    Destroy(m);
                }
            }
            materials.Clear();
        }
    }
}
