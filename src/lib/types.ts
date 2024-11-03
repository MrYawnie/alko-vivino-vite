export interface AlkoData {
    id: string;
    name: string;
    size: string;
    price: string;
    selection: string;
    category: string;
    origin: string;
    supplier: string;
    producer: string;
    alcohol: string;
    packaging: string;
    greenChoice: string;
    ethical: string;
    vintage?: string | null;
  }

  export interface FilteredData {
    id: string | null;
    name: string | null;
    alkoId: string | null;
    alkoName: string | null;
    category: string | null;
    alcohol: string | null;
    price: string | null;
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
        id?: string | null;
        alkoId?: string | null;
        ratings_average: number | null;
        ratings_count: number | null;
        price: number | null;
      };
    };
    timestamp?: number;
  }