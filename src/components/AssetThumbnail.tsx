/**
 * Asset Thumbnail Component
 * Displays an uploaded file with selection and preview support
 */

import { createEffect, createMemo, createSignal, onCleanup, Show, type Component } from 'solid-js';
import type { AssetThumbnailProps } from '../types/assets';

function formatMimeLabel(mimeType: string): string {
  if (!mimeType) return 'FILE';

  const [category, subtype] = mimeType.split('/');
  if (!category || !subtype) return mimeType.toUpperCase();

  if (category === 'image') return subtype.toUpperCase();
  if (category === 'video') return 'VIDEO';
  if (category === 'audio') return 'AUDIO';
  if (mimeType === 'application/pdf') return 'PDF';

  return category.toUpperCase();
}

function formatFileSize(sizeBytes: number): string {
  if (sizeBytes >= 1024 * 1024) {
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (sizeBytes >= 1024) {
    return `${Math.round(sizeBytes / 1024)} KB`;
  }

  return `${sizeBytes} B`;
}

const AssetThumbnail: Component<AssetThumbnailProps> = (props) => {
  const [previewFailed, setPreviewFailed] = createSignal(false);
  const [blobPreviewUrl, setBlobPreviewUrl] = createSignal<string>();
  let activeObjectUrl: string | undefined;

  const previewUrl = createMemo(() => {
    if (previewFailed()) return undefined;
    return props.asset.previewUrl || (props.asset.mimeType.startsWith('image/') ? props.asset.downloadUrl : undefined);
  });

  createEffect(() => {
    const sourceUrl = previewUrl();

    if (activeObjectUrl) {
      URL.revokeObjectURL(activeObjectUrl);
      activeObjectUrl = undefined;
      setBlobPreviewUrl(undefined);
    }

    if (!sourceUrl) {
      return;
    }

    const controller = new AbortController();

    void (async () => {
      try {
        const response = await fetch(sourceUrl, {
          credentials: 'include',
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Preview request failed: ${response.status}`);
        }

        const blob = await response.blob();
        activeObjectUrl = URL.createObjectURL(blob);
        setBlobPreviewUrl(activeObjectUrl);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.error('Failed to load asset preview:', error);
        setPreviewFailed(true);
      }
    })();

    onCleanup(() => {
      controller.abort();
      if (activeObjectUrl) {
        URL.revokeObjectURL(activeObjectUrl);
        activeObjectUrl = undefined;
      }
    });
  });

  const details = createMemo(() => {
    if (props.asset.width && props.asset.height) {
      return `${props.asset.width} x ${props.asset.height}`;
    }

    return formatFileSize(props.asset.sizeBytes);
  });

  const handleCheckboxChange = (e: Event) => {
    e.stopPropagation();
    const mouseEvent = e as MouseEvent;

    if (mouseEvent.shiftKey) {
      e.preventDefault();
    }

    props.onToggleSelect(props.asset.id, mouseEvent.shiftKey);
  };

  const handleThumbnailClick = (e: MouseEvent) => {
    if (e.shiftKey) {
      e.preventDefault();
    }

    props.onToggleSelect(props.asset.id, e.shiftKey);
  };

  const handleOpenAsset = (e: Event) => {
    e.stopPropagation();
    window.open(props.asset.downloadUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      class={`media-thumbnail ${props.isSelected ? 'selected' : ''}`}
      onClick={handleThumbnailClick}
    >
      <div class="thumbnail-checkbox">
        <input
          type="checkbox"
          checked={props.isSelected}
          onClick={handleCheckboxChange}
        />
      </div>

      <div class="thumbnail-image-wrapper">
        <Show
          when={blobPreviewUrl()}
          fallback={
            <div class="thumbnail-placeholder">
              <svg width="36" height="36" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M3 1h7l3 3v11H3V1zm7 1.5V5h2.5L10 2.5zM4.5 6.5h7v1h-7v-1zm0 2.5h7v1h-7V9zm0 2.5h5v1h-5v-1z"/>
              </svg>
              <span>{formatMimeLabel(props.asset.mimeType)}</span>
            </div>
          }
        >
          <img
            src={blobPreviewUrl()}
            alt={props.asset.name}
            loading="lazy"
            class="thumbnail-image"
            onError={() => setPreviewFailed(true)}
          />
        </Show>
      </div>

      <div class="thumbnail-file-badge">{formatMimeLabel(props.asset.mimeType)}</div>
      <div class="thumbnail-dimensions-badge">{details()}</div>

      <div class="thumbnail-overlay">
        <button
          class="thumbnail-open-btn"
          onClick={handleOpenAsset}
          title="Open file"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M14 14H2V2h5V0H2C0.9 0 0 0.9 0 2v12c0 1.1 0.9 2 2 2h12c1.1 0 2-0.9 2-2V9h-2v5zM9 0v2h3.6L4.3 10.3l1.4 1.4L14 3.4V7h2V0H9z"/>
          </svg>
        </button>
        <div class="thumbnail-info thumbnail-info-wide">
          <div class="thumbnail-name" title={props.asset.name}>{props.asset.name}</div>
          <div class="thumbnail-id">{props.asset.id.slice(0, 8)}</div>
        </div>
      </div>
    </div>
  );
};

export default AssetThumbnail;
