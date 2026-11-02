"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Link from "next/link";
import QRCode from "react-qr-code";
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
} from "@tabler/icons-react";

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

        if (activeTab === "Paid") payment_status = "paid";
        else if (activeTab === "Unpaid") payment_status = "unpaid";
        else if (activeTab === "Partial") payment_status = "partial";
        else if (activeTab === "FBR Synced") fbr_status = "synced";

        const res = await salesService.listInvoices({
          page,
          size: pageSize,
          search: searchQuery.trim() || undefined,
          fbr_status,
          payment_status,
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
              <Button
                size="sm"
                variant="ghost"
                className="h-8 gap-1 text-xs"
                onClick={() => viewReceipt(inv)}
              >
                <IconPrinter className="h-3.5 w-3.5" />
                Receipt
              </Button>
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

      {/* THERMAL / A4 RECEIPT MODAL */}
      <Dialog open={isReceiptModalOpen} onOpenChange={setIsReceiptModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <IconPrinter className="h-5 w-5 text-primary" />
              Receipt & FBR Verification
            </DialogTitle>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-4 py-2 text-foreground font-mono text-xs">
              <div
                id="thermal-receipt"
                className="bg-card border p-4 rounded-lg space-y-3 font-mono text-[11px] leading-tight"
              >
                <div className="text-center space-y-1 pb-2 border-b">
                  <h3 className="font-bold text-sm tracking-wider uppercase">
                    Paperless ERP Store
                  </h3>
                  <p className="text-muted-foreground">
                    {selectedInvoice.branch_name || "Main Branch"}
                  </p>
                  <p className="text-muted-foreground">
                    STRN: 3277876123456 | NTN: 8941230-1
                  </p>
                </div>

                <div className="space-y-1 text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Invoice #:</span>
                    <span className="font-semibold text-foreground">
                      {selectedInvoice.invoice_number}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>
                      {new Date(selectedInvoice.invoice_date).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span>{selectedInvoice.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cashier:</span>
                    <span>{selectedInvoice.cashier_name || "Admin"}</span>
                  </div>
                </div>

                <div className="border-t border-b py-2 space-y-1.5">
                  <div className="flex justify-between font-bold text-foreground">
                    <span className="w-1/2">Item</span>
                    <span className="w-1/4 text-center">Qty</span>
                    <span className="w-1/4 text-right">Price</span>
                  </div>
                  {selectedInvoice.items.map((it) => (
                    <div key={it.id} className="flex justify-between">
                      <span className="w-1/2 truncate">{it.product_name}</span>
                      <span className="w-1/4 text-center">
                        {it.quantity} {it.uom_name}
                      </span>
                      <span className="w-1/4 text-right">
                        {it.total_amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>Rs {selectedInvoice.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sales Tax (FBR):</span>
                    <span>Rs {selectedInvoice.tax_amount.toLocaleString()}</span>
                  </div>
                  {selectedInvoice.discount_amount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount:</span>
                      <span>-Rs {selectedInvoice.discount_amount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-xs pt-1 border-t text-foreground">
                    <span>Total Amount:</span>
                    <span>Rs {selectedInvoice.total_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Paid ({selectedInvoice.payment_method}):</span>
                    <span>Rs {selectedInvoice.paid_amount.toLocaleString()}</span>
                  </div>
                  {selectedInvoice.change_amount > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Change:</span>
                      <span>Rs {selectedInvoice.change_amount.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* FBR OFFICIAL FISCAL SECTION */}
                <div className="border-2 border-dashed border-primary/40 rounded-lg p-3 text-center space-y-2 bg-primary/5 mt-3">
                  <div className="flex items-center justify-center gap-1.5 text-primary font-bold text-xs">
                    <IconShieldCheck className="h-4 w-4" />
                    <span>FBR INVOICE FISCALIZATION</span>
                  </div>

                  <p className="text-[10px] text-muted-foreground">
                    FBR Invoice No:
                  </p>
                  <p className="font-bold text-xs font-mono tracking-wider text-foreground">
                    {selectedInvoice.fbr_invoice_number || "FBR-MOCK-10101"}
                  </p>

                  <div className="flex justify-center p-2 bg-white rounded border inline-block mx-auto">
                    <QRCode
                      value={selectedInvoice.fbr_qr_code || `FBR:${selectedInvoice.fbr_invoice_number}`}
                      size={110}
                      level="M"
                    />
                  </div>

                  <p className="text-[10px] text-muted-foreground">
                    Scan via <b>Tax Asaan App</b> to verify your invoice.
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1 gap-1.5" onClick={() => window.print()}>
                  <IconPrinter className="h-4 w-4" />
                  Print Receipt
                </Button>
                <Button variant="outline" onClick={() => setIsReceiptModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
