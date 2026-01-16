/**
 * Grok Imagine Favorites Manager - Legacy Tab (Original Functionality)
 */

import { createSignal, onMount, onCleanup, Show, type Component } from 'solid-js';
import type { ActionType, StorageData } from '../types';
import { UPDATE_INTERVAL, PROGRESS_CLEAR_DELAY } from '../types';

const LegacyTab: Component = () => {
  const [isFavoritesPage, setIsFavoritesPage] = createSignal<boolean>(false);
  const [showCancelButton, setShowCancelButton] = createSignal<boolean>(false);
  const [showProgress, setShowProgress] = createSignal<boolean>(false);
  const [progressText, setProgressText] = createSignal<string>('No active downloads');

  /**
   * Check if current tab is on the favorites page
   */
  const checkIfOnFavoritesPage = (): void => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs: chrome.tabs.Tab[]): void => {
      if (!tabs || tabs.length === 0) return;
      
      const tab: chrome.tabs.Tab | undefined = tabs[0];
      if (!tab) return;
      
      const url: string = tab.url ?? '';
      const isOnFavoritesPage: boolean = url.includes('grok.com/imagine/favorites');
      setIsFavoritesPage(isOnFavoritesPage);
    });
  };

  /**
   * Send action message to content script
   */
  const sendAction = (action: ActionType): void => {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs: chrome.tabs.Tab[]): Promise<void> => {
      if (!tabs || tabs.length === 0) {
        console.error('No active tab found');
        return;
      }
      
      const tab: chrome.tabs.Tab | undefined = tabs[0];
      if (!tab || tab.id === undefined) {
        console.error('Tab ID is undefined');
        return;
      }

      const tabId: number = tab.id;
      
      // Try to ping the content script first
      chrome.tabs.sendMessage(tabId, { action: 'ping' }, async (): Promise<void> => {
        if (chrome.runtime.lastError) {
          // Content script not loaded, inject it
          console.log('Content script not loaded, injecting...');
          try {
            await chrome.scripting.executeScript({
              target: { tabId },
              files: ['src/content.js']
            });
            
            // Wait for script to initialize
            setTimeout((): void => {
              chrome.tabs.sendMessage(tabId, { action }, (): void => {
                // Ignore errors - content script handles the action asynchronously
              });
              
              window.close();
            }, 100);
          } catch (error: unknown) {
            console.error('Failed to inject content script:', error);
            alert('Failed to initialize extension. Please refresh the page and try again.');
          }
        } else {
          // Content script is already loaded
          chrome.tabs.sendMessage(tabId, { action }, (): void => {
            // Ignore errors - content script handles the action asynchronously
          });
          
          window.close();
        }
      });
    });
  };

  /**
   * Open Chrome downloads page
   */
  const openDownloadsPage = (): void => {
    chrome.tabs.create({ url: 'chrome://downloads/' });
  };

  /**
   * Open Chrome downloads settings
   */
  const openDownloadSettings = (): void => {
    chrome.tabs.create({ url: 'chrome://settings/downloads' });
  };

  /**
   * Cancel current operation
   */
  const cancelCurrentOperation = (): void => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs: chrome.tabs.Tab[]): void => {
      if (!tabs || tabs.length === 0) {
        console.error('No active tab found');
        return;
      }
      
      const tab: chrome.tabs.Tab | undefined = tabs[0];
      if (!tab || tab.id === undefined) return;

      chrome.tabs.sendMessage(tab.id, { action: 'cancelOperation' as ActionType }, (response: unknown): void => {
        if (chrome.runtime.lastError) {
          return;
        }
        
        const typedResponse = response as { success?: boolean } | undefined;
        if (typedResponse?.success) {
          setShowCancelButton(false);
          chrome.storage.local.set({ activeOperation: false });
        }
      });
    });
  };

  /**
   * Check for active operations
   */
  const checkActiveOperation = (): void => {
    chrome.storage.local.get(['activeOperation'], (result: StorageData): void => {
      setShowCancelButton(result.activeOperation ?? false);
    });
  };

  /**
   * Update download progress
   */
  const updateProgress = (): void => {
    chrome.storage.local.get(['totalDownloads', 'downloadProgress'], (result: StorageData): void => {
      const total: number = result.totalDownloads ?? 0;
      const progress = result.downloadProgress ?? {};
      const completed: number = Object.values(progress).filter((s): boolean => s === 'complete').length;
      
      if (total > 0) {
        setShowProgress(true);
        setProgressText(`${completed} of ${total} downloads complete`);
        
        // Clear progress after all complete
        if (completed === total) {
          setTimeout((): void => {
            chrome.storage.local.remove(['totalDownloads', 'downloadProgress']);
            setShowProgress(false);
          }, PROGRESS_CLEAR_DELAY);
        }
      } else {
        setShowProgress(false);
      }
    });
  };

  // Initialize on mount
  onMount((): void => {
    checkIfOnFavoritesPage();
    updateProgress();
    checkActiveOperation();

    // Set up progress update interval
    const progressInterval: number = window.setInterval(updateProgress, UPDATE_INTERVAL);
    
    // Set up active operation check interval
    const operationInterval: number = window.setInterval(checkActiveOperation, 1000);

    // Cleanup intervals on unmount
    onCleanup((): void => {
      clearInterval(progressInterval);
      clearInterval(operationInterval);
    });
  });

  return (
    <div class="legacy-tab">
      <Show when={!isFavoritesPage()}>
        <div class="warning">
          ⚠️ Navigate to grok.com/imagine/favorites to use this extension
        </div>
      </Show>

      <div class="section">
        <div class="section-title">Download</div>
        <button 
          class="primary" 
          onClick={(): void => sendAction('saveBoth')}
          disabled={!isFavoritesPage()}
        >
          Download All Media
        </button>
        <button 
          onClick={(): void => sendAction('saveImages')}
          disabled={!isFavoritesPage()}
        >
          Download Images Only
        </button>
        <button 
          onClick={(): void => sendAction('saveVideos')}
          disabled={!isFavoritesPage()}
        >
          Download Videos Only
        </button>
        <div class="rate-limit-notice">
          Downloads are rate-limited to ~3 per second
        </div>
      </div>

      <div class="section">
        <div class="section-title">Video Tools</div>
        <button 
          onClick={(): void => sendAction('upscaleVideos')}
          disabled={!isFavoritesPage()}
        >
          Upscale Videos to HD
        </button>
      </div>

      <div class="section">
        <div class="section-title">Manage</div>
        <button 
          class="danger" 
          onClick={(): void => sendAction('unsaveAll')}
          disabled={!isFavoritesPage()}
        >
          Unfavorite All
        </button>
      </div>

      <div class="section">
        <button onClick={openDownloadsPage}>
          Open Downloads Folder
        </button>
        <button onClick={openDownloadSettings}>
          Open Download Settings
        </button>
        <Show when={showCancelButton()}>
          <button class="danger" onClick={cancelCurrentOperation}>
            Cancel Current Operation
          </button>
        </Show>
      </div>

      <Show when={showProgress()}>
        <div id="progress" class="visible">
          <h4>DOWNLOAD PROGRESS</h4>
          <div id="progressText">{progressText()}</div>
        </div>
      </Show>
    </div>
  );
};

export default LegacyTab;
