# Website development

The English-first site uses React, Vite, MiniSearch and build-time HTML rendering. It follows AIPOCH Network’s static catalog approach. The homepage follows the current [Cyber-Taoist visual identity](https://cyber-taoist.ai/): black surfaces, `#FCD228` yellow, condensed display typography, fine rules and editorial artwork. It requires no API keys, database or live GitHub requests.

## Run locally

Use Node.js 24 or newer:

```sh
npm ci --ignore-scripts
npm run dev
```

For the complete static site:

```sh
npm run check:web
npm run preview
```

Preview runs at http://127.0.0.1:4173. The build writes `dist/`; do not commit generated files. `npm run check` validates the original catalog and README. CI runs both checks.

## Content and features

`data/projects.json`, `data/resources.json` and `data/evidence.json` remain authoritative. Curated collections, use-case groupings and search live in `web/src/model.ts`. Routes cover the homepage, searchable library, projects, collections, resource details, saved resources and selection policy. Resource details expose upstream links, reuse guidance and review evidence. Bookmarks and theme preferences stay in this browser’s local storage.

Every public route has rendered HTML, a unique title and description. Client-side hydration adds search, filters and local bookmarks. The preview server returns a real 404 for unknown routes. There is no application backend. Optional consent-controlled GA4 analytics is configured separately; see [Search and resource measurement](analytics.md). With analytics disabled, no analytics tag is loaded.

Library cards and resource details use original editorial covers, explicitly labeled; they are not screenshots or proof of successful rendering. A `generative_prompt` resource uses the same `video` or `thumb_link` preview. The site does not yet render `prompt`, `suggestedModels`, or `prompt_policy`; those fields stay in the catalog. Known upstream galleries are linked separately. Optional preview metadata hotlinks upstream files and pages; full video files are not copied into this repository; small frame captures are bundled as posters, and a preview link is not a local render test. The homepage opens with a black-and-gold code-generated animation, then video, animated-example, and other-resource tabs. Each category starts with 12 cards and adds up to 12 on “Load more”; switching categories preserves their expanded counts for this visit. Only the active category's visible cards are mounted. The card's “Source & license” disclosure retains its full preview explanation, attribution, upstream link, and source-review date.

Homepage styles are scoped in `web/src/homepage.css`. The hero is a full-width immersive stage: Canvas 2D geometry and text fill the background, while the centered heading, description and buttons sit above it as ordinary HTML. A quiet area behind the copy preserves readability, and the composition adapts to the available screen dimensions. A server-rendered SVG provides its static fallback. The hero requires no raster image, video file or rendering service. `HeroMotion.tsx` owns its lifecycle, `heroModel.ts` holds the shared timeline and geometry, `heroScene.ts` draws the screens, and `heroTypography.ts` draws the scrolling code whose characters fly into them; text is prepared once, with no per-frame DOM measurements. The hero is decorative brand material, separate from upstream preview media and their provenance; it is not a screenshot, an upstream work or evidence of a successful render. The previous generated illustration remains archived at `web/public/art/code-in-motion.webp`, with its prompt in [hero-art.md](hero-art.md).

The hero's Pause / Play button controls its own animation independently of gallery videos. A reduced-motion preference starts it paused and is observed while the page is open; the viewer can explicitly play it. Animation time stops when the hero leaves the viewport or the browser tab is hidden, then resumes from the same point. Drawing is capped at 30 frames per second and pixel density at 2×. Canvas geometry appears before font preparation finishes; the SVG remains visible when JavaScript or Canvas is unavailable. The page heading and navigation remain ordinary static HTML.

Category tabs support Left/Right arrows, Home, and End. Existing category hashes select the corresponding tab on load. Switching categories stops playback and releases its media source; returning does not resume it automatically. Loading more moves focus and the viewport to the first new card. Without JavaScript, the initial video batch is available and the library link leads to the full server-rendered catalog.

## Preview media

The catalog field list is in [Catalog maintenance](catalog-maintenance.md#preview-media). `web/src/preview.ts` reads that same object. `poster` accepts an HTTPS image or a bundled `/previews/<resource-id>.webp` frame capture. It stays omitted when unknown. `source` is the evidence id plus the upstream URL and notes. No other keys are accepted.

| Record | Homepage gallery | Honest label |
| --- | --- | --- |
| Complete `video` | Rest on a poster image when one exists, otherwise an editorial placeholder. The poster also stays on the video element while loading. The file URL is assigned only after Play (click or Enter/Space), then playback starts muted, with native controls so it can be unmuted. Videos never autoplay; animated images can animate when loaded. Until Play, the element stays `preload="none"` and has no file URL. Only one demo plays at a time; starting another releases the previous file. | Upstream demo |
| Complete `embed` | Show its verified upstream thumbnail and link the upstream page. Do not iframe it. | Preview |
| Complete `thumb_link` | Show a bundled static cover with lazy loading; clicking it opens the upstream image or animated GIF. GIFs never use the video player. | Preview |
| Missing or invalid `preview` | Keep the editorial cover (mode C). Featured homepage resources still appear this way. | Editorial cover |

`resolvePreview`, `previewMode`, `previewPlayable`, `previewCaption`, `previewUrl`, and `previewPoster` choose that treatment. `homePreviewItems` collects complete previews and featured fallbacks. `homePreviewGroups` partitions them into videos (direct video files and verified YouTube embed URLs), animations (source images with multiple frames recorded in the image manifest), and other resources (static images, non-video pages, and editorial fallbacks). `homeGalleryItems` returns only the video group. Tab totals are derived from the current catalog, independently of the visible batch size. Only a complete `video` is playable. `redistributable: true` is accepted for video files and image previews when upstream terms allow it. On the homepage, that file’s Play button calls `toggleGalleryPlayback`: the media URL is assigned only then, playback starts muted, native controls appear so the viewer can unmute, and starting another preview pauses, resets, and releases the previous file. Enter and Space activate the same button; Tab leaves it. Images, upstream pages, and editorial covers stay links or illustrations, not players. Videos never autoplay; animated images can animate when loaded, and a playing preview is not a local render test.

## Production build

Production: https://awesomecodevideo.com, hosted on GitHub Pages. Every push to `main` runs `.github/workflows/deploy.yml`, validates the catalog and website, builds indexable HTML, and deploys `dist/`. DNS is managed in Cloudflare (DNS-only records pointing at GitHub Pages).

Reproduce the production build locally:

```sh
SITE_URL=https://awesomecodevideo.com SITE_INDEXING=true npm run build
```

Set `SITE_BASE=/your-subdirectory/` at build time when deploying beneath a path; also set it when running the preview server. `SITE_URL` must be the origin only. Deploy `dist/` to a static host with directory-index support and configure `404.html` as its error page. Do not configure an SPA fallback to the homepage.

Builds default to `noindex` and disallow crawling. Production builds add canonical URLs, a sitemap, robots rules, social sharing metadata, homepage WebSite structured data, detail breadcrumbs and collection ItemList data. Saved resources remain noindex and are omitted from the sitemap; crawling is allowed so search engines can read that directive. Review production URLs and indexability before publishing.

## Typography and licensing

The homepage uses Barlow (400, 500, 600) for body text and Barlow Condensed (600, 700, 800) for display text, matching Cyber-Taoist. Latin subsets are bundled locally through Fontsource. Space Grotesk Variable and JetBrains Mono Variable remain available for the existing catalog pages and metadata. No Google Fonts requests are made. All four families use the SIL Open Font License; copies are distributed in `/licenses/` in the built site. Upstream resources retain their own licenses; inclusion in this catalog does not grant reuse rights.

Deployment verifies public HTTPS with bounded retries. Configure the custom domain and HTTPS enforcement once using an authorized repository administrator; the Actions GITHUB_TOKEN cannot update these repository settings. Do not treat permission errors as certificate provisioning delays.

## Video frame posters

Run `python3 scripts/generate-preview-posters.py` with curl, ffprobe, and ffmpeg installed to extract MP4 posters. Source metadata and the byte ranges needed to decode each frame are cached under ignored `.cache/preview-videos/`; only WebP frames with a maximum dimension of 640 pixels ship in `web/public/previews/`. The default frame is at 35% of the duration. Review frames visually; use `--id RESOURCE --at SECONDS` to choose a better frame.

`data/preview-posters.json` records each source URL, capture time, duration, source dimensions, downloaded source-byte-range hashes (or a complete-source SHA-256 when available), poster SHA-256, license, and attribution. Posters are upstream video stills, not locally rendered reproductions. They retain the source material's terms and do not alter its redistribution flag. Gallery image paths respect `SITE_BASE`; images load lazily and MP4 URLs remain unassigned until Play.

## Image and page covers

`python3 scripts/generate-image-posters.py` (Pillow and curl required) bundles static stills for image/animation previews. `data/image-preview-posters.json` records source hashes and frame selection. Page covers are recorded in `data/page-preview-posters.json`: YouTube oEmbed thumbnails must match the video ID and official title; website covers must come from the linked site's own metadata. See [the preview audit](preview-audit.md) for scope and the removed incorrect pairing.
