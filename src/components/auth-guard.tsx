"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { IconLoader2, IconSparkles, IconShieldLock, IconArrowLeft } from "@tabler/icons-react";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Granular route permissions mapping
const ROUTE_PERMISSIONS: Record<
  string,
  {
    name: string;
    requiredPermissions: string[];
    allowedRoles?: string[];
    superadminOnly?: boolean;
  }
> = {
  "/admin": {
    name: "Super Admin Control Center",
    requiredPermissions: [],
    superadminOnly: true,
  },
  "/admin/plans": {
    name: "Subscription Plans Management",
    requiredPermissions: [],
    superadminOnly: true,
  },
  "/admin/tenants": {
    name: "Business Tenants Directory",
    requiredPermissions: [],
    superadminOnly: true,
  },
  "/team": {
    name: "Staff & Users Management",
    requiredPermissions: ["users:view"],
    allowedRoles: ["Admin", "Owner"],
  },
  "/roles": {
    name: "Roles & Permissions Matrix",
    requiredPermissions: ["roles:view"],
    allowedRoles: ["Admin", "Owner"],
  },
  "/branches": {
    name: "Shops & Branches Network",
    requiredPermissions: ["branches:view"],
    allowedRoles: ["Admin", "Owner"],
  },
  "/categories": {
    name: "Category Management & Taxonomy",
    requiredPermissions: ["categories:view"],
    allowedRoles: ["Admin", "Owner"],
  },
  "/brands": {
    name: "Brands & Principals Directory",
    requiredPermissions: ["brands:view"],
    allowedRoles: ["Admin", "Owner"],
  },
  "/products": {
    name: "Products & Catalogue Master",
    requiredPermissions: ["products:view"],
    allowedRoles: ["Admin", "Owner"],
  },
  "/customers": {
    name: "Customer Accounts & Khata",
    requiredPermissions: ["customers:view"],
    allowedRoles: ["Admin", "Owner"],
  },
  "/suppliers": {
    name: "Suppliers & Vendor Accounts",
    requiredPermissions: ["suppliers:view"],
    allowedRoles: ["Admin", "Owner"],
  },
  "/routes": {
    name: "Delivery Areas & Sectors",
    requiredPermissions: ["delivery_areas:view"],
    allowedRoles: ["Admin", "Owner"],
  },
  "/purchases": {
    name: "Purchases & Goods Received (GRN)",
    requiredPermissions: ["purchases:view"],
    allowedRoles: ["Admin", "Owner"],
  },
  "/inventory": {
    name: "Live Multi-Branch Inventory",
    requiredPermissions: ["inventory:view"],
    allowedRoles: ["Admin", "Owner"],
  },
  "/pos": {
    name: "Point of Sale (POS) Counter",
    requiredPermissions: [],
    allowedRoles: ["Admin", "Owner", "Cashier"],
  },
  "/invoices": {
    name: "Sales Invoices & FBR Fiscal Records",
    requiredPermissions: [],
    allowedRoles: ["Admin", "Owner", "Salesman"],
  },
};





export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, tenant, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [mounted, isAuthenticated, isLoading, router]);

  // Prevent SSR / hydration mismatch until client has mounted and hydrated auth state from localStorage
  if (!mounted) {
    return <>{children}</>;
  }

  if (isLoading || (isAuthenticated && !user)) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-3 bg-background">
        <div className="flex aspect-square size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md animate-pulse">
          <IconSparkles className="size-6" />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <IconLoader2 className="size-4 animate-spin" />
          <span>Loading workspace…</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Route-level permission & role verification
  const matchingKey = Object.keys(ROUTE_PERMISSIONS).find(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );

  if (matchingKey) {
    const config = ROUTE_PERMISSIONS[matchingKey];

    // Check SuperAdmin restriction
    if (config.superadminOnly && !user?.is_superadmin) {
      return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center p-4">
          <Card className="max-w-md w-full text-center border-destructive/30 shadow-lg">
            <CardHeader className="pb-3">
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <IconShieldLock className="h-8 w-8" />
              </div>
              <CardTitle className="text-xl font-bold">Access Restricted</CardTitle>
              <CardDescription className="text-sm">
                Super Administrator privileges required
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <p className="text-xs text-muted-foreground">
                You are attempting to access <strong>{config.name}</strong> ({pathname}). This area is strictly reserved for platform administrators.
              </p>
              <Button asChild className="w-full gap-2">
                <Link href="/dashboard">
                  <IconArrowLeft className="h-4 w-4" />
                  Return to Dashboard
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    // If not superadmin, check tenant-level role and permissions
    if (!user?.is_superadmin) {
      const userRole = tenant?.role_name || "";
      const userPermissions = tenant?.permissions || [];

      const roleAllowed = config.allowedRoles?.some(
        (r) => r.toLowerCase() === userRole.toLowerCase()
      );

      const permissionAllowed =
        userPermissions.includes("*") ||
        config.requiredPermissions.some((p) => userPermissions.includes(p));

      const hasAccess = roleAllowed || permissionAllowed;

      if (!hasAccess) {
        return (
          <div className="flex min-h-[70vh] flex-col items-center justify-center p-4">
            <Card className="max-w-md w-full text-center border-amber-500/30 shadow-lg">
              <CardHeader className="pb-3">
                <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
                  <IconShieldLock className="h-8 w-8" />
                </div>
                <CardTitle className="text-xl font-bold">Access Denied (403)</CardTitle>
                <CardDescription className="text-sm">
                  Insufficient business permissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <p className="text-xs text-muted-foreground">
                  Your current assigned role (<strong>{userRole || "Staff"}</strong>) does not have authorization to view or manage <strong>{config.name}</strong>.
                </p>
                <p className="text-[11px] text-muted-foreground/75">
                  Contact your business owner or administrator to request access.
                </p>
                <Button asChild className="w-full gap-2">
                  <Link href="/dashboard">
                    <IconArrowLeft className="h-4 w-4" />
                    Return to Dashboard
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        );
      }
    }
  }

  return <>{children}</>;
}
