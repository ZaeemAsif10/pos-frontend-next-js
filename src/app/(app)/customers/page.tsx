"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { useLookupData } from "@/hooks/use-lookup-data";
import {
  IconUserHeart,
  IconPlus,
  IconSearch,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconRefresh,
  IconAlertTriangle,
  IconPhone,
  IconBrandWhatsapp,
  IconBuildingStore,
  IconMapPin,
  IconWallet,
  IconLock,
  IconRoute,
  IconCreditCard,
  IconReceipt2,
  IconCash,
  IconFileText,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
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
import {
  partyService,
  type CustomerItem,
  type CustomerStats,
  type DeliveryAreaItem,
} from "@/services/party.service";
import { branchService, type BranchItem } from "@/services/branch.service";
import { CustomerPaymentModal } from "@/components/customers/customer-payment-modal";
import { CustomerLedgerModal } from "@/components/customers/customer-ledger-modal";

export default function CustomersPage() {
  const { user, tenant } = useAuth();
  const userPerms = tenant?.permissions || [];
  const userRole = tenant?.role_name || "";
  const isOwnerOrAdmin =
    user?.is_superadmin ||
    userRole.toLowerCase() === "admin" ||
    userRole.toLowerCase() === "owner" ||
    userPerms.includes("*");

  const canCreate = isOwnerOrAdmin || userPerms.includes("customers:create");
  const canEdit = isOwnerOrAdmin || userPerms.includes("customers:edit");
  const canDelete = isOwnerOrAdmin || userPerms.includes("customers:delete");

  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [stats, setStats] = useState<CustomerStats>({
    total_customers: 0,
    total_receivables: 0,
    overdue_accounts: 0,
    credit_blocked_count: 0,
  });
  const { data: routes } = useLookupData("routes");
  const { data: branches } = useLookupData("branches");

  // Filter States
  const [search, setSearch] = useState("");
  const [selectedRoute, setSelectedRoute] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerItem | null>(null);

  // Customer Khata Payment State
  const [paymentCustomer, setPaymentCustomer] = useState<CustomerItem | null>(null);

  // Customer Ledger Statement State
  const [ledgerCustomer, setLedgerCustomer] = useState<CustomerItem | null>(null);

  // Form Fields
  const [code, setCode] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [email, setEmail] = useState("");
  const [cnic, setCnic] = useState("");
  const [ntn, setNtn] = useState("");
  const [strn, setStrn] = useState("");
  const [customerType, setCustomerType] = useState("retailer");

  const [creditLimit, setCreditLimit] = useState<number>(0);
  const [creditDays, setCreditDays] = useState<number>(15);
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [isCreditBlocked, setIsCreditBlocked] = useState<boolean>(false);

  const [areaId, setAreaId] = useState<number | 0>(0);
  const [branchId, setBranchId] = useState<number | 0>(0);
  const [city, setCity] = useState("Lahore");
  const [address, setAddress] = useState("");
  const [kycStatus, setKycStatus] = useState("verified");
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete State
  const [deletingCustomer, setDeletingCustomer] = useState<CustomerItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [totalCustomers, setTotalCustomers] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [search, selectedRoute, selectedType, statusFilter]);

  const loadAuxiliaryData = async () => {
    try {
      const statsData = await partyService.getCustomerStats().catch(() => ({
        total_customers: 0,
        total_receivables: 0,
        overdue_accounts: 0,
        credit_blocked_count: 0,
      }));
      setStats(statsData);
    } catch (err: any) {
      // stats fallback
    }
  };

  const loadCustomers = useCallback(
    async (isInitial = false) => {
      try {
        if (isInitial) setInitialLoading(true);
        else setIsFetching(true);

        const res = await partyService.listCustomers({
          search: search.trim() || undefined,
          area_id: selectedRoute !== "all" ? Number(selectedRoute) : undefined,
          customer_type: selectedType !== "all" ? selectedType : undefined,
          is_active: statusFilter === "all" ? undefined : statusFilter === "active",
          page,
          size: pageSize,
        });

        if (res && res.items) {
          setCustomers(res.items);
          setTotalCustomers(res.total);
        } else if (Array.isArray(res)) {
          setCustomers(res);
          setTotalCustomers(res.length);
        }
      } catch (err: any) {
        toast.error(err?.detail || err?.message || "Failed to load customers data");
      } finally {
        setInitialLoading(false);
        setIsFetching(false);
        setLoading(false);
      }
    },
    [page, pageSize, search, selectedRoute, selectedType, statusFilter]
  );

  const isInitialMount = useRef(true);
  useEffect(() => {
    loadAuxiliaryData();
    loadCustomers(true);
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const timer = setTimeout(() => {
      loadCustomers(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [loadCustomers]);

  const openCreateModal = () => {
    setEditingCustomer(null);
    setCode(`CUST-${String(customers.length + 1).padStart(3, "0")}`);
    setBusinessName("");
    setOwnerName("");
    setPhone("");
    setWhatsappNumber("");
    setEmail("");
    setCnic("");
    setNtn("");
    setStrn("");
    setCustomerType("retailer");
    setCreditLimit(50000);
    setCreditDays(15);
    setOpeningBalance(0);
    setIsCreditBlocked(false);
    setAreaId(routes.length > 0 ? routes[0].id : 0);
    setBranchId(branches.length > 0 ? branches[0].id : 0);
    setCity("Lahore");
    setAddress("");
    setKycStatus("verified");
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (c: CustomerItem) => {
    setEditingCustomer(c);
    setCode(c.code);
    setBusinessName(c.business_name);
    setOwnerName(c.owner_name || "");
    setPhone(c.phone);
    setWhatsappNumber(c.whatsapp_number || "");
    setEmail(c.email || "");
    setCnic(c.cnic || "");
    setNtn(c.ntn || "");
    setStrn(c.strn || "");
    setCustomerType(c.customer_type);
    setCreditLimit(Number(c.credit_limit) || 0);
    setCreditDays(Number(c.credit_days) || 0);
    setOpeningBalance(Number(c.opening_balance) || 0);
    setIsCreditBlocked(c.is_credit_blocked);
    setAreaId(c.area_id || 0);
    setBranchId(c.branch_id || 0);
    setCity(c.city);
    setAddress(c.address || "");
    setKycStatus(c.kyc_status);
    setIsActive(c.is_active);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) {
      toast.error("Please enter a shop or business name");
      return;
    }
    if (!phone.trim()) {
      toast.error("Please enter a primary phone number");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        code: code.trim().toUpperCase(),
        business_name: businessName.trim(),
        owner_name: ownerName.trim() || null,
        phone: phone.trim(),
        whatsapp_number: whatsappNumber.trim() || null,
        email: email.trim() || null,
        cnic: cnic.trim() || null,
        ntn: ntn.trim() || null,
        strn: strn.trim() || null,
        customer_type: customerType,
        credit_limit: Number(creditLimit) || 0,
        credit_days: Number(creditDays) || 0,
        opening_balance: Number(openingBalance) || 0,
        area_id: areaId > 0 ? areaId : null,
        branch_id: branchId > 0 ? branchId : null,
        city: city.trim(),
        address: address.trim() || null,
        kyc_status: kycStatus,
        is_active: isActive,
      };

      if (editingCustomer) {
        await partyService.updateCustomer(editingCustomer.id, {
          ...payload,
          is_credit_blocked: isCreditBlocked,
        });
        toast.success(`Customer '${businessName}' updated successfully`);
      } else {
        await partyService.createCustomer(payload);
        toast.success(`Customer '${businessName}' registered successfully`);
      }
      setIsModalOpen(false);
      loadCustomers();
      loadAuxiliaryData();
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to save customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCustomer) return;
    try {
      setIsDeleting(true);
      const res = await partyService.deleteCustomer(deletingCustomer.id);
      toast.success(res.message || "Customer deleted successfully");
      setDeletingCustomer(null);
      loadCustomers();
      loadAuxiliaryData();
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to delete customer");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFilterChange = () => {
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Customer Accounts & Khata</h1>
            <Badge variant="outline" className="text-xs">
              {customers.length} Accounts
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage retail shops, wholesale accounts, credit limits, and udhaar balances.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadCustomers();
              loadAuxiliaryData();
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
              Add Customer
            </Button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <IconUserHeart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_customers}</div>
            <p className="text-xs text-muted-foreground">Active commercial accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Receivables (Udhaar)</CardTitle>
            <IconWallet className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              PKR {stats.total_receivables.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground">Pending market collection</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Accounts</CardTitle>
            <IconAlertTriangle className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {stats.overdue_accounts}
            </div>
            <p className="text-xs text-muted-foreground">Exceeding credit limits</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credit Blocked</CardTitle>
            <IconLock className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats.credit_blocked_count}
            </div>
            <p className="text-xs text-muted-foreground">Orders suspended</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Global Table */}
      <DataTable<CustomerItem>
        data={customers}
        columns={[
          {
            header: "Code",
            className: "w-[110px] font-mono font-semibold",
            cell: (c) => c.code,
          },
          {
            header: "Business & Owner",
            cell: (c) => (
              <div>
                <div className="font-medium text-foreground">{c.business_name}</div>
                {c.owner_name && (
                  <p className="text-xs text-muted-foreground">
                    Prop: {c.owner_name}
                  </p>
                )}
              </div>
            ),
          },
          {
            header: "Contact",
            cell: (c) => (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs">
                  <IconPhone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{c.phone}</span>
                </div>
                {c.whatsapp_number && (
                  <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                    <IconBrandWhatsapp className="h-3.5 w-3.5" />
                    <span>{c.whatsapp_number}</span>
                  </div>
                )}
              </div>
            ),
          },
          {
            header: "Delivery Route",
            cell: (c) =>
              c.area_name ? (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <IconRoute className="h-3.5 w-3.5 text-blue-500" />
                  <span>{c.area_name}</span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground italic">No Route</span>
              ),
          },
          {
            header: "Type",
            cell: (c) => (
              <Badge variant="outline" className="text-xs capitalize">
                {c.customer_type}
              </Badge>
            ),
          },
          {
            header: "Credit Limit",
            className: "text-right",
            headerClassName: "text-right",
            cell: (c) =>
              Number(c.credit_limit) > 0 ? (
                <div>
                  <span className="font-semibold">
                    PKR {Number(c.credit_limit).toLocaleString()}
                  </span>
                  <p className="text-[10px] text-muted-foreground">
                    {c.credit_days} Days
                  </p>
                </div>
              ) : (
                <span className="text-muted-foreground italic">Cash Only</span>
              ),
          },
          {
            header: "Current Udhaar",
            className: "text-right",
            headerClassName: "text-right",
            cell: (c) => {
              const isOverdue =
                Number(c.credit_limit) > 0 &&
                Number(c.current_balance) > Number(c.credit_limit);
              return (
                <div
                  onClick={() => setLedgerCustomer(c)}
                  className="cursor-pointer group transition-all"
                  title="Click to view Customer Ledger Statement"
                >
                  <div
                    className={`text-xs font-bold group-hover:underline ${
                      Number(c.current_balance) > 0
                        ? isOverdue
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-amber-600 dark:text-amber-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    PKR {Number(c.current_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  {isOverdue && (
                    <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4 mt-0.5">
                      Limit Exceeded
                    </Badge>
                  )}
                </div>
              );
            },
          },
          {
            header: "Status",
            cell: (c) =>
              c.is_credit_blocked ? (
                <Badge variant="destructive" className="gap-1 text-[10px]">
                  <IconLock className="h-2.5 w-2.5" /> Blocked
                </Badge>
              ) : (
                <Badge
                  variant={c.is_active ? "default" : "secondary"}
                  className={
                    c.is_active
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 border-0 text-[10px]"
                      : "text-[10px]"
                  }
                >
                  {c.is_active ? "Active" : "Inactive"}
                </Badge>
              ),
          },
          {
            header: "Actions",
            className: "text-right",
            headerClassName: "text-right",
            cell: (c) => (
              <div className="flex items-center justify-end gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaymentCustomer(c)}
                  className="h-8 px-2.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 border-emerald-500/30 hover:bg-emerald-500/15 hover:border-emerald-500/50 transition-all gap-1.5 shadow-2xs"
                  title="Receive Payment"
                >
                  <IconCash className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Receive
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLedgerCustomer(c)}
                  className="h-8 px-2.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/5 border-blue-500/30 hover:bg-blue-500/15 hover:border-blue-500/50 transition-all gap-1.5 shadow-2xs"
                  title="Customer Ledger Statement"
                >
                  <IconFileText className="h-3.5 w-3.5 text-blue-500" />
                  Ledger
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <IconDotsVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setLedgerCustomer(c)}>
                      <IconFileText className="mr-2 h-4 w-4 text-primary" />
                      View Ledger
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setPaymentCustomer(c)}>
                      <IconCash className="mr-2 h-4 w-4 text-emerald-600" />
                      Receive Payment
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {canEdit && (
                      <DropdownMenuItem onClick={() => openEditModal(c)}>
                        <IconEdit className="mr-2 h-4 w-4" />
                        Edit Customer
                      </DropdownMenuItem>
                    )}
                    {canDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeletingCustomer(c)}
                          className="text-destructive focus:text-destructive"
                        >
                          <IconTrash className="mr-2 h-4 w-4" />
                          Delete Customer
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ),
          },
        ]}
        keyExtractor={(c) => c.id}
        initialLoading={initialLoading}
        isFetching={isFetching}
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search customer, phone, code..."
        filterControls={
          <>
            {/* Route Filter */}
            <Select
              value={selectedRoute}
              onValueChange={(val) => {
                setSelectedRoute(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-40 h-9 text-xs">
                <SelectValue placeholder="All Routes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Routes</SelectItem>
                {routes.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select
              value={selectedType}
              onValueChange={(val) => {
                setSelectedType(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-36 h-9 text-xs">
                <SelectValue placeholder="Account Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="retailer">Retailer</SelectItem>
                <SelectItem value="wholesaler">Wholesaler</SelectItem>
                <SelectItem value="corporate">Corporate</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(val: any) => {
                setStatusFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-36 h-9 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
        recordLabel="Customers"
        totalRecords={totalCustomers}
        pagination={{
          page,
          pageSize,
          total: totalCustomers,
          onPageChange: setPage,
          onPageSizeChange: (newSize) => {
            setPageSize(newSize);
            setPage(1);
          },
        }}
        emptyTitle="No customers found"
        emptyDescription={
          search || selectedRoute !== "all" || selectedType !== "all" || statusFilter !== "all"
            ? "No customers match your active search filters. Try clearing your filters."
            : "Add retail stores and wholesale clients to manage sales"
        }
        emptyIcon={<IconUserHeart className="h-6 w-6 text-muted-foreground/60" />}
        onClearFilters={
          search || selectedRoute !== "all" || selectedType !== "all" || statusFilter !== "all"
            ? () => {
                setSearch("");
                setSelectedRoute("all");
                setSelectedType("all");
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
                {editingCustomer ? "Edit Customer Account" : "Register New Customer"}
              </DialogTitle>
              <DialogDescription>
                Fill in commercial profile, contact numbers, and udhaar credit limits.
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="basic" className="py-4">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="basic">Business & Profile</TabsTrigger>
                <TabsTrigger value="credit">Credit & Location</TabsTrigger>
              </TabsList>

              {/* Tab 1: Basic Information */}
              <TabsContent value="basic" className="space-y-4 pt-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <Label htmlFor="custCode" className="text-xs font-semibold">
                      Account Code <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="custCode"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="e.g. CUST-001"
                      className="font-mono uppercase"
                      required
                    />
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <Label htmlFor="custType" className="text-xs font-semibold">
                      Customer Type
                    </Label>
                    <Select value={customerType} onValueChange={setCustomerType}>
                      <SelectTrigger id="custType" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="retailer">Retailer (Kirana / Mart)</SelectItem>
                        <SelectItem value="wholesaler">Wholesaler / Distributor</SelectItem>
                        <SelectItem value="corporate">Corporate / Institution</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="businessName" className="text-xs font-semibold">
                    Shop / Business Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="businessName"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Al-Madina Cash & Carry"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="ownerName" className="text-xs font-semibold">
                      Proprietor / Owner Name
                    </Label>
                    <Input
                      id="ownerName"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="e.g. Haji Muhammad Aslam"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs font-semibold">
                      Primary Phone <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0300-1234567"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="whatsapp" className="text-xs font-semibold">
                      WhatsApp Number
                    </Label>
                    <Input
                      id="whatsapp"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="0300-1234567"
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
                      placeholder="shop@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="cnic" className="text-xs font-semibold">
                      CNIC Number
                    </Label>
                    <Input
                      id="cnic"
                      value={cnic}
                      onChange={(e) => setCnic(e.target.value)}
                      placeholder="35201-xxxxxxx-x"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ntn" className="text-xs font-semibold">
                      NTN
                    </Label>
                    <Input
                      id="ntn"
                      value={ntn}
                      onChange={(e) => setNtn(e.target.value)}
                      placeholder="NTN-XXXX"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="strn" className="text-xs font-semibold">
                      STRN
                    </Label>
                    <Input
                      id="strn"
                      value={strn}
                      onChange={(e) => setStrn(e.target.value)}
                      placeholder="Sales Tax Reg #"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Tab 2: Credit & Location */}
              <TabsContent value="credit" className="space-y-4 pt-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="creditLimit" className="text-xs font-semibold">
                      Credit Limit (PKR)
                    </Label>
                    <Input
                      id="creditLimit"
                      type="number"
                      value={creditLimit}
                      onChange={(e) => setCreditLimit(Number(e.target.value))}
                      min="0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="creditDays" className="text-xs font-semibold">
                      Credit Days
                    </Label>
                    <Input
                      id="creditDays"
                      type="number"
                      value={creditDays}
                      onChange={(e) => setCreditDays(Number(e.target.value))}
                      min="0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="openingBal" className="text-xs font-semibold">
                      Opening Balance (PKR)
                    </Label>
                    <Input
                      id="openingBal"
                      type="number"
                      value={openingBalance}
                      onChange={(e) => setOpeningBalance(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <Label htmlFor="routeSelect" className="text-xs font-semibold">
                      Delivery Route / Beat
                    </Label>
                    <Select
                      value={String(areaId)}
                      onValueChange={(val) => setAreaId(Number(val))}
                    >
                      <SelectTrigger id="routeSelect" className="w-full">
                        <SelectValue placeholder="Select Route" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Unassigned</SelectItem>
                        {routes.map((r) => (
                          <SelectItem key={r.id} value={String(r.id)}>
                            {r.name} ({r.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <Label htmlFor="branchSelect" className="text-xs font-semibold">
                      Assigned Branch / Warehouse
                    </Label>
                    <Select
                      value={String(branchId)}
                      onValueChange={(val) => setBranchId(Number(val))}
                    >
                      <SelectTrigger id="branchSelect" className="w-full">
                        <SelectValue placeholder="Select Branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Default Main Store</SelectItem>
                        {branches.map((b) => (
                          <SelectItem key={b.id} value={String(b.id)}>
                            {b.name} ({b.city})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <Label htmlFor="custCity" className="text-xs font-semibold">
                      City
                    </Label>
                    <Input
                      id="custCity"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Lahore"
                    />
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <Label htmlFor="kyc" className="text-xs font-semibold">
                      KYC Status
                    </Label>
                    <Select value={kycStatus} onValueChange={setKycStatus}>
                      <SelectTrigger id="kyc" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="verified">Verified Account</SelectItem>
                        <SelectItem value="pending">Pending Verification</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="address" className="text-xs font-semibold">
                    Complete Address
                  </Label>
                  <Textarea
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Shop #, Market, Landmark, Road"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-medium">Account Active</Label>
                      <p className="text-[11px] text-muted-foreground">Accept new orders</p>
                    </div>
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-destructive/30 p-3 bg-destructive/5">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-medium text-destructive">Credit Blocked</Label>
                      <p className="text-[11px] text-muted-foreground">Halt udhaar sales</p>
                    </div>
                    <Switch checked={isCreditBlocked} onCheckedChange={setIsCreditBlocked} />
                  </div>
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
                  ? editingCustomer
                    ? "Saving Changes..."
                    : "Registering..."
                  : editingCustomer
                  ? "Save Changes"
                  : "Register Customer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={Boolean(deletingCustomer)}
        onOpenChange={(open) => !open && setDeletingCustomer(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <IconAlertTriangle className="h-5 w-5" />
              Delete Customer Account
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Are you sure you want to delete customer{" "}
                  <strong className="text-foreground">
                    &quot;{deletingCustomer?.business_name}&quot;
                  </strong>{" "}
                  ({deletingCustomer?.code})?
                </p>
                {deletingCustomer?.current_balance && Number(deletingCustomer.current_balance) !== 0 ? (
                  <p className="text-destructive font-medium">
                    Warning: This account has an outstanding balance of PKR{" "}
                    {Number(deletingCustomer.current_balance).toLocaleString()}. The system will
                    block deletion until all dues are settled.
                  </p>
                ) : (
                  <p>This action cannot be undone and will remove the customer profile.</p>
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
              {isDeleting ? "Deleting..." : "Delete Customer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Customer Khata Payment Recovery Modal */}
      <CustomerPaymentModal
        customer={paymentCustomer}
        isOpen={!!paymentCustomer}
        onClose={() => setPaymentCustomer(null)}
        onSuccess={() => {
          loadCustomers();
          loadAuxiliaryData();
        }}
      />

      {/* Customer Ledger Statement Modal */}
      <CustomerLedgerModal
        customer={ledgerCustomer}
        isOpen={!!ledgerCustomer}
        onClose={() => setLedgerCustomer(null)}
        onOpenReceivePayment={(cust) => setPaymentCustomer(cust)}
      />
    </div>
  );
}
