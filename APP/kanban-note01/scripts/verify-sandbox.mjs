import { readFile } from 'node:fs/promises'

const files = [
  'src/sandbox.tsx',
  'src/sandbox/SandboxApp.tsx',
  'src/sandbox/sandboxStorage.ts',
]

const forbidden = [
  /from ['"]\.\/App/,
  /from ['"].*\/store(?:\/|['"])/,
  /from ['"].*\/db\/firebase/,
  /from ['"].*\/dataBridge\//,
]

const contents = await Promise.all(files.map(async (file) => ({ file, text: await readFile(file, 'utf8') })))
const violations = contents.flatMap(({ file, text }) => forbidden.filter((pattern) => pattern.test(text)).map((pattern) => `${file}: ${pattern}`))
const hasPrefix = contents.some(({ file, text }) => file.endsWith('sandboxStorage.ts') && text.includes('sandbox_note01_'))

if (!hasPrefix || violations.length > 0) {
  console.error('[SANDBOX-VERIFY] failed', { hasPrefix, violations })
  process.exit(1)
}

console.log('[SANDBOX-VERIFY] pass', {
  entry: 'sandbox.html',
  storagePrefix: 'sandbox_note01_',
  productionImports: 'none',
})
