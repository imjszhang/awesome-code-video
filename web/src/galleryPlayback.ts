/**
 * Homepage gallery playback for one playable preview at a time.
 *
 * A click or the native button keys (Enter/Space) start the chosen file muted
 * and enable its controls so the viewer can unmute. Choosing another preview
 * pauses the previous one and returns it to the start. Resuming the same
 * preview keeps the viewer's mute choice and position.
 *
 * This module never fetches or copies media. Starting playback is not a local
 * render test.
 */

export type GalleryPlaybackState = {
  activeId: string | null;
  playing: boolean;
};

export type PreviewMedia = {
  muted: boolean;
  controls: boolean;
  currentTime: number;
  play: () => Promise<void> | void;
  pause: () => void;
};

export type PreviewMediaMap = {
  get: (id: string) => PreviewMedia | undefined;
};

export function resetPreview(video: PreviewMedia) {
  video.pause();
  try {
    video.currentTime = 0;
  } catch {
    /* Metadata may be unavailable; pause still stops the previous preview. */
  }
  video.controls = false;
}

/** Toggle the preview `id`. Missing media leaves the gallery unchanged. */
export function toggleGalleryPlayback(
  state: GalleryPlaybackState,
  id: string,
  videos: PreviewMediaMap,
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
