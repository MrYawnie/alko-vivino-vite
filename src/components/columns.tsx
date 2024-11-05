"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react";
import { Button } from "./ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@radix-ui/react-tooltip";
import { TooltipProvider } from "./ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

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
      price: number;
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
        <div>
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
          <input
            type="text"
            placeholder="Filter by name"
            onChange={(e) => column.setFilterValue(e.target.value)}
          />
        </div>
      );
    },
    cell: ({ row, getValue }) => {
      const isExpanded = row.getIsExpanded();
      const subItemsCount = Object.keys(row.original.statistics).length;
      const canExpand = subItemsCount > 1;

      const alkoName = row.original.alkoName;
      const statistics = row.original.statistics;
      const keys = Object.keys(statistics).filter(key => key !== 'all');
      return (
        <div>
          {canExpand && (isExpanded ? ' ▲' : ' ▼')}
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
        <>
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Average Rating and Count
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vintage</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Price</TableHead>
              </TableRow>
            </TableHeader>
          </Table>
        </>
      );
    },
    cell: ({ row }) => {
      const statistics = row.original.statistics;
      return (
        <Table>
          <TableBody>
            {Object.keys(statistics).map((key) => {
              if (key === 'all') return null; // Skip 'all' key
              const { ratings_average, ratings_count, price } = statistics[key];
              const average = ratings_average ? ratings_average.toFixed(1) : "N/A";
              const count = ratings_count || "N/A";
              const priceValue = price || "N/A";
              return (
                <TableRow key={key}>
                  <TableCell>{key}</TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <span>{average} ★</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <span>{count} ratings</span>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>{priceValue}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
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
