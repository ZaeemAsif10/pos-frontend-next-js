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
}

export const partyService = new PartyService();
