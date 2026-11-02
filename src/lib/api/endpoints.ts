/**
 * Centralized backend API endpoint paths.
 */
export const API_ENDPOINTS = {
  HEALTH: "/health",
  DOCS: "/docs",
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    VERIFY_REGISTRATION_OTP: "/auth/verify-registration-otp",
    RESEND_OTP: "/auth/resend-otp",
    ME: "/auth/me",
    REFRESH: "/auth/refresh",
    LOGOUT: "/auth/logout",
  },
  ADMIN: {
    TENANTS: "/admin/tenants",
    TENANT_STATUS: (id: number) => `/admin/tenants/${id}/status`,
    PLANS: "/admin/plans",
    PLAN_DETAIL: (id: number) => `/admin/plans/${id}`,
  },
  PLANS: {
    LIST: "/plans",
  },
  TENANT: {
    USERS: "/tenant/users",
    ROLES: "/tenant/roles",
    USER_DETAIL: (id: number) => `/tenant/users/${id}`,
    PERMISSIONS: "/tenant/permissions",
    PERMISSION_DETAIL: (id: number) => `/tenant/permissions/${id}`,
    ROLES_MATRIX: "/tenant/roles-matrix",
    ROLE_DETAIL: (id: number) => `/tenant/roles/${id}`,
    BRANCHES: "/tenant/branches",
    BRANCH_DETAIL: (id: number) => `/tenant/branches/${id}`,
    BRANCH_SET_MAIN: (id: number) => `/tenant/branches/${id}/set-main`,
    QUOTAS: "/tenant/quotas",
    PRODUCTS: "/tenant/products",
    PRODUCT_DETAIL: (id: number) => `/tenant/products/${id}`,
    PRODUCT_BRANCH_STOCK: (prodId: number, branchId: number) =>
      `/tenant/products/${prodId}/branches/${branchId}/stock`,
    CATEGORIES: "/tenant/categories",
    CATEGORY_DETAIL: (id: number) => `/tenant/categories/${id}`,
    BRANDS: "/tenant/brands",
    BRAND_DETAIL: (id: number) => `/tenant/brands/${id}`,
    DELIVERY_AREAS: "/tenant/delivery-areas",
    DELIVERY_AREA_DETAIL: (id: number) => `/tenant/delivery-areas/${id}`,
    CUSTOMERS: "/tenant/customers",
    CUSTOMERS_STATS: "/tenant/customers/stats",
    CUSTOMER_DETAIL: (id: number) => `/tenant/customers/${id}`,
    SUPPLIERS: "/tenant/suppliers",
    SUPPLIERS_STATS: "/tenant/suppliers/stats",
    SUPPLIER_DETAIL: (id: number) => `/tenant/suppliers/${id}`,
    PURCHASES: "/tenant/purchases",
    PURCHASES_STATS: "/tenant/purchases/stats",
    PURCHASE_DETAIL: (id: number) => `/tenant/purchases/${id}`,
    INVENTORY: "/tenant/inventory",
    INVENTORY_LEDGER: (productId: number) => `/tenant/inventory/${productId}/ledger`,
    STOCK_TRANSFERS: "/tenant/stock/transfers",
    STOCK_ADJUSTMENTS: "/tenant/stock/adjustments",
    SALES_CHECKOUT: "/tenant/sales/checkout",
    SALES_INVOICES: "/tenant/sales/invoices",
    SALES_INVOICE_DETAIL: (id: number) => `/tenant/sales/invoices/${id}`,
    SALES_SUMMARY: "/tenant/sales/summary",
    POS_SHIFTS_OPEN: "/tenant/sales/shifts/open",
    POS_SHIFTS_CLOSE: (id: number) => `/tenant/sales/shifts/${id}/close`,
    POS_SHIFTS_CURRENT: "/tenant/sales/shifts/current",
    ATTACHMENTS: "/tenant/attachments",
    ATTACHMENT_UPLOAD: "/tenant/attachments/upload",
    ATTACHMENT_DETAIL: (id: number) => `/tenant/attachments/${id}`,
  },
} as const;





