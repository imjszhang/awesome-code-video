# Code in motion — homepage visual

The full-width hero is a procedural Canvas 2D film behind a centered HTML heading and buttons. Its story is “code becomes video”: scrolling code generates screens along a curved arc; those screens fold into the concept’s hollow PLAY triangle; the triangle turns once, shrinks to a point, and that point opens into the final moving video. The black/gold palette, arc gallery and monumental triangle follow `work_dir/hero-play/concept.png`. No bitmap or video file is loaded by the live scene.

The 30-second loop shares its timing and geometry through `heroModel.ts`:

- **0–2 s**: source columns scroll in while empty screen slots appear on the arc.
- **2–9 s**: each source row highlights before its characters detach, leaving real gaps. Readable characters follow curved paths to a screen; landing pixels, a brief rim pulse and an upward scan reveal its moving image.
- **9–11 s**: the completed gallery holds, showing what the code generated.
- **11–14 s**: panels carry their imagery as they shrink, turn and flatten into separate strips along three edges of the still PLAY triangle; every panel has landed by 14 s. Its outline traces in from 12.2 s. No stack of enlarged screens covers the headline.
- **14–17 s**: the assembled, hollow triangle, with the concept’s parallel gold rails, turns exactly one full revolution clockwise about its centre. The turn eases in and out (quintic, zero speed and acceleration at both ends) and never reverses. The strips ride it and fade into the clean outline from 15.9 s. The triangle is equilateral and sized so its circumcircle stays 12 px inside the viewport, so the turn fits on phones.
- **17–18.3 s**: the triangle shrinks with one uniform scale about the same centre until it is a single point.
- **18.3–18.6 s**: the point holds as a brief pale core with a soft gold glow.
- **18.6–20.5 s**: the widescreen frame grows out of that point from the same centre, at a fixed 16:9 proportion. The triangle is never stretched into the rectangle. The moving image is clipped to the growing frame.
- **20.5–26 s**: procedural shots keep playing around the central copy, with subtle film-edge ticks and progress along the bottom rim.
- **26–30 s**: layers dissolve back to the opening; the frame at 30 seconds matches 0 seconds.

Below 760 px, four corner panels use the nearest top or bottom code band. `HeroMotion.tsx` retains pause/play and offscreen suspension. Reduced motion always selects the composed 22-second frame, including when the preference changes during playback. The static SVG fallback combines a subdued triangle with the final frame. This is decorative brand artwork, not an upstream resource preview.

## Text remains the subject

`HeroMotion.tsx` measures actual headline spans, paragraph lines, eyebrow text and individual buttons as canvas-relative CSS-pixel rectangles. These are cached after font readiness and layout changes using ResizeObserver; no DOM measurement occurs in the animation loop.

The bright scene layer has no hard exclusions. `drawCopyHalo` runs after the scene and typography and draws a cached feathered veil: a quarter-resolution black alpha mask where each measured text line or button contributes a smooth distance falloff (up to 120px around the headline), merged multiplicatively and capped at 84% dimming. The bilinear upscale of that coarse mask is the feather, so there are no rectangular edges or solid fills. The mask is rebuilt only when the viewport or measured rects change; each frame only draws it, with opacity rising slightly as the film brightens. A warm ring still frames the headline. Motion keeps flowing, subdued, behind the copy. The whole 920px copy container is never used as one large region.

## Scrolling code columns

`heroTypography.ts` draws source-code excerpts with indentation, line numbers and gold/ivory syntax colours. Lines physically scroll upward and wrap; new lines type in at the bottom and fade at the column edges.

- Desktop: 12.5 px main columns; at ≥1100 px, dimmer outer strips scroll more slowly for depth.
- Below 760 px: short top and bottom bands leave the central copy clear.
- Characters are selected only if their cells are visible at release, accounting for clipping, typing and feathering. Each flight starts at the real glyph center and lands using the panel’s pixel-space shear and rotation.
- Columns dim to 22% as the gallery folds, then recede over 24–28 seconds. Source gaps refill only after the code has disappeared.
- All layers use the same elapsed clock. Tokens and glyph metrics are prepared once; fragment metadata is rebuilt only on viewport changes. Pretext is unnecessary for these fixed-width code columns.

Reference: `work_dir/hero-play/concept.png`, with the [Cyber-Taoist](https://cyber-taoist.ai/) black/yellow identity.

## Archived illustration

The original illustration was generated with the built-in imagegen tool on 2026-10-28 and encoded as WebP without changing the composition. It belongs to the earlier enso-and-film design and is kept only as an archive; the current scene's reference is `work_dir/hero-play/concept.png`.

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


## Gallery depth refinement

Foreground panels retain the concept’s larger scale, shaded voxel faces, warm illumination and crisp edges. The merged video uses denser procedural imagery, a three-arm galaxy and a lighter central falloff so the moving image stays visible behind the page’s existing text veil. All visuals are generated by code.
