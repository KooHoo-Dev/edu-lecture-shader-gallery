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
    public class SgLayer
    {
        public float x;
        public float y;
        // 본체 값 위에 덮어쓰는 값
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
        // stage.backlit: 해를 카메라 맞은편 낮은 곳에 둔다
        public bool backlit;
        // stage.ui: 스프라이트 대신 Screen Space - Camera 캔버스의 Image 로 찍는다. uiAspect 는 Image 의 폭 / 높이
        public bool ui;
        public float uiAspect = 1f;
        // stage.layers: 본체 뒤에 더 그리는 스프라이트 층. 앞에 적은 것이 가장 멀다
        public List<SgLayer> layers = new List<SgLayer>();
        // stage.shadowProp: 물체와 해 사이에 그림자를 드리우는 공
        public bool shadowProp;
        // stage.tilt: 물체를 Z 축으로 눕히는 각도 (도)
        public float tilt;
        // stage.bright: 전체 화면 무대의 하늘색 배경과 밝은 바닥
        public bool bright;
        // meta.requires: depth, opaque, normals
        public List<string> requires = new List<string>();
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
        // 촬영 검증 변형. 비우면 렌더러 에셋 그대로 찍는다. "disabled", "auto", "forced"
        public string depthPriming = "";
        // 촬영 검증 변형. 0 이면 URP Asset 의 MSAA 그대로, 1·2·4·8 이면 그 값으로 잠시 바꾼다.
        // URP 는 URP Asset 의 MSAA 가 1 이면 렌더 타깃의 MSAA 와 상관없이 MSAA 없이 그린다. Depth Priming 은 MSAA 가 켜지면 쓰이지 않는다
        public int msaa;
        // 촬영 검증 변형. 비우면 렌더러 그대로. "forward", "forward-plus", "deferred", "deferred-plus"
        public string renderingPath = "";
        // 촬영 검증 변형 (stage.ui). "rect" 면 RectMask2D, "mask" 면 Mask 안에 Image 를 넣는다. 마스크는 Image 의 가운데 70% 다
        public string uiMask = "";
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
