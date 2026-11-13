import { useEffect } from 'react'
import type { ReelConfig, ReelTypeId, Source } from '../types'
import { DURATIONS, REEL_TYPES, THEMES, TONES } from '../lib/reelTypes'

interface Props {
  sources: Source[]
  config: ReelConfig
  onChange: (c: ReelConfig) => void
  onBack: () => void
  onGenerate: () => void
}

const NEED_HINT = { text: 'Needs text or a document', video: 'Needs a video', image: 'Needs images' } as const

export default function ConfigStep({ sources, config, onChange, onBack, onGenerate }: Props) {
  const kinds = new Set(sources.map((s) => s.kind))
  const set = <K extends keyof ReelConfig>(key: K, value: ReelConfig[K]) => onChange({ ...config, [key]: value })

  // Pre-select a sensible format per uploaded kind, and drop any that no longer apply.
  useEffect(() => {
    const valid = config.types.filter((t) => kinds.has(REEL_TYPES.find((r) => r.id === t)!.needs))
    const next: ReelTypeId[] = valid.length
      ? valid
      : [kinds.has('text') && 'tips', kinds.has('video') && 'clip', kinds.has('image') && 'slideshow'].filter((t): t is ReelTypeId => !!t)
    if (next.join() !== config.types.join()) set('types', next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sources])

  const toggle = (id: ReelTypeId) =>
    set('types', config.types.includes(id) ? config.types.filter((t) => t !== id) : [...config.types, id])

  return (
    <section className="panel">
      <h1>
        What kind of reels <em>do you want?</em>
      </h1>
      <p className="lede">Pick one or more formats. If you pick several, the reels rotate through them.</p>

      <h3>Reel types</h3>
      <div className="types">
        {REEL_TYPES.map((t) => {
          const available = kinds.has(t.needs)
          const on = config.types.includes(t.id)
          return (
            <button key={t.id} className={`type ${on ? 'on' : ''}`} disabled={!available} aria-pressed={on} onClick={() => toggle(t.id)}>
              <strong>{t.name}</strong>
              <span>{available ? t.blurb : NEED_HINT[t.needs]}</span>
            </button>
          )
        })}
      </div>

      <div className="options">
        <div>
          <h3>How many reels</h3>
          <div className="stepper">
            <button aria-label="Fewer" onClick={() => set('count', Math.max(1, config.count - 1))}>
              −
            </button>
            <output>{config.count}</output>
            <button aria-label="More" onClick={() => set('count', Math.min(12, config.count + 1))}>
              +
            </button>
          </div>
        </div>
        <div>
          <h3>Length of each</h3>
          <div className="seg">
            {DURATIONS.map((d) => (
              <button key={d} className={config.duration === d ? 'on' : ''} onClick={() => set('duration', d)}>
                {d}s
              </button>
            ))}
          </div>
        </div>
        <div>
          <h3>Tone</h3>
          <div className="seg">
            {TONES.map((t) => (
              <button key={t.id} className={config.tone === t.id ? 'on' : ''} onClick={() => set('tone', t.id)}>
                {t.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <h3>Visual style</h3>
          <div className="seg">
            {THEMES.map((t) => (
              <button key={t.id} className={`swatch theme-${t.id} ${config.theme === t.id ? 'on' : ''}`} onClick={() => set('theme', t.id)}>
                {t.name}
              </button>
            ))}
          </div>
        </div>
        <div className="wide">
          <h3>Closing call to action</h3>
          <input type="text" value={config.cta} maxLength={60} placeholder="Leave empty for none" onChange={(e) => set('cta', e.target.value)} />
        </div>
      </div>

      <div className="actions">
        <button className="ghost" onClick={onBack}>
          ← Back
        </button>
        <button className="primary" disabled={config.types.length === 0} onClick={onGenerate}>
          Generate {config.count} reel{config.count === 1 ? '' : 's'}
        </button>
      </div>
    </section>
  )
}
