# Development Guide

This extension uses Vite + Bun for blazing fast development with hot module reloading (HMR).

## Quick Start

```bash
# Install dependencies
bun install

# Start development server with hot reload
bun run dev

# Build for production
bun run build
```

## Project Structure

```
grok-imagine-favorites-manager/
├── src/
│   ├── manifest.json       # Chrome extension manifest
│   ├── popup.html          # Extension popup UI
│   ├── popup.js            # Popup logic
│   ├── content.js          # Content script (runs on grok.com)
│   └── background.js       # Service worker
├── dist/                   # Build output (created by Vite)
├── vite.config.js          # Vite configuration
├── package.json            # Dependencies and scripts
└── bun.lock                # Bun lockfile
```

## Development Workflow

1. **Start the dev server:**
   ```bash
   bun run dev
   ```
   This starts Vite in development mode with automatic reloading.

2. **Load the extension in Chrome:**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

3. **Make changes:**
   - Edit any file in the `src` folder
   - The extension will automatically reload in the browser
   - Check the Vite terminal for build errors

## Available Scripts

- `bun run dev` - Start development server with hot reload
- `bun run build` - Create production build
- `bun run preview` - Preview production build

## Hot Reload

The @crxjs/vite-plugin provides automatic hot reloading for:
- ✅ Popup HTML/JS/CSS changes
- ✅ Content script changes
- ✅ Background script changes
- ✅ Manifest changes

No need to manually reload the extension after changes!

## Building for Production

To create a production-ready build:

```bash
bun run build
```

The optimized extension will be in the `dist` folder. You can:
- Load it as an unpacked extension for testing
- Package it as a `.crx` file for distribution
- Submit it to the Chrome Web Store

## Troubleshooting

**Extension doesn't reload after changes:**
- Make sure the dev server is running (`bun run dev`)
- Check the terminal for build errors
- Try manually reloading the extension in Chrome

**Build errors:**
- Make sure all dependencies are installed: `bun install`
- Check that you're using Bun v1.0 or higher (`bun --version`)
- Clear the build cache: `rm -rf dist .vite`

**Chrome API errors:**
- Make sure the manifest.json permissions are correct
- Check Chrome DevTools console for specific errors
- Verify you're testing on `grok.com/imagine/favorites`
