// 팔레트 줄을 바꾼다. 팀 색(평소 줄)을 고르고, 피격 때 잠깐 피격 줄로 바꿨다가 돌아온다. SpriteRenderer 에 붙여 쓴다.
using System.Collections;
using UnityEngine;

namespace ShaderGallery.Samples
{
    [RequireComponent(typeof(SpriteRenderer))]
    public class PaletteSwapController : MonoBehaviour
    {
        static readonly int PaletteRow = Shader.PropertyToID("_PaletteRow");
        static readonly int HitRow = Shader.PropertyToID("_HitRow");
        static readonly int HitFlash = Shader.PropertyToID("_HitFlash");

        [Tooltip("평소 팔레트 줄. 팔레트 PNG 의 위에서부터 0 번")]
        [SerializeField] int teamRow = 0;
        [Tooltip("피격 때 잠깐 바꿀 줄")]
        [SerializeField] int hitRow = 7;
        [SerializeField] float hitSeconds = 0.2f;

        Material material;

        void Awake()
        {
            // 이 스프라이트 전용 복사본을 쓴다. 그래야 같은 머티리얼의 다른 캐릭터는 팀 색이 그대로이고 SRP Batcher 도 유지된다.
            material = GetComponent<SpriteRenderer>().material;
            // 머티리얼 기본값과 상관없이 이 오브젝트의 시작 상태를 넣는다.
            material.SetFloat(PaletteRow, teamRow);
            material.SetFloat(HitRow, hitRow);
            material.SetFloat(HitFlash, 0f);
        }

        /// <summary>팀이나 상태가 바뀔 때 평소 팔레트 줄을 바꾼다.</summary>
        public void SetTeam(int row)
        {
            teamRow = row;
            if (material != null)
            {
                material.SetFloat(PaletteRow, row);
            }
        }

        /// <summary>피격 판정이 난 순간에 호출한다.</summary>
        public void Hit()
        {
            // 꺼진 오브젝트에서는 StartCoroutine 이 오류를 낸다.
            if (!isActiveAndEnabled)
            {
                return;
            }
            StopAllCoroutines();
            StartCoroutine(Flash());
        }

        IEnumerator Flash()
        {
            // 셰이더는 _HitFlash 가 0.5 이상이면 피격 줄을 쓴다. 색을 섞지 않고 줄을 통째로 바꾼다.
            material.SetFloat(HitFlash, 1f);
            yield return new WaitForSeconds(hitSeconds);
            material.SetFloat(HitFlash, 0f);
        }

        void OnDisable()
        {
            // 피격 중에 꺼져도 피격 색으로 남지 않게 되돌린다.
            StopAllCoroutines();
            if (material != null)
            {
                material.SetFloat(HitFlash, 0f);
            }
        }

        void OnDestroy()
        {
            // renderer.material 로 만든 복사본은 직접 지워야 한다.
            Destroy(material);
        }
    }
}
