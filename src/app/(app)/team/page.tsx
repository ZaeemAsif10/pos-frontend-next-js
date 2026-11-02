"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  IconUserPlus,
  IconUsers,
  IconShieldLock,
  IconSearch,
  IconLayoutGrid,
  IconLayoutList,
  IconDotsVertical,
  IconMail,
  IconPhone,
  IconEdit,
  IconTrash,
  IconAlertCircle,
  IconRefresh,
  IconCheck,
  IconKey,
  IconPercentage,
  IconCrown,
  IconUserCheck,
  IconUserX,
  IconArrowUpRight,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { cn } from "@/lib/utils";
import {
  teamService,
  type StaffMember,
  type StaffRole,
  type StaffListResponse,
  type StaffCreatePayload,
  type StaffUpdatePayload,
} from "@/services/team.service";

const roleColors: Record<string, string> = {
  Owner: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
  Admin: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30",
  Manager: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/30",
  Accountant: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  Salesman: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
  Cashier: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/30",
  "Warehouse Manager": "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/30",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function TeamManagementPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StaffListResponse | null>(null);
  const [roles, setRoles] = useState<StaffRole[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Add Dialog & Form State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [addForm, setAddForm] = useState<StaffCreatePayload>({
    full_name: "",
    phone: "",
    email: "",
    password: "",
    role_id: 0,
    max_discount_pct: 0,
  });
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});

  // Edit Dialog & Form State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [editForm, setEditForm] = useState<StaffUpdatePayload>({
    full_name: "",
    role_id: 0,
    max_discount_pct: 0,
    is_active: true,
    password: "",
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Delete State
  const [deletingStaff, setDeletingStaff] = useState<StaffMember | null>(null);

  // Load Data
  const loadTeamData = async () => {
    try {
      setLoading(true);
      const [listRes, rolesRes] = await Promise.all([
        teamService.getStaffList(),
        teamService.getRoles(),
      ]);
      setData(listRes);
      setRoles(rolesRes);
      if (rolesRes.length > 0 && addForm.role_id === 0) {
        setAddForm((prev) => ({ ...prev, role_id: rolesRes[0].id }));
      }
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to load team data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeamData();
  }, []);

  // Filtered members
  const filteredMembers = useMemo(() => {
    if (!data?.items) return [];
    return data.items.filter((m) => {
      const matchSearch =
        m.full_name.toLowerCase().includes(search.toLowerCase()) ||
        (m.email && m.email.toLowerCase().includes(search.toLowerCase())) ||
        (m.phone && m.phone.includes(search)) ||
        m.role_name.toLowerCase().includes(search.toLowerCase());

      const matchRole =
        roleFilter === "all" ||
        (roleFilter === "owner" && m.is_owner) ||
        m.role_id.toString() === roleFilter;

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && m.is_active) ||
        (statusFilter === "inactive" && !m.is_active);

      return matchSearch && matchRole && matchStatus;
    });
  }, [data?.items, search, roleFilter, statusFilter]);

  const paginatedMembers = useMemo(() => {
    return filteredMembers.slice((page - 1) * pageSize, page * pageSize);
  }, [filteredMembers, page, pageSize]);

  // Validation Logic for Add Form
  const validateAddForm = () => {
    const errs: Record<string, string> = {};

    if (!addForm.full_name.trim() || addForm.full_name.trim().length < 2) {
      errs.full_name = "Full name must be at least 2 characters long.";
    }

    if (!addForm.phone?.trim() && !addForm.email?.trim()) {
      errs.identifier = "Either mobile phone number or email address is required.";
      errs.phone = "Provide mobile number or email.";
      errs.email = "Provide mobile number or email.";
    }

    if (addForm.phone && addForm.phone.trim().length < 10) {
      errs.phone = "Mobile number must be at least 10 digits (e.g. 03001234567).";
    }

    if (addForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addForm.email.trim())) {
      errs.email = "Please enter a valid email address.";
    }

    if (!addForm.password || addForm.password.length < 6) {
      errs.password = "Password must be at least 6 characters long.";
    }

    if (!addForm.role_id) {
      errs.role_id = "Please select a staff role.";
    }

    if (
      addForm.max_discount_pct === undefined ||
      addForm.max_discount_pct < 0 ||
      addForm.max_discount_pct > 100
    ) {
      errs.max_discount_pct = "Discount limit must be between 0% and 100%.";
    }

    setAddErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAddForm()) return;

    try {
      setIsSubmitting(true);
      await teamService.createStaff({
        ...addForm,
        phone: addForm.phone?.trim() || undefined,
        email: addForm.email?.trim() || undefined,
      });

      toast.success("Staff member created successfully!", {
        description: `${addForm.full_name} has been added to your business team.`,
      });

      setIsAddOpen(false);
      setAddForm({
        full_name: "",
        phone: "",
        email: "",
        password: "",
        role_id: roles[0]?.id || 0,
        max_discount_pct: 0,
      });
      setAddErrors({});
      loadTeamData();
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to create staff member");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validation Logic for Edit Form
  const validateEditForm = () => {
    const errs: Record<string, string> = {};

    if (!editForm.full_name?.trim() || editForm.full_name.trim().length < 2) {
      errs.full_name = "Full name must be at least 2 characters.";
    }

    if (
      editForm.max_discount_pct === undefined ||
      editForm.max_discount_pct < 0 ||
      editForm.max_discount_pct > 100
    ) {
      errs.max_discount_pct = "Discount limit must be between 0% and 100%.";
    }

    if (editForm.password && editForm.password.length < 6) {
      errs.password = "New password must be at least 6 characters.";
    }

    setEditErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const openEditModal = (member: StaffMember) => {
    setEditingStaff(member);
    setEditForm({
      full_name: member.full_name,
      role_id: member.role_id,
      max_discount_pct: member.max_discount_pct,
      is_active: member.is_active,
      password: "",
    });
    setEditErrors({});
    setIsEditOpen(true);
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff || !validateEditForm()) return;

    try {
      setIsSubmitting(true);
      const payload: StaffUpdatePayload = {
        full_name: editForm.full_name,
        role_id: editingStaff.is_owner ? undefined : editForm.role_id,
        max_discount_pct: editForm.max_discount_pct,
        is_active: editingStaff.is_owner ? undefined : editForm.is_active,
        password: editForm.password ? editForm.password : undefined,
      };

      await teamService.updateStaff(editingStaff.id, payload);
      toast.success("Staff profile updated successfully!");
      setIsEditOpen(false);
      loadTeamData();
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to update staff member");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (member: StaffMember) => {
    if (member.is_owner) {
      toast.error("Business owner account cannot be deactivated.");
      return;
    }
    try {
      const nextStatus = !member.is_active;
      await teamService.updateStaff(member.id, { is_active: nextStatus });
      toast.success(
        nextStatus
          ? `${member.full_name} is now active.`
          : `${member.full_name} has been deactivated.`
      );
      loadTeamData();
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to update status");
    }
  };

  const handleDeleteStaff = async () => {
    if (!deletingStaff) return;
    try {
      setIsDeleting(true);
      await teamService.deleteStaff(deletingStaff.id);
      toast.success(`${deletingStaff.full_name} removed from your team.`);
      setDeletingStaff(null);
      loadTeamData();
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to delete staff member");
    } finally {
      setIsDeleting(false);
    }
  };

  // Quota calculation
  const usedStaff = data?.used_staff || 0;
  const maxStaff = data?.max_staff;
  const isQuotaFull = maxStaff !== null && maxStaff !== undefined && usedStaff >= maxStaff;
  const quotaPct = maxStaff ? Math.min(Math.round((usedStaff / maxStaff) * 100), 100) : 0;
  const canManage = data?.can_manage !== false;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Users"
        description="Manage business staff logins (Cashiers, Salesmen, Accountants, Warehouse Managers), discount thresholds, and seat quotas."
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadTeamData}
            disabled={loading}
            className="gap-1.5"
          >
            <IconRefresh className={cn("size-4", loading && "animate-spin")} />
            Refresh
          </Button>

          {canManage ? (
            <Button
              size="sm"
              onClick={() => {
                setAddErrors({});
                setIsAddOpen(true);
              }}
              disabled={isQuotaFull}
              className="gap-1.5 bg-primary shadow-sm"
            >
              <IconUserPlus className="size-4" />
              Add User
            </Button>
          ) : (
            <Badge
              variant="outline"
              className="px-2.5 py-1 text-xs text-muted-foreground gap-1.5 bg-muted/40 font-normal"
            >
              <IconShieldLock className="size-3.5 text-muted-foreground" />
              Owner/Admin Only
            </Badge>
          )}
        </div>
      </PageHeader>


      {/* Quota Notice if Limit Exceeded / Reached */}
      {isQuotaFull && (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200 animate-in fade-in-50">
          <div className="flex items-start gap-3">
            <IconAlertCircle className="size-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-semibold text-sm">
                Staff Seat Limit Reached ({usedStaff} / {maxStaff})
              </p>
              <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                Your current subscription tier (
                <span className="font-semibold">{data?.plan_name}</span>) allows up to{" "}
                {maxStaff} staff members. To onboard more cashiers, sales agents, or managers,
                upgrade your subscription.
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant="default" className="shrink-0 gap-1.5 shadow-sm">
            <Link href="/pricing">
              Upgrade Plan
              <IconArrowUpRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      )}

      {/* Quick Statistics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Seat Quota Card */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Staff Seats Quota
              </span>
              <Badge variant="outline" className="font-normal text-[11px] capitalize">
                {data?.plan_name || "Plan"}
              </Badge>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight tabular-nums">
                {usedStaff}
              </span>
              <span className="text-sm text-muted-foreground">
                / {maxStaff === null || maxStaff === undefined ? "Unlimited" : `${maxStaff} Seats`}
              </span>
            </div>
            {maxStaff && (
              <div className="mt-3 space-y-1">
                <Progress value={quotaPct} className="h-1.5" />
                <p className="text-[11px] text-muted-foreground text-right tabular-nums">
                  {quotaPct}% used
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Accounts Card */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Active Staff
              </span>
              <span className="flex size-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600">
                <IconUserCheck className="size-4" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums">
              {data?.items.filter((m) => m.is_active).length || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Active staff members authorized for POS & ERP
            </p>
          </CardContent>
        </Card>

        {/* Roles Distribution */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Available Roles
              </span>
              <span className="flex size-7 items-center justify-center rounded-md bg-blue-500/10 text-blue-600">
                <IconShieldLock className="size-4" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums">
              {roles.length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Admin, Cashier, Salesman, Accountant, Warehouse
            </p>
          </CardContent>
        </Card>

        {/* Business Owner Card */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Account Owner
              </span>
              <span className="flex size-7 items-center justify-center rounded-md bg-amber-500/10 text-amber-600">
                <IconCrown className="size-4" />
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold truncate">
              {data?.items.find((m) => m.is_owner)?.full_name || "Business Owner"}
            </p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {data?.items.find((m) => m.is_owner)?.phone ||
                data?.items.find((m) => m.is_owner)?.email ||
                "Primary Contact"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <Card className="border border-border/70 overflow-hidden shadow-sm">
        <div className="p-3.5 border-b bg-card/60 flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-72 md:w-80">
              <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search staff by name, phone, or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-8 h-9 text-xs"
              />
            </div>

            <Select
              value={roleFilter}
              onValueChange={(val) => {
                setRoleFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-36 text-xs">
                <SelectValue placeholder="Filter Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.id.toString()}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-36 text-xs">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-medium">
              {filteredMembers.length} Members Found
            </span>
            <div className="flex items-center rounded-md border bg-muted/30 p-0.5">
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="icon"
                className="size-7"
                onClick={() => setViewMode("table")}
              >
                <IconLayoutList className="size-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="size-7"
                onClick={() => setViewMode("grid")}
              >
                <IconLayoutGrid className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <IconRefresh className="size-8 animate-spin text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground font-medium">
                Loading team members...
              </p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <IconUsers className="size-6 text-muted-foreground" />
              </div>
              <h3 className="mt-3 font-semibold text-base">No staff members found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                {search || roleFilter !== "all" || statusFilter !== "all"
                  ? "No results matching your filters. Try adjusting your search query."
                  : "You haven't added any additional staff members yet. Click 'Add Staff Member' to get started."}
              </p>
              {!isQuotaFull && canManage && (
                <Button
                  size="sm"
                  className="mt-4 gap-1.5"
                  onClick={() => {
                    setAddErrors({});
                    setIsAddOpen(true);
                  }}
                >
                  <IconUserPlus className="size-4" />
                  Add First User
                </Button>
              )}
            </div>
          ) : viewMode === "table" ? (

            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[280px]">Staff Member</TableHead>
                  <TableHead>Assigned Role</TableHead>
                  <TableHead>Contact Information</TableHead>
                  <TableHead className="text-center">Max Discount</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMembers.map((member) => (
                  <TableRow key={member.id} className="group">
                    {/* Member Identity */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9 border">
                          <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                            {getInitials(member.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-sm text-foreground">
                              {member.full_name}
                            </span>
                            {member.is_owner && (
                              <Badge
                                variant="outline"
                                className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px] py-0 px-1 font-semibold gap-1"
                              >
                                <IconCrown className="size-2.5" /> Owner
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Joined {new Date(member.joined_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Role Badge */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-medium text-xs border py-0.5 px-2.5",
                          roleColors[member.role_name] ||
                            "bg-muted text-muted-foreground border-border"
                        )}
                      >
                        {member.role_name}
                      </Badge>
                    </TableCell>

                    {/* Contact */}
                    <TableCell>
                      <div className="space-y-0.5 text-xs text-muted-foreground">
                        {member.phone && (
                          <div className="flex items-center gap-1.5">
                            <IconPhone className="size-3.5 text-muted-foreground/70" />
                            <span className="font-mono text-foreground">{member.phone}</span>
                          </div>
                        )}
                        {member.email && (
                          <div className="flex items-center gap-1.5">
                            <IconMail className="size-3.5 text-muted-foreground/70" />
                            <span>{member.email}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Discount Threshold */}
                    <TableCell className="text-center">
                      {member.is_owner ? (
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          Full Authority
                        </span>
                      ) : (
                        <span className="font-mono text-xs font-medium tabular-nums bg-muted px-2 py-0.5 rounded">
                          {member.max_discount_pct}%
                        </span>
                      )}
                    </TableCell>

                    {/* Status Toggle */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span
                          className={cn(
                            "size-2 rounded-full",
                            member.is_active ? "bg-emerald-500" : "bg-slate-400"
                          )}
                        />
                        <span className="text-xs font-medium">
                          {member.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </TableCell>

                    {/* Action Dropdown */}
                    <TableCell className="text-right">
                      {canManage ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <IconDotsVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => openEditModal(member)}>
                              <IconEdit className="size-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            {!member.is_owner && (
                              <>
                                <DropdownMenuItem onClick={() => handleToggleStatus(member)}>
                                  {member.is_active ? (
                                    <>
                                      <IconUserX className="size-4 mr-2 text-amber-600" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <IconUserCheck className="size-4 mr-2 text-emerald-600" />
                                      Activate
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setDeletingStaff(member)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <IconTrash className="size-4 mr-2" />
                                  Remove User
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="text-xs text-muted-foreground italic pr-2">Read-only</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            /* Grid View */
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedMembers.map((member) => (
                <Card key={member.id} className="relative overflow-hidden group border shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-11 border shadow-xs">
                          <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
                            {getInitials(member.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-semibold text-sm leading-none text-foreground">
                              {member.full_name}
                            </h4>
                            {member.is_owner && (
                              <IconCrown className="size-3.5 text-amber-500 shrink-0" />
                            )}
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "mt-1.5 text-[11px] font-medium py-0 px-2 border",
                              roleColors[member.role_name] ||
                                "bg-muted text-muted-foreground border-border"
                            )}
                          >
                            {member.role_name}
                          </Badge>
                        </div>
                      </div>

                      {canManage ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-7">
                              <IconDotsVertical className="size-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => openEditModal(member)}>
                              <IconEdit className="size-3.5 mr-2" /> Edit User
                            </DropdownMenuItem>
                            {!member.is_owner && (
                              <>
                                <DropdownMenuItem onClick={() => handleToggleStatus(member)}>
                                  {member.is_active ? "Deactivate" : "Activate"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setDeletingStaff(member)}
                                  className="text-destructive"
                                >
                                  <IconTrash className="size-3.5 mr-2" /> Remove User
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="text-[11px] text-muted-foreground italic">Read-only</span>
                      )}
                    </div>


                    <div className="mt-4 space-y-2 border-t pt-3 text-xs text-muted-foreground">
                      {member.phone && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <IconPhone className="size-3.5 text-muted-foreground/70" /> Mobile
                          </span>
                          <span className="font-mono text-foreground font-medium">
                            {member.phone}
                          </span>
                        </div>
                      )}
                      {member.email && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <IconMail className="size-3.5 text-muted-foreground/70" /> Email
                          </span>
                          <span className="text-foreground truncate max-w-[170px]">
                            {member.email}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <IconPercentage className="size-3.5 text-muted-foreground/70" /> Max
                          Discount
                        </span>
                        <span className="font-semibold text-foreground">
                          {member.is_owner ? "Full" : `${member.max_discount_pct}%`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Status</span>
                        <Badge
                          variant={member.is_active ? "default" : "secondary"}
                          className={cn(
                            "text-[10px] py-0 px-1.5",
                            member.is_active
                              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {member.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
        <DataTablePagination
          page={page}
          pageSize={pageSize}
          total={filteredMembers.length}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
        />
      </Card>

      {/* ========================================================================= */}
      {/* ADD USER DIALOG (WITH RED INLINE VALIDATION)                              */}
      {/* ========================================================================= */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconUserPlus className="size-5 text-primary" />
              Add New User
            </DialogTitle>
            <DialogDescription>
              Assign a role and login credentials to provision a new user. Only Owner and Admin can perform this action.
            </DialogDescription>
          </DialogHeader>


          <form onSubmit={handleCreateStaff} className="space-y-4 pt-2">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="staff_full_name">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="staff_full_name"
                placeholder="e.g. Muhammad Usman"
                value={addForm.full_name}
                onChange={(e) => {
                  setAddForm({ ...addForm, full_name: e.target.value });
                  if (addErrors.full_name) {
                    setAddErrors((prev) => {
                      const { full_name, ...rest } = prev;
                      return rest;
                    });
                  }
                }}
                className={cn(
                  addErrors.full_name &&
                    "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive"
                )}
              />
              {addErrors.full_name && (
                <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1 animate-in fade-in-50">
                  <IconAlertCircle className="size-3.5 shrink-0" />
                  <span>{addErrors.full_name}</span>
                </p>
              )}
            </div>

            {/* Mobile Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="staff_phone">
                Mobile Number <span className="text-xs text-muted-foreground">(Used for login)</span>
              </Label>
              <Input
                id="staff_phone"
                placeholder="03001234567"
                value={addForm.phone}
                onChange={(e) => {
                  setAddForm({ ...addForm, phone: e.target.value });
                  if (addErrors.phone || addErrors.identifier) {
                    setAddErrors((prev) => {
                      const { phone, identifier, ...rest } = prev;
                      return rest;
                    });
                  }
                }}
                className={cn(
                  (addErrors.phone || addErrors.identifier) &&
                    "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive"
                )}
              />
              {addErrors.phone && (
                <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1 animate-in fade-in-50">
                  <IconAlertCircle className="size-3.5 shrink-0" />
                  <span>{addErrors.phone}</span>
                </p>
              )}
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <Label htmlFor="staff_email">
                Email Address <span className="text-xs text-muted-foreground">(Optional)</span>
              </Label>
              <Input
                id="staff_email"
                type="email"
                placeholder="usman@business.com"
                value={addForm.email}
                onChange={(e) => {
                  setAddForm({ ...addForm, email: e.target.value });
                  if (addErrors.email || addErrors.identifier) {
                    setAddErrors((prev) => {
                      const { email, identifier, ...rest } = prev;
                      return rest;
                    });
                  }
                }}
                className={cn(
                  (addErrors.email || addErrors.identifier) &&
                    "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive"
                )}
              />
              {addErrors.email && (
                <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1 animate-in fade-in-50">
                  <IconAlertCircle className="size-3.5 shrink-0" />
                  <span>{addErrors.email}</span>
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="staff_password">
                Login Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="staff_password"
                type="password"
                placeholder="Minimum 6 characters"
                value={addForm.password}
                onChange={(e) => {
                  setAddForm({ ...addForm, password: e.target.value });
                  if (addErrors.password) {
                    setAddErrors((prev) => {
                      const { password, ...rest } = prev;
                      return rest;
                    });
                  }
                }}
                className={cn(
                  addErrors.password &&
                    "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive"
                )}
              />
              {addErrors.password && (
                <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1 animate-in fade-in-50">
                  <IconAlertCircle className="size-3.5 shrink-0" />
                  <span>{addErrors.password}</span>
                </p>
              )}
            </div>

            {/* Role & Discount Grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Role Select */}
              <div className="space-y-1.5">
                <Label htmlFor="staff_role">
                  Assigned Role <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={addForm.role_id ? addForm.role_id.toString() : ""}
                  onValueChange={(val) => {
                    setAddForm({ ...addForm, role_id: parseInt(val, 10) });
                    if (addErrors.role_id) {
                      setAddErrors((prev) => {
                        const { role_id, ...rest } = prev;
                        return rest;
                      });
                    }
                  }}
                >
                  <SelectTrigger
                    id="staff_role"
                    className={cn(
                      addErrors.role_id &&
                        "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive"
                    )}
                  >
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={r.id.toString()}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {addErrors.role_id && (
                  <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1 animate-in fade-in-50">
                    <IconAlertCircle className="size-3.5 shrink-0" />
                    <span>{addErrors.role_id}</span>
                  </p>
                )}
              </div>

              {/* Max Discount */}
              <div className="space-y-1.5">
                <Label htmlFor="staff_discount">
                  Max Discount % <span className="text-xs text-muted-foreground">(0-100)</span>
                </Label>
                <Input
                  id="staff_discount"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={addForm.max_discount_pct}
                  onChange={(e) => {
                    setAddForm({
                      ...addForm,
                      max_discount_pct: parseFloat(e.target.value) || 0,
                    });
                    if (addErrors.max_discount_pct) {
                      setAddErrors((prev) => {
                        const { max_discount_pct, ...rest } = prev;
                        return rest;
                      });
                    }
                  }}
                  className={cn(
                    addErrors.max_discount_pct &&
                      "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive"
                  )}
                />
                {addErrors.max_discount_pct && (
                  <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1 animate-in fade-in-50">
                    <IconAlertCircle className="size-3.5 shrink-0" />
                    <span>{addErrors.max_discount_pct}</span>
                  </p>
                )}
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
              <Button type="submit" disabled={isSubmitting} className="gap-1.5">
                {isSubmitting ? (
                  <>
                    <IconRefresh className="size-4 animate-spin" />
                    Provisioning...
                  </>
                ) : (
                  <>
                    <IconCheck className="size-4" />
                    Create User
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* EDIT USER DIALOG (WITH RED INLINE VALIDATION)                              */}
      {/* ========================================================================= */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconEdit className="size-5 text-primary" />
              Edit User
            </DialogTitle>
            <DialogDescription>
              Update user profile, discount authorization, active status, or reset password.
            </DialogDescription>
          </DialogHeader>


          {editingStaff && (
            <form onSubmit={handleUpdateStaff} className="space-y-4 pt-2">
              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="edit_staff_name">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit_staff_name"
                  value={editForm.full_name || ""}
                  onChange={(e) => {
                    setEditForm({ ...editForm, full_name: e.target.value });
                    if (editErrors.full_name) {
                      setEditErrors((prev) => {
                        const { full_name, ...rest } = prev;
                        return rest;
                      });
                    }
                  }}
                  className={cn(
                    editErrors.full_name &&
                      "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive"
                  )}
                />
                {editErrors.full_name && (
                  <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1 animate-in fade-in-50">
                    <IconAlertCircle className="size-3.5 shrink-0" />
                    <span>{editErrors.full_name}</span>
                  </p>
                )}
              </div>

              {/* Role Select (Disabled for Owner) */}
              <div className="space-y-1.5">
                <Label htmlFor="edit_staff_role">Assigned Role</Label>
                <Select
                  value={editForm.role_id?.toString() || ""}
                  onValueChange={(val) =>
                    setEditForm({ ...editForm, role_id: parseInt(val, 10) })
                  }
                  disabled={editingStaff.is_owner}
                >
                  <SelectTrigger id="edit_staff_role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={r.id.toString()}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editingStaff.is_owner && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Primary business owner role cannot be changed.
                  </p>
                )}
              </div>

              {/* Max Discount % */}
              <div className="space-y-1.5">
                <Label htmlFor="edit_staff_discount">
                  Max Allowable Discount (%)
                </Label>
                <Input
                  id="edit_staff_discount"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={editForm.max_discount_pct ?? 0}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      max_discount_pct: parseFloat(e.target.value) || 0,
                    })
                  }
                  disabled={editingStaff.is_owner}
                  className={cn(
                    editErrors.max_discount_pct &&
                      "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive"
                  )}
                />
                {editErrors.max_discount_pct && (
                  <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1 animate-in fade-in-50">
                    <IconAlertCircle className="size-3.5 shrink-0" />
                    <span>{editErrors.max_discount_pct}</span>
                  </p>
                )}
              </div>

              {/* Reset Password */}
              <div className="space-y-1.5">
                <Label htmlFor="edit_staff_pwd">
                  Reset Password <span className="text-xs text-muted-foreground">(Leave empty to keep unchanged)</span>
                </Label>
                <Input
                  id="edit_staff_pwd"
                  type="password"
                  placeholder="New password (min 6 characters)"
                  value={editForm.password || ""}
                  onChange={(e) => {
                    setEditForm({ ...editForm, password: e.target.value });
                    if (editErrors.password) {
                      setEditErrors((prev) => {
                        const { password, ...rest } = prev;
                        return rest;
                      });
                    }
                  }}
                  className={cn(
                    editErrors.password &&
                      "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive"
                  )}
                />
                {editErrors.password && (
                  <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1 animate-in fade-in-50">
                    <IconAlertCircle className="size-3.5 shrink-0" />
                    <span>{editErrors.password}</span>
                  </p>
                )}
              </div>

              {/* Active Toggle (Disabled for Owner) */}
              {!editingStaff.is_owner && (
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Account Active</Label>
                    <p className="text-xs text-muted-foreground">
                      Deactivating prevents the staff member from signing in.
                    </p>
                  </div>
                  <Switch
                    checked={editForm.is_active}
                    onCheckedChange={(checked) =>
                      setEditForm({ ...editForm, is_active: checked })
                    }
                  />
                </div>
              )}

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="gap-1.5">
                  {isSubmitting ? (
                    <>
                      <IconRefresh className="size-4 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <IconCheck className="size-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION DIALOG                                                */}
      {/* ========================================================================= */}
      <AlertDialog
        open={!!deletingStaff}
        onOpenChange={(open) => !open && setDeletingStaff(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {deletingStaff?.full_name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this user from your business? Their login
              access to POS and ERP systems will be revoked immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteStaff();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5"
            >
              {isDeleting && <IconRefresh className="size-4 animate-spin" />}
              {isDeleting ? "Removing..." : "Remove User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>

  );
}
