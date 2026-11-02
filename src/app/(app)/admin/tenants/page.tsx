"use client";

import * as React from "react";
import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import {
  IconBuildingStore,
  IconPlus,
  IconSearch,
  IconRefresh,
  IconCheck,
  IconCopy,
  IconPhone,
  IconMail,
  IconMapPin,
  IconUsers,
  IconCalendar,
  IconShieldLock,
  IconKey,
  IconBrandWhatsapp,
  IconDotsVertical,
  IconPlayerPause,
  IconPlayerPlay,
  IconClockPlus,
  IconAlertTriangle,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  adminService,
  TenantItem,
  CreateTenantPayload,
  CreateTenantResult,
} from "@/services/admin.service";
import { useAuth } from "@/context/auth-context";

const PAKISTAN_CITIES = [
  "Lahore",
  "Karachi",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Gujranwala",
  "Peshawar",
  "Quetta",
  "Sialkot",
  "Hyderabad",
  "Bahawalpur",
  "Sargodha",
  "Other",
];

const PLAN_BADGES: Record<string, { label: string; className: string }> = {
  free_trial: { label: "Free Trial", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  basic: { label: "Basic", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  standard: { label: "Standard", className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
  enterprise: { label: "Enterprise", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
};

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  trial: { label: "In Trial", className: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20" },
  suspended: { label: "Suspended", className: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" },
  past_due: { label: "Past Due", className: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20" },
  cancelled: { label: "Cancelled", className: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20" },
};

export default function SuperAdminTenantsPage() {
  const { user } = useAuth();
  const [isPending, startTransition] = useTransition();

  // State
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [page, setPage] = useState(1);

  // Dialogs
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [createdResult, setCreatedResult] = useState<CreateTenantResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Create Form State
  const [createForm, setCreateForm] = useState<CreateTenantPayload>({
    name: "",
    legal_name: "",
    ntn: "",
    strn: "",
    phone: "",
    email: "",
    city: "Lahore",
    address: "",
    plan_tier: "free_trial",
    subscription_days: 14,
    owner_full_name: "",
    owner_phone: "",
    owner_email: "",
    owner_password: "Paperless" + Math.floor(1000 + Math.random() * 9000) + "!",
  });

  const loadTenants = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.listTenants({
        search: searchTerm || undefined,
        status: statusFilter,
        plan: planFilter,
        page,
        size: 20,
      });
      setTenants(res.items);
      setTotalCount(res.total);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load businesses";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, planFilter, page]);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  const handleGeneratePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let pwd = "";
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCreateForm((prev) => ({ ...prev, owner_password: pwd + "!" }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name || !createForm.phone || !createForm.city) {
      toast.error("Please fill in business name, city, and phone number.");
      return;
    }
    if (!createForm.owner_full_name || !createForm.owner_phone || !createForm.owner_password) {
      toast.error("Please fill in owner name, mobile number, and password.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await adminService.createTenant(createForm);
        setCreatedResult(result);
        setIsCreateOpen(false);
        setIsSuccessOpen(true);
        toast.success(`Business '${createForm.name}' provisioned successfully!`);
        loadTenants();
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Failed to create business";
        toast.error(errorMsg);
      }
    });
  };

  const handleUpdateStatus = async (tenantId: number, status: string) => {
    try {
      await adminService.updateTenantStatus(tenantId, { status });
      toast.success(`Status updated to ${status}`);
      loadTenants();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to update status";
      toast.error(errorMsg);
    }
  };

  const handleExtendDays = async (tenantId: number, days: number) => {
    try {
      await adminService.updateTenantStatus(tenantId, { extend_days: days });
      toast.success(`Added ${days} days to subscription`);
      loadTenants();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to extend subscription";
      toast.error(errorMsg);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Copied ${fieldName} to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getWhatsAppTemplate = () => {
    if (!createdResult) return "";
    const loginUrl = window.location.origin + "/login";
    return `Assalam-o-Alaikum ${createdResult.owner_credentials.full_name},

Your Paperless OS Business Portal for *${createdResult.tenant.name}* has been successfully created!

🌐 *Portal URL:* ${loginUrl}
📱 *Login ID:* ${createdResult.owner_credentials.identifier}
🔑 *Password:* ${createdResult.owner_credentials.password}
🏢 *City:* ${createdResult.tenant.city}
⭐ *Plan:* ${createdResult.tenant.plan_tier.toUpperCase()}

You can log in right away to start managing your Sales, Purchases, and Inventory.`;
  };

  // Stats calculation
  const stats = {
    total: totalCount,
    active: tenants.filter((t) => t.status === "active").length,
    trial: tenants.filter((t) => t.status === "trial").length,
    suspended: tenants.filter((t) => t.status === "suspended" || t.status === "past_due").length,
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight font-heading">
              Businesses & Tenants
            </h1>
            <Badge variant="outline" className="text-xs font-normal">
              Super Admin
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Provision and manage tenant accounts for distributors, wholesalers, and retail chains across Pakistan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadTenants()}
            disabled={loading}
          >
            <IconRefresh className={`size-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => {
              handleGeneratePassword();
              setIsCreateOpen(true);
            }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm"
          >
            <IconPlus className="size-4 mr-1.5" />
            Add New Business
          </Button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 bg-card/60 backdrop-blur-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Businesses
            </p>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <IconBuildingStore className="size-4" />
            </div>
          </div>
          <p className="text-2xl font-bold mt-2">{stats.total}</p>
          <p className="text-xs text-muted-foreground mt-1">Tenants in database</p>
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Active Portals
            </p>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <IconCheck className="size-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {stats.active}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Paid & running portals</p>
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Free Trials
            </p>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <IconClockPlus className="size-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
            {stats.trial}
          </p>
          <p className="text-xs text-muted-foreground mt-1">14-day evaluation</p>
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Suspended / Past Due
            </p>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <IconAlertTriangle className="size-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">
            {stats.suspended}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Require subscription renewal</p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by business name, city, phone, or owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="All Plans" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="free_trial">Free Trial</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trial">In Trial</SelectItem>
                <SelectItem value="past_due">Past Due</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Tenants Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-[280px]">Business & Slug</TableHead>
              <TableHead>Location & Contact</TableHead>
              <TableHead>Primary Owner</TableHead>
              <TableHead>Plan Tier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Users</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span>Loading registered businesses...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : tenants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <IconBuildingStore className="size-8 text-muted-foreground/50 mb-1" />
                    <p className="font-medium text-foreground">No businesses found</p>
                    <p className="text-xs">Try adjusting your filters or click &apos;Add New Business&apos;.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              tenants.map((t) => {
                const planBadge = PLAN_BADGES[t.plan_tier] || { label: t.plan_tier, className: "" };
                const statusBadge = STATUS_BADGES[t.status] || { label: t.status, className: "" };
                const expiryDate = t.subscription_ends_at || t.trial_ends_at;

                return (
                  <TableRow key={t.id} className="hover:bg-muted/30">
                    {/* Business Name & Slug */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                          {t.name}
                        </span>
                        <span className="text-xs font-mono text-muted-foreground">
                          slug: {t.slug}
                        </span>
                      </div>
                    </TableCell>

                    {/* Location & Contact */}
                    <TableCell>
                      <div className="flex flex-col text-xs text-muted-foreground gap-0.5">
                        <span className="flex items-center gap-1 text-foreground font-medium">
                          <IconMapPin className="size-3 text-muted-foreground" />
                          {t.city}
                        </span>
                        <span className="flex items-center gap-1">
                          <IconPhone className="size-3" />
                          {t.phone}
                        </span>
                      </div>
                    </TableCell>

                    {/* Owner Info */}
                    <TableCell>
                      {t.owner ? (
                        <div className="flex flex-col text-xs">
                          <span className="font-medium text-foreground">
                            {t.owner.full_name}
                          </span>
                          <span className="text-muted-foreground font-mono">
                            {t.owner.phone || t.owner.email}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">None</span>
                      )}
                    </TableCell>

                    {/* Plan Tier */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs px-2 py-0.5 font-medium border ${planBadge.className}`}
                      >
                        {planBadge.label}
                      </Badge>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs px-2 py-0.5 font-medium border ${statusBadge.className}`}
                      >
                        {statusBadge.label}
                      </Badge>
                    </TableCell>

                    {/* Expiry Date */}
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <IconCalendar className="size-3" />
                        {expiryDate ? new Date(expiryDate).toLocaleDateString("en-PK", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }) : "Never"}
                      </div>
                    </TableCell>

                    {/* Users Count */}
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <IconUsers className="size-3" />
                        <span>{t.total_users || 1}</span>
                      </div>
                    </TableCell>

                    {/* Actions Menu */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <IconDotsVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Business Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />

                          {t.status !== "active" ? (
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(t.id, "active")}
                              className="text-emerald-600 focus:text-emerald-600"
                            >
                              <IconPlayerPlay className="size-4 mr-2" />
                              Activate Portal
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(t.id, "suspended")}
                              className="text-rose-600 focus:text-rose-600"
                            >
                              <IconPlayerPause className="size-4 mr-2" />
                              Suspend Access
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem onClick={() => handleExtendDays(t.id, 30)}>
                            <IconClockPlus className="size-4 mr-2" />
                            Extend +30 Days
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => handleExtendDays(t.id, 365)}>
                            <IconShieldLock className="size-4 mr-2" />
                            Extend 1 Year
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Modal 1: Create New Business Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <IconBuildingStore className="size-5 text-primary" />
                Add New Business (Assisted Onboarding)
              </DialogTitle>
              <DialogDescription>
                Provision a new tenant and create the merchant’s primary Owner account with pre-configured access.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Section 1: Business Profile */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <IconBuildingStore className="size-3.5" />
                  1. Business Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="biz_name" className="text-xs">
                      Business Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="biz_name"
                      placeholder="e.g. Al-Madina Cash & Carry"
                      value={createForm.name}
                      onChange={(e) =>
                        setCreateForm((p) => ({ ...p, name: e.target.value }))
                      }
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="biz_legal" className="text-xs">
                      Legal / Registered Name
                    </Label>
                    <Input
                      id="biz_legal"
                      placeholder="e.g. Al-Madina Trading Pvt Ltd"
                      value={createForm.legal_name}
                      onChange={(e) =>
                        setCreateForm((p) => ({ ...p, legal_name: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="biz_city" className="text-xs">
                      City <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={createForm.city}
                      onValueChange={(val) =>
                        setCreateForm((p) => ({ ...p, city: val }))
                      }
                    >
                      <SelectTrigger id="biz_city">
                        <SelectValue placeholder="Select City" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAKISTAN_CITIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="biz_phone" className="text-xs">
                      Business Phone / WhatsApp <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="biz_phone"
                      placeholder="e.g. +923001234567"
                      value={createForm.phone}
                      onChange={(e) =>
                        setCreateForm((p) => ({ ...p, phone: e.target.value }))
                      }
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="biz_ntn" className="text-xs">
                      NTN (National Tax No.)
                    </Label>
                    <Input
                      id="biz_ntn"
                      placeholder="e.g. 1234567-8"
                      value={createForm.ntn}
                      onChange={(e) =>
                        setCreateForm((p) => ({ ...p, ntn: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="biz_strn" className="text-xs">
                      STRN (Sales Tax Reg No.)
                    </Label>
                    <Input
                      id="biz_strn"
                      placeholder="e.g. 17-00-1234-567-89"
                      value={createForm.strn}
                      onChange={(e) =>
                        setCreateForm((p) => ({ ...p, strn: e.target.value }))
                      }
                    />
                  </div>

                  <div className="col-span-2 space-y-1">
                    <Label htmlFor="biz_addr" className="text-xs">
                      Business Address / Shop Location
                    </Label>
                    <Input
                      id="biz_addr"
                      placeholder="e.g. Shop # 14, Main Wholesale Market, Hall Road, Lahore"
                      value={createForm.address}
                      onChange={(e) =>
                        setCreateForm((p) => ({ ...p, address: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Plan & Duration */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <IconCalendar className="size-3.5" />
                  2. Plan & Subscription
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="biz_plan" className="text-xs">
                      Plan Tier
                    </Label>
                    <Select
                      value={createForm.plan_tier}
                      onValueChange={(val: "free_trial" | "basic" | "standard" | "enterprise") => {
                        setCreateForm((p) => ({
                          ...p,
                          plan_tier: val,
                          subscription_days: val === "free_trial" ? 14 : p.subscription_days,
                        }));
                      }}
                    >
                      <SelectTrigger id="biz_plan">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free_trial">Free Trial (14 Days)</SelectItem>
                        <SelectItem value="basic">Basic (Small Retail)</SelectItem>
                        <SelectItem value="standard">Standard (Wholesale & Distribution)</SelectItem>
                        <SelectItem value="enterprise">Enterprise (Multi-Warehouse & Chain)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="biz_days" className="text-xs">
                      Validity Period (Days)
                    </Label>
                    <Select
                      value={String(createForm.subscription_days)}
                      onValueChange={(val) =>
                        setCreateForm((p) => ({ ...p, subscription_days: Number(val) }))
                      }
                    >
                      <SelectTrigger id="biz_days">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="14">14 Days (Trial)</SelectItem>
                        <SelectItem value="30">30 Days (1 Month)</SelectItem>
                        <SelectItem value="90">90 Days (Quarterly)</SelectItem>
                        <SelectItem value="180">180 Days (Half-Yearly)</SelectItem>
                        <SelectItem value="365">365 Days (1 Year)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Section 3: Primary Owner Account */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <IconShieldLock className="size-3.5" />
                  3. Primary Owner Account (Credentials)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="owner_name" className="text-xs">
                      Owner Full Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="owner_name"
                      placeholder="e.g. Haji Muhammad Tariq"
                      value={createForm.owner_full_name}
                      onChange={(e) =>
                        setCreateForm((p) => ({ ...p, owner_full_name: e.target.value }))
                      }
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="owner_phone" className="text-xs">
                      Owner Mobile No. (Login) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="owner_phone"
                      placeholder="e.g. +923019876543"
                      value={createForm.owner_phone}
                      onChange={(e) =>
                        setCreateForm((p) => ({ ...p, owner_phone: e.target.value }))
                      }
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="owner_email" className="text-xs">
                      Owner Email (Optional)
                    </Label>
                    <Input
                      id="owner_email"
                      type="email"
                      placeholder="e.g. tariq@gmail.com"
                      value={createForm.owner_email}
                      onChange={(e) =>
                        setCreateForm((p) => ({ ...p, owner_email: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="owner_pwd" className="text-xs">
                        Initial Password <span className="text-destructive">*</span>
                      </Label>
                      <button
                        type="button"
                        onClick={handleGeneratePassword}
                        className="text-[11px] text-primary hover:underline font-medium"
                      >
                        Generate Random
                      </button>
                    </div>
                    <Input
                      id="owner_pwd"
                      value={createForm.owner_password}
                      onChange={(e) =>
                        setCreateForm((p) => ({ ...p, owner_password: e.target.value }))
                      }
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="bg-primary text-primary-foreground gap-1.5">
                {isPending && <IconRefresh className="size-4 animate-spin" />}
                {isPending ? "Provisioning..." : "Provision Business"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Provisioned Success Dialog with Shareable Credentials */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="mx-auto size-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
              <IconCheck className="size-6" />
            </div>
            <DialogTitle className="text-center text-xl font-bold">
              Business Provisioned!
            </DialogTitle>
            <DialogDescription className="text-center">
              The tenant has been set up with complete RBAC permissions and the Owner account is active.
            </DialogDescription>
          </DialogHeader>

          {createdResult && (
            <div className="space-y-4 py-3">
              <div className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex justify-between items-center text-xs pb-2 border-b">
                  <span className="text-muted-foreground">Business:</span>
                  <span className="font-semibold text-foreground">{createdResult.tenant.name}</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-2 border-b">
                  <span className="text-muted-foreground">Owner Name:</span>
                  <span className="font-medium text-foreground">{createdResult.owner_credentials.full_name}</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-2 border-b">
                  <span className="text-muted-foreground">Login Mobile / ID:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-foreground">
                      {createdResult.owner_credentials.identifier}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() =>
                        copyToClipboard(createdResult.owner_credentials.identifier, "Login ID")
                      }
                    >
                      <IconCopy className="size-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Password:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-primary">
                      {createdResult.owner_credentials.password}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() =>
                        copyToClipboard(createdResult.owner_credentials.password, "Password")
                      }
                    >
                      <IconCopy className="size-3" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 flex items-start gap-2.5">
                <IconBrandWhatsapp className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                    Share Credentials via WhatsApp
                  </p>
                  <p className="text-muted-foreground">
                    Copy the pre-formatted welcome message and send it directly to the business owner&apos;s phone.
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => copyToClipboard(getWhatsAppTemplate(), "WhatsApp Message")}
              className="w-full sm:w-auto text-xs"
            >
              <IconCopy className="size-3.5 mr-1.5" />
              {copiedField === "WhatsApp Message" ? "Copied!" : "Copy WhatsApp Message"}
            </Button>
            <Button
              onClick={() => setIsSuccessOpen(false)}
              className="w-full sm:w-auto text-xs bg-primary text-primary-foreground"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
