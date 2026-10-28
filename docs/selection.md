# Selection and Review Notes

[Back to the list](../README.md)

## Scope

This list helps people find reusable source projects, camera and transition recipes, parameterized scenes, and visual style specifications for code-rendered video. It focuses on the gap between discovering a rendering engine and deciding what to build with it.

The first edition grew out of a personal collection of public projects and articles. Thirty specific reusable units were selected from a larger inventory. The public list links to upstream files and documentation, rather than redistributing articles, source code, or sample films. Supporting frameworks and workflows are listed separately from that count.

## Evidence Standard

For each core entry, the review looked for a concrete upstream file, example project, or documented implementation; a description of what can be reused; and enough documentation to distinguish a template from a prompt, showcase, or framework. Video use cases in this list are editorial recommendations based on those materials.

This first edition was researched and drafted with AI assistance from the maintainer's collection. Review means source and documentation review, not an assertion that every project has been installed, rendered, benchmarked, or tested with multiple models. No star threshold, sponsorship, or payment determines inclusion.

Initial review: 2026-10-27. Upstream branches and licenses may change; the links intentionally point to their current documented locations. Corrections and reports of broken links are welcome.

## Selection Boundaries

- A full project must expose editable film or scene source, not only a preview video.
- A preset must have an identifiable configuration example.
- A recipe must explain the move and identify an implementation path.
- A visual style must provide a reusable specification and a reference example; it remains separate from renderable templates.
- A generative video prompt is copyable text plus an upstream model label and a reviewed license. It does not count as a reusable film, scene, preset, shot, or style. HyperFrames template forks and agent briefs that build HTML compositions stay out of that section.
- Supporting motion-design tools must expose a concrete API or reusable implementation and explain their video integration path; they do not count as ready-made templates.
- Frameworks are useful context, but do not count as ready-made templates.
- Web-only animation components need a video integration path before entering the core list.
- Workflow tools and showcases must not imply that every showcased film includes source code.
- Archived, inaccessible, undocumented, or ambiguous resources are held back from the main list until their status can be clarified.

## Upstream Sources

- [video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft) supplies Ink Press and the selected shot cards.
- [map-motion](https://github.com/SpaceZephyr/map-motion) supplies the selected map configurations.
- [Paper-Cut](https://github.com/HeiGeAi/Paper-Cut) supplies the layered collage scene.
- [procedural-film](https://github.com/kuhnhomeuk-cell/procedural-film) supplies the natural-science and retro-game worked examples.
- [Lemo-Opuscar](https://github.com/lemomo-ai/lemo-opuscar) supplies the selected visual style specifications.

## Awesome Format and Discovery

The repository uses the Awesome list format: an English primary README, topic-focused sections, descriptive entries, an Awesome badge, contribution guidelines, and a catalog license. Relevant GitHub topics and descriptive section titles make its subject easier to discover without keyword stuffing.

Using the Awesome format and badge does not mean acceptance into the central Awesome index. Its current submission policy has independent eligibility requirements, including age and restrictions on AI-generated lists. This repository has not been submitted for inclusion. See the [upstream list guidelines](https://github.com/sindresorhus/awesome/blob/main/pull_request_template.md) before considering any future submission.
