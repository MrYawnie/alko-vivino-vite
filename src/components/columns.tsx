"use client"

import { ColumnDef } from "@tanstack/react-table"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Wine = {
    id: number;
    name: string;
    alkoId: number;
    alkoName: string;
    alcohol: number;
    image: string;
    region: {
      country: string;
      name: string;
      region: string;
    };
    statistics: {
      [key: string]: {
        id?: number;
        ratings_average: number | null;
        ratings_count: number;
      };
    };
    timestamp: number;
}

export const columns: ColumnDef<Wine>[] = [
  {
    accessorKey: "alkoName",
    header: "Name",
  },
  {
    accessorKey: "alcohol",
    header: "Alcohol Content",
  },
  {
    accessorKey: "region.name",
    header: "Region",
  },
  {
    accessorKey: "statistics.all.ratings_average",
    header: "Average Rating",
  },
  {
    accessorKey: "statistics.all.ratings_count",
    header: "Average Count",
  },
]
