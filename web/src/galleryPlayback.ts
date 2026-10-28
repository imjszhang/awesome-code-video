/**
 * Homepage gallery playback for one playable preview at a time.
 *
 * The media URL stays off the element until Play. A click or the native
 * button keys (Enter/Space) assign that URL, start the file muted, and
 * enable its controls so the viewer can unmute. Choosing another preview
 * pauses the previous one, returns it to the start, and drops its src so
 * the browser does not keep that file loaded. Resuming the same preview
 * keeps the viewer's mute choice and position.
 *
 * This module never copies media. Starting playback is not a local render
 * test.
 */

export type GalleryPlaybackState = {
  activeId: string | null;
  playing: boolean;
};

export type PreviewMedia = {
  muted: boolean;
  controls: boolean;
  currentTime: number;
  src: string;
  play: () => Promise<void> | void;
  pause: () => void;
  getAttribute: (name: string) => string | null;
  removeAttribute: (name: string) => void;
  load: () => void;
};

export type PreviewMediaMap = {
  get: (id: string) => PreviewMedia | undefined;
};

export type PreviewSourceMap = {
  get: (id: string) => string | undefined;
};

/** Drop a file URL so an idle card does not keep the media response. */
export function releasePreviewSource(video: PreviewMedia) {
  if (!video.getAttribute('src')) return;
  video.removeAttribute('src');
  try {
    video.load();
  } catch {
    /* The element may already be detached. */
  }
}

export function resetPreview(video: PreviewMedia) {
  video.pause();
  try {
    video.currentTime = 0;
  } catch {
    /* Metadata may be unavailable; pause still stops the previous preview. */
  }
  video.controls = false;
  releasePreviewSource(video);
}

function attachPreviewSource(video: PreviewMedia, url: string) {
  if (video.getAttribute('src') === url) return;
  video.src = url;
}

/** Toggle the preview `id`. Missing media leaves the gallery unchanged. */
export function toggleGalleryPlayback(
  state: GalleryPlaybackState,
  id: string,
  videos: PreviewMediaMap,
  sources?: PreviewSourceMap,
): { state: GalleryPlaybackState; play: Promise<void> | null } {
  const video = videos.get(id);
  if (!video) return { state, play: null };
  if (state.activeId === id && state.playing) {
    video.pause();
    return { state: { activeId: id, playing: false }, play: null };
  }
  const resuming = state.activeId === id;
  if (state.activeId && !resuming) {
    const previous = videos.get(state.activeId);
    if (previous) resetPreview(previous);
  }
  const url = sources?.get(id);
  if (url) attachPreviewSource(video, url);
  if (!resuming) video.muted = true;
  video.controls = true;
  let play: Promise<void> | null = null;
  try {
    const pending = video.play();
    play = pending == null ? null : Promise.resolve(pending);
  } catch (error) {
    play = Promise.reject(error instanceof Error ? error : new Error('Preview playback failed'));
  }
  return { state: { activeId: id, playing: true }, play };
}

/** Drop the active session after `play()` rejects. The caller resets the element. */
export function abandonGalleryPlayback(state: GalleryPlaybackState, id: string): GalleryPlaybackState {
  if (state.activeId !== id) return state;
  return { activeId: null, playing: false };
}
