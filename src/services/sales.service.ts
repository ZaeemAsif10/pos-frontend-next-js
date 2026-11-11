import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { emitAppEvent } from "@/lib/events";

// ==========================================
// SALES & POS INTERFACES
// ==========================================
export interface SalesInvoiceItemPayload {
  product_id: number;
  uom_id?: number | null;
  quantity: number;
  unit_price: number;
  discount_amount?: number;
  tax_rate?: number;
}

export interface SalesPaymentPayload {
  payment_method: string;
  amount: number;
  reference_no?: string | null;
}

export interface SalesCheckoutPayload {
  branch_id: number;
  customer_id?: number | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_ntn_cnic?: string | null;
  sale_type?: string;
  pos_shift_id?: number | null;
  discount_amount?: number;
  paid_amount?: number;
  payment_method?: string;
  payments?: SalesPaymentPayload[];
  notes?: string | null;
  items: SalesInvoiceItemPayload[];
}

export interface SalesInvoiceItemDetail {
  id: number;
  product_id: number;
  product_name?: string | null;
  sku?: string | null;
  barcode?: string | null;
  uom_id?: number | null;
  uom_name: string;
  quantity: number;
  unit_price: number;
  cost_price: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  pct_code?: string | null;
  total_amount: number;
}

export interface SalesPaymentDetail {
  id: number;
  payment_method: string;
  amount: number;
  reference_no?: string | null;
  payment_date: string;
}

export interface SalesInvoiceDetail {
  id: number;
  tenant_id: number;
  branch_id: number;
  branch_name?: string | null;
  customer_id?: number | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_ntn_cnic?: string | null;
  invoice_number: string;
  sale_type: string;
  invoice_date: string;
  payment_method: string;
  payment_status: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  change_amount: number;
  balance_due: number;
  fbr_pos_id?: string | null;
  fbr_invoice_number?: string | null;
  fbr_qr_code?: string | null;
  fbr_status: "mocked" | "synced" | "pending" | "failed" | "exempt";
  fbr_response_message?: string | null;
  fbr_synced_at?: string | null;
  status: string;
  notes?: string | null;
  cashier_name?: string | null;
  created_at: string;
  updated_at: string;
  items: SalesInvoiceItemDetail[];
  payments: SalesPaymentDetail[];
}

export interface SalesSummaryStats {
  today_sales: number;
  today_invoices_count: number;
  today_cash_collected: number;
  pending_fbr_sync_count: number;
}

export interface POSShiftDetail {
  id: number;
  tenant_id: number;
  branch_id: number;
  cashier_id: number;
  cashier_name?: string | null;
  branch_name?: string | null;
  opened_at: string;
  closed_at?: string | null;
  opening_cash: number;
  closing_cash?: number | null;
  expected_cash?: number | null;
  cash_difference?: number | null;
  status: "open" | "closed";
  notes?: string | null;
}

// ==========================================
export interface PaginatedSalesInvoicesResponse {
  items: SalesInvoiceDetail[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface DayBookEntryItem {
  id: string;
  entry_type: "sale" | "customer_payment" | "supplier_payment" | "expense";
  timestamp: string;
  voucher_no: string;
  party_name: string;
  payment_method: string;
  cash_in: number;
  cash_out: number;
  running_balance: number;
  user_name?: string | null;
  branch_name?: string | null;
  notes?: string | null;
}

export interface DayBookSummary {
  opening_cash: number;
  total_cash_in: number;
  total_cash_out: number;
  closing_cash: number;
  cash_sales: number;
  customer_wasooli: number;
  supplier_payments: number;
  cash_expenses?: number;
  non_cash_inflow: number;
  total_turnover: number;
  total_entries_count: number;
}

export interface DayBookPaymentMethodsSummary {
  cash: number;
  bank_transfer: number;
  card: number;
  raast: number;
  cheque: number;
  other: number;
}

export interface DayBookResponse {
  date: string;
  branch_id?: number | null;
  branch_name?: string | null;
  summary: DayBookSummary;
  payment_methods: DayBookPaymentMethodsSummary;
  entries: DayBookEntryItem[];
}

// SALES SERVICE CLASS
// ==========================================
class SalesService {
  async checkout(payload: SalesCheckoutPayload): Promise<SalesInvoiceDetail> {
    const res = await apiClient<SalesInvoiceDetail>(API_ENDPOINTS.TENANT.SALES_CHECKOUT, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    emitAppEvent("invoices:changed", "created", res);
    emitAppEvent("inventory:changed", "updated");
    emitAppEvent("products:changed", "updated");
    if (payload.customer_id) {
      emitAppEvent("customers:changed", "updated");
    }
    return res;
  }

  async listInvoices(params?: {
    branch_id?: number;
    fbr_status?: string;
    payment_status?: string;
    status?: string;
    search?: string;
    page?: number;
    size?: number;
    limit?: number;
    offset?: number;
  }): Promise<PaginatedSalesInvoicesResponse> {
    return apiClient<PaginatedSalesInvoicesResponse>(API_ENDPOINTS.TENANT.SALES_INVOICES, {
      params,
    });
  }

  async getInvoiceDetail(id: number): Promise<SalesInvoiceDetail> {
    return apiClient<SalesInvoiceDetail>(API_ENDPOINTS.TENANT.SALES_INVOICE_DETAIL(id));
  }

  async refundInvoice(id: number, reason?: string): Promise<SalesInvoiceDetail> {
    const res = await apiClient<SalesInvoiceDetail>(API_ENDPOINTS.TENANT.SALES_INVOICE_REFUND(id), {
      method: "POST",
      body: JSON.stringify({ reason: reason || "Customer Return / Refund" }),
    });
    emitAppEvent("invoices:changed", "updated", res);
    emitAppEvent("inventory:changed", "updated");
    emitAppEvent("products:changed", "updated");
    if (res.customer_id) {
      emitAppEvent("customers:changed", "updated");
    }
    return res;
  }

  async getSalesSummary(branch_id?: number): Promise<SalesSummaryStats> {
    const params = branch_id ? { branch_id } : undefined;
    return apiClient<SalesSummaryStats>(API_ENDPOINTS.TENANT.SALES_SUMMARY, {
      params,
    });
  }

  // POS Shifts
  async getCurrentShift(branchId: number): Promise<POSShiftDetail | null> {
    return apiClient<POSShiftDetail | null>(API_ENDPOINTS.TENANT.POS_SHIFTS_CURRENT, {
      params: { branch_id: branchId },
    });
  }

  async openShift(payload: { branch_id: number; opening_cash: number; notes?: string }): Promise<POSShiftDetail> {
    return apiClient<POSShiftDetail>(API_ENDPOINTS.TENANT.POS_SHIFTS_OPEN, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async closeShift(shiftId: number, payload: { closing_cash: number; notes?: string }): Promise<POSShiftDetail> {
    return apiClient<POSShiftDetail>(API_ENDPOINTS.TENANT.POS_SHIFTS_CLOSE(shiftId), {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // Day Book / Roznamcha
  async getDayBook(params?: {
    date?: string;
    branch_id?: number;
    payment_method?: string;
  }): Promise<DayBookResponse> {
    return apiClient<DayBookResponse>(API_ENDPOINTS.TENANT.DAYBOOK, {
      params,
    });
  }
}

export const salesService = new SalesService();
