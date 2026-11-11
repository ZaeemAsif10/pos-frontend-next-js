"use client";

import { useEffect, useState, useCallback, Suspense, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  IconBuildingBank,
  IconRefresh,
  IconPlus,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconShieldCheck,
  IconPrinter,
  IconClock,
  IconArrowsExchange,
  IconSearch,
  IconArrowRight,
  IconFilter,
  IconChecklist,
  IconFileSpreadsheet,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogFooter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  accountingService,
  type BankReconcilableAccountItem,
  type BankReconciliationSummary,
  type BankReconciliationDetailResponse,
  type BankReconciliationTransactionItem,
} from "@/services/accounting.service";
import { useAuth } from "@/context/auth-context";

// Currency Formatter
const formatPKR = (amount: number) => {
  return new Intl.NumberFormat("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

export default function BankReconciliationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          Loading Bank Reconciliations...
        </div>
      }
    >
      <BankReconciliationContent />
    </Suspense>
  );
}

function BankReconciliationContent() {
  const router = useRouter();
  const { tenant } = useAuth();

  const userPerms = useMemo(() => tenant?.permissions || [], [tenant]);
  const isSuperAdmin = userPerms.includes("*") || userPerms.includes("accounting:manage");
  const canCreate = isSuperAdmin || userPerms.includes("accounting:reconciliation:create");
  const canMatch = isSuperAdmin || userPerms.includes("accounting:reconciliation:match");
  const canComplete = isSuperAdmin || userPerms.includes("accounting:reconciliation:complete");

  // State
  const [bankAccounts, setBankAccounts] = useState<BankReconcilableAccountItem[]>([]);
  const [reconciliations, setReconciliations] = useState<BankReconciliationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // New Reconciliation Dialog State
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [stmtDate, setStmtDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [stmtStartDate, setStmtStartDate] = useState<string>("");
  const [stmtEndingBalance, setStmtEndingBalance] = useState<string>("");
  const [sessionNotes, setSessionNotes] = useState<string>("");
  const [creating, setCreating] = useState(false);

  // Active BRS Workspace Dialog State
  const [activeBrsId, setActiveBrsId] = useState<number | null>(null);
  const [brsDetail, setBrsDetail] = useState<BankReconciliationDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "deposits" | "payments" | "cleared" | "in_transit">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [completeNotes, setCompleteNotes] = useState("");

  // Load Data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [accs, recs] = await Promise.all([
        accountingService.getReconcilableBankAccounts(),
        accountingService.listBankReconciliations(),
      ]);
      setBankAccounts(accs);
      setReconciliations(recs);
      if (accs.length > 0 && !selectedAccountId) {
        setSelectedAccountId(String(accs[0].id));
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to load bank reconciliation data.");
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open existing or new session
  const openBrsWorkspace = async (reconciliationId: number) => {
    try {
      setActiveBrsId(reconciliationId);
      setDetailLoading(true);
      const res = await accountingService.getBankReconciliationDetails(reconciliationId);
      setBrsDetail(res);
      setCompleteNotes(res.reconciliation.notes || "");
    } catch (err: any) {
      toast.error(err?.message || "Failed to load reconciliation session.");
      setActiveBrsId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  // Create New Session
  const handleCreateSession = async () => {
    if (!selectedAccountId) {
      toast.error("Please select a bank account.");
      return;
    }
    const endingBal = parseFloat(stmtEndingBalance);
    if (isNaN(endingBal)) {
      toast.error("Please enter a valid statement ending balance.");
      return;
    }

    try {
      setCreating(true);
      const res = await accountingService.createBankReconciliation({
        account_id: parseInt(selectedAccountId),
        statement_date: stmtDate,
        statement_start_date: stmtStartDate ? stmtStartDate : null,
        statement_ending_balance: endingBal,
        notes: sessionNotes.trim() || undefined,
      });
      toast.success(`Reconciliation session ${res.reconciliation.reconciliation_number} started.`);
      setNewDialogOpen(false);
      setStmtEndingBalance("");
      setSessionNotes("");
      fetchData();
      // Directly open workspace
      openBrsWorkspace(res.reconciliation.id);
    } catch (err: any) {
      toast.error(err?.message || "Failed to create reconciliation session.");
    } finally {
      setCreating(false);
    }
  };

  // Toggle single item match
  const handleToggleItem = async (tx: BankReconciliationTransactionItem) => {
    if (!activeBrsId || !brsDetail || brsDetail.reconciliation.status !== "in_progress") return;
    try {
      const isMatchedNow = tx.is_matched;
      const res = await accountingService.matchBankReconciliationItems(activeBrsId, {
        matched_line_ids: isMatchedNow ? [] : [tx.journal_entry_line_id],
        unmatched_line_ids: isMatchedNow ? [tx.journal_entry_line_id] : [],
      });
      setBrsDetail(res);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update transaction status.");
    }
  };

  // Bulk match / unmatch
  const handleBulkMatch = async (matchAll: boolean) => {
    if (!activeBrsId || !brsDetail || brsDetail.reconciliation.status !== "in_progress") return;
    const targetIds = filteredTransactions.map((t) => t.journal_entry_line_id);
    if (targetIds.length === 0) return;

    try {
      const res = await accountingService.matchBankReconciliationItems(activeBrsId, {
        matched_line_ids: matchAll ? targetIds : [],
        unmatched_line_ids: matchAll ? [] : targetIds,
      });
      setBrsDetail(res);
      toast.success(matchAll ? "Selected items marked as cleared." : "Selected items marked as in-transit.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to bulk update transactions.");
    }
  };

  // Complete Reconciliation
  const handleCompleteReconciliation = async () => {
    if (!activeBrsId || !brsDetail) return;
    if (!brsDetail.is_balanced) {
      toast.error(`Cannot complete: Difference of PKR ${formatPKR(brsDetail.reconciliation.difference)} must be 0.00.`);
      return;
    }

    try {
      setCompleting(true);
      const res = await accountingService.completeBankReconciliation(activeBrsId, {
        notes: completeNotes.trim() || undefined,
      });
      toast.success(`Bank reconciliation ${res.reconciliation.reconciliation_number} completed successfully!`);
      setBrsDetail(res);
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to complete bank reconciliation.");
    } finally {
      setCompleting(false);
    }
  };

  // Filtered transactions inside active workspace
  const filteredTransactions = useMemo(() => {
    if (!brsDetail) return [];
    return brsDetail.transactions.filter((t) => {
      // Type filter
      if (filterType === "deposits" && t.debit <= 0) return false;
      if (filterType === "payments" && t.credit <= 0) return false;
      if (filterType === "cleared" && !t.is_matched) return false;
      if (filterType === "in_transit" && t.is_matched) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const ref = (t.reference_no || "").toLowerCase();
        const narr = (t.narration || "").toLowerCase();
        const num = (t.entry_number || "").toLowerCase();
        return ref.includes(q) || narr.includes(q) || num.includes(q);
      }
      return true;
    });
  }, [brsDetail, filterType, searchQuery]);

  const totalDeposits = useMemo(() => {
    return filteredTransactions.reduce((acc, tx) => acc + (tx.debit || 0), 0);
  }, [filteredTransactions]);

  const totalPayments = useMemo(() => {
    return filteredTransactions.reduce((acc, tx) => acc + (tx.credit || 0), 0);
  }, [filteredTransactions]);

  const clearedCount = useMemo(() => {
    return filteredTransactions.filter((tx) => tx.is_matched).length;
  }, [filteredTransactions]);

  return (
    <div className={`space-y-6 ${activeBrsId ? "print:hidden" : ""}`}>
      {/* ---------------- Print-Only Register Header (Main Screen Print) ---------------- */}
      <div className="hidden print:block border-b pb-4 mb-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Paperless Business OS</h1>
          <h2 className="text-base font-bold text-gray-800 mt-0.5">Bank Reconciliation Statements Register & Bank Status</h2>
          <p className="text-xs text-gray-600 mt-1 font-mono">
            Audit Register • Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* ---------------- Screen Top Header ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Bank Reconciliation (BRS)</h1>
            <Badge variant="outline" className="border-blue-500/40 text-blue-600 bg-blue-500/10 font-medium text-xs">
              IFRS / GAAP Compliant
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Reconcile company bank ledgers against bank statements, track deposits in transit, and clear outstanding cheques.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="h-9 gap-1.5"
          >
            <IconPrinter className="h-4 w-4" />
            Print Register
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="h-9 gap-1.5"
          >
            <IconRefresh className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {canCreate && (
            <Button
              size="sm"
              onClick={() => setNewDialogOpen(true)}
              className="h-9 gap-1.5"
            >
              <IconPlus className="h-4 w-4" />
              Start Reconciliation
            </Button>
          )}
        </div>
      </div>

      {/* ---------------- Bank Accounts Overview Grid ---------------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-3 print:mb-4">
        {bankAccounts.map((acc) => (
          <Card key={acc.id} className="border shadow-sm print:shadow-none print:border-gray-400">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <IconBuildingBank className="h-4 w-4 text-blue-600 print:text-black" />
                  <span className="font-bold text-sm tracking-tight">{acc.name}</span>
                </div>
                <div className="text-xs text-muted-foreground print:text-gray-600 font-mono">
                  Code: {acc.code} • {acc.currency}
                </div>
                <div className="text-lg font-black font-mono text-blue-700 dark:text-blue-300 print:text-black">
                  PKR {formatPKR(acc.current_balance)}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <Badge
                  variant={acc.unreconciled_count > 0 ? "secondary" : "outline"}
                  className="text-xs font-mono print:border print:border-gray-400 print:bg-gray-100 print:text-black"
                >
                  {acc.unreconciled_count} Pending
                </Badge>
                {canCreate && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-blue-600 hover:text-blue-700 gap-1 p-1 print:hidden"
                    onClick={() => {
                      setSelectedAccountId(String(acc.id));
                      setNewDialogOpen(true);
                    }}
                  >
                    Reconcile
                    <IconArrowRight className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ---------------- Reconciliation Sessions History ---------------- */}
      <Card className="border shadow-sm overflow-hidden print:shadow-none print:border-gray-400 print:rounded-none">
        <CardHeader className="bg-muted/30 border-b py-3 px-4 print:bg-gray-100 print:border-gray-400">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold print:text-black">Reconciliation Statements History</CardTitle>
              <CardDescription className="text-xs print:text-gray-600">
                Audit list of past and active bank reconciliation sessions.
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-mono text-xs print:border-gray-400 print:text-black">
              {reconciliations.length} Sessions
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="print:text-xs">
            <TableHeader className="bg-muted/10 print:bg-gray-100">
              <TableRow className="print:border-b-2 print:border-gray-400">
                <TableHead className="w-[140px] font-semibold print:text-black print:font-bold">BRS #</TableHead>
                <TableHead className="font-semibold print:text-black print:font-bold">Bank Account</TableHead>
                <TableHead className="w-[120px] font-semibold print:text-black print:font-bold">Statement Date</TableHead>
                <TableHead className="text-right w-[150px] font-semibold print:text-black print:font-bold">Statement Ending</TableHead>
                <TableHead className="text-right w-[150px] font-semibold print:text-black print:font-bold">Book Balance</TableHead>
                <TableHead className="text-right w-[120px] font-semibold print:text-black print:font-bold">Variance</TableHead>
                <TableHead className="text-center w-[120px] font-semibold print:text-black print:font-bold">Status</TableHead>
                <TableHead className="text-right w-[120px] font-semibold print:hidden">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-xs">
                    Loading reconciliation records...
                  </TableCell>
                </TableRow>
              ) : reconciliations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-xs">
                    No bank reconciliations started yet. Click &quot;Start Reconciliation&quot; above to begin.
                  </TableCell>
                </TableRow>
              ) : (
                reconciliations.map((rec) => (
                  <TableRow
                    key={rec.id}
                    className="hover:bg-muted/40 transition-colors cursor-pointer print:border-b print:border-gray-300"
                    onClick={() => openBrsWorkspace(rec.id)}
                  >
                    <TableCell className="font-mono text-xs font-bold text-blue-600 print:text-black">
                      {rec.reconciliation_number}
                    </TableCell>
                    <TableCell className="text-sm font-medium print:text-black">
                      {rec.account_code} - {rec.account_name}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground print:text-gray-700">
                      {rec.statement_date}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold print:text-black">
                      PKR {formatPKR(rec.statement_ending_balance)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold print:text-black">
                      PKR {formatPKR(rec.book_balance)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold">
                      {Math.abs(rec.difference) < 0.01 ? (
                        <span className="text-emerald-600 print:text-black">0.00 ✓</span>
                      ) : (
                        <span className="text-rose-600 print:text-black">{formatPKR(rec.difference)}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="hidden print:inline-block font-mono text-[10px] font-bold">
                        {rec.status === "completed" ? "COMPLETED" : "IN PROGRESS"}
                      </span>
                      <Badge
                        variant={rec.status === "completed" ? "default" : "secondary"}
                        className={`print:hidden text-[10px] uppercase font-bold ${
                          rec.status === "completed"
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                        }`}
                      >
                        {rec.status === "completed" ? "Completed" : "In Progress"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right print:hidden">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          openBrsWorkspace(rec.id);
                        }}
                      >
                        {rec.status === "completed" ? "View BRS" : "Resume"}
                        <IconArrowRight className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Register Signatures block for Main Screen print */}
      <div className="hidden print:block mt-12 pt-6 border-t border-gray-400 print:break-inside-avoid">
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
        <p className="text-[10px] text-gray-500 text-center mt-6">
          Official Bank Reconciliation Statements Register • Paperless Business OS
        </p>
      </div>

      {/* ---------------- New Reconciliation Dialog ---------------- */}
      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent className="sm:max-w-xl max-w-[95vw] w-full">
          <DialogHeader>
            <div className="flex items-center gap-2 pr-6">
              <IconBuildingBank className="h-5 w-5 text-blue-600" />
              <DialogTitle className="text-lg">Start New Bank Reconciliation (BRS)</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Enter official bank statement details to compare with your General Ledger.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Bank Account</Label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select bank account" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((acc) => (
                    <SelectItem key={acc.id} value={String(acc.id)}>
                      {acc.code} - {acc.name} (PKR {formatPKR(acc.current_balance)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="stmt-date" className="text-xs font-semibold">
                  Statement Ending Date <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="stmt-date"
                  type="date"
                  value={stmtDate}
                  onChange={(e) => setStmtDate(e.target.value)}
                  className="h-9 font-mono text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="stmt-start-date" className="text-xs font-semibold">
                  Statement Start Date (Optional)
                </Label>
                <Input
                  id="stmt-start-date"
                  type="date"
                  value={stmtStartDate}
                  onChange={(e) => setStmtStartDate(e.target.value)}
                  className="h-9 font-mono text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="stmt-ending-bal" className="text-xs font-semibold">
                Statement Ending Balance (PKR) <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="stmt-ending-bal"
                type="number"
                step="0.01"
                placeholder="e.g. 150000.00"
                value={stmtEndingBalance}
                onChange={(e) => setStmtEndingBalance(e.target.value)}
                className="h-9 font-mono text-sm"
              />
              <span className="text-[11px] text-muted-foreground">
                Enter the exact closing balance shown on your official bank statement.
              </span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Reconciliation Notes (Optional)</Label>
              <Input
                placeholder="e.g., Monthly bank reconciliation after online statement download"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
            <Button variant="outline" onClick={() => setNewDialogOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateSession}
              disabled={creating || !selectedAccountId || !stmtEndingBalance}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
            >
              <IconCheck className="h-4 w-4" />
              {creating ? "Starting..." : "Begin Matching"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------- Interactive BRS Workspace Dialog (Standard Wide) ---------------- */}
      <Dialog
        open={Boolean(activeBrsId)}
        onOpenChange={(open) => {
          if (!open) {
            setActiveBrsId(null);
            setBrsDetail(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-5xl max-w-[96vw] w-full max-h-[92vh] overflow-y-auto print:static print:transform-none print:w-full print:max-w-none print:h-auto print:max-h-none print:overflow-visible print:border-none print:shadow-none print:p-0 print:m-0 print:ring-0 print:bg-white">
          {detailLoading || !brsDetail ? (
            <div className="py-16 flex flex-col items-center justify-center text-muted-foreground gap-2">
              <IconRefresh className="h-7 w-7 animate-spin text-blue-600" />
              <span className="text-sm font-medium">Loading bank reconciliation workspace...</span>
            </div>
          ) : (
            <div className="space-y-4 print:space-y-6">
              {/* ---------------- Print-Only Formal BRS Document Header ---------------- */}
              <div className="hidden print:block mb-6 border-b pb-4">
                <div className="text-center">
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900">Paperless Business OS</h1>
                  <h2 className="text-lg font-bold text-gray-800 mt-0.5">Bank Reconciliation Statement (BRS)</h2>
                  <p className="text-xs text-gray-600 mt-1 font-mono">
                    Statement Date: {brsDetail.reconciliation.statement_date} • Voucher #{brsDetail.reconciliation.reconciliation_number}
                  </p>
                  <p className="text-xs text-gray-800 font-semibold mt-0.5">
                    Bank Account: {brsDetail.reconciliation.account_code} - {brsDetail.reconciliation.account_name}
                  </p>
                </div>

                {/* Formal BRS Calculation Box in Print */}
                <div className="mt-4 border border-gray-400 rounded p-4 text-xs font-mono space-y-1.5 bg-gray-50/50">
                  <div className="flex justify-between">
                    <span className="text-gray-700 font-sans">1. Balance as per Official Bank Statement:</span>
                    <span className="font-bold">PKR {formatPKR(brsDetail.reconciliation.statement_ending_balance)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-800">
                    <span className="font-sans">   + Add: Deposits in Transit (Uncredited):</span>
                    <span className="font-bold">+ PKR {formatPKR(brsDetail.deposits_in_transit)}</span>
                  </div>
                  <div className="flex justify-between text-rose-800">
                    <span className="font-sans">   - Less: Outstanding Cheques / Payments (Unpresented):</span>
                    <span className="font-bold">- PKR {formatPKR(brsDetail.outstanding_payments)}</span>
                  </div>
                  <div className="border-t border-gray-400 pt-1.5 flex justify-between font-bold text-gray-900">
                    <span className="font-sans">= Adjusted Bank Balance:</span>
                    <span>PKR {formatPKR(brsDetail.reconciliation.reconciled_balance)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900">
                    <span className="font-sans">2. Balance as per General Ledger (Book Balance 1020):</span>
                    <span>PKR {formatPKR(brsDetail.reconciliation.book_balance)}</span>
                  </div>
                  <div className="border-t-2 border-gray-500 pt-1.5 flex justify-between font-bold text-sm">
                    <span className="font-sans">Reconciliation Variance / Difference:</span>
                    <span className={brsDetail.is_balanced ? "text-emerald-700" : "text-rose-700"}>
                      {brsDetail.is_balanced ? "PKR 0.00 (Balanced ✓)" : `PKR ${formatPKR(brsDetail.reconciliation.difference)}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Workspace Header (Screen Only) */}
              <DialogHeader className="print:hidden">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3 pr-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <IconBuildingBank className="h-5 w-5 text-blue-600" />
                      <DialogTitle className="text-xl">
                        {brsDetail.reconciliation.reconciliation_number}
                      </DialogTitle>
                      <Badge
                        variant={brsDetail.reconciliation.status === "completed" ? "default" : "secondary"}
                        className={`text-xs uppercase font-bold ${
                          brsDetail.reconciliation.status === "completed"
                            ? "bg-emerald-600 text-white"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {brsDetail.reconciliation.status === "completed" ? "Completed" : "In Progress"}
                      </Badge>
                    </div>
                    <DialogDescription className="text-xs mt-0.5">
                      Bank: <strong>{brsDetail.reconciliation.account_code} - {brsDetail.reconciliation.account_name}</strong> • Statement Date: <strong>{brsDetail.reconciliation.statement_date}</strong>
                    </DialogDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 h-8 text-xs shadow-sm"
                      onClick={() => window.print()}
                    >
                      <IconPrinter className="h-3.5 w-3.5" />
                      Print BRS
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              {/* 4 Summary KPI Metric Cards (Screen Only) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 print:hidden">
                <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 p-3 rounded-lg">
                  <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider block">
                    Statement Balance
                  </span>
                  <span className="font-mono text-base font-bold text-blue-800 dark:text-blue-200">
                    PKR {formatPKR(brsDetail.reconciliation.statement_ending_balance)}
                  </span>
                </div>

                <div className="bg-muted/30 border p-3 rounded-lg">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Book Balance (G/L 1020)
                  </span>
                  <span className="font-mono text-base font-bold text-foreground">
                    PKR {formatPKR(brsDetail.reconciliation.book_balance)}
                  </span>
                </div>

                <div className="bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 p-3 rounded-lg">
                  <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wider block">
                    Cleared Net Amount
                  </span>
                  <span className="font-mono text-base font-bold text-purple-800 dark:text-purple-200">
                    PKR {formatPKR(brsDetail.reconciliation.cleared_deposits - brsDetail.reconciliation.cleared_payments)}
                  </span>
                </div>

                <div
                  className={`p-3 rounded-lg border ${
                    brsDetail.is_balanced
                      ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
                      : "bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200"
                  }`}
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wider block">
                    Reconciliation Difference
                  </span>
                  <span className="font-mono text-base font-black">
                    {brsDetail.is_balanced ? "0.00 (Balanced ✓)" : `PKR ${formatPKR(brsDetail.reconciliation.difference)}`}
                  </span>
                </div>
              </div>

              {/* In-Transit Sub-summary breakdown (Screen Only) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-muted/20 border p-3 rounded-lg print:hidden">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">
                    Deposits in Transit (Uncredited):
                  </span>
                  <span className="font-mono font-bold text-emerald-600">
                    + PKR {formatPKR(brsDetail.deposits_in_transit)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">
                    Outstanding Cheques (Unpresented):
                  </span>
                  <span className="font-mono font-bold text-rose-600">
                    - PKR {formatPKR(brsDetail.outstanding_payments)}
                  </span>
                </div>
              </div>

              {/* Transactions Matching Section */}
              <div className="border rounded-lg overflow-hidden print:border print:rounded-none">
                {/* Screen Filters Bar */}
                <div className="bg-muted/40 p-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
                  <div className="flex items-center gap-2">
                    <Tabs
                      value={filterType}
                      onValueChange={(val) => setFilterType(val as any)}
                      className="w-auto"
                    >
                      <TabsList className="h-8">
                        <TabsTrigger value="all" className="text-xs px-2.5 h-7">
                          All ({brsDetail.transactions.length})
                        </TabsTrigger>
                        <TabsTrigger value="deposits" className="text-xs px-2.5 h-7">
                          Deposits
                        </TabsTrigger>
                        <TabsTrigger value="payments" className="text-xs px-2.5 h-7">
                          Payments
                        </TabsTrigger>
                        <TabsTrigger value="cleared" className="text-xs px-2.5 h-7">
                          Cleared
                        </TabsTrigger>
                        <TabsTrigger value="in_transit" className="text-xs px-2.5 h-7">
                          In-Transit
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>

                    <div className="relative w-48 hidden md:block">
                      <IconSearch className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Search ref # or payee..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8 pl-8 text-xs"
                      />
                    </div>
                  </div>

                  {brsDetail.reconciliation.status === "in_progress" && canMatch && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => handleBulkMatch(true)}
                      >
                        Clear All Filtered
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => handleBulkMatch(false)}
                      >
                        Unclear All
                      </Button>
                    </div>
                  )}
                </div>

                {/* Transactions Table (Responsive on screen, 100% full width on print) */}
                <div className="max-h-72 overflow-y-auto print:max-h-none print:overflow-visible">
                  <Table className="w-full table-fixed print:text-[11px]">
                    <TableHeader>
                      <TableRow className="text-xs bg-muted/10 print:bg-gray-100 print:border-b-2 print:border-gray-400">
                        <TableHead className="w-[45px] text-center print:hidden"></TableHead>
                        <TableHead className="w-[95px] print:w-[12%] font-semibold print:text-black print:font-bold">Date</TableHead>
                        <TableHead className="w-[125px] print:w-[15%] font-semibold print:text-black print:font-bold">Voucher #</TableHead>
                        <TableHead className="w-[110px] print:w-[12%] font-semibold print:text-black print:font-bold">Source</TableHead>
                        <TableHead className="print:w-[28%] font-semibold print:text-black print:font-bold">Description / Ref #</TableHead>
                        <TableHead className="text-right w-[130px] print:w-[11%] font-semibold print:text-black print:font-bold">Deposit (Dr)</TableHead>
                        <TableHead className="text-right w-[130px] print:w-[11%] font-semibold print:text-black print:font-bold">Payment (Cr)</TableHead>
                        <TableHead className="text-center w-[95px] print:w-[11%] font-semibold print:text-black print:font-bold">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-6">
                            No bank transactions matching the selected filter.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredTransactions.map((tx) => (
                          <TableRow
                            key={tx.journal_entry_line_id}
                            className={`text-xs hover:bg-muted/40 transition-colors print:border-b print:border-gray-300 print:break-inside-avoid ${
                              tx.is_matched ? "bg-emerald-50/20 dark:bg-emerald-950/10" : ""
                            }`}
                          >
                            <TableCell className="text-center p-2 print:hidden">
                              {brsDetail.reconciliation.status === "in_progress" && canMatch ? (
                                <Checkbox
                                  checked={tx.is_matched}
                                  onCheckedChange={() => handleToggleItem(tx)}
                                />
                              ) : tx.is_matched ? (
                                <IconCheck className="h-4 w-4 text-emerald-600 inline-block" />
                              ) : (
                                <IconClock className="h-4 w-4 text-amber-500 inline-block" />
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-muted-foreground print:text-black print:whitespace-nowrap">
                              {tx.entry_date}
                            </TableCell>
                            <TableCell className="font-mono font-semibold text-blue-600 print:text-black truncate print:whitespace-normal print:overflow-visible">
                              <Link
                                href={`/accounting/journal?search=${tx.entry_number}`}
                                target="_blank"
                                className="hover:underline"
                              >
                                {tx.entry_number}
                              </Link>
                            </TableCell>
                            <TableCell className="capitalize text-muted-foreground font-mono text-[11px] print:text-black truncate print:whitespace-normal print:overflow-visible">
                              {tx.source_type.replace(/_/g, " ")}
                            </TableCell>
                            <TableCell className="font-medium truncate print:whitespace-normal print:overflow-visible">
                              <span>{tx.narration || "Bank Transaction"}</span>
                              {tx.reference_no && (
                                <span className="text-muted-foreground font-mono text-[11px] block print:text-gray-600">
                                  Ref: {tx.reference_no}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono font-semibold text-emerald-600 print:text-black print:whitespace-nowrap">
                              {tx.debit > 0 ? formatPKR(tx.debit) : "-"}
                            </TableCell>
                            <TableCell className="text-right font-mono font-semibold text-rose-600 print:text-black print:whitespace-nowrap">
                              {tx.credit > 0 ? formatPKR(tx.credit) : "-"}
                            </TableCell>
                            <TableCell className="text-center p-2">
                              <span className="hidden print:inline-block font-mono text-[10px] font-bold">
                                {tx.is_matched ? "CLEARED" : "IN-TRANSIT"}
                              </span>
                              <Badge
                                variant={tx.is_matched ? "default" : "outline"}
                                className={`print:hidden text-[10px] px-1.5 py-0 ${
                                  tx.is_matched
                                    ? "bg-emerald-600 text-white"
                                    : "border-amber-400 text-amber-700 dark:text-amber-300"
                                }`}
                              >
                                {tx.is_matched ? "Cleared" : "In-Transit"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                    <TableFooter className="bg-muted/30 print:bg-gray-100 font-bold border-t-2 print:border-gray-500">
                      <TableRow className="print:border-b-2 print:border-gray-500">
                        <TableCell className="print:hidden"></TableCell>
                        <TableCell colSpan={3} className="text-xs font-bold print:text-black">
                          TOTALS ({filteredTransactions.length} Items: {clearedCount} Cleared, {filteredTransactions.length - clearedCount} In-Transit)
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-right font-mono text-xs font-bold text-emerald-700 print:text-black whitespace-nowrap">
                          PKR {formatPKR(totalDeposits)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-bold text-rose-700 print:text-black whitespace-nowrap">
                          PKR {formatPKR(totalPayments)}
                        </TableCell>
                        <TableCell className="text-center font-mono text-[10px] text-muted-foreground print:text-black">
                          {brsDetail.is_balanced ? "BALANCED ✓" : "UNBALANCED"}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </div>

              {/* ---------------- Print-Only Signatures Block ---------------- */}
              <div className="hidden print:block mt-12 pt-6 border-t border-gray-400 print:break-inside-avoid">
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
                <p className="text-[10px] text-gray-500 text-center mt-6">
                  Official Double-Entry BRS Document • Generated automatically by Paperless Business OS
                </p>
              </div>

              {/* Actions Footer (Screen Only - Clean Standard Buttons) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t print:hidden">
                <div className="text-xs text-muted-foreground">
                  {brsDetail.reconciliation.status === "completed" ? (
                    <span>
                      Completed by <strong>{brsDetail.reconciliation.reconciled_by_name || "Accountant"}</strong> on{" "}
                      {brsDetail.reconciliation.reconciled_at ? new Date(brsDetail.reconciliation.reconciled_at).toLocaleString() : ""}
                    </span>
                  ) : brsDetail.is_balanced ? (
                    <span className="text-emerald-600 font-medium flex items-center gap-1.5">
                      <IconCheck className="h-4 w-4" /> Ready to complete — Difference is 0.00 (Balanced ✓)
                    </span>
                  ) : (
                    <span className="text-amber-600 font-medium flex items-center gap-1.5">
                      <IconAlertTriangle className="h-4 w-4" /> Select transactions to reconcile the difference of PKR {formatPKR(brsDetail.reconciliation.difference)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveBrsId(null)}
                  >
                    Close
                  </Button>

                  {brsDetail.reconciliation.status === "in_progress" && canComplete && (
                    <Button
                      size="sm"
                      onClick={handleCompleteReconciliation}
                      disabled={!brsDetail.is_balanced || completing}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
                    >
                      <IconShieldCheck className={`h-4 w-4 ${completing ? "animate-spin" : ""}`} />
                      {completing ? "Finalizing..." : "Complete Reconciliation"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

