import { sidebarNavigation } from "@/config/sidebar";

export const APP_NAME = "Paperless Business OS";

/**
 * Static route overrides for routes not explicitly in the sidebar navigation
 * (e.g. auth pages, settings, subpaths, dynamic flows).
 */
const STATIC_ROUTE_TITLES: Record<string, string> = {
  "/": "Paperless OS · Business OS for Pakistan",
  "/login": "Sign In",
  "/register": "Register Business",
  "/forgot-password": "Forgot Password",
  "/reset-password": "Reset Password",
  "/verify-otp": "Verify OTP",
  "/lock": "Screen Locked",
  "/pricing": "Pricing Plans",
  "/settings": "Settings",
  "/profile": "User Profile",
  "/notifications": "Notifications",
  "/activity": "Activity Log",
  "/reports": "Reports & Analytics",
  "/orders": "Orders",
  "/orders/new": "Create Order",
  "/invoices/new": "New Sales Invoice",
  "/daybook": "Day Book (Roznamcha)",
  "/accounting/mappings": "Account Mappings & Posting Settings",
  "/accounting/accounts": "Chart of Accounts (COA)",
  "/accounting/journal": "General Journal Vouchers (JV)",
  "/accounting/expenses": "Expense Vouchers (CPV)",
  "/accounting/ledger": "Trial Balance & General Ledger",
  "/accounting/financial-statements": "Financial Statements (P&L & Balance Sheet)",
  "/accounting/reconciliation": "Bank Reconciliation Statement (BRS)",
  "/products/new": "Add Product",
  "/customers/new": "Add Customer",
  "/cart": "Shopping Cart",
  "/checkout": "Checkout",
  "/developers": "Developers & API",
  "/help": "Help & Support",
  "/discounts": "Discounts & Offers",
  "/shipping": "Shipping & Logistics",
  "/storefront": "Online Storefront",
  "/projects": "Projects",
  "/contacts": "Contacts Directory",
};

/**
 * Standard business acronyms preserved in uppercase during automatic formatting.
 */
const ACRONYMS: Record<string, string> = {
  pos: "POS",
  fbr: "FBR",
  crm: "CRM",
  hr: "HR",
  api: "API",
  otp: "OTP",
  faq: "FAQ",
  grn: "GRN",
  sku: "SKU",
  erp: "ERP",
};

/**
 * Build a lookup map of route URL -> Sidebar item title.
 * e.g. "/suppliers" -> "Suppliers", "/products" -> "Products", "/routes" -> "Delivery Areas"
 */
function buildSidebarRouteMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const group of sidebarNavigation) {
    for (const item of group.items) {
      if (item.url) {
        map.set(item.url, item.title);
      }
      if (item.items) {
        for (const sub of item.items) {
          if (sub.url) {
            map.set(sub.url, sub.title);
          }
        }
      }
    }
  }
  return map;
}

let cachedSidebarMap: Map<string, string> | null = null;
function getSidebarMap(): Map<string, string> {
  if (!cachedSidebarMap) {
    cachedSidebarMap = buildSidebarRouteMap();
  }
  return cachedSidebarMap;
}

/**
 * Cleanly formats a slug or segment (e.g. "delivery-areas" -> "Delivery Areas", "pos" -> "POS")
 */
function formatSegment(segment: string): string {
  const lower = segment.toLowerCase();
  if (ACRONYMS[lower]) return ACRONYMS[lower];
  return segment
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Resolves the tab title dynamically for any given pathname.
 * 1. Checks exact static route dictionary
 * 2. Checks exact sidebar navigation tab title
 * 3. Handles subpaths like /products/new or /customers/123/edit
 * 4. Fallbacks to clean breadcrumb-style capitalization
 */
export function resolvePageTitle(pathname: string): string {
  if (!pathname || pathname === "/") {
    return STATIC_ROUTE_TITLES["/"] ?? APP_NAME;
  }

  // Normalize path by removing trailing slash (unless root)
  const cleanPath =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  // 1. Exact static route match
  if (STATIC_ROUTE_TITLES[cleanPath]) {
    return STATIC_ROUTE_TITLES[cleanPath];
  }

  // 2. Exact sidebar navigation match
  const sidebarMap = getSidebarMap();
  const sidebarTitle = sidebarMap.get(cleanPath);
  if (sidebarTitle) {
    return sidebarTitle;
  }

  // 3. Sub-route analysis (e.g. /products/new, /products/123, /invoices/new)
  const segments = cleanPath.split("/").filter(Boolean);
  if (segments.length === 0) return APP_NAME;

  const parentPath = "/" + segments[0];
  const parentTitle = sidebarMap.get(parentPath);

  if (segments.length === 2 && segments[1] === "new" && parentTitle) {
    return `New ${parentTitle}`;
  }

  if (segments.length >= 2) {
    const last = segments[segments.length - 1];
    if (last === "edit" && parentTitle) {
      return `Edit ${parentTitle}`;
    }
    const isId =
      /^[0-9]+$/.test(last) ||
      /^[0-9a-fA-F-]{8,}$/.test(last) ||
      last.startsWith("item_");
    if (isId && parentTitle) {
      return `${parentTitle} Details`;
    }
  }

  // Check composite paths like /admin/tenants
  if (segments.length >= 2) {
    const compositePath = `/${segments[0]}/${segments[1]}`;
    const compositeTitle = sidebarMap.get(compositePath);
    if (compositeTitle) {
      return compositeTitle;
    }
  }

  // 4. Intelligent fallback from last segment
  const lastSegment = segments[segments.length - 1];
  return formatSegment(lastSegment);
}

/**
 * Formats full document title for browser window tab:
 * e.g. "Suppliers · Paperless Business OS"
 */
export function formatFullTitle(pageTitle?: string): string {
  if (!pageTitle || pageTitle === APP_NAME) {
    return APP_NAME;
  }
  if (pageTitle.includes(APP_NAME)) {
    return pageTitle;
  }
  return `${pageTitle} · ${APP_NAME}`;
}
