import { describe, expect, it } from 'vitest'
import type { ReelConfig, Source } from '../../types'
import { chunk, generateReels, keywords, splitSentences } from './mock'

const article = `Compound interest is the quiet engine behind most long-term wealth.
Money that earns interest starts earning interest on that interest too. Starting five years earlier
often matters more than doubling your monthly contribution. Fees look tiny but they compound against
you in exactly the same way. Most people overestimate what they can do in a year and underestimate a decade.
Automating contributions removes the monthly decision entirely. Interest rewards patience far more than cleverness.`

const text: Source = { id: 't', kind: 'text', name: 'a.txt', text: article }
const video: Source = { id: 'v', kind: 'video', name: 'talk.mp4', url: 'blob:v', duration: 600 }
const cfg: ReelConfig = { types: ['tips'], count: 3, duration: 30, tone: 'bold', theme: 'ink', cta: 'Follow for more' }

describe('mock generator', () => {
  it('splits sentences and finds keywords', () => {
    expect(splitSentences(article).length).toBe(7)
    expect(keywords(article, 1)).toEqual(['interest'])
  })

  it('chunks contiguously without losing items', () => {
    expect(chunk([1, 2, 3, 4, 5], 2).flat()).toEqual([1, 2, 3, 4, 5])
  })

  it('makes the requested number of reels that fit the target length', () => {
    const reels = generateReels([text], cfg)
    expect(reels).toHaveLength(3)
    for (const r of reels) {
      const total = r.scenes.reduce((a, s) => a + s.duration, 0)
      expect(total).toBeGreaterThan(25)
      expect(total).toBeLessThan(35)
      expect(r.scenes.at(-1)?.heading).toBe('Follow for more')
    }
  })

  it('skips formats with no matching source and rotates the rest', () => {
    const reels = generateReels([text, video], { ...cfg, types: ['quote', 'clip', 'slideshow'], count: 4 })
    expect(reels.map((r) => r.type)).toEqual(['quote', 'clip', 'quote', 'clip'])
  })

  it('keeps video clips inside the source and non-overlapping', () => {
    const reels = generateReels([video], { ...cfg, types: ['clip'], count: 3, cta: '' })
    const starts = reels.map((r) => r.scenes[0].start!)
    expect(starts).toEqual([85, 285, 485])
    expect(starts.every((s) => s >= 0 && s + 30 <= 600)).toBe(true)
  })

  it('returns nothing when no selected format is usable', () => {
    expect(generateReels([video], cfg)).toEqual([])
  })
})
