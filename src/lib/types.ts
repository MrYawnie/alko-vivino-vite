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
    alkoId: number | null;
    alkoName: string | null;
    category: string | null;
    alcohol: number | null;
    price: number | null;
    image: string | null;
    region: {
      country: string | null;
      countryCode: string | null;
      name: string | null;
      region: string | null;
    };
    statistics: {
      all: {
        ratings_average: number | null;
        ratings_count: number | null;
        price: number | null;
      };
      [key: string]: {
        id?: number | null;
        alkoId?: number | null;
        ratings_average: number | null;
        ratings_count: number | null;
        price: number | null;
      };
    };
    timestamp: number;
  }