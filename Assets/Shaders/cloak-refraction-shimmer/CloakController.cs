// 은신: 자식 Renderer 중 이 셰이더(_Cloak)를 쓰는 것만 머티리얼 복사본을 만들어 은신 값을 함께 올리고 내리며,
// 피격 때 잠깐 드러낸다(_Reveal). 이 머티리얼은 그림자를 만들지 않는다. 캐릭터 루트에 붙여 쓴다.
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

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

        float cloak;
        Coroutine cloakRoutine;
        Coroutine revealRoutine;
        // Time.unscaledTime 기준. Time.time 으로 세면 Time.timeScale 을 올렸을 때 실제로는 초당 3 번을 넘는다.
        float lastRevealTime = float.NegativeInfinity;

        /// <summary>마지막으로 요청한 상태(은신이면 true). 전환 중에 바뀐 요청은 지금 전환이 끝난 뒤 반영된다.</summary>
        public bool IsCloaked { get; private set; }

        void Awake()
        {
            // SkinnedMeshRenderer 를 포함해 자식의 모든 Renderer 를 살핀다. 꺼진 자식(무기 등)도 나중에 켜질 수 있어 함께 살핀다.
            foreach (Renderer r in GetComponentsInChildren<Renderer>(true))
            {
                // 먼저 공유 머티리얼(sharedMaterials)로 이 셰이더를 쓰는지 본다. 무기의 Lit, 파티클, 트레일처럼
                // _Cloak 이 없는 Renderer 까지 materials 를 부르면 쓸데없는 복사본이 생기고,
                // 그 뒤로는 공유 머티리얼(에셋)을 고쳐도 이 캐릭터에는 반영되지 않는다.
                bool uses = false;
                foreach (Material m in r.sharedMaterials)
                {
                    if (m != null && m.HasProperty(CloakId))
                    {
                        uses = true;
                        break;
                    }
                }
                if (!uses)
                {
                    continue;
                }
                // materials 는 이 Renderer 전용 복사본 배열을 만든다. 공유 머티리얼을 고치면 같은 머티리얼의 다른 캐릭터도 사라진다.
                // 같은 Renderer 의 다른 머티리얼도 함께 복사되므로 모두 목록에 넣어 OnDestroy 에서 지운다.
                foreach (Material m in r.materials)
                {
                    materials.Add(m);
                    if (m != null && m.HasProperty(CloakId))
                    {
                        // 머티리얼 기본값은 미리보기용이라 반쯤 은신해 있다. 보이는 모습으로 시작한다.
                        m.SetFloat(CloakId, 0f);
                        m.SetFloat(RevealId, 0f);
                    }
                }
            }
        }

        void OnEnable()
        {
            // 전환 도중에 꺼졌다 켜졌으면 마지막 요청 쪽으로 이어 간다.
            if (cloakRoutine == null && !Mathf.Approximately(cloak, IsCloaked ? 1f : 0f))
            {
                cloakRoutine = StartCoroutine(Fade());
            }
        }

        /// <summary>
        /// 은신을 켜거나 끈다. 인자가 bool 이라 Toggle 같은 UnityEvent(Dynamic bool)에 바로 연결할 수 있다.
        /// 전환 중에 부르면 요청만 기억하고, 지금 전환이 끝난 뒤 그 방향으로 다시 전환한다.
        /// </summary>
        public void SetCloaked(bool cloaked)
        {
            IsCloaked = cloaked;
            // 꺼진 오브젝트에서는 StartCoroutine 이 오류를 낸다. 요청은 기억해 두었다가 OnEnable 에서 이어 간다.
            if (!isActiveAndEnabled)
            {
                return;
            }
            if (cloakRoutine == null)
            {
                cloakRoutine = StartCoroutine(Fade());
            }
        }

        IEnumerator Fade()
        {
            // 도중에 방향을 바꾸지 않는다. 연타할 때마다 되돌리면 경계 띠가 같은 자리를 빠르게 오가며 깜빡인다(초당 3회를 넘을 수 있다).
            // 띠는 전환마다 한 자리를 한 번 지나고 전환 하나는 0.8초 이상 걸리므로, 연타해도 평균 초당 1.25회를 넘지 않는다.
            // 전환은 일시정지에 맞춰 멈추도록 게임 시간(Time.deltaTime)으로 센다. Time.timeScale 을 2 이상으로 올리는 게임은 이 빈도도 그만큼 오른다.
            float duration = Mathf.Clamp(transitionSeconds, 0.8f, 1.2f);
            float target = IsCloaked ? 1f : 0f;
            while (!Mathf.Approximately(cloak, target))
            {
                cloak = Mathf.MoveTowards(cloak, target, Time.deltaTime / duration);
                SetAll(CloakId, cloak);
                yield return null;
                // 끝에 닿은 뒤에만 그동안 바뀐 요청을 읽는다.
                if (Mathf.Approximately(cloak, target))
                {
                    target = IsCloaked ? 1f : 0f;
                }
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

        void OnDisable()
        {
            // 전환 도중에 꺼져도 코루틴이 남지 않게 멈추고, 노출 값은 0 으로 되돌린다.
            // 은신 값(cloak)은 그대로 두어 다시 켜면 이어 간다. lastRevealTime 은 지우지 않는다 (껐다 켜서 제한을 피하지 못하게).
            StopAllCoroutines();
            cloakRoutine = null;
            revealRoutine = null;
            SetAll(RevealId, 0f);
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
