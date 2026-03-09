/**
 * Media Grid Tab - API-based media browser with bulk operations
 */

import { createSignal, createMemo, onMount, For, Show, type Component } from 'solid-js';
import MediaThumbnail from '../components/MediaThumbnail';
import BulkActions from '../components/BulkActions';
import { fetchMediaPosts, hydratePostsWithFolders, unfavoritePosts, deletePosts, upscaleVideos, checkPostsHDStatus } from '../utils/api';
import { getDownloadedMedia, clearAllDownloadTracking, getSkipTaggedDeletePreference, setSkipTaggedDeletePreference } from '../utils/storage';
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
  const [isUpscaling, setIsUpscaling] = createSignal<boolean>(false);
  const [upscaleProgress, setUpscaleProgress] = createSignal<string>('');
  const [isUnfavoriting, setIsUnfavoriting] = createSignal<boolean>(false);
  const [unfavoriteProgress, setUnfavoriteProgress] = createSignal<string>('');
  const [isDeleting, setIsDeleting] = createSignal<boolean>(false);
  const [deleteProgress, setDeleteProgress] = createSignal<string>('');
  const [error, setError] = createSignal<string>('');
  const [nextCursor, setNextCursor] = createSignal<string | undefined>(undefined);
  const [hasMore, setHasMore] = createSignal<boolean>(false);
  const [sortOrder, setSortOrder] = createSignal<'newest' | 'oldest'>('newest');
  const [isLoadingAll, setIsLoadingAll] = createSignal<boolean>(false);
  const [loadAllProgress, setLoadAllProgress] = createSignal<string>('');
  const [thumbnailSize, setThumbnailSize] = createSignal<'small' | 'medium' | 'large'>('medium');
  const [lastSelectedIndex, setLastSelectedIndex] = createSignal<number>(-1);
  const [skipTaggedDeletes, setSkipTaggedDeletes] = createSignal<boolean>(true);

  /**
   * Sorted posts based on current sort order (client-side)
   */
  const sortedPosts = createMemo(() => {
    const allPosts = posts();
    const order = sortOrder();
    
    // Create a copy and sort by createdAt timestamp
    return [...allPosts].sort((a, b) => {
      if (order === 'newest') {
        return b.createdAt - a.createdAt; // Newest first (descending)
      } else {
        return a.createdAt - b.createdAt; // Oldest first (ascending)
      }
    });
  });

  const taggedPostCount = createMemo(() => posts().filter((post) => (post.tags?.length || 0) > 0).length);

  const mergeHydratedPosts = (hydratedPosts: MediaPost[]) => {
    const hydratedById = new Map(hydratedPosts.map((post) => [post.id, post]));
    setPosts((currentPosts) => currentPosts.map((post) => hydratedById.get(post.id) || post));
  };

  const hydrateVisiblePosts = async (postsToHydrate: MediaPost[]) => {
    if (postsToHydrate.length === 0) return;

    try {
      const hydratedPosts = await hydratePostsWithFolders(postsToHydrate);
      mergeHydratedPosts(hydratedPosts);
    } catch (err) {
      console.error('Error hydrating post folders:', err);
    }
  };

  /**
   * Check HD status for posts with videos
   */
  const checkHDStatus = (postsToCheck: MediaPost[]) => {
    console.log(`[MediaGridTab] checkHDStatus called with ${postsToCheck.length} posts`);
    const postsWithVideos = postsToCheck.filter(p => p.videoCount > 0);
    console.log(`[MediaGridTab] Filtered to ${postsWithVideos.length} posts with videos`);
    
    if (postsWithVideos.length === 0) {
      console.log(`[MediaGridTab] No posts with videos, skipping HD check`);
      return;
    }

    try {
      console.log(`[MediaGridTab] Calling checkPostsHDStatus...`);
      const statusMap = checkPostsHDStatus(postsWithVideos);
      console.log(`[MediaGridTab] Got status map with ${statusMap.size} entries`);
      
      // Update posts with HD status
      setPosts(currentPosts => {
        console.log(`[MediaGridTab] Updating posts with HD status...`);
        return currentPosts.map(post => {
          const hdStatus = statusMap.get(post.id);
          if (hdStatus) {
            console.log(`[MediaGridTab] Setting ${post.id} HD status to ${hdStatus}`);
            return { ...post, hdStatus };
          }
          return post;
        });
      });
      console.log(`[MediaGridTab] Posts updated with HD status`);
    } catch (err) {
      console.error('[MediaGridTab] Error checking HD status:', err);
    }
  };

  /**
   * Load media posts from API
   */
  const loadPosts = async (cursor?: string) => {
    setIsLoading(true);
    setError('');

    try {
      const params = cursor ? { cursor, limit: 50 } : { limit: 50 };
      const response = await fetchMediaPosts(params);
      
      const newPosts = response.posts as MediaPost[];
      
      if (cursor) {
        // Append to existing posts (pagination)
        setPosts([...posts(), ...newPosts]);
      } else {
        // Replace posts (initial load)
        setPosts([...newPosts]);
      }

      setNextCursor(response.nextCursor);
      setHasMore(response.hasMore);

      // Check HD status in background (non-blocking)
      checkHDStatus(newPosts);
      void hydrateVisiblePosts(newPosts);
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
   * Toggle selection for a post (supports shift-click for range selection)
   */
  const toggleSelection = (postId: string, shiftKey: boolean = false) => {
    console.log('toggleSelection called for:', postId, 'shiftKey:', shiftKey);
    const currentSelection = selectedPostIds();
    console.log('Current selection size:', currentSelection.size);
    
    // Get the index of the clicked post in the sorted array
    const sortedPostsArray = sortedPosts();
    const currentIndex = sortedPostsArray.findIndex(p => p.id === postId);
    
    if (shiftKey && lastSelectedIndex() >= 0 && currentIndex >= 0) {
      // Shift-click: select range
      console.log('Shift-click range selection from', lastSelectedIndex(), 'to', currentIndex);
      const newSelection = new Set(currentSelection);
      
      const startIndex = Math.min(lastSelectedIndex(), currentIndex);
      const endIndex = Math.max(lastSelectedIndex(), currentIndex);
      
      // Select all items in the range
      for (let i = startIndex; i <= endIndex; i++) {
        const post = sortedPostsArray[i];
        if (post) {
          newSelection.add(post.id);
        }
      }
      
      console.log('Range selected, new selection size:', newSelection.size);
      setSelectedPostIds(newSelection);
    } else {
      // Normal click: toggle single item
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
      
      // Update last selected index for future shift-clicks
      if (currentIndex >= 0) {
        setLastSelectedIndex(currentIndex);
      }
    }
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
   * Toggle sort order between newest and oldest (client-side)
   */
  const toggleSortOrder = () => {
    setSortOrder(sortOrder() === 'newest' ? 'oldest' : 'newest');
  };

  /**
   * Load all pages of media posts
   */
  const loadAllPosts = async () => {
    if (isLoadingAll()) return;

    setIsLoadingAll(true);
    setLoadAllProgress('Starting...');
    
    try {
      // Start fresh
      const allPosts: MediaPost[] = [];
      let cursor: string | undefined = undefined;
      let pageCount = 0;
      let hasMorePages = true;

      while (hasMorePages) {
        pageCount++;
        setLoadAllProgress(`Loading page ${pageCount}...`);

        const params = cursor ? { cursor, limit: 50 } : { limit: 50 };
        const response = await fetchMediaPosts(params);

        allPosts.push(...(response.posts as MediaPost[]));
        
        cursor = response.nextCursor;
        hasMorePages = response.hasMore && !!cursor;

        // Update UI with progress
        setLoadAllProgress(`Loaded ${allPosts.length} items (page ${pageCount})...`);
      }

      // Update state with all posts
      setPosts(allPosts);
      setNextCursor(undefined);
      setHasMore(false);
      
      setLoadAllProgress(`Complete! Loaded ${allPosts.length} items from ${pageCount} pages. Checking HD status...`);
      
      // Check HD status in background
      checkHDStatus(allPosts);
      setLoadAllProgress(`Complete! Loaded ${allPosts.length} items from ${pageCount} pages. Checking folders...`);
      void hydratePostsWithFolders(allPosts)
        .then((hydratedPosts) => {
          mergeHydratedPosts(hydratedPosts);
          setLoadAllProgress(`Complete! Loaded ${allPosts.length} items from ${pageCount} pages.`);
          setTimeout(() => {
            setLoadAllProgress('');
          }, 2000);
        })
        .catch((error) => {
          console.error('Error hydrating all post folders:', error);
          setLoadAllProgress(`Complete! Loaded ${allPosts.length} items from ${pageCount} pages.`);
          setTimeout(() => {
            setLoadAllProgress('');
          }, 2000);
        });

    } catch (err) {
      console.error('Error loading all posts:', err);
      alert('Failed to load all posts. Please try again.');
      setLoadAllProgress('');
    } finally {
      setIsLoadingAll(false);
    }
  };

  /**
   * Get selected posts
   */
  const getSelectedPosts = (): MediaPost[] => {
    const selected = selectedPostIds();
    return posts().filter(post => selected.has(post.id));
  };

  const taggedSelectedCount = createMemo(() => getSelectedPosts().filter((post) => (post.tags?.length || 0) > 0).length);

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
    setIsUnfavoriting(true);
    setUnfavoriteProgress('Starting...');

    try {
      const result = await unfavoritePosts(selected, (completed, total) => {
        setUnfavoriteProgress(`Unfavoriting ${completed}/${total} items...`);
      });
      
      if (result.success > 0) {
        // Remove unfavorited posts from the list
        setPosts(posts().filter(post => !selected.includes(post.id)));
        deselectAll();
      }
      
      setUnfavoriteProgress('');
    } catch (err) {
      console.error('Error unfavoriting:', err);
      alert('Failed to unfavorite items. Please try again.');
    } finally {
      setIsProcessing(false);
      setIsUnfavoriting(false);
      setUnfavoriteProgress('');
    }
  };

  /**
   * Delete and unlike selected items
   */
  const deleteSelected = async () => {
    const selectedPosts = getSelectedPosts();
    if (selectedPosts.length === 0) return;

    const taggedCount = selectedPosts.filter((post) => (post.tags?.length || 0) > 0).length;
    const protectTagged = skipTaggedDeletes();
    const taggedDeleteMessage = protectTagged
      ? taggedCount > 0
        ? `${taggedCount} tagged item${taggedCount === 1 ? '' : 's'} will be skipped.`
        : 'Tagged items will be skipped.'
      : taggedCount > 0
        ? `${taggedCount} tagged item${taggedCount === 1 ? '' : 's'} will also be deleted.`
        : '';

    const confirmed = confirm(
      `Are you sure you want to delete and unlike ${selectedPosts.length} item${selectedPosts.length === 1 ? '' : 's'}?${taggedDeleteMessage ? `\n\n${taggedDeleteMessage}` : ''}\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    setIsProcessing(true);
    setIsDeleting(true);
    setDeleteProgress(protectTagged ? 'Checking folders...' : 'Starting...');

    try {
      const result = await deletePosts(selectedPosts, protectTagged, (completed, total) => {
        setDeleteProgress(`Deleting ${completed}/${total} ${protectTagged ? 'untagged ' : ''}items...`);
      });

      if (result.deletedIds.length > 0) {
        setPosts(posts().filter(post => !result.deletedIds.includes(post.id)));
      }

      if (result.skipped > 0 || result.failed > 0) {
        alert(`Delete complete.\n\nDeleted: ${result.success}\nSkipped (tagged): ${result.skipped}\nFailed: ${result.failed}`);
      }

      setSelectedPostIds(new Set<string>([...result.skippedTaggedIds, ...result.failedIds]));

      setDeleteProgress('');
    } catch (err) {
      console.error('Error deleting:', err);
      alert('Failed to delete items. Please try again.');
    } finally {
      setIsProcessing(false);
      setIsDeleting(false);
      setDeleteProgress('');
    }
  };

  /**
   * Upscale selected videos
   */
  const upscaleSelected = async () => {
    const selectedPosts = getSelectedPosts();
    if (selectedPosts.length === 0) return;

    // Collect all video URLs from selected posts
    const videoUrls: string[] = [];
    for (const post of selectedPosts) {
      if (post.videoUrls) {
        videoUrls.push(...post.videoUrls);
      }
    }

    if (videoUrls.length === 0) {
      alert('No videos found in selected items');
      return;
    }

    const confirmed = confirm(
      `Found ${videoUrls.length} video${videoUrls.length === 1 ? '' : 's'} in ${selectedPosts.length} selected item${selectedPosts.length === 1 ? '' : 's'}.\n\nUpscale all videos to HD?`
    );
    if (!confirmed) return;

    setIsUpscaling(true);
    setUpscaleProgress('Checking videos...');

    try {
      const result = await upscaleVideos(videoUrls, (completed, total) => {
        setUpscaleProgress(`Processing ${completed}/${total} videos...`);
      });

      setUpscaleProgress('Refreshing HD status...');
      
      // Refresh HD status for selected posts (synchronous)
      checkHDStatus(selectedPosts);
      
      setUpscaleProgress('');
      deselectAll();

      // Show summary
      const message = `Upscaling complete!\n\nSucceeded: ${result.success}\nSkipped (already HD): ${result.skipped}\nFailed: ${result.failed}`;
      alert(message);
      console.log('Upscale result:', result);
    } catch (err) {
      console.error('Error upscaling:', err);
      alert('Failed to upscale videos. Please try again.');
    } finally {
      setIsUpscaling(false);
      setUpscaleProgress('');
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

  const toggleSkipTaggedDeletes = async () => {
    const nextValue = !skipTaggedDeletes();
    setSkipTaggedDeletes(nextValue);

    try {
      await setSkipTaggedDeletePreference(nextValue);
    } catch (err) {
      console.error('Error saving tagged delete preference:', err);
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
    void getSkipTaggedDeletePreference().then(setSkipTaggedDeletes).catch((err) => {
      console.error('Error loading tagged delete preference:', err);
    });
  });

  return (
    <div class="media-grid-tab">
      {/* Header */}
      <div class="media-grid-header">
        <div class="media-grid-title">
          <h3>Media Browser</h3>
          <p class="media-grid-subtitle">
            {posts().length} item{posts().length === 1 ? '' : 's'} loaded • {taggedPostCount()} tagged • Sorted by {sortOrder() === 'newest' ? 'Newest' : 'Oldest'}
          </p>
        </div>
        
        <div class="media-grid-actions">
          {/* Thumbnail Size Selector (only in fullscreen) */}
          <Show when={props.fullWidth}>
            <div class="size-selector">
              <label class="size-selector-label">Size:</label>
              <div class="size-selector-buttons">
                <button 
                  class={`size-btn ${thumbnailSize() === 'small' ? 'active' : ''}`}
                  onClick={() => setThumbnailSize('small')}
                  title="Small thumbnails"
                >
                  S
                </button>
                <button 
                  class={`size-btn ${thumbnailSize() === 'medium' ? 'active' : ''}`}
                  onClick={() => setThumbnailSize('medium')}
                  title="Medium thumbnails"
                >
                  M
                </button>
                <button 
                  class={`size-btn ${thumbnailSize() === 'large' ? 'active' : ''}`}
                  onClick={() => setThumbnailSize('large')}
                  title="Large thumbnails"
                >
                  L
                </button>
              </div>
            </div>
          </Show>

          <button class="btn-secondary" onClick={toggleSortOrder} disabled={posts().length === 0} title={`Sort by ${sortOrder() === 'newest' ? 'oldest' : 'newest'} first`}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 4px;">
              <Show when={sortOrder() === 'newest'}>
                <path d="M8 3L4 7h3v6h2V7h3L8 3z"/>
              </Show>
              <Show when={sortOrder() === 'oldest'}>
                <path d="M8 13l4-4H9V3H7v6H4l4 4z"/>
              </Show>
            </svg>
            {sortOrder() === 'newest' ? 'Newest' : 'Oldest'}
          </button>
          <button class="btn-secondary" onClick={selectAll} disabled={posts().length === 0}>
            Select All
          </button>
          <button
            class={`btn-secondary btn-toggle ${skipTaggedDeletes() ? 'active' : ''}`}
            onClick={toggleSkipTaggedDeletes}
            title="Toggle delete protection for tagged favorites"
          >
            {skipTaggedDeletes() ? 'Protect Tagged: On' : 'Protect Tagged: Off'}
          </button>
          <button class="btn-primary" onClick={loadAllPosts} disabled={isLoading() || isLoadingAll()}>
            {isLoadingAll() ? 'Loading All...' : 'Load All'}
          </button>
          <button class="btn-secondary" onClick={() => loadPosts()} disabled={isLoading()}>
            {isLoading() ? 'Loading...' : 'Refresh'}
          </button>
          <button class="btn-danger-outline" onClick={handleClearTracking}>
            Clear Tracking
          </button>
        </div>
      </div>

      {/* Load All Progress */}
      <Show when={loadAllProgress()}>
        <div class="load-all-progress">
          {loadAllProgress()}
        </div>
      </Show>

      {/* Bulk Actions Toolbar */}
      <BulkActions
        selectedCount={selectedPostIds().size}
        onDownloadImages={() => downloadSelected('images')}
        onDownloadVideos={() => downloadSelected('videos')}
        onDownloadBoth={() => downloadSelected('both')}
        onUpscaleVideos={upscaleSelected}
        onUnfavorite={unfavoriteSelected}
        onDeletePosts={deleteSelected}
        onDeselectAll={deselectAll}
        isProcessing={isProcessing()}
        isUpscaling={isUpscaling()}
        upscaleProgress={upscaleProgress()}
        isUnfavoriting={isUnfavoriting()}
        unfavoriteProgress={unfavoriteProgress()}
        isDeleting={isDeleting()}
        deleteProgress={deleteProgress()}
      />

      <Show when={selectedPostIds().size > 0 && taggedSelectedCount() > 0}>
        <div class="tagged-selection-note">
          {taggedSelectedCount()} selected item{taggedSelectedCount() === 1 ? '' : 's'} tagged {skipTaggedDeletes() ? 'and protected from delete' : 'and will be deleted'}.
        </div>
      </Show>

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
        <div class={`media-grid ${props.fullWidth ? 'media-grid-fullwidth' : ''} media-grid-${thumbnailSize()}`}>
          <For each={sortedPosts()}>
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
