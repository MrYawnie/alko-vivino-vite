import { AlkoData, FilteredData } from '@src/lib/types';

const productContainers: NodeListOf<Element> = document.querySelectorAll('.product-data-container');
const wineNameContainer: HTMLElement | null = document.querySelector('h1[itemprop="name"]');
const expirationTime: number = 30 * 24 * 60 * 60 * 1000;

try {
  console.log('content script loaded');
  console.log('Wine Name Container:', wineNameContainer);
  console.log('Product Containers:', productContainers);
} catch (e) {
  console.error(e);
}

if (wineNameContainer) {
  /* const wineNameVintage: string = wineNameContainer.textContent || '';
  const lastWord: string = wineNameVintage.split(' ').pop() || '';
  const hasYear: RegExpMatchArray | null = lastWord.match(/(20\d{2}|19\d{2})/);
  const wineName: string = hasYear ? wineNameVintage.replace(lastWord, '').trim() : wineNameVintage;
  const vintage: string | null = hasYear ? lastWord : null;

  chrome.storage.local.get(wineName, (data: { [key: string]: any }) => {
    if (data[wineName]) {
      const now: number = new Date().getTime();
      const storedData: any = data[wineName];

      if (storedData && now - storedData.timestamp < expirationTime) {
        if (vintage && storedData.statistics[vintage]) {
          console.log('Using cached data:', storedData);
          displayWineDetails(storedData, null, vintage);
        } else {
          console.log('Fetching new data for:', wineName);
          fetchWineDetails(wineName, null, null, vintage);
        }
      } else {
        console.log('Fetching new data for:', wineName);
        fetchWineDetails(wineName, null, null);
      }
    } else {
      console.log('No saved wine details found in local storage. Fetching details from API for wine:', wineName);
      fetchWineDetails(wineName, null, null);
    }
  }); */

} else if (productContainers.length > 0) {
  productContainers.forEach((container: Element) => {
    let priceString: string = '';
    const priceSpan: HTMLSpanElement | null = container.querySelector('span[itemprop="price"]');
    if (priceSpan) {
      priceString = priceSpan.getAttribute('content') || '';
      console.log('Price:', priceString);
    } else {
      console.log('Price span not found in this container.');
    }
    console.log(priceString)

    console.log('Product Data Container:', container);
    const productData: string | null = container.getAttribute('data-product-data');
    if (productData) {
      console.log('Product Data:', productData);
      const parsedData: AlkoData = JSON.parse(productData);
      console.log('Parsed Data:', parsedData);

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

      const alkoId: number = parseInt(parsedData.id.toString(), 10);
      const size: number = parseFloat(parsedData.size.toString());
      const price: number = parseFloat(priceString);
      const alcohol: number = parseFloat(parsedData.alcohol.toString());

      parsedData.vintage = vintage;
      parsedData.name = wineName;
      parsedData.id = alkoId;
      parsedData.size = size;
      parsedData.alcohol = alcohol;
      parsedData.price = price;

      console.log('Wine Name:', wineName);

      chrome.storage.local.get(wineName, (data: { [key: string]: FilteredData }) => {
        console.log('Attempting to get from storage:', wineName);
        if (data[wineName]) {
          console.log('Found wine details in local storage:', data[wineName]);
          const now: number = new Date().getTime();
          const storedData: FilteredData = data[wineName];
          const vintage: string = parsedData.vintage || 'all';

          if (storedData.statistics[vintage] && now - storedData.timestamp < expirationTime) {
            console.log('Using cached data:', storedData);
            displayWineDetails(storedData, container as HTMLElement, vintage);
          } else {
            console.log('Fetching new data for:', wineName);
            fetchWineDetails(parsedData, container as HTMLElement );
          }
        } else {
          console.log('No saved wine details found in local storage. Fetching details from API for wine:', wineName);
          fetchWineDetails(parsedData, container as HTMLElement );
        }
      });
    }
  });
} else {
  console.error('Failed to find wine name on the page');
}

function fetchWineDetails(parsedData: AlkoData, container: HTMLElement | null ): void {
  const wineName = parsedData.name;
  console.log('Fetching wine details for:', wineName);
  chrome.runtime.sendMessage({ action: "fetch_rating", parsedData }, (response: { success: boolean; data: FilteredData; error?: string }) => {
    console.log('Message sent for:', parsedData, 'Response:', response);
    if (response.success) {
      const wineDetails: FilteredData = response.data;
      wineDetails.timestamp = new Date().getTime();

      chrome.storage.local.get(wineName, (result: { [key: string]: FilteredData }) => {
        if (result[wineName]) {
          const existingWineDetails: FilteredData = result[wineName];
          const vintage: string = parsedData.vintage || 'all';

          if (vintage && wineDetails.statistics[vintage] && !existingWineDetails.statistics[vintage]) {
            existingWineDetails.statistics[vintage] = wineDetails.statistics[vintage];
          }
          chrome.storage.local.set({ [wineName]: existingWineDetails }, () => {
            console.log('Updated wineDetails with vintage:', existingWineDetails);
            displayWineDetails(existingWineDetails, container, vintage);
          });
        } else {
          chrome.storage.local.set({ [wineName]: wineDetails }, () => {
            const vintage: string = parsedData.vintage || 'all';
            displayWineDetails(wineDetails, container, vintage);
          });
        }
      });
    } else {
      console.error('Error fetching wine details:', response.error);
    }
  });
}

function displayWineDetails(wineDetails: FilteredData, container: HTMLElement | null, vintage: string | null): void {
  const overallRatingElement: HTMLSpanElement = document.createElement('span');
  const vintageRatingElement: HTMLSpanElement = document.createElement('span');
  const vivinoLink: HTMLAnchorElement = document.createElement('a');
  const vintageLink: HTMLAnchorElement = document.createElement('a');
  const ratingElement: HTMLDivElement = document.createElement('div');

  if (vintage) {
    const vintageDetails: any = wineDetails.statistics[vintage] || null;
    console.log('vintageDetails:', vintageDetails);

    if (vintageDetails) {
      vintageRatingElement.textContent = `${vintage}: ${vintageDetails.ratings_average} ★ | ${vintageDetails.ratings_count} ratings`;
      vintageLink.href = `https://www.vivino.com/wines/${vintageDetails.id}`;
      vintageLink.target = "_blank";

      if (wineDetails.statistics) {
        const overallRating: string = `All: ${wineDetails.statistics.all.ratings_average} ★ | ${wineDetails.statistics.all.ratings_count} ratings`;
        overallRatingElement.textContent = overallRating;
        vivinoLink.href = `https://www.vivino.com/wines/${wineDetails.id}`;
        vivinoLink.target = "_blank";
        overallRatingElement.style.display = 'block';
        vivinoLink.appendChild(overallRatingElement);
      }
    } else {
      ratingElement.textContent = 'No vintage rating available';
    }
  } else {
    overallRatingElement.textContent = wineDetails.statistics ? `All: ${wineDetails.statistics.ratings_average} ★ | ${wineDetails.statistics.ratings_count} ratings` : 'No rating available';
    vivinoLink.href = `https://www.vivino.com/wines/${wineDetails.id}`;
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