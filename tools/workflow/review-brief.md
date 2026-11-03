# Specimen review brief (shared by all reviewers)

You review new specimens for the Shader Gallery project: Unity 6000.3 / URP 17.3 HLSL shaders with a WebGL2 preview app. A worker model wrote each specimen from a task file. Do a critical code and content review. Write the report in Korean.

## Files (read only)

- Each specimen has a review folder `C:\Users\user\shader-gallery\_review\<id>\` (made by `tools/workflow/prepare-review.sh`):
  - `task.md`: the task the worker received.
  - `code/`: core.hlsl, the .shader wrapper, C# if any, meta.ts, generated PNG textures if any.
  - `unity-shots/`: real Unity captures (webp). `web-shots/`: web preview captures (final, off = "effect off" mode, step1..stepN), all frozen at stage time 1.3 s with the link query `t=1.3` (shows a "일시정지" badge). Unity captures are at an uncontrolled time. `live-motion-*-sheet-*.png` are motion sheets: six frames of final and each step at stage time 1.30 to 1.80 s, 0.1 s apart, labelled `t=` (object spin is stopped, only shader time moves). `live.log` lists the mean pixel change between neighbouring frames. Use them to check motion claims in the text ("flows", "boils", layer speeds); a still frame cannot show these.
  - `worker-report.txt`: the worker's own report and the Unity compile line. Verify it; do not trust it.
- Specification: `C:\Users\user\shader-gallery\docs\specimen-guide.md`. Read all of it.
- Selection cards and decisions: `C:\Users\user\shader-gallery\docs\shader-selection.md` (the specimen's card, section 1-2 for 2D specimens, and the decision table at the top of section 7).
- Reference samples: `C:\Users\user\shader-gallery\Assets\Shaders\<sample>\` with `web\src\specimens\<sample>\meta.ts` (dissolve-edge-glow = mesh, sprite-outline-hit-flash = sprite, force-field-intersection = transparent/additive). Other merged specimens are under the same folders.
- App code when needed: meta schema `web\src\core\types.ts`, prompts `web\src\core\prompts.ts`, web stage `web\src\stage\glsl.ts`, `ShaderStage.ts`, `layout.ts`, texture tool `tools\gen-texture.mjs`, lint `tools\check.mjs`, Unity capture `Assets\Editor\ShaderGallery\SgCapture.cs`, compile check `SgVerify.cs`.

## Already verified (do not re-report)

The spec lint and WebGL2 compile pass. Unity compiles the listed keyword variants on D3D11, Vulkan, GLES3 and Metal with zero errors and warnings, and captures without errors. Note that the compile check only covers the keyword sets listed in `SgVerify.cs`.

## What to report

1. Defects ranked by severity. Each: file and line, what is wrong, and a concrete failure scenario (what a student or the gallery would see). Cover Unity runtime correctness (passes, tags, blending, queue, culling, SRP Batcher, XR where relevant, 2D Renderer for sprite/UI), the effect's math, texture import settings vs how the shader reads them, meta.ts vs shader consistency, whether web and Unity captures match, whether steps are distinct and match their text, whether "effect off" is a convincing visible example of a real common mistake, accuracy of mistakes and Unity notes (they go into copyable prompts), C# lifecycle per guide section 6, safety rules for flashing (guide section 7), content policy (game names only in inspiredBy, correct format, private course files by name only), Korean writing.
2. Claims in the text and the worker report that the code does not support.
3. Verdict per specimen: mergeable as is, mergeable after listed fixes, or needs rework, with the exact fix list, required first.
4. Separately: anything the app, lint, capture tool or guide should change.

Do not modify, create or delete files. Do not run the repo's tools or anything that writes. Reading files and viewing images is fine. Keep each specimen's section under about 50 lines, defects first.
