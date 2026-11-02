import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { emitAppEvent } from "@/lib/events";

export type BranchType = "retail_shop" | "warehouse_godown" | "wholesale_depot";

export interface BranchItem {
  id: number;
  tenant_id: number;
  name: string;
  code: string;
  type: BranchType;
  phone: string;
  email?: string | null;
  city: string;
  address?: string | null;
  fbr_pos_id?: string | null;
  is_main: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BranchQuotaUsage {
  used: number;
  max: number;
  is_unlimited: boolean;
  is_reached: boolean;
  plan_name: string;
  plan_slug: string;
}

export interface BranchListResponse {
  branches: BranchItem[];
  quota: BranchQuotaUsage;
  total: number;
}

export interface BranchCreatePayload {
  name: string;
  code: string;
  type?: BranchType;
  phone: string;
  email?: string | null;
  city: string;
  address?: string | null;
  fbr_pos_id?: string | null;
  is_main?: boolean;
  is_active?: boolean;
}

export interface BranchUpdatePayload {
  name?: string;
  code?: string;
  type?: BranchType;
  phone?: string;
  email?: string | null;
  city?: string;
  address?: string | null;
  fbr_pos_id?: string | null;
  is_active?: boolean;
  is_main?: boolean;
}

export const branchService = {
  /**
   * List all branches / shops / godowns for the authenticated business.
   */
  async listBranches(params?: {
    search?: string;
    city?: string;
    branch_type?: BranchType;
    is_active?: boolean;
  }): Promise<BranchListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append("search", params.search);
    if (params?.city) searchParams.append("city", params.city);
    if (params?.branch_type) searchParams.append("branch_type", params.branch_type);
    if (params?.is_active !== undefined) searchParams.append("is_active", String(params.is_active));

    const qs = searchParams.toString();
    const url = qs ? `${API_ENDPOINTS.TENANT.BRANCHES}?${qs}` : API_ENDPOINTS.TENANT.BRANCHES;

    return apiClient<BranchListResponse>(url, {
      method: "GET",
    });
  },

  /**
   * Get specific branch details by ID.
   */
  async getBranch(branchId: number): Promise<BranchItem> {
    return apiClient<BranchItem>(API_ENDPOINTS.TENANT.BRANCH_DETAIL(branchId), {
      method: "GET",
    });
  },

  /**
   * Create a new shop or warehouse location (enforces plan quota).
   */
  async createBranch(payload: BranchCreatePayload): Promise<BranchItem> {
    const res = await apiClient<BranchItem>(API_ENDPOINTS.TENANT.BRANCHES, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    emitAppEvent("branches:changed", "created", res);
    return res;
  },

  /**
   * Update an existing branch.
   */
  async updateBranch(branchId: number, payload: BranchUpdatePayload): Promise<BranchItem> {
    const res = await apiClient<BranchItem>(API_ENDPOINTS.TENANT.BRANCH_DETAIL(branchId), {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    emitAppEvent("branches:changed", "updated", res);
    return res;
  },

  /**
   * Mark this branch as the primary headquarters.
   */
  async setMainBranch(branchId: number): Promise<BranchItem> {
    const res = await apiClient<BranchItem>(API_ENDPOINTS.TENANT.BRANCH_SET_MAIN(branchId), {
      method: "POST",
    });
    emitAppEvent("branches:changed", "updated", res);
    return res;
  },

  /**
   * Permanently delete a branch.
   */
  async deleteBranch(branchId: number): Promise<{ message: string }> {
    const res = await apiClient<{ message: string }>(API_ENDPOINTS.TENANT.BRANCH_DETAIL(branchId), {
      method: "DELETE",
    });
    emitAppEvent("branches:changed", "deleted", { id: branchId });
    return res;
  },
};
