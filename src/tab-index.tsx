/**
 * Entry point for the full-screen tab view - mounts the SolidJS app
 */

import { render } from 'solid-js/web';
import Tab from './tab';

const root: HTMLElement | null = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found. Cannot mount tab application.');
}

render(() => <Tab />, root);
