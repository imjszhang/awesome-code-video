import gallery from '../../data/fable-52-gallery.json';

/**
 * Public Fable 5.2 posts, kept outside the curated catalog.
 * Append new posts to data/fable-52-gallery.json only. Do not merge this
 * file into data/resources.json, data/evidence.json, data/projects.json,
 * data/collections.json, or the README index, and do not add these posts
 * to catalog counts.
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
/** Homepage horizontal row. The full index lives at FABLE_SPOTLIGHT_PATH. */
export const FABLE_SPOTLIGHT_HOME_LIMIT = 12;

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
