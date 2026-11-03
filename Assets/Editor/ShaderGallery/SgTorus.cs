// 고리 메시 (stage.mesh = "torus"). web/src/stage/torus.ts 와 같은 계산으로 같은 메시를 만든다.
// 볼록하지 않은 메시 시험용이다. 고리가 XY 평면에 서 있어 Y 축으로 돌면 고리의 앞뒤가 화면에서 겹친다.
// uv.x 는 고리를 도는 방향, uv.y 는 관을 도는 방향이다.
using System.Collections.Generic;
using UnityEngine;

namespace ShaderGallery.EditorTools
{
    static class SgTorus
    {
        const float Radius = 0.35f;
        const float Tube = 0.15f;
        const int Rings = 48;
        const int Sides = 24;

        public static Mesh Build()
        {
            var positions = new List<Vector3>();
            var normals = new List<Vector3>();
            var uvs = new List<Vector2>();
            var indices = new List<int>();
            for (int j = 0; j <= Sides; j++)
            {
                float v = j / (float)Sides * Mathf.PI * 2f;
                for (int i = 0; i <= Rings; i++)
                {
                    float u = i / (float)Rings * Mathf.PI * 2f;
                    var n = new Vector3(Mathf.Cos(v) * Mathf.Cos(u), Mathf.Cos(v) * Mathf.Sin(u), Mathf.Sin(v));
                    positions.Add(new Vector3(Radius * Mathf.Cos(u), Radius * Mathf.Sin(u), 0f) + n * Tube);
                    normals.Add(n);
                    uvs.Add(new Vector2(i / (float)Rings, j / (float)Sides));
                }
            }
            int row = Rings + 1;
            for (int j = 1; j <= Sides; j++)
            {
                for (int i = 1; i <= Rings; i++)
                {
                    int a = row * j + i - 1;
                    int b = row * (j - 1) + i - 1;
                    int c = row * (j - 1) + i;
                    int d = row * j + i;
                    indices.AddRange(new[] { a, b, d, b, c, d });
                }
            }
            var mesh = new Mesh { name = "SgTorus", hideFlags = HideFlags.HideAndDontSave };
            mesh.SetVertices(positions);
            mesh.SetNormals(normals);
            mesh.SetUVs(0, uvs);
            mesh.SetTriangles(indices, 0);
            mesh.RecalculateBounds();
            // 노멀 맵을 쓰는 표본을 위해 접선도 만든다
            mesh.RecalculateTangents();
            return mesh;
        }
    }
}
