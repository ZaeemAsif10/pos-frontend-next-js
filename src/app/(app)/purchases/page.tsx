"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  IconReceipt,
  IconPlus,
  IconSearch,
  IconDotsVertical,
  IconTrash,
  IconRefresh,
  IconAlertTriangle,
  IconBuildingStore,
  IconTruckDelivery,
  IconWallet,
  IconCalendarEvent,
  IconEye,
  IconPackage,
  IconX,
  IconArrowBackUp,
} from "@tabler/icons-react";

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
import { useAuth } from "@/context/auth-context";
import { useAppEventListener } from "@/lib/events";
import {
  inventoryService,
  type PurchaseItem,
  type PurchaseDetail,
  type PurchaseStats,
  type PurchaseItemPayload,
} from "@/services/inventory.service";
import { branchService, type BranchItem } from "@/services/branch.service";
import { partyService, type SupplierItem } from "@/services/party.service";
import { productService, type ProductListItem } from "@/services/product.service";

interface FormItemRow {
  product_id: number;
  product_name: string;
  sku: string;
  uom_conversion_id?: number | null;
  unit_name: string;
  quantity: number;
  conversion_factor: number;
  unit_cost: number;
  total_cost: number;
  batch_number: string;
  expiry_date: string;
}

export default function PurchasesPage() {
  const { user, tenant } = useAuth();
  const userPerms = tenant?.permissions || [];
  const userRole = tenant?.role_name || "";
  const isOwnerOrAdmin =
    user?.is_superadmin ||
    userRole.toLowerCase() === "admin" ||
    userRole.toLowerCase() === "owner" ||
    userPerms.includes("*");

  const canCreate = isOwnerOrAdmin || userPerms.includes("purchases:create");
  const canDelete = isOwnerOrAdmin || userPerms.includes("purchases:delete");

  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [stats, setStats] = useState<PurchaseStats>({
    total_purchases_count: 0,
    total_purchases_amount: 0,
    total_unpaid_payables: 0,
    monthly_purchases_amount: 0,
  });

  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [products, setProducts] = useState<ProductListItem[]>([]);

  // Filter States
  const [search, setSearch] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedSupplier, setSelectedSupplier] = useState("all");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("all");

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [branchId, setBranchId] = useState<number | 0>(0);
  const [supplierId, setSupplierId] = useState<number | 0>(0);
  const [supplierBillNo, setSupplierBillNo] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [notes, setNotes] = useState("");

  const [itemRows, setItemRows] = useState<FormItemRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // View Detail Modal State
  const [viewingPurchase, setViewingPurchase] = useState<PurchaseDetail | null>(null);
  const [isViewLoading, setIsViewLoading] = useState(false);

  // Delete State
  const [deletingPurchase, setDeletingPurchase] = useState<PurchaseItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Return / Debit Note State
  const [returningPurchase, setReturningPurchase] = useState<PurchaseItem | null>(null);
  const [returnReason, setReturnReason] = useState("Goods Returned to Supplier / Debit Note");
  const [returnRefundMethod, setReturnRefundMethod] = useState("cash");
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  const handleConfirmReturn = async () => {
    if (!returningPurchase) return;
    try {
      setIsSubmittingReturn(true);
      await inventoryService.returnPurchase(returningPurchase.id, {
        reason: returnReason,
        refund_payment_method: returnRefundMethod,
      });
      toast.success(`Purchase ${returningPurchase.invoice_number} returned and Debit Note posted successfully.`);
      setReturningPurchase(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to process purchase return");
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [purchasesData, statsData, branchesData, suppliersData, productsData] = await Promise.all([
        inventoryService.listPurchases(),
        inventoryService.getPurchaseStats().catch(() => ({
          total_purchases_count: 0,
          total_purchases_amount: 0,
          total_unpaid_payables: 0,
          monthly_purchases_amount: 0,
        })),
        branchService.listBranches().catch(() => ({ branches: [] })),
        partyService.listSuppliers().catch(() => []),
        productService.listProducts().catch(() => ({ items: [] })),
      ]);

      setPurchases(purchasesData || []);
      setStats(statsData);
      setBranches(branchesData?.branches || []);
      setSuppliers(suppliersData || []);
      setProducts(productsData?.items || []);
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to load purchases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Reactive UI: auto-refresh purchases, stats, and dropdowns when relevant entities change
  useAppEventListener(
    ["purchases:changed", "suppliers:changed", "branches:changed", "products:changed"],
    () => {
      loadData();
    }
  );


  const openCreateModal = () => {
    setBranchId(branches.length > 0 ? branches[0].id : 0);
    setSupplierId(suppliers.length > 0 ? suppliers[0].id : 0);
    setSupplierBillNo("");
    setPurchaseDate(new Date().toISOString().split("T")[0]);
    setDiscountAmount(0);
    setTaxAmount(0);
    setShippingCost(0);
    setPaidAmount(0);
    setNotes("");

    // Initial empty row if products exist
    if (products.length > 0) {
      const p = products[0];
      setItemRows([
        {
          product_id: p.id,
          product_name: p.name,
          sku: p.sku,
          uom_conversion_id: null,
          unit_name: p.base_unit || "Piece",
          quantity: 10,
          conversion_factor: 1,
          unit_cost: Number(p.cost_price) || 0,
          total_cost: (Number(p.cost_price) || 0) * 10,
          batch_number: "",
          expiry_date: "",
        },
      ]);
    } else {
      setItemRows([]);
    }
    setIsCreateOpen(true);
  };

  const addItemRow = () => {
    if (products.length === 0) {
      toast.error("Please add products first.");
      return;
    }
    const p = products[0];
    setItemRows((prev) => [
      ...prev,
      {
        product_id: p.id,
        product_name: p.name,
        sku: p.sku,
        uom_conversion_id: null,
        unit_name: p.base_unit || "Piece",
        quantity: 1,
        conversion_factor: 1,
        unit_cost: Number(p.cost_price) || 0,
        total_cost: Number(p.cost_price) || 0,
        batch_number: "",
        expiry_date: "",
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    setItemRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProductSelect = (index: number, productId: number) => {
    const p = products.find((x) => x.id === productId);
    if (!p) return;

    setItemRows((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        product_id: p.id,
        product_name: p.name,
        sku: p.sku,
        uom_conversion_id: null,
        unit_name: p.base_unit || "Piece",
        conversion_factor: 1,
        unit_cost: Number(p.cost_price) || 0,
        total_cost: (Number(p.cost_price) || 0) * copy[index].quantity,
      };
      return copy;
    });
  };

  const handleUomSelect = (index: number, uomVal: string) => {
    setItemRows((prev) => {
      const copy = [...prev];
      const row = copy[index];
      const prod = products.find((x) => x.id === row.product_id);
      const baseCost = Number(prod?.cost_price) || 0;

      if (uomVal === "carton") {
        row.uom_conversion_id = null;
        row.unit_name = "Carton";
        row.conversion_factor = 24;
        row.unit_cost = baseCost * 24;
      } else if (uomVal === "box") {
        row.uom_conversion_id = null;
        row.unit_name = "Box";
        row.conversion_factor = 12;
        row.unit_cost = baseCost * 12;
      } else if (uomVal === "pack") {
        row.uom_conversion_id = null;
        row.unit_name = "Pack";
        row.conversion_factor = 6;
        row.unit_cost = baseCost * 6;
      } else {
        row.uom_conversion_id = null;
        row.unit_name = prod?.base_unit || "Piece";
        row.conversion_factor = 1;
        row.unit_cost = baseCost;
      }
      row.total_cost = row.quantity * row.unit_cost;
      return copy;
    });
  };

  const handleQuantityChange = (index: number, qty: number) => {
    setItemRows((prev) => {
      const copy = [...prev];
      copy[index].quantity = qty;
      copy[index].total_cost = qty * copy[index].unit_cost;
      return copy;
    });
  };

  const handleCostChange = (index: number, cost: number) => {
    setItemRows((prev) => {
      const copy = [...prev];
      copy[index].unit_cost = cost;
      copy[index].total_cost = copy[index].quantity * cost;
      return copy;
    });
  };

  const subtotal = itemRows.reduce((sum, r) => sum + r.total_cost, 0);
  const netTotal = Math.max(0, subtotal - discountAmount + taxAmount + shippingCost);
  const balanceDue = Math.max(0, netTotal - paidAmount);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchId) {
      toast.error("Please select a receiving branch/warehouse");
      return;
    }
    if (!supplierId) {
      toast.error("Please select a supplier");
      return;
    }
    if (itemRows.length === 0) {
      toast.error("Please add at least one product item");
      return;
    }

    try {
      setIsSubmitting(true);
      const itemsPayload: PurchaseItemPayload[] = itemRows.map((r) => ({
        product_id: r.product_id,
        uom_conversion_id: r.uom_conversion_id || null,
        unit_name: r.unit_name,
        quantity: r.quantity,
        conversion_factor: r.conversion_factor,
        unit_cost: r.unit_cost,
        batch_number: r.batch_number.trim() || null,
        expiry_date: r.expiry_date.trim() || null,
      }));

      await inventoryService.createPurchase({
        branch_id: branchId,
        supplier_id: supplierId,
        supplier_bill_no: supplierBillNo.trim() || null,
        purchase_date: purchaseDate,
        discount_amount: Number(discountAmount) || 0,
        tax_amount: Number(taxAmount) || 0,
        shipping_cost: Number(shippingCost) || 0,
        paid_amount: Number(paidAmount) || 0,
        notes: notes.trim() || null,
        items: itemsPayload,
      });

      toast.success("Purchase bill posted successfully! Stock updated.");
      setIsCreateOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to create purchase bill");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openViewDetail = async (p: PurchaseItem) => {
    try {
      setIsViewLoading(true);
      const detail = await inventoryService.getPurchaseDetail(p.id);
      setViewingPurchase(detail);
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to load purchase details");
    } finally {
      setIsViewLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPurchase) return;
    try {
      setIsDeleting(true);
      const res = await inventoryService.deletePurchase(deletingPurchase.id);
      toast.success(res.message || "Purchase bill cancelled and stock reversed");
      setDeletingPurchase(null);
      loadData();
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to cancel purchase");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredPurchases = purchases.filter((p) => {
    const matchesSearch =
      p.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      (p.supplier_bill_no && p.supplier_bill_no.toLowerCase().includes(search.toLowerCase())) ||
      (p.supplier_name && p.supplier_name.toLowerCase().includes(search.toLowerCase())) ||
      (p.branch_name && p.branch_name.toLowerCase().includes(search.toLowerCase()));

    const matchesBranch = selectedBranch === "all" || String(p.branch_id) === selectedBranch;
    const matchesSupplier = selectedSupplier === "all" || String(p.supplier_id) === selectedSupplier;
    const matchesStatus = selectedPaymentStatus === "all" || p.payment_status === selectedPaymentStatus;

    return matchesSearch && matchesBranch && matchesSupplier && matchesStatus;
  });

  const paginatedPurchases = filteredPurchases.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Purchases & Goods Receipts (GRN)</h1>
            <Badge variant="outline" className="text-xs">
              {purchases.length} Invoices
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Procure stock from mills, manage carton packaging, and update vendor payables.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="h-9 gap-1.5"
          >
            <IconRefresh className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {canCreate && (
            <Button size="sm" onClick={openCreateModal} className="h-9 gap-1.5">
              <IconPlus className="h-4 w-4" />
              New Purchase Bill
            </Button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases Volume</CardTitle>
            <IconReceipt className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              PKR {stats.total_purchases_amount.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground">{stats.total_purchases_count} Total Invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Payables</CardTitle>
            <IconWallet className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              PKR {stats.total_unpaid_payables.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground">Unsettled vendor dues</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Purchases</CardTitle>
            <IconCalendarEvent className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              PKR {stats.monthly_purchases_amount.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground">Inward this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registered Mills / Vendors</CardTitle>
            <IconTruckDelivery className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {suppliers.length}
            </div>
            <p className="text-xs text-muted-foreground">Active supply partners</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border border-border/70 overflow-hidden shadow-sm">
        <div className="p-3.5 border-b bg-card/60 flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-72 md:w-80">
              <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Invoice # or bill #..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-8 h-9 text-xs"
              />
            </div>

            {/* Branch Filter */}
            <Select
              value={selectedBranch}
              onValueChange={(val) => {
                setSelectedBranch(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-36 h-9 text-xs">
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Supplier Filter */}
            <Select
              value={selectedSupplier}
              onValueChange={(val) => {
                setSelectedSupplier(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-40 h-9 text-xs">
                <SelectValue placeholder="Supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Suppliers</SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Payment Status Filter */}
            <Select
              value={selectedPaymentStatus}
              onValueChange={(val) => {
                setSelectedPaymentStatus(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-36 h-9 text-xs">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <span>{filteredPurchases.length} Invoices Found</span>
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[130px]">Invoice #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Receiving Branch</TableHead>
                <TableHead className="text-center">Items</TableHead>
                <TableHead className="text-right">Total Bill</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Balance Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <IconRefresh className="h-6 w-6 animate-spin text-primary" />
                      <span>Loading purchase invoices...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredPurchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <IconReceipt className="h-8 w-8 text-muted-foreground/40" />
                      <p className="font-medium">No purchase invoices found</p>
                      <p className="text-xs">
                        {search ? "Adjust your filters" : "Create a new purchase bill to stock your warehouse"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPurchases.map((p) => (
                  <TableRow key={p.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-xs font-semibold">
                      <div>{p.invoice_number}</div>
                      {p.supplier_bill_no && (
                        <span className="text-[10px] text-muted-foreground">
                          Bill: {p.supplier_bill_no}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {p.purchase_date}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-xs text-foreground">
                        {p.supplier_name || "Supplier"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <IconBuildingStore className="h-3.5 w-3.5 text-blue-500" />
                        <span>{p.branch_name || "Branch"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                        {p.items_count} Items
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs font-semibold">
                      PKR {Number(p.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      PKR {Number(p.paid_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right text-xs font-bold text-rose-600 dark:text-rose-400">
                      PKR {Number(p.balance_due).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        <Badge
                          variant="outline"
                          className={`text-[10px] capitalize ${
                            p.payment_status === "paid"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : p.payment_status === "partial"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                          }`}
                        >
                          {p.payment_status}
                        </Badge>
                        {p.status === "returned" && (
                          <Badge variant="outline" className="text-[9px] bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30">
                            Returned (Debit Note)
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <IconDotsVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openViewDetail(p)}>
                            <IconEye className="mr-2 h-4 w-4" />
                            View Items & Bill
                          </DropdownMenuItem>
                          {p.status !== "returned" && p.status !== "cancelled" && canCreate && (
                            <DropdownMenuItem
                              onClick={() => {
                                setReturningPurchase(p);
                                setReturnReason("Goods Returned to Supplier / Debit Note");
                                setReturnRefundMethod("cash");
                              }}
                              className="text-amber-600 focus:text-amber-600 dark:text-amber-400"
                            >
                              <IconArrowBackUp className="mr-2 h-4 w-4" />
                              Return / Debit Note
                            </DropdownMenuItem>
                          )}
                          {canDelete && p.status !== "returned" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeletingPurchase(p)}
                                className="text-destructive focus:text-destructive"
                              >
                                <IconTrash className="mr-2 h-4 w-4" />
                                Cancel & Reverse Stock
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
          <DataTablePagination
            page={page}
            pageSize={pageSize}
            total={filteredPurchases.length}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
          />
        </CardContent>
      </Card>

      {/* Create Purchase Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[850px] max-h-[92vh] overflow-y-auto">
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <IconReceipt className="h-5 w-5 text-primary" />
                Post Purchase Bill / Goods Receipt (GRN)
              </DialogTitle>
              <DialogDescription>
                Receive goods into warehouse inventory and automatically credit supplier khata balance.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              {/* Top Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-muted/40 p-3 rounded-lg border">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">
                    Receiving Branch / Godown <span className="text-destructive">*</span>
                  </Label>
                  <Select value={String(branchId)} onValueChange={(val) => setBranchId(Number(val))}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select Branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={String(b.id)} className="text-xs">
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">
                    Supplier / Vendor <span className="text-destructive">*</span>
                  </Label>
                  <Select value={String(supplierId)} onValueChange={(val) => setSupplierId(Number(val))}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select Supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)} className="text-xs">
                          {s.company_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Supplier Bill #</Label>
                  <Input
                    value={supplierBillNo}
                    onChange={(e) => setSupplierBillNo(e.target.value)}
                    placeholder="e.g. INV-9021"
                    className="h-8 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Purchase Date</Label>
                  <Input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="h-8 text-xs"
                    required
                  />
                </div>
              </div>

              {/* Items Line Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Purchased Line Items
                  </Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItemRow} className="h-7 text-xs gap-1">
                    <IconPlus className="h-3 w-3" />
                    Add Product Row
                  </Button>
                </div>

                <div className="border rounded-md divide-y max-h-[300px] overflow-y-auto">
                  {itemRows.map((row, idx) => {
                    const prod = products.find((x) => x.id === row.product_id);

                    return (
                      <div key={idx} className="p-2.5 flex flex-wrap items-center gap-2 hover:bg-muted/30">
                        {/* Product Selector */}
                        <div className="flex-1 min-w-[200px]">
                          <Select
                            value={String(row.product_id)}
                            onValueChange={(val) => handleProductSelect(idx, Number(val))}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((p) => (
                                <SelectItem key={p.id} value={String(p.id)} className="text-xs">
                                  {p.name} ({p.sku})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* UOM Selector */}
                        <div className="w-[125px]">
                          <Select
                            value={
                              row.unit_name.toLowerCase() === "carton"
                                ? "carton"
                                : row.unit_name.toLowerCase() === "box"
                                ? "box"
                                : row.unit_name.toLowerCase() === "pack"
                                ? "pack"
                                : "base"
                            }
                            onValueChange={(val) => handleUomSelect(idx, val)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="base" className="text-xs">
                                {prod?.base_unit || "Piece"} (Base)
                              </SelectItem>
                              <SelectItem value="carton" className="text-xs">
                                Carton (×24)
                              </SelectItem>
                              <SelectItem value="box" className="text-xs">
                                Box (×12)
                              </SelectItem>
                              <SelectItem value="pack" className="text-xs">
                                Pack (×6)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Quantity */}
                        <div className="w-[80px]">
                          <Input
                            type="number"
                            min="0.1"
                            step="any"
                            value={row.quantity}
                            onChange={(e) => handleQuantityChange(idx, Number(e.target.value))}
                            className="h-8 text-xs text-right"
                            placeholder="Qty"
                            required
                          />
                        </div>

                        {/* Unit Cost */}
                        <div className="w-[100px]">
                          <Input
                            type="number"
                            min="0"
                            step="any"
                            value={row.unit_cost}
                            onChange={(e) => handleCostChange(idx, Number(e.target.value))}
                            className="h-8 text-xs text-right font-mono"
                            placeholder="Cost"
                            required
                          />
                        </div>

                        {/* Total Cost */}
                        <div className="w-[110px] text-right font-mono text-xs font-bold text-foreground">
                          PKR {row.total_cost.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                        </div>

                        {/* Remove Row */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItemRow(idx)}
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        >
                          <IconX className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bill Totals & Settlement */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Delivery & Bill Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Bilty #, driver contact, or procurement notes..."
                    rows={3}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5 bg-muted/30 p-3 rounded-lg border text-xs">
                  <div className="flex justify-between py-0.5">
                    <span className="text-muted-foreground">Items Subtotal:</span>
                    <span className="font-mono font-semibold">PKR {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-1">
                    <div>
                      <Label className="text-[10px]">Discount</Label>
                      <Input
                        type="number"
                        min="0"
                        value={discountAmount}
                        onChange={(e) => setDiscountAmount(Number(e.target.value))}
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px]">Tax (GST)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={taxAmount}
                        onChange={(e) => setTaxAmount(Number(e.target.value))}
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px]">Freight / Bilty</Label>
                      <Input
                        type="number"
                        min="0"
                        value={shippingCost}
                        onChange={(e) => setShippingCost(Number(e.target.value))}
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between py-1 border-t font-bold text-sm">
                    <span>Net Bill Total:</span>
                    <span className="text-primary font-mono">PKR {netTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <Label className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        Cash/Bank Paid
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(Number(e.target.value))}
                        className="h-7 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400"
                      />
                    </div>
                    <div className="text-right">
                      <Label className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">
                        Vendor Khata Due
                      </Label>
                      <div className="h-7 flex items-center justify-end font-mono font-bold text-xs text-rose-600 dark:text-rose-400">
                        PKR {balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Posting Purchase..." : "Create Purchase Bill"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Purchase Detail Modal */}
      <Dialog open={Boolean(viewingPurchase)} onOpenChange={(open) => !open && setViewingPurchase(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          {viewingPurchase && (
            <div>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-lg font-bold font-mono">
                    {viewingPurchase.invoice_number}
                  </DialogTitle>
                  <Badge
                    variant="outline"
                    className={`capitalize text-xs ${
                      viewingPurchase.payment_status === "paid"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                    }`}
                  >
                    {viewingPurchase.payment_status}
                  </Badge>
                </div>
                <DialogDescription>
                  Goods Received Note & Procurement Breakdown
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4 py-3 text-xs border-y my-3">
                <div>
                  <span className="text-muted-foreground">Supplier / Mill:</span>
                  <p className="font-semibold text-foreground text-sm">{viewingPurchase.supplier_name}</p>
                  {viewingPurchase.supplier_bill_no && (
                    <p className="text-muted-foreground font-mono">Supplier Bill: #{viewingPurchase.supplier_bill_no}</p>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground">Received At Branch:</span>
                  <p className="font-semibold text-foreground text-sm">{viewingPurchase.branch_name}</p>
                  <p className="text-muted-foreground">Date: {viewingPurchase.purchase_date}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Purchased Items ({viewingPurchase.items?.length || 0})
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs">
                      <TableHead>Product</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Cost</TableHead>
                      <TableHead className="text-right">Total Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewingPurchase.items?.map((item) => (
                      <TableRow key={item.id} className="text-xs">
                        <TableCell>
                          <div className="font-medium text-foreground">{item.product_name}</div>
                          <span className="font-mono text-[10px] text-muted-foreground">{item.product_sku}</span>
                        </TableCell>
                        <TableCell>{item.unit_name}</TableCell>
                        <TableCell className="text-right font-semibold">{item.quantity}</TableCell>
                        <TableCell className="text-right font-mono">
                          PKR {Number(item.unit_cost).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold">
                          PKR {Number(item.total_cost).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Bill Totals Summary */}
              <div className="mt-4 p-3 bg-muted/40 rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-mono">PKR {Number(viewingPurchase.subtotal).toLocaleString()}</span>
                </div>
                {Number(viewingPurchase.discount_amount) > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span className="font-mono">- PKR {Number(viewingPurchase.discount_amount).toLocaleString()}</span>
                  </div>
                )}
                {Number(viewingPurchase.tax_amount) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax:</span>
                    <span className="font-mono">+ PKR {Number(viewingPurchase.tax_amount).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t font-bold text-sm">
                  <span>Net Payable:</span>
                  <span className="font-mono text-primary">PKR {Number(viewingPurchase.total_amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-1 text-xs">
                  <span className="text-emerald-600 font-semibold">Paid:</span>
                  <span className="font-mono text-emerald-600 font-semibold">PKR {Number(viewingPurchase.paid_amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-rose-600 font-semibold">Balance Due to Supplier:</span>
                  <span className="font-mono text-rose-600 font-bold">PKR {Number(viewingPurchase.balance_due).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PURCHASE RETURN & DEBIT NOTE MODAL */}
      <Dialog open={Boolean(returningPurchase)} onOpenChange={(open) => !open && setReturningPurchase(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Issue Debit Note & Return Goods</DialogTitle>
            <DialogDescription>
              Process a purchase return to supplier for bill <span className="font-mono font-semibold text-foreground">{returningPurchase?.invoice_number}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg border bg-muted/40 p-3 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Supplier:</span>
                <span className="font-medium text-foreground">{returningPurchase?.supplier_name || "Supplier"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Original Total Amount:</span>
                <span className="font-mono font-semibold text-foreground">
                  PKR {Number(returningPurchase?.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              {Number(returningPurchase?.balance_due || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unpaid Balance to Cancel:</span>
                  <span className="font-mono font-semibold text-rose-600">
                    PKR {Number(returningPurchase?.balance_due || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              {Number(returningPurchase?.paid_amount || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid Amount to Refund:</span>
                  <span className="font-mono font-semibold text-emerald-600">
                    PKR {Number(returningPurchase?.paid_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>

            {Number(returningPurchase?.paid_amount || 0) > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Refund Treatment (for paid amount)</label>
                <Select value={returnRefundMethod} onValueChange={setReturnRefundMethod}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue placeholder="Select refund mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash" className="text-xs">Cash Refund (Returned to Counter / Drawer)</SelectItem>
                    <SelectItem value="bank" className="text-xs">Bank Transfer (Deposited to Bank Account)</SelectItem>
                    <SelectItem value="credit" className="text-xs">Credit to Supplier Khata (Advance Balance)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Return Reason</label>
              <Input
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="e.g. Expired stock, damaged cartons, wrong delivery"
                className="text-xs"
              />
            </div>

            <p className="text-[11px] text-muted-foreground">
              Stock will be deducted from your warehouse and a double-entry Debit Note Journal Voucher will be automatically posted to Accounts Payable.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReturningPurchase(null)} disabled={isSubmittingReturn}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmReturn}
              disabled={isSubmittingReturn}
              className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isSubmittingReturn ? "Processing..." : "Confirm Return & Issue Debit Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete / Reverse Confirmation Dialog */}
      <AlertDialog
        open={Boolean(deletingPurchase)}
        onOpenChange={(open) => !open && setDeletingPurchase(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <IconAlertTriangle className="h-5 w-5" />
              Cancel & Reverse Purchase Bill
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Are you sure you want to cancel purchase invoice{" "}
                  <strong className="text-foreground">
                    &quot;{deletingPurchase?.invoice_number}&quot;
                  </strong>?
                </p>
                <p className="text-destructive font-medium">
                  Warning: This action will atomically deduct all purchased quantities from branch
                  stock and reverse the payable balance on the supplier&apos;s khata.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Dismiss</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? "Reversing..." : "Cancel Bill & Reverse Stock"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
