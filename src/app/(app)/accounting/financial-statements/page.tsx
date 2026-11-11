"use client";

import { useEffect, useState, useCallback, Suspense, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  IconReportAnalytics,
  IconScale,
  IconSearch,
  IconRefresh,
  IconPrinter,
  IconDownload,
  IconCheck,
  IconAlertTriangle,
  IconArrowRight,
  IconCalendar,
  IconBuildingStore,
  IconCoin,
  IconTrendingUp,
  IconTrendingDown,
  IconReceipt2,
  IconCash,
  IconShieldCheck,
  IconPercentage,
  IconLayersLinked,
  IconFileSpreadsheet,
  IconLock,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  accountingService,
  type ProfitAndLossResponse,
  type ProfitAndLossAccountLine,
  type BalanceSheetResponse,
  type BalanceSheetAccountLine,
  type YearEndClosingPreviewResponse,
} from "@/services/accounting.service";
import { branchService, type BranchItem } from "@/services/branch.service";
import { useAuth } from "@/context/auth-context";

// Helper formatters
const formatPKR = (amount: number) => {
  return new Intl.NumberFormat("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

export default function FinancialStatementsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          Loading Financial Statements...
        </div>
      }
    >
      <FinancialStatementsContent />
    </Suspense>
  );
}

function FinancialStatementsContent() {
  const router = useRouter();  const { tenant } = useAuth();

  const userPerms = useMemo(() => tenant?.permissions || [], [tenant]);
  const canPrint = userPerms.includes("*") || userPerms.includes("accounting:reports:print");
  const canExport = userPerms.includes("*") || userPerms.includes("accounting:reports:export");
  const canCloseYear = userPerms.includes("*") || userPerms.includes("accounting:close_year") || userPerms.includes("accounting:manage");

  // Tab State: 'pnl' or 'balance-sheet'
  const [activeTab, setActiveTab] = useState<"pnl" | "balance-sheet">("pnl");

  // Common branch data
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("all");

  // P&L State
  const [pnlFromDate, setPnlFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1); // 1st of current month
    return d.toISOString().split("T")[0];
  });
  const [pnlToDate, setPnlToDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [pnlData, setPnlData] = useState<ProfitAndLossResponse | null>(null);
  const [pnlLoading, setPnlLoading] = useState(false);

  // Balance Sheet State
  const [bsAsOfDate, setBsAsOfDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [bsData, setBsData] = useState<BalanceSheetResponse | null>(null);
  const [bsLoading, setBsLoading] = useState(false);

  // Fiscal Year Closing State (Phase 7.2)
  const [closingDialogOpen, setClosingDialogOpen] = useState(false);
  const [closingDate, setClosingDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [closingNotes, setClosingNotes] = useState<string>("");
  const [closingPreview, setClosingPreview] = useState<YearEndClosingPreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [executingClose, setExecutingClose] = useState(false);

  // Load branches
  useEffect(() => {
    branchService
      .listBranches()
      .then((res) => setBranches(res.branches || []))
      .catch(() => setBranches([]));
  }, []);

  // Fetch P&L
  const fetchPnL = useCallback(async () => {
    setPnlLoading(true);
    try {
      const branchIdParam =
        selectedBranchId && selectedBranchId !== "all"
          ? parseInt(selectedBranchId, 10)
          : undefined;
      const data = await accountingService.getProfitAndLoss({
        from_date: pnlFromDate,
        to_date: pnlToDate,
        branch_id: branchIdParam,
      });
      setPnlData(data);
    } catch (err: unknown) {
      console.error(err);
      toast.error("Failed to load Profit & Loss statement");
    } finally {
      setPnlLoading(false);
    }
  }, [pnlFromDate, pnlToDate, selectedBranchId]);

  // Fetch Balance Sheet
  const fetchBalanceSheet = useCallback(async () => {
    setBsLoading(true);
    try {
      const branchIdParam =
        selectedBranchId && selectedBranchId !== "all"
          ? parseInt(selectedBranchId, 10)
          : undefined;
      const data = await accountingService.getBalanceSheet({
        as_of_date: bsAsOfDate,
        branch_id: branchIdParam,
      });
      setBsData(data);
    } catch (err: unknown) {
      console.error(err);
      toast.error("Failed to load Balance Sheet");
    } finally {
      setBsLoading(false);
    }
  }, [bsAsOfDate, selectedBranchId]);

  useEffect(() => {
    if (activeTab === "pnl") {
      fetchPnL();
    } else {
      fetchBalanceSheet();
    }
  }, [activeTab, fetchPnL, fetchBalanceSheet]);

  // P&L Quick Presets
  const applyPnlPreset = (preset: "today" | "this-month" | "last-month" | "this-quarter" | "this-year") => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    if (preset === "today") {
      setPnlFromDate(todayStr);
      setPnlToDate(todayStr);
    } else if (preset === "this-month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .split("T")[0];
      setPnlFromDate(firstDay);
      setPnlToDate(todayStr);
    } else if (preset === "last-month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        .toISOString()
        .split("T")[0];
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0)
        .toISOString()
        .split("T")[0];
      setPnlFromDate(firstDay);
      setPnlToDate(lastDay);
    } else if (preset === "this-quarter") {
      const quarterMonth = Math.floor(today.getMonth() / 3) * 3;
      const firstDay = new Date(today.getFullYear(), quarterMonth, 1)
        .toISOString()
        .split("T")[0];
      setPnlFromDate(firstDay);
      setPnlToDate(todayStr);
    } else if (preset === "this-year") {
      const firstDay = new Date(today.getFullYear(), 0, 1)
        .toISOString()
        .split("T")[0];
      setPnlFromDate(firstDay);
      setPnlToDate(todayStr);
    }
  };

  // Balance Sheet Quick Presets
  const applyBsPreset = (preset: "today" | "end-last-month" | "end-last-quarter" | "end-last-year") => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    if (preset === "today") {
      setBsAsOfDate(todayStr);
    } else if (preset === "end-last-month") {
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0)
        .toISOString()
        .split("T")[0];
      setBsAsOfDate(lastDay);
    } else if (preset === "end-last-quarter") {
      const quarterMonth = Math.floor(today.getMonth() / 3) * 3;
      const lastDay = new Date(today.getFullYear(), quarterMonth, 0)
        .toISOString()
        .split("T")[0];
      setBsAsOfDate(lastDay);
    } else if (preset === "end-last-year") {
      const lastDay = new Date(today.getFullYear() - 1, 11, 31)
        .toISOString()
        .split("T")[0];
      setBsAsOfDate(lastDay);
    }
  };

  // CSV Export for P&L
  const exportPnlCSV = () => {
    if (!pnlData) return;
    const rows = [
      ["PROFIT & LOSS STATEMENT (INCOME STATEMENT)"],
      [`Period: ${pnlData.from_date} to ${pnlData.to_date}`],
      [`Branch: ${pnlData.branch_name}`],
      [`Currency: ${pnlData.currency}`],
      [],
      ["Section", "Account Code", "Account Name", "Amount (PKR)", "% of Revenue"],
      ["Operating Revenue", "", "", "", ""],
      ...pnlData.revenue_lines.map((l) => [
        "Revenue",
        l.account_code,
        l.account_name,
        l.amount.toFixed(2),
        `${l.percentage_of_revenue}%`,
      ]),
      ["Subtotal", "", "Gross Sales", pnlData.gross_sales.toFixed(2), ""],
      ["Subtotal", "", "Sales Discounts", pnlData.sales_discounts.toFixed(2), ""],
      ["Subtotal", "", "Net Operating Revenue", pnlData.net_revenue.toFixed(2), "100.0%"],
      [],
      ["Cost of Goods Sold (COGS)", "", "", "", ""],
      ...pnlData.cogs_lines.map((l) => [
        "COGS",
        l.account_code,
        l.account_name,
        l.amount.toFixed(2),
        `${l.percentage_of_revenue}%`,
      ]),
      ["Subtotal", "", "Total COGS", pnlData.total_cogs.toFixed(2), ""],
      [],
      ["SUMMARY", "", "GROSS PROFIT", pnlData.gross_profit.toFixed(2), `${pnlData.gross_profit_margin_pct}%`],
      [],
      ["Operating & Administrative Expenses", "", "", "", ""],
      ...pnlData.expense_lines.map((l) => [
        "Expense",
        l.account_code,
        l.account_name,
        l.amount.toFixed(2),
        `${l.percentage_of_revenue}%`,
      ]),
      ["Subtotal", "", "Total Operating Expenses", pnlData.total_operating_expenses.toFixed(2), ""],
      [],
      ["NET RESULT", "", "NET PROFIT / (LOSS)", pnlData.net_profit.toFixed(2), `${pnlData.net_profit_margin_pct}%`],
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows.map((e) => e.map((val) => `"${val}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Profit_and_Loss_${pnlData.from_date}_to_${pnlData.to_date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Profit & Loss CSV exported successfully.");
  };

  // CSV Export for Balance Sheet
  const exportBsCSV = () => {
    if (!bsData) return;
    const rows = [
      ["STATEMENT OF FINANCIAL POSITION (BALANCE SHEET)"],
      [`As of Date: ${bsData.as_of_date}`],
      [`Branch: ${bsData.branch_name}`],
      [`Currency: ${bsData.currency}`],
      [`Equilibrium Status: ${bsData.is_balanced ? "BALANCED (0.00 Difference)" : "DISCREPANCY"}`, ""],
      [],
      ["Classification", "Account Code", "Account Name", "Sub Type", "Balance (PKR)"],
      ["Current Assets", "", "", "", ""],
      ...bsData.current_assets.map((l) => [
        "Current Asset",
        l.account_code,
        l.account_name,
        l.sub_type || "",
        l.balance.toFixed(2),
      ]),
      ["Subtotal", "", "Total Current Assets", "", bsData.total_current_assets.toFixed(2)],
      [],
      ["Non-Current Assets", "", "", "", ""],
      ...bsData.non_current_assets.map((l) => [
        "Non-Current Asset",
        l.account_code,
        l.account_name,
        l.sub_type || "",
        l.balance.toFixed(2),
      ]),
      ["Subtotal", "", "Total Non-Current Assets", "", bsData.total_non_current_assets.toFixed(2)],
      [],
      ["TOTAL ASSETS", "", "TOTAL ASSETS", "", bsData.total_assets.toFixed(2)],
      [],
      ["Current Liabilities", "", "", "", ""],
      ...bsData.current_liabilities.map((l) => [
        "Current Liability",
        l.account_code,
        l.account_name,
        l.sub_type || "",
        l.balance.toFixed(2),
      ]),
      ["Subtotal", "", "Total Current Liabilities", "", bsData.total_current_liabilities.toFixed(2)],
      [],
      ["Long-Term Liabilities", "", "", "", ""],
      ...bsData.long_term_liabilities.map((l) => [
        "Long-Term Liability",
        l.account_code,
        l.account_name,
        l.sub_type || "",
        l.balance.toFixed(2),
      ]),
      ["Subtotal", "", "Total Long-Term Liabilities", "", bsData.total_long_term_liabilities.toFixed(2)],
      [],
      ["TOTAL LIABILITIES", "", "TOTAL LIABILITIES", "", bsData.total_liabilities.toFixed(2)],
      [],
      ["Equity & Reserves", "", "", "", ""],
      ...bsData.equity_lines.map((l) => [
        "Equity",
        l.account_code,
        l.account_name,
        l.sub_type || "",
        l.balance.toFixed(2),
      ]),
      ["Equity Line", "", "Current Period Net Profit", "P&L Transfer", bsData.current_period_net_profit.toFixed(2)],
      ["Subtotal", "", "Total Equity", "", bsData.total_equity.toFixed(2)],
      [],
      ["TOTAL LIABILITIES & EQUITY", "", "TOTAL LIABILITIES & EQUITY", "", bsData.total_liabilities_and_equity.toFixed(2)],
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows.map((e) => e.map((val) => `"${val}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Balance_Sheet_As_Of_${bsData.as_of_date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Balance Sheet CSV exported successfully.");
  };

  // Fiscal Year Closing logic
  const fetchClosingPreview = useCallback(async (dateStr: string) => {
    try {
      setPreviewLoading(true);
      const res = await accountingService.previewFiscalYearClosing({
        closing_date: dateStr,
        branch_id: selectedBranchId !== "all" ? parseInt(selectedBranchId) : undefined,
      });
      setClosingPreview(res);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load fiscal year closing preview.");
      setClosingPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  }, [selectedBranchId]);

  useEffect(() => {
    if (closingDialogOpen) {
      fetchClosingPreview(closingDate);
    }
  }, [closingDialogOpen, closingDate, fetchClosingPreview]);

  const handleExecuteClosing = async () => {
    if (!closingPreview || !closingPreview.can_close) return;
    try {
      setExecutingClose(true);
      const res = await accountingService.executeFiscalYearClosing({
        closing_date: closingDate,
        branch_id: selectedBranchId !== "all" ? parseInt(selectedBranchId) : undefined,
        notes: closingNotes.trim() || undefined,
      });
      toast.success(res.message || "Fiscal year closed successfully!");
      setClosingDialogOpen(false);
      // Refresh statements to display updated retained earnings and closed balances
      fetchPnL();
      fetchBalanceSheet();
    } catch (err: any) {
      toast.error(err?.message || "Failed to execute fiscal year closing.");
    } finally {
      setExecutingClose(false);
    }
  };



  return (
    <div className="space-y-6">
      {/* ---------------- Print-Only Header Block ---------------- */}
      <div className="hidden print:block mb-8 text-center border-b pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Paperless Business OS</h1>
        <p className="text-sm font-semibold text-gray-700">
          {activeTab === "pnl" ? "IFRS Profit & Loss Statement (Income Statement)" : "IFRS Statement of Financial Position (Balance Sheet)"}
        </p>
        <div className="flex justify-between items-center text-xs text-gray-600 mt-3 px-2">
          <span>Branch: {selectedBranchId === "all" ? "All Branches (Consolidated)" : branches.find((b) => b.id.toString() === selectedBranchId)?.name || selectedBranchId}</span>
          <span>
            {activeTab === "pnl"
              ? `Period: ${pnlFromDate} to ${pnlToDate}`
              : `As of Date: ${bsAsOfDate}`}
          </span>
          <span>Currency: PKR (Pakistani Rupee)</span>
        </div>
      </div>

      {/* ---------------- Screen Top Header ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Financial Statements
            </h1>
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 bg-emerald-500/10 font-medium text-xs">
              IFRS / GAAP Standard
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Official Double-Entry Profit & Loss (Income Statement) and Balance Sheet.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => (activeTab === "pnl" ? fetchPnL() : fetchBalanceSheet())}
            disabled={pnlLoading || bsLoading}
            className="h-9 gap-1.5"
          >
            <IconRefresh className={`h-4 w-4 ${(pnlLoading || bsLoading) ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {canExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={activeTab === "pnl" ? exportPnlCSV : exportBsCSV}
              disabled={activeTab === "pnl" ? !pnlData : !bsData}
              className="h-9 gap-1.5"
            >
              <IconFileSpreadsheet className="h-4 w-4 text-emerald-600" />
              Export CSV
            </Button>
          )}

          {canPrint && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              disabled={activeTab === "pnl" ? !pnlData : !bsData}
              className="h-9 gap-1.5"
            >
              <IconPrinter className="h-4 w-4" />
              Print Statement
            </Button>
          )}

          {canCloseYear && (
            <Button
              size="sm"
              onClick={() => setClosingDialogOpen(true)}
              className="h-9 gap-1.5"
            >
              <IconLock className="h-4 w-4" />
              Close Fiscal Year
            </Button>
          )}
        </div>
      </div>

      {/* ---------------- Tabs & Controls ---------------- */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "pnl" | "balance-sheet")}
        className="space-y-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-3 print:hidden">
          <TabsList className="grid grid-cols-2 w-full md:w-[420px]">
            <TabsTrigger value="pnl" className="gap-2">
              <IconReportAnalytics className="h-4 w-4 text-blue-600" />
              <span>Profit & Loss</span>
            </TabsTrigger>
            <TabsTrigger value="balance-sheet" className="gap-2">
              <IconScale className="h-4 w-4 text-emerald-600" />
              <span>Balance Sheet</span>
            </TabsTrigger>
          </TabsList>

          {/* Branch Filter dropdown */}
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">
              <IconBuildingStore className="h-3.5 w-3.5 inline mr-1 text-muted-foreground" />
              Branch Scope:
            </Label>
            <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
              <SelectTrigger className="w-[180px] h-9 text-xs">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches (Consolidated)</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id.toString()}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* ===================== TAB 1: PROFIT & LOSS ========================= */}
        {/* ==================================================================== */}
        <TabsContent value="pnl" className="space-y-6 m-0">
          {/* P&L Filter Card */}
          <Card className="print:hidden border shadow-sm">
            <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">
                    From Date:
                  </Label>
                  <Input
                    type="date"
                    value={pnlFromDate}
                    onChange={(e) => setPnlFromDate(e.target.value)}
                    className="h-8 w-36 text-xs"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">
                    To Date:
                  </Label>
                  <Input
                    type="date"
                    value={pnlToDate}
                    onChange={(e) => setPnlToDate(e.target.value)}
                    className="h-8 w-36 text-xs"
                  />
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 text-xs font-medium"
                  onClick={fetchPnL}
                >
                  Apply Filter
                </Button>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-muted-foreground mr-1">
                  Quick Periods:
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => applyPnlPreset("today")}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => applyPnlPreset("this-month")}
                >
                  This Month
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => applyPnlPreset("last-month")}
                >
                  Last Month
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => applyPnlPreset("this-quarter")}
                >
                  This Quarter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => applyPnlPreset("this-year")}
                >
                  This Year
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* P&L Top KPI Summary Cards */}
          {pnlData && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Net Revenue */}
              <Card className="border-l-4 border-l-blue-500 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-muted-foreground mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Net Revenue
                    </span>
                    <IconReceipt2 className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold tracking-tight text-blue-600">
                    PKR {formatPKR(pnlData.net_revenue)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
                    <span>Gross: PKR {formatPKR(pnlData.gross_sales)}</span>
                    {pnlData.sales_discounts > 0 && (
                      <span className="text-amber-600">
                        -Discounts: {formatPKR(pnlData.sales_discounts)}
                      </span>
                    )}
                  </p>
                </CardContent>
              </Card>

              {/* COGS */}
              <Card className="border-l-4 border-l-amber-500 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-muted-foreground mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Cost of Goods Sold (COGS)
                    </span>
                    <IconCoin className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="text-2xl font-bold tracking-tight text-amber-600">
                    PKR {formatPKR(pnlData.total_cogs)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {pnlData.net_revenue > 0
                      ? `${((pnlData.total_cogs / pnlData.net_revenue) * 100).toFixed(1)}% of Net Revenue`
                      : "Direct product acquisition cost"}
                  </p>
                </CardContent>
              </Card>

              {/* Gross Profit */}
              <Card className="border-l-4 border-l-purple-500 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-muted-foreground mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Gross Profit
                    </span>
                    <IconTrendingUp className="h-4 w-4 text-purple-500" />
                  </div>
                  <div className="text-2xl font-bold tracking-tight text-purple-600">
                    PKR {formatPKR(pnlData.gross_profit)}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Badge variant="secondary" className="text-[11px] font-semibold bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                      GP Margin: {pnlData.gross_profit_margin_pct}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Net Profit */}
              <Card
                className={`border-l-4 shadow-sm ${
                  pnlData.is_profitable
                    ? "border-l-emerald-500"
                    : "border-l-rose-500"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-muted-foreground mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Net Profit / (Loss)
                    </span>
                    {pnlData.is_profitable ? (
                      <IconTrendingUp className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <IconTrendingDown className="h-4 w-4 text-rose-500" />
                    )}
                  </div>
                  <div
                    className={`text-2xl font-bold tracking-tight ${
                      pnlData.is_profitable ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    PKR {formatPKR(pnlData.net_profit)}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Badge
                      className={`text-[11px] font-semibold ${
                        pnlData.is_profitable
                          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
                          : "bg-rose-500/10 text-rose-600 border border-rose-500/30"
                      }`}
                    >
                      {pnlData.is_profitable ? "Profitable" : "Net Loss"} ({pnlData.net_profit_margin_pct}%)
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* P&L Detailed Statement Table */}
          <Card className="border shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b py-3.5 px-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">
                  Income Statement Details
                </CardTitle>
                <CardDescription className="text-xs">
                  {pnlData
                    ? `Period: ${pnlData.from_date} to ${pnlData.to_date} • ${pnlData.branch_name}`
                    : "Loading..."}
                </CardDescription>
              </div>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Click any account row to view General Ledger
              </span>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow>
                    <TableHead className="w-[120px] font-semibold">Account Code</TableHead>
                    <TableHead className="font-semibold">Account Description</TableHead>
                    <TableHead className="text-right w-[180px] font-semibold">Amount (PKR)</TableHead>
                    <TableHead className="text-right w-[120px] font-semibold">% of Revenue</TableHead>
                    <TableHead className="w-[80px] text-center print:hidden">Ledger</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* --- 1. OPERATING REVENUE SECTION --- */}
                  <TableRow className="bg-blue-50/60 dark:bg-blue-950/20 font-bold border-t-2 border-b">
                    <TableCell colSpan={5} className="text-blue-900 dark:text-blue-200 uppercase text-xs tracking-wider">
                      1. Operating Revenue
                    </TableCell>
                  </TableRow>

                  {pnlData?.revenue_lines && pnlData.revenue_lines.length > 0 ? (
                    pnlData.revenue_lines.map((l) => (
                      <TableRow
                        key={`rev-${l.account_id}`}
                        className="hover:bg-muted/40 transition-colors group cursor-pointer"
                        onClick={() => router.push(`/accounting/ledger?account_id=${l.account_id}`)}
                      >
                        <TableCell className="font-mono text-xs text-muted-foreground font-semibold">
                          {l.account_code}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {l.account_name}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-semibold">
                          {formatPKR(l.amount)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">
                          {l.percentage_of_revenue}%
                        </TableCell>
                        <TableCell className="text-center print:hidden">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/accounting/ledger?account_id=${l.account_id}`);
                            }}
                          >
                            <IconArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-3">
                        No revenue recorded for this period.
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Net Operating Revenue Subtotal */}
                  {pnlData && (
                    <TableRow className="bg-muted/20 font-bold border-t border-b">
                      <TableCell colSpan={2} className="text-right text-xs uppercase tracking-wider">
                        Net Operating Revenue Subtotal
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-blue-600 font-bold">
                        PKR {formatPKR(pnlData.net_revenue)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-blue-600 font-bold">
                        100.0%
                      </TableCell>
                      <TableCell className="print:hidden"></TableCell>
                    </TableRow>
                  )}

                  {/* --- 2. COGS SECTION --- */}
                  <TableRow className="bg-amber-50/60 dark:bg-amber-950/20 font-bold border-t-2 border-b">
                    <TableCell colSpan={5} className="text-amber-900 dark:text-amber-200 uppercase text-xs tracking-wider">
                      2. Cost of Goods Sold
                    </TableCell>
                  </TableRow>

                  {pnlData?.cogs_lines && pnlData.cogs_lines.length > 0 ? (
                    pnlData.cogs_lines.map((l) => (
                      <TableRow
                        key={`cogs-${l.account_id}`}
                        className="hover:bg-muted/40 transition-colors group cursor-pointer"
                        onClick={() => router.push(`/accounting/ledger?account_id=${l.account_id}`)}
                      >
                        <TableCell className="font-mono text-xs text-muted-foreground font-semibold">
                          {l.account_code}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {l.account_name}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-semibold text-amber-700 dark:text-amber-400">
                          {formatPKR(l.amount)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">
                          {l.percentage_of_revenue}%
                        </TableCell>
                        <TableCell className="text-center print:hidden">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/accounting/ledger?account_id=${l.account_id}`);
                            }}
                          >
                            <IconArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-3">
                        No direct COGS entries in this period.
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Total COGS Subtotal */}
                  {pnlData && (
                    <TableRow className="bg-muted/20 font-bold border-t border-b">
                      <TableCell colSpan={2} className="text-right text-xs uppercase tracking-wider">
                        Total Cost of Goods Sold Subtotal
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-amber-600 font-bold">
                        PKR {formatPKR(pnlData.total_cogs)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-amber-600 font-bold">
                        {pnlData.net_revenue > 0 ? `${((pnlData.total_cogs / pnlData.net_revenue) * 100).toFixed(1)}%` : "0.0%"}
                      </TableCell>
                      <TableCell className="print:hidden"></TableCell>
                    </TableRow>
                  )}

                  {/* === GROSS PROFIT HIGHLIGHT ROW === */}
                  {pnlData && (
                    <TableRow className="bg-purple-100/70 dark:bg-purple-950/40 font-extrabold border-y-2 border-purple-300 dark:border-purple-800">
                      <TableCell colSpan={2} className="text-right text-xs uppercase tracking-wider text-purple-950 dark:text-purple-200">
                        === GROSS PROFIT ===
                      </TableCell>
                      <TableCell className="text-right font-mono text-base text-purple-700 dark:text-purple-300 font-extrabold">
                        PKR {formatPKR(pnlData.gross_profit)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-purple-700 dark:text-purple-300 font-bold">
                        {pnlData.gross_profit_margin_pct}%
                      </TableCell>
                      <TableCell className="print:hidden"></TableCell>
                    </TableRow>
                  )}

                  {/* --- 3. OPERATING EXPENSES SECTION --- */}
                  <TableRow className="bg-rose-50/60 dark:bg-rose-950/20 font-bold border-t-2 border-b">
                    <TableCell colSpan={5} className="text-rose-900 dark:text-rose-200 uppercase text-xs tracking-wider">
                      3. Operating & Administrative Expenses
                    </TableCell>
                  </TableRow>

                  {pnlData?.expense_lines && pnlData.expense_lines.length > 0 ? (
                    pnlData.expense_lines.map((l) => (
                      <TableRow
                        key={`exp-${l.account_id}`}
                        className="hover:bg-muted/40 transition-colors group cursor-pointer"
                        onClick={() => router.push(`/accounting/ledger?account_id=${l.account_id}`)}
                      >
                        <TableCell className="font-mono text-xs text-muted-foreground font-semibold">
                          {l.account_code}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {l.account_name}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-semibold text-rose-700 dark:text-rose-400">
                          {formatPKR(l.amount)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">
                          {l.percentage_of_revenue}%
                        </TableCell>
                        <TableCell className="text-center print:hidden">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/accounting/ledger?account_id=${l.account_id}`);
                            }}
                          >
                            <IconArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-3">
                        No operational expenses recorded for this period.
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Total Operating Expenses Subtotal */}
                  {pnlData && (
                    <TableRow className="bg-muted/20 font-bold border-t border-b">
                      <TableCell colSpan={2} className="text-right text-xs uppercase tracking-wider">
                        Total Operating Expenses Subtotal
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-rose-600 font-bold">
                        PKR {formatPKR(pnlData.total_operating_expenses)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-rose-600 font-bold">
                        {pnlData.net_revenue > 0 ? `${((pnlData.total_operating_expenses / pnlData.net_revenue) * 100).toFixed(1)}%` : "0.0%"}
                      </TableCell>
                      <TableCell className="print:hidden"></TableCell>
                    </TableRow>
                  )}

                  {/* === NET PROFIT GRAND TOTAL ROW === */}
                  {pnlData && (
                    <TableRow
                      className={`font-black border-y-4 ${
                        pnlData.is_profitable
                          ? "bg-emerald-100/80 dark:bg-emerald-950/50 border-emerald-400 dark:border-emerald-700 text-emerald-950 dark:text-emerald-100"
                          : "bg-rose-100/80 dark:bg-rose-950/50 border-rose-400 dark:border-rose-700 text-rose-950 dark:text-rose-100"
                      }`}
                    >
                      <TableCell colSpan={2} className="text-right text-sm uppercase tracking-wider font-black">
                        === NET PROFIT / (LOSS) FOR THE PERIOD ===
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono text-lg font-black ${
                          pnlData.is_profitable ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"
                        }`}
                      >
                        PKR {formatPKR(pnlData.net_profit)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-black">
                        {pnlData.net_profit_margin_pct}%
                      </TableCell>
                      <TableCell className="print:hidden"></TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================================================================== */}
        {/* ===================== TAB 2: BALANCE SHEET ========================= */}
        {/* ==================================================================== */}
        <TabsContent value="balance-sheet" className="space-y-6 m-0">
          {/* Balance Sheet Filter Card */}
          <Card className="print:hidden border shadow-sm">
            <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">
                    As of Date:
                  </Label>
                  <Input
                    type="date"
                    value={bsAsOfDate}
                    onChange={(e) => setBsAsOfDate(e.target.value)}
                    className="h-8 w-40 text-xs"
                  />
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 text-xs font-medium"
                  onClick={fetchBalanceSheet}
                >
                  Apply Filter
                </Button>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-muted-foreground mr-1">
                  Quick Dates:
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => applyBsPreset("today")}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => applyBsPreset("end-last-month")}
                >
                  End Last Month
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => applyBsPreset("end-last-quarter")}
                >
                  End Last Quarter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => applyBsPreset("end-last-year")}
                >
                  End Last Year
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Balance Sheet Top KPI & Equilibrium Cards */}
          {bsData && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Assets */}
              <Card className="border-l-4 border-l-blue-500 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-muted-foreground mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Total Assets
                    </span>
                    <IconReceipt2 className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold tracking-tight text-blue-600">
                    PKR {formatPKR(bsData.total_assets)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Current: PKR {formatPKR(bsData.total_current_assets)} • Fixed: PKR {formatPKR(bsData.total_non_current_assets)}
                  </p>
                </CardContent>
              </Card>

              {/* Total Liabilities */}
              <Card className="border-l-4 border-l-amber-500 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-muted-foreground mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Total Liabilities
                    </span>
                    <IconCoin className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="text-2xl font-bold tracking-tight text-amber-600">
                    PKR {formatPKR(bsData.total_liabilities)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Current: PKR {formatPKR(bsData.total_current_liabilities)} • Long-Term: PKR {formatPKR(bsData.total_long_term_liabilities)}
                  </p>
                </CardContent>
              </Card>

              {/* Total Equity */}
              <Card className="border-l-4 border-l-purple-500 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-muted-foreground mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Total Equity
                    </span>
                    <IconLayersLinked className="h-4 w-4 text-purple-500" />
                  </div>
                  <div className="text-2xl font-bold tracking-tight text-purple-600">
                    PKR {formatPKR(bsData.total_equity)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Capital: {formatPKR(bsData.total_equity_capital)} + Net Profit: {formatPKR(bsData.current_period_net_profit)}
                  </p>
                </CardContent>
              </Card>

              {/* Equilibrium Status Badge */}
              <Card
                className={`border-l-4 shadow-sm ${
                  bsData.is_balanced
                    ? "border-l-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10"
                    : "border-l-rose-500 bg-rose-50/20 dark:bg-rose-950/10"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-muted-foreground mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Equilibrium Invariant
                    </span>
                    {bsData.is_balanced ? (
                      <IconShieldCheck className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <IconAlertTriangle className="h-4 w-4 text-rose-600" />
                    )}
                  </div>
                  <div
                    className={`text-2xl font-bold tracking-tight ${
                      bsData.is_balanced ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {bsData.is_balanced ? "0.00 (Balanced)" : `Δ PKR ${formatPKR(bsData.discrepancy)}`}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Badge
                      className={`text-[11px] font-semibold ${
                        bsData.is_balanced
                          ? "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30"
                          : "bg-rose-500/15 text-rose-700 border border-rose-500/30"
                      }`}
                    >
                      {bsData.is_balanced ? "Assets = Liab + Equity ✓" : "Out of Equilibrium"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Balance Sheet Detailed Tables Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT COLUMN: ASSETS */}
            <Card className="border shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                <CardHeader className="bg-blue-50/50 dark:bg-blue-950/20 border-b py-3 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold text-blue-900 dark:text-blue-200">
                      1. ASSETS
                    </CardTitle>
                    <Badge variant="outline" className="border-blue-400 text-blue-600 font-mono text-xs">
                      PKR {formatPKR(bsData?.total_assets || 0)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-muted/10">
                      <TableRow>
                        <TableHead className="w-[100px] font-semibold">Code</TableHead>
                        <TableHead className="font-semibold">Account</TableHead>
                        <TableHead className="text-right w-[140px] font-semibold">Balance (PKR)</TableHead>
                        <TableHead className="w-[50px] print:hidden"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Current Assets */}
                      <TableRow className="bg-muted/30 font-bold border-b">
                        <TableCell colSpan={4} className="text-xs uppercase tracking-wider text-muted-foreground">
                          Current Assets
                        </TableCell>
                      </TableRow>
                      {bsData?.current_assets && bsData.current_assets.length > 0 ? (
                        bsData.current_assets.map((l) => (
                          <TableRow
                            key={`ca-${l.account_id}`}
                            className="hover:bg-muted/40 transition-colors group cursor-pointer"
                            onClick={() => router.push(`/accounting/ledger?account_id=${l.account_id}`)}
                          >
                            <TableCell className="font-mono text-xs text-muted-foreground font-semibold">
                              {l.account_code}
                            </TableCell>
                            <TableCell className="text-sm font-medium">
                              {l.account_name}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm font-semibold">
                              {formatPKR(l.balance)}
                            </TableCell>
                            <TableCell className="text-center print:hidden">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/accounting/ledger?account_id=${l.account_id}`);
                                }}
                              >
                                <IconArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-2">
                            No current assets recorded.
                          </TableCell>
                        </TableRow>
                      )}
                      <TableRow className="bg-muted/15 font-semibold border-b">
                        <TableCell colSpan={2} className="text-right text-xs">
                          Subtotal Current Assets:
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-bold text-blue-600">
                          PKR {formatPKR(bsData?.total_current_assets || 0)}
                        </TableCell>
                        <TableCell className="print:hidden"></TableCell>
                      </TableRow>

                      {/* Non-Current Assets */}
                      <TableRow className="bg-muted/30 font-bold border-b">
                        <TableCell colSpan={4} className="text-xs uppercase tracking-wider text-muted-foreground">
                          Non-Current / Fixed Assets
                        </TableCell>
                      </TableRow>
                      {bsData?.non_current_assets && bsData.non_current_assets.length > 0 ? (
                        bsData.non_current_assets.map((l) => (
                          <TableRow
                            key={`nca-${l.account_id}`}
                            className="hover:bg-muted/40 transition-colors group cursor-pointer"
                            onClick={() => router.push(`/accounting/ledger?account_id=${l.account_id}`)}
                          >
                            <TableCell className="font-mono text-xs text-muted-foreground font-semibold">
                              {l.account_code}
                            </TableCell>
                            <TableCell className="text-sm font-medium">
                              {l.account_name}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm font-semibold">
                              {formatPKR(l.balance)}
                            </TableCell>
                            <TableCell className="text-center print:hidden">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/accounting/ledger?account_id=${l.account_id}`);
                                }}
                              >
                                <IconArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-2">
                            No fixed assets recorded.
                          </TableCell>
                        </TableRow>
                      )}
                      <TableRow className="bg-muted/15 font-semibold border-b">
                        <TableCell colSpan={2} className="text-right text-xs">
                          Subtotal Non-Current Assets:
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-bold text-blue-600">
                          PKR {formatPKR(bsData?.total_non_current_assets || 0)}
                        </TableCell>
                        <TableCell className="print:hidden"></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </div>

              {/* TOTAL ASSETS GRAND SUMMARY */}
              <div className="bg-blue-100/70 dark:bg-blue-950/40 border-t-2 border-blue-400 p-4 flex items-center justify-between">
                <span className="font-extrabold text-sm uppercase tracking-wider text-blue-950 dark:text-blue-100">
                  TOTAL ASSETS
                </span>
                <span className="font-mono text-lg font-black text-blue-700 dark:text-blue-300">
                  PKR {formatPKR(bsData?.total_assets || 0)}
                </span>
              </div>
            </Card>

            {/* RIGHT COLUMN: LIABILITIES & EQUITY */}
            <Card className="border shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                <CardHeader className="bg-purple-50/50 dark:bg-purple-950/20 border-b py-3 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold text-purple-900 dark:text-purple-200">
                      2 & 3. LIABILITIES & EQUITY
                    </CardTitle>
                    <Badge variant="outline" className="border-purple-400 text-purple-600 font-mono text-xs">
                      PKR {formatPKR(bsData?.total_liabilities_and_equity || 0)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-muted/10">
                      <TableRow>
                        <TableHead className="w-[100px] font-semibold">Code</TableHead>
                        <TableHead className="font-semibold">Account</TableHead>
                        <TableHead className="text-right w-[140px] font-semibold">Balance (PKR)</TableHead>
                        <TableHead className="w-[50px] print:hidden"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* --- LIABILITIES SECTION --- */}
                      <TableRow className="bg-amber-50/40 dark:bg-amber-950/20 font-bold border-b">
                        <TableCell colSpan={4} className="text-xs uppercase tracking-wider text-amber-900 dark:text-amber-200">
                          Current Liabilities
                        </TableCell>
                      </TableRow>
                      {bsData?.current_liabilities && bsData.current_liabilities.length > 0 ? (
                        bsData.current_liabilities.map((l) => (
                          <TableRow
                            key={`cl-${l.account_id}`}
                            className="hover:bg-muted/40 transition-colors group cursor-pointer"
                            onClick={() => router.push(`/accounting/ledger?account_id=${l.account_id}`)}
                          >
                            <TableCell className="font-mono text-xs text-muted-foreground font-semibold">
                              {l.account_code}
                            </TableCell>
                            <TableCell className="text-sm font-medium">
                              {l.account_name}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm font-semibold">
                              {formatPKR(l.balance)}
                            </TableCell>
                            <TableCell className="text-center print:hidden">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/accounting/ledger?account_id=${l.account_id}`);
                                }}
                              >
                                <IconArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-2">
                            No current liabilities.
                          </TableCell>
                        </TableRow>
                      )}
                      <TableRow className="bg-muted/15 font-semibold border-b">
                        <TableCell colSpan={2} className="text-right text-xs">
                          Subtotal Liabilities:
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-bold text-amber-600">
                          PKR {formatPKR(bsData?.total_liabilities || 0)}
                        </TableCell>
                        <TableCell className="print:hidden"></TableCell>
                      </TableRow>

                      {/* --- EQUITY SECTION --- */}
                      <TableRow className="bg-purple-50/40 dark:bg-purple-950/20 font-bold border-b">
                        <TableCell colSpan={4} className="text-xs uppercase tracking-wider text-purple-900 dark:text-purple-200">
                          Owner's Equity & Reserves
                        </TableCell>
                      </TableRow>
                      {bsData?.equity_lines && bsData.equity_lines.map((l) => (
                        <TableRow
                          key={`eq-${l.account_id}`}
                          className="hover:bg-muted/40 transition-colors group cursor-pointer"
                          onClick={() => router.push(`/accounting/ledger?account_id=${l.account_id}`)}
                        >
                          <TableCell className="font-mono text-xs text-muted-foreground font-semibold">
                            {l.account_code}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {l.account_name}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm font-semibold">
                            {formatPKR(l.balance)}
                          </TableCell>
                          <TableCell className="text-center print:hidden">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/accounting/ledger?account_id=${l.account_id}`);
                              }}
                            >
                              <IconArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}

                      {/* Transferred Net Profit Line */}
                      <TableRow className="bg-emerald-50/50 dark:bg-emerald-950/20 font-semibold border-t">
                        <TableCell className="font-mono text-xs text-emerald-600 font-bold">
                          P&L
                        </TableCell>
                        <TableCell className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                          Current Period Net Profit (Transfer)
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400">
                          PKR {formatPKR(bsData?.current_period_net_profit || 0)}
                        </TableCell>
                        <TableCell className="print:hidden"></TableCell>
                      </TableRow>

                      <TableRow className="bg-muted/15 font-semibold border-b">
                        <TableCell colSpan={2} className="text-right text-xs">
                          Subtotal Equity:
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-bold text-purple-600">
                          PKR {formatPKR(bsData?.total_equity || 0)}
                        </TableCell>
                        <TableCell className="print:hidden"></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </div>

              {/* TOTAL LIABILITIES & EQUITY GRAND SUMMARY */}
              <div className="bg-purple-100/70 dark:bg-purple-950/40 border-t-2 border-purple-400 p-4 flex items-center justify-between">
                <span className="font-extrabold text-sm uppercase tracking-wider text-purple-950 dark:text-purple-100">
                  TOTAL LIABILITIES & EQUITY
                </span>
                <span className="font-mono text-lg font-black text-purple-700 dark:text-purple-300">
                  PKR {formatPKR(bsData?.total_liabilities_and_equity || 0)}
                </span>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ---------------- Print-Only Signatures Block ---------------- */}
      <div className="hidden print:block mt-16 pt-8 border-t">
        <div className="grid grid-cols-3 gap-8 text-center text-xs">
          <div className="space-y-6">
            <div className="border-b border-gray-400 w-3/4 mx-auto"></div>
            <p className="font-semibold text-gray-700">Prepared By (Accountant)</p>
          </div>
          <div className="space-y-6">
            <div className="border-b border-gray-400 w-3/4 mx-auto"></div>
            <p className="font-semibold text-gray-700">Verified By (Internal Auditor)</p>
          </div>
          <div className="space-y-6">
            <div className="border-b border-gray-400 w-3/4 mx-auto"></div>
            <p className="font-semibold text-gray-700">Approved By (CFO / Business Owner)</p>
          </div>
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-8">
          Generated automatically by Paperless Business OS • Strict Double-Entry Equilibrium Verified
        </p>
      </div>

      {/* ---------------- Fiscal Year Closing Dialog (Phase 7.2) ---------------- */}
      <Dialog open={closingDialogOpen} onOpenChange={setClosingDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-w-[95vw] w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 pr-6">
              <IconLock className="h-5 w-5 text-purple-600 flex-shrink-0" />
              <DialogTitle className="text-xl">Fiscal Year-End Closing (IFRS / GAAP)</DialogTitle>
            </div>
            <DialogDescription>
              Formally closes the fiscal period by zeroing all temporary revenue and expense accounts and transferring net profit or loss into Retained Earnings (3020).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Date and Branch controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/20 p-3 rounded-lg border">
              <div className="space-y-1.5">
                <Label htmlFor="closing-date" className="text-xs font-semibold">
                  Fiscal Year Closing Date
                </Label>
                <Input
                  id="closing-date"
                  type="date"
                  value={closingDate}
                  onChange={(e) => setClosingDate(e.target.value)}
                  className="h-9 font-mono text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Closing Notes (Optional)</Label>
                <Input
                  placeholder="e.g., Annual audit closing transfer to Retained Earnings"
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {previewLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
                <IconRefresh className="h-6 w-6 animate-spin text-purple-600" />
                <span className="text-sm">Calculating temporary accounts and closing preview...</span>
              </div>
            ) : closingPreview ? (
              <div className="space-y-4">
                {/* Warning if already closed */}
                {closingPreview.already_closed && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-lg flex items-center gap-2.5 text-amber-800 dark:text-amber-200 text-sm">
                    <IconAlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" />
                    <div>
                      <span className="font-semibold">Fiscal Year Already Closed: </span>
                      {closingPreview.message}
                    </div>
                  </div>
                )}

                {/* Summary KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 p-3 rounded-lg">
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                      Revenue to Close
                    </span>
                    <span className="font-mono text-base font-bold text-emerald-800 dark:text-emerald-200">
                      PKR {formatPKR(closingPreview.total_revenue_to_close)}
                    </span>
                  </div>

                  <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 p-3 rounded-lg">
                    <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">
                      Expenses to Close
                    </span>
                    <span className="font-mono text-base font-bold text-rose-800 dark:text-rose-200">
                      PKR {formatPKR(closingPreview.total_expenses_to_close)}
                    </span>
                  </div>

                  <div className={`p-3 rounded-lg border ${
                    closingPreview.net_profit >= 0
                      ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900"
                      : "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900"
                  }`}>
                    <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider block">
                      {closingPreview.net_profit >= 0 ? "Net Profit Transfer" : "Net Loss Transfer"}
                    </span>
                    <span className={`font-mono text-base font-bold ${
                      closingPreview.net_profit >= 0 ? "text-blue-800 dark:text-blue-200" : "text-amber-800 dark:text-amber-200"
                    }`}>
                      PKR {formatPKR(closingPreview.net_profit)}
                    </span>
                  </div>

                  <div className="bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 p-3 rounded-lg">
                    <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wider block">
                      Projected Retained Earnings
                    </span>
                    <span className="font-mono text-base font-bold text-purple-800 dark:text-purple-200">
                      PKR {formatPKR(closingPreview.retained_earnings_after)}
                    </span>
                  </div>
                </div>

                {/* Account Breakdown Table */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted/40 px-3 py-2 border-b flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Closing Voucher Entries ({closingPreview.lines.length} accounts to zero)
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Period: {closingPreview.financial_year_start} to {closingPreview.financial_year_end}
                    </span>
                  </div>
                  <div className="max-h-56 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="text-xs">
                          <TableHead className="w-[90px]">Code</TableHead>
                          <TableHead>Account Name</TableHead>
                          <TableHead className="w-[110px]">Type</TableHead>
                          <TableHead className="text-right w-[150px]">Current Balance</TableHead>
                          <TableHead className="text-right w-[160px]">Closing Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {closingPreview.lines.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-4">
                              No temporary revenue or expense activity to close for this period.
                            </TableCell>
                          </TableRow>
                        ) : (
                          closingPreview.lines.map((l) => (
                            <TableRow key={l.account_id} className="text-xs">
                              <TableCell className="font-mono font-semibold">{l.account_code}</TableCell>
                              <TableCell className="font-medium">{l.account_name}</TableCell>
                              <TableCell className="capitalize text-muted-foreground">{l.account_type}</TableCell>
                              <TableCell className="text-right font-mono font-semibold">
                                PKR {formatPKR(l.current_balance)}
                              </TableCell>
                              <TableCell className="text-right font-mono font-bold text-purple-700 dark:text-purple-300">
                                {l.closing_action}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Retained Earnings destination note */}
                <div className="text-xs text-muted-foreground bg-muted/20 p-2.5 rounded border flex items-center justify-between">
                  <span>
                    Destination Equity Head: <strong>{closingPreview.retained_earnings_account_name} ({closingPreview.retained_earnings_account_code})</strong>
                  </span>
                  <span>
                    Current Balance: <strong className="font-mono">PKR {formatPKR(closingPreview.retained_earnings_before)}</strong> → Projected: <strong className="font-mono text-purple-600">PKR {formatPKR(closingPreview.retained_earnings_after)}</strong>
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
            <Button
              variant="outline"
              onClick={() => setClosingDialogOpen(false)}
              disabled={executingClose}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExecuteClosing}
              disabled={!closingPreview?.can_close || executingClose || previewLoading}
              className="bg-purple-700 hover:bg-purple-800 text-white gap-1.5"
            >
              <IconLock className={`h-4 w-4 ${executingClose ? "animate-spin" : ""}`} />
              {executingClose ? "Posting Closing Voucher..." : "Execute Year-End Closing"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
