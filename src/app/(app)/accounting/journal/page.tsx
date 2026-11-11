"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  IconNotes,
  IconPlus,
  IconSearch,
  IconRefresh,
  IconEye,
  IconCheck,
  IconAlertTriangle,
  IconTrash,
  IconCalendar,
  IconFileText,
  IconX,
  IconPrinter,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  accountingService,
  type JournalEntryItem,
  type AccountItem,
} from "@/services/accounting.service";
import { branchService, type BranchItem } from "@/services/branch.service";

interface NewJVLine {
  id: string;
  account_id: string;
  debit: string;
  credit: string;
  narration: string;
}

export default function JournalEntriesPage() {
  const [entries, setEntries] = useState<JournalEntryItem[]>([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);

  // Filters
  const [search, setSearch] = useState<string>("");
  const [sourceType, setSourceType] = useState<string>("all");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // Detail Modal
  const [viewEntry, setViewEntry] = useState<JournalEntryItem | null>(null);

  // New Manual JV Modal
  const [newModalOpen, setNewModalOpen] = useState<boolean>(false);
  const [jvBranch, setJvBranch] = useState<string>("none");
  const [jvDate, setJvDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [jvRef, setJvRef] = useState<string>("");
  const [jvNarration, setJvNarration] = useState<string>("");
  const [savingJv, setSavingJv] = useState<boolean>(false);

  const [lines, setLines] = useState<NewJVLine[]>([
    { id: "1", account_id: "", debit: "", credit: "", narration: "" },
    { id: "2", account_id: "", debit: "", credit: "", narration: "" },
  ]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await accountingService.listJournalEntries({
        branch_id: selectedBranch === "all" ? undefined : parseInt(selectedBranch),
        source_type: sourceType === "all" ? undefined : sourceType,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        search: search.trim() || undefined,
        page,
        page_size: pageSize,
      });
      setEntries(res.items);
      setTotal(res.total);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load journal entries.");
    } finally {
      setLoading(false);
    }
  }, [selectedBranch, sourceType, fromDate, toDate, search, page, pageSize]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load auxiliary lists for modal
  useEffect(() => {
    accountingService
      .listAccounts({ active_only: true })
      .then(setAccounts)
      .catch(() => setAccounts([]));

    branchService
      .listBranches()
      .then((res) => setBranches(res.branches || []))
      .catch(() => setBranches([]));
  }, []);

  const openNewJVModal = () => {
    setJvBranch("none");
    setJvDate(new Date().toISOString().split("T")[0]);
    setJvRef("");
    setJvNarration("");
    setLines([
      { id: "1", account_id: "", debit: "", credit: "", narration: "" },
      { id: "2", account_id: "", debit: "", credit: "", narration: "" },
    ]);
    setNewModalOpen(true);
  };

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      { id: Math.random().toString(), account_id: "", debit: "", credit: "", narration: "" },
    ]);
  };

  const removeLine = (id: string) => {
    if (lines.length <= 2) {
      toast.error("A Journal Voucher requires at least 2 lines (Debit and Credit).");
      return;
    }
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  const updateLine = (id: string, field: keyof NewJVLine, value: string) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        if (field === "debit" && value && parseFloat(value) > 0) {
          return { ...l, debit: value, credit: "0" };
        }
        if (field === "credit" && value && parseFloat(value) > 0) {
          return { ...l, credit: value, debit: "0" };
        }
        return { ...l, [field]: value };
      })
    );
  };

  // Calculations for balanced JV check
  const totDebit = lines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0);
  const totCredit = lines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0);
  const difference = Math.abs(totDebit - totCredit);
  const isBalanced = difference < 0.01 && totDebit > 0;

  const handlePostJV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      toast.error("Voucher is not balanced! Total Debits must equal Total Credits.");
      return;
    }

    // Verify all lines have accounts
    for (const l of lines) {
      if (!l.account_id) {
        toast.error("Please select an account for all lines.");
        return;
      }
    }

    setSavingJv(true);
    try {
      await accountingService.createJournalEntry({
        branch_id: jvBranch === "none" ? undefined : parseInt(jvBranch),
        entry_date: jvDate ? `${jvDate}T12:00:00Z` : undefined,
        reference_no: jvRef.trim() || undefined,
        narration: jvNarration.trim() || undefined,
        lines: lines.map((l) => ({
          account_id: parseInt(l.account_id),
          debit: parseFloat(l.debit) || 0.0,
          credit: parseFloat(l.credit) || 0.0,
          narration: l.narration.trim() || jvNarration.trim() || undefined,
        })),
      });

      toast.success("Manual Journal Voucher posted successfully!");
      setNewModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to post Journal Voucher.");
    } finally {
      setSavingJv(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto print:p-0 print:m-0 print:max-w-none">
      {/* Background Journal List Container (Hidden during Voucher print) */}
      <div className="space-y-6 print:hidden">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <IconNotes className="h-6 w-6 text-primary" />
              General Journal Vouchers (JV)
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Double-entry audit trail • Automated POS invoices, customer receipts, and manual adjustments
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="h-9 gap-1.5"
            >
              <IconRefresh className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={openNewJVModal}
              className="h-9 gap-1.5"
            >
              <IconPlus className="h-4 w-4" />
              <span>Manual JV</span>
            </Button>
          </div>
        </div>

        {/* Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/30 p-3 rounded-lg border">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Source Type Filter */}
            <div className="w-44">
              <Select value={sourceType} onValueChange={setSourceType}>
                <SelectTrigger className="h-8 text-xs bg-card">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="sales_invoice">POS / Sales Invoice</SelectItem>
                  <SelectItem value="purchase_invoice">Purchase Bill (GRN)</SelectItem>
                  <SelectItem value="customer_payment">Customer Receipt (CRV)</SelectItem>
                  <SelectItem value="supplier_payment">Supplier Payment (CPV)</SelectItem>
                  <SelectItem value="expense_voucher">Expense Voucher (CPV)</SelectItem>
                  <SelectItem value="manual_jv">Manual JV</SelectItem>
                </SelectContent>
              </Select>
            </div>

          {/* Branch Filter */}
          <div className="w-44">
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="h-8 text-xs bg-card">
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id.toString()}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date range */}
          <div className="flex items-center gap-1.5 text-xs">
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-8 w-32 text-xs bg-card"
              title="From Date"
            />
            <span className="text-muted-foreground">to</span>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-8 w-32 text-xs bg-card"
              title="To Date"
            />
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <IconSearch className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search JV #, reference, memo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs bg-card"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-2xs">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[110px] text-xs font-semibold">Date</TableHead>
              <TableHead className="w-[140px] text-xs font-semibold">Voucher #</TableHead>
              <TableHead className="w-[140px] text-xs font-semibold">Source</TableHead>
              <TableHead className="w-[140px] text-xs font-semibold">Reference #</TableHead>
              <TableHead className="text-xs font-semibold">Particulars / Narration</TableHead>
              <TableHead className="text-right w-[150px] text-xs font-semibold">Total Amount</TableHead>
              <TableHead className="w-[110px] text-center text-xs font-semibold">Status</TableHead>
              <TableHead className="text-right w-[80px] text-xs font-semibold">View</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-16 text-xs text-muted-foreground">
                  <IconRefresh className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
                  Loading Journal Vouchers...
                </TableCell>
              </TableRow>
            ) : entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-16 text-xs text-muted-foreground">
                  No journal vouchers recorded yet. POS checkouts and receipts will appear here automatically.
                </TableCell>
              </TableRow>
            ) : (
              entries.map((jv) => {
                const isSale = jv.source_type === "sales_invoice";
                const isPur = jv.source_type === "purchase_invoice";
                const isCrv = jv.source_type === "customer_payment";
                const isCpv = jv.source_type === "supplier_payment";
                const isExp = jv.source_type === "expense_voucher";

                return (
                  <TableRow key={jv.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {new Date(jv.entry_date).toLocaleDateString([], {
                        month: "short",
                        day: "2-digit",
                        year: "numeric",
                      })}
                    </TableCell>

                    <TableCell className="font-mono text-xs font-bold text-foreground">
                      {jv.entry_number}
                    </TableCell>

                    <TableCell>
                      {isSale && (
                        <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-200">
                          POS Sale
                        </Badge>
                      )}
                      {isPur && (
                        <Badge variant="outline" className="text-[10px] bg-indigo-500/10 text-indigo-600 border-indigo-200">
                          Purchase (GRN)
                        </Badge>
                      )}
                      {isCrv && (
                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-200">
                          Customer CRV
                        </Badge>
                      )}
                      {isCpv && (
                        <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-200">
                          Supplier CPV
                        </Badge>
                      )}
                      {isExp && (
                        <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-600 border-rose-200">
                          Expense (CPV)
                        </Badge>
                      )}
                      {!isSale && !isPur && !isCrv && !isCpv && !isExp && (
                        <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-600 border-purple-200">
                          {jv.source_type.replace(/_/g, " ")}
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="font-mono text-xs">
                      {jv.reference_no || "—"}
                    </TableCell>

                    <TableCell className="text-xs">
                      <div className="font-medium text-foreground truncate max-w-md">
                        {jv.narration || "General Journal Voucher"}
                      </div>
                      {jv.branch_name && (
                        <p className="text-[10px] text-muted-foreground">
                          Branch: {jv.branch_name}
                        </p>
                      )}
                    </TableCell>

                    <TableCell className="text-right font-mono text-xs font-bold text-foreground">
                      PKR {jv.total_debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                        {jv.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewEntry(jv)}
                        className="h-7 w-7 p-0"
                        title="View Voucher Breakdown"
                      >
                        <IconEye className="h-4 w-4 text-primary" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Footer info */}
        <div className="px-4 py-3 border-t bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
          <span>Total {total} journal vouchers recorded</span>
          <span>Double-Entry Verified ($\sum Dr == \sum Cr$)</span>
        </div>
      </div>
      </div>

      {/* Modal: View Voucher Breakdown (Debit & Credit Lines) */}
      <Dialog open={!!viewEntry} onOpenChange={(open) => !open && setViewEntry(null)}>
        <DialogContent className="sm:max-w-4xl max-w-[96vw] w-full p-0 overflow-hidden print:static print:transform-none print:w-full print:max-w-none print:h-auto print:max-h-none print:overflow-visible print:border-none print:shadow-none print:p-0 print:m-0 print:ring-0 print:bg-white">
          {viewEntry && (
            <div className="w-full min-w-0">
              {/* ---------------- Print-Only Official Document Header ---------------- */}
              <div className="hidden print:block p-6 pb-4 border-b">
                <div className="text-center">
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900">Paperless Business OS</h1>
                  <h2 className="text-base font-bold text-gray-800 uppercase tracking-wider mt-1">
                    Official Journal Voucher (JV)
                  </h2>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">Double-Entry Financial Audit Trail</p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 p-3 bg-gray-50 border border-gray-300 rounded text-xs font-mono">
                  <div className="space-y-1">
                    <div>
                      <span className="font-sans font-semibold text-gray-600">Voucher No:</span>{" "}
                      <strong className="text-gray-900">{viewEntry.entry_number}</strong>
                    </div>
                    <div>
                      <span className="font-sans font-semibold text-gray-600">Entry Date:</span>{" "}
                      {new Date(viewEntry.entry_date).toLocaleDateString([], {
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                      })}
                    </div>
                    <div>
                      <span className="font-sans font-semibold text-gray-600">Branch:</span>{" "}
                      {viewEntry.branch_name || "Head Office / Main Branch"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div>
                      <span className="font-sans font-semibold text-gray-600">Source:</span>{" "}
                      <span className="uppercase font-semibold text-gray-900">{viewEntry.source_type}</span>
                    </div>
                    <div>
                      <span className="font-sans font-semibold text-gray-600">Reference:</span>{" "}
                      {viewEntry.reference_no || "N/A"}
                    </div>
                    <div>
                      <span className="font-sans font-semibold text-gray-600">Status:</span>{" "}
                      <span className="uppercase font-bold text-emerald-700">{viewEntry.status}</span>
                    </div>
                  </div>
                </div>

                {viewEntry.narration && (
                  <div className="mt-3 p-2.5 bg-gray-50 border border-gray-300 rounded text-xs">
                    <span className="font-sans font-semibold text-gray-700">Memo / Narration:</span>{" "}
                    <span className="font-mono text-gray-900">{viewEntry.narration}</span>
                  </div>
                )}
              </div>

              {/* ---------------- Screen-Only Modal Header ---------------- */}
              <DialogHeader className="p-5 border-b bg-muted/20 print:hidden">
                <div className="flex items-center justify-between pr-8">
                  <div>
                    <DialogTitle className="text-base font-bold flex items-center gap-2">
                      <IconNotes className="h-5 w-5 text-primary" />
                      Journal Voucher: {viewEntry.entry_number}
                    </DialogTitle>
                    <DialogDescription className="text-xs mt-0.5">
                      Source: {viewEntry.source_type} • Reference: {viewEntry.reference_no || "N/A"}
                    </DialogDescription>
                  </div>
                  <Badge variant="outline" className="text-xs font-mono shrink-0">
                    {new Date(viewEntry.entry_date).toLocaleDateString([], {
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                    })}
                  </Badge>
                </div>
              </DialogHeader>

              {/* ---------------- Voucher Body (Table) ---------------- */}
              <div className="p-5 space-y-4 print:p-6 print:pt-4">
                {viewEntry.narration && (
                  <div className="p-2.5 rounded bg-muted/30 text-xs text-foreground border print:hidden">
                    <strong>Memo / Particulars:</strong> {viewEntry.narration}
                  </div>
                )}

                <div className="rounded-lg border overflow-x-auto print:border-gray-400 print:rounded-none">
                  <Table className="w-full">
                    <TableHeader className="bg-muted/50 print:bg-gray-100">
                      <TableRow className="print:border-b-2 print:border-gray-400">
                        <TableHead className="text-xs font-semibold w-[32%] min-w-[180px] print:text-black print:font-bold">
                          Account Head
                        </TableHead>
                        <TableHead className="text-xs font-semibold w-[38%] min-w-[180px] print:text-black print:font-bold">
                          Particulars / Party
                        </TableHead>
                        <TableHead className="text-right w-[15%] min-w-[120px] whitespace-nowrap text-xs font-semibold print:text-black print:font-bold">
                          Debit (Dr)
                        </TableHead>
                        <TableHead className="text-right w-[15%] min-w-[120px] whitespace-nowrap text-xs font-semibold print:text-black print:font-bold">
                          Credit (Cr)
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewEntry.lines.map((l) => (
                        <TableRow key={l.id} className="print:border-b print:border-gray-300">
                          <TableCell className="text-xs font-mono font-medium whitespace-normal break-words py-2.5">
                            <span className="font-bold text-foreground print:text-black">{l.account_code}</span> — {l.account_name}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground print:text-gray-700 whitespace-normal break-words py-2.5">
                            {l.customer_name || l.supplier_name || l.narration || "—"}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs font-semibold text-emerald-600 print:text-black whitespace-nowrap py-2.5">
                            {l.debit > 0
                              ? `PKR ${l.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs font-semibold text-rose-600 print:text-black whitespace-nowrap py-2.5">
                            {l.credit > 0
                              ? `PKR ${l.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))}

                      {/* Totals Row */}
                      <TableRow className="bg-muted/30 print:bg-gray-100 font-bold print:border-t-2 print:border-b-2 print:border-gray-500">
                        <TableCell colSpan={2} className="text-xs print:text-black">
                          TOTALS (VERIFIED BALANCED)
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-emerald-600 print:text-black whitespace-nowrap">
                          PKR {viewEntry.total_debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-rose-600 print:text-black whitespace-nowrap">
                          PKR {viewEntry.total_credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* ---------------- Print-Only Signatures Block ---------------- */}
                <div className="hidden print:block mt-16 pt-8 border-t border-gray-300">
                  <div className="grid grid-cols-3 gap-8 text-center text-xs">
                    <div className="space-y-12">
                      <div className="border-b border-gray-400 w-3/4 mx-auto"></div>
                      <p className="font-semibold text-gray-700">
                        Prepared By ({viewEntry.created_by_name || "Accountant"})
                      </p>
                    </div>
                    <div className="space-y-12">
                      <div className="border-b border-gray-400 w-3/4 mx-auto"></div>
                      <p className="font-semibold text-gray-700">Verified By (Internal Auditor)</p>
                    </div>
                    <div className="space-y-12">
                      <div className="border-b border-gray-400 w-3/4 mx-auto"></div>
                      <p className="font-semibold text-gray-700">Approved By (CFO / Business Owner)</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 text-center mt-8 font-mono">
                    Official Double-Entry Audit Document • Generated by Paperless Business OS • Printed on {new Date().toLocaleString()}
                  </p>
                </div>
              </div>

              {/* ---------------- Screen-Only Actions Footer ---------------- */}
              <div className="px-5 py-3 border-t bg-muted/20 flex items-center justify-between print:hidden">
                <div className="text-xs text-muted-foreground">
                  Double-entry balanced audit voucher
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.print()}
                    className="h-8 text-xs gap-1.5"
                  >
                    <IconPrinter className="h-3.5 w-3.5" />
                    Print Voucher
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => setViewEntry(null)}
                    className="h-8 text-xs px-4"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Create Manual Balanced JV */}
      <Dialog open={newModalOpen} onOpenChange={setNewModalOpen}>
        <DialogContent className="sm:max-w-4xl max-w-[95vw] w-full p-0 overflow-hidden">
          <form onSubmit={handlePostJV}>
            <DialogHeader className="p-5 border-b bg-muted/20">
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <IconPlus className="h-5 w-5 text-primary" />
                Post Manual Journal Voucher (JV)
              </DialogTitle>
              <DialogDescription className="text-xs">
                Create balanced double-entry adjustments, opening balances, or capital injection.
              </DialogDescription>
            </DialogHeader>

            <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Entry Date *</Label>
                  <Input
                    type="date"
                    value={jvDate}
                    onChange={(e) => setJvDate(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Branch (Optional)</Label>
                  <Select value={jvBranch} onValueChange={setJvBranch}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Branch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Central / Head Office</SelectItem>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id.toString()}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Reference # (Optional)</Label>
                  <Input
                    placeholder="e.g. Cheque # or Bank Ref"
                    value={jvRef}
                    onChange={(e) => setJvRef(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Narration / Memo</Label>
                <Input
                  placeholder="Reason for adjustment, e.g. Owner capital injection via Meezan Bank"
                  value={jvNarration}
                  onChange={(e) => setJvNarration(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              {/* Lines Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground">Debit & Credit Lines</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addLine}
                    className="h-7 text-xs gap-1"
                  >
                    <IconPlus className="h-3 w-3" />
                    <span>Add Line</span>
                  </Button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="text-xs font-semibold">Account Head *</TableHead>
                        <TableHead className="w-[140px] text-right text-xs font-semibold">Debit (Dr)</TableHead>
                        <TableHead className="w-[140px] text-right text-xs font-semibold">Credit (Cr)</TableHead>
                        <TableHead className="w-[40px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lines.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell className="p-2">
                            <Select
                              value={line.account_id}
                              onValueChange={(val) => updateLine(line.id, "account_id", val)}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Select Account" />
                              </SelectTrigger>
                              <SelectContent>
                                {accounts.map((a) => (
                                  <SelectItem key={a.id} value={a.id.toString()}>
                                    {a.code} — {a.name} ({a.account_type})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              type="number"
                              step="any"
                              placeholder="0.00"
                              value={line.debit}
                              onChange={(e) => updateLine(line.id, "debit", e.target.value)}
                              className="h-8 text-xs text-right font-mono"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              type="number"
                              step="any"
                              placeholder="0.00"
                              value={line.credit}
                              onChange={(e) => updateLine(line.id, "credit", e.target.value)}
                              className="h-8 text-xs text-right font-mono"
                            />
                          </TableCell>
                          <TableCell className="p-2 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeLine(line.id)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <IconTrash className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}

                      {/* Totals & Balance Verification */}
                      <TableRow className="bg-muted/30">
                        <TableCell className="text-xs font-bold">TOTALS</TableCell>
                        <TableCell className="text-right font-mono text-xs font-bold text-emerald-600">
                          PKR {totDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-bold text-rose-600">
                          PKR {totCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Invariant Badge */}
                <div className="flex items-center justify-between text-xs pt-1">
                  {isBalanced ? (
                    <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                      <IconCheck className="h-4 w-4" />
                      Voucher is balanced and ready to post.
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-rose-600 font-semibold">
                      <IconAlertTriangle className="h-4 w-4" />
                      Difference: PKR {difference.toLocaleString(undefined, { minimumFractionDigits: 2 })} (Must be 0.00)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t bg-muted/20 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setNewModalOpen(false)}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!isBalanced || savingJv}
                className="h-9 text-xs font-semibold shadow-2xs"
              >
                {savingJv ? "Posting..." : "Post Journal Voucher"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
