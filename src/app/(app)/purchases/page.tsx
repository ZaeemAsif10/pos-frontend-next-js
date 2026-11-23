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
  IconEdit,
  IconSettings,
  IconCreditCard,
  IconReportAnalytics,
  IconPrinter,
  IconBuildingBank,
  IconBuildingWarehouse,
} from "@tabler/icons-react";
import Link from "next/link";

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
  type PaymentStatusOptionItem,
} from "@/services/inventory.service";
import { branchService, type BranchItem } from "@/services/branch.service";
import { partyService, type SupplierItem } from "@/services/party.service";
import { productService, type ProductListItem } from "@/services/product.service";
import { accountingService, type AccountItem } from "@/services/accounting.service";

interface FormItemRow {
  product_id: number;
  product_name: string;
  sku: string;
  uom_conversion_id?: number | null;
  unit_name: string;
  quantity: number;
  conversion_factor: number;
  unit_cost: number;
  retail_price: number;
  tax_rate: number;
  tax_amount: number;
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
  const canEdit =
    isOwnerOrAdmin ||
    userPerms.includes("purchases:edit") ||
    userPerms.includes("purchases:create") ||
    userPerms.includes("payment_statuses:edit");
  const canDelete = isOwnerOrAdmin || userPerms.includes("purchases:delete");
  const canReturnPurchase =
    isOwnerOrAdmin ||
    userPerms.includes("purchase_returns:create") ||
    userPerms.includes("purchase_returns:manage") ||
    userPerms.includes("purchases:create");
  const canViewPurchaseReturns =
    isOwnerOrAdmin ||
    userPerms.includes("purchase_returns:view") ||
    userPerms.includes("purchase_returns:create") ||
    userPerms.includes("purchase_returns:edit") ||
    userPerms.includes("purchases:view") ||
    userPerms.includes("purchases:create");

  const canViewPaymentStatuses =
    isOwnerOrAdmin ||
    userPerms.includes("payment_statuses:view") ||
    userPerms.includes("payment_statuses:create") ||
    userPerms.includes("payment_statuses:edit") ||
    userPerms.includes("purchases:view") ||
    userPerms.includes("purchases:create");
  const canCreatePaymentStatus =
    isOwnerOrAdmin ||
    userPerms.includes("payment_statuses:create") ||
    userPerms.includes("purchases:create");
  const canEditPaymentStatus =
    isOwnerOrAdmin ||
    userPerms.includes("payment_statuses:edit") ||
    userPerms.includes("purchases:create");
  const canDeletePaymentStatus =
    isOwnerOrAdmin ||
    userPerms.includes("payment_statuses:delete") ||
    userPerms.includes("purchases:delete");

  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [paymentStatuses, setPaymentStatuses] = useState<PaymentStatusOptionItem[]>([]);
  const [stats, setStats] = useState<PurchaseStats>({
    total_purchases_count: 0,
    total_purchases_amount: 0,
    total_unpaid_payables: 0,
    monthly_purchases_amount: 0,
  });

  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [isReportOpen, setIsReportOpen] = useState(false);

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
  const [purchasePaymentStatus, setPurchasePaymentStatus] = useState<string>("unpaid");
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paidFromAccountId, setPaidFromAccountId] = useState<number | 0>(0);
  const [notes, setNotes] = useState("");

  // Edit Purchase Payment Status Modal State
  const [editingPurchase, setEditingPurchase] = useState<PurchaseItem | null>(null);
  const [editPaymentStatus, setEditPaymentStatus] = useState<string>("unpaid");
  const [editPaidAmount, setEditPaidAmount] = useState<number>(0);
  const [editPaidFromAccountId, setEditPaidFromAccountId] = useState<number | 0>(0);
  const [editSupplierBillNo, setEditSupplierBillNo] = useState<string>("");
  const [editNotes, setEditNotes] = useState<string>("");
  const [isUpdatingPurchase, setIsUpdatingPurchase] = useState(false);

  // Payment Statuses Dynamic CRUD Modal State
  const [isStatusCrudOpen, setIsStatusCrudOpen] = useState(false);
  const [editingStatusOption, setEditingStatusOption] = useState<PaymentStatusOptionItem | null>(null);
  const [statusName, setStatusName] = useState("");
  const [statusAccountingType, setStatusAccountingType] = useState<"paid" | "unpaid" | "partial">("unpaid");
  const [statusColor, setStatusColor] = useState("emerald");
  const [statusDescription, setStatusDescription] = useState("");
  const [isSavingStatusOption, setIsSavingStatusOption] = useState(false);

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
  const [returningPurchaseDetail, setReturningPurchaseDetail] = useState<PurchaseDetail | null>(null);
  const [isReturnDetailLoading, setIsReturnDetailLoading] = useState(false);
  const [returnItemQuantities, setReturnItemQuantities] = useState<Record<number, number>>({});
  const [returnReason, setReturnReason] = useState("Goods Returned to Supplier / Debit Note");
  const [returnRefundMethod, setReturnRefundMethod] = useState("credit");
  const [returnRefundAccountId, setReturnRefundAccountId] = useState<number>(0);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  const openReturnPurchaseModal = async (p: PurchaseItem) => {
    setReturningPurchase(p);
    setReturningPurchaseDetail(null);
    setReturnReason("Goods Returned to Supplier / Debit Note");
    setReturnRefundMethod(Number(p.paid_amount) > 0 && Number(p.balance_due) <= 0 ? "cash" : "credit");
    setReturnRefundAccountId(p.paid_from_account_id || 0);
    try {
      setIsReturnDetailLoading(true);
      const detail = await inventoryService.getPurchaseDetail(p.id);
      setReturningPurchaseDetail(detail);
      const initialQtys: Record<number, number> = {};
      (detail.items || []).forEach((it) => {
        const rem = Math.max(0, Number(it.quantity) - Number(it.returned_quantity || 0));
        initialQtys[it.id] = rem;
      });
      setReturnItemQuantities(initialQtys);
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to load purchase items for return");
    } finally {
      setIsReturnDetailLoading(false);
    }
  };

  const handleConfirmReturn = async () => {
    if (!returningPurchase) return;
    const detailItems = returningPurchaseDetail?.items || [];
    const itemsPayload = detailItems
      .map((it) => {
        const retQ = Number(returnItemQuantities[it.id] || 0);
        const maxRem = Math.max(0, Number(it.quantity) - Number(it.returned_quantity || 0));
        const validQ = Math.min(Math.max(0, retQ), maxRem);
        return {
          purchase_item_id: it.id,
          product_id: it.product_id,
          unit_name: it.unit_name,
          quantity: validQ,
          conversion_factor: Number(it.conversion_factor || 1),
          unit_cost: Number(it.unit_cost || 0),
        };
      })
      .filter((x) => x.quantity > 0);

    if (itemsPayload.length === 0) {
      toast.error("Please enter a return quantity greater than 0 for at least one item.");
      return;
    }

    try {
      setIsSubmittingReturn(true);
      await inventoryService.returnPurchase(returningPurchase.id, {
        reason: returnReason,
        refund_payment_method: returnRefundMethod,
        refund_account_id:
          returnRefundMethod !== "credit" && returnRefundAccountId > 0
            ? returnRefundAccountId
            : null,
        items: itemsPayload,
      });
      const totRetQty = itemsPayload.reduce((acc, x) => acc + x.quantity, 0);
      const totRetAmt = itemsPayload.reduce((acc, x) => acc + x.quantity * x.unit_cost, 0);
      toast.success(
        `Returned ${totRetQty} Qty (PKR ${totRetAmt.toLocaleString()}) from Warehouse '${returningPurchase.branch_name || "Main"}' and posted Debit Note!`
      );
      setReturningPurchase(null);
      setReturningPurchaseDetail(null);
      loadData();
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to process purchase return");
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [purchasesData, statsData, branchesData, suppliersData, productsData, statusesData, accountsData] = await Promise.all([
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
        inventoryService.listPaymentStatuses().catch(() => []),
        accountingService.listAccounts({ active_only: true }).catch(() => []),
      ]);

      setPurchases(purchasesData || []);
      setStats(statsData);
      setBranches(branchesData?.branches || []);
      setSuppliers(suppliersData || []);
      setProducts(productsData?.items || []);
      setPaymentStatuses(statusesData || []);
      setAccounts(accountsData || []);
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
    setPurchasePaymentStatus("unpaid");
    setDiscountAmount(0);
    setTaxAmount(0);
    setShippingCost(0);
    setPaidAmount(0);
    setPaidFromAccountId(0);
    setNotes("");

    // Default Purchase Price = 1 and Sale Price = 1 for all rows
    if (products.length > 0) {
      const p = products[0];
      const initialRows: FormItemRow[] = [
        {
          product_id: p.id,
          product_name: p.name,
          sku: p.sku,
          uom_conversion_id: null,
          unit_name: p.base_unit || "Piece",
          quantity: 10,
          conversion_factor: 1,
          unit_cost: 1,
          retail_price: 1,
          tax_rate: 0,
          tax_amount: 0,
          total_cost: 10,
          batch_number: "",
          expiry_date: "",
        },
      ];
      setItemRows(initialRows);
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
        unit_cost: 1,
        retail_price: 1,
        tax_rate: 0,
        tax_amount: 0,
        total_cost: 1,
        batch_number: "",
        expiry_date: "",
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    setItemRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProductSelect = (index: number, productId: number) => {
    if (!productId) {
      const copy = [...itemRows];
      copy[index] = {
        ...copy[index],
        product_id: 0,
        product_name: "",
        sku: "",
      };
      setItemRows(copy);
      return;
    }
    const p = products.find((x) => x.id === productId);
    if (!p) return;

    const copy = [...itemRows];
    const qty = copy[index].quantity || 1;
    copy[index] = {
      ...copy[index],
      product_id: p.id,
      product_name: p.name,
      sku: p.sku,
      uom_conversion_id: null,
      unit_name: p.base_unit || "Piece",
      conversion_factor: 1,
      unit_cost: 1,
      retail_price: 1,
      tax_rate: 0,
      tax_amount: 0,
      total_cost: qty * 1,
    };
    setItemRows(copy);
  };

  const handleUomSelect = (index: number, uomVal: string) => {
    const copy = [...itemRows];
    const row = { ...copy[index] };
    const prod = products.find((x) => x.id === row.product_id);

    if (uomVal === "carton") {
      row.uom_conversion_id = null;
      row.unit_name = "Carton";
      row.conversion_factor = 24;
    } else if (uomVal === "box") {
      row.uom_conversion_id = null;
      row.unit_name = "Box";
      row.conversion_factor = 12;
    } else if (uomVal === "pack") {
      row.uom_conversion_id = null;
      row.unit_name = "Pack";
      row.conversion_factor = 6;
    } else {
      row.uom_conversion_id = null;
      row.unit_name = prod?.base_unit || "Piece";
      row.conversion_factor = 1;
    }
    row.total_cost = Math.round(row.quantity * row.unit_cost * 100) / 100;
    copy[index] = row;
    setItemRows(copy);
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const copy = [...itemRows];
    const row = { ...copy[index], quantity: qty };
    row.total_cost = Math.round(qty * row.unit_cost * 100) / 100;
    copy[index] = row;
    setItemRows(copy);
  };

  const handleCostChange = (index: number, cost: number) => {
    const copy = [...itemRows];
    const row = { ...copy[index], unit_cost: cost };
    row.total_cost = Math.round(row.quantity * cost * 100) / 100;
    copy[index] = row;
    setItemRows(copy);
  };

  const handleRetailPriceChange = (index: number, salePrice: number) => {
    const copy = [...itemRows];
    copy[index] = { ...copy[index], retail_price: salePrice };
    setItemRows(copy);
  };

  // Eligible Cash / Bank / Asset accounts from Chart of Accounts for making payments
  const paymentAccounts = accounts
    .filter(
      (a) =>
        a.is_active &&
        a.account_type === "asset" &&
        a.code !== "1030" &&
        a.code !== "1040" &&
        !a.name.toLowerCase().includes("inventory") &&
        !a.name.toLowerCase().includes("receivable")
    )
    .sort((a, b) => a.code.localeCompare(b.code));

  const subtotal = itemRows.reduce((sum, r) => sum + r.quantity * r.unit_cost, 0);
  const netTotal = Math.max(0, subtotal);

  const selectedStatusObj = paymentStatuses.find(
    (s) => s.code.toLowerCase() === purchasePaymentStatus.toLowerCase()
  );
  const currentAccBehavior =
    selectedStatusObj?.accounting_type ||
    (purchasePaymentStatus.toLowerCase() === "paid"
      ? "paid"
      : purchasePaymentStatus.toLowerCase() === "partial"
      ? "partial"
      : "unpaid");

  const effectivePaidAmount =
    currentAccBehavior === "unpaid"
      ? 0
      : Math.min(Math.max(0, Number(paidAmount) || 0), netTotal);
  const balanceDue = Math.max(0, netTotal - effectivePaidAmount);

  const editStatusObj = paymentStatuses.find(
    (s) => s.code.toLowerCase() === editPaymentStatus.toLowerCase()
  );
  const editAccBehavior =
    editStatusObj?.accounting_type ||
    (editPaymentStatus.toLowerCase() === "paid"
      ? "paid"
      : editPaymentStatus.toLowerCase() === "partial"
      ? "partial"
      : "unpaid");
  const editNetTotal = Number(editingPurchase?.total_amount || 0);
  const editEffectivePaidAmount =
    editAccBehavior === "unpaid"
      ? 0
      : Math.min(Math.max(0, Number(editPaidAmount) || 0), editNetTotal);
  const editBalanceDue = Math.max(0, editNetTotal - editEffectivePaidAmount);

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
    if (itemRows.some((r) => !r.product_id)) {
      toast.error("Please select a product for all line items");
      return;
    }
    if (!purchasePaymentStatus || purchasePaymentStatus === "none") {
      toast.error("Please select a payment status");
      return;
    }
    if (currentAccBehavior !== "unpaid") {
      if (!paidFromAccountId) {
        toast.error("Please select the Cash / Bank account from which payment was made");
        return;
      }
      if (!effectivePaidAmount || effectivePaidAmount <= 0) {
        toast.error("Please enter a valid paid amount greater than 0");
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const itemsPayload: PurchaseItemPayload[] = itemRows.map((r) => ({
        product_id: r.product_id,
        uom_conversion_id: r.uom_conversion_id || null,
        unit_name: r.unit_name,
        quantity: r.quantity,
        conversion_factor: r.conversion_factor,
        unit_cost: Number(r.unit_cost) || 1,
        retail_price: Number(r.retail_price) || 1,
        tax_rate: 0,
        tax_amount: 0,
        total_cost: r.total_cost,
        batch_number: r.batch_number.trim() || null,
        expiry_date: r.expiry_date.trim() || null,
      }));

      await inventoryService.createPurchase({
        branch_id: branchId,
        supplier_id: supplierId,
        supplier_bill_no: supplierBillNo.trim() || null,
        purchase_date: purchaseDate,
        payment_status: purchasePaymentStatus,
        discount_amount: 0,
        tax_amount: 0,
        shipping_cost: 0,
        paid_amount: effectivePaidAmount,
        paid_from_account_id: currentAccBehavior !== "unpaid" ? paidFromAccountId : null,
        notes: notes.trim() || null,
        items: itemsPayload,
      });

      toast.success("Purchase bill posted! Stock & Double-Entry Accounting updated.");
      setIsCreateOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to create purchase bill");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditPurchaseModal = (p: PurchaseItem) => {
    setEditingPurchase(p);
    setEditPaymentStatus(p.payment_status === "partial" ? "paid" : (p.payment_status || "unpaid"));
    setEditPaidAmount(Number(p.paid_amount || 0) > 0 ? Number(p.paid_amount) : Number(p.total_amount || 0));
    setEditPaidFromAccountId(p.paid_from_account_id || 0);
    setEditSupplierBillNo(p.supplier_bill_no || "");
    setEditNotes(p.notes || "");
  };

  const handleUpdatePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPurchase) return;
    if (!editPaymentStatus || editPaymentStatus === "none") {
      toast.error("Please select a payment status");
      return;
    }
    if (editAccBehavior !== "unpaid") {
      if (!editPaidFromAccountId) {
        toast.error("Please select the Cash / Bank account from which payment was made");
        return;
      }
      if (!editEffectivePaidAmount || editEffectivePaidAmount <= 0) {
        toast.error("Please enter a valid paid amount greater than 0");
        return;
      }
    }
    try {
      setIsUpdatingPurchase(true);
      await inventoryService.updatePurchase(editingPurchase.id, {
        payment_status: editPaymentStatus,
        paid_amount: editEffectivePaidAmount,
        paid_from_account_id: editAccBehavior !== "unpaid" ? editPaidFromAccountId : 0,
        supplier_bill_no: editSupplierBillNo.trim() || null,
        notes: editNotes.trim() || null,
      });
      toast.success(
        `Purchase ${editingPurchase.invoice_number} updated! Paid: PKR ${editEffectivePaidAmount.toLocaleString()} | Pending: PKR ${editBalanceDue.toLocaleString()}. Double-Entry Journal & Balance Sheet synced.`
      );
      setEditingPurchase(null);
      loadData();
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to update purchase payment status");
    } finally {
      setIsUpdatingPurchase(false);
    }
  };

  const resetStatusOptionForm = () => {
    setEditingStatusOption(null);
    setStatusName("");
    setStatusAccountingType("unpaid");
    setStatusColor("rose");
    setStatusDescription("");
  };

  const handleEditStatusOption = (opt: PaymentStatusOptionItem) => {
    setEditingStatusOption(opt);
    setStatusName(opt.name);
    setStatusAccountingType(opt.accounting_type);
    setStatusColor(opt.color || "emerald");
    setStatusDescription(opt.description || "");
  };

  const handleSaveStatusOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusName.trim()) {
      toast.error("Please enter a payment status name");
      return;
    }
    try {
      setIsSavingStatusOption(true);
      if (editingStatusOption) {
        await inventoryService.updatePaymentStatus(editingStatusOption.id, {
          name: statusName.trim(),
          accounting_type: statusAccountingType,
          color: statusColor,
          description: statusDescription.trim() || null,
        });
        toast.success(`Payment status "${statusName}" updated!`);
      } else {
        const created = await inventoryService.createPaymentStatus({
          name: statusName.trim(),
          accounting_type: statusAccountingType,
          color: statusColor,
          description: statusDescription.trim() || null,
          is_active: true,
        });
        toast.success(`Payment status "${created.name}" created!`);
        setPurchasePaymentStatus(created.code);
      }
      resetStatusOptionForm();
      const fresh = await inventoryService.listPaymentStatuses();
      setPaymentStatuses(fresh || []);
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to save payment status");
    } finally {
      setIsSavingStatusOption(false);
    }
  };

  const handleDeleteStatusOption = async (opt: PaymentStatusOptionItem) => {
    try {
      await inventoryService.deletePaymentStatus(opt.id);
      toast.success(`Payment status "${opt.name}" deleted.`);
      const fresh = await inventoryService.listPaymentStatuses();
      setPaymentStatuses(fresh || []);
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to delete payment status");
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsReportOpen(true)}
            className="h-9 gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
          >
            <IconReportAnalytics className="h-4 w-4" />
            Payment &amp; Pending Report
          </Button>
          {canViewPurchaseReturns && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
            >
              <Link href="/purchase-returns">
                <IconArrowBackUp className="h-4 w-4" />
                Purchase Returns
              </Link>
            </Button>
          )}
          {canViewPaymentStatuses && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-9 gap-1.5"
            >
              <Link href="/payment-statuses">
                <IconCreditCard className="h-4 w-4" />
                Payment Statuses
              </Link>
            </Button>
          )}
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
            <CardTitle className="text-sm font-medium">Registered Suppliers / Vendors</CardTitle>
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
                <SelectItem value="all">All Warehouses / Branches</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    Warehouse: {b.name}
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
                {paymentStatuses.length > 0 ? (
                  paymentStatuses.map((st) => (
                    <SelectItem key={st.id} value={st.code}>
                      {st.name}
                    </SelectItem>
                  ))
                ) : (
                  <>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                  </>
                )}
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
                <TableHead>Warehouse / Branch</TableHead>
                <TableHead className="text-center">Qty</TableHead>
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
                      <div className="flex items-center gap-1.5 text-xs">
                        <IconBuildingWarehouse className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        <div>
                          <span className="font-medium text-foreground">{p.branch_name || "Main Warehouse"}</span>
                          <span className="block text-[10px] text-muted-foreground">Stock Inward Warehouse</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-mono">
                          {p.total_qty && p.total_qty > 0 ? p.total_qty : p.items_count}
                        </Badge>
                        {Number(p.returned_qty || 0) > 0 && (
                          <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-semibold">
                            -{p.returned_qty} Ret (Kept: {Math.max(0, Number(p.total_qty || 0) - Number(p.returned_qty || 0))})
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-xs font-semibold">
                      <div>PKR {Number(p.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      {Number(p.returned_amount || 0) > 0 && (
                        <div className="text-[10px] font-mono text-amber-600 dark:text-amber-400">
                          Ret: PKR {Number(p.returned_amount).toLocaleString()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      <div>PKR {Number(p.paid_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      {p.paid_from_account_name && Number(p.paid_amount) > 0 && (
                        <div className="text-[10px] text-muted-foreground font-mono">
                          via {p.paid_from_account_code} - {p.paid_from_account_name}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-xs font-bold text-rose-600 dark:text-rose-400">
                      PKR {Number(p.balance_due).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        {(() => {
                          const stObj = paymentStatuses.find(
                            (s) => s.code.toLowerCase() === (p.payment_status || "").toLowerCase()
                          );
                          const isPaidLike =
                            (stObj?.accounting_type === "paid" || p.payment_status === "paid") &&
                            Number(p.balance_due) <= 0;
                          const isPartialLike =
                            stObj?.accounting_type === "partial" ||
                            p.payment_status === "partial" ||
                            (Number(p.paid_amount) > 0 && Number(p.balance_due) > 0);
                          return (
                            <Badge
                              variant="outline"
                              onClick={() => canEdit && openEditPurchaseModal(p)}
                              title={canEdit ? "Click to update Payment Status & Account" : undefined}
                              className={`text-[10px] capitalize ${
                                canEdit ? "cursor-pointer hover:opacity-80" : ""
                              } ${
                                isPaidLike
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                  : isPartialLike
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                              }`}
                            >
                              {isPartialLike ? "Partial" : stObj ? stObj.name : p.payment_status}
                            </Badge>
                          );
                        })()}
                        {p.journal_entry_number && (
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {p.journal_entry_number}
                          </span>
                        )}
                        {p.status === "returned" && (
                          <Badge variant="outline" className="text-[9px] bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30">
                            Fully Returned (Debit Note)
                          </Badge>
                        )}
                        {p.status === "partial_returned" && (
                          <Badge variant="outline" className="text-[9px] bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30">
                            Partial Return ({p.returned_qty} Qty)
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
                            View Items &amp; Bill
                          </DropdownMenuItem>
                          {p.status !== "returned" && p.status !== "cancelled" && canEdit && (
                            <DropdownMenuItem onClick={() => openEditPurchaseModal(p)}>
                              <IconEdit className="mr-2 h-4 w-4 text-primary" />
                              Update Payment Status
                            </DropdownMenuItem>
                          )}
                          {p.status !== "returned" && p.status !== "cancelled" && canReturnPurchase && (
                            <DropdownMenuItem
                              onClick={() => openReturnPurchaseModal(p)}
                              className="text-amber-600 focus:text-amber-600 dark:text-amber-400"
                            >
                              <IconArrowBackUp className="mr-2 h-4 w-4" />
                              Return Qty / Debit Note
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
        <DialogContent className="sm:max-w-[980px] max-h-[92vh] overflow-y-auto">
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <IconReceipt className="h-5 w-5 text-primary" />
                Post Purchase Bill / Goods Receipt (GRN)
              </DialogTitle>
              <DialogDescription>
                Receive goods into warehouse inventory, set purchase &amp; sale price, and post to Double-Entry Accounting.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              {/* Top Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-muted/40 p-3 rounded-lg border">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold flex items-center gap-1">
                    <IconBuildingWarehouse className="h-3.5 w-3.5 text-primary" />
                    Receiving Warehouse / Godown <span className="text-destructive">*</span>
                  </Label>
                  <Select value={String(branchId)} onValueChange={(val) => setBranchId(Number(val))}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Choose One" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0" className="text-xs text-muted-foreground">
                        Choose One
                      </SelectItem>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={String(b.id)} className="text-xs">
                          Warehouse: {b.name}
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
                      <SelectValue placeholder="Choose One" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0" className="text-xs text-muted-foreground">
                        Choose One
                      </SelectItem>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)} className="text-xs">
                          {s.company_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">
                    Supplier Bill # <span className="text-muted-foreground font-normal">(Optional)</span>
                  </Label>
                  <Input
                    value={supplierBillNo}
                    onChange={(e) => setSupplierBillNo(e.target.value)}
                    placeholder="e.g. INV-9021"
                    className="h-8 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">
                    Purchase Date <span className="text-destructive">*</span>
                  </Label>
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

                <div className="border rounded-md divide-y max-h-[340px] overflow-y-auto">
                  {itemRows.map((row, idx) => {
                    const prod = products.find((x) => x.id === row.product_id);

                    return (
                      <div key={idx} className="p-3 flex flex-wrap items-end gap-2.5 hover:bg-muted/30">
                        {/* Product Selector */}
                        <div className="flex-1 min-w-[200px] space-y-1">
                          <Label className="text-[11px] font-semibold text-muted-foreground">
                            Product / Item <span className="text-destructive">*</span>
                          </Label>
                          <Select
                            value={String(row.product_id)}
                            onValueChange={(val) => handleProductSelect(idx, Number(val))}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Choose One" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0" className="text-xs text-muted-foreground">
                                Choose One
                              </SelectItem>
                              {products.map((p) => (
                                <SelectItem key={p.id} value={String(p.id)} className="text-xs">
                                  {p.name} ({p.sku})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* UOM Selector */}
                        <div className="w-[125px] space-y-1">
                          <Label className="text-[11px] font-semibold text-muted-foreground">
                            Unit (UOM)
                          </Label>
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
                              <SelectValue placeholder="Choose One" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none" className="text-xs text-muted-foreground">
                                Choose One
                              </SelectItem>
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
                        <div className="w-[85px] space-y-1">
                          <Label className="text-[11px] font-semibold text-muted-foreground">
                            Quantity <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            type="number"
                            min="0.1"
                            step="any"
                            value={row.quantity}
                            onChange={(e) => handleQuantityChange(idx, Number(e.target.value))}
                            className="h-8 text-xs text-right"
                            placeholder="1"
                            required
                          />
                        </div>

                        {/* Purchase Price (Default 1) */}
                        <div className="w-[125px] space-y-1">
                          <Label className="text-[11px] font-semibold text-muted-foreground">
                            Purchase Price <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            type="number"
                            min="1"
                            step="any"
                            value={row.unit_cost}
                            onChange={(e) => handleCostChange(idx, Number(e.target.value))}
                            className="h-8 text-xs text-right font-mono"
                            placeholder="1"
                            required
                          />
                        </div>

                        {/* Sale Price (Default 1) */}
                        <div className="w-[125px] space-y-1">
                          <Label className="text-[11px] font-semibold text-muted-foreground">
                            Sale Price <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            type="number"
                            min="1"
                            step="any"
                            value={row.retail_price}
                            onChange={(e) => handleRetailPriceChange(idx, Number(e.target.value))}
                            className="h-8 text-xs text-right font-mono border-primary/40"
                            placeholder="1"
                            required
                          />
                        </div>

                        {/* Row Total */}
                        <div className="w-[120px] space-y-1 text-right">
                          <Label className="text-[11px] font-semibold text-muted-foreground block">
                            Line Total
                          </Label>
                          <div className="h-8 flex items-center justify-end font-mono text-xs font-bold text-foreground">
                            PKR {row.total_cost.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                          </div>
                        </div>

                        {/* Remove Row */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItemRow(idx)}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        >
                          <IconX className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bill Totals & Payment Status Settlement */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">
                    Delivery &amp; Bill Notes <span className="text-muted-foreground font-normal">(Optional)</span>
                  </Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Bilty #, driver contact, or procurement notes..."
                    rows={4}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-2.5 bg-muted/30 p-3.5 rounded-lg border text-xs">
                  <div className="flex justify-between py-0.5">
                    <span className="text-muted-foreground">Items Subtotal:</span>
                    <span className="font-mono font-semibold">
                      PKR {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-t font-bold text-sm">
                    <span>Net Bill Total:</span>
                    <span className="text-primary font-mono">
                      PKR {netTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Dynamic Payment Status Selector + Quick Manage CRUD */}
                  <div className="space-y-1.5 pt-1 border-t">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">
                        Payment Status <span className="text-destructive">*</span>
                      </Label>
                      {canViewPaymentStatuses && (
                        <button
                          type="button"
                          onClick={() => {
                            resetStatusOptionForm();
                            setIsStatusCrudOpen(true);
                          }}
                          className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1"
                        >
                          <IconPlus className="h-3 w-3" />
                          Manage Statuses
                        </button>
                      )}
                    </div>
                    <Select
                      value={purchasePaymentStatus}
                      onValueChange={(val) => {
                        setPurchasePaymentStatus(val);
                        const st = paymentStatuses.find((s) => s.code.toLowerCase() === val.toLowerCase());
                        const behavior =
                          st?.accounting_type ||
                          (val.toLowerCase() === "paid"
                            ? "paid"
                            : val.toLowerCase() === "partial"
                            ? "partial"
                            : "unpaid");
                        if (behavior === "unpaid") {
                          setPaidAmount(0);
                          setPaidFromAccountId(0);
                        } else if (paidAmount <= 0) {
                          setPaidAmount(netTotal);
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs font-semibold">
                        <SelectValue placeholder="Choose One" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-xs text-muted-foreground">
                          Choose One
                        </SelectItem>
                        {(paymentStatuses.filter((s) => s.is_active).length > 0
                          ? paymentStatuses.filter((s) => s.is_active)
                          : [
                              { id: 1, name: "Paid", code: "paid", accounting_type: "paid" as const },
                              { id: 2, name: "Unpaid", code: "unpaid", accounting_type: "unpaid" as const },
                            ]
                        ).map((st) => (
                          <SelectItem key={st.code} value={st.code} className="text-xs">
                            {st.name} ({st.accounting_type === "paid" ? "Cash / Bank Paid" : st.accounting_type === "partial" ? "Partial Payment" : "Supplier Khata Credit"})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {currentAccBehavior !== "unpaid" && purchasePaymentStatus !== "none" && (
                    <div className="space-y-2.5 pt-2 border-t border-primary/20">
                      {/* 1. Paid From Account Dropdown */}
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold flex items-center gap-1">
                          <IconBuildingBank className="h-3.5 w-3.5 text-primary" />
                          Paid From Account (Cash / Bank) <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={String(paidFromAccountId)}
                          onValueChange={(val) => setPaidFromAccountId(Number(val))}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Choose One" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0" className="text-xs text-muted-foreground">
                              Choose One
                            </SelectItem>
                            {paymentAccounts.map((acc) => (
                              <SelectItem key={acc.id} value={String(acc.id)} className="text-xs">
                                {acc.code} — {acc.name} (Bal: PKR {Number(acc.current_balance || 0).toLocaleString()})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* 2. Paid Amount Input */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            Paid Amount (PKR) <span className="text-destructive">*</span>
                          </Label>
                          <button
                            type="button"
                            onClick={() => setPaidAmount(netTotal)}
                            className="text-[10px] font-medium text-primary hover:underline"
                          >
                            Pay Full (PKR {netTotal.toLocaleString()})
                          </button>
                        </div>
                        <Input
                          type="number"
                          min="0"
                          max={netTotal}
                          step="any"
                          value={paidAmount}
                          onChange={(e) => setPaidAmount(Number(e.target.value))}
                          placeholder="Enter amount paid (e.g. 60000)"
                          className="h-8 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400"
                        />
                        <p className="text-[10px] text-muted-foreground">
                          If paid amount is less than PKR {netTotal.toLocaleString()}, the remaining balance will automatically post as pending on Supplier Khata (Accounts Payable 2010).
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                    <div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">
                        Paid via Account
                      </span>
                      <div className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                        PKR {effectivePaidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold block">
                        Pending (Vendor Khata Due)
                      </span>
                      <div className="font-mono font-bold text-xs text-rose-600 dark:text-rose-400">
                        PKR {balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                  {effectivePaidAmount > 0 && balanceDue > 0 && (
                    <div className="rounded bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                      Double-Entry Split: Dr. Inventory PKR {netTotal.toLocaleString()} → Cr. Selected Account PKR {effectivePaidAmount.toLocaleString()} &amp; Cr. Supplier Payable PKR {balanceDue.toLocaleString()}
                    </div>
                  )}
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

      {/* Update Purchase Payment Status Modal */}
      <Dialog open={Boolean(editingPurchase)} onOpenChange={(open) => !open && setEditingPurchase(null)}>
        <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleUpdatePurchaseSubmit}>
            <DialogHeader>
              <DialogTitle>Update Purchase &amp; Payment Status</DialogTitle>
              <DialogDescription>
                Update payment status for bill{" "}
                <span className="font-mono font-semibold text-foreground">
                  {editingPurchase?.invoice_number}
                </span>
                . Double-Entry Journal Voucher, Trial Balance, and Balance Sheet will update automatically.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              <div className="rounded-lg border bg-muted/40 p-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Supplier:</span>
                  <span className="font-semibold">{editingPurchase?.supplier_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Net Bill Amount:</span>
                  <span className="font-mono font-bold text-primary">
                    PKR {Number(editingPurchase?.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">
                    Payment Status <span className="text-destructive">*</span>
                  </Label>
                  {canViewPaymentStatuses && (
                    <button
                      type="button"
                      onClick={() => {
                        resetStatusOptionForm();
                        setIsStatusCrudOpen(true);
                      }}
                      className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1"
                    >
                      <IconPlus className="h-3 w-3" />
                      Manage Statuses
                    </button>
                  )}
                </div>
                <Select
                  value={editPaymentStatus}
                  onValueChange={(val) => {
                    setEditPaymentStatus(val);
                    const st = paymentStatuses.find((s) => s.code.toLowerCase() === val.toLowerCase());
                    const behavior =
                      st?.accounting_type ||
                      (val.toLowerCase() === "paid"
                        ? "paid"
                        : val.toLowerCase() === "partial"
                        ? "partial"
                        : "unpaid");
                    if (behavior === "unpaid") {
                      setEditPaidAmount(0);
                      setEditPaidFromAccountId(0);
                    } else if (editPaidAmount <= 0) {
                      setEditPaidAmount(editNetTotal);
                    }
                  }}
                >
                  <SelectTrigger className="h-9 text-xs font-semibold">
                    <SelectValue placeholder="Choose One" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs text-muted-foreground">
                      Choose One
                    </SelectItem>
                    {(paymentStatuses.filter((s) => s.is_active).length > 0
                      ? paymentStatuses.filter((s) => s.is_active)
                      : [
                          { id: 1, name: "Paid", code: "paid", accounting_type: "paid" as const },
                          { id: 2, name: "Unpaid", code: "unpaid", accounting_type: "unpaid" as const },
                        ]
                    ).map((st) => (
                      <SelectItem key={st.code} value={st.code} className="text-xs">
                        {st.name} ({st.accounting_type === "paid" ? "Settled via Cash / Bank" : "Credit on Supplier Khata"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {editAccBehavior !== "unpaid" && editPaymentStatus !== "none" && (
                <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold flex items-center gap-1">
                      <IconBuildingBank className="h-3.5 w-3.5 text-primary" />
                      Paid From Account (Cash / Bank) <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={String(editPaidFromAccountId)}
                      onValueChange={(val) => setEditPaidFromAccountId(Number(val))}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Choose One" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0" className="text-xs text-muted-foreground">
                          Choose One
                        </SelectItem>
                        {paymentAccounts.map((acc) => (
                          <SelectItem key={acc.id} value={String(acc.id)} className="text-xs">
                            {acc.code} — {acc.name} (Bal: PKR {Number(acc.current_balance || 0).toLocaleString()})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        Paid Amount (PKR) <span className="text-destructive">*</span>
                      </Label>
                      <button
                        type="button"
                        onClick={() => setEditPaidAmount(editNetTotal)}
                        className="text-[10px] font-medium text-primary hover:underline"
                      >
                        Pay Full (PKR {editNetTotal.toLocaleString()})
                      </button>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      max={editNetTotal}
                      step="any"
                      value={editPaidAmount}
                      onChange={(e) => setEditPaidAmount(Number(e.target.value))}
                      className="h-8 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
                    <div>
                      <span className="text-[10px] text-emerald-600 font-semibold block">Paid via Account:</span>
                      <span className="font-mono font-bold text-emerald-600">
                        PKR {editEffectivePaidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-rose-600 font-semibold block">Pending on Khata:</span>
                      <span className="font-mono font-bold text-rose-600">
                        PKR {editBalanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Supplier Bill # <span className="text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <Input
                  value={editSupplierBillNo}
                  onChange={(e) => setEditSupplierBillNo(e.target.value)}
                  placeholder="e.g. INV-9021"
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Notes <span className="text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={2}
                  className="text-xs"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingPurchase(null)}
                disabled={isUpdatingPurchase}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdatingPurchase}>
                {isUpdatingPurchase ? "Updating..." : "Save & Sync Accounting"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dynamic Payment Statuses CRUD Modal */}
      <Dialog open={isStatusCrudOpen} onOpenChange={setIsStatusCrudOpen}>
        <DialogContent className="sm:max-w-[620px] max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconSettings className="h-5 w-5 text-primary" />
              Manage Payment Statuses
            </DialogTitle>
            <DialogDescription>
              Create, update, or remove dynamic payment statuses and configure their Double-Entry Accounting behavior.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {(canCreatePaymentStatus || (editingStatusOption && canEditPaymentStatus)) && (
              <form
                onSubmit={handleSaveStatusOption}
                className="p-3.5 rounded-lg border bg-muted/30 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    {editingStatusOption
                      ? `Edit Payment Status: ${editingStatusOption.name}`
                      : "Add New Payment Status"}
                  </span>
                  {editingStatusOption && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={resetStatusOptionForm}
                      className="h-6 text-xs"
                    >
                      Cancel Edit
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">
                      Status Label <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={statusName}
                      onChange={(e) => setStatusName(e.target.value)}
                      placeholder="e.g. Paid, Unpaid, Bank Paid"
                      className="h-8 text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1">
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
                        setStatusColor(val === "paid" ? "emerald" : val === "partial" ? "amber" : "rose");
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Choose One" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-xs text-muted-foreground">
                          Choose One
                        </SelectItem>
                        <SelectItem value="paid" className="text-xs">
                          Paid (Dr. Inventory / Cr. Cash or Bank)
                        </SelectItem>
                        <SelectItem value="unpaid" className="text-xs">
                          Unpaid (Dr. Inventory / Cr. Supplier Payable)
                        </SelectItem>
                        <SelectItem value="partial" className="text-xs">
                          Partial (Split Cash + Supplier Payable)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">
                      Description <span className="text-muted-foreground font-normal">(Optional)</span>
                    </Label>
                    <Input
                      value={statusDescription}
                      onChange={(e) => setStatusDescription(e.target.value)}
                      placeholder="Short note..."
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" size="sm" disabled={isSavingStatusOption} className="h-8 text-xs">
                    {isSavingStatusOption
                      ? "Saving..."
                      : editingStatusOption
                      ? "Update Payment Status"
                      : "Add Payment Status"}
                  </Button>
                </div>
              </form>
            )}

            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs">
                    <TableHead>Status Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Double-Entry Accounting Effect</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentStatuses.map((st) => (
                    <TableRow key={st.id} className="text-xs">
                      <TableCell className="font-semibold">
                        <Badge
                          variant="outline"
                          className={`capitalize text-xs ${
                            st.accounting_type === "paid"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : st.accounting_type === "partial"
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                              : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                          }`}
                        >
                          {st.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">{st.code}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {st.accounting_type === "paid"
                          ? "Dr. Inventory (1040) / Cr. Cash Drawer (1010)"
                          : st.accounting_type === "partial"
                          ? "Dr. Inventory (1040) / Cr. Cash & Payable"
                          : "Dr. Inventory (1040) / Cr. Accounts Payable (2010)"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canEditPaymentStatus && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditStatusOption(st)}
                              className="h-7 w-7"
                              title="Edit Payment Status"
                            >
                              <IconEdit className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {canDeletePaymentStatus && !st.is_system && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteStatusOption(st)}
                              className="h-7 w-7 text-destructive hover:bg-destructive/10"
                              title="Delete Payment Status"
                            >
                              <IconTrash className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsStatusCrudOpen(false)}>
              Close
            </Button>
          </DialogFooter>
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
                  <span className="text-muted-foreground">Supplier / Business Name:</span>
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
                      <TableHead className="text-right">Purchase Price</TableHead>
                      <TableHead className="text-right">Sale Price</TableHead>
                      <TableHead className="text-right">Tax</TableHead>
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
                        <TableCell className="text-right font-mono text-primary">
                          PKR {Number(item.retail_price || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {Number(item.tax_rate || 0) > 0
                            ? `${Number(item.tax_rate)}% (PKR ${Number(item.tax_amount || 0).toLocaleString()})`
                            : "-"}
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
                  <span className="text-emerald-600 font-semibold">
                    Paid {viewingPurchase.paid_from_account_name ? `(via ${viewingPurchase.paid_from_account_code} - ${viewingPurchase.paid_from_account_name})` : ""}:
                  </span>
                  <span className="font-mono text-emerald-600 font-semibold">PKR {Number(viewingPurchase.paid_amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-rose-600 font-semibold">Pending Balance Due to Supplier:</span>
                  <span className="font-mono text-rose-600 font-bold">PKR {Number(viewingPurchase.balance_due).toLocaleString()}</span>
                </div>
                {viewingPurchase.journal_entry_number && (
                  <div className="flex justify-between pt-1 border-t text-[11px] text-muted-foreground">
                    <span>Double-Entry Journal Voucher:</span>
                    <span className="font-mono font-semibold text-foreground">{viewingPurchase.journal_entry_number}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* INVOICE PAYMENT & PENDING DOUBLE-ENTRY REPORT MODAL */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="sm:max-w-[960px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <div>
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <IconReportAnalytics className="h-5 w-5 text-primary" />
                  Purchase Invoice Payment &amp; Pending Report (Double-Entry)
                </DialogTitle>
                <DialogDescription>
                  Complete breakdown of how much was paid against each purchase invoice, which Cash/Bank account was credited, and remaining pending balance on Supplier Khata.
                </DialogDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="h-8 gap-1.5 text-xs print:hidden"
              >
                <IconPrinter className="h-3.5 w-3.5" />
                Print Report
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Report Summary KPIs */}
            {(() => {
              const activePurchases = filteredPurchases.filter((p) => p.status !== "cancelled");
              const totInvoiced = activePurchases.reduce((s, p) => s + Number(p.total_amount || 0), 0);
              const totPaid = activePurchases.reduce((s, p) => s + Number(p.paid_amount || 0), 0);
              const totPending = activePurchases.reduce((s, p) => s + Number(p.balance_due || 0), 0);
              return (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-lg border bg-muted/30 p-3">
                      <span className="text-[11px] text-muted-foreground font-semibold uppercase">
                        Total Invoiced (Dr. Inventory 1040)
                      </span>
                      <div className="text-lg font-bold font-mono text-foreground mt-0.5">
                        PKR {totInvoiced.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        Across {activePurchases.length} purchase bills
                      </span>
                    </div>
                    <div className="rounded-lg border bg-emerald-500/5 border-emerald-500/20 p-3">
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase">
                        Total Paid (Cr. Cash / Bank Account)
                      </span>
                      <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                        PKR {totPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        Settled from selected accounts
                      </span>
                    </div>
                    <div className="rounded-lg border bg-rose-500/5 border-rose-500/20 p-3">
                      <span className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold uppercase">
                        Total Pending (Cr. Supplier Payable 2010)
                      </span>
                      <div className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5">
                        PKR {totPending.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        Remaining payable on Supplier Khata
                      </span>
                    </div>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow className="text-xs">
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Supplier</TableHead>
                          <TableHead>Paid From Account</TableHead>
                          <TableHead>Double-Entry JV</TableHead>
                          <TableHead className="text-right">Total Bill</TableHead>
                          <TableHead className="text-right">Paid Amount</TableHead>
                          <TableHead className="text-right">Pending Balance</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activePurchases.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="h-24 text-center text-xs text-muted-foreground">
                              No purchase invoices found for current filter.
                            </TableCell>
                          </TableRow>
                        ) : (
                          activePurchases.map((p) => {
                            const isPartial = Number(p.paid_amount) > 0 && Number(p.balance_due) > 0;
                            const isPaid = Number(p.balance_due) <= 0 && Number(p.paid_amount) > 0;
                            return (
                              <TableRow key={p.id} className="text-xs">
                                <TableCell className="font-mono font-semibold">
                                  <div>{p.invoice_number}</div>
                                  {p.supplier_bill_no && (
                                    <span className="text-[10px] text-muted-foreground">Ref: {p.supplier_bill_no}</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-muted-foreground">{p.purchase_date}</TableCell>
                                <TableCell className="font-medium">{p.supplier_name}</TableCell>
                                <TableCell>
                                  {p.paid_from_account_name && Number(p.paid_amount) > 0 ? (
                                    <Badge variant="outline" className="font-mono text-[10px]">
                                      {p.paid_from_account_code} - {p.paid_from_account_name}
                                    </Badge>
                                  ) : Number(p.paid_amount) > 0 ? (
                                    <span className="text-muted-foreground text-[11px]">Cash / Bank (Default)</span>
                                  ) : (
                                    <span className="text-muted-foreground text-[11px]">— (On Credit)</span>
                                  )}
                                </TableCell>
                                <TableCell className="font-mono text-[11px] text-primary">
                                  {p.journal_entry_number || "Auto-Posted"}
                                </TableCell>
                                <TableCell className="text-right font-mono font-semibold">
                                  PKR {Number(p.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell className="text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                                  PKR {Number(p.paid_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell className="text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                                  PKR {Number(p.balance_due).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] capitalize ${
                                      isPaid
                                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                        : isPartial
                                        ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                        : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                                    }`}
                                  >
                                    {isPaid ? "Paid" : isPartial ? "Partial" : "Unpaid"}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                        {activePurchases.length > 0 && (
                          <TableRow className="bg-muted/40 font-bold text-xs border-t-2">
                            <TableCell colSpan={5} className="text-right uppercase tracking-wider">
                              Grand Totals:
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              PKR {totInvoiced.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-right font-mono text-emerald-600 dark:text-emerald-400">
                              PKR {totPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-right font-mono text-rose-600 dark:text-rose-400">
                              PKR {totPending.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell />
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </>
              );
            })()}
          </div>

          <DialogFooter className="print:hidden">
            <Button type="button" variant="outline" onClick={() => setIsReportOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PURCHASE RETURN & DEBIT NOTE MODAL (ITEM-LEVEL PARTIAL OR FULL QTY RETURN) */}
      <Dialog
        open={Boolean(returningPurchase)}
        onOpenChange={(open) => {
          if (!open) {
            setReturningPurchase(null);
            setReturningPurchaseDetail(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[780px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconArrowBackUp className="h-5 w-5 text-amber-600" />
              Issue Debit Note &amp; Return Goods (Partial / Full Qty)
            </DialogTitle>
            <DialogDescription>
              Enter the exact quantity to return for bill{" "}
              <span className="font-mono font-semibold text-foreground">
                {returningPurchase?.invoice_number}
              </span>{" "}
              (e.g., 100 received → keep 80, return 20). Stock will be deducted from the receiving warehouse and the returned amount will be adjusted in Double-Entry Accounting.
            </DialogDescription>
          </DialogHeader>

          {(() => {
            const detailItems = returningPurchaseDetail?.items || [];
            const computedLines = detailItems.map((it) => {
              const purchasedQty = Number(it.quantity || 0);
              const alreadyRet = Number(it.returned_quantity || 0);
              const maxReturnable = Math.max(0, purchasedQty - alreadyRet);
              const rawInputQty = Number(returnItemQuantities[it.id] || 0);
              const retQty = Math.min(Math.max(0, rawInputQty), maxReturnable);
              const keptQty = Math.max(0, maxReturnable - retQty);
              const unitCost = Number(it.unit_cost || 0);
              const retAmount = Math.round(retQty * unitCost * 100) / 100;
              return {
                ...it,
                purchasedQty,
                alreadyRet,
                maxReturnable,
                retQty,
                keptQty,
                unitCost,
                retAmount,
              };
            });

            const totalReturnQty = computedLines.reduce((acc, l) => acc + l.retQty, 0);
            const totalKeptQty = computedLines.reduce((acc, l) => acc + l.keptQty, 0);
            const totalReturnAmount = computedLines.reduce((acc, l) => acc + l.retAmount, 0);
            const currentBillBalanceDue = Number(returningPurchase?.balance_due || 0);
            const payableReduction = Math.min(currentBillBalanceDue, totalReturnAmount);

            return (
              <div className="space-y-4 py-2">
                {/* Top Summary Banner with Warehouse & Supplier */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-lg border bg-muted/40 p-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block">Supplier / Vendor:</span>
                    <span className="font-semibold text-foreground text-sm">
                      {returningPurchase?.supplier_name || "Supplier"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Stock Warehouse / Godown:</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400 text-sm flex items-center gap-1">
                      <IconBuildingWarehouse className="h-4 w-4" />
                      {returningPurchase?.branch_name || "Main Warehouse"}
                    </span>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-muted-foreground block">Original Bill Total:</span>
                    <span className="font-mono font-bold text-foreground text-sm">
                      PKR {Number(returningPurchase?.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    {currentBillBalanceDue > 0 && (
                      <span className="block text-[10px] font-mono text-rose-600">
                        Unpaid Khata Due: PKR {currentBillBalanceDue.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Line Items Quantity Return Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Select Quantities to Return from Warehouse
                    </Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-[11px]"
                        onClick={() => {
                          const allMax: Record<number, number> = {};
                          detailItems.forEach((it) => {
                            allMax[it.id] = Math.max(0, Number(it.quantity) - Number(it.returned_quantity || 0));
                          });
                          setReturnItemQuantities(allMax);
                        }}
                      >
                        Return All Remaining
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[11px]"
                        onClick={() => {
                          const allZero: Record<number, number> = {};
                          detailItems.forEach((it) => {
                            allZero[it.id] = 0;
                          });
                          setReturnItemQuantities(allZero);
                        }}
                      >
                        Clear Qty
                      </Button>
                    </div>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow className="text-xs">
                          <TableHead>Product / Item</TableHead>
                          <TableHead className="text-center">Purchased</TableHead>
                          <TableHead className="text-center">Return Qty *</TableHead>
                          <TableHead className="text-center">Kept in Warehouse</TableHead>
                          <TableHead className="text-right">Purchase Rate</TableHead>
                          <TableHead className="text-right">Return Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isReturnDetailLoading ? (
                          <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center text-xs text-muted-foreground">
                              <IconRefresh className="h-5 w-5 animate-spin mx-auto mb-1 text-primary" />
                              Loading invoice items...
                            </TableCell>
                          </TableRow>
                        ) : computedLines.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="h-20 text-center text-xs text-muted-foreground">
                              No items found on this purchase bill.
                            </TableCell>
                          </TableRow>
                        ) : (
                          computedLines.map((line) => (
                            <TableRow key={line.id} className="text-xs">
                              <TableCell>
                                <div className="font-semibold text-foreground">{line.product_name}</div>
                                <div className="text-[10px] font-mono text-muted-foreground">
                                  {line.product_sku} • {line.unit_name}
                                  {line.alreadyRet > 0 && (
                                    <span className="ml-1.5 text-amber-600 font-semibold">
                                      (Already Returned: {line.alreadyRet})
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-center font-mono font-semibold">
                                {line.maxReturnable} {line.unit_name}
                              </TableCell>
                              <TableCell className="text-center w-[130px]">
                                <Input
                                  type="number"
                                  min="0"
                                  max={line.maxReturnable}
                                  step="any"
                                  disabled={line.maxReturnable <= 0}
                                  value={returnItemQuantities[line.id] ?? 0}
                                  onChange={(e) => {
                                    const val = e.target.value === "" ? 0 : Number(e.target.value);
                                    setReturnItemQuantities((prev) => ({
                                      ...prev,
                                      [line.id]: Math.min(Math.max(0, val), line.maxReturnable),
                                    }));
                                  }}
                                  className="h-8 text-xs text-center font-mono font-bold border-amber-500/50"
                                />
                              </TableCell>
                              <TableCell className="text-center font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                                {line.keptQty} {line.unit_name}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                PKR {line.unitCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </TableCell>
                              <TableCell className="text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                                PKR {line.retAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Live Accounting & Stock Calculation Summary Box */}
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-2 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
                        Returning Qty
                      </span>
                      <span className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400">
                        {totalReturnQty} Units
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
                        Kept in Warehouse
                      </span>
                      <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {totalKeptQty} Units
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
                        Return Debit Note Amount
                      </span>
                      <span className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400">
                        PKR {totalReturnAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
                        Remaining Bill Net Value
                      </span>
                      <span className="text-sm font-bold font-mono text-foreground">
                        PKR {Math.max(0, Number(returningPurchase?.total_amount || 0) - Number(returningPurchase?.returned_amount || 0) - totalReturnAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-amber-500/20 text-[11px] text-muted-foreground flex flex-wrap items-center justify-between gap-2">
                    <span>
                      Warehouse Deduction:{" "}
                      <strong className="text-foreground">
                        -{totalReturnQty} units from {returningPurchase?.branch_name || "Main Warehouse"}
                      </strong>
                    </span>
                    <span>
                      Double-Entry:{" "}
                      <strong className="text-foreground">
                        Dr. {returnRefundMethod === "credit" ? "Supplier Payable (2010)" : "Cash / Bank Account"} PKR {totalReturnAmount.toLocaleString()} / Cr. Inventory (1040) PKR {totalReturnAmount.toLocaleString()}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Settlement / Refund Treatment & Reason */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Return Amount Accounting Treatment <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={returnRefundMethod || "none"}
                      onValueChange={(val) => setReturnRefundMethod(val === "none" ? "" : val)}
                    >
                      <SelectTrigger className="text-xs h-9">
                        <SelectValue placeholder="Choose One" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-xs text-muted-foreground">
                          Choose One
                        </SelectItem>
                        <SelectItem value="credit" className="text-xs">
                          Adjust Supplier Khata Payable (Reduce Balance / Credit Note)
                        </SelectItem>
                        <SelectItem value="cash" className="text-xs">
                          Cash Refund Received (Dr. Cash / Cr. Inventory)
                        </SelectItem>
                        <SelectItem value="bank" className="text-xs">
                          Bank Refund Received (Dr. Bank Account / Cr. Inventory)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {payableReduction > 0 && returnRefundMethod === "credit" && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        Supplier Khata due will reduce by PKR {payableReduction.toLocaleString()}.
                      </p>
                    )}
                  </div>

                  {returnRefundMethod !== "credit" && returnRefundMethod !== "" && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">
                        Refund Received Into Account (Cash / Bank)
                      </Label>
                      <Select
                        value={String(returnRefundAccountId)}
                        onValueChange={(val) => setReturnRefundAccountId(Number(val))}
                      >
                        <SelectTrigger className="text-xs h-9">
                          <SelectValue placeholder="Choose One" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0" className="text-xs text-muted-foreground">
                            Choose One (Default Cash/Bank)
                          </SelectItem>
                          {paymentAccounts.map((acc) => (
                            <SelectItem key={acc.id} value={String(acc.id)} className="text-xs">
                              {acc.code} — {acc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className={returnRefundMethod === "credit" ? "space-y-1.5" : "sm:col-span-2 space-y-1.5"}>
                    <Label className="text-xs font-semibold">Return Reason</Label>
                    <Input
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      placeholder="e.g. 20 units damaged / excess stock returned to supplier"
                      className="text-xs h-9"
                    />
                  </div>
                </div>
              </div>
            );
          })()}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReturningPurchase(null);
                setReturningPurchaseDetail(null);
              }}
              disabled={isSubmittingReturn}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmReturn}
              disabled={isSubmittingReturn || isReturnDetailLoading}
              className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isSubmittingReturn ? "Posting Debit Note..." : "Confirm Return & Issue Debit Note"}
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
