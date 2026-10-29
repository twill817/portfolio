# PA.gov walkthrough video

Turns a voice-over take from the PA.gov voice-over studio into the case-study video.

The studio (a private claude.ai artifact) saves each take as a row in its `takes` collection: the recording's asset id, the slide timings in `marks` (seconds, one per cue, starting at 0) and the recording's `duration`.

## Render a take

1. Pull the newest row from `takes` and download its `audio` asset.
2. `python3 build_slides.py` (writes `slides/`, from the site's own images plus `src/`).
3. `python3 render.py take.json recording.m4a out/`

`out/` gets `pa-walkthrough.mp4` (1080p H.264, loudness-normalized), `pa-walkthrough.vtt` (captions), `pa-walkthrough-poster.webp` and `chapters.json` (chapter start times for the player).

## Changing the script

`cues.json` holds the script text, one entry per slide, with its chapter and its slow push (`motion`: start and end crop as `[x, y, width]`, fractions of a 16:9 slide). If the script changes, update `cues.json` here and the copy embedded in the studio page, then republish the studio.

Fonts are Schibsted Grotesk and Roboto (SIL Open Font License).
