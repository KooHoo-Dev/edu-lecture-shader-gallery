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
using UnityEngine.UI;

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
        // stage.bright (fullscreen): 하늘색 배경과 밝은 바닥. web/src/stage/layout.ts 와 같은 값
        static readonly Color BrightBackground = new Color(0.55f, 0.66f, 0.8f, 1f);
        static readonly Color BrightFloorA = new Color(0.62f, 0.64f, 0.66f, 1f);
        static readonly Color BrightFloorB = new Color(0.52f, 0.55f, 0.58f, 1f);
        static readonly Vector3 LightEuler = new Vector3(50f, -30f, 0f);
        // stage.backlit: 카메라 맞은편 낮은 해. 웹 layout.ts 의 backlightDirUnity 와 같다.
        static readonly Vector3 BacklightEuler = new Vector3(15f, 180f, 0f);

        class Stage
        {
            public Scene scene;
            public Camera camera;
            public readonly List<Object> temporary = new List<Object>();
            public readonly List<Renderer> renderers = new List<Renderer>();
        }

        public static SgShot Shoot(SgJob job, SgJobSpecimen specimen, SgCaptureState state, string file)
        {
            int width = job.width;
            int height = job.height;
            Shader shader = AssetDatabase.LoadAssetAtPath<Shader>(specimen.shader);
            var material = new Material(shader) { hideFlags = HideFlags.HideAndDontSave };
            // UI 셰이더의 ZTest [unity_GUIZTestMode] 는 캔버스가 넣는 값이다. 캔버스 없이 찍으므로 기본 깊이 비교로 고정한다
            material.SetFloat("unity_GUIZTestMode", (float)CompareFunction.LessEqual);
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

            Stage stage = Build(job, specimen, material);
            // URP Asset 의 MSAA 가 2 이상일 때만 이 값이 쓰인다
            var renderTexture = new RenderTexture(width, height, 24, GraphicsFormat.R8G8B8A8_SRGB) { antiAliasing = job.msaa > 0 ? job.msaa : 4 };
            Texture2D read = null;
            FullScreenPassRendererFeature feature = null;
            ScriptableRendererData rendererData = null;
            var pipeline = (UniversalRenderPipelineAsset)GraphicsSettings.currentRenderPipeline;
            var primingData = (UniversalRendererData)pipeline.rendererDataList[0];
            DepthPrimingMode primingBefore = primingData.depthPrimingMode;
            RenderingMode pathBefore = primingData.renderingMode;
            int msaaBefore = pipeline.msaaSampleCount;
            try
            {
                // 촬영 검증 변형: 에셋을 메모리에서만 잠시 바꾼다. 디스크에는 저장하지 않고 촬영 뒤 되돌린다
                if (!string.IsNullOrEmpty(job.depthPriming))
                {
                    primingData.depthPrimingMode = ParsePriming(job.depthPriming);
                    primingData.SetDirty();
                }
                if (!string.IsNullOrEmpty(job.renderingPath))
                {
                    primingData.renderingMode = ParseRenderingPath(job.renderingPath);
                    primingData.SetDirty();
                }
                if (job.msaa > 0)
                {
                    pipeline.msaaSampleCount = job.msaa;
                }
                if (specimen.stage == "fullscreen")
                {
                    feature = AddFullScreenFeature(material, specimen.requires, out rendererData);
                }

                stage.camera.targetTexture = renderTexture;
                // 캔버스(stage.ui)는 렌더 전에 정점을 만들어 둬야 그려진다
                Canvas.ForceUpdateCanvases();
                stage.camera.Render();

                RenderTexture previous = RenderTexture.active;
                RenderTexture.active = renderTexture;
                // 화면 사진이므로 알파는 버린다. 알파 혼합 물체는 렌더 타깃의 알파까지 섞어(SrcAlpha OneMinusSrcAlpha) 1 보다 작게 남기고,
                // 그대로 PNG 에 넣으면 밝은 페이지 위에서 사진이 바래 보인다 (water-wave-surface 에서 발견, 2026-11-03).
                read = new Texture2D(width, height, TextureFormat.RGB24, false);
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
                if (primingData.depthPrimingMode != primingBefore || primingData.renderingMode != pathBefore)
                {
                    primingData.depthPrimingMode = primingBefore;
                    primingData.renderingMode = pathBefore;
                    primingData.SetDirty();
                }
                if (pipeline.msaaSampleCount != msaaBefore)
                {
                    pipeline.msaaSampleCount = msaaBefore;
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
        static FullScreenPassRendererFeature AddFullScreenFeature(Material material, List<string> requires, out ScriptableRendererData rendererData)
        {
            var pipeline = (UniversalRenderPipelineAsset)GraphicsSettings.currentRenderPipeline;
            rendererData = pipeline.rendererDataList[0];
            var feature = ScriptableObject.CreateInstance<FullScreenPassRendererFeature>();
            feature.hideFlags = HideFlags.HideAndDontSave;
            feature.name = "ShaderGalleryCapture";
            feature.passMaterial = material;
            feature.injectionPoint = FullScreenPassRendererFeature.InjectionPoint.BeforeRenderingPostProcessing;
            feature.fetchColorBuffer = true;
            // 메타의 requires 를 Requirements 로 옮긴다. 수강생도 같은 칸을 켠다
            var input = ScriptableRenderPassInput.None;
            if (requires.Contains("depth")) input |= ScriptableRenderPassInput.Depth;
            if (requires.Contains("normals")) input |= ScriptableRenderPassInput.Normal;
            feature.requirements = input;
            feature.Create();
            rendererData.rendererFeatures.Add(feature);
            rendererData.SetDirty();
            return feature;
        }

        static RenderingMode ParseRenderingPath(string path)
        {
            return path switch
            {
                "forward" => RenderingMode.Forward,
                "forward-plus" => RenderingMode.ForwardPlus,
                "deferred" => RenderingMode.Deferred,
                "deferred-plus" => RenderingMode.DeferredPlus,
                _ => throw new System.ArgumentException("renderingPath 는 forward, forward-plus, deferred, deferred-plus 중 하나다: " + path),
            };
        }

        static DepthPrimingMode ParsePriming(string mode)
        {
            return mode switch
            {
                "auto" => DepthPrimingMode.Auto,
                "forced" => DepthPrimingMode.Forced,
                "disabled" => DepthPrimingMode.Disabled,
                _ => throw new System.ArgumentException("depthPriming 은 disabled, auto, forced 중 하나다: " + mode),
            };
        }

        // 표본 폴더의 텍스처를 메타 데이터에 적힌 설정으로 불러온다. 설정이 다르면 .meta 를 고친다.
        // 데이터 텍스처(linear)와 포인트 텍스처(팔레트, 인덱스)는 압축하면 값이 바뀌므로 압축하지 않는다.
        // 포인트 텍스처는 밉맵도 끈다. 작은 단계에서 이웃 칸이 섞이면 번호가 틀어진다.
        static Texture2D LoadTexture(SgTextureValue t)
        {
            var importer = (TextureImporter)AssetImporter.GetAtPath(t.path);
            bool srgb = !t.linear;
            TextureWrapMode wrap = t.repeat ? TextureWrapMode.Repeat : TextureWrapMode.Clamp;
            FilterMode filter = t.point ? FilterMode.Point : FilterMode.Bilinear;
            TextureImporterCompression compression = t.linear || t.point ? TextureImporterCompression.Uncompressed : TextureImporterCompression.Compressed;
            bool mipmaps = !t.point;
            if (importer.sRGBTexture != srgb || importer.wrapMode != wrap || importer.filterMode != filter
                || importer.textureCompression != compression || importer.mipmapEnabled != mipmaps)
            {
                importer.sRGBTexture = srgb;
                importer.wrapMode = wrap;
                importer.filterMode = filter;
                importer.textureCompression = compression;
                importer.mipmapEnabled = mipmaps;
                importer.SaveAndReimport();
            }
            return AssetDatabase.LoadAssetAtPath<Texture2D>(t.path);
        }

        static Stage Build(SgJob job, SgJobSpecimen specimen, Material material)
        {
            var stage = new Stage { scene = EditorSceneManager.NewPreviewScene() };

            var cameraObject = NewObject(stage, "Camera");
            stage.camera = cameraObject.AddComponent<Camera>();
            stage.camera.scene = stage.scene;
            stage.camera.clearFlags = CameraClearFlags.SolidColor;
            stage.camera.backgroundColor = specimen.stage == "fullscreen" && specimen.bright ? BrightBackground : Background;
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
            lightObject.transform.rotation = Quaternion.Euler(specimen.backlit ? BacklightEuler : LightEuler);

            switch (specimen.stage)
            {
                case "sprite":
                    BuildSprite(stage, specimen, material, job.uiMask);
                    break;
                case "depth":
                    BuildPerspective(stage);
                    AddFloor(stage);
                    AddProps(stage);
                    PlaceEffectMesh(stage, specimen.mesh, material, true);
                    if (specimen.occluder)
                    {
                        AddWall(stage);
                    }
                    break;
                case "fullscreen":
                    BuildPerspective(stage);
                    AddFloor(stage, specimen.bright);
                    AddProps(stage);
                    AddMesh(stage, "New-Sphere.fbx", LitMaterial(stage, new Color(0.62f, 0.68f, 0.76f)), new Vector3(0f, 0.75f, 0f), 1.5f);
                    break;
                default:
                    BuildPerspective(stage);
                    AddFloor(stage);
                    GameObject effect = PlaceEffectMesh(stage, specimen.mesh, material, false);
                    if (specimen.tilt != 0f)
                    {
                        // 웹과 같다: Z 로 눕힌 뒤 월드 Y 로 돈다 (Euler 는 Z, X, Y 순서로 돌린다)
                        effect.transform.rotation = Quaternion.Euler(0f, effect.transform.eulerAngles.y, specimen.tilt);
                    }
                    if (specimen.shadowProp)
                    {
                        AddShadowProp(stage, effect.transform.position);
                    }
                    if (specimen.occluder)
                    {
                        AddWall(stage);
                    }
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

        static void BuildSprite(Stage stage, SgJobSpecimen specimen, Material material, string uiMask)
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

            if (specimen.ui)
            {
                BuildCanvas(stage, specimen, material, sprite, uiMask);
                return;
            }

            var spriteObject = NewObject(stage, "Sprite");
            var spriteRenderer = spriteObject.AddComponent<SpriteRenderer>();
            spriteRenderer.sprite = sprite;
            spriteRenderer.sharedMaterial = material;

            // stage.layers: 같은 스프라이트를 값만 바꾼 머티리얼 복사본으로 뒤에 더 그린다. 앞에 적은 층이 가장 멀다
            for (int k = 0; k < specimen.layers.Count; k++)
            {
                SgLayer layer = specimen.layers[k];
                var layerMaterial = new Material(material) { hideFlags = HideFlags.HideAndDontSave };
                foreach (SgFloatValue f in layer.floats)
                {
                    layerMaterial.SetFloat(f.k, f.v);
                }
                foreach (SgColorValue c in layer.colors)
                {
                    layerMaterial.SetColor(c.k, new Color(c.r, c.g, c.b, c.a));
                }
                stage.temporary.Add(layerMaterial);
                var layerObject = NewObject(stage, "Layer" + k);
                layerObject.transform.position = new Vector3(layer.x, layer.y, 0f);
                var layerRenderer = layerObject.AddComponent<SpriteRenderer>();
                layerRenderer.sprite = sprite;
                layerRenderer.sharedMaterial = layerMaterial;
                layerRenderer.sortingOrder = k - specimen.layers.Count;
            }
        }

        // stage.ui: 수강생이 쓰는 경로와 같게 Screen Space - Camera 캔버스의 Image 로 찍는다.
        // 캔버스가 정점 색, unity_GUIZTestMode, 마스크 머티리얼 복사본을 넣는다. Image 는 Source Image 비와 상관없이 사각형에 맞춰 늘어난다.
        // 크기는 웹 무대(ShaderStage.uiScale)와 같다: 높이 2 유닛(화면 높이 3 유닛 중), 폭은 4.6 유닛 안.
        static void BuildCanvas(Stage stage, SgJobSpecimen specimen, Material material, Sprite sprite, string uiMask)
        {
            const float PixelsPerUnit = 720f / 3f;
            float aspect = specimen.uiAspect > 0f ? specimen.uiAspect : 1f;
            float heightUnits = Mathf.Min(2f, 4.6f / aspect);
            var size = new Vector2(heightUnits * aspect, heightUnits) * PixelsPerUnit;

            var canvasObject = NewObject(stage, "Canvas");
            var canvas = canvasObject.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceCamera;
            canvas.worldCamera = stage.camera;
            canvas.planeDistance = 1f;
            var scaler = canvasObject.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1280f, 720f);
            scaler.matchWidthOrHeight = 1f;

            Transform parent = canvasObject.transform;
            if (!string.IsNullOrEmpty(uiMask))
            {
                // 촬영 검증 변형: Image 의 가운데 70% 만 보이게 자른다. RectMask2D 는 UNITY_UI_CLIP_RECT, Mask 는 스텐실과 UNITY_UI_ALPHACLIP 을 쓴다
                GameObject maskObject = NewUiObject(stage, "Mask", parent, size * 0.7f);
                if (uiMask == "rect")
                {
                    maskObject.AddComponent<RectMask2D>();
                }
                else
                {
                    maskObject.AddComponent<Image>();
                    maskObject.AddComponent<Mask>().showMaskGraphic = false;
                }
                parent = maskObject.transform;
            }

            GameObject imageObject = NewUiObject(stage, "Image", parent, size);
            var image = imageObject.AddComponent<Image>();
            image.sprite = sprite;
            image.material = material;
        }

        static GameObject NewUiObject(Stage stage, string name, Transform parent, Vector2 size)
        {
            GameObject go = NewObject(stage, name);
            var rect = go.AddComponent<RectTransform>();
            rect.SetParent(parent, false);
            rect.sizeDelta = size;
            return go;
        }

        // web/src/stage/layout.ts 의 meshPlacement, depthPlacement 와 같은 값.
        static GameObject PlaceEffectMesh(Stage stage, string mesh, Material material, bool depth)
        {
            GameObject go;
            switch (mesh)
            {
                case "capsule":
                    go = AddMesh(stage, "New-Capsule.fbx", material, new Vector3(0f, depth ? 0.6f : 0.8f, 0f), depth ? 1.4f : 0.8f);
                    break;
                case "cylinder":
                    go = AddMesh(stage, "New-Cylinder.fbx", material, new Vector3(0f, depth ? 0.6f : 0.8f, 0f), depth ? 1.4f : 0.8f);
                    break;
                case "cube":
                    go = AddMesh(stage, "Cube.fbx", material, new Vector3(0f, depth ? 0.5f : 0.75f, 0f), depth ? 1.6f : 1.2f);
                    break;
                case "quad":
                    go = AddMesh(stage, "Quad.fbx", material, new Vector3(0f, depth ? 0.95f : 0.85f, 0f), 1.6f);
                    break;
                case "plane":
                    go = AddMesh(stage, "New-Plane.fbx", material, new Vector3(0f, depth ? 0.3f : 0.5f, 0f), depth ? 0.35f : 0.3f);
                    break;
                case "grass":
                    // 내장 메시가 아니라 SgGrass 가 만든다. 뿌리가 y = 0 이라 바닥에 둔다.
                    Mesh grass = SgGrass.Build();
                    stage.temporary.Add(grass);
                    go = AddMesh(stage, "SgGrass", grass, material, Vector3.zero, depth ? 1.4f : 1.6f);
                    break;
                case "torus":
                    // 내장 메시가 아니라 SgTorus 가 만든다. 볼록하지 않은 메시 시험용 고리
                    Mesh torus = SgTorus.Build();
                    stage.temporary.Add(torus);
                    go = AddMesh(stage, "SgTorus", torus, material, new Vector3(0f, depth ? 0.55f : 0.85f, 0f), depth ? 2.2f : 1.5f);
                    break;
                case "grid":
                    // 내장 메시가 아니라 SgGrid 가 만든다. 10 m 넓이로 화면 아래쪽을 호수처럼 덮는다.
                    Mesh grid = SgGrid.Build();
                    stage.temporary.Add(grid);
                    go = AddMesh(stage, "SgGrid", grid, material, new Vector3(0f, 0.3f, 0f), 1f);
                    break;
                default:
                    go = AddMesh(stage, "New-Sphere.fbx", material, new Vector3(0f, depth ? 0.55f : 0.85f, 0f), depth ? 2.2f : 1.5f);
                    break;
            }
            // 시작 회전. 웹 layout.ts 의 meshYawDeg 와 같다. 정면만 찍으면 큐브 같은 물체의 효과가 썸네일에 드러나지 않는다.
            // 웹의 depth 무대 물체와 quad, plane, grass, grid 는 돌지 않으므로 여기서도 돌리지 않는다.
            // grass 는 바람 같은 월드 방향 효과를 위해 오브젝트 공간과 월드 공간의 방향을 같게 둔다.
            if (!depth && mesh != "quad" && mesh != "plane" && mesh != "grass" && mesh != "grid")
            {
                go.transform.rotation = Quaternion.Euler(0f, MeshYawDeg, 0f);
            }
            return go;
        }

        // stage.shadowProp: 물체 가운데에서 해 쪽으로 띄운 공. web/src/stage/layout.ts 의 shadowProp 과 같은 값
        static readonly Vector3 ShadowPropOffset = new Vector3(-0.05f, 0.85f, -0.62f);
        static readonly Color ShadowPropColor = new Color(0.66f, 0.6f, 0.52f, 1f);

        static void AddShadowProp(Stage stage, Vector3 center)
        {
            AddMesh(stage, "New-Sphere.fbx", LitMaterial(stage, ShadowPropColor), center + ShadowPropOffset, 0.36f);
        }

        const float MeshYawDeg = 30f;

        static void AddFloor(Stage stage, bool bright = false)
        {
            var texture = new Texture2D(8, 8, TextureFormat.RGBA32, false, false) { filterMode = FilterMode.Point, wrapMode = TextureWrapMode.Repeat, hideFlags = HideFlags.HideAndDontSave };
            for (int y = 0; y < 8; y++)
            {
                for (int x = 0; x < 8; x++)
                {
                    texture.SetPixel(x, y, (x + y) % 2 == 0 ? (bright ? BrightFloorA : FloorA) : (bright ? BrightFloorB : FloorB));
                }
            }
            texture.Apply();
            stage.temporary.Add(texture);

            Material floor = LitMaterial(stage, Color.white);
            floor.SetTexture("_BaseMap", texture);
            floor.SetTextureScale("_BaseMap", new Vector2(4f, 4f));

            GameObject plane = AddMesh(stage, "New-Plane.fbx", floor, Vector3.zero, 1f);
            plane.transform.localScale = new Vector3(1.6f, 1f, 1.6f);
        }

        static void AddProps(Stage stage)
        {
            GameObject box = AddMesh(stage, "Cube.fbx", LitMaterial(stage, PropColor), new Vector3(0.95f, 0.4f, 0.3f), 0.8f);
            box.transform.rotation = Quaternion.Euler(0f, 28f, 0f);
            AddMesh(stage, "New-Sphere.fbx", LitMaterial(stage, PropColor2), new Vector3(-1.1f, 0.45f, 0.5f), 0.9f);
        }

        // stage.occluded 의 벽. 카메라와 물체 사이에서 물체의 왼쪽 아래를 가린다. web/src/stage/layout.ts 의 wall 과 같은 값.
        static void AddWall(Stage stage)
        {
            GameObject wall = AddMesh(stage, "Cube.fbx", LitMaterial(stage, PropColor), new Vector3(-0.525f, 0.55f, -0.9f), 1f);
            wall.transform.localScale = new Vector3(1.15f, 1.1f, 0.1f);
        }

        static Material LitMaterial(Stage stage, Color color)
        {
            // 웹 무대와 맞추려고 반사가 없는 Simple Lit 을 쓴다. 웹은 같은 값의 Lambert 로 그린다.
            var material = new Material(Shader.Find("Universal Render Pipeline/Simple Lit")) { hideFlags = HideFlags.HideAndDontSave };
            material.SetColor("_BaseColor", color);
            stage.temporary.Add(material);
            return material;
        }

        static GameObject AddMesh(Stage stage, string builtinMesh, Material material, Vector3 position, float scale)
        {
            return AddMesh(stage, builtinMesh, Resources.GetBuiltinResource<Mesh>(builtinMesh), material, position, scale);
        }

        static GameObject AddMesh(Stage stage, string name, Mesh sharedMesh, Material material, Vector3 position, float scale)
        {
            GameObject go = NewObject(stage, name);
            go.AddComponent<MeshFilter>().sharedMesh = sharedMesh;
            var meshRenderer = go.AddComponent<MeshRenderer>();
            meshRenderer.sharedMaterial = material;
            go.transform.position = position;
            go.transform.localScale = Vector3.one * scale;
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

        // 태어날 때부터 숨김 플래그를 달아 열린 씬을 건드리지 않는다. 이런 물체는 씬을 닫아도 남으므로 직접 지운다.
        static GameObject NewObject(Stage stage, string name)
        {
            GameObject go = EditorUtility.CreateGameObjectWithHideFlags(name, HideFlags.HideAndDontSave);
            SceneManager.MoveGameObjectToScene(go, stage.scene);
            stage.temporary.Add(go);
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
