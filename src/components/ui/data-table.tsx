"use client";

import React from "react";
import {
  IconSearch,
  IconInbox,
  IconX,
} from "@tabler/icons-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataTablePagination } from "@/components/ui/data-table-pagination";

export interface DataTableColumn<T> {
  header: React.ReactNode;
  accessorKey?: keyof T;
  cell?: (item: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface DataTablePaginationConfig {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  keyExtractor: (item: T, index: number) => string | number;

  // Loading States
  initialLoading?: boolean;
  isFetching?: boolean;

  // Search & Filters (Left side of toolbar)
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  filterControls?: React.ReactNode;

  // Actions & Counters (Right side of toolbar)
  actions?: React.ReactNode;
  recordLabel?: string;
  totalRecords?: number;

  // Server-side Pagination
  pagination?: DataTablePaginationConfig;

  // Empty State
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  onClearFilters?: () => void;

  // Row Interactions
  onRowClick?: (item: T) => void;
  rowClassName?: (item: T, index: number) => string;

  // Container styling
  className?: string;
  tableClassName?: string;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  initialLoading = false,
  isFetching = false,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  filterControls,
  actions,
  recordLabel = "Records",
  totalRecords,
  pagination,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  onClearFilters,
  onRowClick,
  rowClassName,
  className = "",
  tableClassName = "",
}: DataTableProps<T>) {
  const displayTotal = totalRecords !== undefined ? totalRecords : data.length;

  return (
    <div className={`rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden ${className}`}>
      {/* 1. FILTER & ACTION TOOLBAR (Integrated directly in Table Card) */}
      {(onSearchChange !== undefined || filterControls || actions || totalRecords !== undefined) && (
        <div className="p-4 border-b flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card/60">
          {/* LEFT: Search input + Filter Dropdowns */}
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            {onSearchChange !== undefined && (
              <div className="relative w-72 md:w-80">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={searchValue ?? ""}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="pl-9 pr-8 h-9 text-xs"
                />
                {searchValue && (
                  <button
                    type="button"
                    onClick={() => onSearchChange("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    title="Clear search"
                  >
                    <IconX className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
            {filterControls}
          </div>

          {/* RIGHT: Record Count & Actions */}
          <div className="flex items-center gap-3 justify-end shrink-0">
            <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
              {displayTotal} {recordLabel} Found
            </span>
            {actions}
          </div>
        </div>
      )}


      {/* 3. TABLE BODY */}
      <div className="overflow-x-auto">
        <Table className={tableClassName}>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              {columns.map((col, idx) => (
                <TableHead
                  key={idx}
                  className={`text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 ${
                    col.headerClassName || col.className || ""
                  }`}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody
            className={`transition-opacity duration-150 ${
              isFetching ? "opacity-60 pointer-events-none" : "opacity-100"
            }`}
          >
            {initialLoading ? (
              // Loading Skeleton Rows
              Array.from({ length: 6 }).map((_, rIdx) => (
                <TableRow key={`skeleton-${rIdx}`}>
                  {columns.map((_, cIdx) => (
                    <TableCell key={`skel-cell-${cIdx}`} className="py-4">
                      <div className="h-4 bg-muted/60 animate-pulse rounded w-3/4" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              // Empty State
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-16 text-center"
                >
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center space-y-3">
                    <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground">
                      {emptyIcon || <IconInbox className="h-6 w-6" />}
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-base text-foreground">
                        {emptyTitle || `No ${recordLabel} Found`}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {emptyDescription ||
                          `No ${recordLabel.toLowerCase()} match your active search filters. Try clearing your filters.`}
                      </p>
                    </div>
                    {onClearFilters && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onClearFilters}
                        className="h-8 text-xs mt-2"
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              // Active Data Rows
              data.map((item, index) => {
                const rowKey = keyExtractor(item, index);
                const extraClass = rowClassName ? rowClassName(item, index) : "";
                return (
                  <TableRow
                    key={rowKey}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={`${onRowClick ? "cursor-pointer" : ""} ${extraClass}`}
                  >
                    {columns.map((col, colIdx) => {
                      const cellContent = col.cell
                        ? col.cell(item, index)
                        : col.accessorKey
                        ? String((item as any)[col.accessorKey] ?? "")
                        : null;

                      return (
                        <TableCell
                          key={colIdx}
                          className={`text-xs py-3 ${col.className || ""}`}
                        >
                          {cellContent}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* 4. SERVER PAGINATION FOOTER */}
      {pagination && (
        <DataTablePagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onPageChange={pagination.onPageChange}
          onPageSizeChange={pagination.onPageSizeChange}
          pageSizeOptions={pagination.pageSizeOptions || [10, 50, 100]}
          isLoading={isFetching || initialLoading}
        />
      )}
    </div>
  );
}
