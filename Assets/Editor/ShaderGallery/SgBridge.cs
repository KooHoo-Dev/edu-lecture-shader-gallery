// 열린 에디터용 입구. Unity 가 프로젝트를 열고 있으면 배치 모드를 같은 폴더로 실행할 수 없어서,
// Temp/ShaderGalleryBridge/command.json 을 감시하다가 나타나면 SgVerify.Run 을 대신 호출한다.
using System;
using System.IO;
using UnityEditor;
using UnityEngine;

namespace ShaderGallery.EditorTools
{
    [InitializeOnLoad]
    public static class SgBridge
    {
        const string Folder = "Temp/ShaderGalleryBridge";
        const string CommandFile = Folder + "/command.json";
        const string DoneFile = Folder + "/done.json";
        const string RunningFile = Folder + "/running.txt";
        const string HeartbeatFile = Folder + "/heartbeat.txt";
        const double PollSeconds = 0.5;

        [Serializable]
        class Command
        {
            public string id;
            public string job;
        }

        [Serializable]
        class Done
        {
            public string id;
            public bool ok;
            public string error;
        }

        static double nextPoll;

        static SgBridge()
        {
            EditorApplication.update -= Poll;
            EditorApplication.update += Poll;
            // 이전 실행이 도중에 끊겼으면 표시를 지운다.
            if (File.Exists(RunningFile))
            {
                File.Delete(RunningFile);
            }
        }

        static void Poll()
        {
            if (EditorApplication.timeSinceStartup < nextPoll)
            {
                return;
            }
            nextPoll = EditorApplication.timeSinceStartup + PollSeconds;

            // Play 모드에서는 명령을 받을 수 없으므로 살아 있다고 알리지 않는다. 도구가 복사본으로 넘어간다.
            if (EditorApplication.isPlayingOrWillChangePlaymode)
            {
                return;
            }

            Directory.CreateDirectory(Folder);
            File.WriteAllText(HeartbeatFile, DateTime.Now.ToString("o"));

            if (!File.Exists(CommandFile) || EditorApplication.isCompiling || EditorApplication.isUpdating)
            {
                return;
            }

            // 새 C# 이 있으면 도메인 리로드가 뒤따른다. 명령을 남겨 두고 리로드 뒤 다음 폴링에서 실행한다.
            AssetDatabase.Refresh(ImportAssetOptions.ForceSynchronousImport);
            if (EditorApplication.isCompiling || EditorApplication.isUpdating)
            {
                return;
            }

            Command command = JsonUtility.FromJson<Command>(File.ReadAllText(CommandFile));
            File.Delete(CommandFile);
            File.WriteAllText(RunningFile, command.id);

            var done = new Done { id = command.id };
            try
            {
                done.ok = SgVerify.Run(command.job, "editor").ok;
            }
            catch (Exception e)
            {
                done.ok = false;
                done.error = e.ToString();
            }
            File.WriteAllText(DoneFile, JsonUtility.ToJson(done, true));
            File.Delete(RunningFile);
        }
    }
}
