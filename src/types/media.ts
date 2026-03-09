/**
 * TypeScript types for Media API and storage
 */

// HD Status Types
export type HDStatus = 'all' | 'partial' | 'none' | 'unknown';

// Video info with HD URL
export interface VideoInfo {
  readonly mediaUrl: string;
  readonly hdMediaUrl?: string;
}

// API Response Types
export interface MediaPost {
  readonly id: string;
  readonly imageUrl: string;
  readonly thumbnailUrl?: string;
  readonly videoUrls?: readonly string[]; // Legacy - kept for backward compatibility
  readonly videos?: readonly VideoInfo[];
  readonly videoCount: number;
  readonly createdAt: number;
  readonly userId?: string;
  readonly prompt?: string;
  readonly tags?: readonly string[];
  hdStatus?: HDStatus;
}

export interface MediaListResponse {
  readonly posts: readonly MediaPost[];
  readonly nextCursor?: string;
  readonly hasMore: boolean;
  readonly total?: number;
}

export interface MediaListParams {
  readonly cursor?: string;
  readonly limit?: number;
}

// Storage Types for Download Tracking
export interface DownloadedMediaInfo {
  readonly imageDownloaded: boolean;
  readonly videosDownloaded: readonly string[];
  readonly downloadDate: number;
}

export interface DownloadTrackingStorage {
  readonly downloadedMedia: {
    readonly [postId: string]: DownloadedMediaInfo;
  };
}

// Component Props Types
export interface MediaThumbnailProps {
  readonly post: MediaPost;
  readonly isSelected: boolean;
  readonly isDownloaded: boolean;
  readonly onToggleSelect: (postId: string, shiftKey?: boolean) => void;
}

export interface BulkActionsProps {
  readonly selectedCount: number;
  readonly onDownloadImages: () => void;
  readonly onDownloadVideos: () => void;
  readonly onDownloadBoth: () => void;
  readonly onUpscaleVideos: () => void;
  readonly onUnfavorite: () => void;
  readonly onDeletePosts: () => void;
  readonly onDeselectAll: () => void;
  readonly isProcessing: boolean;
  readonly isUpscaling?: boolean;
  readonly upscaleProgress?: string;
  readonly isUnfavoriting?: boolean;
  readonly unfavoriteProgress?: string;
  readonly isDeleting?: boolean;
  readonly deleteProgress?: string;
}

// Download Types
export type DownloadType = 'images' | 'videos' | 'both';

export interface BulkDownloadMessage {
  readonly action: 'bulkDownload';
  readonly posts: readonly MediaPost[];
  readonly downloadType: DownloadType;
}

export interface BulkUnfavoriteMessage {
  readonly action: 'bulkUnfavorite';
  readonly postIds: readonly string[];
}

export interface UpdateDownloadTrackingMessage {
  readonly action: 'updateDownloadTracking';
  readonly postId: string;
  readonly imageDownloaded: boolean;
  readonly videosDownloaded: readonly string[];
}
