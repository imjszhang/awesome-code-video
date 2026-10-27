# Awesome Code Video [![Awesome](https://awesome.re/badge.svg)](https://awesome.re)

<a href="https://github.com/imjszhang/awesome-code-video"><img src="assets/code-video.svg" alt="Code brackets surrounding a video play symbol" align="right" width="128" height="128"></a>

> Reusable visual styles, shot recipes, and editable templates for making videos with code.

**English** · [简体中文](README.zh-CN.md)

Code video, also called **programmatic video** or **video as code**, uses HTML, Canvas, SVG, React, TypeScript, or Python to compose and render moving images. This list focuses on reusable parts: a product-launch film you can adapt, a camera move you can integrate, or a visual style you can use to direct a new film.

Find **video templates, motion graphics, product demos, explainers, data stories, and map animations**, with specific source links and practical reuse notes. The list contains 63 reusable examples, recipes, and styles, plus a small set of supporting frameworks and workflows. Resources were reviewed through their source files and documentation; inclusion does not mean each project has been installed or render-tested.

## Contents

- [Start Here](#start-here)
- [Film and Scene Templates](#film-and-scene-templates)
- [Map Animation Presets](#map-animation-presets)
- [Shot Recipes](#shot-recipes)
- [Visual Style Templates](#visual-style-templates)
- [Frameworks and Renderers](#frameworks-and-renderers)
- [Motion Design Tools](#motion-design-tools)
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
- [Isometric Ripple Tank](https://github.com/wheresryan22/anatomy/tree/main/examples/ripple-tank) - An isometric laboratory scene combining SVG apparatus and WebGL water patterns for wave-interference explainers. Reuse the Node build script, light or dark page, and frequency/spacing controls. Adapt the model, labels, and interaction sequence; add browser recording or a controlled video timeline and audio. The example outputs HTML, not an MP4.

- [Podcast Audiogram](https://github.com/remotion-dev/remotion/tree/main/packages/template-audiogram) - Audio waveforms and synchronized captions for podcast excerpts and interview highlights. Reuse the Remotion composition and audio-driven duration; replace audio, caption data, and visualizer settings. Review the Remotion license for your organization before production.
- [Code Hike Transitions](https://github.com/remotion-dev/remotion/tree/main/packages/template-code-hike) - Animated syntax-highlighted code with token transitions and annotations for programming tutorials and refactoring walkthroughs. Reuse the frame-driven Remotion scene; replace code snippets, themes, annotations, and pacing. Review the Remotion license for your organization before production.
- [Word-Highlighted Captions](https://github.com/remotion-dev/remotion/tree/main/packages/template-tiktok) - Bold outlined captions with active-word highlighting and animated entrances for talking-head clips and social explainers. Reuse the captioned-video composition; replace footage, captions, fonts, and placement. Adapt transcription settings for your language and review the Remotion license before production.

- [Testimonial Neon Split](https://github.com/linda-mhmd/freelancer-templates.org/blob/main/src/remotion/templates/testimonial/Testimonial.tsx) - A theme-aware Remotion testimonial composition with centered, split, and editorial layouts for client quotes and social proof. Reuse Testimonial.tsx and its layout props; the site hero variant is Neon Split. Replace the quote, client, and call to action. The site states CC-BY-NC-SA 4.0, the GitHub license field is empty, and the hero MP4 must not be mirrored. Remotion's runtime license is separate.
- [Proposal Dark Executive](https://github.com/linda-mhmd/freelancer-templates.org/blob/main/src/remotion/templates/proposal/Proposal.tsx) - A Remotion proposal composition for scope, timeline, and pricing pitches. Reuse Proposal.tsx and theme props; the listed hero variant is Dark Executive. Replace the pitch copy and figures. The site states CC-BY-NC-SA 4.0, the GitHub license field is empty, and the hero MP4 must not be mirrored. Remotion's runtime license is separate.
- [Event Neon Countdown](https://github.com/linda-mhmd/freelancer-templates.org/blob/main/src/remotion/templates/event/Event.tsx) - A Remotion event composition for hero banners, speaker cards, and countdowns. Reuse Event.tsx and theme props; the listed hero variant is Neon Countdown. Replace the event name, schedule, and speakers. The site states CC-BY-NC-SA 4.0, the GitHub license field is empty, and the hero MP4 must not be mirrored. Remotion's runtime license is separate.
- [Explainer Dark Cinematic](https://github.com/linda-mhmd/freelancer-templates.org/blob/main/src/remotion/templates/explainer/Explainer.tsx) - A Remotion explainer composition for product walkthroughs and feature breakdowns. Reuse Explainer.tsx and theme props; the listed hero variant is Dark Cinematic. Replace the product steps and copy. The site states CC-BY-NC-SA 4.0, the GitHub license field is empty, and the hero MP4 must not be mirrored. Remotion's runtime license is separate.
- [Case Study Neon Spotlight](https://github.com/linda-mhmd/freelancer-templates.org/blob/main/src/remotion/templates/casestudy/CaseStudy.tsx) - A Remotion case-study composition for before-and-after stories and result callouts. Reuse CaseStudy.tsx and theme props; the listed hero variant is Neon Spotlight. Replace the client story and metrics. The site states CC-BY-NC-SA 4.0, the GitHub license field is empty, and the hero MP4 must not be mirrored. Remotion's runtime license is separate.
- [Course Promo Dark Overview](https://github.com/linda-mhmd/freelancer-templates.org/blob/main/src/remotion/templates/coursepromo/CoursePromo.tsx) - A Remotion course-promo composition for curriculum, instructor, and overview layouts. Reuse CoursePromo.tsx and theme props; the listed hero variant is Dark Overview. Replace the course outline and instructor details. The site states CC-BY-NC-SA 4.0, the GitHub license field is empty, and the hero MP4 must not be mirrored. Remotion's runtime license is separate.
- [Recap Neon Timeline](https://github.com/linda-mhmd/freelancer-templates.org/blob/main/src/remotion/templates/recap/Recap.tsx) - A Remotion recap composition for dashboards, cards, and project timelines. Reuse Recap.tsx and theme props; the listed hero variant is Neon Timeline. Replace the milestones and metrics. The site states CC-BY-NC-SA 4.0, the GitHub license field is empty, and the hero MP4 must not be mirrored. Remotion's runtime license is separate.
- [Tutorial Dark Numbered Steps](https://github.com/linda-mhmd/freelancer-templates.org/blob/main/src/remotion/templates/tutorial/Tutorial.tsx) - A Remotion tutorial composition for numbered steps, card sequences, and split demos. Reuse Tutorial.tsx and theme props; the listed hero variant is Dark Numbered Steps. Replace the steps and interface. The site states CC-BY-NC-SA 4.0, the GitHub license field is empty, and the hero MP4 must not be mirrored. Remotion's runtime license is separate.
- [KPI Counter](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/kpi-counter/KpiCounter.tsx) - A self-contained Remotion composition that counts KPI figures on staggered cards. The README documents it as 1920 by 1080 and 4 seconds, and KpiCounter.tsx sets 120 frames at 30 fps. Reuse the component and its typed props, and keep the MIT notice. The linked GIF is an animated preview, not an MP4 master, and Remotion's runtime license is separate.
- [Animated Bar Chart](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/bar-chart-anim/BarChartAnim.tsx) - A self-contained Remotion composition that grows bars to a data series. The README documents it as 1920 by 1080 and 5 seconds. Reuse BarChartAnim.tsx and its props, and keep the MIT notice. The linked GIF is an animated preview, not an MP4 master, and Remotion's runtime license is separate.
- [Glitch Text](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/glitch-text/GlitchText.tsx) - A self-contained Remotion title composition that splits and then settles glitch text. The README documents it as 1920 by 1080 and 4 seconds. Reuse GlitchText.tsx and its props, and keep the MIT notice. The linked GIF is an animated preview, not an MP4 master, and Remotion's runtime license is separate.
- [Logo Blur Reveal](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/logo-blur-reveal/LogoBlurReveal.tsx) - A self-contained Remotion composition that sharpens a logo out of blur. The README documents it as 1920 by 1080 and 4 seconds. Reuse LogoBlurReveal.tsx and its props, and keep the MIT notice. The linked GIF is an animated preview, not an MP4 master, and Remotion's runtime license is separate.
- [Typewriter](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/typewriter/Typewriter.tsx) - A self-contained square Remotion composition that types copy with a cursor. The README documents it as 1080 by 1080 and about 3.3 seconds. Reuse Typewriter.tsx and its props, and keep the MIT notice. The linked GIF is an animated preview, not an MP4 master, and Remotion's runtime license is separate.
- [Racing Bar Chart](https://github.com/RenderComp/free-remotion-templates/blob/main/src/components/racing-chart/RacingChart.tsx) - A self-contained Remotion composition that reranks bars as values change. The README documents it as 1920 by 1080 and 7 seconds. Reuse RacingChart.tsx and its props, and keep the MIT notice. The linked GIF is an animated preview, not an MP4 master, and Remotion's runtime license is separate.
- [Unspar Product Demo](https://github.com/vincentsch/explainroo/tree/main/examples/unspar-demo) - An explainroo product-demo example with script.md, scenes.js, and video.json for a clean YouTube-size Unspar walkthrough. Reuse that example structure and replace the product, brand, and script. The repository is MIT, but the site-hosted MP4 is not in the repository and is not marked redistributable.
- [What an API Does](https://www.explainroo.com/videos/what-an-api-does) - A published explainroo example page about what an API does, with a site-hosted MP4. The public examples directory has no script.md or scenes.js for this slug, so adapt the explainroo workflow instead of treating the film as included source. The repository is MIT; the hosted MP4 is not marked redistributable.
- [How Compound Interest Works](https://www.explainroo.com/videos/how-compound-interest-works) - A published explainroo example page about compound interest, with a site-hosted MP4. The public examples directory has no script.md or scenes.js for this slug, so adapt the explainroo workflow instead of treating the film as included source. The repository is MIT; the hosted MP4 is not marked redistributable.
- [ChatGPT Demo](https://www.explainroo.com/videos/chatgpt-demo) - A published explainroo product-demo page for a ChatGPT-style walkthrough, with a site-hosted MP4. The public examples directory has no script.md or scenes.js for this slug, so adapt the explainroo workflow instead of treating the film as included source. The repository is MIT; the hosted MP4 is not marked redistributable.
- [Zero to Product Video Hero](https://github.com/specstoryai/zero-to-product-video-hero/tree/main/example) - A Remotion product-hero example with scene components under example/src and a committed example/out/video.mp4. example/src/Root.tsx registers a 1920 by 1080, 30 fps composition; the README also describes a longer hero cut that was not measured here. Reuse the example and keep the MIT notice. Remotion's runtime license is separate.
- [Prompt to Video](https://www.remotion.dev/templates/prompt-to-video) - An official Remotion template that turns a prompt into a vertical story with generated images, voiceover, and a timeline. Reuse the template repository and supply OpenAI and ElevenLabs credentials. The template repository has no license file, so its terms are unconfirmed; the preview is only a thumbnail link and must not be copied. Review the Remotion license before production.

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

This browser animation component needs recording or timeline adaptation for video use.

- [Staggered Line Reveal](https://github.com/Subhan-code/Amicro--Micro-transitions-/blob/main/registry/ui/text/text-reveal.tsx) - Lines slide upward through clipped masks with a staggered reveal for titles, feature statements, and chapter cards. Reuse the React component and its duration and stagger controls. It uses Framer Motion and viewport-triggered playback; add browser recording or replace the trigger with frame-based timing for video rendering.

These HyperFrames blocks expose editable HTML and paused animation timelines.

- [Editorial Data Chart](https://github.com/heygen-com/hyperframes/tree/main/registry/blocks/data-chart) - Warm paper, serif headings, animated bars, and a traced line for business metrics and data explainers. Reuse a 15-second HTML/SVG composition with a paused GSAP timeline; replace data arrays, scales, labels, and source attribution, then integrate it into a HyperFrames film.
- [YouTube Subscribe Lower Third](https://github.com/heygen-com/hyperframes/tree/main/registry/blocks/yt-lower-third) - A sliding channel card and springy subscribe-button animation for creator introductions and calls to action. Reuse the 4.5-second HTML overlay and paused GSAP timeline; replace the avatar, channel text, counts, and styling, then compose it over your footage.

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

- [Watercolor Brush](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/watercolor/STYLE.md) - Translucent brush marks on warm paper for nature, travel, and science stories. Reuse the style specification, seeded brush construction, and paint-on approach; create new artwork and timing. This is production guidance, not a complete film.
- [Exploded Teardown](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/teardown/STYLE.md) - Studio-lit engineering parts, exploded layers, and macro camera moves for hardware launches and construction explainers. Reuse the style specification and assembly choreography; supply accurate CAD or PCB geometry, materials, labels, and appropriately licensed assets.
- [Engineering Briefing Board](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/briefing-board/STYLE.md) - A physical markerboard with photo cutouts, magnetic labels, and line-following camera moves for engineering comparisons and decision briefings. Reuse the board composition rules and drawing kit; replace photographs, annotations, and evidence, then build a new timeline.

## Frameworks and Renderers

These are foundations for composing or rendering your own work. They are not included in the 63 reusable examples above.

- [HyperFrames](https://github.com/heygen-com/hyperframes) - HTML-based video composition and rendering for browser-oriented motion design and agent-authored scenes.
- [Remotion](https://github.com/remotion-dev/remotion) - React-based video composition and rendering for parameterized templates, product films, and data-driven videos; consult its [commercial licensing terms](https://www.remotion.dev/docs/license).
- [Motion Canvas](https://motioncanvas.io/) - TypeScript animation with a visual preview workflow for explanatory videos and synchronized motion.
- [Manim Community](https://www.manim.community/) - Python animation for mathematical diagrams, scientific explanations, and technical teaching.

## Motion Design Tools

Supporting tools for building video graphics; these are separate from ready-made templates.

- [Pretext](https://github.com/chenglou/pretext) - JavaScript/TypeScript text measurement and multiline layout for animated titles, captions, and text cards. Reuse cached measurements, line widths, and wrapping with DOM, Canvas, or SVG; load the intended fonts and add your own animation timeline and video renderer.

## Production Workflows

Useful when you want a method or reusable motion primitives rather than a fixed finished-film template.

- [guizang-product-video-skill](https://github.com/op7418/guizang-product-video-skill) - Product-specific promotional video workflow that builds on real interface components, branding, typography, and a composed timeline. Suitable when the visual direction should come from the product rather than a fixed template.
- [OneTake](https://github.com/feitangyuan/onetake) - Continuous-shot motion library, composition starter, and case breakdowns for connected product demonstrations. The free repository excludes the showcased films' source code and uses a noncommercial license; commercial access is offered separately.
- [llm-explain](https://github.com/Gohanwu42/llm-explain) - Explainer workflow with an optional Python and FFmpeg assembler that combines local still images, narration, and captions into an MP4 with a synchronized SRT file. Useful for narrated concept slides; supply the images and audio yourself and adapt the storyboard.
- [Remotion Agent Skills](https://github.com/remotion-dev/skills) - Official agent guidance for creating, previewing, and rendering Remotion videos, with topic-specific references for captions, maps, and multimedia. Useful for building custom React video workflows; choose your own visual direction and consult Remotion licensing terms.
- [Six-Layer Film Production Prompt](https://mp.weixin.qq.com/s/Ridr4JQc6eWOoYfkNfPAgQ) - A Chinese article with a complete reusable production prompt covering deliverables, creative choices, technical constraints, visual rules, a central idea, and review iterations. Useful for briefing agent-made explainers or product films; replace the topic, format, and creative direction. It supplies instructions rather than a fixed visual style or executable template.

## Related Lists

- [Awesome Video as Code](https://github.com/voidforall/awesome-video-as-code) - Broader coverage of agent-directed tools, production workflows, showcases, and research.
- [Awesome Video Skills](https://github.com/AaronAust1n/awesome-video-skills) - Broader coverage of video-making tools, frameworks, skills, and automation workflows.

## Contributing

Suggest a useful resource or improve an existing entry through a pull request. The [catalog maintenance guide](docs/catalog-maintenance.md) covers local duplicate lookup, candidate decisions, and evidence checks. Read the [contribution guidelines](contributing.md) for the evidence, reuse notes, and formatting to include.

## Footnotes

[Selection and review notes](docs/selection.md) explain the scope, evidence level, and first-edition provenance. The English README is the canonical version; translations follow it.

Project code, example footage, audio, fonts, map data, and generated outputs retain their own terms. A listing is not a blanket permission to redistribute assets or use every dependency commercially.
