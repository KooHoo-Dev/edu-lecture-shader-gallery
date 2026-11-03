// Overlay 캔버스 확인용 플레이어를 만든다. tools/verify/overlay-ui.mjs 가 Unity 복사본의 Assets/SgPlayerCheck/Editor 에 넣고
// 배치 모드로 SgOverlayBuild.Build 를 부른다. 씬과 머티리얼도 복사본에만 만든다.
// 장면은 촬영 무대(SgCapture)와 같은 카메라·광원·소품이고, 그 앞에 ui-backdrop-blur 패널 하나를 둔다.
using System;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
using UnityEngine.UI;

namespace ShaderGallery.PlayerCheck
{
    public static class SgOverlayBuild
    {
        const string Folder = "Assets/SgPlayerCheck";

        public static void Build()
        {
            int code = 1;
            try
            {
                string output = Arg("-sgBuild");
                string scenePath = MakeScene();
                PlayerSettings.fullScreenMode = FullScreenMode.Windowed;
                PlayerSettings.defaultScreenWidth = 1280;
                PlayerSettings.defaultScreenHeight = 720;
                PlayerSettings.resizableWindow = false;
                // 창이 포커스를 잃어도 계속 그려야 찍힌다
                PlayerSettings.runInBackground = true;
                BuildReport report = BuildPipeline.BuildPlayer(new BuildPlayerOptions
                {
                    scenes = new[] { scenePath },
                    locationPathName = output,
                    target = BuildTarget.StandaloneWindows64,
                    options = BuildOptions.None,
                });
                Debug.Log("[SgOverlayBuild] " + report.summary.result);
                code = report.summary.result == BuildResult.Succeeded ? 0 : 1;
            }
            catch (Exception e)
            {
                Debug.LogError("[SgOverlayBuild] " + e);
            }
            EditorApplication.Exit(code);
        }

        static string MakeScene()
        {
            EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            RenderSettings.ambientMode = AmbientMode.Flat;
            RenderSettings.ambientLight = new Color(0.34f, 0.38f, 0.46f);

            var cameraObject = new GameObject("Main Camera") { tag = "MainCamera" };
            var camera = cameraObject.AddComponent<Camera>();
            camera.clearFlags = CameraClearFlags.SolidColor;
            camera.backgroundColor = new Color(0.035f, 0.04f, 0.055f, 1f);
            camera.fieldOfView = 40f;
            camera.nearClipPlane = 0.1f;
            camera.farClipPlane = 100f;
            cameraObject.transform.position = new Vector3(0f, 1.3f, -3.6f);
            cameraObject.transform.LookAt(new Vector3(0f, 0.75f, 0f));
            var cameraData = cameraObject.AddComponent<UniversalAdditionalCameraData>();
            cameraData.renderPostProcessing = false;
            // 수강생 설정과 같게 파이프라인 설정을 따른다. 이 프로젝트의 PC URP Asset 은 Opaque Texture 가 켜져 있다
            cameraData.requiresColorOption = CameraOverrideOption.UsePipelineSettings;

            var lightObject = new GameObject("Light");
            var light = lightObject.AddComponent<Light>();
            light.type = LightType.Directional;
            light.intensity = 1.2f;
            light.shadows = LightShadows.Soft;
            lightObject.transform.rotation = Quaternion.Euler(50f, -30f, 0f);

            Primitive(PrimitiveType.Plane, Lit("Floor", new Color(0.2f, 0.22f, 0.25f)), Vector3.zero, new Vector3(0.6f, 1f, 0.6f), 0f);
            Primitive(PrimitiveType.Cube, Lit("Box", new Color(0.72f, 0.62f, 0.46f)), new Vector3(0.95f, 0.4f, 0.3f), Vector3.one * 0.8f, 28f);
            Primitive(PrimitiveType.Sphere, Lit("Ball", new Color(0.34f, 0.5f, 0.66f)), new Vector3(-1.1f, 0.45f, 0.5f), Vector3.one * 0.9f, 0f);
            Primitive(PrimitiveType.Sphere, Lit("Center", new Color(0.62f, 0.68f, 0.76f)), new Vector3(0f, 0.75f, 0f), Vector3.one * 1.5f, 0f);

            var canvasObject = new GameObject("Canvas");
            var canvas = canvasObject.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            var scaler = canvasObject.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1280f, 720f);

            var panelObject = new GameObject("Panel");
            panelObject.transform.SetParent(canvasObject.transform, false);
            var rect = panelObject.AddComponent<RectTransform>();
            rect.sizeDelta = new Vector2(560f, 320f);
            rect.anchoredPosition = new Vector2(-170f, -40f);
            var image = panelObject.AddComponent<Image>();
            var blur = new Material(Shader.Find("ShaderGallery/UiBackdropBlur"));
            AssetDatabase.CreateAsset(blur, Folder + "/Blur.mat");
            image.material = blur;

            var check = new GameObject("Check").AddComponent<SgOverlayCheck>();
            check.canvas = canvas;
            check.sceneCamera = camera;

            string path = Folder + "/OverlayCheck.unity";
            EditorSceneManager.SaveScene(EditorSceneManager.GetActiveScene(), path);
            return path;
        }

        static Material Lit(string name, Color color)
        {
            var material = new Material(Shader.Find("Universal Render Pipeline/Simple Lit"));
            material.SetColor("_BaseColor", color);
            AssetDatabase.CreateAsset(material, Folder + "/" + name + ".mat");
            return material;
        }

        static void Primitive(PrimitiveType type, Material material, Vector3 position, Vector3 scale, float yaw)
        {
            GameObject go = GameObject.CreatePrimitive(type);
            go.GetComponent<Renderer>().sharedMaterial = material;
            go.transform.position = position;
            go.transform.localScale = scale;
            go.transform.rotation = Quaternion.Euler(0f, yaw, 0f);
        }

        static string Arg(string name)
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
