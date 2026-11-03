// 지면 범위 표시의 시전 진행 값(_Fill)을 0 에서 1 로 올리고, 다 차면 표시를 끈다. 표시 상자의 MeshRenderer 에 붙여 쓴다.
using System.Collections;
using UnityEngine;

namespace ShaderGallery.Samples
{
    [RequireComponent(typeof(Renderer))]
    public class GroundIndicatorCharge : MonoBehaviour
    {
        static readonly int Fill = Shader.PropertyToID("_Fill");

        [SerializeField] float defaultDuration = 1.5f;
        // 다 찬 뒤 표시를 끄기 전에 잠깐 남겨 두는 시간 (공격이 떨어지는 순간)
        [SerializeField] float holdSeconds = 0.1f;
        // 켜 두면 시전 전에는 표시를 숨긴다. 사거리처럼 늘 보이는 표시는 끈다
        [SerializeField] bool hideWhenIdle = true;

        Renderer target;
        Material material;

        /// <summary>지금 시전 중인지.</summary>
        public bool IsCasting { get; private set; }

        void Awake()
        {
            target = GetComponent<Renderer>();
            // 이 표시 전용 복사본을 쓴다. 그래야 같은 머티리얼을 쓰는 다른 표시가 함께 차오르지 않고 SRP Batcher 도 유지된다.
            material = target.material;
            material.SetFloat(Fill, 0f);
            if (hideWhenIdle)
            {
                target.enabled = false;
            }
        }

        /// <summary>기본 시간으로 시전한다. UnityEvent 에 연결할 때 쓴다.</summary>
        public void Cast()
        {
            Cast(defaultDuration);
        }

        /// <summary>표시를 켜고 duration 초 동안 가운데에서 바깥으로 채운 뒤 끈다.</summary>
        public void Cast(float duration)
        {
            // 꺼진 오브젝트에서는 StartCoroutine 이 오류를 낸다.
            if (!isActiveAndEnabled)
            {
                return;
            }
            StopAllCoroutines();
            StartCoroutine(Charge(Mathf.Max(duration, 0.01f)));
        }

        IEnumerator Charge(float duration)
        {
            IsCasting = true;
            target.enabled = true;
            // Time.deltaTime 으로 쌓아 일시정지(timeScale 0)와 슬로모션을 따른다. 게임 속 공격 타이밍과 맞아야 한다.
            for (float t = 0f; t < duration; t += Time.deltaTime)
            {
                material.SetFloat(Fill, t / duration);
                yield return null;
            }
            material.SetFloat(Fill, 1f);
            if (holdSeconds > 0f)
            {
                yield return new WaitForSeconds(holdSeconds);
            }
            Finish();
        }

        void Finish()
        {
            IsCasting = false;
            if (material != null)
            {
                material.SetFloat(Fill, 0f);
            }
            if (hideWhenIdle && target != null)
            {
                target.enabled = false;
            }
        }

        void OnDisable()
        {
            // 시전 중에 꺼져도 반쯤 찬 채로 남지 않게 되돌린다.
            StopAllCoroutines();
            Finish();
        }

        void OnDestroy()
        {
            // renderer.material 로 만든 복사본은 직접 지워야 한다.
            Destroy(material);
        }
    }
}
