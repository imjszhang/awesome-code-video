# Website Resource Audit — 2026-10-27

[Back to the list](../README.md) · [Machine-readable audit](website-audit-2026-10-27.json)

Reviewed website entry points associated with the existing project and article leads. Eight specific resources were admitted, and seven additional leads were deferred. The catalog now has 19 projects, 54 resources, 64 evidence records, and 43 core reusable units. No resources were installed or render-tested; no paid files were purchased. Style and use-case descriptions are editorial assessments.

## Accepted Resources

| Resource | Website discovery | Reuse boundary |
| --- | --- | --- |
| [Watercolor Brush](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/watercolor/STYLE.md) | [Website](https://lemomo-ai.github.io/lemo-opuscar/) | Style specification; build a new film. |
| [Exploded Teardown](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/teardown/STYLE.md) | [Website](https://lemomo-ai.github.io/lemo-opuscar/) | Style specification; build a new film. |
| [Engineering Briefing Board](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/briefing-board/STYLE.md) | [Website](https://lemomo-ai.github.io/lemo-opuscar/) | Style specification; build a new film. |
| [Podcast Audiogram](https://github.com/remotion-dev/remotion/tree/main/packages/template-audiogram) | [Website](https://www.remotion.dev/templates/audiogram) | Editable Remotion composition; replace content and check license eligibility. |
| [Code Hike Transitions](https://github.com/remotion-dev/remotion/tree/main/packages/template-code-hike) | [Website](https://www.remotion.dev/templates/code-hike) | Editable Remotion composition; replace content and check license eligibility. |
| [Word-Highlighted Captions](https://github.com/remotion-dev/remotion/tree/main/packages/template-tiktok) | [Website](https://www.remotion.dev/templates/tiktok) | Editable Remotion composition; replace content and check license eligibility. |
| [Editorial Data Chart](https://github.com/heygen-com/hyperframes/tree/main/registry/blocks/data-chart) | [Website](https://hyperframes.heygen.com/catalog/blocks/data-chart) | Editable HTML/GSAP block; integrate into a film. |
| [YouTube Subscribe Lower Third](https://github.com/heygen-com/hyperframes/tree/main/registry/blocks/yt-lower-third) | [Website](https://hyperframes.heygen.com/catalog/blocks/yt-lower-third) | Editable HTML/GSAP block; integrate into a film. |

Remotion uses entity-dependent licensing. Lemo repository material has an MIT license; HyperFrames has an Apache-2.0 license. These repository licenses do not independently clear external assets, sample branding, fonts, or dependencies. See evidence S-CV-054 through S-CV-064 in [the source ledger](../data/evidence.json).

## Deferred Leads

- [Launch Video Template Pack](https://getdesign.md/video-template): Paid template pack found on the project website. Preview reviewed; purchased files, per-template source, and exact reuse terms were not inspected. Do not classify the pack as open source.
- [OpenDesign Template Catalog](https://open-design.ai/plugins/templates/): Mixed catalog includes video styles, prompt-only entries, and apparent HyperFrames counterparts. Select an individual downloadable artifact and resolve its original author/source before admission.
- [Anatomy Message Queue](https://skills.wheresryan.sh/anatomy/collection/message-queue): Promising marble-run system explainer. Website and import guidance reviewed; verify the figure package source, license, and deterministic video integration before admission.
- [ThreeUI Particle Wordmark](https://threeui.com/text-animation/article-headings/particle-wordmark): Particle typography useful for title sequences. Website/source context found, but item-specific access terms and a controlled video timeline still need verification.
- [Skillry Pencil-to-Light Loop](https://skillry.dev/ai-videos/opus-5-5/heyiamnick-119558): Detailed looping-video prompt and original-post attribution found. No executable scene inspected; keep as a prompt lead rather than a ready-made video template.
- [Anatomy Community Figures](https://skills.wheresryan.sh/anatomy/community): Community examples are promising; review each author's source and asset permissions independently before importing a specific figure.
- [Manim Example Gallery](https://docs.manim.community/en/stable/examples.html): Official examples expose Python implementations. Select specific scenes and document adaptation requirements before adding entries; the framework is already listed.

## Website Coverage

This is an entry-point and selected-source audit, not a review of every item in each gallery. Limited extraction and access failures are stated explicitly.

| Website | Review depth | Decision |
| --- | --- | --- |
| [Lemo](https://lemomo-ai.github.io/lemo-opuscar/) | Specific source reviewed | Added Watercolor, Teardown, and Briefing Board; keep specifications distinct from finished films. |
| [Remotion](https://www.remotion.dev/templates/) | Specific source reviewed | Added three official templates using canonical monorepo paths rather than duplicating mirror repositories. |
| [HyperFrames](https://hyperframes.heygen.com/catalog/blocks/data-chart) | Specific source reviewed | Added Data Chart and YouTube Lower Third; inspected HTML timelines and registry metadata. |
| [video-shotcraft](https://vincentwei1021.github.io/video-shotcraft/) | Gallery reviewed | Existing film and shot entries cover the selected reusable material; no duplicate gallery entry. |
| [Webreel](https://webreel.dev/examples) | Example index reviewed | Additional form, scrolling, and shortcut demos merit future source review; existing entries retained. |
| [Anatomy](https://skills.wheresryan.sh/anatomy/collection) | Collection and detail reviewed | Message Queue and community figures retained as candidates; package identity and per-author rights need checking. |
| [ThreeUI](https://threeui.com/text-animation/article-headings/particle-wordmark) | Detail page reviewed | Particle Wordmark retained as a candidate; distinguish free/pro access and verify video integration. |
| [GetDesign](https://getdesign.md/video-template) | Sales page reviewed | Paid launch-video pack is relevant, but no purchase or delivered-file inspection was performed. |
| [OpenDesign](https://open-design.ai/plugins/templates/) | Catalog reviewed | Mixed prompts and templates, including apparent upstream copies; resolve specific original artifacts before admission. |
| [Skillry](https://skillry.dev/ai-videos/opus-5-5) | Gallery and one prompt reviewed | Useful discovery source; a detailed prompt is not executable scene source. |
| [OneTake](https://onetakemotion.com) | Website reviewed | Paid starters need file and license review. Existing workflow entry remains appropriate. |
| [CanvasUI](https://canvasui.dev/components) | Component index reviewed | Browser components require a capture or controlled video timeline; no additional core entry. |
| [Amicro](https://amicro.vercel.app) | Access blocked | Website returned 403; existing GitHub source review remains separate. |
| [OmniLottie](https://openvglab.github.io/OmniLottie/) | Research landing page reviewed | Generation research and galleries do not establish reuse rights for each animation. |
| [p5.brush](https://p5-brush.cargo.site/) | Website reviewed | Drawing library and creative references; select an actual timed scene before adding a video template. |
| [WebGL Fluid](https://paveldogreat.github.io/WebGL-Fluid-Simulation/) | Limited text extraction | Dynamic demo was not visually or render tested; controlled inputs and capture remain unresolved. |
| [Auto-Editor](https://auto-editor.com) | Website reviewed | Editing tool, not a specific reusable visual template. |
| [video-use](https://video-use.com) | Website reviewed | Editing workflow; no new concrete template selected. |
| [Claude Real Video](https://leoaido.com/crv-pro/) | Website reviewed | Workflow/service offering; no new source-backed template selected. |
| [Hypit](https://hypit.ai) | Website reviewed | Product offering; no new source-backed template selected. |
| [CapCut Mate](https://jcaigc.cn) | Access failed | Website timed out; no claim about its unseen contents. |
| [Manim Community](https://docs.manim.community/en/stable/examples.html) | Example gallery reviewed | Python examples are promising; individual scene selection deferred. |
| [Motion Canvas](https://motioncanvas.io) | Homepage/docs reviewed | Framework already listed; no new individual scene selected. |
| [GSAP](https://gsap.com) | Website reviewed | Animation foundation; review specific examples and integration rather than bulk importing. |
| [Motion](https://motion.dev) | Website reviewed | Animation foundation; no specific additional video artifact selected. |
| [Anime.js](https://animejs.com) | Website reviewed | General animation examples need video integration and individual review. |
| [p5.js](https://p5js.org) | Website reviewed | Creative coding foundation; no additional scene selected. |
| [Rough.js](https://roughjs.com) | Website reviewed | Sketch drawing foundation, not a timed video template. |
| [Mesh3D](https://mesh3d.gallery) | Gallery reviewed | Visual inspiration does not establish editable source or reuse rights. |
| [Three.js Editor](https://threejs.org/editor) | Limited text extraction | Generic editor; no specific reusable video resource verified. |
| [Off-axis Demo](https://cnb.cool/MindDockAI/off-axis-demo) | Project documentation reviewed | Head-tracking demo needs controlled input, assets, and a video integration path. |
| [OhMyOpus](https://ohmyopus.com/en/s/motion) | Gallery reviewed | Original-post discovery; verify source for each selected work. |

## Discovery and Deduplication

GitHub homepage metadata was queried for 39 repository leads. Two lookups were incomplete (Norsico/Video-Materials-AutoGEN-Workstation and ahujasid/blender-mcp); an empty homepage field is not proof that a project has no website. Direct website leads and the existing catalog supplied additional entry points. The JSON report preserves the metadata results and gaps.

New resources remain under their existing Lemo, Remotion, or HyperFrames project identities. Discovery links and resolved source paths are recorded separately, and acceptance references reviewed evidence. Shared gallery URLs are preserved in this report instead of being mistaken for a single reusable artifact. OpenDesign copies and prompt galleries were not bulk imported. Candidate history keeps the deferred decisions available for subsequent research.
