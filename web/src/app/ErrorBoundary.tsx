import { Component, type ReactNode } from 'react'

/** 표본 하나가 오류를 내도 갤러리 전체가 멈추지 않게 막는다. 어떤 표본에서 났는지 화면과 콘솔에 남긴다 */
export class ErrorBoundary extends Component<{ label: string; children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error(`[Shader Gallery] ${this.props.label} 오류:`, error)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="notfound" role="alert">
        <h1>{this.props.label}을(를) 표시하지 못했습니다</h1>
        <p>
          <code>{this.state.error.message}</code>
        </p>
        <p>
          <a href="#/">갤러리로 돌아가기</a>
        </p>
      </div>
    )
  }
}
