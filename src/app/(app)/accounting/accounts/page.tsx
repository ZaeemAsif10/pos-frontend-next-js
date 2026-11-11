"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  IconHierarchy,
  IconPlus,
  IconSearch,
  IconRefresh,
  IconLock,
  IconEdit,
  IconTrash,
  IconArrowUpRight,
  IconArrowDownLeft,
  IconBuildingBank,
  IconCash,
  IconFileText,
  IconChevronRight,
  IconChevronDown,
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
  type AccountItem,
  type AccountTreeNode,
} from "@/services/accounting.service";

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [treeNodes, setTreeNodes] = useState<AccountTreeNode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "tree">("table");

  // Modal State
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingAcc, setEditingAcc] = useState<AccountItem | null>(null);
  const [modalSaving, setModalSaving] = useState<boolean>(false);

  // Form Fields
  const [fCode, setFCode] = useState<string>("");
  const [fName, setFName] = useState<string>("");
  const [fType, setFType] = useState<string>("asset");
  const [fSubType, setFSubType] = useState<string>("");
  const [fParentId, setFParentId] = useState<string>("none");
  const [fDescription, setFDescription] = useState<string>("");

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const [list, tree] = await Promise.all([
        accountingService.listAccounts({
          account_type: selectedType === "all" ? undefined : selectedType,
          active_only: false,
        }),
        accountingService.getAccountTree(),
      ]);
      setAccounts(list);
      setTreeNodes(tree);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load Chart of Accounts.");
    } finally {
      setLoading(false);
    }
  }, [selectedType]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const openCreateModal = () => {
    setEditingAcc(null);
    setFCode("");
    setFName("");
    setFType(selectedType !== "all" ? selectedType : "asset");
    setFSubType("");
    setFParentId("none");
    setFDescription("");
    setModalOpen(true);
  };

  const openEditModal = (acc: AccountItem) => {
    setEditingAcc(acc);
    setFCode(acc.code);
    setFName(acc.name);
    setFType(acc.account_type);
    setFSubType(acc.sub_type || "");
    setFParentId(acc.parent_id ? acc.parent_id.toString() : "none");
    setFDescription(acc.description || "");
    setModalOpen(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fCode.trim() || !fName.trim()) {
      toast.error("Please provide both Account Code and Name.");
      return;
    }

    setModalSaving(true);
    try {
      if (editingAcc) {
        await accountingService.updateAccount(editingAcc.id, {
          name: fName.trim(),
          account_type: fType,
          sub_type: fSubType.trim() || undefined,
          parent_id: fParentId === "none" ? undefined : parseInt(fParentId),
          description: fDescription.trim() || undefined,
        });
        toast.success(`Account ${fCode} updated successfully.`);
      } else {
        await accountingService.createAccount({
          code: fCode.trim(),
          name: fName.trim(),
          account_type: fType,
          sub_type: fSubType.trim() || undefined,
          parent_id: fParentId === "none" ? undefined : parseInt(fParentId),
          description: fDescription.trim() || undefined,
        });
        toast.success(`Account ${fCode} created successfully.`);
      }
      setModalOpen(false);
      loadAccounts();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save account.");
    } finally {
      setModalSaving(false);
    }
  };

  const handleDeleteAccount = async (acc: AccountItem) => {
    if (acc.is_system) {
      toast.error("System accounts cannot be deleted.");
      return;
    }
    if (!confirm(`Are you sure you want to delete custom account '${acc.code} — ${acc.name}'?`)) {
      return;
    }

    try {
      await accountingService.deleteAccount(acc.id);
      toast.success("Account deleted successfully.");
      loadAccounts();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete account.");
    }
  };

  // Client-side search
  const filteredAccounts = accounts.filter((a) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q);
  });

  // Calculate High-level totals
  const totAssets = accounts
    .filter((a) => a.account_type === "asset")
    .reduce((sum, a) => sum + a.current_balance, 0);

  const totLiabilities = accounts
    .filter((a) => a.account_type === "liability")
    .reduce((sum, a) => sum + a.current_balance, 0);

  const totEquity = accounts
    .filter((a) => a.account_type === "equity")
    .reduce((sum, a) => sum + a.current_balance, 0);

  const totRevenue = accounts
    .filter((a) => a.account_type === "revenue")
    .reduce((sum, a) => sum + a.current_balance, 0);

  const totExpenses = accounts
    .filter((a) => a.account_type === "expense")
    .reduce((sum, a) => sum + a.current_balance, 0);

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <IconHierarchy className="h-6 w-6 text-primary" />
            Chart of Accounts (COA)
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            General Ledger structure • Assets, Liabilities, Equity, Revenue, and Operating Expenses
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center rounded-lg border bg-card p-0.5">
            <Button
              type="button"
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="h-8 text-xs font-semibold px-2.5"
            >
              Table View
            </Button>
            <Button
              type="button"
              variant={viewMode === "tree" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("tree")}
              className="h-8 text-xs font-semibold px-2.5"
            >
              Tree Hierarchy
            </Button>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadAccounts}
            disabled={loading}
            className="h-9 gap-1.5"
          >
            <IconRefresh className={`h-4 w-4 ${loading ? "animate-spin text-primary" : ""}`} />
            Refresh
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={openCreateModal}
            className="h-9 gap-1.5"
          >
            <IconPlus className="h-4 w-4" />
            <span>New Account</span>
          </Button>
        </div>
      </div>

      {/* 5 KPI Category Balance Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="shadow-2xs">
          <CardContent className="p-3.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              1000 • Assets
            </p>
            <p className="text-lg font-bold text-foreground mt-0.5">
              PKR {totAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Cash, Bank, Debtors, Stock</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardContent className="p-3.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              2000 • Liabilities
            </p>
            <p className="text-lg font-bold text-foreground mt-0.5">
              PKR {totLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Suppliers, Tax Payables</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardContent className="p-3.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              3000 • Equity
            </p>
            <p className="text-lg font-bold text-foreground mt-0.5">
              PKR {totEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Capital & Retained Earnings</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardContent className="p-3.5">
            <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              4000 • Revenue
            </p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              PKR {totRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Gross Sales & Income</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardContent className="p-3.5">
            <p className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              5000/6000 • Expenses
            </p>
            <p className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-0.5">
              PKR {totExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">COGS & Operating Expenses</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Row: Type Tabs + Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/30 p-3 rounded-lg border">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "all", label: "All Accounts" },
            { id: "asset", label: "Assets" },
            { id: "liability", label: "Liabilities" },
            { id: "equity", label: "Equity" },
            { id: "revenue", label: "Revenue" },
            { id: "expense", label: "Expenses" },
          ].map((tab) => (
            <Button
              key={tab.id}
              type="button"
              variant={selectedType === tab.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType(tab.id)}
              className="h-8 text-xs px-2.5"
            >
              {tab.label}
            </Button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <IconSearch className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search code or account name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs bg-card"
          />
        </div>
      </div>

      {/* View: Table View */}
      {viewMode === "table" ? (
        <div className="rounded-xl border bg-card overflow-hidden shadow-2xs">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[110px] text-xs font-semibold">Code</TableHead>
                <TableHead className="text-xs font-semibold">Account Name</TableHead>
                <TableHead className="w-[130px] text-xs font-semibold">Class</TableHead>
                <TableHead className="w-[140px] text-xs font-semibold">Category / Sub-type</TableHead>
                <TableHead className="text-right w-[160px] text-xs font-semibold">Current Balance</TableHead>
                <TableHead className="w-[100px] text-center text-xs font-semibold">Type</TableHead>
                <TableHead className="text-right w-[120px] text-xs font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16 text-xs text-muted-foreground">
                    <IconRefresh className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
                    Loading Chart of Accounts...
                  </TableCell>
                </TableRow>
              ) : filteredAccounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16 text-xs text-muted-foreground">
                    No accounts found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAccounts.map((acc) => {
                  const isAssetExp = acc.account_type === "asset" || acc.account_type === "expense";
                  return (
                    <TableRow key={acc.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-mono text-xs font-bold text-foreground">
                        {acc.code}
                      </TableCell>

                      <TableCell className="text-xs font-medium">
                        <div className="flex items-center gap-1.5">
                          <span>{acc.name}</span>
                          {acc.parent_name && (
                            <span className="text-[10px] text-muted-foreground">
                              ({acc.parent_name})
                            </span>
                          )}
                        </div>
                        {acc.description && (
                          <p className="text-[11px] text-muted-foreground truncate max-w-md">
                            {acc.description}
                          </p>
                        )}
                      </TableCell>

                      <TableCell className="text-xs uppercase font-medium">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            acc.account_type === "asset"
                              ? "bg-blue-500/10 text-blue-600 border-blue-200"
                              : acc.account_type === "liability"
                              ? "bg-amber-500/10 text-amber-600 border-amber-200"
                              : acc.account_type === "revenue"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                              : acc.account_type === "expense"
                              ? "bg-rose-500/10 text-rose-600 border-rose-200"
                              : "bg-purple-500/10 text-purple-600 border-purple-200"
                          }`}
                        >
                          {acc.account_type}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground capitalize">
                        {acc.sub_type?.replace(/_/g, " ") || "—"}
                      </TableCell>

                      <TableCell
                        className={`text-right text-xs font-bold font-mono ${
                          acc.current_balance > 0
                            ? isAssetExp
                              ? "text-foreground"
                              : "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        PKR {acc.current_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>

                      <TableCell className="text-center">
                        {acc.is_system ? (
                          <Badge variant="secondary" className="text-[10px] gap-1 font-normal">
                            <IconLock className="h-3 w-3 text-muted-foreground" />
                            Core
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] font-normal">
                            Custom
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            title="View General Ledger"
                          >
                            <Link href={`/accounting/ledger?account_id=${acc.id}`}>
                              <IconFileText className="h-3.5 w-3.5 text-primary" />
                            </Link>
                          </Button>

                          {!acc.is_system && (
                            <>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditModal(acc)}
                                className="h-7 w-7 p-0"
                                title="Edit Account"
                              >
                                <IconEdit className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteAccount(acc)}
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                title="Delete Custom Account"
                              >
                                <IconTrash className="h-3.5 w-3.5" />
                              </Button>
                            </>
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
      ) : (
        /* View: Tree Hierarchy */
        <div className="rounded-xl border bg-card p-5 shadow-2xs space-y-4">
          <p className="text-xs text-muted-foreground">
            Hierarchical chart of accounts tree. Parent accounts consolidate sub-accounts.
          </p>
          <div className="space-y-2">
            {treeNodes.map((node) => (
              <div key={node.id} className="p-2.5 rounded-lg border bg-muted/20">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-primary font-bold">{node.code}</span>
                    <span>{node.name}</span>
                    <Badge variant="outline" className="text-[9px] uppercase">
                      {node.account_type}
                    </Badge>
                  </span>
                  <span className="font-mono">
                    PKR {node.current_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {node.children && node.children.length > 0 && (
                  <div className="pl-6 pt-2 space-y-1.5 border-l-2 ml-3 mt-1.5 border-primary/20">
                    {node.children.map((child) => (
                      <div key={child.id} className="flex items-center justify-between text-xs py-1">
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-muted-foreground">{child.code}</span>
                          <span>{child.name}</span>
                        </span>
                        <span className="font-mono font-medium">
                          PKR {child.current_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Create / Edit Account */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[550px] w-full p-0 overflow-hidden">
          <form onSubmit={handleSaveAccount}>
            <DialogHeader className="p-5 border-b bg-muted/20">
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <IconHierarchy className="h-5 w-5 text-primary" />
                {editingAcc ? `Edit Account: ${editingAcc.code}` : "Create New Custom Account"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Add an account to your Chart of Accounts for tracking specific banks, expenses, or revenues.
              </DialogDescription>
            </DialogHeader>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Account Code *</Label>
                  <Input
                    placeholder="e.g. 1025 or 6045"
                    value={fCode}
                    onChange={(e) => setFCode(e.target.value)}
                    disabled={!!editingAcc}
                    className="h-9 text-xs font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Account Class *</Label>
                  <Select value={fType} onValueChange={setFType}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asset">Asset (1000)</SelectItem>
                      <SelectItem value="liability">Liability (2000)</SelectItem>
                      <SelectItem value="equity">Equity (3000)</SelectItem>
                      <SelectItem value="revenue">Revenue (4000)</SelectItem>
                      <SelectItem value="expense">Expense (5000/6000)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Account Name *</Label>
                <Input
                  placeholder="e.g. Meezan Bank (Gulberg Branch) or Factory Rent"
                  value={fName}
                  onChange={(e) => setFName(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Sub-type / Category</Label>
                  <Input
                    placeholder="e.g. bank, cash, rent, utility"
                    value={fSubType}
                    onChange={(e) => setFSubType(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Parent Account (Optional)</Label>
                  <Select value={fParentId} onValueChange={setFParentId}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="No Parent (Top-level)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Top-Level Account)</SelectItem>
                      {accounts
                        .filter((a) => !editingAcc || a.id !== editingAcc.id)
                        .map((a) => (
                          <SelectItem key={a.id} value={a.id.toString()}>
                            {a.code} — {a.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Description / Notes</Label>
                <Input
                  placeholder="Optional description of what this account records"
                  value={fDescription}
                  onChange={(e) => setFDescription(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="px-5 py-3 border-t bg-muted/20 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(false)}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={modalSaving}
                className="h-9 text-xs font-semibold"
              >
                {modalSaving ? "Saving..." : editingAcc ? "Update Account" : "Create Account"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
