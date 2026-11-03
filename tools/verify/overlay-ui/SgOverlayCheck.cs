// 플레이어 빌드 안에서 화면을 찍는다. tools/verify/overlay-ui.mjs 가 Unity 복사본에만 넣는다 (리포의 Assets 에는 없다).
// 같은 패널을 Screen Space - Overlay, Screen Space - Camera 캔버스로 차례로 찍고, 패널 없는 화면도 찍어 비교 기준으로 남긴다.
using System;
using System.Collections;
using System.IO;
using UnityEngine;
using UnityEngine.Rendering;

namespace ShaderGallery.PlayerCheck
{
    public class SgOverlayCheck : MonoBehaviour
    {
        public Canvas canvas;
        public Camera sceneCamera;

        IEnumerator Start()
        {
            string dir = Arg("-sgOut");
            Directory.CreateDirectory(dir);
            var log = new StringWriter();
            log.WriteLine($"Unity {Application.unityVersion} · {SystemInfo.graphicsDeviceType} · {GraphicsSettings.currentRenderPipeline?.name} · 화면 {Screen.width}x{Screen.height}");

            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            yield return Shot(dir, "overlay", log);

            canvas.renderMode = RenderMode.ScreenSpaceCamera;
            canvas.worldCamera = sceneCamera;
            canvas.planeDistance = 1f;
            yield return Shot(dir, "camera", log);

            canvas.enabled = false;
            yield return Shot(dir, "none", log);

            File.WriteAllText(Path.Combine(dir, "player.txt"), log.ToString());
            Application.Quit();
        }

        // 몇 프레임 기다려 캔버스 모드 변경과 셰이더 준비가 끝난 화면을 찍는다. 백버퍼 그대로라 Overlay UI 까지 들어간다.
        static IEnumerator Shot(string dir, string name, StringWriter log)
        {
            for (int i = 0; i < 30; i++)
            {
                yield return null;
            }
            yield return new WaitForEndOfFrame();
            Texture2D texture = ScreenCapture.CaptureScreenshotAsTexture();
            File.WriteAllBytes(Path.Combine(dir, name + ".png"), texture.EncodeToPNG());
            log.WriteLine($"{name}: {texture.width}x{texture.height}");
            Destroy(texture);
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
