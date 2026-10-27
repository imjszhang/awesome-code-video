/**
 * Runtime view of the optional `preview` object shipped on catalog resources.
 *
 * Field contract matches `validatePreview` in scripts/lib/catalog.mjs and the
 * Batch A records in data/resources.json:
 * kind, url, license, attribution, redistributable, source, checked_at.
 * `poster` is optional and omitted when unknown. `source` is free text
 * (evidence id, upstream URL, and notes), not a closed enum. No other keys.
 *
 * A missing or invalid preview degrades to mode C: editorial cover, no URL.
 * Linking upstream media is not a local render test, and an editorial cover
 * is not an upstream render. These helpers never fetch or copy media.
 */

export const PREVIEW_KINDS = ['video', 'embed', 'thumb_link'] as const;
export type PreviewKind = (typeof PREVIEW_KINDS)[number];

export const PREVIEW_FIELDS = ['kind', 'url', 'poster', 'license', 'attribution', 'redistributable', 'source', 'checked_at'] as const;

export const PREVIEW_CAPTIONS = ['Editorial cover', 'Upstream demo', 'Preview'] as const;
export type PreviewCaption = (typeof PREVIEW_CAPTIONS)[number];

export type ResourcePreview = {
  kind: PreviewKind;
  url: string;
  /** Optional https image. Omitted when unknown; do not send null. */
  poster?: string;
  license: string;
  attribution: string;
  redistributable: boolean;
  /** Evidence id, upstream URL, and review notes. */
  source: string;
  /** ISO calendar date, YYYY-MM-DD. */
  checked_at: string;
};

export type ResolvedPreview = {
  /** Effective kind. Mode C uses `thumb_link` and `degraded: true`. */
  mode: PreviewKind;
  /** True only for a complete direct `video` file. Pages and images are not playable video. */
  playable: boolean;
  /** Honesty label. Editorial covers are not renders; previews are not local render tests. */
  caption: PreviewCaption;
  /** Sentence form of the honesty label. */
  detail: string;
  url: string | null;
  poster: string | null;
  license: string | null;
  attribution: string | null;
  source: string | null;
  redistributable: boolean;
  checkedAt: string | null;
  /** True when `preview` was missing or failed the shipped field checks. */
  degraded: boolean;
};

const EDITORIAL = 'Editorial cover — not an upstream render.';
const UPSTREAM = 'Upstream demo — not a local render test.';

function modeC(): ResolvedPreview {
  return {
    mode: 'thumb_link',
    playable: false,
    caption: 'Editorial cover',
    detail: EDITORIAL,
    url: null,
    poster: null,
    license: null,
    attribution: null,
    source: null,
    redistributable: false,
    checkedAt: null,
    degraded: true,
  };
}

function isNonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isListed<T extends string>(list: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (list as readonly string[]).includes(value);
}

/** YYYY-MM-DD that is a real calendar day. Full timestamps are rejected. */
export function isPreviewDay(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** https URL without userinfo. Anything else is unsafe to hand to the gallery. */
export function safePreviewUrl(value: unknown): string | null {
  if (!isNonEmpty(value)) return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith('https://')) return null;
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }
  if (parsed.username || parsed.password) return null;
  if (parsed.protocol !== 'https:') return null;
  return trimmed;
}

export function isCompletePreview(value: unknown): value is ResourcePreview {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const preview = value as Record<string, unknown>;
  for (const key of Object.keys(preview)) {
    if (!(PREVIEW_FIELDS as readonly string[]).includes(key)) return false;
  }
  if (!isListed(PREVIEW_KINDS, preview.kind)) return false;
  if (!safePreviewUrl(preview.url)) return false;
  if (preview.kind === 'video' && /\.gif$/i.test(new URL(preview.url as string).pathname)) return false;
  if (Object.hasOwn(preview, 'poster') && !safePreviewUrl(preview.poster)) return false;
  if (!isNonEmpty(preview.license) || !isNonEmpty(preview.attribution) || !isNonEmpty(preview.source)) return false;
  if (typeof preview.redistributable !== 'boolean') return false;
  if (preview.redistributable === true && preview.kind === 'embed') return false;
  if (!isPreviewDay(preview.checked_at)) return false;
  return true;
}

function honesty(kind: PreviewKind): { caption: PreviewCaption; detail: string } {
  if (kind === 'video') return { caption: 'Upstream demo', detail: UPSTREAM };
  if (kind === 'embed') return { caption: 'Preview', detail: 'Preview — upstream page, not a local render test.' };
  return { caption: 'Preview', detail: 'Preview — upstream image, not a local render test.' };
}

/** Resolve the mode a later gallery should use. Invalid records become mode C. */
export function resolvePreview(resource: { preview?: unknown } | null | undefined): ResolvedPreview {
  const preview = resource?.preview;
  if (!isCompletePreview(preview)) return modeC();
  const label = honesty(preview.kind);
  return {
    mode: preview.kind,
    playable: preview.kind === 'video',
    caption: label.caption,
    detail: label.detail,
    url: safePreviewUrl(preview.url),
    poster: Object.hasOwn(preview, 'poster') ? safePreviewUrl(preview.poster) : null,
    license: preview.license.trim(),
    attribution: preview.attribution.trim(),
    source: preview.source.trim(),
    redistributable: preview.redistributable,
    checkedAt: preview.checked_at,
    degraded: false,
  };
}

export function previewMode(resource: { preview?: unknown } | null | undefined): PreviewKind {
  return resolvePreview(resource).mode;
}

export function previewPlayable(resource: { preview?: unknown } | null | undefined): boolean {
  return resolvePreview(resource).playable;
}

export function previewCaption(resource: { preview?: unknown } | null | undefined): PreviewCaption {
  return resolvePreview(resource).caption;
}

export function previewUrl(resource: { preview?: unknown } | null | undefined): string | null {
  return resolvePreview(resource).url;
}

export function previewPoster(resource: { preview?: unknown } | null | undefined): string | null {
  return resolvePreview(resource).poster;
}
