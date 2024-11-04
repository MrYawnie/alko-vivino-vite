import { AlkoData, FilteredData } from '@src/lib/types';

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
  console.log('request:', request);
  if (request.action === "fetch_rating") {
    const wineName: string = request.parsedData.name;
    const alkoId: number | null = request.parsedData.id;
    const alcohol: number = request.parsedData.alcohol;
    const vintage: string = request.parsedData.vintage ?? '';
    const origin: string = request.parsedData.origin;
    const category: string = request.parsedData.category;
    const price: number = request.parsedData.price;

    console.log('wineName:', wineName);

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
        console.log('data:', data);
        if (data.hits && data.hits.length > 0) {

          const statistics: any = {
            all: {
              alkoId: alkoId || null,
              ratings_average: data.hits[0].statistics?.ratings_average || null,
              ratings_count: data.hits[0].statistics?.ratings_count || null,
              price: price,
            },
          };
        
          if (vintage) {
            statistics[vintage] = {
              id: data.hits[0].vintages?.filter((v: any) => v.year === vintage)[0]?.id || null,
              alkoId: alkoId || null,
              ratings_average: data.hits[0].vintages?.filter((v: any) => v.year === vintage)[0]?.statistics?.ratings_average || null,
              ratings_count: data.hits[0].vintages?.filter((v: any) => v.year === vintage)[0]?.statistics?.ratings_count || null,
              price: price,
            };
          }

          const filteredData: FilteredData = {
            id: data.hits[0].vintages[0].id || null,
            name: data.hits[0].name || null,
            alkoId: alkoId || null,
            alkoName: wineName,
            category: category || null,
            alcohol: alcohol || null,
            price: price || null,
            image: data.hits[0].image.location ? data.hits[0].image.location.replace(/^\/\//, 'https://') : null,
            region: {
              country: origin || null,
              countryCode: data.hits[0].region?.country || data.hits[0].winery?.region.country || null,
              name: data.hits[0].region?.name || data.hits[0].winery?.region.name || null,
              region: data.hits[0].winery?.region.name || null,
            },
            statistics: statistics,
          };

          console.log('filteredData:', filteredData);

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