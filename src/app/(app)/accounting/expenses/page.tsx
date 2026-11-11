"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  IconReceiptTax,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconBuildingStore,
  IconFilter,
  IconCalendar,
  IconFileDollar,
  IconTrendingDown,
  IconCash,
  IconBuildingBank,
  IconCheck,
  IconClock,
  IconEye,
  IconTrash,
  IconReceipt,
  IconNotes,
  IconInfoCircle,
  IconPrinter,
  IconArrowRight,
} from "@tabler/icons-react";

import { useAuth } from "@/context/auth-context";
import { useLanguage } from "@/context/language-context";
import { LanguageToggle } from "@/components/language-toggle";
import {
  accountingService,
  ExpenseVoucherItem,
  ExpenseSummaryResponse,
  AccountItem,
} from "@/services/accounting.service";
import { branchService, BranchItem } from "@/services/branch.service";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ExpensesPage() {
  const { tenant } = useAuth();
  const { t, mode } = useLanguage();

  // Granular Action Permissions
  const canViewExpenses = tenant?.permissions?.some((p) =>
    ["*", "accounting:expenses:view"].includes(p)
  );
  const canCreateExpense = tenant?.permissions?.some((p) =>
    ["*", "accounting:expenses:create"].includes(p)
  );
  const canDeleteExpense = tenant?.permissions?.some((p) =>
    ["*", "accounting:expenses:delete"].includes(p)
  );

  // Data states
  const [loading, setLoading] = React.useState(true);
  const [expenses, setExpenses] = React.useState<ExpenseVoucherItem[]>([]);
  const [totalExpenses, setTotalExpenses] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [page, setPage] = React.useState(1);
  const [summary, setSummary] = React.useState<ExpenseSummaryResponse | null>(null);

  // Master lists
  const [branches, setBranches] = React.useState<BranchItem[]>([]);
  const [expenseAccounts, setExpenseAccounts] = React.useState<AccountItem[]>([]);
  const [paymentAccounts, setPaymentAccounts] = React.useState<AccountItem[]>([]);

  // Filter states
  const [search, setSearch] = React.useState("");
  const [selectedBranch, setSelectedBranch] = React.useState<string>("all");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [selectedMethod, setSelectedMethod] = React.useState<string>("all");
  const [fromDate, setFromDate] = React.useState<string>("");
  const [toDate, setToDate] = React.useState<string>("");

  // Modal states
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [viewItem, setViewItem] = React.useState<ExpenseVoucherItem | null>(null);
  const [deleteId, setDeleteId] = React.useState<number | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  // Create form state
  const [formBranchId, setFormBranchId] = React.useState<string>("none");
  const [formExpenseAccountId, setFormExpenseAccountId] = React.useState<string>("");
  const [formPaidFromAccountId, setFormPaidFromAccountId] = React.useState<string>("");
  const [formAmount, setFormAmount] = React.useState<string>("");
  const [formPaymentMethod, setFormPaymentMethod] = React.useState<string>("cash");
  const [formPayeeName, setFormPayeeName] = React.useState<string>("");
  const [formExpenseDate, setFormExpenseDate] = React.useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [formReferenceNo, setFormReferenceNo] = React.useState<string>("");
  const [formNarration, setFormNarration] = React.useState<string>("");

  // Currency Formatter
  const formatPKR = (amt: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 2,
    }).format(amt);
  };

  // Load Reference Accounts and Branches
  const loadMasterData = React.useCallback(async () => {
    try {
      const [branchRes, expRes, assetRes] = await Promise.all([
        branchService.listBranches().catch(() => ({ branches: [] })),
        accountingService.listAccounts({ account_type: "expense" }).catch(() => []),
        accountingService.listAccounts({ account_type: "asset" }).catch(() => []),
      ]);

      setBranches(branchRes.branches || []);
      setExpenseAccounts(expRes || []);

      // Filter asset accounts for cash and bank
      const cashAndBank = (assetRes || []).filter((a) =>
        ["cash", "bank"].includes(a.sub_type?.toLowerCase() || "") ||
        ["1010", "1020"].includes(a.code)
      );
      setPaymentAccounts(cashAndBank);

      // Default paid from account to cash drawer (1010)
      const cashAcc = cashAndBank.find((a) => a.code === "1010" || a.sub_type === "cash");
      if (cashAcc) {
        setFormPaidFromAccountId(String(cashAcc.id));
      }
    } catch {
      // Ignore initial master errors
    }
  }, []);

  // Fetch Expenses List & Summary
  const fetchExpenses = React.useCallback(async () => {
    setLoading(true);
    try {
      const branchIdNum = selectedBranch !== "all" ? parseInt(selectedBranch) : undefined;
      const catIdNum = selectedCategory !== "all" ? parseInt(selectedCategory) : undefined;

      const [listRes, summaryRes] = await Promise.all([
        accountingService.getExpenseVouchers({
          branch_id: branchIdNum,
          expense_account_id: catIdNum,
          payment_method: selectedMethod !== "all" ? selectedMethod : undefined,
          from_date: fromDate || undefined,
          to_date: toDate || undefined,
          search: search.trim() || undefined,
          page,
          page_size: 15,
        }),
        accountingService.getExpenseSummary({
          branch_id: branchIdNum,
        }).catch(() => null),
      ]);

      setExpenses(listRes.items);
      setTotalExpenses(listRes.total);
      setTotalPages(listRes.pages);
      if (summaryRes) {
        setSummary(summaryRes);
      }
    } catch {
      toast.error("Failed to load expense vouchers.");
    } finally {
      setLoading(false);
    }
  }, [selectedBranch, selectedCategory, selectedMethod, fromDate, toDate, search, page]);

  React.useEffect(() => {
    loadMasterData();
  }, [loadMasterData]);

  React.useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Handle Create Expense Submission
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formExpenseAccountId) {
      toast.error("Please select an expense category / account head.");
      return;
    }
    const parsedAmount = parseFloat(formAmount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error("Please enter a valid expense amount greater than 0.");
      return;
    }
    if (!formPayeeName.trim()) {
      toast.error("Please enter the payee name (e.g. LESCO, Landlord, Chai boy).");
      return;
    }

    setCreating(true);
    try {
      const created = await accountingService.createExpenseVoucher({
        branch_id: formBranchId !== "none" ? parseInt(formBranchId) : undefined,
        expense_account_id: parseInt(formExpenseAccountId),
        paid_from_account_id: formPaidFromAccountId ? parseInt(formPaidFromAccountId) : undefined,
        amount: parsedAmount,
        payment_method: formPaymentMethod,
        payee_name: formPayeeName.trim(),
        expense_date: formExpenseDate ? new Date(formExpenseDate).toISOString() : undefined,
        reference_no: formReferenceNo.trim() || undefined,
        narration: formNarration.trim() || undefined,
      });

      toast.success(`Expense Voucher ${created.voucher_number} posted successfully!`);
      setCreateModalOpen(false);
      resetCreateForm();
      fetchExpenses();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to record expense voucher.";
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const resetCreateForm = () => {
    setFormBranchId("none");
    setFormExpenseAccountId("");
    setFormAmount("");
    setFormPaymentMethod("cash");
    setFormPayeeName("");
    setFormExpenseDate(new Date().toISOString().split("T")[0]);
    setFormReferenceNo("");
    setFormNarration("");
    const cashAcc = paymentAccounts.find((a) => a.code === "1010" || a.sub_type === "cash");
    if (cashAcc) {
      setFormPaidFromAccountId(String(cashAcc.id));
    }
  };

  // Handle Cancel / Void Expense Voucher
  const handleCancelExpense = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await accountingService.deleteExpenseVoucher(deleteId);
      toast.success("Expense voucher cancelled and journal entry voided.");
      setDeleteId(null);
      fetchExpenses();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to cancel expense voucher.";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  // Selected Expense Account Object for preview
  const selectedExpObj = expenseAccounts.find((a) => String(a.id) === formExpenseAccountId);
  const selectedPaidObj = paymentAccounts.find((a) => String(a.id) === formPaidFromAccountId);

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto print:p-0 print:m-0 print:max-w-none">
      {/* Background Page Content (Hidden during Voucher Print) */}
      <div className="space-y-6 print:hidden">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <IconReceiptTax className="h-7 w-7 text-rose-600" />
            {t("Expense Vouchers", "اخراجات واؤچر")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t(
              "Record petty cash, shop rent, electricity bills, chai/refreshment, fuel, and daily office operational expenses with auto-posted double entries.",
              "روزمرہ دکان اور دفتر کے اخراجات کا اندراج اور خودکار ڈبل انٹری پوسٹنگ۔"
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Language Display Mode Toggle */}
          <LanguageToggle showLabel variant="outline" />

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchExpenses()}
            disabled={loading}
            className="h-9 gap-1.5"
          >
            <IconRefresh className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {t("Refresh", "تازہ کریں")}
          </Button>

          {canCreateExpense && (
            <Button
              size="sm"
              onClick={() => {
                resetCreateForm();
                setCreateModalOpen(true);
              }}
              className="h-9 gap-1.5"
            >
              <IconPlus className="h-4 w-4" />
              {t("Record Expense", "نیا خرچہ")}
            </Button>
          )}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Expenses */}
        <Card className="border-l-4 border-l-rose-500 shadow-sm">
          <CardHeader className="py-3 px-4 pb-1">
            <CardDescription className="text-xs font-semibold tracking-wider uppercase flex items-center gap-1 text-rose-700 dark:text-rose-400">
              <IconClock className="h-3.5 w-3.5" />
              {t("Today's Expenses", "آج کے اخراجات")}
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-mono text-rose-700 dark:text-rose-400">
              {formatPKR(summary?.today_total || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 py-2 text-xs text-muted-foreground">
            {t("Operational cash & bank outflows today", "آج کے دن کی کل ادائیگیاں")}
          </CardContent>
        </Card>

        {/* This Month's Expenses */}
        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardHeader className="py-3 px-4 pb-1">
            <CardDescription className="text-xs font-semibold tracking-wider uppercase flex items-center gap-1 text-amber-700 dark:text-amber-400">
              <IconCalendar className="h-3.5 w-3.5" />
              {t("This Month", "اس ماہ کا خرچ")}
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-400">
              {formatPKR(summary?.month_total || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 py-2 text-xs text-muted-foreground">
            {t("Current calendar month accumulated", "موجودہ مہینے کے مجموعی اخراجات")}
          </CardContent>
        </Card>

        {/* Paid via Cash Drawer */}
        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardHeader className="py-3 px-4 pb-1">
            <CardDescription className="text-xs font-semibold tracking-wider uppercase flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
              <IconCash className="h-3.5 w-3.5" />
              {t("Cash Drawer", "کاؤنٹر دراز سے ادا")}
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-mono text-foreground">
              {formatPKR(summary?.cash_total || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 py-2 text-xs text-muted-foreground">
            {t("Reflected live in Day Book (Roznamcha)", "روزنامچہ میں کیش آؤٹ کا اندراج")}
          </CardContent>
        </Card>

        {/* Paid via Bank / Digital */}
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="py-3 px-4 pb-1">
            <CardDescription className="text-xs font-semibold tracking-wider uppercase flex items-center gap-1 text-blue-700 dark:text-blue-400">
              <IconBuildingBank className="h-3.5 w-3.5" />
              {t("Bank & Digital", "بینک / آن لائن")}
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-mono text-foreground">
              {formatPKR(summary?.bank_total || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 py-2 text-xs text-muted-foreground">
            {t("Bank transfers, cheques, and Raast payments", "بینک ٹرانسفر، چیک اور آن لائن ادائیگیاں")}
          </CardContent>
        </Card>
      </div>

      {/* Top Expense Categories Breakdown Chips */}
      {summary && summary.category_breakdown && summary.category_breakdown.length > 0 && (
        <Card className="shadow-sm bg-muted/20 border">
          <CardHeader className="py-3 px-4 pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 text-foreground">
              <IconFileDollar className="h-3.5 w-3.5 text-rose-600" />
              {t("Top Expense Heads This Month", "اخراجات کی تفصیل")}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0">
            <div className="flex flex-wrap gap-2">
              {summary.category_breakdown.map((cat) => (
                <div
                  key={cat.account_id}
                  onClick={() => setSelectedCategory(String(cat.account_id))}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                    selectedCategory === String(cat.account_id)
                      ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                      : "bg-card hover:bg-muted text-card-foreground border-border"
                  }`}
                >
                  <span className="font-mono font-medium opacity-80">{cat.account_code}</span>
                  <span className="font-semibold">{cat.account_name}</span>
                  <span className="font-mono font-bold bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded text-[11px]">
                    {formatPKR(cat.amount)}
                  </span>
                  <span className="text-[10px] opacity-75">({cat.count})</span>
                </div>
              ))}
              {selectedCategory !== "all" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCategory("all")}
                  className="h-7 text-xs px-2 text-rose-600"
                >
                  {t("Clear Category Filter", "فلٹر ختم کریں")}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Toolbar */}
      <Card className="shadow-sm">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="flex-1 min-w-[200px] relative">
              <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("Search voucher #, payee, ref #, or notes...", "تلاش کریں واؤچر، نام یا پرچی نمبر...")}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-8 h-9 text-xs"
              />
            </div>

            {/* Category Filter */}
            <div className="w-56">
              <Select
                value={selectedCategory}
                onValueChange={(val) => {
                  setSelectedCategory(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder={t("All Categories", "تمام اخراجات")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("All Expense Categories", "تمام اخراجات")}</SelectItem>
                  {expenseAccounts.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.code} - {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Branch Filter */}
            <div className="w-48">
              <Select
                value={selectedBranch}
                onValueChange={(val) => {
                  setSelectedBranch(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder={t("All Branches", "تمام برانچز")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("All Branches", "تمام برانچز")}</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name} ({b.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Method Filter */}
            <div className="w-36">
              <Select
                value={selectedMethod}
                onValueChange={(val) => {
                  setSelectedMethod(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder={t("All Methods", "تمام ذرائع")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("All Channels", "تمام چینلز")}</SelectItem>
                  <SelectItem value="cash">{t("Cash", "کیش")}</SelectItem>
                  <SelectItem value="bank_transfer">{t("Bank Transfer", "بینک ٹرانسفر")}</SelectItem>
                  <SelectItem value="card">{t("Card", "کارڈ")}</SelectItem>
                  <SelectItem value="raast">{t("Raast", "راست")}</SelectItem>
                  <SelectItem value="cheque">{t("Cheque", "چیک")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-1.5 text-xs">
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                className="h-9 w-32 text-xs"
                title="From Date"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                className="h-9 w-32 text-xs"
                title="To Date"
              />
            </div>

            {/* Reset Filters */}
            {(search || selectedCategory !== "all" || selectedBranch !== "all" || selectedMethod !== "all" || fromDate || toDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("all");
                  setSelectedBranch("all");
                  setSelectedMethod("all");
                  setFromDate("");
                  setToDate("");
                  setPage(1);
                }}
                className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                {t("Reset", "صاف کریں")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Expense Vouchers Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 text-xs">
                  <TableHead className="w-[120px] whitespace-nowrap">{t("Date & Time", "تاریخ")}</TableHead>
                  <TableHead className="w-[140px] whitespace-nowrap">{t("Voucher #", "واؤچر نمبر")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("Expense Category", "خرچہ کی مد")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("Payee", "وصول کنندہ")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("Paid From", "ادائیگی کا کھاتہ")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("Ref / Slip #", "بل / پرچی #")}</TableHead>
                  <TableHead className="text-right whitespace-nowrap">{t("Amount (PKR)", "رقم")}</TableHead>
                  <TableHead className="text-center w-[100px] whitespace-nowrap">{t("Status", "حیثیت")}</TableHead>
                  <TableHead className="text-center w-[120px] whitespace-nowrap">{t("Linked JV", "منسلک واؤچر")}</TableHead>
                  <TableHead className="text-right w-[100px] whitespace-nowrap">{t("Actions", "اختیارات")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12 text-sm text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <IconRefresh className="h-6 w-6 animate-spin text-rose-600" />
                        <span>{t("Loading expense vouchers...", "واؤچرز لوڈ ہو رہے ہیں...")}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12 text-sm text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <IconReceiptTax className="h-10 w-10 text-muted-foreground/40" />
                        <span className="font-medium text-foreground">{t("No expense vouchers recorded yet.", "ابھی تک کوئی خرچہ واؤچر درج نہیں ہوا")}</span>
                        <span className="text-xs">{t("Click 'Record Expense' above to add shop rent, electricity, chai, or fuel kharchay.", "اوپر دیے گئے بٹن سے نیا خرچہ شامل کریں۔")}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map((ev) => {
                    const isCancelled = ev.status === "cancelled";
                    const isCash = ev.payment_method === "cash";

                    return (
                      <TableRow
                        key={ev.id}
                        className={`hover:bg-muted/40 transition-colors ${
                          isCancelled ? "opacity-50 line-through" : ""
                        }`}
                      >
                        {/* Date */}
                        <TableCell className="font-mono text-xs whitespace-nowrap">
                          {new Date(ev.expense_date).toLocaleDateString([], {
                            month: "short",
                            day: "2-digit",
                            year: "numeric",
                          })}
                          <span className="block text-[10px] text-muted-foreground">
                            {new Date(ev.expense_date).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </TableCell>

                        {/* Voucher # */}
                        <TableCell className="font-mono text-xs font-bold text-foreground whitespace-nowrap">
                          <button
                            onClick={() => setViewItem(ev)}
                            className="hover:underline text-rose-600 dark:text-rose-400"
                          >
                            {ev.voucher_number}
                          </button>
                        </TableCell>

                        {/* Expense Category */}
                        <TableCell className="text-xs">
                          <div className="font-medium text-foreground">
                            {ev.expense_account_name}
                          </div>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            Code: {ev.expense_account_code}
                          </span>
                          {ev.narration && (
                            <div className="text-[11px] text-muted-foreground italic truncate max-w-xs mt-0.5">
                              {ev.narration}
                            </div>
                          )}
                        </TableCell>

                        {/* Payee */}
                        <TableCell className="text-xs font-medium text-foreground">
                          {ev.payee_name}
                          {ev.branch_name && (
                            <span className="block text-[10px] text-muted-foreground">
                              {ev.branch_name}
                            </span>
                          )}
                        </TableCell>

                        {/* Paid From */}
                        <TableCell className="text-xs whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {isCash ? (
                              <IconCash className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <IconBuildingBank className="h-3.5 w-3.5 text-blue-600" />
                            )}
                            <span className="font-mono text-xs">
                              {ev.paid_from_account_name}
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className="mt-0.5 text-[10px] uppercase font-mono px-1 py-0"
                          >
                            {ev.payment_method}
                          </Badge>
                        </TableCell>

                        {/* Ref / Slip # */}
                        <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {ev.reference_no || "—"}
                        </TableCell>

                        {/* Amount */}
                        <TableCell className="text-right font-mono text-xs font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                          -{formatPKR(ev.amount)}
                        </TableCell>

                        {/* Status */}
                        <TableCell className="text-center whitespace-nowrap">
                          {isCancelled ? (
                            <Badge variant="destructive" className="text-[10px]">
                              {t("Cancelled", "منسوخ")}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px]">
                              {t("Posted", "درج شدہ")}
                            </Badge>
                          )}
                        </TableCell>

                        {/* Linked JV */}
                        <TableCell className="text-center font-mono text-[11px] whitespace-nowrap">
                          {ev.journal_entry_number ? (
                            <Badge variant="outline" className="border-purple-300 text-purple-700 dark:border-purple-800 dark:text-purple-300">
                              {ev.journal_entry_number}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => setViewItem(ev)}
                              title="View Voucher Slip"
                            >
                              <IconEye className="h-3.5 w-3.5" />
                            </Button>

                            {!isCancelled && canDeleteExpense && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-rose-600"
                                onClick={() => setDeleteId(ev.id)}
                                title="Cancel / Void Voucher"
                              >
                                <IconTrash className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t text-xs text-muted-foreground">
              <div>
                Showing {(page - 1) * 15 + 1} to {Math.min(page * 15, totalExpenses)} of {totalExpenses} vouchers
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <span className="font-mono text-xs">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* RECORD EXPENSE MODAL (Standard Width: sm:max-w-4xl max-w-[95vw]) */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-4xl max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <IconReceiptTax className="h-5 w-5 text-rose-600" />
              {t("Record Operational Expense Voucher", "نیا خرچہ واؤچر")}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {t(
                "Direct CPV for shop rent, electricity, staff chai, fuel, and daily office kharchay. Balanced double-entry voucher is auto-posted.",
                "دکان اور دفتر کے روزمرہ اخراجات کی ادائیگی۔ ڈبل انٹری واؤچر خودکار پوسٹ ہو جائے گا۔"
              )}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Expense Category Head */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  {t("Expense Category", "کھاتہ / خرچہ کی قسم")} <span className="text-rose-500">*</span>
                </Label>
                <Select
                  value={formExpenseAccountId}
                  onValueChange={setFormExpenseAccountId}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select Operating Expense Head" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseAccounts.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>
                        <span className="font-mono font-medium text-rose-600 dark:text-rose-400 mr-2">
                          {a.code}
                        </span>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount (PKR) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  {t("Amount (PKR)", "رقم (روپے)")} <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-muted-foreground font-mono">
                    Rs.
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="e.g. 7500"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="pl-10 h-9 font-mono text-sm font-bold text-foreground"
                    required
                  />
                </div>
              </div>

              {/* Payee Name */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  {t("Payee / Paid To", "کس کو دی رقم")} <span className="text-rose-500">*</span>
                </Label>
                <Input
                  placeholder="e.g. LESCO, Landlord Malik Sb, Suleman Chai Wala"
                  value={formPayeeName}
                  onChange={(e) => setFormPayeeName(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              {/* Payment Channel & Paid From Account */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  {t("Paid From Account", "ادائیگی کا کھاتہ")} <span className="text-rose-500">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={formPaymentMethod}
                    onValueChange={(val) => {
                      setFormPaymentMethod(val);
                      if (val === "cash") {
                        const c = paymentAccounts.find((a) => a.code === "1010" || a.sub_type === "cash");
                        if (c) setFormPaidFromAccountId(String(c.id));
                      } else {
                        const b = paymentAccounts.find((a) => a.code === "1020" || a.sub_type === "bank");
                        if (b) setFormPaidFromAccountId(String(b.id));
                      }
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Channel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">{t("Cash", "کیش")}</SelectItem>
                      <SelectItem value="bank_transfer">{t("Bank Transfer", "بینک ٹرانسفر")}</SelectItem>
                      <SelectItem value="card">{t("Card", "کارڈ")}</SelectItem>
                      <SelectItem value="raast">{t("Raast", "راست")}</SelectItem>
                      <SelectItem value="cheque">{t("Cheque", "چیک")}</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={formPaidFromAccountId}
                    onValueChange={setFormPaidFromAccountId}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Account Head" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentAccounts.map((a) => (
                        <SelectItem key={a.id} value={String(a.id)}>
                          {a.code} - {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Branch */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  {t("Branch", "شاخ")}
                </Label>
                <Select
                  value={formBranchId}
                  onValueChange={setFormBranchId}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("Head Office / No Specific Branch", "مرکزی دفتر")}</SelectItem>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.name} ({b.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  {t("Expense Date", "تاریخ")}
                </Label>
                <Input
                  type="date"
                  value={formExpenseDate}
                  onChange={(e) => setFormExpenseDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              {/* Reference / Bill / Slip # */}
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs font-semibold text-foreground">
                  {t("Reference / Bill # / Consumer # / Receipt Slip", "بل یا پرچی نمبر")}
                </Label>
                <Input
                  placeholder="e.g. Electricity Consumer # 04 1122 334455, Slip # 8821"
                  value={formReferenceNo}
                  onChange={(e) => setFormReferenceNo(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              {/* Narration / Notes */}
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs font-semibold text-foreground">
                  {t("Narration / Notes", "وضاحت یا تفصیل")}
                </Label>
                <Textarea
                  placeholder="e.g. Paid monthly electricity bill for warehouse 1; or Chai and samosa for Saturday customer meeting"
                  value={formNarration}
                  onChange={(e) => setFormNarration(e.target.value)}
                  className="h-16 text-xs resize-none"
                />
              </div>
            </div>

            {/* LIVE DOUBLE-ENTRY AUDIT PREVIEW */}
            <div className="mt-4 p-3 bg-muted/40 border rounded-lg text-xs space-y-2">
              <div className="font-semibold text-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <IconNotes className="h-3.5 w-3.5 text-purple-600" />
                  {t("Auto-Posting Double-Entry Voucher Preview", "ڈبل انٹری واؤچر کا پیش منظر")}
                </span>
                <Badge variant="outline" className="border-emerald-500 text-emerald-600 dark:text-emerald-400 text-[10px]">
                  Balanced Invariant (Dr == Cr)
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-2 bg-card rounded border">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                    {t("Debit (Dr) - Expense Increased", "خرچہ بڑھا (Dr)")}
                  </span>
                  <div className="font-medium text-foreground mt-0.5">
                    {selectedExpObj ? `${selectedExpObj.code} - ${selectedExpObj.name}` : "Select expense category"}
                  </div>
                  <div className="font-mono font-bold text-rose-600 mt-1">
                    PKR {parseFloat(formAmount || "0").toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="p-2 bg-card rounded border">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                    {t("Credit (Cr) - Cash/Bank Decreased", "کیش یا بینک کم ہوا (Cr)")}
                  </span>
                  <div className="font-medium text-foreground mt-0.5">
                    {selectedPaidObj ? `${selectedPaidObj.code} - ${selectedPaidObj.name}` : "Select payment account"}
                  </div>
                  <div className="font-mono font-bold text-emerald-600 mt-1">
                    PKR {parseFloat(formAmount || "0").toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateModalOpen(false)}
                disabled={creating}
              >
                {t("Cancel", "منسوخ")}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={creating}
                className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
              >
                {creating ? "Posting..." : t("Save & Post Voucher", "واؤچر جاری کریں")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      </div>

      {/* VIEW VOUCHER DETAILS MODAL */}
      <Dialog open={!!viewItem} onOpenChange={(open) => !open && setViewItem(null)}>
        <DialogContent className="sm:max-w-4xl max-w-[96vw] w-full p-0 overflow-hidden print:static print:transform-none print:w-full print:max-w-none print:h-auto print:max-h-none print:overflow-visible print:border-none print:shadow-none print:p-0 print:m-0 print:ring-0 print:bg-white">
          {viewItem && (
            <div className="w-full min-w-0">
              {/* ---------------- Print-Only Official Document Header ---------------- */}
              <div className="hidden print:block p-6 pb-4 border-b">
                <div className="text-center">
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900">Paperless Business OS</h1>
                  <h2 className="text-base font-bold text-gray-800 uppercase tracking-wider mt-1">
                    CASH PAYMENT VOUCHER (CPV) / EXPENSE VOUCHER
                  </h2>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">Double-Entry Financial Audit Trail</p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 p-3 bg-gray-50 border border-gray-300 rounded text-xs font-mono">
                  <div className="space-y-1">
                    <div>
                      <span className="font-sans font-semibold text-gray-600">Voucher No:</span>{" "}
                      <strong className="text-gray-900">{viewItem.voucher_number}</strong>
                    </div>
                    <div>
                      <span className="font-sans font-semibold text-gray-600">Entry Date:</span>{" "}
                      {new Date(viewItem.expense_date).toLocaleDateString([], {
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                      })}
                    </div>
                    <div>
                      <span className="font-sans font-semibold text-gray-600">Branch:</span>{" "}
                      {viewItem.branch_name || "Head Office / Main Branch"}
                    </div>
                    <div>
                      <span className="font-sans font-semibold text-gray-600">Payee:</span>{" "}
                      <strong className="text-gray-900">{viewItem.payee_name}</strong>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div>
                      <span className="font-sans font-semibold text-gray-600">Journal Entry #:</span>{" "}
                      <strong className="text-gray-900">{viewItem.journal_entry_number || "Auto-Posted"}</strong>
                    </div>
                    <div>
                      <span className="font-sans font-semibold text-gray-600">Payment Account:</span>{" "}
                      <span className="text-gray-900">{viewItem.paid_from_account_name}</span> ({viewItem.payment_method.toUpperCase()})
                    </div>
                    <div>
                      <span className="font-sans font-semibold text-gray-600">Reference / Slip #:</span>{" "}
                      {viewItem.reference_no || "N/A"}
                    </div>
                    <div>
                      <span className="font-sans font-semibold text-gray-600">Amount Paid:</span>{" "}
                      <strong className="text-rose-700 text-sm">{formatPKR(viewItem.amount)}</strong>
                    </div>
                  </div>
                </div>

                {viewItem.narration && (
                  <div className="mt-3 p-2.5 bg-gray-50 border border-gray-300 rounded text-xs">
                    <span className="font-sans font-semibold text-gray-700">Memo / Narration:</span>{" "}
                    <span className="font-mono text-gray-900">{viewItem.narration}</span>
                  </div>
                )}
              </div>

              {/* ---------------- Screen-Only Header ---------------- */}
              <div className="p-5 border-b bg-muted/20 print:hidden">
                <div className="flex items-center justify-between pr-8">
                  <div>
                    <div className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
                      {t("Operational Expense Voucher (CPV)", "اخراجات واؤچر")}
                    </div>
                    <h2 className="text-xl font-bold font-mono text-foreground mt-0.5">
                      {viewItem.voucher_number}
                    </h2>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="font-mono text-xs">
                      JV: {viewItem.journal_entry_number || "Auto"}
                    </Badge>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      {new Date(viewItem.expense_date).toLocaleDateString([], {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* ---------------- Voucher Body (Cards & Table) ---------------- */}
              <div className="p-5 space-y-4 print:p-6 print:pt-4">
                {/* Voucher Detail Cards (Screen Only) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs print:hidden">
                  <div className="p-2.5 bg-muted/30 rounded border">
                    <span className="text-muted-foreground text-[10px] uppercase font-semibold">{t("Payee", "وصول کنندہ")}</span>
                    <div className="font-bold text-foreground mt-1">{viewItem.payee_name}</div>
                  </div>
                  <div className="p-2.5 bg-muted/30 rounded border">
                    <span className="text-muted-foreground text-[10px] uppercase font-semibold">{t("Expense Head", "خرچہ کی مد")}</span>
                    <div className="font-bold text-foreground mt-1">{viewItem.expense_account_name}</div>
                    <span className="font-mono text-[10px] text-muted-foreground">Code: {viewItem.expense_account_code}</span>
                  </div>
                  <div className="p-2.5 bg-muted/30 rounded border">
                    <span className="text-muted-foreground text-[10px] uppercase font-semibold">{t("Paid From Account", "ادائیگی کا کھاتہ")}</span>
                    <div className="font-bold text-foreground mt-1">{viewItem.paid_from_account_name}</div>
                    <span className="font-mono text-[10px] text-muted-foreground">Via {viewItem.payment_method.toUpperCase()}</span>
                  </div>
                  <div className="p-2.5 bg-muted/30 rounded border">
                    <span className="text-muted-foreground text-[10px] uppercase font-semibold">{t("Amount Paid", "ادا شدہ رقم")}</span>
                    <div className="text-base font-bold font-mono text-rose-600 mt-0.5">{formatPKR(viewItem.amount)}</div>
                  </div>
                </div>

                {/* Ref & Notes (Screen Only) */}
                {(viewItem.reference_no || viewItem.narration || viewItem.branch_name) && (
                  <div className="p-3 bg-muted/20 border rounded-lg text-xs space-y-1.5 print:hidden">
                    {viewItem.branch_name && (
                      <div>
                        <span className="text-muted-foreground font-semibold">{t("Branch", "شاخ")}: </span>
                        <span className="text-foreground">{viewItem.branch_name}</span>
                      </div>
                    )}
                    {viewItem.reference_no && (
                      <div>
                        <span className="text-muted-foreground font-semibold">{t("Reference / Slip #", "بل یا پرچی نمبر")}: </span>
                        <span className="font-mono text-foreground">{viewItem.reference_no}</span>
                      </div>
                    )}
                    {viewItem.narration && (
                      <div>
                        <span className="text-muted-foreground font-semibold">{t("Narration", "تفصیل")}: </span>
                        <span className="text-foreground italic">{viewItem.narration}</span>
                      </div>
                    )}
                    {viewItem.created_by_name && (
                      <div className="text-[11px] text-muted-foreground pt-1 border-t mt-2">
                        Recorded by: {viewItem.created_by_name} on {new Date(viewItem.created_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}

                {/* Balanced Double-Entry Breakdown Table */}
                <div className="border rounded-lg overflow-hidden print:border-gray-400 print:rounded-none">
                  <div className="bg-muted print:bg-gray-100 px-3 py-2 text-xs font-semibold text-foreground print:text-black flex items-center justify-between">
                    <span>{t("General Ledger Entries Posted to COA", "کھاتہ میں درج کی گئی ڈبل انٹری")}</span>
                    <span className="font-mono text-[10px] text-muted-foreground print:text-gray-700">Currency: PKR</span>
                  </div>
                  <Table className="w-full">
                    <TableHeader className="print:bg-gray-100">
                      <TableRow className="text-[11px] bg-muted/40 print:border-b-2 print:border-gray-400">
                        <TableHead className="w-[45%] text-xs print:text-black print:font-bold">{t("Account Code & Title", "کھاتہ نمبر و نام")}</TableHead>
                        <TableHead className="w-[15%] text-xs print:text-black print:font-bold">{t("Type", "قسم")}</TableHead>
                        <TableHead className="w-[20%] text-right text-xs print:text-black print:font-bold">{t("Debit (PKR)", "ڈیبٹ (Dr)")}</TableHead>
                        <TableHead className="w-[20%] text-right text-xs print:text-black print:font-bold">{t("Credit (PKR)", "کریڈٹ (Cr)")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="text-xs print:border-b print:border-gray-300">
                        <TableCell className="font-medium whitespace-normal break-words py-2.5">
                          <span className="font-mono font-bold text-foreground print:text-black mr-1.5">{viewItem.expense_account_code}</span>
                          {viewItem.expense_account_name}
                        </TableCell>
                        <TableCell className="text-muted-foreground print:text-gray-700 py-2.5">Expense</TableCell>
                        <TableCell className="text-right font-mono font-bold text-foreground print:text-black whitespace-nowrap py-2.5">
                          {formatPKR(viewItem.amount)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground print:text-gray-600 whitespace-nowrap py-2.5">0.00</TableCell>
                      </TableRow>
                      <TableRow className="text-xs print:border-b print:border-gray-300">
                        <TableCell className="font-medium whitespace-normal break-words py-2.5">
                          <span className="font-mono font-bold text-foreground print:text-black mr-1.5">{viewItem.paid_from_account_code}</span>
                          {viewItem.paid_from_account_name}
                        </TableCell>
                        <TableCell className="text-muted-foreground print:text-gray-700 py-2.5">Asset</TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground print:text-gray-600 whitespace-nowrap py-2.5">0.00</TableCell>
                        <TableCell className="text-right font-mono font-bold text-foreground print:text-black whitespace-nowrap py-2.5">
                          {formatPKR(viewItem.amount)}
                        </TableCell>
                      </TableRow>
                      <TableRow className="bg-muted/30 print:bg-gray-100 font-bold text-xs print:border-t-2 print:border-b-2 print:border-gray-500">
                        <TableCell colSpan={2} className="text-right print:text-black">{t("Totals (Balanced):", "کل میزان:")}</TableCell>
                        <TableCell className="text-right font-mono text-foreground print:text-black whitespace-nowrap">{formatPKR(viewItem.amount)}</TableCell>
                        <TableCell className="text-right font-mono text-foreground print:text-black whitespace-nowrap">{formatPKR(viewItem.amount)}</TableCell>
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
                        Prepared By ({viewItem.created_by_name || "Accountant"})
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="gap-1.5 text-xs"
                >
                  <IconPrinter className="h-4 w-4" />
                  {t("Print Voucher Slip", "پرچی پرنٹ کریں")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setViewItem(null)}
                  className="text-xs"
                >
                  {t("Close", "بند کریں")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* CANCEL / VOID CONFIRMATION DIALOG */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-destructive">
              {t("Cancel & Void Expense Voucher?", "کیا آپ یہ خرچہ واؤچر منسوخ کرنا چاہتے ہیں؟")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              {t(
                "This will mark the expense voucher as cancelled and automatically void its linked double-entry Journal Voucher in the General Ledger. This action will reverse its impact on Daybook and financial accounts.",
                "یہ واؤچر منسوخ کر دیا جائے گا اور کھاتہ میں اس کی ڈبل انٹری خودکار طور پر ختم کر دی جائے گی۔"
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("Keep Voucher", "واؤچر برقرار رکھیں")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelExpense}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {deleting ? "Cancelling..." : t("Yes, Cancel Voucher", "ہاں، منسوخ کریں")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
