"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import {
  IconTag,
  IconPlus,
  IconSearch,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconRefresh,
  IconAlertTriangle,
  IconLayersLinked,
  IconCheck,
  IconFolder,
  IconFolderPlus,
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
import { productService, type CategoryItem } from "@/services/product.service";

export default function CategoriesPage() {
  const { user, tenant } = useAuth();
  const userPerms = tenant?.permissions || [];
  const userRole = tenant?.role_name || "";
  const isOwnerOrAdmin =
    user?.is_superadmin ||
    userRole.toLowerCase() === "admin" ||
    userRole.toLowerCase() === "owner" ||
    userPerms.includes("*");

  const canCreateCategory = isOwnerOrAdmin || userPerms.includes("categories:create");
  const canEditCategory = isOwnerOrAdmin || userPerms.includes("categories:edit");
  const canDeleteCategory = isOwnerOrAdmin || userPerms.includes("categories:delete");

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [parentId, setParentId] = useState<number | 0>(0);
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Delete State
  const [deletingCategory, setDeletingCategory] = useState<CategoryItem | null>(null);

  // Load Data
  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await productService.listCategories();
      setCategories(data || []);
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to load product categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Reactive UI: auto-refresh categories table when categories change anywhere
  useAppEventListener("categories:changed", () => {
    loadCategories();
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && c.is_active) ||
        (statusFilter === "inactive" && !c.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [categories, search, statusFilter]);

  const paginatedCategories = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCategories.slice(start, start + pageSize);
  }, [filteredCategories, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  // Calculate Metrics
  const totalCategories = categories.length;
  const activeCount = categories.filter((c) => c.is_active).length;
  const subCategoryCount = categories.filter((c) => c.parent_id !== null).length;
  const totalProductsLinked = categories.reduce((acc, c) => acc + (c.product_count || 0), 0);

  // Open Modal for Add
  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName("");
    setCode("");
    setParentId(0);
    setDescription("");
    setIsActive(true);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (category: CategoryItem) => {
    setEditingCategory(category);
    setName(category.name);
    setCode(category.code);
    setParentId(category.parent_id || 0);
    setDescription(category.description || "");
    setIsActive(category.is_active);
    setIsModalOpen(true);
  };

  // Save Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }
    const finalCode = (code.trim() || `CAT-${name.slice(0, 3).toUpperCase()}`).toUpperCase();

    try {
      setIsSubmitting(true);
      if (editingCategory) {
        await productService.updateCategory(editingCategory.id, {
          name: name.trim(),
          code: finalCode,
          parent_id: parentId === 0 ? null : parentId,
          description: description.trim() || null,
          is_active: isActive,
        });
        toast.success(`Category "${name}" updated successfully!`);
      } else {
        await productService.createCategory({
          name: name.trim(),
          code: finalCode,
          parent_id: parentId === 0 ? null : parentId,
          description: description.trim() || null,
          is_active: isActive,
        });
        toast.success(`Category "${name}" created successfully!`);
      }

      setIsModalOpen(false);
      loadCategories();
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to save category");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Category
  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    try {
      setIsDeleting(true);
      await productService.deleteCategory(deletingCategory.id);
      toast.success(`Category "${deletingCategory.name}" removed successfully!`);
      setDeletingCategory(null);
      loadCategories();
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to delete category");
    } finally {
      setIsDeleting(false);
    }
  };

  // Parent Category Name Helper
  const getParentName = (pId: number | null) => {
    if (!pId) return "Root (Main)";
    const parent = categories.find((c) => c.id === pId);
    return parent ? parent.name : `Parent #${pId}`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <IconTag className="h-6 w-6 text-primary" />
            Product Categories
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Organize products into FMCG departments, parent categories, and sub-categories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadCategories}
            disabled={loading}
            className="gap-2"
          >
            <IconRefresh className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>

          {canCreateCategory && (
            <Button onClick={handleOpenAdd} className="gap-2 font-medium shadow-sm">
              <IconPlus className="h-4 w-4" />
              Add Category
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Categories
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <IconTag className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalCategories}</div>
            <p className="text-xs text-muted-foreground mt-1">Configured classifications</p>
          </CardContent>
        </Card>

        <Card className="border border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Active Status
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <IconCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{activeCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Available in POS & Catalogue</p>
          </CardContent>
        </Card>

        <Card className="border border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Sub-Categories
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <IconFolder className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{subCategoryCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Nested under parent groups</p>
          </CardContent>
        </Card>

        <Card className="border border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Assigned Products
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <IconLayersLinked className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalProductsLinked}</div>
            <p className="text-xs text-muted-foreground mt-1">Catalogue items classified</p>
          </CardContent>
        </Card>
      </div>

      {/* SINGLE UNIFIED CATEGORIES TABLE CARD */}
      <Card className="overflow-hidden border border-border/70 shadow-sm">
        {/* CARD HEADER TOOLBAR: Search & Filters on the LEFT */}
        <div className="p-3.5 border-b bg-card/60 flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center flex-1">
            <div className="relative w-full sm:w-72 md:w-80">
              <IconSearch className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search category name, code, description..."
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
            {filteredCategories.length} Categories Found
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[30%]">Category Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Parent Group</TableHead>
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
                      <p className="text-sm font-medium text-muted-foreground">Loading product categories...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground">
                    No categories found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCategories.map((c) => (
                <TableRow key={c.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                        <IconTag className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-foreground">{c.name}</div>
                        {c.description && (
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {c.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs uppercase bg-muted/50">
                      {c.code}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground font-medium">
                    {c.parent_id ? (
                      <span className="flex items-center gap-1 text-foreground">
                        <IconFolder className="h-3.5 w-3.5 text-blue-500" />
                        {getParentName(c.parent_id)}
                      </span>
                    ) : (
                      <span className="italic text-muted-foreground">Root Level</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="font-mono text-xs px-2 py-0.5 bg-primary/10 text-primary border border-primary/20"
                    >
                      {c.product_count} {c.product_count === 1 ? "item" : "items"}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    {c.is_active ? (
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
                        {canEditCategory && (
                          <DropdownMenuItem
                            onClick={() => handleOpenEdit(c)}
                            className="text-xs gap-2"
                          >
                            <IconEdit className="h-4 w-4" />
                            Edit Category
                          </DropdownMenuItem>
                        )}
                        {canDeleteCategory && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeletingCategory(c)}
                              className="text-xs gap-2 text-destructive focus:text-destructive"
                            >
                              <IconTrash className="h-4 w-4" />
                              Delete Category
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
          total={filteredCategories.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </Card>

      {/* CREATE / EDIT CATEGORY DIALOG */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconTag className="h-5 w-5 text-primary" />
              {editingCategory ? "Edit Product Category" : "Add Product Category"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Update category taxonomy, code, and parent classification."
                : "Create a new department or sub-category to organize inventory."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCategory} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cat_name">
                Category Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cat_name"
                placeholder="e.g. Beverages & Drinks"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!editingCategory && !code) {
                    setCode(`CAT-${e.target.value.slice(0, 3).toUpperCase()}`);
                  }
                }}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="cat_code">
                  Category Code <span className="text-destructive">*</span>
                </Label>
                <button
                  type="button"
                  onClick={() => setCode(`CAT-${Math.floor(100 + Math.random() * 900)}`)}
                  className="text-[11px] text-primary hover:underline"
                >
                  Generate Code
                </button>
              </div>
              <Input
                id="cat_code"
                placeholder="e.g. CAT-BEV"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="font-mono uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cat_parent">Parent Group (Optional)</Label>
              <Select
                value={parentId ? String(parentId) : "0"}
                onValueChange={(val) => setParentId(Number(val))}
              >
                <SelectTrigger id="cat_parent">
                  <SelectValue placeholder="Main Category (Root)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Main Category (Root - No Parent)</SelectItem>
                  {categories
                    .filter((c) => !editingCategory || c.id !== editingCategory.id)
                    .map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name} ({c.code})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cat_desc">Description (Optional)</Label>
              <Textarea
                id="cat_desc"
                placeholder="Juices, mineral water, soft drinks, etc."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="cat_active">Active Category</Label>
                <p className="text-xs text-muted-foreground">
                  Inactive categories are hidden from product creation and POS.
                </p>
              </div>
              <Switch id="cat_active" checked={isActive} onCheckedChange={setIsActive} />
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
                  ? editingCategory
                    ? "Saving Changes..."
                    : "Creating Category..."
                  : editingCategory
                  ? "Save Changes"
                  : "Create Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <AlertDialog
        open={Boolean(deletingCategory)}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <IconAlertTriangle className="h-5 w-5" />
              Delete Category "{deletingCategory?.name}"?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Are you sure you want to permanently delete category{" "}
                  <strong className="text-foreground">{deletingCategory?.name}</strong> ({deletingCategory?.code})?
                </p>
                {deletingCategory && (deletingCategory.product_count ?? 0) > 0 && (
                  <p className="text-xs text-destructive font-medium bg-destructive/10 p-2 rounded">
                    Warning: There are {deletingCategory.product_count} products currently assigned to this
                    category. You must reassign or remove them first.
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
                handleDeleteCategory();
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
