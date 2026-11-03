#!/bin/sh
# 잡 브랜치(dispatch/<id>) 하나의 표본을 리뷰 폴더 _review/<id>/ 로 모으고 웹 화면을 찍는다.
#   sh tools/workflow/prepare-review.sh <표본 id> [단계 수]
# 리뷰어에게는 tools/workflow/review-brief.md 와 이 폴더를 준다.
set -e
ID=$1
STEPS=${2:-3}
REPO=$(cd "$(dirname "$0")/../.." && pwd)
OUT="$REPO/_review/$ID"
WT="$(cygpath -m "${TMPDIR:-/tmp}")/sg-rv-$ID"
rm -rf "$OUT"
mkdir -p "$OUT/code" "$OUT/unity-shots" "$OUT/web-shots"

awk 'BEGIN{n=0} /^---$/{n++; next} n>=2' "$REPO/jobs/$ID.md" > "$OUT/task.md"
git -C "$REPO" worktree add -q --detach "$WT" "dispatch/$ID"
find "$WT/Assets/Shaders/$ID" -type f ! -name '*.meta' -exec cp {} "$OUT/code/" \;
cp "$WT/web/src/specimens/$ID/meta.ts" "$OUT/code/"
cp "$WT/web/src/shots/$ID/"*.webp "$OUT/unity-shots/"
(
  cd "$WT"
  # burst: t=1.3 부터 0.1 초 간격 6장을 한 장의 시트로 (움직임 주장을 리뷰어가 볼 수 있게).
  # 잡 브랜치의 live.mjs 와 앱으로 찍으므로 burst 가 들어간 main(2026-11-03) 뒤에 만든 브랜치에서만 시트가 나온다
  # (그 전 브랜치는 live.log 에 "모르는 동작" 만 남고 나머지 촬영은 그대로 된다)
  node tools/live.mjs "$ID" --query="auto=0&t=1.3" wait:1200 stage:final burst:motion-final,6,100
  node tools/live.mjs "$ID" --no-build --query="auto=0&off=1&t=1.3" wait:900 stage:off
  n=1
  while [ "$n" -le "$STEPS" ]; do
    node tools/live.mjs "$ID" --no-build --query="auto=0&step=$n&t=1.3" wait:900 "stage:step$n" "burst:motion-step$n,6,100"
    n=$((n + 1))
  done
) > "$OUT/live.log" 2>&1
# 연속 촬영은 시트만 옮긴다 (장마다의 live-*-t<시간>-*.png 는 빼고)
find "$WT/_shots/$ID" -name '*.png' ! -name 'live-*-t[0-9]*' -exec cp {} "$OUT/web-shots/" \;
node -e "require('fs').rmSync(process.argv[1], { recursive: true, force: true })" "$WT"
git -C "$REPO" worktree prune

# 워커의 마지막 보고와 검증 결과 (JayDispatch 실행 기록의 마지막 시도)
RUN=$(ls -d "$HOME"/.jay-dispatch/repos/shader-gallery-*/runs/"$ID"/*/ 2>/dev/null | tail -1)
if [ -n "$RUN" ]; then
  {
    node -e "const t=require('fs').readFileSync(process.argv[1],'utf8');try{console.log(JSON.parse(t).result||'')}catch{console.log(t)}" "$RUN/stdout.log"
    echo
    grep "통과 \|오류" "$RUN/verify.log" || true
  } > "$OUT/worker-report.txt"
fi
find "$OUT" -type f | sed "s|$OUT/||" | sort | tr '\n' ' '
echo
