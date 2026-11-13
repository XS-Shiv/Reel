import { useState } from 'react'
import type { Reel } from '../types'
import { typeName } from '../lib/reelTypes'
import ReelPlayer from './ReelPlayer'

interface Props {
  reels: Reel[]
  onBack: () => void
  onReset: () => void
}

const script = (r: Reel) =>
  [
    r.title,
    '',
    ...r.scenes.map((s, i) => `Scene ${i + 1} (${s.duration}s)${s.label ? ` [${s.label}]` : ''}: ${[s.heading, s.body].filter(Boolean).join(' — ') || s.kind}`),
    '',
    `Caption: ${r.caption}`,
    r.hashtags.map((h) => `#${h}`).join(' '),
  ].join('\n')

export default function ResultsStep({ reels, onBack, onReset }: Props) {
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const copy = async (r: Reel) => {
    await navigator.clipboard.writeText(script(r))
    setCopied(r.id)
    setTimeout(() => setCopied(null), 1500)
  }

  const download = () => {
    const blob = new Blob([JSON.stringify(reels, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'reels.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  if (reels.length === 0) {
    return (
      <section className="panel">
        <h1>No reels came out of that.</h1>
        <p className="lede">None of the selected reel types matched the content you uploaded. Go back and pick a different type.</p>
        <div className="actions">
          <button className="primary" onClick={onBack}>
            ← Adjust options
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="results">
      <div className="results-head">
        <h1>
          {reels.length} reel{reels.length === 1 ? '' : 's'}, <em>ready to preview.</em>
        </h1>
        <div className="actions">
          <button className="ghost" onClick={onBack}>
            ← Adjust options
          </button>
          <button className="ghost" onClick={download}>
            Download JSON
          </button>
          <button className="ghost" onClick={onReset}>
            Start over
          </button>
        </div>
      </div>

      <div className="grid">
        {reels.map((r) => (
          <article key={r.id} className="card">
            <ReelPlayer reel={r} playing={playingId === r.id} onPlayingChange={(p) => setPlayingId(p ? r.id : (cur) => (cur === r.id ? null : cur))} />
            <div className="card-meta">
              <span className="badge">{typeName(r.type)}</span>
              <span className="len">{Math.round(r.scenes.reduce((a, s) => a + s.duration, 0))}s</span>
            </div>
            <p className="caption">{r.caption}</p>
            <p className="tags">{r.hashtags.map((h) => `#${h}`).join(' ')}</p>
            <button className="ghost small" onClick={() => void copy(r)}>
              {copied === r.id ? 'Copied' : 'Copy script'}
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}
