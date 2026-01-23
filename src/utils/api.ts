/**
 * API client for Grok media endpoints
 */

import type { MediaPost, MediaListResponse, MediaListParams, HDStatus, VideoInfo } from '../types/media';

const API_BASE = 'https://grok.com/rest/media';

/**
 * Fetch media posts from the API
 */
export async function fetchMediaPosts(params?: MediaListParams): Promise<MediaListResponse> {
  try {
    // Build request body
    const requestBody: any = {
      limit: params?.limit || 40,
      filter: {
        source: 'MEDIA_POST_SOURCE_LIKED'
      }
    };

    // Add cursor to body if provided (for pagination)
    if (params?.cursor) {
      requestBody.cursor = params.cursor;
    }

    console.log('Fetching media posts with params:', requestBody);

    const response = await fetch(`${API_BASE}/post/list`, {
      method: 'POST',
      headers: {
        'Accept': '*/*',
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for authentication
      body: JSON.stringify(requestBody)
    });

    // Handle authentication errors
    if (response.status === 401 || response.status === 403) {
      throw new Error('Not authenticated. Please log into grok.com first.');
    }

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Log the raw API response for debugging
    console.log('Raw API response:', data);
    
    // Parse and transform the API response to our expected format
    const parsed = parseMediaListResponse(data);
    console.log('Parsed media list:', parsed);
    
    return parsed;
  } catch (error) {
    console.error('Error fetching media posts:', error);
    throw error;
  }
}

/**
 * Parse the raw API response into our MediaListResponse format
 */
function parseMediaListResponse(data: any): MediaListResponse {
  const posts: MediaPost[] = [];
  
  const items = data.posts || [];
  
  for (const item of items) {
    // Extract video info with both standard and HD URLs
    const videoUrls: string[] = [];
    const videos: VideoInfo[] = [];
    
    if (Array.isArray(item.videos)) {
      for (const video of item.videos) {
        if (video.mediaUrl) {
          videoUrls.push(video.mediaUrl);
          videos.push({
            mediaUrl: video.mediaUrl,
            hdMediaUrl: video.hdMediaUrl,
          });
        }
      }
    }

    const post: MediaPost = {
      id: item.id,
      imageUrl: item.mediaUrl || item.images?.[0]?.mediaUrl || '',
      thumbnailUrl: item.thumbnailImageUrl,
      videoUrls, // Legacy support
      videos,     // New structure with HD info
      videoCount: item.videos?.length || 0,
      createdAt: item.createTime ? new Date(item.createTime).getTime() : Date.now(),
      userId: item.userId,
      prompt: item.prompt || item.originalPrompt || '',
    };
    
    posts.push(post);
  }

  return {
    posts,
    nextCursor: data.nextCursor,
    hasMore: !!data.nextCursor,
    total: data.total,
  };
}



/**
 * Unfavorite a post by ID
 */
export async function unfavoritePost(postId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/post/unlike`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*',
      },
      credentials: 'include',
      body: JSON.stringify({ id: postId }),
    });

    return response.ok;
  } catch (error) {
    console.error(`Failed to unfavorite post ${postId}:`, error);
    return false;
  }
}

/**
 * Unfavorite multiple posts with progress tracking
 */
export async function unfavoritePosts(
  postIds: readonly string[],
  onProgress?: (completed: number, total: number) => void
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;
  const total = postIds.length;

  // Process with small delays to avoid rate limiting
  for (let i = 0; i < postIds.length; i++) {
    const postId = postIds[i];
    if (!postId) {
      failed++;
      continue;
    }
    
    const result = await unfavoritePost(postId);
    if (result) {
      success++;
    } else {
      failed++;
    }
    
    // Report progress
    if (onProgress) onProgress(i + 1, total);
    
    // Small delay between requests (150ms)
    await new Promise(resolve => setTimeout(resolve, 150));
  }

  return { success, failed };
}

/**
 * Extract video ID from video URL
 */
export function extractVideoId(videoUrl: string): string | null {
  try {
    // URL format: https://assets.grok.com/users/.../generated/{videoId}/generated_video.mp4
    const match = videoUrl.match(/\/generated\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\//i);
    return match && match[1] ? match[1] : null;
  } catch (e) {
    return null;
  }
}

/**
 * Check if HD version of a video exists using HEAD request
 */
export async function checkVideoHDExists(videoUrl: string): Promise<boolean> {
  try {
    // Replace standard video URL with HD version
    const hdUrl = videoUrl.replace('generated_video.mp4', 'generated_video_hd.mp4');
    
    const response = await fetch(hdUrl, {
      method: 'HEAD',
      credentials: 'include'
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error checking HD video:', error);
    return false;
  }
}

/**
 * Upscale a video by its video ID
 */
export async function upscaleVideo(videoId: string): Promise<boolean> {
  try {
    const response = await fetch('https://grok.com/rest/media/video/upscale', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*',
      },
      credentials: 'include',
      body: JSON.stringify({ videoId }),
    });

    return response.ok;
  } catch (error) {
    console.error(`Failed to upscale video ${videoId}:`, error);
    return false;
  }
}

/**
 * Upscale multiple videos with progress tracking
 */
export async function upscaleVideos(
  videoUrls: readonly string[],
  onProgress?: (completed: number, total: number) => void
): Promise<{ success: number; failed: number; skipped: number }> {
  let success = 0;
  let failed = 0;
  let skipped = 0;
  const total = videoUrls.length;

  for (let i = 0; i < videoUrls.length; i++) {
    const videoUrl = videoUrls[i];
    
    if (!videoUrl) {
      failed++;
      continue;
    }
    
    // Extract video ID
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      console.warn('Could not extract video ID from:', videoUrl);
      failed++;
      continue;
    }

    // Check if HD already exists
    const hdExists = await checkVideoHDExists(videoUrl);
    if (hdExists) {
      console.log(`HD already exists for video ${videoId}, skipping`);
      skipped++;
      if (onProgress) onProgress(i + 1, total);
      continue;
    }

    // Attempt upscale
    const result = await upscaleVideo(videoId);
    if (result) {
      success++;
    } else {
      failed++;
    }

    // Report progress
    if (onProgress) onProgress(i + 1, total);

    // Small delay between requests (300ms)
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  return { success, failed, skipped };
}

/**
 * Check HD status for a single post's videos (synchronous - just checks hdMediaUrl field)
 */
export function checkPostHDStatus(post: MediaPost): HDStatus {
  console.log(`[HD Check] Checking post ${post.id}, videos:`, post.videos);
  
  // If no videos, return 'none'
  if (!post.videos || post.videos.length === 0) {
    console.log(`[HD Check] Post ${post.id} has no videos`);
    return 'none';
  }

  let hdCount = 0;
  const totalVideos = post.videos.length;

  // Check each video for HD URL
  for (const video of post.videos) {
    if (video.hdMediaUrl) {
      console.log(`[HD Check] Video has HD URL: ${video.hdMediaUrl}`);
      hdCount++;
    } else {
      console.log(`[HD Check] Video missing HD URL: ${video.mediaUrl}`);
    }
  }

  // Determine status
  let status: HDStatus;
  if (hdCount === 0) {
    status = 'none';
  } else if (hdCount === totalVideos) {
    status = 'all';
  } else {
    status = 'partial';
  }
  
  console.log(`[HD Check] Post ${post.id} final status: ${status} (${hdCount}/${totalVideos} HD)`);
  return status;
}

/**
 * Check HD status for multiple posts (synchronous - just checks hdMediaUrl field)
 */
export function checkPostsHDStatus(
  posts: MediaPost[],
  onProgress?: (completed: number, total: number) => void
): Map<string, HDStatus> {
  console.log(`[HD Check Batch] Starting batch check for ${posts.length} posts`);
  const statusMap = new Map<string, HDStatus>();
  const total = posts.length;

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    if (!post) continue;
    
    const status = checkPostHDStatus(post);
    statusMap.set(post.id, status);
    console.log(`[HD Check Batch] Progress: ${i + 1}/${total}`);

    if (onProgress) {
      onProgress(i + 1, total);
    }
  }

  console.log(`[HD Check Batch] Complete! Checked ${statusMap.size} posts`);
  return statusMap;
}
