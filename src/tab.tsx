/**
 * Grok Imagine Favorites Manager - Full Screen Tab View
 */

import { createSignal, Show, type Component } from 'solid-js';
import FilesGridTab from './tabs/FilesGridTab';
import MediaGridTab from './tabs/MediaGridTab';
import './popup.css';
import './tab.css';

type TabView = 'favorites' | 'files';

const Tab: Component = () => {
  const initialView = (): TabView => {
    const view = new URLSearchParams(window.location.search).get('view');
    return view === 'files' ? 'files' : 'favorites';
  };

  const [activeView, setActiveView] = createSignal<TabView>(initialView());

  return (
    <div class="tab-container">
      {/* Header */}
      <div class="tab-header">
        <div class="tab-header-content">
          <h1>Grok Imagine Manager</h1>
          <p class="tab-subtitle">Browse favorites and uploaded files</p>
        </div>
      </div>

      <div class="tab-navigation">
        <button
          class={`tab-button ${activeView() === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveView('favorites')}
        >
          Favorites
        </button>
        <button
          class={`tab-button ${activeView() === 'files' ? 'active' : ''}`}
          onClick={() => setActiveView('files')}
        >
          Files
        </button>
      </div>

      {/* Full-width Media Browser */}
      <div class="tab-content-wrapper">
        <Show when={activeView() === 'favorites'}>
          <MediaGridTab fullWidth={true} />
        </Show>
        <Show when={activeView() === 'files'}>
          <FilesGridTab fullWidth={true} />
        </Show>
      </div>

      {/* Footer */}
      <div class="tab-footer">
        <span>Made for Grok Imagine</span>
        <span class="tab-footer-divider">•</span>
        <a href="https://grok.com/" target="_blank" rel="noopener noreferrer">
          Open Grok
        </a>
      </div>
    </div>
  );
};

export default Tab;
