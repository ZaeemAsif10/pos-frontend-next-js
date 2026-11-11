"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import {
  IconCalendarTime,
  IconRefresh,
  IconPrinter,
  IconBrandWhatsapp,
  IconFileText,
  IconAlertTriangle,
  IconCheck,
  IconSearch,
  IconLock,
  IconLockOpen,
  IconBuildingStore,
  IconClock,
  IconArrowRight,
  IconX,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  partyService,
  type CustomerAgingItem,
  type CustomerAgingReportResponse,
  type SupplierAgingItem,
  type SupplierAgingReportResponse,
  type CustomerLedgerResponse,
  type SupplierLedgerResponse,
} from "@/services/party.service";
import { branchService, type BranchItem } from "@/services/branch.service";
import { useAuth } from "@/context/auth-context";

function formatPKR(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return "0.00";
  return Number(val).toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function KhataAgingPage() {
  const { tenant } = useAuth();
  const userPerms = useMemo(() => tenant?.permissions || [], [tenant]);
  const isSuperAdmin = userPerms.includes("*") || userPerms.includes("accounting:manage");
  const canStatement =
    isSuperAdmin ||
    userPerms.includes("accounting:aging:statement") ||
    userPerms.includes("accounting:ledger:view");
  const canWhatsApp =
    isSuperAdmin || userPerms.includes("accounting:aging:whatsapp");
  const canCreditBlock =
    isSuperAdmin ||
    userPerms.includes("accounting:aging:credit_block") ||
    userPerms.includes("customers:edit");

  const [activeTab, setActiveTab] = useState<"receivables" | "payables">("receivables");
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("all");
  const [asOfDate, setAsOfDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "overdue" | "high_risk">("all");

  // Data states
  const [arReport, setArReport] = useState<CustomerAgingReportResponse | null>(null);
  const [apReport, setApReport] = useState<SupplierAgingReportResponse | null>(null);

  // Statement Dialog State
  const [statementOpen, setStatementOpen] = useState(false);
  const [statementLoading, setStatementLoading] = useState(false);
  const [selectedPartyType, setSelectedPartyType] = useState<"customer" | "supplier">("customer");
  const [selectedPartyId, setSelectedPartyId] = useState<number | null>(null);
  const [selectedPartyName, setSelectedPartyName] = useState("");
  const [selectedPartyPhone, setSelectedPartyPhone] = useState("");
  const [customerLedger, setCustomerLedger] = useState<CustomerLedgerResponse | null>(null);
  const [supplierLedger, setSupplierLedger] = useState<SupplierLedgerResponse | null>(null);

  // Fetch branches on mount
  useEffect(() => {
    async function loadBranches() {
      try {
        const res = await branchService.listBranches();
        setBranches(res.branches || []);
      } catch (err: any) {
        console.error("Failed to load branches:", err);
      }
    }
    loadBranches();
  }, []);

  // Fetch Aging Reports
  const fetchAgingData = useCallback(async () => {
    setLoading(true);
    try {
      const branchIdParam =
        selectedBranchId !== "all" ? parseInt(selectedBranchId) : undefined;

      if (activeTab === "receivables") {
        const data = await partyService.getReceivablesAging({
          branch_id: branchIdParam,
          as_of_date: asOfDate,
          search: searchQuery.trim() || undefined,
          filter_type: filterType,
        });
        setArReport(data);
      } else {
        const data = await partyService.getPayablesAging({
          branch_id: branchIdParam,
          as_of_date: asOfDate,
          search: searchQuery.trim() || undefined,
          filter_type: filterType === "high_risk" ? "overdue" : filterType,
        });
        setApReport(data);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to fetch aging analysis report.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedBranchId, asOfDate, searchQuery, filterType]);

  useEffect(() => {
    fetchAgingData();
  }, [fetchAgingData]);

  // Toggle Customer Credit Freeze
  const handleToggleCreditBlock = async (customer: CustomerAgingItem) => {
    if (!canCreditBlock) {
      toast.error("Access denied: You do not have permission to freeze/unfreeze customer credit.");
      return;
    }
    try {
      await partyService.toggleCustomerCreditBlock(customer.customer_id);
      toast.success(
        customer.is_credit_blocked
          ? `Credit unblocked for ${customer.business_name}.`
          : `Credit frozen for ${customer.business_name}.`
      );
      fetchAgingData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update credit block status.");
    }
  };

  // Open Khata Statement Dialog
  const handleOpenStatement = async (type: "customer" | "supplier", id: number, name: string, phone: string) => {
    if (!canStatement) {
      toast.error("Access denied: You do not have permission to view Khata statements.");
      return;
    }
    setSelectedPartyType(type);
    setSelectedPartyId(id);
    setSelectedPartyName(name);
    setSelectedPartyPhone(phone);
    setStatementOpen(true);
    setStatementLoading(true);

    try {
      if (type === "customer") {
        const res = await partyService.getCustomerLedger(id);
        setCustomerLedger(res);
        setSupplierLedger(null);
      } else {
        const res = await partyService.getSupplierLedger(id);
        setSupplierLedger(res);
        setCustomerLedger(null);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to load ledger statement.");
    } finally {
      setStatementLoading(false);
    }
  };

  // Send WhatsApp Khata Reminder
  const handleSendWhatsAppReminder = (
    name: string,
    phone: string,
    balance: number,
    overdue: number,
    oldestDays: number
  ) => {
    if (!canWhatsApp) {
      toast.error("Access denied: You do not have permission to send WhatsApp reminders.");
      return;
    }
    if (!phone) {
      toast.error("No phone number registered for this party.");
      return;
    }

    // Clean phone number (replace leading 0 with 92 for Pakistan if domestic)
    let cleanPhone = phone.replace(/[^0-9]/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "92" + cleanPhone.slice(1);
    }

    const message = encodeURIComponent(
      `Dear ${name},\n\nThis is a polite khata statement reminder from Paperless Business OS.\n\n` +
      `Your current outstanding balance is: *PKR ${formatPKR(balance)}*` +
      (overdue > 0 ? `\nOverdue balance: *PKR ${formatPKR(overdue)}* (${oldestDays} days overdue).` : "") +
      `\n\nPlease arrange payment at your earliest convenience. Thank you for your partnership!`
    );

    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${message}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className={`space-y-6 ${statementOpen ? "print:hidden" : ""}`}>
      {/* ---------------- Print-Only Document Header (Main Schedule) ---------------- */}
      <div className="hidden print:block border-b pb-4 mb-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Paperless Business OS</h1>
          <h2 className="text-base font-bold text-gray-800 mt-0.5">
            {activeTab === "receivables"
              ? "ACCOUNTS RECEIVABLE (CUSTOMER KHATA) AGING SCHEDULE"
              : "ACCOUNTS PAYABLE (SUPPLIER VENDOR) AGING SCHEDULE"}
          </h2>
          <p className="text-xs text-gray-600 mt-1 font-mono">
            As of Date: {asOfDate} • Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* ---------------- Screen Top Toolbar ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Khata & Aging Analysis</h1>
            <Badge variant="outline" className="border-blue-500/40 text-blue-600 bg-blue-500/10 font-medium text-xs">
              IFRS / GAAP Standard
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitor chronological customer and supplier aging buckets, enforce credit limits, and dispatch statements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Branch Filter */}
          <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
            <SelectTrigger className="w-[180px] h-9 text-xs">
              <IconBuildingStore className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches (Consolidated)</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={String(b.id)}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* As of Date */}
          <div className="flex items-center gap-1.5">
            <Input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="h-9 text-xs w-[135px]"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="h-9 gap-1.5"
          >
            <IconPrinter className="h-4 w-4" />
            Print Schedule
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchAgingData}
            disabled={loading}
            className="h-9 gap-1.5"
          >
            <IconRefresh className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ---------------- Main AR vs AP Tabs ---------------- */}
      <div className="border-b print:hidden">
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)}>
          <TabsList className="bg-muted/40 p-1">
            <TabsTrigger value="receivables" className="gap-2 text-xs font-semibold px-4">
              <IconCalendarTime className="h-4 w-4 text-blue-600" />
              Customer Receivables (AR Khata)
              {arReport && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 font-mono">
                  {arReport.customers.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="payables" className="gap-2 text-xs font-semibold px-4">
              <IconBuildingStore className="h-4 w-4 text-purple-600" />
              Supplier Payables (AP Khata)
              {apReport && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 font-mono">
                  {apReport.suppliers.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* ---------------- Summary KPI Cards ---------------- */}
      {activeTab === "receivables" && arReport && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 print:grid-cols-5 print:gap-2">
          {/* Total AR */}
          <Card className="border shadow-sm print:border-gray-400 print:shadow-none">
            <CardContent className="p-3">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Total Receivables
              </span>
              <span className="text-lg font-black font-mono text-blue-700 dark:text-blue-300 print:text-black">
                PKR {formatPKR(arReport.summary.total_receivables)}
              </span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">
                Across {arReport.summary.total_customers_count} accounts
              </span>
            </CardContent>
          </Card>

          {/* Current (0-30d) */}
          <Card className="border shadow-sm print:border-gray-400 print:shadow-none">
            <CardContent className="p-3">
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                Current (0 - 30d)
              </span>
              <span className="text-lg font-black font-mono text-emerald-800 dark:text-emerald-200 print:text-black">
                PKR {formatPKR(arReport.summary.total_current)}
              </span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">
                Within standard terms
              </span>
            </CardContent>
          </Card>

          {/* Total Overdue */}
          <Card
            className={`border shadow-sm print:border-gray-400 print:shadow-none ${
              arReport.summary.total_overdue > 0
                ? "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900"
                : ""
            }`}
          >
            <CardContent className="p-3">
              <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">
                Total Overdue (&gt;30d)
              </span>
              <span className="text-lg font-black font-mono text-rose-800 dark:text-rose-200 print:text-black">
                PKR {formatPKR(arReport.summary.total_overdue)}
              </span>
              <span className="text-[10px] text-rose-600 block mt-0.5">
                {arReport.summary.overdue_customers_count} customers overdue
              </span>
            </CardContent>
          </Card>

          {/* Days Sales Outstanding (DSO) */}
          <Card className="border shadow-sm print:border-gray-400 print:shadow-none">
            <CardContent className="p-3">
              <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wider block">
                Days Sales Out (DSO)
              </span>
              <span className="text-lg font-black font-mono text-purple-800 dark:text-purple-200 print:text-black">
                {arReport.summary.days_sales_outstanding} Days
              </span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">
                Avg. collection turnaround
              </span>
            </CardContent>
          </Card>

          {/* High Risk (&gt;90d) */}
          <Card
            className={`border shadow-sm print:border-gray-400 print:shadow-none ${
              arReport.summary.high_risk_customers_count > 0
                ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900"
                : ""
            }`}
          >
            <CardContent className="p-3">
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                High Risk (&gt;90d)
              </span>
              <span className="text-lg font-black font-mono text-amber-800 dark:text-amber-200 print:text-black">
                PKR {formatPKR(arReport.summary.total_overdue_90_plus)}
              </span>
              <span className="text-[10px] text-amber-600 block mt-0.5">
                {arReport.summary.high_risk_customers_count} accounts past 90 days
              </span>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "payables" && apReport && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 print:grid-cols-4 print:gap-2">
          {/* Total AP */}
          <Card className="border shadow-sm print:border-gray-400 print:shadow-none">
            <CardContent className="p-3">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Total Payables
              </span>
              <span className="text-lg font-black font-mono text-purple-700 dark:text-purple-300 print:text-black">
                PKR {formatPKR(apReport.summary.total_payables)}
              </span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">
                Across {apReport.summary.total_suppliers_count} vendors
              </span>
            </CardContent>
          </Card>

          {/* Current (0-30d) */}
          <Card className="border shadow-sm print:border-gray-400 print:shadow-none">
            <CardContent className="p-3">
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                Current (0 - 30d)
              </span>
              <span className="text-lg font-black font-mono text-emerald-800 dark:text-emerald-200 print:text-black">
                PKR {formatPKR(apReport.summary.total_current)}
              </span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">
                Within supplier terms
              </span>
            </CardContent>
          </Card>

          {/* Overdue Payables */}
          <Card
            className={`border shadow-sm print:border-gray-400 print:shadow-none ${
              apReport.summary.total_overdue > 0
                ? "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900"
                : ""
            }`}
          >
            <CardContent className="p-3">
              <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">
                Overdue Payables
              </span>
              <span className="text-lg font-black font-mono text-rose-800 dark:text-rose-200 print:text-black">
                PKR {formatPKR(apReport.summary.total_overdue)}
              </span>
              <span className="text-[10px] text-rose-600 block mt-0.5">
                {apReport.summary.overdue_suppliers_count} suppliers pending
              </span>
            </CardContent>
          </Card>

          {/* Days Payable Outstanding (DPO) */}
          <Card className="border shadow-sm print:border-gray-400 print:shadow-none">
            <CardContent className="p-3">
              <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider block">
                Days Payable Out (DPO)
              </span>
              <span className="text-lg font-black font-mono text-blue-800 dark:text-blue-200 print:text-black">
                {apReport.summary.days_payable_outstanding} Days
              </span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">
                Avg. supplier payment cycle
              </span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ---------------- Table Card & Controls ---------------- */}
      <Card className="border shadow-sm overflow-hidden print:shadow-none print:border-gray-400 print:rounded-none">
        {/* Table Filters Header (Screen Only) */}
        <div className="bg-muted/30 border-b p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <IconSearch className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={`Search ${activeTab === "receivables" ? "customer" : "supplier"} by name, code, phone...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>

            <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border">
              <Button
                variant={filterType === "all" ? "default" : "ghost"}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => setFilterType("all")}
              >
                All
              </Button>
              <Button
                variant={filterType === "overdue" ? "default" : "ghost"}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => setFilterType("overdue")}
              >
                Overdue Only
              </Button>
              {activeTab === "receivables" && (
                <Button
                  variant={filterType === "high_risk" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 text-xs px-2.5 text-rose-600 hover:text-rose-700"
                  onClick={() => setFilterType("high_risk")}
                >
                  High Risk (&gt;90d)
                </Button>
              )}
            </div>
          </div>

          <div className="text-xs text-muted-foreground font-mono">
            {activeTab === "receivables"
              ? `${arReport?.customers.length || 0} Customers listed`
              : `${apReport?.suppliers.length || 0} Suppliers listed`}
          </div>
        </div>

        {/* ---------------- Aging Matrix Table ---------------- */}
        <CardContent className="p-0">
          <Table className="print:text-[11px]">
            <TableHeader className="bg-muted/10 print:bg-gray-100">
              <TableRow className="print:border-b-2 print:border-gray-400">
                <TableHead className="w-[200px] font-semibold print:text-black print:font-bold">
                  {activeTab === "receivables" ? "Customer / Shop" : "Supplier / Mill"}
                </TableHead>
                <TableHead className="w-[100px] font-semibold print:text-black">
                  {activeTab === "receivables" ? "Credit Terms" : "Terms"}
                </TableHead>
                <TableHead className="text-right w-[120px] font-semibold print:text-black print:font-bold">
                  Total Khata
                </TableHead>
                <TableHead className="text-right w-[110px] font-semibold text-emerald-700 print:text-black">
                  Current (0-30d)
                </TableHead>
                <TableHead className="text-right w-[100px] font-semibold print:text-black">
                  31-60d
                </TableHead>
                <TableHead className="text-right w-[100px] font-semibold print:text-black">
                  61-90d
                </TableHead>
                <TableHead className="text-right w-[100px] font-semibold print:text-black">
                  91-120d
                </TableHead>
                <TableHead className="text-right w-[110px] font-semibold text-rose-700 print:text-black font-bold">
                  &gt;120d
                </TableHead>
                <TableHead className="text-center w-[160px] font-semibold print:hidden">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground text-xs">
                    <IconRefresh className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                    Calculating aging schedule buckets...
                  </TableCell>
                </TableRow>
              ) : activeTab === "receivables" ? (
                arReport?.customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10 text-muted-foreground text-xs">
                      No customer accounts matching filter criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  arReport?.customers.map((c) => (
                    <TableRow
                      key={c.customer_id}
                      className="hover:bg-muted/40 transition-colors print:border-b print:border-gray-300 print:break-inside-avoid"
                    >
                      {/* Customer Info */}
                      <TableCell className="py-2.5">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                            {c.business_name}
                            {c.is_credit_blocked && (
                              <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4 uppercase">
                                Frozen
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {c.code} • {c.phone}
                            {c.area_name && ` • ${c.area_name}`}
                          </div>
                        </div>
                      </TableCell>

                      {/* Terms */}
                      <TableCell className="text-xs font-mono">
                        <div>{c.credit_days > 0 ? `${c.credit_days} Days` : "Immediate"}</div>
                        {c.credit_limit > 0 && (
                          <div className="text-[10px] text-muted-foreground">
                            Limit: {formatPKR(c.credit_limit)}
                          </div>
                        )}
                      </TableCell>

                      {/* Total Balance */}
                      <TableCell className="text-right font-mono font-bold text-sm text-blue-700 dark:text-blue-300 print:text-black">
                        {formatPKR(c.total_receivable)}
                      </TableCell>

                      {/* Current */}
                      <TableCell className="text-right font-mono text-xs text-emerald-700 print:text-black">
                        {c.aging.current > 0 ? formatPKR(c.aging.current) : "-"}
                      </TableCell>

                      {/* 31-60 */}
                      <TableCell className="text-right font-mono text-xs">
                        {c.aging.days_31_60 > 0 ? (
                          <span className="text-amber-700 dark:text-amber-400 font-medium print:text-black">
                            {formatPKR(c.aging.days_31_60)}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>

                      {/* 61-90 */}
                      <TableCell className="text-right font-mono text-xs">
                        {c.aging.days_61_90 > 0 ? (
                          <span className="text-amber-800 dark:text-amber-300 font-semibold print:text-black">
                            {formatPKR(c.aging.days_61_90)}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>

                      {/* 91-120 */}
                      <TableCell className="text-right font-mono text-xs">
                        {c.aging.days_91_120 > 0 ? (
                          <span className="text-rose-600 font-bold print:text-black">
                            {formatPKR(c.aging.days_91_120)}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>

                      {/* Over 120 */}
                      <TableCell className="text-right font-mono text-xs">
                        {c.aging.over_120 > 0 ? (
                          <span className="text-rose-700 font-black print:text-black">
                            {formatPKR(c.aging.over_120)}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>

                      {/* Action Buttons */}
                      <TableCell className="text-center print:hidden">
                        <div className="flex items-center justify-center gap-1">
                          {/* Statement button */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs gap-1"
                            disabled={!canStatement}
                            onClick={() =>
                              handleOpenStatement("customer", c.customer_id, c.business_name, c.phone)
                            }
                            title={
                              canStatement
                                ? "View Running Ledger Statement"
                                : "Permission required: accounting:aging:statement"
                            }
                          >
                            <IconFileText className="h-3.5 w-3.5 text-blue-600" />
                            Khata
                          </Button>

                          {/* WhatsApp Reminder */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs text-emerald-700 hover:text-emerald-800 gap-1"
                            disabled={!canWhatsApp}
                            onClick={() =>
                              handleSendWhatsAppReminder(
                                c.business_name,
                                c.phone,
                                c.total_receivable,
                                c.overdue_amount,
                                c.oldest_unpaid_days
                              )
                            }
                            title={
                              canWhatsApp
                                ? "Send WhatsApp Khata Reminder"
                                : "Permission required: accounting:aging:whatsapp"
                            }
                          >
                            <IconBrandWhatsapp className="h-3.5 w-3.5 text-emerald-600" />
                          </Button>

                          {/* Credit Freeze toggle */}
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={!canCreditBlock}
                            className={`h-7 px-1.5 ${
                              c.is_credit_blocked
                                ? "text-rose-600 hover:text-rose-700"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                            onClick={() => handleToggleCreditBlock(c)}
                            title={
                              !canCreditBlock
                                ? "Permission required: accounting:aging:credit_block"
                                : c.is_credit_blocked
                                ? "Unfreeze Credit"
                                : "Freeze Credit (Stop Invoicing)"
                            }
                          >
                            {c.is_credit_blocked ? (
                              <IconLock className="h-3.5 w-3.5 text-rose-600" />
                            ) : (
                              <IconLockOpen className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )
              ) : apReport?.suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-muted-foreground text-xs">
                    No supplier vendor accounts matching filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                apReport?.suppliers.map((s) => (
                  <TableRow
                    key={s.supplier_id}
                    className="hover:bg-muted/40 transition-colors print:border-b print:border-gray-300 print:break-inside-avoid"
                  >
                    {/* Supplier Info */}
                    <TableCell className="py-2.5">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-sm text-foreground">
                          {s.company_name}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {s.code} • {s.phone}
                          {s.contact_person && ` • Attn: ${s.contact_person}`}
                        </div>
                      </div>
                    </TableCell>

                    {/* Terms */}
                    <TableCell className="text-xs font-mono">
                      <div>{s.payment_terms_days} Days</div>
                      <div className="text-[10px] text-muted-foreground">Standard Net</div>
                    </TableCell>

                    {/* Total Balance */}
                    <TableCell className="text-right font-mono font-bold text-sm text-purple-700 dark:text-purple-300 print:text-black">
                      {formatPKR(s.total_payable)}
                    </TableCell>

                    {/* Current */}
                    <TableCell className="text-right font-mono text-xs text-emerald-700 print:text-black">
                      {s.aging.current > 0 ? formatPKR(s.aging.current) : "-"}
                    </TableCell>

                    {/* 31-60 */}
                    <TableCell className="text-right font-mono text-xs">
                      {s.aging.days_31_60 > 0 ? (
                        <span className="text-amber-700 font-medium print:text-black">
                          {formatPKR(s.aging.days_31_60)}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>

                    {/* 61-90 */}
                    <TableCell className="text-right font-mono text-xs">
                      {s.aging.days_61_90 > 0 ? (
                        <span className="text-amber-800 font-semibold print:text-black">
                          {formatPKR(s.aging.days_61_90)}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>

                    {/* 91-120 */}
                    <TableCell className="text-right font-mono text-xs">
                      {s.aging.days_91_120 > 0 ? (
                        <span className="text-rose-600 font-bold print:text-black">
                          {formatPKR(s.aging.days_91_120)}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>

                    {/* Over 120 */}
                    <TableCell className="text-right font-mono text-xs">
                      {s.aging.over_120 > 0 ? (
                        <span className="text-rose-700 font-black print:text-black">
                          {formatPKR(s.aging.over_120)}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-center print:hidden">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs gap-1"
                          disabled={!canStatement}
                          onClick={() =>
                            handleOpenStatement("supplier", s.supplier_id, s.company_name, s.phone)
                          }
                          title={
                            canStatement
                              ? "View Vendor Ledger Statement"
                              : "Permission required: accounting:aging:statement"
                          }
                        >
                          <IconFileText className="h-3.5 w-3.5 text-purple-600" />
                          Ledger
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs text-emerald-700 hover:text-emerald-800 gap-1"
                          disabled={!canWhatsApp}
                          onClick={() =>
                            handleSendWhatsAppReminder(
                              s.company_name,
                              s.phone,
                              s.total_payable,
                              s.overdue_amount,
                              s.oldest_unpaid_days
                            )
                          }
                          title={
                            canWhatsApp
                              ? "WhatsApp Vendor Statement"
                              : "Permission required: accounting:aging:whatsapp"
                          }
                        >
                          <IconBrandWhatsapp className="h-3.5 w-3.5 text-emerald-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>

            {/* Totals Footer Row */}
            <TableFooter className="bg-muted/40 print:bg-gray-100 font-bold border-t-2 print:border-gray-500">
              {activeTab === "receivables" && arReport ? (
                <TableRow className="print:border-b-2 print:border-gray-500 text-xs">
                  <TableCell colSpan={2} className="print:text-black font-bold">
                    TOTAL RECEIVABLES ({arReport.customers.length} Accounts)
                  </TableCell>
                  <TableCell className="text-right font-mono text-blue-700 font-bold print:text-black whitespace-nowrap">
                    PKR {formatPKR(arReport.summary.total_receivables)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-emerald-700 font-bold print:text-black whitespace-nowrap">
                    PKR {formatPKR(arReport.summary.total_current)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-amber-700 font-bold print:text-black whitespace-nowrap">
                    PKR {formatPKR(arReport.summary.total_overdue_30_plus)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-amber-800 font-bold print:text-black whitespace-nowrap">
                    PKR {formatPKR(arReport.summary.total_overdue_60_plus)}
                  </TableCell>
                  <TableCell colSpan={2} className="text-right font-mono text-rose-700 font-bold print:text-black whitespace-nowrap">
                    PKR {formatPKR(arReport.summary.total_overdue_90_plus)}
                  </TableCell>
                  <TableCell className="print:hidden"></TableCell>
                </TableRow>
              ) : activeTab === "payables" && apReport ? (
                <TableRow className="print:border-b-2 print:border-gray-500 text-xs">
                  <TableCell colSpan={2} className="print:text-black font-bold">
                    TOTAL PAYABLES ({apReport.suppliers.length} Vendors)
                  </TableCell>
                  <TableCell className="text-right font-mono text-purple-700 font-bold print:text-black whitespace-nowrap">
                    PKR {formatPKR(apReport.summary.total_payables)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-emerald-700 font-bold print:text-black whitespace-nowrap">
                    PKR {formatPKR(apReport.summary.total_current)}
                  </TableCell>
                  <TableCell colSpan={4} className="text-right font-mono text-rose-700 font-bold print:text-black whitespace-nowrap">
                    PKR {formatPKR(apReport.summary.total_overdue)} Overdue
                  </TableCell>
                  <TableCell className="print:hidden"></TableCell>
                </TableRow>
              ) : null}
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      {/* ---------------- Print-Only Signatures Block (Main Schedule) ---------------- */}
      <div className="hidden print:block mt-12 pt-6 border-t border-gray-400 print:break-inside-avoid">
        <div className="grid grid-cols-3 gap-8 text-center text-xs">
          <div className="space-y-6">
            <div className="border-b border-gray-400 w-3/4 mx-auto"></div>
            <p className="font-semibold text-gray-700">Prepared By (Credit Officer)</p>
          </div>
          <div className="space-y-6">
            <div className="border-b border-gray-400 w-3/4 mx-auto"></div>
            <p className="font-semibold text-gray-700">Verified By (Chief Accountant)</p>
          </div>
          <div className="space-y-6">
            <div className="border-b border-gray-400 w-3/4 mx-auto"></div>
            <p className="font-semibold text-gray-700">Approved By (Director / CFO)</p>
          </div>
        </div>
        <p className="text-[10px] text-gray-500 text-center mt-6">
          Official Double-Entry Aging Schedule • Paperless Business OS
        </p>
      </div>

      {/* =========================================================================
          KHATA STATEMENT MODAL (Running Balance Ledger + A4 Print + WhatsApp)
          ========================================================================= */}
      <Dialog
        open={statementOpen}
        onOpenChange={(open) => {
          setStatementOpen(open);
          if (!open) {
            setCustomerLedger(null);
            setSupplierLedger(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-4xl max-w-[96vw] w-full max-h-[92vh] overflow-y-auto print:static print:transform-none print:w-full print:max-w-none print:h-auto print:max-h-none print:overflow-visible print:border-none print:shadow-none print:p-0 print:m-0 print:ring-0 print:bg-white">
          {statementLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-muted-foreground gap-2">
              <IconRefresh className="h-7 w-7 animate-spin text-primary" />
              <span className="text-sm font-medium">Loading ledger statement...</span>
            </div>
          ) : (
            <div className="space-y-4 print:space-y-6">
              {/* ---------------- Print-Only Statement Header ---------------- */}
              <div className="hidden print:block mb-6 border-b pb-4">
                <div className="text-center">
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900">Paperless Business OS</h1>
                  <h2 className="text-lg font-bold text-gray-800 mt-0.5">
                    {selectedPartyType === "customer" ? "CUSTOMER KHATA STATEMENT" : "SUPPLIER VENDOR STATEMENT"}
                  </h2>
                  <p className="text-xs text-gray-800 font-semibold mt-1">
                    Party: {selectedPartyName} • Phone: {selectedPartyPhone}
                  </p>
                  <p className="text-xs text-gray-600 font-mono mt-0.5">
                    Statement Date: {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Dialog Screen Header */}
              <DialogHeader className="print:hidden">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3 pr-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <IconFileText className="h-5 w-5 text-primary" />
                      <DialogTitle className="text-xl">
                        {selectedPartyName}
                      </DialogTitle>
                      <Badge variant="outline" className="text-xs font-mono">
                        {selectedPartyType === "customer" ? "Customer Khata" : "Vendor Khata"}
                      </Badge>
                    </div>
                    <DialogDescription className="text-xs mt-0.5">
                      Phone: <strong>{selectedPartyPhone || "Not provided"}</strong> • Double-entry running balance statement
                    </DialogDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 h-8 text-xs shadow-sm"
                      disabled={!canStatement}
                      onClick={() => window.print()}
                      title={canStatement ? "Print Statement" : "Permission required: accounting:aging:statement"}
                    >
                      <IconPrinter className="h-3.5 w-3.5" />
                      Print Statement
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 h-8 text-xs text-emerald-700 shadow-sm"
                      disabled={!canWhatsApp}
                      onClick={() => {
                        const bal =
                          selectedPartyType === "customer"
                            ? customerLedger?.summary.closing_balance || 0
                            : supplierLedger?.summary.closing_balance || 0;
                        handleSendWhatsAppReminder(selectedPartyName, selectedPartyPhone, bal, 0, 0);
                      }}
                      title={canWhatsApp ? "Send WhatsApp Statement" : "Permission required: accounting:aging:whatsapp"}
                    >
                      <IconBrandWhatsapp className="h-3.5 w-3.5 text-emerald-600" />
                      WhatsApp
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              {/* Statement Summary KPI Cards */}
              {selectedPartyType === "customer" && customerLedger && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="border rounded-lg p-2.5 bg-muted/20">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Opening Balance</span>
                    <span className="font-mono text-sm font-bold">PKR {formatPKR(customerLedger.summary.opening_balance)}</span>
                  </div>
                  <div className="border rounded-lg p-2.5 bg-muted/20">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Total Invoiced (Dr)</span>
                    <span className="font-mono text-sm font-bold text-blue-600">PKR {formatPKR(customerLedger.summary.total_debit)}</span>
                  </div>
                  <div className="border rounded-lg p-2.5 bg-muted/20">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Total Recovered (Cr)</span>
                    <span className="font-mono text-sm font-bold text-emerald-600">PKR {formatPKR(customerLedger.summary.total_credit)}</span>
                  </div>
                  <div className="border rounded-lg p-2.5 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200">
                    <span className="text-[10px] text-blue-700 dark:text-blue-300 uppercase font-semibold block">Net Payable Balance</span>
                    <span className="font-mono text-base font-black text-blue-800 dark:text-blue-200">
                      PKR {formatPKR(customerLedger.summary.closing_balance)}
                    </span>
                  </div>
                </div>
              )}

              {selectedPartyType === "supplier" && supplierLedger && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="border rounded-lg p-2.5 bg-muted/20">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Opening Balance</span>
                    <span className="font-mono text-sm font-bold">PKR {formatPKR(supplierLedger.summary.opening_balance)}</span>
                  </div>
                  <div className="border rounded-lg p-2.5 bg-muted/20">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Total Purchases (Cr)</span>
                    <span className="font-mono text-sm font-bold text-purple-600">PKR {formatPKR(supplierLedger.summary.total_purchases)}</span>
                  </div>
                  <div className="border rounded-lg p-2.5 bg-muted/20">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Total Paid (Dr)</span>
                    <span className="font-mono text-sm font-bold text-emerald-600">PKR {formatPKR(supplierLedger.summary.total_paid)}</span>
                  </div>
                  <div className="border rounded-lg p-2.5 bg-purple-50/50 dark:bg-purple-950/20 border-purple-200">
                    <span className="text-[10px] text-purple-700 dark:text-purple-300 uppercase font-semibold block">Net Balance Due</span>
                    <span className="font-mono text-base font-black text-purple-800 dark:text-purple-200">
                      PKR {formatPKR(supplierLedger.summary.closing_balance)}
                    </span>
                  </div>
                </div>
              )}

              {/* Transactions Table */}
              <div className="border rounded-lg overflow-hidden print:border print:rounded-none">
                <Table className="print:text-[11px]">
                  <TableHeader className="bg-muted/10 print:bg-gray-100">
                    <TableRow className="print:border-b-2 print:border-gray-400">
                      <TableHead className="w-[95px] print:w-[13%] font-semibold print:text-black">Date</TableHead>
                      <TableHead className="w-[125px] print:w-[16%] font-semibold print:text-black">Reference #</TableHead>
                      <TableHead className="print:w-[35%] font-semibold print:text-black">Description</TableHead>
                      <TableHead className="text-right w-[110px] print:w-[12%] font-semibold print:text-black">
                        Debit (Dr)
                      </TableHead>
                      <TableHead className="text-right w-[110px] print:w-[12%] font-semibold print:text-black">
                        Credit (Cr)
                      </TableHead>
                      <TableHead className="text-right w-[120px] print:w-[12%] font-semibold print:text-black font-bold">
                        Balance
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {selectedPartyType === "customer" ? (
                      customerLedger?.entries.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-xs">
                            No ledger entries found for this customer.
                          </TableCell>
                        </TableRow>
                      ) : (
                        customerLedger?.entries.map((entry) => (
                          <TableRow
                            key={`${entry.entry_type}-${entry.id}-${entry.reference}`}
                            className="text-xs hover:bg-muted/40 transition-colors print:border-b print:border-gray-300"
                          >
                            <TableCell className="font-mono text-muted-foreground print:text-black">
                              {new Date(entry.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="font-mono font-semibold text-blue-600 print:text-black">
                              {entry.reference}
                            </TableCell>
                            <TableCell className="font-medium whitespace-normal">
                              {entry.description}
                              {entry.notes && (
                                <span className="block text-[11px] text-muted-foreground">
                                  {entry.notes}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono font-semibold text-emerald-600 print:text-black">
                              {entry.debit > 0 ? formatPKR(entry.debit) : "-"}
                            </TableCell>
                            <TableCell className="text-right font-mono font-semibold text-rose-600 print:text-black">
                              {entry.credit > 0 ? formatPKR(entry.credit) : "-"}
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold text-foreground print:text-black">
                              PKR {formatPKR(entry.balance)}
                            </TableCell>
                          </TableRow>
                        ))
                      )
                    ) : (
                      supplierLedger?.entries.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-xs">
                            No ledger entries found for this supplier.
                          </TableCell>
                        </TableRow>
                      ) : (
                        supplierLedger?.entries.map((entry) => (
                          <TableRow
                            key={`${entry.entry_type}-${entry.id}-${entry.reference}`}
                            className="text-xs hover:bg-muted/40 transition-colors print:border-b print:border-gray-300"
                          >
                            <TableCell className="font-mono text-muted-foreground print:text-black">
                              {new Date(entry.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="font-mono font-semibold text-purple-600 print:text-black">
                              {entry.reference}
                            </TableCell>
                            <TableCell className="font-medium whitespace-normal">
                              {entry.description}
                              {entry.notes && (
                                <span className="block text-[11px] text-muted-foreground">
                                  {entry.notes}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono font-semibold text-emerald-600 print:text-black">
                              {entry.debit > 0 ? formatPKR(entry.debit) : "-"}
                            </TableCell>
                            <TableCell className="text-right font-mono font-semibold text-rose-600 print:text-black">
                              {entry.credit > 0 ? formatPKR(entry.credit) : "-"}
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold text-foreground print:text-black">
                              PKR {formatPKR(entry.balance)}
                            </TableCell>
                          </TableRow>
                        ))
                      )
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* ---------------- Print-Only Signatures Block (Statement) ---------------- */}
              <div className="hidden print:block mt-12 pt-6 border-t border-gray-400 print:break-inside-avoid">
                <div className="grid grid-cols-3 gap-8 text-center text-xs">
                  <div className="space-y-6">
                    <div className="border-b border-gray-400 w-3/4 mx-auto"></div>
                    <p className="font-semibold text-gray-700">Customer / Supplier Signature</p>
                  </div>
                  <div className="space-y-6">
                    <div className="border-b border-gray-400 w-3/4 mx-auto"></div>
                    <p className="font-semibold text-gray-700">Accountant / Cashier</p>
                  </div>
                  <div className="space-y-6">
                    <div className="border-b border-gray-400 w-3/4 mx-auto"></div>
                    <p className="font-semibold text-gray-700">Approved Authority (Stamp)</p>
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 text-center mt-6">
                  Official Statement of Account • Paperless Business OS
                </p>
              </div>

              {/* Dialog Footer Actions (Screen Only) */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t print:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStatementOpen(false)}
                >
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
