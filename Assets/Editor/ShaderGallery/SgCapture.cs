// 고정된 촬영 무대. 프리뷰 씬에 임시로 꾸며 찍으므로 열려 있는 씬과 프로젝트 설정을 건드리지 않는다.
// 카메라·광원·물체 배치는 웹 무대(web/src/stage/layout.ts)와 같은 값을 쓴다.
using System.Collections.Generic;
using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Experimental.Rendering;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
using UnityEngine.SceneManagement;

namespace ShaderGallery.EditorTools
{
    public static class SgCapture
    {
        const string SpritePath = "Assets/ShaderGalleryStage/StageSprite.png";

        // web/src/stage/layout.ts 와 같은 값.
        static readonly Color Background = new Color(0.035f, 0.04f, 0.055f, 1f);
        static readonly Color FloorA = new Color(0.2f, 0.22f, 0.25f, 1f);
        static readonly Color FloorB = new Color(0.15f, 0.165f, 0.195f, 1f);
        static readonly Color PropColor = new Color(0.72f, 0.62f, 0.46f, 1f);
        static readonly Color PropColor2 = new Color(0.34f, 0.5f, 0.66f, 1f);
        static readonly Color Ambient = new Color(0.34f, 0.38f, 0.46f, 1f);
        static readonly Vector3 LightEuler = new Vector3(50f, -30f, 0f);

        class Stage
        {
            public Scene scene;
            public Camera camera;
            public readonly List<Object> temporary = new List<Object>();
            public readonly List<Renderer> renderers = new List<Renderer>();
        }

        public static SgShot Shoot(SgJobSpecimen specimen, SgCaptureState state, int width, int height, string file)
        {
            Shader shader = AssetDatabase.LoadAssetAtPath<Shader>(specimen.shader);
            var material = new Material(shader) { hideFlags = HideFlags.HideAndDontSave };
            foreach (SgTextureValue t in specimen.textures)
            {
                material.SetTexture(t.k, LoadTexture(t));
            }
            foreach (SgFloatValue f in state.floats)
            {
                material.SetFloat(f.k, f.v);
            }
            foreach (SgColorValue c in state.colors)
            {
                material.SetColor(c.k, new Color(c.r, c.g, c.b, c.a));
            }

            Stage stage = Build(specimen, material);
            var renderTexture = new RenderTexture(width, height, 24, GraphicsFormat.R8G8B8A8_SRGB) { antiAliasing = 4 };
            Texture2D read = null;
            FullScreenPassRendererFeature feature = null;
            ScriptableRendererData rendererData = null;
            try
            {
                if (specimen.stage == "fullscreen")
                {
                    feature = AddFullScreenFeature(material, out rendererData);
                }

                stage.camera.targetTexture = renderTexture;
                stage.camera.Render();

                RenderTexture previous = RenderTexture.active;
                RenderTexture.active = renderTexture;
                read = new Texture2D(width, height, TextureFormat.RGBA32, false);
                read.ReadPixels(new Rect(0, 0, width, height), 0, 0);
                read.Apply();
                RenderTexture.active = previous;

                File.WriteAllBytes(file, read.EncodeToPNG());
                Measure(read, out float luma, out float distinct);
                return new SgShot { name = state.name, file = file.Replace('\\', '/'), width = width, height = height, meanLuma = luma, distinctRatio = distinct };
            }
            finally
            {
                if (feature != null)
                {
                    rendererData.rendererFeatures.Remove(feature);
                    rendererData.SetDirty();
                    Object.DestroyImmediate(feature);
                }
                stage.camera.targetTexture = null;
                Object.DestroyImmediate(renderTexture);
                if (read != null)
                {
                    Object.DestroyImmediate(read);
                }
                foreach (Object o in stage.temporary)
                {
                    Object.DestroyImmediate(o);
                }
                EditorSceneManager.ClosePreviewScene(stage.scene);
                Object.DestroyImmediate(material);
            }
        }

        // 화면 전환은 수강생이 쓰는 경로와 똑같이 Full Screen Pass Renderer Feature 로 찍는다.
        // 렌더러 에셋을 메모리에서만 잠시 고치고 바로 되돌린다. 디스크에는 저장하지 않는다.
        static FullScreenPassRendererFeature AddFullScreenFeature(Material material, out ScriptableRendererData rendererData)
        {
            var pipeline = (UniversalRenderPipelineAsset)GraphicsSettings.currentRenderPipeline;
            rendererData = pipeline.rendererDataList[0];
            var feature = ScriptableObject.CreateInstance<FullScreenPassRendererFeature>();
            feature.hideFlags = HideFlags.HideAndDontSave;
            feature.name = "ShaderGalleryCapture";
            feature.passMaterial = material;
            feature.injectionPoint = FullScreenPassRendererFeature.InjectionPoint.BeforeRenderingPostProcessing;
            feature.fetchColorBuffer = true;
            feature.Create();
            rendererData.rendererFeatures.Add(feature);
            rendererData.SetDirty();
            return feature;
        }

        // 표본 폴더의 텍스처를 메타 데이터에 적힌 설정으로 불러온다. 설정이 다르면 .meta 를 고친다.
        static Texture2D LoadTexture(SgTextureValue t)
        {
            var importer = (TextureImporter)AssetImporter.GetAtPath(t.path);
            bool srgb = !t.linear;
            TextureWrapMode wrap = t.repeat ? TextureWrapMode.Repeat : TextureWrapMode.Clamp;
            FilterMode filter = t.point ? FilterMode.Point : FilterMode.Bilinear;
            if (importer.sRGBTexture != srgb || importer.wrapMode != wrap || importer.filterMode != filter)
            {
                importer.sRGBTexture = srgb;
                importer.wrapMode = wrap;
                importer.filterMode = filter;
                importer.SaveAndReimport();
            }
            return AssetDatabase.LoadAssetAtPath<Texture2D>(t.path);
        }

        static Stage Build(SgJobSpecimen specimen, Material material)
        {
            var stage = new Stage { scene = EditorSceneManager.NewPreviewScene() };

            var cameraObject = NewObject(stage, "Camera");
            stage.camera = cameraObject.AddComponent<Camera>();
            stage.camera.scene = stage.scene;
            stage.camera.clearFlags = CameraClearFlags.SolidColor;
            stage.camera.backgroundColor = Background;
            stage.camera.nearClipPlane = 0.1f;
            stage.camera.farClipPlane = 100f;
            stage.camera.allowHDR = true;
            stage.camera.allowMSAA = true;

            var cameraData = cameraObject.AddComponent<UniversalAdditionalCameraData>();
            cameraData.renderPostProcessing = false;
            cameraData.requiresDepthOption = CameraOverrideOption.On;
            cameraData.requiresColorOption = CameraOverrideOption.On;
            cameraData.renderShadows = true;

            var lightObject = NewObject(stage, "Light");
            var light = lightObject.AddComponent<Light>();
            light.type = LightType.Directional;
            light.color = Color.white;
            light.intensity = 1.2f;
            light.shadows = LightShadows.Soft;
            lightObject.transform.rotation = Quaternion.Euler(LightEuler);

            switch (specimen.stage)
            {
                case "sprite":
                    BuildSprite(stage, specimen, material);
                    break;
                case "depth":
                    BuildPerspective(stage);
                    AddFloor(stage);
                    AddProps(stage);
                    AddMesh(stage, PrimitiveType.Sphere, material, new Vector3(0f, 0.55f, 0f), 2.2f);
                    break;
                case "fullscreen":
                    BuildPerspective(stage);
                    AddFloor(stage);
                    AddProps(stage);
                    AddMesh(stage, PrimitiveType.Sphere, LitMaterial(stage, new Color(0.62f, 0.68f, 0.76f)), new Vector3(0f, 0.75f, 0f), 1.5f);
                    break;
                default:
                    BuildPerspective(stage);
                    AddFloor(stage);
                    PlaceEffectMesh(stage, specimen.mesh, material);
                    break;
            }

            ApplyAmbient(stage);
            return stage;
        }

        static void BuildPerspective(Stage stage)
        {
            stage.camera.orthographic = false;
            stage.camera.fieldOfView = 40f;
            stage.camera.transform.position = new Vector3(0f, 1.3f, -3.6f);
            stage.camera.transform.LookAt(new Vector3(0f, 0.75f, 0f));
        }

        static void BuildSprite(Stage stage, SgJobSpecimen specimen, Material material)
        {
            stage.camera.orthographic = true;
            stage.camera.orthographicSize = 1.5f;
            stage.camera.transform.position = new Vector3(0f, 0f, -5f);
            stage.camera.transform.rotation = Quaternion.identity;
            stage.camera.backgroundColor = new Color(0.1f, 0.115f, 0.15f, 1f);

            SgTextureValue custom = specimen.textures.Find(t => t.k == "_MainTex");
            Texture2D texture = custom != null ? LoadTexture(custom) : AssetDatabase.LoadAssetAtPath<Texture2D>(SpritePath);
            // Tight 메시는 투명 여백을 잘라 외곽선이 사라지므로 Full Rect 로 만든다.
            Sprite sprite = Sprite.Create(texture, new Rect(0, 0, texture.width, texture.height), new Vector2(0.5f, 0.5f), texture.height / 2f, 0, SpriteMeshType.FullRect);
            sprite.hideFlags = HideFlags.HideAndDontSave;
            stage.temporary.Add(sprite);

            var spriteObject = NewObject(stage, "Sprite");
            var spriteRenderer = spriteObject.AddComponent<SpriteRenderer>();
            spriteRenderer.sprite = sprite;
            spriteRenderer.sharedMaterial = material;
        }

        // web/src/stage/layout.ts 의 meshPlacement 와 같은 값.
        static void PlaceEffectMesh(Stage stage, string mesh, Material material)
        {
            switch (mesh)
            {
                case "capsule":
                    AddMesh(stage, PrimitiveType.Capsule, material, new Vector3(0f, 1f, 0f), 1f);
                    break;
                case "cylinder":
                    AddMesh(stage, PrimitiveType.Cylinder, material, new Vector3(0f, 1f, 0f), 1f);
                    break;
                case "cube":
                    AddMesh(stage, PrimitiveType.Cube, material, new Vector3(0f, 0.75f, 0f), 1.2f);
                    break;
                case "quad":
                    AddMesh(stage, PrimitiveType.Quad, material, new Vector3(0f, 0.85f, 0f), 1.6f);
                    break;
                default:
                    AddMesh(stage, PrimitiveType.Sphere, material, new Vector3(0f, 0.85f, 0f), 1.5f);
                    break;
            }
        }

        static void AddFloor(Stage stage)
        {
            var texture = new Texture2D(8, 8, TextureFormat.RGBA32, false, false) { filterMode = FilterMode.Point, wrapMode = TextureWrapMode.Repeat, hideFlags = HideFlags.HideAndDontSave };
            for (int y = 0; y < 8; y++)
            {
                for (int x = 0; x < 8; x++)
                {
                    texture.SetPixel(x, y, (x + y) % 2 == 0 ? FloorA : FloorB);
                }
            }
            texture.Apply();
            stage.temporary.Add(texture);

            Material floor = LitMaterial(stage, Color.white);
            floor.SetTexture("_BaseMap", texture);
            floor.SetTextureScale("_BaseMap", new Vector2(4f, 4f));

            GameObject plane = AddMesh(stage, PrimitiveType.Plane, floor, Vector3.zero, 1f);
            plane.transform.localScale = new Vector3(1.6f, 1f, 1.6f);
        }

        static void AddProps(Stage stage)
        {
            GameObject box = AddMesh(stage, PrimitiveType.Cube, LitMaterial(stage, PropColor), new Vector3(0.95f, 0.4f, 0.3f), 0.8f);
            box.transform.rotation = Quaternion.Euler(0f, 28f, 0f);
            AddMesh(stage, PrimitiveType.Sphere, LitMaterial(stage, PropColor2), new Vector3(-1.1f, 0.45f, 0.5f), 0.9f);
        }

        static Material LitMaterial(Stage stage, Color color)
        {
            // 웹 무대와 맞추려고 반사가 없는 Simple Lit 을 쓴다. 웹은 같은 값의 Lambert 로 그린다.
            var material = new Material(Shader.Find("Universal Render Pipeline/Simple Lit")) { hideFlags = HideFlags.HideAndDontSave };
            material.SetColor("_BaseColor", color);
            stage.temporary.Add(material);
            return material;
        }

        static GameObject AddMesh(Stage stage, PrimitiveType type, Material material, Vector3 position, float scale)
        {
            GameObject go = GameObject.CreatePrimitive(type);
            SceneManager.MoveGameObjectToScene(go, stage.scene);
            go.hideFlags = HideFlags.HideAndDontSave;
            go.transform.position = position;
            go.transform.localScale = Vector3.one * scale;
            var meshRenderer = go.GetComponent<MeshRenderer>();
            meshRenderer.sharedMaterial = material;
            stage.renderers.Add(meshRenderer);
            return go;
        }

        // 프리뷰 씬에는 환경광이 없어 물체별로 고정된 값을 넣는다. 이 값은 웹 무대의 환경광과 같다.
        static void ApplyAmbient(Stage stage)
        {
            var sh = new SphericalHarmonicsL2();
            sh.AddAmbientLight(Ambient.linear);
            var coefficients = new[] { sh };
            foreach (Renderer r in stage.renderers)
            {
                r.lightProbeUsage = LightProbeUsage.CustomProvided;
                var block = new MaterialPropertyBlock();
                block.CopySHCoefficientArraysFrom(coefficients);
                r.SetPropertyBlock(block);
            }
        }

        static GameObject NewObject(Stage stage, string name)
        {
            var go = new GameObject(name) { hideFlags = HideFlags.HideAndDontSave };
            SceneManager.MoveGameObjectToScene(go, stage.scene);
            return go;
        }

        // 화면이 통째로 까맣거나 단색인 실패를 잡기 위한 수치.
        static void Measure(Texture2D texture, out float meanLuma, out float distinctRatio)
        {
            Color32[] pixels = texture.GetPixels32();
            long sum = 0;
            var seen = new HashSet<int>();
            for (int i = 0; i < pixels.Length; i += 7)
            {
                Color32 p = pixels[i];
                sum += p.r + p.g + p.b;
                seen.Add((p.r >> 2) << 12 | (p.g >> 2) << 6 | (p.b >> 2));
            }
            int samples = (pixels.Length + 6) / 7;
            meanLuma = sum / (3f * 255f * samples);
            distinctRatio = seen.Count / (float)samples;
        }
    }
}
