/**
 * Media Thumbnail Component
 * Displays an individual media post with selection and download status
 */

import { type Component } from 'solid-js';
import type { MediaThumbnailProps } from '../types/media';

const MediaThumbnail: Component<MediaThumbnailProps> = (props) => {
  const handleCheckboxChange = (e: Event) => {
    e.stopPropagation();
    console.log('Checkbox clicked for:', props.post.id);
    props.onToggleSelect(props.post.id);
  };

  const handleThumbnailClick = () => {
    console.log('Thumbnail clicked for:', props.post.id);
    props.onToggleSelect(props.post.id);
  };

  return (
    <div 
      class={`media-thumbnail ${props.isSelected ? 'selected' : ''} ${props.isDownloaded ? 'downloaded' : ''}`}
      onClick={handleThumbnailClick}
    >
      {/* Selection Checkbox */}
      <div class="thumbnail-checkbox">
        <input
          type="checkbox"
          checked={props.isSelected}
          onClick={handleCheckboxChange}
        />
      </div>

      {/* Downloaded Indicator */}
      {props.isDownloaded && (
        <div class="thumbnail-downloaded-badge">
          ✓
        </div>
      )}

      {/* Thumbnail Image */}
      <div class="thumbnail-image-wrapper">
        <img 
          src={props.post.thumbnailUrl || props.post.imageUrl} 
          alt="Generated media"
          loading="lazy"
          class="thumbnail-image"
        />
      </div>

      {/* Video Count Badge */}
      {props.post.videoCount > 0 && (
        <div class="thumbnail-video-badge">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M2 2L10 6L2 10V2Z" />
          </svg>
          <span>{props.post.videoCount}</span>
        </div>
      )}

      {/* Overlay on hover */}
      <div class="thumbnail-overlay">
        <div class="thumbnail-info">
          <div class="thumbnail-id">{props.post.id.slice(0, 8)}</div>
        </div>
      </div>
    </div>
  );
};

export default MediaThumbnail;
