import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { emitAppEvent } from "@/lib/events";

// ==========================================
// PURCHASE TYPES & PAYLOADS
// ==========================================
export interface PurchaseItemPayload {
  product_id: number;
  uom_conversion_id?: number | null;
  unit_name: string;
  quantity: number;
  conversion_factor?: number;
  unit_cost: number;
  retail_price?: number;
  tax_rate?: number;
  tax_amount?: number;
  batch_number?: string | null;
  expiry_date?: string | null;
}

export interface PurchaseItemDetail {
  id: number;
  purchase_id: number;
  product_id: number;
  product_name?: string | null;
  product_sku?: string | null;
  unit_name: string;
  quantity: number;
  returned_quantity?: number;
  conversion_factor: number;
  total_base_quantity: number;
  unit_cost: number;
  retail_price?: number;
  tax_rate?: number;
  tax_amount?: number;
  total_cost: number;
  batch_number?: string | null;
  expiry_date?: string | null;
}

export interface PurchaseReturnItemInput {
  purchase_item_id?: number | null;
  product_id: number;
  unit_name: string;
  quantity: number;
  conversion_factor?: number;
  unit_cost: number;
}

export interface PurchaseReturnItemRecord {
  id: number;
  purchase_return_id: number;
  purchase_item_id?: number | null;
  product_id: number;
  product_name?: string | null;
  product_sku?: string | null;
  unit_name: string;
  quantity: number;
  conversion_factor: number;
  total_base_quantity: number;
  unit_cost: number;
  total_cost: number;
}

export interface PurchaseReturnRecord {
  id: number;
  tenant_id: number;
  purchase_id?: number | null;
  purchase_invoice_number?: string | null;
  branch_id: number;
  branch_name?: string | null;
  supplier_id: number;
  supplier_name?: string | null;
  return_number: string;
  return_date: string;
  total_qty: number;
  total_amount: number;
  refund_method: string;
  refund_account_id?: number | null;
  refund_account_name?: string | null;
  refund_account_code?: string | null;
  journal_entry_number?: string | null;
  reason?: string | null;
  notes?: string | null;
  created_at: string;
  items: PurchaseReturnItemRecord[];
}

export interface StandalonePurchaseReturnCreatePayload {
  branch_id: number;
  supplier_id: number;
  purchase_id?: number | null;
  return_date?: string;
  refund_method: string;
  refund_account_id?: number | null;
  reason?: string | null;
  notes?: string | null;
  items: PurchaseReturnItemInput[];
}

export interface PurchaseCreatePayload {
  branch_id: number;
  supplier_id: number;
  supplier_bill_no?: string | null;
  purchase_date?: string;
  payment_status?: string;
  discount_amount?: number;
  tax_amount?: number;
  shipping_cost?: number;
  paid_amount?: number;
  paid_from_account_id?: number | null;
  notes?: string | null;
  items: PurchaseItemPayload[];
}

export interface PurchaseUpdatePayload {
  payment_status?: string;
  paid_amount?: number;
  paid_from_account_id?: number | null;
  supplier_bill_no?: string | null;
  notes?: string | null;
  status?: string;
}

export interface PaymentStatusOptionItem {
  id: number;
  tenant_id: number;
  name: string;
  code: string;
  accounting_type: "paid" | "unpaid" | "partial";
  color: string;
  description?: string | null;
  is_system: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentStatusOptionCreatePayload {
  name: string;
  code?: string;
  accounting_type: "paid" | "unpaid" | "partial";
  color?: string;
  description?: string | null;
  is_active?: boolean;
}

export interface PaymentStatusOptionUpdatePayload {
  name?: string;
  accounting_type?: "paid" | "unpaid" | "partial";
  color?: string;
  description?: string | null;
  is_active?: boolean;
}

export interface PurchaseItem {
  id: number;
  tenant_id: number;
  invoice_number: string;
  supplier_bill_no?: string | null;
  purchase_date: string;
  status: string;
  payment_status: string;
  branch_id: number;
  branch_name?: string | null;
  supplier_id: number;
  supplier_name?: string | null;
  items_count: number;
  total_qty?: number;
  returned_qty?: number;
  returned_amount?: number;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  shipping_cost: number;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  paid_from_account_id?: number | null;
  paid_from_account_name?: string | null;
  paid_from_account_code?: string | null;
  journal_entry_number?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseDetail extends PurchaseItem {
  items: PurchaseItemDetail[];
}

export interface PurchaseStats {
  total_purchases_count: number;
  total_purchases_amount: number;
  total_unpaid_payables: number;
  monthly_purchases_amount: number;
}

// ==========================================
// LIVE INVENTORY & STOCK MOVEMENTS
// ==========================================
export interface LiveInventoryItem {
  product_id: number;
  product_name: string;
  sku: string;
  barcode?: string | null;
  category_id?: number | null;
  category_name?: string | null;
  brand_id?: number | null;
  brand_name?: string | null;
  base_unit: string;
  branch_id: number;
  branch_name: string;
  current_stock: number;
  reorder_point: number;
  cost_price: number;
  retail_price: number;
  wholesale_price?: number;
  tax_rate?: number;
  is_fbr_third_schedule?: boolean;
  image_url?: string | null;
  stock_status: "In Stock" | "Low Stock" | "Out of Stock";
}

export interface StockMovementItem {
  id: number;
  branch_id: number;
  branch_name?: string | null;
  product_id: number;
  product_name?: string | null;
  movement_type: string;
  quantity: number;
  balance_after: number;
  unit_cost: number;
  reference_type: string;
  reference_id: number;
  notes?: string | null;
  created_at: string;
}

// ==========================================
// STOCK TRANSFERS & ADJUSTMENTS PAYLOADS
// ==========================================
export interface StockTransferCreatePayload {
  from_branch_id: number;
  to_branch_id: number;
  transfer_date?: string;
  notes?: string | null;
  items: {
    product_id: number;
    quantity: number;
  }[];
}

export interface StockAdjustmentCreatePayload {
  branch_id: number;
  reason: string;
  adjustment_date?: string;
  notes?: string | null;
  items: {
    product_id: number;
    adjustment_type: "ADD" | "SUBTRACT";
    quantity: number;
  }[];
}

// ==========================================
// SERVICE IMPLEMENTATION
// ==========================================
class InventoryService {
  // ----------------------------------------
  // Purchases
  // ----------------------------------------
  async getPurchaseStats(): Promise<PurchaseStats> {
    return apiClient<PurchaseStats>(API_ENDPOINTS.TENANT.PURCHASES_STATS);
  }

  async listPurchases(params?: {
    branch_id?: number;
    supplier_id?: number;
    payment_status?: string;
    search?: string;
  }): Promise<PurchaseItem[]> {
    return apiClient<PurchaseItem[]>(API_ENDPOINTS.TENANT.PURCHASES, {
      params,
    });
  }

  async getPurchaseDetail(id: number): Promise<PurchaseDetail> {
    return apiClient<PurchaseDetail>(API_ENDPOINTS.TENANT.PURCHASE_DETAIL(id));
  }

  async createPurchase(payload: PurchaseCreatePayload): Promise<PurchaseItem> {
    const res = await apiClient<PurchaseItem>(API_ENDPOINTS.TENANT.PURCHASES, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    emitAppEvent("purchases:changed", "created", res);
    emitAppEvent("inventory:changed", "updated");
    emitAppEvent("products:changed", "updated");
    emitAppEvent("suppliers:changed", "updated");
    emitAppEvent("accounting:changed", "updated");
    return res;
  }

  async updatePurchase(id: number, payload: PurchaseUpdatePayload): Promise<PurchaseItem> {
    const res = await apiClient<PurchaseItem>(API_ENDPOINTS.TENANT.PURCHASE_DETAIL(id), {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    emitAppEvent("purchases:changed", "updated", res);
    emitAppEvent("suppliers:changed", "updated");
    emitAppEvent("accounting:changed", "updated");
    return res;
  }

  async listPaymentStatuses(activeOnly = false): Promise<PaymentStatusOptionItem[]> {
    return apiClient<PaymentStatusOptionItem[]>(API_ENDPOINTS.TENANT.PAYMENT_STATUSES, {
      params: activeOnly ? { active_only: true } : undefined,
    });
  }

  async createPaymentStatus(payload: PaymentStatusOptionCreatePayload): Promise<PaymentStatusOptionItem> {
    const res = await apiClient<PaymentStatusOptionItem>(API_ENDPOINTS.TENANT.PAYMENT_STATUSES, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    emitAppEvent("purchases:changed", "updated");
    return res;
  }

  async updatePaymentStatus(
    id: number,
    payload: PaymentStatusOptionUpdatePayload
  ): Promise<PaymentStatusOptionItem> {
    const res = await apiClient<PaymentStatusOptionItem>(
      API_ENDPOINTS.TENANT.PAYMENT_STATUS_DETAIL(id),
      {
        method: "PUT",
        body: JSON.stringify(payload),
      }
    );
    emitAppEvent("purchases:changed", "updated");
    return res;
  }

  async deletePaymentStatus(id: number): Promise<{ message: string }> {
    const res = await apiClient<{ message: string }>(
      API_ENDPOINTS.TENANT.PAYMENT_STATUS_DETAIL(id),
      {
        method: "DELETE",
      }
    );
    emitAppEvent("purchases:changed", "updated");
    return res;
  }

  async deletePurchase(id: number): Promise<{ message: string }> {
    const res = await apiClient<{ message: string }>(API_ENDPOINTS.TENANT.PURCHASE_DETAIL(id), {
      method: "DELETE",
    });
    emitAppEvent("purchases:changed", "deleted", { id });
    emitAppEvent("inventory:changed", "updated");
    emitAppEvent("products:changed", "updated");
    return res;
  }

  async returnPurchase(
    id: number,
    payload?: {
      reason?: string;
      refund_payment_method?: string;
      refund_account_id?: number | null;
      notes?: string | null;
      items?: PurchaseReturnItemInput[];
    }
  ): Promise<PurchaseDetail> {
    const res = await apiClient<PurchaseDetail>(API_ENDPOINTS.TENANT.PURCHASE_RETURN(id), {
      method: "POST",
      body: JSON.stringify(payload || {}),
    });
    emitAppEvent("purchases:changed", "updated", res);
    emitAppEvent("inventory:changed", "updated");
    emitAppEvent("products:changed", "updated");
    emitAppEvent("suppliers:changed", "updated");
    emitAppEvent("accounting:changed", "updated");
    return res;
  }

  async listPurchaseReturns(params?: {
    branch_id?: number;
    supplier_id?: number;
    search?: string;
  }): Promise<PurchaseReturnRecord[]> {
    return apiClient<PurchaseReturnRecord[]>(API_ENDPOINTS.TENANT.PURCHASE_RETURNS, {
      params,
    });
  }

  async createStandalonePurchaseReturn(
    payload: StandalonePurchaseReturnCreatePayload
  ): Promise<PurchaseReturnRecord> {
    const res = await apiClient<PurchaseReturnRecord>(API_ENDPOINTS.TENANT.PURCHASE_RETURNS, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    emitAppEvent("purchases:changed", "updated");
    emitAppEvent("inventory:changed", "updated");
    emitAppEvent("products:changed", "updated");
    emitAppEvent("suppliers:changed", "updated");
    emitAppEvent("accounting:changed", "updated");
    return res;
  }

  // ----------------------------------------
  // Live Inventory
  // ----------------------------------------
  async listLiveInventory(params?: {
    branch_id?: number;
    category_id?: number;
    brand_id?: number;
    stock_status?: string;
    search?: string;
  }): Promise<LiveInventoryItem[]> {
    return apiClient<LiveInventoryItem[]>(API_ENDPOINTS.TENANT.INVENTORY, {
      params,
    });
  }

  async getProductLedger(productId: number, branchId?: number): Promise<StockMovementItem[]> {
    const params = branchId ? { branch_id: branchId } : undefined;
    return apiClient<StockMovementItem[]>(API_ENDPOINTS.TENANT.INVENTORY_LEDGER(productId), {
      params,
    });
  }

  // ----------------------------------------
  // Stock Transfers & Adjustments
  // ----------------------------------------
  async createStockTransfer(payload: StockTransferCreatePayload): Promise<any> {
    const res = await apiClient<any>(API_ENDPOINTS.TENANT.STOCK_TRANSFERS, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    emitAppEvent("inventory:changed", "updated", res);
    emitAppEvent("products:changed", "updated");
    return res;
  }

  async createStockAdjustment(payload: StockAdjustmentCreatePayload): Promise<any> {
    const res = await apiClient<any>(API_ENDPOINTS.TENANT.STOCK_ADJUSTMENTS, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    emitAppEvent("inventory:changed", "updated", res);
    emitAppEvent("products:changed", "updated");
    return res;
  }
}

export const inventoryService = new InventoryService();
