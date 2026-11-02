import { readFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }

// SG_ONLY=<표본id> 로 빌드하면 그 표본만 등록한다 (tools/live.mjs 가 사용).
// 여러 표본을 동시에 만들 때 다른 표본의 미완성 파일이 내 빌드를 깨뜨리지 않게 하려는 것.
const only = process.env.SG_ONLY
const onlySpecimen: Plugin = {
  name: 'sg-only-specimen',
  enforce: 'pre',
  transform(code, id) {
    if (!only || !/[\\/]src[\\/]core[\\/]registry\.ts$/.test(id.split('?')[0])) return
    return code
      .replace(`'../specimens/*/meta.ts'`, `'../specimens/${only}/meta.ts'`)
      .replace(`'../../../Assets/Shaders/*/*.{shader,hlsl,cs}'`, `'../../../Assets/Shaders/${only}/*.{shader,hlsl,cs}'`)
      .replace(`'../specimens/*/web.glsl'`, `'../specimens/${only}/web.glsl'`)
      .replace(`'../shots/*/*.webp'`, `'../shots/${only}/*.webp'`)
      .replace(`'../../../Assets/Shaders/*/*.png'`, `'../../../Assets/Shaders/${only}/*.png'`)
  },
}

// 결과물은 dist/index.html 한 개. 더블클릭(file://)과 GitHub Pages 에서 똑같이 동작한다.
export default defineConfig({
  base: './',
  plugins: [onlySpecimen, react(), viteSingleFile()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
  },
  assetsInclude: ['**/*.shader', '**/*.hlsl'],
  build: {
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 4000,
  },
  server: { port: 5173, strictPort: true, fs: { allow: ['..'] } },
})
