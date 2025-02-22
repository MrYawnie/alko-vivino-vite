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
      body: JSON.stringify({ query: wineName, hitsPerPage: 6 })
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
      .then((data: any) => {
        // console.log('data:', data.hits);
        if (data.hits && data.hits.length > 0) {
          let ratings_average = null;
          let ratings_count = null;
          let vintage_ratings_average = null;
          let vintage_ratings_count = null;

          if (data.hits[0].winery) {
            const winery: string = data.hits[0].winery.name;
            const distance = compareNames(producer, winery);
            console.log('Alko:', producer, 'Vivino:', winery, 'Distance:', distance);
            if (distance < 5 || producer === 'Hartwall Oy' || producer === 'Winepartners Nordic' || producer === 'IWB' || winery === 'Bixio') {
              ratings_average = data.hits[0].statistics?.ratings_average;
              ratings_count = data.hits[0].statistics?.ratings_count;
              vintage_ratings_average = data.hits[0].vintages?.filter((v: any) => v.year === vintage)[0]?.statistics?.ratings_average || null;
              vintage_ratings_count = data.hits[0].vintages?.filter((v: any) => v.year === vintage)[0]?.statistics?.ratings_count || null;
            }
          }

          const statistics: any = {
            [vintage]: {
              id: data.hits[0].vintages?.filter((v: any) => v.year === vintage)[0]?.id || null,
              ratings_average: vintage_ratings_average || null,
              ratings_count: vintage_ratings_count || null,
              size: {
                [size]: {
                  price: price,
                  alkoId: alkoId || null,
                },
              },
            },            
          };

          const filteredData: FilteredData = {
            id: data.hits[0].vintages[0].id || null,
            name: data.hits[0].name || null,
            alkoName: wineName,
            category: category || null,
            alcohol: alcohol || null,
            ratings_average: ratings_average || null,
            ratings_count: ratings_count || null,
            // image: data.hits[0].image.location ? data.hits[0].image.location.replace(/^\/\//, 'https://') : null,
            region: {
              countryName: origin || data.hits[0].winery?.region.country || null,
              countryCode: data.hits[0].region?.country || data.hits[0].winery?.region.country || null,
              name: data.hits[0].region?.name || data.hits[0].winery?.region.name || null,
              region: data.hits[0].winery?.region.name || null,
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