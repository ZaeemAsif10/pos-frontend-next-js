"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  IconSearch,
  IconPlus,
  IconDotsVertical,
  IconPrinter,
  IconEye,
  IconShieldCheck,
  IconFileInvoice,
  IconRefresh,
  IconDeviceDesktopAnalytics,
  IconAlertCircle,
  IconBuildingStore,
  IconReceiptTax,
  IconArrowBackUp,
} from "@tabler/icons-react";

import { useAuth } from "@/context/auth-context";
import { ThermalReceiptModal } from "@/components/pos/thermal-receipt";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { salesService, type SalesInvoiceDetail, type SalesSummaryStats } from "@/services/sales.service";
import { useAppEventListener } from "@/lib/events";
import { cn } from "@/lib/utils";

function SummaryTile({ label, value, subtext }: { label: string; value: string; subtext?: string }) {
  return (
    <Card>
      <CardContent className="p-4 space-y-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
          {value}
        </p>
        {subtext && <p className="text-[11px] text-muted-foreground">{subtext}</p>}
      </CardContent>
    </Card>
  );
}

export default function InvoicesPage() {
  const { tenant } = useAuth();
  const [invoices, setInvoices] = useState<SalesInvoiceDetail[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<SalesSummaryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("All");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Receipt Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoiceDetail | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Refund Modal State
  const [refundTarget, setRefundTarget] = useState<SalesInvoiceDetail | null>(null);
  const [refundReason, setRefundReason] = useState("Customer Return / Refund");
  const [isRefunding, setIsRefunding] = useState(false);

  const loadInvoices = useCallback(
    async (isInitial = false) => {
      if (isInitial) {
        setInitialLoading(true);
      } else {
        setIsFetching(true);
      }
      try {
        let fbr_status: string | undefined = undefined;
        let payment_status: string | undefined = undefined;
        let status: string | undefined = undefined;

        if (activeTab === "Paid") payment_status = "paid";
        else if (activeTab === "Unpaid") payment_status = "unpaid";
        else if (activeTab === "Partial") payment_status = "partial";
        else if (activeTab === "FBR Synced") fbr_status = "synced";
        else if (activeTab === "Refunded") status = "refunded";

        const res = await salesService.listInvoices({
          page,
          size: pageSize,
          search: searchQuery.trim() || undefined,
          fbr_status,
          payment_status,
          status,
        });

        setInvoices(res.items);
        setTotal(res.total);
      } catch (err: any) {
        toast.error("Failed to load sales invoices: " + (err.message || err));
      } finally {
        setInitialLoading(false);
        setIsFetching(false);
        setIsLoading(false);
      }
    },
    [page, pageSize, searchQuery, activeTab]
  );

  // Initial load
  const isInitialMount = useRef(true);
  useEffect(() => {
    loadInvoices(true);
    salesService.getSalesSummary().then(setStats).catch(() => {});
  }, []);

  // Filter & page changes after initial mount
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const timer = setTimeout(() => {
      loadInvoices(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [page, pageSize, searchQuery, activeTab, loadInvoices]);

  // Reactive UI: auto-refresh invoice table and summary KPIs when invoices change anywhere
  useAppEventListener("invoices:changed", () => {
    loadInvoices(false);
    salesService.getSalesSummary().then(setStats).catch(() => {});
  });

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setPage(1);
  };

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    setPage(1);
  };

  const viewReceipt = (inv: SalesInvoiceDetail) => {
    setSelectedInvoice(inv);
    setIsReceiptModalOpen(true);
  };

  const openRefundDialog = (inv: SalesInvoiceDetail) => {
    setRefundTarget(inv);
    setRefundReason("Customer Return / Refund");
  };

  const handleConfirmRefund = async () => {
    if (!refundTarget) return;
    try {
      setIsRefunding(true);
      await salesService.refundInvoice(refundTarget.id, refundReason);
      toast.success(`Invoice ${refundTarget.invoice_number} returned and refunded successfully.`);
      setRefundTarget(null);
      loadInvoices(false);
      salesService.getSalesSummary().then(setStats).catch(() => {});
    } catch (err: any) {
      toast.error(err.message || "Failed to process sales return");
    } finally {
      setIsRefunding(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Invoices & FBR Invoicing"
        description="Comprehensive audit trail of customer sales, wholesale orders, and FBR fiscal receipts."
      >
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => loadInvoices()} disabled={isLoading} className="gap-1.5">
            <IconRefresh className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Refresh
          </Button>
          <Link href="/pos">
            <Button size="sm" className="gap-1.5">
              <IconDeviceDesktopAnalytics className="h-4 w-4" />
              Open POS Counter
            </Button>
          </Link>
        </div>
      </PageHeader>

      {/* METRIC TILES */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryTile
          label="Today's Total Sales"
          value={`Rs ${Number(stats?.today_sales || 0).toLocaleString()}`}
          subtext="Net gross revenue collected today"
        />
        <SummaryTile
          label="Invoices Generated"
          value={String(stats?.today_invoices_count || 0)}
          subtext="Total counter & wholesale bills"
        />
        <SummaryTile
          label="Today's Cash In Drawer"
          value={`Rs ${Number(stats?.today_cash_collected || 0).toLocaleString()}`}
          subtext="Tendered cash payments"
        />
        <SummaryTile
          label="Pending FBR Offline Queue"
          value={String(stats?.pending_fbr_sync_count || 0)}
          subtext="Invoices waiting for auto-sync"
        />
      </div>

      {/* SINGLE UNIFIED INVOICES TABLE CARD */}
      <DataTable<SalesInvoiceDetail>
        data={invoices}
        columns={[
          {
            header: "Invoice #",
            className: "w-[150px] font-mono font-bold text-xs text-foreground",
            cell: (inv) => inv.invoice_number,
          },
          {
            header: "Customer",
            cell: (inv) => (
              <div>
                <div className="font-medium text-xs text-foreground">{inv.customer_name}</div>
                {inv.customer_phone && (
                  <div className="text-[11px] text-muted-foreground">{inv.customer_phone}</div>
                )}
              </div>
            ),
          },
          {
            header: "Date & Time",
            className: "text-xs text-muted-foreground font-mono",
            cell: (inv) =>
              `${new Date(inv.invoice_date).toLocaleDateString()} ${new Date(inv.invoice_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          },
          {
            header: "Payment",
            cell: (inv) => (
              <div className="flex items-center gap-1.5">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-semibold uppercase px-1.5 py-0.5",
                    inv.payment_status === "paid" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                    inv.payment_status === "partial" && "bg-amber-500/10 text-amber-600 border-amber-500/20",
                    inv.payment_status === "unpaid" && "bg-rose-500/10 text-rose-600 border-rose-500/20"
                  )}
                >
                  {inv.payment_status}
                </Badge>
                <span className="text-[11px] text-muted-foreground uppercase">
                  ({inv.payment_method})
                </span>
              </div>
            ),
          },
          {
            header: "Total Bill",
            className: "font-mono font-bold text-xs text-foreground",
            cell: (inv) => `Rs ${inv.total_amount.toLocaleString()}`,
          },
          {
            header: "Status",
            cell: (inv) => {
              if (inv.status === "refunded") {
                return (
                  <Badge
                    variant="outline"
                    className="text-[10px] font-semibold uppercase px-1.5 py-0.5 bg-rose-500/10 text-rose-600 border-rose-500/20"
                  >
                    Refunded
                  </Badge>
                );
              }
              if (inv.sale_type === "return_credit_note") {
                return (
                  <Badge
                    variant="outline"
                    className="text-[10px] font-semibold uppercase px-1.5 py-0.5 bg-purple-500/10 text-purple-600 border-purple-500/20"
                  >
                    Credit Note
                  </Badge>
                );
              }
              return (
                <Badge
                  variant="outline"
                  className="text-[10px] font-semibold uppercase px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                >
                  Completed
                </Badge>
              );
            },
          },
          {
            header: "FBR Status",
            cell: (inv) => (
              <Badge
                variant="outline"
                className={cn(
                  "gap-1 text-[10px] font-mono",
                  inv.fbr_status === "mocked" && "bg-primary/10 text-primary border-primary/20",
                  inv.fbr_status === "synced" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                  inv.fbr_status === "pending" && "bg-amber-500/10 text-amber-600 border-amber-500/20",
                  inv.fbr_status === "failed" && "bg-rose-500/10 text-rose-600 border-rose-500/20"
                )}
              >
                <IconShieldCheck className="h-3 w-3" />
                {inv.fbr_status.toUpperCase()}
              </Badge>
            ),
          },
          {
            header: "FBR Invoice No",
            className: "font-mono text-[11px] text-muted-foreground",
            cell: (inv) => inv.fbr_invoice_number || "—",
          },
          {
            header: "Action",
            className: "text-right",
            headerClassName: "text-right",
            cell: (inv) => (
              <div className="flex items-center justify-end gap-1.5">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 gap-1 text-xs"
                  onClick={() => viewReceipt(inv)}
                >
                  <IconPrinter className="h-3.5 w-3.5" />
                  Receipt
                </Button>
                {inv.status !== "refunded" && inv.status !== "cancelled" && inv.sale_type !== "return_credit_note" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 dark:border-rose-900/50"
                    onClick={() => openRefundDialog(inv)}
                  >
                    <IconArrowBackUp className="h-3.5 w-3.5" />
                    Refund
                  </Button>
                )}
              </div>
            ),
          },
        ]}
        keyExtractor={(inv) => inv.id}
        initialLoading={initialLoading}
        isFetching={isFetching}
        searchValue={searchQuery}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search by Invoice #, Customer, or FBR No..."
        filterControls={
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-auto">
            <TabsList className="h-9">
              <TabsTrigger value="All" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="Paid" className="text-xs">Paid</TabsTrigger>
              <TabsTrigger value="Partial" className="text-xs">Partial</TabsTrigger>
              <TabsTrigger value="Unpaid" className="text-xs">Unpaid</TabsTrigger>
              <TabsTrigger value="FBR Synced" className="text-xs">FBR Synced</TabsTrigger>
              <TabsTrigger value="Refunded" className="text-xs">Refunded</TabsTrigger>
            </TabsList>
          </Tabs>
        }
        recordLabel="Invoices"
        totalRecords={total}
        pagination={{
          page,
          pageSize,
          total,
          onPageChange: setPage,
          onPageSizeChange: setPageSize,
        }}
        emptyTitle="No invoices found"
        emptyDescription={
          searchQuery || activeTab !== "All"
            ? "No invoices match your active search filters. Try clearing your filters."
            : "Process sales on the POS counter to generate records."
        }
        emptyIcon={<IconFileInvoice className="h-6 w-6 text-muted-foreground/60" />}
        onClearFilters={
          searchQuery || activeTab !== "All"
            ? () => {
                setSearchQuery("");
                setActiveTab("All");
                setPage(1);
              }
            : undefined
        }
      />

      {/* SALES RETURN & REFUND CONFIRMATION MODAL */}
      <Dialog open={!!refundTarget} onOpenChange={(open) => !open && setRefundTarget(null)}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Process Sales Return & Refund</DialogTitle>
            <DialogDescription>
              Process a return for invoice <span className="font-mono font-semibold text-foreground">{refundTarget?.invoice_number}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg border bg-muted/40 p-3 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer:</span>
                <span className="font-medium text-foreground">{refundTarget?.customer_name || "Walk-in Retail Buyer"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Original Invoice Total:</span>
                <span className="font-mono font-semibold text-foreground">Rs {Number(refundTarget?.total_amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paid Amount to Refund:</span>
                <span className="font-mono font-semibold text-rose-600">Rs {Number(refundTarget?.paid_amount || 0).toLocaleString()} ({refundTarget?.payment_method?.toUpperCase()})</span>
              </div>
              {Number(refundTarget?.balance_due || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Credit Balance to Cancel:</span>
                  <span className="font-mono font-semibold text-amber-600">Rs {Number(refundTarget?.balance_due || 0).toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Return Reason</label>
              <Input
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="e.g. Customer returned goods, damaged packaging, wrong size"
                className="text-xs"
              />
            </div>

            <p className="text-[11px] text-muted-foreground">
              Inventory items will be returned to branch stock and a double-entry Credit Note Journal Voucher will be automatically posted.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundTarget(null)} disabled={isRefunding}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmRefund}
              disabled={isRefunding}
              className="gap-1.5"
            >
              {isRefunding ? "Processing..." : "Confirm Return & Refund"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ENTERPRISE DUAL-MODE THERMAL RECEIPT STUDIO (80mm & 58mm, English + Urdu, FBR & WhatsApp) */}
      <ThermalReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        invoice={selectedInvoice}
        shopName={tenant?.name || "Paperless Enterprise"}
        branchName={selectedInvoice?.branch_name || "Main Branch"}
        branchAddress="Commercial Area, Pakistan"
        branchPhone="+92 300 1234567"
      />
    </div>
  );
}
