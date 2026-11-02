"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import {
  IconBuildingFactory2,
  IconPlus,
  IconSearch,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconRefresh,
  IconAlertTriangle,
  IconLayersLinked,
  IconCheck,
  IconWorld,
  IconBuildingStore,
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
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { useAppEventListener } from "@/lib/events";
import { productService, type BrandItem } from "@/services/product.service";

export default function BrandsPage() {
  const { user, tenant } = useAuth();
  const userPerms = tenant?.permissions || [];
  const userRole = tenant?.role_name || "";
  const isOwnerOrAdmin =
    user?.is_superadmin ||
    userRole.toLowerCase() === "admin" ||
    userRole.toLowerCase() === "owner" ||
    userPerms.includes("*");

  const canCreateBrand = isOwnerOrAdmin || userPerms.includes("brands:create");
  const canEditBrand = isOwnerOrAdmin || userPerms.includes("brands:edit");
  const canDeleteBrand = isOwnerOrAdmin || userPerms.includes("brands:delete");

  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BrandItem | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [origin, setOrigin] = useState("Pakistan");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Delete State
  const [deletingBrand, setDeletingBrand] = useState<BrandItem | null>(null);

  // Load Data
  const loadBrands = async () => {
    try {
      setLoading(true);
      const data = await productService.listBrands();
      setBrands(data || []);
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to load product brands");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBrands();
  }, []);

  // Reactive UI: auto-refresh brands table when brands change anywhere
  useAppEventListener("brands:changed", () => {
    loadBrands();
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filtered brands
  const filteredBrands = useMemo(() => {
    return brands.filter((b) => {
      const matchesSearch =
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.code.toLowerCase().includes(search.toLowerCase()) ||
        (b.origin && b.origin.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && b.is_active) ||
        (statusFilter === "inactive" && !b.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [brands, search, statusFilter]);

  const paginatedBrands = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredBrands.slice(start, start + pageSize);
  }, [filteredBrands, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  // Calculate Metrics
  const totalBrands = brands.length;
  const activeCount = brands.filter((b) => b.is_active).length;
  const pakistaniBrands = brands.filter((b) => b.origin?.toLowerCase() === "pakistan").length;
  const totalProductsLinked = brands.reduce((acc, b) => acc + (b.product_count || 0), 0);

  // Open Modal for Add
  const handleOpenAdd = () => {
    setEditingBrand(null);
    setName("");
    setCode("");
    setOrigin("Pakistan");
    setDescription("");
    setIsActive(true);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (brand: BrandItem) => {
    setEditingBrand(brand);
    setName(brand.name);
    setCode(brand.code);
    setOrigin(brand.origin || "Pakistan");
    setDescription(brand.description || "");
    setIsActive(brand.is_active);
    setIsModalOpen(true);
  };

  // Save Brand
  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Brand name is required");
      return;
    }
    const finalCode = (code.trim() || `BRD-${name.slice(0, 3).toUpperCase()}`).toUpperCase();

    try {
      setIsSubmitting(true);
      if (editingBrand) {
        await productService.updateBrand(editingBrand.id, {
          name: name.trim(),
          code: finalCode,
          origin: origin.trim() || "Pakistan",
          description: description.trim() || null,
          is_active: isActive,
        });
        toast.success(`Brand "${name}" updated successfully!`);
      } else {
        await productService.createBrand({
          name: name.trim(),
          code: finalCode,
          origin: origin.trim() || "Pakistan",
          description: description.trim() || null,
          is_active: isActive,
        });
        toast.success(`Brand "${name}" registered successfully!`);
      }

      setIsModalOpen(false);
      loadBrands();
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to save brand");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Brand
  const handleDeleteBrand = async () => {
    if (!deletingBrand) return;
    try {
      setIsDeleting(true);
      await productService.deleteBrand(deletingBrand.id);
      toast.success(`Brand "${deletingBrand.name}" deleted successfully!`);
      setDeletingBrand(null);
      loadBrands();
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to delete brand");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <IconBuildingFactory2 className="h-6 w-6 text-primary" />
            Brands & Principals
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Register and monitor product manufacturers, principal suppliers, and country origins.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadBrands}
            disabled={loading}
            className="gap-2"
          >
            <IconRefresh className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>

          {canCreateBrand && (
            <Button onClick={handleOpenAdd} className="gap-2 font-medium shadow-sm">
              <IconPlus className="h-4 w-4" />
              Add Brand
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Brands
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <IconBuildingFactory2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalBrands}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered manufacturers</p>
          </CardContent>
        </Card>

        <Card className="border border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Active Principals
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <IconCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{activeCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Active supplier partnerships</p>
          </CardContent>
        </Card>

        <Card className="border border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Domestic (Pakistan)
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <IconWorld className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{pakistaniBrands}</div>
            <p className="text-xs text-muted-foreground mt-1">Local FMCG production</p>
          </CardContent>
        </Card>

        <Card className="border border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Linked Products
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <IconLayersLinked className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalProductsLinked}</div>
            <p className="text-xs text-muted-foreground mt-1">Total items under brands</p>
          </CardContent>
        </Card>
      </div>

      {/* SINGLE UNIFIED BRANDS TABLE CARD */}
      <Card className="overflow-hidden border border-border/70 shadow-sm">
        {/* CARD HEADER TOOLBAR: Search & Filters on the LEFT */}
        <div className="p-3.5 border-b bg-card/60 flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center flex-1">
            <div className="relative w-full sm:w-72 md:w-80">
              <IconSearch className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search brand name, code (e.g. BRD-NES), origin..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="w-full sm:w-44">
              <Select
                value={statusFilter}
                onValueChange={(val) => setStatusFilter(val as "all" | "active" | "inactive")}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Status Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-xs text-muted-foreground font-mono font-medium shrink-0 self-end md:self-center">
            {filteredBrands.length} Brands Found
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[30%]">Brand Name</TableHead>
                <TableHead>Brand Code</TableHead>
                <TableHead>Country / Origin</TableHead>
                <TableHead>Linked Products</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-44 text-center">
                    <div className="flex flex-col items-center justify-center gap-2.5">
                      <IconRefresh className="h-6 w-6 animate-spin text-primary" />
                      <p className="text-sm font-medium text-muted-foreground">Loading brands catalogue...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredBrands.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground">
                    No brands found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedBrands.map((b) => (
                <TableRow key={b.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                        <IconBuildingFactory2 className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-foreground">{b.name}</div>
                        {b.description && (
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {b.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs uppercase bg-muted/50">
                      {b.code}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-xs text-foreground font-medium">
                    <span className="flex items-center gap-1">
                      <IconWorld className="h-3.5 w-3.5 text-muted-foreground" />
                      {b.origin || "Pakistan"}
                    </span>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="font-mono text-xs px-2 py-0.5 bg-primary/10 text-primary border border-primary/20"
                    >
                      {b.product_count} {b.product_count === 1 ? "item" : "items"}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    {b.is_active ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border">
                        Inactive
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <IconDotsVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        {canEditBrand && (
                          <DropdownMenuItem
                            onClick={() => handleOpenEdit(b)}
                            className="text-xs gap-2"
                          >
                            <IconEdit className="h-4 w-4" />
                            Edit Brand
                          </DropdownMenuItem>
                        )}
                        {canDeleteBrand && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeletingBrand(b)}
                              className="text-xs gap-2 text-destructive focus:text-destructive"
                            >
                              <IconTrash className="h-4 w-4" />
                              Delete Brand
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
        </div>

        {/* BOTTOM PAGINATION FOOTER */}
        <DataTablePagination
          page={page}
          pageSize={pageSize}
          total={filteredBrands.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </Card>

      {/* CREATE / EDIT BRAND DIALOG */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconBuildingFactory2 className="h-5 w-5 text-primary" />
              {editingBrand ? "Edit Brand Principal" : "Add Brand Principal"}
            </DialogTitle>
            <DialogDescription>
              {editingBrand
                ? "Update manufacturer details, country origin, or brand code."
                : "Register a manufacturing principal company for catalogue categorization."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveBrand} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="brand_name">
                Brand Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="brand_name"
                placeholder="e.g. Nestle Pakistan"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!editingBrand && !code) {
                    setCode(`BRD-${e.target.value.slice(0, 3).toUpperCase()}`);
                  }
                }}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="brand_code">
                  Brand Code <span className="text-destructive">*</span>
                </Label>
                <button
                  type="button"
                  onClick={() => setCode(`BRD-${Math.floor(100 + Math.random() * 900)}`)}
                  className="text-[11px] text-primary hover:underline"
                >
                  Generate Code
                </button>
              </div>
              <Input
                id="brand_code"
                placeholder="e.g. BRD-NES"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="font-mono uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="brand_origin">Country / Origin</Label>
              <Input
                id="brand_origin"
                placeholder="e.g. Pakistan"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="brand_desc">Description (Optional)</Label>
              <Textarea
                id="brand_desc"
                placeholder="Company overview, local distributor details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="brand_active">Active Brand</Label>
                <p className="text-xs text-muted-foreground">
                  Inactive brands are hidden from product creation and reports.
                </p>
              </div>
              <Switch id="brand_active" checked={isActive} onCheckedChange={setIsActive} />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                {isSubmitting && <IconRefresh className="h-4 w-4 animate-spin" />}
                {isSubmitting
                  ? editingBrand
                    ? "Saving Changes..."
                    : "Registering Brand..."
                  : editingBrand
                  ? "Save Changes"
                  : "Register Brand"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <AlertDialog
        open={Boolean(deletingBrand)}
        onOpenChange={(open) => !open && setDeletingBrand(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <IconAlertTriangle className="h-5 w-5" />
              Delete Brand "{deletingBrand?.name}"?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Are you sure you want to permanently delete brand{" "}
                  <strong className="text-foreground">{deletingBrand?.name}</strong> ({deletingBrand?.code})?
                </p>
                {deletingBrand && (deletingBrand.product_count ?? 0) > 0 && (
                  <p className="text-xs text-destructive font-medium bg-destructive/10 p-2 rounded">
                    Warning: There are {deletingBrand.product_count} products currently assigned to this
                    brand.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteBrand();
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
    </div>
  );
}
