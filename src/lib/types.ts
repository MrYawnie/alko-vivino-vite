export interface AlkoData {
  id: number;
  name: string;
  size: number;
  price: number;
  selection: string;
  category: string;
  origin: string;
  supplier: string;
  producer: string;
  alcohol: number;
  packaging: string;
  greenChoice: string;
  ethical: string;
  vintage?: string | null;
}

export interface FilteredData {
  id: number | null;
  name: string | null;
  alkoName: string | null;
  category: string | null;
  alcohol: number | null;
  // image: string | null;
  ratings_average: number | null;
  ratings_count: number | null;
  region: {
    countryCode: string | null;
    name: string | null;
    region: string | null;
  };
  vintage: {
    /* all: {
      ratings_average: number | null;
      ratings_count: number | null;
    }; */
    [vintage: string]: {
      id?: number | null;
      ratings_average: number | null;
      ratings_count: number | null;
      size?: {
        [size: number]: {
          price: number | null;
          alkoId: number | null;
        };
      };
    };
  };
  timestamp: number;
}
