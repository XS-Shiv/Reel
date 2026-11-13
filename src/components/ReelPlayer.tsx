import { useEffect, useMemo, useRef, useState } from 'react'
import type { Reel } from '../types'

interface Props {
  reel: Reel
  playing: boolean
  onPlayingChange: (playing: boolean) => void
}

/** 9:16 preview that plays a reel's scenes on a simple clock. */
export default function ReelPlayer({ reel, playing, onPlayingChange }: Props) {
  const [t, setT] = useState(0)
  const video = useRef<HTMLVideoElement>(null)

  const starts = useMemo(() => {
    let acc = 0
    return reel.scenes.map((s) => {
      const at = acc
      acc += s.duration
      return at
    })
  }, [reel])
  const total = starts[starts.length - 1] + reel.scenes[reel.scenes.length - 1].duration

  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      setT((prev) => prev + dt)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing])

  // Reached the end: stop and rewind.
  useEffect(() => {
    if (t >= total) {
      setT(0)
      onPlayingChange(false)
    }
  }, [t, total, onPlayingChange])

  const index = Math.max(0, starts.findLastIndex((s) => t >= s))
  const scene = reel.scenes[index]

  // Keep the <video> element in step with the scene clock.
  useEffect(() => {
    const el = video.current
    if (!el || scene.kind !== 'video') return
    if (playing) {
      const want = (scene.start ?? 0) + (t - starts[index])
      if (Math.abs(el.currentTime - want) > 0.4) el.currentTime = want
      void el.play().catch(() => {})
    } else {
      el.pause()
    }
    // Only re-sync on play/pause and scene changes, not every frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, index])

  return (
    <div
      className={`frame theme-${reel.theme} ${playing ? 'playing' : ''}`}
      onClick={() => onPlayingChange(!playing)}
      role="button"
      tabIndex={0}
      aria-label={`${playing ? 'Pause' : 'Play'} ${reel.title}`}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onPlayingChange(!playing))}
    >
      <div className="bars">
        {reel.scenes.map((s, i) => (
          <i key={i}>
            <b style={{ width: `${Math.min(1, Math.max(0, (t - starts[i]) / s.duration)) * 100}%` }} />
          </i>
        ))}
      </div>

      {scene.kind === 'video' && (
        <video ref={video} src={`${scene.mediaUrl}#t=${scene.start ?? 0}`} playsInline preload="metadata" />
      )}
      {scene.kind === 'image' && <img key={index} className="kenburns" src={scene.mediaUrl} alt="" style={{ animationDuration: `${scene.duration}s` }} />}

      <div key={index} className={`scene ${scene.kind}`}>
        {scene.label && <span className="label">{scene.label}</span>}
        {scene.heading && <p className={`heading ${scene.heading.length > 90 ? 'long' : ''}`}>{scene.heading}</p>}
        {scene.body && <p className="body">{scene.body}</p>}
      </div>

      {!playing && <div className="play">▶</div>}
    </div>
  )
}
