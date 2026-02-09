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
  getPaginationRowModel,
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

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, X } from "lucide-react"

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
  globalFilter?: string;
  setGlobalFilter?: (value: string) => void;
}

export function DataTable<TValue>({
  columns,
  data,
  globalFilter,
  setGlobalFilter,
}: DataTableProps<TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 25,
  });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue) => {
      const search = filterValue.toLowerCase();
      const wine = row.original;

      return (
        wine.alkoName?.toLowerCase().includes(search) ||
        wine.name?.toLowerCase().includes(search) ||
        wine.category?.toLowerCase().includes(search) ||
        wine.region?.countryName?.toLowerCase().includes(search) ||
        wine.region?.name?.toLowerCase().includes(search) ||
        String(wine.ratings_average).includes(search)
      );
    },
    getExpandedRowModel: getExpandedRowModel(),
  });

  const clearAllFilters = () => {
    table.resetColumnFilters();
    setGlobalFilter?.('');
  };

  const hasActiveFilters = columnFilters.length > 0 || (globalFilter && globalFilter.length > 0);

  return (
    <div className="space-y-4 p-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search wines..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter?.(e.target.value)}
            className="pl-10"
          />
        </div>
        {hasActiveFilters && (
          <Button onClick={clearAllFilters} variant="outline" className="flex items-center gap-2">
            <X className="w-4 h-4" />
            Clear All Filters
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50 sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="font-semibold">
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
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <p className="text-lg font-medium">No wines found</p>
                      <p className="text-sm">Try adjusting your filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row, index) => (
                  <React.Fragment key={row.id}>
                    <TableRow
                      onClick={() => row.toggleExpanded()}
                      className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                      }`}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                    {row.getIsExpanded() && Object.entries(row.original.vintage).map(([year, vintageDetail]) => (
                      <React.Fragment key={year}>
                        <TableRow className="bg-blue-50">
                          <TableCell colSpan={columns.length} className="p-0">
                            <div className="p-4">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="font-semibold">Year</TableHead>
                                    <TableHead className="font-semibold">Vintage Rating</TableHead>
                                    <TableHead className="font-semibold">Size</TableHead>
                                    <TableHead className="font-semibold">Price</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {vintageDetail.size && Object.entries(vintageDetail.size).map(([size, detail]) => {
                                    if (!detail) return null;

                                    const parsedSize = `${size} l`;
                                    const price = detail.price ? `${detail.price} €` : "N/A";
                                    const pricePerLiter = detail.price ? `${(detail.price / parseFloat(size)).toFixed(2)} €/l` : "N/A";

                                    return (
                                      <TableRow key={`${year}-${parsedSize}`} className="bg-white hover:bg-gray-50">
                                        <TableCell className="font-medium">{year}</TableCell>
                                        <TableCell>
                                          {vintageDetail.ratings_average?.toFixed(1) || "N/A"} ★
                                          <span className="text-xs text-slate-500"> ({vintageDetail.ratings_count})</span>
                                        </TableCell>
                                        <TableCell>{parsedSize}</TableCell>
                                        <TableCell>
                                          <div className="flex flex-col">
                                            <span className="font-medium">{price}</span>
                                            <span className="text-xs text-gray-500">{pricePerLiter}</span>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <span>Rows per page:</span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="border rounded px-2 py-1 bg-white"
          >
            {[10, 25, 50, 100].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}