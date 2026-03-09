/**
 * Files Grid Tab - API-based uploaded files browser with bulk delete
 */

import { createMemo, createSignal, For, onMount, Show, type Component } from 'solid-js';
import AssetBulkActions from '../components/AssetBulkActions';
import AssetThumbnail from '../components/AssetThumbnail';
import type { AssetFile } from '../types/assets';
import { deleteAssets, fetchAssets } from '../utils/api';

interface FilesGridTabProps {
  readonly fullWidth?: boolean;
}

const FilesGridTab: Component<FilesGridTabProps> = (props) => {
  const [assets, setAssets] = createSignal<AssetFile[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = createSignal<Set<string>>(new Set<string>());
  const [isLoading, setIsLoading] = createSignal(false);
  const [isProcessing, setIsProcessing] = createSignal(false);
  const [deleteProgress, setDeleteProgress] = createSignal('');
  const [error, setError] = createSignal('');
  const [nextPageToken, setNextPageToken] = createSignal<string | undefined>(undefined);
  const [hasMore, setHasMore] = createSignal(false);
  const [sortOrder, setSortOrder] = createSignal<'recent' | 'oldest'>('recent');
  const [isLoadingAll, setIsLoadingAll] = createSignal(false);
  const [loadAllProgress, setLoadAllProgress] = createSignal('');
  const [thumbnailSize, setThumbnailSize] = createSignal<'small' | 'medium' | 'large'>('medium');
  const [lastSelectedIndex, setLastSelectedIndex] = createSignal(-1);

  const sortedAssets = createMemo(() => {
    const order = sortOrder();

    return [...assets()].sort((a, b) => {
      if (order === 'recent') {
        return b.lastUsedAt - a.lastUsedAt;
      }

      return a.lastUsedAt - b.lastUsedAt;
    });
  });

  const loadAssetPage = async (pageToken?: string) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetchAssets(pageToken ? { pageToken, pageSize: 50 } : { pageSize: 50 });
      const newAssets = response.assets as AssetFile[];

      if (pageToken) {
        setAssets([...assets(), ...newAssets]);
      } else {
        setAssets([...newAssets]);
      }

      setNextPageToken(response.nextPageToken);
      setHasMore(response.hasMore);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load files';
      setError(errorMessage);
      console.error('Error loading assets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllAssets = async () => {
    if (isLoadingAll()) return;

    setIsLoadingAll(true);
    setLoadAllProgress('Starting...');
    setError('');

    try {
      const allAssets: AssetFile[] = [];
      let pageToken: string | undefined = undefined;
      let pageCount = 0;
      let hasMorePages = true;

      while (hasMorePages) {
        pageCount++;
        setLoadAllProgress(`Loading page ${pageCount}...`);

        const response = await fetchAssets(pageToken ? { pageToken, pageSize: 50 } : { pageSize: 50 });
        allAssets.push(...(response.assets as AssetFile[]));

        pageToken = response.nextPageToken;
        hasMorePages = response.hasMore && !!pageToken;
        setLoadAllProgress(`Loaded ${allAssets.length} files (page ${pageCount})...`);
      }

      setAssets(allAssets);
      setNextPageToken(undefined);
      setHasMore(false);
      setLoadAllProgress(`Complete! Loaded ${allAssets.length} files from ${pageCount} pages.`);

      setTimeout(() => {
        setLoadAllProgress('');
      }, 2000);
    } catch (err) {
      console.error('Error loading all assets:', err);
      alert('Failed to load all files. Please try again.');
      setLoadAllProgress('');
    } finally {
      setIsLoadingAll(false);
    }
  };

  const toggleSelection = (assetId: string, shiftKey: boolean = false) => {
    const currentSelection = selectedAssetIds();
    const sortedAssetsArray = sortedAssets();
    const currentIndex = sortedAssetsArray.findIndex(asset => asset.id === assetId);

    if (shiftKey && lastSelectedIndex() >= 0 && currentIndex >= 0) {
      const newSelection = new Set(currentSelection);
      const startIndex = Math.min(lastSelectedIndex(), currentIndex);
      const endIndex = Math.max(lastSelectedIndex(), currentIndex);

      for (let i = startIndex; i <= endIndex; i++) {
        const asset = sortedAssetsArray[i];
        if (asset) {
          newSelection.add(asset.id);
        }
      }

      setSelectedAssetIds(newSelection);
      return;
    }

    const newSelection = new Set(currentSelection);
    if (newSelection.has(assetId)) {
      newSelection.delete(assetId);
    } else {
      newSelection.add(assetId);
    }

    setSelectedAssetIds(newSelection);

    if (currentIndex >= 0) {
      setLastSelectedIndex(currentIndex);
    }
  };

  const selectAll = () => {
    setSelectedAssetIds(new Set(assets().map(asset => asset.id)));
  };

  const deselectAll = () => {
    setSelectedAssetIds(new Set<string>());
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder() === 'recent' ? 'oldest' : 'recent');
  };

  const deleteSelected = async () => {
    const selected = Array.from(selectedAssetIds());
    if (selected.length === 0) return;

    const confirmed = confirm(
      `Are you sure you want to delete ${selected.length} file${selected.length === 1 ? '' : 's'}?\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    setIsProcessing(true);
    setDeleteProgress('Starting...');

    try {
      const result = await deleteAssets(selected, (completed: number, total: number) => {
        setDeleteProgress(`Deleting ${completed}/${total} files...`);
      });

      if (result.success > 0) {
        setAssets(assets().filter(asset => !selected.includes(asset.id)));
        deselectAll();
      }

      if (result.failed > 0) {
        alert(`Delete complete with partial failures.\n\nSucceeded: ${result.success}\nFailed: ${result.failed}`);
      }
    } catch (err) {
      console.error('Error deleting assets:', err);
      alert('Failed to delete files. Please try again.');
    } finally {
      setIsProcessing(false);
      setDeleteProgress('');
    }
  };

  const loadMore = () => {
    if (nextPageToken()) {
      loadAssetPage(nextPageToken());
    }
  };

  onMount(() => {
    loadAssetPage();
  });

  return (
    <div class="media-grid-tab">
      <div class="media-grid-header">
        <div class="media-grid-title">
          <h3>Files Browser</h3>
          <p class="media-grid-subtitle">
            {assets().length} file{assets().length === 1 ? '' : 's'} loaded • Sorted by {sortOrder() === 'recent' ? 'Recent Use' : 'Oldest Use'}
          </p>
        </div>

        <div class="media-grid-actions">
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

          <button class="btn-secondary" onClick={toggleSortOrder} disabled={assets().length === 0}>
            {sortOrder() === 'recent' ? 'Recent Use' : 'Oldest Use'}
          </button>
          <button class="btn-secondary" onClick={selectAll} disabled={assets().length === 0}>
            Select All
          </button>
          <button class="btn-primary" onClick={loadAllAssets} disabled={isLoading() || isLoadingAll()}>
            {isLoadingAll() ? 'Loading All...' : 'Load All'}
          </button>
          <button class="btn-secondary" onClick={() => loadAssetPage()} disabled={isLoading()}>
            {isLoading() ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      <Show when={loadAllProgress()}>
        <div class="load-all-progress">
          {loadAllProgress()}
        </div>
      </Show>

      <AssetBulkActions
        selectedCount={selectedAssetIds().size}
        onDelete={deleteSelected}
        onDeselectAll={deselectAll}
        isProcessing={isProcessing()}
        deleteProgress={deleteProgress()}
      />

      <Show when={error()}>
        <div class="error-message">
          <div>
            <strong>Error:</strong> {error()}
            {error().includes('authenticated') && (
              <div style="margin-top: 8px; font-size: 11px;">
                Please make sure you're logged into{' '}
                <a
                  href="https://grok.com/"
                  target="_blank"
                  style="color: inherit; text-decoration: underline;"
                >
                  grok.com
                </a>
                {' '}in another tab, then click Retry.
              </div>
            )}
          </div>
          <button onClick={() => loadAssetPage()}>Retry</button>
        </div>
      </Show>

      <Show when={isLoading() && assets().length === 0}>
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p>Loading your files...</p>
        </div>
      </Show>

      <Show when={assets().length > 0}>
        <div class={`media-grid ${props.fullWidth ? 'media-grid-fullwidth' : ''} media-grid-${thumbnailSize()}`}>
          <For each={sortedAssets()}>
            {(asset) => (
              <AssetThumbnail
                asset={asset}
                isSelected={selectedAssetIds().has(asset.id)}
                onToggleSelect={toggleSelection}
              />
            )}
          </For>
        </div>
      </Show>

      <Show when={hasMore() && !isLoading()}>
        <div class="load-more-container">
          <button class="btn-primary" onClick={loadMore}>
            Load More
          </button>
        </div>
      </Show>

      <Show when={isLoading() && assets().length > 0}>
        <div class="loading-more">
          <div class="loading-spinner-small"></div>
          Loading more...
        </div>
      </Show>

      <Show when={!isLoading() && assets().length === 0 && !error()}>
        <div class="empty-state">
          <p>No files found.</p>
          <p class="empty-state-hint">Uploaded files from Grok will appear here.</p>
        </div>
      </Show>
    </div>
  );
};

export default FilesGridTab;
