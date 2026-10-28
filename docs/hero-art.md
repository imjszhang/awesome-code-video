# Code in motion — homepage visual

The full-width hero is a procedural Canvas 2D film behind a centered HTML heading and buttons. It follows the original concept `work_dir/hero-play/concept.png`: a monumental hollow play triangle, a curved gallery of generative frames running from the lower-left foreground over the upper edge to the right, soft projector shafts and gold trails. The enso crescent is removed. No bitmap is loaded by the live scene.

The 24-second loop is staged so only one layer dominates at a time (`heroScene.ts`):

- **0–6 s**: the ribbon track draws in from darkness and generative frames (wave mesh, rotating torus, winding galaxy, assembling voxels) emerge one by one along it.
- **6–12 s**: frames sweep toward the ribbon ends and dim; particles leave the ribbon and assemble the hollow PLAY triangle, whose triple outline locks in.
- **12–18 s**: full composition. The triangle leads; only selected frames stay visible at reduced strength; `heroFilm.ts` adds two soft projector shafts; small gold cubes trail along the lower-right ribbon.
- **18–24 s**: shafts, then frames, then trails and the ribbon dissolve; the triangle scatters into particles last. The frame at 24 s equals 0 s.

Each frame's image is computed from time (rolling waves, spinning torus, winding spiral, voxels settling, wireframe surface, orbit rings), not faded from a still.

Cinematic layer (all procedural, periodic over 24 s):

- A slow camera push peaks at 12 s; foreground ribbon/frames get extra parallax, far frames are dimmer, and frames shear along the ribbon for perspective.
- Particles fly curved paths with ease-out arrival and a damped settle, drawn as short velocity streaks while moving (300 on mobile, 900 on desktop).
- The triangle gets a soft bloom underlay, vertex nodes, a tailed perimeter spark and one narrow light sweep at lock-in (12.2–13.6 s).
- Act 3 trails add comet streaks on the lower-right ribbon. `heroFilm.ts` adds faint haze bands and drifting dust that catches the projector shafts; `heroScene.ts` ends with an edge vignette for contrast.

`HeroMotion.tsx` retains pause/play, offscreen suspension and a composed 15-second reduced-motion frame. `heroTypography.ts` supplies subdued Pretext lettering at the desktop edges. The SVG fallback is still a simplified static play/gallery illustration from the preceding concept. The live artwork is decorative, not a preview of catalog resources.

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

Claude Code compared the original concept with the previous browser capture and increased foreground panel scale, added shaded voxel faces, warm inner panel illumination and stronger edge definition. The staged 24-second sequence remains unchanged. The Claude service timed out before its final report; the saved code passed `check:web`, and desktop/mobile composed-frame previews were checked afterward.
