# Awesome Code Video [![Awesome](https://awesome.re/badge.svg)](https://awesome.re)

<a href="https://github.com/imjszhang/awesome-code-video"><img src="assets/code-video.svg" alt="Code brackets surrounding a video play symbol" align="right" width="128" height="128"></a>

> Reusable visual styles, shot recipes, and editable templates for making videos with code.

**English** · [简体中文](README.zh-CN.md)

Code video, also called **programmatic video** or **video as code**, uses HTML, Canvas, SVG, React, TypeScript, or Python to compose and render moving images. This list focuses on reusable parts: a product-launch film you can adapt, a camera move you can integrate, or a visual style you can use to direct a new film.

Find **video templates, motion graphics, product demos, explainers, data stories, and map animations**, with specific source links and practical reuse notes. The list contains 33 reusable examples, recipes, and styles, plus a small set of supporting frameworks and workflows. Resources were reviewed through their source files and documentation; inclusion does not mean each project has been installed or render-tested.

## Contents

- [Start Here](#start-here)
- [Film and Scene Templates](#film-and-scene-templates)
- [Map Animation Presets](#map-animation-presets)
- [Shot Recipes](#shot-recipes)
- [Visual Style Templates](#visual-style-templates)
- [Frameworks and Renderers](#frameworks-and-renderers)
- [Production Workflows](#production-workflows)

## Start Here

| Make this                          | Start with    | What you reuse                                                   |
| ---------------------------------- | ------------- | ---------------------------------------------------------------- |
| A SaaS or knowledge-product launch | Ink Press     | A complete film project with an established sequence and timing. |
| A paper-collage explainer          | Paper-Cut     | A layered scene and its animation timeline.                      |
| A travel or location story         | Map presets   | Configurable location, route, and flight examples.               |
| A product feature demonstration    | Shot recipes  | Individual shots with implementation references.                 |
| A whiteboard or data explainer     | Visual styles | Art direction and production instructions for a new film.        |
| A pixel-art narrative              | Claude Quest  | A worked film project and a retro game engine.                   |

**Project** means editable source, often with substantial adaptation. **Preset** means a parameterized example. **Recipe** means a shot and implementation you integrate into your own timeline. **Style** means instructions for creating a new film, rather than a ready-made render project. None of these labels promises one-click output.

## Film and Scene Templates

Complete projects and self-contained scenes with editable source.

- [Ink Press](https://github.com/Vincentwei1021/video-shotcraft/tree/main/template) - Warm paper, ink typography, and amber accents for SaaS, research tools, and knowledge-product launches. A 36.2-second, ten-shot Remotion project with title cards, page-camera moves, captions, and timed sound effects. Replace screenshots, element crops, copy, branding, and page coordinates; adapt camera framing to the new interface. The documented version is 1080p at 30 fps with sound effects and no background music.
- [Paper-Cut Five-Layer Motion](https://github.com/HeiGeAi/Paper-Cut/tree/main/examples/five-layer-motion) - Editorial paper collage, torn edges, print texture, and layered parallax for history, people, and concept explainers. A 20-second silent HyperFrames / GSAP scene with assembly, separation, collision, and recomposition. Replace the artwork and derived layers; extraction masks are tied to the original image and must be adjusted for new compositions.
- [Butterfly Life](https://github.com/kuhnhomeuk-cell/procedural-film/tree/main/examples/butterfly-life) - Procedural natural-science animation for lifecycle and process explainers. A 32-second, 17-shot vertical film with source, planning documents, music, and rendering tools. Reuse the production structure; changing the subject requires adapting drawing and scene code.
- [Claude Quest](https://github.com/kuhnhomeuk-cell/procedural-film/tree/main/examples/claude-quest-v2) - NES-style pixel art, a simulated CRT, and chip music for game narratives, progress metaphors, and playful technical stories. A worked film driven by a game engine and recorded controller input. Reuse the engine and presentation; adapt characters, levels, and the input sequence for a new story.

See the [practical reuse guide](docs/reuse-guide.md) for what to replace and where the adaptation work sits.

## Map Animation Presets

These [map-motion](https://github.com/SpaceZephyr/map-motion) JSON examples provide a more direct starting point than a general rendering framework. Change the location or route, labels, timing, and supported style settings. Some modes need map-provider credentials or additional geographic data.

- [Globe-to-Location](https://github.com/SpaceZephyr/map-motion/blob/main/assets/examples/vlog_locate.json) - A globe-to-place camera move with location labeling for travel openings, city introductions, and event context.
- [Night Location](https://github.com/SpaceZephyr/map-motion/blob/main/assets/examples/vlog_locate_night.json) - A dark map treatment for night travel, urban stories, and technology-oriented location sequences.
- [Hiking Elevation](https://github.com/SpaceZephyr/map-motion/blob/main/assets/examples/hike_elevation.json) - Route progression and elevation information for hiking recaps, mountain itineraries, and outdoor explainers.
- [Road Trip](https://github.com/SpaceZephyr/map-motion/blob/main/assets/examples/road_trip.json) - A multi-stop journey for road-trip recaps, regional guides, and travel itineraries.
- [Flight Routes](https://github.com/SpaceZephyr/map-motion/blob/main/assets/examples/flight.json) - Flight connections for aviation stories, international journeys, and geographic business introductions.
- [Radial Coverage](https://github.com/SpaceZephyr/map-motion/blob/main/assets/examples/radiate.json) - Connections radiating from a center for service coverage, distribution networks, and regional reach.

## Shot Recipes

These [video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft) cards have corresponding Remotion demo implementations in the repository. They are building blocks for a film, rather than complete films. The [gallery](https://vincentwei1021.github.io/video-shotcraft/) helps you choose a move visually; the [demo integration guide](https://github.com/Vincentwei1021/video-shotcraft/blob/main/demos/README.md) explains how to use the code.

- [Text as Mask](https://github.com/Vincentwei1021/video-shotcraft/blob/main/references/shots/opening/text-as-mask.md) - Product imagery revealed through oversized letterforms for brand openings and feature reveals. Replace the title and background imagery.
- [Space Camera Moves](https://github.com/Vincentwei1021/video-shotcraft/blob/main/references/shots/camera/space-camera-moves.md) - Spatial camera treatments for interfaces and layered layouts. Useful for product structure and screen tours; adapt the scene layers and camera framing.
- [Deck Deal Fly-In](https://github.com/Vincentwei1021/video-shotcraft/blob/main/references/shots/ui-entrance/deck-deal-flyin.md) - Cards dealt into a layout for libraries, research collections, dashboards, and feature groups. Replace card contents and destination positions.
- [Type and Filter](https://github.com/Vincentwei1021/video-shotcraft/blob/main/references/shots/interaction/type-and-filter.md) - An input-and-results sequence for search tools, knowledge management, and AI assistants. Replace the query, results, and interface styling.
- [Paper Title Card](https://github.com/Vincentwei1021/video-shotcraft/blob/main/references/shots/typography/paper-title-card.md) - Paper-toned typography for value propositions, chapter breaks, and explanatory pauses. Replace the copy, fonts, and accent palette.
- [Document Typewriter Reveal](https://github.com/Vincentwei1021/video-shotcraft/blob/main/references/shots/typography/document-typewriter-reveal.md) - Document content appearing as if written for AI writing, reports, and note-taking demonstrations. Replace the document and its reveal sequence.
- [Chart Live Moves](https://github.com/Vincentwei1021/video-shotcraft/blob/main/references/shots/data/chart-live-moves.md) - Animated chart treatments for research findings, metric changes, and data explanations. Replace the underlying data, labels, and visual scale.
- [UI to Brand Morph](https://github.com/Vincentwei1021/video-shotcraft/blob/main/references/shots/outro/ui-to-brand-morph.md) - Interface elements resolving into a brand ending for product promos and feature demos. Adapt the source geometry, wordmark, and final hold.

The following Webreel examples record scripted browser interactions. Each includes a local demo page and editable recording configuration; replace both for a different product.

- [Custom Cursor and Keystroke HUD](https://github.com/vercel-labs/webreel/tree/main/examples/custom-theme) - A code-editor browser demo with a custom SVG cursor and a dark monospace keystroke overlay for developer-tool walkthroughs. Reuse the local page and scripted clicks; replace the cursor, HUD theme, interface, selectors, and timing.
- [Kanban Drag and Drop](https://github.com/vercel-labs/webreel/tree/main/examples/drag-and-drop) - A scripted kanban-board demo showing cards moving between columns for task managers and workflow tutorials. Reuse the example page and drag steps; adapt card content, selectors, destinations, and pauses to your interface.
- [Mobile Menu and Scroll](https://github.com/vercel-labs/webreel/tree/main/examples/mobile-viewport) - A portrait browser walkthrough at a 390 by 844 viewport with menu opening, dismissal, and scrolling for mobile web demos and onboarding clips. Reuse the local interface and action sequence; replace the page, selectors, viewport, and timing.

## Visual Style Templates

These [Lemo-Opuscar](https://github.com/lemomo-ai/lemo-opuscar) styles provide concrete `STYLE.md` files and demonstration films in the [style gallery](https://lemomo-ai.github.io/lemo-opuscar/). They are reusable art-direction and production instructions for a coding agent. A new subject still needs a script, assets, scene construction, and rendering; model-dependent reproduction can vary.

- [Swiss Motion Graphics](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/swiss-motion/STYLE.md) - Grid-based composition, large type, geometry, and restrained color for brand statements, design lessons, and concept explainers.
- [Dark Tech Keynote](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/dark-keynote/STYLE.md) - Dark presentation surfaces and focused product staging for software launches, AI tools, and technical announcements.
- [Whiteboard Explainer](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/whiteboard/STYLE.md) - Progressively drawn diagrams for teaching, mental models, and step-by-step explanations.
- [Data Storytelling](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/dataviz/STYLE.md) - Numbers and charts structured around a narrative for trends, research findings, and annual recaps.
- [Isometric Infographic](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/iso-infographic/STYLE.md) - Isometric spatial diagrams for systems, workflows, and supply-chain explanations.
- [Caption News](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/caption-news/STYLE.md) - Caption-led information design for news briefs, AI updates, and silent-friendly social videos.
- [Halftone Dossier](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/halftone-dossier/STYLE.md) - Print grain and archival dossier styling for history, investigations, and profile explainers.
- [Chinese Ink Wash](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/ink-wash/STYLE.md) - Ink diffusion and negative space for cultural stories, poetry, and heritage-oriented films.
- [Paper Pop-Up Book](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/paper-popup/STYLE.md) - Layered paper structures for children's explanations, illustrated narratives, and warm product stories.
- [ASCII / CRT Terminal](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/ascii-crt/STYLE.md) - Character-based imagery and retro terminal aesthetics for programming, developer tools, and computing history.
- [Blueprint](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/blueprint/STYLE.md) - Technical drawing and measurement cues for engineering, structural explanations, and invention stories.
- [16-bit Pixel RPG](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/pixel-rpg/STYLE.md) - Pixel characters and game-world storytelling for learning journeys, progress narratives, and retro shorts.

## Frameworks and Renderers

These are foundations for composing or rendering your own work. They are not included in the 33 reusable examples above.

- [HyperFrames](https://github.com/heygen-com/hyperframes) - HTML-based video composition and rendering for browser-oriented motion design and agent-authored scenes.
- [Remotion](https://github.com/remotion-dev/remotion) - React-based video composition and rendering for parameterized templates, product films, and data-driven videos; consult its [commercial licensing terms](https://www.remotion.dev/docs/license).
- [Motion Canvas](https://motioncanvas.io/) - TypeScript animation with a visual preview workflow for explanatory videos and synchronized motion.
- [Manim Community](https://www.manim.community/) - Python animation for mathematical diagrams, scientific explanations, and technical teaching.

## Production Workflows

Useful when you want a method or reusable motion primitives rather than a fixed finished-film template.

- [guizang-product-video-skill](https://github.com/op7418/guizang-product-video-skill) - Product-specific promotional video workflow that builds on real interface components, branding, typography, and a composed timeline. Suitable when the visual direction should come from the product rather than a fixed template.
- [OneTake](https://github.com/feitangyuan/onetake) - Continuous-shot motion library, composition starter, and case breakdowns for connected product demonstrations. The free repository excludes the showcased films' source code and uses a noncommercial license; commercial access is offered separately.
- [llm-explain](https://github.com/Gohanwu42/llm-explain) - Explainer workflow with an optional Python and FFmpeg assembler that combines local still images, narration, and captions into an MP4 with a synchronized SRT file. Useful for narrated concept slides; supply the images and audio yourself and adapt the storyboard.
- [Remotion Agent Skills](https://github.com/remotion-dev/skills) - Official agent guidance for creating, previewing, and rendering Remotion videos, with topic-specific references for captions, maps, and multimedia. Useful for building custom React video workflows; choose your own visual direction and consult Remotion licensing terms.

## Related Lists

- [Awesome Video as Code](https://github.com/voidforall/awesome-video-as-code) - Broader coverage of agent-directed tools, production workflows, showcases, and research.
- [Awesome Video Skills](https://github.com/AaronAust1n/awesome-video-skills) - Broader coverage of video-making tools, frameworks, skills, and automation workflows.

## Contributing

Suggest a useful resource or improve an existing entry through a pull request. The [catalog maintenance guide](docs/catalog-maintenance.md) covers local duplicate lookup, candidate decisions, and evidence checks. Read the [contribution guidelines](contributing.md) for the evidence, reuse notes, and formatting to include.

## Footnotes

[Selection and review notes](docs/selection.md) explain the scope, evidence level, and first-edition provenance. The English README is the canonical version; translations follow it.

Project code, example footage, audio, fonts, map data, and generated outputs retain their own terms. A listing is not a blanket permission to redistribute assets or use every dependency commercially.
