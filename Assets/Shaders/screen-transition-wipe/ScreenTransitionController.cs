// 화면을 덮고, 그동안 씬을 불러오고, 다시 걷는다. 씬 전환을 관리하는 빈 오브젝트에 붙여 쓴다.
using System.Collections;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace ShaderGallery.Samples
{
    public class ScreenTransitionController : MonoBehaviour
    {
        static readonly int Progress = Shader.PropertyToID("_Progress");

        // Full Screen Pass Renderer Feature 의 Pass Material 에 넣은 그 머티리얼.
        [SerializeField] Material transitionMaterial;
        [SerializeField] float coverSeconds = 0.6f;
        [SerializeField] float revealSeconds = 0.6f;

        bool running;

        void Awake()
        {
            // 씬이 바뀌어도 전환이 끝까지 이어지게 한다.
            DontDestroyOnLoad(gameObject);
            transitionMaterial.SetFloat(Progress, 0f);
        }

        /// <summary>전환 연출과 함께 씬을 불러온다. 전환 중에 다시 불러도 무시한다.</summary>
        public void LoadScene(string sceneName)
        {
            if (!running)
            {
                StartCoroutine(Run(sceneName));
            }
        }

        IEnumerator Run(string sceneName)
        {
            running = true;
            yield return Animate(0f, 1f, coverSeconds);

            AsyncOperation load = SceneManager.LoadSceneAsync(sceneName);
            while (!load.isDone)
            {
                yield return null;
            }

            yield return Animate(1f, 0f, revealSeconds);
            running = false;
        }

        IEnumerator Animate(float from, float to, float seconds)
        {
            // 씬 로딩 중 멈칫해도 연출 길이가 변하지 않도록 실제 시간을 쓴다.
            for (float t = 0f; t < seconds; t += Time.unscaledDeltaTime)
            {
                transitionMaterial.SetFloat(Progress, Mathf.Lerp(from, to, t / seconds));
                yield return null;
            }
            transitionMaterial.SetFloat(Progress, to);
        }

        void OnDisable()
        {
            StopAllCoroutines();
            running = false;
            // 머티리얼 에셋은 플레이를 멈춰도 값이 남는다. 덮인 채로 남지 않게 되돌린다.
            transitionMaterial.SetFloat(Progress, 0f);
        }
    }
}
