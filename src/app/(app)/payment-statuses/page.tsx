"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  IconCreditCard,
  IconPlus,
  IconSearch,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconRefresh,
  IconCash,
  IconBuildingBank,
  IconScale,
  IconReceipt,
  IconLock,
  IconArrowBackUp,
} from "@tabler/icons-react";
import Link from "next/link";

import { useAuth } from "@/context/auth-context";
import {
  inventoryService,
  type PaymentStatusOptionItem,
} from "@/services/inventory.service";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function PaymentStatusesPage() {
  const { user, tenant } = useAuth();
  const userPerms = tenant?.permissions || [];
  const userRole = tenant?.role_name || "";
  const isOwnerOrAdmin =
    Boolean(user?.is_superadmin) ||
    userRole.toLowerCase() === "admin" ||
    userRole.toLowerCase() === "owner" ||
    userPerms.includes("*");

  const canView =
    isOwnerOrAdmin ||
    userPerms.includes("payment_statuses:view") ||
    userPerms.includes("payment_statuses:manage") ||
    userPerms.includes("purchases:view");

  const canCreate =
    isOwnerOrAdmin ||
    userPerms.includes("payment_statuses:create") ||
    userPerms.includes("payment_statuses:manage") ||
    userPerms.includes("purchases:create");

  const canEdit =
    isOwnerOrAdmin ||
    userPerms.includes("payment_statuses:edit") ||
    userPerms.includes("payment_statuses:manage") ||
    userPerms.includes("purchases:edit") ||
    userPerms.includes("purchases:create");

  const canDelete =
    isOwnerOrAdmin ||
    userPerms.includes("payment_statuses:delete") ||
    userPerms.includes("payment_statuses:manage") ||
    userPerms.includes("purchases:delete");

  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState<PaymentStatusOptionItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [effectFilter, setEffectFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");

  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<PaymentStatusOptionItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [statusName, setStatusName] = useState("");
  const [statusAccountingType, setStatusAccountingType] = useState<"paid" | "unpaid" | "partial">("paid");
  const [statusColor, setStatusColor] = useState("emerald");
  const [statusDescription, setStatusDescription] = useState("");
  const [statusIsActive, setStatusIsActive] = useState(true);

  // Delete State
  const [statusToDelete, setStatusToDelete] = useState<PaymentStatusOptionItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStatuses = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.listPaymentStatuses(false);
      setStatuses(data || []);
    } catch (err: unknown) {
      const errorMsg =
        (err as { message?: string })?.message ||
        "Failed to load payment statuses from server.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  const resetForm = () => {
    setEditingStatus(null);
    setStatusName("");
    setStatusAccountingType("paid");
    setStatusColor("emerald");
    setStatusDescription("");
    setStatusIsActive(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: PaymentStatusOptionItem) => {
    setEditingStatus(item);
    setStatusName(item.name);
    setStatusAccountingType(item.accounting_type);
    setStatusColor(item.color || "emerald");
    setStatusDescription(item.description || "");
    setStatusIsActive(item.is_active);
    setIsDialogOpen(true);
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusName.trim()) {
      toast.error("Status label cannot be blank.");
      return;
    }

    try {
      setSubmitting(true);
      if (editingStatus) {
        await inventoryService.updatePaymentStatus(editingStatus.id, {
          name: statusName.trim(),
          accounting_type: statusAccountingType,
          color: statusColor,
          description: statusDescription.trim() || undefined,
          is_active: statusIsActive,
        });
        toast.success(`Payment Status "${statusName}" updated successfully.`);
      } else {
        await inventoryService.createPaymentStatus({
          name: statusName.trim(),
          accounting_type: statusAccountingType,
          color: statusColor,
          description: statusDescription.trim() || undefined,
          is_active: statusIsActive,
        });
        toast.success(`Payment Status "${statusName}" created successfully.`);
      }

      setIsDialogOpen(false);
      resetForm();
      fetchStatuses();
    } catch (err: unknown) {
      const errorMsg =
        (err as { message?: string })?.message ||
        "Could not save payment status. Please try again.";
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStatus = async () => {
    if (!statusToDelete) return;
    try {
      setIsDeleting(true);
      await inventoryService.deletePaymentStatus(statusToDelete.id);
      toast.success(`Payment status "${statusToDelete.name}" removed successfully.`);
      setStatusToDelete(null);
      fetchStatuses();
    } catch (err: unknown) {
      const errorMsg =
        (err as { message?: string })?.message ||
        "Cannot delete this status because it is in use or protected.";
      toast.error(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered List
  const filteredStatuses = useMemo(() => {
    return statuses.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesCode = item.code.toLowerCase().includes(q);
        const matchesDesc = (item.description || "").toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesDesc) return false;
      }

      if (effectFilter !== "all" && item.accounting_type !== effectFilter) {
        return false;
      }

      if (activeFilter === "active" && !item.is_active) return false;
      if (activeFilter === "inactive" && item.is_active) return false;

      return true;
    });
  }, [statuses, searchQuery, effectFilter, activeFilter]);

  // Statistics Summary
  const stats = useMemo(() => {
    const total = statuses.length;
    const paidCount = statuses.filter((s) => s.accounting_type === "paid").length;
    const unpaidCount = statuses.filter((s) => s.accounting_type === "unpaid").length;
    const activeCount = statuses.filter((s) => s.is_active).length;
    return { total, paidCount, unpaidCount, activeCount };
  }, [statuses]);

  const renderBadge = (color: string, name: string) => {
    switch (color) {
      case "emerald":
        return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">{name}</Badge>;
      case "rose":
        return <Badge className="bg-rose-500/15 text-rose-600 border-rose-500/30">{name}</Badge>;
      case "amber":
        return <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30">{name}</Badge>;
      case "blue":
        return <Badge className="bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">{name}</Badge>;
      case "violet":
        return <Badge className="bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">{name}</Badge>;
      default:
        return <Badge variant="outline">{name}</Badge>;
    }
  };

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <div className="p-3 bg-destructive/10 text-destructive rounded-full">
          <IconLock className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold">Access Restricted</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          You do not have the required permissions (`payment_statuses:view`) to view or manage Payment Statuses.
        </p>
        <Button asChild variant="outline">
          <Link href="/purchases">
            <IconArrowBackUp className="h-4 w-4 mr-2" /> Return to Purchases & GRN
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Payment Statuses</h1>
            <Badge variant="outline" className="text-xs font-mono font-medium">
              {statuses.length} Options
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure dynamic payment status options, customize badges, and govern double-entry accounting sync.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStatuses}
            disabled={loading}
            className="h-9 gap-1.5"
          >
            <IconRefresh className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button asChild variant="outline" size="sm" className="h-9 gap-1.5">
            <Link href="/purchases">
              <IconReceipt className="h-4 w-4" />
              Purchases & GRN
            </Link>
          </Button>

          {canCreate && (
            <Button size="sm" onClick={openCreateDialog} className="h-9 gap-1.5">
              <IconPlus className="h-4 w-4" />
              Add Payment Status
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Statuses
            </CardTitle>
            <IconCreditCard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.activeCount} currently active</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Cash / Bank Settled
            </CardTitle>
            <IconCash className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-emerald-600">{stats.paidCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Cr. Cash or Bank immediately</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Supplier Credit (Khata)
            </CardTitle>
            <IconBuildingBank className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-rose-600">{stats.unpaidCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Cr. Accounts Payable Khata</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Accounting Policy
            </CardTitle>
            <IconScale className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold mt-1">Real-time Double Entry</div>
            <p className="text-xs text-muted-foreground mt-1">Syncs into Balance Sheet & Ledger</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="shadow-xs">
        <CardContent className="p-3.5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search payment statuses by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <Select value={effectFilter} onValueChange={setEffectFilter}>
                <SelectTrigger className="w-[160px] h-9 text-xs">
                  <SelectValue placeholder="All Effects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Accounting Effects</SelectItem>
                  <SelectItem value="paid" className="text-xs">Paid (Cash / Bank)</SelectItem>
                  <SelectItem value="unpaid" className="text-xs">Unpaid (Khata Payable)</SelectItem>
                  <SelectItem value="partial" className="text-xs">Partial Settlement</SelectItem>
                </SelectContent>
              </Select>

              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger className="w-[130px] h-9 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All States</SelectItem>
                  <SelectItem value="active" className="text-xs">Active Only</SelectItem>
                  <SelectItem value="inactive" className="text-xs">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[220px]">Status Label</TableHead>
                <TableHead className="w-[140px]">System Code</TableHead>
                <TableHead className="w-[140px]">Preview Badge</TableHead>
                <TableHead>Double-Entry Accounting Effect</TableHead>
                <TableHead className="w-[110px] text-center">State</TableHead>
                <TableHead className="w-[70px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-sm text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <IconRefresh className="h-4 w-4 animate-spin text-primary" />
                      Loading payment statuses...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredStatuses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-sm text-muted-foreground">
                    No payment statuses found matching your search and filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStatuses.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>{item.name}</span>
                        {item.is_system && (
                          <Badge variant="secondary" className="text-[10px] h-4.5 px-1.5 font-normal text-muted-foreground">
                            System
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-[11px] text-muted-foreground truncate max-w-[280px]">
                          {item.description}
                        </p>
                      )}
                    </TableCell>

                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                        {item.code}
                      </code>
                    </TableCell>

                    <TableCell>
                      {renderBadge(item.color, item.name)}
                    </TableCell>

                    <TableCell>
                      {item.accounting_type === "paid" && (
                        <div className="text-xs space-y-0.5">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            Dr. Inventory (1040) / Cr. Cash & Bank (1010)
                          </span>
                          <p className="text-[11px] text-muted-foreground">
                            Bill is marked Paid; cash is credited immediately without khata liability.
                          </p>
                        </div>
                      )}
                      {item.accounting_type === "unpaid" && (
                        <div className="text-xs space-y-0.5">
                          <span className="font-semibold text-rose-600 dark:text-rose-400">
                            Dr. Inventory (1040) / Cr. Accounts Payable (2010)
                          </span>
                          <p className="text-[11px] text-muted-foreground">
                            Added to Supplier Khata credit balance and shown as Outstanding Payable.
                          </p>
                        </div>
                      )}
                      {item.accounting_type === "partial" && (
                        <div className="text-xs space-y-0.5">
                          <span className="font-semibold text-amber-600 dark:text-amber-400">
                            Dr. Inventory (1040) / Split Cr. Cash + Accounts Payable
                          </span>
                          <p className="text-[11px] text-muted-foreground">
                            Cash portion credited from bank; remaining balance credited to supplier khata.
                          </p>
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="text-center">
                      {item.is_active ? (
                        <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 bg-emerald-500/10 text-[10px]">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground border-border text-[10px]">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <IconDotsVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          {canEdit && (
                            <DropdownMenuItem onClick={() => openEditDialog(item)}>
                              <IconEdit className="h-4 w-4 mr-2" />
                              Edit Option
                            </DropdownMenuItem>
                          )}
                          {canDelete && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setStatusToDelete(item)}
                                className="text-destructive focus:text-destructive"
                                disabled={item.is_system}
                              >
                                <IconTrash className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <form onSubmit={handleSaveStatus}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <IconCreditCard className="h-5 w-5 text-primary" />
                {editingStatus ? `Edit Payment Status` : "Add New Payment Status"}
              </DialogTitle>
              <DialogDescription>
                Configure the status title, badge design, and double-entry accounting behavior.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Status Label <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={statusName}
                  onChange={(e) => setStatusName(e.target.value)}
                  placeholder="e.g. Paid, Unpaid, Cheque Pending, Bank Transferred"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Accounting Effect <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={statusAccountingType || ("none" as any)}
                  onValueChange={(val: any) => {
                    if (val === "none") {
                      setStatusAccountingType("" as any);
                      return;
                    }
                    setStatusAccountingType(val);
                    if (!editingStatus) {
                      setStatusColor(val === "paid" ? "emerald" : val === "partial" ? "amber" : "rose");
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose One" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-muted-foreground">
                      Choose One
                    </SelectItem>
                    <SelectItem value="paid">
                      Paid (Dr. Inventory / Cr. Cash or Bank Account)
                    </SelectItem>
                    <SelectItem value="unpaid">
                      Unpaid (Dr. Inventory / Cr. Supplier Payable Khata)
                    </SelectItem>
                    <SelectItem value="partial">
                      Partial (Split Cash & Supplier Payable Khata)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Determines which general ledger accounts are debited and credited upon posting a purchase bill.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Badge Color Preview</Label>
                  <Select value={statusColor || "none"} onValueChange={(val) => setStatusColor(val === "none" ? "" : val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose One" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-muted-foreground">Choose One</SelectItem>
                      <SelectItem value="emerald">Emerald (Green)</SelectItem>
                      <SelectItem value="rose">Rose (Red)</SelectItem>
                      <SelectItem value="amber">Amber (Orange)</SelectItem>
                      <SelectItem value="blue">Blue (Primary)</SelectItem>
                      <SelectItem value="violet">Violet (Purple)</SelectItem>
                      <SelectItem value="zinc">Zinc (Gray)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Live Badge</Label>
                  <div className="h-9 flex items-center justify-center border rounded-md bg-muted/20">
                    {renderBadge(statusColor, statusName || "Preview")}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Description <span className="text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <Input
                  value={statusDescription}
                  onChange={(e) => setStatusDescription(e.target.value)}
                  placeholder="Optional internal remarks or usage guidance..."
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="statusIsActive"
                  checked={statusIsActive}
                  onChange={(e) => setStatusIsActive(e.target.checked)}
                  className="rounded border-input text-primary focus:ring-ring"
                />
                <Label htmlFor="statusIsActive" className="text-xs font-medium cursor-pointer">
                  Option is Active (Enabled for purchases selection)
                </Label>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : editingStatus ? "Save Changes" : "Create Status"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(statusToDelete)} onOpenChange={(open) => !open && setStatusToDelete(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <IconTrash className="h-5 w-5" />
              Delete Payment Status
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove the status option &ldquo;{statusToDelete?.name}&rdquo;?
            </DialogDescription>
          </DialogHeader>

          <p className="text-xs text-muted-foreground">
            Note: System default statuses cannot be deleted. Any existing purchase orders retaining this status code will remain valid in historical reporting.
          </p>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setStatusToDelete(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteStatus} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
