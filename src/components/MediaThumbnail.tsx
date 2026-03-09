/**
 * Media Thumbnail Component
 * Displays an individual media post with selection and download status
 */

import { type Component } from 'solid-js';
import type { MediaThumbnailProps } from '../types/media';

const MediaThumbnail: Component<MediaThumbnailProps> = (props) => {
  const tagCount = () => props.post.tags?.length || 0;
  const tagLabel = () => {
    const tags = props.post.tags || [];
    if (tags.length === 0) return '';
    if (tags.length === 1) return tags[0] || 'Tagged';
    return `${tags[0] || 'Tagged'} +${tags.length - 1}`;
  };

  const handleCheckboxChange = (e: Event) => {
    e.stopPropagation();
    const mouseEvent = e as MouseEvent;
    
    // Prevent default browser selection on shift-click
    if (mouseEvent.shiftKey) {
      e.preventDefault();
    }
    
    console.log('Checkbox clicked for:', props.post.id);
    props.onToggleSelect(props.post.id, mouseEvent.shiftKey);
  };

  const handleThumbnailClick = (e: MouseEvent) => {
    // Prevent default browser selection on shift-click
    if (e.shiftKey) {
      e.preventDefault();
    }
    
    console.log('Thumbnail clicked for:', props.post.id, 'shiftKey:', e.shiftKey);
    props.onToggleSelect(props.post.id, e.shiftKey);
  };

  const handleOpenInGrok = (e: Event) => {
    e.stopPropagation();
    const url = `https://grok.com/imagine/post/${props.post.id}`;
    window.open(url, '_blank', 'noopener,noreferrer');
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

      {tagCount() > 0 && (
        <div class="thumbnail-tagged-badge" title={`Folders: ${(props.post.tags || []).join(', ')}`}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h4.8c.4 0 .78.16 1.06.44l4.2 4.2a1.5 1.5 0 0 1 0 2.12l-4.8 4.8a1.5 1.5 0 0 1-2.12 0l-4.2-4.2A1.5 1.5 0 0 1 2 8.28V3.5zm3 .5a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
          </svg>
          <span>{tagLabel()}</span>
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

      {/* HD Status Badge */}
      {props.post.videoCount > 0 && props.post.hdStatus && props.post.hdStatus !== 'unknown' && (
        <div class={`thumbnail-hd-badge hd-${props.post.hdStatus}`} title={`HD: ${props.post.hdStatus}`}>
          {/* Check mark for all HD */}
          {props.post.hdStatus === 'all' && (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M13.5 2L6 9.5L2.5 6L1 7.5L6 12.5L15 3.5L13.5 2Z"/>
            </svg>
          )}
          {/* Half circle for partial HD */}
          {props.post.hdStatus === 'partial' && (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor">
              <circle cx="8" cy="8" r="6" stroke-width="2"/>
              <path d="M8 2 A6 6 0 0 1 8 14 L8 8 Z" fill="currentColor" stroke="none"/>
            </svg>
          )}
          {/* X mark for no HD */}
          {props.post.hdStatus === 'none' && (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          )}
          <span>HD</span>
        </div>
      )}

      {/* Overlay on hover */}
      <div class="thumbnail-overlay">
        <button 
          class="thumbnail-open-btn"
          onClick={handleOpenInGrok}
          title="Open in Grok"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M14 14H2V2h5V0H2C0.9 0 0 0.9 0 2v12c0 1.1 0.9 2 2 2h12c1.1 0 2-0.9 2-2V9h-2v5zM9 0v2h3.6L4.3 10.3l1.4 1.4L14 3.4V7h2V0H9z"/>
          </svg>
        </button>
        <div class="thumbnail-info">
          <div class="thumbnail-id">{props.post.id.slice(0, 8)}</div>
        </div>
      </div>
    </div>
  );
};

export default MediaThumbnail;
