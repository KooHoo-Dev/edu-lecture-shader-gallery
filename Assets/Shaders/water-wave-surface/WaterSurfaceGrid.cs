// 물결 수면용 촘촘한 평면 메시를 만들어 MeshFilter 에 넣는다. 빈 GameObject 에 붙이고 MeshRenderer 에 물 머티리얼을 넣는다.
// Unity 기본 Plane 과 크기(한 변 10)와 UV 방향(u 는 -X, v 는 -Z 쪽으로 커진다)이 같고 칸만 촘촘하다 (기본 100 칸, 정점 간격 0.1).
// 기본 Plane 은 10 칸(정점 간격 1)이라 짧은 파도의 윤곽이 꺾인 선이 된다.
using UnityEngine;

namespace ShaderGallery.Samples
{
    [ExecuteAlways]
    [RequireComponent(typeof(MeshFilter), typeof(MeshRenderer))]
    public class WaterSurfaceGrid : MonoBehaviour
    {
        // 정점 인덱스를 16비트로 두어 모바일에서도 안전하게: (칸 + 1)² 이 65535 를 넘지 않는 최대 칸 수.
        const int MaxCells = 254;

        [Tooltip("한 변의 길이 (m). 넓은 물은 Scale 대신 이 값을 키운다. Scale 을 키우면 파도도 함께 커진다")]
        [SerializeField, Min(0.1f)] float size = 10f;

        [Tooltip("한 변의 칸 수. 가장 짧은 파도가 정점 간격(한 변 / 칸 수)의 4 배 이상이 되게 둔다. 칸이 많을수록 정점 비용이 크다")]
        [SerializeField, Range(1, MaxCells)] int cells = 100;

        [Tooltip("경계 상자를 위아래로 늘리는 여유 (m). 셰이더가 정점을 밀어도 화면 가장자리에서 마루가 잘려 사라지지 않게 파도 높이보다 크게 둔다")]
        [SerializeField, Min(0f)] float boundsPadding = 0.5f;

        // 이 컴포넌트가 만든 메시. 씬에 저장하지 않고(DontSave) 켤 때 없으면 다시 만든다.
        Mesh mesh;
        bool dirty;

        void OnEnable()
        {
            // 씬을 열거나 오브젝트를 복제하면 이 컴포넌트의 메시가 없으므로 새로 만든다.
            if (mesh == null)
            {
                mesh = new Mesh { name = "WaterSurfaceGrid", hideFlags = HideFlags.DontSave };
            }
            Rebuild();
        }

        void OnValidate()
        {
            cells = Mathf.Clamp(cells, 1, MaxCells);
            // OnValidate 안에서 MeshFilter 를 바꾸면 Unity 가 경고한다. 표시만 하고 다음 Update 에서 만든다.
            dirty = true;
#if UNITY_EDITOR
            // 편집 모드에서도 바로 다음 갱신이 오게 한다.
            UnityEditor.EditorApplication.QueuePlayerLoopUpdate();
#endif
        }

        void Update()
        {
            if (dirty)
            {
                Rebuild();
            }
        }

        void Rebuild()
        {
            dirty = false;
            if (mesh == null)
            {
                return;
            }
            int n = cells + 1;
            var positions = new Vector3[n * n];
            var normals = new Vector3[n * n];
            var uvs = new Vector2[n * n];
            for (int z = 0; z < n; z++)
            {
                for (int x = 0; x < n; x++)
                {
                    int i = z * n + x;
                    float u = x / (float)cells;
                    float v = z / (float)cells;
                    // 기본 Plane 처럼 u 가 커지면 -X, v 가 커지면 -Z 쪽으로 간다.
                    positions[i] = new Vector3(size * (0.5f - u), 0f, size * (0.5f - v));
                    normals[i] = Vector3.up;
                    uvs[i] = new Vector2(u, v);
                }
            }
            var indices = new int[cells * cells * 6];
            int k = 0;
            for (int z = 0; z < cells; z++)
            {
                for (int x = 0; x < cells; x++)
                {
                    int a = z * n + x;
                    int b = a + n;
                    int c = a + 1;
                    int d = b + 1;
                    // 위에서 볼 때 시계 방향이라 앞면이 +Y 를 향한다. +Z 쪽 행부터 그린다.
                    indices[k++] = a;
                    indices[k++] = b;
                    indices[k++] = c;
                    indices[k++] = c;
                    indices[k++] = b;
                    indices[k++] = d;
                }
            }
            mesh.Clear();
            mesh.indexFormat = UnityEngine.Rendering.IndexFormat.UInt16;
            mesh.SetVertices(positions);
            mesh.SetNormals(normals);
            mesh.SetUVs(0, uvs);
            mesh.SetTriangles(indices, 0);
            mesh.RecalculateTangents();
            // 정점은 셰이더가 위아래로 미므로 경계 상자를 그만큼 두껍게 둔다.
            mesh.bounds = new Bounds(Vector3.zero, new Vector3(size, boundsPadding * 2f, size));
            GetComponent<MeshFilter>().sharedMesh = mesh;
        }

        void OnDestroy()
        {
            // 직접 만든 메시는 직접 지워야 한다. 편집 모드에서는 Destroy 를 쓸 수 없다.
            if (mesh == null)
            {
                return;
            }
            if (Application.isPlaying)
            {
                Destroy(mesh);
            }
            else
            {
                DestroyImmediate(mesh);
            }
            mesh = null;
        }
    }
}
