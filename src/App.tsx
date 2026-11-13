import { useState } from 'react'
import type { Reel, ReelConfig, Source } from './types'
import { generator } from './lib/generator'
import UploadStep from './components/UploadStep'
import ConfigStep from './components/ConfigStep'
import ResultsStep from './components/ResultsStep'

type Step = 'upload' | 'config' | 'generating' | 'results'

const STEPS: { id: Step; label: string }[] = [
  { id: 'upload', label: 'Upload' },
  { id: 'config', label: 'Choose reel types' },
  { id: 'results', label: 'Preview reels' },
]

const DEFAULT_CONFIG: ReelConfig = {
  types: [],
  count: 4,
  duration: 30,
  tone: 'bold',
  theme: 'ink',
  cta: 'Follow for more',
}

export default function App() {
  const [step, setStep] = useState<Step>('upload')
  const [sources, setSources] = useState<Source[]>([])
  const [config, setConfig] = useState<ReelConfig>(DEFAULT_CONFIG)
  const [reels, setReels] = useState<Reel[]>([])

  const generate = async () => {
    setStep('generating')
    setReels(await generator.generate(sources, config))
    setStep('results')
  }

  const reset = () => {
    sources.forEach((s) => s.url && URL.revokeObjectURL(s.url))
    setSources([])
    setReels([])
    setConfig(DEFAULT_CONFIG)
    setStep('upload')
  }

  const current = step === 'generating' ? 'config' : step
  const currentIndex = STEPS.findIndex((s) => s.id === current)

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          Reel<em>Forge</em>
        </div>
        <ol className="steps">
          {STEPS.map((s, i) => (
            <li key={s.id} className={i === currentIndex ? 'on' : i < currentIndex ? 'done' : ''}>
              <span>{i + 1}</span>
              {s.label}
            </li>
          ))}
        </ol>
      </header>

      <main>
        {step === 'upload' && <UploadStep sources={sources} onChange={setSources} onNext={() => setStep('config')} />}
        {step === 'config' && (
          <ConfigStep sources={sources} config={config} onChange={setConfig} onBack={() => setStep('upload')} onGenerate={generate} />
        )}
        {step === 'generating' && (
          <div className="generating" role="status">
            <div className="pulse" />
            <h2>Cutting your content into reels…</h2>
            <p>Using: {generator.name}</p>
          </div>
        )}
        {step === 'results' && <ResultsStep reels={reels} onBack={() => setStep('config')} onReset={reset} />}
      </main>
    </div>
  )
}
