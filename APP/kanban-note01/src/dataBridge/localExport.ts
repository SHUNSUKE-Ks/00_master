import { state } from '../store'
import { galleryState } from '../pages/gallery/store'
import { upnoteNotes } from '../features/upnote/store'

type ExportKind = 'json' | 'md'

function replacer(_key: string, value: unknown) {
  if (value instanceof Date) return value.toISOString()
  return value
}

function download(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function snapshot() {
  return {
    app: 'note00-gallerynotedb_vol1.1',
    exportedAt: new Date(),
    mode: 'local-json-md',
    dbTitles: state.dbTitles,
    products: state.products,
    nutrients: state.nutrients,
    symptoms: state.symptoms,
    memos: state.memos,
    blogs: state.blogs,
    notebooks: state.notebooks,
    inbox: state.inboxItems,
    gallery: galleryState.items,
    upnote: upnoteNotes,
  }
}

function toMarkdown() {
  const data = snapshot()
  const lines = [
    '# note00 Local Export',
    '',
    `- exportedAt: ${new Date(data.exportedAt).toISOString()}`,
    `- products: ${data.products.length}`,
    `- tags: ${data.nutrients.length}`,
    `- upnote: ${data.upnote.length}`,
    `- gallery: ${data.gallery.length}`,
    `- inbox: ${data.inbox.length}`,
    '',
    '## DB Titles',
    '',
    `- DB01: ${data.dbTitles.db01}`,
    `- DB02: ${data.dbTitles.db02}`,
    '',
    '## Global InBox',
    '',
    ...data.inbox.flatMap((item) => [
      `### ${item.subject}`,
      '',
      `- id: ${item.id}`,
      `- tag: ${item.tag}`,
      `- status: ${item.status}`,
      `- source: ${item.sourceNotebookTitle ?? item.sourceView}${item.sourcePageTitle ? ` / ${item.sourcePageTitle}` : ''}`,
      '',
      item.body,
      '',
    ]),
    '',
    '## Upnote Notes',
    '',
    ...data.upnote.flatMap((note) => [
      `### ${note.title}`,
      '',
      `- id: ${note.id}`,
      `- tags: ${note.tags.join(', ') || '-'}`,
      '',
      note.body || '_empty_',
      '',
    ]),
  ]
  return lines.join('\n')
}

export function exportLocalWorkspace(kind: ExportKind) {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll('-', '')
  if (kind === 'json') {
    download(`note00_workspace_${stamp}.json`, JSON.stringify(snapshot(), replacer, 2), 'application/json')
    return
  }
  download(`note00_workspace_${stamp}.md`, toMarkdown(), 'text/markdown')
}
