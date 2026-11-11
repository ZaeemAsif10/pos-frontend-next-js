"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  IconTruckDelivery,
  IconPlus,
  IconSearch,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconRefresh,
  IconAlertTriangle,
  IconPhone,
  IconMail,
  IconBuildingFactory2,
  IconMapPin,
  IconWallet,
  IconBuildingBank,
  IconReceipt2,
  IconCheck,
  IconFileText,
  IconCreditCard,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth-context";
import { useAppEventListener } from "@/lib/events";
import {
  partyService,
  type SupplierItem,
  type SupplierStats,
} from "@/services/party.service";
import { SupplierPaymentModal } from "@/components/suppliers/supplier-payment-modal";
import { SupplierLedgerModal } from "@/components/suppliers/supplier-ledger-modal";

export default function SuppliersPage() {
  const { user, tenant } = useAuth();
  const userPerms = tenant?.permissions || [];
  const userRole = tenant?.role_name || "";
  const isOwnerOrAdmin =
    user?.is_superadmin ||
    userRole.toLowerCase() === "admin" ||
    userRole.toLowerCase() === "owner" ||
    userPerms.includes("*");

  const canCreate = isOwnerOrAdmin || userPerms.includes("suppliers:create");
  const canEdit = isOwnerOrAdmin || userPerms.includes("suppliers:edit");
  const canDelete = isOwnerOrAdmin || userPerms.includes("suppliers:delete");

  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [stats, setStats] = useState<SupplierStats>({
    total_suppliers: 0,
    total_payables: 0,
    active_mills: 0,
    bank_accounts_count: 0,
  });

  // Filter States
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierItem | null>(null);

  // Payment & Ledger Modals State
  const [paymentSupplier, setPaymentSupplier] = useState<SupplierItem | null>(null);
  const [ledgerSupplier, setLedgerSupplier] = useState<SupplierItem | null>(null);

  // Form Fields
  const [code, setCode] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [ntn, setNtn] = useState("");
  const [strn, setStrn] = useState("");
  const [paymentTermsDays, setPaymentTermsDays] = useState<number>(30);
  const [openingBalance, setOpeningBalance] = useState<number>(0);

  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankIban, setBankIban] = useState("");
  const [bankBranch, setBankBranch] = useState("");

  const [city, setCity] = useState("Lahore");
  const [address, setAddress] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete State
  const [deletingSupplier, setDeletingSupplier] = useState<SupplierItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [totalSuppliers, setTotalSuppliers] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const loadSupplierStats = async () => {
    try {
      const statsData = await partyService.getSupplierStats().catch(() => ({
        total_suppliers: 0,
        total_payables: 0,
        active_mills: 0,
        bank_accounts_count: 0,
      }));
      setStats(statsData);
    } catch (err: any) {
      // stats error fallback
    }
  };

  const loadSuppliers = useCallback(
    async (isInitial = false) => {
      try {
        if (isInitial) setInitialLoading(true);
        else setIsFetching(true);

        const res = await partyService.listSuppliers({
          search: search.trim() || undefined,
          is_active: statusFilter === "all" ? undefined : statusFilter === "active",
          page,
          size: pageSize,
        });

        if (res && res.items) {
          setSuppliers(res.items);
          setTotalSuppliers(res.total);
        } else if (Array.isArray(res)) {
          setSuppliers(res);
          setTotalSuppliers(res.length);
        }
      } catch (err: any) {
        toast.error(err?.detail || err?.message || "Failed to load suppliers data");
      } finally {
        setInitialLoading(false);
        setIsFetching(false);
        setLoading(false);
      }
    },
    [page, pageSize, search, statusFilter]
  );

  const isInitialMount = useRef(true);
  useEffect(() => {
    loadSupplierStats();
    loadSuppliers(true);
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const timer = setTimeout(() => {
      loadSuppliers(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [loadSuppliers]);

  // Reactive UI: auto-refresh table and stats when suppliers change anywhere
  useAppEventListener("suppliers:changed", () => {
    loadSuppliers(false);
    loadSupplierStats();
  });

  const openCreateModal = () => {
    setEditingSupplier(null);
    setCode(`SUP-${String(suppliers.length + 1).padStart(3, "0")}`);
    setCompanyName("");
    setContactPerson("");
    setPhone("");
    setEmail("");
    setNtn("");
    setStrn("");
    setPaymentTermsDays(30);
    setOpeningBalance(0);
    setBankName("");
    setBankAccountNumber("");
    setBankIban("");
    setBankBranch("");
    setCity("Lahore");
    setAddress("");
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (s: SupplierItem) => {
    setEditingSupplier(s);
    setCode(s.code);
    setCompanyName(s.company_name);
    setContactPerson(s.contact_person || "");
    setPhone(s.phone);
    setEmail(s.email || "");
    setNtn(s.ntn || "");
    setStrn(s.strn || "");
    setPaymentTermsDays(Number(s.payment_terms_days) || 30);
    setOpeningBalance(Number(s.opening_balance) || 0);
    setBankName(s.bank_name || "");
    setBankAccountNumber(s.bank_account_number || "");
    setBankIban(s.bank_iban || "");
    setBankBranch(s.bank_branch || "");
    setCity(s.city);
    setAddress(s.address || "");
    setIsActive(s.is_active);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      toast.error("Please enter a company / supplier name");
      return;
    }
    if (!phone.trim()) {
      toast.error("Please enter a contact phone number");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        code: code.trim().toUpperCase(),
        company_name: companyName.trim(),
        contact_person: contactPerson.trim() || null,
        phone: phone.trim(),
        email: email.trim() || null,
        ntn: ntn.trim() || null,
        strn: strn.trim() || null,
        payment_terms_days: Number(paymentTermsDays) || 0,
        opening_balance: Number(openingBalance) || 0,
        bank_name: bankName.trim() || null,
        bank_account_number: bankAccountNumber.trim() || null,
        bank_iban: bankIban.trim() || null,
        bank_branch: bankBranch.trim() || null,
        city: city.trim(),
        address: address.trim() || null,
        is_active: isActive,
      };

      if (editingSupplier) {
        await partyService.updateSupplier(editingSupplier.id, payload);
        toast.success(`Supplier '${companyName}' updated successfully`);
      } else {
        await partyService.createSupplier(payload);
        toast.success(`Supplier '${companyName}' registered successfully`);
      }
      setIsModalOpen(false);
      loadSuppliers();
      loadSupplierStats();
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to save supplier");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingSupplier) return;
    try {
      setIsDeleting(true);
      const res = await partyService.deleteSupplier(deletingSupplier.id);
      toast.success(res.message || "Supplier deleted successfully");
      setDeletingSupplier(null);
      loadSuppliers();
      loadSupplierStats();
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to delete supplier");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Suppliers & Vendors Directory</h1>
            <Badge variant="outline" className="text-xs">
              {suppliers.length} Vendors
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage manufacturers, mills, import principals, and commercial bank details.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadSuppliers();
              loadSupplierStats();
            }}
            disabled={loading}
            className="h-9 gap-1.5"
          >
            <IconRefresh className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {canCreate && (
            <Button size="sm" onClick={openCreateModal} className="h-9 gap-1.5">
              <IconPlus className="h-4 w-4" />
              Add Supplier
            </Button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
            <IconTruckDelivery className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_suppliers}</div>
            <p className="text-xs text-muted-foreground">Registered procurement sources</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payables</CardTitle>
            <IconWallet className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              PKR {stats.total_payables.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground">Outstanding vendor dues</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Mills & Brands</CardTitle>
            <IconBuildingFactory2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.active_mills}
            </div>
            <p className="text-xs text-muted-foreground">Direct supply channels</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bank Accounts Linked</CardTitle>
            <IconBuildingBank className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.bank_accounts_count}
            </div>
            <p className="text-xs text-muted-foreground">Ready for EFT & bank payout</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Global Table */}
      <DataTable<SupplierItem>
        data={suppliers}
        columns={[
          {
            header: "Code",
            className: "w-[110px] font-mono font-semibold",
            cell: (s) => s.code,
          },
          {
            header: "Company & Contact",
            cell: (s) => (
              <div>
                <div className="font-medium text-foreground">{s.company_name}</div>
                {s.contact_person && (
                  <p className="text-xs text-muted-foreground">
                    Contact: {s.contact_person}
                  </p>
                )}
              </div>
            ),
          },
          {
            header: "Contact Info",
            cell: (s) => (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs">
                  <IconPhone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{s.phone}</span>
                </div>
                {s.email && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <IconMail className="h-3.5 w-3.5" />
                    <span className="truncate max-w-[150px]">{s.email}</span>
                  </div>
                )}
              </div>
            ),
          },
          {
            header: "Payment Terms",
            cell: (s) => (
              <Badge variant="outline" className="text-xs">
                {s.payment_terms_days} Days Credit
              </Badge>
            ),
          },
          {
            header: "Banking Details",
            cell: (s) =>
              s.bank_name && s.bank_account_number ? (
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1 text-xs font-medium">
                    <IconBuildingBank className="h-3.5 w-3.5 text-blue-500" />
                    <span>{s.bank_name}</span>
                  </div>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    A/C: {s.bank_account_number}
                  </p>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground italic">No Bank Info</span>
              ),
          },
          {
            header: "Payable Balance",
            className: "text-right",
            headerClassName: "text-right",
            cell: (s) => (
              <div
                onClick={() => setLedgerSupplier(s)}
                className="cursor-pointer group transition-all"
                title="Click to view Supplier Ledger Statement"
              >
                <div
                  className={`text-xs font-bold group-hover:underline ${
                    Number(s.current_balance) > 0
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-muted-foreground"
                  }`}
                >
                  PKR {Number(s.current_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            ),
          },
          {
            header: "Status",
            cell: (s) => (
              <Badge
                variant={s.is_active ? "default" : "secondary"}
                className={
                  s.is_active
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 border-0 text-[10px]"
                    : "text-[10px]"
                }
              >
                {s.is_active ? "Active" : "Inactive"}
              </Badge>
            ),
          },
          {
            header: "Actions",
            className: "text-right",
            headerClassName: "text-right",
            cell: (s) => (
              <div className="flex items-center justify-end gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaymentSupplier(s)}
                  className="h-8 px-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/5 border-rose-500/30 hover:bg-rose-500/15 hover:border-rose-500/50 transition-all gap-1.5 shadow-2xs"
                  title="Pay Supplier"
                >
                  <IconCreditCard className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                  Pay
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLedgerSupplier(s)}
                  className="h-8 px-2.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 border-indigo-500/30 hover:bg-indigo-500/15 hover:border-indigo-500/50 transition-all gap-1.5 shadow-2xs"
                  title="Supplier Ledger Statement"
                >
                  <IconFileText className="h-3.5 w-3.5 text-indigo-500" />
                  Ledger
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <IconDotsVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setLedgerSupplier(s)}>
                      <IconFileText className="mr-2 h-4 w-4 text-indigo-500" />
                      View Ledger
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setPaymentSupplier(s)}>
                      <IconCreditCard className="mr-2 h-4 w-4 text-rose-500" />
                      Pay Supplier
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {canEdit && (
                      <DropdownMenuItem onClick={() => openEditModal(s)}>
                        <IconEdit className="mr-2 h-4 w-4" />
                        Edit Supplier
                      </DropdownMenuItem>
                    )}
                    {canDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeletingSupplier(s)}
                          className="text-destructive focus:text-destructive"
                        >
                          <IconTrash className="mr-2 h-4 w-4" />
                          Delete Supplier
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ),
          },
        ]}
        keyExtractor={(s) => s.id}
        initialLoading={initialLoading}
        isFetching={isFetching}
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search suppliers, NTN, bank..."
        filterControls={
          <Select
            value={statusFilter}
            onValueChange={(val: any) => {
              setStatusFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-36 h-9 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        }
        recordLabel="Vendors"
        totalRecords={totalSuppliers}
        pagination={{
          page,
          pageSize,
          total: totalSuppliers,
          onPageChange: setPage,
          onPageSizeChange: (newSize) => {
            setPageSize(newSize);
            setPage(1);
          },
        }}
        emptyTitle="No suppliers found"
        emptyDescription={
          search || statusFilter !== "all"
            ? "No suppliers match your active search filters. Try clearing your filters."
            : "Add your suppliers and mills to manage purchase bills"
        }
        emptyIcon={<IconTruckDelivery className="h-6 w-6 text-muted-foreground/60" />}
        onClearFilters={
          search || statusFilter !== "all"
            ? () => {
                setSearch("");
                setStatusFilter("all");
                setPage(1);
              }
            : undefined
        }
      />

      {/* Create / Edit Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingSupplier ? "Edit Supplier / Vendor" : "Add Supplier / Vendor"}
              </DialogTitle>
              <DialogDescription>
                Define supplier contact details, payment terms, and bank accounts for settlement.
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="company" className="py-4">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="company">Company & Terms</TabsTrigger>
                <TabsTrigger value="bank">Banking & Location</TabsTrigger>
              </TabsList>

              {/* Tab 1: Company Profile */}
              <TabsContent value="company" className="space-y-4 pt-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="supCode" className="text-xs font-semibold">
                      Supplier Code <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="supCode"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="e.g. SUP-001"
                      className="font-mono uppercase"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contactPerson" className="text-xs font-semibold">
                      Contact Person
                    </Label>
                    <Input
                      id="contactPerson"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="e.g. Tariq Mehmood"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="compName" className="text-xs font-semibold">
                    Company / Mill Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="compName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Nestle Pakistan Ltd / Packages Mall"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs font-semibold">
                      Phone Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="042-35800000"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-semibold">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="accounts@supplier.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="terms" className="text-xs font-semibold">
                      Payment Terms (Credit Days)
                    </Label>
                    <Input
                      id="terms"
                      type="number"
                      value={paymentTermsDays}
                      onChange={(e) => setPaymentTermsDays(Number(e.target.value))}
                      min="0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="supOpening" className="text-xs font-semibold">
                      Opening Balance (PKR)
                    </Label>
                    <Input
                      id="supOpening"
                      type="number"
                      value={openingBalance}
                      onChange={(e) => setOpeningBalance(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="ntn" className="text-xs font-semibold">
                      NTN Number
                    </Label>
                    <Input
                      id="ntn"
                      value={ntn}
                      onChange={(e) => setNtn(e.target.value)}
                      placeholder="e.g. 1234567-8"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="strn" className="text-xs font-semibold">
                      STRN (Sales Tax)
                    </Label>
                    <Input
                      id="strn"
                      value={strn}
                      onChange={(e) => setStrn(e.target.value)}
                      placeholder="e.g. 03-01-xxxx-xxx-xx"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Tab 2: Banking & Location */}
              <TabsContent value="bank" className="space-y-4 pt-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="bankName" className="text-xs font-semibold">
                      Bank Name
                    </Label>
                    <Input
                      id="bankName"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. Habib Bank Limited (HBL)"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="bankBranch" className="text-xs font-semibold">
                      Bank Branch
                    </Label>
                    <Input
                      id="bankBranch"
                      value={bankBranch}
                      onChange={(e) => setBankBranch(e.target.value)}
                      placeholder="e.g. Main Market Gulberg Branch"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="accNo" className="text-xs font-semibold">
                      Account Number
                    </Label>
                    <Input
                      id="accNo"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      placeholder="00123456789001"
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="iban" className="text-xs font-semibold">
                      IBAN
                    </Label>
                    <Input
                      id="iban"
                      value={bankIban}
                      onChange={(e) => setBankIban(e.target.value)}
                      placeholder="PK36HABB0000000000000000"
                      className="font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="supCity" className="text-xs font-semibold">
                    City
                  </Label>
                  <Input
                    id="supCity"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Lahore / Karachi"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="address" className="text-xs font-semibold">
                    Office / Factory Address
                  </Label>
                  <Textarea
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Industrial Area, Sector, Plot #"
                    rows={2}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Operational Status</Label>
                    <p className="text-xs text-muted-foreground">
                      Inactive suppliers will be disabled for future purchase orders.
                    </p>
                  </div>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? editingSupplier
                    ? "Saving Changes..."
                    : "Registering..."
                  : editingSupplier
                  ? "Save Changes"
                  : "Register Supplier"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={Boolean(deletingSupplier)}
        onOpenChange={(open) => !open && setDeletingSupplier(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <IconAlertTriangle className="h-5 w-5" />
              Delete Supplier
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Are you sure you want to delete supplier{" "}
                  <strong className="text-foreground">
                    &quot;{deletingSupplier?.company_name}&quot;
                  </strong>{" "}
                  ({deletingSupplier?.code})?
                </p>
                {deletingSupplier?.current_balance && Number(deletingSupplier.current_balance) !== 0 ? (
                  <p className="text-destructive font-medium">
                    Warning: There is an outstanding payable balance of PKR{" "}
                    {Number(deletingSupplier.current_balance).toLocaleString()} owed to this vendor.
                    The system will block deletion until all bills are settled.
                  </p>
                ) : (
                  <p>This action cannot be undone and will permanently remove the supplier record.</p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? "Deleting..." : "Delete Supplier"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Supplier Payment (CPV) Modal */}
      <SupplierPaymentModal
        supplier={paymentSupplier}
        isOpen={!!paymentSupplier}
        onClose={() => setPaymentSupplier(null)}
        onSuccess={() => {
          loadSuppliers();
          loadSupplierStats();
        }}
      />

      {/* Supplier Ledger Statement Modal */}
      <SupplierLedgerModal
        supplier={ledgerSupplier}
        isOpen={!!ledgerSupplier}
        onClose={() => setLedgerSupplier(null)}
        onOpenPaySupplier={(s) => setPaymentSupplier(s)}
      />
    </div>
  );
}
