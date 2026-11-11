"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
  IconCalendar,
  IconBuildingStore,
  IconRefresh,
  IconPrinter,
  IconDownload,
  IconArrowLeft,
  IconArrowRight,
  IconCash,
  IconTrendingUp,
  IconTrendingDown,
  IconWallet,
  IconReceipt2,
  IconCreditCard,
  IconBuildingBank,
  IconSearch,
  IconCoins,
  IconReceiptTax,
} from "@tabler/icons-react";

import { useLanguage } from "@/context/language-context";
import { LanguageToggle } from "@/components/language-toggle";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
import {
  salesService,
  type DayBookResponse,
  type DayBookEntryItem,
} from "@/services/sales.service";
import { branchService, type BranchItem } from "@/services/branch.service";
import { useAuth } from "@/context/auth-context";

export default function DayBookPage() {
  const { user, tenant } = useAuth();
  const { t } = useLanguage();
  const canViewAllBranches =
    user?.is_superadmin ||
    (tenant?.permissions?.some((p) => p === "*" || p === "daybook:all_branches") ?? true);

  // Filter States
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Data States
  const [daybookData, setDaybookData] = useState<DayBookResponse | null>(null);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Load Branches
  useEffect(() => {
    branchService
      .listBranches()
      .then((res) => setBranches(res.branches || []))
      .catch(() => setBranches([]));
  }, []);

  // Fetch Day Book Data
  const fetchDayBook = useCallback(async () => {
    setLoading(true);
    try {
      const res = await salesService.getDayBook({
        date: selectedDate,
        branch_id: selectedBranch !== "all" ? Number(selectedBranch) : undefined,
        payment_method: selectedPaymentMethod !== "all" ? selectedPaymentMethod : undefined,
      });
      setDaybookData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load Day Book";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedBranch, selectedPaymentMethod]);

  useEffect(() => {
    fetchDayBook();
  }, [fetchDayBook]);

  // Quick Date Navigation
  const changeDateByDays = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split("T")[0]);
  };

  // Currency Formatter
  const formatPKR = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Format Time
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString("en-PK", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    } catch {
      return isoString;
    }
  };

  // Filtered Entries based on search
  const filteredEntries = useMemo(() => {
    if (!daybookData?.entries) return [];
    if (!searchQuery.trim()) return daybookData.entries;

    const q = searchQuery.toLowerCase().trim();
    return daybookData.entries.filter(
      (e) =>
        e.voucher_no.toLowerCase().includes(q) ||
        e.party_name.toLowerCase().includes(q) ||
        (e.notes && e.notes.toLowerCase().includes(q)) ||
        (e.user_name && e.user_name.toLowerCase().includes(q))
    );
  }, [daybookData?.entries, searchQuery]);

  // Entry Type Badge
  const getEntryTypeBadge = (type: DayBookEntryItem["entry_type"]) => {
    switch (type) {
      case "sale":
        return (
          <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
            POS Sale
          </Badge>
        );
      case "customer_payment":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-medium">
            {t("Wasooli (CRV)", "وصولی")}
          </Badge>
        );
      case "supplier_payment":
        return (
          <Badge variant="outline" className="border-amber-400 text-amber-700 dark:border-amber-700 dark:text-amber-400 font-medium">
            {t("Adaiygi (CPV)", "ادائیگی")}
          </Badge>
        );
      case "expense":
        return (
          <Badge variant="outline" className="border-rose-400 bg-rose-50 text-rose-700 dark:bg-rose-950 dark:border-rose-700 dark:text-rose-400 font-medium">
            {t("Expense", "خرچ")}
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  // Payment Method Badge
  const getPaymentMethodBadge = (method: string) => {
    switch (method.toLowerCase()) {
      case "cash":
        return (
          <span className="inline-flex items-center gap-1 font-mono text-xs text-emerald-700 dark:text-emerald-400">
            <IconCash className="h-3 w-3" /> Cash
          </span>
        );
      case "bank_transfer":
      case "bank":
        return (
          <span className="inline-flex items-center gap-1 font-mono text-xs text-blue-700 dark:text-blue-400">
            <IconBuildingBank className="h-3 w-3" /> Bank
          </span>
        );
      case "raast":
        return (
          <span className="inline-flex items-center gap-1 font-mono text-xs text-amber-700 dark:text-amber-400">
            <IconCoins className="h-3 w-3" /> Raast
          </span>
        );
      case "card":
        return (
          <span className="inline-flex items-center gap-1 font-mono text-xs text-purple-700 dark:text-purple-400">
            <IconCreditCard className="h-3 w-3" /> Card
          </span>
        );
      default:
        return <span className="font-mono text-xs capitalize">{method}</span>;
    }
  };

  // CSV Export
  const exportCSV = () => {
    if (!daybookData || filteredEntries.length === 0) {
      toast.info("No entries to export.");
      return;
    }

    const headers = [
      "Time",
      "Voucher #",
      "Type",
      "Party Name",
      "Payment Method",
      "Branch",
      "Cash In (Dr)",
      "Cash Out (Cr)",
      "Running Balance",
      "User",
      "Notes",
    ];

    const rows = filteredEntries.map((e) => [
      formatTime(e.timestamp),
      e.voucher_no,
      e.entry_type,
      `"${e.party_name.replace(/"/g, '""')}"`,
      e.payment_method,
      e.branch_name || "",
      e.cash_in,
      e.cash_out,
      e.running_balance,
      e.user_name || "",
      `"${(e.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `DayBook_Roznamcha_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="print:hidden">
        <PageHeader
          title={t("Day Book (Roznamcha)", "روزنامچہ")}
          description={t(
            "Live daily cash register, counter inflows, wasooli receipts, and payouts.",
            "روزمرہ کیش رجسٹر، کاؤنٹر آمدن، وصولیاں اور ادائیگیاں۔"
          )}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <LanguageToggle showLabel variant="outline" />
            <Link href="/accounting/expenses">
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5"
              >
                <IconReceiptTax className="h-4 w-4" />
                {t("Record Expense", "خرچہ")}
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={exportCSV}
              disabled={loading || !daybookData?.entries.length}
              className="h-9 gap-1.5"
            >
              <IconDownload className="h-4 w-4" />
              {t("Export CSV", "ایکسپورٹ")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              disabled={loading}
              className="h-9 gap-1.5"
            >
              <IconPrinter className="h-4 w-4" />
              {t("Print Roznamcha", "پرنٹ کریں")}
            </Button>
          </div>
        </PageHeader>
      </div>

      {/* Filter & Date Switcher Bar */}
      <Card className="print:hidden">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            {/* Date with Prev / Next */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <IconCalendar className="h-3.5 w-3.5" /> Date
              </Label>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => changeDateByDays(-1)}
                  title="Previous Day"
                >
                  <IconArrowLeft className="h-4 w-4" />
                </Button>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-9 w-38"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => changeDateByDays(1)}
                  title="Next Day"
                >
                  <IconArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-2 text-xs font-medium"
                  onClick={goToToday}
                >
                  Today
                </Button>
              </div>
            </div>

            {/* Branch Selector */}
            <div className="w-52 space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <IconBuildingStore className="h-3.5 w-3.5" /> Branch
              </Label>
              <Select
                value={selectedBranch}
                onValueChange={setSelectedBranch}
                disabled={!canViewAllBranches && branches.length <= 1}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches (Consolidated)</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name} ({b.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Method Filter */}
            <div className="w-44 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Payment Channel</Label>
              <Select
                value={selectedPaymentMethod}
                onValueChange={setSelectedPaymentMethod}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="cash">Cash Only</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="raast">Raast</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search Query */}
            <div className="flex-1 min-w-[200px] space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <IconSearch className="h-3.5 w-3.5" /> Search Register
              </Label>
              <Input
                placeholder="Search voucher, party, user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9"
              />
            </div>

            {/* Refresh */}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDayBook}
              disabled={loading}
              className="h-9 gap-1.5"
            >
              <IconRefresh className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPI Summary Cards: Cash Flow & Drawer Status */}
      {daybookData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Opening Cash */}
          <Card className="border-l-4 border-l-slate-400">
            <CardHeader className="py-3 px-4 pb-1">
              <CardDescription className="text-xs font-semibold tracking-wider uppercase flex items-center gap-1">
                <IconWallet className="h-3.5 w-3.5 text-muted-foreground" />
                {t("Opening Cash", "ابتدائی کیش")}
              </CardDescription>
              <CardTitle className="text-xl font-bold font-mono text-foreground">
                {formatPKR(daybookData.summary.opening_cash)}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-2 text-xs text-muted-foreground">
              {t("Cash at counter start of day", "صبح کاؤنٹر کھلنے کے وقت کیش")}
            </CardContent>
          </Card>

          {/* Cash In (Aamad) */}
          <Card className="border-l-4 border-l-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/10">
            <CardHeader className="py-3 px-4 pb-1">
              <CardDescription className="text-xs font-semibold tracking-wider uppercase flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                <IconTrendingUp className="h-3.5 w-3.5" />
                {t("Total Cash In", "آمد (کیش ان)")}
              </CardDescription>
              <CardTitle className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
                +{formatPKR(daybookData.summary.total_cash_in)}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-2 text-xs text-muted-foreground">
              {t("Cash Sales", "نقد فروخت")} ({formatPKR(daybookData.summary.cash_sales)}) + {t("Wasooli", "وصولی")} (
              {formatPKR(daybookData.summary.customer_wasooli)})
            </CardContent>
          </Card>

          {/* Cash Out (Kharch) */}
          <Card className="border-l-4 border-l-rose-600 bg-rose-50/20 dark:bg-rose-950/10">
            <CardHeader className="py-3 px-4 pb-1">
              <CardDescription className="text-xs font-semibold tracking-wider uppercase flex items-center gap-1 text-rose-700 dark:text-rose-400">
                <IconTrendingDown className="h-3.5 w-3.5" />
                {t("Total Cash Out", "خرچ (کیش آؤٹ)")}
              </CardDescription>
              <CardTitle className="text-xl font-bold font-mono text-rose-700 dark:text-rose-400">
                -{formatPKR(daybookData.summary.total_cash_out)}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-2 text-xs text-muted-foreground">
              {t("Supplier", "سپلائر")} ({formatPKR(daybookData.summary.supplier_payments)}) + {t("Expenses", "اخراجات")} ({formatPKR(daybookData.summary.cash_expenses || 0)})
            </CardContent>
          </Card>

          {/* Closing Cash in Drawer */}
          <Card className="border-l-4 border-l-primary bg-primary/5">
            <CardHeader className="py-3 px-4 pb-1">
              <CardDescription className="text-xs font-semibold tracking-wider uppercase flex items-center gap-1 text-primary">
                <IconCash className="h-3.5 w-3.5" />
                {t("Closing Cash In Drawer", "دراز میں موجود کیش")}
              </CardDescription>
              <CardTitle className="text-2xl font-bold font-mono text-primary">
                {formatPKR(daybookData.summary.closing_cash)}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-2 text-xs text-muted-foreground">
              {t("Physical cash that must be in counter till", "کاؤنٹر کی دراز میں موجود نقد رقم")}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Method Breakdown Bar */}
      {daybookData && (
        <Card className="print:hidden">
          <CardContent className="p-3">
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="font-semibold text-muted-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <IconReceipt2 className="h-4 w-4" /> Channel Breakdown:
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-100/60 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 font-mono">
                  <span className="font-medium">Cash:</span>
                  <span>{formatPKR(daybookData.payment_methods.cash)}</span>
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-100/60 text-blue-900 dark:bg-blue-950/40 dark:text-blue-300 font-mono">
                  <span className="font-medium">Bank:</span>
                  <span>{formatPKR(daybookData.payment_methods.bank_transfer)}</span>
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-100/60 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 font-mono">
                  <span className="font-medium">Raast:</span>
                  <span>{formatPKR(daybookData.payment_methods.raast)}</span>
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-100/60 text-purple-900 dark:bg-purple-950/40 dark:text-purple-300 font-mono">
                  <span className="font-medium">Card:</span>
                  <span>{formatPKR(daybookData.payment_methods.card)}</span>
                </div>
                {daybookData.payment_methods.cheque > 0 && (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 font-mono">
                    <span className="font-medium">Cheque:</span>
                    <span>{formatPKR(daybookData.payment_methods.cheque)}</span>
                  </div>
                )}
                <div className="border-l pl-3 font-semibold font-mono">
                  <span className="text-muted-foreground mr-1">Turnover:</span>
                  <span className="text-foreground">{formatPKR(daybookData.summary.total_turnover)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Print Sheet Header (Only visible on print) */}
      <div className="hidden print:block mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold text-center">DAY BOOK / ROZNAMCHA REGISTER</h1>
        <p className="text-sm text-center text-muted-foreground">
          Date: {selectedDate} | Branch:{" "}
          {selectedBranch === "all"
            ? "All Branches (Consolidated)"
            : branches.find((b) => String(b.id) === selectedBranch)?.name || selectedBranch}
        </p>
        <div className="grid grid-cols-4 gap-2 mt-4 text-xs border p-2 rounded">
          <div>Opening Cash: <strong>{formatPKR(daybookData?.summary.opening_cash || 0)}</strong></div>
          <div>Total Cash In: <strong>{formatPKR(daybookData?.summary.total_cash_in || 0)}</strong></div>
          <div>Total Cash Out: <strong>{formatPKR(daybookData?.summary.total_cash_out || 0)}</strong></div>
          <div>Closing Cash: <strong>{formatPKR(daybookData?.summary.closing_cash || 0)}</strong></div>
        </div>
      </div>

      {/* Day Book Register Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Time</TableHead>
                <TableHead className="w-36">Voucher / Inv #</TableHead>
                <TableHead className="w-28">Type</TableHead>
                <TableHead>Customer / Supplier / Particulars</TableHead>
                <TableHead className="w-28">Channel</TableHead>
                <TableHead className="w-28 hidden md:table-cell">Branch</TableHead>
                <TableHead className="text-right w-36">Cash In (آمد / Dr)</TableHead>
                <TableHead className="text-right w-36">Cash Out (خرچ / Cr)</TableHead>
                <TableHead className="text-right w-40">Running Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                    <IconRefresh className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading Day Book transactions...
                  </TableCell>
                </TableRow>
              ) : filteredEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                    No transactions recorded for {selectedDate}.
                  </TableCell>
                </TableRow>
              ) : (
                filteredEntries.map((e) => (
                  <TableRow key={e.id} className="hover:bg-muted/50 text-xs">
                    <TableCell className="font-mono text-muted-foreground whitespace-nowrap">
                      {formatTime(e.timestamp)}
                    </TableCell>
                    <TableCell className="font-mono font-medium">
                      <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[11px]">
                        {e.voucher_no}
                      </span>
                    </TableCell>
                    <TableCell>{getEntryTypeBadge(e.entry_type)}</TableCell>
                    <TableCell>
                      <p className="font-medium">{e.party_name || "Walk-in Customer"}</p>
                      {e.notes && (
                        <p className="text-[11px] text-muted-foreground truncate max-w-sm">
                          {e.notes}
                        </p>
                      )}
                      {e.user_name && (
                        <p className="text-[10px] text-muted-foreground">
                          By: {e.user_name}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>{getPaymentMethodBadge(e.payment_method)}</TableCell>
                    <TableCell className="text-muted-foreground hidden md:table-cell">
                      {e.branch_name || "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {e.cash_in > 0 ? (
                        <span className="text-emerald-700 dark:text-emerald-400">
                          +{formatPKR(e.cash_in)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/30">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {e.cash_out > 0 ? (
                        <span className="text-rose-700 dark:text-rose-400">
                          -{formatPKR(e.cash_out)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/30">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-foreground">
                      {formatPKR(e.running_balance)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        {/* Footer Summary */}
        {daybookData && (
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-muted/30 border-t font-semibold text-xs gap-3">
            <span className="text-muted-foreground">
              Showing {filteredEntries.length} entries for {selectedDate}
            </span>
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <span className="text-muted-foreground mr-1.5 font-normal">Total Inflow:</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                  +{formatPKR(daybookData.summary.total_cash_in)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground mr-1.5 font-normal">Total Outflow:</span>
                <span className="font-mono text-rose-700 dark:text-rose-400 font-bold">
                  -{formatPKR(daybookData.summary.total_cash_out)}
                </span>
              </div>
              <div className="border-l pl-4">
                <span className="text-muted-foreground mr-1.5 font-normal">Till Closing:</span>
                <span className="font-mono text-primary font-extrabold text-sm">
                  {formatPKR(daybookData.summary.closing_cash)}
                </span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Print Signature Block (Only visible on print) */}
      <div className="hidden print:grid grid-cols-2 gap-12 mt-12 pt-6 border-t text-xs">
        <div>
          <div className="border-t border-dashed w-48 pt-1 text-center font-semibold">
            Cashier Signature
          </div>
        </div>
        <div className="flex justify-end">
          <div className="border-t border-dashed w-48 pt-1 text-center font-semibold">
            Verified / Manager Signature
          </div>
        </div>
      </div>
    </div>
  );
}
