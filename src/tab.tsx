/**
 * Grok Imagine Favorites Manager - Full Screen Tab View
 */

import { type Component } from 'solid-js';
import MediaGridTab from './tabs/MediaGridTab';
import './popup.css';
import './tab.css';

const Tab: Component = () => {
  return (
    <div class="tab-container">
      {/* Header */}
      <div class="tab-header">
        <div class="tab-header-content">
          <h1>Grok Imagine Favorites Manager</h1>
          <p class="tab-subtitle">Browse and manage your favorited media</p>
        </div>
      </div>

      {/* Full-width Media Browser */}
      <div class="tab-content-wrapper">
        <MediaGridTab fullWidth={true} />
      </div>

      {/* Footer */}
      <div class="tab-footer">
        <span>Made for Grok Imagine</span>
        <span class="tab-footer-divider">•</span>
        <a href="https://grok.com/imagine/favorites" target="_blank" rel="noopener noreferrer">
          Open Grok Favorites
        </a>
      </div>
    </div>
  );
};

export default Tab;
