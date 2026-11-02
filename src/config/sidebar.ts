import {
  IconLayoutDashboard,
  IconSparkles,
  IconRocket,
  IconWorld,
  IconBuildingStore,
  IconReceipt2,
  IconUsers,
  IconShieldLock,
  IconBox,
  IconTag,
  IconBuildingFactory2,
  IconUserHeart,
  IconTruckDelivery,
  IconRoute,
  IconReceipt,
  IconPackage,
  IconDeviceDesktopAnalytics,
  IconFileInvoice,
  type Icon,
} from "@tabler/icons-react";



export type Workspace = {
  name: string;
  plan: string;
  icon: Icon;
};

export const workspaces: Workspace[] = [
  { name: "Paperless OS", plan: "Enterprise", icon: IconSparkles },
  { name: "Lahore Central", plan: "Main Warehouse", icon: IconRocket },
  { name: "Karachi Hub", plan: "Distribution Hub", icon: IconWorld },
];

export type NavChild = {
  title: string;
  url: string;
};

export type NavItem = {
  title: string;
  url?: string;
  icon?: Icon;
  badge?: string;
  items?: NavChild[];
  permissions?: string[]; // Allowed permissions (e.g. ["users:view", "users:manage"])
  roles?: string[]; // Allowed tenant roles (e.g. ["Admin"])
  superadminOnly?: boolean;
};

export type SidebarGroup = {
  label: string;
  items: NavItem[];
  superadminOnly?: boolean;
};

/**
 * Dedicated Sidebar Navigation Configuration.
 * Manage all sidebar tabs, groups, and sub-menus here independently.
 */
export const sidebarNavigation: SidebarGroup[] = [
  {
    label: "Dashboards",
    items: [
      { title: "Overview", url: "/dashboard", icon: IconLayoutDashboard },
    ],
  },
  {
    label: "Organization",
    items: [
      {
        title: "Category",
        url: "/categories",
        icon: IconTag,
        permissions: ["categories:view", "categories:create", "categories:edit", "categories:delete"],
        roles: ["Admin", "Owner"],
      },
      {
        title: "Brands",
        url: "/brands",
        icon: IconBuildingFactory2,
        permissions: ["brands:view", "brands:create", "brands:edit", "brands:delete"],
        roles: ["Admin", "Owner"],
      },
      {
        title: "Products",
        url: "/products",
        icon: IconBox,
        permissions: ["products:view", "products:create", "products:edit", "products:delete"],
        roles: ["Admin", "Owner"],
      },
      {
        title: "Customers",
        url: "/customers",
        icon: IconUserHeart,
        permissions: ["customers:view", "customers:create", "customers:edit", "customers:delete"],
        roles: ["Admin", "Owner"],
      },
      {
        title: "Suppliers",
        url: "/suppliers",
        icon: IconTruckDelivery,
        permissions: ["suppliers:view", "suppliers:create", "suppliers:edit", "suppliers:delete"],
        roles: ["Admin", "Owner"],
      },
      {
        title: "Delivery Areas",
        url: "/routes",
        icon: IconRoute,
        permissions: ["delivery_areas:view", "delivery_areas:create", "delivery_areas:edit", "delivery_areas:delete"],
        roles: ["Admin", "Owner"],
      },
      {
        title: "Shops & Branches",
        url: "/branches",
        icon: IconBuildingStore,
        permissions: ["branches:view", "branches:create", "branches:edit", "branches:delete"],
        roles: ["Admin", "Owner"],
      },
      {
        title: "Users",
        url: "/team",
        icon: IconUsers,
        permissions: ["users:view", "users:create", "users:edit", "users:delete"],
        roles: ["Admin", "Owner"],
      },
      {
        title: "Roles & Permissions",
        url: "/roles",
        icon: IconShieldLock,
        permissions: ["roles:view", "roles:create", "roles:edit", "roles:delete"],
        roles: ["Admin", "Owner"],
      },
    ],
  },

  {
    label: "Sales & Invoicing",
    items: [
      {
        title: "POS Counter",
        url: "/pos",
        icon: IconDeviceDesktopAnalytics,
        permissions: ["sales:view", "sales:create"],
        roles: ["Admin", "Owner"],
      },
      {
        title: "Sales Invoices",
        url: "/invoices",
        icon: IconFileInvoice,
        permissions: ["sales:view", "sales:create"],
        roles: ["Admin", "Owner"],
      },
    ],
  },
  {
    label: "Stock & Purchases",
    items: [
      {
        title: "Purchases & GRN",
        url: "/purchases",
        icon: IconReceipt,
        permissions: ["purchases:view", "purchases:create", "purchases:edit", "purchases:delete"],
        roles: ["Admin", "Owner"],
      },
      {
        title: "Live Inventory",
        url: "/inventory",
        icon: IconPackage,
        permissions: ["inventory:view", "inventory:adjust"],
        roles: ["Admin", "Owner"],
      },
    ],
  },

  {
    label: "Super Admin",
    superadminOnly: true,
    items: [
      { title: "Businesses", url: "/admin/tenants", icon: IconBuildingStore },
      { title: "Subscription Plans", url: "/admin/plans", icon: IconReceipt2 },
    ],
  },
];



