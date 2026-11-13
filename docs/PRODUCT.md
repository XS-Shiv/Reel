# Reel Forge — product structure

## The idea

Creators and teams sit on long-form content (articles, notes, decks, podcasts, lectures) that never becomes short-form because cutting it up is tedious. Reel Forge takes whatever you have, asks what kind of reels you want, and returns a ready set.

## User flow

1. **Upload** — one or more sources: pasted text, documents, long videos, images.
2. **Brief** — before anything is generated, the user chooses:
   - reel types (one or several; only types the uploaded content can support are enabled)
   - number of reels
   - length of each (15 / 30 / 60s)
   - tone (bold / friendly / professional)
   - visual style (theme)
   - closing call to action
3. **Generate** — content is segmented and each segment is poured into a reel type.
4. **Review** — play each reel in a 9:16 preview, copy the script, export.

## Core concepts

- **Source** — a normalised upload: `text` (with extracted text), `video` (URL + duration) or `image`.
- **ReelConfig** — the user's brief from step 2.
- **Reel** — title, caption, hashtags, theme and an ordered list of **Scenes**.
- **Scene** — a timed unit: text card, video segment (source + start offset) or image.
- **ReelGenerator** — `generate(sources, config) -> Reel[]`. The single seam between product and AI.

Because a reel is data rather than a video file, the same output drives the in-browser preview today and a video renderer later.

## What v0.1 does and doesn't do

Does: full upload → brief → preview flow, seven reel types, four themes, PDF text extraction, video clip previews, image slideshows, script copy, JSON export.

Doesn't yet:
- **Write real copy.** The mock generator reuses sentences from the source and fills templates. Hooks are formulaic and "Myth vs fact" uses a placeholder myth.
- **Find real highlights in video.** Clips are spaced evenly across the timeline; nothing is transcribed.
- **Export video.** Preview only.
- **Read `.docx` / `.pptx`, or URLs.**

## Roadmap

1. **Real generator** — implement `ReelGenerator` against an LLM (structured output matching `Reel`). Needs a small server or serverless function so the API key isn't in the browser.
2. **Video understanding** — transcribe uploaded video, let the model choose clip ranges, burn in captions.
3. **Editing** — edit scene text, reorder scenes, regenerate a single reel, per-reel theme.
4. **Export** — render MP4 (browser MediaRecorder first, server-side render later).
5. **More inputs** — `.docx`, `.pptx`, URL import, YouTube links.
6. **Accounts and history** — saved projects, brand kits (fonts, colours, logo).
