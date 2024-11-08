import { AlkoData, FilteredData } from '@src/lib/types';

(async () => {
  const expirationTime: number = 30 * 24 * 60 * 60 * 1000;
  let isUpdating = false;

  const productContainers = document.querySelectorAll('.product-data-container');
  const wineNameContainer = document.querySelector('h1[itemprop="name"]');

  try {
    console.log('Content script loaded');
    console.log('Wine Name Container:', wineNameContainer);
    console.log('Product Containers:', productContainers);

    if (wineNameContainer) {
      // Logic for handling operations when a wine name container exists goes here.
    } else if (productContainers.length > 0) {
      await processProductContainers(productContainers);
    } else {
      console.error('Failed to find wine name on the page');
    }
  } catch (e) {
    console.error('Error:', e);
  }

  async function processProductContainers(containers: NodeListOf<Element>) {
    for (const container of containers) {
      const parsedData = await extractProductData(container);
      if (parsedData) {
        await safeUpdateWineData(parsedData, container as HTMLElement);
      }
    }
  }

  async function extractProductData(container: Element): Promise<AlkoData | null> {
    const priceSpan = container.querySelector('span[itemprop="price"]');
    const priceString: string = priceSpan ? priceSpan.getAttribute('content') || '' : '';

    const productData = container.getAttribute('data-product-data');
    if (productData) {
      const parsedData: AlkoData = JSON.parse(productData);

      const wineNameVintage: string = parsedData.name;
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

      parsedData.vintage = vintage;
      parsedData.name = wineName;
      parsedData.price = parseFloat(priceString);
      
      return parsedData;
    }
    return null;
  }

  async function safeUpdateWineData(parsedData: AlkoData, container: HTMLElement) {
    if (isUpdating) return;
    isUpdating = true;

    try {
      await handleWineStorage(parsedData, container);
    } finally {
      isUpdating = false;
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
    return new Promise<void>((resolve) => {
      chrome.runtime.sendMessage({ action: "fetch_rating", parsedData }, async (response: { success: boolean; data: FilteredData; error?: string }) => {
        if (response.success) {
          const wineDetails: FilteredData = response.data;
          console.log('Fetched wine details:', wineDetails);
          wineDetails.timestamp = Date.now();

          const existingWineData: FilteredData | undefined = await getStorageData(parsedData.name);
          if (existingWineData) {
            const vintage = parsedData.vintage || 'all';
            existingWineData.vintage[vintage] = wineDetails.vintage[vintage];

            await setStorageData(parsedData.name, existingWineData);
            displayWineDetails(existingWineData, container, vintage);
          } else {
            await setStorageData(parsedData.name, wineDetails);
            const vintage = parsedData.vintage || 'all';
            displayWineDetails(wineDetails, container, vintage);
          }
        } else {
          console.error('Error fetching wine details:', response.error);
        }
        resolve();
      });
    });
  }

  function displayWineDetails(wineDetails: FilteredData, container: HTMLElement, vintage: string | null) {
    const overallRatingElement: HTMLSpanElement = document.createElement('span');
    const vintageRatingElement: HTMLSpanElement = document.createElement('span');
    const vivinoLink: HTMLAnchorElement = document.createElement('a');
    const vintageLink: HTMLAnchorElement = document.createElement('a');
    const ratingElement: HTMLDivElement = document.createElement('div');

    if (vintage) {
      const vintageDetails = wineDetails.vintage[vintage] || null;

      if (vintageDetails) {
        vintageRatingElement.textContent = `${vintage}: ${vintageDetails.ratings_average} ★ | ${vintageDetails.ratings_count} ratings`;
        vintageLink.href = `https://www.vivino.com/wines/${vintageDetails.id || ''}`;
        vintageLink.target = "_blank";

        if (wineDetails.vintage) {
          const overallRating = `All: ${wineDetails.ratings_average} ★ | ${wineDetails.ratings_count} ratings`;
          overallRatingElement.textContent = overallRating;
          vivinoLink.href = `https://www.vivino.com/wines/${wineDetails.id || ''}`;
          vivinoLink.target = "_blank";
          vivinoLink.appendChild(overallRatingElement);
        }
      } else {
        ratingElement.textContent = 'No vintage rating available';
      }
    } else {
      overallRatingElement.textContent = wineDetails.vintage ? `All: ${wineDetails.ratings_average} ★ | ${wineDetails.ratings_count} ratings` : 'No rating available';
      vivinoLink.href = `https://www.vivino.com/wines/${wineDetails.id || ''}`;
      vivinoLink.target = "_blank";
    }

    vintageLink.appendChild(vintageRatingElement);
    ratingElement.appendChild(vivinoLink);
    ratingElement.appendChild(vintageLink);

    if (container) {
      container.insertAdjacentElement('afterend', ratingElement);
    } else {
      wineNameContainer?.insertAdjacentElement('afterend', ratingElement);
    }
  }

})();