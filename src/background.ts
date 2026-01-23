/**
 * Grok Imagine Favorites Manager - Background Service Worker (Strict TypeScript)
 * Handles download operations and progress tracking
 */

import type { DownloadMessage, MediaItem, DownloadProgress, ChromeResponse } from './types';
import type { BulkDownloadMessage, MediaPost, DownloadType, VideoInfo } from './types/media';
import { DOWNLOAD_RATE_LIMIT_MS, DOWNLOAD_FOLDER } from './types';
import { markAsDownloaded } from './utils/storage';

/**
 * Download configuration constants
 */
const DOWNLOAD_CONFIG = {
  RATE_LIMIT_MS: DOWNLOAD_RATE_LIMIT_MS,
  FOLDER: DOWNLOAD_FOLDER
} as const;

// Log when background script loads
console.log('[Background] Background service worker loaded and ready');
console.log('[Background] Download config:', DOWNLOAD_CONFIG);

/**
 * Handles messages from content script and popup
 */
chrome.runtime.onMessage.addListener(
  (
    request: unknown,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: ChromeResponse) => void
  ): boolean => {
    const typedRequest = request as DownloadMessage | BulkDownloadMessage | { action: string };
    
    console.log('[Background] Received message:', typedRequest.action, typedRequest);
    
    // Handle legacy download format (from content script)
    if (typedRequest.action === 'startDownloads' && 'media' in typedRequest) {
      console.log('[Background] Handling legacy startDownloads');
      handleDownloads(typedRequest.media)
        .then((): void => {
          console.log('[Background] Download completed successfully');
          sendResponse({ success: true });
        })
        .catch((error: unknown): void => {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          console.error('[Background] Download error:', error);
          sendResponse({ success: false, error: errorMessage });
        });
      return true; // Keep channel open for async response
    }
    
    // Handle new bulk download format (from popup)
    if (typedRequest.action === 'bulkDownload' && 'posts' in typedRequest && 'downloadType' in typedRequest) {
      console.log('[Background] Handling bulkDownload with', typedRequest.posts.length, 'posts');
      handleBulkDownload(typedRequest.posts, typedRequest.downloadType)
        .then((): void => {
          console.log('[Background] Bulk download completed successfully');
          sendResponse({ success: true });
        })
        .catch((error: unknown): void => {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          console.error('[Background] Bulk download error:', error);
          sendResponse({ success: false, error: errorMessage });
        });
      return true; // Keep channel open for async response
    }
    
    console.warn('[Background] Unknown action:', typedRequest.action);
    return false;
  }
);

/**
 * Processes download queue with rate limiting
 */
async function handleDownloads(media: readonly MediaItem[]): Promise<void> {
  console.log('[Background] handleDownloads called with', media.length, 'items');
  
  if (!Array.isArray(media) || media.length === 0) {
    throw new Error('No media provided for download');
  }
  
  // Initialize download tracking
  await chrome.storage.local.set({ 
    totalDownloads: media.length,
    downloadProgress: {} satisfies DownloadProgress
  });
  
  console.log('[Background] Initialized download tracking for', media.length, 'items');
  
  // Queue downloads with rate limiting
  media.forEach((item: MediaItem, index: number): void => {
    setTimeout((): void => {
      console.log('[Background] Downloading item', index + 1, 'of', media.length, ':', item.filename);
      downloadFile(item);
    }, index * DOWNLOAD_CONFIG.RATE_LIMIT_MS);
  });
}

/**
 * Downloads a single file
 */
function downloadFile(item: MediaItem): void {
  if (!item.url || !item.filename) {
    console.error('[Background] Invalid download item:', item);
    return;
  }
  
  const fullPath = `${DOWNLOAD_CONFIG.FOLDER}/${item.filename}`;
  console.log('[Background] Starting download:', fullPath, 'from', item.url);
  
  chrome.downloads.download({ 
    url: item.url, 
    filename: fullPath,
    saveAs: false
  }, (downloadId: number | undefined): void => {
    if (chrome.runtime.lastError) {
      console.error('[Background] Download failed:', chrome.runtime.lastError);
    } else {
      console.log('[Background] Download started with ID:', downloadId);
    }
  });
}

/**
 * Handle bulk download from the new media browser
 */
async function handleBulkDownload(posts: readonly MediaPost[], downloadType: DownloadType): Promise<void> {
  console.log('[Background] handleBulkDownload called with', posts.length, 'posts, type:', downloadType);
  
  if (!Array.isArray(posts) || posts.length === 0) {
    throw new Error('No posts provided for download');
  }

  const mediaItems: MediaItem[] = [];

  // Extract media items based on download type
  for (const post of posts) {
    console.log('[Background] Processing post:', post.id, 'imageUrl:', post.imageUrl, 'videos:', post.videoUrls?.length);
    
    const postId = post.id;
    let imageDownloaded = false;
    const videosDownloaded: string[] = [];

    // Add image
    if ((downloadType === 'images' || downloadType === 'both') && post.imageUrl) {
      const imageFilename = `${postId}.png`;
      mediaItems.push({ url: post.imageUrl, filename: imageFilename });
      imageDownloaded = true;
      console.log('[Background] Added image:', imageFilename);
    }

    // Add videos (prefer HD URLs when available)
    if (downloadType === 'videos' || downloadType === 'both') {
      if (post.videos && post.videos.length > 0) {
        // Use new video structure with HD support
        post.videos.forEach((video: VideoInfo, index: number): void => {
          const videoUrl = video.hdMediaUrl || video.mediaUrl; // Prefer HD
          const quality = video.hdMediaUrl ? 'HD' : 'SD';
          const videoFilename = `${postId}_video_${index + 1}_${quality}.mp4`;
          mediaItems.push({ url: videoUrl, filename: videoFilename });
          videosDownloaded.push(videoUrl);
          console.log(`[Background] Added ${quality} video:`, videoFilename);
        });
      } else if (post.videoUrls && post.videoUrls.length > 0) {
        // Fallback to legacy videoUrls
        post.videoUrls.forEach((videoUrl: string, index: number): void => {
          const videoFilename = `${postId}_video_${index + 1}.mp4`;
          mediaItems.push({ url: videoUrl, filename: videoFilename });
          videosDownloaded.push(videoUrl);
          console.log('[Background] Added video (legacy):', videoFilename);
        });
      }
    }

    // Mark as downloaded in tracking
    if (imageDownloaded || videosDownloaded.length > 0) {
      await markAsDownloaded(postId, imageDownloaded, videosDownloaded);
      console.log('[Background] Marked as downloaded:', postId);
    }
  }

  console.log('[Background] Total media items to download:', mediaItems.length);

  // Use existing download handler
  if (mediaItems.length > 0) {
    await handleDownloads(mediaItems);
  } else {
    console.warn('[Background] No media items to download!');
  }
}

/**
 * Tracks download state changes
 */
chrome.downloads.onChanged.addListener((delta: chrome.downloads.DownloadDelta): void => {
  if (!delta.state) return;
  
  const state = delta.state;
  
  chrome.storage.local.get(['downloadProgress'], (result: { downloadProgress?: DownloadProgress }): void => {
    const progress: Record<number, 'complete' | 'failed'> = { ...(result.downloadProgress ?? {}) };
    
    if (state.current === 'complete') {
      progress[delta.id] = 'complete';
    } else if (state.current === 'interrupted') {
      progress[delta.id] = 'failed';
    }
    
    chrome.storage.local.set({ downloadProgress: progress });
  });
});
