import type { Reel, ReelConfig, ReelTypeId, Scene, Source, Tone } from '../../types'
import { REEL_TYPES } from '../reelTypes'
import type { ReelGenerator } from './index'

/**
 * Heuristic generator: no model, no network. It slices the uploaded text into
 * segments and pours each one into a reel-type template. Good enough to prove
 * the flow end to end; swap in an LLM generator for real copywriting.
 */

const STOP = new Set(
  `about above after again against also among because been before being below between both
  could does doing down during each from further have having here into itself just more most
  much only other over same should some such than that their theirs them then there these they
  this those through under until very were what when where which while will with would your
  yours you're it's don't can't many make made like even well still every much want need`.split(
    /\s+/,
  ),
)

export function splitSentences(text: string): string[] {
  const parts = text
    .replace(/[#*_>`]/g, '')
    // Hard-wrapped lines (PDFs, pasted text) belong to one sentence; blank lines and bullets don't.
    .replace(/\n(?!\s*\n|\s*[-•\d])/g, ' ')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter((s) => s.length >= 25 && s.length <= 260)
  return parts
}

export function keywords(text: string, n: number): string[] {
  const freq = new Map<string, number>()
  for (const w of text.toLowerCase().match(/[a-z][a-z'-]{3,}/g) ?? []) {
    if (!STOP.has(w)) freq.set(w, (freq.get(w) ?? 0) + 1)
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .slice(0, n)
    .map(([w]) => w)
}

const shorten = (s: string, max = 120) => {
  if (s.length <= max) return s
  const cut = s.slice(0, max)
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:]$/, '') + '…'
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Split a list into `n` contiguous, roughly equal chunks. */
export function chunk<T>(items: T[], n: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < n; i++) {
    out.push(items.slice(Math.floor((i * items.length) / n), Math.floor(((i + 1) * items.length) / n)))
  }
  return out
}

/** Take `n` items, cycling if the list is shorter. */
const take = <T>(items: T[], n: number): T[] =>
  items.length === 0 ? [] : Array.from({ length: n }, (_, i) => items[i % items.length])

const bodyCount = (duration: number) => (duration <= 15 ? 3 : duration <= 30 ? 4 : 6)

const HOOKS: Record<Exclude<ReelTypeId, 'clip' | 'slideshow' | 'quote'>, Record<Tone, (t: string, n: number) => string>> = {
  tips: {
    bold: (t, n) => `${n} things nobody tells you about ${t}`,
    friendly: (t, n) => `${n} quick things worth knowing about ${t}`,
    professional: (t, n) => `${n} key points on ${t}`,
  },
  explainer: {
    bold: (t) => `${cap(t)}, explained before you scroll away`,
    friendly: (t) => `Let's make sense of ${t}`,
    professional: (t) => `${cap(t)}: a short breakdown`,
  },
  mythfact: {
    bold: (t) => `You've been told the wrong thing about ${t}`,
    friendly: (t) => `A common mix-up about ${t}`,
    professional: (t) => `A misconception about ${t}`,
  },
  story: {
    bold: (t) => `The ${t} story in under a minute`,
    friendly: (t) => `A short story about ${t}`,
    professional: (t) => `${cap(t)}: what happened and why it matters`,
  },
}

function textScenes(type: ReelTypeId, lines: string[], topic: string, cfg: ReelConfig): { title: string; scenes: Omit<Scene, 'duration'>[] } {
  const n = bodyCount(cfg.duration)
  const s = take(lines, n).map((l) => shorten(l))
  const text = (heading: string, extra: Partial<Scene> = {}): Omit<Scene, 'duration'> => ({ kind: 'text', heading, ...extra })

  switch (type) {
    case 'quote': {
      // The punchiest line: shortest sentence that still says something.
      const quote = [...lines].sort((a, b) => a.length - b.length)[0]
      return {
        title: `On ${topic}`,
        scenes: [text(`“${shorten(quote, 150)}”`, { label: 'QUOTE' }), text(`On ${topic}`, { body: 'Save this for later.' })],
      }
    }
    case 'mythfact': {
      const title = HOOKS.mythfact[cfg.tone](topic, n)
      return {
        title,
        scenes: [
          text(title),
          text(`“${cap(topic)} is simpler than it looks.”`, { label: 'MYTH' }),
          ...s.slice(0, Math.max(1, n - 2)).map((l) => text(l, { label: 'FACT' })),
        ],
      }
    }
    case 'story': {
      const beats = ['SETUP', 'THEN', 'THE TURN', 'TAKEAWAY', 'AND', 'SO']
      const title = HOOKS.story[cfg.tone](topic, n)
      return { title, scenes: [text(title), ...s.map((l, i) => text(l, { label: beats[Math.min(i, beats.length - 1)] }))] }
    }
    case 'explainer': {
      const title = HOOKS.explainer[cfg.tone](topic, n)
      return { title, scenes: [text(title), ...s.map((l, i) => text(l, { label: `STEP ${i + 1}` }))] }
    }
    default: {
      const title = HOOKS.tips[cfg.tone](topic, s.length)
      return { title, scenes: [text(title), ...s.map((l, i) => text(l, { label: String(i + 1).padStart(2, '0') }))] }
    }
  }
}

function withDurations(scenes: Omit<Scene, 'duration'>[], total: number): Scene[] {
  const per = Math.max(2, Math.round((total / scenes.length) * 10) / 10)
  return scenes.map((s) => ({ ...s, duration: per }))
}

const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`

let seq = 0
const reelId = () => `reel-${Date.now().toString(36)}-${seq++}`

export function generateReels(sources: Source[], cfg: ReelConfig): Reel[] {
  const texts = sources.filter((s) => s.kind === 'text')
  const videos = sources.filter((s) => s.kind === 'video' && s.url)
  const images = sources.filter((s) => s.kind === 'image' && s.url)
  const have = { text: texts.length > 0, video: videos.length > 0, image: images.length > 0 }

  // Only formats whose raw material was actually uploaded.
  const usable = cfg.types.filter((t) => have[REEL_TYPES.find((r) => r.id === t)!.needs])
  if (usable.length === 0) return []
  const plan = Array.from({ length: cfg.count }, (_, i) => usable[i % usable.length])

  const allText = texts.map((t) => t.text ?? '').join('\n')
  const sentences = splitSentences(allText)
  const globalTags = keywords(allText, 4)
  const cta: Omit<Scene, 'duration'> | null = cfg.cta.trim() ? { kind: 'text', heading: cfg.cta.trim(), label: 'NEXT' } : null

  const textPlan = plan.filter((t) => t !== 'clip' && t !== 'slideshow')
  const textChunks = chunk(sentences.length ? sentences : [shorten(allText.trim() || 'Add more text to get richer reels.')], Math.max(1, textPlan.length))
  const clipTotal = plan.filter((t) => t === 'clip').length
  const slideTotal = plan.filter((t) => t === 'slideshow').length
  const imageChunks = chunk(images, Math.max(1, Math.min(slideTotal, images.length)))

  let ti = 0
  let ci = 0
  let si = 0

  return plan.map((type): Reel => {
    const base = { id: reelId(), type, theme: cfg.theme }

    if (type === 'clip') {
      const video = videos[ci % videos.length]
      const total = video.duration ?? cfg.duration
      const len = Math.min(cfg.duration, total)
      // Spread clips evenly across the timeline. A real generator would pick by transcript.
      const perVideo = Math.ceil(clipTotal / videos.length)
      const slot = Math.floor(ci / videos.length)
      const start = Math.max(0, Math.min(total - len, ((slot + 0.5) * total) / perVideo - len / 2))
      ci++
      const name = video.name.replace(/\.[^.]+$/, '')
      const title = `${name} — part ${slot + 1}`
      const scenes: Scene[] = [{ kind: 'video', duration: len, mediaUrl: video.url, start, heading: title, label: `${fmt(start)} – ${fmt(start + len)}` }]
      if (cta) scenes.push({ ...cta, duration: 2.5 })
      return { ...base, title, scenes, caption: `${title}. ${cfg.cta}`.trim(), hashtags: [...globalTags.slice(0, 3), 'reels'] }
    }

    if (type === 'slideshow') {
      const group = imageChunks[si % imageChunks.length]
      si++
      const topic = globalTags[0]
      const title = topic ? `${cap(topic)} in pictures` : `Slideshow ${si}`
      const shots: Omit<Scene, 'duration'>[] = group.map((img, i) => ({ kind: 'image', mediaUrl: img.url, heading: i === 0 ? title : undefined }))
      const scenes = withDurations(shots, cfg.duration)
      if (cta) scenes.push({ ...cta, duration: 2.5 })
      return { ...base, title, scenes, caption: `${title}. ${cfg.cta}`.trim(), hashtags: [...globalTags.slice(0, 3), 'reels'] }
    }

    const lines = textChunks[ti % textChunks.length]
    ti++
    const local = keywords(lines.join(' '), 4)
    // Tiny segments give noisy keywords, so prefer a document-level keyword this segment mentions.
    const joined = lines.join(' ').toLowerCase()
    const topic = globalTags.find((k) => joined.includes(k)) ?? globalTags[0] ?? local[0] ?? 'this'
    const { title, scenes } = textScenes(type, lines, topic, cfg)
    if (cta) scenes.push(cta)
    return {
      ...base,
      title,
      scenes: withDurations(scenes, cfg.duration),
      caption: `${title}. ${shorten(lines[0], 140)} ${cfg.cta}`.trim(),
      hashtags: [...new Set([...local.slice(0, 3), ...globalTags.slice(0, 2), 'reels'])],
    }
  })
}

export const mockGenerator: ReelGenerator = {
  name: 'Mock (heuristic, in-browser)',
  async generate(sources, config) {
    // Small pause so the UI flow matches what a real model call will feel like.
    await new Promise((r) => setTimeout(r, 900))
    return generateReels(sources, config)
  },
}
