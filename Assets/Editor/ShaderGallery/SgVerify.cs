// 셰이더 검증 진입점. 컴파일 오류를 모으고 표본마다 스크린샷을 찍어 결과 파일로 남긴다.
// 배치 모드(-executeMethod ShaderGallery.EditorTools.SgVerify.RunBatch)와 열린 에디터(SgBridge)가 같은 Run 을 호출한다.
using System;
using System.Collections.Generic;
using System.IO;
using UnityEditor;
using UnityEditor.Rendering;
using UnityEngine;
using UnityEngine.Rendering;

namespace ShaderGallery.EditorTools
{
    public static class SgVerify
    {
        // 표본이 실제로 쓰이는 대표 플랫폼. D3D11 은 수업 PC, 나머지는 빌드 대상에서 갈리는 문법을 잡는다.
        static readonly (ShaderCompilerPlatform platform, BuildTarget target, string label)[] Platforms =
        {
            (ShaderCompilerPlatform.D3D, BuildTarget.StandaloneWindows64, "D3D11"),
            (ShaderCompilerPlatform.Vulkan, BuildTarget.StandaloneWindows64, "Vulkan"),
            (ShaderCompilerPlatform.GLES3x, BuildTarget.Android, "GLES3"),
            (ShaderCompilerPlatform.Metal, BuildTarget.iOS, "Metal"),
        };

        // 기본 변형 외에 실제 빌드에서 갈리기 쉬운 키워드. 모든 플랫폼에 돌리면 오래 걸려 D3D11 과 GLES3 에만 돌린다.
        static readonly string[][] ExtraKeywords =
        {
            new[] { "INSTANCING_ON" },
            new[] { "STEREO_INSTANCING_ON" },
            new[] { "_MAIN_LIGHT_SHADOWS_CASCADE", "_SHADOWS_SOFT" },
            new[] { "SKINNED_SPRITE" },
            // Forward 전용 노멀 패스. Deferred 의 정확한 G-buffer 노멀과 렌더링 레이어를 켜면 쓰인다.
            new[] { "_GBUFFER_NORMALS_OCT" },
            new[] { "_WRITE_RENDERING_LAYERS" },
            // UI 셰이더. RectMask2D 가 클리핑을, Mask 가 알파 클립을 켠다. 둘 다 켜지는 경우도 있다.
            new[] { "UNITY_UI_CLIP_RECT" },
            new[] { "UNITY_UI_ALPHACLIP" },
            new[] { "UNITY_UI_CLIP_RECT", "UNITY_UI_ALPHACLIP" },
        };

        public static void RunBatch()
        {
            string jobPath = ArgumentAfter("-sgJob");
            int exitCode = 2;
            try
            {
                SgResult result = Run(jobPath, "batch");
                exitCode = result.ok ? 0 : 1;
            }
            catch (Exception e)
            {
                Debug.LogError("[SgVerify] " + e);
            }
            EditorApplication.Exit(exitCode);
        }

        public static SgResult Run(string jobPath, string mode)
        {
            SgJob job = JsonUtility.FromJson<SgJob>(File.ReadAllText(jobPath));
            Directory.CreateDirectory(job.outDir);

            var result = new SgResult
            {
                mode = mode,
                unityVersion = Application.unityVersion,
                graphicsDevice = SystemInfo.graphicsDeviceType.ToString(),
                pipeline = GraphicsSettings.currentRenderPipeline != null ? GraphicsSettings.currentRenderPipeline.name : "(없음)",
                ok = true,
            };

            // 비동기 컴파일이 켜져 있으면 방금 고친 셰이더 대신 청록색 임시 셰이더가 찍힐 수 있다.
            bool asyncCompilation = ShaderUtil.allowAsyncCompilation;
            ShaderUtil.allowAsyncCompilation = false;
            try
            {
                AssetDatabase.Refresh(ImportAssetOptions.ForceSynchronousImport);
                foreach (SgJobSpecimen specimen in job.specimens)
                {
                    SgSpecimenResult item = CompileCheck(specimen);
                    if (item.compileOk && job.capture)
                    {
                        CaptureStates(job, specimen, item);
                    }
                    result.specimens.Add(item);
                    result.ok &= item.compileOk;
                }
            }
            catch (Exception e)
            {
                result.ok = false;
                result.fatal = e.ToString();
            }
            finally
            {
                ShaderUtil.allowAsyncCompilation = asyncCompilation;
            }

            result.finishedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
            File.WriteAllText(Path.Combine(job.outDir, "result.json"), JsonUtility.ToJson(result, true));
            return result;
        }

        static SgSpecimenResult CompileCheck(SgJobSpecimen specimen)
        {
            var item = new SgSpecimenResult { id = specimen.id, compileOk = true };

            AssetDatabase.ImportAsset(specimen.shader, ImportAssetOptions.ForceUpdate | ImportAssetOptions.ForceSynchronousImport);
            Shader shader = AssetDatabase.LoadAssetAtPath<Shader>(specimen.shader);
            if (shader == null)
            {
                item.compileOk = false;
                item.messages.Add(new SgMessage { severity = "error", where = "import", message = "셰이더를 불러오지 못했습니다: " + specimen.shader });
                return item;
            }

            foreach (ShaderMessage m in ShaderUtil.GetShaderMessages(shader))
            {
                AddMessage(item, m, "import");
            }
            if (ShaderUtil.ShaderHasError(shader))
            {
                item.compileOk = false;
            }

            // 가져오기 단계는 일부 조합만 검사하므로 패스마다 플랫폼별로 직접 컴파일한다.
            ShaderData data = ShaderUtil.GetShaderData(shader);
            for (int s = 0; s < data.SubshaderCount; s++)
            {
                ShaderData.Subshader sub = data.GetSubshader(s);
                for (int p = 0; p < sub.PassCount; p++)
                {
                    ShaderData.Pass pass = sub.GetPass(p);
                    foreach (var (platform, target, label) in Platforms)
                    {
                        foreach (string[] keywords in KeywordSets(shader, platform))
                        {
                            foreach (ShaderType type in new[] { ShaderType.Vertex, ShaderType.Fragment })
                            {
                                if (!pass.HasShaderStage(type))
                                {
                                    continue;
                                }
                                ShaderData.VariantCompileInfo info = pass.CompileVariant(type, keywords, platform, target);
                                item.variantsCompiled++;
                                string where = $"{label}/{pass.Name}/{type}/{string.Join("+", keywords)}";
                                foreach (ShaderMessage m in info.Messages)
                                {
                                    AddMessage(item, m, where);
                                }
                                if (!info.Success)
                                {
                                    item.compileOk = false;
                                    if (info.Messages.Length == 0)
                                    {
                                        item.messages.Add(new SgMessage { severity = "error", where = where, message = "컴파일 실패 (메시지 없음)" });
                                    }
                                }
                            }
                        }
                    }
                }
            }

            return item;
        }

        // 기본 변형과, 이 셰이더가 선언한 키워드 조합. 스테레오는 프로젝트의 XR 설정이 더하므로 선언과 상관없이 검사한다.
        static IEnumerable<string[]> KeywordSets(Shader shader, ShaderCompilerPlatform platform)
        {
            yield return Array.Empty<string>();
            if (platform != ShaderCompilerPlatform.D3D && platform != ShaderCompilerPlatform.GLES3x)
            {
                yield break;
            }
            var declared = new HashSet<string>(shader.keywordSpace.keywordNames);
            foreach (string[] keywords in ExtraKeywords)
            {
                if (keywords[0] == "STEREO_INSTANCING_ON" || declared.Contains(keywords[0]))
                {
                    yield return keywords;
                }
            }
        }

        static void AddMessage(SgSpecimenResult item, ShaderMessage m, string where)
        {
            item.messages.Add(new SgMessage
            {
                severity = m.severity == ShaderCompilerMessageSeverity.Error ? "error" : "warning",
                where = where,
                message = m.message + (string.IsNullOrEmpty(m.messageDetails) ? "" : " | " + m.messageDetails),
                file = m.file,
                line = m.line,
            });
            if (m.severity == ShaderCompilerMessageSeverity.Error)
            {
                item.compileOk = false;
            }
        }

        static void CaptureStates(SgJob job, SgJobSpecimen specimen, SgSpecimenResult item)
        {
            string dir = Path.Combine(job.outDir, specimen.id);
            Directory.CreateDirectory(dir);
            var states = specimen.states.Count > 0 ? specimen.states : new List<SgCaptureState> { new SgCaptureState { name = "default" } };
            foreach (SgCaptureState state in states)
            {
                string file = Path.Combine(dir, state.name + ".png");
                item.shots.Add(SgCapture.Shoot(specimen, state, job.width, job.height, file));
            }
        }

        static string ArgumentAfter(string name)
        {
            string[] args = Environment.GetCommandLineArgs();
            for (int i = 0; i + 1 < args.Length; i++)
            {
                if (args[i] == name)
                {
                    return args[i + 1];
                }
            }
            throw new ArgumentException("명령줄에 " + name + " 이 없습니다");
        }
    }
}
