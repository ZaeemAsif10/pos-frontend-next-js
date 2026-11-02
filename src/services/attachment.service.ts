import { env } from "@/config/env";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export interface AttachmentItem {
  id: number;
  tenant_id: number;
  attachable_type: string;
  attachable_id: number;
  file_name: string;
  file_path: string;
  file_type?: string | null;
  file_size: number;
  is_primary: boolean;
  title?: string | null;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export const attachmentService = {
  /**
   * Upload an attachment or image linked polymorphically to an entity.
   */
  async uploadAttachment(formData: FormData): Promise<AttachmentItem> {
    const baseUrl = env.API_URL.replace(/\/$/, "");
    const url = `${baseUrl}${API_ENDPOINTS.TENANT.ATTACHMENT_UPLOAD}`;

    const headers: Record<string, string> = {};
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("paperless_access_token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!res.ok) {
      let errDetail = "Failed to upload file";
      try {
        const errJson = await res.json();
        errDetail = errJson.detail || errDetail;
      } catch {}
      throw new Error(errDetail);
    }

    return await res.json();
  },

  /**
   * List attachments for any entity (e.g. attachable_type="Product", attachable_id=5)
   */
  async listAttachments(params?: {
    attachable_type?: string;
    attachable_id?: number;
  }): Promise<AttachmentItem[]> {
    return apiClient<AttachmentItem[]>(API_ENDPOINTS.TENANT.ATTACHMENTS, {
      params,
    });
  },

  /**
   * Delete an attachment by ID
   */
  async deleteAttachment(id: number): Promise<{ message: string }> {
    return apiClient<{ message: string }>(
      API_ENDPOINTS.TENANT.ATTACHMENT_DETAIL(id),
      {
        method: "DELETE",
      }
    );
  },
};
