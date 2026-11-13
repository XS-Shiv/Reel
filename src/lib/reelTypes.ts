import type { ReelTypeId, SourceKind, ThemeId, Tone } from '../types'

export interface ReelTypeInfo {
  id: ReelTypeId
  name: string
  blurb: string
  /** The kind of uploaded content this format is built from. */
  needs: SourceKind
}

export const REEL_TYPES: ReelTypeInfo[] = [
  { id: 'tips', name: 'Hook + tips', blurb: 'A scroll-stopping hook, then numbered takeaways.', needs: 'text' },
  { id: 'explainer', name: 'Explainer', blurb: 'One idea broken down step by step.', needs: 'text' },
  { id: 'quote', name: 'Quote card', blurb: 'The single most quotable line, big on screen.', needs: 'text' },
  { id: 'mythfact', name: 'Myth vs fact', blurb: 'Set up the assumption, then flip it.', needs: 'text' },
  { id: 'story', name: 'Mini story', blurb: 'Setup, turn and takeaway in four beats.', needs: 'text' },
  { id: 'clip', name: 'Highlight clip', blurb: 'Short cuts from your long video with a title overlay.', needs: 'video' },
  { id: 'slideshow', name: 'Photo slideshow', blurb: 'Your images in sequence with slow motion.', needs: 'image' },
]

export const TONES: { id: Tone; name: string }[] = [
  { id: 'bold', name: 'Bold' },
  { id: 'friendly', name: 'Friendly' },
  { id: 'professional', name: 'Professional' },
]

export const THEMES: { id: ThemeId; name: string }[] = [
  { id: 'ink', name: 'Ink' },
  { id: 'sunset', name: 'Sunset' },
  { id: 'paper', name: 'Paper' },
  { id: 'neon', name: 'Neon' },
]

export const DURATIONS = [15, 30, 60] as const

export const typeName = (id: ReelTypeId) => REEL_TYPES.find((t) => t.id === id)?.name ?? id
