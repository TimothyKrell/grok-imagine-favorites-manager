/**
 * Entry point for the popup - mounts the SolidJS app
 */

import { render } from 'solid-js/web';
import Popup from './popup';

const root: HTMLElement | null = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found. Cannot mount popup application.');
}

render(() => <Popup />, root);
