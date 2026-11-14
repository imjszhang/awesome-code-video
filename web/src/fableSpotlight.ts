import gallery from '../../data/fable-52-gallery.json';
import posters from '../../data/fable-52-posters.json';

/**
 * Public Fable 5.2 posts, kept outside the curated catalog.
 * Append new posts to data/fable-52-gallery.json only. Do not merge this
 * file into data/resources.json, data/evidence.json, data/projects.json,
 * data/collections.json, or the README index, and do not add these posts
 * to catalog counts. Cards use a bundled still from
 * data/fable-52-posters.json. Visible cards stream a muted looping preview
 * from the original video URL after they enter the viewport. The file is
 * not copied into this repository.
 */
export type FableSpotlightItem = {
  id: string;
  url: string;
  author: string;
  author_name: string;
  created_at_utc: string;
  created_at_shanghai: string;
  likes: number;
  text: string;
  has_video: boolean;
  video_url: string;
  preview: string;
  duration_ms: number;
  why: string;
  tags: string[];
};

export type FableSpotlightCollection = {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  updated_at_shanghai: string;
  item_count: number;
  source: string;
  items: FableSpotlightItem[];
};

export const fableSpotlight = gallery as FableSpotlightCollection;
export const FABLE_SPOTLIGHT_ID = 'fable-5-2';
export const FABLE_SPOTLIGHT_PATH = `spotlight/${FABLE_SPOTLIGHT_ID}/`;
/** Visible heading. The gallery record keeps its short title. */
export const FABLE_SPOTLIGHT_HEADING = 'Claude Fable 5.2';
/** Search title for the dedicated spotlight page. */
export const FABLE_SPOTLIGHT_PAGE_TITLE = 'Claude Fable 5.2 Code Videos | Awesome Code Video';
/**
 * Search description for the dedicated page.
 * These posts stay outside the curated main index.
 */
export const FABLE_SPOTLIGHT_PAGE_DESCRIPTION = 'Claude Fable 5.2 code videos from public posts, especially code, HTML, and Blender pipelines. These posts are not yet in the curated main index. Stills stay on this site. Muted previews loop after a card enters the viewport; the original post stays linked.';

export type FableSpotlightPoster = {
  id: string;
  source_url: string;
  source_sha256: string;
  poster: string;
  poster_sha256: string;
};

export const fableSpotlightPosters = posters as FableSpotlightPoster[];
const posterById = new Map(fableSpotlightPosters.map(record => [record.id, record]));

/** Bundled still when one has been generated; otherwise the upstream preview. */
export function spotlightStill(item: Pick<FableSpotlightItem, 'id' | 'preview'>, href: (path?: string) => string = path => path ?? ''): string {
  const record = posterById.get(item.id);
  if (!record?.poster.startsWith('/spotlight/')) return item.preview;
  return href(record.poster.slice(1));
}
/** Homepage grid. The full index lives at FABLE_SPOTLIGHT_PATH. */
export const FABLE_SPOTLIGHT_HOME_LIMIT = 24;

export type SpotlightFrame = 'landscape' | 'portrait' | 'square';

/** Newest original post first. Equal timestamps keep the higher id first. */
export function fableSpotlightItems(items: readonly FableSpotlightItem[] = fableSpotlight.items): FableSpotlightItem[] {
  return [...items].sort((a, b) => {
    const delta = Date.parse(b.created_at_utc) - Date.parse(a.created_at_utc);
    if (delta !== 0) return delta;
    return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
  });
}

export function fableSpotlightHomeItems(items: readonly FableSpotlightItem[] = fableSpotlight.items): FableSpotlightItem[] {
  return fableSpotlightItems(items).slice(0, FABLE_SPOTLIGHT_HOME_LIMIT);
}

export const spotlightFrameOrder = ['landscape', 'portrait', 'square'] as const;

const spotlightFrameLabels: Record<SpotlightFrame, string> = {
  landscape: 'Landscape',
  portrait: 'Portrait',
  square: 'Square',
};

/** Keep the incoming order, which is original-post time descending. */
export function fableSpotlightGroups(items: readonly FableSpotlightItem[]): Record<SpotlightFrame, FableSpotlightItem[]> {
  const groups: Record<SpotlightFrame, FableSpotlightItem[]> = {landscape: [], portrait: [], square: []};
  for (const item of items) groups[spotlightFrame(item)].push(item);
  return groups;
}

/** Non-empty frame blocks, landscape then portrait then square. */
export function fableSpotlightBlocks(items: readonly FableSpotlightItem[]): {frame: SpotlightFrame; label: string; items: FableSpotlightItem[]}[] {
  const groups = fableSpotlightGroups(items);
  return spotlightFrameOrder.flatMap(frame => groups[frame].length ? [{frame, label: spotlightFrameLabels[frame], items: groups[frame]}] : []);
}

/** Frame size encoded in the original host path, when the URL includes one. */
export function spotlightFrame(item: Pick<FableSpotlightItem, 'video_url'>): SpotlightFrame {
  const match = item.video_url.match(/(\d{2,5})x(\d{2,5})/);
  if (!match) return 'landscape';
  const width = Number(match[1]);
  const height = Number(match[2]);
  if (!(width > 0) || !(height > 0)) return 'landscape';
  if (width === height) return 'square';
  return width > height ? 'landscape' : 'portrait';
}

/** Running time from the post record, shown like other gallery clocks. */
export function spotlightDuration(durationMs: number): string | null {
  if (!Number.isFinite(durationMs) || durationMs <= 0) return null;
  const seconds = Math.round(durationMs / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/** First line of the original post, without a trailing short link. */
export function spotlightExcerpt(text: string, limit = 140): string {
  const line = text.split('\n').map(part => part.trim()).find(Boolean) ?? '';
  const clean = line.replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim();
  if (clean.length <= limit) return clean;
  return `${clean.slice(0, limit - 1).trimEnd()}…`;
}
