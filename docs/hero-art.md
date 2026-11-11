# The homepage reel

The hero's proof is a small player beside the heading: a code listing, a 16:9 stage and a timeline. The stage plays a six-second title sequence drawn on a Canvas 2D context. Nothing is recorded: each frame is computed from its frame number alone, which is the idea behind every resource in the catalog. No bitmap or video file is loaded.

## Four shots, 45 frames each

The loop runs at 30 frames per second for 180 frames. Shots cut hard, as in an edit.

| Frames | Shot | What is drawn |
| --- | --- | --- |
| 0–44 | `type` | “Good code.” typed in JetBrains Mono, one character every two frames, behind a yellow caret that blinks once the line is complete. |
| 45–89 | `chart` | A paper-coloured frame. A counter eases up to 292, the public resource count, while five bars spring in, staggered by three frames; the tallest is yellow with an ink outline. |
| 90–134 | `route` | A dotted grid, a dashed flight path from SFO to HND, a yellow line that traces it with an ease-in-out, and a distance counter. The arrival pin springs open at the end. |
| 135–179 | `title` | “Great video.” rises from behind its baseline; a yellow bar under it fills like playback progress until the loop restarts. |

The four shots stand in for the catalog's use cases: type and captions, data stories, maps and travel, and title cards.

## How it is built

`web/src/heroReel.ts` holds everything about the film: frame rate, shot lengths, easing curves, the listing and one draw function per shot. `drawReelFrame(ctx, frame)` keeps no state between calls, so playing, looping, pausing and scrubbing all draw the same image for the same frame. It draws in a fixed 960 × 540 space; the caller sets the transform for the canvas's real size.

`web/src/HeroMotion.tsx` owns the lifecycle. It waits for the two canvas fonts (with a 2.5 second limit), advances a clock with `requestAnimationFrame`, redraws only when the frame number changes, and mirrors that frame onto three things outside the canvas: the highlighted line in the listing, the playhead and shot label on the timeline, and the timecode. Those updates set one data attribute, one custom property and two values directly; React state changes only for play, pause and readiness.

The timeline is a native range input over the track, so it works with a pointer, touch and the arrow keys. Changing it holds that frame until Play is chosen.

## What the listing is

The code beside the stage is a ten-line sketch of the module: one call per shot, in playback order, with the real frame rate, length, text and chart values. It is not the literal source and is hidden from assistive technology, which gets the heading, the two controls and the caption instead.

## Rest states

- Before the canvas is ready, and when JavaScript or Canvas is unavailable, a server-rendered SVG shows the finished title at frame 165.
- With a reduced-motion preference the reel starts paused on that same frame, including when the preference changes during playback. The viewer can still press Play.
- Playback stops when the hero leaves the viewport or the tab is hidden.

This is decorative brand material. It is not an upstream resource preview, a screenshot, or evidence that any catalog resource renders.

## Archived illustration

The original illustration was generated with the built-in imagegen tool on 2026-10-28 and encoded as WebP without changing the composition. It belongs to the earlier enso-and-film design and is kept only as an archive; the homepage does not load it.

- Archived asset: `web/public/art/code-in-motion.webp` (1536 × 1024).
- Visual reference: [Cyber-Taoist](https://cyber-taoist.ai/), black and gold ink artwork, precise geometric guides, and organic brush textures.
- This is decorative brand artwork. It is not an upstream project preview or a verified render of any catalog resource.

## Generation prompt

```text
Use case: stylized-concept
Asset type: original homepage hero artwork for Awesome Code Video, part of the Cyber-Taoist visual identity.
Primary request: A sophisticated black-and-gold editorial illustration about turning code into moving images. An impossible ribbon of cinematic film frames spirals upward into a huge open circular brushstroke, with one luminous golden rectangular frame suspended at the center like a portal. In the foreground a small sculptural black rocky island grounds the composition. Subtle precise construction lines, fine circular orbit guides, registration ticks and tiny golden points connect the organic ink gesture to computational geometry.
Style/medium: tactile ink-brush and screenprint collage, engraved fine detail, worn gold pigment on pure matte black, Japanese contemporary editorial art, confident asymmetry, deeply dark and restrained. Organic and technical together.
Composition/framing: landscape 3:2, hero subject centered and occupies 80% with generous pure black edges all around, all key artwork inside frame. Eye-level slightly elevated view, floating film ribbon bends gracefully from lower left toward upper right, strong open circle surrounding negative space.
Color palette: pure black #000000 background (must match black website seamlessly); golden yellow #FCD228; small warm gray highlights only. No other colors. Flat yellow ink, not shiny metallic gradients.
Constraints: no people, no letters, no words, no numbers, no logo, no watermark, no interface, no mockup, no border. This is a brand illustration, not a resource screenshot. Crisp detail at large size.
```
