# Development Guide

This extension uses Vite + Bun for fast development. The default `dev` command runs a stable watch build.

## Quick Start

```bash
# Install dependencies
bun install

# Start stable watch build
bun run dev

# Optional: start HMR dev server (can be flaky in some Chrome setups)
bun run dev:hmr

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
   This runs `vite build --watch` and rebuilds `dist/` on every change.

2. **Load the extension in Chrome:**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

3. **Make changes:**
   - Edit any file in the `src` folder
   - Click reload for the extension in `chrome://extensions` after changes
   - Check the terminal for build errors

## Available Scripts

- `bun run dev` - Stable watch build for extension development
- `bun run dev:hmr` - HMR development server (CRXJS/Vite)
- `bun run build` - Create production build
- `bun run preview` - Preview production build

## HMR (Optional)

If `bun run dev:hmr` works in your environment, @crxjs/vite-plugin provides automatic reloading for popup/content/background/manifest changes.

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
