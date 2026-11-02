import { useCallback, useRef, useState } from 'react'

/* 복사와 내려받기. file:// 처럼 클립보드 API 가 막힌 환경에서는 대체 경로로 간다. */

export async function writeText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const area = document.createElement('textarea')
    area.value = text
    document.body.append(area)
    area.select()
    const copied = document.execCommand('copy')
    area.remove()
    if (!copied) throw new Error('클립보드를 쓸 수 없습니다')
  }
}

export function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

/** 이미지를 클립보드에 넣는다. 안 되는 환경이면 파일로 내려받는다 */
export async function writeImage(png: Blob, fallbackName: string): Promise<CopyResult> {
  try {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })])
    return '복사됨'
  } catch {
    downloadBlob(png, fallbackName)
    return '파일로 저장됨'
  }
}

/** 내장 WebP 스크린샷을 PNG 로 바꾼다. 클립보드는 PNG 만 받는다 */
export function imageUrlToPng(url: string): Promise<Blob> {
  return new Promise((ok, fail) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      canvas.getContext('2d')!.drawImage(image, 0, 0)
      canvas.toBlob(blob => (blob ? ok(blob) : fail(new Error('이미지 변환 실패'))), 'image/png')
    }
    image.onerror = () => fail(new Error('이미지를 읽지 못했습니다'))
    image.src = url
  })
}

export type CopyResult = '복사됨' | '파일로 저장됨'

/** 복사 버튼용: 눌린 뒤 잠깐 결과를 보여 준다. 평소에는 null */
export function useCopy(): [string | null, (action: () => Promise<CopyResult | void>) => void] {
  const [status, setStatus] = useState<string | null>(null)
  const timer = useRef(0)
  const run = useCallback((action: () => Promise<CopyResult | void>) => {
    const show = (text: string) => {
      setStatus(text)
      clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setStatus(null), 1600)
    }
    action().then(
      result => show(result ?? '복사됨'),
      () => show('복사 실패'),
    )
  }, [])
  return [status, run]
}
