"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  IconArrowBackUp,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconBuildingWarehouse,
  IconTruckDelivery,
  IconReceipt,
  IconEye,
  IconX,
  IconBuildingBank,
  IconPackage,
  IconFileInvoice,
  IconLock,
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
  inventoryService,
  type PurchaseReturnRecord,
  type PurchaseItem,
  type PurchaseDetail,
  type LiveInventoryItem,
} from "@/services/inventory.service";
import { branchService, type BranchItem } from "@/services/branch.service";
import { partyService, type SupplierItem } from "@/services/party.service";
import { productService, type ProductListItem } from "@/services/product.service";
import { accountingService, type AccountItem } from "@/services/accounting.service";
import { useAuth } from "@/context/auth-context";
import { useAppEventListener } from "@/lib/events";

interface ReturnFormRow {
  purchase_item_id: number | null;
  product_id: number;
  product_name: string;
  sku: string;
  unit_name: string;
  purchased_qty: number | null;
  quantity: number;
  conversion_factor: number;
  unit_cost: number;
}

export default function PurchaseReturnsPage() {
  const { user, tenant } = useAuth();
  const userRole = (tenant?.role_name || "").toLowerCase();
  const userPerms = tenant?.permissions || [];
  const isOwnerOrAdmin =
    Boolean(user?.is_superadmin) ||
    userRole === "admin" ||
    userRole === "owner" ||
    userPerms.includes("*");

  const canView =
    isOwnerOrAdmin ||
    userPerms.includes("purchase_returns:view") ||
    userPerms.includes("purchase_returns:create") ||
    userPerms.includes("purchase_returns:edit") ||
    userPerms.includes("purchase_returns:manage") ||
    userPerms.includes("purchases:view") ||
    userPerms.includes("purchases:create");

  const canCreate =
    isOwnerOrAdmin ||
    userPerms.includes("purchase_returns:create") ||
    userPerms.includes("purchase_returns:manage") ||
    userPerms.includes("purchases:create");

  const [loading, setLoading] = useState(true);
  const [returnsList, setReturnsList] = useState<PurchaseReturnRecord[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [liveInventory, setLiveInventory] = useState<LiveInventoryItem[]>([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("all");
  const [selectedSupplier, setSelectedSupplier] = useState("all");

  // View Return Detail Modal
  const [viewingReturn, setViewingReturn] = useState<PurchaseReturnRecord | null>(null);

  // Create Return Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [returnMode, setReturnMode] = useState<"standalone" | "invoice">("standalone");
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<number>(0);
  const [warehouseId, setWarehouseId] = useState<number>(0);
  const [supplierId, setSupplierId] = useState<number>(0);
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split("T")[0]);
  const [refundMethod, setRefundMethod] = useState("credit");
  const [refundAccountId, setRefundAccountId] = useState<number>(0);
  const [reason, setReason] = useState("Damaged / Excess Goods Returned to Supplier");
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<ReturnFormRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [
        returnsRes,
        branchesRes,
        suppliersRes,
        productsRes,
        purchasesRes,
        invRes,
        accountsRes,
      ] = await Promise.all([
        inventoryService.listPurchaseReturns().catch(() => []),
        branchService.listBranches().catch(() => ({ branches: [] })),
        partyService.listSuppliers().catch(() => []),
        productService.listProducts().catch(() => ({ items: [] })),
        inventoryService.listPurchases().catch(() => []),
        inventoryService.listLiveInventory().catch(() => []),
        accountingService.listAccounts({ active_only: true }).catch(() => []),
      ]);

      setReturnsList(returnsRes || []);
      setBranches(branchesRes?.branches || []);
      setSuppliers(suppliersRes || []);
      setProducts(productsRes?.items || []);
      setPurchases(purchasesRes || []);
      setLiveInventory(invRes || []);
      setAccounts(accountsRes || []);
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to load purchase returns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useAppEventListener(["purchases:changed", "inventory:changed"], () => {
    loadData();
  });

  const paymentAccounts = useMemo(() => {
    return accounts
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
  }, [accounts]);

  const filteredReturns = useMemo(() => {
    return returnsList.filter((r) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        r.return_number.toLowerCase().includes(q) ||
        (r.purchase_invoice_number && r.purchase_invoice_number.toLowerCase().includes(q)) ||
        (r.supplier_name && r.supplier_name.toLowerCase().includes(q)) ||
        (r.branch_name && r.branch_name.toLowerCase().includes(q)) ||
        (r.reason && r.reason.toLowerCase().includes(q));
      const matchesWarehouse =
        selectedWarehouse === "all" || String(r.branch_id) === selectedWarehouse;
      const matchesSupplier =
        selectedSupplier === "all" || String(r.supplier_id) === selectedSupplier;
      return matchesSearch && matchesWarehouse && matchesSupplier;
    });
  }, [returnsList, search, selectedWarehouse, selectedSupplier]);

  // Helper to get live stock in selected warehouse for a product
  const getWarehouseStock = (prodId: number, bId: number): number => {
    if (!prodId || !bId) return 0;
    const found = liveInventory.find(
      (i) => i.product_id === prodId && i.branch_id === bId
    );
    return found ? Number(found.current_stock || 0) : 0;
  };

  const openCreateModal = () => {
    setReturnMode("standalone");
    setSelectedPurchaseId(0);
    const defaultWh = branches.length > 0 ? branches[0].id : 0;
    const defaultSup = suppliers.length > 0 ? suppliers[0].id : 0;
    setWarehouseId(defaultWh);
    setSupplierId(defaultSup);
    setReturnDate(new Date().toISOString().split("T")[0]);
    setRefundMethod("credit");
    setRefundAccountId(0);
    setReason("Damaged / Excess Goods Returned to Supplier");
    setNotes("");

    if (products.length > 0) {
      const p = products[0];
      setRows([
        {
          purchase_item_id: null,
          product_id: p.id,
          product_name: p.name,
          sku: p.sku,
          unit_name: p.base_unit || "Piece",
          purchased_qty: null,
          quantity: 1,
          conversion_factor: 1,
          unit_cost: Number(p.cost_price || 1) || 1,
        },
      ]);
    } else {
      setRows([]);
    }
    setIsCreateOpen(true);
  };

  const handleSelectInvoiceForReturn = async (purId: number) => {
    setSelectedPurchaseId(purId);
    if (!purId) {
      return;
    }
    try {
      const detail: PurchaseDetail = await inventoryService.getPurchaseDetail(purId);
      setWarehouseId(detail.branch_id);
      setSupplierId(detail.supplier_id);
      const mappedRows: ReturnFormRow[] = (detail.items || []).map((it) => {
        const maxRem = Math.max(0, Number(it.quantity) - Number(it.returned_quantity || 0));
        return {
          purchase_item_id: it.id,
          product_id: it.product_id,
          product_name: it.product_name || "Product",
          sku: it.product_sku || "",
          unit_name: it.unit_name || "Piece",
          purchased_qty: maxRem,
          quantity: maxRem,
          conversion_factor: Number(it.conversion_factor || 1),
          unit_cost: Number(it.unit_cost || 0),
        };
      });
      setRows(mappedRows);
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to load purchase bill items");
    }
  };

  const addProductRow = () => {
    if (products.length === 0) {
      toast.error("Please add products first.");
      return;
    }
    const p = products[0];
    setRows((prev) => [
      ...prev,
      {
        purchase_item_id: null,
        product_id: p.id,
        product_name: p.name,
        sku: p.sku,
        unit_name: p.base_unit || "Piece",
        purchased_qty: null,
        quantity: 1,
        conversion_factor: 1,
        unit_cost: Number(p.cost_price || 1) || 1,
      },
    ]);
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, prodId: number) => {
    const p = products.find((x) => x.id === prodId);
    const copy = [...rows];
    if (!p) {
      copy[index] = {
        ...copy[index],
        product_id: 0,
        product_name: "",
        sku: "",
      };
      setRows(copy);
      return;
    }
    copy[index] = {
      ...copy[index],
      purchase_item_id: null,
      product_id: p.id,
      product_name: p.name,
      sku: p.sku,
      unit_name: p.base_unit || "Piece",
      purchased_qty: null,
      unit_cost: Number(p.cost_price || 1) || 1,
    };
    setRows(copy);
  };

  const totalReturnQty = rows.reduce((acc, r) => acc + (Number(r.quantity) || 0), 0);
  const totalReturnAmount = rows.reduce(
    (acc, r) => acc + Math.round((Number(r.quantity) || 0) * (Number(r.unit_cost) || 0) * 100) / 100,
    0
  );

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseId) {
      toast.error("Please select the Warehouse / Branch from which stock is being returned");
      return;
    }
    if (!supplierId) {
      toast.error("Please select the Supplier / Vendor");
      return;
    }
    const validItems = rows.filter((r) => r.product_id > 0 && Number(r.quantity) > 0);
    if (validItems.length === 0) {
      toast.error("Please enter a return quantity greater than 0 for at least one product");
      return;
    }
    if (!refundMethod || refundMethod === "none") {
      toast.error("Please select the Accounting / Refund treatment");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await inventoryService.createStandalonePurchaseReturn({
        branch_id: warehouseId,
        supplier_id: supplierId,
        purchase_id: returnMode === "invoice" && selectedPurchaseId > 0 ? selectedPurchaseId : null,
        return_date: returnDate,
        refund_method: refundMethod,
        refund_account_id:
          refundMethod !== "credit" && refundAccountId > 0 ? refundAccountId : null,
        reason: reason.trim() || "Goods Returned to Supplier",
        notes: notes.trim() || null,
        items: validItems.map((r) => ({
          purchase_item_id: r.purchase_item_id,
          product_id: r.product_id,
          unit_name: r.unit_name,
          quantity: Number(r.quantity),
          conversion_factor: Number(r.conversion_factor || 1),
          unit_cost: Number(r.unit_cost || 0),
        })),
      });

      toast.success(
        `Purchase Return ${res.return_number} posted! Deducted ${res.total_qty} Qty (PKR ${res.total_amount.toLocaleString()}) from Warehouse '${res.branch_name}'.`
      );
      setIsCreateOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to post purchase return");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Summary metrics
  const sumReturnCount = returnsList.length;
  const sumReturnedQty = returnsList.reduce((acc, r) => acc + Number(r.total_qty || 0), 0);
  const sumReturnedAmount = returnsList.reduce((acc, r) => acc + Number(r.total_amount || 0), 0);
  const sumCreditAdjusted = returnsList
    .filter((r) => r.refund_method === "credit")
    .reduce((acc, r) => acc + Number(r.total_amount || 0), 0);

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <div className="p-3 bg-destructive/10 text-destructive rounded-full">
          <IconLock className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold">Access Restricted</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          You do not have the required permissions (`purchase_returns:view`) to view or manage Purchase Returns &amp; Debit Notes.
        </p>
        <Button asChild variant="outline">
          <Link href="/purchases">
            <IconArrowBackUp className="h-4 w-4 mr-2" /> Return to Purchases &amp; GRN
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
            <h1 className="text-2xl font-bold tracking-tight">
              Purchase Returns &amp; Debit Notes
            </h1>
            <Badge variant="outline" className="text-xs font-mono">
              {returnsList.length} Returns
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Return any quantity of any product from a specific Warehouse / Godown to suppliers and auto-adjust Double-Entry Accounting.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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
          <Button asChild variant="outline" size="sm" className="h-9 gap-1.5">
            <Link href="/purchases">
              <IconReceipt className="h-4 w-4" />
              Purchases &amp; GRN
            </Link>
          </Button>
          {canCreate && (
            <Button size="sm" onClick={openCreateModal} className="h-9 gap-1.5">
              <IconPlus className="h-4 w-4" />
              New Purchase Return
            </Button>
          )}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Debit Notes</CardTitle>
            <IconArrowBackUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sumReturnCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Posted purchase return vouchers</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Qty Returned</CardTitle>
            <IconPackage className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {sumReturnedQty.toLocaleString()} Units
            </div>
            <p className="text-xs text-muted-foreground mt-1">Deducted from warehouse stock</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Return Amount</CardTitle>
            <IconFileInvoice className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              PKR {sumReturnedAmount.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Cr. Merchandise Inventory (1040)</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Supplier Khata Reduced</CardTitle>
            <IconTruckDelivery className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              PKR {sumCreditAdjusted.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Dr. Accounts Payable (2010)</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Table Card */}
      <Card className="border border-border/70 overflow-hidden shadow-xs">
        <div className="p-3.5 border-b bg-card/60 flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-72 md:w-80">
              <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search PRN #, invoice #, supplier, warehouse..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>

            <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
              <SelectTrigger className="w-48 h-9 text-xs">
                <SelectValue placeholder="All Warehouses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Warehouses / Godowns</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    Warehouse: {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
              <SelectTrigger className="w-44 h-9 text-xs">
                <SelectValue placeholder="All Suppliers" />
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
          </div>

          <div className="text-xs text-muted-foreground font-medium">
            {filteredReturns.length} Return Vouchers Found
          </div>
        </div>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[140px]">Return / PRN #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Linked Bill</TableHead>
                <TableHead>Supplier / Vendor</TableHead>
                <TableHead>Source Warehouse</TableHead>
                <TableHead className="text-center">Returned Qty</TableHead>
                <TableHead className="text-right">Return Amount</TableHead>
                <TableHead>Accounting Treatment</TableHead>
                <TableHead>Double-Entry JV</TableHead>
                <TableHead className="text-right">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <IconRefresh className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-xs">Loading purchase returns...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredReturns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-36 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <IconArrowBackUp className="h-8 w-8 text-muted-foreground/40" />
                      <p className="font-medium text-foreground text-sm">
                        No purchase returns recorded yet
                      </p>
                      <p className="text-xs">
                        Click &quot;New Purchase Return&quot; above to return any product quantity from your warehouse to a supplier.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredReturns.map((r) => (
                  <TableRow key={r.id} className="hover:bg-muted/40 text-xs">
                    <TableCell className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      {r.return_number}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono">
                      {r.return_date}
                    </TableCell>
                    <TableCell className="font-mono">
                      {r.purchase_invoice_number ? (
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {r.purchase_invoice_number}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">Direct Product Return</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {r.supplier_name || "Supplier"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <IconBuildingWarehouse className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        <span className="font-medium">{r.branch_name || "Main Warehouse"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        -{r.total_qty} Qty
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                      PKR {Number(r.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      {r.refund_method === "credit" ? (
                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                          Reduced Supplier Khata (2010)
                        </Badge>
                      ) : (
                        <div>
                          <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20 capitalize">
                            {r.refund_method} Refund
                          </Badge>
                          {r.refund_account_name && (
                            <span className="block text-[10px] font-mono text-muted-foreground">
                              {r.refund_account_code} - {r.refund_account_name}
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-primary">
                      {r.journal_entry_number || "Auto-Posted"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setViewingReturn(r)}
                        title="View Returned Items & Debit Note"
                      >
                        <IconEye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* CREATE STANDALONE OR INVOICE-LINKED PURCHASE RETURN MODAL */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[920px] max-h-[92vh] overflow-y-auto">
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <IconArrowBackUp className="h-5 w-5 text-amber-600" />
                Create Purchase Return / Debit Note
              </DialogTitle>
              <DialogDescription>
                Return any product and any quantity from your Warehouse / Godown to a supplier, or select a specific Purchase Bill to return partial quantities (e.g., 100 received → keep 80, return 20).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              {/* Return Mode Selector */}
              <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-lg border bg-muted/30">
                <span className="text-xs font-semibold text-muted-foreground mr-2">
                  Return Mode:
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant={returnMode === "standalone" ? "default" : "outline"}
                  className="h-8 text-xs"
                  onClick={() => {
                    setReturnMode("standalone");
                    setSelectedPurchaseId(0);
                  }}
                >
                  Direct Product Return (Any Product &amp; Any Qty)
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={returnMode === "invoice" ? "default" : "outline"}
                  className="h-8 text-xs"
                  onClick={() => setReturnMode("invoice")}
                >
                  Return Against Purchase Invoice (GRN)
                </Button>
              </div>

              {/* Top Controls: Warehouse, Supplier, Optional Invoice, Date */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-muted/40 p-3 rounded-lg border">
                {returnMode === "invoice" && (
                  <div className="space-y-1 sm:col-span-4">
                    <Label className="text-xs font-semibold">
                      Select Purchase Invoice (GRN) <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={String(selectedPurchaseId)}
                      onValueChange={(val) => handleSelectInvoiceForReturn(Number(val))}
                    >
                      <SelectTrigger className="h-9 text-xs font-mono">
                        <SelectValue placeholder="Choose One" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0" className="text-xs text-muted-foreground">
                          Choose One
                        </SelectItem>
                        {purchases
                          .filter((p) => p.status !== "returned" && p.status !== "cancelled")
                          .map((p) => (
                            <SelectItem key={p.id} value={String(p.id)} className="text-xs">
                              {p.invoice_number} — {p.supplier_name} | Warehouse: {p.branch_name} | Qty: {p.total_qty || p.items_count} | Total: PKR {Number(p.total_amount).toLocaleString()}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs font-semibold flex items-center gap-1">
                    <IconBuildingWarehouse className="h-3.5 w-3.5 text-blue-600" />
                    Source Warehouse / Godown (Stock Outward) <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={String(warehouseId)}
                    onValueChange={(val) => setWarehouseId(Number(val))}
                    disabled={returnMode === "invoice" && selectedPurchaseId > 0}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Choose One" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0" className="text-xs text-muted-foreground">
                        Choose One
                      </SelectItem>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={String(b.id)} className="text-xs">
                          Warehouse: {b.name} ({b.city})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">
                    Supplier / Vendor <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={String(supplierId)}
                    onValueChange={(val) => setSupplierId(Number(val))}
                    disabled={returnMode === "invoice" && selectedPurchaseId > 0}
                  >
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
                    Return Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="h-8 text-xs"
                    required
                  />
                </div>
              </div>

              {/* Product Line Items to Return */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Products &amp; Quantities Being Returned
                  </Label>
                  {returnMode === "standalone" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addProductRow}
                      className="h-7 text-xs gap-1"
                    >
                      <IconPlus className="h-3.5 w-3.5" />
                      Add Product Row
                    </Button>
                  )}
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow className="text-xs">
                        <TableHead>Product / Item *</TableHead>
                        <TableHead className="w-[140px] text-center">
                          {returnMode === "invoice" ? "Purchased Qty" : "Warehouse Stock"}
                        </TableHead>
                        <TableHead className="w-[130px] text-center">Return Qty *</TableHead>
                        {returnMode === "invoice" && (
                          <TableHead className="w-[120px] text-center">Kept Qty</TableHead>
                        )}
                        <TableHead className="w-[140px] text-right">Return Rate (PKR) *</TableHead>
                        <TableHead className="w-[140px] text-right">Return Amount</TableHead>
                        <TableHead className="w-[50px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={returnMode === "invoice" ? 7 : 6}
                            className="h-20 text-center text-xs text-muted-foreground"
                          >
                            {returnMode === "invoice"
                              ? "Select a Purchase Invoice above to load its items."
                              : "Click 'Add Product Row' to add products to return."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        rows.map((r, idx) => {
                          const whStock = getWarehouseStock(r.product_id, warehouseId);
                          const lineTotal =
                            Math.round((Number(r.quantity) || 0) * (Number(r.unit_cost) || 0) * 100) / 100;
                          const keptInWh =
                            r.purchased_qty !== null
                              ? Math.max(0, r.purchased_qty - (Number(r.quantity) || 0))
                              : Math.max(0, whStock - (Number(r.quantity) || 0));

                          return (
                            <TableRow key={idx} className="text-xs">
                              <TableCell>
                                {returnMode === "invoice" ? (
                                  <div>
                                    <span className="font-semibold">{r.product_name}</span>
                                    <span className="block text-[10px] font-mono text-muted-foreground">
                                      {r.sku} • {r.unit_name}
                                    </span>
                                  </div>
                                ) : (
                                  <Select
                                    value={String(r.product_id)}
                                    onValueChange={(val) => handleProductChange(idx, Number(val))}
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
                                )}
                              </TableCell>

                              <TableCell className="text-center font-mono">
                                {returnMode === "invoice" ? (
                                  <span className="font-semibold">
                                    {r.purchased_qty ?? 0} {r.unit_name}
                                  </span>
                                ) : (
                                  <Badge variant="outline" className="font-mono text-[10px]">
                                    {whStock} {r.unit_name} in Warehouse
                                  </Badge>
                                )}
                              </TableCell>

                              <TableCell className="text-center">
                                <Input
                                  type="number"
                                  min="0"
                                  max={r.purchased_qty !== null ? r.purchased_qty : undefined}
                                  step="any"
                                  value={r.quantity}
                                  onChange={(e) => {
                                    const raw = e.target.value === "" ? 0 : Number(e.target.value);
                                    const capped =
                                      r.purchased_qty !== null
                                        ? Math.min(Math.max(0, raw), r.purchased_qty)
                                        : Math.max(0, raw);
                                    const copy = [...rows];
                                    copy[idx] = { ...copy[idx], quantity: capped };
                                    setRows(copy);
                                  }}
                                  className="h-8 text-xs text-center font-mono font-bold border-amber-500/50"
                                />
                              </TableCell>

                              {returnMode === "invoice" && (
                                <TableCell className="text-center font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                                  {keptInWh} {r.unit_name}
                                </TableCell>
                              )}

                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={r.unit_cost}
                                  onChange={(e) => {
                                    const copy = [...rows];
                                    copy[idx] = {
                                      ...copy[idx],
                                      unit_cost: e.target.value === "" ? 0 : Number(e.target.value),
                                    };
                                    setRows(copy);
                                  }}
                                  className="h-8 text-xs text-right font-mono"
                                />
                              </TableCell>

                              <TableCell className="text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                                PKR {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </TableCell>

                              <TableCell className="text-center">
                                {rows.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive"
                                    onClick={() => removeRow(idx)}
                                  >
                                    <IconX className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Settlement & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Return Reason <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g. 20 units damaged / faulty batch returned to vendor"
                      className="h-8 text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Additional Notes <span className="text-muted-foreground font-normal">(Optional)</span>
                    </Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Gate pass #, driver name, or debit note reference..."
                      rows={2}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-3 bg-muted/30 p-3.5 rounded-lg border text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Returning Quantity:</span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      {totalReturnQty} Units
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2 text-sm font-bold">
                    <span>Total Return Debit Note Amount:</span>
                    <span className="font-mono text-rose-600 dark:text-rose-400">
                      PKR {totalReturnAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <Label className="text-xs font-semibold">
                      Accounting &amp; Refund Treatment <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={refundMethod || "none"}
                      onValueChange={(val) => setRefundMethod(val === "none" ? "" : val)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Choose One" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-xs text-muted-foreground">
                          Choose One
                        </SelectItem>
                        <SelectItem value="credit" className="text-xs">
                          Reduce Supplier Khata Payable (Dr. Accounts Payable 2010)
                        </SelectItem>
                        <SelectItem value="cash" className="text-xs">
                          Cash Refund Received (Dr. Cash Drawer 1010)
                        </SelectItem>
                        <SelectItem value="bank" className="text-xs">
                          Bank Refund Received (Dr. Bank Account 1020)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {refundMethod !== "credit" && refundMethod !== "" && (
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold flex items-center gap-1">
                        <IconBuildingBank className="h-3.5 w-3.5 text-primary" />
                        Refund Received Into Account
                      </Label>
                      <Select
                        value={String(refundAccountId)}
                        onValueChange={(val) => setRefundAccountId(Number(val))}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Choose One" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0" className="text-xs text-muted-foreground">
                            Choose One (Default Cash / Bank)
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

                  <div className="rounded bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 text-[11px] text-amber-700 dark:text-amber-300">
                    Double-Entry: Dr.{" "}
                    {refundMethod === "credit" ? "Accounts Payable (2010)" : "Cash / Bank Account"}{" "}
                    PKR {totalReturnAmount.toLocaleString()} → Cr. Merchandise Inventory (1040) PKR{" "}
                    {totalReturnAmount.toLocaleString()}
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
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {isSubmitting ? "Posting Debit Note..." : "Post Purchase Return & Debit Note"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* VIEW PURCHASE RETURN DETAIL MODAL */}
      <Dialog
        open={Boolean(viewingReturn)}
        onOpenChange={(open) => !open && setViewingReturn(null)}
      >
        <DialogContent className="sm:max-w-[680px]">
          {viewingReturn && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="font-mono text-lg font-bold text-amber-600 dark:text-amber-400">
                    {viewingReturn.return_number}
                  </DialogTitle>
                  <Badge variant="outline" className="font-mono text-xs">
                    {viewingReturn.journal_entry_number || "Double-Entry Posted"}
                  </Badge>
                </div>
                <DialogDescription>
                  Purchase Return &amp; Supplier Debit Note Breakdown
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-lg border bg-muted/40 text-xs">
                <div>
                  <span className="text-muted-foreground block">Supplier / Vendor:</span>
                  <span className="font-semibold text-sm">{viewingReturn.supplier_name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Source Warehouse:</span>
                  <span className="font-semibold text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <IconBuildingWarehouse className="h-3.5 w-3.5" />
                    {viewingReturn.branch_name}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Return Date &amp; Bill:</span>
                  <span className="font-mono font-semibold">{viewingReturn.return_date}</span>
                  {viewingReturn.purchase_invoice_number && (
                    <span className="block font-mono text-[11px] text-muted-foreground">
                      Bill: {viewingReturn.purchase_invoice_number}
                    </span>
                  )}
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="text-xs">
                      <TableHead>Product</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-center">Returned Qty</TableHead>
                      <TableHead className="text-right">Unit Rate</TableHead>
                      <TableHead className="text-right">Return Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(viewingReturn.items || []).map((it) => (
                      <TableRow key={it.id} className="text-xs">
                        <TableCell>
                          <div className="font-medium">{it.product_name}</div>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {it.product_sku}
                          </span>
                        </TableCell>
                        <TableCell>{it.unit_name}</TableCell>
                        <TableCell className="text-center font-mono font-bold text-amber-600">
                          -{it.quantity}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          PKR {Number(it.unit_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold">
                          PKR {Number(it.total_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 text-xs">
                <div>
                  <span className="text-muted-foreground">Reason: </span>
                  <span className="font-medium">{viewingReturn.reason || "—"}</span>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground mr-2">Total Debit Note Amount:</span>
                  <span className="font-mono text-sm font-bold text-rose-600 dark:text-rose-400">
                    PKR {Number(viewingReturn.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setViewingReturn(null)}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
