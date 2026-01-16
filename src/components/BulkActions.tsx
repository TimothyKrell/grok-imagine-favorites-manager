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

        <Show when={props.isProcessing}>
          <div class="bulk-actions-progress">
            Processing...
          </div>
        </Show>
      </div>
    </Show>
  );
};

export default BulkActions;
