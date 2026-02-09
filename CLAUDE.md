# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a Chrome extension that integrates Vivino wine ratings directly into the Alko (Finnish alcohol store) website. The extension fetches wine data from Vivino's API, caches it locally, and displays ratings alongside products on alko.fi.

## Development Commands

### Build and Development
```bash
pnpm install          # Install dependencies (requires Node.js 16+)
pnpm run dev          # Start development server with hot reload
pnpm run build        # Build production-ready files for dist/
```

### Loading Extension
1. Build the extension using `pnpm run dev` or `pnpm run build`
2. Open `chrome://extensions` in Chrome
3. Enable Developer Mode
4. Click "Load unpacked" and select the `dist` folder

### Development Workflow
- `nodemon` watches for changes in `src/`, `vite.config.ts`, and manifest files
- The `__DEV__` environment variable controls development mode features
- Dev builds include source maps and dev icons
- Production builds strip dev icons via the `stripDevIcons` plugin

## Architecture

### Extension Components

The extension follows Chrome Extension Manifest V3 architecture with these main components:

1. **Background Service Worker** (`src/pages/background/index.ts`)
   - Fetches wine ratings from Vivino's Algolia API
   - Handles message passing between content scripts and the API
   - Validates wine matches using Levenshtein distance (producer name comparison)
   - Returns filtered data including vintage-specific ratings

2. **Content Script** (`src/pages/content/index.tsx`)
   - Injected into Alko product pages (`https://www.alko.fi/tuotteet*`)
   - Extracts product data from DOM (`data-product-data` attributes)
   - Manages local storage with 30-day expiration
   - Displays ratings inline on product listings
   - Handles vintage parsing from wine names (extracts years like 2019, 2020)

3. **Popup** (`src/pages/popup/Popup.tsx`)
   - Shows count of cached wines
   - Provides button to open the wines data table
   - Includes "Flush Local Storage" option to clear cache

4. **Data Table Page** (`src/pages/datatab/index.tsx`)
   - Full-page view of all cached wine data
   - Filterable and sortable columns (category, name, rating, price, country, region)
   - Interactive rating filter (star-based)
   - Price range filter (min/max inputs)
   - Expandable rows for wines with multiple vintages

### Data Flow

1. User visits Alko product page
2. Content script extracts product data from page
3. Content script checks local storage for cached data (30-day TTL)
4. If not cached or expired, sends message to background script
5. Background script queries Vivino Algolia API with wine name
6. Background script validates match using producer name similarity
7. Response includes overall ratings and vintage-specific ratings
8. Data stored in `chrome.storage.local` keyed by wine name
9. Ratings displayed inline on the page with Vivino links

### Key Data Structures

**AlkoData** (extracted from Alko page):
- Product ID, name, size, price, alcohol %, category, origin, producer, vintage

**FilteredData** (stored in chrome.storage.local):
- Vivino wine ID, ratings (overall + per-vintage), region info
- Nested `vintage` object with ratings and price data per size
- Timestamp for cache expiration (30 days)

### Important Implementation Details

1. **Producer Name Matching**
   - Uses Levenshtein distance to compare Alko producer vs Vivino winery
   - Threshold of 5 for similarity check (`compareNames` in `utils.ts`)
   - Hardcoded exceptions for certain importers (Hartwall, Winepartners, IWB, Bixio)

2. **Storage Strategy**
   - Wines stored by name (without vintage) to merge vintage data
   - Multiple vintages and bottle sizes stored under same wine
   - 30-day expiration (`expirationTime = 30 * 24 * 60 * 60 * 1000`)
   - Storage merging: if wine exists, add new vintage/size data

3. **Vintage Handling**
   - Vintage extracted from wine name using regex `/(20\d{2}|19\d{2})/`
   - Supports years 1900-2099
   - If no vintage found, uses key `'all'` in storage

4. **API Integration**
   - Vivino Algolia API endpoint: `https://9takgwjuxl-dsn.algolia.net/1/indexes/WINES_prod/query`
   - API keys hardcoded in background script (x-algolia-api-key, x-algolia-application-id)
   - Fetches top 6 hits per query

## Tech Stack

- **Build Tool**: Vite with `@crxjs/vite-plugin` for Chrome extension support
- **Framework**: React 18 (TSX)
- **Styling**: Tailwind CSS with custom components (shadcn/ui pattern)
- **UI Components**: Radix UI primitives (@radix-ui/react-*)
- **Data Tables**: TanStack React Table with filtering/sorting
- **Type Safety**: TypeScript (strict mode)
- **Dev Tools**: nodemon for hot reload

## File Structure

- `src/pages/background/` - Service worker
- `src/pages/content/` - Content script for Alko pages
- `src/pages/popup/` - Extension popup UI
- `src/pages/datatab/` - Full wine data table page
- `src/components/` - Reusable React components (columns, data-table, UI primitives)
- `src/lib/types.ts` - TypeScript interfaces (AlkoData, FilteredData)
- `src/lib/utils.ts` - Utility functions (cn for classnames, compareNames for Levenshtein)
- `manifest.json` - Production manifest
- `manifest.dev.json` - Development-specific manifest overrides
- `vite.config.ts` - Build configuration with path aliases

## Path Aliases

```typescript
'@src/*': 'src/*'
'@/*': 'src/*'
'@assets/*': 'src/assets/*'
'@pages/*': 'src/pages/*'
```

## Building for Firefox

To build for Firefox instead of Chrome:
1. Change `browser: 'chrome'` to `browser: 'firefox'` in `vite.config.ts` (line 77)
2. Update manifest.json background configuration from:
   ```json
   "background": {
     "service_worker": "src/pages/background/index.ts",
     "type": "module"
   }
   ```
   to:
   ```json
   "background": {
     "scripts": ["service-worker-loader.js"]
   }
   ```

## Notes for Future Development

- The extension caches aggressively to minimize API calls - consider this when debugging stale data
- Producer name matching has hardcoded exceptions that may need updates
- The data table page is accessed via chrome extension URL scheme (not injected into pages)
- Content script runs on Alko product listing pages (uses `article[id^="product-"]` selectors)
- Vintage ratings shown separately from overall wine ratings when available

## Recent Changes (v1.7.0)

### Updated for New Alko.fi Layout
- **Product Selection**: Now uses `article[id^="product-"]` instead of `.product-data-container`
- **Data Extraction**: Completely rewritten to parse new HTML structure:
  - Product ID from `id="product-{id}"` attribute
  - Name from `[role="heading"]` element
  - Price from split integer/decimal display
  - Category and origin from text content (split by • separator)
  - Size and alcohol from combined details text
- **Display**: New styled rating display with:
  - Inline stars and formatted numbers
  - Finnish language labels
  - Links to Vivino for both vintage and overall ratings
  - Matches Alko.fi design system (colors, spacing, typography)
- **Producer Matching**: Now optional - when producer info is unavailable, trusts wine name match from Algolia
- **URL Patterns**: Added support for `/fi/` and `/sv/` language prefixes
