# Website development

The English-first site uses React, Vite, MiniSearch and build-time HTML rendering. It follows AIPOCH Network’s static catalog approach and Cyber Taoist’s yellow/black palette, thick borders, hard shadows and typography. It requires no API keys, database or live GitHub requests.

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

Every public route has rendered HTML, a unique title and description. Client-side hydration adds search, filters and local bookmarks. The preview server returns a real 404 for unknown routes. There is no backend or tracking script.

Card illustrations are original editorial covers, explicitly labeled on detail pages; they are not screenshots or proof of successful rendering. Known upstream galleries are linked separately. A future real-preview pipeline should retain attribution and check upstream media licenses before importing footage.

## Production build

Production: https://awesomecodevideo.com, hosted on GitHub Pages. Every push to `main` runs `.github/workflows/deploy.yml`, validates the catalog and website, builds indexable HTML, and deploys `dist/`. DNS is managed in Cloudflare (DNS-only records pointing at GitHub Pages).

Reproduce the production build locally:

```sh
SITE_URL=https://awesomecodevideo.com SITE_INDEXING=true npm run build
```

Set `SITE_BASE=/your-subdirectory/` at build time when deploying beneath a path; also set it when running the preview server. `SITE_URL` must be the origin only. Deploy `dist/` to a static host with directory-index support and configure `404.html` as its error page. Do not configure an SPA fallback to the homepage.

Builds default to `noindex` and disallow crawling. Production builds add canonical URLs, a sitemap, robots rules and homepage WebSite structured data. Saved resources remain noindex and are omitted from the sitemap. Review production URLs and indexability before publishing.

## Typography and licensing

Space Grotesk Variable and JetBrains Mono Variable are bundled locally through Fontsource; no Google Fonts requests are made. Both use the SIL Open Font License. Copies of their licenses are distributed in `public/licenses/` in the built site. Upstream resources retain their own licenses; inclusion in this catalog does not grant reuse rights.

The deployment waits up to 45 minutes for GitHub’s custom-domain certificate, enables HTTPS enforcement and checks HTTPS access. If certificate issuance exceeds that window, re-run the deployment from Actions.
