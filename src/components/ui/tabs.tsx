"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-horizontal:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list no-scrollbar inline-flex w-fit max-w-full items-center justify-start rounded-xl p-1 gap-1 text-slate-600 dark:text-slate-400 group-data-horizontal/tabs:min-h-10 group-data-horizontal/tabs:h-auto group-data-horizontal/tabs:overflow-x-auto group-data-horizontal/tabs:overflow-y-hidden group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none data-[variant=line]:p-0 data-[variant=line]:border-b data-[variant=line]:border-border",
  {
    variants: {
      variant: {
        default:
          "bg-slate-100/95 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs",
        line: "gap-2 bg-transparent border-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-transparent px-3.5 py-1.5 text-xs sm:text-sm font-semibold whitespace-nowrap text-slate-600 dark:text-slate-400 transition-all duration-200 group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-slate-900 hover:bg-white/80 dark:hover:text-white dark:hover:bg-slate-700/60 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-[#2CA01C]/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "data-active:bg-[#2CA01C] data-active:text-white data-active:shadow-sm dark:data-active:bg-[#2CA01C] dark:data-active:text-white [&_svg]:data-active:text-white",
        "group-data-[variant=line]/tabs-list:rounded-none group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:hover:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent group-data-[variant=line]/tabs-list:data-active:text-[#2CA01C] group-data-[variant=line]/tabs-list:data-active:shadow-none",
        "after:absolute after:bg-[#2CA01C] after:opacity-0 after:transition-opacity group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:bottom-[-1px] group-data-horizontal/tabs:after:h-[2.5px] group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-right-1 group-data-vertical/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
