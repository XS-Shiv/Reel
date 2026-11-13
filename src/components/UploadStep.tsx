import { useRef, useState } from 'react'
import type { Source } from '../types'
import { ACCEPT, ingestFile, textSource } from '../lib/ingest'

interface Props {
  sources: Source[]
  onChange: (s: Source[]) => void
  onNext: () => void
}

const ICON = { text: '¶', video: '▶', image: '▣' } as const

const describe = (s: Source) => {
  if (s.kind === 'text') return `${(s.text ?? '').trim().split(/\s+/).length.toLocaleString()} words`
  if (s.kind === 'video') return s.duration ? `${Math.floor(s.duration / 60)}m ${Math.round(s.duration % 60)}s video` : 'video'
  return 'image'
}

export default function UploadStep({ sources, onChange, onNext }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [pasted, setPasted] = useState('')
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [over, setOver] = useState(false)

  const addFiles = async (files: FileList | File[]) => {
    setBusy(true)
    const results = await Promise.allSettled([...files].map(ingestFile))
    const added = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []))
    setErrors(results.flatMap((r) => (r.status === 'rejected' ? [String(r.reason?.message ?? r.reason)] : [])))
    onChange([...sources, ...added])
    setBusy(false)
  }

  const addPasted = () => {
    if (!pasted.trim()) return
    onChange([...sources, textSource(pasted)])
    setPasted('')
  }

  const remove = (s: Source) => {
    if (s.url) URL.revokeObjectURL(s.url)
    onChange(sources.filter((x) => x.id !== s.id))
  }

  return (
    <section className="panel">
      <h1>
        Drop in your content. <em>Get reels back.</em>
      </h1>
      <p className="lede">Articles, notes, PDFs, long videos, photos — add as many as you like. Everything stays in your browser.</p>

      <div className="upload-grid">
        <div
          className={`drop ${over ? 'over' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setOver(true)
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setOver(false)
            void addFiles(e.dataTransfer.files)
          }}
          onClick={() => input.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
        >
          <input
            ref={input}
            type="file"
            multiple
            accept={ACCEPT}
            hidden
            onChange={(e) => {
              if (e.target.files) void addFiles(e.target.files)
              e.target.value = ''
            }}
          />
          <strong>{busy ? 'Reading files…' : 'Drop files here or click to browse'}</strong>
          <span>.txt · .md · .pdf · video · images</span>
        </div>

        <div className="paste">
          <textarea placeholder="…or paste text here: an article, a script, lecture notes" value={pasted} onChange={(e) => setPasted(e.target.value)} />
          <button className="ghost" onClick={addPasted} disabled={!pasted.trim()}>
            Add text
          </button>
        </div>
      </div>

      {errors.map((e) => (
        <p key={e} className="error">
          {e}
        </p>
      ))}

      {sources.length > 0 && (
        <ul className="sources">
          {sources.map((s) => (
            <li key={s.id}>
              <span className="kind">{ICON[s.kind]}</span>
              <span className="name">{s.name}</span>
              <span className="meta">{describe(s)}</span>
              <button aria-label={`Remove ${s.name}`} onClick={() => remove(s)}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="actions">
        <button className="primary" disabled={sources.length === 0} onClick={onNext}>
          Next: choose reel types →
        </button>
      </div>
    </section>
  )
}
