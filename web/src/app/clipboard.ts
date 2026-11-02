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
    document.execCommand('copy')
    area.remove()
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
export async function writeImage(png: Blob, fallbackName: string): Promise<void> {
  try {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })])
  } catch {
    downloadBlob(png, fallbackName)
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

/** 복사 버튼용: 눌린 뒤 잠깐 '복사됨' 을 보여 준다 */
export function useCopy(): [boolean, (action: () => Promise<void>) => void] {
  const [copied, setCopied] = useState(false)
  const timer = useRef(0)
  const run = useCallback((action: () => Promise<void>) => {
    void action().then(() => {
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCopied(false), 1400)
    })
  }, [])
  return [copied, run]
}
