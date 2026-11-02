"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  IconSearch,
  IconPlus,
  IconArrowsExchange,
  IconPackage,
  IconAlertTriangle,
  IconRefresh,
  IconBuildingStore,
  IconHistory,
  IconAdjustments,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import { useAppEventListener } from "@/lib/events";
import {
  inventoryService,
  type LiveInventoryItem,
  type StockMovementItem,
} from "@/services/inventory.service";
import { branchService, type BranchItem } from "@/services/branch.service";
import { productService, type CategoryItem, type BrandItem } from "@/services/product.service";

export default function InventoryPage() {
  const { user, tenant } = useAuth();
  const userPerms = tenant?.permissions || [];
  const userRole = tenant?.role_name || "";
  const isOwnerOrAdmin =
    user?.is_superadmin ||
    userRole.toLowerCase() === "admin" ||
    userRole.toLowerCase() === "owner" ||
    userPerms.includes("*");

  const canAdjust = isOwnerOrAdmin || userPerms.includes("inventory:adjust");
  const canTransfer = isOwnerOrAdmin || userPerms.includes("stock_transfers:create");

  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<LiveInventoryItem[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);

  // Filter States
  const [search, setSearch] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "In Stock" | "Low Stock" | "Out of Stock">("all");

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Bin Card / Stock Ledger Modal
  const [ledgerItem, setLedgerItem] = useState<LiveInventoryItem | null>(null);
  const [movements, setMovements] = useState<StockMovementItem[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  // Stock Adjustment Modal
  const [isAdjOpen, setIsAdjOpen] = useState(false);
  const [adjProduct, setAdjProduct] = useState<LiveInventoryItem | null>(null);
  const [adjType, setAdjType] = useState<"ADD" | "SUBTRACT">("SUBTRACT");
  const [adjQuantity, setAdjQuantity] = useState<number>(1);
  const [adjReason, setAdjReason] = useState("damage");
  const [adjNotes, setAdjNotes] = useState("");
  const [adjSubmitting, setAdjSubmitting] = useState(false);

  // Stock Transfer Modal
  const [isTrfOpen, setIsTrfOpen] = useState(false);
  const [trfProduct, setTrfProduct] = useState<LiveInventoryItem | null>(null);
  const [trfToBranchId, setTrfToBranchId] = useState<number | 0>(0);
  const [trfQuantity, setTrfQuantity] = useState<number>(1);
  const [trfNotes, setTrfNotes] = useState("");
  const [trfSubmitting, setTrfSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [invData, branchData, catData, brandData] = await Promise.all([
        inventoryService.listLiveInventory({
          branch_id: selectedBranch !== "all" ? Number(selectedBranch) : undefined,
          category_id: selectedCategory !== "all" ? Number(selectedCategory) : undefined,
          brand_id: selectedBrand !== "all" ? Number(selectedBrand) : undefined,
        }),
        branchService.listBranches().catch(() => ({ branches: [] })),
        productService.listCategories().catch(() => []),
        productService.listBrands().catch(() => []),
      ]);

      setInventory(invData || []);
      setBranches(branchData?.branches || []);
      setCategories(catData || []);
      setBrands(brandData || []);
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedBranch, selectedCategory, selectedBrand]);

  // Reactive UI: auto-refresh live inventory and filters when related entities change anywhere
  useAppEventListener(
    ["inventory:changed", "products:changed", "branches:changed", "categories:changed", "brands:changed"],
    () => {
      loadData();
    }
  );

  const openLedger = async (item: LiveInventoryItem) => {
    try {
      setLedgerItem(item);
      setLedgerLoading(true);
      const data = await inventoryService.getProductLedger(item.product_id, item.branch_id);
      setMovements(data || []);
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to load stock ledger");
    } finally {
      setLedgerLoading(false);
    }
  };

  const openAdjustment = (item: LiveInventoryItem) => {
    setAdjProduct(item);
    setAdjType("SUBTRACT");
    setAdjQuantity(1);
    setAdjReason("damage");
    setAdjNotes("");
    setIsAdjOpen(true);
  };

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjProduct) return;

    try {
      setAdjSubmitting(true);
      await inventoryService.createStockAdjustment({
        branch_id: adjProduct.branch_id,
        reason: adjReason,
        notes: adjNotes.trim() || null,
        items: [
          {
            product_id: adjProduct.product_id,
            adjustment_type: adjType,
            quantity: Number(adjQuantity),
          },
        ],
      });
      toast.success("Stock adjustment posted successfully!");
      setIsAdjOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to post adjustment");
    } finally {
      setAdjSubmitting(false);
    }
  };

  const openTransfer = (item: LiveInventoryItem) => {
    setTrfProduct(item);
    const otherBranch = branches.find((b) => b.id !== item.branch_id);
    setTrfToBranchId(otherBranch ? otherBranch.id : 0);
    setTrfQuantity(1);
    setTrfNotes("");
    setIsTrfOpen(true);
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trfProduct || !trfToBranchId) {
      toast.error("Please select destination branch");
      return;
    }
    if (trfQuantity > trfProduct.current_stock) {
      toast.error(`Cannot transfer more than available stock (${trfProduct.current_stock})`);
      return;
    }

    try {
      setTrfSubmitting(true);
      await inventoryService.createStockTransfer({
        from_branch_id: trfProduct.branch_id,
        to_branch_id: trfToBranchId,
        notes: trfNotes.trim() || null,
        items: [
          {
            product_id: trfProduct.product_id,
            quantity: Number(trfQuantity),
          },
        ],
      });
      toast.success("Inter-branch stock transfer completed!");
      setIsTrfOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to transfer stock");
    } finally {
      setTrfSubmitting(false);
    }
  };

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.product_name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      (item.barcode && item.barcode.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === "all" || item.stock_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const paginatedInventory = filteredInventory.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const totalValuation = inventory.reduce((sum, item) => sum + item.current_stock * item.cost_price, 0);
  const lowStockCount = inventory.filter((i) => i.stock_status === "Low Stock").length;
  const outOfStockCount = inventory.filter((i) => i.stock_status === "Out of Stock").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Live Multi-Branch Inventory</h1>
            <Badge variant="outline" className="text-xs">
              {inventory.length} Stock Rows
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Real-time branch inventory levels, reorder alerts, and immutable bin cards.
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
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Valuation</CardTitle>
            <IconPackage className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              PKR {totalValuation.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground">Based on weighted cost price</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Stock Items</CardTitle>
            <IconPackage className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {inventory.filter((i) => i.stock_status === "In Stock").length}
            </div>
            <p className="text-xs text-muted-foreground">Adequate stock levels</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Warning</CardTitle>
            <IconAlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {lowStockCount}
            </div>
            <p className="text-xs text-muted-foreground">At or below reorder threshold</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <IconAlertTriangle className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {outOfStockCount}
            </div>
            <p className="text-xs text-muted-foreground">Zero stock balance</p>
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
                placeholder="SKU, barcode, or item..."
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

            {/* Category Filter */}
            <Select
              value={selectedCategory}
              onValueChange={(val) => {
                setSelectedCategory(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-36 h-9 text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
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
              <SelectTrigger className="w-36 h-9 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="In Stock">In Stock</SelectItem>
                <SelectItem value="Low Stock">Low Stock</SelectItem>
                <SelectItem value="Out of Stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <span>{filteredInventory.length} Stock Rows Found</span>
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[110px]">SKU / Barcode</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>Category / Brand</TableHead>
                <TableHead>Branch Location</TableHead>
                <TableHead className="text-right">Current Stock</TableHead>
                <TableHead className="text-right">Reorder Pt</TableHead>
                <TableHead className="text-right">Cost Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <IconRefresh className="h-6 w-6 animate-spin text-primary" />
                      <span>Loading branch stock...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredInventory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <IconPackage className="h-8 w-8 text-muted-foreground/40" />
                      <p className="font-medium">No inventory records found</p>
                      <p className="text-xs">Post a purchase bill to populate branch stocks.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedInventory.map((item) => (
                  <TableRow key={`${item.product_id}-${item.branch_id}`} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-xs font-semibold">
                      <div>{item.sku}</div>
                      {item.barcode && <span className="text-[10px] text-muted-foreground">{item.barcode}</span>}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-xs text-foreground">{item.product_name}</div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div>{item.category_name || "Uncategorized"}</div>
                      {item.brand_name && <span className="text-[10px] text-muted-foreground/80">{item.brand_name}</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <IconBuildingStore className="h-3.5 w-3.5 text-blue-500" />
                        <span>{item.branch_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono text-xs font-bold text-foreground">
                        {item.current_stock.toLocaleString()}
                      </span>{" "}
                      <span className="text-[10px] text-muted-foreground">{item.base_unit}</span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      {item.reorder_point}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-semibold">
                      PKR {item.cost_price.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          item.stock_status === "In Stock"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : item.stock_status === "Low Stock"
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                        }`}
                      >
                        {item.stock_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <IconAdjustments className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openLedger(item)}>
                            <IconHistory className="mr-2 h-4 w-4" />
                            View Bin Card Ledger
                          </DropdownMenuItem>
                          {canTransfer && branches.length > 1 && (
                            <DropdownMenuItem onClick={() => openTransfer(item)}>
                              <IconArrowsExchange className="mr-2 h-4 w-4" />
                              Transfer to Another Branch
                            </DropdownMenuItem>
                          )}
                          {canAdjust && (
                            <DropdownMenuItem onClick={() => openAdjustment(item)}>
                              <IconAdjustments className="mr-2 h-4 w-4" />
                              Adjust / Damage Entry
                            </DropdownMenuItem>
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
            total={filteredInventory.length}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
          />
        </CardContent>
      </Card>

      {/* Bin Card Ledger Modal */}
      <Dialog open={Boolean(ledgerItem)} onOpenChange={(open) => !open && setLedgerItem(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          {ledgerItem && (
            <div>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <IconHistory className="h-5 w-5 text-primary" />
                  Bin Card Ledger: {ledgerItem.product_name}
                </DialogTitle>
                <DialogDescription>
                  Audit history of all stock additions, sales deductions, transfers, and adjustments.
                </DialogDescription>
              </DialogHeader>

              <div className="flex items-center justify-between py-2 border-y text-xs my-3 bg-muted/20 px-3 rounded">
                <div>
                  <span className="text-muted-foreground">Branch: </span>
                  <span className="font-semibold text-foreground">{ledgerItem.branch_name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Current Balance: </span>
                  <span className="font-bold text-foreground font-mono">
                    {ledgerItem.current_stock} {ledgerItem.base_unit}
                  </span>
                </div>
              </div>

              {ledgerLoading ? (
                <div className="h-32 flex items-center justify-center gap-2 text-muted-foreground">
                  <IconRefresh className="h-5 w-5 animate-spin" />
                  <span>Loading ledger movements...</span>
                </div>
              ) : movements.length === 0 ? (
                <div className="h-28 flex items-center justify-center text-xs text-muted-foreground italic">
                  No stock movements recorded yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs">
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Change</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((m) => (
                      <TableRow key={m.id} className="text-xs font-mono">
                        <TableCell className="text-muted-foreground">
                          {new Date(m.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] uppercase font-sans">
                            {m.movement_type}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={`text-right font-bold ${
                            m.quantity > 0 ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                        </TableCell>
                        <TableCell className="text-right font-bold text-foreground">
                          {m.balance_after}
                        </TableCell>
                        <TableCell className="text-muted-foreground font-sans text-[11px] truncate max-w-[180px]">
                          {m.notes || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quick Stock Adjustment Modal */}
      <Dialog open={isAdjOpen} onOpenChange={setIsAdjOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <form onSubmit={handleAdjustmentSubmit}>
            <DialogHeader>
              <DialogTitle>Adjust Stock Balance</DialogTitle>
              <DialogDescription>
                Record shrinkage, damage, expired goods, or physical audit reconciliation.
              </DialogDescription>
            </DialogHeader>

            {adjProduct && (
              <div className="space-y-3 py-3 text-xs">
                <div className="p-2.5 rounded bg-muted/40 border">
                  <div className="font-semibold text-sm">{adjProduct.product_name}</div>
                  <div className="text-muted-foreground">
                    Branch: {adjProduct.branch_name} | Available: {adjProduct.current_stock} {adjProduct.base_unit}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Action Type</Label>
                    <Select value={adjType} onValueChange={(val: any) => setAdjType(val)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SUBTRACT">Deduct (Damage / Loss)</SelectItem>
                        <SelectItem value="ADD">Add (Audit Surplus)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Quantity</Label>
                    <Input
                      type="number"
                      min="0.1"
                      step="any"
                      value={adjQuantity}
                      onChange={(e) => setAdjQuantity(Number(e.target.value))}
                      className="h-8 text-xs text-right"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Reason</Label>
                  <Select value={adjReason} onValueChange={setAdjReason}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="damage">Damaged Goods</SelectItem>
                      <SelectItem value="expiry">Expired Stock</SelectItem>
                      <SelectItem value="audit_correction">Audit Discrepancy</SelectItem>
                      <SelectItem value="sample">Free Sample Allocation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Notes / Explanation</Label>
                  <Textarea
                    value={adjNotes}
                    onChange={(e) => setAdjNotes(e.target.value)}
                    placeholder="Brief explanation for the stock change..."
                    rows={2}
                    className="text-xs"
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAdjOpen(false)} disabled={adjSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={adjSubmitting}>
                {adjSubmitting ? "Adjusting..." : "Post Adjustment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quick Stock Transfer Modal */}
      <Dialog open={isTrfOpen} onOpenChange={setIsTrfOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <form onSubmit={handleTransferSubmit}>
            <DialogHeader>
              <DialogTitle>Inter-Branch Stock Transfer</DialogTitle>
              <DialogDescription>
                Move product stock from current branch to another store or godown.
              </DialogDescription>
            </DialogHeader>

            {trfProduct && (
              <div className="space-y-3 py-3 text-xs">
                <div className="p-2.5 rounded bg-muted/40 border">
                  <div className="font-semibold text-sm">{trfProduct.product_name}</div>
                  <div className="text-muted-foreground">
                    From: <strong className="text-foreground">{trfProduct.branch_name}</strong> (Available: {trfProduct.current_stock})
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Destination Branch</Label>
                  <Select value={String(trfToBranchId)} onValueChange={(val) => setTrfToBranchId(Number(val))}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select Branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches
                        .filter((b) => b.id !== trfProduct.branch_id)
                        .map((b) => (
                          <SelectItem key={b.id} value={String(b.id)} className="text-xs">
                            {b.name} ({b.city})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Transfer Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    max={trfProduct.current_stock}
                    value={trfQuantity}
                    onChange={(e) => setTrfQuantity(Number(e.target.value))}
                    className="h-8 text-xs text-right font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Transfer Notes</Label>
                  <Textarea
                    value={trfNotes}
                    onChange={(e) => setTrfNotes(e.target.value)}
                    placeholder="Vehicle #, driver, or transfer reason..."
                    rows={2}
                    className="text-xs"
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsTrfOpen(false)} disabled={trfSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={trfSubmitting}>
                {trfSubmitting ? "Transferring..." : "Complete Transfer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
