# Grok Imagine Favorites Manager

A modern Chrome extension to download and manage your favorited Grok Imagine images and videos.

<img width="337" height="597" alt="Screenshot 2025-11-19 at 11 57 57 AM" src="https://github.com/user-attachments/assets/a42e7456-3100-4935-972f-6548c974049d" />

<img width="408" height="257" alt="Screenshot 2025-11-17 at 10 23 38 AM" src="https://github.com/user-attachments/assets/51ac09e1-8973-4cf3-a5e7-034677b62cdf" />

---

## ⚠️ IMPORTANT DISCLAIMER - READ BEFORE USE ⚠️

**USE AT YOUR OWN RISK. THIS IS AN UNOFFICIAL, THIRD-PARTY TOOL.**

- **NOT AFFILIATED** with Grok, X, or any official entities
- **NO WARRANTY** - This extension is provided "AS IS" without any guarantees
- **NO RESPONSIBILITY** - The developer is not responsible for:
  - Data loss or corruption
  - Account issues or bans
  - API changes breaking functionality
  - Any damages or issues arising from use
- **BREAKING CHANGES EXPECTED** - Grok Imagine is constantly evolving. This extension may break at any time as the platform updates its interface, API endpoints, or policies
- **EXPERIMENTAL SOFTWARE** - Features may be unstable or incomplete
- **YOUR RESPONSIBILITY** - By using this extension, you acknowledge and accept all risks

**If you cannot accept these terms, do not use this extension.**

---

## Features

- Download all images and/or videos from your favorites with automatic scrolling
- Upscale standard videos to HD quality with fast parallel requests
- Unfavorite all items at once
- Automatic filename matching (videos use image names)
- On-screen progress modal with live updates
- Cancel operations at any time
- API-based unfavoriting for reliability

## Installation

### Development Setup (With Hot Reload)

For development with automatic hot reloading:

1. **Clone the Repository**
   ```bash
   git clone https://github.com/brndnsmth/grok-imagine-favorites-manager.git
   cd grok-imagine-favorites-manager
   ```

2. **Install Dependencies**
   ```bash
   bun install
   ```

3. **Start Development Server**
   ```bash
   bun run dev
   ```
   This will start Vite in watch mode, and changes will automatically reload in the browser.

4. **Load Extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable **Developer mode** (toggle in top-right)
   - Click **"Load unpacked"**
   - Select the `dist` folder that was created by Vite
   - The extension will automatically reload when you make changes!

### Production Build

To create a production build:

```bash
bun run build
```

The built extension will be in the `dist` folder, ready to load as an unpacked extension or package for distribution.

### Simple Installation (No Development Setup)

If you just want to use the extension without development tools:

1. **Clone or Download**
   - Clone: `git clone https://github.com/brndnsmth/grok-imagine-favorites-manager.git`
   - Or download as ZIP and extract

2. **Build the Extension**
   ```bash
   bun install
   bun run build
   ```

3. **Load in Chrome**
   - Navigate to `chrome://extensions/`
   - Enable **Developer mode**
   - Click **"Load unpacked"**
   - Select the `dist` folder

### Step 3: Pin the Extension (Optional but Recommended)

1. Click the puzzle piece icon in Chrome's toolbar (Extensions menu)
2. Find "Grok Imagine Favorites Manager" in the list
3. Click the pin icon next to it
4. The extension icon will now appear in your toolbar for easy access

## Usage

1. Log in to your account
2. Navigate to https://grok.com/imagine/favorites
3. Click the extension icon
4. Choose your desired action

The extension will automatically scroll and load all favorites before processing.

### Available Actions

**Download:**
- **Download All Media** - Downloads both images and videos (videos named to match images)
- **Download Images Only** - Downloads only images
- **Download Videos Only** - Downloads only videos (named to match images)

*Note: Video downloads only capture the most recently generated video. If you've regenerated a video multiple times, only the latest version will be downloaded.*

**Video Tools:**
- **Upscale Videos to HD** - Requests upscaling for all standard videos to HD quality (requests are staggered and complete in background)

*Note: Upscaling only applies to the most recently generated video. Previous video versions cannot be upscaled through this tool.*

<img width="402" height="299" alt="Screenshot 2025-11-18 at 4 12 40 PM" src="https://github.com/user-attachments/assets/d86954d1-8cc9-4f37-a7d1-63e171937144" />

<img width="406" height="302" alt="Screenshot 2025-11-18 at 4 12 48 PM" src="https://github.com/user-attachments/assets/73f260ed-7795-40f0-a1e9-c1db95dcdf1d" />

**Manage:**
- **Unfavorite All** - Removes all favorites from your collection

**Utilities:**
- **Cancel Current Operation** - Stops any running download or unfavorite operation
- **Open Downloads Folder** - Opens Chrome downloads page
- **Open Download Settings** - Opens Chrome download settings

## Files

- `manifest.json` - Extension configuration
- `popup.html` - Extension popup UI
- `popup.js` - Popup logic and event handlers
- `content.js` - Page interaction, media extraction, and unfavorite operations
- `background.js` - Download management and rate limiting

## Downloads Location

Files are saved to your default Chrome downloads folder in a `grok-imagine/` subdirectory.

Videos are automatically named to match their corresponding image files (using the image UUID/filename).

## Technical Details

- Downloads are rate-limited to approximately 3 per second to avoid browser issues
- Unfavorite requests are delayed by 150ms between calls
- Upscale requests are staggered with 300ms delays and run in parallel
- Progress tracking displays in an on-screen modal with visual progress bar
- Content script automatically scrolls to load all lazy-loaded content
- Virtual scrolling is handled by collecting items during scroll process
- Operations support cancellation at any point

## Important Notes

- **⚠️ Grok Imagine is constantly changing** - This extension may break with platform updates
- The extension works on https://grok.com/imagine/favorites
- No manual scrolling needed - the extension handles it automatically
- Video filenames automatically match their corresponding image names for easy pairing
- **Only the most recently generated video is processed** - Earlier video versions are not accessible
- Keep the tab open while operations run to ensure completion
- Progress is shown in an on-screen modal with cancellation option
- Unfavorite operations work by calling `/rest/media/post/unlike` with the post id
- Upscale requests are sent to `/rest/media/video/upscale` and complete in the background
- Refresh the page after a few minutes to see newly upscaled HD videos
- Check browser console (F12) for detailed logs during operations

## Progress Tracking

The extension shows a gradient progress modal on the page with:
- Operation name and current status
- Visual progress bar
- Real-time count of processed items
- Cancel button to stop the operation

## Support

This extension is designed specifically for Grok Imagine favorites management. **The Grok platform is actively developed and frequently changes.** If features stop working, the extension will need updates to match new DOM structures, API endpoints, or workflows. Check the repository for updates or open an issue if you encounter problems.
