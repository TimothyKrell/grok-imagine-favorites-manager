/**
 * API client for Grok media endpoints
 */

import type { MediaPost, MediaListResponse, MediaListParams } from '../types/media';

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
    // Extract video URLs from the videos array
    const videoUrls: string[] = [];
    if (Array.isArray(item.videos)) {
      for (const video of item.videos) {
        if (video.mediaUrl) {
          videoUrls.push(video.mediaUrl);
        }
      }
    }

    const post: MediaPost = {
      id: item.id,
      imageUrl: item.mediaUrl || item.images?.[0]?.mediaUrl || '',
      thumbnailUrl: item.thumbnailImageUrl,
      videoUrls,
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
 * Unfavorite multiple posts
 */
export async function unfavoritePosts(postIds: readonly string[]): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  // Process with small delays to avoid rate limiting
  for (const postId of postIds) {
    const result = await unfavoritePost(postId);
    if (result) {
      success++;
    } else {
      failed++;
    }
    
    // Small delay between requests (150ms)
    await new Promise(resolve => setTimeout(resolve, 150));
  }

  return { success, failed };
}
