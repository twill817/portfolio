# Case-study walkthroughs

Narrated slide videos for the portfolio's case studies. Each case study has its own folder here; the renderer and fonts are shared.

```
walkthroughs/
  render.py        turns a saved voice-over take into the video, captions, poster and chapters
  fonts/           Schibsted Grotesk and Roboto (SIL Open Font License)
  pa-gov/          one folder per case study
    cues.json      slide list: id, chapter, slide image, slow-push motion, card flag, output name
    build_slides.py  draws the 16:9 slides into slides/ from the site's images and src/
    src/           source images not already in assets/img
```

## The studio

Narration is recorded with the Walkthrough Studio, a private claude.ai artifact. Each case study is a row in its `projects` collection (title, chapters, and per slide: id, chapter, slide image name, script text), with its slide images published at `slides/<case-study>/<slide>.webp`. The script can be edited in the studio itself.

Each saved take is a row in `takes`: the case study (`project`; takes saved before case studies existed have none and belong to `pa-gov`), the recording's asset id, the slide timings in `marks` (seconds, one per slide, starting at 0), the recording's `duration`, and the `script` exactly as it was read.

## Render a take

1. Pull the take's row from `takes` into `take.json` and download its `audio` asset.
2. `python3 build_slides.py` inside the case study's folder.
3. `python3 render.py <case-study> take.json recording out/`

`out/` gets `<name>.mp4` (1080p H.264, loudness-normalized), `<name>.vtt`, `<name>-poster.webp` and `chapters.json`. Captions follow the script saved with the take; slides, motion and text cards come from `cues.json`.

## Add a case study

1. Make a folder with `cues.json` and `build_slides.py`, and build the slides.
2. Publish the slide `.webp` files to the studio under `slides/<case-study>/`.
3. Add a `projects/<case-study>` row with its title, `order`, chapters and cues. It shows up in the studio's picker.

If the slide list changes, update `cues.json` and the studio row together; a take only renders against the slide list it was marked for. Bump `slidesVersion` on the row when slide images change.
