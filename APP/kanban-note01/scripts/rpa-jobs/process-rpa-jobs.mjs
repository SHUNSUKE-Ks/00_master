import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { deleteApp, initializeApp } from 'firebase/app'
import { getAuth, signInAnonymously } from 'firebase/auth'
import { collection, doc, getDocs, getFirestore, query, terminate, updateDoc, where } from 'firebase/firestore'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appRoot = path.resolve(__dirname, '../..')

const args = new Set(process.argv.slice(2))
const dryRun = args.has('--dry-run')
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='))
const limit = limitArg ? Number(limitArg.split('=')[1]) : Number.POSITIVE_INFINITY

function parseEnvFile(text) {
  const result = {}
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!match) continue
    const [, key, value] = match
    result[key] = value.replace(/^["']|["']$/g, '')
  }
  return result
}

async function loadEnv() {
  const files = ['.env', '.env.local', '.env.production.local']
  const merged = {}
  for (const file of files) {
    try {
      Object.assign(merged, parseEnvFile(await readFile(path.join(appRoot, file), 'utf8')))
    } catch {
      // Optional env files are expected in local development.
    }
  }
  return { ...merged, ...process.env }
}

function requiredEnv(env, key) {
  const value = env[key]
  if (!value) throw new Error(`Missing ${key}`)
  return value
}

function safeSegment(input) {
  return String(input || 'unknown')
    .replace(/^https?:\/\//, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 96)
}

function mdEscape(input) {
  return String(input ?? '').replace(/\r?\n/g, ' ').trim()
}

function buildManual(job) {
  return `# ${job.repo}

${job.titleOriginal || 'OSS候補から生成したRPA資料です。'}

## 基本情報
- URL: ${job.url}
- Genre: ${job.genre}
- SubGenre: ${job.subGenre}
- Concept: ${job.concept}
- Priority: ${job.priority}
- SourceType: ${job.sourceType}
- Format: ${job.formatLabel}
- Schema: ${job.schemaPath}

## RPA読解の目的
この資料は、CodexがOSS候補をOpenHarness型の資料へ分解するための初期manualです。
まずはREADMEや主要コードを読む前の作業台として、見るべき観点を固定します。

## 読解観点
- 構造: ディレクトリ、起動点、主要moduleを確認する。
- 状態: ゲームやEngineが保持するStateを確認する。
- 入力: keyboard、mouse、touch、networkなどの入力経路を確認する。
- 描画: Canvas、DOM、WebGL、Engine sceneなどの表示経路を確認する。
- 反復: game loop、update loop、timer、event loopを確認する。
- 再利用: Note_Story / GameLab / novelEngineへ持ち込める部品を分ける。

## 次の作業
1. GitHub原本を取得または参照する。
2. 主要ファイルを3から7個に絞る。
3. topics配下へ機能別メモを増やす。
4. 必要なら漢字概念化jobを作る。
`
}

function buildIndex(job) {
  return `# ${job.repo} / 目次

## Manual
- [manual.md](manual.md)

## Topics
- [overview](topics/overview.md)

## Job
- id: ${job.id}
- status: ${job.status}
- action: ${job.action}
- formatId: ${job.formatId}
`
}

function buildOverview(job) {
  return `# overview

## 一言
${job.titleOriginal || 'OSS候補の概要を整理する。'}

## Dict
| 用語 | 定義 |
|---|---|
| 候補 | RPA資料化の対象となるGitHub repositoryまたは索引 |
| 形式 | 出力先のmanual / 目次 / topics構成 |
| 観点 | Codexが読むときに固定する確認項目 |

## メモ
- repo: ${job.repo}
- concept: ${job.concept}
- reportPath: ${job.reportPath}
`
}

async function writeJobFiles(job) {
  const repoFolder = safeSegment(job.repo.replace('/', '_'))
  const outputRoot = path.join(appRoot, 'public', 'study-blog', 'generated-rpa', repoFolder)
  const topicsDir = path.join(outputRoot, 'topics')
  await mkdir(topicsDir, { recursive: true })

  const files = [
    ['manual.md', buildManual(job)],
    ['目次.md', buildIndex(job)],
    [path.join('topics', 'overview.md'), buildOverview(job)],
  ]

  for (const [relativePath, content] of files) {
    await writeFile(path.join(outputRoot, relativePath), content, 'utf8')
  }

  return {
    outputRoot,
    files: files.map(([relativePath]) => path.join(outputRoot, relativePath)),
  }
}

async function main() {
  const env = await loadEnv()
  const firebaseConfig = {
    apiKey: requiredEnv(env, 'VITE_FIREBASE_API_KEY'),
    authDomain: requiredEnv(env, 'VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: requiredEnv(env, 'VITE_FIREBASE_PROJECT_ID'),
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: requiredEnv(env, 'VITE_FIREBASE_APP_ID'),
  }
  const collectionName = env.VITE_RPA_JOBS_COLLECTION || 'rpaJobs'
  console.log('[RPA-JOBS] env ok', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    collectionName,
  })

  const firebaseApp = initializeApp(firebaseConfig)
  const auth = getAuth(firebaseApp)
  try {
    const credential = await signInAnonymously(auth)
    console.log('[RPA-JOBS] anonymous auth ok', {
      uid: credential.user.uid,
      isAnonymous: credential.user.isAnonymous,
    })
  } catch (error) {
    console.warn(`[RPA-JOBS] anonymous auth failed: ${error instanceof Error ? error.message : String(error)}`)
  }

  const db = getFirestore(firebaseApp)
  try {
    console.log('[RPA-JOBS] firestore query start', {
      collectionName,
      where: 'status == 実行依頼',
    })
    const snap = await getDocs(query(collection(db, collectionName), where('status', '==', '実行依頼')))
    const jobs = snap.docs.slice(0, limit).map((entry) => ({ id: entry.id, ...entry.data() }))

    console.log(`[RPA-JOBS] collection=${collectionName} status=実行依頼 count=${jobs.length} dryRun=${dryRun}`)

    for (const job of jobs) {
      console.log(`[RPA-JOBS] start ${mdEscape(job.repo)} action=${job.action} format=${job.formatId}`)
      if (dryRun) continue

      const ref = doc(db, collectionName, job.id)
      await updateDoc(ref, {
        status: '確認中',
        updatedAt: new Date().toISOString(),
        worker: 'codex-local',
      })

      try {
        const output = await writeJobFiles(job)
        await updateDoc(ref, {
          status: 'Library化済み',
          updatedAt: new Date().toISOString(),
          outputRoot: output.outputRoot,
          outputFiles: output.files,
        })
        console.log(`[RPA-JOBS] done ${mdEscape(job.repo)} -> ${output.outputRoot}`)
      } catch (error) {
        await updateDoc(ref, {
          status: '失敗',
          updatedAt: new Date().toISOString(),
          errorMessage: error instanceof Error ? error.message : String(error),
        })
        throw error
      }
    }
  } finally {
    await terminate(db).catch(() => {})
    await deleteApp(firebaseApp).catch(() => {})
  }
}

main().catch((error) => {
  console.error(`[RPA-JOBS] failed: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
})
