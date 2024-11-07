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
    header: ({ column }) => {
      return (
        <div>
          <input
            type="text"
            placeholder="Category"
            onChange={(e) => column.setFilterValue(e.target.value)}
          />
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
  {
    accessorKey: "alkoName",
    header: ({ column }) => {
      return (
        <div>
          <input
            type="text"
            placeholder="Name"
            onChange={(e) => column.setFilterValue(e.target.value)}
          />
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      );
    },
    cell: ({ row, getValue }) => {
      const isExpanded = row.getIsExpanded();
      const subItemsCount = Object.keys(row.original.vintage).length;
      const canExpand = subItemsCount > 1;

      const alkoName = row.original.alkoName;
      const statistics = row.original.vintage;
      const keys = Object.keys(statistics).filter(key => key !== 'all');
      return (
        <div>
          {canExpand && (isExpanded ? ' ▲' : ' ▼')}
          {alkoName} (
          {keys.map((key, index) => (
            <span key={key}>
              {/* <a href={`https://alko.fi/tuotteet/${statistics[key].alkoId}`} target="_blank" rel="noopener noreferrer">
                {key}
              </a> */}
              {key}
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
    cell: ({ row }) => {
      const ratings = row.original.ratings_average;
      return ratings !== null ? `${ratings} ★` : "No ratings";
    },
  },
  {
    id: "priceRange",
    accessorKey: "vintage[0].size[0].price",
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

      return `${minPrice} - ${maxPrice} €`;
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
    header: ({ column }) => {
      return (
        <div>
          <input
            type="text"
            placeholder="Country"
            onChange={(e) => column.setFilterValue(e.target.value)}
          />
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const regionName = new Intl.DisplayNames(["en"], { type: "region" });
      const countryCode = row.original.region.countryCode.toUpperCase();
      return regionName.of(countryCode);
    },
  },
  {
    accessorKey: "region.name",
    header: ({ column }) => {
      return (
        <div>
          <input
            type="text"
            placeholder="Region"
            onChange={(e) => column.setFilterValue(e.target.value)}
          />
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];