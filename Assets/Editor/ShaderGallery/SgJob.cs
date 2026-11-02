// 검증·촬영 잡 파일과 결과 파일의 형식. tools/unity-job.mjs 가 잡을 만들고 tools/unity.mjs 가 결과를 읽는다.
using System;
using System.Collections.Generic;

namespace ShaderGallery.EditorTools
{
    [Serializable]
    public class SgFloatValue
    {
        public string k;
        public float v;
    }

    [Serializable]
    public class SgColorValue
    {
        public string k;
        public float r;
        public float g;
        public float b;
        public float a = 1f;
    }

    [Serializable]
    public class SgTextureValue
    {
        public string k;
        public string path;
        public bool linear;
        public bool repeat;
        public bool point;
    }

    [Serializable]
    public class SgCaptureState
    {
        public string name;
        public List<SgFloatValue> floats = new List<SgFloatValue>();
        public List<SgColorValue> colors = new List<SgColorValue>();
    }

    [Serializable]
    public class SgJobSpecimen
    {
        public string id;
        public string shader;
        public string stage;
        public string mesh;
        // stage.occluded: 물체 앞에 벽을 세운다
        public bool occluder;
        public List<SgTextureValue> textures = new List<SgTextureValue>();
        public List<SgCaptureState> states = new List<SgCaptureState>();
    }

    [Serializable]
    public class SgJob
    {
        public string outDir;
        public int width = 1280;
        public int height = 720;
        public bool capture = true;
        public List<SgJobSpecimen> specimens = new List<SgJobSpecimen>();
    }

    [Serializable]
    public class SgMessage
    {
        public string severity;
        public string where;
        public string message;
        public string file;
        public int line;
    }

    [Serializable]
    public class SgShot
    {
        public string name;
        public string file;
        public int width;
        public int height;
        public float meanLuma;
        public float distinctRatio;
    }

    [Serializable]
    public class SgSpecimenResult
    {
        public string id;
        public bool compileOk;
        public int variantsCompiled;
        public List<SgMessage> messages = new List<SgMessage>();
        public List<SgShot> shots = new List<SgShot>();
    }

    [Serializable]
    public class SgResult
    {
        public bool ok;
        public string mode;
        public string unityVersion;
        public string graphicsDevice;
        public string pipeline;
        public string finishedAt;
        public string fatal;
        public List<SgSpecimenResult> specimens = new List<SgSpecimenResult>();
    }
}
