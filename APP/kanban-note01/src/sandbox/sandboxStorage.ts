export type SandboxTheme = 'midnight' | 'paper'
export type SandboxTab = 'note' | 'wiki' | 'book' | 'lab'

export type SandboxWorkspace = {
  theme: SandboxTheme
  activeTab: SandboxTab
  note: string
  updatedAt: string
}

export const SANDBOX_STORAGE_PREFIX = 'sandbox_note01_'
const WORKSPACE_KEY = `${SANDBOX_STORAGE_PREFIX}workspace_v1`

const SEED: SandboxWorkspace = {
  theme: 'midnight',
  activeTab: 'note',
  note: 'Claude Sandboxは本番Noteと完全に別の保存領域です。\nここでSolidUI風の見た目と操作を試します。',
  updatedAt: '2026-07-12T00:00:00.000Z',
}

type SandboxProbe = {
  writes: string[]
  resetCount: number
}

declare global {
  interface Window {
    __NOTE_SANDBOX_PROBE__?: SandboxProbe
  }
}

function cloneSeed(): SandboxWorkspace {
  return { ...SEED }
}

function assertSandboxKey(key: string) {
  if (!key.startsWith(SANDBOX_STORAGE_PREFIX)) {
    throw new Error(`Sandbox storage key violation: ${key}`)
  }
}

function registerWrite(key: string) {
  window.__NOTE_SANDBOX_PROBE__ ??= { writes: [], resetCount: 0 }
  window.__NOTE_SANDBOX_PROBE__.writes.push(key)
}

export function loadSandboxWorkspace(): SandboxWorkspace {
  const raw = localStorage.getItem(WORKSPACE_KEY)
  if (!raw) return cloneSeed()
  try {
    const parsed = JSON.parse(raw) as Partial<SandboxWorkspace>
    return {
      theme: parsed.theme === 'paper' ? 'paper' : 'midnight',
      activeTab: parsed.activeTab === 'wiki' || parsed.activeTab === 'book' || parsed.activeTab === 'lab' ? parsed.activeTab : 'note',
      note: typeof parsed.note === 'string' ? parsed.note : SEED.note,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : SEED.updatedAt,
    }
  } catch {
    return cloneSeed()
  }
}

export function saveSandboxWorkspace(workspace: SandboxWorkspace) {
  assertSandboxKey(WORKSPACE_KEY)
  localStorage.setItem(WORKSPACE_KEY, JSON.stringify(workspace))
  registerWrite(WORKSPACE_KEY)
}

export function resetSandboxWorkspace(): SandboxWorkspace {
  const next = cloneSeed()
  saveSandboxWorkspace(next)
  window.__NOTE_SANDBOX_PROBE__ ??= { writes: [], resetCount: 0 }
  window.__NOTE_SANDBOX_PROBE__.resetCount += 1
  return next
}

export function sandboxSeedInfo() {
  return {
    storagePrefix: SANDBOX_STORAGE_PREFIX,
    storageKey: WORKSPACE_KEY,
    seedUpdatedAt: SEED.updatedAt,
  }
}
