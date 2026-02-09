import { AlkoData, FilteredData } from '@src/lib/types';

(async () => {
  const expirationTime: number = 30 * 24 * 60 * 60 * 1000;
  const updatingWines = new Set<string>();
  const inFlightRequests = new Map<string, Promise<FilteredData | null>>();

  // New Alko.fi layout uses <article> elements for products
  const productContainers = document.querySelectorAll('article[id^="product-"]');

  try {
    console.log('Content script loaded');
    console.log('Product Containers found:', productContainers.length);

    if (productContainers.length > 0) {
      await processProductContainers(productContainers);
    } else {
      console.error('Failed to find products on the page');
    }
  } catch (e) {
    console.error('Error:', e);
  }

  async function processProductContainers(containers: NodeListOf<Element>) {
    // Process all containers in parallel for better performance
    const promises = Array.from(containers).map(async (container) => {
      const parsedData = await extractProductData(container);
      if (parsedData) {
        await safeUpdateWineData(parsedData, container as HTMLElement);
      }
    });

    await Promise.all(promises);
  }

  async function extractProductData(container: Element): Promise<AlkoData | null> {
    try {
      // Extract product ID from article id attribute (e.g., "product-936515")
      const articleId = container.getAttribute('id');
      const productId = articleId ? parseInt(articleId.replace('product-', '')) : 0;

      // Extract product name from heading
      const headingElement = container.querySelector('[role="heading"]');
      const wineNameVintage = headingElement?.textContent?.trim() || '';

      if (!wineNameVintage) {
        console.warn('No product name found');
        return null;
      }

      // Extract category and origin (e.g., "Punaviinit • Australia")
      const categoryOriginDiv = container.querySelector('.text-additional-gray-400.order-first');
      const categoryOriginText = categoryOriginDiv?.textContent?.trim() || '';
      const [category = '', origin = ''] = categoryOriginText.split(/\s*\|\s*|\s*•\s*/);

      // Extract price (split into integer and decimal parts)
      const priceContainer = container.querySelector('[aria-hidden="true"].inline-flex');
      const priceInteger = priceContainer?.querySelector('.text-2xl')?.textContent?.trim() || '0';
      const priceDecimal = priceContainer?.querySelector('.text-sm')?.textContent?.trim() || '00';
      const price = parseFloat(`${priceInteger}.${priceDecimal}`);

      // Extract size and alcohol content
      const detailsDiv = container.querySelector('.order-4.flex.gap-1');
      const detailsText = detailsDiv?.textContent?.trim() || '';

      // Size (e.g., "0,75 l")
      const sizeMatch = detailsText.match(/([\d,]+)\s*l/);
      const size = sizeMatch ? parseFloat(sizeMatch[1].replace(',', '.')) : 0.75;

      // Alcohol (e.g., "12,5 til-%")
      const alcoholMatch = detailsText.match(/([\d,]+)\s*til-%/);
      const alcohol = alcoholMatch ? parseFloat(alcoholMatch[1].replace(',', '.')) : 0;

      // Extract vintage from product name
      const words: string[] = wineNameVintage.split(' ');
      let vintage: string | null = null;
      let wineName: string = wineNameVintage;

      for (let i = words.length - 1; i >= 0; i--) {
        const word: string = words[i];
        if (word.match(/(20\d{2}|19\d{2})/)) {
          vintage = word;
          wineName = words.slice(0, i).join(' ');
          break;
        }
      }

      const parsedData: AlkoData = {
        id: productId,
        name: wineName,
        size: size,
        price: price,
        selection: '', // Not available in new layout
        category: category.trim(),
        origin: origin.trim(),
        supplier: '', // Not available in new layout
        producer: '', // Not available in new layout
        alcohol: alcohol,
        packaging: 'Lasipullo', // Default value
        greenChoice: '', // Not available in new layout
        ethical: '', // Not available in new layout
        vintage: vintage,
      };

      console.log('Extracted product data:', parsedData);
      return parsedData;
    } catch (error) {
      console.error('Error extracting product data:', error);
      return null;
    }
  }

  async function safeUpdateWineData(parsedData: AlkoData, container: HTMLElement) {
    // Track updates per wine name instead of globally to allow parallel processing
    if (updatingWines.has(parsedData.name)) return;
    updatingWines.add(parsedData.name);

    try {
      await handleWineStorage(parsedData, container);
    } finally {
      updatingWines.delete(parsedData.name);
    }
  }

  async function handleWineStorage(parsedData: AlkoData, container: HTMLElement) {
    const wineName = parsedData.name;
    const storedWineData: FilteredData | undefined = await getStorageData(wineName);

    const now = Date.now();
    const vintage = parsedData.vintage || 'all';
    const size = parsedData.size;

    if (storedWineData && storedWineData.vintage[vintage] && now - storedWineData.timestamp < expirationTime) {
      if (size && !storedWineData.vintage[vintage].size?.[size]) {
        storedWineData.vintage[vintage].size = storedWineData.vintage[vintage].size || {};
        storedWineData.vintage[vintage].size[size] = { price: parsedData.price, alkoId: parsedData.id };
        await setStorageData(wineName, storedWineData);
      }
      displayWineDetails(storedWineData, container, vintage);
    } else {
      await fetchWineDetails(parsedData, container);
    }
  }

  function getStorageData(wineName: string): Promise<FilteredData | undefined> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(wineName, (data: { [key: string]: FilteredData }) => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }
        resolve(data[wineName]);
      });
    });
  }

  function setStorageData(wineName: string, data: FilteredData): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [wineName]: data }, () => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }
        resolve();
      });
    });
  }

  async function fetchWineDetails(parsedData: AlkoData, container: HTMLElement) {
    const wineName = parsedData.name;
    const vintage = parsedData.vintage || 'all';

    // Check if there's already an in-flight request for this wine
    if (inFlightRequests.has(wineName)) {
      const wineDetails = await inFlightRequests.get(wineName);
      if (wineDetails) {
        displayWineDetails(wineDetails, container, vintage);
      }
      return;
    }

    // Create a new request and cache it
    const requestPromise = new Promise<FilteredData | null>((resolve) => {
      chrome.runtime.sendMessage({ action: "fetch_rating", parsedData }, async (response: { success: boolean; data: FilteredData; error?: string }) => {
        if (response.success) {
          const wineDetails: FilteredData = response.data;
          console.log('Fetched wine details:', wineDetails);
          wineDetails.timestamp = Date.now();

          const existingWineData: FilteredData | undefined = await getStorageData(parsedData.name);
          if (existingWineData) {
            existingWineData.vintage[vintage] = wineDetails.vintage[vintage];
            await setStorageData(parsedData.name, existingWineData);
            resolve(existingWineData);
          } else {
            await setStorageData(parsedData.name, wineDetails);
            resolve(wineDetails);
          }
        } else {
          console.error('Error fetching wine details:', response.error);
          resolve(null);
        }
      });
    });

    inFlightRequests.set(wineName, requestPromise);

    try {
      const wineDetails = await requestPromise;
      if (wineDetails) {
        displayWineDetails(wineDetails, container, vintage);
      }
    } finally {
      inFlightRequests.delete(wineName);
    }
  }

  function displayWineDetails(wineDetails: FilteredData, container: HTMLElement, vintage: string | null) {
    // Find the heading element to insert rating after it
    const headingElement = container.querySelector('[role="heading"]');
    if (!headingElement) {
      console.warn('Could not find heading element to display ratings');
      return;
    }

    // Create main rating container with Alko.fi styling
    const ratingContainer = document.createElement('div');
    ratingContainer.className = 'vivino-ratings';
    ratingContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 8px;
      padding: 8px 0;
      border-top: 1px solid #E5E5E5;
      border-bottom: 1px solid #E5E5E5;
      font-size: 14px;
      position: relative;
      z-index: 15;
    `;

    const vintageDetails = vintage ? wineDetails.vintage[vintage] : null;

    // Create vintage rating (if available)
    if (vintageDetails && vintageDetails.ratings_average) {
      const vintageRatingLink = document.createElement('a');
      vintageRatingLink.href = `https://www.vivino.com/wines/${vintageDetails.id || ''}`;
      vintageRatingLink.target = '_blank';
      vintageRatingLink.rel = 'noopener noreferrer';
      vintageRatingLink.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        color: #1a1a1a;
        text-decoration: none;
        font-weight: 600;
        transition: color 0.2s;
        position: relative;
        z-index: 20;
      `;
      vintageRatingLink.onmouseover = () => vintageRatingLink.style.color = '#8B0000';
      vintageRatingLink.onmouseout = () => vintageRatingLink.style.color = '#1a1a1a';

      const starIcon = document.createElement('span');
      starIcon.textContent = '⭐';
      starIcon.style.fontSize = '16px';

      const ratingText = document.createElement('span');
      ratingText.innerHTML = `
        <strong>${vintageDetails.ratings_average}</strong>
        <span style="color: #666; font-weight: normal;">(${vintageDetails.ratings_count.toLocaleString()} arvostelua)</span>
        ${vintage ? `<span style="color: #999; margin-left: 4px;">• ${vintage}</span>` : ''}
      `;

      const vivinoLabel = document.createElement('span');
      vivinoLabel.textContent = 'Vivino';
      vivinoLabel.style.cssText = `
        font-size: 11px;
        color: #8B0000;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      `;

      vintageRatingLink.appendChild(starIcon);
      vintageRatingLink.appendChild(ratingText);
      vintageRatingLink.appendChild(vivinoLabel);
      ratingContainer.appendChild(vintageRatingLink);
    }

    // Create overall rating (if different from vintage rating)
    if (wineDetails.ratings_average && wineDetails.ratings_average !== vintageDetails?.ratings_average) {
      const overallRatingLink = document.createElement('a');
      overallRatingLink.href = `https://www.vivino.com/wines/${wineDetails.id || ''}`;
      overallRatingLink.target = '_blank';
      overallRatingLink.rel = 'noopener noreferrer';
      overallRatingLink.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        color: #666;
        text-decoration: none;
        font-size: 13px;
        transition: color 0.2s;
        position: relative;
        z-index: 20;
      `;
      overallRatingLink.onmouseover = () => overallRatingLink.style.color = '#8B0000';
      overallRatingLink.onmouseout = () => overallRatingLink.style.color = '#666';

      const overallText = document.createElement('span');
      overallText.innerHTML = `
        <span style="margin-left: 24px;">Kaikki vuosikerrat: </span>
        <strong>${wineDetails.ratings_average}</strong>
        <span style="color: #999;">(${wineDetails.ratings_count.toLocaleString()})</span>
      `;

      overallRatingLink.appendChild(overallText);
      ratingContainer.appendChild(overallRatingLink);
    }

    // Show "No rating" message if no ratings available
    if (!vintageDetails?.ratings_average && !wineDetails.ratings_average) {
      const noRatingText = document.createElement('div');
      noRatingText.style.cssText = `
        color: #999;
        font-size: 13px;
        font-style: italic;
      `;
      noRatingText.textContent = 'Ei vielä arvosteluja Vivinossa';
      ratingContainer.appendChild(noRatingText);
    }

    // Insert rating after the heading
    headingElement.parentElement?.insertBefore(ratingContainer, headingElement.nextSibling);
  }

})();