"use client"

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

// Define the wine type
export type Wine = {
  id: number;
  name: string;
  alkoName: string;
  category: string;
  alcohol: number;
  ratings_average: number | null;
  ratings_count: number;
  region: {
    countryCode: string;
    name: string;
    region: string;
  };
  vintage: {
    [key: string]: {
      id?: number;
      ratings_average: number | null;
      ratings_count: number;
      size?: {
        [size: number]: {
          price: number;
          alkoId: number;
        };
      };
    };
  };
  timestamp: number;
};

export const columns: ColumnDef<Wine>[] = [
  {
    accessorKey: "category",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Category
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "alkoName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "alcohol",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Alcohol Content
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => `${row.original.alcohol} %`,
  },
  {
    accessorKey: "region.name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Region
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "ratings_average", // Ratings based on vintage
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Ratings Average
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    id: "priceRange",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Price Range
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const prices: number[] = [];
      Object.values(row.original.vintage).forEach(vintageDetail => {
        const sizes = vintageDetail.size;
        if (sizes) {
          Object.values(sizes).forEach(detail => {
            if (typeof detail.price === "number") prices.push(detail.price);
          });
        }
      });
      
      const minPrice = Math.min(...prices) || 0;
      const maxPrice = Math.max(...prices) || 0;

      return `${minPrice} - ${maxPrice}`;
    },
    sortingFn: (rowA, rowB) => {
      const getPriceRange = (row: typeof rowA) => {
        const prices: number[] = [];
        Object.values(row.original.vintage).forEach(vintageDetail => {
          const sizes = vintageDetail.size;
          if (sizes) {
            Object.values(sizes).forEach(detail => {
              if (typeof detail.price === "number") prices.push(detail.price);
            });
          }
        });
        
        const minPrice = Math.min(...prices) || 0;
        return minPrice;
      };

      return getPriceRange(rowA) - getPriceRange(rowB);
    },
  },
  {
    // Country column remains unchanged for base data
    accessorKey: "region.countryCode",
    header: "Country",
    cell: ({ row }) => {
      const regionName = new Intl.DisplayNames(["en"], { type: "region" });
      const countryCode = row.original.region.countryCode.toUpperCase();
      return regionName.of(countryCode);
    },
  },
];