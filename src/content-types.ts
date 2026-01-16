/**
 * Type definitions specific to content script
 */

export interface ProgressModal {
  show(title: string, subtitle?: string): void;
  update(progress: number, details: string): void;
  hide(): void;
  remove(): void;
  cancel(): void;
  isCancelled(): boolean;
}

export interface VideoItem {
  readonly id: string;
  readonly url: string;
}

export interface PostData {
  readonly hasVideo: boolean;
  readonly hasImage: boolean;
}

export interface MediaData {
  readonly url: string;
  readonly filename: string;
  readonly isVideo: boolean;
  readonly isHD: boolean;
}

export const SELECTORS = {
  CARD: '[role="listitem"] .relative.group\\/media-post-masonry-card',
  IMAGE: 'img[alt*="Generated"]',
  VIDEO: 'video[src*="generated_video"]',
  VIDEO_INDICATOR: 'svg[data-icon="play"]',
  UNSAVE_BUTTON: 'button[aria-label="Unsave"]',
  LIST_ITEM: '[role="listitem"]'
} as const;

export const URL_PATTERNS = {
  IMAGE: ['imagine-public.x.ai', 'grok.com'] as const
} as const;

export const TIMING = {
  NAVIGATION_DELAY: 500,
  UNFAVORITE_DELAY: 150,
  POST_LOAD_DELAY: 1000,
  POST_UNFAVORITE_DELAY: 1000,
  UPSCALE_TIMEOUT: 30000
} as const;

export const API = {
  UNLIKE_ENDPOINT: 'https://grok.com/rest/media/post/unlike',
  UPSCALE_ENDPOINT: 'https://grok.com/rest/media/video/upscale'
} as const;

export type SaveType = 'saveImages' | 'saveVideos' | 'saveBoth';
