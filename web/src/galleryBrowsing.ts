export const GALLERY_BATCH_SIZE = 12;
export const GALLERY_CATEGORY_IDS = ['video-gallery', 'animated-examples', 'other-resources'] as const;
export type GalleryCategory = typeof GALLERY_CATEGORY_IDS[number];

export type GalleryBrowseState = {
  activeCategory: GalleryCategory;
  visibleCounts: Record<GalleryCategory, number>;
};

export function createGalleryBrowseState(): GalleryBrowseState {
  return {
    activeCategory: 'video-gallery',
    visibleCounts: {
      'video-gallery': GALLERY_BATCH_SIZE,
      'animated-examples': GALLERY_BATCH_SIZE,
      'other-resources': GALLERY_BATCH_SIZE,
    },
  };
}

export function selectGalleryCategory(state: GalleryBrowseState, category: GalleryCategory): GalleryBrowseState {
  return category === state.activeCategory ? state : {...state, activeCategory: category};
}

export function loadMoreGalleryItems(state: GalleryBrowseState, total: number): GalleryBrowseState {
  const category = state.activeCategory;
  const nextCount = Math.min(state.visibleCounts[category] + GALLERY_BATCH_SIZE, total);
  if (nextCount <= state.visibleCounts[category]) return state;
  return {...state, visibleCounts: {...state.visibleCounts, [category]: nextCount}};
}
