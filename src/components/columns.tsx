"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react";
import { Button } from "./ui/button";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Wine = {
  id: number;
  name: string;
  alkoId: number;
  alkoName: string;
  category: string;
  alcohol: number;
  price: string;
  image: string;
  region: {
    country: string;
    name: string;
    region: string;
  };
  statistics: {
    [key: string]: {
      id?: number;
      alkoId?: number;
      ratings_average: number | null;
      ratings_count: number;
    };
  };
  timestamp: number;
}

export const columns: ColumnDef<Wine>[] = [
  {
    accessorKey: "category",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Category
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "alkoName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const alkoName = row.original.alkoName;
      const statistics = row.original.statistics;
      const keys = Object.keys(statistics).filter(key => key !== 'all');
      return (
        <div>
          {alkoName} (
          {keys.map((key, index) => (
            <span key={key}>
              <a href={`https://alko.fi/tuotteet/${statistics[key].alkoId}`} target="_blank" rel="noopener noreferrer">
                {key}
              </a>
              {index < keys.length - 1 && ", "}
            </span>
          ))}
          )
        </div>
      );
    },
  },
  {
    accessorKey: "alcohol",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Alcohol Content
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const alcohol = row.original.alcohol;
      return `${alcohol} %`;
    },
  },
  {
    accessorKey: "region.name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Region
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "statistics.all.ratings_average",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Average Rating and Count
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const statistics = row.original.statistics;
      return (
        <div>
          {Object.keys(statistics).map((key) => {
            const { ratings_average, ratings_count } = statistics[key];
            const average = ratings_average ? ratings_average.toFixed(1) : "N/A";
            const count = ratings_count.toLocaleString();
            return (
              <div key={key}>
                {key}:   {average} ★ | {count} ratings
              </div>
            );
          })}
        </div>
      );
    },
  },
  {
    accessorKey: "price",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Price
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const price = parseFloat(row.original.price);
      return `${price.toFixed(2)} €`;
    },
  },
];
