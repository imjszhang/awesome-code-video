# Catalog Maintenance

[Back to the list](../README.md)

The public READMEs remain manually curated. A small local catalog makes prior research searchable, keeps projects distinct from their reusable examples, and checks evidence references before changes are published. No database server, credentials, video renderer, or background task is needed.

## Three Layers

| File | Identity | What it stores |
| --- | --- | --- |
| `data/projects.json` | Stable project ID; GitHub numeric repository ID where available | Official repository, known alternate URLs, names, and default branch. |
| `data/resources.json` | Stable resource ID | A specific film, scene, preset, shot, style, framework, tool, workflow, or related list; its project, English description, and evidence references. |
| `data/evidence.json` | `S-CV-NNN` | A source URL, what was inspected, review date, source status, and limitations. |
| `research/candidates.json` | Generated candidate ID | Discovery URLs, optional resolved resource URLs, and prior decisions, including rejected and deferred candidates. |

The initial migration contains 13 projects, 38 listed resources, and 40 evidence records. Thirty resources are the main reusable examples; four frameworks, two workflows, and two related lists are supporting entries. The candidate queue starts empty rather than inventing a research history for existing entries.

Projects and resources are different identities. Ink Press and several shot cards belong to video-shotcraft; recording the repository once must not prevent its individual templates from being listed. Multiple resources can cite the same evidence. The current adapter requires each reference to belong to the resource's own project; evidence for a dependency can be recorded separately under that dependency.

## Look Before Researching

Install the pinned development dependencies once:

```sh
npm ci --ignore-scripts
```

Search names, IDs, descriptions, or a URL:

```sh
npm run catalog -- find 'Ink Press'
npm run catalog -- find 'https://github.com/Vincentwei1021/video-shotcraft/tree/main/template'
npm run catalog -- candidate list
npm run catalog -- candidate list --status rejected
```

Lookups are local. A match shows what is already cataloged or recorded as a candidate. Existing evidence includes the prior review date and notes; it is not an automatic promise that upstream files are unchanged today. Use the specific source link when rechecking a factual claim.

## Add and Review a Candidate

```sh
npm run catalog -- candidate add 'https://example.org/video-template' --name 'Example video template'
npm run catalog -- candidate status C-REPLACE-WITH-RETURNED-ID researching
npm run catalog -- candidate status C-REPLACE-WITH-RETURNED-ID deferred --reason 'The preview exists, but editable source has not been found.'
```

Use the ID returned by `candidate add`. An exact match to an existing resource returns that resource without adding a row. An existing candidate is matched through its original or resolved URL and returned with its current decision, including a rejection; adding its URL again does not reset its history. A different file or meaningful anchor in the same repository can be a new candidate.

The states are `pending`, `researching`, `deferred`, `rejected`, `duplicate`, and `accepted`. Give a reason when deferring, rejecting, or marking a duplicate. A duplicate decision also names the existing resource with `--resource`. Reopening a concluded decision should explain what changed. Each transition keeps its previous state, time, and reason. Candidate edits use a local lock and an atomic file replacement to avoid simultaneous additions overwriting each other; Git merge conflicts still need normal review.

A candidate discovered through an article can keep its original URL and record the actual template address as `resolved_url`. Supply `--resolved-url` and a reason when that mapping becomes known; this preserves the discovery trail rather than replacing the article URL.

An `accepted` candidate must point to an existing resource whose identity matches `resolved_url` (or the original URL when no resolution was needed), and must cite reviewed evidence. Acceptance records a curation decision; it does not automatically edit a README, add source code, or publish anything.

```sh
npm run catalog -- candidate status C-REPLACE-WITH-RETURNED-ID accepted --resource new-resource-id --resolved-url 'https://example.org/video-template' --reason 'The article links to this editable template; source and reuse instructions reviewed.'
```

For a successful acceptance, first add the project's identity if missing, the reviewed evidence, and the resource record. Update the matching English and Chinese README entries, then record acceptance and run the checks. Keep the previous candidate history after acceptance so later research can find the decision.

## How Matching Works

The checker normalizes common URL spelling differences and known aliases. It recognizes GitHub repository URLs and clone forms, and relates a raw file to its GitHub file page when the known branch can be identified. Repository names are case-insensitive; file paths remain case-sensitive. Tracking parameters can be removed, while meaningful query parameters, resource fragments, and non-default branches remain distinct.

Matching uses the repository IDs and alternate URLs already stored in the catalog. It does not query GitHub or discover every future repository rename. When a project moves, verify its numeric repository ID and update its canonical name and known aliases. Do not merge two similarly named projects without evidence.

A project match is context, not proof of a duplicate resource. Human review is still required for differently named copies, semantic duplicates, and two articles describing the same underlying work.

## Evidence and Review Levels

A source record's `reviewed` status means its contents were inspected for the recorded purpose. It does not mean the project rendered successfully, every claim is true, or its assets are cleared for all commercial uses. Resources keep `review.render_tested` separate from source review.

Record the evidence that supports artifact identity, availability of editable code, or factual characteristics. Suggested video uses and aesthetic assessments remain editorial judgments. For example, Ink Press's duration and shot count come from its upstream template document; its suitability for a knowledge-product launch is a recommendation.

Use `unverified` for evidence that has only been discovered. Unverified evidence may be kept while researching, but a published resource may not reference it. Keep evidence IDs stable; do not renumber them when deleting another row or sorting files.

The first-edition references preserve the source/documentation review dated 2026-10-27. This migration did not add new render-test results or immutable upstream snapshots. The catalog stores public metadata and concise review notes, not article copies, credentials, private collections, or raw research transcripts.

## Preview Media

A resource may include an optional `preview` object when an upstream file or page can be linked without copying it into this repository. Omit `preview` when there is no reliable preview. Do not store the media itself.

```json
{
  "kind": "video",
  "url": "https://example.com/demo.mp4",
  "license": "CC BY 4.0",
  "attribution": "Example Author (https://example.com)",
  "redistributable": false,
  "source": "S-CV-001 https://example.com/demo.mp4",
  "checked_at": "2026-10-27"
}
```

`kind` is `video` for a direct video file, `embed` for an upstream page, or `thumb_link` for an image such as an animated GIF or WebP. `poster` is an optional HTTPS image URL or bundled `/previews/<resource-id>.webp` frame capture, and must be omitted when unknown. Bundled captures have provenance in `data/preview-posters.json`. `redistributable` is a boolean. `true` is only for a direct `video` or `thumb_link` image whose upstream terms allow redistribution; uncertain or noncommercial media stays `false`. `source` records the evidence id and upstream URL, including open questions. `checked_at` is the review date. A `preview` does not change `review.render_tested`: linking a file is not a local render test. When a new media URL is the evidence, add a reviewed `preview-media` record instead of marking an unverified link as reviewed. The website reads the same object through `web/src/preview.ts`. A missing or invalid preview stays an editorial cover and is not described as a render.

## Checks

```sh
npm run check
```

This runs the following:

- `catalog:check`: Required fields, project/resource/evidence relationships, duplicate identities, candidate consistency, and optional `preview` media when a resource includes it. A missing `preview` is valid. The check does not download media.
- `readme:check`: English names, descriptions, links, categories, and counts against the catalog; Chinese resource coverage, categories, and counts. It does not verify translation meaning.
- `traceability:check`: Actual `js-traceability@0.1.0` reference checks, plus the catalog's stricter review-status and project-boundary rules.
- `test`: Regression tests for matching, candidate decisions, reference validation, and README drift.
- `lint`: The existing Awesome formatting check.

All catalog checks work offline and do not rewrite maintained data. Awesome lint may query GitHub for repository metadata. They do not validate live remote availability, installation, render output, license interpretation, or whether a source semantically supports a claim.

The traceability adapter creates a temporary Markdown source index and a CSV reference table from the JSON data, calls the library, and removes those temporary files afterward. There is no second maintained source index. The package's CSV check does not enforce source verification status, so the adapter rejects unreviewed and cross-project references explicitly. Generic numeric-claim detection is disabled because every listed resource already requires evidence and the library's finance-oriented heuristics are unsuitable here. Office extraction and full generated-artifact lineage are not enabled.

## Making a Change

1. Search the catalog and candidate history before starting new research.
2. Inspect the upstream material and record evidence or update the prior review notes.
3. Add or revise a project and its specific resource; keep IDs stable and reuse existing evidence when appropriate.
4. Update both READMEs by hand. The English name and description should match the resource record.
5. Resolve any related candidate and run `npm run check` before committing.

Use `--json` on catalog commands and the traceability check when another tool needs structured output. Test fixtures use `--root` to work in isolated temporary directories, so tests never alter the real candidate queue.

The [2026-10-27 reconciliation](../research/reconciliation-2026-10-27.md) demonstrates the first real batch: original leads, selected resources, evidence and recorded candidate decisions.

[Review batch 2](../research/review-batch-2-2026-10-27.md) records source and article reviews, including explicit browser-to-video adaptation requirements.

The [website audit](../research/website-audit-2026-10-27.md) records website coverage, eight source-reviewed additions, and seven deferred leads.
