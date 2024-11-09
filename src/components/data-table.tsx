"use client"
import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@radix-ui/react-tooltip"

// Define the wine type
interface Wine {
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
}

interface DataTableProps<TValue> {
  columns: ColumnDef<Wine, TValue>[];
  data: Wine[];
}

export function DataTable<TValue>({
  columns,
  data,
}: DataTableProps<TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
    getExpandedRowModel: getExpandedRowModel(),

  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <React.Fragment key={row.id}>
              <TableRow
                onClick={() => row.toggleExpanded()}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
              {row.getIsExpanded() && Object.entries(row.original.vintage).map(([year, vintageDetail]) => (
                <React.Fragment key={year}>
                  <TableRow>
                    <TableCell colSpan={columns.length}>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Year</TableHead>
                            <TableHead>Vintage Rating</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Price</TableHead>
                            {/* <TableHead>Alko ID</TableHead> */}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {vintageDetail.size && Object.entries(vintageDetail.size).map(([size, detail]) => {
                            if (!detail) return null; // If the detail is undefined, skip it

                            const parsedSize = `${size} l`;
                            const price = detail.price ? `${detail.price} €` : "N/A"; // Default to "N/A" if undefined
                            const alkoId = detail.alkoId ?? "N/A";
                            const pricePerLiter = detail.price ? `${(detail.price / parseFloat(size)).toFixed(2)} €/l` : "N/A";

                            return (
                              <TableRow key={`${year}-${parsedSize}`}>
                              <TableCell>{year}</TableCell>
                              <TableCell>
                                {vintageDetail.ratings_average?.toFixed(1) || "N/A"} ★ 
                                <span className="text-xs text-slate-500"> ({vintageDetail.ratings_count})</span>
                              </TableCell>
                              <TableCell>{parsedSize}</TableCell>
                              <TableCell>{price} ({pricePerLiter})</TableCell>
                              {/* <TableCell>{alkoId}</TableCell> */}
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}