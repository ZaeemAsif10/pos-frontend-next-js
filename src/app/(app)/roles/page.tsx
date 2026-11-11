"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  IconPlus,
  IconRefresh,
  IconCheck,
  IconShieldLock,
  IconCrown,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconAlertCircle,
  IconDeviceDesktop,
  IconReceipt2,
  IconTruckDelivery,
  IconPackages,
  IconBuildingBank,
  IconUsers,
  IconReportAnalytics,
  IconUserCog,
  IconSettings,
  IconLock,
  IconInfoCircle,
  IconKey,
  IconTag,
  IconBuildingFactory2,
  IconBox,
} from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { UpgradePlanDialog } from "@/components/shared/upgrade-plan-dialog";
import {
  rolesService,
  type ModulePermissionsGroup,
  type RoleMatrixItem,
  type PermissionItem,
  type CreateRolePayload,
  type UpdateRolePayload,
  type CreatePermissionPayload,
  type UpdatePermissionPayload,
} from "@/services/roles.service";

const moduleIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  roles: IconShieldLock,
  users: IconUserCog,
  categories: IconTag,
  brands: IconBuildingFactory2,
  products: IconBox,
  pos: IconDeviceDesktop,
  sales: IconReceipt2,
  purchase: IconTruckDelivery,
  inventory: IconPackages,
  accounting: IconBuildingBank,
  parties: IconUsers,
  reports: IconReportAnalytics,
  settings: IconSettings,
};

const roleTones: Record<string, { bg: string; text: string; border: string }> = {
  Admin: {
    bg: "bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-500/30",
  },
  Accountant: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-500/30",
  },
  Salesman: {
    bg: "bg-blue-500/10",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-500/30",
  },
  Cashier: {
    bg: "bg-cyan-500/10",
    text: "text-cyan-700 dark:text-cyan-400",
    border: "border-cyan-500/30",
  },
  "Warehouse Manager": {
    bg: "bg-purple-500/10",
    text: "text-purple-700 dark:text-purple-400",
    border: "border-purple-500/30",
  },
};

const KNOWN_MODULE_LABELS: Record<string, string> = {
  roles: "Roles & Permissions",
  users: "Users & Staff",
  categories: "Category Management",
  brands: "Brands & Manufacturers",
  products: "Products & Catalog",
  pos: "POS Counter Billing",
  sales: "Sales & Delivery Challans",
  purchase: "Purchasing & Vendor Bills",
  inventory: "Inventory & Stockrooms",
  accounting: "Accounts & General Ledger",
  parties: "Customers & Suppliers",
  reports: "Financial & Operational Reports",
  settings: "Business Profile & Tax Settings",
};

const isOwnerAdmin = (role: RoleMatrixItem | null | undefined) =>
  Boolean(role && role.name === "Admin" && role.is_system);

export default function RolesMatrixPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<RoleMatrixItem[]>([]);
  const [permissionGroups, setPermissionGroups] = useState<ModulePermissionsGroup[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

  // Local assigned permission IDs for the selected role
  const [activePermissionIds, setActivePermissionIds] = useState<Set<number>>(new Set());

  // Create Role State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateRolePayload>({
    name: "",
    description: "",
    permission_ids: [],
  });
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

  // Plan Upgrade Dialog State
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeModalMessage, setUpgradeModalMessage] = useState("");

  // Edit Role State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleMatrixItem | null>(null);
  const [editForm, setEditForm] = useState<UpdateRolePayload>({
    name: "",
    description: "",
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Delete Role State
  const [deletingRole, setDeletingRole] = useState<RoleMatrixItem | null>(null);
  const [isDeletingRole, setIsDeletingRole] = useState(false);

  // Permission CRUD State
  const [isAddPermOpen, setIsAddPermOpen] = useState(false);
  const [isAddingPerm, setIsAddingPerm] = useState(false);
  const [permForm, setPermForm] = useState<CreatePermissionPayload>({
    module: "users",
    code: "",
    name: "",
    description: "",
  });
  const [permErrors, setPermErrors] = useState<Record<string, string>>({});

  const [isEditPermOpen, setIsEditPermOpen] = useState(false);
  const [isEditingPerm, setIsEditingPerm] = useState(false);
  const [editingPerm, setEditingPerm] = useState<PermissionItem | null>(null);
  const [editPermForm, setEditPermForm] = useState<UpdatePermissionPayload>({
    module: "users",
    code: "",
    name: "",
    description: "",
  });
  const [editPermErrors, setEditPermErrors] = useState<Record<string, string>>({});

  const [deletingPerm, setDeletingPerm] = useState<PermissionItem | null>(null);
  const [isDeletingPerm, setIsDeletingPerm] = useState(false);
  const [isCustomModule, setIsCustomModule] = useState(false);

  // Dynamic list of available modules from active permission groups
  const availableModules = useMemo(() => {
    const mods = new Map<string, string>();
    permissionGroups.forEach((g) => {
      mods.set(g.module, g.label);
    });
    if (!mods.has("roles")) {
      mods.set("roles", "Roles & Permissions");
    }
    if (!mods.has("users")) {
      mods.set("users", "Users & Staff");
    }
    return Array.from(mods.entries()).map(([value, label]) => ({
      value,
      label,
    }));
  }, [permissionGroups]);

  // Load Data
  const loadData = async (preferredRoleId?: number) => {
    try {
      setLoading(true);
      const [groups, rolesList] = await Promise.all([
        rolesService.getPermissions(),
        rolesService.getRolesMatrix(),
      ]);

      setPermissionGroups(groups);
      setRoles(rolesList);

      const targetId =
        preferredRoleId ||
        (selectedRoleId && rolesList.some((r) => r.id === selectedRoleId)
          ? selectedRoleId
          : rolesList[0]?.id || null);

      setSelectedRoleId(targetId);

      const targetRole = rolesList.find((r) => r.id === targetId);
      if (targetRole) {
        setActivePermissionIds(new Set(targetRole.permission_ids));
      }
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to load roles and permissions matrix");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedRole = useMemo(() => {
    return roles.find((r) => r.id === selectedRoleId) || null;
  }, [roles, selectedRoleId]);

  const handleSelectRole = (role: RoleMatrixItem) => {
    setSelectedRoleId(role.id);
    setActivePermissionIds(new Set(role.permission_ids));
  };

  // Toggle single permission
  const handleTogglePermission = (permissionId: number) => {
    if (!selectedRole) return;

    setActivePermissionIds((prev) => {
      const next = new Set(prev);
      if (next.has(permissionId)) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }
      return next;
    });
  };

  // Toggle entire module
  const handleToggleModule = (group: ModulePermissionsGroup) => {
    if (!selectedRole) return;

    const groupIds = group.permissions.map((p) => p.id);
    const allSelected = groupIds.every((id) => activePermissionIds.has(id));

    setActivePermissionIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        groupIds.forEach((id) => next.delete(id));
      } else {
        groupIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  // Save Permissions Matrix Changes
  const handleSaveMatrix = async () => {
    if (!selectedRole) return;

    try {
      setSaving(true);
      const updated = await rolesService.updateRole(selectedRole.id, {
        permission_ids: Array.from(activePermissionIds),
      });

      toast.success(`Permissions saved for ${selectedRole.name}`, {
        description: `${activePermissionIds.size} permissions are now active for this role.`,
      });

      // Update local state
      setRoles((prev) =>
        prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
      );
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to save permissions matrix");
    } finally {
      setSaving(false);
    }
  };

  // Validate Create Role Form (RED INLINE VALIDATION)
  const validateCreateForm = () => {
    const errs: Record<string, string> = {};

    if (!createForm.name.trim() || createForm.name.trim().length < 2) {
      errs.name = "Role name must be at least 2 characters long.";
    }

    if (createForm.name.trim().toLowerCase() === "super admin") {
      errs.name = "Role name 'Super Admin' is reserved.";
    }

    if (createForm.name.trim().toLowerCase() === "owner") {
      errs.name = "Role name 'Owner' is reserved.";
    }

    setCreateErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCreateForm()) return;

    try {
      setIsCreating(true);
      const newRole = await rolesService.createRole({
        name: createForm.name.trim(),
        description: createForm.description?.trim() || undefined,
        permission_ids: createForm.permission_ids,
      });

      toast.success(`Custom role '${newRole.name}' created!`);
      setIsCreateOpen(false);
      setCreateForm({ name: "", description: "", permission_ids: [] });
      setCreateErrors({});
      loadData(newRole.id);
    } catch (err: any) {
      const errMsg = err?.detail || err?.message || "Failed to create custom role";
      if (
        errMsg.toLowerCase().includes("upgrade") ||
        errMsg.toLowerCase().includes("not enabled on your current") ||
        err?.status === 403
      ) {
        setIsCreateOpen(false);
        setUpgradeModalMessage(errMsg);
        setUpgradeModalOpen(true);
      } else {
        toast.error(errMsg);
      }
    } finally {
      setIsCreating(false);
    }
  };

  // Validate Edit Role Form
  const validateEditForm = () => {
    const errs: Record<string, string> = {};
    if (!editForm.name?.trim() || editForm.name.trim().length < 2) {
      errs.name = "Role name must be at least 2 characters.";
    }
    setEditErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const openEditModal = (role: RoleMatrixItem) => {
    setEditingRole(role);
    setEditForm({
      name: role.name,
      description: role.description || "",
    });
    setEditErrors({});
    setIsEditOpen(true);
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole || !validateEditForm()) return;

    try {
      setIsEditing(true);
      const updated = await rolesService.updateRole(editingRole.id, {
        name: editForm.name?.trim(),
        description: editForm.description?.trim() || undefined,
      });

      toast.success(`Role '${updated.name}' updated!`);
      setIsEditOpen(false);
      loadData(updated.id);
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to update role");
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!deletingRole) return;

    try {
      setIsDeletingRole(true);
      await rolesService.deleteRole(deletingRole.id);
      toast.success(`Role '${deletingRole.name}' deleted.`);
      setDeletingRole(null);
      loadData();
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to delete role");
    } finally {
      setIsDeletingRole(false);
    }
  };

  // =========================================================================
  // PERMISSION CRUD HANDLERS
  // =========================================================================
  const openAddPermissionModal = (defaultModule?: string) => {
    const mod = defaultModule || "roles";
    setIsCustomModule(false);
    setPermForm({
      module: mod,
      code: "",
      name: "",
      description: "",
    });
    setPermErrors({});
    setIsAddPermOpen(true);
  };

  const handlePermNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    setPermForm((prev) => ({
      ...prev,
      name,
      code:
        prev.code === "" || prev.code.startsWith(`${prev.module}:`)
          ? slug
            ? `${prev.module}:${slug}`
            : ""
          : prev.code,
    }));
    if (permErrors.name) {
      setPermErrors((prev) => {
        const { name, ...rest } = prev;
        return rest;
      });
    }
  };

  const handlePermModuleChange = (newModule: string) => {
    setPermForm((prev) => {
      const slug = prev.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
      return {
        ...prev,
        module: newModule,
        code:
          prev.code === "" || prev.code.includes(":")
            ? slug
              ? `${newModule}:${slug}`
              : ""
            : prev.code,
      };
    });
    if (permErrors.module) {
      setPermErrors((prev) => {
        const { module, ...rest } = prev;
        return rest;
      });
    }
  };

  const validatePermForm = () => {
    const errs: Record<string, string> = {};
    if (!permForm.module?.trim()) {
      errs.module = "Please select a module category.";
    }
    if (!permForm.name?.trim() || permForm.name.trim().length < 2) {
      errs.name = "Permission name must be at least 2 characters.";
    }
    const cleanCode = permForm.code?.trim().toLowerCase();
    if (!cleanCode || cleanCode.length < 3) {
      errs.code = "Unique permission code is required.";
    } else if (!/^[a-z0-9_]+(?::[a-z0-9_]+)+$/.test(cleanCode)) {
      errs.code = "Code must follow 'module:action' format (e.g. sales:bulk_discount or accounting:mappings:view).";
    }
    setPermErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreatePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePermForm()) return;

    try {
      setIsAddingPerm(true);
      const newPerm = await rolesService.createPermission({
        module: permForm.module.trim().toLowerCase(),
        name: permForm.name.trim(),
        code: permForm.code.trim().toLowerCase(),
        description: permForm.description?.trim() || undefined,
      });

      toast.success(`Permission '${newPerm.name}' created!`, {
        description: `Code: ${newPerm.code}. Automatically granted to Admin.`,
      });

      setIsAddPermOpen(false);
      setPermForm({ module: "users", code: "", name: "", description: "" });
      setPermErrors({});
      await loadData(selectedRoleId || undefined);
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to create permission");
    } finally {
      setIsAddingPerm(false);
    }
  };

  const openEditPermissionModal = (perm: PermissionItem) => {
    setEditingPerm(perm);
    setEditPermForm({
      module: perm.module,
      code: perm.code,
      name: perm.name,
      description: perm.description || "",
    });
    setEditPermErrors({});
    setIsEditPermOpen(true);
  };

  const validateEditPermForm = () => {
    const errs: Record<string, string> = {};
    if (!editPermForm.name?.trim() || editPermForm.name.trim().length < 2) {
      errs.name = "Permission name must be at least 2 characters.";
    }
    const cleanCode = editPermForm.code?.trim().toLowerCase();
    if (!cleanCode || cleanCode.length < 3) {
      errs.code = "Permission code is required.";
    } else if (!/^[a-z0-9_]+(?::[a-z0-9_]+)+$/.test(cleanCode)) {
      errs.code = "Code must follow 'module:action' format (e.g. sales:bulk_discount or accounting:mappings:view).";
    }
    setEditPermErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleUpdatePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPerm || !validateEditPermForm()) return;

    try {
      setIsEditingPerm(true);
      const updated = await rolesService.updatePermission(editingPerm.id, {
        module: editPermForm.module?.trim().toLowerCase(),
        name: editPermForm.name?.trim(),
        code: editPermForm.code?.trim().toLowerCase(),
        description: editPermForm.description?.trim() || undefined,
      });

      toast.success(`Permission '${updated.name}' updated!`);
      setIsEditPermOpen(false);
      setEditingPerm(null);
      await loadData(selectedRoleId || undefined);
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to update permission");
    } finally {
      setIsEditingPerm(false);
    }
  };

  const handleDeletePermission = async () => {
    if (!deletingPerm) return;

    try {
      setIsDeletingPerm(true);
      await rolesService.deletePermission(deletingPerm.id);
      toast.success(`Permission '${deletingPerm.name}' deleted.`);
      setDeletingPerm(null);
      await loadData(selectedRoleId || undefined);
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to delete permission");
    } finally {
      setIsDeletingPerm(false);
    }
  };

  // Total permissions count
  const totalPermissionsCount = useMemo(() => {
    return permissionGroups.reduce((acc, g) => acc + g.permissions.length, 0);
  }, [permissionGroups]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Roles & Permissions Matrix"
        description="Configure role-based access control (RBAC), customize module permissions (POS, Sales, Accounting, Inventory), and manage custom business roles."
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData()}
            disabled={loading}
            className="gap-1.5"
          >
            <IconRefresh className={cn("size-4", loading && "animate-spin")} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setCreateErrors({});
              setCreateForm({ name: "", description: "", permission_ids: [] });
              setIsCreateOpen(true);
            }}
            className="gap-1.5 bg-primary shadow-sm"
          >
            <IconPlus className="size-4" />
            Create Custom Role
          </Button>
        </div>
      </PageHeader>

      {/* Main 2-Column Layout */}
      {loading ? (
        <Card className="p-16 text-center border-border/70">
          <div className="flex flex-col items-center justify-center gap-3">
            <IconRefresh className="size-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">Loading roles & permissions matrix...</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Roles Selector Cards */}
        <div className="space-y-3 lg:col-span-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Available Roles ({roles.length})
            </h3>
            <span className="text-[11px] text-muted-foreground">Click to configure</span>
          </div>

          <div className="space-y-2">
            {roles.map((role) => {
              const isSelected = selectedRoleId === role.id;
              const tone = roleTones[role.name] || {
                bg: "bg-muted",
                text: "text-foreground",
                border: "border-border",
              };

              return (
                <Card
                  key={role.id}
                  onClick={() => handleSelectRole(role)}
                  className={cn(
                    "cursor-pointer transition-all hover:border-primary/50 relative overflow-hidden",
                    isSelected
                      ? "ring-2 ring-primary border-primary bg-primary/[0.02]"
                      : "hover:bg-muted/30"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            "flex size-8 items-center justify-center rounded-md border",
                            tone.bg,
                            tone.text,
                            tone.border
                          )}
                        >
                          {isOwnerAdmin(role) ? (
                            <IconCrown className="size-4.5" />
                          ) : (
                            <IconShieldLock className="size-4.5" />
                          )}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-sm leading-tight">
                              {role.name}
                            </span>
                            {role.is_system && (
                              <Badge
                                variant="outline"
                                className="text-[10px] font-normal py-0 px-1.5 text-muted-foreground"
                              >
                                {isOwnerAdmin(role) ? "Owner Admin" : "System"}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {role.description || "Custom business staff role"}
                          </p>
                        </div>
                      </div>

                      {/* Dropdown for custom roles */}
                      {!role.is_system && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="size-7 shrink-0">
                              <IconDotsVertical className="size-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem onClick={() => openEditModal(role)}>
                              <IconEdit className="size-3.5 mr-2" /> Rename
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeletingRole(role)}
                              className="text-destructive focus:text-destructive"
                            >
                              <IconTrash className="size-3.5 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t pt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <IconUsers className="size-3.5" />
                        <span className="font-medium text-foreground">
                          {role.user_count}
                        </span>{" "}
                        Users Assigned
                      </span>
                      <span className="font-mono text-[11px] tabular-nums">
                        {role.permission_ids.length} Active
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right Column: Dynamic Permissions Matrix Table */}
        <div className="space-y-4 lg:col-span-8">
          {selectedRole && (
            <Card className="border shadow-xs">
              <CardHeader className="border-b pb-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {selectedRole.name} Permissions
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs font-semibold py-0.5 px-2 border",
                          roleTones[selectedRole.name]?.bg,
                          roleTones[selectedRole.name]?.text,
                          roleTones[selectedRole.name]?.border
                        )}
                      >
                        {selectedRole.is_system ? "System Role" : "Custom Role"}
                      </Badge>
                    </div>
                    <CardDescription className="mt-1">
                      {selectedRole.description ||
                        "Tailor exact feature permissions and operations allowed for this role."}
                    </CardDescription>
                  </div>

                  {/* Actions for selected role */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openAddPermissionModal()}
                      className="gap-1.5"
                    >
                      <IconPlus className="size-4" />
                      Add Permission
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveMatrix}
                      disabled={saving}
                      className="gap-1.5 bg-primary shadow-sm"
                    >
                      {saving ? (
                        <>
                          <IconRefresh className="size-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <IconCheck className="size-4" />
                          Save Permissions
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Status Bar */}
                <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/40 p-2.5 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <IconInfoCircle className="size-4 text-primary" />
                    <span>Check or uncheck permissions below and click &apos;Save Permissions&apos;.</span>
                  </div>
                  <span className="font-semibold tabular-nums text-foreground">
                    {activePermissionIds.size} / {totalPermissionsCount} Enabled
                  </span>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 space-y-6">
                {permissionGroups.map((group) => {
                  const Icon = moduleIcons[group.module] || IconShieldLock;
                  const groupIds = group.permissions.map((p) => p.id);
                  const isAllChecked =
                    groupIds.length > 0 &&
                    groupIds.every((id) => activePermissionIds.has(id));
                  const isPartiallyChecked =
                    !isAllChecked && groupIds.some((id) => activePermissionIds.has(id));

                  return (
                    <div
                      key={group.module}
                      className="rounded-xl border bg-card p-4 transition-colors"
                    >
                      {/* Module Header */}
                      <div className="flex items-center justify-between border-b pb-3 mb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                            <Icon className="size-4" />
                          </span>
                          <div>
                            <h4 className="font-semibold text-sm leading-tight text-foreground">
                              {group.label}
                            </h4>
                            <span className="text-[11px] text-muted-foreground">
                              {group.permissions.length} actions available
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAddPermissionModal(group.module)}
                            className="text-xs h-7 px-2 font-medium gap-1"
                          >
                            <IconPlus className="size-3" />
                            Add Action
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleModule(group)}
                            className="text-xs h-7 px-2 font-medium"
                          >
                            {isAllChecked ? "Deselect All" : "Select All"}
                          </Button>
                        </div>
                      </div>

                      {/* Permissions Grid */}
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {group.permissions.map((perm) => {
                          const isChecked = activePermissionIds.has(perm.id);

                          return (
                            <div
                              key={perm.id}
                              onClick={() => handleTogglePermission(perm.id)}
                              className={cn(
                                "group/perm relative flex items-start gap-3 rounded-lg border p-2.5 transition-all cursor-pointer hover:bg-muted/40",
                                isChecked
                                  ? "border-primary/40 bg-primary/[0.02]"
                                  : "border-border/60"
                              )}
                            >
                              <Checkbox
                                id={`perm_${perm.id}`}
                                checked={isChecked}
                                onCheckedChange={() => handleTogglePermission(perm.id)}
                                className="mt-0.5"
                              />
                              <div className="space-y-0.5 flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1.5">
                                  <label
                                    htmlFor={`perm_${perm.id}`}
                                    className="text-xs font-semibold text-foreground cursor-pointer truncate"
                                  >
                                    {perm.name}
                                  </label>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                      {perm.code}
                                    </span>
                                    <div className="flex items-center gap-0.5 opacity-70 group-hover/perm:opacity-100 transition-opacity">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="size-6 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openEditPermissionModal(perm);
                                        }}
                                        title="Edit Permission"
                                      >
                                        <IconEdit className="size-3.5" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="size-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDeletingPerm(perm);
                                        }}
                                        title="Delete Permission"
                                      >
                                        <IconTrash className="size-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                                {perm.description && (
                                  <p className="text-[11px] text-muted-foreground leading-normal">
                                    {perm.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      )}

      {/* ========================================================================= */}
      {/* CREATE CUSTOM ROLE DIALOG (WITH RED INLINE VALIDATION)                     */}
      {/* ========================================================================= */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconPlus className="size-5 text-primary" />
              Create Custom Role
            </DialogTitle>
            <DialogDescription>
              Define a new business role (e.g. Senior Cashier, Floor Supervisor). You can customize
              its permissions matrix right after creation.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateRole} className="space-y-4 pt-2">
            {/* Role Name */}
            <div className="space-y-1.5">
              <Label htmlFor="custom_role_name">
                Role Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="custom_role_name"
                placeholder="e.g. Floor Supervisor"
                value={createForm.name}
                onChange={(e) => {
                  setCreateForm({ ...createForm, name: e.target.value });
                  if (createErrors.name) {
                    setCreateErrors((prev) => {
                      const { name, ...rest } = prev;
                      return rest;
                    });
                  }
                }}
                className={cn(
                  createErrors.name &&
                    "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive"
                )}
              />
              {createErrors.name && (
                <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1 animate-in fade-in-50">
                  <IconAlertCircle className="size-3.5 shrink-0" />
                  <span>{createErrors.name}</span>
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="custom_role_desc">
                Description <span className="text-xs text-muted-foreground">(Optional)</span>
              </Label>
              <Textarea
                id="custom_role_desc"
                placeholder="Briefly describe what this role is responsible for..."
                rows={3}
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm({ ...createForm, description: e.target.value })
                }
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating} className="gap-1.5">
                {isCreating ? (
                  <>
                    <IconRefresh className="size-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <IconCheck className="size-4" />
                    Create Role
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* EDIT ROLE DIALOG (WITH RED INLINE VALIDATION)                              */}
      {/* ========================================================================= */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconEdit className="size-5 text-primary" />
              Edit Role
            </DialogTitle>
            <DialogDescription>
              Update role name and descriptive summary.
            </DialogDescription>
          </DialogHeader>

          {editingRole && (
            <form onSubmit={handleUpdateRole} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit_role_name">
                  Role Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit_role_name"
                  value={editForm.name || ""}
                  onChange={(e) => {
                    setEditForm({ ...editForm, name: e.target.value });
                    if (editErrors.name) {
                      setEditErrors((prev) => {
                        const { name, ...rest } = prev;
                        return rest;
                      });
                    }
                  }}
                  className={cn(
                    editErrors.name &&
                      "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive"
                  )}
                />
                {editErrors.name && (
                  <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1 animate-in fade-in-50">
                    <IconAlertCircle className="size-3.5 shrink-0" />
                    <span>{editErrors.name}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit_role_desc">Description</Label>
                <Textarea
                  id="edit_role_desc"
                  rows={3}
                  value={editForm.description || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  disabled={isEditing}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isEditing} className="gap-1.5">
                  {isEditing ? (
                    <>
                      <IconRefresh className="size-4 animate-spin" />
                      Saving...
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
        open={!!deletingRole}
        onOpenChange={(open) => !open && setDeletingRole(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete Custom Role &quot;{deletingRole?.name}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deletingRole && deletingRole.user_count > 0 ? (
                <span className="text-destructive font-medium">
                  Warning: {deletingRole.user_count} staff user(s) are currently assigned to this
                  role. You must reassign those users to another role before deleting.
                </span>
              ) : (
                "Are you sure you want to delete this custom role? This action cannot be undone."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingRole}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteRole();
              }}
              disabled={Boolean(deletingRole && deletingRole.user_count > 0) || isDeletingRole}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5"
            >
              {isDeletingRole && <IconRefresh className="size-4 animate-spin" />}
              {isDeletingRole ? "Deleting..." : "Delete Role"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ========================================================================= */}
      {/* ADD PERMISSION DIALOG (WITH RED INLINE VALIDATION)                         */}
      {/* ========================================================================= */}
      <Dialog open={isAddPermOpen} onOpenChange={setIsAddPermOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconKey className="size-5 text-primary" />
              Add Permission Action
            </DialogTitle>
            <DialogDescription>
              Define a new modular permission action for your business operations. It will be
              automatically granted to your Admin role.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreatePermission} className="space-y-4 pt-2">
            {/* Module Category */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="perm_module">
                  Module Category <span className="text-destructive">*</span>
                </Label>
                <button
                  type="button"
                  onClick={() => {
                    const nextCustom = !isCustomModule;
                    setIsCustomModule(nextCustom);
                    if (nextCustom) {
                      handlePermModuleChange("");
                    } else {
                      handlePermModuleChange(availableModules[0]?.value || "roles");
                    }
                  }}
                  className="text-[11px] text-primary hover:underline font-medium"
                >
                  {isCustomModule ? "← Select Existing Module" : "+ Enter New Module"}
                </button>
              </div>

              {isCustomModule ? (
                <Input
                  id="perm_module_custom"
                  placeholder="e.g. roles, products, invoices"
                  value={permForm.module}
                  onChange={(e) => handlePermModuleChange(e.target.value.toLowerCase().trim())}
                  className={cn(
                    "font-mono text-xs",
                    permErrors.module &&
                      "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive"
                  )}
                />
              ) : (
                <Select
                  value={permForm.module}
                  onValueChange={(val) => handlePermModuleChange(val)}
                >
                  <SelectTrigger
                    id="perm_module"
                    className={cn(
                      permErrors.module &&
                        "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive"
                    )}
                  >
                    <SelectValue placeholder="Select module" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModules.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label} ({m.value})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {permErrors.module && (
                <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1 animate-in fade-in-50">
                  <IconAlertCircle className="size-3.5 shrink-0" />
                  <span>{permErrors.module}</span>
                </p>
              )}
            </div>

            {/* Action Name */}
            <div className="space-y-1.5">
              <Label htmlFor="perm_name">
                Action Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="perm_name"
                placeholder="e.g. Export Stock Audit"
                value={permForm.name}
                onChange={(e) => handlePermNameChange(e.target.value)}
                className={cn(
                  permErrors.name &&
                    "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive"
                )}
              />
              {permErrors.name && (
                <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1 animate-in fade-in-50">
                  <IconAlertCircle className="size-3.5 shrink-0" />
                  <span>{permErrors.name}</span>
                </p>
              )}
            </div>

            {/* Permission Code */}
            <div className="space-y-1.5">
              <Label htmlFor="perm_code">
                Permission Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="perm_code"
                placeholder="e.g. inventory:export_audit"
                value={permForm.code}
                onChange={(e) => {
                  setPermForm({ ...permForm, code: e.target.value });
                  if (permErrors.code) {
                    setPermErrors((prev) => {
                      const { code, ...rest } = prev;
                      return rest;
                    });
                  }
                }}
                className={cn(
                  "font-mono text-xs",
                  permErrors.code &&
                    "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive"
                )}
              />
              {permErrors.code ? (
                <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1 animate-in fade-in-50">
                  <IconAlertCircle className="size-3.5 shrink-0" />
                  <span>{permErrors.code}</span>
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  Format: <code className="font-mono text-foreground">module:action_slug</code> (unique key checked in codebase)
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="perm_desc">
                Description <span className="text-xs text-muted-foreground">(Optional)</span>
              </Label>
              <Textarea
                id="perm_desc"
                placeholder="Describe what operation or capability this permission allows..."
                rows={2}
                value={permForm.description}
                onChange={(e) =>
                  setPermForm({ ...permForm, description: e.target.value })
                }
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddPermOpen(false)}
                disabled={isAddingPerm}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isAddingPerm} className="gap-1.5">
                {isAddingPerm ? (
                  <>
                    <IconRefresh className="size-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <IconCheck className="size-4" />
                    Add Permission
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* EDIT PERMISSION DIALOG (WITH RED INLINE VALIDATION)                        */}
      {/* ========================================================================= */}
      <Dialog open={isEditPermOpen} onOpenChange={setIsEditPermOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconEdit className="size-5 text-primary" />
              Edit Permission Action
            </DialogTitle>
            <DialogDescription>
              Update permission action name, system code, module category, or description.
            </DialogDescription>
          </DialogHeader>

          {editingPerm && (
            <form onSubmit={handleUpdatePermission} className="space-y-4 pt-2">
              {/* Module Category */}
              <div className="space-y-1.5">
                <Label htmlFor="edit_perm_module">
                  Module Category <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={editPermForm.module || "roles"}
                  onValueChange={(val) =>
                    setEditPermForm({ ...editPermForm, module: val })
                  }
                >
                  <SelectTrigger id="edit_perm_module">
                    <SelectValue placeholder="Select module" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModules.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label} ({m.value})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Action Name */}
              <div className="space-y-1.5">
                <Label htmlFor="edit_perm_name">
                  Action Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit_perm_name"
                  value={editPermForm.name || ""}
                  onChange={(e) => {
                    setEditPermForm({ ...editPermForm, name: e.target.value });
                    if (editPermErrors.name) {
                      setEditPermErrors((prev) => {
                        const { name, ...rest } = prev;
                        return rest;
                      });
                    }
                  }}
                  className={cn(
                    editPermErrors.name &&
                      "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive"
                  )}
                />
                {editPermErrors.name && (
                  <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1 animate-in fade-in-50">
                    <IconAlertCircle className="size-3.5 shrink-0" />
                    <span>{editPermErrors.name}</span>
                  </p>
                )}
              </div>

              {/* Permission Code */}
              <div className="space-y-1.5">
                <Label htmlFor="edit_perm_code">
                  Permission Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit_perm_code"
                  value={editPermForm.code || ""}
                  onChange={(e) => {
                    setEditPermForm({ ...editPermForm, code: e.target.value });
                    if (editPermErrors.code) {
                      setEditPermErrors((prev) => {
                        const { code, ...rest } = prev;
                        return rest;
                      });
                    }
                  }}
                  className={cn(
                    "font-mono text-xs",
                    editPermErrors.code &&
                      "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive"
                  )}
                />
                {editPermErrors.code && (
                  <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1 animate-in fade-in-50">
                    <IconAlertCircle className="size-3.5 shrink-0" />
                    <span>{editPermErrors.code}</span>
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="edit_perm_desc">Description</Label>
                <Textarea
                  id="edit_perm_desc"
                  rows={2}
                  value={editPermForm.description || ""}
                  onChange={(e) =>
                    setEditPermForm({ ...editPermForm, description: e.target.value })
                  }
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditPermOpen(false)}
                  disabled={isEditingPerm}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isEditingPerm} className="gap-1.5">
                  {isEditingPerm ? (
                    <>
                      <IconRefresh className="size-4 animate-spin" />
                      Saving...
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
      {/* DELETE PERMISSION CONFIRMATION DIALOG                                      */}
      {/* ========================================================================= */}
      <AlertDialog
        open={!!deletingPerm}
        onOpenChange={(open) => !open && setDeletingPerm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete Permission &quot;{deletingPerm?.name}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete permission{" "}
              <code className="font-mono font-semibold text-foreground">
                {deletingPerm?.code}
              </code>
              ? This will remove it from all roles across your business. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingPerm}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePermission}
              disabled={isDeletingPerm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingPerm ? "Deleting..." : "Delete Permission"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Plan Upgrade Dialog */}
      <UpgradePlanDialog
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        title="Subscription Upgrade Required"
        description={upgradeModalMessage}
        featureName="Custom Roles & Permissions"
        suggestedPlanName="Standard Wholesale"
      />
    </div>
  );
}
