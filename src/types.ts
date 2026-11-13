export type SourceKind = 'text' | 'video' | 'image'

/** One piece of uploaded content, normalised so generators don't care where it came from. */
export interface Source {
  id: string
  kind: SourceKind
  name: string
  /** Extracted text (text sources only). */
  text?: string
  /** Object URL for media sources. */
  url?: string
  /** Seconds (video sources only). */
  duration?: number
}

export type ReelTypeId =
  | 'tips'
  | 'explainer'
  | 'quote'
  | 'mythfact'
  | 'story'
  | 'clip'
  | 'slideshow'

export type Tone = 'bold' | 'friendly' | 'professional'
export type ThemeId = 'ink' | 'sunset' | 'paper' | 'neon'

export interface ReelConfig {
  types: ReelTypeId[]
  count: number
  /** Target length of each reel in seconds. */
  duration: 15 | 30 | 60
  tone: Tone
  theme: ThemeId
  cta: string
}

export interface Scene {
  kind: 'text' | 'video' | 'image'
  /** Seconds this scene stays on screen. */
  duration: number
  /** Small label above the heading, e.g. "01" or "MYTH". */
  label?: string
  heading?: string
  body?: string
  mediaUrl?: string
  /** Start offset inside the source video (video scenes). */
  start?: number
}

export interface Reel {
  id: string
  type: ReelTypeId
  title: string
  scenes: Scene[]
  caption: string
  hashtags: string[]
  theme: ThemeId
}
