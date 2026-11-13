import type { Source } from '../types'

let counter = 0
const nextId = () => `src-${Date.now().toString(36)}-${counter++}`

export const ACCEPT = '.txt,.md,.markdown,.pdf,video/*,image/*'

export function textSource(text: string, name = 'Pasted text'): Source {
  return { id: nextId(), kind: 'text', name, text }
}

async function pdfText(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString()
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
  const pages: string[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const content = await (await doc.getPage(i)).getTextContent()
    pages.push(content.items.map((it) => ('str' in it ? it.str : '')).join(' '))
  }
  return pages.join('\n\n')
}

function videoDuration(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.onloadedmetadata = () => resolve(v.duration)
    v.onerror = () => reject(new Error('Could not read this video'))
    v.src = url
  })
}

/** Turn one uploaded file into a Source. Throws with a readable message if unsupported. */
export async function ingestFile(file: File): Promise<Source> {
  const name = file.name
  const ext = name.split('.').pop()?.toLowerCase() ?? ''

  if (file.type.startsWith('video/')) {
    const url = URL.createObjectURL(file)
    return { id: nextId(), kind: 'video', name, url, duration: await videoDuration(url) }
  }
  if (file.type.startsWith('image/')) {
    return { id: nextId(), kind: 'image', name, url: URL.createObjectURL(file) }
  }
  if (ext === 'pdf' || file.type === 'application/pdf') {
    const text = await pdfText(file)
    if (!text.trim()) throw new Error(`${name}: no selectable text found (scanned PDF?)`)
    return { id: nextId(), kind: 'text', name, text }
  }
  if (['txt', 'md', 'markdown'].includes(ext) || file.type.startsWith('text/')) {
    return { id: nextId(), kind: 'text', name, text: await file.text() }
  }
  throw new Error(`${name}: unsupported file type`)
}
