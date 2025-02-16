<div align="center">
<img src="public/icon-128.png" alt="logo"/>
<h1> Alko-Vivino Chrome Extension</h1>

</div>

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Usage](#usage)
  - [Setup](#setup)
  - [Customization](#customization)
  - [Publishing](#publishing)
- [Tech Stack](#tech-stack)
- [Contributing](#contributing)

## Introduction&#x20;

The **Alko-Vivino Chrome Extension** enhances the online shopping experience for wine enthusiasts by integrating **Vivino ratings** directly into the Finnish **Alko** online store. This extension automatically fetches wine ratings from Vivino and displays them alongside the products on Alko's website, helping users make more informed purchasing decisions.

## Features&#x20;

- **Automatic Wine Rating Fetching** – Retrieves Vivino ratings for wines available on Alko.fi.
- **Seamless Integration** – Displays ratings directly on the Alko product pages.
- **Expandable Wine Data** – View additional details, such as vintage and bottle size options.
- **Rating Filter** – Set a minimum rating threshold to highlight only highly-rated wines.
- **Optimized Storage** – Uses `chrome.storage.local` for caching and merging data to improve performance.

## Usage&#x20;

### Setup&#x20;

1. Clone this repository.
2. Run `pnpm install` (ensure Node.js 16+ is installed).
3. Start the development server:
   ```sh
   pnpm run dev
   ```
4. Load the extension in Chrome:
   - Open `chrome://extensions`.
   - Enable **Developer Mode**.
   - Click **Load unpacked** and select the `dist` folder.

### Customization&#x20;

Modify or extend features as needed:

- Change the UI elements displayed on Alko.fi.
- Adjust the rating filter logic in the background script.
- Enhance caching mechanisms for better performance.

### Publishing&#x20;

To publish the extension to the Chrome Web Store:

1. Build the production-ready files:
   ```sh
   pnpm run build
   ```
2. Zip the contents of the `dist` folder.
3. Upload the zip file to the Chrome Web Store.

## Tech Stack&#x20;

- **React** – UI framework for interactive components.
- **Vite** – Fast build tool for web extensions.
- **TypeScript** – Strongly typed JavaScript.
- **Tailwind CSS** – Utility-first styling.
- **Chrome Extensions API** – For storage and content script interactions.

## Contributing&#x20;

Contributions are welcome! Feel free to submit PRs or open issues to improve the extension.

