# Reel Forge

Upload content, pick the kinds of reels you want, get a set of 9:16 reels back.

**Status: v0.1** — the full flow works in the browser with a mock (heuristic) generator. No backend, no API key, nothing leaves your machine.

## Flow

1. **Upload** — paste text, or drop `.txt` / `.md` / `.pdf`, long videos, and images.
2. **Choose reel types** — formats, how many, length (15/30/60s), tone, visual style, closing call to action.
3. **Preview** — each reel plays in a 9:16 frame; copy its script or download everything as JSON.

## Reel types

| Type | Built from | What it is |
| --- | --- | --- |
| Hook + tips | text | Hook, then numbered takeaways |
| Explainer | text | One idea, step by step |
| Quote card | text | The most quotable line, big |
| Myth vs fact | text | Assumption, then the flip |
| Mini story | text | Setup, turn, takeaway |
| Highlight clip | video | Cuts from a long video with a title overlay |
| Photo slideshow | images | Images in sequence with slow motion |

## Run it

```bash
npm install
npm run dev     # http://localhost:5173
npm test        # generator tests
npm run build
```

## How it's put together

```
src/
  types.ts                 Source, ReelConfig, Reel, Scene
  lib/ingest.ts            files -> Source[] (text extraction, video duration, image URLs)
  lib/reelTypes.ts         catalog of reel types, tones, themes
  lib/generator/index.ts   ReelGenerator interface (the seam for a real model)
  lib/generator/mock.ts    heuristic generator used today
  components/              UploadStep, ConfigStep, ResultsStep, ReelPlayer
```

A reel is plain data: a list of timed scenes (`text`, `video`, `image`). The player just renders that data, so swapping the mock for an LLM, or later rendering MP4s from the same data, doesn't touch the UI.

See [docs/PRODUCT.md](docs/PRODUCT.md) for the product structure and roadmap.
