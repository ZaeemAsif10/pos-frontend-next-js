"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  IconBuildingStore,
  IconPlus,
  IconSearch,
  IconLayoutGrid,
  IconLayoutList,
  IconDotsVertical,
  IconPhone,
  IconMail,
  IconMapPin,
  IconEdit,
  IconTrash,
  IconAlertCircle,
  IconRefresh,
  IconCheck,
  IconCrown,
  IconBuildingWarehouse,
  IconArrowUpRight,
  IconBuildingFortress,
  IconReceipt2,
  IconShieldCheck,
  IconStar,
} from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAppEventListener } from "@/lib/events";
import {
  branchService,
  type BranchItem,
  type BranchType,
  type BranchQuotaUsage,
  type BranchCreatePayload,
  type BranchUpdatePayload,
} from "@/services/branch.service";

const branchTypeConfig: Record<
  BranchType,
  { label: string; icon: any; color: string; bg: string }
> = {
  retail_shop: {
    label: "Retail Shop / POS",
    icon: IconBuildingStore,
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/30",
  },
  warehouse_godown: {
    label: "Central Warehouse / Godown",
    icon: IconBuildingWarehouse,
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/30",
  },
  wholesale_depot: {
    label: "Wholesale Depot",
    icon: IconBuildingFortress,
    color: "text-purple-700 dark:text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/30",
  },
};

const pakistaniCities = [
  "Lahore",
  "Karachi",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Sialkot",
  "Gujranwala",
  "Hyderabad",
  "Abbottabad",
  "Bahawalpur",
  "Sargodha",
  "Sukkur",
];

export default function BranchesPage() {
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [quota, setQuota] = useState<BranchQuotaUsage | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Add Dialog
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [addForm, setAddForm] = useState<BranchCreatePayload>({
    name: "",
    code: "",
    type: "retail_shop",
    phone: "",
    email: "",
    city: "Lahore",
    address: "",
    fbr_pos_id: "",
    is_main: false,
    is_active: true,
  });
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});

  // Edit Dialog
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchItem | null>(null);
  const [editForm, setEditForm] = useState<BranchUpdatePayload>({
    name: "",
    code: "",
    type: "retail_shop",
    phone: "",
    email: "",
    city: "",
    address: "",
    fbr_pos_id: "",
    is_active: true,
    is_main: false,
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Delete Dialog
  const [deletingBranch, setDeletingBranch] = useState<BranchItem | null>(null);

  // Upgrade Modal Dialog
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  // Load Data
  const loadBranches = async () => {
    try {
      setLoading(true);
      const res = await branchService.listBranches();
      setBranches(res.branches || []);
      setQuota(res.quota || null);
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to load branches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  // Reactive UI: auto-refresh branch cards/table when branches change anywhere
  useAppEventListener("branches:changed", () => {
    loadBranches();
  });

  // Filtered branches
  const filteredBranches = useMemo(() => {
    return branches.filter((b) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        b.city.toLowerCase().includes(q) ||
        b.phone.includes(q) ||
        (b.address && b.address.toLowerCase().includes(q));

      const matchType = typeFilter === "all" || b.type === typeFilter;
      const matchCity = cityFilter === "all" || b.city.toLowerCase() === cityFilter.toLowerCase();
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && b.is_active) ||
        (statusFilter === "inactive" && !b.is_active);

      return matchSearch && matchType && matchCity && matchStatus;
    });
  }, [branches, search, typeFilter, cityFilter, statusFilter]);

  const paginatedBranches = useMemo(() => {
    return filteredBranches.slice((page - 1) * pageSize, page * pageSize);
  }, [filteredBranches, page, pageSize]);

  // Handle open add branch
  const handleOpenAdd = () => {
    if (quota && quota.is_reached) {
      setIsUpgradeOpen(true);
      return;
    }

    // Auto-generate next branch code like BR-02
    const nextCode = `BR-0${branches.length + 1}`;
    setAddForm({
      name: "",
      code: nextCode,
      type: "retail_shop",
      phone: "",
      email: "",
      city: "Lahore",
      address: "",
      fbr_pos_id: "",
      is_main: branches.length === 0,
      is_active: true,
    });
    setAddErrors({});
    setIsAddOpen(true);
  };

  // Submit Add
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!addForm.name.trim()) errors.name = "Branch or shop name is required";
    if (!addForm.code.trim()) errors.code = "Unique branch code is required";
    if (!addForm.phone.trim()) errors.phone = "Phone number is required";
    if (!addForm.city.trim()) errors.city = "City is required";

    if (Object.keys(errors).length > 0) {
      setAddErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);
      setAddErrors({});
      await branchService.createBranch({
        ...addForm,
        name: addForm.name.trim(),
        code: addForm.code.trim().toUpperCase(),
        phone: addForm.phone.trim(),
        city: addForm.city.trim(),
        email: addForm.email?.trim() || null,
        address: addForm.address?.trim() || null,
        fbr_pos_id: addForm.fbr_pos_id?.trim() || null,
      });

      toast.success("New shop/branch location created successfully!");
      setIsAddOpen(false);
      await loadBranches();
    } catch (err: any) {
      if (err?.status === 403 || err?.detail?.includes("plan limit") || err?.detail?.includes("maximum allowed")) {
        setIsAddOpen(false);
        setIsUpgradeOpen(true);
        toast.error(err?.detail || "Branch quota exceeded for your current plan");
      } else {
        toast.error(err?.detail || err?.message || "Failed to create branch");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit
  const handleOpenEdit = (branch: BranchItem) => {
    setEditingBranch(branch);
    setEditForm({
      name: branch.name,
      code: branch.code,
      type: branch.type,
      phone: branch.phone,
      email: branch.email || "",
      city: branch.city,
      address: branch.address || "",
      fbr_pos_id: branch.fbr_pos_id || "",
      is_active: branch.is_active,
      is_main: branch.is_main,
    });
    setEditErrors({});
    setIsEditOpen(true);
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch) return;

    const errors: Record<string, string> = {};
    if (!editForm.name?.trim()) errors.name = "Branch name is required";
    if (!editForm.code?.trim()) errors.code = "Branch code is required";
    if (!editForm.phone?.trim()) errors.phone = "Phone number is required";
    if (!editForm.city?.trim()) errors.city = "City is required";

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);
      setEditErrors({});
      await branchService.updateBranch(editingBranch.id, {
        ...editForm,
        name: editForm.name?.trim(),
        code: editForm.code?.trim().toUpperCase(),
        phone: editForm.phone?.trim(),
        city: editForm.city?.trim(),
        email: editForm.email?.trim() || null,
        address: editForm.address?.trim() || null,
        fbr_pos_id: editForm.fbr_pos_id?.trim() || null,
      });

      toast.success("Branch details updated successfully!");
      setIsEditOpen(false);
      await loadBranches();
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to update branch");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Set Main Branch
  const handleSetMain = async (branch: BranchItem) => {
    if (branch.is_main) return;
    try {
      await branchService.setMainBranch(branch.id);
      toast.success(`'${branch.name}' is now set as the primary headquarters!`);
      await loadBranches();
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to set main branch");
    }
  };

  // Handle Delete Confirm
  const handleDeleteConfirm = async () => {
    if (!deletingBranch) return;
    try {
      setIsDeleting(true);
      await branchService.deleteBranch(deletingBranch.id);
      toast.success(`Branch '${deletingBranch.name}' removed successfully!`);
      setDeletingBranch(null);
      await loadBranches();
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to delete branch");
    } finally {
      setIsDeleting(false);
    }
  };

  // Quota percentage calculation
  const quotaUsed = quota?.used ?? branches.length;
  const quotaMax = quota?.max ?? 1;
  const isUnlimited = quota?.is_unlimited ?? false;
  const isQuotaReached = quota?.is_reached ?? false;
  const quotaPercent = isUnlimited ? 20 : Math.min(Math.round((quotaUsed / quotaMax) * 100), 100);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <PageHeader
            title="Shops & Branches"
            description="Manage your business retail shops, wholesale outlets, and central godowns across Pakistan."
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadBranches}
            disabled={loading}
            className="gap-2"
          >
            <IconRefresh className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button
            onClick={handleOpenAdd}
            className={cn(
              "gap-2 font-medium shadow-sm",
              isQuotaReached
                ? "bg-amber-600 hover:bg-amber-700 text-white"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {isQuotaReached ? (
              <>
                <IconCrown className="h-4 w-4" />
                Upgrade to Add Branch
              </>
            ) : (
              <>
                <IconPlus className="h-4 w-4" />
                Add New Branch
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Plan Quota Usage Banner */}
      <Card className="border-border/60 bg-gradient-to-r from-card to-muted/20 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Active Subscription Quota
                </span>
                <Badge variant="outline" className="font-medium text-xs">
                  {quota?.plan_name || "Current Plan"}
                </Badge>
                {isQuotaReached && (
                  <Badge variant="destructive" className="text-xs">
                    Quota Reached
                  </Badge>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight">
                  {quotaUsed}
                </span>
                <span className="text-sm text-muted-foreground">
                  / {isUnlimited ? "Unlimited" : `${quotaMax} Allowed Locations`}
                </span>
              </div>
              <div className="w-full max-w-md pt-1">
                <Progress
                  value={quotaPercent}
                  className={cn(
                    "h-2",
                    isQuotaReached
                      ? "[&>div]:bg-red-500"
                      : quotaPercent > 75
                      ? "[&>div]:bg-amber-500"
                      : "[&>div]:bg-emerald-500"
                  )}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isQuotaReached ? (
                <Button
                  size="sm"
                  onClick={() => setIsUpgradeOpen(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white gap-2 font-medium"
                >
                  <IconCrown className="h-4 w-4" />
                  Upgrade Plan to Add More
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Link href="/admin/plans">
                    View Plan Features
                    <IconArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Area */}
      {loading ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center justify-center gap-3">
            <IconRefresh className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading branch network...</p>
          </div>
        </Card>
      ) : viewMode === "table" ? (
        /* TABLE VIEW */
        <Card className="shadow-sm border-border/70 overflow-hidden">
          {/* Unified Toolbar inside Card */}
          <div className="p-3.5 border-b bg-card/60 flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative w-72 md:w-80">
                <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search branch, code, city..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-8 h-9 text-xs"
                />
              </div>

              {/* Type Filter */}
              <Select
                value={typeFilter}
                onValueChange={(val) => {
                  setTypeFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-40 h-9 text-xs">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Shop Types</SelectItem>
                  <SelectItem value="retail_shop">Retail Shop</SelectItem>
                  <SelectItem value="warehouse_godown">Warehouse / Godown</SelectItem>
                  <SelectItem value="wholesale_depot">Wholesale Depot</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-36 h-9 text-xs">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-medium">
                {filteredBranches.length} Branches Found
              </span>
              <div className="flex items-center gap-1 border rounded-md p-0.5 bg-muted/30">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className="h-7 px-2.5"
                  title="Table View"
                >
                  <IconLayoutList className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-7 px-2.5"
                  title="Grid Card View"
                >
                  <IconLayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[280px]">Shop / Branch Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>City & Address</TableHead>
                <TableHead>Contact Phone</TableHead>
                <TableHead>FBR POS Machine</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBranches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center space-y-3">
                      <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground">
                        <IconBuildingStore className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-semibold text-base text-foreground">No Branches Found</h4>
                        <p className="text-xs text-muted-foreground">
                          {search || typeFilter !== "all" || statusFilter !== "all"
                            ? "No branches match your active filters. Try clearing your filters."
                            : "You don't have any branches registered yet. Add your first shop location to get started."}
                        </p>
                      </div>
                      {search || typeFilter !== "all" || statusFilter !== "all" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSearch("");
                            setTypeFilter("all");
                            setStatusFilter("all");
                            setPage(1);
                          }}
                          className="h-8 text-xs mt-2"
                        >
                          Clear Filters
                        </Button>
                      ) : (
                        <Button size="sm" onClick={handleOpenAdd} className="h-8 text-xs mt-2">
                          <IconPlus className="h-3.5 w-3.5 mr-1" />
                          Add Branch
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedBranches.map((branch) => {
                const typeInfo = branchTypeConfig[branch.type] || branchTypeConfig.retail_shop;
                const TypeIcon = typeInfo.icon;

                return (
                  <TableRow key={branch.id} className="hover:bg-muted/30">
                    {/* Name & Code */}
                    <TableCell>
                      <div className="flex items-start gap-2.5">
                        <div
                          className={cn(
                            "h-9 w-9 shrink-0 rounded-lg flex items-center justify-center border",
                            branch.is_main
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                              : typeInfo.bg
                          )}
                        >
                          <TypeIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-sm text-foreground">
                              {branch.name}
                            </span>
                            {branch.is_main && (
                              <Badge
                                variant="outline"
                                className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] font-semibold flex items-center gap-1 py-0 h-4"
                              >
                                <IconStar className="h-3 w-3 fill-amber-500" />
                                Main HQ
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs font-mono text-muted-foreground uppercase">
                            {branch.code}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Type Badge */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("text-xs font-medium border", typeInfo.bg, typeInfo.color)}
                      >
                        {typeInfo.label.split("/")[0].trim()}
                      </Badge>
                    </TableCell>

                    {/* City & Address */}
                    <TableCell>
                      <div className="text-xs space-y-0.5">
                        <div className="font-medium text-foreground flex items-center gap-1">
                          <IconMapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          {branch.city}
                        </div>
                        {branch.address ? (
                          <div className="text-muted-foreground truncate max-w-[220px]">
                            {branch.address}
                          </div>
                        ) : (
                          <div className="text-muted-foreground/60 italic">No street address</div>
                        )}
                      </div>
                    </TableCell>

                    {/* Phone */}
                    <TableCell>
                      <div className="text-xs space-y-0.5">
                        <div className="font-mono text-foreground">{branch.phone}</div>
                        {branch.email && (
                          <div className="text-muted-foreground text-[11px] truncate max-w-[160px]">
                            {branch.email}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* FBR POS ID */}
                    <TableCell>
                      {branch.fbr_pos_id ? (
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-mono text-xs gap-1"
                        >
                          <IconShieldCheck className="h-3.5 w-3.5" />
                          {branch.fbr_pos_id}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground/60 italic">—</span>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs capitalize font-medium",
                          branch.is_active
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {branch.is_active ? "Active" : "Disabled"}
                      </Badge>
                    </TableCell>

                    {/* Actions Menu */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <IconDotsVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {!branch.is_main && (
                            <DropdownMenuItem
                              onClick={() => handleSetMain(branch)}
                              className="text-xs gap-2"
                            >
                              <IconStar className="h-4 w-4 text-amber-500" />
                              Set as Main HQ
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleOpenEdit(branch)}
                            className="text-xs gap-2"
                          >
                            <IconEdit className="h-4 w-4" />
                            Edit Branch
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeletingBranch(branch)}
                            disabled={branch.is_main || branches.length <= 1}
                            className="text-xs gap-2 text-destructive focus:text-destructive"
                          >
                            <IconTrash className="h-4 w-4" />
                            Delete Branch
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              }))}
            </TableBody>
          </Table>
          <DataTablePagination
            page={page}
            pageSize={pageSize}
            total={filteredBranches.length}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
          />
        </Card>
      ) : (
        /* GRID CARD VIEW */
        <div className="space-y-4">
          <Card className="border border-border/70 overflow-hidden shadow-sm">
            <div className="p-3.5 bg-card/60 flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative w-72 md:w-80">
                  <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search branch, code, city..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="pl-8 h-9 text-xs"
                  />
                </div>

                <Select
                  value={typeFilter}
                  onValueChange={(val) => {
                    setTypeFilter(val);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-40 h-9 text-xs">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Shop Types</SelectItem>
                    <SelectItem value="retail_shop">Retail Shop</SelectItem>
                    <SelectItem value="warehouse_godown">Warehouse / Godown</SelectItem>
                    <SelectItem value="wholesale_depot">Wholesale Depot</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={statusFilter}
                  onValueChange={(val) => {
                    setStatusFilter(val);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-36 h-9 text-xs">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground font-medium">
                  {filteredBranches.length} Branches Found
                </span>
                <div className="flex items-center gap-1 border rounded-md p-0.5 bg-muted/30">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode("table")}
                    className="h-7 px-2.5"
                    title="Table View"
                  >
                    <IconLayoutList className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="h-7 px-2.5"
                    title="Grid Card View"
                  >
                    <IconLayoutGrid className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {filteredBranches.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <IconBuildingStore className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg">No Branches Found</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {search || typeFilter !== "all" || statusFilter !== "all"
                    ? "No branches match your active filters. Try clearing your filters."
                    : "You don't have any branches registered yet. Add your first shop location to get started."}
                </p>
                {search || typeFilter !== "all" || statusFilter !== "all" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearch("");
                      setTypeFilter("all");
                      setStatusFilter("all");
                      setPage(1);
                    }}
                  >
                    Clear Filters
                  </Button>
                ) : (
                  <Button size="sm" onClick={handleOpenAdd}>
                    <IconPlus className="h-4 w-4 mr-1.5" />
                    Add First Branch
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedBranches.map((branch) => {
              const typeInfo = branchTypeConfig[branch.type] || branchTypeConfig.retail_shop;
              const TypeIcon = typeInfo.icon;

            return (
              <Card
                key={branch.id}
                className={cn(
                  "relative overflow-hidden transition-all duration-200 hover:shadow-md border",
                  branch.is_main
                    ? "border-amber-500/40 bg-gradient-to-br from-amber-500/[0.03] to-card"
                    : "border-border/70 bg-card"
                )}
              >
                {branch.is_main && (
                  <div className="absolute top-0 right-0 bg-amber-500 text-amber-950 font-bold text-[10px] tracking-wider uppercase px-3 py-0.5 rounded-bl-lg shadow-sm flex items-center gap-1">
                    <IconStar className="h-3 w-3 fill-amber-950" />
                    Primary HQ
                  </div>
                )}

                <CardHeader className="pb-3 pt-5">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "h-10 w-10 shrink-0 rounded-lg flex items-center justify-center border",
                        branch.is_main
                          ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                          : typeInfo.bg
                      )}
                    >
                      <TypeIcon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1 min-w-0 flex-1">
                      <CardTitle className="text-base font-bold truncate">
                        {branch.name}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold uppercase text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {branch.code}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn("text-[11px] font-medium py-0 h-5", typeInfo.bg, typeInfo.color)}
                        >
                          {typeInfo.label.split("/")[0].trim()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pb-4 text-xs">
                  <div className="space-y-1.5 border-t pt-3">
                    <div className="flex items-center text-muted-foreground gap-2">
                      <IconMapPin className="h-4 w-4 shrink-0 text-foreground" />
                      <span className="font-medium text-foreground">{branch.city}</span>
                      {branch.address && (
                        <span className="truncate text-muted-foreground">
                          — {branch.address}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-muted-foreground gap-2">
                      <IconPhone className="h-4 w-4 shrink-0 text-foreground" />
                      <span className="font-mono text-foreground">{branch.phone}</span>
                    </div>
                    {branch.email && (
                      <div className="flex items-center text-muted-foreground gap-2">
                        <IconMail className="h-4 w-4 shrink-0 text-foreground" />
                        <span className="truncate">{branch.email}</span>
                      </div>
                    )}
                  </div>

                  {branch.fbr_pos_id && (
                    <div className="p-2 rounded bg-muted/40 border border-border/50 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <IconShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        FBR Digital POS
                      </span>
                      <span className="font-mono font-semibold text-foreground">
                        {branch.fbr_pos_id}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-medium",
                        branch.is_active
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {branch.is_active ? "Operational" : "Inactive"}
                    </Badge>

                    <div className="flex items-center gap-1">
                      {!branch.is_main && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetMain(branch)}
                          className="h-7 text-xs text-amber-600 hover:text-amber-700 px-2"
                        >
                          Set Main
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(branch)}
                        className="h-7 w-7 p-0"
                      >
                        <IconEdit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingBranch(branch)}
                        disabled={branch.is_main || branches.length <= 1}
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      >
                        <IconTrash className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
        <Card className="border border-border/70 overflow-hidden shadow-sm">
          <DataTablePagination
            page={page}
            pageSize={pageSize}
            total={filteredBranches.length}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
          />
        </Card>
      </div>
    )}

      {/* CREATE NEW BRANCH DIALOG */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconBuildingStore className="h-5 w-5 text-primary" />
              Add New Shop or Godown
            </DialogTitle>
            <DialogDescription>
              Provision a new physical retail shop, wholesale depot, or storage godown.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Branch Name */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="branch_name">
                  Shop / Branch Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="branch_name"
                  placeholder="e.g. Gulberg Retail Outlet"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                />
                {addErrors.name && (
                  <p className="text-xs text-destructive">{addErrors.name}</p>
                )}
              </div>

              {/* Branch Code */}
              <div className="space-y-1.5">
                <Label htmlFor="branch_code">
                  Branch Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="branch_code"
                  placeholder="e.g. BR-02"
                  value={addForm.code}
                  onChange={(e) => setAddForm({ ...addForm, code: e.target.value.toUpperCase() })}
                  className="font-mono uppercase"
                />
                {addErrors.code && (
                  <p className="text-xs text-destructive">{addErrors.code}</p>
                )}
              </div>

              {/* Branch Type */}
              <div className="space-y-1.5">
                <Label htmlFor="branch_type">Location Type</Label>
                <Select
                  value={addForm.type}
                  onValueChange={(val) => setAddForm({ ...addForm, type: val as BranchType })}
                >
                  <SelectTrigger id="branch_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retail_shop">Retail Shop / POS</SelectItem>
                    <SelectItem value="warehouse_godown">Warehouse / Godown</SelectItem>
                    <SelectItem value="wholesale_depot">Wholesale Depot</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* City */}
              <div className="space-y-1.5">
                <Label htmlFor="branch_city">
                  City <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={addForm.city}
                  onValueChange={(val) => setAddForm({ ...addForm, city: val })}
                >
                  <SelectTrigger id="branch_city">
                    <SelectValue placeholder="Select City" />
                  </SelectTrigger>
                  <SelectContent>
                    {pakistaniCities.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {addErrors.city && (
                  <p className="text-xs text-destructive">{addErrors.city}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="branch_phone">
                  Contact Phone <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="branch_phone"
                  placeholder="0300-1234567"
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                />
                {addErrors.phone && (
                  <p className="text-xs text-destructive">{addErrors.phone}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="branch_email">Branch Email (Optional)</Label>
                <Input
                  id="branch_email"
                  type="email"
                  placeholder="branch@mybusiness.com"
                  value={addForm.email || ""}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                />
              </div>

              {/* Street Address */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="branch_address">Full Street Address (Optional)</Label>
                <Textarea
                  id="branch_address"
                  placeholder="Shop # 14, Main Commercial Market, Liberty..."
                  value={addForm.address || ""}
                  onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
                  rows={2}
                />
              </div>

              {/* FBR POS Machine ID */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="branch_fbr">
                  FBR POS Machine ID (Optional)
                </Label>
                <Input
                  id="branch_fbr"
                  placeholder="e.g. POS-98214"
                  value={addForm.fbr_pos_id || ""}
                  onChange={(e) => setAddForm({ ...addForm, fbr_pos_id: e.target.value })}
                />
                <p className="text-[11px] text-muted-foreground">
                  Provided by Federal Board of Revenue for fiscal invoicing compliance.
                </p>
              </div>

              {/* Set as Main Branch */}
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 sm:col-span-2">
                <div className="space-y-0.5">
                  <Label htmlFor="is_main" className="cursor-pointer font-medium">
                    Set as Primary Headquarters
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Designates this branch as the primary corporate address on invoices.
                  </p>
                </div>
                <Switch
                  id="is_main"
                  checked={addForm.is_main}
                  onCheckedChange={(val) => setAddForm({ ...addForm, is_main: val })}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                {isSubmitting && <IconRefresh className="h-4 w-4 animate-spin" />}
                {isSubmitting ? "Creating..." : "Create Branch"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT BRANCH DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconEdit className="h-5 w-5 text-primary" />
              Edit Branch Details
            </DialogTitle>
            <DialogDescription>
              Update location name, operational type, contact information, and address.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Branch Name */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="edit_branch_name">
                  Shop / Branch Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit_branch_name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
                {editErrors.name && (
                  <p className="text-xs text-destructive">{editErrors.name}</p>
                )}
              </div>

              {/* Branch Code */}
              <div className="space-y-1.5">
                <Label htmlFor="edit_branch_code">
                  Branch Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit_branch_code"
                  value={editForm.code}
                  onChange={(e) => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })}
                  className="font-mono uppercase"
                />
                {editErrors.code && (
                  <p className="text-xs text-destructive">{editErrors.code}</p>
                )}
              </div>

              {/* Branch Type */}
              <div className="space-y-1.5">
                <Label htmlFor="edit_branch_type">Location Type</Label>
                <Select
                  value={editForm.type}
                  onValueChange={(val) => setEditForm({ ...editForm, type: val as BranchType })}
                >
                  <SelectTrigger id="edit_branch_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retail_shop">Retail Shop / POS</SelectItem>
                    <SelectItem value="warehouse_godown">Warehouse / Godown</SelectItem>
                    <SelectItem value="wholesale_depot">Wholesale Depot</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* City */}
              <div className="space-y-1.5">
                <Label htmlFor="edit_branch_city">
                  City <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={editForm.city}
                  onValueChange={(val) => setEditForm({ ...editForm, city: val })}
                >
                  <SelectTrigger id="edit_branch_city">
                    <SelectValue placeholder="Select City" />
                  </SelectTrigger>
                  <SelectContent>
                    {pakistaniCities.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editErrors.city && (
                  <p className="text-xs text-destructive">{editErrors.city}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="edit_branch_phone">
                  Contact Phone <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit_branch_phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
                {editErrors.phone && (
                  <p className="text-xs text-destructive">{editErrors.phone}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="edit_branch_email">Branch Email</Label>
                <Input
                  id="edit_branch_email"
                  type="email"
                  value={editForm.email || ""}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>

              {/* Street Address */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="edit_branch_address">Full Street Address</Label>
                <Textarea
                  id="edit_branch_address"
                  value={editForm.address || ""}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  rows={2}
                />
              </div>

              {/* FBR POS Machine ID */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="edit_branch_fbr">FBR POS Machine ID</Label>
                <Input
                  id="edit_branch_fbr"
                  value={editForm.fbr_pos_id || ""}
                  onChange={(e) => setEditForm({ ...editForm, fbr_pos_id: e.target.value })}
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 sm:col-span-2">
                <div className="space-y-0.5">
                  <Label htmlFor="edit_is_active" className="cursor-pointer font-medium">
                    Branch Operational Status
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Disable branch if temporary closed or under renovation.
                  </p>
                </div>
                <Switch
                  id="edit_is_active"
                  checked={editForm.is_active}
                  onCheckedChange={(val) => setEditForm({ ...editForm, is_active: val })}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                {isSubmitting && <IconRefresh className="h-4 w-4 animate-spin" />}
                {isSubmitting ? "Saving Changes..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <AlertDialog
        open={Boolean(deletingBranch)}
        onOpenChange={(open) => !open && setDeletingBranch(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <IconAlertCircle className="h-5 w-5" />
              Delete Branch Location?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Are you sure you want to permanently delete the branch{" "}
                  <strong className="text-foreground">{deletingBranch?.name}</strong>{" "}
                  (<code>{deletingBranch?.code}</code>)?
                </p>
                <p className="text-xs text-muted-foreground">
                  This action cannot be undone. Ensure inventory, staff assignments, and POS registers are migrated beforehand.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteConfirm();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5"
            >
              {isDeleting && <IconRefresh className="h-4 w-4 animate-spin" />}
              {isDeleting ? "Deleting..." : "Confirm Deletion"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* UPGRADE PLAN DIALOG */}
      <Dialog open={isUpgradeOpen} onOpenChange={setIsUpgradeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
              <IconCrown className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-lg">
              Branch Quota Limit Reached
            </DialogTitle>
            <DialogDescription className="text-center text-sm">
              Your business is currently using{" "}
              <strong>
                {quotaUsed} of {quotaMax}
              </strong>{" "}
              allowed branch locations on the{" "}
              <strong>{quota?.plan_name || "Basic"}</strong> plan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <IconBuildingStore className="h-4 w-4 text-primary" />
                Why Upgrade to Multi-Branch?
              </div>
              <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                <li>Manage multiple retail outlets across various cities</li>
                <li>Centralized warehouse & godown inventory control</li>
                <li>Inter-branch stock transfers and real-time tracking</li>
                <li>Separate digital POS billing registers per shop</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button asChild className="w-full bg-amber-600 hover:bg-amber-700 text-white gap-2">
              <Link href="/admin/plans">
                <IconCrown className="h-4 w-4" />
                Upgrade Subscription Plan
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsUpgradeOpen(false)}
              className="w-full"
            >
              Continue with Current Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
