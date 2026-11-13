import type { Reel, ReelConfig, Source } from '../../types'
import { mockGenerator } from './mock'

/**
 * Anything that can turn sources + config into reels.
 * The mock runs fully in the browser; an LLM-backed generator
 * (Claude, Gemini, ...) only has to implement this one method.
 */
export interface ReelGenerator {
  name: string
  generate(sources: Source[], config: ReelConfig): Promise<Reel[]>
}

export const generator: ReelGenerator = mockGenerator
