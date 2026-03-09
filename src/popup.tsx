/**
 * Grok Imagine Favorites Manager - Main Popup Component (Tabbed Interface)
 */

import { createSignal, Show, type Component } from 'solid-js';
import LegacyTab from './tabs/LegacyTab';
import FilesGridTab from './tabs/FilesGridTab';
import MediaGridTab from './tabs/MediaGridTab';
import './popup.css';

type TabType = 'favorites' | 'files' | 'legacy';

const Popup: Component = () => {
  const [activeTab, setActiveTab] = createSignal<TabType>('favorites');

  /**
   * Open Media Browser in a new full-screen tab
   * Reuses existing tab if already open
   */
  const openInFullScreen = (): void => {
    const preferredView = activeTab() === 'files' ? 'files' : 'favorites';
    const tabUrl: string = chrome.runtime.getURL(`src/tab.html?view=${preferredView}`);
    
    // Try to find existing tab
    chrome.tabs.query({ url: tabUrl }, (tabs: chrome.tabs.Tab[]): void => {
      if (tabs && tabs.length > 0 && tabs[0] && tabs[0].id !== undefined) {
        // Tab already exists, focus it
        chrome.tabs.update(tabs[0].id, { active: true });
      } else {
        // Create new tab
        chrome.tabs.create({ url: tabUrl });
      }
    });
  };

  return (
    <div class="popup-container">
      {/* Header */}
      <div class="header">
        <div class="header-content">
          <div>
            <h3>Grok Imagine Favorites Manager</h3>
            <div class="subtitle">
              Manage favorites and uploaded files
            </div>
          </div>
          <button class="open-fullscreen-btn" onClick={openInFullScreen} title="Open Media Browser in full screen">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1 1h5v2H3v3H1V1zm10 0h5v5h-2V3h-3V1zM1 11h2v3h3v2H1v-5zm14 0v5h-5v-2h3v-3h2z"/>
            </svg>
            Full Screen
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div class="tab-navigation">
        <button
          class={`tab-button ${activeTab() === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          Favorites
        </button>
        <button
          class={`tab-button ${activeTab() === 'files' ? 'active' : ''}`}
          onClick={() => setActiveTab('files')}
        >
          Files
        </button>
        <button
          class={`tab-button ${activeTab() === 'legacy' ? 'active' : ''}`}
          onClick={() => setActiveTab('legacy')}
        >
          Legacy Mode
        </button>
      </div>

      {/* Tab Content */}
      <div class="tab-content">
        <Show when={activeTab() === 'favorites'}>
          <MediaGridTab />
        </Show>

        <Show when={activeTab() === 'files'}>
          <FilesGridTab />
        </Show>
        
        <Show when={activeTab() === 'legacy'}>
          <LegacyTab />
        </Show>
      </div>

      {/* Footer */}
      <div class="footer">Made for Grok Imagine</div>
    </div>
  );
};

export default Popup;
