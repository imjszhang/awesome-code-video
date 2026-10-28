# Search and resource measurement

The site measures the journey from search landing pages to useful resources. Google Search Console measures search exposure and indexing. Optional Google Analytics 4 measures consented visits and resource interactions. A referral click is not proof of a download, installation, contribution, or successful reuse.

## Deployment configuration

GitHub Pages builds read these repository **variables**, not secrets:

| Variable | Value |
| --- | --- |
| `ANALYTICS_ENABLED` | `true` to enable the consent interface and GA4 loading; any other value disables analytics |
| `GA_MEASUREMENT_ID` | The matching site's public GA4 web-stream measurement ID, beginning `G-` |

The workflow maps them to `VITE_ANALYTICS_ENABLED` and `VITE_GA_MEASUREMENT_ID`. The allowed production origin defaults to `https://awesomecodevideo.com`. Local development and another host remain disabled. `web/.env.example` documents local configuration; never put account credentials in Vite variables. A new deployment is required after changing build variables.

If the measurement ID or approval of the stream settings is missing, leave analytics disabled. Do not use a sample ID. Tags are loaded through one application-owned GA4 module; do not also install a GTM GA4 tag or a second gtag snippet.

## Consent and data handling

Accepting optional analytics loads Google Analytics and sends one page view for the current document. Rejecting sends no events and loads no Google tag. Consent is kept in this browser under `acv:analytics-consent`. A first-party denied-preference cookie and session storage provide a fallback when browser storage fails. If the browser cannot persist any choice, the interface explains that the choice applies only to the current page and how to remove an earlier saved choice. No pre-consent action is replayed. The footer offers Analytics choices while analytics is configured. Withdrawing disables tracking and reloads the document when needed to remove loaded tag timers.

Page URLs are restricted to known site routes. Search queries, fragments, unknown parameters and arbitrary missing-page paths are not sent. Referrers and external destinations are sanitized. Vetted campaign values can be retained for attribution; they must contain no personal information. Free search text, copied text and the saved-resource list are never sent. User-selected resource IDs and event categories are public catalog identifiers.

Cookies and statistics represent only visitors who consent and whose browsers permit collection. They are not a count of every person or bot reaching the host. GitHub Pages and upstream preview providers process their own requests separately.

## Event dictionary

| Event | Meaning and trigger |
| --- | --- |
| `page_view` | One current-document view after consent; not search, filter, tab, hash or React rerender |
| `select_resource` | A resource-card link was activated to view its detail page |
| `open_resource` | The primary source CTA on a resource detail was activated; primary key event |
| `copy_reuse_brief` | The Clipboard API successfully wrote the brief; secondary key event |
| `save_resource`, `unsave_resource` | A user changed the local shortlist |
| `search_results_view` | A user search stabilized or was submitted; only counts and non-text context |
| `filter_resources` | A user changed a filter, sort order or reset the filters |
| `preview_start`, `preview_complete` | An on-site HTML video actually began or reached the end; external previews are not observable |
| `gallery_category_select`, `gallery_load_more` | A user browsed the homepage categories or revealed another batch |
| `outbound_click` | A non-primary source, project or documentation link was activated |
| `suggest_resource_click` | A contribution-entry link was activated; not a submitted GitHub issue |
| `not_found` | The 404 document was visited; arbitrary requested paths are not collected |

Keep legitimate repeat events. Use sessions containing a key event divided by eligible sessions for the session key-event rate; do not suppress later resource clicks within a session. `resource_id`, `project_id`, `resource_kind`, `placement`, `page_type`, `destination_domain`, category and result counts provide bounded context as applicable.

## Google account setup

1. Reuse the existing verified Search Console property that covers this origin. Record the property scope and verification method. Submit or inspect `/sitemap.xml`; save index and search performance baselines. URL-inspect representative homepage, resource, library, project and collection URLs.
2. Reuse or create the matching GA4 web data stream. Record property/stream identifiers and reporting timezone. Confirm the exact measurement ID before setting deployment variables.
3. Disable enhanced measurement for page history, site search, outbound clicks, form interactions and video where it would duplicate or bypass the application's controlled events. The application manually supplies `page_view` with `send_page_view: false`.
4. Keep Google Signals and advertising personalization off for this non-advertising implementation. Enable email and query-parameter data redaction as additional protection. Test internal/developer filters before activating them; exclude test data from production reports.
5. Register only useful event-scoped dimensions (page type, resource kind, project, placement, category). Resource-level reports can use page paths or carefully selected resource IDs. Avoid raw URLs, free text, or unbounded dimension values.
6. Mark `open_resource` and `copy_reuse_brief` as key events; choose once-per-session counting for the session-oriented KPI. Keep the raw event-count report separately.
7. Link the same Search Console property to the web stream and publish the Search Console report collection. This requires a verified GSC owner and GA4 Editor. Existing links must be inspected before changing them.
8. Configure reports for organic landing pages, key-event sessions, resource interest, no-result search, homepage browsing and 404 visits. Query reports cannot identify an individual visitor's keyword and conversion.

Bing Webmaster Tools is a separate account setup: verify the site, submit the same sitemap, and record the result. No client script is needed for its search reporting. Do not claim this is completed merely because the website has a sitemap.

## Verification and rollback

Run `npm run check` and `npm run check:web`. Unit tests cover consent, URL sanitation, event behavior and structured data. After deployment, `node scripts/check-web-live.mjs` verifies public status codes, index directives, canonical URL, sitemap and representative metadata. GitHub Actions checks the deployed release marker against the commit that was built.

Once a real stream is configured, use Firefox, Tag Assistant and GA4 DebugView/Realtime to verify the following:

- No Google request before acceptance or after rejection. Withdrawal stops new events; another tab respects updated consent.
- One page view per document; search typing, filter changes, hash navigation and React rerenders do not add views.
- Search strings and arbitrary 404 paths do not appear in event requests. Primary source clicks do not duplicate generic outbound clicks.
- Mouse, keyboard, modifier and middle-click link activation preserve navigation. Copy rejection and video playback rejection never emit success.
- A controlled campaign link reports the expected source, medium and campaign after URL sanitation.
- Blocked/offline analytics leaves search, saving, copying and video playback usable. Mobile and reduced-motion behavior stays intact.

Record the deployment date and account settings with the verification results. Recheck processed analytics after its processing delay and search data when available; compare 7- and 28-day windows only when enough data exists.

To stop analytics, set `ANALYTICS_ENABLED=false` and redeploy. For an application regression, revert the relevant commit and deploy the previous working site. Do not delete a GA4 property or Search Console verification to roll back website code.

## Authoritative references

- [Manual page-view measurement](https://developers.google.com/analytics/devguides/collection/ga4/views?technology=websites)
- [Consent modes](https://developers.google.com/tag-platform/security/concepts/consent-mode)
- [Avoid sending personal information](https://support.google.com/analytics/answer/6366371?hl=en)
- [Search Console and GA4 linking](https://support.google.com/analytics/answer/10737381?hl=en)
