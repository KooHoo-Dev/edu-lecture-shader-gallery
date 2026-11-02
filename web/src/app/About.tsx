const LIBS: [string, string, string][] = [
  ['React · React DOM', 'MIT', 'https://github.com/facebook/react'],
  ['three.js', 'MIT', 'https://github.com/mrdoob/three.js'],
  ['highlight.js', 'BSD-3-Clause', 'https://github.com/highlightjs/highlight.js'],
  ['Chakra Petch (글꼴)', 'SIL OFL 1.1', 'https://github.com/cadsondemak/chakra-petch'],
  ['JetBrains Mono (글꼴)', 'SIL OFL 1.1', 'https://github.com/JetBrains/JetBrainsMono'],
  ['Vite · vite-plugin-singlefile (빌드 도구)', 'MIT', 'https://github.com/vitejs/vite'],
]

export function About() {
  return (
    <div className="about">
      <h1>크레딧 · 정책</h1>

      <section className="sec">
        <h2>이 갤러리는 무엇인가</h2>
        <p>
          유니티 개발자 양성과정의 강사와 수강생이 함께 보는 게임 셰이더 갤러리입니다. 화면과 샘플 코드, 프롬프트만 보고도 AI에게 같은 효과를 지시해 자기 프로젝트에 넣을 수 있게 만들었습니다. 기준은 Unity 6.3 LTS, URP 17.3, HLSL 코드 셰이더입니다.
        </p>
        <p>
          브라우저 미리보기와 Unity 셰이더는 <b>같은 <code>core.hlsl</code> 파일</b>을 씁니다. 모든 표본은 실제 Unity 에서 컴파일과 촬영을 거칩니다. 조명과 그림자처럼 Unity 전용인 부분은 미리보기에서 비슷하게 흉내 낸 것이므로, 정확한 모습은 AI 지시 세트의 Unity 실측 스크린샷을 보세요.
        </p>
      </section>

      <section className="sec">
        <h2>콘텐츠 원칙: 원리는 배우고, 코드는 새로</h2>
        <ul>
          <li>게임 원작의 텍스처, 모델, 셰이더 코드를 추출하거나 옮기지 않습니다. 효과의 원리를 분석해 새 코드로 씁니다.</li>
          <li>튜토리얼, 블로그, 오픈소스 코드도 복사하지 않고 원리만 참고해 출처를 링크합니다.</li>
          <li>텍스처와 노이즈는 직접 생성합니다. 표본 ID와 제목에는 게임명을 쓰지 않습니다.</li>
          <li>넓은 면이 번쩍이는 효과는 초당 3회 이하로 제한합니다.</li>
        </ul>
        <p className="notice">
          언급된 게임명과 상표는 각 권리자의 소유이며, 이 프로젝트는 해당 권리자와 제휴하거나 보증받지 않았습니다. 권리 관련 요청은 저장소의 Issues로 보내 주시면 지체 없이 조치합니다.
          <br />
          <span lang="en">All shaders in this gallery are original code written for education. No game assets are included. Game titles and trademarks belong to their respective owners; this project is not affiliated with or endorsed by them.</span>
        </p>
      </section>

      <section className="sec">
        <h2>수강생 여러분께</h2>
        <p>
          여기 있는 코드는 MIT 라이선스로 자유롭게 써도 됩니다. AI가 만들어 준 코드는 그대로 믿지 말고, 단계 보기로 원리를 확인한 뒤 자기 프로젝트에서 직접 값을 바꿔 보세요.
        </p>
      </section>

      <section className="sec">
        <h2>사용한 라이브러리 · 글꼴</h2>
        <table className="licenses">
          <thead>
            <tr>
              <th>이름</th>
              <th>라이선스</th>
            </tr>
          </thead>
          <tbody>
            {LIBS.map(([name, lic, url]) => (
              <tr key={name}>
                <td>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    {name}
                  </a>
                </td>
                <td className="mono">{lic}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted">한글 본문은 각 PC의 시스템 글꼴(맑은 고딕 등)로 표시합니다.</p>
      </section>
    </div>
  )
}
