"use client";

import { useEffect, useState, useCallback, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  IconScale,
  IconBook2,
  IconSearch,
  IconRefresh,
  IconPrinter,
  IconCheck,
  IconAlertTriangle,
  IconArrowRight,
  IconCalendar,
  IconBuildingStore,
  IconCoin,
  IconTrendingUp,
  IconTrendingDown,
  IconFileText,
} from "@tabler/icons-react";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  accountingService,
  type AccountItem,
  type TrialBalanceResponse,
  type TrialBalanceItem,
  type GeneralLedgerAccountReport,
} from "@/services/accounting.service";
import { branchService, type BranchItem } from "@/services/branch.service";

function LedgerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialAccountId = searchParams.get("account_id");

  // Tab State
  const [activeTab, setActiveTab] = useState<string>(
    initialAccountId ? "general-ledger" : "trial-balance"
  );

  // Common Data
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Trial Balance State
  const [tbAsOfDate, setTbAsOfDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [tbBranchId, setTbBranchId] = useState<string>("all");
  const [tbData, setTbData] = useState<TrialBalanceResponse | null>(null);
  const [tbLoading, setTbLoading] = useState(false);
  const [tbSearch, setTbSearch] = useState("");
  const [tbTypeFilter, setTbTypeFilter] = useState<string>("all");

  // General Ledger State
  const [glAccountId, setGlAccountId] = useState<string>(initialAccountId || "");
  const [glFromDate, setGlFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1); // 1st of current month
    return d.toISOString().split("T")[0];
  });
  const [glToDate, setGlToDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [glBranchId, setGlBranchId] = useState<string>("all");
  const [glReport, setGlReport] = useState<GeneralLedgerAccountReport | null>(null);
  const [glLoading, setGlLoading] = useState(false);

  // Load Accounts & Branches on mount
  useEffect(() => {
    Promise.all([
      accountingService.listAccounts({ active_only: true }),
      branchService.listBranches().then((res) => res.branches || []).catch(() => []),
    ])
      .then(([accs, brs]) => {
        setAccounts(accs);
        setBranches(brs);

        // If no glAccountId is set yet, default to first Cash or Bank account
        if (!initialAccountId && accs.length > 0) {
          const defaultAcc =
            accs.find((a) => a.code === "1010" || a.name.toLowerCase().includes("cash")) ||
            accs[0];
          setGlAccountId(String(defaultAcc.id));
        }
      })
      .catch((err) => {
        toast.error("Failed to load accounts: " + (err.message || "Unknown error"));
      })
      .finally(() => setLoadingInitial(false));
  }, [initialAccountId]);

  // Fetch Trial Balance
  const fetchTrialBalance = useCallback(async () => {
    setTbLoading(true);
    try {
      const res = await accountingService.getTrialBalance({
        as_of_date: tbAsOfDate || undefined,
        branch_id: tbBranchId !== "all" ? Number(tbBranchId) : undefined,
      });
      setTbData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load Trial Balance";
      toast.error(msg);
    } finally {
      setTbLoading(false);
    }
  }, [tbAsOfDate, tbBranchId]);

  // Fetch General Ledger
  const fetchGeneralLedger = useCallback(
    async (accIdOverride?: string) => {
      const targetId = accIdOverride || glAccountId;
      if (!targetId || targetId === "none") {
        setGlReport(null);
        return;
      }
      setGlLoading(true);
      try {
        const res = await accountingService.getGeneralLedger(Number(targetId), {
          from_date: glFromDate || undefined,
          to_date: glToDate || undefined,
          branch_id: glBranchId !== "all" ? Number(glBranchId) : undefined,
        });
        setGlReport(res);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load General Ledger";
        toast.error(msg);
      } finally {
        setGlLoading(false);
      }
    },
    [glAccountId, glFromDate, glToDate, glBranchId]
  );

  // Initial fetch for Trial Balance
  useEffect(() => {
    fetchTrialBalance();
  }, [fetchTrialBalance]);

  // If initial account ID is present or changes, load GL
  useEffect(() => {
    if (glAccountId && glAccountId !== "none") {
      fetchGeneralLedger(glAccountId);
    }
  }, [glAccountId, fetchGeneralLedger]);

  // Navigate to Ledger for specific account
  const viewAccountLedger = (accId: number) => {
    setGlAccountId(String(accId));
    setActiveTab("general-ledger");
    fetchGeneralLedger(String(accId));
  };

  // Filtered TB Items
  const filteredTbItems = useMemo(() => {
    if (!tbData) return [];
    return tbData.items.filter((item) => {
      const matchesSearch =
        tbSearch === "" ||
        item.account_code.toLowerCase().includes(tbSearch.toLowerCase()) ||
        item.account_name.toLowerCase().includes(tbSearch.toLowerCase());
      const matchesType =
        tbTypeFilter === "all" || item.account_type.toLowerCase() === tbTypeFilter.toLowerCase();
      return matchesSearch && matchesType;
    });
  }, [tbData, tbSearch, tbTypeFilter]);

  const formatPKR = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getAccountTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case "asset":
        return <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">Asset</Badge>;
      case "liability":
        return <Badge variant="secondary" className="bg-amber-600 text-white hover:bg-amber-700">Liability</Badge>;
      case "equity":
        return <Badge variant="outline" className="border-purple-500 text-purple-600">Equity</Badge>;
      case "revenue":
        return <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700">Revenue</Badge>;
      case "expense":
        return <Badge variant="default" className="bg-rose-600 text-white hover:bg-rose-700">Expense</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getSourceTypeBadge = (source: string) => {
    switch (source) {
      case "pos_sale":
        return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">POS Sale</Badge>;
      case "purchase_invoice":
        return <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">Purchase (GRN)</Badge>;
      case "customer_payment":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">Customer Receipt (CRV)</Badge>;
      case "supplier_payment":
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">Supplier Payment (CPV)</Badge>;
      case "manual_jv":
        return <Badge variant="outline" className="border-purple-300 text-purple-700 dark:border-purple-800 dark:text-purple-300">Manual JV</Badge>;
      default:
        return <Badge variant="outline">{source}</Badge>;
    }
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trial Balance & General Ledger</h1>
          <p className="text-sm text-muted-foreground">
            Audit-ready Trial Balance and General Ledger account statements with running balances.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={printReport} className="h-9 gap-1.5">
            <IconPrinter className="h-4 w-4" />
            Print Report
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md print:hidden">
          <TabsTrigger value="trial-balance" className="gap-2">
            <IconScale className="h-4 w-4" />
            Trial Balance
          </TabsTrigger>
          <TabsTrigger value="general-ledger" className="gap-2">
            <IconBook2 className="h-4 w-4" />
            General Ledger Statement
          </TabsTrigger>
        </TabsList>

        {/* -------------------- TAB 1: TRIAL BALANCE -------------------- */}
        <TabsContent value="trial-balance" className="space-y-6">
          {/* Trial Balance Filter Bar */}
          <Card className="print:hidden">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="w-48 space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <IconCalendar className="h-3.5 w-3.5" /> As of Date
                  </Label>
                  <Input
                    type="date"
                    value={tbAsOfDate}
                    onChange={(e) => setTbAsOfDate(e.target.value)}
                    className="h-9"
                  />
                </div>

                <div className="w-52 space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <IconBuildingStore className="h-3.5 w-3.5" /> Branch
                  </Label>
                  <Select value={tbBranchId} onValueChange={setTbBranchId}>
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

                <div className="flex-1 min-w-[200px] space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <IconSearch className="h-3.5 w-3.5" /> Search Account
                  </Label>
                  <Input
                    placeholder="Search by code or account name..."
                    value={tbSearch}
                    onChange={(e) => setTbSearch(e.target.value)}
                    className="h-9"
                  />
                </div>

                <div className="w-40 space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <Select value={tbTypeFilter} onValueChange={setTbTypeFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="asset">Asset</SelectItem>
                      <SelectItem value="liability">Liability</SelectItem>
                      <SelectItem value="equity">Equity</SelectItem>
                      <SelectItem value="revenue">Revenue</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchTrialBalance}
                  disabled={tbLoading}
                  className="h-9 gap-1.5"
                >
                  <IconRefresh className={`h-4 w-4 ${tbLoading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Trial Balance KPI Summary Cards */}
          {tbData && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden">
              <Card className="border-l-4 border-l-blue-600">
                <CardHeader className="py-3 px-4 pb-1">
                  <CardDescription className="text-xs font-semibold tracking-wider uppercase">
                    Total Debits
                  </CardDescription>
                  <CardTitle className="text-xl font-bold text-blue-600">
                    {formatPKR(tbData.total_debits)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 py-2 text-xs text-muted-foreground">
                  Sum of all debit account balances
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-amber-600">
                <CardHeader className="py-3 px-4 pb-1">
                  <CardDescription className="text-xs font-semibold tracking-wider uppercase">
                    Total Credits
                  </CardDescription>
                  <CardTitle className="text-xl font-bold text-amber-600">
                    {formatPKR(tbData.total_credits)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 py-2 text-xs text-muted-foreground">
                  Sum of all credit account balances
                </CardContent>
              </Card>

              <Card
                className={`border-l-4 ${
                  tbData.is_balanced
                    ? "border-l-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20"
                    : "border-l-rose-600 bg-rose-50/50 dark:bg-rose-950/20"
                }`}
              >
                <CardHeader className="py-3 px-4 pb-1">
                  <CardDescription className="text-xs font-semibold tracking-wider uppercase">
                    Equilibrium Status
                  </CardDescription>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    {tbData.is_balanced ? (
                      <>
                        <IconCheck className="h-5 w-5 text-emerald-600" />
                        <span className="text-emerald-700 dark:text-emerald-400">
                          Perfect Equilibrium
                        </span>
                      </>
                    ) : (
                      <>
                        <IconAlertTriangle className="h-5 w-5 text-rose-600" />
                        <span className="text-rose-700 dark:text-rose-400">
                          Diff: {formatPKR(Math.abs(tbData.total_debits - tbData.total_credits))}
                        </span>
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 py-2 text-xs text-muted-foreground">
                  {tbData.is_balanced
                    ? "Double-entry accounting invariant satisfied (Debits = Credits)"
                    : "Action required: Total debits do not match total credits"}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Print Sheet Header (Only visible on print) */}
          <div className="hidden print:block mb-6 border-b pb-4">
            <h1 className="text-2xl font-bold text-center">TRIAL BALANCE REPORT</h1>
            <p className="text-sm text-center text-muted-foreground">
              As of Date: {tbAsOfDate} | Branch:{" "}
              {tbBranchId === "all"
                ? "All Branches (Consolidated)"
                : branches.find((b) => String(b.id) === tbBranchId)?.name || tbBranchId}
            </p>
          </div>

          {/* Trial Balance Table */}
          <Card className="print:border-none print:shadow-none">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Code</TableHead>
                    <TableHead>Account Name</TableHead>
                    <TableHead className="w-28">Type</TableHead>
                    <TableHead className="w-32 hidden md:table-cell">Sub-Type</TableHead>
                    <TableHead className="text-right w-44">Debit Balance (PKR)</TableHead>
                    <TableHead className="text-right w-44">Credit Balance (PKR)</TableHead>
                    <TableHead className="text-right w-24 print:hidden">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tbLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        <IconRefresh className="h-6 w-6 animate-spin mx-auto mb-2" />
                        Calculating Trial Balance...
                      </TableCell>
                    </TableRow>
                  ) : filteredTbItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        No accounts found matching filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTbItems.map((item) => (
                      <TableRow key={item.account_id} className="hover:bg-muted/50">
                        <TableCell className="font-mono font-medium text-xs">
                          {item.account_code}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.account_name}
                        </TableCell>
                        <TableCell>{getAccountTypeBadge(item.account_type)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                          {item.sub_type || "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {item.debit_balance > 0 ? (
                            <span className="text-blue-700 dark:text-blue-400">
                              {formatPKR(item.debit_balance)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {item.credit_balance > 0 ? (
                            <span className="text-amber-700 dark:text-amber-400">
                              {formatPKR(item.credit_balance)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right print:hidden">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={() => viewAccountLedger(item.account_id)}
                          >
                            Ledger
                            <IconArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
            {tbData && (
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-muted/30 border-t font-semibold text-sm gap-2">
                <span className="text-muted-foreground text-xs">
                  Showing {filteredTbItems.length} of {tbData.items.length} accounts
                </span>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground mr-2">Total Debits:</span>
                    <span className="font-mono text-blue-700 dark:text-blue-400">
                      {formatPKR(tbData.total_debits)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground mr-2">Total Credits:</span>
                    <span className="font-mono text-amber-700 dark:text-amber-400">
                      {formatPKR(tbData.total_credits)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* -------------------- TAB 2: GENERAL LEDGER -------------------- */}
        <TabsContent value="general-ledger" className="space-y-6">
          {/* GL Controls Filter Bar */}
          <Card className="print:hidden">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-end gap-3">
                {/* Account Selector */}
                <div className="flex-1 min-w-[260px] space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <IconBook2 className="h-3.5 w-3.5" /> Select Account
                  </Label>
                  <Select value={glAccountId} onValueChange={setGlAccountId}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Choose an account..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {accounts.map((acc) => (
                        <SelectItem key={acc.id} value={String(acc.id)}>
                          <span className="font-mono text-xs font-semibold mr-2">{acc.code}</span>
                          <span>{acc.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({acc.account_type})
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* From Date */}
                <div className="w-44 space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <IconCalendar className="h-3.5 w-3.5" /> From Date
                  </Label>
                  <Input
                    type="date"
                    value={glFromDate}
                    onChange={(e) => setGlFromDate(e.target.value)}
                    className="h-9"
                  />
                </div>

                {/* To Date */}
                <div className="w-44 space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <IconCalendar className="h-3.5 w-3.5" /> To Date
                  </Label>
                  <Input
                    type="date"
                    value={glToDate}
                    onChange={(e) => setGlToDate(e.target.value)}
                    className="h-9"
                  />
                </div>

                {/* Branch */}
                <div className="w-48 space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <IconBuildingStore className="h-3.5 w-3.5" /> Branch
                  </Label>
                  <Select value={glBranchId} onValueChange={setGlBranchId}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All Branches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Branches</SelectItem>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={String(b.id)}>
                          {b.name} ({b.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Submit */}
                <Button
                  onClick={() => fetchGeneralLedger()}
                  disabled={glLoading || !glAccountId}
                  size="sm"
                  className="h-9 gap-1.5"
                >
                  <IconRefresh className={`h-4 w-4 ${glLoading ? "animate-spin" : ""}`} />
                  View Statement
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Header Information */}
          {glReport && (
            <>
              {/* Print Sheet Header (Only on print) */}
              <div className="hidden print:block mb-6 border-b pb-4">
                <h1 className="text-2xl font-bold text-center">GENERAL LEDGER STATEMENT</h1>
                <p className="text-base text-center font-semibold mt-1">
                  [{glReport.account_code}] {glReport.account_name} ({glReport.account_type.toUpperCase()})
                </p>
                <p className="text-xs text-center text-muted-foreground mt-0.5">
                  Period: {glFromDate} to {glToDate} | Branch:{" "}
                  {glBranchId === "all"
                    ? "All Branches"
                    : branches.find((b) => String(b.id) === glBranchId)?.name || glBranchId}
                </p>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
                {/* Opening Balance */}
                <Card>
                  <CardHeader className="py-3 px-4 pb-1">
                    <CardDescription className="text-xs font-semibold tracking-wider uppercase">
                      Opening Balance
                    </CardDescription>
                    <CardTitle className="text-lg font-bold font-mono">
                      {formatPKR(Math.abs(glReport.opening_balance))}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 py-2 text-xs text-muted-foreground">
                    {glReport.opening_balance >= 0 ? (
                      <span className="text-blue-600 font-medium">Debit (Dr)</span>
                    ) : (
                      <span className="text-amber-600 font-medium">Credit (Cr)</span>
                    )}
                  </CardContent>
                </Card>

                {/* Period Debits */}
                <Card>
                  <CardHeader className="py-3 px-4 pb-1">
                    <CardDescription className="text-xs font-semibold tracking-wider uppercase flex items-center gap-1">
                      <IconTrendingUp className="h-3.5 w-3.5 text-blue-600" />
                      Total Debits
                    </CardDescription>
                    <CardTitle className="text-lg font-bold font-mono text-blue-600">
                      {formatPKR(glReport.total_debit)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 py-2 text-xs text-muted-foreground">
                    Debits posted in period
                  </CardContent>
                </Card>

                {/* Period Credits */}
                <Card>
                  <CardHeader className="py-3 px-4 pb-1">
                    <CardDescription className="text-xs font-semibold tracking-wider uppercase flex items-center gap-1">
                      <IconTrendingDown className="h-3.5 w-3.5 text-amber-600" />
                      Total Credits
                    </CardDescription>
                    <CardTitle className="text-lg font-bold font-mono text-amber-600">
                      {formatPKR(glReport.total_credit)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 py-2 text-xs text-muted-foreground">
                    Credits posted in period
                  </CardContent>
                </Card>

                {/* Closing Balance */}
                <Card className="border-l-4 border-l-primary bg-primary/5">
                  <CardHeader className="py-3 px-4 pb-1">
                    <CardDescription className="text-xs font-semibold tracking-wider uppercase">
                      Closing Balance
                    </CardDescription>
                    <CardTitle className="text-lg font-bold font-mono">
                      {formatPKR(Math.abs(glReport.closing_balance))}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 py-2 text-xs text-muted-foreground">
                    {glReport.closing_balance >= 0 ? (
                      <Badge variant="outline" className="text-blue-700 border-blue-300">
                        Net Dr
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-700 border-amber-300">
                        Net Cr
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Transactions Ledger Table */}
              <Card className="print:border-none print:shadow-none">
                <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <span className="font-mono text-primary font-bold">
                        [{glReport.account_code}]
                      </span>
                      <span>{glReport.account_name}</span>
                      {getAccountTypeBadge(glReport.account_type)}
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Currency: {glReport.currency} | Statement entries sorted chronologically
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-28">Date</TableHead>
                        <TableHead className="w-36">Voucher #</TableHead>
                        <TableHead className="w-40">Source</TableHead>
                        <TableHead>Particulars / Narration</TableHead>
                        <TableHead className="w-28 hidden md:table-cell">Branch</TableHead>
                        <TableHead className="text-right w-36">Debit (PKR)</TableHead>
                        <TableHead className="text-right w-36">Credit (PKR)</TableHead>
                        <TableHead className="text-right w-44">Running Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Opening Balance Row */}
                      <TableRow className="bg-muted/40 font-semibold italic text-xs">
                        <TableCell>{glFromDate}</TableCell>
                        <TableCell colSpan={4}>
                          Opening Balance as of {glFromDate}
                        </TableCell>
                        <TableCell className="text-right font-mono">-</TableCell>
                        <TableCell className="text-right font-mono">-</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatPKR(Math.abs(glReport.opening_balance))}{" "}
                          <span className="text-muted-foreground text-[10px]">
                            {glReport.opening_balance >= 0 ? "Dr" : "Cr"}
                          </span>
                        </TableCell>
                      </TableRow>

                      {/* Transaction Rows */}
                      {glLoading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                            <IconRefresh className="h-6 w-6 animate-spin mx-auto mb-2" />
                            Loading transactions...
                          </TableCell>
                        </TableRow>
                      ) : glReport.lines.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="h-28 text-center text-muted-foreground">
                            No transactions posted in this period.
                          </TableCell>
                        </TableRow>
                      ) : (
                        glReport.lines.map((ln) => (
                          <TableRow key={ln.id} className="hover:bg-muted/50 text-xs">
                            <TableCell className="whitespace-nowrap font-medium">
                              {ln.entry_date}
                            </TableCell>
                            <TableCell className="font-mono font-medium">
                              <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[11px]">
                                {ln.entry_number}
                              </span>
                            </TableCell>
                            <TableCell>{getSourceTypeBadge(ln.source_type)}</TableCell>
                            <TableCell className="max-w-md">
                              <p className="truncate font-medium">{ln.narration || "-"}</p>
                              {ln.reference_no && (
                                <p className="text-[11px] text-muted-foreground">
                                  Ref: {ln.reference_no}
                                </p>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground hidden md:table-cell">
                              {ln.branch_name || "-"}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {ln.debit > 0 ? (
                                <span className="text-blue-700 dark:text-blue-400 font-medium">
                                  {formatPKR(ln.debit)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/40">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {ln.credit > 0 ? (
                                <span className="text-amber-700 dark:text-amber-400 font-medium">
                                  {formatPKR(ln.credit)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/40">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold">
                              {formatPKR(Math.abs(ln.running_balance))}{" "}
                              <span className="text-[10px] text-muted-foreground font-normal">
                                {ln.running_balance >= 0 ? "Dr" : "Cr"}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      )}

                      {/* Closing Balance Row */}
                      <TableRow className="bg-muted/40 font-bold text-xs border-t-2">
                        <TableCell>{glToDate}</TableCell>
                        <TableCell colSpan={4}>
                          Closing Balance as of {glToDate}
                        </TableCell>
                        <TableCell className="text-right font-mono text-blue-700 dark:text-blue-400">
                          {formatPKR(glReport.total_debit)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-amber-700 dark:text-amber-400">
                          {formatPKR(glReport.total_credit)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-primary text-sm">
                          {formatPKR(Math.abs(glReport.closing_balance))}{" "}
                          <span className="text-[10px] text-muted-foreground font-normal">
                            {glReport.closing_balance >= 0 ? "Dr" : "Cr"}
                          </span>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}

          {!glReport && !glLoading && (
            <Card className="h-48 flex items-center justify-center text-center text-muted-foreground p-6">
              <div>
                <IconFileText className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
                <p className="font-medium">No Account Selected</p>
                <p className="text-xs mt-1">
                  Select an account above and click "View Statement" to generate its general ledger.
                </p>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AccountingLedgerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <IconRefresh className="h-6 w-6 animate-spin mr-2" />
          Loading Ledger...
        </div>
      }
    >
      <LedgerContent />
    </Suspense>
  );
}
