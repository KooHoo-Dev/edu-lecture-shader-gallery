// 촘촘한 평면 메시 (stage.mesh = "grid"). web/src/stage/ShaderStage.ts 의 grid 와 같은 크기, 칸 수, UV 방향이다.
// Unity 기본 Plane 과 크기(10 × 10)와 UV 방향(u 는 -X, v 는 -Z 쪽으로 커진다)이 같고 칸만 100 × 100 으로 촘촘하다.
// 기본 Plane(10 × 10 칸)에서 정점을 미는 수면은 파장을 길게 잡아야 해 천처럼 보여서 둔다.
using UnityEngine;

namespace ShaderGallery.EditorTools
{
    static class SgGrid
    {
        const float Size = 10f;
        const int Cells = 100;

        public static Mesh Build()
        {
            int n = Cells + 1;
            var positions = new Vector3[n * n];
            var normals = new Vector3[n * n];
            var uvs = new Vector2[n * n];
            for (int z = 0; z < n; z++)
            {
                for (int x = 0; x < n; x++)
                {
                    int i = z * n + x;
                    float u = x / (float)Cells;
                    float v = z / (float)Cells;
                    positions[i] = new Vector3(Size * (0.5f - u), 0f, Size * (0.5f - v));
                    normals[i] = Vector3.up;
                    uvs[i] = new Vector2(u, v);
                }
            }
            var indices = new int[Cells * Cells * 6];
            int k = 0;
            for (int z = 0; z < Cells; z++)
            {
                for (int x = 0; x < Cells; x++)
                {
                    int a = z * n + x;
                    int b = a + n;
                    int c = a + 1;
                    int d = b + 1;
                    // 위에서 볼 때 시계 방향이라 앞면이 +Y 를 향한다.
                    indices[k++] = a;
                    indices[k++] = b;
                    indices[k++] = c;
                    indices[k++] = c;
                    indices[k++] = b;
                    indices[k++] = d;
                }
            }
            var mesh = new Mesh { name = "SgGrid", hideFlags = HideFlags.HideAndDontSave };
            mesh.SetVertices(positions);
            mesh.SetNormals(normals);
            mesh.SetUVs(0, uvs);
            mesh.SetTriangles(indices, 0);
            mesh.RecalculateTangents();
            mesh.RecalculateBounds();
            return mesh;
        }
    }
}
