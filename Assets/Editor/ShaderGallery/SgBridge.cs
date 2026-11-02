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
        }

        static void Poll()
        {
            if (EditorApplication.timeSinceStartup < nextPoll)
            {
                return;
            }
            nextPoll = EditorApplication.timeSinceStartup + PollSeconds;

            Directory.CreateDirectory(Folder);
            File.WriteAllText(HeartbeatFile, DateTime.Now.ToString("o"));

            if (!File.Exists(CommandFile) || EditorApplication.isCompiling || EditorApplication.isUpdating || EditorApplication.isPlayingOrWillChangePlaymode)
            {
                return;
            }

            Command command = JsonUtility.FromJson<Command>(File.ReadAllText(CommandFile));
            File.Delete(CommandFile);

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
        }
    }
}
