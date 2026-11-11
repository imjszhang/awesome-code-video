# Website development

The English-first site uses React, Vite, MiniSearch and build-time HTML rendering. It follows AIPOCH Network’s static catalog approach. Every page shares one look, a screening room for the catalog: neutral dark surfaces so the work supplies the colour, Space Grotesk for prose, JetBrains Mono for code and measurements, and `#FCD228` yellow reserved for the playhead: where you are, what is about to play, and the one primary action. The site has a single dark theme; there is no light variant or theme switch. It requires no API keys, database or live GitHub requests.

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

`data/projects.json`, `data/resources.json` and `data/evidence.json` remain authoritative. Curated collections, use-case groupings and search live in `web/src/model.ts`. Routes cover the homepage, searchable library, projects, collections, resource details, saved resources, the Fable 5.2 spotlight, and selection policy. Resource details expose upstream links, reuse guidance and review evidence. Bookmarks stay in this browser’s local storage.

Public pages read a filtered view of that inventory. `web/src/model.ts` omits every resource whose `project_id` is `freelancer-templates`, and the production build deletes those posters from `dist` after Vite copies `web/public`. The public index is 292 resources, 284 of them with a preview (213 video, 65 `thumb_link`, 6 embed), 33 source projects, and 6 collections. The homepage number row and the hero chart use these public counts. README introductions use the public core set of 267 (film, scene, preset, shot, and style); the Chinese introduction states 142 film/scene, 6 map presets, 73 shots, and 46 styles. The repository still holds the unfiltered records. See [Public display isolation](catalog-maintenance.md#public-display-isolation).

Every public route has rendered HTML, a unique title and description. Client-side hydration adds search, filters and local bookmarks. The preview server returns a real 404 for unknown routes. There is no application backend. Optional consent-controlled GA4 analytics is configured separately; see [Search and resource measurement](analytics.md). With analytics disabled, no analytics tag is loaded.

Where a reviewed preview exists, a card shows it: a bundled still frame from the upstream demo video, or the upstream image itself, labeled Upstream demo or Preview. A resource without a reviewed preview gets an original editorial title card labeled Editorial cover carrying the resource's own name; no two covers repeat. The title card is not a screenshot, footage, or a verified reproduction. On the homepage and on a resource's own page, Play loads and starts the upstream demo video; it begins muted with native controls so the viewer can unmute it. Videos never autoplay. Animated images may move when loaded. A playing preview is not a local render test. Browse cards (library, use cases, projects, saved list) rest on stills and link to the resource; playback belongs to the homepage gallery and the resource detail page. Optional preview metadata hotlinks upstream files and pages; full video files are not copied into this repository; small frame captures are bundled as posters. A `generative_prompt` resource uses the same `video` or `thumb_link` preview. The site does not yet render `prompt`, `suggestedModels`, or `prompt_policy`; those fields stay in the catalog. Known upstream galleries are linked separately. The homepage runs in this order: a hero whose demo reel is drawn by code; the collection in numbers; a Fable 5.2 spotlight of public posts; a featured row of playable demos; the three kinds of starting point (films and scenes, shot recipes, visual styles) with live counts linking to the filtered library; the index, with video, animated-example, and other-resource tabs; use cases; and the selection standard. Cards for measured video files show the running time and frame size recorded in `data/preview-posters.json`; a preview whose URL no longer matches that record shows neither. Each category starts with 12 cards and adds up to 12 on “Load more”; switching categories preserves their expanded counts for this visit. Only the active category's visible cards are mounted. The card's “Source & license” disclosure retains its full preview explanation, attribution, upstream link, and source-review date.

`data/fable-52-gallery.json` is a standalone spotlight, separate from the curated catalog. The homepage takes the 24 newest posts (`created_at_utc` descending) and splits them into separate dense grids: Landscape at 16:9, Portrait at 9:16, and Square at 1:1 only when a square post is in that set. `/spotlight/fable-5-2/` lists all 118 the same way. Cards link to the original posts. Play loads the original host file, starts muted, and does not autoplay, the same rules as the featured gallery. Preview images stay on their original host; this repository does not store those videos or images. The posts are not catalog resources, and they do not change catalog counts. Append future posts to that JSON file only. Do not merge them into `data/resources.json`, `data/evidence.json`, `data/projects.json`, `data/collections.json`, or either README.

`web/src/styles.css` is the shared system for every page: palette and type tokens, the sticky header, buttons, cards, editorial covers, the library, detail, project, use-case and about layouts, and the footer. `web/src/homepage.css` adds only the homepage sections, scoped under `.home-site`. The header marks the current section with a yellow rule; a page beneath a section (a resource, a use case, a project) marks its parent with `aria-current="true"` and the section page itself with `aria-current="page"`. Editorial covers are drawn in the site palette and sized from their frame's height with container units, so one composition holds at card size and in the wider detail-page frame; a use-case page and the About page's invitation sit on the same paper tone as the homepage's use-case band. The hero pairs ordinary HTML copy with a small player: a code listing, a 16:9 Canvas 2D stage and a timeline. The stage plays a six-second, 180-frame title sequence in which every frame is a pure function of its frame number, so it can loop, pause and be scrubbed to any frame. `heroReel.ts` holds the timing, easing and drawing; `HeroMotion.tsx` owns the lifecycle and mirrors the current frame in the listing, the timeline and the timecode. The listing is a simplified sketch of that module, hidden from assistive technology. A server-rendered SVG of the finished title is the static fallback, shown until the canvas fonts load and whenever JavaScript or Canvas is unavailable. The hero requires no raster image, video file or rendering service. It is decorative brand material, separate from upstream preview media and their provenance; it is not a screenshot, an upstream work or evidence of a successful render. See [the reel notes](hero-art.md), which also record the archived illustration at `web/public/art/code-in-motion.webp`.

The reel's Pause / Play button controls only the reel, independently of gallery videos. Dragging the timeline, or focusing it and pressing the arrow keys, holds the chosen frame; Play resumes from there. A reduced-motion preference starts it paused on the finished title and is observed while the page is open; the viewer can explicitly play it. Playback stops when the hero leaves the viewport or the browser tab is hidden, then resumes from the same frame. The reel advances at 30 frames per second and pixel density is capped at 2×. Both controls are disabled until the canvas is ready. The page heading and navigation remain ordinary static HTML.

Category tabs support Left/Right arrows, Home, and End. Existing category hashes select the corresponding tab on load. Switching categories stops playback and releases its media source; returning does not resume it automatically. Loading more moves focus and the viewport to the first new card. Without JavaScript, the initial video batch is available and the library link leads to the full server-rendered catalog.

## Preview media

The catalog field list is in [Catalog maintenance](catalog-maintenance.md#preview-media). `web/src/preview.ts` reads that same object. `poster` accepts an HTTPS image or a bundled `/previews/<resource-id>.webp` frame capture. It stays omitted when unknown. `source` is the evidence id plus the upstream URL and notes. No other keys are accepted.

| Record | Homepage gallery | Honest label |
| --- | --- | --- |
| Complete `video` | Rest on a poster image when one exists, otherwise an editorial placeholder. The poster also stays on the video element while loading. The file URL is assigned only after Play (click or Enter/Space), then playback starts muted, with native controls so it can be unmuted. Videos never autoplay; animated images can animate when loaded. Until Play, the element stays `preload="none"` and has no file URL. Only one demo plays at a time; starting another releases the previous file. | Upstream demo |
| Complete `embed` | Show its verified upstream thumbnail and link the upstream page. Do not iframe it. | Preview |
| Complete `thumb_link` | Show a bundled static cover with lazy loading; clicking it opens the upstream image or animated GIF. GIFs never use the video player. | Preview |
| Missing or invalid `preview` | Keep the editorial cover (mode C). Featured homepage resources still appear this way. | Editorial cover |

`resolvePreview`, `previewMode`, `previewPlayable`, `previewCaption`, `previewUrl`, and `previewPoster` choose that treatment. `coverStill` returns the still a browse card rests on: the bundled poster, or the upstream image itself. `homePreviewItems` collects complete previews and featured fallbacks. `homePreviewGroups` partitions them into videos (direct video files and verified YouTube embed URLs), animations (source images with multiple frames recorded in the image manifest), and other resources (static images, non-video pages, and editorial fallbacks). `homeGalleryItems` returns only the video group. Tab totals are derived from the current catalog, independently of the visible batch size. Only a complete `video` is playable. `redistributable: true` is accepted for video files and image previews when upstream terms allow it. Play buttons call `toggleGalleryPlayback` (homepage) or the resource page’s own playback state: the media URL is assigned only then, playback starts muted, native controls appear so the viewer can unmute, and starting another preview on the homepage pauses, resets, and releases the previous file. Enter and Space activate the same button; Tab leaves it. Images link to the upstream source; editorial covers without a reviewed preview are not links. Videos never autoplay; animated images can animate when loaded, and a playing preview is not a local render test.

## Production build

Production: https://awesomecodevideo.com, hosted on GitHub Pages. Every push to `main` runs `.github/workflows/deploy.yml`, validates the catalog and website, builds indexable HTML, and deploys `dist/`. DNS is managed in Cloudflare (DNS-only records pointing at GitHub Pages).

Reproduce the production build locally:

```sh
SITE_URL=https://awesomecodevideo.com SITE_INDEXING=true npm run build
```

Set `SITE_BASE=/your-subdirectory/` at build time when deploying beneath a path; also set it when running the preview server. `SITE_URL` must be the origin only. Deploy `dist/` to a static host with directory-index support and configure `404.html` as its error page. Do not configure an SPA fallback to the homepage.

Builds default to `noindex` and disallow crawling. Production builds add canonical URLs, a sitemap, robots rules, social sharing metadata, homepage WebSite structured data, detail breadcrumbs and collection ItemList data. Saved resources remain noindex and are omitted from the sitemap; crawling is allowed so search engines can read that directive. Review production URLs and indexability before publishing.

## Typography and licensing

Every page uses Space Grotesk Variable for prose and JetBrains Mono Variable for code, labels and measurements. Both are bundled locally through Fontsource; no Google Fonts requests are made. Both use the SIL Open Font License; copies are distributed in `/licenses/` in the built site. Upstream resources retain their own licenses; inclusion in this catalog does not grant reuse rights.

Deployment verifies public HTTPS with bounded retries. Configure the custom domain and HTTPS enforcement once using an authorized repository administrator; the Actions GITHUB_TOKEN cannot update these repository settings. Do not treat permission errors as certificate provisioning delays.

## Video frame posters

Run `python3 scripts/generate-preview-posters.py` with curl, ffprobe, and ffmpeg installed to extract MP4 posters. Source metadata and the byte ranges needed to decode each frame are cached under ignored `.cache/preview-videos/`; only WebP frames with a maximum dimension of 640 pixels ship in `web/public/previews/`. The default frame is at 35% of the duration. Review frames visually; use `--id RESOURCE --at SECONDS` to choose a better frame.

`data/preview-posters.json` records each source URL, capture time, duration, source dimensions, downloaded source-byte-range hashes (or a complete-source SHA-256 when available), poster SHA-256, license, and attribution. Posters are upstream video stills, not locally rendered reproductions. They retain the source material's terms and do not alter its redistribution flag. Gallery image paths respect `SITE_BASE`; images load lazily and MP4 URLs remain unassigned until Play.

Resources isolated from public display keep their poster files in this repository. The production build copies `web/public` and then removes those isolated posters from `dist/previews`, so the deployed site does not serve them. The same build omits their detail pages, project page, search entries, sitemap URLs, and rows in `dist/data/catalog.json`. See [Catalog maintenance](catalog-maintenance.md#public-display-isolation).

## Image and page covers

`python3 scripts/generate-image-posters.py` (Pillow and curl required) bundles static stills for image/animation previews. `data/image-preview-posters.json` records source hashes and frame selection. Page covers are recorded in `data/page-preview-posters.json`: YouTube oEmbed thumbnails must match the video ID and official title; website covers must come from the linked site's own metadata. See [the preview audit](preview-audit.md) for scope and the removed incorrect pairing.
