"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconPlus,
  IconReceipt2,
  IconFileInvoice,
  IconUserPlus,
  IconPackages,
  IconArrowBackUp,
  IconTruckDelivery,
  IconBuildingBank,
  IconFileSpreadsheet,
  IconCash,
  IconBox,
  IconBuildingStore,
  IconCreditCard,
  IconHierarchy,
  IconHistory,
  IconCalculator,
} from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface QuickActionItem {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ACTION_GROUPS: { category: string; color: string; items: QuickActionItem[] }[] = [
  {
    category: "Customers & Sales",
    color: "text-[#2CA01C]",
    items: [
      {
        title: "POS Counter Sale",
        description: "Open fast retail terminal",
        href: "/pos",
        icon: IconReceipt2,
      },
      {
        title: "New Sales Invoice",
        description: "Create B2B or wholesale bill",
        href: "/invoices/new",
        icon: IconFileInvoice,
      },
      {
        title: "Add Customer",
        description: "Register new party khata",
        href: "/customers/new",
        icon: IconUserPlus,
      },
      {
        title: "Customer Khata & Aging",
        description: "Review outstanding receivables",
        href: "/accounting/aging",
        icon: IconHistory,
      },
    ],
  },
  {
    category: "Suppliers & Purchases",
    color: "text-blue-600 dark:text-blue-400",
    items: [
      {
        title: "New Purchase Bill (GRN)",
        description: "Receive stock into godown",
        href: "/purchases",
        icon: IconPackages,
      },
      {
        title: "Purchase Return",
        description: "Issue vendor debit note",
        href: "/purchase-returns",
        icon: IconArrowBackUp,
      },
      {
        title: "Add Supplier",
        description: "Create vendor account",
        href: "/suppliers",
        icon: IconTruckDelivery,
      },
      {
        title: "Live Inventory",
        description: "Check stock & adjust counts",
        href: "/inventory",
        icon: IconBox,
      },
    ],
  },
  {
    category: "Cash & Accounting",
    color: "text-amber-600 dark:text-amber-400",
    items: [
      {
        title: "Record Expense (CPV)",
        description: "Log petty cash, rent, fuel",
        href: "/accounting/expenses",
        icon: IconCash,
      },
      {
        title: "New Journal Voucher (JV)",
        description: "Post double-entry journal",
        href: "/accounting/journal",
        icon: IconFileSpreadsheet,
      },
      {
        title: "Daily Cash Register",
        description: "View today's Roznamcha",
        href: "/daybook",
        icon: IconCalculator,
      },
      {
        title: "Bank Reconciliation",
        description: "Match statement transactions",
        href: "/accounting/reconciliation",
        icon: IconBuildingBank,
      },
    ],
  },
  {
    category: "Organization Setup",
    color: "text-indigo-600 dark:text-indigo-400",
    items: [
      {
        title: "Add Product",
        description: "Catalogue item & barcode",
        href: "/products/new",
        icon: IconBox,
      },
      {
        title: "Shops & Warehouses",
        description: "Configure branch locations",
        href: "/branches",
        icon: IconBuildingStore,
      },
      {
        title: "Payment Statuses",
        description: "Manage payment rules",
        href: "/payment-statuses",
        icon: IconCreditCard,
      },
      {
        title: "Chart of Accounts",
        description: "View standard COA tree",
        href: "/accounting/accounts",
        icon: IconHierarchy,
      },
    ],
  },
];

export function QuickCreateMenu({
  variant = "sidebar",
}: {
  variant?: "sidebar" | "navbar";
}) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  const handleNavigate = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {variant === "sidebar" ? (
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 rounded-full bg-[#2CA01C] hover:bg-[#248417] text-white py-2 px-3 text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <div className="size-4 rounded-full bg-white/20 flex items-center justify-center">
              <IconPlus className="size-3" strokeWidth={3} />
            </div>
            <span>+ New</span>
          </button>
        ) : (
          <Button
            size="sm"
            className="h-8 gap-1.5 rounded-full bg-[#2CA01C] hover:bg-[#248417] text-white font-bold text-xs shadow-xs px-3"
          >
            <IconPlus className="size-3.5" strokeWidth={3} />
            <span>New</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[760px] max-h-[85vh] overflow-y-auto p-6">
        <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-[#2CA01C] text-white flex items-center justify-center font-bold">
              <IconPlus className="size-4" strokeWidth={3} />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
                Quick Action Menu
              </DialogTitle>
              <p className="text-xs text-slate-500">
                Instantly create transactions, entries, or records across Paperless ERP
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 pt-3">
          {ACTION_GROUPS.map((group) => (
            <div key={group.category} className="space-y-3">
              <span className={`text-[11px] font-bold uppercase tracking-wider block ${group.color}`}>
                {group.category}
              </span>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.title}>
                      <button
                        type="button"
                        onClick={() => handleNavigate(item.href)}
                        className="w-full text-left p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group cursor-pointer block"
                      >
                        <div className="flex items-start gap-2">
                          <Icon className="size-4 shrink-0 text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white mt-0.5" />
                          <div>
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-[#2CA01C] block leading-tight">
                              {item.title}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5 leading-snug">
                              {item.description}
                            </span>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

