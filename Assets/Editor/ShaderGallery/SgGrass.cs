// 풀 다발 메시 (stage.mesh = "grass"). web/src/stage/grass.ts 와 같은 계산으로 같은 메시를 만든다.
// 뿌리가 y = 0, uv.y 는 뿌리 0 에서 끝 1 이다. 바람처럼 정점을 미는 표본이 휘어 보이도록 잎마다 세로로 나눈다.
using System.Collections.Generic;
using UnityEngine;

namespace ShaderGallery.EditorTools
{
    static class SgGrass
    {
        const int Blades = 36;
        const int Segments = 5;
        const float Radius = 0.45f;

        // 31비트 선형 합동 생성기. 웹 쪽(Math.imul)과 비트 단위로 같은 수열을 낸다.
        sealed class Lcg
        {
            uint state;

            public Lcg(uint seed)
            {
                state = seed;
            }

            public float Next()
            {
                unchecked
                {
                    state = (state * 1103515245u + 12345u) & 0x7fffffffu;
                }
                return state / 2147483648f;
            }
        }

        public static Mesh Build()
        {
            var next = new Lcg(20261102u);
            var positions = new List<Vector3>();
            var normals = new List<Vector3>();
            var uvs = new List<Vector2>();
            var indices = new List<int>();
            for (int b = 0; b < Blades; b++)
            {
                // 웹과 같은 순서로 난수를 뽑는다.
                float r = Radius * Mathf.Sqrt(next.Next());
                float a = Mathf.PI * 2f * next.Next();
                float height = 0.7f + 0.5f * next.Next();
                float width = 0.06f + 0.03f * next.Next();
                float yaw = Mathf.PI * 2f * next.Next();
                float lean = 0.15f * next.Next();
                var basePos = new Vector3(r * Mathf.Cos(a), 0f, r * Mathf.Sin(a));
                var right = new Vector3(Mathf.Cos(yaw), 0f, Mathf.Sin(yaw));
                var forward = new Vector3(-Mathf.Sin(yaw), 0f, Mathf.Cos(yaw));
                int first = positions.Count;
                for (int j = 0; j <= Segments; j++)
                {
                    float t = j / (float)Segments;
                    float half = width * 0.5f * (1f - 0.9f * t);
                    float bend = lean * height * t * t;
                    foreach (int side in new[] { -1, 1 })
                    {
                        positions.Add(basePos + right * (half * side) + forward * bend + Vector3.up * (height * t));
                        normals.Add(forward);
                        uvs.Add(new Vector2(side < 0 ? 0f : 1f, t));
                    }
                }
                for (int j = 0; j < Segments; j++)
                {
                    int i = first + j * 2;
                    indices.AddRange(new[] { i, i + 1, i + 2, i + 1, i + 3, i + 2 });
                }
            }
            var mesh = new Mesh { name = "SgGrass", hideFlags = HideFlags.HideAndDontSave };
            mesh.SetVertices(positions);
            mesh.SetNormals(normals);
            mesh.SetUVs(0, uvs);
            mesh.SetTriangles(indices, 0);
            mesh.RecalculateBounds();
            return mesh;
        }
    }
}
