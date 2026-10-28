# Preview audit — 2026-10-28

The local homepage had 87 MP4 covers loading successfully, but 59 image/animation previews still hotlinked their original hosts, and seven external-page entries had no image. These latter entries were responsible for the remaining blank/placeholder areas.

## Corrections

- All 87 MP4 URLs returned MP4 file headers matching the cached source, with unchanged file sizes. ffprobe identified H.264 video streams for all 87. Each poster is bound to that exact source URL, capture time and byte hashes in `data/preview-posters.json`. This verifies source identity and media format, not complete playback of every film on every browser.
- 58 image/animation entries now use bundled static WebP covers, with source hashes and selected animation frames in `data/image-preview-posters.json`. Clicking a cover opens its original upstream image or animation. The full animations are not bundled.
- Five Motion Canvas YouTube entries now use the thumbnail returned by YouTube oEmbed. Official titles matched: “Motion Canvas is now Open Source!”, “Could This Asset Be Code?”, “One Year of Motion Canvas”, “Smooth Parallax - Pixel Renderer Devlog #2”, and “Deferred Lights - Pixel Renderer Devlog #1”.
- Manim Community and OneTake use their own official website share images. These remain external-page previews, not playable video files. Page/image provenance is in `data/page-preview-posters.json`.
- Removed the incorrect preview from **Night Location**. It reused `radiate_dark.webp`, which is the Radial Coverage demo; the original source note admitted the pairing was unconfirmed. The current upstream `docs/media` directory has no matching night-location export. The resource remains in the library, but no longer appears in the preview gallery. Radial Coverage retains its correct preview.
- MP4 players retain their poster while a remote video loads, instead of displaying an empty player over the cover.

The gallery now has 152 source-backed previews: 87 MP4s, 58 images/animations, and seven external pages. All have bundled cover files. The catalog still contains 162 resources. Existing source-review notes describe earlier review conditions; the manifests record the subsequently extracted local stills. Neither a thumbnail nor a source review certifies a successful local render.
