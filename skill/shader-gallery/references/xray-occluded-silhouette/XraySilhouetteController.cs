// 벽 뒤 실루엣의 팀 색(_SilhouetteColor)을 정하고, 적을 발견한 순간 발견 펄스(_Reveal)를 0 에서 1 로 올렸다 0 으로 내린다.
using System.Collections;
using UnityEngine;

namespace ShaderGallery.Samples
{
    [RequireComponent(typeof(Renderer))]
    public class XraySilhouetteController : MonoBehaviour
    {
        public enum Team
        {
            Ally,
            Enemy,
        }

        static readonly int Reveal = Shader.PropertyToID("_Reveal");
        static readonly int SilhouetteColor = Shader.PropertyToID("_SilhouetteColor");

        [SerializeField] Team team = Team.Ally;
        // 팀 색은 Inspector 에서 고른 sRGB 색 그대로 넣는다. 머티리얼의 Color 속성과 같아 Unity 가 선형으로 바꿔 준다.
        [SerializeField] Color allyColor = new Color(0.184f, 0.549f, 1f, 1f);
        [SerializeField] Color enemyColor = new Color(1f, 0.302f, 0.267f, 1f);
        // 꺼 두면 머티리얼에 적힌 실루엣 색을 그대로 쓴다.
        [SerializeField] bool applyTeamColor = true;
        // 펄스가 차오르는 시간과 사라지는 시간. 웹 미리보기의 '발견' 이벤트와 같은 값이다.
        [SerializeField] float riseSeconds = 0.08f;
        [SerializeField] float fadeSeconds = 0.6f;
        // 같은 대상을 계속 발견해도 1 초에 3 번을 넘게 번쩍이지 않게 막는다.
        [SerializeField] float minInterval = 0.34f;

        Material material;
        float lastRevealTime = float.NegativeInfinity;

        public Team CurrentTeam => team;

        void Awake()
        {
            // 이 물체 전용 복사본을 쓴다. 그래야 같은 머티리얼의 다른 캐릭터는 색과 펄스가 바뀌지 않고 SRP Batcher 도 유지된다.
            material = GetComponent<Renderer>().material;
            // 연출 전에는 펄스가 꺼져 있어야 한다. 머티리얼 에셋에 미리보기용 값이 남아 있어도 여기서 0 으로 시작한다.
            material.SetFloat(Reveal, 0f);
            if (applyTeamColor)
            {
                material.SetColor(SilhouetteColor, team == Team.Ally ? allyColor : enemyColor);
            }
        }

        /// <summary>팀을 바꾸고 실루엣 색을 그 팀 색으로 바꾼다.</summary>
        public void SetTeam(Team value)
        {
            team = value;
            applyTeamColor = true;
            if (material != null)
            {
                material.SetColor(SilhouetteColor, team == Team.Ally ? allyColor : enemyColor);
            }
        }

        /// <summary>아군으로 바꾼다. 인자가 없어 UnityEvent 에 바로 연결할 수 있다.</summary>
        public void SetAlly() => SetTeam(Team.Ally);

        /// <summary>적으로 바꾼다.</summary>
        public void SetEnemy() => SetTeam(Team.Enemy);

        /// <summary>적을 발견한 순간에 호출한다. 실루엣이 잠깐 꽉 차고 밝아졌다가 원래대로 돌아온다.</summary>
        public void PlayReveal()
        {
            // 꺼진 오브젝트에서는 StartCoroutine 이 오류를 낸다.
            if (!isActiveAndEnabled || material == null)
            {
                return;
            }
            // 실제 시간으로 센다. Time.time 은 Time.timeScale 을 올리면 빨라져 초당 3 번 제한이 깨진다.
            // Inspector 에서 minInterval 을 낮춰도 0.34 초 아래로는 내려가지 않는다.
            if (Time.unscaledTime - lastRevealTime < Mathf.Max(minInterval, 0.34f))
            {
                return;
            }
            lastRevealTime = Time.unscaledTime;
            StopAllCoroutines();
            StartCoroutine(Animate());
        }

        IEnumerator Animate()
        {
            // 두 구간 모두 처음에 빨리 변하고 끝에서 느려지는 모양이다. 웹 트랙의 outQuad 와 같다.
            // 빠르게 차오른다: 1 - (1 - x)^2.
            for (float t = 0f; t < riseSeconds; t += Time.deltaTime)
            {
                float rest = 1f - t / riseSeconds;
                material.SetFloat(Reveal, 1f - rest * rest);
                yield return null;
            }
            // 천천히 사라진다: (1 - x)^2.
            for (float t = 0f; t < fadeSeconds; t += Time.deltaTime)
            {
                float remain = 1f - t / fadeSeconds;
                material.SetFloat(Reveal, remain * remain);
                yield return null;
            }
            material.SetFloat(Reveal, 0f);
        }

        void OnDisable()
        {
            // lastRevealTime 은 지우지 않는다. 껐다 켜는 것으로 초당 3 회 제한을 피하지 못하게 한다.
            StopAllCoroutines();
            if (material != null)
            {
                material.SetFloat(Reveal, 0f);
            }
        }

        void OnDestroy()
        {
            // renderer.material 로 만든 복사본은 직접 지워야 한다.
            Destroy(material);
        }
    }
}
