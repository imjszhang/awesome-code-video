import React,{useCallback,useEffect,useRef,useState} from 'react';

/**
 * In-viewport previews for the Fable spotlight.
 *
 * Stills paint first. A card receives its original video URL only after it
 * enters the viewport, and only while it is one of the few closest to the
 * center. Leaving the viewport, or a failed load / play(), pauses the file
 * and drops src so a long gallery does not keep every video open.
 * video.twimg.com refuses playback when the media element sends this site's
 * Referer. Chrome still attaches that header to a video src request, so the
 * file is fetched with referrerPolicy "no-referrer" and played from a blob
 * URL. The player also sets referrerPolicy="no-referrer". Nothing is copied
 * into the repository.
 */

export const SPOTLIGHT_PREVIEW_CAP = 6;

export type SpotlightPreviewCandidate = {
  id: string;
  intersecting: boolean;
  /** Distance from the card center to the viewport center. Smaller is closer. */
  distanceToCenter: number;
};

export type SpotlightViewport = {width: number; height: number};

export type SpotlightRect = {
  left: number;
  top: number;
  width: number;
  height: number;
  right?: number;
  bottom?: number;
};

/** True when any part of the rect meets the viewport. */
export function rectIntersectsViewport(rect: SpotlightRect, viewport: SpotlightViewport): boolean {
  const right = rect.right ?? rect.left + rect.width;
  const bottom = rect.bottom ?? rect.top + rect.height;
  return rect.left < viewport.width && right > 0 && rect.top < viewport.height && bottom > 0;
}

/** Euclidean distance between the rect center and the viewport center. */
export function viewportCenterDistance(rect: SpotlightRect, viewport: SpotlightViewport): number {
  const dx = rect.left + rect.width / 2 - viewport.width / 2;
  const dy = rect.top + rect.height / 2 - viewport.height / 2;
  return Math.hypot(dx, dy);
}

/**
 * Intersecting cards closest to the viewport center, up to `cap`.
 * Equal distances keep the smaller id. Blocked ids stay on their still.
 */
export function selectSpotlightPreviews(
  candidates: readonly SpotlightPreviewCandidate[],
  cap = SPOTLIGHT_PREVIEW_CAP,
  blocked: ReadonlySet<string> = new Set(),
): string[] {
  const limit = Math.max(0, cap);
  return candidates
    .filter(candidate => candidate.intersecting && !blocked.has(candidate.id))
    .sort((a, b) => a.distanceToCenter - b.distanceToCenter || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .slice(0, limit)
    .map(candidate => candidate.id);
}

export type SpotlightMedia = {
  pause: () => void;
  load: () => void;
  getAttribute: (name: string) => string | null;
  removeAttribute: (name: string) => void;
};

/** Pause a preview and drop its file URL so the browser can release the response. */
export function releaseSpotlightMedia(video: SpotlightMedia) {
  try { video.pause(); } catch { /* The element may already be detached. */ }
  const src = video.getAttribute('src');
  if (src?.startsWith('blob:')) {
    try { URL.revokeObjectURL(src); } catch { /* Already revoked. */ }
  }
  if (!src) return;
  video.removeAttribute('src');
  try { video.load(); } catch { /* The element may already be detached. */ }
}

type PreviewVideoProps = {url: string; poster: string};

function usePreviewElement() {
  const ref = useRef<HTMLVideoElement>(null);
  const bind = useCallback((node: HTMLVideoElement | null) => {
    ref.current = node;
    if (!node) return;
    node.muted = true;
    node.setAttribute('referrerpolicy', 'no-referrer');
  }, []);
  return {ref, bind};
}

function aborted(error: unknown) {
  return error instanceof Error && error.name === 'AbortError';
}

/** Fetch the original file without a Referer and return a local object URL. */
async function fetchSpotlightObjectUrl(url: string, signal: AbortSignal) {
  const response = await fetch(url, {referrerPolicy: 'no-referrer', signal});
  if (!response.ok) throw new Error(`Preview request failed (${response.status})`);
  const blob = await response.blob();
  if (signal.aborted) throw new DOMException('The preview was aborted.', 'AbortError');
  return URL.createObjectURL(blob);
}

/** Muted looping card preview. Unmounting, or a failed play()/load, leaves the still in place. */
export function SpotlightLoopVideo({url, poster, onFail}: PreviewVideoProps & {onFail: () => void}) {
  const {ref, bind} = usePreviewElement();
  const fail = useRef(onFail);
  fail.current = onFail;
  const [objectUrl, setObjectUrl] = useState<string | undefined>();
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    let created = '';
    void fetchSpotlightObjectUrl(url, controller.signal).then(next => {
      if (cancelled) { URL.revokeObjectURL(next); return; }
      created = next;
      setObjectUrl(next);
    }, error => {
      if (cancelled || aborted(error)) return;
      fail.current();
    });
    return () => {
      cancelled = true;
      controller.abort();
      if (created) URL.revokeObjectURL(created);
    };
  }, [url]);
  useEffect(() => {
    const node = ref.current;
    if (!node || !objectUrl) return;
    node.setAttribute('referrerpolicy', 'no-referrer');
    node.muted = true;
    node.loop = true;
    let cancelled = false;
    const giveUp = () => {
      if (cancelled) return;
      cancelled = true;
      releaseSpotlightMedia(node);
      fail.current();
    };
    node.addEventListener('error', giveUp);
    let pending: Promise<void> | void = undefined;
    try { pending = node.play(); } catch { giveUp(); }
    if (!cancelled) {
      void Promise.resolve(pending).then(() => { if (!cancelled) setShown(true); }, () => { if (!cancelled) giveUp(); });
    }
    return () => {
      cancelled = true;
      node.removeEventListener('error', giveUp);
      releaseSpotlightMedia(node);
    };
  }, [objectUrl, ref]);
  return <video ref={bind} className={`preview-media preview-player${shown ? ' is-armed' : ''}`} src={objectUrl} poster={poster || undefined} muted loop playsInline preload="none" referrerPolicy="no-referrer" aria-hidden="true"/>;
}

/**
 * One in-page player for the open post. Controls stay available so the viewer
 * can unmute. A network or decode error removes the player and leaves the still.
 */
export function SpotlightModalVideo({url, poster}: PreviewVideoProps) {
  const {ref, bind} = usePreviewElement();
  const [objectUrl, setObjectUrl] = useState<string | undefined>();
  const [failed, setFailed] = useState(false);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    let created = '';
    void fetchSpotlightObjectUrl(url, controller.signal).then(next => {
      if (cancelled) { URL.revokeObjectURL(next); return; }
      created = next;
      setObjectUrl(next);
    }, error => {
      if (cancelled || aborted(error)) return;
      setFailed(true);
    });
    return () => {
      cancelled = true;
      controller.abort();
      if (created) URL.revokeObjectURL(created);
    };
  }, [url]);
  useEffect(() => {
    const node = ref.current;
    if (!node || !objectUrl) return;
    node.setAttribute('referrerpolicy', 'no-referrer');
    node.muted = true;
    let cancelled = false;
    let broken = false;
    const onError = () => {
      broken = true;
      if (!cancelled) setFailed(true);
    };
    node.addEventListener('error', onError);
    const show = () => { if (!cancelled && !broken) setShown(true); };
    try {
      const pending = node.play();
      void Promise.resolve(pending).then(show, show);
    } catch { show(); }
    return () => {
      cancelled = true;
      node.removeEventListener('error', onError);
      releaseSpotlightMedia(node);
    };
  }, [objectUrl, ref]);
  if (failed || !url) return null;
  return <video ref={bind} className={`preview-media preview-player${shown ? ' is-armed' : ''}`} src={objectUrl} poster={poster || undefined} controls muted playsInline preload="none" referrerPolicy="no-referrer"/>;
}

export function useSpotlightPreviews(enabled: boolean) {
  const nodes = useRef(new Map<string, HTMLElement>());
  const blocked = useRef(new Set<string>());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [active, setActive] = useState<ReadonlySet<string>>(() => new Set());

  const recompute = useCallback(() => {
    // Read the latest layout and blocked set when the update is applied, so a
    // burst of play() failures cannot restore a card the previous update dropped.
    setActive(current => {
      const viewport = {width: window.innerWidth, height: window.innerHeight};
      const candidates: SpotlightPreviewCandidate[] = [];
      for (const [id, element] of nodes.current) {
        const rect = element.getBoundingClientRect();
        candidates.push({
          id,
          intersecting: rectIntersectsViewport(rect, viewport),
          distanceToCenter: viewportCenterDistance(rect, viewport),
        });
      }
      const next = selectSpotlightPreviews(candidates, SPOTLIGHT_PREVIEW_CAP, blocked.current);
      return current.size === next.length && next.every(id => current.has(id)) ? current : new Set(next);
    });
  }, []);

  useEffect(() => {
    if (!enabled) {
      setActive(current => current.size === 0 ? current : new Set());
      return;
    }
    let alive = true;
    let queued = false;
    const schedule = () => {
      if (queued) return;
      queued = true;
      queueMicrotask(() => {
        queued = false;
        if (alive) recompute();
      });
    };
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(() => schedule());
    observerRef.current = observer;
    for (const node of nodes.current.values()) observer?.observe(node);
    window.addEventListener('scroll', schedule, {passive: true});
    window.addEventListener('resize', schedule);
    recompute();
    return () => {
      alive = false;
      observer?.disconnect();
      if (observerRef.current === observer) observerRef.current = null;
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [enabled, recompute]);

  const bind = useCallback((id: string, node: HTMLElement | null) => {
    const previous = nodes.current.get(id);
    if (previous && previous !== node) observerRef.current?.unobserve(previous);
    if (!node) {
      nodes.current.delete(id);
      return;
    }
    nodes.current.set(id, node);
    observerRef.current?.observe(node);
  }, []);

  const block = useCallback((id: string) => {
    if (!id || blocked.current.has(id)) return;
    blocked.current.add(id);
    recompute();
  }, [recompute]);

  return {active, bind, block};
}
