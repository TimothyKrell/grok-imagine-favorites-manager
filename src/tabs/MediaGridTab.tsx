/**
 * Media Grid Tab - API-based media browser with bulk operations
 */

import { createSignal, onMount, For, Show, type Component } from 'solid-js';
import MediaThumbnail from '../components/MediaThumbnail';
import BulkActions from '../components/BulkActions';
import { fetchMediaPosts, unfavoritePosts } from '../utils/api';
import { getDownloadedMedia, clearAllDownloadTracking } from '../utils/storage';
import type { MediaPost, DownloadType } from '../types/media';

interface MediaGridTabProps {
  readonly fullWidth?: boolean;
}

const MediaGridTab: Component<MediaGridTabProps> = (props) => {
  const [posts, setPosts] = createSignal<MediaPost[]>([]);
  const [selectedPostIds, setSelectedPostIds] = createSignal<Set<string>>(new Set());
  const [downloadedPostIds, setDownloadedPostIds] = createSignal<Set<string>>(new Set());
  const [isLoading, setIsLoading] = createSignal<boolean>(false);
  const [isProcessing, setIsProcessing] = createSignal<boolean>(false);
  const [error, setError] = createSignal<string>('');
  const [nextCursor, setNextCursor] = createSignal<string | undefined>(undefined);
  const [hasMore, setHasMore] = createSignal<boolean>(false);

  /**
   * Load media posts from API
   */
  const loadPosts = async (cursor?: string) => {
    setIsLoading(true);
    setError('');

    try {
      const params = cursor ? { cursor, limit: 50 } : { limit: 50 };
      const response = await fetchMediaPosts(params);
      
      if (cursor) {
        // Append to existing posts (pagination)
        setPosts([...posts(), ...(response.posts as MediaPost[])]);
      } else {
        // Replace posts (initial load)
        setPosts([...(response.posts as MediaPost[])]);
      }

      setNextCursor(response.nextCursor);
      setHasMore(response.hasMore);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load media';
      setError(errorMessage);
      console.error('Error loading posts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load downloaded tracking data
   */
  const loadDownloadedTracking = async () => {
    try {
      const downloaded = await getDownloadedMedia();
      const downloadedIds: string[] = Object.keys(downloaded);
      setDownloadedPostIds(new Set<string>(downloadedIds));
    } catch (err) {
      console.error('Error loading download tracking:', err);
    }
  };

  /**
   * Toggle selection for a post
   */
  const toggleSelection = (postId: string) => {
    console.log('toggleSelection called for:', postId);
    const currentSelection = selectedPostIds();
    console.log('Current selection size:', currentSelection.size);
    
    const newSelection = new Set(currentSelection);
    if (newSelection.has(postId)) {
      console.log('Removing from selection');
      newSelection.delete(postId);
    } else {
      console.log('Adding to selection');
      newSelection.add(postId);
    }
    
    console.log('New selection size:', newSelection.size);
    setSelectedPostIds(newSelection);
  };

  /**
   * Select all posts
   */
  const selectAll = () => {
    const allIds: string[] = posts().map(p => p.id);
    setSelectedPostIds(new Set<string>(allIds));
  };

  /**
   * Deselect all posts
   */
  const deselectAll = () => {
    setSelectedPostIds(new Set<string>());
  };

  /**
   * Get selected posts
   */
  const getSelectedPosts = (): MediaPost[] => {
    const selected = selectedPostIds();
    return posts().filter(post => selected.has(post.id));
  };

  /**
   * Download selected items
   */
  const downloadSelected = async (type: DownloadType) => {
    const selectedPosts = getSelectedPosts();
    console.log('downloadSelected called with type:', type);
    console.log('Selected posts:', selectedPosts);
    
    if (selectedPosts.length === 0) {
      console.warn('No posts selected');
      return;
    }

    setIsProcessing(true);

    try {
      console.log('Sending bulkDownload message to background script...');
      
      // Send download message to background script
      const response = await chrome.runtime.sendMessage({
        action: 'bulkDownload',
        posts: selectedPosts,
        downloadType: type,
      });

      console.log('Background script response:', response);

      // Refresh download tracking
      await loadDownloadedTracking();

      // Deselect all after download
      deselectAll();
    } catch (err) {
      console.error('Error downloading:', err);
      alert('Failed to start downloads. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Unfavorite selected items
   */
  const unfavoriteSelected = async () => {
    const selected = Array.from(selectedPostIds());
    if (selected.length === 0) return;

    const confirmed = confirm(
      `Are you sure you want to unfavorite ${selected.length} item${selected.length === 1 ? '' : 's'}?`
    );
    if (!confirmed) return;

    setIsProcessing(true);

    try {
      const result = await unfavoritePosts(selected);
      
      if (result.success > 0) {
        // Remove unfavorited posts from the list
        setPosts(posts().filter(post => !selected.includes(post.id)));
        deselectAll();
      }
    } catch (err) {
      console.error('Error unfavoriting:', err);
      alert('Failed to unfavorite items. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Clear download tracking
   */
  const handleClearTracking = async () => {
    const confirmed = confirm('Are you sure you want to clear all download tracking data?');
    if (!confirmed) return;

    try {
      await clearAllDownloadTracking();
      setDownloadedPostIds(new Set<string>());
    } catch (err) {
      console.error('Error clearing tracking:', err);
      alert('Failed to clear tracking data.');
    }
  };

  /**
   * Load more posts (pagination)
   */
  const loadMore = () => {
    if (nextCursor()) {
      loadPosts(nextCursor());
    }
  };

  // Initialize on mount
  onMount(() => {
    loadPosts();
    loadDownloadedTracking();
  });

  return (
    <div class="media-grid-tab">
      {/* Header */}
      <div class="media-grid-header">
        <div class="media-grid-title">
          <h3>Media Browser</h3>
          <p class="media-grid-subtitle">
            {posts().length} item{posts().length === 1 ? '' : 's'} loaded
          </p>
        </div>
        
        <div class="media-grid-actions">
          <button class="btn-secondary" onClick={selectAll} disabled={posts().length === 0}>
            Select All
          </button>
          <button class="btn-secondary" onClick={() => loadPosts()} disabled={isLoading()}>
            {isLoading() ? 'Loading...' : 'Refresh'}
          </button>
          <button class="btn-danger-outline" onClick={handleClearTracking}>
            Clear Tracking
          </button>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      <BulkActions
        selectedCount={selectedPostIds().size}
        onDownloadImages={() => downloadSelected('images')}
        onDownloadVideos={() => downloadSelected('videos')}
        onDownloadBoth={() => downloadSelected('both')}
        onUnfavorite={unfavoriteSelected}
        onDeselectAll={deselectAll}
        isProcessing={isProcessing()}
      />

      {/* Error Message */}
      <Show when={error()}>
        <div class="error-message">
          <div>
            <strong>Error:</strong> {error()}
            {error().includes('authenticated') && (
              <div style="margin-top: 8px; font-size: 11px;">
                Please make sure you're logged into{' '}
                <a 
                  href="https://grok.com/imagine/favorites" 
                  target="_blank"
                  style="color: inherit; text-decoration: underline;"
                >
                  grok.com
                </a>
                {' '}in another tab, then click Retry.
              </div>
            )}
          </div>
          <button onClick={() => loadPosts()}>Retry</button>
        </div>
      </Show>

      {/* Loading Indicator */}
      <Show when={isLoading() && posts().length === 0}>
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p>Loading your media...</p>
        </div>
      </Show>

      {/* Media Grid */}
      <Show when={posts().length > 0}>
        <div class={props.fullWidth ? "media-grid media-grid-fullwidth" : "media-grid"}>
          <For each={posts()}>
            {(post) => (
              <MediaThumbnail
                post={post}
                isSelected={selectedPostIds().has(post.id)}
                isDownloaded={downloadedPostIds().has(post.id)}
                onToggleSelect={toggleSelection}
              />
            )}
          </For>
        </div>
      </Show>

      {/* Load More Button */}
      <Show when={hasMore() && !isLoading()}>
        <div class="load-more-container">
          <button class="btn-primary" onClick={loadMore}>
            Load More
          </button>
        </div>
      </Show>

      {/* Loading More Indicator */}
      <Show when={isLoading() && posts().length > 0}>
        <div class="loading-more">
          <div class="loading-spinner-small"></div>
          Loading more...
        </div>
      </Show>

      {/* Empty State */}
      <Show when={!isLoading() && posts().length === 0 && !error()}>
        <div class="empty-state">
          <p>No media found.</p>
          <p class="empty-state-hint">Make sure you have favorited items on Grok Imagine.</p>
        </div>
      </Show>
    </div>
  );
};

export default MediaGridTab;
