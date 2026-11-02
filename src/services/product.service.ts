import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { emitAppEvent } from "@/lib/events";

export interface CategoryItem {
  id: number;
  tenant_id: number;
  parent_id?: number | null;
  name: string;
  code: string;
  description?: string | null;
  is_active: boolean;
  product_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryCreatePayload {
  name: string;
  code: string;
  parent_id?: number | null;
  description?: string | null;
  is_active?: boolean;
}

export interface BrandItem {
  id: number;
  tenant_id: number;
  name: string;
  code: string;
  origin?: string | null;
  description?: string | null;
  is_active: boolean;
  product_count?: number;
  created_at: string;
  updated_at: string;
}

export interface BrandCreatePayload {
  name: string;
  code: string;
  origin?: string | null;
  description?: string | null;
  is_active?: boolean;
}

export interface ProductUOMConversionItem {
  id?: number;
  unit_name: string;
  conversion_factor: number;
  carton_barcode?: string | null;
  carton_wholesale_price?: number | null;
  carton_retail_price?: number | null;
}

export interface BranchStockItem {
  id: number;
  branch_id: number;
  branch_name: string;
  branch_code: string;
  branch_type: string;
  quantity: number;
  reserved_quantity: number;
  reorder_point?: number | null;
  updated_at: string;
}

export interface ProductListItem {
  id: number;
  name: string;
  sku: string;
  barcode?: string | null;
  category_id: number;
  category_name: string;
  brand_id?: number | null;
  brand_name?: string | null;
  base_unit: string;
  cost_price: number;
  retail_price: number;
  wholesale_price: number;
  tax_rate: number;
  is_fbr_third_schedule: boolean;
  has_batches: boolean;
  reorder_level: number;
  image_url?: string | null;
  is_active: boolean;
  total_stock: number;
  stock_status: "in_stock" | "low_stock" | "out_of_stock";
  created_at: string;
}

export interface ProductDetailItem {
  id: number;
  tenant_id: number;
  name: string;
  sku: string;
  barcode?: string | null;
  category_id: number;
  category_name: string;
  brand_id?: number | null;
  brand_name?: string | null;
  base_unit: string;
  cost_price: number;
  retail_price: number;
  wholesale_price: number;
  min_price?: number | null;
  tax_rate: number;
  is_fbr_third_schedule: boolean;
  has_batches: boolean;
  reorder_level: number;
  image_url?: string | null;
  description?: string | null;
  is_active: boolean;
  total_stock: number;
  stock_status: "in_stock" | "low_stock" | "out_of_stock";
  uom_conversions: ProductUOMConversionItem[];
  branch_stocks: BranchStockItem[];
  created_at: string;
  updated_at: string;
}

export interface ProductStats {
  total_products: number;
  total_inventory_value: number;
  low_stock_count: number;
  out_of_stock_count: number;
}

export interface ProductListResponse {
  items: ProductListItem[];
  total: number;
  page: number;
  size: number;
  stats: ProductStats;
}

export interface ProductCreatePayload {
  name: string;
  sku: string;
  barcode?: string | null;
  category_id: number;
  brand_id?: number | null;
  base_unit?: string;
  cost_price: number;
  retail_price: number;
  wholesale_price: number;
  min_price?: number | null;
  tax_rate?: number;
  is_fbr_third_schedule?: boolean;
  has_batches?: boolean;
  reorder_level?: number;
  image_url?: string | null;
  description?: string | null;
  is_active?: boolean;
  uom_conversions?: ProductUOMConversionItem[];
  initial_stocks?: { branch_id: number; quantity: number; reorder_point?: number }[];
}

export interface ProductUpdatePayload {
  name?: string;
  sku?: string;
  barcode?: string | null;
  category_id?: number;
  brand_id?: number | null;
  base_unit?: string;
  cost_price?: number;
  retail_price?: number;
  wholesale_price?: number;
  min_price?: number | null;
  tax_rate?: number;
  is_fbr_third_schedule?: boolean;
  has_batches?: boolean;
  reorder_level?: number;
  image_url?: string | null;
  description?: string | null;
  is_active?: boolean;
  uom_conversions?: ProductUOMConversionItem[];
}

export const productService = {
  // PRODUCTS
  async listProducts(params?: {
    search?: string;
    category_id?: number;
    brand_id?: number;
    stock_status?: string;
    is_active?: boolean;
    page?: number;
    size?: number;
  }): Promise<ProductListResponse> {
    const sp = new URLSearchParams();
    if (params?.search) sp.append("search", params.search);
    if (params?.category_id) sp.append("category_id", String(params.category_id));
    if (params?.brand_id) sp.append("brand_id", String(params.brand_id));
    if (params?.stock_status && params.stock_status !== "all") sp.append("stock_status", params.stock_status);
    if (params?.is_active !== undefined) sp.append("is_active", String(params.is_active));
    if (params?.page) sp.append("page", String(params.page));
    if (params?.size) sp.append("size", String(params.size));

    const qs = sp.toString();
    const url = qs ? `${API_ENDPOINTS.TENANT.PRODUCTS}?${qs}` : API_ENDPOINTS.TENANT.PRODUCTS;
    return apiClient<ProductListResponse>(url, { method: "GET" });
  },

  async getProduct(productId: number): Promise<ProductDetailItem> {
    return apiClient<ProductDetailItem>(API_ENDPOINTS.TENANT.PRODUCT_DETAIL(productId), {
      method: "GET",
    });
  },

  async createProduct(payload: ProductCreatePayload): Promise<ProductDetailItem> {
    const res = await apiClient<ProductDetailItem>(API_ENDPOINTS.TENANT.PRODUCTS, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    emitAppEvent("products:changed", "created", res);
    return res;
  },

  async updateProduct(productId: number, payload: ProductUpdatePayload): Promise<ProductDetailItem> {
    const res = await apiClient<ProductDetailItem>(API_ENDPOINTS.TENANT.PRODUCT_DETAIL(productId), {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    emitAppEvent("products:changed", "updated", res);
    return res;
  },

  async deleteProduct(productId: number): Promise<{ message: string }> {
    const res = await apiClient<{ message: string }>(API_ENDPOINTS.TENANT.PRODUCT_DETAIL(productId), {
      method: "DELETE",
    });
    emitAppEvent("products:changed", "deleted", { id: productId });
    return res;
  },

  async updateBranchStock(
    productId: number,
    branchId: number,
    quantity: number,
    reorderPoint?: number
  ): Promise<BranchStockItem> {
    const sp = new URLSearchParams({ quantity: String(quantity) });
    if (reorderPoint !== undefined) sp.append("reorder_point", String(reorderPoint));

    const res = await apiClient<BranchStockItem>(
      `${API_ENDPOINTS.TENANT.PRODUCT_BRANCH_STOCK(productId, branchId)}?${sp.toString()}`,
      { method: "PUT" }
    );
    emitAppEvent("products:changed", "updated", { productId, branchId, quantity });
    return res;
  },

  // CATEGORIES
  async listCategories(): Promise<CategoryItem[]> {
    return apiClient<CategoryItem[]>(API_ENDPOINTS.TENANT.CATEGORIES, { method: "GET" });
  },

  async createCategory(payload: CategoryCreatePayload): Promise<CategoryItem> {
    const res = await apiClient<CategoryItem>(API_ENDPOINTS.TENANT.CATEGORIES, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    emitAppEvent("categories:changed", "created", res);
    return res;
  },

  async updateCategory(categoryId: number, payload: Partial<CategoryCreatePayload>): Promise<CategoryItem> {
    const res = await apiClient<CategoryItem>(API_ENDPOINTS.TENANT.CATEGORY_DETAIL(categoryId), {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    emitAppEvent("categories:changed", "updated", res);
    return res;
  },

  async deleteCategory(categoryId: number): Promise<{ message: string }> {
    const res = await apiClient<{ message: string }>(API_ENDPOINTS.TENANT.CATEGORY_DETAIL(categoryId), {
      method: "DELETE",
    });
    emitAppEvent("categories:changed", "deleted", { id: categoryId });
    return res;
  },

  // BRANDS
  async listBrands(): Promise<BrandItem[]> {
    return apiClient<BrandItem[]>(API_ENDPOINTS.TENANT.BRANDS, { method: "GET" });
  },

  async createBrand(payload: BrandCreatePayload): Promise<BrandItem> {
    const res = await apiClient<BrandItem>(API_ENDPOINTS.TENANT.BRANDS, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    emitAppEvent("brands:changed", "created", res);
    return res;
  },

  async updateBrand(brandId: number, payload: Partial<BrandCreatePayload>): Promise<BrandItem> {
    const res = await apiClient<BrandItem>(API_ENDPOINTS.TENANT.BRAND_DETAIL(brandId), {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    emitAppEvent("brands:changed", "updated", res);
    return res;
  },

  async deleteBrand(brandId: number): Promise<{ message: string }> {
    const res = await apiClient<{ message: string }>(API_ENDPOINTS.TENANT.BRAND_DETAIL(brandId), {
      method: "DELETE",
    });
    emitAppEvent("brands:changed", "deleted", { id: brandId });
    return res;
  },
};
