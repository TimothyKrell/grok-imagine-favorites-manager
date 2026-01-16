/**
 * Storage utility for managing download tracking
 */

import type { DownloadedMediaInfo } from '../types/media';

const STORAGE_KEY = 'downloadedMedia';

/**
 * Get all downloaded media tracking data
 */
export async function getDownloadedMedia(): Promise<Record<string, DownloadedMediaInfo>> {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      resolve((result[STORAGE_KEY] as Record<string, DownloadedMediaInfo>) || {});
    });
  });
}

/**
 * Check if a post has been downloaded
 */
export async function isPostDownloaded(postId: string): Promise<boolean> {
  const downloaded = await getDownloadedMedia();
  return postId in downloaded;
}

/**
 * Get download info for a specific post
 */
export async function getPostDownloadInfo(postId: string): Promise<DownloadedMediaInfo | null> {
  const downloaded = await getDownloadedMedia();
  return downloaded[postId] || null;
}

/**
 * Mark a post as downloaded
 */
export async function markAsDownloaded(
  postId: string,
  imageDownloaded: boolean,
  videosDownloaded: readonly string[] = []
): Promise<void> {
  const downloaded = await getDownloadedMedia();
  
  const updated = {
    ...downloaded,
    [postId]: {
      imageDownloaded,
      videosDownloaded: [...videosDownloaded],
      downloadDate: Date.now(),
    } as DownloadedMediaInfo,
  };

  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: updated }, () => {
      resolve();
    });
  });
}

/**
 * Update download tracking for a post (merge with existing data)
 */
export async function updateDownloadTracking(
  postId: string,
  imageDownloaded?: boolean,
  newVideosDownloaded?: readonly string[]
): Promise<void> {
  const downloaded = await getDownloadedMedia();
  const existing = downloaded[postId];

  const updated = {
    ...downloaded,
    [postId]: {
      imageDownloaded: imageDownloaded ?? existing?.imageDownloaded ?? false,
      videosDownloaded: [
        ...(existing?.videosDownloaded || []),
        ...(newVideosDownloaded || []),
      ],
      downloadDate: existing?.downloadDate ?? Date.now(),
    } as DownloadedMediaInfo,
  };

  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: updated }, () => {
      resolve();
    });
  });
}

/**
 * Clear all download tracking data
 */
export async function clearAllDownloadTracking(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove([STORAGE_KEY], () => {
      resolve();
    });
  });
}

/**
 * Get count of downloaded posts
 */
export async function getDownloadedCount(): Promise<number> {
  const downloaded = await getDownloadedMedia();
  return Object.keys(downloaded).length;
}
