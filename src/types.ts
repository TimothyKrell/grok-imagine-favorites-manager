/**
 * Strict TypeScript type definitions for Grok Imagine Favorites Manager
 */

// Action types
export type ActionType = 
  | 'saveImages' 
  | 'saveVideos' 
  | 'saveBoth' 
  | 'upscaleVideos' 
  | 'unsaveAll'
  | 'cancelOperation'
  | 'ping';

// Message types
export interface ChromeMessage {
  readonly action: ActionType;
}

export interface ChromeResponse {
  readonly success: boolean;
  readonly loaded?: boolean;
  readonly error?: string;
}

// Media types
export interface MediaItem {
  readonly url: string;
  readonly filename: string;
}

export interface DownloadMessage {
  readonly action: 'startDownloads';
  readonly media: readonly MediaItem[];
}

// Storage types
export interface DownloadProgress {
  readonly [downloadId: number]: 'complete' | 'failed';
}

export interface StorageData {
  readonly totalDownloads?: number;
  readonly downloadProgress?: DownloadProgress;
  readonly activeOperation?: boolean;
}

// Constants
export const UPDATE_INTERVAL = 1000 as const;
export const PROGRESS_CLEAR_DELAY = 5000 as const;
export const DOWNLOAD_RATE_LIMIT_MS = 300 as const;
export const DOWNLOAD_FOLDER = 'grok-imagine' as const;

// Helper types
export type NonEmptyArray<T> = readonly [T, ...T[]];

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

// Chrome API augmentations
export interface ExtendedTab extends chrome.tabs.Tab {
  readonly id: number; // Make id required
}

// Utility types for strict null checks
export type Defined<T> = Exclude<T, undefined>;
export type NonNull<T> = Exclude<T, null>;
export type NonNullable<T> = Exclude<T, null | undefined>;
