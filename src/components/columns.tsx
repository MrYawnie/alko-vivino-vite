"use client"

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Star, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";

// Helper function to get color based on rating
function getRatingColor(rating: number | null): string {
  if (!rating) return 'text-gray-400';
  if (rating >= 4.0) return 'text-green-600';
  if (rating >= 3.5) return 'text-lime-600';
  if (rating >= 3.0) return 'text-yellow-600';
  if (rating >= 2.5) return 'text-orange-600';
  return 'text-red-600';
}

function getRatingBgColor(rating: number | null): string {
  if (!rating) return 'bg-gray-100';
  if (rating >= 4.0) return 'bg-green-100';
  if (rating >= 3.5) return 'bg-lime-100';
  if (rating >= 3.0) return 'bg-yellow-100';
  if (rating >= 2.5) return 'bg-orange-100';
  return 'bg-red-100';
}

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

// Helper function to extract all prices from a wine's vintage data
function extractPrices(wine: Wine): number[] {
  const prices: number[] = [];
  Object.values(wine.vintage).forEach(vintageDetail => {
    const sizes = vintageDetail.size;
    if (sizes) {
      Object.values(sizes).forEach(detail => {
        if (typeof detail.price === "number") {
          prices.push(detail.price);
        }
      });
    }
  });
  return prices;
}

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
    cell: ({ row }) => {
      const isExpanded = row.getIsExpanded();
      const subItemsCount = Object.keys(row.original.vintage).length;
      const canExpand = subItemsCount > 1;

      const alkoName = row.original.alkoName;
      const statistics = row.original.vintage;
      const vintageKeys = Object.keys(statistics).filter(key => key !== 'all');

      // Get Alko ID from the first available vintage
      const firstVintage = Object.values(statistics)[0];
      const alkoId = firstVintage?.size
        ? Object.values(firstVintage.size)[0]?.alkoId
        : null;

      return (
        <div className="flex items-center gap-2">
          {canExpand && (
            <span className="text-gray-400 text-sm">
              {isExpanded ? '▲' : '▼'}
            </span>
          )}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{alkoName}</span>
              {alkoId && (
                <a
                  href={`https://www.alko.fi/fi/tuotteet/${alkoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-blue-600 hover:text-blue-800"
                  title="View on Alko.fi"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
            <span className="text-xs text-gray-500">
              Vintages: {vintageKeys.join(', ')}
            </span>
          </div>
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
      const vivinoId = row.original.id;

      if (ratings === null) {
        return <span className="text-gray-400 text-sm italic">No ratings</span>;
      }

      const colorClass = getRatingColor(ratings);
      const bgColorClass = getRatingBgColor(ratings);

      return (
        <a
          href={`https://www.vivino.com/wines/${vivinoId}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity w-fit"
          title="View on Vivino"
        >
          <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${bgColorClass}`}>
            <Star className={`w-4 h-4 ${colorClass} fill-current`} />
            <span className={`font-semibold ${colorClass}`}>{ratings.toFixed(1)}</span>
          </div>
          <span className="text-xs text-gray-500">({count.toLocaleString()})</span>
          <ExternalLink className="w-3 h-3 text-gray-400" />
        </a>
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
      const prices = extractPrices(row.original);
      const minPrice = Math.min(...prices) || 0;
      const maxPrice = Math.max(...prices) || 0;

      return minPrice === maxPrice ? `${minPrice} €` : `${minPrice} - ${maxPrice} €`;
    },
    sortingFn: (rowA, rowB) => {
      const getPriceRange = (row: typeof rowA) => {
        const prices = extractPrices(row.original);
        return Math.min(...prices) || 0;
      };

      return getPriceRange(rowA) - getPriceRange(rowB);
    },
    filterFn: (row, columnId, filterValue) => {
      const [min, max] = filterValue;
      const prices = extractPrices(row.original);

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