/**
 * Asset bulk actions toolbar
 */

import { Show, type Component } from 'solid-js';
import type { AssetBulkActionsProps } from '../types/assets';

const AssetBulkActions: Component<AssetBulkActionsProps> = (props) => {
  return (
    <Show when={props.selectedCount > 0}>
      <div class="bulk-actions-toolbar">
        <div class="bulk-actions-content">
          <div class="bulk-actions-info">
            <span class="selected-count">{props.selectedCount}</span>
            <span class="selected-label">
              {props.selectedCount === 1 ? 'file' : 'files'} selected
            </span>
          </div>

          <div class="bulk-actions-buttons">
            <button
              class="bulk-action-btn danger"
              onClick={props.onDelete}
              disabled={props.isProcessing}
              title="Delete selected files"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M5 2h6l1 1h3v2H1V3h3l1-1zm-2 4h10l-1 8H4L3 6z"/>
              </svg>
              Delete
            </button>

            <button
              class="bulk-action-btn secondary"
              onClick={props.onDeselectAll}
              disabled={props.isProcessing}
              title="Deselect all files"
            >
              X Clear
            </button>
          </div>
        </div>

        <Show when={props.isProcessing}>
          <div class="bulk-actions-progress">
            {props.deleteProgress || 'Deleting files...'}
          </div>
        </Show>
      </div>
    </Show>
  );
};

export default AssetBulkActions;
