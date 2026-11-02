// 표본 데이터에서 Skill 폴더와 zip 을 만든다. 앱의 zip 다운로드와 같은 함수(web/src/core/skill.ts)를 쓴다.
//   node tools/build-skill.mjs
// 결과: skill/shader-gallery/ (커밋 대상), skill/shader-gallery.zip (커밋 안 함)

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildSkillFiles, SKILL_NAME } from '../web/src/core/skill.ts'
import { createZip } from '../web/src/core/zip.ts'
import { loadMeta, specimenIds } from './unity-job.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const fileOrder = name => (name.endsWith('.shader') ? 0 : name.endsWith('.hlsl') ? 1 : 2)

/** 레지스트리와 같은 순서로 표본을 읽는다 (그룹, order) */
async function loadSources() {
  const sources = []
  for (const id of specimenIds(ROOT)) {
    const meta = await loadMeta(ROOT, id)
    const folder = join(ROOT, 'Assets', 'Shaders', id)
    const files = readdirSync(folder)
      .filter(f => /\.(shader|hlsl|cs)$/.test(f))
      .sort((a, b) => fileOrder(a) - fileOrder(b) || a.localeCompare(b))
      .map(name => ({ name, lang: name.endsWith('.cs') ? 'csharp' : 'cpp', code: readFileSync(join(folder, name), 'utf8') }))
    sources.push({ meta, files })
  }
  return sources.sort((a, b) => a.meta.group.localeCompare(b.meta.group) || a.meta.order - b.meta.order)
}

export async function skillEntries() {
  const version = JSON.parse(readFileSync(join(ROOT, 'web', 'package.json'), 'utf8')).version
  return buildSkillFiles(await loadSources(), version)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const entries = await skillEntries()
  const out = join(ROOT, 'skill')
  const folder = join(out, SKILL_NAME)
  if (existsSync(folder)) rmSync(folder, { recursive: true, force: true })
  for (const entry of entries) {
    const path = join(out, entry.path)
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, entry.content)
  }
  const zipPath = join(out, `${SKILL_NAME}.zip`)
  const zip = createZip(entries)
  writeFileSync(zipPath, zip)
  const skill = entries[0].content
  const description = /^description: (.*)$/m.exec(skill)?.[1] ?? ''
  console.log(`skill/${SKILL_NAME}/: 파일 ${entries.length}개`)
  console.log(`skill/${SKILL_NAME}.zip: ${(zip.length / 1024).toFixed(1)} KB`)
  console.log(`SKILL.md ${skill.split('\n').length}줄 (한도 500), 설명 ${description.length}자 (한도 1536)`)
}
