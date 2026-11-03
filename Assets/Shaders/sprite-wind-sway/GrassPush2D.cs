// 풀 밀기: 플레이어나 탈것이 풀 덤불의 트리거를 지나가면 밀기 값(_Push)을 감쇠 진동으로 움직여 풀이 한 번 휘청인다.
// 셰이더가 _Push 를 바람 값에 더하므로 바람 세기와 상관없이 지나간 쪽으로 누웠다가 반대로 조금 튕기고 돌아온다.
// 풀 덤불 SpriteRenderer 에 Collider2D(Is Trigger 켬)와 함께 붙인다. 지나가는 쪽에는 Rigidbody2D 가 있어야 트리거가 불린다.
using System.Collections;
using UnityEngine;

namespace ShaderGallery.Samples
{
    [RequireComponent(typeof(SpriteRenderer))]
    public class GrassPush2D : MonoBehaviour
    {
        static readonly int PushId = Shader.PropertyToID("_Push");

        // 갤러리의 '밀기' 이벤트와 같은 키 (초, 값). 키 사이는 사인 가감속(inOutSine)으로 잇는다.
        static readonly Vector2[] Keys =
        {
            new Vector2(0f, 0f),
            new Vector2(0.18f, 1f),
            new Vector2(0.55f, -0.35f),
            new Vector2(0.9f, 0.12f),
            new Vector2(1.25f, 0f),
        };

        [Tooltip("이 레이어의 물체가 닿을 때만 민다 (플레이어, 적, 탈것)")]
        [SerializeField] LayerMask pushers = ~0;
        [Tooltip("가장 세게 밀 때의 _Push 값. 1 이면 꼭대기가 0.45 유닛 밀린다")]
        [Range(0f, 1f)]
        [SerializeField] float amount = 1f;

        Material material;
        Coroutine playing;

        void Awake()
        {
            // 이 덤불 전용 복사본을 쓴다. 공유 머티리얼을 고치면 같은 머티리얼의 풀이 모두 함께 휘청인다.
            material = GetComponent<SpriteRenderer>().material;
            // 머티리얼에 시험 삼아 넣어 둔 값이 남지 않게 밀기 없이 시작한다.
            material.SetFloat(PushId, 0f);
        }

        void OnTriggerEnter2D(Collider2D other)
        {
            if ((pushers.value & (1 << other.gameObject.layer)) == 0)
            {
                return;
            }
            // 지나가는 방향은 리지드바디의 가로 속도 부호로 정한다 (Unity 6 이름 linearVelocity).
            // 서 있다가 닿았으면 덤불이 상대의 어느 쪽에 있는지로 정한다.
            Rigidbody2D body = other.attachedRigidbody;
            float direction = transform.position.x >= other.transform.position.x ? 1f : -1f;
            if (body != null && Mathf.Abs(body.linearVelocity.x) > 0.05f)
            {
                direction = Mathf.Sign(body.linearVelocity.x);
            }
            Push(direction);
        }

        /// <summary>풀을 한 번 민다. direction 이 양수면 오른쪽, 음수면 왼쪽으로 먼저 눕는다.</summary>
        public void Push(float direction)
        {
            // 꺼진 오브젝트에서는 StartCoroutine 이 오류를 낸다.
            // 재생 중에 다시 닿으면 무시한다 (쿨다운). 처음부터 다시 시작하면 풀이 한쪽으로 튀어 보인다.
            if (!isActiveAndEnabled || playing != null)
            {
                return;
            }
            playing = StartCoroutine(Play(direction < 0f ? -amount : amount));
        }

        IEnumerator Play(float scale)
        {
            float end = Keys[Keys.Length - 1].x;
            for (float t = 0f; t < end; t += Time.deltaTime)
            {
                material.SetFloat(PushId, Sample(t) * scale);
                yield return null;
            }
            material.SetFloat(PushId, 0f);
            playing = null;
        }

        static float Sample(float t)
        {
            for (int k = 1; k < Keys.Length; k++)
            {
                if (t < Keys[k].x)
                {
                    float u = (t - Keys[k - 1].x) / (Keys[k].x - Keys[k - 1].x);
                    return Mathf.Lerp(Keys[k - 1].y, Keys[k].y, 0.5f - 0.5f * Mathf.Cos(Mathf.PI * u));
                }
            }
            return Keys[Keys.Length - 1].y;
        }

        void OnDisable()
        {
            // 밀던 중에 꺼져도 기운 채로 남지 않게 되돌린다.
            StopAllCoroutines();
            playing = null;
            if (material != null)
            {
                material.SetFloat(PushId, 0f);
            }
        }

        void OnDestroy()
        {
            // renderer.material 로 만든 복사본은 직접 지워야 한다.
            Destroy(material);
        }
    }
}
