"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  IconBox,
  IconPlus,
  IconSearch,
  IconLayoutGrid,
  IconLayoutList,
  IconDotsVertical,
  IconBarcode,
  IconTag,
  IconBuildingFactory2,
  IconBuildingStore,
  IconEdit,
  IconTrash,
  IconRefresh,
  IconCheck,
  IconAlertTriangle,
  IconCoins,
  IconLayersLinked,
  IconArrowRight,
  IconCopy,
  IconX,
  IconAdjustmentsHorizontal,
  IconFileBarcode,
  IconBuildingWarehouse,
  IconPhoto,
} from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { useLookupData } from "@/hooks/use-lookup-data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import {
  productService,
  type ProductListItem,
  type ProductDetailItem,
  type CategoryItem,
  type BrandItem,
  type ProductStats,
  type ProductCreatePayload,
  type ProductUpdatePayload,
  type ProductUOMConversionItem,
} from "@/services/product.service";
import { branchService, type BranchItem } from "@/services/branch.service";
import { attachmentService } from "@/services/attachment.service";

const DEFAULT_PRODUCT_IMAGE = "/images/default-product.svg";

export default function ProductsPage() {
  const { user, tenant } = useAuth();
  const userPerms = tenant?.permissions || [];
  const userRole = tenant?.role_name || "";
  const isOwnerOrAdmin =
    user?.is_superadmin ||
    userRole.toLowerCase() === "admin" ||
    userRole.toLowerCase() === "owner" ||
    userPerms.includes("*");

  const canCreateProduct = isOwnerOrAdmin || userPerms.includes("products:create");
  const canEditProduct = isOwnerOrAdmin || userPerms.includes("products:edit");
  const canDeleteProduct = isOwnerOrAdmin || userPerms.includes("products:delete");

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [stats, setStats] = useState<ProductStats>({
    total_products: 0,
    total_inventory_value: 0,
    low_stock_count: 0,
    out_of_stock_count: 0,
  });
  const { data: categories, refetch: refetchCategories } = useLookupData("categories");
  const { data: brands, refetch: refetchBrands } = useLookupData("brands");
  const { data: branches } = useLookupData("branches");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalProducts, setTotalProducts] = useState(0);

  // Product Add / Edit Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("general");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Product Form State
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [categoryId, setCategoryId] = useState<number | 0>(0);
  const [brandId, setBrandId] = useState<number | 0>(0);
  const [baseUnit, setBaseUnit] = useState("Piece");
  const [costPrice, setCostPrice] = useState<number | "">(0);
  const [retailPrice, setRetailPrice] = useState<number | "">(0);
  const [wholesalePrice, setWholesalePrice] = useState<number | "">(0);
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [taxRate, setTaxRate] = useState<number | "">(0);
  const [isThirdSchedule, setIsThirdSchedule] = useState(false);
  const [hasBatches, setHasBatches] = useState(false);
  const [reorderLevel, setReorderLevel] = useState<number>(5);
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [uomConversions, setUomConversions] = useState<ProductUOMConversionItem[]>([]);
  const [initialStocks, setInitialStocks] = useState<Record<number, number>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Product 360 Stock Modal
  const [detailProduct, setDetailProduct] = useState<ProductDetailItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [stockEditBranchId, setStockEditBranchId] = useState<number | null>(null);
  const [stockEditQty, setStockEditQty] = useState<number>(0);
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);

  // Quick Category & Brand Modals
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryModalTab, setCategoryModalTab] = useState<"list" | "create">("list");
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [categoryCode, setCategoryCode] = useState("");
  const [categoryDesc, setCategoryDesc] = useState("");
  const [categoryParentId, setCategoryParentId] = useState<number | 0>(0);

  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [brandModalTab, setBrandModalTab] = useState<"list" | "create">("list");
  const [brandSearchQuery, setBrandSearchQuery] = useState("");
  const [brandName, setBrandName] = useState("");
  const [brandCode, setBrandCode] = useState("");
  const [brandOrigin, setBrandOrigin] = useState("Pakistan");

  // Delete State
  const [deletingProduct, setDeletingProduct] = useState<ProductListItem | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [isSavingQuickCategory, setIsSavingQuickCategory] = useState(false);
  const [isSavingQuickBrand, setIsSavingQuickBrand] = useState(false);

  const [initialLoading, setInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  // Load products list from backend
  const loadProducts = useCallback(
    async (isInitial = false) => {
      try {
        if (isInitial) {
          setInitialLoading(true);
        } else {
          setIsFetching(true);
        }

        const prodRes = await productService.listProducts({
          search: search.trim() || undefined,
          category_id: categoryFilter !== "all" ? Number(categoryFilter) : undefined,
          brand_id: brandFilter !== "all" ? Number(brandFilter) : undefined,
          stock_status: stockFilter !== "all" ? stockFilter : undefined,
          page,
          size: pageSize,
        });

        setProducts(prodRes.items || []);
        setTotalProducts(prodRes.total || 0);
        if (prodRes.stats) {
          setStats(prodRes.stats);
        }
      } catch (err: any) {
        toast.error(err?.detail || err?.message || "Failed to load product catalogue");
      } finally {
        setInitialLoading(false);
        setIsFetching(false);
        setLoading(false);
      }
    },
    [search, categoryFilter, brandFilter, stockFilter, page, pageSize]
  );

  // Mount effect: initial products fetch
  const isInitialMount = useRef(true);
  useEffect(() => {
    loadProducts(true);
  }, []);

  // Filter/Pagination/Search updates AFTER initial mount (with debounce)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timer = setTimeout(() => {
      loadProducts(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [categoryFilter, brandFilter, stockFilter, page, pageSize, search, loadProducts]);

  const loadData = () => {
    refetchCategories();
    refetchBrands();
    loadProducts(false);
  };

  // Reset form
  const resetForm = () => {
    setName("");
    setSku(`PRD-${Math.floor(1000 + Math.random() * 9000)}`);
    setBarcode("");
    setCategoryId(categories.length > 0 ? categories[0].id : 0);
    setBrandId(0);
    setBaseUnit("Piece");
    setCostPrice(0);
    setRetailPrice(0);
    setWholesalePrice(0);
    setMinPrice("");
    setTaxRate(0);
    setIsThirdSchedule(false);
    setHasBatches(false);
    setReorderLevel(5);
    setDescription("");
    setImageUrl("");
    setImageFile(null);
    setImagePreview(null);
    setIsActive(true);
    setUomConversions([]);
    const defaultStocks: Record<number, number> = {};
    branches.forEach((b) => {
      defaultStocks[b.id] = 0;
    });
    setInitialStocks(defaultStocks);
    setFormErrors({});
    setActiveTab("general");
    setEditingProductId(null);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Open Add Product
  const handleOpenAdd = () => {
    resetForm();
    setIsProductModalOpen(true);
  };

  // Open Edit Product
  const handleOpenEdit = async (item: ProductListItem) => {
    try {
      setLoading(true);
      const detail = await productService.getProduct(item.id);
      setEditingProductId(detail.id);
      setName(detail.name);
      setSku(detail.sku);
      setBarcode(detail.barcode || "");
      setCategoryId(detail.category_id);
      setBrandId(detail.brand_id || 0);
      setBaseUnit(detail.base_unit);
      setCostPrice(detail.cost_price);
      setRetailPrice(detail.retail_price);
      setWholesalePrice(detail.wholesale_price);
      setMinPrice(detail.min_price !== null && detail.min_price !== undefined ? detail.min_price : "");
      setTaxRate(detail.tax_rate);
      setIsThirdSchedule(detail.is_fbr_third_schedule);
      setHasBatches(detail.has_batches);
      setReorderLevel(detail.reorder_level);
      setDescription(detail.description || "");
      setImageUrl(detail.image_url || "");
      setImagePreview(detail.image_url || null);
      setImageFile(null);
      setIsActive(detail.is_active);
      setUomConversions(detail.uom_conversions || []);
      setFormErrors({});
      setActiveTab("general");
      setIsProductModalOpen(true);
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to load product details");
    } finally {
      setLoading(false);
    }
  };

  // Open Product 360 Stock View
  const handleOpenDetail = async (productId: number) => {
    try {
      const detail = await productService.getProduct(productId);
      setDetailProduct(detail);
      setStockEditBranchId(null);
      setIsDetailOpen(true);
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to fetch stock details");
    }
  };

  // Save Branch Physical Stock
  const handleSaveBranchStock = async (branchId: number) => {
    if (!detailProduct) return;
    try {
      setIsUpdatingStock(true);
      await productService.updateBranchStock(detailProduct.id, branchId, stockEditQty);
      toast.success("Stock quantity updated successfully!");
      // Reload detail
      const refreshed = await productService.getProduct(detailProduct.id);
      setDetailProduct(refreshed);
      setStockEditBranchId(null);
      await loadData();
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to update stock");
    } finally {
      setIsUpdatingStock(false);
    }
  };

  // Auto Generate Barcode
  const handleGenerateBarcode = () => {
    const ean = `896${Math.floor(100000000 + Math.random() * 900000000)}`;
    setBarcode(ean);
  };

  // Add UOM Conversion Row
  const handleAddUomConversion = () => {
    setUomConversions((prev) => [
      ...prev,
      {
        unit_name: "Carton (24 Packs)",
        conversion_factor: 24,
        carton_barcode: "",
        carton_wholesale_price: Number(wholesalePrice) * 24,
        carton_retail_price: Number(retailPrice) * 24,
      },
    ]);
  };

  const handleRemoveUomConversion = (index: number) => {
    setUomConversions((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Product Save
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!name.trim()) errors.name = "Product title is required";
    if (!sku.trim()) errors.sku = "Product SKU code is required";
    if (!categoryId || categoryId === 0) errors.category = "Category must be selected";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setActiveTab("general");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormErrors({});

      let finalImageUrl = imageUrl.trim() || null;

      if (editingProductId) {
        if (imageFile) {
          try {
            const formData = new FormData();
            formData.append("file", imageFile);
            formData.append("attachable_type", "Product");
            formData.append("attachable_id", String(editingProductId));
            formData.append("is_primary", "true");
            formData.append("title", name.trim());
            const att = await attachmentService.uploadAttachment(formData);
            finalImageUrl = att.file_path;
          } catch (uploadErr) {
            console.warn("Failed to upload product attachment:", uploadErr);
          }
        }

        const payload: ProductUpdatePayload = {
          name: name.trim(),
          sku: sku.trim().toUpperCase(),
          barcode: barcode.trim() || null,
          category_id: categoryId,
          brand_id: brandId === 0 ? null : brandId,
          base_unit: baseUnit.trim(),
          cost_price: Number(costPrice) || 0,
          retail_price: Number(retailPrice) || 0,
          wholesale_price: Number(wholesalePrice) || 0,
          min_price: minPrice !== "" ? Number(minPrice) : null,
          tax_rate: Number(taxRate) || 0,
          is_fbr_third_schedule: isThirdSchedule,
          has_batches: hasBatches,
          reorder_level: Number(reorderLevel) || 0,
          image_url: finalImageUrl,
          description: description.trim() || null,
          is_active: isActive,
          uom_conversions: uomConversions,
        };
        await productService.updateProduct(editingProductId, payload);
        toast.success(`Product "${name}" updated successfully!`);
      } else {
        const initialStockArray = Object.entries(initialStocks).map(([bId, qty]) => ({
          branch_id: Number(bId),
          quantity: Number(qty) || 0,
          reorder_point: reorderLevel,
        }));

        const payload: ProductCreatePayload = {
          name: name.trim(),
          sku: sku.trim().toUpperCase(),
          barcode: barcode.trim() || null,
          category_id: categoryId,
          brand_id: brandId === 0 ? null : brandId,
          base_unit: baseUnit.trim(),
          cost_price: Number(costPrice) || 0,
          retail_price: Number(retailPrice) || 0,
          wholesale_price: Number(wholesalePrice) || 0,
          min_price: minPrice !== "" ? Number(minPrice) : null,
          tax_rate: Number(taxRate) || 0,
          is_fbr_third_schedule: isThirdSchedule,
          has_batches: hasBatches,
          reorder_level: Number(reorderLevel) || 0,
          image_url: finalImageUrl,
          description: description.trim() || null,
          is_active: isActive,
          uom_conversions: uomConversions,
          initial_stocks: initialStockArray,
        };
        const created = await productService.createProduct(payload);

        // Upload polymorphic attachment if file was picked
        if (imageFile && created?.id) {
          try {
            const formData = new FormData();
            formData.append("file", imageFile);
            formData.append("attachable_type", "Product");
            formData.append("attachable_id", String(created.id));
            formData.append("is_primary", "true");
            formData.append("title", name.trim());
            const att = await attachmentService.uploadAttachment(formData);
            await productService.updateProduct(created.id, { image_url: att.file_path });
          } catch (uploadErr) {
            console.warn("Failed to upload product attachment:", uploadErr);
          }
        }

        toast.success(`Product "${name}" added to catalogue!`);
      }

      setIsProductModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to save product");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    try {
      setIsDeletingProduct(true);
      await productService.deleteProduct(deletingProduct.id);
      toast.success(`Product "${deletingProduct.name}" removed from catalogue.`);
      setDeletingProduct(null);
      await loadData();
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to delete product");
    } finally {
      setIsDeletingProduct(false);
    }
  };

  // Create Quick Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      toast.error("Category name is required");
      return;
    }
    try {
      setIsSavingQuickCategory(true);
      const code = categoryCode.trim() || `CAT-${categoryName.slice(0, 3).toUpperCase()}`;
      const newCat = await productService.createCategory({
        name: categoryName.trim(),
        code: code.toUpperCase(),
        parent_id: categoryParentId === 0 ? null : categoryParentId,
        description: categoryDesc.trim() || null,
        is_active: true,
      });
      toast.success(`Category "${newCat.name}" created!`);
      setCategoryId(newCat.id);
      setIsCategoryModalOpen(false);
      setCategoryName("");
      setCategoryCode("");
      setCategoryDesc("");
      setCategoryParentId(0);
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to create category");
    } finally {
      setIsSavingQuickCategory(false);
    }
  };

  // Create Quick Brand
  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) {
      toast.error("Brand name is required");
      return;
    }
    try {
      setIsSavingQuickBrand(true);
      const code = brandCode.trim() || `BRD-${brandName.slice(0, 3).toUpperCase()}`;
      const newBrand = await productService.createBrand({
        name: brandName.trim(),
        code: code.toUpperCase(),
        origin: brandOrigin.trim() || "Pakistan",
        is_active: true,
      });
      toast.success(`Brand "${newBrand.name}" created!`);
      setBrandId(newBrand.id);
      setIsBrandModalOpen(false);
      setBrandName("");
      setBrandCode("");
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to create brand");
    } finally {
      setIsSavingQuickBrand(false);
    }
  };

  // Calculated margin preview
  const costNum = Number(costPrice) || 0;
  const retailNum = Number(retailPrice) || 0;
  const marginPct =
    costNum > 0 && retailNum > costNum
      ? Math.round(((retailNum - costNum) / retailNum) * 100)
      : 0;

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <PageHeader
            title="Products & Catalogue"
            description="Manage your master item catalogue, barcode scanning, multi-UOM packaging, and stock per branch."
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="gap-2"
          >
            <IconRefresh className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>

          {canCreateProduct && (
            <Button onClick={handleOpenAdd} className="gap-2 font-medium shadow-sm">
              <IconPlus className="h-4 w-4" />
              Add Product
            </Button>
          )}
        </div>
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <Card className="border-border/60 shadow-xs">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Catalogue Size
              </span>
              <div className="text-2xl font-bold tracking-tight">
                {stats.total_products.toLocaleString()}
              </div>
              <p className="text-[11px] text-muted-foreground">Active products & items</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <IconBox className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Total Inventory Valuation */}
        <Card className="border-border/60 shadow-xs">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Stock Valuation (Cost)
              </span>
              <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                Rs. {stats.total_inventory_value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
              <p className="text-[11px] text-muted-foreground">Total cost across all shops</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <IconCoins className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="border-border/60 shadow-xs">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Low Stock Warnings
              </span>
              <div className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                {stats.low_stock_count}
              </div>
              <p className="text-[11px] text-muted-foreground">Below reorder threshold</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <IconAlertTriangle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Out of Stock Items */}
        <Card className="border-border/60 shadow-xs">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-destructive uppercase tracking-wider">
                Out of Stock
              </span>
              <div className="text-2xl font-bold tracking-tight text-destructive">
                {stats.out_of_stock_count}
              </div>
              <p className="text-[11px] text-muted-foreground">Need urgent supplier PO</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
              <IconX className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      {initialLoading ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center justify-center gap-3">
            <IconRefresh className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading products catalogue...</p>
          </div>
        </Card>
      ) : viewMode === "table" ? (
        /* TABLE VIEW */
        <Card className="shadow-sm border-border/70 overflow-hidden relative">
          <div className="p-3.5 border-b bg-card/60 flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative w-72 md:w-80">
                <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search product, SKU, barcode..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9 text-xs"
                />
              </div>

              {/* Category Filter */}
              <Select
                value={categoryFilter}
                onValueChange={(val) => {
                  setCategoryFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-40 h-9 text-xs">
                  <SelectValue placeholder="All Categories" />
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

              {/* Brand Filter */}
              <Select
                value={brandFilter}
                onValueChange={(val) => {
                  setBrandFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-36 h-9 text-xs">
                  <SelectValue placeholder="All Brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Stock Status Filter */}
              <Select
                value={stockFilter}
                onValueChange={(val) => {
                  setStockFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-36 h-9 text-xs">
                  <SelectValue placeholder="Stock Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stock Levels</SelectItem>
                  <SelectItem value="in_stock">In Stock Only</SelectItem>
                  <SelectItem value="low_stock">Low Stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-medium">
                {totalProducts} Products Found
              </span>
              <div className="flex items-center gap-1 border rounded-md p-0.5 bg-muted/30">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className="h-7 px-2.5"
                  title="Table View"
                >
                  <IconLayoutList className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-7 px-2.5"
                  title="Grid Cards View"
                >
                  <IconLayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className={`transition-opacity duration-150 ${isFetching ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
            <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[300px]">Product / Item</TableHead>
                <TableHead>Category & Brand</TableHead>
                <TableHead className="text-right">Cost (PKR)</TableHead>
                <TableHead className="text-right">Retail MRP</TableHead>
                <TableHead className="text-right">Wholesale</TableHead>
                <TableHead className="text-center">Total Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-44 text-center">
                    <div className="flex flex-col items-center justify-center gap-2.5 text-muted-foreground py-8">
                      <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center">
                        <IconBox className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="font-semibold text-sm">No Products Found</p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        {search || categoryFilter !== "all" || brandFilter !== "all" || stockFilter !== "all"
                          ? "No products match your active search filters. Try clearing or adjusting filters."
                          : "Your item catalogue is empty. Add your first wholesale or retail product."}
                      </p>
                      {search || categoryFilter !== "all" || brandFilter !== "all" || stockFilter !== "all" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1.5 mt-1"
                          onClick={() => {
                            setSearch("");
                            setCategoryFilter("all");
                            setBrandFilter("all");
                            setStockFilter("all");
                            setPage(1);
                          }}
                        >
                          Clear Filters
                        </Button>
                      ) : (
                        <Button size="sm" onClick={handleOpenAdd} className="h-8 text-xs gap-1.5 mt-1">
                          <IconPlus className="h-3.5 w-3.5" />
                          Add Product
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((p) => {
                return (
                  <TableRow key={p.id} className="hover:bg-muted/30">
                    {/* Title & SKU */}
                    <TableCell>
                      <div className="flex items-start gap-2.5">
                        <div className="h-10 w-10 shrink-0 rounded-lg bg-muted/40 overflow-hidden flex items-center justify-center border">
                          <img
                            src={p.image_url || DEFAULT_PRODUCT_IMAGE}
                            alt={p.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (!target.src.endsWith(DEFAULT_PRODUCT_IMAGE)) {
                                target.onerror = null;
                                target.src = DEFAULT_PRODUCT_IMAGE;
                              }
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-sm text-foreground truncate max-w-[240px]">
                            {p.name}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                            <span className="bg-muted px-1 rounded uppercase font-semibold text-[11px]">
                              {p.sku}
                            </span>
                            {p.barcode && (
                              <span className="flex items-center gap-1 text-[11px] text-muted-foreground/80">
                                <IconBarcode className="h-3 w-3" />
                                {p.barcode}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Category & Brand */}
                    <TableCell>
                      <div className="text-xs space-y-1">
                        <Badge variant="outline" className="text-[11px] font-medium bg-muted/40">
                          {p.category_name}
                        </Badge>
                        {p.brand_name && (
                          <div className="text-muted-foreground text-[11px] flex items-center gap-1">
                            <IconBuildingFactory2 className="h-3 w-3" />
                            {p.brand_name}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Cost */}
                    <TableCell className="text-right font-mono text-xs">
                      Rs. {p.cost_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>

                    {/* Retail MRP */}
                    <TableCell className="text-right font-mono text-xs font-semibold text-foreground">
                      Rs. {p.retail_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>

                    {/* Wholesale */}
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      Rs. {p.wholesale_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>

                    {/* Total Stock */}
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDetail(p.id)}
                        className="h-7 text-xs font-mono font-bold hover:bg-primary/10 hover:text-primary gap-1"
                        title="Click to view stock by shop/godown"
                      >
                        {p.total_stock} {p.base_unit}s
                        <IconBuildingStore className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </TableCell>

                    {/* Stock Status Badge */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs font-semibold",
                          p.stock_status === "in_stock" &&
                            "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
                          p.stock_status === "low_stock" &&
                            "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
                          p.stock_status === "out_of_stock" &&
                            "bg-destructive/10 text-destructive border-destructive/20"
                        )}
                      >
                        {p.stock_status === "in_stock" && "In Stock"}
                        {p.stock_status === "low_stock" && "Low Stock"}
                        {p.stock_status === "out_of_stock" && "Out of Stock"}
                      </Badge>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <IconDotsVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => handleOpenDetail(p.id)}
                            className="text-xs gap-2"
                          >
                            <IconBuildingStore className="h-4 w-4 text-primary" />
                            Branch Stock 360
                          </DropdownMenuItem>
                          {canEditProduct && (
                            <DropdownMenuItem
                              onClick={() => handleOpenEdit(p)}
                              className="text-xs gap-2"
                            >
                              <IconEdit className="h-4 w-4" />
                              Edit Product
                            </DropdownMenuItem>
                          )}
                          {canDeleteProduct && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeletingProduct(p)}
                                className="text-xs gap-2 text-destructive focus:text-destructive"
                              >
                                <IconTrash className="h-4 w-4" />
                                Delete Product
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              }))}
            </TableBody>
            </Table>
          </div>
          <DataTablePagination
            page={page}
            pageSize={pageSize}
            total={totalProducts}
            isLoading={isFetching}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
          />
        </Card>
      ) : (
        /* GRID CARDS VIEW */
        <div className="space-y-4">
          <Card className="border border-border/70 overflow-hidden shadow-sm">
            <div className="p-3.5 bg-card/60 flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative w-72 md:w-80">
                  <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search product, SKU, barcode..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 h-9 text-xs"
                  />
                </div>

                {/* Category Filter */}
                <Select
                  value={categoryFilter}
                  onValueChange={(val) => {
                    setCategoryFilter(val);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-40 h-9 text-xs">
                    <SelectValue placeholder="All Categories" />
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

                {/* Brand Filter */}
                <Select
                  value={brandFilter}
                  onValueChange={(val) => {
                    setBrandFilter(val);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-36 h-9 text-xs">
                    <SelectValue placeholder="All Brands" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Brands</SelectItem>
                    {brands.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Stock Status Filter */}
                <Select
                  value={stockFilter}
                  onValueChange={(val) => {
                    setStockFilter(val);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-36 h-9 text-xs">
                    <SelectValue placeholder="Stock Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stock Levels</SelectItem>
                    <SelectItem value="in_stock">In Stock Only</SelectItem>
                    <SelectItem value="low_stock">Low Stock</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground font-medium">
                  {totalProducts} Products Found
                </span>
                <div className="flex items-center gap-1 border rounded-md p-0.5 bg-muted/30">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode("table")}
                    className="h-7 px-2.5"
                    title="Table View"
                  >
                    <IconLayoutList className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="h-7 px-2.5"
                    title="Grid Cards View"
                  >
                    <IconLayoutGrid className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity duration-150 ${isFetching ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
            {products.length === 0 ? (
              <div className="col-span-full py-16 text-center text-muted-foreground border rounded-xl border-dashed">
                <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center mx-auto mb-2.5">
                  <IconBox className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="font-semibold text-sm">No Products Found</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  {search || categoryFilter !== "all" || brandFilter !== "all" || stockFilter !== "all"
                    ? "No products match your active search filters. Try clearing filters."
                    : "Your item catalogue is empty."}
                </p>
                {(search || categoryFilter !== "all" || brandFilter !== "all" || stockFilter !== "all") && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs mt-3 gap-1.5"
                    onClick={() => {
                      setSearch("");
                      setCategoryFilter("all");
                      setBrandFilter("all");
                      setStockFilter("all");
                      setPage(1);
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              products.map((p) => {
            return (
              <Card
                key={p.id}
                className="relative overflow-hidden transition-all duration-200 hover:shadow-md border border-border/70"
              >
                <CardHeader className="pb-3 pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className="h-10 w-10 shrink-0 rounded-lg bg-muted/40 flex items-center justify-center border overflow-hidden">
                        <img
                          src={p.image_url || DEFAULT_PRODUCT_IMAGE}
                          alt={p.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.src.endsWith(DEFAULT_PRODUCT_IMAGE)) {
                              target.onerror = null;
                              target.src = DEFAULT_PRODUCT_IMAGE;
                            }
                          }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base font-bold truncate">
                          {p.name}
                        </CardTitle>
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          <span className="text-[11px] font-mono font-semibold uppercase text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {p.sku}
                          </span>
                          <Badge variant="outline" className="text-[10px] py-0 h-4">
                            {p.category_name}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-semibold shrink-0",
                        p.stock_status === "in_stock" &&
                          "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
                        p.stock_status === "low_stock" &&
                          "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
                        p.stock_status === "out_of_stock" &&
                          "bg-destructive/10 text-destructive border-destructive/20"
                      )}
                    >
                      {p.stock_status === "in_stock" && "In Stock"}
                      {p.stock_status === "low_stock" && "Low Stock"}
                      {p.stock_status === "out_of_stock" && "Out of Stock"}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pb-4 text-xs">
                  {/* Prices Grid */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/50 text-center">
                    <div>
                      <div className="text-[10px] text-muted-foreground">Purchase Cost</div>
                      <div className="font-mono font-bold text-foreground">
                        Rs. {p.cost_price.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground">Retail MRP</div>
                      <div className="font-mono font-bold text-foreground">
                        Rs. {p.retail_price.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground">Wholesale</div>
                      <div className="font-mono font-bold text-muted-foreground">
                        Rs. {p.wholesale_price.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Stock across branches button */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-muted-foreground">Total Available Stock:</span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenDetail(p.id)}
                      className="h-7 text-xs font-mono font-bold gap-1"
                    >
                      {p.total_stock} {p.base_unit}s
                      <IconBuildingStore className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
                      {p.barcode ? (
                        <>
                          <IconBarcode className="h-3.5 w-3.5" />
                          {p.barcode}
                        </>
                      ) : (
                        <span className="italic">No barcode</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {canEditProduct && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(p)}
                          className="h-7 w-7 p-0"
                        >
                          <IconEdit className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {canDeleteProduct && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingProduct(p)}
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        >
                          <IconTrash className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          }))}
        </div>
        <Card className="border border-border/70 overflow-hidden shadow-sm">
          <DataTablePagination
            page={page}
            pageSize={pageSize}
            total={totalProducts}
            isLoading={isFetching}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
          />
        </Card>
      </div>
    )}

      {/* CREATE & EDIT PRODUCT MODAL (MULTI-TAB) */}
      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <IconBox className="h-5 w-5 text-primary" />
              {editingProductId ? "Edit Product Catalogue Item" : "Add New Product to Catalogue"}
            </DialogTitle>
            <DialogDescription>
              Configure product details, multi-tier pricing, wholesale packaging conversions, and stock thresholds.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProduct} className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full h-auto p-1 bg-muted/60 rounded-xl gap-1">
                <TabsTrigger value="general" className="py-2 text-xs sm:text-sm font-medium">
                  1. General Info
                </TabsTrigger>
                <TabsTrigger value="pricing" className="py-2 text-xs sm:text-sm font-medium">
                  2. Pricing & Taxes
                </TabsTrigger>
                <TabsTrigger value="uom" className="py-2 text-xs sm:text-sm font-medium">
                  3. Multi-UOM
                </TabsTrigger>
                <TabsTrigger value="stock" className="py-2 text-xs sm:text-sm font-medium">
                  4. Branch Stock
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: GENERAL INFO */}
              <TabsContent value="general" className="space-y-3 pt-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Name */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="prod_name">
                      Product Full Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="prod_name"
                      placeholder="e.g. Nestle MilkPak 1 Litre"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    {formErrors.name && (
                      <p className="text-xs text-destructive">{formErrors.name}</p>
                    )}
                  </div>

                  {/* SKU */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="prod_sku">
                        SKU Code <span className="text-destructive">*</span>
                      </Label>
                      <button
                        type="button"
                        onClick={() => setSku(`PRD-${Math.floor(1000 + Math.random() * 9000)}`)}
                        className="text-[11px] text-primary hover:underline"
                      >
                        Auto-generate
                      </button>
                    </div>
                    <Input
                      id="prod_sku"
                      placeholder="e.g. MPK-1L"
                      value={sku}
                      onChange={(e) => setSku(e.target.value.toUpperCase())}
                      className="font-mono uppercase"
                    />
                    {formErrors.sku && (
                      <p className="text-xs text-destructive">{formErrors.sku}</p>
                    )}
                  </div>

                  {/* Barcode */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="prod_barcode">Primary Barcode (EAN/UPC)</Label>
                      <button
                        type="button"
                        onClick={handleGenerateBarcode}
                        className="text-[11px] text-primary hover:underline"
                      >
                        Generate EAN-13
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        id="prod_barcode"
                        placeholder="Scan or enter barcode"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        className="font-mono pl-8"
                      />
                      <IconBarcode className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Category with Quick Add */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="prod_category">
                        Category <span className="text-destructive">*</span>
                      </Label>
                      <button
                        type="button"
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="text-[11px] text-primary hover:underline"
                      >
                        + Quick Add
                      </button>
                    </div>
                    <Select
                      value={categoryId ? String(categoryId) : ""}
                      onValueChange={(val) => setCategoryId(Number(val))}
                    >
                      <SelectTrigger id="prod_category">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.category && (
                      <p className="text-xs text-destructive">{formErrors.category}</p>
                    )}
                  </div>

                  {/* Brand with Quick Add */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="prod_brand">Brand / Principal</Label>
                      <button
                        type="button"
                        onClick={() => setIsBrandModalOpen(true)}
                        className="text-[11px] text-primary hover:underline"
                      >
                        + Quick Add
                      </button>
                    </div>
                    <Select
                      value={brandId ? String(brandId) : "0"}
                      onValueChange={(val) => setBrandId(Number(val))}
                    >
                      <SelectTrigger id="prod_brand">
                        <SelectValue placeholder="No Brand Assigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">None / Generic</SelectItem>
                        {brands.map((b) => (
                          <SelectItem key={b.id} value={String(b.id)}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Base Unit of Measure */}
                  <div className="space-y-1.5">
                    <Label htmlFor="prod_uom">Base Unit (UOM)</Label>
                    <Select value={baseUnit} onValueChange={setBaseUnit}>
                      <SelectTrigger id="prod_uom">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Piece">Piece (Pcs)</SelectItem>
                        <SelectItem value="Packet">Packet (Pkt)</SelectItem>
                        <SelectItem value="Kilogram">Kilogram (Kg)</SelectItem>
                        <SelectItem value="Gram">Gram (g)</SelectItem>
                        <SelectItem value="Litre">Litre (Ltr)</SelectItem>
                        <SelectItem value="Meter">Meter (m)</SelectItem>
                        <SelectItem value="Box">Box</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Active Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                    <div className="space-y-0.5">
                      <Label htmlFor="is_active" className="cursor-pointer font-medium text-xs">
                        Item Status
                      </Label>
                      <p className="text-[11px] text-muted-foreground">
                        Enable or disable for POS counter sales
                      </p>
                    </div>
                    <Switch
                      id="is_active"
                      checked={isActive}
                      onCheckedChange={setIsActive}
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="prod_desc">Product Description (Optional)</Label>
                    <Textarea
                      id="prod_desc"
                      placeholder="Specifications, packaging details, ingredients..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                    />
                  </div>

                  {/* Product Image / Visual Media (Morph Attachment) */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Product Visual / Image (Saved to Morph Attachments)</Label>
                    <div className="flex items-center gap-4 p-3 rounded-lg border border-dashed border-border/80 bg-muted/10">
                      <div className="relative h-16 w-16 shrink-0 rounded-lg border border-border bg-muted/30 flex items-center justify-center overflow-hidden">
                        {imagePreview ? (
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="h-full w-full object-cover"
                          />
                        ) : imageUrl ? (
                          <img
                            src={imageUrl}
                            alt="Current"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <IconPhoto className="h-6 w-6 text-muted-foreground/50" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <Input
                          id="prod_image_file"
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-primary file:text-primary-foreground hover:file:cursor-pointer"
                        />
                        <p className="text-[11px] text-muted-foreground">
                          Upload PNG, JPG, or SVG packaging image. Automatically uploaded to polymorphic attachments.
                        </p>
                      </div>
                      {(imageFile || imagePreview) && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                          }}
                          className="text-xs text-destructive hover:bg-destructive/10"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* TAB 2: PRICING & TAXES */}
              <TabsContent value="pricing" className="space-y-4 pt-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Purchase Cost */}
                  <div className="space-y-1.5">
                    <Label htmlFor="cost_price">
                      Purchase Cost Price (PKR) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="cost_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value === "" ? "" : Number(e.target.value))}
                      className="font-mono"
                    />
                    <p className="text-[11px] text-muted-foreground">Your landing purchase cost</p>
                  </div>

                  {/* Retail MRP */}
                  <div className="space-y-1.5">
                    <Label htmlFor="retail_price">
                      Retail Counter Price / MRP (PKR) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="retail_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={retailPrice}
                      onChange={(e) => setRetailPrice(e.target.value === "" ? "" : Number(e.target.value))}
                      className="font-mono font-semibold"
                    />
                    <p className="text-[11px] text-muted-foreground">POS checkout rate for walk-in customers</p>
                  </div>

                  {/* Wholesale Price */}
                  <div className="space-y-1.5">
                    <Label htmlFor="wholesale_price">Wholesale Trade Price (PKR)</Label>
                    <Input
                      id="wholesale_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={wholesalePrice}
                      onChange={(e) => setWholesalePrice(e.target.value === "" ? "" : Number(e.target.value))}
                      className="font-mono"
                    />
                    <p className="text-[11px] text-muted-foreground">Rate for distribution & bulk buyers</p>
                  </div>

                  {/* Min Price Floor */}
                  <div className="space-y-1.5">
                    <Label htmlFor="min_price">Minimum Floor Price (PKR)</Label>
                    <Input
                      id="min_price"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Optional price floor"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value === "" ? "" : Number(e.target.value))}
                      className="font-mono"
                    />
                    <p className="text-[11px] text-muted-foreground">Salesmen cannot discount below this floor</p>
                  </div>

                  {/* Margin Preview Banner */}
                  <div className="sm:col-span-2 p-3 rounded-lg border bg-muted/40 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Estimated Gross Margin:</span>
                    <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                      {marginPct}% markup (Rs. {(Number(retailPrice) - Number(costPrice)).toFixed(2)} / unit)
                    </span>
                  </div>

                  {/* Sales Tax Rate */}
                  <div className="space-y-1.5">
                    <Label htmlFor="tax_rate">Sales Tax Rate (%)</Label>
                    <Input
                      id="tax_rate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="0.00"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value === "" ? "" : Number(e.target.value))}
                      className="font-mono"
                    />
                    <p className="text-[11px] text-muted-foreground">Standard Pakistani sales tax is 18.00%</p>
                  </div>

                  {/* FBR 3rd Schedule Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                    <div className="space-y-0.5">
                      <Label htmlFor="fbr_third" className="cursor-pointer font-medium text-xs">
                        FBR Third Schedule Item
                      </Label>
                      <p className="text-[11px] text-muted-foreground">
                        Tax is levied on printed Retail MRP rather than wholesale price
                      </p>
                    </div>
                    <Switch
                      id="fbr_third"
                      checked={isThirdSchedule}
                      onCheckedChange={setIsThirdSchedule}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* TAB 3: MULTI-UOM CARTON CONVERSIONS */}
              <TabsContent value="uom" className="space-y-3 pt-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-semibold">Packaging Unit Conversions</h4>
                    <p className="text-[11px] text-muted-foreground">
                      Define wholesale boxes or cartons (e.g. 1 Carton = 24 Pieces). Selling 1 carton auto-deducts 24 pieces from inventory.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddUomConversion}
                    className="gap-1 text-xs"
                  >
                    <IconPlus className="h-3.5 w-3.5" />
                    Add Packaging Unit
                  </Button>
                </div>

                {uomConversions.length === 0 ? (
                  <div className="p-6 text-center border rounded-lg border-dashed text-xs text-muted-foreground">
                    No packaging units added. Product will be sold in base units ({baseUnit}).
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {uomConversions.map((conv, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border bg-muted/20 grid grid-cols-1 sm:grid-cols-5 gap-2 items-center text-xs"
                      >
                        <div>
                          <Label className="text-[11px]">Unit Name</Label>
                          <Input
                            value={conv.unit_name}
                            onChange={(e) => {
                              const copy = [...uomConversions];
                              copy[idx].unit_name = e.target.value;
                              setUomConversions(copy);
                            }}
                            placeholder="e.g. Carton (24)"
                            className="h-8 text-xs"
                          />
                        </div>

                        <div>
                          <Label className="text-[11px]">Pieces / Carton</Label>
                          <Input
                            type="number"
                            min="1"
                            value={conv.conversion_factor}
                            onChange={(e) => {
                              const copy = [...uomConversions];
                              copy[idx].conversion_factor = Number(e.target.value) || 1;
                              setUomConversions(copy);
                            }}
                            className="h-8 text-xs font-mono"
                          />
                        </div>

                        <div>
                          <Label className="text-[11px]">Carton Barcode</Label>
                          <Input
                            value={conv.carton_barcode || ""}
                            onChange={(e) => {
                              const copy = [...uomConversions];
                              copy[idx].carton_barcode = e.target.value;
                              setUomConversions(copy);
                            }}
                            placeholder="Barcode"
                            className="h-8 text-xs font-mono"
                          />
                        </div>

                        <div>
                          <Label className="text-[11px]">Carton Wholesale (Rs)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={conv.carton_wholesale_price || ""}
                            onChange={(e) => {
                              const copy = [...uomConversions];
                              copy[idx].carton_wholesale_price = Number(e.target.value) || 0;
                              setUomConversions(copy);
                            }}
                            className="h-8 text-xs font-mono"
                          />
                        </div>

                        <div className="flex items-center gap-1 pt-4 justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveUomConversion(idx)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <IconTrash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* TAB 4: BRANCH STOCKS & REORDER */}
              <TabsContent value="stock" className="space-y-4 pt-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reorder_level">Low Stock Alert Threshold (Overall)</Label>
                  <Input
                    id="reorder_level"
                    type="number"
                    min="0"
                    value={reorderLevel}
                    onChange={(e) => setReorderLevel(Number(e.target.value) || 0)}
                    className="font-mono h-9"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    System triggers a low-stock alert when total inventory drops below this quantity.
                  </p>
                </div>

                {!editingProductId && (
                  <div className="space-y-2 pt-2 border-t">
                    <Label className="text-xs font-semibold">
                      Initial Opening Stock per Shop / Godown
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Enter opening inventory counts for each registered physical location.
                    </p>

                    <div className="space-y-2">
                      {branches.map((b) => (
                        <div
                          key={b.id}
                          className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/20 text-xs"
                        >
                          <div className="space-y-0.5">
                            <span className="font-semibold text-foreground flex items-center gap-1.5">
                              {b.type === "warehouse_godown" ? (
                                <IconBuildingWarehouse className="h-3.5 w-3.5 text-blue-600" />
                              ) : (
                                <IconBuildingStore className="h-3.5 w-3.5 text-emerald-600" />
                              )}
                              {b.name}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-mono uppercase">
                              {b.code} — {b.city}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={initialStocks[b.id] || ""}
                              onChange={(e) =>
                                setInitialStocks({
                                  ...initialStocks,
                                  [b.id]: Number(e.target.value) || 0,
                                })
                              }
                              className="h-8 w-24 text-right font-mono"
                            />
                            <span className="text-xs text-muted-foreground">{baseUnit}s</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <DialogFooter className="pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsProductModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                {isSubmitting && <IconRefresh className="h-4 w-4 animate-spin" />}
                {isSubmitting
                  ? editingProductId
                    ? "Saving Changes..."
                    : "Creating Product..."
                  : editingProductId
                  ? "Save Changes"
                  : "Create Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* PRODUCT 360 STOCK BREAKDOWN DRAWER/MODAL */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <IconBuildingStore className="h-5 w-5 text-primary" />
              Multi-Branch Inventory: {detailProduct?.name}
            </DialogTitle>
            <DialogDescription>
              Real-time physical stock counts and low-stock alerts across all active shops and godowns.
            </DialogDescription>
          </DialogHeader>

          {detailProduct && (
            <div className="space-y-4 py-2">
              {/* Quick Details Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-lg bg-muted/40 border border-border/50 text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground">SKU / Code:</span>
                  <div className="font-mono font-bold">{detailProduct.sku}</div>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground">Barcode:</span>
                  <div className="font-mono">{detailProduct.barcode || "—"}</div>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground">Retail MRP:</span>
                  <div className="font-mono font-bold text-foreground">
                    Rs. {detailProduct.retail_price}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground">Total Stock:</span>
                  <div className="font-mono font-bold text-emerald-600">
                    {detailProduct.total_stock} {detailProduct.base_unit}s
                  </div>
                </div>
              </div>

              {/* Branch stock table */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Location Inventory Breakdown
                </h4>

                <div className="space-y-2">
                  {detailProduct.branch_stocks.map((bs) => {
                    const isEditingThis = stockEditBranchId === bs.branch_id;

                    return (
                      <div
                        key={bs.branch_id}
                        className="p-3 rounded-lg border bg-card flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-foreground flex items-center gap-1.5">
                            {bs.branch_type === "warehouse_godown" ? (
                              <IconBuildingWarehouse className="h-4 w-4 text-blue-600" />
                            ) : (
                              <IconBuildingStore className="h-4 w-4 text-emerald-600" />
                            )}
                            {bs.branch_name}
                          </div>
                          <div className="text-[11px] text-muted-foreground font-mono">
                            {bs.branch_code}
                          </div>
                        </div>

                        {isEditingThis ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              value={stockEditQty}
                              onChange={(e) => setStockEditQty(Number(e.target.value) || 0)}
                              className="h-8 w-24 text-right font-mono text-xs"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleSaveBranchStock(bs.branch_id)}
                              disabled={isUpdatingStock}
                              className="h-8 px-2.5 text-xs gap-1.5"
                            >
                              {isUpdatingStock && <IconRefresh className="h-3.5 w-3.5 animate-spin" />}
                              {isUpdatingStock ? "Saving..." : "Save"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setStockEditBranchId(null)}
                              className="h-8 px-2 text-xs"
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="font-mono font-bold text-sm text-foreground">
                                {bs.quantity}
                              </span>{" "}
                              <span className="text-muted-foreground">{detailProduct.base_unit}s</span>
                              {bs.reserved_quantity > 0 && (
                                <div className="text-[10px] text-amber-600">
                                  ({bs.reserved_quantity} reserved)
                                </div>
                              )}
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setStockEditBranchId(bs.branch_id);
                                setStockEditQty(bs.quantity);
                              }}
                              className="h-7 text-xs"
                            >
                              Adjust Stock
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* UOM packaging display */}
              {detailProduct.uom_conversions.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Packaging Conversions
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {detailProduct.uom_conversions.map((conv, i) => (
                      <div key={i} className="p-2 rounded border bg-muted/20 space-y-0.5">
                        <div className="font-semibold">{conv.unit_name}</div>
                        <div className="text-muted-foreground">
                          1 {conv.unit_name} = {conv.conversion_factor} {detailProduct.base_unit}s
                        </div>
                        {conv.carton_wholesale_price && (
                          <div className="font-mono text-foreground">
                            Wholesale: Rs. {conv.carton_wholesale_price}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CATEGORY MANAGEMENT & DIRECTORY MODAL */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <IconTag className="h-5 w-5 text-primary" />
              Category Management & Taxonomy
            </DialogTitle>
            <DialogDescription>
              Organize your product catalogue into standard FMCG categories and departments.
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={categoryModalTab}
            onValueChange={(val) => setCategoryModalTab(val as "list" | "create")}
            className="w-full pt-1"
          >
            <TabsList className="grid grid-cols-2 w-full h-9 bg-muted/60">
              <TabsTrigger value="list" className="text-xs">
                Category Directory ({categories.length})
              </TabsTrigger>
              <TabsTrigger value="create" className="text-xs">
                + Add New Category
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: CATEGORY DIRECTORY */}
            <TabsContent value="list" className="space-y-3 pt-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search categories by name or code..."
                    value={categorySearchQuery}
                    onChange={(e) => setCategorySearchQuery(e.target.value)}
                    className="pl-8 h-9 text-xs"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={() => setCategoryModalTab("create")}
                  className="h-9 gap-1 text-xs"
                >
                  <IconPlus className="h-3.5 w-3.5" />
                  Add Category
                </Button>
              </div>

              <div className="rounded-lg border divide-y max-h-[360px] overflow-y-auto">
                {categories
                  .filter(
                    (c) =>
                      c.name.toLowerCase().includes(categorySearchQuery.toLowerCase()) ||
                      c.code.toLowerCase().includes(categorySearchQuery.toLowerCase())
                  )
                  .map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setCategoryId(c.id);
                        setIsCategoryModalOpen(false);
                        toast.success(`Selected category: ${c.name}`);
                      }}
                      className={cn(
                        "p-3 flex items-center justify-between cursor-pointer transition-colors group",
                        categoryId === c.id
                          ? "bg-primary/10 border-l-4 border-l-primary font-medium"
                          : "hover:bg-muted/60"
                      )}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                            {c.name}
                          </span>
                          <span className="font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground border">
                            {c.code}
                          </span>
                        </div>
                        {c.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {c.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {c.product_count} {c.product_count === 1 ? "item" : "items"}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          Active
                        </span>
                        <Button
                          size="sm"
                          type="button"
                          variant={categoryId === c.id ? "default" : "outline"}
                          className="h-7 text-xs px-2.5 ml-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCategoryId(c.id);
                            setIsCategoryModalOpen(false);
                            toast.success(`Selected category: ${c.name}`);
                          }}
                        >
                          {categoryId === c.id ? "Selected" : "Select"}
                        </Button>
                      </div>
                    </div>
                  ))}

                {categories.length === 0 && (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    No categories registered yet.
                  </div>
                )}
              </div>
            </TabsContent>

            {/* TAB 2: CREATE CATEGORY FORM */}
            <TabsContent value="create" className="space-y-3 pt-3">
              <form onSubmit={handleCreateCategory} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cat_name">Category Name *</Label>
                  <Input
                    id="cat_name"
                    placeholder="e.g. Beverages & Juices"
                    value={categoryName}
                    onChange={(e) => {
                      setCategoryName(e.target.value);
                      if (!categoryCode) {
                        setCategoryCode(`CAT-${e.target.value.slice(0, 3).toUpperCase()}`);
                      }
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cat_code">Category Code *</Label>
                  <Input
                    id="cat_code"
                    placeholder="e.g. CAT-BEV"
                    value={categoryCode}
                    onChange={(e) => setCategoryCode(e.target.value.toUpperCase())}
                    className="font-mono uppercase"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cat_parent">Parent Category (Optional)</Label>
                  <Select
                    value={categoryParentId ? String(categoryParentId) : "0"}
                    onValueChange={(val) => setCategoryParentId(Number(val))}
                  >
                    <SelectTrigger id="cat_parent">
                      <SelectValue placeholder="Main Category (No Parent)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Main Category (No Parent)</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cat_desc">Description (Optional)</Label>
                  <Textarea
                    id="cat_desc"
                    placeholder="Category notes..."
                    value={categoryDesc}
                    onChange={(e) => setCategoryDesc(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCategoryModalTab("list")}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSavingQuickCategory}
                    className="gap-1.5"
                  >
                    {isSavingQuickCategory && <IconRefresh className="h-4 w-4 animate-spin" />}
                    {isSavingQuickCategory ? "Saving..." : "Save Category"}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>

          <DialogFooter className="pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCategoryModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* BRAND MANAGEMENT & DIRECTORY MODAL */}
      <Dialog open={isBrandModalOpen} onOpenChange={setIsBrandModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <IconBuildingFactory2 className="h-5 w-5 text-primary" />
              Brand & Principal Management
            </DialogTitle>
            <DialogDescription>
              Register and monitor manufacturers, brand principals, and suppliers.
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={brandModalTab}
            onValueChange={(val) => setBrandModalTab(val as "list" | "create")}
            className="w-full pt-1"
          >
            <TabsList className="grid grid-cols-2 w-full h-9 bg-muted/60">
              <TabsTrigger value="list" className="text-xs">
                Brand Directory ({brands.length})
              </TabsTrigger>
              <TabsTrigger value="create" className="text-xs">
                + Add New Brand
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: BRAND DIRECTORY */}
            <TabsContent value="list" className="space-y-3 pt-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search brands by name or code..."
                    value={brandSearchQuery}
                    onChange={(e) => setBrandSearchQuery(e.target.value)}
                    className="pl-8 h-9 text-xs"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={() => setBrandModalTab("create")}
                  className="h-9 gap-1 text-xs"
                >
                  <IconPlus className="h-3.5 w-3.5" />
                  Add Brand
                </Button>
              </div>

              <div className="rounded-lg border divide-y max-h-[360px] overflow-y-auto">
                {brands
                  .filter(
                    (b) =>
                      b.name.toLowerCase().includes(brandSearchQuery.toLowerCase()) ||
                      b.code.toLowerCase().includes(brandSearchQuery.toLowerCase())
                  )
                  .map((b) => (
                    <div
                      key={b.id}
                      onClick={() => {
                        setBrandId(b.id);
                        setIsBrandModalOpen(false);
                        toast.success(`Selected brand: ${b.name}`);
                      }}
                      className={cn(
                        "p-3 flex items-center justify-between cursor-pointer transition-colors group",
                        brandId === b.id
                          ? "bg-primary/10 border-l-4 border-l-primary font-medium"
                          : "hover:bg-muted/60"
                      )}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                            {b.name}
                          </span>
                          <span className="font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground border">
                            {b.code}
                          </span>
                        </div>
                        {b.origin && (
                          <span className="inline-block text-[11px] text-muted-foreground">
                            Origin: {b.origin}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {b.product_count} {b.product_count === 1 ? "item" : "items"}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          Active
                        </span>
                        <Button
                          size="sm"
                          type="button"
                          variant={brandId === b.id ? "default" : "outline"}
                          className="h-7 text-xs px-2.5 ml-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBrandId(b.id);
                            setIsBrandModalOpen(false);
                            toast.success(`Selected brand: ${b.name}`);
                          }}
                        >
                          {brandId === b.id ? "Selected" : "Select"}
                        </Button>
                      </div>
                    </div>
                  ))}

                {brands.length === 0 && (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    No brands registered yet.
                  </div>
                )}
              </div>
            </TabsContent>

            {/* TAB 2: CREATE BRAND FORM */}
            <TabsContent value="create" className="space-y-3 pt-3">
              <form onSubmit={handleCreateBrand} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="brand_name">Brand Name *</Label>
                  <Input
                    id="brand_name"
                    placeholder="e.g. Nestle Pakistan"
                    value={brandName}
                    onChange={(e) => {
                      setBrandName(e.target.value);
                      if (!brandCode) {
                        setBrandCode(`BRD-${e.target.value.slice(0, 3).toUpperCase()}`);
                      }
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="brand_code">Brand Code *</Label>
                  <Input
                    id="brand_code"
                    placeholder="e.g. BRD-NES"
                    value={brandCode}
                    onChange={(e) => setBrandCode(e.target.value.toUpperCase())}
                    className="font-mono uppercase"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="brand_origin">Country / Origin</Label>
                  <Input
                    id="brand_origin"
                    placeholder="e.g. Pakistan"
                    value={brandOrigin}
                    onChange={(e) => setBrandOrigin(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setBrandModalTab("list")}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSavingQuickBrand}
                    className="gap-1.5"
                  >
                    {isSavingQuickBrand && <IconRefresh className="h-4 w-4 animate-spin" />}
                    {isSavingQuickBrand ? "Saving..." : "Save Brand"}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>

          <DialogFooter className="pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsBrandModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE PRODUCT CONFIRMATION DIALOG */}
      <AlertDialog
        open={Boolean(deletingProduct)}
        onOpenChange={(open) => !open && setDeletingProduct(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <IconAlertTriangle className="h-5 w-5" />
              Remove Product from Catalogue?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Are you sure you want to permanently delete{" "}
                  <strong className="text-foreground">{deletingProduct?.name}</strong>{" "}
                  (<code>{deletingProduct?.sku}</code>)?
                </p>
                <p className="text-xs text-muted-foreground">
                  All associated packaging unit conversions and inventory records will be removed.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteProduct();
              }}
              disabled={isDeletingProduct}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5"
            >
              {isDeletingProduct && <IconRefresh className="h-4 w-4 animate-spin" />}
              {isDeletingProduct ? "Deleting..." : "Confirm Deletion"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
