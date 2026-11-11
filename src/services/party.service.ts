import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { emitAppEvent } from "@/lib/events";

// ==========================================
// DELIVERY AREA TYPES & PAYLOADS
// ==========================================
export interface DeliveryAreaItem {
  id: number;
  tenant_id: number;
  code: string;
  name: string;
  city: string;
  description?: string | null;
  delivery_days?: string | null;
  assigned_salesman_id?: number | null;
  assigned_salesman_name?: string | null;
  customer_count?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeliveryAreaCreatePayload {
  code: string;
  name: string;
  city?: string;
  description?: string | null;
  delivery_days?: string | null;
  assigned_salesman_id?: number | null;
  is_active?: boolean;
}

export interface DeliveryAreaUpdatePayload {
  code?: string;
  name?: string;
  city?: string;
  description?: string | null;
  delivery_days?: string | null;
  assigned_salesman_id?: number | null;
  is_active?: boolean;
}

// ==========================================
// CUSTOMER TYPES & PAYLOADS
// ==========================================
export interface CustomerItem {
  id: number;
  tenant_id: number;
  code: string;
  business_name: string;
  owner_name?: string | null;
  phone: string;
  whatsapp_number?: string | null;
  email?: string | null;
  cnic?: string | null;
  ntn?: string | null;
  strn?: string | null;
  customer_type: string;
  credit_limit: number;
  credit_days: number;
  opening_balance: number;
  current_balance: number;
  is_credit_blocked: boolean;
  area_id?: number | null;
  area_name?: string | null;
  branch_id?: number | null;
  branch_name?: string | null;
  city: string;
  address?: string | null;
  kyc_status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerStats {
  total_customers: number;
  total_receivables: number;
  overdue_accounts: number;
  credit_blocked_count: number;
}

export interface CustomerCreatePayload {
  code: string;
  business_name: string;
  owner_name?: string | null;
  phone: string;
  whatsapp_number?: string | null;
  email?: string | null;
  cnic?: string | null;
  ntn?: string | null;
  strn?: string | null;
  customer_type?: string;
  credit_limit?: number;
  credit_days?: number;
  opening_balance?: number;
  area_id?: number | null;
  branch_id?: number | null;
  city?: string;
  address?: string | null;
  kyc_status?: string;
  is_active?: boolean;
}

export interface CustomerUpdatePayload {
  code?: string;
  business_name?: string;
  owner_name?: string | null;
  phone?: string;
  whatsapp_number?: string | null;
  email?: string | null;
  cnic?: string | null;
  ntn?: string | null;
  strn?: string | null;
  customer_type?: string;
  credit_limit?: number;
  credit_days?: number;
  opening_balance?: number;
  is_credit_blocked?: boolean;
  area_id?: number | null;
  branch_id?: number | null;
  city?: string;
  address?: string | null;
  kyc_status?: string;
  is_active?: boolean;
}

export interface CustomerPaymentPayload {
  amount: number;
  payment_method?: string;
  branch_id?: number | null;
  reference_number?: string | null;
  notes?: string | null;
}

export interface CustomerPaymentItem {
  id: number;
  tenant_id: number;
  customer_id: number;
  branch_id?: number | null;
  voucher_number: string;
  amount: number;
  payment_method: string;
  reference_number?: string | null;
  notes?: string | null;
  previous_balance: number;
  new_balance: number;
  received_by_id?: number | null;
  received_by_name?: string | null;
  customer_business_name?: string | null;
  customer_phone?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedCustomerPayments {
  items: CustomerPaymentItem[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface CustomerLedgerEntry {
  id: number;
  entry_type: "opening_balance" | "invoice" | "payment";
  date: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  payment_method?: string | null;
  notes?: string | null;
}

export interface CustomerLedgerSummary {
  opening_balance: number;
  total_debit: number;
  total_credit: number;
  closing_balance: number;
  credit_limit: number;
  is_credit_blocked: boolean;
}

export interface CustomerLedgerResponse {
  customer_id: number;
  customer_name: string;
  customer_code: string;
  customer_phone?: string | null;
  from_date?: string | null;
  to_date?: string | null;
  summary: CustomerLedgerSummary;
  entries: CustomerLedgerEntry[];
}

// ==========================================
// SUPPLIER TYPES & PAYLOADS
// ==========================================
export interface SupplierItem {
  id: number;
  tenant_id: number;
  code: string;
  company_name: string;
  contact_person?: string | null;
  phone: string;
  email?: string | null;
  ntn?: string | null;
  strn?: string | null;
  payment_terms_days: number;
  opening_balance: number;
  current_balance: number;
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_iban?: string | null;
  bank_branch?: string | null;
  city: string;
  address?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupplierStats {
  total_suppliers: number;
  total_payables: number;
  active_mills: number;
  bank_accounts_count: number;
}

export interface SupplierCreatePayload {
  code: string;
  company_name: string;
  contact_person?: string | null;
  phone: string;
  email?: string | null;
  ntn?: string | null;
  strn?: string | null;
  payment_terms_days?: number;
  opening_balance?: number;
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_iban?: string | null;
  bank_branch?: string | null;
  city?: string;
  address?: string | null;
  is_active?: boolean;
}

export interface SupplierUpdatePayload {
  code?: string;
  company_name?: string;
  contact_person?: string | null;
  phone?: string;
  email?: string | null;
  ntn?: string | null;
  strn?: string | null;
  payment_terms_days?: number;
  opening_balance?: number;
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_iban?: string | null;
  bank_branch?: string | null;
  city?: string;
  address?: string | null;
  is_active?: boolean;
}

export interface SupplierPaymentPayload {
  amount: number;
  payment_method?: string;
  branch_id?: number | null;
  reference_number?: string | null;
  notes?: string | null;
}

export interface SupplierPaymentItem {
  id: number;
  tenant_id: number;
  supplier_id: number;
  branch_id?: number | null;
  voucher_number: string;
  amount: number;
  payment_method: string;
  reference_number?: string | null;
  notes?: string | null;
  previous_balance: number;
  new_balance: number;
  paid_by_id?: number | null;
  paid_by_name?: string | null;
  supplier_company_name?: string | null;
  supplier_phone?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedSupplierPayments {
  items: SupplierPaymentItem[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface SupplierLedgerEntry {
  id: number;
  entry_type: "purchase" | "payment" | "opening_balance";
  date: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  payment_method?: string | null;
  notes?: string | null;
}

export interface SupplierLedgerSummary {
  opening_balance: number;
  total_purchases: number;
  total_paid: number;
  closing_balance: number;
  payment_terms_days: number;
}

export interface SupplierLedgerResponse {
  supplier_id: number;
  supplier_name: string;
  supplier_code: string;
  supplier_phone?: string | null;
  from_date?: string | null;
  to_date?: string | null;
  summary: SupplierLedgerSummary;
  entries: SupplierLedgerEntry[];
}

export interface PaginatedCustomersResponse {
  items: CustomerItem[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface PaginatedSuppliersResponse {
  items: SupplierItem[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface AgingBucketBreakdown {
  current: number;
  days_31_60: number;
  days_61_90: number;
  days_91_120: number;
  over_120: number;
  total: number;
}

export interface CustomerAgingItem {
  customer_id: number;
  code: string;
  business_name: string;
  owner_name?: string | null;
  phone: string;
  whatsapp_number?: string | null;
  area_name?: string | null;
  credit_limit: number;
  credit_days: number;
  is_credit_blocked: boolean;
  current_balance: number;
  total_receivable: number;
  aging: AgingBucketBreakdown;
  overdue_amount: number;
  oldest_unpaid_days: number;
  last_payment_date?: string | null;
  last_payment_amount?: number | null;
}

export interface CustomerAgingSummaryKPI {
  total_receivables: number;
  total_current: number;
  total_overdue: number;
  total_overdue_30_plus: number;
  total_overdue_60_plus: number;
  total_overdue_90_plus: number;
  days_sales_outstanding: number;
  total_customers_count: number;
  overdue_customers_count: number;
  high_risk_customers_count: number;
}

export interface CustomerAgingReportResponse {
  as_of_date: string;
  branch_id?: number | null;
  summary: CustomerAgingSummaryKPI;
  customers: CustomerAgingItem[];
}

export interface SupplierAgingItem {
  supplier_id: number;
  code: string;
  company_name: string;
  contact_person?: string | null;
  phone: string;
  payment_terms_days: number;
  current_balance: number;
  total_payable: number;
  aging: AgingBucketBreakdown;
  overdue_amount: number;
  oldest_unpaid_days: number;
  last_payment_date?: string | null;
  last_payment_amount?: number | null;
}

export interface SupplierAgingSummaryKPI {
  total_payables: number;
  total_current: number;
  total_overdue: number;
  days_payable_outstanding: number;
  total_suppliers_count: number;
  overdue_suppliers_count: number;
}

export interface SupplierAgingReportResponse {
  as_of_date: string;
  branch_id?: number | null;
  summary: SupplierAgingSummaryKPI;
  suppliers: SupplierAgingItem[];
}

// ==========================================
// SERVICE IMPLEMENTATION
// ==========================================
class PartyService {
  // ----------------------------------------
  // Delivery Areas
  // ----------------------------------------
  async listDeliveryAreas(): Promise<DeliveryAreaItem[]> {
    return apiClient<DeliveryAreaItem[]>(API_ENDPOINTS.TENANT.DELIVERY_AREAS);
  }

  async getDeliveryArea(id: number): Promise<DeliveryAreaItem> {
    return apiClient<DeliveryAreaItem>(API_ENDPOINTS.TENANT.DELIVERY_AREA_DETAIL(id));
  }

  async createDeliveryArea(payload: DeliveryAreaCreatePayload): Promise<DeliveryAreaItem> {
    const res = await apiClient<DeliveryAreaItem>(API_ENDPOINTS.TENANT.DELIVERY_AREAS, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    emitAppEvent("routes:changed", "created", res);
    return res;
  }

  async updateDeliveryArea(id: number, payload: DeliveryAreaUpdatePayload): Promise<DeliveryAreaItem> {
    const res = await apiClient<DeliveryAreaItem>(API_ENDPOINTS.TENANT.DELIVERY_AREA_DETAIL(id), {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    emitAppEvent("routes:changed", "updated", res);
    return res;
  }

  async deleteDeliveryArea(id: number): Promise<{ message: string }> {
    const res = await apiClient<{ message: string }>(API_ENDPOINTS.TENANT.DELIVERY_AREA_DETAIL(id), {
      method: "DELETE",
    });
    emitAppEvent("routes:changed", "deleted", { id });
    return res;
  }

  // ----------------------------------------
  // Customers
  // ----------------------------------------
  async getCustomerStats(): Promise<CustomerStats> {
    return apiClient<CustomerStats>(API_ENDPOINTS.TENANT.CUSTOMERS_STATS);
  }

  async listCustomers(params?: {
    search?: string;
    area_id?: number;
    customer_type?: string;
    is_active?: boolean;
    page?: number;
    size?: number;
  }): Promise<any> {
    return apiClient(API_ENDPOINTS.TENANT.CUSTOMERS, {
      params,
    });
  }

  async getCustomer(id: number): Promise<CustomerItem> {
    return apiClient<CustomerItem>(API_ENDPOINTS.TENANT.CUSTOMER_DETAIL(id));
  }

  async createCustomer(payload: CustomerCreatePayload): Promise<CustomerItem> {
    const res = await apiClient<CustomerItem>(API_ENDPOINTS.TENANT.CUSTOMERS, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    emitAppEvent("customers:changed", "created", res);
    return res;
  }

  async updateCustomer(id: number, payload: CustomerUpdatePayload): Promise<CustomerItem> {
    const res = await apiClient<CustomerItem>(API_ENDPOINTS.TENANT.CUSTOMER_DETAIL(id), {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    emitAppEvent("customers:changed", "updated", res);
    return res;
  }

  async deleteCustomer(id: number): Promise<{ message: string }> {
    const res = await apiClient<{ message: string }>(API_ENDPOINTS.TENANT.CUSTOMER_DETAIL(id), {
      method: "DELETE",
    });
    emitAppEvent("customers:changed", "deleted", { id });
    return res;
  }

  // ----------------------------------------
  // Customer Payments / Udhaar Wasooli
  // ----------------------------------------
  async recordCustomerPayment(
    customerId: number,
    payload: CustomerPaymentPayload
  ): Promise<CustomerPaymentItem> {
    const res = await apiClient<CustomerPaymentItem>(
      API_ENDPOINTS.TENANT.CUSTOMER_PAYMENTS(customerId),
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
    emitAppEvent("customers:changed", "updated", res);
    emitAppEvent("invoices:changed", "updated", res);
    return res;
  }

  async getCustomerPayments(
    customerId: number,
    params?: { page?: number; size?: number }
  ): Promise<PaginatedCustomerPayments> {
    return apiClient<PaginatedCustomerPayments>(
      API_ENDPOINTS.TENANT.CUSTOMER_PAYMENTS(customerId),
      { params }
    );
  }

  async listAllCustomerPayments(
    params?: { customer_id?: number; page?: number; size?: number }
  ): Promise<PaginatedCustomerPayments> {
    return apiClient<PaginatedCustomerPayments>(
      API_ENDPOINTS.TENANT.ALL_CUSTOMER_PAYMENTS,
      { params }
    );
  }

  async getCustomerLedger(
    customerId: number,
    params?: { from_date?: string; to_date?: string }
  ): Promise<CustomerLedgerResponse> {
    return apiClient<CustomerLedgerResponse>(
      API_ENDPOINTS.TENANT.CUSTOMER_LEDGER(customerId),
      { params }
    );
  }

  // ----------------------------------------
  // Suppliers
  // ----------------------------------------
  async getSupplierStats(): Promise<SupplierStats> {
    return apiClient<SupplierStats>(API_ENDPOINTS.TENANT.SUPPLIERS_STATS);
  }

  async listSuppliers(params?: {
    search?: string;
    is_active?: boolean;
    page?: number;
    size?: number;
  }): Promise<any> {
    return apiClient(API_ENDPOINTS.TENANT.SUPPLIERS, {
      params,
    });
  }

  async getSupplier(id: number): Promise<SupplierItem> {
    return apiClient<SupplierItem>(API_ENDPOINTS.TENANT.SUPPLIER_DETAIL(id));
  }

  async createSupplier(payload: SupplierCreatePayload): Promise<SupplierItem> {
    const res = await apiClient<SupplierItem>(API_ENDPOINTS.TENANT.SUPPLIERS, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    emitAppEvent("suppliers:changed", "created", res);
    return res;
  }

  async updateSupplier(id: number, payload: SupplierUpdatePayload): Promise<SupplierItem> {
    const res = await apiClient<SupplierItem>(API_ENDPOINTS.TENANT.SUPPLIER_DETAIL(id), {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    emitAppEvent("suppliers:changed", "updated", res);
    return res;
  }

  async deleteSupplier(id: number): Promise<{ message: string }> {
    const res = await apiClient<{ message: string }>(API_ENDPOINTS.TENANT.SUPPLIER_DETAIL(id), {
      method: "DELETE",
    });
    emitAppEvent("suppliers:changed", "deleted", { id });
    return res;
  }

  // ----------------------------------------
  // Supplier Payments (CPV) & Ledger
  // ----------------------------------------
  async recordSupplierPayment(
    supplierId: number,
    payload: SupplierPaymentPayload
  ): Promise<SupplierPaymentItem> {
    const res = await apiClient<SupplierPaymentItem>(
      API_ENDPOINTS.TENANT.SUPPLIER_PAYMENTS(supplierId),
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
    emitAppEvent("suppliers:changed", "updated", res);
    return res;
  }

  async getSupplierPayments(
    supplierId: number,
    params?: { page?: number; size?: number }
  ): Promise<PaginatedSupplierPayments> {
    return apiClient<PaginatedSupplierPayments>(
      API_ENDPOINTS.TENANT.SUPPLIER_PAYMENTS(supplierId),
      { params }
    );
  }

  async listAllSupplierPayments(
    params?: { supplier_id?: number; page?: number; size?: number }
  ): Promise<PaginatedSupplierPayments> {
    return apiClient<PaginatedSupplierPayments>(
      API_ENDPOINTS.TENANT.ALL_SUPPLIER_PAYMENTS,
      { params }
    );
  }

  async getSupplierLedger(
    supplierId: number,
    params?: { from_date?: string; to_date?: string }
  ): Promise<SupplierLedgerResponse> {
    return apiClient<SupplierLedgerResponse>(
      API_ENDPOINTS.TENANT.SUPPLIER_LEDGER(supplierId),
      { params }
    );
  }

  async getReceivablesAging(params?: {
    branch_id?: number;
    as_of_date?: string;
    search?: string;
    filter_type?: "all" | "overdue" | "high_risk";
  }): Promise<CustomerAgingReportResponse> {
    return apiClient<CustomerAgingReportResponse>(
      API_ENDPOINTS.TENANT.AGING_RECEIVABLES,
      { params }
    );
  }

  async getPayablesAging(params?: {
    branch_id?: number;
    as_of_date?: string;
    search?: string;
    filter_type?: "all" | "overdue";
  }): Promise<SupplierAgingReportResponse> {
    return apiClient<SupplierAgingReportResponse>(
      API_ENDPOINTS.TENANT.AGING_PAYABLES,
      { params }
    );
  }

  async toggleCustomerCreditBlock(customerId: number): Promise<CustomerItem> {
    const res = await apiClient<CustomerItem>(
      API_ENDPOINTS.TENANT.CUSTOMER_TOGGLE_CREDIT_BLOCK(customerId),
      { method: "POST" }
    );
    emitAppEvent("customers:changed", "updated", res);
    return res;
  }
}

export const partyService = new PartyService();
