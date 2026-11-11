"use client";

import * as React from "react";
import { IconLanguage, IconCheck } from "@tabler/icons-react";
import { useLanguage, LanguageMode } from "@/context/language-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LanguageToggleProps {
  className?: string;
  variant?: "ghost" | "outline";
  showLabel?: boolean;
}

export function LanguageToggle({
  className = "",
  variant = "ghost",
  showLabel = false,
}: LanguageToggleProps) {
  const { mode, setMode } = useLanguage();

  const getActiveLabel = () => {
    switch (mode) {
      case "english":
        return "English";
      case "urdu":
        return "اردو";
      case "both":
        return "Both";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={showLabel ? "sm" : "icon"}
          className={`h-9 gap-1.5 ${showLabel ? "px-2.5" : "rounded-full"} ${className}`}
          title="Language Display Mode / زبان کا انتخاب"
        >
          <IconLanguage className="size-4 text-muted-foreground hover:text-foreground" />
          {showLabel && (
            <span className="text-xs font-medium font-sans">
              {getActiveLabel()}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
          Display Language / زبان
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => setMode("english")}
          className="flex items-center justify-between text-xs cursor-pointer"
        >
          <span className="font-medium">English</span>
          {mode === "english" && <IconCheck className="size-4 text-primary" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setMode("urdu")}
          className="flex items-center justify-between text-xs cursor-pointer font-sans"
        >
          <span className="font-medium">اردو (Urdu)</span>
          {mode === "urdu" && <IconCheck className="size-4 text-primary" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setMode("both")}
          className="flex items-center justify-between text-xs cursor-pointer"
        >
          <span className="font-medium">Both (English + اردو)</span>
          {mode === "both" && <IconCheck className="size-4 text-primary" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
