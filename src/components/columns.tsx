"use client"

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Star } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";

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
    header: ({ column }) => {
      const [minRating, setMinRating] = useState(0);

      const handleRatingClick = (rating: number) => {
        setMinRating(rating);
        column.setFilterValue(rating);
      };

      return (
        <div className="flex flex-col space-y-2">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Ratings Average
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
          <div className="flex space-x-1 mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleRatingClick(star)}
              /* className="text-yellow-500" */
              >
                {star <= minRating ? <Star fill="gold" size={20} /> : <Star size={20} />}
              </button>
            ))}
          </div>
        </div>
      );
    },
    cell: ({ row }) => {
      const ratings = row.original.ratings_average;
      const count = row.original.ratings_count;
      return ratings !== null ? (
        <span className="flex items-center space-x-1">
          <span>{ratings} ★</span>
          <span className="text-xs text-gray-500">({count})</span>
        </span>
      ) : (
        "No ratings"
      );
    },
    filterFn: (row, columnId, filterValue) => {
      const rating = row.original.ratings_average;
      return rating !== null && rating >= filterValue;
    },
  },
  {
    id: "priceRange",
    accessorKey: "vintage[0].size[0].price",
    header: ({ column }) => {
      const [minPrice, setMinPrice] = useState("");
      const [maxPrice, setMaxPrice] = useState("");

      const handleFilterChange = () => {
        column.setFilterValue([minPrice, maxPrice]);
      };

      const handleMinPriceChange = (value: string) => {
        setMinPrice(value);
        column.setFilterValue([value, maxPrice]);
      };

      const handleMaxPriceChange = (value: string) => {
        setMaxPrice(value);
        column.setFilterValue([minPrice, value]);
      };

      return (
        <div className="flex flex-col space-y-2">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Price Range
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => handleMinPriceChange(e.target.value)}
              className="border px-2 py-1 rounded"
            />
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => handleMaxPriceChange(e.target.value)}
              className="border px-2 py-1 rounded"
            />
          </div>
        </div>
      );
    },
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

      return minPrice === maxPrice ? `${minPrice} €` : `${minPrice} - ${maxPrice} €`;
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
    filterFn: (row, columnId, filterValue) => {
      const [min, max] = filterValue;
      const prices: number[] = [];

      // Gather all price points for each vintage and size
      Object.values(row.original.vintage).forEach((vintageDetail) => {
        const sizes = vintageDetail.size;
        if (sizes) {
          Object.values(sizes).forEach((detail) => {
            if (typeof detail.price === "number") prices.push(detail.price);
          });
        }
      });

      // If any price point is within the range, the row should be displayed
      return prices.some(price => {
        const isAboveMin = min ? price >= parseFloat(min) : true;
        const isBelowMax = max ? price <= parseFloat(max) : true;
        return isAboveMin && isBelowMax;
      });
    },
  },
  {
    // Country column remains unchanged for base data
    accessorKey: "region.countryName",
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