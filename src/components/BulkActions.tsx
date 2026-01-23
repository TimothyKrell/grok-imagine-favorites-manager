/**
 * Bulk Actions Toolbar Component
 * Displays action buttons when items are selected
 */

import { Show, type Component } from 'solid-js';
import type { BulkActionsProps } from '../types/media';

const BulkActions: Component<BulkActionsProps> = (props) => {
  return (
    <Show when={props.selectedCount > 0}>
      <div class="bulk-actions-toolbar">
        <div class="bulk-actions-content">
          <div class="bulk-actions-info">
            <span class="selected-count">{props.selectedCount}</span>
            <span class="selected-label">
              {props.selectedCount === 1 ? 'item' : 'items'} selected
            </span>
          </div>

          <div class="bulk-actions-buttons">
            <button
              class="bulk-action-btn"
              onClick={props.onDownloadImages}
              disabled={props.isProcessing}
              title="Download images only"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 12L3 7h3V2h4v5h3l-5 5z"/>
                <path d="M2 14h12v2H2z"/>
              </svg>
              Images
            </button>

            <button
              class="bulk-action-btn"
              onClick={props.onDownloadVideos}
              disabled={props.isProcessing}
              title="Download videos only"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 12L3 7h3V2h4v5h3l-5 5z"/>
                <path d="M2 14h12v2H2z"/>
              </svg>
              Videos
            </button>

            <button
              class="bulk-action-btn primary"
              onClick={props.onDownloadBoth}
              disabled={props.isProcessing}
              title="Download both images and videos"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 12L3 7h3V2h4v5h3l-5 5z"/>
                <path d="M2 14h12v2H2z"/>
              </svg>
              Both
            </button>

            <button
              class="bulk-action-btn"
              onClick={props.onUpscaleVideos}
              disabled={props.isProcessing || props.isUpscaling}
              title="Upscale videos to HD"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z"/>
                <path d="M12 12v2h2v-2h-2zM10 10v2h2v-2h-2z"/>
              </svg>
              Upscale
            </button>

            <div class="bulk-actions-divider"></div>

            <button
              class="bulk-action-btn danger"
              onClick={props.onUnfavorite}
              disabled={props.isProcessing}
              title="Unfavorite selected items"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z"/>
              </svg>
              Unfavorite
            </button>

            <button
              class="bulk-action-btn secondary"
              onClick={props.onDeselectAll}
              disabled={props.isProcessing}
              title="Deselect all items"
            >
              ✕ Clear
            </button>
          </div>
        </div>

        <Show when={props.isProcessing && !props.isUpscaling && !props.isUnfavoriting}>
          <div class="bulk-actions-progress">
            Processing...
          </div>
        </Show>

        <Show when={props.isUpscaling}>
          <div class="bulk-actions-progress">
            {props.upscaleProgress || 'Upscaling videos...'}
          </div>
        </Show>

        <Show when={props.isUnfavoriting}>
          <div class="bulk-actions-progress">
            {props.unfavoriteProgress || 'Unfavoriting items...'}
          </div>
        </Show>
      </div>
    </Show>
  );
};

export default BulkActions;
