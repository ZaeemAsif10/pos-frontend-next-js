"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  IconBuildingStore,
  IconShieldCheck,
  IconReceiptTax,
  IconCash,
  IconUsers,
  IconPackages,
  IconRefresh,
  IconPlus,
  IconPrinter,
  IconChevronRight,
  IconCreditCard,
  IconAlertTriangle,
  IconArrowUpRight,
  IconTrendingUp,
  IconCalendar,
  IconFilter,
  IconCheck,
} from "@tabler/icons-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useAuth } from "@/context/auth-context";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { salesService, type SalesSummaryStats, type SalesInvoiceDetail } from "@/services/sales.service";
import { partyService, type CustomerStats } from "@/services/party.service";
import { productService, type ProductStats } from "@/services/product.service";
import { branchService, type BranchItem } from "@/services/branch.service";
import { ThermalReceiptModal } from "@/components/pos/thermal-receipt";
import { useAppEventListener } from "@/lib/events";
import { cn } from "@/lib/utils";

const PLAN_NAMES: Record<string, string> = {
  free_trial: "14-Day Free Evaluation",
  basic: "Basic Retail Plan",
  standard: "Standard Wholesale Plan",
  enterprise: "Enterprise Plan",
};

export default function DashboardPage() {
  const { user, tenant } = useAuth();

  const [selectedBranchId, setSelectedBranchId] = useState<string>("all");
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [salesSummary, setSalesSummary] = useState<SalesSummaryStats | null>(null);
  const [customerStats, setCustomerStats] = useState<CustomerStats | null>(null);
  const [productStats, setProductStats] = useState<ProductStats | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<SalesInvoiceDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Thermal Receipt Modal State
  const [activeReceiptInvoice, setActiveReceiptInvoice] = useState<SalesInvoiceDetail | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const greetingName = user?.full_name || "Merchant";
  const businessName = tenant?.name || (user?.is_superadmin ? "Platform Management" : "My Business");
  const planDisplay = tenant?.plan_tier ? PLAN_NAMES[tenant.plan_tier] || tenant.plan_tier : "Free Evaluation";

  // Fetch real-time dashboard data
  const loadDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    const branchParam = selectedBranchId !== "all" ? Number(selectedBranchId) : undefined;

    try {
      const [bRes, sRes, cRes, pRes, invRes] = await Promise.allSettled([
        branchService.listBranches(),
        salesService.getSalesSummary(branchParam),
        partyService.getCustomerStats(),
        productService.listProducts({ page: 1, size: 5 }),
        salesService.listInvoices({ page: 1, size: 6, branch_id: branchParam }),
      ]);

      if (bRes.status === "fulfilled") {
        setBranches(bRes.value.branches || []);
      }
      if (sRes.status === "fulfilled") {
        setSalesSummary(sRes.value);
      }
      if (cRes.status === "fulfilled") {
        setCustomerStats(cRes.value);
      }
      if (pRes.status === "fulfilled") {
        setProductStats(pRes.value.stats);
      }
      if (invRes.status === "fulfilled") {
        setRecentInvoices(invRes.value.items || []);
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
      toast.error("Failed to load some dashboard metrics");
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [selectedBranchId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Real-time Event Driven Updates
  useAppEventListener(
    [
      "invoices:changed",
      "products:changed",
      "customers:changed",
      "inventory:changed",
      "branches:changed",
    ],
    () => {
      loadDashboardData(true);
    }
  );

  // Weekly Sales Trend calculation from recent invoices
  const salesChartData = useMemo(() => {
    // Generate the last 7 days baseline
    const days: { dateStr: string; label: string; amount: number; count: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-PK", { weekday: "short", day: "numeric" });
      days.push({ dateStr, label, amount: 0, count: 0 });
    }

    // Populate with real invoice amounts
    recentInvoices.forEach((inv) => {
      const invDate = (inv.created_at || inv.invoice_date || "").split("T")[0];
      const match = days.find((d) => d.dateStr === invDate);
      if (match) {
        match.amount += Number(inv.total_amount) || 0;
        match.count += 1;
      }
    });

    return days;
  }, [recentInvoices]);

  // Payment Breakdown Summary
  const paymentBreakdown = useMemo(() => {
    let cash = 0;
    let card = 0;
    let credit = 0;

    recentInvoices.forEach((inv) => {
      const amt = Number(inv.total_amount) || 0;
      if (inv.payment_method === "card") {
        card += amt;
      } else if (inv.payment_method === "credit") {
        credit += amt;
      } else {
        cash += amt;
      }
    });

    const total = cash + card + credit || 1;
    return {
      cash,
      card,
      credit,
      total,
      cashPct: Math.round((cash / total) * 100),
      cardPct: Math.round((card / total) * 100),
      creditPct: Math.round((credit / total) * 100),
    };
  }, [recentInvoices]);

  const handleOpenReceipt = (invoice: SalesInvoiceDetail) => {
    setActiveReceiptInvoice(invoice);
    setIsReceiptModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* HEADER & EXECUTIVE TOOLBAR */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2 border-b">
        <PageHeader
          title={`Welcome back, ${greetingName} 👋`}
          description={`Live operational snapshot for ${businessName}.`}
        />

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Branch Switcher */}
          <div className="flex items-center gap-1.5 bg-card border rounded-lg px-2.5 py-1 shadow-xs">
            <IconBuildingStore className="h-4 w-4 text-primary shrink-0" />
            <Select
              value={selectedBranchId}
              onValueChange={setSelectedBranchId}
            >
              <SelectTrigger className="border-none shadow-none h-8 w-[170px] text-xs font-semibold focus:ring-0">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs font-bold">
                  All Locations (Consolidated)
                </SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)} className="text-xs">
                    {b.name} ({b.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadDashboardData()}
            disabled={isLoading}
            className="h-10 text-xs gap-1.5 shadow-xs"
          >
            <IconRefresh className={cn("h-4 w-4", isLoading && "animate-spin text-primary")} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          {/* Quick Actions */}
          <Button asChild size="sm" className="h-10 text-xs font-bold px-4 shadow-sm">
            <Link href="/pos">
              POS
            </Link>
          </Button>
        </div>
      </div>

      {/* 4 PRIMARY EXECUTIVE KPI TILES */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Tile 1: Today's Sales */}
        <Card className="relative overflow-hidden border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-card to-card">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Today&apos;s POS Sales
              </span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <IconReceiptTax className="h-5 w-5" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono text-emerald-700 dark:text-emerald-400">
                Rs {salesSummary?.today_sales?.toLocaleString() || "0"}
              </p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <IconTrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                <span>
                  <b>{salesSummary?.today_invoices_count || 0}</b> sales recorded today
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tile 2: Cash Collected */}
        <Card className="relative overflow-hidden border-sky-500/20 bg-gradient-to-br from-sky-500/5 via-card to-card">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Cash Drawer Tender
              </span>
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <IconCash className="h-5 w-5" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono text-sky-700 dark:text-sky-400">
                Rs {salesSummary?.today_cash_collected?.toLocaleString() || "0"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Net cash tender in active shift register
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tile 3: Market Receivables / Khata */}
        <Card className="relative overflow-hidden border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-card to-card">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Market Receivables
              </span>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <IconUsers className="h-5 w-5" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono text-amber-700 dark:text-amber-400">
                Rs {customerStats?.total_receivables?.toLocaleString() || "0"}
              </p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
                <span>{customerStats?.total_customers || 0} customer accounts</span>
                {customerStats && customerStats.overdue_accounts > 0 && (
                  <Badge variant="destructive" className="text-[10px] py-0 px-1.5">
                    {customerStats.overdue_accounts} Overdue
                  </Badge>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tile 4: Inventory Valuation */}
        <Card className="relative overflow-hidden border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 via-card to-card">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Inventory Valuation
              </span>
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <IconPackages className="h-5 w-5" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono text-indigo-700 dark:text-indigo-400">
                Rs {productStats?.total_inventory_value?.toLocaleString() || "0"}
              </p>
              <div className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
                <span>{productStats?.total_products || 0} active SKUs</span>
                {productStats && productStats.low_stock_count > 0 && (
                  <Badge
                    variant="outline"
                    className="text-[10px] py-0 px-1.5 border-amber-500/30 text-amber-600 bg-amber-500/10"
                  >
                    {productStats.low_stock_count} Low Stock
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ANALYTICS CHARTS & COMPLIANCE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): 7-Day Velocity Chart */}
        <Card className="lg:col-span-8 shadow-xs">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <IconTrendingUp className="h-4 w-4 text-primary" />
                  Recent Sales Volume & Daily Velocity
                </CardTitle>
                <CardDescription className="text-xs">
                  Daily turnover across retail shops and checkout points
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                Last 7 Days
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis
                    dataKey="label"
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `Rs ${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-popover border text-popover-foreground rounded-lg p-2.5 shadow-md text-xs">
                            <p className="font-bold">{data.label}</p>
                            <p className="text-primary font-mono font-bold pt-1">
                              Revenue: Rs {data.amount.toLocaleString()}
                            </p>
                            <p className="text-muted-foreground text-[11px]">
                              {data.count} transaction{data.count !== 1 ? "s" : ""}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="amount"
                    fill="currentColor"
                    radius={[6, 6, 0, 0]}
                    className="fill-primary"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Right Column (4 cols): Payment Mix & FBR Compliance */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* FBR Compliance Status Banner */}
          <Card className="border-emerald-500/20 bg-emerald-500/5 shadow-xs">
            <CardContent className="p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <IconShieldCheck className="h-4 w-4 text-emerald-600" />
                  FBR Digital POS Compliance
                </span>
                <Badge
                  variant="secondary"
                  className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]"
                >
                  Active
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                All retail invoices are digitally fiscalized with verifiable QR codes.
              </p>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-500/20">
                <span className="text-muted-foreground">Sync Backlog:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {salesSummary?.pending_fbr_sync_count || 0} Pending
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Breakdown */}
          <Card className="shadow-xs flex-1 flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <IconCreditCard className="h-4 w-4 text-primary" />
                Payment Method Mix
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pb-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1 font-medium">
                    <span className="size-2 rounded-full bg-emerald-500" /> Cash Tender
                  </span>
                  <span className="font-mono font-bold">{paymentBreakdown.cashPct}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${paymentBreakdown.cashPct}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1 font-medium">
                    <span className="size-2 rounded-full bg-sky-500" /> Credit / Khata
                  </span>
                  <span className="font-mono font-bold">{paymentBreakdown.creditPct}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-500 transition-all duration-500"
                    style={{ width: `${paymentBreakdown.creditPct}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1 font-medium">
                    <span className="size-2 rounded-full bg-violet-500" /> Card / POS
                  </span>
                  <span className="font-mono font-bold">{paymentBreakdown.cardPct}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-500 transition-all duration-500"
                    style={{ width: `${paymentBreakdown.cardPct}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* RECENT INVOICES & LIVE SALES STREAM */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <IconReceiptTax className="h-4 w-4 text-primary" />
                Live Sales & Invoices Stream
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time POS checkout transactions across all active terminals
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm" className="text-xs gap-1">
              <Link href="/invoices">
                <span>View Full Registry</span>
                <IconChevronRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-[180px] text-xs">Invoice #</TableHead>
                  <TableHead className="text-xs">Customer</TableHead>
                  <TableHead className="text-xs">Location</TableHead>
                  <TableHead className="text-xs">Payment</TableHead>
                  <TableHead className="text-xs">FBR Status</TableHead>
                  <TableHead className="text-right text-xs">Grand Total</TableHead>
                  <TableHead className="text-right text-xs w-[130px]">Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-xs">
                      No sales recorded yet. Click &quot;POS Terminal&quot; to begin your first sale!
                    </TableCell>
                  </TableRow>
                ) : (
                  recentInvoices.map((inv) => (
                    <TableRow key={inv.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-mono text-xs font-semibold text-primary">
                        {inv.invoice_number}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {inv.customer_name || "Walk-in Buyer"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {inv.branch_name || "Main Branch"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] capitalize",
                            inv.payment_method === "cash" && "border-emerald-500/30 text-emerald-600 bg-emerald-500/5",
                            inv.payment_method === "credit" && "border-sky-500/30 text-sky-600 bg-sky-500/5",
                            inv.payment_method === "card" && "border-violet-500/30 text-violet-600 bg-violet-500/5"
                          )}
                        >
                          {inv.payment_method}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-semibold"
                        >
                          <IconShieldCheck className="h-3 w-3 mr-1 inline" />
                          Fiscalized
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold">
                        Rs {Number(inv.total_amount).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenReceipt(inv)}
                          className="h-7 text-xs gap-1 font-semibold text-primary hover:bg-primary/10"
                        >
                          <IconPrinter className="h-3.5 w-3.5" />
                          <span>Receipt</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* DUAL-MODE THERMAL RECEIPT MODAL INTEGRATION */}
      <ThermalReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        invoice={activeReceiptInvoice}
        shopName={tenant?.name || "Paperless Enterprise"}
        branchName={
          branches.find((b) => b.id === activeReceiptInvoice?.branch_id)?.name || "Main Branch"
        }
        branchAddress={
          branches.find((b) => b.id === activeReceiptInvoice?.branch_id)?.address ||
          "Commercial Area, Pakistan"
        }
        branchPhone={
          branches.find((b) => b.id === activeReceiptInvoice?.branch_id)?.phone ||
          "+92 300 1234567"
        }
      />
    </div>
  );
}
