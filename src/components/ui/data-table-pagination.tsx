"use client";

import React from "react";
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DataTablePaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  isLoading?: boolean;
  className?: string;
}

export function DataTablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 50, 100],
  isLoading = false,
  className = "",
}: DataTablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t bg-card/40 ${className}`}
    >
      {/* LEFT: Info & Record Range */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground w-full sm:w-auto justify-between sm:justify-start">
        <span>
          Showing <strong className="text-foreground font-mono">{startItem}</strong>–
          <strong className="text-foreground font-mono">{endItem}</strong> of{" "}
          <strong className="text-foreground font-mono">{total}</strong> records
        </span>
        {isLoading && (
          <span className="text-[11px] text-primary animate-pulse ml-2">Loading...</span>
        )}
      </div>

      {/* RIGHT BOTTOM: Rows Per Page (10, 50, 100) + Page Navigation */}
      <div className="flex items-center gap-4 self-end sm:self-auto flex-wrap">
        {/* Rows Dropdown on Right */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <span>Rows per page:</span>
          <Select
            value={String(pageSize)}
            disabled={isLoading}
            onValueChange={(val) => {
              onPageSizeChange(Number(val));
              onPageChange(1); // Reset to page 1 on page size change
            }}
          >
            <SelectTrigger className="h-7 w-[70px] text-xs font-mono font-medium">
              <SelectValue placeholder={String(pageSize)} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((opt) => (
                <SelectItem key={opt} value={String(opt)} className="text-xs font-mono">
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Page Navigation Controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground mr-1 font-mono">
            Page <strong className="text-foreground">{page}</strong> of{" "}
            <strong className="text-foreground">{totalPages}</strong>
          </span>

          <div className="flex items-center gap-1">
            {/* First Page */}
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => onPageChange(1)}
              disabled={page <= 1 || isLoading}
              title="First Page"
            >
              <IconChevronsLeft className="h-3.5 w-3.5" />
            </Button>

            {/* Previous Page */}
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1 || isLoading}
              title="Previous Page"
            >
              <IconChevronLeft className="h-3.5 w-3.5" />
            </Button>

            {/* Next Page */}
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages || isLoading}
              title="Next Page"
            >
              <IconChevronRight className="h-3.5 w-3.5" />
            </Button>

            {/* Last Page */}
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => onPageChange(totalPages)}
              disabled={page >= totalPages || isLoading}
              title="Last Page"
            >
              <IconChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
