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
  const wineNameVintage: string = wineNameContainer.textContent || '';
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
        fetchWineDetails(wineName, null, null, vintage);
      }
    } else {
      console.log('No saved wine details found in local storage. Fetching details from API for wine:', wineName);
      fetchWineDetails(wineName, null, null, vintage);
    }
  });

} else if (productContainers.length > 0) {
  productContainers.forEach((container: Element) => {
    console.log('Product Data Container:', container);
    const productData: string | null = container.getAttribute('data-product-data');
    if (productData) {
      console.log('Product Data:', productData);
      const parsedData: { name: string; id: string } = JSON.parse(productData);
      const wineNameVintage: string = parsedData.name;
      const lastWord: string = wineNameVintage.split(' ').pop() || '';
      const hasYear: RegExpMatchArray | null = lastWord.match(/(20\d{2}|19\d{2})/);
      const wineName: string = hasYear ? wineNameVintage.replace(lastWord, '').trim() : wineNameVintage;
      const vintage: string | null = hasYear ? lastWord : null;
      const alkoId: number = parseInt(parsedData.id, 10);
      console.log('Wine Name:', wineName);

      chrome.storage.local.get(wineName, (data: { [key: string]: any }) => {
        console.log('Attempting to get from storage:', wineName);
        if (data[wineName]) {
          console.log('Found wine details in local storage:', data[wineName]);
          const now: number = new Date().getTime();
          const storedData: any = data[wineName];
          if (storedData && now - storedData.timestamp < expirationTime) {
            console.log('Using cached data:', storedData);
            displayWineDetails(storedData, container as HTMLElement, vintage);
          } else {
            console.log('Fetching new data for:', wineName);
            fetchWineDetails(wineName, alkoId, container as HTMLElement, vintage);
          }
        } else {
          console.log('No saved wine details found in local storage. Fetching details from API for wine:', wineName);
          fetchWineDetails(wineName, alkoId, container as HTMLElement, vintage);
        }
      });
    }
  });
} else {
  console.error('Failed to find wine name on the page');
}

function fetchWineDetails(wineName: string, alkoId: number | null, container: HTMLElement | null, vintage: string | null): void {
  console.log('Fetching wine details for:', wineName);
  chrome.runtime.sendMessage({ action: "fetch_rating", wineName, alkoId, vintage }, (response: { success: boolean; data: any; error?: string }) => {
    console.log('Message sent for:', wineName, 'Response:', response);
    if (response.success) {
      const wineDetails: any = response.data;
      wineDetails.timestamp = new Date().getTime();

      chrome.storage.local.get(wineName, (result: { [key: string]: any }) => {
        if (result[wineName]) {
          const existingWineDetails: any = result[wineName];
          if (vintage && wineDetails.statistics[vintage] && !existingWineDetails.statistics[vintage]) {
            existingWineDetails.statistics[vintage] = wineDetails.statistics[vintage];
          }
          chrome.storage.local.set({ [wineName]: existingWineDetails }, () => {
            console.log('Updated wineDetails with vintage:', existingWineDetails);
            displayWineDetails(existingWineDetails, container, vintage);
          });
        } else {
          chrome.storage.local.set({ [wineName]: wineDetails }, () => {
            displayWineDetails(wineDetails, container, vintage);
          });
        }
      });
    } else {
      console.error('Error fetching wine details:', response.error);
    }
  });
}

function displayWineDetails(wineDetails: any, container: HTMLElement | null, vintage: string | null): void {
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