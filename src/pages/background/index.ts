interface WineRequest {
  action: string;
  wineName: string;
  alkoId: string | null;
  vintage: string;
}

interface WineResponse {
  success: boolean;
  data?: FilteredData;
  error?: string;
}

interface FilteredData {
  id: string | null;
  name: string | null;
  alkoId: string | null;
  alkoName: string | null;
  alcohol: number | null;
  image: string | null;
  region: {
    country: string | null;
    name: string | null;
    region: string | null;
  };
  statistics: {
    all: {
      ratings_average: number | null;
      ratings_count: number | null;
    };
    [key: string]: {
      id?: string | null;
      ratings_average: number | null;
      ratings_count: number | null;
    };
  };
}

console.log('Background script running...');

chrome.runtime.onMessage.addListener((request: WineRequest, sender: chrome.runtime.MessageSender, sendResponse: (response: WineResponse) => void) => {
  if (request.action === "fetch_rating") {
    const wineName: string = request.wineName;
    const alkoId: string | null = request.alkoId;
    const vintage: string = request.vintage;

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
          const filteredData: FilteredData = {
            id: data.hits[0].vintages[0].id || null,
            name: data.hits[0].name || null,
            alkoId: alkoId || null,
            alkoName: wineName,
            alcohol: data.hits[0].alcohol || null,
            image: data.hits[0].image.location ? data.hits[0].image.location.replace(/^\/\//, 'https://') : null,
            region: {
              country: data.hits[0].region?.country || data.hits[0].winery?.region.country || null,
              name: data.hits[0].region?.name || data.hits[0].winery?.region.name || null,
              region: data.hits[0].winery?.region.name || null,
            },
            statistics: {
              all: {
                ratings_average: data.hits[0].statistics?.ratings_average || null,
                ratings_count: data.hits[0].statistics?.ratings_count || null,
              },
              [vintage]: {
                id: data.hits[0].vintages?.filter((v: any) => v.year === vintage)[0]?.id || null,
                ratings_average: data.hits[0].vintages?.filter((v: any) => v.year === vintage)[0]?.statistics?.ratings_average || null,
                ratings_count: data.hits[0].vintages?.filter((v: any) => v.year === vintage)[0]?.statistics?.ratings_count || null,
              },
            }
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