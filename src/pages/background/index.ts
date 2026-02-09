import { AlkoData, FilteredData } from '@src/lib/types';
import { compareNames } from '@src/lib/utils';

interface WineRequest {
  action: string;
  parsedData: AlkoData;
}

interface WineResponse {
  success: boolean;
  data?: FilteredData;
  error?: string;
}

// TypeScript interfaces for Vivino API response
interface VivinoVintage {
  id: number;
  year: string;
  statistics?: {
    ratings_average: number;
    ratings_count: number;
  };
}

interface VivinoWinery {
  name: string;
  region: {
    country: string;
    name: string;
  };
}

interface VivinoWine {
  name: string;
  vintages: VivinoVintage[];
  statistics?: {
    ratings_average: number;
    ratings_count: number;
  };
  winery?: VivinoWinery;
  region?: {
    country: string;
    name: string;
  };
}

interface VivinoApiResponse {
  hits: VivinoWine[];
}

// Producer/winery exceptions for matching
const PRODUCER_EXCEPTIONS = ['Hartwall Oy', 'Winepartners Nordic', 'IWB'];
const WINERY_EXCEPTIONS = ['Bixio'];

console.log('Background script running...');

chrome.runtime.onMessage.addListener((request: WineRequest, sender: chrome.runtime.MessageSender, sendResponse: (response: WineResponse) => void) => {
  // console.log('request:', request);
  if (request.action === "fetch_rating") {
    const wineName: string = request.parsedData.name;
    const alkoId: number | null = request.parsedData.id;
    const alcohol: number = request.parsedData.alcohol;
    const vintage: string = request.parsedData.vintage ?? '';
    const origin: string = request.parsedData.origin;
    const category: string = request.parsedData.category;
    const price: number = request.parsedData.price;
    const size: number = request.parsedData.size;
    const producer: string = request.parsedData.producer;

    // console.log('wineName:', wineName);

    const options: RequestInit = {
      method: 'POST',
      headers: {
        Accept: '*/*',
        'Content-Type': 'application/json',
        'x-algolia-api-key': '60c11b2f1068885161d95ca068d3a6ae',
        'x-algolia-application-id': '9TAKGWJUXL',
      },
      body: JSON.stringify({ query: wineName, hitsPerPage: 1 })
    };

    fetch(
      'https://9takgwjuxl-dsn.algolia.net/1/indexes/WINES_prod/query?x-algolia-agent=Algolia%20for%20JavaScript%20(4.14.2)%3B%20Browser',
      options
    )
      .then((response: Response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data: VivinoApiResponse) => {
        // console.log('data:', data.hits);
        if (data.hits && data.hits.length > 0) {
          const wine = data.hits[0];
          let ratings_average: number | null = null;
          let ratings_count: number | null = null;
          let vintage_ratings_average: number | null = null;
          let vintage_ratings_count: number | null = null;
          let vintageId: number | null = null;

          // Validate producer match if available, otherwise trust the wine name search
          let isProducerMatch = !producer || producer.trim() === ''; // If no producer, accept match

          if (producer && producer.trim() !== '' && wine.winery) {
            const winery: string = wine.winery.name;
            const distance = compareNames(producer, winery);
            console.log('Alko:', producer, 'Vivino:', winery, 'Distance:', distance);

            // Check if producer/winery matches using distance threshold or exceptions
            isProducerMatch = distance < 5 ||
                             PRODUCER_EXCEPTIONS.includes(producer) ||
                             WINERY_EXCEPTIONS.includes(winery);
          }

          if (isProducerMatch) {
            ratings_average = wine.statistics?.ratings_average || null;
            ratings_count = wine.statistics?.ratings_count || null;

            // Find vintage data once instead of filtering multiple times
            const vintageData = wine.vintages?.find((v) => v.year === vintage);
            if (vintageData) {
              vintage_ratings_average = vintageData.statistics?.ratings_average || null;
              vintage_ratings_count = vintageData.statistics?.ratings_count || null;
              vintageId = vintageData.id;
            }
          }

          const statistics: FilteredData['vintage'] = {
            [vintage]: {
              id: vintageId,
              ratings_average: vintage_ratings_average,
              ratings_count: vintage_ratings_count || 0,
              size: {
                [size]: {
                  price: price,
                  alkoId: alkoId,
                },
              },
            },
          };

          const filteredData: FilteredData = {
            id: wine.vintages[0]?.id || null,
            name: wine.name || null,
            alkoName: wineName,
            category: category || null,
            alcohol: alcohol || null,
            ratings_average: ratings_average,
            ratings_count: ratings_count || 0,
            // image: wine.image.location ? wine.image.location.replace(/^\/\//, 'https://') : null,
            region: {
              countryName: origin || wine.winery?.region.country || null,
              countryCode: wine.region?.country || wine.winery?.region.country || null,
              name: wine.region?.name || wine.winery?.region.name || null,
              region: wine.winery?.region.name || null,
            },
            vintage: statistics,
            timestamp: new Date().getTime(),
          };

          // console.log('filteredData:', filteredData);

          sendResponse({
            success: true,
            data: filteredData,
          });
        } else {
          sendResponse({ success: false, error: "No wine found with the given name" });
        }
      })
      .catch((error: Error) => {
        console.error(error);
        console.log('Error message:', error.message);
        sendResponse({ success: false, error: error.message });
      });

    return true;
  }
});